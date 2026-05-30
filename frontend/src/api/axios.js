import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || '/api';

const api = axios.create({
  baseURL: API_URL,
  timeout: 120000,
  headers: { 'Content-Type': 'application/json' },
});

export function getApiErrorMessage(err, fallback = 'Request failed') {
  if (err?.code === 'ECONNABORTED') {
    return 'Server is taking too long. Please wait 1 minute and try again.';
  }
  if (!err?.response) {
    return 'Cannot reach server. Check internet or try again shortly.';
  }
  return err.response?.data?.message || fallback;
}

let warmupPromise = null;

export function warmUpApi() {
  if (!warmupPromise) {
    warmupPromise = api.get('/health').catch(() => {}).finally(() => {
      warmupPromise = null;
    });
  }
  return warmupPromise;
}

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
    }
    return Promise.reject(err);
  }
);

export default api;
