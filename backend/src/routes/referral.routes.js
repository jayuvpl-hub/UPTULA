const express = require('express');
const { query } = require('../db');
const { authenticate } = require('../middleware/auth');
const router = express.Router();

// Generate a simple referral code
function generateReferralCode() {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4);
}

// Track referral link click (no authentication required)
router.post('/track', async (req, res, next) => {
  try {
    const referralCode = typeof req.body?.referralCode === 'string'
      ? req.body.referralCode.trim()
      : '';

    if (!referralCode) {
      return res.status(400).json({ message: 'Referral code is required' });
    }

    const owners = await query(`
      SELECT erc.employer_id, u.full_name
      FROM employer_referral_codes erc
      JOIN users u ON u.id = erc.employer_id
      WHERE erc.referral_code = ?
      LIMIT 1
    `, [referralCode]);

    if (owners.length === 0) {
      return res.status(404).json({ message: 'Referral code not found' });
    }

    const employerId = owners[0].employer_id;

    let recorded = false;
    try {
      const insertResult = await query(`
        INSERT INTO referrals (employer_id, referral_code, status)
        VALUES (?, ?, 'clicked')
      `, [employerId, referralCode]);
      recorded = Boolean(insertResult?.insertId);
    } catch (err) {
      // If insertion fails (e.g. duplicate tracking logic in future), ignore and continue
      recorded = false;
    }

    return res.json({
      message: 'Referral code validated',
      referralCode,
      employer: {
        id: employerId,
        name: owners[0].full_name || ''
      },
      recorded
    });
  } catch (err) {
    return next(err);
  }
});

// Get or create referral code for employer
router.get('/code', authenticate, async (req, res, next) => {
  try {
    if (req.user.role !== 'provider') {
      return res.status(403).json({ message: 'Access denied. Employers only.' });
    }
    const employerId = req.user.id;

    // Try to get existing code
    const existing = await query(`
      SELECT referral_code FROM employer_referral_codes WHERE employer_id = ?
    `, [employerId]);

    if (existing.length > 0) {
      return res.json({ referralCode: existing[0].referral_code });
    }

    // Create new referral code
    let code = generateReferralCode();
    // ensure uniqueness by retrying a few times
    for (let i = 0; i < 5; i++) {
      try {
        await query(`
          INSERT INTO employer_referral_codes (employer_id, referral_code) VALUES (?, ?)
        `, [employerId, code]);
        return res.json({ referralCode: code });
      } catch (e) {
        // likely duplicate
        code = generateReferralCode();
      }
    }

    return res.status(500).json({ message: 'Failed to generate referral code. Please try again.' });
  } catch (err) {
    return next(err);
  }
});

// List referrals for employer
router.get('/list', authenticate, async (req, res, next) => {
  try {
    if (req.user.role !== 'provider') {
      return res.status(403).json({ message: 'Access denied. Employers only.' });
    }
    const employerId = req.user.id;

    const referrals = await query(`
      SELECT r.id, r.referral_code, r.status, r.created_at,
             u.full_name as referred_name, u.email as referred_email
      FROM referrals r
      LEFT JOIN users u ON u.id = r.referred_user_id
      WHERE r.employer_id = ?
      ORDER BY r.created_at DESC
    `, [employerId]);

    res.json({ referrals });
  } catch (err) {
    return next(err);
  }
});

module.exports = router;
