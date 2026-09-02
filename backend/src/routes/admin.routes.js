const express = require('express');
const md5 = require('md5');
const { query } = require('../db');
const { authenticate } = require('../middleware/auth');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { smartNotifyForJob } = require('../utils/smartNotifier');
const { auditFromReq } = require('../utils/audit');
const { getUserCategories } = require('../utils/userCategories');
const { resolveCompanyLogo } = require('../config/constants');
const { findEmailConflict } = require('../utils/email');

const router = express.Router();

const ANALYTICS_FEATURE_KEY = 'job_analytics_dashboard';

const safeParseMetadata = (value) => {
  if (!value) return null;
  if (typeof value === 'object') return value;
  try {
    return JSON.parse(value);
  } catch (err) {
    console.warn('Failed to parse payment metadata', err);
    return null;
  }
};

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

const fetchJobById = async (jobId) => {
  if (!jobId) return null;
  const rows = await query(
    `
      SELECT
        j.id,
        j.employer_id,
        j.job_title,
        j.company_name,
        j.category,
        j.description,
        j.salary_range,
        j.salary_min,
        j.salary_max,
        j.salary_type,
        j.no_of_vacancy,
        j.experience,
        j.company_logo,
        j.job_type,
        j.status,
        j.city,
        j.state,
        j.country,
        j.address,
        j.zip_code,
        j.created_at,
        j.updated_at,
        u.full_name AS employer_name,
        u.email AS employer_email,
        u.phone AS employer_phone,
        ep.company_name AS profile_company_name,
        ep.logo_url AS employer_logo_url,
        (SELECT COUNT(*) FROM applications a WHERE a.job_id = j.id) AS application_count
      FROM jobs j
      LEFT JOIN users u ON u.id = j.employer_id
      LEFT JOIN employer_profiles ep ON ep.user_id = j.employer_id
      WHERE j.id = ?
      LIMIT 1
    `,
    [jobId]
  );
  return rows.length ? { ...rows[0], companyLogoUrl: resolveCompanyLogo(rows[0]) } : null;
};

const ensureEmployer = async (employerId) => {
  if (!employerId) return null;
  const employers = await query(
    'SELECT id, full_name, email, phone FROM users WHERE id = ? AND role = "provider" LIMIT 1',
    [employerId]
  );
  return employers.length ? employers[0] : null;
};

const deriveCompanyName = async (employerId, providedName) => {
  if (providedName && providedName.trim()) {
    return providedName.trim();
  }
  const profiles = await query(
    'SELECT company_name FROM employer_profiles WHERE user_id = ? LIMIT 1',
    [employerId]
  );
  if (profiles.length && profiles[0].company_name) {
    return profiles[0].company_name;
  }
  const employer = await ensureEmployer(employerId);
  return employer?.full_name || 'Company';
};

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = 'uploads/sponsorship';
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed!'), false);
    }
  }
});

// Admin authentication middleware
const authenticateAdmin = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    return next();
  }
  return res.status(403).json({ message: 'Admin access required' });
};

// Admin login
router.post('/login', async (req, res, next) => {
  try {
    console.log('Admin login attempt:', req.body);
    const { email, password } = req.body;
    
    // Check if it's the admin credentials
    if (email === 'admin@uptula.com' && password === 'admin@uptula78945') {
      const admin = {
        id: 'admin-1',
        fullName: 'Admin User',
        email: 'admin@uptula.com',
        role: 'admin'
      };
      
      // Generate token (you might want to use a different secret for admin)
      const jwt = require('jsonwebtoken');
      const { JWT_SECRET } = require('../config/env');
      const token = jwt.sign(admin, JWT_SECRET, { expiresIn: '24h' });
      
      console.log('Admin login successful');
      return res.json({
        token,
        admin
      });
    }
    
    console.log('Admin login failed - invalid credentials');
    return res.status(401).json({ message: 'Invalid admin credentials' });
  } catch (err) {
    console.error('Admin login error:', err);
    return next(err);
  }
});

// Verify admin token
router.get('/verify', authenticate, authenticateAdmin, (req, res) => {
  res.json({ admin: req.user });
});

// Get candidates with optional search and pagination
router.get('/candidates', authenticate, authenticateAdmin, async (req, res, next) => {
  try {
    const {
      q = '',
      page = 1,
      limit = 50,
      dateFrom = '',
      dateTo = '',
      categoryId = '',
      subcategoryId = '',
    } = req.query;
    const offset = (page - 1) * limit;
    const like = `%${q}%`;
    let df = String(dateFrom || '').trim();
    let dt = String(dateTo || '').trim();
    if (df && dt && df > dt) {
      const swap = df;
      df = dt;
      dt = swap;
    }
    let dateSql = '';
    const dateParams = [];
    if (df && dt) {
      dateSql = ' AND DATE(u.created_at) BETWEEN ? AND ? ';
      dateParams.push(df, dt);
    } else if (df) {
      dateSql = ' AND DATE(u.created_at) = ? ';
      dateParams.push(df);
    } else if (dt) {
      dateSql = ' AND DATE(u.created_at) = ? ';
      dateParams.push(dt);
    }

    let categorySql = '';
    const categoryParams = [];
    if (categoryId) {
      categorySql += ' AND u.category_id = ? ';
      categoryParams.push(Number(categoryId));
    }
    if (subcategoryId) {
      categorySql += ' AND u.subcategory_id = ? ';
      categoryParams.push(Number(subcategoryId));
    }

    const candidates = await query(
      `
      SELECT u.id, u.full_name, u.email, u.phone, u.experience, u.is_verified, u.created_at,
             u.category_id, u.subcategory_id,
             u.category_id AS registration_category_id,
             u.subcategory_id AS registration_subcategory_id,
             rc.name AS category_name, rs.name AS subcategory_name
      FROM users u
      LEFT JOIN categories rc ON rc.id = u.category_id
      LEFT JOIN subcategories rs ON rs.id = u.subcategory_id
      WHERE u.role = "seeker"
      AND (? = '' OR u.full_name LIKE ? OR u.email LIKE ? OR u.phone LIKE ?)
      ${dateSql}
      ${categorySql}
      ORDER BY u.created_at DESC
      LIMIT ? OFFSET ?
      `,
      [q, like, like, like, ...dateParams, ...categoryParams, parseInt(limit), parseInt(offset)]
    );
    const total = await query(
      `
      SELECT COUNT(*) as count
      FROM users u
      WHERE u.role = "seeker"
      AND (? = '' OR u.full_name LIKE ? OR u.email LIKE ? OR u.phone LIKE ?)
      ${dateSql}
      ${categorySql}
      `,
      [q, like, like, like, ...dateParams, ...categoryParams]
    );
    res.json({ candidates, pagination: { page: parseInt(page), limit: parseInt(limit), total: Number(total[0].count) || 0 } });
  } catch (err) {
    return next(err);
  }
});

// Get employers with optional search and pagination
router.get('/employers', authenticate, authenticateAdmin, async (req, res, next) => {
  try {
    const { q = '', page = 1, limit = 50, dateFrom = '', dateTo = '' } = req.query;
    const offset = (page - 1) * limit;
    const like = `%${q}%`;
    let df = String(dateFrom || '').trim();
    let dt = String(dateTo || '').trim();
    if (df && dt && df > dt) {
      const swap = df;
      df = dt;
      dt = swap;
    }
    let dateSql = '';
    const dateParams = [];
    if (df && dt) {
      dateSql = ' AND DATE(u.created_at) BETWEEN ? AND ? ';
      dateParams.push(df, dt);
    } else if (df) {
      dateSql = ' AND DATE(u.created_at) = ? ';
      dateParams.push(df);
    } else if (dt) {
      dateSql = ' AND DATE(u.created_at) = ? ';
      dateParams.push(dt);
    }
    const categoryId = req.query.categoryId || '';
    const subcategoryId = req.query.subcategoryId || '';
    let categorySql = '';
    const categoryParams = [];
    if (categoryId) {
      categorySql += ' AND u.category_id = ? ';
      categoryParams.push(Number(categoryId));
    }
    if (subcategoryId) {
      categorySql += ' AND u.subcategory_id = ? ';
      categoryParams.push(Number(subcategoryId));
    }

    const employers = await query(
      `
      SELECT u.id, u.full_name, u.email, u.phone, u.is_verified, u.created_at,
             u.category_id, u.subcategory_id,
             rc.name AS category_name, rs.name AS subcategory_name,
             ep.company_name, ep.is_verified as company_verified
      FROM users u
      LEFT JOIN employer_profiles ep ON ep.user_id = u.id
      LEFT JOIN categories rc ON rc.id = u.category_id
      LEFT JOIN subcategories rs ON rs.id = u.subcategory_id
      WHERE u.role = "provider"
      AND (? = '' OR u.full_name LIKE ? OR u.email LIKE ? OR u.phone LIKE ? OR ep.company_name LIKE ?)
      ${dateSql}
      ${categorySql}
      ORDER BY u.created_at DESC
      LIMIT ? OFFSET ?
      `,
      [q, like, like, like, like, ...dateParams, ...categoryParams, parseInt(limit), parseInt(offset)]
    );
    const total = await query(
      `
      SELECT COUNT(*) as count
      FROM users u
      LEFT JOIN employer_profiles ep ON ep.user_id = u.id
      WHERE u.role = "provider"
      AND (? = '' OR u.full_name LIKE ? OR u.email LIKE ? OR u.phone LIKE ? OR ep.company_name LIKE ?)
      ${dateSql}
      ${categorySql}
      `,
      [q, like, like, like, like, ...dateParams, ...categoryParams]
    );
    res.json({ employers, pagination: { page: parseInt(page), limit: parseInt(limit), total: Number(total[0].count) || 0 } });
  } catch (err) {
    return next(err);
  }
});

