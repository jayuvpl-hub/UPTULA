const path = require('path');
const { S3Client, DeleteObjectCommand } = require('@aws-sdk/client-s3');

// Always load backend/.env from this file so S3_BUCKET / AWS_REGION are set
// before Upload.js or route modules read process.env (cwd-relative dotenv can miss).
require('dotenv').config({ path: path.join(__dirname, '..', '..', '.env') });

const NODE_ENV = process.env.NODE_ENV || 'development';
const isProduction = NODE_ENV === 'production';

const PORT = Number(process.env.PORT || 5000);

/** Comma-separated list of allowed browser origins (e.g. https://uptula.com,http://localhost:3000) */
function parseClientOrigins() {
  const raw = process.env.CLIENT_ORIGIN;
  if (!raw || !String(raw).trim()) {
    return isProduction ? ['https://uptula.com'] : ['http://localhost:3000'];
  }
  return String(raw)
    .split(',')
    .map((o) => o.trim())
    .filter(Boolean);
}

const CLIENT_ORIGINS = parseClientOrigins();
const CLIENT_ORIGIN = CLIENT_ORIGINS[0];

/** Public URL of this API (used in emails/links). No trailing slash. */
const PUBLIC_API_URL = (
  process.env.PUBLIC_API_URL ||
  process.env.API_PUBLIC_URL ||
  (isProduction ? 'https://uptula.com' : `http://localhost:${PORT}`)
).replace(/\/$/, '');

const JWT_SECRET = process.env.JWT_SECRET || 'development_secret_change_me';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

// --- Local-disk uploads (cPanel era) ---
// KEEP THESE until every multer config is confirmed working against S3 AND
// uploadPathFromUrl() call sites are migrated to deleteUploadedFile() below.
// Once that's verified, uploadPath/UPLOADS_ROOT can be deleted; nothing in
// the S3-based multer configs (config/upload.js) calls uploadPath() anymore.
const UPLOADS_ROOT = process.env.UPLOADS_ROOT
  ? path.resolve(process.env.UPLOADS_ROOT)
  : path.join(process.cwd(), 'uploads');

function uploadPath(...segments) {
  return path.join(UPLOADS_ROOT, ...segments);
}

/**
 * Map a stored public URL like `/uploads/companies/x.png` to its on-disk path
 * under UPLOADS_ROOT. Only relevant for files uploaded BEFORE the S3
 * migration. Use s3KeyFromStoredValue()/deleteUploadedFile() for anything
 * uploaded after switching to config/upload.js.
 */
function uploadPathFromUrl(urlPath) {
  const rel = String(urlPath || '')
    .replace(/^\/+/, '')
    .replace(/^uploads\/?/, '');
  return path.join(UPLOADS_ROOT, rel);
}

// --- S3 uploads (AWS migration) ---
const AWS_REGION = process.env.AWS_REGION || 'ap-south-1';
const S3_BUCKET = process.env.S3_BUCKET;

const s3 = new S3Client({ region: AWS_REGION });

/**
 * Map a stored S3 key or full S3/CloudFront URL back to just the key.
 * Replaces uploadPathFromUrl() for anything uploaded via config/upload.js.
 */
