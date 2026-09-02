const express = require('express');
const { query, getPool } = require('../db');
const { authenticate } = require('../middleware/auth');
const multer = require('multer');
const path = require('path');
const sendEmail = require('../utils/sendEmail');
const { uploadPath } = require('../config/env');
const { DEFAULT_COMPANY_LOGO, resolveCompanyLogo } = require('../config/constants');
// Reuse the single notification implementation
const { sendNotification } = require('./profile.routes');

const router = express.Router();
const APPLICATION_STATUSES = ['applied', 'resume_reviewed', 'accepted_rejected', 'final_decision'];
const APPLICATION_STATUS_INDEX = APPLICATION_STATUSES.reduce((acc, status, index) => {
  acc[status] = index;
  return acc;
}, {});
const normalizeDecision = (value) => {
  const v = String(value || '').toLowerCase().trim();
  if (v === 'accept' || v === 'accepted') return 'accept';
  if (v === 'rejectd' || v === 'rejected') return 'rejectd';
  return null;
};

const statusEmailContent = {
  applied: {
    subject: 'Application received',
    title: 'Your application has been received',
    body: 'Thanks for applying. Your application is now in the applied stage.'
  },
  resume_reviewed: {
    subject: 'Application update: resume reviewed',
    title: 'Your resume has been reviewed',
    body: 'Your application moved to the resume reviewed stage. The recruiter is evaluating your profile.'
  },
  accepted_rejected: {
    subject: 'Application update: recruiter decision stage',
    title: 'Your application reached the decision stage',
    body: 'Your application is now in the accepted/rejected stage. You will receive the final outcome soon.'
  },
  final_decision: {
    subject: 'Application update: final decision',
    title: 'Final decision is available',
    body: 'A final decision has been recorded for your application. Please check your application details.'
  }
};

function buildApplicationStatusEmail({ applicantName, jobTitle, companyName, status }) {
  const content = statusEmailContent[status] || statusEmailContent.applied;
  const safeName = applicantName || 'Candidate';
  const safeJobTitle = jobTitle || 'the position';
  const safeCompanyName = companyName || 'the company';
  return `
    <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #222;">
      <h2 style="margin-bottom: 8px;">${content.title}</h2>
      <p>Hi ${safeName},</p>
      <p>${content.body}</p>
      <p><strong>Job:</strong> ${safeJobTitle}</p>
      <p><strong>Company:</strong> ${safeCompanyName}</p>
      <p><strong>Current Stage:</strong> ${status}</p>
      <p style="margin-top: 20px;">Thank you,<br/>Uptula Team</p>
    </div>
  `;
}

// Public: Get latest jobs for home page
router.get('/jobs/latest', async (req, res, next) => {
  try {
    const { limit = 6 } = req.query;
    const safeLimit = Math.min(parseInt(limit) || 6, 20);

    // NOTE: joined employer_profiles so we can fall back to the employer's
    // profile logo when the job row itself has no company_logo set.
    const jobs = await query(`
      SELECT 
        j.id,
        j.job_title,
        j.company_name,
        j.company_logo,
        ep.logo_url AS employer_logo_url,
        j.job_type,
        j.salary_range,
        j.experience,
        j.city,
        j.state,
        j.country,
        j.created_at,
        j.description,
        j.qualification,
        j.skills,
        u.full_name as employer_name,
        u.email as employer_email
      FROM jobs j
      LEFT JOIN users u ON u.id = j.employer_id
      LEFT JOIN employer_profiles ep ON ep.user_id = j.employer_id
      WHERE j.status = 'active'
      ORDER BY j.created_at DESC
      LIMIT ?
    `, [safeLimit]);

    const mapped = jobs.map(j => {
      // Construct location string from city, state, country
      const locationParts = [j.city, j.state, j.country].filter(Boolean);
      const location = locationParts.length > 0 ? locationParts.join(', ') : '';

      return {
        id: j.id,
        title: j.job_title,
        company: j.company_name,
        // Priority: job-level override (legacy/rare) -> employer profile logo -> default
        logo: resolveCompanyLogo(j),
        type: j.job_type,
        salary: j.salary_range,
        experience: j.experience,
        location: location,
        postedAt: j.created_at,
        description: j.description,
        qualification: j.qualification,
        skills: j.skills,
        employer: {
          name: j.employer_name,
          email: j.employer_email
        }
      };
    });

    res.json({ jobs: mapped });
  } catch (err) {
    console.error('Error fetching latest jobs:', err);
    return next(err);
  }
});

// Public: Get job categories with counts
router.get('/jobs/categories', async (req, res, next) => {
  try {
    const categories = await query(`
      SELECT 
        category,
        COUNT(*) as job_count
      FROM jobs 
      WHERE status = 'active' AND category IS NOT NULL AND category != ''
      GROUP BY category
      ORDER BY job_count DESC
      LIMIT 8
    `);

    const allCategories = await query(`
      SELECT 
        category,
        COUNT(*) as job_count
      FROM jobs 
      WHERE status = 'active' AND category IS NOT NULL AND category != ''
      GROUP BY category
      ORDER BY category
    `);

    res.json({ categories, allCategories });
  } catch (err) {
    console.error('Error fetching categories:', err);
    return next(err);
  }
});

// Public: Get sponsored jobs from sponsorships table
router.get('/sponsorships', async (req, res, next) => {
  try {
    const sponsorships = await query(`
      SELECT 
        s.id,
        s.title,
        s.company_name,
        s.logo,
        s.description,
        s.image_url,
        s.link_url,
        j.id as job_id
      FROM sponsorships s
      LEFT JOIN jobs j ON j.id = s.job_id
      WHERE s.is_active = 1 
        AND (s.end_date IS NULL OR s.end_date > NOW())
      ORDER BY s.created_at DESC
      LIMIT 4
    `);

    res.json({ sponsorships });
  } catch (err) {
    console.error('Error fetching sponsorships:', err);
    return next(err);
  }
});

const parsePositiveIntQuery = (value, paramName) => {
  if (value === undefined || value === null || value === '') return null;
  const parsed = parseInt(value, 10);
  if (!Number.isInteger(parsed) || parsed <= 0) {
    return { error: `${paramName} must be a positive integer` };
  }
  return { value: parsed };
};

// Public: List jobs
router.get('/jobs', async (req, res, next) => {
  try {
    const { page = 1, limit = 20, q, city, state, country, jobType, salary, minSalary, maxSalary, qualification, designation, experience, category } = req.query;
    const safeLimit = Math.min(parseInt(limit) || 20, 50);
    const offset = ((parseInt(page) || 1) - 1) * safeLimit;

    const minSalaryParsed = parsePositiveIntQuery(minSalary, 'minSalary');
    if (minSalaryParsed?.error) {
      return res.status(400).json({ message: minSalaryParsed.error });
    }
    const maxSalaryParsed = parsePositiveIntQuery(maxSalary, 'maxSalary');
    if (maxSalaryParsed?.error) {
      return res.status(400).json({ message: maxSalaryParsed.error });
    }

    // Build WHERE conditions dynamically
    const whereParts = ["j.status = 'active'"];
    const values = [];
    if (q) { whereParts.push('(j.job_title LIKE ? OR j.company_name LIKE ? OR j.description LIKE ?)'); values.push(`%${q}%`, `%${q}%`, `%${q}%`); }
    if (city) { whereParts.push('j.city = ?'); values.push(city); }
    if (state) { whereParts.push('j.state = ?'); values.push(state); }
    if (country) { whereParts.push('j.country = ?'); values.push(country); }
    if (jobType) { whereParts.push('j.job_type = ?'); values.push(jobType); }
    if (qualification) { whereParts.push('j.qualification LIKE ?'); values.push(`%${qualification}%`); }
    if (designation) { whereParts.push('j.job_title LIKE ?'); values.push(`%${designation}%`); }
    if (experience) { whereParts.push('j.experience = ?'); values.push(experience); }
    if (category) { whereParts.push('j.category = ?'); values.push(category); }

    // Salary filter supports ranges like 20000-30000, 120000+ or 'negotiable'
    if (salary) {
      if (salary === 'negotiable') {
        whereParts.push("j.salary_range = 'negotiable'");
      } else if (salary.endsWith('+')) {
        const min = parseInt(salary.replace('+','')) || 0;
        whereParts.push('(j.salary_range >= ? OR j.salary_range = "120000+")');
        values.push(min);
      } else if (/^\d+-\d+$/.test(salary)) {
        const [minStr, maxStr] = salary.split('-');
        const min = parseInt(minStr) || 0;
        const max = parseInt(maxStr) || 0;
        // Store ranges as text in DB; for filtering, match exactly the saved label
        whereParts.push('j.salary_range = ?');
        values.push(`${min}-${max}`);
      }
    }

    // Numeric salary range filter (overlapping fixed ranges; negotiable always included)
    if (minSalaryParsed?.value != null) {
      whereParts.push('(j.salary_type = \'negotiable\' OR (j.salary_type = \'fixed\' AND j.salary_max >= ?))');
      values.push(minSalaryParsed.value);
    }
    if (maxSalaryParsed?.value != null) {
      whereParts.push('(j.salary_type = \'negotiable\' OR (j.salary_type = \'fixed\' AND j.salary_min <= ?))');
      values.push(maxSalaryParsed.value);
    }

    const whereClause = whereParts.length ? `WHERE ${whereParts.join(' AND ')}` : '';

    // NOTE: joined employer_profiles so we can fall back to the employer's
    // profile logo when the job row itself has no company_logo set.
    const jobs = await query(`
      SELECT 
        j.id, j.employer_id, j.job_title, j.company_name, j.category, j.description, j.salary_range,
        j.salary_min, j.salary_max, j.salary_type,
        j.no_of_vacancy, j.experience, j.company_logo, ep.logo_url AS employer_logo_url,
        j.job_type, j.qualification, j.skills,
        j.email, j.phone, j.website, j.address, j.city, j.state, j.country, j.zip_code,
        j.facebook, j.google, j.twitter, j.linkedin, j.pinterest, j.instagram,
        j.status, j.is_featured, j.views_count, j.applications_count,
        j.created_at, j.updated_at
      FROM jobs j
      LEFT JOIN employer_profiles ep ON ep.user_id = j.employer_id
      ${whereClause}
      ORDER BY j.created_at DESC
      LIMIT ? OFFSET ?
    `, [...values, safeLimit, offset]);

    // Map to camelCase-friendly fields for frontend
    const mapped = jobs.map(j => ({
      id: j.id,
      jobTitle: j.job_title,
      companyName: j.company_name,
      category: j.category,
      description: j.description,
      salaryRange: j.salary_range,
      salaryMin: j.salary_min,
      salaryMax: j.salary_max,
      salaryType: j.salary_type,
      noOfVacancy: j.no_of_vacancy,
      experience: j.experience,
      // Priority: job-level override (legacy/rare) -> employer profile logo -> default
      companyLogoUrl: resolveCompanyLogo(j),
      jobType: j.job_type,
      qualification: j.qualification,
      skills: j.skills,
      email: j.email,
      phone: j.phone,
      website: j.website,
      address: j.address,
      city: j.city,
      state: j.state,
      country: j.country,
      zipCode: j.zip_code,
      facebook: j.facebook,
      google: j.google,
      twitter: j.twitter,
      linkedin: j.linkedin,
      pinterest: j.pinterest,
      instagram: j.instagram,
      status: j.status,
      isFeatured: j.is_featured,
      viewsCount: j.views_count,
      applicationsCount: j.applications_count,
      createdAt: j.created_at,
      updatedAt: j.updated_at
    }));

    // Count total
    const countRows = await query(`SELECT COUNT(*) as total FROM jobs j ${whereClause}`, values);
    const total = countRows[0]?.total || 0;

    res.json({ jobs: mapped, pagination: { page: parseInt(page) || 1, limit: safeLimit, total, totalPages: Math.ceil(total / safeLimit) } });
  } catch (err) {
    return next(err);
  }
});

