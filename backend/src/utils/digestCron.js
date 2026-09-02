/**
 * digestCron.js
 *
 * Runs every night at 10:00 PM.
 * Picks up all unsent notification_digest rows from today,
 * groups them by user, sends ONE email per user, then marks them sent.
 *
 * Setup: call startDigestCron() once from your app entry point (server.js / index.js):
 *   const { startDigestCron } = require('./utils/digestCron');
 *   startDigestCron();
 *
 * Install dependency first:
 *   npm install node-cron
 */

const cron = require('node-cron');
const { query } = require('../db');
const sendEmail = require('./sendEmail');
const { CLIENT_ORIGIN } = require('../config/env');

/**
 * Build a digest email HTML listing multiple job matches.
 * @param {string} userName
 * @param {Array} jobs  - array of { job_title, company_name, city, state, country, jobId }
 * @param {string} jobsUrl
 * @returns {string}
 */
function buildDigestEmailHtml(userName, jobs, jobsUrl) {
  const safeName = userName || 'there';

  const jobRows = jobs.map(j => {
    const locationParts = [j.city, j.state, j.country]
      .map(p => String(p || '').trim())
      .filter(Boolean);
    const location = locationParts.join(', ') || 'Location not specified';
    const jobLink = `${jobsUrl}/${j.job_id}`;

    return `
      <tr>
        <td style="padding: 12px 0; border-bottom: 1px solid #f0f0f0;">
          <strong style="font-size: 15px;">${j.job_title}</strong><br/>
          <span style="color: #555;">${j.company_name}</span><br/>
          <span style="color: #888; font-size: 13px;">${location}</span><br/>
          <a href="${jobLink}" style="color: #4A90E2; font-size: 13px; text-decoration: none;">View Job →</a>
        </td>
      </tr>
    `;
  }).join('');

  return `
    <div style="font-family: Arial, sans-serif; color: #222; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #333;">Hi ${safeName}, here are today's job matches for you</h2>
      <p style="color: #555;">We found <strong>${jobs.length} job${jobs.length > 1 ? 's' : ''}</strong> that match your profile and interests.</p>
      <table style="width: 100%; border-collapse: collapse;">
        ${jobRows}
      </table>
      <div style="margin-top: 24px;">
        <a href="${jobsUrl}"
           style="background: #4A90E2; color: #fff; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-size: 14px;">
          Browse All Jobs
        </a>
      </div>
      <p style="color: #aaa; font-size: 12px; margin-top: 32px;">
        You're receiving this because your profile matches these opportunities.
        Visit your account settings to manage notifications.
      </p>
    </div>
  `;
}

/**
 * Core digest runner. Can be called manually for testing.
 */
async function runDigest() {
  console.log('[digestCron] Starting nightly digest run...');

  const jobsUrl = `${String(CLIENT_ORIGIN || 'https://uptula.com').replace(/\/$/, '')}/jobs`;

  // Fetch all unsent digest entries with job + user info in one query
  let pendingRows;
  try {
    pendingRows = await query(`
      SELECT
        nd.id           AS digest_id,
        nd.user_id,
        nd.job_id,
        nd.score,
        u.email,
        u.full_name,
        j.job_title,
        j.company_name,
        j.city,
        j.state,
        j.country
      FROM notification_digest nd
      JOIN users u  ON u.id  = nd.user_id
      JOIN jobs  j  ON j.id  = nd.job_id
      WHERE nd.sent_at IS NULL
      ORDER BY nd.user_id, nd.score DESC
    `);
  } catch (err) {
    console.error('[digestCron] Failed to fetch pending digests:', err.message);
    return;
  }

  if (!pendingRows || pendingRows.length === 0) {
    console.log('[digestCron] No pending digests today.');
    return;
  }

  // Group by user
  const byUser = {};
  for (const row of pendingRows) {
    if (!byUser[row.user_id]) {
      byUser[row.user_id] = {
        userId: row.user_id,
        email: row.email,
        fullName: row.full_name,
        jobs: [],
        digestIds: []
      };
    }
    byUser[row.user_id].jobs.push({
      job_id: row.job_id,
      job_title: row.job_title,
      company_name: row.company_name,
      city: row.city,
      state: row.state,
      country: row.country
    });
    byUser[row.user_id].digestIds.push(row.digest_id);
  }

  const users = Object.values(byUser);
  console.log(`[digestCron] Sending digest to ${users.length} users...`);

  let sentCount = 0;
  let failCount = 0;

  // Process in batches of 25 emails
  const BATCH_SIZE = 25;
  for (let i = 0; i < users.length; i += BATCH_SIZE) {
    const chunk = users.slice(i, i + BATCH_SIZE);

    await Promise.allSettled(
      chunk.map(async (userData) => {
        try {
          const html = buildDigestEmailHtml(userData.fullName, userData.jobs, jobsUrl);
          const subject = `${userData.jobs.length} new job match${userData.jobs.length > 1 ? 'es' : ''} for you today`;

          await sendEmail(userData.email, subject, html);

          // Mark all digest entries for this user as sent
          const placeholders = userData.digestIds.map(() => '?').join(',');
          await query(
            `UPDATE notification_digest SET sent_at = NOW() WHERE id IN (${placeholders})`,
            userData.digestIds
          );

          sentCount++;
        } catch (err) {
          console.error(`[digestCron] Failed for user ${userData.userId}:`, err.message);
          failCount++;
        }
      })
    );
  }

  console.log(`[digestCron] Done. Sent: ${sentCount}, Failed: ${failCount}`);
}

/**
 * Start the cron scheduler.
 * Runs every night at 10:00 PM server time.
 * Call this once from your server.js / app.js entry point.
 */
function startDigestCron() {
  // '0 22 * * *' = every day at 10:00 PM
  cron.schedule('0 22 * * *', () => {
    runDigest().catch(err => {
      console.error('[digestCron] Unexpected error in runDigest:', err);
    });
  });

  console.log('[digestCron] Nightly digest cron scheduled at 10:00 PM.');
}

module.exports = { startDigestCron, runDigest };