// Get employer profile (admin)
router.get('/employers/:id/profile', authenticate, authenticateAdmin, async (req, res, next) => {
  try {
    const { id } = req.params;
    const users = await query(
      `SELECT u.id, u.full_name, u.email, u.phone, u.role, u.created_at,
              u.category_id, u.subcategory_id,
              rc.name AS category_name, rs.name AS subcategory_name
       FROM users u
       LEFT JOIN categories rc ON rc.id = u.category_id
       LEFT JOIN subcategories rs ON rs.id = u.subcategory_id
       WHERE u.id = ? AND u.role = "provider"`,
      [id]
    );
    if (users.length === 0) {
      return res.status(404).json({ message: 'Employer not found' });
    }
    const profileRows = await query('SELECT * FROM employer_profiles WHERE user_id = ?', [id]);
    const profile = profileRows.length > 0 ? profileRows[0] : null;
    return res.json({ employer: users[0], profile });
  } catch (err) {
    return next(err);
  }
});

// Create employer/company
router.post('/employers', authenticate, authenticateAdmin, async (req, res, next) => {
  try {
    const {
      fullName,
      email,
      phone,
      companyName,
      companyEmail,
      website,
      address,
      industry,
      companySize
    } = req.body || {};

    if (!fullName || !email || !companyName) {
      return res.status(400).json({ message: 'fullName, email and companyName are required.' });
    }

    const existing = await findEmailConflict(query, email);
    if (existing) {
      return res.status(409).json({ message: 'Email already registered.' });
    }

    const temporaryPassword = Math.random().toString(36).slice(-10);
    const passwordHash = md5(temporaryPassword);

    const userResult = await query(
      `
        INSERT INTO users (role, full_name, email, phone, password_hash, is_verified)
        VALUES ('provider', ?, ?, ?, ?, 1)
      `,
      [fullName, email, phone || null, passwordHash]
    );

    const employerId = userResult.insertId;
    await query(
      `
        INSERT INTO employer_profiles (
          user_id,
          company_name,
          contact_person,
          company_email,
          phone,
          address,
          website,
          industry,
          company_size
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE
          company_name = VALUES(company_name),
          contact_person = VALUES(contact_person),
          company_email = VALUES(company_email),
          phone = VALUES(phone),
          address = VALUES(address),
          website = VALUES(website),
          industry = VALUES(industry),
          company_size = VALUES(company_size),
          updated_at = CURRENT_TIMESTAMP
      `,
      [
        employerId,
        companyName,
        fullName,
        companyEmail || email,
        phone || null,
        address || null,
        website || null,
        industry || null,
        companySize || null
      ]
    );

    const [profile] = await query('SELECT * FROM employer_profiles WHERE user_id = ? LIMIT 1', [employerId]);

    res.status(201).json({
      message: 'Employer created successfully',
      employer: {
        id: employerId,
        fullName,
        email,
        phone: phone || null,
        profile: profile || null
      },
      temporaryPassword
    });
  } catch (err) {
    return next(err);
  }
});

// Get jobs with employer information + optional search
router.get('/jobs', authenticate, authenticateAdmin, async (req, res, next) => {
  try {
    const { q = '', page = 1, limit = 50 } = req.query;
    const offset = (page - 1) * limit;
    const like = `%${q}%`;
    const searchParams = [q, like, like, like, like];
    const jobs = await query(
      `
      SELECT 
        j.id,
          j.employer_id,
          j.job_title,
          j.company_name,
          j.category,
          j.description,
          j.salary_range,
          j.salary_min,
          j.salary_max,
          j.salary_type,
          j.no_of_vacancy,
          j.experience,
          j.company_logo,
        j.job_type,
        j.status,
          j.city,
          j.state,
          j.country,
        j.created_at,
          j.updated_at,
          u.full_name AS employer_name,
          u.email AS employer_email,
          u.phone AS employer_phone,
          ep.company_name AS profile_company_name,
          ep.logo_url AS employer_logo_url,
          (SELECT COUNT(*) FROM applications a WHERE a.job_id = j.id) AS application_count
      FROM jobs j
      LEFT JOIN users u ON j.employer_id = u.id
        LEFT JOIN employer_profiles ep ON ep.user_id = j.employer_id
        WHERE (? = '' OR j.job_title LIKE ? OR j.description LIKE ? OR u.full_name LIKE ? OR ep.company_name LIKE ?)
      ORDER BY j.created_at DESC
      LIMIT ? OFFSET ?
      `,
      [...searchParams, parseInt(limit), parseInt(offset)]
    );
    const total = await query(
      `
      SELECT COUNT(*) as count
      FROM jobs j
      LEFT JOIN users u ON j.employer_id = u.id
        LEFT JOIN employer_profiles ep ON ep.user_id = j.employer_id
        WHERE (? = '' OR j.job_title LIKE ? OR j.description LIKE ? OR u.full_name LIKE ? OR ep.company_name LIKE ?)
      `,
      searchParams
    );
    res.json({
      jobs: jobs.map((job) => ({ ...job, companyLogoUrl: resolveCompanyLogo(job) })),
      pagination: { page: parseInt(page), limit: parseInt(limit), total: total[0].count }
    });
  } catch (err) {
    return next(err);
  }
});

// Create job on behalf of employer
router.post('/jobs', authenticate, authenticateAdmin, async (req, res, next) => {
  try {
    const {
      employerId,
      jobTitle,
      companyName,
      description,
      category,
      salaryRange,
      noOfVacancy,
      experience,
      jobType,
      status,
      city,
      state,
      country,
      address,
      zipCode,
      qualification,
      skills,
      website,
      email,
      phone
    } = req.body || {};

    if (!employerId || !jobTitle || !description) {
      return res.status(400).json({ message: 'employerId, jobTitle and description are required.' });
    }

    const salaryFields = resolveSalaryForInsert(req.body || {});
    if (salaryFields.error) {
      return res.status(400).json({ message: salaryFields.error });
    }

    const employer = await ensureEmployer(Number(employerId));
    if (!employer) {
      return res.status(404).json({ message: 'Employer not found.' });
    }

    const resolvedCompanyName = await deriveCompanyName(employer.id, companyName);
    const vacancies = Number(noOfVacancy) > 0 ? Number(noOfVacancy) : 1;

    const result = await query(
      `
        INSERT INTO jobs (
          employer_id,
          job_title,
          company_name,
          category,
          description,
          salary_range,
          salary_min,
          salary_max,
          salary_type,
          no_of_vacancy,
          experience,
          company_logo,
          job_type,
          qualification,
          skills,
          email,
          phone,
          website,
          address,
          city,
          state,
          country,
          zip_code,
          facebook,
          google,
          twitter,
          linkedin,
          pinterest,
          instagram,
          status
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NULL, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NULL, NULL, NULL, NULL, NULL, NULL, ?)
      `,
      [
        employer.id,
        jobTitle,
        resolvedCompanyName,
        category || null,
        description,
        salaryFields.salaryRange,
        salaryFields.salaryMin,
        salaryFields.salaryMax,
        salaryFields.salaryType,
        vacancies,
        experience || null,
        jobType || 'full_time',
        qualification || null,
        skills || null,
        email || employer.email,
        phone || employer.phone || null,
        website || null,
        address || null,
        city || null,
        state || null,
        country || null,
        zipCode || null,
        status || 'active'
      ]
    );

    const createdJob = await fetchJobById(result.insertId);

    const jobForScoringAdmin = {
      job_title: jobTitle,
      company_name: resolvedCompanyName,
      skills: skills || null,
      address: address || null,
      city: city || null,
      state: state || null,
      country: country || null,
    };

    smartNotifyForJob({
      job: jobForScoringAdmin,
      jobId: result.insertId,
      excludeUserIds: [employer.id]
    }).catch((err) => {
      console.error('[admin.routes] smartNotifyForJob failed:', err.message);
    });

    res.status(201).json({
      message: 'Job created successfully',
      job: createdJob
    });
  } catch (err) {
    return next(err);
  }
});

