// const express = require('express');
// const { query } = require('../db');
// const { authenticate } = require('../middleware/auth');
// const router = express.Router();

// const buildFullAccessMembership = (userId) => ({
//   id: 0,
//   user_id: userId,
//   membership_type: 'enterprise',
//   status: 'active',
//   start_date: new Date(),
//   end_date: null,
//   price: 0,
//   payment_method: 'manual',
//   transaction_id: null,
//   features: JSON.stringify({ access: 'full', billingPaused: true })
// });

// // Helper function to check if user has active premium membership
// const checkPremiumMembership = async (userId) => {
//   try {
//     const membership = await query(`
//       SELECT * FROM premium_memberships 
//       WHERE user_id = ? AND status = 'active' 
//       AND (end_date IS NULL OR end_date > NOW())
//       ORDER BY created_at DESC 
//       LIMIT 1
//     `, [userId]);
    
//     if (membership.length > 0) {
//       return membership[0];
//     }

//     // Billing is temporarily disabled, grant synthetic full-access membership
//     return buildFullAccessMembership(userId);
//   } catch (error) {
//     console.error('Error checking premium membership:', error);
//     return buildFullAccessMembership(userId);
//   }
// };

// // Check boolean search usage status
// router.get('/boolean-search/status', authenticate, async (req, res, next) => {
//   try {
//     if (req.user.role !== 'provider') {
//       return res.status(403).json({ message: 'Access denied. Only employers can use boolean search.' });
//     }

//     const employerId = req.user.id;
//     const premiumMembership = await checkPremiumMembership(employerId);
//     const isPremium = !!premiumMembership;

//     // Check if free user has used pro trial
//     const usageRecord = await query(`
//       SELECT has_used_pro_trial FROM boolean_search_usage WHERE employer_id = ?
//     `, [employerId]);

//     const hasUsedProTrial = usageRecord.length > 0 ? usageRecord[0].has_used_pro_trial : false;

//     res.json({
//       isPremium,
//       hasUsedProTrial,
//       canUseProFeatures: isPremium || !hasUsedProTrial,
//       membershipType: premiumMembership?.membership_type || 'basic'
//     });
//   } catch (error) {
//     console.error('Error checking boolean search status:', error);
//     return next(error);
//   }
// });

// // Perform boolean search
// router.post('/boolean-search', authenticate, async (req, res, next) => {
//   try {
//     if (req.user.role !== 'provider') {
//       return res.status(403).json({ message: 'Access denied. Only employers can use boolean search.' });
//     }

//     const employerId = req.user.id;
//     const { searchQuery, filters, useProFeatures } = req.body;

//     // Pagination (server-side). Defaults keep prior behaviour (100 per page).
//     const page = Math.max(1, parseInt(req.body.page, 10) || 1);
//     const rawLimit = parseInt(req.body.limit ?? req.body.pageSize, 10);
//     const limit = Math.min(200, Math.max(1, Number.isFinite(rawLimit) ? rawLimit : 100));
//     const offset = (page - 1) * limit;

//     const premiumMembership = await checkPremiumMembership(employerId);
//     const isPremium = !!premiumMembership;

//     // Check if free user has used pro trial
//     const usageRecord = await query(`
//       SELECT has_used_pro_trial FROM boolean_search_usage WHERE employer_id = ?
//     `, [employerId]);

//     let hasUsedProTrial = usageRecord.length > 0 ? usageRecord[0].has_used_pro_trial : false;

//     // Trial gate only on first page — pagination (page > 1) must not re-block
//     // after the trial was consumed by the initial search.
//     if (useProFeatures && !isPremium && page === 1) {
//       if (hasUsedProTrial) {
//         return res.status(403).json({ 
//           message: 'You have already used your free pro feature trial. Please upgrade to premium to continue using advanced features.',
//           upgradeRequired: true,
//           isPremium: false
//         });
//       } else {
//         // Mark trial as used
//         if (usageRecord.length > 0) {
//           await query(`
//             UPDATE boolean_search_usage SET has_used_pro_trial = 1 WHERE employer_id = ?
//           `, [employerId]);
//         } else {
//           await query(`
//             INSERT INTO boolean_search_usage (employer_id, has_used_pro_trial) VALUES (?, 1)
//           `, [employerId]);
//         }
//         hasUsedProTrial = true;
//       }
//     }

//     // Shared FROM / JOIN / WHERE (filters applied below)
//     const fromJoins = `
//       FROM users u
//       LEFT JOIN user_profiles up ON up.user_id = u.id
//       LEFT JOIN applications a ON a.seeker_id = u.id
//       LEFT JOIN jobs j ON j.id = a.job_id
//       WHERE u.role = 'seeker'
//     `;

//     const conditions = [];
//     const params = [];

//     // The text columns we search across. COALESCE so NULL values never break
//     // OR/NOT logic (NULL NOT LIKE ? is NULL, which would wrongly drop rows).
//     const TEXT_COLS = ['u.full_name', 'up.name', 'a.pasted_cv', 'u.email'];
//     const likeAnyClause = () =>
//       `(${TEXT_COLS.map((c) => `COALESCE(${c}, '') LIKE ?`).join(' OR ')})`;
//     const notLikeAllClause = () =>
//       `(${TEXT_COLS.map((c) => `COALESCE(${c}, '') NOT LIKE ?`).join(' AND ')})`;

//     // Parse inline boolean operators typed straight into the keyword box
//     // (e.g. "react AND node NOT php OR vue"). Tokens default to AND/mustHave.
//     const parseBooleanQuery = (raw) => {
//       const tokens = String(raw).trim().split(/\s+/);
//       const must = [];
//       const mustNot = [];
//       const any = [];
//       let mode = 'and';
//       tokens.forEach((tok) => {
//         const upper = tok.toUpperCase();
//         if (upper === 'AND') { mode = 'and'; return; }
//         if (upper === 'OR')  { mode = 'or';  return; }
//         if (upper === 'NOT' || upper === '-') { mode = 'not'; return; }
//         const term = tok.replace(/^[-+]/, '').replace(/^["']|["']$/g, '');
//         if (!term) return;
//         if (mode === 'not') { mustNot.push(term); mode = 'and'; }
//         else if (mode === 'or') { any.push(term); mode = 'or'; }
//         else { must.push(term); }
//       });
//       return { must, mustNot, any };
//     };

