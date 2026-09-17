// const express = require('express');
// const crypto = require('crypto');
// const router = express.Router();

// const razorpay = require('../config/Razorpayclient');
// const { getPlan } = require('../utils/plans');
// const db = require('../db'); // adjust to your actual DB connection/pool module
// // const requireAuth = require('../middleware/requireAuth'); // your existing auth middleware

// // Placeholder services — implemented later, but wired in now so the call
// // sites exist and the flow is complete. See utils/invoice.js and
// // utils/mailer.js for the stub implementations and what needs finishing.
// const { generateInvoice } = require('../utils/invoice');
// const { sendPaymentSuccessEmail } = require('../utils/mailer');

// // Refund eligibility window, in days. Change this one number if the
// // business rule changes — nothing else needs to move.
// // NOTE: this was referenced in the refund route before but never declared —
// // that would have crashed with a ReferenceError on the first refund attempt.
// const REFUND_WINDOW_DAYS = 3;

// /**
//  * POST /api/payments/create-order
//  */
// router.post('/create-order', /* requireAuth, */ async (req, res) => {
//   try {
//     const { plan: planKey } = req.body;
//     const employerId = req.user?.id;

//     if (!employerId) {
//       return res.status(401).json({ error: 'Not authenticated' });
//     }

//     const plan = getPlan(planKey);
//     if (!plan) {
//       return res.status(400).json({ error: 'Invalid plan selected' });
//     }

//     // Our own unique internal order ID — never reused, never guessable.
//     // This IS the `order_id` column added to the payments table, and it's
//     // what /verify and /refund-request key off of.
//     const orderId = `UPT_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;

//     const razorpayOrder = await razorpay.orders.create({
//       amount: plan.amountPaise,
//       currency: 'INR',
//       receipt: orderId,
//       notes: {
//         employer_id: String(employerId),
//         plan: planKey,
//       },
//     });

//     // NOTE: this INSERT now includes order_id — the earlier version of
//     // this route referenced order_id later (in refund) without ever
//     // inserting it here, so refund lookups would always have failed.
//     await db.query(
//       `INSERT INTO payments
//         (order_id, razorpay_order_id, employer_id, plan, amount_paise, currency, status)
//        VALUES (?, ?, ?, ?, ?, ?, 'created')`,
//       [orderId, razorpayOrder.id, employerId, planKey, plan.amountPaise, 'INR']
//     );

//     return res.json({
//       orderId: razorpayOrder.id,       // Razorpay's order id — needed by Checkout widget
//       internalOrderId: orderId,        // OUR order_id — frontend should hold onto this
//                                         // for later refund-request / invoice-download calls
//       amount: plan.amountPaise,
//       currency: 'INR',
//       keyId: process.env.RAZORPAY_KEY_ID,
//       planLabel: plan.label,
//     });
//   } catch (err) {
//     console.error('create-order error:', err);
//     return res.status(500).json({ error: 'Unable to create payment order' });
//   }
// });

// /**
//  * POST /api/payments/verify
//  */
// router.post('/verify', /* requireAuth, */ async (req, res) => {
//   try {
//     const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

//     if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
//       return res.status(400).json({ error: 'Missing verification fields' });
//     }

//     const expectedSignature = crypto
//       .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
//       .update(`${razorpay_order_id}|${razorpay_payment_id}`)
//       .digest('hex');

//     const isValid =
//       expectedSignature.length === razorpay_signature.length &&
//       crypto.timingSafeEqual(
//         Buffer.from(expectedSignature),
//         Buffer.from(razorpay_signature)
//       );

//     if (!isValid) {
//       console.warn('Signature verification FAILED for order:', razorpay_order_id);
//       return res.status(400).json({ error: 'Payment verification failed' });
//     }

//     const [rows] = await db.query(
//       `SELECT * FROM payments WHERE razorpay_order_id = ? LIMIT 1`,
//       [razorpay_order_id]
//     );
//     const payment = rows[0];

