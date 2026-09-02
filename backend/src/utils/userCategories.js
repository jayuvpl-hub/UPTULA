const { getPool } = require('../db');

/**
 * Replace a user's category/subcategory selection.
 *
 * Writes the full set to the junction tables (user_categories / user_subcategories)
 * and keeps the legacy single-FK columns (users.category_id / users.subcategory_id)
 * pointed at the "primary" (first) selection for backward compatibility with all
 * existing code paths that still read those columns.
 *
 * Runs inside a transaction. Caller is expected to have already validated the ids
 * (see utils/categoryValidation.validateCategoryList).
 */
async function setUserCategories(userId, categoryIds = [], subcategoryIds = []) {
  const uid = Number(userId);
  if (!uid) throw new Error('setUserCategories: invalid userId');

  const cats = [...new Set((categoryIds || []).map(Number).filter((n) => Number.isInteger(n) && n > 0))];
  const subs = [...new Set((subcategoryIds || []).map(Number).filter((n) => Number.isInteger(n) && n > 0))];

  const pool = getPool();
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    await conn.query('DELETE FROM user_categories WHERE user_id = ?', [uid]);
    await conn.query('DELETE FROM user_subcategories WHERE user_id = ?', [uid]);

    if (cats.length) {
      const values = cats.map(() => '(?, ?)').join(',');
      const params = cats.flatMap((cid) => [uid, cid]);
      await conn.query(`INSERT IGNORE INTO user_categories (user_id, category_id) VALUES ${values}`, params);
    }
    if (subs.length) {
      const values = subs.map(() => '(?, ?)').join(',');
      const params = subs.flatMap((sid) => [uid, sid]);
      await conn.query(`INSERT IGNORE INTO user_subcategories (user_id, subcategory_id) VALUES ${values}`, params);
    }

    // Keep legacy single-FK columns in sync with the primary selection.
    await conn.query('UPDATE users SET category_id = ?, subcategory_id = ? WHERE id = ?', [
      cats[0] || null,
      subs[0] || null,
      uid,
    ]);

    await conn.commit();
  } catch (err) {
    try { await conn.rollback(); } catch (_) {}
    throw err;
  } finally {
    conn.release();
  }

  return { categoryIds: cats, subcategoryIds: subs };
}

/** Fetch a user's selected categories + subcategories (with names) from the junction tables. */
async function getUserCategories(userId) {
  const pool = getPool();
  const [categories] = await pool.query(
    `SELECT c.id, c.name, c.slug, c.type
     FROM user_categories uc
     INNER JOIN categories c ON c.id = uc.category_id
     WHERE uc.user_id = ?
     ORDER BY c.sort_order ASC, c.name ASC`,
    [userId]
  );
  const [subcategories] = await pool.query(
    `SELECT s.id, s.category_id, s.name, s.slug
     FROM user_subcategories us
     INNER JOIN subcategories s ON s.id = us.subcategory_id
     WHERE us.user_id = ?
     ORDER BY s.sort_order ASC, s.name ASC`,
    [userId]
  );
  return { categories, subcategories };
}

module.exports = { setUserCategories, getUserCategories };
