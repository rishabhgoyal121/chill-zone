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

function toTitleRows(zone, items, sourceType) {
  const now = new Date().toISOString();
  return items.map((item) => ({
    externalId: item.externalId,
    zone,
    title: item.title,
    imdbUrl: item.imdbUrl || '',
    synopsis: item.synopsis || '',
    freshness: now,
    sourceType
  }));
}

export async function listZone(zone) {
  return listZoneTitles(zone);
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