//     // Basic keyword search (available to all). Honours inline AND/OR/NOT too.
//     if (searchQuery && searchQuery.trim()) {
//       const { must, mustNot, any } = parseBooleanQuery(searchQuery);

//       must.forEach((term) => {
//         conditions.push(likeAnyClause());
//         const t = `%${term}%`;
//         TEXT_COLS.forEach(() => params.push(t));
//       });

//       if (any.length > 0) {
//         const orParts = any.map(() => likeAnyClause());
//         conditions.push(`(${orParts.join(' OR ')})`);
//         any.forEach((term) => {
//           const t = `%${term}%`;
//           TEXT_COLS.forEach(() => params.push(t));
//         });
//       }

//       mustNot.forEach((term) => {
//         conditions.push(notLikeAllClause());
//         const t = `%${term}%`;
//         TEXT_COLS.forEach(() => params.push(t));
//       });
//     }

//     // Pro features: structured Boolean operators (AND / NOT) from the tag inputs
//     if (useProFeatures && filters) {
//       // MUST HAVE (AND) — every term must appear in at least one text column
//       if (Array.isArray(filters.mustHave) && filters.mustHave.length > 0) {
//         filters.mustHave.forEach((term) => {
//           conditions.push(likeAnyClause());
//           const t = `%${term}%`;
//           TEXT_COLS.forEach(() => params.push(t));
//         });
//       }

//       // MUST NOT HAVE (NOT) — no term may appear in any text column
//       if (Array.isArray(filters.mustNotHave) && filters.mustNotHave.length > 0) {
//         filters.mustNotHave.forEach((term) => {
//           conditions.push(notLikeAllClause());
//           const t = `%${term}%`;
//           TEXT_COLS.forEach(() => params.push(t));
//         });
//       }
//     }

//     // Additional filters (available to all)
//     if (filters) {
//       // NOTE: there is no experience column on users/user_profiles that maps
//       // cleanly to fresher/experienced, so the experience filter is a no-op
//       // server-side rather than a query that would throw "Unknown column".
//       if (filters.designation && String(filters.designation).trim()) {
//         // Designation / Job Role — match preferred role and applied job titles.
//         const designationTerm = `%${String(filters.designation).trim()}%`;
//         conditions.push(`(
//           COALESCE(up.preferred_job_role, '') LIKE ?
//           OR COALESCE(j.job_title, '') LIKE ?
//         )`);
//         params.push(designationTerm, designationTerm);
//       }
//       if (filters.gender) {
//         conditions.push(`up.gender = ?`);
//         params.push(filters.gender);
//       }

//       // Category — legacy FK or multi-select junction
//       const categoryId = Number(filters.categoryId);
//       if (Number.isInteger(categoryId) && categoryId > 0) {
//         conditions.push(`(
//           u.category_id = ?
//           OR EXISTS (
//             SELECT 1 FROM user_categories uc
//             WHERE uc.user_id = u.id AND uc.category_id = ?
//           )
//         )`);
//         params.push(categoryId, categoryId);
//       }

//       // Subcategory — legacy FK or multi-select junction
//       const subcategoryId = Number(filters.subcategoryId);
//       if (Number.isInteger(subcategoryId) && subcategoryId > 0) {
//         conditions.push(`(
//           u.subcategory_id = ?
//           OR EXISTS (
//             SELECT 1 FROM user_subcategories us
//             WHERE us.user_id = u.id AND us.subcategory_id = ?
//           )
//         )`);
//         params.push(subcategoryId, subcategoryId);
//       }

//       // Skills — every listed skill must appear in the candidate's skills list
//       if (Array.isArray(filters.skills) && filters.skills.length > 0) {
//         filters.skills.forEach((skill) => {
//           const term = String(skill || '').trim();
//           if (!term) return;
//           conditions.push(`LOWER(CAST(COALESCE(up.skills, '[]') AS CHAR)) LIKE ?`);
//           params.push(`%${term.toLowerCase()}%`);
//         });
//       }

//       // Locations — match any listed city against address / preferred_location
//       const locationList = [];
//       if (Array.isArray(filters.locations)) {
//         filters.locations.forEach((loc) => {
//           const t = String(loc || '').trim();
//           if (t) locationList.push(t);
//         });
//       }
//       // Backward-compatible singular field
//       if (filters.location && String(filters.location).trim()) {
//         locationList.push(String(filters.location).trim());
//       }
//       if (locationList.length > 0) {
//         const parts = locationList.map(
//           () => `(
//             COALESCE(up.address, '') LIKE ?
//             OR COALESCE(up.preferred_location, '') LIKE ?
//           )`
//         );
//         conditions.push(`(${parts.join(' OR ')})`);
//         locationList.forEach((loc) => {
//           const t = `%${loc}%`;
//           params.push(t, t);
//         });
//       }
//     }

//     // If the client sent filter criteria but none produced SQL conditions
//     // (e.g. empty skill strings), still avoid dumping the full candidate list.
//     const clientAskedForFilters = !!(
//       (searchQuery && String(searchQuery).trim()) ||
//       (filters && (
//         (filters.designation && String(filters.designation).trim()) ||
//         filters.gender ||
//         (Array.isArray(filters.skills) && filters.skills.some((s) => String(s || '').trim())) ||
//         (Array.isArray(filters.locations) && filters.locations.some((l) => String(l || '').trim())) ||
//         (filters.location && String(filters.location).trim()) ||
//         (Number(filters.categoryId) > 0) ||
//         (Number(filters.subcategoryId) > 0) ||
//         (useProFeatures && Array.isArray(filters.mustHave) && filters.mustHave.length > 0) ||
//         (useProFeatures && Array.isArray(filters.mustNotHave) && filters.mustNotHave.length > 0)
//       ))
//     );

//     let whereExtra = '';
//     if (conditions.length > 0) {
//       whereExtra = ` AND ${conditions.join(' AND ')}`;
//     } else if (clientAskedForFilters) {
//       // No usable match conditions → return empty rather than first N seekers
//       whereExtra = ` AND 1 = 0`;
//     }

//     const countSql = `
//       SELECT COUNT(DISTINCT u.id) AS total
//       ${fromJoins}
//       ${whereExtra}
//     `;
//     const countRows = await query(countSql, params);
//     const totalMatching = Number(countRows?.[0]?.total || 0);
//     const totalPages = totalMatching > 0 ? Math.ceil(totalMatching / limit) : 0;

