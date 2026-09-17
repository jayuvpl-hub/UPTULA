// Shared "a payment succeeded — now make it real" path.
//
// Both the browser callback (POST /api/payments/verify) and the Razorpay
// webhook need to do exactly the same thing, and previously each had its own
// near-duplicate copy that had already drifted apart. Any fulfilment change
// belongs here so the two entry points cannot disagree.

const db = require('../db');
const razorpay = require('../config/Razorpayclient');
const { activateMembershipForPayment } = require('./membership');
const { generateInvoice } = require('./invoice');
const { sendPaymentSuccessEmail } = require('./mailer');

const STATUS_PAID = 'completed';

/**
 * Confirm with Razorpay that a payment is genuinely captured, then mark the
 * payment row paid and activate premium.
 *
 * The Razorpay API call is not optional. A valid signature only proves the
 * response came from Razorpay — it does not prove the money is ours. An
 * `authorized` payment is still sitting outside the account and gets
 * auto-refunded if never captured, so fulfilling on signature alone hands out
 * premium for money that later disappears.
 *
 * @returns {Promise<{ok: boolean, reason?: string, payment?: object, invoiceNumber?: string, alreadyPaid?: boolean, activation?: object}>}
 */
async function confirmAndFulfilPayment({ razorpayOrderId, razorpayPaymentId }) {
  const rows = await db.query(
    `SELECT * FROM payments WHERE razorpay_order_id = ? LIMIT 1`,
    [razorpayOrderId]
  );
  const payment = rows[0];

  if (!payment) {
    return { ok: false, reason: 'order_not_found' };
  }

  // Ask Razorpay what actually happened rather than trusting the caller.
  let remote;
  try {
    remote = await razorpay.payments.fetch(razorpayPaymentId);
  } catch (err) {
    console.error('[payments] could not fetch payment from Razorpay:', razorpayPaymentId, err.message);
    return { ok: false, reason: 'razorpay_fetch_failed', payment };
  }

  if (remote.order_id !== razorpayOrderId) {
    console.error('[payments] payment/order mismatch', {
      razorpayPaymentId,
      expected: razorpayOrderId,
      actual: remote.order_id,
    });
    return { ok: false, reason: 'order_mismatch', payment };
  }

  const expectedPaise = Math.round(Number(payment.amount) * 100);
  if (Number(remote.amount) !== expectedPaise) {
    console.error('[payments] amount mismatch', {
      razorpayPaymentId,
      expectedPaise,
      actualPaise: remote.amount,
    });
    return { ok: false, reason: 'amount_mismatch', payment };
  }

  if (remote.status !== 'captured') {
    // 'authorized' lands here too: real money, but not yet ours. The webhook
    // for payment.captured will arrive later and fulfilment happens then.
    return { ok: false, reason: `not_captured_${remote.status}`, payment };
  }

  if (payment.status === STATUS_PAID && payment.membership_id) {
    return {
      ok: true,
      alreadyPaid: true,
      payment,
      invoiceNumber: payment.invoice_number,
    };
  }

  const invoiceNumber = payment.invoice_number || `INV-${payment.order_id}`;

  // Guarded so concurrent callers don't both claim the transition.
  await db.query(
    `UPDATE payments
        SET status = ?,
            transaction_id = ?,
            paid_at = COALESCE(paid_at, NOW()),
            invoice_number = ?
      WHERE razorpay_order_id = ? AND status <> ?`,
    [STATUS_PAID, razorpayPaymentId, invoiceNumber, razorpayOrderId, STATUS_PAID]
  );

  const activation = await activateMembershipForPayment(payment.order_id);
  if (!activation.activated && activation.reason && activation.reason !== 'already_activated') {
    // Money is captured but access was not granted — this needs a human.
    console.error('[payments] ACTIVATION FAILED after capture', {
      orderId: payment.order_id,
      userId: payment.user_id,
      reason: activation.reason,
    });
  }

  return { ok: true, payment, invoiceNumber, activation };
}