// Update job
router.put('/jobs/:id', authenticate, authenticateAdmin, async (req, res, next) => {
  try {
    const { id } = req.params;
    const existingJob = await fetchJobById(id);
    if (!existingJob) {
      return res.status(404).json({ message: 'Job not found.' });
    }

    const {
      employerId,
      jobTitle,
      companyName,
      description,
      category,
      salaryRange,
      noOfVacancy,
      experience,
      jobType,
      status,
      city,
      state,
      country,
      address,
      zipCode,
      qualification,
      skills,
      website,
      email,
      phone
    } = req.body || {};

    const salaryFields = resolveSalaryForInsert(req.body || {});
    if (salaryFields.error) {
      return res.status(400).json({ message: salaryFields.error });
    }

    const updates = [];
    const values = [];

    if (employerId && Number(employerId) !== existingJob.employer_id) {
      const employer = await ensureEmployer(Number(employerId));
      if (!employer) return res.status(404).json({ message: 'New employer not found.' });
      updates.push('employer_id = ?');
      values.push(employer.id);
    }

    const map = {
      job_title: jobTitle,
      company_name: companyName,
      category,
      description,
      salary_range: salaryFields.salaryRange,
      salary_min: salaryFields.salaryMin,
      salary_max: salaryFields.salaryMax,
      salary_type: salaryFields.salaryType,
      experience,
      job_type: jobType,
      status,
      city,
      state,
      country,
      address,
      zip_code: zipCode,
      qualification,
      skills,
      website,
      email,
      phone
    };

    Object.entries(map).forEach(([column, val]) => {
      if (val !== undefined) {
        updates.push(`${column} = ?`);
        values.push(val === '' ? null : val);
      }
    });

    if (noOfVacancy !== undefined) {
      const vacancies = Number(noOfVacancy) > 0 ? Number(noOfVacancy) : 1;
      updates.push('no_of_vacancy = ?');
      values.push(vacancies);
    }

    if (!updates.length) {
      return res.status(400).json({ message: 'No updates provided.' });
    }

    updates.push('updated_at = CURRENT_TIMESTAMP');

    await query(
      `UPDATE jobs SET ${updates.join(', ')} WHERE id = ?`,
      [...values, id]
    );

    const job = await fetchJobById(id);
    res.json({ message: 'Job updated successfully', job });
  } catch (err) {
    return next(err);
  }
});

// Delete job
router.delete('/jobs/:id', authenticate, authenticateAdmin, async (req, res, next) => {
  try {
    const { id } = req.params;
    const result = await query('DELETE FROM jobs WHERE id = ?', [id]);
    if (!result.affectedRows) {
      return res.status(404).json({ message: 'Job not found.' });
    }
    res.json({ message: 'Job deleted successfully' });
  } catch (err) {
    return next(err);
  }
});

// Get dashboard statistics
router.get('/stats', authenticate, authenticateAdmin, async (req, res, next) => {
  try {
    const [candidatesResult] = await query('SELECT COUNT(*) as count FROM users WHERE role = "seeker"');
    const [employersResult] = await query('SELECT COUNT(*) as count FROM users WHERE role = "provider"');
    const [jobsResult] = await query('SELECT COUNT(*) as count FROM jobs');
    const [applicationsResult] = await query('SELECT COUNT(*) as count FROM applications');
    
    // Get premium members count
    let premiumMembersCount = 0;
    let monthlyEarnings = 0;
    try {
      const [premiumResult] = await query('SELECT COUNT(*) as count FROM premium_memberships WHERE status = "active"');
      premiumMembersCount = premiumResult?.count || 0;
      
      // Calculate monthly earnings
      const currentMonth = new Date().getMonth() + 1;
      const currentYear = new Date().getFullYear();
      const earningsResult = await query(`
        SELECT SUM(price) as total 
        FROM premium_memberships 
        WHERE status = "active" 
        AND MONTH(start_date) = ? 
        AND YEAR(start_date) = ?
      `, [currentMonth, currentYear]);
      monthlyEarnings = earningsResult[0]?.total || 0;
    } catch (premiumErr) {
      console.error('Error fetching premium stats:', premiumErr);
      // Continue with 0 values if premium_memberships table doesn't exist
    }
    
    const stats = {
      totalCandidates: candidatesResult.count,
      totalEmployers: employersResult.count,
      totalJobs: jobsResult.count,
      totalApplications: applicationsResult.count,
      premiumMembers: premiumMembersCount,
      monthlyEarnings: monthlyEarnings,
      annualEarnings: 4799.76 // Mock data
    };
    
    res.json({ stats });
  } catch (err) {
    return next(err);
  }
});

// Get job applications for a specific job
router.get('/jobs/:jobId/applications', authenticate, authenticateAdmin, async (req, res, next) => {
  try {
    const { jobId } = req.params;
    const applications = await query(
      `
        SELECT 
          a.id,
          a.created_at,
          a.status,
          COALESCE(u.full_name, a.name) AS full_name,
          COALESCE(u.email, a.email) AS email,
          COALESCE(u.phone, a.phone) AS phone,
          u.experience
        FROM applications a
        LEFT JOIN users u ON a.seeker_id = u.id
        WHERE a.job_id = ?
        ORDER BY a.created_at DESC
      `,
      [jobId]
    );
    
    res.json({ applications });
  } catch (err) {
    return next(err);
  }
});

// Update job status
router.patch('/jobs/:jobId/status', authenticate, authenticateAdmin, async (req, res, next) => {
  try {
    const { jobId } = req.params;
    const { status } = req.body;
    
    await query('UPDATE jobs SET status = ? WHERE id = ?', [status, jobId]);
    res.json({ message: 'Job status updated successfully' });
  } catch (err) {
    return next(err);
  }
});

// Deactivate user
router.patch('/users/:userId/deactivate', authenticate, authenticateAdmin, async (req, res, next) => {
  try {
    const { userId } = req.params;
    await query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS is_active TINYINT(1) NOT NULL DEFAULT 1`);
    await query(`UPDATE users SET is_active = 0 WHERE id = ?`, [userId]);
    res.json({ message: 'User deactivated successfully' });
  } catch (err) {
    return next(err);
  }
});

// Update candidate
router.put('/candidates/:id', authenticate, authenticateAdmin, async (req, res, next) => {
  try {
    const { id } = req.params;
    const {
      full_name,
      email,
      phone,
      experience,
      categoryId,
      subcategoryId,
    } = req.body;

    const catId = categoryId ?? req.body.registration_category_id ?? null;
    const subId = subcategoryId ?? req.body.registration_subcategory_id ?? null;

    if (catId || subId) {
      const { validateCategoryPair } = require('../utils/categoryValidation');
      const categoryCheck = await validateCategoryPair(catId, subId, {
        requirePair: !!(catId || subId),
      });
      if (!categoryCheck.ok) {
        return res.status(400).json({ message: categoryCheck.message });
      }
    }

    const result = await query(
      `UPDATE users SET full_name = ?, email = ?, phone = ?, experience = ?,
        category_id = ?, subcategory_id = ?
       WHERE id = ? AND role = "seeker"`,
      [
        full_name,
        email,
        phone,
        experience,
        catId || null,
        subId || null,
        id,
      ]
    );
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Candidate not found' });
    }
    
    res.json({ message: 'Candidate updated successfully' });
  } catch (err) {
    console.error('Error updating candidate:', err);
    return next(err);
  }
});

// Update employer
router.put('/employers/:id', authenticate, authenticateAdmin, async (req, res, next) => {
  try {
    const { id } = req.params;
    const { full_name, email, phone } = req.body;
    
    const result = await query(
      'UPDATE users SET full_name = ?, email = ?, phone = ? WHERE id = ? AND role = "provider"',
      [full_name, email, phone, id]
    );
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Employer not found' });
    }
    
    res.json({ message: 'Employer updated successfully' });
  } catch (err) {
    console.error('Error updating employer:', err);
    return next(err);
  }
});

// Verify/unverify user account
router.patch('/users/:userId/verify', authenticate, authenticateAdmin, async (req, res, next) => {
  try {
    const { userId } = req.params;
    const { verified } = req.body;
    await query(`UPDATE users SET is_verified = ? WHERE id = ?`, [verified ? 1 : 0, userId]);
    res.json({ message: 'User verification status updated' });
  } catch (err) {
    return next(err);
  }
});

// Approve employer company profile
router.patch('/employers/:id/approve', authenticate, authenticateAdmin, async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({ message: 'Invalid employer id' });
    }

    const users = await query(
      `SELECT id FROM users WHERE id = ? AND role = 'provider' LIMIT 1`,
      [id]
    );
    if (!users.length) {
      return res.status(404).json({ message: 'Employer not found' });
    }

    // Ensure profile row exists, then mark verified (same column used by employers list).
    const existing = await query(
      `SELECT id FROM employer_profiles WHERE user_id = ? LIMIT 1`,
      [id]
    );
    if (existing.length) {
      await query(`UPDATE employer_profiles SET is_verified = 1 WHERE user_id = ?`, [id]);
    } else {
      await query(
        `INSERT INTO employer_profiles (user_id, is_verified) VALUES (?, 1)`,
        [id]
      );
    }

    res.json({ message: 'Employer company approved' });
  } catch (err) {
    return next(err);
  }
});

// Moderate job status (approve/reject/expire)
router.patch('/jobs/:jobId/moderate', authenticate, authenticateAdmin, async (req, res, next) => {
  try {
    const { jobId } = req.params;
    const { status } = req.body; // expected: 'active' | 'inactive' | 'closed'
    await query(`UPDATE jobs SET status = ? WHERE id = ?`, [status, jobId]);
    res.json({ message: 'Job status updated' });
  } catch (err) {
    return next(err);
  }
});

// Delete candidate
router.delete('/candidates/:id', authenticate, authenticateAdmin, async (req, res, next) => {
  try {
    const { id } = req.params;
    
    const result = await query('DELETE FROM users WHERE id = ? AND role = "seeker"', [id]);
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Candidate not found' });
    }
    
    res.json({ message: 'Candidate deleted successfully' });
  } catch (err) {
    console.error('Error deleting candidate:', err);
    return next(err);
  }
});

// Delete employer
router.delete('/employers/:id', authenticate, authenticateAdmin, async (req, res, next) => {
  try {
    const { id } = req.params;
    
    const result = await query('DELETE FROM users WHERE id = ? AND role = "provider"', [id]);
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Employer not found' });
    }
    
    res.json({ message: 'Employer deleted successfully' });
  } catch (err) {
    console.error('Error deleting employer:', err);
    return next(err);
  }
});

// Create sponsorship content
router.post('/sponsorship', authenticate, authenticateAdmin, upload.single('image'), async (req, res, next) => {
  try {
    const { title, description, company, link, priority } = req.body;
    const imagePath = req.file ? req.file.path : null;
    
    // Create sponsorship_content table if it doesn't exist
    await query(`
      CREATE TABLE IF NOT EXISTS sponsorship_content (
        id INT AUTO_INCREMENT PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        description TEXT NOT NULL,
        company VARCHAR(255) NOT NULL,
        image_path VARCHAR(500),
        link VARCHAR(500),
        priority ENUM('normal', 'high', 'urgent') DEFAULT 'normal',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);
    
    const result = await query(
      'INSERT INTO sponsorship_content (title, description, company, image_path, link, priority) VALUES (?, ?, ?, ?, ?, ?)',
      [title, description, company, imagePath, link, priority]
    );
    
    res.json({ 
      message: 'Sponsorship content created successfully', 
      content: { id: result.insertId, title, description, company, imagePath, link, priority }
    });
  } catch (err) {
    console.error('Error creating sponsorship content:', err);
    return next(err);
  }
});

