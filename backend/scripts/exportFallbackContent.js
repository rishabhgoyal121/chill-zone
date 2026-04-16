import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { Pool } from 'pg';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '../..');
const outputPath = path.resolve(rootDir, 'frontend/public/fallback-content.json');

const databaseUrl = process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/chill_zone';

function groupLinks(rows) {
  const map = new Map();
  for (const row of rows) {
    const key = `${row.title_external_id}::${row.zone}`;
    if (!map.has(key)) {
      map.set(key, []);
    }
    map.get(key).push({
      titleExternalId: row.title_external_id,
      zone: row.zone,
      label: row.label,
      url: row.url,
      region: row.region,
      linkType: row.link_type
    });
  }
  return map;
}

async function main() {
  const pool = new Pool({ connectionString: databaseUrl });
  try {
    const [titlesResult, linksResult] = await Promise.all([
      pool.query(
        `SELECT external_id, zone, title, imdb_url, imdb_rating, poster_url, synopsis, freshness, source_type, updated_at
         FROM titles
         ORDER BY updated_at DESC`
      ),
      pool.query(
        `SELECT title_external_id, zone, label, url, region, link_type
         FROM links
         ORDER BY created_at DESC`
      )
    ]);

    const linksByTitle = groupLinks(linksResult.rows);
    const payload = {
      generatedAt: new Date().toISOString(),
      counts: {
        titles: titlesResult.rowCount,
        links: linksResult.rowCount
      },
      movies: [],
      series: [],
      games: []
    };

    for (const row of titlesResult.rows) {
      const item = {
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
        links: linksByTitle.get(`${row.external_id}::${row.zone}`) || []
      };

      if (row.zone === 'movies') payload.movies.push(item);
      else if (row.zone === 'series') payload.series.push(item);
      else if (row.zone === 'games') payload.games.push(item);
    }

    fs.writeFileSync(outputPath, JSON.stringify(payload, null, 2));
    console.log(`Fallback content exported to ${outputPath}`);
    console.log(`Movies=${payload.movies.length} Series=${payload.series.length} Games=${payload.games.length}`);
  } finally {
    await pool.end();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
