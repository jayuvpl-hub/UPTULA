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
// `membershipType` and `durationDays` are what activateMembershipForPayment()
// writes into premium_memberships — the plan key itself is not a valid value
// for that table's membership_type ENUM('basic','premium','enterprise').
const PLANS = {
  premium_monthly: {
    label: 'Employer Premium — Monthly',
    amountPaise: 99900, // ₹999.00 — amount is in paise (smallest INR unit)
    membershipType: 'premium',
    durationDays: 30,
  },
  premium_yearly: {
    label: 'Employer Premium — Yearly',
    amountPaise: 999900, // ₹9,999.00
    membershipType: 'premium',
    durationDays: 365,
  },
  test_rupee: {
    label: 'Test Payment — ₹1',
    amountPaise: 100, // ₹1.00 — for end-to-end test transactions only
    membershipType: 'premium',
    durationDays: 1,
    // Never purchasable in production, so a real customer can't buy a year of
    // premium for a rupee if this plan is ever left exposed in the UI.
    testOnly: true,
  },
};

function getPlan(planKey, { allowTestPlans = true } = {}) {
  const plan = PLANS[planKey];
  if (!plan) return null;
  if (plan.testOnly && !allowTestPlans) return null;
  return plan;
}

/** Plans safe to show to a buyer in the current environment. */
function listPurchasablePlans({ allowTestPlans = true } = {}) {
  return Object.entries(PLANS)
    .filter(([, plan]) => allowTestPlans || !plan.testOnly)
    .map(([key, plan]) => ({
      key,
      label: plan.label,
      amountPaise: plan.amountPaise,
      durationDays: plan.durationDays,
    }));
}

module.exports = { PLANS, getPlan, listPurchasablePlans };