const DEFAULT_ORIGINS = [
  'http://localhost:5173',
  'https://eliteplacement.netlify.app',
];

const parseClientUrls = () => {
  const fromEnv = (process.env.CLIENT_URL || '')
    .split(',')
    .map((url) => url.trim())
    .filter(Boolean);

  return [...new Set([...DEFAULT_ORIGINS, ...fromEnv])];
};

export const CLIENT_URLS = parseClientUrls();

export const PRIMARY_CLIENT_URL =
  CLIENT_URLS.find((url) => url.startsWith('https://')) || CLIENT_URLS[0];

export const isAllowedOrigin = (origin) =>
  !origin || CLIENT_URLS.includes(origin);
