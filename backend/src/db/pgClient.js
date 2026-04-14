import { Pool } from 'pg';
import { env } from '../config/env.js';

const pool = new Pool({
  connectionString: env.databaseUrl
});

export async function query(text, params = []) {
  return pool.query(text, params);
}

export async function withTransaction(run) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await run(client);
    await client.query('COMMIT');
    return result;
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

export async function closePool() {
  await pool.end();
}
