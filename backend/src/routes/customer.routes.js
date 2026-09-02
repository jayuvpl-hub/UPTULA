const express = require('express');
const { body } = require('express-validator');
const jwt = require('jsonwebtoken');
const { authenticate } = require('../middleware/auth');
const { JWT_SECRET } = require('../config/env');
const { query } = require('../db');
const md5 = require('md5');

const router = express.Router();

// Simple role guard for customer service
const authenticateCustomer = (req, res, next) => {
	if (req.user && req.user.role === 'customer_service') {
		return next();
	}
	return res.status(403).json({ message: 'Access denied. Customer Service only.' });
};

// Login (fixed credentials similar to admin)
router.post(
	'/login',
	[body('email').isEmail(), body('password').isLength({ min: 1 })],
	async (req, res, next) => {
		try {
			const { validationResult } = require('express-validator');
			const errors = validationResult(req);
			if (!errors.isEmpty()) {
				return res.status(400).json({ errors: errors.array() });
			}
			const { email, password } = req.body;

			// Hardcoded CS credentials (parallel to admin approach)
			if (email === 'cs@uptula.com' && password === 'cs@uptula78945') {
				const csUser = {
					id: 'cs-1',
					email: 'cs@uptula.com',
					role: 'customer_service',
				};

				const token = jwt.sign(csUser, JWT_SECRET, { expiresIn: '24h' });
				return res.json({ token, user: csUser });
			}

			return res.status(401).json({ message: 'Invalid credentials' });
		} catch (err) {
			return next(err);
		}
	}
);

// Verify session
router.get('/verify', authenticate, authenticateCustomer, (req, res) => {
	return res.json({ user: req.user });
});

// Payments listing with employer contact details
router.get('/payments', authenticate, authenticateCustomer, async (req, res, next) => {
	try {
		const { page = 1, limit = 20, status, type, q } = req.query;
		const offset = (page - 1) * limit;

		let whereClause = '';
		const params = [];
		const conditions = [];
		if (status) {
			conditions.push('p.status = ?');
			params.push(status);
		}
		if (type) {
			conditions.push('p.payment_type = ?');
			params.push(type);
		}
		if (q) {
			conditions.push('(p.description LIKE ? OR u.full_name LIKE ? OR u.email LIKE ? OR u.phone LIKE ?)');
			params.push(`%${q}%`, `%${q}%`, `%${q}%`, `%${q}%`);
		}
		if (conditions.length > 0) whereClause = 'WHERE ' + conditions.join(' AND ');

		const payments = await query(
			`
      SELECT 
        p.id,
        p.amount,
        p.currency,
        p.payment_method,
        p.transaction_id,
        p.status,
        p.payment_type,
        p.description,
        p.created_at,
        u.id as user_id,
        u.full_name,
        u.email,
        u.phone,
        u.role
      FROM payments p
      JOIN users u ON u.id = p.user_id
      ${whereClause}
      ORDER BY p.created_at DESC
      LIMIT ? OFFSET ?
    `,
			[...params, parseInt(limit), parseInt(offset)]
		);

		const totalCount = await query(
			`
      SELECT COUNT(*) as count
      FROM payments p
      JOIN users u ON u.id = p.user_id
      ${whereClause}
    `,
			params
		);

		return res.json({
			payments,
			pagination: {
				page: parseInt(page),
				limit: parseInt(limit),
				total: totalCount[0].count,
				pages: Math.ceil(totalCount[0].count / limit),
			},
		});
	} catch (err) {
		return next(err);
	}
});

// Employer lookup and account details
router.get('/employers', authenticate, authenticateCustomer, async (req, res, next) => {
	try {
		const { q = '', page = 1, limit = 20 } = req.query;
		const offset = (page - 1) * limit;
		const like = `%${q}%`;
		const rows = await query(
			`
      SELECT id, full_name, email, phone, role, created_at
      FROM users
      WHERE role = 'provider' AND (full_name LIKE ? OR email LIKE ? OR phone LIKE ?)
      ORDER BY created_at DESC
      LIMIT ? OFFSET ?
    `,
			[like, like, like, parseInt(limit), parseInt(offset)]
		);
		const count = await query(
			`SELECT COUNT(*) as count FROM users WHERE role = 'provider' AND (full_name LIKE ? OR email LIKE ? OR phone LIKE ?)`,
			[like, like, like]
		);
		return res.json({
			employers: rows,
			pagination: {
				page: parseInt(page),
				limit: parseInt(limit),
				total: count[0].count,
				pages: Math.ceil(count[0].count / limit),
			},
		});
	} catch (err) {
		return next(err);
	}
});