//     // Page of unique candidate IDs (stable A–Z order)
//     const idSql = `
//       SELECT u.id AS candidate_id
//       ${fromJoins}
//       ${whereExtra}
//       GROUP BY u.id
//       ORDER BY MIN(u.full_name) ASC
//       LIMIT ? OFFSET ?
//     `;
//     const idRows = await query(idSql, [...params, limit, offset]);
//     const pageIds = (idRows || []).map((r) => r.candidate_id).filter(Boolean);

//     let candidates = [];
//     if (pageIds.length > 0) {
//       const placeholders = pageIds.map(() => '?').join(',');
//       // One row per candidate (representative application/job via MAX).
//       const detailSql = `
//         SELECT
//           u.id as candidate_id,
//           u.full_name,
//           u.email,
//           u.phone,
//           MAX(up.name) as name,
//           MAX(up.address) as address,
//           MAX(up.gender) as gender,
//           MAX(up.linkedin) as linkedin,
//           MAX(CAST(up.skills AS CHAR)) as skills,
//           MAX(CAST(up.experience AS CHAR)) as experience,
//           MAX(a.id) as application_id,
//           MAX(a.resume_url) as resume_url,
//           MAX(a.pasted_cv) as pasted_cv,
//           MAX(j.job_title) as job_title,
//           MAX(j.id) as job_id
//         FROM users u
//         LEFT JOIN user_profiles up ON up.user_id = u.id
//         LEFT JOIN applications a ON a.seeker_id = u.id
//         LEFT JOIN jobs j ON j.id = a.job_id
//         WHERE u.id IN (${placeholders})
//         GROUP BY u.id, u.full_name, u.email, u.phone
//         ORDER BY u.full_name ASC
//       `;
//       candidates = await query(detailSql, pageIds);

//       // Restore JSON fields that were cast to CHAR for GROUP BY compatibility
//       candidates = candidates.map((row) => {
//         const next = { ...row };
//         for (const key of ['skills', 'experience']) {
//           if (typeof next[key] === 'string' && next[key].trim()) {
//             try {
//               next[key] = JSON.parse(next[key]);
//             } catch (_) {
//               /* keep string */
//             }
//           }
//         }
//         return next;
//       });
//     }

//     const hasNext = page < totalPages;
//     const hasPrev = page > 1 && totalMatching > 0;

//     res.json({
//       candidates,
//       total: candidates.length,
//       totalMatching,
//       truncated: totalMatching > candidates.length,
//       page,
//       limit,
//       pageSize: limit,
//       totalPages,
//       hasNext,
//       hasPrev,
//       usedProTrial: !isPremium && hasUsedProTrial,
//       isPremium
//     });
//   } catch (error) {
//     console.error('Error performing boolean search:', error);
//     return next(error);
//   }
// });

// // Save search (pro feature only)
// router.post('/boolean-search/save', authenticate, async (req, res, next) => {
//   try {
//     if (req.user.role !== 'provider') {
//       return res.status(403).json({ message: 'Access denied. Only employers can save searches.' });
//     }

//     const employerId = req.user.id;
//     const premiumMembership = await checkPremiumMembership(employerId);
//     const isPremium = !!premiumMembership;

//     if (!isPremium) {
//       return res.status(403).json({ 
//         message: 'This feature is only available for premium members. Please upgrade to save searches.',
//         upgradeRequired: true
//       });
//     }

//     const { searchName, searchQuery, searchFilters } = req.body;

//     if (!searchName || !searchQuery) {
//       return res.status(400).json({ message: 'Search name and query are required.' });
//     }

//     const result = await query(`
//       INSERT INTO saved_searches (employer_id, search_name, search_query, search_filters)
//       VALUES (?, ?, ?, ?)
//     `, [employerId, searchName, searchQuery, JSON.stringify(searchFilters || {})]);

//     res.json({
//       message: 'Search saved successfully',
//       savedSearchId: result.insertId
//     });
//   } catch (error) {
//     console.error('Error saving search:', error);
//     return next(error);
//   }
// });

// // Get saved searches (pro feature only)
// router.get('/boolean-search/saved', authenticate, async (req, res, next) => {
//   try {
//     if (req.user.role !== 'provider') {
//       return res.status(403).json({ message: 'Access denied. Only employers can view saved searches.' });
//     }

//     const employerId = req.user.id;
//     const premiumMembership = await checkPremiumMembership(employerId);
//     const isPremium = !!premiumMembership;

//     if (!isPremium) {
//       return res.status(403).json({ 
//         message: 'This feature is only available for premium members.',
//         upgradeRequired: true
//       });
//     }

//     const savedSearches = await query(`
//       SELECT id, search_name, search_query, search_filters, is_active, created_at, updated_at
//       FROM saved_searches
//       WHERE employer_id = ? AND is_active = 1
//       ORDER BY created_at DESC
//     `, [employerId]);

//     const formattedSearches = savedSearches.map(search => ({
//       ...search,
//       search_filters: search.search_filters ? JSON.parse(search.search_filters) : null
//     }));

//     res.json({ savedSearches: formattedSearches });
//   } catch (error) {
//     console.error('Error getting saved searches:', error);
//     return next(error);
//   }
// });

// // Check resume scoring usage status
// router.get('/resume-scoring/status', authenticate, async (req, res, next) => {
//   try {
//     if (req.user.role !== 'provider') {
//       return res.status(403).json({ message: 'Access denied. Only employers can use resume scoring.' });
//     }

//     const employerId = req.user.id;
//     const premiumMembership = await checkPremiumMembership(employerId);
//     const isPremium = !!premiumMembership;

//     if (isPremium) {
//       return res.json({
//         isPremium: true,
//         dailyLimit: 999,
//         dailyUsage: 0,
//         remaining: 999,
//         canUse: true
//       });
//     }

//     // Check daily usage for free users
//     const today = new Date().toISOString().split('T')[0];
//     const dailyUsage = await query(`
//       SELECT COUNT(*) as count 
//       FROM resume_scoring_usage 
//       WHERE employer_id = ? AND usage_date = ?
//     `, [employerId, today]);

//     const usageCount = dailyUsage[0].count || 0;
//     const dailyLimit = 2;
//     const remaining = Math.max(0, dailyLimit - usageCount);

