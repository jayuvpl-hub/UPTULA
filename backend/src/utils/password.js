/**
 * Password hashing with a safe md5 -> bcrypt migration path (spec section 17).
 *
 * The legacy app stored passwords as md5. We cannot reset everyone's password, so:
 *   - verifyPassword() accepts BOTH bcrypt and legacy md5 hashes.
 *   - new hashes (register / reset / change) use bcrypt.
 *   - needsRehash() lets the login route transparently upgrade a verified md5 user
 *     to bcrypt on their next successful login.
 */
const bcrypt = require('bcryptjs');
const md5 = require('md5');

const BCRYPT_ROUNDS = 10;

function isBcrypt(hash) {
  return typeof hash === 'string' && /^\$2[aby]\$/.test(hash);
}

async function hashPassword(plain) {
  return bcrypt.hash(String(plain), BCRYPT_ROUNDS);
}

async function verifyPassword(plain, hash) {
  if (!hash || plain == null) return false;
  if (isBcrypt(hash)) {
    try { return await bcrypt.compare(String(plain), hash); } catch { return false; }
  }
  // Legacy md5 (32 hex chars).
  return md5(String(plain)) === hash;
}

function needsRehash(hash) {
  return !isBcrypt(hash);
}

module.exports = { hashPassword, verifyPassword, needsRehash, isBcrypt };
