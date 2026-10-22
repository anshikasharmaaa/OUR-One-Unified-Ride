import axios from 'axios';

export const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// The access token lives only in memory. The refresh token is an HttpOnly cookie the browser handles itself.
let accessToken = null;
export const tokenStore = { get: () => accessToken, set: (t) => { accessToken = t; } };

const common = { withCredentials: true, headers: { 'X-Requested-With': 'OUR' }, timeout: 15000 };
export const http = axios.create({ baseURL: API_URL, ...common });

http.interceptors.request.use((cfg) => {
  if (accessToken) cfg.headers.Authorization = `Bearer ${accessToken}`;
  return cfg;
});

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
let inflight = null;

/** Single-flight refresh: concurrent callers (and React StrictMode double-effects) share one request,
 *  so a rotating refresh token is never presented twice. */
export function refreshSession() {
  if (!inflight) {
    inflight = (async () => {
      for (let attempt = 0; attempt < 2; attempt += 1) {
        try {
          const { data } = await axios.post(`${API_URL}/auth/refresh`, null, common);
          tokenStore.set(data.data.accessToken);
          return data.data;
        } catch (err) {
          // Another tab rotated the cookie a moment ago; the browser now holds the new one — retry once.
          if (err.response?.data?.code === 'REFRESH_RACE' && attempt === 0) { await sleep(400); continue; }
          tokenStore.set(null);
          throw err;
        }
      }
      return null;
    })().finally(() => { inflight = null; });
  }
  return inflight;
}

const NO_RETRY = ['/auth/login', '/admin/login', '/driver/login', '/auth/refresh', '/auth/logout'];
const RETRY_CODES = ['TOKEN_EXPIRED', 'INVALID_TOKEN', 'SESSION_REVOKED', 'NO_TOKEN'];

http.interceptors.response.use(
  (r) => r,
  async (error) => {
    const { config, response } = error;
    const retriable =
      response?.status === 401 && config && !config._retried && accessToken &&
      RETRY_CODES.includes(response.data?.code) && !NO_RETRY.some((p) => config.url?.endsWith(p));
    if (!retriable) return Promise.reject(error);
    config._retried = true;
    try {
      const session = await refreshSession();
      config.headers.Authorization = `Bearer ${session.accessToken}`;
      return http(config);
    } catch (refreshErr) {
      window.dispatchEvent(new CustomEvent('our:session-expired'));
      return Promise.reject(refreshErr);
    }
  },
);
