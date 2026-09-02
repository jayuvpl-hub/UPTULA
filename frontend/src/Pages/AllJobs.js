import React, { useEffect, useMemo, useRef, useState } from "react";
import { motion, useInView, animate } from "framer-motion";
import { FiZap, FiSearch, FiBriefcase, FiMapPin, FiTrendingUp, FiHome } from "react-icons/fi";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import Header from "../Components/Header";
import Footer from "../Components/Footer";
import MobileAppDownload from "../Components/MobileAppDownload";
import { API_BASE_URL } from "../config/api";
import WishlistButton from "../Components/WishlistButton";
import { createSlug } from "../utils/slug";
import { formatCategoryName } from "../utils/categoryIcons";
import { trackSearch, trackSearchDebounced } from "../utils/trackActivity";
import { SALARY_FILTER_OPTIONS, findSalaryFilterByRange, formatJobSalary } from "../utils/jobSalary";
import useJobCategories from "../hooks/useJobCategories";
import PageSEO from "../Components/PageSEO";

// Normalize separators too (spaces/underscores/hyphens) so a category NAME like
// "Information Technology" matches a stored slug like "information_technology".
const normalizeFilterText = (value) =>
    String(value || '').trim().toLowerCase().replace(/[\s_-]+/g, ' ');

const jobMatchesCategoryFilter = (job, categoryFilter) => {
    if (!categoryFilter) return true;
    const filter = normalizeFilterText(categoryFilter);
    const fields = [
        job.category,
        job.jobCategory,
        job.categoryName,
        job.industry,
    ].map(normalizeFilterText).filter(Boolean);
    return fields.some(
        (field) => field === filter || field.includes(filter) || filter.includes(field)
    );
};

const jobMatchesSubcategoryFilter = (job, subcategoryFilter) => {
    if (!subcategoryFilter) return true;
    const filter = normalizeFilterText(subcategoryFilter);
    const fields = [
        job.subcategory,
        job.subCategory,
        job.sub_category,
        job.subcategoryName,
        job.jobTitle,
        job.title,
        job.designation,
        job.role,
    ].map(normalizeFilterText).filter(Boolean);
    const description = normalizeFilterText(job.description);
    return (
        fields.some((field) => field === filter || field.includes(filter) || filter.includes(field)) ||
        (description && description.includes(filter))
    );
};

const applyCategorySubcategoryFilters = (jobs, categoryFilter, subcategoryFilter) =>
    jobs.filter(
        (job) =>
            jobMatchesCategoryFilter(job, categoryFilter) &&
            jobMatchesSubcategoryFilter(job, subcategoryFilter)
    );

const EXPERIENCE_FILTER_OPTIONS = [
    { value: '0_2', label: '0–2 Years', min: 0, max: 2 },
    { value: '2_4', label: '2–4 Years', min: 2, max: 4 },
    { value: '4_6', label: '4–6 Years', min: 4, max: 6 },
    { value: '6_10', label: '6–10 Years', min: 6, max: 10 },
    { value: '10_plus', label: '10+ Years', min: 10, max: Infinity },
];

const parseExperienceYears = (raw) => {
    const text = String(raw || '').toLowerCase().trim();
    if (!text) return null;
    if (/(fresher|entry level|no experience|beginner)/.test(text)) {
        return { min: 0, max: 0 };
    }
    const plusMatch = text.match(/(\d+(?:\.\d+)?)\s*\+/);
    if (plusMatch) {
        const n = Number(plusMatch[1]);
        return { min: n, max: Infinity };
    }
    const nums = (text.match(/\d+(?:\.\d+)?/g) || []).map(Number);
    if (!nums.length) return null;
    if (nums.length === 1) return { min: nums[0], max: nums[0] };
    return { min: Math.min(nums[0], nums[1]), max: Math.max(nums[0], nums[1]) };
};

const jobMatchesExperienceFilter = (job, experienceFilter) => {
    if (!experienceFilter) return true;
    const option = EXPERIENCE_FILTER_OPTIONS.find((o) => o.value === experienceFilter);
    if (!option) return true;
    const jobExp = job.experience || job.experienceRequired || job.experience_required || job.minExperience || '';
    const parsed = parseExperienceYears(jobExp);
    if (!parsed) return false;
    return parsed.min <= option.max && parsed.max >= option.min;
};

const mobileFilterStyles = {
    overlay: {
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.45)",
        zIndex: 1200,
        display: "flex",
        justifyContent: "flex-end",
    },
    drawer: (open) => ({
        width: "min(88vw, 340px)",
        height: "100%",
        background: "#fff",
        overflowY: "auto",
        padding: "0 0 40px",
        transform: open ? "translateX(0)" : "translateX(100%)",
        transition: "transform 0.28s cubic-bezier(0.4,0,0.2,1)",
        boxShadow: "-4px 0 24px rgba(0,0,0,0.12)",
    }),
    drawerHead: {
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "16px 18px",
        borderBottom: "1px solid #e1e5e9",
        position: "sticky",
        top: 0,
        background: "#fff",
        zIndex: 2,
    },
    drawerTitle: { fontSize: "16px", fontWeight: "600", color: "#1a1a1a", margin: 0 },
    closeBtn: {
        background: "none",
        border: "none",
        cursor: "pointer",
        fontSize: "20px",
        color: "#6b7280",
        lineHeight: 1,
        padding: "4px",
    },
    clearAll: {
        background: "none",
        border: "none",
        cursor: "pointer",
        fontSize: "13px",
        color: "#ef4444",
        fontWeight: "500",
    },
    section: { padding: "14px 18px", borderBottom: "1px solid #f0f0f0" },
    sectionTitle: {
        fontSize: "13px",
        fontWeight: "600",
        color: "#374151",
        marginBottom: "10px",
        textTransform: "uppercase",
        letterSpacing: "0.5px",
    },
    checkRow: {
        display: "flex",
        alignItems: "center",
        gap: "8px",
        marginBottom: "8px",
        cursor: "pointer",
        fontSize: "14px",
        color: "#374151",
    },
    checkbox: { accentColor: "#28a745", width: "15px", height: "15px", cursor: "pointer" },
    filterBtn: {
        display: "inline-flex",
        alignItems: "center",
        gap: "6px",
        padding: "8px 14px",
        borderRadius: "8px",
        border: "1px solid #28a745",
        background: "#fff",
        color: "#28a745",
        fontSize: "13px",
        fontWeight: "600",
        cursor: "pointer",
        whiteSpace: "nowrap",
    },
    filterBadge: {
        background: "#28a745",
        color: "#fff",
        borderRadius: "50%",
        width: "18px",
        height: "18px",
        fontSize: "11px",
        fontWeight: "700",
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
    },
    mobileSearchRow: {
        display: "flex",
        gap: "8px",
        alignItems: "center",
        marginBottom: "16px",
    },
    mobileSearchInput: {
        flex: 1,
        padding: "10px 14px",
        borderRadius: "8px",
        border: "1px solid #e1e5e9",
        fontSize: "14px",
        outline: "none",
    },
    applyFiltersBtn: {
        width: "calc(100% - 36px)",
        margin: "16px 18px 0",
        padding: "12px",
        background: "#28a745",
        color: "#fff",
        border: "none",
        borderRadius: "8px",
        fontSize: "14px",
        fontWeight: "600",
        cursor: "pointer",
    },
    fieldInput: {
        width: "100%",
        padding: "10px 12px",
        borderRadius: "8px",
        border: "1px solid #e1e5e9",
        fontSize: "14px",
        marginBottom: "10px",
        outline: "none",
        boxSizing: "border-box",
    },
};

function MobileFilterPanel({
    filters,
    setFilters,
    setPage,
    setSearchKeyword,
    toggleFilter,
    onApply,
    jobCategories,
    categorySubcategories,
}) {
    const Section = ({ title, children }) => (
        <div style={mobileFilterStyles.section}>
            <div style={mobileFilterStyles.sectionTitle}>{title}</div>
            {children}
        </div>
    );

    const Check = ({ id, label, name, value }) => (
        <label style={mobileFilterStyles.checkRow} htmlFor={id}>
            <input
                id={id}
                type="checkbox"
                style={mobileFilterStyles.checkbox}
                checked={filters[name] === value}
                onChange={() => toggleFilter(name, value)}
            />
            {label}
        </label>
    );

    return (
        <>
            <Section title="Job Type">
                <Check id="m-jt-ft" label="Full Time" name="jobType" value="full_time" />
                <Check id="m-jt-pt" label="Part Time" name="jobType" value="part_time" />
                <Check id="m-jt-in" label="Internship" name="jobType" value="internship" />
                <Check id="m-jt-fr" label="Freelancer" name="jobType" value="freelancer" />
                <Check id="m-jt-co" label="Contract" name="jobType" value="contract" />
            </Section>

            <Section title="Category">
                {jobCategories.map((cat, idx) => (
                    <React.Fragment key={cat.id}>
                        <Check
                            id={`m-cat-${idx}`}
                            label={cat.name}
                            name="category"
                            value={cat.name}
                        />
                        {filters.category === cat.name
                            ? categorySubcategories.map((sub, subIdx) => (
                                <label
                                    key={sub.id}
                                    style={{ ...mobileFilterStyles.checkRow, paddingLeft: '22px', fontSize: '13px' }}
                                    htmlFor={`m-sub-${idx}-${subIdx}`}
                                >
                                    <input
                                        id={`m-sub-${idx}-${subIdx}`}
                                        type="checkbox"
                                        style={mobileFilterStyles.checkbox}
                                        checked={filters.subcategory === sub.name}
                                        onChange={() => toggleFilter('subcategory', sub.name)}
                                    />
                                    {sub.name}
                                </label>
                            ))
                            : null}
                    </React.Fragment>
                ))}
            </Section>

            <Section title="Designation">
                <Check id="m-des-wd" label="Web Designer" name="designation" value="web_designer" />
                <Check id="m-des-pd" label="PHP Developer" name="designation" value="php_developer" />
                <Check id="m-des-pm" label="Project Manager" name="designation" value="project_manager" />
                <Check id="m-des-hr" label="Human Resource" name="designation" value="human_resource" />
                <Check id="m-des-cm" label="CMS Developer" name="designation" value="cms_developer" />
                <Check id="m-des-ad" label="App Developer" name="designation" value="app_developer" />
            </Section>

            <Section title="Experience">
                {EXPERIENCE_FILTER_OPTIONS.map((opt, idx) => (
                    <Check
                        key={opt.value}
                        id={`m-exp-${idx}`}
                        label={opt.label}
                        name="experience"
                        value={opt.value}
                    />
                ))}
            </Section>

            <Section title="Posted Time">
                <Check id="m-time-1" label="1 day ago" name="timePosted" value="1_day" />
                <Check id="m-time-2" label="3 days ago" name="timePosted" value="3_days" />
                <Check id="m-time-3" label="1 week ago" name="timePosted" value="1_week" />
                <Check id="m-time-4" label="2 weeks ago" name="timePosted" value="2_weeks" />
                <Check id="m-time-5" label="1 month ago" name="timePosted" value="1_month" />
                <Check id="m-time-6" label="3 months ago" name="timePosted" value="3_months" />
                <Check id="m-time-7" label="6 months ago" name="timePosted" value="6_months" />
            </Section>

            <Section title="Salary Range">
                {SALARY_FILTER_OPTIONS.map((opt, idx) => (
                    <Check
                        key={opt.value}
                        id={`m-salary-${idx}`}
                        label={opt.label}
                        name="salary"
                        value={opt.value}
                    />
                ))}
            </Section>

            <button type="button" style={mobileFilterStyles.applyFiltersBtn} onClick={onApply}>
                Apply Filters
            </button>
        </>
    );
}

// ---- Naukri-style desktop sidebar styles + helpers ----
const GREEN = '#16a34a';
const GREEN_DARK = '#15803d';

// Built-in popular roles/skills used to seed AI-style autosuggest.
const POPULAR_ROLES = [
    'React Developer', 'Java Developer', 'Data Analyst', 'Digital Marketing',
    'Sales Executive', 'UI/UX Designer', 'DevOps Engineer', 'Accountant',
    'HR Manager', 'Customer Support', 'Python Developer', 'Node.js Developer',
    'Business Analyst', 'Content Writer', 'Graphic Designer', 'Civil Engineer',
    'Mechanical Engineer', 'Nurse', 'Teacher', 'Project Manager',
    'Full Stack Developer', 'Marketing Manager', 'Operations Manager',
    'Flutter Developer', 'Cyber Security',
];

// Quick-pick chips shown under the hero search box.
const POPULAR_SEARCHES = ['Designer', 'Developer', 'Marketing', 'Sales', 'HR'];

// Tiny inline count-up driven by framer-motion `animate` once the tile is in view.
function CountUp({ value }) {
    const ref = useRef(null);
    const inView = useInView(ref, { once: true, margin: '0px 0px -40px 0px' });
    const [display, setDisplay] = useState(0);

    useEffect(() => {
        if (!inView) return undefined;
        const controls = animate(0, Number(value) || 0, {
            duration: 1.1,
            ease: 'easeOut',
            onUpdate: (latest) => setDisplay(Math.round(latest)),
        });
        return () => controls.stop();
    }, [inView, value]);

    return <span ref={ref}>{display.toLocaleString('en-IN')}</span>;
}

function StatTile({ icon, label, value, delay, color }) {
    const tint = color || GREEN;
    return (
        <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, delay, ease: 'easeOut' }}
            className="njk-stat-tile"
        >
            <span className="njk-stat-icon" aria-hidden="true" style={{ color: tint, background: `${tint}1a` }}>{icon}</span>
            <div style={{ minWidth: 0 }}>
                <div className="njk-stat-value"><CountUp value={value} /></div>
                <div className="njk-stat-label">{label}</div>
            </div>
        </motion.div>
    );
}

const sidebarStyles = {
    panel: {
        background: '#fff',
        border: '1px solid rgba(148,163,184,0.18)',
        borderRadius: '14px',
        boxShadow: '0 6px 18px rgba(15,23,42,0.06)',
        overflow: 'hidden',
        position: 'sticky',
        top: '88px',
    },
    head: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '16px 18px',
        borderBottom: '1px solid #e2e8f0',
    },
    headTitle: {
        margin: 0,
        fontSize: '16px',
        fontWeight: 700,
        color: '#0f172a',
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
    },
    headBadge: {
        background: 'rgba(22,163,74,0.10)',
        color: GREEN,
        borderRadius: '999px',
        padding: '1px 8px',
        fontSize: '12px',
        fontWeight: 700,
    },
    clearLink: {
        background: 'none',
        border: 'none',
        cursor: 'pointer',
        fontSize: '13px',
        color: GREEN,
        fontWeight: 600,
        padding: 0,
    },
    searchWrap: { padding: '14px 18px', borderBottom: '1px solid #f1f5f9' },
    searchInput: {
        width: '100%',
        padding: '10px 12px',
        borderRadius: '10px',
        border: '1px solid #e2e8f0',
        fontSize: '14px',
        outline: 'none',
        boxSizing: 'border-box',
        marginBottom: '10px',
        color: '#0f172a',
    },
    sectionWrap: { borderBottom: '1px solid #f1f5f9' },
    sectionHead: {
        width: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '14px 18px',
        background: 'none',
        border: 'none',
        cursor: 'pointer',
        fontSize: '13px',
        fontWeight: 700,
        color: '#0f172a',
        textTransform: 'uppercase',
        letterSpacing: '0.4px',
    },
    sectionBody: { padding: '0 18px 14px' },
    checkRow: {
        display: 'flex',
        alignItems: 'center',
        gap: '9px',
        marginBottom: '9px',
        cursor: 'pointer',
        fontSize: '14px',
        color: '#475569',
    },
    checkbox: { accentColor: GREEN, width: '15px', height: '15px', cursor: 'pointer', flexShrink: 0 },
};

function SidebarSection({ title, defaultOpen = false, children }) {
    const [open, setOpen] = useState(defaultOpen);
    return (
        <div style={sidebarStyles.sectionWrap}>
            <button type="button" style={sidebarStyles.sectionHead} onClick={() => setOpen((o) => !o)} aria-expanded={open}>
                <span>{title}</span>
                <i className={open ? 'ti-minus' : 'ti-plus'} style={{ color: GREEN, fontSize: '12px' }} aria-hidden="true" />
            </button>
            {open && <div style={sidebarStyles.sectionBody}>{children}</div>}
        </div>
    );
}

