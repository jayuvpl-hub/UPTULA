import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { API_BASE_URL } from '../config/api';
import Header from '../Components/Header';
import Footer from '../Components/Footer';
import EmployerSidebar from './Sidebar';

const rupees = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  maximumFractionDigits: 0,
});

function planPriceLabel(plan) {
  const price = rupees.format(plan.amountPaise / 100);
  if (plan.durationDays === 30) return `${price} / month`;
  if (plan.durationDays === 365) return `${price} / year`;
  return `${price} / ${plan.durationDays} days`;
}

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

const EmployerPremiumManager = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  const [downloadStatus, setDownloadStatus] = useState(null);
  const [currentMembership, setCurrentMembership] = useState(null);
  const [downloadHistory, setDownloadHistory] = useState([]);
  const [payments, setPayments] = useState([]);
  const [planOptions, setPlanOptions] = useState([]);
  const [loading, setLoading] = useState(true);

  // Per-action loading/error state, keyed so multiple buttons don't fight
  // over a single shared "loading" flag.
  const [payingPlan, setPayingPlan] = useState(null); // which plan is mid-checkout
  const [refundingOrderId, setRefundingOrderId] = useState(null);
  const [actionError, setActionError] = useState(null);
  const [actionMessage, setActionMessage] = useState(null);

  useEffect(() => {
    if (!user) {
      navigate('/');
      return;
    }
    if (user.role !== 'provider') {
      navigate('/');
      return;
    }
  }, [user, navigate]);

  const authHeaders = useCallback(() => {
    const token = localStorage.getItem('token');
    return { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };
  }, []);

  const loadData = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const [statusRes, membershipRes, historyRes, paymentsRes, plansRes] = await Promise.all([
        fetch(`${API_BASE_URL}/api/premium/download-status`, { headers: authHeaders() }),
        fetch(`${API_BASE_URL}/api/premium/my-membership`, { headers: authHeaders() }),
        fetch(`${API_BASE_URL}/api/premium/download-history`, { headers: authHeaders() }),
        fetch(`${API_BASE_URL}/api/payments/my-payments`, { headers: authHeaders() }),
        // Prices and the set of available plans come from the server, so the
        // test plan can never show up in production.
        fetch(`${API_BASE_URL}/api/payments/plans`, { headers: authHeaders() }),
      ]);

      if (statusRes.ok) {
        setDownloadStatus(await statusRes.json());
      }

      if (membershipRes.ok) {
        const data = await membershipRes.json();
        setCurrentMembership(
          data.membership || { type: 'Free', status: 'inactive', isActive: false, price: 0, endDate: null }
        );
      }

      if (historyRes.ok) {
        const data = await historyRes.json();
        setDownloadHistory(data.downloads || []);
      }

      if (paymentsRes.ok) {
        const data = await paymentsRes.json();
        setPayments(data.payments || []);
      }

      if (plansRes.ok) {
        const data = await plansRes.json();
        setPlanOptions(data.plans || []);
      }
    } catch (error) {
      console.error('Error loading premium data:', error);
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handlePay = async (planKey) => {
    setActionError(null);
    setActionMessage(null);
    setPayingPlan(planKey);

    try {
      const scriptLoaded = await loadRazorpayScript();
      if (!scriptLoaded) {
        throw new Error('Failed to load payment gateway. Check your connection and try again.');
      }

      // 1. Ask our backend to create the order — we only send the plan
      //    name, never an amount. Backend decides the real price.
      const createRes = await fetch(`${API_BASE_URL}/api/payments/create-order`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({ plan: planKey }),
      });

      if (!createRes.ok) {
        const errBody = await createRes.json().catch(() => ({}));
        throw new Error(errBody.error || 'Could not start payment');
      }

      const { orderId, amount, currency, keyId, planLabel } = await createRes.json();

      // 2. Open Razorpay's Checkout widget — the real UI with Card / UPI /
      //    Netbanking / Wallet tabs.
      const options = {
        key: keyId,
        amount,
        currency,
        order_id: orderId,
        name: 'Uptula',
        description: planLabel,
        prefill: {
          name: user?.name || '',
          email: user?.email || '',
          contact: user?.phone || '',
        },
        handler: async (response) => {
          // 3. Payment succeeded from the widget's point of view — verify
          //    it server-side before trusting it.
          try {
            const verifyRes = await fetch(`${API_BASE_URL}/api/payments/verify`, {
              method: 'POST',
              headers: authHeaders(),
              body: JSON.stringify({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
              }),
            });

            const verifyData = await verifyRes.json();

            if (verifyRes.ok && (verifyData.status === 'success' || verifyData.status === 'already_verified')) {
              setActionMessage('Payment successful! Your premium plan is now active.');
              await loadData(); // refresh membership status + payment history
            } else {
              setActionError(verifyData.error || 'Payment could not be verified. Please contact support.');
            }
          } catch (verifyErr) {
            console.error('Verification request failed:', verifyErr);
            setActionError('Payment verification failed. If money was deducted, please contact support with your payment ID.');
          } finally {
            setPayingPlan(null);
          }
        },
        modal: {
          ondismiss: () => setPayingPlan(null), // user closed popup without paying — not an error
        },
        theme: { color: '#4e73df' }, // matches this page's existing accent color
      };

      const rzp = new window.Razorpay(options);

      rzp.on('payment.failed', (resp) => {
        console.error('Razorpay payment.failed event:', resp.error);
        setPayingPlan(null);
        setActionError(resp.error?.description || 'Payment failed. Please try again.');
      });

      rzp.open();
    } catch (err) {
      console.error(err);
      setActionError(err.message);
      setPayingPlan(null);
    }
  };

  const handleRefund = async (orderId) => {
    setActionError(null);
    setActionMessage(null);

    if (!window.confirm('Request a refund for this payment? This cannot be undone.')) {
      return;
    }

    setRefundingOrderId(orderId);
    try {
      const res = await fetch(`${API_BASE_URL}/api/payments/refund-request`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({ order_id: orderId, reason: 'Requested by user from dashboard' }),
      });
      const data = await res.json();

      if (res.ok) {
        setActionMessage('Refund processed successfully.');
        await loadData();
      } else {
        setActionError(data.error || 'Unable to process refund.');
      }
    } catch (err) {
      console.error('Refund request failed:', err);
      setActionError('Unable to process refund. Please try again.');
    } finally {
      setRefundingOrderId(null);
    }
  };

  // Fetched with the Authorization header and handed to the browser as a blob.
  // Putting the JWT in a query string instead would leak it into load balancer
  // and CloudWatch access logs.
  const handleDownloadInvoice = async (orderId) => {
    setActionError(null);
    try {
      const res = await fetch(`${API_BASE_URL}/api/payments/${orderId}/invoice`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || 'Invoice is not available yet.');
      }

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `invoice-${orderId}.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Invoice download failed:', err);
      setActionError(err.message);
    }
  };

  if (authLoading || loading) {
    return (
      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height: '100vh',
          backgroundColor: '#f8f9fa',
        }}
      >
        <div
          style={{
            textAlign: 'center',
            padding: '40px',
            backgroundColor: 'white',
            borderRadius: '8px',
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
          }}
        >
          <div
            style={{
              width: '40px',
              height: '40px',
              border: '4px solid #f3f3f3',
              borderTop: '4px solid #4e73df',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite',
              margin: '0 auto 20px',
            }}
          ></div>
          <p>Loading...</p>
        </div>
        <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  const cardStyle = {
    backgroundColor: 'white',
    borderRadius: '8px',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
    padding: '20px',
    marginBottom: '20px',
  };

  const statusBadge = (status) => {
    const map = {
      completed: { bg: '#d4edda', color: '#155724', label: 'Paid' },
      pending: { bg: '#fff3cd', color: '#856404', label: 'Pending' },
      failed: { bg: '#f8d7da', color: '#721c24', label: 'Failed' },
      refunded: { bg: '#e2e3e5', color: '#383d41', label: 'Refunded' },
    };
    const s = map[status] || { bg: '#e2e3e5', color: '#383d41', label: status };
    return (
      <span
        style={{
          padding: '4px 10px',
          borderRadius: '12px',
          fontSize: '12px',
          fontWeight: 600,
          backgroundColor: s.bg,
          color: s.color,
        }}
      >
        {s.label}
      </span>
    );
  };

  return (
    <>
      <Header />
      <style>{`
        @media (max-width: 991px) {
          .employer-dashboard-sidebar { display: none !important; }
          .employer-dashboard-main { width: 100% !important; max-width: 100% !important; float: none !important; }
        }
      `}</style>
      <section className="brows-job-category">
        <div className="container">
          <div className="row">
            <div className="col-md-3 employer-dashboard-sidebar">
              <EmployerSidebar active="premium" />
            </div>

            <div className="col-md-9 employer-dashboard-main">
              <div style={{ padding: '20px', backgroundColor: '#f8f9fc', minHeight: '100vh' }}>

                {/* Inline feedback banners */}
                {actionMessage && (
                  <div style={{ backgroundColor: '#d4edda', color: '#155724', padding: '12px', borderRadius: '4px', marginBottom: '20px', border: '1px solid #c3e6cb' }}>
                    {actionMessage}
                  </div>
                )}
                {actionError && (
                  <div style={{ backgroundColor: '#f8d7da', color: '#721c24', padding: '12px', borderRadius: '4px', marginBottom: '20px', border: '1px solid #f5c6cb' }}>
                    {actionError}
                  </div>
                )}

                {/* Download Status */}
                {downloadStatus && (
                  <div style={cardStyle}>
                    <h2 style={{ color: '#333', marginBottom: '20px' }}>📊 Download Status</h2>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px' }}>
                      <div style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: '32px', fontWeight: 'bold', color: downloadStatus.isPremium ? '#28a745' : '#ffc107' }}>
                          {downloadStatus.remainingDownloads}
                        </div>
                        <div style={{ color: '#666' }}>Remaining Downloads</div>
                      </div>
                      <div style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#007bff' }}>{downloadStatus.dailyDownloads}</div>
                        <div style={{ color: '#666' }}>Today's Downloads</div>
                      </div>
                      <div style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#6c757d' }}>{downloadStatus.dailyLimit}</div>
                        <div style={{ color: '#666' }}>Daily Limit</div>
                      </div>
                      <div style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: '32px', fontWeight: 'bold', color: downloadStatus.isPremium ? '#28a745' : '#6c757d' }}>
                          {downloadStatus.isPremium ? '⭐' : '🔒'}
                        </div>
                        <div style={{ color: '#666' }}>Status</div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Current Membership */}
                {currentMembership && (
                  <div style={cardStyle}>
                    <h2 style={{ color: '#333', marginBottom: '20px' }}>⭐ Current Membership</h2>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px' }}>
                      <div><strong>Type:</strong> {currentMembership.type}</div>
                      <div>
                        <strong>Status:</strong>
                        <span style={{
                          padding: '4px 8px', borderRadius: '12px', fontSize: '12px',
                          backgroundColor: currentMembership.isActive ? '#d4edda' : '#f8d7da',
                          color: currentMembership.isActive ? '#155724' : '#721c24', marginLeft: '8px',
                        }}>
                          {currentMembership.status}
                        </span>
                      </div>
                      <div><strong>Price:</strong> ₹{currentMembership.price ?? 0}</div>
                      <div>
                        <strong>Expires:</strong>{' '}
                        {currentMembership.endDate ? new Date(currentMembership.endDate).toLocaleDateString() : 'Never'}
                      </div>
                    </div>
                  </div>
                )}

                {/* Plan Selection — the real payment trigger */}
                <div style={cardStyle}>
                  <h2 style={{ color: '#333', marginBottom: '20px' }}>💳 Upgrade Your Plan</h2>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px' }}>
                    {planOptions.map((plan) => (
                      <div
                        key={plan.key}
                        style={{
                          border: '1px solid #e0e0e0',
                          borderRadius: '8px',
                          padding: '20px',
                          textAlign: 'center',
                        }}
                      >
                        <h3 style={{ marginBottom: '8px', color: '#333' }}>{plan.label}</h3>
                        <p style={{ color: '#4e73df', fontSize: '20px', fontWeight: 'bold', marginBottom: '16px' }}>
                          {planPriceLabel(plan)}
                        </p>
                        <button
                          onClick={() => handlePay(plan.key)}
                          disabled={payingPlan !== null}
                          style={{
                            padding: '10px 24px',
                            backgroundColor: payingPlan === plan.key ? '#8ca0e0' : '#4e73df',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: payingPlan !== null ? 'not-allowed' : 'pointer',
                            fontWeight: 600,
                          }}
                        >
                          {payingPlan === plan.key ? 'Processing…' : 'Upgrade Now'}
                        </button>
                      </div>
                    ))}
                  </div>
                  <p style={{ marginTop: '16px', fontSize: '13px', color: '#888' }}>
                    Payments are processed securely via Razorpay. Refunds are available within 3 days of payment.
                  </p>
                </div>

                {/* Payment / Billing History */}
                <div style={cardStyle}>
                  <h2 style={{ color: '#333', marginBottom: '20px' }}>🧾 Payment History</h2>
                  {payments.length === 0 ? (
                    <p style={{ color: '#666', textAlign: 'center' }}>No payments yet</p>
                  ) : (
                    <div style={{ overflowX: 'auto' }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                          <tr style={{ backgroundColor: '#f8f9fc' }}>
                            <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #eee' }}>Date</th>
                            <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #eee' }}>Plan</th>
                            <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #eee' }}>Amount</th>
                            <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #eee' }}>Status</th>
                            <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #eee' }}>Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {payments.map((p) => (
                            <tr key={p.order_id} style={{ borderBottom: '1px solid #eee' }}>
                              <td style={{ padding: '12px' }}>{new Date(p.created_at).toLocaleDateString()}</td>
                              <td style={{ padding: '12px' }}>{p.description || p.payment_type}</td>
                              <td style={{ padding: '12px' }}>₹{Number(p.amount).toFixed(2)}</td>
                              <td style={{ padding: '12px' }}>{statusBadge(p.status)}</td>
                              <td style={{ padding: '12px' }}>
                                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                                  {p.invoiceAvailable && (
                                    <button
                                      onClick={() => handleDownloadInvoice(p.order_id)}
                                      style={{
                                        padding: '6px 12px', fontSize: '12px', backgroundColor: '#f1f5f9',
                                        border: '1px solid #cbd5e1', borderRadius: '4px', cursor: 'pointer',
                                      }}
                                    >
                                      📄 Invoice
                                    </button>
                                  )}
                                  {p.status === 'completed' && p.refundEligible && (
                                    <button
                                      onClick={() => handleRefund(p.order_id)}
                                      disabled={refundingOrderId === p.order_id}
                                      style={{
                                        padding: '6px 12px', fontSize: '12px', backgroundColor: '#fff5f5',
                                        border: '1px solid #fca5a5', color: '#b91c1c', borderRadius: '4px',
                                        cursor: refundingOrderId === p.order_id ? 'not-allowed' : 'pointer',
                                      }}
                                    >
                                      {refundingOrderId === p.order_id ? 'Processing…' : '↩ Request Refund'}
                                    </button>
                                  )}
                                  {p.status === 'completed' && !p.refundEligible && (
                                    <span style={{ fontSize: '12px', color: '#999' }}>Refund window passed</span>
                                  )}
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>

                {/* Download History (unchanged) */}
                <div style={cardStyle}>
                  <h2 style={{ color: '#333', marginBottom: '20px' }}>📥 Download History</h2>
                  {downloadHistory.length === 0 ? (
                    <p style={{ color: '#666', textAlign: 'center' }}>No downloads yet</p>
                  ) : (
                    <div style={{ overflowX: 'auto' }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                          <tr style={{ backgroundColor: '#f8f9fc' }}>
                            <th style={{ padding: '15px', textAlign: 'left', borderBottom: '1px solid #eee' }}>Date</th>
                            <th style={{ padding: '15px', textAlign: 'left', borderBottom: '1px solid #eee' }}>Candidate</th>
                            <th style={{ padding: '15px', textAlign: 'left', borderBottom: '1px solid #eee' }}>Job Title</th>
                            <th style={{ padding: '15px', textAlign: 'left', borderBottom: '1px solid #eee' }}>Company</th>
                          </tr>
                        </thead>
                        <tbody>
                          {downloadHistory.map((download) => (
                            <tr key={download.id} style={{ borderBottom: '1px solid #eee' }}>
                              <td style={{ padding: '15px' }}>{new Date(download.download_date).toLocaleDateString()}</td>
                              <td style={{ padding: '15px' }}>{download.candidate_name}</td>
                              <td style={{ padding: '15px' }}>{download.job_title}</td>
                              <td style={{ padding: '15px' }}>{download.company_name}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>

              </div>
            </div>
          </div>
        </div>
      </section>
      <Footer />
    </>
  );
};

export default EmployerPremiumManager;
// import React, { useState, useEffect } from 'react';
// import { useNavigate } from 'react-router-dom';
// import { useAuth } from '../context/AuthContext';
// import { API_BASE_URL } from '../config/api';
// import Header from '../Components/Header';
// import Footer from '../Components/Footer';
// import EmployerSidebar from './Sidebar';

// const EmployerPremiumManager = () => {
//   const { user, loading: authLoading } = useAuth();
//   const navigate = useNavigate();
//   const [downloadStatus, setDownloadStatus] = useState(null);
//   const [currentMembership, setCurrentMembership] = useState(null);
//   const [downloadHistory, setDownloadHistory] = useState([]);
//   const [loading, setLoading] = useState(true);

//   useEffect(() => {
//     if (!user) {
//       navigate('/');
//       return;
//     }
//     if (user.role !== 'provider') {
//       navigate('/');
//       return;
//     }
//   }, [user, navigate]);

//   useEffect(() => {
//     loadData();
//   }, []);

//   const loadData = async () => {
//     try {
//       const token = localStorage.getItem('token');
//       if (!token) return;

//       const [statusRes, membershipRes, historyRes] = await Promise.all([
//         fetch(`${API_BASE_URL}/api/premium/download-status`, {
//           headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
//         }),
//         fetch(`${API_BASE_URL}/api/premium/my-membership`, {
//           headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
//         }),
//         fetch(`${API_BASE_URL}/api/premium/download-history`, {
//           headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
//         }),
//       ]);

//       if (statusRes.ok) {
//         const data = await statusRes.json();
//         setDownloadStatus(data);
//       }

//       if (membershipRes.ok) {
//         const data = await membershipRes.json();
//         if (data.membership) {
//         setCurrentMembership(data.membership);
//         } else {
//           setCurrentMembership({
//             type: 'Full Access',
//             status: 'active',
//             isActive: true,
//             price: 0,
//             endDate: null
//           });
//         }
//       } else {
//         setCurrentMembership({
//           type: 'Full Access',
//           status: 'active',
//           isActive: true,
//           price: 0,
//           endDate: null
//         });
//       }

//       if (historyRes.ok) {
//         const data = await historyRes.json();
//         setDownloadHistory(data.downloads);
//       }
//     } catch (error) {
//       console.error('Error loading premium data:', error);
//     } finally {
//       setLoading(false);
//     }
//   };

//   if (authLoading) {
//     return (
//       <div
//         style={{
//           display: 'flex',
//           justifyContent: 'center',
//           alignItems: 'center',
//           height: '100vh',
//           backgroundColor: '#f8f9fa',
//         }}
//       >
//         <div
//           style={{
//             textAlign: 'center',
//             padding: '40px',
//             backgroundColor: 'white',
//             borderRadius: '8px',
//             boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
//           }}
//         >
//           <div
//             style={{
//               width: '40px',
//               height: '40px',
//               border: '4px solid #f3f3f3',
//               borderTop: '4px solid #4e73df',
//               borderRadius: '50%',
//               animation: 'spin 1s linear infinite',
//               margin: '0 auto 20px',
//             }}
//           ></div>
//           <p>Loading...</p>
//         </div>
//         <style>
//           {`
//             @keyframes spin {
//               0% { transform: rotate(0deg); }
//               100% { transform: rotate(360deg); }
//             }
//           `}
//         </style>
//       </div>
//     );
//   }

//   if (loading) {
//     return (
//       <div
//         style={{
//           display: 'flex',
//           justifyContent: 'center',
//           alignItems: 'center',
//           height: '200px',
//           backgroundColor: '#f8f9fc',
//         }}
//       >
//         <div style={{ textAlign: 'center' }}>
//           <div
//             style={{
//               width: '40px',
//               height: '40px',
//               border: '4px solid #f3f3f3',
//               borderTop: '4px solid #4e73df',
//               borderRadius: '50%',
//               animation: 'spin 1s linear infinite',
//               margin: '0 auto 20px',
//             }}
//           ></div>
//           <p>Loading premium data...</p>
//         </div>
//         <style>
//           {`
//             @keyframes spin {
//               0% { transform: rotate(0deg); }
//               100% { transform: rotate(360deg); }
//             }
//           `}
//         </style>
//       </div>
//     );
//   }

//   return (
//     <>
//       <Header />
//       <style>{`
//         @media (max-width: 991px) {
//           .employer-dashboard-sidebar { display: none !important; }
//           .employer-dashboard-main {
//             width: 100% !important;
//             max-width: 100% !important;
//             float: none !important;
//           }
//         }
//       `}</style>
//       <section className="brows-job-category">
//         <div className="container">
//           <div className="row">
//             {/* Sidebar */}
//             <div className="col-md-3 employer-dashboard-sidebar">
//               <EmployerSidebar active="premium" />
//             </div>

//             {/* Main Content */}
//             <div className="col-md-9 employer-dashboard-main">
//               <div style={{ padding: '20px', backgroundColor: '#f8f9fc', minHeight: '100vh' }}>
//                   <div
//                     style={{
//                     backgroundColor: '#e3f2fd',
//                     color: '#0c4a6e',
//                       padding: '12px',
//                       borderRadius: '4px',
//                       marginBottom: '20px',
//                     border: '1px solid #90caf9',
//                     }}
//                   >
//                   All employer accounts currently have full premium access while we finish integrating the new billing experience.
//                   </div>

//                 {/* Download Status */}
//                 {downloadStatus && (
//                   <div
//                     style={{
//                       backgroundColor: 'white',
//                       borderRadius: '8px',
//                       boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
//                       padding: '20px',
//                       marginBottom: '20px',
//                     }}
//                   >
//                     <h2 style={{ color: '#333', marginBottom: '20px' }}>📊 Download Status</h2>
//                     <div
//                       style={{
//                         display: 'grid',
//                         gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
//                         gap: '20px',
//                       }}
//                     >
//                       <div style={{ textAlign: 'center' }}>
//                         <div
//                           style={{
//                             fontSize: '32px',
//                             fontWeight: 'bold',
//                             color: downloadStatus.isPremium ? '#28a745' : '#ffc107',
//                           }}
//                         >
//                           {downloadStatus.remainingDownloads}
//                         </div>
//                         <div style={{ color: '#666' }}>Remaining Downloads</div>
//                       </div>
//                       <div style={{ textAlign: 'center' }}>
//                         <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#007bff' }}>
//                           {downloadStatus.dailyDownloads}
//                         </div>
//                         <div style={{ color: '#666' }}>Today's Downloads</div>
//                       </div>
//                       <div style={{ textAlign: 'center' }}>
//                         <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#6c757d' }}>
//                           {downloadStatus.dailyLimit}
//                         </div>
//                         <div style={{ color: '#666' }}>Daily Limit</div>
//                       </div>
//                       <div style={{ textAlign: 'center' }}>
//                         <div
//                           style={{
//                             fontSize: '32px',
//                             fontWeight: 'bold',
//                             color: downloadStatus.isPremium ? '#28a745' : '#6c757d',
//                           }}
//                         >
//                           {downloadStatus.isPremium ? '⭐' : '🔒'}
//                         </div>
//                         <div style={{ color: '#666' }}>Status</div>
//                       </div>
//                     </div>

//                   </div>
//                 )}

//                 {/* Current Membership */}
//                 {currentMembership && (
//                   <div
//                     style={{
//                       backgroundColor: 'white',
//                       borderRadius: '8px',
//                       boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
//                       padding: '20px',
//                       marginBottom: '20px',
//                     }}
//                   >
//                     <h2 style={{ color: '#333', marginBottom: '20px' }}>⭐ Current Membership</h2>
//                     <div
//                       style={{
//                         display: 'grid',
//                         gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
//                         gap: '20px',
//                       }}
//                     >
//                       <div>
//                         <strong>Type:</strong> {currentMembership.type}
//                       </div>
//                       <div>
//                         <strong>Status:</strong>
//                         <span
//                           style={{
//                             padding: '4px 8px',
//                             borderRadius: '12px',
//                             fontSize: '12px',
//                             backgroundColor: currentMembership.isActive ? '#d4edda' : '#f8d7da',
//                             color: currentMembership.isActive ? '#155724' : '#721c24',
//                             marginLeft: '8px',
//                           }}
//                         >
//                           {currentMembership.status}
//                         </span>
//                       </div>
//                       <div>
//                         <strong>Price:</strong> ${currentMembership.price ?? 0}
//                       </div>
//                       <div>
//                         <strong>Expires:</strong>{' '}
//                         {currentMembership.endDate
//                           ? new Date(currentMembership.endDate).toLocaleDateString()
//                           : 'Never'}
//                       </div>
//                     </div>
//                   </div>
//                 )}

//                 <div
//                   style={{
//                     backgroundColor: '#f1f5f9',
//                     borderRadius: '8px',
//                     padding: '20px',
//                     marginBottom: '20px',
//                     border: '1px dashed #94a3b8'
//                   }}
//                 >
//                   <h3 style={{ color: '#0f172a', marginBottom: '10px' }}>Billing temporarily disabled</h3>
//                   <p style={{ margin: 0, color: '#475569' }}>
//                     Payment and plan selection are currently paused. Every employer receives enterprise-level access by default until the new payment flow is launched.
//                   </p>
//                 </div>

//                 {/* Download History */}
//                 <div
//                   style={{
//                     backgroundColor: 'white',
//                     borderRadius: '8px',
//                     boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
//                     padding: '20px',
//                   }}
//                 >
//                   <h2 style={{ color: '#333', marginBottom: '20px' }}>📥 Download History</h2>
//                   {downloadHistory.length === 0 ? (
//                     <p style={{ color: '#666', textAlign: 'center' }}>No downloads yet</p>
//                   ) : (
//                     <div style={{ overflowX: 'auto' }}>
//                       <table style={{ width: '100%', borderCollapse: 'collapse' }}>
//                         <thead>
//                           <tr style={{ backgroundColor: '#f8f9fc' }}>
//                             <th style={{ padding: '15px', textAlign: 'left', borderBottom: '1px solid #eee' }}>
//                               Date
//                             </th>
//                             <th style={{ padding: '15px', textAlign: 'left', borderBottom: '1px solid #eee' }}>
//                               Candidate
//                             </th>
//                             <th style={{ padding: '15px', textAlign: 'left', borderBottom: '1px solid #eee' }}>
//                               Job Title
//                             </th>
//                             <th style={{ padding: '15px', textAlign: 'left', borderBottom: '1px solid #eee' }}>
//                               Company
//                             </th>
//                           </tr>
//                         </thead>
//                         <tbody>
//                           {downloadHistory.map((download) => (
//                             <tr key={download.id} style={{ borderBottom: '1px solid #eee' }}>
//                               <td style={{ padding: '15px' }}>
//                                 {new Date(download.download_date).toLocaleDateString()}
//                               </td>
//                               <td style={{ padding: '15px' }}>{download.candidate_name}</td>
//                               <td style={{ padding: '15px' }}>{download.job_title}</td>
//                               <td style={{ padding: '15px' }}>{download.company_name}</td>
//                             </tr>
//                           ))}
//                         </tbody>
//                       </table>
//                     </div>
//                   )}
//                 </div>
//               </div>
//             </div> {/* closes col-md-9 */}
//           </div> {/* closes row */}
//         </div> {/* closes container */}
//       </section>
//       <Footer />
//     </>
//   );
// };

// export default EmployerPremiumManager;
