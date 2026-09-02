// import React, { useState, useEffect } from "react";
// import { useNavigate } from "react-router-dom";
// import { useAuth } from "../context/AuthContext";
// import Header from "../Components/Header";
// import Footer from "../Components/Footer";
// import EmployerSidebar from "./Sidebar";
// import { API_BASE_URL } from "../config/api";


// function ChangePassword() {
//     const { user, logout, loading: authLoading } = useAuth();
//     const navigate = useNavigate();
//     const [loading, setLoading] = useState(false);
//     const [message, setMessage] = useState('');
//     const [formData, setFormData] = useState({
//         currentPassword: '',
//         newPassword: '',
//         confirmPassword: ''
//     });

//     useEffect(() => {
//         if (!user) {
//             navigate('/');
//             return;
//         }
//     }, [user, navigate]);

//     const handleInputChange = (e) => {
//         const { name, value } = e.target;
//         setFormData(prev => ({
//             ...prev,
//             [name]: value
//         }));
//     };

//     const handleSubmit = async (e) => {
//         e.preventDefault();
//         setLoading(true);
//         setMessage('');
        
//         try {
//             // Basic validation
//             if (!formData.currentPassword || !formData.newPassword || !formData.confirmPassword) {
//                 setMessage('Please fill in all fields');
//                 setLoading(false);
//                 return;
//             }

//             if (formData.newPassword !== formData.confirmPassword) {
//                 setMessage('New password and confirm password do not match');
//                 setLoading(false);
//                 return;
//             }

//             if (formData.newPassword.length < 6) {
//                 setMessage('New password must be at least 6 characters long');
//                 setLoading(false);
//                 return;
//             }

//             const token = localStorage.getItem('token');
//             if (!token) {
//                 setMessage('Please login again');
//                 setLoading(false);
//                 return;
//             }

//             const response = await fetch(`${API_BASE_URL}/api/auth/change-password`, {
//                 method: 'PUT',
//                 headers: {
//                     'Authorization': `Bearer ${token}`,
//                     'Content-Type': 'application/json'
//                 },
//                 body: JSON.stringify({
//                     currentPassword: formData.currentPassword,
//                     newPassword: formData.newPassword,
//                     confirmPassword: formData.confirmPassword
//                 })
//             });

//             if (response.ok) {
//                 setMessage('Password changed successfully!');
//                 setFormData({
//                     currentPassword: '',
//                     newPassword: '',
//                     confirmPassword: ''
//                 });
//                 // Clear message after 3 seconds
//                 setTimeout(() => setMessage(''), 3000);
//             } else {
//                 const errorData = await response.json();
//                 setMessage(errorData.message || 'Failed to change password. Please try again.');
//                 // Clear error message after 5 seconds
//                 setTimeout(() => setMessage(''), 5000);
//             }
//         } catch (error) {
//             console.error('Error changing password:', error);
//             setMessage('Failed to change password. Please try again.');
//             // Clear error message after 5 seconds
//             setTimeout(() => setMessage(''), 5000);
//         } finally {
//             setLoading(false);
//         }
//     };

//     // Show loading spinner while checking authentication
//     if (authLoading) {
//         return (
//             <div style={{
//                 display: 'flex',
//                 justifyContent: 'center',
//                 alignItems: 'center',
//                 height: '100vh',
//                 backgroundColor: '#f8f9fa'
//             }}>
//                 <div style={{
//                     textAlign: 'center',
//                     padding: '40px',
//                     backgroundColor: 'white',
//                     borderRadius: '10px',
//                     boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
//                 }}>
//                     <div style={{
//                         width: '40px',
//                         height: '40px',
//                         border: '4px solid #f3f3f3',
//                         borderTop: '4px solid #007bff',
//                         borderRadius: '50%',
//                         animation: 'spin 1s linear infinite',
//                         margin: '0 auto 20px'
//                     }}></div>
//                     <h3>Loading...</h3>
//                     <p>Please wait while we verify your session</p>
//                 </div>
//                 <style>
//                     {`
//                         @keyframes spin {
//                             0% { transform: rotate(0deg); }
//                             100% { transform: rotate(360deg); }
//                         }
//                     `}
//                 </style>
//             </div>
//         );
//     }

