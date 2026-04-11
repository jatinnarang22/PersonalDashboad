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
