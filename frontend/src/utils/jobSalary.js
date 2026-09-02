/**
 * Display label for job salary (negotiable or min–max range).
 */
export function formatJobSalary(job) {
  if (!job) return '';

  const salaryType = String(job.salaryType || job.salary_type || '').toLowerCase();
  const legacyRange = String(job.salaryRange || job.salary_range || job.salary || job.offeredSalary || '').trim();

  if (salaryType === 'negotiable' || legacyRange.toLowerCase() === 'negotiable') {
    return 'Negotiable';
  }

  let min = job.salaryMin ?? job.salary_min;
  let max = job.salaryMax ?? job.salary_max;

  if ((min == null || max == null) && /^\d+-\d+$/.test(legacyRange)) {
    const [minPart, maxPart] = legacyRange.split('-');
    min = parseInt(minPart, 10);
    max = parseInt(maxPart, 10);
  }

  if (Number.isInteger(min) && Number.isInteger(max) && min > 0 && max > 0) {
    const fmt = (n) => Number(n).toLocaleString('en-IN');
    return `${fmt(min)} - ${fmt(max)}`;
  }

  if (legacyRange && legacyRange.toLowerCase() !== 'negotiable') {
    return legacyRange;
  }

  return '';
}

/**
 * Build /jobs search query for salary filter from a job (fixed range only).
 */
export function getJobSalaryFilterSearch(job) {
  if (!job) return null;

  const salaryType = String(job.salaryType || job.salary_type || '').toLowerCase();
  const legacyRange = String(job.salaryRange || job.salary_range || '').trim();

  if (salaryType === 'negotiable' || legacyRange.toLowerCase() === 'negotiable') {
    return null;
  }

  let min = job.salaryMin ?? job.salary_min;
  let max = job.salaryMax ?? job.salary_max;

  if ((min == null || max == null) && /^\d+-\d+$/.test(legacyRange)) {
    const [minPart, maxPart] = legacyRange.split('-');
    min = parseInt(minPart, 10);
    max = parseInt(maxPart, 10);
  }

  if (!Number.isInteger(min) || !Number.isInteger(max) || min <= 0 || max <= 0) {
    return null;
  }

  const params = new URLSearchParams();
  params.set('minSalary', String(min));
  params.set('maxSalary', String(max));
  return `?${params.toString()}`;
}

/** Sidebar salary filter options (labels aligned with minSalary / maxSalary API). */
export const SALARY_FILTER_OPTIONS = [
  { value: 'under-10000', label: 'Under 10,000', minSalary: null, maxSalary: 10000 },
  { value: '10000-15000', label: '10,000 - 15,000', minSalary: 10000, maxSalary: 15000 },
  { value: '15000-20000', label: '15,000 - 20,000', minSalary: 15000, maxSalary: 20000 },
  { value: '20000-30000', label: '20,000 - 30,000', minSalary: 20000, maxSalary: 30000 },
  { value: '30000-plus', label: '30,000+', minSalary: 30000, maxSalary: null },
];

export function findSalaryFilterByRange(minSalary, maxSalary) {
  const min = minSalary != null && minSalary !== '' ? parseInt(minSalary, 10) : null;
  const max = maxSalary != null && maxSalary !== '' ? parseInt(maxSalary, 10) : null;
  return SALARY_FILTER_OPTIONS.find((opt) => {
    const optMin = opt.minSalary;
    const optMax = opt.maxSalary;
    return optMin === min && optMax === max;
  }) || null;
}
