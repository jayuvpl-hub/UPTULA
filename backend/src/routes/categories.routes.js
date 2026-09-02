const express = require('express');
const { query } = require('../db');
const { authenticate, authenticateAdmin } = require('../middleware/auth');
const { slugify } = require('../utils/slugify');

const router = express.Router();

function mapCategoryRow(row) {
  if (!row) return row;
  return {
    ...row,
    is_active: row.status === 'active' ? 1 : 0,
  };
}

/** GET /categories — public active list. Optional ?type=technical|non_technical */
router.get('/categories', async (req, res, next) => {
  try {
    const type = req.query.type === 'technical' || req.query.type === 'non_technical'
      ? req.query.type
      : null;
    const params = [];
    let where = "WHERE status = 'active'";
    if (type) {
      where += ' AND type = ?';
      params.push(type);
    }
    const rows = await query(
      `SELECT id, name, slug, type, description, sort_order, status
       FROM categories ${where}
       ORDER BY sort_order ASC, name ASC`,
      params
    );
    res.json({ categories: rows });
  } catch (err) {
    return next(err);
  }
});

/** GET /categories/:categoryId/subcategories */
router.get('/categories/:categoryId/subcategories', async (req, res, next) => {
  try {
    const categoryId = Number(req.params.categoryId);
    if (!categoryId) return res.status(400).json({ message: 'Invalid category id' });

    const subcategories = await query(
      `SELECT s.id, s.category_id, s.name, s.slug, s.description, s.sort_order, s.status
       FROM subcategories s
       INNER JOIN categories c ON c.id = s.category_id AND c.status = 'active'
       WHERE s.category_id = ? AND s.status = 'active'
       ORDER BY s.sort_order ASC, s.name ASC`,
      [categoryId]
    );
    res.json({ subcategories });
  } catch (err) {
    return next(err);
  }
});

/** GET /admin/stats */
router.get('/admin/stats', authenticate, authenticateAdmin, async (req, res, next) => {
  try {
    const [totals] = await query(`
      SELECT
        (SELECT COUNT(*) FROM categories) AS total_categories,
        (SELECT COUNT(*) FROM categories WHERE status = 'active') AS active_categories,
        (SELECT COUNT(*) FROM categories WHERE type = 'technical') AS technical_categories,
        (SELECT COUNT(*) FROM categories WHERE type = 'non_technical') AS non_technical_categories,
        (SELECT COUNT(*) FROM subcategories) AS total_subcategories,
        (SELECT COUNT(*) FROM subcategories WHERE status = 'active') AS active_subcategories,
        (SELECT COUNT(*) FROM users WHERE category_id IS NOT NULL) AS users_with_category
    `);
    const topCategories = await query(`
      SELECT c.id, c.name, COUNT(u.id) AS user_count
      FROM categories c
      LEFT JOIN users u ON u.category_id = c.id
      GROUP BY c.id, c.name
      ORDER BY user_count DESC
      LIMIT 10
    `);
    res.json({ stats: totals, topCategories });
  } catch (err) {
    return next(err);
  }
});

/** GET /admin/categories — search + pagination */
router.get('/admin/categories', authenticate, authenticateAdmin, async (req, res, next) => {
  try {
    const q = String(req.query.q || '').trim();
    const status = req.query.status || '';
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 50));
    const offset = (page - 1) * limit;
    const like = `%${q}%`;

    let where = 'WHERE 1=1';
    const params = [];
    if (q) {
      where += ' AND (c.name LIKE ? OR c.slug LIKE ?)';
      params.push(like, like);
    }
    if (status === 'active' || status === 'inactive') {
      where += ' AND c.status = ?';
      params.push(status);
    }

    const categories = await query(
      `SELECT c.*, (SELECT COUNT(*) FROM subcategories s WHERE s.category_id = c.id) AS subcategory_count,
              (SELECT COUNT(*) FROM users u WHERE u.category_id = c.id) AS user_count
       FROM categories c ${where}
       ORDER BY c.sort_order ASC, c.name ASC
       LIMIT ? OFFSET ?`,
      [...params, limit, offset]
    );

    const [totalRow] = await query(`SELECT COUNT(*) AS count FROM categories c ${where}`, params);

    res.json({
      categories: categories.map(mapCategoryRow),
      pagination: { page, limit, total: Number(totalRow.count) || 0 },
    });
  } catch (err) {
    return next(err);
  }
});

