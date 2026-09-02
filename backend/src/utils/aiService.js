/**
 * Claude AI service (spec sections 9 & 15).
 *
 * Centralizes all Anthropic API access behind a small interface so the rest of the
 * app never touches the SDK directly. Everything degrades gracefully:
 *   - isConfigured() is false when ANTHROPIC_API_KEY is unset → callers skip AI.
 *   - the SDK is required lazily so a missing dependency never crashes the server.
 *
 * Config (backend .env):
 *   ANTHROPIC_API_KEY=sk-ant-...
 *   AI_MODEL=claude-sonnet-4-6        (optional; default below)
 */

const DEFAULT_MODEL = process.env.AI_MODEL || 'claude-sonnet-4-6';

let clientPromise = null;

function isConfigured() {
  return !!process.env.ANTHROPIC_API_KEY;
}

function getClient() {
  if (!isConfigured()) return null;
  if (!clientPromise) {
    try {
      const Anthropic = require('@anthropic-ai/sdk');
      clientPromise = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
    } catch (err) {
      console.warn('Anthropic SDK not installed:', err.message);
      return null;
    }
  }
  return clientPromise;
}

/**
 * Low-level text completion. `system` is sent as a cached block (prompt caching)
 * because callers reuse the same instruction across many requests.
 */
async function complete(system, userText, { maxTokens = 1024, temperature = 0.4 } = {}) {
  const client = getClient();
  if (!client) throw new Error('AI is not configured');
  const resp = await client.messages.create({
    model: DEFAULT_MODEL,
    max_tokens: maxTokens,
    temperature,
    system: [{ type: 'text', text: system, cache_control: { type: 'ephemeral' } }],
    messages: [{ role: 'user', content: userText }],
  });
  return (resp.content || []).map((b) => (b.type === 'text' ? b.text : '')).join('').trim();
}

/** Same as complete() but parses a JSON object out of the model output. */
async function completeJSON(system, userText, opts) {
  const raw = await complete(
    `${system}\n\nRespond with ONLY valid JSON. No markdown, no commentary.`,
    userText,
    opts
  );
  const cleaned = raw.replace(/^```(?:json)?/i, '').replace(/```$/i, '').trim();
  try {
    return JSON.parse(cleaned);
  } catch {
    // Try to salvage the first {...} block.
    const m = cleaned.match(/\{[\s\S]*\}/);
    if (m) { try { return JSON.parse(m[0]); } catch { /* fall through */ } }
    throw new Error('AI returned unparseable JSON');
  }
}

/* --------------------------- Feature functions --------------------------- */

async function parseResumeWithAI(resumeText) {
  if (!isConfigured()) return null;
  const system =
    'You extract structured data from resumes. Given raw resume text, return JSON with keys: ' +
    'name, email, phone, linkedin, github, skills (string[]), ' +
    'experience (array of {title, company, duration}), education (array of {degree, institute, year}), ' +
    'certifications (string[]). Use empty string/array when unknown.';
  return completeJSON(system, resumeText.slice(0, 15000), { maxTokens: 1500, temperature: 0.1 });
}

async function enhanceProfile(profile) {
  const system =
    'You are a career coach. Given a candidate profile JSON, return JSON with keys: ' +
    'profileStrengthScore (0-100), resumeScore (0-100), missingSkills (string[]), ' +
    'recommendedSkills (string[]), careerSuggestions (string[]), summary (string).';
  return completeJSON(system, JSON.stringify(profile).slice(0, 12000), { maxTokens: 1200 });
}

async function generateJobDescription(input) {
  const system =
    'You are an expert recruiter. Write a clear, structured, inclusive job description in markdown ' +
    'with sections: About the Role, Responsibilities, Requirements, Nice to Have, Benefits.';
  return complete(system, JSON.stringify(input).slice(0, 6000), { maxTokens: 1200, temperature: 0.6 });
}

async function summarizeCandidate(profile) {
  const system =
    'You are a recruiter assistant. Summarize this candidate in 4-6 concise sentences for a hiring manager, ' +
    'highlighting strengths, experience level, and standout skills.';
  return complete(system, JSON.stringify(profile).slice(0, 10000), { maxTokens: 500, temperature: 0.4 });
}

async function skillGapAnalysis({ candidateSkills = [], requiredSkills = [], role = '' }) {
  const system =
    'You analyze skill gaps. Return JSON with keys: matched (string[]), missing (string[]), ' +
    'matchPercentage (0-100), learningPlan (array of {skill, suggestion}).';
  return completeJSON(system, JSON.stringify({ role, candidateSkills, requiredSkills }), { maxTokens: 900 });
}

async function careerAdvice(profile) {
  const system =
    'You are a career advisor. Given a candidate profile, give practical next steps: roles to target, ' +
    'skills to build, and a 3-step 6-month plan. Return concise markdown.';
  return complete(system, JSON.stringify(profile).slice(0, 10000), { maxTokens: 900, temperature: 0.5 });
}

async function generateCoverLetter({ profile, job }) {
  const system =
    'You write professional, personable cover letters (250-350 words). Use the candidate profile and the ' +
    'job details. Return plain text only, no placeholders left unfilled.';
  return complete(system, JSON.stringify({ profile, job }).slice(0, 10000), { maxTokens: 800, temperature: 0.6 });
}

async function generateHeadline(profile) {
  const system =
    'You write punchy professional profile headlines (max 120 chars). Return 5 options as a JSON array of strings.';
  return completeJSON(system, JSON.stringify(profile).slice(0, 6000), { maxTokens: 300, temperature: 0.7 });
}

module.exports = {
  isConfigured,
  complete,
  completeJSON,
  parseResumeWithAI,
  enhanceProfile,
  generateJobDescription,
  summarizeCandidate,
  skillGapAnalysis,
  careerAdvice,
  generateCoverLetter,
  generateHeadline,
};
