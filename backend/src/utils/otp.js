// const bcrypt = require('bcryptjs');
// const { query } = require('../db');
// const sendEmail = require('./sendEmail');
// const registerOtpTemplate = require('./registerOtpTemplate');
// const resetPasswordTemplate = require('./resetPasswordTemplate');
// const { sendSms } = require('./drophelloSms');
// const { normalizeIndianPhone } = require('./indianPhone');
// const { isProduction } = require('../config/env');

// const OTP_TTL_MS = 5 * 60 * 1000;
// const SEND_COOLDOWN_MS = 60 * 1000;
// const MAX_SENDS = 5;
// const MAX_ATTEMPTS = 5;

// const PURPOSE = {
//   registration: {
//     table: 'register_otp',
//     emailSubject: { first: 'Verify Your Email', resend: 'Resend OTP' },
//     smsPrefix: 'Uptula registration OTP',
//   },
//   password_reset: {
//     table: 'password_resets',
//     emailSubject: { first: 'Reset Password OTP', resend: 'Resend OTP' },
//     smsPrefix: 'Uptula password reset OTP',
//   },
// };

// function mintCode() {
//   return Math.floor(100000 + Math.random() * 900000).toString();
// }

// function cooldownRemainingSeconds(expiresAt) {
//   if (!expiresAt) return 0;
//   const remaining = new Date(expiresAt).getTime() - Date.now();
//   if (remaining <= OTP_TTL_MS - SEND_COOLDOWN_MS) {
//     return 0;
//   }
//   return Math.ceil(remaining / 1000);
// }

// function logDev(msg) {
//   if (!isProduction) console.log(`[otp] ${msg}`);
// }

// /**
//  * One active OTP per email+purpose. The OTP hash is stored in the database;
//  * plaintext never survives the request that generated it, so reuse is not valid.
//  * We enforce a 60s cooldown using the existing expires_at field.
//  */
// async function getOrCreateActiveOtp(purpose, email, fields = {}) {
//   const spec = PURPOSE[purpose];
//   if (!spec) {
//     const err = new Error('Unknown OTP purpose');
//     err.code = 'BAD_PURPOSE';
//     throw err;
//   }

//   const rows = await query(`SELECT * FROM ${spec.table} WHERE email = ?`, [email]);
//   const existing = rows[0] || null;

//   if (existing && Number(existing.resend_count) >= MAX_SENDS) {
//     const err = new Error('Max OTP requests reached');
//     err.code = 'MAX_SENDS';
//     throw err;
//   }

//   const retryAfterSeconds = existing ? cooldownRemainingSeconds(existing.expires_at) : 0;
//   if (retryAfterSeconds > 0) {
//     return {
//       cooldown: true,
//       retryAfterSeconds,
//     };
//   }

//   const plaintextCode = mintCode();
//   const otpHash = await bcrypt.hash(plaintextCode, 10);
//   const expiresAt = new Date(Date.now() + OTP_TTL_MS);

//   if (purpose === 'registration') {
//     await query(
//       `INSERT INTO register_otp (
//         email, otp_hash, full_name, role, phone, password_hash,
//         expires_at, attempt_count, resend_count, is_verified,
//         category_id, subcategory_id, category_ids, subcategory_ids, experience
//       ) VALUES (?, ?, ?, ?, ?, ?, ?, 0, 1, false, ?, ?, ?, ?, ?)
//       ON DUPLICATE KEY UPDATE
//         otp_hash = VALUES(otp_hash),
//         full_name = VALUES(full_name),
//         role = VALUES(role),
//         phone = VALUES(phone),
//         password_hash = VALUES(password_hash),
//         expires_at = VALUES(expires_at),
//         attempt_count = 0,
//         resend_count = resend_count + 1,
//         is_verified = false,
//         category_id = VALUES(category_id),
//         subcategory_id = VALUES(subcategory_id),
//         category_ids = VALUES(category_ids),
//         subcategory_ids = VALUES(subcategory_ids),
//         experience = VALUES(experience)`,
//       [
//         email,
//         otpHash,
//         fields.fullName || null,
//         fields.role || null,
//         fields.phone || null,
//         fields.passwordHash || null,
//         expiresAt,
//         fields.categoryId || null,
//         fields.subcategoryId || null,
//         fields.categoryIds || null,
//         fields.subcategoryIds || null,
//         fields.experience || null,
//       ]
//     );
//   } else {
//     await query(
//       `INSERT INTO password_resets (
//         email, otp_hash, expires_at, attempt_count, resend_count, is_verified
//       ) VALUES (?, ?, ?, 0, 1, false)
//       ON DUPLICATE KEY UPDATE
//         otp_hash = VALUES(otp_hash),
//         expires_at = VALUES(expires_at),
//         attempt_count = 0,
//         resend_count = resend_count + 1,
//         is_verified = false`,
//       [email, otpHash, expiresAt]
//     );
//   }

