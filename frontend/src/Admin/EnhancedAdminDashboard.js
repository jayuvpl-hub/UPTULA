import React, { useState, useEffect, useLayoutEffect, useRef } from 'react';
import { PremiumMembersView, PaymentsView } from './components/PremiumComponents';
import { API_BASE_URL } from '../config/api';
import { fetchAdminRegistrationTree } from '../utils/registrationCategories';
import CategoryManagement from './CategoryManagement';
import UserManagement from './UserManagement';
import Pagination from '../Components/Pagination';
import {
  FaLink, FaEdit, FaFileAlt, FaEye, FaEyeSlash,
  FaImage, FaFile, FaTag, FaUser, FaBriefcase,
  FaStar, FaCheck, FaLock, FaPlus, FaHashtag,
  FaSortNumericUp, FaToggleOn, FaToggleOff, FaCalendarAlt,
  FaClock, FaHeading, FaIdCard, FaGlobe, FaBuilding,
  FaEnvelope, FaPhone, FaServer, FaShieldAlt, FaCreditCard,
  FaKey, FaTwitter, FaFacebook, FaBell, FaUpload,
  FaSearch, FaFilter, FaUserTie, FaHeadset, FaCheckCircle,
  FaTimesCircle, FaSpinner, FaTimes, FaBullhorn, FaMapMarkerAlt,
  FaDollarSign, FaUsers, FaGraduationCap, FaCode, FaIndustry,
  FaTrash, FaSave, FaBan, FaSitemap, FaMapPin, FaAddressCard,
  FaChartLine, FaUserFriends, FaCog, FaTags, FaNewspaper,
  FaChevronLeft, FaChevronRight
} from 'react-icons/fa';

