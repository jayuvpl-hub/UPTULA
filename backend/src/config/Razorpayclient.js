// Central place to initialize the Razorpay SDK.
// Import this everywhere instead of creating new Razorpay() instances elsewhere.

const Razorpay = require('razorpay');

if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
  // Fail loudly at startup rather than silently misbehaving later.
  throw new Error(
    'Missing RAZORPAY_KEY_ID or RAZORPAY_KEY_SECRET in environment variables. ' +
    'Check your .env file.'
  );
}

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

module.exports = razorpay;