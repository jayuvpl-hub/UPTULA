/**
 * smartNotifier.js
 *
 * Replaces sendNotificationToAllUsers + sendJobPostedEmailsToSeekers
 * with a scored, tiered notification system.
 *
 * Score tiers:
 *   > 80  → instant push notification + email
 *   50-80 → saved to notification_digest table (sent nightly by cron)
 *   < 50  → ignored
 *
 * Call this WITHOUT await from your job post route so it never blocks the API response.
 * Example:
 *   smartNotifyForJob({ job, jobId: result.insertId }).catch(console.error);
 */

const { query } = require('../db');
const { scoreUserForJob, parseSkills } = require('./jobScorer');
const { sendNotification } = require('../routes/profile.routes');
const sendEmail = require('./sendEmail');
const newJobPostedEmailTemplate = require('./newJobPostedEmailTemplate');
const { CLIENT_ORIGIN } = require('../config/env');

const BATCH_SIZE = 100;   // process users in chunks of 100
const INSTANT_THRESHOLD = 80;
const DIGEST_THRESHOLD = 50;

/**
 * Fetch all active seekers with their full profile data needed for scoring.
 * One query with LEFT JOIN — no N+1.
 * @param {number[]} excludeUserIds
 * @returns {Promise<Object[]>}
 */
async function fetchSeekerProfiles(excludeUserIds = []) {
  let sql = `
    SELECT
      u.id,
      u.email,
      u.full_name,
      u.fcm_token,
      u.fcm_platform,
      up.skills,
      up.preferred_job_role,
      up.preferred_location,
      up.employment_type
    FROM users u
    LEFT JOIN user_profiles up ON up.user_id = u.id
    WHERE u.role = 'seeker'
      AND u.email IS NOT NULL
      AND TRIM(u.email) != ''
  `;
  const params = [];

  if (excludeUserIds.length > 0) {
    sql += ` AND u.id NOT IN (${excludeUserIds.map(() => '?').join(',')})`;
    params.push(...excludeUserIds);
  }

  return query(sql, params);
}

/**
 * For a given job, find which user IDs have behavioural signals:
 * - searched a keyword that appears in job title or skills
 * - viewed a job that shares skills with this job
 *
 * Returns a Set of user IDs with positive behavioural signal.
 * @param {Object} job
 * @returns {Promise<Set<number>>}
 */
async function getBehaviouralSignals(job) {
  const signalUserIds = new Set();

  const jobSkills = parseSkills(job.skills);
  const jobTitleWords = (job.job_title || '')
    .toLowerCase()
    .split(/\s+/)
    .filter(w => w.length > 2);

  // Combine job title words + skills as search terms
  const searchTerms = [...new Set([...jobTitleWords, ...jobSkills])];

  if (searchTerms.length === 0) return signalUserIds;

  // Users who searched any keyword matching job title or skills (last 30 days)
  // We check each term with LIKE — fine at <5000 users
  const likeConditions = searchTerms.map(() => 'LOWER(keyword) LIKE ?').join(' OR ');
  const likeParams = searchTerms.map(t => `%${t}%`);

  try {
    const searchMatches = await query(
      `SELECT DISTINCT user_id
       FROM user_search_logs
       WHERE searched_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
         AND (${likeConditions})`,
      likeParams
    );
    searchMatches.forEach(row => signalUserIds.add(row.user_id));
  } catch (err) {
    console.error('[smartNotifier] search signal query failed:', err.message);
  }

  // Users who viewed jobs that share at least one skill with this job (last 30 days)
  if (jobSkills.length > 0) {
    try {
      const skillConditions = jobSkills.map(() => 'LOWER(j.skills) LIKE ?').join(' OR ');
      const skillParams = jobSkills.map(s => `%${s}%`);

      const viewMatches = await query(
        `SELECT DISTINCT ujv.user_id
         FROM user_job_views ujv
         JOIN jobs j ON j.id = ujv.job_id
         WHERE ujv.viewed_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
           AND (${skillConditions})`,
        skillParams
      );
      viewMatches.forEach(row => signalUserIds.add(row.user_id));
    } catch (err) {
      console.error('[smartNotifier] view signal query failed:', err.message);
    }
  }

  return signalUserIds;
}

/**
 * Send instant push + email to a high-confidence user.
 * @param {Object} user
 * @param {Object} job
 * @param {number} jobId
 */
