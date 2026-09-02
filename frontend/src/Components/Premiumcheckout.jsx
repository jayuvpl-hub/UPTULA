import { useState } from 'react';

/**
 * Loads the Razorpay Checkout script once, on demand.
 */
function loadRazorpayScript() {
  return new Promise((resolve) => {
    if (window.Razorpay) {
      resolve(true);
      return;
    }
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

/**
 * PremiumCheckout — call this with the plan the employer picked
 * (e.g. "premium_monthly"). This component holds NO secrets and
 * makes NO direct calls to Razorpay's API — it only talks to our
 * own backend, which does the secure part.
 */
export default function PremiumCheckout({ plan, onSuccess, onFailure }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handlePay = async () => {
    setLoading(true);
    setError(null);

    try {
      const scriptLoaded = await loadRazorpayScript();
      if (!scriptLoaded) {
        throw new Error('Failed to load payment gateway. Check your connection.');
      }

      // 1. Ask OUR backend to create the order. We only send the plan
      //    name — never an amount. The backend decides the real price.
      const createRes = await fetch('/api/payments/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include', // send auth cookie/session
        body: JSON.stringify({ plan }),
      });

      if (!createRes.ok) {
        const errBody = await createRes.json().catch(() => ({}));
        throw new Error(errBody.error || 'Could not start payment');
      }

      const { orderId, amount, currency, keyId, planLabel } = await createRes.json();

      // 2. Open Razorpay's Checkout widget with the order details.
      //    keyId here is the PUBLIC key — safe to expose in the browser.
      const options = {
        key: keyId,
        amount,
        currency,
        order_id: orderId,
        name: 'Uptula',
        description: planLabel,
        handler: async (response) => {
          // 3. Payment succeeded from the widget's point of view —
          //    but we do NOT trust that alone. Send it to our backend
          //    for real signature verification before treating it as paid.
          try {
            const verifyRes = await fetch('/api/payments/verify', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              credentials: 'include',
              body: JSON.stringify({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
              }),
            });

            const verifyData = await verifyRes.json();

            if (verifyRes.ok && (verifyData.status === 'success' || verifyData.status === 'already_verified')) {
              onSuccess?.(verifyData);
            } else {
              onFailure?.(verifyData.error || 'Payment could not be verified');
            }
          } catch (verifyErr) {
            console.error('Verification request failed:', verifyErr);
            onFailure?.('Payment verification failed. Please contact support with your payment ID.');
          } finally {
            setLoading(false);
          }
        },
        modal: {
          // If the user closes the popup without paying, just reset loading —
          // don't treat it as an error, and don't call onFailure.
          ondismiss: () => setLoading(false),
        },
        theme: { color: '#0f9d58' }, // match Uptula's brand color
      };

      const rzp = new window.Razorpay(options);

      rzp.on('payment.failed', (resp) => {
        console.error('Razorpay payment.failed event:', resp.error);
        setLoading(false);
        onFailure?.(resp.error?.description || 'Payment failed');
      });

      rzp.open();
    } catch (err) {
      console.error(err);
      setError(err.message);
      setLoading(false);
    }
  };

  return (
    <div>
      <button onClick={handlePay} disabled={loading}>
        {loading ? 'Processing…' : 'Upgrade to Premium'}
      </button>
      {error && <p style={{ color: 'red' }}>{error}</p>}
    </div>
  );
}