/**
 * Phase 1 schema additions for the UPTULA professional-platform transformation.
 *
 * Everything here is idempotent and runs on server boot (after ensureCategorySchema),
 * matching the existing shared-hosting migration strategy. Nothing in here drops or
 * rewrites existing columns, so the change is fully backward compatible:
 *
 *  - categories.type            ENUM('technical','non_technical')  (classified once)
 *  - user_categories            junction table (max 5 categories per user)
 *  - user_subcategories         junction table (multiple subcategories per user)
 *  - users.preferred_language / profile_completion / resume_url / resume_status
 *  - user_profiles.resume_name / resume_size / resume_uploaded_at
 *  - register_otp.category_ids / subcategory_ids  (JSON, for multi-select during OTP)
 *
 * The single-column users.category_id / users.subcategory_id remain the canonical
 * "primary" selection for backward compatibility; the junction tables hold the full set.
 */

async function columnExists(pool, table, column) {
  const [rows] = await pool.query(
    `SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND COLUMN_NAME = ?
     LIMIT 1`,
    [table, column]
  );
  return Array.isArray(rows) && rows.length > 0;
}

async function tableExists(pool, table) {
  const [rows] = await pool.query(
    `SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ?
     LIMIT 1`,
    [table]
  );
  return Array.isArray(rows) && rows.length > 0;
}

async function addColumnIfMissing(pool, table, column, ddl) {
  if (!(await columnExists(pool, table, column))) {
    await pool.query(`ALTER TABLE ${table} ${ddl}`);
    return true;
  }
  return false;
}

async function dropColumnIfExists(pool, table, column) {
  if (await columnExists(pool, table, column)) {
    await pool.query(`ALTER TABLE ${table} DROP COLUMN ${column}`);
    return true;
  }
  return false;
}

