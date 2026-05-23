import express from 'express';
import { getIndianCities, getJobCategories, getApiStatus } from '../services/jobService.js';
import {
  getCachedJobs,
  getJobFromCacheById,
  getCacheMeta,
  refreshJobCache,
  fetchLiveJobs,
} from '../services/jobCacheService.js';
import { protect } from '../middleware/auth.js';
import { recommendJobs, calculateSkillMatch } from '../services/aiService.js';
import User from '../models/User.js';

const router = express.Router();

const parseFilters = (query) => ({
  title: query.title,
  skills: query.skills,
  category: query.category,
  location: query.location,
  salaryMin: query.salaryMin,
  salaryMax: query.salaryMax,
  experience: query.experience,
  remote: query.remote,
  fullTime: query.fullTime,
  partTime: query.partTime,
  freshers: query.freshers,
});

// @route   GET /api/jobs/status
router.get('/status', async (_req, res) => {
  try {
    const meta = await getCacheMeta();
    const apis = getApiStatus();
    res.json({ ...meta, apis });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// @route   GET /api/jobs/cities/list
router.get('/cities/list', (_req, res) => {
  res.json({ cities: getIndianCities() });
});

// @route   GET /api/jobs/categories/list
router.get('/categories/list', (_req, res) => {
  res.json({ categories: getJobCategories() });
});

// @route   GET /api/jobs — LIVE fetch from APIs (Remotive, RemoteOK, Jobicy, etc.)
router.get('/', async (req, res) => {
  try {
    const filters = parseFilters(req.query);
    const force = req.query.refresh === 'true';
    const { jobs, sources, lastUpdated, live, fromCache } = await fetchLiveJobs(
      filters,
      force
    );

    res.json({
      count: jobs.length,
      jobs,
      live: live !== false,
      fromCache: !!fromCache,
      sources,
      lastUpdated,
      message: 'Jobs fetched live from external APIs',
    });
  } catch (err) {
    console.error('[Jobs] API error:', err);
    res.status(500).json({ message: err.message || 'Failed to fetch jobs' });
  }
});

// @route   GET /api/jobs/recommended
router.get('/recommended', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    const { jobs } = await fetchLiveJobs({ location: 'all india' });
    const recommended = recommendJobs(jobs, user.skills || [], 12);
    res.json({ jobs: recommended });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// @route   POST /api/jobs/refresh — force live refresh
router.post('/refresh', async (_req, res) => {
  try {
    const result = await refreshJobCache();
    res.json({
      message: 'Live jobs refreshed from APIs',
      count: result?.jobs?.length || 0,
      sources: result?.sources,
      lastUpdated: result?.lastUpdated,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// @route   GET /api/jobs/:id
router.get('/:id', async (req, res) => {
  try {
    if (['status', 'cities'].includes(req.params.id)) {
      return res.status(404).json({ message: 'Not found' });
    }

    const job = await getJobFromCacheById(req.params.id);

    if (!job) {
      return res.status(404).json({ message: 'Job not found' });
    }

    let skillMatch = null;
    const authHeader = req.headers.authorization;

    if (authHeader?.startsWith('Bearer ')) {
      try {
        const jwt = (await import('jsonwebtoken')).default;
        const decoded = jwt.verify(authHeader.split(' ')[1], process.env.JWT_SECRET);
        const user = await User.findById(decoded.id);
        if (user) {
          skillMatch = calculateSkillMatch(user.skills || [], job.description, job.title);
        }
      } catch {
        /* optional */
      }
    }

    res.json({ job, skillMatch });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

export default router;
