import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import Header from "../Components/Header";
import Footer from "../Components/Footer";
import EmployerSidebar from "./Sidebar";
import { API_BASE_URL } from "../config/api";

function ViewCandidates() {
    
    const { user, loading: authLoading } = useAuth();
    const navigate = useNavigate();
    const [applications, setApplications] = useState([]);
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState("");
    const [downloadStatus, setDownloadStatus] = useState(null);
    const [downloading, setDownloading] = useState({});
    const [updatingStatus, setUpdatingStatus] = useState({});
    const [deleteAppId, setDeleteAppId] = useState(null);
    const [applicationDecisions, setApplicationDecisions] = useState({});
    const [candidateProfile, setCandidateProfile] = useState(null); // { appId, data } | null
    const [profileLoading, setProfileLoading] = useState(false);

    const normalizeDecision = (value) => {
        const v = String(value || '').toLowerCase().trim();
        if (v === 'accept' || v === 'accepted') return 'accept';
        if (v === 'rejectd' || v === 'rejected') return 'rejectd';
        return null;
    };

    useEffect(() => {
        if (!user) { navigate('/'); return; }
        if (user.role !== 'provider') { navigate('/'); return; }
    }, [user, navigate]);

    useEffect(() => {
        const fetchApps = async () => {
            try {
                setLoading(true);
                const token = localStorage.getItem('token');
                if (!token) return;
                const resp = await fetch(`${API_BASE_URL}/api/employer/applications`, {
                    headers: { 'Authorization': `Bearer ${token}`, 'Accept': 'application/json' },
                    credentials: 'include'
                });
                if (resp.ok) {
                    const data = await resp.json();
                    const apps = Array.isArray(data.applications) ? data.applications : [];
                    setApplications(apps);
                    const initialDecisions = {};
                    apps.forEach((app) => {
                        const decision = normalizeDecision(app?.decision);
                        if (decision) initialDecisions[app.id] = decision;
                    });
                    if (Object.keys(initialDecisions).length) {
                        setApplicationDecisions((prev) => ({ ...prev, ...initialDecisions }));
                    }
                } else {
                    setMessage('Failed to load applications');
                    setTimeout(()=>setMessage(''), 4000);
                }
            } catch (_) {
                setMessage('Failed to load applications');
                setTimeout(()=>setMessage(''), 4000);
            } finally { setLoading(false); }
        };
        if (user && user.role === 'provider') fetchApps();
    }, [user]);

    useEffect(() => {
        const fetchMissingDecisions = async () => {
            const token = localStorage.getItem('token');
            if (!token || !applications.length) return;
            const missing = applications.filter((app) => !normalizeDecision(app?.decision) && !applicationDecisions[app.id]);
            if (!missing.length) return;

            const responses = await Promise.all(
                missing.map(async (app) => {
                    try {
                        const resp = await fetch(`${API_BASE_URL}/api/applications/${app.id}`, {
                            headers: {
                                'Authorization': `Bearer ${token}`,
                                'Accept': 'application/json'
                            }
                        });
                        if (!resp.ok) return null;
                        const data = await resp.json();
                        return {
                            id: app.id,
                            decision: normalizeDecision(data?.application?.decision)
                        };
                    } catch (_) {
                        return null;
                    }
                })
            );

            const merged = {};
            responses.forEach((item) => {
                if (item?.id && item?.decision) merged[item.id] = item.decision;
            });
            if (Object.keys(merged).length) {
                setApplicationDecisions((prev) => ({ ...prev, ...merged }));
            }
        };

        fetchMissingDecisions();
    }, [applications]);

    // Load download status
    useEffect(() => {
        const loadDownloadStatus = async () => {
            try {
                const token = localStorage.getItem('token');
                if (!token) return;
                
                const response = await fetch(`${API_BASE_URL}/api/premium/download-status`, {
                    headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }
                });
                
                if (response.ok) {
                    const data = await response.json();
                    setDownloadStatus(data);
                }
            } catch (error) {
                console.error('Error loading download status:', error);
            }
        };
        
        if (user && user.role === 'provider') loadDownloadStatus();
    }, [user]);

    const markApplicationResumeReviewed = async (applicationId, token) => {
        try {
            const response = await fetch(`${API_BASE_URL}/api/applications/${applicationId}/status`, {
                method: 'PATCH',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                body: JSON.stringify({ status: 'resume_reviewed' })
            });
            if (!response.ok) {
                // Do not interrupt CV download flow if status is already advanced.
                console.warn(`Status update skipped for application ${applicationId}:`, response.status);
            }
        } catch (error) {
            // Keep download UX unchanged even if status patch fails.
            console.warn(`Failed to mark application ${applicationId} as resume_reviewed`, error);
        }
    };

    const downloadResume = async (applicationId) => {
        try {
            setDownloading(prev => ({ ...prev, [applicationId]: true }));
            const token = localStorage.getItem('token');
            
            const response = await fetch(`${API_BASE_URL}/api/premium/download-resume/${applicationId}`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }
            });
            
            if (response.ok) {
                const data = await response.json();
                
                // Create a download link for the resume
                if (data.resumeData.resumeUrl) {
                    const link = document.createElement('a');
                    link.href = data.resumeData.resumeUrl;
                    link.download = `${data.resumeData.candidateName}_resume.pdf`;
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                }

                await markApplicationResumeReviewed(applicationId, token);
                
                setMessage('Resume downloaded successfully!');
                setTimeout(() => setMessage(''), 4000);
                
                // Reload download status
                const statusResponse = await fetch(`${API_BASE_URL}/api/premium/download-status`, {
                    headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }
                });
                if (statusResponse.ok) {
                    const statusData = await statusResponse.json();
                    setDownloadStatus(statusData);
                }
            } else {
                const error = await response.json();
                if (response.status === 429) {
                    setMessage('Daily download limit reached! Upgrade to premium for unlimited downloads.');
                } else {
                    setMessage(error.message || 'Failed to download resume');
                }
                setTimeout(() => setMessage(''), 4000);
            }
        } catch (error) {
            setMessage('Error downloading resume: ' + error.message);
            setTimeout(() => setMessage(''), 4000);
        } finally {
            setDownloading(prev => ({ ...prev, [applicationId]: false }));
        }
    };

    const updateApplicationDecision = async (applicationId, decision) => {
        try {
            setUpdatingStatus(prev => ({ ...prev, [applicationId]: true }));
            const token = localStorage.getItem('token');
            if (!token) return;

            // Primary payload requested by UI flow
            let response = await fetch(`${API_BASE_URL}/api/applications/${applicationId}/status`, {
                method: 'PATCH',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                body: JSON.stringify({ status: decision })
            });

            // Fallback for stage-based backend model
            if (!response.ok) {
                response = await fetch(`${API_BASE_URL}/api/applications/${applicationId}/status`, {
                    method: 'PATCH',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json',
                        'Accept': 'application/json'
                    },
                    body: JSON.stringify({ status: 'accepted_rejected', decision })
                });
            }

            if (response.ok) {
                setApplications(prev => prev.map(app => (
                    app.id === applicationId ? { ...app, status: decision } : app
                )));
                const normalized = normalizeDecision(decision);
                if (normalized) {
                    setApplicationDecisions((prev) => ({ ...prev, [applicationId]: normalized }));
                }
                setMessage(`Application marked as ${decision}`);
            } else {
                const errorData = await response.json().catch(() => ({}));
                setMessage(errorData.message || `Failed to mark as ${decision}`);
            }
            setTimeout(() => setMessage(''), 4000);
        } catch (error) {
            setMessage(`Failed to mark as ${decision}`);
            setTimeout(() => setMessage(''), 4000);
        } finally {
            setUpdatingStatus(prev => ({ ...prev, [applicationId]: false }));
        }
    };

    const deleteApplication = async (id) => {
        try {
            const token = localStorage.getItem('token');
            if (!token) return;
            const resp = await fetch(`${API_BASE_URL}/api/applications/${id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}`, 'Accept': 'application/json' },
                credentials: 'include'
            });
            if (resp.ok) {
                setApplications(prev => prev.filter(a => a.id !== id));
            } else {
                setMessage('Failed to delete application');
                setTimeout(()=>setMessage(''), 4000);
            }
        } catch (_) {
            setMessage('Failed to delete application');
            setTimeout(()=>setMessage(''), 4000);
        } finally {
            setDeleteAppId(null);
        }
    };

    const viewCandidateProfile = async (appId) => {
        if (candidateProfile?.appId === appId) {
            setCandidateProfile(null); // toggle off
            return;
        }
        setProfileLoading(true);
        try {
            const token = localStorage.getItem('token');
            const resp = await fetch(`${API_BASE_URL}/api/employer/applications/${appId}/candidate-profile`, {
                headers: { 'Authorization': `Bearer ${token}`, 'Accept': 'application/json' },
            });
            if (resp.ok) {
                const data = await resp.json();
                setCandidateProfile({ appId, data });
            } else {
                setMessage('Failed to load candidate profile');
                setTimeout(() => setMessage(''), 4000);
            }
        } catch (_) {
            setMessage('Failed to load candidate profile');
            setTimeout(() => setMessage(''), 4000);
        } finally {
            setProfileLoading(false);
        }
    };

    if (authLoading) return null;

    return (
        <>
            {message && (
                <div className={`alert ${message.includes('Failed') ? 'alert-danger' : 'alert-success'}`} style={{ position: 'fixed', top: '20px', right: '20px', zIndex: 9999 }}>
                    {message}
                </div>
            )}
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
                .vc-status-card {
                    background: linear-gradient(90deg, #ecfdf5 0%, #f0fdf4 100%);
                    border: 1px solid #bbf7d0;
                    border-radius: 10px;
                    box-shadow: 0 6px 18px rgba(15, 23, 42, 0.06);
                }
                .vc-table-wrap {
                    border: 1px solid #e2e8f0;
                    border-radius: 12px;
                    overflow: hidden;
                    box-shadow: 0 8px 22px rgba(15, 23, 42, 0.08);
                    background: #fff;
                }
                .vc-table thead th {
                    background: linear-gradient(90deg, #f8fafc 0%, #eef6ff 100%);
                    color: #334155;
                    font-size: 12px;
                    letter-spacing: 0.5px;
                    text-transform: uppercase;
                    font-weight: 700;
                    border-bottom: 1px solid #dbe5f1;
                    vertical-align: middle;
                }
                .vc-table tbody td {
                    vertical-align: middle;
                    border-top: 1px solid #edf2f7;
                }
                .vc-table tbody tr:hover {
                    background: #f8fbff;
                }
            `}</style>
            {/* page title removed to match ManageJobs layout */}
            <section className="utf_manage_jobs_area padd-top-80 padd-bot-80">
                <div className="container">
                    <div className="row">
                        <div className="col-md-3 employer-dashboard-sidebar">
                            <EmployerSidebar active="view-candidates" />
                        </div>
                        <div className="col-md-9 employer-dashboard-main">
                            {/* Download Status */}
                            {downloadStatus && (
                                <div className="vc-status-card" style={{
                                    backgroundColor: '#d4edda',
                                    border: '1px solid #c3e6cb',
                                    borderRadius: '4px',
                                    padding: '15px',
                                    marginBottom: '20px',
                                    textAlign: 'center'
                                }}>
                                    <h4 style={{ 
                                        color: '#155724', 
                                        margin: '0 0 10px 0' 
                                    }}>
                                        ⭐ Full Access Enabled
                                    </h4>
                                    <p style={{ 
                                        color: '#155724', 
                                        margin: '0' 
                                    }}>
                                        Unlimited downloads are enabled while we finalize the payment integration. ({downloadStatus.dailyDownloads || 0} downloaded today)
                                    </p>
                                </div>
                            )}
                            
                            <div className="table-responsive vc-table-wrap">
                                <table className="table table-lg table-hover vc-table" style={{ marginBottom: 0 }}>
                                    <thead>
                                        <tr>
                                            <th><i className="ti-briefcase" style={{ marginRight: 6, color: '#16a34a' }} />Job</th>
                                            <th><i className="ti-user" style={{ marginRight: 6, color: '#16a34a' }} />Candidate</th>
                                            <th><i className="ti-email" style={{ marginRight: 6, color: '#16a34a' }} />Email</th>
                                            <th><i className="ti-calendar" style={{ marginRight: 6, color: '#16a34a' }} />Applied On</th>
                                            <th><i className="ti-download" style={{ marginRight: 6, color: '#16a34a' }} />Resume</th>
                                            <th><i className="ti-settings" style={{ marginRight: 6, color: '#16a34a' }} />Action</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {loading ? (
                                            <tr><td colSpan="6">Loading...</td></tr>
                                        ) : applications.length === 0 ? (
                                            <tr><td colSpan="6">No applications found.</td></tr>
                                        ) : (
                                            applications.map(app => (
                                                <tr key={app.id}>
                                                    {(() => {
                                                        const currentDecision = normalizeDecision(app?.decision) || applicationDecisions[app.id] || null;
                                                        const showAccept = currentDecision !== 'accept';
                                                        const showReject = currentDecision !== 'rejectd';
                                                        return (
                                                            <>
                                                    <td>
                                                        {app.job_title}
                                                        <span className="mng-jb" style={{ display: 'block' }}>
                                                            {app.company_name}
                                                        </span>
                                                    </td>
                                                    <td>{app.name || app.seeker_id}</td>
                                                    <td>{app.email || '—'}</td>
                                                    <td>
                                                        <div style={{ lineHeight: 1.2 }}>
                                                            <div>{new Date(app.created_at).toLocaleDateString()}</div>
                                                            <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '4px' }}>
                                                                {new Date(app.created_at).toLocaleTimeString()}
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td>
                                                        {app.resume_url ? (
                                                            <button 
                                                                onClick={() => downloadResume(app.id)}
                                                                disabled={downloading[app.id]}
                                                                className="btn btn-primary btn-sm"
                                                                title="Click on download to view resume"
                                                                style={{
                                                                    backgroundColor: '#dbeafe',
                                                                    color: '#2563eb',
                                                                    border: 'none',
                                                                    padding: '5px 10px',
                                                                    borderRadius: '3px',
                                                                    cursor: downloading[app.id] ? 'not-allowed' : 'pointer',
                                                                    opacity: downloading[app.id] ? 0.6 : 1
                                                                }}
                                                                onMouseEnter={(e) => {
                                                                    if (downloading[app.id]) return;
                                                                    e.currentTarget.style.backgroundColor = '#2563eb';
                                                                    e.currentTarget.style.color = '#ffffff';
                                                                }}
                                                                onMouseLeave={(e) => {
                                                                    e.currentTarget.style.backgroundColor = '#dbeafe';
                                                                    e.currentTarget.style.color = '#2563eb';
                                                                }}
                                                            >
                                                                {downloading[app.id] ? '...' : <i className="ti-download" />}
                                                            </button>
                                                        ) : '—'}
                                                    </td>
                                                    <td>
                                                        <div style={{ display: 'flex', gap: '8px' }}>
                                                            {showAccept && (
                                                            <button
                                                                onClick={() => updateApplicationDecision(app.id, 'accept')}
                                                                disabled={updatingStatus[app.id]}
                                                                title="Approve candidate"
                                                                style={{
                                                                    width: '34px',
                                                                    height: '34px',
                                                                    border: '1.5px solid #059669',
                                                                    borderRadius: '50%',
                                                                    backgroundColor: 'transparent',
                                                                    color: '#059669',
                                                                    cursor: updatingStatus[app.id] ? 'not-allowed' : 'pointer',
                                                                    opacity: updatingStatus[app.id] ? 0.6 : 1,
                                                                    display: 'inline-flex',
                                                                    alignItems: 'center',
                                                                    justifyContent: 'center',
                                                                    transition: 'all 0.2s ease'
                                                                }}
                                                                onMouseEnter={(e) => {
                                                                    if (updatingStatus[app.id]) return;
                                                                    e.currentTarget.style.backgroundColor = '#059669';
                                                                    e.currentTarget.style.color = '#ffffff';
                                                                }}
                                                                onMouseLeave={(e) => {
                                                                    e.currentTarget.style.backgroundColor = 'transparent';
                                                                    e.currentTarget.style.color = '#059669';
                                                                }}
                                                            >
                                                                <i className="ti-check" style={{ display: 'block', lineHeight: 1, fontSize: '14px' }} />
                                                            </button>
                                                            )}
                                                            {showReject && (
                                                            <button
                                                                onClick={() => updateApplicationDecision(app.id, 'rejectd')}
                                                                disabled={updatingStatus[app.id]}
                                                                title="Reject candidate"
                                                                style={{
                                                                    width: '34px',
                                                                    height: '34px',
                                                                    border: '1.5px solid #dc2626',
                                                                    borderRadius: '50%',
                                                                    backgroundColor: 'transparent',
                                                                    color: '#dc2626',
                                                                    cursor: updatingStatus[app.id] ? 'not-allowed' : 'pointer',
                                                                    opacity: updatingStatus[app.id] ? 0.6 : 1,
                                                                    display: 'inline-flex',
                                                                    alignItems: 'center',
                                                                    justifyContent: 'center',
                                                                    transition: 'all 0.2s ease'
                                                                }}
                                                                onMouseEnter={(e) => {
                                                                    if (updatingStatus[app.id]) return;
                                                                    e.currentTarget.style.backgroundColor = '#dc2626';
                                                                    e.currentTarget.style.color = '#ffffff';
                                                                }}
                                                                onMouseLeave={(e) => {
                                                                    e.currentTarget.style.backgroundColor = 'transparent';
                                                                    e.currentTarget.style.color = '#dc2626';
                                                                }}
                                                            >
                                                                <i className="ti-close" style={{ display: 'block', lineHeight: 1, fontSize: '14px' }} />
                                                            </button>
                                                            )}
                                                            <button
                                                                onClick={() => setDeleteAppId(app.id)}
                                                                title="Delete candidate"
                                                                style={{
                                                                    width: '34px',
                                                                    height: '34px',
                                                                    border: '1.5px solid #dc2626',
                                                                    borderRadius: '50%',
                                                                    backgroundColor: 'transparent',
                                                                    color: '#dc2626',
                                                                    cursor: 'pointer',
                                                                    display: 'inline-flex',
                                                                    alignItems: 'center',
                                                                    justifyContent: 'center',
                                                                    transition: 'all 0.2s ease'
                                                                }}
                                                                onMouseEnter={(e) => {
                                                                    e.currentTarget.style.backgroundColor = '#dc2626';
                                                                    e.currentTarget.style.color = '#ffffff';
                                                                }}
                                                                onMouseLeave={(e) => {
                                                                    e.currentTarget.style.backgroundColor = 'transparent';
                                                                    e.currentTarget.style.color = '#dc2626';
                                                                }}
                                                            >
                                                                <i className="ti-trash" style={{ display: 'block', lineHeight: 1, fontSize: '14px' }} />
                                                            </button>
                                                            <button
                                                                onClick={() => viewCandidateProfile(app.id)}
                                                                title="View full profile"
                                                                style={{
                                                                    width: '34px',
                                                                    height: '34px',
                                                                    border: '1.5px solid #0284c7',
                                                                    borderRadius: '50%',
                                                                    backgroundColor: candidateProfile?.appId === app.id ? '#0284c7' : 'transparent',
                                                                    color: candidateProfile?.appId === app.id ? '#ffffff' : '#0284c7',
                                                                    cursor: 'pointer',
                                                                    display: 'inline-flex',
                                                                    alignItems: 'center',
                                                                    justifyContent: 'center',
                                                                    transition: 'all 0.2s ease'
                                                                }}
                                                                onMouseEnter={(e) => {
                                                                    e.currentTarget.style.backgroundColor = '#0284c7';
                                                                    e.currentTarget.style.color = '#ffffff';
                                                                }}
                                                                onMouseLeave={(e) => {
                                                                    if (candidateProfile?.appId !== app.id) {
                                                                        e.currentTarget.style.backgroundColor = 'transparent';
                                                                        e.currentTarget.style.color = '#0284c7';
                                                                    }
                                                                }}
                                                            >
                                                                <i className="ti-id-badge" style={{ display: 'block', lineHeight: 1, fontSize: '14px' }} />
                                                            </button>
                                                        </div>
                                                    </td>
                                                            </>
                                                        );
                                                    })()}
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </div>
            </section>
            {/* Candidate Profile Detail Panel */}
            {(candidateProfile || profileLoading) && (
                <div
                    style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 10000, display: 'flex', justifyContent: 'center', alignItems: 'flex-start', padding: '40px 16px', overflowY: 'auto' }}
                    onClick={() => setCandidateProfile(null)}
                >
                    <div
                        style={{ backgroundColor: '#fff', borderRadius: '12px', padding: '28px', maxWidth: '680px', width: '100%', boxShadow: '0 8px 32px rgba(0,0,0,0.18)', position: 'relative' }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <button onClick={() => setCandidateProfile(null)} style={{ position: 'absolute', top: '14px', right: '14px', border: 'none', background: 'none', fontSize: '20px', cursor: 'pointer', color: '#64748b' }}>✕</button>
                        {profileLoading ? (
                            <p style={{ textAlign: 'center', color: '#64748b' }}>Loading…</p>
                        ) : candidateProfile && (() => {
                            const p = candidateProfile.data;
                            const InfoRow = ({ label, value }) => value ? (
                                <div style={{ marginBottom: '8px' }}>
                                    <span style={{ fontWeight: 600, color: '#334e6f', fontSize: '13px' }}>{label}: </span>
                                    <span style={{ color: '#1e293b', fontSize: '13px' }}>{value}</span>
                                </div>
                            ) : null;
                            const ListSection = ({ label, items }) => items && items.length > 0 ? (
                                <div style={{ marginBottom: '16px' }}>
                                    <p style={{ fontWeight: 700, color: '#0f172a', marginBottom: '6px', fontSize: '14px' }}>{label}</p>
                                    <ul style={{ margin: 0, paddingLeft: '18px', color: '#1e293b', fontSize: '13px' }}>
                                        {items.map((item, i) => (
                                            <li key={i}>{typeof item === 'object' ? (item.title || item.company || item.institution || item.name || JSON.stringify(item)) : item}</li>
                                        ))}
                                    </ul>
                                </div>
                            ) : null;
                            return (
                                <>
                                    <h3 style={{ margin: '0 0 4px', fontSize: '20px', fontWeight: 800, color: '#0f172a' }}>{p.name || 'Candidate'}</h3>
                                    <p style={{ margin: '0 0 20px', fontSize: '13px', color: '#64748b' }}>{p.email}{p.phone ? ` · ${p.phone}` : ''}</p>

                                    {p.bio && <p style={{ marginBottom: '16px', fontSize: '13px', color: '#334155', lineHeight: 1.6, background: '#f8fafc', padding: '10px 14px', borderRadius: '8px' }}>{p.bio}</p>}

                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 20px', marginBottom: '16px' }}>
                                        <InfoRow label="Preferred role" value={p.preferredJobRole} />
                                        <InfoRow label="Location" value={p.preferredLocation} />
                                        <InfoRow label="Employment type" value={p.employmentType} />
                                        <InfoRow label="Notice period" value={p.noticePeriod} />
                                        <InfoRow label="Current salary" value={p.currentSalary} />
                                        <InfoRow label="Expected salary" value={p.expectedSalary} />
                                        {p.linkedin && <InfoRow label="LinkedIn" value={p.linkedin} />}
                                        {p.portfolio && <InfoRow label="Portfolio" value={p.portfolio} />}
                                    </div>

                                    {Array.isArray(p.skills) && p.skills.length > 0 && (
                                        <div style={{ marginBottom: '16px' }}>
                                            <p style={{ fontWeight: 700, color: '#0f172a', marginBottom: '8px', fontSize: '14px' }}>Skills</p>
                                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                                                {p.skills.map((s, i) => (
                                                    <span key={i} style={{ background: '#ecfdf5', color: '#16a34a', border: '1px solid #bbf7d0', borderRadius: '20px', padding: '3px 10px', fontSize: '12px', fontWeight: 600 }}>{s}</span>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    <ListSection label="Experience" items={p.experience} />
                                    <ListSection label="Education" items={p.education} />
                                    <ListSection label="Certifications" items={p.certifications} />

                                    {/* Accessibility information — only shown when has_disability is true */}
                                    {p.hasDisability && (
                                        <div style={{ marginTop: '16px', background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: '10px', padding: '14px 18px' }}>
                                            <p style={{ fontWeight: 700, color: '#1e40af', marginBottom: '8px', fontSize: '14px' }}>
                                                <i className="ti-wheelchair" style={{ marginRight: '6px' }} />Accessibility information
                                            </p>
                                            {p.disabilityDetails && (
                                                <div style={{ marginBottom: '8px' }}>
                                                    <span style={{ fontWeight: 600, fontSize: '13px', color: '#1e3a8a' }}>Disability / condition: </span>
                                                    <span style={{ fontSize: '13px', color: '#1e293b' }}>{p.disabilityDetails}</span>
                                                </div>
                                            )}
                                            {p.accommodationNeeds && (
                                                <div>
                                                    <span style={{ fontWeight: 600, fontSize: '13px', color: '#1e3a8a' }}>Accommodation needs: </span>
                                                    <span style={{ fontSize: '13px', color: '#1e293b' }}>{p.accommodationNeeds}</span>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </>
                            );
                        })()}
                    </div>
                </div>
            )}

            {/* Delete Confirmation Modal */}
            {deleteAppId && (
                <div
                    style={{
                        position: 'fixed',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        backgroundColor: 'rgba(0, 0, 0, 0.5)',
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center',
                        zIndex: 10000
                    }}
                    onClick={() => setDeleteAppId(null)}
                >
                    <div
                        style={{
                            backgroundColor: 'white',
                            padding: '24px',
                            borderRadius: '8px',
                            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
                            maxWidth: '420px',
                            textAlign: 'center'
                        }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <h3 style={{ marginBottom: '12px' }}>Confirm Delete</h3>
                        <p style={{ marginBottom: '20px', color: '#666' }}>Are you sure you want to delete this application?</p>
                        <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', maxWidth: '360px', margin: '0 auto' }}>
                            <button
                                onClick={() => setDeleteAppId(null)}
                                style={{
                                    padding: '10px 20px',
                                    backgroundColor: '#28a745',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '5px',
                                    cursor: 'pointer'
                                }}
                            >
                                No, Cancel
                            </button>
                            <button
                                onClick={() => {
                                    deleteApplication(deleteAppId);
                                    setDeleteAppId(null);
                                }}
                                style={{
                                    padding: '10px 20px',
                                    backgroundColor: '#dc3545',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '5px',
                                    cursor: 'pointer'
                                }}
                            >
                                Yes, Delete
                            </button>
                        </div>
                    </div>
                </div>
            )}
            <Footer />
        </>
    );
}

export default ViewCandidates;