//     if (!payment) {
//       console.error('No matching payment row for order:', razorpay_order_id);
//       return res.status(404).json({ error: 'Order not found' });
//     }

//     if (payment.status === 'paid') {
//       return res.json({ status: 'already_verified' });
//     }

//     // Generate an invoice number now, at the moment of confirmed payment —
//     // this is a good, stable point to assign it (see utils/invoice.js).
//     const invoiceNumber = `INV-${payment.order_id}`;

//     await db.query(
//       `UPDATE payments
//        SET status = 'paid',
//            razorpay_payment_id = ?,
//            verified_at = NOW(),
//            paid_at = NOW(),
//            invoice_number = ?
//        WHERE razorpay_order_id = ?`,
//       [razorpay_payment_id, invoiceNumber, razorpay_order_id]
//     );

//     // await activatePremium(payment.employer_id, payment.plan);

//     // --- Invoice + email hooks ---
//     // These are stubs right now (see utils/invoice.js / utils/mailer.js) —
//     // safe to call today (they won't throw), and ready to fill in with real
//     // PDF generation + SMTP sending later without touching this route again.
//     // Wrapped in their own try/catch so a failure here never breaks the
//     // actual payment confirmation the user is waiting on.
//     try {
//       const invoicePath = await generateInvoice({
//         orderId: payment.order_id,
//         invoiceNumber,
//         amountPaise: payment.amount_paise,
//         plan: payment.plan,
//         employerId: payment.employer_id,
//       });

//       await db.query(
//         `UPDATE payments SET invoice_generated_at = NOW() WHERE order_id = ?`,
//         [payment.order_id]
//       );

//       await sendPaymentSuccessEmail({
//         employerId: payment.employer_id,
//         invoiceNumber,
//         amountPaise: payment.amount_paise,
//         attachmentPath: invoicePath,
//       });

//       await db.query(
//         `UPDATE payments SET receipt_email_sent_at = NOW() WHERE order_id = ?`,
//         [payment.order_id]
//       );
//     } catch (sideEffectErr) {
//       // Log and move on — the payment itself is already confirmed and
//       // saved. Invoice/email failures should never roll back or block
//       // that. Consider a retry queue for this later (e.g. a cron job that
//       // finds payments with invoice_generated_at IS NULL).
//       console.error('Invoice/email step failed (payment still succeeded):', sideEffectErr);
//     }

//     return res.json({ status: 'success', invoiceNumber });
//   } catch (err) {
//     console.error('verify-payment error:', err);
//     return res.status(500).json({ error: 'Unable to verify payment' });
//   }
// });

// /**
//  * POST /api/payments/refund-request
//  */
// router.post('/refund-request', /* requireAuth, */ async (req, res) => {
//   try {
//     const { order_id, reason } = req.body;
//     const requestingUserId = req.user?.id;

//     if (!requestingUserId) {
//       return res.status(401).json({ error: 'Not authenticated' });
//     }
//     if (!order_id) {
//       return res.status(400).json({ error: 'order_id is required' });
//     }

//     const [rows] = await db.query(
//       `SELECT * FROM payments WHERE order_id = ? LIMIT 1`,
//       [order_id]
//     );
//     const payment = rows[0];

//     if (!payment) {
//       return res.status(404).json({ error: 'Payment not found' });
//     }

//     if (payment.employer_id !== requestingUserId) {
//       return res.status(403).json({ error: 'Not authorized to refund this payment' });
//     }

//     if (payment.status === 'refunded') {
//       return res.status(400).json({ error: 'This payment has already been refunded' });
//     }

//     if (payment.status !== 'paid') {
//       return res.status(400).json({ error: 'Only completed payments can be refunded' });
//     }

//     if (!payment.paid_at) {
//       console.error('Payment marked paid but has no paid_at:', payment.order_id);
//       return res.status(500).json({ error: 'Unable to verify payment eligibility' });
//     }

