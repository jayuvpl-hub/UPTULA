// function scoreUserForJob(user, job) {
//     let score = 0;
  
//     // user.skills = ["React", "Node.js"]  (already parsed JSON in your profile)
//     // job.skills = "React, Node.js, MySQL" (text field in your jobs table)
  
//     const jobSkills = parseSkills(job.skills)
//     const userSkills = parseSkills(user.skills)
  
//     // +50 skill match
//     const skillOverlap = userSkills.filter(s =>
//       jobSkills.some(js => js.toLowerCase().includes(s.toLowerCase()))
//     )
//     if (skillOverlap.length > 0) score += 50
  
//     // +30 exact role match, +15 similar
//     const jobTitle = (job.job_title || '').toLowerCase()
//     const preferredRole = (user.preferred_role || user.employment_type || '').toLowerCase()
//     if (preferredRole && jobTitle.includes(preferredRole)) score += 30
//     else if (preferredRole && isSimilarRole(preferredRole, jobTitle)) score += 15
  
//     // +10 location match
//     const jobLocation = [job.city, job.state, job.country]
//       .filter(Boolean).map(l => l.toLowerCase())
//     const userLocation = (user.preferred_location || '').toLowerCase()
//     if (userLocation && jobLocation.some(l => l.includes(userLocation))) score += 10
  
//     // +20 behaviour — viewed or searched similar jobs
//     if (user.hasViewedSimilar || user.hasSearchedSimilar) score += 20
  
//     return Math.min(score, 100)
//   }
/**
 * jobScorer.js
 * Pure scoring function — no DB calls, no side effects.
 * Takes a user object + job object, returns score 0-100.
 *
 * Score breakdown:
 *   +50  skill match (at least one skill overlaps)
 *   +30  exact role match
 *   +15  similar/partial role match
 *   +10  location match
 *   +20  behavioural signal (viewed or searched similar jobs)
 *   Max = 125, normalized to 100
 */

/**
 * Parse a comma-separated skills string into a cleaned array.
 * Handles both "React, Node.js" and '["React","Node.js"]' (JSON) formats.
 * @param {string|string[]|null} raw
 * @returns {string[]}
 */
function parseSkills(raw) {
    if (!raw) return [];
    if (Array.isArray(raw)) return raw.map(s => String(s).trim().toLowerCase()).filter(Boolean);
  
    const str = String(raw).trim();
  
    // Try JSON array first
    if (str.startsWith('[')) {
      try {
        const parsed = JSON.parse(str);
        if (Array.isArray(parsed)) {
          return parsed.map(s => String(s).trim().toLowerCase()).filter(Boolean);
        }
      } catch (_) {}
    }
  
    // Fall back to comma-separated
    return str.split(',').map(s => s.trim().toLowerCase()).filter(Boolean);
  }
  
  /**
   * Check if two role strings are similar enough to score partial match.
   * Simple keyword overlap check — no ML needed at this scale.
   * @param {string} userRole
   * @param {string} jobTitle
   * @returns {boolean}
   */
  function isSimilarRole(userRole, jobTitle) {
    if (!userRole || !jobTitle) return false;
  
    const userWords = userRole.toLowerCase().split(/\s+/).filter(w => w.length > 2);
    const jobWords = jobTitle.toLowerCase().split(/\s+/).filter(w => w.length > 2);
  
    // If any meaningful word overlaps, it's a similar role
    return userWords.some(word => jobWords.includes(word));
  }
  
  /**
   * Score a user against a job posting.
   *
   * @param {Object} user
   * @param {string|string[]} user.skills          - from user_profiles.skills (JSON or comma string)
   * @param {string} user.preferred_location       - from user_profiles.preferred_location
   * @param {string} user.employment_type          - from user_profiles.employment_type (used as preferred role hint)
   * @param {boolean} user.hasViewedSimilar        - true if user viewed a job with overlapping skills/title recently
   * @param {boolean} user.hasSearchedSimilar      - true if user searched a keyword matching this job
   *
   * @param {Object} job
   * @param {string} job.job_title
   * @param {string} job.skills                    - comma-separated string from jobs.skills
   * @param {string} job.city
   * @param {string} job.state
   * @param {string} job.country
   *
   * @returns {number} score 0-100
   */
  function scoreUserForJob(user, job) {
    let score = 0;
  
    const jobSkills = parseSkills(job.skills);
    const userSkills = parseSkills(user.skills);
  
    const normalizeToken = (value) => String(value || '').toLowerCase().replace(/\s+/g, '');

    // +50 — at least one skill overlaps
    if (jobSkills.length > 0 && userSkills.length > 0) {
      const hasOverlap = userSkills.some(us =>
        jobSkills.some(js => {
          const a = normalizeToken(js);
          const b = normalizeToken(us);
          return a.includes(b) || b.includes(a);
        })
      );
      if (hasOverlap) score += 50;
    }

    // +30 exact role match, +15 similar role
    const jobTitle = (job.job_title || '').toLowerCase().trim();
    // Preferred Job Role is stored in user_profiles.preferred_job_role on the candidate profile
    const preferredRole = (user.preferred_job_role || user.preferredJobRole || user.preferred_role || user.employment_type || '')
      .toLowerCase()
      .trim();
  
    if (preferredRole && jobTitle) {
      if (jobTitle.includes(preferredRole) || preferredRole.includes(jobTitle)) {
        score += 30;
      } else if (isSimilarRole(preferredRole, jobTitle)) {
        score += 15;
      }
    }
  
    // +10 — location match (address, city, state, or country)
    const jobLocations = [job.address, job.city, job.state, job.country]
      .filter(Boolean)
      .map(l => l.toLowerCase().trim());
    const userLocation = (user.preferred_location || '').toLowerCase().trim();

    if (userLocation && jobLocations.length > 0) {
      const normalizedUserLoc = normalizeToken(userLocation);
      const locationMatch = jobLocations.some(loc => {
        const normalizedLoc = normalizeToken(loc);
        return (
          loc.includes(userLocation) ||
          userLocation.includes(loc) ||
          normalizedLoc.includes(normalizedUserLoc) ||
          normalizedUserLoc.includes(normalizedLoc)
        );
      });
      if (locationMatch) score += 10;
    }
  
    // +20 — behavioural signals from search logs + job views
    if (user.hasViewedSimilar || user.hasSearchedSimilar) score += 20;
  
    // Normalize to 100 (max raw is 125)
    return Math.min(Math.round(score), 100);
  }
  
  module.exports = { scoreUserForJob, parseSkills };