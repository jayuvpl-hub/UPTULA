const express = require('express');
const { body } = require('express-validator');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { query, getPool } = require('../db');
const { authenticate } = require('../middleware/auth');
const admin = require('../config/firebase');
const sendEmail = require('../utils/sendEmail');
const newJobPostedEmailTemplate = require('../utils/newJobPostedEmailTemplate');
const { CLIENT_ORIGIN, uploadPath } = require('../config/env');
const { validateCategoryList } = require('../utils/categoryValidation');
const { setUserCategories, getUserCategories } = require('../utils/userCategories');
const { applyUserContactUpdate } = require('../utils/email');

const router = express.Router();

/**
 * Compute a simple profile-completion percentage (0-100) for a candidate.
 * Weighted across the fields that matter most for searchability.
 */
function computeProfileCompletion({ user = {}, profile = {}, categories = [] }) {
  const checks = [
    !!(user.full_name || profile.name),
    !!user.email,
    !!user.phone,
    !!profile.bio,
    !!profile.address,
    !!profile.resume,
    Array.isArray(parseJson(profile.skills)) && parseJson(profile.skills).length > 0,
    Array.isArray(parseJson(profile.experience)) && parseJson(profile.experience).length > 0,
    Array.isArray(parseJson(profile.education)) && parseJson(profile.education).length > 0,
    categories.length > 0,
  ];
  const done = checks.filter(Boolean).length;
  return Math.round((done / checks.length) * 100);
}

function parseJson(val) {
  if (Array.isArray(val)) return val;
  if (typeof val === 'string') {
    try { return JSON.parse(val); } catch { return []; }
  }
  return val || [];
}

/** Recompute and persist users.profile_completion (best-effort). */
async function refreshProfileCompletion(userId) {
  try {
    const [u] = await query('SELECT full_name, email, phone FROM users WHERE id = ?', [userId]);
    const [p] = await query('SELECT * FROM user_profiles WHERE user_id = ?', [userId]);
    const { categories } = await getUserCategories(userId);
    const pct = computeProfileCompletion({ user: u || {}, profile: p || {}, categories });
    await query('UPDATE users SET profile_completion = ? WHERE id = ?', [pct, userId]);
    return pct;
  } catch (err) {
    console.warn('profile_completion refresh skipped:', err.message);
    return null;
  }
}

const parseIfString = (val) => {
  try {
    return typeof val === 'string' ? JSON.parse(val) : val;
  } catch {
    return val;
  }
};

const safeJsonField = (val) => {
  if (Array.isArray(val)) return val;
  if (val == null || val === '') return [];
  if (typeof val === 'string') {
    try {
      return JSON.parse(val);
    } catch {
      return [];
    }
  }
  return [];
};

function buildCandidateProfileResponse(user, profile = {}, selectedCategories = [], selectedSubcategories = [], pwd = {}) {
  return {
    name: profile.name || user.full_name || '',
    email: user.email,
    phone: user.phone || '',
    address: profile.address || '',
    gender: profile.gender || '',
    languages: safeJsonField(profile.languages),
    dateOfBirth: profile.date_of_birth || '',
    facebook: profile.facebook || '',
    twitter: profile.twitter || '',
    linkedin: profile.linkedin || '',
    google: profile.google || '',
    preferredJobRole: profile.preferred_job_role || '',
    bio: profile.bio || '',
    resume: profile.resume ? `/uploads/resumes/${profile.resume}` : '',
    resumeName: profile.resume_name || '',
    resumeSize: profile.resume_size || null,
    resumeUploadedAt: profile.resume_uploaded_at || null,
    skills: safeJsonField(profile.skills),
    experience: safeJsonField(profile.experience),
    certifications: safeJsonField(profile.certifications),
    education: safeJsonField(profile.education),
    currentSalary: profile.current_salary || '',
    expectedSalary: profile.expected_salary || '',
    noticePeriod: profile.notice_period || '',
    preferredLocation: profile.preferred_location || '',
    employmentType: profile.employment_type || '',
    profilePicture: profile.profile_picture ? `/uploads/profiles/${profile.profile_picture}` : '',
    preferredLanguage: user.preferred_language || 'en',
    profileCompletion: typeof user.profile_completion === 'number' ? user.profile_completion : 0,
    resumeStatus: user.resume_status || 'none',
    categories: selectedCategories,
    subcategories: selectedSubcategories,
    categoryIds: selectedCategories.map((c) => c.id),
    subcategoryIds: selectedSubcategories.map((s) => s.id),
    hasDisability: !!pwd.has_disability,
    disabilityDetails: pwd.disability_details || '',
    accommodationNeeds: pwd.accommodation_needs || '',
  };
}

