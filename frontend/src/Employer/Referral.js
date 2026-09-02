import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import Header from "../Components/Header";
import Footer from "../Components/Footer";
import EmployerSidebar from "./Sidebar";
import { API_BASE_URL } from "../config/api";

function Referral() {
  
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [message, setMessage] = useState("");
  const [referralCode, setReferralCode] = useState("");
  const [referrals, setReferrals] = useState([]);

  useEffect(() => {
    if (!user) { navigate('/'); return; }
    if (user.role !== 'provider') { navigate('/'); return; }
    loadReferralCode();
    loadReferrals();
  }, [user, navigate]);

  const loadReferralCode = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;
      const resp = await fetch(`${API_BASE_URL}/api/employer/referral/code`, {
        headers: { 'Authorization': `Bearer ${token}`, 'Accept': 'application/json' },
        credentials: 'include'
      });
      if (resp.ok) {
        const data = await resp.json();
        setReferralCode(data.referralCode);
      }
    } catch (_) {}
  };

  const loadReferrals = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;
      const resp = await fetch(`${API_BASE_URL}/api/employer/referral/list`, {
        headers: { 'Authorization': `Bearer ${token}`, 'Accept': 'application/json' },
        credentials: 'include'
      });
      if (resp.ok) {
        const data = await resp.json();
        setReferrals(Array.isArray(data.referrals) ? data.referrals : []);
      }
    } catch (_) {}
  };

  if (authLoading) return null;
  if (!user || user.role !== 'provider') return null;

  const referralLink = referralCode ? `${window.location.origin}/register?ref=${referralCode}` : '';

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
        .ref-card {
          border: 1px solid #e2e8f0;
          border-radius: 12px;
          overflow: hidden;
          box-shadow: 0 8px 24px rgba(15, 23, 42, 0.08);
          background: #fff;
        }
        .ref-card .card-header {
          background: linear-gradient(90deg, #f8fafc 0%, #eef6ff 100%);
          border-bottom: 1px solid #e2e8f0;
          padding: 14px 18px;
        }
        .ref-card .card-header h4 {
          margin: 0;
          font-size: 18px;
          font-weight: 700;
          color: #0f172a;
          letter-spacing: 0.2px;
        }
        .ref-link-input {
          border: 1px solid #dbe5f1 !important;
          border-radius: 10px !important;
          box-shadow: 0 1px 2px rgba(15, 23, 42, 0.03);
        }
        .ref-table thead th {
          font-weight: 700;
          font-size: 12px;
          text-transform: uppercase;
          letter-spacing: 0.45px;
          color: #334155;
          background: #f8fafc;
          border-bottom: 1px solid #dbe5f1;
          vertical-align: middle;
        }
        .ref-table tbody td {
          vertical-align: middle;
          color: #0f172a;
          border-top: 1px solid #edf2f7;
        }
        .ref-table tbody tr:hover {
          background: #f8fbff;
        }
      `}</style>
      <section className="padd-top-80 padd-bot-80">
        <div className="container">
          {message && (
            <div className="alert alert-info" style={{marginBottom: '20px'}}>{message}</div>
          )}
          <div className="row">
            <div className="col-md-3 employer-dashboard-sidebar">
              <EmployerSidebar active="referral" />
            </div>
            <div className="col-md-9 employer-dashboard-main">
              <div className="card ref-card">
                <div className="card-header">
                  <h4><i className="ti-link" style={{ marginRight: 8, color: '#16a34a' }} />Your Referral Link</h4>
                </div>
                <div className="card-body">
                  {referralLink ? (
                    <div>
                      <input className="form-control ref-link-input" value={referralLink} readOnly />
                      <small className="form-text text-muted">Share this link. When someone registers using it, you'll see them below.</small>
                    </div>
                  ) : (
                    <p>Generating your referral link...</p>
                  )}
                </div>
              </div>

              <div className="card ref-card" style={{marginTop: '20px'}}>
                <div className="card-header"><h4><i className="ti-user" style={{ marginRight: 8, color: '#16a34a' }} />Your Referrals</h4></div>
                <div className="card-body">
                  <div className="table-responsive">
                    <table className="table table-striped ref-table">
                      <thead>
                        <tr>
                          <th><i className="ti-calendar" style={{ marginRight: 6, color: '#16a34a' }} />Date</th>
                          <th><i className="ti-check-box" style={{ marginRight: 6, color: '#16a34a' }} />Status</th>
                          <th><i className="ti-user" style={{ marginRight: 6, color: '#16a34a' }} />Name</th>
                          <th><i className="ti-email" style={{ marginRight: 6, color: '#16a34a' }} />Email</th>
                          <th><i className="ti-ticket" style={{ marginRight: 6, color: '#16a34a' }} />Code</th>
                        </tr>
                      </thead>
                      <tbody>
                        {referrals.length === 0 && (
                          <tr><td colSpan="5">No referrals yet.</td></tr>
                        )}
                        {referrals.map(r => (
                          <tr key={r.id}>
                            <td>{new Date(r.created_at).toLocaleString()}</td>
                            <td>{r.status}</td>
                            <td>{r.referred_name || '-'}</td>
                            <td>{r.referred_email || '-'}</td>
                            <td>{r.referral_code}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
      <Footer />
    </>
  );
}

export default Referral;
