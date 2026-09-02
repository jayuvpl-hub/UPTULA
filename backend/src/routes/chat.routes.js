const express = require('express');
const { query } = require('../db');
const { authenticate } = require('../middleware/auth');
// Reuse the single notification implementation
const { sendNotification } = require('./profile.routes');

const router = express.Router();

// Patterns to detect restricted content in messages
const EMAIL_PATTERN = /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i;
const PHONE_PATTERN = /(\+?\d[\d\s().-]{7,})/;
const CONTACT_APPS_PATTERN = /(wa(\.me)?\/\d{7,}|telegram|skype|whatsapp|snapchat)/i;
// External links: http://, https://, www., or common domain patterns
const EXTERNAL_LINK_PATTERN = /(https?:\/\/|www\.|[a-z0-9]+\.(com|net|org|io|co|in|edu|gov|me|info|biz|xyz|site|online|tech|app|dev|blog|website|link|click|bit\.ly|tinyurl|goo\.gl|t\.co|fb\.me|instagram\.com|facebook\.com|twitter\.com|linkedin\.com|youtube\.com|github\.com|stackoverflow\.com))/i;

const validateMessage = (text = '') => {
  const normalized = text.replace(/\s+/g, ' ').trim();
  
  if (EMAIL_PATTERN.test(normalized)) {
    return { valid: false, reason: 'Email addresses are not allowed in chat messages.' };
  }
  
  if (PHONE_PATTERN.test(normalized)) {
    return { valid: false, reason: 'Phone numbers are not allowed in chat messages.' };
  }
  
  if (CONTACT_APPS_PATTERN.test(normalized)) {
    return { valid: false, reason: 'Sharing contact information is not allowed in chat messages.' };
  }
  
  if (EXTERNAL_LINK_PATTERN.test(normalized)) {
    return { valid: false, reason: 'External links are not allowed in chat messages.' };
  }
  
  return { valid: true };
};

// Legacy function for backward compatibility
const containsContactInfo = (text = '') => {
  const result = validateMessage(text);
  return !result.valid;
};

const getActivePremiumMembership = async (userId) => {
  const memberships = await query(
    `
      SELECT * FROM premium_memberships
      WHERE user_id = ?
        AND status = 'active'
        AND (end_date IS NULL OR end_date > NOW())
      ORDER BY created_at DESC
      LIMIT 1
    `,
    [userId]
  );
  return memberships.length ? memberships[0] : null;
};

const getEmployerChatLimits = async (employerId) => {
  const membership = await getActivePremiumMembership(employerId);
  if (membership) {
    return {
      maxActiveThreads: 50,
      maxPendingThreads: 100
    };
  }
  return {
    maxActiveThreads: 5,
    maxPendingThreads: 10
  };
};

const fetchThreadById = async (threadId) => {
  const rows = await query(
    `
      SELECT
        ct.*,
        j.job_title,
        j.company_name,
        j.employer_id,
        u.full_name AS employer_name,
        u.email AS employer_email,
        cand.full_name AS candidate_name,
        cand.email AS candidate_email
      FROM chat_threads ct
      JOIN jobs j ON j.id = ct.job_id
      JOIN users u ON u.id = ct.employer_id
      JOIN users cand ON cand.id = ct.candidate_id
      WHERE ct.id = ?
      LIMIT 1
    `,
    [threadId]
  );
  return rows.length ? rows[0] : null;
};

const ensureThreadAccess = async (threadId, user) => {
  const thread = await fetchThreadById(threadId);
  if (!thread) return { allowed: false };
  if (user.role === 'admin') return { allowed: true, thread };
  if (user.role === 'provider' && thread.employer_id === user.id) {
    return { allowed: true, thread };
  }
  if (user.role === 'seeker' && thread.candidate_id === user.id) {
    return { allowed: true, thread };
  }
  return { allowed: false };
};