//     if (!user) {
//         return (
//             <div className="container" style={{padding: '50px', textAlign: 'center'}}>
//                 <h2>Please login to access this page</h2>
//                 <button onClick={() => navigate('/')} className="btn btn-primary">Go to Home</button>
//             </div>
//         );
//     }
//     return (
//         <>
//             <style>
//                 {`
//                     @keyframes slideIn {
//                         from {
//                             transform: translateX(100%);
//                             opacity: 0;
//                         }
//                         to {
//                             transform: translateX(0);
//                             opacity: 1;
//                         }
//                     }
//                 `}
//             </style>
//             {/* Message Display */}
//             {message && (
//                 <div 
//                     className={`alert ${message.includes('successfully') ? 'alert-success' : 'alert-danger'}`} 
//                     style={{
//                         position: 'fixed', 
//                         top: '20px', 
//                         right: '20px', 
//                         zIndex: 9999, 
//                         minWidth: '300px',
//                         padding: '15px 20px',
//                         borderRadius: '5px',
//                         boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
//                         backgroundColor: message.includes('successfully') ? '#d4edda' : '#f8d7da',
//                         color: message.includes('successfully') ? '#155724' : '#721c24',
//                         border: `1px solid ${message.includes('successfully') ? '#c3e6cb' : '#f5c6cb'}`,
//                         animation: 'slideIn 0.3s ease-out'
//                     }}
//                 >
//                     {message}
//                 </div>
//             )}
//             <Header />
//             <style>{`
//                 @media (max-width: 991px) {
//                     .employer-dashboard-sidebar { display: none !important; }
//                     .employer-dashboard-main {
//                         width: 100% !important;
//                         max-width: 100% !important;
//                         float: none !important;
//                     }
//                 }
//             `}</style>
//             <section className="padd-top-80 padd-bot-80">
//                     <div className="container">
//                         <div className="row">
                            // <div className="col-md-3 employer-dashboard-sidebar">
                            //     <EmployerSidebar active="change-password" />
                            // </div>
//                             <div className="col-md-9 employer-dashboard-main">
//                                 <div className="profile_detail_block">
//                                     <form onSubmit={handleSubmit}>
//                                         <div className="col-md-4 col-sm-6 col-xs-12">
//                                             <div className="form-group">
//                                                 <label>Current Password</label>
//                                                 <input
//                                                     type="password"
//                                                     name="currentPassword"
//                                                     className="form-control"
//                                                     placeholder="Enter current password"
//                                                     value={formData.currentPassword}
//                                                     onChange={handleInputChange}
//                                                     required
//                                                 />
//                                             </div>
//                                         </div>
//                                         <div className="col-md-4 col-sm-6 col-xs-12">
//                                             <div className="form-group">
//                                                 <label>New Password</label>
//                                                 <input
//                                                     type="password"
//                                                     name="newPassword"
//                                                     className="form-control"
//                                                     placeholder="Enter new password"
//                                                     value={formData.newPassword}
//                                                     onChange={handleInputChange}
//                                                     required
//                                                 />
//                                             </div>
//                                         </div>
//                                         <div className="col-md-4 col-sm-6 col-xs-12">
//                                             <div className="form-group">
//                                                 <label>Confirm Password</label>
//                                                 <input
//                                                     type="password"
//                                                     name="confirmPassword"
//                                                     className="form-control"
//                                                     placeholder="Confirm new password"
//                                                     value={formData.confirmPassword}
//                                                     onChange={handleInputChange}
//                                                     required
//                                                 />
//                                             </div>
//                                         </div>
//                                         <div className="clearfix" />
//                                         <div className="col-md-12 padd-top-10 text-center">
//                                             <button 
//                                                 type="submit" 
//                                                 className="btn btn-m theme-btn full-width"
//                                                 disabled={loading}
//                                             >
//                                                 {loading ? 'Updating...' : 'Update Password'}
//                                             </button>
//                                         </div>
//                                     </form>
//                                 </div>
//                             </div>
//                         </div>
//                     </div>
//                 </section>
//                 {/* ================ End Change Password ======================= */}


