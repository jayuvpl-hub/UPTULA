import React, { useEffect, useState } from 'react';
import { useAdmin } from '../AdminContext';
import { API_BASE_URL } from '../../config/api';

const Bar = ({ label, value, max, color = '#4e73df' }) => {
  const width = max > 0 ? Math.round((value / max) * 100) : 0;
  return (
    <div style={{ marginBottom: 8 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
        <span>{label}</span>
        <span>{value}</span>
      </div>
      <div style={{ background: '#e9ecef', borderRadius: 4, height: 10 }}>
        <div style={{ width: `${width}%`, background: color, height: 10, borderRadius: 4, transition: 'width .3s ease' }} />
      </div>
    </div>
  );
};

const Reports = () => {
  const { token } = useAdmin();
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [timeframe, setTimeframe] = useState('30');

  const [stats, setStats] = useState(null);
  const [payments, setPayments] = useState(null);
  const [downloads, setDownloads] = useState(null);
  const [booleanUsage, setBooleanUsage] = useState(null);
  const [scoringUsage, setScoringUsage] = useState(null);

  const loadAll = async () => {
    try {
      setLoading(true);
      const headers = { 'Authorization': `Bearer ${token}` };
      const [statsRes, payStatsRes, dlStatsRes, boolRes, scoreRes] = await Promise.all([
        fetch(`${API_BASE_URL}/api/admin/stats`, { headers }),
        fetch(`${API_BASE_URL}/api/admin/payment-stats`, { headers }),
        fetch(`${API_BASE_URL}/api/admin/download-stats`, { headers }),
        fetch(`${API_BASE_URL}/api/admin/reports/boolean-search-usage`, { headers }),
        fetch(`${API_BASE_URL}/api/admin/reports/resume-scoring-usage`, { headers }),
      ]);
      if (statsRes.ok) setStats(await statsRes.json());
      if (payStatsRes.ok) setPayments(await payStatsRes.json());
      if (dlStatsRes.ok) setDownloads(await dlStatsRes.json());
      if (boolRes.ok) setBooleanUsage(await boolRes.json());
      if (scoreRes.ok) setScoringUsage(await scoreRes.json());
    } catch (e) {
      setMessage('Failed to load reports');
      setTimeout(()=>setMessage(''), 4000);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadAll(); }, [timeframe]);

  const dailyDownloads = (downloads?.daily || []).slice(0, parseInt(timeframe,10));
  const maxDownloads = dailyDownloads.reduce((m, d) => Math.max(m, d.downloads_count || 0), 0);

  const scoringDaily = (scoringUsage?.daily || []).slice(0, parseInt(timeframe,10));
  const maxScoring = scoringDaily.reduce((m, d) => Math.max(m, d.count || 0), 0);

  return (
    <div className="card shadow mb-4">
      <div className="card-header py-3 d-flex align-items-center justify-content-between">
        <h6 className="m-0 font-weight-bold text-primary">Reports & Analytics</h6>
        <div>
          <select className="form-control" value={timeframe} onChange={(e)=>setTimeframe(e.target.value)}>
            <option value="7">Last 7</option>
            <option value="14">Last 14</option>
            <option value="30">Last 30</option>
          </select>
        </div>
      </div>
      <div className="card-body">
        {message && <div className="alert alert-danger">{message}</div>}
        {loading ? (
          <div>Loading...</div>
        ) : (
          <>
            <div className="row">
              <div className="col-md-3">
                <div className="card border-left-primary shadow h-100 py-2">
                  <div className="card-body">
                    <div className="text-xs font-weight-bold text-primary text-uppercase mb-1">Total Candidates</div>
                    <div className="h5 mb-0 font-weight-bold text-gray-800">{stats?.stats?.totalCandidates ?? '-'}</div>
                  </div>
                </div>
              </div>
              <div className="col-md-3">
                <div className="card border-left-success shadow h-100 py-2">
                  <div className="card-body">
                    <div className="text-xs font-weight-bold text-success text-uppercase mb-1">Total Employers</div>
                    <div className="h5 mb-0 font-weight-bold text-gray-800">{stats?.stats?.totalEmployers ?? '-'}</div>
                  </div>
                </div>
              </div>
              <div className="col-md-3">
                <div className="card border-left-info shadow h-100 py-2">
                  <div className="card-body">
                    <div className="text-xs font-weight-bold text-info text-uppercase mb-1">Jobs</div>
                    <div className="h5 mb-0 font-weight-bold text-gray-800">{stats?.stats?.totalJobs ?? '-'}</div>
                  </div>
                </div>
              </div>
              <div className="col-md-3">
                <div className="card border-left-warning shadow h-100 py-2">
                  <div className="card-body">
                    <div className="text-xs font-weight-bold text-warning text-uppercase mb-1">Applications</div>
                    <div className="h5 mb-0 font-weight-bold text-gray-800">{stats?.stats?.totalApplications ?? '-'}</div>
                  </div>
                </div>
              </div>
            </div>

            <div className="row mt-4">
              <div className="col-md-6">
                <h6 className="font-weight-bold">Daily Resume Downloads</h6>
                <div>
                  {dailyDownloads.map(d => (
                    <Bar key={d.download_date} label={new Date(d.download_date).toLocaleDateString()} value={d.downloads_count} max={maxDownloads} color="#1cc88a" />
                  ))}
                </div>
              </div>
              <div className="col-md-6">
                <h6 className="font-weight-bold">Resume Scoring Usage</h6>
                <div>
                  {scoringDaily.map(d => (
                    <Bar key={d.usage_date} label={new Date(d.usage_date).toLocaleDateString()} value={d.count} max={maxScoring} color="#36b9cc" />
                  ))}
                </div>
              </div>
            </div>

            <div className="row mt-4">
              <div className="col-md-6">
                <h6 className="font-weight-bold">Boolean Search</h6>
                <div className="text-muted small">Employers with trial: {booleanUsage?.summary?.employers_with_trial ?? 0}</div>
                <div className="text-muted small">Trials used: {booleanUsage?.summary?.trials_used ?? 0}</div>
                <div className="text-muted small">Saved searches: {booleanUsage?.savedSearches ?? 0}</div>
              </div>
              <div className="col-md-6">
                <h6 className="font-weight-bold">Revenue (Completed)</h6>
                <div className="text-muted small">Total payments: {payments?.overall?.total_payments ?? 0}</div>
                <div className="text-muted small">Total revenue: ${payments?.overall?.total_revenue ?? 0}</div>
                <div className="text-muted small">Membership revenue: ${payments?.overall?.membership_revenue ?? 0}</div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default Reports;
