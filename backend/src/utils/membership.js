// Turns a captured payment into actual premium access.
//
// This is the step that was previously a `// await activateMembership(...)`
// comment in both payment.routes.js and webhook.routes.js, which meant a
// customer could pay successfully and receive nothing.
//
// Employer premium is read from `premium_memberships` (see premium.routes.js:
// status = 'active' AND (end_date IS NULL OR end_date > NOW())), so that is
// the table this writes to.

const { withTransaction } = require('../db');
const { getPlan } = require('./plans');

/**
 * Activate (or extend) premium for the user who paid for `orderId`.
 *
 * Idempotent: `payments.membership_id` is the claim marker. The row is locked
 * FOR UPDATE and re-checked inside the transaction, so when the browser
 * callback and the webhook arrive at the same time exactly one of them creates
 * the membership and the other becomes a no-op.
 *
 * @returns {Promise<{activated: boolean, membershipId: number|null, reason?: string}>}
 */
async function activateMembershipForPayment(orderId) {
  return withTransaction(async (tx) => {
    const rows = await tx.query(
      `SELECT id, user_id, amount, status, membership_id, transaction_id, metadata
         FROM payments
        WHERE order_id = ?
        LIMIT 1
        FOR UPDATE`,
      [orderId]
    );
    const payment = rows[0];

    if (!payment) {
      return { activated: false, membershipId: null, reason: 'payment_not_found' };
    }
    // Only a captured payment earns access. Callers are expected to have
    // already confirmed this with Razorpay's Fetch Payment API.
    if (payment.status !== 'completed') {
      return { activated: false, membershipId: null, reason: `payment_status_${payment.status}` };
    }
    if (payment.membership_id) {
      return { activated: false, membershipId: payment.membership_id, reason: 'already_activated' };
    }

    let planKey = null;
    try {
      const meta =
        typeof payment.metadata === 'string' ? JSON.parse(payment.metadata) : payment.metadata;
      planKey = meta && meta.plan ? meta.plan : null;
    } catch (_) {
      planKey = null;
    }

    const plan = getPlan(planKey);
    if (!plan) {
      // Don't guess a duration — a wrong guess either short-changes the
      // customer or gives away access. Surface it for manual handling instead.
      return { activated: false, membershipId: null, reason: `unknown_plan_${planKey}` };
    }

    const features = JSON.stringify({
      plan: planKey,
      durationDays: plan.durationDays,
      source: 'razorpay',
      orderId,
    });

    // Extend rather than replace when the user already has time left, so
    // renewing early never burns the remaining days.
    const existingRows = await tx.query(
      `SELECT id, end_date
         FROM premium_memberships
        WHERE user_id = ?
          AND status = 'active'
          AND (end_date IS NULL OR end_date > NOW())
        ORDER BY end_date IS NULL DESC, end_date DESC
        LIMIT 1
        FOR UPDATE`,
      [payment.user_id]
    );
    const existing = existingRows[0];

    let membershipId;
    if (existing) {
      // end_date NULL means unlimited access; leave it alone.
      if (existing.end_date) {
        await tx.query(
          `UPDATE premium_memberships
              SET end_date = DATE_ADD(end_date, INTERVAL ? DAY),
                  membership_type = ?,
                  payment_method = 'razorpay',
                  transaction_id = ?,
                  features = ?
            WHERE id = ?`,
          [plan.durationDays, plan.membershipType, payment.transaction_id, features, existing.id]
        );
      }
      membershipId = existing.id;
    } else {
      const result = await tx.query(
        `INSERT INTO premium_memberships
           (user_id, membership_type, status, start_date, end_date,
            price, payment_method, transaction_id, features)
         VALUES (?, ?, 'active', NOW(), DATE_ADD(NOW(), INTERVAL ? DAY),
                 ?, 'razorpay', ?, ?)`,
        [
          payment.user_id,
          plan.membershipType,
          plan.durationDays,
          payment.amount,
          payment.transaction_id,
          features,
        ]
      );
      membershipId = result.insertId;
    }

    // Claim the payment. The WHERE guard means a concurrent transaction that
    // somehow got this far still can't double-link it.
    const linked = await tx.query(
      `UPDATE payments
          SET membership_id = ?
        WHERE id = ? AND membership_id IS NULL`,
      [membershipId, payment.id]
    );

    if (!linked.affectedRows) {
      return { activated: false, membershipId, reason: 'already_activated' };
    }

    return { activated: true, membershipId };
  });
}

/**
 * Record a Razorpay refund and remove only the access purchased by this
 * payment once the full refund is processed.
 *
 * If the membership existed before this purchase, activation extended its
 * end_date. Subtracting this plan's duration restores the remaining time
 * instead of cancelling unrelated access. The payment row lock makes repeated
 * refund webhooks idempotent.
 */
async function applyRefundForPayment({
  razorpayPaymentId,
  refundId,
  refundAmountRupees,
  refundStatus,
  reason = null,
  isFullyRefunded = false,
}) {
  return withTransaction(async (tx) => {
    const rows = await tx.query(
      `SELECT id, status, membership_id, metadata
         FROM payments
        WHERE transaction_id = ?
        LIMIT 1
        FOR UPDATE`,
      [razorpayPaymentId]
    );
    const payment = rows[0];

    if (!payment) {
      return { applied: false, reason: 'payment_not_found' };
    }
    if (payment.status === 'refunded') {
      return { applied: false, reason: 'already_refunded' };
    }

    await tx.query(
      `UPDATE payments
          SET razorpay_refund_id = ?,
              refund_amount = ?,
              refund_reason = COALESCE(?, refund_reason),
              refund_status = ?,
              refund_requested_at = COALESCE(refund_requested_at, NOW())
        WHERE id = ?`,
      [refundId, refundAmountRupees, reason, refundStatus, payment.id]
    );

    // A partial or still-pending refund does not cancel the purchased access.
    if (!isFullyRefunded || refundStatus !== 'processed') {
      return { applied: true, accessRevoked: false };
    }

    let planKey = null;
    try {
      const metadata =
        typeof payment.metadata === 'string' ? JSON.parse(payment.metadata) : payment.metadata;
      planKey = metadata && metadata.plan ? metadata.plan : null;
    } catch (_) {
      planKey = null;
    }
    const plan = getPlan(planKey);

    if (!plan) {
      throw new Error(`Cannot reverse membership for unknown plan: ${planKey}`);
    }

    if (payment.membership_id) {
      const memberships = await tx.query(
        `SELECT id, end_date
           FROM premium_memberships
          WHERE id = ?
          LIMIT 1
          FOR UPDATE`,
        [payment.membership_id]
      );
      const membership = memberships[0];

      // Never shorten pre-existing unlimited/manual access.
      if (membership && membership.end_date) {
        await tx.query(
          `UPDATE premium_memberships
              SET end_date = DATE_SUB(end_date, INTERVAL ? DAY),
                  status = CASE
                    WHEN DATE_SUB(end_date, INTERVAL ? DAY) <= NOW() THEN 'cancelled'
                    ELSE status
                  END
            WHERE id = ?`,
          [plan.durationDays, plan.durationDays, membership.id]
        );
      }
    }

    await tx.query(
      `UPDATE payments
          SET status = 'refunded',
              refund_status = 'processed',
              refunded_at = NOW()
        WHERE id = ? AND status <> 'refunded'`,
      [payment.id]
    );

    return { applied: true, accessRevoked: true };
  });
}

module.exports = { activateMembershipForPayment, applyRefundForPayment };
