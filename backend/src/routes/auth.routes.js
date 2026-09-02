const express = require('express');
const { body } = require('express-validator');
const md5 = require('md5');
const jwt = require('jsonwebtoken');
const { query } = require('../db');
const { JWT_SECRET, JWT_EXPIRES_IN } = require('../config/env');
const { authenticate } = require('../middleware/auth');
const admin = require('../config/firebase');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const sendEmail = require('../utils/sendEmail');
const resetPasswordTemplate = require('../utils/resetPasswordTemplate');
const registerOtpTemplate = require('../utils/registerOtpTemplate');
const registrationSuccessTemplate = require('../utils/registrationSuccessTemplate');
const { getOrCreateActiveOtp, dispatchOtp, verifyOtp, otpHttpStatus } = require('../utils/otp');
const { validateCategoryPair, validateCategoryList } = require('../utils/categoryValidation');
const { setUserCategories } = require('../utils/userCategories');
const { hashPassword, verifyPassword, needsRehash } = require('../utils/password');
const router = express.Router();

// Parse a JSON column / string into an array of positive integers.
const parseIdArray = (val) => {
  let arr = val;
  if (typeof val === 'string') {
    try { arr = JSON.parse(val); } catch { arr = []; }
  }
  return Array.isArray(arr)
    ? arr.map(Number).filter((n) => Number.isInteger(n) && n > 0)
    : [];
};

const registrationValidation = [
  body('role').isIn(['seeker', 'provider']).withMessage('role must be seeker or provider'),
  body('fullName').trim().isLength({ min: 2 }).withMessage('fullName is required'),
  body('email').isEmail().normalizeEmail().withMessage('valid email required'),
  body('phone').optional({ values: 'falsy' }).isMobilePhone().withMessage('valid phone required'),
  body('password').isLength({ min: 6 }).withMessage('password min 6 chars'),
  body('experience').optional().isIn(['fresher', 'experience']).withMessage('invalid experience'),
  body('categoryId').optional().isInt({ min: 1 }).withMessage('invalid categoryId'),
  body('subcategoryId').optional().isInt({ min: 1 }).withMessage('invalid subcategoryId'),
  body('categoryIds').optional().isArray({ max: 5 }).withMessage('select at most 5 categories'),
  body('subcategoryIds').optional().isArray().withMessage('invalid subcategoryIds'),
];

// Google login / registration via Firebase ID token
// Full path (mounted in app.js): POST /api/auth/firebase
router.post('/firebase', async (req, res, next) => {
  try {
    const { token, role } = req.body;

    const finalRole = role === 'provider' ? 'provider' : 'seeker';

    // 1. Verify Firebase token
    const decoded = await admin.auth().verifyIdToken(token);

    const { email, name, uid } = decoded;

    if (!email) {
      return res.status(400).json({ message: 'Invalid Firebase user' });
    }

    const googleName = name || 'Google User';

    // 2. Check DB
    let users = await query('SELECT * FROM users WHERE email = ?', [email]);

    let user;

    if (users.length === 0) {
      // 3. Register user
      const result = await query(
        `INSERT INTO users (role, full_name, email, password_hash) VALUES (?, ?, ?, ?)`,
        [
          finalRole,
          googleName,
          email,
          // DB schema requires password_hash NOT NULL.
          // For Google users we store a deterministic "dummy" hash so normal password login won't work.
          md5(uid || email)
        ]
      );

      user = {
        id: result.insertId,
        role: finalRole,
        email,
        full_name: googleName
      };
    } else {
      user = users[0];

      // Ensure role matches the role requested by the frontend.
      // (Helps when the same Google email is used for provider vs seeker.)
      if (user.role !== finalRole) {
        await query('UPDATE users SET role = ? WHERE id = ?', [finalRole, user.id]);
        user.role = finalRole;
      }
    }

    // 5. If provider, ensure employer profile exists.
    if (user.role === 'provider') {
      await query(
        `
          INSERT INTO employer_profiles (
            user_id,
            company_name,
            contact_person,
            company_email,
            phone
          ) VALUES (?, ?, ?, ?, ?)
          ON DUPLICATE KEY UPDATE
            company_name = VALUES(company_name),
            contact_person = VALUES(contact_person),
            company_email = VALUES(company_email),
            phone = VALUES(phone),
            updated_at = CURRENT_TIMESTAMP
        `,
        [
          user.id,
          user.full_name || googleName,
          user.full_name || googleName,
          user.email || email,
          null
        ]
      );
    }

    // 4. Create your JWT
    const jwtToken = jwt.sign(
      {
        id: user.id,
        role: user.role,
        email: user.email,
        fullName: user.full_name
      },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );

    return res.json({
      token: jwtToken,
      user: {
        id: user.id,
        role: user.role,
        email: user.email,
        fullName: user.full_name
      }
    });

  } catch (err) {
    console.error(err);
    return res.status(401).json({ message: 'Firebase auth failed' });
  }
});

