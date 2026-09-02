import React, { useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import { FiZap, FiSearch } from "react-icons/fi";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import Header from "../Components/Header";
import Footer from "../Components/Footer";
import MobileAppDownload from "../Components/MobileAppDownload";
import { API_BASE_URL } from "../config/api";
import PageSEO from "../Components/PageSEO";

// Theme tokens (matches AllJobs / GREEN theme)
const GREEN = '#16a34a';
const GREEN_DARK = '#15803d';

// Common industries used to seed the AI-style autosuggest pool.
const COMMON_INDUSTRIES = [
    'Information Technology', 'Finance', 'Healthcare', 'Education',
    'Manufacturing', 'Retail', 'Marketing', 'Construction',
    'Hospitality', 'Logistics',
];

function Companies() {
    
    const navigate = useNavigate();
    const { user } = useAuth();
    const [searchParams] = useSearchParams();
    const [jobs, setJobs] = useState([]);
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState("");
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalJobs, setTotalJobs] = useState(0);
    const [itemsPerPage, setItemsPerPage] = useState(10);
    const [filters, setFilters] = useState({ q: '', city: '', jobType: '', salary: '', qualification: '', designation: '', experience: '', category: '', timePosted: '' });
    const [applyOpen, setApplyOpen] = useState(false);
    const [applyJob, setApplyJob] = useState(null);
    const [applyForm, setApplyForm] = useState({ name: '', email: '', phone: '', resume: null, pastedCv: '' });
    const [focusedField, setFocusedField] = useState(null);
    const [, setCategories] = useState([]);
    const [, setAllCategories] = useState([]);
    const [, setSearchKeyword] = useState('');
    const [, setSearchCategory] = useState('');

    // AI-style autosuggest state for the hero keyword search
    const [allCompanies, setAllCompanies] = useState([]);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [highlightIndex, setHighlightIndex] = useState(-1);
    const suggestRef = useRef(null);

    // Fetch categories for search dropdown
    useEffect(() => {
        const fetchCategories = async () => {
            try {
                const response = await fetch(`${API_BASE_URL}/api/jobs/categories`);
                if (response.ok) {
                    const data = await response.json();
                    setCategories(data.categories || []);
                    setAllCategories(data.allCategories || []);
                }
            } catch (error) {
                console.error('Error fetching categories:', error);
            }
        };
        fetchCategories();
    }, [API_BASE_URL]);

    // Read filters from URL on mount
    useEffect(() => {
        const categoryParam = searchParams.get('category');
        const qParam = searchParams.get('q');
        if (categoryParam) {
            const decodedCategory = decodeURIComponent(categoryParam);
            setFilters(prev => ({ ...prev, category: decodedCategory }));
            setSearchCategory(decodedCategory);
        }
        if (qParam) {
            const decodedQ = decodeURIComponent(qParam);
            setFilters(prev => ({ ...prev, q: decodedQ }));
            setSearchKeyword(decodedQ);
        }
    }, [searchParams]);

    useEffect(() => {
        const fetchCompaniesList = async () => {
            try {
                setLoading(true);
                const resp = await fetch(`${API_BASE_URL}/api/companies`, {
                    method: 'GET',
                    headers: { 'Accept': 'application/json' },
                    credentials: 'include'
                });

                if (resp.ok) {
                    const data = await resp.json();
                    const list = Array.isArray(data.companies) ? data.companies : Array.isArray(data) ? data : [];

                    // "Your Dream Company Is Hiring" logic: fetch jobs once so we can
                    // show an open-jobs count per company and hide profile-less accounts.
                    let jobsList = [];
                    try {
                        const jr = await fetch(`${API_BASE_URL}/api/jobs?limit=1000&page=1`, {
                            headers: { Accept: 'application/json' },
                        });
                        if (jr.ok) {
                            const jd = await jr.json();
                            jobsList = Array.isArray(jd.jobs) ? jd.jobs : Array.isArray(jd) ? jd : [];
                        }
                    } catch (_) { /* counts default to 0 */ }

                    const countOpenJobs = (name) => {
                        const n = String(name || '').trim().toLowerCase();
                        if (!n) return 0;
                        return jobsList.reduce((c, j) => {
                            const jn = String(j.companyName || j.company_name || j.company || '').trim().toLowerCase();
                            return jn === n ? c + 1 : c;
                        }, 0);
                    };

                    const enriched = list.map((company) => {
                        const openJobs = countOpenJobs(company.companyName);
                        const hasRealLogo = !!(company.logoUrl && String(company.logoUrl).trim());
                        // A real company profile shows at least one of these signals
                        // (guards even before the FIX 6 backend redeploy).
                        const hasProfileSignal = !!(
                            String(company.industry || '').trim() ||
                            hasRealLogo ||
                            String(company.website || '').trim() ||
                            String(company.companySize || '').trim() ||
                            String(company.foundedYear || '').trim() ||
                            String(company.address || '').trim()
                        );
                        return { ...company, openJobs, hasProfileSignal };
                    });

                    // Keep the full enriched, real-company list for the AI suggestion pool.
                    setAllCompanies(enriched.filter(
                        (company) => company.companyName && (company.hasProfileSignal || company.openJobs > 0)
                    ));

                    const filteredCompanies = enriched.filter((company) => {
                        if (!company.companyName || !(company.hasProfileSignal || company.openJobs > 0)) return false;
                        const q = filters.q.trim().toLowerCase();
                        const city = filters.city.trim().toLowerCase();
                        const category = filters.category.trim().toLowerCase();

                        const companyName = String(company.companyName || '').toLowerCase();
                        const address = String(company.address || '').toLowerCase();
                        const industry = String(company.industry || '').toLowerCase();
                        const companyType = String(company.companyType || '').toLowerCase();

                        const matchesQuery = !q || [companyName, address, industry, companyType].some((value) => value.includes(q));
                        const matchesCity = !city || address.includes(city);
                        const matchesCategory = !category || industry.includes(category);

                        return matchesQuery && matchesCity && matchesCategory;
                    });

                    const startIndex = (page - 1) * itemsPerPage;
                    const endIndex = startIndex + itemsPerPage;
                    const paginatedList = filteredCompanies.slice(startIndex, endIndex);
                    const filteredTotalPages = Math.ceil(filteredCompanies.length / itemsPerPage);

                    setTotalPages(filteredTotalPages || 1);
                    setTotalJobs(filteredCompanies.length);
                    setJobs(paginatedList);
                } else {
                    setMessage('Failed to load companies');
                    setTimeout(() => setMessage(''), 4000);
                }
            } catch (_) {
                setMessage('Failed to load companies');
                setTimeout(() => setMessage(''), 4000);
            } finally {
                setLoading(false);
            }
        };
        fetchCompaniesList();
    }, [API_BASE_URL, page, filters, itemsPerPage]);

    const toggleFilter = (name, value) => {
        setPage(1);
        setFilters(prev => ({ ...prev, [name]: prev[name] === value ? '' : value }));
    };

    // De-duplicated, case-insensitive suggestion pool from loaded companies'
    // companyName + industry, seeded with a few common industries.
    const suggestionPool = useMemo(() => {
        const pool = [...COMMON_INDUSTRIES];
        allCompanies.forEach((company) => {
            if (company.companyName) pool.push(String(company.companyName));
            if (company.industry) pool.push(String(company.industry));
        });
        const seen = new Set();
        const unique = [];
        pool.forEach((item) => {
            const trimmed = String(item).trim();
            if (!trimmed) return;
            const key = trimmed.toLowerCase();
            if (seen.has(key)) return;
            seen.add(key);
            unique.push(trimmed);
        });
        return unique;
    }, [allCompanies]);

    // Top 8 matches, ranking startsWith above includes.
    const suggestions = useMemo(() => {
        const q = filters.q.trim().toLowerCase();
        if (!q) return [];
        const starts = [];
        const contains = [];
        suggestionPool.forEach((item) => {
            const lower = item.toLowerCase();
            if (lower === q) return;
            if (lower.startsWith(q)) starts.push(item);
            else if (lower.includes(q)) contains.push(item);
        });
        return [...starts, ...contains].slice(0, 8);
    }, [filters.q, suggestionPool]);

    // Apply a chosen suggestion / submitted query to the existing filters.q.
    const runSearch = (value) => {
        setFilters((prev) => ({ ...prev, q: value }));
        setSearchKeyword(value);
        setPage(1);
        setShowSuggestions(false);
        setHighlightIndex(-1);
    };

    // Close the autosuggest dropdown on outside click.
    useEffect(() => {
        const handleMouseDown = (e) => {
            if (suggestRef.current && !suggestRef.current.contains(e.target)) {
                setShowSuggestions(false);
                setHighlightIndex(-1);
            }
        };
        document.addEventListener('mousedown', handleMouseDown);
        return () => document.removeEventListener('mousedown', handleMouseDown);
    }, []);

    const openApply = (job) => {
        if (!user) {
            const signinBtn = document.querySelector('[data-target="#signin"]');
            if (signinBtn) {
                signinBtn.click();
            }
            return;
        }
        setApplyJob(job);
        setApplyForm(prev => ({ ...prev, name: '', email: '', phone: '', resume: null, pastedCv: '' }));
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
            const resp = await fetch(`${API_BASE_URL}/api/jobs/${applyJob.id || applyJob._id}/apply`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` },
                body: formData,
                credentials: 'include'
            });
            if (resp.ok) {
                setMessage('Applied successfully');
                setApplyOpen(false);
                setTimeout(() => setMessage(''), 4000);
            } else {
                const errorData = await resp.json().catch(() => ({ message: 'Unknown error' }));
                
                // Check for duplicate application error
                if (errorData.code === 'DUPLICATE_APPLICATION' || 
                    (errorData.message && errorData.message.includes('already applied'))) {
                    setMessage('You have already applied for this job');
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

    return (

        <>
            <PageSEO
                title="Top Hiring Companies in Bhubaneswar | Uptula Jobs"
                description="Discover job opportunities from top hiring companies in Bhubaneswar with Uptula Jobs. Browse the latest vacancies, connect with leading employers, and find the right career opportunity in Odisha."
            />
            {message && (
                <div className={`alert ${message.includes('Failed') ? 'alert-danger' : 'alert-success'}`} style={{ position: 'fixed', top: '20px', right: '20px', zIndex: 9999 }}>
                    {message}
                </div>
            )}
            <Header />
            <>
                <style>{`
                    @media (max-width: 767px) {
                        .companies-card-grid {
                            grid-template-columns: 1fr !important;
                            gap: 12px !important;
                        }
                        .desktop-items-per-page {
                            display: none !important;
                        }
                        .mobile-items-per-page {
                            display: block !important;
                        }
                    }
                    @media (min-width: 768px) {
                        .mobile-items-per-page {
                            display: none !important;
                        }
                    }

                    /* ---- Futuristic hero header + AI autosuggest (matches AllJobs) ---- */
                    .cmp-listing-section { background: #f2f4f8; }
                    .cmp-hero {
                        position: relative;
                        z-index: 30;
                        border-radius: 18px;
                        padding: 26px 24px 24px;
                        margin-bottom: 22px;
                        background: linear-gradient(120deg, ${GREEN} 0%, ${GREEN_DARK} 52%, #0f766e 100%);
                        box-shadow: 0 14px 38px rgba(15,118,110,0.28);
                        /* overflow visible so the autosuggest dropdown can extend below the hero */
                        overflow: visible;
                    }
                    .cmp-hero::after {
                        content: '';
                        position: absolute;
                        inset: 0;
                        border-radius: inherit;
                        background:
                            radial-gradient(420px 200px at 12% -10%, rgba(255,255,255,0.22), transparent 60%),
                            radial-gradient(360px 220px at 100% 120%, rgba(255,255,255,0.14), transparent 60%);
                        pointer-events: none;
                    }
                    .cmp-hero-inner { position: relative; z-index: 1; }
                    .cmp-hero-eyebrow {
                        display: inline-flex; align-items: center; gap: 7px;
                        background: rgba(255,255,255,0.18);
                        border: 1px solid rgba(255,255,255,0.30);
                        backdrop-filter: blur(6px);
                        color: #fff; font-size: 12px; font-weight: 700;
                        letter-spacing: 0.4px; text-transform: uppercase;
                        padding: 5px 12px; border-radius: 999px; margin-bottom: 12px;
                    }
                    .cmp-hero-title {
                        margin: 0 0 4px; color: #fff; font-size: 26px;
                        font-weight: 800; line-height: 1.2;
                    }
                    .cmp-hero-sub { margin: 0 0 18px; color: rgba(255,255,255,0.88); font-size: 14px; }
                    .cmp-hero-searchrow { position: relative; max-width: 620px; }
                    .cmp-hero-searchbox {
                        display: flex; align-items: center; gap: 10px;
                        background: rgba(255,255,255,0.96);
                        border: 1px solid rgba(255,255,255,0.6);
                        border-radius: 14px;
                        padding: 6px 6px 6px 14px;
                        box-shadow: 0 10px 26px rgba(15,23,42,0.18);
                    }
                    .cmp-hero-input {
                        flex: 1; min-width: 0; border: none; outline: none;
                        background: transparent; font-size: 15px; color: #0f172a;
                        padding: 10px 2px;
                    }
                    .cmp-hero-btn {
                        display: inline-flex; align-items: center; gap: 7px;
                        background: ${GREEN}; color: #fff; border: none;
                        border-radius: 10px; padding: 11px 18px; font-size: 14px;
                        font-weight: 700; cursor: pointer; white-space: nowrap;
                        transition: background 150ms ease;
                    }
                    .cmp-hero-btn:hover { background: ${GREEN_DARK}; }

                    .cmp-suggest {
                        position: absolute; top: calc(100% + 8px); left: 0; right: 0;
                        background: #fff; border: 1px solid rgba(148,163,184,0.22);
                        border-radius: 14px; box-shadow: 0 16px 40px rgba(15,23,42,0.16);
                        z-index: 50; overflow: hidden;
                    }
                    .cmp-suggest-head {
                        display: flex; align-items: center; gap: 7px;
                        padding: 9px 14px; font-size: 11px; font-weight: 700;
                        letter-spacing: 0.5px; text-transform: uppercase;
                        color: ${GREEN}; background: rgba(22,163,74,0.10);
                        border-bottom: 1px solid rgba(22,163,74,0.14);
                    }
                    .cmp-suggest-item {
                        display: flex; align-items: center; gap: 10px;
                        padding: 10px 14px; font-size: 14px; color: #0f172a;
                        cursor: pointer; border: none; background: none;
                        width: 100%; text-align: left;
                    }
                    .cmp-suggest-item:hover, .cmp-suggest-item.active {
                        background: rgba(22,163,74,0.10);
                    }
                    .cmp-suggest-item .cmp-suggest-ico { color: #94a3b8; font-size: 14px; flex-shrink: 0; }
                    .cmp-suggest-item.active .cmp-suggest-ico { color: ${GREEN}; }

                    @media (max-width: 700px) {
                        .cmp-hero { padding: 22px 16px; border-radius: 14px; }
                        .cmp-hero-title { font-size: 21px; }
                        .cmp-hero-searchbox { flex-wrap: wrap; }
                        .cmp-hero-btn { width: 100%; justify-content: center; }
                    }
                `}</style>
                {/* ====================== Start Job Detail 2 ================ */}
                <section className="cmp-listing-section" style={{ paddingTop: '110px', paddingBottom: '64px' }}>
                    <div className="container">
                        {/* Futuristic hero header with AI-style autosuggest search */}
                        <motion.div
                            className="cmp-hero"
                            initial={{ opacity: 0, y: -18 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.5, ease: 'easeOut' }}
                        >
                            <div className="cmp-hero-inner">
                                <span className="cmp-hero-eyebrow">
                                    <FiZap aria-hidden="true" /> AI-Powered Company Search
                                </span>
                                <h1 className="cmp-hero-title">Discover Top Companies</h1>
                                <p className="cmp-hero-sub">
                                    Smart suggestions as you type — explore {totalJobs.toLocaleString('en-IN')} hiring companies.
                                </p>

                                <div className="cmp-hero-searchrow" ref={suggestRef}>
                                    <div className="cmp-hero-searchbox">
                                        <FiSearch style={{ color: '#94a3b8', fontSize: '18px', flexShrink: 0 }} aria-hidden="true" />
                                        <input
                                            type="text"
                                            className="cmp-hero-input"
                                            placeholder="Search by company or industry…"
                                            value={filters.q}
                                            aria-label="Search companies"
                                            autoComplete="off"
                                            onChange={(e) => {
                                                const q = e.target.value;
                                                setFilters((prev) => ({ ...prev, q }));
                                                setSearchKeyword(q);
                                                setPage(1);
                                                setShowSuggestions(q.length >= 1);
                                                setHighlightIndex(-1);
                                            }}
                                            onFocus={() => { if (filters.q.length >= 1) setShowSuggestions(true); }}
                                            onKeyDown={(e) => {
                                                if (e.key === 'ArrowDown') {
                                                    e.preventDefault();
                                                    if (suggestions.length) {
                                                        setShowSuggestions(true);
                                                        setHighlightIndex((i) => (i + 1) % suggestions.length);
                                                    }
                                                } else if (e.key === 'ArrowUp') {
                                                    e.preventDefault();
                                                    if (suggestions.length) {
                                                        setHighlightIndex((i) => (i <= 0 ? suggestions.length - 1 : i - 1));
                                                    }
                                                } else if (e.key === 'Enter') {
                                                    e.preventDefault();
                                                    if (showSuggestions && highlightIndex >= 0 && suggestions[highlightIndex]) {
                                                        runSearch(suggestions[highlightIndex]);
                                                    } else {
                                                        runSearch(filters.q);
                                                    }
                                                } else if (e.key === 'Escape') {
                                                    setShowSuggestions(false);
                                                    setHighlightIndex(-1);
                                                }
                                            }}
                                        />
                                        <button
                                            type="button"
                                            className="cmp-hero-btn"
                                            onClick={() => runSearch(filters.q)}
                                        >
                                            <FiSearch aria-hidden="true" /> Search
                                        </button>
                                    </div>

                                    {showSuggestions && suggestions.length > 0 && (
                                        <motion.div
                                            className="cmp-suggest"
                                            initial={{ opacity: 0, y: -6 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ duration: 0.18 }}
                                            role="listbox"
                                        >
                                            <div className="cmp-suggest-head">
                                                <FiZap aria-hidden="true" /> AI Suggestions
                                            </div>
                                            {suggestions.map((s, idx) => (
                                                <button
                                                    type="button"
                                                    key={`${s}-${idx}`}
                                                    role="option"
                                                    aria-selected={idx === highlightIndex}
                                                    className={`cmp-suggest-item${idx === highlightIndex ? ' active' : ''}`}
                                                    onMouseEnter={() => setHighlightIndex(idx)}
                                                    onMouseDown={(e) => { e.preventDefault(); runSearch(s); }}
                                                >
                                                    <FiSearch className="cmp-suggest-ico" aria-hidden="true" />
                                                    {s}
                                                </button>
                                            ))}
                                        </motion.div>
                                    )}
                                </div>
                            </div>
                        </motion.div>

                        <div className="row">
                            {/* Left Filters Section */}
                            <div className="col-md-3 col-sm-5">
                                <div className="widget-boxed padd-bot-0">
                                    <div className="widget-boxed-header">
                                        <h4>Filter</h4>
                                    </div>
                                    <div className="widget-boxed-body">
                                        <div className="search_widget_job">
                                            <div className="field_w_search">
                                                <input
                                                    type="text"
                                                    className="form-control"
                                                    placeholder="Search Keywords"
                                                    value={filters.q}
                                                    onChange={(e)=>{
                                                        setFilters(prev=>({...prev, q: e.target.value}));
                                                        setSearchKeyword(e.target.value);
                                                    }}
                                                    onKeyPress={(e)=>{
                                                        if(e.key === 'Enter') {
                                                            e.preventDefault();
                                                            setPage(1);
                                                        }
                                                    }}
                                                />
                                            </div>
                                            <div className="field_w_search">
                                                <input
                                                    type="text"
                                                    className="form-control"
                                                    placeholder="All Locations"
                                                    value={filters.city}
                                                    onChange={(e)=>{
                                                        setFilters(prev=>({...prev, city: e.target.value}));
                                                        setPage(1);
                                                    }}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div className="widget-boxed padd-bot-0 desktop-items-per-page">
                                    <div className="widget-boxed-header">
                                        <h4>Items Per Page</h4>
                                    </div>
                                    <div className="widget-boxed-body">
                                        <div style={{ padding: '10px 0' }}>
                                            <h5 style={{ marginBottom: '12px', fontSize: '15px', fontWeight: '600' }}>
                                                {itemsPerPage} items per page
                                            </h5>
                                            <input
                                                type="range"
                                                min="1"
                                                max="20"
                                                value={itemsPerPage}
                                                onChange={(e) => {
                                                    const newValue = parseInt(e.target.value);
                                                    setItemsPerPage(newValue);
                                                    setPage(1);
                                                }}
                                                style={{
                                                    width: '100%',
                                                    height: '6px',
                                                    borderRadius: '3px',
                                                    background: `linear-gradient(to right, #16a34a 0%, #16a34a ${(itemsPerPage - 1) / 19 * 100}%, #e1e5e9 ${(itemsPerPage - 1) / 19 * 100}%, #e1e5e9 100%)`,
                                                    outline: 'none',
                                                    cursor: 'pointer',
                                                    WebkitAppearance: 'none',
                                                    appearance: 'none'
                                                }}
                                                onInput={(e) => {
                                                    const target = e.target;
                                                    const percentage = ((target.value - target.min) / (target.max - target.min)) * 100;
                                                    target.style.background = `linear-gradient(to right, #16a34a 0%, #16a34a ${percentage}%, #e1e5e9 ${percentage}%, #e1e5e9 100%)`;
                                                }}
                                            />
                                            <style>
                                                {`
                                                    input[type="range"]::-webkit-slider-thumb {
                                                        -webkit-appearance: none;
                                                        appearance: none;
                                                        width: 18px;
                                                        height: 18px;
                                                        border-radius: 50%;
                                                        background: #16a34a;
                                                        cursor: pointer;
                                                        border: 2px solid #fff;
                                                        box-shadow: 0 2px 4px rgba(0,0,0,0.2);
                                                    }
                                                    input[type="range"]::-moz-range-thumb {
                                                        width: 18px;
                                                        height: 18px;
                                                        border-radius: 50%;
                                                        background: #16a34a;
                                                        cursor: pointer;
                                                        border: 2px solid #fff;
                                                        box-shadow: 0 2px 4px rgba(0,0,0,0.2);
                                                    }
                                                    input[type="range"]::-webkit-slider-track {
                                                        height: 6px;
                                                        border-radius: 3px;
                                                    }
                                                    input[type="range"]::-moz-range-track {
                                                        height: 6px;
                                                        border-radius: 3px;
                                                        background: #e1e5e9;
                                                    }
                                                `}
                                            </style>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '8px', fontSize: '12px', color: '#666' }}>
                                                <span>1</span>
                                                <span>20</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            {/* Middle Section - Company Cards */}
                            <div className="col-md-9 col-sm-7">
                                <div className="row mrg-bot-20">
                                    <div className="col-md-12">
                                        <h4 className="job_vacancie">{totalJobs} Companies</h4>
                                    </div>
                                </div>
                                {loading ? (
                                    <div className="job-verticle-list"><div className="vertical-job-card"><div className="vertical-job-body">Loading...</div></div></div>
                                ) : jobs.length === 0 ? (
                                    <div className="job-verticle-list"><div className="vertical-job-card"><div className="vertical-job-body">No companies found.</div></div></div>
                                ) : (
                                    <div
                                        className="companies-card-grid"
                                        style={{
                                            display: 'grid',
                                            gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
                                            gap: '16px'
                                        }}
                                    >
                                        {jobs.map((job) => {
                                            const id = job.id || job._id;
                                            const logoPath = job.logoUrl || job.companyLogoUrl || job.company_logo;
                                            const logo = logoPath && (logoPath.startsWith('http') || logoPath.startsWith('data:'))
                                                ? logoPath
                                                : logoPath
                                                    ? `${API_BASE_URL}${logoPath.startsWith('/') ? logoPath : `/${logoPath}`}`
                                                    : "/assets/img/company_logo_1.png";
                                            const company = job.companyName || 'Company';
                                            const location = job.address || '—';
                                            const foundedYear = job.foundedYear || 'N/A';
                                            const openJobs = Number(job.openJobs || 0);
                                            const isVerified = Boolean(job.isVerified);

                                            return (
                                                <div
                                                    key={id}
                                                    onClick={() => navigate(`/company/${id}`, { state: { company: { id, name: company } } })}
                                                    style={{
                                                        cursor: 'pointer',
                                                        backgroundColor: 'white',
                                                        borderRadius: '14px',
                                                        padding: '18px',
                                                        boxShadow: '0 6px 18px rgba(15,23,42,0.06)',
                                                        transition: 'box-shadow 0.2s ease, transform 0.2s ease',
                                                        position: 'relative',
                                                        border: '1px solid rgba(148,163,184,0.18)',
                                                        marginBottom: '0'
                                                    }}
                                                    onMouseEnter={(e) => {
                                                        e.currentTarget.style.boxShadow = '0 10px 26px rgba(15,23,42,0.10)';
                                                        e.currentTarget.style.transform = 'translateY(-3px)';
                                                    }}
                                                    onMouseLeave={(e) => {
                                                        e.currentTarget.style.boxShadow = '0 6px 18px rgba(15,23,42,0.06)';
                                                        e.currentTarget.style.transform = 'translateY(0)';
                                                    }}
                                                >
                                                    {/* Top Section: Logo, Company, Meta */}
                                                    <div style={{ display: 'flex', alignItems: 'flex-start', marginBottom: '12px', position: 'relative' }}>
                                                        {/* Company Logo */}
                                                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', marginRight: '12px' }}>
                                                            <div style={{
                                                                width: '50px',
                                                                height: '50px',
                                                                minWidth: '50px',
                                                                borderRadius: '6px',
                                                                overflow: 'hidden',
                                                                border: '1px solid #e1e5e9',
                                                                display: 'flex',
                                                                alignItems: 'center',
                                                                justifyContent: 'center',
                                                                backgroundColor: '#f8f9fa'
                                                            }}>
                                                                <img
                                                                    src={logo}
                                                                    className="img-responsive"
                                                                    alt={company}
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

                                                        {/* Company Name + Details */}
                                                        <div style={{ flex: 1, minWidth: 0 }}>
                                                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '10px' }}>
                                                                <h4 style={{
                                                                    margin: '0',
                                                                    fontSize: '15px',
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
                                                                    {company}
                                                                </h4>
                                                                {isVerified && (
                                                                    <img
                                                                        src="/assets/img/bluetick.png"
                                                                        alt="Verified"
                                                                        style={{
                                                                            width: '15px',
                                                                            height: '15px',
                                                                            flexShrink: 0
                                                                        }}
                                                                    />
                                                                )}
                                                            </div>

                                                            {/* Company Details - Vertical List */}
                                                            <div style={{
                                                                display: 'flex',
                                                                flexDirection: 'column',
                                                                gap: '6px',
                                                                fontSize: '13px',
                                                                color: '#4b5563'
                                                            }}>
                                                                {/* Location */}
                                                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                                    <i className="ti-location-pin" style={{ color: '#28a745', fontSize: '14px' }}></i>
                                                                    <span>{location}</span>
                                                                </div>

                                                                {/* Founded year */}
                                                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                                    <i className="ti-calendar" style={{ color: '#28a745', fontSize: '14px' }}></i>
                                                                    <span>Founded: {foundedYear}</span>
                                                                </div>

                                                                {/* Open jobs pill (Dream Company logic) */}
                                                                <div style={{ marginTop: '2px' }}>
                                                                    <span style={{
                                                                        display: 'inline-flex',
                                                                        alignItems: 'center',
                                                                        gap: '6px',
                                                                        background: openJobs > 0 ? 'rgba(22,163,74,0.10)' : '#f1f5f9',
                                                                        color: openJobs > 0 ? '#16a34a' : '#64748b',
                                                                        fontWeight: 700,
                                                                        fontSize: '12px',
                                                                        padding: '5px 12px',
                                                                        borderRadius: '999px'
                                                                    }}>
                                                                        <i className="ti-briefcase" style={{ fontSize: '13px' }}></i>
                                                                        {openJobs} Open Job{openJobs === 1 ? '' : 's'}
                                                                    </span>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                                <div className="clearfix" />
                                <div className="widget-boxed padd-bot-0 mobile-items-per-page" style={{ marginTop: '20px' }}>
                                    <div className="widget-boxed-header">
                                        <h4>Items Per Page</h4>
                                    </div>
                                    <div className="widget-boxed-body">
                                        <div style={{ padding: '10px 0' }}>
                                            <h5 style={{ marginBottom: '12px', fontSize: '15px', fontWeight: '600' }}>
                                                {itemsPerPage} items per page
                                            </h5>
                                            <input
                                                type="range"
                                                min="1"
                                                max="20"
                                                value={itemsPerPage}
                                                onChange={(e) => {
                                                    const newValue = parseInt(e.target.value);
                                                    setItemsPerPage(newValue);
                                                    setPage(1);
                                                }}
                                                style={{
                                                    width: '100%',
                                                    height: '6px',
                                                    borderRadius: '3px',
                                                    background: `linear-gradient(to right, #16a34a 0%, #16a34a ${(itemsPerPage - 1) / 19 * 100}%, #e1e5e9 ${(itemsPerPage - 1) / 19 * 100}%, #e1e5e9 100%)`,
                                                    outline: 'none',
                                                    cursor: 'pointer',
                                                    WebkitAppearance: 'none',
                                                    appearance: 'none'
                                                }}
                                                onInput={(e) => {
                                                    const target = e.target;
                                                    const percentage = ((target.value - target.min) / (target.max - target.min)) * 100;
                                                    target.style.background = `linear-gradient(to right, #16a34a 0%, #16a34a ${percentage}%, #e1e5e9 ${percentage}%, #e1e5e9 100%)`;
                                                }}
                                            />
                                            <style>
                                                {`
                                                    input[type="range"]::-webkit-slider-thumb {
                                                        -webkit-appearance: none;
                                                        appearance: none;
                                                        width: 18px;
                                                        height: 18px;
                                                        border-radius: 50%;
                                                        background: #16a34a;
                                                        cursor: pointer;
                                                        border: 2px solid #fff;
                                                        box-shadow: 0 2px 4px rgba(0,0,0,0.2);
                                                    }
                                                    input[type="range"]::-moz-range-thumb {
                                                        width: 18px;
                                                        height: 18px;
                                                        border-radius: 50%;
                                                        background: #16a34a;
                                                        cursor: pointer;
                                                        border: 2px solid #fff;
                                                        box-shadow: 0 2px 4px rgba(0,0,0,0.2);
                                                    }
                                                    input[type="range"]::-webkit-slider-track {
                                                        height: 6px;
                                                        border-radius: 3px;
                                                    }
                                                    input[type="range"]::-moz-range-track {
                                                        height: 6px;
                                                        border-radius: 3px;
                                                        background: #e1e5e9;
                                                    }
                                                `}
                                            </style>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '8px', fontSize: '12px', color: '#666' }}>
                                                <span>1</span>
                                                <span>20</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                {/* Modern Pagination */}
                                {totalPages > 1 && (
                                    <div className="utf_flexbox_area padd-0" style={{ marginTop: '30px' }}>
                                        <div style={{
                                            display: 'flex',
                                            justifyContent: 'center',
                                            alignItems: 'center',
                                            gap: '8px',
                                            flexWrap: 'wrap'
                                        }}>
                                            <button
                                                onClick={() => { if (page > 1) setPage(page - 1); }}
                                                disabled={page === 1}
                                                className={`page-item ${page === 1 ? 'disabled' : ''}`}
                                                style={{
                                                    padding: '8px 12px',
                                                    backgroundColor: page === 1 ? '#f3f4f6' : 'white',
                                                    color: page === 1 ? '#9ca3af' : '#16a34a',
                                                    border: '1px solid #e1e5e9',
                                                    borderRadius: '6px',
                                                    cursor: page === 1 ? 'not-allowed' : 'pointer',
                                                    fontSize: '12px',
                                                    fontWeight: '500',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    minWidth: '36px',
                                                    height: '36px'
                                                }}
                                                title="Previous"
                                            >
                                                <span aria-hidden="true" style={{ fontSize: '16px' }}>«</span>
                                            </button>
                                            
                                        {Array.from({ length: totalPages }).map((_, idx) => (
                                                <button
                                                    key={idx}
                                                    onClick={() => setPage(idx + 1)}
                                                    className={`page-item ${page === (idx+1) ? 'active' : ''}`}
                                                    style={{
                                                        padding: '8px 12px',
                                                        backgroundColor: page === (idx+1) ? '#16a34a' : 'white',
                                                        color: page === (idx+1) ? 'white' : '#4a5568',
                                                        border: '1px solid',
                                                        borderColor: page === (idx+1) ? '#16a34a' : '#e1e5e9',
                                                        borderRadius: '6px',
                                                        cursor: 'pointer',
                                                        fontSize: '12px',
                                                        fontWeight: '600',
                                                        minWidth: '36px',
                                                        height: '36px',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'center'
                                                    }}
                                                >
                                                    {idx+1}
                                                </button>
                                            ))}
                                            
                                            <button
                                                onClick={() => { if (page < totalPages) setPage(page + 1); }}
                                                disabled={page === totalPages}
                                                className={`page-item ${page === totalPages ? 'disabled' : ''}`}
                                                style={{
                                                    padding: '8px 12px',
                                                    backgroundColor: page === totalPages ? '#f3f4f6' : 'white',
                                                    color: page === totalPages ? '#9ca3af' : '#16a34a',
                                                    border: '1px solid #e1e5e9',
                                                    borderRadius: '6px',
                                                    cursor: page === totalPages ? 'not-allowed' : 'pointer',
                                                    fontSize: '12px',
                                                    fontWeight: '500',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    minWidth: '36px',
                                                    height: '36px'
                                                }}
                                                title="Next"
                                            >
                                                <span aria-hidden="true" style={{ fontSize: '16px' }}>»</span>
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                        {/* End Row */}
                    </div>
                </section>
                {/* ====================== End Job Detail 2 ================ */}

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
                                        <h4 className="mrg-0">{applyJob?.jobTitle || applyJob?.title}</h4>
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

                {/* Newsletter/Subscribe section removed as requested */}
            </>

            <MobileAppDownload />
            <Footer />
        </>
    );
}

export default Companies;