// const express = require('express');
// const crypto = require('crypto');
// const router = express.Router();

// const db = require('../db');
// const { generateInvoice } = require('../utils/invoice');
// const { sendPaymentSuccessEmail } = require('../utils/mailer');

// /**
//  * POST /api/payments/webhook
//  *
//  * Safety net — Razorpay notifies our backend server-to-server, independent
//  * of whether the frontend's /verify call ever fires.
//  */
// router.post(
//   '/webhook',
//   express.raw({ type: 'application/json' }),
//   async (req, res) => {
//     try {
//       const signature = req.headers['x-razorpay-signature'];
//       const rawBody = req.body;

//       const expectedSignature = crypto
//         .createHmac('sha256', process.env.RAZORPAY_WEBHOOK_SECRET)
//         .update(rawBody)
//         .digest('hex');

//       const isValid =
//         signature &&
//         expectedSignature.length === signature.length &&
//         crypto.timingSafeEqual(Buffer.from(expectedSignature), Buffer.from(signature));

//       if (!isValid) {
//         console.warn('Webhook signature verification FAILED');
//         return res.status(400).json({ error: 'Invalid webhook signature' });
//       }

//       const event = JSON.parse(rawBody.toString('utf8'));

//       await db.query(
//         `INSERT INTO payment_webhook_events
//           (event_type, razorpay_payment_id, razorpay_order_id, raw_payload)
//          VALUES (?, ?, ?, ?)`,
//         [
//           event.event,
//           event.payload?.payment?.entity?.id || null,
//           event.payload?.payment?.entity?.order_id || null,
//           JSON.stringify(event),
//         ]
//       );

//       if (event.event === 'payment.captured') {
//         const paymentEntity = event.payload.payment.entity;
//         const razorpayOrderId = paymentEntity.order_id;
//         const razorpayPaymentId = paymentEntity.id;

//         // Fetch the row first so we know if this update will actually be
//         // the one that marks it paid (avoids double-generating an invoice
//         // if /verify already handled it a second ago).
//         const [rows] = await db.query(
//           `SELECT * FROM payments WHERE razorpay_order_id = ? LIMIT 1`,
//           [razorpayOrderId]
//         );
//         const payment = rows[0];

//         if (payment && payment.status !== 'paid') {
//           const invoiceNumber = `INV-${payment.order_id}`;

//           const [updateResult] = await db.query(
//             `UPDATE payments
//              SET status = 'paid',
//                  razorpay_payment_id = ?,
//                  verified_at = NOW(),
//                  paid_at = NOW(),
//                  invoice_number = ?
//              WHERE razorpay_order_id = ? AND status != 'paid'`,
//             [razorpayPaymentId, invoiceNumber, razorpayOrderId]
//           );

//           // Only run invoice/email if THIS request is the one that actually
//           // flipped the status (affectedRows > 0) — protects against the
//           // webhook and /verify racing and both trying to email the user.
//           if (updateResult.affectedRows > 0) {
//             // await activatePremium(payment.employer_id, payment.plan);

//             try {
//               const invoicePath = await generateInvoice({
//                 orderId: payment.order_id,
//                 invoiceNumber,
//                 amountPaise: payment.amount_paise,
//                 plan: payment.plan,
//                 employerId: payment.employer_id,
//               });

//               await db.query(
//                 `UPDATE payments SET invoice_generated_at = NOW() WHERE order_id = ?`,
//                 [payment.order_id]
//               );

//               await sendPaymentSuccessEmail({
//                 employerId: payment.employer_id,
//                 invoiceNumber,
//                 amountPaise: payment.amount_paise,
//                 attachmentPath: invoicePath,
//               });

//               await db.query(
//                 `UPDATE payments SET receipt_email_sent_at = NOW() WHERE order_id = ?`,
//                 [payment.order_id]
//               );
//             } catch (sideEffectErr) {
//               console.error('Invoice/email step failed (webhook path):', sideEffectErr);
//             }
//           }
//         }
//       }

//       if (event.event === 'payment.failed') {
//         const paymentEntity = event.payload.payment.entity;
//         await db.query(
//           `UPDATE payments SET status = 'failed'
//            WHERE razorpay_order_id = ? AND status != 'paid'`,
//           [paymentEntity.order_id]
//         );
//       }

//       // Safety net for refunds issued directly from the Razorpay dashboard
//       // (not through our /refund-request route) — keeps our DB in sync.
//       if (event.event === 'refund.processed') {
//         const refundEntity = event.payload.refund.entity;
//         await db.query(
//           `UPDATE payments
//            SET status = 'refunded',
//                razorpay_refund_id = ?,
//                refund_amount_paise = ?,
//                refunded_at = NOW()
//            WHERE razorpay_payment_id = ? AND status != 'refunded'`,
//           [refundEntity.id, refundEntity.amount, refundEntity.payment_id]
//         );
//       }