//     const paidAt = new Date(payment.paid_at);
//     const now = new Date();
//     const daysSincePayment = (now - paidAt) / (1000 * 60 * 60 * 24);

//     if (daysSincePayment > REFUND_WINDOW_DAYS) {
//       return res.status(400).json({
//         error: `Refund window has passed. Refunds are only available within ${REFUND_WINDOW_DAYS} days of payment.`,
//       });
//     }

//     const refund = await razorpay.payments.refund(payment.razorpay_payment_id, {
//       amount: payment.amount_paise,
//       speed: 'normal',
//       notes: {
//         reason: reason || 'User-requested refund within eligibility window',
//         internal_order_id: payment.order_id,
//       },
//     });

//     const [updateResult] = await db.query(
//       `UPDATE payments
//        SET status = 'refunded',
//            razorpay_refund_id = ?,
//            refund_amount_paise = ?,
//            refund_reason = ?,
//            refunded_at = NOW()
//        WHERE order_id = ? AND status = 'paid'`,
//       [refund.id, payment.amount_paise, reason || null, order_id]
//     );

//     if (updateResult.affectedRows === 0) {
//       console.warn('Refund race condition detected for order:', order_id);
//     }

//     return res.json({
//       status: 'refunded',
//       refundId: refund.id,
//       amount: payment.amount_paise,
//     });
//   } catch (err) {
//     console.error('refund-request error:', err);
//     return res.status(500).json({ error: 'Unable to process refund' });
//   }
// });

// /**
//  * GET /api/payments/:order_id/invoice
//  *
//  * Lets the user download their invoice/receipt after a successful payment.
//  * Currently returns the file generated by the (stub) generateInvoice() call
//  * in /verify — see utils/invoice.js for what's implemented vs. still to do.
//  */
// router.get('/:order_id/invoice', /* requireAuth, */ async (req, res) => {
//   try {
//     const { order_id } = req.params;
//     const requestingUserId = req.user?.id;

//     const [rows] = await db.query(
//       `SELECT * FROM payments WHERE order_id = ? LIMIT 1`,
//       [order_id]
//     );
//     const payment = rows[0];

//     if (!payment) {
//       return res.status(404).json({ error: 'Payment not found' });
//     }
//     if (payment.employer_id !== requestingUserId) {
//       return res.status(403).json({ error: 'Not authorized' });
//     }
//     if (payment.status !== 'paid' && payment.status !== 'refunded') {
//       return res.status(400).json({ error: 'No invoice available for this payment' });
//     }
//     if (!payment.invoice_generated_at) {
//       return res.status(404).json({ error: 'Invoice not yet generated' });
//     }

//     const invoiceFilePath = `${__dirname}/../storage/invoices/${payment.invoice_number}.pdf`;
//     return res.download(invoiceFilePath, `${payment.invoice_number}.pdf`, (err) => {
//       if (err) {
//         console.error('Invoice download error:', err);
//         if (!res.headersSent) {
//           res.status(404).json({ error: 'Invoice file not found' });
//         }
//       }
//     });
//   } catch (err) {
//     console.error('invoice-download error:', err);
//     return res.status(500).json({ error: 'Unable to fetch invoice' });
//   }
// });

// module.exports = router;


const express = require('express');
const crypto = require('crypto');
const router = express.Router();

const razorpay = require('../config/Razorpayclient');
const { getPlan, listPurchasablePlans } = require('../utils/plans');
const db = require('../db');
const { authenticate } = require('../middleware/auth');
const { RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET, isProduction, isLiveRazorpayKey } = require('../config/env');
const { confirmAndFulfilPayment, runPaymentSideEffects, STATUS_PAID } = require('../utils/paymentFulfilment');
const { applyRefundForPayment } = require('../utils/membership');
const { getInvoiceStream } = require('../utils/invoice');

// Refund eligibility window, in days.
const REFUND_WINDOW_DAYS = 3;

