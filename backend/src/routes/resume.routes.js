const express = require('express');
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const { query } = require('../db');
const { authenticate } = require('../middleware/auth');
const { uploadPath } = require('../config/env');
const { parseResumeFile } = require('../utils/resumeParser');
const puppeteer = require('puppeteer');

const router = express.Router();

// Multer storage for resume parsing uploads (same dir/validation as profile resumes).
const parseStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = uploadPath('resumes');
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname || '');
    const base = path.basename(file.originalname || 'resume', ext).replace(/[^a-zA-Z0-9_-]/g, '');
    cb(null, `${Date.now()}_${req.user.id}_${base}${ext}`);
  },
});
const resumeUpload = multer({
  storage: parseStorage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowedExt = new Set(['.pdf', '.doc', '.docx']);
    const ext = (path.extname(file.originalname || '') || '').toLowerCase();
    if (allowedExt.has(ext)) return cb(null, true);
    return cb(new Error('Resume must be a PDF or Word (.doc/.docx) file'), false);
  },
});

let browserPromise = null;
async function getBrowser() {
  if (!browserPromise) {
    browserPromise = puppeteer.launch({
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });
  }
  return browserPromise;
}

// Get user download count
router.get('/downloads/count', authenticate, async (req, res, next) => {
  try {
    const userId = req.user.id;
    
    // Get basic download count
    const basicDownloads = await query(
      'SELECT COUNT(*) as count FROM user_downloads WHERE user_id = ? AND download_type = "resume"',
      [userId]
    );
    
    // Check if user has active premium subscription
    const premiumStatus = await query(`
      SELECT ps.*, 
             CASE 
               WHEN ps.subscription_type = 'monthly' AND ps.end_date > NOW() THEN 'active'
               WHEN ps.subscription_type = 'yearly' AND ps.end_date > NOW() THEN 'active'
               WHEN ps.subscription_type = 'lifetime' THEN 'active'
               ELSE 'expired'
             END as current_status
      FROM premium_subscriptions ps 
      WHERE ps.user_id = ? AND ps.status = 'active'
      ORDER BY ps.created_at DESC 
      LIMIT 1
    `, [userId]);
    
    const isPremium = premiumStatus.length > 0 && premiumStatus[0].current_status === 'active';
    
    res.json({
      basicDownloads: basicDownloads[0].count,
      isPremium,
      maxBasicDownloads: 5,
      canDownload: isPremium || basicDownloads[0].count < 5
    });
  } catch (err) {
    return next(err);
  }
});

// Download resume
router.post('/download', authenticate, async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { template = 'basic', resumeData } = req.body;
    
    // Check download limits
    const basicDownloads = await query(
      'SELECT COUNT(*) as count FROM user_downloads WHERE user_id = ? AND download_type = "resume"',
      [userId]
    );
    
    const premiumStatus = await query(`
      SELECT ps.*, 
             CASE 
               WHEN ps.subscription_type = 'monthly' AND ps.end_date > NOW() THEN 'active'
               WHEN ps.subscription_type = 'yearly' AND ps.end_date > NOW() THEN 'active'
               WHEN ps.subscription_type = 'lifetime' THEN 'active'
               ELSE 'expired'
             END as current_status
      FROM premium_subscriptions ps 
      WHERE ps.user_id = ? AND ps.status = 'active'
      ORDER BY ps.created_at DESC 
      LIMIT 1
    `, [userId]);
    
    const isPremium = premiumStatus.length > 0 && premiumStatus[0].current_status === 'active';
    
    if (!isPremium && basicDownloads[0].count >= 5) {
      return res.status(403).json({
        message: 'Download limit reached. Please upgrade to premium for unlimited downloads.',
        requiresPremium: true
      });
    }
    
    // Record the download
    await query(
      'INSERT INTO user_downloads (user_id, download_type, template_used) VALUES (?, ?, ?)',
      [userId, isPremium ? 'premium_resume' : 'resume', template]
    );
    
    res.json({
      message: 'Download recorded successfully',
      remainingDownloads: isPremium ? 'unlimited' : Math.max(0, 5 - basicDownloads[0].count - 1)
    });
  } catch (err) {
    return next(err);
  }
});