// INTERNAL USER CREATION (NO OTP)
router.post('/internal/create-user', async (req, res) => {
  try {
    const { role, fullName, email, phone, password, categoryId, subcategoryId, categoryIds, subcategoryIds, experience } = req.body;
    const trimmedFullName = String(fullName || '').trim();
    const trimmedEmail = String(email || '').trim().toLowerCase();
    const trimmedPhone = String(phone || '').trim();
    const normalizedRole = role === 'provider' ? 'provider' : role === 'seeker' ? 'seeker' : '';

    if (!trimmedFullName || !trimmedEmail || !password) {
      return res.status(400).json({ message: 'fullName, email and password are required' });
    }

    if (!normalizedRole) {
      return res.status(400).json({ message: 'role must be seeker or provider' });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmedEmail)) {
      return res.status(400).json({ message: 'valid email required' });
    }

    const existingUser = await query('SELECT id FROM users WHERE email = ?', [trimmedEmail]);
    if (existingUser.length > 0) {
      return res.status(400).json({ message: 'Email already registered' });
    }

    let primaryCategoryId = null;
    let primarySubcategoryId = null;
    let multiCats = [];
    let multiSubs = [];

    if (Array.isArray(categoryIds) && categoryIds.length > 0) {
      const listCheck = await validateCategoryList(categoryIds, subcategoryIds, { max: 5 });
      if (!listCheck.ok) {
        return res.status(400).json({ message: listCheck.message });
      }
      multiCats = listCheck.categoryIds;
      multiSubs = listCheck.subcategoryIds;
      primaryCategoryId = multiCats[0] || null;
      primarySubcategoryId = multiSubs[0] || null;
    } else {
      const categoryCheck = await validateCategoryPair(categoryId, subcategoryId, {
        requirePair: !!(categoryId || subcategoryId),
      });
      if (!categoryCheck.ok) {
        return res.status(400).json({ message: categoryCheck.message });
      }
      primaryCategoryId = categoryCheck.categoryId;
      primarySubcategoryId = categoryCheck.subcategoryId;
      if (primaryCategoryId) multiCats = [primaryCategoryId];
      if (primarySubcategoryId) multiSubs = [primarySubcategoryId];
    }

    const expVal =
      experience === 'fresher' || experience === 'experience' ? experience : null;

    const passwordHash = await hashPassword(password);

    const result = await query(
      `INSERT INTO users (role, full_name, email, phone, password_hash, category_id, subcategory_id, experience)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        normalizedRole,
        trimmedFullName,
        trimmedEmail,
        trimmedPhone || null,
        passwordHash,
        primaryCategoryId,
        primarySubcategoryId,
        expVal,
      ]
    );

    if (multiCats.length) {
      try { await setUserCategories(result.insertId, multiCats, multiSubs); } catch (e) {
        console.warn('Failed to set user categories (internal create):', e.message);
      }
    }

    if (normalizedRole === 'provider') {
      await query(
        `INSERT INTO employer_profiles (user_id, company_name, contact_person, company_email, phone)
         VALUES (?, ?, ?, ?, ?)`,
        [result.insertId, trimmedFullName, trimmedFullName, trimmedEmail, trimmedPhone || null]
      );
    }

    return res.json({
      message: 'User created successfully',
      userId: result.insertId
    });

  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error' });
  }
});

///register-initiate  (dual-channel: email + SMS, same OTP, send-then-persist)
router.post('/register', registrationValidation, async (req, res) => {
  try {
    const { validationResult } = require('express-validator');
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const {
      role,
      fullName,
      email,
      phone: rawPhone,
      password,
      experience,
      categoryId,
      subcategoryId,
      categoryIds,
      subcategoryIds,
    } = req.body;
    const phone = String(rawPhone || '').trim() || null;

    // Multi-select (new flow) takes precedence; otherwise fall back to the
    // legacy single category/subcategory pair so older clients keep working.
    let primaryCategoryId;
    let primarySubcategoryId;
    let categoryIdsJson;
    let subcategoryIdsJson;

    if (Array.isArray(categoryIds) && categoryIds.length > 0) {
      const listCheck = await validateCategoryList(categoryIds, subcategoryIds, { max: 5 });
      if (!listCheck.ok) {
        return res.status(400).json({ message: listCheck.message });
      }
      primaryCategoryId = listCheck.categoryIds[0];
      primarySubcategoryId = listCheck.subcategoryIds[0] || null;
      categoryIdsJson = JSON.stringify(listCheck.categoryIds);
      subcategoryIdsJson = JSON.stringify(listCheck.subcategoryIds);
    } else {
      const categoryCheck = await validateCategoryPair(categoryId, subcategoryId, {
        requirePair: !!(categoryId || subcategoryId),
      });
      if (!categoryCheck.ok) {
        return res.status(400).json({ message: categoryCheck.message });
      }
      primaryCategoryId = categoryCheck.categoryId;
      primarySubcategoryId = categoryCheck.subcategoryId;
      categoryIdsJson = JSON.stringify(categoryCheck.categoryId ? [categoryCheck.categoryId] : []);
      subcategoryIdsJson = JSON.stringify(categoryCheck.subcategoryId ? [categoryCheck.subcategoryId] : []);
    }

    const expVal =
      experience === 'fresher' || experience === 'experience' ? experience : null;

    const existingUser = await query('SELECT id FROM users WHERE email = ?', [email]);
    if (existingUser.length > 0) {
      return res.status(400).json({ message: 'Email already registered' });
    }

    const passwordHash = await hashPassword(password);

    let otpResult;
    try {
      otpResult = await getOrCreateActiveOtp('registration', email, {
        fullName,
        role,
        phone,
        passwordHash,
        categoryId: primaryCategoryId,
        subcategoryId: primarySubcategoryId,
        categoryIds: categoryIdsJson,
        subcategoryIds: subcategoryIdsJson,
        experience: expVal,
      });
    } catch (otpErr) {
      if (otpErr.code === 'MAX_SENDS') {
        return res.status(otpHttpStatus(otpErr)).json({ message: otpErr.message });
      }
      if (otpErr.code === 'SEND_FAILED' || otpErr.code === 'NO_CHANNEL') {
        return res.status(500).json({ message: 'Error sending OTP' });
      }
      throw otpErr;
    }

    if (otpResult.cooldown) {
      return res.status(429).json({
        message: `Please wait ${otpResult.retryAfterSeconds} seconds before requesting another OTP`,
      });
    }

    return res.json({ message: 'OTP sent', sentVia: otpResult.sentVia });

  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Error sending OTP' });
  }
});

// resend otp for register-initiate
router.post('/resend-register-otp', async (req, res) => {
  try {
    const { email } = req.body;

    const rows = await query('SELECT * FROM register_otp WHERE email = ?', [email]);

    if (rows.length === 0) {
      return res.status(400).json({ message: 'No registration request found' });
    }

    const record = rows[0];

    let otpResult;
    try {
      otpResult = await getOrCreateActiveOtp('registration', email, {
        fullName: record.full_name,
        role: record.role,
        phone: record.phone,
        passwordHash: record.password_hash,
        categoryId: record.category_id,
        subcategoryId: record.subcategory_id,
        categoryIds: record.category_ids,
        subcategoryIds: record.subcategory_ids,
        experience: record.experience,
      });
    } catch (otpErr) {
      if (otpErr.code === 'MAX_SENDS') {
        return res.status(otpHttpStatus(otpErr)).json({ message: otpErr.message });
      }
      if (otpErr.code === 'SEND_FAILED' || otpErr.code === 'NO_CHANNEL') {
        return res.status(500).json({ message: 'Error resending OTP' });
      }
      throw otpErr;
    }

    if (otpResult.cooldown) {
      return res.status(429).json({
        message: `Please wait ${otpResult.retryAfterSeconds} seconds before requesting another OTP`,
      });
    }

    return res.json({ message: 'OTP resent successfully', sentVia: otpResult.sentVia });

  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Error resending OTP' });
  }
});

// verify otp for register-initiate
router.post('/verify-register-otp', async (req, res) => {
  try {
    const { email, otp } = req.body;

    let record;
    try {
      record = await verifyOtp('registration', email, otp);
    } catch (otpErr) {
      return res.status(otpHttpStatus(otpErr)).json({ message: otpErr.message });
    }

    const existingUser = await query('SELECT id FROM users WHERE email = ?', [record.email || email]);
    if (existingUser.length > 0) {
      return res.status(400).json({ message: 'Email already registered' });
    }

    const result = await query(
      `INSERT INTO users (role, full_name, email, phone, password_hash, category_id, subcategory_id, experience)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        record.role,
        record.full_name,
        record.email,
        record.phone,
        record.password_hash,
        record.category_id || record.registration_category_id || null,
        record.subcategory_id || record.registration_subcategory_id || null,
        record.experience || null,
      ]
    );

    const newUserId = result.insertId;

    // Populate multi-category junction tables (falls back to the single pair).
    try {
      let cats = parseIdArray(record.category_ids);
      let subs = parseIdArray(record.subcategory_ids);
      if (cats.length === 0 && record.category_id) cats = [Number(record.category_id)];
      if (subs.length === 0 && record.subcategory_id) subs = [Number(record.subcategory_id)];
      if (cats.length) await setUserCategories(newUserId, cats, subs);
    } catch (catErr) {
      console.warn('Failed to set user categories on registration:', catErr.message);
    }

    if (record.role === 'provider') {
      await query(
        `INSERT INTO employer_profiles (user_id, company_name, contact_person, company_email)
         VALUES (?, ?, ?, ?)`,
        [newUserId, record.full_name, record.full_name, record.email]
      );
    }

    // delete after success
    await query('DELETE FROM register_otp WHERE email = ?', [email]);

    // Send welcome email
    const successHtml = registrationSuccessTemplate(record.full_name);
    await sendEmail(record.email, 'Welcome to Uptula!', successHtml);

    return res.json({ message: 'Registration successful' });

  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Error verifying OTP' });
  }
});

