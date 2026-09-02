// Centralized API base URL for frontend requests
// REACT_APP_API_URL — explicit override (e.g. https://uptula.com)
// REACT_APP_USE_PRODUCTION_API=true — local dev via setupProxy (same-origin /api, /uploads)
//
// IMPORTANT: .env.local overrides .env.production during `npm run build`.
// Never put REACT_APP_API_URL=http://localhost:5000 in .env.local if you deploy that build.

const useProductionApi = process.env.REACT_APP_USE_PRODUCTION_API === 'true';
const isProdBuild = process.env.NODE_ENV === 'production';
const PRODUCTION_API_URL = 'https://uptula.com';
const LOCALHOST_API_PATTERN = /localhost|127\.0\.0\.1/i;

function isBrowserOnLocalHost() {
  if (typeof window === 'undefined') return false;
  const host = window.location.hostname;
  return host === 'localhost' || host === '127.0.0.1';
}

function resolveApiBaseUrl() {
  let configured = process.env.REACT_APP_API_URL;

  if (isProdBuild) {
    // Production bundle must never use localhost (common .env.local leak during build).
    if (!configured || LOCALHOST_API_PATTERN.test(String(configured))) {
      configured = PRODUCTION_API_URL;
    }
  } else if (!configured) {
    configured =
      useProductionApi && process.env.NODE_ENV === 'development'
        ? ''
        : 'http://localhost:5000';
  }

  let base = String(configured).replace(/\/$/, '');

  // Runtime guard: live site visitors must never call localhost.
  if (typeof window !== 'undefined' && !isBrowserOnLocalHost() && LOCALHOST_API_PATTERN.test(base)) {
    base = window.location.origin;
  }

  return base;
}

export const API_BASE_URL = resolveApiBaseUrl();

/** Call when you need a fresh base URL (e.g. after client-side navigation edge cases). */
export function getApiBaseUrl() {
  return resolveApiBaseUrl();
}

if (typeof window !== 'undefined') {
  const baked = process.env.REACT_APP_API_URL || '(not set)';
  // console.log(
  //   'API_BASE_URL:',
  //   API_BASE_URL,
  //   '| NODE_ENV:',
  //   process.env.NODE_ENV,
  //   '| REACT_APP_API_URL (build-time):',
  //   baked
  // );
}

export default API_BASE_URL;
