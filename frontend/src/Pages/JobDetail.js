import React, { useEffect, useMemo, useState } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import Header from "../Components/Header";
import Footer from "../Components/Footer";
import MobileAppDownload from "../Components/MobileAppDownload";
import WishlistButton from "../Components/WishlistButton";
import { API_BASE_URL } from "../config/api";
import { trackJobView } from "../utils/trackActivity";
import { formatJobSalary, getJobSalaryFilterSearch } from "../utils/jobSalary";
import { FaTwitter, FaGoogle, FaFacebookF, FaInstagram } from "react-icons/fa";

function JobDetail() {
    // Expect route param as /jobs/:slug-:id
    const { slug } = useParams();
    // Extract id from slug (e.g., "sde-123" -> 123)
    const id = slug && slug.split('-').pop();
    const navigate = useNavigate();
    const { user } = useAuth();

    const [job, setJob] = useState(null);
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');
    const [showFullDesc, setShowFullDesc] = useState(false);
    const [applyOpen, setApplyOpen] = useState(false);
    const [applyForm, setApplyForm] = useState({ name: '', email: '', phone: '', resume: null, pastedCv: '' });
    const [focusedField, setFocusedField] = useState(null);
    const [chatNotice, setChatNotice] = useState('');
    const [chatLoading, setChatLoading] = useState(false);
    const [relatedJobs, setRelatedJobs] = useState([]);
    const [relatedJobsLoading, setRelatedJobsLoading] = useState(false);
    const [appliedJobIds, setAppliedJobIds] = useState(new Set());
    const [chatRequestedJobIds, setChatRequestedJobIds] = useState(new Set());

    useEffect(() => {
        const fetchJob = async () => {
            if (!id) return;
            try {
                setLoading(true);
                // Always fetch by id for uniqueness
                const response = await fetch(`${API_BASE_URL}/api/jobs/${id}`, {
                    method: 'GET',
                    headers: { 'Accept': 'application/json' },
                    credentials: 'include'
                });
                if (response.ok) {
                    const data = await response.json();
                    const fetchedJob = data.job || data;
                    setJob(fetchedJob);
                    trackJobView(fetchedJob.id || fetchedJob._id);
                    // If URL does not match slugified title + id, redirect for SEO
                    if (fetchedJob.jobTitle) {
                        const { createSlug } = require('../utils/slug');
                        const jobSlug = `${createSlug(fetchedJob.jobTitle)}-${fetchedJob.id}`;
                        if (slug !== jobSlug) {
                            navigate(`/jobs/${jobSlug}`, { replace: true });
                        }
                    }
                } else {
                    setMessage('Failed to load job');
                    setTimeout(() => setMessage(''), 4000);
                }
            } catch (error) {
                console.error('Error fetching job:', error);
                setMessage('Failed to load job');
                setTimeout(() => setMessage(''), 4000);
            } finally {
                setLoading(false);
            }
        };
        fetchJob();
    }, [id, slug, navigate, API_BASE_URL]);

    // Fetch related jobs
    useEffect(() => {
        const fetchRelatedJobs = async () => {
            if (!job) return;
            
            try {
                setRelatedJobsLoading(true);
                let jobsList = [];
                
                // Strategy 1: Try to find jobs with similar title/keywords
                const jobTitle = job.jobTitle || job.title || '';
                if (jobTitle) {
                    const keywords = jobTitle.toLowerCase().split(/\s+/).filter(k => k.length > 3);
                    if (keywords.length > 0) {
                        const params = new URLSearchParams();
                        params.set('q', keywords[0]);
                        params.set('limit', '10');
                        params.set('page', '1');
                        
                        const response = await fetch(`${API_BASE_URL}/api/jobs?${params.toString()}`, {
                            method: 'GET',
                            headers: { 'Accept': 'application/json' },
                            credentials: 'include'
                        });
                        
                        if (response.ok) {
                            const data = await response.json();
                            jobsList = Array.isArray(data.jobs) ? data.jobs : [];
                            // Filter out current job
                            jobsList = jobsList.filter(j => (j.id || j._id) !== (job.id || job._id));
                        }
                    }
                }
                
                // Strategy 2: If no related jobs found, try same category
                if (jobsList.length === 0 && job.category) {
                    const params = new URLSearchParams();
                    params.set('category', job.category);
                    params.set('limit', '10');
                    params.set('page', '1');
                    
                    const response = await fetch(`${API_BASE_URL}/api/jobs?${params.toString()}`, {
                        method: 'GET',
                        headers: { 'Accept': 'application/json' },
                        credentials: 'include'
                    });
                    
                    if (response.ok) {
                        const data = await response.json();
                        jobsList = Array.isArray(data.jobs) ? data.jobs : [];
                        // Filter out current job
                        jobsList = jobsList.filter(j => (j.id || j._id) !== (job.id || job._id));
                    }
                }
                
                // Strategy 3: If still no jobs, fetch latest jobs as fallback
                if (jobsList.length === 0) {
                    const response = await fetch(`${API_BASE_URL}/api/jobs/latest?limit=10`, {
                        method: 'GET',
                        headers: { 'Accept': 'application/json' },
                        credentials: 'include'
                    });
                    
                    if (response.ok) {
                        const data = await response.json();
                        jobsList = Array.isArray(data.jobs) ? data.jobs : [];
                        // Filter out current job
                        jobsList = jobsList.filter(j => (j.id || j._id) !== (job.id || job._id));
                    }
                }
                
                // Limit to 10 jobs for display
                setRelatedJobs(jobsList.slice(0, 10));
            } catch (error) {
                console.error('Error fetching related jobs:', error);
            } finally {
                setRelatedJobsLoading(false);
            }
        };
        
        fetchRelatedJobs();
    }, [job, API_BASE_URL]);

    useEffect(() => {
        const fetchAppliedJobs = async () => {
            try {
                if (!user || user.role !== 'seeker') {
                    setAppliedJobIds(new Set());
                    return;
                }

                const token = localStorage.getItem('token');
                if (!token) {
                    setAppliedJobIds(new Set());
                    return;
                }

                const response = await fetch(`${API_BASE_URL}/api/applications/mine`, {
                    headers: {
                        Authorization: `Bearer ${token}`,
                        Accept: 'application/json',
                    },
                });

                if (!response.ok) return;

                const data = await response.json();
                const ids = (Array.isArray(data.applications) ? data.applications : [])
                    .map((application) => String(application.jobId))
                    .filter(Boolean);
                setAppliedJobIds(new Set(ids));
            } catch (error) {
                console.error('Error fetching applied jobs:', error);
            }
        };

        fetchAppliedJobs();
    }, [user]);

    useEffect(() => {
        const fetchRequestedChats = async () => {
            try {
                if (!user || user.role !== 'seeker') {
                    setChatRequestedJobIds(new Set());
                    return;
                }

                const token = localStorage.getItem('token');
                if (!token) {
                    setChatRequestedJobIds(new Set());
                    return;
                }

                const response = await fetch(`${API_BASE_URL}/api/chat/threads`, {
                    headers: {
                        Authorization: `Bearer ${token}`,
                        Accept: 'application/json',
                    },
                });

                if (!response.ok) return;

                const data = await response.json();
                const ids = (Array.isArray(data.threads) ? data.threads : [])
                    .map((thread) => thread?.jobId || thread?.job_id || thread?.job?.id || thread?.job?._id)
                    .filter(Boolean)
                    .map((value) => String(value));

                setChatRequestedJobIds(new Set(ids));
            } catch (error) {
                console.error('Error fetching requested chats:', error);
            }
        };

        fetchRequestedChats();
    }, [user]);

    const logo = useMemo(() => {
        const path = job?.companyLogoUrl;
        if (!path) return '';
        if (path.startsWith("http") || path.startsWith("data:")) return path;
        return `${API_BASE_URL}${path.startsWith("/") ? path : `/${path}`}`;
    }, [job]);

    const jobSalaryLabel = useMemo(() => formatJobSalary(job), [job]);
    const jobSalaryFilterTo = useMemo(() => {
        const search = getJobSalaryFilterSearch(job);
        return search ? `/jobs${search}` : null;
    }, [job]);

    const skills = useMemo(() => {
        if (!job?.skills) return [];
        return job.skills.split(",").map(s => s.trim());
    }, [job]);

    const valueOrNA = (v) => v ? v : "Not mentioned";

    const formatJobType = (type) => {
        if (!type) return "Not mentioned";
        return type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
    };

    const handleChatRequest = async () => {
        if (!user) {
            setMessage('Please login as a candidate to request chat');
            setTimeout(() => setMessage(''), 4000);
            return;
        }
        if (user.role !== 'seeker') {
            setChatNotice('Only candidate accounts can request employer chats.');
            setTimeout(() => setChatNotice(''), 4000);
            return;
        }
        if (!job?.id && !job?._id) {
            setChatNotice('Job not ready yet. Try again.');
            setTimeout(() => setChatNotice(''), 4000);
            return;
        }
        const activeJobId = String(job?.id || job?._id || '');
        if (activeJobId && chatRequestedJobIds.has(activeJobId)) {
            setChatNotice('Chat request already sent for this job.');
            setTimeout(() => setChatNotice(''), 4000);
            return;
        }
        try {
            setChatLoading(true);
            const token = localStorage.getItem('token');
            
            // Get jobTitle and sanitize it to remove any URL-like patterns
            let jobTitle = job?.jobTitle || job?.title || "this role";
            
            // Remove any URL patterns from job title to avoid "External links are not allowed" error
            jobTitle = jobTitle.replace(/https?:\/\/[^\s]+/gi, ''); // Remove http:// or https:// URLs
            jobTitle = jobTitle.replace(/www\.[^\s]+/gi, ''); // Remove www. URLs
            jobTitle = jobTitle.replace(/[a-zA-Z0-9-]+\.[a-zA-Z]{2,}/gi, ''); // Remove domain-like patterns
            jobTitle = jobTitle.replace(/\.com|\.net|\.org|\.io|\.co|\.in/gi, ''); // Remove common TLDs
            jobTitle = jobTitle.trim();
            
            // If jobTitle is empty after sanitization, use default
            if (!jobTitle || jobTitle.length === 0) {
                jobTitle = "this role";
            }
            
            // Create message with jobTitle
            const chatMessage = `Hi, I would like to discuss the ${jobTitle} role`;
            
            const response = await fetch(`${API_BASE_URL}/api/chat/request`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    jobId: job?.id || job?._id,
                    message: chatMessage
                })
            });
            const data = await response.json().catch(() => ({}));
            if (response.ok) {
                if (activeJobId) {
                    setChatRequestedJobIds((prev) => {
                        const next = new Set(prev);
                        next.add(activeJobId);
                        return next;
                    });
                }
                setChatNotice('Chat request sent! Check your inbox under Chat.');
                setTimeout(() => setChatNotice(''), 5000);
            } else {
                const duplicateRequest =
                    data?.code === 'DUPLICATE_CHAT_REQUEST' ||
                    data?.code === 'CHAT_REQUEST_ALREADY_EXISTS' ||
                    data?.code === 'CHAT_EXISTS' ||
                    (typeof data?.message === 'string' && data.message.toLowerCase().includes('already'));

                if (duplicateRequest && activeJobId) {
                    setChatRequestedJobIds((prev) => {
                        const next = new Set(prev);
                        next.add(activeJobId);
                        return next;
                    });
                }
                setChatNotice(data.message || 'Unable to request chat.');
                setTimeout(() => setChatNotice(''), 4000);
            }
        } catch (_) {
            setChatNotice('Unable to request chat right now.');
            setTimeout(() => setChatNotice(''), 4000);
        } finally {
            setChatLoading(false);
        }
    };

    const openApply = () => {
        if (!user) {
            const signinBtn = document.querySelector('[data-target="#signin"]');
            if (signinBtn) {
                signinBtn.click();
            }
            return;
        }
        setApplyForm({ name: '', email: '', phone: '', resume: null, pastedCv: '' });
        setApplyOpen(true);
    };

    const submitApplication = async () => {
        // Validation: Check if required fields are empty
        if (!applyForm.name || !applyForm.name.trim()) {
            setMessage('Please enter your name');
            setTimeout(() => setMessage(''), 4000);
            return;
        }
        if (!applyForm.email || !applyForm.email.trim()) {
            setMessage('Please enter your email');
            setTimeout(() => setMessage(''), 4000);
            return;
        }
        // Email format validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(applyForm.email.trim())) {
            setMessage('Please enter a valid email address');
            setTimeout(() => setMessage(''), 4000);
            return;
        }
        
        try {
            const token = localStorage.getItem('token');
            if (!token) {
                setMessage('Please login to apply');
                setTimeout(() => setMessage(''), 4000);
                return;
            }
            const formData = new FormData();
            formData.append('name', applyForm.name.trim());
            formData.append('email', applyForm.email.trim());
            if (applyForm.phone) formData.append('phone', applyForm.phone.trim());
            if (applyForm.pastedCv) formData.append('pastedCv', applyForm.pastedCv.trim());
            if (applyForm.resume) formData.append('resume', applyForm.resume);
            const jobId = job?.id || job?._id;
            const resp = await fetch(`${API_BASE_URL}/api/jobs/${jobId}/apply`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` },
                body: formData,
                credentials: 'include'
            });
            if (resp.ok) {
                setMessage('Applied successfully');
                setApplyOpen(false);
                if (jobId) {
                    setAppliedJobIds((prev) => {
                        const next = new Set(prev);
                        next.add(String(jobId));
                        return next;
                    });
                }
                setTimeout(() => setMessage(''), 4000);
            } else {
                const errorData = await resp.json().catch(() => ({ message: 'Unknown error' }));
                
                // Check for duplicate application error
                if (errorData.code === 'DUPLICATE_APPLICATION' || 
                    (errorData.message && errorData.message.includes('already applied'))) {
                    setMessage('You have already applied for this job');
                    if (jobId) {
                        setAppliedJobIds((prev) => {
                            const next = new Set(prev);
                            next.add(String(jobId));
                            return next;
                        });
                    }
                } else {
                    setMessage(`Failed to apply: ${errorData.message || 'Please try again'}`);
                }
                setTimeout(() => setMessage(''), 4000);
            }
        } catch (e) {
            setMessage('Failed to apply');
            setTimeout(() => setMessage(''), 4000);
        }
    };

    const currentJobId = job?.id || job?._id;
    const isCurrentJobApplied = currentJobId ? appliedJobIds.has(String(currentJobId)) : false;
    const isCurrentJobChatRequested = currentJobId ? chatRequestedJobIds.has(String(currentJobId)) : false;

    return (
        <>
            {message && (
                <div className={`alert ${message.includes('Failed') ? 'alert-danger' : 'alert-success'}`} style={{ position: 'fixed', top: '20px', right: '20px', zIndex: 9999 }}>
                    {message}
                </div>
            )}
            <Header />
            <style>{`
                .jobdetail-wishlist-hover button:hover i{
                    color:#ff4757 !important;
                }
                .jobdetail-skill-list {
                    display: flex;
                    flex-wrap: wrap;
                    gap: 8px;
                    width: 100%;
                    min-width: 0;
                    max-width: 100%;
                    overflow: hidden;
                    box-sizing: border-box;
                }
                .jobdetail-skill-chip {
                    padding: 4px 10px;
                    font-size: 12px;
                    background: #ecfdf5;
                    color: #15803d;
                    border-radius: 20px;
                    flex: 0 1 auto;
                    width: fit-content;
                    max-width: 100%;
                    min-width: 0;
                    overflow: hidden;
                    text-overflow: ellipsis;
                    white-space: nowrap;
                    box-sizing: border-box;
                }
                @media (max-width: 767px){
                    .jobdetail-main-card{
                        padding:16px !important;
                    }
                    .jobdetail-top{
                        flex-direction:column;
                        gap:14px !important;
                        padding-right:0 !important;
                    }
                    .jobdetail-top-logo-wrap{
                        align-items:flex-start !important;
                    }
                    .jobdetail-top-info{
                        width:100%;
                        min-width:0;
                    }
                    .jobdetail-meta-grid{
                        grid-template-columns:1fr !important;
                    }
                    .jobdetail-meta-item{
                        min-width:0;
                    }
                    .jobdetail-meta-item span{
                        overflow-wrap:anywhere;
                        word-break:break-word;
                    }
                    .jobdetail-apply-row{
                        justify-content:flex-end !important;
                        margin-right:0 !important;
                        margin-top:10px !important;
                    }
                    .jobdetail-wishlist-wrap{
                        top:16px !important;
                        right:16px !important;
                    }
                    .jobdetail-skill-list { gap: 6px; }
                    .jobdetail-skill-chip {
                        max-width: calc(100vw - 68px);
                        font-size: 11px;
                        padding: 4px 9px;
                    }
                }
            `}</style>

            <section className="padd-top-80 padd-bot-60">
                <div className="container">
                    <div className="row">

                        {/* ================= LEFT COLUMN ================= */}
                        <div className="col-md-8">

                            {/* ===== MAIN JOB CARD ===== */}
                            <div
                                className="card jobdetail-main-card"
                                style={{
                                    borderRadius: "16px",
                                    padding: "24px",
                                    marginBottom: "24px",
                                    boxShadow: "0 10px 30px rgba(0,0,0,0.06)",
                                    position: "relative"
                                }}
                            >
                                {/* Wishlist Button - Top Right */}
                                {user?.role === "seeker" && (
                                    <div className="jobdetail-wishlist-hover jobdetail-wishlist-wrap" style={{ position: "absolute", top: "24px", right: "24px", zIndex: 10 }}>
                                        <WishlistButton jobId={job?.id || job?._id} />
                                    </div>
                                )}

                                {/* TOP */}
                                <div className="jobdetail-top" style={{ display: "flex", gap: "20px", paddingRight: user?.role === "seeker" ? "50px" : "0" }}>
                                    {/* LOGO */}
                                    <div className="jobdetail-top-logo-wrap" style={{ display: "flex", flexDirection: "column", alignItems: "center", flexShrink: 0 }}>
                                        <div
                                            className="jobdetail-logo-box"
                                            style={{
                                                width: "90px",
                                                height: "90px",
                                                borderRadius: "12px",
                                                background: "#f0fdf4",
                                                display: "flex",
                                                alignItems: "center",
                                                justifyContent: "center"
                                            }}
                                        >
                                            <img
                                                src={logo}
                                                alt="logo"
                                                onError={(e) => e.target.src = "/assets/img/company_logo_1.png"}
                                                style={{
                                                    maxWidth: "75%",
                                                    maxHeight: "75%",
                                                    objectFit: "contain"
                                                }}
                                            />
                                        </div>
                                        {/* Request Chat Button under logo */}
                                        {user?.role === "seeker" && (
                                            <button 
                                                className="btn btn-outline-success"
                                                onClick={handleChatRequest}
                                                disabled={chatLoading || isCurrentJobChatRequested}
                                                style={{
                                                    marginTop: "10px",
                                                    padding: "6px 12px",
                                                    fontSize: "12px",
                                                    whiteSpace: "nowrap",
                                                    display: "inline-flex",
                                                    alignItems: "center",
                                                    gap: "6px",
                                                    cursor: (chatLoading || isCurrentJobChatRequested) ? 'not-allowed' : 'pointer',
                                                    opacity: (chatLoading || isCurrentJobChatRequested) ? 0.6 : 1
                                                }}
                                            >
                                                {chatLoading ? (
                                                    <>
                                                        <span>Requesting...</span>
                                                    </>
                                                ) : isCurrentJobChatRequested ? (
                                                    <>
                                                        <i className="ti-check" style={{ fontSize: "14px" }}></i>
                                                        Requested
                                                    </>
                                                ) : (
                                                    <>
                                                        <i className="ti-comments" style={{ fontSize: "14px" }}></i>
                                                        Request Chat
                                                    </>
                                                )}
                                            </button>
                                        )}
                                        {chatNotice && (
                                            <div style={{ 
                                                marginTop: "8px", 
                                                padding: "6px 10px", 
                                                borderRadius: "4px",
                                                fontSize: "11px",
                                                backgroundColor: chatNotice.includes('sent') ? '#e8f5e9' : '#fff3cd',
                                                color: chatNotice.includes('sent') ? '#2e7d32' : '#856404',
                                                textAlign: "center"
                                            }}>
                                                {chatNotice}
                                            </div>
                                        )}
                                    </div>

                                    {/* INFO */}
                                    <div className="jobdetail-top-info" style={{ flex: 1 }}>
                                        <h3 style={{ margin: 0, fontWeight: 600 }}>
                                            {loading ? "Loading..." : (job?.jobTitle || "—")}
                                        </h3>

                                        <p style={{ color: "#16a34a", fontWeight: 500 }}>
                                            {job?.companyName || "—"}
                                        </p>

                                        <div
                                            className="jobdetail-meta-grid"
                                            style={{
                                                display: "grid",
                                                gridTemplateColumns: "repeat(2, 1fr)",
                                                gap: "8px",
                                                fontSize: "14px",
                                                marginTop: "10px"
                                            }}
                                        >
                                            <div className="jobdetail-meta-item" style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                                                <span style={{ color: "#28a745", fontSize: "14px", fontWeight: "bold" }}>₹</span>
                                                {jobSalaryFilterTo ? (
                                                    <Link
                                                        to={jobSalaryFilterTo}
                                                        title="Browse jobs in this salary range"
                                                        style={{ color: "inherit", textDecoration: "none" }}
                                                    >
                                                        {jobSalaryLabel}
                                                    </Link>
                                                ) : (
                                                    <span>{jobSalaryLabel || "Not mentioned"}</span>
                                                )}
                                            </div>
                                            <div className="jobdetail-meta-item" style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                                                <i className="ti-user" style={{ color: "#28a745", fontSize: "14px" }}></i>
                                                <span>{job?.noOfVacancy ? `${job.noOfVacancy} vacancy${job.noOfVacancy > 1 ? 'ies' : ''}` : "Not mentioned"}</span>
                                            </div>
                                            <div className="jobdetail-meta-item" style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                                                <i className="ti-stats-up" style={{ color: "#28a745", fontSize: "14px" }}></i>
                                                <span>{valueOrNA(job?.experience)}</span>
                                            </div>
                                            <div className="jobdetail-meta-item" style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                                                <i className="ti-calendar" style={{ color: "#28a745", fontSize: "14px" }}></i>
                                                <span>{formatJobType(job?.jobType)}</span>
                                            </div>
                                            <div className="jobdetail-meta-item" style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                                                <i className="ti-location-pin" style={{ color: "#28a745", fontSize: "14px" }}></i>
                                                <span>{valueOrNA(job?.address)}</span>
                                            </div>
                                            <div className="jobdetail-meta-item" style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                                                <i className="ti-check-box" style={{ color: "#28a745", fontSize: "14px" }}></i>
                                                <span>{job?.status ? job.status.charAt(0).toUpperCase() + job.status.slice(1) : "Not mentioned"}</span>
                                            </div>
                                        </div>
                                        
                                        {/* Apply Button - Right side aligned with status */}
                                        <div
                                            className="jobdetail-apply-row"
                                            style={{
                                                display: "flex",
                                                justifyContent: "flex-end",
                                                marginTop: "4px",
                                                marginRight: "-8px"
                                            }}
                                        >
                                            {isCurrentJobApplied ? (
                                                <span
                                                    style={{
                                                        display: "flex",
                                                        alignItems: "center",
                                                        gap: "6px",
                                                        color: "#2563EB",
                                                        fontWeight: "500",
                                                        background: "transparent",
                                                        border: "none",
                                                        fontSize: "14px"
                                                    }}
                                                >
                                                    <i className="ti-check" style={{ fontSize: "14px" }}></i>
                                                    Applied
                                                </span>
                                            ) : (
                                                <button 
                                                    className=""
                                                    onClick={openApply}
                                                    style={{
                                                        fontSize: "13px",
                                                        fontWeight: "600",
                                                        padding: "6px 14px",
                                                        borderRadius: "8px",
                                                        border: "1px solid #26AE61",
                                                        color: "#26AE61",
                                                        background: "transparent",
                                                        textDecoration: "none",
                                                        whiteSpace: "nowrap",
                                                        transition: "background 150ms ease, color 150ms ease",
                                                        display: "inline-flex",
                                                        alignItems: "center",
                                                        gap: "8px"
                                                    }}
                                                    onMouseEnter={(e) => {
                                                        e.currentTarget.style.background = "#26AE61";
                                                        e.currentTarget.style.color = "#ffffff";
                                                    }}
                                                    onMouseLeave={(e) => {
                                                        e.currentTarget.style.background = "transparent";
                                                        e.currentTarget.style.color = "#26AE61";
                                                    }}
                                                >
                                                    Apply Now
                                                    <i className="ti-arrow-right" style={{ fontSize: "14px" }}></i>
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* ===== SKILLS ===== */}
                            {job && (
                                <div
                                    className="card"
                                    style={{
                                        borderRadius: "14px",
                                        padding: "16px",
                                        marginBottom: "20px"
                                    }}
                                >
                                    <h4>Skills</h4>
                                    <div className="jobdetail-skill-list">
                                        {skills.length > 0 ? skills.map((s, i) => (
                                            <span key={i} className="jobdetail-skill-chip">
                                                {s}
                                            </span>
                                        )) : "Not mentioned"}
                                    </div>
                                </div>
                            )}

                            {/* ===== QUALIFICATION + DESCRIPTION ===== */}
                            {job && (
                                <div
                                    className="card"
                                    style={{
                                        borderRadius: "14px",
                                        padding: "20px"
                                    }}
                                >
                                    <h4>Qualification</h4>
                                    <p>{valueOrNA(job?.qualification)}</p>

                                    <h4 style={{ marginTop: "20px" }}>Job Description</h4>
                                    <div style={{ whiteSpace: "pre-line", position: "relative", overflowWrap: "anywhere", wordBreak: "break-word" }}>
                                        {job?.description ? (
                                            <>
                                                <p style={{ margin: 0, display: "inline", overflowWrap: "anywhere", wordBreak: "break-word" }}>
                                                    {showFullDesc
                                                        ? job.description
                                                        : job.description.length > 350
                                                        ? job.description.slice(0, 350)
                                                        : job.description}
                                                </p>
                                                {job.description.length > 350 && (
                                                    <>
                                                        {!showFullDesc && <span>...</span>}
                                                        <button
                                                            onClick={() => setShowFullDesc(!showFullDesc)}
                                                            style={{
                                                                border: "none",
                                                                background: "none",
                                                                color: "#4066D4",
                                                                fontWeight: 500,
                                                                padding: "0 0 0 4px",
                                                                cursor: "pointer",
                                                                display: "inline"
                                                            }}
                                                        >
                                                            {showFullDesc ? " Read less" : " Read more"}
                                                        </button>
                                                    </>
                                                )}
                                            </>
                                        ) : "Not mentioned"}
                                    </div>

                                    {/* SOCIAL ICONS */}
                                    <div
                                        style={{
                                            display: "flex",
                                            gap: "14px",
                                            marginTop: "20px"
                                        }}
                                    >
                                        {job?.twitter && <a href={job.twitter} target="_blank" rel="noopener noreferrer" style={{ color: '#1da1f2', fontSize: '20px' }}><FaTwitter /></a>}
                                        {job?.google && <a href={job.google} target="_blank" rel="noopener noreferrer" style={{ color: '#4285f4', fontSize: '20px' }}><FaGoogle /></a>}
                                        {job?.facebook && <a href={job.facebook} target="_blank" rel="noopener noreferrer" style={{ color: '#1877f2', fontSize: '20px' }}><FaFacebookF /></a>}
                                        {job?.instagram && <a href={job.instagram} target="_blank" rel="noopener noreferrer" style={{ color: '#e4405f', fontSize: '20px' }}><FaInstagram /></a>}
                                    </div>
                                </div>
                            )}

                        </div>

                        {/* ================= RIGHT COLUMN ================= */}
                        <div className="col-md-4">
                            {job && (
                                <div className="widget-boxed">
                                    <div className="widget-boxed-header" style={{ borderBottom: 'none' }}>
                                        <h4>Related Jobs</h4>
                                    </div>
                                    <div className="widget-boxed-body" style={{ padding: '0' }}>
                                        {relatedJobsLoading ? (
                                            <div style={{ textAlign: 'center', padding: '20px' }}>
                                                <p>Loading related jobs...</p>
                                            </div>
                                        ) : relatedJobs.length > 0 ? (
                                            relatedJobs.map((relatedJob) => {
                                                const relatedId = relatedJob._id || relatedJob.id;
                                                const logoPath = relatedJob.companyLogoUrl || relatedJob.logo || relatedJob.logoUrl || relatedJob.company_logo;
                                                let relatedLogo;
                                                if (!logoPath || logoPath === null || logoPath === 'null' || logoPath.trim() === '') {
                                                    relatedLogo = "/assets/img/company_logo_1.png";
                                                } else if (logoPath.startsWith('http://') || logoPath.startsWith('https://') || logoPath.startsWith('data:')) {
                                                    relatedLogo = logoPath;
                                                } else {
                                                    const baseUrl = API_BASE_URL.endsWith('/') ? API_BASE_URL.slice(0, -1) : API_BASE_URL;
                                                    const cleanPath = logoPath.startsWith('/') ? logoPath : `/${logoPath}`;
                                                    relatedLogo = `${baseUrl}${cleanPath}`;
                                                }
                                                const relatedTitle = relatedJob.jobTitle || relatedJob.title || '—';
                                                const relatedCompany = relatedJob.companyName || relatedJob.company || '—';
                                                let relatedLocation = '—';
                                                if (relatedJob.city && typeof relatedJob.city === 'string') {
                                                    relatedLocation = relatedJob.city.replace(/\b\w/g, c => c.toUpperCase());
                                                } else if (relatedJob.address && typeof relatedJob.address === 'string') {
                                                    const cityCandidate = relatedJob.address.split(',')[0].trim();
                                                    relatedLocation = cityCandidate.replace(/\b\w/g, c => c.toUpperCase());
                                                } else if (relatedJob.location && typeof relatedJob.location === 'string') {
                                                    const cityCandidate = relatedJob.location.split(',')[0].trim();
                                                    relatedLocation = cityCandidate.replace(/\b\w/g, c => c.toUpperCase());
                                                }
                                                const jobTypeRaw = relatedJob.jobType || relatedJob.job_type || relatedJob.type || '—';
                                                let relatedJobType = '—';
                                                if (jobTypeRaw && jobTypeRaw !== '—') {
                                                    relatedJobType = jobTypeRaw.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
                                                }
                                                const relatedSalary = formatJobSalary(relatedJob);
                                                const getTimeAgo = (dateString) => {
                                                    if (!dateString) return 'Recently';
                                                    const now = new Date();
                                                    const posted = new Date(dateString);
                                                    const diffMs = now - posted;
                                                    const diffMins = Math.floor(diffMs / 60000);
                                                    const diffHours = Math.floor(diffMs / 3600000);
                                                    const diffDays = Math.floor(diffMs / 86400000);
                                                    const diffWeeks = Math.floor(diffDays / 7);
                                                    const diffMonths = Math.floor(diffDays / 30);
                                                    if (diffMins < 1) return 'Just now';
                                                    if (diffMins < 60) return `${diffMins} min${diffMins > 1 ? 's' : ''} ago`;
                                                    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
                                                    if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
                                                    if (diffWeeks < 4) return `${diffWeeks} week${diffWeeks > 1 ? 's' : ''} ago`;
                                                    if (diffMonths < 12) return `${diffMonths} month${diffMonths > 1 ? 's' : ''} ago`;
                                                    return `${Math.floor(diffDays / 365)} year${Math.floor(diffDays / 365) > 1 ? 's' : ''} ago`;
                                                };
                                                const timePosted = getTimeAgo(relatedJob.createdAt || relatedJob.created_at || relatedJob.postedDate);
                                                return (
                                                    <div 
                                                        key={relatedId} 
                                                        onClick={() => {
                                                            const { createSlug } = require('../utils/slug');
                                                            const relatedTitle = relatedJob.jobTitle || relatedJob.title || '';
                                                            const relatedSlug = relatedTitle ? `${createSlug(relatedTitle)}-${relatedId}` : relatedId;
                                                            navigate(`/jobs/${relatedSlug}`);
                                                        }}
                                                        style={{
                                                            cursor: 'pointer',
                                                            backgroundColor: 'white',
                                                            borderRadius: '8px',
                                                            padding: '12px',
                                                            paddingBottom: '12px',
                                                            boxShadow: '0 2px 6px rgba(0,0,0,0.08)',
                                                            transition: 'all 0.2s ease',
                                                            position: 'relative',
                                                            border: '1px solid #e1e5e9',
                                                            marginBottom: '12px',
                                                            marginLeft: '0',
                                                            marginRight: '0'
                                                        }}
                                                        onMouseEnter={(e) => {
                                                            e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.12)';
                                                            e.currentTarget.style.transform = 'translateY(-2px)';
                                                        }}
                                                        onMouseLeave={(e) => {
                                                            e.currentTarget.style.boxShadow = '0 2px 6px rgba(0,0,0,0.08)';
                                                            e.currentTarget.style.transform = 'translateY(0)';
                                                        }}
                                                    >
                                                        {/* Top Section: Logo, Title, Company */}
                                                        <div style={{ display: 'flex', alignItems: 'flex-start', marginBottom: '10px', position: 'relative' }}>
                                                            {/* Company Logo */}
                                                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', marginRight: '10px', flexShrink: 0 }}>
                                                                <div style={{ 
                                                                    width: '45px', 
                                                                    height: '45px', 
                                                                    minWidth: '45px',
                                                                    borderRadius: '6px',
                                                                    overflow: 'hidden',
                                                                    border: '1px solid #e1e5e9',
                                                                    display: 'flex',
                                                                    alignItems: 'center',
                                                                    justifyContent: 'center',
                                                                    backgroundColor: '#f8f9fa'
                                                                }}>
                                                                    <img 
                                                                        src={relatedLogo} 
                                                                        className="img-responsive" 
                                                                        alt={relatedCompany}
                                                                        style={{ 
                                                                            width: '100%', 
                                                                            height: '100%', 
                                                                            objectFit: 'contain' 
                                                                        }}
                                                                        onError={(e) => {
                                                                            e.target.src = "/assets/img/company_logo_1.png";
                                                                        }}
                                                                    />
                                                                </div>
                                                            </div>
                                                            
                                                            {/* Job Title and Company Name */}
                                                            <div style={{ flex: 1, minWidth: 0 }}>
                                                                <h5 style={{ 
                                                                    margin: '0 0 4px 0', 
                                                                    fontSize: '14px', 
                                                                    fontWeight: '600',
                                                                    color: '#1a1a1a',
                                                                    lineHeight: '1.3',
                                                                    wordBreak: 'break-word',
                                                                    overflow: 'hidden',
                                                                    textOverflow: 'ellipsis',
                                                                    display: '-webkit-box',
                                                                    WebkitLineClamp: 2,
                                                                    WebkitBoxOrient: 'vertical'
                                                                }}>
                                                                    {relatedTitle}
                                                                </h5>
                                                                <span style={{ 
                                                                    fontSize: '12px', 
                                                                    color: '#6b7280',
                                                                    display: 'block',
                                                                    marginBottom: '8px'
                                                                }}>
                                                                    {relatedCompany}
                                                                </span>
                                                                
                                                                {/* Job Details - Compact */}
                                                                <div style={{ 
                                                                    display: 'flex', 
                                                                    flexDirection: 'column',
                                                                    gap: '4px',
                                                                    fontSize: '12px',
                                                                    color: '#4b5563'
                                                                }}>
                                                                    {/* Row 1: Job Type and Location side by side */}
                                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                                                                        {/* Job Type */}
                                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '5px', flex: '1 1 auto', minWidth: 0 }}>
                                                                            <i className="ti-briefcase" style={{ color: '#28a745', fontSize: '12px', flexShrink: 0 }}></i>
                                                                            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                                                {relatedJobType.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                                                                            </span>
                                                                        </div>
                                                                        
                                                                        {/* Location */}
                                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '5px', flex: '1 1 auto', minWidth: 0 }}>
                                                                            <i className="ti-location-pin" style={{ color: '#28a745', fontSize: '12px', flexShrink: 0 }}></i>
                                                                            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                                                {relatedLocation}
                                                                            </span>
                                                                        </div>
                                                                    </div>
                                                                    
                                                                    {/* Row 2: Time Posted and Salary side by side */}
                                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', marginBottom: '0' }}>
                                                                        {/* Time Posted */}
                                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '5px', flex: '1 1 auto', minWidth: 0 }}>
                                                                            <i className="ti-time" style={{ color: '#28a745', fontSize: '12px', flexShrink: 0 }}></i>
                                                                            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                                                {timePosted}
                                                                            </span>
                                                                        </div>
                                                                        
                                                                        {/* Salary */}
                                                                        {relatedSalary ? (
                                                                            <div style={{ display: 'flex', alignItems: 'center', gap: '5px', flex: '1 1 auto', minWidth: 0 }}>
                                                                                <span style={{ color: '#28a745', fontSize: '12px', fontWeight: 'bold', flexShrink: 0 }}>₹</span>
                                                                                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                                                    {relatedSalary}
                                                                                </span>
                                                                            </div>
                                                                        ) : (
                                                                            <div style={{ flex: '1 1 auto' }}></div>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                );
                                            })
                                        ) : (
                                            <div style={{ textAlign: 'center', padding: '20px' }}>
                                                <p style={{ color: '#6b7280', fontSize: '14px' }}>No related jobs available</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}
                            {loading && (
                                <div className="widget-boxed" style={{ textAlign: 'center', padding: '20px' }}>
                                    <p>Loading job details...</p>
                                </div>
                            )}
                        </div>

                    </div>
                </div>
            </section>

            {/* Apply Job Popup */}
            {applyOpen && (
                <div 
                    className="modal fade in" 
                    id="apply-job" 
                    style={{ display: 'block', background: 'rgba(0,0,0,0.5)' }} 
                    tabIndex={-1} 
                    role="dialog" 
                    aria-labelledby="myModalLabel2" 
                    aria-hidden="false"
                    onClick={() => setApplyOpen(false)}
                >
                    <div className="modal-dialog" onClick={(e) => e.stopPropagation()} style={{ maxHeight: '95vh', margin: '2% auto' }}>
                        <div className="modal-content" id="myModalLabel2" style={{ maxHeight: '95vh', display: 'flex', flexDirection: 'column' }}>
                            <div className="modal-body" style={{ padding: '20px', overflowY: 'auto', flex: '1 1 auto', maxHeight: 'calc(95vh - 60px)' }}>
                                <div className="text-center mrg-bot-20">
                                    <h4 className="mrg-0">{job?.jobTitle || job?.title}</h4>
                                </div>
                                <form onSubmit={(e)=>{e.preventDefault(); submitApplication();}}>
                                    <div className="col-md-12 col-sm-12">
                                        <div style={{ position: 'relative', marginBottom: '18px' }}>
                                            <i className="ti-user" style={{ 
                                                position: 'absolute', 
                                                left: '12px', 
                                                top: '50%', 
                                                transform: 'translateY(-50%)', 
                                                color: focusedField === 'name' ? '#28a745' : '#999',
                                                transition: 'all 0.3s ease',
                                                pointerEvents: 'none',
                                                zIndex: 2,
                                                fontSize: '16px'
                                            }}></i>
                                            <label style={{
                                                position: 'absolute',
                                                left: '40px',
                                                top: focusedField === 'name' || applyForm.name ? '-10px' : '50%',
                                                transform: focusedField === 'name' || applyForm.name ? 'translateY(0) scale(0.85)' : 'translateY(-50%)',
                                                fontSize: focusedField === 'name' || applyForm.name ? '12px' : '14px',
                                                color: focusedField === 'name' ? '#28a745' : '#999',
                                                transition: 'all 0.3s ease',
                                                pointerEvents: 'none',
                                                zIndex: 3,
                                                fontWeight: '500',
                                                backgroundColor: 'white',
                                                padding: focusedField === 'name' || applyForm.name ? '0 4px' : '0',
                                                marginLeft: focusedField === 'name' || applyForm.name ? '-4px' : '0'
                                            }}>
                                                Name
                                            </label>
                                            <input 
                                                type="text" 
                                                className="form-control" 
                                                value={applyForm.name} 
                                                onChange={(e)=>setApplyForm(prev=>({...prev, name: e.target.value}))}
                                                onFocus={() => setFocusedField('name')}
                                                onBlur={() => setFocusedField(null)}
                                                style={{
                                                    padding: '14px 12px 14px 40px',
                                                    border: `2px solid ${focusedField === 'name' ? '#28a745' : '#e1e5e9'}`,
                                                    borderRadius: '6px',
                                                    fontSize: '14px',
                                                    outline: 'none',
                                                    transition: 'all 0.3s ease',
                                                    boxShadow: focusedField === 'name' ? '0 0 0 3px rgba(40, 167, 69, 0.1)' : 'none',
                                                    height: '48px'
                                                }}
                                            />
                                        </div>
                                    </div>
                                    <div className="col-md-12 col-sm-12">
                                        <div style={{ position: 'relative', marginBottom: '18px' }}>
                                            <i className="ti-email" style={{ 
                                                position: 'absolute', 
                                                left: '12px', 
                                                top: '50%', 
                                                transform: 'translateY(-50%)', 
                                                color: focusedField === 'email' ? '#28a745' : '#999',
                                                transition: 'all 0.3s ease',
                                                pointerEvents: 'none',
                                                zIndex: 2,
                                                fontSize: '16px'
                                            }}></i>
                                            <label style={{
                                                position: 'absolute',
                                                left: '40px',
                                                top: focusedField === 'email' || applyForm.email ? '-10px' : '50%',
                                                transform: focusedField === 'email' || applyForm.email ? 'translateY(0) scale(0.85)' : 'translateY(-50%)',
                                                fontSize: focusedField === 'email' || applyForm.email ? '12px' : '14px',
                                                color: focusedField === 'email' ? '#28a745' : '#999',
                                                transition: 'all 0.3s ease',
                                                pointerEvents: 'none',
                                                zIndex: 3,
                                                fontWeight: '500',
                                                backgroundColor: 'white',
                                                padding: focusedField === 'email' || applyForm.email ? '0 4px' : '0',
                                                marginLeft: focusedField === 'email' || applyForm.email ? '-4px' : '0'
                                            }}>
                                                Email
                                            </label>
                                            <input 
                                                type="email" 
                                                className="form-control" 
                                                value={applyForm.email} 
                                                onChange={(e)=>setApplyForm(prev=>({...prev, email: e.target.value}))}
                                                onFocus={() => setFocusedField('email')}
                                                onBlur={() => setFocusedField(null)}
                                                style={{
                                                    padding: '14px 12px 14px 40px',
                                                    border: `2px solid ${focusedField === 'email' ? '#28a745' : '#e1e5e9'}`,
                                                    borderRadius: '6px',
                                                    fontSize: '14px',
                                                    outline: 'none',
                                                    transition: 'all 0.3s ease',
                                                    boxShadow: focusedField === 'email' ? '0 0 0 3px rgba(40, 167, 69, 0.1)' : 'none',
                                                    height: '48px'
                                                }}
                                            />
                                        </div>
                                    </div>
                                    <div className="col-md-12 col-sm-12">
                                        <div style={{ position: 'relative', marginBottom: '18px' }}>
                                            <i className="ti-mobile" style={{ 
                                                position: 'absolute', 
                                                left: '12px', 
                                                top: '50%', 
                                                transform: 'translateY(-50%)', 
                                                color: focusedField === 'phone' ? '#28a745' : '#999',
                                                transition: 'all 0.3s ease',
                                                pointerEvents: 'none',
                                                zIndex: 2,
                                                fontSize: '16px'
                                            }}></i>
                                            <label style={{
                                                position: 'absolute',
                                                left: '40px',
                                                top: focusedField === 'phone' || applyForm.phone ? '-10px' : '50%',
                                                transform: focusedField === 'phone' || applyForm.phone ? 'translateY(0) scale(0.85)' : 'translateY(-50%)',
                                                fontSize: focusedField === 'phone' || applyForm.phone ? '12px' : '14px',
                                                color: focusedField === 'phone' ? '#28a745' : '#999',
                                                transition: 'all 0.3s ease',
                                                pointerEvents: 'none',
                                                zIndex: 3,
                                                fontWeight: '500',
                                                backgroundColor: 'white',
                                                padding: focusedField === 'phone' || applyForm.phone ? '0 4px' : '0',
                                                marginLeft: focusedField === 'phone' || applyForm.phone ? '-4px' : '0'
                                            }}>
                                                Phone
                                            </label>
                                            <input 
                                                type="text" 
                                                className="form-control" 
                                                value={applyForm.phone} 
                                                onChange={(e)=>setApplyForm(prev=>({...prev, phone: e.target.value}))}
                                                onFocus={() => setFocusedField('phone')}
                                                onBlur={() => setFocusedField(null)}
                                                style={{
                                                    padding: '14px 12px 14px 40px',
                                                    border: `2px solid ${focusedField === 'phone' ? '#28a745' : '#e1e5e9'}`,
                                                    borderRadius: '6px',
                                                    fontSize: '14px',
                                                    outline: 'none',
                                                    transition: 'all 0.3s ease',
                                                    boxShadow: focusedField === 'phone' ? '0 0 0 3px rgba(40, 167, 69, 0.1)' : 'none',
                                                    height: '48px'
                                                }}
                                            />
                                        </div>
                                    </div>
                                    <div className="col-md-12 col-sm-12">
                                        <div style={{ position: 'relative', marginBottom: '18px' }}>
                                            <input 
                                                type="file" 
                                                id="file" 
                                                name="resume" 
                                                accept=".pdf,.doc,.docx"
                                                onChange={(e)=>setApplyForm(prev=>({...prev, resume: e.target.files && e.target.files[0]}))}
                                                style={{ display: 'none' }}
                                            />
                                            {!applyForm.resume ? (
                                                <button
                                                    type="button"
                                                    onClick={() => document.getElementById('file').click()}
                                                    style={{
                                                        width: '100%',
                                                        padding: '14px',
                                                        border: `2px solid ${focusedField === 'resume' ? '#28a745' : '#e1e5e9'}`,
                                                        borderRadius: '6px',
                                                        backgroundColor: '#fff',
                                                        cursor: 'pointer',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'center',
                                                        gap: '8px',
                                                        fontSize: '14px',
                                                        color: '#666',
                                                        transition: 'all 0.3s ease',
                                                        boxShadow: focusedField === 'resume' ? '0 0 0 3px rgba(40, 167, 69, 0.1)' : 'none',
                                                        height: '48px'
                                                    }}
                                                    onFocus={() => setFocusedField('resume')}
                                                    onBlur={() => setFocusedField(null)}
                                                >
                                                    <i className="ti-upload" style={{ fontSize: '16px', color: '#28a745' }}></i>
                                                    Upload your CV
                                                </button>
                                            ) : (
                                                <div style={{
                                                    width: '100%',
                                                    padding: '12px',
                                                    border: '2px solid #28a745',
                                                    borderRadius: '6px',
                                                    backgroundColor: '#f0f9ff',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'space-between',
                                                    gap: '8px',
                                                    height: '48px',
                                                    boxSizing: 'border-box'
                                                }}>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1, minWidth: 0 }}>
                                                        <i className="ti-file" style={{ fontSize: '16px', color: '#28a745' }}></i>
                                                        <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0, flex: 1 }}>
                                                            <span style={{ 
                                                                fontSize: '14px', 
                                                                color: '#333',
                                                                overflow: 'hidden',
                                                                textOverflow: 'ellipsis',
                                                                whiteSpace: 'nowrap',
                                                                lineHeight: '1.2'
                                                            }}>
                                                                {applyForm.resume.name}
                                                            </span>
                                                            <span style={{ 
                                                                fontSize: '11px', 
                                                                color: '#666',
                                                                lineHeight: '1.2'
                                                            }}>
                                                                {(applyForm.resume.size / 1024).toFixed(2)} KB
                                                            </span>
                                                        </div>
                                                    </div>
                                                    <button
                                                        type="button"
                                                        onClick={(e) => {
                                                            e.preventDefault();
                                                            setApplyForm(prev => ({ ...prev, resume: null }));
                                                            document.getElementById('file').value = '';
                                                        }}
                                                        style={{
                                                            padding: '4px 8px',
                                                            border: 'none',
                                                            borderRadius: '4px',
                                                            backgroundColor: '#ff4757',
                                                            color: 'white',
                                                            cursor: 'pointer',
                                                            fontSize: '12px',
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            gap: '4px',
                                                            transition: 'background-color 0.2s ease',
                                                            flexShrink: 0
                                                        }}
                                                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#ee3542'}
                                                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#ff4757'}
                                                    >
                                                        <i className="ti-close" style={{ fontSize: '12px' }}></i>
                                                        Remove
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                    <div className="clearfix" />
                                    <div className="col-md-12">
                                        <div style={{ position: 'relative', marginBottom: '18px' }}>
                                            <i className="ti-file-text" style={{ 
                                                position: 'absolute', 
                                                left: '12px', 
                                                top: focusedField === 'pastedCv' || applyForm.pastedCv ? '20px' : '50%', 
                                                transform: 'translateY(-50%)', 
                                                color: focusedField === 'pastedCv' ? '#28a745' : '#999',
                                                transition: 'all 0.3s ease',
                                                pointerEvents: 'none',
                                                zIndex: 2,
                                                fontSize: '16px'
                                            }}></i>
                                            <label style={{
                                                position: 'absolute',
                                                left: '40px',
                                                top: focusedField === 'pastedCv' || applyForm.pastedCv ? '-10px' : '50%',
                                                transform: focusedField === 'pastedCv' || applyForm.pastedCv ? 'translateY(0) scale(0.85)' : 'translateY(-50%)',
                                                fontSize: focusedField === 'pastedCv' || applyForm.pastedCv ? '12px' : '14px',
                                                color: focusedField === 'pastedCv' ? '#28a745' : '#999',
                                                transition: 'all 0.3s ease',
                                                pointerEvents: 'none',
                                                zIndex: 3,
                                                fontWeight: '500',
                                                backgroundColor: 'white',
                                                padding: focusedField === 'pastedCv' || applyForm.pastedCv ? '0 4px' : '0',
                                                marginLeft: focusedField === 'pastedCv' || applyForm.pastedCv ? '-4px' : '0'
                                            }}>
                                                Paste your cover letter
                                            </label>
                                            <textarea 
                                                className="form-control height-120" 
                                                value={applyForm.pastedCv} 
                                                onChange={(e)=>setApplyForm(prev=>({...prev, pastedCv: e.target.value}))}
                                                onFocus={() => setFocusedField('pastedCv')}
                                                onBlur={() => setFocusedField(null)}
                                                style={{
                                                    padding: focusedField === 'pastedCv' || applyForm.pastedCv ? '20px 12px 12px 40px' : '12px 12px 12px 40px',
                                                    minHeight: '100px',
                                                    border: `2px solid ${focusedField === 'pastedCv' ? '#28a745' : '#e1e5e9'}`,
                                                    borderRadius: '6px',
                                                    fontSize: '14px',
                                                    outline: 'none',
                                                    transition: 'all 0.3s ease',
                                                    resize: 'vertical',
                                                    boxShadow: focusedField === 'pastedCv' ? '0 0 0 3px rgba(40, 167, 69, 0.1)' : 'none',
                                                    boxSizing: 'border-box',
                                                    width: '100%'
                                                }}
                                            />
                                        </div>
                                    </div>
                                    <div className="col-md-12" style={{marginTop:'15px', textAlign: 'center', marginBottom: '0'}}>
                                        <button 
                                            type="submit" 
                                            className="btn theme-btn btn-m"
                                            style={{
                                                display: 'inline-flex',
                                                alignItems: 'center',
                                                gap: '8px',
                                                padding: '10px 24px',
                                                fontSize: '14px',
                                                fontWeight: '600'
                                            }}
                                        >
                                            Submit
                                            <i className="ti-arrow-right" style={{ fontSize: '14px' }}></i>
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    </div>
                </div>
            )}
            {/* Apply Job Popup */}

            <MobileAppDownload />
            <Footer />
        </>
    );
}


export default JobDetail;