//     res.json({
//       isPremium: false,
//       dailyLimit,
//       dailyUsage: usageCount,
//       remaining,
//       canUse: remaining > 0
//     });
//   } catch (error) {
//     console.error('Error checking resume scoring status:', error);
//     return next(error);
//   }
// });

// // Perform resume scoring
// router.post('/resume-scoring', authenticate, async (req, res, next) => {
//   try {
//     if (req.user.role !== 'provider') {
//       return res.status(403).json({ message: 'Access denied. Only employers can use resume scoring.' });
//     }

//     const employerId = req.user.id;
//     const { jobId, applicationIds } = req.body;

//     const premiumMembership = await checkPremiumMembership(employerId);
//     const isPremium = !!premiumMembership;

//     if (!isPremium) {
//       // Check daily limit for free users
//       const today = new Date().toISOString().split('T')[0];
//       const dailyUsage = await query(`
//         SELECT COUNT(*) as count 
//         FROM resume_scoring_usage 
//         WHERE employer_id = ? AND usage_date = ?
//       `, [employerId, today]);

//       const usageCount = dailyUsage[0].count || 0;
//       const dailyLimit = 2;

//       if (usageCount >= dailyLimit) {
//         return res.status(429).json({ 
//           message: `Daily limit reached. You can use resume scoring ${dailyLimit} times per day. Upgrade to premium for unlimited usage.`,
//           isPremium: false,
//           dailyUsage: usageCount,
//           dailyLimit,
//           upgradeRequired: true
//         });
//       }

//       // Record usage
//       await query(`
//         INSERT INTO resume_scoring_usage (employer_id, job_id, usage_date)
//         VALUES (?, ?, ?)
//       `, [employerId, jobId || null, today]);
//     }

//     // Get applications to score
//     let applications = [];
//     if (applicationIds && applicationIds.length > 0) {
//       applications = await query(`
//         SELECT a.*, u.full_name, u.email, u.phone, j.job_title, j.description as job_description, j.skills as job_skills
//         FROM applications a
//         JOIN users u ON u.id = a.seeker_id
//         JOIN jobs j ON j.id = a.job_id
//         WHERE a.id IN (${applicationIds.map(() => '?').join(',')}) AND j.employer_id = ?
//       `, [...applicationIds, employerId]);
//     } else if (jobId) {
//       applications = await query(`
//         SELECT a.*, u.full_name, u.email, u.phone, j.job_title, j.description as job_description, j.skills as job_skills
//         FROM applications a
//         JOIN users u ON u.id = a.seeker_id
//         JOIN jobs j ON j.id = a.job_id
//         WHERE j.id = ? AND j.employer_id = ?
//       `, [jobId, employerId]);
//     } else {
//       return res.status(400).json({ message: 'Either jobId or applicationIds must be provided.' });
//     }

//     // Score resumes based on job requirements
//     const scoredApplications = applications.map(app => {
//       let score = 0;
//       const maxScore = 100;
//       const reasons = [];

//       // Extract job skills
//       const jobSkills = app.job_skills ? app.job_skills.toLowerCase().split(',').map(s => s.trim()) : [];
      
//       // Extract resume text
//       const resumeText = (app.pasted_cv || '').toLowerCase();

//       // Score based on skills match (40 points)
//       if (jobSkills.length > 0 && resumeText) {
//         const matchedSkills = jobSkills.filter(skill => resumeText.includes(skill.toLowerCase()));
//         const skillScore = (matchedSkills.length / jobSkills.length) * 40;
//         score += skillScore;
//         reasons.push(`Skills match: ${matchedSkills.length}/${jobSkills.length} (${skillScore.toFixed(1)} points)`);
//       }

//       // Score based on experience (20 points)
//       if (app.job_description && resumeText) {
//         const experienceKeywords = ['experience', 'years', 'worked', 'previous', 'past'];
//         const hasExperience = experienceKeywords.some(keyword => resumeText.includes(keyword));
//         if (hasExperience) {
//           score += 20;
//           reasons.push('Experience mentioned (20 points)');
//         }
//       }

//       // Score based on education/qualification (20 points)
//       const educationKeywords = ['education', 'degree', 'university', 'college', 'bachelor', 'master', 'phd'];
//       const hasEducation = educationKeywords.some(keyword => resumeText.includes(keyword));
//       if (hasEducation) {
//         score += 20;
//         reasons.push('Education/qualification mentioned (20 points)');
//       }

//       // Score based on completeness (20 points)
//       const completenessFields = ['email', 'phone', 'name', 'address'];
//       let completeFields = 0;
//       if (app.email) completeFields++;
//       if (app.phone) completeFields++;
//       if (app.name) completeFields++;
//       if (resumeText.length > 100) completeFields++;
      
//       const completenessScore = (completeFields / completenessFields.length) * 20;
//       score += completenessScore;
//       reasons.push(`Profile completeness: ${completeFields}/${completenessFields.length} fields (${completenessScore.toFixed(1)} points)`);

//       // Round score
//       score = Math.min(Math.round(score), maxScore);

//       return {
//         applicationId: app.id,
//         candidateName: app.full_name || app.name,
//         candidateEmail: app.email,
//         score,
//         maxScore,
//         reasons,
//         resumeUrl: app.resume_url,
//         appliedAt: app.created_at
//       };
//     });

//     // Sort by score descending
//     scoredApplications.sort((a, b) => b.score - a.score);

//     res.json({
//       results: scoredApplications,
//       total: scoredApplications.length,
//       isPremium
//     });
//   } catch (error) {
//     console.error('Error performing resume scoring:', error);
//     return next(error);
//   }
// });

// module.exports = router;

const express = require('express');
const { query } = require('../db');
const { authenticate } = require('../middleware/auth');
const router = express.Router();

const buildFullAccessMembership = (userId) => ({
  id: 0,
  user_id: userId,
  membership_type: 'enterprise',
  status: 'active',
  start_date: new Date(),
  end_date: null,
  price: 0,
  payment_method: 'manual',
  transaction_id: null,
  features: JSON.stringify({ access: 'full', billingPaused: true })
});

