import * as cheerio from 'cheerio';
import { fetchHtml } from './httpClient.js';

const MOVIE_PAGES = ['https://www.justwatch.com/in/movies', 'https://www.justwatch.com/us/movies'];
const SERIES_PAGES = ['https://www.justwatch.com/in/tv-shows', 'https://www.justwatch.com/us/tv-shows'];

function titleFromSlug(slug) {
  return slug
    .replace(/-\d{4}$/g, '')
    .replace(/-/g, ' ')
    .replace(/\b\w/g, (ch) => ch.toUpperCase())
    .trim();
}

function normalizeImageUrl(url) {
  if (!url) return '';
  let value = String(url).trim();
  value = value.replace(/\\u002F/g, '/').replace(/\\\//g, '/').replace(/&amp;/g, '&');
  if (value.startsWith('//')) return `https:${value}`;
  if (value.startsWith('/')) return `https://www.justwatch.com${value}`;
  return value;
}

function parseCards(html, entryType, zonePrefix) {
  const $ = cheerio.load(html);
  const items = [];
  const seen = new Set();

  $(`a[href*="/${entryType}/"]`).each((_, el) => {
    const href = $(el).attr('href') || '';
    const match = href.match(new RegExp(`/((in|us)/${entryType}/([a-z0-9-]+))`, 'i'));
    if (!match) return;

    const path = `/${match[1]}`;
    const slug = match[3].toLowerCase();
    const externalId = `${zonePrefix}-${slug}`;
    if (seen.has(externalId)) return;

    const img = $(el).find('img').first();
    const posterUrl = normalizeImageUrl(
      img.attr('src') || img.attr('data-src') || img.attr('data-lazy-src') || img.attr('srcset') || ''
    );
    if (!posterUrl || !posterUrl.includes('/poster/')) return;

    const rawText = ($(el).attr('title') || $(el).attr('aria-label') || $(el).text() || '')
      .trim()
      .replace(/\s+/g, ' ');
    const noisy = /^(free|free tv|tv|watch now)$/i.test(rawText) || rawText.length < 3;
    const title = noisy ? titleFromSlug(slug) : rawText;
    seen.add(externalId);
    items.push({
      externalId,
      title,
      imdbUrl: `https://www.imdb.com/find/?q=${encodeURIComponent(title)}`,
      synopsis: 'A trending pick currently popular on JustWatch.',
      posterUrl
    });
  });

  return items;
}

async function fetchList(urls, entryType, zonePrefix, limit) {
  const all = [];

  for (const url of urls) {
    const html = await fetchHtml(url);
    all.push(...parseCards(html, entryType, zonePrefix));
  }

  const seen = new Set();
  const deduped = [];
  for (const item of all) {
    if (seen.has(item.externalId)) {
      continue;
    }
    seen.add(item.externalId);
    deduped.push(item);
    if (deduped.length >= limit) {
      break;
    }
  }

  return deduped;
}

export async function fetchTrendingMovies(limit = 20) {
  return fetchList(MOVIE_PAGES, 'movie', 'jw-m', limit);
}

export async function fetchTrendingSeries(limit = 20) {
  return fetchList(SERIES_PAGES, 'tv-show', 'jw-s', limit);
}
