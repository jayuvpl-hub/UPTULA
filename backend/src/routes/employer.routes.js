const express = require('express');
const { body } = require('express-validator');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { query } = require('../db');
const { authenticate } = require('../middleware/auth');
const { smartNotifyForJob } = require('../utils/smartNotifier');
const { uploadPath, uploadPathFromUrl } = require('../config/env');
const { resolveCompanyLogo } = require('../config/constants');
const { applyUserContactUpdate } = require('../utils/email');

const router = express.Router();

const ensureDirExists = (dirPath) => {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
};

const ANALYTICS_FEATURE_KEY = 'job_analytics_dashboard';
const ANALYTICS_TRIAL_LIMIT = 3;
const BILLING_PAUSED = true;
const ANALYTICS_PLAN = {
  id: 'analytics_pro',
  name: 'Insight Pulse Analytics',
  description: 'Unlimited employer analytics reports, candidate funnels & premium charts.',
  price: 19.99,
  currency: 'USD',
  durationDays: 30
};

/**
 * Normalize salary fields for job INSERT (fixed range or negotiable).
 * Populates salary_range for backward compatibility.
 */
function resolveSalaryForInsert(body) {
  const rawType = String(body.salary_type || body.salaryType || '').toLowerCase().trim();

  if (rawType === 'negotiable' || String(body.salaryRange || '').toLowerCase().trim() === 'negotiable') {
    return {
      salaryMin: null,
      salaryMax: null,
      salaryType: 'negotiable',
      salaryRange: 'negotiable',
    };
  }

  let salaryMin = body.salary_min != null && body.salary_min !== ''
    ? parseInt(body.salary_min, 10)
    : NaN;
  let salaryMax = body.salary_max != null && body.salary_max !== ''
    ? parseInt(body.salary_max, 10)
    : NaN;

  const legacyRange = String(body.salaryRange || '').trim();
  if ((!Number.isInteger(salaryMin) || !Number.isInteger(salaryMax)) && /^\d+-\d+$/.test(legacyRange)) {
    const [minStr, maxStr] = legacyRange.split('-');
    salaryMin = parseInt(minStr, 10);
    salaryMax = parseInt(maxStr, 10);
  }

  if (!Number.isInteger(salaryMin) || salaryMin <= 0 || !Number.isInteger(salaryMax) || salaryMax <= 0) {
    return { error: 'salary_min and salary_max must be positive integers when salary_type is fixed' };
  }
  if (salaryMin > salaryMax) {
    return { error: 'salary_min must not exceed salary_max' };
  }

  return {
    salaryMin,
    salaryMax,
    salaryType: 'fixed',
    salaryRange: `${salaryMin}-${salaryMax}`,
  };
}

const safeParseJson = (value, fallback = {}) => {
  if (!value) return { ...fallback };
  if (typeof value === 'object') return { ...fallback, ...value };
  try {
    return { ...fallback, ...JSON.parse(value) };
  } catch (_) {
    return { ...fallback };
  }
};

async function fetchAnalyticsAccess(employerId) {
  const rows = await query(
    `SELECT * FROM employer_feature_access WHERE employer_id = ? AND feature_key = ? LIMIT 1`,
    [employerId, ANALYTICS_FEATURE_KEY]
  );
  return rows[0] || null;
}

async function ensureAnalyticsAccess(employerId) {
  const existing = await fetchAnalyticsAccess(employerId);
  if (existing) return existing;

  await query(
    `
      INSERT INTO employer_feature_access (employer_id, feature_key, trial_limit)
      VALUES (?, ?, ?)
    `,
    [employerId, ANALYTICS_FEATURE_KEY, ANALYTICS_TRIAL_LIMIT]
  );

  return fetchAnalyticsAccess(employerId);
}

function isAccessActive(record) {
  if (!record) return false;
  if (!record.is_unlocked) return false;
  if (!record.expires_at) return true;
  return new Date(record.expires_at) > new Date();
}

function formatAccessRecord(record) {
  if (!record) {
    return {
      featureKey: ANALYTICS_FEATURE_KEY,
      isUnlocked: false,
      trialViewsUsed: 0,
      trialLimit: ANALYTICS_TRIAL_LIMIT,
      trialRemaining: ANALYTICS_TRIAL_LIMIT
    };
  }

  const trialViews = Number(record.trial_views_used || 0);
  const trialLimit = Number(record.trial_limit || ANALYTICS_TRIAL_LIMIT);

  return {
    id: record.id,
    featureKey: record.feature_key,
    isUnlocked: !!record.is_unlocked && (!record.expires_at || new Date(record.expires_at) > new Date()),
    trialViewsUsed: trialViews,
    trialLimit,
    trialRemaining: Math.max(0, trialLimit - trialViews),
    expiresAt: record.expires_at,
    unlockedAt: record.unlocked_at
  };
}

// Simple disk storage for job logos
const jobsUploadDir = uploadPath('jobs');
ensureDirExists(jobsUploadDir);

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, jobsUploadDir);
  },
  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname || '');
    const base = path.basename(file.originalname || 'logo', ext).replace(/[^a-zA-Z0-9_-]/g, '');
    cb(null, `${Date.now()}_${base}${ext}`);
  }
});
const upload = multer({ storage });

const employerLogoDir = uploadPath('companies');
ensureDirExists(employerLogoDir);

const employerLogoStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, employerLogoDir);
  },
  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname || '');
    const base = path.basename(file.originalname || 'company_logo', ext).replace(/[^a-zA-Z0-9_-]/g, '');
    cb(null, `${Date.now()}_${req.user?.id || 'employer'}_${base}${ext}`);
  }
});

const employerLogoUpload = multer({
  storage: employerLogoStorage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: function (req, file, cb) {
    if (!file.mimetype.startsWith('image/')) {
      return cb(new Error('Only image files are allowed for company logos'), false);
    }
    cb(null, true);
  }
});

