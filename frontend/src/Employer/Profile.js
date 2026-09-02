import React, { useState, useEffect, useRef, useMemo } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import {
    FiBriefcase,
    FiUser,
    FiMail,
    FiPhone,
    FiMapPin,
    FiGlobe,
    FiLayers,
    FiUsers,
    FiCalendar,
    FiFileText,
    FiShare2,
    FiCamera,
    FiCheckCircle,
    FiArrowRight,
    FiSave,
    FiAlertCircle
} from "react-icons/fi";
import { useAuth } from "../context/AuthContext";
import Header from "../Components/Header";
import Footer from "../Components/Footer";
import EmployerSidebar from "./Sidebar";
import { API_BASE_URL } from "../config/api";
import { ProfileAvatarRing } from "../Candidate/Sidebar";

// ===== Theme tokens =====
const THEME = {
    green: '#16a34a',
    greenHover: '#15803d',
    greenSoft: 'rgba(22,163,74,0.10)',
    gradient: 'linear-gradient(135deg, #16a34a 0%, #15803d 55%, #0f766e 100%)',
    textDark: '#0f172a',
    textMid: '#475569',
    textSoft: '#64748b',
    cardBg: '#ffffff',
    cardBorder: 'rgba(148,163,184,0.18)',
    cardShadow: '0 6px 20px rgba(15,23,42,0.06)',
    radius: 16,
    pageBg: '#f7fbf8'
};

const inputBase = {
    width: '100%',
    borderRadius: '12px',
    border: `1px solid ${THEME.cardBorder}`,
    padding: '12px 15px',
    fontSize: '14px',
    color: THEME.textDark,
    background: '#fff',
    transition: 'border-color 0.25s, box-shadow 0.25s',
    outline: 'none'
};

const labelBase = {
    display: 'block',
    marginBottom: '8px',
    fontSize: '13px',
    fontWeight: 600,
    color: THEME.textMid
};

const focusInput = (e) => {
    e.target.style.borderColor = THEME.green;
    e.target.style.boxShadow = `0 0 0 3px ${THEME.greenSoft}`;
};
const blurInput = (e) => {
    e.target.style.borderColor = THEME.cardBorder;
    e.target.style.boxShadow = 'none';
};

// ===== Reusable animated section card =====
function SectionCard({ icon, title, subtitle, children, delay = 0 }) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.15 }}
            transition={{ duration: 0.5, delay }}
            style={{
                background: THEME.cardBg,
                borderRadius: THEME.radius,
                border: `1px solid ${THEME.cardBorder}`,
                boxShadow: THEME.cardShadow,
                padding: '24px',
                marginBottom: '22px'
            }}
        >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
                <div style={{
                    width: 42,
                    height: 42,
                    borderRadius: 12,
                    background: THEME.greenSoft,
                    color: THEME.green,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 20,
                    flexShrink: 0
                }}>
                    {icon}
                </div>
                <div>
                    <h3 style={{ margin: 0, fontSize: '17px', fontWeight: 700, color: THEME.textDark }}>{title}</h3>
                    {subtitle && <p style={{ margin: '2px 0 0', fontSize: '12.5px', color: THEME.textSoft }}>{subtitle}</p>}
                </div>
            </div>
            {children}
        </motion.div>
    );
}

