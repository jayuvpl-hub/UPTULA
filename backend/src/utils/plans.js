// SINGLE SOURCE OF TRUTH for what each plan costs.
// The frontend only ever sends a plan *name* (e.g. "premium_monthly").
// The backend looks up the real price here — it NEVER trusts an amount
// sent from the browser. This is the #1 rule for payment security:
// the client picks *what* to buy, the server decides *how much it costs*.

// const PLANS = {
//     premium_monthly: {
//       label: 'Employer Premium — Monthly',
//       amountPaise: 99900, // ₹999.00 — amount is in paise (smallest INR unit)
//     },
//     premium_yearly: {
//       label: 'Employer Premium — Yearly',
//       amountPaise: 999900, // ₹9,999.00
//     },
//   };
  
//   function getPlan(planKey) {
//     const plan = PLANS[planKey];
//     if (!plan) {
//       return null;
//     }
//     return plan;
//   }
  
//   module.exports = { PLANS, getPlan };
const PLANS = {
  premium_monthly: {
    label: 'Employer Premium — Monthly',
    amountPaise: 99900, // ₹999.00 — amount is in paise (smallest INR unit)
  },
  premium_yearly: {
    label: 'Employer Premium — Yearly',
    amountPaise: 999900, // ₹9,999.00
  },
  test_rupee: {
    label: 'Test Payment — ₹1',
    amountPaise: 100, // ₹1.00 — for end-to-end test transactions only
  },
};
 
function getPlan(planKey) {
  const plan = PLANS[planKey];
  if (!plan) {
    return null;
  }
  return plan;
}
 
module.exports = { PLANS, getPlan };