// Helper function to check if user has active premium membership
const checkPremiumMembership = async (userId) => {
  try {
    const membership = await query(`
      SELECT * FROM premium_memberships 
      WHERE user_id = ? AND status = 'active' 
      AND (end_date IS NULL OR end_date > NOW())
      ORDER BY created_at DESC 
      LIMIT 1
    `, [userId]);

    if (membership.length > 0) {
      return membership[0];
    }

    // NOTE: billing is currently paused platform-wide — every employer gets
    // a synthetic full-access membership here. If/when billing is
    // re-enabled, remove this fallback so free-tier limits actually apply.
    return buildFullAccessMembership(userId);
  } catch (error) {
    console.error('Error checking premium membership:', error);
    return buildFullAccessMembership(userId);
  }
};

// Check boolean search usage status
router.get('/boolean-search/status', authenticate, async (req, res, next) => {
  try {
    if (req.user.role !== 'provider') {
      return res.status(403).json({ message: 'Access denied. Only employers can use boolean search.' });
    }

    const employerId = req.user.id;
    const premiumMembership = await checkPremiumMembership(employerId);
    const isPremium = !!premiumMembership;

    const usageRecord = await query(`
      SELECT has_used_pro_trial FROM boolean_search_usage WHERE employer_id = ?
    `, [employerId]);

    const hasUsedProTrial = usageRecord.length > 0 ? usageRecord[0].has_used_pro_trial : false;

    res.json({
      isPremium,
      hasUsedProTrial,
      canUseProFeatures: isPremium || !hasUsedProTrial,
      membershipType: premiumMembership?.membership_type || 'basic'
    });
  } catch (error) {
    console.error('Error checking boolean search status:', error);
    return next(error);
  }
});

