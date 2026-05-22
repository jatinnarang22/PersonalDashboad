import axios from 'axios';

/**
 * Dev default: `/api` (Vite proxy → backend). Prod default: Express on 3000.
 * If `VITE_API_URL` is set to `http://localhost:3000` (no path), `/api` is appended
 * so routes hit `/api/auth/...`, not `/auth/...` (which returns 404).
 */
export function resolveApiBaseURL() {
  const raw = import.meta.env.VITE_API_URL?.trim();
  if (!raw) {
    return import.meta.env.DEV ? '/api' : 'http://localhost:3000/api';
  }
  const u = raw.replace(/\/+$/, '');
  if (u === '/api' || u.endsWith('/api') || /\/api\//.test(u)) return u;
  if (/^https?:\/\//i.test(u)) {
    return `${u}/api`;
  }
  if (u.startsWith('/')) {
    return u === '/api' ? u : `${u}/api`;
  }
  return u;
}

const baseURL = resolveApiBaseURL();

export const api = axios.create({
  baseURL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

export function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

export const logsApi = {
  list: () => api.get('/logs'),
  getByDate: (date) => api.get(`/logs/${date}`),
  create: (payload) => api.post('/logs', payload),
};

export const projectsApi = {
  list: () => api.get('/projects'),
  create: (payload) => api.post('/projects', payload),
  update: (id, payload) => api.patch(`/projects/${id}`, payload),
};

export const goalsApi = {
  get: () => api.get('/goals'),
  save: (payload) => api.post('/goals', payload),
};

export const insightsApi = {
  today: () => api.get('/insights/today'),
};

/** Stubs — replace with real auth headers (Bearer, cookies) when you implement auth. */
export const authApi = {
  register: (payload) => api.post('/auth/register', payload),
  login: (payload) => api.post('/auth/login', payload),
  logout: () => api.post('/auth/logout'),
  me: () => api.get('/auth/me'),
};

export const profileApi = {
  get: () => api.get('/profile'),
  update: (payload) => api.put('/profile', payload),
};

/** Browser must navigate here (session cookie); not axios. */
export function integrationOAuthStartUrl(kind) {
  const base = resolveApiBaseURL();
  const path = `/integrations/${kind}/start`;
  if (/^https?:\/\//i.test(base)) {
    return `${base.replace(/\/$/, '')}${path}`;
  }
  if (typeof window === 'undefined') {
    return `${base.replace(/\/$/, '')}${path}`;
  }
  return new URL(`${base.replace(/\/$/, '')}${path}`, window.location.origin).href;
}

export const integrationsApi = {
  status: () => api.get('/integrations/status'),
  youtubeSummary: () => api.get('/integrations/youtube/summary'),
  instagramSummary: () => api.get('/integrations/instagram/summary'),
  githubSummary: () => api.get('/integrations/github/summary'),
  /** Contribution calendar + recent events for GitHub workspace */
  githubActivity: () => api.get('/integrations/github/activity'),
  wakatimeSummary: () => api.get('/integrations/wakatime/summary'),
  youtubeDisconnect: () => api.delete('/integrations/youtube'),
  instagramDisconnect: () => api.delete('/integrations/instagram'),
  githubDisconnect: () => api.delete('/integrations/github'),
  wakatimeDisconnect: () => api.delete('/integrations/wakatime'),
  githubConnect: (payload) => api.post('/integrations/github/connect', payload),
  wakatimeConnect: (payload) => api.post('/integrations/wakatime/connect', payload),
  trends: (platform, days = 7) =>
    api.get(`/integrations/trends/${platform}`, { params: { days } }),
  /** Page access token + Instagram User ID — saved on your user in MongoDB (same as OAuth). */
  instagramManual: (payload) =>
    api.post('/integrations/instagram/manual', payload),
  /** User token with pages_show_list + instagram_basic; server resolves Page + IG account. */
  instagramFromUserToken: (payload) =>
    api.post('/integrations/instagram/from-user-token', payload),
};