router.get('/employers/:id', authenticate, authenticateCustomer, async (req, res, next) => {
	try {
		const { id } = req.params;
		const [user] = await query(
			`SELECT id, full_name, email, phone, role, created_at FROM users WHERE id = ? AND role = 'provider' LIMIT 1`,
			[id]
		);
		if (!user) return res.status(404).json({ message: 'Employer not found' });

		// Basic job counts
		const [jobsCount] = await query(`SELECT COUNT(*) as count FROM jobs WHERE employer_id = ?`, [id]);

		return res.json({
			employer: user,
			stats: {
				numJobs: jobsCount.count || 0,
			},
		});
	} catch (err) {
		return next(err);
	}
});

// Usage history (boolean search, resume scoring, payments)
router.get('/employers/:id/usage', authenticate, authenticateCustomer, async (req, res, next) => {
	try {
		const { id } = req.params;
		// boolean search trial info
		const bs = await query(
			`SELECT has_used_pro_trial FROM boolean_search_usage WHERE employer_id = ? LIMIT 1`,
			[id]
		);
		// resume scoring usage (last 30 days)
		const rs = await query(
			`SELECT usage_date, COUNT(*) as count
       FROM resume_scoring_usage
       WHERE employer_id = ? AND usage_date >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)
       GROUP BY usage_date
       ORDER BY usage_date DESC`,
			[id]
		);
		// recent payments
		const pays = await query(
			`SELECT id, amount, currency, payment_method, transaction_id, status, payment_type, description, created_at
       FROM payments WHERE user_id = ? ORDER BY created_at DESC LIMIT 50`,
			[id]
		);
		return res.json({
			booleanSearch: bs.length ? bs[0] : { has_used_pro_trial: 0 },
			resumeScoringDailyLast30: rs,
			recentPayments: pays,
		});
	} catch (err) {
		return next(err);
	}
});

// Ensure support_tickets table
async function ensureTicketsTable() {
	await query(`
    CREATE TABLE IF NOT EXISTS support_tickets (
      id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
      employer_id BIGINT UNSIGNED NOT NULL,
      created_by VARCHAR(64) NOT NULL, -- cs user id or email
      subject VARCHAR(255) NOT NULL,
      category ENUM('billing','login','job_posting','general') NOT NULL DEFAULT 'general',
      priority ENUM('low','medium','high','urgent') NOT NULL DEFAULT 'medium',
      status ENUM('open','pending','resolved','closed') NOT NULL DEFAULT 'open',
      description TEXT,
      resolution_notes TEXT,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      PRIMARY KEY (id),
      INDEX idx_support_tickets_employer (employer_id),
      INDEX idx_support_tickets_status (status),
      INDEX idx_support_tickets_category (category),
      FOREIGN KEY (employer_id) REFERENCES users(id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `);
}

// Tickets: list with filters
router.get('/tickets', authenticate, authenticateCustomer, async (req, res, next) => {
	try {
		await ensureTicketsTable();
		const { page = 1, limit = 20, status, category, q, employerId } = req.query;
		const offset = (page - 1) * limit;
		const params = [];
		const conditions = [];
		if (status) { conditions.push('t.status = ?'); params.push(status); }
		if (category) { conditions.push('t.category = ?'); params.push(category); }
		if (employerId) { conditions.push('t.employer_id = ?'); params.push(employerId); }
		if (q) {
			conditions.push('(t.subject LIKE ? OR t.description LIKE ?)');
			params.push(`%${q}%`, `%${q}%`);
		}
		const whereClause = conditions.length ? 'WHERE ' + conditions.join(' AND ') : '';
		const rows = await query(
			`SELECT t.*, u.full_name, u.email 
       FROM support_tickets t
       JOIN users u ON u.id = t.employer_id
       ${whereClause}
       ORDER BY t.updated_at DESC
       LIMIT ? OFFSET ?`,
			[...params, parseInt(limit), parseInt(offset)]
		);
		const count = await query(
			`SELECT COUNT(*) as count FROM support_tickets t ${whereClause}`,
			params
		);
		return res.json({
			tickets: rows,
			pagination: {
				page: parseInt(page),
				limit: parseInt(limit),
				total: count[0].count,
				pages: Math.ceil(count[0].count / limit),
			},
		});
	} catch (err) {
		return next(err);
	}
});

