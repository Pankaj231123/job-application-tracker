const API_BASE_URL = (import.meta.env.VITE_API_URL || 'http://localhost:8080').replace(/\/$/, '');

async function request(path, body, options = {}) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
    body: JSON.stringify(body),
    ...options,
  });

  const payload = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(payload.error || 'Something went wrong. Please try again.');
  }

  return payload;
}

export function loginUser(credentials) {
  return request('/auth/login', credentials);
}

export function logoutUser() {
  return request('/auth/logout', {});
}

export async function getMe() {
  const response = await fetch(`${API_BASE_URL}/me`, {
    credentials: 'include',
  });

  const payload = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(payload.error || 'Failed to fetch user info.');
  }

  return payload;
}

export function registerUser(credentials) {
  return request('/auth/register', credentials);
}

export async function getDashboard() {
  const response = await fetch(`${API_BASE_URL}/dashboard`, {
    credentials: 'include',
  });

  const payload = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(payload.error || 'Failed to load dashboard.');
  }

  return payload;
}

export async function getJobs() {
  const response = await fetch(`${API_BASE_URL}/jobs`, {
    credentials: 'include',
  });

  const payload = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(payload.error || 'Failed to load jobs.');
  }

  return payload;
}

export async function getJob(id) {
  const response = await fetch(`${API_BASE_URL}/jobs/${id}`, {
    credentials: 'include',
  });

  const payload = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(payload.error || 'Failed to load job.');
  }

  return payload;
}

export async function createJob(job) {
  const response = await fetch(`${API_BASE_URL}/jobs`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
    body: JSON.stringify(job),
  });

  const payload = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(payload.error || 'Failed to create job.');
  }

  return payload;
}

export async function updateJob(id, job) {
  const response = await fetch(`${API_BASE_URL}/jobs/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
    body: JSON.stringify(job),
  });

  const payload = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(payload.error || 'Failed to update job.');
  }

  return payload;
}

export async function deleteJob(id) {
  const response = await fetch(`${API_BASE_URL}/jobs/${id}`, {
    method: 'DELETE',
    credentials: 'include',
  });

  const payload = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(payload.error || 'Failed to delete job.');
  }

  return payload;
}

export async function searchPublicJobs(query) {
  const response = await fetch(`${API_BASE_URL}/public/jobs/search?query=${encodeURIComponent(query)}`);

  const payload = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(payload.error || 'Failed to search online jobs.');
  }

  return payload;
}

export async function syncJob(job) {
  const response = await fetch(`${API_BASE_URL}/jobs/sync`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
    body: JSON.stringify(job),
  });

  const payload = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(payload.error || 'Failed to sync job.');
  }

  return payload;
}
