import React, { useCallback, useEffect, useState } from 'react';
import { API_BASE_URL } from '../config/api';

const inputStyle = { padding: '10px 12px', border: '2px solid #e8eaf6', borderRadius: 8, fontSize: 14, minWidth: 160 };
const th = { padding: 10, textAlign: 'left', fontSize: 13 };
const td = { padding: 10, borderTop: '1px solid #e8eaf6', fontSize: 13 };

function UserManagement() {
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [q, setQ] = useState('');
  const [role, setRole] = useState('');
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [detail, setDetail] = useState(null);

  const token = () => localStorage.getItem('adminToken');
  const headers = () => ({ Authorization: `Bearer ${token()}`, 'Content-Type': 'application/json' });

  const loadStats = useCallback(async () => {
    const res = await fetch(`${API_BASE_URL}/api/admin/users/stats`, { headers: headers() });
    if (res.ok) setStats((await res.json()).stats);
  }, []);

  const loadUsers = useCallback(async () => {
    const params = new URLSearchParams({ limit: '50' });
    if (q) params.set('q', q);
    if (role) params.set('role', role);
    if (status) params.set('status', status);
    const res = await fetch(`${API_BASE_URL}/api/admin/users?${params}`, { headers: headers() });
    if (res.ok) setUsers((await res.json()).users || []);
  }, [q, role, status]);

  const refresh = useCallback(async () => {
    setLoading(true); setMessage('');
    try { await Promise.all([loadStats(), loadUsers()]); } catch { setMessage('Failed to load'); }
    setLoading(false);
  }, [loadStats, loadUsers]);

  useEffect(() => { refresh(); }, [refresh]);

  const viewDetail = async (id) => {
    const res = await fetch(`${API_BASE_URL}/api/admin/users/${id}`, { headers: headers() });
    if (res.ok) setDetail(await res.json());
  };

  const setUserStatus = async (u, next) => {
    await fetch(`${API_BASE_URL}/api/admin/users/${u.id}/status`, { method: 'PATCH', headers: headers(), body: JSON.stringify({ status: next }) });
    refresh();
    if (detail && detail.user.id === u.id) viewDetail(u.id);
  };

  const deleteUser = async (u) => {
    if (!window.confirm(`Delete ${u.full_name || u.email}? This cannot be undone.`)) return;
    await fetch(`${API_BASE_URL}/api/admin/users/${u.id}`, { method: 'DELETE', headers: headers() });
    setDetail(null); refresh();
  };

  return (
    <div style={{ padding: 24 }}>
      <h2 style={{ marginTop: 0 }}>User Management</h2>
      {message && <p style={{ color: '#c0392b' }}>{message}</p>}

      {stats && (
        <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginBottom: 20 }}>
          <Stat label="Total Users" value={stats.total_users} />
          <Stat label="Candidates" value={stats.candidates} />
          <Stat label="Employers" value={stats.employers} />
          <Stat label="Technical" value={stats.technical_users} />
          <Stat label="Non Technical" value={stats.non_technical_users} />
        </div>
      )}

      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 16 }}>
        <input placeholder="Search name/email/phone..." value={q} onChange={(e) => setQ(e.target.value)} style={inputStyle} />
        <select value={role} onChange={(e) => setRole(e.target.value)} style={inputStyle}>
          <option value="">All roles</option>
          <option value="seeker">Candidates</option>
          <option value="provider">Employers</option>
        </select>
        <select value={status} onChange={(e) => setStatus(e.target.value)} style={inputStyle}>
          <option value="">All statuses</option>
          <option value="active">Active</option>
          <option value="suspended">Suspended</option>
        </select>
        <button type="button" onClick={refresh} style={{ ...inputStyle, background: '#36b9cc', color: '#fff', border: 0 }}>Refresh</button>
      </div>

      {loading ? <p>Loading...</p> : (
        <table style={{ width: '100%', borderCollapse: 'collapse', background: '#fff' }}>
          <thead>
            <tr style={{ background: '#edf2f7' }}>
              <th style={th}>Name</th><th style={th}>Email</th><th style={th}>Role</th>
              <th style={th}>Status</th><th style={th}>Profile %</th><th style={th}>Resume</th>
              <th style={th}>Last Login</th><th style={th}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id}>
                <td style={td}>{u.full_name}</td>
                <td style={td}>{u.email}</td>
                <td style={td}>{u.role === 'provider' ? 'Employer' : 'Candidate'}</td>
                <td style={td}>
                  <span style={{ color: u.account_status === 'suspended' ? '#e74a3b' : '#1cc88a', fontWeight: 600 }}>{u.account_status || 'active'}</span>
                </td>
                <td style={td}>{u.profile_completion ?? 0}%</td>
                <td style={td}>{u.resume_status || 'none'}</td>
                <td style={td}>{u.last_login ? new Date(u.last_login).toLocaleDateString() : '—'}</td>
                <td style={td}>
                  <button type="button" onClick={() => viewDetail(u.id)}>View</button>{' '}
                  {u.account_status === 'suspended'
                    ? <button type="button" onClick={() => setUserStatus(u, 'active')}>Activate</button>
                    : <button type="button" onClick={() => setUserStatus(u, 'suspended')}>Suspend</button>}{' '}
                  <button type="button" onClick={() => deleteUser(u)} style={{ color: '#e74a3b' }}>Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {detail && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }} onClick={() => setDetail(null)}>
          <div style={{ background: '#fff', borderRadius: 12, padding: 24, width: 560, maxHeight: '85vh', overflow: 'auto' }} onClick={(e) => e.stopPropagation()}>
            <h3 style={{ marginTop: 0 }}>{detail.user.full_name}</h3>
            <p><strong>Email:</strong> {detail.user.email} · <strong>Phone:</strong> {detail.user.phone || '—'}</p>
            <p><strong>Role:</strong> {detail.user.role} · <strong>Status:</strong> {detail.user.account_status}</p>
            <p><strong>Profile completion:</strong> {detail.user.profile_completion ?? 0}% · <strong>Resume:</strong> {detail.user.resume_status || 'none'}</p>
            <p><strong>Language:</strong> {detail.user.preferred_language || 'en'} · <strong>Last login:</strong> {detail.user.last_login ? new Date(detail.user.last_login).toLocaleString() : '—'}</p>
            <p><strong>Registered:</strong> {detail.user.created_at ? new Date(detail.user.created_at).toLocaleDateString() : '—'}</p>
            <p><strong>Categories:</strong> {(detail.categories || []).map((c) => c.name).join(', ') || '—'}</p>
            <p><strong>Subcategories:</strong> {(detail.subcategories || []).map((s) => s.name).join(', ') || '—'}</p>
            {detail.profile && (
              <>
                <p><strong>Skills:</strong> {fmtArr(detail.profile.skills)}</p>
                <p><strong>Address:</strong> {detail.profile.address || '—'}</p>
                {detail.user.resume_url && <p><a href={`${API_BASE_URL}${detail.user.resume_url}`} target="_blank" rel="noreferrer">View resume</a></p>}
              </>
            )}
            <div style={{ marginTop: 16 }}>
              {detail.user.account_status === 'suspended'
                ? <button type="button" onClick={() => setUserStatus(detail.user, 'active')}>Activate</button>
                : <button type="button" onClick={() => setUserStatus(detail.user, 'suspended')}>Suspend</button>}{' '}
              <button type="button" onClick={() => deleteUser(detail.user)} style={{ color: '#e74a3b' }}>Delete</button>{' '}
              <button type="button" onClick={() => setDetail(null)}>Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function fmtArr(v) {
  let arr = v;
  if (typeof v === 'string') { try { arr = JSON.parse(v); } catch { return v || '—'; } }
  return Array.isArray(arr) && arr.length ? arr.join(', ') : '—';
}

function Stat({ label, value }) {
  return (
    <div style={{ background: '#fff', padding: '12px 20px', borderRadius: 10, boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
      <div style={{ fontSize: 12, color: '#718096' }}>{label}</div>
      <div style={{ fontSize: 22, fontWeight: 800 }}>{value ?? 0}</div>
    </div>
  );
}

export default UserManagement;
