import React, { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { FaChevronRight, FaRupeeSign } from "react-icons/fa";
import { LuBriefcase, LuBuilding2, LuUsers, LuUser, LuSearch, LuZap } from "react-icons/lu";
import Header from "../Components/Header";
import Footer from "../Components/Footer";
import Chatbot from "../Components/Chatbot";
import MobileAppDownload from "../Components/MobileAppDownload";
import GuestMobileHero from "../Components/GuestMobileHero";
import WishlistButton from "../Components/WishlistButton";
import { API_BASE_URL } from "../config/api";
import { createSlug } from "../utils/slug";
import { trackSearch } from "../utils/trackActivity";
import useJobCategories from "../hooks/useJobCategories";
import { getCategoryIcon, formatCategoryName } from "../utils/categoryIcons";
import { motion, useInView, animate } from "framer-motion";
import PageSEO from "../Components/PageSEO";

// Animated count-up that runs once when scrolled into view (attract-the-eye stat).
function CountUp({ to = 0, duration = 2, suffix = "", prefix = "" }) {
    const ref = useRef(null);
    const inView = useInView(ref, { once: true, margin: "-60px" });
    const [val, setVal] = useState(0);
    useEffect(() => {
        if (!inView) return undefined;
        const controls = animate(0, to, {
            duration,
            ease: "easeOut",
            onUpdate: (v) => setVal(Math.floor(v)),
        });
        return () => controls.stop();
    }, [inView, to, duration]);
    return (
        <span ref={ref}>
            {prefix}{val.toLocaleString()}{suffix}
        </span>
    );
}

function Home() {
    const [latestJobs, setLatestJobs] = useState([]);
    const [featuredJobs, setFeaturedJobs] = useState([]);
    const [appliedJobIds, setAppliedJobIds] = useState(new Set());
    const [categories, setCategories] = useState([]);
    const [allCategories, setAllCategories] = useState([]);
    const [sponsorships, setSponsorships] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showAllCategories, setShowAllCategories] = useState(false);
    const [searchCategory, setSearchCategory] = useState('');
    const [searchKeyword, setSearchKeyword] = useState('');
    const [searchCategoryId, setSearchCategoryId] = useState('');
    const [searchSubCategory, setSearchSubCategory] = useState('');
    const [searchLocation, setSearchLocation] = useState('');

    const HERO_LOCATIONS = ['Hyderabad', 'Bhubaneswar', 'Bangalore', 'Mumbai', 'Kolkata'];
    const DEFAULT_NEARBY_CITY = 'Bhubaneswar';
    const scrollContainerRef = useRef(null);
    const animationFrameRef = useRef(null);
    const scrollPositionRef = useRef(0);
    const isScrollingPausedRef = useRef(false);
    const [companies, setCompanies] = useState([]);
    const companiesScrollContainerRef = useRef(null);
    const storiesScrollRef = useRef(null);
    const [cities, setCities] = useState([]);
    const [detectedCity, setDetectedCity] = useState(() => {
        try {
            return localStorage.getItem('detectedCity') || DEFAULT_NEARBY_CITY;
        } catch (_) {
            return DEFAULT_NEARBY_CITY;
        }
    });
    const [nearbyJobs, setNearbyJobs] = useState([]);

    const navigate = useNavigate();
    const { user, loading: authLoading } = useAuth();
    const showGuestMobileHero = !authLoading && !user;
    const {
        categories: filterJobCategories,
        subcategories: filterSubcategories,
        loading: filterCategoriesLoading,
        subcategoriesLoading: filterSubcategoriesLoading,
        findCategory: findFilterCategory,
    } = useJobCategories(searchCategoryId);

    const submitHeroSearch = () => {
        const params = new URLSearchParams();
        const q = searchKeyword.trim();

        if (q) {
            params.set("q", q);
            trackSearch(q);
        }
        const selectedCat = findFilterCategory(searchCategoryId);
        if (selectedCat?.name) {
            params.set("category", selectedCat.name);
            trackSearch(selectedCat.name);
        }
        if (searchSubCategory) {
            params.set("subcategory", searchSubCategory);
            if (!q) {
                params.set("q", searchSubCategory);
                trackSearch(searchSubCategory);
            }
        }
        if (searchLocation) params.set("city", searchLocation);

        navigate(`/jobs?${params.toString()}`);
    };

    useEffect(() => {
        fetchLatestJobs();
        fetchCategories();
        fetchSponsorships();
        fetchCompanies();
        fetchCities();
    }, []);

    // Auto-detect the visitor's city (IP-based, no permission prompt) and load
    // jobs in that city to power the "Jobs near you" suggestion section.
    useEffect(() => {
        let cancelled = false;

        const loadNearbyJobs = async (city) => {
            try {
                const resp = await fetch(`${API_BASE_URL}/api/jobs?city=${encodeURIComponent(city)}&limit=8&page=1`);
                if (!resp.ok) return;
                const data = await resp.json();
                const list = Array.isArray(data.jobs) ? data.jobs : [];
                if (!cancelled) setNearbyJobs(list);
            } catch (_) { /* silent */ }
        };

        const detect = async () => {
            const cached = (() => {
                try { return localStorage.getItem('detectedCity') || ''; } catch (_) { return ''; }
            })();
            if (cached) {
                if (!cancelled) setDetectedCity(cached);
                loadNearbyJobs(cached);
                return;
            }

            // Default city until IP geolocation resolves (or if it fails).
            if (!cancelled) setDetectedCity(DEFAULT_NEARBY_CITY);
            loadNearbyJobs(DEFAULT_NEARBY_CITY);

            try {
                const res = await fetch('https://ipwho.is/');
                const geo = await res.json();
                const city = geo && geo.success !== false ? (geo.city || geo.region || '') : '';
                if (city) {
                    try { localStorage.setItem('detectedCity', city); } catch (_) { }
                    if (!cancelled) setDetectedCity(city);
                    loadNearbyJobs(city);
                }
            } catch (_) { /* keep default city + its jobs */ }
        };

        detect();
        return () => { cancelled = true; };
    }, []);

    // Prefill the hero location field with the detected city (without clobbering
    // anything the user has already typed/selected).
    useEffect(() => {
        if (detectedCity) setSearchLocation((prev) => prev || detectedCity);
    }, [detectedCity]);

    useEffect(() => {
        const fetchAppliedJobs = async () => {
            try {
                if (!user || user.role !== "seeker") {
                    setAppliedJobIds(new Set());
                    return;
                }

                const token = localStorage.getItem("token");
                if (!token) {
                    setAppliedJobIds(new Set());
                    return;
                }

                const response = await fetch(`${API_BASE_URL}/api/applications/mine`, {
                    headers: {
                        Authorization: `Bearer ${token}`,
                        Accept: "application/json",
                    },
                });

                if (!response.ok) return;

                const data = await response.json();
                const ids = (Array.isArray(data.applications) ? data.applications : [])
                    .map((application) => String(application.jobId))
                    .filter(Boolean);
                setAppliedJobIds(new Set(ids));
            } catch (error) {
                console.error("Error fetching applied jobs:", error);
            }
        };

        fetchAppliedJobs();
    }, [user]);

    const fetchLatestJobs = async () => {
        try {
            setLoading(true);
            const response = await fetch(`${API_BASE_URL}/api/jobs/latest?limit=12`);
            if (response.ok) {
                const data = await response.json();
                const normalized = (data.jobs || []).map(job => {
                    const logoPath = job.logo;

                    // Resolve logo URL - works for both local and server environments
                    let logo;
                    if (logoPath && (logoPath.startsWith('http://') || logoPath.startsWith('https://') || logoPath.startsWith('data:'))) {
                        // Already a full URL or data URI, use as-is
                        logo = logoPath;
                    } else if (logoPath) {
                        // Relative path - construct full URL using API_BASE_URL
                        // Ensure API_BASE_URL doesn't have trailing slash
                        const baseUrl = API_BASE_URL.endsWith('/') ? API_BASE_URL.slice(0, -1) : API_BASE_URL;
                        // Ensure path starts with /
                        const cleanPath = logoPath.startsWith('/') ? logoPath : `/${logoPath}`;
                        logo = `${baseUrl}${cleanPath}`;
                    } else {
                        logo = '';
                    }


                    return {
                        ...job,
                        logo: logo,
                        title: job.title || job.jobTitle,
                        company: job.company || job.companyName,
                        type: job.type || job.jobType,
                        location: job.location || `${job.city || ''}${job.city && job.state ? ', ' : ''}${job.state || ''}${(job.city || job.state) && job.country ? ', ' : ''}${job.country || ''}`.trim() || 'Location not specified',
                        postedAt: job.postedAt || job.createdAt
                    };
                });
                setLatestJobs(normalized.slice(0, 6));
                setFeaturedJobs(normalized.slice(6, 12));
            }
        } catch (error) {
            console.error('Error fetching latest jobs:', error);
        } finally {
            setLoading(false);
        }
    };

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

    // Auto-scroll categories only when there are more than 4 cards.
    useEffect(() => {
        const container = scrollContainerRef.current;
        const list = showAllCategories ? allCategories : categories;
        const shouldScroll = list.length > 4;

        if (!container || !shouldScroll) {
            if (container) {
                container.scrollLeft = 0;
                scrollPositionRef.current = 0;
            }
            return;
        }

        scrollPositionRef.current = 0;
        container.scrollLeft = 0;
        const scrollSpeed = 0.8;

        const animate = () => {
            if (!isScrollingPausedRef.current && container) {
                const oneSetWidth = container.scrollWidth / 2;
                if (oneSetWidth > 0) {
                    scrollPositionRef.current += scrollSpeed;
                    if (scrollPositionRef.current >= oneSetWidth) {
                        scrollPositionRef.current -= oneSetWidth;
                    }
                    container.scrollLeft = scrollPositionRef.current;
                }
            }
            animationFrameRef.current = requestAnimationFrame(animate);
        };

        animationFrameRef.current = requestAnimationFrame(animate);
        return () => {
            if (animationFrameRef.current) {
                cancelAnimationFrame(animationFrameRef.current);
            }
        };
    }, [categories, allCategories, showAllCategories]);

    const fetchSponsorships = async () => {
        try {
            const response = await fetch(`${API_BASE_URL}/api/sponsorships`);
            if (response.ok) {
                const data = await response.json();
                setSponsorships(data.sponsorships || []);
            }
        } catch (error) {
            console.error('Error fetching sponsorships:', error);
        }
    };

    const fetchCompanies = async () => {
        try {
            // Use companies endpoint for "Dream Company" section
            const response = await fetch(`${API_BASE_URL}/api/companies`);
            if (response.ok) {
                const data = await response.json();
                const companiesList = Array.isArray(data.companies) ? data.companies : [];

                // Try to fetch jobs so we can count jobs per company
                let jobs = [];
                try {
                    const jobsResponse = await fetch(`${API_BASE_URL}/api/jobs?limit=1000&page=1`);
                    if (jobsResponse.ok) {
                        const jobsData = await jobsResponse.json();
                        jobs = Array.isArray(jobsData.jobs) ? jobsData.jobs : Array.isArray(jobsData) ? jobsData : [];
                    }
                } catch (err) {
                    console.error('Error fetching jobs for company counts:', err);
                }

                // Keep UI shape the same as before: { name, logo, jobCount, locations[] }
                const isDefaultLogo = (url) => {
                    const s = String(url || '').trim().toLowerCase();
                    return !s || s.includes('company_logo_1.png');
                };

                const normalized = companiesList.map((c) => {
                    const address = String(c.address || '').trim();
                    const locations = address
                        ? address.split(',').map(part => part.trim()).filter(Boolean)
                        : [];
                    // FIX 6: use the company name only — never the employer's personal name.
                    const companyName = String(c.companyName || '').trim();
                    const normalizedCompanyName = companyName.toLowerCase();

                    const jobCount = jobs.reduce((count, job) => {
                        const title = String(job.companyName || job.company_name || job.company || '').trim().toLowerCase();
                        return title === normalizedCompanyName ? count + 1 : count;
                    }, 0);

                    const hasRealLogo = !isDefaultLogo(c.logoUrl);
                    // A real company profile shows at least one of these signals. This
                    // guards the section even against a backend that still returns
                    // person-name fallbacks (i.e. before the FIX 6 backend redeploy).
                    const hasProfileSignal = !!(
                        String(c.industry || '').trim() ||
                        hasRealLogo ||
                        String(c.website || '').trim() ||
                        String(c.companySize || '').trim() ||
                        String(c.foundedYear || '').trim() ||
                        address
                    );

                    // Same fields as Employer Profile completion tracker.
                    const hasSocial = !!(
                        String(c.linkedin || '').trim() ||
                        String(c.twitter || '').trim() ||
                        String(c.facebook || '').trim() ||
                        String(c.google || '').trim()
                    );
                    const isProfileComplete = [
                        hasRealLogo,
                        !!companyName,
                        !!String(c.contactPerson || '').trim(),
                        !!String(c.email || '').trim(),
                        !!String(c.phone || '').trim(),
                        !!address,
                        !!String(c.website || '').trim(),
                        !!String(c.industry || '').trim(),
                        !!String(c.companySize || '').trim(),
                        !!String(c.companyType || '').trim(),
                        !!String(c.foundedYear || '').trim(),
                        !!String(c.description || '').trim(),
                        hasSocial
                    ].every(Boolean);

                    return {
                        id: c.id,
                        name: companyName,
                        logo: hasRealLogo ? String(c.logoUrl).trim() : "/assets/img/company_logo_1.png",
                        jobCount,
                        locations,
                        isVerified: Boolean(c.isVerified ?? c.is_verified ?? c.verified),
                        hasProfileSignal,
                        isProfileComplete
                    };
                }).filter(c => c.name && c.id != null && (c.isProfileComplete || c.isVerified));

                setCompanies(normalized.slice(0, 20));
            }
        } catch (error) {
            console.error('Error fetching companies:', error);
        }
    };

    const fetchCities = async () => {
        try {
            // Always show these 5 cities
            const predefinedCities = [
                { name: 'Hyderabad', image: '/assets/img/hyderabad.png' },
                { name: 'Bhubaneswar', image: '/assets/img/bhubaneswar.png' },
                { name: 'Bangalore', image: '/assets/img/bangalore.png' },
                { name: 'Mumbai', image: '/assets/img/mumbai.png' },
                { name: 'Kolkata', image: '/assets/img/kolkata.png' }
            ];

            // Fetch jobs to count jobs per city
            const response = await fetch(`${API_BASE_URL}/api/jobs?limit=1000&page=1`);
            if (response.ok) {
                const data = await response.json();
                const jobs = data.jobs || [];

                // Count jobs for each predefined city
                const citiesWithCounts = predefinedCities.map(city => {
                    const jobCount = jobs.filter(job => {
                        const jobCity = (job.city || '').toLowerCase();
                        return jobCity === city.name.toLowerCase();
                    }).length;

                    return {
                        name: city.name,
                        image: city.image,
                        jobCount: jobCount
                    };
                });

                setCities(citiesWithCounts);
            } else {
                // If API fails, still show cities with 0 jobs
                setCities(predefinedCities.map(city => ({
                    name: city.name,
                    image: city.image,
                    jobCount: 0
                })));
            }
        } catch (error) {
            console.error('Error fetching cities:', error);
            // On error, still show cities with 0 jobs
            const predefinedCities = [
                { name: 'Hyderabad', image: '/assets/img/hyderabad.png' },
                { name: 'Bhubaneswar', image: '/assets/img/bhubaneswar.png' },
                { name: 'Bangalore', image: '/assets/img/bangalore.png' },
                { name: 'Mumbai', image: '/assets/img/mumbai.png' },
                { name: 'Kolkata', image: '/assets/img/kolkata.png' }
            ];
            setCities(predefinedCities.map(city => ({
                name: city.name,
                image: city.image,
                jobCount: 0
            })));
        }
    };

    const scrollCompanies = (direction) => {
        const row = companiesScrollContainerRef.current;
        if (!row) return;

        const pageWidth = row.clientWidth;
        const startScroll = row.scrollLeft;
        const maxScroll = Math.max(0, row.scrollWidth - row.clientWidth);
        const targetScroll = direction === 'left'
            ? Math.max(0, startScroll - pageWidth)
            : Math.min(maxScroll, startScroll + pageWidth);

        row.scrollTo({
            left: targetScroll,
            behavior: 'smooth',
        });
    };

    const scrollStories = (direction) => {
        const ref = storiesScrollRef.current;
        if (!ref) return;

        const viewportWidth = window.innerWidth;
        const cardsPerPage = viewportWidth <= 767 ? 1 : viewportWidth <= 1199 ? 2 : 3;
        const firstCard = ref.querySelector('.story-card');
        if (!firstCard) return;

        const gap = parseFloat(window.getComputedStyle(ref).columnGap || window.getComputedStyle(ref).gap || '0') || 0;
        const cardStep = firstCard.getBoundingClientRect().width + gap;
        const scrollAmount = cardStep * cardsPerPage;
        const currentScroll = ref.scrollLeft;
        const newScroll = direction === 'left'
            ? currentScroll - scrollAmount
            : currentScroll + scrollAmount;

        ref.scrollTo({
            left: newScroll,
            behavior: 'smooth'
        });
    };

    const getCategoryIcon = (category) => {
        const iconMap = {
            'technology': 'ti-laptop',
            'information technology': 'ti-laptop',
            'it': 'ti-laptop',
            'software': 'ti-laptop',
            'healthcare': 'ti-heart',
            'education': 'ti-book',
            'finance': 'ti-credit-card',
            'marketing': 'ti-paint-bucket',
            'design': 'ti-palette',
            'sales': 'ti-shopping-cart',
            'administration': 'ti-settings',
            'hr': 'ti-user',
            'customer service': 'ti-headphone',
            'legal': 'ti-bookmark',
            'engineering': 'ti-settings',
            'operations': 'ti-settings'
        };

        const lowerCategory = category?.toLowerCase() || '';
        for (const key in iconMap) {
            if (lowerCategory.includes(key.toLowerCase()) || lowerCategory === key) {
                return iconMap[key];
            }
        }
        return 'ti-briefcase'; // Default icon
    };

    const getTrendingJobIcon = (jobTitle) => {
        if (!jobTitle) return 'ti-briefcase';

        const lowerTitle = jobTitle.toLowerCase();

        // Check in order of specificity
        if (lowerTitle.includes('full stack')) {
            return 'ti-desktop';
        } else if (lowerTitle.includes('ai engineer')) {
            return 'ti-settings';
        } else if (lowerTitle.includes('prompt engineer')) {
            return 'ti-pencil';
        } else if (lowerTitle.includes('cybersecurity') || lowerTitle.includes('security')) {
            return 'ti-lock';
        } else if (lowerTitle.includes('data analyst')) {
            return 'ti-stats-up';
        } else if (lowerTitle.includes('sales')) {
            return 'ti-shopping-cart';
        } else if (lowerTitle.includes('digital marketing')) {
            return 'ti-paint-bucket';
        } else if (lowerTitle.includes('financial') || lowerTitle.includes('investment')) {
            return 'ti-credit-card';
        } else if (lowerTitle.includes('marketing manager')) {
            return 'ti-paint-bucket';
        } else if (lowerTitle.includes('healthcare') || lowerTitle.includes('wellness')) {
            return 'ti-heart';
        } else if (lowerTitle.includes('operations') || lowerTitle.includes('project coordinator')) {
            return 'ti-clipboard';
        } else if (lowerTitle.includes('developer')) {
            return 'ti-desktop';
        } else if (lowerTitle.includes('analyst')) {
            return 'ti-stats-up';
        } else if (lowerTitle.includes('marketing')) {
            return 'ti-paint-bucket';
        }
        return 'ti-briefcase'; // Default icon
    };

    const trendingJobs = [
        { title: 'Full Stack Developer', searchTerm: 'Full Stack Developer' },
        { title: 'AI Engineer', searchTerm: 'AI Engineer' },
        { title: 'Prompt Engineer', searchTerm: 'Prompt Engineer' },
        { title: 'Cybersecurity Specialist', searchTerm: 'Cybersecurity' },
        { title: 'Data Analyst', searchTerm: 'Data Analyst' },
        { title: 'Sales Specialist', searchTerm: 'Sales' },
        { title: 'Digital Marketing Specialist', searchTerm: 'Digital Marketing' },
        { title: 'Financial Analyst', searchTerm: 'Financial Analyst' },
        { title: 'Marketing Manager', searchTerm: 'Marketing Manager' },
        { title: 'Healthcare & Wellness', searchTerm: 'Healthcare' },
        { title: 'Operations & Project Coordinator', searchTerm: 'Operations' }
    ];

    const getCategoryImage = (category) => {
        const imageMap = {
            'technology': 'information technology.png',
            'information technology': 'information technology.png',
            'it': 'motherboard.png',
            'software': 'motherboard.png',
            'marketing': 'marketing 2.png',
            'healthcare': 'healthcare.png',
            'health': 'healthcare.png',
            'medical': 'healthcare.png',
            'education': 'training.png',
            'training': 'training.png',
            'finance': 'loan.png',
            'banking': 'loan.png',
            'loan': 'loan.png',
            'support': 'technicalsupport.png',
            'technical': 'technicalsupport.png',
            'customer service': 'technicalsupport.png',
            'mechanic': 'mechanic.png',
            'mechanical': 'mechanic.png',
            'automotive': 'mechanic.png',
            // Map any "other"/"others" style category names to the Others image
            'other': 'Others 1.png',
            'others': 'Others 1.png',
            'consultant': 'consultant.png',
            'consulting': 'consultant.png',
            'advisory': 'consultant.png'
        };

        const lowerCategory = category?.toLowerCase() || '';
        for (const key in imageMap) {
            if (lowerCategory.includes(key.toLowerCase()) || lowerCategory === key) {
                return `/assets/img/${imageMap[key]}`;
            }
        }
        return '/assets/img/motherboard.png'; // Default image
    };

    const formatCategoryName = (category) => {
        if (!category) return '';
        // Replace underscores with spaces and capitalize each word
        return category
            .replace(/_/g, ' ')
            .split(' ')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
            .join(' ');
    };

    const formatJobType = (type) => {
        if (!type) return 'Full Time';
        return type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
    };

    const getJobTypeClass = (type) => {
        if (!type) return 'full-type';
        const typeMap = {
            'full_time': 'full-type',
            'part_time': 'part-type',
            'internship': 'internship-type',
            'contract': 'contract-type',
            'freelancer': 'freelancer-type'
        };
        return typeMap[type] || 'full-type';
    };

    const JobCard = ({ job }) => {
        const jobUrl = `/jobs/${createSlug(job.title)}-${job.id}`;
        const isApplied = appliedJobIds.has(String(job.id));
        const jobTypeKey = String(job?.type || '')
            .toLowerCase()
            .replace(/\s+/g, '_');
        const prettifyText = (val) => {
            if (!val) return '';
            return String(val)
                .replace(/_/g, ' ')
                .replace(/\s+/g, ' ')
                .trim()
                .split(' ')
                .map(w => (w ? w.charAt(0).toUpperCase() + w.slice(1).toLowerCase() : ''))
                .join(' ');
        };

        const jobTypeStyles = (() => {
            if (jobTypeKey === 'full_time' || jobTypeKey === 'fulltime') {
                return { color: '#15805D', background: '#DEF6E7' };
            }
            if (jobTypeKey === 'freelance' || jobTypeKey === 'freelancer') {
                return { color: '#6D28D9', background: '#EBE2FC' };
            }
            if (jobTypeKey === 'part_time' || jobTypeKey === 'parttime') {
                return { color: '#0E7490', background: '#BED2DA' };
            }
            if (jobTypeKey === 'contract') {
                return { color: '#7C3AED', background: '#EDE9FE' };
            }
            if (jobTypeKey === 'internship' || jobTypeKey === 'intern') {
                return { color: '#C2410C', background: '#FFEDD5' };
            }
            return { color: '#15805D', background: '#DEF6E7' };
        })();

        return (
            <div className="col-md-4 col-sm-6 latest-job-col" style={{ marginBottom: '25px' }}>
                <div
                    className="latest-job-card"
                    role="button"
                    tabIndex={0}
                    onClick={() => navigate(jobUrl)}
                    onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') navigate(jobUrl);
                    }}
                >
                    <div className="job-card-top">
                        <span className="job-type-badge" style={{ background: jobTypeStyles.background, color: jobTypeStyles.color }}>
                            {formatJobType(job.type)}
                        </span>
                        <WishlistButton jobId={job.id} style={{ marginLeft: 'auto' }} />
                    </div>

                    <h3 className="job-title">
                        <Link to={jobUrl} onClick={(e) => e.stopPropagation()}>
                            {prettifyText(job.title)}
                        </Link>
                    </h3>

                    <div className="job-meta">
                        <div className="job-meta-row">
                            <i className="ti-briefcase" aria-hidden="true" />
                            <span className="job-meta-text">{prettifyText(job.company)}</span>
                        </div>
                        <div className="job-meta-row">
                            <i className="ti-location-pin" aria-hidden="true" />
                            <span className="job-meta-text">{prettifyText(job.location)}</span>
                        </div>
                    </div>

                    <div className="job-card-footer">
                        <div className="footer-left">
                            <img
                                src={job.logo}
                                alt={job.company}
                                className="company-logo"
                                onError={(e) => { e.target.src = '/assets/img/company_logo_1.png'; }}
                            />
                            <div className="posted-wrap">
                                <div className="posted-label">Posted on</div>
                                <div className="posted-date">
                                    {new Date(job.postedAt).toLocaleDateString()}
                                </div>
                            </div>
                        </div>

                        {isApplied ? (
                            <span className="apply-btn applied-btn">
                                <i className="ti-check" aria-hidden="true" />
                                Applied
                            </span>
                        ) : (
                            <Link
                                to={jobUrl}
                                className="apply-btn"
                                onClick={(e) => e.stopPropagation()}
                            >
                                Apply Now
                            </Link>
                        )}
                    </div>
                </div>
            </div>
        );
    };

    const visibleCategories = showAllCategories ? allCategories : categories;
    const shouldInfiniteScrollCategories = visibleCategories.length > 4;
    const categoryCards = shouldInfiniteScrollCategories
        ? [...visibleCategories, ...visibleCategories]
        : visibleCategories;

    return (
        <>
            <PageSEO
                title="Job Consultancies in Odisha | Find Your Career with Uptula"
                description="Looking for a job consultancy near me in Bhubaneswar? Uptula helps job seekers in Odisha find the right career opportunities quickly and easily. Connect with top employers today."
            />
            <style>{`
            /* Latest/Featured Jobs cards — scoped to Home */
            @import url('https://fonts.googleapis.com/css2?family=Open+Sans:wght@400;500;600;700&display=swap');

            .latest-job-col{
                display:flex;
            }

            .latest-job-card{
                font-family:'Open Sans',sans-serif;
                font-size:14px;
                line-height:1.5;
                color:#212529;

                background:#ffffff;
                border-radius:24px;
                padding:28px;
                box-shadow:0 20px 45px rgba(15,23,42,0.08);
                border:1px solid rgba(148,163,184,0.12);

                display:flex;
                flex-direction:column;
                gap:18px;
                height:100%;
                width:100%;

                transition:transform 200ms ease, box-shadow 200ms ease;
                cursor:pointer;
            }

            .latest-job-card:hover{
                transform:translateY(-6px);
                box-shadow:0 26px 60px rgba(15,23,42,0.12);
            }

            .job-card-top{
                display:flex;
                align-items:center;
                justify-content:space-between;
                gap:12px;
            }

            .job-type-badge{
                font-size:12px;
                font-weight:600;
                text-transform:uppercase;
                padding:4px 10px;
                border-radius:50px;
                background:#26AE61;
                color:#ffffff;
                white-space:nowrap;
            }

            .bookmark-icon{
                font-size:18px;
                color:#6c757d;
                cursor:pointer;
                transition:color 150ms ease;
            }
            .bookmark-icon:hover{ color:#dc3545; }

            .job-title{
                font-size:20px;
                font-weight:700;
                line-height:1.3;
                color:#212529;
                margin:0;
            }
            .job-title a{
                color:inherit;
                text-decoration:none;
            }
            .job-title a:hover{
                color:#0d6efd;
            }

            .job-meta{
                display:flex;
                flex-direction:column;
                gap:10px;
            }
            .job-meta-row{
                display:flex;
                align-items:center;
                gap:6px;
                font-size:14px;
                font-weight:500;
                color:#6c757d;
                min-width:0;
            }
            .job-meta-row i{
                font-size:14px;
                color:#26AE61;
                flex:0 0 auto;
            }
            .job-meta-text{
                overflow:hidden;
                text-overflow:ellipsis;
                white-space:nowrap;
            }

            .job-card-footer{
                display:flex;
                justify-content:space-between;
                align-items:center;
                gap:12px;
                margin-top:auto;
                padding-top:12px;
                border-top:1px solid rgba(148,163,184,0.14);
            }
            .footer-left{
                display:flex;
                align-items:center;
                gap:10px;
                min-width:0;
            }
            .company-logo{
                width:42px;
                height:42px;
                border-radius:8px;
                object-fit:contain;
                object-position:center;
                border:1px solid rgba(148,163,184,0.18);
                background:#fff;
                padding:2px;
                flex:0 0 auto;
            }
            .posted-label{
                font-size:12px;
                font-weight:500;
                color:#adb5bd;
                text-transform:uppercase;
                margin:0;
                line-height:1.2;
            }
            .posted-date{
                font-size:14px;
                font-weight:600;
                color:#212529;
                margin:2px 0 0 0;
                line-height:1.2;
            }
            .apply-btn{
                font-size:13px;
                font-weight:600;
                padding:6px 14px;
                border-radius:8px;
                border:1px solid #26AE61;
                color:#26AE61;
                background:transparent;
                text-decoration:none;
                white-space:nowrap;
                transition:background 150ms ease, color 150ms ease;
            }
            .apply-btn:hover{
                background:#26AE61;
                color:#ffffff;
                text-decoration:none;
            }
            .applied-btn,
            .applied-btn:hover{
                display:flex;
                align-items:center;
                gap:6px;
                color:#2563EB;
                font-weight:500;
                font-size:14px;
                background:transparent;
                border:none;
                padding:0;
                cursor:default;
                text-decoration:none;
            }

            /* Hero banner */
            .hero-landing-banner{
                background: linear-gradient(135deg, #dbeafe 0%, #dcfce7 100%);
                background-image: url(/assets/img/website_image.png);
                background-size: cover;
                background-position: center;
                background-repeat: no-repeat;
                padding: 150px 0;
                position: relative;
                overflow: hidden;
            }

            /* Readability overlay so left text stays clean */
            .hero-landing-banner::before{
                content: '';
                position: absolute;
                inset: 0;
                background-image: url(/assets/img/website_image.png);
                background-size: cover;
                background-position: center;
                background-repeat: no-repeat;
                opacity: 0.18;
                z-index: 0;
                pointer-events: none;
            }

            .hero-landing-grid{
                display:flex;
                align-items:center;
                justify-content:space-between;
                gap:32px;
                position: relative;
                z-index: 1;
            }

            .hero-left{
                flex: 1 1 50%;
                min-width: 0;
            }

            .hero-right{
                flex: 1 1 50%;
                display:flex;
                justify-content:flex-end;
            }

            .hero-badge{
                display: inline-block;
                padding: 6px 18px;
                font-size: 1.24rem;
                font-weight: 600;
                letter-spacing: 0.08em;
                color: #047857;
                background: rgba(34, 197, 94, 0.12);
                border-radius: 999px;
                text-transform: uppercase;
                margin-top: 8px;
                margin-bottom: 20px;
            }

            .hero-title{
                font-size: 48px;
                font-weight: 700;
                line-height: 1.2;
                color: #0f172a;
                margin-bottom: 16px;
            }

            .hero-desc{
                font-size: 16px;
                font-weight: 400;
                color: #6c757d;
                line-height: 1.6;
                margin-bottom: 24px;
                max-width: 520px;
            }

            .hero-search{
                background: #ffffff;
                border: 1px solid rgba(13, 110, 253, 0.18);
                padding: 8px;
                border-radius: 18px;
                box-shadow:
                    0 14px 36px rgba(15, 23, 42, 0.14),
                    0 0 0 4px rgba(13, 110, 253, 0.08);
                backdrop-filter: blur(6px);
                max-width: 100%;
                width: 100%;
                transition: box-shadow 180ms ease, border-color 180ms ease, transform 180ms ease;
            }

            .hero-search:focus-within{
                border-color: rgba(13, 110, 253, 0.45);
                box-shadow:
                    0 16px 44px rgba(15, 23, 42, 0.18),
                    0 0 0 4px rgba(13, 110, 253, 0.12);
                transform: translateY(-1px);
            }

            .hero-search-fields{
                display: flex;
                flex-direction: column;
                gap: 8px;
            }

            .hero-search-row{
                display: flex;
                align-items: center;
                gap: 8px;
            }

            .hero-search-row .hero-field{
                flex: 1 1 0;
                min-width: 0;
            }

            .hero-field{
                display: flex;
                align-items: center;
                gap: 8px;
                padding: 10px 12px;
                background: #f8fafc;
                border: 1px solid #dbe3ee;
                border-radius: 10px;
                min-width: 0;
                transition: border-color 150ms ease, box-shadow 150ms ease, background 150ms ease;
            }

            .hero-field--keyword{
                flex: 1.15 1 0;
            }

            .hero-field:focus-within{
                border-color: rgba(13, 110, 253, 0.45);
                box-shadow: 0 0 0 3px rgba(13, 110, 253, 0.12);
                background: #ffffff;
            }

            .hero-field i{
                font-size: 14px;
                color: #6c757d;
                flex: 0 0 auto;
            }

            .hero-field--disabled{
                opacity: 0.85;
                background: #f1f5f9;
            }

            .hero-input{
                font-size: 14px;
                border: none;
                outline: none;
                width: 100%;
                background: transparent;
                color: #212529;
                padding: 0;
            }

            .hero-input::placeholder{
                color: #94a3b8;
            }

            .hero-select{
                font-size: 14px;
                border: none;
                outline: none;
                width: 100%;
                min-width: 0;
                background-color: transparent;
                color: #212529;
                padding: 0;
                cursor: pointer;
                appearance: none;
                -webkit-appearance: none;
                -moz-appearance: none;
                background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%236c757d' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E");
                background-repeat: no-repeat;
                background-position: right 0 center;
                padding-right: 18px;
                text-overflow: ellipsis;
                overflow: hidden;
                white-space: nowrap;
            }

            .hero-select:disabled{
                cursor: not-allowed;
                color: #94a3b8;
            }

            .hero-select--placeholder{
                color: #94a3b8;
            }

            .hero-select option{
                background: #e8f3ff;
                color: #0f172a;
            }

            .hero-select option:checked{
                background: #0d6efd;
                color: #ffffff;
            }

            .hero-search-btn{
                width: 48px;
                height: 48px;
                background: linear-gradient(135deg, #22c55e, #16a34a);
                border-radius: 12px;
                border: none;
                display: flex;
                align-items: center;
                justify-content: center;
                color: #ffffff;
                flex: 0 0 auto;
                box-shadow: 0 10px 22px rgba(34, 197, 94, 0.35);
                transition: transform 150ms ease, box-shadow 150ms ease, filter 150ms ease;
                cursor: pointer;
                text-decoration: none;
            }
            .hero-search-btn:hover{
                transform: translateY(-1px);
                box-shadow: 0 14px 24px rgba(22, 163, 74, 0.42);
                filter: brightness(1.02);
            }

            .hero-search-btn:focus-visible{
                outline: none;
                box-shadow:
                    0 0 0 3px rgba(255, 255, 255, 0.95),
                    0 0 0 6px rgba(13, 110, 253, 0.35);
            }

            .hero-stats{
                display:flex;
                align-items:center;
                gap: 20px;
                margin-top: 24px;
                flex-wrap: wrap;
            }

            .hero-stat-box{
                background: #e6f4ff;
                padding: 12px 18px;
                border-radius: 12px;
                display:flex;
                align-items:baseline;
                gap: 10px;
            }

            .hero-stat-value{
                font-size: 20px;
                font-weight: 700;
                color: #0d6efd;
            }

            .hero-stat-label{
                font-size: 13px;
                color: #212529;
                font-weight: 500;
            }

            .hero-cta-links{
                display:flex;
                align-items:center;
                gap: 18px;
                margin-top: 16px;
                flex-wrap: wrap;
            }

            .hero-cta-link{
                font-size: 14px;
                font-weight: 500;
                color: #0d6efd;
                display:flex;
                align-items:center;
                gap: 6px;
                text-decoration:none;
                white-space: nowrap;
            }

            .hero-cta-link:hover{ color:#0a58ca; }

            .hero-image-frame {
    left: -91px;
    width: 100%;
    max-width: 560px;
    border-radius: 24px;
    overflow: hidden;
    position: relative;
    box-shadow: none;
    background: transparent;
    padding: 0;
    min-height: 300px;
    top: 162px;
}

            /* Floating apply bar (over the right-side banner background) */
            .hero-find-job-bar {
                position: absolute;
                left: 4px;
                bottom: 4px;
                background: #ffffff;
                border-radius: 18px;
                padding: 11px 18px;
                box-shadow: 0 16px 40px rgba(15, 23, 42, 0.12);
                border: 1px solid rgba(148, 163, 184, 0.18);
                display: flex;
                align-items: center;
                justify-content: space-between;
                gap: 16px;
                width: 382px;
                max-width: calc(100% - 48px);
                z-index: 2;
            }

            .hero-find-job-text{
                font-size: 20px;
                font-weight: 500;
                color: #0f172a;
                line-height: 1.1;
                white-space: nowrap;
                overflow: hidden;
                text-overflow: ellipsis;
                max-width: 60%;
            }

            .hero-apply-floating-btn{
                background: #2563eb;
                color: #ffffff;
                border-radius: 999px;
                padding: 10px 22px;
                font-size: 14px;
                font-weight: 700;
                text-decoration: none;
                white-space: nowrap;
                border: 1px solid #2563eb;
                transition: background 150ms ease, transform 150ms ease;
                display: inline-flex;
                align-items: center;
                justify-content: center;
            }
            .hero-apply-floating-btn:hover{
                background: #1d4ed8;
                transform: translateY(-1px);
            }

            .hero-image-frame img{
                width: 100%;
                height: auto;
                display:block;
            }

            .hero-apply-now-btn{
                position: absolute;
                right: 34px;
                top: 24px;
                background: #0d6efd;
                color: #ffffff;
                padding: 9px 16px;
                border-radius: 12px;
                font-size: 12px;
                font-weight: 700;
                text-decoration:none;
                box-shadow: 0 14px 30px rgba(13,110,253,0.25);
            }

            @media (max-width: 768px){
                .hero-landing-banner{ padding: 28px 0; }
                .hero-landing-banner{
                    background-image: none;
                    background: linear-gradient(135deg, #dbeafe 0%, #dcfce7 100%);
                }
                .hero-landing-grid{ flex-direction: column; gap: 20px; }
                .hero-right{ display:none; }
                .hero-left{ text-align:center; }
                .hero-title{ font-size: 32px; }
                .hero-desc{ max-width: none; margin-left:auto; margin-right:auto; }
                .hero-search{ max-width: none; }
                .hero-search-row{ flex-wrap: wrap; }
                .hero-search-row .hero-field{ flex: 1 1 calc(50% - 4px); }
                .hero-field--keyword{ flex: 1 1 100%; }
                .hero-search-btn{ width: 100%; height: 44px; }
                .hero-stats{ justify-content:center; }
                .hero-cta-links{ justify-content:center; }
            }

            /* Trending Jobs section (mobile) */
            @media (max-width: 768px){
                .home-trending-wrap .row{
                    margin-left: 0 !important;
                    margin-right: 0 !important;
                }
                .home-trending-wrap .col-md-2,
                .home-trending-wrap .col-sm-4,
                .home-trending-wrap .col-xs-6{
                    padding-left: 6px !important;
                    padding-right: 6px !important;
                }
                .home-trending-card{
                    padding: 12px 12px !important;
                    gap: 10px !important;
                    minHeight: 52px !important;
                }
                .home-trending-card i{
                    font-size: 18px !important;
                }
            }

            /* Cities section (mobile) — swipe like Success Stories */
            .cities-scroll-container{
                scroll-snap-type: x mandatory;
            }
            .home-city-item{
                scroll-snap-align: start;
            }
            @media (max-width: 767px){
                .cities-viewport{
                    margin: 0 12px;
                    overflow: hidden;
                }
                .cities-scroll-container{
                    justify-content: flex-start !important;
                    overflow-x: auto !important;
                    -webkit-overflow-scrolling: touch;
                    padding: 10px 0 !important;
                    gap: 12px !important;
                }
                .home-city-item{
                    width: 100% !important;
                    min-width: 100% !important;
                    max-width: 100% !important;
                    flex: 0 0 100% !important;
                }
                .home-city-card{
                    height: 260px !important;
                }
            }
        `}</style>
            <Header />
            <div className={showGuestMobileHero ? 'home--guest-mobile-hero' : ''}>
                {showGuestMobileHero ? (
                    <GuestMobileHero
                        searchKeyword={searchKeyword}
                        setSearchKeyword={setSearchKeyword}
                        onSearch={submitHeroSearch}
                    />
                ) : null}
                {/* ======================= Start Banner ===================== */}
                <div className="hero-landing-banner hero-landing-banner--default">
                    <div className="container">
                        <div className="hero-landing-grid">
                            <div className="hero-left">
                                <span className="hero-badge">Ready to Find Your Dream Job?</span>
                                <h1 className="hero-title">Put your cv dream job waiting .</h1>
                                <p className="hero-desc">
                                    Explore opportunities that match your skills and passions, and land the job you've always wanted with JobsPortal.
                                </p>

                                <form
                                    onSubmit={(e) => {
                                        e.preventDefault();
                                        submitHeroSearch();
                                    }}
                                >
                                    <fieldset className="utf_home_form_one" style={{ border: 'none', padding: 0, margin: 0 }}>
                                        <div className="hero-search">
                                            <div className="hero-search-fields">
                                                <div className="hero-search-row">
                                                    <div className="hero-field hero-field--keyword">
                                                        <i className="ti-search" aria-hidden="true" />
                                                        <input
                                                            type="text"
                                                            className="hero-input"
                                                            placeholder="Search Keywords..."
                                                            value={searchKeyword}
                                                            onChange={(e) => setSearchKeyword(e.target.value)}
                                                        />
                                                    </div>

                                                    <div className="hero-field">
                                                        <i className="ti-location-pin" aria-hidden="true" />
                                                        <input
                                                            type="text"
                                                            className="hero-input"
                                                            list="hero-location-list"
                                                            placeholder={detectedCity ? `Location · detected ${detectedCity}` : 'Location'}
                                                            value={searchLocation}
                                                            onChange={(e) => setSearchLocation(e.target.value)}
                                                        />
                                                        <datalist id="hero-location-list">
                                                            {[...new Set([detectedCity, ...HERO_LOCATIONS].filter(Boolean))].map((city) => (
                                                                <option key={city} value={city} />
                                                            ))}
                                                        </datalist>
                                                    </div>

                                                    <button type="submit" className="hero-search-btn" aria-label="Search">
                                                        <i className="ti-search" aria-hidden="true" />
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    </fieldset>
                                </form>

                                <div className="hero-stats">

                                </div>

                                <div className="hero-cta-links">

                                </div>
                            </div>

                            <div className="hero-right">
                                <div className="hero-image-frame">
                                    <div className="hero-find-job-bar">
                                        <div className="hero-find-job-text">Find a Perfect Job</div>
                                        <Link to="/jobs" className="hero-apply-floating-btn">
                                            Apply Now
                                        </Link>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* ======================= End Banner ===================== */}
            </div>
            {/* ================= Animated Stats Section ========================= */}
            {/* <section className="ustat-section">
                <style>{`
                    .ustat-section {
                        position: relative; overflow: hidden;
                        padding: 70px 0;
                        background: linear-gradient(135deg, #16a34a 0%, #15803d 55%, #0f766e 100%);
                    }
                    .ustat-section::before {
                        content: ''; position: absolute; inset: 0;
                        background:
                            radial-gradient(circle at 12% 20%, rgba(255,255,255,0.16), transparent 38%),
                            radial-gradient(circle at 88% 80%, rgba(255,255,255,0.12), transparent 40%);
                        pointer-events: none;
                    }
                    .ustat-head { text-align: center; color: #fff; margin: 0 auto 40px; max-width: 620px; padding: 0 16px; position: relative; }
                    .ustat-head h2 { font-size: 34px; font-weight: 800; margin: 0 0 10px; }
                    .ustat-head p { font-size: 15px; opacity: .9; margin: 0; }
                    .ustat-grid {
                        position: relative; max-width: 1080px; margin: 0 auto; padding: 0 16px;
                        display: grid; grid-template-columns: repeat(4, 1fr); gap: 18px;
                    }
                    .ustat-card {
                        background: rgba(255,255,255,0.12); backdrop-filter: blur(4px);
                        border: 1px solid rgba(255,255,255,0.22); border-radius: 16px;
                        padding: 26px 18px; text-align: center; color: #fff;
                    }
                    .ustat-num { font-size: 40px; font-weight: 900; line-height: 1; letter-spacing: -1px; }
                    .ustat-label { margin-top: 10px; font-size: 14px; font-weight: 600; opacity: .92; }
                    .ustat-ico { font-size: 22px; margin-bottom: 10px; display: inline-block; opacity: .9; }
                    @media (max-width: 991px) { .ustat-grid { grid-template-columns: repeat(2, 1fr); } .ustat-num { font-size: 34px; } }
                    @media (max-width: 575px) { .ustat-grid { grid-template-columns: repeat(2, 1fr); gap: 12px; } .ustat-section { padding: 52px 0; } .ustat-head h2 { font-size: 27px; } }
                `}</style>
                <div className="ustat-head">
                   
                </div>
                <div className="ustat-grid">
                    {[
                        { icon: 'ti-briefcase', to: 12000, suffix: '+', label: 'Active Jobs' },
                        { icon: 'ti-home', to: 850, suffix: '+', label: 'Hiring Companies' },
                        { icon: 'ti-user', to: 50000, suffix: '+', label: 'Registered Candidates' },
                        { icon: 'ti-medall', to: 9500, suffix: '+', label: 'Successful Hires' },
                    ].map((s, i) => (
                        <motion.div
                            className="ustat-card"
                            key={s.label}
                            initial={{ opacity: 0, scale: 0.9, y: 20 }}
                            whileInView={{ opacity: 1, scale: 1, y: 0 }}
                            viewport={{ once: true, margin: "-60px" }}
                            transition={{ duration: 0.45, delay: i * 0.1 }}
                            whileHover={{ y: -5 }}
                        >
                            <i className={`${s.icon} ustat-ico`} aria-hidden="true" />
                            <div className="ustat-num"><CountUp to={s.to} suffix={s.suffix} /></div>
                            <div className="ustat-label">{s.label}</div>
                        </motion.div>
                    ))}
                </div>
            </section> */}
            {/* <section className="ustat-section">
                <style>{`
        .ustat-section {
            position: relative;
            overflow: hidden;
            padding: 48px 0 56px;
            background: linear-gradient(160deg, #f0faf4 0%, #e6f5ec 50%, #dff0e8 100%);
        }
        .ustat-section::before {
            content: '';
            position: absolute;
            top: -80px; left: -80px;
            width: 320px; height: 320px;
            border-radius: 50%;
            background: rgba(134, 210, 168, 0.18);
            pointer-events: none;
        }
        .ustat-section::after {
            content: '';
            position: absolute;
            bottom: -60px; right: -60px;
            width: 260px; height: 260px;
            border-radius: 50%;
            background: rgba(134, 210, 168, 0.14);
            pointer-events: none;
        }
        .ustat-panel {
            position: relative;
            max-width: 1100px;
            margin: 0 auto;
            padding: 0 20px;
        }
        .ustat-grid {
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            background: #ffffff;
            border-radius: 16px;
            box-shadow: 0 4px 24px rgba(22, 101, 52, 0.08);
            overflow: hidden;
        }
        .ustat-item {
            position: relative;
            padding: 22px 16px 20px;
            text-align: center;
        }
        .ustat-item:not(:last-child)::after {
            content: '';
            position: absolute;
            top: 50%;
            right: 0;
            transform: translateY(-50%);
            width: 1px;
            height: 58%;
            background: #e5e7eb;
        }
        .ustat-ico-wrap {
            width: 56px;
            height: 56px;
            border-radius: 50%;
            background: #eaf7ef;
            display: flex;
            align-items: center;
            justify-content: center;
            margin: 0 auto 12px;
        }
        .ustat-ico {
            font-size: 26px;
            color: #16a34a;
            stroke-width: 2px;
        }
        .ustat-num {
            font-size: 34px;
            font-weight: 900;
            line-height: 1;
            letter-spacing: -1px;
            color: #166534;
        }
        .ustat-label {
            margin-top: 8px;
            font-size: 14px;
            font-weight: 500;
            color: #374151;
        }
        @media (max-width: 991px) {
            .ustat-grid { grid-template-columns: repeat(2, 1fr); }
            .ustat-item:nth-child(2)::after { display: none; }
            .ustat-item:nth-child(1)::after,
            .ustat-item:nth-child(3)::after { height: 70%; }
            .ustat-num { font-size: 30px; }
        }
        @media (max-width: 575px) {
            .ustat-section { padding: 40px 0 48px; }
            .ustat-grid { grid-template-columns: repeat(2, 1fr); }
            .ustat-item { padding: 18px 12px 16px; }
            .ustat-item:not(:last-child)::after { display: none; }
            .ustat-item:nth-child(odd):not(:nth-last-child(1))::after {
                display: block;
                height: 65%;
            }
            .ustat-num { font-size: 26px; }
            .ustat-ico-wrap { width: 50px; height: 50px; margin-bottom: 10px; }
            .ustat-ico { font-size: 22px; }
        }
    `}</style>

                <div className="ustat-panel">
                    <div className="ustat-grid">
                        {[
                            { Icon: LuBriefcase, to: 12000, suffix: '+', label: 'Active Jobs' },
                            { Icon: LuBuilding2, to: 850, suffix: '+', label: 'Hiring Companies' },
                            { Icon: LuUsers, to: 50000, suffix: '+', label: 'Registered Candidates' },
                            { icon: 'ti-medall', to: 9500, suffix: '+', label: 'Successful Hires' },
                        ].map((s, i) => (
                            <motion.div
                                className="ustat-item"
                                key={s.label}
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true, margin: '-60px' }}
                                transition={{ duration: 0.45, delay: i * 0.1 }}
                            >
                                <div className="ustat-ico-wrap">
                                    {s.Icon ? (
                                        <s.Icon className="ustat-ico" aria-hidden="true" strokeWidth={2} />
                                    ) : (
                                        <i className={`ti ${s.icon} ustat-ico`} aria-hidden="true" />
                                    )}
                                </div>
                                <div className="ustat-num">
                                    <CountUp to={s.to} suffix={s.suffix} />
                                </div>
                                <div className="ustat-label">{s.label}</div>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section> */}
            {/* ================= Jobs Near You (geolocation) ========================= */}
            {nearbyJobs.length > 0 && (
                <section className="unear-section">
                    <style>{`
                        .unear-section { padding: 56px 0; background: #ffffff; }
                        .unear-wrap { max-width: 1200px; margin: 0 auto; padding: 0 16px; }
                        .unear-head { display: flex; align-items: center; gap: 10px; margin-bottom: 22px; flex-wrap: wrap; }
                        .unear-pin { width: 40px; height: 40px; border-radius: 12px; background: rgba(22,163,74,0.10); color: #16a34a; display: flex; align-items: center; justify-content: center; font-size: 18px; }
                        .unear-title { font-size: 26px; font-weight: 800; color: #0f172a; margin: 0; }
                        .unear-title span { color: #16a34a; }
                        .unear-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; }
                        .unear-card { background: #fff; border: 1px solid rgba(148,163,184,0.18); border-radius: 14px; padding: 16px; cursor: pointer; box-shadow: 0 6px 18px rgba(15,23,42,0.05); display: flex; flex-direction: column; gap: 10px; }
                        .unear-card-top { display: flex; align-items: center; gap: 10px; }
                        .unear-logo { width: 44px; height: 44px; border-radius: 10px; border: 1px solid rgba(148,163,184,0.18); object-fit: contain; background: #f8fafc; flex-shrink: 0; }
                        .unear-jt { font-size: 15px; font-weight: 700; color: #0f172a; margin: 0; line-height: 1.3; }
                        .unear-co { font-size: 13px; color: #64748b; margin: 2px 0 0; }
                        .unear-meta { display: flex; flex-direction: column; gap: 8px; font-size: 12.5px; color: #475569; }
                        .unear-meta i { color: #16a34a; margin-right: 6px; }
                        .unear-loc { display: flex; align-items: center; gap: 6px; color: #64748b; }
                        .unear-pay {
                            display: inline-flex; align-items: center; gap: 6px; align-self: flex-start;
                            background: rgba(22,163,74,0.08); color: #166534; font-weight: 700;
                            padding: 4px 9px; border-radius: 8px;
                        }
                        .unear-pay svg { width: 14px; height: 14px; flex-shrink: 0; color: #16a34a; }
                        .unear-chip { align-self: flex-start; background: rgba(22,163,74,0.10); color: #16a34a; font-size: 11px; font-weight: 700; padding: 4px 10px; border-radius: 999px; text-transform: capitalize; }
                        .unear-viewall { margin-top: 22px; text-align: center; }
                        .unear-viewall button { background: #16a34a; color: #fff; border: none; border-radius: 9px; padding: 11px 26px; font-size: 14px; font-weight: 700; cursor: pointer; }
                        @media (max-width: 991px) { .unear-grid { grid-template-columns: repeat(2, 1fr); } .unear-title { font-size: 22px; } }
                        @media (max-width: 575px) { .unear-grid { grid-template-columns: 1fr; } .unear-section { padding: 40px 0; } }
                    `}</style>
                    <div className="unear-wrap">
                        <motion.div
                            className="unear-head"
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true, margin: "-60px" }}
                            transition={{ duration: 0.45 }}
                        >
                            <span className="unear-pin"><i className="ti-location-pin" /></span>
                            <h2 className="unear-title">Jobs near you in <span>{detectedCity}</span></h2>
                        </motion.div>
                        <div className="unear-grid">
                            {nearbyJobs.slice(0, 8).map((job, i) => {
                                const id = job.id || job._id;
                                const title = job.jobTitle || job.title || 'Job Opening';
                                const co = job.companyName || job.company || 'Company';
                                const loc = [job.city, job.state].filter(Boolean).join(', ') || job.country || detectedCity;
                                const salary = job.salaryRange && job.salaryRange !== 'negotiable' ? job.salaryRange : 'Negotiable';
                                const jt = String(job.jobType || job.job_type || '').replace(/_/g, ' ');
                                const logoPath = job.companyLogoUrl || job.company_logo;
                                const logo = logoPath
                                    ? (String(logoPath).startsWith('http') ? logoPath : `${API_BASE_URL}${String(logoPath).startsWith('/') ? '' : '/'}${logoPath}`)
                                    : '/assets/img/company_logo_1.png';
                                return (
                                    <motion.div
                                        className="unear-card"
                                        key={id || i}
                                        onClick={() => navigate(`/jobs/${createSlug(title)}-${id}`)}
                                        initial={{ opacity: 0, y: 24 }}
                                        whileInView={{ opacity: 1, y: 0 }}
                                        viewport={{ once: true, margin: "-50px" }}
                                        transition={{ duration: 0.4, delay: (i % 4) * 0.08 }}
                                        whileHover={{ y: -5 }}
                                    >
                                        <div className="unear-card-top">
                                            <img className="unear-logo" src={logo} alt={co} onError={(e) => { e.currentTarget.src = '/assets/img/company_logo_1.png'; }} />
                                            <div style={{ minWidth: 0 }}>
                                                <h3 className="unear-jt">{title}</h3>
                                                <p className="unear-co">{co}</p>
                                            </div>
                                        </div>
                                        {jt && <span className="unear-chip">{jt}</span>}
                                        <div className="unear-meta">
                                            <span className="unear-loc"><i className="ti-location-pin" />{loc}</span>
                                            <span className="unear-pay"><FaRupeeSign aria-hidden="true" />{salary}</span>
                                        </div>
                                    </motion.div>
                                );
                            })}
                        </div>
                        <div className="unear-viewall">
                            <button type="button" onClick={() => navigate(`/jobs?city=${encodeURIComponent(detectedCity)}`)}>
                                View all jobs in {detectedCity}
                            </button>
                        </div>
                    </div>
                </section>
            )}
            {/* ================= Jobs Near You End ========================= */}
            {/* ================= How It Works Section ========================= */}
            {/* <section className="uhiw-section">
                <style>{`
                    .uhiw-section { padding: 64px 0; background: linear-gradient(180deg, #f7fbf8 0%, #ffffff 100%); }
                    .uhiw-head { text-align: center; max-width: 640px; margin: 0 auto 44px; padding: 0 16px; }
                    .uhiw-badge {
                        display: inline-block; background: rgba(22,163,74,0.10); color: #16a34a;
                        font-size: 13px; font-weight: 700; letter-spacing: .4px; text-transform: uppercase;
                        padding: 6px 14px; border-radius: 999px; margin-bottom: 14px;
                    }
                    .uhiw-title { font-size: 36px; font-weight: 800; color: #0f172a; margin: 0 0 12px; line-height: 1.15; }
                    .uhiw-sub { font-size: 16px; color: #64748b; margin: 0; line-height: 1.6; }
                    .uhiw-grid {
                        max-width: 1140px; margin: 0 auto; padding: 0 16px;
                        display: grid; grid-template-columns: repeat(4, 1fr); gap: 22px;
                    }
                    .uhiw-card {
                        position: relative; background: #fff; border: 1px solid rgba(148,163,184,0.18);
                        border-radius: 16px; padding: 28px 22px; text-align: center;
                        box-shadow: 0 6px 20px rgba(15,23,42,0.05);
                        transition: transform .25s ease, box-shadow .25s ease, border-color .25s ease;
                    }
                    .uhiw-card:hover {
                        border-color: rgba(22,163,74,0.5);
                        box-shadow: 0 16px 34px rgba(22,163,74,0.14);
                    }
                    .uhiw-step {
                        position: absolute; top: 16px; right: 18px; font-size: 30px; font-weight: 800;
                        color: rgba(22,163,74,0.12); line-height: 1;
                    }
                    .uhiw-icon {
                        width: 64px; height: 64px; margin: 0 auto 18px; border-radius: 16px;
                        display: flex; align-items: center; justify-content: center; font-size: 26px; color: #fff;
                        background: linear-gradient(135deg, #16a34a 0%, #22c55e 100%);
                        box-shadow: 0 8px 18px rgba(22,163,74,0.30);
                    }
                    .uhiw-card h4 { font-size: 18px; font-weight: 700; color: #0f172a; margin: 0 0 8px; }
                    .uhiw-card p { font-size: 14px; color: #64748b; margin: 0; line-height: 1.6; }
                    @media (max-width: 991px) { .uhiw-grid { grid-template-columns: repeat(2, 1fr); } .uhiw-title { font-size: 30px; } }
                    @media (max-width: 575px) { .uhiw-grid { grid-template-columns: 1fr; } .uhiw-section { padding: 48px 0; } .uhiw-title { font-size: 26px; } }
                `}</style>
                <motion.div
                    className="uhiw-head"
                    initial={{ opacity: 0, y: 24 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: "-80px" }}
                    transition={{ duration: 0.5 }}
                >
                    
                    <h2 className="uhiw-title">Land Your Dream Job in 4 Simple Steps</h2>
                    <p className="uhiw-sub">From building your profile to getting hired — Uptula makes your job search fast, smart, and effortless.</p>
                </motion.div>
                <div className="uhiw-grid">
                    {[
                        { icon: 'ti-user', step: '01', title: 'Create Your Profile', desc: 'Sign up and build a standout profile that recruiters love.' },
                        { icon: 'ti-search', step: '02', title: 'Search Smart', desc: 'Filter thousands of jobs by role, location, salary and more.' },
                        { icon: 'ti-bolt', step: '03', title: 'Apply in 1 Click', desc: 'Apply instantly and track every application in one place.' },
                        { icon: 'ti-medall', step: '04', title: 'Get Hired', desc: 'Connect with top companies and accelerate your career.' },
                    ].map((s, i) => (
                        <motion.div
                            className="uhiw-card"
                            key={s.step}
                            initial={{ opacity: 0, y: 30 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true, margin: "-60px" }}
                            transition={{ duration: 0.45, delay: i * 0.1 }}
                            whileHover={{ y: -6 }}
                        >
                            <span className="uhiw-step">{s.step}</span>
                            <div className="uhiw-icon"><i className={s.icon} aria-hidden="true" /></div>
                            <h4>{s.title}</h4>
                            <p>{s.desc}</p>
                        </motion.div>
                    ))}
                </div>
            </section> */}
            <section className="uhiw-section">
                <div className="uhiw-deco-dots uhiw-deco-dots--br" aria-hidden="true" />
                <style>{`
        .uhiw-section {
            padding: 72px 0 80px;
            background: linear-gradient(160deg, #f0faf4 0%, #e8f5ee 40%, #f4faf6 100%);
            position: relative;
            overflow: hidden;
        }
        .uhiw-deco-dots {
            position: absolute;
            width: 110px;
            height: 110px;
            background-image: radial-gradient(circle, #a7d9b8 1.2px, transparent 1.2px);
            background-size: 14px 14px;
            pointer-events: none;
            opacity: .7;
        }
        .uhiw-deco-dots--br {
            bottom: 24px;
            right: 24px;
        }
        /* dot grid top-left */
        .uhiw-section::before {
            content: '';
            position: absolute;
            top: 24px; left: 24px;
            width: 110px; height: 110px;
            background-image: radial-gradient(circle, #a7d9b8 1.2px, transparent 1.2px);
            background-size: 14px 14px;
            pointer-events: none; opacity: .7;
        }
        /* blob bottom-left */
        .uhiw-section::after {
            content: '';
            position: absolute;
            bottom: -80px; left: -80px;
            width: 280px; height: 280px;
            border-radius: 50%;
            background: rgba(134,210,168,0.18);
            pointer-events: none;
        }
        .uhiw-inner {
            width: min(1360px, 92vw);
            margin: 0 auto;
            padding: 0 24px;
            position: relative;
            z-index: 1;
        }
        .uhiw-head {
            text-align: center;
            max-width: 900px;
            margin: 0 auto 64px;
            padding: 0 8px;
            position: relative;
        }
        .uhiw-badge-row {
            display: flex; align-items: center; justify-content: center;
            gap: 12px; margin-bottom: 18px;
        }
        .uhiw-badge-line { flex: 0 0 38px; height: 2px; background: #16a34a; border-radius: 2px; }
        .uhiw-badge-text {
            font-size: 12px; font-weight: 700; letter-spacing: 2px;
            text-transform: uppercase; color: #16a34a;
        }
        .uhiw-title {
            font-size: 42px; font-weight: 800; color: #0f172a;
            margin: 0 0 16px; line-height: 1.15;
        }
        .uhiw-sub {
            font-size: 17px; color: #64748b; margin: 0; line-height: 1.7;
        }
        .uhiw-steps-wrap {
            position: relative;
            width: 100%;
        }
        /* continuous connector through icon centers */
        .uhiw-steps-wrap::before {
            content: '';
            position: absolute;
            top: 98px;
            left: 12.5%;
            right: 12.5%;
            height: 2px;
            background: #c5e6cc;
            z-index: 0;
        }
        .uhiw-steps-row {
            width: 100%;
            display: grid;
            grid-template-columns: repeat(4, minmax(0, 1fr));
            align-items: start;
            position: relative;
            gap: 0;
        }
        .uhiw-step-col {
            display: flex;
            flex-direction: column;
            align-items: center;
            text-align: center;
            position: relative;
            padding: 0 12px;
        }
        /* green dot between steps */
        .uhiw-step-col:not(:last-child)::after {
            content: '';
            position: absolute;
            top: 93px;
            right: 0;
            transform: translateX(50%);
            width: 11px;
            height: 11px;
            border-radius: 50%;
            background: #16a34a;
            z-index: 2;
        }
        .uhiw-step-num {
            font-size: 34px;
            font-weight: 700;
            color: #7bc99a;
            line-height: 1;
            margin-bottom: 12px;
            letter-spacing: -1px;
        }
        .uhiw-circle {
            width: 112px;
            height: 112px;
            border-radius: 50%;
            background: #fff;
            border: 2px solid #e8f2ec;
            display: flex;
            align-items: center;
            justify-content: center;
            position: relative;
            z-index: 1;
            box-shadow: 0 4px 20px rgba(22, 163, 74, 0.1);
        }
        .uhiw-circle::after {
            content: '';
            position: absolute;
            inset: -4px;
            border-radius: 50%;
            border: 3px solid transparent;
            border-top-color: #16a34a;
            border-right-color: #16a34a;
            border-bottom-color: #16a34a;
            transform: rotate(24deg);
        }
        .uhiw-ico {
            font-size: 32px;
            color: #16a34a;
            position: relative;
            z-index: 1;
        }
        .uhiw-card-title {
            margin-top: 24px;
            font-size: 17px;
            font-weight: 700;
            color: #0f172a;
            margin-bottom: 10px;
        }
        .uhiw-card-desc {
            font-size: 14px;
            color: #64748b;
            line-height: 1.65;
            max-width: 280px;
            margin: 0 auto;
        }
        @media (max-width: 991px) {
            .uhiw-inner { width: min(100%, 96vw); }
            .uhiw-steps-row { grid-template-columns: repeat(2, 1fr); gap: 48px 0; }
            .uhiw-steps-wrap::before { display: none; }
            .uhiw-step-col:not(:last-child)::after { display: none; }
            .uhiw-title { font-size: 32px; }
            .uhiw-card-desc { max-width: 320px; }
        }
        @media (max-width: 575px) {
            .uhiw-steps-row { grid-template-columns: 1fr; gap: 40px; }
            .uhiw-section { padding: 52px 0 60px; }
            .uhiw-title { font-size: 28px; }
            .uhiw-head { margin-bottom: 48px; }
        }
    `}</style>

                <div className="uhiw-inner">
                    <motion.div
                        className="uhiw-head"
                        initial={{ opacity: 0, y: 24 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true, margin: '-80px' }}
                        transition={{ duration: 0.5 }}
                    >
                        <div className="uhiw-badge-row">
                            <span className="uhiw-badge-line" />
                            <span className="uhiw-badge-text">4 Easy Steps</span>
                            <span className="uhiw-badge-line" />
                        </div>
                        <h2 className="uhiw-title">Land Your Dream Job in 4 Simple Steps</h2>
                        <p className="uhiw-sub">From building your profile to getting hired – Uptula makes your job search fast, smart, and effortless.</p>
                    </motion.div>

                    <div className="uhiw-steps-wrap">
                        <div className="uhiw-steps-row">
                            {[
                                { Icon: LuUser, step: '01', title: 'Create Your Profile', desc: 'Sign up and build a standout profile that recruiters love.' },
                                { Icon: LuSearch, step: '02', title: 'Search Smart', desc: 'Filter thousands of jobs by role, location, salary and more.' },
                                { Icon: LuZap, step: '03', title: 'Apply in 1 Click', desc: 'Apply instantly and track every application in one place.' },
                                { icon: 'ti-medall', step: '04', title: 'Get Hired', desc: 'Connect with top companies and accelerate your career.' },
                            ].map((s, i) => (
                                <motion.div
                                    className="uhiw-step-col"
                                    key={s.step}
                                    initial={{ opacity: 0, y: 30 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    viewport={{ once: true, margin: '-60px' }}
                                    transition={{ duration: 0.45, delay: i * 0.12 }}
                                >
                                    <div className="uhiw-step-num">{s.step}</div>
                                    <div className="uhiw-circle">
                                        {s.Icon ? (
                                            <s.Icon className="uhiw-ico" aria-hidden="true" strokeWidth={2} />
                                        ) : (
                                            <i className={`ti ${s.icon} uhiw-ico`} aria-hidden="true" />
                                        )}
                                    </div>
                                    <div className="uhiw-card-title">{s.title}</div>
                                    <p className="uhiw-card-desc">{s.desc}</p>
                                </motion.div>
                            ))}
                        </div>
                    </div>
                </div>
            </section>
            {/* ================= How It Works Section End ========================= */}


            {/* ================= Animated Stats Section End ========================= */}



          

            {/* ================= Explore Jobs by Category (icons + infographic) ========================= */}
            {/* {(allCategories && allCategories.length > 0) && (
                <section className="ucat-section">
                    <style>{`
                        .ucat-section { padding: 64px 0; background: #ffffff; position: relative; }
                        .ucat-wrap { max-width: 1200px; margin: 0 auto; padding: 0 16px; }
                        .ucat-head { text-align: center; max-width: 640px; margin: 0 auto 16px; }
                        .ucat-badge { display:inline-block; background: rgba(22,163,74,0.10); color:#16a34a; font-size:13px; font-weight:700; letter-spacing:.4px; text-transform:uppercase; padding:6px 14px; border-radius:999px; margin-bottom:12px; }
                        .ucat-head h2 { font-size:34px; font-weight:800; color:#0f172a; margin:0 0 10px; }
                        .ucat-head p { font-size:15px; color:#64748b; margin:0; }
                        
                        .ucat-info { display:flex; justify-content:center; gap:14px; flex-wrap:wrap; margin:26px 0 34px; }
                        .ucat-info-tile { display:flex; align-items:center; gap:12px; background:linear-gradient(135deg,#16a34a,#15803d); color:#fff; border-radius:14px; padding:16px 22px; box-shadow:0 10px 24px rgba(22,163,74,0.22); }
                        .ucat-info-tile i { font-size:24px; opacity:.92; }
                        .ucat-info-num { font-size:26px; font-weight:900; line-height:1; }
                        .ucat-info-lbl { font-size:12.5px; opacity:.9; }
                        .ucat-grid { display:grid; grid-template-columns:repeat(4,1fr); gap:18px; }
                        .ucat-card { background:#fff; border:1px solid rgba(148,163,184,0.18); border-radius:16px; padding:22px 18px; text-align:center; cursor:pointer; box-shadow:0 6px 18px rgba(15,23,42,0.05); }
                        .ucat-ico { width:60px; height:60px; margin:0 auto 14px; border-radius:16px; display:flex; align-items:center; justify-content:center; font-size:26px; color:#16a34a; background:rgba(22,163,74,0.10); transition: all .25s ease; }
                        .ucat-card:hover .ucat-ico { background:linear-gradient(135deg,#16a34a,#22c55e); color:#fff; transform: rotate(-6deg) scale(1.06); }
                        .ucat-card h4 { font-size:15.5px; font-weight:700; color:#0f172a; margin:0 0 6px; line-height:1.3; }
                        .ucat-card span { font-size:13px; color:#16a34a; font-weight:700; }
                        .ucat-more { text-align:center; margin-top:30px; }
                        .ucat-more button { background:#16a34a; color:#fff; border:none; border-radius:9px; padding:12px 28px; font-size:14px; font-weight:700; cursor:pointer; }
                        @media (max-width:991px){ .ucat-grid{ grid-template-columns:repeat(2,1fr);} .ucat-head h2{ font-size:28px;} }
                        @media (max-width:575px){ .ucat-grid{ grid-template-columns:repeat(2,1fr); gap:12px;} .ucat-section{ padding:46px 0;} .ucat-head h2{ font-size:24px;} .ucat-info-tile{ padding:12px 16px;} }
                    `}</style>
                    <div className="ucat-wrap">
                        <motion.div className="ucat-head" initial={{ opacity: 0, y: 22 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-70px" }} transition={{ duration: 0.5 }}>
                            <span className="ucat-badge">Explore by Category</span>
                            <h2>Find Jobs in Every Field</h2>
                            <p>Browse opportunities across all industries — pick a category to see open roles.</p>
                        </motion.div>

                        
                        <motion.div className="ucat-info" initial={{ opacity: 0, y: 18 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5, delay: 0.1 }}>
                            <div className="ucat-info-tile">
                                <i className="ti-layers" />
                                <div>
                                    <div className="ucat-info-num"><CountUp to={allCategories.length} suffix="+" /></div>
                                    <div className="ucat-info-lbl">Categories</div>
                                </div>
                            </div>
                            <div className="ucat-info-tile">
                                <i className="ti-briefcase" />
                                <div>
                                    <div className="ucat-info-num"><CountUp to={allCategories.reduce((s, c) => s + (Number(c.job_count) || 0), 0)} suffix="+" /></div>
                                    <div className="ucat-info-lbl">Open Positions</div>
                                </div>
                            </div>
                        </motion.div>

                        <div className="ucat-grid">
                            {allCategories.slice(0, showAllCategories ? allCategories.length : 12).map((c, i) => (
                                <motion.div
                                    className="ucat-card"
                                    key={c.category || i}
                                    onClick={() => navigate(`/jobs?category=${encodeURIComponent(c.category)}`)}
                                    initial={{ opacity: 0, y: 26 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    viewport={{ once: true, margin: "-40px" }}
                                    transition={{ duration: 0.4, delay: (i % 4) * 0.07 }}
                                    whileHover={{ y: -6 }}
                                >
                                    <div className="ucat-ico"><i className={getCategoryIcon(c.category)} aria-hidden="true" /></div>
                                    <h4>{formatCategoryName(c.category)}</h4>
                                    <span>{Number(c.job_count) || 0} {Number(c.job_count) === 1 ? 'job' : 'jobs'}</span>
                                </motion.div>
                            ))}
                        </div>

                        {allCategories.length > 12 && (
                            <div className="ucat-more">
                                <button type="button" onClick={() => setShowAllCategories((v) => !v)}>
                                    {showAllCategories ? 'Show less' : `View all ${allCategories.length} categories`}
                                </button>
                            </div>
                        )}
                    </div>
                </section>
            )} */}
            {/* ================= Explore Jobs by Category End ========================= */}

            {/* ================= Jobs Section ========================= */}
            <section className="padd-top-80 padd-bot-10">
                <div className="container">
                    <div className="row">
                        {/* Job Cards - Full Width */}
                        <div className="col-md-12">
                            <ul className="nav nav-tabs nav-advance theme-bg" role="tablist" style={{ marginBottom: '20px' }}>
                                <li className="nav-item active">
                                    <a className="nav-link" data-toggle="tab" href="#recent" role="tab">
                                        Latest Jobs
                                    </a>
                                </li>
                                <li className="nav-item">
                                    <a className="nav-link" data-toggle="tab" href="#featured" role="tab">
                                        Featured Jobs
                                    </a>
                                </li>
                            </ul>
                            <div className="tab-content">
                                <div
                                    className="tab-pane fade in show active"
                                    id="recent"
                                    role="tabpanel"
                                >
                                    <div className="row">
                                        {loading ? (
                                            <div className="col-12 text-center">
                                                <div className="spinner-border" role="status">
                                                    <span className="sr-only">Loading...</span>
                                                </div>
                                                <p>Loading latest jobs...</p>
                                            </div>
                                        ) : latestJobs.length > 0 ? (
                                            latestJobs.map((job) => <JobCard key={job.id} job={job} />)
                                        ) : (
                                            <div className="col-12 text-center">
                                                <p>No jobs available at the moment.</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                                <div className="tab-pane fade" id="featured" role="tabpanel">
                                    <div className="row">
                                        {loading ? (
                                            <div className="col-12 text-center">
                                                <div className="spinner-border" role="status">
                                                    <span className="sr-only">Loading...</span>
                                                </div>
                                                <p>Loading featured jobs...</p>
                                            </div>
                                        ) : featuredJobs.length > 0 ? (
                                            featuredJobs.map((job) => <JobCard key={job.id} job={job} />)
                                        ) : (
                                            <div className="col-12 text-center">
                                                <p>No featured jobs available at the moment.</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                            <div className="col-md-12 mrg-top-20 text-center">
                                <Link to="/jobs" className="btn theme-btn btn-m">
                                    Browse All Jobs
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>
            </section>
            {/* ================= Jobs Section End ========================= */}
  {/* ================= Discover Jobs by Popular Roles ========================= */}
  <section className="urole-section">
                <style>{`
                    .urole-section { padding: 60px 0; background: linear-gradient(180deg, #ffffff 0%, #f7fbf8 100%); }
                    .urole-wrap { max-width: 1100px; margin: 0 auto; padding: 0 16px; text-align: center; }
                    .urole-wrap h2 { font-size: 32px; font-weight: 800; color: #0f172a; margin: 0 0 8px; }
                    .urole-wrap p { font-size: 15px; color: #64748b; margin: 0 0 30px; }
                    .urole-grid { display: flex; flex-wrap: wrap; justify-content: center; gap: 12px; }
                    .urole-chip {
                        display: inline-flex; align-items: center; gap: 8px;
                        background: #fff; border: 1px solid rgba(148,163,184,0.22);
                        border-radius: 999px; padding: 11px 20px; font-size: 14px; font-weight: 600;
                        color: #334155; cursor: pointer; transition: all .2s ease;
                    }
                    .urole-chip i { color: #16a34a; }
                    .urole-chip:hover { background: #16a34a; color: #fff; border-color: #16a34a; box-shadow: 0 10px 22px rgba(22,163,74,0.22); }
                    .urole-chip:hover i { color: #fff; }
                    @media (max-width: 575px) { .urole-wrap h2 { font-size: 25px; } .urole-section { padding: 44px 0; } }
                `}</style>
                <div className="urole-wrap">
                    <motion.h2 initial={{ opacity: 0, y: 18 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-60px" }} transition={{ duration: 0.45 }}>
                    Find Your Ideal Career Path
                    </motion.h2>
                    <motion.p initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} transition={{ duration: 0.5, delay: 0.1 }}>
                        Explore opportunities tailored to the most in-demand career paths.
                    </motion.p>
                    <div className="urole-grid">
                        {[
                            { icon: 'ti-desktop', label: 'Software Developer' },
                            { icon: 'ti-bar-chart', label: 'Data Analyst' },
                            { icon: 'ti-announcement', label: 'Digital Marketing' },
                            { icon: 'ti-shopping-cart', label: 'Sales' },
                            { icon: 'ti-pencil-alt', label: 'Designer' },
                            { icon: 'ti-user', label: 'Human Resources' },
                            { icon: 'ti-headphone-alt', label: 'Customer Support' },
                            { icon: 'ti-wallet', label: 'Accountant' },
                            { icon: 'ti-ruler-pencil', label: 'Civil Engineer' },
                            { icon: 'ti-book', label: 'Teacher' },
                            { icon: 'ti-heart', label: 'Nurse' },
                            { icon: 'ti-truck', label: 'Driver' },
                        ].map((r, i) => (
                            <motion.button
                                type="button"
                                key={r.label}
                                className="urole-chip"
                                onClick={() => navigate(`/jobs?q=${encodeURIComponent(r.label)}`)}
                                initial={{ opacity: 0, scale: 0.85 }}
                                whileInView={{ opacity: 1, scale: 1 }}
                                viewport={{ once: true, margin: "-40px" }}
                                transition={{ duration: 0.3, delay: i * 0.04 }}
                                whileHover={{ y: -3 }}
                            >
                                <i className={r.icon} aria-hidden="true" />
                                {r.label}
                            </motion.button>
                        ))}
                    </div>
                </div>
            </section>
            {/* ================= Discover Jobs by Popular Roles End ========================= */}
            {/* ================= All Job Categories Section ========================= */}
            <section className="padd-top-20 padd-bot-80" style={{ background: 'linear-gradient(180deg, #ffffff 0%, #f9fafb 100%)' }}>
                <div className="container">
                    {/* Section Heading - Centered */}
                    <div style={{ textAlign: 'center', marginBottom: '25px' }}>
                        <h2 style={{
                            fontSize: '32px',
                            fontWeight: '700',
                            color: '#2c3e50',
                            marginBottom: '8px',
                            letterSpacing: '-0.5px'
                        }}>
                           Explore Jobs by Category
                        </h2>
                        <p style={{
                            fontSize: '15px',
                            color: '#707f8c',
                            margin: 0
                        }}>
                            Explore opportunities across different fields
                        </p>
                    </div>

                    {/* Categories Scroll Container */}
                    <div style={{ position: 'relative' }}>
                        <div
                            ref={scrollContainerRef}
                            style={{
                                display: 'flex',
                                overflowX: shouldInfiniteScrollCategories ? 'auto' : 'hidden',
                                overflowY: 'hidden',
                                gap: '18px',
                                padding: '20px 5px 20px 5px',
                                scrollbarWidth: 'none',
                                msOverflowStyle: 'none',
                                scrollBehavior: 'auto'
                            }}
                            className="categories-scroll-container"
                        >
                            {visibleCategories.length > 0 ? (
                                <>
                                    {categoryCards.map((category, idx) => (
                                        <div
                                            key={`${category.category || 'cat'}-${idx}`}
                                            style={{
                                                minWidth: '280px',
                                                width: '280px',
                                                height: '110px',
                                                background: '#ffffff',
                                                border: '2px solid #e8e8e8',
                                                borderRadius: '14px',
                                                padding: '16px',
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '16px',
                                                transition: 'transform 0.3s ease, border-color 0.3s ease, box-shadow 0.3s ease',
                                                cursor: 'pointer',
                                                flexShrink: 0,
                                                boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
                                                transformOrigin: 'center center'
                                            }}
                                            onClick={() => {
                                                trackSearch(category.category);
                                                navigate(`/jobs?category=${encodeURIComponent(category.category)}`);
                                            }}
                                            onMouseEnter={(e) => {
                                                isScrollingPausedRef.current = true;
                                                e.currentTarget.style.transform = 'translateY(-6px) scale(1.05)';
                                                e.currentTarget.style.borderColor = '#26AE61';
                                                e.currentTarget.style.boxShadow = '0 10px 28px rgba(38, 174, 97, 0.15)';
                                            }}
                                            onMouseLeave={(e) => {
                                                isScrollingPausedRef.current = false;
                                                e.currentTarget.style.transform = 'translateY(0) scale(1)';
                                                e.currentTarget.style.borderColor = '#e8e8e8';
                                                e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.04)';
                                            }}
                                        >
                                            {/* Category Image */}
                                            <div style={{
                                                width: '70px',
                                                height: '70px',
                                                borderRadius: '12px',
                                                background: 'linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%)',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                flexShrink: 0,
                                                padding: '12px',
                                                border: '1px solid #e0f2fe'
                                            }}>
                                                <img
                                                    src={getCategoryImage(category.category)}
                                                    alt={formatCategoryName(category.category)}
                                                    style={{
                                                        width: '100%',
                                                        height: '100%',
                                                        objectFit: 'contain'
                                                    }}
                                                    onError={(e) => {
                                                        e.target.src = '/assets/img/motherboard.png';
                                                    }}
                                                />
                                            </div>

                                            {/* Category Info */}
                                            <div style={{
                                                flex: 1,
                                                minWidth: 0,
                                                display: 'flex',
                                                flexDirection: 'column',
                                                justifyContent: 'center',
                                                gap: '6px'
                                            }}>
                                                <h4 style={{
                                                    margin: 0,
                                                    fontSize: '16px',
                                                    fontWeight: '700',
                                                    color: '#2c3e50',
                                                    lineHeight: '1.3',
                                                    display: '-webkit-box',
                                                    WebkitLineClamp: 2,
                                                    WebkitBoxOrient: 'vertical',
                                                    overflow: 'hidden',
                                                    textOverflow: 'ellipsis'
                                                }}>
                                                    {formatCategoryName(category.category)}
                                                </h4>
                                                <div style={{
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: '8px'
                                                }}>
                                                    <span style={{
                                                        fontSize: '13px',
                                                        fontWeight: '600',
                                                        color: '#26AE61',
                                                        background: '#E8F5E9',
                                                        padding: '3px 10px',
                                                        borderRadius: '16px'
                                                    }}>
                                                        {category.job_count || category.count || 0} {((category.job_count || category.count || 0) === 1) ? 'Job' : 'Jobs'}
                                                    </span>
                                                </div>
                                            </div>

                                            {/* Arrow Icon */}
                                            <div style={{
                                                width: '32px',
                                                height: '32px',
                                                borderRadius: '8px',
                                                background: 'linear-gradient(135deg, #26AE61 0%, #1e8d4d 100%)',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                flexShrink: 0,
                                                transition: 'all 0.3s ease'
                                            }}>
                                                <FaChevronRight style={{ color: '#ffffff', fontSize: '14px' }} />
                                            </div>
                                        </div>
                                    ))}
                                </>
                            ) : (
                                <div style={{
                                    textAlign: 'center',
                                    padding: '60px 40px',
                                    width: '100%',
                                    background: '#ffffff',
                                    borderRadius: '16px',
                                    border: '2px dashed #e8e8e8'
                                }}>
                                    <i className="ti-briefcase" style={{
                                        fontSize: '60px',
                                        color: '#e8e8e8',
                                        marginBottom: '15px',
                                        display: 'block'
                                    }} />
                                    <p style={{
                                        color: '#707f8c',
                                        fontSize: '16px',
                                        margin: 0
                                    }}>
                                        No categories available
                                    </p>
                                </div>
                            )}
                        </div>

                        {/* Load More Button - Below Cards */}
                        {categories.length > 0 && !showAllCategories && allCategories.length > categories.length && (
                            <div style={{ marginTop: '25px', textAlign: 'center' }}>
                                <button
                                    className="btn theme-btn btn-m"
                                    onClick={() => setShowAllCategories(true)}
                                    style={{
                                        padding: '12px 35px',
                                        fontSize: '14px',
                                        fontWeight: '600',
                                        borderRadius: '8px',
                                        boxShadow: '0 4px 12px rgba(38, 174, 97, 0.2)',
                                        transition: 'all 0.3s ease'
                                    }}
                                >
                                    Load More Categories
                                </button>
                            </div>
                        )}
                    </div>

                    <style>{`
                        .categories-scroll-container::-webkit-scrollbar {
                            display: none;
                        }
                        .categories-scroll-container {
                            -ms-overflow-style: none;
                            scrollbar-width: none;
                        }
                    `}</style>
                </div>
            </section>
            {/* ================= All Job Categories Section End ========================= */}

            {/* ================= Trending Jobs Section ========================= */}
            <section className="padd-top-20 padd-bot-80 home-trending-wrap" style={{ background: '#ffffff' }}>
                <div className="container">
                    {/* Section Heading */}
                    <div style={{ textAlign: 'center', marginBottom: '40px' }}>
                        <h2 style={{
                            fontSize: '32px',
                            fontWeight: '700',
                            color: '#2c3e50',
                            marginBottom: '8px',
                            letterSpacing: '-0.5px'
                        }}>
                            Trending Career Opportunities
                        </h2>
                    </div>

                    {/* Trending Jobs Grid */}
                    <div className="row" style={{ justifyContent: 'center', margin: '0 -10px' }}>
                        {/* First Row - 6 boxes */}
                        {trendingJobs.slice(0, 6).map((job, idx) => (
                            <div key={idx} className="col-md-2 col-sm-4 col-xs-6" style={{ padding: '0 10px', marginBottom: '15px' }}>
                                <div
                                    onClick={() => {
                                        trackSearch(job.searchTerm);
                                        navigate(`/jobs?q=${encodeURIComponent(job.searchTerm)}`);
                                    }}
                                    className="home-trending-card"
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '12px',
                                        padding: '14px 16px',
                                        background: '#ffffff',
                                        border: '1px solid #e0e0e0',
                                        borderRadius: '8px',
                                        cursor: 'pointer',
                                        transition: 'all 0.3s ease',
                                        height: '100%',
                                        minHeight: '56px'
                                    }}
                                    onMouseEnter={(e) => {
                                        e.currentTarget.style.borderColor = '#26AE61';
                                        e.currentTarget.style.boxShadow = '0 4px 12px rgba(38, 174, 97, 0.15)';
                                        e.currentTarget.style.transform = 'translateY(-2px)';
                                    }}
                                    onMouseLeave={(e) => {
                                        e.currentTarget.style.borderColor = '#e0e0e0';
                                        e.currentTarget.style.boxShadow = 'none';
                                        e.currentTarget.style.transform = 'translateY(0)';
                                    }}
                                >
                                    {/* Icon */}
                                    <div style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        flexShrink: 0,
                                        width: '24px',
                                        minWidth: '24px'
                                    }}>
                                        <i className={`ti ${getTrendingJobIcon(job.title)}`} style={{
                                            fontSize: '20px',
                                            color: '#334e6f',
                                            display: 'block'
                                        }}></i>
                                    </div>
                                    {/* Text */}
                                    <div style={{
                                        flex: 1,
                                        minWidth: 0
                                    }}>
                                        <span style={{
                                            fontSize: '14px',
                                            fontWeight: '600',
                                            color: '#334e6f',
                                            whiteSpace: 'nowrap',
                                            overflow: 'hidden',
                                            textOverflow: 'ellipsis',
                                            display: 'block',
                                            lineHeight: '1.4'
                                        }}>
                                            {job.title}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Second Row - 5 boxes (centered) */}
                    <div className="row" style={{ justifyContent: 'center', margin: '15px -10px 0 -10px', display: 'flex', flexWrap: 'wrap' }}>
                        <div className="col-md-1 col-sm-0 col-xs-0 second-row-spacer" style={{ padding: 0 }}></div>
                        {trendingJobs.slice(6, 11).map((job, idx) => (
                            <div key={idx + 6} className="col-md-2 col-sm-4 col-xs-6" style={{ padding: '0 10px', marginBottom: '15px' }}>
                                <div
                                    onClick={() => {
                                        trackSearch(job.searchTerm);
                                        navigate(`/jobs?q=${encodeURIComponent(job.searchTerm)}`);
                                    }}
                                    className="home-trending-card"
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '12px',
                                        padding: '14px 16px',
                                        background: '#ffffff',
                                        border: '1px solid #e0e0e0',
                                        borderRadius: '8px',
                                        cursor: 'pointer',
                                        transition: 'all 0.3s ease',
                                        height: '100%',
                                        minHeight: '56px'
                                    }}
                                    onMouseEnter={(e) => {
                                        e.currentTarget.style.borderColor = '#26AE61';
                                        e.currentTarget.style.boxShadow = '0 4px 12px rgba(38, 174, 97, 0.15)';
                                        e.currentTarget.style.transform = 'translateY(-2px)';
                                    }}
                                    onMouseLeave={(e) => {
                                        e.currentTarget.style.borderColor = '#e0e0e0';
                                        e.currentTarget.style.boxShadow = 'none';
                                        e.currentTarget.style.transform = 'translateY(0)';
                                    }}
                                >
                                    {/* Icon */}
                                    <div style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        flexShrink: 0,
                                        width: '24px',
                                        minWidth: '24px'
                                    }}>
                                        <i className={`ti ${getTrendingJobIcon(job.title)}`} style={{
                                            fontSize: '20px',
                                            color: '#334e6f',
                                            display: 'block'
                                        }}></i>
                                    </div>
                                    {/* Text */}
                                    <div style={{
                                        flex: 1,
                                        minWidth: 0
                                    }}>
                                        <span style={{
                                            fontSize: '14px',
                                            fontWeight: '600',
                                            color: '#334e6f',
                                            whiteSpace: 'nowrap',
                                            overflow: 'hidden',
                                            textOverflow: 'ellipsis',
                                            display: 'block',
                                            lineHeight: '1.4'
                                        }}>
                                            {job.title}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        ))}
                        <div className="col-md-1 col-sm-0 col-xs-0 second-row-spacer" style={{ padding: 0 }}></div>
                    </div>
                    <style>{`
                        @media (max-width: 768px) {
                            .home-trending-wrap .second-row-spacer {
                                display: none !important;
                            }
                            .home-trending-wrap .row {
                                flex-wrap: wrap !important;
                            }
                        }
                    `}</style>
                </div>
            </section>
            {/* ================= Trending Jobs Section End ========================= */}

            {/* ================= Your Dream Company Is Hiring Section ========================= */}
            {companies.length > 0 && (
                <section className="padd-top-10 padd-bot-10 dream-companies" style={{ background: '#f8f9fa', paddingTop: '40px', paddingBottom: '40px' }}>
                    <div className="container">
                        {/* Section Heading */}
                        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
                            <h2 style={{
                                fontSize: '32px',
                                fontWeight: '700',
                                color: '#2c3e50',
                                marginTop: 0,
                                marginBottom: '8px',
                                letterSpacing: '-0.5px'
                            }}>
                                Companies Hiring Now
                            </h2>
                            <p style={{
                                fontSize: '15px',
                                color: '#707f8c',
                                margin: 0
                            }}>
                                Discover your next career move, freelance gig, or internship
                            </p>
                        </div>

                        {/* Companies Grid Container */}
                        <div className="companies-carousel-wrap" style={{ position: 'relative', padding: '0 60px' }}>
                            {/* Left Navigation Arrow */}
                            <button
                                onClick={() => scrollCompanies('left')}
                                style={{
                                    position: 'absolute',
                                    left: '0',
                                    top: '50%',
                                    transform: 'translateY(-50%)',
                                    width: '45px',
                                    height: '45px',
                                    borderRadius: '50%',
                                    border: '2px solid #26AE61',
                                    background: '#ffffff',
                                    color: '#26AE61',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    cursor: 'pointer',
                                    transition: 'all 0.3s ease',
                                    fontSize: '22px',
                                    fontWeight: 'bold',
                                    zIndex: 10,

                                }}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.background = '#26AE61';
                                    e.currentTarget.style.color = '#ffffff';
                                    e.currentTarget.style.transform = 'translateY(-50%) scale(1.1)';
                                    e.currentTarget.style.boxShadow = '0 4px 12px rgba(38, 174, 97, 0.3)';
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.background = '#ffffff';
                                    e.currentTarget.style.color = '#26AE61';
                                    e.currentTarget.style.transform = 'translateY(-50%) scale(1)';
                                    e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.1)';
                                }}
                            >
                                ‹
                            </button>

                            {/* Right Navigation Arrow */}
                            <button
                                onClick={() => scrollCompanies('right')}
                                style={{
                                    position: 'absolute',
                                    right: '0',
                                    top: '50%',
                                    transform: 'translateY(-50%)',
                                    width: '45px',
                                    height: '45px',
                                    borderRadius: '50%',
                                    border: '2px solid #26AE61',
                                    background: '#ffffff',
                                    color: '#26AE61',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    cursor: 'pointer',
                                    transition: 'all 0.3s ease',
                                    fontSize: '22px',
                                    fontWeight: 'bold',
                                    zIndex: 10,
                                    boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                                }}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.background = '#26AE61';
                                    e.currentTarget.style.color = '#ffffff';
                                    e.currentTarget.style.transform = 'translateY(-50%) scale(1.1)';
                                    e.currentTarget.style.boxShadow = '0 4px 12px rgba(38, 174, 97, 0.3)';
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.background = '#ffffff';
                                    e.currentTarget.style.color = '#26AE61';
                                    e.currentTarget.style.transform = 'translateY(-50%) scale(1)';
                                    e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.1)';
                                }}
                            >
                                ›
                            </button>

                            {/* Scrollable Container — viewport clips half-visible cards */}
                            <div className="companies-scroll-viewport">
                                <div
                                    ref={companiesScrollContainerRef}
                                    className="companies-scroll-container"
                                >
                                    {companies.map((company, idx) => (
                                        <div
                                            key={idx}
                                            onClick={() =>
                                                navigate(`/company/${company.id}`, { state: { company } })
                                            }
                                            className="company-card"
                                            style={{
                                                cursor: 'pointer',
                                                height: 'auto',
                                                overflow: 'hidden'
                                            }}
                                            onMouseEnter={(e) => {
                                                e.currentTarget.style.borderColor = '#26AE61';
                                                e.currentTarget.style.transform = 'translateY(-3px)';
                                            }}
                                            onMouseLeave={(e) => {
                                                e.currentTarget.style.borderColor = 'rgba(148, 163, 184, 0.15)';
                                                e.currentTarget.style.transform = 'translateY(0)';
                                            }}
                                        >
                                            <div style={{
                                                width: '100%',
                                                display: 'flex',
                                                flexDirection: 'column',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                textAlign: 'center',
                                                gap: '12px',
                                                boxSizing: 'border-box'
                                            }}>
                                                <div className="company-logo">
                                                    <img
                                                        src={company.logo}
                                                        alt={company.name}
                                                        onError={(e) => {
                                                            e.target.src = '/assets/img/company_logo_1.png';
                                                        }}
                                                    />
                                                </div>

                                                <h5 style={{
                                                    fontSize: '18px',
                                                    fontWeight: '700',
                                                    color: '#2c3e50',
                                                    margin: '0',
                                                    lineHeight: '1.3',
                                                    whiteSpace: 'normal',
                                                    overflowWrap: 'anywhere',
                                                    wordBreak: 'break-word',
                                                    textAlign: 'center'
                                                }}>
                                                    {company.name.replace(/_/g, ' ').split(' ').map(word =>
                                                        word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
                                                    ).join(' ')}
                                                    {Boolean(company.isVerified) && (
                                                        <img
                                                            src="/assets/img/bluetick.png"
                                                            alt="Verified"
                                                            style={{
                                                                width: '15px',
                                                                height: '15px',
                                                                marginLeft: '5px',
                                                                verticalAlign: 'middle'
                                                            }}
                                                        />
                                                    )}
                                                </h5>

                                                <div className="company-meta">
                                                    <i
                                                        className="ti-location-pin"
                                                        aria-hidden="true"
                                                        style={{ fontSize: '14px' }}
                                                    />
                                                    <div style={{
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'center',
                                                        gap: '4px',
                                                        flexWrap: 'wrap',
                                                        minWidth: 0
                                                    }}>
                                                        {company.locations.length > 0 ? (
                                                            <>
                                                                {company.locations.length === 1 ? (
                                                                    <span>{company.locations[0]}</span>
                                                                ) : (
                                                                    <>
                                                                        {/* Always show first two cities fully */}
                                                                        <span>{company.locations[0]}</span>
                                                                        <span>,</span>
                                                                        <span>{company.locations[1]}</span>
                                                                        {/* Show third city if available */}
                                                                        {company.locations.length > 2 && (
                                                                            <>
                                                                                <span>,</span>
                                                                                <span style={{
                                                                                    overflow: 'hidden',
                                                                                    textOverflow: 'ellipsis',
                                                                                    whiteSpace: 'nowrap',
                                                                                    maxWidth: '80px',
                                                                                    display: 'inline-block'
                                                                                }}>
                                                                                    {company.locations[2]}
                                                                                </span>
                                                                            </>
                                                                        )}
                                                                        {/* Show ... if more than 3 cities */}
                                                                        {company.locations.length > 3 && (
                                                                            <span>...</span>
                                                                        )}
                                                                    </>
                                                                )}
                                                            </>
                                                        ) : (
                                                            <span>N/A</span>
                                                        )}
                                                    </div>
                                                </div>

                                                <div className="company-openings">
                                                    <i className="ti-briefcase" aria-hidden="true" />
                                                    <span>
                                                        {company.jobCount} Open {company.jobCount === 1 ? 'Job' : 'Jobs'}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="dream-companies-view-more-wrap" style={{ textAlign: 'center', marginTop: '28px' }}>
                                <button
                                    type="button"
                                    className="dream-companies-view-more-btn"
                                    onClick={() => navigate('/Companies')}
                                    style={{
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        gap: '8px',
                                        minHeight: '46px',
                                        padding: '0 24px',
                                        borderRadius: '999px',
                                        border: '1px solid #26AE61',
                                        background: '#26AE61',
                                        color: '#ffffff',
                                        fontSize: '15px',
                                        fontWeight: '700',
                                        cursor: 'pointer',
                                        transition: 'all 0.2s ease',
                                        boxShadow: '0 8px 18px rgba(38, 174, 97, 0.18)'
                                    }}
                                    onMouseEnter={(e) => {
                                        e.currentTarget.style.background = '#1f9653';
                                        e.currentTarget.style.borderColor = '#1f9653';
                                    }}
                                    onMouseLeave={(e) => {
                                        e.currentTarget.style.background = '#26AE61';
                                        e.currentTarget.style.borderColor = '#26AE61';
                                    }}
                                >
                                    View More Companies
                                </button>
                            </div>

                            <style>{`
                                .dream-companies .companies-scroll-viewport {
                                    overflow: hidden;
                                    width: 100%;
                                }

                                .companies-scroll-container::-webkit-scrollbar {
                                    display: none;
                                }
                                .dream-companies .companies-scroll-container {
                                    --companies-gap: 20px;
                                    --companies-per-view: 4;
                                    display: flex;
                                    gap: var(--companies-gap);
                                    overflow-x: auto;
                                    overflow-y: hidden;
                                    -ms-overflow-style: none;
                                    scrollbar-width: none;
                                    scroll-behavior: smooth;
                                    scroll-snap-type: x mandatory;
                                    padding: 10px 0;
                                    width: 100%;
                                    box-sizing: border-box;
                                }

                                .dream-companies .companies-carousel-wrap {
                                    padding-left: 60px;
                                    padding-right: 60px;
                                }

                                /* Your Dream Company cards (scoped) — width fits whole cards per row only */
                                .dream-companies .company-card {
                                    background: #ffffff;
                                    border-radius: 18px;
                                    padding: 32px 24px;
                                    box-shadow: none;
                                    border: 1px solid rgba(148, 163, 184, 0.15);
                                    text-align: center;
                                    color: inherit;
                                    display: flex;
                                    flex-direction: column;
                                    align-items: center;
                                    gap: 12px;
                                    transition: transform 0.2s ease, box-shadow 0.2s ease;
                                    flex: 0 0 calc(
                                        (100% - (var(--companies-per-view) - 1) * var(--companies-gap))
                                        / var(--companies-per-view)
                                    );
                                    width: calc(
                                        (100% - (var(--companies-per-view) - 1) * var(--companies-gap))
                                        / var(--companies-per-view)
                                    );
                                    min-width: 0;
                                    max-width: calc(
                                        (100% - (var(--companies-per-view) - 1) * var(--companies-gap))
                                        / var(--companies-per-view)
                                    );
                                    box-sizing: border-box;
                                    scroll-snap-align: start;
                                }

                                .dream-companies .company-logo {
                                    width: 52px;
                                    height: 52px;
                                    border-radius: 14px;
                                    overflow: hidden;
                                    background: #f8f9fa;
                                    border: 1px solid #e8e8e8;
                                    display: flex;
                                    align-items: center;
                                    justify-content: center;
                                    flex: 0 0 auto;
                                }
                                .dream-companies .company-logo img {
                                    width: 100%;
                                    height: 100%;
                                    object-fit: contain;
                                    padding: 2px;
                                }

                                .dream-companies .company-meta {
                                    display: flex;
                                    align-items: center;
                                    justify-content: center;
                                    gap: 8px;
                                    font-size: 14px;
                                    font-weight: 500;
                                    color: #6c757d;
                                    flex-wrap: wrap;
                                    width: 100%;
                                }
                                .dream-companies .company-meta i {
                                    color: #26AE61;
                                    flex: 0 0 auto;
                                }

                                .dream-companies .company-openings {
                                    display: inline-flex;
                                    align-items: center;
                                    justify-content: center;
                                    gap: 8px;
                                    background: #EAF4FF;
                                    padding: 6px 14px;
                                    border-radius: 999px;
                                    color: #0d6efd;
                                    font-size: 14px;
                                    font-weight: 600;
                                    white-space: nowrap;
                                }
                                .dream-companies .company-openings i {
                                    color: #0d6efd;
                                    font-size: 14px;
                                }

                                @media (max-width: 1199px) {
                                    .dream-companies .companies-scroll-container {
                                        --companies-per-view: 3;
                                    }
                                }

                                @media (max-width: 991px) {
                                    .dream-companies .companies-carousel-wrap {
                                        display: grid;
                                        grid-template-columns: 45px minmax(0, 1fr) 45px;
                                        grid-template-areas: "prev track next";
                                        align-items: center;
                                        column-gap: 10px;
                                        padding-left: 8px !important;
                                        padding-right: 8px !important;
                                    }
                                    .dream-companies .companies-carousel-wrap > button:first-of-type {
                                        grid-area: prev;
                                        position: relative !important;
                                        left: auto !important;
                                        right: auto !important;
                                        top: auto !important;
                                        transform: none !important;
                                        justify-self: center;
                                        margin: 0 !important;
                                    }
                                    .dream-companies .companies-carousel-wrap > button:nth-of-type(2) {
                                        grid-area: next;
                                        position: relative !important;
                                        left: auto !important;
                                        right: auto !important;
                                        top: auto !important;
                                        transform: none !important;
                                        justify-self: center;
                                        margin: 0 !important;
                                    }
                                    .dream-companies .companies-scroll-viewport {
                                        grid-area: track;
                                        width: 100%;
                                        min-width: 0;
                                    }
                                    .dream-companies .companies-scroll-container {
                                        --companies-per-view: 1;
                                        --companies-gap: 16px;
                                        display: grid;
                                        grid-auto-flow: column;
                                        grid-auto-columns: 100%;
                                    }
                                    .dream-companies .company-card {
                                        flex: unset;
                                        width: 100% !important;
                                        min-width: 100% !important;
                                        max-width: 100% !important;
                                        padding: 22px 16px;
                                        scroll-snap-align: center;
                                    }
                                    /* Full-width row below carousel (was stuck in 45px grid column) */
                                    .dream-companies .companies-carousel-wrap > .dream-companies-view-more-wrap {
                                        grid-column: 1 / -1;
                                        width: 100%;
                                        margin-top: 24px;
                                        justify-self: stretch;
                                        padding-left: 0 !important;
                                        padding-right: 0 !important;
                                    }
                                    .dream-companies .companies-carousel-wrap > style {
                                        display: none;
                                    }
                                }

                                @media (max-width: 576px) {
                                    .dream-companies .companies-carousel-wrap {
                                        column-gap: 8px;
                                        padding-left: 4px !important;
                                        padding-right: 4px !important;
                                    }
                                    .dream-companies .companies-scroll-container {
                                        --companies-gap: 12px;
                                    }
                                    .dream-companies .company-card {
                                        padding: 20px 14px;
                                    }
                                    .dream-companies .company-card h5 {
                                        font-size: 15px !important;
                                    }
                                    .dream-companies .company-logo {
                                        width: 44px;
                                        height: 44px;
                                        border-radius: 12px;
                                    }
                                    .dream-companies .company-meta {
                                        font-size: 12px;
                                    }
                                    .dream-companies .company-openings {
                                        font-size: 12px;
                                        padding: 5px 10px;
                                    }
                                }

                                @media (max-width: 991px) {
                                    .dream-companies .dream-companies-view-more-wrap {
                                        display: flex;
                                        justify-content: center;
                                        align-items: center;
                                        width: 100%;
                                        max-width: 100%;
                                        margin-left: auto;
                                        margin-right: auto;
                                        padding-left: 16px;
                                        padding-right: 16px;
                                        box-sizing: border-box;
                                    }
                                    .dream-companies .dream-companies-view-more-btn {
                                        white-space: nowrap;
                                        width: auto;
                                        max-width: 100%;
                                        min-height: 48px;
                                        padding: 12px 24px;
                                        border-radius: 999px;
                                        line-height: 1.2;
                                        box-sizing: border-box;
                                        margin: 0 auto;
                                        font-size: 14px;
                                    }
                                }

                                @media (max-width: 400px) {
                                    .dream-companies .dream-companies-view-more-btn {
                                        padding: 11px 18px;
                                        font-size: 13px;
                                    }
                                }
                    `}</style>
                        </div>
                    </div>
                </section>
            )}
            {/* ================= Your Dream Company Is Hiring Section End ========================= */}

            {/* ================= Find Jobs in Your City Section ========================= */}
            {cities.length > 0 && (
                <section className="padd-top-10 padd-bot-40" style={{ background: '#f5f5f0', paddingBottom: '20px' }}>
                    <div className="container">
                        {/* Section Heading */}
                        <div style={{ textAlign: 'center', marginBottom: '50px' }}>
                            <h2 style={{
                                fontSize: '32px',
                                fontWeight: '700',
                                color: '#2c3e50',
                                marginBottom: '8px',
                                letterSpacing: '-0.5px',
                                marginTop: '20px'
                            }}>
                                Find Jobs in Your City
                            </h2>
                            <p style={{
                                fontSize: '15px',
                                color: '#707f8c',
                                margin: 0
                            }}>
                                Discover opportunities in your preferred location
                            </p>
                        </div>

                        {/* Cities Grid - Single Row */}
                        <div className="cities-viewport">
                            <div style={{
                                display: 'flex',
                                gap: '20px',
                                justifyContent: 'center',
                                flexWrap: 'nowrap',
                                padding: '10px 0',
                                scrollbarWidth: 'none',
                                msOverflowStyle: 'none',
                                scrollBehavior: 'smooth'
                            }}
                                className="cities-scroll-container"
                            >
                                {cities.map((city, idx) => (
                                    <div
                                        key={idx}
                                        className="home-city-item"
                                        style={{
                                            flex: '0 0 auto',
                                            width: '220px'
                                        }}
                                    >
                                        <div
                                            onClick={() => {
                                                trackSearch(city.name);
                                                navigate(`/jobs?city=${encodeURIComponent(city.name)}`);
                                            }}
                                            className="home-city-card"
                                            style={{
                                                position: 'relative',
                                                height: '280px',
                                                borderRadius: '16px',
                                                overflow: 'hidden',
                                                cursor: 'pointer',
                                                background: `url(${city.image})`,
                                                backgroundSize: '130%',
                                                backgroundPosition: 'center',
                                                backgroundRepeat: 'no-repeat',
                                                backgroundColor: '#ffffff',
                                                transition: 'all 0.3s ease',
                                                boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                                            }}
                                            onMouseEnter={(e) => {
                                                e.currentTarget.style.transform = 'translateY(-5px)';
                                                e.currentTarget.style.boxShadow = '0 8px 20px rgba(0,0,0,0.2)';
                                            }}
                                            onMouseLeave={(e) => {
                                                e.currentTarget.style.transform = 'translateY(0)';
                                                e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.1)';
                                            }}
                                        >
                                            {/* City Name with Arrow Button */}
                                            <div style={{
                                                position: 'absolute',
                                                top: '20px',
                                                left: '20px',
                                                right: '20px',
                                                display: 'flex',
                                                justifyContent: 'space-between',
                                                alignItems: 'center'
                                            }}>
                                                <h3 style={{
                                                    fontSize: '18px',
                                                    fontWeight: '700',
                                                    color: '#26AE61',
                                                    margin: 0,
                                                    textTransform: 'uppercase',
                                                    textShadow: '0 2px 4px rgba(255,255,255,0.8)'
                                                }}>
                                                    {city.name.toUpperCase()}
                                                </h3>
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        trackSearch(city.name);
                                                        navigate(`/jobs?city=${encodeURIComponent(city.name)}`);
                                                    }}
                                                    style={{
                                                        width: '36px',
                                                        height: '36px',
                                                        borderRadius: '50%',
                                                        background: 'rgba(38, 174, 97, 0.9)',
                                                        border: '2px solid #26AE61',
                                                        color: '#ffffff',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'center',
                                                        cursor: 'pointer',
                                                        transition: 'all 0.3s ease',
                                                        fontSize: '18px',
                                                        fontWeight: 'bold'
                                                    }}
                                                    onMouseEnter={(e) => {
                                                        e.currentTarget.style.background = '#26AE61';
                                                        e.currentTarget.style.borderColor = '#26AE61';
                                                        e.currentTarget.style.transform = 'scale(1.1)';
                                                    }}
                                                    onMouseLeave={(e) => {
                                                        e.currentTarget.style.background = 'rgba(38, 174, 97, 0.9)';
                                                        e.currentTarget.style.borderColor = '#26AE61';
                                                        e.currentTarget.style.transform = 'scale(1)';
                                                    }}
                                                >
                                                    →
                                                </button>
                                            </div>

                                            {/* Job Count Badge at Bottom */}
                                            <div style={{
                                                position: 'absolute',
                                                bottom: '20px',
                                                left: '50%',
                                                transform: 'translateX(-50%)',
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '6px',
                                                background: '#e8f5e9',
                                                padding: '6px 14px',
                                                borderRadius: '20px'
                                            }}>
                                                <i className="ti-briefcase" style={{
                                                    fontSize: '14px',
                                                    color: '#26AE61'
                                                }}></i>
                                                <span style={{
                                                    fontSize: '13px',
                                                    fontWeight: '700',
                                                    color: '#26AE61',
                                                    textTransform: 'uppercase',
                                                    letterSpacing: '0.5px'
                                                }}>
                                                    {city.jobCount === 0 ? 'NO JOBS' : `${city.jobCount} ${city.jobCount === 1 ? 'JOB' : 'JOBS'}`}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                        <style>{`
                            .cities-scroll-container::-webkit-scrollbar {
                                display: none;
                            }
                            .cities-scroll-container {
                                -ms-overflow-style: none;
                                scrollbar-width: none;
                            }
                        `}</style>
                    </div>
                </section>
            )}
            {/* ================= Find Jobs in Your City Section End ========================= */}

            {/* ================= Watch Our Video Section ========================= */}
            {/* <section style={{ padding: '70px 0', background: '#ffffff' }}>
                <div className="container">
                    <div className="row" style={{ alignItems: 'center' }}>
                        <div className="col-md-6">
                            <div
                                style={{
                                    display: 'inline-block',
                                    background: '#e8f1ff',
                                    color: '#0d6efd',
                                    padding: '6px 14px',
                                    borderRadius: '999px',
                                    fontSize: '12px',
                                    fontWeight: '700',
                                    marginBottom: '14px'
                                }}
                            >
                                HERE YOU CAN SEE
                            </div>

                            <h2 style={{ fontSize: '44px', fontWeight: '800', color: '#0f172a', margin: '0 0 12px 0' }}>
                                Watch Our Video
                            </h2>

                            <p style={{ color: '#6c757d', fontSize: '15px', lineHeight: 1.7, marginBottom: '20px' }}>
                                Aliquam vestibulum cursus felis. Iniaculis iaculis sapien ac condimentum. Vestibulum congue posuere
                                lacus, id tincidunt nisi porta sit amet.
                            </p>

                            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'grid', gap: '12px' }}>
                                {[
                                    'Learn about our platform',
                                    'Discover success stories',
                                    'See how it works'
                                ].map((t) => (
                                    <li key={t} style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#212529', fontWeight: 600 }}>
                                        <span
                                            style={{
                                                width: '22px',
                                                height: '22px',
                                                borderRadius: '50%',
                                                background: '#e9f8ee',
                                                color: '#22c55e',
                                                display: 'inline-flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                fontWeight: '900'
                                            }}
                                        >
                                            ✓
                                        </span>
                                        <span>{t}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>

                        <div className="col-md-6" style={{ marginTop: '20px' }}>
                            <div
                                style={{
                                    borderRadius: '18px',
                                    overflow: 'hidden',
                                    boxShadow: '0 20px 45px rgba(0,0,0,0.08)',
                                    position: 'relative',
                                    background: '#ffffff'
                                }}
                            >
                                <div style={{ position: 'relative', paddingTop: '56.25%' }}>
                                    <video
                                        controls
                                        preload="metadata"
                                        playsInline
                                        style={{
                                            position: 'absolute',
                                            inset: 0,
                                            width: '100%',
                                            height: '100%',
                                            objectFit: 'cover',
                                            background: '#000'
                                        }}
                                    >
                                        <source src="/assets/video/uptula%20App%20Video.mp4" type="video/mp4" />
                                        Your browser does not support the video tag.
                                    </video>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section> */}

            {/* ================= Success Stories Section ========================= */}
            <section className="section testimonials-section" style={{ padding: '70px 0', background: 'linear-gradient(120deg, rgba(237, 242, 255, 0.65) 0%, rgba(219, 245, 255, 0.65) 100%)' }}>
                <div className="container">
                    <div className="titleTop text-center" style={{ marginBottom: '30px' }}>
                        <div className="subtitle" style={{ fontSize: '28px', fontWeight: '600', color: '#17d27c', marginBottom: '5px' }}>Stories from our community</div>
                        <h3 style={{ fontSize: '34px', fontWeight: '800', color: '#0f172a', margin: '6px 0 0 0' }}>Success Stories</h3>
                    </div>

                    <div className="testimonials-wrap" style={{ position: 'relative' }}>
                        <button
                            onClick={() => scrollStories('left')}
                            className="stories-nav-btn stories-nav-btn-left"
                            style={{
                                position: 'absolute',
                                left: 0,
                                top: '50%',
                                transform: 'translateY(-50%)',
                                width: '40px',
                                height: '40px',
                                borderRadius: '50%',
                                border: '2px solid #26AE61',
                                background: '#ffffff',
                                color: '#26AE61',
                                cursor: 'pointer',
                                zIndex: 10,
                                boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: '22px',
                                fontWeight: 'bold'
                            }}
                            aria-label="Previous stories"
                        >
                            ‹
                        </button>

                        <button
                            onClick={() => scrollStories('right')}
                            className="stories-nav-btn stories-nav-btn-right"
                            style={{
                                position: 'absolute',
                                right: 0,
                                top: '50%',
                                transform: 'translateY(-50%)',
                                width: '40px',
                                height: '40px',
                                borderRadius: '50%',
                                border: '2px solid #26AE61',
                                background: '#ffffff',
                                color: '#26AE61',
                                cursor: 'pointer',
                                zIndex: 10,
                                boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: '22px',
                                fontWeight: 'bold'
                            }}
                            aria-label="Next stories"
                        >
                            ›
                        </button>

                        <div className="stories-viewport">
                            <div
                                ref={storiesScrollRef}
                                className="stories-scroll-container"
                                style={{
                                    display: 'flex',
                                    gap: '20px',
                                    overflowX: 'auto',
                                    overflowY: 'hidden',
                                    padding: '10px 0',
                                    scrollBehavior: 'smooth',
                                    scrollbarWidth: 'none',
                                    msOverflowStyle: 'none',
                                    scrollSnapType: 'x mandatory'
                                }}
                            >
                                {[
                                    {
                                        text: '"I found a few jobs that matched my skills and location. The listings were clear, and applying was quick and simple."',
                                        name: 'Ramesh Kumar',
                                        role: 'Electrician',
                                        photo: '/assets/img/stories/ramesh.jpg'
                                    },
                                    {
                                        text: '"The platform helped me find suitable work without wasting time. I could easily check different jobs and apply to the ones I liked."',
                                        name: 'Pooja Singh',
                                        role: 'Retail Sales Associate',
                                        photo: '/assets/img/stories/pooja.jpg'
                                    },
                                    {
                                        text: '"I liked how easy it was to search for jobs near me. I found roles that matched my experience and could apply quickly."',
                                        name: 'Imran Khan',
                                        role: 'Delivery Executive',
                                        photo: '/assets/img/stories/imran.jpg'
                                    },
                                    {
                                        text: '"There were many relevant jobs to choose from, and the application process was straightforward. It made my job search much easier."',
                                        name: 'Neha Patel',
                                        role: 'Customer Support Executive',
                                        photo: '/assets/img/stories/neha.jpg'
                                    },
                                    {
                                        text: '"We could post openings and start getting relevant applications quickly. It made the hiring process more organized for our team."',
                                        name: 'Vikram Sharma',
                                        role: 'HR Manager, yubi foods & spices',
                                        photo: '/assets/img/stories/vikram.jpg'
                                    },
                                    {
                                        text: '"Managing multiple vacancies became easier with everything in one place. It helped us save time while finding suitable candidates."',
                                        name: 'Priya Mehta',
                                        role: 'Talent Acquisition Lead, vikash',
                                        photo: '/assets/img/stories/priya.jpg'
                                    }
                                ].map((story, idx) => (
                                    <div
                                        key={`${story.name}-${idx}`}
                                        className="story-card"
                                        style={{
                                            width: 'calc((100% - 40px) / 3)',
                                            minWidth: 'calc((100% - 40px) / 3)',
                                            maxWidth: 'calc((100% - 40px) / 3)',
                                            flex: '0 0 calc((100% - 40px) / 3)',
                                            scrollSnapAlign: 'start',
                                            background: '#ffffff',
                                            borderRadius: '16px',
                                            padding: '22px 22px',
                                            border: '1px solid rgba(148, 163, 184, 0.18)',
                                            boxShadow: '0 10px 30px rgba(15, 23, 42, 0.06)'
                                        }}
                                    >
                                        <div style={{ color: '#0d6efd', fontSize: '24px', marginBottom: '10px', lineHeight: 1 }}>
                                            <i className="fa fa-quote-left" aria-hidden="true" />
                                        </div>
                                        <p style={{ margin: 0, color: '#1f2937', fontSize: '14px', lineHeight: 1.7 }}>
                                            {story.text}
                                        </p>

                                        <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginTop: '18px' }}>
                                            <img
                                                src={story.photo}
                                                alt={story.name}
                                                style={{ width: '46px', height: '46px', borderRadius: '50%', objectFit: 'cover' }}
                                                onError={(e) => { e.currentTarget.src = '/assets/img/user-profile.png'; }}
                                            />
                                            <div style={{ minWidth: 0 }}>
                                                <div style={{ fontWeight: '800', color: '#0f172a', fontSize: '14px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                                    {story.name}
                                                </div>
                                                <div style={{ color: '#6c757d', fontWeight: '600', fontSize: '12px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                                    {story.role}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    <style>{`
                        .stories-viewport{
                            margin: 0 52px;
                            overflow: hidden;
                        }
                        .stories-scroll-container::-webkit-scrollbar{ display:none; }
                        @media (max-width: 1199px){
                            .stories-viewport{
                                margin: 0 46px;
                            }
                            .stories-scroll-container{
                                gap: 16px !important;
                            }
                            .story-card{
                                width: calc((100% - 16px) / 2) !important;
                                min-width: calc((100% - 16px) / 2) !important;
                                max-width: calc((100% - 16px) / 2) !important;
                                flex: 0 0 calc((100% - 16px) / 2) !important;
                            }
                        }
                        @media (max-width: 767px){
                            .stories-viewport{
                                margin: 0 12px;
                            }
                            .stories-scroll-container{
                                gap: 12px !important;
                            }
                            .story-card{
                                width: 100% !important;
                                min-width: 100% !important;
                                max-width: 100% !important;
                                flex: 0 0 100% !important;
                            }
                            .stories-nav-btn{
                                display: none !important;
                            }
                        }
                    `}</style>
                </div>
            </section>


            {/* ================= App Download Poster Section ========================= */}
            <MobileAppDownload />
            {/* ================= App Download Poster Section End ========================= */}

            {/* ================= Sponsorship start ========================= */}
            {sponsorships.length > 0 && (
                <section className="utf_job_category_area" style={{ background: '#f8f9fa' }}>
                    <div className="container">
                        <div className="row">
                            <div className="col-md-8 col-md-offset-2">
                                <div className="heading">
                                    <h2>Featured Sponsorships</h2>
                                    <p>
                                        Discover amazing sponsorship opportunities from leading companies.
                                    </p>
                                </div>
                            </div>
                        </div>
                        <div className="row">
                            <div className="col-md-12">
                                <div className="row">
                                    {sponsorships.map((sponsorship, idx) => (
                                        <div key={idx} className="col-md-3 col-sm-6">
                                            <Link to={sponsorship.link_url || `/jobs/${sponsorship.job_id || sponsorship.id}`} title={sponsorship.title}>
                                                <div className="utf_category_box_area" style={{ background: 'white', border: '2px solid #007bff' }}>
                                                    <div className="utf_category_desc">
                                                        <div className="utf_category_icon" style={{ background: '#007bff' }}>
                                                            <i className="ti-star" aria-hidden="true" style={{ color: 'white' }} />
                                                        </div>
                                                        <div className="category-detail utf_category_desc_text">
                                                            <h4>{sponsorship.title}</h4>
                                                            <p>{sponsorship.company_name}</p>
                                                            {sponsorship.image_url && (
                                                                <img src={sponsorship.image_url} alt={sponsorship.company_name} style={{ maxWidth: '100%', marginTop: '10px' }} />
                                                            )}
                                                            {sponsorship.logo && !sponsorship.image_url && (
                                                                <img src={sponsorship.logo} alt={sponsorship.company_name} style={{ maxWidth: '100px', marginTop: '10px' }} />
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            </Link>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </section>
            )}
            {/* ================= Sponsorship end ========================= */}

            <Footer />
            <Chatbot />
        </>
    );
}

export default Home;