//   logDev(`minted OTP purpose=${purpose}`);

//   return {
//     plaintextCode,
//     isNew: !existing,
//   };
// }

// async function dispatchOtp(purpose, { email, phone, fullName, code, isResend }) {
//   const spec = PURPOSE[purpose];
//   const channels = [];
//   const jobs = [];

//   if (email) {
//     channels.push('email');
//     const html =
//       purpose === 'registration'
//         ? registerOtpTemplate(code, fullName)
//         : resetPasswordTemplate(code, fullName);
//     const subject = isResend ? spec.emailSubject.resend : spec.emailSubject.first;
//     jobs.push(
//       sendEmail(email, subject, html).then(() => 'email')
//     );
//   }

//   const mobile = normalizeIndianPhone(phone);
//   if (mobile) {
//     channels.push('sms');
//     const smsBody = `Your one-time password is ${code}. Valid for 5 Minute Only. Thank You UPTULA`;;
//     jobs.push(
//       sendSms(mobile, smsBody).then(() => 'sms')
//     );
//   }

//   if (jobs.length === 0) {
//     const err = new Error('No OTP delivery channel available');
//     err.code = 'NO_CHANNEL';
//     throw err;
//   }

//   const results = await Promise.allSettled(jobs);
//   const sentVia = [];
//   results.forEach((result, i) => {
//     const channel = channels[i];
//     if (result.status === 'fulfilled') {
//       sentVia.push(result.value);
//       logDev(`channel=${channel} ok`);
//     } else if (!isProduction) {
//       console.warn(`[otp] channel=${channel} failed:`, result.reason && result.reason.message);
//     } else {
//       console.warn(`[otp] channel=${channel} failed`);
//     }
//   });

//   if (sentVia.length === 0) {
//     const err = new Error('Failed to send OTP');
//     err.code = 'SEND_FAILED';
//     throw err;
//   }

//   return sentVia;
// }

// async function verifyOtp(purpose, email, submittedCode) {
//   const spec = PURPOSE[purpose];
//   const rows = await query(`SELECT * FROM ${spec.table} WHERE email = ?`, [email]);
//   if (rows.length === 0) {
//     const err = new Error(purpose === 'registration' ? 'No OTP found' : 'No OTP found');
//     err.code = 'NOT_FOUND';
//     throw err;
//   }

//   const record = rows[0];

//   if (new Date() > new Date(record.expires_at)) {
//     const err = new Error('OTP expired');
//     err.code = 'EXPIRED';
//     throw err;
//   }

//   if (Number(record.attempt_count) >= MAX_ATTEMPTS) {
//     const err = new Error(purpose === 'registration' ? 'Too many attempts' : 'Too many attempts');
//     err.code = 'LOCKED';
//     throw err;
//   }

//   const ok = await bcrypt.compare(String(submittedCode || ''), record.otp_hash);
//   if (!ok) {
//     await query(
//       `UPDATE ${spec.table} SET attempt_count = attempt_count + 1 WHERE email = ?`,
//       [email]
//     );
//     const err = new Error('Invalid OTP');
//     err.code = 'INVALID';
//     throw err;
//   }

//   return record;
// }

// function otpHttpStatus(err) {
//   if (err.code === 'MAX_SENDS' || err.code === 'LOCKED') return 429;
//   if (err.code === 'COOLDOWN') return 429;
//   return 400;
// }

