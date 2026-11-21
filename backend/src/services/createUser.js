const { query } = require('../db');

/**
 * Insert a row into `users`. Callers own hashing, validation, and any
 * post-insert side effects (categories, employer_profiles, referrals, email).
 */
async function createUser({
  role,
  fullName,
  email,
  phone = null,
  passwordHash,
  categoryId = null,
  subcategoryId = null,
  experience = null,
}) {
  const result = await query(
    `INSERT INTO users (role, full_name, email, phone, password_hash, category_id, subcategory_id, experience)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      role,
      fullName,
      email,
      phone,
      passwordHash,
      categoryId,
      subcategoryId,
      experience,
    ]
  );
  return { userId: result.insertId };
}

module.exports = { createUser };