// Public: Get job by id or slug
router.get('/jobs/:id', async (req, res, next) => {
  try {
    const identifier = req.params.id;

    // NOTE: joined employer_profiles so we can fall back to the employer's
    // profile logo when the job row itself has no company_logo set.
    const jobSelect = `
      SELECT 
        j.id, j.employer_id, j.job_title, j.company_name, j.category, j.description, j.salary_range,
        j.salary_min, j.salary_max, j.salary_type,
        j.no_of_vacancy, j.experience, j.company_logo, ep.logo_url AS employer_logo_url,
        j.job_type, j.qualification, j.skills,
        j.email, j.phone, j.website, j.address, j.city, j.state, j.country, j.zip_code,
        j.facebook, j.google, j.twitter, j.linkedin, j.pinterest, j.instagram,
        j.status, j.is_featured, j.views_count, j.applications_count,
        j.created_at, j.updated_at
      FROM jobs j
      LEFT JOIN employer_profiles ep ON ep.user_id = j.employer_id
    `;

    // Check if identifier is numeric (ID) or a slug (title-based)
    let rows;
    if (/^\d+$/.test(identifier)) {
      // Numeric ID - query by ID
      rows = await query(`${jobSelect} WHERE j.id = ?`, [identifier]);
    } else {
      // Slug - query by matching job title (convert slug back to title pattern)
      // Convert slug to title pattern: "frontend-developer" -> "Frontend Developer" or similar
      const titlePattern = identifier
        .split('-')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');

      // Try exact match first, then LIKE match
      rows = await query(`
        ${jobSelect}
        WHERE LOWER(REPLACE(j.job_title, ' ', '-')) = LOWER(?) 
           OR LOWER(j.job_title) LIKE LOWER(?)
        LIMIT 1
      `, [identifier, `%${titlePattern}%`]);
    }

    if (rows.length === 0) return res.status(404).json({ message: 'Job not found' });
    const j = rows[0];
    const job = {
      id: j.id,
      jobTitle: j.job_title,
      companyName: j.company_name,
      category: j.category,
      description: j.description,
      salaryRange: j.salary_range,
      salaryMin: j.salary_min,
      salaryMax: j.salary_max,
      salaryType: j.salary_type,
      noOfVacancy: j.no_of_vacancy,
      experience: j.experience,
      // Priority: job-level override (legacy/rare) -> employer profile logo -> default
      companyLogoUrl: resolveCompanyLogo(j),
      jobType: j.job_type,
      qualification: j.qualification,
      skills: j.skills,
      email: j.email,
      phone: j.phone,
      website: j.website,
      address: j.address,
      city: j.city,
      state: j.state,
      country: j.country,
      zipCode: j.zip_code,
      facebook: j.facebook,
      google: j.google,
      twitter: j.twitter,
      linkedin: j.linkedin,
      pinterest: j.pinterest,
      instagram: j.instagram,
      status: j.status,
      isFeatured: j.is_featured,
      viewsCount: j.views_count,
      applicationsCount: j.applications_count,
      createdAt: j.created_at,
      updatedAt: j.updated_at
    };

    res.json({ job });
  } catch (err) {
    return next(err);
  }
});

// Public: Get a company profile by employer user id
// GET /api/company/:id
router.get('/company/:id', async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isFinite(id) || id <= 0) {
      return res.status(400).json({ message: 'Invalid company id' });
    }

    const rows = await query(
      `
        SELECT 
          u.id AS user_id,
          u.full_name,
          u.email AS user_email,
          u.phone AS user_phone,
          ep.company_name,
          ep.contact_person,
          ep.company_email,
          ep.phone,
          ep.address,
          ep.website,
          ep.industry,
          ep.company_size,
          ep.description,
          ep.linkedin,
          ep.twitter,
          ep.facebook,
          ep.google,
          ep.logo_url,
          ep.founded_year,
          ep.company_type,
          ep.is_verified
        FROM users u
        LEFT JOIN employer_profiles ep ON ep.user_id = u.id
        WHERE u.id = ? AND u.role = 'provider'
        LIMIT 1
      `,
      [id]
    );

    if (!rows.length) return res.status(404).json({ message: 'Company not found' });
    const r = rows[0];

    const profile = {
      // FIX 6: show the real company name; fall back to a neutral label, not a person name.
      companyName: r.company_name || 'Company',
      hasCompanyProfile: !!(r.company_name && String(r.company_name).trim()),
      contactPerson: r.contact_person || r.full_name || '',
      email: r.company_email || r.user_email || '',
      phone: r.phone || r.user_phone || '',
      address: r.address || '',
      website: r.website || '',
      industry: r.industry || '',
      companySize: r.company_size || '',
      description: r.description || '',
      linkedin: r.linkedin || '',
      twitter: r.twitter || '',
      facebook: r.facebook || '',
      google: r.google || '',
      logoUrl: r.logo_url || DEFAULT_COMPANY_LOGO,
      foundedYear: r.founded_year || '',
      companyType: r.company_type || '',
      isVerified: !!r.is_verified
    };

    return res.json({ profile });
  } catch (err) {
    return next(err);
  }
});

// Public: List all companies (employer profiles)
// GET /api/companies
router.get('/companies', async (req, res, next) => {
  try {
    const rows = await query(
      `
        SELECT 
          u.id AS user_id,
          u.full_name,
          u.email AS user_email,
          u.phone AS user_phone,
          ep.company_name,
          ep.contact_person,
          ep.company_email,
          ep.phone,
          ep.address,
          ep.website,
          ep.industry,
          ep.company_size,
          ep.description,
          ep.linkedin,
          ep.twitter,
          ep.facebook,
          ep.google,
          ep.logo_url,
          ep.founded_year,
          ep.company_type,
          ep.is_verified
        FROM users u
        INNER JOIN employer_profiles ep ON ep.user_id = u.id
        WHERE u.role = 'provider'
          AND ep.company_name IS NOT NULL
          AND TRIM(ep.company_name) <> ''
        ORDER BY ep.company_name ASC
      `
    );

    const companies = rows.map(r => ({
      id: r.user_id,
      // FIX 6: only the real company name — never the employer's personal name.
      companyName: r.company_name || '',
      contactPerson: r.contact_person || r.full_name || '',
      email: r.company_email || r.user_email || '',
      phone: r.phone || r.user_phone || '',
      address: r.address || '',
      website: r.website || '',
      industry: r.industry || '',
      companySize: r.company_size || '',
      description: r.description || '',
      linkedin: r.linkedin || '',
      twitter: r.twitter || '',
      facebook: r.facebook || '',
      google: r.google || '',
      logoUrl: r.logo_url || DEFAULT_COMPANY_LOGO,
      foundedYear: r.founded_year || '',
      companyType: r.company_type || '',
      isVerified: !!r.is_verified
    }));

    return res.json({ companies });
  } catch (err) {
    return next(err);
  }
});