// The payments.status enum predates this integration: an order still awaiting
// payment is 'pending' and a captured payment is 'completed'. Admin revenue
// reporting keys off those exact strings, so they must not be renamed here.
const STATUS_PENDING = 'pending';

// payment_type is a narrow enum too, so the plan key lives in metadata.
const PAYMENT_TYPE = 'membership';

// The ₹1 plan exists to exercise the flow. Real money must never be able to
// buy it, so it disappears as soon as the deploy looks production-like.
const ALLOW_TEST_PLANS = !isProduction && !isLiveRazorpayKey;

function planKeyOf(payment) {
  try {
    const meta =
      typeof payment.metadata === 'string' ? JSON.parse(payment.metadata) : payment.metadata;
    return meta && meta.plan ? meta.plan : null;
  } catch (_) {
    return null;
  }
}

function isRefundEligible(payment) {
  if (payment.status !== STATUS_PAID || !payment.paid_at) return false;
  const daysSincePayment = (Date.now() - new Date(payment.paid_at).getTime()) / 86400000;
  return daysSincePayment <= REFUND_WINDOW_DAYS;
}

/**
 * GET /api/payments/plans
 *
 * The buyable plans, so the UI doesn't hardcode prices or accidentally show a
 * test plan in production.
 */
router.get('/plans', authenticate, (req, res) => {
  return res.json({ plans: listPurchasablePlans({ allowTestPlans: ALLOW_TEST_PLANS }) });
});

/**
 * GET /api/payments/my-payments
 */
router.get('/my-payments', authenticate, async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const rows = await db.query(
      `SELECT order_id, razorpay_order_id, transaction_id, amount, currency,
              status, payment_type, description, metadata,
              invoice_number, invoice_generated_at, invoice_s3_key,
              refund_amount, refund_reason, refund_status, refunded_at,
              paid_at, created_at
         FROM payments
        WHERE user_id = ?
        ORDER BY created_at DESC
        LIMIT 100`,
      [userId]
    );

    const payments = rows.map(({ invoice_s3_key, ...p }) => ({
      ...p,
      plan: planKeyOf(p),
      refundEligible: isRefundEligible(p),
      // The S3 key itself is internal; the UI only needs to know whether the
      // download will work.
      invoiceAvailable: Boolean(invoice_s3_key),
    }));

    return res.json({ payments });
  } catch (err) {
    console.error('my-payments error:', err);
    return res.status(500).json({ error: 'Unable to load payment history' });
  }
});

/**
 * POST /api/payments/create-order
 */
router.post('/create-order', authenticate, async (req, res) => {
  try {
    const { plan: planKey } = req.body;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const plan = getPlan(planKey, { allowTestPlans: ALLOW_TEST_PLANS });
    if (!plan) {
      return res.status(400).json({ error: 'Invalid plan selected' });
    }

    const orderId = `UPT_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;
    const amountRupees = plan.amountPaise / 100;

    const razorpayOrder = await razorpay.orders.create({
      amount: plan.amountPaise, // Razorpay always wants paise
      currency: 'INR',
      receipt: orderId,
      notes: {
        user_id: String(userId),
        plan: planKey,
      },
    });

    await db.query(
      `INSERT INTO payments
        (order_id, razorpay_order_id, user_id, amount, currency,
         payment_method, status, payment_type, description, metadata)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        orderId,
        razorpayOrder.id,
        userId,
        amountRupees,
        'INR',
        'razorpay',
        STATUS_PENDING,
        PAYMENT_TYPE,
        plan.label,
        JSON.stringify({ plan: planKey }),
      ]
    );

    return res.json({
      orderId: razorpayOrder.id,     // Razorpay's order id — for Checkout widget
      internalOrderId: orderId,      // our order_id — frontend keeps this for
                                      // refund-request / invoice-download calls
      amount: plan.amountPaise,      // paise, for the Checkout widget
      currency: 'INR',
      keyId: RAZORPAY_KEY_ID,
      planLabel: plan.label,
    });
  } catch (err) {
    console.error('create-order error:', err);
    return res.status(500).json({ error: 'Unable to create payment order' });
  }
});