/** GET /admin/tree — full tree for filters */
router.get('/admin/tree', authenticate, authenticateAdmin, async (req, res, next) => {
  try {
    const includeInactive = req.query.includeInactive === '1';
    const catWhere = includeInactive ? '' : "WHERE status = 'active'";
    const subWhere = includeInactive ? '' : "WHERE status = 'active'";

    const categories = await query(
      `SELECT * FROM categories ${catWhere} ORDER BY sort_order ASC, name ASC`
    );
    const subcategories = await query(
      `SELECT * FROM subcategories ${subWhere} ORDER BY sort_order ASC, name ASC`
    );

    res.json({
      categories: categories.map((cat) => ({
        ...mapCategoryRow(cat),
        subcategories: subcategories
          .filter((s) => s.category_id === cat.id)
          .map(mapCategoryRow),
      })),
    });
  } catch (err) {
    return next(err);
  }
});

router.post('/admin/categories', authenticate, authenticateAdmin, async (req, res, next) => {
  try {
    const name = String(req.body.name || '').trim();
    const slug = slugify(req.body.slug || name);
    const description = req.body.description || null;
    const sortOrder = Number(req.body.sortOrder || 0);
    const status = req.body.status === 'inactive' ? 'inactive' : 'active';
    const type = req.body.type === 'non_technical' ? 'non_technical' : 'technical';

    if (!name) return res.status(400).json({ message: 'Category name is required' });

    const dup = await query('SELECT id FROM categories WHERE name = ? OR slug = ?', [name, slug]);
    if (dup.length) return res.status(400).json({ message: 'Category already exists' });

    const result = await query(
      `INSERT INTO categories (name, slug, type, description, status, sort_order) VALUES (?, ?, ?, ?, ?, ?)`,
      [name, slug, type, description, status, sortOrder]
    );
    res.status(201).json({ id: result.insertId, message: 'Category created' });
  } catch (err) {
    return next(err);
  }
});

router.put('/admin/categories/:id', authenticate, authenticateAdmin, async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const name = req.body.name != null ? String(req.body.name).trim() : null;
    const slug = req.body.slug != null ? slugify(req.body.slug) : null;
    const description = req.body.description;
    const sortOrder = req.body.sortOrder != null ? Number(req.body.sortOrder) : null;
    const status = req.body.status;
    const type = req.body.type === 'technical' || req.body.type === 'non_technical' ? req.body.type : null;

    if (name) {
      const dup = await query('SELECT id FROM categories WHERE (name = ? OR slug = ?) AND id != ?', [
        name,
        slug || slugify(name),
        id,
      ]);
      if (dup.length) return res.status(400).json({ message: 'Duplicate category name or slug' });
    }

    await query(
      `UPDATE categories SET
        name = COALESCE(?, name),
        slug = COALESCE(?, slug),
        type = COALESCE(?, type),
        description = COALESCE(?, description),
        sort_order = COALESCE(?, sort_order),
        status = COALESCE(?, status)
       WHERE id = ?`,
      [
        name,
        slug,
        type,
        description !== undefined ? description : null,
        sortOrder,
        status === 'active' || status === 'inactive' ? status : null,
        id,
      ]
    );
    res.json({ message: 'Category updated' });
  } catch (err) {
    return next(err);
  }
});

router.patch('/admin/categories/:id/status', authenticate, authenticateAdmin, async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const status = req.body.status === 'inactive' ? 'inactive' : 'active';
    await query('UPDATE categories SET status = ? WHERE id = ?', [status, id]);
    if (status === 'inactive') {
      await query('UPDATE subcategories SET status = ? WHERE category_id = ?', ['inactive', id]);
    }
    res.json({ message: 'Category status updated' });
  } catch (err) {
    return next(err);
  }
});

