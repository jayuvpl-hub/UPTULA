const express = require('express');
const crypto = require('crypto');
const router = express.Router();

const db = require('../db');
const { RAZORPAY_WEBHOOK_SECRET } = require('../config/env');
const { confirmAndFulfilPayment, runPaymentSideEffects, STATUS_PAID } = require('../utils/paymentFulfilment');
const { applyRefundForPayment } = require('../utils/membership');

/**
 * Razorpay signs the exact bytes it sent, so this handler must see the raw
 * body. That is why it is mounted before express.json() in app.js.
 */
function verifySignature(rawBody, headerSignature) {
  const signature = Array.isArray(headerSignature) ? headerSignature[0] : headerSignature;
  if (!signature) return false;

  const expected = crypto
    .createHmac('sha256', RAZORPAY_WEBHOOK_SECRET)
    .update(rawBody)
    .digest('hex');

  const a = Buffer.from(expected, 'utf8');
  const b = Buffer.from(String(signature), 'utf8');
  // timingSafeEqual throws on a length mismatch, so compare lengths first.
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

/**
 * Handle one event. Anything thrown here is treated as retryable: the event
 * stays unprocessed and Razorpay redelivers it.
 */
async function handleEvent(event) {
  const type = event.event;

  if (type === 'payment.captured' || type === 'order.paid') {
    const entity = type === 'order.paid'
      ? event.payload.payment.entity
      : event.payload.payment.entity;

    const result = await confirmAndFulfilPayment({
      razorpayOrderId: entity.order_id,
      razorpayPaymentId: entity.id,
    });

    if (!result.ok) {
      if (result.reason === 'order_not_found') {
        // Not ours (or not yet committed). Retrying forever won't help.
        console.warn('[webhook] no local order for', entity.order_id);
        return;
      }
      throw new Error(`fulfilment failed: ${result.reason}`);
    }

    await runPaymentSideEffects({
      orderId: result.payment.order_id,
      invoiceNumber: result.invoiceNumber,
    });
    return;
  }

  if (type === 'payment.failed') {
    const entity = event.payload.payment.entity;
    await db.query(
      `UPDATE payments SET status = 'failed'
        WHERE razorpay_order_id = ? AND status <> ?`,
      [entity.order_id, STATUS_PAID]
    );
    return;
  }

  if (type === 'refund.created' || type === 'refund.processed' || type === 'refund.failed') {
    const refund = event.payload.refund.entity;

    if (type === 'refund.failed') {
      // Clear the claim so the customer can ask again.
      await db.query(
        `UPDATE payments
            SET refund_status = 'failed', refund_requested_at = NULL
          WHERE transaction_id = ? AND status <> 'refunded'`,
        [refund.payment_id]
      );
      return;
    }

    const rows = await db.query(
      `SELECT amount FROM payments WHERE transaction_id = ? LIMIT 1`,
      [refund.payment_id]
    );
    if (!rows.length) {
      console.warn('[webhook] refund for unknown payment', refund.payment_id);
      return;
    }

    const paidPaise = Math.round(Number(rows[0].amount) * 100);
    await applyRefundForPayment({
      razorpayPaymentId: refund.payment_id,
      refundId: refund.id,
      refundAmountRupees: Number(refund.amount) / 100,
      refundStatus: refund.status,
      isFullyRefunded: Number(refund.amount) >= paidPaise,
    });
    return;
  }

  // Unhandled event types are recorded and acknowledged, not retried.
}

router.post('/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  // Returning 503 (rather than throwing) keeps the event in Razorpay's retry
  // queue instead of silently dropping paid orders on a misconfigured deploy.
  if (!RAZORPAY_WEBHOOK_SECRET) {
    console.error('[webhook] RAZORPAY_WEBHOOK_SECRET is not configured');
    return res.status(503).json({ error: 'Webhook not configured' });
  }

  if (!Buffer.isBuffer(req.body)) {
    // Means some body parser ran first and the raw bytes are gone.
    console.error('[webhook] raw body unavailable — check middleware order');
    return res.status(400).json({ error: 'Raw body required' });
  }

  if (!verifySignature(req.body, req.headers['x-razorpay-signature'])) {
    console.warn('[webhook] signature verification FAILED');
    return res.status(400).json({ error: 'Invalid webhook signature' });
  }

  let event;
  try {
    event = JSON.parse(req.body.toString('utf8'));
  } catch (_) {
    return res.status(400).json({ error: 'Malformed webhook payload' });
  }

  const eventId =
    event.id ||
    (Array.isArray(req.headers['x-razorpay-event-id'])
      ? req.headers['x-razorpay-event-id'][0]
      : req.headers['x-razorpay-event-id']) ||
    // Last resort so the UNIQUE index still dedupes a redelivery.
    crypto.createHash('sha256').update(req.body).digest('hex').slice(0, 64);

  let row;
  try {
    // The UNIQUE index on event_id makes this the atomic claim. Razorpay
    // retries an event up to 24 times and multiple instances may receive the
    // same delivery, so fulfilment must happen at most once per event.
    await db.query(
      `INSERT INTO payment_webhook_events
         (event_id, event_type, razorpay_payment_id, razorpay_order_id, raw_payload)
       VALUES (?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE id = id`,
      [
        eventId,
        event.event || 'unknown',
        event.payload?.payment?.entity?.id || event.payload?.refund?.entity?.payment_id || null,
        event.payload?.payment?.entity?.order_id || null,
        JSON.stringify(event),
      ]
    );

    const found = await db.query(
      `SELECT id, processed FROM payment_webhook_events WHERE event_id = ? LIMIT 1`,
      [eventId]
    );
    row = found[0];
  } catch (err) {
    console.error('[webhook] could not record event:', err.message);
    return res.status(500).json({ error: 'Webhook processing error' });
  }

  if (row?.processed) {
    return res.status(200).json({ received: true, duplicate: true });
  }

  try {
    await handleEvent(event);

    await db.query(
      `UPDATE payment_webhook_events
          SET processed = TRUE, processed_at = NOW(), process_error = NULL
        WHERE id = ?`,
      [row.id]
    );

    return res.status(200).json({ received: true });
  } catch (err) {
    console.error('[webhook] handler failed for', event.event, err.message);
    try {
      await db.query(
        `UPDATE payment_webhook_events SET process_error = ? WHERE id = ?`,
        [String(err.message).slice(0, 500), row.id]
      );
    } catch (_) {
      // Recording the error is best-effort.
    }
    // Non-2xx asks Razorpay to redeliver.
    return res.status(500).json({ error: 'Webhook processing error' });
  }
});

module.exports = router;