// Perform boolean search
router.post('/boolean-search', authenticate, async (req, res, next) => {
  try {
    if (req.user.role !== 'provider') {
      return res.status(403).json({ message: 'Access denied. Only employers can use boolean search.' });
    }

    const employerId = req.user.id;
    const { searchQuery, filters, useProFeatures } = req.body;

    // Pagination (server-side). Defaults keep prior behaviour (100 per page).
    const page = Math.max(1, parseInt(req.body.page, 10) || 1);
    const rawLimit = parseInt(req.body.limit ?? req.body.pageSize, 10);
    const limit = Math.min(200, Math.max(1, Number.isFinite(rawLimit) ? rawLimit : 100));
    const offset = (page - 1) * limit;

    const premiumMembership = await checkPremiumMembership(employerId);
    const isPremium = !!premiumMembership;

    // Check if free user has used pro trial
    const usageRecord = await query(`
      SELECT has_used_pro_trial FROM boolean_search_usage WHERE employer_id = ?
    `, [employerId]);

    let hasUsedProTrial = usageRecord.length > 0 ? usageRecord[0].has_used_pro_trial : false;

    // Trial gate only on first page — pagination (page > 1) must not re-block
    // after the trial was consumed by the initial search.
    if (useProFeatures && !isPremium && page === 1) {
      if (hasUsedProTrial) {
        return res.status(403).json({
          message: 'You have already used your free pro feature trial. Please upgrade to premium to continue using advanced features.',
          upgradeRequired: true,
          isPremium: false
        });
      } else {
        if (usageRecord.length > 0) {
          await query(`
            UPDATE boolean_search_usage SET has_used_pro_trial = 1 WHERE employer_id = ?
          `, [employerId]);
        } else {
          await query(`
            INSERT INTO boolean_search_usage (employer_id, has_used_pro_trial) VALUES (?, 1)
          `, [employerId]);
        }
        hasUsedProTrial = true;
      }
    }

    // Shared FROM / JOIN — application/job rows are scoped to this employer
    // so "Applied" / resume only reflect apps to their own postings.
    const fromJoins = `
      FROM users u
      LEFT JOIN user_profiles up ON up.user_id = u.id
      LEFT JOIN applications a ON a.seeker_id = u.id
      LEFT JOIN jobs j ON j.id = a.job_id AND j.employer_id = ?
      WHERE u.role = 'seeker'
    `;
    const joinParams = [employerId];

    const conditions = [];
    const params = [];

    // ── Column sets ─────────────────────────────────────────────────────────
    // Broad columns used for "must include" matching from the top search bar.
    // Covers name, email, skills, preferred job role, address, preferred_location.
    const BROAD_COLS = [
      'u.full_name',
      'up.name',
      'u.email',
      `LOWER(CAST(COALESCE(up.skills, '') AS CHAR))`,
      `LOWER(COALESCE(up.preferred_job_role, ''))`,
      `LOWER(COALESCE(up.address, ''))`,
      `LOWER(COALESCE(up.preferred_location, ''))`,
    ];
    // Exclusion uses the same broad columns so mustNotHave truly overrides everything.
    const broadLikeAny = () =>
      `(${BROAD_COLS.map((c) => `${c} LIKE ?`).join(' OR ')})`;
    const broadNotLikeAll = () =>
      `(${BROAD_COLS.map((c) => `${c} NOT LIKE ?`).join(' AND ')})`;

    // ── Relevance scoring ────────────────────────────────────────────────────
    const scoreParams = [];
    const scoreParts = [];

    const addScoreTerm = (term) => {
      const t = `%${String(term).toLowerCase()}%`;
      scoreParts.push(`
        (CASE WHEN LOWER(CAST(COALESCE(up.skills, '') AS CHAR)) LIKE ? THEN 30 ELSE 0 END) +
        (CASE WHEN LOWER(COALESCE(up.preferred_job_role, '')) LIKE ? THEN 20 ELSE 0 END) +
        (CASE WHEN LOWER(COALESCE(up.address, '')) LIKE ? THEN 5 ELSE 0 END) +
        (CASE WHEN LOWER(COALESCE(up.preferred_location, '')) LIKE ? THEN 5 ELSE 0 END)
      `);
      scoreParams.push(t, t, t, t);
    };

    // ── Parse top search bar query ───────────────────────────────────────────
    // Supports inline NOT operator (e.g. "react NOT php") as well as simple
    // comma-separated or space-separated lists.  Each token is searched across
    // ALL broad columns (name, skills, role, location, email).
    const parseTopQuery = (raw) => {
      // Replace commas with spaces, then split on whitespace
      const tokens = String(raw).trim().replace(/,+/g, ' ').split(/\s+/).filter(Boolean);
      const must = [];
      const mustNot = [];
      let mode = 'and';
      tokens.forEach((tok) => {
        const upper = tok.toUpperCase();
        if (upper === 'NOT' || upper === '-') { mode = 'not'; return; }
        if (upper === 'AND') { mode = 'and'; return; }
        if (upper === 'OR')  { mode = 'and'; return; } // treat OR as AND for broad search
        const term = tok.replace(/^[-+]/, '').replace(/^["']|["']$/g, '').trim();
        if (!term) return;
        if (mode === 'not') { mustNot.push(term.toLowerCase()); mode = 'and'; }
        else { must.push(term.toLowerCase()); }
      });
      return { must, mustNot };
    };

    // Collect all mustNotHave terms (from top query + advanced panel) to apply as
    // absolute exclusions AFTER all other conditions — priority override.
    const absoluteExclusions = new Set();

    // Collect must-have terms from advanced panel so we can de-duplicate vs top bar.
    const advancedIncludeTerms = new Set();
    if (filters && Array.isArray(filters.mustHave)) {
      filters.mustHave.forEach((t) => { if (String(t || '').trim()) advancedIncludeTerms.add(String(t).trim().toLowerCase()); });
    }
    if (filters && Array.isArray(filters.mustNotHave)) {
      filters.mustNotHave.forEach((t) => { if (String(t || '').trim()) absoluteExclusions.add(String(t).trim().toLowerCase()); });
    }

    // ── Top search bar (available to all) ───────────────────────────────────
    if (searchQuery && searchQuery.trim()) {
      const { must, mustNot } = parseTopQuery(searchQuery);

      must.forEach((term) => {
        // Skip if the same term is already in mustNotHave (mustNotHave wins)
        if (absoluteExclusions.has(term)) return;
        // Skip duplicate from advanced filters (treat as single search item)
        if (advancedIncludeTerms.has(term)) return;

        conditions.push(broadLikeAny());
        BROAD_COLS.forEach(() => params.push(`%${term}%`));
        addScoreTerm(term);
      });

      mustNot.forEach((term) => {
        absoluteExclusions.add(term);
      });
    }

    // Pro features: mustHave from advanced panel (de-duped against top query)
    if (useProFeatures && filters) {
      if (Array.isArray(filters.mustHave) && filters.mustHave.length > 0) {
        filters.mustHave.forEach((term) => {
          const t = String(term || '').trim().toLowerCase();
          if (!t) return;
          // Skip if excluded by mustNotHave
          if (absoluteExclusions.has(t)) return;
          conditions.push(broadLikeAny());
          BROAD_COLS.forEach(() => params.push(`%${t}%`));
          addScoreTerm(t);
        });
      }
    }

    // mustNotHave from advanced panel — already collected in absoluteExclusions above.
    // Applied at the END as absolute overrides (after all positive conditions).

    // Additional filters (available to all)
    if (filters) {
      if (filters.designation && String(filters.designation).trim()) {
        const designationTerm = `%${String(filters.designation).trim()}%`;
        conditions.push(`(
          COALESCE(up.preferred_job_role, '') LIKE ?
          OR COALESCE(j.job_title, '') LIKE ?
        )`);
        params.push(designationTerm, designationTerm);
      }
      if (filters.gender) {
        conditions.push(`up.gender = ?`);
        params.push(filters.gender);
      }

      // Category — legacy FK or multi-select junction
      const categoryId = Number(filters.categoryId);
      if (Number.isInteger(categoryId) && categoryId > 0) {
        conditions.push(`(
          u.category_id = ?
          OR EXISTS (
            SELECT 1 FROM user_categories uc
            WHERE uc.user_id = u.id AND uc.category_id = ?
          )
        )`);
        params.push(categoryId, categoryId);
      }

      // Subcategory — legacy FK or multi-select junction
      const subcategoryId = Number(filters.subcategoryId);
      if (Number.isInteger(subcategoryId) && subcategoryId > 0) {
        conditions.push(`(
          u.subcategory_id = ?
          OR EXISTS (
            SELECT 1 FROM user_subcategories us
            WHERE us.user_id = u.id AND us.subcategory_id = ?
          )
        )`);
        params.push(subcategoryId, subcategoryId);
      }

      // Skills — every listed skill must appear in the candidate's skills list
      if (Array.isArray(filters.skills) && filters.skills.length > 0) {
        filters.skills.forEach((skill) => {
          const term = String(skill || '').trim();
          if (!term) return;
          conditions.push(`LOWER(CAST(COALESCE(up.skills, '[]') AS CHAR)) LIKE ?`);
          params.push(`%${term.toLowerCase()}%`);
        });
      }

      // Locations — match any listed city against address / preferred_location
      const locationList = [];
      if (Array.isArray(filters.locations)) {
        filters.locations.forEach((loc) => {
          const t = String(loc || '').trim();
          if (t) locationList.push(t);
        });
      }
      if (filters.location && String(filters.location).trim()) {
        locationList.push(String(filters.location).trim());
      }
      if (locationList.length > 0) {
        const parts = locationList.map(
          () => `(
            COALESCE(up.address, '') LIKE ?
            OR COALESCE(up.preferred_location, '') LIKE ?
          )`
        );
        conditions.push(`(${parts.join(' OR ')})`);
        locationList.forEach((loc) => {
          const t = `%${loc}%`;
          params.push(t, t);
        });
      }
    }

    // Apply absolute mustNotHave exclusions LAST so they override everything.
    // These come from the advanced panel AND inline NOT terms in top search bar.
    absoluteExclusions.forEach((term) => {
      conditions.push(broadNotLikeAll());
      BROAD_COLS.forEach(() => params.push(`%${term}%`));
    });

    // If the client sent filter criteria but none produced SQL conditions
    // (e.g. empty skill strings), still avoid dumping the full candidate list.
    const clientAskedForFilters = !!(
      (searchQuery && String(searchQuery).trim()) ||
      (filters && (
        (filters.designation && String(filters.designation).trim()) ||
        filters.gender ||
        (Array.isArray(filters.skills) && filters.skills.some((s) => String(s || '').trim())) ||
        (Array.isArray(filters.locations) && filters.locations.some((l) => String(l || '').trim())) ||
        (filters.location && String(filters.location).trim()) ||
        (Number(filters.categoryId) > 0) ||
        (Number(filters.subcategoryId) > 0) ||
        (Array.isArray(filters.mustHave) && filters.mustHave.length > 0) ||
        (Array.isArray(filters.mustNotHave) && filters.mustNotHave.length > 0)
      ))
    );

    let whereExtra = '';
    if (conditions.length > 0) {
      whereExtra = ` AND ${conditions.join(' AND ')}`;
    } else if (clientAskedForFilters) {
      whereExtra = ` AND 1 = 0`;
    }

    const countSql = `
      SELECT COUNT(DISTINCT u.id) AS total
      ${fromJoins}
      ${whereExtra}
    `;
    const countRows = await query(countSql, [...joinParams, ...params]);
    const totalMatching = Number(countRows?.[0]?.total || 0);
    const totalPages = totalMatching > 0 ? Math.ceil(totalMatching / limit) : 0;

    // Relevance score expression — always includes the two flat bonuses,
    // plus 30/20-point hits for every scored term. Wrapped in MAX(...) in
    // the SELECT below so it plays correctly with GROUP BY u.id.
    scoreParts.push(`(CASE WHEN u.resume_url IS NOT NULL AND u.resume_url <> '' THEN 10 ELSE 0 END)`);
    scoreParts.push(`(CASE WHEN up.updated_at >= DATE_SUB(NOW(), INTERVAL 90 DAY) THEN 3 ELSE 0 END)`);
    const scoreExpr = scoreParts.join(' + ');

    // Page of unique candidate IDs, ranked by relevance then name.
    const idSql = `
      SELECT u.id AS candidate_id, MAX(${scoreExpr}) AS relevance_score
      ${fromJoins}
      ${whereExtra}
      GROUP BY u.id
      ORDER BY relevance_score DESC, MIN(u.full_name) ASC
      LIMIT ? OFFSET ?
    `;
    const idRows = await query(idSql, [...scoreParams, ...joinParams, ...params, limit, offset]);
    const pageIds = (idRows || []).map((r) => r.candidate_id).filter(Boolean);
    const scoreById = new Map((idRows || []).map((r) => [r.candidate_id, Number(r.relevance_score) || 0]));

    let candidates = [];
    if (pageIds.length > 0) {
      const placeholders = pageIds.map(() => '?').join(',');
      // One row per candidate — only applications to this employer's jobs.
      const detailSql = `
        SELECT
          u.id as candidate_id,
          u.full_name,
          u.email,
          u.phone,
          MAX(up.name) as name,
          MAX(up.address) as address,
          MAX(up.gender) as gender,
          MAX(up.linkedin) as linkedin,
          MAX(CAST(up.skills AS CHAR)) as skills,
          MAX(CAST(up.experience AS CHAR)) as experience,
          MAX(CASE WHEN j.id IS NOT NULL THEN a.id END) as application_id,
          MAX(CASE WHEN j.id IS NOT NULL THEN a.resume_url END) as resume_url,
          MAX(CASE WHEN j.id IS NOT NULL THEN j.job_title END) as job_title,
          MAX(CASE WHEN j.id IS NOT NULL THEN j.id END) as job_id
        FROM users u
        LEFT JOIN user_profiles up ON up.user_id = u.id
        LEFT JOIN applications a ON a.seeker_id = u.id
        LEFT JOIN jobs j ON j.id = a.job_id AND j.employer_id = ?
        WHERE u.id IN (${placeholders})
        GROUP BY u.id, u.full_name, u.email, u.phone
      `;
      const detailRows = await query(detailSql, [employerId, ...pageIds]);

      // Restore JSON fields that were cast to CHAR for GROUP BY compatibility
      const parsedById = new Map(
        detailRows.map((row) => {
          const next = { ...row };
          for (const key of ['skills', 'experience']) {
            if (typeof next[key] === 'string' && next[key].trim()) {
              try {
                next[key] = JSON.parse(next[key]);
              } catch (_) {
                /* keep string */
              }
            }
          }
          return [row.candidate_id, next];
        })
      );

      // Re-apply the relevance-ranked order from idSql — detailSql's own
      // row order isn't guaranteed to match it.
      candidates = pageIds
        .map((id) => {
          const row = parsedById.get(id);
          if (!row) return null;
          return { ...row, relevance_score: scoreById.get(id) ?? 0 };
        })
        .filter(Boolean);
    }

    const hasNext = page < totalPages;
    const hasPrev = page > 1 && totalMatching > 0;

    res.json({
      candidates,
      total: candidates.length,
      totalMatching,
      truncated: totalMatching > candidates.length,
      page,
      limit,
      pageSize: limit,
      totalPages,
      hasNext,
      hasPrev,
      usedProTrial: !isPremium && hasUsedProTrial,
      isPremium
    });
  } catch (error) {
    console.error('Error performing boolean search:', error);
    return next(error);
  }
});

// Save search (pro feature only)
router.post('/boolean-search/save', authenticate, async (req, res, next) => {
  try {
    if (req.user.role !== 'provider') {
      return res.status(403).json({ message: 'Access denied. Only employers can save searches.' });
    }

    const employerId = req.user.id;
    const premiumMembership = await checkPremiumMembership(employerId);
    const isPremium = !!premiumMembership;

    if (!isPremium) {
      return res.status(403).json({
        message: 'This feature is only available for premium members. Please upgrade to save searches.',
        upgradeRequired: true
      });
    }

    const { searchName, searchQuery, searchFilters } = req.body;

    if (!searchName || !searchQuery) {
      return res.status(400).json({ message: 'Search name and query are required.' });
    }

    const result = await query(`
      INSERT INTO saved_searches (employer_id, search_name, search_query, search_filters)
      VALUES (?, ?, ?, ?)
    `, [employerId, searchName, searchQuery, JSON.stringify(searchFilters || {})]);

    res.json({
      message: 'Search saved successfully',
      savedSearchId: result.insertId
    });
  } catch (error) {
    console.error('Error saving search:', error);
    return next(error);
  }
});

// Get saved searches (pro feature only)
router.get('/boolean-search/saved', authenticate, async (req, res, next) => {
  try {
    if (req.user.role !== 'provider') {
      return res.status(403).json({ message: 'Access denied. Only employers can view saved searches.' });
    }

    const employerId = req.user.id;
    const premiumMembership = await checkPremiumMembership(employerId);
    const isPremium = !!premiumMembership;

    if (!isPremium) {
      return res.status(403).json({
        message: 'This feature is only available for premium members.',
        upgradeRequired: true
      });
    }

    const savedSearches = await query(`
      SELECT id, search_name, search_query, search_filters, is_active, created_at, updated_at
      FROM saved_searches
      WHERE employer_id = ? AND is_active = 1
      ORDER BY created_at DESC
    `, [employerId]);

    const formattedSearches = savedSearches.map(search => ({
      ...search,
      search_filters: search.search_filters ? JSON.parse(search.search_filters) : null
    }));

    res.json({ savedSearches: formattedSearches });
  } catch (error) {
    console.error('Error getting saved searches:', error);
    return next(error);
  }
});

// Check resume scoring usage status
router.get('/resume-scoring/status', authenticate, async (req, res, next) => {
  try {
    if (req.user.role !== 'provider') {
      return res.status(403).json({ message: 'Access denied. Only employers can use resume scoring.' });
    }

    const employerId = req.user.id;
    const premiumMembership = await checkPremiumMembership(employerId);
    const isPremium = !!premiumMembership;

    if (isPremium) {
      return res.json({
        isPremium: true,
        dailyLimit: 999,
        dailyUsage: 0,
        remaining: 999,
        canUse: true
      });
    }

    const today = new Date().toISOString().split('T')[0];
    const dailyUsage = await query(`
      SELECT COUNT(*) as count 
      FROM resume_scoring_usage 
      WHERE employer_id = ? AND usage_date = ?
    `, [employerId, today]);

    const usageCount = dailyUsage[0].count || 0;
    const dailyLimit = 2;
    const remaining = Math.max(0, dailyLimit - usageCount);

    res.json({
      isPremium: false,
      dailyLimit,
      dailyUsage: usageCount,
      remaining,
      canUse: remaining > 0
    });
  } catch (error) {
    console.error('Error checking resume scoring status:', error);
    return next(error);
  }
});

// Perform resume scoring
router.post('/resume-scoring', authenticate, async (req, res, next) => {
  try {
    if (req.user.role !== 'provider') {
      return res.status(403).json({ message: 'Access denied. Only employers can use resume scoring.' });
    }

    const employerId = req.user.id;
    const { jobId, applicationIds } = req.body;

    const premiumMembership = await checkPremiumMembership(employerId);
    const isPremium = !!premiumMembership;

    if (!isPremium) {
      const today = new Date().toISOString().split('T')[0];
      const dailyUsage = await query(`
        SELECT COUNT(*) as count 
        FROM resume_scoring_usage 
        WHERE employer_id = ? AND usage_date = ?
      `, [employerId, today]);

      const usageCount = dailyUsage[0].count || 0;
      const dailyLimit = 2;

      if (usageCount >= dailyLimit) {
        return res.status(429).json({
          message: `Daily limit reached. You can use resume scoring ${dailyLimit} times per day. Upgrade to premium for unlimited usage.`,
          isPremium: false,
          dailyUsage: usageCount,
          dailyLimit,
          upgradeRequired: true
        });
      }

      await query(`
        INSERT INTO resume_scoring_usage (employer_id, job_id, usage_date)
        VALUES (?, ?, ?)
      `, [employerId, jobId || null, today]);
    }

    let applications = [];
    if (applicationIds && applicationIds.length > 0) {
      applications = await query(`
        SELECT a.*, u.full_name, u.email, u.phone, j.job_title, j.description as job_description, j.skills as job_skills
        FROM applications a
        JOIN users u ON u.id = a.seeker_id
        JOIN jobs j ON j.id = a.job_id
        WHERE a.id IN (${applicationIds.map(() => '?').join(',')}) AND j.employer_id = ?
      `, [...applicationIds, employerId]);
    } else if (jobId) {
      applications = await query(`
        SELECT a.*, u.full_name, u.email, u.phone, j.job_title, j.description as job_description, j.skills as job_skills
        FROM applications a
        JOIN users u ON u.id = a.seeker_id
        JOIN jobs j ON j.id = a.job_id
        WHERE j.id = ? AND j.employer_id = ?
      `, [jobId, employerId]);
    } else {
      return res.status(400).json({ message: 'Either jobId or applicationIds must be provided.' });
    }

    const scoredApplications = applications.map(app => {
      let score = 0;
      const maxScore = 100;
      const reasons = [];

      const jobSkills = app.job_skills ? app.job_skills.toLowerCase().split(',').map(s => s.trim()) : [];
      const resumeText = (app.pasted_cv || '').toLowerCase();

      if (jobSkills.length > 0 && resumeText) {
        const matchedSkills = jobSkills.filter(skill => resumeText.includes(skill.toLowerCase()));
        const skillScore = (matchedSkills.length / jobSkills.length) * 40;
        score += skillScore;
        reasons.push(`Skills match: ${matchedSkills.length}/${jobSkills.length} (${skillScore.toFixed(1)} points)`);
      }

      if (app.job_description && resumeText) {
        const experienceKeywords = ['experience', 'years', 'worked', 'previous', 'past'];
        const hasExperience = experienceKeywords.some(keyword => resumeText.includes(keyword));
        if (hasExperience) {
          score += 20;
          reasons.push('Experience mentioned (20 points)');
        }
      }

      const educationKeywords = ['education', 'degree', 'university', 'college', 'bachelor', 'master', 'phd'];
      const hasEducation = educationKeywords.some(keyword => resumeText.includes(keyword));
      if (hasEducation) {
        score += 20;
        reasons.push('Education/qualification mentioned (20 points)');
      }

      const completenessFields = ['email', 'phone', 'name', 'address'];
      let completeFields = 0;
      if (app.email) completeFields++;
      if (app.phone) completeFields++;
      if (app.name) completeFields++;
      if (resumeText.length > 100) completeFields++;

      const completenessScore = (completeFields / completenessFields.length) * 20;
      score += completenessScore;
      reasons.push(`Profile completeness: ${completeFields}/${completenessFields.length} fields (${completenessScore.toFixed(1)} points)`);

      score = Math.min(Math.round(score), maxScore);

      return {
        applicationId: app.id,
        candidateName: app.full_name || app.name,
        candidateEmail: app.email,
        score,
        maxScore,
        reasons,
        resumeUrl: app.resume_url,
        appliedAt: app.created_at
      };
    });

    scoredApplications.sort((a, b) => b.score - a.score);

    res.json({
      results: scoredApplications,
      total: scoredApplications.length,
      isPremium
    });
  } catch (error) {
    console.error('Error performing resume scoring:', error);
    return next(error);
  }
});

module.exports = router;