router.post('/tickets', authenticate, authenticateCustomer, async (req, res, next) => {
	try {
		await ensureTicketsTable();
		const { employerId, subject, category, priority, description } = req.body;
		if (!employerId || !subject) {
			return res.status(400).json({ message: 'employerId and subject are required' });
		}
		const createdBy = req.user.email || 'cs';
		const result = await query(
			`INSERT INTO support_tickets (employer_id, created_by, subject, category, priority, description) VALUES (?,?,?,?,?,?)`,
			[employerId, createdBy, subject, category || 'general', priority || 'medium', description || null]
		);
		const [ticket] = await query(`SELECT * FROM support_tickets WHERE id = ?`, [result.insertId]);
		return res.status(201).json({ ticket });
	} catch (err) {
		return next(err);
	}
});

router.get('/tickets/:id', authenticate, authenticateCustomer, async (req, res, next) => {
	try {
		await ensureTicketsTable();
		const { id } = req.params;
		const [ticket] = await query(
			`SELECT t.*, u.full_name, u.email FROM support_tickets t JOIN users u ON u.id = t.employer_id WHERE t.id = ?`,
			[id]
		);
		if (!ticket) return res.status(404).json({ message: 'Ticket not found' });
		return res.json({ ticket });
	} catch (err) {
		return next(err);
	}
});

router.patch('/tickets/:id', authenticate, authenticateCustomer, async (req, res, next) => {
	try {
		await ensureTicketsTable();
		const { id } = req.params;
		const { status, priority, resolutionNotes, subject, category, description } = req.body;
		const fields = [];
		const params = [];
		if (status) { fields.push('status = ?'); params.push(status); }
		if (priority) { fields.push('priority = ?'); params.push(priority); }
		if (typeof resolutionNotes !== 'undefined') { fields.push('resolution_notes = ?'); params.push(resolutionNotes); }
		if (subject) { fields.push('subject = ?'); params.push(subject); }
		if (category) { fields.push('category = ?'); params.push(category); }
		if (typeof description !== 'undefined') { fields.push('description = ?'); params.push(description); }
		if (!fields.length) return res.status(400).json({ message: 'No updates provided' });
		params.push(id);
		await query(`UPDATE support_tickets SET ${fields.join(', ')} WHERE id = ?`, params);
		const [ticket] = await query(`SELECT * FROM support_tickets WHERE id = ?`, [id]);
		return res.json({ ticket });
	} catch (err) {
		return next(err);
	}
});

// User access management
router.post('/users/:id/reset-password', authenticate, authenticateCustomer, async (req, res, next) => {
	try {
		const { id } = req.params;
		const { newPassword } = req.body;
		const temp = newPassword && newPassword.length >= 6 ? newPassword : `Temp${Date.now().toString().slice(-6)}!`;
		const hash = md5(temp);
		const result = await query(`UPDATE users SET password_hash = ? WHERE id = ? AND role = 'provider'`, [hash, id]);
		if (result.affectedRows === 0) return res.status(404).json({ message: 'Employer not found' });
		return res.json({ message: 'Password reset successfully', temporaryPassword: temp });
	} catch (err) {
		return next(err);
	}
});

router.patch('/users/:id/status', authenticate, authenticateCustomer, async (req, res, next) => {
	try {
		const { id } = req.params;
		const { active } = req.body;
		if (typeof active === 'undefined') return res.status(400).json({ message: 'active is required' });
		// Assuming there's an is_active column; if not, we can soft-deactivate by setting a deactivated_at
		await query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS is_active TINYINT(1) NOT NULL DEFAULT 1`);
		const result = await query(`UPDATE users SET is_active = ? WHERE id = ? AND role = 'provider'`, [active ? 1 : 0, id]);
		if (result.affectedRows === 0) return res.status(404).json({ message: 'Employer not found' });
		return res.json({ message: active ? 'User activated' : 'User deactivated' });
	} catch (err) {
		return next(err);
	}
});

router.post('/users/:id/extend-membership', authenticate, authenticateCustomer, async (req, res, next) => {
	try {
		const { id } = req.params;
		const { days = 30 } = req.body;
		// Find active membership
		const memberships = await query(
			`SELECT id, start_date, end_date FROM premium_memberships WHERE user_id = ? AND status = 'active' ORDER BY end_date DESC LIMIT 1`,
			[id]
		);
		if (memberships.length === 0) return res.status(404).json({ message: 'No active membership found' });
		const membership = memberships[0];
		await query(`UPDATE premium_memberships SET end_date = DATE_ADD(end_date, INTERVAL ? DAY) WHERE id = ?`, [parseInt(days), membership.id]);
		const [updated] = await query(`SELECT id, start_date, end_date FROM premium_memberships WHERE id = ?`, [membership.id]);
		return res.json({ message: 'Membership extended', membership: updated });
	} catch (err) {
		return next(err);
	}
});

module.exports = router;


