import React, { useEffect } from 'react';
import { useAdmin } from '../AdminContext';

const DashboardOverview = () => {
  const { stats, fetchStats, loading } = useAdmin();

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  const statCards = [
    {
      title: 'Total Candidates',
      value: stats.totalCandidates,
      icon: 'fas fa-users',
      color: 'primary',
      borderColor: 'border-left-primary'
    },
    {
      title: 'Total Employers',
      value: stats.totalEmployers,
      icon: 'fas fa-building',
      color: 'success',
      borderColor: 'border-left-success'
    },
    {
      title: 'Total Jobs',
      value: stats.totalJobs,
      icon: 'fas fa-briefcase',
      color: 'info',
      borderColor: 'border-left-info'
    },
    {
      title: 'Premium Members',
      value: stats.premiumMembers,
      icon: 'fas fa-crown',
      color: 'warning',
      borderColor: 'border-left-warning'
    }
  ];

  return (
    <>
      {/* Page Heading */}
      <div className="d-sm-flex align-items-center justify-content-between mb-4">
        <h1 className="h3 mb-0 text-gray-800">Dashboard Overview</h1>
        <a href="#" className="d-none d-sm-inline-block btn btn-sm btn-primary shadow-sm">
          <i className="fas fa-download fa-sm text-white-50"></i> Generate Report
        </a>
      </div>

      {/* Content Row */}
      <div className="row">
        {statCards.map((card, index) => (
          <div key={index} className="col-xl-3 col-md-6 mb-4">
            <div className={`card ${card.borderColor} shadow h-100 py-2`}>
              <div className="card-body">
                <div className="row no-gutters align-items-center">
                  <div className="col mr-2">
                    <div className={`text-xs font-weight-bold text-${card.color} text-uppercase mb-1`}>
                      {card.title}
                    </div>
                    <div className="h5 mb-0 font-weight-bold text-gray-800">
                      {loading ? '...' : card.value}
                    </div>
                  </div>
                  <div className="col-auto">
                    <i className={`${card.icon} fa-2x text-gray-300`}></i>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Content Row */}
      <div className="row">
        {/* Analytics - Last 12 Months */}
        <div className="col-xl-8 col-lg-7">
          <div 
            className="card shadow mb-4"
            style={{
              borderRadius: '16px',
              border: 'none',
              overflow: 'hidden',
              transition: 'all 0.3s ease'
            }}
          >
            <div 
              className="card-header py-3 d-flex flex-row align-items-center justify-content-between"
              style={{
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                borderBottom: 'none'
              }}
            >
              <h6 
                className="m-0 font-weight-bold"
                style={{
                  color: '#fff',
                  fontSize: '1rem',
                  fontWeight: '600',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem'
                }}
              >
                <i className="fas fa-chart-area"></i>
                Analytics (Last 12 Months)
              </h6>
              <div className="dropdown no-arrow">
                <a 
                  className="dropdown-toggle" 
                  href="#" 
                  role="button" 
                  id="dropdownMenuLink" 
                  data-toggle="dropdown" 
                  aria-haspopup="true" 
                  aria-expanded="false"
                  style={{
                    color: '#fff',
                    textDecoration: 'none',
                    padding: '0.5rem',
                    borderRadius: '8px',
                    transition: 'all 0.3s ease'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'rgba(255, 255, 255, 0.2)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'transparent';
                  }}
                >
                  <i className="fas fa-ellipsis-v fa-sm fa-fw"></i>
                </a>
                <div 
                  className="dropdown-menu dropdown-menu-right shadow animated--fade-in" 
                  aria-labelledby="dropdownMenuLink"
                  style={{
                    borderRadius: '12px',
                    border: 'none',
                    boxShadow: '0 10px 40px rgba(0, 0, 0, 0.15)'
                  }}
                >
                  <div className="dropdown-header" style={{ fontWeight: '600', color: '#667eea' }}>Actions:</div>
                  <a className="dropdown-item" href="#" style={{ padding: '0.5rem 1rem' }}>Download Report</a>
                  <a className="dropdown-item" href="#" style={{ padding: '0.5rem 1rem' }}>View Details</a>
                  <div className="dropdown-divider" style={{ margin: '0.5rem 0' }}></div>
                  <a className="dropdown-item" href="#" style={{ padding: '0.5rem 1rem' }}>Settings</a>
                </div>
              </div>
            </div>
            <div className="card-body" style={{ padding: '2rem' }}>
              <div className="chart-area" style={{ position: 'relative', height: '320px' }}>
                <canvas id="myAreaChart"></canvas>
                {/* Animated placeholder */}
                <div style={{
                  position: 'absolute',
                  top: '50%',
                  left: '50%',
                  transform: 'translate(-50%, -50%)',
                  textAlign: 'center',
                  color: '#858796',
                  zIndex: 0
                }}>
                  <i className="fas fa-chart-line" style={{ fontSize: '3rem', marginBottom: '1rem', opacity: 0.3 }}></i>
                  <p style={{ fontSize: '0.875rem', opacity: 0.5 }}>Analytics data visualization</p>
                </div>
              </div>
              
              {/* Stats below chart */}
              <div className="row mt-4" style={{ paddingTop: '1rem', borderTop: '1px solid rgba(0, 0, 0, 0.05)' }}>
                <div className="col-md-4 text-center">
                  <div style={{ marginBottom: '0.5rem', color: '#667eea', fontSize: '1.5rem', fontWeight: '700' }}>
                    {loading ? '...' : '12.5K'}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: '#858796', textTransform: 'uppercase', letterSpacing: '0.05rem' }}>
                    Total Views
                  </div>
                </div>
                <div className="col-md-4 text-center">
                  <div style={{ marginBottom: '0.5rem', color: '#1cc88a', fontSize: '1.5rem', fontWeight: '700' }}>
                    {loading ? '...' : '8.2K'}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: '#858796', textTransform: 'uppercase', letterSpacing: '0.05rem' }}>
                    Active Users
                  </div>
                </div>
                <div className="col-md-4 text-center">
                  <div style={{ marginBottom: '0.5rem', color: '#f6c23e', fontSize: '1.5rem', fontWeight: '700' }}>
                    {loading ? '...' : '45%'}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: '#858796', textTransform: 'uppercase', letterSpacing: '0.05rem' }}>
                    Growth Rate
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Employer Registrations */}
        <div className="col-xl-4 col-lg-5">
          <div 
            className="card shadow mb-4"
            style={{
              borderRadius: '16px',
              border: 'none',
              overflow: 'hidden',
              transition: 'all 0.3s ease'
            }}
          >
            <div 
              className="card-header py-3 d-flex flex-row align-items-center justify-content-between"
              style={{
                background: 'linear-gradient(135deg, #1cc88a 0%, #17a673 100%)',
                borderBottom: 'none'
              }}
            >
              <h6 
                className="m-0 font-weight-bold"
                style={{
                  color: '#fff',
                  fontSize: '1rem',
                  fontWeight: '600',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem'
                }}
              >
                <i className="fas fa-user-plus"></i>
                Employer Registrations
              </h6>
              <div className="dropdown no-arrow">
                <a 
                  className="dropdown-toggle" 
                  href="#" 
                  role="button" 
                  style={{
                    color: '#fff',
                    textDecoration: 'none',
                    padding: '0.5rem',
                    borderRadius: '8px',
                    transition: 'all 0.3s ease'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'rgba(255, 255, 255, 0.2)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'transparent';
                  }}
                >
                  <i className="fas fa-ellipsis-v fa-sm fa-fw"></i>
                </a>
                </div>
              </div>
            <div className="card-body" style={{ padding: '2rem' }}>
              <div className="chart-pie" style={{ position: 'relative', height: '200px', marginBottom: '1.5rem' }}>
                <canvas id="myPieChart"></canvas>
                {/* Animated placeholder */}
                <div style={{
                  position: 'absolute',
                  top: '50%',
                  left: '50%',
                  transform: 'translate(-50%, -50%)',
                  textAlign: 'center',
                  zIndex: 0
                }}>
                  <i className="fas fa-chart-pie" style={{ fontSize: '2.5rem', color: '#1cc88a', opacity: 0.3 }}></i>
            </div>
              </div>
              <div className="mt-4 text-center small">
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', textAlign: 'left' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.5rem', borderRadius: '8px', background: 'rgba(102, 126, 234, 0.05)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#667eea' }}></div>
                      <span style={{ fontSize: '0.875rem', color: '#5a5c69' }}>New Employers</span>
                    </div>
                    <span style={{ fontWeight: '700', color: '#667eea' }}>{loading ? '...' : '45'}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.5rem', borderRadius: '8px', background: 'rgba(28, 200, 138, 0.05)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#1cc88a' }}></div>
                      <span style={{ fontSize: '0.875rem', color: '#5a5c69' }}>Active Employers</span>
                    </div>
                    <span style={{ fontWeight: '700', color: '#1cc88a' }}>{loading ? '...' : '128'}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.5rem', borderRadius: '8px', background: 'rgba(54, 185, 204, 0.05)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#36b9cc' }}></div>
                      <span style={{ fontSize: '0.875rem', color: '#5a5c69' }}>Pending Approval</span>
                    </div>
                    <span style={{ fontWeight: '700', color: '#36b9cc' }}>{loading ? '...' : '12'}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content Row */}
      <div className="row">
        {/* Payments (Revenue) */}
        <div className="col-lg-6 mb-4">
          <div 
            className="card shadow mb-4"
            style={{
              borderRadius: '16px',
              border: 'none',
              overflow: 'hidden',
              transition: 'all 0.3s ease'
            }}
          >
            <div 
              className="card-header py-3"
              style={{
                background: 'linear-gradient(135deg, #f6c23e 0%, #e0a800 100%)',
                borderBottom: 'none'
              }}
            >
              <h6 
                className="m-0 font-weight-bold"
                style={{
                  color: '#fff',
                  fontSize: '1rem',
                  fontWeight: '600',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem'
                }}
              >
                <i className="fas fa-dollar-sign"></i>
                Payments (Revenue)
              </h6>
            </div>
            <div className="card-body" style={{ padding: '2rem' }}>
              {/* Revenue Stats */}
              <div style={{ marginBottom: '2rem' }}>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem', marginBottom: '0.5rem' }}>
                  <div style={{
                    fontSize: '2.5rem',
                    fontWeight: '700',
                    background: 'linear-gradient(135deg, #f6c23e 0%, #e0a800 100%)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    backgroundClip: 'text'
                  }}>
                    {loading ? '...' : '$45,890'}
                  </div>
                  <div style={{
                    background: 'rgba(28, 200, 138, 0.1)',
                    color: '#1cc88a',
                    padding: '0.25rem 0.75rem',
                    borderRadius: '20px',
                    fontSize: '0.75rem',
                    fontWeight: '600'
                  }}>
                    <i className="fas fa-arrow-up"></i> 12.5%
                  </div>
                </div>
                <div style={{ fontSize: '0.875rem', color: '#858796' }}>
                  Total revenue this month
                </div>
              </div>

              {/* Revenue Breakdown */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                    <span style={{ fontSize: '0.875rem', color: '#5a5c69', fontWeight: '600' }}>Premium Subscriptions</span>
                    <span style={{ fontSize: '0.875rem', fontWeight: '700', color: '#667eea' }}>$28,450</span>
                  </div>
                  <div style={{ position: 'relative', height: '8px', background: 'rgba(102, 126, 234, 0.1)', borderRadius: '4px', overflow: 'hidden' }}>
                    <div style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      height: '100%',
                      width: '62%',
                      background: 'linear-gradient(90deg, #667eea 0%, #764ba2 100%)',
                      borderRadius: '4px',
                      animation: 'slideIn 1s ease-out'
                    }}></div>
                  </div>
                </div>

                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                    <span style={{ fontSize: '0.875rem', color: '#5a5c69', fontWeight: '600' }}>Job Postings</span>
                    <span style={{ fontSize: '0.875rem', fontWeight: '700', color: '#1cc88a' }}>$12,340</span>
                  </div>
                  <div style={{ position: 'relative', height: '8px', background: 'rgba(28, 200, 138, 0.1)', borderRadius: '4px', overflow: 'hidden' }}>
                    <div style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      height: '100%',
                      width: '27%',
                      background: 'linear-gradient(90deg, #1cc88a 0%, #17a673 100%)',
                      borderRadius: '4px',
                      animation: 'slideIn 1.2s ease-out'
                    }}></div>
            </div>
              </div>

                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                    <span style={{ fontSize: '0.875rem', color: '#5a5c69', fontWeight: '600' }}>Featured Listings</span>
                    <span style={{ fontSize: '0.875rem', fontWeight: '700', color: '#36b9cc' }}>$5,100</span>
              </div>
                  <div style={{ position: 'relative', height: '8px', background: 'rgba(54, 185, 204, 0.1)', borderRadius: '4px', overflow: 'hidden' }}>
                    <div style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      height: '100%',
                      width: '11%',
                      background: 'linear-gradient(90deg, #36b9cc 0%, #2c9faf 100%)',
                      borderRadius: '4px',
                      animation: 'slideIn 1.4s ease-out'
                    }}></div>
              </div>
              </div>
              </div>
            </div>
          </div>
        </div>

        {/* Customer Service — Recent Tickets */}
        <div className="col-lg-6 mb-4">
          <div 
            className="card shadow mb-4"
            style={{
              borderRadius: '16px',
              border: 'none',
              overflow: 'hidden',
              transition: 'all 0.3s ease'
            }}
          >
            <div 
              className="card-header py-3"
              style={{
                background: 'linear-gradient(135deg, #e74a3b 0%, #c0392b 100%)',
                borderBottom: 'none'
              }}
            >
              <h6 
                className="m-0 font-weight-bold"
                style={{
                  color: '#fff',
                  fontSize: '1rem',
                  fontWeight: '600',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem'
                }}
              >
                <i className="fas fa-ticket-alt"></i>
                Customer Service — Recent Tickets
              </h6>
            </div>
            <div className="card-body" style={{ padding: '1.5rem' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {/* Ticket 1 */}
                <div 
                  style={{
                    padding: '1rem',
                    borderRadius: '12px',
                    border: '1px solid rgba(0, 0, 0, 0.05)',
                    transition: 'all 0.3s ease',
                    cursor: 'pointer'
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
                        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#fff',
                        fontWeight: '700',
                        fontSize: '0.875rem'
                      }}>
                        JD
                      </div>
                      <div>
                        <div style={{ fontWeight: '600', fontSize: '0.875rem', color: '#5a5c69' }}>John Doe</div>
                        <div style={{ fontSize: '0.75rem', color: '#858796' }}>2 hours ago</div>
                      </div>
                    </div>
                    <span style={{
                      padding: '0.25rem 0.75rem',
                      borderRadius: '20px',
                      fontSize: '0.75rem',
                      fontWeight: '600',
                      background: 'rgba(231, 74, 59, 0.1)',
                      color: '#e74a3b'
                    }}>
                      High
                    </span>
                  </div>
                  <div style={{ fontSize: '0.875rem', color: '#5a5c69', marginTop: '0.5rem' }}>
                    Unable to post job listing - Error 500
                  </div>
                </div>

                {/* Ticket 2 */}
                <div 
                  style={{
                    padding: '1rem',
                    borderRadius: '12px',
                    border: '1px solid rgba(0, 0, 0, 0.05)',
                    transition: 'all 0.3s ease',
                    cursor: 'pointer'
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
                        background: 'linear-gradient(135deg, #1cc88a 0%, #17a673 100%)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#fff',
                        fontWeight: '700',
                        fontSize: '0.875rem'
                      }}>
                        SA
                      </div>
                      <div>
                        <div style={{ fontWeight: '600', fontSize: '0.875rem', color: '#5a5c69' }}>Sarah Anderson</div>
                        <div style={{ fontSize: '0.75rem', color: '#858796' }}>5 hours ago</div>
                      </div>
            </div>
                    <span style={{
                      padding: '0.25rem 0.75rem',
                      borderRadius: '20px',
                      fontSize: '0.75rem',
                      fontWeight: '600',
                      background: 'rgba(246, 194, 62, 0.1)',
                      color: '#f6c23e'
                    }}>
                      Medium
                    </span>
              </div>
                  <div style={{ fontSize: '0.875rem', color: '#5a5c69', marginTop: '0.5rem' }}>
                    Payment not reflecting in account
            </div>
          </div>

                {/* Ticket 3 */}
                <div 
                  style={{
                    padding: '1rem',
                    borderRadius: '12px',
                    border: '1px solid rgba(0, 0, 0, 0.05)',
                    transition: 'all 0.3s ease',
                    cursor: 'pointer'
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
                        background: 'linear-gradient(135deg, #36b9cc 0%, #2c9faf 100%)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#fff',
                        fontWeight: '700',
                        fontSize: '0.875rem'
                      }}>
                        MB
                      </div>
                      <div>
                        <div style={{ fontWeight: '600', fontSize: '0.875rem', color: '#5a5c69' }}>Mike Brown</div>
                        <div style={{ fontSize: '0.75rem', color: '#858796' }}>1 day ago</div>
                      </div>
            </div>
                    <span style={{
                      padding: '0.25rem 0.75rem',
                      borderRadius: '20px',
                      fontSize: '0.75rem',
                      fontWeight: '600',
                      background: 'rgba(54, 185, 204, 0.1)',
                      color: '#36b9cc'
                    }}>
                      Low
                    </span>
                </div>
                  <div style={{ fontSize: '0.875rem', color: '#5a5c69', marginTop: '0.5rem' }}>
                    Question about premium features
                </div>
                </div>

                {/* View All Button */}
                <a 
                  href="#" 
                  style={{
                    display: 'block',
                    textAlign: 'center',
                    padding: '0.75rem',
                    borderRadius: '10px',
                    background: 'linear-gradient(135deg, rgba(231, 74, 59, 0.05) 0%, rgba(192, 57, 43, 0.05) 100%)',
                    color: '#e74a3b',
                    textDecoration: 'none',
                    fontWeight: '600',
                    fontSize: '0.875rem',
                    transition: 'all 0.3s ease'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'linear-gradient(135deg, rgba(231, 74, 59, 0.1) 0%, rgba(192, 57, 43, 0.1) 100%)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'linear-gradient(135deg, rgba(231, 74, 59, 0.05) 0%, rgba(192, 57, 43, 0.05) 100%)';
                  }}
                >
                  View All Tickets <i className="fas fa-arrow-right ml-2"></i>
                </a>
                </div>
              </div>
            </div>
          </div>
        </div>

      <style>{`
        @keyframes slideIn {
          from {
            width: 0;
          }
        }
      `}</style>
    </>
  );
};

export default DashboardOverview;
