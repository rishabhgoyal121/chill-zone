import { query, withTransaction } from '../pgClient.js';
import { nextId } from '../../utils/id.js';

export async function upsertTitlesAndLinks({ titles = [], links = [], jobType, source }) {
  await withTransaction(async (client) => {
    for (const title of titles) {
      await client.query(
        `INSERT INTO titles (id, external_id, zone, title, imdb_url, imdb_rating, poster_url, synopsis, freshness, source_type)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
         ON CONFLICT (external_id, zone)
         DO UPDATE SET
           title = EXCLUDED.title,
           imdb_url = EXCLUDED.imdb_url,
           imdb_rating = EXCLUDED.imdb_rating,
           poster_url = EXCLUDED.poster_url,
           synopsis = EXCLUDED.synopsis,
           freshness = EXCLUDED.freshness,
           source_type = EXCLUDED.source_type,
           updated_at = NOW()`,
        [
          nextId('ttl'),
          title.externalId,
          title.zone,
          title.title,
          title.imdbUrl || null,
          title.imdbRating ?? null,
          title.posterUrl || null,
          title.synopsis || null,
          title.freshness || null,
          title.sourceType
        ]
      );
    }

    for (const link of links) {
      await client.query(
        `INSERT INTO links (id, title_external_id, zone, label, url, region, link_type)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         ON CONFLICT (title_external_id, zone, url, region) DO NOTHING`,
        [
          nextId('lnk'),
          link.titleExternalId,
          link.zone,
          link.label,
          link.url,
          link.region,
          link.linkType
        ]
      );
    }

    await client.query(
      `INSERT INTO scrape_jobs (id, type, source, title_count, link_count)
       VALUES ($1, $2, $3, $4, $5)`,
      [nextId('job'), jobType, source, titles.length, links.length]
    );
  });
}

export async function listZoneTitles(zone) {
  const titlesResult = await query(
    `SELECT external_id, zone, title, imdb_url, imdb_rating, poster_url, synopsis, freshness, source_type, updated_at
     FROM titles
     WHERE zone = $1
     ORDER BY updated_at DESC
     LIMIT 120`,
    [zone]
  );

  const linksResult = await query(
    `SELECT title_external_id, zone, label, url, region, link_type
     FROM links
     WHERE zone = $1`,
    [zone]
  );

  const linksByExternal = new Map();
  for (const row of linksResult.rows) {
    const key = row.title_external_id;
    if (!linksByExternal.has(key)) {
      linksByExternal.set(key, []);
    }
    linksByExternal.get(key).push({
      titleExternalId: row.title_external_id,
      zone: row.zone,
      label: row.label,
      url: row.url,
      region: row.region,
      linkType: row.link_type
    });
  }

  return titlesResult.rows.map((row) => ({
    externalId: row.external_id,
    zone: row.zone,
    title: row.title,
    imdbUrl: row.imdb_url,
    imdbRating: row.imdb_rating !== null ? Number(row.imdb_rating) : null,
    posterUrl: row.poster_url,
    synopsis: row.synopsis,
    freshness: row.freshness,
    sourceType: row.source_type,
    updatedAt: row.updated_at,
    links: linksByExternal.get(row.external_id) || []
  }));
}

export async function listSources() {
  const result = await query('SELECT id, name, type, enabled FROM sources ORDER BY name ASC');
  return result.rows;
}

export async function listRecentScrapeJobs(limit = 30) {
  const result = await query(
    `SELECT id, type, source, title_count, link_count, created_at
     FROM scrape_jobs
     ORDER BY created_at DESC
     LIMIT $1`,
    [limit]
  );

  return result.rows.map((row) => ({
    id: row.id,
    type: row.type,
    source: row.source,
    titleCount: row.title_count,
    linkCount: row.link_count,
    createdAt: row.created_at
  }));
}

export async function setSourceEnabled(sourceId, enabled) {
  const result = await query(
    'UPDATE sources SET enabled = $2 WHERE id = $1 RETURNING id, name, type, enabled',
    [sourceId, enabled]
  );
  if (result.rowCount === 0) {
    throw new Error('Source not found');
  }
  return result.rows[0];
}

export async function addOverride({ titleExternalId, url, region, label, createdBy }) {
  const id = nextId('ovr');
  const result = await query(
    `INSERT INTO admin_overrides (id, title_external_id, url, region, label, created_by)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING id, title_external_id, url, region, label, created_by, created_at`,
    [id, titleExternalId, url, region, label, createdBy]
  );

  await query(
    `INSERT INTO audit_logs (id, action, actor_id, target_id, meta)
     VALUES ($1, $2, $3, $4, $5::jsonb)`,
    [nextId('log'), 'ADD_OVERRIDE', createdBy, id, JSON.stringify({ titleExternalId, region })]
  );

  const row = result.rows[0];
  return {
    id: row.id,
    titleExternalId: row.title_external_id,
    url: row.url,
    region: row.region,
    label: row.label,
    createdBy: row.created_by,
    createdAt: row.created_at
  };
}
