const storageKeys = {
  apiUrl: 'jobTrackerApiUrl',
  token: 'jobTrackerToken',
};

function cleanText(value) {
  return String(value || '')
    .replace(/\s+/g, ' ')
    .trim();
}

function titleCase(value) {
  return cleanText(value)
    .split(' ')
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(' ');
}

function firstText(selectors) {
  for (const selector of selectors) {
    const element = document.querySelector(selector);
    if (element?.textContent) {
      const value = cleanText(element.textContent);
      if (value) return value;
    }
  }

  return '';
}

function parseFallbackTitleParts() {
  const title = cleanText(document.title).replace(/\s*\|\s*LinkedIn.*$/i, '');
  const parts = title.split(' - ').map(cleanText).filter(Boolean);
  return parts;
}

function extractJobData() {
  const titleSelectors = [
    '.jobs-unified-top-card__job-title',
    '.job-view-layout .t-24',
    'h1',
  ];

  const companySelectors = [
    '.jobs-unified-top-card__company-name a',
    '.jobs-unified-top-card__company-name',
    '.job-view-layout .jobs-unified-top-card__company-name',
    'a[href*="/company/"]',
  ];

  const locationSelectors = [
    '.jobs-unified-top-card__bullet',
    '[data-test-job-location]',
    '.job-view-layout .jobs-unified-top-card__bullet',
  ];

  const titleFallback = parseFallbackTitleParts();
  let title = firstText(titleSelectors) || titleFallback[0] || '';
  let company = firstText(companySelectors) || titleFallback[1] || '';

  if (!company && titleFallback.length > 2) {
    company = titleFallback[titleFallback.length - 2] || '';
  }

  if (!title && titleFallback.length > 1) {
    title = titleFallback[0] || '';
  }

  const locationText = firstText(locationSelectors);

  return {
    company: titleCase(company || 'LinkedIn'),
    title: titleCase(title || 'Applied Job'),
    url: window.location.href.split('?')[0],
    location: titleCase(locationText),
    salary: '',
    notes: 'Synced from LinkedIn',
  };
}

async function getSettings() {
  return chrome.storage.local.get([storageKeys.apiUrl, storageKeys.token]);
}

async function syncJob() {
  const settings = await getSettings();
  const apiUrl = cleanText(settings[storageKeys.apiUrl] || 'http://localhost:8080').replace(/\/$/, '');
  const token = cleanText(settings[storageKeys.token] || '');

  if (!apiUrl) {
    throw new Error('Set the backend URL in the extension popup first.');
  }
  if (!token) {
    throw new Error('Set the JWT token in the extension popup first.');
  }

  const job = extractJobData();
  const response = await fetch(`${apiUrl}/jobs/sync`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      ...job,
      status: 'applied',
      applied_date: new Date().toISOString().slice(0, 10),
    }),
  });

  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(payload.error || 'Failed to sync job.');
  }

  return payload;
}

function createSyncButton() {
  if (document.getElementById('jt-sync-button')) return;
  if (!location.hostname.includes('linkedin.com')) return;
  if (!location.pathname.includes('/jobs/')) return;

  const container = document.createElement('div');
  container.id = 'jt-sync-container';
  container.style.position = 'fixed';
  container.style.right = '20px';
  container.style.bottom = '20px';
  container.style.zIndex = '2147483647';
  container.style.display = 'flex';
  container.style.flexDirection = 'column';
  container.style.gap = '8px';
  container.style.alignItems = 'flex-end';

  const button = document.createElement('button');
  button.id = 'jt-sync-button';
  button.textContent = 'Sync to Job Tracker';
  button.style.border = 'none';
  button.style.borderRadius = '999px';
  button.style.padding = '12px 16px';
  button.style.cursor = 'pointer';
  button.style.fontWeight = '700';
  button.style.color = '#fff';
  button.style.background = 'linear-gradient(135deg, #b45309 0%, #0f766e 100%)';
  button.style.boxShadow = '0 18px 40px rgba(72, 52, 28, 0.22)';

  const status = document.createElement('div');
  status.id = 'jt-sync-status';
  status.style.maxWidth = '240px';
  status.style.padding = '10px 12px';
  status.style.borderRadius = '14px';
  status.style.background = 'rgba(255, 250, 242, 0.96)';
  status.style.border = '1px solid rgba(120, 92, 62, 0.14)';
  status.style.boxShadow = '0 12px 28px rgba(72, 52, 28, 0.16)';
  status.style.color = '#6b5a4d';
  status.style.fontSize = '12px';
  status.style.lineHeight = '1.4';
  status.style.display = 'none';

  function setStatus(message, isError = false) {
    status.textContent = message;
    status.style.color = isError ? '#b91c1c' : '#6b5a4d';
    status.style.display = 'block';
  }

  button.addEventListener('click', async () => {
    button.disabled = true;
    button.textContent = 'Syncing...';
    setStatus('Saving the LinkedIn job into your tracker...');

    try {
      const result = await syncJob();
      setStatus(result.message || 'Job synced successfully.');
    } catch (error) {
      setStatus(error.message || 'Sync failed.', true);
    } finally {
      button.disabled = false;
      button.textContent = 'Sync to Job Tracker';
    }
  });

  container.appendChild(status);
  container.appendChild(button);
  document.body.appendChild(container);
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message?.type === 'JT_GET_JOB_DATA') {
    sendResponse({ ok: true, job: extractJobData() });
    return false;
  }

  if (message?.type === 'JT_SYNC_JOB') {
    syncJob()
      .then((result) => sendResponse({ ok: true, message: result.message || 'Job synced successfully.' }))
      .catch((error) => sendResponse({ ok: false, error: error.message || 'Failed to sync job.' }));
    return true;
  }

  return false;
});

createSyncButton();
setInterval(createSyncButton, 2000);