async function sendJobMatchEmail(user, job, jobId) {
  const jobsUrl = `${String(CLIENT_ORIGIN || 'https://uptula.com').replace(/\/$/, '')}/jobs/${jobId}`;
  const subject = `New job for you: ${job.job_title} at ${job.company_name}`;
  const locationParts = [job.address, job.city, job.state, job.country]
    .map(p => String(p || '').trim())
    .filter(Boolean);
  const location = locationParts.join(', ');

  const html = newJobPostedEmailTemplate({
    userName: user.full_name,
    jobTitle: job.job_title,
    companyName: job.company_name,
    location,
    jobsUrl
  });
  await sendEmail(user.email, subject, html);
}

async function sendInstantNotification(user, job, jobId) {
  try {
    await sendNotification({
      userId: user.id,
      title: 'Job match found!',
      message: `${job.job_title} at ${job.company_name} — looks like a great fit for you.`,
      type: 'job_update',
      jobId: String(jobId),
      deliveryMode: 'all'
    });
  } catch (err) {
    console.error(`[smartNotifier] push failed for user ${user.id}:`, err.message);
  }

  try {
    await sendJobMatchEmail(user, job, jobId);
  } catch (err) {
    console.error(`[smartNotifier] email failed for user ${user.id}:`, err.message);
  }
}

/**
 * Save a digest entry for a medium-confidence user.
 * The nightly cron will pick this up and send a grouped email.
 * @param {number} userId
 * @param {number} jobId
 * @param {number} score
 */
async function saveToDigest(user, job, jobId, score) {
  try {
    await query(
      `INSERT INTO notification_digest (user_id, job_id, score)
       VALUES (?, ?, ?)`,
      [user.id, jobId, score]
    );

    try {
      await sendJobMatchEmail(user, job, jobId);
      await query(
        `UPDATE notification_digest
         SET sent_at = NOW()
         WHERE user_id = ? AND job_id = ? AND sent_at IS NULL`,
        [user.id, jobId]
      );
    } catch (err) {
      console.error(`[smartNotifier] digest email failed for user ${user.id}:`, err.message);
    }
  } catch (err) {
    console.error(`[smartNotifier] digest insert failed for user ${user.id}:`, err.message);
  }
}

/**
 * Main entry point. Call this fire-and-forget from your job post route:
 *   smartNotifyForJob({ job, jobId: result.insertId }).catch(console.error);
 *
 * @param {Object} options
 * @param {Object} options.job          - the full job object (from req.body or re-fetched from DB)
 * @param {number} options.jobId        - the newly inserted job's ID
 * @param {number[]} options.excludeUserIds - e.g. [employerId]
 */
async function smartNotifyForJob({ job, jobId, excludeUserIds = [] }) {
  console.log(`[smartNotifier] Starting smart notification for job ${jobId}`);

  const excluded = excludeUserIds.map(Number).filter(id => Number.isInteger(id) && id > 0);

  // Step 1 — fetch all seeker profiles in one query
  let seekers;
  try {
    seekers = await fetchSeekerProfiles(excluded);
  } catch (err) {
    console.error('[smartNotifier] Failed to fetch seekers:', err.message);
    return;
  }

  if (!seekers || seekers.length === 0) {
    console.log('[smartNotifier] No seekers found, skipping.');
    return;
  }

  console.log(`[smartNotifier] Scoring ${seekers.length} seekers for job ${jobId}`);

  // Step 2 — get behavioural signals for this job (one query, not per-user)
  const signalUserIds = await getBehaviouralSignals(job);

  // Step 3 — score + route in batches
  let instantCount = 0;
  let digestCount = 0;
  let ignoredCount = 0;

  for (let i = 0; i < seekers.length; i += BATCH_SIZE) {
    const chunk = seekers.slice(i, i + BATCH_SIZE);

    await Promise.allSettled(
      chunk.map(async (user) => {
        // Attach behavioural signals
        const enrichedUser = {
          ...user,
          hasViewedSimilar: signalUserIds.has(user.id),
          hasSearchedSimilar: signalUserIds.has(user.id)
        };

        const score = scoreUserForJob(enrichedUser, job);

        if (score > INSTANT_THRESHOLD) {
          console.log(`[smartNotifier] user ${user.id} score ${score} → instant`);
          await sendInstantNotification(user, job, jobId);
          instantCount++;
        } else if (score >= DIGEST_THRESHOLD) {
          console.log(`[smartNotifier] user ${user.id} score ${score} → digest email`);
          await saveToDigest(user, job, jobId, score);
          digestCount++;
        } else {
          ignoredCount++;
        }
      })
    );
  }

  console.log(
    `[smartNotifier] Job ${jobId} done. ` +
    `Instant: ${instantCount}, Digest: ${digestCount}, Ignored: ${ignoredCount}`
  );
}

module.exports = { smartNotifyForJob };