//       return res.status(200).json({ received: true });
//     } catch (err) {
//       console.error('webhook error:', err);
//       return res.status(500).json({ error: 'Webhook processing error' });
//     }
//   }
// );

// module.exports = router;

// /*
// WIRING NOTE for your main app.js / index.js:

//   const webhookRouter = require('./routes/webhook.route');
//   const paymentRouter = require('./routes/payment.route');

//   // Webhook route MUST be registered before app.use(express.json()),
//   // since it needs the raw body for signature verification.
//   app.use('/api/payments', webhookRouter);

//   app.use(express.json());

//   app.use('/api/payments', paymentRouter);
// */
const express = require('express');
const crypto = require('crypto');
const router = express.Router();

const db = require('../db');
const { generateInvoice } = require('../utils/invoice');
const { sendPaymentSuccessEmail } = require('../utils/mailer');

router.post(
  '/webhook',
  express.raw({ type: 'application/json' }),
  async (req, res) => {
    try {
      const signature = req.headers['x-razorpay-signature'];
      const rawBody = req.body;

      const expectedSignature = crypto
        .createHmac('sha256', process.env.RAZORPAY_WEBHOOK_SECRET)
        .update(rawBody)
        .digest('hex');

      const isValid =
        signature &&
        expectedSignature.length === signature.length &&
        crypto.timingSafeEqual(Buffer.from(expectedSignature), Buffer.from(signature));

      if (!isValid) {
        console.warn('Webhook signature verification FAILED');
        return res.status(400).json({ error: 'Invalid webhook signature' });
      }

      const event = JSON.parse(rawBody.toString('utf8'));

      await db.query(
        `INSERT INTO payment_webhook_events
          (event_type, razorpay_payment_id, razorpay_order_id, raw_payload)
         VALUES (?, ?, ?, ?)`,
        [
          event.event,
          event.payload?.payment?.entity?.id || null,
          event.payload?.payment?.entity?.order_id || null,
          JSON.stringify(event),
        ]
      );

      if (event.event === 'payment.captured') {
        const paymentEntity = event.payload.payment.entity;
        const razorpayOrderId = paymentEntity.order_id;
        const razorpayPaymentId = paymentEntity.id;

        const [rows] = await db.query(
          `SELECT * FROM payments WHERE razorpay_order_id = ? LIMIT 1`,
          [razorpayOrderId]
        );
        const payment = rows[0];

        if (payment && payment.status !== 'paid') {
          const invoiceNumber = `INV-${payment.order_id}`;

          const [updateResult] = await db.query(
            `UPDATE payments
             SET status = 'paid',
                 transaction_id = ?,
                 paid_at = NOW(),
                 invoice_number = ?
             WHERE razorpay_order_id = ? AND status != 'paid'`,
            [razorpayPaymentId, invoiceNumber, razorpayOrderId]
          );

          if (updateResult.affectedRows > 0) {
            // await activateMembership(payment.user_id, payment.payment_type);

            try {
              const invoicePath = await generateInvoice({
                orderId: payment.order_id,
                invoiceNumber,
                amountRupees: payment.amount,
                plan: payment.payment_type,
                userId: payment.user_id,
              });

              await db.query(
                `UPDATE payments SET invoice_generated_at = NOW() WHERE order_id = ?`,
                [payment.order_id]
              );

              await sendPaymentSuccessEmail({
                userId: payment.user_id,
                invoiceNumber,
                amountRupees: payment.amount,
                attachmentPath: invoicePath,
              });

              await db.query(
                `UPDATE payments SET receipt_email_sent_at = NOW() WHERE order_id = ?`,
                [payment.order_id]
              );
            } catch (sideEffectErr) {
              console.error('Invoice/email step failed (webhook path):', sideEffectErr);
            }
          }
        }
      }

      if (event.event === 'payment.failed') {
        const paymentEntity = event.payload.payment.entity;
        await db.query(
          `UPDATE payments SET status = 'failed'
           WHERE razorpay_order_id = ? AND status != 'paid'`,
          [paymentEntity.order_id]
        );
      }

      if (event.event === 'refund.processed') {
        const refundEntity = event.payload.refund.entity;
        const refundAmountRupees = refundEntity.amount / 100;
        await db.query(
          `UPDATE payments
           SET status = 'refunded',
               razorpay_refund_id = ?,
               refund_amount = ?,
               refunded_at = NOW()
           WHERE transaction_id = ? AND status != 'refunded'`,
          [refundEntity.id, refundAmountRupees, refundEntity.payment_id]
        );
      }

      return res.status(200).json({ received: true });
    } catch (err) {
      console.error('webhook error:', err);
      return res.status(500).json({ error: 'Webhook processing error' });
    }
  }
);

module.exports = router;

/*
WIRING NOTE for your main app.js / index.js:

  app.use('/api/payments', require('./routes/webhook.route')); // BEFORE express.json()
  app.use(express.json());
  app.use('/api/payments', require('./routes/payment.route'));
*/