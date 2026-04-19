import dotenv from 'dotenv';
import { Pool } from 'pg';
import { nextId } from '../src/utils/id.js';
import { buildGameLinks, buildMovieOrSeriesLinks } from '../src/services/connectors/linkBuilder.js';

dotenv.config({ path: new URL('../.env', import.meta.url).pathname });

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  console.error('Missing DATABASE_URL. Set it before running seed script.');
  process.exit(1);
}

const now = new Date().toISOString();

const demoTitles = [
  {
    externalId: 'demo-m-interstellar',
    zone: 'movies',
    title: 'Interstellar',
    imdbUrl: 'https://www.imdb.com/title/tt0816692/',
    posterUrl: 'https://image.tmdb.org/t/p/w500/gEU2QniE6E77NI6lCU6MxlNBvIx.jpg',
    synopsis: 'A team of explorers travels through a wormhole in space to secure humanitys future.',
    freshness: now,
    sourceType: 'official'
  },
  {
    externalId: 'demo-m-spiderman-atsv',
    zone: 'movies',
    title: 'Spider-Man: Across the Spider-Verse',
    imdbUrl: 'https://www.imdb.com/title/tt9362722/',
    posterUrl: 'https://image.tmdb.org/t/p/w500/8Vt6mWEReuy4Of61Lnj5Xj704m8.jpg',
    synopsis: 'Miles Morales catapults across the multiverse and meets a team of Spider-People.',
    freshness: now,
    sourceType: 'official'
  },
  {
    externalId: 'demo-s-succession',
    zone: 'series',
    title: 'Succession',
    imdbUrl: 'https://www.imdb.com/title/tt7660850/',
    posterUrl: 'https://image.tmdb.org/t/p/w500/7HW47XbkNQ5fiwQFYGWdw9gs144.jpg',
    synopsis: 'The Roy family fights for control of a global media empire as power shifts constantly.',
    freshness: now,
    sourceType: 'official'
  },
  {
    externalId: 'demo-s-the-bear',
    zone: 'series',
    title: 'The Bear',
    imdbUrl: 'https://www.imdb.com/title/tt14452776/',
    posterUrl: 'https://image.tmdb.org/t/p/w500/sHFlbKS3WLqMnp9t1ghADIJFnuQ.jpg',
    synopsis: 'A young chef returns home to run his family sandwich shop amid pressure and chaos.',
    freshness: now,
    sourceType: 'official'
  },
  {
    externalId: 'demo-g-slope',
    zone: 'games',
    title: 'Slope',
    imdbUrl: 'https://www.imdb.com/find/?q=Slope',
    posterUrl: 'https://imgs.crazygames.com/slope_16x9/20230524070641/slope_16x9-cover?metadata=none&quality=70&width=1200&height=630&fit=crop',
    synopsis: 'A fast reflex arcade runner where you control a ball on an endless neon slope.',
    freshness: now,
    sourceType: 'official',
    gameUrl: 'https://www.crazygames.com/game/slope'
  },
  {
    externalId: 'demo-g-shell-shockers',
    zone: 'games',
    title: 'Shell Shockers',
    imdbUrl: 'https://www.imdb.com/find/?q=Shell%20Shockers',
    posterUrl: 'https://imgs.crazygames.com/shell-shockers_16x9/20231018081140/shell-shockers_16x9-cover?metadata=none&quality=70&width=1200&height=630&fit=crop',
    synopsis: 'A multiplayer shooter where heavily armed eggs battle in short competitive matches.',
    freshness: now,
    sourceType: 'official',
    gameUrl: 'https://www.crazygames.com/game/shellshockersio'
  }
];

function buildLinksForTitle(item) {
  if (item.zone === 'movies' || item.zone === 'series') {
    return buildMovieOrSeriesLinks({
      titleExternalId: item.externalId,
      zone: item.zone,
      title: item.title
    });
  }

  return buildGameLinks({
    titleExternalId: item.externalId,
    zone: item.zone,
    title: item.title,
    gameUrl: item.gameUrl
  });
}

async function run() {
  const pool = new Pool({ connectionString: databaseUrl });
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    let insertedTitles = 0;
    let insertedLinks = 0;

    for (const item of demoTitles) {
      await client.query(
        `INSERT INTO titles (id, external_id, zone, title, imdb_url, poster_url, synopsis, freshness, source_type)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
         ON CONFLICT (external_id, zone)
         DO UPDATE SET
           title = EXCLUDED.title,
           imdb_url = EXCLUDED.imdb_url,
           poster_url = EXCLUDED.poster_url,
           synopsis = EXCLUDED.synopsis,
           freshness = EXCLUDED.freshness,
           source_type = EXCLUDED.source_type,
           updated_at = NOW()`,
        [
          nextId('ttl'),
          item.externalId,
          item.zone,
          item.title,
          item.imdbUrl || null,
          item.posterUrl || null,
          item.synopsis || null,
          item.freshness || null,
          item.sourceType
        ]
      );
      insertedTitles += 1;

      const links = buildLinksForTitle(item);
      for (const link of links) {
        const result = await client.query(
          `INSERT INTO links (id, title_external_id, zone, label, url, region, link_type)
           VALUES ($1,$2,$3,$4,$5,$6,$7)
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
        insertedLinks += result.rowCount;
      }
    }

    await client.query(
      `INSERT INTO scrape_jobs (id, type, source, title_count, link_count)
       VALUES ($1, $2, $3, $4, $5)`,
      [nextId('job'), 'manual-seed', 'DemoScript', demoTitles.length, insertedLinks]
    );

    await client.query('COMMIT');
    console.log(
      `Demo seed complete. Titles processed=${insertedTitles}, new links inserted=${insertedLinks}, zones=movies/series/games`
    );
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
    await pool.end();
  }
}

run().catch((err) => {
  console.error('Seed failed:', err.message);
  process.exit(1);
});
