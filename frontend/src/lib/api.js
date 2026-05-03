const API_BASE_URL = (import.meta.env.VITE_API_URL || 'http://localhost:8080').replace(/\/$/, '');

function getAuthHeaders() {
  const token = localStorage.getItem('job-tracker-token');

  return token
    ? {
        Authorization: `Bearer ${token}`,
      }
    : {};
}

async function request(path, body) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
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

export function registerUser(credentials) {
  return request('/auth/register', credentials);
}

export async function getDashboard() {
  const response = await fetch(`${API_BASE_URL}/dashboard`, {
    headers: {
      ...getAuthHeaders(),
    },
  });

  const payload = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(payload.error || 'Failed to load dashboard.');
  }

  return payload;
}

export async function getJobs() {
  const response = await fetch(`${API_BASE_URL}/jobs`, {
    headers: {
      ...getAuthHeaders(),
    },
  });

  const payload = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(payload.error || 'Failed to load jobs.');
  }

  return payload;
}

export async function getJob(id) {
  const response = await fetch(`${API_BASE_URL}/jobs/${id}`, {
    headers: {
      ...getAuthHeaders(),
    },
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
      ...getAuthHeaders(),
    },
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
      ...getAuthHeaders(),
    },
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
    headers: {
      ...getAuthHeaders(),
    },
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
