import JobCache from '../models/JobCache.js';
import { fetchAllJobs, applyClientFilters } from './jobService.js';

const CACHE_KEY = 'all-india';
const LIVE_CACHE_MS = 10 * 60 * 1000; // 10 min in-memory cache (pan-India fetch is heavy)

let isRefreshing = false;
let liveMemoryCache = {
  jobs: [],
  sources: {},
  lastUpdated: null,
};

export const getRefreshIntervalMs = () =>
  parseInt(process.env.JOB_REFRESH_HOURS || '24', 10) * 60 * 60 * 1000;

/** Fetch jobs LIVE from external APIs (primary method) */
export const fetchLiveJobs = async (filters = {}, force = false) => {
  const now = Date.now();
  const cacheValid =
    liveMemoryCache.lastUpdated &&
    now - new Date(liveMemoryCache.lastUpdated).getTime() < LIVE_CACHE_MS;

  if (
    cacheValid &&
    !force &&
    !filters.title &&
    !filters.skills &&
    !filters.category &&
    !filters.location
  ) {
    const jobs = applyClientFilters(liveMemoryCache.jobs, filters);
    return {
      jobs,
      sources: liveMemoryCache.sources,
      lastUpdated: liveMemoryCache.lastUpdated,
      live: true,
      fromCache: true,
    };
  }

  const { jobs, sources } = await fetchAllJobs(filters);

  liveMemoryCache = {
    jobs,
    sources,
    lastUpdated: new Date(),
  };

  // Also save to MongoDB for backup
  try {
    await JobCache.findOneAndUpdate(
      { key: CACHE_KEY },
      {
        key: CACHE_KEY,
        jobs,
        jobCount: jobs.length,
        lastUpdated: liveMemoryCache.lastUpdated,
        nextRefresh: new Date(now + getRefreshIntervalMs()),
        source: 'live-api',
      },
      { upsert: true }
    );
  } catch (err) {
    console.warn('[Jobs] MongoDB cache save skipped:', err.message);
  }

  return {
    jobs,
    sources,
    lastUpdated: liveMemoryCache.lastUpdated,
    live: true,
    fromCache: false,
  };
};

export const refreshJobCache = async () => {
  if (isRefreshing) return null;
  isRefreshing = true;
  try {
    const result = await fetchLiveJobs({ location: 'all india' }, true);
    console.log(`[Jobs] Refreshed: ${result.jobs.length} live jobs`);
    return result;
  } finally {
    isRefreshing = false;
  }
};

export const getCachedJobs = async (filters = {}, forceLive = true) => {
  if (forceLive) {
    return fetchLiveJobs(filters);
  }

  let cache = await JobCache.findOne({ key: CACHE_KEY });
  if (!cache?.jobs?.length) {
    return fetchLiveJobs(filters);
  }

  const jobs = applyClientFilters(cache.jobs, filters);
  return {
    jobs,
    sources: {},
    lastUpdated: cache.lastUpdated,
    live: false,
    fromCache: true,
  };
};

export const getJobFromCacheById = async (jobId, filters = {}) => {
  const { jobs } = await fetchLiveJobs(filters);
  return jobs.find((j) => j.id === jobId) || null;
};

export const getCacheMeta = async () => {
  const cache = await JobCache.findOne({ key: CACHE_KEY });
  return {
    autoUpdate: true,
    manualEntryRequired: false,
    lastUpdated: liveMemoryCache.lastUpdated || cache?.lastUpdated || null,
    totalCached: liveMemoryCache.jobs.length || cache?.jobCount || 0,
    sources: liveMemoryCache.sources || {},
    liveFetch: true,
  };
};

export const startJobAutoUpdater = () => {
  const hours = getRefreshIntervalMs() / (60 * 60 * 1000);

  refreshJobCache().catch((err) =>
    console.error('[Jobs] Initial live fetch failed:', err.message)
  );

  setInterval(() => {
    refreshJobCache().catch((err) =>
      console.error('[Jobs] Scheduled refresh failed:', err.message)
    );
  }, getRefreshIntervalMs());

  console.log(`[Jobs] Live API fetch enabled (refresh every ${hours}h + on each visit)`);
};
