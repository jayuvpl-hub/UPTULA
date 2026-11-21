const express = require('express');
const crypto = require('crypto');
const rateLimit = require('express-rate-limit');
const normalizeEmailLib = require('validator/lib/normalizeEmail');
const { query } = require('../db');
const { createUser } = require('../services/createUser');
const { hashPassword } = require('../utils/password');
const { normalizeIndianPhone } = require('../utils/indianPhone');
const sendEmail = require('../utils/sendEmail');
const agentRegistrationSuccessTemplate = require('../utils/agentRegistrationSuccessTemplate');
const { sendAgentWelcomeSms } = require('../utils/agentWelcomeSms');

const router = express.Router();

const AGENT_API_KEY = process.env.AGENT_API_KEY || '';
const AGENT_RATE_LIMIT = Math.max(1, parseInt(process.env.AGENT_RATE_LIMIT, 10) || 120);

const agentRateLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: AGENT_RATE_LIMIT,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    const key = String(req.get('x-api-key') || 'missing');
    return `${key}:${req.ip}`;
  },
  message: { message: 'Too many requests' },
});

function registrationEmailKey(email) {
  const raw = String(email || '').trim();
  if (!raw) return '';
  return normalizeEmailLib(raw) || raw.toLowerCase();
}

/** Same inbox-matching check as normal signup (typed + normalized + Gmail variants). */
async function findAccountByEmail(rawEmail) {
  const typed = String(rawEmail || '').trim();
  if (!typed) return null;
  const key = registrationEmailKey(typed);
  const rows = await query(
    `SELECT id FROM users
      WHERE email = ?
         OR email = ?
         OR (
           SUBSTRING_INDEX(LOWER(email), '@', -1) IN ('gmail.com', 'googlemail.com')
           AND CONCAT(
                 REPLACE(SUBSTRING_INDEX(SUBSTRING_INDEX(LOWER(email), '@', 1), '+', 1), '.', ''),
                 '@gmail.com'
               ) = ?
         )
      ORDER BY id ASC
      LIMIT 1`,
    [typed, key, key]
  );
  return rows[0] || null;
}

/** Agent-only: match any stored phone whose digit-stripped form ends with the same 10 digits. */
async function findAccountByPhoneLast10(tenDigitPhone) {
  const last10 = String(tenDigitPhone || '').replace(/\D/g, '').slice(-10);
  if (last10.length !== 10) return null;
  const rows = await query(
    `SELECT id FROM users
      WHERE phone IS NOT NULL
        AND phone <> ''
        AND RIGHT(
              REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(phone, ' ', ''), '-', ''), '+', ''), '(', ''), ')', ''),
              10
            ) = ?
      LIMIT 1`,
    [last10]
  );
  return rows[0] || null;
}

function requireAgentApiKey(req, res, next) {
  if (!AGENT_API_KEY) {
    return res.status(503).json({ message: 'Service unavailable' });
  }
  const provided = String(req.get('x-api-key') || '');
  const expectedBuf = Buffer.from(AGENT_API_KEY);
  const providedBuf = Buffer.from(provided);
  if (
    providedBuf.length !== expectedBuf.length ||
    !crypto.timingSafeEqual(providedBuf, expectedBuf)
  ) {
    return res.status(401).json({ message: 'Unauthorized' });
  }
  return next();
}

function validateAgentRegisterBody(body) {
  const name = String(body?.name || '').trim();
  const email = String(body?.email || '').trim().toLowerCase();
  const phoneRaw = String(body?.phone || '').trim();
  const password = String(body?.password || '');

  if (name.length < 2) {
    return { ok: false, field: 'name', message: 'name must be at least 2 characters' };
  }
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!email || !emailRegex.test(email)) {
    return { ok: false, field: 'email', message: 'valid email required' };
  }
  const phone = normalizeIndianPhone(phoneRaw);
  if (!phone) {
    return { ok: false, field: 'phone', message: 'valid 10-digit Indian phone required' };
  }
  if (password.length < 6) {
    return { ok: false, field: 'password', message: 'password min 6 chars' };
  }

  return { ok: true, name, email, phone, password };
}

function sendWelcomeNotifications({ name, email, phone }) {
  sendEmail(email, 'Welcome to Uptula!', agentRegistrationSuccessTemplate(name)).catch((err) => {
    console.warn('[agent-register] welcome email failed:', err && err.message);
  });
  sendAgentWelcomeSms(phone).catch((err) => {
    console.warn('[agent-register] welcome SMS failed:', err && err.message);
  });
}

router.post(
  '/agent/register-user',
  agentRateLimiter,
  requireAgentApiKey,
  async (req, res) => {
    try {
      const validated = validateAgentRegisterBody(req.body || {});
      if (!validated.ok) {
        return res.status(400).json({ field: validated.field, message: validated.message });
      }

      const { name, email, phone, password } = validated;

      // Hash before any DB call so the plaintext password is never held across I/O.
      const passwordHash = await hashPassword(password);

      const existingEmail = await findAccountByEmail(email);
      if (existingEmail) {
        return res.status(409).json({ status: 'already_exists', field: 'email' });
      }

      const existingPhone = await findAccountByPhoneLast10(phone);
      if (existingPhone) {
        return res.status(409).json({ status: 'already_exists', field: 'phone' });
      }

      const { userId } = await createUser({
        role: 'seeker',
        fullName: name,
        email,
        phone,
        passwordHash,
        categoryId: null,
        subcategoryId: null,
        experience: null,
      });

      sendWelcomeNotifications({ name, email, phone });

      return res.status(201).json({ status: 'created', user_id: userId });
    } catch (err) {
      console.error('[agent-register] error:', err && (err.code || err.message) || 'unknown');
      return res.status(500).json({ message: 'Server error' });
    }
  }
);

module.exports = router;
