const parseClientUrls = () =>
  (process.env.CLIENT_URL || 'http://localhost:5173')
    .split(',')
    .map((url) => url.trim())
    .filter(Boolean);

export const CLIENT_URLS = parseClientUrls();

export const PRIMARY_CLIENT_URL =
  CLIENT_URLS.find((url) => url.startsWith('https://')) || CLIENT_URLS[0];

export const isAllowedOrigin = (origin) =>
  !origin || CLIENT_URLS.includes(origin);