// Get sponsorship content (admin only)
router.get('/sponsorship', authenticate, authenticateAdmin, async (req, res, next) => {
  try {
    // Create table if it doesn't exist
    await query(`
      CREATE TABLE IF NOT EXISTS sponsorship_content (
        id INT AUTO_INCREMENT PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        description TEXT NOT NULL,
        company VARCHAR(255) NOT NULL,
        image_path VARCHAR(500),
        link VARCHAR(500),
        priority ENUM('normal', 'high', 'urgent') DEFAULT 'normal',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);
    
    const content = await query('SELECT * FROM sponsorship_content ORDER BY priority DESC, created_at DESC');
    res.json({ content });
  } catch (err) {
    console.error('Error fetching sponsorship content:', err);
    return next(err);
  }
});

// Public endpoint to get sponsorship content for homepage
router.get('/public/sponsorship', async (req, res, next) => {
  try {
    // Create table if it doesn't exist
    await query(`
      CREATE TABLE IF NOT EXISTS sponsorship_content (
        id INT AUTO_INCREMENT PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        description TEXT NOT NULL,
        company VARCHAR(255) NOT NULL,
        image_path VARCHAR(500),
        link VARCHAR(500),
        priority ENUM('normal', 'high', 'urgent') DEFAULT 'normal',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);
    
    const content = await query('SELECT * FROM sponsorship_content ORDER BY priority DESC, created_at DESC LIMIT 5');
    res.json({ content });
  } catch (err) {
    console.error('Error fetching public sponsorship content:', err);
    return next(err);
  }
});

// Get premium members
router.get('/premium-members', authenticate, authenticateAdmin, async (req, res, next) => {
  try {
    const members = await query(`
      SELECT 
        pm.id,
        pm.membership_type,
        pm.status,
        pm.start_date,
        pm.end_date,
        pm.price,
        pm.payment_method,
        pm.transaction_id,
        pm.created_at,
        u.id as user_id,
        u.full_name,
        u.email,
        u.phone,
        u.role
      FROM premium_memberships pm
      JOIN users u ON u.id = pm.user_id
      ORDER BY pm.created_at DESC
    `);
    
    // Map database fields to frontend expected format
    const premiumMembers = members.map(member => ({
      id: member.id,
      full_name: member.full_name || 'N/A',
      email: member.email || 'N/A',
      phone: member.phone || null,
      role: member.role || 'seeker',
      membership_type: member.membership_type || 'basic',
      membership_start_date: member.start_date || member.created_at,
      membership_end_date: member.end_date || null,
      membership_status: member.status || 'active',
      amount_paid: member.price || 0
    }));
    
    res.json({ premiumMembers });
  } catch (err) {
    console.error('Error fetching premium members:', err);
    // If table doesn't exist, return empty array instead of error
    if (err.code === 'ER_NO_SUCH_TABLE') {
      return res.json({ premiumMembers: [] });
    }
    return next(err);
  }
});

// Get payment history
router.get('/payments', authenticate, authenticateAdmin, async (req, res, next) => {
  try {
    const { page = 1, limit = 20, status, type, q } = req.query;
    const offset = (page - 1) * limit;
    
    let whereClause = '';
    let params = [];
    
    const conditions = [];
    if (status) { conditions.push('p.status = ?'); params.push(status); }
    if (type) { conditions.push('p.payment_type = ?'); params.push(type); }
    if (q) { conditions.push('(p.description LIKE ? OR u.full_name LIKE ? OR u.email LIKE ?)'); params.push(`%${q}%`, `%${q}%`, `%${q}%`); }
    if (conditions.length > 0) whereClause = 'WHERE ' + conditions.join(' AND ');
    
    const payments = await query(`
      SELECT 
        p.id,
        p.amount,
        p.currency,
        p.payment_method,
        p.transaction_id,
        p.status,
        p.payment_type,
        p.description,
        p.metadata,
        p.created_at,
        u.id as user_id,
        u.full_name,
        u.email,
        u.role,
        pm.membership_type
      FROM payments p
      JOIN users u ON u.id = p.user_id
      LEFT JOIN premium_memberships pm ON pm.id = p.membership_id
      ${whereClause}
      ORDER BY p.created_at DESC
      LIMIT ? OFFSET ?
    `, [...params, parseInt(limit), parseInt(offset)]);
    
    const totalCount = await query(`
      SELECT COUNT(*) as count
      FROM payments p
      ${whereClause}
    `, params);
    
    res.json({
      payments,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: totalCount[0].count,
        pages: Math.ceil(totalCount[0].count / limit)
      }
    });
  } catch (err) {
    console.error('Error fetching payments:', err);
    return next(err);
  }
});

// Analytics payments (employer analytics reports)
router.get('/analytics-payments', authenticate, authenticateAdmin, async (req, res, next) => {
  try {
    const { page = 1, limit = 50 } = req.query;
    const offset = (page - 1) * limit;
    const metadataFilter = `%\"featureKey\":\"${ANALYTICS_FEATURE_KEY}\"%`;

    const paymentsRaw = await query(`
      SELECT 
        p.id,
        p.amount,
        p.currency,
        p.payment_method,
        p.transaction_id,
        p.status,
        p.payment_type,
        p.description,
        p.metadata,
        p.created_at,
        u.id as user_id,
        u.full_name,
        u.email,
        u.role
      FROM payments p
      JOIN users u ON u.id = p.user_id
      WHERE p.metadata LIKE ?
      ORDER BY p.created_at DESC
      LIMIT ? OFFSET ?
    `, [metadataFilter, parseInt(limit), parseInt(offset)]);

    const payments = paymentsRaw.map((payment) => ({
      ...payment,
      metadata: safeParseMetadata(payment.metadata)
    }));

    const statsRows = await query(`
      SELECT
        COUNT(*) as total_transactions,
        SUM(CASE WHEN status = 'completed' THEN amount ELSE 0 END) as completed_revenue,
        SUM(CASE WHEN status = 'pending' THEN amount ELSE 0 END) as pending_revenue,
        MAX(created_at) as last_payment_at
      FROM payments
      WHERE metadata LIKE ?
    `, [metadataFilter]);

    const totalCount = await query(`
      SELECT COUNT(*) as count
      FROM payments
      WHERE metadata LIKE ?
    `, [metadataFilter]);

    const topEmployers = await query(`
      SELECT 
        u.id,
        u.full_name,
        u.email,
        COUNT(*) as purchases,
        SUM(p.amount) as revenue,
        MAX(p.created_at) as last_payment_at
      FROM payments p
      JOIN users u ON u.id = p.user_id
      WHERE p.metadata LIKE ?
      GROUP BY u.id, u.full_name, u.email
      ORDER BY revenue DESC
      LIMIT 5
    `, [metadataFilter]);

    res.json({
      stats: statsRows[0] || {
        total_transactions: 0,
        completed_revenue: 0,
        pending_revenue: 0,
        last_payment_at: null
      },
      payments,
      topEmployers,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: totalCount[0].count,
        pages: Math.ceil(totalCount[0].count / limit)
      }
    });
  } catch (err) {
    console.error('Error fetching analytics payments:', err);
    return next(err);
  }
});