function Profile() {

    const { user, loading: authLoading, loadProfileData: refreshProfileData } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    // FIX 6: shown when redirected here from a gated action (e.g. posting a job).
    const mustCompleteProfile = new URLSearchParams(location.search).get('completeProfile') === '1';
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');
    const [profileData, setProfileData] = useState({
        companyName: '',
        contactPerson: '',
        email: '',
        phone: '',
        address: '',
        website: '',
        industry: '',
        companySize: '',
        description: '',
        linkedin: '',
        twitter: '',
        facebook: '',
        google: '',
        logoUrl: '',
        foundedYear: '',
        companyType: ''
    });
    const [logoFile, setLogoFile] = useState(null);
    const [logoPreview, setLogoPreview] = useState('');
    const fileInputRef = useRef(null);

    const resolveAssetUrl = (value) => {
        if (!value) return '';
        if (value.startsWith('http') || value.startsWith('data:')) return value;
        return `${API_BASE_URL}${value.startsWith('/') ? value : `/${value}`}`;
    };

    useEffect(() => {
        if (!user) {
            navigate('/');
            return;
        }

        // Load profile data from API
        loadProfileData();
    }, [user, navigate]);

    const loadProfileData = async () => {
        try {
            const token = localStorage.getItem('token');
            if (!token) return;
            const getCandidates = [
                `${API_BASE_URL}/api/employer/profile`,
                `${API_BASE_URL}/api/employer/profile/me`,
                `${API_BASE_URL}/api/profile/employer`,
                `${API_BASE_URL}/api/profile`
            ];
            let loaded = false;
            for (const url of getCandidates) {
                try {
                    if (process.env.NODE_ENV !== 'production') console.debug('Loading employer profile from', url);
                } catch (_) {}
                const response = await fetch(url, {
                    method: 'GET',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Accept': 'application/json'
                    },
                    credentials: 'include'
                });
                if (response.ok) {
                    const data = await response.json();
                    const profile = data.profile || data;
                    setProfileData(prev => ({ ...prev, ...profile }));
                    setLogoPreview(profile.logoUrl ? resolveAssetUrl(profile.logoUrl) : '');
                    setLogoFile(null);
                    loaded = true;
                    break;
                }
                if (response.status !== 404) {
                    // For non-404 errors, don't continue cycling
                    break;
                }
            }
            if (!loaded) {
                // If profile doesn't exist, set basic user data
                setProfileData(prev => ({
                    ...prev,
                    companyName: user.fullName || '',
                    contactPerson: user.fullName || '',
                    email: user.email || '',
                    phone: user.phone || ''
                }));
                setLogoPreview('');
            }
        } catch (error) {
            console.error('Error loading profile:', error);
            // Set basic user data as fallback
            setProfileData(prev => ({
                ...prev,
                companyName: user.fullName || '',
                contactPerson: user.fullName || '',
                email: user.email || '',
                phone: user.phone || ''
            }));
            setLogoPreview('');
        }
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setProfileData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleLogoChange = (e) => {
        const file = e.target.files?.[0];
        if (!file) {
            setLogoFile(null);
            setLogoPreview(profileData.logoUrl ? resolveAssetUrl(profileData.logoUrl) : '');
            return;
        }
        if (!file.type.startsWith('image/')) {
            setMessage('Please upload a valid image file.');
            setTimeout(() => setMessage(''), 4000);
            return;
        }
        if (file.size > 5 * 1024 * 1024) {
            setMessage('Logo must be smaller than 5MB.');
            setTimeout(() => setMessage(''), 4000);
            return;
        }
        setLogoFile(file);
        setLogoPreview(URL.createObjectURL(file));
    };

    const handleUpdate = async (e) => {
        e.preventDefault();
        setLoading(true);
        setMessage('');

        try {
            // Basic validation
            if (!profileData.companyName || !profileData.contactPerson || !profileData.email) {
                setMessage('Please fill in all required fields (Company Name, Contact Person, Email)');
                setLoading(false);
                return;
            }

            const token = localStorage.getItem('token');
            if (!token) {
                setMessage('Please login again');
                setLoading(false);
                return;
            }

            const payloadRaw = {
                ...profileData,
                foundedYear: profileData.foundedYear ? Number(profileData.foundedYear) : undefined
            };
            const sanitizePayload = () => {
                return Object.entries(payloadRaw).reduce((acc, [key, value]) => {
                    if (value === null || value === undefined) return acc;
                    if (typeof value === 'string') {
                        const trimmed = value.trim();
                        if (trimmed !== '') acc[key] = trimmed;
                    } else {
                        acc[key] = value;
                    }
                    return acc;
                }, {});
            };

            const buildFormData = () => {
                const formData = new FormData();
                const sanitized = sanitizePayload();
                Object.entries(sanitized).forEach(([key, value]) => {
                    formData.append(key, value);
                });
                if (logoFile) {
                    formData.append('companyLogo', logoFile);
                }
                return formData;
            };

            const profileUpdateUrl = `${API_BASE_URL}/api/employer/profile`;
            const requestHeaders = { 'Authorization': `Bearer ${token}`, 'Accept': 'application/json' };
            const useMultipart = !!logoFile;
            if (!useMultipart) {
                requestHeaders['Content-Type'] = 'application/json';
            }
            const requestBody = useMultipart ? buildFormData() : JSON.stringify(sanitizePayload());
            const response = await fetch(profileUpdateUrl, {
                method: 'PUT',
                headers: requestHeaders,
                body: requestBody,
                credentials: 'include'
            });
            const succeeded = response.ok;

            if (succeeded) {
                let responseData = {};
                try {
                    responseData = await response.json();
                } catch (_) {}
                setMessage('Profile updated successfully!');
                if (responseData.logoUrl) {
                    setProfileData(prev => ({ ...prev, logoUrl: responseData.logoUrl }));
                    setLogoPreview(resolveAssetUrl(responseData.logoUrl));
                }
                setLogoFile(null);
                const authToken = localStorage.getItem('token');
                if (authToken) {
                    await refreshProfileData(authToken, user?.role);
                }
                setTimeout(() => setMessage(''), 3000);
            } else {
                let errorText = `Data not inserted. (${response?.status || 'Request failed'})`;
                try {
                    const ct = response?.headers?.get('content-type') || '';
                    if (ct.includes('application/json')) {
                        const errorData = await response.json();
                        errorText = errorData.message || errorData.error || JSON.stringify(errorData) || errorText;
                    } else {
                        const text = await response?.text();
                        if (text) {
                            if (response?.status === 403 && /LiteSpeed|Forbidden/i.test(text)) {
                                errorText = 'Server blocked the profile update (403). Ask your host to allow PUT requests to /api/employer/profile.';
                            } else {
                                errorText = `${errorText} - ${text.slice(0, 200)}`;
                            }
                        }
                    }
                } catch (_) {}
                setMessage(errorText);
                setTimeout(() => setMessage(''), 5000);
            }
        } catch (error) {
            console.error('Error updating profile:', error);
            setMessage('Data not inserted. Please try again.');
            // Clear error message after 5 seconds
            setTimeout(() => setMessage(''), 5000);
        } finally {
            setLoading(false);
        }
    };

    // ===== Completion tracker computation =====
    // Each meaningful field counts equally toward the percentage.
    // Social links are collapsed into a single "social presence" item so
    // they don't dominate the score (any one filled satisfies it).
    const completion = useMemo(() => {
        const hasLogo = !!(logoPreview || profileData.logoUrl || logoFile);
        const hasSocial = !!(profileData.linkedin || profileData.twitter || profileData.facebook || profileData.google);
        const items = [
            { key: 'logo', label: 'Add company logo', done: hasLogo, fieldId: 'logo-upload' },
            { key: 'companyName', label: 'Add company name', done: !!String(profileData.companyName || '').trim(), fieldId: 'field-companyName' },
            { key: 'contactPerson', label: 'Add contact person', done: !!String(profileData.contactPerson || '').trim(), fieldId: 'field-contactPerson' },
            { key: 'email', label: 'Add company email', done: !!String(profileData.email || '').trim(), fieldId: 'field-email' },
            { key: 'phone', label: 'Add phone number', done: !!String(profileData.phone || '').trim(), fieldId: 'field-phone' },
            { key: 'address', label: 'Add company address', done: !!String(profileData.address || '').trim(), fieldId: 'field-address' },
            { key: 'website', label: 'Add website', done: !!String(profileData.website || '').trim(), fieldId: 'field-website' },
            { key: 'industry', label: 'Select industry', done: !!String(profileData.industry || '').trim(), fieldId: 'field-industry' },
            { key: 'companySize', label: 'Select company size', done: !!String(profileData.companySize || '').trim(), fieldId: 'field-companySize' },
            { key: 'companyType', label: 'Select company type', done: !!String(profileData.companyType || '').trim(), fieldId: 'field-companyType' },
            { key: 'foundedYear', label: 'Add founded year', done: !!String(profileData.foundedYear || '').trim(), fieldId: 'field-foundedYear' },
            { key: 'description', label: 'Add company description', done: !!String(profileData.description || '').trim(), fieldId: 'field-description' },
            { key: 'social', label: 'Add a social link', done: hasSocial, fieldId: 'field-social' }
        ];
        const doneCount = items.filter(i => i.done).length;
        const percent = Math.round((doneCount / items.length) * 100);
        const missing = items.filter(i => !i.done);
        return { percent, missing, total: items.length, doneCount };
    }, [profileData, logoPreview, logoFile]);

    const scrollToField = (fieldId) => {
        const el = document.getElementById(fieldId);
        if (el) {
            el.scrollIntoView({ behavior: 'smooth', block: 'center' });
            if (typeof el.focus === 'function') {
                setTimeout(() => el.focus({ preventScroll: true }), 350);
            }
        }
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
                        borderTop: `4px solid ${THEME.green}`,
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
                <h2>Please login to access profile</h2>
                <button onClick={() => navigate('/')} className="btn btn-primary">Go to Home</button>
            </div>
        );
    }

    const logoSrc = logoPreview || (profileData.logoUrl ? resolveAssetUrl(profileData.logoUrl) : '');

    return (
        <>
            <style>
                {`
                    @keyframes slideIn {
                        from {
                            transform: translateX(100%);
                            opacity: 0;
                        }
                        to {
                            transform: translateX(0);
                            opacity: 1;
                        }
                    }
                `}
            </style>
            {/* Message Display */}
            {message && (
                <div
                    className={`alert ${message.includes('successfully') ? 'alert-success' : 'alert-danger'}`}
                    style={{
                        position: 'fixed',
                        top: '20px',
                        right: '20px',
                        zIndex: 9999,
                        minWidth: '300px',
                        padding: '15px 20px',
                        borderRadius: '5px',
                        boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
                        backgroundColor: message.includes('successfully') ? '#d4edda' : '#f8d7da',
                        color: message.includes('successfully') ? '#155724' : '#721c24',
                        border: `1px solid ${message.includes('successfully') ? '#c3e6cb' : '#f5c6cb'}`,
                        animation: 'slideIn 0.3s ease-out'
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
                .emp-grid-2 {
                    display: grid;
                    grid-template-columns: repeat(2, minmax(0, 1fr));
                    gap: 18px;
                }
                .emp-checklist-link:hover { color: ${THEME.greenHover} !important; transform: translateX(3px); }
                .emp-checklist-link { transition: color .2s, transform .2s; }
                @media (max-width: 575px) {
                    .emp-grid-2 { grid-template-columns: 1fr; }
                }
            `}</style>
            {/* ================ Profile Settings ======================= */}
            <section className="padd-top-80 padd-bot-80" style={{ background: THEME.pageBg }}>
                <div className="container">
                    <div className="row">
                        <div className="col-md-3 employer-dashboard-sidebar">
                            <EmployerSidebar active="profile" />
                        </div>
                        <div className="col-md-9 employer-dashboard-main">
                            {mustCompleteProfile && (
                                <div style={{
                                    background: '#f0fdf4',
                                    border: '1px solid #16a34a',
                                    color: '#15803d',
                                    borderRadius: '12px',
                                    padding: '14px 18px',
                                    marginBottom: '18px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '10px',
                                    fontWeight: 600,
                                    fontSize: '14px'
                                }}>
                                    <i className="ti-info-alt" style={{ fontSize: '18px' }} />
                                    You must complete your Company Profile before posting jobs or appearing in listings.
                                </div>
                            )}

                            {/* ===== Completion tracker card ===== */}
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true, amount: 0.2 }}
                                transition={{ duration: 0.5 }}
                                style={{
                                    background: THEME.cardBg,
                                    borderRadius: THEME.radius,
                                    border: `1px solid ${THEME.cardBorder}`,
                                    boxShadow: THEME.cardShadow,
                                    padding: '24px',
                                    marginBottom: '22px'
                                }}
                            >
                                <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 700, color: THEME.textDark }}>
                                    {completion.percent === 100 ? 'Your company profile is complete!' : 'Complete your company profile to start posting jobs'}
                                </h3>
                                <p style={{ margin: '6px 0 16px', fontSize: '13px', color: THEME.textSoft }}>
                                    {completion.doneCount} of {completion.total} sections completed.
                                    {completion.percent < 100 && ' Finish the items below to unlock job posting.'}
                                </p>

                                {completion.missing.length > 0 ? (
                                    <div style={{
                                        display: 'flex',
                                        flexWrap: 'wrap',
                                        gap: '10px'
                                    }}>
                                        {completion.missing.map((m) => (
                                            <button
                                                type="button"
                                                key={m.key}
                                                className="emp-checklist-link"
                                                onClick={() => scrollToField(m.fieldId)}
                                                style={{
                                                    display: 'inline-flex',
                                                    alignItems: 'center',
                                                    gap: 7,
                                                    background: THEME.greenSoft,
                                                    color: THEME.green,
                                                    border: `1px solid rgba(22,163,74,0.2)`,
                                                    borderRadius: 999,
                                                    padding: '7px 14px',
                                                    fontSize: '12.5px',
                                                    fontWeight: 600,
                                                    cursor: 'pointer'
                                                }}
                                            >
                                                {m.label}
                                                <FiArrowRight size={13} />
                                            </button>
                                        ))}
                                    </div>
                                ) : (
                                    <div style={{
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        gap: 8,
                                        color: THEME.green,
                                        fontWeight: 700,
                                        fontSize: '14px'
                                    }}>
                                        <FiCheckCircle size={18} /> All set — you can post jobs now.
                                    </div>
                                )}
                            </motion.div>

                            <form onSubmit={handleUpdate}>
                                {/* ===== Company branding (logo) ===== */}
                                <SectionCard
                                    icon={<FiCamera />}
                                    title="Company Logo"
                                    subtitle="Upload a square image (max 5MB). This appears on your job listings."
                                    delay={0.02}
                                >
                                    <div id="logo-upload" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                                        <motion.div
                                            whileHover={{ scale: 1.03 }}
                                            style={{ position: 'relative', display: 'inline-block', cursor: 'pointer' }}
                                            onClick={() => fileInputRef.current?.click()}
                                        >
                                            <ProfileAvatarRing
                                                value={completion.percent}
                                                imageSrc={logoSrc || '/assets/img/user-profile.png'}
                                                size={120}
                                            />
                                            <div style={{
                                                position: 'absolute',
                                                bottom: '22px',
                                                right: '2px',
                                                zIndex: 4,
                                                width: '40px',
                                                height: '40px',
                                                borderRadius: '50%',
                                                background: THEME.gradient,
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                boxShadow: '0 2px 8px rgba(22,163,74,0.35)',
                                                border: '3px solid #fff'
                                            }}>
                                                <FiCamera color="#fff" size={17} />
                                            </div>
                                        </motion.div>
                                        <input
                                            ref={fileInputRef}
                                            type="file"
                                            accept="image/*"
                                            onChange={handleLogoChange}
                                            style={{ display: 'none' }}
                                        />
                                    </div>
                                </SectionCard>

                                {/* ===== Basic details ===== */}
                                <SectionCard
                                    icon={<FiBriefcase />}
                                    title="Company Details"
                                    subtitle="Core information about your organisation."
                                    delay={0.04}
                                >
                                    <div className="emp-grid-2">
                                        <div className="form-group" style={{ marginBottom: 0 }}>
                                            <label style={labelBase}><FiBriefcase style={{ marginRight: 6, verticalAlign: '-2px' }} />Company Name *</label>
                                            <input
                                                id="field-companyName"
                                                type="text"
                                                name="companyName"
                                                className="form-control"
                                                placeholder="Enter company name"
                                                value={profileData.companyName}
                                                onChange={handleInputChange}
                                                required
                                                style={inputBase}
                                                onFocus={focusInput}
                                                onBlur={blurInput}
                                            />
                                        </div>
                                        <div className="form-group" style={{ marginBottom: 0 }}>
                                            <label style={labelBase}><FiUser style={{ marginRight: 6, verticalAlign: '-2px' }} />Contact Person *</label>
                                            <input
                                                id="field-contactPerson"
                                                type="text"
                                                name="contactPerson"
                                                className="form-control"
                                                placeholder="Enter contact person name"
                                                value={profileData.contactPerson}
                                                onChange={handleInputChange}
                                                required
                                                style={inputBase}
                                                onFocus={focusInput}
                                                onBlur={blurInput}
                                            />
                                        </div>
                                        <div className="form-group" style={{ marginBottom: 0 }}>
                                            <label style={labelBase}><FiMail style={{ marginRight: 6, verticalAlign: '-2px' }} />Email *</label>
                                            <input
                                                id="field-email"
                                                type="email"
                                                name="email"
                                                className="form-control"
                                                placeholder="company@example.com"
                                                value={profileData.email}
                                                onChange={handleInputChange}
                                                required
                                                style={inputBase}
                                                onFocus={focusInput}
                                                onBlur={blurInput}
                                            />
                                        </div>
                                        <div className="form-group" style={{ marginBottom: 0 }}>
                                            <label style={labelBase}><FiPhone style={{ marginRight: 6, verticalAlign: '-2px' }} />Phone</label>
                                            <input
                                                id="field-phone"
                                                type="tel"
                                                name="phone"
                                                className="form-control"
                                                placeholder="123 214 13247"
                                                value={profileData.phone}
                                                onChange={handleInputChange}
                                                style={inputBase}
                                                onFocus={focusInput}
                                                onBlur={blurInput}
                                            />
                                        </div>
                                        <div className="form-group" style={{ marginBottom: 0 }}>
                                            <label style={labelBase}><FiMapPin style={{ marginRight: 6, verticalAlign: '-2px' }} />Address</label>
                                            <input
                                                id="field-address"
                                                type="text"
                                                name="address"
                                                className="form-control"
                                                placeholder="Enter company address"
                                                value={profileData.address}
                                                onChange={handleInputChange}
                                                style={inputBase}
                                                onFocus={focusInput}
                                                onBlur={blurInput}
                                            />
                                        </div>
                                        <div className="form-group" style={{ marginBottom: 0 }}>
                                            <label style={labelBase}><FiGlobe style={{ marginRight: 6, verticalAlign: '-2px' }} />Website</label>
                                            <input
                                                id="field-website"
                                                type="url"
                                                name="website"
                                                className="form-control"
                                                placeholder="https://company.com"
                                                value={profileData.website}
                                                onChange={handleInputChange}
                                                style={inputBase}
                                                onFocus={focusInput}
                                                onBlur={blurInput}
                                            />
                                        </div>
                                    </div>
                                </SectionCard>

                                {/* ===== Company profile / classification ===== */}
                                <SectionCard
                                    icon={<FiLayers />}
                                    title="Company Profile"
                                    subtitle="Help candidates understand the type and scale of your company."
                                    delay={0.06}
                                >
                                    <div className="emp-grid-2">
                                        <div className="form-group" style={{ marginBottom: 0 }}>
                                            <label style={labelBase}><FiLayers style={{ marginRight: 6, verticalAlign: '-2px' }} />Industry</label>
                                            <select
                                                id="field-industry"
                                                name="industry"
                                                className="wide form-control"
                                                value={profileData.industry}
                                                onChange={handleInputChange}
                                                style={inputBase}
                                                onFocus={focusInput}
                                                onBlur={blurInput}
                                            >
                                                <option value="">Select Industry</option>
                                                <option value="technology">Technology</option>
                                                <option value="healthcare">Healthcare</option>
                                                <option value="finance">Finance</option>
                                                <option value="education">Education</option>
                                                <option value="retail">Retail</option>
                                                <option value="manufacturing">Manufacturing</option>
                                                <option value="other">Other</option>
                                            </select>
                                        </div>
                                        <div className="form-group" style={{ marginBottom: 0 }}>
                                            <label style={labelBase}><FiUsers style={{ marginRight: 6, verticalAlign: '-2px' }} />Company Size</label>
                                            <select
                                                id="field-companySize"
                                                name="companySize"
                                                className="wide form-control"
                                                value={profileData.companySize}
                                                onChange={handleInputChange}
                                                style={inputBase}
                                                onFocus={focusInput}
                                                onBlur={blurInput}
                                            >
                                                <option value="">Select Company Size</option>
                                                <option value="1-10">1-10 employees</option>
                                                <option value="11-50">11-50 employees</option>
                                                <option value="51-200">51-200 employees</option>
                                                <option value="201-500">201-500 employees</option>
                                                <option value="500+">500+ employees</option>
                                            </select>
                                        </div>
                                        <div className="form-group" style={{ marginBottom: 0 }}>
                                            <label style={labelBase}><FiBriefcase style={{ marginRight: 6, verticalAlign: '-2px' }} />Company Type</label>
                                            <select
                                                id="field-companyType"
                                                name="companyType"
                                                className="wide form-control"
                                                value={profileData.companyType}
                                                onChange={handleInputChange}
                                                style={inputBase}
                                                onFocus={focusInput}
                                                onBlur={blurInput}
                                            >
                                                <option value="">Select Company Type</option>
                                                <option value="startup">Startup</option>
                                                <option value="small_business">Small Business</option>
                                                <option value="medium_business">Medium Business</option>
                                                <option value="large_corporation">Large Corporation</option>
                                                <option value="non_profit">Non-Profit</option>
                                            </select>
                                        </div>
                                        <div className="form-group" style={{ marginBottom: 0 }}>
                                            <label style={labelBase}><FiCalendar style={{ marginRight: 6, verticalAlign: '-2px' }} />Founded Year</label>
                                            <input
                                                id="field-foundedYear"
                                                type="number"
                                                name="foundedYear"
                                                className="form-control"
                                                placeholder="2020"
                                                min="1800"
                                                max={new Date().getFullYear()}
                                                value={profileData.foundedYear}
                                                onChange={handleInputChange}
                                                style={inputBase}
                                                onFocus={focusInput}
                                                onBlur={blurInput}
                                            />
                                        </div>
                                    </div>
                                </SectionCard>

                                {/* ===== About / description ===== */}
                                <SectionCard
                                    icon={<FiFileText />}
                                    title="About the Company"
                                    subtitle="A clear description attracts more relevant candidates."
                                    delay={0.08}
                                >
                                    <div className="form-group" style={{ marginBottom: 0 }}>
                                        <label style={labelBase}><FiFileText style={{ marginRight: 6, verticalAlign: '-2px' }} />Company Description</label>
                                        <textarea
                                            id="field-description"
                                            name="description"
                                            className="form-control"
                                            placeholder="Tell us about your company..."
                                            rows="4"
                                            value={profileData.description}
                                            onChange={handleInputChange}
                                            style={{ ...inputBase, resize: 'vertical' }}
                                            onFocus={focusInput}
                                            onBlur={blurInput}
                                        />
                                    </div>
                                </SectionCard>

                                {/* ===== Social links ===== */}
                                <SectionCard
                                    icon={<FiShare2 />}
                                    title="Social Presence"
                                    subtitle="Add at least one social link to boost credibility."
                                    delay={0.1}
                                >
                                    <div id="field-social" className="emp-grid-2">
                                        <div className="form-group" style={{ marginBottom: 0 }}>
                                            <label style={labelBase}>Twitter</label>
                                            <input
                                                type="url"
                                                name="twitter"
                                                className="form-control"
                                                placeholder="https://twitter.com/"
                                                value={profileData.twitter}
                                                onChange={handleInputChange}
                                                style={inputBase}
                                                onFocus={focusInput}
                                                onBlur={blurInput}
                                            />
                                        </div>
                                        <div className="form-group" style={{ marginBottom: 0 }}>
                                            <label style={labelBase}>Facebook</label>
                                            <input
                                                type="url"
                                                name="facebook"
                                                className="form-control"
                                                placeholder="https://facebook.com/"
                                                value={profileData.facebook}
                                                onChange={handleInputChange}
                                                style={inputBase}
                                                onFocus={focusInput}
                                                onBlur={blurInput}
                                            />
                                        </div>
                                        <div className="form-group" style={{ marginBottom: 0 }}>
                                            <label style={labelBase}>Google+</label>
                                            <input
                                                type="url"
                                                name="google"
                                                className="form-control"
                                                placeholder="https://gmail.com/"
                                                value={profileData.google}
                                                onChange={handleInputChange}
                                                style={inputBase}
                                                onFocus={focusInput}
                                                onBlur={blurInput}
                                            />
                                        </div>
                                    </div>
                                </SectionCard>

                                <div style={{ textAlign: 'center', marginTop: '8px' }}>
                                    <motion.button
                                        type="submit"
                                        className="btn btn-m theme-btn"
                                        disabled={loading}
                                        whileHover={!loading ? { y: -2 } : {}}
                                        whileTap={!loading ? { scale: 0.98 } : {}}
                                        style={{
                                            display: 'inline-flex',
                                            alignItems: 'center',
                                            gap: 9,
                                            padding: '13px 44px',
                                            fontSize: '16px',
                                            fontWeight: 700,
                                            borderRadius: '12px',
                                            background: THEME.gradient,
                                            border: 'none',
                                            color: '#fff',
                                            cursor: loading ? 'not-allowed' : 'pointer',
                                            opacity: loading ? 0.7 : 1,
                                            boxShadow: '0 8px 20px rgba(22,163,74,0.28)'
                                        }}
                                    >
                                        {loading ? <><FiAlertCircle /> Saving...</> : <><FiSave /> Save Company Details</>}
                                    </motion.button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            </section>
            {/* ================ End Profile Settings ======================= */}
            <Footer />
        </>
    );
}

export default Profile;