const serializeThread = (row, currentUserId) => ({
  id: row.id,
  jobId: row.job_id,
  jobTitle: row.job_title,
  companyName: row.company_name,
  employerId: row.employer_id,
  employerName: row.employer_name,
  employerEmail: row.employer_email,
  candidateId: row.candidate_id,
  candidateName: row.candidate_name,
  candidateEmail: row.candidate_email,
  status: row.status,
  lastMessageAt: row.last_message_at,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
  unreadCount: row.employer_id === currentUserId ? row.employer_unread : row.candidate_unread
});

router.post('/request', authenticate, async (req, res, next) => {
  try {
    if (req.user.role !== 'seeker') {
      return res.status(403).json({ message: 'Only candidates can request chats.' });
    }

    const { jobId, message } = req.body || {};
    if (!jobId) {
      return res.status(400).json({ message: 'jobId is required.' });
    }

    const jobs = await query(
      `
        SELECT id, employer_id, status
        FROM jobs
        WHERE id = ?
        LIMIT 1
      `,
      [jobId]
    );
    if (!jobs.length) {
      return res.status(404).json({ message: 'Job not found.' });
    }
    const job = jobs[0];

    const limits = await getEmployerChatLimits(job.employer_id);
    const countRows = await query(
      `
        SELECT
          SUM(status = 'approved') AS approved_count,
          SUM(status = 'pending') AS pending_count
        FROM chat_threads
        WHERE employer_id = ?
      `,
      [job.employer_id]
    );
    const counts = countRows[0];
    if (counts.pending_count >= limits.maxPendingThreads) {
      return res.status(429).json({ message: 'Employer is not accepting new chat requests right now. Please try later.' });
    }

    const existing = await query(
      `
        SELECT *
        FROM chat_threads
        WHERE job_id = ? AND candidate_id = ?
        LIMIT 1
      `,
      [jobId, req.user.id]
    );

    let threadId;
    if (existing.length) {
      const thread = existing[0];
      if (['pending', 'approved'].includes(thread.status)) {
        return res.status(409).json({ message: 'Chat already exists for this job.' });
      }
      await query(
        `
          UPDATE chat_threads
          SET status = 'pending',
              candidate_unread = 0,
              employer_unread = 0,
              updated_at = CURRENT_TIMESTAMP
          WHERE id = ?
        `,
        [thread.id]
      );
      threadId = thread.id;
    } else {
      const result = await query(
        `
          INSERT INTO chat_threads (
            job_id,
            employer_id,
            candidate_id,
            status
          ) VALUES (?, ?, ?, 'pending')
        `,
        [job.id, job.employer_id, req.user.id]
      );
      threadId = result.insertId;
    }

    if (message && message.trim()) {
      const messageText = message.trim();
      const senderName = req.user.fullName || req.user.full_name || req.user.email || 'User';
      // ✅ Added online check placeholder (no online status system exists yet)
      const isReceiverOnline = false;

      const validation = validateMessage(messageText);
      if (!validation.valid) {
        return res.status(400).json({ message: validation.reason });
      }
      await query(
        `
          INSERT INTO chat_messages (thread_id, sender_id, sender_role, message)
          VALUES (?, ?, 'seeker', ?)
        `,
        [threadId, req.user.id, messageText]
      );
      await query(
        `
          UPDATE chat_threads
          SET employer_unread = employer_unread + 1,
              last_message_at = CURRENT_TIMESTAMP
          WHERE id = ?
        `,
        [threadId]
      );

      // ✅ Improved chat notification content
      if (!isReceiverOnline) {
        await sendNotification({
          userId: job.employer_id,
          title: 'New Message',
          message: `${senderName}: ${messageText.slice(0, 30)}`,
          type: 'message',
          jobId: job.id,
          threadId: threadId
        });
      }
    }

    const thread = await fetchThreadById(threadId);
    res.status(201).json({ thread: serializeThread(thread, req.user.id) });
  } catch (err) {
    return next(err);
  }
});