// module.exports = {
//   getOrCreateActiveOtp,
//   dispatchOtp,
//   verifyOtp,
//   otpHttpStatus,
//   MAX_SENDS,
//   MAX_ATTEMPTS,
// };
const bcrypt = require('bcryptjs');
const { query } = require('../db');
const sendEmail = require('./sendEmail');
const registerOtpTemplate = require('./registerOtpTemplate');
const resetPasswordTemplate = require('./resetPasswordTemplate');
const { sendSms } = require('./drophelloSms');
const { normalizeIndianPhone } = require('./indianPhone');
const { isProduction } = require('../config/env');

const OTP_TTL_MS = 5 * 60 * 1000;
const SEND_COOLDOWN_MS = 60 * 1000;
const MAX_SENDS = 5;
const MAX_ATTEMPTS = 5;

const PURPOSE = {
  registration: {
    table: 'register_otp',
    emailSubject: { first: 'Verify Your Email', resend: 'Resend OTP' },
  },
  password_reset: {
    table: 'password_resets',
    emailSubject: { first: 'Reset Password OTP', resend: 'Resend OTP' },
  },
};

function mintCode() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

function cooldownRemainingSeconds(expiresAt) {
  if (!expiresAt) return 0;
  const remaining = new Date(expiresAt).getTime() - Date.now();
  if (remaining <= OTP_TTL_MS - SEND_COOLDOWN_MS) {
    return 0;
  }
  return Math.ceil(remaining / 1000);
}

function logDev(msg) {
  if (!isProduction) console.log(`[otp] ${msg}`);
}

/**
 * Send the OTP first, and only persist the DB row if at least one channel
 * (email or SMS) actually succeeded. This avoids creating a "phantom" OTP
 * row -- and burning a resend/cooldown -- for a code the user never received.
 */
async function dispatchOtp(purpose, { email, phone, fullName, code, isResend }) {
  const spec = PURPOSE[purpose];
  const channels = [];
  const jobs = [];

  if (email) {
    channels.push('email');
    const html =
      purpose === 'registration'
        ? registerOtpTemplate(code, fullName)
        : resetPasswordTemplate(code, fullName);
    const subject = isResend ? spec.emailSubject.resend : spec.emailSubject.first;
    jobs.push(
      sendEmail(email, subject, html).then(() => 'email')
    );
  }

  const mobile = normalizeIndianPhone(phone);
  if (mobile) {
    channels.push('sms');
    // Must match the DLT-approved template EXACTLY (sender: UPVPL, template_id: 1177178696972459726)
    const smsBody = `Your one-time password is ${code}. Valid for 5 Minute Only. Thank You UPTULA`;
    jobs.push(
      sendSms(mobile, smsBody).then(() => 'sms')
    );
  }

  if (jobs.length === 0) {
    const err = new Error('No OTP delivery channel available');
    err.code = 'NO_CHANNEL';
    throw err;
  }

  const results = await Promise.allSettled(jobs);
  const sentVia = [];
  results.forEach((result, i) => {
    const channel = channels[i];
    if (result.status === 'fulfilled') {
      sentVia.push(result.value);
      logDev(`channel=${channel} ok`);
    } else if (!isProduction) {
      console.warn(`[otp] channel=${channel} failed:`, result.reason && result.reason.message);
    } else {
      console.warn(`[otp] channel=${channel} failed`);
    }
  });

  if (sentVia.length === 0) {
    const err = new Error('Failed to send OTP');
    err.code = 'SEND_FAILED';
    throw err;
  }

  return sentVia;
}

/**
 * One active OTP per email+purpose. Sends first (dispatchOtp), and only
 * persists the OTP row to the DB once at least one channel succeeds.
 * The OTP hash is stored in the database; plaintext never survives the
 * request that generated it. We enforce a 60s cooldown using expires_at.
 */
