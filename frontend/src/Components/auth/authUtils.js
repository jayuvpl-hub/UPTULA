export function registrationEmailInput(email) {
  return String(email || '').trim();
}

export function apiErrorMessage(data, fallback) {
  return (
    data?.message ||
    (Array.isArray(data?.errors) && data.errors[0]?.msg) ||
    fallback
  );
}

export function otpDeliveryTarget(sentVia) {
  let via = sentVia;
  if (Array.isArray(sentVia)) {
    const hasEmail = sentVia.includes('email');
    const hasSms = sentVia.includes('sms');
    via = hasEmail && hasSms ? 'both' : hasSms ? 'sms' : 'email';
  }
  if (via === 'sms') return 'your phone';
  if (via === 'both') return 'your email and phone';
  return 'your email';
}

export function isAuthSuccessMessage(text) {
  const t = String(text || '').toLowerCase();
  if (!t) return false;
  if (
    t.includes('not found') ||
    t.includes('incorrect') ||
    t.includes('failed') ||
    t.includes('error') ||
    t.includes('do not match') ||
    t.includes('at least') ||
    t.includes('maximum resend') ||
    t.includes('missing:') ||
    t.includes('registered as')
  ) {
    return false;
  }
  return (
    t.includes('success') ||
    t.includes('otp sent') ||
    t.includes('otp resent') ||
    t.includes('verified') ||
    (t.includes('otp') && t.includes('sent'))
  );
}

export function toApiRole(role) {
  return role === 'employer' ? 'provider' : 'seeker';
}

export function dashboardPathForRole(apiRole) {
  return apiRole === 'provider' ? '/employer/profile' : '/profile';
}

export function loginPathForRole(role) {
  return role === 'employer' ? '/employer/login' : '/login';
}

export function registerPathForRole(role) {
  return role === 'employer' ? '/employer/register' : '/register';
}

export function isSafeRedirect(path) {
  if (!path || typeof path !== 'string') return false;
  if (!path.startsWith('/')) return false;
  if (path.startsWith('//')) return false;
  if (/^[a-zA-Z][a-zA-Z0-9+.-]*:/.test(path)) return false;
  return true;
}

export function resolvePostLoginPath(apiRole, redirectParam) {
  if (isSafeRedirect(redirectParam)) return redirectParam;
  return dashboardPathForRole(apiRole);
}

export function closeBootstrapModal(modalId) {
  const el = document.getElementById(modalId);
  if (el) {
    el.classList.remove('in');
    el.style.display = 'none';
  }
  document.body.classList.remove('modal-open');
  document.querySelectorAll('.modal-backdrop').forEach((b) => {
    if (b.parentNode) b.parentNode.removeChild(b);
  });
}

export function roleMismatchMessage(expectedApiRole) {
  return expectedApiRole === 'provider'
    ? 'This account is registered as a candidate. Please use Job Seeker login.'
    : 'This account is registered as an employer. Please use Employer login.';
}
