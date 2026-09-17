// Central place to initialize the Razorpay SDK.
// Import this everywhere instead of creating new Razorpay() instances elsewhere.

const Razorpay = require('razorpay');
const { RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET, assertRazorpayConfig } = require('./env');

// Throws in production, warns in development. Keeping the check here means a
// misconfigured deploy fails at boot rather than at the first customer payment.
assertRazorpayConfig();

const razorpay = new Razorpay({
  key_id: RAZORPAY_KEY_ID,
  key_secret: RAZORPAY_KEY_SECRET,
});

module.exports = razorpay;