async function getPwdProfileDetails(userId) {
  try {
    const rows = await query(
      'SELECT has_disability, disability_details, accommodation_needs FROM pwd_profile_details WHERE user_id = ? LIMIT 1',
      [userId]
    );
    return rows[0] || { has_disability: 0, disability_details: null, accommodation_needs: null };
  } catch (err) {
    console.warn('pwd_profile_details read skipped:', err.message);
    return { has_disability: 0, disability_details: null, accommodation_needs: null };
  }
}

function parseHasDisabilityFlag(value) {
  return value === true || value === 1 || value === '1' || String(value).toLowerCase() === 'true';
}

async function upsertPwdProfileDetails(userId, { hasDisability, disabilityDetails, accommodationNeeds }) {
  const flag = parseHasDisabilityFlag(hasDisability) ? 1 : 0;
  const details = disabilityDetails != null && String(disabilityDetails).trim() !== ''
    ? String(disabilityDetails).trim()
    : null;
  const needs = accommodationNeeds != null && String(accommodationNeeds).trim() !== ''
    ? String(accommodationNeeds).trim()
    : null;

  await query(
    `INSERT INTO pwd_profile_details (user_id, has_disability, disability_details, accommodation_needs)
     VALUES (?, ?, ?, ?)
     ON DUPLICATE KEY UPDATE
       has_disability = VALUES(has_disability),
       disability_details = VALUES(disability_details),
       accommodation_needs = VALUES(accommodation_needs)`,
    [userId, flag, details, needs]
  );
}

const normalizeClientPlatform = (value = '') => {
  const v = String(value || '').toLowerCase();
  if (['mobile', 'android', 'ios'].includes(v)) return 'mobile';
  if (['web', 'website', 'browser'].includes(v)) return 'web';
  return null;
};

const inferPlatformFromUserAgent = (ua = '') => {
  const value = String(ua || '').toLowerCase();
  if (!value) return 'web';
  if (
    value.includes('android') ||
    value.includes('iphone') ||
    value.includes('ipad') ||
    value.includes('ios') ||
    value.includes('okhttp') ||
    value.includes('dart') ||
    value.includes('flutter')
  ) {
    return 'mobile';
  }
  return 'web';
};

