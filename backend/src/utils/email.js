/**
 * Match express-validator normalizeEmail() / frontend normalizeRegistrationEmail():
 * lowercase, googlemail → gmail, strip Gmail dots and +tags.
 */
function normalizeEmail(email) {
  const trimmed = String(email || '').trim();
  if (!trimmed) return '';
  const parts = trimmed.toLowerCase().split('@');
  if (parts.length !== 2) return trimmed.toLowerCase();
  let [local, domain] = parts;
  if (domain === 'googlemail.com') domain = 'gmail.com';
  if (domain === 'gmail.com') {
    local = local.split('+')[0].replace(/\./g, '');
  }
  return `${local}@${domain}`;
}

function emailLookupValues(email) {
  const raw = String(email || '').trim().toLowerCase();
  const normalized = normalizeEmail(email);
  const values = [];
  if (raw) values.push(raw);
  if (normalized && normalized !== raw) values.push(normalized);
  return values;
}

function emailsMatch(a, b) {
  if (!a || !b) return false;
  const aRaw = String(a).trim().toLowerCase();
  const bRaw = String(b).trim().toLowerCase();
  if (aRaw === bRaw) return true;
  const aNorm = normalizeEmail(a);
  const bNorm = normalizeEmail(b);
  return Boolean(aNorm && bNorm && aNorm === bNorm);
}

function buildEmailMatchClause(email) {
  const values = emailLookupValues(email);
  if (!values.length) return null;

  const placeholders = values.map(() => '?').join(', ');
  let sql = `email IN (${placeholders})`;
  const params = [...values];

  const normalized = normalizeEmail(email);
  const [, domain] = String(normalized).split('@');
  if (domain === 'gmail.com') {
    const local = String(normalized).split('@')[0];
    sql += ` OR (
      LOWER(SUBSTRING_INDEX(email, '@', -1)) IN ('gmail.com', 'googlemail.com')
      AND REPLACE(SUBSTRING_INDEX(SUBSTRING_INDEX(LOWER(email), '@', 1), '+', 1), '.', '') = ?
    )`;
    params.push(local);
  }

  return { sql, params };
}

async function findUsersByEmail(query, email) {
  const match = buildEmailMatchClause(email);
  if (!match) return [];
  return query(`SELECT * FROM users WHERE ${match.sql}`, match.params);
}

async function findEmailConflict(query, email, excludeUserId) {
  const match = buildEmailMatchClause(email);
  if (!match) return null;
  const sql = excludeUserId != null
    ? `SELECT id, email, role FROM users WHERE (${match.sql}) AND id != ? LIMIT 1`
    : `SELECT id, email, role FROM users WHERE ${match.sql} LIMIT 1`;
  const params = excludeUserId != null ? [...match.params, excludeUserId] : match.params;
  const rows = await query(sql, params);
  return rows[0] || null;
}

/**
 * Update users.email / users.phone without 500s on unique-email collisions.
 * Skips email when it is the same mailbox; canonicalizes only if free.
 */
async function applyUserContactUpdate(query, userId, { email, phone } = {}) {
  if (email === undefined && phone === undefined) return { ok: true };

  const [current] = await query('SELECT email, phone FROM users WHERE id = ?', [userId]);
  const updateFields = [];
  const updateValues = [];

  if (email) {
    const canonical = normalizeEmail(email) || String(email).trim().toLowerCase();
    const currentEmail = current?.email || '';

    if (!emailsMatch(currentEmail, canonical)) {
      const conflict = await findEmailConflict(query, canonical, userId);
      if (conflict) {
        return { ok: false, status: 409, message: 'Email already registered' };
      }
      updateFields.push('email = ?');
      updateValues.push(canonical);
    } else if (String(currentEmail).trim().toLowerCase() !== canonical) {
      const conflict = await findEmailConflict(query, canonical, userId);
      if (!conflict) {
        updateFields.push('email = ?');
        updateValues.push(canonical);
      }
    }
  }

  if (phone !== undefined) {
    updateFields.push('phone = ?');
    updateValues.push(phone);
  }

  if (updateFields.length > 0) {
    updateValues.push(userId);
    await query(
      `UPDATE users SET ${updateFields.join(', ')} WHERE id = ?`,
      updateValues
    );
  }

  return { ok: true };
}

function roleConflictMessage(existingRole) {
  return existingRole === 'provider'
    ? 'This email is already registered as an employer. Please sign in as an employer.'
    : 'This email is already registered as a job seeker. Please sign in as a candidate.';
}

module.exports = {
  normalizeEmail,
  emailLookupValues,
  emailsMatch,
  findUsersByEmail,
  findEmailConflict,
  applyUserContactUpdate,
  roleConflictMessage,
};