/**
 * Invoice PDF + receipt email. Deliberately separate from fulfilment: these
 * are recoverable niceties, and a failure here must never look like a failed
 * payment. Safe to call more than once — the DB guards skip repeats.
 */
async function runPaymentSideEffects({ orderId, invoiceNumber }) {
  try {
    let rows = await db.query(
      `SELECT order_id, user_id, amount, payment_type, description,
              invoice_number, invoice_generated_at, invoice_s3_key,
              receipt_email_sent_at
         FROM payments
        WHERE order_id = ?
        LIMIT 1`,
      [orderId]
    );
    const payment = rows[0];
    if (!payment) return;

    const number = invoiceNumber || payment.invoice_number;
    if (!number) return;

    let invoiceKey = payment.invoice_s3_key;

    if (!payment.invoice_generated_at || !invoiceKey) {
      // Atomic claim: /verify and the webhook can run on different AWS
      // instances at the same time. A stale claim becomes retryable after ten
      // minutes in case an instance dies mid-generation.
      const invoiceClaim = await db.query(
        `UPDATE payments
            SET invoice_generation_started_at = NOW()
          WHERE order_id = ?
            AND invoice_s3_key IS NULL
            AND (
              invoice_generation_started_at IS NULL
              OR invoice_generation_started_at < DATE_SUB(NOW(), INTERVAL 10 MINUTE)
            )`,
        [payment.order_id]
      );

      if (invoiceClaim.affectedRows) {
        try {
          invoiceKey = await generateInvoice({
            orderId: payment.order_id,
            invoiceNumber: number,
            amountRupees: payment.amount,
            plan: payment.description || payment.payment_type,
            userId: payment.user_id,
          });

          await db.query(
            `UPDATE payments
                SET invoice_generated_at = NOW(),
                    invoice_generation_started_at = NULL,
                    invoice_s3_key = ?
              WHERE order_id = ?`,
            [invoiceKey, payment.order_id]
          );
        } catch (invoiceErr) {
          await db.query(
            `UPDATE payments SET invoice_generation_started_at = NULL WHERE order_id = ?`,
            [payment.order_id]
          );
          throw invoiceErr;
        }
      } else {
        // Another instance owns generation. If it already finished, use its
        // key; otherwise that instance also owns sending the receipt.
        rows = await db.query(
          `SELECT invoice_s3_key FROM payments WHERE order_id = ? LIMIT 1`,
          [payment.order_id]
        );
        invoiceKey = rows[0]?.invoice_s3_key;
        if (!invoiceKey) return;
      }
    }

    if (!payment.receipt_email_sent_at && invoiceKey) {
      const emailClaim = await db.query(
        `UPDATE payments
            SET receipt_email_started_at = NOW()
          WHERE order_id = ?
            AND receipt_email_sent_at IS NULL
            AND (
              receipt_email_started_at IS NULL
              OR receipt_email_started_at < DATE_SUB(NOW(), INTERVAL 10 MINUTE)
            )`,
        [payment.order_id]
      );

      if (emailClaim.affectedRows) {
        try {
          await sendPaymentSuccessEmail({
            userId: payment.user_id,
            invoiceNumber: number,
            amountRupees: payment.amount,
            attachmentKey: invoiceKey,
          });

          await db.query(
            `UPDATE payments
                SET receipt_email_sent_at = NOW(), receipt_email_started_at = NULL
              WHERE order_id = ?`,
            [payment.order_id]
          );
        } catch (emailErr) {
          await db.query(
            `UPDATE payments SET receipt_email_started_at = NULL WHERE order_id = ?`,
            [payment.order_id]
          );
          throw emailErr;
        }
      }
    }
  } catch (err) {
    console.error('[payments] invoice/email step failed (payment still succeeded):', err.message);
  }
}

module.exports = { confirmAndFulfilPayment, runPaymentSideEffects, STATUS_PAID };
