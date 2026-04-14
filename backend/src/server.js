import { createApp } from './app.js';
import { env } from './config/env.js';
import { initDb } from './db/initDb.js';
import { startScrapeScheduler } from './jobs/scrapeScheduler.js';
import { bootstrapSuperAdminIfMissing } from './services/authService.js';
import { refreshCore } from './core/controllers/contentCoreController.js';

async function start() {
  await initDb();
  await bootstrapSuperAdminIfMissing();
  await refreshCore('bootstrap');
  startScrapeScheduler();

  const app = createApp();
  app.listen(env.port, () => {
    console.log(`Backend listening on http://localhost:${env.port}`);
    console.log('Bootstrap admin: admin@chillzone.local / ChangeMe123!');
  });
}

start();
