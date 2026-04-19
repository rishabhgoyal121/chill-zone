import {
  adminAddOverride,
  adminListRecentScrapeJobs,
  adminListSources,
  adminSetSourceEnabled,
  listZone,
  scrapeAndStore
} from '../../services/contentService.js';

export async function listZoneCore(zone) {
  return listZone(zone);
}

export async function refreshCore(jobType) {
  return scrapeAndStore({ jobType });
}

export async function listSourcesCore() {
  return adminListSources();
}

export async function setSourceEnabledCore(input) {
  return adminSetSourceEnabled(input);
}

export async function addOverrideCore(input) {
  return adminAddOverride(input);
}

export async function listRecentScrapeJobsCore(limit) {
  return adminListRecentScrapeJobs(limit);
}