//             <Footer />
//         </>
//     );
// }

// export default ChangePassword;
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import Header from "../Components/Header";
import Footer from "../Components/Footer";
import { API_BASE_URL } from "../config/api";
import EmployerSidebar from "./Sidebar";

function ChangePassword() {
    const { user, loading: authLoading, logout } = useAuth();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');
    const [formData, setFormData] = useState({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
    });
    const [forgotModalOpen, setForgotModalOpen] = useState(false);
    const [forgotStep, setForgotStep] = useState(1);
    const [forgotEmail, setForgotEmail] = useState('');
    const [forgotOtp, setForgotOtp] = useState(['', '', '', '', '', '']);
    const [forgotOtpTimer, setForgotOtpTimer] = useState(60);
    const [forgotResendCount, setForgotResendCount] = useState(0);
    const [forgotNewPassword, setForgotNewPassword] = useState('');
    const [forgotConfirmPassword, setForgotConfirmPassword] = useState('');
    const [forgotLoading, setForgotLoading] = useState(false);
    const [forgotMessage, setForgotMessage] = useState('');

    useEffect(() => {
        let interval;
        if (forgotModalOpen && forgotStep === 2 && forgotOtpTimer > 0) {
            interval = setInterval(() => {
                setForgotOtpTimer(prev => prev - 1);
            }, 1000);
        }
        return () => clearInterval(interval);
    }, [forgotModalOpen, forgotStep, forgotOtpTimer]);

    useEffect(() => {
        if (forgotModalOpen) {
            document.body.classList.add('modal-open');
        } else {
            document.body.classList.remove('modal-open');
        }
        return () => {
            document.body.classList.remove('modal-open');
        };
    }, [forgotModalOpen]);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setMessage('');

        try {
            if (!formData.currentPassword || !formData.newPassword || !formData.confirmPassword) {
                setMessage('Please fill in all fields');
                setLoading(false);
                return;
            }

            if (formData.newPassword !== formData.confirmPassword) {
                setMessage('New passwords do not match');
                setLoading(false);
                return;
            }

            if (formData.newPassword.length < 6) {
                setMessage('New password must be at least 6 characters long');
                setLoading(false);
                return;
            }

            const token = localStorage.getItem('token');
            if (!token) {
                setMessage('Please login again');
                setLoading(false);
                return;
            }

            const response = await fetch(`${API_BASE_URL}/api/auth/change-password`, {
                method: 'PUT',
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(formData)
            });

            if (response.ok) {
                setMessage('Password changed successfully!');
                setFormData({ currentPassword: '', newPassword: '', confirmPassword: '' });
                setTimeout(() => setMessage(''), 3000);
            } else {
                const errorData = await response.json().catch(() => ({}));
                setMessage(errorData.message || 'Failed to change password.');
            }
        } catch (err) {
            setMessage('Failed to change password.');
        } finally {
            setLoading(false);
        }
    };

    const openForgotModal = () => {
        setForgotStep(1);
        setForgotEmail(user?.email || '');
        setForgotOtp(['', '', '', '', '', '']);
        setForgotOtpTimer(60);
        setForgotResendCount(0);
        setForgotNewPassword('');
        setForgotConfirmPassword('');
        setForgotLoading(false);
        setForgotMessage('');
        setForgotModalOpen(true);
    };

    const handleForgotSendOTP = async () => {
        if (!forgotEmail) {
            setForgotMessage('Please enter your email');
            return;
        }

        setForgotLoading(true);
        setForgotMessage('');

        try {
            const response = await fetch(`${API_BASE_URL}/api/auth/forgot-password`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: forgotEmail })
            });

            const data = await response.json();

            if (response.ok) {
                setForgotStep(2);
                setForgotOtpTimer(60);
                setForgotResendCount(0);
                setForgotMessage('OTP sent to your email');
            } else {
                setForgotMessage(data?.message || 'Failed to send OTP');
            }
        } catch (error) {
            setForgotMessage('Network error. Please try again.');
        }
        setForgotLoading(false);
    };

    const handleForgotOtpChange = (index, value) => {
        if (value.length > 1) return;
        const newOtp = [...forgotOtp];
        newOtp[index] = value;
        setForgotOtp(newOtp);

        if (value && index < 5) {
            const nextInput = document.getElementById(`forgot-otp-${index + 1}`);
            if (nextInput) nextInput.focus();
        }
    };

    const handleForgotOtpKeyDown = (index, e) => {
        if (e.key === 'Backspace' && !forgotOtp[index] && index > 0) {
            const prevInput = document.getElementById(`forgot-otp-${index - 1}`);
            if (prevInput) prevInput.focus();
        }
    };

    const handleForgotOtpPaste = (e) => {
        e.preventDefault();
        const paste = e.clipboardData.getData('text');
        const pasteArray = paste.split('').slice(0, 6);
        const newOtp = [...forgotOtp];
        pasteArray.forEach((char, index) => {
            if (index < 6 && /^\d$/.test(char)) {
                newOtp[index] = char;
            }
        });
        setForgotOtp(newOtp);
    };

    const handleForgotVerifyOtp = async () => {
        const otpString = forgotOtp.join('');
        if (otpString.length !== 6) {
            setForgotMessage('Please enter complete OTP');
            return;
        }

        setForgotLoading(true);
        setForgotMessage('');

        try {
            const response = await fetch(`${API_BASE_URL}/api/auth/verify-otp`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: forgotEmail, otp: otpString })
            });

            const data = await response.json();

            if (response.ok) {
                setForgotStep(3);
                setForgotMessage('OTP verified successfully');
            } else {
                setForgotMessage(data?.message || 'OTP verification failed');
            }
        } catch (error) {
            setForgotMessage('Network error. Please try again.');
        }
        setForgotLoading(false);
    };

    const handleForgotResendOtp = async () => {
        if (forgotResendCount >= 5) {
            setForgotMessage('Maximum resend attempts reached');
            return;
        }

        setForgotLoading(true);
        setForgotMessage('');

        try {
            const response = await fetch(`${API_BASE_URL}/api/auth/resend-otp`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: forgotEmail })
            });

            const data = await response.json();

            if (response.ok) {
                setForgotResendCount(prev => prev + 1);
                setForgotOtpTimer(60);
                setForgotMessage('OTP resent to your email');
            } else {
                setForgotMessage(data?.message || 'Failed to resend OTP');
            }
        } catch (error) {
            setForgotMessage('Network error. Please try again.');
        }
        setForgotLoading(false);
    };

    const handleForgotResetPassword = async () => {
        if (!forgotNewPassword || !forgotConfirmPassword) {
            setForgotMessage('Please fill all fields');
            return;
        }

        if (forgotNewPassword !== forgotConfirmPassword) {
            setForgotMessage('Passwords do not match');
            return;
        }

        if (forgotNewPassword.length < 6) {
            setForgotMessage('Password must be at least 6 characters');
            return;
        }

        setForgotLoading(true);
        setForgotMessage('');

        try {
            const response = await fetch(`${API_BASE_URL}/api/auth/reset-password`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    email: forgotEmail,
                    newPassword: forgotNewPassword,
                    confirmPassword: forgotConfirmPassword
                })
            });

            const data = await response.json();

            if (response.ok) {
                setForgotMessage('Password reset successfully');
                setTimeout(() => {
                    handleForgotClose();
                }, 2000);
            } else {
                setForgotMessage(data?.message || 'Failed to reset password');
            }
        } catch (error) {
            setForgotMessage('Network error. Please try again.');
        }
        setForgotLoading(false);
    };

    const handleForgotClose = () => {
        setForgotModalOpen(false);
        setForgotStep(1);
        setForgotEmail('');
        setForgotOtp(['', '', '', '', '', '']);
        setForgotOtpTimer(60);
        setForgotResendCount(0);
        setForgotNewPassword('');
        setForgotConfirmPassword('');
        setForgotLoading(false);
        setForgotMessage('');
    };

    if (authLoading) {
        return (
            <div className="d-flex justify-content-center align-items-center vh-100 bg-light">
                <div className="bg-white p-5 rounded shadow-sm text-center">
                    <div className="spinner-border text-success mb-3" />
                    <h5>Loading...</h5>
                    <p className="text-muted mb-0">Verifying session</p>
                </div>
            </div>
        );
    }

    if (!user) {
        return (
            <div className="container text-center py-5">
                <h3>Please login to continue</h3>
                <button onClick={() => navigate('/')} className="btn btn-success mt-3">
                    Go to Home
                </button>
            </div>
        );
    }

    return (
        <>
            {message && (
                <div
                    className={`alert ${message.includes('successfully') ? 'alert-success' : 'alert-danger'}`}
                    style={{
                        position: 'fixed',
                        top: 20,
                        right: 20,
                        zIndex: 9999,
                        minWidth: 300
                    }}
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
            {/* ================ Change Password ======================= */}
            <section className="padd-top-80 padd-bot-80">
                <div className="container">
                    <div className="row">
                        {/* Sidebar */}
                        <div className="col-md-3 employer-dashboard-sidebar">
                                <EmployerSidebar active="change-password" />
                            </div>

                        {/* Password Form */}
                        <div className="col-md-9 candidate-dashboard-main">
                            <div className="profile_detail_block">

                                <form onSubmit={handleSubmit}>
                                    <div className="col-md-8 col-md-offset-2 col-sm-10 col-sm-offset-1 col-xs-12">
                                        <div className="form-group" style={{ marginBottom: 0 }}>
                                            <label>Current Password</label>
                                            <input
                                                type="password"
                                                name="currentPassword"
                                                className="form-control"
                                                placeholder="Enter current password"
                                                value={formData.currentPassword}
                                                onChange={handleInputChange}
                                                style={{ marginBottom: 0 }}
                                                required
                                            />
                                            <div style={{ marginTop: '10px', textAlign: 'right' }}>
                                                <button
                                                    type="button"
                                                    onClick={openForgotModal}
                                                    style={{
                                                        background: 'none',
                                                        border: 'none',
                                                        color: '#2563eb',
                                                        textDecoration: 'underline',
                                                        cursor: 'pointer',
                                                        fontWeight: '600',
                                                        padding: 0
                                                    }}
                                                >
                                                    Forgot Password?
                                                </button>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="col-md-8 col-md-offset-2 col-sm-10 col-sm-offset-1 col-xs-12">
                                        <div className="form-group">
                                            <label>New Password</label>
                                            <input
                                                type="password"
                                                name="newPassword"
                                                className="form-control"
                                                placeholder="Enter new password"
                                                value={formData.newPassword}
                                                onChange={handleInputChange}
                                                required
                                            />
                                        </div>
                                    </div>

                                    <div className="col-md-8 col-md-offset-2 col-sm-10 col-sm-offset-1 col-xs-12">
                                        <div className="form-group">
                                            <label>Confirm New Password</label>
                                            <input
                                                type="password"
                                                name="confirmPassword"
                                                className="form-control"
                                                placeholder="Confirm new password"
                                                value={formData.confirmPassword}
                                                onChange={handleInputChange}
                                                required
                                            />
                                        </div>
                                    </div>

                                    <div className="clearfix" />
                                    <div className="col-md-12 padd-top-10 text-center">
                                        <button
                                            type="submit"
                                            className="btn btn-m theme-btn"
                                            disabled={loading}
                                            style={{
                                                padding: '10px 24px',
                                                fontSize: '14px',
                                                fontWeight: '600',
                                                borderRadius: '6px',
                                                backgroundColor: loading ? '#6c757d' : '#28a745',
                                                border: 'none',
                                                color: 'white',
                                                transition: 'all 0.3s ease',
                                                boxShadow: loading ? 'none' : '0 4px 12px rgba(40, 167, 69, 0.3)',
                                                cursor: loading ? 'not-allowed' : 'pointer',
                                                width: 'auto',
                                                display: 'inline-block',
                                                whiteSpace: 'nowrap'
                                            }}
                                            onMouseEnter={(e) => {
                                                if (!loading) {
                                                    e.currentTarget.style.backgroundColor = '#218838';
                                                    e.currentTarget.style.boxShadow = '0 6px 16px rgba(40, 167, 69, 0.4)';
                                                    e.currentTarget.style.transform = 'translateY(-2px)';
                                                }
                                            }}
                                            onMouseLeave={(e) => {
                                                if (!loading) {
                                                    e.currentTarget.style.backgroundColor = '#28a745';
                                                    e.currentTarget.style.boxShadow = '0 4px 12px rgba(40, 167, 69, 0.3)';
                                                    e.currentTarget.style.transform = 'translateY(0)';
                                                }
                                            }}
                                        >
                                            {loading ? 'Upgrading Password...' : 'Upgrade Password'}
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    </div>
                </div>
            </section>
            {/* ================ End Change Password ======================= */}

            {forgotModalOpen && (
                <div
                    className="modal fade in"
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        opacity: 1,
                        position: 'fixed',
                        inset: 0,
                        backgroundColor: 'rgba(0,0,0,0.5)',
                        zIndex: 2000,
                        padding: '20px'
                    }}
                    onClick={handleForgotClose}
                >
                    <div
                        className="modal-dialog modal-dialog-centered"
                        style={{ maxWidth: '420px' }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="modal-content">
                            <div className="modal-header" style={{ position: 'relative' }}>
                                <h5 className="modal-title" style={{ margin: 0 }}>
                                    <img
                                        src="/assets/img/Uptula.png"
                                        alt="Uptula"
                                        style={{ height: '36px', width: 'auto', display: 'block' }}
                                    />
                                </h5>
                                <button
                                    type="button"
                                    className="close"
                                    onClick={handleForgotClose}
                                    style={{ position: 'absolute', top: '10px', right: '15px' }}
                                >
                                    <span>&times;</span>
                                </button>
                            </div>
                            <div className="modal-body">
                                {forgotMessage && (
                                    <div className={`alert ${forgotMessage.includes('success') ? 'alert-success' : 'alert-danger'}`} style={{ marginBottom: '15px' }}>
                                        {forgotMessage}
                                    </div>
                                )}

                                {forgotStep === 1 && (
                                    <div>
                                        <p style={{ marginBottom: '20px', textAlign: 'center' }}>Enter your email address to reset your password</p>
                                        <input
                                            type="email"
                                            placeholder="Email Address"
                                            value={forgotEmail}
                                            onChange={e => setForgotEmail(e.target.value)}
                                            style={{
                                                width: '100%',
                                                padding: '12px',
                                                border: '1px solid #ddd',
                                                borderRadius: '5px',
                                                marginBottom: '15px',
                                                fontSize: '16px'
                                            }}
                                            required
                                        />
                                        <button
                                            type="button"
                                            onClick={handleForgotSendOTP}
                                            disabled={forgotLoading}
                                            style={{
                                                width: '100%',
                                                padding: '12px',
                                                backgroundColor: '#28a745',
                                                color: 'white',
                                                border: 'none',
                                                borderRadius: '5px',
                                                fontSize: '16px',
                                                cursor: forgotLoading ? 'not-allowed' : 'pointer'
                                            }}
                                        >
                                            {forgotLoading ? 'Sending...' : 'Send OTP'}
                                        </button>
                                    </div>
                                )}

                                {forgotStep === 2 && (
                                    <div>
                                        <p style={{ marginBottom: '20px', textAlign: 'center' }}>Enter the 6-digit OTP sent to your email</p>
                                        <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', marginBottom: '20px' }}>
                                            {forgotOtp.map((digit, index) => (
                                                <input
                                                    key={index}
                                                    id={`forgot-otp-${index}`}
                                                    type="text"
                                                    value={digit}
                                                    onChange={(e) => handleForgotOtpChange(index, e.target.value.replace(/\D/g, ''))}
                                                    onKeyDown={(e) => handleForgotOtpKeyDown(index, e)}
                                                    onPaste={handleForgotOtpPaste}
                                                    maxLength="1"
                                                    style={{
                                                        width: '40px',
                                                        height: '40px',
                                                        textAlign: 'center',
                                                        border: '1.5px solid #e5e7eb',
                                                        borderRadius: '7px',
                                                        fontSize: '18px',
                                                        background: '#f8fafc',
                                                        outline: 'none',
                                                        transition: 'border-color 0.2s'
                                                    }}
                                                    autoFocus={index === 0}
                                                />
                                            ))}
                                        </div>
                                        <div style={{ textAlign: 'center', marginBottom: '15px' }}>
                                            {forgotOtpTimer > 0 ? (
                                                <span>Resend OTP in {forgotOtpTimer}s</span>
                                            ) : (
                                                <span style={{ color: 'red' }}>OTP expired</span>
                                            )}
                                        </div>
                                        <button
                                            type="button"
                                            onClick={handleForgotVerifyOtp}
                                            disabled={forgotLoading || forgotOtp.some(d => !d)}
                                            style={{
                                                width: '100%',
                                                padding: '12px',
                                                backgroundColor: '#28a745',
                                                color: 'white',
                                                border: 'none',
                                                borderRadius: '5px',
                                                fontSize: '16px',
                                                marginBottom: '10px',
                                                cursor: forgotLoading || forgotOtp.some(d => !d) ? 'not-allowed' : 'pointer'
                                            }}
                                        >
                                            {forgotLoading ? 'Verifying...' : 'Verify OTP'}
                                        </button>
                                        <div style={{ textAlign: 'center' }}>
                                            <button
                                                type="button"
                                                onClick={handleForgotResendOtp}
                                                disabled={forgotLoading || forgotResendCount >= 5 || forgotOtpTimer > 0}
                                                style={{
                                                    background: 'none',
                                                    border: 'none',
                                                    color: forgotResendCount >= 5 ? '#dc3545' : '#007bff',
                                                    textDecoration: 'underline',
                                                    cursor: forgotResendCount >= 5 || forgotOtpTimer > 0 ? 'not-allowed' : 'pointer'
                                                }}
                                            >
                                                {forgotResendCount >= 5 ? 'Resend limit reached' : `Resend OTP${forgotResendCount > 0 ? ` (${5 - forgotResendCount} left)` : ''}`}
                                            </button>
                                        </div>
                                    </div>
                                )}

                                {forgotStep === 3 && (
                                    <div>
                                        <p style={{ marginBottom: '20px', textAlign: 'center' }}>Enter your new password</p>
                                        <input
                                            type="password"
                                            placeholder="New Password"
                                            value={forgotNewPassword}
                                            onChange={e => setForgotNewPassword(e.target.value)}
                                            style={{
                                                width: '100%',
                                                padding: '12px',
                                                border: '1px solid #ddd',
                                                borderRadius: '5px',
                                                marginBottom: '15px',
                                                fontSize: '16px'
                                            }}
                                            required
                                        />
                                        <input
                                            type="password"
                                            placeholder="Confirm New Password"
                                            value={forgotConfirmPassword}
                                            onChange={e => setForgotConfirmPassword(e.target.value)}
                                            style={{
                                                width: '100%',
                                                padding: '12px',
                                                border: '1px solid #ddd',
                                                borderRadius: '5px',
                                                marginBottom: '15px',
                                                fontSize: '16px'
                                            }}
                                            required
                                        />
                                        <button
                                            type="button"
                                            onClick={handleForgotResetPassword}
                                            disabled={forgotLoading}
                                            style={{
                                                width: '100%',
                                                padding: '12px',
                                                backgroundColor: '#28a745',
                                                color: 'white',
                                                border: 'none',
                                                borderRadius: '5px',
                                                fontSize: '16px',
                                                cursor: forgotLoading ? 'not-allowed' : 'pointer'
                                            }}
                                        >
                                            {forgotLoading ? 'Updating...' : 'Update Password'}
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <Footer />
        </>
    );
}

export default ChangePassword;