function AllJobs() {

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
    const [filters, setFilters] = useState({ q: '', city: '', jobType: '', salary: '', qualification: '', designation: '', experience: '', category: '', subcategory: '', timePosted: '' });
    const [applyOpen, setApplyOpen] = useState(false);
    const [applyJob, setApplyJob] = useState(null);
    const [applyForm, setApplyForm] = useState({ name: '', email: '', phone: '', resume: null, pastedCv: '' });
    const [focusedField, setFocusedField] = useState(null);
    const [, setCategories] = useState([]);
    const [, setAllCategories] = useState([]);
    const [, setSearchKeyword] = useState('');
    const [, setSearchCategory] = useState('');
    const [appliedJobIds, setAppliedJobIds] = useState(new Set());
    const [drawerOpen, setDrawerOpen] = useState(false);
    const drawerRef = useRef(null);
    // AI-style autosuggest for the hero keyword search
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [highlightIndex, setHighlightIndex] = useState(-1);
    const suggestRef = useRef(null);
    const { categories: jobCategories, subcategories: categorySubcategories } = useJobCategories(filters.category);

    // Pool of suggestion candidates: loaded jobs (title/company/skills) + popular roles.
    const suggestionPool = useMemo(() => {
        const pool = [...POPULAR_ROLES];
        jobs.forEach((job) => {
            if (job.jobTitle || job.title) pool.push(String(job.jobTitle || job.title));
            if (job.companyName || job.company) pool.push(String(job.companyName || job.company));
            const skillsRaw = job.skills || job.keySkills || job.key_skills || job.skillsRequired || '';
            (Array.isArray(skillsRaw) ? skillsRaw : String(skillsRaw).split(','))
                .map((s) => String(s).trim())
                .filter(Boolean)
                .forEach((s) => pool.push(s));
        });
        // De-duplicate case-insensitively, keeping first-seen casing.
        const seen = new Set();
        const unique = [];
        pool.forEach((item) => {
            const trimmed = item.trim();
            if (!trimmed) return;
            const key = trimmed.toLowerCase();
            if (seen.has(key)) return;
            seen.add(key);
            unique.push(trimmed);
        });
        return unique;
    }, [jobs]);

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

    // Stats for the animated infographic band.
    const distinctCompanies = useMemo(() => {
        const set = new Set();
        jobs.forEach((job) => {
            const c = (job.companyName || job.company || '').trim().toLowerCase();
            if (c) set.add(c);
        });
        return set.size;
    }, [jobs]);

    const distinctLocations = useMemo(() => {
        const set = new Set();
        jobs.forEach((job) => {
            const c = (job.city || job.state || job.country || '').trim().toLowerCase();
            if (c) set.add(c);
        });
        return set.size;
    }, [jobs]);

    const newThisWeek = useMemo(() => {
        const cutoff = Date.now() - 7 * 24 * 60 * 60 * 1000;
        return jobs.filter((job) => {
            const d = new Date(job.createdAt || job.created_at || job.postedDate).getTime();
            return !Number.isNaN(d) && d >= cutoff;
        }).length;
    }, [jobs]);

    const runSearch = (value) => {
        setFilters((prev) => ({ ...prev, q: value }));
        setSearchKeyword(value);
        setPage(1);
        setShowSuggestions(false);
        setHighlightIndex(-1);
        if (value && value.trim()) trackSearch(value.trim());
    };

    const activeFilterCount = [
        filters.q,
        filters.city,
        filters.jobType,
        filters.designation,
        filters.experience,
        filters.qualification,
        filters.category,
        filters.subcategory,
        filters.timePosted,
        filters.salary,
    ].filter(Boolean).length;

    const clearAllFilters = () => {
        setPage(1);
        setFilters({
            q: '',
            city: '',
            jobType: '',
            salary: '',
            qualification: '',
            designation: '',
            experience: '',
            category: '',
            subcategory: '',
            timePosted: '',
        });
        setSearchKeyword('');
        setSearchCategory('');
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

    useEffect(() => {
        if (drawerOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }
        return () => {
            document.body.style.overflow = '';
        };
    }, [drawerOpen]);

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

    // Read filters from URL on mount / when navigating from Home search
    useEffect(() => {
        const categoryParam = searchParams.get('category');
        const subcategoryParam = searchParams.get('subcategory');
        const qParam = searchParams.get('q');
        const cityParam = searchParams.get('city');

        setPage(1);
        setFilters((prev) => {
            const next = { ...prev };
            next.category = categoryParam ? decodeURIComponent(categoryParam) : '';
            next.subcategory = subcategoryParam ? decodeURIComponent(subcategoryParam) : '';
            next.q = qParam ? decodeURIComponent(qParam) : '';
            next.city = cityParam ? decodeURIComponent(cityParam) : '';
            return next;
        });

        if (categoryParam) {
            setSearchCategory(decodeURIComponent(categoryParam));
        } else {
            setSearchCategory('');
        }
        if (qParam) {
            const decodedQ = decodeURIComponent(qParam);
            setSearchKeyword(decodedQ);
            trackSearch(decodedQ);
        } else {
            setSearchKeyword('');
        }

        const minSalaryParam = searchParams.get('minSalary');
        const maxSalaryParam = searchParams.get('maxSalary');
        if (minSalaryParam || maxSalaryParam) {
            const matched = findSalaryFilterByRange(minSalaryParam, maxSalaryParam);
            if (matched) {
                setFilters((prev) => ({ ...prev, salary: matched.value }));
            }
        }
    }, [searchParams]);

    useEffect(() => {
        const fetchPublicJobs = async () => {
            try {
                setLoading(true);
                const params = new URLSearchParams();

                const needsClientSideFilter =
                    filters.timePosted || filters.category || filters.subcategory || filters.experience;

                // Fetch more jobs when client-side category/subcategory or time filters apply
                if (needsClientSideFilter) {
                    params.set('page', '1');
                    params.set('limit', '1000');
                } else {
                    params.set('page', String(page));
                    params.set('limit', String(itemsPerPage));
                }

                // Don't send timePosted/salary (handled separately) or category/subcategory
                // to the backend: the backend does an exact `category = ?` match against a
                // slug (e.g. "information_technology"), but the UI passes the category NAME
                // (e.g. "Information Technology"). Category/subcategory are matched
                // client-side via applyCategorySubcategoryFilters instead.
                // Experience is also matched client-side because job records store values
                // like "1-2 years", not the filter slug.
                const SKIP_BACKEND_PARAMS = ['timePosted', 'salary', 'category', 'subcategory', 'experience'];
                Object.entries(filters).forEach(([k, v]) => {
                    if (v && !SKIP_BACKEND_PARAMS.includes(k)) params.set(k, v);
                });
                if (filters.salary) {
                    const salaryOpt = SALARY_FILTER_OPTIONS.find((o) => o.value === filters.salary);
                    if (salaryOpt) {
                        if (salaryOpt.minSalary != null) params.set('minSalary', String(salaryOpt.minSalary));
                        if (salaryOpt.maxSalary != null) params.set('maxSalary', String(salaryOpt.maxSalary));
                    }
                } else {
                    const urlMin = searchParams.get('minSalary');
                    const urlMax = searchParams.get('maxSalary');
                    if (urlMin) params.set('minSalary', urlMin);
                    if (urlMax) params.set('maxSalary', urlMax);
                }

                let resp = await fetch(`${API_BASE_URL}/api/jobs?${params.toString()}`, {
                    method: 'GET',
                    headers: { 'Accept': 'application/json' },
                    credentials: 'include'
                });
                if (!resp.ok) {
                    // fallback to employer jobs if public endpoint not available
                    resp = await fetch(`${API_BASE_URL}/api/employer/jobs`, {
                        method: 'GET',
                        headers: { 'Accept': 'application/json' },
                        credentials: 'include'
                    });
                }
                if (resp.ok) {
                    const data = await resp.json();
                    let list = Array.isArray(data.jobs) ? data.jobs : Array.isArray(data) ? data : [];

                    if (filters.category || filters.subcategory) {
                        list = applyCategorySubcategoryFilters(
                            list,
                            filters.category,
                            filters.subcategory
                        );
                    }

                    if (filters.experience) {
                        list = list.filter((job) => jobMatchesExperienceFilter(job, filters.experience));
                    }

                    // Filter by timePosted if selected (client-side filtering)
                    if (filters.timePosted) {
                        const now = new Date();
                        let cutoffDate = new Date();

                        switch (filters.timePosted) {
                            case '1_day':
                                cutoffDate.setDate(now.getDate() - 1);
                                break;
                            case '3_days':
                                cutoffDate.setDate(now.getDate() - 3);
                                break;
                            case '1_week':
                                cutoffDate.setDate(now.getDate() - 7);
                                break;
                            case '2_weeks':
                                cutoffDate.setDate(now.getDate() - 14);
                                break;
                            case '1_month':
                                cutoffDate.setMonth(now.getMonth() - 1);
                                break;
                            case '3_months':
                                cutoffDate.setMonth(now.getMonth() - 3);
                                break;
                            case '6_months':
                                cutoffDate.setMonth(now.getMonth() - 6);
                                break;
                            default:
                                cutoffDate = null;
                        }

                        if (cutoffDate) {
                            list = list.filter(job => {
                                const jobDate = new Date(job.createdAt || job.created_at || job.postedDate);
                                return jobDate >= cutoffDate && jobDate <= now;
                            });
                        }
                    }

                    if (needsClientSideFilter) {
                        // Apply client-side pagination after filtering
                        const startIndex = (page - 1) * itemsPerPage;
                        const endIndex = startIndex + itemsPerPage;
                        const paginatedList = list.slice(startIndex, endIndex);
                        const filteredTotal = list.length;
                        const filteredTotalPages = Math.ceil(filteredTotal / itemsPerPage);

                        setTotalPages(filteredTotalPages || 1);
                        setTotalJobs(filteredTotal);
                        setJobs(paginatedList);
                    } else {
                        // Normal server-side pagination
                        const p = data.pagination || {};
                        setTotalPages(p.totalPages || 1);
                        setTotalJobs(p.total || list.length);
                        setJobs(list);
                    }
                } else {
                    setMessage('Failed to load jobs');
                    setTimeout(() => setMessage(''), 4000);
                }
            } catch (_) {
                setMessage('Failed to load jobs');
                setTimeout(() => setMessage(''), 4000);
            } finally {
                setLoading(false);
            }
        };
        fetchPublicJobs();
    }, [API_BASE_URL, page, filters, itemsPerPage, searchParams]);

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

                const resp = await fetch(`${API_BASE_URL}/api/applications/mine`, {
                    headers: {
                        Authorization: `Bearer ${token}`,
                        Accept: 'application/json',
                    },
                });

                if (!resp.ok) return;

                const data = await resp.json();
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

    const toggleFilter = (name, value) => {
        setPage(1);
        setFilters(prev => {
            const next = { ...prev, [name]: prev[name] === value ? '' : value };
            if (name === 'category') {
                next.subcategory = '';
            }
            return next;
        });
    };

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
                if (applyJob?.id || applyJob?._id) {
                    const appliedId = String(applyJob.id || applyJob._id);
                    setAppliedJobIds((prev) => {
                        const next = new Set(prev);
                        next.add(appliedId);
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
                    if (applyJob?.id || applyJob?._id) {
                        const appliedId = String(applyJob.id || applyJob._id);
                        setAppliedJobIds((prev) => {
                            const next = new Set(prev);
                            next.add(appliedId);
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

    return (

        <>
            <PageSEO
                title="Top Manpower Consultancy in Bhubaneswar | Uptula Jobs"
                description="Looking for top job vacancies in Bhubaneswar? Uptula is Odisha's trusted manpower consultancy. Find jobs near you and get hired faster. Apply today."
            />
            {message && (
                <div className={`alert ${message.includes('Failed') ? 'alert-danger' : 'alert-success'}`} style={{ position: 'fixed', top: '20px', right: '20px', zIndex: 9999 }}>
                    {message}
                </div>
            )}
            <Header />

            {drawerOpen && (
                <div style={mobileFilterStyles.overlay} onClick={() => setDrawerOpen(false)}>
                    <div
                        ref={drawerRef}
                        style={mobileFilterStyles.drawer(drawerOpen)}
                        onClick={(e) => e.stopPropagation()}
                        role="dialog"
                        aria-modal="true"
                        aria-label="Job filters"
                    >
                        <div style={mobileFilterStyles.drawerHead}>
                            <h5 style={mobileFilterStyles.drawerTitle}>Filters</h5>
                            <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
                                {activeFilterCount > 0 && (
                                    <button type="button" style={mobileFilterStyles.clearAll} onClick={clearAllFilters}>
                                        Clear all
                                    </button>
                                )}
                                <button type="button" style={mobileFilterStyles.closeBtn} onClick={() => setDrawerOpen(false)} aria-label="Close filters">
                                    ✕
                                </button>
                            </div>
                        </div>
                        <MobileFilterPanel
                            filters={filters}
                            setFilters={setFilters}
                            setPage={setPage}
                            setSearchKeyword={setSearchKeyword}
                            toggleFilter={toggleFilter}
                            onApply={() => setDrawerOpen(false)}
                            jobCategories={jobCategories}
                            categorySubcategories={categorySubcategories}
                        />
                    </div>
                </div>
            )}

            {/* ====================== Start Job Detail 2 ================ */}
            <section className="njk-listing-section" style={{ background: '#f2f4f8', padding: '110px 0 64px' }}>
                <style>{`
                        .njk-wrap { max-width: 1240px; margin: 0 auto; padding: 0 16px; }
                        .njk-grid { display: flex; align-items: flex-start; gap: 22px; }
                        .njk-sidebar { width: 290px; flex-shrink: 0; }
                        .njk-main { flex: 1; min-width: 0; }
                        .njk-mobilebar { display: none; }
                        .njk-skill-chip {
                            background: #f1f5f9; color: #475569; border-radius: 999px;
                            padding: 4px 11px; font-size: 12px; font-weight: 500;
                            max-width: 100%;
                            min-width: 0;
                            overflow: hidden;
                            text-overflow: ellipsis;
                            white-space: nowrap;
                            display: inline-block;
                            vertical-align: top;
                            box-sizing: border-box;
                        }
                        .njk-card-title { color: #0f172a; }
                        .njk-card-title:hover { color: ${GREEN}; }
                        .njk-apply-btn {
                            background: ${GREEN}; color: #fff; border: none; border-radius: 9px;
                            padding: 9px 20px; font-size: 14px; font-weight: 600; cursor: pointer;
                            transition: background 150ms ease; white-space: nowrap;
                        }
                        .njk-apply-btn:hover { background: ${GREEN_DARK}; }
                        .njk-mobile-filter-btn { display: none !important; }
                        @media (max-width: 991px) {
                            .njk-sidebar { display: none; }
                            .njk-grid { gap: 0; }
                            .njk-mobile-filter-btn { display: inline-flex !important; }
                        }
                        @media (max-width: 600px) {
                            .njk-listing-section { padding: 18px 0 48px; }
                            .njk-card-meta { gap: 10px 14px; }
                        }

                        /* ---- Clean, light hero header (Naukri/LinkedIn style) ---- */
                        .njk-hero {
                            position: relative;
                            z-index: 30;
                            border-radius: 20px;
                            padding: 40px 40px 34px;
                            margin-bottom: 22px;
                            background: linear-gradient(135deg, #eafaf1 0%, #e3f7ea 55%, #eef8f0 100%);
                            border: 1px solid rgba(22,163,74,0.10);
                            overflow: visible;
                        }
                        .njk-hero-grid {
                            display: flex;
                            align-items: center;
                            justify-content: space-between;
                            gap: 32px;
                        }
                        .njk-hero-left { flex: 1; min-width: 0; max-width: 620px; }
                        .njk-hero-title {
                            margin: 0 0 8px;
                            color: #0f172a;
                            font-size: 32px;
                            font-weight: 800;
                            line-height: 1.22;
                        }
                        .njk-hero-title-accent { color: ${GREEN}; }
                        .njk-hero-sub { margin: 0 0 22px; color: #56606f; font-size: 15px; }

                        .njk-hero-searchrow { position: relative; }
                        .njk-hero-searchbox {
                            display: flex; align-items: stretch; gap: 0;
                            background: #fff;
                            border: 1px solid #e2e8f0;
                            border-radius: 12px;
                            padding: 6px;
                            box-shadow: 0 10px 26px rgba(15,23,42,0.08);
                        }
                        .njk-hero-field {
                            flex: 1; min-width: 0;
                            display: flex; align-items: center; gap: 9px;
                            padding: 9px 12px;
                        }
                        .njk-hero-field + .njk-hero-field {
                            border-left: 1px solid #eef1f5;
                        }
                        .njk-hero-field svg { color: #94a3b8; font-size: 17px; flex-shrink: 0; }
                        .njk-hero-input {
                            flex: 1; min-width: 0; border: none; outline: none;
                            background: transparent; font-size: 14px; color: #0f172a;
                        }
                        .njk-hero-input::placeholder { color: #94a3b8; }
                        .njk-hero-btn {
                            display: inline-flex; align-items: center; gap: 7px;
                            background: ${GREEN}; color: #fff; border: none;
                            border-radius: 9px; padding: 0 20px; font-size: 14px;
                            font-weight: 700; cursor: pointer; white-space: nowrap;
                            transition: background 150ms ease;
                        }
                        .njk-hero-btn:hover { background: ${GREEN_DARK}; }

                        .njk-hero-popular {
                            display: flex; align-items: center; flex-wrap: wrap;
                            gap: 8px; margin-top: 16px; font-size: 13px; color: #64748b;
                        }
                        .njk-hero-popular-chip {
                            background: rgba(255,255,255,0.7);
                            border: 1px solid rgba(22,163,74,0.18);
                            color: #14532d;
                            border-radius: 999px;
                            padding: 5px 13px;
                            font-size: 12.5px;
                            font-weight: 600;
                            cursor: pointer;
                            transition: background 150ms ease, border-color 150ms ease;
                        }
                        .njk-hero-popular-chip:hover { background: #fff; border-color: ${GREEN}; }

                        .njk-suggest {
                            position: absolute; top: calc(100% + 8px); left: 0; right: 0;
                            background: #fff; border: 1px solid rgba(148,163,184,0.22);
                            border-radius: 14px; box-shadow: 0 16px 40px rgba(15,23,42,0.16);
                            z-index: 50; overflow: hidden;
                        }
                        .njk-suggest-head {
                            display: flex; align-items: center; gap: 7px;
                            padding: 9px 14px; font-size: 11px; font-weight: 700;
                            letter-spacing: 0.5px; text-transform: uppercase;
                            color: ${GREEN}; background: rgba(22,163,74,0.10);
                            border-bottom: 1px solid rgba(22,163,74,0.14);
                        }
                        .njk-suggest-item {
                            display: flex; align-items: center; gap: 10px;
                            padding: 10px 14px; font-size: 14px; color: #0f172a;
                            cursor: pointer; border: none; background: none;
                            width: 100%; text-align: left;
                        }
                        .njk-suggest-item:hover, .njk-suggest-item.active {
                            background: rgba(22,163,74,0.10);
                        }
                        .njk-suggest-item .njk-suggest-ico { color: #94a3b8; font-size: 14px; flex-shrink: 0; }
                        .njk-suggest-item.active .njk-suggest-ico { color: ${GREEN}; }

                        /* ---- Hero side illustration (decorative, CSS-only) ---- */
                        .njk-hero-art {
                            position: relative;
                            width: 190px; height: 170px;
                            flex-shrink: 0;
                            display: flex; align-items: center; justify-content: center;
                        }
                        .njk-hero-art-blob {
                            position: absolute; inset: 8px;
                            background: radial-gradient(circle at 35% 30%, rgba(255,255,255,0.9), rgba(22,163,74,0.14));
                            border-radius: 42% 58% 55% 45% / 48% 42% 58% 52%;
                        }
                        .njk-hero-art-icon {
                            position: absolute;
                            display: inline-flex; align-items: center; justify-content: center;
                            border-radius: 14px;
                            background: #fff;
                            box-shadow: 0 8px 20px rgba(15,23,42,0.12);
                        }
                        .njk-hero-art-icon.ico-1 { width: 58px; height: 58px; left: 10px; top: 18px; color: ${GREEN}; font-size: 24px; }
                        .njk-hero-art-icon.ico-2 { width: 46px; height: 46px; right: 6px; top: 4px; color: #2563eb; font-size: 19px; }
                        .njk-hero-art-icon.ico-3 { width: 64px; height: 64px; right: 12px; bottom: 10px; color: #16a34a; font-size: 26px; }
                        .njk-hero-art-star { position: absolute; top: 2px; right: 40px; color: #f59e0b; font-size: 22px; }

                        @media (max-width: 991px) {
                            .njk-hero-art { display: none; }
                        }
                        @media (max-width: 700px) {
                            .njk-hero { padding: 22px 18px; border-radius: 16px; }
                            .njk-hero-title { font-size: 22px; }
                            .njk-hero-searchbox { flex-direction: column; padding: 8px; gap: 4px; }
                            .njk-hero-field + .njk-hero-field { border-left: none; border-top: 1px solid #eef1f5; }
                            .njk-hero-btn { width: 100%; justify-content: center; height: 42px; margin-top: 4px; }
                        }

                        /* ---- Stat infographic band ---- */
                        .njk-stats {
                            display: grid; grid-template-columns: repeat(4, 1fr);
                            gap: 14px; margin-bottom: 22px;
                        }
                        .njk-stat-tile {
                            display: flex; align-items: center; gap: 12px;
                            background: #fff; border: 1px solid rgba(148,163,184,0.18);
                            border-radius: 14px; padding: 15px 16px;
                            box-shadow: 0 6px 18px rgba(15,23,42,0.05);
                        }
                        .njk-stat-icon {
                            display: inline-flex; align-items: center; justify-content: center;
                            width: 40px; height: 40px; flex-shrink: 0; border-radius: 11px;
                            font-size: 19px;
                        }
                        .njk-stat-value { font-size: 20px; font-weight: 800; color: #0f172a; line-height: 1.1; }
                        .njk-stat-label { font-size: 12.5px; color: #64748b; font-weight: 600; }

                        @media (max-width: 700px) {
                            .njk-stats { grid-template-columns: repeat(2, 1fr); }
                        }
                    `}</style>
                <div className="njk-wrap">
                    {/* Clean hero header with keyword + location search */}
                    <motion.div
                        className="njk-hero"
                        initial={{ opacity: 0, y: -18 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, ease: 'easeOut' }}
                    >
                        <div className="njk-hero-grid">
                            <div className="njk-hero-left">
                                <h1 className="njk-hero-title">
                                    Find your <span className="njk-hero-title-accent">dream job</span>
                                </h1>
                                <p className="njk-hero-sub">
                                    Discover opportunities that match your skills and grow your career.
                                </p>

                                <div className="njk-hero-searchrow" ref={suggestRef}>
                                    <div className="njk-hero-searchbox">
                                        <div className="njk-hero-field">
                                            <FiSearch aria-hidden="true" />
                                            <input
                                                type="text"
                                                className="njk-hero-input"
                                                placeholder="Job title, keyword or company"
                                                value={filters.q}
                                                aria-label="Search jobs"
                                                autoComplete="off"
                                                onChange={(e) => {
                                                    const q = e.target.value;
                                                    setFilters((prev) => ({ ...prev, q }));
                                                    setSearchKeyword(q);
                                                    setPage(1);
                                                    setShowSuggestions(q.length >= 1);
                                                    setHighlightIndex(-1);
                                                    trackSearchDebounced(q);
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
                                        </div>
                                        <div className="njk-hero-field">
                                            <FiMapPin aria-hidden="true" />
                                            <input
                                                type="text"
                                                className="njk-hero-input"
                                                placeholder="Location"
                                                value={filters.city}
                                                aria-label="Location"
                                                autoComplete="off"
                                                onChange={(e) => {
                                                    setFilters((prev) => ({ ...prev, city: e.target.value }));
                                                    setPage(1);
                                                }}
                                                onKeyDown={(e) => {
                                                    if (e.key === 'Enter') {
                                                        e.preventDefault();
                                                        runSearch(filters.q);
                                                    }
                                                }}
                                            />
                                        </div>
                                        <button
                                            type="button"
                                            className="njk-hero-btn"
                                            onClick={() => runSearch(filters.q)}
                                        >
                                            <FiSearch aria-hidden="true" /> Search Jobs
                                        </button>
                                    </div>

                                    {showSuggestions && suggestions.length > 0 && (
                                        <motion.div
                                            className="njk-suggest"
                                            initial={{ opacity: 0, y: -6 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ duration: 0.18 }}
                                            role="listbox"
                                        >
                                            <div className="njk-suggest-head">
                                                <FiZap aria-hidden="true" /> Suggestions
                                            </div>
                                            {suggestions.map((s, idx) => (
                                                <button
                                                    type="button"
                                                    key={`${s}-${idx}`}
                                                    role="option"
                                                    aria-selected={idx === highlightIndex}
                                                    className={`njk-suggest-item${idx === highlightIndex ? ' active' : ''}`}
                                                    onMouseEnter={() => setHighlightIndex(idx)}
                                                    onMouseDown={(e) => { e.preventDefault(); runSearch(s); }}
                                                >
                                                    <FiSearch className="njk-suggest-ico" aria-hidden="true" />
                                                    {s}
                                                </button>
                                            ))}
                                        </motion.div>
                                    )}
                                </div>

                                <div className="njk-hero-popular">
                                    <span>Popular searches:</span>
                                    {POPULAR_SEARCHES.map((term) => (
                                        <button
                                            type="button"
                                            key={term}
                                            className="njk-hero-popular-chip"
                                            onClick={() => runSearch(term)}
                                        >
                                            {term}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="njk-hero-art" aria-hidden="true">
                                <div className="njk-hero-art-blob" />
                                <span className="njk-hero-art-star">★</span>
                                <span className="njk-hero-art-icon ico-1"><FiBriefcase /></span>
                                <span className="njk-hero-art-icon ico-2"><FiTrendingUp /></span>
                                <span className="njk-hero-art-icon ico-3"><FiSearch /></span>
                            </div>
                        </div>
                    </motion.div>

                    <div className="njk-grid">
                        {/* Left Filters Section (Naukri-style) */}
                        <aside className="njk-sidebar">
                            <div style={sidebarStyles.panel}>
                                <div style={sidebarStyles.head}>
                                    <h4 style={sidebarStyles.headTitle}>
                                        All Filters
                                        {activeFilterCount > 0 && (
                                            <span style={sidebarStyles.headBadge}>{activeFilterCount}</span>
                                        )}
                                    </h4>
                                    {activeFilterCount > 0 && (
                                        <button type="button" style={sidebarStyles.clearLink} onClick={clearAllFilters}>
                                            Clear all
                                        </button>
                                    )}
                                </div>

                                <SidebarSection title="Experience" defaultOpen>
                                    {EXPERIENCE_FILTER_OPTIONS.map((o) => (
                                        <label key={o.value} style={sidebarStyles.checkRow} htmlFor={`d-exp-${o.value}`}>
                                            <input id={`d-exp-${o.value}`} type="checkbox" style={sidebarStyles.checkbox}
                                                checked={filters.experience === o.value}
                                                onChange={() => toggleFilter('experience', o.value)} />
                                            {o.label}
                                        </label>
                                    ))}
                                </SidebarSection>

                                <SidebarSection title="Salary" defaultOpen>
                                    {SALARY_FILTER_OPTIONS.map((opt) => (
                                        <label key={opt.value} style={sidebarStyles.checkRow} htmlFor={`d-sal-${opt.value}`}>
                                            <input id={`d-sal-${opt.value}`} type="checkbox" style={sidebarStyles.checkbox}
                                                checked={filters.salary === opt.value}
                                                onChange={() => toggleFilter('salary', opt.value)} />
                                            {opt.label}
                                        </label>
                                    ))}
                                </SidebarSection>

                                <SidebarSection title="Job Type" defaultOpen>
                                    {[
                                        { v: 'full_time', l: 'Full Time' },
                                        { v: 'part_time', l: 'Part Time' },
                                        { v: 'internship', l: 'Internship' },
                                        { v: 'freelancer', l: 'Freelancer' },
                                        { v: 'contract', l: 'Contract' },
                                    ].map((o) => (
                                        <label key={o.v} style={sidebarStyles.checkRow} htmlFor={`d-jt-${o.v}`}>
                                            <input id={`d-jt-${o.v}`} type="checkbox" style={sidebarStyles.checkbox}
                                                checked={filters.jobType === o.v}
                                                onChange={() => toggleFilter('jobType', o.v)} />
                                            {o.l}
                                        </label>
                                    ))}
                                </SidebarSection>

                                <SidebarSection title="Industry / Category">
                                    {jobCategories.map((cat, idx) => (
                                        <React.Fragment key={cat.id}>
                                            <label style={sidebarStyles.checkRow} htmlFor={`d-cat-${idx}`}>
                                                <input id={`d-cat-${idx}`} type="checkbox" style={sidebarStyles.checkbox}
                                                    checked={filters.category === cat.name}
                                                    onChange={() => toggleFilter('category', cat.name)} />
                                                {cat.name}
                                            </label>
                                            {filters.category === cat.name
                                                ? categorySubcategories.map((sub, subIdx) => (
                                                    <label key={sub.id}
                                                        style={{ ...sidebarStyles.checkRow, paddingLeft: '24px', fontSize: '13px' }}
                                                        htmlFor={`d-sub-${idx}-${subIdx}`}>
                                                        <input id={`d-sub-${idx}-${subIdx}`} type="checkbox" style={sidebarStyles.checkbox}
                                                            checked={filters.subcategory === sub.name}
                                                            onChange={() => toggleFilter('subcategory', sub.name)} />
                                                        {sub.name}
                                                    </label>
                                                ))
                                                : null}
                                        </React.Fragment>
                                    ))}
                                </SidebarSection>

                                <SidebarSection title="Date Posted">
                                    {[
                                        { v: '1_day', l: 'Last 1 day' },
                                        { v: '3_days', l: 'Last 3 days' },
                                        { v: '1_week', l: 'Last 1 week' },
                                        { v: '2_weeks', l: 'Last 2 weeks' },
                                        { v: '1_month', l: 'Last 1 month' },
                                        { v: '3_months', l: 'Last 3 months' },
                                        { v: '6_months', l: 'Last 6 months' },
                                    ].map((o) => (
                                        <label key={o.v} style={sidebarStyles.checkRow} htmlFor={`d-time-${o.v}`}>
                                            <input id={`d-time-${o.v}`} type="checkbox" style={sidebarStyles.checkbox}
                                                checked={filters.timePosted === o.v}
                                                onChange={() => toggleFilter('timePosted', o.v)} />
                                            {o.l}
                                        </label>
                                    ))}
                                </SidebarSection>

                                <SidebarSection title="Designation">
                                    {[
                                        { v: 'web_designer', l: 'Web Designer' },
                                        { v: 'php_developer', l: 'PHP Developer' },
                                        { v: 'project_manager', l: 'Project Manager' },
                                        { v: 'human_resource', l: 'Human Resource' },
                                        { v: 'cms_developer', l: 'CMS Developer' },
                                        { v: 'app_developer', l: 'App Developer' },
                                    ].map((o) => (
                                        <label key={o.v} style={sidebarStyles.checkRow} htmlFor={`d-des-${o.v}`}>
                                            <input id={`d-des-${o.v}`} type="checkbox" style={sidebarStyles.checkbox}
                                                checked={filters.designation === o.v}
                                                onChange={() => toggleFilter('designation', o.v)} />
                                            {o.l}
                                        </label>
                                    ))}
                                </SidebarSection>
                            </div>
                        </aside>
                        {/* Main Section - Job Cards (Naukri-style) */}
                        <div className="njk-main">
                            <div style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                flexWrap: 'nowrap',
                                gap: '8px',
                                marginBottom: '16px',
                            }}>
                                <h4 style={{ margin: 0, fontSize: '18px', fontWeight: 700, color: '#0f172a' }}>
                                    {totalJobs} {totalJobs === 1 ? 'job' : 'jobs'} found
                                </h4>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexShrink: 0 }}>
                                    {activeFilterCount > 0 && (
                                        <button
                                            type="button"
                                            onClick={clearAllFilters}
                                            style={{
                                                background: 'none', border: 'none', cursor: 'pointer',
                                                color: GREEN, fontSize: '13px', fontWeight: 600, padding: 0,
                                            }}
                                        >
                                            Clear all filters
                                        </button>
                                    )}
                                    <button
                                        type="button"
                                        className="njk-mobile-filter-btn"
                                        style={mobileFilterStyles.filterBtn}
                                        onClick={() => setDrawerOpen(true)}
                                    >
                                        <i className="ti-filter" />
                                        Filters
                                        {activeFilterCount > 0 && (
                                            <span style={mobileFilterStyles.filterBadge}>{activeFilterCount}</span>
                                        )}
                                    </button>
                                </div>
                            </div>

                            {/* Active filters — shows the selected category/keyword with a readable label */}
                            {(filters.q || filters.category || filters.subcategory || filters.city) && (
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '16px' }}>
                                    {[
                                        filters.q && { key: 'q', label: `"${filters.q}"` },
                                        filters.category && { key: 'category', label: formatCategoryName(filters.category) },
                                        filters.subcategory && { key: 'subcategory', label: formatCategoryName(filters.subcategory) },
                                        filters.city && { key: 'city', label: filters.city },
                                    ].filter(Boolean).map((chip) => (
                                        <span
                                            key={chip.key}
                                            style={{
                                                display: 'inline-flex', alignItems: 'center', gap: '6px',
                                                background: 'rgba(22,163,74,0.10)', color: GREEN,
                                                borderRadius: '999px', padding: '6px 12px',
                                                fontSize: '13px', fontWeight: 600,
                                            }}
                                        >
                                            {chip.label}
                                            <button
                                                type="button"
                                                onClick={() => toggleFilter(chip.key, filters[chip.key])}
                                                aria-label={`Remove ${chip.label}`}
                                                style={{ background: 'none', border: 'none', color: GREEN, cursor: 'pointer', padding: 0, fontSize: '15px', lineHeight: 1 }}
                                            >
                                                ×
                                            </button>
                                        </span>
                                    ))}
                                </div>
                            )}
                            {loading ? (
                                <div>
                                    {Array.from({ length: 4 }).map((_, i) => (
                                        <div key={i} style={{
                                            background: '#fff',
                                            border: '1px solid rgba(148,163,184,0.18)',
                                            borderRadius: '14px',
                                            boxShadow: '0 6px 18px rgba(15,23,42,0.06)',
                                            padding: '18px',
                                            marginBottom: '16px',
                                        }}>
                                            <div style={{ display: 'flex', gap: '14px' }}>
                                                <div style={{ width: '52px', height: '52px', borderRadius: '10px', background: '#eef2f7', flexShrink: 0 }} />
                                                <div style={{ flex: 1 }}>
                                                    <div style={{ width: '60%', height: '15px', borderRadius: '6px', background: '#eef2f7', marginBottom: '10px' }} />
                                                    <div style={{ width: '40%', height: '12px', borderRadius: '6px', background: '#f1f5f9', marginBottom: '14px' }} />
                                                    <div style={{ width: '85%', height: '10px', borderRadius: '6px', background: '#f1f5f9' }} />
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                    <p style={{ textAlign: 'center', color: '#64748b', fontSize: '14px' }}>Loading jobs…</p>
                                </div>
                            ) : jobs.length === 0 ? (
                                <div style={{
                                    background: '#fff',
                                    border: '1px solid rgba(148,163,184,0.18)',
                                    borderRadius: '14px',
                                    boxShadow: '0 6px 18px rgba(15,23,42,0.06)',
                                    padding: '48px 20px',
                                    textAlign: 'center',
                                }}>
                                    <i className="ti-search" style={{ fontSize: '34px', color: '#94a3b8' }} />
                                    <h4 style={{ margin: '14px 0 6px', fontSize: '18px', fontWeight: 700, color: '#0f172a' }}>
                                        No results found
                                    </h4>
                                    <p style={{ margin: '0 0 18px', color: '#64748b', fontSize: '14px' }}>
                                        We couldn't find any jobs matching your filters. Try adjusting them.
                                    </p>
                                    {activeFilterCount > 0 && (
                                        <button
                                            type="button"
                                            onClick={clearAllFilters}
                                            style={{
                                                background: GREEN, color: '#fff', border: 'none',
                                                borderRadius: '9px', padding: '10px 22px',
                                                fontSize: '14px', fontWeight: 600, cursor: 'pointer',
                                            }}
                                        >
                                            Clear all filters
                                        </button>
                                    )}
                                </div>
                            ) : (
                                jobs.map((job) => {
                                    const id = job._id || job.id;
                                    const isApplied = appliedJobIds.has(String(id));
                                    const logoPath = job.companyLogoUrl;
                                    const logo = logoPath && (logoPath.startsWith('http') || logoPath.startsWith('data:'))
                                        ? logoPath
                                        : logoPath
                                            ? `${API_BASE_URL}${logoPath.startsWith('/') ? logoPath : `/${logoPath}`}`
                                            : '';
                                    const title = job.jobTitle || job.title;
                                    const company = job.companyName || job.company || '';
                                    const location = job.city || job.state || job.country || job.address || '—';
                                    const jobType = job.jobType || job.job_type || '—';
                                    const jobSlug = title ? `${createSlug(title)}-${id}` : id;
                                    const experience = job.experience || job.experienceRequired || job.experience_required || job.minExperience || '';
                                    const salaryDisplay = formatJobSalary(job);
                                    const skillsRaw = job.skills || job.keySkills || job.key_skills || job.skillsRequired || '';
                                    const skillList = (Array.isArray(skillsRaw) ? skillsRaw : String(skillsRaw).split(','))
                                        .map((s) => String(s).trim())
                                        .filter(Boolean);

                                    // Calculate time posted
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
                                    const timePosted = getTimeAgo(job.createdAt || job.created_at || job.postedDate);

                                    return (
                                        <div
                                            key={id}
                                            onClick={() => navigate(`/jobs/${jobSlug}`)}
                                            style={{
                                                cursor: 'pointer',
                                                backgroundColor: '#fff',
                                                borderRadius: '14px',
                                                padding: '18px',
                                                boxShadow: '0 6px 18px rgba(15,23,42,0.06)',
                                                transition: 'box-shadow 0.2s ease, transform 0.2s ease',
                                                position: 'relative',
                                                border: '1px solid rgba(148,163,184,0.18)',
                                                marginBottom: '16px',
                                            }}
                                            onMouseEnter={(e) => {
                                                e.currentTarget.style.boxShadow = '0 10px 26px rgba(15,23,42,0.10)';
                                                e.currentTarget.style.transform = 'translateY(-2px)';
                                            }}
                                            onMouseLeave={(e) => {
                                                e.currentTarget.style.boxShadow = '0 6px 18px rgba(15,23,42,0.06)';
                                                e.currentTarget.style.transform = 'translateY(0)';
                                            }}
                                        >
                                            {/* Header row: logo + title/company + wishlist */}
                                            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '14px' }}>
                                                <div style={{
                                                    width: '52px', height: '52px', minWidth: '52px',
                                                    borderRadius: '10px', overflow: 'hidden',
                                                    border: '1px solid #e2e8f0',
                                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                    backgroundColor: '#f8fafc',
                                                }}>
                                                    <img
                                                        src={logo}
                                                        alt={company}
                                                        style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                                                        onError={(e) => { e.target.src = "/assets/img/company_logo_1.png"; }}
                                                    />
                                                </div>

                                                <div style={{ flex: 1, minWidth: 0, paddingRight: '36px' }}>
                                                    <Link
                                                        to={`/jobs/${jobSlug}`}
                                                        className="njk-card-title"
                                                        onClick={(e) => e.stopPropagation()}
                                                        style={{
                                                            display: 'block',
                                                            margin: '0 0 3px',
                                                            fontSize: '16px',
                                                            fontWeight: 700,
                                                            lineHeight: 1.3,
                                                            textDecoration: 'none',
                                                            wordBreak: 'break-word',
                                                        }}
                                                    >
                                                        {title}
                                                    </Link>
                                                    <div style={{ fontSize: '13px', color: '#475569', fontWeight: 500 }}>
                                                        {company || '—'}
                                                    </div>
                                                </div>

                                                {/* Wishlist - top right */}
                                                <div
                                                    style={{ position: 'absolute', top: '16px', right: '16px', zIndex: 10 }}
                                                    onClick={(e) => e.stopPropagation()}
                                                >
                                                    {user && user.role === 'seeker' && id && <WishlistButton jobId={String(id)} />}
                                                </div>
                                            </div>

                                            {/* Meta row: experience, salary, location */}
                                            <div className="njk-card-meta" style={{
                                                display: 'flex', flexWrap: 'wrap',
                                                gap: '8px 18px', margin: '12px 0',
                                                fontSize: '13px', color: '#475569',
                                            }}>
                                                {experience && (
                                                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                                                        <i className="ti-stats-up" style={{ color: GREEN, fontSize: '14px' }} />
                                                        {experience}
                                                    </span>
                                                )}
                                                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                                                    <span style={{ color: GREEN, fontWeight: 700 }}>₹</span>
                                                    {salaryDisplay || 'Not disclosed'}
                                                </span>
                                                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                                                    <i className="ti-location-pin" style={{ color: GREEN, fontSize: '14px' }} />
                                                    {location}
                                                </span>
                                                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                                                    <i className="ti-briefcase" style={{ color: GREEN, fontSize: '14px' }} />
                                                    {jobType.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                                                </span>
                                            </div>

                                            {/* Skill chips */}
                                            {skillList.length > 0 && (
                                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '14px', width: '100%', minWidth: 0, overflow: 'hidden' }}>
                                                    {skillList.slice(0, 6).map((skill, i) => (
                                                        <span key={i} className="njk-skill-chip">{skill}</span>
                                                    ))}
                                                    {skillList.length > 6 && (
                                                        <span className="njk-skill-chip">+{skillList.length - 6} more</span>
                                                    )}
                                                </div>
                                            )}

                                            {/* Footer row: posted time + apply */}
                                            <div style={{
                                                display: 'flex', alignItems: 'center',
                                                justifyContent: 'space-between', gap: '12px',
                                                flexWrap: 'wrap',
                                                borderTop: '1px solid #f1f5f9', paddingTop: '12px',
                                            }}>
                                                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: '#94a3b8' }}>
                                                    <i className="ti-time" style={{ fontSize: '13px' }} />
                                                    {timePosted}
                                                </span>
                                                {(!user || user.role === 'seeker') && (
                                                    <div onClick={(e) => e.stopPropagation()}>
                                                        {isApplied ? (
                                                            <span style={{
                                                                display: 'inline-flex', alignItems: 'center', gap: '6px',
                                                                color: GREEN, fontWeight: 600, fontSize: '14px',
                                                            }}>
                                                                <i className="ti-check" style={{ fontSize: '14px' }} />
                                                                Applied
                                                            </span>
                                                        ) : (
                                                            <button
                                                                type="button"
                                                                className="njk-apply-btn"
                                                                onClick={(e) => { e.stopPropagation(); openApply(job); }}
                                                            >
                                                                Apply Now
                                                            </button>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })
                            )}
                            <div className="clearfix" />
                            {/* Pagination */}
                            {totalPages > 1 && (
                                <div style={{ marginTop: '24px' }}>
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
                                            style={{
                                                padding: '8px 12px',
                                                backgroundColor: page === 1 ? '#f1f5f9' : '#fff',
                                                color: page === 1 ? '#94a3b8' : GREEN,
                                                border: '1px solid #e2e8f0',
                                                borderRadius: '8px',
                                                cursor: page === 1 ? 'not-allowed' : 'pointer',
                                                fontSize: '14px',
                                                fontWeight: '600',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                minWidth: '36px',
                                                height: '36px'
                                            }}
                                            title="Previous"
                                        >
                                            <span aria-hidden="true">«</span>
                                        </button>

                                        {Array.from({ length: totalPages }).map((_, idx) => (
                                            <button
                                                key={idx}
                                                onClick={() => setPage(idx + 1)}
                                                style={{
                                                    padding: '8px 12px',
                                                    backgroundColor: page === (idx + 1) ? GREEN : '#fff',
                                                    color: page === (idx + 1) ? '#fff' : '#475569',
                                                    border: '1px solid',
                                                    borderColor: page === (idx + 1) ? GREEN : '#e2e8f0',
                                                    borderRadius: '8px',
                                                    cursor: 'pointer',
                                                    fontSize: '13px',
                                                    fontWeight: '600',
                                                    minWidth: '36px',
                                                    height: '36px',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center'
                                                }}
                                            >
                                                {idx + 1}
                                            </button>
                                        ))}

                                        <button
                                            onClick={() => { if (page < totalPages) setPage(page + 1); }}
                                            disabled={page === totalPages}
                                            style={{
                                                padding: '8px 12px',
                                                backgroundColor: page === totalPages ? '#f1f5f9' : '#fff',
                                                color: page === totalPages ? '#94a3b8' : GREEN,
                                                border: '1px solid #e2e8f0',
                                                borderRadius: '8px',
                                                cursor: page === totalPages ? 'not-allowed' : 'pointer',
                                                fontSize: '14px',
                                                fontWeight: '600',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                minWidth: '36px',
                                                height: '36px'
                                            }}
                                            title="Next"
                                        >
                                            <span aria-hidden="true">»</span>
                                        </button>
                                    </div>
                                    <div style={{
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        gap: '10px', marginTop: '16px', fontSize: '13px', color: '#64748b',
                                    }}>
                                        <span>Show</span>
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
                                                width: '160px',
                                                height: '6px',
                                                borderRadius: '3px',
                                                background: `linear-gradient(to right, ${GREEN} 0%, ${GREEN} ${(itemsPerPage - 1) / 19 * 100}%, #e2e8f0 ${(itemsPerPage - 1) / 19 * 100}%, #e2e8f0 100%)`,
                                                outline: 'none',
                                                cursor: 'pointer',
                                                WebkitAppearance: 'none',
                                                appearance: 'none'
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
                                                        background: ${GREEN};
                                                        cursor: pointer;
                                                        border: 2px solid #fff;
                                                        box-shadow: 0 2px 4px rgba(0,0,0,0.2);
                                                    }
                                                    input[type="range"]::-moz-range-thumb {
                                                        width: 18px;
                                                        height: 18px;
                                                        border-radius: 50%;
                                                        background: ${GREEN};
                                                        cursor: pointer;
                                                        border: 2px solid #fff;
                                                        box-shadow: 0 2px 4px rgba(0,0,0,0.2);
                                                    }
                                                `}
                                        </style>
                                        <span><strong style={{ color: '#0f172a' }}>{itemsPerPage}</strong> per page</span>
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
                                <form onSubmit={(e) => { e.preventDefault(); submitApplication(); }}>
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
                                                onChange={(e) => setApplyForm(prev => ({ ...prev, name: e.target.value }))}
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
                                                onChange={(e) => setApplyForm(prev => ({ ...prev, email: e.target.value }))}
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
                                                onChange={(e) => setApplyForm(prev => ({ ...prev, phone: e.target.value }))}
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
                                                onChange={(e) => setApplyForm(prev => ({ ...prev, resume: e.target.files && e.target.files[0] }))}
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
                                                onChange={(e) => setApplyForm(prev => ({ ...prev, pastedCv: e.target.value }))}
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
                                    <div className="col-md-12" style={{ marginTop: '15px', textAlign: 'center', marginBottom: '0' }}>
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

            <MobileAppDownload />
            <Footer />
        </>
    );
}

export default AllJobs;








// import React, { useEffect, useState, useRef } from "react";
// import { useNavigate, useSearchParams } from "react-router-dom";
// import { useAuth } from "../context/AuthContext";
// import Header from "../Components/Header";
// import Footer from "../Components/Footer";
// import MobileAppDownload from "../Components/MobileAppDownload";
// import { API_BASE_URL } from "../config/api";
// import WishlistButton from "../Components/WishlistButton";
// import { trackSearch, trackSearchDebounced } from "../utils/trackActivity";

// /* ─── Salary brackets (sent as minSalary / maxSalary query params) ─────── */
// const SALARY_BRACKETS = [
//   { label: "Under ₹15,000",         minSalary: null,   maxSalary: 15000  },
//   { label: "₹15,000 – ₹30,000",    minSalary: 15000,  maxSalary: 30000  },
//   { label: "₹30,000 – ₹50,000",    minSalary: 30000,  maxSalary: 50000  },
//   { label: "₹50,000 – ₹1,00,000",  minSalary: 50000,  maxSalary: 100000 },
//   { label: "₹1,00,000+",           minSalary: 100000, maxSalary: null   },
// ];

// const TIME_OPTIONS = [
//   { label: "Last 24 hours",  value: "1_day"    },
//   { label: "Last 3 days",    value: "3_days"   },
//   { label: "Last week",      value: "1_week"   },
//   { label: "Last 2 weeks",   value: "2_weeks"  },
//   { label: "Last month",     value: "1_month"  },
//   { label: "Last 3 months",  value: "3_months" },
//   { label: "Last 6 months",  value: "6_months" },
// ];

// const EXPERIENCE_OPTIONS = [
//   { label: "Fresher (0–1 yr)",  value: "fresher"   },
//   { label: "Junior (1–3 yrs)",  value: "1_3_years" },
//   { label: "Mid (3–6 yrs)",     value: "3_6_years" },
//   { label: "Senior (6+ yrs)",   value: "6+_years"  },
// ];

// const JOB_TYPES = [
//   { label: "Full Time",      value: "full_time"  },
//   { label: "Part Time",      value: "part_time"  },
//   { label: "Internship",     value: "internship" },
//   { label: "Freelancer",     value: "freelancer" },
//   { label: "Contract",       value: "contract"   },
// ];

// const WORK_MODES = [
//   { label: "Remote",  value: "remote"  },
//   { label: "Hybrid",  value: "hybrid"  },
//   { label: "On-site", value: "onsite"  },
// ];

// const QUALIFICATIONS = [
//   { label: "High School",    value: "high_school"   },
//   { label: "Intermediate",   value: "intermediate"  },
//   { label: "Graduation",     value: "graduation"    },
//   { label: "Master Degree",  value: "masters"       },
//   { label: "MBA",            value: "mba"           },
// ];

// /* ─── helpers ────────────────────────────────────────────────────────────── */
// const getTimeAgo = (dateString) => {
//   if (!dateString) return "Recently";
//   const diff = Date.now() - new Date(dateString).getTime();
//   const m = Math.floor(diff / 60000);
//   const h = Math.floor(diff / 3600000);
//   const d = Math.floor(diff / 86400000);
//   const w = Math.floor(d / 7);
//   const mo = Math.floor(d / 30);
//   if (m < 1)  return "Just now";
//   if (m < 60) return `${m} min${m > 1 ? "s" : ""} ago`;
//   if (h < 24) return `${h} hour${h > 1 ? "s" : ""} ago`;
//   if (d < 7)  return `${d} day${d > 1 ? "s" : ""} ago`;
//   if (w < 4)  return `${w} week${w > 1 ? "s" : ""} ago`;
//   if (mo < 12) return `${mo} month${mo > 1 ? "s" : ""} ago`;
//   return `${Math.floor(d / 365)} year${Math.floor(d / 365) > 1 ? "s" : ""} ago`;
// };

// const getSalaryDisplay = (job) => {
//   if (job.salary_type === "negotiable") return "Negotiable";
//   if (job.salary_min && job.salary_max)
//     return `₹${(job.salary_min / 1000).toFixed(0)}k – ₹${(job.salary_max / 1000).toFixed(0)}k`;
//   if (job.salary_min) return `₹${(job.salary_min / 1000).toFixed(0)}k+`;
//   if (job.salaryRange && job.salaryRange !== "negotiable") return job.salaryRange;
//   if (job.salaryRange === "negotiable") return "Negotiable";
//   return "";
// };

// /* ─── multi-select toggle ─────────────────────────────────────────────────── */
// const toggleMulti = (prev, name, value) => {
//   const current = Array.isArray(prev[name]) ? prev[name] : [];
//   return {
//     ...prev,
//     [name]: current.includes(value)
//       ? current.filter((v) => v !== value)
//       : [...current, value],
//   };
// };

// /* ─── inline styles ──────────────────────────────────────────────────────── */
// const styles = {
//   /* drawer overlay */
//   overlay: {
//     position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)",
//     zIndex: 1200, display: "flex", justifyContent: "flex-end",
//   },
//   drawer: (open) => ({
//     width: "min(88vw, 340px)", height: "100%", background: "#fff",
//     overflowY: "auto", padding: "0 0 40px",
//     transform: open ? "translateX(0)" : "translateX(100%)",
//     transition: "transform 0.28s cubic-bezier(0.4,0,0.2,1)",
//     boxShadow: "-4px 0 24px rgba(0,0,0,0.12)",
//   }),
//   drawerHead: {
//     display: "flex", alignItems: "center", justifyContent: "space-between",
//     padding: "16px 18px", borderBottom: "1px solid #e1e5e9",
//     position: "sticky", top: 0, background: "#fff", zIndex: 2,
//   },
//   drawerTitle: { fontSize: "16px", fontWeight: "600", color: "#1a1a1a", margin: 0 },
//   closeBtn: {
//     background: "none", border: "none", cursor: "pointer",
//     fontSize: "20px", color: "#6b7280", lineHeight: 1, padding: "4px",
//   },
//   clearAll: {
//     background: "none", border: "none", cursor: "pointer",
//     fontSize: "13px", color: "#ef4444", fontWeight: "500",
//   },
//   section: { padding: "14px 18px", borderBottom: "1px solid #f0f0f0" },
//   sectionTitle: {
//     fontSize: "13px", fontWeight: "600", color: "#374151",
//     marginBottom: "10px", textTransform: "uppercase", letterSpacing: "0.5px",
//   },
//   checkRow: {
//     display: "flex", alignItems: "center", gap: "8px",
//     marginBottom: "8px", cursor: "pointer", fontSize: "14px", color: "#374151",
//   },
//   checkbox: { accentColor: "#28a745", width: "15px", height: "15px", cursor: "pointer" },
//   /* filter trigger button */
//   filterBtn: {
//     display: "inline-flex", alignItems: "center", gap: "6px",
//     padding: "8px 14px", borderRadius: "8px",
//     border: "1px solid #28a745", background: "#fff",
//     color: "#28a745", fontSize: "13px", fontWeight: "600",
//     cursor: "pointer", whiteSpace: "nowrap",
//   },
//   filterBadge: {
//     background: "#28a745", color: "#fff", borderRadius: "50%",
//     width: "18px", height: "18px", fontSize: "11px", fontWeight: "700",
//     display: "inline-flex", alignItems: "center", justifyContent: "center",
//   },
//   /* search row (mobile) */
//   mobileSearchRow: {
//     display: "flex", gap: "8px", alignItems: "center",
//     marginBottom: "16px",
//   },
//   mobileSearchInput: {
//     flex: 1, padding: "10px 14px", borderRadius: "8px",
//     border: "1px solid #e1e5e9", fontSize: "14px", outline: "none",
//   },
//   applyFiltersBtn: {
//     width: "calc(100% - 36px)", margin: "16px 18px 0",
//     padding: "12px", background: "#28a745", color: "#fff",
//     border: "none", borderRadius: "8px", fontSize: "14px",
//     fontWeight: "600", cursor: "pointer",
//   },
// };

// /* ═══════════════════════════════════════════════════════════════════════════
//    FilterPanel — shared between desktop sidebar and mobile drawer
//    ═══════════════════════════════════════════════════════════════════════════ */
// function FilterPanel({ filters, setFilters, setPage, itemsPerPage, setItemsPerPage, isMobile, onApply }) {
//   const activeSalaryIdx = SALARY_BRACKETS.findIndex(
//     (b) => b.minSalary === filters.minSalary && b.maxSalary === filters.maxSalary
//   );

//   const toggle = (name, value) => {
//     setPage(1);
//     setFilters((prev) => toggleMulti(prev, name, value));
//   };

//   const toggleSalary = (bracket) => {
//     setPage(1);
//     const isActive =
//       filters.minSalary === bracket.minSalary &&
//       filters.maxSalary === bracket.maxSalary;
//     setFilters((prev) => ({
//       ...prev,
//       minSalary: isActive ? null : bracket.minSalary,
//       maxSalary: isActive ? null : bracket.maxSalary,
//     }));
//   };

//   const toggleTime = (value) => {
//     setPage(1);
//     setFilters((prev) => ({ ...prev, timePosted: prev.timePosted === value ? "" : value }));
//   };

//   const Section = ({ title, children }) => (
//     <div style={styles.section}>
//       <div style={styles.sectionTitle}>{title}</div>
//       {children}
//     </div>
//   );

//   const CheckItem = ({ label, checked, onChange }) => (
//     <label style={styles.checkRow}>
//       <input type="checkbox" style={styles.checkbox} checked={checked} onChange={onChange} />
//       {label}
//     </label>
//   );

//   return (
//     <>
//       {/* Job Type */}
//       <Section title="Job Type">
//         {JOB_TYPES.map((t) => (
//           <CheckItem key={t.value} label={t.label}
//             checked={(filters.jobType || []).includes(t.value)}
//             onChange={() => toggle("jobType", t.value)} />
//         ))}
//       </Section>

//       {/* Work Mode */}
//       <Section title="Work Mode">
//         {WORK_MODES.map((t) => (
//           <CheckItem key={t.value} label={t.label}
//             checked={(filters.workMode || []).includes(t.value)}
//             onChange={() => toggle("workMode", t.value)} />
//         ))}
//       </Section>

//       {/* Experience */}
//       <Section title="Experience">
//         {EXPERIENCE_OPTIONS.map((t) => (
//           <CheckItem key={t.value} label={t.label}
//             checked={(filters.experience || []).includes(t.value)}
//             onChange={() => toggle("experience", t.value)} />
//         ))}
//       </Section>

//       {/* Qualification */}
//       <Section title="Qualification">
//         {QUALIFICATIONS.map((t) => (
//           <CheckItem key={t.value} label={t.label}
//             checked={(filters.qualification || []).includes(t.value)}
//             onChange={() => toggle("qualification", t.value)} />
//         ))}
//       </Section>

//       {/* Salary */}
//       <Section title="Salary Range">
//         {SALARY_BRACKETS.map((b, i) => (
//           <CheckItem key={i} label={b.label}
//             checked={activeSalaryIdx === i}
//             onChange={() => toggleSalary(b)} />
//         ))}
//       </Section>

//       {/* Posted Time */}
//       <Section title="Posted Time">
//         {TIME_OPTIONS.map((t) => (
//           <CheckItem key={t.value} label={t.label}
//             checked={filters.timePosted === t.value}
//             onChange={() => toggleTime(t.value)} />
//         ))}
//       </Section>

//       {/* Items per page — desktop only */}
//       {!isMobile && (
//         <Section title={`${itemsPerPage} items per page`}>
//           <input type="range" min="5" max="20" value={itemsPerPage}
//             onChange={(e) => { setItemsPerPage(parseInt(e.target.value)); setPage(1); }}
//             style={{ width: "100%" }} />
//           <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", color: "#9ca3af", marginTop: "4px" }}>
//             <span>5</span><span>20</span>
//           </div>
//         </Section>
//       )}

//       {/* Apply button — mobile only */}
//       {isMobile && (
//         <button style={styles.applyFiltersBtn} onClick={onApply}>
//           Apply Filters
//         </button>
//       )}
//     </>
//   );
// }

// /* ═══════════════════════════════════════════════════════════════════════════
//    Main AllJobs component
//    ═══════════════════════════════════════════════════════════════════════════ */
// function AllJobs() {
//   const navigate = useNavigate();
//   const { user } = useAuth();
//   const [searchParams] = useSearchParams();

//   const [jobs, setJobs] = useState([]);
//   const [loading, setLoading] = useState(false);
//   const [message, setMessage] = useState("");
//   const [page, setPage] = useState(1);
//   const [totalPages, setTotalPages] = useState(1);
//   const [totalJobs, setTotalJobs] = useState(0);
//   const [itemsPerPage, setItemsPerPage] = useState(10);
//   const [appliedJobIds, setAppliedJobIds] = useState(new Set());

//   /* filters */
//   const [filters, setFilters] = useState({
//     q: "", city: "",
//     jobType: [], workMode: [], experience: [], qualification: [],
//     category: "", timePosted: "",
//     minSalary: null, maxSalary: null,
//   });

//   /* apply modal */
//   const [applyOpen, setApplyOpen] = useState(false);
//   const [applyJob, setApplyJob] = useState(null);
//   const [applyForm, setApplyForm] = useState({ name: "", email: "", phone: "", resume: null, pastedCv: "" });
//   const [focusedField, setFocusedField] = useState(null);

//   /* mobile drawer */
//   const [drawerOpen, setDrawerOpen] = useState(false);
//   const drawerRef = useRef(null);

//   /* count active filters for badge */
//   const activeFilterCount = [
//     ...(filters.jobType || []),
//     ...(filters.workMode || []),
//     ...(filters.experience || []),
//     ...(filters.qualification || []),
//     filters.category,
//     filters.timePosted,
//     filters.minSalary != null ? "salary" : "",
//   ].filter(Boolean).length;

//   /* clear all */
//   const clearAllFilters = () => {
//     setPage(1);
//     setFilters((prev) => ({
//       ...prev,
//       jobType: [], workMode: [], experience: [], qualification: [],
//       category: "", timePosted: "", minSalary: null, maxSalary: null,
//     }));
//   };

//   /* read URL params on mount */
//   useEffect(() => {
//     const cat = searchParams.get("category");
//     const q   = searchParams.get("q");
//     if (cat) setFilters((p) => ({ ...p, category: decodeURIComponent(cat) }));
//     if (q)   setFilters((p) => ({ ...p, q: decodeURIComponent(q) }));
//   }, [searchParams]);

//   /* fetch jobs */
//   useEffect(() => {
//     const fetchJobs = async () => {
//       try {
//         setLoading(true);
//         const params = new URLSearchParams();

//         if (filters.timePosted) {
//           params.set("page", "1");
//           params.set("limit", "1000");
//         } else {
//           params.set("page", String(page));
//           params.set("limit", String(itemsPerPage));
//         }

//         /* scalar filters */
//         if (filters.q)        params.set("q",        filters.q);
//         if (filters.city)     params.set("city",     filters.city);
//         if (filters.category) params.set("category", filters.category);

//         /* array filters — send as comma-separated */
//         if (filters.jobType?.length)      params.set("jobType",      filters.jobType.join(","));
//         if (filters.workMode?.length)     params.set("workMode",     filters.workMode.join(","));
//         if (filters.experience?.length)   params.set("experience",   filters.experience.join(","));
//         if (filters.qualification?.length) params.set("qualification", filters.qualification.join(","));

//         /* salary */
//         if (filters.minSalary != null) params.set("minSalary", filters.minSalary);
//         if (filters.maxSalary != null) params.set("maxSalary", filters.maxSalary);

//         let resp = await fetch(`${API_BASE_URL}/api/jobs?${params.toString()}`, {
//           method: "GET", headers: { Accept: "application/json" }, credentials: "include",
//         });
//         if (!resp.ok) {
//           resp = await fetch(`${API_BASE_URL}/api/employer/jobs`, {
//             method: "GET", headers: { Accept: "application/json" }, credentials: "include",
//           });
//         }

//         if (resp.ok) {
//           const data = await resp.json();
//           let list = Array.isArray(data.jobs) ? data.jobs : Array.isArray(data) ? data : [];

//           /* client-side timePosted filter */
//           if (filters.timePosted) {
//             const now = new Date();
//             const cut = new Date();
//             const map = { "1_day":1,"3_days":3,"1_week":7,"2_weeks":14 };
//             const mmap = { "1_month":1,"3_months":3,"6_months":6 };
//             if (map[filters.timePosted])  cut.setDate(now.getDate() - map[filters.timePosted]);
//             if (mmap[filters.timePosted]) cut.setMonth(now.getMonth() - mmap[filters.timePosted]);
//             list = list.filter((job) => {
//               const d = new Date(job.createdAt || job.created_at || job.postedDate);
//               return d >= cut && d <= now;
//             });
//             const start = (page - 1) * itemsPerPage;
//             setTotalPages(Math.ceil(list.length / itemsPerPage) || 1);
//             setTotalJobs(list.length);
//             setJobs(list.slice(start, start + itemsPerPage));
//           } else {
//             const p = data.pagination || {};
//             setTotalPages(p.totalPages || 1);
//             setTotalJobs(p.total || list.length);
//             setJobs(list);
//           }
//         } else {
//           setMessage("Failed to load jobs");
//           setTimeout(() => setMessage(""), 4000);
//         }
//       } catch {
//         setMessage("Failed to load jobs");
//         setTimeout(() => setMessage(""), 4000);
//       } finally {
//         setLoading(false);
//       }
//     };
//     fetchJobs();
//   }, [API_BASE_URL, page, filters, itemsPerPage]);

//   /* fetch applied jobs */
//   useEffect(() => {
//     const fetchApplied = async () => {
//       if (!user || user.role !== "seeker") return setAppliedJobIds(new Set());
//       const token = localStorage.getItem("token");
//       if (!token) return setAppliedJobIds(new Set());
//       try {
//         const resp = await fetch(`${API_BASE_URL}/api/applications/mine`, {
//           headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
//         });
//         if (!resp.ok) return;
//         const data = await resp.json();
//         setAppliedJobIds(new Set(
//           (Array.isArray(data.applications) ? data.applications : [])
//             .map((a) => String(a.jobId)).filter(Boolean)
//         ));
//       } catch {}
//     };
//     fetchApplied();
//   }, [user]);

//   /* apply */
//   const openApply = (job) => {
//     if (!user) {
//       document.querySelector('[data-target="#signin"]')?.click();
//       return;
//     }
//     setApplyJob(job);
//     setApplyForm({ name: "", email: "", phone: "", resume: null, pastedCv: "" });
//     setApplyOpen(true);
//   };

//   const submitApplication = async () => {
//     if (!applyForm.name?.trim()) return (setMessage("Please enter your name"), setTimeout(() => setMessage(""), 4000));
//     if (!applyForm.email?.trim()) return (setMessage("Please enter your email"), setTimeout(() => setMessage(""), 4000));
//     if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(applyForm.email.trim()))
//       return (setMessage("Please enter a valid email"), setTimeout(() => setMessage(""), 4000));
//     try {
//       const token = localStorage.getItem("token");
//       if (!token) return (setMessage("Please login to apply"), setTimeout(() => setMessage(""), 4000));
//       const fd = new FormData();
//       fd.append("name", applyForm.name.trim());
//       fd.append("email", applyForm.email.trim());
//       if (applyForm.phone) fd.append("phone", applyForm.phone.trim());
//       if (applyForm.pastedCv) fd.append("pastedCv", applyForm.pastedCv.trim());
//       if (applyForm.resume) fd.append("resume", applyForm.resume);
//       const resp = await fetch(`${API_BASE_URL}/api/jobs/${applyJob.id || applyJob._id}/apply`, {
//         method: "POST", headers: { Authorization: `Bearer ${token}` }, body: fd, credentials: "include",
//       });
//       if (resp.ok) {
//         setMessage("Applied successfully");
//         setApplyOpen(false);
//         const appliedId = String(applyJob.id || applyJob._id);
//         setAppliedJobIds((prev) => new Set([...prev, appliedId]));
//         setTimeout(() => setMessage(""), 4000);
//       } else {
//         const err = await resp.json().catch(() => ({ message: "Unknown error" }));
//         if (err.code === "DUPLICATE_APPLICATION" || err.message?.includes("already applied")) {
//           setMessage("You have already applied for this job");
//           setAppliedJobIds((prev) => new Set([...prev, String(applyJob.id || applyJob._id)]));
//         } else {
//           setMessage(`Failed to apply: ${err.message || "Please try again"}`);
//         }
//         setTimeout(() => setMessage(""), 4000);
//       }
//     } catch {
//       setMessage("Failed to apply");
//       setTimeout(() => setMessage(""), 4000);
//     }
//   };

//   /* ── render ─────────────────────────────────────────────────────────────── */
//   return (
//     <>
//       {/* toast */}
//       {message && (
//         <div className={`alert ${message.includes("Failed") ? "alert-danger" : "alert-success"}`}
//           style={{ position: "fixed", top: "20px", right: "20px", zIndex: 9999 }}>
//           {message}
//         </div>
//       )}

//       <Header />

//       {/* ── mobile filter drawer ────────────────────────────────────────────── */}
//       {drawerOpen && (
//         <div style={styles.overlay} onClick={() => setDrawerOpen(false)}>
//           <div ref={drawerRef} style={styles.drawer(drawerOpen)} onClick={(e) => e.stopPropagation()}>
//             {/* drawer header */}
//             <div style={styles.drawerHead}>
//               <h5 style={styles.drawerTitle}>Filters</h5>
//               <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
//                 {activeFilterCount > 0 && (
//                   <button style={styles.clearAll} onClick={clearAllFilters}>Clear all</button>
//                 )}
//                 <button style={styles.closeBtn} onClick={() => setDrawerOpen(false)}>✕</button>
//               </div>
//             </div>
//             <FilterPanel
//               filters={filters} setFilters={setFilters}
//               setPage={setPage} itemsPerPage={itemsPerPage}
//               setItemsPerPage={setItemsPerPage}
//               isMobile={true}
//               onApply={() => setDrawerOpen(false)}
//             />
//           </div>
//         </div>
//       )}

//       {/* ── page body ───────────────────────────────────────────────────────── */}
//       <section className="padd-top-80 padd-bot-80">
//         <div className="container">

//           {/* ── mobile: search row + filter button ─────────────────────────── */}
//           <div className="visible-xs visible-sm" style={styles.mobileSearchRow}>
//             <input
//               type="text" placeholder="Search jobs…"
//               value={filters.q}
//               style={styles.mobileSearchInput}
//               onChange={(e) => {
//                 setFilters((p) => ({ ...p, q: e.target.value }));
//                 setPage(1);
//                 trackSearchDebounced(e.target.value);
//               }}
//             />
//             <button style={styles.filterBtn} onClick={() => setDrawerOpen(true)}>
//               <i className="ti-filter" />
//               Filters
//               {activeFilterCount > 0 && (
//                 <span style={styles.filterBadge}>{activeFilterCount}</span>
//               )}
//             </button>
//           </div>

//           <div className="row">
//             {/* ── desktop left sidebar ─────────────────────────────────────── */}
//             <div className="col-md-3 hidden-xs hidden-sm">
//               <div className="widget-boxed padd-bot-0">
//                 <div className="widget-boxed-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
//                   <h4 style={{ margin: 0 }}>Filters</h4>
//                   {activeFilterCount > 0 && (
//                     <button onClick={clearAllFilters}
//                       style={{ background: "none", border: "none", color: "#ef4444", fontSize: "12px", cursor: "pointer", fontWeight: "500" }}>
//                       Clear all ({activeFilterCount})
//                     </button>
//                   )}
//                 </div>
//                 <div style={{ padding: "0 0 8px" }}>
//                   {/* keyword + city */}
//                   <div style={styles.section}>
//                     <input type="text" className="form-control" placeholder="Search keywords"
//                       value={filters.q} style={{ marginBottom: "10px" }}
//                       onChange={(e) => { setFilters((p) => ({ ...p, q: e.target.value })); setPage(1); trackSearchDebounced(e.target.value); }} />
//                     <input type="text" className="form-control" placeholder="All locations"
//                       value={filters.city}
//                       onChange={(e) => { setFilters((p) => ({ ...p, city: e.target.value })); setPage(1); }} />
//                   </div>
//                   <FilterPanel
//                     filters={filters} setFilters={setFilters}
//                     setPage={setPage} itemsPerPage={itemsPerPage}
//                     setItemsPerPage={setItemsPerPage}
//                     isMobile={false}
//                   />
//                 </div>
//               </div>
//             </div>

//             {/* ── job cards ────────────────────────────────────────────────── */}
//             <div className="col-md-9 col-sm-12">
//               <div style={{ marginBottom: "16px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
//                 <h4 className="job_vacancie" style={{ margin: 0 }}>{totalJobs} Jobs &amp; Vacancies</h4>
//               </div>

//               {loading ? (
//                 <div className="vertical-job-card"><div className="vertical-job-body">Loading…</div></div>
//               ) : jobs.length === 0 ? (
//                 <div className="vertical-job-card"><div className="vertical-job-body">No jobs found.</div></div>
//               ) : (
//                 jobs.map((job) => {
//                   const id = job._id || job.id;
//                   const isApplied = appliedJobIds.has(String(id));
//                   const logoPath = job.companyLogoUrl || job.logoUrl || job.company_logo;
//                   const logo = logoPath && (logoPath.startsWith("http") || logoPath.startsWith("data:"))
//                     ? logoPath
//                     : logoPath
//                       ? `${API_BASE_URL}${logoPath.startsWith("/") ? logoPath : `/${logoPath}`}`
//                       : "/assets/img/company_logo_1.png";
//                   const title    = job.jobTitle || job.title;
//                   const company  = job.companyName || job.company || "";
//                   const location = job.city || job.state || job.country || job.address || "—";
//                   const jobType  = job.jobType || job.job_type || "—";
//                   const salary   = getSalaryDisplay(job);
//                   const status   = job.status || "active";
//                   const timePosted = getTimeAgo(job.createdAt || job.created_at || job.postedDate);

//                   return (
//                     <div key={id}
//                       onClick={() => navigate(`/jobs/${id}`)}
//                       style={{
//                         cursor: "pointer", backgroundColor: "white", borderRadius: "8px",
//                         padding: "16px", boxShadow: "0 2px 6px rgba(0,0,0,0.08)",
//                         transition: "all 0.2s ease", position: "relative",
//                         border: "1px solid #e1e5e9", marginBottom: "15px",
//                       }}
//                       onMouseEnter={(e) => { e.currentTarget.style.boxShadow = "0 4px 12px rgba(0,0,0,0.12)"; e.currentTarget.style.transform = "translateY(-2px)"; }}
//                       onMouseLeave={(e) => { e.currentTarget.style.boxShadow = "0 2px 6px rgba(0,0,0,0.08)"; e.currentTarget.style.transform = "translateY(0)"; }}
//                     >
//                       <div style={{ display: "flex", alignItems: "flex-start", marginBottom: "12px", position: "relative" }}>
//                         {/* logo + status */}
//                         <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-start", marginRight: "12px" }}>
//                           <div style={{ width: "50px", height: "50px", minWidth: "50px", borderRadius: "6px", overflow: "hidden", border: "1px solid #e1e5e9", display: "flex", alignItems: "center", justifyContent: "center", backgroundColor: "#f8f9fa", marginBottom: "8px" }}>
//                             <img src={logo} alt={company} style={{ width: "100%", height: "100%", objectFit: "contain" }}
//                               onError={(e) => { e.target.src = "/assets/img/company_logo_1.png"; }} />
//                           </div>
//                           <span style={{ padding: "2px 8px", borderRadius: "4px", fontSize: "11px", fontWeight: "600", backgroundColor: status === "active" ? "#e8f5e9" : "#fee2e2", color: status === "active" ? "#2e7d32" : "#dc2626", whiteSpace: "nowrap" }}>
//                             {status.charAt(0).toUpperCase() + status.slice(1)}
//                           </span>
//                         </div>

//                         {/* title + details */}
//                         <div style={{ flex: 1, minWidth: 0, paddingRight: "50px" }}>
//                           <h4 style={{ margin: "0 0 4px 0", fontSize: "15px", fontWeight: "600", color: "#1a1a1a", lineHeight: "1.3", overflow: "hidden", textOverflow: "ellipsis", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" }}>{title}</h4>
//                           <span style={{ fontSize: "13px", color: "#6b7280", display: "block", marginBottom: "10px" }}>{company}</span>
//                           <div style={{ display: "flex", flexDirection: "column", gap: "6px", fontSize: "13px", color: "#4b5563" }}>
//                             <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
//                               <i className="ti-briefcase" style={{ color: "#28a745", fontSize: "14px" }} />
//                               <span>{jobType.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase())}</span>
//                             </div>
//                             <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
//                               <i className="ti-location-pin" style={{ color: "#28a745", fontSize: "14px" }} />
//                               <span>{location}</span>
//                             </div>
//                             <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
//                               <i className="ti-time" style={{ color: "#28a745", fontSize: "14px" }} />
//                               <span>{timePosted}</span>
//                             </div>
//                             {salary && (
//                               <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
//                                 <span style={{ color: "#28a745", fontSize: "14px", fontWeight: "bold" }}>₹</span>
//                                 <span>{salary}</span>
//                               </div>
//                             )}
//                           </div>
//                         </div>

//                         {/* wishlist */}
//                         <div style={{ position: "absolute", top: "0", right: "0", zIndex: 10 }} onClick={(e) => e.stopPropagation()}>
//                           {user && user.role === "seeker" && id && <WishlistButton jobId={String(id)} />}
//                         </div>

//                         {/* apply */}
//                         {(!user || user.role === "seeker") && (
//                           <div style={{ position: "absolute", bottom: "-8px", right: "0", zIndex: 10 }} onClick={(e) => e.stopPropagation()}>
//                             {isApplied ? (
//                               <span style={{ display: "flex", alignItems: "center", gap: "6px", color: "#2563EB", fontWeight: "500", fontSize: "14px" }}>
//                                 <i className="ti-check" style={{ fontSize: "14px" }} /> Applied
//                               </span>
//                             ) : (
//                               <button className="btn-job job-apply"
//                                 onClick={(e) => { e.stopPropagation(); openApply(job); }}
//                                 style={{ fontSize: "13px", fontWeight: "600", padding: "6px 14px", borderRadius: "8px", border: "1px solid #26AE61", color: "#26AE61", background: "transparent", cursor: "pointer", display: "inline-flex", alignItems: "center", gap: "6px" }}
//                                 onMouseEnter={(e) => { e.currentTarget.style.background = "#26AE61"; e.currentTarget.style.color = "#fff"; }}
//                                 onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "#26AE61"; }}>
//                                 Apply Now <i className="ti-arrow-right" style={{ fontSize: "14px" }} />
//                               </button>
//                             )}
//                           </div>
//                         )}
//                       </div>
//                     </div>
//                   );
//                 })
//               )}

//               {/* pagination */}
//               {totalPages > 1 && (
//                 <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: "8px", flexWrap: "wrap", marginTop: "30px" }}>
//                   <button onClick={() => { if (page > 1) setPage(page - 1); }} disabled={page === 1}
//                     style={{ padding: "8px 12px", backgroundColor: page === 1 ? "#f3f4f6" : "white", color: page === 1 ? "#9ca3af" : "#4066D4", border: "1px solid #e1e5e9", borderRadius: "6px", cursor: page === 1 ? "not-allowed" : "pointer", minWidth: "36px", height: "36px", display: "flex", alignItems: "center", justifyContent: "center" }}>
//                     <span style={{ fontSize: "16px" }}>«</span>
//                   </button>
//                   {Array.from({ length: totalPages }).map((_, idx) => (
//                     <button key={idx} onClick={() => setPage(idx + 1)}
//                       style={{ padding: "8px 12px", backgroundColor: page === idx + 1 ? "#4066D4" : "white", color: page === idx + 1 ? "white" : "#4a5568", border: `1px solid ${page === idx + 1 ? "#4066D4" : "#e1e5e9"}`, borderRadius: "6px", cursor: "pointer", minWidth: "36px", height: "36px", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: "600", fontSize: "12px" }}>
//                       {idx + 1}
//                     </button>
//                   ))}
//                   <button onClick={() => { if (page < totalPages) setPage(page + 1); }} disabled={page === totalPages}
//                     style={{ padding: "8px 12px", backgroundColor: page === totalPages ? "#f3f4f6" : "white", color: page === totalPages ? "#9ca3af" : "#4066D4", border: "1px solid #e1e5e9", borderRadius: "6px", cursor: page === totalPages ? "not-allowed" : "pointer", minWidth: "36px", height: "36px", display: "flex", alignItems: "center", justifyContent: "center" }}>
//                     <span style={{ fontSize: "16px" }}>»</span>
//                   </button>
//                 </div>
//               )}
//             </div>
//           </div>
//         </div>
//       </section>

//       {/* ── apply modal ─────────────────────────────────────────────────────── */}
//       {applyOpen && (
//         <div className="modal fade in" style={{ display: "block", background: "rgba(0,0,0,0.5)", position: "fixed", inset: 0, zIndex: 9999 }}
//           onClick={() => setApplyOpen(false)}>
//           <div className="modal-dialog" onClick={(e) => e.stopPropagation()} style={{ maxHeight: "95vh", margin: "2% auto" }}>
//             <div className="modal-content" style={{ maxHeight: "95vh", display: "flex", flexDirection: "column" }}>
//               <div className="modal-body" style={{ padding: "20px", overflowY: "auto", flex: "1 1 auto" }}>
//                 <div className="text-center mrg-bot-20">
//                   <h4 className="mrg-0">{applyJob?.jobTitle || applyJob?.title}</h4>
//                 </div>
//                 <form onSubmit={(e) => { e.preventDefault(); submitApplication(); }}>
//                   {[
//                     { id: "name",  icon: "ti-user",   type: "text",  label: "Name" },
//                     { id: "email", icon: "ti-email",  type: "email", label: "Email" },
//                     { id: "phone", icon: "ti-mobile", type: "text",  label: "Phone" },
//                   ].map(({ id, icon, type, label }) => (
//                     <div className="col-md-12 col-sm-12" key={id}>
//                       <div style={{ position: "relative", marginBottom: "18px" }}>
//                         <i className={icon} style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: focusedField === id ? "#28a745" : "#999", transition: "all 0.3s", pointerEvents: "none", zIndex: 2, fontSize: "16px" }} />
//                         <label style={{ position: "absolute", left: "40px", top: focusedField === id || applyForm[id] ? "-10px" : "50%", transform: focusedField === id || applyForm[id] ? "translateY(0) scale(0.85)" : "translateY(-50%)", fontSize: focusedField === id || applyForm[id] ? "12px" : "14px", color: focusedField === id ? "#28a745" : "#999", transition: "all 0.3s", pointerEvents: "none", zIndex: 3, fontWeight: "500", backgroundColor: "white", padding: focusedField === id || applyForm[id] ? "0 4px" : "0" }}>{label}</label>
//                         <input type={type} className="form-control" value={applyForm[id]}
//                           onChange={(e) => setApplyForm((p) => ({ ...p, [id]: e.target.value }))}
//                           onFocus={() => setFocusedField(id)} onBlur={() => setFocusedField(null)}
//                           style={{ padding: "14px 12px 14px 40px", border: `2px solid ${focusedField === id ? "#28a745" : "#e1e5e9"}`, borderRadius: "6px", fontSize: "14px", outline: "none", height: "48px", transition: "all 0.3s" }} />
//                       </div>
//                     </div>
//                   ))}

//                   {/* resume upload */}
//                   <div className="col-md-12 col-sm-12">
//                     <div style={{ position: "relative", marginBottom: "18px" }}>
//                       <input type="file" id="file" name="resume" accept=".pdf,.doc,.docx" style={{ display: "none" }}
//                         onChange={(e) => setApplyForm((p) => ({ ...p, resume: e.target.files?.[0] || null }))} />
//                       {!applyForm.resume ? (
//                         <button type="button" onClick={() => document.getElementById("file").click()}
//                           style={{ width: "100%", padding: "14px", border: "2px solid #e1e5e9", borderRadius: "6px", backgroundColor: "#fff", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", fontSize: "14px", color: "#666", height: "48px" }}>
//                           <i className="ti-upload" style={{ fontSize: "16px", color: "#28a745" }} /> Upload your CV
//                         </button>
//                       ) : (
//                         <div style={{ width: "100%", padding: "12px", border: "2px solid #28a745", borderRadius: "6px", backgroundColor: "#f0f9ff", display: "flex", alignItems: "center", justifyContent: "space-between", height: "48px", boxSizing: "border-box" }}>
//                           <div style={{ display: "flex", alignItems: "center", gap: "8px", flex: 1, minWidth: 0 }}>
//                             <i className="ti-file" style={{ fontSize: "16px", color: "#28a745" }} />
//                             <span style={{ fontSize: "14px", color: "#333", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{applyForm.resume.name}</span>
//                           </div>
//                           <button type="button" onClick={() => { setApplyForm((p) => ({ ...p, resume: null })); document.getElementById("file").value = ""; }}
//                             style={{ padding: "4px 8px", border: "none", borderRadius: "4px", backgroundColor: "#ff4757", color: "white", cursor: "pointer", fontSize: "12px" }}>
//                             <i className="ti-close" /> Remove
//                           </button>
//                         </div>
//                       )}
//                     </div>
//                   </div>

//                   {/* cover letter */}
//                   <div className="col-md-12">
//                     <div style={{ position: "relative", marginBottom: "18px" }}>
//                       <label style={{ position: "absolute", left: "40px", top: focusedField === "pastedCv" || applyForm.pastedCv ? "-10px" : "20px", transform: focusedField === "pastedCv" || applyForm.pastedCv ? "scale(0.85)" : "scale(1)", fontSize: "14px", color: focusedField === "pastedCv" ? "#28a745" : "#999", transition: "all 0.3s", pointerEvents: "none", zIndex: 3, fontWeight: "500", backgroundColor: "white", padding: "0 4px" }}>Paste your cover letter</label>
//                       <textarea className="form-control height-120" value={applyForm.pastedCv}
//                         onChange={(e) => setApplyForm((p) => ({ ...p, pastedCv: e.target.value }))}
//                         onFocus={() => setFocusedField("pastedCv")} onBlur={() => setFocusedField(null)}
//                         style={{ padding: "20px 12px 12px 40px", minHeight: "100px", border: `2px solid ${focusedField === "pastedCv" ? "#28a745" : "#e1e5e9"}`, borderRadius: "6px", fontSize: "14px", outline: "none", resize: "vertical", width: "100%", boxSizing: "border-box" }} />
//                     </div>
//                   </div>

//                   <div className="col-md-12" style={{ marginTop: "15px", textAlign: "center" }}>
//                     <button type="submit" className="btn theme-btn btn-m" style={{ display: "inline-flex", alignItems: "center", gap: "8px", padding: "10px 24px", fontSize: "14px", fontWeight: "600" }}>
//                       Submit <i className="ti-arrow-right" />
//                     </button>
//                   </div>
//                 </form>
//               </div>
//             </div>
//           </div>
//         </div>
//       )}

//       <MobileAppDownload />
//       <Footer />
//     </>
//   );
// }

// export default AllJobs;






// import React, { useEffect, useMemo, useRef, useState } from "react";
// import { motion, useInView, animate } from "framer-motion";
// import { FiZap, FiSearch, FiBriefcase, FiMapPin, FiTrendingUp, FiHome } from "react-icons/fi";
// import { Link, useNavigate, useSearchParams } from "react-router-dom";
// import { useAuth } from "../context/AuthContext";
// import Header from "../Components/Header";
// import Footer from "../Components/Footer";
// import MobileAppDownload from "../Components/MobileAppDownload";
// import { API_BASE_URL } from "../config/api";
// import WishlistButton from "../Components/WishlistButton";
// import { createSlug } from "../utils/slug";
// import { formatCategoryName } from "../utils/categoryIcons";
// import { trackSearch, trackSearchDebounced } from "../utils/trackActivity";
// import { SALARY_FILTER_OPTIONS, findSalaryFilterByRange, formatJobSalary } from "../utils/jobSalary";
// import useJobCategories from "../hooks/useJobCategories";
// import PageSEO from "../Components/PageSEO";

// // Normalize separators too (spaces/underscores/hyphens) so a category NAME like
// // "Information Technology" matches a stored slug like "information_technology".
// const normalizeFilterText = (value) =>
//     String(value || '').trim().toLowerCase().replace(/[\s_-]+/g, ' ');

// const jobMatchesCategoryFilter = (job, categoryFilter) => {
//     if (!categoryFilter) return true;
//     const filter = normalizeFilterText(categoryFilter);
//     const fields = [
//         job.category,
//         job.jobCategory,
//         job.categoryName,
//         job.industry,
//     ].map(normalizeFilterText).filter(Boolean);
//     return fields.some(
//         (field) => field === filter || field.includes(filter) || filter.includes(field)
//     );
// };

// const jobMatchesSubcategoryFilter = (job, subcategoryFilter) => {
//     if (!subcategoryFilter) return true;
//     const filter = normalizeFilterText(subcategoryFilter);
//     const fields = [
//         job.subcategory,
//         job.subCategory,
//         job.sub_category,
//         job.subcategoryName,
//         job.jobTitle,
//         job.title,
//         job.designation,
//         job.role,
//     ].map(normalizeFilterText).filter(Boolean);
//     const description = normalizeFilterText(job.description);
//     return (
//         fields.some((field) => field === filter || field.includes(filter) || filter.includes(field)) ||
//         (description && description.includes(filter))
//     );
// };

// const applyCategorySubcategoryFilters = (jobs, categoryFilter, subcategoryFilter) =>
//     jobs.filter(
//         (job) =>
//             jobMatchesCategoryFilter(job, categoryFilter) &&
//             jobMatchesSubcategoryFilter(job, subcategoryFilter)
//     );

// const mobileFilterStyles = {
//     overlay: {
//         position: "fixed",
//         inset: 0,
//         background: "rgba(0,0,0,0.45)",
//         zIndex: 1200,
//         display: "flex",
//         justifyContent: "flex-end",
//     },
//     drawer: (open) => ({
//         width: "min(88vw, 340px)",
//         height: "100%",
//         background: "#fff",
//         overflowY: "auto",
//         padding: "0 0 40px",
//         transform: open ? "translateX(0)" : "translateX(100%)",
//         transition: "transform 0.28s cubic-bezier(0.4,0,0.2,1)",
//         boxShadow: "-4px 0 24px rgba(0,0,0,0.12)",
//     }),
//     drawerHead: {
//         display: "flex",
//         alignItems: "center",
//         justifyContent: "space-between",
//         padding: "16px 18px",
//         borderBottom: "1px solid #e1e5e9",
//         position: "sticky",
//         top: 0,
//         background: "#fff",
//         zIndex: 2,
//     },
//     drawerTitle: { fontSize: "16px", fontWeight: "600", color: "#1a1a1a", margin: 0 },
//     closeBtn: {
//         background: "none",
//         border: "none",
//         cursor: "pointer",
//         fontSize: "20px",
//         color: "#6b7280",
//         lineHeight: 1,
//         padding: "4px",
//     },
//     clearAll: {
//         background: "none",
//         border: "none",
//         cursor: "pointer",
//         fontSize: "13px",
//         color: "#ef4444",
//         fontWeight: "500",
//     },
//     section: { padding: "14px 18px", borderBottom: "1px solid #f0f0f0" },
//     sectionTitle: {
//         fontSize: "13px",
//         fontWeight: "600",
//         color: "#374151",
//         marginBottom: "10px",
//         textTransform: "uppercase",
//         letterSpacing: "0.5px",
//     },
//     checkRow: {
//         display: "flex",
//         alignItems: "center",
//         gap: "8px",
//         marginBottom: "8px",
//         cursor: "pointer",
//         fontSize: "14px",
//         color: "#374151",
//     },
//     checkbox: { accentColor: "#28a745", width: "15px", height: "15px", cursor: "pointer" },
//     filterBtn: {
//         display: "inline-flex",
//         alignItems: "center",
//         gap: "6px",
//         padding: "8px 14px",
//         borderRadius: "8px",
//         border: "1px solid #28a745",
//         background: "#fff",
//         color: "#28a745",
//         fontSize: "13px",
//         fontWeight: "600",
//         cursor: "pointer",
//         whiteSpace: "nowrap",
//     },
//     filterBadge: {
//         background: "#28a745",
//         color: "#fff",
//         borderRadius: "50%",
//         width: "18px",
//         height: "18px",
//         fontSize: "11px",
//         fontWeight: "700",
//         display: "inline-flex",
//         alignItems: "center",
//         justifyContent: "center",
//     },
//     mobileSearchRow: {
//         display: "flex",
//         gap: "8px",
//         alignItems: "center",
//         marginBottom: "16px",
//     },
//     mobileSearchInput: {
//         flex: 1,
//         padding: "10px 14px",
//         borderRadius: "8px",
//         border: "1px solid #e1e5e9",
//         fontSize: "14px",
//         outline: "none",
//     },
//     applyFiltersBtn: {
//         width: "calc(100% - 36px)",
//         margin: "16px 18px 0",
//         padding: "12px",
//         background: "#28a745",
//         color: "#fff",
//         border: "none",
//         borderRadius: "8px",
//         fontSize: "14px",
//         fontWeight: "600",
//         cursor: "pointer",
//     },
//     fieldInput: {
//         width: "100%",
//         padding: "10px 12px",
//         borderRadius: "8px",
//         border: "1px solid #e1e5e9",
//         fontSize: "14px",
//         marginBottom: "10px",
//         outline: "none",
//         boxSizing: "border-box",
//     },
// };

// function MobileFilterPanel({
//     filters,
//     setFilters,
//     setPage,
//     setSearchKeyword,
//     toggleFilter,
//     onApply,
//     jobCategories,
//     categorySubcategories,
// }) {
//     const Section = ({ title, children }) => (
//         <div style={mobileFilterStyles.section}>
//             <div style={mobileFilterStyles.sectionTitle}>{title}</div>
//             {children}
//         </div>
//     );

//     const Check = ({ id, label, name, value }) => (
//         <label style={mobileFilterStyles.checkRow} htmlFor={id}>
//             <input
//                 id={id}
//                 type="checkbox"
//                 style={mobileFilterStyles.checkbox}
//                 checked={filters[name] === value}
//                 onChange={() => toggleFilter(name, value)}
//             />
//             {label}
//         </label>
//     );

//     return (
//         <>
//             <Section title="Search">
//                 <input
//                     type="text"
//                     className="form-control"
//                     placeholder="Search Keywords"
//                     value={filters.q}
//                     style={mobileFilterStyles.fieldInput}
//                     onChange={(e) => {
//                         const q = e.target.value;
//                         setFilters((prev) => ({ ...prev, q }));
//                         setSearchKeyword(q);
//                         setPage(1);
//                         trackSearchDebounced(q);
//                     }}
//                 />
//                 <input
//                     type="text"
//                     className="form-control"
//                     placeholder="All Locations"
//                     value={filters.city}
//                     style={{ ...mobileFilterStyles.fieldInput, marginBottom: 0 }}
//                     onChange={(e) => {
//                         setFilters((prev) => ({ ...prev, city: e.target.value }));
//                         setPage(1);
//                     }}
//                 />
//             </Section>

//             <Section title="Job Type">
//                 <Check id="m-jt-ft" label="Full Time" name="jobType" value="full_time" />
//                 <Check id="m-jt-pt" label="Part Time" name="jobType" value="part_time" />
//                 <Check id="m-jt-in" label="Internship" name="jobType" value="internship" />
//                 <Check id="m-jt-fr" label="Freelancer" name="jobType" value="freelancer" />
//                 <Check id="m-jt-co" label="Contract" name="jobType" value="contract" />
//             </Section>

//             <Section title="Category">
//                 {jobCategories.map((cat, idx) => (
//                     <React.Fragment key={cat.id}>
//                         <Check
//                             id={`m-cat-${idx}`}
//                             label={cat.name}
//                             name="category"
//                             value={cat.name}
//                         />
//                         {filters.category === cat.name
//                             ? categorySubcategories.map((sub, subIdx) => (
//                                 <label
//                                     key={sub.id}
//                                     style={{ ...mobileFilterStyles.checkRow, paddingLeft: '22px', fontSize: '13px' }}
//                                     htmlFor={`m-sub-${idx}-${subIdx}`}
//                                 >
//                                     <input
//                                         id={`m-sub-${idx}-${subIdx}`}
//                                         type="checkbox"
//                                         style={mobileFilterStyles.checkbox}
//                                         checked={filters.subcategory === sub.name}
//                                         onChange={() => toggleFilter('subcategory', sub.name)}
//                                     />
//                                     {sub.name}
//                                 </label>
//                             ))
//                             : null}
//                     </React.Fragment>
//                 ))}
//             </Section>

//             <Section title="Designation">
//                 <Check id="m-des-wd" label="Web Designer" name="designation" value="web_designer" />
//                 <Check id="m-des-pd" label="PHP Developer" name="designation" value="php_developer" />
//                 <Check id="m-des-pm" label="Project Manager" name="designation" value="project_manager" />
//                 <Check id="m-des-hr" label="Human Resource" name="designation" value="human_resource" />
//                 <Check id="m-des-cm" label="CMS Developer" name="designation" value="cms_developer" />
//                 <Check id="m-des-ad" label="App Developer" name="designation" value="app_developer" />
//             </Section>

//             <Section title="Experience">
//                 <Check id="m-exp-1" label="1Year To 2Year" name="experience" value="1_year" />
//                 <Check id="m-exp-2" label="2Year To 3Year" name="experience" value="2_years" />
//                 <Check id="m-exp-3" label="3Year To 4Year" name="experience" value="3_years" />
//                 <Check id="m-exp-4" label="4Year To 5Year" name="experience" value="4_years" />
//                 <Check id="m-exp-5" label="5Year To 7Year" name="experience" value="5+_years" />
//             </Section>

//             <Section title="Posted Time">
//                 <Check id="m-time-1" label="1 day ago" name="timePosted" value="1_day" />
//                 <Check id="m-time-2" label="3 days ago" name="timePosted" value="3_days" />
//                 <Check id="m-time-3" label="1 week ago" name="timePosted" value="1_week" />
//                 <Check id="m-time-4" label="2 weeks ago" name="timePosted" value="2_weeks" />
//                 <Check id="m-time-5" label="1 month ago" name="timePosted" value="1_month" />
//                 <Check id="m-time-6" label="3 months ago" name="timePosted" value="3_months" />
//                 <Check id="m-time-7" label="6 months ago" name="timePosted" value="6_months" />
//             </Section>

//             <Section title="Salary Range">
//                 {SALARY_FILTER_OPTIONS.map((opt, idx) => (
//                     <Check
//                         key={opt.value}
//                         id={`m-salary-${idx}`}
//                         label={opt.label}
//                         name="salary"
//                         value={opt.value}
//                     />
//                 ))}
//             </Section>

//             <button type="button" style={mobileFilterStyles.applyFiltersBtn} onClick={onApply}>
//                 Apply Filters
//             </button>
//         </>
//     );
// }

// // ---- Naukri-style desktop sidebar styles + helpers ----
// const GREEN = '#16a34a';
// const GREEN_DARK = '#15803d';

// // Built-in popular roles/skills used to seed AI-style autosuggest.
// const POPULAR_ROLES = [
//     'React Developer', 'Java Developer', 'Data Analyst', 'Digital Marketing',
//     'Sales Executive', 'UI/UX Designer', 'DevOps Engineer', 'Accountant',
//     'HR Manager', 'Customer Support', 'Python Developer', 'Node.js Developer',
//     'Business Analyst', 'Content Writer', 'Graphic Designer', 'Civil Engineer',
//     'Mechanical Engineer', 'Nurse', 'Teacher', 'Project Manager',
//     'Full Stack Developer', 'Marketing Manager', 'Operations Manager',
//     'Flutter Developer', 'Cyber Security',
// ];

// // Tiny inline count-up driven by framer-motion `animate` once the tile is in view.
// function CountUp({ value }) {
//     const ref = useRef(null);
//     const inView = useInView(ref, { once: true, margin: '0px 0px -40px 0px' });
//     const [display, setDisplay] = useState(0);

//     useEffect(() => {
//         if (!inView) return undefined;
//         const controls = animate(0, Number(value) || 0, {
//             duration: 1.1,
//             ease: 'easeOut',
//             onUpdate: (latest) => setDisplay(Math.round(latest)),
//         });
//         return () => controls.stop();
//     }, [inView, value]);

//     return <span ref={ref}>{display.toLocaleString('en-IN')}</span>;
// }

// function StatTile({ icon, label, value, delay }) {
//     return (
//         <motion.div
//             initial={{ opacity: 0, y: 16 }}
//             animate={{ opacity: 1, y: 0 }}
//             transition={{ duration: 0.45, delay, ease: 'easeOut' }}
//             className="njk-stat-tile"
//         >
//             <span className="njk-stat-icon" aria-hidden="true">{icon}</span>
//             <div style={{ minWidth: 0 }}>
//                 <div className="njk-stat-value"><CountUp value={value} /></div>
//                 <div className="njk-stat-label">{label}</div>
//             </div>
//         </motion.div>
//     );
// }

// const sidebarStyles = {
//     panel: {
//         background: '#fff',
//         border: '1px solid rgba(148,163,184,0.18)',
//         borderRadius: '14px',
//         boxShadow: '0 6px 18px rgba(15,23,42,0.06)',
//         overflow: 'hidden',
//         position: 'sticky',
//         top: '88px',
//     },
//     head: {
//         display: 'flex',
//         alignItems: 'center',
//         justifyContent: 'space-between',
//         padding: '16px 18px',
//         borderBottom: '1px solid #e2e8f0',
//     },
//     headTitle: {
//         margin: 0,
//         fontSize: '16px',
//         fontWeight: 700,
//         color: '#0f172a',
//         display: 'flex',
//         alignItems: 'center',
//         gap: '8px',
//     },
//     headBadge: {
//         background: 'rgba(22,163,74,0.10)',
//         color: GREEN,
//         borderRadius: '999px',
//         padding: '1px 8px',
//         fontSize: '12px',
//         fontWeight: 700,
//     },
//     clearLink: {
//         background: 'none',
//         border: 'none',
//         cursor: 'pointer',
//         fontSize: '13px',
//         color: GREEN,
//         fontWeight: 600,
//         padding: 0,
//     },
//     searchWrap: { padding: '14px 18px', borderBottom: '1px solid #f1f5f9' },
//     searchInput: {
//         width: '100%',
//         padding: '10px 12px',
//         borderRadius: '10px',
//         border: '1px solid #e2e8f0',
//         fontSize: '14px',
//         outline: 'none',
//         boxSizing: 'border-box',
//         marginBottom: '10px',
//         color: '#0f172a',
//     },
//     sectionWrap: { borderBottom: '1px solid #f1f5f9' },
//     sectionHead: {
//         width: '100%',
//         display: 'flex',
//         alignItems: 'center',
//         justifyContent: 'space-between',
//         padding: '14px 18px',
//         background: 'none',
//         border: 'none',
//         cursor: 'pointer',
//         fontSize: '13px',
//         fontWeight: 700,
//         color: '#0f172a',
//         textTransform: 'uppercase',
//         letterSpacing: '0.4px',
//     },
//     sectionBody: { padding: '0 18px 14px' },
//     checkRow: {
//         display: 'flex',
//         alignItems: 'center',
//         gap: '9px',
//         marginBottom: '9px',
//         cursor: 'pointer',
//         fontSize: '14px',
//         color: '#475569',
//     },
//     checkbox: { accentColor: GREEN, width: '15px', height: '15px', cursor: 'pointer', flexShrink: 0 },
// };

// function SidebarSection({ title, defaultOpen = false, children }) {
//     const [open, setOpen] = useState(defaultOpen);
//     return (
//         <div style={sidebarStyles.sectionWrap}>
//             <button type="button" style={sidebarStyles.sectionHead} onClick={() => setOpen((o) => !o)} aria-expanded={open}>
//                 <span>{title}</span>
//                 <i className={open ? 'ti-minus' : 'ti-plus'} style={{ color: GREEN, fontSize: '12px' }} aria-hidden="true" />
//             </button>
//             {open && <div style={sidebarStyles.sectionBody}>{children}</div>}
//         </div>
//     );
// }

// function AllJobs() {

//     const navigate = useNavigate();
//     const { user } = useAuth();
//     const [searchParams] = useSearchParams();
//     const [jobs, setJobs] = useState([]);
//     const [loading, setLoading] = useState(false);
//     const [message, setMessage] = useState("");
//     const [page, setPage] = useState(1);
//     const [totalPages, setTotalPages] = useState(1);
//     const [totalJobs, setTotalJobs] = useState(0);
//     const [itemsPerPage, setItemsPerPage] = useState(10);
//     const [filters, setFilters] = useState({ q: '', city: '', jobType: '', salary: '', qualification: '', designation: '', experience: '', category: '', subcategory: '', timePosted: '' });
//     const [applyOpen, setApplyOpen] = useState(false);
//     const [applyJob, setApplyJob] = useState(null);
//     const [applyForm, setApplyForm] = useState({ name: '', email: '', phone: '', resume: null, pastedCv: '' });
//     const [focusedField, setFocusedField] = useState(null);
//     const [, setCategories] = useState([]);
//     const [, setAllCategories] = useState([]);
//     const [, setSearchKeyword] = useState('');
//     const [, setSearchCategory] = useState('');
//     const [appliedJobIds, setAppliedJobIds] = useState(new Set());
//     const [drawerOpen, setDrawerOpen] = useState(false);
//     const drawerRef = useRef(null);
//     // AI-style autosuggest for the hero keyword search
//     const [showSuggestions, setShowSuggestions] = useState(false);
//     const [highlightIndex, setHighlightIndex] = useState(-1);
//     const suggestRef = useRef(null);
//     const { categories: jobCategories, subcategories: categorySubcategories } = useJobCategories(filters.category);

//     // Pool of suggestion candidates: loaded jobs (title/company/skills) + popular roles.
//     const suggestionPool = useMemo(() => {
//         const pool = [...POPULAR_ROLES];
//         jobs.forEach((job) => {
//             if (job.jobTitle || job.title) pool.push(String(job.jobTitle || job.title));
//             if (job.companyName || job.company) pool.push(String(job.companyName || job.company));
//             const skillsRaw = job.skills || job.keySkills || job.key_skills || job.skillsRequired || '';
//             (Array.isArray(skillsRaw) ? skillsRaw : String(skillsRaw).split(','))
//                 .map((s) => String(s).trim())
//                 .filter(Boolean)
//                 .forEach((s) => pool.push(s));
//         });
//         // De-duplicate case-insensitively, keeping first-seen casing.
//         const seen = new Set();
//         const unique = [];
//         pool.forEach((item) => {
//             const trimmed = item.trim();
//             if (!trimmed) return;
//             const key = trimmed.toLowerCase();
//             if (seen.has(key)) return;
//             seen.add(key);
//             unique.push(trimmed);
//         });
//         return unique;
//     }, [jobs]);

//     // Top 8 matches, ranking startsWith above includes.
//     const suggestions = useMemo(() => {
//         const q = filters.q.trim().toLowerCase();
//         if (!q) return [];
//         const starts = [];
//         const contains = [];
//         suggestionPool.forEach((item) => {
//             const lower = item.toLowerCase();
//             if (lower === q) return;
//             if (lower.startsWith(q)) starts.push(item);
//             else if (lower.includes(q)) contains.push(item);
//         });
//         return [...starts, ...contains].slice(0, 8);
//     }, [filters.q, suggestionPool]);

//     // Stats for the animated infographic band.
//     const distinctCompanies = useMemo(() => {
//         const set = new Set();
//         jobs.forEach((job) => {
//             const c = (job.companyName || job.company || '').trim().toLowerCase();
//             if (c) set.add(c);
//         });
//         return set.size;
//     }, [jobs]);

//     const distinctLocations = useMemo(() => {
//         const set = new Set();
//         jobs.forEach((job) => {
//             const c = (job.city || job.state || job.country || '').trim().toLowerCase();
//             if (c) set.add(c);
//         });
//         return set.size;
//     }, [jobs]);

//     const newThisWeek = useMemo(() => {
//         const cutoff = Date.now() - 7 * 24 * 60 * 60 * 1000;
//         return jobs.filter((job) => {
//             const d = new Date(job.createdAt || job.created_at || job.postedDate).getTime();
//             return !Number.isNaN(d) && d >= cutoff;
//         }).length;
//     }, [jobs]);

//     const runSearch = (value) => {
//         setFilters((prev) => ({ ...prev, q: value }));
//         setSearchKeyword(value);
//         setPage(1);
//         setShowSuggestions(false);
//         setHighlightIndex(-1);
//         if (value && value.trim()) trackSearch(value.trim());
//     };

//     const activeFilterCount = [
//         filters.q,
//         filters.city,
//         filters.jobType,
//         filters.designation,
//         filters.experience,
//         filters.qualification,
//         filters.category,
//         filters.subcategory,
//         filters.timePosted,
//         filters.salary,
//     ].filter(Boolean).length;

//     const clearAllFilters = () => {
//         setPage(1);
//         setFilters({
//             q: '',
//             city: '',
//             jobType: '',
//             salary: '',
//             qualification: '',
//             designation: '',
//             experience: '',
//             category: '',
//             subcategory: '',
//             timePosted: '',
//         });
//         setSearchKeyword('');
//         setSearchCategory('');
//     };

//     // Close the autosuggest dropdown on outside click.
//     useEffect(() => {
//         const handleMouseDown = (e) => {
//             if (suggestRef.current && !suggestRef.current.contains(e.target)) {
//                 setShowSuggestions(false);
//                 setHighlightIndex(-1);
//             }
//         };
//         document.addEventListener('mousedown', handleMouseDown);
//         return () => document.removeEventListener('mousedown', handleMouseDown);
//     }, []);

//     useEffect(() => {
//         if (drawerOpen) {
//             document.body.style.overflow = 'hidden';
//         } else {
//             document.body.style.overflow = '';
//         }
//         return () => {
//             document.body.style.overflow = '';
//         };
//     }, [drawerOpen]);

//     // Fetch categories for search dropdown
//     useEffect(() => {
//         const fetchCategories = async () => {
//             try {
//                 const response = await fetch(`${API_BASE_URL}/api/jobs/categories`);
//                 if (response.ok) {
//                     const data = await response.json();
//                     setCategories(data.categories || []);
//                     setAllCategories(data.allCategories || []);
//                 }
//             } catch (error) {
//                 console.error('Error fetching categories:', error);
//             }
//         };
//         fetchCategories();
//     }, [API_BASE_URL]);

//     // Read filters from URL on mount / when navigating from Home search
//     useEffect(() => {
//         const categoryParam = searchParams.get('category');
//         const subcategoryParam = searchParams.get('subcategory');
//         const qParam = searchParams.get('q');
//         const cityParam = searchParams.get('city');

//         setPage(1);
//         setFilters((prev) => {
//             const next = { ...prev };
//             next.category = categoryParam ? decodeURIComponent(categoryParam) : '';
//             next.subcategory = subcategoryParam ? decodeURIComponent(subcategoryParam) : '';
//             next.q = qParam ? decodeURIComponent(qParam) : '';
//             next.city = cityParam ? decodeURIComponent(cityParam) : '';
//             return next;
//         });

//         if (categoryParam) {
//             setSearchCategory(decodeURIComponent(categoryParam));
//         } else {
//             setSearchCategory('');
//         }
//         if (qParam) {
//             const decodedQ = decodeURIComponent(qParam);
//             setSearchKeyword(decodedQ);
//             trackSearch(decodedQ);
//         } else {
//             setSearchKeyword('');
//         }

//         const minSalaryParam = searchParams.get('minSalary');
//         const maxSalaryParam = searchParams.get('maxSalary');
//         if (minSalaryParam || maxSalaryParam) {
//             const matched = findSalaryFilterByRange(minSalaryParam, maxSalaryParam);
//             if (matched) {
//                 setFilters((prev) => ({ ...prev, salary: matched.value }));
//             }
//         }
//     }, [searchParams]);

//     useEffect(() => {
//         const fetchPublicJobs = async () => {
//             try {
//                 setLoading(true);
//                 const params = new URLSearchParams();

//                 const needsClientSideFilter =
//                     filters.timePosted || filters.category || filters.subcategory;

//                 // Fetch more jobs when client-side category/subcategory or time filters apply
//                 if (needsClientSideFilter) {
//                     params.set('page', '1');
//                     params.set('limit', '1000');
//                 } else {
//                     params.set('page', String(page));
//                     params.set('limit', String(itemsPerPage));
//                 }

//                 // Don't send timePosted/salary (handled separately) or category/subcategory
//                 // to the backend: the backend does an exact `category = ?` match against a
//                 // slug (e.g. "information_technology"), but the UI passes the category NAME
//                 // (e.g. "Information Technology"). Category/subcategory are matched
//                 // client-side via applyCategorySubcategoryFilters instead.
//                 const SKIP_BACKEND_PARAMS = ['timePosted', 'salary', 'category', 'subcategory'];
//                 Object.entries(filters).forEach(([k, v]) => {
//                     if (v && !SKIP_BACKEND_PARAMS.includes(k)) params.set(k, v);
//                 });
//                 if (filters.salary) {
//                     const salaryOpt = SALARY_FILTER_OPTIONS.find((o) => o.value === filters.salary);
//                     if (salaryOpt) {
//                         if (salaryOpt.minSalary != null) params.set('minSalary', String(salaryOpt.minSalary));
//                         if (salaryOpt.maxSalary != null) params.set('maxSalary', String(salaryOpt.maxSalary));
//                     }
//                 } else {
//                     const urlMin = searchParams.get('minSalary');
//                     const urlMax = searchParams.get('maxSalary');
//                     if (urlMin) params.set('minSalary', urlMin);
//                     if (urlMax) params.set('maxSalary', urlMax);
//                 }

//                 let resp = await fetch(`${API_BASE_URL}/api/jobs?${params.toString()}`, {
//                     method: 'GET',
//                     headers: { 'Accept': 'application/json' },
//                     credentials: 'include'
//                 });
//                 if (!resp.ok) {
//                     // fallback to employer jobs if public endpoint not available
//                     resp = await fetch(`${API_BASE_URL}/api/employer/jobs`, {
//                         method: 'GET',
//                         headers: { 'Accept': 'application/json' },
//                         credentials: 'include'
//                     });
//                 }
//                 if (resp.ok) {
//                     const data = await resp.json();
//                     let list = Array.isArray(data.jobs) ? data.jobs : Array.isArray(data) ? data : [];

//                     if (filters.category || filters.subcategory) {
//                         list = applyCategorySubcategoryFilters(
//                             list,
//                             filters.category,
//                             filters.subcategory
//                         );
//                     }

//                     // Filter by timePosted if selected (client-side filtering)
//                     if (filters.timePosted) {
//                         const now = new Date();
//                         let cutoffDate = new Date();

//                         switch (filters.timePosted) {
//                             case '1_day':
//                                 cutoffDate.setDate(now.getDate() - 1);
//                                 break;
//                             case '3_days':
//                                 cutoffDate.setDate(now.getDate() - 3);
//                                 break;
//                             case '1_week':
//                                 cutoffDate.setDate(now.getDate() - 7);
//                                 break;
//                             case '2_weeks':
//                                 cutoffDate.setDate(now.getDate() - 14);
//                                 break;
//                             case '1_month':
//                                 cutoffDate.setMonth(now.getMonth() - 1);
//                                 break;
//                             case '3_months':
//                                 cutoffDate.setMonth(now.getMonth() - 3);
//                                 break;
//                             case '6_months':
//                                 cutoffDate.setMonth(now.getMonth() - 6);
//                                 break;
//                             default:
//                                 cutoffDate = null;
//                         }

//                         if (cutoffDate) {
//                             list = list.filter(job => {
//                                 const jobDate = new Date(job.createdAt || job.created_at || job.postedDate);
//                                 return jobDate >= cutoffDate && jobDate <= now;
//                             });
//                         }

//                         // Apply client-side pagination after filtering
//                         const startIndex = (page - 1) * itemsPerPage;
//                         const endIndex = startIndex + itemsPerPage;
//                         const paginatedList = list.slice(startIndex, endIndex);
//                         const filteredTotal = list.length;
//                         const filteredTotalPages = Math.ceil(filteredTotal / itemsPerPage);

//                         setTotalPages(filteredTotalPages || 1);
//                         setTotalJobs(filteredTotal);
//                         setJobs(paginatedList);
//                     } else if (filters.category || filters.subcategory) {
//                         const startIndex = (page - 1) * itemsPerPage;
//                         const endIndex = startIndex + itemsPerPage;
//                         const paginatedList = list.slice(startIndex, endIndex);
//                         const filteredTotal = list.length;
//                         const filteredTotalPages = Math.ceil(filteredTotal / itemsPerPage);

//                         setTotalPages(filteredTotalPages || 1);
//                         setTotalJobs(filteredTotal);
//                         setJobs(paginatedList);
//                     } else {
//                         // Normal server-side pagination
//                         const p = data.pagination || {};
//                         setTotalPages(p.totalPages || 1);
//                         setTotalJobs(p.total || list.length);
//                         setJobs(list);
//                     }
//                 } else {
//                     setMessage('Failed to load jobs');
//                     setTimeout(() => setMessage(''), 4000);
//                 }
//             } catch (_) {
//                 setMessage('Failed to load jobs');
//                 setTimeout(() => setMessage(''), 4000);
//             } finally {
//                 setLoading(false);
//             }
//         };
//         fetchPublicJobs();
//     }, [API_BASE_URL, page, filters, itemsPerPage, searchParams]);

//     useEffect(() => {
//         const fetchAppliedJobs = async () => {
//             try {
//                 if (!user || user.role !== 'seeker') {
//                     setAppliedJobIds(new Set());
//                     return;
//                 }

//                 const token = localStorage.getItem('token');
//                 if (!token) {
//                     setAppliedJobIds(new Set());
//                     return;
//                 }

//                 const resp = await fetch(`${API_BASE_URL}/api/applications/mine`, {
//                     headers: {
//                         Authorization: `Bearer ${token}`,
//                         Accept: 'application/json',
//                     },
//                 });

//                 if (!resp.ok) return;

//                 const data = await resp.json();
//                 const ids = (Array.isArray(data.applications) ? data.applications : [])
//                     .map((application) => String(application.jobId))
//                     .filter(Boolean);
//                 setAppliedJobIds(new Set(ids));
//             } catch (error) {
//                 console.error('Error fetching applied jobs:', error);
//             }
//         };

//         fetchAppliedJobs();
//     }, [user]);

//     const toggleFilter = (name, value) => {
//         setPage(1);
//         setFilters(prev => {
//             const next = { ...prev, [name]: prev[name] === value ? '' : value };
//             if (name === 'category') {
//                 next.subcategory = '';
//             }
//             return next;
//         });
//     };

//     const openApply = (job) => {
//         if (!user) {
//             const signinBtn = document.querySelector('[data-target="#signin"]');
//             if (signinBtn) {
//                 signinBtn.click();
//             }
//             return;
//         }
//         setApplyJob(job);
//         setApplyForm(prev => ({ ...prev, name: '', email: '', phone: '', resume: null, pastedCv: '' }));
//         setApplyOpen(true);
//     };

//     const submitApplication = async () => {
//         // Validation: Check if required fields are empty
//         if (!applyForm.name || !applyForm.name.trim()) {
//             setMessage('Please enter your name');
//             setTimeout(() => setMessage(''), 4000);
//             return;
//         }
//         if (!applyForm.email || !applyForm.email.trim()) {
//             setMessage('Please enter your email');
//             setTimeout(() => setMessage(''), 4000);
//             return;
//         }
//         // Email format validation
//         const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
//         if (!emailRegex.test(applyForm.email.trim())) {
//             setMessage('Please enter a valid email address');
//             setTimeout(() => setMessage(''), 4000);
//             return;
//         }

//         try {
//             const token = localStorage.getItem('token');
//             if (!token) {
//                 setMessage('Please login to apply');
//                 setTimeout(() => setMessage(''), 4000);
//                 return;
//             }
//             const formData = new FormData();
//             formData.append('name', applyForm.name.trim());
//             formData.append('email', applyForm.email.trim());
//             if (applyForm.phone) formData.append('phone', applyForm.phone.trim());
//             if (applyForm.pastedCv) formData.append('pastedCv', applyForm.pastedCv.trim());
//             if (applyForm.resume) formData.append('resume', applyForm.resume);
//             const resp = await fetch(`${API_BASE_URL}/api/jobs/${applyJob.id || applyJob._id}/apply`, {
//                 method: 'POST',
//                 headers: { 'Authorization': `Bearer ${token}` },
//                 body: formData,
//                 credentials: 'include'
//             });
//             if (resp.ok) {
//                 setMessage('Applied successfully');
//                 setApplyOpen(false);
//                 if (applyJob?.id || applyJob?._id) {
//                     const appliedId = String(applyJob.id || applyJob._id);
//                     setAppliedJobIds((prev) => {
//                         const next = new Set(prev);
//                         next.add(appliedId);
//                         return next;
//                     });
//                 }
//                 setTimeout(() => setMessage(''), 4000);
//             } else {
//                 const errorData = await resp.json().catch(() => ({ message: 'Unknown error' }));

//                 // Check for duplicate application error
//                 if (errorData.code === 'DUPLICATE_APPLICATION' ||
//                     (errorData.message && errorData.message.includes('already applied'))) {
//                     setMessage('You have already applied for this job');
//                     if (applyJob?.id || applyJob?._id) {
//                         const appliedId = String(applyJob.id || applyJob._id);
//                         setAppliedJobIds((prev) => {
//                             const next = new Set(prev);
//                             next.add(appliedId);
//                             return next;
//                         });
//                     }
//                 } else {
//                     setMessage(`Failed to apply: ${errorData.message || 'Please try again'}`);
//                 }
//                 setTimeout(() => setMessage(''), 4000);
//             }
//         } catch (e) {
//             setMessage('Failed to apply');
//             setTimeout(() => setMessage(''), 4000);
//         }
//     };

//     return (

//         <>
//             <PageSEO
//                 title="Top Manpower Consultancy in Bhubaneswar | Uptula Jobs"
//                 description="Looking for top job vacancies in Bhubaneswar? Uptula is Odisha's trusted manpower consultancy. Find jobs near you and get hired faster. Apply today."
//             />
//             {message && (
//                 <div className={`alert ${message.includes('Failed') ? 'alert-danger' : 'alert-success'}`} style={{ position: 'fixed', top: '20px', right: '20px', zIndex: 9999 }}>
//                     {message}
//                 </div>
//             )}
//             <Header />

//             {drawerOpen && (
//                 <div style={mobileFilterStyles.overlay} onClick={() => setDrawerOpen(false)}>
//                     <div
//                         ref={drawerRef}
//                         style={mobileFilterStyles.drawer(drawerOpen)}
//                         onClick={(e) => e.stopPropagation()}
//                         role="dialog"
//                         aria-modal="true"
//                         aria-label="Job filters"
//                     >
//                         <div style={mobileFilterStyles.drawerHead}>
//                             <h5 style={mobileFilterStyles.drawerTitle}>Filters</h5>
//                             <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
//                                 {activeFilterCount > 0 && (
//                                     <button type="button" style={mobileFilterStyles.clearAll} onClick={clearAllFilters}>
//                                         Clear all
//                                     </button>
//                                 )}
//                                 <button type="button" style={mobileFilterStyles.closeBtn} onClick={() => setDrawerOpen(false)} aria-label="Close filters">
//                                     ✕
//                                 </button>
//                             </div>
//                         </div>
//                         <MobileFilterPanel
//                             filters={filters}
//                             setFilters={setFilters}
//                             setPage={setPage}
//                             setSearchKeyword={setSearchKeyword}
//                             toggleFilter={toggleFilter}
//                             onApply={() => setDrawerOpen(false)}
//                             jobCategories={jobCategories}
//                             categorySubcategories={categorySubcategories}
//                         />
//                     </div>
//                 </div>
//             )}

//             {/* ====================== Start Job Detail 2 ================ */}
//             <section className="njk-listing-section" style={{ background: '#f2f4f8', padding: '110px 0 64px' }}>
//                 <style>{`
//                         .njk-wrap { max-width: 1240px; margin: 0 auto; padding: 0 16px; }
//                         .njk-grid { display: flex; align-items: flex-start; gap: 22px; }
//                         .njk-sidebar { width: 290px; flex-shrink: 0; }
//                         .njk-main { flex: 1; min-width: 0; }
//                         .njk-mobilebar { display: none; }
//                         .njk-skill-chip {
//                             background: #f1f5f9; color: #475569; border-radius: 999px;
//                             padding: 4px 11px; font-size: 12px; font-weight: 500;
//                             max-width: 100%;
//                             min-width: 0;
//                             overflow: hidden;
//                             text-overflow: ellipsis;
//                             white-space: nowrap;
//                             display: inline-block;
//                             vertical-align: top;
//                             box-sizing: border-box;
//                         }
//                         .njk-card-title { color: #0f172a; }
//                         .njk-card-title:hover { color: ${GREEN}; }
//                         .njk-apply-btn {
//                             background: ${GREEN}; color: #fff; border: none; border-radius: 9px;
//                             padding: 9px 20px; font-size: 14px; font-weight: 600; cursor: pointer;
//                             transition: background 150ms ease; white-space: nowrap;
//                         }
//                         .njk-apply-btn:hover { background: ${GREEN_DARK}; }
//                         @media (max-width: 991px) {
//                             .njk-sidebar { display: none; }
//                             .njk-grid { gap: 0; }
//                             .njk-mobilebar { display: flex; }
//                         }
//                         @media (max-width: 600px) {
//                             .njk-listing-section { padding: 18px 0 48px; }
//                             .njk-card-meta { gap: 10px 14px; }
//                         }

//                         /* ---- Futuristic hero header + AI autosuggest ---- */
//                         .njk-hero {
//                             position: relative;
//                             z-index: 30;
//                             border-radius: 18px;
//                             padding: 26px 24px 24px;
//                             margin-bottom: 18px;
//                             background: linear-gradient(120deg, ${GREEN} 0%, ${GREEN_DARK} 52%, #0f766e 100%);
//                             box-shadow: 0 14px 38px rgba(15,118,110,0.28);
//                             /* overflow visible so the autosuggest dropdown can extend below the hero */
//                             overflow: visible;
//                         }
//                         .njk-hero::after {
//                             content: '';
//                             position: absolute;
//                             inset: 0;
//                             border-radius: inherit;
//                             background:
//                                 radial-gradient(420px 200px at 12% -10%, rgba(255,255,255,0.22), transparent 60%),
//                                 radial-gradient(360px 220px at 100% 120%, rgba(255,255,255,0.14), transparent 60%);
//                             pointer-events: none;
//                         }
//                         .njk-hero-inner { position: relative; z-index: 1; }
//                         .njk-hero-eyebrow {
//                             display: inline-flex; align-items: center; gap: 7px;
//                             background: rgba(255,255,255,0.18);
//                             border: 1px solid rgba(255,255,255,0.30);
//                             backdrop-filter: blur(6px);
//                             color: #fff; font-size: 12px; font-weight: 700;
//                             letter-spacing: 0.4px; text-transform: uppercase;
//                             padding: 5px 12px; border-radius: 999px; margin-bottom: 12px;
//                         }
//                         .njk-hero-title {
//                             margin: 0 0 4px; color: #fff; font-size: 26px;
//                             font-weight: 800; line-height: 1.2;
//                         }
//                         .njk-hero-sub { margin: 0 0 18px; color: rgba(255,255,255,0.88); font-size: 14px; }
//                         .njk-hero-searchrow { position: relative; max-width: 620px; }
//                         .njk-hero-searchbox {
//                             display: flex; align-items: center; gap: 10px;
//                             background: rgba(255,255,255,0.96);
//                             border: 1px solid rgba(255,255,255,0.6);
//                             border-radius: 14px;
//                             padding: 6px 6px 6px 14px;
//                             box-shadow: 0 10px 26px rgba(15,23,42,0.18);
//                         }
//                         .njk-hero-input {
//                             flex: 1; min-width: 0; border: none; outline: none;
//                             background: transparent; font-size: 15px; color: #0f172a;
//                             padding: 10px 2px;
//                         }
//                         .njk-hero-btn {
//                             display: inline-flex; align-items: center; gap: 7px;
//                             background: ${GREEN}; color: #fff; border: none;
//                             border-radius: 10px; padding: 11px 18px; font-size: 14px;
//                             font-weight: 700; cursor: pointer; white-space: nowrap;
//                             transition: background 150ms ease;
//                         }
//                         .njk-hero-btn:hover { background: ${GREEN_DARK}; }

//                         .njk-suggest {
//                             position: absolute; top: calc(100% + 8px); left: 0; right: 0;
//                             background: #fff; border: 1px solid rgba(148,163,184,0.22);
//                             border-radius: 14px; box-shadow: 0 16px 40px rgba(15,23,42,0.16);
//                             z-index: 50; overflow: hidden;
//                         }
//                         .njk-suggest-head {
//                             display: flex; align-items: center; gap: 7px;
//                             padding: 9px 14px; font-size: 11px; font-weight: 700;
//                             letter-spacing: 0.5px; text-transform: uppercase;
//                             color: ${GREEN}; background: rgba(22,163,74,0.10);
//                             border-bottom: 1px solid rgba(22,163,74,0.14);
//                         }
//                         .njk-suggest-item {
//                             display: flex; align-items: center; gap: 10px;
//                             padding: 10px 14px; font-size: 14px; color: #0f172a;
//                             cursor: pointer; border: none; background: none;
//                             width: 100%; text-align: left;
//                         }
//                         .njk-suggest-item:hover, .njk-suggest-item.active {
//                             background: rgba(22,163,74,0.10);
//                         }
//                         .njk-suggest-item .njk-suggest-ico { color: #94a3b8; font-size: 14px; flex-shrink: 0; }
//                         .njk-suggest-item.active .njk-suggest-ico { color: ${GREEN}; }

//                         /* ---- Animated stat infographic band ---- */
//                         .njk-stats {
//                             display: grid; grid-template-columns: repeat(4, 1fr);
//                             gap: 14px; margin-bottom: 22px;
//                         }
//                         .njk-stat-tile {
//                             display: flex; align-items: center; gap: 12px;
//                             background: #fff; border: 1px solid rgba(148,163,184,0.18);
//                             border-radius: 14px; padding: 16px 16px;
//                             box-shadow: 0 6px 18px rgba(15,23,42,0.06);
//                         }
//                         .njk-stat-icon {
//                             display: inline-flex; align-items: center; justify-content: center;
//                             width: 42px; height: 42px; flex-shrink: 0; border-radius: 12px;
//                             background: rgba(22,163,74,0.10); color: ${GREEN}; font-size: 20px;
//                         }
//                         .njk-stat-value { font-size: 22px; font-weight: 800; color: #0f172a; line-height: 1.1; }
//                         .njk-stat-label { font-size: 12.5px; color: #64748b; font-weight: 600; }

//                         @media (max-width: 700px) {
//                             .njk-stats { grid-template-columns: repeat(2, 1fr); }
//                             .njk-hero { padding: 22px 16px; border-radius: 14px; }
//                             .njk-hero-title { font-size: 21px; }
//                             .njk-hero-searchbox { flex-wrap: wrap; }
//                             .njk-hero-btn { width: 100%; justify-content: center; }
//                         }
//                     `}</style>
//                 <div className="njk-wrap">
//                     {/* Futuristic hero header with AI-style autosuggest search */}
//                     <motion.div
//                         className="njk-hero"
//                         initial={{ opacity: 0, y: -18 }}
//                         animate={{ opacity: 1, y: 0 }}
//                         transition={{ duration: 0.5, ease: 'easeOut' }}
//                     >
//                         <div className="njk-hero-inner">
//                             <span className="njk-hero-eyebrow">
//                                 <FiZap aria-hidden="true" /> AI-Powered Job Search
//                             </span>
//                             <h1 className="njk-hero-title">Find your next role, faster</h1>
//                             <p className="njk-hero-sub">
//                                 Smart suggestions as you type — search across {totalJobs.toLocaleString('en-IN')} live openings.
//                             </p>

//                             <div className="njk-hero-searchrow" ref={suggestRef}>
//                                 <div className="njk-hero-searchbox">
//                                     <FiSearch style={{ color: '#94a3b8', fontSize: '18px', flexShrink: 0 }} aria-hidden="true" />
//                                     <input
//                                         type="text"
//                                         className="njk-hero-input"
//                                         placeholder="Search by role, company or skill…"
//                                         value={filters.q}
//                                         aria-label="Search jobs"
//                                         autoComplete="off"
//                                         onChange={(e) => {
//                                             const q = e.target.value;
//                                             setFilters((prev) => ({ ...prev, q }));
//                                             setSearchKeyword(q);
//                                             setPage(1);
//                                             setShowSuggestions(q.length >= 1);
//                                             setHighlightIndex(-1);
//                                             trackSearchDebounced(q);
//                                         }}
//                                         onFocus={() => { if (filters.q.length >= 1) setShowSuggestions(true); }}
//                                         onKeyDown={(e) => {
//                                             if (e.key === 'ArrowDown') {
//                                                 e.preventDefault();
//                                                 if (suggestions.length) {
//                                                     setShowSuggestions(true);
//                                                     setHighlightIndex((i) => (i + 1) % suggestions.length);
//                                                 }
//                                             } else if (e.key === 'ArrowUp') {
//                                                 e.preventDefault();
//                                                 if (suggestions.length) {
//                                                     setHighlightIndex((i) => (i <= 0 ? suggestions.length - 1 : i - 1));
//                                                 }
//                                             } else if (e.key === 'Enter') {
//                                                 e.preventDefault();
//                                                 if (showSuggestions && highlightIndex >= 0 && suggestions[highlightIndex]) {
//                                                     runSearch(suggestions[highlightIndex]);
//                                                 } else {
//                                                     runSearch(filters.q);
//                                                 }
//                                             } else if (e.key === 'Escape') {
//                                                 setShowSuggestions(false);
//                                                 setHighlightIndex(-1);
//                                             }
//                                         }}
//                                     />
//                                     <button
//                                         type="button"
//                                         className="njk-hero-btn"
//                                         onClick={() => runSearch(filters.q)}
//                                     >
//                                         <FiSearch aria-hidden="true" /> Search
//                                     </button>
//                                 </div>

//                                 {showSuggestions && suggestions.length > 0 && (
//                                     <motion.div
//                                         className="njk-suggest"
//                                         initial={{ opacity: 0, y: -6 }}
//                                         animate={{ opacity: 1, y: 0 }}
//                                         transition={{ duration: 0.18 }}
//                                         role="listbox"
//                                     >
//                                         <div className="njk-suggest-head">
//                                             <FiZap aria-hidden="true" /> AI Suggestions
//                                         </div>
//                                         {suggestions.map((s, idx) => (
//                                             <button
//                                                 type="button"
//                                                 key={`${s}-${idx}`}
//                                                 role="option"
//                                                 aria-selected={idx === highlightIndex}
//                                                 className={`njk-suggest-item${idx === highlightIndex ? ' active' : ''}`}
//                                                 onMouseEnter={() => setHighlightIndex(idx)}
//                                                 onMouseDown={(e) => { e.preventDefault(); runSearch(s); }}
//                                             >
//                                                 <FiSearch className="njk-suggest-ico" aria-hidden="true" />
//                                                 {s}
//                                             </button>
//                                         ))}
//                                     </motion.div>
//                                 )}
//                             </div>
//                         </div>
//                     </motion.div>

//                     {/* Animated infographic stat band */}
//                     <div className="njk-stats">
//                         <StatTile icon={<FiBriefcase />} label="Jobs Found" value={totalJobs} delay={0.05} />
//                         <StatTile icon={<FiHome />} label="Companies" value={distinctCompanies} delay={0.12} />
//                         <StatTile icon={<FiMapPin />} label="Locations" value={distinctLocations} delay={0.19} />
//                         <StatTile icon={<FiTrendingUp />} label="New This Week" value={newThisWeek} delay={0.26} />
//                     </div>

//                     <div className="njk-mobilebar" style={mobileFilterStyles.mobileSearchRow}>
//                         <input
//                             type="text"
//                             placeholder="Search jobs…"
//                             value={filters.q}
//                             style={mobileFilterStyles.mobileSearchInput}
//                             onChange={(e) => {
//                                 const q = e.target.value;
//                                 setFilters((prev) => ({ ...prev, q }));
//                                 setSearchKeyword(q);
//                                 setPage(1);
//                                 trackSearchDebounced(q);
//                             }}
//                             onKeyDown={(e) => {
//                                 if (e.key === 'Enter') {
//                                     e.preventDefault();
//                                     const q = (e.target.value || filters.q || '').trim();
//                                     if (q) trackSearch(q);
//                                 }
//                             }}
//                         />
//                         <button type="button" style={mobileFilterStyles.filterBtn} onClick={() => setDrawerOpen(true)}>
//                             <i className="ti-filter" />
//                             Filters
//                             {activeFilterCount > 0 && (
//                                 <span style={mobileFilterStyles.filterBadge}>{activeFilterCount}</span>
//                             )}
//                         </button>
//                     </div>
//                     <div className="njk-grid">
//                         {/* Left Filters Section (Naukri-style) */}
//                         <aside className="njk-sidebar">
//                             <div style={sidebarStyles.panel}>
//                                 <div style={sidebarStyles.head}>
//                                     <h4 style={sidebarStyles.headTitle}>
//                                         All Filters
//                                         {activeFilterCount > 0 && (
//                                             <span style={sidebarStyles.headBadge}>{activeFilterCount}</span>
//                                         )}
//                                     </h4>
//                                     {activeFilterCount > 0 && (
//                                         <button type="button" style={sidebarStyles.clearLink} onClick={clearAllFilters}>
//                                             Clear all
//                                         </button>
//                                     )}
//                                 </div>

//                                 <div style={sidebarStyles.searchWrap}>
//                                     <input
//                                         type="text"
//                                         placeholder="Search keywords"
//                                         value={filters.q}
//                                         style={sidebarStyles.searchInput}
//                                         onChange={(e) => {
//                                             const q = e.target.value;
//                                             setFilters(prev => ({ ...prev, q }));
//                                             setSearchKeyword(q);
//                                             setPage(1);
//                                             trackSearchDebounced(q);
//                                         }}
//                                         onKeyDown={(e) => {
//                                             if (e.key === 'Enter') {
//                                                 e.preventDefault();
//                                                 setPage(1);
//                                                 const q = (e.target.value || filters.q || '').trim();
//                                                 if (q) trackSearch(q);
//                                             }
//                                         }}
//                                     />
//                                     <input
//                                         type="text"
//                                         placeholder="All locations"
//                                         value={filters.city}
//                                         style={{ ...sidebarStyles.searchInput, marginBottom: 0 }}
//                                         onChange={(e) => {
//                                             setFilters(prev => ({ ...prev, city: e.target.value }));
//                                             setPage(1);
//                                         }}
//                                     />
//                                 </div>

//                                 <SidebarSection title="Experience" defaultOpen>
//                                     {[
//                                         { v: '1_year', l: '1 - 2 Years' },
//                                         { v: '2_years', l: '2 - 3 Years' },
//                                         { v: '3_years', l: '3 - 4 Years' },
//                                         { v: '4_years', l: '4 - 5 Years' },
//                                         { v: '5+_years', l: '5 - 7 Years' },
//                                     ].map((o) => (
//                                         <label key={o.v} style={sidebarStyles.checkRow} htmlFor={`d-exp-${o.v}`}>
//                                             <input id={`d-exp-${o.v}`} type="checkbox" style={sidebarStyles.checkbox}
//                                                 checked={filters.experience === o.v}
//                                                 onChange={() => toggleFilter('experience', o.v)} />
//                                             {o.l}
//                                         </label>
//                                     ))}
//                                 </SidebarSection>

//                                 <SidebarSection title="Salary" defaultOpen>
//                                     {SALARY_FILTER_OPTIONS.map((opt) => (
//                                         <label key={opt.value} style={sidebarStyles.checkRow} htmlFor={`d-sal-${opt.value}`}>
//                                             <input id={`d-sal-${opt.value}`} type="checkbox" style={sidebarStyles.checkbox}
//                                                 checked={filters.salary === opt.value}
//                                                 onChange={() => toggleFilter('salary', opt.value)} />
//                                             {opt.label}
//                                         </label>
//                                     ))}
//                                 </SidebarSection>

//                                 <SidebarSection title="Job Type" defaultOpen>
//                                     {[
//                                         { v: 'full_time', l: 'Full Time' },
//                                         { v: 'part_time', l: 'Part Time' },
//                                         { v: 'internship', l: 'Internship' },
//                                         { v: 'freelancer', l: 'Freelancer' },
//                                         { v: 'contract', l: 'Contract' },
//                                     ].map((o) => (
//                                         <label key={o.v} style={sidebarStyles.checkRow} htmlFor={`d-jt-${o.v}`}>
//                                             <input id={`d-jt-${o.v}`} type="checkbox" style={sidebarStyles.checkbox}
//                                                 checked={filters.jobType === o.v}
//                                                 onChange={() => toggleFilter('jobType', o.v)} />
//                                             {o.l}
//                                         </label>
//                                     ))}
//                                 </SidebarSection>

//                                 <SidebarSection title="Industry / Category">
//                                     {jobCategories.map((cat, idx) => (
//                                         <React.Fragment key={cat.id}>
//                                             <label style={sidebarStyles.checkRow} htmlFor={`d-cat-${idx}`}>
//                                                 <input id={`d-cat-${idx}`} type="checkbox" style={sidebarStyles.checkbox}
//                                                     checked={filters.category === cat.name}
//                                                     onChange={() => toggleFilter('category', cat.name)} />
//                                                 {cat.name}
//                                             </label>
//                                             {filters.category === cat.name
//                                                 ? categorySubcategories.map((sub, subIdx) => (
//                                                     <label key={sub.id}
//                                                         style={{ ...sidebarStyles.checkRow, paddingLeft: '24px', fontSize: '13px' }}
//                                                         htmlFor={`d-sub-${idx}-${subIdx}`}>
//                                                         <input id={`d-sub-${idx}-${subIdx}`} type="checkbox" style={sidebarStyles.checkbox}
//                                                             checked={filters.subcategory === sub.name}
//                                                             onChange={() => toggleFilter('subcategory', sub.name)} />
//                                                         {sub.name}
//                                                     </label>
//                                                 ))
//                                                 : null}
//                                         </React.Fragment>
//                                     ))}
//                                 </SidebarSection>

//                                 <SidebarSection title="Date Posted">
//                                     {[
//                                         { v: '1_day', l: 'Last 1 day' },
//                                         { v: '3_days', l: 'Last 3 days' },
//                                         { v: '1_week', l: 'Last 1 week' },
//                                         { v: '2_weeks', l: 'Last 2 weeks' },
//                                         { v: '1_month', l: 'Last 1 month' },
//                                         { v: '3_months', l: 'Last 3 months' },
//                                         { v: '6_months', l: 'Last 6 months' },
//                                     ].map((o) => (
//                                         <label key={o.v} style={sidebarStyles.checkRow} htmlFor={`d-time-${o.v}`}>
//                                             <input id={`d-time-${o.v}`} type="checkbox" style={sidebarStyles.checkbox}
//                                                 checked={filters.timePosted === o.v}
//                                                 onChange={() => toggleFilter('timePosted', o.v)} />
//                                             {o.l}
//                                         </label>
//                                     ))}
//                                 </SidebarSection>

//                                 <SidebarSection title="Designation">
//                                     {[
//                                         { v: 'web_designer', l: 'Web Designer' },
//                                         { v: 'php_developer', l: 'PHP Developer' },
//                                         { v: 'project_manager', l: 'Project Manager' },
//                                         { v: 'human_resource', l: 'Human Resource' },
//                                         { v: 'cms_developer', l: 'CMS Developer' },
//                                         { v: 'app_developer', l: 'App Developer' },
//                                     ].map((o) => (
//                                         <label key={o.v} style={sidebarStyles.checkRow} htmlFor={`d-des-${o.v}`}>
//                                             <input id={`d-des-${o.v}`} type="checkbox" style={sidebarStyles.checkbox}
//                                                 checked={filters.designation === o.v}
//                                                 onChange={() => toggleFilter('designation', o.v)} />
//                                             {o.l}
//                                         </label>
//                                     ))}
//                                 </SidebarSection>
//                             </div>
//                         </aside>
//                         {/* Main Section - Job Cards (Naukri-style) */}
//                         <div className="njk-main">
//                             <div style={{
//                                 display: 'flex',
//                                 alignItems: 'center',
//                                 justifyContent: 'space-between',
//                                 flexWrap: 'wrap',
//                                 gap: '8px',
//                                 marginBottom: '16px',
//                             }}>
//                                 <h4 style={{ margin: 0, fontSize: '18px', fontWeight: 700, color: '#0f172a' }}>
//                                     {totalJobs} {totalJobs === 1 ? 'job' : 'jobs'} found
//                                 </h4>
//                                 {activeFilterCount > 0 && (
//                                     <button
//                                         type="button"
//                                         onClick={clearAllFilters}
//                                         style={{
//                                             background: 'none', border: 'none', cursor: 'pointer',
//                                             color: GREEN, fontSize: '13px', fontWeight: 600, padding: 0,
//                                         }}
//                                     >
//                                         Clear all filters
//                                     </button>
//                                 )}
//                             </div>

//                             {/* Active filters — shows the selected category/keyword with a readable label */}
//                             {(filters.q || filters.category || filters.subcategory || filters.city) && (
//                                 <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '16px' }}>
//                                     {[
//                                         filters.q && { key: 'q', label: `"${filters.q}"` },
//                                         filters.category && { key: 'category', label: formatCategoryName(filters.category) },
//                                         filters.subcategory && { key: 'subcategory', label: formatCategoryName(filters.subcategory) },
//                                         filters.city && { key: 'city', label: filters.city },
//                                     ].filter(Boolean).map((chip) => (
//                                         <span
//                                             key={chip.key}
//                                             style={{
//                                                 display: 'inline-flex', alignItems: 'center', gap: '6px',
//                                                 background: 'rgba(22,163,74,0.10)', color: GREEN,
//                                                 borderRadius: '999px', padding: '6px 12px',
//                                                 fontSize: '13px', fontWeight: 600,
//                                             }}
//                                         >
//                                             {chip.label}
//                                             <button
//                                                 type="button"
//                                                 onClick={() => toggleFilter(chip.key, filters[chip.key])}
//                                                 aria-label={`Remove ${chip.label}`}
//                                                 style={{ background: 'none', border: 'none', color: GREEN, cursor: 'pointer', padding: 0, fontSize: '15px', lineHeight: 1 }}
//                                             >
//                                                 ×
//                                             </button>
//                                         </span>
//                                     ))}
//                                 </div>
//                             )}
//                             {loading ? (
//                                 <div>
//                                     {Array.from({ length: 4 }).map((_, i) => (
//                                         <div key={i} style={{
//                                             background: '#fff',
//                                             border: '1px solid rgba(148,163,184,0.18)',
//                                             borderRadius: '14px',
//                                             boxShadow: '0 6px 18px rgba(15,23,42,0.06)',
//                                             padding: '18px',
//                                             marginBottom: '16px',
//                                         }}>
//                                             <div style={{ display: 'flex', gap: '14px' }}>
//                                                 <div style={{ width: '52px', height: '52px', borderRadius: '10px', background: '#eef2f7', flexShrink: 0 }} />
//                                                 <div style={{ flex: 1 }}>
//                                                     <div style={{ width: '60%', height: '15px', borderRadius: '6px', background: '#eef2f7', marginBottom: '10px' }} />
//                                                     <div style={{ width: '40%', height: '12px', borderRadius: '6px', background: '#f1f5f9', marginBottom: '14px' }} />
//                                                     <div style={{ width: '85%', height: '10px', borderRadius: '6px', background: '#f1f5f9' }} />
//                                                 </div>
//                                             </div>
//                                         </div>
//                                     ))}
//                                     <p style={{ textAlign: 'center', color: '#64748b', fontSize: '14px' }}>Loading jobs…</p>
//                                 </div>
//                             ) : jobs.length === 0 ? (
//                                 <div style={{
//                                     background: '#fff',
//                                     border: '1px solid rgba(148,163,184,0.18)',
//                                     borderRadius: '14px',
//                                     boxShadow: '0 6px 18px rgba(15,23,42,0.06)',
//                                     padding: '48px 20px',
//                                     textAlign: 'center',
//                                 }}>
//                                     <i className="ti-search" style={{ fontSize: '34px', color: '#94a3b8' }} />
//                                     <h4 style={{ margin: '14px 0 6px', fontSize: '18px', fontWeight: 700, color: '#0f172a' }}>
//                                         No results found
//                                     </h4>
//                                     <p style={{ margin: '0 0 18px', color: '#64748b', fontSize: '14px' }}>
//                                         We couldn't find any jobs matching your filters. Try adjusting them.
//                                     </p>
//                                     {activeFilterCount > 0 && (
//                                         <button
//                                             type="button"
//                                             onClick={clearAllFilters}
//                                             style={{
//                                                 background: GREEN, color: '#fff', border: 'none',
//                                                 borderRadius: '9px', padding: '10px 22px',
//                                                 fontSize: '14px', fontWeight: 600, cursor: 'pointer',
//                                             }}
//                                         >
//                                             Clear all filters
//                                         </button>
//                                     )}
//                                 </div>
//                             ) : (
//                                 jobs.map((job) => {
//                                     const id = job._id || job.id;
//                                     const isApplied = appliedJobIds.has(String(id));
//                                     const logoPath = job.companyLogoUrl;
//                                     const logo = logoPath && (logoPath.startsWith('http') || logoPath.startsWith('data:'))
//                                         ? logoPath
//                                         : logoPath
//                                             ? `${API_BASE_URL}${logoPath.startsWith('/') ? logoPath : `/${logoPath}`}`
//                                             : '';
//                                     const title = job.jobTitle || job.title;
//                                     const company = job.companyName || job.company || '';
//                                     const location = job.city || job.state || job.country || job.address || '—';
//                                     const jobType = job.jobType || job.job_type || '—';
//                                     const jobSlug = title ? `${createSlug(title)}-${id}` : id;
//                                     const experience = job.experience || job.experienceRequired || job.experience_required || job.minExperience || '';
//                                     const salaryDisplay = formatJobSalary(job);
//                                     const skillsRaw = job.skills || job.keySkills || job.key_skills || job.skillsRequired || '';
//                                     const skillList = (Array.isArray(skillsRaw) ? skillsRaw : String(skillsRaw).split(','))
//                                         .map((s) => String(s).trim())
//                                         .filter(Boolean);

//                                     // Calculate time posted
//                                     const getTimeAgo = (dateString) => {
//                                         if (!dateString) return 'Recently';
//                                         const now = new Date();
//                                         const posted = new Date(dateString);
//                                         const diffMs = now - posted;
//                                         const diffMins = Math.floor(diffMs / 60000);
//                                         const diffHours = Math.floor(diffMs / 3600000);
//                                         const diffDays = Math.floor(diffMs / 86400000);
//                                         const diffWeeks = Math.floor(diffDays / 7);
//                                         const diffMonths = Math.floor(diffDays / 30);

//                                         if (diffMins < 1) return 'Just now';
//                                         if (diffMins < 60) return `${diffMins} min${diffMins > 1 ? 's' : ''} ago`;
//                                         if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
//                                         if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
//                                         if (diffWeeks < 4) return `${diffWeeks} week${diffWeeks > 1 ? 's' : ''} ago`;
//                                         if (diffMonths < 12) return `${diffMonths} month${diffMonths > 1 ? 's' : ''} ago`;
//                                         return `${Math.floor(diffDays / 365)} year${Math.floor(diffDays / 365) > 1 ? 's' : ''} ago`;
//                                     };
//                                     const timePosted = getTimeAgo(job.createdAt || job.created_at || job.postedDate);

//                                     return (
//                                         <div
//                                             key={id}
//                                             onClick={() => navigate(`/jobs/${jobSlug}`)}
//                                             style={{
//                                                 cursor: 'pointer',
//                                                 backgroundColor: '#fff',
//                                                 borderRadius: '14px',
//                                                 padding: '18px',
//                                                 boxShadow: '0 6px 18px rgba(15,23,42,0.06)',
//                                                 transition: 'box-shadow 0.2s ease, transform 0.2s ease',
//                                                 position: 'relative',
//                                                 border: '1px solid rgba(148,163,184,0.18)',
//                                                 marginBottom: '16px',
//                                             }}
//                                             onMouseEnter={(e) => {
//                                                 e.currentTarget.style.boxShadow = '0 10px 26px rgba(15,23,42,0.10)';
//                                                 e.currentTarget.style.transform = 'translateY(-2px)';
//                                             }}
//                                             onMouseLeave={(e) => {
//                                                 e.currentTarget.style.boxShadow = '0 6px 18px rgba(15,23,42,0.06)';
//                                                 e.currentTarget.style.transform = 'translateY(0)';
//                                             }}
//                                         >
//                                             {/* Header row: logo + title/company + wishlist */}
//                                             <div style={{ display: 'flex', alignItems: 'flex-start', gap: '14px' }}>
//                                                 <div style={{
//                                                     width: '52px', height: '52px', minWidth: '52px',
//                                                     borderRadius: '10px', overflow: 'hidden',
//                                                     border: '1px solid #e2e8f0',
//                                                     display: 'flex', alignItems: 'center', justifyContent: 'center',
//                                                     backgroundColor: '#f8fafc',
//                                                 }}>
//                                                     <img
//                                                         src={logo}
//                                                         alt={company}
//                                                         style={{ width: '100%', height: '100%', objectFit: 'contain' }}
//                                                         onError={(e) => { e.target.src = "/assets/img/company_logo_1.png"; }}
//                                                     />
//                                                 </div>

//                                                 <div style={{ flex: 1, minWidth: 0, paddingRight: '36px' }}>
//                                                     <Link
//                                                         to={`/jobs/${jobSlug}`}
//                                                         className="njk-card-title"
//                                                         onClick={(e) => e.stopPropagation()}
//                                                         style={{
//                                                             display: 'block',
//                                                             margin: '0 0 3px',
//                                                             fontSize: '16px',
//                                                             fontWeight: 700,
//                                                             lineHeight: 1.3,
//                                                             textDecoration: 'none',
//                                                             wordBreak: 'break-word',
//                                                         }}
//                                                     >
//                                                         {title}
//                                                     </Link>
//                                                     <div style={{ fontSize: '13px', color: '#475569', fontWeight: 500 }}>
//                                                         {company || '—'}
//                                                     </div>
//                                                 </div>

//                                                 {/* Wishlist - top right */}
//                                                 <div
//                                                     style={{ position: 'absolute', top: '16px', right: '16px', zIndex: 10 }}
//                                                     onClick={(e) => e.stopPropagation()}
//                                                 >
//                                                     {user && user.role === 'seeker' && id && <WishlistButton jobId={String(id)} />}
//                                                 </div>
//                                             </div>

//                                             {/* Meta row: experience, salary, location */}
//                                             <div className="njk-card-meta" style={{
//                                                 display: 'flex', flexWrap: 'wrap',
//                                                 gap: '8px 18px', margin: '12px 0',
//                                                 fontSize: '13px', color: '#475569',
//                                             }}>
//                                                 {experience && (
//                                                     <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
//                                                         <i className="ti-stats-up" style={{ color: GREEN, fontSize: '14px' }} />
//                                                         {experience}
//                                                     </span>
//                                                 )}
//                                                 <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
//                                                     <span style={{ color: GREEN, fontWeight: 700 }}>₹</span>
//                                                     {salaryDisplay || 'Not disclosed'}
//                                                 </span>
//                                                 <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
//                                                     <i className="ti-location-pin" style={{ color: GREEN, fontSize: '14px' }} />
//                                                     {location}
//                                                 </span>
//                                                 <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
//                                                     <i className="ti-briefcase" style={{ color: GREEN, fontSize: '14px' }} />
//                                                     {jobType.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
//                                                 </span>
//                                             </div>

//                                             {/* Skill chips */}
//                                             {skillList.length > 0 && (
//                                                 <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '14px', width: '100%', minWidth: 0, overflow: 'hidden' }}>
//                                                     {skillList.slice(0, 6).map((skill, i) => (
//                                                         <span key={i} className="njk-skill-chip">{skill}</span>
//                                                     ))}
//                                                     {skillList.length > 6 && (
//                                                         <span className="njk-skill-chip">+{skillList.length - 6} more</span>
//                                                     )}
//                                                 </div>
//                                             )}

//                                             {/* Footer row: posted time + apply */}
//                                             <div style={{
//                                                 display: 'flex', alignItems: 'center',
//                                                 justifyContent: 'space-between', gap: '12px',
//                                                 flexWrap: 'wrap',
//                                                 borderTop: '1px solid #f1f5f9', paddingTop: '12px',
//                                             }}>
//                                                 <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: '#94a3b8' }}>
//                                                     <i className="ti-time" style={{ fontSize: '13px' }} />
//                                                     {timePosted}
//                                                 </span>
//                                                 {(!user || user.role === 'seeker') && (
//                                                     <div onClick={(e) => e.stopPropagation()}>
//                                                         {isApplied ? (
//                                                             <span style={{
//                                                                 display: 'inline-flex', alignItems: 'center', gap: '6px',
//                                                                 color: GREEN, fontWeight: 600, fontSize: '14px',
//                                                             }}>
//                                                                 <i className="ti-check" style={{ fontSize: '14px' }} />
//                                                                 Applied
//                                                             </span>
//                                                         ) : (
//                                                             <button
//                                                                 type="button"
//                                                                 className="njk-apply-btn"
//                                                                 onClick={(e) => { e.stopPropagation(); openApply(job); }}
//                                                             >
//                                                                 Apply Now
//                                                             </button>
//                                                         )}
//                                                     </div>
//                                                 )}
//                                             </div>
//                                         </div>
//                                     );
//                                 })
//                             )}
//                             <div className="clearfix" />
//                             {/* Pagination */}
//                             {totalPages > 1 && (
//                                 <div style={{ marginTop: '24px' }}>
//                                     <div style={{
//                                         display: 'flex',
//                                         justifyContent: 'center',
//                                         alignItems: 'center',
//                                         gap: '8px',
//                                         flexWrap: 'wrap'
//                                     }}>
//                                         <button
//                                             onClick={() => { if (page > 1) setPage(page - 1); }}
//                                             disabled={page === 1}
//                                             style={{
//                                                 padding: '8px 12px',
//                                                 backgroundColor: page === 1 ? '#f1f5f9' : '#fff',
//                                                 color: page === 1 ? '#94a3b8' : GREEN,
//                                                 border: '1px solid #e2e8f0',
//                                                 borderRadius: '8px',
//                                                 cursor: page === 1 ? 'not-allowed' : 'pointer',
//                                                 fontSize: '14px',
//                                                 fontWeight: '600',
//                                                 display: 'flex',
//                                                 alignItems: 'center',
//                                                 justifyContent: 'center',
//                                                 minWidth: '36px',
//                                                 height: '36px'
//                                             }}
//                                             title="Previous"
//                                         >
//                                             <span aria-hidden="true">«</span>
//                                         </button>

//                                         {Array.from({ length: totalPages }).map((_, idx) => (
//                                             <button
//                                                 key={idx}
//                                                 onClick={() => setPage(idx + 1)}
//                                                 style={{
//                                                     padding: '8px 12px',
//                                                     backgroundColor: page === (idx + 1) ? GREEN : '#fff',
//                                                     color: page === (idx + 1) ? '#fff' : '#475569',
//                                                     border: '1px solid',
//                                                     borderColor: page === (idx + 1) ? GREEN : '#e2e8f0',
//                                                     borderRadius: '8px',
//                                                     cursor: 'pointer',
//                                                     fontSize: '13px',
//                                                     fontWeight: '600',
//                                                     minWidth: '36px',
//                                                     height: '36px',
//                                                     display: 'flex',
//                                                     alignItems: 'center',
//                                                     justifyContent: 'center'
//                                                 }}
//                                             >
//                                                 {idx + 1}
//                                             </button>
//                                         ))}

//                                         <button
//                                             onClick={() => { if (page < totalPages) setPage(page + 1); }}
//                                             disabled={page === totalPages}
//                                             style={{
//                                                 padding: '8px 12px',
//                                                 backgroundColor: page === totalPages ? '#f1f5f9' : '#fff',
//                                                 color: page === totalPages ? '#94a3b8' : GREEN,
//                                                 border: '1px solid #e2e8f0',
//                                                 borderRadius: '8px',
//                                                 cursor: page === totalPages ? 'not-allowed' : 'pointer',
//                                                 fontSize: '14px',
//                                                 fontWeight: '600',
//                                                 display: 'flex',
//                                                 alignItems: 'center',
//                                                 justifyContent: 'center',
//                                                 minWidth: '36px',
//                                                 height: '36px'
//                                             }}
//                                             title="Next"
//                                         >
//                                             <span aria-hidden="true">»</span>
//                                         </button>
//                                     </div>
//                                     <div style={{
//                                         display: 'flex', alignItems: 'center', justifyContent: 'center',
//                                         gap: '10px', marginTop: '16px', fontSize: '13px', color: '#64748b',
//                                     }}>
//                                         <span>Show</span>
//                                         <input
//                                             type="range"
//                                             min="1"
//                                             max="20"
//                                             value={itemsPerPage}
//                                             onChange={(e) => {
//                                                 const newValue = parseInt(e.target.value);
//                                                 setItemsPerPage(newValue);
//                                                 setPage(1);
//                                             }}
//                                             style={{
//                                                 width: '160px',
//                                                 height: '6px',
//                                                 borderRadius: '3px',
//                                                 background: `linear-gradient(to right, ${GREEN} 0%, ${GREEN} ${(itemsPerPage - 1) / 19 * 100}%, #e2e8f0 ${(itemsPerPage - 1) / 19 * 100}%, #e2e8f0 100%)`,
//                                                 outline: 'none',
//                                                 cursor: 'pointer',
//                                                 WebkitAppearance: 'none',
//                                                 appearance: 'none'
//                                             }}
//                                         />
//                                         <style>
//                                             {`
//                                                     input[type="range"]::-webkit-slider-thumb {
//                                                         -webkit-appearance: none;
//                                                         appearance: none;
//                                                         width: 18px;
//                                                         height: 18px;
//                                                         border-radius: 50%;
//                                                         background: ${GREEN};
//                                                         cursor: pointer;
//                                                         border: 2px solid #fff;
//                                                         box-shadow: 0 2px 4px rgba(0,0,0,0.2);
//                                                     }
//                                                     input[type="range"]::-moz-range-thumb {
//                                                         width: 18px;
//                                                         height: 18px;
//                                                         border-radius: 50%;
//                                                         background: ${GREEN};
//                                                         cursor: pointer;
//                                                         border: 2px solid #fff;
//                                                         box-shadow: 0 2px 4px rgba(0,0,0,0.2);
//                                                     }
//                                                 `}
//                                         </style>
//                                         <span><strong style={{ color: '#0f172a' }}>{itemsPerPage}</strong> per page</span>
//                                     </div>
//                                 </div>
//                             )}
//                         </div>
//                     </div>
//                     {/* End Row */}
//                 </div>
//             </section>
//             {/* ====================== End Job Detail 2 ================ */}

//             {/* Apply Job Popup */}
//             {applyOpen && (
//                 <div
//                     className="modal fade in"
//                     id="apply-job"
//                     style={{ display: 'block', background: 'rgba(0,0,0,0.5)' }}
//                     tabIndex={-1}
//                     role="dialog"
//                     aria-labelledby="myModalLabel2"
//                     aria-hidden="false"
//                     onClick={() => setApplyOpen(false)}
//                 >
//                     <div className="modal-dialog" onClick={(e) => e.stopPropagation()} style={{ maxHeight: '95vh', margin: '2% auto' }}>
//                         <div className="modal-content" id="myModalLabel2" style={{ maxHeight: '95vh', display: 'flex', flexDirection: 'column' }}>
//                             <div className="modal-body" style={{ padding: '20px', overflowY: 'auto', flex: '1 1 auto', maxHeight: 'calc(95vh - 60px)' }}>
//                                 <div className="text-center mrg-bot-20">
//                                     <h4 className="mrg-0">{applyJob?.jobTitle || applyJob?.title}</h4>
//                                 </div>
//                                 <form onSubmit={(e) => { e.preventDefault(); submitApplication(); }}>
//                                     <div className="col-md-12 col-sm-12">
//                                         <div style={{ position: 'relative', marginBottom: '18px' }}>
//                                             <i className="ti-user" style={{
//                                                 position: 'absolute',
//                                                 left: '12px',
//                                                 top: '50%',
//                                                 transform: 'translateY(-50%)',
//                                                 color: focusedField === 'name' ? '#28a745' : '#999',
//                                                 transition: 'all 0.3s ease',
//                                                 pointerEvents: 'none',
//                                                 zIndex: 2,
//                                                 fontSize: '16px'
//                                             }}></i>
//                                             <label style={{
//                                                 position: 'absolute',
//                                                 left: '40px',
//                                                 top: focusedField === 'name' || applyForm.name ? '-10px' : '50%',
//                                                 transform: focusedField === 'name' || applyForm.name ? 'translateY(0) scale(0.85)' : 'translateY(-50%)',
//                                                 fontSize: focusedField === 'name' || applyForm.name ? '12px' : '14px',
//                                                 color: focusedField === 'name' ? '#28a745' : '#999',
//                                                 transition: 'all 0.3s ease',
//                                                 pointerEvents: 'none',
//                                                 zIndex: 3,
//                                                 fontWeight: '500',
//                                                 backgroundColor: 'white',
//                                                 padding: focusedField === 'name' || applyForm.name ? '0 4px' : '0',
//                                                 marginLeft: focusedField === 'name' || applyForm.name ? '-4px' : '0'
//                                             }}>
//                                                 Name
//                                             </label>
//                                             <input
//                                                 type="text"
//                                                 className="form-control"
//                                                 value={applyForm.name}
//                                                 onChange={(e) => setApplyForm(prev => ({ ...prev, name: e.target.value }))}
//                                                 onFocus={() => setFocusedField('name')}
//                                                 onBlur={() => setFocusedField(null)}
//                                                 style={{
//                                                     padding: '14px 12px 14px 40px',
//                                                     border: `2px solid ${focusedField === 'name' ? '#28a745' : '#e1e5e9'}`,
//                                                     borderRadius: '6px',
//                                                     fontSize: '14px',
//                                                     outline: 'none',
//                                                     transition: 'all 0.3s ease',
//                                                     boxShadow: focusedField === 'name' ? '0 0 0 3px rgba(40, 167, 69, 0.1)' : 'none',
//                                                     height: '48px'
//                                                 }}
//                                             />
//                                         </div>
//                                     </div>
//                                     <div className="col-md-12 col-sm-12">
//                                         <div style={{ position: 'relative', marginBottom: '18px' }}>
//                                             <i className="ti-email" style={{
//                                                 position: 'absolute',
//                                                 left: '12px',
//                                                 top: '50%',
//                                                 transform: 'translateY(-50%)',
//                                                 color: focusedField === 'email' ? '#28a745' : '#999',
//                                                 transition: 'all 0.3s ease',
//                                                 pointerEvents: 'none',
//                                                 zIndex: 2,
//                                                 fontSize: '16px'
//                                             }}></i>
//                                             <label style={{
//                                                 position: 'absolute',
//                                                 left: '40px',
//                                                 top: focusedField === 'email' || applyForm.email ? '-10px' : '50%',
//                                                 transform: focusedField === 'email' || applyForm.email ? 'translateY(0) scale(0.85)' : 'translateY(-50%)',
//                                                 fontSize: focusedField === 'email' || applyForm.email ? '12px' : '14px',
//                                                 color: focusedField === 'email' ? '#28a745' : '#999',
//                                                 transition: 'all 0.3s ease',
//                                                 pointerEvents: 'none',
//                                                 zIndex: 3,
//                                                 fontWeight: '500',
//                                                 backgroundColor: 'white',
//                                                 padding: focusedField === 'email' || applyForm.email ? '0 4px' : '0',
//                                                 marginLeft: focusedField === 'email' || applyForm.email ? '-4px' : '0'
//                                             }}>
//                                                 Email
//                                             </label>
//                                             <input
//                                                 type="email"
//                                                 className="form-control"
//                                                 value={applyForm.email}
//                                                 onChange={(e) => setApplyForm(prev => ({ ...prev, email: e.target.value }))}
//                                                 onFocus={() => setFocusedField('email')}
//                                                 onBlur={() => setFocusedField(null)}
//                                                 style={{
//                                                     padding: '14px 12px 14px 40px',
//                                                     border: `2px solid ${focusedField === 'email' ? '#28a745' : '#e1e5e9'}`,
//                                                     borderRadius: '6px',
//                                                     fontSize: '14px',
//                                                     outline: 'none',
//                                                     transition: 'all 0.3s ease',
//                                                     boxShadow: focusedField === 'email' ? '0 0 0 3px rgba(40, 167, 69, 0.1)' : 'none',
//                                                     height: '48px'
//                                                 }}
//                                             />
//                                         </div>
//                                     </div>
//                                     <div className="col-md-12 col-sm-12">
//                                         <div style={{ position: 'relative', marginBottom: '18px' }}>
//                                             <i className="ti-mobile" style={{
//                                                 position: 'absolute',
//                                                 left: '12px',
//                                                 top: '50%',
//                                                 transform: 'translateY(-50%)',
//                                                 color: focusedField === 'phone' ? '#28a745' : '#999',
//                                                 transition: 'all 0.3s ease',
//                                                 pointerEvents: 'none',
//                                                 zIndex: 2,
//                                                 fontSize: '16px'
//                                             }}></i>
//                                             <label style={{
//                                                 position: 'absolute',
//                                                 left: '40px',
//                                                 top: focusedField === 'phone' || applyForm.phone ? '-10px' : '50%',
//                                                 transform: focusedField === 'phone' || applyForm.phone ? 'translateY(0) scale(0.85)' : 'translateY(-50%)',
//                                                 fontSize: focusedField === 'phone' || applyForm.phone ? '12px' : '14px',
//                                                 color: focusedField === 'phone' ? '#28a745' : '#999',
//                                                 transition: 'all 0.3s ease',
//                                                 pointerEvents: 'none',
//                                                 zIndex: 3,
//                                                 fontWeight: '500',
//                                                 backgroundColor: 'white',
//                                                 padding: focusedField === 'phone' || applyForm.phone ? '0 4px' : '0',
//                                                 marginLeft: focusedField === 'phone' || applyForm.phone ? '-4px' : '0'
//                                             }}>
//                                                 Phone
//                                             </label>
//                                             <input
//                                                 type="text"
//                                                 className="form-control"
//                                                 value={applyForm.phone}
//                                                 onChange={(e) => setApplyForm(prev => ({ ...prev, phone: e.target.value }))}
//                                                 onFocus={() => setFocusedField('phone')}
//                                                 onBlur={() => setFocusedField(null)}
//                                                 style={{
//                                                     padding: '14px 12px 14px 40px',
//                                                     border: `2px solid ${focusedField === 'phone' ? '#28a745' : '#e1e5e9'}`,
//                                                     borderRadius: '6px',
//                                                     fontSize: '14px',
//                                                     outline: 'none',
//                                                     transition: 'all 0.3s ease',
//                                                     boxShadow: focusedField === 'phone' ? '0 0 0 3px rgba(40, 167, 69, 0.1)' : 'none',
//                                                     height: '48px'
//                                                 }}
//                                             />
//                                         </div>
//                                     </div>
//                                     <div className="col-md-12 col-sm-12">
//                                         <div style={{ position: 'relative', marginBottom: '18px' }}>
//                                             <input
//                                                 type="file"
//                                                 id="file"
//                                                 name="resume"
//                                                 accept=".pdf,.doc,.docx"
//                                                 onChange={(e) => setApplyForm(prev => ({ ...prev, resume: e.target.files && e.target.files[0] }))}
//                                                 style={{ display: 'none' }}
//                                             />
//                                             {!applyForm.resume ? (
//                                                 <button
//                                                     type="button"
//                                                     onClick={() => document.getElementById('file').click()}
//                                                     style={{
//                                                         width: '100%',
//                                                         padding: '14px',
//                                                         border: `2px solid ${focusedField === 'resume' ? '#28a745' : '#e1e5e9'}`,
//                                                         borderRadius: '6px',
//                                                         backgroundColor: '#fff',
//                                                         cursor: 'pointer',
//                                                         display: 'flex',
//                                                         alignItems: 'center',
//                                                         justifyContent: 'center',
//                                                         gap: '8px',
//                                                         fontSize: '14px',
//                                                         color: '#666',
//                                                         transition: 'all 0.3s ease',
//                                                         boxShadow: focusedField === 'resume' ? '0 0 0 3px rgba(40, 167, 69, 0.1)' : 'none',
//                                                         height: '48px'
//                                                     }}
//                                                     onFocus={() => setFocusedField('resume')}
//                                                     onBlur={() => setFocusedField(null)}
//                                                 >
//                                                     <i className="ti-upload" style={{ fontSize: '16px', color: '#28a745' }}></i>
//                                                     Upload your CV
//                                                 </button>
//                                             ) : (
//                                                 <div style={{
//                                                     width: '100%',
//                                                     padding: '12px',
//                                                     border: '2px solid #28a745',
//                                                     borderRadius: '6px',
//                                                     backgroundColor: '#f0f9ff',
//                                                     display: 'flex',
//                                                     alignItems: 'center',
//                                                     justifyContent: 'space-between',
//                                                     gap: '8px',
//                                                     height: '48px',
//                                                     boxSizing: 'border-box'
//                                                 }}>
//                                                     <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1, minWidth: 0 }}>
//                                                         <i className="ti-file" style={{ fontSize: '16px', color: '#28a745' }}></i>
//                                                         <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0, flex: 1 }}>
//                                                             <span style={{
//                                                                 fontSize: '14px',
//                                                                 color: '#333',
//                                                                 overflow: 'hidden',
//                                                                 textOverflow: 'ellipsis',
//                                                                 whiteSpace: 'nowrap',
//                                                                 lineHeight: '1.2'
//                                                             }}>
//                                                                 {applyForm.resume.name}
//                                                             </span>
//                                                             <span style={{
//                                                                 fontSize: '11px',
//                                                                 color: '#666',
//                                                                 lineHeight: '1.2'
//                                                             }}>
//                                                                 {(applyForm.resume.size / 1024).toFixed(2)} KB
//                                                             </span>
//                                                         </div>
//                                                     </div>
//                                                     <button
//                                                         type="button"
//                                                         onClick={(e) => {
//                                                             e.preventDefault();
//                                                             setApplyForm(prev => ({ ...prev, resume: null }));
//                                                             document.getElementById('file').value = '';
//                                                         }}
//                                                         style={{
//                                                             padding: '4px 8px',
//                                                             border: 'none',
//                                                             borderRadius: '4px',
//                                                             backgroundColor: '#ff4757',
//                                                             color: 'white',
//                                                             cursor: 'pointer',
//                                                             fontSize: '12px',
//                                                             display: 'flex',
//                                                             alignItems: 'center',
//                                                             gap: '4px',
//                                                             transition: 'background-color 0.2s ease',
//                                                             flexShrink: 0
//                                                         }}
//                                                         onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#ee3542'}
//                                                         onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#ff4757'}
//                                                     >
//                                                         <i className="ti-close" style={{ fontSize: '12px' }}></i>
//                                                         Remove
//                                                     </button>
//                                                 </div>
//                                             )}
//                                         </div>
//                                     </div>
//                                     <div className="clearfix" />
//                                     <div className="col-md-12">
//                                         <div style={{ position: 'relative', marginBottom: '18px' }}>
//                                             <i className="ti-file-text" style={{
//                                                 position: 'absolute',
//                                                 left: '12px',
//                                                 top: focusedField === 'pastedCv' || applyForm.pastedCv ? '20px' : '50%',
//                                                 transform: 'translateY(-50%)',
//                                                 color: focusedField === 'pastedCv' ? '#28a745' : '#999',
//                                                 transition: 'all 0.3s ease',
//                                                 pointerEvents: 'none',
//                                                 zIndex: 2,
//                                                 fontSize: '16px'
//                                             }}></i>
//                                             <label style={{
//                                                 position: 'absolute',
//                                                 left: '40px',
//                                                 top: focusedField === 'pastedCv' || applyForm.pastedCv ? '-10px' : '50%',
//                                                 transform: focusedField === 'pastedCv' || applyForm.pastedCv ? 'translateY(0) scale(0.85)' : 'translateY(-50%)',
//                                                 fontSize: focusedField === 'pastedCv' || applyForm.pastedCv ? '12px' : '14px',
//                                                 color: focusedField === 'pastedCv' ? '#28a745' : '#999',
//                                                 transition: 'all 0.3s ease',
//                                                 pointerEvents: 'none',
//                                                 zIndex: 3,
//                                                 fontWeight: '500',
//                                                 backgroundColor: 'white',
//                                                 padding: focusedField === 'pastedCv' || applyForm.pastedCv ? '0 4px' : '0',
//                                                 marginLeft: focusedField === 'pastedCv' || applyForm.pastedCv ? '-4px' : '0'
//                                             }}>
//                                                 Paste your cover letter
//                                             </label>
//                                             <textarea
//                                                 className="form-control height-120"
//                                                 value={applyForm.pastedCv}
//                                                 onChange={(e) => setApplyForm(prev => ({ ...prev, pastedCv: e.target.value }))}
//                                                 onFocus={() => setFocusedField('pastedCv')}
//                                                 onBlur={() => setFocusedField(null)}
//                                                 style={{
//                                                     padding: focusedField === 'pastedCv' || applyForm.pastedCv ? '20px 12px 12px 40px' : '12px 12px 12px 40px',
//                                                     minHeight: '100px',
//                                                     border: `2px solid ${focusedField === 'pastedCv' ? '#28a745' : '#e1e5e9'}`,
//                                                     borderRadius: '6px',
//                                                     fontSize: '14px',
//                                                     outline: 'none',
//                                                     transition: 'all 0.3s ease',
//                                                     resize: 'vertical',
//                                                     boxShadow: focusedField === 'pastedCv' ? '0 0 0 3px rgba(40, 167, 69, 0.1)' : 'none',
//                                                     boxSizing: 'border-box',
//                                                     width: '100%'
//                                                 }}
//                                             />
//                                         </div>
//                                     </div>
//                                     <div className="col-md-12" style={{ marginTop: '15px', textAlign: 'center', marginBottom: '0' }}>
//                                         <button
//                                             type="submit"
//                                             className="btn theme-btn btn-m"
//                                             style={{
//                                                 display: 'inline-flex',
//                                                 alignItems: 'center',
//                                                 gap: '8px',
//                                                 padding: '10px 24px',
//                                                 fontSize: '14px',
//                                                 fontWeight: '600'
//                                             }}
//                                         >
//                                             Submit
//                                             <i className="ti-arrow-right" style={{ fontSize: '14px' }}></i>
//                                         </button>
//                                     </div>
//                                 </form>
//                             </div>
//                         </div>
//                     </div>
//                 </div>
//             )}
//             {/* Apply Job Popup */}

//             {/* Newsletter/Subscribe section removed as requested */}

//             <MobileAppDownload />
//             <Footer />
//         </>
//     );
// }

// export default AllJobs;








// import React, { useEffect, useState, useRef } from "react";
// import { useNavigate, useSearchParams } from "react-router-dom";
// import { useAuth } from "../context/AuthContext";
// import Header from "../Components/Header";
// import Footer from "../Components/Footer";
// import MobileAppDownload from "../Components/MobileAppDownload";
// import { API_BASE_URL } from "../config/api";
// import WishlistButton from "../Components/WishlistButton";
// import { trackSearch, trackSearchDebounced } from "../utils/trackActivity";

// /* ─── Salary brackets (sent as minSalary / maxSalary query params) ─────── */
// const SALARY_BRACKETS = [
//   { label: "Under ₹15,000",         minSalary: null,   maxSalary: 15000  },
//   { label: "₹15,000 – ₹30,000",    minSalary: 15000,  maxSalary: 30000  },
//   { label: "₹30,000 – ₹50,000",    minSalary: 30000,  maxSalary: 50000  },
//   { label: "₹50,000 – ₹1,00,000",  minSalary: 50000,  maxSalary: 100000 },
//   { label: "₹1,00,000+",           minSalary: 100000, maxSalary: null   },
// ];

// const TIME_OPTIONS = [
//   { label: "Last 24 hours",  value: "1_day"    },
//   { label: "Last 3 days",    value: "3_days"   },
//   { label: "Last week",      value: "1_week"   },
//   { label: "Last 2 weeks",   value: "2_weeks"  },
//   { label: "Last month",     value: "1_month"  },
//   { label: "Last 3 months",  value: "3_months" },
//   { label: "Last 6 months",  value: "6_months" },
// ];

// const EXPERIENCE_OPTIONS = [
//   { label: "Fresher (0–1 yr)",  value: "fresher"   },
//   { label: "Junior (1–3 yrs)",  value: "1_3_years" },
//   { label: "Mid (3–6 yrs)",     value: "3_6_years" },
//   { label: "Senior (6+ yrs)",   value: "6+_years"  },
// ];

// const JOB_TYPES = [
//   { label: "Full Time",      value: "full_time"  },
//   { label: "Part Time",      value: "part_time"  },
//   { label: "Internship",     value: "internship" },
//   { label: "Freelancer",     value: "freelancer" },
//   { label: "Contract",       value: "contract"   },
// ];

// const WORK_MODES = [
//   { label: "Remote",  value: "remote"  },
//   { label: "Hybrid",  value: "hybrid"  },
//   { label: "On-site", value: "onsite"  },
// ];

// const QUALIFICATIONS = [
//   { label: "High School",    value: "high_school"   },
//   { label: "Intermediate",   value: "intermediate"  },
//   { label: "Graduation",     value: "graduation"    },
//   { label: "Master Degree",  value: "masters"       },
//   { label: "MBA",            value: "mba"           },
// ];

// /* ─── helpers ────────────────────────────────────────────────────────────── */
// const getTimeAgo = (dateString) => {
//   if (!dateString) return "Recently";
//   const diff = Date.now() - new Date(dateString).getTime();
//   const m = Math.floor(diff / 60000);
//   const h = Math.floor(diff / 3600000);
//   const d = Math.floor(diff / 86400000);
//   const w = Math.floor(d / 7);
//   const mo = Math.floor(d / 30);
//   if (m < 1)  return "Just now";
//   if (m < 60) return `${m} min${m > 1 ? "s" : ""} ago`;
//   if (h < 24) return `${h} hour${h > 1 ? "s" : ""} ago`;
//   if (d < 7)  return `${d} day${d > 1 ? "s" : ""} ago`;
//   if (w < 4)  return `${w} week${w > 1 ? "s" : ""} ago`;
//   if (mo < 12) return `${mo} month${mo > 1 ? "s" : ""} ago`;
//   return `${Math.floor(d / 365)} year${Math.floor(d / 365) > 1 ? "s" : ""} ago`;
// };

// const getSalaryDisplay = (job) => {
//   if (job.salary_type === "negotiable") return "Negotiable";
//   if (job.salary_min && job.salary_max)
//     return `₹${(job.salary_min / 1000).toFixed(0)}k – ₹${(job.salary_max / 1000).toFixed(0)}k`;
//   if (job.salary_min) return `₹${(job.salary_min / 1000).toFixed(0)}k+`;
//   if (job.salaryRange && job.salaryRange !== "negotiable") return job.salaryRange;
//   if (job.salaryRange === "negotiable") return "Negotiable";
//   return "";
// };

// /* ─── multi-select toggle ─────────────────────────────────────────────────── */
// const toggleMulti = (prev, name, value) => {
//   const current = Array.isArray(prev[name]) ? prev[name] : [];
//   return {
//     ...prev,
//     [name]: current.includes(value)
//       ? current.filter((v) => v !== value)
//       : [...current, value],
//   };
// };

// /* ─── inline styles ──────────────────────────────────────────────────────── */
// const styles = {
//   /* drawer overlay */
//   overlay: {
//     position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)",
//     zIndex: 1200, display: "flex", justifyContent: "flex-end",
//   },
//   drawer: (open) => ({
//     width: "min(88vw, 340px)", height: "100%", background: "#fff",
//     overflowY: "auto", padding: "0 0 40px",
//     transform: open ? "translateX(0)" : "translateX(100%)",
//     transition: "transform 0.28s cubic-bezier(0.4,0,0.2,1)",
//     boxShadow: "-4px 0 24px rgba(0,0,0,0.12)",
//   }),
//   drawerHead: {
//     display: "flex", alignItems: "center", justifyContent: "space-between",
//     padding: "16px 18px", borderBottom: "1px solid #e1e5e9",
//     position: "sticky", top: 0, background: "#fff", zIndex: 2,
//   },
//   drawerTitle: { fontSize: "16px", fontWeight: "600", color: "#1a1a1a", margin: 0 },
//   closeBtn: {
//     background: "none", border: "none", cursor: "pointer",
//     fontSize: "20px", color: "#6b7280", lineHeight: 1, padding: "4px",
//   },
//   clearAll: {
//     background: "none", border: "none", cursor: "pointer",
//     fontSize: "13px", color: "#ef4444", fontWeight: "500",
//   },
//   section: { padding: "14px 18px", borderBottom: "1px solid #f0f0f0" },
//   sectionTitle: {
//     fontSize: "13px", fontWeight: "600", color: "#374151",
//     marginBottom: "10px", textTransform: "uppercase", letterSpacing: "0.5px",
//   },
//   checkRow: {
//     display: "flex", alignItems: "center", gap: "8px",
//     marginBottom: "8px", cursor: "pointer", fontSize: "14px", color: "#374151",
//   },
//   checkbox: { accentColor: "#28a745", width: "15px", height: "15px", cursor: "pointer" },
//   /* filter trigger button */
//   filterBtn: {
//     display: "inline-flex", alignItems: "center", gap: "6px",
//     padding: "8px 14px", borderRadius: "8px",
//     border: "1px solid #28a745", background: "#fff",
//     color: "#28a745", fontSize: "13px", fontWeight: "600",
//     cursor: "pointer", whiteSpace: "nowrap",
//   },
//   filterBadge: {
//     background: "#28a745", color: "#fff", borderRadius: "50%",
//     width: "18px", height: "18px", fontSize: "11px", fontWeight: "700",
//     display: "inline-flex", alignItems: "center", justifyContent: "center",
//   },
//   /* search row (mobile) */
//   mobileSearchRow: {
//     display: "flex", gap: "8px", alignItems: "center",
//     marginBottom: "16px",
//   },
//   mobileSearchInput: {
//     flex: 1, padding: "10px 14px", borderRadius: "8px",
//     border: "1px solid #e1e5e9", fontSize: "14px", outline: "none",
//   },
//   applyFiltersBtn: {
//     width: "calc(100% - 36px)", margin: "16px 18px 0",
//     padding: "12px", background: "#28a745", color: "#fff",
//     border: "none", borderRadius: "8px", fontSize: "14px",
//     fontWeight: "600", cursor: "pointer",
//   },
// };

// /* ═══════════════════════════════════════════════════════════════════════════
//    FilterPanel — shared between desktop sidebar and mobile drawer
//    ═══════════════════════════════════════════════════════════════════════════ */
// function FilterPanel({ filters, setFilters, setPage, itemsPerPage, setItemsPerPage, isMobile, onApply }) {
//   const activeSalaryIdx = SALARY_BRACKETS.findIndex(
//     (b) => b.minSalary === filters.minSalary && b.maxSalary === filters.maxSalary
//   );

//   const toggle = (name, value) => {
//     setPage(1);
//     setFilters((prev) => toggleMulti(prev, name, value));
//   };

//   const toggleSalary = (bracket) => {
//     setPage(1);
//     const isActive =
//       filters.minSalary === bracket.minSalary &&
//       filters.maxSalary === bracket.maxSalary;
//     setFilters((prev) => ({
//       ...prev,
//       minSalary: isActive ? null : bracket.minSalary,
//       maxSalary: isActive ? null : bracket.maxSalary,
//     }));
//   };

//   const toggleTime = (value) => {
//     setPage(1);
//     setFilters((prev) => ({ ...prev, timePosted: prev.timePosted === value ? "" : value }));
//   };

//   const Section = ({ title, children }) => (
//     <div style={styles.section}>
//       <div style={styles.sectionTitle}>{title}</div>
//       {children}
//     </div>
//   );

//   const CheckItem = ({ label, checked, onChange }) => (
//     <label style={styles.checkRow}>
//       <input type="checkbox" style={styles.checkbox} checked={checked} onChange={onChange} />
//       {label}
//     </label>
//   );

//   return (
//     <>
//       {/* Job Type */}
//       <Section title="Job Type">
//         {JOB_TYPES.map((t) => (
//           <CheckItem key={t.value} label={t.label}
//             checked={(filters.jobType || []).includes(t.value)}
//             onChange={() => toggle("jobType", t.value)} />
//         ))}
//       </Section>

//       {/* Work Mode */}
//       <Section title="Work Mode">
//         {WORK_MODES.map((t) => (
//           <CheckItem key={t.value} label={t.label}
//             checked={(filters.workMode || []).includes(t.value)}
//             onChange={() => toggle("workMode", t.value)} />
//         ))}
//       </Section>

//       {/* Experience */}
//       <Section title="Experience">
//         {EXPERIENCE_OPTIONS.map((t) => (
//           <CheckItem key={t.value} label={t.label}
//             checked={(filters.experience || []).includes(t.value)}
//             onChange={() => toggle("experience", t.value)} />
//         ))}
//       </Section>

//       {/* Qualification */}
//       <Section title="Qualification">
//         {QUALIFICATIONS.map((t) => (
//           <CheckItem key={t.value} label={t.label}
//             checked={(filters.qualification || []).includes(t.value)}
//             onChange={() => toggle("qualification", t.value)} />
//         ))}
//       </Section>

//       {/* Salary */}
//       <Section title="Salary Range">
//         {SALARY_BRACKETS.map((b, i) => (
//           <CheckItem key={i} label={b.label}
//             checked={activeSalaryIdx === i}
//             onChange={() => toggleSalary(b)} />
//         ))}
//       </Section>

//       {/* Posted Time */}
//       <Section title="Posted Time">
//         {TIME_OPTIONS.map((t) => (
//           <CheckItem key={t.value} label={t.label}
//             checked={filters.timePosted === t.value}
//             onChange={() => toggleTime(t.value)} />
//         ))}
//       </Section>

//       {/* Items per page — desktop only */}
//       {!isMobile && (
//         <Section title={`${itemsPerPage} items per page`}>
//           <input type="range" min="5" max="20" value={itemsPerPage}
//             onChange={(e) => { setItemsPerPage(parseInt(e.target.value)); setPage(1); }}
//             style={{ width: "100%" }} />
//           <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", color: "#9ca3af", marginTop: "4px" }}>
//             <span>5</span><span>20</span>
//           </div>
//         </Section>
//       )}

//       {/* Apply button — mobile only */}
//       {isMobile && (
//         <button style={styles.applyFiltersBtn} onClick={onApply}>
//           Apply Filters
//         </button>
//       )}
//     </>
//   );
// }

// /* ═══════════════════════════════════════════════════════════════════════════
//    Main AllJobs component
//    ═══════════════════════════════════════════════════════════════════════════ */
// function AllJobs() {
//   const navigate = useNavigate();
//   const { user } = useAuth();
//   const [searchParams] = useSearchParams();

//   const [jobs, setJobs] = useState([]);
//   const [loading, setLoading] = useState(false);
//   const [message, setMessage] = useState("");
//   const [page, setPage] = useState(1);
//   const [totalPages, setTotalPages] = useState(1);
//   const [totalJobs, setTotalJobs] = useState(0);
//   const [itemsPerPage, setItemsPerPage] = useState(10);
//   const [appliedJobIds, setAppliedJobIds] = useState(new Set());

//   /* filters */
//   const [filters, setFilters] = useState({
//     q: "", city: "",
//     jobType: [], workMode: [], experience: [], qualification: [],
//     category: "", timePosted: "",
//     minSalary: null, maxSalary: null,
//   });

//   /* apply modal */
//   const [applyOpen, setApplyOpen] = useState(false);
//   const [applyJob, setApplyJob] = useState(null);
//   const [applyForm, setApplyForm] = useState({ name: "", email: "", phone: "", resume: null, pastedCv: "" });
//   const [focusedField, setFocusedField] = useState(null);

//   /* mobile drawer */
//   const [drawerOpen, setDrawerOpen] = useState(false);
//   const drawerRef = useRef(null);

//   /* count active filters for badge */
//   const activeFilterCount = [
//     ...(filters.jobType || []),
//     ...(filters.workMode || []),
//     ...(filters.experience || []),
//     ...(filters.qualification || []),
//     filters.category,
//     filters.timePosted,
//     filters.minSalary != null ? "salary" : "",
//   ].filter(Boolean).length;

//   /* clear all */
//   const clearAllFilters = () => {
//     setPage(1);
//     setFilters((prev) => ({
//       ...prev,
//       jobType: [], workMode: [], experience: [], qualification: [],
//       category: "", timePosted: "", minSalary: null, maxSalary: null,
//     }));
//   };

//   /* read URL params on mount */
//   useEffect(() => {
//     const cat = searchParams.get("category");
//     const q   = searchParams.get("q");
//     if (cat) setFilters((p) => ({ ...p, category: decodeURIComponent(cat) }));
//     if (q)   setFilters((p) => ({ ...p, q: decodeURIComponent(q) }));
//   }, [searchParams]);

//   /* fetch jobs */
//   useEffect(() => {
//     const fetchJobs = async () => {
//       try {
//         setLoading(true);
//         const params = new URLSearchParams();

//         if (filters.timePosted) {
//           params.set("page", "1");
//           params.set("limit", "1000");
//         } else {
//           params.set("page", String(page));
//           params.set("limit", String(itemsPerPage));
//         }

//         /* scalar filters */
//         if (filters.q)        params.set("q",        filters.q);
//         if (filters.city)     params.set("city",     filters.city);
//         if (filters.category) params.set("category", filters.category);

//         /* array filters — send as comma-separated */
//         if (filters.jobType?.length)      params.set("jobType",      filters.jobType.join(","));
//         if (filters.workMode?.length)     params.set("workMode",     filters.workMode.join(","));
//         if (filters.experience?.length)   params.set("experience",   filters.experience.join(","));
//         if (filters.qualification?.length) params.set("qualification", filters.qualification.join(","));

//         /* salary */
//         if (filters.minSalary != null) params.set("minSalary", filters.minSalary);
//         if (filters.maxSalary != null) params.set("maxSalary", filters.maxSalary);

//         let resp = await fetch(`${API_BASE_URL}/api/jobs?${params.toString()}`, {
//           method: "GET", headers: { Accept: "application/json" }, credentials: "include",
//         });
//         if (!resp.ok) {
//           resp = await fetch(`${API_BASE_URL}/api/employer/jobs`, {
//             method: "GET", headers: { Accept: "application/json" }, credentials: "include",
//           });
//         }

//         if (resp.ok) {
//           const data = await resp.json();
//           let list = Array.isArray(data.jobs) ? data.jobs : Array.isArray(data) ? data : [];

//           /* client-side timePosted filter */
//           if (filters.timePosted) {
//             const now = new Date();
//             const cut = new Date();
//             const map = { "1_day":1,"3_days":3,"1_week":7,"2_weeks":14 };
//             const mmap = { "1_month":1,"3_months":3,"6_months":6 };
//             if (map[filters.timePosted])  cut.setDate(now.getDate() - map[filters.timePosted]);
//             if (mmap[filters.timePosted]) cut.setMonth(now.getMonth() - mmap[filters.timePosted]);
//             list = list.filter((job) => {
//               const d = new Date(job.createdAt || job.created_at || job.postedDate);
//               return d >= cut && d <= now;
//             });
//             const start = (page - 1) * itemsPerPage;
//             setTotalPages(Math.ceil(list.length / itemsPerPage) || 1);
//             setTotalJobs(list.length);
//             setJobs(list.slice(start, start + itemsPerPage));
//           } else {
//             const p = data.pagination || {};
//             setTotalPages(p.totalPages || 1);
//             setTotalJobs(p.total || list.length);
//             setJobs(list);
//           }
//         } else {
//           setMessage("Failed to load jobs");
//           setTimeout(() => setMessage(""), 4000);
//         }
//       } catch {
//         setMessage("Failed to load jobs");
//         setTimeout(() => setMessage(""), 4000);
//       } finally {
//         setLoading(false);
//       }
//     };
//     fetchJobs();
//   }, [API_BASE_URL, page, filters, itemsPerPage]);

//   /* fetch applied jobs */
//   useEffect(() => {
//     const fetchApplied = async () => {
//       if (!user || user.role !== "seeker") return setAppliedJobIds(new Set());
//       const token = localStorage.getItem("token");
//       if (!token) return setAppliedJobIds(new Set());
//       try {
//         const resp = await fetch(`${API_BASE_URL}/api/applications/mine`, {
//           headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
//         });
//         if (!resp.ok) return;
//         const data = await resp.json();
//         setAppliedJobIds(new Set(
//           (Array.isArray(data.applications) ? data.applications : [])
//             .map((a) => String(a.jobId)).filter(Boolean)
//         ));
//       } catch {}
//     };
//     fetchApplied();
//   }, [user]);

//   /* apply */
//   const openApply = (job) => {
//     if (!user) {
//       document.querySelector('[data-target="#signin"]')?.click();
//       return;
//     }
//     setApplyJob(job);
//     setApplyForm({ name: "", email: "", phone: "", resume: null, pastedCv: "" });
//     setApplyOpen(true);
//   };

//   const submitApplication = async () => {
//     if (!applyForm.name?.trim()) return (setMessage("Please enter your name"), setTimeout(() => setMessage(""), 4000));
//     if (!applyForm.email?.trim()) return (setMessage("Please enter your email"), setTimeout(() => setMessage(""), 4000));
//     if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(applyForm.email.trim()))
//       return (setMessage("Please enter a valid email"), setTimeout(() => setMessage(""), 4000));
//     try {
//       const token = localStorage.getItem("token");
//       if (!token) return (setMessage("Please login to apply"), setTimeout(() => setMessage(""), 4000));
//       const fd = new FormData();
//       fd.append("name", applyForm.name.trim());
//       fd.append("email", applyForm.email.trim());
//       if (applyForm.phone) fd.append("phone", applyForm.phone.trim());
//       if (applyForm.pastedCv) fd.append("pastedCv", applyForm.pastedCv.trim());
//       if (applyForm.resume) fd.append("resume", applyForm.resume);
//       const resp = await fetch(`${API_BASE_URL}/api/jobs/${applyJob.id || applyJob._id}/apply`, {
//         method: "POST", headers: { Authorization: `Bearer ${token}` }, body: fd, credentials: "include",
//       });
//       if (resp.ok) {
//         setMessage("Applied successfully");
//         setApplyOpen(false);
//         const appliedId = String(applyJob.id || applyJob._id);
//         setAppliedJobIds((prev) => new Set([...prev, appliedId]));
//         setTimeout(() => setMessage(""), 4000);
//       } else {
//         const err = await resp.json().catch(() => ({ message: "Unknown error" }));
//         if (err.code === "DUPLICATE_APPLICATION" || err.message?.includes("already applied")) {
//           setMessage("You have already applied for this job");
//           setAppliedJobIds((prev) => new Set([...prev, String(applyJob.id || applyJob._id)]));
//         } else {
//           setMessage(`Failed to apply: ${err.message || "Please try again"}`);
//         }
//         setTimeout(() => setMessage(""), 4000);
//       }
//     } catch {
//       setMessage("Failed to apply");
//       setTimeout(() => setMessage(""), 4000);
//     }
//   };

//   /* ── render ─────────────────────────────────────────────────────────────── */
//   return (
//     <>
//       {/* toast */}
//       {message && (
//         <div className={`alert ${message.includes("Failed") ? "alert-danger" : "alert-success"}`}
//           style={{ position: "fixed", top: "20px", right: "20px", zIndex: 9999 }}>
//           {message}
//         </div>
//       )}

//       <Header />

//       {/* ── mobile filter drawer ────────────────────────────────────────────── */}
//       {drawerOpen && (
//         <div style={styles.overlay} onClick={() => setDrawerOpen(false)}>
//           <div ref={drawerRef} style={styles.drawer(drawerOpen)} onClick={(e) => e.stopPropagation()}>
//             {/* drawer header */}
//             <div style={styles.drawerHead}>
//               <h5 style={styles.drawerTitle}>Filters</h5>
//               <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
//                 {activeFilterCount > 0 && (
//                   <button style={styles.clearAll} onClick={clearAllFilters}>Clear all</button>
//                 )}
//                 <button style={styles.closeBtn} onClick={() => setDrawerOpen(false)}>✕</button>
//               </div>
//             </div>
//             <FilterPanel
//               filters={filters} setFilters={setFilters}
//               setPage={setPage} itemsPerPage={itemsPerPage}
//               setItemsPerPage={setItemsPerPage}
//               isMobile={true}
//               onApply={() => setDrawerOpen(false)}
//             />
//           </div>
//         </div>
//       )}

//       {/* ── page body ───────────────────────────────────────────────────────── */}
//       <section className="padd-top-80 padd-bot-80">
//         <div className="container">

//           {/* ── mobile: search row + filter button ─────────────────────────── */}
//           <div className="visible-xs visible-sm" style={styles.mobileSearchRow}>
//             <input
//               type="text" placeholder="Search jobs…"
//               value={filters.q}
//               style={styles.mobileSearchInput}
//               onChange={(e) => {
//                 setFilters((p) => ({ ...p, q: e.target.value }));
//                 setPage(1);
//                 trackSearchDebounced(e.target.value);
//               }}
//             />
//             <button style={styles.filterBtn} onClick={() => setDrawerOpen(true)}>
//               <i className="ti-filter" />
//               Filters
//               {activeFilterCount > 0 && (
//                 <span style={styles.filterBadge}>{activeFilterCount}</span>
//               )}
//             </button>
//           </div>

//           <div className="row">
//             {/* ── desktop left sidebar ─────────────────────────────────────── */}
//             <div className="col-md-3 hidden-xs hidden-sm">
//               <div className="widget-boxed padd-bot-0">
//                 <div className="widget-boxed-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
//                   <h4 style={{ margin: 0 }}>Filters</h4>
//                   {activeFilterCount > 0 && (
//                     <button onClick={clearAllFilters}
//                       style={{ background: "none", border: "none", color: "#ef4444", fontSize: "12px", cursor: "pointer", fontWeight: "500" }}>
//                       Clear all ({activeFilterCount})
//                     </button>
//                   )}
//                 </div>
//                 <div style={{ padding: "0 0 8px" }}>
//                   {/* keyword + city */}
//                   <div style={styles.section}>
//                     <input type="text" className="form-control" placeholder="Search keywords"
//                       value={filters.q} style={{ marginBottom: "10px" }}
//                       onChange={(e) => { setFilters((p) => ({ ...p, q: e.target.value })); setPage(1); trackSearchDebounced(e.target.value); }} />
//                     <input type="text" className="form-control" placeholder="All locations"
//                       value={filters.city}
//                       onChange={(e) => { setFilters((p) => ({ ...p, city: e.target.value })); setPage(1); }} />
//                   </div>
//                   <FilterPanel
//                     filters={filters} setFilters={setFilters}
//                     setPage={setPage} itemsPerPage={itemsPerPage}
//                     setItemsPerPage={setItemsPerPage}
//                     isMobile={false}
//                   />
//                 </div>
//               </div>
//             </div>

//             {/* ── job cards ────────────────────────────────────────────────── */}
//             <div className="col-md-9 col-sm-12">
//               <div style={{ marginBottom: "16px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
//                 <h4 className="job_vacancie" style={{ margin: 0 }}>{totalJobs} Jobs &amp; Vacancies</h4>
//               </div>

//               {loading ? (
//                 <div className="vertical-job-card"><div className="vertical-job-body">Loading…</div></div>
//               ) : jobs.length === 0 ? (
//                 <div className="vertical-job-card"><div className="vertical-job-body">No jobs found.</div></div>
//               ) : (
//                 jobs.map((job) => {
//                   const id = job._id || job.id;
//                   const isApplied = appliedJobIds.has(String(id));
//                   const logoPath = job.companyLogoUrl || job.logoUrl || job.company_logo;
//                   const logo = logoPath && (logoPath.startsWith("http") || logoPath.startsWith("data:"))
//                     ? logoPath
//                     : logoPath
//                       ? `${API_BASE_URL}${logoPath.startsWith("/") ? logoPath : `/${logoPath}`}`
//                       : "/assets/img/company_logo_1.png";
//                   const title    = job.jobTitle || job.title;
//                   const company  = job.companyName || job.company || "";
//                   const location = job.city || job.state || job.country || job.address || "—";
//                   const jobType  = job.jobType || job.job_type || "—";
//                   const salary   = getSalaryDisplay(job);
//                   const status   = job.status || "active";
//                   const timePosted = getTimeAgo(job.createdAt || job.created_at || job.postedDate);

//                   return (
//                     <div key={id}
//                       onClick={() => navigate(`/jobs/${id}`)}
//                       style={{
//                         cursor: "pointer", backgroundColor: "white", borderRadius: "8px",
//                         padding: "16px", boxShadow: "0 2px 6px rgba(0,0,0,0.08)",
//                         transition: "all 0.2s ease", position: "relative",
//                         border: "1px solid #e1e5e9", marginBottom: "15px",
//                       }}
//                       onMouseEnter={(e) => { e.currentTarget.style.boxShadow = "0 4px 12px rgba(0,0,0,0.12)"; e.currentTarget.style.transform = "translateY(-2px)"; }}
//                       onMouseLeave={(e) => { e.currentTarget.style.boxShadow = "0 2px 6px rgba(0,0,0,0.08)"; e.currentTarget.style.transform = "translateY(0)"; }}
//                     >
//                       <div style={{ display: "flex", alignItems: "flex-start", marginBottom: "12px", position: "relative" }}>
//                         {/* logo + status */}
//                         <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-start", marginRight: "12px" }}>
//                           <div style={{ width: "50px", height: "50px", minWidth: "50px", borderRadius: "6px", overflow: "hidden", border: "1px solid #e1e5e9", display: "flex", alignItems: "center", justifyContent: "center", backgroundColor: "#f8f9fa", marginBottom: "8px" }}>
//                             <img src={logo} alt={company} style={{ width: "100%", height: "100%", objectFit: "contain" }}
//                               onError={(e) => { e.target.src = "/assets/img/company_logo_1.png"; }} />
//                           </div>
//                           <span style={{ padding: "2px 8px", borderRadius: "4px", fontSize: "11px", fontWeight: "600", backgroundColor: status === "active" ? "#e8f5e9" : "#fee2e2", color: status === "active" ? "#2e7d32" : "#dc2626", whiteSpace: "nowrap" }}>
//                             {status.charAt(0).toUpperCase() + status.slice(1)}
//                           </span>
//                         </div>

//                         {/* title + details */}
//                         <div style={{ flex: 1, minWidth: 0, paddingRight: "50px" }}>
//                           <h4 style={{ margin: "0 0 4px 0", fontSize: "15px", fontWeight: "600", color: "#1a1a1a", lineHeight: "1.3", overflow: "hidden", textOverflow: "ellipsis", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" }}>{title}</h4>
//                           <span style={{ fontSize: "13px", color: "#6b7280", display: "block", marginBottom: "10px" }}>{company}</span>
//                           <div style={{ display: "flex", flexDirection: "column", gap: "6px", fontSize: "13px", color: "#4b5563" }}>
//                             <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
//                               <i className="ti-briefcase" style={{ color: "#28a745", fontSize: "14px" }} />
//                               <span>{jobType.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase())}</span>
//                             </div>
//                             <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
//                               <i className="ti-location-pin" style={{ color: "#28a745", fontSize: "14px" }} />
//                               <span>{location}</span>
//                             </div>
//                             <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
//                               <i className="ti-time" style={{ color: "#28a745", fontSize: "14px" }} />
//                               <span>{timePosted}</span>
//                             </div>
//                             {salary && (
//                               <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
//                                 <span style={{ color: "#28a745", fontSize: "14px", fontWeight: "bold" }}>₹</span>
//                                 <span>{salary}</span>
//                               </div>
//                             )}
//                           </div>
//                         </div>

//                         {/* wishlist */}
//                         <div style={{ position: "absolute", top: "0", right: "0", zIndex: 10 }} onClick={(e) => e.stopPropagation()}>
//                           {user && user.role === "seeker" && id && <WishlistButton jobId={String(id)} />}
//                         </div>

//                         {/* apply */}
//                         {(!user || user.role === "seeker") && (
//                           <div style={{ position: "absolute", bottom: "-8px", right: "0", zIndex: 10 }} onClick={(e) => e.stopPropagation()}>
//                             {isApplied ? (
//                               <span style={{ display: "flex", alignItems: "center", gap: "6px", color: "#2563EB", fontWeight: "500", fontSize: "14px" }}>
//                                 <i className="ti-check" style={{ fontSize: "14px" }} /> Applied
//                               </span>
//                             ) : (
//                               <button className="btn-job job-apply"
//                                 onClick={(e) => { e.stopPropagation(); openApply(job); }}
//                                 style={{ fontSize: "13px", fontWeight: "600", padding: "6px 14px", borderRadius: "8px", border: "1px solid #26AE61", color: "#26AE61", background: "transparent", cursor: "pointer", display: "inline-flex", alignItems: "center", gap: "6px" }}
//                                 onMouseEnter={(e) => { e.currentTarget.style.background = "#26AE61"; e.currentTarget.style.color = "#fff"; }}
//                                 onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "#26AE61"; }}>
//                                 Apply Now <i className="ti-arrow-right" style={{ fontSize: "14px" }} />
//                               </button>
//                             )}
//                           </div>
//                         )}
//                       </div>
//                     </div>
//                   );
//                 })
//               )}

//               {/* pagination */}
//               {totalPages > 1 && (
//                 <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: "8px", flexWrap: "wrap", marginTop: "30px" }}>
//                   <button onClick={() => { if (page > 1) setPage(page - 1); }} disabled={page === 1}
//                     style={{ padding: "8px 12px", backgroundColor: page === 1 ? "#f3f4f6" : "white", color: page === 1 ? "#9ca3af" : "#4066D4", border: "1px solid #e1e5e9", borderRadius: "6px", cursor: page === 1 ? "not-allowed" : "pointer", minWidth: "36px", height: "36px", display: "flex", alignItems: "center", justifyContent: "center" }}>
//                     <span style={{ fontSize: "16px" }}>«</span>
//                   </button>
//                   {Array.from({ length: totalPages }).map((_, idx) => (
//                     <button key={idx} onClick={() => setPage(idx + 1)}
//                       style={{ padding: "8px 12px", backgroundColor: page === idx + 1 ? "#4066D4" : "white", color: page === idx + 1 ? "white" : "#4a5568", border: `1px solid ${page === idx + 1 ? "#4066D4" : "#e1e5e9"}`, borderRadius: "6px", cursor: "pointer", minWidth: "36px", height: "36px", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: "600", fontSize: "12px" }}>
//                       {idx + 1}
//                     </button>
//                   ))}
//                   <button onClick={() => { if (page < totalPages) setPage(page + 1); }} disabled={page === totalPages}
//                     style={{ padding: "8px 12px", backgroundColor: page === totalPages ? "#f3f4f6" : "white", color: page === totalPages ? "#9ca3af" : "#4066D4", border: "1px solid #e1e5e9", borderRadius: "6px", cursor: page === totalPages ? "not-allowed" : "pointer", minWidth: "36px", height: "36px", display: "flex", alignItems: "center", justifyContent: "center" }}>
//                     <span style={{ fontSize: "16px" }}>»</span>
//                   </button>
//                 </div>
//               )}
//             </div>
//           </div>
//         </div>
//       </section>

//       {/* ── apply modal ─────────────────────────────────────────────────────── */}
//       {applyOpen && (
//         <div className="modal fade in" style={{ display: "block", background: "rgba(0,0,0,0.5)", position: "fixed", inset: 0, zIndex: 9999 }}
//           onClick={() => setApplyOpen(false)}>
//           <div className="modal-dialog" onClick={(e) => e.stopPropagation()} style={{ maxHeight: "95vh", margin: "2% auto" }}>
//             <div className="modal-content" style={{ maxHeight: "95vh", display: "flex", flexDirection: "column" }}>
//               <div className="modal-body" style={{ padding: "20px", overflowY: "auto", flex: "1 1 auto" }}>
//                 <div className="text-center mrg-bot-20">
//                   <h4 className="mrg-0">{applyJob?.jobTitle || applyJob?.title}</h4>
//                 </div>
//                 <form onSubmit={(e) => { e.preventDefault(); submitApplication(); }}>
//                   {[
//                     { id: "name",  icon: "ti-user",   type: "text",  label: "Name" },
//                     { id: "email", icon: "ti-email",  type: "email", label: "Email" },
//                     { id: "phone", icon: "ti-mobile", type: "text",  label: "Phone" },
//                   ].map(({ id, icon, type, label }) => (
//                     <div className="col-md-12 col-sm-12" key={id}>
//                       <div style={{ position: "relative", marginBottom: "18px" }}>
//                         <i className={icon} style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: focusedField === id ? "#28a745" : "#999", transition: "all 0.3s", pointerEvents: "none", zIndex: 2, fontSize: "16px" }} />
//                         <label style={{ position: "absolute", left: "40px", top: focusedField === id || applyForm[id] ? "-10px" : "50%", transform: focusedField === id || applyForm[id] ? "translateY(0) scale(0.85)" : "translateY(-50%)", fontSize: focusedField === id || applyForm[id] ? "12px" : "14px", color: focusedField === id ? "#28a745" : "#999", transition: "all 0.3s", pointerEvents: "none", zIndex: 3, fontWeight: "500", backgroundColor: "white", padding: focusedField === id || applyForm[id] ? "0 4px" : "0" }}>{label}</label>
//                         <input type={type} className="form-control" value={applyForm[id]}
//                           onChange={(e) => setApplyForm((p) => ({ ...p, [id]: e.target.value }))}
//                           onFocus={() => setFocusedField(id)} onBlur={() => setFocusedField(null)}
//                           style={{ padding: "14px 12px 14px 40px", border: `2px solid ${focusedField === id ? "#28a745" : "#e1e5e9"}`, borderRadius: "6px", fontSize: "14px", outline: "none", height: "48px", transition: "all 0.3s" }} />
//                       </div>
//                     </div>
//                   ))}

//                   {/* resume upload */}
//                   <div className="col-md-12 col-sm-12">
//                     <div style={{ position: "relative", marginBottom: "18px" }}>
//                       <input type="file" id="file" name="resume" accept=".pdf,.doc,.docx" style={{ display: "none" }}
//                         onChange={(e) => setApplyForm((p) => ({ ...p, resume: e.target.files?.[0] || null }))} />
//                       {!applyForm.resume ? (
//                         <button type="button" onClick={() => document.getElementById("file").click()}
//                           style={{ width: "100%", padding: "14px", border: "2px solid #e1e5e9", borderRadius: "6px", backgroundColor: "#fff", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", fontSize: "14px", color: "#666", height: "48px" }}>
//                           <i className="ti-upload" style={{ fontSize: "16px", color: "#28a745" }} /> Upload your CV
//                         </button>
//                       ) : (
//                         <div style={{ width: "100%", padding: "12px", border: "2px solid #28a745", borderRadius: "6px", backgroundColor: "#f0f9ff", display: "flex", alignItems: "center", justifyContent: "space-between", height: "48px", boxSizing: "border-box" }}>
//                           <div style={{ display: "flex", alignItems: "center", gap: "8px", flex: 1, minWidth: 0 }}>
//                             <i className="ti-file" style={{ fontSize: "16px", color: "#28a745" }} />
//                             <span style={{ fontSize: "14px", color: "#333", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{applyForm.resume.name}</span>
//                           </div>
//                           <button type="button" onClick={() => { setApplyForm((p) => ({ ...p, resume: null })); document.getElementById("file").value = ""; }}
//                             style={{ padding: "4px 8px", border: "none", borderRadius: "4px", backgroundColor: "#ff4757", color: "white", cursor: "pointer", fontSize: "12px" }}>
//                             <i className="ti-close" /> Remove
//                           </button>
//                         </div>
//                       )}
//                     </div>
//                   </div>

//                   {/* cover letter */}
//                   <div className="col-md-12">
//                     <div style={{ position: "relative", marginBottom: "18px" }}>
//                       <label style={{ position: "absolute", left: "40px", top: focusedField === "pastedCv" || applyForm.pastedCv ? "-10px" : "20px", transform: focusedField === "pastedCv" || applyForm.pastedCv ? "scale(0.85)" : "scale(1)", fontSize: "14px", color: focusedField === "pastedCv" ? "#28a745" : "#999", transition: "all 0.3s", pointerEvents: "none", zIndex: 3, fontWeight: "500", backgroundColor: "white", padding: "0 4px" }}>Paste your cover letter</label>
//                       <textarea className="form-control height-120" value={applyForm.pastedCv}
//                         onChange={(e) => setApplyForm((p) => ({ ...p, pastedCv: e.target.value }))}
//                         onFocus={() => setFocusedField("pastedCv")} onBlur={() => setFocusedField(null)}
//                         style={{ padding: "20px 12px 12px 40px", minHeight: "100px", border: `2px solid ${focusedField === "pastedCv" ? "#28a745" : "#e1e5e9"}`, borderRadius: "6px", fontSize: "14px", outline: "none", resize: "vertical", width: "100%", boxSizing: "border-box" }} />
//                     </div>
//                   </div>

//                   <div className="col-md-12" style={{ marginTop: "15px", textAlign: "center" }}>
//                     <button type="submit" className="btn theme-btn btn-m" style={{ display: "inline-flex", alignItems: "center", gap: "8px", padding: "10px 24px", fontSize: "14px", fontWeight: "600" }}>
//                       Submit <i className="ti-arrow-right" />
//                     </button>
//                   </div>
//                 </form>
//               </div>
//             </div>
//           </div>
//         </div>
//       )}

//       <MobileAppDownload />
//       <Footer />
//     </>
//   );
// }

// export default AllJobs;