// Get employer profile
router.get('/profile', authenticate, async (req, res, next) => {
  try {
    const userId = req.user.id;
    
    // Check if user is an employer
    if (req.user.role !== 'provider') {
      return res.status(403).json({ message: 'Access denied. Employer profile only.' });
    }
    
    // Get user basic info
    const userInfo = await query(
      'SELECT id, full_name, email, phone FROM users WHERE id = ?',
      [userId]
    );
    
    if (userInfo.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Get employer profile details
    const profileInfo = await query(
      'SELECT * FROM employer_profiles WHERE user_id = ?',
      [userId]
    );
    
    const user = userInfo[0];
    const profile = profileInfo.length > 0 ? profileInfo[0] : {};
    
    // Combine user info with employer profile info
    const profileData = {
      companyName: profile.company_name || user.full_name || '',
      contactPerson: profile.contact_person || user.full_name || '',
      email: profile.company_email || user.email,
      phone: profile.phone || user.phone || '',
      address: profile.address || '',
      website: profile.website || '',
      industry: profile.industry || '',
      companySize: profile.company_size || '',
      description: profile.description || '',
      linkedin: profile.linkedin || '',
      twitter: profile.twitter || '',
      facebook: profile.facebook || '',
      google: profile.google || '',
      logoUrl: profile.logo_url || '',
      foundedYear: profile.founded_year || '',
      companyType: profile.company_type || '',
      isVerified: profile.is_verified || false,
      // FIX 6: true only when a real company profile (with a company name) exists.
      // Used by the frontend to gate job posting until the profile is created.
      hasCompanyProfile: !!(profile.company_name && String(profile.company_name).trim())
    };

    res.json({ profile: profileData });
  } catch (err) {
    return next(err);
  }
});

const employerProfileUpdateValidators = [
  body('companyName').optional({ checkFalsy: true, nullable: true }).trim(),
  body('contactPerson').optional({ checkFalsy: true, nullable: true }).trim(),
  body('email').optional({ checkFalsy: true, nullable: true }).isEmail().normalizeEmail().withMessage('Valid email required'),
  body('phone').optional({ checkFalsy: true, nullable: true }).isMobilePhone().withMessage('Valid phone number required'),
  body('address').optional({ checkFalsy: true, nullable: true }).trim(),
  body('website').optional({ checkFalsy: true, nullable: true }).isURL().withMessage('Valid website URL required'),
  body('industry').optional({ checkFalsy: true, nullable: true }).trim(),
  body('companySize').optional({ checkFalsy: true, nullable: true }).trim(),
  body('description').optional({ checkFalsy: true, nullable: true }).trim(),
  body('linkedin').optional({ checkFalsy: true, nullable: true }).isURL().withMessage('Valid LinkedIn URL required'),
  body('twitter').optional({ checkFalsy: true, nullable: true }).isURL().withMessage('Valid Twitter URL required'),
  body('facebook').optional({ checkFalsy: true, nullable: true }).isURL().withMessage('Valid Facebook URL required'),
  body('google').optional({ checkFalsy: true, nullable: true }).isURL().withMessage('Valid Google+ URL required'),
  body('foundedYear').optional({ checkFalsy: true, nullable: true }).isInt({ min: 1800, max: new Date().getFullYear() }).withMessage('Valid founded year required'),
  body('companyType').optional({ checkFalsy: true, nullable: true }).isIn(['startup','small_business','medium_business','large_corporation','non_profit']).withMessage('Invalid company type')
];

const employerProfileUpload = employerLogoUpload.single('companyLogo');

// Update employer profile
async function updateEmployerProfile(req, res, next) {
  try {
    const { validationResult } = require('express-validator');
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    // Check if user is an employer
    if (req.user.role !== 'provider') {
      return res.status(403).json({ message: 'Access denied. Employer profile only.' });
    }

    const userId = req.user.id;
    const {
      companyName,
      contactPerson,
      email,
      phone,
      address,
      website,
      industry,
      companySize,
      description,
      linkedin,
      twitter,
      facebook,
      google,
      foundedYear,
      companyType
    } = req.body;

    const profileInfo = await query(
      'SELECT id, logo_url FROM employer_profiles WHERE user_id = ?',
      [userId]
    );
    const hasProfile = profileInfo.length > 0;
    const existingProfile = hasProfile ? profileInfo[0] : null;
    const previousLogoPath = existingProfile?.logo_url || null;
    let logoUrl = req.body.logoUrl || previousLogoPath || null;

    if (req.file) {
      logoUrl = `/uploads/companies/${req.file.filename}`;
      if (previousLogoPath) {
        const oldFilePath = uploadPathFromUrl(previousLogoPath);
        if (fs.existsSync(oldFilePath)) {
          fs.unlinkSync(oldFilePath);
        }
      }
    }

    if (hasProfile) {
      // Update existing employer profile
      await query(`
        UPDATE employer_profiles SET 
          company_name = ?, 
          contact_person = ?, 
          company_email = ?, 
          phone = ?, 
          address = ?, 
          website = ?, 
          industry = ?, 
          company_size = ?, 
          description = ?, 
          linkedin = ?, 
          twitter = ?, 
          facebook = ?, 
          google = ?, 
          logo_url = ?, 
          founded_year = ?, 
          company_type = ?,
          updated_at = CURRENT_TIMESTAMP
        WHERE user_id = ?
      `, [
        companyName || null,
        contactPerson || null,
        email || null,
        phone || null,
        address || null,
        website || null,
        industry || null,
        companySize || null,
        description || null,
        linkedin || null,
        twitter || null,
        facebook || null,
        google || null,
        logoUrl || null,
        foundedYear || null,
        companyType || null,
        userId
      ]);
    } else {
      // Create new employer profile
      await query(`
        INSERT INTO employer_profiles (
          user_id, company_name, contact_person, company_email, phone, address, 
          website, industry, company_size, description, linkedin, twitter, 
          facebook, google, logo_url, founded_year, company_type
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        userId,
        companyName || null,
        contactPerson || null,
        email || null,
        phone || null,
        address || null,
        website || null,
        industry || null,
        companySize || null,
        description || null,
        linkedin || null,
        twitter || null,
        facebook || null,
        google || null,
        logoUrl || null,
        foundedYear || null,
        companyType || null
      ]);
    }

    // Update user basic info if email or phone changed
    if (email || phone !== undefined) {
      const contactResult = await applyUserContactUpdate(query, userId, { email, phone });
      if (!contactResult.ok) {
        return res.status(contactResult.status || 409).json({ message: contactResult.message });
      }
    }

    res.json({ message: 'Employer profile updated successfully', logoUrl });
  } catch (err) {
    if (err && err.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ message: 'Email already registered' });
    }
    if (req.file) {
      const uploadedPath = path.join(employerLogoDir, req.file.filename);
      if (fs.existsSync(uploadedPath)) {
        fs.unlinkSync(uploadedPath);
      }
    }
    return next(err);
  }
}

router.put('/profile', authenticate, employerProfileUpload, employerProfileUpdateValidators, updateEmployerProfile);

// // Create a new job posting
// router.post('/jobs', authenticate, upload.single('companyLogo'), [
//   body('jobTitle').trim().isLength({ min: 1 }).withMessage('Job title is required'),
//   body('companyName').trim().isLength({ min: 1 }).withMessage('Company name is required'),
//   body('description').trim().isLength({ min: 10 }).withMessage('Description must be at least 10 characters'),
//   body('email').optional().isEmail().normalizeEmail().withMessage('Valid email required'),
//   body('phone').optional().isMobilePhone().withMessage('Valid phone number required'),
//   body('website').optional().custom((value) => {
//     if (!value || value.trim() === '') return true;
//     // Check if it's a valid URL format
//     try {
//       new URL(value);
//       return true;
//     } catch {
//       throw new Error('Valid website URL required (must be a proper URL format)');
//     }
//   }),
//   body('noOfVacancy').optional().isInt({ min: 1 }).withMessage('Number of vacancy must be at least 1'),
//   body('facebook').optional().custom((value) => {
//     if (!value || value.trim() === '') return true;
//     try {
//       new URL(value);
//       return true;
//     } catch {
//       throw new Error('Valid Facebook URL required');
//     }
//   }),
//   body('twitter').optional().custom((value) => {
//     if (!value || value.trim() === '') return true;
//     try {
//       new URL(value);
//       return true;
//     } catch {
//       throw new Error('Valid Twitter URL required');
//     }
//   }),
//   body('linkedin').optional().custom((value) => {
//     if (!value || value.trim() === '') return true;
//     try {
//       new URL(value);
//       return true;
//     } catch {
//       throw new Error('Valid LinkedIn URL required');
//     }
//   }),
//   body('pinterest').optional().custom((value) => {
//     if (!value || value.trim() === '') return true;
//     try {
//       new URL(value);
//       return true;
//     } catch {
//       throw new Error('Valid Pinterest URL required');
//     }
//   }),
//   body('instagram').optional().custom((value) => {
//     if (!value || value.trim() === '') return true;
//     try {
//       new URL(value);
//       return true;
//     } catch {
//       throw new Error('Valid Instagram URL required');
//     }
//   }),
//   body('salary_type').optional().isIn(['fixed', 'negotiable']).withMessage('salary_type must be fixed or negotiable'),
//   body('salary_min').optional().isInt({ min: 1 }).withMessage('salary_min must be a positive integer'),
//   body('salary_max').optional().isInt({ min: 1 }).withMessage('salary_max must be a positive integer')
// ], async (req, res, next) => {
//   try {
//     // Debug: Log the incoming request body
//     console.log('Job creation request body:', req.body);
    
//     const { validationResult } = require('express-validator');
//     const errors = validationResult(req);
//     if (!errors.isEmpty()) {
//       console.log('Validation errors:', errors.array());
//       return res.status(400).json({ errors: errors.array() });
//     }

//     // Check if user is an employer
//     if (req.user.role !== 'provider') {
//       return res.status(403).json({ message: 'Access denied. Only employers can post jobs.' });
//     }

//     // FIX 6 (Company Profile Gate): employers must create a company profile
//     // (with a company name) before they can post jobs / appear in listings.
//     const profileRows = await query(
//       'SELECT company_name FROM employer_profiles WHERE user_id = ? LIMIT 1',
//       [req.user.id]
//     );
//     const profileCompanyName = profileRows.length ? String(profileRows[0].company_name || '').trim() : '';
//     if (!profileCompanyName) {
//       return res.status(403).json({
//         message: 'You must complete your Company Profile before posting jobs.',
//         code: 'COMPANY_PROFILE_REQUIRED'
//       });
//     }

//     const salaryFields = resolveSalaryForInsert(req.body);
//     if (salaryFields.error) {
//       return res.status(400).json({ message: salaryFields.error });
//     }

//     const employerId = req.user.id;
//     const {
//       jobTitle,
//       companyName,
//       category,
//       description,
//       noOfVacancy,
//       experience,
//       companyLogo,
//       jobType,
//       qualification,
//       skills,
//       email,
//       phone,
//       website,
//       address,
//       city,
//       state,
//       country,
//       zipCode,
//       facebook,
//       google,
//       twitter,
//       linkedin,
//       pinterest,
//       instagram
//     } = req.body;

//     // Handle file upload for company logo
//     let logoUrl = null;
//     if (req.file) {
//       logoUrl = `/uploads/jobs/${req.file.filename}`;
//     }

//     // Insert job into database
//     const result = await query(`
//       INSERT INTO jobs (
//         employer_id, job_title, company_name, category, description,
//         salary_range, salary_min, salary_max, salary_type,
//         no_of_vacancy, experience, company_logo, job_type, qualification, skills,
//         email, phone, website, address, city, state, country, zip_code,
//         facebook, google, twitter, linkedin, pinterest, instagram, status
//       ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
//     `, [
//       employerId,
//       jobTitle,
//       profileCompanyName, // FIX 6: always the company-profile name (never a person name / typo)
//       category || null,
//       description,
//       salaryFields.salaryRange,
//       salaryFields.salaryMin,
//       salaryFields.salaryMax,
//       salaryFields.salaryType,
//       noOfVacancy || 1,
//       experience || null,
//       logoUrl,
//       jobType || 'full_time',
//       qualification || null,
//       skills || null,
//       email || null,
//       phone || null,
//       website || null,
//       address || null,
//       city || null,
//       state || null,
//       country || null,
//       zipCode || null,
//       facebook || null,
//       google || null,
//       twitter || null,
//       linkedin || null,
//       pinterest || null,
//       instagram || null,
//       'active'
//     ]);

//     const jobForScoring = {
//       job_title: jobTitle,
//       company_name: companyName,
//       skills: skills || null,
//       address: address || null,
//       city: city || null,
//       state: state || null,
//       country: country || null,
//     };

//     smartNotifyForJob({
//       job: jobForScoring,
//       jobId: result.insertId,
//       excludeUserIds: [employerId]
//     }).catch((err) => {
//       console.error('[employer.routes] smartNotifyForJob failed:', err.message);
//     });

//     res.status(201).json({ 
//       message: 'Job posted successfully',
//       jobId: result.insertId,
//       logoUrl
//     });
//   } catch (err) {
//     if (req.file) {
//       const uploadedPath = path.join(jobsUploadDir, req.file.filename);
//       if (fs.existsSync(uploadedPath)) {
//         fs.unlinkSync(uploadedPath);
//       }
//     }
//     return next(err);
//   }
// });
const jobUpdateValidators = [
  body('jobTitle').optional().trim().isLength({ min: 1 }).withMessage('Job title is required'),
  body('description').optional().trim().isLength({ min: 10 }).withMessage('Description must be at least 10 characters'),
  body('email').optional().isEmail().normalizeEmail().withMessage('Valid email required'),
  body('phone').optional().isMobilePhone().withMessage('Valid phone number required'),
  body('website').optional().isURL().withMessage('Valid website URL required'),
  body('noOfVacancy').optional().isInt({ min: 1 }).withMessage('Number of vacancy must be at least 1')
];

async function updateEmployerJob(req, res, next) {
  try {
    const { validationResult } = require('express-validator');
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
 
    // Check if user is an employer
    if (req.user.role !== 'provider') {
      return res.status(403).json({ message: 'Access denied. Only employers can update jobs.' });
    }
 
    const jobId = req.params.id;
    const employerId = req.user.id;
 
    // Check if job exists and belongs to employer
    const existingJob = await query(
      'SELECT id FROM jobs WHERE id = ? AND employer_id = ?',
      [jobId, employerId]
    );
 
    if (existingJob.length === 0) {
      return res.status(404).json({ message: 'Job not found' });
    }
 
    const {
      jobTitle,
      companyName,
      category,
      description,
      salaryRange,
      noOfVacancy,
      experience,
      jobType,
      qualification,
      skills,
      email,
      phone,
      website,
      address,
      city,
      state,
      country,
      zipCode,
      facebook,
      google,
      twitter,
      linkedin,
      pinterest,
      instagram,
      status
    } = req.body;
 
    // Build update query dynamically
    const updateFields = [];
    const updateValues = [];
 
    if (jobTitle) { updateFields.push('job_title = ?'); updateValues.push(jobTitle); }
    if (companyName) { updateFields.push('company_name = ?'); updateValues.push(companyName); }
    if (category) { updateFields.push('category = ?'); updateValues.push(category); }
    if (description) { updateFields.push('description = ?'); updateValues.push(description); }
    if (salaryRange) { updateFields.push('salary_range = ?'); updateValues.push(salaryRange); }
    if (noOfVacancy) { updateFields.push('no_of_vacancy = ?'); updateValues.push(noOfVacancy); }
    if (experience) { updateFields.push('experience = ?'); updateValues.push(experience); }
    if (jobType) { updateFields.push('job_type = ?'); updateValues.push(jobType); }
    if (qualification) { updateFields.push('qualification = ?'); updateValues.push(qualification); }
    if (skills) { updateFields.push('skills = ?'); updateValues.push(skills); }
    if (email) { updateFields.push('email = ?'); updateValues.push(email); }
    if (phone) { updateFields.push('phone = ?'); updateValues.push(phone); }
    if (website) { updateFields.push('website = ?'); updateValues.push(website); }
    if (address) { updateFields.push('address = ?'); updateValues.push(address); }
    if (city) { updateFields.push('city = ?'); updateValues.push(city); }
    if (state) { updateFields.push('state = ?'); updateValues.push(state); }
    if (country) { updateFields.push('country = ?'); updateValues.push(country); }
    if (zipCode) { updateFields.push('zip_code = ?'); updateValues.push(zipCode); }
    if (facebook) { updateFields.push('facebook = ?'); updateValues.push(facebook); }
    if (google) { updateFields.push('google = ?'); updateValues.push(google); }
    if (twitter) { updateFields.push('twitter = ?'); updateValues.push(twitter); }
    if (linkedin) { updateFields.push('linkedin = ?'); updateValues.push(linkedin); }
    if (pinterest) { updateFields.push('pinterest = ?'); updateValues.push(pinterest); }
    if (instagram) { updateFields.push('instagram = ?'); updateValues.push(instagram); }
    if (status) { updateFields.push('status = ?'); updateValues.push(status); }
 
    if (updateFields.length > 0) {
      updateFields.push('updated_at = CURRENT_TIMESTAMP');
      updateValues.push(jobId);
 
      await query(
        `UPDATE jobs SET ${updateFields.join(', ')} WHERE id = ?`,
        updateValues
      );
    }
 
    res.json({ message: 'Job updated successfully' });
  } catch (err) {
    return next(err);
  }
}

router.put('/jobs/:id', authenticate, jobUpdateValidators, updateEmployerJob);
 
router.post('/jobs', authenticate, [
  body('jobTitle').trim().isLength({ min: 1 }).withMessage('Job title is required'),
  body('companyName').trim().isLength({ min: 1 }).withMessage('Company name is required'),
  body('description').trim().isLength({ min: 10 }).withMessage('Description must be at least 10 characters'),
  body('email').optional().isEmail().normalizeEmail().withMessage('Valid email required'),
  body('phone').optional().isMobilePhone().withMessage('Valid phone number required'),
  body('website').optional().custom((value) => {
    if (!value || value.trim() === '') return true;
    // Check if it's a valid URL format
    try {
      new URL(value);
      return true;
    } catch {
      throw new Error('Valid website URL required (must be a proper URL format)');
    }
  }),
  body('noOfVacancy').optional().isInt({ min: 1 }).withMessage('Number of vacancy must be at least 1'),
  body('facebook').optional().custom((value) => {
    if (!value || value.trim() === '') return true;
    try {
      new URL(value);
      return true;
    } catch {
      throw new Error('Valid Facebook URL required');
    }
  }),
  body('twitter').optional().custom((value) => {
    if (!value || value.trim() === '') return true;
    try {
      new URL(value);
      return true;
    } catch {
      throw new Error('Valid Twitter URL required');
    }
  }),
  body('linkedin').optional().custom((value) => {
    if (!value || value.trim() === '') return true;
    try {
      new URL(value);
      return true;
    } catch {
      throw new Error('Valid LinkedIn URL required');
    }
  }),
  body('pinterest').optional().custom((value) => {
    if (!value || value.trim() === '') return true;
    try {
      new URL(value);
      return true;
    } catch {
      throw new Error('Valid Pinterest URL required');
    }
  }),
  body('instagram').optional().custom((value) => {
    if (!value || value.trim() === '') return true;
    try {
      new URL(value);
      return true;
    } catch {
      throw new Error('Valid Instagram URL required');
    }
  }),
  body('salary_type').optional().isIn(['fixed', 'negotiable']).withMessage('salary_type must be fixed or negotiable'),
  body('salary_min').optional().isInt({ min: 1 }).withMessage('salary_min must be a positive integer'),
  body('salary_max').optional().isInt({ min: 1 }).withMessage('salary_max must be a positive integer')
], async (req, res, next) => {
  try {
    // Debug: Log the incoming request body
    console.log('Job creation request body:', req.body);
 
    const { validationResult } = require('express-validator');
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.log('Validation errors:', errors.array());
      return res.status(400).json({ errors: errors.array() });
    }
 
    // Check if user is an employer
    if (req.user.role !== 'provider') {
      return res.status(403).json({ message: 'Access denied. Only employers can post jobs.' });
    }
 
    // FIX 6 (Company Profile Gate): employers must create a company profile
    // (with a company name) before they can post jobs / appear in listings.
    const profileRows = await query(
      'SELECT company_name FROM employer_profiles WHERE user_id = ? LIMIT 1',
      [req.user.id]
    );
    const profileCompanyName = profileRows.length ? String(profileRows[0].company_name || '').trim() : '';
    if (!profileCompanyName) {
      return res.status(403).json({
        message: 'You must complete your Company Profile before posting jobs.',
        code: 'COMPANY_PROFILE_REQUIRED'
      });
    }
 
    const salaryFields = resolveSalaryForInsert(req.body);
    if (salaryFields.error) {
      return res.status(400).json({ message: salaryFields.error });
    }
 
    const employerId = req.user.id;
    const {
      jobTitle,
      companyName,
      category,
      description,
      noOfVacancy,
      experience,
      jobType,
      qualification,
      skills,
      email,
      phone,
      website,
      address,
      city,
      state,
      country,
      zipCode,
      facebook,
      google,
      twitter,
      linkedin,
      pinterest,
      instagram
    } = req.body;
 
    // Insert job into database
    // company_logo intentionally left NULL — logo is resolved at read time
    // from employer_profiles.logo_url (falling back to the default image).
    const result = await query(`
      INSERT INTO jobs (
        employer_id, job_title, company_name, category, description,
        salary_range, salary_min, salary_max, salary_type,
        no_of_vacancy, experience, job_type, qualification, skills,
        email, phone, website, address, city, state, country, zip_code,
        facebook, google, twitter, linkedin, pinterest, instagram, status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      employerId,
      jobTitle,
      profileCompanyName, // FIX 6: always the company-profile name (never a person name / typo)
      category || null,
      description,
      salaryFields.salaryRange,
      salaryFields.salaryMin,
      salaryFields.salaryMax,
      salaryFields.salaryType,
      noOfVacancy || 1,
      experience || null,
      jobType || 'full_time',
      qualification || null,
      skills || null,
      email || null,
      phone || null,
      website || null,
      address || null,
      city || null,
      state || null,
      country || null,
      zipCode || null,
      facebook || null,
      google || null,
      twitter || null,
      linkedin || null,
      pinterest || null,
      instagram || null,
      'active'
    ]);
 
    const jobForScoring = {
      job_title: jobTitle,
      company_name: companyName,
      skills: skills || null,
      address: address || null,
      city: city || null,
      state: state || null,
      country: country || null,
    };
 
    smartNotifyForJob({
      job: jobForScoring,
      jobId: result.insertId,
      excludeUserIds: [employerId]
    }).catch((err) => {
      console.error('[employer.routes] smartNotifyForJob failed:', err.message);
    });
 
    res.status(201).json({
      message: 'Job posted successfully',
      jobId: result.insertId
    });
  } catch (err) {
    return next(err);
  }
});

// Get all jobs posted by the employer
router.get('/jobs', authenticate, async (req, res, next) => {
  try {
    // Check if user is an employer
    if (req.user.role !== 'provider') {
      return res.status(403).json({ message: 'Access denied. Employer access only.' });
    }

    const employerId = req.user.id;
    const { page = 1, limit = 10, status = 'active' } = req.query;
    const offset = (page - 1) * limit;

    // Get jobs with pagination
    const jobs = await query(`
      SELECT 
        j.id, j.job_title, j.company_name, j.category, j.description, j.salary_range,
        j.no_of_vacancy, j.experience, j.company_logo, ep.logo_url AS employer_logo_url, j.job_type, j.qualification, j.skills,
        j.email, j.phone, j.website, j.address, j.city, j.state, j.country, j.zip_code,
        j.facebook, j.google, j.twitter, j.linkedin, j.pinterest, j.instagram,
        j.status, j.is_featured, j.views_count, j.applications_count,
        j.created_at, j.updated_at
      FROM jobs j
      LEFT JOIN employer_profiles ep ON ep.user_id = j.employer_id
      WHERE j.employer_id = ? AND j.status = ?
      ORDER BY j.created_at DESC
      LIMIT ? OFFSET ?
    `, [employerId, status, parseInt(limit), parseInt(offset)]);

    // Get total count
    const countResult = await query(
      'SELECT COUNT(*) as total FROM jobs WHERE employer_id = ? AND status = ?',
      [employerId, status]
    );

    res.json({
      jobs: jobs.map((job) => ({ ...job, companyLogoUrl: resolveCompanyLogo(job) })),
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(countResult[0].total / limit),
        totalJobs: countResult[0].total,
        hasNext: parseInt(page) < Math.ceil(countResult[0].total / limit),
        hasPrev: parseInt(page) > 1
      }
    });
  } catch (err) {
    return next(err);
  }
});

// Get a specific job by ID (for employer)
router.get('/jobs/:id', authenticate, async (req, res, next) => {
  try {
    // Check if user is an employer
    if (req.user.role !== 'provider') {
      return res.status(403).json({ message: 'Access denied. Employer access only.' });
    }

    const jobId = req.params.id;
    const employerId = req.user.id;

    const jobs = await query(`
      SELECT 
        j.id, j.job_title, j.company_name, j.category, j.description, j.salary_range,
        j.no_of_vacancy, j.experience, j.company_logo, ep.logo_url AS employer_logo_url, j.job_type, j.qualification, j.skills,
        j.email, j.phone, j.website, j.address, j.city, j.state, j.country, j.zip_code,
        j.facebook, j.google, j.twitter, j.linkedin, j.pinterest, j.instagram,
        j.status, j.is_featured, j.views_count, j.applications_count,
        j.created_at, j.updated_at
      FROM jobs j
      LEFT JOIN employer_profiles ep ON ep.user_id = j.employer_id
      WHERE j.id = ? AND j.employer_id = ?
    `, [jobId, employerId]);

    if (jobs.length === 0) {
      return res.status(404).json({ message: 'Job not found' });
    }

    res.json({ job: { ...jobs[0], companyLogoUrl: resolveCompanyLogo(jobs[0]) } });
  } catch (err) {
    return next(err);
  }
});

// // Update a job posting
// router.put('/jobs/:id', authenticate, upload.single('companyLogo'), [
//   body('jobTitle').optional().trim().isLength({ min: 1 }).withMessage('Job title is required'),
//   body('description').optional().trim().isLength({ min: 10 }).withMessage('Description must be at least 10 characters'),
//   body('email').optional().isEmail().normalizeEmail().withMessage('Valid email required'),
//   body('phone').optional().isMobilePhone().withMessage('Valid phone number required'),
//   body('website').optional().isURL().withMessage('Valid website URL required'),
//   body('noOfVacancy').optional().isInt({ min: 1 }).withMessage('Number of vacancy must be at least 1')
// ], async (req, res, next) => {
//   try {
//     const { validationResult } = require('express-validator');
//     const errors = validationResult(req);
//     if (!errors.isEmpty()) {
//       return res.status(400).json({ errors: errors.array() });
//     }

//     // Check if user is an employer
//     if (req.user.role !== 'provider') {
//       return res.status(403).json({ message: 'Access denied. Only employers can update jobs.' });
//     }

//     const jobId = req.params.id;
//     const employerId = req.user.id;

//     // Check if job exists and belongs to employer
//     const existingJob = await query(
//       'SELECT id, company_logo FROM jobs WHERE id = ? AND employer_id = ?',
//       [jobId, employerId]
//     );

//     if (existingJob.length === 0) {
//       return res.status(404).json({ message: 'Job not found' });
//     }

//     const {
//       jobTitle,
//       companyName,
//       category,
//       description,
//       salaryRange,
//       noOfVacancy,
//       experience,
//       jobType,
//       qualification,
//       skills,
//       email,
//       phone,
//       website,
//       address,
//       city,
//       state,
//       country,
//       zipCode,
//       facebook,
//       google,
//       twitter,
//       linkedin,
//       pinterest,
//       instagram,
//       status
//     } = req.body;

//     // Handle file upload for company logo
//     let logoUrl = null;
//     if (req.file) {
//       logoUrl = `/uploads/jobs/${req.file.filename}`;
//       const previousLogo = existingJob[0].company_logo;
//       if (previousLogo) {
//         const previousPath = uploadPathFromUrl(previousLogo);
//         if (fs.existsSync(previousPath)) {
//           fs.unlinkSync(previousPath);
//         }
//       }
//     }

//     // Build update query dynamically
//     const updateFields = [];
//     const updateValues = [];

//     if (jobTitle) { updateFields.push('job_title = ?'); updateValues.push(jobTitle); }
//     if (companyName) { updateFields.push('company_name = ?'); updateValues.push(companyName); }
//     if (category) { updateFields.push('category = ?'); updateValues.push(category); }
//     if (description) { updateFields.push('description = ?'); updateValues.push(description); }
//     if (salaryRange) { updateFields.push('salary_range = ?'); updateValues.push(salaryRange); }
//     if (noOfVacancy) { updateFields.push('no_of_vacancy = ?'); updateValues.push(noOfVacancy); }
//     if (experience) { updateFields.push('experience = ?'); updateValues.push(experience); }
//     if (logoUrl) { updateFields.push('company_logo = ?'); updateValues.push(logoUrl); }
//     if (jobType) { updateFields.push('job_type = ?'); updateValues.push(jobType); }
//     if (qualification) { updateFields.push('qualification = ?'); updateValues.push(qualification); }
//     if (skills) { updateFields.push('skills = ?'); updateValues.push(skills); }
//     if (email) { updateFields.push('email = ?'); updateValues.push(email); }
//     if (phone) { updateFields.push('phone = ?'); updateValues.push(phone); }
//     if (website) { updateFields.push('website = ?'); updateValues.push(website); }
//     if (address) { updateFields.push('address = ?'); updateValues.push(address); }
//     if (city) { updateFields.push('city = ?'); updateValues.push(city); }
//     if (state) { updateFields.push('state = ?'); updateValues.push(state); }
//     if (country) { updateFields.push('country = ?'); updateValues.push(country); }
//     if (zipCode) { updateFields.push('zip_code = ?'); updateValues.push(zipCode); }
//     if (facebook) { updateFields.push('facebook = ?'); updateValues.push(facebook); }
//     if (google) { updateFields.push('google = ?'); updateValues.push(google); }
//     if (twitter) { updateFields.push('twitter = ?'); updateValues.push(twitter); }
//     if (linkedin) { updateFields.push('linkedin = ?'); updateValues.push(linkedin); }
//     if (pinterest) { updateFields.push('pinterest = ?'); updateValues.push(pinterest); }
//     if (instagram) { updateFields.push('instagram = ?'); updateValues.push(instagram); }
//     if (status) { updateFields.push('status = ?'); updateValues.push(status); }

//     if (updateFields.length > 0) {
//       updateFields.push('updated_at = CURRENT_TIMESTAMP');
//       updateValues.push(jobId);

//       await query(
//         `UPDATE jobs SET ${updateFields.join(', ')} WHERE id = ?`,
//         updateValues
//       );
//     }

//     res.json({ message: 'Job updated successfully' });
//   } catch (err) {
//     if (req.file) {
//       const uploadedPath = path.join(jobsUploadDir, req.file.filename);
//       if (fs.existsSync(uploadedPath)) {
//         fs.unlinkSync(uploadedPath);
//       }
//     }
//     return next(err);
//   }
// });

// Delete a job posting
async function deleteEmployerJob(req, res, next) {
  try {
    // Check if user is an employer
    if (req.user.role !== 'provider') {
      return res.status(403).json({ message: 'Access denied. Only employers can delete jobs.' });
    }

    const jobId = req.params.id;
    const employerId = req.user.id;

    // Check if job exists and belongs to employer
    const existingJob = await query(
      'SELECT id FROM jobs WHERE id = ? AND employer_id = ?',
      [jobId, employerId]
    );

    if (existingJob.length === 0) {
      return res.status(404).json({ message: 'Job not found' });
    }

    // Delete the job
    await query('DELETE FROM jobs WHERE id = ?', [jobId]);

    res.json({ message: 'Job deleted successfully' });
  } catch (err) {
    return next(err);
  }
}

router.delete('/jobs/:id', authenticate, deleteEmployerJob);

// Get all applications for employer's jobs
router.get('/applications', authenticate, async (req, res, next) => {
  try {
    const employerId = req.user.id;
    
    const applications = await query(`
      SELECT 
        a.id,
        a.job_id,
        a.seeker_id,
        a.name,
        a.email,
        a.phone,
        a.resume_url,
        a.pasted_cv,
        a.created_at,
        j.job_title,
        j.company_name
      FROM applications a
      JOIN jobs j ON j.id = a.job_id
      WHERE j.employer_id = ?
      ORDER BY a.created_at DESC
    `, [employerId]);
    
    res.json({ applications });
  } catch (err) {
    return next(err);
  }
});

// Get candidate profile for a specific application (employer-facing detail view).
// Returns profile fields including accessibility info. Only accessible to the
// employer who owns the job the candidate applied to.
router.get('/applications/:applicationId/candidate-profile', authenticate, async (req, res, next) => {
  try {
    const employerId = req.user.id;
    const applicationId = Number(req.params.applicationId);

    // Verify this application belongs to one of the employer's jobs.
    const [app] = await query(
      `SELECT a.seeker_id FROM applications a
       JOIN jobs j ON j.id = a.job_id
       WHERE a.id = ? AND j.employer_id = ?`,
      [applicationId, employerId]
    );
    if (!app) return res.status(404).json({ message: 'Application not found or access denied.' });

    const seekerId = app.seeker_id;
    const [u] = await query(
      `SELECT full_name, email, phone FROM users WHERE id = ? LIMIT 1`,
      [seekerId]
    );
    const [p] = await query(
      `SELECT bio, skills, experience, education, certifications,
              preferred_job_role, preferred_location, employment_type,
              current_salary, expected_salary, notice_period,
              linkedin, google, facebook, twitter
       FROM user_profiles WHERE user_id = ? LIMIT 1`,
      [seekerId]
    );
    const [pwd] = await query(
      `SELECT has_disability, disability_details, accommodation_needs
       FROM pwd_profile_details WHERE user_id = ? LIMIT 1`,
      [seekerId]
    );

    const parseJsonSafe = (val) => {
      if (Array.isArray(val)) return val;
      if (!val) return [];
      try { return JSON.parse(val); } catch { return []; }
    };

    res.json({
      name: (p && p.name) || (u && u.full_name) || '',
      email: u ? u.email : '',
      phone: u ? u.phone : '',
      bio: p ? p.bio || '' : '',
      skills: parseJsonSafe(p && p.skills),
      experience: parseJsonSafe(p && p.experience),
      education: parseJsonSafe(p && p.education),
      certifications: parseJsonSafe(p && p.certifications),
      preferredJobRole: p ? p.preferred_job_role || '' : '',
      preferredLocation: p ? p.preferred_location || '' : '',
      employmentType: p ? p.employment_type || '' : '',
      currentSalary: p ? p.current_salary || '' : '',
      expectedSalary: p ? p.expected_salary || '' : '',
      noticePeriod: p ? p.notice_period || '' : '',
      linkedin: p ? p.linkedin || '' : '',
      portfolio: p ? p.google || '' : '',
      hasDisability: pwd ? !!pwd.has_disability : false,
      disabilityDetails: pwd ? pwd.disability_details || '' : '',
      accommodationNeeds: pwd ? pwd.accommodation_needs || '' : '',
    });
  } catch (err) {
    return next(err);
  }
});

// Download resume with premium check
router.post('/download-resume/:applicationId', authenticate, async (req, res, next) => {
  try {
    const employerId = req.user.id;
    const applicationId = req.params.applicationId;
    
    // Check if application exists and belongs to employer's job
    const application = await query(`
      SELECT a.*, j.employer_id 
      FROM applications a
      JOIN jobs j ON j.id = a.job_id
      WHERE a.id = ? AND j.employer_id = ?
    `, [applicationId, employerId]);
    
    if (application.length === 0) {
      return res.status(404).json({ message: 'Application not found or access denied.' });
    }

    // Check premium membership and download limits
    const premiumMembership = await query(`
      SELECT * FROM premium_memberships 
      WHERE user_id = ? AND status = 'active' 
      AND (end_date IS NULL OR end_date > NOW())
      ORDER BY created_at DESC 
      LIMIT 1
    `, [employerId]);
    
    const isPremium = premiumMembership.length > 0;
    
    if (!isPremium) {
      // Check daily download limit for non-premium users
      const today = new Date().toISOString().split('T')[0];
      const dailyDownloads = await query(`
        SELECT COUNT(*) as count 
        FROM download_tracking 
        WHERE employer_id = ? AND download_date = ?
      `, [employerId, today]);
      
      const downloadCount = dailyDownloads[0].count || 0;
      const dailyLimit = 2;
      
      if (downloadCount >= dailyLimit) {
        return res.status(429).json({ 
          message: 'Daily download limit reached. Upgrade to premium for unlimited downloads.',
          isPremium: false,
          dailyDownloads: downloadCount,
          dailyLimit,
          upgradeRequired: true
        });
      }
    }

    // Record the download
    const today = new Date().toISOString().split('T')[0];
    await query(`
      INSERT INTO download_tracking (employer_id, application_id, download_date)
      VALUES (?, ?, ?)
    `, [employerId, applicationId, today]);

    // Return the resume data
    const resumeData = {
      applicationId: application[0].id,
      candidateName: application[0].name,
      candidateEmail: application[0].email,
      candidatePhone: application[0].phone,
      resumeUrl: application[0].resume_url,
      pastedCv: application[0].pasted_cv,
      appliedAt: application[0].created_at,
      downloadedAt: new Date().toISOString()
    };

    res.json({
      message: 'Resume downloaded successfully',
      resumeData,
      isPremium
    });
  } catch (err) {
    console.error('Error downloading resume:', err);
    return next(err);
  }
});

// Employer support tickets - create a ticket
router.post('/tickets', authenticate, [
  body('subject').trim().isLength({ min: 3 }).withMessage('Subject is required'),
  body('category').optional().isIn(['billing','login','job_posting','general']).withMessage('Invalid category'),
  body('priority').optional().isIn(['low','medium','high','urgent']).withMessage('Invalid priority'),
  body('description').optional().isString()
], async (req, res, next) => {
  try {
    const { validationResult } = require('express-validator');
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    if (req.user.role !== 'provider') {
      return res.status(403).json({ message: 'Access denied. Employers only.' });
    }
    const employerId = req.user.id;
    const { subject, category = 'general', priority = 'medium', description } = req.body;
    // Ensure table exists (in case init not run)
    await query(`
      CREATE TABLE IF NOT EXISTS support_tickets (
        id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
        employer_id BIGINT UNSIGNED NOT NULL,
        created_by VARCHAR(64) NOT NULL,
        subject VARCHAR(255) NOT NULL,
        category ENUM('billing','login','job_posting','general') NOT NULL DEFAULT 'general',
        priority ENUM('low','medium','high','urgent') NOT NULL DEFAULT 'medium',
        status ENUM('open','pending','resolved','closed') NOT NULL DEFAULT 'open',
        description TEXT,
        resolution_notes TEXT,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        PRIMARY KEY (id),
        INDEX idx_support_tickets_employer (employer_id),
        FOREIGN KEY (employer_id) REFERENCES users(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);
    const result = await query(
      `INSERT INTO support_tickets (employer_id, created_by, subject, category, priority, description) VALUES (?,?,?,?,?,?)`,
      [employerId, String(employerId), subject, category, priority, description || null]
    );
    const [ticket] = await query(`SELECT * FROM support_tickets WHERE id = ?`, [result.insertId]);
    return res.status(201).json({ ticket });
  } catch (err) {
    return next(err);
  }
});

// Employer support tickets - list
router.get('/tickets', authenticate, async (req, res, next) => {
  try {
    if (req.user.role !== 'provider') {
      return res.status(403).json({ message: 'Access denied. Employers only.' });
    }
    const employerId = req.user.id;
    const { page = 1, limit = 20, status, category, q } = req.query;
    const offset = (page - 1) * limit;
    const params = [employerId];
    const conditions = ['t.employer_id = ?'];
    if (status) { conditions.push('t.status = ?'); params.push(status); }
    if (category) { conditions.push('t.category = ?'); params.push(category); }
    if (q) { conditions.push('(t.subject LIKE ? OR t.description LIKE ?)'); params.push(`%${q}%`, `%${q}%`); }
    const whereClause = 'WHERE ' + conditions.join(' AND ');
    const rows = await query(
      `SELECT t.*
       FROM support_tickets t
       ${whereClause}
       ORDER BY t.updated_at DESC
       LIMIT ? OFFSET ?`,
      [...params, parseInt(limit), parseInt(offset)]
    );
    const count = await query(
      `SELECT COUNT(*) as count FROM support_tickets t ${whereClause}`,
      params
    );
    return res.json({
      tickets: rows,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: count[0].count,
        pages: Math.ceil(count[0].count / limit),
      },
    });
  } catch (err) {
    return next(err);
  }
});

// Employer support ticket - get by id
router.get('/tickets/:id', authenticate, async (req, res, next) => {
  try {
    if (req.user.role !== 'provider') {
      return res.status(403).json({ message: 'Access denied. Employers only.' });
    }
    const employerId = req.user.id;
    const { id } = req.params;
    const [ticket] = await query(`SELECT * FROM support_tickets WHERE id = ? AND employer_id = ?`, [id, employerId]);
    if (!ticket) return res.status(404).json({ message: 'Ticket not found' });
    return res.json({ ticket });
  } catch (err) {
    return next(err);
  }
});

// Employer analytics summary (premium feature with trials)
router.get('/analytics/summary', authenticate, async (req, res, next) => {
  try {
    if (req.user.role !== 'provider') {
      return res.status(403).json({ message: 'Access denied. Only employers can view analytics.' });
    }

    const employerId = req.user.id;
    let accessRecord = await ensureAnalyticsAccess(employerId);

    if (!BILLING_PAUSED && accessRecord.expires_at && new Date(accessRecord.expires_at) <= new Date()) {
      await query(
        `UPDATE employer_feature_access 
         SET is_unlocked = 0, expires_at = NULL, updated_at = CURRENT_TIMESTAMP 
         WHERE id = ?`,
        [accessRecord.id]
      );
      accessRecord.is_unlocked = 0;
      accessRecord.expires_at = null;
    }

    let accessIsActive = isAccessActive(accessRecord);

    if (BILLING_PAUSED) {
      if (!accessIsActive) {
        await query(
          `UPDATE employer_feature_access 
           SET is_unlocked = 1,
               unlocked_at = COALESCE(unlocked_at, CURRENT_TIMESTAMP),
               expires_at = NULL,
               updated_at = CURRENT_TIMESTAMP
           WHERE id = ?`,
          [accessRecord.id]
        );
        accessRecord.is_unlocked = 1;
        accessRecord.unlocked_at = accessRecord.unlocked_at || new Date();
        accessRecord.expires_at = null;
        accessIsActive = true;
      }
    } else if (!accessIsActive) {
      const trialViews = Number(accessRecord.trial_views_used || 0);
      const trialLimit = Number(accessRecord.trial_limit || ANALYTICS_TRIAL_LIMIT);
      if (trialViews >= trialLimit) {
        return res.status(402).json({
          message: 'Your free analytics trials are over. Unlock premium access to keep tracking candidates.',
          access: formatAccessRecord(accessRecord),
          plan: ANALYTICS_PLAN,
          upgradeRequired: true
        });
      }

      await query(
        `UPDATE employer_feature_access 
         SET trial_views_used = trial_views_used + 1, updated_at = CURRENT_TIMESTAMP 
         WHERE id = ?`,
        [accessRecord.id]
      );
      accessRecord.trial_views_used = trialViews + 1;
    }

    const analyticsRows = await query(
      `
        SELECT 
          j.id AS jobId,
          j.job_title AS jobTitle,
          j.no_of_vacancy AS noOfVacancy,
          COUNT(a.id) AS totalApplications,
          COALESCE(SUM(CASE WHEN u.experience = 'fresher' THEN 1 ELSE 0 END), 0) AS fresherCount,
          COALESCE(SUM(CASE WHEN u.experience = 'experience' THEN 1 ELSE 0 END), 0) AS experiencedCount,
          MAX(j.created_at) AS createdAt
        FROM jobs j
        LEFT JOIN applications a ON a.job_id = j.id
        LEFT JOIN users u ON u.id = a.seeker_id
        WHERE j.employer_id = ?
        GROUP BY j.id, j.job_title, j.no_of_vacancy
        ORDER BY createdAt DESC
      `,
      [employerId]
    );

    const jobs = analyticsRows.map((row) => {
      const total = Number(row.totalApplications) || 0;
      const fresherCount = Number(row.fresherCount) || 0;
      const experiencedCount = Number(row.experiencedCount) || 0;
      const vacancy = Number(row.noOfVacancy) || 1;
      const fresherPercentage = total ? Math.round((fresherCount / total) * 100) : 0;
      const experiencedPercentage = total ? Math.round((experiencedCount / total) * 100) : 0;
      const chanceScore = total
        ? Math.min(100, Math.round((total / Math.max(1, vacancy)) * 100))
        : 0;

      return {
        jobId: row.jobId,
        jobTitle: row.jobTitle,
        totalApplications: total,
        fresherCount,
        experiencedCount,
        fresherPercentage,
        experiencedPercentage,
        chanceScore,
        noOfVacancy: vacancy,
        createdAt: row.createdAt
      };
    });

    const summarySeed = {
      totalJobs: jobs.length,
      totalApplications: 0,
      fresherCount: 0,
      experiencedCount: 0,
      chanceAccumulator: 0
    };

    const summary = jobs.reduce((acc, job) => {
      acc.totalApplications += job.totalApplications;
      acc.fresherCount += job.fresherCount;
      acc.experiencedCount += job.experiencedCount;
      acc.chanceAccumulator += job.chanceScore;
      return acc;
    }, summarySeed);

    summary.averageChance = summary.totalJobs
      ? Math.round(summary.chanceAccumulator / summary.totalJobs)
      : 0;
    delete summary.chanceAccumulator;

    const totalApps = summary.totalApplications || 0;
    summary.fresherPercentage = totalApps
      ? Math.round((summary.fresherCount / totalApps) * 100)
      : 0;
    summary.experiencedPercentage = totalApps
      ? Math.round((summary.experiencedCount / totalApps) * 100)
      : 0;

    const topJob = jobs.reduce((best, job) => {
      if (!best) return job;
      return job.totalApplications > best.totalApplications ? job : best;
    }, null);

    const accessInfo = {
      ...formatAccessRecord(accessRecord),
      isUnlocked: true,
      lastRefreshedAt: new Date().toISOString(),
      trialConsumedThisView: !BILLING_PAUSED && !accessIsActive
    };

    res.json({
      jobs,
      summary,
      highlight: topJob,
      access: accessInfo,
      plan: ANALYTICS_PLAN
    });
  } catch (err) {
    return next(err);
  }
});

// Checkout endpoint to unlock analytics permanently (premium)
router.post('/analytics/checkout', authenticate, async (req, res, next) => {
  try {
    if (req.user.role !== 'provider') {
      return res.status(403).json({ message: 'Access denied. Only employers can purchase analytics.' });
    }

    const employerId = req.user.id;
    const {
      planId = ANALYTICS_PLAN.id,
      paymentMethod = 'card',
      transactionId
    } = req.body || {};

    let accessRecord = await ensureAnalyticsAccess(employerId);

    if (BILLING_PAUSED) {
      await query(
        `
          UPDATE employer_feature_access
          SET is_unlocked = 1,
              unlocked_at = COALESCE(unlocked_at, CURRENT_TIMESTAMP),
              expires_at = NULL,
              updated_at = CURRENT_TIMESTAMP
          WHERE id = ?
        `,
        [accessRecord.id]
      );

      accessRecord = await fetchAnalyticsAccess(employerId);

      return res.json({
        message: 'Billing is temporarily disabled. Analytics access is automatically unlocked.',
        access: {
          ...formatAccessRecord(accessRecord),
          isUnlocked: true
        },
        plan: ANALYTICS_PLAN,
        transactionId: transactionId || null
      });
    }

    if (planId !== ANALYTICS_PLAN.id) {
      return res.status(400).json({ message: 'Invalid analytics plan selected.' });
    }

    const now = new Date();
    const hasActiveAccess = isAccessActive(accessRecord);

    if (hasActiveAccess) {
      return res.json({
        message: 'Analytics already unlocked.',
        access: formatAccessRecord(accessRecord),
        plan: ANALYTICS_PLAN
      });
    }

    const expiresAt = new Date(now.getTime() + ANALYTICS_PLAN.durationDays * 24 * 60 * 60 * 1000);
    const metadata = safeParseJson(accessRecord.metadata, {});
    const updatedMetadata = JSON.stringify({
      ...metadata,
      planId,
      lastCheckoutAt: now.toISOString()
    });

    await query(
      `
        UPDATE employer_feature_access
        SET is_unlocked = 1,
            unlocked_at = ?,
            expires_at = ?,
            metadata = ?,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `,
      [now, expiresAt, updatedMetadata, accessRecord.id]
    );

    const txnId = transactionId || `txn_analytics_${Date.now()}`;

    await query(
      `
        INSERT INTO payments (
          user_id, membership_id, amount, payment_method, transaction_id,
          status, payment_type, description, metadata
        ) VALUES (?, NULL, ?, ?, ?, 'completed', 'other', ?, ?)
      `,
      [
        employerId,
        ANALYTICS_PLAN.price,
        paymentMethod,
        txnId,
        `Analytics premium plan (${ANALYTICS_PLAN.name})`,
        JSON.stringify({
          featureKey: ANALYTICS_FEATURE_KEY,
          planId,
          currency: ANALYTICS_PLAN.currency
        })
      ]
    );

    accessRecord = await fetchAnalyticsAccess(employerId);

    res.json({
      message: 'Payment successful. Analytics unlocked!',
      access: formatAccessRecord(accessRecord),
      plan: ANALYTICS_PLAN,
      transactionId: txnId
    });
  } catch (err) {
    return next(err);
  }
});

module.exports = router;
