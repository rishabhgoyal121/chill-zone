import cors from 'cors';
import express from 'express';
import {
  createUserApi,
  listUsersApi,
  loginApi,
  meApi
} from './api/controllers/authApiController.js';
import {
  addOverrideApi,
  backfillImdbRatingsApi,
  listGamesApi,
  listMoviesApi,
  listRecentScrapeJobsApi,
  listSeriesApi,
  listSourcesApi,
  refreshApi,
  setSourceEnabledApi
} from './api/controllers/contentApiController.js';
import {
  addFavouriteApi,
  listFavouritesApi,
  removeFavouriteApi
} from './api/controllers/favouriteApiController.js';
import { requireAuth, requireRole } from './middlewares/authMiddleware.js';

export function createApp() {
  const app = express();
  app.use(cors());
  app.use(express.json());

  app.get('/health', (_, res) => res.json({ ok: true }));

  app.post('/api/auth/login', loginApi);
  app.get('/api/auth/me', requireAuth, meApi);

  app.get('/api/content/movies', listMoviesApi);
  app.get('/api/content/series', listSeriesApi);
  app.get('/api/content/games', listGamesApi);

  app.get('/api/favourites', requireAuth, listFavouritesApi);
  app.post('/api/favourites', requireAuth, addFavouriteApi);
  app.delete('/api/favourites/:titleExternalId', requireAuth, removeFavouriteApi);

  app.post('/api/admin/refresh', requireAuth, requireRole(['super_admin', 'content_admin']), refreshApi);
  app.post('/api/admin/users', requireAuth, requireRole(['super_admin']), createUserApi);
  app.get('/api/admin/users', requireAuth, requireRole(['super_admin', 'content_admin']), listUsersApi);
  app.get('/api/admin/sources', requireAuth, requireRole(['super_admin', 'content_admin', 'moderator']), listSourcesApi);
  app.get('/api/admin/scrape-jobs', requireAuth, requireRole(['super_admin', 'content_admin', 'moderator']), listRecentScrapeJobsApi);
  app.patch('/api/admin/sources/:sourceId', requireAuth, requireRole(['super_admin', 'content_admin']), setSourceEnabledApi);
  app.post('/api/admin/overrides', requireAuth, requireRole(['super_admin', 'content_admin', 'moderator']), addOverrideApi);
  app.post('/api/admin/backfill-imdb-ratings', requireAuth, requireRole(['super_admin', 'content_admin']), backfillImdbRatingsApi);

  return app;
}
