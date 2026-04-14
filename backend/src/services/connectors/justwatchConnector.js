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

function extractByPattern(html, pattern, zonePrefix) {
  const matches = [...html.matchAll(pattern)].map((m) => m[0]);
  const unique = [...new Set(matches)];

  return unique.map((path) => {
    const slug = path.split('/').pop();
    const title = titleFromSlug(slug);

    return {
      externalId: `${zonePrefix}-${slug}`,
      title,
      imdbUrl: `https://www.imdb.com/find/?q=${encodeURIComponent(title)}`,
      synopsis: `Trending title discovered from JustWatch path ${path}.`
    };
  });
}

async function fetchList(urls, pattern, zonePrefix, limit) {
  const all = [];

  for (const url of urls) {
    const html = await fetchHtml(url);
    all.push(...extractByPattern(html, pattern, zonePrefix));
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
  return fetchList(MOVIE_PAGES, /\/((in|us)\/movie\/[a-z0-9-]+)/g, 'jw-m', limit);
}

export async function fetchTrendingSeries(limit = 20) {
  return fetchList(SERIES_PAGES, /\/((in|us)\/tv-show\/[a-z0-9-]+)/g, 'jw-s', limit);
}