// 🔔 Notification logic (single source of truth)
// - Writes to `notifications` only when delivery mode allows it
// - Sends FCM only to recipient's own stored token
// - Cleans up invalid tokens
async function sendNotification({
  userId,
  title,
  message,
  type = 'system',
  jobId = null,
  threadId = null,
  deliveryMode = 'all'
}) {
  const pool = getPool();

  // Fetch recipient delivery metadata once.
  const [recipientRows] = await pool.execute(
    `SELECT fcm_token, fcm_platform FROM users WHERE id = ? LIMIT 1`,
    [userId]
  );
  const recipient = recipientRows?.[0] || null;
  if (!recipient) return;

  const recipientPlatform = String(recipient.fcm_platform || '').toLowerCase();
  const allowMobileOnly = deliveryMode === 'mobile_only';
  const canDeliverToUser = !allowMobileOnly || recipientPlatform === 'mobile';
  if (!canDeliverToUser) return;

  // 1) Insert notification row (so app inbox can show it even if push fails)
  await pool.execute(
    `INSERT INTO notifications (user_id, title, message, type) VALUES (?, ?, ?, ?)`,
    [userId, title, message, type]
  );

  // 2) Send push if token exists
  const token = recipient.fcm_token || null;
  if (!token) return; // ✅ Do not send push if token is null

  // 3) Push via Firebase (best-effort)
  try {
    const safeType = String(type || 'system');

    await admin.messaging().send({
      token,
      notification: { title, body: message },
      data: {
        type: safeType,
        userId: String(userId || ''),
        jobId: String(jobId || ''),
        threadId: String(threadId || '')
      },
    });
  } catch (pushErr) {
    // ✅ Handle invalid/expired tokens
    const code =
      pushErr?.code ||
      pushErr?.errorInfo?.code ||
      pushErr?.errorInfo?.message ||
      pushErr?.message;

    if (code === 'messaging/registration-token-not-registered') {
      // ✅ Mark token as removed so we stop retrying
      await pool.execute(`UPDATE users SET fcm_token = NULL WHERE id = ?`, [userId]);
    }

    console.error('FCM send failed for user', userId, pushErr?.message || pushErr);
  }
}

async function sendNotificationToAllUsers({
  title,
  message,
  type = 'system',
  jobId = null,
  threadId = null,
  deliveryMode = 'all',
  excludeUserIds = []
}) {
  const excluded = Array.isArray(excludeUserIds)
    ? excludeUserIds
      .map((id) => Number(id))
      .filter((id) => Number.isInteger(id) && id > 0)
    : [];

  let sql = `SELECT id FROM users WHERE role = 'seeker'`;
  const params = [];
  if (excluded.length) {
    sql += ` WHERE id NOT IN (${excluded.map(() => '?').join(',')})`;
    params.push(...excluded);
  }

  const recipients = await query(sql, params);
  if (!Array.isArray(recipients) || recipients.length === 0) return;

  const BATCH_SIZE = 50;
  for (let i = 0; i < recipients.length; i += BATCH_SIZE) {
    const chunk = recipients.slice(i, i + BATCH_SIZE);
    await Promise.allSettled(
      chunk.map((row) =>
        sendNotification({
          userId: row.id,
          title,
          message,
          type,
          jobId,
          threadId,
          deliveryMode
        })
      )
    );
  }
}

/** Email all job seekers when a recruiter posts a new job (best-effort, batched). */
async function sendJobPostedEmailsToSeekers({
  jobTitle,
  companyName,
  city = '',
  state = '',
  country = '',
  excludeUserIds = []
}) {
  const excluded = Array.isArray(excludeUserIds)
    ? excludeUserIds
      .map((id) => Number(id))
      .filter((id) => Number.isInteger(id) && id > 0)
    : [];

  let sql = `SELECT id, email, full_name FROM users WHERE role = 'seeker' AND email IS NOT NULL AND TRIM(email) != ''`;
  const params = [];
  if (excluded.length) {
    sql += ` AND id NOT IN (${excluded.map(() => '?').join(',')})`;
    params.push(...excluded);
  }

  const recipients = await query(sql, params);
  if (!Array.isArray(recipients) || recipients.length === 0) return;

  const locationParts = [city, state, country].map((p) => String(p || '').trim()).filter(Boolean);
  const location = locationParts.join(', ');
  const jobsUrl = `${String(CLIENT_ORIGIN || 'https://uptula.com').replace(/\/$/, '')}/jobs`;
  const subject = `New job: ${jobTitle || 'Opening'} at ${companyName || 'a company'}`;

  const BATCH_SIZE = 25;
  for (let i = 0; i < recipients.length; i += BATCH_SIZE) {
    const chunk = recipients.slice(i, i + BATCH_SIZE);
    await Promise.allSettled(
      chunk.map((row) => {
        const html = newJobPostedEmailTemplate({
          userName: row.full_name,
          jobTitle,
          companyName,
          location,
          jobsUrl
        });
        return sendEmail(row.email, subject, html);
      })
    );
  }
}

