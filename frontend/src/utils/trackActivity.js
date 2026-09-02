import { API_BASE_URL } from '../config/api';

function getAuthHeaders() {
  const token = localStorage.getItem('token');
  if (!token) return null;
  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
  };
}

function isSeekerUser() {
  try {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    return user.role === 'seeker';
  } catch {
    return false;
  }
}

let searchDebounceTimer = null;

/** POST /api/track/search — logged-in candidates only, fire-and-forget */
export async function trackSearch(keyword) {
  const kw = String(keyword || '').trim();
  if (!kw || !isSeekerUser()) return;
  const headers = getAuthHeaders();
  if (!headers) return;
  try {
    await fetch(`${API_BASE_URL}/api/track/search`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ keyword: kw }),
    });
  } catch (err) {
    console.warn('[trackActivity] search:', err);
  }
}

/** Debounced search tracking for live typing in search bars */
export function trackSearchDebounced(keyword, delayMs = 400) {
  clearTimeout(searchDebounceTimer);
  const kw = String(keyword || '').trim();
  if (!kw || !isSeekerUser()) return;
  searchDebounceTimer = setTimeout(() => {
    trackSearch(kw);
  }, delayMs);
}

/** POST /api/track/job-view — logged-in candidates only, fire-and-forget */
export async function trackJobView(jobId) {
  const id = Number(jobId);
  if (!id || Number.isNaN(id) || !isSeekerUser()) return;
  const headers = getAuthHeaders();
  if (!headers) return;
  try {
    await fetch(`${API_BASE_URL}/api/track/job-view`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ jobId: id }),
    });
  } catch (err) {
    console.warn('[trackActivity] job-view:', err);
  }
}
