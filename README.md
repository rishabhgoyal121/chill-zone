# Chill Zone

Full-stack app with React frontend and Node backend.

## Architecture Rule

Request flow is intentionally strict:

`frontend -> api controller -> core controller -> service -> db`

## Setup

1. Ensure PostgreSQL is running.
2. Create DB:

```bash
createdb chill_zone
```

3. Install dependencies and configure env:

```bash
npm install
cp backend/.env.example backend/.env
```

4. Start apps:

```bash
npm run start:backend
npm run dev:frontend
```

## Bootstrap Admin

- Email: `admin@chillzone.local`
- Password: `ChangeMe123!`

Change this password by creating a new admin user, then rotate/remove the bootstrap account.

## Sources and Refresh

- Movies/Series: JustWatch scraping connector.
- Games: CrazyGames scraping connector.
- Script-extended links include JustWatch and scripted external search links.
- Scheduler:
  - Incremental refresh: `09:00` and `21:00`
  - Full refresh: Sunday `08:00`

## Fallback Snapshot Export (from Postgres)

Generate a static backup payload for the frontend:

```bash
npm run export:fallback
```

This writes to:

`frontend/public/fallback-content.json`

Frontend behavior:
- Uses live API when available.
- Falls back to `fallback-content.json` automatically if live API fails.

## Deploy Frontend to Netlify

1. Push this repo to GitHub.
2. Create a Netlify site from repo.
3. Netlify settings:
   - Build command: `npm run build:frontend`
   - Publish directory: `frontend/dist`
4. Environment variable:
   - `VITE_API_URL=https://api.<PUBLIC_IP>.sslip.io` (set once backend HTTPS is live)

`netlify.toml` is already included with these defaults.

## Expose Backend from Laptop with Caddy + SSLIP

1. Install Caddy on laptop.
2. Copy `ops/Caddyfile.example` to `ops/Caddyfile`.
3. Replace `<PUBLIC_IP>` in hostname: `api.<PUBLIC_IP>.sslip.io`.
4. Run backend:

```bash
npm run start:backend
```

5. Run Caddy:

```bash
caddy run --config ops/Caddyfile
```

6. Router/network setup:
- Forward ports 80 and 443 to this laptop.
- Allow incoming firewall rules for Caddy.

## Quick API Smoke Checks (curl)

```bash
curl -s http://localhost:4000/health

LOGIN=$(curl -s -X POST http://localhost:4000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@chillzone.local","password":"ChangeMe123!"}')

echo "$LOGIN"
```
