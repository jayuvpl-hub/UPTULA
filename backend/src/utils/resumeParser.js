/**
 * Resume parsing (spec section 8).
 *
 * Extracts raw text from PDF / DOC / DOCX, then pulls structured fields with
 * heuristics. PDF/DOCX parsers are required lazily and wrapped in try/catch so a
 * missing optional dependency degrades gracefully instead of crashing the server.
 *
 * When an Anthropic API key is configured, callers can additionally pass the raw
 * text to the AI service (utils/aiService.parseResumeWithAI) for higher accuracy;
 * this module always provides a deterministic heuristic baseline on its own.
 */
const fs = require('fs');
const path = require('path');

async function extractText(filePath) {
  const ext = (path.extname(filePath || '') || '').toLowerCase();
  const buffer = fs.readFileSync(filePath);

  if (ext === '.pdf') {
    try {
      const pdfParse = require('pdf-parse');
      const data = await pdfParse(buffer);
      return data.text || '';
    } catch (err) {
      console.warn('pdf-parse unavailable/failed:', err.message);
      return '';
    }
  }

  if (ext === '.docx') {
    try {
      const mammoth = require('mammoth');
      const result = await mammoth.extractRawText({ buffer });
      return result.value || '';
    } catch (err) {
      console.warn('mammoth unavailable/failed:', err.message);
      return '';
    }
  }

  if (ext === '.doc') {
    // Legacy .doc binary format — best-effort plain-text salvage.
    try {
      return buffer.toString('utf8').replace(/[^\x09\x0A\x0D\x20-\x7E]/g, ' ');
    } catch {
      return '';
    }
  }

  return '';
}

const EMAIL_RE = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/;
const PHONE_RE = /(?:(?:\+|00)\d{1,3}[\s-]?)?(?:\(?\d{2,4}\)?[\s-]?)?\d{3,4}[\s-]?\d{3,4}/;
const LINKEDIN_RE = /(?:https?:\/\/)?(?:www\.)?linkedin\.com\/[^\s)]+/i;
const GITHUB_RE = /(?:https?:\/\/)?(?:www\.)?github\.com\/[^\s)]+/i;
const URL_RE = /(?:https?:\/\/)[^\s)]+/i;

// A pragmatic skills dictionary (technical + non-technical) for keyword matching.
const SKILL_KEYWORDS = [
  // tech
  'javascript', 'typescript', 'react', 'angular', 'vue', 'node.js', 'node', 'express',
  'python', 'django', 'flask', 'java', 'spring', 'spring boot', 'c++', 'c#', '.net',
  'php', 'laravel', 'ruby', 'rails', 'go', 'golang', 'rust', 'kotlin', 'swift',
  'sql', 'mysql', 'postgresql', 'mongodb', 'redis', 'aws', 'azure', 'gcp', 'docker',
  'kubernetes', 'git', 'graphql', 'rest', 'html', 'css', 'sass', 'tailwind',
  'machine learning', 'deep learning', 'tensorflow', 'pytorch', 'data science', 'nlp',
  'figma', 'photoshop', 'illustrator', 'ui/ux', 'devops', 'ci/cd', 'jenkins', 'linux',
  // non-tech / trades / office
  'sales', 'marketing', 'seo', 'accounting', 'tally', 'excel', 'ms office', 'communication',
  'customer service', 'project management', 'leadership', 'recruitment', 'plumbing',
  'electrical', 'welding', 'carpentry', 'masonry', 'driving', 'cooking', 'nursing',
  'first aid', 'housekeeping', 'security', 'logistics', 'inventory', 'data entry',
];

function uniq(arr) {
  return [...new Set(arr.map((s) => String(s).trim()).filter(Boolean))];
}

function findName(text) {
  const lines = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  for (const line of lines.slice(0, 8)) {
    // A name line: 2-4 capitalized words, no digits/@, not a heading.
    if (
      /^[A-Z][a-zA-Z.'-]+(?:\s+[A-Z][a-zA-Z.'-]+){1,3}$/.test(line) &&
      !/(resume|curriculum|vitae|profile|contact)/i.test(line)
    ) {
      return line;
    }
  }
  return '';
}

function extractSection(text, headings) {
  // Returns the lines under the first matching heading until the next heading-like line.
  const lines = text.split(/\r?\n/);
  const headingRe = new RegExp(`^\\s*(${headings.join('|')})\\s*:?\\s*$`, 'i');
  const anyHeadingRe = /^\s*(experience|work history|education|skills|projects|certifications?|summary|objective|achievements|interests|languages|references|contact)\s*:?\s*$/i;
  const out = [];
  let capturing = false;
  for (const raw of lines) {
    const line = raw.trim();
    if (headingRe.test(line)) { capturing = true; continue; }
    if (capturing) {
      if (anyHeadingRe.test(line) && !headingRe.test(line)) break;
      if (line) out.push(line);
    }
  }
  return out;
}

function parseResumeText(text) {
  const safe = String(text || '');
  const email = (safe.match(EMAIL_RE) || [])[0] || '';
  const linkedin = (safe.match(LINKEDIN_RE) || [])[0] || '';
  const github = (safe.match(GITHUB_RE) || [])[0] || '';

  // Phone: prefer a match on a line that isn't the email.
  let phone = '';
  for (const line of safe.split(/\r?\n/)) {
    if (EMAIL_RE.test(line)) continue;
    const m = line.match(PHONE_RE);
    if (m && m[0].replace(/\D/g, '').length >= 8) { phone = m[0].trim(); break; }
  }

  const lower = safe.toLowerCase();
  const skills = uniq(SKILL_KEYWORDS.filter((kw) => lower.includes(kw)))
    .map((s) => s.replace(/\b\w/g, (c) => c.toUpperCase()));

  // Other website/portfolio (first non-linkedin/github URL).
  let portfolio = '';
  const urls = safe.match(new RegExp(URL_RE, 'ig')) || [];
  for (const u of urls) {
    if (!/linkedin\.com|github\.com/i.test(u)) { portfolio = u; break; }
  }

  return {
    name: findName(safe),
    email,
    phone,
    linkedin,
    github,
    portfolio,
    skills,
    experience: extractSection(safe, ['experience', 'work experience', 'work history', 'employment']).slice(0, 30),
    education: extractSection(safe, ['education', 'academic', 'qualifications?']).slice(0, 20),
    projects: extractSection(safe, ['projects', 'personal projects']).slice(0, 20),
    certifications: extractSection(safe, ['certifications?', 'certificates', 'licenses?']).slice(0, 20),
    rawTextLength: safe.length,
  };
}

/** Parse a resume file on disk into structured fields (heuristic baseline). */
async function parseResumeFile(filePath) {
  const text = await extractText(filePath);
  if (!text || text.trim().length < 20) {
    return { ok: false, message: 'Could not extract readable text from this file.', parsed: null, text: '' };
  }
  return { ok: true, parsed: parseResumeText(text), text };
}

module.exports = { extractText, parseResumeText, parseResumeFile, SKILL_KEYWORDS };
