const path = require('path');

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

const UPLOADS_ROOT = process.env.UPLOADS_ROOT
  ? path.resolve(process.env.UPLOADS_ROOT)
  : path.join(process.cwd(), 'uploads');

/**
 * Build an absolute path inside the uploads root.
 * IMPORTANT: all disk writes/reads for uploaded files must go through this so
 * that files land where app.js serves `/uploads` from (UPLOADS_ROOT). Previously
 * routes wrote to `process.cwd()/uploads` directly, which broke serving whenever
 * UPLOADS_ROOT pointed elsewhere (the documented cPanel relocation case).
 */
function uploadPath(...segments) {
  return path.join(UPLOADS_ROOT, ...segments);
}

/**
 * Map a stored public URL like `/uploads/companies/x.png` to its on-disk path
 * under UPLOADS_ROOT. Used when deleting previously-stored files.
 */
function uploadPathFromUrl(urlPath) {
  const rel = String(urlPath || '')
    .replace(/^\/+/, '')
    .replace(/^uploads\/?/, '');
  return path.join(UPLOADS_ROOT, rel);
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
  DB_CONFIG,
};



// const PORT = process.env.PORT || 5000;
// const CLIENT_ORIGIN = process.env.CLIENT_ORIGIN || 'http://localhost:3000';
// const JWT_SECRET = process.env.JWT_SECRET || 'development_secret_change_me';
// const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

// const DB_CONFIG = {
//   host: process.env.DB_HOST || 'localhost',
//   port: Number(process.env.DB_PORT || 3306),
//   user: process.env.DB_USER || 'root',
//   password: process.env.DB_PASSWORD || '',
//   database: process.env.DB_NAME || 'uptula',
//   waitForConnections: true,
//   connectionLimit: 10,
//   queueLimit: 0,
// };

// module.exports = {
//   PORT,
//   CLIENT_ORIGIN,
//   JWT_SECRET,
//   JWT_EXPIRES_IN,
//   DB_CONFIG,
// };


