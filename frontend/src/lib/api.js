const API_BASE_URL = (import.meta.env.VITE_API_URL || 'http://localhost:8080').replace(/\/$/, '');

async function request(path, { method = 'GET', body, ...rest } = {}) {
  const init = { method, credentials: 'include', ...rest };

  if (body !== undefined) {
    init.headers = { 'Content-Type': 'application/json', ...init.headers };
    init.body = JSON.stringify(body);
  }

  const response = await fetch(`${API_BASE_URL}${path}`, init);
  const payload = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(payload.error || 'Something went wrong. Please try again.');
  }

  return payload;
}

export const loginUser = (credentials) => request('/auth/login', { method: 'POST', body: credentials });
export const logoutUser = () => request('/auth/logout', { method: 'POST', body: {} });
export const registerUser = (credentials) => request('/auth/register', { method: 'POST', body: credentials });
export const getMe = () => request('/me');
export const getDashboard = () => request('/dashboard');
export const getJobs = () => request('/jobs');
export const getJob = (id) => request(`/jobs/${id}`);
export const createJob = (job) => request('/jobs', { method: 'POST', body: job });
export const updateJob = (id, job) => request(`/jobs/${id}`, { method: 'PUT', body: job });
export const deleteJob = (id) => request(`/jobs/${id}`, { method: 'DELETE' });
export const searchPublicJobs = (query) => request(`/public/jobs/search?query=${encodeURIComponent(query)}`);
export const syncJob = (job) => request('/jobs/sync', { method: 'POST', body: job });