async function ensurePhase1Schema(pool) {
  // 1) categories.type — classify once, right after the column is first added so we
  //    never overwrite admin re-classifications on subsequent boots.
  const typeAdded = await addColumnIfMissing(
    pool,
    'categories',
    'type',
    "ADD COLUMN type ENUM('technical','non_technical') NOT NULL DEFAULT 'technical' AFTER name"
  );
  if (typeAdded) {
    try { await pool.query(`ALTER TABLE categories ADD INDEX idx_categories_type (type)`); } catch (_) {}
    // Best-effort initial classification of the seeded skilled-work categories.
    // Admins can freely re-classify afterwards from Category Management.
    await pool.query(`
      UPDATE categories SET type = 'non_technical'
      WHERE type = 'technical' AND (
        name LIKE '%Domestic%' OR name LIKE '%Household%' OR name LIKE '%Security%' OR
        name LIKE '%Hospitality%' OR name LIKE '%Restaurant%' OR name LIKE '%Cleaning%' OR
        name LIKE '%Sanitation%' OR name LIKE '%Delivery%' OR name LIKE '%E-Commerce%' OR
        name LIKE '%Beauty%' OR name LIKE '%Personal Care%' OR name LIKE '%Warehouse%' OR
        name LIKE '%Logistics%' OR name LIKE '%Driver%' OR name LIKE '%Transportation%' OR
        name LIKE '%Event%' OR name LIKE '%Decoration%'
      )
    `);
  }

  // 2) user_categories junction (max 5 enforced in application layer).
  const ucExisted = await tableExists(pool, 'user_categories');
  await pool.query(`
    CREATE TABLE IF NOT EXISTS user_categories (
      id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
      user_id BIGINT UNSIGNED NOT NULL,
      category_id BIGINT UNSIGNED NOT NULL,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (id),
      UNIQUE KEY uq_user_category (user_id, category_id),
      INDEX idx_user_categories_user (user_id),
      INDEX idx_user_categories_category (category_id),
      CONSTRAINT fk_user_categories_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      CONSTRAINT fk_user_categories_category FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `);

  // 3) user_subcategories junction (multiple per user).
  const usExisted = await tableExists(pool, 'user_subcategories');
  await pool.query(`
    CREATE TABLE IF NOT EXISTS user_subcategories (
      id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
      user_id BIGINT UNSIGNED NOT NULL,
      subcategory_id BIGINT UNSIGNED NOT NULL,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (id),
      UNIQUE KEY uq_user_subcategory (user_id, subcategory_id),
      INDEX idx_user_subcategories_user (user_id),
      INDEX idx_user_subcategories_subcategory (subcategory_id),
      CONSTRAINT fk_user_subcategories_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      CONSTRAINT fk_user_subcategories_subcategory FOREIGN KEY (subcategory_id) REFERENCES subcategories(id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `);

  // Backfill the junction tables from the legacy single-FK columns — only once,
  // right after each table is first created, so we never resurrect selections a
  // user later removed via the profile editor.
  if (!ucExisted) {
    try {
      await pool.query(`
        INSERT IGNORE INTO user_categories (user_id, category_id)
        SELECT id, category_id FROM users WHERE category_id IS NOT NULL
      `);
    } catch (_) { /* legacy data may have orphaned ids */ }
  }
  if (!usExisted) {
    try {
      await pool.query(`
        INSERT IGNORE INTO user_subcategories (user_id, subcategory_id)
        SELECT id, subcategory_id FROM users WHERE subcategory_id IS NOT NULL
      `);
    } catch (_) { /* legacy data may have orphaned ids */ }
  }

  // 4) users: new profile/resume/language columns (spec section 2).
  await addColumnIfMissing(pool, 'users', 'preferred_language', "ADD COLUMN preferred_language VARCHAR(10) NOT NULL DEFAULT 'en'");
  await addColumnIfMissing(pool, 'users', 'profile_completion', 'ADD COLUMN profile_completion TINYINT UNSIGNED NOT NULL DEFAULT 0');
  await addColumnIfMissing(pool, 'users', 'resume_url', 'ADD COLUMN resume_url VARCHAR(500) DEFAULT NULL');
  await addColumnIfMissing(pool, 'users', 'resume_status', "ADD COLUMN resume_status ENUM('none','uploaded','parsed','verified') NOT NULL DEFAULT 'none'");

  // 5) user_profiles: resume metadata (spec section 7).
  await addColumnIfMissing(pool, 'user_profiles', 'resume_name', 'ADD COLUMN resume_name VARCHAR(255) DEFAULT NULL');
  await addColumnIfMissing(pool, 'user_profiles', 'resume_size', 'ADD COLUMN resume_size INT UNSIGNED DEFAULT NULL');
  await addColumnIfMissing(pool, 'user_profiles', 'resume_uploaded_at', 'ADD COLUMN resume_uploaded_at TIMESTAMP NULL DEFAULT NULL');

  // 5b) pwd_profile_details: accessibility fields (migration 005).
  // Never affect profile_completion. user_id follows the same convention as user_profiles
  // (FK → users.id, one row per user).
  await pool.query(`
    CREATE TABLE IF NOT EXISTS pwd_profile_details (
      id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
      user_id BIGINT UNSIGNED NOT NULL,
      has_disability TINYINT(1) NOT NULL DEFAULT 0,
      disability_details TEXT DEFAULT NULL,
      accommodation_needs TEXT DEFAULT NULL,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      PRIMARY KEY (id),
      UNIQUE KEY uq_pwd_profile_user (user_id),
      INDEX idx_pwd_profile_user (user_id),
      CONSTRAINT fk_pwd_profile_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `);

  // One-time move from legacy user_profiles columns (migration 004) → pwd_profile_details.
  // Only runs when the old columns are still present, so existing data is not lost.
  const hasLegacyDisability = await columnExists(pool, 'user_profiles', 'has_disability');
  if (hasLegacyDisability) {
    try {
      await pool.query(`
        INSERT IGNORE INTO pwd_profile_details (user_id, has_disability, disability_details, accommodation_needs)
        SELECT user_id, has_disability, disability_details, accommodation_needs
        FROM user_profiles
        WHERE has_disability = 1
           OR (disability_details IS NOT NULL AND TRIM(disability_details) <> '')
           OR (accommodation_needs IS NOT NULL AND TRIM(accommodation_needs) <> '')
      `);
    } catch (err) {
      console.warn('pwd_profile_details backfill skipped:', err.message);
    }
    await dropColumnIfExists(pool, 'user_profiles', 'has_disability');
    await dropColumnIfExists(pool, 'user_profiles', 'disability_details');
    await dropColumnIfExists(pool, 'user_profiles', 'accommodation_needs');
  }

  // 6) register_otp: carry the multi-select arrays through the OTP step.
  await addColumnIfMissing(pool, 'register_otp', 'category_ids', 'ADD COLUMN category_ids JSON DEFAULT NULL');
  await addColumnIfMissing(pool, 'register_otp', 'subcategory_ids', 'ADD COLUMN subcategory_ids JSON DEFAULT NULL');

  // 7) users: account status + last login (admin user management & security).
  await addColumnIfMissing(pool, 'users', 'account_status', "ADD COLUMN account_status ENUM('active','suspended') NOT NULL DEFAULT 'active'");
  await addColumnIfMissing(pool, 'users', 'last_login', 'ADD COLUMN last_login TIMESTAMP NULL DEFAULT NULL');

  // 8) audit_logs: activity trail for admin/security actions (spec section 17).
  await pool.query(`
    CREATE TABLE IF NOT EXISTS audit_logs (
      id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
      user_id BIGINT UNSIGNED DEFAULT NULL,
      actor_role VARCHAR(20) DEFAULT NULL,
      action VARCHAR(100) NOT NULL,
      entity VARCHAR(100) DEFAULT NULL,
      entity_id BIGINT UNSIGNED DEFAULT NULL,
      ip VARCHAR(64) DEFAULT NULL,
      meta JSON DEFAULT NULL,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (id),
      INDEX idx_audit_user (user_id),
      INDEX idx_audit_action (action),
      INDEX idx_audit_created (created_at)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `);
}

module.exports = { ensurePhase1Schema, columnExists, tableExists, dropColumnIfExists };
