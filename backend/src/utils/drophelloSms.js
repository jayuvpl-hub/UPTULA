/**
 * DropHello SMS channel for OTP.
 * Wraps the confirmed working DropHello API:
 *   GET http://sms.drophello.com/API/sms-api.php
 *   params: auth, msisdn (10-digit, no country code), senderid, message,
 *           template_id, entity_id (DLT fields, optional once saved in panel)
 */
const { isProduction } = require('../config/env');

const SEND_URL = process.env.DROPHELLO_SEND_URL || 'http://sms.drophello.com/API/sms-api.php';

async function sendSms(phone, message) {
  const auth = process.env.DROPHELLO_AUTH_KEY;
  const senderid = process.env.DROPHELLO_SENDER_ID;
  const template_id = process.env.DROPHELLO_TEMPLATE_ID;
  const entity_id = process.env.DROPHELLO_ENTITY_ID;

  if (!auth || !senderid) {
    const err = new Error('DropHello SMS client is not configured');
    err.code = 'SMS_NOT_CONFIGURED';
    throw err;
  }

  const params = new URLSearchParams({
    auth,
    msisdn: phone, // must already be 10-digit, no country code
    senderid,
    message,
  });
  if (template_id) params.set('template_id', template_id);
  if (entity_id) params.set('entity_id', entity_id);

  const res = await fetch(`${SEND_URL}?${params.toString()}`, { method: 'GET' });

  if (!res.ok) {
    const err = new Error(`DropHello SMS failed (HTTP ${res.status})`);
    err.code = 'SMS_FAILED';
    throw err;
  }

  const raw = await res.text();
  let data;
  try {
    data = JSON.parse(raw);
  } catch (_) {
    const err = new Error(`DropHello SMS returned a non-JSON response: ${raw.slice(0, 120)}`);
    err.code = 'SMS_FAILED';
    throw err;
  }

  if (!data || data.status !== 'success') {
    const err = new Error(
      `DropHello SMS rejected: ${data?.desc || data?.message || 'unknown error'}${data?.code ? ` (code ${data.code})` : ''}`
    );
    err.code = 'SMS_FAILED';
    throw err;
  }

  // "success" with nothing submitted still means the handset gets no message.
  if (data.totalnumbers_sbmited != null && Number(data.totalnumbers_sbmited) < 1) {
    const err = new Error(`DropHello SMS accepted 0 numbers (code ${data.code || 'n/a'})`);
    err.code = 'SMS_FAILED';
    throw err;
  }

  // Submission only. DropHello exposes no delivery-report API, so a logid here
  // does NOT prove the handset received it (DLT scrubbing can drop it later).
  if (!isProduction) {
    console.log(
      `[otp] SMS submitted to=${phone} code=${data.code} logid=${data.logid} campaign=${data.campg_id || 'n/a'} submitted=${data.totalnumbers_sbmited}`
    );
  }
}

module.exports = { sendSms };