/**
 * POST /api/payments/verify
 */
router.post('/verify', authenticate, async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;
    const requestingUserId = req.user?.id;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({ error: 'Missing verification fields' });
    }

    const expectedSignature = crypto
      .createHmac('sha256', RAZORPAY_KEY_SECRET)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest('hex');

    const isValid =
      expectedSignature.length === razorpay_signature.length &&
      crypto.timingSafeEqual(
        Buffer.from(expectedSignature),
        Buffer.from(razorpay_signature)
      );

    if (!isValid) {
      console.warn('Signature verification FAILED for order:', razorpay_order_id);
      return res.status(400).json({ error: 'Payment verification failed' });
    }

    const owner = await db.query(
      `SELECT user_id FROM payments WHERE razorpay_order_id = ? LIMIT 1`,
      [razorpay_order_id]
    );
    if (!owner.length) {
      console.error('No matching payment row for order:', razorpay_order_id);
      return res.status(404).json({ error: 'Order not found' });
    }
    if (Number(owner[0].user_id) !== Number(requestingUserId)) {
      return res.status(403).json({ error: 'Not authorized to verify this payment' });
    }

    // Re-checks the payment against Razorpay's API, marks it paid and grants
    // premium. Shared with the webhook so both paths behave identically.
    const result = await confirmAndFulfilPayment({
      razorpayOrderId: razorpay_order_id,
      razorpayPaymentId: razorpay_payment_id,
    });

    if (!result.ok) {
      // A payment that is authorized but not yet captured is not a failure —
      // the payment.captured webhook will fulfil it shortly.
      if (result.reason && result.reason.startsWith('not_captured')) {
        return res.status(202).json({ status: 'pending', reason: result.reason });
      }
      console.error('verify: fulfilment refused', razorpay_order_id, result.reason);
      return res.status(400).json({ error: 'Payment could not be confirmed' });
    }

    await runPaymentSideEffects({
      orderId: result.payment.order_id,
      invoiceNumber: result.invoiceNumber,
    });

    return res.json({
      status: result.alreadyPaid ? 'already_verified' : 'success',
      invoiceNumber: result.invoiceNumber,
    });
  } catch (err) {
    console.error('verify-payment error:', err);
    return res.status(500).json({ error: 'Unable to verify payment' });
  }
});

/**
 * POST /api/payments/refund-request
 */