router.delete('/admin/categories/:id', authenticate, authenticateAdmin, async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const [users] = await query('SELECT COUNT(*) AS c FROM users WHERE category_id = ?', [id]);
    if (Number(users.c) > 0) {
      await query('UPDATE categories SET status = ? WHERE id = ?', ['inactive', id]);
      await query('UPDATE subcategories SET status = ? WHERE category_id = ?', ['inactive', id]);
      return res.json({ message: 'Category deactivated (users assigned)', softDeleted: true });
    }
    await query('DELETE FROM categories WHERE id = ?', [id]);
    res.json({ message: 'Category deleted' });
  } catch (err) {
    return next(err);
  }
});

/** GET /admin/subcategories */
router.get('/admin/subcategories', authenticate, authenticateAdmin, async (req, res, next) => {
  try {
    const q = String(req.query.q || '').trim();
    const categoryId = req.query.categoryId ? Number(req.query.categoryId) : null;
    const status = req.query.status || '';
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 50));
    const offset = (page - 1) * limit;
    const like = `%${q}%`;

    let where = 'WHERE 1=1';
    const params = [];
    if (q) {
      where += ' AND (s.name LIKE ? OR s.slug LIKE ?)';
      params.push(like, like);
    }
    if (categoryId) {
      where += ' AND s.category_id = ?';
      params.push(categoryId);
    }
    if (status === 'active' || status === 'inactive') {
      where += ' AND s.status = ?';
      params.push(status);
    }

    const rows = await query(
      `SELECT s.*, c.name AS category_name,
              (SELECT COUNT(*) FROM users u WHERE u.subcategory_id = s.id) AS user_count
       FROM subcategories s
       INNER JOIN categories c ON c.id = s.category_id
       ${where}
       ORDER BY c.sort_order, s.sort_order, s.name
       LIMIT ? OFFSET ?`,
      [...params, limit, offset]
    );
    const [totalRow] = await query(
      `SELECT COUNT(*) AS count FROM subcategories s ${where}`,
      params
    );

    res.json({
      subcategories: rows.map(mapCategoryRow),
      pagination: { page, limit, total: Number(totalRow.count) || 0 },
    });
  } catch (err) {
    return next(err);
  }
});