function s3KeyFromStoredValue(value) {
  const raw = String(value || '');
  if (raw.startsWith('http')) {
    return raw.replace(/^https?:\/\/[^/]+\//, '');
  }
  return raw.replace(/^\/+/, '');
}

/**
 * Delete a previously-uploaded file from S3. Use this everywhere the old
 * code did `fs.unlinkSync(uploadPathFromUrl(oldUrl))` when replacing a logo,
 * profile picture, resume, etc.
 */
async function deleteUploadedFile(storedValue) {
  const key = s3KeyFromStoredValue(storedValue);
  if (!key || !S3_BUCKET) return;
  try {
    await s3.send(new DeleteObjectCommand({ Bucket: S3_BUCKET, Key: key }));
  } catch (err) {
    console.warn('[env] failed to delete S3 object', key, err.message);
  }
}

// --- Razorpay ---
// Read through here rather than process.env at the call site so a missing
// value fails at boot with a clear message instead of surfacing as an opaque
// crypto error on the first webhook (createHmac throws on an undefined key).
const RAZORPAY_KEY_ID = process.env.RAZORPAY_KEY_ID || '';
const RAZORPAY_KEY_SECRET = process.env.RAZORPAY_KEY_SECRET || '';
const RAZORPAY_WEBHOOK_SECRET = process.env.RAZORPAY_WEBHOOK_SECRET || '';

const isLiveRazorpayKey = RAZORPAY_KEY_ID.startsWith('rzp_live_');

function assertRazorpayConfig() {
  const missing = [];
  if (!RAZORPAY_KEY_ID) missing.push('RAZORPAY_KEY_ID');
  if (!RAZORPAY_KEY_SECRET) missing.push('RAZORPAY_KEY_SECRET');
  // Without this the webhook cannot verify signatures, which means no reliable
  // fulfilment when the customer closes the tab before the browser callback runs.
  if (!RAZORPAY_WEBHOOK_SECRET) missing.push('RAZORPAY_WEBHOOK_SECRET');

  if (!missing.length) return;

  const message = `Missing Razorpay environment variables: ${missing.join(', ')}`;
  if (isProduction) throw new Error(message);
  console.warn(`[env] ${message} — payment routes will be degraded.`);
}

const DB_CONFIG = {
  host: process.env.DB_HOST || 'localhost',
  port: Number(process.env.DB_PORT || 3306),
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'uptula',
  waitForConnections: true,
  connectionLimit: Number(process.env.DB_CONNECTION_LIMIT || 10),
  queueLimit: 0,
  // RDS requires/recommends SSL. Set DB_SSL=true once DB_HOST points at RDS.
  ...(process.env.DB_SSL === 'true' ? { ssl: { rejectUnauthorized: true } } : {}),
};

module.exports = {
  NODE_ENV,
  isProduction,
  PORT,
  CLIENT_ORIGIN,
  CLIENT_ORIGINS,
  PUBLIC_API_URL,
  JWT_SECRET,
  JWT_EXPIRES_IN,
  UPLOADS_ROOT,
  uploadPath,
  uploadPathFromUrl,
  AWS_REGION,
  S3_BUCKET,
  s3,
  s3KeyFromStoredValue,
  deleteUploadedFile,
  RAZORPAY_KEY_ID,
  RAZORPAY_KEY_SECRET,
  RAZORPAY_WEBHOOK_SECRET,
  isLiveRazorpayKey,
  assertRazorpayConfig,
  DB_CONFIG,
};
// const path = require('path');

// const NODE_ENV = process.env.NODE_ENV || 'development';
// const isProduction = NODE_ENV === 'production';

// const PORT = Number(process.env.PORT || 5000);

// /** Comma-separated list of allowed browser origins (e.g. https://uptula.com,http://localhost:3000) */
// function parseClientOrigins() {
//   const raw = process.env.CLIENT_ORIGIN;
//   if (!raw || !String(raw).trim()) {
//     return isProduction ? ['https://uptula.com'] : ['http://localhost:3000'];
//   }
//   return String(raw)
//     .split(',')
//     .map((o) => o.trim())
//     .filter(Boolean);
// }

// const CLIENT_ORIGINS = parseClientOrigins();
// const CLIENT_ORIGIN = CLIENT_ORIGINS[0];

// /** Public URL of this API (used in emails/links). No trailing slash. */
// const PUBLIC_API_URL = (
//   process.env.PUBLIC_API_URL ||
//   process.env.API_PUBLIC_URL ||
//   (isProduction ? 'https://uptula.com' : `http://localhost:${PORT}`)
// ).replace(/\/$/, '');

// const JWT_SECRET = process.env.JWT_SECRET || 'development_secret_change_me';
// const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

// const UPLOADS_ROOT = process.env.UPLOADS_ROOT
//   ? path.resolve(process.env.UPLOADS_ROOT)
//   : path.join(process.cwd(), 'uploads');

// /**
//  * Build an absolute path inside the uploads root.
//  * IMPORTANT: all disk writes/reads for uploaded files must go through this so
//  * that files land where app.js serves `/uploads` from (UPLOADS_ROOT). Previously
//  * routes wrote to `process.cwd()/uploads` directly, which broke serving whenever
//  * UPLOADS_ROOT pointed elsewhere (the documented cPanel relocation case).
//  */
// function uploadPath(...segments) {
//   return path.join(UPLOADS_ROOT, ...segments);
// }

// /**
//  * Map a stored public URL like `/uploads/companies/x.png` to its on-disk path
//  * under UPLOADS_ROOT. Used when deleting previously-stored files.
//  */
// function uploadPathFromUrl(urlPath) {
//   const rel = String(urlPath || '')
//     .replace(/^\/+/, '')
//     .replace(/^uploads\/?/, '');
//   return path.join(UPLOADS_ROOT, rel);
// }

// const DB_CONFIG = {
//   host: process.env.DB_HOST || 'localhost',
//   port: Number(process.env.DB_PORT || 3306),
//   user: process.env.DB_USER || 'root',
//   password: process.env.DB_PASSWORD || '',
//   database: process.env.DB_NAME || 'uptula',
//   waitForConnections: true,
//   connectionLimit: Number(process.env.DB_CONNECTION_LIMIT || 10),
//   queueLimit: 0,
// };

// module.exports = {
//   NODE_ENV,
//   isProduction,
//   PORT,
//   CLIENT_ORIGIN,
//   CLIENT_ORIGINS,
//   PUBLIC_API_URL,
//   JWT_SECRET,
//   JWT_EXPIRES_IN,
//   UPLOADS_ROOT,
//   uploadPath,
//   uploadPathFromUrl,
//   DB_CONFIG,
// };




