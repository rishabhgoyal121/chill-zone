import * as cheerio from 'cheerio';
import { fetchHtml } from './httpClient.js';

const GAMES_URL = 'https://www.crazygames.com/new';

export async function fetchTrendingGames(limit = 20) {
  const html = await fetchHtml(GAMES_URL);
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

    const externalId = `cg-${idMatch[1]}`;
    if (seen.has(externalId)) {
      return;
    }

    seen.add(externalId);
    results.push({
      externalId,
      title,
      gameUrl: fullUrl,
      synopsis: 'Trending game discovered from CrazyGames.'
    });
  });

  return results.slice(0, limit);
}
