import axios from 'axios';

const IMDB_SUGGESTION_BASE = 'https://v3.sg.media-imdb.com/suggestion';
const IMDB_TITLE_BASE = 'https://www.imdb.com/title';
const IMDB_GRAPHQL_URL = 'https://caching.graphql.imdb.com/';

function normalizeTitleQuery(title = '') {
  return String(title)
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

async function fetchSuggestion(query) {
  const normalized = normalizeTitleQuery(query);
  if (!normalized) return null;
  const first = normalized[0];
  const url = `${IMDB_SUGGESTION_BASE}/${first}/${encodeURIComponent(normalized)}.json`;

  try {
    const response = await axios.get(url, {
      timeout: 8000,
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36',
        Accept: 'application/json,text/plain,*/*'
      },
      validateStatus: () => true
    });
    if (response.status < 200 || response.status >= 300) return null;
    const rows = Array.isArray(response.data?.d) ? response.data.d : [];
    const firstTitle = rows.find((row) => typeof row?.id === 'string' && row.id.startsWith('tt'));
    return firstTitle?.id || null;
  } catch {
    return null;
  }
}

async function fetchTitleRating(imdbId) {
  if (!imdbId) return { imdbUrl: '', imdbRating: null };
  const imdbUrl = `${IMDB_TITLE_BASE}/${imdbId}/`;
  const query = 'query($id:ID!){ title(id:$id){ ratingsSummary{ aggregateRating } } }';

  try {
    const response = await axios.post(
      IMDB_GRAPHQL_URL,
      {
        query,
        variables: { id: imdbId }
      },
      {
        timeout: 9000,
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36',
          Accept: 'application/json,text/plain,*/*',
          'Content-Type': 'application/json'
        },
        validateStatus: () => true
      }
    );
    if (response.status < 200 || response.status >= 300) return { imdbUrl, imdbRating: null };
    const value = response.data?.data?.title?.ratingsSummary?.aggregateRating;
    const rating = Number.parseFloat(String(value ?? ''));
    if (!Number.isFinite(rating) || rating < 0 || rating > 10) return { imdbUrl, imdbRating: null };
    return {
      imdbUrl,
      imdbRating: Number(rating.toFixed(1))
    };
  } catch {
    return { imdbUrl, imdbRating: null };
  }
}

async function fetchTitleRatingFromHtml(imdbId) {
  if (!imdbId) return { imdbUrl: '', imdbRating: null };
  const imdbUrl = `${IMDB_TITLE_BASE}/${imdbId}/`;
  try {
    const response = await axios.get(imdbUrl, {
      timeout: 9000,
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36',
        Accept: 'text/html,application/xhtml+xml'
      },
      validateStatus: () => true
    });
    if (response.status < 200 || response.status >= 300) return { imdbUrl, imdbRating: null };
    const match = String(response.data || '').match(/"ratingValue"\s*:\s*"?(?<rating>[0-9](?:\.[0-9])?)"?/i);
    if (!match?.groups?.rating) return { imdbUrl, imdbRating: null };
    const rating = Number.parseFloat(match.groups.rating);
    if (!Number.isFinite(rating) || rating < 0 || rating > 10) return { imdbUrl, imdbRating: null };
    return {
      imdbUrl,
      imdbRating: Number(rating.toFixed(1))
    };
  } catch {
    return { imdbUrl, imdbRating: null };
  }
}

export async function fetchImdbMetadataForTitle(title) {
  const imdbId = await fetchSuggestion(title);
  if (!imdbId) return { imdbUrl: '', imdbRating: null };
  const graphql = await fetchTitleRating(imdbId);
  if (typeof graphql.imdbRating === 'number') return graphql;
  return fetchTitleRatingFromHtml(imdbId);
}
