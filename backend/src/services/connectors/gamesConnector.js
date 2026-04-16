import * as cheerio from 'cheerio';
import { fetchHtml } from './httpClient.js';

const GAMES_URL = 'https://www.crazygames.com/new';

function normalizeImageUrl(url) {
  if (!url) return '';
  const value = String(url).trim();
  if (!value) return '';
  if (value.startsWith('//')) return `https:${value}`;
  if (value.startsWith('/')) return `https://www.crazygames.com${value}`;
  return value;
}

function extractNextDataJson(html) {
  const match = html.match(/<script id="__NEXT_DATA__" type="application\/json">([\s\S]*?)<\/script>/i);
  if (!match) return null;
  try {
    return JSON.parse(match[1]);
  } catch {
    return null;
  }
}

function collectGameNodes(value, out = []) {
  if (!value) return out;
  if (Array.isArray(value)) {
    for (const item of value) collectGameNodes(item, out);
    return out;
  }
  if (typeof value !== 'object') return out;

  const slug = typeof value.slug === 'string' ? value.slug : '';
  const title = typeof value.name === 'string' ? value.name : typeof value.title === 'string' ? value.title : '';
  const assets = value.assets && typeof value.assets === 'object' ? value.assets : {};
  const posterUrl = normalizeImageUrl(
    assets.square16x9 || assets.landscape16x9 || assets.cover || assets.poster || value.thumbnail || ''
  );

  if (slug && title && !slug.includes('/') && posterUrl) {
    out.push({ slug, title, posterUrl });
  }

  for (const nested of Object.values(value)) {
    collectGameNodes(nested, out);
  }
  return out;
}

export async function fetchTrendingGames(limit = 20) {
  const html = await fetchHtml(GAMES_URL);
  const nextData = extractNextDataJson(html);
  if (nextData) {
    const nodes = collectGameNodes(nextData);
    const seen = new Set();
    const results = [];

    for (const node of nodes) {
      const externalId = `cg-${node.slug}`;
      if (seen.has(externalId)) continue;
      seen.add(externalId);
      results.push({
        externalId,
        title: node.title.trim(),
        gameUrl: `https://www.crazygames.com/game/${node.slug}`,
        imdbRating: null,
        synopsis: 'Trending game discovered from CrazyGames.',
        posterUrl: node.posterUrl
      });
      if (results.length >= limit) break;
    }

    if (results.length) return results;
  }

  const $ = cheerio.load(html);
  const results = [];
  const seen = new Set();

  $('a[href*="/game/"]').each((_, el) => {
    const href = $(el).attr('href') || '';
    const text = ($(el).text() || '').trim();
    const title = text.replace(/\s+/g, ' ').trim();

    if (!href || !title) {
      return;
    }

    const fullUrl = href.startsWith('http') ? href : `https://www.crazygames.com${href}`;
    const idMatch = fullUrl.match(/\/game\/([^/?#]+)/);
    if (!idMatch) {
      return;
    }

    const imageRaw =
      $(el).find('img').first().attr('src') ||
      $(el).find('img').first().attr('data-src') ||
      $(el).find('img').first().attr('data-lazy-src') ||
      '';
    const posterUrl = normalizeImageUrl(imageRaw);

    const externalId = `cg-${idMatch[1]}`;
    if (seen.has(externalId)) {
      return;
    }

    seen.add(externalId);
    results.push({
      externalId,
      title,
      gameUrl: fullUrl,
      imdbRating: null,
      synopsis: 'Trending game discovered from CrazyGames.',
      posterUrl
    });
  });

  return results.slice(0, limit);
}
