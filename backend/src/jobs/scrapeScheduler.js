import cron from 'node-cron';
import { refreshCore } from '../core/controllers/contentCoreController.js';

export function startScrapeScheduler() {
  cron.schedule('0 9,21 * * *', async () => {
    await refreshCore('incremental');
  });

  cron.schedule('0 8 * * 0', async () => {
    await refreshCore('full');
  });
}
