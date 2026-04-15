import axios from 'axios';
import {
  addOverride,
  listRecentScrapeJobs,
  listSources,
  listZoneTitles,
  setSourceEnabled,
  upsertTitlesAndLinks
} from '../db/repositories/contentRepository.js';
import { fetchTrendingMovies, fetchTrendingSeries } from './connectors/justwatchConnector.js';
import { fetchTrendingGames } from './connectors/gamesConnector.js';
import { buildGameLinks, buildMovieOrSeriesLinks } from './connectors/linkBuilder.js';

const MEDIA_VALIDATION_TTL_MS = 20 * 60 * 1000;
const MEDIA_VALIDATION_CONCURRENCY = 8;
const mediaValidationCache = new Map();

function cleanQueryText(value = '') {
  return String(value).replace(/[^\w\s-]/g, ' ').replace(/\s+/g, ' ').trim();
}

function uniqueNonEmpty(values = []) {
  return [...new Set(values.filter(Boolean))];
}

function posterToBackdrop(posterUrl = '') {
  if (!posterUrl) return '';
  return posterUrl.replace(/\/s\d+\//i, '/s1920/');
}

function buildMedia(zone, title, posterUrl) {
  const safeTitle = cleanQueryText(title || 'chill zone');
  const zoneHint = zone === 'games' ? 'gameplay' : zone === 'series' ? 'tv series' : 'movie';
  const trailerQuery = `${safeTitle} ${zoneHint} official trailer`;
  const clipsQuery = `${safeTitle} ${zoneHint} clips`;

  const youtubeEmbeds = uniqueNonEmpty([
    `https://www.youtube.com/embed?listType=search&list=${encodeURIComponent(trailerQuery)}`,
    `https://www.youtube.com/embed?listType=search&list=${encodeURIComponent(clipsQuery)}`
  ]);

  const backdropImages = uniqueNonEmpty([
    posterToBackdrop(posterUrl),
    `https://source.unsplash.com/1600x900/?${encodeURIComponent(`${safeTitle} ${zoneHint}`)}&sig=1`,
    `https://source.unsplash.com/1600x900/?${encodeURIComponent(`${safeTitle} cinematic`)}&sig=2`
  ]);

  return {
    youtubeEmbeds,
    backdropImages
  };
}

function buildFallbackMedia(zone, title, posterUrl) {
  const safeTitle = cleanQueryText(title || 'chill zone');
  const zoneHint = zone === 'games' ? 'gameplay' : zone === 'series' ? 'tv series' : 'movie';
  const youtubeEmbeds = uniqueNonEmpty([
    `https://www.youtube.com/embed?listType=search&list=${encodeURIComponent(`${safeTitle} ${zoneHint}`)}`,
    'https://www.youtube.com/embed?listType=search&list=latest+trailers'
  ]);
  const backdropImages = uniqueNonEmpty([
    posterToBackdrop(posterUrl),
    `https://picsum.photos/seed/${encodeURIComponent(`${zone}-${safeTitle}-bg-1`)}/1600/900`,
    `https://picsum.photos/seed/${encodeURIComponent(`${zone}-${safeTitle}-bg-2`)}/1600/900`
  ]);
  return { youtubeEmbeds, backdropImages };
}

function getCachedValidation(url) {
  const cached = mediaValidationCache.get(url);
  if (!cached) return null;
  if (Date.now() - cached.checkedAt > MEDIA_VALIDATION_TTL_MS) {
    mediaValidationCache.delete(url);
    return null;
  }
  return cached.ok;
}

async function checkUrlReachable(url) {
  try {
    const head = await axios.head(url, {
      timeout: 4000,
      maxRedirects: 5,
      validateStatus: () => true
    });
    if (head.status >= 200 && head.status < 400) return true;
  } catch {
    // some providers block HEAD; GET fallback below
  }

  try {
    const get = await axios.get(url, {
      timeout: 5000,
      maxRedirects: 5,
      responseType: 'stream',
      validateStatus: () => true
    });
    if (get.data?.destroy) get.data.destroy();
    return get.status >= 200 && get.status < 400;
  } catch {
    return false;
  }
}

async function runWithConcurrency(values, worker, limit = 8) {
  const results = new Array(values.length);
  let cursor = 0;

  async function runner() {
    while (cursor < values.length) {
      const i = cursor;
      cursor += 1;
      results[i] = await worker(values[i], i);
    }
  }

  const workers = Array.from({ length: Math.min(limit, values.length) }, () => runner());
  await Promise.all(workers);
  return results;
}

async function validateUrls(urls) {
  const unique = uniqueNonEmpty(urls);
  const result = new Map();
  const uncached = [];

  for (const url of unique) {
    const cached = getCachedValidation(url);
    if (cached === null) uncached.push(url);
    else result.set(url, cached);
  }

  if (uncached.length) {
    const checks = await runWithConcurrency(
      uncached,
      async (url) => {
        const ok = await checkUrlReachable(url);
        mediaValidationCache.set(url, { ok, checkedAt: Date.now() });
        return { url, ok };
      },
      MEDIA_VALIDATION_CONCURRENCY
    );
    for (const row of checks) result.set(row.url, row.ok);
  }

  return result;
}

function toTitleRows(zone, items, sourceType) {
  const now = new Date().toISOString();
  return items.map((item) => ({
    externalId: item.externalId,
    zone,
    title: item.title,
    imdbUrl: item.imdbUrl || '',
    posterUrl: item.posterUrl || '',
    synopsis: item.synopsis || '',
    freshness: now,
    sourceType
  }));
}

export async function listZone(zone) {
  const rows = await listZoneTitles(zone);
  const enriched = rows.map((row) => ({
    ...row,
    media: buildMedia(row.zone, row.title, row.posterUrl),
    fallbackMedia: buildFallbackMedia(row.zone, row.title, row.posterUrl)
  }));

  const allMediaUrls = enriched.flatMap((row) => [
    ...(row.media?.youtubeEmbeds || []),
    ...(row.media?.backdropImages || []),
    ...(row.fallbackMedia?.youtubeEmbeds || []),
    ...(row.fallbackMedia?.backdropImages || [])
  ]);
  const validByUrl = await validateUrls(allMediaUrls);

  return enriched.map((row) => {
    const primaryVideos = (row.media.youtubeEmbeds || []).filter((u) => validByUrl.get(u));
    const primaryImages = (row.media.backdropImages || []).filter((u) => validByUrl.get(u));
    const fallbackVideos = (row.fallbackMedia.youtubeEmbeds || []).filter((u) => validByUrl.get(u));
    const fallbackImages = (row.fallbackMedia.backdropImages || []).filter((u) => validByUrl.get(u));

    const youtubeEmbeds = primaryVideos.length ? primaryVideos : fallbackVideos;
    const backdropImages = primaryImages.length ? primaryImages : fallbackImages;
    const { fallbackMedia, ...safeRow } = row;

    return {
      ...safeRow,
      media: {
        youtubeEmbeds: youtubeEmbeds.length ? youtubeEmbeds : (row.fallbackMedia.youtubeEmbeds || []).slice(0, 1),
        backdropImages: backdropImages.length ? backdropImages : (row.fallbackMedia.backdropImages || []).slice(0, 1)
      }
    };
  });
}

export async function scrapeAndStore({ jobType = 'incremental' }) {
  const sources = await listSources();
  const sourceMap = new Map(sources.map((s) => [s.id, s]));

  const enabledMoviesSeries = sourceMap.get('src-justwatch')?.enabled || sourceMap.get('src-imdb')?.enabled;
  const enabledGames = sourceMap.get('src-crazygames')?.enabled;

  let totalSources = 0;

  if (enabledMoviesSeries) {
    const [movies, series] = await Promise.all([fetchTrendingMovies(25), fetchTrendingSeries(25)]);

    const movieTitles = toTitleRows('movies', movies, 'official');
    const seriesTitles = toTitleRows('series', series, 'official');

    const movieLinks = movies.flatMap((m) =>
      buildMovieOrSeriesLinks({ titleExternalId: m.externalId, zone: 'movies', title: m.title })
    );
    const seriesLinks = series.flatMap((s) =>
      buildMovieOrSeriesLinks({ titleExternalId: s.externalId, zone: 'series', title: s.title })
    );

    await upsertTitlesAndLinks({
      titles: movieTitles,
      links: movieLinks,
      jobType,
      source: 'JustWatch'
    });

    await upsertTitlesAndLinks({
      titles: seriesTitles,
      links: seriesLinks,
      jobType,
      source: 'JustWatch'
    });

    totalSources += 1;
  }

  if (enabledGames) {
    const games = await fetchTrendingGames(25);
    const gameTitles = toTitleRows('games', games, 'official');
    const gameLinks = games.flatMap((g) =>
      buildGameLinks({
        titleExternalId: g.externalId,
        zone: 'games',
        title: g.title,
        gameUrl: g.gameUrl
      })
    );

    await upsertTitlesAndLinks({
      titles: gameTitles,
      links: gameLinks,
      jobType,
      source: 'CrazyGames'
    });

    totalSources += 1;
  }

  return {
    ok: true,
    jobType,
    sourceCount: totalSources,
    zonesProcessed: 3
  };
}

export async function adminSetSourceEnabled({ sourceId, enabled }) {
  return setSourceEnabled(sourceId, enabled);
}

export async function adminAddOverride(data) {
  return addOverride(data);
}

export async function adminListSources() {
  return listSources();
}

export async function adminListRecentScrapeJobs(limit = 30) {
  return listRecentScrapeJobs(limit);
}