router.get('/threads', authenticate, async (req, res, next) => {
  try {
    const { status } = req.query;
    let whereClause;
    const params = [];
    if (req.user.role === 'seeker') {
      whereClause = 'ct.candidate_id = ?';
      params.push(req.user.id);
    } else if (req.user.role === 'provider') {
      whereClause = 'ct.employer_id = ?';
      params.push(req.user.id);
    } else {
      return res.status(403).json({ message: 'Only candidates and employers can view chats.' });
    }
    if (status) {
      whereClause += ' AND ct.status = ?';
      params.push(status);
    }

    const rows = await query(
      `
        SELECT
          ct.*,
          j.job_title,
          j.company_name,
          u.full_name AS employer_name,
          u.email AS employer_email,
          cand.full_name AS candidate_name,
          cand.email AS candidate_email
        FROM chat_threads ct
        JOIN jobs j ON j.id = ct.job_id
        JOIN users u ON u.id = ct.employer_id
        JOIN users cand ON cand.id = ct.candidate_id
        WHERE ${whereClause}
        ORDER BY ct.updated_at DESC
      `,
      params
    );

    res.json({
      threads: (rows || []).map((row) => serializeThread(row, req.user.id))
    });
  } catch (err) {
    console.error('Error fetching chat threads:', err);
    // If it's a table doesn't exist error, provide helpful message
    if (err.code === 'ER_NO_SUCH_TABLE' || err.message?.includes('chat_threads')) {
      return res.status(500).json({ 
        message: 'Chat feature not initialized. Please run database migration.' 
      });
    }
    return next(err);
  }
});

router.post('/threads/:id/approve', authenticate, async (req, res, next) => {
  try {
    if (req.user.role !== 'provider') {
      return res.status(403).json({ message: 'Only employers can approve chat requests.' });
    }

    const { allowed, thread } = await ensureThreadAccess(req.params.id, req.user);
    if (!allowed) {
      return res.status(404).json({ message: 'Thread not found.' });
    }
    if (thread.status !== 'pending') {
      return res.status(400).json({ message: 'Only pending requests can be approved.' });
    }

    const limits = await getEmployerChatLimits(req.user.id);
    const activeCountRows = await query(
      `
        SELECT COUNT(*) AS count
        FROM chat_threads
        WHERE employer_id = ? AND status = 'approved'
      `,
      [req.user.id]
    );
    if (activeCountRows[0].count >= limits.maxActiveThreads) {
      return res.status(429).json({ message: 'Chat limit reached. Upgrade plan to approve more chats.' });
    }

    await query(
      `
        UPDATE chat_threads
        SET status = 'approved',
            candidate_unread = candidate_unread,
            employer_unread = employer_unread,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `,
      [thread.id]
    );

    const updated = await fetchThreadById(thread.id);
    res.json({ thread: serializeThread(updated, req.user.id) });
  } catch (err) {
    return next(err);
  }
});

router.post('/threads/:id/decline', authenticate, async (req, res, next) => {
  try {
    if (req.user.role !== 'provider') {
      return res.status(403).json({ message: 'Only employers can decline chat requests.' });
    }
    const { allowed, thread } = await ensureThreadAccess(req.params.id, req.user);
    if (!allowed) return res.status(404).json({ message: 'Thread not found.' });
    if (!['pending', 'approved'].includes(thread.status)) {
      return res.status(400).json({ message: 'Thread is already closed.' });
    }
    await query(
      `
        UPDATE chat_threads
        SET status = 'declined',
            updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `,
      [thread.id]
    );
    const updated = await fetchThreadById(thread.id);
    res.json({ thread: serializeThread(updated, req.user.id) });
  } catch (err) {
    return next(err);
  }
});

router.post('/threads/:id/close', authenticate, async (req, res, next) => {
  try {
    const { allowed, thread } = await ensureThreadAccess(req.params.id, req.user);
    if (!allowed) return res.status(404).json({ message: 'Thread not found.' });
    if (thread.status === 'closed') {
      return res.status(400).json({ message: 'Thread already closed.' });
    }
    await query(
      `
        UPDATE chat_threads
        SET status = 'closed',
            updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `,
      [thread.id]
    );
    const updated = await fetchThreadById(thread.id);
    res.json({ thread: serializeThread(updated, req.user.id) });
  } catch (err) {
    return next(err);
  }
});