// Get financial analytics (monthly, quarterly, yearly earnings)
router.get('/finance/analytics', authenticate, authenticateAdmin, async (req, res, next) => {
  try {
    const { period = 'monthly' } = req.query; // monthly, quarterly, yearly
    
    let dateFormat, groupBy;
    if (period === 'monthly') {
      dateFormat = '%Y-%m';
      groupBy = 'YEAR(p.created_at), MONTH(p.created_at)';
    } else if (period === 'quarterly') {
      dateFormat = '%Y-Q%q';
      groupBy = 'YEAR(p.created_at), QUARTER(p.created_at)';
    } else {
      dateFormat = '%Y';
      groupBy = 'YEAR(p.created_at)';
    }

    // Earnings by period
    const earningsByPeriod = await query(`
      SELECT 
        DATE_FORMAT(p.created_at, ?) as period,
        SUM(CASE WHEN p.status = 'completed' THEN p.amount ELSE 0 END) as total_earnings,
        COUNT(CASE WHEN p.status = 'completed' THEN 1 END) as completed_count,
        COUNT(CASE WHEN p.status = 'pending' THEN 1 END) as pending_count,
        COUNT(CASE WHEN p.status = 'failed' THEN 1 END) as failed_count
      FROM payments p
      WHERE p.status IN ('completed', 'pending', 'failed')
      GROUP BY ${groupBy}
      ORDER BY p.created_at DESC
      LIMIT 12
    `, [dateFormat]);

    // Earnings by payment type
    const earningsByType = await query(`
      SELECT 
        p.payment_type,
        SUM(CASE WHEN p.status = 'completed' THEN p.amount ELSE 0 END) as total_earnings,
        COUNT(CASE WHEN p.status = 'completed' THEN 1 END) as count
      FROM payments p
      WHERE p.status = 'completed'
      GROUP BY p.payment_type
    `);

    // Earnings by user role
    const earningsByRole = await query(`
      SELECT 
        u.role,
        SUM(CASE WHEN p.status = 'completed' THEN p.amount ELSE 0 END) as total_earnings,
        COUNT(CASE WHEN p.status = 'completed' THEN 1 END) as count
      FROM payments p
      JOIN users u ON u.id = p.user_id
      WHERE p.status = 'completed'
      GROUP BY u.role
    `);

    // Monthly breakdown for the last 12 months
    const monthlyBreakdown = await query(`
      SELECT 
        DATE_FORMAT(p.created_at, '%Y-%m') as month,
        SUM(CASE WHEN p.status = 'completed' THEN p.amount ELSE 0 END) as earnings,
        COUNT(CASE WHEN p.status = 'completed' THEN 1 END) as transactions
      FROM payments p
      WHERE p.created_at >= DATE_SUB(NOW(), INTERVAL 12 MONTH)
        AND p.status = 'completed'
      GROUP BY DATE_FORMAT(p.created_at, '%Y-%m')
      ORDER BY month ASC
    `);

    // Quarterly breakdown for the last 4 quarters
    const quarterlyBreakdown = await query(`
      SELECT 
        CONCAT(YEAR(p.created_at), '-Q', QUARTER(p.created_at)) as quarter,
        SUM(CASE WHEN p.status = 'completed' THEN p.amount ELSE 0 END) as earnings,
        COUNT(CASE WHEN p.status = 'completed' THEN 1 END) as transactions
      FROM payments p
      WHERE p.created_at >= DATE_SUB(NOW(), INTERVAL 12 MONTH)
        AND p.status = 'completed'
      GROUP BY YEAR(p.created_at), QUARTER(p.created_at)
      ORDER BY YEAR(p.created_at) ASC, QUARTER(p.created_at) ASC
    `);

    // Yearly breakdown
    const yearlyBreakdown = await query(`
      SELECT 
        YEAR(p.created_at) as year,
        SUM(CASE WHEN p.status = 'completed' THEN p.amount ELSE 0 END) as earnings,
        COUNT(CASE WHEN p.status = 'completed' THEN 1 END) as transactions
      FROM payments p
      WHERE p.status = 'completed'
      GROUP BY YEAR(p.created_at)
      ORDER BY year ASC
    `);

    res.json({
      earningsByPeriod: earningsByPeriod || [],
      earningsByType: earningsByType || [],
      earningsByRole: earningsByRole || [],
      monthlyBreakdown: monthlyBreakdown || [],
      quarterlyBreakdown: quarterlyBreakdown || [],
      yearlyBreakdown: yearlyBreakdown || []
    });
  } catch (err) {
    console.error('Error fetching financial analytics:', err);
    if (err.code === 'ER_NO_SUCH_TABLE') {
      return res.json({
        earningsByPeriod: [],
        earningsByType: [],
        earningsByRole: [],
        monthlyBreakdown: [],
        quarterlyBreakdown: [],
        yearlyBreakdown: []
      });
    }
    return next(err);
  }
});

// Get payment statistics
router.get('/payment-stats', authenticate, authenticateAdmin, async (req, res, next) => {
  try {
    const stats = await query(`
      SELECT 
        COUNT(*) as total_payments,
        SUM(CASE WHEN status = 'completed' THEN amount ELSE 0 END) as total_revenue,
        SUM(CASE WHEN status = 'completed' AND payment_type = 'membership' THEN amount ELSE 0 END) as membership_revenue,
        SUM(CASE WHEN status = 'completed' AND payment_type = 'resume_download' THEN amount ELSE 0 END) as download_revenue,
        COUNT(CASE WHEN status = 'completed' THEN 1 END) as successful_payments,
        COUNT(CASE WHEN status = 'failed' THEN 1 END) as failed_payments,
        COUNT(CASE WHEN payment_type = 'membership' THEN 1 END) as membership_payments,
        COUNT(CASE WHEN payment_type = 'resume_download' THEN 1 END) as download_payments
      FROM payments
    `);
    
    const monthlyStats = await query(`
      SELECT 
        DATE_FORMAT(created_at, '%Y-%m') as month,
        COUNT(*) as payments_count,
        SUM(CASE WHEN status = 'completed' THEN amount ELSE 0 END) as revenue
      FROM payments
      WHERE created_at >= DATE_SUB(NOW(), INTERVAL 12 MONTH)
      GROUP BY DATE_FORMAT(created_at, '%Y-%m')
      ORDER BY month DESC
    `);
    
    res.json({
      overall: stats[0],
      monthly: monthlyStats
    });
  } catch (err) {
    console.error('Error fetching payment stats:', err);
    return next(err);
  }
});

// Get download statistics
router.get('/download-stats', authenticate, authenticateAdmin, async (req, res, next) => {
  try {
    const stats = await query(`
      SELECT 
        COUNT(*) as total_downloads,
        COUNT(DISTINCT employer_id) as unique_employers,
        COUNT(DISTINCT DATE(download_date)) as active_days
      FROM download_tracking
    `);
    
    const dailyStats = await query(`
      SELECT 
        download_date,
        COUNT(*) as downloads_count,
        COUNT(DISTINCT employer_id) as employers_count
      FROM download_tracking
      WHERE download_date >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)
      GROUP BY download_date
      ORDER BY download_date DESC
    `);
    
    const employerStats = await query(`
      SELECT 
        u.full_name,
        u.email,
        COUNT(dt.id) as total_downloads,
        MAX(dt.download_date) as last_download
      FROM download_tracking dt
      JOIN users u ON u.id = dt.employer_id
      GROUP BY dt.employer_id, u.full_name, u.email
      ORDER BY total_downloads DESC
      LIMIT 10
    `);
    
    res.json({
      overall: stats[0],
      daily: dailyStats,
      topEmployers: employerStats
    });
  } catch (err) {
    console.error('Error fetching download stats:', err);
    return next(err);
  }
});