router.post('/refund-request', authenticate, async (req, res) => {
  try {
    const { order_id, reason } = req.body;
    const requestingUserId = req.user?.id;

    if (!requestingUserId) {
      return res.status(401).json({ error: 'Not authenticated' });
    }
    if (!order_id) {
      return res.status(400).json({ error: 'order_id is required' });
    }

    const rows = await db.query(
      `SELECT * FROM payments WHERE order_id = ? LIMIT 1`,
      [order_id]
    );
    const payment = rows[0];

    if (!payment) {
      return res.status(404).json({ error: 'Payment not found' });
    }
    if (Number(payment.user_id) !== Number(requestingUserId)) {
      return res.status(403).json({ error: 'Not authorized to refund this payment' });
    }
    if (payment.status === 'refunded') {
      return res.status(400).json({ error: 'This payment has already been refunded' });
    }
    if (payment.status !== STATUS_PAID) {
      return res.status(400).json({ error: 'Only completed payments can be refunded' });
    }
    if (!payment.paid_at) {
      console.error('Payment marked paid but has no paid_at:', payment.order_id);
      return res.status(500).json({ error: 'Unable to verify payment eligibility' });
    }

    const paidAt = new Date(payment.paid_at);
    const now = new Date();
    const daysSincePayment = (now - paidAt) / (1000 * 60 * 60 * 24);

    if (daysSincePayment > REFUND_WINDOW_DAYS) {
      return res.status(400).json({
        error: `Refund window has passed. Refunds are only available within ${REFUND_WINDOW_DAYS} days of payment.`,
      });
    }

    const amountPaise = Math.round(Number(payment.amount) * 100);

    // Claim the refund before talking to Razorpay. Without this, a double
    // click (or a retried request) issues two real refunds for one payment.
    const claim = await db.query(
      `UPDATE payments
          SET refund_status = 'requested',
              refund_requested_at = NOW(),
              refund_reason = ?
        WHERE order_id = ?
          AND status = ?
          AND refund_requested_at IS NULL`,
      [reason || null, order_id, STATUS_PAID]
    );

    if (!claim.affectedRows) {
      return res.status(409).json({ error: 'A refund has already been requested for this payment' });
    }

    let refund;
    try {
      refund = await razorpay.payments.refund(payment.transaction_id, {
        amount: amountPaise,
        // 'optimum' returns the money instantly when Razorpay can manage it
        // and silently falls back to the 5-7 working day path when it can't.
        speed: 'optimum',
        notes: {
          reason: reason || 'User-requested refund within eligibility window',
          internal_order_id: payment.order_id,
        },
      });
    } catch (refundErr) {
      // Release the claim so the customer can try again.
      await db.query(
        `UPDATE payments
            SET refund_status = NULL, refund_requested_at = NULL
          WHERE order_id = ? AND refund_status = 'requested'`,
        [order_id]
      );
      throw refundErr;
    }

    // Records the refund and takes back only the access this payment bought.
    // Razorpay reports 'pending' for non-instant refunds; the refund.processed
    // webhook completes the reversal when the money actually lands.
    const applied = await applyRefundForPayment({
      razorpayPaymentId: payment.transaction_id,
      refundId: refund.id,
      refundAmountRupees: Number(refund.amount) / 100,
      refundStatus: refund.status,
      reason: reason || null,
      isFullyRefunded: Number(refund.amount) >= amountPaise,
    });

    return res.json({
      status: applied.accessRevoked ? 'refunded' : 'refund_initiated',
      refundId: refund.id,
      refundStatus: refund.status,
      amount: Number(refund.amount) / 100,
    });
  } catch (err) {
    console.error('refund-request error:', err);
    return res.status(500).json({ error: 'Unable to process refund' });
  }
});

/**
 * GET /api/payments/:order_id/invoice
 */
router.get('/:order_id/invoice', authenticate, async (req, res) => {
  try {
    const { order_id } = req.params;
    const requestingUserId = req.user?.id;

    const rows = await db.query(
      `SELECT user_id, status, invoice_number, invoice_s3_key
         FROM payments WHERE order_id = ? LIMIT 1`,
      [order_id]
    );
    const payment = rows[0];

    if (!payment) {
      return res.status(404).json({ error: 'Payment not found' });
    }
    if (Number(payment.user_id) !== Number(requestingUserId)) {
      return res.status(403).json({ error: 'Not authorized' });
    }
    if (payment.status !== STATUS_PAID && payment.status !== 'refunded') {
      return res.status(400).json({ error: 'No invoice available for this payment' });
    }
    if (!payment.invoice_s3_key) {
      return res.status(404).json({ error: 'Invoice not yet generated' });
    }

    const { body, contentLength } = await getInvoiceStream(payment.invoice_s3_key);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${payment.invoice_number}.pdf"`);
    if (contentLength) res.setHeader('Content-Length', contentLength);

    // Stream rather than buffer: the response starts immediately and a large
    // invoice never sits in the instance's memory.
    body.on('error', (streamErr) => {
      console.error('Invoice stream error:', streamErr.message);
      res.destroy(streamErr);
    });

    return body.pipe(res);
  } catch (err) {
    console.error('invoice-download error:', err);
    if (!res.headersSent) {
      return res.status(500).json({ error: 'Unable to fetch invoice' });
    }
    return res.end();
  }
});

module.exports = router;