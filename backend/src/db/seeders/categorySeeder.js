const path = require('path');
const { slugify } = require('../../utils/slugify');

const SEED_FILE = path.join(__dirname, 'categorySeedData.json');

/**
 * Seed categories + subcategories when table is empty or SEED_CATEGORIES=force.
 */
async function seedCategories(pool) {
  const force = process.env.SEED_CATEGORIES === 'force';
  const [countRows] = await pool.query('SELECT COUNT(*) AS c FROM categories');
  const count = Number(countRows[0].c);

  if (count > 0 && !force) {
    return { seeded: false, reason: 'categories already exist' };
  }

  if (force && count > 0) {
    await pool.query('SET FOREIGN_KEY_CHECKS = 0');
    await pool.query('TRUNCATE TABLE subcategories');
    await pool.query('TRUNCATE TABLE categories');
    await pool.query('SET FOREIGN_KEY_CHECKS = 1');
  }

  const raw = require(SEED_FILE);
  let sortOrder = 0;

  for (const [categoryName, subNames] of raw) {
    const catSlug = slugify(categoryName);
    const [ins] = await pool.query(
      `INSERT INTO categories (name, slug, description, status, sort_order) VALUES (?, ?, NULL, 'active', ?)`,
      [categoryName, catSlug, sortOrder++]
    );
    const categoryId = ins.insertId;
    let subSort = 0;
    for (const subName of subNames) {
      const subSlug = slugify(`${catSlug}_${subName}`);
      await pool.query(
        `INSERT INTO subcategories (category_id, name, slug, description, status, sort_order)
         VALUES (?, ?, ?, NULL, 'active', ?)`,
        [categoryId, subName, subSlug, subSort++]
      );
    }
  }

  return { seeded: true, categories: raw.length };
}

module.exports = { seedCategories };
