const DEFAULT_ORIGINS = [
  'http://localhost:5173',
  'https://eliteplacement.netlify.app',
  'https://elightplacementhub.netlify.app',
];

const normalizeOrigin = (url) => url?.trim().replace(/\/$/, '') || '';

const parseClientUrls = () => {
  const fromEnv = (process.env.CLIENT_URL || '')
    .split(',')
    .map(normalizeOrigin)
    .filter(Boolean);

  return [...new Set([...DEFAULT_ORIGINS.map(normalizeOrigin), ...fromEnv])];
};

export const CLIENT_URLS = parseClientUrls();

export const PRIMARY_CLIENT_URL =
  CLIENT_URLS.find((url) => url.startsWith('https://')) || CLIENT_URLS[0];

const isNetlifyOrigin = (origin) =>
  /^https:\/\/[\w-]+\.netlify\.app$/i.test(origin);

export const isAllowedOrigin = (origin) => {
  if (!origin) return true;
  const normalized = normalizeOrigin(origin);
  return CLIENT_URLS.includes(normalized) || isNetlifyOrigin(normalized);
};

export const corsOrigin = (origin, callback) => {
  if (isAllowedOrigin(origin)) {
    callback(null, true);
    return;
  }
  callback(null, false);
};
