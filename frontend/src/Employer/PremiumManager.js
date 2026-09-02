import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { API_BASE_URL } from '../config/api';
import Header from '../Components/Header';
import Footer from '../Components/Footer';
import EmployerSidebar from './Sidebar';

const EmployerPremiumManager = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [downloadStatus, setDownloadStatus] = useState(null);
  const [currentMembership, setCurrentMembership] = useState(null);
  const [downloadHistory, setDownloadHistory] = useState([]);
  const [loading, setLoading] = useState(true);

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

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const [statusRes, membershipRes, historyRes] = await Promise.all([
        fetch(`${API_BASE_URL}/api/premium/download-status`, {
          headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        }),
        fetch(`${API_BASE_URL}/api/premium/my-membership`, {
          headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        }),
        fetch(`${API_BASE_URL}/api/premium/download-history`, {
          headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        }),
      ]);

      if (statusRes.ok) {
        const data = await statusRes.json();
        setDownloadStatus(data);
      }

      if (membershipRes.ok) {
        const data = await membershipRes.json();
        if (data.membership) {
        setCurrentMembership(data.membership);
        } else {
          setCurrentMembership({
            type: 'Full Access',
            status: 'active',
            isActive: true,
            price: 0,
            endDate: null
          });
        }
      } else {
        setCurrentMembership({
          type: 'Full Access',
          status: 'active',
          isActive: true,
          price: 0,
          endDate: null
        });
      }

      if (historyRes.ok) {
        const data = await historyRes.json();
        setDownloadHistory(data.downloads);
      }
    } catch (error) {
      console.error('Error loading premium data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (authLoading) {
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

  if (loading) {
    return (
      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height: '200px',
          backgroundColor: '#f8f9fc',
        }}
      >
        <div style={{ textAlign: 'center' }}>
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
          <p>Loading premium data...</p>
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
    <>
      <Header />
      <style>{`
        @media (max-width: 991px) {
          .employer-dashboard-sidebar { display: none !important; }
          .employer-dashboard-main {
            width: 100% !important;
            max-width: 100% !important;
            float: none !important;
          }
        }
      `}</style>
      <section className="brows-job-category">
        <div className="container">
          <div className="row">
            {/* Sidebar */}
            <div className="col-md-3 employer-dashboard-sidebar">
              <EmployerSidebar active="premium" />
            </div>

            {/* Main Content */}
            <div className="col-md-9 employer-dashboard-main">
              <div style={{ padding: '20px', backgroundColor: '#f8f9fc', minHeight: '100vh' }}>
                  <div
                    style={{
                    backgroundColor: '#e3f2fd',
                    color: '#0c4a6e',
                      padding: '12px',
                      borderRadius: '4px',
                      marginBottom: '20px',
                    border: '1px solid #90caf9',
                    }}
                  >
                  All employer accounts currently have full premium access while we finish integrating the new billing experience.
                  </div>

                {/* Download Status */}
                {downloadStatus && (
                  <div
                    style={{
                      backgroundColor: 'white',
                      borderRadius: '8px',
                      boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                      padding: '20px',
                      marginBottom: '20px',
                    }}
                  >
                    <h2 style={{ color: '#333', marginBottom: '20px' }}>📊 Download Status</h2>
                    <div
                      style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                        gap: '20px',
                      }}
                    >
                      <div style={{ textAlign: 'center' }}>
                        <div
                          style={{
                            fontSize: '32px',
                            fontWeight: 'bold',
                            color: downloadStatus.isPremium ? '#28a745' : '#ffc107',
                          }}
                        >
                          {downloadStatus.remainingDownloads}
                        </div>
                        <div style={{ color: '#666' }}>Remaining Downloads</div>
                      </div>
                      <div style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#007bff' }}>
                          {downloadStatus.dailyDownloads}
                        </div>
                        <div style={{ color: '#666' }}>Today's Downloads</div>
                      </div>
                      <div style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#6c757d' }}>
                          {downloadStatus.dailyLimit}
                        </div>
                        <div style={{ color: '#666' }}>Daily Limit</div>
                      </div>
                      <div style={{ textAlign: 'center' }}>
                        <div
                          style={{
                            fontSize: '32px',
                            fontWeight: 'bold',
                            color: downloadStatus.isPremium ? '#28a745' : '#6c757d',
                          }}
                        >
                          {downloadStatus.isPremium ? '⭐' : '🔒'}
                        </div>
                        <div style={{ color: '#666' }}>Status</div>
                      </div>
                    </div>

                  </div>
                )}

                {/* Current Membership */}
                {currentMembership && (
                  <div
                    style={{
                      backgroundColor: 'white',
                      borderRadius: '8px',
                      boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                      padding: '20px',
                      marginBottom: '20px',
                    }}
                  >
                    <h2 style={{ color: '#333', marginBottom: '20px' }}>⭐ Current Membership</h2>
                    <div
                      style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                        gap: '20px',
                      }}
                    >
                      <div>
                        <strong>Type:</strong> {currentMembership.type}
                      </div>
                      <div>
                        <strong>Status:</strong>
                        <span
                          style={{
                            padding: '4px 8px',
                            borderRadius: '12px',
                            fontSize: '12px',
                            backgroundColor: currentMembership.isActive ? '#d4edda' : '#f8d7da',
                            color: currentMembership.isActive ? '#155724' : '#721c24',
                            marginLeft: '8px',
                          }}
                        >
                          {currentMembership.status}
                        </span>
                      </div>
                      <div>
                        <strong>Price:</strong> ${currentMembership.price ?? 0}
                      </div>
                      <div>
                        <strong>Expires:</strong>{' '}
                        {currentMembership.endDate
                          ? new Date(currentMembership.endDate).toLocaleDateString()
                          : 'Never'}
                      </div>
                    </div>
                  </div>
                )}

                <div
                  style={{
                    backgroundColor: '#f1f5f9',
                    borderRadius: '8px',
                    padding: '20px',
                    marginBottom: '20px',
                    border: '1px dashed #94a3b8'
                  }}
                >
                  <h3 style={{ color: '#0f172a', marginBottom: '10px' }}>Billing temporarily disabled</h3>
                  <p style={{ margin: 0, color: '#475569' }}>
                    Payment and plan selection are currently paused. Every employer receives enterprise-level access by default until the new payment flow is launched.
                  </p>
                </div>

                {/* Download History */}
                <div
                  style={{
                    backgroundColor: 'white',
                    borderRadius: '8px',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                    padding: '20px',
                  }}
                >
                  <h2 style={{ color: '#333', marginBottom: '20px' }}>📥 Download History</h2>
                  {downloadHistory.length === 0 ? (
                    <p style={{ color: '#666', textAlign: 'center' }}>No downloads yet</p>
                  ) : (
                    <div style={{ overflowX: 'auto' }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                          <tr style={{ backgroundColor: '#f8f9fc' }}>
                            <th style={{ padding: '15px', textAlign: 'left', borderBottom: '1px solid #eee' }}>
                              Date
                            </th>
                            <th style={{ padding: '15px', textAlign: 'left', borderBottom: '1px solid #eee' }}>
                              Candidate
                            </th>
                            <th style={{ padding: '15px', textAlign: 'left', borderBottom: '1px solid #eee' }}>
                              Job Title
                            </th>
                            <th style={{ padding: '15px', textAlign: 'left', borderBottom: '1px solid #eee' }}>
                              Company
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {downloadHistory.map((download) => (
                            <tr key={download.id} style={{ borderBottom: '1px solid #eee' }}>
                              <td style={{ padding: '15px' }}>
                                {new Date(download.download_date).toLocaleDateString()}
                              </td>
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
            </div> {/* closes col-md-9 */}
          </div> {/* closes row */}
        </div> {/* closes container */}
      </section>
      <Footer />
    </>
  );
};

export default EmployerPremiumManager;