// Candidate apply to a job (with optional resume upload)
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadPath('applications'));
  },
  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname || '');
    const base = path.basename(file.originalname || 'resume', ext).replace(/[^a-zA-Z0-9_-]/g, '');
    cb(null, `${Date.now()}_${base}${ext}`);
  }
});
const upload = multer({ storage });

router.post('/jobs/:id/apply', authenticate, upload.single('resume'), async (req, res, next) => {
  try {
    const jobId = req.params.id;
    const seekerId = req.user.id;
    const { name, email, phone, pastedCv } = req.body;
    const resumePath = req.file ? `/uploads/applications/${req.file.filename}` : null;

    await query(`
      CREATE TABLE IF NOT EXISTS applications (
        id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
        job_id BIGINT UNSIGNED NOT NULL,
        seeker_id BIGINT UNSIGNED NOT NULL,
        name VARCHAR(120) DEFAULT NULL,
        email VARCHAR(190) DEFAULT NULL,
        phone VARCHAR(30) DEFAULT NULL,
        resume_url VARCHAR(255) DEFAULT NULL,
        pasted_cv TEXT DEFAULT NULL,
        status ENUM('applied','resume_reviewed','accepted_rejected','final_decision') DEFAULT 'applied',
        decision ENUM('accept','rejectd') DEFAULT NULL,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        PRIMARY KEY (id),
        FOREIGN KEY (job_id) REFERENCES jobs(id) ON DELETE CASCADE,
        FOREIGN KEY (seeker_id) REFERENCES users(id) ON DELETE CASCADE,
        INDEX idx_applications_job_id (job_id),
        INDEX idx_applications_seeker_id (seeker_id),
        INDEX idx_applications_status (status),
        INDEX idx_applications_created_at (created_at),
        UNIQUE KEY unique_application (job_id, seeker_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    await query(`
      CREATE TABLE IF NOT EXISTS application_status_history (
        id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
        application_id BIGINT UNSIGNED NOT NULL,
        previous_status ENUM('applied','resume_reviewed','accepted_rejected','final_decision') DEFAULT NULL,
        new_status ENUM('applied','resume_reviewed','accepted_rejected','final_decision') NOT NULL,
        changed_by_user_id BIGINT UNSIGNED DEFAULT NULL,
        changed_by_role ENUM('seeker','provider','admin') NOT NULL,
        changed_by_identifier VARCHAR(64) NOT NULL,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (id),
        FOREIGN KEY (application_id) REFERENCES applications(id) ON DELETE CASCADE,
        INDEX idx_app_status_history_application (application_id),
        INDEX idx_app_status_history_changed_by_user (changed_by_user_id),
        INDEX idx_app_status_history_created (created_at)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    await query(
      `INSERT INTO applications (job_id, seeker_id, name, email, phone, resume_url, pasted_cv, status) VALUES (?, ?, ?, ?, ?, ?, ?, 'applied')`,
      [jobId, seekerId, name || null, email || null, phone || null, resumePath, pastedCv || null]
    );

    const inserted = await query(
      `SELECT id FROM applications WHERE job_id = ? AND seeker_id = ? LIMIT 1`,
      [jobId, seekerId]
    );
    if (inserted.length) {
      await query(
        `
          INSERT INTO application_status_history
            (application_id, previous_status, new_status, changed_by_user_id, changed_by_role, changed_by_identifier)
          VALUES (?, ?, ?, ?, ?, ?)
        `,
        [inserted[0].id, null, 'applied', seekerId, req.user.role || 'seeker', String(seekerId)]
      );
    }

    const jobs = await query(`SELECT employer_id FROM jobs WHERE id = ? LIMIT 1`, [jobId]);
    if (jobs.length) {
      await sendNotification({
        userId: jobs[0].employer_id,
        title: 'New Application',
        message: 'A candidate applied to your job',
        type: 'application',
        jobId: jobId
      });
    }

    res.status(201).json({ message: 'Application submitted successfully' });
  } catch (err) {
    // Handle duplicate application error specifically
    if (err.code === 'ER_DUP_ENTRY' && err.message.includes('unique_application')) {
      return res.status(409).json({ 
        message: 'You have already applied for this job',
        code: 'DUPLICATE_APPLICATION'
      });
    }
    
    console.error('Job application error:', err);
    return next(err);
  }
});

// Candidate: list own applications
router.get('/applications/mine', authenticate, async (req, res, next) => {
  try {
    const seekerId = req.user.id;
    const rows = await query(`
      SELECT a.id, a.job_id as jobId, a.status, a.created_at as appliedAt, a.resume_url as resumeUrl, a.pasted_cv as pastedCv,
             a.decision,
             j.job_title as jobTitle, j.company_name as companyName, j.city, j.state, j.country
      FROM applications a
      JOIN jobs j ON j.id = a.job_id
      WHERE a.seeker_id = ?
      ORDER BY a.created_at DESC
    `, [seekerId]);
    res.json({ applications: rows });
  } catch (err) { return next(err); }
});

// Employer: list applications for my jobs
router.get('/applications', authenticate, async (req, res, next) => {
  try {
    if (req.user.role !== 'provider') {
      return res.status(403).json({ message: 'Employer access only' });
    }
    const employerId = req.user.id;
    const rows = await query(`
      SELECT a.id, a.job_id as jobId, a.seeker_id as seekerId, a.status, a.name, a.email, a.phone, a.resume_url as resumeUrl, a.pasted_cv as pastedCv, a.created_at as appliedAt,
             a.decision,
             j.job_title as jobTitle, j.company_name as companyName,
             u.full_name as seekerName, u.email as seekerEmail
      FROM applications a
      JOIN jobs j ON j.id = a.job_id
      JOIN users u ON u.id = a.seeker_id
      WHERE j.employer_id = ?
      ORDER BY a.created_at DESC
    `, [employerId]);
    res.json({ applications: rows });
  } catch (err) { return next(err); }
});

// Applicant: get own application with current status and history
router.get('/applications/:id', authenticate, async (req, res, next) => {
  try {
    if (!['seeker', 'provider'].includes(req.user.role)) {
      return res.status(403).json({ message: 'Seeker/Provider access only' });
    }

    const applicationId = req.params.id;
    const params = [applicationId];
    let accessClause = '';
    if (req.user.role === 'seeker') {
      accessClause = ' AND a.seeker_id = ?';
      params.push(req.user.id);
    } else if (req.user.role === 'provider') {
      accessClause = ' AND j.employer_id = ?';
      params.push(req.user.id);
    }

    const rows = await query(
      `
        SELECT
          a.id,
          a.job_id AS jobId,
          a.seeker_id AS seekerId,
          a.name,
          a.email,
          a.phone,
          a.resume_url AS resumeUrl,
          a.pasted_cv AS pastedCv,
          a.status,
          a.decision,
          a.created_at AS appliedAt,
          a.updated_at AS updatedAt,
          j.job_title AS jobTitle,
          j.company_name AS companyName
        FROM applications a
        JOIN jobs j ON j.id = a.job_id
        WHERE a.id = ? ${accessClause}
        LIMIT 1
      `,
      params
    );

    if (!rows.length) {
      return res.status(404).json({ message: 'Application not found' });
    }

    const history = await query(
      `
        SELECT
          id,
          previous_status AS previousStatus,
          new_status AS newStatus,
          changed_by_user_id AS changedByUserId,
          changed_by_role AS changedByRole,
          changed_by_identifier AS changedByIdentifier,
          created_at AS changedAt
        FROM application_status_history
        WHERE application_id = ?
        ORDER BY created_at ASC, id ASC
      `,
      [applicationId]
    );

    return res.json({ application: rows[0], history });
  } catch (err) {
    return next(err);
  }
});

// Recruiter/Admin: update application status
async function updateApplicationStatus(req, res, next) {
  try {
    if (!['provider', 'admin'].includes(req.user.role)) {
      return res.status(403).json({ message: 'Recruiter/Admin access only' });
    }

    const applicationId = req.params.id;
    const requestedDecision = normalizeDecision(req.body?.decision);
    const statusInput = String(req.body?.status || '').toLowerCase().trim();
    const directDecisionFromStatus = normalizeDecision(statusInput);
    const status = APPLICATION_STATUSES.includes(statusInput) ? statusInput : (directDecisionFromStatus ? 'accepted_rejected' : null);
    const decision = directDecisionFromStatus || requestedDecision;
    if (!status) {
      return res.status(400).json({ message: 'Invalid status value' });
    }
    const pool = getPool();
    const conn = await pool.getConnection();
    try {
      await conn.beginTransaction();
      let sql = `
        SELECT
          a.id,
          a.job_id AS jobId,
          a.seeker_id AS seekerId,
          a.status AS currentStatus,
          a.decision AS currentDecision,
          COALESCE(a.email, u.email) AS applicantEmail,
          COALESCE(a.name, u.full_name) AS applicantName,
          j.job_title AS jobTitle,
          j.company_name AS companyName
        FROM applications a
        JOIN jobs j ON j.id = a.job_id
        JOIN users u ON u.id = a.seeker_id
        WHERE a.id = ?
      `;
      const params = [applicationId];
      if (req.user.role === 'provider') {
        sql += ' AND j.employer_id = ?';
        params.push(req.user.id);
      }
      sql += ' LIMIT 1';
      const [rows] = await conn.query(sql, params);
      if (!rows.length) {
        await conn.rollback();
        return res.status(404).json({ message: 'Application not found' });
      }
      const application = rows[0];
      if (application.currentStatus === status && (status !== 'accepted_rejected' || !decision || application.currentDecision === decision)) {
        await conn.rollback();
        return res.json({ message: 'Application status unchanged', status, decision: application.currentDecision || null });
      }
      const currentStageIndex = APPLICATION_STATUS_INDEX[application.currentStatus];
      const nextStageIndex = APPLICATION_STATUS_INDEX[status];
      const isSameStageDecisionUpdate = application.currentStatus === 'accepted_rejected' && status === 'accepted_rejected' && !!decision;
      if (!isSameStageDecisionUpdate && typeof currentStageIndex === 'number' && nextStageIndex !== currentStageIndex + 1) {
        await conn.rollback();
        return res.status(400).json({
          message: `Invalid status transition. Next allowed stage is "${APPLICATION_STATUSES[currentStageIndex + 1]}".`
        });
      }
      const nextDecision = status === 'accepted_rejected' ? (decision || application.currentDecision || null) : null;
      await conn.query(
        `UPDATE applications SET status = ?, decision = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
        [status, nextDecision, applicationId]
      );
      const changedByUserId = Number.isFinite(Number(req.user.id)) ? Number(req.user.id) : null;
      await conn.query(
        `
          INSERT INTO application_status_history
            (application_id, previous_status, new_status, changed_by_user_id, changed_by_role, changed_by_identifier)
          VALUES (?, ?, ?, ?, ?, ?)
        `,
        [applicationId, application.currentStatus, status, changedByUserId, req.user.role, String(req.user.id)]
      );
      await conn.commit();
      await sendNotification({
        userId: application.seekerId,
        title: 'Application Update',
        message: status === 'accepted_rejected' && nextDecision
          ? `Your application was marked as "${nextDecision === 'accept' ? 'Accepted' : 'Rejected'}"`
          : `Your application moved to "${status}" stage`,
        type: 'job_update',
        jobId: application.jobId,
        deliveryMode: 'all'
        // deliveryMode: 'mobile_only'
      });
      if (application.applicantEmail) {
        const emailHtml = buildApplicationStatusEmail({
          applicantName: application.applicantName,
          jobTitle: application.jobTitle,
          companyName: application.companyName,
          status
        });
        const subject = status === 'accepted_rejected' && nextDecision
          ? `Application update: ${nextDecision === 'accept' ? 'accepted' : 'rejected'}`
          : (statusEmailContent[status]?.subject || 'Application update');
        await sendEmail(application.applicantEmail, subject, emailHtml);
      }
      return res.json({ message: 'Application status updated successfully', status, decision: nextDecision });
    } catch (txErr) {
      await conn.rollback();
      throw txErr;
    } finally {
      conn.release();
    }
  } catch (err) {
    return next(err);
  }
}

router.patch('/applications/:id/status', authenticate, updateApplicationStatus);

// Backward-compatible alias for existing clients
router.put('/applications/:id/status', authenticate, updateApplicationStatus);

// Employer: delete an application (must own the job)
router.delete('/applications/:id', authenticate, async (req, res, next) => {
  try {
    const appId = req.params.id;
    if (req.user.role === 'provider') {
      const employerId = req.user.id;
      const rows = await query(`
        SELECT a.id
        FROM applications a
        JOIN jobs j ON j.id = a.job_id
        WHERE a.id = ? AND j.employer_id = ?
      `, [appId, employerId]);
      if (rows.length === 0) return res.status(404).json({ message: 'Application not found' });
    } else if (req.user.role === 'seeker') {
      const seekerId = req.user.id;
      const rows = await query(`SELECT id FROM applications WHERE id = ? AND seeker_id = ?`, [appId, seekerId]);
      if (rows.length === 0) return res.status(404).json({ message: 'Application not found' });
    } else {
      return res.status(403).json({ message: 'Unauthorized role' });
    }
    await query('DELETE FROM applications WHERE id = ?', [appId]);
    res.json({ message: 'Application deleted' });
  } catch (err) { return next(err); }
});

router.post('/track/search', authenticate, async (req, res, next) => {
  try {
    if (req.user.role !== 'seeker') {
      return res.status(403).json({ message: 'Only candidates can log searches' });
    }
    const userId = req.user.id;
    const keyword = String(req.body.keyword || '').trim();
 
    if (!keyword) {
      return res.status(400).json({ message: 'keyword is required' });
    }
 
    // Avoid storing duplicates for the same keyword within 1 hour
    const recent = await query(
      `SELECT id FROM user_search_logs
       WHERE user_id = ? AND keyword = ?
         AND searched_at >= DATE_SUB(NOW(), INTERVAL 1 HOUR)
       LIMIT 1`,
      [userId, keyword]
    );
 
    if (recent.length === 0) {
      await query(
        'INSERT INTO user_search_logs (user_id, keyword) VALUES (?, ?)',
        [userId, keyword]
      );
    }
 
    return res.status(201).json({ message: 'Search logged' });
  } catch (err) {
    return next(err);
  }
});
 
// ─────────────────────────────────────────────────────────────
// GET /api/track/search
// Returns the user's recent search keywords (last 30 days).
// Useful to show "recent searches" on the frontend too.
// ─────────────────────────────────────────────────────────────
router.get('/track/search', authenticate, async (req, res, next) => {
  try {
    const userId = req.user.id;
    const limit = Math.min(parseInt(req.query.limit) || 20, 50);
 
    const rows = await query(
      `SELECT id, keyword, searched_at
       FROM user_search_logs
       WHERE user_id = ?
         AND searched_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
       ORDER BY searched_at DESC
       LIMIT ?`,
      [userId, limit]
    );
 
    return res.json({ searches: rows });
  } catch (err) {
    return next(err);
  }
});
 
// ─────────────────────────────────────────────────────────────
// POST /api/track/job-view
// Call this from your frontend when user opens a job detail page.
// Body: { jobId: 42 }
// ─────────────────────────────────────────────────────────────
router.post('/track/job-view', authenticate, async (req, res, next) => {
  try {
    if (req.user.role !== 'seeker') {
      return res.status(403).json({ message: 'Only candidates can log job views' });
    }
    const userId = req.user.id;
    const jobId = parseInt(req.body.jobId);
 
    if (!jobId || isNaN(jobId)) {
      return res.status(400).json({ message: 'jobId is required' });
    }
 
    // Avoid duplicate view logs within 30 minutes (user refreshes page)
    const recent = await query(
      `SELECT id FROM user_job_views
       WHERE user_id = ? AND job_id = ?
         AND viewed_at >= DATE_SUB(NOW(), INTERVAL 30 MINUTE)
       LIMIT 1`,
      [userId, jobId]
    );
 
    if (recent.length === 0) {
      await query(
        'INSERT INTO user_job_views (user_id, job_id) VALUES (?, ?)',
        [userId, jobId]
      );
    }
 
    return res.status(201).json({ message: 'View logged' });
  } catch (err) {
    return next(err);
  }
});
 
// ─────────────────────────────────────────────────────────────
// GET /api/track/job-views
// Returns the user's recently viewed jobs (last 30 days).
// Useful to show "recently viewed" on the frontend dashboard.
// ─────────────────────────────────────────────────────────────
router.get('/track/job-views', authenticate, async (req, res, next) => {
  try {
    const userId = req.user.id;
    const limit = Math.min(parseInt(req.query.limit) || 10, 50);
 
    const rows = await query(
      `SELECT
         ujv.id,
         ujv.job_id,
         ujv.viewed_at,
         j.job_title,
         j.company_name,
         j.city,
         j.state,
         j.country,
         j.job_type,
         j.salary_range,
         j.company_logo,
         ep.logo_url AS employer_logo_url
       FROM user_job_views ujv
       JOIN jobs j ON j.id = ujv.job_id
       LEFT JOIN employer_profiles ep ON ep.user_id = j.employer_id
       WHERE ujv.user_id = ?
         AND ujv.viewed_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
       ORDER BY ujv.viewed_at DESC
       LIMIT ?`,
      [userId, limit]
    );
 
    return res.json({
      recentlyViewed: rows.map((job) => ({ ...job, companyLogoUrl: resolveCompanyLogo(job) }))
    });
  } catch (err) {
    return next(err);
  }
});

module.exports = router;
//const express = require('express');
// const { query, getPool } = require('../db');
// const { authenticate } = require('../middleware/auth');
// const multer = require('multer');
// const path = require('path');
// const sendEmail = require('../utils/sendEmail');
// const { uploadPath } = require('../config/env');
// // Reuse the single notification implementation
// const { sendNotification } = require('./profile.routes');

// const router = express.Router();
// const APPLICATION_STATUSES = ['applied', 'resume_reviewed', 'accepted_rejected', 'final_decision'];
// const APPLICATION_STATUS_INDEX = APPLICATION_STATUSES.reduce((acc, status, index) => {
//   acc[status] = index;
//   return acc;
// }, {});
// const normalizeDecision = (value) => {
//   const v = String(value || '').toLowerCase().trim();
//   if (v === 'accept' || v === 'accepted') return 'accept';
//   if (v === 'rejectd' || v === 'rejected') return 'rejectd';
//   return null;
// };

// const statusEmailContent = {
//   applied: {
//     subject: 'Application received',
//     title: 'Your application has been received',
//     body: 'Thanks for applying. Your application is now in the applied stage.'
//   },
//   resume_reviewed: {
//     subject: 'Application update: resume reviewed',
//     title: 'Your resume has been reviewed',
//     body: 'Your application moved to the resume reviewed stage. The recruiter is evaluating your profile.'
//   },
//   accepted_rejected: {
//     subject: 'Application update: recruiter decision stage',
//     title: 'Your application reached the decision stage',
//     body: 'Your application is now in the accepted/rejected stage. You will receive the final outcome soon.'
//   },
//   final_decision: {
//     subject: 'Application update: final decision',
//     title: 'Final decision is available',
//     body: 'A final decision has been recorded for your application. Please check your application details.'
//   }
// };

// function buildApplicationStatusEmail({ applicantName, jobTitle, companyName, status }) {
//   const content = statusEmailContent[status] || statusEmailContent.applied;
//   const safeName = applicantName || 'Candidate';
//   const safeJobTitle = jobTitle || 'the position';
//   const safeCompanyName = companyName || 'the company';
//   return `
//     <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #222;">
//       <h2 style="margin-bottom: 8px;">${content.title}</h2>
//       <p>Hi ${safeName},</p>
//       <p>${content.body}</p>
//       <p><strong>Job:</strong> ${safeJobTitle}</p>
//       <p><strong>Company:</strong> ${safeCompanyName}</p>
//       <p><strong>Current Stage:</strong> ${status}</p>
//       <p style="margin-top: 20px;">Thank you,<br/>Uptula Team</p>
//     </div>
//   `;
// }

// // Public: Get latest jobs for home page
// router.get('/jobs/latest', async (req, res, next) => {
//   try {
//     const { limit = 6 } = req.query;
//     const safeLimit = Math.min(parseInt(limit) || 6, 20);
    
//     const jobs = await query(`
//       SELECT 
//         j.id,
//         j.job_title,
//         j.company_name,
//         j.company_logo,
//         j.job_type,
//         j.salary_range,
//         j.experience,
//         j.city,
//         j.state,
//         j.country,
//         j.created_at,
//         j.description,
//         j.qualification,
//         j.skills,
//         u.full_name as employer_name,
//         u.email as employer_email
//       FROM jobs j
//       LEFT JOIN users u ON u.id = j.employer_id
//       WHERE j.status = 'active'
//       ORDER BY j.created_at DESC
//       LIMIT ?
//     `, [safeLimit]);

//     const mapped = jobs.map(j => {
//       // Construct location string from city, state, country
//       const locationParts = [j.city, j.state, j.country].filter(Boolean);
//       const location = locationParts.length > 0 ? locationParts.join(', ') : '';
      
//       return {
//         id: j.id,
//         title: j.job_title,
//         company: j.company_name,
//         logo: j.company_logo || 'assets/img/company_logo_1.png',
//         type: j.job_type,
//         salary: j.salary_range,
//         experience: j.experience,
//         location: location,
//         postedAt: j.created_at,
//         description: j.description,
//         qualification: j.qualification,
//         skills: j.skills,
//         employer: {
//           name: j.employer_name,
//           email: j.employer_email
//         }
//       };
//     });

//     res.json({ jobs: mapped });
//   } catch (err) {
//     console.error('Error fetching latest jobs:', err);
//     return next(err);
//   }
// });

// // Public: Get job categories with counts
// router.get('/jobs/categories', async (req, res, next) => {
//   try {
//     const categories = await query(`
//       SELECT 
//         category,
//         COUNT(*) as job_count
//       FROM jobs 
//       WHERE status = 'active' AND category IS NOT NULL AND category != ''
//       GROUP BY category
//       ORDER BY job_count DESC
//       LIMIT 8
//     `);

//     const allCategories = await query(`
//       SELECT 
//         category,
//         COUNT(*) as job_count
//       FROM jobs 
//       WHERE status = 'active' AND category IS NOT NULL AND category != ''
//       GROUP BY category
//       ORDER BY category
//     `);

//     res.json({ categories, allCategories });
//   } catch (err) {
//     console.error('Error fetching categories:', err);
//     return next(err);
//   }
// });

// // Public: Get sponsored jobs from sponsorships table
// router.get('/sponsorships', async (req, res, next) => {
//   try {
//     const sponsorships = await query(`
//       SELECT 
//         s.id,
//         s.title,
//         s.company_name,
//         s.logo,
//         s.description,
//         s.image_url,
//         s.link_url,
//         j.id as job_id
//       FROM sponsorships s
//       LEFT JOIN jobs j ON j.id = s.job_id
//       WHERE s.is_active = 1 
//         AND (s.end_date IS NULL OR s.end_date > NOW())
//       ORDER BY s.created_at DESC
//       LIMIT 4
//     `);

//     res.json({ sponsorships });
//   } catch (err) {
//     console.error('Error fetching sponsorships:', err);
//     return next(err);
//   }
// });

// const parsePositiveIntQuery = (value, paramName) => {
//   if (value === undefined || value === null || value === '') return null;
//   const parsed = parseInt(value, 10);
//   if (!Number.isInteger(parsed) || parsed <= 0) {
//     return { error: `${paramName} must be a positive integer` };
//   }
//   return { value: parsed };
// };

// // Public: List jobs
// router.get('/jobs', async (req, res, next) => {
//   try {
//     const { page = 1, limit = 20, q, city, state, country, jobType, salary, minSalary, maxSalary, qualification, designation, experience, category } = req.query;
//     const safeLimit = Math.min(parseInt(limit) || 20, 50);
//     const offset = ((parseInt(page) || 1) - 1) * safeLimit;

//     const minSalaryParsed = parsePositiveIntQuery(minSalary, 'minSalary');
//     if (minSalaryParsed?.error) {
//       return res.status(400).json({ message: minSalaryParsed.error });
//     }
//     const maxSalaryParsed = parsePositiveIntQuery(maxSalary, 'maxSalary');
//     if (maxSalaryParsed?.error) {
//       return res.status(400).json({ message: maxSalaryParsed.error });
//     }

//     // Build WHERE conditions dynamically
//     const whereParts = ["status = 'active'"];
//     const values = [];
//     if (q) { whereParts.push('(job_title LIKE ? OR company_name LIKE ? OR description LIKE ?)'); values.push(`%${q}%`, `%${q}%`, `%${q}%`); }
//     if (city) { whereParts.push('city = ?'); values.push(city); }
//     if (state) { whereParts.push('state = ?'); values.push(state); }
//     if (country) { whereParts.push('country = ?'); values.push(country); }
//     if (jobType) { whereParts.push('job_type = ?'); values.push(jobType); }
//     if (qualification) { whereParts.push('qualification LIKE ?'); values.push(`%${qualification}%`); }
//     if (designation) { whereParts.push('job_title LIKE ?'); values.push(`%${designation}%`); }
//     if (experience) { whereParts.push('experience = ?'); values.push(experience); }
//     if (category) { whereParts.push('category = ?'); values.push(category); }

//     // Salary filter supports ranges like 20000-30000, 120000+ or 'negotiable'
//     if (salary) {
//       if (salary === 'negotiable') {
//         whereParts.push("salary_range = 'negotiable'");
//       } else if (salary.endsWith('+')) {
//         const min = parseInt(salary.replace('+','')) || 0;
//         whereParts.push('(salary_range >= ? OR salary_range = "120000+")');
//         values.push(min);
//       } else if (/^\d+-\d+$/.test(salary)) {
//         const [minStr, maxStr] = salary.split('-');
//         const min = parseInt(minStr) || 0;
//         const max = parseInt(maxStr) || 0;
//         // Store ranges as text in DB; for filtering, match exactly the saved label
//         whereParts.push('salary_range = ?');
//         values.push(`${min}-${max}`);
//       }
//     }

//     // Numeric salary range filter (overlapping fixed ranges; negotiable always included)
//     if (minSalaryParsed?.value != null) {
//       whereParts.push('(salary_type = \'negotiable\' OR (salary_type = \'fixed\' AND salary_max >= ?))');
//       values.push(minSalaryParsed.value);
//     }
//     if (maxSalaryParsed?.value != null) {
//       whereParts.push('(salary_type = \'negotiable\' OR (salary_type = \'fixed\' AND salary_min <= ?))');
//       values.push(maxSalaryParsed.value);
//     }

//     const whereClause = whereParts.length ? `WHERE ${whereParts.join(' AND ')}` : '';

//     const jobs = await query(`
//       SELECT 
//         id, employer_id, job_title, company_name, category, description, salary_range,
//         salary_min, salary_max, salary_type,
//         no_of_vacancy, experience, company_logo, job_type, qualification, skills,
//         email, phone, website, address, city, state, country, zip_code,
//         facebook, google, twitter, linkedin, pinterest, instagram,
//         status, is_featured, views_count, applications_count,
//         created_at, updated_at
//       FROM jobs 
//       ${whereClause}
//       ORDER BY created_at DESC
//       LIMIT ? OFFSET ?
//     `, [...values, safeLimit, offset]);

//     // Map to camelCase-friendly fields for frontend
//     const mapped = jobs.map(j => ({
//       id: j.id,
//       jobTitle: j.job_title,
//       companyName: j.company_name,
//       category: j.category,
//       description: j.description,
//       salaryRange: j.salary_range,
//       salaryMin: j.salary_min,
//       salaryMax: j.salary_max,
//       salaryType: j.salary_type,
//       noOfVacancy: j.no_of_vacancy,
//       experience: j.experience,
//       companyLogoUrl: j.company_logo, // already a URL path if uploaded
//       jobType: j.job_type,
//       qualification: j.qualification,
//       skills: j.skills,
//       email: j.email,
//       phone: j.phone,
//       website: j.website,
//       address: j.address,
//       city: j.city,
//       state: j.state,
//       country: j.country,
//       zipCode: j.zip_code,
//       facebook: j.facebook,
//       google: j.google,
//       twitter: j.twitter,
//       linkedin: j.linkedin,
//       pinterest: j.pinterest,
//       instagram: j.instagram,
//       status: j.status,
//       isFeatured: j.is_featured,
//       viewsCount: j.views_count,
//       applicationsCount: j.applications_count,
//       createdAt: j.created_at,
//       updatedAt: j.updated_at
//     }));

//     // Count total
//     const countRows = await query(`SELECT COUNT(*) as total FROM jobs ${whereClause}`, values);
//     const total = countRows[0]?.total || 0;

//     res.json({ jobs: mapped, pagination: { page: parseInt(page) || 1, limit: safeLimit, total, totalPages: Math.ceil(total / safeLimit) } });
//   } catch (err) {
//     return next(err);
//   }
// });

// // Public: Get job by id or slug
// router.get('/jobs/:id', async (req, res, next) => {
//   try {
//     const identifier = req.params.id;
    
//     // Check if identifier is numeric (ID) or a slug (title-based)
//     let rows;
//     if (/^\d+$/.test(identifier)) {
//       // Numeric ID - query by ID
//       rows = await query(`
//         SELECT 
//           id, employer_id, job_title, company_name, category, description, salary_range,
//           salary_min, salary_max, salary_type,
//           no_of_vacancy, experience, company_logo, job_type, qualification, skills,
//           email, phone, website, address, city, state, country, zip_code,
//           facebook, google, twitter, linkedin, pinterest, instagram,
//           status, is_featured, views_count, applications_count,
//           created_at, updated_at
//         FROM jobs 
//         WHERE id = ?
//       `, [identifier]);
//     } else {
//       // Slug - query by matching job title (convert slug back to title pattern)
//       // Convert slug to title pattern: "frontend-developer" -> "Frontend Developer" or similar
//       const titlePattern = identifier
//         .split('-')
//         .map(word => word.charAt(0).toUpperCase() + word.slice(1))
//         .join(' ');
      
//       // Try exact match first, then LIKE match
//       rows = await query(`
//         SELECT 
//           id, employer_id, job_title, company_name, category, description, salary_range,
//           salary_min, salary_max, salary_type,
//           no_of_vacancy, experience, company_logo, job_type, qualification, skills,
//           email, phone, website, address, city, state, country, zip_code,
//           facebook, google, twitter, linkedin, pinterest, instagram,
//           status, is_featured, views_count, applications_count,
//           created_at, updated_at
//         FROM jobs 
//         WHERE LOWER(REPLACE(job_title, ' ', '-')) = LOWER(?) 
//            OR LOWER(job_title) LIKE LOWER(?)
//         LIMIT 1
//       `, [identifier, `%${titlePattern}%`]);
//     }

//     if (rows.length === 0) return res.status(404).json({ message: 'Job not found' });
//     const j = rows[0];
//     const job = {
//       id: j.id,
//       jobTitle: j.job_title,
//       companyName: j.company_name,
//       category: j.category,
//       description: j.description,
//       salaryRange: j.salary_range,
//       salaryMin: j.salary_min,
//       salaryMax: j.salary_max,
//       salaryType: j.salary_type,
//       noOfVacancy: j.no_of_vacancy,
//       experience: j.experience,
//       companyLogoUrl: j.company_logo,
//       jobType: j.job_type,
//       qualification: j.qualification,
//       skills: j.skills,
//       email: j.email,
//       phone: j.phone,
//       website: j.website,
//       address: j.address,
//       city: j.city,
//       state: j.state,
//       country: j.country,
//       zipCode: j.zip_code,
//       facebook: j.facebook,
//       google: j.google,
//       twitter: j.twitter,
//       linkedin: j.linkedin,
//       pinterest: j.pinterest,
//       instagram: j.instagram,
//       status: j.status,
//       isFeatured: j.is_featured,
//       viewsCount: j.views_count,
//       applicationsCount: j.applications_count,
//       createdAt: j.created_at,
//       updatedAt: j.updated_at
//     };

//     res.json({ job });
//   } catch (err) {
//     return next(err);
//   }
// });

// // Public: Get a company profile by employer user id
// // GET /api/company/:id
// router.get('/company/:id', async (req, res, next) => {
//   try {
//     const id = Number(req.params.id);
//     if (!Number.isFinite(id) || id <= 0) {
//       return res.status(400).json({ message: 'Invalid company id' });
//     }

//     const rows = await query(
//       `
//         SELECT 
//           u.id AS user_id,
//           u.full_name,
//           u.email AS user_email,
//           u.phone AS user_phone,
//           ep.company_name,
//           ep.contact_person,
//           ep.company_email,
//           ep.phone,
//           ep.address,
//           ep.website,
//           ep.industry,
//           ep.company_size,
//           ep.description,
//           ep.linkedin,
//           ep.twitter,
//           ep.facebook,
//           ep.google,
//           ep.logo_url,
//           ep.founded_year,
//           ep.company_type,
//           ep.is_verified
//         FROM users u
//         LEFT JOIN employer_profiles ep ON ep.user_id = u.id
//         WHERE u.id = ? AND u.role = 'provider'
//         LIMIT 1
//       `,
//       [id]
//     );

//     if (!rows.length) return res.status(404).json({ message: 'Company not found' });
//     const r = rows[0];

//     const profile = {
//       // FIX 6: show the real company name; fall back to a neutral label, not a person name.
//       companyName: r.company_name || 'Company',
//       hasCompanyProfile: !!(r.company_name && String(r.company_name).trim()),
//       contactPerson: r.contact_person || r.full_name || '',
//       email: r.company_email || r.user_email || '',
//       phone: r.phone || r.user_phone || '',
//       address: r.address || '',
//       website: r.website || '',
//       industry: r.industry || '',
//       companySize: r.company_size || '',
//       description: r.description || '',
//       linkedin: r.linkedin || '',
//       twitter: r.twitter || '',
//       facebook: r.facebook || '',
//       google: r.google || '',
//       logoUrl: r.logo_url || '',
//       foundedYear: r.founded_year || '',
//       companyType: r.company_type || '',
//       isVerified: !!r.is_verified
//     };

//     return res.json({ profile });
//   } catch (err) {
//     return next(err);
//   }
// });

// // Public: List all companies (employer profiles)
// // GET /api/companies
// router.get('/companies', async (req, res, next) => {
//   try {
//     const rows = await query(
//       `
//         SELECT 
//           u.id AS user_id,
//           u.full_name,
//           u.email AS user_email,
//           u.phone AS user_phone,
//           ep.company_name,
//           ep.contact_person,
//           ep.company_email,
//           ep.phone,
//           ep.address,
//           ep.website,
//           ep.industry,
//           ep.company_size,
//           ep.description,
//           ep.linkedin,
//           ep.twitter,
//           ep.facebook,
//           ep.google,
//           ep.logo_url,
//           ep.founded_year,
//           ep.company_type,
//           ep.is_verified
//         FROM users u
//         INNER JOIN employer_profiles ep ON ep.user_id = u.id
//         WHERE u.role = 'provider'
//           AND ep.company_name IS NOT NULL
//           AND TRIM(ep.company_name) <> ''
//         ORDER BY ep.company_name ASC
//       `
//     );

//     const companies = rows.map(r => ({
//       id: r.user_id,
//       // FIX 6: only the real company name — never the employer's personal name.
//       companyName: r.company_name || '',
//       contactPerson: r.contact_person || r.full_name || '',
//       email: r.company_email || r.user_email || '',
//       phone: r.phone || r.user_phone || '',
//       address: r.address || '',
//       website: r.website || '',
//       industry: r.industry || '',
//       companySize: r.company_size || '',
//       description: r.description || '',
//       linkedin: r.linkedin || '',
//       twitter: r.twitter || '',
//       facebook: r.facebook || '',
//       google: r.google || '',
//       logoUrl: r.logo_url || '',
//       foundedYear: r.founded_year || '',
//       companyType: r.company_type || '',
//       isVerified: !!r.is_verified
//     }));

//     return res.json({ companies });
//   } catch (err) {
//     return next(err);
//   }
// });



// // Candidate apply to a job (with optional resume upload)
// const storage = multer.diskStorage({
//   destination: function (req, file, cb) {
//     cb(null, uploadPath('applications'));
//   },
//   filename: function (req, file, cb) {
//     const ext = path.extname(file.originalname || '');
//     const base = path.basename(file.originalname || 'resume', ext).replace(/[^a-zA-Z0-9_-]/g, '');
//     cb(null, `${Date.now()}_${base}${ext}`);
//   }
// });
// const upload = multer({ storage });

// router.post('/jobs/:id/apply', authenticate, upload.single('resume'), async (req, res, next) => {
//   try {
//     const jobId = req.params.id;
//     const seekerId = req.user.id;
//     const { name, email, phone, pastedCv } = req.body;
//     const resumePath = req.file ? `/uploads/applications/${req.file.filename}` : null;

//     await query(`
//       CREATE TABLE IF NOT EXISTS applications (
//         id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
//         job_id BIGINT UNSIGNED NOT NULL,
//         seeker_id BIGINT UNSIGNED NOT NULL,
//         name VARCHAR(120) DEFAULT NULL,
//         email VARCHAR(190) DEFAULT NULL,
//         phone VARCHAR(30) DEFAULT NULL,
//         resume_url VARCHAR(255) DEFAULT NULL,
//         pasted_cv TEXT DEFAULT NULL,
//         status ENUM('applied','resume_reviewed','accepted_rejected','final_decision') DEFAULT 'applied',
//         decision ENUM('accept','rejectd') DEFAULT NULL,
//         created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
//         updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
//         PRIMARY KEY (id),
//         FOREIGN KEY (job_id) REFERENCES jobs(id) ON DELETE CASCADE,
//         FOREIGN KEY (seeker_id) REFERENCES users(id) ON DELETE CASCADE,
//         INDEX idx_applications_job_id (job_id),
//         INDEX idx_applications_seeker_id (seeker_id),
//         INDEX idx_applications_status (status),
//         INDEX idx_applications_created_at (created_at),
//         UNIQUE KEY unique_application (job_id, seeker_id)
//       ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
//     `);

//     await query(`
//       CREATE TABLE IF NOT EXISTS application_status_history (
//         id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
//         application_id BIGINT UNSIGNED NOT NULL,
//         previous_status ENUM('applied','resume_reviewed','accepted_rejected','final_decision') DEFAULT NULL,
//         new_status ENUM('applied','resume_reviewed','accepted_rejected','final_decision') NOT NULL,
//         changed_by_user_id BIGINT UNSIGNED DEFAULT NULL,
//         changed_by_role ENUM('seeker','provider','admin') NOT NULL,
//         changed_by_identifier VARCHAR(64) NOT NULL,
//         created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
//         PRIMARY KEY (id),
//         FOREIGN KEY (application_id) REFERENCES applications(id) ON DELETE CASCADE,
//         INDEX idx_app_status_history_application (application_id),
//         INDEX idx_app_status_history_changed_by_user (changed_by_user_id),
//         INDEX idx_app_status_history_created (created_at)
//       ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
//     `);

//     await query(
//       `INSERT INTO applications (job_id, seeker_id, name, email, phone, resume_url, pasted_cv, status) VALUES (?, ?, ?, ?, ?, ?, ?, 'applied')`,
//       [jobId, seekerId, name || null, email || null, phone || null, resumePath, pastedCv || null]
//     );

//     const inserted = await query(
//       `SELECT id FROM applications WHERE job_id = ? AND seeker_id = ? LIMIT 1`,
//       [jobId, seekerId]
//     );
//     if (inserted.length) {
//       await query(
//         `
//           INSERT INTO application_status_history
//             (application_id, previous_status, new_status, changed_by_user_id, changed_by_role, changed_by_identifier)
//           VALUES (?, ?, ?, ?, ?, ?)
//         `,
//         [inserted[0].id, null, 'applied', seekerId, req.user.role || 'seeker', String(seekerId)]
//       );
//     }

//     const jobs = await query(`SELECT employer_id FROM jobs WHERE id = ? LIMIT 1`, [jobId]);
//     if (jobs.length) {
//       await sendNotification({
//         userId: jobs[0].employer_id,
//         title: 'New Application',
//         message: 'A candidate applied to your job',
//         type: 'application',
//         jobId: jobId
//       });
//     }

//     res.status(201).json({ message: 'Application submitted successfully' });
//   } catch (err) {
//     // Handle duplicate application error specifically
//     if (err.code === 'ER_DUP_ENTRY' && err.message.includes('unique_application')) {
//       return res.status(409).json({ 
//         message: 'You have already applied for this job',
//         code: 'DUPLICATE_APPLICATION'
//       });
//     }
    
//     console.error('Job application error:', err);
//     return next(err);
//   }
// });

// // Candidate: list own applications
// router.get('/applications/mine', authenticate, async (req, res, next) => {
//   try {
//     const seekerId = req.user.id;
//     const rows = await query(`
//       SELECT a.id, a.job_id as jobId, a.status, a.created_at as appliedAt, a.resume_url as resumeUrl, a.pasted_cv as pastedCv,
//              a.decision,
//              j.job_title as jobTitle, j.company_name as companyName, j.city, j.state, j.country
//       FROM applications a
//       JOIN jobs j ON j.id = a.job_id
//       WHERE a.seeker_id = ?
//       ORDER BY a.created_at DESC
//     `, [seekerId]);
//     res.json({ applications: rows });
//   } catch (err) { return next(err); }
// });

// // Employer: list applications for my jobs
// router.get('/applications', authenticate, async (req, res, next) => {
//   try {
//     if (req.user.role !== 'provider') {
//       return res.status(403).json({ message: 'Employer access only' });
//     }
//     const employerId = req.user.id;
//     const rows = await query(`
//       SELECT a.id, a.job_id as jobId, a.seeker_id as seekerId, a.status, a.name, a.email, a.phone, a.resume_url as resumeUrl, a.pasted_cv as pastedCv, a.created_at as appliedAt,
//              a.decision,
//              j.job_title as jobTitle, j.company_name as companyName,
//              u.full_name as seekerName, u.email as seekerEmail
//       FROM applications a
//       JOIN jobs j ON j.id = a.job_id
//       JOIN users u ON u.id = a.seeker_id
//       WHERE j.employer_id = ?
//       ORDER BY a.created_at DESC
//     `, [employerId]);
//     res.json({ applications: rows });
//   } catch (err) { return next(err); }
// });

// // Applicant: get own application with current status and history
// router.get('/applications/:id', authenticate, async (req, res, next) => {
//   try {
//     if (!['seeker', 'provider'].includes(req.user.role)) {
//       return res.status(403).json({ message: 'Seeker/Provider access only' });
//     }

//     const applicationId = req.params.id;
//     const params = [applicationId];
//     let accessClause = '';
//     if (req.user.role === 'seeker') {
//       accessClause = ' AND a.seeker_id = ?';
//       params.push(req.user.id);
//     } else if (req.user.role === 'provider') {
//       accessClause = ' AND j.employer_id = ?';
//       params.push(req.user.id);
//     }

//     const rows = await query(
//       `
//         SELECT
//           a.id,
//           a.job_id AS jobId,
//           a.seeker_id AS seekerId,
//           a.name,
//           a.email,
//           a.phone,
//           a.resume_url AS resumeUrl,
//           a.pasted_cv AS pastedCv,
//           a.status,
//           a.decision,
//           a.created_at AS appliedAt,
//           a.updated_at AS updatedAt,
//           j.job_title AS jobTitle,
//           j.company_name AS companyName
//         FROM applications a
//         JOIN jobs j ON j.id = a.job_id
//         WHERE a.id = ? ${accessClause}
//         LIMIT 1
//       `,
//       params
//     );

//     if (!rows.length) {
//       return res.status(404).json({ message: 'Application not found' });
//     }

//     const history = await query(
//       `
//         SELECT
//           id,
//           previous_status AS previousStatus,
//           new_status AS newStatus,
//           changed_by_user_id AS changedByUserId,
//           changed_by_role AS changedByRole,
//           changed_by_identifier AS changedByIdentifier,
//           created_at AS changedAt
//         FROM application_status_history
//         WHERE application_id = ?
//         ORDER BY created_at ASC, id ASC
//       `,
//       [applicationId]
//     );

//     return res.json({ application: rows[0], history });
//   } catch (err) {
//     return next(err);
//   }
// });

// // Recruiter/Admin: update application status
// async function updateApplicationStatus(req, res, next) {
//   try {
//     if (!['provider', 'admin'].includes(req.user.role)) {
//       return res.status(403).json({ message: 'Recruiter/Admin access only' });
//     }

//     const applicationId = req.params.id;
//     const requestedDecision = normalizeDecision(req.body?.decision);
//     const statusInput = String(req.body?.status || '').toLowerCase().trim();
//     const directDecisionFromStatus = normalizeDecision(statusInput);
//     const status = APPLICATION_STATUSES.includes(statusInput) ? statusInput : (directDecisionFromStatus ? 'accepted_rejected' : null);
//     const decision = directDecisionFromStatus || requestedDecision;
//     if (!status) {
//       return res.status(400).json({ message: 'Invalid status value' });
//     }
//     const pool = getPool();
//     const conn = await pool.getConnection();
//     try {
//       await conn.beginTransaction();
//       let sql = `
//         SELECT
//           a.id,
//           a.job_id AS jobId,
//           a.seeker_id AS seekerId,
//           a.status AS currentStatus,
//           a.decision AS currentDecision,
//           COALESCE(a.email, u.email) AS applicantEmail,
//           COALESCE(a.name, u.full_name) AS applicantName,
//           j.job_title AS jobTitle,
//           j.company_name AS companyName
//         FROM applications a
//         JOIN jobs j ON j.id = a.job_id
//         JOIN users u ON u.id = a.seeker_id
//         WHERE a.id = ?
//       `;
//       const params = [applicationId];
//       if (req.user.role === 'provider') {
//         sql += ' AND j.employer_id = ?';
//         params.push(req.user.id);
//       }
//       sql += ' LIMIT 1';
//       const [rows] = await conn.query(sql, params);
//       if (!rows.length) {
//         await conn.rollback();
//         return res.status(404).json({ message: 'Application not found' });
//       }
//       const application = rows[0];
//       if (application.currentStatus === status && (status !== 'accepted_rejected' || !decision || application.currentDecision === decision)) {
//         await conn.rollback();
//         return res.json({ message: 'Application status unchanged', status, decision: application.currentDecision || null });
//       }
//       const currentStageIndex = APPLICATION_STATUS_INDEX[application.currentStatus];
//       const nextStageIndex = APPLICATION_STATUS_INDEX[status];
//       const isSameStageDecisionUpdate = application.currentStatus === 'accepted_rejected' && status === 'accepted_rejected' && !!decision;
//       if (!isSameStageDecisionUpdate && typeof currentStageIndex === 'number' && nextStageIndex !== currentStageIndex + 1) {
//         await conn.rollback();
//         return res.status(400).json({
//           message: `Invalid status transition. Next allowed stage is "${APPLICATION_STATUSES[currentStageIndex + 1]}".`
//         });
//       }
//       const nextDecision = status === 'accepted_rejected' ? (decision || application.currentDecision || null) : null;
//       await conn.query(
//         `UPDATE applications SET status = ?, decision = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
//         [status, nextDecision, applicationId]
//       );
//       const changedByUserId = Number.isFinite(Number(req.user.id)) ? Number(req.user.id) : null;
//       await conn.query(
//         `
//           INSERT INTO application_status_history
//             (application_id, previous_status, new_status, changed_by_user_id, changed_by_role, changed_by_identifier)
//           VALUES (?, ?, ?, ?, ?, ?)
//         `,
//         [applicationId, application.currentStatus, status, changedByUserId, req.user.role, String(req.user.id)]
//       );
//       await conn.commit();
//       await sendNotification({
//         userId: application.seekerId,
//         title: 'Application Update',
//         message: status === 'accepted_rejected' && nextDecision
//           ? `Your application was marked as "${nextDecision === 'accept' ? 'Accepted' : 'Rejected'}"`
//           : `Your application moved to "${status}" stage`,
//         type: 'job_update',
//         jobId: application.jobId,
//         deliveryMode: 'all'
//         // deliveryMode: 'mobile_only'
//       });
//       if (application.applicantEmail) {
//         const emailHtml = buildApplicationStatusEmail({
//           applicantName: application.applicantName,
//           jobTitle: application.jobTitle,
//           companyName: application.companyName,
//           status
//         });
//         const subject = status === 'accepted_rejected' && nextDecision
//           ? `Application update: ${nextDecision === 'accept' ? 'accepted' : 'rejected'}`
//           : (statusEmailContent[status]?.subject || 'Application update');
//         await sendEmail(application.applicantEmail, subject, emailHtml);
//       }
//       return res.json({ message: 'Application status updated successfully', status, decision: nextDecision });
//     } catch (txErr) {
//       await conn.rollback();
//       throw txErr;
//     } finally {
//       conn.release();
//     }
//   } catch (err) {
//     return next(err);
//   }
// }

// router.patch('/applications/:id/status', authenticate, updateApplicationStatus);

// // Backward-compatible alias for existing clients
// router.put('/applications/:id/status', authenticate, updateApplicationStatus);

// // Employer: delete an application (must own the job)
// router.delete('/applications/:id', authenticate, async (req, res, next) => {
//   try {
//     const appId = req.params.id;
//     if (req.user.role === 'provider') {
//       const employerId = req.user.id;
//       const rows = await query(`
//         SELECT a.id
//         FROM applications a
//         JOIN jobs j ON j.id = a.job_id
//         WHERE a.id = ? AND j.employer_id = ?
//       `, [appId, employerId]);
//       if (rows.length === 0) return res.status(404).json({ message: 'Application not found' });
//     } else if (req.user.role === 'seeker') {
//       const seekerId = req.user.id;
//       const rows = await query(`SELECT id FROM applications WHERE id = ? AND seeker_id = ?`, [appId, seekerId]);
//       if (rows.length === 0) return res.status(404).json({ message: 'Application not found' });
//     } else {
//       return res.status(403).json({ message: 'Unauthorized role' });
//     }
//     await query('DELETE FROM applications WHERE id = ?', [appId]);
//     res.json({ message: 'Application deleted' });
//   } catch (err) { return next(err); }
// });

// router.post('/track/search', authenticate, async (req, res, next) => {
//   try {
//     if (req.user.role !== 'seeker') {
//       return res.status(403).json({ message: 'Only candidates can log searches' });
//     }
//     const userId = req.user.id;
//     const keyword = String(req.body.keyword || '').trim();
 
//     if (!keyword) {
//       return res.status(400).json({ message: 'keyword is required' });
//     }
 
//     // Avoid storing duplicates for the same keyword within 1 hour
//     const recent = await query(
//       `SELECT id FROM user_search_logs
//        WHERE user_id = ? AND keyword = ?
//          AND searched_at >= DATE_SUB(NOW(), INTERVAL 1 HOUR)
//        LIMIT 1`,
//       [userId, keyword]
//     );
 
//     if (recent.length === 0) {
//       await query(
//         'INSERT INTO user_search_logs (user_id, keyword) VALUES (?, ?)',
//         [userId, keyword]
//       );
//     }
 
//     return res.status(201).json({ message: 'Search logged' });
//   } catch (err) {
//     return next(err);
//   }
// });
 
// // ─────────────────────────────────────────────────────────────
// // GET /api/track/search
// // Returns the user's recent search keywords (last 30 days).
// // Useful to show "recent searches" on the frontend too.
// // ─────────────────────────────────────────────────────────────
// router.get('/track/search', authenticate, async (req, res, next) => {
//   try {
//     const userId = req.user.id;
//     const limit = Math.min(parseInt(req.query.limit) || 20, 50);
 
//     const rows = await query(
//       `SELECT id, keyword, searched_at
//        FROM user_search_logs
//        WHERE user_id = ?
//          AND searched_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
//        ORDER BY searched_at DESC
//        LIMIT ?`,
//       [userId, limit]
//     );
 
//     return res.json({ searches: rows });
//   } catch (err) {
//     return next(err);
//   }
// });
 
// // ─────────────────────────────────────────────────────────────
// // POST /api/track/job-view
// // Call this from your frontend when user opens a job detail page.
// // Body: { jobId: 42 }
// // ─────────────────────────────────────────────────────────────
// router.post('/track/job-view', authenticate, async (req, res, next) => {
//   try {
//     if (req.user.role !== 'seeker') {
//       return res.status(403).json({ message: 'Only candidates can log job views' });
//     }
//     const userId = req.user.id;
//     const jobId = parseInt(req.body.jobId);
 
//     if (!jobId || isNaN(jobId)) {
//       return res.status(400).json({ message: 'jobId is required' });
//     }
 
//     // Avoid duplicate view logs within 30 minutes (user refreshes page)
//     const recent = await query(
//       `SELECT id FROM user_job_views
//        WHERE user_id = ? AND job_id = ?
//          AND viewed_at >= DATE_SUB(NOW(), INTERVAL 30 MINUTE)
//        LIMIT 1`,
//       [userId, jobId]
//     );
 
//     if (recent.length === 0) {
//       await query(
//         'INSERT INTO user_job_views (user_id, job_id) VALUES (?, ?)',
//         [userId, jobId]
//       );
//     }
 
//     return res.status(201).json({ message: 'View logged' });
//   } catch (err) {
//     return next(err);
//   }
// });
 
// // ─────────────────────────────────────────────────────────────
// // GET /api/track/job-views
// // Returns the user's recently viewed jobs (last 30 days).
// // Useful to show "recently viewed" on the frontend dashboard.
// // ─────────────────────────────────────────────────────────────
// router.get('/track/job-views', authenticate, async (req, res, next) => {
//   try {
//     const userId = req.user.id;
//     const limit = Math.min(parseInt(req.query.limit) || 10, 50);
 
//     const rows = await query(
//       `SELECT
//          ujv.id,
//          ujv.job_id,
//          ujv.viewed_at,
//          j.job_title,
//          j.company_name,
//          j.city,
//          j.state,
//          j.country,
//          j.job_type,
//          j.salary_range,
//          j.company_logo
//        FROM user_job_views ujv
//        JOIN jobs j ON j.id = ujv.job_id
//        WHERE ujv.user_id = ?
//          AND ujv.viewed_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
//        ORDER BY ujv.viewed_at DESC
//        LIMIT ?`,
//       [userId, limit]
//     );
 
//     return res.json({ recentlyViewed: rows });
//   } catch (err) {
//     return next(err);
//   }
// });

// module.exports = router;
 
