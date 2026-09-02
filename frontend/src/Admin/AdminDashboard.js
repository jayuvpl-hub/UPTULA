import React, { useState, useEffect } from 'react';
import { useAdmin } from './AdminContext';
import AdminSidebar from './components/AdminSidebar';
import AdminTopbar from './components/AdminTopbar';
import DashboardOverview from './components/DashboardOverview';
import CandidatesList from './components/CandidatesList';
import EmployersList from './components/EmployersList';
import JobsList from './components/JobsList';
import PremiumMembers from './components/PremiumMembers';
import Payments from './components/Payments';
import Finance from './components/Finance';
import Reports from './components/Reports';
import './AdminStyles.css';

const AdminDashboard = () => {
  const { isAuthenticated, fetchDashboardData, loading } = useAdmin();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  useEffect(() => {
    if (isAuthenticated) {
      fetchDashboardData();
    }
  }, [isAuthenticated, fetchDashboardData]);

  // Redirect if not authenticated
  useEffect(() => {
    if (!isAuthenticated && !loading) {
      // Use replace to prevent back button issues
      window.location.replace('/admin/login');
    }
  }, [isAuthenticated, loading]);

  const toggleSidebar = () => {
    setSidebarCollapsed(!sidebarCollapsed);
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <DashboardOverview />;
      case 'candidates':
        return <CandidatesList />;
      case 'employers':
        return <EmployersList />;
      case 'jobs':
        return <JobsList />;
      case 'premium':
        return <PremiumMembers />;
      case 'payments':
        return <Payments />;
      case 'finance':
        return <Finance />;
      case 'reports':
        return <Reports />;
      default:
        return <DashboardOverview />;
    }
  };

  if (loading) {
    return (
      <div className="admin-dashboard" style={{ 
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        minHeight: '100vh'
      }}>
        <div className="d-flex justify-content-center align-items-center" style={{ height: '100vh' }}>
          <div style={{ textAlign: 'center' }}>
            <div className="spinner-border text-white" role="status" style={{ 
              width: '3rem', 
              height: '3rem',
              borderWidth: '0.3rem'
            }}>
            <span className="sr-only">Loading...</span>
            </div>
            <p className="mt-3 text-white" style={{ fontSize: '1.1rem', fontWeight: '500' }}>
              Loading Dashboard...
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null; // Will redirect via useEffect
  }

  return (
    <div className="admin-dashboard" style={{
      background: 'linear-gradient(to bottom, #f8f9fc 0%, #e9ecef 100%)',
      minHeight: '100vh',
      transition: 'all 0.3s ease'
    }}>
      <div id="wrapper" className={sidebarCollapsed ? 'toggled' : ''} style={{
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
      }}>
        {/* Sidebar */}
        <AdminSidebar 
          activeTab={activeTab} 
          setActiveTab={setActiveTab}
          collapsed={sidebarCollapsed}
        />

        {/* Content Wrapper */}
        <div id="content-wrapper" className="d-flex flex-column" style={{
          background: 'linear-gradient(to bottom, #f8f9fc 0%, #ffffff 100%)',
          minHeight: '100vh',
          transition: 'all 0.3s ease'
        }}>
          {/* Topbar */}
          <AdminTopbar 
            onToggleSidebar={toggleSidebar}
            sidebarCollapsed={sidebarCollapsed}
          />

          {/* Main Content */}
          <div id="content" style={{
            padding: '2rem 0',
            animation: 'fadeIn 0.5s ease-in'
          }}>
            <div className="container-fluid" style={{
              maxWidth: '1400px',
              margin: '0 auto',
              padding: '0 1.5rem'
            }}>
              {loading ? (
                <div className="d-flex justify-content-center align-items-center" style={{ 
                  height: '400px',
                  background: 'rgba(255, 255, 255, 0.8)',
                  borderRadius: '12px',
                  backdropFilter: 'blur(10px)'
                }}>
                  <div style={{ textAlign: 'center' }}>
                    <div className="spinner-border text-primary" role="status" style={{
                      width: '2.5rem',
                      height: '2.5rem'
                    }}>
                    <span className="sr-only">Loading...</span>
                    </div>
                    <p className="mt-3 text-gray-600">Loading content...</p>
                  </div>
                </div>
              ) : (
                <div style={{
                  animation: 'slideUp 0.4s ease-out'
                }}>
                  {renderContent()}
                </div>
              )}
            </div>
          </div>

          {/* Footer */}
          <footer className="sticky-footer bg-white" style={{
            background: 'linear-gradient(to right, #ffffff 0%, #f8f9fc 100%)',
            borderTop: '1px solid rgba(0, 0, 0, 0.05)',
            boxShadow: '0 -2px 10px rgba(0, 0, 0, 0.03)',
            padding: '1.5rem 0',
            marginTop: 'auto'
          }}>
            <div className="container my-auto">
              <div className="copyright text-center my-auto" style={{
                color: '#6c757d',
                fontSize: '0.875rem',
                fontWeight: '400'
              }}>
                <span style={{ 
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  fontWeight: '600'
                }}>
                  Copyright &copy; Uptula Admin Dashboard 2024
                </span>
              </div>
            </div>
          </footer>
        </div>
      </div>

      {/* Scroll to Top Button */}
      <a 
        className="scroll-to-top rounded" 
        href="#page-top"
        style={{
          position: 'fixed',
          right: '2rem',
          bottom: '2rem',
          width: '3rem',
          height: '3rem',
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          color: '#fff',
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 4px 15px rgba(102, 126, 234, 0.4)',
          transition: 'all 0.3s ease',
          textDecoration: 'none',
          zIndex: 1000
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = 'translateY(-5px)';
          e.currentTarget.style.boxShadow = '0 6px 20px rgba(102, 126, 234, 0.6)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = 'translateY(0)';
          e.currentTarget.style.boxShadow = '0 4px 15px rgba(102, 126, 234, 0.4)';
        }}
      >
        <i className="fas fa-angle-up" style={{ fontSize: '1.2rem' }}></i>
      </a>

      <style>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }
        
        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
};

export default AdminDashboard;
