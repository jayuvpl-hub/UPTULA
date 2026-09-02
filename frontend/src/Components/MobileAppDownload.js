import React, { useState } from 'react';
import { API_BASE_URL } from '../config/api';

function MobileAppDownload() {
    const [email, setEmail] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [feedback, setFeedback] = useState({ type: '', text: '' });

    const handleGetLinked = async () => {
        const trimmed = email.trim();
        if (!trimmed || submitting) return;

        setSubmitting(true);
        setFeedback({ type: '', text: '' });

        try {
            const res = await fetch(`${API_BASE_URL}/api/app/send-app-link`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: trimmed }),
            });
            const data = await res.json().catch(() => ({}));

            if (!res.ok) {
                setFeedback({
                    type: 'error',
                    text: data.message || 'Failed to send email. Please try again.',
                });
                return;
            }

            setFeedback({
                type: 'success',
                text: data.message || 'App link sent! Please check your email.',
            });
            setEmail('');
        } catch {
            setFeedback({
                type: 'error',
                text: 'Failed to send email. Please try again.',
            });
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <section
            id="uptula-mobile-app-section"
            style={{
            padding: '60px 0 0 0',
            position: 'relative'
        }}>
            <div className="container">
                {/* Parent Box with Gradient Background */}
                <div style={{ 
                    background: 'transparent',
                    borderRadius: '0',
                    padding: '0 40px 0 40px'
                }}>
                    <div className="row" style={{ alignItems: 'center' }}>
                        {/* Left Side - Poster Image */}
                        <div className="col-md-5 col-sm-12">
                            <img 
                                src="/assets/img/download poster.png" 
                                alt="Download App" 
                                style={{ 
                                    width: '100%', 
                                    height: 'auto',
                                    borderRadius: '12px'
                                }} 
                            />
                        </div>

                        {/* Middle - Content */}
                        <div className="col-md-5 col-sm-12" style={{ marginTop: '30px' }}>
                            {/* Main Content */}
                            <div>
                                {/* Your Next Job is One Tap Away */}
                                <p style={{ 
                                    fontSize: '16px', 
                                    fontWeight: '600', 
                                    color: '#26AE61',
                                    margin: '0 0 15px 0'
                                }}>
                                    Your Next Job is One Tap Away
                                </p>

                                {/* Heading */}
                                <h2 style={{ 
                                    fontSize: '36px', 
                                    fontWeight: '700', 
                                    color: '#2c3e50', 
                                    margin: '0 0 15px 0',
                                    lineHeight: '1.2'
                                }}>
                                    Get hired faster with personalized career tools!
                                </h2>

                                {/* Description */}
                                <p style={{ 
                                    fontSize: '15px', 
                                    color: '#707f8c',
                                    margin: '0 0 20px 0',
                                    lineHeight: '1.6'
                                }}>
                                    Download the Uptula Job Portal app now for skill-based job matches, instant alerts, one-tap applications, and exclusive job listings.
                                </p>

                                {/* Email Input with Button */}
                                <div style={{ 
                                    display: 'flex', 
                                    gap: '10px', 
                                    marginBottom: '25px',
                                    flexWrap: 'wrap'
                                }}>
                                    <input
                                        type="email"
                                        placeholder="enter your email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        style={{
                                            flex: 1,
                                            minWidth: '250px',
                                            padding: '12px 16px',
                                            borderRadius: '8px',
                                            border: '1px solid #ddd',
                                            fontSize: '15px',
                                            outline: 'none',
                                            transition: 'all 0.3s ease'
                                        }}
                                        onFocus={(e) => {
                                            e.target.style.borderColor = '#26AE61';
                                            e.target.style.boxShadow = '0 0 0 3px rgba(38, 174, 97, 0.1)';
                                        }}
                                        onBlur={(e) => {
                                            e.target.style.borderColor = '#ddd';
                                            e.target.style.boxShadow = 'none';
                                        }}
                                    />
                                    <button
                                        type="button"
                                        onClick={handleGetLinked}
                                        disabled={submitting || !email.trim()}
                                        style={{
                                            padding: '12px 24px',
                                            borderRadius: '8px',
                                            background: '#26AE61',
                                            color: '#ffffff',
                                            border: 'none',
                                            fontSize: '15px',
                                            fontWeight: '600',
                                            cursor: submitting || !email.trim() ? 'not-allowed' : 'pointer',
                                            opacity: submitting || !email.trim() ? 0.7 : 1,
                                            transition: 'all 0.3s ease',
                                            whiteSpace: 'nowrap'
                                        }}
                                        onMouseEnter={(e) => {
                                            if (submitting || !email.trim()) return;
                                            e.target.style.background = '#22a055';
                                            e.target.style.transform = 'translateY(-2px)';
                                            e.target.style.boxShadow = '0 4px 12px rgba(38, 174, 97, 0.3)';
                                        }}
                                        onMouseLeave={(e) => {
                                            e.target.style.background = '#26AE61';
                                            e.target.style.transform = 'translateY(0)';
                                            e.target.style.boxShadow = 'none';
                                        }}
                                    >
                                        {submitting ? 'Sending...' : 'Get Linked'}
                                    </button>
                                </div>
                                {feedback.text ? (
                                    <p style={{
                                        margin: '0 0 25px 0',
                                        fontSize: '14px',
                                        fontWeight: 600,
                                        color: feedback.type === 'success' ? '#15803d' : '#dc2626',
                                    }}>
                                        {feedback.text}
                                    </p>
                                ) : null}

                                {/* App Download Buttons */}
                                {/* <div style={{ display: 'flex', gap: '15px', flexWrap: 'wrap' }}>
                                    <a
                                        href="#"
                                        onClick={(e) => {
                                            e.preventDefault();
                                            // Handle Google Play
                                        }}
                                        style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            width: '210px',
                                            height: '68px',
                                            padding: '8px 12px',
                                            background: '#ffffff',
                                            border: '1px solid #ddd',
                                            borderRadius: '8px',
                                            textDecoration: 'none',
                                            transition: 'all 0.3s ease',
                                            boxShadow: '0 2px 8px rgba(0,0,0,0.05)'
                                        }}
                                        onMouseEnter={(e) => {
                                            e.currentTarget.style.borderColor = '#26AE61';
                                            e.currentTarget.style.boxShadow = '0 4px 12px rgba(38, 174, 97, 0.15)';
                                            e.currentTarget.style.transform = 'translateY(-2px)';
                                        }}
                                        onMouseLeave={(e) => {
                                            e.currentTarget.style.borderColor = '#ddd';
                                            e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.05)';
                                            e.currentTarget.style.transform = 'translateY(0)';
                                        }}
                                        aria-label="google-play"
                                    >
                                        <img
                                            src="https://play.google.com/intl/en_us/badges/images/generic/en_badge_web_generic.png"
                                            alt="Get it on Google Play"
                                            style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                                        />
                                    </a>

                                    <a
                                        href="#"
                                        onClick={(e) => {
                                            e.preventDefault();
                                            // Handle App Store
                                        }}
                                        style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            width: '210px',
                                            height: '68px',
                                            padding: '8px 12px',
                                            background: '#ffffff',
                                            border: '1px solid #ddd',
                                            borderRadius: '8px',
                                            textDecoration: 'none',
                                            transition: 'all 0.3s ease',
                                            boxShadow: '0 2px 8px rgba(0,0,0,0.05)'
                                        }}
                                        onMouseEnter={(e) => {
                                            e.currentTarget.style.borderColor = '#26AE61';
                                            e.currentTarget.style.boxShadow = '0 4px 12px rgba(38, 174, 97, 0.15)';
                                            e.currentTarget.style.transform = 'translateY(-2px)';
                                        }}
                                        onMouseLeave={(e) => {
                                            e.currentTarget.style.borderColor = '#ddd';
                                            e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.05)';
                                            e.currentTarget.style.transform = 'translateY(0)';
                                        }}
                                        aria-label="app-store"
                                    >
                                        <img
                                            src="https://developer.apple.com/assets/elements/badges/download-on-the-app-store.svg"
                                            alt="Download on the App Store"
                                            style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                                        />
                                    </a>
                                </div> */}
                            </div>
                        </div>

                        {/* Right Side - QR Code */}
                        <div className="col-md-2 col-sm-12" style={{ marginTop: '80px', marginLeft: '-1px', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                            <div style={{ 
                                background: '#e0e0e0',
                                padding: '20px',
                                borderRadius: '12px',
                                textAlign: 'center',
                                boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
                                width: '180px',
                                height: '180px',
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                justifyContent: 'center'
                            }}>
                                <img 
                                    src="/assets/img/QRcode.png" 
                                    alt="QR Code" 
                                    style={{ 
                                        width: '140px', 
                                        height: '140px',
                                        marginBottom: '10px'
                                    }} 
                                />
                                <p style={{ 
                                    margin: 0, 
                                    fontSize: '14px', 
                                    fontWeight: '600',
                                    color: '#2c3e50'
                                }}>
                                    Scan to Download
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}

export default MobileAppDownload;
