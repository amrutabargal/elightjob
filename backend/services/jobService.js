import axios from 'axios';
import { INDIAN_CITIES, isAllIndia } from '../data/indianCities.js';
import {
  JOB_CATEGORIES,
  PAN_INDIA_FETCH_CATEGORIES,
  detectJobCategory,
  getCategoryById,
} from '../data/jobCategories.js';
import { USER_AGENT } from '../config/brand.js';
import {
  fetchJoobleJobs,
  fetchCareerjetJobs,
  fetchJSearchCityJobs,
  filterIndiaRelevant,
  runBatched,
  hasJoobleKey,
  hasCareerjetAffid,
  hasJSearchKey as hasJSearchKeyProvider,
} from './indiaJobProviders.js';

const MAX_PER_SOURCE = 100;
const JOBICY_CATEGORY_BATCH = 6;

const stripHtml = (html) =>
  (html || '')
    .replace(/<[^>]*>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

const normalizeJob = (job, source) => {
  const title = job.title || 'Untitled Position';
  const description = job.description || '';
  const category = job.category || detectJobCategory(title, description);

  return {
    id: job.id,
    title,
    company: job.company || 'Unknown Company',
    description,
    location: job.location || 'Not specified',
    city: job.city || '',
    category,
    field: category,
    salary: job.salary || 'Not disclosed',
    experience: job.experience || '',
    skills: job.skills || [],
    type: job.type || '',
    remote: job.remote || false,
    logo: job.logo || '',
    applyUrl: job.applyUrl || '',
    postedAt: job.postedAt || null,
    source,
  };
};

const detectIndianCity = (location = '', description = '') => {
  const text = `${location} ${description}`.toLowerCase();
  for (const city of INDIAN_CITIES) {
    if (text.includes(city.toLowerCase())) return city;
  }
  if (/\bindia\b|\bindian\b|pan india|work from india/i.test(text)) return 'Pan India';
  return '';
};

const enrichJobs = (jobs) =>
  jobs.map((j) => {
    const detected = detectIndianCity(j.location, j.description);
    const city =
      detected ||
      (j.remote ? 'Remote / Pan India' : j.city || 'Pan India');
    const location =
      detected && !j.location?.toLowerCase().includes(detected.toLowerCase())
        ? `${detected}, India`
        : j.location || `${city}, India`;

    return {
      ...j,
      city,
      location,
      category: j.category || detectJobCategory(j.title, j.description),
      field: j.category || detectJobCategory(j.title, j.description),
    };
  });

const matchesCategory = (job, categoryId) => {
  if (!categoryId || categoryId === 'all') return true;
  const cat = getCategoryById(categoryId);
  if (!cat || cat.id === 'all' || !cat.keywords?.length) return true;
  const title = (job.title || '').toLowerCase();
  const desc = (job.description || '').toLowerCase();
  const catLabel = (job.category || '').toLowerCase();

  return cat.keywords.some((kw) => {
    const k = kw.trim().toLowerCase();
    if (!k) return false;
    if (title.includes(k) || catLabel.includes(k)) return true;
    if (k.length >= 5 && desc.includes(k)) return true;
    return false;
  });
};

const matchesSearchQuery = (job, q) => {
  if (!q) return true;
  const query = q.toLowerCase();
  return (
    job.title?.toLowerCase().includes(query) ||
    job.description?.toLowerCase().includes(query) ||
    job.category?.toLowerCase().includes(query) ||
    job.skills?.some((s) => String(s).toLowerCase().includes(query))
  );
};

const dedupeJobs = (jobs) => {
  const seen = new Set();
  return jobs.filter((j) => {
    const key = `${j.title}-${j.company}-${j.location}`.toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
};

const hasAdzunaKeys = () => {
  const id = process.env.ADZUNA_APP_ID;
  const key = process.env.ADZUNA_APP_KEY;
  return id && key && id !== 'your_adzuna_app_id' && key !== 'your_adzuna_app_key';
};

const hasJSearchKey = () => {
  const key = process.env.RAPIDAPI_KEY;
  return key && key !== 'your_rapidapi_key';
};

// ─── FREE APIs (no key required) ───────────────────────────────────────────

export const fetchRemotiveJobs = async (filters = {}) => {
  try {
    const { data } = await axios.get('https://remotive.com/api/remote-jobs', {
      timeout: 15000,
      headers: { 'User-Agent': USER_AGENT },
    });

    let jobs = data.jobs || [];

    if (filters.title || filters.skills) {
      const q = (filters.title || filters.skills).toLowerCase();
      jobs = jobs.filter(
        (j) =>
          j.title?.toLowerCase().includes(q) ||
          j.tags?.some((t) => t.toLowerCase().includes(q))
      );
    }

    if (filters.category && filters.category !== 'all') {
      jobs = jobs.filter((j) => {
        const n = normalizeJob(
          {
            id: `remotive-${j.id}`,
            title: j.title,
            description: stripHtml(j.description),
          },
          'remotive'
        );
        return matchesCategory(n, filters.category);
      });
    }

    return jobs.slice(0, MAX_PER_SOURCE).map((j) =>
      normalizeJob(
        {
          id: `remotive-${j.id}`,
          title: j.title,
          company: j.company_name || 'Company',
          description: stripHtml(j.description),
          location: j.candidate_required_location || 'Remote',
          city: 'Remote',
          salary: j.salary || 'Not disclosed',
          skills: j.tags || [],
          type: j.job_type || 'FULLTIME',
          remote: true,
          logo: j.company_logo_url || '',
          applyUrl: j.url || '',
          postedAt: j.publication_date,
        },
        'remotive'
      )
    );
  } catch (err) {
    console.error('[Jobs] Remotive:', err.message);
    return [];
  }
};

export const fetchRemoteOkJobs = async (filters = {}) => {
  try {
    const { data } = await axios.get('https://remoteok.com/api', {
      timeout: 15000,
      headers: { 'User-Agent': USER_AGENT },
    });

    let jobs = Array.isArray(data) ? data.filter((j) => j.id && j.position) : [];

    if (filters.title || filters.skills) {
      const q = (filters.title || filters.skills).toLowerCase();
      jobs = jobs.filter(
        (j) =>
          j.position?.toLowerCase().includes(q) ||
          j.tags?.some((t) => String(t).toLowerCase().includes(q))
      );
    }

    if (filters.category && filters.category !== 'all') {
      jobs = jobs.filter((j) => {
        const n = normalizeJob(
          { id: `x`, title: j.position, description: stripHtml(j.description) },
          'remoteok'
        );
        return matchesCategory(n, filters.category);
      });
    }

    return jobs.slice(0, MAX_PER_SOURCE).map((j) =>
      normalizeJob(
        {
          id: `remoteok-${j.id}`,
          title: j.position,
          company: j.company || 'Company',
          description: stripHtml(j.description),
          location: j.location || 'Remote',
          city: 'Remote',
          salary: j.salary || (j.salary_min ? `${j.salary_min}` : 'Not disclosed'),
          skills: (j.tags || []).map(String),
          type: 'FULLTIME',
          remote: true,
          logo: j.company_logo || '',
          applyUrl: j.url || j.apply_url || '',
          postedAt: j.date,
        },
        'remoteok'
      )
    );
  } catch (err) {
    console.error('[Jobs] RemoteOK:', err.message);
    return [];
  }
};

export const fetchJobicyJobs = async (filters = {}, tagOverride = null) => {
  try {
    const params = { count: 50 };
    const cat = filters.category && filters.category !== 'all' ? getCategoryById(filters.category) : null;
    const tag =
      tagOverride ||
      filters.skills ||
      filters.title ||
      (cat && cat.id !== 'all' ? cat.keywords?.[0]?.replace(/\s+/g, '-') : null);
    if (tag) params.tag = tag;
    const { data } = await axios.get('https://jobicy.com/api/v2/remote-jobs', {
      params,
      timeout: 15000,
      headers: { 'User-Agent': USER_AGENT },
    });

    let jobs = data.jobs || [];

    if (filters.title || filters.skills) {
      const q = (filters.title || filters.skills).toLowerCase();
      jobs = jobs.filter(
        (j) =>
          j.jobTitle?.toLowerCase().includes(q) ||
          j.jobIndustry?.some((i) => i.toLowerCase().includes(q))
      );
    }

    if (filters.category && filters.category !== 'all' && !tagOverride) {
      jobs = jobs.filter((j) => {
        const n = normalizeJob(
          { id: 'x', title: j.jobTitle, description: stripHtml(j.jobDescription) },
          'jobicy'
        );
        return matchesCategory(n, filters.category);
      });
    }

    return jobs.map((j) =>
      normalizeJob(
        {
          id: `jobicy-${j.id}`,
          title: j.jobTitle,
          company: j.companyName || 'Company',
          description: stripHtml(j.jobDescription),
          location: j.jobGeo || 'Remote, India',
          city: j.jobGeo || 'India',
          salary: j.annualSalaryMin
            ? `${j.annualSalaryMin} - ${j.annualSalaryMax || ''} ${j.salaryCurrency || ''}`
            : 'Not disclosed',
          skills: j.jobIndustry || [],
          type: j.jobType || 'FULLTIME',
          remote: true,
          logo: j.companyLogo || '',
          applyUrl: j.url || j.jobUrl || '',
          postedAt: j.pubDate,
        },
        'jobicy'
      )
    );
  } catch (err) {
    console.error('[Jobs] Jobicy:', err.message);
    return [];
  }
};

export const fetchArbeitnowJobs = async (filters = {}) => {
  try {
    const { data } = await axios.get('https://www.arbeitnow.com/api/job-board-api', {
      timeout: 15000,
      headers: { 'User-Agent': USER_AGENT },
    });

    let jobs = data.data || [];

    if (filters.title || filters.skills) {
      const q = (filters.title || filters.skills).toLowerCase();
      jobs = jobs.filter(
        (j) =>
          j.title?.toLowerCase().includes(q) ||
          j.description?.toLowerCase().includes(q)
      );
    }

    if (filters.category && filters.category !== 'all') {
      jobs = jobs.filter((j) => {
        const n = normalizeJob(
          { id: 'x', title: j.title, description: stripHtml(j.description) },
          'arbeitnow'
        );
        return matchesCategory(n, filters.category);
      });
    }

    return jobs.slice(0, MAX_PER_SOURCE).map((j) =>
      normalizeJob(
        {
          id: `arbeitnow-${j.slug || j.title}`,
          title: j.title,
          company: j.company_name || 'Company',
          description: stripHtml(j.description),
          location: j.location || 'Remote',
          city: j.location || 'Remote',
          salary: 'Not disclosed',
          skills: j.tags || [],
          type: j.remote ? 'FULLTIME' : 'FULLTIME',
          remote: !!j.remote,
          logo: '',
          applyUrl: j.url || '',
          postedAt: j.created_at,
        },
        'arbeitnow'
      )
    );
  } catch (err) {
    console.error('[Jobs] Arbeitnow:', err.message);
    return [];
  }
};

// ─── APIs with keys (optional) ───────────────────────────────────────────────

const fetchJobicyByCategories = async () => {
  const batch = PAN_INDIA_FETCH_CATEGORIES.slice(0, JOBICY_CATEGORY_BATCH);
  const results = await Promise.allSettled(
    batch.map((cat) => fetchJobicyJobs({}, cat.keywords[0]?.replace(/\s+/g, '-') || cat.id))
  );
  return results.filter((r) => r.status === 'fulfilled').flatMap((r) => r.value);
};

const CAREER_NEST_SLUGS = [
  'customer-support',
  'finance-accounting',
  'operations',
  'sales',
  'human-resources',
];

export const fetchCareerNestJobs = async (filters = {}) => {
  try {
    const slugs =
      filters.category && filters.category !== 'all'
        ? [filters.category]
        : CAREER_NEST_SLUGS;

    const results = await Promise.allSettled(
      slugs.map(async (slug) => {
        const { data } = await axios.get('https://careernest.cloud/api/feed', {
          params: { limit: 30, category: slug, type: 'remote' },
          timeout: 12000,
          headers: { 'User-Agent': USER_AGENT },
        });
        return (data.jobs || []).map((j) =>
          normalizeJob(
            {
              id: `careernest-${j.id}`,
              title: j.title,
              company: j.company || 'Company',
              description: stripHtml(j.description),
              location: j.location || 'Remote',
              city: 'Remote / Pan India',
              salary:
                j.salary && typeof j.salary === 'object'
                  ? `${j.salary.min || ''}-${j.salary.max || ''} ${j.salary.currency || ''}`
                  : 'Not disclosed',
              category: j.category || detectJobCategory(j.title, j.description),
              type: j.job_type || '',
              remote: /remote/i.test(j.location || '') || /remote/i.test(j.job_type || ''),
              logo: j.company_logo || '',
              applyUrl: j.apply_url || j.job_url || '',
              postedAt: j.posted_at,
            },
            'careernest'
          )
        );
      })
    );

    let jobs = results.filter((r) => r.status === 'fulfilled').flatMap((r) => r.value);
    const q = filters.title || filters.skills;
    if (q) jobs = jobs.filter((j) => matchesSearchQuery(j, q));
    if (filters.category && filters.category !== 'all') {
      jobs = jobs.filter((j) => matchesCategory(j, filters.category));
    }
    return jobs;
  } catch (err) {
    console.error('[Jobs] CareerNest:', err.message);
    return [];
  }
};

export const fetchAdzunaJobs = async (filters = {}) => {
  if (!hasAdzunaKeys()) return [];

  const country = process.env.ADZUNA_COUNTRY || 'in';
  const cat = getCategoryById(filters.category);
  const searchWhat =
    filters.title ||
    filters.skills ||
    (cat.id !== 'all' ? cat.keywords[0] : '') ||
    'jobs';

  const fetchOne = async (city) => {
    const params = {
      app_id: process.env.ADZUNA_APP_ID,
      app_key: process.env.ADZUNA_APP_KEY,
      results_per_page: 20,
      what: searchWhat,
      where: city || 'India',
    };

    const { data } = await axios.get(
      `https://api.adzuna.com/v1/api/jobs/${country}/search/1`,
      { params, timeout: 12000 }
    );

    return (data.results || []).map((j) =>
      normalizeJob(
        {
          id: `adzuna-${j.id}-${city}`,
          title: j.title,
          company: j.company?.display_name || 'Company',
          description: stripHtml(j.description),
          location: j.location?.display_name || city,
          city,
          salary: j.salary_min ? `₹${j.salary_min} - ${j.salary_max || ''}` : 'Not disclosed',
          type: j.contract_type || '',
          remote: /remote/i.test(j.location?.display_name || ''),
          logo: j.company?.logo_url || '',
          applyUrl: j.redirect_url || '',
          postedAt: j.created,
        },
        'adzuna'
      )
    );
  };

  try {
    if (isAllIndia(filters.location)) {
      const results = await runBatched(INDIAN_CITIES, (city) => fetchOne(city), 6);
      return results
        .filter((r) => r.status === 'fulfilled')
        .flatMap((r) => r.value);
    }
    return await fetchOne(filters.location);
  } catch (err) {
    console.error('[Jobs] Adzuna:', err.message);
    return [];
  }
};

const fetchJSearchOne = async (query) => {
  const { data } = await axios.get('https://jsearch.p.rapidapi.com/search', {
    params: { query, page: '1', num_pages: '1', date_posted: 'month', country: 'in' },
    headers: {
      'x-rapidapi-key': process.env.RAPIDAPI_KEY,
      'x-rapidapi-host': 'jsearch.p.rapidapi.com',
    },
    timeout: 20000,
  });
  return data.data || [];
};

export const fetchJSearchJobs = async (filters = {}) => {
  if (!hasJSearchKey()) return [];

  const locationPart = isAllIndia(filters.location) ? 'India' : `${filters.location} India`;

  let queries = [];
  if (filters.title || filters.skills) {
    queries = [[filters.title || filters.skills, locationPart].filter(Boolean).join(' ')];
  } else if (filters.category && filters.category !== 'all') {
    const cat = getCategoryById(filters.category);
    queries = [[`${cat.keywords[0]} ${locationPart}`]];
  } else if (isAllIndia(filters.location)) {
    queries = PAN_INDIA_FETCH_CATEGORIES.slice(0, 8).map(
      (c) => `${c.keywords[0]} ${locationPart}`
    );
  } else {
    queries = [`jobs ${locationPart}`];
  }

  try {
    const results = await Promise.allSettled(queries.map((q) => fetchJSearchOne(q)));
    const uniqueRaw = [];
    const seenIds = new Set();
    for (const r of results.filter((x) => x.status === 'fulfilled').flatMap((x) => x.value)) {
      if (!seenIds.has(r.job_id)) {
        seenIds.add(r.job_id);
        uniqueRaw.push(r);
      }
    }

    return uniqueRaw.map((j) =>
      normalizeJob(
        {
          id: `jsearch-${j.job_id}`,
          title: j.job_title,
          company: j.employer_name || 'Company',
          description: stripHtml(j.job_description),
          location: [j.job_city, j.job_state, j.job_country].filter(Boolean).join(', '),
          city: j.job_city || 'India',
          salary: j.job_min_salary
            ? `${j.job_min_salary} - ${j.job_max_salary || ''} ${j.job_salary_currency || ''}`
            : 'Not disclosed',
          experience: j.job_required_experience?.required_experience_in_months
            ? `${Math.round(j.job_required_experience.required_experience_in_months / 12)} years`
            : '',
          skills: j.job_required_skills || [],
          type: j.job_employment_type || '',
          remote: j.job_is_remote || false,
          logo: j.employer_logo || '',
          applyUrl: j.job_apply_link || j.job_google_link || '',
          postedAt: j.job_posted_at_datetime_utc,
        },
        'jsearch'
      )
    );
  } catch (err) {
    console.error('[Jobs] JSearch:', err.message);
    return [];
  }
};

// ─── Client-side filters ─────────────────────────────────────────────────────

export const applyClientFilters = (all, filters) => {
  let jobs = [...all];

  if (filters.title) {
    const q = filters.title.toLowerCase();
    jobs = jobs.filter(
      (j) =>
        j.title?.toLowerCase().includes(q) || j.description?.toLowerCase().includes(q)
    );
  }

  if (filters.skills) {
    const q = filters.skills.toLowerCase();
    jobs = jobs.filter((j) => matchesSearchQuery(j, q));
  }

  if (filters.category && filters.category !== 'all') {
    jobs = jobs.filter((j) => matchesCategory(j, filters.category));
  }

  if (filters.location && !isAllIndia(filters.location)) {
    const q = filters.location.toLowerCase();
    jobs = jobs.filter(
      (j) =>
        j.location?.toLowerCase().includes(q) ||
        j.city?.toLowerCase().includes(q) ||
        j.description?.toLowerCase().includes(q) ||
        j.remote
    );
  }

  if (filters.remote === true || filters.remote === 'true') {
    jobs = jobs.filter((j) => j.remote);
  }

  if (filters.fullTime === true || filters.fullTime === 'true') {
    jobs = jobs.filter((j) => /full|permanent/i.test(j.type || ''));
  }

  if (filters.partTime === true || filters.partTime === 'true') {
    jobs = jobs.filter((j) => /part|contract|freelance/i.test(j.type || ''));
  }

  if (filters.freshers === true || filters.freshers === 'true') {
    jobs = jobs.filter((j) =>
      /fresher|entry|0-1|junior|graduate/i.test(
        `${j.experience || ''} ${j.description || ''} ${j.title || ''}`
      )
    );
  }

  if (filters.experience) {
    const q = filters.experience.toLowerCase();
    jobs = jobs.filter(
      (j) =>
        j.experience?.toLowerCase().includes(q) ||
        j.description?.toLowerCase().includes(q)
    );
  }

  return jobs;
};

// ─── Main: fetch live from ALL APIs directly ───────────────────────────────

export const fetchAllJobs = async (filters = {}) => {
  const panIndia = isAllIndia(filters.location);
  const locationLabel = panIndia ? 'All India' : filters.location;
  const searchFilters = {
    ...filters,
    location: panIndia ? 'all india' : filters.location,
  };
  const userSearch = filters.title || filters.skills || (filters.category && filters.category !== 'all');

  console.log(
    `[Jobs] Fetching live jobs — ${locationLabel}, fields: ${filters.category || 'all'}`
  );

  const indiaFilters = { ...filters, location: locationLabel };

  const useCityGoogleJobs = hasJSearchKeyProvider();
  const jsearchPromise = useCityGoogleJobs
    ? fetchJSearchCityJobs(indiaFilters, normalizeJob)
    : fetchJSearchJobs(searchFilters);

  const baseFetches = Promise.all([
    fetchRemotiveJobs(searchFilters),
    fetchRemoteOkJobs(searchFilters),
    fetchJobicyJobs(searchFilters),
    fetchArbeitnowJobs(searchFilters),
    fetchAdzunaJobs(indiaFilters),
    jsearchPromise,
    fetchJoobleJobs(indiaFilters, normalizeJob),
    fetchCareerjetJobs(indiaFilters, normalizeJob),
  ]);

  const extraFetches =
    panIndia && !userSearch
      ? Promise.all([fetchJobicyByCategories()])
      : Promise.resolve([[]]);

  const [[remotive, remoteok, jobicy, arbeitnow, adzuna, jsearch, jooble, careerjet], [jobicyExtra]] =
    await Promise.all([baseFetches, extraFetches]);

  const jobicyAll = dedupeJobs([...jobicy, ...jobicyExtra]);

  const remoteGlobal = filterIndiaRelevant(
    dedupeJobs([...remotive, ...remoteok, ...jobicyAll, ...arbeitnow]),
    locationLabel
  );

  const sources = {
    jooble: jooble.length,
    careerjet: careerjet.length,
    'google-jobs': jsearch.filter((j) => j.source === 'google-jobs').length || jsearch.length,
    adzuna: adzuna.length,
    remotive: remotive.length,
    remoteok: remoteok.length,
    jobicy: jobicyAll.length,
    arbeitnow: arbeitnow.length,
  };

  let all = dedupeJobs([
    ...jooble,
    ...careerjet,
    ...jsearch,
    ...adzuna,
    ...remoteGlobal,
  ]);

  all = enrichJobs(all);

  console.log('[Jobs] Live API results:', sources, '| Total:', all.length);

  all = applyClientFilters(all, filters);

  all.sort((a, b) => {
    const dateA = a.postedAt ? new Date(a.postedAt).getTime() : 0;
    const dateB = b.postedAt ? new Date(b.postedAt).getTime() : 0;
    return dateB - dateA;
  });

  return { jobs: all, sources, live: true };
};

export const getJobById = async (jobId, filters = {}) => {
  const { jobs } = await fetchAllJobs(filters);
  return jobs.find((j) => j.id === jobId) || null;
};

export const getIndianCities = () => INDIAN_CITIES;

export const getJobCategories = () => JOB_CATEGORIES;

export const getApiStatus = () => ({
  freeAlways: ['remotive', 'remoteok', 'jobicy', 'arbeitnow'],
  googleJobs: hasJSearchKeyProvider(),
  jooble: hasJoobleKey(),
  careerjet: hasCareerjetAffid(),
  adzuna: hasAdzunaKeys(),
  jsearch: hasJSearchKey(),
  remotive: true,
  remoteok: true,
  jobicy: true,
  arbeitnow: true,
  allIndiaCities: INDIAN_CITIES.length,
  jobFields: JOB_CATEGORIES.length - 1,
  setupHint:
  !hasJSearchKeyProvider() && !hasJoobleKey() && !hasAdzunaKeys()
      ? 'Add RAPIDAPI_KEY (Google Jobs), JOOBLE_API_KEY, or ADZUNA keys in backend/.env for city-wise India jobs'
      : null,
});
