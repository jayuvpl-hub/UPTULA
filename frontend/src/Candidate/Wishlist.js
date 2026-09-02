import React, { useState, useEffect, useMemo } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import Header from "../Components/Header";
import Footer from "../Components/Footer";
import { API_BASE_URL } from "../config/api";
import CandidateSidebar from "./Sidebar";

function Wishlist() {
    const { user, profileData: contextProfileData, loading: authLoading, logout } = useAuth();
    const navigate = useNavigate();
    const [wishlist, setWishlist] = useState([]);
    const [loading, setLoading] = useState(true);
    const [message, setMessage] = useState('');

    // Memoize profile picture URL to prevent flickering
    const profilePictureUrl = useMemo(() => {
        if (!contextProfileData?.profilePictureUrl) {
            return "/assets/img/user-profile.png";
        }
        const url = contextProfileData.profilePictureUrl;
        if (url.startsWith('http') || url.startsWith('data:')) {
            return url;
        }
        return `${API_BASE_URL}${url}`;
    }, [contextProfileData?.profilePictureUrl]);

    useEffect(() => {
        if (authLoading) return;
        if (!user) {
            navigate('/');
            return;
        }
        if (user.role !== 'seeker') {
            navigate('/');
            return;
        }
        loadWishlist();
    }, [authLoading, user, navigate]);

    const loadWishlist = async () => {
        try {
            setLoading(true);
            setMessage(''); // Clear any previous messages
            const token = localStorage.getItem('token');
            if (!token) {
                navigate('/');
                return;
            }

            const response = await fetch(`${API_BASE_URL}/api/wishlist`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (response.ok) {
                const data = await response.json();
                setWishlist(data.wishlist || []);
            } else {
                // Try to get error message from response
                let errorMessage = 'Failed to load wishlist.';
                const contentType = response.headers.get('content-type');
                
                if (contentType && contentType.includes('application/json')) {
                    try {
                        const errorData = await response.json();
                        if (errorData.message) {
                            errorMessage = errorData.message;
                        } else if (response.status === 404) {
                            errorMessage = 'Wishlist not found.';
                        } else if (response.status === 403) {
                            errorMessage = 'Access denied. Only candidates can view wishlist.';
                        }
                    } catch (parseError) {
                        console.error('Error parsing JSON response:', parseError);
                        if (response.status === 404) {
                            errorMessage = 'Wishlist endpoint not found. Please check if the server is running.';
                        } else {
                            errorMessage = `Server error (${response.status}). Please try again.`;
                        }
                    }
                } else {
                    // Response is not JSON
                    if (response.status === 404) {
                        errorMessage = 'Wishlist endpoint not found. Please check if the server is running.';
                    } else {
                        errorMessage = `Server error (${response.status}). Please try again.`;
                    }
                }
                setMessage(errorMessage);
                setTimeout(() => setMessage(''), 5000);
            }
        } catch (error) {
            console.error('Error loading wishlist:', error);
            // Only show error message if it's a network error, not if it's a handled API error
            if (error.message && !error.message.includes('JSON')) {
                setMessage('Network error. Please check your connection and try again.');
            } else {
                setMessage('Failed to load wishlist. Please try again.');
            }
            setTimeout(() => setMessage(''), 3000);
        } finally {
            setLoading(false);
        }
    };

    const handleRemoveFromWishlist = async (jobId) => {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`${API_BASE_URL}/api/wishlist/${jobId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (response.ok) {
                setWishlist(wishlist.filter(job => job.id !== jobId));
                setMessage('Job removed from wishlist.');
                setTimeout(() => setMessage(''), 3000);
            } else {
                const errorData = await response.json().catch(() => ({}));
                setMessage(errorData.message || 'Failed to remove job.');
                setTimeout(() => setMessage(''), 3000);
            }
        } catch (error) {
            console.error('Error removing from wishlist:', error);
            setMessage('Failed to remove job.');
            setTimeout(() => setMessage(''), 3000);
        }
    };

    const getJobLogo = (job) => {
        const logoPath = job.companyLogoUrl;
        if (!logoPath) return '';
        if (logoPath.startsWith('http') || logoPath.startsWith('data:')) return logoPath;
        return `${API_BASE_URL}${logoPath.startsWith('/') ? logoPath : `/${logoPath}`}`;
    };

    const getLocation = (job) => {
        const parts = [job.city, job.state, job.country].filter(Boolean);
        return parts.length > 0 ? parts.join(', ') : '—';
    };

    // Show loading spinner while checking authentication
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

    if (!user) {
        return (
            <div className="container" style={{padding: '50px', textAlign: 'center'}}>
                <h2>Please login to access wishlist</h2>
                <button onClick={() => navigate('/')} className="btn btn-primary">Go to Home</button>
            </div>
        );
    }

    return (
        <>
            <style>
                {`
                    /* Removed sticky positioning to match normal scroll behavior */
                    #leftcol_item {
                        position: static;
                        top: auto;
                    }
                    .user_dashboard_pic {
                        min-height: 100px;
                    }
                    .user_dashboard_pic img {
                        transition: opacity 0.2s ease-in-out;
                    }
                    .dashboard_nav_item {
                        margin-top: 20px;
                    }
                    .dashboard_nav_item ul {
                        list-style: none;
                        padding: 0;
                        margin: 0;
                    }
                    .dashboard_nav_item li {
                        margin-bottom: 5px;
                    }
                    .dashboard_nav_item li a {
                        display: block;
                        padding: 12px 15px;
                        color: #333;
                        text-decoration: none;
                        border-radius: 8px;
                        transition: all 0.25s ease;
                        border: 1px solid transparent;
                    }
                    .dashboard_nav_item li a:hover,
                    .dashboard_nav_item li.active a {
                        background-color: rgba(40, 167, 69, 0.12);
                        color: #28a745;
                        border-color: rgba(40, 167, 69, 0.35);
                        box-shadow: 0 2px 8px rgba(40, 167, 69, 0.18);
                    }
                    @media (max-width: 991px) {
                        .candidate-dashboard-sidebar { display: none !important; }
                        .candidate-dashboard-main {
                            width: 100% !important;
                            max-width: 100% !important;
                            float: none !important;
                        }
                    }
                `}
            </style>
            {message && (
                <div className={`alert ${message.includes('removed') || message.includes('successfully') ? 'alert-success' : 'alert-danger'}`}
                    style={{ position: 'fixed', top: '20px', right: '20px', zIndex: 9999, minWidth: '300px', maxWidth: '400px' }}>
                    {message}
                </div>
            )}
            <Header />
            <section className="padd-top-80 padd-bot-80">
                <div className="container">
                    <div className="row">
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
                                        src={profilePictureUrl}
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
                                            if (e.target.src !== "/assets/img/user-profile.png") {
                                                e.target.src = "/assets/img/user-profile.png";
                                            }
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
                                        {user?.fullName || 'User'}
                                    </span>
                                </div>
                            </div>
                            <div className="dashboard_nav_item">
                                <ul>
                                    <li>
                                        <a href="#" onClick={(e) => {e.preventDefault(); navigate('/');}}>
                                            <i className="login-icon ti-dashboard" /> Home
                                        </a>
                                    </li>
                                    <li>
                                        <a href="#" onClick={(e) => {e.preventDefault(); navigate('/profile');}}>
                                            <i className="login-icon ti-user" /> Edit Profile
                                        </a>
                                    </li>
                                    <li>
                                        <a href="#" onClick={(e) => {e.preventDefault(); navigate('/candidate/applied-jobs');}}>
                                            <i className="login-icon ti-clipboard" /> Applied Jobs
                                        </a>
                                    </li>
                                    <li>
                                        <a href="#" onClick={(e) => {e.preventDefault(); navigate('/candidate/create-resume');}}>
                                            <i className="login-icon ti-file" /> Create Resume
                                        </a>
                                    </li>
                                    <li>
                                        <a href="#" onClick={(e) => {e.preventDefault(); navigate('/candidate/change-password');}}>
                                            <i className="login-icon ti-key" /> Change Password
                                        </a>
                                    </li>
                                    <li>
                                        <a href="#" onClick={(e) => {e.preventDefault(); navigate('/candidate/chat');}}>
                                            <i className="login-icon ti-comments" /> Chat Inbox
                                        </a>
                                    </li>
                                    <li className="active">
                                        <a href="#" onClick={(e) => e.preventDefault()}>
                                            <i className="login-icon ti-heart" /> My Wishlist
                                        </a>
                                    </li>
                                    <li>
                                        <a
                                            href="#"
                                            onClick={(e) => {
                                                e.preventDefault();
                                                logout();
                                                navigate('/');
                                            }}
                                        >
                                            <i className="login-icon ti-power-off" /> Logout
                                        </a>
                                    </li>
                                </ul>
                            </div> */}
                            <CandidateSidebar activePage="wishlist" />
                        </div>
                        <div className="col-md-9 candidate-dashboard-main">
                            {loading ? (
                                <div style={{ textAlign: 'center', padding: '40px' }}>
                                    <div className="spinner-border" role="status">
                                        <span className="sr-only">Loading...</span>
                                    </div>
                                </div>
                            ) : wishlist.length === 0 ? (
                                <div style={{ textAlign: 'center', padding: '60px' }}>
                                    <i className="ti-heart" style={{ fontSize: '64px', color: '#ddd', marginBottom: '20px' }}></i>
                                    <h3>Your wishlist is empty</h3>
                                    <p style={{ color: '#666', marginBottom: '30px' }}>
                                        Start saving jobs you're interested in by clicking the heart icon on any job listing.
                                    </p>
                                    <button
                                        className="btn theme-btn"
                                        onClick={() => navigate('/companies')}
                                        style={{ padding: '10px 20px' }}
                                    >
                                        Browse Jobs
                                    </button>
                                </div>
                            ) : (
                                <>
                                    <div className="job-verticle-list">
                                        {wishlist.map((job) => {
                                            const id = job.id || job._id;
                                            const logo = getJobLogo(job);
                                            const postedLabel = job.posted_at ? new Date(job.posted_at).toLocaleDateString() : 'Recently';
                                            const location = [job.city, job.state].filter(Boolean).join(', ') || '—';
                                            return (
                                                <div
                                                    key={id}
                                                    className="vertical-job-card"
                                                    onClick={() => navigate(`/jobs/${id}`)}
                                                    style={{
                                                        cursor: 'pointer',
                                                        background: '#fff',
                                                        border: '1px solid #e5e7eb',
                                                        borderRadius: '10px',
                                                        padding: '16px',
                                                        boxShadow: '0 4px 10px rgba(0,0,0,0.06)',
                                                        marginBottom: '14px',
                                                        transition: 'all 0.2s ease'
                                                    }}
                                                    onMouseEnter={(e) => {
                                                        e.currentTarget.style.transform = 'translateY(-2px)';
                                                        e.currentTarget.style.boxShadow = '0 8px 20px rgba(0,0,0,0.08)';
                                                    }}
                                                    onMouseLeave={(e) => {
                                                        e.currentTarget.style.transform = 'translateY(0)';
                                                        e.currentTarget.style.boxShadow = '0 4px 10px rgba(0,0,0,0.06)';
                                                    }}
                                                >
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                                        <div style={{
                                                            width: 60,
                                                            height: 60,
                                                            borderRadius: '10px',
                                                            border: '1px solid #e5e7eb',
                                                            background: '#f8fafc',
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            justifyContent: 'center',
                                                            overflow: 'hidden',
                                                            flexShrink: 0
                                                        }}>
                                                            <img
                                                                src={logo}
                                                                alt={job.company_name || 'Company'}
                                                                style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                                                                onError={(e) => { e.target.src = '/assets/img/company_logo_1.png'; }}
                                                            />
                                                        </div>
                                                        <div style={{ flex: 1, minWidth: 0 }}>
                                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px' }}>
                                                                <div style={{ minWidth: 0 }}>
                                                                    <div style={{ fontSize: 15, fontWeight: 700, color: '#111827', lineHeight: 1.3, marginBottom: 4 }}>
                                                                        {job.job_title || 'Untitled Role'}
                                                                    </div>
                                                                    <div style={{ fontSize: 13, color: '#6b7280', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
                                                                        <i className="ti-home" style={{ color: '#28a745', fontSize: 14 }}></i>
                                                                        {job.company_name || job.employer_company_name || 'Company'}
                                                                    </div>
                                                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', fontSize: 12, color: '#374151' }}>
                                                                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                                                                            <i className="ti-briefcase" style={{ color: '#28a745', fontSize: 13 }}></i>
                                                                            {job.job_type ? job.job_type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) : '—'}
                                                                        </span>
                                                                        {job.salary_range && (
                                                                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                                                                                <span style={{ color: '#28a745', fontWeight: 700, fontSize: 13 }}>₹</span>
                                                                                {job.salary_range}
                                                                            </span>
                                                                        )}
                                                                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                                                                            <i className="ti-location-pin" style={{ color: '#28a745', fontSize: 13 }}></i>
                                                                            {location}
                                                                        </span>
                                                                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                                                                            <i className="ti-calendar" style={{ color: '#28a745', fontSize: 13 }}></i>
                                                                            {postedLabel}
                                                                        </span>
                                                                    </div>
                                                                </div>
                                                                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 8 }}>
                                                                    <span style={{
                                                                        padding: '4px 10px',
                                                                        borderRadius: '999px',
                                                                        fontSize: 11,
                                                                        fontWeight: 700,
                                                                        backgroundColor: job.status === 'active' ? '#ecfdf3' : '#fef2f2',
                                                                        color: job.status === 'active' ? '#16a34a' : '#dc2626',
                                                                        border: `1px solid ${job.status === 'active' ? '#bbf7d0' : '#fecdd3'}`,
                                                                        display: 'inline-flex',
                                                                        alignItems: 'center',
                                                                        gap: 4
                                                                    }}>
                                                                        <i className={job.status === 'active' ? 'ti-check-box' : 'ti-close'} style={{ fontSize: 10 }}></i>
                                                                        {(job.status || 'status').charAt(0).toUpperCase() + (job.status || 'status').slice(1)}
                                                                    </span>
                                                                    <div style={{ display: 'flex', gap: 8 }}>
                                                                        <button
                                                                            onClick={(e) => {
                                                                                e.stopPropagation();
                                                                                navigate(`/jobs/${id}`);
                                                                            }}
                                                                            style={{
                                                                                width: 34,
                                                                                height: 34,
                                                                                borderRadius: 8,
                                                                                border: '1px solid #e5e7eb',
                                                                                background: '#fff',
                                                                                display: 'inline-flex',
                                                                                alignItems: 'center',
                                                                                justifyContent: 'center',
                                                                                color: '#28a745',
                                                                                boxShadow: '0 2px 6px rgba(0,0,0,0.08)',
                                                                                transition: 'all 0.2s ease'
                                                                            }}
                                                                            onMouseEnter={(e) => { e.currentTarget.style.background = '#f0fdf4'; }}
                                                                            onMouseLeave={(e) => { e.currentTarget.style.background = '#fff'; }}
                                                                            title="View"
                                                                        >
                                                                            <i className="ti-eye"></i>
                                                                        </button>
                                                                        <button
                                                                            onClick={(e) => {
                                                                                e.stopPropagation();
                                                                                handleRemoveFromWishlist(id);
                                                                            }}
                                                                            style={{
                                                                                width: 34,
                                                                                height: 34,
                                                                                borderRadius: 8,
                                                                                border: '1px solid #e5e7eb',
                                                                                background: '#fff0f0',
                                                                                display: 'inline-flex',
                                                                                alignItems: 'center',
                                                                                justifyContent: 'center',
                                                                                color: '#e11d48',
                                                                                boxShadow: '0 2px 6px rgba(0,0,0,0.08)',
                                                                                transition: 'all 0.2s ease'
                                                                            }}
                                                                            onMouseEnter={(e) => { e.currentTarget.style.background = '#ffe4e6'; }}
                                                                            onMouseLeave={(e) => { e.currentTarget.style.background = '#fff0f0'; }}
                                                                            title="Remove from wishlist"
                                                                        >
                                                                            <i className="ti-heart"></i>
                                                                        </button>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            </section>
            <Footer />
        </>
    );
}

export default Wishlist;

