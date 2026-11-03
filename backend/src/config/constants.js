const DEFAULT_COMPANY_LOGO = 'assets/img/company_logo_1.png';

const ASSET_BASE_URL = (
  process.env.ASSET_BASE_URL || 'https://uptula-app-storage.s3.ap-south-1.amazonaws.com'
).replace(/\/$/, '');

const toPublicAssetUrl = (value) => {
  if (!value) return value;
  const raw = String(value);
  if (raw.startsWith('http://') || raw.startsWith('https://')) return raw;
  if (raw.startsWith('/') || raw.startsWith('uploads/') || raw.startsWith('assets/')) return raw;
  return `${ASSET_BASE_URL}/${raw.replace(/^\/+/, '')}`;
};

const resolveCompanyLogo = (job) => (
  toPublicAssetUrl(job.employer_logo_url || job.company_logo || DEFAULT_COMPANY_LOGO)
);

module.exports = { DEFAULT_COMPANY_LOGO, resolveCompanyLogo, toPublicAssetUrl };
