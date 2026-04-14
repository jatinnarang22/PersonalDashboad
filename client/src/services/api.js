import axios from 'axios';

const baseURL =
  import.meta.env.VITE_API_URL?.replace(/\/$/, '') ||
  (import.meta.env.DEV ? '/api' : 'http://localhost:3000/api');

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
  const base =
    import.meta.env.VITE_API_URL?.replace(/\/$/, '') ||
    (typeof window !== 'undefined' ? `${window.location.origin}/api` : '/api');
  return `${base}/integrations/${kind}/start`;
}

export const integrationsApi = {
  status: () => api.get('/integrations/status'),
  youtubeSummary: () => api.get('/integrations/youtube/summary'),
  instagramSummary: () => api.get('/integrations/instagram/summary'),
  youtubeDisconnect: () => api.delete('/integrations/youtube'),
  instagramDisconnect: () => api.delete('/integrations/instagram'),
  /** Page access token + Instagram User ID — saved on your user in MongoDB (same as OAuth). */
  instagramManual: (payload) =>
    api.post('/integrations/instagram/manual', payload),
  /** User token with pages_show_list + instagram_basic; server resolves Page + IG account. */
  instagramFromUserToken: (payload) =>
    api.post('/integrations/instagram/from-user-token', payload),
};