// Configure multer for profile picture + resume uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const isResume = file.fieldname === 'resume';
    const destDir = uploadPath(isResume ? 'resumes' : 'profiles');

    // Ensure directory exists
    if (!fs.existsSync(destDir)) {
      fs.mkdirSync(destDir, { recursive: true });
    }
    cb(null, destDir);
  },
  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname || '');
    const base = path
      .basename(file.originalname || (file.fieldname === 'resume' ? 'resume' : 'profile'), ext)
      .replace(/[^a-zA-Z0-9_-]/g, '');
    cb(null, `${Date.now()}_${req.user.id}_${base}${ext}`);
  }
});

const upload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  },
  fileFilter: function (req, file, cb) {
    const isProfilePicture = file.fieldname === 'profilePicture';
    const isResume = file.fieldname === 'resume';

    if (isProfilePicture) {
      if (file.mimetype && file.mimetype.startsWith('image/')) return cb(null, true);
      return cb(new Error('profilePicture must be an image/* file'), false);
    }

    if (isResume) {
      const allowedMimes = new Set([
        'application/pdf',
        'application/msword', // .doc
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document' // .docx
      ]);
      const allowedExtensions = new Set(['.pdf', '.doc', '.docx']);
      const ext = (path.extname(file.originalname || '') || '').toLowerCase();

      if (allowedMimes.has(file.mimetype) || (ext && allowedExtensions.has(ext))) return cb(null, true);
      return cb(new Error('resume must be a PDF or Word (.doc/.docx) file'), false);
    }

    return cb(new Error('Invalid upload field'), false);
  }
});

