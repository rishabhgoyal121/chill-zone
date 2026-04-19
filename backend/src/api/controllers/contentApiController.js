import {
  addOverrideCore,
  listRecentScrapeJobsCore,
  listSourcesCore,
  listZoneCore,
  refreshCore,
  setSourceEnabledCore
} from '../../core/controllers/contentCoreController.js';

export async function listMoviesApi(_, res) {
  return res.json(await listZoneCore('movies'));
}

export async function listSeriesApi(_, res) {
  return res.json(await listZoneCore('series'));
}

export async function listGamesApi(_, res) {
  return res.json(await listZoneCore('games'));
}

export async function refreshApi(req, res) {
  const jobType = req.body?.jobType || 'incremental';
  return res.json(await refreshCore(jobType));
}

export async function listSourcesApi(_, res) {
  return res.json(await listSourcesCore());
}

export async function listRecentScrapeJobsApi(req, res) {
  const rawLimit = Number(req.query?.limit || 30);
  const limit = Number.isFinite(rawLimit) ? Math.max(1, Math.min(rawLimit, 200)) : 30;
  return res.json(await listRecentScrapeJobsCore(limit));
}

export async function setSourceEnabledApi(req, res) {
  try {
    const data = await setSourceEnabledCore({
      sourceId: req.params.sourceId,
      enabled: Boolean(req.body.enabled)
    });
    return res.json(data);
  } catch (err) {
    return res.status(404).json({ error: err.message });
  }
}

export async function addOverrideApi(req, res) {
  try {
    const data = await addOverrideCore({ ...req.body, createdBy: req.user.sub });
    return res.status(201).json(data);
  } catch (err) {
    return res.status(400).json({ error: err.message });
  }
}
