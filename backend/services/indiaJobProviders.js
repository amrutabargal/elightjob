import axios from 'axios';
import { USER_AGENT } from '../config/brand.js';
import { INDIAN_CITIES, isAllIndia } from '../data/indianCities.js';
import { getCategoryById } from '../data/jobCategories.js';

const stripHtml = (html) =>
  (html || '')
    .replace(/<[^>]*>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

/** Run async tasks in small batches to avoid rate limits */
export const runBatched = async (items, fn, batchSize = 4) => {
  const out = [];
  for (let i = 0; i < items.length; i += batchSize) {
    const batch = items.slice(i, i + batchSize);
    const results = await Promise.allSettled(batch.map(fn));
    out.push(...results);
  }
  return out;
};

export const getSearchKeywords = (filters) => {
  if (filters.title) return filters.title;
  if (filters.skills) return filters.skills;
  if (filters.category && filters.category !== 'all') {
    const cat = getCategoryById(filters.category);
    if (cat.id !== 'all' && cat.keywords?.[0]) return cat.keywords[0];
  }
  return 'jobs';
};

export const getCitiesForFetch = (location) => {
  if (isAllIndia(location)) {
    return INDIAN_CITIES;
  }
  return [location];
};

export const hasJoobleKey = () => {
  const k = process.env.JOOBLE_API_KEY;
  return k && k !== 'your_jooble_api_key';
};

export const hasCareerjetAffid = () => {
  const a = process.env.CAREERJET_AFFID;
  return a && a !== 'your_careerjet_affid';
};

export const hasJSearchKey = () => {
  const k = process.env.RAPIDAPI_KEY;
  return k && k !== 'your_rapidapi_key';
};

/** Jooble — India city jobs (Naukri-style aggregator). Free key: https://jooble.org/api/about */
export const fetchJoobleJobs = async (filters, normalizeJob) => {
  if (!hasJoobleKey()) return [];

  const apiKey = process.env.JOOBLE_API_KEY;
  const keywords = getSearchKeywords(filters);
  const cities = getCitiesForFetch(filters.location).slice(0, 14);

  try {
    const results = await runBatched(
      cities,
      async (city) => {
        const { data } = await axios.post(
          `https://jooble.org/api/${apiKey}`,
          {
            keywords,
            location: `${city}, India`,
            radius: 80,
            page: 1,
            ResultOnPage: 20,
          },
          {
            timeout: 15000,
            headers: { 'Content-Type': 'application/json' },
          }
        );

        return (data.jobs || []).map((j) =>
          normalizeJob(
            {
              id: `jooble-${j.id || `${city}-${j.title}`.slice(0, 80)}`,
              title: j.title,
              company: j.company || 'Company',
              description: j.snippet || j.description || '',
              location: j.location || `${city}, India`,
              city,
              salary: j.salary || 'Not disclosed',
              type: j.type || '',
              remote: /remote|work from home|wfh/i.test(`${j.type} ${j.location}`),
              applyUrl: j.link || '',
              postedAt: j.updated || null,
            },
            'jooble'
          )
        );
      },
      3
    );

    return results.filter((r) => r.status === 'fulfilled').flatMap((r) => r.value);
  } catch (err) {
    console.error('[Jobs] Jooble:', err.message);
    return [];
  }
};

/** Careerjet — India locale, city search. Free affid: https://www.careerjet.com/partners/ */
export const fetchCareerjetJobs = async (filters, normalizeJob) => {
  if (!hasCareerjetAffid()) return [];

  const keywords = getSearchKeywords(filters);
  const cities = getCitiesForFetch(filters.location).slice(0, 12);

  try {
    const results = await runBatched(
      cities,
      async (city) => {
        const { data } = await axios.get('https://public.api.careerjet.net/search', {
          params: {
            locale_code: 'en_IN',
            affid: process.env.CAREERJET_AFFID,
            user_ip: process.env.CAREERJET_USER_IP || '8.8.8.8',
            user_agent: USER_AGENT,
            keywords,
            location: city,
            pagesize: 15,
            page: 1,
          },
          timeout: 15000,
        });

        if (data.type === 'ERROR') {
          console.warn('[Jobs] Careerjet:', data.error);
          return [];
        }

        return (data.jobs || []).map((j) =>
          normalizeJob(
            {
              id: `careerjet-${j.id || j.url}`,
              title: j.title,
              company: j.company || 'Company',
              description: j.description || '',
              location: j.locations || `${city}, India`,
              city,
              salary: j.salary || j.salary_min || 'Not disclosed',
              type: j.contracttype || '',
              remote: false,
              applyUrl: j.url || '',
              postedAt: j.date || null,
            },
            'careerjet'
          )
        );
      },
      3
    );

    return results.filter((r) => r.status === 'fulfilled').flatMap((r) => r.value);
  } catch (err) {
    console.error('[Jobs] Careerjet:', err.message);
    return [];
  }
};

/** JSearch = Google Jobs + Indeed + LinkedIn (India city queries) */
export const fetchJSearchCityJobs = async (filters, normalizeJob) => {
  if (!hasJSearchKey()) return [];

  const keywords = getSearchKeywords(filters);
  const cities = getCitiesForFetch(filters.location).slice(0, 10);

  const queries = cities.map((city) => `${keywords} jobs in ${city} India`);

  try {
    const results = await runBatched(
      queries,
      async (query) => {
        const { data } = await axios.get('https://jsearch.p.rapidapi.com/search', {
          params: {
            query,
            page: '1',
            num_pages: '1',
            date_posted: 'month',
            country: 'in',
          },
          headers: {
            'x-rapidapi-key': process.env.RAPIDAPI_KEY,
            'x-rapidapi-host': 'jsearch.p.rapidapi.com',
          },
          timeout: 20000,
        });

        return (data.data || []).map((j) =>
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
            'google-jobs'
          )
        );
      },
      2
    );

    const seen = new Set();
    const jobs = [];
    for (const r of results) {
      if (r.status !== 'fulfilled') continue;
      for (const j of r.value) {
        if (!seen.has(j.id)) {
          seen.add(j.id);
          jobs.push(j);
        }
      }
    }
    return jobs;
  } catch (err) {
    console.error('[Jobs] Google Jobs (JSearch):', err.message);
    return [];
  }
};

/** Filter global remote APIs for India / city relevance */
export const filterIndiaRelevant = (jobs, location) => {
  const indiaPattern =
    /\bindia\b|\bindian\b|pan india|south asia|apac|worldwide|anywhere|global/i;
  const cityList = isAllIndia(location)
    ? INDIAN_CITIES.map((c) => c.toLowerCase())
    : [String(location).toLowerCase()];

  return jobs.filter((j) => {
    const text = `${j.title} ${j.location} ${j.city} ${j.description}`.toLowerCase();
    if (j.remote && (indiaPattern.test(text) || isAllIndia(location))) return true;
    if (cityList.some((c) => text.includes(c))) return true;
    if (indiaPattern.test(text)) return true;
    if (['jooble', 'careerjet', 'adzuna', 'google-jobs', 'jsearch'].includes(j.source)) {
      return true;
    }
    return isAllIndia(location);
  });
};
