import { query } from './pgClient.js';

const ddl = `
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('super_admin', 'content_admin', 'moderator')),
  created_by TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS titles (
  id TEXT PRIMARY KEY,
  external_id TEXT NOT NULL,
  zone TEXT NOT NULL CHECK (zone IN ('movies', 'series', 'games')),
  title TEXT NOT NULL,
  imdb_url TEXT,
  synopsis TEXT,
  freshness TIMESTAMPTZ,
  source_type TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (external_id, zone)
);

CREATE TABLE IF NOT EXISTS links (
  id TEXT PRIMARY KEY,
  title_external_id TEXT NOT NULL,
  zone TEXT NOT NULL CHECK (zone IN ('movies', 'series', 'games')),
  label TEXT NOT NULL,
  url TEXT NOT NULL,
  region TEXT NOT NULL CHECK (region IN ('IN', 'US')),
  link_type TEXT NOT NULL CHECK (link_type IN ('official', 'external')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (title_external_id, zone, url, region)
);

CREATE TABLE IF NOT EXISTS favourites (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title_external_id TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, title_external_id)
);

CREATE TABLE IF NOT EXISTS scrape_jobs (
  id TEXT PRIMARY KEY,
  type TEXT NOT NULL,
  source TEXT NOT NULL,
  title_count INTEGER NOT NULL,
  link_count INTEGER NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS sources (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('official', 'external')),
  enabled BOOLEAN NOT NULL DEFAULT TRUE
);

CREATE TABLE IF NOT EXISTS admin_overrides (
  id TEXT PRIMARY KEY,
  title_external_id TEXT NOT NULL,
  url TEXT NOT NULL,
  region TEXT NOT NULL CHECK (region IN ('IN', 'US')),
  label TEXT NOT NULL,
  created_by TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS audit_logs (
  id TEXT PRIMARY KEY,
  action TEXT NOT NULL,
  actor_id TEXT NOT NULL,
  target_id TEXT,
  meta JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
`;

export async function initDb() {
  await query(ddl);

  await query(
    `INSERT INTO sources (id, name, type, enabled)
     VALUES
      ('src-justwatch', 'JustWatch', 'official', TRUE),
      ('src-crazygames', 'CrazyGames', 'official', TRUE),
      ('src-script-links', 'ScriptedExternalLinks', 'external', TRUE)
     ON CONFLICT (id) DO NOTHING`
  );

  await query(
    `INSERT INTO sources (id, name, type, enabled)
     VALUES ('src-imdb', 'IMDb Legacy', 'official', FALSE)
     ON CONFLICT (id) DO NOTHING`
  );
}
