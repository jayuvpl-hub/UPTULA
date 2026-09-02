import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import CandidateSidebar from "./Sidebar";

// 🔥 Centralized API base URL
import Header from "../Components/Header";
import Footer from "../Components/Footer";
import { API_BASE_URL } from "../config/api";

const APPLICATION_STAGES = [
    { key: "applied", label: "Applied" },
    { key: "resume_reviewed", label: "Resume Reviewed by Recruiter" },
    { key: "accepted_rejected", label: "Accepted or Rejected" },
    // { key: "final_decision", label: "Pending Final Decision" }
];

const LEGACY_TO_STAGE_STATUS = {
    pending: "applied",
    reviewed: "resume_reviewed",
    shortlisted: "accepted_rejected",
    accept: "accepted_rejected",
    accepted: "accepted_rejected",
    rejectd: "accepted_rejected",
    rejected: "accepted_rejected",
    hired: "final_decision"
};

function AppliedJobs() {

    const { user, profileData, loading: authLoading, logout } = useAuth();
    const navigate = useNavigate();

    const [applications, setApplications] = useState([]);
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState("");
    const [expandedTracking, setExpandedTracking] = useState({});
    const [applicationHistory, setApplicationHistory] = useState({});
    const [historyLoading, setHistoryLoading] = useState({});

    const normalizeStatus = (status) => {
        const value = (status || "applied").toLowerCase();
        return LEGACY_TO_STAGE_STATUS[value] || value;
    };

    const fetchApplicationHistory = async (applicationId) => {
        const token = localStorage.getItem("token");
        if (!token) return;
        try {
            setHistoryLoading((prev) => ({ ...prev, [applicationId]: true }));
            const resp = await fetch(`${API_BASE_URL}/api/applications/${applicationId}`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                    Accept: "application/json",
                }
            });
            if (resp.ok) {
                const data = await resp.json();
                setApplicationHistory((prev) => ({
                    ...prev,
                    [applicationId]: Array.isArray(data.history) ? data.history : []
                }));
            }
        } catch (_) {
            // Keep UI functional even if history fetch fails.
        } finally {
            setHistoryLoading((prev) => ({ ...prev, [applicationId]: false }));
        }
    };

    // Redirect protect
    useEffect(() => {
        if (!user) {
            navigate("/");
            return;
        }
        if (user.role !== "seeker") {
            navigate("/");
        }
    }, [user, navigate]);

    // Load applied jobs
    useEffect(() => {
        const fetchApps = async () => {
            try {
                setLoading(true);
                const token = localStorage.getItem("token");
                if (!token) return;

                const resp = await fetch(`${API_BASE_URL}/api/applications/mine`, {
                    headers: {
                        Authorization: `Bearer ${token}`,
                        Accept: "application/json",
                    }
                });

                if (resp.ok) {
                    const data = await resp.json();
                    setApplications(Array.isArray(data.applications) ? data.applications : []);
                } else {
                    setMessage("Failed to load applications");
                    setTimeout(() => setMessage(""), 4000);
                }
            } catch (err) {
                setMessage("Failed to load applications");
                setTimeout(() => setMessage(""), 4000);
            } finally {
                setLoading(false);
            }
        };

        if (user && user.role === "seeker") fetchApps();
    }, [user]);

    // Withdraw application
    const withdraw = async (id) => {
        try {
            const token = localStorage.getItem("token");
            if (!token) return;

            const resp = await fetch(`${API_BASE_URL}/api/applications/${id}`, {
                method: "DELETE",
                headers: {
                    Authorization: `Bearer ${token}`,
                    Accept: "application/json",
                }
            });

            if (resp.ok) {
                setApplications((prev) => prev.filter((a) => a.id !== id));
            } else {
                setMessage("Failed to withdraw");
                setTimeout(() => setMessage(""), 4000);
            }
        } catch (err) {
            setMessage("Failed to withdraw");
            setTimeout(() => setMessage(""), 4000);
        }
    };

    if (authLoading) return null;

    return (
        <>
            {message && (
                <div
                    className={`alert ${message.includes("Failed") ? "alert-danger" : "alert-success"}`}
                    style={{ position: "fixed", top: "20px", right: "20px", zIndex: 9999 }}
                >
                    {message}
                </div>
            )}

            <Header />
            <style>{`
                @media (max-width: 991px) {
                    .candidate-dashboard-sidebar { display: none !important; }
                    .candidate-dashboard-main {
                        width: 100% !important;
                        max-width: 100% !important;
                        float: none !important;
                    }
                }
            `}</style>

            <section className="utf_manage_jobs_area padd-top-80 padd-bot-80">
                <div className="container">
                    <div className="row">

                        {/* Sidebar */}
                        <div className="col-md-3 candidate-dashboard-sidebar">
                            {/* <div id="leftcol_item">
                                <div className="user_dashboard_pic" style={{
                                    background: 'linear-gradient(to right, #DADADA, #28a745)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    padding: '15px',
                                    gap: '15px',
                                    borderRadius: '10px',
                                    boxShadow: '0 1px 7px rgba(0, 0, 0, 0.1)'
                                }}>
                                    <img
                                        alt="user photo"
                                        src={
                                            profileData?.profilePictureUrl ||
                                            user?.profilePictureUrl ||
                                            localStorage.getItem("userProfilePicture") ||
                                            "/assets/img/user-profile.png"
                                        }
                                        style={{
                                            width: '80px',
                                            height: '80px',
                                            borderRadius: '50%',
                                            objectFit: 'cover',
                                            border: '3px solid #fff',
                                            boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
                                            display: 'block',
                                            flexShrink: 0
                                        }}
                                        onError={(e) => {
                                            e.target.src = "/assets/img/user-profile.png";
                                        }}
                                    />
                                    <span style={{
                                        color: '#ffffff',
                                        fontSize: '16px',
                                        fontWeight: '600',
                                        flex: 1,
                                        whiteSpace: 'nowrap',
                                        overflow: 'hidden',
                                        textOverflow: 'ellipsis'
                                    }}>
                                        {user?.fullName}
                                    </span>
                                </div>
                            </div>

                            <div className="dashboard_nav_item">
                                <ul>
                                    <li><a href="#" onClick={(e) => { e.preventDefault(); navigate("/"); }}><i className="login-icon ti-dashboard" /> Home</a></li>
                                    <li><a href="#" onClick={(e) => { e.preventDefault(); navigate("/profile"); }}><i className="login-icon ti-user" /> Edit Profile</a></li>
                                    <li className="active"><a href="#"><i className="login-icon ti-clipboard" /> Applied Jobs</a></li>
                                    <li><a href="#" onClick={(e) => { e.preventDefault(); navigate("/candidate/create-resume"); }}><i className="login-icon ti-file" /> Create Resume</a></li>
                                    <li><a href="#" onClick={(e) => { e.preventDefault(); navigate("/candidate/change-password"); }}><i className="login-icon ti-key" /> Change Password</a></li>
                                    <li><a href="#" onClick={(e) => { e.preventDefault(); navigate("/candidate/chat"); }}><i className="login-icon ti-comments" /> Chat Inbox</a></li>
                                    <li><a href="#" onClick={(e) => { e.preventDefault(); navigate("/candidate/wishlist"); }}><i className="login-icon ti-heart" /> My Wishlist</a></li>
                                    <li>
                                        <a href="#" onClick={(e) => { e.preventDefault(); logout(); navigate("/"); }}>
                                            <i className="login-icon ti-power-off" /> Logout
                                        </a>
                                    </li>
                                </ul>
                            </div> */}
                            <CandidateSidebar activePage="applied-jobs" />
                        </div>

                        {/* Main Content */}
                        <div className="col-md-9 candidate-dashboard-main">
                            <div style={{ marginBottom: '20px' }}>
                                <h3 style={{ margin: 0, fontSize: '24px', fontWeight: '600', color: '#1a1a1a' }}>
                                    Applied Jobs
                                </h3>
                                <p style={{ margin: '5px 0 0 0', color: '#6b7280', fontSize: '14px' }}>
                                    {applications.length} {applications.length === 1 ? 'application' : 'applications'} found
                                </p>
                            </div>

                                        {loading ? (
                                <div style={{ 
                                    textAlign: 'center', 
                                    padding: '60px 20px',
                                    backgroundColor: '#fff',
                                    borderRadius: '12px',
                                    boxShadow: '0 2px 8px rgba(0,0,0,0.08)'
                                }}>
                                    <div className="spinner-border text-success" role="status">
                                        <span className="sr-only">Loading...</span>
                                    </div>
                                    <p style={{ marginTop: '15px', color: '#6b7280' }}>Loading applications...</p>
                                </div>
                                        ) : applications.length === 0 ? (
                                <div style={{ 
                                    textAlign: 'center', 
                                    padding: '60px 20px',
                                    backgroundColor: '#fff',
                                    borderRadius: '12px',
                                    boxShadow: '0 2px 8px rgba(0,0,0,0.08)'
                                }}>
                                    <i className="ti-clipboard" style={{ fontSize: '48px', color: '#d1d5db', marginBottom: '15px', display: 'block' }}></i>
                                    <h4 style={{ color: '#6b7280', marginBottom: '8px' }}>No applications found</h4>
                                    <p style={{ color: '#9ca3af', fontSize: '14px' }}>You haven't applied to any jobs yet.</p>
                                </div>
                            ) : (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                    {applications.map((app) => {
                                        const rawStatus = String(app.status || "").toLowerCase();
                                        const rawDecision = String(app.decision || "").toLowerCase();
                                        const status = normalizeStatus(app.status);
                                        const currentStageIndex = APPLICATION_STAGES.findIndex((stage) => stage.key === status);
                                        const appHistory = applicationHistory[app.id] || [];
                                        const acceptedRejectedLabel =
                                            rawDecision === "rejectd" || rawStatus === "rejected" || rawStatus === "rejectd"
                                                ? "Rejected"
                                                : rawDecision === "accept" || rawStatus === "accepted" || rawStatus === "accept"
                                                    ? "Accepted"
                                                    : "Accepted or Rejected";
                                        
                                        // Status configuration with icons and colors
                                        const getStatusConfig = (status) => {
                                            const statusLower = normalizeStatus(status);
                                            switch (statusLower) {
                                                case 'applied':
                                                    return {
                                                        icon: 'ti-time',
                                                        color: '#f59e0b',
                                                        bgColor: '#fef3c7',
                                                        label: 'Applied'
                                                    };
                                                case 'resume_reviewed':
                                                    return {
                                                        icon: 'ti-eye',
                                                        color: '#3b82f6',
                                                        bgColor: '#dbeafe',
                                                        label: 'Resume Reviewed'
                                                    };
                                                case 'accepted_rejected':
                                                    if (acceptedRejectedLabel === "Rejected") {
                                                        return {
                                                            icon: 'ti-close',
                                                            color: '#dc2626',
                                                            bgColor: '#fee2e2',
                                                            label: acceptedRejectedLabel
                                                        };
                                                    }
                                                    return {
                                                        icon: 'ti-check-box',
                                                        color: '#10b981',
                                                        bgColor: '#d1fae5',
                                                        label: acceptedRejectedLabel
                                                    };
                                                case 'final_decision':
                                                    return {
                                                        icon: 'ti-flag',
                                                        color: '#7c3aed',
                                                        bgColor: '#ede9fe',
                                                        label: 'Final Decision'
                                                    };
                                                default:
                                                    return {
                                                        icon: 'ti-time',
                                                        color: '#6b7280',
                                                        bgColor: '#f3f4f6',
                                                        label: String(status || 'applied').replace(/_/g, ' ')
                                                    };
                                            }
                                        };
                                        
                                        const statusConfig = getStatusConfig(status);
                                        
                                        // Format date
                                        const formatDate = (dateString) => {
                                            const date = new Date(dateString);
                                            const now = new Date();
                                            const diffMs = now - date;
                                            const diffDays = Math.floor(diffMs / 86400000);
                                            
                                            if (diffDays === 0) return 'Today';
                                            if (diffDays === 1) return 'Yesterday';
                                            if (diffDays < 7) return `${diffDays} days ago`;
                                            return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
                                        };

                                        const getStageDate = (stageKey) => {
                                            if (stageKey === "applied") return app.appliedAt;
                                            const entry = appHistory.find((item) => normalizeStatus(item?.newStatus) === stageKey);
                                            return entry?.changedAt || null;
                                        };
                                        
                                        return (
                                            <div
                                                key={app.id}
                                                onClick={() => navigate(`/jobs/${app.jobId}`)}
                                                style={{
                                                    backgroundColor: '#fff',
                                                    borderRadius: '12px',
                                                    padding: '20px 20px 0 20px',
                                                    boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                                                    border: '1px solid #e5e7eb',
                                                    transition: 'all 0.3s ease',
                                                    cursor: 'pointer'
                                                }}
                                                onMouseEnter={(e) => {
                                                    e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.12)';
                                                    e.currentTarget.style.transform = 'translateY(-2px)';
                                                }}
                                                onMouseLeave={(e) => {
                                                    e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.08)';
                                                    e.currentTarget.style.transform = 'translateY(0)';
                                                }}
                                            >
                                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '20px', flexWrap: 'wrap' }}>
                                                    {/* Left Section - Job Info */}
                                                    <div style={{ flex: 1, minWidth: '250px' }}>
                                                        <h4 style={{ 
                                                            margin: '0 0 8px 0', 
                                                            fontSize: '18px', 
                                                            fontWeight: '600',
                                                            color: '#1a1a1a',
                                                            lineHeight: '1.3'
                                                        }}>
                                                            {app.jobTitle || '—'}
                                                        </h4>
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap', marginBottom: '12px' }}>
                                                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#6b7280', fontSize: '14px' }}>
                                                                <i className="ti-briefcase" style={{ color: '#28a745', fontSize: '14px' }}></i>
                                                                <span>{app.companyName || '—'}</span>
                                                            </div>
                                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#6b7280', fontSize: '14px' }}>
                                                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                                    <i className="ti-calendar" style={{ color: '#28a745', fontSize: '14px' }}></i>
                                                                    <span>{formatDate(app.appliedAt)}</span>
                                                                </div>
                                                                {/* Status Badge - Beside Time */}
                                                                <span style={{
                                                                    display: 'inline-flex',
                                                                    alignItems: 'center',
                                                                    gap: '4px',
                                                                    padding: '3px 8px',
                                                                    borderRadius: '12px',
                                                                    fontSize: '11px',
                                                                    fontWeight: '600',
                                                                    backgroundColor: statusConfig.bgColor,
                                                                    color: statusConfig.color,
                                                                    whiteSpace: 'nowrap'
                                                                }}>
                                                                    <i className={statusConfig.icon} style={{ fontSize: '11px' }}></i>
                                                                    {statusConfig.label}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    
                                                    {/* Right Section - Actions */}
                                                    <div 
                                                        style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}
                                                        onClick={(e) => e.stopPropagation()}
                                                    >
                                                        {/* Resume Download */}
                                                        {app.resumeUrl && (
                                                            <a
                                                                href={app.resumeUrl}
                                                                target="_blank"
                                                                rel="noreferrer"
                                                                style={{
                                                                    display: 'inline-flex',
                                                                    alignItems: 'center',
                                                                    gap: '6px',
                                                                    padding: '8px 16px',
                                                                    backgroundColor: '#f3f4f6',
                                                                    color: '#374151',
                                                                    borderRadius: '8px',
                                                                    textDecoration: 'none',
                                                                    fontSize: '14px',
                                                                    fontWeight: '500',
                                                                    transition: 'all 0.2s ease'
                                                                }}
                                                                onMouseEnter={(e) => {
                                                                    e.currentTarget.style.backgroundColor = '#e5e7eb';
                                                                }}
                                                                onMouseLeave={(e) => {
                                                                    e.currentTarget.style.backgroundColor = '#f3f4f6';
                                                                }}
                                                            >
                                                                <i className="ti-download" style={{ fontSize: '14px' }}></i>
                                                                Resume
                                                            </a>
                                                        )}
                                                        
                                                        {/* View Job Button */}
                                                        <button
                                                            onClick={(e) => {
                                                                e.preventDefault();
                                                                e.stopPropagation();
                                                                navigate(`/jobs/${app.jobId}`);
                                                            }}
                                                            style={{
                                                                display: 'inline-flex',
                                                                alignItems: 'center',
                                                                justifyContent: 'center',
                                                                width: '40px',
                                                                height: '40px',
                                                                backgroundColor: '#d1fae5',
                                                                color: '#28a745',
                                                                border: 'none',
                                                                borderRadius: '8px',
                                                                cursor: 'pointer',
                                                                transition: 'all 0.2s ease',
                                                                flexShrink: 0
                                                            }}
                                                            onMouseEnter={(e) => {
                                                                e.currentTarget.style.backgroundColor = '#a7f3d0';
                                                            }}
                                                            onMouseLeave={(e) => {
                                                                e.currentTarget.style.backgroundColor = '#d1fae5';
                                                            }}
                                                            title="View Job"
                                                        >
                                                            <i className="ti-eye" style={{ fontSize: '16px' }}></i>
                                                        </button>
                                                        
                                                        {/* Withdraw Button */}
                                                        <button
                                                            onClick={(e) => {
                                                                e.preventDefault();
                                                                e.stopPropagation();
                                                                if (window.confirm('Are you sure you want to withdraw this application?')) {
                                                                withdraw(app.id);
                                                                }
                                                            }}
                                                            style={{
                                                                display: 'inline-flex',
                                                                alignItems: 'center',
                                                                justifyContent: 'center',
                                                                width: '40px',
                                                                height: '40px',
                                                                backgroundColor: '#fee2e2',
                                                                color: '#dc2626',
                                                                border: 'none',
                                                                borderRadius: '8px',
                                                                cursor: 'pointer',
                                                                transition: 'all 0.2s ease',
                                                                flexShrink: 0
                                                            }}
                                                            onMouseEnter={(e) => {
                                                                e.currentTarget.style.backgroundColor = '#fecaca';
                                                            }}
                                                            onMouseLeave={(e) => {
                                                                e.currentTarget.style.backgroundColor = '#fee2e2';
                                                            }}
                                                            title="Withdraw Application"
                                                        >
                                                            <i className="ti-trash" style={{ fontSize: '16px' }}></i>
                                                        </button>
                                                    </div>
                                                </div>
                                                
                                                {/* Track Application Section */}
                                                <div 
                                                    style={{ 
                                                        marginTop: '0',
                                                        marginLeft: '-20px',
                                                        marginRight: '-20px',
                                                        marginBottom: '0',
                                                        paddingTop: '8px',
                                                        paddingBottom: '8px',
                                                        paddingLeft: '20px',
                                                        paddingRight: '20px',
                                                        backgroundColor: '#ffffff',
                                                        borderTop: '1px solid #e5e7eb',
                                                        borderBottomLeftRadius: '12px',
                                                        borderBottomRightRadius: '12px'
                                                    }}
                                                    onClick={(e) => e.stopPropagation()}
                                                >
                                                    <div
                                                        onClick={() => {
                                                            const willExpand = !expandedTracking[app.id];
                                                            setExpandedTracking(prev => ({
                                                                ...prev,
                                                                [app.id]: willExpand
                                                            }));
                                                            if (willExpand && !applicationHistory[app.id] && !historyLoading[app.id]) {
                                                                fetchApplicationHistory(app.id);
                                                            }
                                                        }}
                                                        style={{
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            justifyContent: 'space-between',
                                                            cursor: 'pointer',
                                                            padding: '4px 0',
                                                            userSelect: 'none'
                                                        }}
                                                    >
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                            <i className="ti-stats-up" style={{ color: '#28a745', fontSize: '18px' }}></i>
                                                            <span style={{ fontSize: '15px', fontWeight: '600', color: '#1a1a1a' }}>
                                                                Track Application
                                                            </span>
                                                        </div>
                                                        <i 
                                                            className={expandedTracking[app.id] ? 'ti-angle-up' : 'ti-angle-down'} 
                                                            style={{ color: '#28a745', fontSize: '18px', transition: 'transform 0.3s ease', marginRight: '-4px' }}
                                                        ></i>
                                                    </div>
                                                    
                                                    {/* Timeline - Expanded Content */}
                                                    {expandedTracking[app.id] && (
                                                        <div style={{ marginTop: '8px', paddingLeft: '8px', paddingBottom: '8px' }}>
                                                            {APPLICATION_STAGES.map((stage, index) => {
                                                                const isCompleted = currentStageIndex >= index;
                                                                const stageDate = getStageDate(stage.key);
                                                                const hasNext = index < APPLICATION_STAGES.length - 1;
                                                                return (
                                                                    <div
                                                                        key={`${app.id}-${stage.key}`}
                                                                        style={{ display: 'flex', alignItems: 'flex-start', marginBottom: hasNext ? '20px' : '0', position: 'relative' }}
                                                                    >
                                                                        <div style={{ marginRight: '16px', flexShrink: 0, position: 'relative', width: '24px' }}>
                                                                            <div style={{
                                                                                width: '24px',
                                                                                height: '24px',
                                                                                borderRadius: '50%',
                                                                                backgroundColor: isCompleted ? '#10b981' : '#e5e7eb',
                                                                                display: 'flex',
                                                                                alignItems: 'center',
                                                                                justifyContent: 'center',
                                                                                border: '2px solid #fff',
                                                                                boxShadow: isCompleted ? '0 0 0 2px #10b981' : '0 0 0 2px #e5e7eb',
                                                                                position: 'relative',
                                                                                zIndex: 2
                                                                            }}>
                                                                                {isCompleted ? (
                                                                                    <i className="ti-check" style={{ color: '#fff', fontSize: '12px', fontWeight: 'bold' }}></i>
                                                                                ) : (
                                                                                    <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#9ca3af' }}></div>
                                                                                )}
                                                                            </div>
                                                                            {hasNext && (
                                                                                <div style={{
                                                                                    position: 'absolute',
                                                                                    left: '50%',
                                                                                    transform: 'translateX(-50%)',
                                                                                    top: '24px',
                                                                                    width: '2px',
                                                                                    height: '20px',
                                                                                    backgroundColor: isCompleted ? '#10b981' : '#e5e7eb',
                                                                                    zIndex: 1
                                                                                }}></div>
                                                                            )}
                                                                        </div>
                                                                        <div style={{ flex: 1, paddingTop: '2px' }}>
                                                                            <div style={{
                                                                                fontSize: '14px',
                                                                                fontWeight: '600',
                                                                                color: isCompleted ? '#1a1a1a' : '#9ca3af',
                                                                                marginBottom: '0'
                                                                            }}>
                                                                                {stage.key === "accepted_rejected" ? acceptedRejectedLabel : stage.label}
                                                                                {isCompleted && stageDate && (
                                                                                    <span style={{ fontSize: '12px', fontWeight: '400', color: '#6b7280', marginLeft: '8px' }}>
                                                                                        {new Date(stageDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                                                                    </span>
                                                                                )}
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                );
                                                            })}
                                                            {historyLoading[app.id] && (
                                                                <div style={{ color: '#6b7280', fontSize: '12px', marginTop: '10px' }}>
                                                                    Loading timeline...
                                                                </div>
                                                            )}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })}
                            </div>
                            )}
                        </div>

                    </div>
                </div>
            </section>

            <Footer />
        </>
    );
}

export default AppliedJobs;
