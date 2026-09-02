const { seedCategories } = require('./seeders/categorySeeder');

/**
 * User registration categories (categories / subcategories tables).
 * Migrates legacy registration_* columns when present.
 */
async function ensureCategorySchema(pool) {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS categories (
      id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
      name VARCHAR(150) NOT NULL,
      slug VARCHAR(150) NOT NULL,
      description TEXT DEFAULT NULL,
      status ENUM('active','inactive') NOT NULL DEFAULT 'active',
      sort_order INT NOT NULL DEFAULT 0,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      PRIMARY KEY (id),
      UNIQUE KEY uq_categories_slug (slug),
      UNIQUE KEY uq_categories_name (name),
      INDEX idx_categories_status (status),
      INDEX idx_categories_sort (sort_order)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS subcategories (
      id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
      category_id BIGINT UNSIGNED NOT NULL,
      name VARCHAR(150) NOT NULL,
      slug VARCHAR(180) NOT NULL,
      description TEXT DEFAULT NULL,
      status ENUM('active','inactive') NOT NULL DEFAULT 'active',
      sort_order INT NOT NULL DEFAULT 0,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      PRIMARY KEY (id),
      UNIQUE KEY uq_subcategories_slug (slug),
      UNIQUE KEY uq_subcategories_cat_name (category_id, name),
      INDEX idx_subcategories_category (category_id),
      INDEX idx_subcategories_status (status),
      CONSTRAINT fk_subcategories_category
        FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `);

  const userCols = [
    { name: 'category_id', ddl: 'ADD COLUMN category_id BIGINT UNSIGNED NULL DEFAULT NULL' },
    { name: 'subcategory_id', ddl: 'ADD COLUMN subcategory_id BIGINT UNSIGNED NULL DEFAULT NULL' },
    { name: 'experience', ddl: "ADD COLUMN experience ENUM('fresher','experience') NULL DEFAULT NULL" },
  ];

  for (const col of userCols) {
    const [rows] = await pool.query(
      `SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS
       WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'users' AND COLUMN_NAME = ?`,
      [col.name]
    );
    if (!rows.length) await pool.query(`ALTER TABLE users ${col.ddl}`);
  }

  const otpCols = [
    { name: 'category_id', ddl: 'ADD COLUMN category_id BIGINT UNSIGNED NULL' },
    { name: 'subcategory_id', ddl: 'ADD COLUMN subcategory_id BIGINT UNSIGNED NULL' },
    { name: 'experience', ddl: "ADD COLUMN experience ENUM('fresher','experience') NULL" },
  ];

  for (const col of otpCols) {
    const [rows] = await pool.query(
      `SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS
       WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'register_otp' AND COLUMN_NAME = ?`,
      [col.name]
    );
    if (!rows.length) await pool.query(`ALTER TABLE register_otp ${col.ddl}`);
  }

  await migrateLegacyRegistrationColumns(pool);
  await addUserCategoryForeignKeys(pool);
  await seedCategories(pool);
}

async function migrateLegacyRegistrationColumns(pool) {
  const [legacyCat] = await pool.query(
    `SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'users' AND COLUMN_NAME = 'registration_category_id'`
  );
  if (!legacyCat.length) return;

  try {
    await pool.query(`
      UPDATE users u
      INNER JOIN registration_categories rc ON rc.id = u.registration_category_id
      INNER JOIN categories c ON c.slug = rc.slug
      SET u.category_id = c.id
      WHERE u.category_id IS NULL AND u.registration_category_id IS NOT NULL
    `);
    await pool.query(`
      UPDATE users u
      INNER JOIN registration_subcategories rs ON rs.id = u.registration_subcategory_id
      INNER JOIN subcategories s ON s.slug = rs.slug
      SET u.subcategory_id = s.id
      WHERE u.subcategory_id IS NULL AND u.registration_subcategory_id IS NOT NULL
    `);
    await pool.query(`
      UPDATE register_otp r
      INNER JOIN registration_categories rc ON rc.id = r.registration_category_id
      INNER JOIN categories c ON c.slug = rc.slug
      SET r.category_id = c.id
      WHERE r.category_id IS NULL AND r.registration_category_id IS NOT NULL
    `);
  } catch (_) {
    /* legacy tables may not exist */
  }
}

async function addUserCategoryForeignKeys(pool) {
  const [fkCat] = await pool.query(
    `SELECT CONSTRAINT_NAME FROM INFORMATION_SCHEMA.TABLE_CONSTRAINTS
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'users' AND CONSTRAINT_NAME = 'fk_users_category'`
  );
  if (!fkCat.length) {
    try {
      await pool.query(`
        ALTER TABLE users
        ADD CONSTRAINT fk_users_category
        FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL
      `);
    } catch (_) {
      /* ignore if invalid legacy ids */
    }
  }

  const [fkSub] = await pool.query(
    `SELECT CONSTRAINT_NAME FROM INFORMATION_SCHEMA.TABLE_CONSTRAINTS
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'users' AND CONSTRAINT_NAME = 'fk_users_subcategory'`
  );
  if (!fkSub.length) {
    try {
      await pool.query(`
        ALTER TABLE users
        ADD CONSTRAINT fk_users_subcategory
        FOREIGN KEY (subcategory_id) REFERENCES subcategories(id) ON DELETE SET NULL
      `);
    } catch (_) {
      /* ignore */
    }
  }
}

module.exports = { ensureCategorySchema };