const EnhancedAdminDashboard = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [stats, setStats] = useState({
    candidates: 0,
    employers: 0,
    jobs: 0,
    applications: 0
  });
  const [candidates, setCandidates] = useState([]);
  const [employers, setEmployers] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [premiumMembers, setPremiumMembers] = useState([]);
  const [payments, setPayments] = useState([]);
  const [paymentStats, setPaymentStats] = useState({});
  const [downloadStats, setDownloadStats] = useState({});
  const [analyticsPaymentsData, setAnalyticsPaymentsData] = useState({
    stats: null,
    payments: [],
    topEmployers: [],
    pagination: null
  });
  const [csTickets, setCsTickets] = useState([]);
  const [registrationStats, setRegistrationStats] = useState({ candidates: [], employers: [] });
  const [loading, setLoading] = useState(true);
  const [dataLoading, setDataLoading] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [showSponsorshipForm, setShowSponsorshipForm] = useState(false);

  useEffect(() => {
    // Check if user is logged in
    const token = localStorage.getItem('adminToken');
    if (!token) {
      window.location.href = '/admin/login';
      return;
    }

    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setDataLoading(true);
      const token = localStorage.getItem('adminToken');

      // Load all data in parallel
      const [candidatesRes, employersRes, jobsRes] = await Promise.all([
        fetch(`${API_BASE_URL}/api/admin/candidates`, {
          headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }
        }),
        fetch(`${API_BASE_URL}/api/admin/employers`, {
          headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }
        }),
        fetch(`${API_BASE_URL}/api/admin/jobs`, {
          headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }
        })
      ]);

      if (candidatesRes.ok) {
        const data = await candidatesRes.json();
        setCandidates(data.candidates);
        setStats(prev => ({ ...prev, candidates: data.pagination.total }));
      }

      if (employersRes.ok) {
        const data = await employersRes.json();
        setEmployers(data.employers);
        setStats(prev => ({ ...prev, employers: data.pagination?.total ?? data.employers?.length ?? 0 }));
      }

      if (jobsRes.ok) {
        const data = await jobsRes.json();
        setJobs(data.jobs);
        setStats(prev => ({ ...prev, jobs: data.jobs.length }));
      }

      // Load premium and payment data
      try {
        const [
          premiumRes = null,
          paymentsRes,
          paymentStatsRes,
          downloadStatsRes,
          csTicketsRes,
          registrationStatsRes,
          analyticsPaymentsRes
        ] = await Promise.all([
          fetch(`${API_BASE_URL}/api/admin/premium-members`, {
            headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }
          }),
          fetch(`${API_BASE_URL}/api/admin/payments`, {
            headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }
          }),
          fetch(`${API_BASE_URL}/api/admin/payment-stats`, {
            headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }
          }),
          fetch(`${API_BASE_URL}/api/admin/download-stats`, {
            headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }
          }),
          fetch(`${API_BASE_URL}/api/admin/cs/tickets?limit=10&page=1`, {
            headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }
          }),
          fetch(`${API_BASE_URL}/api/admin/registration-stats`, {
            headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }
          }),
          fetch(`${API_BASE_URL}/api/admin/analytics-payments`, {
            headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }
          })
        ]);

        if (premiumRes && premiumRes.ok) {
          const data = await premiumRes.json();
          setPremiumMembers(data.premiumMembers || data.members || []);
        }

        if (paymentsRes.ok) {
          const data = await paymentsRes.json();
          setPayments(data.payments);
        }

        if (paymentStatsRes.ok) {
          const data = await paymentStatsRes.json();
          setPaymentStats(data);
        }

        if (downloadStatsRes.ok) {
          const data = await downloadStatsRes.json();
          setDownloadStats(data);
        }
        if (csTicketsRes.ok) {
          const data = await csTicketsRes.json();
          setCsTickets(data.tickets || []);
        }
        if (registrationStatsRes.ok) {
          const data = await registrationStatsRes.json();
          setRegistrationStats(data || { candidates: [], employers: [] });
        }
        if (analyticsPaymentsRes.ok) {
          const data = await analyticsPaymentsRes.json();
          setAnalyticsPaymentsData({
            stats: data.stats || null,
            payments: data.payments || [],
            topEmployers: data.topEmployers || [],
            pagination: data.pagination || null
          });
        }
      } catch (additionalError) {
        console.error('Error loading additional data:', additionalError);
      }

    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
      setDataLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('adminToken');
    window.location.href = '/admin/login';
  };

  const handleEdit = (item, type) => {
    if (item === null) {
      // Cancel edit - reset editing state
      setEditingItem(null);
    setEditForm({
      full_name: '',
      email: '',
      phone: '',
      experience: '',
      categoryId: '',
      subcategoryId: ''
    });
      return;
    }

    setEditingItem({ ...item, type });
    setEditForm({
      full_name: item.full_name,
      email: item.email,
      phone: item.phone || '',
      experience: item.experience || '',
      categoryId: item.category_id || item.registration_category_id || '',
      subcategoryId: item.subcategory_id || item.registration_subcategory_id || ''
    });
  };

  const handleSaveEdit = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      const { type, id } = editingItem;

      const response = await fetch(`${API_BASE_URL}/api/admin/${type}/${id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(editForm)
      });

      if (response.ok) {
        alert('Updated successfully!');
        setEditingItem(null);
        loadDashboardData();
      } else {
        alert('Update failed!');
      }
    } catch (error) {
      console.error('Update error:', error);
      alert('Update failed: ' + error.message);
    }
  };

  const handleDelete = async (id, type) => {
    if (!window.confirm(`Are you sure you want to delete this ${type}?`)) return;

    try {
      const token = localStorage.getItem('adminToken');

      const response = await fetch(`${API_BASE_URL}/api/admin/${type}/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        alert('Deleted successfully!');
        loadDashboardData();
      } else {
        alert('Delete failed!');
      }
    } catch (error) {
      console.error('Delete error:', error);
      alert('Delete failed: ' + error.message);
    }
  };

  const downloadData = (data, filename) => {
    const csvContent = [
      Object.keys(data[0]).join(','),
      ...data.map(item => Object.values(item).map(val => `"${val || ''}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${filename}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <DashboardOverview stats={stats} csTickets={csTickets} registrationStats={registrationStats} paymentMonthly={paymentStats.monthly || []} />;
      case 'candidates':
        return <CandidatesView
          candidates={candidates}
          editingItem={editingItem}
          editForm={editForm}
          setEditForm={setEditForm}
          onEdit={handleEdit}
          onSave={handleSaveEdit}
          onDelete={handleDelete}
          onDownload={() => downloadData(candidates, 'candidates')}
        />;
      case 'employers':
        return <EmployersView
          employers={employers}
          editingItem={editingItem}
          editForm={editForm}
          setEditForm={setEditForm}
          onEdit={handleEdit}
          onSave={handleSaveEdit}
          onDelete={handleDelete}
          onDownload={() => downloadData(employers, 'employers')}
        />;
      case 'jobs':
        return <JobsView jobs={jobs} />;
      case 'premium':
        return <PremiumMembersView premiumMembers={premiumMembers} />;
      case 'payments':
        return (
          <PaymentsView
            payments={payments}
            paymentStats={paymentStats}
            downloadStats={downloadStats}
            analyticsData={analyticsPaymentsData}
          />
        );
      case 'sponsorship':
        return <SponsorshipForm />;
      case 'customer_service':
        return <CustomerServiceView />;
      case 'analytics':
        return <AnalyticsReportsView />;
      case 'categories':
        return <CategoryManagement />;
      case 'users':
        return <UserManagement />;
      case 'settings':
        return <SettingsView />;
      case 'promotions':
        return <PromotionsView />;
      case 'cms':
        return <CMSView />;
      default:
        return <DashboardOverview stats={stats} csTickets={csTickets} />;
    }
  };

  if (loading) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        backgroundColor: '#f8f9fc'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{
            width: '40px',
            height: '40px',
            border: '4px solid #f3f3f3',
            borderTop: '4px solid #4e73df',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            margin: '0 auto 20px'
          }}></div>
          <p>Loading dashboard...</p>
        </div>
        <style>
          {`
            @keyframes spin {
              0% { transform: rotate(0deg); }
              100% { transform: rotate(360deg); }
            }
          `}
        </style>
      </div>
    );
  }

  return (
    <div style={{
      backgroundColor: '#f8f9fc',
      minHeight: '100vh',
      fontFamily: 'Arial, sans-serif',
      display: 'flex'
    }}>
      {/* Sidebar */}
      <div style={{
        width: sidebarCollapsed ? '70px' : '260px',
        background: 'linear-gradient(180deg, #667eea 0%, #764ba2 100%)',
        color: 'white',
        transition: 'width 0.3s ease',
        position: 'fixed',
        height: '100vh',
        overflowY: 'auto',
        overflowX: 'hidden',
        zIndex: 1000,
        boxShadow: '4px 0 20px rgba(0,0,0,0.1)'
      }}>
        <style>{`
          /* Hide scrollbar for Chrome, Safari and Opera */
          div::-webkit-scrollbar {
            width: 6px;
          }
          div::-webkit-scrollbar-track {
            background: rgba(255, 255, 255, 0.1);
            border-radius: 10px;
          }
          div::-webkit-scrollbar-thumb {
            background: rgba(255, 255, 255, 0.3);
            border-radius: 10px;
          }
          div::-webkit-scrollbar-thumb:hover {
            background: rgba(255, 255, 255, 0.5);
          }
          /* Hide scrollbar for IE, Edge and Firefox */
          div {
            -ms-overflow-style: none;  /* IE and Edge */
            scrollbar-width: thin;  /* Firefox */
            scrollbar-color: rgba(255, 255, 255, 0.3) rgba(255, 255, 255, 0.1);  /* Firefox */
          }
        `}</style>

        {/* Brand Section */}
        <div style={{
          padding: '24px 16px',
          textAlign: 'center',
          borderBottom: '1px solid rgba(255,255,255,0.1)',
          background: 'rgba(255,255,255,0.05)',
          backdropFilter: 'blur(10px)'
        }}>
          <div style={{
            fontSize: '32px',
            marginBottom: sidebarCollapsed ? '0' : '12px',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center'
          }}>
            <FaUserTie style={{
              fontSize: sidebarCollapsed ? '28px' : '32px',
              filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.2))'
            }} />
          </div>
          {!sidebarCollapsed && (
            <h3 style={{
              margin: 0,
              fontSize: '18px',
              fontWeight: '800',
              letterSpacing: '0.5px',
              textShadow: '0 2px 4px rgba(0,0,0,0.2)'
            }}>
              Uptula Admin
            </h3>
          )}
        </div>

        <nav style={{ padding: '16px 8px' }}>
          {[
            { id: 'dashboard', label: 'Dashboard', icon: <FaChartLine />, color: '#fff' },
            { id: 'users', label: 'User Management', icon: <FaUserFriends />, color: '#fff' },
            { id: 'candidates', label: 'Candidates', icon: <FaUserFriends />, color: '#fff' },
            { id: 'employers', label: 'Employers', icon: <FaBuilding />, color: '#fff' },
            { id: 'jobs', label: 'Jobs', icon: <FaBriefcase />, color: '#fff' },
            { id: 'premium', label: 'Premium Members', icon: <FaStar />, color: '#fff' },
            { id: 'payments', label: 'Payments', icon: <FaCreditCard />, color: '#fff' },
            { id: 'sponsorship', label: 'Sponsorship', icon: <FaBullhorn />, color: '#fff' },
            { id: 'customer_service', label: 'Customer Service', icon: <FaHeadset />, color: '#fff' },
            { id: 'analytics', label: 'Analytics & Reports', icon: <FaChartLine />, color: '#fff' },
            { id: 'categories', label: 'Categories', icon: <FaSitemap />, color: '#fff' },
            { id: 'settings', label: 'Settings', icon: <FaCog />, color: '#fff' },
            { id: 'promotions', label: 'Promotions', icon: <FaTags />, color: '#fff' },
            { id: 'cms', label: 'CMS', icon: <FaNewspaper />, color: '#fff' }
          ].map((item, index) => (
            <div
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              style={{
                padding: '14px 12px',
                margin: '4px 0',
                borderRadius: '10px',
                cursor: 'pointer',
                background: activeTab === item.id
                  ? 'linear-gradient(135deg, rgba(255,255,255,0.25) 0%, rgba(255,255,255,0.15) 100%)'
                  : 'transparent',
                display: 'flex',
                alignItems: 'center',
                justifyContent: sidebarCollapsed ? 'center' : 'flex-start',
                transition: 'all 0.3s ease',
                position: 'relative',
                border: activeTab === item.id ? '1px solid rgba(255,255,255,0.3)' : '1px solid transparent',
                boxShadow: activeTab === item.id ? '0 4px 12px rgba(0,0,0,0.15)' : 'none',
                transform: activeTab === item.id ? 'translateX(4px)' : 'translateX(0)'
              }}
              onMouseEnter={(e) => {
                if (activeTab !== item.id) {
                  e.currentTarget.style.background = 'rgba(255,255,255,0.1)';
                  e.currentTarget.style.transform = 'translateX(4px)';
                }
              }}
              onMouseLeave={(e) => {
                if (activeTab !== item.id) {
                  e.currentTarget.style.background = 'transparent';
                  e.currentTarget.style.transform = 'translateX(0)';
                }
              }}
            >
              <div style={{
                fontSize: '18px',
                marginRight: sidebarCollapsed ? '0' : '12px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                minWidth: '24px',
                filter: activeTab === item.id ? 'drop-shadow(0 2px 4px rgba(0,0,0,0.2))' : 'none'
              }}>
                {item.icon}
              </div>
              {!sidebarCollapsed && (
                <span style={{
                  fontSize: '14px',
                  fontWeight: activeTab === item.id ? '700' : '500',
                  letterSpacing: '0.3px',
                  whiteSpace: 'nowrap',
                  textShadow: activeTab === item.id ? '0 1px 2px rgba(0,0,0,0.2)' : 'none'
                }}>
                  {item.label}
                </span>
              )}
              {activeTab === item.id && !sidebarCollapsed && (
                <div style={{
                  position: 'absolute',
                  right: '8px',
                  width: '4px',
                  height: '60%',
                  background: 'rgba(255,255,255,0.8)',
                  borderRadius: '2px',
                  boxShadow: '0 0 8px rgba(255,255,255,0.5)'
                }}></div>
              )}
            </div>
          ))}

          {/* Collapse/expand button */}
          <div style={{
            marginTop: '16px',
            padding: '0 8px 16px 8px',
            borderTop: '1px solid rgba(255,255,255,0.1)',
            paddingTop: '16px'
          }}>
            <button
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              style={{
                width: '100%',
                background: 'rgba(255,255,255,0.15)',
                color: 'white',
                border: '1px solid rgba(255,255,255,0.2)',
                padding: '12px',
                borderRadius: '10px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                fontSize: '16px',
                fontWeight: '600',
                transition: 'all 0.3s ease',
                boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(255,255,255,0.25)';
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(255,255,255,0.15)';
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.1)';
              }}
              type="button"
            >
              {sidebarCollapsed ? (
                <FaChevronRight style={{ fontSize: '14px' }} />
              ) : (
                <>
                  <FaChevronLeft style={{ fontSize: '14px' }} />
                  <span style={{ fontSize: '13px' }}>Collapse</span>
                </>
              )}
            </button>
          </div>
        </nav>
      </div>

      {/* Main Content */}
      <div style={{
        marginLeft: sidebarCollapsed ? '60px' : '250px',
        flex: 1,
        transition: 'margin-left 0.3s'
      }}>
        {/* Top Bar */}
        <div style={{
          backgroundColor: 'white',
          padding: '15px 30px',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <h1 style={{ color: '#4e73df', margin: 0 }}>
            {activeTab.charAt(0).toUpperCase() + activeTab.slice(1)} Management
          </h1>
          <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
            <button
              onClick={loadDashboardData}
              disabled={dataLoading}
              style={{
                backgroundColor: '#4e73df',
                color: 'white',
                border: 'none',
                padding: '8px 16px',
                borderRadius: '4px',
                cursor: dataLoading ? 'not-allowed' : 'pointer',
                opacity: dataLoading ? 0.6 : 1
              }}
            >
              {dataLoading ? 'Refreshing...' : 'Refresh Data'}
            </button>
            <button
              onClick={handleLogout}
              style={{
                backgroundColor: '#e74a3b',
                color: 'white',
                border: 'none',
                padding: '8px 16px',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              Logout
            </button>
          </div>
        </div>

        {/* Content Area */}
        <div style={{ padding: '30px' }}>
          {renderContent()}
        </div>
      </div>
    </div>
  );
};

// Promotions management
const PromotionsView = () => {
  const [promotions, setPromotions] = React.useState([]);
  const [banners, setBanners] = React.useState([]);
  const [form, setForm] = React.useState({ item_type: 'job', item_id: '', priority: 0, is_active: 1, starts_at: '', ends_at: '' });
  const [bannerForm, setBannerForm] = React.useState({ title: '', image_url: '', link_url: '', priority: 0, is_active: 1, starts_at: '', ends_at: '' });

  const token = localStorage.getItem('adminToken');
  const load = async () => {
    const [p, b] = await Promise.all([
      fetch(`${API_BASE_URL}/api/admin/promotions`, { headers: { 'Authorization': `Bearer ${token}` } }),
      fetch(`${API_BASE_URL}/api/admin/banners`, { headers: { 'Authorization': `Bearer ${token}` } })
    ]);
    if (p.ok) setPromotions((await p.json()).promotions || []);
    if (b.ok) setBanners((await b.json()).banners || []);
  };
  React.useEffect(() => { load(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, []);

  const createPromotion = async () => {
    await fetch(`${API_BASE_URL}/api/admin/promotions`, { method: 'POST', headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
    setForm({ item_type: 'job', item_id: '', priority: 0, is_active: 1, starts_at: '', ends_at: '' });
    load();
  };
  const createBanner = async () => {
    await fetch(`${API_BASE_URL}/api/admin/banners`, { method: 'POST', headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }, body: JSON.stringify(bannerForm) });
    setBannerForm({ title: '', image_url: '', link_url: '', priority: 0, is_active: 1, starts_at: '', ends_at: '' });
    load();
  };

  const inputStyle = {
    width: '100%',
    padding: '10px 10px 10px 40px',
    border: '1px solid #ddd',
    borderRadius: '6px',
    fontSize: '14px',
    outline: 'none',
    transition: 'all 0.3s ease',
    boxSizing: 'border-box'
  };

  const selectStyle = {
    ...inputStyle,
    padding: '10px 10px 10px 40px',
    cursor: 'pointer',
    backgroundColor: '#fff'
  };

  const buttonStyle = {
    width: '100%',
    padding: '12px 20px',
    border: 'none',
    borderRadius: '6px',
    fontSize: '15px',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
  };

  return (
    <div style={{ padding: '20px', background: 'linear-gradient(to bottom, #f8f9fc 0%, #ffffff 100%)', minHeight: '100vh' }}>
      {/* Header */}
      <div style={{
        background: 'linear-gradient(135deg, #e74a3b 0%, #c0392b 100%)',
        borderRadius: '16px',
        padding: '20px',
        marginBottom: '24px',
        boxShadow: '0 8px 24px rgba(231, 74, 59, 0.25)',
        color: '#fff',
        position: 'relative',
        overflow: 'hidden'
      }}>
        <div style={{
          position: 'absolute',
          top: '-40px',
          right: '-40px',
          width: '150px',
          height: '150px',
          background: 'rgba(255, 255, 255, 0.1)',
          borderRadius: '50%',
          filter: 'blur(50px)'
        }}></div>
        <h2 style={{ margin: 0, fontSize: '1.8rem', fontWeight: '800', letterSpacing: '-0.02em', position: 'relative', zIndex: 1 }}>
          🎯 Promotions & Banners
        </h2>
        <p style={{ margin: '8px 0 0 0', opacity: 0.95, fontSize: '1rem', position: 'relative', zIndex: 1 }}>
          Manage featured promotions and banner advertisements
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
        {/* Create Promotion Card */}
        <div style={{ background: '#fff', borderRadius: '12px', padding: '24px', boxShadow: '0 2px 10px rgba(0,0,0,0.08)' }}>
          <div style={{
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            color: '#fff',
            padding: '12px 16px',
            borderRadius: '8px',
            marginBottom: '16px',
            fontWeight: '700',
            fontSize: '16px'
          }}>
            Create Promotion (Featured)
          </div>
          <div style={{ fontSize: '13px', color: '#666', marginBottom: '16px' }}>Promote jobs or employers to featured status</div>
          <div style={{ display: 'grid', gap: '12px' }}>
            <div style={{ position: 'relative' }}>
              <FaBriefcase style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#667eea', fontSize: '16px', zIndex: 2 }} />
              <select
                value={form.item_type}
                onChange={(e) => setForm({ ...form, item_type: e.target.value })}
                style={selectStyle}
                onFocus={(e) => { e.target.style.borderColor = '#667eea'; e.target.style.boxShadow = '0 0 0 3px rgba(102, 126, 234, 0.1)'; }}
                onBlur={(e) => { e.target.style.borderColor = '#ddd'; e.target.style.boxShadow = 'none'; }}
              >
                <option value="job">Job</option>
                <option value="employer">Employer</option>
              </select>
            </div>
            <div style={{ position: 'relative' }}>
              <FaHashtag style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#667eea', fontSize: '16px', zIndex: 2 }} />
              <input
                placeholder="Item ID"
                value={form.item_id}
                onChange={(e) => setForm({ ...form, item_id: e.target.value })}
                style={inputStyle}
                onFocus={(e) => { e.target.style.borderColor = '#667eea'; e.target.style.boxShadow = '0 0 0 3px rgba(102, 126, 234, 0.1)'; }}
                onBlur={(e) => { e.target.style.borderColor = '#ddd'; e.target.style.boxShadow = 'none'; }}
              />
            </div>
            <div style={{ position: 'relative' }}>
              <FaSortNumericUp style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#667eea', fontSize: '16px', zIndex: 2 }} />
              <input
                type="number"
                placeholder="Priority"
                value={form.priority}
                onChange={(e) => setForm({ ...form, priority: Number(e.target.value) })}
                style={inputStyle}
                onFocus={(e) => { e.target.style.borderColor = '#667eea'; e.target.style.boxShadow = '0 0 0 3px rgba(102, 126, 234, 0.1)'; }}
                onBlur={(e) => { e.target.style.borderColor = '#ddd'; e.target.style.boxShadow = 'none'; }}
              />
            </div>
            <div style={{ position: 'relative' }}>
              {form.is_active ? (
                <FaToggleOn style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#667eea', fontSize: '20px', zIndex: 2 }} />
              ) : (
                <FaToggleOff style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#667eea', fontSize: '20px', zIndex: 2 }} />
              )}
              <select
                value={form.is_active ? 1 : 0}
                onChange={(e) => setForm({ ...form, is_active: Number(e.target.value) })}
                style={selectStyle}
                onFocus={(e) => { e.target.style.borderColor = '#667eea'; e.target.style.boxShadow = '0 0 0 3px rgba(102, 126, 234, 0.1)'; }}
                onBlur={(e) => { e.target.style.borderColor = '#ddd'; e.target.style.boxShadow = 'none'; }}
              >
                <option value={1}>Active</option>
                <option value={0}>Inactive</option>
              </select>
            </div>
            <div style={{ position: 'relative' }}>
              <FaCalendarAlt style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#667eea', fontSize: '16px', zIndex: 2 }} />
              <input
                type="datetime-local"
                value={form.starts_at}
                onChange={(e) => setForm({ ...form, starts_at: e.target.value })}
                style={inputStyle}
                onFocus={(e) => { e.target.style.borderColor = '#667eea'; e.target.style.boxShadow = '0 0 0 3px rgba(102, 126, 234, 0.1)'; }}
                onBlur={(e) => { e.target.style.borderColor = '#ddd'; e.target.style.boxShadow = 'none'; }}
              />
            </div>
            <div style={{ position: 'relative' }}>
              <FaClock style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#667eea', fontSize: '16px', zIndex: 2 }} />
              <input
                type="datetime-local"
                value={form.ends_at}
                onChange={(e) => setForm({ ...form, ends_at: e.target.value })}
                style={inputStyle}
                onFocus={(e) => { e.target.style.borderColor = '#667eea'; e.target.style.boxShadow = '0 0 0 3px rgba(102, 126, 234, 0.1)'; }}
                onBlur={(e) => { e.target.style.borderColor = '#ddd'; e.target.style.boxShadow = 'none'; }}
              />
            </div>
            <button
              type="button"
              onClick={createPromotion}
              style={{ ...buttonStyle, background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: '#fff' }}
              onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 4px 12px rgba(102, 126, 234, 0.3)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.1)'; }}
            >
              <FaPlus /> Create Promotion
            </button>
          </div>
          <div style={{ marginTop: '24px' }}>
            <div style={{ fontWeight: '700', marginBottom: '12px', fontSize: '15px', color: '#2d3748' }}>Existing Promotions</div>
            <div style={{ border: '2px solid #667eea20', borderRadius: '8px', maxHeight: '280px', overflow: 'auto', background: 'linear-gradient(135deg, #ffffff 0%, #f8f9fc 100%)' }}>
              {promotions.length === 0 ? (
                <div style={{ padding: '40px 20px', textAlign: 'center', color: '#a0aec0' }}>
                  <div style={{ fontSize: '48px', marginBottom: '8px' }}>📭</div>
                  <p style={{ fontSize: '0.95rem', fontWeight: '600' }}>No promotions yet</p>
                </div>
              ) : (
                promotions.map((p, idx) => (
                  <div
                    key={p.id}
                    style={{
                      padding: '12px 16px',
                      borderBottom: idx < promotions.length - 1 ? '1px solid #667eea15' : 'none',
                      fontSize: '14px',
                      background: '#fff',
                      transition: 'all 0.3s ease',
                      cursor: 'pointer'
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = '#667eea15'; e.currentTarget.style.paddingLeft = '24px'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = '#fff'; e.currentTarget.style.paddingLeft = '16px'; }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <span style={{
                        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                        color: '#fff',
                        padding: '4px 10px',
                        borderRadius: '6px',
                        fontSize: '0.75rem',
                        fontWeight: '800'
                      }}>
                        #{p.id}
                      </span>
                      <span style={{ color: '#2d3748', fontWeight: '600' }}>{p.item_type}:{p.item_id}</span>
                      <span style={{ color: '#718096', fontSize: '0.85rem' }}>Priority: {p.priority}</span>
                      <span style={{
                        padding: '2px 8px',
                        borderRadius: '4px',
                        background: p.is_active ? '#1cc88a20' : '#e74a3b20',
                        color: p.is_active ? '#1cc88a' : '#e74a3b',
                        fontSize: '0.75rem',
                        fontWeight: '700',
                        marginLeft: 'auto'
                      }}>
                        {p.is_active ? '✓ Active' : '✗ Inactive'}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Create Banner Card */}
        <div style={{ background: '#fff', borderRadius: '12px', padding: '24px', boxShadow: '0 2px 10px rgba(0,0,0,0.08)' }}>
          <div style={{
            background: 'linear-gradient(135deg, #1cc88a 0%, #17a673 100%)',
            color: '#fff',
            padding: '12px 16px',
            borderRadius: '8px',
            marginBottom: '16px',
            fontWeight: '700',
            fontSize: '16px'
          }}>
            Create Banner
          </div>
          <div style={{ fontSize: '13px', color: '#666', marginBottom: '16px' }}>Create promotional banner advertisements</div>
          <div style={{ display: 'grid', gap: '12px' }}>
            <div style={{ position: 'relative' }}>
              <FaHeading style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#1cc88a', fontSize: '16px', zIndex: 2 }} />
              <input
                placeholder="Title"
                value={bannerForm.title}
                onChange={(e) => setBannerForm({ ...bannerForm, title: e.target.value })}
                style={inputStyle}
                onFocus={(e) => { e.target.style.borderColor = '#1cc88a'; e.target.style.boxShadow = '0 0 0 3px rgba(28, 200, 138, 0.1)'; }}
                onBlur={(e) => { e.target.style.borderColor = '#ddd'; e.target.style.boxShadow = 'none'; }}
              />
            </div>
            <div style={{ position: 'relative' }}>
              <FaImage style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#1cc88a', fontSize: '16px', zIndex: 2 }} />
              <input
                placeholder="Image URL"
                value={bannerForm.image_url}
                onChange={(e) => setBannerForm({ ...bannerForm, image_url: e.target.value })}
                style={inputStyle}
                onFocus={(e) => { e.target.style.borderColor = '#1cc88a'; e.target.style.boxShadow = '0 0 0 3px rgba(28, 200, 138, 0.1)'; }}
                onBlur={(e) => { e.target.style.borderColor = '#ddd'; e.target.style.boxShadow = 'none'; }}
              />
            </div>
            <div style={{ position: 'relative' }}>
              <FaLink style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#1cc88a', fontSize: '16px', zIndex: 2 }} />
              <input
                placeholder="Link URL"
                value={bannerForm.link_url}
                onChange={(e) => setBannerForm({ ...bannerForm, link_url: e.target.value })}
                style={inputStyle}
                onFocus={(e) => { e.target.style.borderColor = '#1cc88a'; e.target.style.boxShadow = '0 0 0 3px rgba(28, 200, 138, 0.1)'; }}
                onBlur={(e) => { e.target.style.borderColor = '#ddd'; e.target.style.boxShadow = 'none'; }}
              />
            </div>
            <div style={{ position: 'relative' }}>
              <FaSortNumericUp style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#1cc88a', fontSize: '16px', zIndex: 2 }} />
              <input
                type="number"
                placeholder="Priority"
                value={bannerForm.priority}
                onChange={(e) => setBannerForm({ ...bannerForm, priority: Number(e.target.value) })}
                style={inputStyle}
                onFocus={(e) => { e.target.style.borderColor = '#1cc88a'; e.target.style.boxShadow = '0 0 0 3px rgba(28, 200, 138, 0.1)'; }}
                onBlur={(e) => { e.target.style.borderColor = '#ddd'; e.target.style.boxShadow = 'none'; }}
              />
            </div>
            <div style={{ position: 'relative' }}>
              {bannerForm.is_active ? (
                <FaToggleOn style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#1cc88a', fontSize: '20px', zIndex: 2 }} />
              ) : (
                <FaToggleOff style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#1cc88a', fontSize: '20px', zIndex: 2 }} />
              )}
              <select
                value={bannerForm.is_active ? 1 : 0}
                onChange={(e) => setBannerForm({ ...bannerForm, is_active: Number(e.target.value) })}
                style={selectStyle}
                onFocus={(e) => { e.target.style.borderColor = '#1cc88a'; e.target.style.boxShadow = '0 0 0 3px rgba(28, 200, 138, 0.1)'; }}
                onBlur={(e) => { e.target.style.borderColor = '#ddd'; e.target.style.boxShadow = 'none'; }}
              >
                <option value={1}>Active</option>
                <option value={0}>Inactive</option>
              </select>
            </div>
            <div style={{ position: 'relative' }}>
              <FaCalendarAlt style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#1cc88a', fontSize: '16px', zIndex: 2 }} />
              <input
                type="datetime-local"
                value={bannerForm.starts_at}
                onChange={(e) => setBannerForm({ ...bannerForm, starts_at: e.target.value })}
                style={inputStyle}
                onFocus={(e) => { e.target.style.borderColor = '#1cc88a'; e.target.style.boxShadow = '0 0 0 3px rgba(28, 200, 138, 0.1)'; }}
                onBlur={(e) => { e.target.style.borderColor = '#ddd'; e.target.style.boxShadow = 'none'; }}
              />
            </div>
            <div style={{ position: 'relative' }}>
              <FaClock style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#1cc88a', fontSize: '16px', zIndex: 2 }} />
              <input
                type="datetime-local"
                value={bannerForm.ends_at}
                onChange={(e) => setBannerForm({ ...bannerForm, ends_at: e.target.value })}
                style={inputStyle}
                onFocus={(e) => { e.target.style.borderColor = '#1cc88a'; e.target.style.boxShadow = '0 0 0 3px rgba(28, 200, 138, 0.1)'; }}
                onBlur={(e) => { e.target.style.borderColor = '#ddd'; e.target.style.boxShadow = 'none'; }}
              />
            </div>
            <button
              type="button"
              onClick={createBanner}
              style={{ ...buttonStyle, background: 'linear-gradient(135deg, #1cc88a 0%, #17a673 100%)', color: '#fff' }}
              onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 4px 12px rgba(28, 200, 138, 0.3)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.1)'; }}
            >
              <FaPlus /> Create Banner
            </button>
          </div>
          <div style={{ marginTop: '24px' }}>
            <div style={{ fontWeight: '700', marginBottom: '12px', fontSize: '15px', color: '#2d3748' }}>Existing Banners</div>
            <div style={{ border: '2px solid #1cc88a20', borderRadius: '8px', maxHeight: '280px', overflow: 'auto', background: 'linear-gradient(135deg, #ffffff 0%, #f8f9fc 100%)' }}>
              {banners.length === 0 ? (
                <div style={{ padding: '40px 20px', textAlign: 'center', color: '#a0aec0' }}>
                  <div style={{ fontSize: '48px', marginBottom: '8px' }}>📭</div>
                  <p style={{ fontSize: '0.95rem', fontWeight: '600' }}>No banners yet</p>
                </div>
              ) : (
                banners.map((b, idx) => (
                  <div
                    key={b.id}
                    style={{
                      padding: '12px 16px',
                      borderBottom: idx < banners.length - 1 ? '1px solid #1cc88a15' : 'none',
                      fontSize: '14px',
                      background: '#fff',
                      transition: 'all 0.3s ease',
                      cursor: 'pointer'
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = '#1cc88a15'; e.currentTarget.style.paddingLeft = '24px'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = '#fff'; e.currentTarget.style.paddingLeft = '16px'; }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <span style={{
                        background: 'linear-gradient(135deg, #1cc88a 0%, #17a673 100%)',
                        color: '#fff',
                        padding: '4px 10px',
                        borderRadius: '6px',
                        fontSize: '0.75rem',
                        fontWeight: '800'
                      }}>
                        #{b.id}
                      </span>
                      <span style={{ color: '#2d3748', fontWeight: '600', flex: 1 }}>{b.title}</span>
                      <span style={{ color: '#718096', fontSize: '0.85rem' }}>Priority: {b.priority}</span>
                      <span style={{
                        padding: '2px 8px',
                        borderRadius: '4px',
                        background: b.is_active ? '#1cc88a20' : '#e74a3b20',
                        color: b.is_active ? '#1cc88a' : '#e74a3b',
                        fontSize: '0.75rem',
                        fontWeight: '700'
                      }}>
                        {b.is_active ? '✓ Active' : '✗ Inactive'}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// CMS management
const CMSView = () => {
  const token = localStorage.getItem('adminToken');
  const [pages, setPages] = React.useState([]);
  const [posts, setPosts] = React.useState([]);
  const [media, setMedia] = React.useState([]);
  const [testimonials, setTestimonials] = React.useState([]);
  const [pageForm, setPageForm] = React.useState({ slug: '', title: '', content: '', is_published: 1 });
  const [postForm, setPostForm] = React.useState({ slug: '', title: '', excerpt: '', content: '', status: 'draft' });
  const [mediaForm, setMediaForm] = React.useState({ file_url: '', file_name: '', file_type: '' });
  const [testimonialForm, setTestimonialForm] = React.useState({ author_name: '', author_role: '', content: '', rating: 5, is_published: 1 });

  const load = async () => {
    const [pg, po, md, ts] = await Promise.all([
      fetch(`${API_BASE_URL}/api/admin/cms/pages`, { headers: { 'Authorization': `Bearer ${token}` } }),
      fetch(`${API_BASE_URL}/api/admin/cms/posts`, { headers: { 'Authorization': `Bearer ${token}` } }),
      fetch(`${API_BASE_URL}/api/admin/cms/media`, { headers: { 'Authorization': `Bearer ${token}` } }),
      fetch(`${API_BASE_URL}/api/admin/cms/testimonials`, { headers: { 'Authorization': `Bearer ${token}` } }),
    ]);
    if (pg.ok) setPages((await pg.json()).pages || []);
    if (po.ok) setPosts((await po.json()).posts || []);
    if (md.ok) setMedia((await md.json()).media || []);
    if (ts.ok) setTestimonials((await ts.json()).testimonials || []);
  };
  React.useEffect(() => { load(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, []);

  const create = async (path, data, reset) => {
    await fetch(`${API_BASE_URL}/api/admin/${path}`, { method: 'POST', headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
    if (reset) reset();
    load();
  };

  const inputStyle = {
    width: '100%',
    padding: '10px 10px 10px 40px',
    border: '1px solid #ddd',
    borderRadius: '6px',
    fontSize: '14px',
    outline: 'none',
    transition: 'all 0.3s ease',
    boxSizing: 'border-box'
  };

  const textareaStyle = {
    width: '100%',
    padding: '10px 10px 10px 40px',
    border: '1px solid #ddd',
    borderRadius: '6px',
    fontSize: '14px',
    outline: 'none',
    transition: 'all 0.3s ease',
    boxSizing: 'border-box',
    resize: 'vertical',
    fontFamily: 'inherit'
  };

  const selectStyle = {
    ...inputStyle,
    padding: '10px 10px 10px 40px',
    cursor: 'pointer',
    backgroundColor: '#fff'
  };

  const buttonStyle = {
    width: '100%',
    padding: '12px 20px',
    border: 'none',
    borderRadius: '6px',
    fontSize: '15px',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
  };

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, padding: '20px' }}>
      {/* Create Page Box */}
      <div style={{ background: '#fff', borderRadius: 12, padding: 20, boxShadow: '0 2px 10px rgba(0,0,0,0.08)' }}>
        <div style={{
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          color: '#fff',
          padding: '12px 16px',
          borderRadius: '8px',
          marginBottom: '16px',
          fontWeight: '700',
          fontSize: '16px'
        }}>
          Create Page
        </div>
        <div style={{ fontSize: '13px', color: '#666', marginBottom: '16px' }}>Add new static pages</div>
        <div style={{ display: 'grid', gap: '12px' }}>
          <div style={{ position: 'relative' }}>
            <FaLink style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#667eea', fontSize: '16px' }} />
            <input
              placeholder="Slug"
              value={pageForm.slug}
              onChange={(e) => setPageForm({ ...pageForm, slug: e.target.value })}
              style={inputStyle}
            />
          </div>
          <div style={{ position: 'relative' }}>
            <FaEdit style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#667eea', fontSize: '16px' }} />
            <input
              placeholder="Title"
              value={pageForm.title}
              onChange={(e) => setPageForm({ ...pageForm, title: e.target.value })}
              style={inputStyle}
            />
          </div>
          <div style={{ position: 'relative' }}>
            <FaFileAlt style={{ position: 'absolute', left: '12px', top: '14px', color: '#667eea', fontSize: '16px', zIndex: 2, pointerEvents: 'none' }} />
            <textarea
              rows="6"
              placeholder="Content (HTML/Markdown)"
              value={pageForm.content}
              onChange={(e) => setPageForm({ ...pageForm, content: e.target.value })}
              style={textareaStyle}
            />
          </div>
          <div style={{ position: 'relative' }}>
            {pageForm.is_published ? (
              <FaEye style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#667eea', fontSize: '16px' }} />
            ) : (
              <FaEyeSlash style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#667eea', fontSize: '16px' }} />
            )}
            <select
              value={pageForm.is_published ? 1 : 0}
              onChange={(e) => setPageForm({ ...pageForm, is_published: Number(e.target.value) })}
              style={selectStyle}
            >
              <option value={1}>Published</option>
              <option value={0}>Draft</option>
            </select>
          </div>
          <button
            type="button"
            onClick={() => create('cms/pages', pageForm, () => setPageForm({ slug: '', title: '', content: '', is_published: 1 }))}
            style={{ ...buttonStyle, background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: '#fff' }}
            onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 4px 12px rgba(102, 126, 234, 0.3)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.1)'; }}
          >
            <FaPlus /> Create Page
          </button>
        </div>
        <div style={{ marginTop: 20 }}>
          <div style={{ fontWeight: 700, marginBottom: 12, fontSize: '15px' }}>Pages</div>
          <div style={{
            border: '2px solid #667eea20',
            borderRadius: '8px',
            minHeight: '200px',
            maxHeight: '280px',
            overflow: 'auto',
            background: 'linear-gradient(135deg, #ffffff 0%, #f8f9fc 100%)',
            boxShadow: 'inset 0 2px 6px rgba(0,0,0,0.05)'
          }}>
            {pages.length === 0 ? (
              <div style={{ padding: '60px 20px', textAlign: 'center', color: '#a0aec0' }}>
                <div style={{ fontSize: '64px', marginBottom: '12px' }}>📭</div>
                <p style={{ fontSize: '0.95rem', fontWeight: '600', margin: 0 }}>No pages yet</p>
              </div>
            ) : (
              pages.map((p, idx) => (
                <div
                  key={p.id}
                  style={{
                    padding: '12px 16px',
                    borderBottom: idx < pages.length - 1 ? '1px solid #667eea15' : 'none',
                    fontSize: '14px',
                    background: '#fff',
                    transition: 'all 0.3s ease',
                    cursor: 'pointer'
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = '#667eea15'; e.currentTarget.style.paddingLeft = '24px'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = '#fff'; e.currentTarget.style.paddingLeft = '16px'; }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <span style={{
                      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                      color: '#fff',
                      padding: '4px 10px',
                      borderRadius: '6px',
                      fontSize: '0.75rem',
                      fontWeight: '800'
                    }}>
                      #{p.id}
                    </span>
                    <span style={{ color: '#2d3748', fontWeight: '600' }}>{p.slug}</span>
                    <span style={{ color: '#718096', fontSize: '0.85rem' }}>{p.title}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Create Blog Post Box */}
      <div style={{ background: '#fff', borderRadius: 12, padding: 20, boxShadow: '0 2px 10px rgba(0,0,0,0.08)' }}>
        <div style={{
          background: 'linear-gradient(135deg, #1cc88a 0%, #17a673 100%)',
          color: '#fff',
          padding: '12px 16px',
          borderRadius: '8px',
          marginBottom: '16px',
          fontWeight: '700',
          fontSize: '16px'
        }}>
          Create Blog Post
        </div>
        <div style={{ fontSize: '13px', color: '#666', marginBottom: '16px' }}>Publish new blog content</div>
        <div style={{ display: 'grid', gap: '12px' }}>
          <div style={{ position: 'relative' }}>
            <FaLink style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#1cc88a', fontSize: '16px' }} />
            <input
              placeholder="Slug"
              value={postForm.slug}
              onChange={(e) => setPostForm({ ...postForm, slug: e.target.value })}
              style={inputStyle}
            />
          </div>
          <div style={{ position: 'relative' }}>
            <FaEdit style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#1cc88a', fontSize: '16px' }} />
            <input
              placeholder="Title"
              value={postForm.title}
              onChange={(e) => setPostForm({ ...postForm, title: e.target.value })}
              style={inputStyle}
            />
          </div>
          <div style={{ position: 'relative' }}>
            <FaFileAlt style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#1cc88a', fontSize: '16px' }} />
            <input
              placeholder="Excerpt"
              value={postForm.excerpt}
              onChange={(e) => setPostForm({ ...postForm, excerpt: e.target.value })}
              style={inputStyle}
            />
          </div>
          <div style={{ position: 'relative' }}>
            <FaFileAlt style={{ position: 'absolute', left: '12px', top: '14px', color: '#1cc88a', fontSize: '16px', zIndex: 2, pointerEvents: 'none' }} />
            <textarea
              rows="6"
              placeholder="Content"
              value={postForm.content}
              onChange={(e) => setPostForm({ ...postForm, content: e.target.value })}
              style={textareaStyle}
            />
          </div>
          <div style={{ position: 'relative' }}>
            <FaEye style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#1cc88a', fontSize: '16px' }} />
            <select
              value={postForm.status}
              onChange={(e) => setPostForm({ ...postForm, status: e.target.value })}
              style={selectStyle}
            >
              <option value="draft">Draft</option>
              <option value="published">Published</option>
            </select>
          </div>
          <button
            type="button"
            onClick={() => create('cms/posts', postForm, () => setPostForm({ slug: '', title: '', excerpt: '', content: '', status: 'draft' }))}
            style={{ ...buttonStyle, background: 'linear-gradient(135deg, #1cc88a 0%, #17a673 100%)', color: '#fff' }}
            onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 4px 12px rgba(28, 200, 138, 0.3)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.1)'; }}
          >
            <FaPlus /> Create Post
          </button>
        </div>
        <div style={{ marginTop: 20 }}>
          <div style={{ fontWeight: 700, marginBottom: 12, fontSize: '15px' }}>Posts</div>
          <div style={{
            border: '2px solid #1cc88a20',
            borderRadius: '8px',
            minHeight: '200px',
            maxHeight: '280px',
            overflow: 'auto',
            background: 'linear-gradient(135deg, #ffffff 0%, #f8f9fc 100%)',
            boxShadow: 'inset 0 2px 6px rgba(0,0,0,0.05)'
          }}>
            {posts.length === 0 ? (
              <div style={{ padding: '60px 20px', textAlign: 'center', color: '#a0aec0' }}>
                <div style={{ fontSize: '64px', marginBottom: '12px' }}>📭</div>
                <p style={{ fontSize: '0.95rem', fontWeight: '600', margin: 0 }}>No posts yet</p>
              </div>
            ) : (
              posts.map((p, idx) => (
                <div
                  key={p.id}
                  style={{
                    padding: '12px 16px',
                    borderBottom: idx < posts.length - 1 ? '1px solid #1cc88a15' : 'none',
                    fontSize: '14px',
                    background: '#fff',
                    transition: 'all 0.3s ease',
                    cursor: 'pointer'
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = '#1cc88a15'; e.currentTarget.style.paddingLeft = '24px'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = '#fff'; e.currentTarget.style.paddingLeft = '16px'; }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <span style={{
                      background: 'linear-gradient(135deg, #1cc88a 0%, #17a673 100%)',
                      color: '#fff',
                      padding: '4px 10px',
                      borderRadius: '6px',
                      fontSize: '0.75rem',
                      fontWeight: '800'
                    }}>
                      #{p.id}
                    </span>
                    <span style={{ color: '#2d3748', fontWeight: '600' }}>{p.slug}</span>
                    <span style={{ color: '#718096', fontSize: '0.85rem' }}>{p.title}</span>
                    <span style={{
                      padding: '2px 8px',
                      borderRadius: '4px',
                      background: p.status === 'published' ? '#1cc88a20' : '#f6c23e20',
                      color: p.status === 'published' ? '#1cc88a' : '#f6c23e',
                      fontSize: '0.75rem',
                      fontWeight: '700',
                      marginLeft: 'auto'
                    }}>
                      {p.status === 'published' ? '🚀' : '📝'} {p.status}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Add Media Box */}
      <div style={{ background: '#fff', borderRadius: 12, padding: 20, boxShadow: '0 2px 10px rgba(0,0,0,0.08)' }}>
        <div style={{
          background: 'linear-gradient(135deg, #36b9cc 0%, #2c9faf 100%)',
          color: '#fff',
          padding: '12px 16px',
          borderRadius: '8px',
          marginBottom: '16px',
          fontWeight: '700',
          fontSize: '16px'
        }}>
          Add Media
        </div>
        <div style={{ fontSize: '13px', color: '#666', marginBottom: '16px' }}>Upload images and files</div>
        <div style={{ display: 'grid', gap: '12px' }}>
          <div style={{ position: 'relative' }}>
            <FaLink style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#36b9cc', fontSize: '16px' }} />
            <input
              placeholder="File URL"
              value={mediaForm.file_url}
              onChange={(e) => setMediaForm({ ...mediaForm, file_url: e.target.value })}
              style={inputStyle}
            />
          </div>
          <div style={{ position: 'relative' }}>
            <FaFile style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#36b9cc', fontSize: '16px' }} />
            <input
              placeholder="File Name"
              value={mediaForm.file_name}
              onChange={(e) => setMediaForm({ ...mediaForm, file_name: e.target.value })}
              style={inputStyle}
            />
          </div>
          <div style={{ position: 'relative' }}>
            <FaTag style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#36b9cc', fontSize: '16px' }} />
            <input
              placeholder="File Type"
              value={mediaForm.file_type}
              onChange={(e) => setMediaForm({ ...mediaForm, file_type: e.target.value })}
              style={inputStyle}
            />
          </div>
          <button
            type="button"
            onClick={() => create('cms/media', mediaForm, () => setMediaForm({ file_url: '', file_name: '', file_type: '' }))}
            style={{ ...buttonStyle, background: 'linear-gradient(135deg, #36b9cc 0%, #2c9faf 100%)', color: '#fff' }}
            onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 4px 12px rgba(54, 185, 204, 0.3)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.1)'; }}
          >
            <FaPlus /> Add Media
          </button>
        </div>
        <div style={{ marginTop: 20 }}>
          <div style={{ fontWeight: 700, marginBottom: 12, fontSize: '15px' }}>Media</div>
          <div style={{
            border: '2px solid #36b9cc20',
            borderRadius: '8px',
            minHeight: '200px',
            maxHeight: '280px',
            overflow: 'auto',
            background: 'linear-gradient(135deg, #ffffff 0%, #f8f9fc 100%)',
            boxShadow: 'inset 0 2px 6px rgba(0,0,0,0.05)'
          }}>
            {media.length === 0 ? (
              <div style={{ padding: '60px 20px', textAlign: 'center', color: '#a0aec0' }}>
                <div style={{ fontSize: '64px', marginBottom: '12px' }}>📭</div>
                <p style={{ fontSize: '0.95rem', fontWeight: '600', margin: 0 }}>No media files yet</p>
              </div>
            ) : (
              media.map((m, idx) => (
                <div
                  key={m.id}
                  style={{
                    padding: '12px 16px',
                    borderBottom: idx < media.length - 1 ? '1px solid #36b9cc15' : 'none',
                    fontSize: '14px',
                    background: '#fff',
                    transition: 'all 0.3s ease',
                    cursor: 'pointer'
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = '#36b9cc15'; e.currentTarget.style.paddingLeft = '24px'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = '#fff'; e.currentTarget.style.paddingLeft = '16px'; }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <span style={{
                      background: 'linear-gradient(135deg, #36b9cc 0%, #2c9faf 100%)',
                      color: '#fff',
                      padding: '4px 10px',
                      borderRadius: '6px',
                      fontSize: '0.75rem',
                      fontWeight: '800'
                    }}>
                      #{m.id}
                    </span>
                    <a
                      href={m.file_url}
                      target="_blank"
                      rel="noreferrer"
                      style={{
                        color: '#36b9cc',
                        textDecoration: 'none',
                        fontWeight: '600',
                        flex: 1
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.textDecoration = 'underline'}
                      onMouseLeave={(e) => e.currentTarget.style.textDecoration = 'none'}
                    >
                      {m.file_name || m.file_url}
                    </a>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Add Testimonial Box */}
      <div style={{ background: '#fff', borderRadius: 12, padding: 20, boxShadow: '0 2px 10px rgba(0,0,0,0.08)' }}>
        <div style={{
          background: 'linear-gradient(135deg, #f6c23e 0%, #e0a800 100%)',
          color: '#fff',
          padding: '12px 16px',
          borderRadius: '8px',
          marginBottom: '16px',
          fontWeight: '700',
          fontSize: '16px'
        }}>
          Add Testimonial
        </div>
        <div style={{ fontSize: '13px', color: '#666', marginBottom: '16px' }}>Create customer reviews</div>
        <div style={{ display: 'grid', gap: '12px' }}>
          <div style={{ position: 'relative' }}>
            <FaUser style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#f6c23e', fontSize: '16px' }} />
            <input
              placeholder="Author Name"
              value={testimonialForm.author_name}
              onChange={(e) => setTestimonialForm({ ...testimonialForm, author_name: e.target.value })}
              style={inputStyle}
            />
          </div>
          <div style={{ position: 'relative' }}>
            <FaBriefcase style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#f6c23e', fontSize: '16px' }} />
            <input
              placeholder="Author Role"
              value={testimonialForm.author_role}
              onChange={(e) => setTestimonialForm({ ...testimonialForm, author_role: e.target.value })}
              style={inputStyle}
            />
          </div>
          <div style={{ position: 'relative' }}>
            <FaFileAlt style={{ position: 'absolute', left: '12px', top: '14px', color: '#f6c23e', fontSize: '16px', zIndex: 2, pointerEvents: 'none' }} />
            <textarea
              rows="4"
              placeholder="Content"
              value={testimonialForm.content}
              onChange={(e) => setTestimonialForm({ ...testimonialForm, content: e.target.value })}
              style={textareaStyle}
            />
          </div>
          <div style={{ position: 'relative' }}>
            <FaStar style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#f6c23e', fontSize: '16px' }} />
            <input
              type="number"
              placeholder="Rating"
              value={testimonialForm.rating}
              onChange={(e) => setTestimonialForm({ ...testimonialForm, rating: Number(e.target.value) })}
              style={inputStyle}
            />
          </div>
          <div style={{ position: 'relative' }}>
            {testimonialForm.is_published ? (
              <FaCheck style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#f6c23e', fontSize: '16px' }} />
            ) : (
              <FaLock style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#f6c23e', fontSize: '16px' }} />
            )}
            <select
              value={testimonialForm.is_published ? 1 : 0}
              onChange={(e) => setTestimonialForm({ ...testimonialForm, is_published: Number(e.target.value) })}
              style={selectStyle}
            >
              <option value={1}>Published</option>
              <option value={0}>Hidden</option>
            </select>
          </div>
          <button
            type="button"
            onClick={() => create('cms/testimonials', testimonialForm, () => setTestimonialForm({ author_name: '', author_role: '', content: '', rating: 5, is_published: 1 }))}
            style={{ ...buttonStyle, background: 'linear-gradient(135deg, #f6c23e 0%, #e0a800 100%)', color: '#fff' }}
            onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 4px 12px rgba(246, 194, 62, 0.3)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.1)'; }}
          >
            <FaPlus /> Add Testimonial
          </button>
        </div>
        <div style={{ marginTop: 20 }}>
          <div style={{ fontWeight: 700, marginBottom: 12, fontSize: '15px' }}>Testimonials</div>
          <div style={{
            border: '2px solid #f6c23e20',
            borderRadius: '8px',
            minHeight: '200px',
            maxHeight: '280px',
            overflow: 'auto',
            background: 'linear-gradient(135deg, #ffffff 0%, #f8f9fc 100%)',
            boxShadow: 'inset 0 2px 6px rgba(0,0,0,0.05)'
          }}>
            {testimonials.length === 0 ? (
              <div style={{ padding: '60px 20px', textAlign: 'center', color: '#a0aec0' }}>
                <div style={{ fontSize: '64px', marginBottom: '12px' }}>📭</div>
                <p style={{ fontSize: '0.95rem', fontWeight: '600', margin: 0 }}>No testimonials yet</p>
              </div>
            ) : (
              testimonials.map((t, idx) => (
                <div
                  key={t.id}
                  style={{
                    padding: '12px 16px',
                    borderBottom: idx < testimonials.length - 1 ? '1px solid #f6c23e15' : 'none',
                    fontSize: '14px',
                    background: '#fff',
                    transition: 'all 0.3s ease',
                    cursor: 'pointer'
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = '#f6c23e15'; e.currentTarget.style.paddingLeft = '24px'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = '#fff'; e.currentTarget.style.paddingLeft = '16px'; }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <span style={{
                      background: 'linear-gradient(135deg, #f6c23e 0%, #e0a800 100%)',
                      color: '#fff',
                      padding: '4px 10px',
                      borderRadius: '6px',
                      fontSize: '0.75rem',
                      fontWeight: '800'
                    }}>
                      #{t.id}
                    </span>
                    <span style={{ color: '#2d3748', fontWeight: '600' }}>{t.author_name}</span>
                    <span style={{ color: '#f6c23e', fontSize: '0.85rem', fontWeight: '700' }}>
                      {'⭐'.repeat(t.rating)}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// Dashboard Overview Component
const DashboardOverview = ({ stats, csTickets, registrationStats, paymentMonthly }) => (
  <div>
    <div style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
      gap: '20px',
      marginBottom: '30px'
    }}>
      <div style={{
        backgroundColor: 'white',
        padding: '20px',
        borderRadius: '8px',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
        borderLeft: '4px solid #4e73df'
      }}>
        <h3 style={{ color: '#4e73df', margin: '0 0 10px 0' }}>Total Candidates</h3>
        <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#333' }}>
          {stats.candidates}
        </div>
      </div>

      <div style={{
        backgroundColor: 'white',
        padding: '20px',
        borderRadius: '8px',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
        borderLeft: '4px solid #1cc88a'
      }}>
        <h3 style={{ color: '#1cc88a', margin: '0 0 10px 0' }}>Total Employers</h3>
        <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#333' }}>
          {stats.employers}
        </div>
      </div>

      <div style={{
        backgroundColor: 'white',
        padding: '20px',
        borderRadius: '8px',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
        borderLeft: '4px solid #36b9cc'
      }}>
        <h3 style={{ color: '#36b9cc', margin: '0 0 10px 0' }}>Total Jobs</h3>
        <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#333' }}>
          {stats.jobs}
        </div>
      </div>

      <div style={{
        backgroundColor: 'white',
        padding: '20px',
        borderRadius: '8px',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
        borderLeft: '4px solid #f6c23e'
      }}>
        <h3 style={{ color: '#f6c23e', margin: '0 0 10px 0' }}>Total Applications</h3>
        <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#333' }}>
          {stats.applications}
        </div>
      </div>
    </div>

    <div style={{
      backgroundColor: 'white',
      padding: '30px',
      borderRadius: '8px',
      boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
    }}>
      <h2 style={{ color: '#333', marginBottom: '20px' }}>Welcome to Admin Dashboard</h2>
      <p style={{ color: '#666', marginBottom: '20px' }}>
        You have successfully logged into the Uptula admin dashboard. Use the sidebar to navigate between different sections.
      </p>
      <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
        <div style={{ padding: '10px 20px', backgroundColor: '#e3f2fd', borderRadius: '20px', fontSize: '14px' }}>
          📊 Dashboard Overview
        </div>
        <div style={{ padding: '10px 20px', backgroundColor: '#e8f5e8', borderRadius: '20px', fontSize: '14px' }}>
          👥 Manage Candidates
        </div>
        <div style={{ padding: '10px 20px', backgroundColor: '#fff3e0', borderRadius: '20px', fontSize: '14px' }}>
          🏢 Manage Employers
        </div>
        <div style={{ padding: '10px 20px', backgroundColor: '#f3e5f5', borderRadius: '20px', fontSize: '14px' }}>
          💼 Manage Jobs
        </div>
        <div style={{ padding: '10px 20px', backgroundColor: '#fce4ec', borderRadius: '20px', fontSize: '14px' }}>
          📢 Sponsorship Management
        </div>
      </div>

      {/* Enhanced Analytics Section with Animated Graphs */}
      <div style={{ marginTop: '24px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '20px' }}>
          {/* Analytics (Last 12 Months) - Candidate Registrations */}
          <div style={{
            borderRadius: '16px',
            border: 'none',
            overflow: 'hidden',
            boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
            transition: 'all 0.3s ease'
          }}>
            <div style={{
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              padding: '20px',
              borderBottom: 'none',
              color: '#fff',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}>
              <i className="fas fa-chart-area" style={{ fontSize: '1.2rem' }}></i>
              <h6 style={{ margin: 0, fontSize: '1rem', fontWeight: '600' }}>
                Analytics (Last 12 Months)
              </h6>
            </div>
            <div style={{ padding: '2rem', backgroundColor: 'white' }}>
              <SimpleBarChart
                title="Candidate Registrations"
                data={normalizeMonthly(seriesMonths(registrationStats?.candidates || []))}
                color="#667eea"
                width={450}
                height={240}
              />
              <div style={{ marginTop: '1rem', display: 'flex', justifyContent: 'space-around', paddingTop: '1rem', borderTop: '1px solid rgba(0, 0, 0, 0.05)' }}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ color: '#667eea', fontSize: '1.5rem', fontWeight: '700' }}>
                    {stats.candidates}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: '#858796', textTransform: 'uppercase' }}>
                    Total Candidates
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Employer Registrations */}
          <div style={{
            borderRadius: '16px',
            border: 'none',
            overflow: 'hidden',
            boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
            transition: 'all 0.3s ease'
          }}>
            <div style={{
              background: 'linear-gradient(135deg, #1cc88a 0%, #17a673 100%)',
              padding: '20px',
              borderBottom: 'none',
              color: '#fff',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}>
              <i className="fas fa-user-plus" style={{ fontSize: '1.2rem' }}></i>
              <h6 style={{ margin: 0, fontSize: '1rem', fontWeight: '600' }}>
                Employer Registrations
              </h6>
            </div>
            <div style={{ padding: '2rem', backgroundColor: 'white' }}>
              <SimpleBarChart
                title="Employer Registrations"
                data={normalizeMonthly(seriesMonths(registrationStats?.employers || []))}
                color="#1cc88a"
                width={450}
                height={240}
              />
              <div style={{ marginTop: '1rem', display: 'flex', justifyContent: 'space-around', paddingTop: '1rem', borderTop: '1px solid rgba(0, 0, 0, 0.05)' }}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ color: '#1cc88a', fontSize: '1.5rem', fontWeight: '700' }}>
                    {stats.employers}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: '#858796', textTransform: 'uppercase' }}>
                    Total Employers
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Jobs & Applicants and Payments Revenue Section - Side by Side */}
      <div style={{ marginTop: '24px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(450px, 1fr))', gap: '20px' }}>
          {/* Jobs & Applicants Combined Chart */}
          <div style={{
            borderRadius: '16px',
            border: 'none',
            overflow: 'hidden',
            boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
            transition: 'all 0.3s ease'
          }}>
            <div style={{
              background: 'linear-gradient(135deg, #1cc88a 0%, #17a673 100%)',
              padding: '20px',
              borderBottom: 'none',
              color: '#fff',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}>
              <i className="fas fa-chart-bar" style={{ fontSize: '1.2rem' }}></i>
              <h6 style={{ margin: 0, fontSize: '1rem', fontWeight: '600' }}>
                Jobs & Applicants Analytics
              </h6>
            </div>
            <div style={{ padding: '2rem', backgroundColor: 'white' }}>
              <GroupedBarChart
                title="Monthly Overview"
                data={normalizeMonthly(seriesMonths(Array.from({ length: 12 }, (_, i) => ({
                  month: `2024-${String(i + 1).padStart(2, '0')}`,
                  jobs: stats.jobs > 0 ? Math.floor(stats.jobs / 12 + Math.random() * 20) : Math.floor(Math.random() * 50) + 20,
                  applicants: stats.candidates > 0 ? Math.floor(stats.candidates / 12 + Math.random() * 30) : Math.floor(Math.random() * 60) + 30
                }))))}
                series={[
                  { key: 'jobs', label: 'Total Jobs', color: '#1cc88a' },
                  { key: 'applicants', label: 'Total Applicants', color: '#f6c23e' }
                ]}
              />
            </div>
          </div>

          {/* Payments Revenue */}
          <div style={{
            borderRadius: '16px',
            border: 'none',
            overflow: 'hidden',
            boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
            transition: 'all 0.3s ease'
          }}>
            <div style={{
              background: 'linear-gradient(135deg, #f6c23e 0%, #e0a800 100%)',
              padding: '20px',
              borderBottom: 'none',
              color: '#fff',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}>
              <i className="fas fa-rupee-sign" style={{ fontSize: '1.2rem' }}></i>
              <h6 style={{ margin: 0, fontSize: '1rem', fontWeight: '600' }}>
                Payments (Revenue)
              </h6>
            </div>
            <div style={{ padding: '2rem', backgroundColor: 'white' }}>
              <AnimatedBarChart
                title="Monthly Revenue"
                data={normalizeMonthly(seriesMonths((paymentMonthly || []).map(m => ({ month: m.month, count: m.revenue }))))}
                color="#f6c23e"
                valueFormatter={(v) => `₹${Number(v).toLocaleString('en-IN', { maximumFractionDigits: 0 })}`}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Enhanced Customer Service Tickets Section */}
      <div style={{ marginTop: '24px' }}>
        <div style={{
          borderRadius: '16px',
          border: 'none',
          overflow: 'hidden',
          boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
          transition: 'all 0.3s ease'
        }}>
          <div style={{
            background: 'linear-gradient(135deg, #e74a3b 0%, #c0392b 100%)',
            padding: '20px',
            borderBottom: 'none',
            color: '#fff',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}>
            <i className="fas fa-ticket-alt" style={{ fontSize: '1.2rem' }}></i>
            <h6 style={{ margin: 0, fontSize: '1rem', fontWeight: '600' }}>
              Customer Service — Recent Tickets
            </h6>
          </div>
          <div style={{ padding: '1.5rem', backgroundColor: 'white' }}>
            {(!csTickets || csTickets.length === 0) ? (
              <div style={{
                textAlign: 'center',
                padding: '2rem',
                color: '#858796',
                fontSize: '0.95rem'
              }}>
                <i className="fas fa-inbox" style={{ fontSize: '3rem', marginBottom: '1rem', opacity: 0.3 }}></i>
                <p>No recent tickets</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {csTickets.slice(0, 5).map((t, index) => (
                  <div
                    key={t.id}
                    style={{
                      padding: '1rem',
                      borderRadius: '12px',
                      border: '1px solid rgba(0, 0, 0, 0.05)',
                      transition: 'all 0.3s ease',
                      cursor: 'pointer',
                      animation: `fadeIn 0.3s ease-out ${index * 0.1}s both`
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.boxShadow = '0 4px 15px rgba(0, 0, 0, 0.08)';
                      e.currentTarget.style.transform = 'translateY(-2px)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.boxShadow = 'none';
                      e.currentTarget.style.transform = 'translateY(0)';
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <div style={{
                          width: '40px',
                          height: '40px',
                          borderRadius: '50%',
                          background: `linear-gradient(135deg, ${index % 3 === 0 ? '#667eea, #764ba2' : index % 3 === 1 ? '#1cc88a, #17a673' : '#36b9cc, #2c9faf'})`,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: '#fff',
                          fontWeight: '700',
                          fontSize: '0.875rem'
                        }}>
                          {t.full_name ? t.full_name.substring(0, 2).toUpperCase() : 'U'}
                        </div>
                        <div>
                          <div style={{ fontWeight: '600', fontSize: '0.875rem', color: '#5a5c69' }}>
                            {t.full_name || 'Unknown User'}
                          </div>
                          <div style={{ fontSize: '0.75rem', color: '#858796' }}>
                            {t.email || 'No email'}
                          </div>
                        </div>
                      </div>
                      <span style={{
                        padding: '0.25rem 0.75rem',
                        borderRadius: '20px',
                        fontSize: '0.75rem',
                        fontWeight: '600',
                        background: t.status === 'open' ? 'rgba(231, 74, 59, 0.1)' : t.status === 'in_progress' ? 'rgba(246, 194, 62, 0.1)' : 'rgba(28, 200, 138, 0.1)',
                        color: t.status === 'open' ? '#e74a3b' : t.status === 'in_progress' ? '#f6c23e' : '#1cc88a',
                        textTransform: 'capitalize'
                      }}>
                        {t.status}
                      </span>
                    </div>
                    <div style={{ fontSize: '0.875rem', color: '#5a5c69', marginTop: '0.5rem', fontWeight: '600' }}>
                      {t.subject}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: '#858796', marginTop: '0.25rem', textTransform: 'capitalize' }}>
                      Category: {t.category}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <style>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  </div>
);

const ADMIN_TABLE_SEARCH_DEBOUNCE_MS = 400;

// Candidates View Component with Edit/Delete functionality
const CandidatesView = ({ candidates, editingItem, editForm, setEditForm, onEdit, onSave, onDelete, onDownload }) => {
  const [q, setQ] = useState('');
  const [debouncedQ, setDebouncedQ] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [filterCategoryId, setFilterCategoryId] = useState('');
  const [filterSubcategoryId, setFilterSubcategoryId] = useState('');
  const [regCategories, setRegCategories] = useState([]);
  const [list, setList] = useState(candidates);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [listFetchNonce, setListFetchNonce] = useState(0);
  const pageLimit = 50;
  const adminCandidatesFetchIdRef = useRef(0);

  useEffect(() => {
    const token = localStorage.getItem('adminToken');
    if (!token) return;
    fetchAdminRegistrationTree(token)
      .then(setRegCategories)
      .catch((err) => console.error('Failed to load registration categories', err));
  }, []);

  const filterSubcategories = React.useMemo(() => {
    if (!filterCategoryId) return [];
    const cat = regCategories.find((c) => String(c.id) === String(filterCategoryId));
    return cat?.subcategories || [];
  }, [filterCategoryId, regCategories]);

  const editSubcategories = React.useMemo(() => {
    if (!editForm.categoryId) return [];
    const cat = regCategories.find((c) => String(c.id) === String(editForm.categoryId));
    return cat?.subcategories || [];
  }, [editForm.categoryId, regCategories]);

  useEffect(() => {
    const id = setTimeout(() => setDebouncedQ(q), ADMIN_TABLE_SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(id);
  }, [q]);

  useLayoutEffect(() => {
    setPage(1);
  }, [debouncedQ, dateFrom, dateTo, filterCategoryId, filterSubcategoryId]);

  useEffect(() => {
    const fetchId = ++adminCandidatesFetchIdRef.current;
    let cancelled = false;
    const token = localStorage.getItem('adminToken');
    (async () => {
      const params = new URLSearchParams();
      params.set('q', debouncedQ);
      params.set('page', String(page));
      params.set('limit', String(pageLimit));
      if (dateFrom) params.set('dateFrom', dateFrom);
      if (dateTo) params.set('dateTo', dateTo);
      if (filterCategoryId) params.set('categoryId', filterCategoryId);
      if (filterSubcategoryId) params.set('subcategoryId', filterSubcategoryId);
      const res = await fetch(
        `${API_BASE_URL}/api/admin/candidates?${params.toString()}`,
        { headers: { 'Authorization': `Bearer ${token}` } }
      );
      const data = await res.json();
      if (!cancelled && res.ok && fetchId === adminCandidatesFetchIdRef.current) {
        setList(data.candidates || []);
        setTotal(Number(data.pagination?.total) || 0);
      }
    })();
    return () => { cancelled = true; };
  }, [page, listFetchNonce, debouncedQ, dateFrom, dateTo, filterCategoryId, filterSubcategoryId]);

  const bumpList = () => setListFetchNonce((n) => n + 1);

  const verify = async (id, verified) => {
    const token = localStorage.getItem('adminToken');
    await fetch(`${API_BASE_URL}/api/admin/users/${id}/verify`, {
      method: 'PATCH', headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ verified })
    });
    bumpList();
  };
  const suspend = async (id) => {
    const token = localStorage.getItem('adminToken');
    await fetch(`${API_BASE_URL}/api/admin/users/${id}/deactivate`, { method: 'PATCH', headers: { 'Authorization': `Bearer ${token}` } });
    bumpList();
  };

  const totalPages = Math.ceil(total / pageLimit) || 0;
  return (
    <div style={{
      backgroundColor: 'white',
      borderRadius: '16px',
      boxShadow: '0 4px 15px rgba(0,0,0,0.08)',
      overflow: 'hidden'
    }}>
      {/* Header with Search and Download */}
      <div style={{
        padding: '24px',
        borderBottom: '2px solid #e8eaf6',
        display: 'flex',
        flexDirection: 'column',
        gap: '18px',
        background: 'linear-gradient(135deg, #f8f9fc 0%, #ffffff 100%)'
      }}>
        <h2 style={{
          margin: 0,
          width: '100%',
          color: '#2d3748',
          fontSize: '1.5rem',
          fontWeight: '800',
          display: 'flex',
          alignItems: 'center',
          gap: '10px'
        }}>
          <FaUser style={{ color: '#36b9cc', fontSize: '24px' }} />
          Registered Candidates ({total})
        </h2>
        <div style={{
          display: 'flex',
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          width: '100%',
          gap: '16px',
          flexWrap: 'nowrap'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            flexWrap: 'nowrap',
            flex: '1 1 0%',
            minWidth: 0,
            overflowX: 'auto'
          }}>
            <div style={{ position: 'relative', flexShrink: 0 }}>
              <FaSearch style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#36b9cc', fontSize: '16px', zIndex: 2, pointerEvents: 'none' }} />
              <input
                placeholder="Search name/email/phone"
                value={q}
                onChange={(e) => setQ(e.target.value)}
                style={{
                  padding: '12px 12px 12px 45px',
                  border: '2px solid #e8eaf6',
                  borderRadius: '8px',
                  fontSize: '14px',
                  outline: 'none',
                  transition: 'all 0.3s ease',
                  minWidth: '220px',
                  width: 'min(320px, 100%)',
                  maxWidth: '100%',
                  boxSizing: 'border-box',
                  background: 'linear-gradient(135deg, #ffffff 0%, #f8f9fc 100%)'
                }}
                onFocus={(e) => { e.target.style.borderColor = '#36b9cc'; e.target.style.boxShadow = '0 0 0 3px #36b9cc20'; }}
                onBlur={(e) => { e.target.style.borderColor = '#e8eaf6'; e.target.style.boxShadow = 'none'; }}
              />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'nowrap', flexShrink: 0 }}>
              <FaCalendarAlt style={{ color: '#36b9cc', fontSize: '18px' }} />
              <span style={{ fontSize: '13px', fontWeight: '700', color: '#4a5568', whiteSpace: 'nowrap' }}>Registered date</span>
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                style={{
                  padding: '10px 12px',
                  border: '2px solid #e8eaf6',
                  borderRadius: '8px',
                  fontSize: '14px',
                  outline: 'none',
                  background: '#fff',
                  color: '#2d3748',
                  flexShrink: 0
                }}
              />
              <span style={{ fontSize: '13px', fontWeight: '600', color: '#718096', flexShrink: 0 }}>to</span>
              <input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                style={{
                  padding: '10px 12px',
                  border: '2px solid #e8eaf6',
                  borderRadius: '8px',
                  fontSize: '14px',
                  outline: 'none',
                  background: '#fff',
                  color: '#2d3748',
                  flexShrink: 0
                }}
              />
              <select
                value={filterCategoryId}
                onChange={(e) => {
                  setFilterCategoryId(e.target.value);
                  setFilterSubcategoryId('');
                }}
                style={{
                  padding: '10px 12px',
                  border: '2px solid #e8eaf6',
                  borderRadius: '8px',
                  fontSize: '14px',
                  minWidth: '150px',
                  flexShrink: 0
                }}
              >
                <option value="">All categories</option>
                {regCategories.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
              <select
                value={filterSubcategoryId}
                onChange={(e) => setFilterSubcategoryId(e.target.value)}
                disabled={!filterCategoryId}
                style={{
                  padding: '10px 12px',
                  border: '2px solid #e8eaf6',
                  borderRadius: '8px',
                  fontSize: '14px',
                  minWidth: '150px',
                  flexShrink: 0
                }}
              >
                <option value="">All subcategories</option>
                {filterSubcategories.map((s) => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>
          </div>
          <button
            onClick={onDownload}
            style={{
              flexShrink: 0,
              background: 'linear-gradient(135deg, #1cc88a 0%, #17a673 100%)',
              color: 'white',
              border: 'none',
              padding: '12px 24px',
              borderRadius: '8px',
              fontSize: '14px',
              fontWeight: '700',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              boxShadow: '0 4px 12px rgba(28, 200, 138, 0.3)',
              transition: 'all 0.3s ease'
            }}
            onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 6px 16px rgba(28, 200, 138, 0.4)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 12px rgba(28, 200, 138, 0.3)'; }}
          >
            <FaFile style={{ fontSize: '16px' }} /> Download CSV
          </button>
        </div>
      </div>

      {/* Table */}
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: 'linear-gradient(135deg, #36b9cc 0%, #2c9faf 100%)' }}>
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
                <FaPhone style={{ marginRight: '8px', transform: 'scaleX(-1)' }} /> Phone
              </th>
              <th style={{ padding: '16px 20px', textAlign: 'left', borderBottom: 'none', color: '#fff', fontWeight: '700', fontSize: '14px' }}>
                <FaBriefcase style={{ marginRight: '8px' }} /> Experience
              </th>
              <th style={{ padding: '16px 20px', textAlign: 'left', borderBottom: 'none', color: '#fff', fontWeight: '700', fontSize: '14px' }}>
                <FaTags style={{ marginRight: '8px' }} /> Category
              </th>
              <th style={{ padding: '16px 20px', textAlign: 'left', borderBottom: 'none', color: '#fff', fontWeight: '700', fontSize: '14px' }}>
                <FaSitemap style={{ marginRight: '8px' }} /> Subcategory
              </th>
              <th style={{ padding: '16px 20px', textAlign: 'left', borderBottom: 'none', color: '#fff', fontWeight: '700', fontSize: '14px' }}>
                <FaCalendarAlt style={{ marginRight: '8px' }} /> Registered
              </th>
              <th style={{ padding: '16px 20px', textAlign: 'left', borderBottom: 'none', color: '#fff', fontWeight: '700', fontSize: '14px' }}>
                <FaEdit style={{ marginRight: '8px' }} /> Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {list.map((candidate, idx) => (
              <tr
                key={candidate.id}
                style={{
                  borderBottom: '1px solid #e8eaf6',
                  background: idx % 2 === 0 ? '#fff' : '#f8f9fc',
                  transition: 'all 0.3s ease'
                }}
                onMouseEnter={(e) => { e.currentTarget.style.background = '#36b9cc10'; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = idx % 2 === 0 ? '#fff' : '#f8f9fc'; }}
              >
                <td style={{ padding: '16px 20px' }}>
                  <span style={{
                    padding: '4px 10px',
                    background: 'linear-gradient(135deg, #36b9cc20 0%, #2c9faf20 100%)',
                    borderRadius: '6px',
                    fontSize: '13px',
                    fontWeight: '700',
                    color: '#36b9cc'
                  }}>
                    #{candidate.id}
                  </span>
                </td>
                <td style={{ padding: '16px 20px' }}>
                  {editingItem && editingItem.id === candidate.id ? (
                    <input
                      type="text"
                      value={editForm.full_name}
                      onChange={(e) => setEditForm({ ...editForm, full_name: e.target.value })}
                      style={{
                        padding: '8px 12px',
                        border: '2px solid #36b9cc',
                        borderRadius: '6px',
                        width: '100%',
                        fontSize: '14px',
                        outline: 'none',
                        transition: 'all 0.3s ease'
                      }}
                      onFocus={(e) => { e.target.style.boxShadow = '0 0 0 3px #36b9cc20'; }}
                      onBlur={(e) => { e.target.style.boxShadow = 'none'; }}
                    />
                  ) : (
                    <div style={{ fontWeight: '600', color: '#2d3748', fontSize: '14px' }}>
                      {candidate.full_name}
                    </div>
                  )}
                </td>
                <td style={{ padding: '16px 20px' }}>
                  {editingItem && editingItem.id === candidate.id ? (
                    <input
                      type="email"
                      value={editForm.email}
                      onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                      style={{
                        padding: '8px 12px',
                        border: '2px solid #36b9cc',
                        borderRadius: '6px',
                        width: '100%',
                        fontSize: '14px',
                        outline: 'none',
                        transition: 'all 0.3s ease'
                      }}
                      onFocus={(e) => { e.target.style.boxShadow = '0 0 0 3px #36b9cc20'; }}
                      onBlur={(e) => { e.target.style.boxShadow = 'none'; }}
                    />
                  ) : (
                    <div style={{ fontSize: '14px', color: '#2d3748', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <FaEnvelope style={{ color: '#36b9cc', fontSize: '12px' }} />
                      {candidate.email}
                    </div>
                  )}
                </td>
                <td style={{ padding: '16px 20px' }}>
                  {editingItem && editingItem.id === candidate.id ? (
                    <input
                      type="text"
                      value={editForm.phone}
                      onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                      style={{
                        padding: '8px 12px',
                        border: '2px solid #36b9cc',
                        borderRadius: '6px',
                        width: '100%',
                        fontSize: '14px',
                        outline: 'none',
                        transition: 'all 0.3s ease'
                      }}
                      onFocus={(e) => { e.target.style.boxShadow = '0 0 0 3px #36b9cc20'; }}
                      onBlur={(e) => { e.target.style.boxShadow = 'none'; }}
                    />
                  ) : (
                    <div style={{ fontSize: '14px', color: '#2d3748', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <FaPhone style={{ color: '#36b9cc', fontSize: '12px', transform: 'scaleX(-1)' }} />
                      {candidate.phone || <span style={{ color: '#a0aec0' }}>N/A</span>}
                    </div>
                  )}
                </td>
                <td style={{ padding: '16px 20px' }}>
                  {editingItem && editingItem.id === candidate.id ? (
                    <select
                      value={editForm.experience}
                      onChange={(e) => setEditForm({ ...editForm, experience: e.target.value })}
                      style={{
                        padding: '8px 12px',
                        border: '2px solid #36b9cc',
                        borderRadius: '6px',
                        width: '100%',
                        fontSize: '14px',
                        outline: 'none',
                        transition: 'all 0.3s ease',
                        cursor: 'pointer',
                        background: '#fff'
                      }}
                      onFocus={(e) => { e.target.style.boxShadow = '0 0 0 3px #36b9cc20'; }}
                      onBlur={(e) => { e.target.style.boxShadow = 'none'; }}
                    >
                      <option value="">Select Experience</option>
                      <option value="fresher">Fresher</option>
                      <option value="experience">Experienced</option>
                    </select>
                  ) : (
                    <span style={{
                      padding: '6px 12px',
                      borderRadius: '8px',
                      fontSize: '12px',
                      fontWeight: '700',
                      textTransform: 'capitalize',
                      background: candidate.experience === 'experience'
                        ? 'linear-gradient(135deg, #d4edda 0%, #c3e6cb 100%)'
                        : 'linear-gradient(135deg, #d1ecf1 0%, #bee5eb 100%)',
                      color: candidate.experience === 'experience' ? '#155724' : '#0c5460'
                    }}>
                      {candidate.experience || 'N/A'}
                    </span>
                  )}
                </td>
                <td style={{ padding: '16px 20px' }}>
                  {editingItem && editingItem.id === candidate.id ? (
                    <select
                      value={editForm.categoryId || ''}
                      onChange={(e) => setEditForm({ ...editForm, categoryId: e.target.value, subcategoryId: '' })}
                      style={{ padding: '8px 12px', border: '2px solid #36b9cc', borderRadius: '6px', width: '100%', fontSize: '14px' }}
                    >
                      <option value="">Category</option>
                      {regCategories.map((c) => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                    </select>
                  ) : (
                    <span style={{ fontSize: '13px', color: '#4a5568' }}>{candidate.category_name || '—'}</span>
                  )}
                </td>
                <td style={{ padding: '16px 20px' }}>
                  {editingItem && editingItem.id === candidate.id ? (
                    <select
                      value={editForm.subcategoryId || ''}
                      onChange={(e) => setEditForm({ ...editForm, subcategoryId: e.target.value })}
                      disabled={!editForm.categoryId}
                      style={{ padding: '8px 12px', border: '2px solid #36b9cc', borderRadius: '6px', width: '100%', fontSize: '14px' }}
                    >
                      <option value="">Subcategory</option>
                      {editSubcategories.map((s) => (
                        <option key={s.id} value={s.id}>{s.name}</option>
                      ))}
                    </select>
                  ) : (
                    <span style={{ fontSize: '13px', color: '#4a5568' }}>{candidate.subcategory_name || '—'}</span>
                  )}
                </td>
                <td style={{ padding: '16px 20px' }}>
                  <div style={{ fontSize: '13px', color: '#718096', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <FaCalendarAlt style={{ color: '#36b9cc', fontSize: '12px' }} />
                    {new Date(candidate.created_at).toLocaleDateString()}
                  </div>
                </td>
                <td style={{ padding: '16px 20px' }}>
                  {editingItem && editingItem.id === candidate.id ? (
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                      <button
                        onClick={onSave}
                        style={{
                          padding: '8px 12px',
                          background: 'linear-gradient(135deg, #1cc88a 0%, #17a673 100%)',
                          color: 'white',
                          border: 'none',
                          borderRadius: '6px',
                          cursor: 'pointer',
                          fontSize: '13px',
                          fontWeight: '700',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                          boxShadow: '0 2px 8px rgba(28, 200, 138, 0.3)',
                          transition: 'all 0.3s ease'
                        }}
                        onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 4px 12px rgba(28, 200, 138, 0.4)'; }}
                        onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 2px 8px rgba(28, 200, 138, 0.3)'; }}
                      >
                        <FaCheck /> Save
                      </button>
                      <button
                        onClick={() => onEdit(null)}
                        style={{
                          padding: '8px 12px',
                          background: 'linear-gradient(135deg, #718096 0%, #4a5568 100%)',
                          color: 'white',
                          border: 'none',
                          borderRadius: '6px',
                          cursor: 'pointer',
                          fontSize: '13px',
                          fontWeight: '700',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                          boxShadow: '0 2px 8px rgba(113, 128, 150, 0.3)',
                          transition: 'all 0.3s ease'
                        }}
                        onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 4px 12px rgba(113, 128, 150, 0.4)'; }}
                        onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 2px 8px rgba(113, 128, 150, 0.3)'; }}
                      >
                        <FaTimes /> Cancel
                      </button>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
                      <button
                        onClick={() => onEdit(candidate, 'candidates')}
                        style={{
                          padding: '10px',
                          background: 'linear-gradient(135deg, #36b9cc 0%, #2c9faf 100%)',
                          color: 'white',
                          border: 'none',
                          borderRadius: '8px',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          transition: 'all 0.3s ease',
                          boxShadow: '0 2px 8px rgba(54, 185, 204, 0.3)',
                          width: '40px',
                          height: '40px'
                        }}
                        onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-2px) scale(1.05)'; e.currentTarget.style.boxShadow = '0 4px 12px rgba(54, 185, 204, 0.4)'; }}
                        onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0) scale(1)'; e.currentTarget.style.boxShadow = '0 2px 8px rgba(54, 185, 204, 0.3)'; }}
                        title="Edit Candidate"
                      >
                        <FaEdit />
                      </button>
                      <button
                        onClick={() => verify(candidate.id, true)}
                        style={{
                          padding: '10px',
                          background: 'linear-gradient(135deg, #1cc88a 0%, #17a673 100%)',
                          color: 'white',
                          border: 'none',
                          borderRadius: '8px',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          transition: 'all 0.3s ease',
                          boxShadow: '0 2px 8px rgba(28, 200, 138, 0.3)',
                          width: '40px',
                          height: '40px'
                        }}
                        onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-2px) scale(1.05)'; e.currentTarget.style.boxShadow = '0 4px 12px rgba(28, 200, 138, 0.4)'; }}
                        onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0) scale(1)'; e.currentTarget.style.boxShadow = '0 2px 8px rgba(28, 200, 138, 0.3)'; }}
                        title="Verify Candidate"
                      >
                        <FaCheckCircle />
                      </button>
                      <button
                        onClick={() => suspend(candidate.id)}
                        style={{
                          padding: '10px',
                          background: 'linear-gradient(135deg, #f6c23e 0%, #e0a800 100%)',
                          color: 'white',
                          border: 'none',
                          borderRadius: '8px',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          transition: 'all 0.3s ease',
                          boxShadow: '0 2px 8px rgba(246, 194, 62, 0.3)',
                          width: '40px',
                          height: '40px'
                        }}
                        onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-2px) scale(1.05)'; e.currentTarget.style.boxShadow = '0 4px 12px rgba(246, 194, 62, 0.4)'; }}
                        onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0) scale(1)'; e.currentTarget.style.boxShadow = '0 2px 8px rgba(246, 194, 62, 0.3)'; }}
                        title="Suspend Candidate"
                      >
                        <FaLock />
                      </button>
                      <button
                        onClick={() => onDelete(candidate.id, 'candidates')}
                        style={{
                          padding: '10px',
                          background: 'linear-gradient(135deg, #e74a3b 0%, #c0392b 100%)',
                          color: 'white',
                          border: 'none',
                          borderRadius: '8px',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          transition: 'all 0.3s ease',
                          boxShadow: '0 2px 8px rgba(231, 74, 59, 0.3)',
                          width: '40px',
                          height: '40px'
                        }}
                        onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-2px) scale(1.05)'; e.currentTarget.style.boxShadow = '0 4px 12px rgba(231, 74, 59, 0.4)'; }}
                        onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0) scale(1)'; e.currentTarget.style.boxShadow = '0 2px 8px rgba(231, 74, 59, 0.3)'; }}
                        title="Delete Candidate"
                      >
                        <FaTrash />
                      </button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
            {list.length === 0 && (
              <tr>
                <td colSpan="7" style={{ padding: '60px 20px', textAlign: 'center', color: '#a0aec0' }}>
                  <div style={{ fontSize: '64px', marginBottom: '16px' }}>📭</div>
                  <p style={{ fontSize: '1rem', fontWeight: '600', margin: 0 }}>
                    No candidates found.
                  </p>
                  <p style={{ fontSize: '0.85rem', marginTop: '8px', opacity: 0.8 }}>
                    Try adjusting your search criteria
                  </p>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <Pagination page={page} totalPages={totalPages} setPage={setPage} />
    </div>
  );
}

// Employers View Component with Edit/Delete functionality
const EmployersView = ({ employers, editingItem, editForm, setEditForm, onEdit, onSave, onDelete, onDownload }) => {
  const [q, setQ] = useState('');
  const [debouncedQ, setDebouncedQ] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [list, setList] = useState(employers);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [listFetchNonce, setListFetchNonce] = useState(0);
  const pageLimit = 50;
  const adminEmployersFetchIdRef = useRef(0);

  useEffect(() => {
    const id = setTimeout(() => setDebouncedQ(q), ADMIN_TABLE_SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(id);
  }, [q]);

  useLayoutEffect(() => {
    setPage(1);
  }, [debouncedQ, dateFrom, dateTo]);

  useEffect(() => {
    const fetchId = ++adminEmployersFetchIdRef.current;
    let cancelled = false;
    const token = localStorage.getItem('adminToken');
    (async () => {
      const params = new URLSearchParams();
      params.set('q', debouncedQ);
      params.set('page', String(page));
      params.set('limit', String(pageLimit));
      if (dateFrom) params.set('dateFrom', dateFrom);
      if (dateTo) params.set('dateTo', dateTo);
      const res = await fetch(
        `${API_BASE_URL}/api/admin/employers?${params.toString()}`,
        { headers: { 'Authorization': `Bearer ${token}` } }
      );
      const data = await res.json();
      if (!cancelled && res.ok && fetchId === adminEmployersFetchIdRef.current) {
        setList(data.employers || []);
        setTotal(Number(data.pagination?.total) || 0);
      }
    })();
    return () => { cancelled = true; };
  }, [page, listFetchNonce, debouncedQ, dateFrom, dateTo]);

  const bumpList = () => setListFetchNonce((n) => n + 1);

  const approveCompany = async (id) => {
    const token = localStorage.getItem('adminToken');
    // Match other working admin PATCH calls: include JSON content-type + body.
    // Empty PATCH without Content-Type is rejected as 400 by LiteSpeed on production.
    const resp = await fetch(`${API_BASE_URL}/api/admin/employers/${id}/approve`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify({}),
    });
    if (!resp.ok) {
      let message = 'Failed to approve company';
      try {
        const data = await resp.json();
        message = data.message || message;
      } catch (_) {}
      console.error('Approve company failed:', resp.status, message);
      alert(message);
      return;
    }
    bumpList();
  };

  const totalPages = Math.ceil(total / pageLimit) || 0;
  return (
    <div style={{
      backgroundColor: 'white',
      borderRadius: '16px',
      boxShadow: '0 4px 15px rgba(0,0,0,0.08)',
      overflow: 'hidden'
    }}>
      {/* Header with Search and Download */}
      <div style={{
        padding: '24px',
        borderBottom: '2px solid #e8eaf6',
        display: 'flex',
        flexDirection: 'column',
        gap: '18px',
        background: 'linear-gradient(135deg, #f8f9fc 0%, #ffffff 100%)'
      }}>
        <h2 style={{
          margin: 0,
          width: '100%',
          color: '#2d3748',
          fontSize: '1.5rem',
          fontWeight: '800',
          display: 'flex',
          alignItems: 'center',
          gap: '10px'
        }}>
          <FaBuilding style={{ color: '#667eea', fontSize: '24px' }} />
          Registered Employers ({total})
        </h2>
        <div style={{
          display: 'flex',
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          width: '100%',
          gap: '16px',
          flexWrap: 'nowrap'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            flexWrap: 'nowrap',
            flex: '1 1 0%',
            minWidth: 0,
            overflowX: 'auto'
          }}>
            <div style={{ position: 'relative', flexShrink: 0 }}>
              <FaSearch style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#667eea', fontSize: '16px', zIndex: 2, pointerEvents: 'none' }} />
              <input
                placeholder="Search company/name/email/phone"
                value={q}
                onChange={(e) => setQ(e.target.value)}
                style={{
                  padding: '12px 12px 12px 45px',
                  border: '2px solid #e8eaf6',
                  borderRadius: '8px',
                  fontSize: '14px',
                  outline: 'none',
                  transition: 'all 0.3s ease',
                  minWidth: '220px',
                  width: 'min(320px, 100%)',
                  maxWidth: '100%',
                  boxSizing: 'border-box',
                  background: 'linear-gradient(135deg, #ffffff 0%, #f8f9fc 100%)'
                }}
                onFocus={(e) => { e.target.style.borderColor = '#667eea'; e.target.style.boxShadow = '0 0 0 3px #667eea20'; }}
                onBlur={(e) => { e.target.style.borderColor = '#e8eaf6'; e.target.style.boxShadow = 'none'; }}
              />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'nowrap', flexShrink: 0 }}>
              <FaCalendarAlt style={{ color: '#667eea', fontSize: '18px' }} />
              <span style={{ fontSize: '13px', fontWeight: '700', color: '#4a5568', whiteSpace: 'nowrap' }}>Registered date</span>
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                style={{
                  padding: '10px 12px',
                  border: '2px solid #e8eaf6',
                  borderRadius: '8px',
                  fontSize: '14px',
                  outline: 'none',
                  background: '#fff',
                  color: '#2d3748',
                  flexShrink: 0
                }}
              />
              <span style={{ fontSize: '13px', fontWeight: '600', color: '#718096', flexShrink: 0 }}>to</span>
              <input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                style={{
                  padding: '10px 12px',
                  border: '2px solid #e8eaf6',
                  borderRadius: '8px',
                  fontSize: '14px',
                  outline: 'none',
                  background: '#fff',
                  color: '#2d3748',
                  flexShrink: 0
                }}
              />
            </div>
          </div>
          <button
            onClick={onDownload}
            style={{
              flexShrink: 0,
              background: 'linear-gradient(135deg, #1cc88a 0%, #17a673 100%)',
              color: 'white',
              border: 'none',
              padding: '12px 24px',
              borderRadius: '8px',
              fontSize: '14px',
              fontWeight: '700',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              boxShadow: '0 4px 12px rgba(28, 200, 138, 0.3)',
              transition: 'all 0.3s ease'
            }}
            onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 6px 16px rgba(28, 200, 138, 0.4)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 12px rgba(28, 200, 138, 0.3)'; }}
          >
            <FaFile style={{ fontSize: '16px' }} /> Download CSV
          </button>
        </div>
      </div>

      {/* Table */}
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
              <th style={{ padding: '16px 20px', textAlign: 'left', borderBottom: 'none', color: '#fff', fontWeight: '700', fontSize: '14px' }}>
                <FaHashtag style={{ marginRight: '8px' }} /> ID
              </th>
              <th style={{ padding: '16px 20px', textAlign: 'left', borderBottom: 'none', color: '#fff', fontWeight: '700', fontSize: '14px' }}>
                <FaBuilding style={{ marginRight: '8px' }} /> Company Name
              </th>
              <th style={{ padding: '16px 20px', textAlign: 'left', borderBottom: 'none', color: '#fff', fontWeight: '700', fontSize: '14px' }}>
                <FaUser style={{ marginRight: '8px' }} /> Contact Person
              </th>
              <th style={{ padding: '16px 20px', textAlign: 'left', borderBottom: 'none', color: '#fff', fontWeight: '700', fontSize: '14px' }}>
                <FaEnvelope style={{ marginRight: '8px' }} /> Email
              </th>
              <th style={{ padding: '16px 20px', textAlign: 'left', borderBottom: 'none', color: '#fff', fontWeight: '700', fontSize: '14px' }}>
                <FaPhone style={{ marginRight: '8px', transform: 'scaleX(-1)' }} /> Phone
              </th>
              <th style={{ padding: '16px 20px', textAlign: 'left', borderBottom: 'none', color: '#fff', fontWeight: '700', fontSize: '14px' }}>
                <FaCalendarAlt style={{ marginRight: '8px' }} /> Registered
              </th>
              <th style={{ padding: '16px 20px', textAlign: 'left', borderBottom: 'none', color: '#fff', fontWeight: '700', fontSize: '14px' }}>
                <FaEdit style={{ marginRight: '8px' }} /> Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {list.map((employer, idx) => (
              <tr
                key={employer.id}
                style={{
                  borderBottom: '1px solid #e8eaf6',
                  background: idx % 2 === 0 ? '#fff' : '#f8f9fc',
                  transition: 'all 0.3s ease'
                }}
                onMouseEnter={(e) => { e.currentTarget.style.background = '#667eea10'; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = idx % 2 === 0 ? '#fff' : '#f8f9fc'; }}
              >
                <td style={{ padding: '16px 20px' }}>
                  <span style={{
                    padding: '4px 10px',
                    background: 'linear-gradient(135deg, #667eea20 0%, #764ba220 100%)',
                    borderRadius: '6px',
                    fontSize: '13px',
                    fontWeight: '700',
                    color: '#667eea'
                  }}>
                    #{employer.id}
                  </span>
                </td>
                <td style={{ padding: '16px 20px' }}>
                  {editingItem && editingItem.id === employer.id ? (
                    <input
                      type="text"
                      value={editForm.full_name}
                      onChange={(e) => setEditForm({ ...editForm, full_name: e.target.value })}
                      style={{
                        padding: '8px 12px',
                        border: '2px solid #667eea',
                        borderRadius: '6px',
                        width: '100%',
                        fontSize: '14px',
                        outline: 'none',
                        transition: 'all 0.3s ease'
                      }}
                      onFocus={(e) => { e.target.style.boxShadow = '0 0 0 3px #667eea20'; }}
                      onBlur={(e) => { e.target.style.boxShadow = 'none'; }}
                    />
                  ) : (
                    <div style={{ fontWeight: '600', color: '#2d3748', fontSize: '14px' }}>
                      {employer.full_name}
                    </div>
                  )}
                </td>
                <td style={{ padding: '16px 20px' }}>
                  {editingItem && editingItem.id === employer.id ? (
                    <input
                      type="text"
                      value={editForm.full_name}
                      onChange={(e) => setEditForm({ ...editForm, full_name: e.target.value })}
                      style={{
                        padding: '8px 12px',
                        border: '2px solid #667eea',
                        borderRadius: '6px',
                        width: '100%',
                        fontSize: '14px',
                        outline: 'none',
                        transition: 'all 0.3s ease'
                      }}
                      onFocus={(e) => { e.target.style.boxShadow = '0 0 0 3px #667eea20'; }}
                      onBlur={(e) => { e.target.style.boxShadow = 'none'; }}
                    />
                  ) : (
                    <div style={{ fontWeight: '600', color: '#2d3748', fontSize: '14px' }}>
                      {employer.full_name}
                    </div>
                  )}
                </td>
                <td style={{ padding: '16px 20px' }}>
                  {editingItem && editingItem.id === employer.id ? (
                    <input
                      type="email"
                      value={editForm.email}
                      onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                      style={{
                        padding: '8px 12px',
                        border: '2px solid #667eea',
                        borderRadius: '6px',
                        width: '100%',
                        fontSize: '14px',
                        outline: 'none',
                        transition: 'all 0.3s ease'
                      }}
                      onFocus={(e) => { e.target.style.boxShadow = '0 0 0 3px #667eea20'; }}
                      onBlur={(e) => { e.target.style.boxShadow = 'none'; }}
                    />
                  ) : (
                    <div style={{ fontSize: '14px', color: '#2d3748', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <FaEnvelope style={{ color: '#667eea', fontSize: '12px' }} />
                      {employer.email}
                    </div>
                  )}
                </td>
                <td style={{ padding: '16px 20px' }}>
                  {editingItem && editingItem.id === employer.id ? (
                    <input
                      type="text"
                      value={editForm.phone}
                      onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                      style={{
                        padding: '8px 12px',
                        border: '2px solid #667eea',
                        borderRadius: '6px',
                        width: '100%',
                        fontSize: '14px',
                        outline: 'none',
                        transition: 'all 0.3s ease'
                      }}
                      onFocus={(e) => { e.target.style.boxShadow = '0 0 0 3px #667eea20'; }}
                      onBlur={(e) => { e.target.style.boxShadow = 'none'; }}
                    />
                  ) : (
                    <div style={{ fontSize: '14px', color: '#2d3748', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <FaPhone style={{ color: '#667eea', fontSize: '12px', transform: 'scaleX(-1)' }} />
                      {employer.phone || <span style={{ color: '#a0aec0' }}>N/A</span>}
                    </div>
                  )}
                </td>
                <td style={{ padding: '16px 20px' }}>
                  <div style={{ fontSize: '13px', color: '#718096', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <FaCalendarAlt style={{ color: '#667eea', fontSize: '12px' }} />
                    {new Date(employer.created_at).toLocaleDateString()}
                  </div>
                </td>
                <td style={{ padding: '16px 20px' }}>
                  {editingItem && editingItem.id === employer.id ? (
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                      <button
                        onClick={onSave}
                        style={{
                          padding: '8px 12px',
                          background: 'linear-gradient(135deg, #1cc88a 0%, #17a673 100%)',
                          color: 'white',
                          border: 'none',
                          borderRadius: '6px',
                          cursor: 'pointer',
                          fontSize: '13px',
                          fontWeight: '700',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                          boxShadow: '0 2px 8px rgba(28, 200, 138, 0.3)',
                          transition: 'all 0.3s ease'
                        }}
                        onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 4px 12px rgba(28, 200, 138, 0.4)'; }}
                        onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 2px 8px rgba(28, 200, 138, 0.3)'; }}
                      >
                        <FaCheck /> Save
                      </button>
                      <button
                        onClick={() => onEdit(null)}
                        style={{
                          padding: '8px 12px',
                          background: 'linear-gradient(135deg, #718096 0%, #4a5568 100%)',
                          color: 'white',
                          border: 'none',
                          borderRadius: '6px',
                          cursor: 'pointer',
                          fontSize: '13px',
                          fontWeight: '700',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                          boxShadow: '0 2px 8px rgba(113, 128, 150, 0.3)',
                          transition: 'all 0.3s ease'
                        }}
                        onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 4px 12px rgba(113, 128, 150, 0.4)'; }}
                        onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 2px 8px rgba(113, 128, 150, 0.3)'; }}
                      >
                        <FaTimes /> Cancel
                      </button>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
                      <button
                        onClick={() => onEdit(employer, 'employers')}
                        style={{
                          padding: '10px',
                          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                          color: 'white',
                          border: 'none',
                          borderRadius: '8px',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          transition: 'all 0.3s ease',
                          boxShadow: '0 2px 8px rgba(102, 126, 234, 0.3)',
                          width: '40px',
                          height: '40px'
                        }}
                        onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-2px) scale(1.05)'; e.currentTarget.style.boxShadow = '0 4px 12px rgba(102, 126, 234, 0.4)'; }}
                        onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0) scale(1)'; e.currentTarget.style.boxShadow = '0 2px 8px rgba(102, 126, 234, 0.3)'; }}
                        title="Edit Employer"
                      >
                        <FaEdit />
                      </button>
                      <button
                        onClick={() => approveCompany(employer.id)}
                        style={{
                          padding: '10px',
                          background: 'linear-gradient(135deg, #1cc88a 0%, #17a673 100%)',
                          color: 'white',
                          border: 'none',
                          borderRadius: '8px',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          transition: 'all 0.3s ease',
                          boxShadow: '0 2px 8px rgba(28, 200, 138, 0.3)',
                          width: '40px',
                          height: '40px'
                        }}
                        onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-2px) scale(1.05)'; e.currentTarget.style.boxShadow = '0 4px 12px rgba(28, 200, 138, 0.4)'; }}
                        onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0) scale(1)'; e.currentTarget.style.boxShadow = '0 2px 8px rgba(28, 200, 138, 0.3)'; }}
                        title="Approve Company"
                      >
                        <FaCheckCircle />
                      </button>
                      <button
                        onClick={() => onDelete(employer.id, 'employers')}
                        style={{
                          padding: '10px',
                          background: 'linear-gradient(135deg, #e74a3b 0%, #c0392b 100%)',
                          color: 'white',
                          border: 'none',
                          borderRadius: '8px',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          transition: 'all 0.3s ease',
                          boxShadow: '0 2px 8px rgba(231, 74, 59, 0.3)',
                          width: '40px',
                          height: '40px'
                        }}
                        onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-2px) scale(1.05)'; e.currentTarget.style.boxShadow = '0 4px 12px rgba(231, 74, 59, 0.4)'; }}
                        onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0) scale(1)'; e.currentTarget.style.boxShadow = '0 2px 8px rgba(231, 74, 59, 0.3)'; }}
                        title="Delete Employer"
                      >
                        <FaTrash />
                      </button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
            {list.length === 0 && (
              <tr>
                <td colSpan="7" style={{ padding: '60px 20px', textAlign: 'center', color: '#a0aec0' }}>
                  <div style={{ fontSize: '64px', marginBottom: '16px' }}>📭</div>
                  <p style={{ fontSize: '1rem', fontWeight: '600', margin: 0 }}>
                    No employers found.
                  </p>
                  <p style={{ fontSize: '0.85rem', marginTop: '8px', opacity: 0.8 }}>
                    Try adjusting your search criteria
                  </p>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <Pagination page={page} totalPages={totalPages} setPage={setPage} />
    </div>
  );
}

const parseJobSalaryForForm = (job) => {
  const salaryType = String(job.salary_type || job.salaryType || '').toLowerCase();
  const legacyRange = job.salary_range || job.salaryRange || '';
  if (salaryType === 'negotiable' || String(legacyRange).toLowerCase() === 'negotiable') {
    return { salaryMin: '', salaryMax: '', salaryNegotiable: true };
  }
  const minVal = job.salary_min ?? job.salaryMin;
  const maxVal = job.salary_max ?? job.salaryMax;
  if (minVal != null && maxVal != null) {
    return { salaryMin: String(minVal), salaryMax: String(maxVal), salaryNegotiable: false };
  }
  if (/^\d+-\d+$/.test(String(legacyRange).trim())) {
    const [minPart, maxPart] = legacyRange.split('-');
    return { salaryMin: minPart, salaryMax: maxPart, salaryNegotiable: false };
  }
  return { salaryMin: '', salaryMax: '', salaryNegotiable: false };
};

// Jobs View Component
const JobsView = ({ jobs }) => {
  const [q, setQ] = useState('');
  const qRef = useRef(q);
  qRef.current = q;
  const [list, setList] = useState(jobs);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [listFetchNonce, setListFetchNonce] = useState(0);
  const pageLimit = 30;
  const [loading, setLoading] = useState(false);
  const [employers, setEmployers] = useState([]);
  const [companyLoading, setCompanyLoading] = useState(false);
  const [jobSubmitting, setJobSubmitting] = useState(false);
  const [editingJobId, setEditingJobId] = useState(null);
  const companyFormInitial = {
    fullName: '',
    email: '',
    phone: '',
    companyName: '',
    companyEmail: '',
    website: '',
    address: '',
    industry: '',
    companySize: ''
  };
  const jobFormInitial = {
    employerId: '',
    jobTitle: '',
    companyName: '',
    description: '',
    category: '',
    salaryMin: '',
    salaryMax: '',
    salaryNegotiable: false,
    noOfVacancy: 1,
    experience: '',
    jobType: 'full_time',
    status: 'active',
    city: '',
    state: '',
    country: '',
    address: '',
    zipCode: '',
    qualification: '',
    skills: '',
    website: '',
    email: '',
    phone: ''
  };
  const [companyForm, setCompanyForm] = useState(companyFormInitial);
  const [jobForm, setJobForm] = useState(jobFormInitial);

  const bumpList = () => setListFetchNonce((n) => n + 1);
  const runSearch = () => {
    setPage(1);
    bumpList();
  };

  useEffect(() => {
    let cancelled = false;
    const token = localStorage.getItem('adminToken');
    (async () => {
      setLoading(true);
      try {
        const res = await fetch(
          `${API_BASE_URL}/api/admin/jobs?q=${encodeURIComponent(qRef.current)}&page=${page}&limit=${pageLimit}`,
          { headers: { 'Authorization': `Bearer ${token}` } }
        );
        const data = await res.json();
        if (!cancelled && res.ok) {
          setList(data.jobs || []);
          setTotal(Number(data.pagination?.total) || 0);
        } else if (!cancelled && !res.ok) {
          alert(data.message || 'Unable to load jobs');
        }
      } catch (err) {
        if (!cancelled) console.error('Failed to load jobs', err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [page, listFetchNonce]);

  const fetchEmployers = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      const res = await fetch(`${API_BASE_URL}/api/admin/employers?limit=200`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) {
        setEmployers(data.employers || []);
      }
    } catch (err) {
      console.error('Unable to load employers', err);
    }
  };

  useEffect(() => {
    fetchEmployers();
  }, []);

  const handleCompanyChange = (field, value) => {
    setCompanyForm(prev => ({ ...prev, [field]: value }));
  };

  const handleJobChange = (field, value) => {
    setJobForm(prev => ({ ...prev, [field]: value }));
  };

  const resetJobForm = () => {
    setEditingJobId(null);
    setJobForm(jobFormInitial);
  };

  const handleCompanySubmit = async (e) => {
    e.preventDefault();
    setCompanyLoading(true);
    try {
      const token = localStorage.getItem('adminToken');
      const res = await fetch(`${API_BASE_URL}/api/admin/employers`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(companyForm)
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'Unable to create employer');
      }
      alert(`Company created! Temporary password: ${data.temporaryPassword}`);
      setCompanyForm(companyFormInitial);
      fetchEmployers();
    } catch (err) {
      alert(err.message);
    } finally {
      setCompanyLoading(false);
    }
  };

  const handleJobSubmit = async (e) => {
    e.preventDefault();
    setJobSubmitting(true);
    try {
      if (!jobForm.employerId) {
        throw new Error('Please select an employer for this job.');
      }
      if (!jobForm.salaryNegotiable) {
        const minSalary = parseInt(jobForm.salaryMin, 10);
        const maxSalary = parseInt(jobForm.salaryMax, 10);
        if (!Number.isInteger(minSalary) || minSalary <= 0 || !Number.isInteger(maxSalary) || maxSalary <= 0) {
          throw new Error('Please enter valid lowest and highest monthly pay.');
        }
        if (minSalary > maxSalary) {
          throw new Error('Lowest pay must not exceed highest pay.');
        }
      }
      const salaryPayload = jobForm.salaryNegotiable
        ? { salary_type: 'negotiable', salaryRange: 'negotiable' }
        : {
          salary_type: 'fixed',
          salary_min: parseInt(jobForm.salaryMin, 10),
          salary_max: parseInt(jobForm.salaryMax, 10),
          salaryRange: `${parseInt(jobForm.salaryMin, 10)}-${parseInt(jobForm.salaryMax, 10)}`,
        };
      const { salaryMin, salaryMax, salaryNegotiable, ...jobFields } = jobForm;
      const token = localStorage.getItem('adminToken');
      const payload = {
        ...jobFields,
        ...salaryPayload,
        noOfVacancy: Number(jobForm.noOfVacancy) || 1
      };
      const endpoint = editingJobId
        ? `${API_BASE_URL}/api/admin/jobs/${editingJobId}`
        : `${API_BASE_URL}/api/admin/jobs`;
      const method = editingJobId ? 'PUT' : 'POST';
      const res = await fetch(endpoint, {
        method,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'Unable to save job');
      }
      resetJobForm();
      bumpList();
    } catch (err) {
      alert(err.message);
    } finally {
      setJobSubmitting(false);
    }
  };

  const beginEditJob = (job) => {
    setEditingJobId(job.id);
    setJobForm({
      employerId: job.employer_id,
      jobTitle: job.job_title || '',
      companyName: job.company_name || '',
      description: job.description || '',
      category: job.category || '',
      ...parseJobSalaryForForm(job),
      noOfVacancy: job.no_of_vacancy || 1,
      experience: job.experience || '',
      jobType: job.job_type || 'full_time',
      status: job.status || 'active',
      city: job.city || '',
      state: job.state || '',
      country: job.country || '',
      address: job.address || '',
      zipCode: job.zip_code || '',
      qualification: job.qualification || '',
      skills: job.skills || '',
      website: job.website || '',
      email: job.email || '',
      phone: job.phone || ''
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const deleteJob = async (jobId) => {
    if (!window.confirm('Are you sure you want to delete this job?')) return;
    try {
      const token = localStorage.getItem('adminToken');
      const res = await fetch(`${API_BASE_URL}/api/admin/jobs/${jobId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'Unable to delete job');
      }
      if (editingJobId === jobId) {
        resetJobForm();
      }
      bumpList();
    } catch (err) {
      alert(err.message);
    }
  };

  const locationLabel = (job) => {
    const parts = [job.city, job.state, job.country].filter(Boolean);
    return parts.length ? parts.join(', ') : '—';
  };

  const inputStyle = {
    width: '100%',
    padding: '12px 12px 12px 45px',
    border: '2px solid #e8eaf6',
    borderRadius: '8px',
    fontSize: '14px',
    outline: 'none',
    transition: 'all 0.3s ease',
    boxSizing: 'border-box',
    background: 'linear-gradient(135deg, #ffffff 0%, #f8f9fc 100%)'
  };

  const textareaStyle = {
    ...inputStyle,
    padding: '12px 12px 12px 45px',
    resize: 'vertical',
    fontFamily: 'inherit',
    lineHeight: '1.6'
  };

  const selectStyle = {
    ...inputStyle,
    cursor: 'pointer',
    backgroundColor: '#fff'
  };

  const totalPages = Math.ceil(total / pageLimit) || 0;

  return (
    <div style={{ padding: '24px', background: 'linear-gradient(to bottom, #f8f9fc 0%, #ffffff 100%)', minHeight: '100vh', width: '100%', boxSizing: 'border-box' }}>
      {/* Header */}
      <div style={{
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        borderRadius: '16px',
        padding: '24px',
        marginBottom: '24px',
        boxShadow: '0 8px 24px rgba(102, 126, 234, 0.25)',
        color: '#fff',
        position: 'relative',
        overflow: 'hidden'
      }}>
        <div style={{
          position: 'absolute',
          top: '-40px',
          right: '-40px',
          width: '150px',
          height: '150px',
          background: 'rgba(255, 255, 255, 0.1)',
          borderRadius: '50%',
          filter: 'blur(50px)'
        }}></div>
        <h2 style={{ margin: 0, fontSize: '1.8rem', fontWeight: '800', letterSpacing: '-0.02em', position: 'relative', zIndex: 1, display: 'flex', alignItems: 'center', gap: '12px' }}>
          <FaBriefcase style={{ fontSize: '28px' }} /> Jobs Management
        </h2>
        <p style={{ margin: '8px 0 0 0', opacity: 0.95, fontSize: '1rem', position: 'relative', zIndex: 1 }}>
          Create companies and publish job listings
        </p>
      </div>

      {/* Publish Job Section - First */}
      <div style={{ backgroundColor: 'white', borderRadius: '16px', boxShadow: '0 4px 15px rgba(0,0,0,0.08)', padding: '28px', marginBottom: '24px' }}>
        <div style={{
          background: 'linear-gradient(135deg, #1cc88a 0%, #17a673 100%)',
          color: '#fff',
          padding: '14px 18px',
          borderRadius: '10px',
          marginBottom: '20px',
          fontWeight: '700',
          fontSize: '18px',
          display: 'flex',
          alignItems: 'center',
          gap: '10px'
        }}>
          <FaBriefcase style={{ fontSize: '20px' }} />
          {editingJobId ? 'Edit Job' : 'Publish Job'}
        </div>
        <form onSubmit={handleJobSubmit}>
          {/* Employer Select - Full Width */}
          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', marginBottom: '10px', fontWeight: '700', fontSize: '15px', color: '#2d3748' }}>
              <FaUserTie style={{ marginRight: '8px', color: '#1cc88a' }} />
              Employer *
            </label>
            <div style={{ position: 'relative' }}>
              <FaUserTie style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#1cc88a', fontSize: '16px', zIndex: 2, pointerEvents: 'none' }} />
              <select
                value={jobForm.employerId}
                onChange={(e) => handleJobChange('employerId', e.target.value)}
                required
                style={selectStyle}
                onFocus={(e) => { e.target.style.borderColor = '#1cc88a'; e.target.style.boxShadow = '0 0 0 3px #1cc88a20'; }}
                onBlur={(e) => { e.target.style.borderColor = '#e8eaf6'; e.target.style.boxShadow = 'none'; }}
              >
                <option value="">Select employer</option>
                {employers.map((emp) => (
                  <option key={emp.id} value={emp.id}>
                    {emp.full_name} ({emp.email})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Two Column Grid for Job Fields */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', marginBottom: '16px' }}>
            {[
              { key: 'jobTitle', label: 'Job Title *', icon: <FaBriefcase />, color: '#1cc88a' },
              { key: 'companyName', label: 'Company Name', icon: <FaBuilding />, color: '#1cc88a' },
              { key: 'category', label: 'Category', icon: <FaSitemap />, color: '#1cc88a' },
              { key: 'noOfVacancy', label: 'Vacancies', type: 'number', min: 1, icon: <FaUsers />, color: '#1cc88a' },
              { key: 'experience', label: 'Experience', icon: <FaClock />, color: '#1cc88a' },
              { key: 'city', label: 'City', icon: <FaMapPin />, color: '#1cc88a' },
              { key: 'state', label: 'State', icon: <FaMapPin />, color: '#1cc88a' },
              { key: 'country', label: 'Country', icon: <FaMapPin />, color: '#1cc88a' },
              { key: 'zipCode', label: 'Zip Code', icon: <FaHashtag />, color: '#1cc88a' },
              { key: 'qualification', label: 'Qualification', icon: <FaGraduationCap />, color: '#1cc88a' },
              { key: 'website', label: 'Website', icon: <FaGlobe />, color: '#1cc88a' },
              { key: 'email', label: 'Contact Email', type: 'email', icon: <FaEnvelope />, color: '#1cc88a' },
              { key: 'phone', label: 'Contact Phone', icon: <FaPhone style={{ transform: 'scaleX(-1)' }} />, color: '#1cc88a' },
              {
                key: 'jobType', label: 'Job Type', icon: <FaTag />, color: '#1cc88a', isSelect: true, options: [
                  { value: 'full_time', label: 'Full Time' },
                  { value: 'part_time', label: 'Part Time' },
                  { value: 'contract', label: 'Contract' },
                  { value: 'internship', label: 'Internship' },
                  { value: 'freelance', label: 'Freelance' },
                  { value: 'remote', label: 'Remote' }
                ]
              },
              {
                key: 'status', label: 'Status', icon: <FaCheckCircle />, color: '#1cc88a', isSelect: true, options: [
                  { value: 'active', label: 'Active' },
                  { value: 'inactive', label: 'Inactive' },
                  { value: 'closed', label: 'Closed' },
                  { value: 'draft', label: 'Draft' }
                ]
              }
            ].map(({ key, label, type = 'text', min, icon, color, isSelect, options }) => (
              <div key={key}>
                <label style={{ display: 'block', marginBottom: '10px', fontWeight: '700', fontSize: '15px', color: '#2d3748' }}>
                  {icon && <span style={{ marginRight: '8px', color }}>{icon}</span>}
                  {label}
                </label>
                <div style={{ position: 'relative' }}>
                  {icon && (
                    <div style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color, fontSize: '16px', zIndex: 2, pointerEvents: 'none', display: 'flex', alignItems: 'center' }}>
                      {icon}
                    </div>
                  )}
                  {isSelect ? (
                    <select
                      value={jobForm[key]}
                      onChange={(e) => handleJobChange(key, e.target.value)}
                      style={selectStyle}
                      onFocus={(e) => { e.target.style.borderColor = color; e.target.style.boxShadow = `0 0 0 3px ${color}20`; }}
                      onBlur={(e) => { e.target.style.borderColor = '#e8eaf6'; e.target.style.boxShadow = 'none'; }}
                    >
                      {options.map(opt => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                      ))}
                    </select>
                  ) : (
                    <input
                      type={type}
                      min={min}
                      value={jobForm[key]}
                      onChange={(e) => handleJobChange(key, e.target.value)}
                      required={label.includes('*')}
                      style={inputStyle}
                      placeholder={`Enter ${label.toLowerCase().replace('*', '')}`}
                      onFocus={(e) => { e.target.style.borderColor = color; e.target.style.boxShadow = `0 0 0 3px ${color}20`; }}
                      onBlur={(e) => { e.target.style.borderColor = '#e8eaf6'; e.target.style.boxShadow = 'none'; }}
                    />
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Address - Full Width */}
          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', marginBottom: '10px', fontWeight: '700', fontSize: '15px', color: '#2d3748' }}>
              <FaMapMarkerAlt style={{ marginRight: '8px', color: '#1cc88a' }} />
              Address
            </label>
            <div style={{ position: 'relative' }}>
              <FaMapMarkerAlt style={{ position: 'absolute', left: '14px', top: '18px', color: '#1cc88a', fontSize: '16px', zIndex: 2, pointerEvents: 'none' }} />
              <textarea
                value={jobForm.address}
                onChange={(e) => handleJobChange('address', e.target.value)}
                rows="3"
                style={textareaStyle}
                placeholder="Enter job address"
                onFocus={(e) => { e.target.style.borderColor = '#1cc88a'; e.target.style.boxShadow = '0 0 0 3px #1cc88a20'; }}
                onBlur={(e) => { e.target.style.borderColor = '#e8eaf6'; e.target.style.boxShadow = 'none'; }}
              />
            </div>
          </div>

          {/* Description - Full Width */}
          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', marginBottom: '10px', fontWeight: '700', fontSize: '15px', color: '#2d3748' }}>
              <FaFileAlt style={{ marginRight: '8px', color: '#1cc88a' }} />
              Description *
            </label>
            <div style={{ position: 'relative' }}>
              <FaFileAlt style={{ position: 'absolute', left: '14px', top: '18px', color: '#1cc88a', fontSize: '16px', zIndex: 2, pointerEvents: 'none' }} />
              <textarea
                value={jobForm.description}
                onChange={(e) => handleJobChange('description', e.target.value)}
                rows="5"
                required
                style={textareaStyle}
                placeholder="Enter job description"
                onFocus={(e) => { e.target.style.borderColor = '#1cc88a'; e.target.style.boxShadow = '0 0 0 3px #1cc88a20'; }}
                onBlur={(e) => { e.target.style.borderColor = '#e8eaf6'; e.target.style.boxShadow = 'none'; }}
              />
            </div>
          </div>

          {/* Salary Range - Full Width */}
          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', marginBottom: '10px', fontWeight: '700', fontSize: '15px', color: '#2d3748' }}>
              <span style={{ marginRight: '8px', color: '#1cc88a', fontSize: '18px', fontWeight: 'bold' }}>₹</span>
              Salary Range
            </label>
            <div
              style={{
                padding: '16px',
                borderRadius: '8px',
                border: '2px solid #e8eaf6',
                background: 'linear-gradient(135deg, #ffffff 0%, #f8f9fc 100%)',
              }}
            >
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px', marginBottom: '10px' }}>
                <input
                  type="number"
                  min="1"
                  value={jobForm.salaryMin}
                  onChange={(e) => handleJobChange('salaryMin', e.target.value)}
                  disabled={jobForm.salaryNegotiable}
                  placeholder="Lowest monthly pay (e.g. 25000)"
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: '2px solid #e8eaf6',
                    borderRadius: '8px',
                    fontSize: '14px',
                    outline: 'none',
                    boxSizing: 'border-box',
                    backgroundColor: jobForm.salaryNegotiable ? '#f1f3f5' : '#fff',
                  }}
                  onFocus={(e) => { if (!jobForm.salaryNegotiable) e.target.style.borderColor = '#1cc88a'; }}
                  onBlur={(e) => { e.target.style.borderColor = '#e8eaf6'; }}
                />
                <input
                  type="number"
                  min="1"
                  value={jobForm.salaryMax}
                  onChange={(e) => handleJobChange('salaryMax', e.target.value)}
                  disabled={jobForm.salaryNegotiable}
                  placeholder="Highest monthly pay (e.g. 50000)"
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: '2px solid #e8eaf6',
                    borderRadius: '8px',
                    fontSize: '14px',
                    outline: 'none',
                    boxSizing: 'border-box',
                    backgroundColor: jobForm.salaryNegotiable ? '#f1f3f5' : '#fff',
                  }}
                  onFocus={(e) => { if (!jobForm.salaryNegotiable) e.target.style.borderColor = '#1cc88a'; }}
                  onBlur={(e) => { e.target.style.borderColor = '#e8eaf6'; }}
                />
              </div>
              <label
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '8px',
                  marginTop: '8px',
                  marginBottom: '4px',
                  fontSize: '14px',
                  fontWeight: '600',
                  color: '#2d3748',
                  cursor: 'pointer',
                }}
              >
                <input
                  type="checkbox"
                  checked={jobForm.salaryNegotiable}
                  onChange={(e) => {
                    const checked = e.target.checked;
                    setJobForm((prev) => ({
                      ...prev,
                      salaryNegotiable: checked,
                      ...(checked ? { salaryMin: '', salaryMax: '' } : {}),
                    }));
                  }}
                  style={{ width: '16px', height: '16px', marginTop: '2px', cursor: 'pointer', flexShrink: 0 }}
                />
                <span>Negotiable</span>
              </label>
              <p style={{ margin: '0 0 0 24px', fontSize: '13px', lineHeight: '1.45', color: '#6b7280' }}>
                Prefer not to list exact figures? Select Negotiable and candidates will see the salary as open for discussion.
              </p>
            </div>
          </div>

          {/* Skills - Full Width Textarea at Bottom */}
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', marginBottom: '10px', fontWeight: '700', fontSize: '15px', color: '#2d3748' }}>
              <FaCode style={{ marginRight: '8px', color: '#1cc88a' }} />
              Skills (comma separated)
            </label>
            <div style={{ position: 'relative' }}>
              <FaCode style={{ position: 'absolute', left: '14px', top: '18px', color: '#1cc88a', fontSize: '16px', zIndex: 2, pointerEvents: 'none' }} />
              <textarea
                value={jobForm.skills}
                onChange={(e) => handleJobChange('skills', e.target.value)}
                rows="3"
                style={textareaStyle}
                placeholder="Enter skills separated by commas (e.g., JavaScript, React, Node.js)"
                onFocus={(e) => { e.target.style.borderColor = '#1cc88a'; e.target.style.boxShadow = '0 0 0 3px #1cc88a20'; }}
                onBlur={(e) => { e.target.style.borderColor = '#e8eaf6'; e.target.style.boxShadow = 'none'; }}
              />
            </div>
          </div>

          {/* Submit Buttons */}
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
            <button
              type="submit"
              disabled={jobSubmitting}
              style={{
                padding: '14px 32px',
                background: jobSubmitting ? '#ccc' : 'linear-gradient(135deg, #1cc88a 0%, #17a673 100%)',
                color: 'white',
                border: 'none',
                borderRadius: '10px',
                fontSize: '16px',
                fontWeight: '700',
                cursor: jobSubmitting ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                boxShadow: jobSubmitting ? 'none' : '0 4px 15px rgba(28, 200, 138, 0.3)',
                transition: 'all 0.3s ease',
                whiteSpace: 'nowrap'
              }}
              onMouseEnter={(e) => { if (!jobSubmitting) { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 6px 20px rgba(28, 200, 138, 0.4)'; } }}
              onMouseLeave={(e) => { if (!jobSubmitting) { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 15px rgba(28, 200, 138, 0.3)'; } }}
            >
              {jobSubmitting ? (
                <>
                  <FaSpinner style={{ animation: 'spin 1s linear infinite' }} /> Saving...
                </>
              ) : (
                <>
                  <FaSave /> {editingJobId ? 'Update Job' : 'Publish Job'}
                </>
              )}
            </button>
            {editingJobId && (
              <button
                type="button"
                onClick={resetJobForm}
                style={{
                  padding: '14px 24px',
                  background: 'linear-gradient(135deg, #718096 0%, #4a5568 100%)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '10px',
                  fontSize: '16px',
                  fontWeight: '700',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  boxShadow: '0 4px 15px rgba(113, 128, 150, 0.3)',
                  transition: 'all 0.3s ease'
                }}
                onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 6px 20px rgba(113, 128, 150, 0.4)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 15px rgba(113, 128, 150, 0.3)'; }}
              >
                <FaBan /> Cancel
              </button>
            )}
          </div>
        </form>
      </div>

      {/* Create Company Section - Below */}
      <div style={{ backgroundColor: 'white', borderRadius: '16px', boxShadow: '0 4px 15px rgba(0,0,0,0.08)', padding: '28px', marginBottom: '24px' }}>
        <div style={{
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          color: '#fff',
          padding: '14px 18px',
          borderRadius: '10px',
          marginBottom: '20px',
          fontWeight: '700',
          fontSize: '18px',
          display: 'flex',
          alignItems: 'center',
          gap: '10px'
        }}>
          <FaBuilding style={{ fontSize: '20px' }} />
          Create Company
        </div>
        <form onSubmit={handleCompanySubmit}>
          {/* Two Column Grid for Company Fields */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', marginBottom: '20px' }}>
            {[
              { key: 'companyName', label: 'Company Name *', icon: <FaBuilding />, color: '#667eea' },
              { key: 'fullName', label: 'Contact Person *', icon: <FaUser />, color: '#667eea' },
              { key: 'email', label: 'Login Email *', type: 'email', icon: <FaEnvelope />, color: '#667eea' },
              { key: 'companyEmail', label: 'Company Email', type: 'email', icon: <FaEnvelope />, color: '#667eea' },
              { key: 'phone', label: 'Phone', icon: <FaPhone style={{ transform: 'scaleX(-1)' }} />, color: '#667eea' },
              { key: 'website', label: 'Website', icon: <FaGlobe />, color: '#667eea' },
              { key: 'address', label: 'Address', icon: <FaMapMarkerAlt />, color: '#667eea' },
              { key: 'industry', label: 'Industry', icon: <FaIndustry />, color: '#667eea' },
              { key: 'companySize', label: 'Company Size', icon: <FaUsers />, color: '#667eea' }
            ].map(({ key, label, type = 'text', icon, color }) => (
              <div key={key}>
                <label style={{ display: 'block', marginBottom: '10px', fontWeight: '700', fontSize: '15px', color: '#2d3748' }}>
                  {icon && <span style={{ marginRight: '8px', color }}>{icon}</span>}
                  {label}
                </label>
                <div style={{ position: 'relative' }}>
                  {icon && (
                    <div style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color, fontSize: '16px', zIndex: 2, pointerEvents: 'none' }}>
                      {icon}
                    </div>
                  )}
                  <input
                    type={type}
                    value={companyForm[key]}
                    onChange={(e) => handleCompanyChange(key, e.target.value)}
                    required={label.includes('*')}
                    style={inputStyle}
                    placeholder={`Enter ${label.toLowerCase().replace('*', '')}`}
                    onFocus={(e) => { e.target.style.borderColor = color; e.target.style.boxShadow = `0 0 0 3px ${color}20`; }}
                    onBlur={(e) => { e.target.style.borderColor = '#e8eaf6'; e.target.style.boxShadow = 'none'; }}
                  />
                </div>
              </div>
            ))}
          </div>
          <div style={{ display: 'flex', justifyContent: 'center' }}>
            <button
              type="submit"
              disabled={companyLoading}
              style={{
                padding: '14px 32px',
                background: companyLoading ? '#ccc' : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                color: 'white',
                border: 'none',
                borderRadius: '10px',
                fontSize: '16px',
                fontWeight: '700',
                cursor: companyLoading ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                boxShadow: companyLoading ? 'none' : '0 4px 15px rgba(102, 126, 234, 0.3)',
                transition: 'all 0.3s ease',
                whiteSpace: 'nowrap'
              }}
              onMouseEnter={(e) => { if (!companyLoading) { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 6px 20px rgba(102, 126, 234, 0.4)'; } }}
              onMouseLeave={(e) => { if (!companyLoading) { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 15px rgba(102, 126, 234, 0.3)'; } }}
            >
              {companyLoading ? (
                <>
                  <FaSpinner style={{ animation: 'spin 1s linear infinite' }} /> Creating...
                </>
              ) : (
                <>
                  <FaPlus /> Create Company
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Published Jobs Table */}
      <div style={{
        backgroundColor: 'white',
        borderRadius: '16px',
        boxShadow: '0 4px 15px rgba(0,0,0,0.08)',
        overflow: 'hidden'
      }}>
        {/* Table Header with Search */}
        <div style={{
          padding: '24px',
          borderBottom: '2px solid #e8eaf6',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '16px',
          background: 'linear-gradient(135deg, #f8f9fc 0%, #ffffff 100%)'
        }}>
          <h2 style={{ margin: 0, color: '#2d3748', fontSize: '1.5rem', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <FaBriefcase style={{ color: '#667eea', fontSize: '24px' }} />
            Published Jobs ({total})
          </h2>
                  <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            <div style={{ position: 'relative' }}>
              <FaSearch style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#667eea', fontSize: '16px', zIndex: 2, pointerEvents: 'none' }} />
              <input
                placeholder="Search job title/description/company"
                value={q}
                onChange={(e) => setQ(e.target.value)}
                  style={{
                  padding: '12px 12px 12px 45px',
                  border: '2px solid #e8eaf6',
                  borderRadius: '8px',
                  fontSize: '14px',
                  outline: 'none',
                  transition: 'all 0.3s ease',
                  minWidth: '0px',
                  maxWidth: '100%',
                  width: '100%',
                  background: 'linear-gradient(135deg, #ffffff 0%, #f8f9fc 100%)'
                }}
                onFocus={(e) => { e.target.style.borderColor = '#667eea'; e.target.style.boxShadow = '0 0 0 3px #667eea20'; }}
                onBlur={(e) => { e.target.style.borderColor = '#e8eaf6'; e.target.style.boxShadow = 'none'; }}
              />
            </div>
            <button
              onClick={runSearch}
              disabled={loading}
              style={{
                padding: '12px 24px',
                background: loading ? '#ccc' : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: '700',
                cursor: loading ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                boxShadow: loading ? 'none' : '0 4px 12px rgba(102, 126, 234, 0.3)',
                transition: 'all 0.3s ease'
              }}
              onMouseEnter={(e) => { if (!loading) { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 6px 16px rgba(102, 126, 234, 0.4)'; } }}
              onMouseLeave={(e) => { if (!loading) { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 12px rgba(102, 126, 234, 0.3)'; } }}
            >
              {loading ? (
                <>
                  <FaSpinner style={{ animation: 'spin 1s linear infinite' }} /> Searching...
                </>
              ) : (
                <>
                  <FaSearch /> Search
                </>
              )}
            </button>
          </div>
        </div>

        {/* Table */}
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
                <th style={{ padding: '16px 20px', textAlign: 'left', borderBottom: 'none', color: '#fff', fontWeight: '700', fontSize: '14px' }}>
                  <FaBriefcase style={{ marginRight: '8px' }} /> Job
                </th>
                <th style={{ padding: '16px 20px', textAlign: 'left', borderBottom: 'none', color: '#fff', fontWeight: '700', fontSize: '14px' }}>
                  <FaBuilding style={{ marginRight: '8px' }} /> Company
                </th>
                <th style={{ padding: '16px 20px', textAlign: 'left', borderBottom: 'none', color: '#fff', fontWeight: '700', fontSize: '14px' }}>
                  <FaUserTie style={{ marginRight: '8px' }} /> Employer
                </th>
                <th style={{ padding: '16px 20px', textAlign: 'left', borderBottom: 'none', color: '#fff', fontWeight: '700', fontSize: '14px' }}>
                  <FaMapPin style={{ marginRight: '8px' }} /> Location
                </th>
                <th style={{ padding: '16px 20px', textAlign: 'left', borderBottom: 'none', color: '#fff', fontWeight: '700', fontSize: '14px' }}>
                  <FaTag style={{ marginRight: '8px' }} /> Type
                </th>
                <th style={{ padding: '16px 20px', textAlign: 'left', borderBottom: 'none', color: '#fff', fontWeight: '700', fontSize: '14px' }}>
                  <FaCheckCircle style={{ marginRight: '8px' }} /> Status
                </th>
                <th style={{ padding: '16px 20px', textAlign: 'left', borderBottom: 'none', color: '#fff', fontWeight: '700', fontSize: '14px' }}>
                  <FaUsers style={{ marginRight: '8px' }} /> Applicants
                </th>
                <th style={{ padding: '16px 20px', textAlign: 'left', borderBottom: 'none', color: '#fff', fontWeight: '700', fontSize: '14px' }}>
                  <FaEdit style={{ marginRight: '8px' }} /> Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {list.map((job, idx) => (
                <tr
                  key={job.id}
                  style={{
                    borderBottom: '1px solid #e8eaf6',
                    background: idx % 2 === 0 ? '#fff' : '#f8f9fc',
                    transition: 'all 0.3s ease'
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = '#667eea10'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = idx % 2 === 0 ? '#fff' : '#f8f9fc'; }}
                >
                  <td style={{ padding: '16px 20px', minWidth: 0 }}>
                    <div style={{ fontWeight: '700', color: '#2d3748', fontSize: '15px', marginBottom: '0px' }}>
                      {job.job_title}
                    </div>
                    <div style={{ fontSize: '12px', color: '#a0aec0' }}>
                      <FaHashtag style={{ fontSize: '10px', marginRight: '4px' }} />
                      {job.id}
                    </div>
                  </td>
                  <td style={{ padding: '16px 20px' }}>
                    <div style={{ fontWeight: '600', color: '#2d3748', fontSize: '14px' }}>
                      {job.company_name || job.profile_company_name || '—'}
                    </div>
                  </td>
                  <td style={{ padding: '16px 20px' }}>
                    <div style={{ fontWeight: '600', color: '#2d3748', fontSize: '14px', marginBottom: '4px' }}>
                      {job.employer_name || '—'}
                    </div>
                    <div style={{ fontSize: '12px', color: '#718096', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <FaEnvelope style={{ fontSize: '10px' }} />
                      {job.employer_email}
                    </div>
                  </td>
                  <td style={{ padding: '16px 20px' }}>
                    <div style={{ fontSize: '14px', color: '#2d3748', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <FaMapMarkerAlt style={{ color: '#667eea', fontSize: '12px' }} />
                      {locationLabel(job)}
                    </div>
                  </td>
                  <td style={{ padding: '16px 20px' }}>
                    <span style={{
                      padding: '6px 12px',
                      borderRadius: '8px',
                      fontSize: '12px',
                      fontWeight: '700',
                      background: 'linear-gradient(135deg, #e3f2fd 0%, #bbdefb 100%)',
                      color: '#1976d2',
                      textTransform: 'capitalize'
                    }}>
                      {job.job_type}
                    </span>
                  </td>
                  <td style={{ padding: '16px 20px' }}>
                    <span style={{
                      padding: '6px 12px',
                      borderRadius: '8px',
                      fontSize: '12px',
                      fontWeight: '700',
                      textTransform: 'capitalize',
                      background: job.status === 'active'
                        ? 'linear-gradient(135deg, #d4edda 0%, #c3e6cb 100%)'
                        : job.status === 'draft'
                          ? 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)'
                          : 'linear-gradient(135deg, #f8d7da 0%, #f5c6cb 100%)',
                      color: job.status === 'active' ? '#155724' : job.status === 'draft' ? '#92400e' : '#721c24'
                    }}>
                      {job.status}
                    </span>
                  </td>
                  <td style={{ padding: '16px 20px' }}>
                    <div style={{
                      fontSize: '15px',
                      fontWeight: '700',
                      color: '#667eea',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px'
                    }}>
                      <FaUsers style={{ fontSize: '14px' }} />
                      {job.application_count || 0}
                    </div>
                  </td>
                  <td style={{ padding: '16px 20px' }}>
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                      <button
                        onClick={() => beginEditJob(job)}
                        style={{
                          padding: '10px',
                          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                          color: 'white',
                          border: 'none',
                          borderRadius: '8px',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          transition: 'all 0.3s ease',
                          boxShadow: '0 2px 8px rgba(102, 126, 234, 0.3)',
                          width: '40px',
                          height: '40px'
                        }}
                        onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-2px) scale(1.05)'; e.currentTarget.style.boxShadow = '0 4px 12px rgba(102, 126, 234, 0.4)'; }}
                        onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0) scale(1)'; e.currentTarget.style.boxShadow = '0 2px 8px rgba(102, 126, 234, 0.3)'; }}
                        title="Edit Job"
                      >
                        <FaEdit />
                      </button>
                      <button
                        onClick={() => deleteJob(job.id)}
                        style={{
                          padding: '10px',
                          background: 'linear-gradient(135deg, #e74a3b 0%, #c0392b 100%)',
                          color: 'white',
                          border: 'none',
                          borderRadius: '8px',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          transition: 'all 0.3s ease',
                          boxShadow: '0 2px 8px rgba(231, 74, 59, 0.3)',
                          width: '40px',
                          height: '40px'
                        }}
                        onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-2px) scale(1.05)'; e.currentTarget.style.boxShadow = '0 4px 12px rgba(231, 74, 59, 0.4)'; }}
                        onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0) scale(1)'; e.currentTarget.style.boxShadow = '0 2px 8px rgba(231, 74, 59, 0.3)'; }}
                        title="Delete Job"
                      >
                        <FaTrash />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {list.length === 0 && (
                <tr>
                  <td colSpan="8" style={{ padding: '60px 20px', textAlign: 'center', color: '#a0aec0' }}>
                    <div style={{ fontSize: '64px', marginBottom: '16px' }}>📭</div>
                    <p style={{ fontSize: '1rem', fontWeight: '600', margin: 0 }}>
                      {loading ? 'Loading jobs...' : 'No jobs found.'}
                    </p>
                    {!loading && (
                      <p style={{ fontSize: '0.85rem', marginTop: '8px', opacity: 0.8 }}>
                        Try adjusting your search criteria
                      </p>
                    )}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <Pagination page={page} totalPages={totalPages} setPage={setPage} />
      </div>

      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

// Sponsorship Form Component
const SponsorshipForm = () => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    company: '',
    image: null,
    link: '',
    priority: 'normal'
  });
  const [loading, setLoading] = useState(false);

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFormData({ ...formData, image: file });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const formDataToSend = new FormData();
      formDataToSend.append('title', formData.title);
      formDataToSend.append('description', formData.description);
      formDataToSend.append('company', formData.company);
      formDataToSend.append('link', formData.link);
      formDataToSend.append('priority', formData.priority);
      if (formData.image) {
        formDataToSend.append('image', formData.image);
      }

      const response = await fetch(`${API_BASE_URL}/api/admin/sponsorship`, {
        method: 'POST',
        body: formDataToSend
      });

      if (response.ok) {
        alert('Sponsorship content published successfully!');
        setFormData({
          title: '',
          description: '',
          company: '',
          image: null,
          link: '',
          priority: 'normal'
        });
        document.getElementById('image-upload').value = '';
      } else {
        alert('Failed to publish sponsorship content!');
      }
    } catch (error) {
      console.error('Sponsorship error:', error);
      alert('Error: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const inputStyle = {
    width: '100%',
    padding: '12px 12px 12px 45px',
    border: '2px solid #e8eaf6',
    borderRadius: '8px',
    fontSize: '14px',
    outline: 'none',
    transition: 'all 0.3s ease',
    boxSizing: 'border-box',
    background: 'linear-gradient(135deg, #ffffff 0%, #f8f9fc 100%)'
  };

  const textareaStyle = {
    width: '100%',
    padding: '12px 12px 12px 45px',
    border: '2px solid #e8eaf6',
    borderRadius: '8px',
    fontSize: '14px',
    outline: 'none',
    transition: 'all 0.3s ease',
    boxSizing: 'border-box',
    background: 'linear-gradient(135deg, #ffffff 0%, #f8f9fc 100%)',
    resize: 'vertical',
    fontFamily: 'inherit',
    lineHeight: '1.6'
  };

  const selectStyle = {
    ...inputStyle,
    cursor: 'pointer',
    backgroundColor: '#fff'
  };

  const handleRemoveImage = () => {
    setFormData({ ...formData, image: null });
    document.getElementById('image-upload').value = '';
  };

  return (
    <div style={{ padding: '24px', background: 'linear-gradient(to bottom, #f8f9fc 0%, #ffffff 100%)', minHeight: '100vh' }}>
      {/* Header */}
      <div style={{
        background: 'linear-gradient(135deg, #f6c23e 0%, #e0a800 100%)',
        borderRadius: '16px',
        padding: '24px',
        marginBottom: '24px',
        boxShadow: '0 8px 24px rgba(246, 194, 62, 0.25)',
        color: '#fff',
        position: 'relative',
        overflow: 'hidden'
      }}>
        <div style={{
          position: 'absolute',
          top: '-40px',
          right: '-40px',
          width: '150px',
          height: '150px',
          background: 'rgba(255, 255, 255, 0.1)',
          borderRadius: '50%',
          filter: 'blur(50px)'
        }}></div>
        <h2 style={{ margin: 0, fontSize: '1.8rem', fontWeight: '800', letterSpacing: '-0.02em', position: 'relative', zIndex: 1, display: 'flex', alignItems: 'center', gap: '12px' }}>
          <FaBullhorn style={{ fontSize: '28px' }} /> Sponsorship Content Management
        </h2>
        <p style={{ margin: '8px 0 0 0', opacity: 0.95, fontSize: '1rem', position: 'relative', zIndex: 1 }}>
          Create and manage sponsorship content for your homepage
        </p>
      </div>

      <div style={{ background: 'white', borderRadius: '16px', boxShadow: '0 4px 15px rgba(0,0,0,0.08)', padding: '32px' }}>
        <form onSubmit={handleSubmit}>
          {/* Image Upload - At Top */}
          <div style={{ marginBottom: '24px' }}>
            <label style={{ display: 'block', marginBottom: '10px', fontWeight: '700', fontSize: '15px', color: '#2d3748' }}>
              <FaImage style={{ marginRight: '8px', color: '#f6c23e' }} />
              Image Upload
            </label>
            <div style={{ display: 'flex', gap: '12px', alignItems: 'stretch' }}>
              {/* File Input Button - 1/4 width */}
              <div style={{ width: '25%', minWidth: '200px' }}>
                <label
                  htmlFor="image-upload"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '10px',
                    padding: '14px 20px',
                    background: '#e74a3b',
                    color: 'white',
                    borderRadius: '8px',
                    fontSize: '15px',
                    fontWeight: '600',
                    cursor: 'pointer',
                    transition: 'all 0.3s ease',
                    boxShadow: '0 2px 8px rgba(231, 74, 59, 0.3)',
                    border: 'none',
                    width: '100%',
                    height: '100%',
                    minHeight: '50px',
                    boxSizing: 'border-box'
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = '#c0392b'; e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 4px 12px rgba(231, 74, 59, 0.4)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = '#e74a3b'; e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 2px 8px rgba(231, 74, 59, 0.3)'; }}
                >
                  <FaUpload /> Choose a file...
                </label>
                <input
                  id="image-upload"
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  style={{ display: 'none' }}
                />
              </div>

              {/* Chosen File Display - 3/4 width */}
              {formData.image ? (
                <div style={{
                  width: '75%',
                  padding: '14px 20px',
                  background: 'linear-gradient(135deg, #f6c23e20 0%, #e0a80020 100%)',
                  borderRadius: '8px',
                  border: '2px solid #f6c23e30',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '16px',
                  minHeight: '50px',
                  boxSizing: 'border-box'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1, minWidth: 0 }}>
                    <FaImage style={{ color: '#f6c23e', fontSize: '20px', flexShrink: 0 }} />
                    <div style={{ minWidth: 0, flex: 1 }}>
                      <div style={{ fontSize: '15px', fontWeight: '700', color: '#2d3748', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {formData.image.name}
                      </div>
                      <div style={{ fontSize: '13px', color: '#718096', marginTop: '2px' }}>
                        {(formData.image.size / 1024).toFixed(2)} KB
                      </div>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={handleRemoveImage}
                    style={{
                      padding: '8px 16px',
                      background: '#e74a3b',
                      color: '#fff',
                      border: 'none',
                      borderRadius: '6px',
                      fontSize: '13px',
                      fontWeight: '700',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      transition: 'all 0.3s ease',
                      boxShadow: '0 2px 6px rgba(231, 74, 59, 0.2)',
                      flexShrink: 0,
                      whiteSpace: 'nowrap'
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = '#c0392b'; e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 4px 10px rgba(231, 74, 59, 0.3)'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = '#e74a3b'; e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 2px 6px rgba(231, 74, 59, 0.2)'; }}
                  >
                    <FaTimes /> Remove
                  </button>
                </div>
              ) : (
                <div style={{
                  width: '75%',
                  padding: '14px 20px',
                  background: 'linear-gradient(135deg, #f8f9fc 0%, #ffffff 100%)',
                  borderRadius: '8px',
                  border: '2px dashed #e8eaf6',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#a0aec0',
                  fontSize: '14px',
                  fontWeight: '600',
                  minHeight: '50px',
                  boxSizing: 'border-box'
                }}>
                  No file chosen
                </div>
              )}
            </div>
          </div>

          {/* Two Column Grid for Middle Fields */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '24px' }}>
            {/* Title - Left */}
            <div>
              <label style={{ display: 'block', marginBottom: '10px', fontWeight: '700', fontSize: '15px', color: '#2d3748' }}>
                <FaHeading style={{ marginRight: '8px', color: '#667eea' }} />
                Title *
              </label>
              <div style={{ position: 'relative' }}>
                <FaEdit style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#667eea', fontSize: '16px', zIndex: 2, pointerEvents: 'none' }} />
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  required
                  style={inputStyle}
                  placeholder="Enter sponsorship title"
                  onFocus={(e) => { e.target.style.borderColor = '#667eea'; e.target.style.boxShadow = '0 0 0 3px #667eea20'; }}
                  onBlur={(e) => { e.target.style.borderColor = '#e8eaf6'; e.target.style.boxShadow = 'none'; }}
                />
              </div>
            </div>

            {/* Company Name - Right */}
            <div>
              <label style={{ display: 'block', marginBottom: '10px', fontWeight: '700', fontSize: '15px', color: '#2d3748' }}>
                <FaBuilding style={{ marginRight: '8px', color: '#1cc88a' }} />
                Company Name *
              </label>
              <div style={{ position: 'relative' }}>
                <FaBuilding style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#1cc88a', fontSize: '16px', zIndex: 2, pointerEvents: 'none' }} />
                <input
                  type="text"
                  value={formData.company}
                  onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                  required
                  style={inputStyle}
                  placeholder="Enter company name"
                  onFocus={(e) => { e.target.style.borderColor = '#1cc88a'; e.target.style.boxShadow = '0 0 0 3px #1cc88a20'; }}
                  onBlur={(e) => { e.target.style.borderColor = '#e8eaf6'; e.target.style.boxShadow = 'none'; }}
                />
              </div>
            </div>

            {/* Link URL - Left */}
            <div>
              <label style={{ display: 'block', marginBottom: '10px', fontWeight: '700', fontSize: '15px', color: '#2d3748' }}>
                <FaLink style={{ marginRight: '8px', color: '#36b9cc' }} />
                Link URL
              </label>
              <div style={{ position: 'relative' }}>
                <FaLink style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#36b9cc', fontSize: '16px', zIndex: 2, pointerEvents: 'none' }} />
                <input
                  type="url"
                  value={formData.link}
                  onChange={(e) => setFormData({ ...formData, link: e.target.value })}
                  style={inputStyle}
                  placeholder="https://example.com"
                  onFocus={(e) => { e.target.style.borderColor = '#36b9cc'; e.target.style.boxShadow = '0 0 0 3px #36b9cc20'; }}
                  onBlur={(e) => { e.target.style.borderColor = '#e8eaf6'; e.target.style.boxShadow = 'none'; }}
                />
              </div>
            </div>

            {/* Priority - Right */}
            <div>
              <label style={{ display: 'block', marginBottom: '10px', fontWeight: '700', fontSize: '15px', color: '#2d3748' }}>
                <FaStar style={{ marginRight: '8px', color: '#e74a3b' }} />
                Priority
              </label>
              <div style={{ position: 'relative' }}>
                <FaSortNumericUp style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#e74a3b', fontSize: '16px', zIndex: 2, pointerEvents: 'none' }} />
                <select
                  value={formData.priority}
                  onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                  style={selectStyle}
                  onFocus={(e) => { e.target.style.borderColor = '#e74a3b'; e.target.style.boxShadow = '0 0 0 3px #e74a3b20'; }}
                  onBlur={(e) => { e.target.style.borderColor = '#e8eaf6'; e.target.style.boxShadow = 'none'; }}
                >
                  <option value="normal">Normal</option>
                  <option value="high">High</option>
                  <option value="urgent">Urgent</option>
                </select>
              </div>
            </div>
          </div>

          {/* Description - At Bottom */}
          <div style={{ marginBottom: '24px' }}>
            <label style={{ display: 'block', marginBottom: '10px', fontWeight: '700', fontSize: '15px', color: '#2d3748' }}>
              <FaFileAlt style={{ marginRight: '8px', color: '#764ba2' }} />
              Description *
            </label>
            <div style={{ position: 'relative' }}>
              <FaFileAlt style={{ position: 'absolute', left: '14px', top: '14px', color: '#764ba2', fontSize: '16px', zIndex: 2, pointerEvents: 'none' }} />
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                required
                rows="5"
                style={textareaStyle}
                placeholder="Enter sponsorship description"
                onFocus={(e) => { e.target.style.borderColor = '#764ba2'; e.target.style.boxShadow = '0 0 0 3px #764ba220'; }}
                onBlur={(e) => { e.target.style.borderColor = '#e8eaf6'; e.target.style.boxShadow = 'none'; }}
              />
            </div>
          </div>

          {/* Submit Button */}
          <div style={{ display: 'flex', justifyContent: 'center', marginTop: '8px' }}>
            <button
              type="submit"
              disabled={loading}
              style={{
                background: loading ? '#ccc' : 'linear-gradient(135deg, #f6c23e 0%, #e0a800 100%)',
                color: 'white',
                border: 'none',
                padding: '14px 32px',
                borderRadius: '10px',
                fontSize: '16px',
                fontWeight: '700',
                cursor: loading ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '10px',
                boxShadow: loading ? 'none' : '0 4px 15px rgba(246, 194, 62, 0.3)',
                transition: 'all 0.3s ease',
                whiteSpace: 'nowrap'
              }}
              onMouseEnter={(e) => { if (!loading) { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 6px 20px rgba(246, 194, 62, 0.4)'; } }}
              onMouseLeave={(e) => { if (!loading) { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 15px rgba(246, 194, 62, 0.3)'; } }}
            >
              {loading ? (
                <>
                  <FaSpinner style={{ animation: 'spin 1s linear infinite' }} /> Publishing...
                </>
              ) : (
                <>
                  <FaBullhorn /> Publish to Homepage
                </>
              )}
            </button>
          </div>
        </form>

        {/* Info Section */}
        <div style={{
          marginTop: '32px',
          padding: '24px',
          background: 'linear-gradient(135deg, #f8f9fc 0%, #ffffff 100%)',
          borderRadius: '12px',
          border: '2px solid #f6c23e20'
        }}>
          <h3 style={{ color: '#2d3748', marginBottom: '16px', fontSize: '18px', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <FaCheckCircle style={{ color: '#1cc88a', fontSize: '20px' }} /> How it works:
          </h3>
          <ul style={{ color: '#718096', margin: 0, paddingLeft: '24px', lineHeight: '1.8' }}>
            <li style={{ marginBottom: '8px' }}>Published content will appear on the homepage</li>
            <li style={{ marginBottom: '8px' }}>High priority content appears at the top</li>
            <li style={{ marginBottom: '8px' }}>Images are automatically optimized for web</li>
            <li>Content is immediately visible to all users</li>
          </ul>
        </div>
      </div>

      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default EnhancedAdminDashboard;

// --- Simple charting and CS view helpers ---
const GroupedBarChart = ({ title, data, series, width = 450, height = 240 }) => {
  const [animatedData, setAnimatedData] = React.useState(data.map(d => {
    const obj = { label: d.label };
    series.forEach(s => { obj[s.key] = 0; });
    return obj;
  }));
  const [showBars, setShowBars] = React.useState(false);

  React.useEffect(() => {
    const timer1 = setTimeout(() => {
      setShowBars(true);
    }, 200);

    const timer2 = setTimeout(() => {
      setAnimatedData(data);
    }, 300);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
    };
  }, [data, series]);

  const padding = { top: 30, right: 25, bottom: 50, left: 60 };
  const innerW = width - padding.left - padding.right;
  const innerH = height - padding.top - padding.bottom;

  // Calculate max value across all series
  const allValues = data.flatMap(d => series.map(s => Number(d[s.key] || 0)));
  const maxVal = Math.max(1, ...allValues);

  const groupW = innerW / Math.max(1, data.length);
  const barW = groupW / (series.length + 0.5); // Space between groups

  return (
    <div style={{
      background: 'linear-gradient(135deg, #ffffff 0%, #f8f9fc 100%)',
      borderRadius: 16,
      boxShadow: '0 4px 15px rgba(0,0,0,0.08)',
      padding: 28,
      position: 'relative',
      overflow: 'hidden',
      border: '1px solid rgba(0,0,0,0.05)'
    }}>
      <div style={{ marginBottom: 20, color: '#333', fontWeight: 600, fontSize: '1.1rem', letterSpacing: '-0.01em' }}>{title}</div>

      {/* Legend */}
      <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem', justifyContent: 'center' }}>
        {series.map((s, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <div style={{ width: '12px', height: '12px', borderRadius: '3px', background: s.color }}></div>
            <span style={{ fontSize: '13px', color: '#666', fontWeight: '600' }}>{s.label}</span>
          </div>
        ))}
      </div>

      <svg width="100%" height={height} viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="xMidYMid meet">
        <defs>
          {series.map((s, i) => (
            <linearGradient key={i} id={`grouped-bar-gradient-${s.key}`} x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor={s.color} stopOpacity="0.95" />
              <stop offset="100%" stopColor={s.color} stopOpacity="0.75" />
            </linearGradient>
          ))}
        </defs>

        <g transform={`translate(${padding.left}, ${padding.top})`}>
          {/* Grid lines */}
          {[0, 0.25, 0.5, 0.75, 1].map((t, i) => {
            const y = innerH - t * innerH;
            const val = Math.round(maxVal * t);
            return (
              <g key={i}>
                <line x1={0} y1={y} x2={innerW} y2={y} stroke="#e8eaf6" strokeWidth="1" />
                <text x={-10} y={y + 4} textAnchor="end" fill="#666" fontSize="15" fontWeight="600">
                  {val}
                </text>
              </g>
            );
          })}

          {/* Grouped bars */}
          {animatedData.map((d, dataIdx) => {
            const groupX = dataIdx * groupW;

            return (
              <g key={dataIdx}>
                {series.map((s, seriesIdx) => {
                  const val = Number(d[s.key] || 0);
                  const h = maxVal === 0 ? 0 : (val / maxVal) * innerH;
                  const x = groupX + seriesIdx * barW + barW * 0.15;
                  const y = innerH - h;
                  const barWidth = barW * 0.7;

                  return (
                    <g key={seriesIdx} style={{
                      opacity: showBars ? 1 : 0,
                      transition: `opacity 0.5s ease ${(dataIdx * series.length + seriesIdx) * 0.05}s`
                    }}>
                      {/* Shadow */}
                      <rect
                        x={x + 1}
                        y={y + 1}
                        width={barWidth}
                        height={h}
                        fill="rgba(0,0,0,0.06)"
                        rx="4"
                        style={{ transition: 'all 1s cubic-bezier(0.4, 0, 0.2, 1)' }}
                      />

                      {/* Main bar */}
                      <rect
                        x={x}
                        y={y}
                        width={barWidth}
                        height={h}
                        fill={`url(#grouped-bar-gradient-${s.key})`}
                        rx="4"
                        style={{
                          cursor: 'pointer',
                          transition: 'all 1s cubic-bezier(0.4, 0, 0.2, 1)',
                          transformOrigin: `${x + barWidth / 2}px ${innerH}px`
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.filter = 'brightness(1.15)';
                          e.currentTarget.style.transform = 'scaleY(1.03)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.filter = 'none';
                          e.currentTarget.style.transform = 'scaleY(1)';
                        }}
                      >
                        <title>{d.label}: {s.label} - {val}</title>
                      </rect>

                      {/* Shine */}
                      <rect
                        x={x + 2}
                        y={y + 2}
                        width={barWidth * 0.25}
                        height={Math.max(0, h * 0.3)}
                        fill="rgba(255,255,255,0.4)"
                        rx="2"
                        style={{ pointerEvents: 'none', transition: 'all 1s cubic-bezier(0.4, 0, 0.2, 1)' }}
                      />

                      {/* Value label */}
                      {val > 0 && h > 20 && (
                        <text
                          x={x + barWidth / 2}
                          y={y - 8}
                          textAnchor="middle"
                          fontSize="13"
                          fill={s.color}
                          fontWeight="700"
                          style={{ filter: 'drop-shadow(0 1px 2px rgba(255,255,255,0.9))' }}
                        >
                          {val}
                        </text>
                      )}
                    </g>
                  );
                })}

                {/* Month label */}
                <text
                  x={groupX + (series.length * barW) / 2}
                  y={innerH + 30}
                  textAnchor="middle"
                  fontSize="14"
                  fill="#555"
                  fontWeight="600"
                >
                  {d.label}
                </text>
              </g>
            );
          })}
        </g>
      </svg>
    </div>
  );
};

const AnimatedBarChart = ({ title, data, width = 450, height = 240, color = '#f6c23e', valueFormatter }) => {
  const [animatedData, setAnimatedData] = React.useState(data.map(d => ({ ...d, animValue: 0 })));
  const [showBars, setShowBars] = React.useState(false);

  React.useEffect(() => {
    const timer1 = setTimeout(() => {
      setShowBars(true);
    }, 200);

    const timer2 = setTimeout(() => {
      setAnimatedData(data.map(d => ({ ...d, animValue: d.value })));
    }, 300);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
    };
  }, [data]);

  const padding = { top: 30, right: 25, bottom: 50, left: 70 };
  const innerW = width - padding.left - padding.right;
  const innerH = height - padding.top - padding.bottom;
  const maxVal = Math.max(1, ...data.map(d => Number(d.value || 0)));
  const barW = innerW / Math.max(1, data.length);
  const barThickness = Math.min(18, barW * 0.55); // Thin bars

  return (
    <div style={{
      background: 'linear-gradient(135deg, #ffffff 0%, #f8f9fc 100%)',
      borderRadius: 16,
      boxShadow: '0 4px 15px rgba(0,0,0,0.08)',
      padding: 28,
      position: 'relative',
      overflow: 'hidden',
      border: '1px solid rgba(0,0,0,0.05)'
    }}>
      <div style={{ marginBottom: 20, color: '#333', fontWeight: 600, fontSize: '1.1rem', letterSpacing: '-0.01em' }}>{title}</div>
      <svg width="100%" height={height} viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="xMidYMid meet">
        <defs>
          {/* Gradient for bars */}
          <linearGradient id={`bar-gradient-${color.replace('#', '')}`} x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor={color} stopOpacity="0.95" />
            <stop offset="100%" stopColor="#e0a800" stopOpacity="0.85" />
          </linearGradient>

          {/* Glow filter */}
          <filter id={`bar-glow-${color.replace('#', '')}`}>
            <feGaussianBlur stdDeviation="2.5" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        <g transform={`translate(${padding.left}, ${padding.top})`}>
          {/* Horizontal grid lines */}
          {[0, 0.25, 0.5, 0.75, 1].map((t, i) => {
            const y = innerH - t * innerH;
            const val = (maxVal * t);
            return (
              <g key={i}>
                <line
                  x1={0}
                  y1={y}
                  x2={innerW}
                  y2={y}
                  stroke="#e8eaf6"
                  strokeWidth="1"
                />
                <text
                  x={-12}
                  y={y + 4}
                  textAnchor="end"
                  fill="#666"
                  fontSize="15"
                  fontWeight="600"
                >
                  {valueFormatter ? valueFormatter(val) : Math.round(val)}
                </text>
              </g>
            );
          })}

          {/* Vertical grid lines */}
          {data.map((d, i) => {
            const x = i * barW + barW / 2;
            return (
              <line
                key={`vgrid-${i}`}
                x1={x}
                y1={0}
                x2={x}
                y2={innerH}
                stroke="#f5f5f5"
                strokeWidth="1"
              />
            );
          })}

          {/* Bars */}
          {animatedData.map((d, i) => {
            const val = Number(d.animValue || 0);
            const h = maxVal === 0 ? 0 : (val / maxVal) * innerH;
            const x = i * barW + (barW - barThickness) / 2;
            const y = innerH - h;

            return (
              <g key={d.label || i} style={{
                opacity: showBars ? 1 : 0,
                transition: `opacity 0.5s ease ${i * 0.08}s`
              }}>
                {/* Bar shadow */}
                <rect
                  x={x + 1.5}
                  y={y + 1.5}
                  width={barThickness}
                  height={h}
                  fill="rgba(0,0,0,0.08)"
                  rx="5"
                  style={{
                    transition: 'all 1s cubic-bezier(0.4, 0, 0.2, 1)'
                  }}
                />

                {/* Main bar */}
                <rect
                  x={x}
                  y={y}
                  width={barThickness}
                  height={h}
                  fill={`url(#bar-gradient-${color.replace('#', '')})`}
                  rx="5"
                  filter={`url(#bar-glow-${color.replace('#', '')})`}
                  style={{
                    cursor: 'pointer',
                    transition: 'all 1s cubic-bezier(0.4, 0, 0.2, 1)',
                    transformOrigin: `${x + barThickness / 2}px ${innerH}px`
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.filter = 'url(#bar-glow-' + color.replace('#', '') + ') brightness(1.15)';
                    e.currentTarget.style.transform = 'scaleY(1.03)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.filter = 'url(#bar-glow-' + color.replace('#', '') + ')';
                    e.currentTarget.style.transform = 'scaleY(1)';
                  }}
                >
                  <title>{d.label}: {valueFormatter ? valueFormatter(val) : val}</title>
                </rect>

                {/* Shine effect on bar */}
                <rect
                  x={x + 2}
                  y={y + 2}
                  width={barThickness * 0.25}
                  height={Math.max(0, h * 0.35)}
                  fill="rgba(255,255,255,0.4)"
                  rx="2"
                  style={{
                    transition: 'all 1s cubic-bezier(0.4, 0, 0.2, 1)',
                    pointerEvents: 'none'
                  }}
                />

                {/* Value label above bar */}
                {val > 0 && (
                  <text
                    x={x + barThickness / 2}
                    y={y - 12}
                    textAnchor="middle"
                    fontSize="15"
                    fill={color}
                    fontWeight="700"
                    style={{
                      filter: 'drop-shadow(0 1px 2px rgba(255,255,255,0.9))',
                      transition: 'all 1s cubic-bezier(0.4, 0, 0.2, 1)'
                    }}
                  >
                    {valueFormatter ? valueFormatter(val) : val}
                  </text>
                )}

                {/* Month label */}
                <text
                  x={x + barThickness / 2}
                  y={innerH + 30}
                  textAnchor="middle"
                  fontSize="14"
                  fill="#555"
                  fontWeight="600"
                >
                  {d.label}
                </text>
              </g>
            );
          })}
        </g>
      </svg>
    </div>
  );
};

const AnimatedLineChart = ({ title, data, width = 450, height = 240, color = '#4e73df', valueFormatter }) => {
  const [animatedData, setAnimatedData] = React.useState(data.map(d => ({ ...d, animValue: 0 })));
  const [lineLength, setLineLength] = React.useState(0);
  const [showPoints, setShowPoints] = React.useState(false);

  React.useEffect(() => {
    // Animate data values
    const timer1 = setTimeout(() => {
      setAnimatedData(data.map(d => ({ ...d, animValue: d.value })));
    }, 300);

    // Show line drawing animation
    const timer2 = setTimeout(() => {
      setLineLength(1);
    }, 100);

    // Show points after line is drawn
    const timer3 = setTimeout(() => {
      setShowPoints(true);
    }, 1100);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
    };
  }, [data]);

  const padding = { top: 30, right: 25, bottom: 50, left: 55 };
  const innerW = width - padding.left - padding.right;
  const innerH = height - padding.top - padding.bottom;
  const maxVal = Math.max(1, ...data.map(d => Number(d.value || 0)));
  const stepX = innerW / Math.max(1, data.length - 1);

  // Generate path for the line
  const linePath = animatedData.map((d, i) => {
    const val = Number(d.animValue || 0);
    const h = maxVal === 0 ? 0 : (val / maxVal) * innerH;
    const x = i * stepX;
    const y = innerH - h;
    return `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
  }).join(' ');

  // Generate path for area
  const areaPath = `M 0 ${innerH} ${animatedData.map((d, i) => {
    const val = Number(d.animValue || 0);
    const h = maxVal === 0 ? 0 : (val / maxVal) * innerH;
    const x = i * stepX;
    const y = innerH - h;
    return `L ${x} ${y}`;
  }).join(' ')} L ${(data.length - 1) * stepX} ${innerH} Z`;

  return (
    <div style={{
      background: 'linear-gradient(135deg, #ffffff 0%, #f8f9fc 100%)',
      borderRadius: 16,
      boxShadow: '0 4px 15px rgba(0,0,0,0.08)',
      padding: 28,
      position: 'relative',
      overflow: 'hidden',
      border: '1px solid rgba(0,0,0,0.05)'
    }}>
      <div style={{ marginBottom: 20, color: '#333', fontWeight: 600, fontSize: '1.1rem', letterSpacing: '-0.01em' }}>{title}</div>
      <svg width="100%" height={height} viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="xMidYMid meet">
        <defs>
          {/* Gradient for area fill */}
          <linearGradient id={`area-gradient-${color.replace('#', '')}`} x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor={color} stopOpacity="0.2" />
            <stop offset="100%" stopColor={color} stopOpacity="0.02" />
          </linearGradient>

          {/* Gradient for line */}
          <linearGradient id={`line-gradient-${color.replace('#', '')}`} x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor={color} stopOpacity="0.8" />
            <stop offset="50%" stopColor={color} stopOpacity="1" />
            <stop offset="100%" stopColor={color} stopOpacity="0.8" />
          </linearGradient>

          {/* Glow filter */}
          <filter id={`glow-${color.replace('#', '')}`}>
            <feGaussianBlur stdDeviation="1.5" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>

          {/* Clip path for line animation */}
          <clipPath id={`clip-${color.replace('#', '')}`}>
            <rect x="0" y="0" width={innerW * lineLength} height={innerH + padding.top + padding.bottom} />
          </clipPath>
        </defs>

        <g transform={`translate(${padding.left}, ${padding.top})`}>
          {/* Horizontal grid lines */}
          {[0, 0.25, 0.5, 0.75, 1].map((t, i) => {
            const y = innerH - t * innerH;
            const val = (maxVal * t);
            return (
              <g key={i}>
                <line
                  x1={0}
                  y1={y}
                  x2={innerW}
                  y2={y}
                  stroke="#e8eaf6"
                  strokeWidth="1"
                />
                <text
                  x={-12}
                  y={y + 4}
                  textAnchor="end"
                  fill="#666"
                  fontSize="13"
                  fontWeight="600"
                >
                  {valueFormatter ? valueFormatter(val) : Math.round(val)}
                </text>
              </g>
            );
          })}

          {/* Vertical grid lines */}
          {data.map((d, i) => {
            const x = i * stepX;
            return (
              <line
                key={`vgrid-${i}`}
                x1={x}
                y1={0}
                x2={x}
                y2={innerH}
                stroke="#f5f5f5"
                strokeWidth="1"
              />
            );
          })}

          <g clipPath={`url(#clip-${color.replace('#', '')})`}>
            {/* Area fill */}
            <path
              d={areaPath}
              fill={`url(#area-gradient-${color.replace('#', '')})`}
              style={{
                transition: 'all 1s cubic-bezier(0.4, 0, 0.2, 1)'
              }}
            />

            {/* Main line */}
            <path
              d={linePath}
              stroke={`url(#line-gradient-${color.replace('#', '')})`}
              strokeWidth="3"
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
              filter={`url(#glow-${color.replace('#', '')})`}
              style={{
                transition: 'all 1s cubic-bezier(0.4, 0, 0.2, 1)'
              }}
            />
          </g>

          {/* Data points and labels */}
          {animatedData.map((d, i) => {
            const val = Number(d.animValue || 0);
            const h = maxVal === 0 ? 0 : (val / maxVal) * innerH;
            const x = i * stepX;
            const y = innerH - h;

            return (
              <g key={d.label || i} style={{
                opacity: showPoints ? 1 : 0,
                transition: `opacity 0.5s ease ${i * 0.08}s`
              }}>
                {/* Pulsing outer circle */}
                <circle
                  cx={x}
                  cy={y}
                  r="12"
                  fill={color}
                  opacity="0"
                  style={{
                    animation: showPoints ? 'pointPulse 2s infinite' : 'none',
                    animationDelay: `${i * 0.1}s`
                  }}
                />

                {/* Glow circle */}
                <circle
                  cx={x}
                  cy={y}
                  r="8"
                  fill={color}
                  opacity="0.25"
                />

                {/* Main point */}
                <circle
                  cx={x}
                  cy={y}
                  r="5"
                  fill={color}
                  stroke="white"
                  strokeWidth="2.5"
                  style={{
                    cursor: 'pointer',
                    filter: 'drop-shadow(0 1px 3px rgba(0,0,0,0.15))'
                  }}
                >
                  <title>{d.label}: {valueFormatter ? valueFormatter(val) : val}</title>
                </circle>

                {/* Value label above point */}
                {val > 0 && (
                  <text
                    x={x}
                    y={y - 18}
                    textAnchor="middle"
                    fontSize="14"
                    fill={color}
                    fontWeight="700"
                    style={{
                      filter: 'drop-shadow(0 1px 2px rgba(255,255,255,0.9))'
                    }}
                  >
                    {valueFormatter ? valueFormatter(val) : val}
                  </text>
                )}

                {/* Month label */}
                <text
                  x={x}
                  y={innerH + 28}
                  textAnchor="middle"
                  fontSize="13"
                  fill="#555"
                  fontWeight="600"
                >
                  {d.label}
                </text>
              </g>
            );
          })}
        </g>
      </svg>

      <style>{`
        @keyframes pointPulse {
          0%, 100% {
            opacity: 0;
            r: 12;
          }
          50% {
            opacity: 0.25;
            r: 16;
          }
        }
      `}</style>
    </div>
  );
};

const AnimatedAnalyticsChart = AnimatedLineChart;

const SimpleBarChart = ({ title, data, width = 900, height = 220, color = '#4e73df', valueFormatter }) => {
  return <AnimatedAnalyticsChart title={title} data={data} width={width} height={height} color={color} valueFormatter={valueFormatter} />;
};

function seriesMonths(arr = []) {
  return arr.map(it => ({ month: it.month, count: it.count ?? it.value ?? 0 }));
}
function normalizeMonthly(arr = []) {
  return arr.map(it => {
    const label = (it.month || '').split('-').slice(1).join('-') || it.month || '';
    return { label, value: Number(it.count || 0) };
  });
}

const CustomerServiceView = () => {
  const [tickets, setTickets] = React.useState([]);
  const [filters, setFilters] = React.useState({ q: '', status: '', category: '', employerId: '' });
  React.useEffect(() => {
    const load = async () => {
      const token = localStorage.getItem('adminToken');
      const params = new URLSearchParams({ page: '1', limit: '20' });
      const res = await fetch(`${API_BASE_URL}/api/admin/cs/tickets?${params.toString()}`, {
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }
      });
      const data = await res.json();
      if (res.ok) setTickets(data.tickets || []);
    };
    load();
  }, []);

  const inputStyle = {
    width: '100%',
    padding: '12px 12px 12px 45px',
    border: '2px solid #e8eaf6',
    borderRadius: '8px',
    fontSize: '14px',
    outline: 'none',
    transition: 'all 0.3s ease',
    boxSizing: 'border-box',
    background: 'linear-gradient(135deg, #ffffff 0%, #f8f9fc 100%)'
  };

  const selectStyle = {
    ...inputStyle,
    cursor: 'pointer',
    backgroundColor: '#fff'
  };

  const getStatusColor = (status) => {
    const colors = {
      open: { bg: '#e74a3b20', color: '#e74a3b', icon: <FaTimesCircle /> },
      pending: { bg: '#f6c23e20', color: '#f6c23e', icon: <FaClock /> },
      resolved: { bg: '#1cc88a20', color: '#1cc88a', icon: <FaCheckCircle /> },
      closed: { bg: '#71809620', color: '#718096', icon: <FaTimesCircle /> }
    };
    return colors[status] || { bg: '#667eea20', color: '#667eea', icon: <FaHeadset /> };
  };

  const getCategoryColor = (category) => {
    const colors = {
      billing: '#e74a3b',
      login: '#667eea',
      job_posting: '#1cc88a',
      general: '#36b9cc'
    };
    return colors[category] || '#718096';
  };

  return (
    <div style={{ padding: '24px', background: 'linear-gradient(to bottom, #f8f9fc 0%, #ffffff 100%)', minHeight: '100vh' }}>
      {/* Header */}
      <div style={{
        background: 'linear-gradient(135deg, #e74a3b 0%, #c0392b 100%)',
        borderRadius: '16px',
        padding: '24px',
        marginBottom: '24px',
        boxShadow: '0 8px 24px rgba(231, 74, 59, 0.25)',
        color: '#fff',
        position: 'relative',
        overflow: 'hidden'
      }}>
        <div style={{
          position: 'absolute',
          top: '-40px',
          right: '-40px',
          width: '150px',
          height: '150px',
          background: 'rgba(255, 255, 255, 0.1)',
          borderRadius: '50%',
          filter: 'blur(50px)'
        }}></div>
        <h2 style={{ margin: 0, fontSize: '1.8rem', fontWeight: '800', letterSpacing: '-0.02em', position: 'relative', zIndex: 1, display: 'flex', alignItems: 'center', gap: '12px' }}>
          <FaHeadset style={{ fontSize: '28px' }} /> Customer Service — Tickets
        </h2>
        <p style={{ margin: '8px 0 0 0', opacity: 0.95, fontSize: '1rem', position: 'relative', zIndex: 1 }}>
          Manage and respond to customer support tickets
        </p>
      </div>

      <div style={{ background: 'white', borderRadius: '16px', boxShadow: '0 4px 15px rgba(0,0,0,0.08)', padding: '24px' }}>
        {/* Filters */}
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr auto', gap: '12px', marginBottom: '24px' }}>
          <div style={{ position: 'relative' }}>
            <FaSearch style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#667eea', fontSize: '16px', zIndex: 2, pointerEvents: 'none' }} />
            <input
              placeholder="Search subject/description"
              value={filters.q}
              onChange={(e) => setFilters({ ...filters, q: e.target.value })}
              style={inputStyle}
              onFocus={(e) => { e.target.style.borderColor = '#667eea'; e.target.style.boxShadow = '0 0 0 3px #667eea20'; }}
              onBlur={(e) => { e.target.style.borderColor = '#e8eaf6'; e.target.style.boxShadow = 'none'; }}
            />
          </div>
          <div style={{ position: 'relative' }}>
            <FaFilter style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#1cc88a', fontSize: '16px', zIndex: 2, pointerEvents: 'none' }} />
            <select
              value={filters.status}
              onChange={(e) => setFilters({ ...filters, status: e.target.value })}
              style={selectStyle}
              onFocus={(e) => { e.target.style.borderColor = '#1cc88a'; e.target.style.boxShadow = '0 0 0 3px #1cc88a20'; }}
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
            <FaTag style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#f6c23e', fontSize: '16px', zIndex: 2, pointerEvents: 'none' }} />
            <select
              value={filters.category}
              onChange={(e) => setFilters({ ...filters, category: e.target.value })}
              style={selectStyle}
              onFocus={(e) => { e.target.style.borderColor = '#f6c23e'; e.target.style.boxShadow = '0 0 0 3px #f6c23e20'; }}
              onBlur={(e) => { e.target.style.borderColor = '#e8eaf6'; e.target.style.boxShadow = 'none'; }}
            >
              <option value="">All Categories</option>
              <option value="billing">Billing</option>
              <option value="login">Login</option>
              <option value="job_posting">Job Posting</option>
              <option value="general">General</option>
            </select>
          </div>
          <div style={{ position: 'relative' }}>
            <FaIdCard style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#36b9cc', fontSize: '16px', zIndex: 2, pointerEvents: 'none' }} />
            <input
              placeholder="Employer ID"
              value={filters.employerId}
              onChange={(e) => setFilters({ ...filters, employerId: e.target.value })}
              style={inputStyle}
              onFocus={(e) => { e.target.style.borderColor = '#36b9cc'; e.target.style.boxShadow = '0 0 0 3px #36b9cc20'; }}
              onBlur={(e) => { e.target.style.borderColor = '#e8eaf6'; e.target.style.boxShadow = 'none'; }}
            />
          </div>
          <button
            type="button"
            onClick={async () => {
              const token = localStorage.getItem('adminToken');
              const params = new URLSearchParams({
                page: '1', limit: '20',
                ...(filters.q ? { q: filters.q } : {}),
                ...(filters.status ? { status: filters.status } : {}),
                ...(filters.category ? { category: filters.category } : {}),
                ...(filters.employerId ? { employerId: filters.employerId } : {})
              });
              const res = await fetch(`${API_BASE_URL}/api/admin/cs/tickets?${params.toString()}`, {
                headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }
              });
              const data = await res.json();
              if (res.ok) setTickets(data.tickets || []);
            }}
            style={{
              padding: '12px 24px',
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              color: '#fff',
              border: 'none',
              borderRadius: '8px',
              fontSize: '14px',
              fontWeight: '700',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              boxShadow: '0 4px 12px rgba(102, 126, 234, 0.3)',
              whiteSpace: 'nowrap'
            }}
            onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 6px 16px rgba(102, 126, 234, 0.4)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 12px rgba(102, 126, 234, 0.3)'; }}
          >
            <FaFilter /> Apply
          </button>
        </div>

        {/* Tickets Table */}
        <div style={{ border: '2px solid #e8eaf6', borderRadius: '12px', overflow: 'hidden', background: '#fff' }}>
          {/* Table Header */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: '80px 2fr 1.5fr 1fr 1fr',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            padding: '16px 20px',
            fontWeight: '700',
            color: '#fff',
            fontSize: '14px',
            letterSpacing: '0.3px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <FaHashtag /> ID
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <FaFileAlt /> Subject
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <FaUserTie /> Employer
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <FaTag /> Category
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <FaHeadset /> Status
            </div>
          </div>

          {/* Table Body */}
          {tickets.length === 0 ? (
            <div style={{ padding: '80px 20px', textAlign: 'center', color: '#a0aec0' }}>
              <div style={{ fontSize: '64px', marginBottom: '16px' }}>📭</div>
              <p style={{ fontSize: '1rem', fontWeight: '600', margin: 0 }}>No tickets found</p>
              <p style={{ fontSize: '0.85rem', marginTop: '8px', opacity: 0.8 }}>Try adjusting your filters</p>
            </div>
          ) : (
            tickets.map((t, idx) => {
              const statusStyle = getStatusColor(t.status);
              const categoryColor = getCategoryColor(t.category);
              return (
                <div
                  key={t.id}
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '80px 2fr 1.5fr 1fr 1fr',
                    padding: '16px 20px',
                    borderTop: idx > 0 ? '1px solid #e8eaf6' : 'none',
                    background: idx % 2 === 0 ? '#fff' : '#f8f9fc',
                    transition: 'all 0.3s ease',
                    cursor: 'pointer'
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = '#667eea10'; e.currentTarget.style.paddingLeft = '24px'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = idx % 2 === 0 ? '#fff' : '#f8f9fc'; e.currentTarget.style.paddingLeft = '20px'; }}
                >
                  <div style={{ display: 'flex', alignItems: 'center' }}>
                    <span style={{
                      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                      color: '#fff',
                      padding: '4px 10px',
                      borderRadius: '6px',
                      fontSize: '0.75rem',
                      fontWeight: '800'
                    }}>
                      #{t.id}
                    </span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', fontWeight: '600', color: '#2d3748', fontSize: '14px' }}>
                    {t.subject}
                  </div>
                  <div style={{ fontSize: '13px' }}>
                    <div style={{ fontWeight: '700', color: '#2d3748', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <FaUser style={{ color: '#667eea', fontSize: '12px' }} />
                      {t.full_name || '—'}
                    </div>
                    <div style={{ color: '#718096', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <FaEnvelope style={{ fontSize: '11px' }} />
                      {t.email || ''}
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center' }}>
                    <span style={{
                      padding: '6px 12px',
                      borderRadius: '6px',
                      background: `${categoryColor}20`,
                      color: categoryColor,
                      fontSize: '0.75rem',
                      fontWeight: '700',
                      textTransform: 'capitalize'
                    }}>
                      {t.category}
                    </span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center' }}>
                    <span style={{
                      padding: '6px 12px',
                      borderRadius: '6px',
                      background: statusStyle.bg,
                      color: statusStyle.color,
                      fontSize: '0.75rem',
                      fontWeight: '700',
                      textTransform: 'capitalize',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px'
                    }}>
                      {statusStyle.icon}
                      {t.status}
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};

// Settings & Configuration View
const SettingsView = () => {
  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);
  const [form, setForm] = React.useState({
    site_name: '',
    logo_url: '',
    contact_email: '',
    contact_phone: '',
    smtp_host: '',
    smtp_port: '',
    smtp_user: '',
    smtp_secure: 0,
    payment_provider: 'stripe',
    payment_public_key: '',
    payment_secret_key: '',
    seo_meta_title: '',
    seo_meta_description: '',
    seo_meta_image: '',
    social_twitter: '',
    social_facebook: '',
    job_alert_frequency: 'daily',
    upload_max_mb: 10,
    upload_allowed_types: 'pdf,doc,docx,jpg,png'
  });

  React.useEffect(() => {
    (async () => {
      const token = localStorage.getItem('adminToken');
      const res = await fetch(`${API_BASE_URL}/api/admin/settings`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok && data.settings) {
        setForm(prev => ({ ...prev, ...data.settings }));
      }
      setLoading(false);
    })();
  }, []);

  const save = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const token = localStorage.getItem('adminToken');
      const res = await fetch(`${API_BASE_URL}/api/admin/settings`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      });
      const data = await res.json();
      if (res.ok) {
        alert('Settings saved');
        setForm(prev => ({ ...prev, ...data.settings }));
      } else {
        alert(data.message || 'Failed to save settings');
      }
    } finally {
      setSaving(false);
    }
  };

  const inputStyle = {
    width: '100%',
    padding: '12px 12px 12px 45px',
    border: '2px solid #e8eaf6',
    borderRadius: '8px',
    fontSize: '14px',
    outline: 'none',
    transition: 'all 0.3s ease',
    boxSizing: 'border-box',
    background: 'linear-gradient(135deg, #ffffff 0%, #f8f9fc 100%)'
  };

  const selectStyle = {
    ...inputStyle,
    cursor: 'pointer',
    backgroundColor: '#fff'
  };

  const input = (label, name, type = 'text', icon, iconColor = '#667eea') => (
    <div>
      <label style={{ display: 'block', marginBottom: 8, fontWeight: '600', fontSize: '14px', color: '#2d3748' }}>{label}</label>
      <div style={{ position: 'relative' }}>
        {icon && (
          <div style={{
            position: 'absolute',
            left: '14px',
            top: '50%',
            transform: 'translateY(-50%)',
            color: iconColor,
            fontSize: '16px',
            zIndex: 2,
            pointerEvents: 'none'
          }}>
            {icon}
          </div>
        )}
        <input
          type={type}
          value={form[name] ?? ''}
          onChange={(e) => setForm({ ...form, [name]: type === 'number' ? Number(e.target.value) : e.target.value })}
          style={inputStyle}
          onFocus={(e) => { e.target.style.borderColor = iconColor; e.target.style.boxShadow = `0 0 0 3px ${iconColor}20`; }}
          onBlur={(e) => { e.target.style.borderColor = '#e8eaf6'; e.target.style.boxShadow = 'none'; }}
        />
      </div>
    </div>
  );

  const sectionHeaderStyle = {
    gridColumn: '1 / span 2',
    fontWeight: '800',
    fontSize: '18px',
    color: '#2d3748',
    padding: '16px 20px',
    background: 'linear-gradient(135deg, #f8f9fc 0%, #ffffff 100%)',
    borderRadius: '10px',
    border: '2px solid #e8eaf6',
    marginTop: '24px',
    marginBottom: '8px',
    display: 'flex',
    alignItems: 'center',
    gap: '10px'
  };

  return (
    <div style={{ padding: '24px', background: 'linear-gradient(to bottom, #f8f9fc 0%, #ffffff 100%)', minHeight: '100vh' }}>
      {/* Header */}
      <div style={{
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        borderRadius: '16px',
        padding: '24px',
        marginBottom: '24px',
        boxShadow: '0 8px 24px rgba(102, 126, 234, 0.25)',
        color: '#fff',
        position: 'relative',
        overflow: 'hidden'
      }}>
        <div style={{
          position: 'absolute',
          top: '-40px',
          right: '-40px',
          width: '150px',
          height: '150px',
          background: 'rgba(255, 255, 255, 0.1)',
          borderRadius: '50%',
          filter: 'blur(50px)'
        }}></div>
        <h2 style={{ margin: 0, fontSize: '1.8rem', fontWeight: '800', letterSpacing: '-0.02em', position: 'relative', zIndex: 1 }}>
          ⚙️ Settings & Configuration
        </h2>
        <p style={{ margin: '8px 0 0 0', opacity: 0.95, fontSize: '1rem', position: 'relative', zIndex: 1 }}>
          Manage your website settings, email configuration, and integrations
        </p>
      </div>

      <div style={{ background: 'white', borderRadius: '16px', boxShadow: '0 4px 15px rgba(0,0,0,0.08)', padding: '24px' }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '60px 20px', color: '#667eea' }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>⏳</div>
            <p style={{ fontSize: '1rem', fontWeight: '600' }}>Loading settings...</p>
          </div>
        ) : (
          <form onSubmit={save} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
            <div style={sectionHeaderStyle}>
              <FaGlobe style={{ color: '#667eea', fontSize: '20px' }} />
              General Settings
            </div>
            {input('Site Name', 'site_name', 'text', <FaBuilding />, '#667eea')}
            {input('Logo URL', 'logo_url', 'text', <FaImage />, '#667eea')}
            {input('Contact Email', 'contact_email', 'email', <FaEnvelope />, '#667eea')}
            {input('Contact Phone', 'contact_phone', 'tel', <FaPhone />, '#667eea')}

            <div style={sectionHeaderStyle}>
              <FaEnvelope style={{ color: '#1cc88a', fontSize: '20px' }} />
              Email / SMTP Configuration
            </div>
            {input('SMTP Host', 'smtp_host', 'text', <FaServer />, '#1cc88a')}
            {input('SMTP Port', 'smtp_port', 'number', <FaHashtag />, '#1cc88a')}
            {input('SMTP User', 'smtp_user', 'text', <FaUser />, '#1cc88a')}
            <div>
              <label style={{ display: 'block', marginBottom: 8, fontWeight: '600', fontSize: '14px', color: '#2d3748' }}>SMTP Secure (TLS/SSL)</label>
              <div style={{ position: 'relative' }}>
                <FaShieldAlt style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#1cc88a', fontSize: '16px', zIndex: 2, pointerEvents: 'none' }} />
                <select
                  value={form.smtp_secure ? 1 : 0}
                  onChange={(e) => setForm({ ...form, smtp_secure: Number(e.target.value) })}
                  style={selectStyle}
                  onFocus={(e) => { e.target.style.borderColor = '#1cc88a'; e.target.style.boxShadow = '0 0 0 3px #1cc88a20'; }}
                  onBlur={(e) => { e.target.style.borderColor = '#e8eaf6'; e.target.style.boxShadow = 'none'; }}
                >
                  <option value={0}>No</option>
                  <option value={1}>Yes</option>
                </select>
              </div>
            </div>

            <div style={sectionHeaderStyle}>
              <FaCreditCard style={{ color: '#f6c23e', fontSize: '20px' }} />
              Payment Configuration
            </div>
            {input('Payment Provider', 'payment_provider', 'text', <FaCreditCard />, '#f6c23e')}
            {input('Public Key', 'payment_public_key', 'text', <FaKey />, '#f6c23e')}
            {input('Secret Key', 'payment_secret_key', 'text', <FaLock />, '#f6c23e')}

            <div style={sectionHeaderStyle}>
              <FaGlobe style={{ color: '#36b9cc', fontSize: '20px' }} />
              SEO & Social Media
            </div>
            {input('SEO Title', 'seo_meta_title', 'text', <FaHeading />, '#36b9cc')}
            {input('SEO Description', 'seo_meta_description', 'text', <FaFileAlt />, '#36b9cc')}
            {input('SEO Image URL', 'seo_meta_image', 'text', <FaImage />, '#36b9cc')}
            {input('Twitter URL', 'social_twitter', 'text', <FaTwitter />, '#36b9cc')}
            {input('Facebook URL', 'social_facebook', 'text', <FaFacebook />, '#36b9cc')}

            <div style={sectionHeaderStyle}>
              <FaBell style={{ color: '#e74a3b', fontSize: '20px' }} />
              Alerts & Uploads
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: 8, fontWeight: '600', fontSize: '14px', color: '#2d3748' }}>Job Alert Frequency</label>
              <div style={{ position: 'relative' }}>
                <FaBell style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#e74a3b', fontSize: '16px', zIndex: 2, pointerEvents: 'none' }} />
                <select
                  value={form.job_alert_frequency}
                  onChange={(e) => setForm({ ...form, job_alert_frequency: e.target.value })}
                  style={selectStyle}
                  onFocus={(e) => { e.target.style.borderColor = '#e74a3b'; e.target.style.boxShadow = '0 0 0 3px #e74a3b20'; }}
                  onBlur={(e) => { e.target.style.borderColor = '#e8eaf6'; e.target.style.boxShadow = 'none'; }}
                >
                  <option value="instant">Instant</option>
                  <option value="daily">Daily</option>
                  <option value="weekly">Weekly</option>
                </select>
              </div>
            </div>
            {input('Upload Max (MB)', 'upload_max_mb', 'number', <FaUpload />, '#e74a3b')}
            {input('Allowed Types (comma separated)', 'upload_allowed_types', 'text', <FaFile />, '#e74a3b')}

            <div style={{ gridColumn: '1 / span 2', marginTop: '24px', display: 'flex', justifyContent: 'center' }}>
              <button
                type="submit"
                disabled={saving}
                style={{
                  padding: '14px 32px',
                  background: saving ? '#ccc' : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  color: '#fff',
                  border: 0,
                  borderRadius: '10px',
                  cursor: saving ? 'not-allowed' : 'pointer',
                  fontSize: '16px',
                  fontWeight: '700',
                  boxShadow: saving ? 'none' : '0 4px 15px rgba(102, 126, 234, 0.3)',
                  transition: 'all 0.3s ease',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  minWidth: '200px',
                  justifyContent: 'center'
                }}
                onMouseEnter={(e) => { if (!saving) { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 6px 20px rgba(102, 126, 234, 0.4)'; } }}
                onMouseLeave={(e) => { if (!saving) { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 15px rgba(102, 126, 234, 0.3)'; } }}
              >
                {saving ? (
                  <>
                    <span style={{ animation: 'spin 1s linear infinite', display: 'inline-block' }}>⏳</span>
                    Saving...
                  </>
                ) : (
                  <>
                    <FaCheck /> Save Settings
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>

      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};
// Analytics & Reports View
const AnalyticsReportsView = () => {
  const [loading, setLoading] = React.useState(true);
  const [userGrowth, setUserGrowth] = React.useState({ seekers: [], providers: [] });
  const [jobTrends, setJobTrends] = React.useState({ jobs: [] });
  const [subsUsage, setSubsUsage] = React.useState({ summary: [] });
  const [appMetrics, setAppMetrics] = React.useState({ byStatus: [], perJob: [] });

  React.useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem('adminToken');
        const [ug, jt, su, am] = await Promise.all([
          fetch(`${API_BASE_URL}/api/admin/reports/user-growth`, { headers: { 'Authorization': `Bearer ${token}` } }),
          fetch(`${API_BASE_URL}/api/admin/reports/job-trends`, { headers: { 'Authorization': `Bearer ${token}` } }),
          fetch(`${API_BASE_URL}/api/admin/reports/subscription-usage`, { headers: { 'Authorization': `Bearer ${token}` } }),
          fetch(`${API_BASE_URL}/api/admin/reports/application-metrics`, { headers: { 'Authorization': `Bearer ${token}` } }),
        ]);
        if (ug.ok) setUserGrowth(await ug.json());
        if (jt.ok) setJobTrends(await jt.json());
        if (su.ok) setSubsUsage(await su.json());
        if (am.ok) setAppMetrics(await am.json());
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const downloadCsv = async (type, filename) => {
    const token = localStorage.getItem('adminToken');
    try {
      const res = await fetch(`${API_BASE_URL}/api/admin/reports/export/${type}.csv`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${filename || type}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (e) {
      alert('Export failed: ' + e.message);
    }
  };

  const toolbar = (
    <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
      <button type="button" onClick={() => downloadCsv('user-growth', 'user-growth')}>Export User Growth</button>
      <button type="button" onClick={() => downloadCsv('job-trends', 'job-trends')}>Export Job Trends</button>
      <button type="button" onClick={() => downloadCsv('subscriptions', 'subscriptions')}>Export Subscriptions</button>
      <button type="button" onClick={() => downloadCsv('payments', 'payments')}>Export Payments</button>
      <button type="button" onClick={() => downloadCsv('applications', 'applications')}>Export Applications</button>
    </div>
  );

  return (
    <div style={{ background: 'linear-gradient(to bottom, #f8f9fc 0%, #ffffff 100%)', minHeight: '100vh', padding: '2rem' }}>
      {/* Header Section */}
      <div style={{
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        borderRadius: '20px',
        padding: '2rem',
        marginBottom: '2rem',
        boxShadow: '0 10px 30px rgba(102, 126, 234, 0.3)',
        color: '#fff',
        position: 'relative',
        overflow: 'hidden'
      }}>
        <div style={{ position: 'relative', zIndex: 1 }}>
          <h1 style={{ margin: '0 0 0.5rem 0', fontSize: '2rem', fontWeight: '800', letterSpacing: '-0.02em' }}>
            📊 Analytics & Reports
          </h1>
          <p style={{ margin: 0, opacity: 0.9, fontSize: '1.05rem' }}>
            Comprehensive insights and data visualization for your platform
          </p>
        </div>
        {/* Decorative elements */}
        <div style={{
          position: 'absolute',
          top: '-50px',
          right: '-50px',
          width: '200px',
          height: '200px',
          background: 'rgba(255, 255, 255, 0.1)',
          borderRadius: '50%',
          filter: 'blur(40px)'
        }}></div>
      </div>

      {/* Export Toolbar */}
      <div style={{
        background: 'white',
        borderRadius: '16px',
        padding: '1.5rem',
        marginBottom: '2rem',
        boxShadow: '0 4px 15px rgba(0,0,0,0.08)',
        border: '1px solid rgba(0,0,0,0.05)'
      }}>
        <h3 style={{ margin: '0 0 1rem 0', fontSize: '1.1rem', fontWeight: '700', color: '#333' }}>
          📥 Export Reports
        </h3>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          {[
            { label: 'User Growth', type: 'user-growth', color: '#667eea' },
            { label: 'Job Trends', type: 'job-trends', color: '#1cc88a' },
            { label: 'Subscriptions', type: 'subscriptions', color: '#f6c23e' },
            { label: 'Payments', type: 'payments', color: '#e74a3b' },
            { label: 'Applications', type: 'applications', color: '#36b9cc' }
          ].map((btn, idx) => (
            <button
              key={btn.type}
              type="button"
              onClick={() => downloadCsv(btn.type, btn.type)}
              style={{
                padding: '0.75rem 1.5rem',
                background: `linear-gradient(135deg, ${btn.color} 0%, ${btn.color}dd 100%)`,
                color: 'white',
                border: 'none',
                borderRadius: '10px',
                cursor: 'pointer',
                fontWeight: '600',
                fontSize: '0.9rem',
                boxShadow: `0 4px 15px ${btn.color}40`,
                transition: 'all 0.3s ease',
                animation: `fadeInUp 0.5s ease ${idx * 0.1}s both`
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = `0 6px 20px ${btn.color}60`;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = `0 4px 15px ${btn.color}40`;
              }}
            >
              {btn.label}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: '400px',
          background: 'rgba(255, 255, 255, 0.8)',
          borderRadius: '16px',
          backdropFilter: 'blur(10px)'
        }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{
              width: '60px',
              height: '60px',
              border: '4px solid #f3f3f3',
              borderTop: '4px solid #667eea',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite',
              margin: '0 auto 20px'
            }}></div>
            <p style={{ color: '#667eea', fontSize: '1.1rem', fontWeight: '600' }}>Loading analytics...</p>
          </div>
        </div>
      ) : (
        <>
          {/* User Growth Charts - 2 Column Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '20px', marginBottom: '20px' }}>
            {/* Seekers Chart */}
            <div style={{
              borderRadius: '16px',
              overflow: 'hidden',
              boxShadow: '0 4px 15px rgba(0,0,0,0.08)',
              transition: 'all 0.3s ease',
              animation: 'fadeInUp 0.5s ease 0s both'
            }}>
              <div style={{
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                padding: '20px',
                color: '#fff',
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem'
              }}>
                <i className="fas fa-user-friends" style={{ fontSize: '1.5rem' }}></i>
                <div>
                  <h6 style={{ margin: 0, fontSize: '1.1rem', fontWeight: '700' }}>
                    User Growth - Candidates
                  </h6>
                  <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.85rem', opacity: 0.9 }}>Last 30 Days</p>
                </div>
              </div>
              <div style={{ padding: '2rem', backgroundColor: 'white' }}>
                <SimpleBarChart
                  title=""
                  data={(userGrowth.seekers || []).map(r => ({ label: (r.day || '').slice(5), value: Number(r.count || 0) }))}
                  color="#667eea"
                  width={450}
                  height={240}
                />
              </div>
            </div>

            {/* Employers Chart */}
            <div style={{
              borderRadius: '16px',
              overflow: 'hidden',
              boxShadow: '0 4px 15px rgba(0,0,0,0.08)',
              transition: 'all 0.3s ease',
              animation: 'fadeInUp 0.5s ease 0.1s both'
            }}>
              <div style={{
                background: 'linear-gradient(135deg, #1cc88a 0%, #17a673 100%)',
                padding: '20px',
                color: '#fff',
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem'
              }}>
                <i className="fas fa-building" style={{ fontSize: '1.5rem' }}></i>
                <div>
                  <h6 style={{ margin: 0, fontSize: '1.1rem', fontWeight: '700' }}>
                    User Growth - Employers
                  </h6>
                  <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.85rem', opacity: 0.9 }}>Last 30 Days</p>
                </div>
              </div>
              <div style={{ padding: '2rem', backgroundColor: 'white' }}>
                <SimpleBarChart
                  title=""
                  data={(userGrowth.providers || []).map(r => ({ label: (r.day || '').slice(5), value: Number(r.count || 0) }))}
                  color="#1cc88a"
                  width={450}
                  height={240}
                />
              </div>
            </div>
          </div>

          {/* Job Posting Trends & Subscription Usage - 2 Column Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '20px', marginBottom: '20px' }}>
            {/* Job Posting Trends - Bar Chart */}
            <div style={{
              borderRadius: '16px',
              overflow: 'hidden',
              boxShadow: '0 4px 15px rgba(0,0,0,0.08)',
              animation: 'fadeInUp 0.5s ease 0.2s both'
            }}>
              <div style={{
                background: 'linear-gradient(135deg, #36b9cc 0%, #2c9faf 100%)',
                padding: '20px',
                color: '#fff',
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem'
              }}>
                <i className="fas fa-briefcase" style={{ fontSize: '1.5rem' }}></i>
                <div>
                  <h6 style={{ margin: 0, fontSize: '1.1rem', fontWeight: '700' }}>
                    Job Posting Trends
                  </h6>
                  <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.85rem', opacity: 0.9 }}>Last 30 Days</p>
                </div>
              </div>
              <div style={{ padding: '2rem', backgroundColor: 'white' }}>
                <AnimatedBarChart
                  title=""
                  data={(jobTrends.jobs || []).map(r => ({ label: (r.day || '').slice(5), value: Number(r.count || 0) }))}
                  color="#36b9cc"
                  width={450}
                  height={240}
                />
              </div>
            </div>

            {/* Subscription Usage Card */}
            <div style={{
              background: 'white',
              borderRadius: '16px',
              boxShadow: '0 4px 15px rgba(0,0,0,0.08)',
              overflow: 'hidden',
              border: '1px solid rgba(0,0,0,0.05)',
              animation: 'fadeInUp 0.5s ease 0.3s both'
            }}>
              <div style={{
                background: 'linear-gradient(135deg, #f6c23e 0%, #e0a800 100%)',
                padding: '20px',
                color: '#fff',
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem'
              }}>
                <i className="fas fa-star" style={{ fontSize: '1.5rem' }}></i>
                <h6 style={{ margin: 0, fontSize: '1.1rem', fontWeight: '700' }}>
                  Subscription Usage (Active)
                </h6>
              </div>
              <div style={{ padding: '2rem' }}>
                {(subsUsage.summary || []).length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '2rem', color: '#999' }}>
                    <i className="fas fa-inbox" style={{ fontSize: '3rem', marginBottom: '1rem', opacity: 0.3 }}></i>
                    <p>No subscription data available</p>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    {(subsUsage.summary || []).map((s, idx) => (
                      <div
                        key={s.membership_type}
                        style={{
                          padding: '1.25rem',
                          borderRadius: '12px',
                          background: 'linear-gradient(135deg, #fff 0%, #f8f9fc 100%)',
                          border: '1px solid rgba(0,0,0,0.05)',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          transition: 'all 0.3s ease',
                          cursor: 'pointer',
                          animation: `fadeIn 0.3s ease ${idx * 0.1}s both`
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.transform = 'translateX(5px)';
                          e.currentTarget.style.boxShadow = '0 4px 15px rgba(0,0,0,0.1)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.transform = 'translateX(0)';
                          e.currentTarget.style.boxShadow = 'none';
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                          <div style={{
                            width: '50px',
                            height: '50px',
                            borderRadius: '12px',
                            background: `linear-gradient(135deg, #f6c23e 0%, #e0a800 100%)`,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: '#fff',
                            fontSize: '1.2rem',
                            fontWeight: '700',
                            boxShadow: '0 4px 12px rgba(246, 194, 62, 0.3)'
                          }}>
                            <i className="fas fa-crown"></i>
                          </div>
                          <div>
                            <div style={{ fontWeight: '700', fontSize: '1rem', color: '#333', textTransform: 'capitalize' }}>
                              {s.membership_type}
                            </div>
                            <div style={{ fontSize: '0.85rem', color: '#888', marginTop: '0.25rem' }}>
                              Active Members
                            </div>
                          </div>
                        </div>
                        <div style={{
                          fontSize: '1.75rem',
                          fontWeight: '800',
                          background: 'linear-gradient(135deg, #f6c23e 0%, #e0a800 100%)',
                          WebkitBackgroundClip: 'text',
                          WebkitTextFillColor: 'transparent'
                        }}>
                          {s.count}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Application Metrics - Full Width */}
          <div style={{
            background: 'white',
            borderRadius: '16px',
            boxShadow: '0 4px 15px rgba(0,0,0,0.08)',
            overflow: 'hidden',
            border: '1px solid rgba(0,0,0,0.05)',
            animation: 'fadeInUp 0.5s ease 0.4s both'
          }}>
            <div style={{
              background: 'linear-gradient(135deg, #e74a3b 0%, #c0392b 100%)',
              padding: '20px',
              color: '#fff',
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem'
            }}>
              <i className="fas fa-chart-pie" style={{ fontSize: '1.5rem' }}></i>
              <h6 style={{ margin: 0, fontSize: '1.1rem', fontWeight: '700' }}>
                Application Metrics
              </h6>
            </div>
            <div style={{ padding: '2rem' }}>
              <div style={{ marginBottom: '1.5rem' }}>
                <h6 style={{ margin: '0 0 1rem 0', fontSize: '0.95rem', fontWeight: '700', color: '#555' }}>By Status</h6>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  {(appMetrics.byStatus || []).map((s, idx) => {
                    const statusColors = {
                      pending: '#f6c23e',
                      reviewed: '#36b9cc',
                      accepted: '#1cc88a',
                      rejected: '#e74a3b'
                    };
                    const color = statusColors[s.status] || '#667eea';
                    return (
                      <div
                        key={s.status}
                        style={{
                          padding: '0.75rem 1rem',
                          borderRadius: '10px',
                          background: `linear-gradient(90deg, ${color}15 0%, ${color}05 100%)`,
                          border: `1px solid ${color}30`,
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          animation: `fadeIn 0.3s ease ${idx * 0.1}s both`
                        }}
                      >
                        <div style={{
                          fontWeight: '600',
                          fontSize: '0.9rem',
                          color: '#555',
                          textTransform: 'capitalize',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.5rem'
                        }}>
                          <div style={{
                            width: '10px',
                            height: '10px',
                            borderRadius: '50%',
                            background: color
                          }}></div>
                          {s.status}
                        </div>
                        <div style={{
                          fontSize: '1.25rem',
                          fontWeight: '800',
                          color: color
                        }}>
                          {s.count}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div>
                <h6 style={{ margin: '0 0 1rem 0', fontSize: '0.95rem', fontWeight: '700', color: '#555' }}>Top Jobs</h6>
                <div style={{ maxHeight: '280px', overflowY: 'auto' }}>
                  {(appMetrics.perJob || []).length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '2rem', color: '#999' }}>
                      <i className="fas fa-briefcase" style={{ fontSize: '2rem', marginBottom: '0.5rem', opacity: 0.3 }}></i>
                      <p style={{ fontSize: '0.9rem' }}>No job data available</p>
                    </div>
                  ) : (
                    (appMetrics.perJob || []).map((j, idx) => (
                      <div
                        key={j.job_id}
                        style={{
                          padding: '1rem',
                          borderBottom: '1px solid rgba(0,0,0,0.05)',
                          transition: 'all 0.3s ease',
                          cursor: 'pointer',
                          animation: `fadeIn 0.3s ease ${idx * 0.1}s both`
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = 'rgba(102, 126, 234, 0.05)';
                          e.currentTarget.style.paddingLeft = '1.25rem';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = 'transparent';
                          e.currentTarget.style.paddingLeft = '1rem';
                        }}
                      >
                        <div style={{ fontWeight: '600', fontSize: '0.9rem', color: '#333', marginBottom: '0.25rem' }}>
                          {j.job_title}
                        </div>
                        <div style={{ fontSize: '0.8rem', color: '#888', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <i className="fas fa-users" style={{ color: '#667eea' }}></i>
                          <span>{j.applications} Applications</span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }
      `}</style>
    </div>
  );
};