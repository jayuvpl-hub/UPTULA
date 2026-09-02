import React, { useEffect, useState } from "react";
import EmployerSidebar from "./Sidebar";
import { useAuth } from "../context/AuthContext";
import { API_BASE_URL } from "../config/api";

function Support() {
  // AuthContext does not expose token; read it from localStorage
  const token = localStorage.getItem('token');
  const [form, setForm] = useState({ subject: "", category: "general", priority: "medium", description: "" });
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchTickets = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`${API_BASE_URL}/api/employer/tickets?page=1&limit=50`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.message || "Failed to load tickets");
      } else {
        setTickets(data.tickets || []);
      }
    } catch (e) {
      setError("Network error: " + e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTickets();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const submitTicket = async (e) => {
    e.preventDefault();
    setError("");
    try {
      const res = await fetch(`${API_BASE_URL}/api/employer/tickets`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(form)
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.message || "Failed to create ticket");
        return;
      }
      setForm({ subject: "", category: "general", priority: "medium", description: "" });
      setTickets(prev => [data.ticket, ...prev]);
      alert(`Ticket #${data.ticket?.id || ''} created successfully`);
    } catch (e) {
      setError("Network error: " + e.message);
    }
  };

  return (
    <div className="container">
      <style>{`
        @media (max-width: 991px) {
          .employer-dashboard-sidebar { display: none !important; }
          .employer-dashboard-main {
            width: 100% !important;
            max-width: 100% !important;
            float: none !important;
          }
        }
        .sup-card {
          border: 1px solid #e2e8f0;
          border-radius: 12px;
          overflow: hidden;
          box-shadow: 0 8px 24px rgba(15, 23, 42, 0.08);
          background: #fff;
        }
        .sup-card .card-header {
          background: linear-gradient(90deg, #f8fafc 0%, #eef6ff 100%);
          border-bottom: 1px solid #e2e8f0;
          padding: 14px 18px;
          font-weight: 700;
          color: #0f172a;
          letter-spacing: 0.2px;
        }
        .sup-form .form-group > label {
          font-weight: 600;
          color: #1f3b5b;
          display: inline-flex;
          align-items: center;
          gap: 6px;
        }
        .sup-form .form-control {
          border: 1px solid #dbe5f1;
          border-radius: 10px;
          box-shadow: 0 1px 2px rgba(15, 23, 42, 0.03);
        }
        .sup-form .form-control:focus {
          border-color: #22c55e;
          box-shadow: 0 0 0 3px rgba(34, 197, 94, 0.12);
        }
        .sup-table thead th {
          font-weight: 700;
          font-size: 12px;
          text-transform: uppercase;
          letter-spacing: 0.45px;
          color: #334155;
          background: #f8fafc;
          border-bottom: 1px solid #dbe5f1;
          vertical-align: middle;
        }
        .sup-table tbody td {
          vertical-align: middle;
          border-top: 1px solid #edf2f7;
        }
        .sup-table tbody tr:hover {
          background: #f8fbff;
        }
      `}</style>
      <div className="row">
        <div className="col-md-3 employer-dashboard-sidebar">
          <EmployerSidebar active="support" />
        </div>
        <div className="col-md-9 employer-dashboard-main">
          <div className="dashboard-heading">
            <h3><i className="ti-headphone" style={{ marginRight: 8, color: '#16a34a' }} />Support & Tickets</h3>
            <p>Raise an issue ticket for billing, login, job posting or general queries.</p>
          </div>
          <div className="dashboard-content">
            {error && <div className="alert alert-danger">{error}</div>}
            <div className="card sup-card" style={{ marginBottom: 20 }}>
              <div className="card-header"><i className="ti-plus" style={{ marginRight: 8, color: '#16a34a' }} />Create Ticket</div>
              <div className="card-body">
                <form onSubmit={submitTicket} className="sup-form">
                  <div className="form-group">
                    <label><i className="ti-text" style={{ color: '#16a34a' }} />Subject</label>
                    <input className="form-control" required value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} />
                  </div>
                  <div className="form-row" style={{ display: 'flex', gap: 10, marginTop: 10 }}>
                    <div className="form-group" style={{ flex: 1 }}>
                      <label><i className="ti-tag" style={{ color: '#16a34a' }} />Category</label>
                      <select className="form-control" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
                        <option value="general">General</option>
                        <option value="billing">Billing</option>
                        <option value="login">Login</option>
                        <option value="job_posting">Job Posting</option>
                      </select>
                    </div>
                    <div className="form-group" style={{ flex: 1 }}>
                      <label><i className="ti-flag" style={{ color: '#16a34a' }} />Priority</label>
                      <select className="form-control" value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value })}>
                        <option value="low">Low</option>
                        <option value="medium">Medium</option>
                        <option value="high">High</option>
                        <option value="urgent">Urgent</option>
                      </select>
                    </div>
                  </div>
                  <div className="form-group" style={{ marginTop: 10 }}>
                    <label><i className="ti-align-left" style={{ color: '#16a34a' }} />Description</label>
                    <textarea rows="5" className="form-control" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
                  </div>
                  <button className="btn btn-primary" type="submit" style={{ marginTop: 10 }}>Submit Ticket</button>
                </form>
              </div>
            </div>

            <div className="card sup-card">
              <div className="card-header"><i className="ti-ticket" style={{ marginRight: 8, color: '#16a34a' }} />My Tickets</div>
              <div className="card-body">
                {loading ? (
                  <div>Loading tickets...</div>
                ) : (
                  <div>
                    {tickets.length === 0 ? (
                      <div>No tickets yet.</div>
                    ) : (
                      <div className="table-responsive">
                        <table className="table sup-table">
                          <thead>
                            <tr>
                              <th><i className="ti-hashtag" style={{ marginRight: 6, color: '#16a34a' }} />ID</th>
                              <th><i className="ti-text" style={{ marginRight: 6, color: '#16a34a' }} />Subject</th>
                              <th><i className="ti-tag" style={{ marginRight: 6, color: '#16a34a' }} />Category</th>
                              <th><i className="ti-flag" style={{ marginRight: 6, color: '#16a34a' }} />Priority</th>
                              <th><i className="ti-check-box" style={{ marginRight: 6, color: '#16a34a' }} />Status</th>
                              <th><i className="ti-calendar" style={{ marginRight: 6, color: '#16a34a' }} />Created</th>
                            </tr>
                          </thead>
                          <tbody>
                            {tickets.map(t => (
                              <tr key={t.id}>
                                <td>{t.id}</td>
                                <td>{t.subject}</td>
                                <td>{t.category}</td>
                                <td>{t.priority}</td>
                                <td style={{ textTransform: 'capitalize' }}>{t.status}</td>
                                <td>{new Date(t.created_at).toLocaleString()}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Support;


