import React from 'react';
import { useAdmin } from '../AdminContext';

const AdminSidebar = ({ activeTab, setActiveTab, collapsed }) => {
  const { admin } = useAdmin();

  const menuItems = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: 'fas fa-fw fa-tachometer-alt',
      active: activeTab === 'dashboard'
    },
    {
      id: 'candidates',
      label: 'Candidates',
      icon: 'fas fa-fw fa-users',
      active: activeTab === 'candidates'
    },
    {
      id: 'employers',
      label: 'Employers',
      icon: 'fas fa-fw fa-building',
      active: activeTab === 'employers'
    },
    {
      id: 'jobs',
      label: 'Jobs',
      icon: 'fas fa-fw fa-briefcase',
      active: activeTab === 'jobs'
    },
    {
      id: 'premium',
      label: 'Premium Members',
      icon: 'fas fa-fw fa-crown',
      active: activeTab === 'premium'
    },
    {
      id: 'payments',
      label: 'Payments',
      icon: 'fas fa-fw fa-credit-card',
      active: activeTab === 'payments'
    },
    {
      id: 'finance',
      label: 'Finance',
      icon: 'fas fa-fw fa-dollar-sign',
      active: activeTab === 'finance'
    },
    {
      id: 'reports',
      label: 'Reports',
      icon: 'fas fa-fw fa-chart-line',
      active: activeTab === 'reports'
    }
  ];

  return (
    <>
      <ul 
        className={`navbar-nav bg-gradient-primary sidebar sidebar-dark accordion ${collapsed ? 'toggled' : ''}`} 
        id="accordionSidebar"
        style={{
          background: 'linear-gradient(180deg, #667eea 0%, #764ba2 50%, #667eea 100%)',
          backgroundSize: '200% 200%',
          animation: 'gradientShift 15s ease infinite',
          minHeight: '100vh',
          width: '224px',
          position: 'fixed',
          top: 0,
          left: 0,
          zIndex: 1000,
          boxShadow: '4px 0 20px rgba(0, 0, 0, 0.1)',
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          overflowY: 'auto',
          overflowX: 'hidden'
        }}
      >
      {/* Sidebar - Brand */}
        <a 
          className="sidebar-brand d-flex align-items-center justify-content-center" 
          href="#"
          style={{
            height: '4.375rem',
            textDecoration: 'none',
            padding: '1.5rem 1rem',
            background: 'rgba(255, 255, 255, 0.1)',
            backdropFilter: 'blur(10px)',
            borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
            transition: 'all 0.3s ease',
            position: 'sticky',
            top: 0,
            zIndex: 10
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'rgba(255, 255, 255, 0.15)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
          }}
        >
          <div 
            className="sidebar-brand-icon rotate-n-15"
            style={{
              fontSize: '2rem',
              color: '#fff',
              marginRight: '0.75rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '40px',
              height: '40px',
              background: 'rgba(255, 255, 255, 0.2)',
              borderRadius: '12px',
              transform: 'rotate(-15deg)',
              transition: 'all 0.3s ease',
              boxShadow: '0 4px 15px rgba(0, 0, 0, 0.2)'
            }}
          >
          <i className="fas fa-laugh-wink"></i>
        </div>
          <div 
            className="sidebar-brand-text mx-3"
            style={{
              fontSize: '1rem',
              fontWeight: '800',
              color: '#fff',
              textTransform: 'uppercase',
              letterSpacing: '0.1rem',
              textShadow: '0 2px 10px rgba(0, 0, 0, 0.2)'
            }}
          >
            Uptula Admin
          </div>
      </a>

      {/* Divider */}
        <hr 
          className="sidebar-divider my-0" 
          style={{
            borderColor: 'rgba(255, 255, 255, 0.2)',
            margin: '0',
            borderWidth: '1px'
          }}
        />

      {/* Nav Items */}
        <div style={{ padding: '1rem 0' }}>
          {menuItems.map((item, index) => (
            <li 
              key={item.id} 
              className={`nav-item ${item.active ? 'active' : ''}`}
              style={{
                margin: '0.25rem 0.75rem',
                borderRadius: '12px',
                overflow: 'hidden',
                transition: 'all 0.3s ease',
                animation: `slideInLeft 0.5s ease ${index * 0.05}s both`
              }}
            >
          <a
            className="nav-link"
            href="#"
            onClick={(e) => {
              e.preventDefault();
              setActiveTab(item.id);
            }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  padding: '0.875rem 1rem',
                  color: item.active ? '#fff' : 'rgba(255, 255, 255, 0.85)',
                  textDecoration: 'none',
                  borderRadius: '12px',
                  background: item.active 
                    ? 'linear-gradient(135deg, rgba(255, 255, 255, 0.25) 0%, rgba(255, 255, 255, 0.15) 100%)'
                    : 'transparent',
                  borderLeft: item.active ? '4px solid #fff' : '4px solid transparent',
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                  position: 'relative',
                  overflow: 'hidden',
                  boxShadow: item.active ? '0 4px 15px rgba(0, 0, 0, 0.2)' : 'none',
                  transform: item.active ? 'translateX(5px)' : 'translateX(0)'
                }}
                onMouseEnter={(e) => {
                  if (!item.active) {
                    e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
                    e.currentTarget.style.color = '#fff';
                    e.currentTarget.style.transform = 'translateX(5px)';
                    e.currentTarget.style.boxShadow = '0 2px 10px rgba(0, 0, 0, 0.15)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!item.active) {
                    e.currentTarget.style.background = 'transparent';
                    e.currentTarget.style.color = 'rgba(255, 255, 255, 0.85)';
                    e.currentTarget.style.transform = 'translateX(0)';
                    e.currentTarget.style.boxShadow = 'none';
                  }
                }}
              >
                <i 
                  className={item.icon}
                  style={{
                    fontSize: '1.1rem',
                    width: '24px',
                    marginRight: '0.75rem',
                    textAlign: 'center',
                    transition: 'all 0.3s ease',
                    transform: item.active ? 'scale(1.1)' : 'scale(1)'
                  }}
                ></i>
                <span
                  style={{
                    fontSize: '0.875rem',
                    fontWeight: item.active ? '600' : '400',
                    letterSpacing: '0.02rem',
                    transition: 'all 0.3s ease'
                  }}
                >
                  {item.label}
                </span>
                {item.active && (
                  <div
                    style={{
                      position: 'absolute',
                      right: '1rem',
                      width: '6px',
                      height: '6px',
                      background: '#fff',
                      borderRadius: '50%',
                      boxShadow: '0 0 10px rgba(255, 255, 255, 0.8)',
                      animation: 'pulse 2s ease infinite'
                    }}
                  />
                )}
          </a>
        </li>
      ))}
        </div>

      {/* Divider */}
        <hr 
          className="sidebar-divider d-none d-md-block" 
          style={{
            borderColor: 'rgba(255, 255, 255, 0.2)',
            margin: '1.5rem 1rem',
            borderWidth: '1px'
          }}
        />

      {/* Sidebar Toggler (Sidebar) */}
        <div className="text-center d-none d-md-inline" style={{ padding: '1rem' }}>
          <button 
            className="rounded-circle border-0" 
            id="sidebarToggle"
            style={{
              width: '40px',
              height: '40px',
              background: 'rgba(255, 255, 255, 0.15)',
              color: '#fff',
              border: 'none',
              borderRadius: '50%',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto',
              boxShadow: '0 2px 10px rgba(0, 0, 0, 0.2)'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.25)';
              e.currentTarget.style.transform = 'scale(1.1)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.15)';
              e.currentTarget.style.transform = 'scale(1)';
            }}
          >
            <i className="fas fa-chevron-left"></i>
          </button>
      </div>

      {/* Sidebar Message */}
        <div 
          className="sidebar-card d-none d-lg-flex"
          style={{
            margin: '1rem',
            padding: '1.5rem',
            background: 'rgba(255, 255, 255, 0.15)',
            backdropFilter: 'blur(10px)',
            borderRadius: '16px',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            textAlign: 'center',
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.1)',
            transition: 'all 0.3s ease'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'rgba(255, 255, 255, 0.2)';
            e.currentTarget.style.transform = 'translateY(-5px)';
            e.currentTarget.style.boxShadow = '0 6px 25px rgba(0, 0, 0, 0.15)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'rgba(255, 255, 255, 0.15)';
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = '0 4px 20px rgba(0, 0, 0, 0.1)';
          }}
        >
          <div
            style={{
              fontSize: '3rem',
              marginBottom: '1rem',
              filter: 'drop-shadow(0 2px 10px rgba(0, 0, 0, 0.2))'
            }}
          >
            🚀
          </div>
          <p 
            className="text-center mb-2"
            style={{
              color: '#fff',
              fontSize: '0.875rem',
              marginBottom: '0.75rem',
              lineHeight: '1.5'
            }}
          >
            <strong style={{ 
              display: 'block',
              fontSize: '1rem',
              marginBottom: '0.25rem',
              textShadow: '0 2px 5px rgba(0, 0, 0, 0.2)'
            }}>
              Uptula Admin Pro
            </strong>
            <span style={{ opacity: 0.9 }}>
              Manage your platform efficiently
            </span>
        </p>
          <a 
            className="btn btn-success btn-sm" 
            href="#" 
            target="_blank" 
            rel="noopener noreferrer"
            style={{
              background: 'linear-gradient(135deg, #1cc88a 0%, #17a673 100%)',
              border: 'none',
              borderRadius: '8px',
              padding: '0.5rem 1rem',
              color: '#fff',
              fontWeight: '600',
              textDecoration: 'none',
              display: 'inline-block',
              transition: 'all 0.3s ease',
              boxShadow: '0 4px 15px rgba(28, 200, 138, 0.3)'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = '0 6px 20px rgba(28, 200, 138, 0.4)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 4px 15px rgba(28, 200, 138, 0.3)';
            }}
          >
          Upgrade to Pro!
        </a>
      </div>
    </ul>

      <style>{`
        @keyframes gradientShift {
          0% {
            background-position: 0% 50%;
          }
          50% {
            background-position: 100% 50%;
          }
          100% {
            background-position: 0% 50%;
          }
        }

        @keyframes slideInLeft {
          from {
            opacity: 0;
            transform: translateX(-20px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }

        @keyframes pulse {
          0%, 100% {
            opacity: 1;
            transform: scale(1);
          }
          50% {
            opacity: 0.7;
            transform: scale(1.2);
          }
        }

        .sidebar::-webkit-scrollbar {
          width: 0px;
          display: none;
        }

        .sidebar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }

        .sidebar::-webkit-scrollbar-track {
          display: none;
        }

        .sidebar::-webkit-scrollbar-thumb {
          display: none;
        }
      `}</style>
    </>
  );
};

export default AdminSidebar;
