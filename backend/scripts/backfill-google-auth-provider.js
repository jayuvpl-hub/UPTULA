#!/usr/bin/env node
/**
 * One-time backfill: mark legacy Google-created users as auth_provider='google'.
 *
 * Historical Google sign-in stored a dummy password:
 *   md5(uid || email)
 * which is always 32 lowercase hex characters. The users.auth_provider column
 * did not exist then, so those rows now default to 'local'.
 *
 * IMPORTANT: the legacy app also hashed REAL passwords with md5 (see
 * src/utils/password.js). On this database that means almost every pre-bcrypt
 * account matches the 32-hex pattern, not just Google placeholders. Dry-run
 * first and review the printed IDs before --apply.
 *
 * Usage (from backend/):
 *   node scripts/backfill-google-auth-provider.js
 *   node scripts/backfill-google-auth-provider.js --apply
 *
 * Only auth_provider is updated. firebase_uid and every other column are left
 * untouched. Production must not be targeted until the dry-run is confirmed.
 */
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });

const { query } = require('../src/db');
const { DB_CONFIG } = require('../src/config/env');

const APPLY = process.argv.includes('--apply');

// Google dummy hashes AND legacy local passwords were both md5() from the
// `md5` package: exactly 32 lowercase hex chars. Bcrypt hashes start with $2.
const LEGACY_MD5_PATTERN = '^[0-9a-f]{32}$';

const SELECT_SQL = `
  SELECT id, email, full_name, role, created_at
  FROM users
  WHERE auth_provider = 'local'
    AND password_hash REGEXP ?
  ORDER BY id
`;

async function main() {
  const dbLabel = `${DB_CONFIG.host}/${DB_CONFIG.database}`;
  console.log(`target  : ${dbLabel}`);
  console.log(`mode    : ${APPLY ? 'APPLY (writes auth_provider only)' : 'DRY-RUN (no writes)'}`);
  console.log(`matcher : auth_provider='local' AND password_hash REGEXP ${LEGACY_MD5_PATTERN}`);
  console.log('');

  const [counts] = await query(
    `
      SELECT
        SUM(password_hash REGEXP ?) AS md5_hex32,
        SUM(password_hash REGEXP '^\\\\$2[aby]\\\\$') AS bcrypt,
        COUNT(*) AS total
      FROM users
      WHERE auth_provider = 'local'
    `,
    [LEGACY_MD5_PATTERN]
  );

  const rows = await query(SELECT_SQL, [LEGACY_MD5_PATTERN]);

  console.log(
    `local users: total=${counts.total}  md5_hex32=${counts.md5_hex32}  bcrypt=${counts.bcrypt}`
  );
  console.log(`would update: ${rows.length} row(s)\n`);

  if (!rows.length) {
    console.log('Nothing to backfill.');
    process.exit(0);
  }

  if (Number(counts.bcrypt) > 0 && Number(counts.md5_hex32) > Number(counts.bcrypt) * 10) {
    console.warn(
      'WARNING: most local accounts still use 32-char md5 hashes because that was the app-wide password scheme, not a Google-only marker.'
    );
    console.warn(
      'Applying this set will also mark legacy password accounts as google. Review every ID below before --apply.\n'
    );
  }

  console.log('affected users (id | role | email):');
  rows.forEach((u) => {
    console.log(`  ${u.id}\t${u.role}\t${u.email}`);
  });

  if (!APPLY) {
    console.log(`\nDRY-RUN complete. ${rows.length} row(s) listed. Re-run with --apply to commit.`);
    process.exit(0);
  }

  const ids = rows.map((u) => u.id);
  const placeholders = ids.map(() => '?').join(',');
  const result = await query(
    `UPDATE users SET auth_provider = 'google' WHERE id IN (${placeholders}) AND auth_provider = 'local'`,
    ids
  );

  console.log(`\nAPPLY complete. rows affected: ${result.affectedRows}`);
  process.exit(0);
}

main().catch((err) => {
  console.error('backfill failed:', err.message);
  process.exit(1);
});