// Get user profile
router.get('/', authenticate, async (req, res, next) => {
  try {
    const userId = req.user.id;

    // Get user basic info
    const userInfo = await query(
      'SELECT id, full_name, email, phone, preferred_language, profile_completion, resume_status FROM users WHERE id = ?',
      [userId]
    );

    if (userInfo.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Get user profile details
    const profileInfo = await query(
      'SELECT * FROM user_profiles WHERE user_id = ?',
      [userId]
    );

    const user = userInfo[0];
    const profile = profileInfo.length > 0 ? profileInfo[0] : {};

    // Check if user is a candidate
    if (req.user.role === 'provider') {
      return res.status(403).json({ message: 'Access denied. Use /api/employer/profile for employer profiles.' });
    }

    // Selected categories / subcategories (multi-select, with single-FK fallback handled in the table)
    const { categories: selectedCategories, subcategories: selectedSubcategories } = await getUserCategories(userId);
    const pwd = await getPwdProfileDetails(userId);

    // Candidate profile data
    // const profileData = {
    //   firstName: profile.first_name || user.full_name?.split(' ')[0] || '',
    //   lastName: profile.last_name || user.full_name?.split(' ').slice(1).join(' ') || '',
    //   email: user.email,
    //   phone: user.phone || '',
    //   address: profile.address || '',
    //   gender: profile.gender || '',
    //   language: profile.language || '',
    //   dateOfBirth: profile.date_of_birth || '',
    //   facebook: profile.facebook || '',
    //   twitter: profile.twitter || '',
    //   linkedin: profile.linkedin || '',
    //   google: profile.google || '',
    //   slogan: profile.slogan || '',
    //   profilePicture: profile.profile_picture ? `/uploads/profiles/${profile.profile_picture}` : ''
    // };
    const profileData = buildCandidateProfileResponse(
      user,
      profile,
      selectedCategories,
      selectedSubcategories,
      pwd
    );
    res.json({ profile: profileData });
  } catch (err) {
    return next(err);
  }
});
//dummy notification for testing purpose
router.post('/test-notification', async (req, res) => {
  const { userId } = req.body;

  await sendNotification({
    userId,
    title: "Test Notification",
    message: "This is a test push notification 🚀",
    type: "system"
  });

  res.json({ message: "Notification sent" });
});

// Save FCM token for the logged-in user
router.post('/save-fcm-token', authenticate, async (req, res, next) => {
  try {
    const { userId, token, platform } = req.body || {};
    if (!userId || !token) {
      return res.status(400).json({ message: 'userId and token are required' });
    }
    if (Number(userId) !== Number(req.user.id)) {
      return res.status(403).json({ message: 'You can only update your own token' });
    }

    const pool = getPool();
    const normalizedPlatform = normalizeClientPlatform(platform) || inferPlatformFromUserAgent(req.headers['user-agent']);

    // Make token ownership unique: a token can belong to only one user.
    await pool.execute(`UPDATE users SET fcm_token = NULL WHERE fcm_token = ? AND id <> ?`, [token, userId]);
    await pool.execute(`UPDATE users SET fcm_token = ?, fcm_platform = ? WHERE id = ?`, [token, normalizedPlatform, userId]);

    res.json({ message: 'FCM token saved successfully' });
  } catch (err) {
    return next(err);
  }
});

// Get notifications by user (latest first + pagination)
router.get('/notifications/:userId', authenticate, async (req, res, next) => {
  try {
    const requestedUserId = Number(req.params.userId);
    if (!requestedUserId) {
      return res.status(400).json({ message: 'Valid userId is required' });
    }

    if (requestedUserId !== Number(req.user.id) && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied' });
    }

    const pool = getPool();

    // ✅ Pagination params
    const limit = Number(req.query.limit) || 20;
    const offset = Number(req.query.offset) || 0;

    const [rows] = await pool.execute(
      `
        SELECT id, user_id, title, message, type, is_read, created_at
        FROM notifications
        WHERE user_id = ?
        ORDER BY created_at DESC
        LIMIT ? OFFSET ?
      `,
      [requestedUserId, limit, offset]
    );

    res.json({
      notifications: rows,
      limit,
      offset
    });

  } catch (err) {
    return next(err);
  }
});

// Mark a notification as read
router.put('/notifications/:id/read', authenticate, async (req, res, next) => {
  try {
    const notificationId = Number(req.params.id);
    if (!notificationId) return res.status(400).json({ message: 'Valid notification id is required' });

    // Only allow owner (or admin)
    const pool = getPool();
    const [rows] = await pool.execute(
      `SELECT id, user_id FROM notifications WHERE id = ? LIMIT 1`,
      [notificationId]
    );
    const row = rows?.[0];
    if (!row) return res.status(404).json({ message: 'Notification not found' });
    if (Number(row.user_id) !== Number(req.user.id) && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied' });
    }

    await pool.execute(
      `UPDATE notifications SET is_read = 1 WHERE id = ?`,
      [notificationId]
    );
    res.json({ message: 'Notification marked as read' });
  } catch (err) {
    return next(err);
  }
});

// Unread notification count
router.get('/notifications/unread/count/:userId', authenticate, async (req, res, next) => {
  try {
    const requestedUserId = Number(req.params.userId);
    if (!requestedUserId) return res.status(400).json({ message: 'Valid userId is required' });
    if (requestedUserId !== Number(req.user.id) && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied' });
    }

    const pool = getPool();
    const [rows] = await pool.execute(
      `SELECT COUNT(*) AS unreadCount FROM notifications WHERE user_id = ? AND is_read = 0`,
      [requestedUserId]
    );
    res.json({ unreadCount: rows?.[0]?.unreadCount || 0 });
  } catch (err) {
    return next(err);
  }
});

const profileUpdateUpload = upload.fields([
  { name: 'profilePicture', maxCount: 1 },
  { name: 'resume', maxCount: 1 }
]);

function parseProfileArrayFields(req, res, next) {
  // When sent as form-data, array fields often arrive as JSON strings (e.g. "[...]").
  // Parse them before express-validator runs so .isArray() works correctly.
  req.body.languages = parseIfString(req.body.languages);
  req.body.skills = parseIfString(req.body.skills);
  req.body.experience = parseIfString(req.body.experience);
  req.body.education = parseIfString(req.body.education);
  req.body.certifications = parseIfString(req.body.certifications);
  return next();
}

const profileUpdateValidators = [
    body('name').optional().trim().isLength({ min: 1 }).withMessage('Name is required'),

    body('email').optional().isEmail().normalizeEmail().withMessage('Valid email required'),
    body('phone').optional().isMobilePhone().withMessage('Valid phone number required'),

    body('address').optional().trim(),

    body('gender').optional().isIn(['male', 'female', 'other']).withMessage('Gender must be male, female or other'),

    body('languages').optional().isArray().withMessage('Languages must be an array'),

    body('dateOfBirth').optional().isISO8601().withMessage('Valid date required'),

    body('facebook').optional().isURL().withMessage('Valid Facebook URL required'),
    body('twitter').optional().isURL().withMessage('Valid Twitter URL required'),
    body('linkedin').optional().isURL().withMessage('Valid LinkedIn URL required'),
    body('google').optional().isURL().withMessage('Valid Google URL required'),

    body('preferredJobRole').optional().trim(),
    body('bio').optional().trim(),

    // JSON fields
    body('skills').optional().isArray().withMessage('Skills must be an array'),
    body('experience').optional().isArray().withMessage('Experience must be an array'),
    body('education').optional().isArray().withMessage('Education must be an array'),
    body('certifications').optional().isArray().withMessage('Certifications must be an array'),

    // Job preferences
    body('currentSalary').optional().trim(),
    body('expectedSalary').optional().trim(),
    body('noticePeriod').optional().trim(),
    body('preferredLocation').optional().trim(),
    body('employmentType').optional().trim()
];

async function updateCandidateProfile(req, res, next) {
    try {
      const { validationResult } = require('express-validator');
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const userId = req.user.id;
      // Check if user is a candidate
      if (req.user.role === 'provider') {
        return res.status(403).json({ message: 'Access denied. Use /api/employer/profile for employer profiles.' });
      }

      const {
        name,
        languages,
        bio,
        skills,
        experience,
        education,
        certifications,
        currentSalary,
        expectedSalary,
        noticePeriod,
        preferredLocation,
        employmentType,
        email,
        phone,
        address,
        gender,
        dateOfBirth,
        facebook,
        twitter,
        linkedin,
        google,
        preferredJobRole,
        hasDisability,
        disabilityDetails,
        accommodationNeeds,
      } = req.body;

      const languagesJson = languages ? JSON.stringify(languages) : null;
      const skillsJson = skills ? JSON.stringify(skills) : null;
      const experienceJson = experience ? JSON.stringify(experience) : null;
      const educationJson = education ? JSON.stringify(education) : null;
      const certificationsJson = certifications ? JSON.stringify(certifications) : null;

      // Handle profile picture + resume uploads
      let profilePictureFilename = null;
      let resumeFilename = null;

      const profilePictureFile = req.files?.profilePicture?.[0] || null;
      const resumeFile = req.files?.resume?.[0] || null;

      if (profilePictureFile) {
        console.log('Profile picture uploaded:', profilePictureFile);
        profilePictureFilename = profilePictureFile.filename;
        console.log('Profile picture filename:', profilePictureFilename);
      } else {
        console.log('No profile picture file in request');
      }

      if (resumeFile) {
        resumeFilename = resumeFile.filename;
      }

      // Check if profile exists
      const existingProfile = await query(
        'SELECT id, profile_picture, resume FROM user_profiles WHERE user_id = ?',
        [userId]
      );

      if (existingProfile.length > 0) {
        // Delete old profile picture if new one is uploaded
        if (profilePictureFilename && existingProfile[0].profile_picture) {
          const oldFilePath = uploadPath('profiles', existingProfile[0].profile_picture);
          if (fs.existsSync(oldFilePath)) {
            fs.unlinkSync(oldFilePath);
          }
        }

        // Delete old resume if new one is uploaded
        if (resumeFilename && existingProfile[0].resume) {
          const oldResumePath = uploadPath('resumes', existingProfile[0].resume);
          if (fs.existsSync(oldResumePath)) {
            fs.unlinkSync(oldResumePath);
          }
        }

        // Update existing candidate profile
        await query(`
        UPDATE user_profiles SET 
          name = ?, 
          address = ?, 
          gender = ?, 
          languages = ?, 
          date_of_birth = ?, 
          facebook = ?, 
          twitter = ?, 
          linkedin = ?, 
          google = ?, 
          preferred_job_role = ?,
          bio = ?,
          resume = ?,
          skills = ?,
          experience = ?,
          education = ?,
          certifications = ?,
          current_salary = ?,
          expected_salary = ?,
          notice_period = ?,
          preferred_location = ?,
          employment_type = ?,
          profile_picture = ?,
          updated_at = CURRENT_TIMESTAMP
        WHERE user_id = ?
      `, [
          name || null,
          address || null,
          gender || null,
          languagesJson,
          dateOfBirth || null,
          facebook || null,
          twitter || null,
          linkedin || null,
          google || null,
          preferredJobRole || null,
          bio || null,
          resumeFilename || existingProfile[0].resume || null,
          skillsJson,
          experienceJson,
          educationJson,
          certificationsJson,
          currentSalary || null,
          expectedSalary || null,
          noticePeriod || null,
          preferredLocation || null,
          employmentType || null,
          profilePictureFilename || existingProfile[0].profile_picture,
          userId
        ]);
      } else {
        // Create new candidate profile
        await query(`
        INSERT INTO user_profiles (
          user_id, name, address, gender, languages, date_of_birth,
          facebook, twitter, linkedin, google, preferred_job_role,
          bio, resume, skills, experience, education, certifications,
          current_salary, expected_salary, notice_period, preferred_location, employment_type,
          profile_picture
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
          userId,
          name || null,
          address || null,
          gender || null,
          languagesJson,
          dateOfBirth || null,
          facebook || null,
          twitter || null,
          linkedin || null,
          google || null,
          preferredJobRole || null,
          bio || null,
          resumeFilename || null,
          skillsJson,
          experienceJson,
          educationJson,
          certificationsJson,
          currentSalary || null,
          expectedSalary || null,
          noticePeriod || null,
          preferredLocation || null,
          employmentType || null,
          profilePictureFilename || null
        ]);
      }

      // Accessibility fields live in pwd_profile_details (not user_profiles).
      try {
        await upsertPwdProfileDetails(userId, {
          hasDisability,
          disabilityDetails,
          accommodationNeeds,
        });
      } catch (pwdErr) {
        console.warn('pwd_profile_details upsert skipped:', pwdErr.message);
      }

      // Persist resume metadata + sync user-level resume status (Phase 1).
      // Wrapped in try/catch so it degrades gracefully if the metadata columns
      // are not present yet (they are added by the idempotent boot migration).
      if (resumeFile) {
        try {
          await query(
            `UPDATE user_profiles SET resume_name = ?, resume_size = ?, resume_uploaded_at = CURRENT_TIMESTAMP WHERE user_id = ?`,
            [resumeFile.originalname || null, resumeFile.size || null, userId]
          );
          await query(
            `UPDATE users SET resume_url = ?, resume_status = 'uploaded' WHERE id = ?`,
            [resumeFilename ? `/uploads/resumes/${resumeFilename}` : null, userId]
          );
        } catch (metaErr) {
          console.warn('Resume metadata update skipped:', metaErr.message);
        }
      }

      // Update user basic info if email or phone changed
      if (email !== undefined || phone !== undefined) {
        const contactResult = await applyUserContactUpdate(query, userId, { email, phone });
        if (!contactResult.ok) {
          return res.status(contactResult.status || 409).json({ message: contactResult.message });
        }
      }

      const finalProfilePicture = profilePictureFilename
        || (existingProfile.length > 0 ? existingProfile[0].profile_picture : null);

      // Recompute profile completion now that profile fields changed.
      const profileCompletion = await refreshProfileCompletion(userId);

      const [freshUser] = await query(
        'SELECT id, full_name, email, phone, preferred_language, profile_completion, resume_status FROM users WHERE id = ?',
        [userId]
      );
      const [freshProfile] = await query(
        'SELECT * FROM user_profiles WHERE user_id = ?',
        [userId]
      );
      const { categories: selectedCategories, subcategories: selectedSubcategories } =
        await getUserCategories(userId);
      const freshPwd = await getPwdProfileDetails(userId);

      const responseData = {
        message: 'Profile updated successfully',
        profileCompletion,
        profilePicture: finalProfilePicture ? `/uploads/profiles/${finalProfilePicture}` : null,
        profile: buildCandidateProfileResponse(
          freshUser,
          freshProfile || {},
          selectedCategories,
          selectedSubcategories,
          freshPwd
        )
      };
      console.log('Sending response:', {
        ...responseData,
        profile: {
          ...responseData.profile,
          preferredLocation: responseData.profile.preferredLocation
        }
      });
      res.json(responseData);
    } catch (err) {
      if (err && err.code === 'ER_DUP_ENTRY') {
        return res.status(409).json({ message: 'Email already registered' });
      }
      // Clean up uploaded files if there was an error
      const profilePictureFile = req.files?.profilePicture?.[0] || null;
      const resumeFile = req.files?.resume?.[0] || null;

      if (profilePictureFile) {
        const filePath = uploadPath('profiles', profilePictureFile.filename);
        if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
      }
      if (resumeFile) {
        const filePath = uploadPath('resumes', resumeFile.filename);
        if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
      }
      return next(err);
    }
}

const profileUpdateStack = [
  authenticate,
  profileUpdateUpload,
  parseProfileArrayFields,
  ...profileUpdateValidators,
  updateCandidateProfile
];

router.put('/', ...profileUpdateStack);

// ---- Profile categories (multi-select, max 5) ----

// Get the logged-in user's selected categories + subcategories
router.get('/categories', authenticate, async (req, res, next) => {
  try {
    const data = await getUserCategories(req.user.id);
    res.json(data);
  } catch (err) {
    return next(err);
  }
});

// Replace the logged-in user's category selection (max 5 categories)
async function updateProfileCategories(req, res, next) {
  try {
    const check = await validateCategoryList(req.body.categoryIds, req.body.subcategoryIds, { max: 5 });
    if (!check.ok) {
      return res.status(400).json({ message: check.message });
    }
    await setUserCategories(req.user.id, check.categoryIds, check.subcategoryIds);
    const profileCompletion = await refreshProfileCompletion(req.user.id);
    const data = await getUserCategories(req.user.id);
    res.json({ message: 'Categories updated', ...data, profileCompletion });
  } catch (err) {
    return next(err);
  }
}

router.put('/categories', authenticate, updateProfileCategories);

// Update preferred UI language
async function updatePreferredLanguage(req, res, next) {
  try {
    const lang = String(req.body.language || '').slice(0, 10).trim();
    if (!lang) return res.status(400).json({ message: 'language is required' });
    await query('UPDATE users SET preferred_language = ? WHERE id = ?', [lang, req.user.id]);
    res.json({ message: 'Language preference saved', language: lang });
  } catch (err) {
    return next(err);
  }
}

router.put('/language', authenticate, updatePreferredLanguage);

module.exports = router;
// Allow other routes to reuse the same notification sender
module.exports.sendNotification = sendNotification;
module.exports.sendNotificationToAllUsers = sendNotificationToAllUsers;
module.exports.sendJobPostedEmailsToSeekers = sendJobPostedEmailsToSeekers;
