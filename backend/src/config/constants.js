const DEFAULT_COMPANY_LOGO = 'assets/img/company_logo_1.png';

const resolveCompanyLogo = (job) => (
  job.company_logo || job.employer_logo_url || DEFAULT_COMPANY_LOGO
);

module.exports = { DEFAULT_COMPANY_LOGO, resolveCompanyLogo };
