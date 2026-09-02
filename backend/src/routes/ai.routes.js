const express = require('express');
const { query } = require('../db');
const { authenticate } = require('../middleware/auth');
const ai = require('../utils/aiService');

const router = express.Router();

const parseJson = (v) => {
  if (Array.isArray(v) || (v && typeof v === 'object')) return v;
  if (typeof v === 'string') { try { return JSON.parse(v); } catch { return []; } }
  return [];
};

// Build a compact profile object for a user (candidate) for AI prompts.
async function loadCandidateProfile(userId) {
  const [u] = await query('SELECT id, full_name, email, phone FROM users WHERE id = ?', [userId]);
  const [p] = await query('SELECT * FROM user_profiles WHERE user_id = ?', [userId]);
  const cats = await query(
    `SELECT c.name FROM user_categories uc JOIN categories c ON c.id = uc.category_id WHERE uc.user_id = ?`,
    [userId]
  );
  if (!u) return null;
  const prof = p || {};
  return {
    name: prof.name || u.full_name || '',
    email: u.email || '',
    phone: u.phone || '',
    bio: prof.bio || '',
    skills: parseJson(prof.skills),
    experience: parseJson(prof.experience),
    education: parseJson(prof.education),
    certifications: parseJson(prof.certifications),
    categories: cats.map((c) => c.name),
    expectedSalary: prof.expected_salary || '',
    preferredLocation: prof.preferred_location || '',
  };
}

// Guard: short-circuit when AI isn't configured.
function requireAI(req, res, next) {
  if (!ai.isConfigured()) {
    return res.status(503).json({
      message: 'AI features are not enabled. Set ANTHROPIC_API_KEY on the server to use them.',
      configured: false,
    });
  }
  return next();
}

// Public status (no auth) so the UI can show/hide AI buttons.
router.get('/status', (req, res) => res.json({ configured: ai.isConfigured() }));

// Candidate: enhance my profile (missing/recommended skills, scores, suggestions)
router.post('/enhance-profile', authenticate, requireAI, async (req, res, next) => {
  try {
    const profile = await loadCandidateProfile(req.user.id);
    if (!profile) return res.status(404).json({ message: 'Profile not found' });
    const result = await ai.enhanceProfile(profile);
    res.json({ result });
  } catch (err) { return next(err); }
});

// Candidate: headline options
router.post('/headline', authenticate, requireAI, async (req, res, next) => {
  try {
    const profile = await loadCandidateProfile(req.user.id);
    res.json({ headlines: await ai.generateHeadline(profile) });
  } catch (err) { return next(err); }
});

// Candidate: career advice
router.post('/career-advice', authenticate, requireAI, async (req, res, next) => {
  try {
    const profile = await loadCandidateProfile(req.user.id);
    res.json({ advice: await ai.careerAdvice(profile) });
  } catch (err) { return next(err); }
});

// Candidate: cover letter for a job
router.post('/cover-letter', authenticate, requireAI, async (req, res, next) => {
  try {
    const profile = await loadCandidateProfile(req.user.id);
    let job = req.body.job;
    if (!job && req.body.jobId) {
      const [j] = await query('SELECT job_title, company_name, description, skills FROM jobs WHERE id = ?', [Number(req.body.jobId)]);
      job = j || null;
    }
    if (!job) return res.status(400).json({ message: 'Provide jobId or job details' });
    res.json({ coverLetter: await ai.generateCoverLetter({ profile, job }) });
  } catch (err) { return next(err); }
});

// Employer: generate a job description
router.post('/job-description', authenticate, requireAI, async (req, res, next) => {
  try {
    if (req.user.role !== 'provider') return res.status(403).json({ message: 'Employers only' });
    const { title, skills, experience, location, employmentType, companyName } = req.body || {};
    if (!title) return res.status(400).json({ message: 'title is required' });
    res.json({ description: await ai.generateJobDescription({ title, skills, experience, location, employmentType, companyName }) });
  } catch (err) { return next(err); }
});

// Employer: summarize a candidate
router.post('/candidate-summary', authenticate, requireAI, async (req, res, next) => {
  try {
    if (req.user.role !== 'provider') return res.status(403).json({ message: 'Employers only' });
    const candidateId = Number(req.body.candidateId);
    if (!candidateId) return res.status(400).json({ message: 'candidateId is required' });
    const profile = await loadCandidateProfile(candidateId);
    if (!profile) return res.status(404).json({ message: 'Candidate not found' });
    res.json({ summary: await ai.summarizeCandidate(profile) });
  } catch (err) { return next(err); }
});

// Skill-gap analysis (employer or candidate)
router.post('/skill-gap', authenticate, requireAI, async (req, res, next) => {
  try {
    let { candidateSkills, requiredSkills, role, candidateId, jobId } = req.body || {};
    if ((!candidateSkills || !candidateSkills.length) && candidateId) {
      const profile = await loadCandidateProfile(Number(candidateId));
      candidateSkills = profile ? profile.skills : [];
    }
    if ((!requiredSkills || !requiredSkills.length) && jobId) {
      const [j] = await query('SELECT job_title, skills FROM jobs WHERE id = ?', [Number(jobId)]);
      if (j) { requiredSkills = String(j.skills || '').split(/[,;]/).map((s) => s.trim()).filter(Boolean); role = role || j.job_title; }
    }
    res.json({ result: await ai.skillGapAnalysis({ candidateSkills: candidateSkills || [], requiredSkills: requiredSkills || [], role: role || '' }) });
  } catch (err) { return next(err); }
});

module.exports = router;