// Download resume as PDF (real text + clickable links)
router.post('/pdf', authenticate, async (req, res, next) => {
  let page = null;
  try {
    const userId = req.user.id;
    const { template = 'basic', html } = req.body || {};

    if (!html || typeof html !== 'string') {
      return res.status(400).json({ message: 'Missing resume HTML' });
    }

    // Check download limits (same logic as /download)
    const basicDownloads = await query(
      'SELECT COUNT(*) as count FROM user_downloads WHERE user_id = ? AND download_type = "resume"',
      [userId]
    );

    const premiumStatus = await query(`
      SELECT ps.*,
             CASE
               WHEN ps.subscription_type = 'monthly' AND ps.end_date > NOW() THEN 'active'
               WHEN ps.subscription_type = 'yearly' AND ps.end_date > NOW() THEN 'active'
               WHEN ps.subscription_type = 'lifetime' THEN 'active'
               ELSE 'expired'
             END as current_status
      FROM premium_subscriptions ps
      WHERE ps.user_id = ? AND ps.status = 'active'
      ORDER BY ps.created_at DESC
      LIMIT 1
    `, [userId]);

    const isPremium = premiumStatus.length > 0 && premiumStatus[0].current_status === 'active';

    if (!isPremium && basicDownloads[0].count >= 5) {
      return res.status(403).json({
        message: 'Download limit reached. Please upgrade to premium for unlimited downloads.',
        requiresPremium: true
      });
    }

    // Generate PDF in headless Chrome (with fallback to HTML if Chrome unavailable)
    let pdfBuffer = null;
    
    try {
      const puppeteer = require('puppeteer');
      const launchOpts = {};
      if (process.env.PUPPETEER_EXECUTABLE_PATH) {
        launchOpts.executablePath = process.env.PUPPETEER_EXECUTABLE_PATH;
      } else {
        launchOpts.args = ['--no-sandbox', '--disable-setuid-sandbox'];
      }

      const browser = await puppeteer.launch(launchOpts);
      page = await browser.newPage();
      await page.setViewport({ width: 794, height: 1123, deviceScaleFactor: 1 });
      await page.setContent(html, { waitUntil: ['load', 'networkidle0'], timeout: 30000 });

      pdfBuffer = await page.pdf({
        format: 'A4',
        printBackground: true,
        preferCSSPageSize: true,
        margin: { top: 0, right: 0, bottom: 0, left: 0 }
      });
      
      await page.close();
      await browser.close();
    } catch (puppeteerErr) {
      // If Puppeteer fails (Chrome not available), fall back to returning HTML
      console.warn('Puppeteer PDF generation failed, falling back to HTML:', puppeteerErr.message);
      
      // Return HTML with instruction about printing to PDF
      const htmlResponse = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Resume</title>
</head>
<body>
  <div style="padding: 20px; font-family: 'Lato', Arial, sans-serif;">
    <div style="background: #ECFDF5; border: 1px solid #A7F3D0; border-radius: 6px; padding: 15px; margin-bottom: 30px; color: #065F46;">
      <strong>💡 Tip:</strong> Use your browser's Print function (Ctrl+P or Cmd+P) and select "Save as PDF" to get a professional PDF with selectable text and clickable links.
    </div>
  </div>
  ${html}
</body>
</html>`;
      
      // Record the download
      await query(
        'INSERT INTO user_downloads (user_id, download_type, template_used) VALUES (?, ?, ?)',
        [userId, isPremium ? 'premium_resume' : 'resume', template]
      );

      res.setHeader('Content-Type', 'text/html; charset=utf-8');
      res.setHeader('Content-Disposition', 'attachment; filename="Resume.html"');
      return res.send(htmlResponse);
    }

    if (!pdfBuffer) {
      return res.status(500).json({ message: 'Failed to generate PDF' });
    }

    // Record the download (once) for non-premium users
    await query(
      'INSERT INTO user_downloads (user_id, download_type, template_used) VALUES (?, ?, ?)',
      [userId, isPremium ? 'premium_resume' : 'resume', template]
    );

    res.writeHead(200, {
      'Content-Type': 'application/pdf',
      'Content-Disposition': 'attachment; filename="Resume.pdf"',
      'Content-Length': pdfBuffer.length
    });
    return res.end(pdfBuffer);
  } catch (err) {
    return next(err);
  } finally {
    try { if (page) await page.close(); } catch (_) {}
  }
});

// Get premium subscription plans
router.get('/premium/plans', async (req, res, next) => {
  try {
    const plans = [
      {
        id: 'monthly',
        name: 'Monthly Premium',
        price: 9.99,
        duration: '1 month',
        features: ['Unlimited resume downloads', 'Premium templates', 'Priority support']
      },
      {
        id: 'yearly',
        name: 'Yearly Premium',
        price: 99.99,
        duration: '12 months',
        features: ['Unlimited resume downloads', 'Premium templates', 'Priority support', 'Save 17%']
      },
      {
        id: 'lifetime',
        name: 'Lifetime Premium',
        price: 199.99,
        duration: 'Lifetime',
        features: ['Unlimited resume downloads', 'All premium templates', 'Priority support', 'Future updates']
      }
    ];
    
    res.json({ plans });
  } catch (err) {
    return next(err);
  }
});

// Subscribe to premium (mock implementation)
router.post('/premium/subscribe', authenticate, async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { subscriptionType, paymentMethod } = req.body;
    
    // In a real implementation, you would integrate with payment processors like Stripe
    // For now, we'll just create a mock subscription
    
    const endDate = subscriptionType === 'monthly' 
      ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days
      : subscriptionType === 'yearly'
      ? new Date(Date.now() + 365 * 24 * 60 * 60 * 1000) // 365 days
      : null; // lifetime
    
    await query(`
      INSERT INTO premium_subscriptions (user_id, subscription_type, status, end_date) 
      VALUES (?, ?, 'active', ?)
    `, [userId, subscriptionType, endDate]);
    
    res.json({
      message: 'Premium subscription activated successfully!',
      subscriptionType,
      endDate
    });
  } catch (err) {
    return next(err);
  }
});

// ----------------------------------------------------------------------------
// Resume parsing (spec section 8): upload -> extract -> review payload
// ----------------------------------------------------------------------------

// Parse a resume. Either upload a new file (field "resume") OR pass
// { useExisting: true } to parse the resume already stored on the profile.
// Optionally set { enhance: true } to additionally run AI extraction when a
// Claude API key is configured (utils/aiService). Always returns a heuristic
// baseline so it works with or without AI.
router.post('/parse', authenticate, resumeUpload.single('resume'), async (req, res, next) => {
  let uploadedPath = null;
  try {
    const userId = req.user.id;
    let filePath = null;
    let cleanupAfter = false;

    if (req.file) {
      filePath = req.file.path;
      uploadedPath = req.file.path;
      cleanupAfter = String(req.body.persist) !== 'true'; // temp parse unless persist requested
    } else {
      const rows = await query('SELECT resume FROM user_profiles WHERE user_id = ?', [userId]);
      const stored = rows[0]?.resume;
      if (!stored) {
        return res.status(400).json({ message: 'No resume found. Upload a file or set one on your profile first.' });
      }
      filePath = uploadPath('resumes', stored);
      if (!fs.existsSync(filePath)) {
        return res.status(404).json({ message: 'Stored resume file is missing on the server.' });
      }
    }

    const result = await parseResumeFile(filePath);
    if (!result.ok) {
      return res.status(422).json({ message: result.message });
    }

    let parsed = result.parsed;
    let aiUsed = false;
    if (String(req.body.enhance) === 'true') {
      try {
        const { parseResumeWithAI, isConfigured } = require('../utils/aiService');
        if (isConfigured()) {
          const aiParsed = await parseResumeWithAI(result.text);
          if (aiParsed) { parsed = { ...parsed, ...aiParsed }; aiUsed = true; }
        }
      } catch (aiErr) {
        console.warn('AI resume parse skipped:', aiErr.message);
      }
    }

    // Mark resume status as parsed (best-effort).
    try { await query("UPDATE users SET resume_status = 'parsed' WHERE id = ?", [userId]); } catch (_) {}

    return res.json({
      message: 'We found the following information from your resume.',
      aiUsed,
      parsed,
    });
  } catch (err) {
    return next(err);
  } finally {
    // Remove temp upload unless caller asked to persist it.
    if (uploadedPath && String(req.body.persist) !== 'true') {
      try { if (fs.existsSync(uploadedPath)) fs.unlinkSync(uploadedPath); } catch (_) {}
    }
  }
});

// Apply reviewed/accepted resume data into the candidate profile.
// Body may contain any of: name, phone, skills[], experience[], education[],
// certifications[], linkedin, github. Only provided fields are written.
router.post('/apply-parsed', authenticate, async (req, res, next) => {
  try {
    const userId = req.user.id;
    const b = req.body || {};

    const jsonOrNull = (v) => (v !== undefined ? JSON.stringify(v) : undefined);
    const sets = [];
    const params = [];
    const pushSet = (col, val) => { if (val !== undefined) { sets.push(`${col} = ?`); params.push(val); } };

    pushSet('name', b.name);
    pushSet('linkedin', b.linkedin);
    pushSet('skills', jsonOrNull(b.skills));
    pushSet('experience', jsonOrNull(b.experience));
    pushSet('education', jsonOrNull(b.education));
    pushSet('certifications', jsonOrNull(b.certifications));

    // Ensure a profile row exists.
    const existing = await query('SELECT id FROM user_profiles WHERE user_id = ?', [userId]);
    if (existing.length === 0) {
      await query('INSERT INTO user_profiles (user_id) VALUES (?)', [userId]);
    }

    if (sets.length) {
      params.push(userId);
      await query(`UPDATE user_profiles SET ${sets.join(', ')}, updated_at = CURRENT_TIMESTAMP WHERE user_id = ?`, params);
    }

    // Phone lives on users; update if provided.
    if (b.phone !== undefined) {
      await query('UPDATE users SET phone = ? WHERE id = ?', [b.phone || null, userId]);
    }

    return res.json({ message: 'Profile updated from resume successfully' });
  } catch (err) {
    return next(err);
  }
});

module.exports = router;