router.post('/admin/categories/:categoryId/subcategories', authenticate, authenticateAdmin, async (req, res, next) => {
  try {
    const categoryId = Number(req.params.categoryId);
    const name = String(req.body.name || '').trim();
    const slug = slugify(req.body.slug || `${categoryId}_${name}`);
    const description = req.body.description || null;
    const sortOrder = Number(req.body.sortOrder || 0);
    const status = req.body.status === 'inactive' ? 'inactive' : 'active';

    if (!categoryId || !name) {
      return res.status(400).json({ message: 'Category id and subcategory name are required' });
    }

    const cat = await query('SELECT id FROM categories WHERE id = ?', [categoryId]);
    if (!cat.length) return res.status(404).json({ message: 'Category not found' });

    const dup = await query(
      'SELECT id FROM subcategories WHERE category_id = ? AND (name = ? OR slug = ?)',
      [categoryId, name, slug]
    );
    if (dup.length) return res.status(400).json({ message: 'Subcategory already exists in this category' });

    const result = await query(
      `INSERT INTO subcategories (category_id, name, slug, description, status, sort_order)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [categoryId, name, slug, description, status, sortOrder]
    );
    res.status(201).json({ id: result.insertId, message: 'Subcategory created' });
  } catch (err) {
    return next(err);
  }
});

router.put('/admin/subcategories/:id', authenticate, authenticateAdmin, async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const name = req.body.name != null ? String(req.body.name).trim() : null;
    const categoryId = req.body.categoryId != null ? Number(req.body.categoryId) : null;
    const slug = req.body.slug != null ? slugify(req.body.slug) : null;
    const description = req.body.description;
    const sortOrder = req.body.sortOrder != null ? Number(req.body.sortOrder) : null;
    const status = req.body.status;

    const current = await query('SELECT category_id FROM subcategories WHERE id = ?', [id]);
    if (!current.length) return res.status(404).json({ message: 'Subcategory not found' });

    const targetCatId = categoryId || current[0].category_id;
    if (name) {
      const dup = await query(
        'SELECT id FROM subcategories WHERE category_id = ? AND (name = ? OR slug = ?) AND id != ?',
        [targetCatId, name, slug || slugify(name), id]
      );
      if (dup.length) return res.status(400).json({ message: 'Duplicate subcategory' });
    }

    await query(
      `UPDATE subcategories SET
        category_id = COALESCE(?, category_id),
        name = COALESCE(?, name),
        slug = COALESCE(?, slug),
        description = COALESCE(?, description),
        sort_order = COALESCE(?, sort_order),
        status = COALESCE(?, status)
       WHERE id = ?`,
      [
        categoryId,
        name,
        slug,
        description !== undefined ? description : null,
        sortOrder,
        status === 'active' || status === 'inactive' ? status : null,
        id,
      ]
    );
    res.json({ message: 'Subcategory updated' });
  } catch (err) {
    return next(err);
  }
});

router.patch('/admin/subcategories/:id/status', authenticate, authenticateAdmin, async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const status = req.body.status === 'inactive' ? 'inactive' : 'active';
    await query('UPDATE subcategories SET status = ? WHERE id = ?', [status, id]);
    res.json({ message: 'Subcategory status updated' });
  } catch (err) {
    return next(err);
  }
});

router.delete('/admin/subcategories/:id', authenticate, authenticateAdmin, async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const [users] = await query('SELECT COUNT(*) AS c FROM users WHERE subcategory_id = ?', [id]);
    if (Number(users.c) > 0) {
      await query('UPDATE subcategories SET status = ? WHERE id = ?', ['inactive', id]);
      return res.json({ message: 'Subcategory deactivated (users assigned)', softDeleted: true });
    }
    await query('DELETE FROM subcategories WHERE id = ?', [id]);
    res.json({ message: 'Subcategory deleted' });
  } catch (err) {
    return next(err);
  }
});

/** Legacy PATCH (backward compat with older admin UI) */
router.patch('/admin/categories/:id', authenticate, authenticateAdmin, async (req, res, next) => {
  try {
    if (req.body.isActive != null) {
      req.body.status = req.body.isActive ? 'active' : 'inactive';
    }
    const id = Number(req.params.id);
    const { name, description, sortOrder, status, type } = req.body;
    await query(
      `UPDATE categories SET
        name = COALESCE(?, name),
        description = COALESCE(?, description),
        sort_order = COALESCE(?, sort_order),
        status = COALESCE(?, status),
        type = COALESCE(?, type)
       WHERE id = ?`,
      [
        name != null ? String(name).trim() : null,
        description !== undefined ? description : null,
        sortOrder != null ? Number(sortOrder) : null,
        status === 'active' || status === 'inactive' ? status : null,
        type === 'technical' || type === 'non_technical' ? type : null,
        id,
      ]
    );
    res.json({ message: 'Category updated' });
  } catch (err) {
    return next(err);
  }
});

router.patch('/admin/subcategories/:id', authenticate, authenticateAdmin, async (req, res, next) => {
  try {
    if (req.body.isActive != null) {
      req.body.status = req.body.isActive ? 'active' : 'inactive';
    }
    const id = Number(req.params.id);
    const { name, sortOrder, status } = req.body;
    await query(
      `UPDATE subcategories SET
        name = COALESCE(?, name),
        sort_order = COALESCE(?, sort_order),
        status = COALESCE(?, status)
       WHERE id = ?`,
      [
        name != null ? String(name).trim() : null,
        sortOrder != null ? Number(sortOrder) : null,
        status === 'active' || status === 'inactive' ? status : null,
        id,
      ]
    );
    res.json({ message: 'Subcategory updated' });
  } catch (err) {
    return next(err);
  }
});

module.exports = router;