router.get('/threads/:id/messages', authenticate, async (req, res, next) => {
  try {
    const { allowed, thread } = await ensureThreadAccess(req.params.id, req.user);
    if (!allowed) return res.status(404).json({ message: 'Thread not found.' });

    if (req.user.role === 'provider') {
      await query('UPDATE chat_threads SET employer_unread = 0 WHERE id = ?', [thread.id]);
    } else if (req.user.role === 'seeker') {
      await query('UPDATE chat_threads SET candidate_unread = 0 WHERE id = ?', [thread.id]);
    }

    const messages = await query(
      `
        SELECT id, thread_id, sender_id, sender_role, message, is_flagged, created_at
        FROM chat_messages
        WHERE thread_id = ?
        ORDER BY created_at ASC
      `,
      [thread.id]
    );
    res.json({ messages });
  } catch (err) {
    return next(err);
  }
});

router.post('/threads/:id/messages', authenticate, async (req, res, next) => {
  try {
    const { message } = req.body || {};
    if (!message || !message.trim()) {
      return res.status(400).json({ message: 'Message is required.' });
    }
    const messageText = message.trim();
    const senderName = req.user.fullName || req.user.full_name || req.user.email || 'User';
    // ✅ Added online check placeholder (no online status system exists yet)
    const isReceiverOnline = false;
    const { allowed, thread } = await ensureThreadAccess(req.params.id, req.user);
    if (!allowed) return res.status(404).json({ message: 'Thread not found.' });
    if (thread.status !== 'approved') {
      return res.status(403).json({ message: 'Chat not approved yet.' });
    }
    const validation = validateMessage(messageText);
    if (!validation.valid) {
      return res.status(400).json({ message: validation.reason });
    }

    await query(
      `
        INSERT INTO chat_messages (thread_id, sender_id, sender_role, message)
        VALUES (?, ?, ?, ?)
      `,
      [thread.id, req.user.id, req.user.role === 'provider' ? 'provider' : 'seeker', messageText]
    );

    await query(
      `
        UPDATE chat_threads
        SET last_message_at = CURRENT_TIMESTAMP,
            ${req.user.role === 'provider' ? 'candidate_unread = candidate_unread + 1' : 'employer_unread = employer_unread + 1'},
            updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `,
      [thread.id]
    );

    const receiverId = req.user.role === 'provider' ? thread.candidate_id : thread.employer_id;
    // ✅ Improved chat notification content
    if (!isReceiverOnline) {
      await sendNotification({
        userId: receiverId,
        title: 'New Message',
        message: `${senderName}: ${messageText.slice(0, 30)}`,
        type: 'message',
        jobId: thread.job_id,
        threadId: thread.id
      });
    }

    const messages = await query(
      `
        SELECT id, thread_id, sender_id, sender_role, message, is_flagged, created_at
        FROM chat_messages
        WHERE thread_id = ?
        ORDER BY created_at ASC
      `,
      [thread.id]
    );
    res.json({ messages });
  } catch (err) {
    return next(err);
  }
});

router.post('/threads/:id/report', authenticate, async (req, res, next) => {
  try {
    const { reason, details } = req.body || {};
    if (!reason || !reason.trim()) {
      return res.status(400).json({ message: 'Reason is required.' });
    }
    const { allowed, thread } = await ensureThreadAccess(req.params.id, req.user);
    if (!allowed) return res.status(404).json({ message: 'Thread not found.' });

    await query(
      `
        INSERT INTO chat_reports (thread_id, reporter_id, reporter_role, reason, details)
        VALUES (?, ?, ?, ?, ?)
      `,
      [thread.id, req.user.id, req.user.role === 'provider' ? 'provider' : 'seeker', reason.trim(), details || null]
    );

    res.json({ message: 'Report submitted. Our team will review it shortly.' });
  } catch (err) {
    return next(err);
  }
});

module.exports = router;