// Boolean search usage report
router.get('/reports/boolean-search-usage', authenticate, authenticateAdmin, async (req, res, next) => {
  try {
    const summary = await query(`
      SELECT 
        COUNT(*) as employers_with_trial,
        SUM(CASE WHEN has_used_pro_trial = 1 THEN 1 ELSE 0 END) as trials_used
      FROM boolean_search_usage
    `);

    const saved = await query(`
      SELECT COUNT(*) as saved_searches FROM saved_searches
    `);

    res.json({
      summary: summary[0] || { employers_with_trial: 0, trials_used: 0 },
      savedSearches: saved[0]?.saved_searches || 0
    });
  } catch (err) {
    return next(err);
  }
});

// Resume scoring usage report
router.get('/reports/resume-scoring-usage', authenticate, authenticateAdmin, async (req, res, next) => {
  try {
    const overall = await query(`
      SELECT COUNT(*) as total_usages, COUNT(DISTINCT employer_id) as unique_employers FROM resume_scoring_usage
    `);

    const daily = await query(`
      SELECT usage_date, COUNT(*) as count, COUNT(DISTINCT employer_id) as employers
      FROM resume_scoring_usage
      WHERE usage_date >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)
      GROUP BY usage_date
      ORDER BY usage_date DESC
    `);

    res.json({ overall: overall[0], daily });
  } catch (err) {
    return next(err);
  }
});

// Referral report
router.get('/reports/referrals', authenticate, authenticateAdmin, async (req, res, next) => {
  try {
    const stats = await query(`
      SELECT 
        COUNT(*) as total_events,
        SUM(CASE WHEN status = 'registered' THEN 1 ELSE 0 END) as registrations
      FROM referrals
    `);

    const topEmployers = await query(`
      SELECT u.full_name, u.email, COUNT(r.id) as total,
             SUM(CASE WHEN r.status = 'registered' THEN 1 ELSE 0 END) as registered
      FROM referrals r
      JOIN users u ON u.id = r.employer_id
      GROUP BY r.employer_id, u.full_name, u.email
      ORDER BY registered DESC, total DESC
      LIMIT 20
    `);

    res.json({ summary: stats[0], topEmployers });
  } catch (err) {
    return next(err);
  }
});

// Registration statistics (monthly) for candidates and employers (last 12 months)
router.get('/registration-stats', authenticate, authenticateAdmin, async (req, res, next) => {
  try {
    const candidateMonthly = await query(`
      SELECT 
        DATE_FORMAT(created_at, '%Y-%m') as month,
        COUNT(*) as count
      FROM users
      WHERE role = 'seeker' AND created_at >= DATE_SUB(NOW(), INTERVAL 12 MONTH)
      GROUP BY DATE_FORMAT(created_at, '%Y-%m')
      ORDER BY month ASC
    `);
    const employerMonthly = await query(`
      SELECT 
        DATE_FORMAT(created_at, '%Y-%m') as month,
        COUNT(*) as count
      FROM users
      WHERE role = 'provider' AND created_at >= DATE_SUB(NOW(), INTERVAL 12 MONTH)
      GROUP BY DATE_FORMAT(created_at, '%Y-%m')
      ORDER BY month ASC
    `);
    res.json({ candidates: candidateMonthly, employers: employerMonthly });
  } catch (err) {
    return next(err);
  }
});

// -------- Analytics & Reports --------
// User growth (daily for last 30 days)
router.get('/reports/user-growth', authenticate, authenticateAdmin, async (req, res, next) => {
  try {
    const seekers = await query(`
      SELECT DATE(created_at) as day, COUNT(*) as count
      FROM users
      WHERE role = 'seeker' AND created_at >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)
      GROUP BY DATE(created_at)
      ORDER BY day ASC
    `);
    const providers = await query(`
      SELECT DATE(created_at) as day, COUNT(*) as count
      FROM users
      WHERE role = 'provider' AND created_at >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)
      GROUP BY DATE(created_at)
      ORDER BY day ASC
    `);
    res.json({ seekers, providers });
  } catch (err) {
    return next(err);
  }
});

// Job posting trends (daily for last 30 days)
router.get('/reports/job-trends', authenticate, authenticateAdmin, async (req, res, next) => {
  try {
    const rows = await query(`
      SELECT DATE(created_at) as day, COUNT(*) as count
      FROM jobs
      WHERE created_at >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)
      GROUP BY DATE(created_at)
      ORDER BY day ASC
    `);
    res.json({ jobs: rows });
  } catch (err) {
    return next(err);
  }
});

// Employer subscription usage (active memberships by type)
router.get('/reports/subscription-usage', authenticate, authenticateAdmin, async (req, res, next) => {
  try {
    const summary = await query(`
      SELECT membership_type, COUNT(*) as count
      FROM premium_memberships
      WHERE status = 'active' AND (end_date IS NULL OR end_date > NOW())
      GROUP BY membership_type
    `);
    res.json({ summary });
  } catch (err) {
    return next(err);
  }
});

// Application success metrics
router.get('/reports/application-metrics', authenticate, authenticateAdmin, async (req, res, next) => {
  try {
    const byStatus = await query(`
      SELECT status, COUNT(*) as count
      FROM applications
      GROUP BY status
    `);
    const perJob = await query(`
      SELECT j.id as job_id, j.title as job_title, COUNT(a.id) as applications
      FROM jobs j
      LEFT JOIN applications a ON a.job_id = j.id
      GROUP BY j.id, j.title
      ORDER BY applications DESC
      LIMIT 50
    `);
    res.json({ byStatus, perJob });
  } catch (err) {
    return next(err);
  }
});

