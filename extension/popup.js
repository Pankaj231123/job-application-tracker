const storageKeys = {
  apiUrl: 'jobTrackerApiUrl',
  token: 'jobTrackerToken',
};

function setStatus(message, isError = false) {
  const status = document.getElementById('status');
  if (!status) return;

  status.textContent = message;
  status.style.color = isError ? '#b91c1c' : '#6b5a4d';
}

function getValues() {
  return {
    apiUrl: document.getElementById('apiUrl')?.value.trim() || '',
    token: document.getElementById('token')?.value.trim() || '',
  };
}

async function loadSettings() {
  const saved = await chrome.storage.local.get([storageKeys.apiUrl, storageKeys.token]);
  if (document.getElementById('apiUrl')) {
    document.getElementById('apiUrl').value = saved[storageKeys.apiUrl] || 'http://localhost:8080';
  }
  if (document.getElementById('token')) {
    document.getElementById('token').value = saved[storageKeys.token] || '';
  }
}

async function saveSettings() {
  const values = getValues();
  if (!values.apiUrl) {
    setStatus('Backend URL is required.', true);
    return;
  }
  if (!values.token) {
    setStatus('JWT token is required.', true);
    return;
  }

  await chrome.storage.local.set({
    [storageKeys.apiUrl]: values.apiUrl,
    [storageKeys.token]: values.token,
  });
  setStatus('Settings saved. Open LinkedIn and use Sync Current Page.');
}

async function syncCurrentPage() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab?.id) {
    setStatus('Open LinkedIn first.', true);
    return;
  }

  chrome.tabs.sendMessage(tab.id, { type: 'JT_SYNC_JOB' }, (response) => {
    if (chrome.runtime.lastError) {
      setStatus('Open a LinkedIn job page, then try again.', true);
      return;
    }

    if (!response?.ok) {
      setStatus(response?.error || 'Sync failed.', true);
      return;
    }

    setStatus(response.message || 'Job synced successfully.');
  });
}

window.addEventListener('DOMContentLoaded', async () => {
  await loadSettings();
  setStatus('');

  document.getElementById('saveSettings')?.addEventListener('click', () => {
    saveSettings().catch((error) => setStatus(error.message || 'Failed to save settings.', true));
  });

  document.getElementById('syncCurrent')?.addEventListener('click', () => {
    syncCurrentPage().catch((error) => setStatus(error.message || 'Sync failed.', true));
  });
});
