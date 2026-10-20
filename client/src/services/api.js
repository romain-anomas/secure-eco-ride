import axios from 'axios';

const TOKEN_KEY = 'ser_admin_token';

// A free Render API can take about a minute to wake after idling. Give its first
// request enough time to finish instead of reporting a false connection failure.
export const api = axios.create({ baseURL: import.meta.env.VITE_API_URL || '/api', timeout: 90000 });

/** Resolve API-hosted media paths against the configured API origin. */
export function resolveAssetUrl(value) {
  if (typeof value !== 'string' || !value) return value;
  if (/^(?:https?:|data:|blob:)/i.test(value)) return value;
  try {
    const base = api.defaults.baseURL;
    const origin = /^https?:\/\//i.test(base) ? base : window.location.origin;
    return new URL(value, origin).toString();
  } catch { return value; }
}

const ASSET_KEYS = new Set(['image_url', 'hero_image_url', 'logo_url', 'customer_photo_url']);
function resolveAssets(value) {
  if (Array.isArray(value)) { value.forEach(resolveAssets); return; }
  if (!value || typeof value !== 'object') return;
  Object.entries(value).forEach(([key, child]) => {
    if (ASSET_KEYS.has(key) && typeof child === 'string') value[key] = resolveAssetUrl(child);
    else resolveAssets(child);
  });
}

api.interceptors.response.use((response) => {
  resolveAssets(response.data);
  return response;
});

export const getToken = () => localStorage.getItem(TOKEN_KEY);
export const setToken = (t) => (t ? localStorage.setItem(TOKEN_KEY, t) : localStorage.removeItem(TOKEN_KEY));

api.interceptors.request.use((cfg) => {
  const t = getToken();
  if (t) cfg.headers.Authorization = `Bearer ${t}`;
  return cfg;
});

api.interceptors.response.use(
  (r) => r,
  (err) => {
    // Expired admin session -> back to login
    if (err.response?.status === 401 && getToken() && !err.config.url.includes('/auth/login')) {
      setToken(null);
      if ((location.pathname.startsWith('/admin') || location.pathname.startsWith('/driver')) && location.pathname !== '/admin/login') location.assign('/admin/login');
    }
    return Promise.reject(err);
  },
);

/** Turns any axios error into { message, fields } that forms can show. */
export function parseError(err) {
  const e = err?.response?.data?.error;
  const fields = {};
  (e?.details || []).forEach((d) => { if (d.field && !fields[d.field]) fields[d.field] = d.message; });
  let message = e?.message;
  if (!message) {
    if (err && !err.isAxiosError && err.message) message = err.message; // plain Error thrown by our own code
    else if (err?.code === 'ECONNABORTED' || err?.code === 'ETIMEDOUT') message = 'The server is taking longer than usual to respond. It may be starting up; please wait and try again.';
    else if (!err?.response) message = 'Cannot reach the server. Please check your connection or call us to book.';
    else message = 'Something went wrong. Please try again.';
  }
  return { message, fields, status: err?.response?.status };
}

export const get = (url, params) => api.get(url, { params }).then((r) => r.data);
export const post = (url, body) => api.post(url, body).then((r) => r.data);
export const patch = (url, body) => api.patch(url, body).then((r) => r.data);
export const put = (url, body) => api.put(url, body).then((r) => r.data);
export const del = (url) => api.delete(url).then((r) => r.data);
