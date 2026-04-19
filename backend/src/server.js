import { createApp } from './app.js';
import { env } from './config/env.js';
import { initDb } from './db/initDb.js';
import { startScrapeScheduler } from './jobs/scrapeScheduler.js';
import { bootstrapSuperAdminIfMissing } from './services/authService.js';
import { refreshCore } from './core/controllers/contentCoreController.js';

async function start() {
  await initDb();
  await bootstrapSuperAdminIfMissing();
  try {
    await refreshCore('bootstrap');
  } catch (err) {
    console.warn('[startup] bootstrap refresh failed, continuing server start:', err?.message || err);
  }
  startScrapeScheduler();

  const app = createApp();
  app.listen(env.port, () => {
    console.log(`Backend listening on http://localhost:${env.port}`);
    console.log('Bootstrap admin: admin@chillzone.local / ChangeMe123!');
  });
}

start();
