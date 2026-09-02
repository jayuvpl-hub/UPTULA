const express = require('express');
const { query } = require('../db');
const { authenticate } = require('../middleware/auth');
const { resolveCompanyLogo } = require('../config/constants');

const router = express.Router();

// Get all wishlist items for a candidate
router.get('/', authenticate, async (req, res, next) => {
  try {
    if (req.user.role !== 'seeker') {
      return res.status(403).json({ message: 'Only candidates can view wishlist.' });
    }

    const rows = await query(
      `
        SELECT
          w.id as wishlist_id,
          w.created_at as saved_at,
          j.id,
          j.job_title,
          j.company_name,
          j.salary_range,
          j.job_type,
          j.city,
          j.state,
          j.country,
          j.experience,
          j.description,
          j.skills,
          j.created_at as posted_at,
          j.status,
          j.company_logo,
          ep.company_name as employer_company_name,
          ep.logo_url AS employer_logo_url
        FROM job_wishlist w
        JOIN jobs j ON j.id = w.job_id
        LEFT JOIN employer_profiles ep ON ep.user_id = j.employer_id
        WHERE w.candidate_id = ?
        ORDER BY w.created_at DESC
      `,
      [req.user.id]
    );

    res.json({
      wishlist: (rows || []).map((job) => ({ ...job, companyLogoUrl: resolveCompanyLogo(job) }))
    });
  } catch (err) {
    console.error('Error fetching wishlist:', err);
    return next(err);
  }
});

// Add job to wishlist
router.post('/:jobId', authenticate, async (req, res, next) => {
  try {
    if (req.user.role !== 'seeker') {
      return res.status(403).json({ message: 'Only candidates can add jobs to wishlist.' });
    }

    const { jobId } = req.params;
    const candidateId = req.user.id;

    // Check if job exists
    const jobs = await query('SELECT id, status FROM jobs WHERE id = ?', [jobId]);
    if (!jobs.length) {
      return res.status(404).json({ message: 'Job not found.' });
    }
    if (jobs[0].status !== 'active') {
      return res.status(400).json({ message: 'Cannot save inactive job.' });
    }

    // Check if already in wishlist
    const existing = await query(
      'SELECT id FROM job_wishlist WHERE candidate_id = ? AND job_id = ?',
      [candidateId, jobId]
    );

    if (existing.length) {
      return res.status(409).json({ message: 'Job already in wishlist.' });
    }

    // Add to wishlist
    await query(
      'INSERT INTO job_wishlist (candidate_id, job_id) VALUES (?, ?)',
      [candidateId, jobId]
    );

    res.status(201).json({ message: 'Job added to wishlist successfully.' });
  } catch (err) {
    console.error('Error adding to wishlist:', err);
    return next(err);
  }
});

// Remove job from wishlist
router.delete('/:jobId', authenticate, async (req, res, next) => {
  try {
    if (req.user.role !== 'seeker') {
      return res.status(403).json({ message: 'Only candidates can remove jobs from wishlist.' });
    }

    const { jobId } = req.params;
    const candidateId = req.user.id;

    const result = await query(
      'DELETE FROM job_wishlist WHERE candidate_id = ? AND job_id = ?',
      [candidateId, jobId]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Job not found in wishlist.' });
    }

    res.json({ message: 'Job removed from wishlist successfully.' });
  } catch (err) {
    console.error('Error removing from wishlist:', err);
    return next(err);
  }
});

// Check if job is in wishlist
router.get('/check/:jobId', authenticate, async (req, res, next) => {
  try {
    if (req.user.role !== 'seeker') {
      return res.json({ inWishlist: false });
    }

    const { jobId } = req.params;
    const candidateId = req.user.id;

    const rows = await query(
      'SELECT id FROM job_wishlist WHERE candidate_id = ? AND job_id = ?',
      [candidateId, jobId]
    );

    res.json({ inWishlist: rows.length > 0 });
  } catch (err) {
    console.error('Error checking wishlist:', err);
    return next(err);
  }
});

module.exports = router;

