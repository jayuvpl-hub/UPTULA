import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import Header from "../Components/Header";
import Footer from "../Components/Footer";
import EmployerSidebar from "./Sidebar";
import { API_BASE_URL } from "../config/api";

function ManageJobs() {

    const { user, loading: authLoading } = useAuth();
    const navigate = useNavigate();
    const [jobs, setJobs] = useState([]);
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState("");
    const [deleteJobId, setDeleteJobId] = useState(null);
    const [searchTerm, setSearchTerm] = useState("");
    const resolveLogoUrl = (logoPath) => {
        if (!logoPath) return '';
        if (logoPath.startsWith('http') || logoPath.startsWith('data:')) return logoPath;
        return `${API_BASE_URL}${logoPath.startsWith('/') ? logoPath : `/${logoPath}`}`;
    };

    const isEmployer = useMemo(() => {
        return user && (user.role === 'provider' || user.role === 'employer' || user.role === 'admin');
    }, [user]);

    const filteredJobs = useMemo(() => {
        const q = searchTerm.trim().toLowerCase();
        if (!q) return jobs;
        return jobs.filter((job) => {
            const title = String(job.jobTitle || job.title || job.job_title || '').toLowerCase();
            const company = String(job.companyName || job.company_name || '').toLowerCase();
            const email = String(job.email || '').toLowerCase();
            const location = String(job.city || job.state || job.country || job.address || '').toLowerCase();
            return title.includes(q) || company.includes(q) || email.includes(q) || location.includes(q);
        });
    }, [jobs, searchTerm]);

    useEffect(() => {
        if (!user) {
            navigate('/');
            return;
        }
        if (!isEmployer) {
            navigate('/');
            return;
        }
    }, [user, isEmployer, navigate]);

    useEffect(() => {
        const fetchJobs = async () => {
            try {
                setLoading(true);
                const token = localStorage.getItem('token');
                if (!token) return;
                const resp = await fetch(`${API_BASE_URL}/api/employer/jobs`, {
                    method: 'GET',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Accept': 'application/json'
                    },
                    credentials: 'include'
                });
                if (resp.ok) {
                    const data = await resp.json();
                    setJobs(Array.isArray(data.jobs) ? data.jobs : Array.isArray(data) ? data : []);
                } else {
                    setMessage('Failed to load jobs');
                    setTimeout(() => setMessage(''), 4000);
                }
            } catch (e) {
                setMessage('Failed to load jobs');
                setTimeout(() => setMessage(''), 4000);
            } finally {
                setLoading(false);
            }
        };
        if (isEmployer) {
            fetchJobs();
        }
    }, [isEmployer]);

    const handleEdit = (jobId) => {
        navigate(`/employer/add-jobs?edit=${jobId}`);
    };

    const showDeleteConfirm = (jobId) => {
        setDeleteJobId(jobId);
    };

    const handleDelete = async (jobId) => {
        try {
            const token = localStorage.getItem('token');
            if (!token) return;
            const resp = await fetch(`${API_BASE_URL}/api/employer/jobs/${jobId}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}`, 'Accept': 'application/json' },
                credentials: 'include'
            });
            if (resp.ok) {
                setJobs(prev => prev.filter(j => (j.id || j._id) !== jobId));
                setMessage('Job deleted successfully');
                setDeleteJobId(null);
                setTimeout(() => setMessage(''), 4000);
            } else {
                setMessage('Failed to delete job');
                setDeleteJobId(null);
                setTimeout(() => setMessage(''), 4000);
            }
        } catch (e) {
            setMessage('Failed to delete job');
            setDeleteJobId(null);
            setTimeout(() => setMessage(''), 4000);
        }
    };

    if (authLoading) {
        return (
            <div style={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                height: '100vh',
                backgroundColor: '#f8f9fa'
            }}>
                <div style={{
                    textAlign: 'center',
                    padding: '40px',
                    backgroundColor: 'white',
                    borderRadius: '10px',
                    boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
                }}>
                    <div style={{
                        width: '40px',
                        height: '40px',
                        border: '4px solid #f3f3f3',
                        borderTop: '4px solid #007bff',
                        borderRadius: '50%',
                        animation: 'spin 1s linear infinite',
                        margin: '0 auto 20px'
                    }}></div>
                    <h3>Loading...</h3>
                    <p>Please wait while we verify your session</p>
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

    if (!user || !isEmployer) {
        return (
            <div className="container" style={{ padding: '50px', textAlign: 'center' }}>
                <h2>Access Denied</h2>
                <p>Only employers can access this page.</p>
                <button onClick={() => navigate('/')} className="btn btn-primary">Go to Home</button>
            </div>
        );
    }

    return (
        <>
            {message && (
                <div
                    className={`alert ${message.includes('Failed') ? 'alert-danger' : 'alert-success'}`}
                    style={{
                        position: 'fixed',
                        top: '20px',
                        right: '20px',
                        zIndex: 9999,
                        minWidth: '300px',
                        padding: '15px 20px',
                        borderRadius: '5px',
                        boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
                    }}
                >
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
            `}</style>
            {/* ======================== Manage Job ========================= */}
            <section className="utf_manage_jobs_area padd-top-80 padd-bot-80">
                <div className="container">
                    <div className="row">
                        <div className="col-md-3 employer-dashboard-sidebar">
                            <EmployerSidebar active="manage-jobs" />
                        </div>
                        <div className="col-md-9 employer-dashboard-main">
                            <div style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                gap: '12px',
                                marginBottom: '16px',
                                flexWrap: 'wrap'
                            }}>
                                <div style={{ position: 'relative', width: '50%', maxWidth: '560px', minWidth: '260px', flex: '0 1 50%' }}>
                                    <i
                                        className="ti-search"
                                        style={{
                                            position: 'absolute',
                                            left: '12px',
                                            top: '50%',
                                            transform: 'translateY(-50%)',
                                            color: '#28a745',
                                            fontSize: '14px'
                                        }}
                                    />
                                    <input
                                        type="text"
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        placeholder="Search by title, company, location, or email"
                                        style={{
                                            width: '100%',
                                            border: '1px solid #dbe5f1',
                                            borderRadius: '9px',
                                            padding: '6px 12px 6px 36px',
                                            fontSize: '13px',
                                            minHeight: '34px',
                                            outline: 'none'
                                        }}
                                    />
                                </div>
                                <button
                                    type="button"
                                    onClick={() => navigate('/employer/add-jobs')}
                                    style={{
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        gap: '8px',
                                        border: '1.5px solid #28a745',
                                        borderRadius: '9px',
                                        backgroundColor: 'transparent',
                                        color: '#28a745',
                                        padding: '8px 14px',
                                        fontSize: '14px',
                                        fontWeight: '600',
                                        cursor: 'pointer',
                                        transition: 'all 0.2s ease'
                                    }}
                                    onMouseEnter={(e) => {
                                        e.currentTarget.style.backgroundColor = '#28a745';
                                        e.currentTarget.style.color = '#ffffff';
                                    }}
                                    onMouseLeave={(e) => {
                                        e.currentTarget.style.backgroundColor = 'transparent';
                                        e.currentTarget.style.color = '#28a745';
                                    }}
                                >
                                    <i className="ti-plus" />
                                    Add Job
                                </button>
                            </div>
                            <div className="table-responsive">
                                <table className="table table-lg table-hover table-striped">
                                    <thead>
                                        <tr>
                                            <th style={{ color: '#f8fafc', background: '#06b6d4' }}>Title</th>
                                            <th style={{ color: '#f8fafc', background: '#06b6d4' }}>Location</th>
                                            <th style={{ color: '#f8fafc', background: '#06b6d4' }}>Email</th>
                                            <th style={{ color: '#f8fafc', background: '#06b6d4' }}>Posted</th>
                                            <th style={{ color: '#f8fafc', background: '#06b6d4' }}>Action</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {loading ? (
                                            <tr><td colSpan="5">Loading...</td></tr>
                                        ) : filteredJobs.length === 0 ? (
                                            <tr><td colSpan="5">No jobs found.</td></tr>
                                        ) : (
                                            filteredJobs.map((job) => {
                                                const id = job._id || job.id;
                                                return (
                                                    <tr key={id}>
                                                        <td>
                                                            <a
                                                                href="#"
                                                                onClick={(e) => e.preventDefault()}
                                                                style={{ display: 'flex', alignItems: 'center', gap: '12px' }}
                                                            >
                                                                <div>
                                                                    <img
                                                                        src={resolveLogoUrl(job.companyLogoUrl)}
                                                                        className="avatar-lg"
                                                                        alt="Avatar"
                                                                        style={{
                                                                            width: '56px',
                                                                            height: '56px',
                                                                            objectFit: 'contain',
                                                                            backgroundColor: '#fff',
                                                                            borderRadius: '6px',
                                                                            border: '1px solid #e5e7eb',
                                                                            padding: '4px'
                                                                        }}
                                                                    />
                                                                </div>
                                                                <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                                                                    <span>{job.jobTitle || job.title || job.job_title}</span>
                                                                    <span className="mng-jb">{job.companyName || job.company_name}</span>
                                                                </div>
                                                            </a>
                                                        </td>
                                                        <td>
                                                            <i className="ti-location-pin" style={{ color: 'green' }} /> {job.city || job.state || job.country || job.address || '—'}
                                                        </td>
                                                        <td>
                                                            <i className="fa fa-envelope" style={{ color: 'green', background: 'transparent', boxShadow: 'none' }} /> {job.email || '—'}
                                                        </td>
                                                        <td>
                                                            <i className="ti-credit-card" style={{ color: 'green' }} /> {(job.createdAt || job.created_at) ? new Date(job.createdAt || job.created_at).toLocaleDateString() : '—'}
                                                        </td>
                                                        <td>
                                                            <a href="#" className="cl-success mrg-5" data-toggle="tooltip" data-original-title="Edit" onClick={(e) => { e.preventDefault(); handleEdit(id); }}>
                                                                <i className="fa fa-edit" />
                                                            </a>{" "}
                                                            <a href="#" className="cl-danger mrg-5" data-toggle="tooltip" data-original-title="Delete" onClick={(e) => { e.preventDefault(); showDeleteConfirm(id); }}>
                                                                <i className="fa fa-trash-o" />
                                                            </a>
                                                        </td>
                                                    </tr>
                                                );
                                            })
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </div>
            </section>
            {/* ====================== End Manage Company ================ */}

            {/* Delete Confirmation Modal */}
            {deleteJobId && (
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
                    onClick={() => setDeleteJobId(null)}
                >
                    <div
                        style={{
                            backgroundColor: 'white',
                            padding: '30px',
                            borderRadius: '8px',
                            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
                            maxWidth: '400px',
                            textAlign: 'center',
                            animation: 'slideIn 0.3s ease-out'
                        }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <h3 style={{ marginBottom: '15px', color: '#333' }}>Confirm Delete</h3>
                        <p style={{ marginBottom: '30px', color: '#666', fontSize: '14px' }}>
                            Are you sure you want to delete this job? This action cannot be undone.
                        </p>
                        <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', maxWidth: '360px', margin: '0 auto' }}>
                            <button
                                onClick={() => setDeleteJobId(null)}
                                style={{
                                    padding: '10px 20px',
                                    backgroundColor: '#28a745',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '5px',
                                    cursor: 'pointer',
                                    fontSize: '14px',
                                    fontWeight: '500',
                                    transition: 'background-color 0.3s'
                                }}
                                onMouseEnter={(e) => e.target.style.backgroundColor = '#218838'}
                                onMouseLeave={(e) => e.target.style.backgroundColor = '#28a745'}
                            >
                                No, Cancel
                            </button>
                            <button
                                onClick={() => handleDelete(deleteJobId)}
                                style={{
                                    padding: '10px 20px',
                                    backgroundColor: '#dc3545',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '5px',
                                    cursor: 'pointer',
                                    fontSize: '14px',
                                    fontWeight: '500',
                                    transition: 'background-color 0.3s'
                                }}
                                onMouseEnter={(e) => e.target.style.backgroundColor = '#c82333'}
                                onMouseLeave={(e) => e.target.style.backgroundColor = '#dc3545'}
                            >
                                Yes, Delete
                            </button>
                        </div>
                    </div>
                    <style>
                        {`
                            @keyframes slideIn {
                                from {
                                    transform: scale(0.9);
                                    opacity: 0;
                                }
                                to {
                                    transform: scale(1);
                                    opacity: 1;
                                }
                            }
                        `}
                    </style>
                </div>
            )}

            <Footer />
        </>
    );
}

export default ManageJobs;


