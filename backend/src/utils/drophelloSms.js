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

  const data = await res.json();
  if (!data || data.status !== 'success') {
    const err = new Error(`DropHello SMS rejected: ${data?.desc || data?.message || 'unknown error'}`);
    err.code = 'SMS_FAILED';
    throw err;
  }

  if (!isProduction) {
    console.log('[otp] SMS dispatched to channel=phone, logid=', data.logid);
  }
}

module.exports = { sendSms };