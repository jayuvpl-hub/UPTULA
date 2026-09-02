import React from 'react';
import { 
  FaStar, FaHashtag, FaUser, FaEnvelope, FaTag, 
  FaCheckCircle, FaTimesCircle, 
  FaCalendarAlt, FaCalendarCheck, FaCrown
} from 'react-icons/fa';

// Premium Members View Component
export const PremiumMembersView = ({ premiumMembers }) => {
  const list = Array.isArray(premiumMembers) ? premiumMembers : [];
  
  const getMembershipTypeColor = (type) => {
    const colors = {
      'enterprise': { bg: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', text: '#fff', icon: <FaCrown /> },
      'premium': { bg: 'linear-gradient(135deg, #f6c23e 0%, #e0a800 100%)', text: '#fff', icon: <FaStar /> },
      'basic': { bg: 'linear-gradient(135deg, #36b9cc 0%, #2c9faf 100%)', text: '#fff', icon: <FaTag /> },
      'gold': { bg: 'linear-gradient(135deg, #ffd700 0%, #ffed4e 100%)', text: '#333', icon: <FaStar /> }
    };
    return colors[type] || colors['basic'];
  };

  return (
    <div style={{
      backgroundColor: 'white',
      borderRadius: '16px',
      boxShadow: '0 4px 15px rgba(0,0,0,0.08)',
      overflow: 'hidden'
    }}>
      {/* Header */}
      <div style={{ 
        padding: '24px', 
        borderBottom: '2px solid #e8eaf6', 
        background: 'linear-gradient(135deg, #f8f9fc 0%, #ffffff 100%)'
      }}>
        <h2 style={{ 
          margin: 0, 
          color: '#2d3748', 
          fontSize: '1.5rem', 
          fontWeight: '800',
          display: 'flex',
          alignItems: 'center',
          gap: '10px'
        }}>
          <FaStar style={{ color: '#f6c23e', fontSize: '24px' }} />
          Premium Members ({list.length})
        </h2>
        <p style={{ margin: '8px 0 0 0', color: '#718096', fontSize: '0.9rem' }}>
          Manage and track premium membership subscriptions
        </p>
      </div>

      {/* Table */}
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: 'linear-gradient(135deg, #f6c23e 0%, #e0a800 100%)' }}>
              <th style={{ padding: '16px 20px', textAlign: 'left', borderBottom: 'none', color: '#fff', fontWeight: '700', fontSize: '14px' }}>
                <FaHashtag style={{ marginRight: '8px' }} /> ID
              </th>
              <th style={{ padding: '16px 20px', textAlign: 'left', borderBottom: 'none', color: '#fff', fontWeight: '700', fontSize: '14px' }}>
                <FaUser style={{ marginRight: '8px' }} /> Name
              </th>
              <th style={{ padding: '16px 20px', textAlign: 'left', borderBottom: 'none', color: '#fff', fontWeight: '700', fontSize: '14px' }}>
                <FaEnvelope style={{ marginRight: '8px' }} /> Email
              </th>
              <th style={{ padding: '16px 20px', textAlign: 'left', borderBottom: 'none', color: '#fff', fontWeight: '700', fontSize: '14px' }}>
                <FaTag style={{ marginRight: '8px' }} /> Membership Type
              </th>
              <th style={{ padding: '16px 20px', textAlign: 'left', borderBottom: 'none', color: '#fff', fontWeight: '700', fontSize: '14px' }}>
                <FaCheckCircle style={{ marginRight: '8px' }} /> Status
              </th>
              <th style={{ padding: '16px 20px', textAlign: 'left', borderBottom: 'none', color: '#fff', fontWeight: '700', fontSize: '14px' }}>
                <span style={{ marginRight: '8px', fontSize: '16px', fontWeight: 'bold' }}>₹</span> Price
              </th>
              <th style={{ padding: '16px 20px', textAlign: 'left', borderBottom: 'none', color: '#fff', fontWeight: '700', fontSize: '14px' }}>
                <FaCalendarAlt style={{ marginRight: '8px' }} /> Start Date
              </th>
              <th style={{ padding: '16px 20px', textAlign: 'left', borderBottom: 'none', color: '#fff', fontWeight: '700', fontSize: '14px' }}>
                <FaCalendarCheck style={{ marginRight: '8px' }} /> End Date
              </th>
            </tr>
          </thead>
          <tbody>
            {list.map((member, idx) => {
              const membershipColor = getMembershipTypeColor(member.membership_type);
              return (
                <tr 
                  key={member.id} 
                  style={{ 
                    borderBottom: '1px solid #e8eaf6',
                    background: idx % 2 === 0 ? '#fff' : '#f8f9fc',
                    transition: 'all 0.3s ease'
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = '#f6c23e10'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = idx % 2 === 0 ? '#fff' : '#f8f9fc'; }}
                >
                  <td style={{ padding: '16px 20px' }}>
                    <span style={{
                      padding: '4px 10px',
                      background: 'linear-gradient(135deg, #f6c23e20 0%, #e0a80020 100%)',
                      borderRadius: '6px',
                      fontSize: '13px',
                      fontWeight: '700',
                      color: '#f6c23e'
                    }}>
                      #{member.id}
                    </span>
                  </td>
                  <td style={{ padding: '16px 20px' }}>
                    <div style={{ fontWeight: '600', color: '#2d3748', fontSize: '14px' }}>
                      {member.full_name}
                    </div>
                  </td>
                  <td style={{ padding: '16px 20px' }}>
                    <div style={{ fontSize: '14px', color: '#2d3748', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <FaEnvelope style={{ color: '#f6c23e', fontSize: '12px' }} />
                      {member.email}
                    </div>
                  </td>
                  <td style={{ padding: '16px 20px' }}>
                    <span style={{
                      padding: '6px 12px',
                      borderRadius: '8px',
                      fontSize: '12px',
                      fontWeight: '700',
                      textTransform: 'capitalize',
                      background: membershipColor.bg,
                      color: membershipColor.text,
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                      boxShadow: '0 2px 8px rgba(0,0,0,0.15)'
                    }}>
                      {membershipColor.icon}
                      {member.membership_type || 'basic'}
                    </span>
                  </td>
                  <td style={{ padding: '16px 20px' }}>
                    <span style={{
                      padding: '6px 12px',
                      borderRadius: '8px',
                      fontSize: '12px',
                      fontWeight: '700',
                      textTransform: 'capitalize',
                      background: member.status === 'active' 
                        ? 'linear-gradient(135deg, #d4edda 0%, #c3e6cb 100%)' 
                        : 'linear-gradient(135deg, #f8d7da 0%, #f5c6cb 100%)',
                      color: member.status === 'active' ? '#155724' : '#721c24',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px'
                    }}>
                      {member.status === 'active' ? <FaCheckCircle /> : <FaTimesCircle />}
                      {member.status}
                    </span>
                  </td>
                  <td style={{ padding: '16px 20px' }}>
                    <div style={{ 
                      fontSize: '15px', 
                      fontWeight: '700', 
                      color: '#1cc88a',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px'
                    }}>
                      <span style={{ fontSize: '16px', fontWeight: 'bold' }}>₹</span>
                      {member.price || '0.00'}
                    </div>
                  </td>
                  <td style={{ padding: '16px 20px' }}>
                    <div style={{ fontSize: '13px', color: '#718096', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <FaCalendarAlt style={{ color: '#f6c23e', fontSize: '12px' }} />
                      {member.start_date ? new Date(member.start_date).toLocaleDateString() : 'N/A'}
                    </div>
                  </td>
                  <td style={{ padding: '16px 20px' }}>
                    <div style={{ fontSize: '13px', color: '#718096', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <FaCalendarCheck style={{ color: '#f6c23e', fontSize: '12px' }} />
                      {member.end_date ? new Date(member.end_date).toLocaleDateString() : <span style={{ color: '#a0aec0' }}>N/A</span>}
                    </div>
                  </td>
                </tr>
              );
            })}
            {list.length === 0 && (
              <tr>
                <td colSpan="8" style={{ padding: '60px 20px', textAlign: 'center', color: '#a0aec0' }}>
                  <div style={{ fontSize: '64px', marginBottom: '16px' }}>⭐</div>
                  <p style={{ fontSize: '1rem', fontWeight: '600', margin: 0 }}>
                    No premium members found.
                  </p>
                  <p style={{ fontSize: '0.85rem', marginTop: '8px', opacity: 0.8 }}>
                    Premium members will appear here once they subscribe
                  </p>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// Payments View Component
export const PaymentsView = ({ payments, paymentStats, downloadStats, analyticsData }) => {
  const list = Array.isArray(payments) ? payments : [];
  const analyticsList = Array.isArray(analyticsData?.payments) ? analyticsData.payments : [];
  const analyticsStats = analyticsData?.stats || {};
  const analyticsTopEmployers = Array.isArray(analyticsData?.topEmployers) ? analyticsData.topEmployers : [];

  const parseMetadata = (metadata) => {
    if (!metadata) return {};
    if (typeof metadata === 'object') return metadata;
    try {
      return JSON.parse(metadata);
    } catch (err) {
      console.error('Failed to parse analytics metadata', err);
      return {};
    }
  };

  const formatCurrency = (value, currency = 'USD') => {
    const amount = Number(value || 0);
    return `${currency === 'USD' ? '$' : `${currency} `}${amount.toFixed(2)}`;
  };

  return (
  <div>
    {/* Payment Statistics */}
    <div style={{ 
      display: 'grid', 
      gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
      gap: '20px',
      marginBottom: '30px'
    }}>
      <div style={{
        backgroundColor: 'white',
        padding: '20px',
        borderRadius: '8px',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
        borderLeft: '4px solid #28a745'
      }}>
        <h3 style={{ color: '#28a745', margin: '0 0 10px 0' }}>Total Revenue</h3>
        <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#333' }}>
          ${paymentStats.overall?.total_revenue || 0}
        </div>
      </div>

      <div style={{
        backgroundColor: 'white',
        padding: '20px',
        borderRadius: '8px',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
        borderLeft: '4px solid #007bff'
      }}>
        <h3 style={{ color: '#007bff', margin: '0 0 10px 0' }}>Total Payments</h3>
        <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#333' }}>
          {paymentStats.overall?.total_payments || 0}
        </div>
      </div>

      <div style={{
        backgroundColor: 'white',
        padding: '20px',
        borderRadius: '8px',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
        borderLeft: '4px solid #ffc107'
      }}>
        <h3 style={{ color: '#ffc107', margin: '0 0 10px 0' }}>Membership Revenue</h3>
        <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#333' }}>
          ${paymentStats.overall?.membership_revenue || 0}
        </div>
      </div>

      <div style={{
        backgroundColor: 'white',
        padding: '20px',
        borderRadius: '8px',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
        borderLeft: '4px solid #dc3545'
      }}>
        <h3 style={{ color: '#dc3545', margin: '0 0 10px 0' }}>Total Downloads</h3>
        <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#333' }}>
          {downloadStats.overall?.total_downloads || 0}
        </div>
      </div>
    </div>

    {/* Analytics Payments Summary */}
    <div style={{
      backgroundColor: 'white',
      borderRadius: '8px',
      boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
      marginBottom: '30px',
      overflow: 'hidden'
    }}>
      <div style={{ padding: '20px', borderBottom: '1px solid #eee' }}>
        <h2 style={{ margin: 0, color: '#333' }}>Employer Analytics Payments</h2>
        <p style={{ margin: '6px 0 0', color: '#6b7280' }}>
          Tracks premium purchases for the Analytics Reports feature (post trial).
        </p>
      </div>

      <div style={{
        padding: '20px',
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
        gap: '20px'
      }}>
        <div style={{
          backgroundColor: '#f0f5ff',
          borderRadius: '10px',
          padding: '16px',
          borderLeft: '4px solid #4e73df'
        }}>
          <p style={{ margin: 0, textTransform: 'uppercase', fontSize: '12px', letterSpacing: '0.15em', color: '#4e73df' }}>
            Analytics Revenue
          </p>
          <h3 style={{ margin: '10px 0 0', color: '#1f2937' }}>
            {formatCurrency(analyticsStats?.completed_revenue || 0, 'USD')}
          </h3>
          <small style={{ color: '#6b7280' }}>Completed transactions only</small>
        </div>

        <div style={{
          backgroundColor: '#fef3c7',
          borderRadius: '10px',
          padding: '16px',
          borderLeft: '4px solid #f59e0b'
        }}>
          <p style={{ margin: 0, textTransform: 'uppercase', fontSize: '12px', letterSpacing: '0.15em', color: '#b45309' }}>
            Transactions
          </p>
          <h3 style={{ margin: '10px 0 0', color: '#92400e' }}>
            {analyticsStats?.total_transactions || 0}
          </h3>
          <small style={{ color: '#b45309' }}>All statuses</small>
        </div>

        <div style={{
          backgroundColor: '#ecfccb',
          borderRadius: '10px',
          padding: '16px',
          borderLeft: '4px solid #65a30d'
        }}>
          <p style={{ margin: 0, textTransform: 'uppercase', fontSize: '12px', letterSpacing: '0.15em', color: '#3f6212' }}>
            Pending Revenue
          </p>
          <h3 style={{ margin: '10px 0 0', color: '#365314' }}>
            {formatCurrency(analyticsStats?.pending_revenue || 0, 'USD')}
          </h3>
          <small style={{ color: '#3f6212' }}>Awaiting confirmation</small>
        </div>

        <div style={{
          backgroundColor: '#f3f4f6',
          borderRadius: '10px',
          padding: '16px',
          borderLeft: '4px solid #9ca3af'
        }}>
          <p style={{ margin: 0, textTransform: 'uppercase', fontSize: '12px', letterSpacing: '0.15em', color: '#4b5563' }}>
            Last Payment
          </p>
          <h3 style={{ margin: '10px 0 0', color: '#111827' }}>
            {analyticsStats?.last_payment_at ? new Date(analyticsStats.last_payment_at).toLocaleString() : '—'}
          </h3>
          <small style={{ color: '#6b7280' }}>UTC local time</small>
        </div>
      </div>

      <div style={{ padding: '0 20px 20px' }}>
        <h4 style={{ margin: '0 0 10px', color: '#374151' }}>Top Employers</h4>
        {analyticsTopEmployers.length === 0 ? (
          <p style={{ margin: 0, color: '#6b7280' }}>No analytics payments recorded yet.</p>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ backgroundColor: '#f8fafc' }}>
                  <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #e5e7eb' }}>Employer</th>
                  <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #e5e7eb' }}>Email</th>
                  <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #e5e7eb' }}>Purchases</th>
                  <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #e5e7eb' }}>Revenue</th>
                  <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #e5e7eb' }}>Last Purchase</th>
                </tr>
              </thead>
              <tbody>
                {analyticsTopEmployers.map((employer) => (
                  <tr key={employer.id} style={{ borderBottom: '1px solid #e5e7eb' }}>
                    <td style={{ padding: '12px', fontWeight: '500' }}>{employer.full_name}</td>
                    <td style={{ padding: '12px', color: '#6b7280' }}>{employer.email}</td>
                    <td style={{ padding: '12px' }}>{employer.purchases}</td>
                    <td style={{ padding: '12px' }}>{formatCurrency(employer.revenue, 'USD')}</td>
                    <td style={{ padding: '12px' }}>
                      {employer.last_payment_at ? new Date(employer.last_payment_at).toLocaleDateString() : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>

    {/* Analytics Payments Table */}
    <div style={{
      backgroundColor: 'white',
      borderRadius: '8px',
      boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
      overflow: 'hidden',
      marginBottom: '30px'
    }}>
      <div style={{ padding: '20px', borderBottom: '1px solid #eee' }}>
        <h2 style={{ margin: 0, color: '#333' }}>
          Analytics Reports Transactions ({analyticsList.length})
        </h2>
      </div>
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ backgroundColor: '#f8f9fc' }}>
              <th style={{ padding: '15px', textAlign: 'left', borderBottom: '1px solid #eee' }}>Employer</th>
              <th style={{ padding: '15px', textAlign: 'left', borderBottom: '1px solid #eee' }}>Plan</th>
              <th style={{ padding: '15px', textAlign: 'left', borderBottom: '1px solid #eee' }}>Feature</th>
              <th style={{ padding: '15px', textAlign: 'left', borderBottom: '1px solid #eee' }}>Amount</th>
              <th style={{ padding: '15px', textAlign: 'left', borderBottom: '1px solid #eee' }}>Status</th>
              <th style={{ padding: '15px', textAlign: 'left', borderBottom: '1px solid #eee' }}>Method</th>
              <th style={{ padding: '15px', textAlign: 'left', borderBottom: '1px solid #eee' }}>Transaction</th>
              <th style={{ padding: '15px', textAlign: 'left', borderBottom: '1px solid #eee' }}>Date</th>
            </tr>
          </thead>
          <tbody>
            {analyticsList.length === 0 ? (
              <tr>
                <td colSpan="8" style={{ padding: '20px', textAlign: 'center', color: '#6b7280' }}>
                  No analytics payments recorded yet.
                </td>
              </tr>
            ) : (
              analyticsList.map((payment) => {
                const metadata = parseMetadata(payment.metadata);
                return (
                  <tr key={payment.id} style={{ borderBottom: '1px solid #eee' }}>
                    <td style={{ padding: '15px' }}>
                      <div style={{ fontWeight: '600' }}>{payment.full_name}</div>
                      <div style={{ fontSize: '12px', color: '#6b7280' }}>{payment.email}</div>
                    </td>
                    <td style={{ padding: '15px' }}>
                      <span style={{
                        padding: '4px 8px',
                        borderRadius: '12px',
                        fontSize: '12px',
                        backgroundColor: '#eef2ff',
                        color: '#4338ca'
                      }}>
                        {metadata.planId || 'analytics_pro'}
                      </span>
                    </td>
                    <td style={{ padding: '15px', color: '#6b7280' }}>
                      {metadata.featureKey || 'job_analytics_dashboard'}
                    </td>
                    <td style={{ padding: '15px' }}>
                      {formatCurrency(payment.amount, payment.currency)}
                    </td>
                    <td style={{ padding: '15px' }}>
                      <span style={{
                        padding: '4px 8px',
                        borderRadius: '12px',
                        fontSize: '12px',
                        backgroundColor: payment.status === 'completed' ? '#d4edda' : '#fef3c7',
                        color: payment.status === 'completed' ? '#166534' : '#92400e'
                      }}>
                        {payment.status}
                      </span>
                    </td>
                    <td style={{ padding: '15px' }}>{payment.payment_method}</td>
                    <td style={{ padding: '15px', fontFamily: 'monospace', fontSize: '12px' }}>
                      {payment.transaction_id}
                    </td>
                    <td style={{ padding: '15px' }}>
                      {new Date(payment.created_at).toLocaleString()}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>

    {/* Payment History */}
    <div style={{
      backgroundColor: 'white',
      borderRadius: '8px',
      boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
      overflow: 'hidden'
    }}>
      <div style={{ padding: '20px', borderBottom: '1px solid #eee' }}>
        <h2 style={{ margin: 0, color: '#333' }}>Payment History ({list.length})</h2>
      </div>
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ backgroundColor: '#f8f9fc' }}>
              <th style={{ padding: '15px', textAlign: 'left', borderBottom: '1px solid #eee' }}>ID</th>
              <th style={{ padding: '15px', textAlign: 'left', borderBottom: '1px solid #eee' }}>User</th>
              <th style={{ padding: '15px', textAlign: 'left', borderBottom: '1px solid #eee' }}>Amount</th>
              <th style={{ padding: '15px', textAlign: 'left', borderBottom: '1px solid #eee' }}>Type</th>
              <th style={{ padding: '15px', textAlign: 'left', borderBottom: '1px solid #eee' }}>Status</th>
              <th style={{ padding: '15px', textAlign: 'left', borderBottom: '1px solid #eee' }}>Method</th>
              <th style={{ padding: '15px', textAlign: 'left', borderBottom: '1px solid #eee' }}>Date</th>
            </tr>
          </thead>
          <tbody>
            {list.map(payment => (
              <tr key={payment.id} style={{ borderBottom: '1px solid #eee' }}>
                <td style={{ padding: '15px' }}>{payment.id}</td>
                <td style={{ padding: '15px' }}>
                  <div>
                    <div style={{ fontWeight: 'bold' }}>{payment.full_name}</div>
                    <div style={{ fontSize: '12px', color: '#666' }}>{payment.email}</div>
                  </div>
                </td>
                <td style={{ padding: '15px' }}>${payment.amount}</td>
                <td style={{ padding: '15px' }}>
                  <span style={{
                    padding: '4px 8px',
                    borderRadius: '12px',
                    fontSize: '12px',
                    backgroundColor: payment.payment_type === 'membership' ? '#e3f2fd' : '#fff3e0',
                    color: payment.payment_type === 'membership' ? '#1976d2' : '#f57c00'
                  }}>
                    {payment.payment_type}
                  </span>
                </td>
                <td style={{ padding: '15px' }}>
                  <span style={{
                    padding: '4px 8px',
                    borderRadius: '12px',
                    fontSize: '12px',
                    backgroundColor: payment.status === 'completed' ? '#d4edda' : '#f8d7da',
                    color: payment.status === 'completed' ? '#155724' : '#721c24'
                  }}>
                    {payment.status}
                  </span>
                </td>
                <td style={{ padding: '15px' }}>{payment.payment_method}</td>
                <td style={{ padding: '15px' }}>{new Date(payment.created_at).toLocaleDateString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  </div>
  );
}
