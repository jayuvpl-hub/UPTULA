/**
 * Agent-registration welcome SMS (separate DLT template from OTP SMS).
 */
const { normalizeIndianPhone } = require('./indianPhone');
const { isProduction } = require('../config/env');

// must match the DLT-approved template ID
const AGENT_WELCOME_SMS_TEXT =
  'Welcome to Uptula,  An Uptula agent created your account. Did not expect this? Secure it now using Forgot Password.';

async function sendAgentWelcomeSms(phone) {
  const templateId = process.env.DROPHELLO_AGENT_WELCOME_TEMPLATE_ID;
  if (!templateId || !String(templateId).trim()) {
    console.warn('[agent-welcome-sms] skipped: DROPHELLO_AGENT_WELCOME_TEMPLATE_ID is empty');
    return;
  }

  const mobile = normalizeIndianPhone(phone);
  if (!mobile) {
    console.warn('[agent-welcome-sms] skipped: phone is not a valid 10-digit Indian mobile');
    return;
  }

  const auth = process.env.DROPHELLO_AUTH_KEY;
  const senderid = process.env.DROPHELLO_SENDER_ID;
  const entity_id = process.env.DROPHELLO_ENTITY_ID;
  const SEND_URL = process.env.DROPHELLO_SEND_URL || 'http://sms.drophello.com/API/sms-api.php';

  if (!auth || !senderid) {
    console.warn('[agent-welcome-sms] skipped: DropHello SMS client is not configured');
    return;
  }

  const params = new URLSearchParams({
    auth,
    msisdn: mobile,
    senderid,
    message: AGENT_WELCOME_SMS_TEXT,
    template_id: String(templateId).trim(),
  });
  if (entity_id) params.set('entity_id', entity_id);

  const res = await fetch(`${SEND_URL}?${params.toString()}`, { method: 'GET' });
  if (!res.ok) {
    throw new Error(`DropHello agent welcome SMS failed (HTTP ${res.status})`);
  }

  const raw = await res.text();
  let data;
  try {
    data = JSON.parse(raw);
  } catch (_) {
    throw new Error(`DropHello agent welcome SMS non-JSON: ${raw.slice(0, 120)}`);
  }

  if (!data || data.status !== 'success') {
    throw new Error(
      `DropHello agent welcome SMS rejected: ${data?.desc || data?.message || 'unknown error'}`
    );
  }

  if (!isProduction) {
    console.log(`[agent-welcome-sms] submitted to=${mobile} logid=${data.logid || 'n/a'}`);
  }
}

module.exports = { sendAgentWelcomeSms, AGENT_WELCOME_SMS_TEXT };