// Login
router.post(
  '/login',
  [body('email').trim().notEmpty().withMessage('Email or phone is required'), body('password').isLength({ min: 1 })],
  async (req, res, next) => {
    try {
      const { validationResult } = require('express-validator');
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }
      const { email: loginId, password } = req.body;
      const identifier = String(loginId || '').trim();
      const isEmailLogin = identifier.includes('@');
      let user;
      if (isEmailLogin) {
        const userRows = await query(
          'SELECT id, role, full_name, email, password_hash FROM users WHERE email = ? LIMIT 1',
          [identifier.toLowerCase()]
        );
        if (userRows.length === 0) {
          return res.status(401).json({ message: 'User not found' });
        }
        if (!(await verifyPassword(password, userRows[0].password_hash))) {
          return res.status(401).json({ message: 'Incorrect Password' });
        }
        user = userRows[0];
      } else {
        let userRows = await query(
          'SELECT id, role, full_name, email, password_hash FROM users WHERE phone = ? LIMIT 1',
          [identifier]
        );
        if (userRows.length === 0) {
          const digits = identifier.replace(/\D/g, '');
          if (digits) {
            userRows = await query(
              `SELECT id, role, full_name, email, password_hash FROM users
               WHERE REPLACE(REPLACE(REPLACE(REPLACE(phone, ' ', ''), '-', ''), '+', ''), '(', '') = ?
               LIMIT 1`,
              [digits]
            );
          }
        }
        if (userRows.length === 0) {
          return res.status(401).json({ message: 'User not found' });
        }
        if (!(await verifyPassword(password, userRows[0].password_hash))) {
          return res.status(401).json({ message: 'Incorrect Password' });
        }
        user = userRows[0];
      }

      // Block suspended accounts (best-effort; column added by boot migration).
      try {
        const [statusRow] = await query('SELECT account_status FROM users WHERE id = ?', [user.id]);
        if (statusRow && statusRow.account_status === 'suspended') {
          return res.status(403).json({ message: 'Your account has been suspended. Please contact support.' });
        }
      } catch (_) { /* column may not exist yet */ }

      // Transparent upgrade of legacy md5 hashes to bcrypt + last_login (best-effort).
      try {
        if (needsRehash(user.password_hash)) {
          const upgraded = await hashPassword(password);
          await query('UPDATE users SET password_hash = ? WHERE id = ?', [upgraded, user.id]);
        }
        await query('UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = ?', [user.id]);
      } catch (_) { /* non-blocking */ }

      const token = jwt.sign(
        { id: user.id, role: user.role, email: user.email, fullName: user.full_name },
        JWT_SECRET,
        { expiresIn: JWT_EXPIRES_IN }
      );
      return res.json({
        token,
        user: {
          id: user.id,
          role: user.role,
          email: user.email,
          fullName: user.full_name,
        },
      });
    } catch (err) {
      return next(err);
    }
  }
);

