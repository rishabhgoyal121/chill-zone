import { query } from '../pgClient.js';
import { nextId } from '../../utils/id.js';

export async function createUser({ email, passwordHash, role, createdBy }) {
  const existing = await query('SELECT id FROM users WHERE lower(email) = lower($1)', [email]);
  if (existing.rowCount > 0) {
    throw new Error('User already exists');
  }

  const id = nextId('usr');
  const created = await query(
    `INSERT INTO users (id, email, password_hash, role, created_by)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING id, email, role, created_by, created_at`,
    [id, email, passwordHash, role, createdBy || null]
  );

  await query(
    `INSERT INTO audit_logs (id, action, actor_id, target_id, meta)
     VALUES ($1, $2, $3, $4, $5::jsonb)`,
    [nextId('log'), 'CREATE_USER', createdBy || 'system', id, JSON.stringify({ email, role })]
  );

  return created.rows[0];
}

export async function findUserByEmail(email) {
  const result = await query('SELECT * FROM users WHERE lower(email) = lower($1) LIMIT 1', [email]);
  return result.rows[0] || null;
}

export async function findUserById(id) {
  const result = await query('SELECT * FROM users WHERE id = $1 LIMIT 1', [id]);
  return result.rows[0] || null;
}

export async function listUsers() {
  const result = await query(
    'SELECT id, email, role, created_by, created_at FROM users ORDER BY created_at DESC'
  );
  return result.rows;
}
