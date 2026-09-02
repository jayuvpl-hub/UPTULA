import React, { useEffect, useState } from 'react';
import { API_BASE_URL } from '../config/api';
import { 
  FaHeadset, FaSignOutAlt, FaCreditCard, FaBuilding, 
  FaTicketAlt, FaUserShield, FaSearch, FaFilter, 
  FaCheckCircle, FaTimesCircle, FaClock,
  FaEnvelope, FaPhone, FaCalendarAlt, FaEdit, FaPlus,
  FaSpinner, FaArrowLeft, FaArrowRight, FaUser, FaLock,
  FaToggleOn, FaToggleOff, FaCalendarCheck, FaTag, FaHashtag
} from 'react-icons/fa';

const CSRDashboard = () => {
  const [activeTab, setActiveTab] = useState('payments'); // payments | employers | tickets | access
  const [payments, setPayments] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0, limit: 20 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filters, setFilters] = useState({ q: '', status: '', type: '' });
  const [employerQuery, setEmployerQuery] = useState('');
  const [employers, setEmployers] = useState([]);
  const [employersPage, setEmployersPage] = useState({ page: 1, pages: 1, total: 0, limit: 20 });
  const [selectedEmployer, setSelectedEmployer] = useState(null);
  const [selectedEmployerUsage, setSelectedEmployerUsage] = useState(null);
  const [tickets, setTickets] = useState([]);
  const [ticketsPage, setTicketsPage] = useState({ page: 1, pages: 1, total: 0, limit: 20 });
  const [ticketFilters, setTicketFilters] = useState({ q: '', status: '', category: '', employerId: '' });
  const [newTicket, setNewTicket] = useState({ employerId: '', subject: '', category: 'general', priority: 'medium', description: '' });
  const [accessForm, setAccessForm] = useState({ employerId: '', newPassword: '', active: true, extendDays: 30 });
  const [token, setToken] = useState(() => localStorage.getItem('csToken'));

  // Auto-load tickets when entering the Tickets tab and poll every 15s while on it
  useEffect(() => {
    let interval;
    const loadTickets = async () => {
      try {
        const params = new URLSearchParams({ page: '1', limit: '20' });
        const res = await fetch(`${API_BASE_URL}/api/customer/tickets?${params.toString()}`, { headers: { Authorization: `Bearer ${token}` } });
        const data = await res.json();
        if (res.ok) {
          setTickets(data.tickets || []);
          setTicketsPage(data.pagination || { page: 1, pages: 1, total: 0, limit: 20 });
        }
      } catch {}
    };
    if (activeTab === 'tickets') {
      loadTickets();
      interval = setInterval(loadTickets, 15000);
    }
    return () => { if (interval) clearInterval(interval); };
  }, [activeTab, token]);

  const fetchPayments = async (page = 1, filtersArg = filters) => {
    setLoading(true);
    setError('');
    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: String(pagination.limit),
        ...(filtersArg.q ? { q: filtersArg.q } : {}),
        ...(filtersArg.status ? { status: filtersArg.status } : {}),
        ...(filtersArg.type ? { type: filtersArg.type } : {})
      });
      const response = await fetch(`${API_BASE_URL}/api/customer/payments?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await response.json();
      if (!response.ok) {
        setError(data.message || 'Failed to load payments');
        return;
      }
      setPayments(data.payments || []);
      setPagination(data.pagination || { page: 1, pages: 1, total: 0, limit: 20 });
    } catch (err) {
      setError('Network error: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const stored = localStorage.getItem('csToken');
    if (!stored) {
      window.location.replace('/cs/login');
      return;
    }
    setToken(stored);
    fetchPayments(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleApplyFilters = (e) => {
    e.preventDefault();
    fetchPayments(1, filters);
  };

  const logout = () => {
    localStorage.removeItem('csToken');
    window.location.replace('/cs/login');
  };

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #e8f5e9 0%, #f1f8e9 50%, #f9fbe7 100%)' }}>
      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
      {/* Header */}
      <header style={{ 
        background: 'linear-gradient(135deg, #1abc9c 0%, #16a085 100%)', 
        color: '#fff', 
        padding: '16px 24px', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'space-between',
        boxShadow: '0 4px 20px rgba(26, 188, 156, 0.3)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <FaHeadset style={{ fontSize: '24px' }} />
          <h2 style={{ margin: 0, fontSize: '20px', fontWeight: '700' }}>Customer Service Dashboard</h2>
        </div>
        <button 
          type="button" 
          onClick={logout} 
          style={{ 
            background: 'rgba(255,255,255,0.2)', 
            color: '#fff', 
            border: '1px solid rgba(255,255,255,0.3)',
            borderRadius: '8px', 
            padding: '10px 16px', 
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            fontSize: '14px',
            fontWeight: '600',
            transition: 'all 0.3s ease'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'rgba(255,255,255,0.3)';
            e.currentTarget.style.transform = 'translateY(-2px)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'rgba(255,255,255,0.2)';
            e.currentTarget.style.transform = 'translateY(0)';
          }}
        >
          <FaSignOutAlt /> Logout
        </button>
      </header>

      <main style={{ display: 'flex', gap: 0 }}>
        {/* Sidebar */}
        <aside style={{ 
          background: 'linear-gradient(180deg, #ffffff 0%, #f8f9fa 100%)', 
          boxShadow: '0 8px 24px rgba(0,0,0,0.1)', 
          padding: '16px',
          width: '260px',
          minHeight: 'calc(100vh - 80px)',
          position: 'sticky',
          top: 0
        }}>
          <nav>
            {[
              { key: 'tickets', label: 'Tickets', icon: <FaTicketAlt /> },
              { key: 'payments', label: 'Payments', icon: <FaCreditCard /> },
              { key: 'employers', label: 'Employers', icon: <FaBuilding /> },
              { key: 'access', label: 'User Access', icon: <FaUserShield /> }
            ].map(item => (
              <div key={item.key} style={{ marginBottom: '6px' }}>
                <a 
                  href="#" 
                  onClick={(e) => { e.preventDefault(); setActiveTab(item.key); setError(''); }} 
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    padding: '14px 16px',
                    borderRadius: '10px',
                  textDecoration: 'none',
                    color: activeTab === item.key ? '#fff' : '#2d3748',
                    background: activeTab === item.key 
                      ? 'linear-gradient(135deg, #1abc9c 0%, #16a085 100%)' 
                      : 'transparent',
                    fontWeight: activeTab === item.key ? '700' : '500',
                    fontSize: '15px',
                    transition: 'all 0.3s ease',
                    boxShadow: activeTab === item.key ? '0 4px 12px rgba(26, 188, 156, 0.3)' : 'none'
                  }}
                  onMouseEnter={(e) => {
                    if (activeTab !== item.key) {
                      e.currentTarget.style.background = '#e8f5e9';
                      e.currentTarget.style.transform = 'translateX(4px)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (activeTab !== item.key) {
                      e.currentTarget.style.background = 'transparent';
                      e.currentTarget.style.transform = 'translateX(0)';
                    }
                  }}
                >
                  <span style={{ fontSize: '18px' }}>{item.icon}</span>
                  {item.label}
                </a>
              </div>
            ))}
          </nav>
        </aside>

        <section style={{ flex: 1, maxWidth: '1400px', margin: '24px auto', padding: '0 20px' }}>
          {activeTab === 'payments' && (
            <form onSubmit={handleApplyFilters} style={{ 
              display: 'grid', 
              gridTemplateColumns: '1fr 180px 200px 140px', 
              gap: 12, 
              marginBottom: 20,
              background: 'white',
              padding: '20px',
              borderRadius: '16px',
              boxShadow: '0 4px 15px rgba(0,0,0,0.08)'
            }}>
              <div style={{ position: 'relative' }}>
                <FaSearch style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#1abc9c', fontSize: '16px', zIndex: 2, pointerEvents: 'none' }} />
                <input 
                  placeholder="Search description, employer name, email, phone" 
                  value={filters.q} 
                  onChange={(e) => setFilters({ ...filters, q: e.target.value })} 
                  style={{ 
                    padding: '12px 12px 12px 42px', 
                    borderRadius: '10px', 
                    border: '2px solid #e8eaf6',
                    fontSize: '14px',
                    outline: 'none',
                    transition: 'all 0.3s ease',
                    width: '100%',
                    boxSizing: 'border-box',
                    background: 'linear-gradient(135deg, #ffffff 0%, #f8f9fc 100%)'
                  }}
                  onFocus={(e) => { e.target.style.borderColor = '#1abc9c'; e.target.style.boxShadow = '0 0 0 3px rgba(26, 188, 156, 0.1)'; }}
                  onBlur={(e) => { e.target.style.borderColor = '#e8eaf6'; e.target.style.boxShadow = 'none'; }}
                />
              </div>
              <div style={{ position: 'relative' }}>
                <FaFilter style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#1abc9c', fontSize: '16px', zIndex: 2, pointerEvents: 'none' }} />
                <select 
                  value={filters.status} 
                  onChange={(e) => setFilters({ ...filters, status: e.target.value })} 
                  style={{ 
                    padding: '12px 12px 12px 42px', 
                    borderRadius: '10px', 
                    border: '2px solid #e8eaf6',
                    fontSize: '14px',
                    outline: 'none',
                    transition: 'all 0.3s ease',
                    width: '100%',
                    cursor: 'pointer',
                    background: 'linear-gradient(135deg, #ffffff 0%, #f8f9fc 100%)',
                    appearance: 'none'
                  }}
                  onFocus={(e) => { e.target.style.borderColor = '#1abc9c'; e.target.style.boxShadow = '0 0 0 3px rgba(26, 188, 156, 0.1)'; }}
                  onBlur={(e) => { e.target.style.borderColor = '#e8eaf6'; e.target.style.boxShadow = 'none'; }}
                >
                <option value="">All Statuses</option>
                <option value="pending">Pending</option>
                <option value="completed">Completed</option>
                <option value="failed">Failed</option>
                <option value="refunded">Refunded</option>
              </select>
              </div>
              <div style={{ position: 'relative' }}>
                <FaTag style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#1abc9c', fontSize: '16px', zIndex: 2, pointerEvents: 'none' }} />
                <select 
                  value={filters.type} 
                  onChange={(e) => setFilters({ ...filters, type: e.target.value })} 
                  style={{ 
                    padding: '12px 12px 12px 42px', 
                    borderRadius: '10px', 
                    border: '2px solid #e8eaf6',
                    fontSize: '14px',
                    outline: 'none',
                    transition: 'all 0.3s ease',
                    width: '100%',
                    cursor: 'pointer',
                    background: 'linear-gradient(135deg, #ffffff 0%, #f8f9fc 100%)',
                    appearance: 'none'
                  }}
                  onFocus={(e) => { e.target.style.borderColor = '#1abc9c'; e.target.style.boxShadow = '0 0 0 3px rgba(26, 188, 156, 0.1)'; }}
                  onBlur={(e) => { e.target.style.borderColor = '#e8eaf6'; e.target.style.boxShadow = 'none'; }}
                >
                <option value="">All Types</option>
                <option value="membership">Membership</option>
                <option value="resume_download">Resume Download</option>
                <option value="job_posting">Job Posting</option>
                <option value="other">Other</option>
              </select>
              </div>
              <button 
                type="submit" 
                style={{ 
                  padding: '12px 20px', 
                  borderRadius: '10px', 
                  border: 0, 
                  background: 'linear-gradient(135deg, #1abc9c 0%, #16a085 100%)', 
                  color: '#fff', 
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: '700',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  boxShadow: '0 4px 12px rgba(26, 188, 156, 0.3)',
                  transition: 'all 0.3s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = '0 6px 16px rgba(26, 188, 156, 0.4)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 4px 12px rgba(26, 188, 156, 0.3)';
                }}
              >
                <FaFilter /> Apply
              </button>
            </form>
          )}

          {error && (
            <div style={{ 
              background: 'linear-gradient(135deg, #fee2e2 0%, #fecaca 100%)', 
              color: '#991b1b', 
              padding: '14px 18px', 
              borderRadius: '12px', 
              marginBottom: 20,
              border: '1px solid #fca5a5',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              fontSize: '14px',
              fontWeight: '600'
            }}>
              <FaTimesCircle style={{ fontSize: '18px' }} />
              {error}
            </div>
          )}

          {activeTab === 'payments' && (loading ? (
            <div style={{ 
              background: 'white', 
              padding: '60px 20px', 
              borderRadius: '16px', 
              boxShadow: '0 4px 15px rgba(0,0,0,0.08)',
              textAlign: 'center'
            }}>
              <FaSpinner style={{ fontSize: '32px', color: '#1abc9c', animation: 'spin 1s linear infinite', marginBottom: '16px' }} />
              <p style={{ color: '#718096', fontSize: '16px', margin: 0 }}>Loading payments...</p>
            </div>
          ) : (
            <div style={{ background: 'white', padding: 0, borderRadius: '16px', boxShadow: '0 4px 15px rgba(0,0,0,0.08)', overflow: 'hidden' }}>
              <div style={{ 
                background: 'linear-gradient(135deg, #1abc9c 0%, #16a085 100%)',
                padding: '16px 20px', 
                display: 'grid', 
                gridTemplateColumns: '2fr 1fr 1fr 1fr 2fr', 
                fontWeight: 700, 
                color: '#fff',
                fontSize: '14px'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <FaUser /> Employer
              </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  ₹ Amount
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <FaTag /> Type
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <FaCheckCircle /> Status
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <FaEnvelope /> Contact
                </div>
              </div>
              {payments.map((p, idx) => (
                <div 
                  key={p.id} 
                  style={{ 
                    borderBottom: '1px solid #e8eaf6', 
                    padding: '16px 20px', 
                    display: 'grid', 
                    gridTemplateColumns: '2fr 1fr 1fr 1fr 2fr', 
                    alignItems: 'center',
                    background: idx % 2 === 0 ? '#fff' : '#f8f9fc',
                    transition: 'all 0.3s ease'
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = '#e8f5e9'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = idx % 2 === 0 ? '#fff' : '#f8f9fc'; }}
                >
                  <div>
                    <div style={{ fontWeight: 700, color: '#2d3748', fontSize: '15px', marginBottom: '6px' }}>
                      {p.full_name || '—'}
                  </div>
                    <div style={{ fontSize: '12px', color: '#718096', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <FaHashtag style={{ fontSize: '10px' }} />
                      Txn: {p.transaction_id}
                    </div>
                    <div style={{ fontSize: '12px', color: '#a0aec0', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <FaCalendarAlt style={{ fontSize: '10px' }} />
                      {p.created_at ? new Date(p.created_at).toLocaleString() : '—'}
                    </div>
                  </div>
                  <div style={{ fontSize: '15px', fontWeight: '700', color: '#1cc88a', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <span style={{ fontSize: '14px' }}>₹</span>
                    {Number(p.amount).toFixed(2)}
                  </div>
                  <div>
                    <span style={{
                      padding: '6px 12px',
                      borderRadius: '8px',
                      fontSize: '12px',
                      fontWeight: '700',
                      textTransform: 'capitalize',
                      background: 'linear-gradient(135deg, #e3f2fd 0%, #bbdefb 100%)',
                      color: '#1976d2'
                    }}>
                      {p.payment_type?.replace('_', ' ')}
                    </span>
                  </div>
                  <div>
                    <span style={{
                      padding: '6px 12px',
                      borderRadius: '8px',
                      fontSize: '12px',
                      fontWeight: '700',
                      textTransform: 'capitalize',
                      background: p.status === 'completed' 
                        ? 'linear-gradient(135deg, #d4edda 0%, #c3e6cb 100%)' 
                        : p.status === 'pending'
                        ? 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)'
                        : 'linear-gradient(135deg, #f8d7da 0%, #f5c6cb 100%)',
                      color: p.status === 'completed' ? '#155724' : p.status === 'pending' ? '#92400e' : '#721c24',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px'
                    }}>
                      {p.status === 'completed' ? <FaCheckCircle /> : p.status === 'pending' ? <FaClock /> : <FaTimesCircle />}
                      {p.status}
                    </span>
                </div>
                <div>
                    <div style={{ fontSize: '14px', color: '#2d3748', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <FaEnvelope style={{ color: '#1abc9c', fontSize: '12px' }} />
                      {p.email}
                    </div>
                    <div style={{ fontSize: '13px', color: '#718096', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <FaPhone style={{ color: '#1abc9c', fontSize: '12px', transform: 'scaleX(-1)' }} />
                      {p.phone || <span style={{ color: '#a0aec0' }}>N/A</span>}
                    </div>
                  </div>
                </div>
              ))}
              {payments.length === 0 && (
                <div style={{ padding: '60px 20px', textAlign: 'center', color: '#a0aec0' }}>
                  <FaCreditCard style={{ fontSize: '48px', marginBottom: '16px', opacity: 0.5 }} />
                  <p style={{ fontSize: '16px', fontWeight: '600', margin: 0 }}>No payments found</p>
                </div>
              )}
              <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'space-between', 
                padding: '16px 20px',
                background: '#f8f9fc',
                borderTop: '2px solid #e8eaf6'
              }}>
                <span style={{ color: '#2d3748', fontWeight: '700', fontSize: '14px' }}>
                  Total: <span style={{ color: '#1abc9c' }}>{pagination.total}</span>
                </span>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button 
                    type="button" 
                    disabled={pagination.page <= 1} 
                    onClick={() => fetchPayments(pagination.page - 1)}
                    style={{
                      padding: '10px 16px',
                      borderRadius: '8px',
                      border: '2px solid #e8eaf6',
                      background: pagination.page <= 1 ? '#f5f5f5' : 'white',
                      color: pagination.page <= 1 ? '#a0aec0' : '#2d3748',
                      cursor: pagination.page <= 1 ? 'not-allowed' : 'pointer',
                      fontSize: '14px',
                      fontWeight: '600',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      transition: 'all 0.3s ease'
                    }}
                    onMouseEnter={(e) => {
                      if (pagination.page > 1) {
                        e.currentTarget.style.borderColor = '#1abc9c';
                        e.currentTarget.style.color = '#1abc9c';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (pagination.page > 1) {
                        e.currentTarget.style.borderColor = '#e8eaf6';
                        e.currentTarget.style.color = '#2d3748';
                      }
                    }}
                  >
                    <FaArrowLeft /> Prev
                  </button>
                  <button 
                    type="button" 
                    disabled={pagination.page >= pagination.pages} 
                    onClick={() => fetchPayments(pagination.page + 1)}
                    style={{
                      padding: '10px 16px',
                      borderRadius: '8px',
                      border: '2px solid #e8eaf6',
                      background: pagination.page >= pagination.pages ? '#f5f5f5' : 'white',
                      color: pagination.page >= pagination.pages ? '#a0aec0' : '#2d3748',
                      cursor: pagination.page >= pagination.pages ? 'not-allowed' : 'pointer',
                      fontSize: '14px',
                      fontWeight: '600',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      transition: 'all 0.3s ease'
                    }}
                    onMouseEnter={(e) => {
                      if (pagination.page < pagination.pages) {
                        e.currentTarget.style.borderColor = '#1abc9c';
                        e.currentTarget.style.color = '#1abc9c';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (pagination.page < pagination.pages) {
                        e.currentTarget.style.borderColor = '#e8eaf6';
                        e.currentTarget.style.color = '#2d3748';
                      }
                    }}
                  >
                    Next <FaArrowRight />
                  </button>
                </div>
              </div>
            </div>
          ))}

          {activeTab === 'employers' && (
            <div>
              <div style={{ 
                display: 'grid', 
                gridTemplateColumns: '1fr 140px', 
                gap: 12, 
                marginBottom: 20,
                background: 'white',
                padding: '20px',
                borderRadius: '16px',
                boxShadow: '0 4px 15px rgba(0,0,0,0.08)'
              }}>
                <div style={{ position: 'relative' }}>
                  <FaSearch style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#1abc9c', fontSize: '16px', zIndex: 2, pointerEvents: 'none' }} />
                  <input 
                    placeholder="Find employer by name, email, or phone" 
                    value={employerQuery} 
                    onChange={(e) => setEmployerQuery(e.target.value)} 
                    style={{ 
                      padding: '12px 12px 12px 42px', 
                      borderRadius: '10px', 
                      border: '2px solid #e8eaf6',
                      fontSize: '14px',
                      outline: 'none',
                      transition: 'all 0.3s ease',
                      width: '100%',
                      boxSizing: 'border-box',
                      background: 'linear-gradient(135deg, #ffffff 0%, #f8f9fc 100%)'
                    }}
                    onFocus={(e) => { e.target.style.borderColor = '#1abc9c'; e.target.style.boxShadow = '0 0 0 3px rgba(26, 188, 156, 0.1)'; }}
                    onBlur={(e) => { e.target.style.borderColor = '#e8eaf6'; e.target.style.boxShadow = 'none'; }}
                  />
                </div>
                <button 
                  type="button" 
                  onClick={async () => {
                  setLoading(true); setError('');
                  try {
                    const params = new URLSearchParams({ q: employerQuery, page: '1', limit: '20' });
                    const res = await fetch(`${API_BASE_URL}/api/customer/employers?${params.toString()}`, { headers: { Authorization: `Bearer ${token}` }}); 
                    const data = await res.json();
                    if (!res.ok) { setError(data.message || 'Search failed'); }
                    setEmployers(data.employers || []);
                    setEmployersPage(data.pagination || { page: 1, pages: 1, total: 0, limit: 20 });
                  } catch (e) { setError('Network error: ' + e.message); }
                  finally { setLoading(false); }
                  }} 
                  style={{ 
                    padding: '12px 20px', 
                    borderRadius: '10px', 
                    border: 0, 
                    background: 'linear-gradient(135deg, #1abc9c 0%, #16a085 100%)', 
                    color: '#fff', 
                    cursor: 'pointer',
                    fontSize: '14px',
                    fontWeight: '700',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    boxShadow: '0 4px 12px rgba(26, 188, 156, 0.3)',
                    transition: 'all 0.3s ease'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-2px)';
                    e.currentTarget.style.boxShadow = '0 6px 16px rgba(26, 188, 156, 0.4)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = '0 4px 12px rgba(26, 188, 156, 0.3)';
                  }}
                >
                  <FaSearch /> Search
                </button>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
                <div style={{ background: 'white', borderRadius: '16px', boxShadow: '0 4px 15px rgba(0,0,0,0.08)', overflow: 'hidden' }}>
                  <div style={{ 
                    padding: '16px 20px', 
                    borderBottom: '2px solid #e8eaf6', 
                    fontWeight: 700,
                    background: 'linear-gradient(135deg, #1abc9c 0%, #16a085 100%)',
                    color: '#fff',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    fontSize: '16px'
                  }}>
                    <FaBuilding /> Employers
                  </div>
                  {loading ? (
                    <div style={{ padding: '40px', textAlign: 'center' }}>
                      <FaSpinner style={{ fontSize: '32px', color: '#1abc9c', animation: 'spin 1s linear infinite', marginBottom: '16px' }} />
                      <p style={{ color: '#718096', fontSize: '14px', margin: 0 }}>Loading...</p>
                    </div>
                  ) : employers.length === 0 ? (
                    <div style={{ padding: '40px', textAlign: 'center', color: '#a0aec0' }}>
                      <FaBuilding style={{ fontSize: '48px', marginBottom: '16px', opacity: 0.5 }} />
                      <p style={{ fontSize: '14px', fontWeight: '600', margin: 0 }}>No employers found</p>
                    </div>
                  ) : (
                    employers.map((emp, idx) => (
                      <div 
                        key={emp.id} 
                        style={{ 
                          padding: '16px 20px', 
                          borderBottom: '1px solid #e8eaf6', 
                          cursor: 'pointer',
                          background: idx % 2 === 0 ? '#fff' : '#f8f9fc',
                          transition: 'all 0.3s ease'
                        }} 
                        onClick={async () => {
                      setSelectedEmployer(emp); setSelectedEmployerUsage(null);
                      const res = await fetch(`${API_BASE_URL}/api/customer/employers/${emp.id}/usage`, { headers: { Authorization: `Bearer ${token}` }});
                      const data = await res.json();
                      if (res.ok) setSelectedEmployerUsage(data);
                        }}
                        onMouseEnter={(e) => { e.currentTarget.style.background = '#e8f5e9'; }}
                        onMouseLeave={(e) => { e.currentTarget.style.background = idx % 2 === 0 ? '#fff' : '#f8f9fc'; }}
                      >
                        <div style={{ fontWeight: 700, color: '#2d3748', fontSize: '15px', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <FaUser style={{ color: '#1abc9c', fontSize: '14px' }} />
                          {emp.full_name}
                    </div>
                        <div style={{ fontSize: '13px', color: '#718096', display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                          <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <FaEnvelope style={{ color: '#1abc9c', fontSize: '11px' }} />
                            {emp.email}
                          </span>
                          <span style={{ color: '#cbd5e0' }}>·</span>
                          <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <FaPhone style={{ color: '#1abc9c', fontSize: '11px', transform: 'scaleX(-1)' }} />
                            {emp.phone || 'N/A'}
                          </span>
                </div>
                      </div>
                    ))
                  )}
                </div>
                <div style={{ background: 'white', borderRadius: '16px', boxShadow: '0 4px 15px rgba(0,0,0,0.08)', overflow: 'hidden' }}>
                  <div style={{ 
                    padding: '16px 20px', 
                    borderBottom: '2px solid #e8eaf6', 
                    fontWeight: 700,
                    background: 'linear-gradient(135deg, #1abc9c 0%, #16a085 100%)',
                    color: '#fff',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    fontSize: '16px'
                  }}>
                    <FaUserShield /> Details & Usage
                  </div>
                  {selectedEmployer ? (
                    <div style={{ padding: '20px' }}>
                      <div style={{ marginBottom: '12px', fontSize: '18px', fontWeight: '700', color: '#2d3748', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <FaUser style={{ color: '#1abc9c' }} />
                        {selectedEmployer.full_name}
                      </div>
                      <div style={{ color: '#718096', marginBottom: '20px', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <FaEnvelope style={{ color: '#1abc9c', fontSize: '12px' }} />
                          {selectedEmployer.email}
                        </span>
                        <span style={{ color: '#cbd5e0' }}>·</span>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <FaPhone style={{ color: '#1abc9c', fontSize: '12px', transform: 'scaleX(-1)' }} />
                          {selectedEmployer.phone || 'N/A'}
                        </span>
                      </div>
                      {selectedEmployerUsage ? (
                        <>
                          <div style={{ 
                            marginBottom: '16px', 
                            padding: '12px',
                            background: '#f8f9fc',
                            borderRadius: '10px',
                            border: '1px solid #e8eaf6'
                          }}>
                            <div style={{ fontWeight: '700', color: '#2d3748', marginBottom: '8px', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <FaCheckCircle style={{ color: '#1abc9c', fontSize: '14px' }} />
                              Boolean Search Trial Used:
                            </div>
                            <div style={{ color: '#718096', fontSize: '14px' }}>
                              {selectedEmployerUsage.booleanSearch.has_used_pro_trial ? (
                                <span style={{ color: '#1cc88a', fontWeight: '700' }}>Yes</span>
                              ) : (
                                <span style={{ color: '#e74c3c', fontWeight: '700' }}>No</span>
                              )}
                            </div>
                          </div>
                          <div style={{ marginBottom: '16px' }}>
                            <div style={{ fontWeight: '700', color: '#2d3748', marginBottom: '12px', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <FaEdit style={{ color: '#1abc9c', fontSize: '14px' }} />
                              Resume Scoring (last 30 days)
                            </div>
                            <div style={{ maxHeight: '150px', overflow: 'auto', border: '1px solid #e8eaf6', borderRadius: '10px', padding: '12px', background: '#f8f9fc' }}>
                              {selectedEmployerUsage.resumeScoringDailyLast30.length > 0 ? (
                                <ul style={{ margin: 0, paddingLeft: '20px', fontSize: '13px', color: '#718096' }}>
                            {selectedEmployerUsage.resumeScoringDailyLast30.map(d => (
                                    <li key={d.usage_date} style={{ marginBottom: '6px' }}>
                                      <span style={{ fontWeight: '600', color: '#2d3748' }}>{d.usage_date}:</span> {d.count}
                                    </li>
                            ))}
                          </ul>
                              ) : (
                                <div style={{ color: '#a0aec0', fontSize: '13px', textAlign: 'center' }}>No data available</div>
                              )}
                              </div>
                          </div>
                          <div style={{ marginTop: '20px' }}>
                            <div style={{ fontWeight: '700', color: '#2d3748', marginBottom: '12px', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <FaCreditCard style={{ color: '#1abc9c', fontSize: '14px' }} />
                              Recent Payments
                            </div>
                            <div style={{ maxHeight: '200px', overflow: 'auto', border: '1px solid #e8eaf6', borderRadius: '10px', background: '#f8f9fc' }}>
                              {selectedEmployerUsage.recentPayments.length > 0 ? (
                                selectedEmployerUsage.recentPayments.map(p => (
                                  <div key={p.id} style={{ padding: '12px', borderBottom: '1px solid #e8eaf6', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <span style={{ fontWeight: '700', color: '#1cc88a', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                      <span style={{ fontSize: '14px' }}>₹</span>
                                      {Number(p.amount).toFixed(2)}
                                    </span>
                                    <span style={{ color: '#cbd5e0' }}>·</span>
                                    <span style={{ color: '#718096' }}>{p.payment_type}</span>
                                    <span style={{ color: '#cbd5e0' }}>·</span>
                                    <span style={{ 
                                      padding: '4px 8px',
                                      borderRadius: '6px',
                                      fontSize: '11px',
                                      fontWeight: '700',
                                      background: p.status === 'completed' ? '#d4edda' : '#fef3c7',
                                      color: p.status === 'completed' ? '#155724' : '#92400e'
                                    }}>
                                      {p.status}
                                    </span>
                                    <span style={{ marginLeft: 'auto', color: '#a0aec0', fontSize: '11px' }}>
                                      {new Date(p.created_at).toLocaleDateString()}
                                    </span>
                                  </div>
                                ))
                              ) : (
                                <div style={{ padding: '20px', color: '#a0aec0', fontSize: '13px', textAlign: 'center' }}>No recent payments</div>
                              )}
                            </div>
                          </div>
                        </>
                      ) : (
                        <div style={{ padding: '40px', textAlign: 'center' }}>
                          <FaSpinner style={{ fontSize: '24px', color: '#1abc9c', animation: 'spin 1s linear infinite' }} />
                          <p style={{ color: '#718096', fontSize: '14px', marginTop: '12px', margin: 0 }}>Loading usage...</p>
                    </div>
                      )}
                </div>
                  ) : (
                    <div style={{ padding: '60px 20px', textAlign: 'center', color: '#a0aec0' }}>
                      <FaUserShield style={{ fontSize: '48px', marginBottom: '16px', opacity: 0.5 }} />
                      <p style={{ fontSize: '14px', fontWeight: '600', margin: 0 }}>Select an employer to view details</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'tickets' && (
            <div style={{ display: 'grid', gridTemplateColumns: '1.8fr 0.9fr', gap: 20 }}>
              <div style={{ background: 'white', borderRadius: '16px', boxShadow: '0 4px 15px rgba(0,0,0,0.08)', overflow: 'hidden' }}>
                <div style={{ 
                  padding: '16px 20px', 
                  borderBottom: '2px solid #e8eaf6', 
                  fontWeight: 700,
                  background: 'linear-gradient(135deg, #1abc9c 0%, #16a085 100%)',
                  color: '#fff',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  fontSize: '16px'
                }}>
                  <FaTicketAlt /> Tickets
                </div>
                <div style={{ padding: '20px', background: 'white', borderBottom: '2px solid #e8eaf6' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 140px 140px 200px', gap: 12 }}>
                    <div style={{ position: 'relative' }}>
                      <FaSearch style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#1abc9c', fontSize: '16px', zIndex: 2, pointerEvents: 'none' }} />
                      <input 
                        placeholder="Search subject/description" 
                        value={ticketFilters.q} 
                        onChange={(e) => setTicketFilters({ ...ticketFilters, q: e.target.value })} 
                        style={{ 
                          padding: '12px 12px 12px 42px', 
                          borderRadius: '10px', 
                          border: '2px solid #e8eaf6',
                          fontSize: '12px',
                          outline: 'none',
                          transition: 'all 0.3s ease',
                          width: '100%',
                          boxSizing: 'border-box',
                          background: 'linear-gradient(135deg, #ffffff 0%, #f8f9fc 100%)'
                        }}
                        onFocus={(e) => { e.target.style.borderColor = '#1abc9c'; e.target.style.boxShadow = '0 0 0 3px rgba(26, 188, 156, 0.1)'; }}
                        onBlur={(e) => { e.target.style.borderColor = '#e8eaf6'; e.target.style.boxShadow = 'none'; }}
                      />
                    </div>
                    <div style={{ position: 'relative' }}>
                      <FaFilter style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#1abc9c', fontSize: '16px', zIndex: 2, pointerEvents: 'none' }} />
                      <select 
                        value={ticketFilters.status} 
                        onChange={(e) => setTicketFilters({ ...ticketFilters, status: e.target.value })} 
                        style={{ 
                          padding: '12px 12px 12px 42px', 
                          borderRadius: '10px', 
                          border: '2px solid #e8eaf6',
                          fontSize: '13px',
                          outline: 'none',
                          cursor: 'pointer',
                          background: 'linear-gradient(135deg, #ffffff 0%, #f8f9fc 100%)',
                          appearance: 'none',
                          width: '100%',
                          boxSizing: 'border-box'
                        }}
                        onFocus={(e) => { e.target.style.borderColor = '#1abc9c'; e.target.style.boxShadow = '0 0 0 3px rgba(26, 188, 156, 0.1)'; }}
                        onBlur={(e) => { e.target.style.borderColor = '#e8eaf6'; e.target.style.boxShadow = 'none'; }}
                      >
                    <option value="">All Status</option>
                    <option value="open">Open</option>
                    <option value="pending">Pending</option>
                    <option value="resolved">Resolved</option>
                    <option value="closed">Closed</option>
                  </select>
                    </div>
                    <div style={{ position: 'relative' }}>
                      <FaTag style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#1abc9c', fontSize: '16px', zIndex: 2, pointerEvents: 'none' }} />
                      <select 
                        value={ticketFilters.category} 
                        onChange={(e) => setTicketFilters({ ...ticketFilters, category: e.target.value })} 
                        style={{ 
                          padding: '12px 12px 12px 42px', 
                          borderRadius: '10px', 
                          border: '2px solid #e8eaf6',
                          fontSize: '13px',
                          outline: 'none',
                          cursor: 'pointer',
                          background: 'linear-gradient(135deg, #ffffff 0%, #f8f9fc 100%)',
                          appearance: 'none',
                          width: '100%',
                          boxSizing: 'border-box'
                        }}
                        onFocus={(e) => { e.target.style.borderColor = '#1abc9c'; e.target.style.boxShadow = '0 0 0 3px rgba(26, 188, 156, 0.1)'; }}
                        onBlur={(e) => { e.target.style.borderColor = '#e8eaf6'; e.target.style.boxShadow = 'none'; }}
                      >
                    <option value="">All Categories</option>
                    <option value="billing">Billing</option>
                    <option value="login">Login</option>
                    <option value="job_posting">Job Posting</option>
                    <option value="general">General</option>
                  </select>
                    </div>
                  <div style={{ display: 'flex', gap: 8 }}>
                      <div style={{ position: 'relative', flex: 1 }}>
                        <FaUser style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#1abc9c', fontSize: '16px', zIndex: 2, pointerEvents: 'none' }} />
                        <input 
                          placeholder="Employer ID" 
                          value={ticketFilters.employerId} 
                          onChange={(e) => setTicketFilters({ ...ticketFilters, employerId: e.target.value })} 
                          style={{ 
                            width: '100%',
                            padding: '12px 12px 12px 42px',
                            borderRadius: '10px',
                            border: '2px solid #e8eaf6',
                            fontSize: '13px',
                            outline: 'none',
                            background: 'linear-gradient(135deg, #ffffff 0%, #f8f9fc 100%)',
                            transition: 'all 0.3s ease',
                            boxSizing: 'border-box'
                          }}
                          onFocus={(e) => { e.target.style.borderColor = '#1abc9c'; e.target.style.boxShadow = '0 0 0 3px rgba(26, 188, 156, 0.1)'; }}
                          onBlur={(e) => { e.target.style.borderColor = '#e8eaf6'; e.target.style.boxShadow = 'none'; }}
                        />
                      </div>
                      <button 
                        type="button" 
                        onClick={async () => {
                      setLoading(true); setError('');
                      try {
                        const params = new URLSearchParams({
                          page: '1', limit: '20',
                          ...(ticketFilters.q ? { q: ticketFilters.q } : {}),
                          ...(ticketFilters.status ? { status: ticketFilters.status } : {}),
                          ...(ticketFilters.category ? { category: ticketFilters.category } : {}),
                          ...(ticketFilters.employerId ? { employerId: ticketFilters.employerId } : {})
                        });
                        const res = await fetch(`${API_BASE_URL}/api/customer/tickets?${params.toString()}`, { headers: { Authorization: `Bearer ${token}` }});
                        const data = await res.json();
                        if (!res.ok) { setError(data.message || 'Failed to load tickets'); }
                        setTickets(data.tickets || []);
                        setTicketsPage(data.pagination || { page: 1, pages: 1, total: 0, limit: 20 });
                      } catch (e) { setError('Network error: ' + e.message); }
                      finally { setLoading(false); }
                        }}
                        style={{ 
                          padding: '12px 16px', 
                          borderRadius: '10px', 
                          border: 0, 
                          background: 'linear-gradient(135deg, #1abc9c 0%, #16a085 100%)', 
                          color: '#fff', 
                          cursor: 'pointer',
                          fontSize: '13px',
                          fontWeight: '700',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                          boxShadow: '0 4px 12px rgba(26, 188, 156, 0.3)',
                          transition: 'all 0.3s ease',
                          whiteSpace: 'nowrap'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.transform = 'translateY(-2px)';
                          e.currentTarget.style.boxShadow = '0 6px 16px rgba(26, 188, 156, 0.4)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.transform = 'translateY(0)';
                          e.currentTarget.style.boxShadow = '0 4px 12px rgba(26, 188, 156, 0.3)';
                        }}
                      >
                        <FaFilter /> Apply
                      </button>
                  </div>
                </div>
                      </div>
                <div style={{ maxHeight: '600px', overflow: 'auto' }}>
                  {tickets.length === 0 ? (
                    <div style={{ padding: '60px 20px', textAlign: 'center', color: '#a0aec0' }}>
                      <FaTicketAlt style={{ fontSize: '48px', marginBottom: '16px', opacity: 0.5 }} />
                      <p style={{ fontSize: '14px', fontWeight: '600', margin: 0 }}>No tickets found</p>
                    </div>
                  ) : (
                    tickets.map((t, idx) => (
                      <div 
                        key={t.id} 
                        style={{ 
                          padding: '16px', 
                          borderTop: '1px solid #e8eaf6',
                          background: idx % 2 === 0 ? '#fff' : '#f8f9fc',
                          transition: 'all 0.3s ease'
                        }}
                        onMouseEnter={(e) => { e.currentTarget.style.background = '#e8f5e9'; }}
                        onMouseLeave={(e) => { e.currentTarget.style.background = idx % 2 === 0 ? '#fff' : '#f8f9fc'; }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                          <div style={{ fontWeight: 700, color: '#2d3748', fontSize: '15px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <FaHashtag style={{ color: '#1abc9c', fontSize: '14px' }} />
                            #{t.id} · {t.subject}
                            <span style={{ color: '#718096', fontWeight: 500, fontSize: '13px' }}>· {t.category}</span>
                          </div>
                          <span style={{
                            padding: '6px 12px',
                            borderRadius: '8px',
                            fontSize: '12px',
                            fontWeight: '700',
                            textTransform: 'capitalize',
                            background: t.status === 'resolved' || t.status === 'closed'
                              ? 'linear-gradient(135deg, #d4edda 0%, #c3e6cb 100%)'
                              : t.status === 'pending'
                              ? 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)'
                              : 'linear-gradient(135deg, #cfe2ff 0%, #b6d4fe 100%)',
                            color: t.status === 'resolved' || t.status === 'closed' ? '#155724' : t.status === 'pending' ? '#92400e' : '#084298'
                          }}>
                            {t.status}
                          </span>
                        </div>
                        <div style={{ fontSize: '13px', color: '#718096', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <FaUser style={{ color: '#1abc9c', fontSize: '11px' }} />
                          Employer #{t.employer_id} — {t.full_name || ''} {t.email ? `(${t.email})` : ''}
                        </div>
                        {t.resolution_notes && (
                          <div style={{ 
                            marginBottom: '12px', 
                            padding: '10px',
                            background: '#fff3cd',
                            borderRadius: '8px',
                            fontSize: '12px', 
                            color: '#856404',
                            border: '1px solid #ffeaa7'
                          }}>
                            <strong>Notes:</strong> {t.resolution_notes}
                          </div>
                        )}
                        <div style={{ marginTop: '12px', display: 'flex', gap: '8px' }}>
                          <button 
                            type="button" 
                            onClick={async () => {
                          const newStatus = prompt('Update status to (open|pending|resolved|closed):', t.status) || t.status;
                          const res = await fetch(`${API_BASE_URL}/api/customer/tickets/${t.id}`, {
                            method: 'PATCH',
                            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                            body: JSON.stringify({ status: newStatus })
                          });
                          if (res.ok) {
                            const data = await res.json();
                            setTickets(prev => prev.map(x => x.id === t.id ? data.ticket : x));
                          }
                            }}
                            style={{
                              padding: '8px 14px',
                              borderRadius: '8px',
                              border: '2px solid #1abc9c',
                              background: 'white',
                              color: '#1abc9c',
                              cursor: 'pointer',
                              fontSize: '12px',
                              fontWeight: '700',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '6px',
                              transition: 'all 0.3s ease'
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.background = '#1abc9c';
                              e.currentTarget.style.color = '#fff';
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.background = 'white';
                              e.currentTarget.style.color = '#1abc9c';
                            }}
                          >
                            <FaEdit /> Update Status
                          </button>
                          <button 
                            type="button" 
                            onClick={async () => {
                          const notes = prompt('Enter resolution notes:', t.resolution_notes || '') || '';
                          const res = await fetch(`${API_BASE_URL}/api/customer/tickets/${t.id}`, {
                            method: 'PATCH',
                            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                            body: JSON.stringify({ resolutionNotes: notes })
                          });
                          if (res.ok) {
                            const data = await res.json();
                            setTickets(prev => prev.map(x => x.id === t.id ? data.ticket : x));
                          }
                            }}
                            style={{
                              padding: '8px 14px',
                              borderRadius: '8px',
                              border: '2px solid #16a085',
                              background: 'white',
                              color: '#16a085',
                              cursor: 'pointer',
                              fontSize: '12px',
                              fontWeight: '700',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '6px',
                              transition: 'all 0.3s ease'
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.background = '#16a085';
                              e.currentTarget.style.color = '#fff';
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.background = 'white';
                              e.currentTarget.style.color = '#16a085';
                            }}
                          >
                            <FaEdit /> Add Notes
                          </button>
                      </div>
                    </div>
                    ))
                  )}
                </div>
              </div>
              <div style={{ background: 'white', borderRadius: '16px', boxShadow: '0 4px 15px rgba(0,0,0,0.08)', overflow: 'hidden' }}>
                <div style={{ 
                  padding: '16px 20px', 
                  borderBottom: '2px solid #e8eaf6', 
                  fontWeight: 700,
                  background: 'linear-gradient(135deg, #1abc9c 0%, #16a085 100%)',
                  color: '#fff',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  fontSize: '16px'
                }}>
                  <FaPlus /> Create Ticket
                </div>
                <div style={{ padding: '20px', display: 'grid', gap: '14px' }}>
                  <div style={{ position: 'relative' }}>
                    <FaUser style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#1abc9c', fontSize: '14px', zIndex: 2, pointerEvents: 'none' }} />
                    <input 
                      placeholder="Employer ID" 
                      value={newTicket.employerId} 
                      onChange={(e) => setNewTicket({ ...newTicket, employerId: e.target.value })} 
                      style={{ 
                        padding: '12px 12px 12px 38px', 
                        borderRadius: '10px', 
                        border: '2px solid #e8eaf6',
                        fontSize: '13px',
                        outline: 'none',
                        transition: 'all 0.3s ease',
                        width: '100%',
                        boxSizing: 'border-box',
                        background: 'linear-gradient(135deg, #ffffff 0%, #f8f9fc 100%)'
                      }}
                      onFocus={(e) => { e.target.style.borderColor = '#1abc9c'; e.target.style.boxShadow = '0 0 0 3px rgba(26, 188, 156, 0.1)'; }}
                      onBlur={(e) => { e.target.style.borderColor = '#e8eaf6'; e.target.style.boxShadow = 'none'; }}
                    />
                  </div>
                  <div style={{ position: 'relative' }}>
                    <FaEdit style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#1abc9c', fontSize: '14px', zIndex: 2, pointerEvents: 'none' }} />
                    <input 
                      placeholder="Subject" 
                      value={newTicket.subject} 
                      onChange={(e) => setNewTicket({ ...newTicket, subject: e.target.value })} 
                      style={{ 
                        padding: '12px 12px 12px 38px', 
                        borderRadius: '10px', 
                        border: '2px solid #e8eaf6',
                        fontSize: '13px',
                        outline: 'none',
                        transition: 'all 0.3s ease',
                        width: '100%',
                        boxSizing: 'border-box',
                        background: 'linear-gradient(135deg, #ffffff 0%, #f8f9fc 100%)'
                      }}
                      onFocus={(e) => { e.target.style.borderColor = '#1abc9c'; e.target.style.boxShadow = '0 0 0 3px rgba(26, 188, 156, 0.1)'; }}
                      onBlur={(e) => { e.target.style.borderColor = '#e8eaf6'; e.target.style.boxShadow = 'none'; }}
                    />
                  </div>
                  <div style={{ position: 'relative' }}>
                    <FaTag style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#1abc9c', fontSize: '16px', zIndex: 2, pointerEvents: 'none' }} />
                    <select 
                      value={newTicket.category} 
                      onChange={(e) => setNewTicket({ ...newTicket, category: e.target.value })} 
                      style={{ 
                        padding: '12px 12px 12px 42px', 
                        borderRadius: '10px', 
                        border: '2px solid #e8eaf6',
                        fontSize: '13px',
                        outline: 'none',
                        cursor: 'pointer',
                        background: 'linear-gradient(135deg, #ffffff 0%, #f8f9fc 100%)',
                        appearance: 'none',
                        width: '100%',
                        boxSizing: 'border-box',
                        transition: 'all 0.3s ease'
                      }}
                      onFocus={(e) => { e.target.style.borderColor = '#1abc9c'; e.target.style.boxShadow = '0 0 0 3px rgba(26, 188, 156, 0.1)'; }}
                      onBlur={(e) => { e.target.style.borderColor = '#e8eaf6'; e.target.style.boxShadow = 'none'; }}
                    >
                    <option value="general">General</option>
                    <option value="billing">Billing</option>
                    <option value="login">Login</option>
                    <option value="job_posting">Job Posting</option>
                  </select>
                  </div>
                  <div style={{ position: 'relative' }}>
                    <FaClock style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#1abc9c', fontSize: '16px', zIndex: 2, pointerEvents: 'none' }} />
                    <select 
                      value={newTicket.priority} 
                      onChange={(e) => setNewTicket({ ...newTicket, priority: e.target.value })} 
                      style={{ 
                        padding: '12px 12px 12px 42px', 
                        borderRadius: '10px', 
                        border: '2px solid #e8eaf6',
                        fontSize: '13px',
                        outline: 'none',
                        cursor: 'pointer',
                        background: 'linear-gradient(135deg, #ffffff 0%, #f8f9fc 100%)',
                        appearance: 'none',
                        width: '100%',
                        boxSizing: 'border-box',
                        transition: 'all 0.3s ease'
                      }}
                      onFocus={(e) => { e.target.style.borderColor = '#1abc9c'; e.target.style.boxShadow = '0 0 0 3px rgba(26, 188, 156, 0.1)'; }}
                      onBlur={(e) => { e.target.style.borderColor = '#e8eaf6'; e.target.style.boxShadow = 'none'; }}
                    >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="urgent">Urgent</option>
                  </select>
                  </div>
                  <textarea 
                    rows="6" 
                    placeholder="Describe the issue" 
                    value={newTicket.description} 
                    onChange={(e) => setNewTicket({ ...newTicket, description: e.target.value })} 
                    style={{ 
                      padding: '12px', 
                      borderRadius: '10px', 
                      border: '2px solid #e8eaf6',
                      fontSize: '13px',
                      outline: 'none',
                      transition: 'all 0.3s ease',
                      width: '100%',
                      boxSizing: 'border-box',
                      background: 'linear-gradient(135deg, #ffffff 0%, #f8f9fc 100%)',
                      resize: 'vertical',
                      fontFamily: 'inherit'
                    }}
                    onFocus={(e) => { e.target.style.borderColor = '#1abc9c'; e.target.style.boxShadow = '0 0 0 3px rgba(26, 188, 156, 0.1)'; }}
                    onBlur={(e) => { e.target.style.borderColor = '#e8eaf6'; e.target.style.boxShadow = 'none'; }}
                  />
                  <button 
                    type="button" 
                    onClick={async () => {
                    if (!newTicket.employerId || !newTicket.subject) return alert('Employer ID and Subject required');
                    const res = await fetch(`${API_BASE_URL}/api/customer/tickets`, {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                      body: JSON.stringify({
                        employerId: parseInt(newTicket.employerId, 10),
                        subject: newTicket.subject,
                        category: newTicket.category,
                        priority: newTicket.priority,
                        description: newTicket.description
                      })
                    });
                    const data = await res.json();
                    if (res.ok) {
                      alert('Ticket created');
                      setNewTicket({ employerId: '', subject: '', category: 'general', priority: 'medium', description: '' });
                      setTickets(prev => [data.ticket, ...prev]);
                    } else {
                      alert(data.message || 'Failed to create ticket');
                    }
                    }} 
                    style={{ 
                      padding: '14px 20px', 
                      borderRadius: '10px', 
                      background: 'linear-gradient(135deg, #1abc9c 0%, #16a085 100%)', 
                      color: '#fff', 
                      border: 0, 
                      cursor: 'pointer',
                      fontSize: '15px',
                      fontWeight: '700',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px',
                      boxShadow: '0 4px 12px rgba(26, 188, 156, 0.3)',
                      transition: 'all 0.3s ease'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = 'translateY(-2px)';
                      e.currentTarget.style.boxShadow = '0 6px 16px rgba(26, 188, 156, 0.4)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'translateY(0)';
                      e.currentTarget.style.boxShadow = '0 4px 12px rgba(26, 188, 156, 0.3)';
                    }}
                  >
                    <FaPlus /> Create Ticket
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'access' && (
            <div style={{ background: 'white', borderRadius: '16px', boxShadow: '0 4px 15px rgba(0,0,0,0.08)', overflow: 'hidden' }}>
              <div style={{ 
                padding: '16px 20px', 
                borderBottom: '2px solid #e8eaf6', 
                fontWeight: 700,
                background: 'linear-gradient(135deg, #1abc9c 0%, #16a085 100%)',
                color: '#fff',
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                fontSize: '16px'
              }}>
                <FaUserShield /> User Access Management
              </div>
              <div style={{ padding: '24px', display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '20px' }}>
                <div style={{ 
                  padding: '20px', 
                  background: 'linear-gradient(135deg, #f8f9fc 0%, #ffffff 100%)',
                  borderRadius: '12px',
                  border: '2px solid #e8eaf6'
                }}>
                  <div style={{ fontWeight: 700, marginBottom: '16px', color: '#2d3748', fontSize: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <FaLock style={{ color: '#1abc9c', fontSize: '18px' }} /> Reset Password
                  </div>
                  <div style={{ position: 'relative', marginBottom: '12px' }}>
                    <FaUser style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#1abc9c', fontSize: '14px', zIndex: 2, pointerEvents: 'none' }} />
                    <input 
                      placeholder="Employer ID" 
                      value={accessForm.employerId} 
                      onChange={(e) => setAccessForm({ ...accessForm, employerId: e.target.value })} 
                      style={{ 
                        padding: '12px 12px 12px 38px', 
                        borderRadius: '10px', 
                        border: '2px solid #e8eaf6',
                        fontSize: '14px',
                        outline: 'none',
                        transition: 'all 0.3s ease',
                        width: '100%',
                        boxSizing: 'border-box',
                        background: 'white'
                      }}
                      onFocus={(e) => { e.target.style.borderColor = '#1abc9c'; e.target.style.boxShadow = '0 0 0 3px rgba(26, 188, 156, 0.1)'; }}
                      onBlur={(e) => { e.target.style.borderColor = '#e8eaf6'; e.target.style.boxShadow = 'none'; }}
                    />
                  </div>
                  <div style={{ position: 'relative', marginBottom: '16px' }}>
                    <FaLock style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#1abc9c', fontSize: '14px', zIndex: 2, pointerEvents: 'none' }} />
                    <input 
                      placeholder="New Password (optional)" 
                      value={accessForm.newPassword} 
                      onChange={(e) => setAccessForm({ ...accessForm, newPassword: e.target.value })} 
                      type="password"
                      style={{ 
                        padding: '12px 12px 12px 38px', 
                        borderRadius: '10px', 
                        border: '2px solid #e8eaf6',
                        fontSize: '14px',
                        outline: 'none',
                        transition: 'all 0.3s ease',
                        width: '100%',
                        boxSizing: 'border-box',
                        background: 'white'
                      }}
                      onFocus={(e) => { e.target.style.borderColor = '#1abc9c'; e.target.style.boxShadow = '0 0 0 3px rgba(26, 188, 156, 0.1)'; }}
                      onBlur={(e) => { e.target.style.borderColor = '#e8eaf6'; e.target.style.boxShadow = 'none'; }}
                    />
                  </div>
                  <button 
                    type="button" 
                    onClick={async () => {
                    if (!accessForm.employerId) return alert('Employer ID required');
                    const res = await fetch(`${API_BASE_URL}/api/customer/users/${accessForm.employerId}/reset-password`, {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                      body: JSON.stringify({ newPassword: accessForm.newPassword || undefined })
                    });
                    const data = await res.json();
                    if (res.ok) {
                      alert('Password reset. Temp password: ' + data.temporaryPassword);
                    } else {
                      alert(data.message || 'Failed');
                    }
                    }} 
                    style={{ 
                      width: '100%',
                      padding: '12px 20px',
                      borderRadius: '10px',
                      border: 0,
                      background: 'linear-gradient(135deg, #1abc9c 0%, #16a085 100%)',
                      color: '#fff',
                      cursor: 'pointer',
                      fontSize: '14px',
                      fontWeight: '700',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px',
                      boxShadow: '0 4px 12px rgba(26, 188, 156, 0.3)',
                      transition: 'all 0.3s ease'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = 'translateY(-2px)';
                      e.currentTarget.style.boxShadow = '0 6px 16px rgba(26, 188, 156, 0.4)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'translateY(0)';
                      e.currentTarget.style.boxShadow = '0 4px 12px rgba(26, 188, 156, 0.3)';
                    }}
                  >
                    <FaLock /> Reset
                  </button>
                </div>
                <div style={{ 
                  padding: '20px', 
                  background: 'linear-gradient(135deg, #f8f9fc 0%, #ffffff 100%)',
                  borderRadius: '12px',
                  border: '2px solid #e8eaf6'
                }}>
                  <div style={{ fontWeight: 700, marginBottom: '16px', color: '#2d3748', fontSize: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    {accessForm.active ? (
                      <FaToggleOn style={{ color: '#1abc9c', fontSize: '20px' }} />
                    ) : (
                      <FaToggleOff style={{ color: '#e74c3c', fontSize: '20px' }} />
                    )}
                    Activate / Deactivate
                  </div>
                  <div style={{ position: 'relative', marginBottom: '12px' }}>
                    <FaUser style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#1abc9c', fontSize: '14px', zIndex: 2, pointerEvents: 'none' }} />
                    <input 
                      placeholder="Employer ID" 
                      value={accessForm.employerId} 
                      onChange={(e) => setAccessForm({ ...accessForm, employerId: e.target.value })} 
                      style={{ 
                        padding: '12px 12px 12px 38px', 
                        borderRadius: '10px', 
                        border: '2px solid #e8eaf6',
                        fontSize: '14px',
                        outline: 'none',
                        transition: 'all 0.3s ease',
                        width: '100%',
                        boxSizing: 'border-box',
                        background: 'white'
                      }}
                      onFocus={(e) => { e.target.style.borderColor = '#1abc9c'; e.target.style.boxShadow = '0 0 0 3px rgba(26, 188, 156, 0.1)'; }}
                      onBlur={(e) => { e.target.style.borderColor = '#e8eaf6'; e.target.style.boxShadow = 'none'; }}
                    />
                  </div>
                  <div style={{ position: 'relative', marginBottom: '16px' }}>
                    <FaToggleOn style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#1abc9c', fontSize: '16px', zIndex: 2, pointerEvents: 'none' }} />
                    <select 
                      value={accessForm.active ? '1' : '0'} 
                      onChange={(e) => setAccessForm({ ...accessForm, active: e.target.value === '1' })} 
                      style={{ 
                        padding: '12px 12px 12px 42px', 
                        borderRadius: '10px', 
                        border: '2px solid #e8eaf6',
                        fontSize: '14px',
                        outline: 'none',
                        cursor: 'pointer',
                        background: 'white',
                        appearance: 'none',
                        width: '100%',
                        boxSizing: 'border-box',
                        transition: 'all 0.3s ease'
                      }}
                      onFocus={(e) => { e.target.style.borderColor = '#1abc9c'; e.target.style.boxShadow = '0 0 0 3px rgba(26, 188, 156, 0.1)'; }}
                      onBlur={(e) => { e.target.style.borderColor = '#e8eaf6'; e.target.style.boxShadow = 'none'; }}
                    >
                    <option value="1">Activate</option>
                    <option value="0">Deactivate</option>
                  </select>
                  </div>
                  <button 
                    type="button" 
                    onClick={async () => {
                    if (!accessForm.employerId) return alert('Employer ID required');
                    const res = await fetch(`${API_BASE_URL}/api/customer/users/${accessForm.employerId}/status`, {
                      method: 'PATCH',
                      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                      body: JSON.stringify({ active: accessForm.active })
                    });
                    const data = await res.json();
                    if (res.ok) {
                      alert(data.message || 'Updated');
                    } else {
                      alert(data.message || 'Failed');
                    }
                    }} 
                    style={{ 
                      width: '100%',
                      padding: '12px 20px',
                      borderRadius: '10px',
                      border: 0,
                      background: 'linear-gradient(135deg, #1abc9c 0%, #16a085 100%)',
                      color: '#fff',
                      cursor: 'pointer',
                      fontSize: '14px',
                      fontWeight: '700',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px',
                      boxShadow: '0 4px 12px rgba(26, 188, 156, 0.3)',
                      transition: 'all 0.3s ease'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = 'translateY(-2px)';
                      e.currentTarget.style.boxShadow = '0 6px 16px rgba(26, 188, 156, 0.4)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'translateY(0)';
                      e.currentTarget.style.boxShadow = '0 4px 12px rgba(26, 188, 156, 0.3)';
                    }}
                  >
                    <FaEdit /> Update
                  </button>
                </div>
                <div style={{ 
                  padding: '20px', 
                  background: 'linear-gradient(135deg, #f8f9fc 0%, #ffffff 100%)',
                  borderRadius: '12px',
                  border: '2px solid #e8eaf6'
                }}>
                  <div style={{ fontWeight: 700, marginBottom: '16px', color: '#2d3748', fontSize: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <FaCalendarCheck style={{ color: '#1abc9c', fontSize: '18px' }} /> Extend Service Validity
                  </div>
                  <div style={{ position: 'relative', marginBottom: '12px' }}>
                    <FaUser style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#1abc9c', fontSize: '14px', zIndex: 2, pointerEvents: 'none' }} />
                    <input 
                      placeholder="Employer ID" 
                      value={accessForm.employerId} 
                      onChange={(e) => setAccessForm({ ...accessForm, employerId: e.target.value })} 
                      style={{ 
                        padding: '12px 12px 12px 38px', 
                        borderRadius: '10px', 
                        border: '2px solid #e8eaf6',
                        fontSize: '14px',
                        outline: 'none',
                        transition: 'all 0.3s ease',
                        width: '100%',
                        boxSizing: 'border-box',
                        background: 'white'
                      }}
                      onFocus={(e) => { e.target.style.borderColor = '#1abc9c'; e.target.style.boxShadow = '0 0 0 3px rgba(26, 188, 156, 0.1)'; }}
                      onBlur={(e) => { e.target.style.borderColor = '#e8eaf6'; e.target.style.boxShadow = 'none'; }}
                    />
                  </div>
                  <div style={{ position: 'relative', marginBottom: '16px' }}>
                    <FaCalendarAlt style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#1abc9c', fontSize: '14px', zIndex: 2, pointerEvents: 'none' }} />
                    <input 
                      type="number" 
                      placeholder="Days (e.g., 30)" 
                      value={accessForm.extendDays} 
                      onChange={(e) => setAccessForm({ ...accessForm, extendDays: parseInt(e.target.value || '0', 10) })} 
                      style={{ 
                        padding: '12px 12px 12px 38px', 
                        borderRadius: '10px', 
                        border: '2px solid #e8eaf6',
                        fontSize: '14px',
                        outline: 'none',
                        transition: 'all 0.3s ease',
                        width: '100%',
                        boxSizing: 'border-box',
                        background: 'white'
                      }}
                      onFocus={(e) => { e.target.style.borderColor = '#1abc9c'; e.target.style.boxShadow = '0 0 0 3px rgba(26, 188, 156, 0.1)'; }}
                      onBlur={(e) => { e.target.style.borderColor = '#e8eaf6'; e.target.style.boxShadow = 'none'; }}
                    />
                  </div>
                  <button 
                    type="button" 
                    onClick={async () => {
                    if (!accessForm.employerId || !accessForm.extendDays) return alert('Employer ID and Days required');
                    const res = await fetch(`${API_BASE_URL}/api/customer/users/${accessForm.employerId}/extend-membership`, {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                      body: JSON.stringify({ days: accessForm.extendDays })
                    });
                    const data = await res.json();
                    if (res.ok) {
                      alert('Extended until ' + new Date(data.membership.end_date).toLocaleString());
                    } else {
                      alert(data.message || 'Failed');
                    }
                    }} 
                    style={{ 
                      width: '100%',
                      padding: '12px 20px',
                      borderRadius: '10px',
                      border: 0,
                      background: 'linear-gradient(135deg, #1abc9c 0%, #16a085 100%)',
                      color: '#fff',
                      cursor: 'pointer',
                      fontSize: '14px',
                      fontWeight: '700',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px',
                      boxShadow: '0 4px 12px rgba(26, 188, 156, 0.3)',
                      transition: 'all 0.3s ease'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = 'translateY(-2px)';
                      e.currentTarget.style.boxShadow = '0 6px 16px rgba(26, 188, 156, 0.4)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'translateY(0)';
                      e.currentTarget.style.boxShadow = '0 4px 12px rgba(26, 188, 156, 0.3)';
                    }}
                  >
                    <FaCalendarCheck /> Extend
                  </button>
                </div>
              </div>
            </div>
          )}
        </section> {/* ✅ Added closing tag */}
      </main>
    </div>
  );
};

export default CSRDashboard;