// CSV export endpoints
router.get('/reports/export/:type.csv', authenticate, authenticateAdmin, async (req, res, next) => {
  try {
    const { type } = req.params;
    let rows = [];
    if (type === 'user-growth') {
      rows = await query(`
        SELECT DATE(created_at) as day, role, COUNT(*) as count
        FROM users
        WHERE created_at >= DATE_SUB(CURDATE(), INTERVAL 365 DAY)
        GROUP BY DATE(created_at), role
        ORDER BY day ASC
      `);
    } else if (type === 'job-trends') {
      rows = await query(`
        SELECT DATE(created_at) as day, COUNT(*) as jobs
        FROM jobs
        WHERE created_at >= DATE_SUB(CURDATE(), INTERVAL 365 DAY)
        GROUP BY DATE(created_at)
        ORDER BY day ASC
      `);
    } else if (type === 'subscriptions') {
      rows = await query(`
        SELECT membership_type, status, COUNT(*) as count
        FROM premium_memberships
        GROUP BY membership_type, status
      `);
    } else if (type === 'payments') {
      rows = await query(`
        SELECT DATE(created_at) as day, SUM(CASE WHEN status='completed' THEN amount ELSE 0 END) as revenue, COUNT(*) as payments
        FROM payments
        WHERE created_at >= DATE_SUB(CURDATE(), INTERVAL 365 DAY)
        GROUP BY DATE(created_at)
        ORDER BY day ASC
      `);
    } else if (type === 'applications') {
      rows = await query(`
        SELECT status, COUNT(*) as count
        FROM applications
        GROUP BY status
      `);
    } else {
      return res.status(400).send('Unknown export type');
    }
    // Format CSV
    if (!rows || rows.length === 0) {
      res.setHeader('Content-Type', 'text/csv');
      return res.send('message,No data');
    }
    const headers = Object.keys(rows[0]);
    const csv = [headers.join(','), ...rows.map(r => headers.map(h => `"${(r[h] ?? '').toString().replace(/"/g, '""')}"`).join(','))].join('\n');
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="${type}.csv"`);
    return res.send(csv);
  } catch (err) {
    return next(err);
  }
});

// -------- Settings & Configuration --------
// Get settings (admin)
router.get('/settings', authenticate, authenticateAdmin, async (req, res, next) => {
  try {
    const rows = await query(`SELECT * FROM site_settings WHERE id = 1 LIMIT 1`);
    res.json({ settings: rows[0] || null });
  } catch (err) {
    return next(err);
  }
});

// Update settings (admin)
router.put('/settings', authenticate, authenticateAdmin, async (req, res, next) => {
  try {
    const s = req.body || {};
    const fields = [
      'site_name','logo_url','contact_email','contact_phone',
      'smtp_host','smtp_port','smtp_user','smtp_secure',
      'payment_provider','payment_public_key','payment_secret_key',
      'seo_meta_title','seo_meta_description','seo_meta_image',
      'social_twitter','social_facebook',
      'job_alert_frequency','upload_max_mb','upload_allowed_types'
    ];
    const updates = [];
    const params = [];
    for (const f of fields) {
      if (typeof s[f] !== 'undefined') {
        updates.push(`${f} = ?`);
        params.push(s[f]);
      }
    }
    if (updates.length === 0) return res.status(400).json({ message: 'No settings to update' });
    params.push(1);
    await query(`UPDATE site_settings SET ${updates.join(', ')} WHERE id = ?`, params);
    const rows = await query(`SELECT * FROM site_settings WHERE id = 1`);
    res.json({ message: 'Settings updated', settings: rows[0] });
  } catch (err) {
    return next(err);
  }
});

// Public settings (subset) for website consumption
router.get('/public/settings', async (req, res, next) => {
  try {
    const rows = await query(`SELECT site_name, logo_url, seo_meta_title, seo_meta_description, seo_meta_image FROM site_settings WHERE id = 1`);
    res.json({ settings: rows[0] || null });
  } catch (err) {
    return next(err);
  }
});

// ===========================================================================
// Unified User Management (spec section 4)
// NOTE: declare /users/stats BEFORE /users/:id so the static path isn't captured.
// ===========================================================================

router.get('/users/stats', authenticate, authenticateAdmin, async (req, res, next) => {
  try {
    const [row] = await query(`
      SELECT
        (SELECT COUNT(*) FROM users) AS total_users,
        (SELECT COUNT(*) FROM users WHERE role = 'seeker') AS candidates,
        (SELECT COUNT(*) FROM users WHERE role = 'provider') AS employers,
        (SELECT COUNT(DISTINCT uc.user_id) FROM user_categories uc JOIN categories c ON c.id = uc.category_id WHERE c.type = 'technical') AS technical_users,
        (SELECT COUNT(DISTINCT uc.user_id) FROM user_categories uc JOIN categories c ON c.id = uc.category_id WHERE c.type = 'non_technical') AS non_technical_users
    `);
    res.json({ stats: row });
  } catch (err) { return next(err); }
});

router.get('/users', authenticate, authenticateAdmin, async (req, res, next) => {
  try {
    const q = String(req.query.q || '').trim();
    const role = req.query.role; // seeker | provider
    const status = req.query.status; // active | suspended
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 25));
    const offset = (page - 1) * limit;

    let where = 'WHERE 1=1';
    const params = [];
    if (q) { where += ' AND (full_name LIKE ? OR email LIKE ? OR phone LIKE ?)'; const like = `%${q}%`; params.push(like, like, like); }
    if (role === 'seeker' || role === 'provider') { where += ' AND role = ?'; params.push(role); }
    if (status === 'active' || status === 'suspended') { where += ' AND account_status = ?'; params.push(status); }

    const users = await query(
      `SELECT id, role, full_name, email, phone, account_status, profile_completion, resume_status,
              last_login, created_at
       FROM users ${where}
       ORDER BY created_at DESC
       LIMIT ? OFFSET ?`,
      [...params, limit, offset]
    );
    const [totalRow] = await query(`SELECT COUNT(*) AS count FROM users ${where}`, params);

    res.json({ users, pagination: { page, limit, total: Number(totalRow.count) || 0 } });
  } catch (err) { return next(err); }
});

router.get('/users/:id', authenticate, authenticateAdmin, async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const [u] = await query(
      `SELECT id, role, full_name, email, phone, account_status, profile_completion,
              resume_status, resume_url, preferred_language, last_login, created_at
       FROM users WHERE id = ?`,
      [id]
    );
    if (!u) return res.status(404).json({ message: 'User not found' });

    const [profile] = await query('SELECT * FROM user_profiles WHERE user_id = ?', [id]);
    let categories = { categories: [], subcategories: [] };
    try { categories = await getUserCategories(id); } catch (_) {}

    res.json({ user: u, profile: profile || null, categories: categories.categories, subcategories: categories.subcategories });
  } catch (err) { return next(err); }
});

router.patch('/users/:id/status', authenticate, authenticateAdmin, async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const status = req.body.status === 'suspended' ? 'suspended' : 'active';
    const result = await query('UPDATE users SET account_status = ? WHERE id = ?', [status, id]);
    if (!result.affectedRows) return res.status(404).json({ message: 'User not found' });
    auditFromReq(req, status === 'suspended' ? 'user.suspend' : 'user.activate', { entity: 'user', entityId: id });
    res.json({ message: `User ${status === 'suspended' ? 'suspended' : 'activated'}` });
  } catch (err) { return next(err); }
});

router.delete('/users/:id', authenticate, authenticateAdmin, async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const result = await query('DELETE FROM users WHERE id = ?', [id]);
    if (!result.affectedRows) return res.status(404).json({ message: 'User not found' });
    auditFromReq(req, 'user.delete', { entity: 'user', entityId: id });
    res.json({ message: 'User deleted' });
  } catch (err) { return next(err); }
});

// Recent audit log entries
router.get('/audit-logs', authenticate, authenticateAdmin, async (req, res, next) => {
  try {
    const limit = Math.min(200, Math.max(1, Number(req.query.limit) || 100));
    const rows = await query(
      `SELECT a.*, u.full_name AS actor_name FROM audit_logs a
       LEFT JOIN users u ON u.id = a.user_id
       ORDER BY a.created_at DESC LIMIT ?`,
      [limit]
    );
    res.json({ logs: rows });
  } catch (err) { return next(err); }
});

module.exports = router;

// -------- Promotions --------
router.get('/promotions', authenticate, authenticateAdmin, async (req, res, next) => {
  try {
    const rows = await query(`SELECT * FROM promotions ORDER BY priority DESC, created_at DESC`);
    res.json({ promotions: rows });
  } catch (err) { return next(err); }
});
router.post('/promotions', authenticate, authenticateAdmin, async (req, res, next) => {
  try {
    const { item_type, item_id, priority = 0, is_active = 1, starts_at = null, ends_at = null } = req.body;
    await query(`INSERT INTO promotions (item_type, item_id, priority, is_active, starts_at, ends_at) VALUES (?,?,?,?,?,?)`,
      [item_type, item_id, priority, is_active ? 1 : 0, starts_at, ends_at]);
    res.json({ message: 'Promotion created' });
  } catch (err) { return next(err); }
});
router.put('/promotions/:id', authenticate, authenticateAdmin, async (req, res, next) => {
  try {
    const { id } = req.params;
    const allowed = ['item_type','item_id','priority','is_active','starts_at','ends_at'];
    const updates = []; const params = [];
    for (const k of allowed) if (typeof req.body[k] !== 'undefined') { updates.push(`${k} = ?`); params.push(req.body[k]); }
    if (!updates.length) return res.status(400).json({ message: 'No updates' });
    params.push(id);
    await query(`UPDATE promotions SET ${updates.join(', ')} WHERE id = ?`, params);
    res.json({ message: 'Promotion updated' });
  } catch (err) { return next(err); }
});
router.delete('/promotions/:id', authenticate, authenticateAdmin, async (req, res, next) => {
  try { await query(`DELETE FROM promotions WHERE id = ?`, [req.params.id]); res.json({ message: 'Deleted' }); } catch (err) { return next(err); }
});

// Banners
router.get('/banners', authenticate, authenticateAdmin, async (req, res, next) => {
  try { const rows = await query(`SELECT * FROM banners ORDER BY is_active DESC, priority DESC, created_at DESC`); res.json({ banners: rows }); } catch (err) { return next(err); }
});
router.post('/banners', authenticate, authenticateAdmin, async (req, res, next) => {
  try {
    const { title, image_url, link_url, is_active = 1, priority = 0, starts_at = null, ends_at = null } = req.body;
    await query(`INSERT INTO banners (title, image_url, link_url, is_active, priority, starts_at, ends_at) VALUES (?,?,?,?,?,?,?)`,
      [title, image_url, link_url || null, is_active ? 1 : 0, priority, starts_at, ends_at]);
    res.json({ message: 'Banner created' });
  } catch (err) { return next(err); }
});
router.put('/banners/:id', authenticate, authenticateAdmin, async (req, res, next) => {
  try {
    const { id } = req.params;
    const allowed = ['title','image_url','link_url','is_active','priority','starts_at','ends_at'];
    const updates = []; const params = [];
    for (const k of allowed) if (typeof req.body[k] !== 'undefined') { updates.push(`${k} = ?`); params.push(req.body[k]); }
    if (!updates.length) return res.status(400).json({ message: 'No updates' });
    params.push(id);
    await query(`UPDATE banners SET ${updates.join(', ')} WHERE id = ?`, params);
    res.json({ message: 'Banner updated' });
  } catch (err) { return next(err); }
});
router.delete('/banners/:id', authenticate, authenticateAdmin, async (req, res, next) => {
  try { await query(`DELETE FROM banners WHERE id = ?`, [req.params.id]); res.json({ message: 'Deleted' }); } catch (err) { return next(err); }
});

// -------- CMS --------
// Pages
router.get('/cms/pages', authenticate, authenticateAdmin, async (req, res, next) => {
  try { const rows = await query(`SELECT * FROM cms_pages ORDER BY updated_at DESC`); res.json({ pages: rows }); } catch (err) { return next(err); }
});
router.post('/cms/pages', authenticate, authenticateAdmin, async (req, res, next) => {
  try {
    const { slug, title, content, seo_title, seo_description, seo_keywords, is_published = 1 } = req.body;
    await query(`INSERT INTO cms_pages (slug, title, content, seo_title, seo_description, seo_keywords, is_published) VALUES (?,?,?,?,?,?,?)`,
      [slug, title, content || null, seo_title || null, seo_description || null, seo_keywords || null, is_published ? 1 : 0]);
    res.json({ message: 'Page created' });
  } catch (err) { return next(err); }
});
router.put('/cms/pages/:id', authenticate, authenticateAdmin, async (req, res, next) => {
  try {
    const { id } = req.params;
    const allowed = ['slug','title','content','seo_title','seo_description','seo_keywords','is_published'];
    const updates = []; const params = [];
    for (const k of allowed) if (typeof req.body[k] !== 'undefined') { updates.push(`${k} = ?`); params.push(req.body[k]); }
    if (!updates.length) return res.status(400).json({ message: 'No updates' });
    params.push(id);
    await query(`UPDATE cms_pages SET ${updates.join(', ')}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`, params);
    res.json({ message: 'Page updated' });
  } catch (err) { return next(err); }
});
router.delete('/cms/pages/:id', authenticate, authenticateAdmin, async (req, res, next) => {
  try { await query(`DELETE FROM cms_pages WHERE id = ?`, [req.params.id]); res.json({ message: 'Deleted' }); } catch (err) { return next(err); }
});

// Blog
router.get('/cms/posts', authenticate, authenticateAdmin, async (req, res, next) => {
  try { const rows = await query(`SELECT * FROM blog_posts ORDER BY updated_at DESC`); res.json({ posts: rows }); } catch (err) { return next(err); }
});
router.post('/cms/posts', authenticate, authenticateAdmin, async (req, res, next) => {
  try {
    const { slug, title, excerpt, content, cover_image, seo_title, seo_description, seo_keywords, status = 'draft', published_at = null } = req.body;
    await query(`INSERT INTO blog_posts (slug,title,excerpt,content,cover_image,seo_title,seo_description,seo_keywords,status,published_at) VALUES (?,?,?,?,?,?,?,?,?,?)`,
      [slug, title, excerpt || null, content || null, cover_image || null, seo_title || null, seo_description || null, seo_keywords || null, status, published_at]);
    res.json({ message: 'Post created' });
  } catch (err) { return next(err); }
});
router.put('/cms/posts/:id', authenticate, authenticateAdmin, async (req, res, next) => {
  try {
    const { id } = req.params;
    const allowed = ['slug','title','excerpt','content','cover_image','seo_title','seo_description','seo_keywords','status','published_at'];
    const updates = []; const params = [];
    for (const k of allowed) if (typeof req.body[k] !== 'undefined') { updates.push(`${k} = ?`); params.push(req.body[k]); }
    if (!updates.length) return res.status(400).json({ message: 'No updates' });
    params.push(id);
    await query(`UPDATE blog_posts SET ${updates.join(', ')}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`, params);
    res.json({ message: 'Post updated' });
  } catch (err) { return next(err); }
});
router.delete('/cms/posts/:id', authenticate, authenticateAdmin, async (req, res, next) => {
  try { await query(`DELETE FROM blog_posts WHERE id = ?`, [req.params.id]); res.json({ message: 'Deleted' }); } catch (err) { return next(err); }
});

// Media assets (URL-based; uploading handled elsewhere in app currently)
router.get('/cms/media', authenticate, authenticateAdmin, async (req, res, next) => {
  try { const rows = await query(`SELECT * FROM media_assets ORDER BY created_at DESC`); res.json({ media: rows }); } catch (err) { return next(err); }
});
router.post('/cms/media', authenticate, authenticateAdmin, async (req, res, next) => {
  try {
    const { file_url, file_name, file_type } = req.body;
    await query(`INSERT INTO media_assets (file_url, file_name, file_type) VALUES (?,?,?)`, [file_url, file_name || null, file_type || null]);
    res.json({ message: 'Media added' });
  } catch (err) { return next(err); }
});
router.delete('/cms/media/:id', authenticate, authenticateAdmin, async (req, res, next) => {
  try { await query(`DELETE FROM media_assets WHERE id = ?`, [req.params.id]); res.json({ message: 'Deleted' }); } catch (err) { return next(err); }
});

// Testimonials
router.get('/cms/testimonials', authenticate, authenticateAdmin, async (req, res, next) => {
  try { const rows = await query(`SELECT * FROM testimonials ORDER BY updated_at DESC`); res.json({ testimonials: rows }); } catch (err) { return next(err); }
});
router.post('/cms/testimonials', authenticate, authenticateAdmin, async (req, res, next) => {
  try {
    const { author_name, author_role, content, rating = 5, is_published = 1 } = req.body;
    await query(`INSERT INTO testimonials (author_name, author_role, content, rating, is_published) VALUES (?,?,?,?,?)`,
      [author_name, author_role || null, content, rating, is_published ? 1 : 0]);
    res.json({ message: 'Testimonial added' });
  } catch (err) { return next(err); }
});
router.put('/cms/testimonials/:id', authenticate, authenticateAdmin, async (req, res, next) => {
  try {
    const { id } = req.params;
    const allowed = ['author_name','author_role','content','rating','is_published'];
    const updates = []; const params = [];
    for (const k of allowed) if (typeof req.body[k] !== 'undefined') { updates.push(`${k} = ?`); params.push(req.body[k]); }
    if (!updates.length) return res.status(400).json({ message: 'No updates' });
    params.push(id);
    await query(`UPDATE testimonials SET ${updates.join(', ')}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`, params);
    res.json({ message: 'Testimonial updated' });
  } catch (err) { return next(err); }
});
router.delete('/cms/testimonials/:id', authenticate, authenticateAdmin, async (req, res, next) => {
  try { await query(`DELETE FROM testimonials WHERE id = ?`, [req.params.id]); res.json({ message: 'Deleted' }); } catch (err) { return next(err); }
});
// --- Customer Service data exposure for Admin ---
// Tickets (CS)
router.get('/cs/tickets', authenticate, authenticateAdmin, async (req, res, next) => {
  try {
    const { page = 1, limit = 20, status, category, q, employerId } = req.query;
    const offset = (page - 1) * limit;
    const params = [];
    const conditions = [];
    if (status) { conditions.push('t.status = ?'); params.push(status); }
    if (category) { conditions.push('t.category = ?'); params.push(category); }
    if (employerId) { conditions.push('t.employer_id = ?'); params.push(employerId); }
    if (q) { conditions.push('(t.subject LIKE ? OR t.description LIKE ?)'); params.push(`%${q}%`, `%${q}%`); }
    const whereClause = conditions.length ? 'WHERE ' + conditions.join(' AND ') : '';
    const tickets = await query(`
      SELECT t.*, u.full_name, u.email 
      FROM support_tickets t
      JOIN users u ON u.id = t.employer_id
      ${whereClause}
      ORDER BY t.updated_at DESC
      LIMIT ? OFFSET ?
    `, [...params, parseInt(limit), parseInt(offset)]);
    const total = await query(`SELECT COUNT(*) as count FROM support_tickets t ${whereClause}`, params);
    res.json({
      tickets,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: total[0].count,
        pages: Math.ceil(total[0].count / limit)
      }
    });
  } catch (err) {
    return next(err);
  }
});

// Employer search (CS-like)
router.get('/cs/employers', authenticate, authenticateAdmin, async (req, res, next) => {
  try {
    const { q = '', page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;
    const like = `%${q}%`;
    const rows = await query(`
      SELECT id, full_name, email, phone, role, created_at
      FROM users
      WHERE role = 'provider' AND (full_name LIKE ? OR email LIKE ? OR phone LIKE ?)
      ORDER BY created_at DESC
      LIMIT ? OFFSET ?
    `, [like, like, like, parseInt(limit), parseInt(offset)]);
    const count = await query(`SELECT COUNT(*) as count FROM users WHERE role = 'provider' AND (full_name LIKE ? OR email LIKE ? OR phone LIKE ?)`, [like, like, like]);
    res.json({
      employers: rows,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: count[0].count,
        pages: Math.ceil(count[0].count / limit)
      }
    });
  } catch (err) {
    return next(err);
  }
});

// Employer usage (CS-like)
router.get('/cs/employers/:id/usage', authenticate, authenticateAdmin, async (req, res, next) => {
  try {
    const { id } = req.params;
    const bs = await query(`SELECT has_used_pro_trial FROM boolean_search_usage WHERE employer_id = ? LIMIT 1`, [id]);
    const rs = await query(`
      SELECT usage_date, COUNT(*) as count
      FROM resume_scoring_usage
      WHERE employer_id = ? AND usage_date >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)
      GROUP BY usage_date
      ORDER BY usage_date DESC
    `, [id]);
    const pays = await query(`
      SELECT id, amount, currency, payment_method, transaction_id, status, payment_type, description, created_at
      FROM payments WHERE user_id = ? ORDER BY created_at DESC LIMIT 50
    `, [id]);
    res.json({
      booleanSearch: bs.length ? bs[0] : { has_used_pro_trial: 0 },
      resumeScoringDailyLast30: rs,
      recentPayments: pays,
    });
  } catch (err) {
    return next(err);
  }
});