// Session check
router.get('/me', authenticate, async (req, res) => {
  return res.json({ user: req.user });
});

// Change password
router.put('/change-password', authenticate, async (req, res, next) => {
  try {
    const { currentPassword, newPassword, confirmPassword } = req.body;

    // Validation
    if (!currentPassword || !newPassword || !confirmPassword) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    if (newPassword !== confirmPassword) {
      return res.status(400).json({ message: 'New password and confirm password do not match' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ message: 'New password must be at least 6 characters long' });
    }

    // Verify current password (accepts legacy md5 or bcrypt)
    const userRows = await query(
      'SELECT id, password_hash FROM users WHERE id = ? LIMIT 1',
      [req.user.id]
    );

    if (userRows.length === 0 || !(await verifyPassword(currentPassword, userRows[0].password_hash))) {
      return res.status(401).json({ message: 'Current password is incorrect' });
    }

    // Update password (bcrypt)
    const newPasswordHash = await hashPassword(newPassword);
    await query(
      'UPDATE users SET password_hash = ? WHERE id = ?',
      [newPasswordHash, req.user.id]
    );

    return res.json({ message: 'Password changed successfully' });
  } catch (err) {
    return next(err);
  }
});

//FORGOT PASSWORD (SEND OTP) - dual-channel: email + SMS, same OTP
router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;

    const user = await query('SELECT id, full_name, phone FROM users WHERE email = ?', [email]);

    if (user.length === 0) {
      return res.status(400).json({ message: 'Enter your registered email' });
    }

    let otpResult;
    try {
      otpResult = await getOrCreateActiveOtp('password_reset', email, {
        phone: user[0].phone,
        fullName: user[0].full_name,
      });
    } catch (otpErr) {
      if (otpErr.code === 'MAX_SENDS') {
        return res.status(otpHttpStatus(otpErr)).json({ message: otpErr.message });
      }
      if (otpErr.code === 'SEND_FAILED' || otpErr.code === 'NO_CHANNEL') {
        return res.status(500).json({ message: 'Something went wrong' });
      }
      throw otpErr;
    }

    if (otpResult.cooldown) {
      return res.status(429).json({
        message: `Please wait ${otpResult.retryAfterSeconds} seconds before requesting another OTP`,
      });
    }

    return res.json({ message: 'OTP sent successfully', sentVia: otpResult.sentVia });

  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Something went wrong' });
  }
});