async function getOrCreateActiveOtp(purpose, email, fields = {}) {
  const spec = PURPOSE[purpose];
  if (!spec) {
    const err = new Error('Unknown OTP purpose');
    err.code = 'BAD_PURPOSE';
    throw err;
  }

  const rows = await query(`SELECT * FROM ${spec.table} WHERE email = ?`, [email]);
  const existing = rows[0] || null;

  if (existing && Number(existing.resend_count) >= MAX_SENDS) {
    const err = new Error('Max OTP requests reached');
    err.code = 'MAX_SENDS';
    throw err;
  }

  const retryAfterSeconds = existing ? cooldownRemainingSeconds(existing.expires_at) : 0;
  if (retryAfterSeconds > 0) {
    return {
      cooldown: true,
      retryAfterSeconds,
    };
  }

  const plaintextCode = mintCode();

  // SEND FIRST. If this throws (SEND_FAILED / NO_CHANNEL), nothing is
  // written to the DB -- the caller's catch block handles the error and
  // the user's existing OTP state (if any) is left completely untouched.
  const sentVia = await dispatchOtp(purpose, {
    email,
    phone: fields.phone || null,
    fullName: fields.fullName || null,
    code: plaintextCode,
    isResend: Boolean(existing),
  });

  // Only persist once we know at least one channel succeeded.
  const otpHash = await bcrypt.hash(plaintextCode, 10);
  const expiresAt = new Date(Date.now() + OTP_TTL_MS);

  if (purpose === 'registration') {
    await query(
      `INSERT INTO register_otp (
        email, otp_hash, full_name, role, phone, password_hash,
        expires_at, attempt_count, resend_count, is_verified,
        category_id, subcategory_id, category_ids, subcategory_ids, experience
      ) VALUES (?, ?, ?, ?, ?, ?, ?, 0, 1, false, ?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE
        otp_hash = VALUES(otp_hash),
        full_name = VALUES(full_name),
        role = VALUES(role),
        phone = VALUES(phone),
        password_hash = VALUES(password_hash),
        expires_at = VALUES(expires_at),
        attempt_count = 0,
        resend_count = resend_count + 1,
        is_verified = false,
        category_id = VALUES(category_id),
        subcategory_id = VALUES(subcategory_id),
        category_ids = VALUES(category_ids),
        subcategory_ids = VALUES(subcategory_ids),
        experience = VALUES(experience)`,
      [
        email,
        otpHash,
        fields.fullName || null,
        fields.role || null,
        fields.phone || null,
        fields.passwordHash || null,
        expiresAt,
        fields.categoryId || null,
        fields.subcategoryId || null,
        fields.categoryIds || null,
        fields.subcategoryIds || null,
        fields.experience || null,
      ]
    );
  } else {
    await query(
      `INSERT INTO password_resets (
        email, otp_hash, expires_at, attempt_count, resend_count, is_verified
      ) VALUES (?, ?, ?, 0, 1, false)
      ON DUPLICATE KEY UPDATE
        otp_hash = VALUES(otp_hash),
        expires_at = VALUES(expires_at),
        attempt_count = 0,
        resend_count = resend_count + 1,
        is_verified = false`,
      [email, otpHash, expiresAt]
    );
  }

  logDev(`minted OTP purpose=${purpose}`);

  return {
    plaintextCode,
    isNew: !existing,
    sentVia,
  };
}

async function verifyOtp(purpose, email, submittedCode) {
  const spec = PURPOSE[purpose];
  const rows = await query(`SELECT * FROM ${spec.table} WHERE email = ?`, [email]);
  if (rows.length === 0) {
    const err = new Error('No OTP found');
    err.code = 'NOT_FOUND';
    throw err;
  }

  const record = rows[0];

  if (new Date() > new Date(record.expires_at)) {
    const err = new Error('OTP expired');
    err.code = 'EXPIRED';
    throw err;
  }

  if (Number(record.attempt_count) >= MAX_ATTEMPTS) {
    const err = new Error('Too many attempts');
    err.code = 'LOCKED';
    throw err;
  }

  const ok = await bcrypt.compare(String(submittedCode || ''), record.otp_hash);
  if (!ok) {
    await query(
      `UPDATE ${spec.table} SET attempt_count = attempt_count + 1 WHERE email = ?`,
      [email]
    );
    const err = new Error('Invalid OTP');
    err.code = 'INVALID';
    throw err;
  }

  return record;
}

function otpHttpStatus(err) {
  if (err.code === 'MAX_SENDS' || err.code === 'LOCKED') return 429;
  if (err.code === 'COOLDOWN') return 429;
  return 400;
}

module.exports = {
  getOrCreateActiveOtp,
  dispatchOtp,
  verifyOtp,
  otpHttpStatus,
  MAX_SENDS,
  MAX_ATTEMPTS,
};