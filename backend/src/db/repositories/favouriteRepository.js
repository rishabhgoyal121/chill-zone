import { query } from '../pgClient.js';
import { nextId } from '../../utils/id.js';

export async function addFavourite({ userId, titleExternalId }) {
  const result = await query(
    `INSERT INTO favourites (id, user_id, title_external_id)
     VALUES ($1, $2, $3)
     ON CONFLICT (user_id, title_external_id)
     DO UPDATE SET title_external_id = EXCLUDED.title_external_id
     RETURNING id, user_id, title_external_id, created_at`,
    [nextId('fav'), userId, titleExternalId]
  );

  const row = result.rows[0];
  return {
    id: row.id,
    userId: row.user_id,
    titleExternalId: row.title_external_id,
    createdAt: row.created_at
  };
}

export async function removeFavourite({ userId, titleExternalId }) {
  const result = await query(
    'DELETE FROM favourites WHERE user_id = $1 AND title_external_id = $2',
    [userId, titleExternalId]
  );
  return result.rowCount > 0;
}

export async function listFavourites(userId) {
  const result = await query(
    `SELECT f.id AS fav_id, f.user_id, f.title_external_id, f.created_at,
            t.zone, t.title, t.imdb_url, t.synopsis, t.freshness
     FROM favourites f
     LEFT JOIN titles t ON t.external_id = f.title_external_id
     WHERE f.user_id = $1
     ORDER BY f.created_at DESC`,
    [userId]
  );

  return result.rows
    .filter((row) => row.title)
    .map((row) => ({
      id: row.fav_id,
      userId: row.user_id,
      titleExternalId: row.title_external_id,
      createdAt: row.created_at,
      title: {
        externalId: row.title_external_id,
        zone: row.zone,
        title: row.title,
        imdbUrl: row.imdb_url,
        synopsis: row.synopsis,
        freshness: row.freshness
      }
    }));
}