//2. VERIFY OTP
router.post('/verify-otp', async (req, res) => {
  try {
    const { email, otp } = req.body;

    try {
      await verifyOtp('password_reset', email, otp);
    } catch (otpErr) {
      return res.status(otpHttpStatus(otpErr)).json({ message: otpErr.message });
    }

    await query(
      'UPDATE password_resets SET is_verified = true WHERE email = ?',
      [email]
    );

    return res.json({ message: 'OTP verified' });

  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Error verifying OTP' });
  }
});

//3. RESET PASSWORD
router.post('/reset-password', async (req, res) => {
  try {
    const { email, newPassword, confirmPassword } = req.body;

    if (newPassword !== confirmPassword) {
      return res.status(400).json({ message: 'Passwords do not match' });
    }

    const rows = await query(
      'SELECT * FROM password_resets WHERE email = ? AND is_verified = true',
      [email]
    );

    if (rows.length === 0) {
      return res.status(400).json({ message: 'OTP not verified' });
    }

    // Passwords are now stored with bcrypt (legacy md5 hashes still verify on login).
    const passwordHash = await hashPassword(newPassword);

    await query(
      'UPDATE users SET password_hash = ? WHERE email = ?',
      [passwordHash, email]
    );

    // delete OTP after success
    await query('DELETE FROM password_resets WHERE email = ?', [email]);

    return res.json({ message: 'Password reset successful' });

  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Error resetting password' });
  }
});

//4. RESEND OTP
router.post('/resend-otp', async (req, res) => {
  try {
    const { email } = req.body;

    const rows = await query('SELECT * FROM password_resets WHERE email = ?', [email]);

    if (rows.length === 0) {
      return res.status(400).json({ message: 'No request found' });
    }

    const user = await query('SELECT full_name, phone FROM users WHERE email = ?', [email]);

    let otpResult;
    try {
      otpResult = await getOrCreateActiveOtp('password_reset', email, {
        phone: user[0] && user[0].phone,
        fullName: user[0] && user[0].full_name,
      });
    } catch (otpErr) {
      if (otpErr.code === 'MAX_SENDS') {
        return res.status(otpHttpStatus(otpErr)).json({ message: otpErr.message });
      }
      if (otpErr.code === 'SEND_FAILED' || otpErr.code === 'NO_CHANNEL') {
        return res.status(500).json({ message: 'Error resending OTP' });
      }
      throw otpErr;
    }

    if (otpResult.cooldown) {
      return res.status(429).json({
        message: `Please wait ${otpResult.retryAfterSeconds} seconds before requesting another OTP`,
      });
    }

    return res.json({ message: 'OTP resent', sentVia: otpResult.sentVia });

  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Error resending OTP' });
  }
});

module.exports = router;