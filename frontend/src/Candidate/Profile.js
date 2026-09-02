import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
    FiUser,
    FiFileText,
    FiBriefcase,
    FiAward,
    FiBookOpen,
    FiLink,
    FiCheckCircle,
    FiArrowRight,
    FiZap,
    FiPlus,
    FiEdit2,
    FiX,
} from "react-icons/fi";
import { useAuth } from "../context/AuthContext";
import Header from "../Components/Header";
import Footer from "../Components/Footer";
import { API_BASE_URL } from "../config/api";
import useJobCategories from "../hooks/useJobCategories";
import { findCategory } from "../utils/jobCategoriesApi";
import CandidateSidebar, { ProfileAvatarRing } from "./Sidebar";

// Theme tokens (green / Naukri-inspired futuristic)
const THEME = {
    green: '#16a34a',
    greenDark: '#15803d',
    teal: '#0f766e',
    greenSoft: 'rgba(22,163,74,0.10)',
    gradient: 'linear-gradient(135deg, #16a34a 0%, #15803d 55%, #0f766e 100%)',
    textDark: '#0f172a',
    textMid: '#475569',
    textSoft: '#64748b',
    cardBorder: 'rgba(148,163,184,0.18)',
    cardShadow: '0 6px 20px rgba(15,23,42,0.06)',
    pageBg: '#f7fbf8',
};

// Mount/scroll reveal wrapper for cards
function RevealCard({ children, delay = 0, ...rest }) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 28 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.15 }}
            transition={{ duration: 0.5, delay, ease: 'easeOut' }}
            whileHover={{ y: -4, boxShadow: '0 14px 34px rgba(15,23,42,0.10)' }}
            {...rest}
        >
            {children}
        </motion.div>
    );
}

const toCommaList = (val) => {
    if (val == null || val === '') return '';
    if (Array.isArray(val)) {
        return val
            .map((item) => {
                if (typeof item === 'string') return item;
                if (item && typeof item === 'object') {
                    return item.title || item.name || item.value || '';
                }
                return '';
            })
            .filter(Boolean)
            .join(', ');
    }
    if (typeof val === 'string') return val;
    return '';
};

const normalizeResumeForCompare = (resume) => {
    if (resume instanceof File) return `__file__:${resume.name}:${resume.size}`;
    return String(resume ?? '').trim();
};

const normalizeExperienceForCompare = (experience) => {
    const list = Array.isArray(experience) ? experience : [];
    const normalized = list.map((entry) => ({
        id: String(entry.id || ''),
        jobTitle: String(entry.jobTitle || '').trim(),
        company: String(entry.company || '').trim(),
        employmentType: String(entry.employmentType || '').trim(),
        currentlyWorking: Boolean(entry.currentlyWorking),
        startMonth: String(entry.startMonth || '').trim(),
        startYear: String(entry.startYear || '').trim(),
        endMonth: String(entry.endMonth || '').trim(),
        endYear: String(entry.endYear || '').trim(),
        location: String(entry.location || '').trim(),
        locationType: String(entry.locationType || '').trim(),
        description: String(entry.description || '').trim(),
    }));
    normalized.sort((a, b) => a.id.localeCompare(b.id));
    return JSON.stringify(normalized);
};

const normalizeEducationForCompare = (education) => {
    const list = Array.isArray(education) ? education : [];
    const normalized = list.map((entry) => ({
        id: String(entry.id || ''),
        instituteName: String(entry.instituteName || '').trim(),
        degree: String(entry.degree || '').trim(),
        courseType: String(entry.courseType || '').trim(),
        marks: String(entry.marks || '').trim(),
        startYear: String(entry.startYear || '').trim(),
        endYear: String(entry.endYear || '').trim(),
    }));
    normalized.sort((a, b) => a.id.localeCompare(b.id));
    return JSON.stringify(normalized);
};

const normalizeCertificationForCompare = (certifications) => {
    const list = Array.isArray(certifications) ? certifications : [];
    const normalized = list.map((entry) => ({
        id: String(entry.id || ''),
        name: String(entry.name || '').trim(),
        issuingOrganization: String(entry.issuingOrganization || '').trim(),
        issueMonth: String(entry.issueMonth || '').trim(),
        issueYear: String(entry.issueYear || '').trim(),
        noExpiration: Boolean(entry.noExpiration),
        expirationMonth: String(entry.expirationMonth || '').trim(),
        expirationYear: String(entry.expirationYear || '').trim(),
        credentialUrl: String(entry.credentialUrl || '').trim(),
    }));
    normalized.sort((a, b) => a.id.localeCompare(b.id));
    return JSON.stringify(normalized);
};

const buildProfileCompareSnapshot = (data) => JSON.stringify({
    name: String(data?.name ?? '').trim(),
    email: String(data?.email ?? '').trim(),
    phone: String(data?.phone ?? '').trim(),
    address: String(data?.address ?? '').trim(),
    gender: String(data?.gender ?? '').trim(),
    languages: String(data?.languages ?? '').trim(),
    dateOfBirth: String(data?.dateOfBirth ?? '').trim(),
    facebook: String(data?.facebook ?? '').trim(),
    twitter: String(data?.twitter ?? '').trim(),
    linkedin: String(data?.linkedin ?? '').trim(),
    google: String(data?.google ?? '').trim(),
    preferredJobRole: String(data?.preferredJobRole ?? '').trim(),
    bio: String(data?.bio ?? '').trim(),
    skills: String(data?.skills ?? '').trim(),
    currentSalary: String(data?.currentSalary ?? '').trim(),
    expectedSalary: String(data?.expectedSalary ?? '').trim(),
    noticePeriod: String(data?.noticePeriod ?? '').trim(),
    preferredLocation: String(data?.preferredLocation ?? '').trim(),
    employmentType: String(data?.employmentType ?? '').trim(),
    hasDisability: Boolean(data?.hasDisability),
    disabilityDetails: String(data?.disabilityDetails ?? '').trim(),
    accommodationNeeds: String(data?.accommodationNeeds ?? '').trim(),
    jobCategory: String(data?.jobCategory ?? '').trim(),
    jobSubCategory: String(data?.jobSubCategory ?? '').trim(),
    resume: normalizeResumeForCompare(data?.resume),
    profilePicturePending: data?.profilePicture instanceof File,
    experience: normalizeExperienceForCompare(data?.experience),
    education: normalizeEducationForCompare(data?.education),
    certifications: normalizeCertificationForCompare(data?.certifications),
});

const MONTH_OPTIONS = [
    { value: '', label: 'Month' },
    { value: '01', label: 'January' },
    { value: '02', label: 'February' },
    { value: '03', label: 'March' },
    { value: '04', label: 'April' },
    { value: '05', label: 'May' },
    { value: '06', label: 'June' },
    { value: '07', label: 'July' },
    { value: '08', label: 'August' },
    { value: '09', label: 'September' },
    { value: '10', label: 'October' },
    { value: '11', label: 'November' },
    { value: '12', label: 'December' },
];

const EMPLOYMENT_TYPE_OPTIONS = [
    { value: '', label: 'Select employment type' },
    { value: 'full-time', label: 'Full Time' },
    { value: 'part-time', label: 'Part Time' },
    { value: 'self-employed', label: 'Self Employed' },
    { value: 'freelance', label: 'Freelance' },
    { value: 'internship', label: 'Internship' },
    { value: 'apprenticeship', label: 'Apprenticeship' },
];

const LOCATION_TYPE_OPTIONS = [
    { value: '', label: 'Select location type' },
    { value: 'on-site', label: 'On-site' },
    { value: 'hybrid', label: 'Hybrid' },
    { value: 'remote', label: 'Remote' },
];

const COURSE_TYPE_OPTIONS = [
    { value: 'full-time', label: 'Full time' },
    { value: 'part-time', label: 'Part time' },
    { value: 'correspondence', label: 'Correspondence/Distance Learning' },
];

const buildYearOptions = () => {
    const currentYear = new Date().getFullYear();
    const options = [{ value: '', label: 'Year' }];
    for (let year = currentYear; year >= 1980; year -= 1) {
        options.push({ value: String(year), label: String(year) });
    }
    return options;
};

const YEAR_OPTIONS = buildYearOptions();

const SHORT_MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const EXPERIENCE_DESC_PREVIEW = 120;

const emptyExperienceEntry = () => ({
    id: `exp_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    jobTitle: '',
    employmentType: '',
    company: '',
    currentlyWorking: true,
    startMonth: '',
    startYear: '',
    endMonth: '',
    endYear: '',
    location: '',
    locationType: '',
    description: '',
});

const parseExperienceList = (val) => {
    if (val == null || val === '') return [];

    let arr = val;
    if (typeof val === 'string') {
        try {
            arr = JSON.parse(val);
        } catch {
            arr = val.split(',').map((item) => item.trim()).filter(Boolean);
        }
    }

    if (!Array.isArray(arr)) return [];

    return arr
        .map((item, index) => {
            if (item && typeof item === 'object') {
                return {
                    id: item.id || `exp_${index}_${Date.now()}`,
                    jobTitle: item.jobTitle || item.role || '',
                    employmentType: item.employmentType || '',
                    company: item.company || '',
                    currentlyWorking: Boolean(item.currentlyWorking),
                    startMonth: item.startMonth || '',
                    startYear: String(item.startYear || ''),
                    endMonth: item.endMonth || '',
                    endYear: String(item.endYear || ''),
                    location: item.location || '',
                    locationType: item.locationType || '',
                    description: item.description || item.responsibilities || '',
                };
            }

            if (typeof item === 'string') {
                return {
                    ...emptyExperienceEntry(),
                    id: `exp_legacy_${index}`,
                    jobTitle: item,
                };
            }

            return null;
        })
        .filter((item) => item && (item.jobTitle || item.company || item.description));
};

const formatShortMonthYear = (month, year) => {
    if (!year) return '';
    const monthIndex = parseInt(month, 10) - 1;
    if (month && monthIndex >= 0 && monthIndex < 12) {
        return `${SHORT_MONTHS[monthIndex]} ${year}`;
    }
    return String(year);
};

const getExperienceSortValue = (entry) => {
    const year = parseInt(entry.startYear, 10) || 0;
    const month = parseInt(entry.startMonth, 10) || 0;
    return year * 100 + month;
};

const sortExperienceLatestFirst = (entries) =>
    [...entries].sort((a, b) => getExperienceSortValue(b) - getExperienceSortValue(a));

const calculateExperienceDurationMonths = (entry) => {
    const startYear = parseInt(entry.startYear, 10);
    const startMonth = parseInt(entry.startMonth, 10) || 1;
    if (!startYear) return null;

    let endYear;
    let endMonth;
    if (entry.currentlyWorking) {
        const now = new Date();
        endYear = now.getFullYear();
        endMonth = now.getMonth() + 1;
    } else {
        endYear = parseInt(entry.endYear, 10);
        endMonth = parseInt(entry.endMonth, 10) || 12;
        if (!endYear) return null;
    }

    const totalMonths = (endYear - startYear) * 12 + (endMonth - startMonth) + 1;
    return Math.max(1, totalMonths);
};

const formatDurationLabel = (months) => {
    if (!months || months < 1) return '';
    if (months < 12) return `${months} mos`;
    const years = Math.floor(months / 12);
    const remainingMonths = months % 12;
    if (remainingMonths === 0) {
        return years === 1 ? '1 yr' : `${years} yrs`;
    }
    return `${years} yr${years > 1 ? 's' : ''} ${remainingMonths} mos`;
};

const formatExperienceDateRange = (entry) => {
    const start = formatShortMonthYear(entry.startMonth, entry.startYear);
    const end = entry.currentlyWorking
        ? 'Present'
        : formatShortMonthYear(entry.endMonth, entry.endYear);

    if (!start && !end) return 'Dates not added';

    let dateText = '';
    if (start && end) dateText = `${start} - ${end}`;
    else dateText = start || end;

    const durationLabel = formatDurationLabel(calculateExperienceDurationMonths(entry));
    if (durationLabel) dateText += ` · ${durationLabel}`;

    return dateText;
};

const emptyEducationEntry = () => ({
    id: `edu_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    instituteName: '',
    degree: '',
    courseType: 'full-time',
    marks: '',
    startYear: '',
    endYear: '',
});

const emptyCertificationEntry = () => ({
    id: `cert_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    name: '',
    issuingOrganization: '',
    issueMonth: '',
    issueYear: '',
    noExpiration: false,
    expirationMonth: '',
    expirationYear: '',
    credentialUrl: '',
});

const parseEducationList = (val) => {
    if (val == null || val === '') return [];

    let arr = val;
    if (typeof val === 'string') {
        try {
            arr = JSON.parse(val);
        } catch {
            arr = val.split(',').map((item) => item.trim()).filter(Boolean);
        }
    }

    if (!Array.isArray(arr)) return [];

    return arr
        .map((item, index) => {
            if (item && typeof item === 'object') {
                return {
                    id: item.id || `edu_${index}_${Date.now()}`,
                    instituteName: item.instituteName || item.institute || item.school || '',
                    degree: item.degree || item.title || item.text || '',
                    courseType: item.courseType || 'full-time',
                    marks: item.marks || '',
                    startYear: String(item.startYear || ''),
                    endYear: String(item.endYear || ''),
                };
            }

            if (typeof item === 'string') {
                return {
                    ...emptyEducationEntry(),
                    id: `edu_legacy_${index}`,
                    degree: item,
                };
            }

            return null;
        })
        .filter((item) => item && (item.instituteName || item.degree));
};

const parseCertificationList = (val) => {
    if (val == null || val === '') return [];

    let arr = val;
    if (typeof val === 'string') {
        try {
            arr = JSON.parse(val);
        } catch {
            arr = val.split(',').map((item) => item.trim()).filter(Boolean);
        }
    }

    if (!Array.isArray(arr)) return [];

    return arr
        .map((item, index) => {
            if (item && typeof item === 'object') {
                return {
                    id: item.id || `cert_${index}_${Date.now()}`,
                    name: item.name || item.title || item.text || '',
                    issuingOrganization: item.issuingOrganization || item.organization || item.issuer || '',
                    issueMonth: item.issueMonth || '',
                    issueYear: String(item.issueYear || ''),
                    noExpiration: Boolean(item.noExpiration),
                    expirationMonth: item.expirationMonth || '',
                    expirationYear: String(item.expirationYear || ''),
                    credentialUrl: item.credentialUrl || item.url || '',
                };
            }

            if (typeof item === 'string') {
                return {
                    ...emptyCertificationEntry(),
                    id: `cert_legacy_${index}`,
                    name: item,
                };
            }

            return null;
        })
        .filter((item) => item && (item.name || item.issuingOrganization));
};

const getEducationSortValue = (entry) => parseInt(entry.startYear, 10) || 0;

const sortEducationLatestFirst = (entries) =>
    [...entries].sort((a, b) => getEducationSortValue(b) - getEducationSortValue(a));

const getCertificationSortValue = (entry) => {
    const year = parseInt(entry.issueYear, 10) || 0;
    const month = parseInt(entry.issueMonth, 10) || 0;
    return year * 100 + month;
};

const sortCertificationLatestFirst = (entries) =>
    [...entries].sort((a, b) => getCertificationSortValue(b) - getCertificationSortValue(a));

const formatEducationDateRange = (entry) => {
    const start = entry.startYear ? String(entry.startYear) : '';
    const end = entry.endYear ? String(entry.endYear) : '';

    if (!start && !end) return 'Dates not added';
    if (start && end) return `${start} - ${end}`;
    return start || end;
};

const formatCertificationDateRange = (entry) => {
    const issued = formatShortMonthYear(entry.issueMonth, entry.issueYear);
    const expires = entry.noExpiration
        ? 'No expiration'
        : formatShortMonthYear(entry.expirationMonth, entry.expirationYear);

    if (!issued && !expires) return 'Dates not added';
    if (issued && expires) return `Issued ${issued} · Expires ${expires}`;
    if (issued) return `Issued ${issued}`;
    return `Expires ${expires}`;
};

const labelForOption = (options, value) =>
    options.find((option) => option.value === value)?.label || '';

function ProfileSlideDownPanel({ open, children }) {
    return (
        <div
            style={{
                maxHeight: open ? '1400px' : '0',
                opacity: open ? 1 : 0,
                overflow: 'hidden',
                transition: 'max-height 0.4s ease, opacity 0.28s ease, margin-bottom 0.28s ease',
                marginBottom: open ? '20px' : '0',
            }}
        >
            {children}
        </div>
    );
}

function ExperienceDescriptionText({ text, entryId, expandedIds, onToggle }) {
    if (!text) return null;

    const isExpanded = expandedIds.has(entryId);
    const needsTruncate = text.length > EXPERIENCE_DESC_PREVIEW;
    const displayText = !needsTruncate || isExpanded
        ? text
        : `${text.slice(0, EXPERIENCE_DESC_PREVIEW).trim()}...`;

    return (
        <div style={{ marginTop: '8px' }}>
            <p style={{ margin: 0, fontSize: '13px', color: '#475569', lineHeight: 1.55 }}>
                {displayText}
            </p>
            {needsTruncate ? (
                <button
                    type="button"
                    onClick={() => onToggle(entryId)}
                    style={{
                        marginTop: '6px',
                        padding: 0,
                        border: 'none',
                        background: 'none',
                        color: '#16a34a',
                        fontWeight: 700,
                        fontSize: '13px',
                        cursor: 'pointer',
                    }}
                >
                    {isExpanded ? 'Read less' : 'Read more'}
                </button>
            ) : null}
        </div>
    );
}

function Profile() {
    const { user, loadProfileData, logout, loading: authLoading } = useAuth();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');
    const [profileData, setProfileData] = useState({
        name: user?.fullName || '',
        email: user?.email || '',
        phone: user?.phone || '',
        address: '',
        gender: '',
        languages: '',
        dateOfBirth: '',
        profilePicture: null,
        profilePictureUrl: '',
        facebook: '',
        twitter: '',
        linkedin: '',
        google: '',
        preferredJobRole: '',
        bio: '',
        resume: '',
        skills: '',
        experience: [],
        certifications: [],
        education: [],
        currentSalary: '',
        expectedSalary: '',
        noticePeriod: '',
        preferredLocation: '',
        employmentType: '',
        jobCategory: '',
        jobSubCategory: '',
        hasDisability: false,
        disabilityDetails: '',
        accommodationNeeds: '',
    });

    const jobCategoriesHook = useJobCategories(profileData.jobCategory);
    const jobCategories = jobCategoriesHook.categories;
    const jobSubcategories = jobCategoriesHook.subcategories;
    const jobCategoriesLoading = jobCategoriesHook.loading;
    const jobSubcategoriesLoading = jobCategoriesHook.subcategoriesLoading;

    const [profilePictureName, setProfilePictureName] = useState('');
    const [resumeUploadProgress, setResumeUploadProgress] = useState(0);
    const [isResumeUploading, setIsResumeUploading] = useState(false);
    const [isResumeDragOver, setIsResumeDragOver] = useState(false);
    const profilePictureInputRef = useRef(null);
    const profilePreviewBlobUrlRef = useRef(null);
    const resumeInputRef = useRef(null);
    const messageTimerRef = useRef(null);
    const savedProfileSnapshotRef = useRef(null);

    const syncSavedProfileSnapshot = (data) => {
        savedProfileSnapshotRef.current = buildProfileCompareSnapshot(data);
    };

    const hasUnsavedProfileChanges = (data) => {
        if (!savedProfileSnapshotRef.current) return true;
        return buildProfileCompareSnapshot(data) !== savedProfileSnapshotRef.current;
    };

    const [experienceModalOpen, setExperienceModalOpen] = useState(false);
    const [experienceForm, setExperienceForm] = useState(emptyExperienceEntry());
    const [experienceEditId, setExperienceEditId] = useState(null);
    const [experienceFormError, setExperienceFormError] = useState('');
    const [expandedExperienceIds, setExpandedExperienceIds] = useState(() => new Set());

    const [educationAddFormOpen, setEducationAddFormOpen] = useState(false);
    const [educationModalOpen, setEducationModalOpen] = useState(false);
    const [educationForm, setEducationForm] = useState(emptyEducationEntry());
    const [educationEditId, setEducationEditId] = useState(null);
    const [educationFormError, setEducationFormError] = useState('');

    const [certificationAddFormOpen, setCertificationAddFormOpen] = useState(false);
    const [certificationModalOpen, setCertificationModalOpen] = useState(false);
    const [certificationForm, setCertificationForm] = useState(emptyCertificationEntry());
    const [certificationEditId, setCertificationEditId] = useState(null);
    const [certificationFormError, setCertificationFormError] = useState('');

    const clearProfileMessage = () => {
        if (messageTimerRef.current) {
            clearTimeout(messageTimerRef.current);
            messageTimerRef.current = null;
        }
        setMessage('');
    };

    const showProfileMessage = (text, autoHideMs = 4000) => {
        if (messageTimerRef.current) {
            clearTimeout(messageTimerRef.current);
            messageTimerRef.current = null;
        }
        if (!text) {
            setMessage('');
            return;
        }
        setMessage(text);
        if (autoHideMs > 0) {
            messageTimerRef.current = setTimeout(() => {
                setMessage('');
                messageTimerRef.current = null;
            }, autoHideMs);
        }
    };

    const revokeProfilePreviewBlob = () => {
        if (profilePreviewBlobUrlRef.current) {
            URL.revokeObjectURL(profilePreviewBlobUrlRef.current);
            profilePreviewBlobUrlRef.current = null;
        }
    };

    useEffect(() => () => {
        revokeProfilePreviewBlob();
        if (messageTimerRef.current) {
            clearTimeout(messageTimerRef.current);
        }
    }, []);

    const getResolvedRequiredFields = (source = profileData) => {
        const resolvedName = String(
            source?.name ??
            source?.fullName ??
            user?.fullName ??
            user?.name ??
            ''
        ).trim();
        const resolvedEmail = String(
            source?.email ??
            user?.email ??
            ''
        ).trim();
        const resolvedPhone = String(
            source?.phone ??
            user?.phone ??
            ''
        ).trim();

        return { resolvedName, resolvedEmail, resolvedPhone };
    };

    const maxDateOfBirth = new Date().toISOString().slice(0, 10);

    const formatDateForInput = (value) => {
        if (value === null || value === undefined || value === '') return '';
        if (value instanceof Date && !Number.isNaN(value.getTime())) {
            const y = value.getFullYear();
            const m = String(value.getMonth() + 1).padStart(2, '0');
            const d = String(value.getDate()).padStart(2, '0');
            return `${y}-${m}-${d}`;
        }
        const str = String(value).trim();
        const isoDate = str.match(/^(\d{4}-\d{2}-\d{2})/);
        if (isoDate) return isoDate[1];
        const parsed = new Date(str);
        if (Number.isNaN(parsed.getTime())) return '';
        const y = parsed.getUTCFullYear();
        const m = String(parsed.getUTCMonth() + 1).padStart(2, '0');
        const d = String(parsed.getUTCDate()).padStart(2, '0');
        return `${y}-${m}-${d}`;
    };

    const validateMandatoryProfileFields = (source = profileData) => {
        const { resolvedName, resolvedEmail, resolvedPhone } = getResolvedRequiredFields(source);
        const gender = String(source?.gender ?? '').trim();
        const dateOfBirth = formatDateForInput(source?.dateOfBirth);
        const preferredJobRole = String(source?.preferredJobRole ?? '').trim();

        if (!resolvedName) {
            return { valid: false, message: 'Please enter your full name.' };
        }
        if (!resolvedEmail) {
            return { valid: false, message: 'Please enter your email address.' };
        }
        const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailPattern.test(resolvedEmail)) {
            return { valid: false, message: 'Please enter a valid email address.' };
        }
        if (!resolvedPhone) {
            return { valid: false, message: 'Please enter your phone number.' };
        }
        if (!gender) {
            return { valid: false, message: 'Please select your gender.' };
        }
        if (!dateOfBirth) {
            return { valid: false, message: 'Please enter your date of birth.' };
        }

        const dobDate = new Date(`${dateOfBirth}T00:00:00`);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        if (Number.isNaN(dobDate.getTime())) {
            return { valid: false, message: 'Please enter a valid date of birth.' };
        }
        if (dobDate > today) {
            return { valid: false, message: 'Date of birth cannot be a future date.' };
        }
        if (!preferredJobRole) {
            return { valid: false, message: 'Please enter your preferred job role.' };
        }

        return { valid: true, message: '' };
    };

    const appendProfileFieldsToFormData = (formData, source, { resolvedName, resolvedEmail, resolvedPhone }) => {
        const appendRequired = (key, value) => formData.append(key, (value ?? '').trim());
        const appendOptional = (key, value) => {
            if (value !== undefined && value !== null && String(value).trim() !== '') {
                formData.append(key, value);
            }
        };
        const appendArrayField = (key, value) => {
            if (value === undefined || value === null) return;
            if (Array.isArray(value)) {
                if (value.length > 0) {
                    formData.append(key, JSON.stringify(value));
                }
                return;
            }
            if (String(value).trim() !== '') {
                const normalized = String(value)
                    .split(',')
                    .map((item) => item.trim())
                    .filter(Boolean);
                if (normalized.length > 0) {
                    formData.append(key, JSON.stringify(normalized));
                }
            }
        };

        appendRequired('name', resolvedName);
        appendRequired('email', resolvedEmail);
        appendRequired('phone', resolvedPhone);
        appendRequired('gender', source.gender);
        appendRequired('dateOfBirth', formatDateForInput(source.dateOfBirth));
        appendRequired('preferredJobRole', source.preferredJobRole);
        appendOptional('address', source.address);
        appendArrayField('languages', source.languages);
        appendOptional('facebook', source.facebook);
        appendOptional('twitter', source.twitter);
        appendOptional('linkedin', source.linkedin);
        appendOptional('google', source.google);
        appendOptional('bio', source.bio);
        appendArrayField('skills', source.skills);
        appendArrayField('experience', source.experience);
        appendArrayField('certifications', source.certifications);
        appendArrayField('education', source.education);
        appendOptional('currentSalary', source.currentSalary);
        appendOptional('expectedSalary', source.expectedSalary);
        appendOptional('noticePeriod', source.noticePeriod);
        formData.append('preferredLocation', String(source.preferredLocation ?? '').trim());
        appendOptional('employmentType', source.employmentType);
        formData.append('hasDisability', source.hasDisability ? 'true' : 'false');
        appendOptional('disabilityDetails', source.disabilityDetails);
        appendOptional('accommodationNeeds', source.accommodationNeeds);
    };

    const saveJobCategories = async (token, source = profileData) => {
        if (!source.jobCategory) return true;
        const cat = findCategory(jobCategories, source.jobCategory);
        if (!cat?.id) return true;

        const sub = source.jobSubCategory
            ? jobSubcategories.find(
                (s) => s.name === source.jobSubCategory || String(s.id) === String(source.jobSubCategory)
            )
            : null;

        const response = await fetch(`${API_BASE_URL}/api/profile/categories`, {
            method: 'PUT',
            headers: {
                Authorization: `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                categoryIds: [Number(cat.id)],
                subcategoryIds: sub?.id ? [Number(sub.id)] : [],
            }),
        });

        if (!response.ok) {
            let errorMessage = 'Failed to save job category.';
            try {
                const errorData = await response.json();
                errorMessage = errorData.message || errorMessage;
            } catch (error) {
                console.log('Failed to parse category save error', error);
            }
            showProfileMessage(errorMessage, 5000);
            return false;
        }
        return true;
    };

    const resolveSavedCategory = (source) => {
        if (Array.isArray(source?.categories) && source.categories.length > 0) {
            return source.categories[0].name || '';
        }
        if (Array.isArray(source?.categoryIds) && source.categoryIds.length > 0 && jobCategories.length > 0) {
            const cat = findCategory(jobCategories, source.categoryIds[0]);
            if (cat?.name) return cat.name;
        }
        const raw = source?.jobCategory ?? source?.category ?? source?.categoryName ?? source?.categoryId ?? '';
        if (!raw) return '';
        const cat = findCategory(jobCategories, raw);
        return cat?.name || String(raw);
    };

    const resolveSavedSubCategory = (source, categoryName, subsList = jobSubcategories) => {
        if (Array.isArray(source?.subcategories) && source.subcategories.length > 0) {
            return source.subcategories[0].name || '';
        }
        if (Array.isArray(source?.subcategoryIds) && source.subcategoryIds.length > 0) {
            const subs = Array.isArray(subsList) ? subsList : [];
            const byId = subs.find((s) => String(s.id) === String(source.subcategoryIds[0]));
            if (byId) return byId.name;
        }
        const raw = source?.jobSubCategory ?? source?.subcategory ?? source?.subcategoryName ?? source?.subCategory ?? source?.subcategoryId ?? '';
        if (!raw) return '';
        const subs = Array.isArray(subsList) ? subsList : [];
        const byId = subs.find((s) => String(s.id) === String(raw));
        if (byId) return byId.name;
        const byName = subs.find((s) => s.name === String(raw));
        if (byName) return byName.name;
        return String(raw);
    };

    const mapApiProfileToFormState = (profile) => {
        const profilePictureUrl = profile.profilePicture || localStorage.getItem('userProfilePicture') || '';
        const fullProfilePictureUrl =
            profilePictureUrl &&
            !profilePictureUrl.startsWith('http') &&
            !profilePictureUrl.startsWith('data:') &&
            !profilePictureUrl.startsWith('blob:')
                ? `${API_BASE_URL}${profilePictureUrl}`
                : profilePictureUrl;

        const savedCategory = resolveSavedCategory(profile);

        return {
            name: profile.name || '',
            email: profile.email || '',
            phone: profile.phone || '',
            address: profile.address || '',
            gender: profile.gender || '',
            languages: toCommaList(profile.languages),
            dateOfBirth: formatDateForInput(profile.dateOfBirth),
            profilePicture: null,
            profilePictureUrl: fullProfilePictureUrl,
            facebook: profile.facebook || '',
            twitter: profile.twitter || '',
            linkedin: profile.linkedin || '',
            google: profile.google || '',
            preferredJobRole: profile.preferredJobRole || profile.preferred_job_role || '',
            bio: profile.bio || '',
            resume: profile.resume || '',
            skills: toCommaList(profile.skills),
            experience: parseExperienceList(profile.experience),
            certifications: parseCertificationList(profile.certifications),
            education: parseEducationList(profile.education),
            currentSalary: profile.currentSalary || profile.current_salary || '',
            expectedSalary: profile.expectedSalary || profile.expected_salary || '',
            noticePeriod: profile.noticePeriod || profile.notice_period || '',
            preferredLocation: profile.preferredLocation ?? profile.preferred_location ?? '',
            employmentType: profile.employmentType || profile.employment_type || '',
            jobCategory: savedCategory,
            jobSubCategory: resolveSavedSubCategory(profile, savedCategory),
            hasDisability: !!profile.hasDisability,
            disabilityDetails: profile.disabilityDetails || '',
            accommodationNeeds: profile.accommodationNeeds || '',
        };
    };

    useEffect(() => {
        if (!user) {
            navigate('/');
            return;
        }

        // Always load full profile from API — AuthContext only caches a subset of fields.
        loadLocalProfileData();
    }, [user, navigate]);

    useEffect(() => {
        if (!user || !jobCategories.length) return;
        setProfileData((prev) => {
            const savedCategory = resolveSavedCategory(prev);
            const savedSubCategory = resolveSavedSubCategory(prev, savedCategory);
            if (
                savedCategory === prev.jobCategory &&
                savedSubCategory === prev.jobSubCategory
            ) {
                return prev;
            }
            const next = {
                ...prev,
                jobCategory: savedCategory || prev.jobCategory,
                jobSubCategory: savedSubCategory || prev.jobSubCategory,
            };
            syncSavedProfileSnapshot(next);
            return next;
        });
    }, [jobCategories, jobSubcategories, user]);

    useEffect(() => {
        if (!user || !jobCategories.length) return;
        setProfileData((prev) => {
            syncSavedProfileSnapshot(prev);
            return prev;
        });
    }, [jobCategories.length, jobSubcategories.length, user]);

    const loadLocalProfileData = async () => {
        try {
            const token = localStorage.getItem('token');
            if (!token) {
                console.log('No token found');
                return;
            }

            // console.log('Loading profile data with token:', token.substring(0, 20) + '...');
            const response = await fetch(`${API_BASE_URL}/api/profile`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            // console.log('Profile response status:', response.status);
            if (response.ok) {
                const data = await response.json();
                // console.log('Profile data received:', data);
                const profileDataToSet = mapApiProfileToFormState(data.profile || {});
                // console.log('Local profile data to set:', profileDataToSet);
                // console.log('Preferred location from API:', profileDataToSet.preferredLocation);
                revokeProfilePreviewBlob();
                setProfileData(profileDataToSet);
                syncSavedProfileSnapshot(profileDataToSet);
            } else {
                console.log('Profile request failed with status:', response.status);
                const errorText = await response.text();
                console.log('Error response:', errorText);
                // Fallback to user data if profile not found
                setProfileData(prev => ({
                    ...prev,
                    name: user.fullName || '',
                    email: user.email || '',
                    phone: user.phone || ''
                }));
            }
        } catch (error) {
            console.error('Error loading profile:', error);
            // Fallback to user data
            setProfileData(prev => ({
                ...prev,
                name: user.name || '',
                email: user.email || '',
                phone: user.phone || ''
            }));
        }
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        if (name === 'jobCategory') {
            setProfileData(prev => ({
                ...prev,
                jobCategory: value,
                jobSubCategory: '',
            }));
            return;
        }
        setProfileData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const openAddExperienceModal = () => {
        setExperienceForm(emptyExperienceEntry());
        setExperienceEditId(null);
        setExperienceFormError('');
        setExperienceModalOpen(true);
    };

    const openEditExperienceModal = (entry) => {
        setExperienceForm({ ...entry });
        setExperienceEditId(entry.id);
        setExperienceFormError('');
        setExperienceModalOpen(true);
    };

    const closeExperienceModal = () => {
        setExperienceModalOpen(false);
        setExperienceForm(emptyExperienceEntry());
        setExperienceEditId(null);
        setExperienceFormError('');
    };

    const updateExperienceFormField = (field, value) => {
        setExperienceForm((prev) => {
            const next = { ...prev, [field]: value };
            if (field === 'currentlyWorking' && value) {
                next.endMonth = '';
                next.endYear = '';
            }
            return next;
        });
        if (experienceFormError) setExperienceFormError('');
    };

    const validateExperienceForm = () => {
        if (!String(experienceForm.jobTitle || '').trim()) {
            return 'Job title is required.';
        }
        if (!String(experienceForm.company || '').trim()) {
            return 'Company / organization is required.';
        }
        if (!String(experienceForm.startYear || '').trim()) {
            return 'Start year is required.';
        }
        if (!String(experienceForm.startMonth || '').trim()) {
            return 'Start month is required.';
        }
        if (!experienceForm.currentlyWorking) {
            if (!String(experienceForm.endYear || '').trim()) {
                return 'End year is required when not currently working.';
            }
            if (!String(experienceForm.endMonth || '').trim()) {
                return 'End month is required when not currently working.';
            }
        }
        return '';
    };

    const persistProfileData = async (dataToSave, { successMessage = 'Profile updated successfully!' } = {}) => {
        setLoading(true);
        clearProfileMessage();

        try {
            const validation = validateMandatoryProfileFields(dataToSave);
            if (!validation.valid) {
                showProfileMessage(validation.message, 4000);
                return { ok: false };
            }

            const { resolvedName, resolvedEmail, resolvedPhone } = getResolvedRequiredFields(dataToSave);

            const token = localStorage.getItem('token');
            if (!token) {
                showProfileMessage('Please login to update profile', 4000);
                return { ok: false };
            }

            const formData = new FormData();
            appendProfileFieldsToFormData(formData, dataToSave, { resolvedName, resolvedEmail, resolvedPhone });

            if (dataToSave.profilePicture) {
                formData.append('profilePicture', dataToSave.profilePicture);
            }

            if (dataToSave.resume instanceof File) {
                formData.append('resume', dataToSave.resume);
            }

            const response = await fetch(`${API_BASE_URL}/api/profile`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`
                },
                body: formData
            });

            if (response.ok) {
                const result = await response.json();

                const categoriesSaved = await saveJobCategories(token, dataToSave);
                if (!categoriesSaved) {
                    return { ok: false };
                }

                showProfileMessage(successMessage, 3000);

                if (result.profile) {
                    revokeProfilePreviewBlob();
                    setProfileData((prev) => ({
                        ...prev,
                        ...mapApiProfileToFormState(result.profile),
                    }));
                } else {
                    setProfileData((prev) => ({
                        ...prev,
                        dateOfBirth: formatDateForInput(dataToSave.dateOfBirth),
                        preferredJobRole: String(dataToSave.preferredJobRole ?? '').trim(),
                        preferredLocation: String(dataToSave.preferredLocation ?? '').trim(),
                        gender: dataToSave.gender,
                    }));
                }

                if (result.profilePicture) {
                    const fullProfilePictureUrl = result.profilePicture.startsWith('http')
                        ? result.profilePicture
                        : `${API_BASE_URL}${result.profilePicture}`;
                    setProfileData(prev => ({
                        ...prev,
                        profilePictureUrl: fullProfilePictureUrl,
                        profilePicture: null
                    }));
                    localStorage.setItem('userProfilePicture', fullProfilePictureUrl);
                }
                setProfilePictureName('');

                const tokenRefetch = localStorage.getItem('token');
                if (tokenRefetch) {
                    await loadProfileData(tokenRefetch);
                    await loadLocalProfileData();
                }
                return { ok: true, result };
            }

            const errorData = await response.json();
            showProfileMessage(errorData.message || 'Failed to update profile. Please try again.', 5000);
            return { ok: false };
        } catch (error) {
            console.error('Error updating profile:', error);
            showProfileMessage('Failed to update profile. Please try again.', 5000);
            return { ok: false };
        } finally {
            setLoading(false);
        }
    };

    const saveExperienceEntry = async () => {
        const validationError = validateExperienceForm();
        if (validationError) {
            setExperienceFormError(validationError);
            return;
        }

        const normalizedEntry = {
            ...experienceForm,
            jobTitle: String(experienceForm.jobTitle).trim(),
            company: String(experienceForm.company).trim(),
            employmentType: experienceForm.employmentType || '',
            currentlyWorking: Boolean(experienceForm.currentlyWorking),
            startMonth: experienceForm.startMonth || '',
            startYear: String(experienceForm.startYear || ''),
            endMonth: experienceForm.currentlyWorking ? '' : (experienceForm.endMonth || ''),
            endYear: experienceForm.currentlyWorking ? '' : String(experienceForm.endYear || ''),
            location: String(experienceForm.location || '').trim(),
            locationType: experienceForm.locationType || '',
            description: String(experienceForm.description || '').trim(),
        };

        const existing = Array.isArray(profileData.experience) ? profileData.experience : [];
        const updatedExperience = experienceEditId
            ? existing.map((item) =>
                item.id === experienceEditId ? { ...normalizedEntry, id: experienceEditId } : item
            )
            : [...existing, normalizedEntry];

        if (experienceEditId) {
            const updatedProfileData = {
                ...profileData,
                experience: updatedExperience,
            };
            const { ok } = await persistProfileData(updatedProfileData, {
                successMessage: 'Experience updated successfully!',
            });
            if (!ok) return;
            closeExperienceModal();
            return;
        }

        setProfileData((prev) => ({
            ...prev,
            experience: updatedExperience,
        }));

        closeExperienceModal();
    };

    const toggleEducationAddForm = () => {
        if (educationAddFormOpen) {
            closeEducationAddForm();
            return;
        }
        setEducationForm(emptyEducationEntry());
        setEducationEditId(null);
        setEducationFormError('');
        setEducationAddFormOpen(true);
    };

    const closeEducationAddForm = () => {
        setEducationAddFormOpen(false);
        setEducationForm(emptyEducationEntry());
        setEducationFormError('');
    };

    const openEditEducationModal = (entry) => {
        setEducationAddFormOpen(false);
        setEducationForm({
            ...entry,
            courseType: entry.courseType || 'full-time',
            marks: entry.marks || '',
        });
        setEducationEditId(entry.id);
        setEducationFormError('');
        setEducationModalOpen(true);
    };

    const closeEducationModal = () => {
        setEducationModalOpen(false);
        setEducationForm(emptyEducationEntry());
        setEducationEditId(null);
        setEducationFormError('');
    };

    const updateEducationFormField = (field, value) => {
        setEducationForm((prev) => ({ ...prev, [field]: value }));
        if (educationFormError) setEducationFormError('');
    };

    const validateEducationForm = () => {
        if (!String(educationForm.instituteName || '').trim()) {
            return 'Institute name is required.';
        }
        if (!String(educationForm.degree || '').trim()) {
            return 'Degree is required.';
        }
        if (!String(educationForm.courseType || '').trim()) {
            return 'Course type is required.';
        }
        if (!String(educationForm.startYear || '').trim()) {
            return 'Start year is required.';
        }
        if (!String(educationForm.endYear || '').trim()) {
            return 'End year is required.';
        }
        return '';
    };

    const normalizeEducationEntry = () => ({
        id: educationForm.id,
        instituteName: String(educationForm.instituteName).trim(),
        degree: String(educationForm.degree).trim(),
        courseType: String(educationForm.courseType || 'full-time'),
        marks: String(educationForm.marks || '').trim(),
        startYear: String(educationForm.startYear || ''),
        endYear: String(educationForm.endYear || ''),
    });

    const saveEducationFromAddForm = () => {
        const validationError = validateEducationForm();
        if (validationError) {
            setEducationFormError(validationError);
            return;
        }

        const normalizedEntry = normalizeEducationEntry();
        const existing = Array.isArray(profileData.education) ? profileData.education : [];

        setProfileData((prev) => ({
            ...prev,
            education: [...existing, normalizedEntry],
        }));

        closeEducationAddForm();
    };

    const saveEducationFromModal = async () => {
        const validationError = validateEducationForm();
        if (validationError) {
            setEducationFormError(validationError);
            return;
        }

        if (!educationEditId) return;

        const normalizedEntry = {
            ...normalizeEducationEntry(),
            id: educationEditId,
        };

        const existing = Array.isArray(profileData.education) ? profileData.education : [];
        const updatedEducation = existing.map((item) =>
            item.id === educationEditId ? normalizedEntry : item
        );

        const updatedProfileData = {
            ...profileData,
            education: updatedEducation,
        };

        const { ok } = await persistProfileData(updatedProfileData, {
            successMessage: 'Education updated successfully!',
        });
        if (!ok) return;
        closeEducationModal();
    };

    const toggleCertificationAddForm = () => {
        if (certificationAddFormOpen) {
            closeCertificationAddForm();
            return;
        }
        setCertificationForm(emptyCertificationEntry());
        setCertificationEditId(null);
        setCertificationFormError('');
        setCertificationAddFormOpen(true);
    };

    const closeCertificationAddForm = () => {
        setCertificationAddFormOpen(false);
        setCertificationForm(emptyCertificationEntry());
        setCertificationFormError('');
    };

    const openEditCertificationModal = (entry) => {
        setCertificationAddFormOpen(false);
        setCertificationForm({ ...entry });
        setCertificationEditId(entry.id);
        setCertificationFormError('');
        setCertificationModalOpen(true);
    };

    const closeCertificationModal = () => {
        setCertificationModalOpen(false);
        setCertificationForm(emptyCertificationEntry());
        setCertificationEditId(null);
        setCertificationFormError('');
    };

    const updateCertificationFormField = (field, value) => {
        setCertificationForm((prev) => {
            const next = { ...prev, [field]: value };
            if (field === 'noExpiration' && value) {
                next.expirationMonth = '';
                next.expirationYear = '';
            }
            return next;
        });
        if (certificationFormError) setCertificationFormError('');
    };

    const validateCertificationForm = () => {
        if (!String(certificationForm.name || '').trim()) {
            return 'Certification name is required.';
        }
        if (!String(certificationForm.issuingOrganization || '').trim()) {
            return 'Issuing organization is required.';
        }
        return '';
    };

    const normalizeCertificationEntry = () => ({
        ...certificationForm,
        name: String(certificationForm.name).trim(),
        issuingOrganization: String(certificationForm.issuingOrganization).trim(),
        issueMonth: certificationForm.issueMonth || '',
        issueYear: String(certificationForm.issueYear || ''),
        noExpiration: Boolean(certificationForm.noExpiration),
        expirationMonth: certificationForm.noExpiration ? '' : (certificationForm.expirationMonth || ''),
        expirationYear: certificationForm.noExpiration ? '' : String(certificationForm.expirationYear || ''),
        credentialUrl: String(certificationForm.credentialUrl || '').trim(),
    });

    const saveCertificationFromAddForm = () => {
        const validationError = validateCertificationForm();
        if (validationError) {
            setCertificationFormError(validationError);
            return;
        }

        const normalizedEntry = normalizeCertificationEntry();
        const existing = Array.isArray(profileData.certifications) ? profileData.certifications : [];

        setProfileData((prev) => ({
            ...prev,
            certifications: [...existing, normalizedEntry],
        }));

        closeCertificationAddForm();
    };

    const saveCertificationFromModal = async () => {
        const validationError = validateCertificationForm();
        if (validationError) {
            setCertificationFormError(validationError);
            return;
        }

        if (!certificationEditId) return;

        const normalizedEntry = {
            ...normalizeCertificationEntry(),
            id: certificationEditId,
        };

        const existing = Array.isArray(profileData.certifications) ? profileData.certifications : [];
        const updatedCertifications = existing.map((item) =>
            item.id === certificationEditId ? normalizedEntry : item
        );

        const updatedProfileData = {
            ...profileData,
            certifications: updatedCertifications,
        };

        const { ok } = await persistProfileData(updatedProfileData, {
            successMessage: 'Certification updated successfully!',
        });
        if (!ok) return;
        closeCertificationModal();
    };

    const toggleExperienceDescription = (entryId) => {
        setExpandedExperienceIds((prev) => {
            const next = new Set(prev);
            if (next.has(entryId)) next.delete(entryId);
            else next.add(entryId);
            return next;
        });
    };

    const autoUpdateProfilePicture = async (file) => {
        if (!file) return;

        setLoading(true);
        clearProfileMessage();

        try {
            const validation = validateMandatoryProfileFields();
            if (!validation.valid) {
                showProfileMessage(validation.message, 4000);
                setLoading(false);
                return;
            }

            const { resolvedName, resolvedEmail, resolvedPhone } = getResolvedRequiredFields();

            const token = localStorage.getItem('token');
            if (!token) {
                showProfileMessage('Please login to update profile', 4000);
                setLoading(false);
                return;
            }

            const buildPictureFormData = () => {
                const fd = new FormData();
                appendProfileFieldsToFormData(fd, profileData, { resolvedName, resolvedEmail, resolvedPhone });
                fd.append('profilePicture', file);
                return fd;
            };

            const doPut = () => fetch(`${API_BASE_URL}/api/profile`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`
                },
                body: buildPictureFormData()
            });

            let response;
            try {
                response = await doPut();
            } catch (firstErr) {
                await new Promise((r) => setTimeout(r, 750));
                response = await doPut();
            }

            if (response.ok) {
                const result = await response.json();
                showProfileMessage('Profile picture updated successfully!', 3000);
                revokeProfilePreviewBlob();

                if (result.profile) {
                    const mapped = mapApiProfileToFormState(result.profile);
                    setProfileData(mapped);
                    if (mapped.profilePictureUrl) {
                        localStorage.setItem('userProfilePicture', mapped.profilePictureUrl);
                    }
                } else if (result.profilePicture) {
                    const fullProfilePictureUrl = result.profilePicture.startsWith('http')
                        ? result.profilePicture
                        : `${API_BASE_URL}${result.profilePicture}`;

                    setProfileData(prev => ({
                        ...prev,
                        profilePictureUrl: fullProfilePictureUrl,
                        profilePicture: null
                    }));
                    localStorage.setItem('userProfilePicture', fullProfilePictureUrl);
                }

                setProfilePictureName('');

                const tokenRefetch = localStorage.getItem('token');
                if (tokenRefetch) {
                    await loadProfileData(tokenRefetch);
                }
            } else {
                let errorMessage = 'Failed to update profile picture. Please try again.';
                try {
                    const errorData = await response.json();
                    errorMessage = errorData.message || errorMessage;
                } catch (error) {
                    console.log('Failed to parse profile picture update error response', error);
                }
                showProfileMessage(errorMessage, 5000);
            }
        } catch (error) {
            console.error('Error updating profile picture:', error);
            showProfileMessage('Failed to update profile picture. Please try again.', 5000);
        } finally {
            setLoading(false);
            if (profilePictureInputRef.current) {
                profilePictureInputRef.current.value = '';
            }
        }
    };

    const handleFileUpload = (e) => {
        const file = e.target.files[0];
        console.log('File selected:', file);
        if (!file) {
            setProfilePictureName('');
            revokeProfilePreviewBlob();
            setProfileData(prev => ({
                ...prev,
                profilePicture: null,
                profilePictureUrl: prev.profilePictureUrl?.startsWith?.('blob:')
                    ? (localStorage.getItem('userProfilePicture') || '')
                    : prev.profilePictureUrl
            }));
            return;
        }
        // Validate file type
        if (!file.type.startsWith('image/')) {
            showProfileMessage('Please select a valid image file', 4000);
            return;
        }

        // Validate file size (max 5MB)
        if (file.size > 5 * 1024 * 1024) {
            showProfileMessage('File size must be less than 5MB', 4000);
            return;
        }

        console.log('File validation passed, creating preview');
        setProfilePictureName(file.name);
        revokeProfilePreviewBlob();
        const objectUrl = URL.createObjectURL(file);
        profilePreviewBlobUrlRef.current = objectUrl;
        setProfileData(prev => ({
            ...prev,
            profilePicture: file,
            profilePictureUrl: objectUrl
        }));

        autoUpdateProfilePicture(file);
    };

    const processResumeFile = (file) => {
        if (!file) {
            setProfileData(prev => ({
                ...prev,
                resume: ''
            }));
            setResumeUploadProgress(0);
            setIsResumeUploading(false);
            return;
        }

        const allowedTypes = [
            'application/pdf',
            'application/msword',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
        ];
        const allowedExtensions = ['.pdf', '.doc', '.docx'];
        const lowerName = file.name.toLowerCase();
        const hasValidExtension = allowedExtensions.some(ext => lowerName.endsWith(ext));

        if (!allowedTypes.includes(file.type) && !hasValidExtension) {
            showProfileMessage('Please select a valid PDF or Word file', 4000);
            return;
        }

        if (file.size > 5 * 1024 * 1024) {
            showProfileMessage('CV file size must be less than 5MB', 4000);
            return;
        }

        setIsResumeUploading(true);
        setResumeUploadProgress(0);
        let progress = 0;
        const progressTimer = setInterval(() => {
            progress += 20;
            setResumeUploadProgress(progress);
            if (progress >= 100) {
                clearInterval(progressTimer);
                setIsResumeUploading(false);
            }
        }, 90);

        setProfileData(prev => ({
            ...prev,
            resume: file
        }));
    };

    const handleResumeUpload = (e) => {
        const file = e.target.files[0];
        processResumeFile(file);
    };

    const handleResumeDrop = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setIsResumeDragOver(false);
        const file = e.dataTransfer?.files?.[0];
        processResumeFile(file);
    };

    const clearSelectedResume = (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (resumeInputRef.current) {
            resumeInputRef.current.value = '';
        }
        setProfileData(prev => ({
            ...prev,
            resume: ''
        }));
        setResumeUploadProgress(0);
        setIsResumeUploading(false);
    };

    const handleUpdate = async (e) => {
        e.preventDefault();
        if (!hasUnsavedProfileChanges(profileData)) {
            showProfileMessage('No Changes Detected !', 4000);
            return;
        }
        await persistProfileData(profileData);
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

    const resolvedProfileImage = (() => {
        const url = profileData.profilePictureUrl;
        if (!url) return "/assets/img/user-profile.png";
        if (
            url.startsWith('http://') ||
            url.startsWith('https://') ||
            url.startsWith('data:') ||
            url.startsWith('blob:')
        ) {
            return url;
        }
        const path = url.startsWith('/') ? url : `/${url}`;
        return `${API_BASE_URL}${path}`;
    })();

    const resolvedResumeUrl = profileData.resume
        ? (profileData.resume instanceof File
            ? ""
            : profileData.resume.startsWith('http')
                ? profileData.resume
                : `${API_BASE_URL}${profileData.resume.startsWith('/') ? profileData.resume : `/${profileData.resume}`}`)
        : "";

    const skillChips = String(profileData.skills || '')
        .split(',')
        .map((item) => item.trim())
        .filter(Boolean);

    const experienceEntries = sortExperienceLatestFirst(
        Array.isArray(profileData.experience) ? profileData.experience : []
    );

    const educationEntries = sortEducationLatestFirst(
        Array.isArray(profileData.education) ? profileData.education : []
    );

    const certificationEntries = sortCertificationLatestFirst(
        Array.isArray(profileData.certifications) ? profileData.certifications : []
    );

    const experienceMetaStyle = {
        margin: '0 0 6px',
        fontSize: '13px',
        color: '#94a3b8',
        fontWeight: 500,
        lineHeight: 1.45,
    };

    // ---- Profile completion tracker --------------------------------------
    // Scroll-to-section helper used by the checklist items.
    const scrollToSection = (id) => {
        const el = document.getElementById(id);
        if (el) {
            el.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    };

    const hasResume = !!profileData.resume; // File object or saved path
    const hasProfilePicture = !!(profileData.profilePicture || profileData.profilePictureUrl);
    const hasSocial = !!(
        String(profileData.linkedin || '').trim() ||
        String(profileData.google || '').trim() ||
        String(profileData.facebook || '').trim() ||
        String(profileData.twitter || '').trim()
    );
    const isFilled = (v) => String(v ?? '').trim() !== '';

    // Each item contributes equally to the percentage. `section` drives the
    // "what's missing" checklist links/scroll targets.
    const completionItems = [
        { key: 'photo', label: 'Add a profile photo', done: hasProfilePicture, section: 'section-personal' },
        { key: 'name', label: 'Add your full name', done: isFilled(profileData.name), section: 'section-personal' },
        { key: 'email', label: 'Add your email', done: isFilled(profileData.email), section: 'section-personal' },
        { key: 'phone', label: 'Add your phone number', done: isFilled(profileData.phone), section: 'section-personal' },
        { key: 'address', label: 'Add your location', done: isFilled(profileData.address), section: 'section-personal' },
        { key: 'gender', label: 'Select your gender', done: isFilled(profileData.gender), section: 'section-personal' },
        { key: 'dob', label: 'Add your date of birth', done: isFilled(profileData.dateOfBirth), section: 'section-personal' },
        { key: 'resume', label: 'Upload your resume', done: hasResume, section: 'section-resume' },
        { key: 'role', label: 'Add your preferred job role', done: isFilled(profileData.preferredJobRole), section: 'section-professional' },
        { key: 'bio', label: 'Write a short bio', done: isFilled(profileData.bio), section: 'section-professional' },
        { key: 'skills', label: 'Add your skills', done: skillChips.length > 0, section: 'section-skills' },
        { key: 'experience', label: 'Add your experience', done: Array.isArray(profileData.experience) && profileData.experience.length > 0, section: 'section-experience' },
        { key: 'education', label: 'Add your education', done: Array.isArray(profileData.education) && profileData.education.length > 0, section: 'section-education' },
        { key: 'social', label: 'Link a social/portfolio profile', done: hasSocial, section: 'section-social' },
    ];

    const completedCount = completionItems.filter((i) => i.done).length;
    const completionPercent = Math.round((completedCount / completionItems.length) * 100);
    const missingItems = completionItems.filter((i) => !i.done);

    const sectionCardStyle = {
        background: '#ffffff',
        borderRadius: '16px',
        padding: '24px',
        boxShadow: THEME.cardShadow,
        border: `1px solid ${THEME.cardBorder}`,
        marginBottom: '22px',
        position: 'relative',
        overflow: 'hidden'
    };

    const sectionHeadIconStyle = {
        width: '44px',
        height: '44px',
        borderRadius: '12px',
        background: THEME.greenSoft,
        color: THEME.green,
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '20px',
        flexShrink: 0
    };

    const sectionTitleStyle = {
        margin: 0,
        fontSize: '28px',
        fontWeight: '800',
        color: '#0f172a'
    };

    const sectionSubtitleStyle = {
        margin: '4px 0 0',
        fontSize: '14px',
        color: '#64748b'
    };

    const labelStyle = {
        display: 'block',
        marginBottom: '8px',
        fontSize: '14px',
        fontWeight: '600',
        color: '#334e6f'
    };

    const inputStyle = {
        borderRadius: '10px',
        border: '1px solid #cbd5e1',
        padding: '12px 15px',
        fontSize: '14px',
        color: '#1e293b',
        transition: 'all 0.3s',
        boxShadow: 'none'
    };

    const inputFocus = (e) => {
        e.target.style.borderColor = THEME.green;
        e.target.style.boxShadow = '0 0 0 3px rgba(22,163,74,0.12)';
    };

    const inputBlur = (e) => {
        e.target.style.borderColor = '#cbd5e1';
        e.target.style.boxShadow = 'none';
    };

    if (!user) {
        return (
            <div className="container" style={{ padding: '50px', textAlign: 'center' }}>
                <h2>Please login to access profile</h2>
                <button onClick={() => navigate('/')} className="btn btn-primary">Go to Home</button>
            </div>
        );
    }

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

                    @media (max-width: 991px) {
                        .candidate-dashboard-sidebar {
                            display: none !important;
                        }
                        .candidate-dashboard-main {
                            width: 100% !important;
                            max-width: 100% !important;
                            float: none !important;
                        }
                        .candidate-profile-main {
                            margin-top: 0;
                        }
                    }

                    .candidate-profile-main .form-control {
                        color: #1e293b;
                    }
                    .candidate-profile-main .form-control::placeholder {
                        color: #b8c4d0;
                        opacity: 1;
                    }
                    .candidate-profile-main .form-control::-webkit-input-placeholder {
                        color: #b8c4d0;
                        opacity: 1;
                    }
                    .candidate-profile-main .form-control::-moz-placeholder {
                        color: #b8c4d0;
                        opacity: 1;
                    }
                    .candidate-profile-main .form-control:-ms-input-placeholder {
                        color: #b8c4d0;
                        opacity: 1;
                    }
                    .candidate-profile-main select.form-control option[value=""] {
                        color: #b8c4d0;
                    }

                    @media (max-width: 767px) {
                        .candidate-profile-section {
                            padding: 18px !important;
                            border-radius: 14px !important;
                            margin-bottom: 16px !important;
                        }

                        .candidate-profile-section-title {
                            font-size: 22px !important;
                            line-height: 1.2 !important;
                        }

                        .candidate-profile-section-subtitle {
                            font-size: 13px !important;
                            line-height: 1.6 !important;
                        }

                        .candidate-profile-topbar {
                            flex-direction: column !important;
                            align-items: stretch !important;
                        }

                        .candidate-profile-cv-actions {
                            width: 100%;
                        }

                        .candidate-profile-cv-button {
                            width: 100% !important;
                            justify-content: center !important;
                        }

                        .candidate-profile-avatar-wrap {
                            margin-bottom: 22px !important;
                        }
                    }

                    @media (max-width: 480px) {
                        .candidate-profile-section {
                            padding: 14px !important;
                        }

                        .candidate-profile-section-title {
                            font-size: 20px !important;
                        }
                    }

                    .candidate-checklist {
                        display: grid;
                        grid-template-columns: repeat(2, minmax(0, 1fr));
                        gap: 10px;
                    }
                    @media (max-width: 575px) {
                        .candidate-checklist {
                            grid-template-columns: 1fr;
                        }
                        .candidate-profile-section .row > [class*="col-"] {
                            width: 100%;
                            flex: 0 0 100%;
                            max-width: 100%;
                        }
                    }
                    .candidate-checklist-item {
                        background: #fff;
                        border: 1px solid rgba(148,163,184,0.18);
                        border-radius: 12px;
                        padding: 10px 12px;
                        display: flex;
                        align-items: center;
                        gap: 9px;
                        cursor: pointer;
                        font-size: 13px;
                        font-weight: 600;
                        color: #475569;
                        transition: all 0.2s ease;
                        text-align: left;
                        width: 100%;
                    }
                    .candidate-checklist-item:hover {
                        border-color: #16a34a;
                        color: #16a34a;
                        transform: translateX(3px);
                        box-shadow: 0 4px 14px rgba(22,163,74,0.12);
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
            {/* ================ Profile Settings ======================= */}
            <section className="padd-top-80 padd-bot-80" style={{ background: `linear-gradient(180deg, ${THEME.pageBg} 0%, #f8fafc 100%)` }}>
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
                                        src={resolvedProfileImage}
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
                                            console.log('Profile image error, using default');
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
                                        {profileData.name || user.fullName}
                                    </span>
                                </div>
                            </div>
                            <div className="dashboard_nav_item">
                                <ul>
                                    <li>
                                        <a href="#" onClick={(e) => { e.preventDefault(); navigate('/'); }}>
                                            <i className="login-icon ti-dashboard" /> Home
                                        </a>
                                    </li>
                                    <li className="active">
                                        <a href="#" onClick={(e) => e.preventDefault()}>
                                            <i className="login-icon ti-user" /> Edit Profile
                                        </a>
                                    </li>
                                    <li>
                                        <a href="#" onClick={(e) => { e.preventDefault(); navigate('/candidate/applied-jobs'); }}>
                                            <i className="login-icon ti-clipboard" /> Applied Jobs
                                        </a>
                                    </li>
                                    <li>
                                        <a href="#" onClick={(e) => { e.preventDefault(); navigate('/candidate/create-resume'); }}>
                                            <i className="login-icon ti-file" style={{ display: 'inline-block', marginRight: '8px' }}></i> Create Resume
                                        </a>
                                    </li>
                                    <li>
                                        <a href="#" onClick={(e) => { e.preventDefault(); navigate('/candidate/change-password'); }}>
                                            <i className="login-icon ti-key" /> Change Password
                                        </a>
                                    </li>
                                    <li>
                                        <a href="#" onClick={(e) => { e.preventDefault(); navigate('/candidate/chat'); }}>
                                            <i className="login-icon ti-comments" /> Chat Inbox
                                        </a>
                                    </li>
                                    <li>
                                        <a href="#" onClick={(e) => { e.preventDefault(); navigate('/candidate/wishlist'); }}>
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
                            <CandidateSidebar activePage="profile" />
                        </div>

                        <div className="col-md-9 candidate-profile-main candidate-dashboard-main">
                            <div className="profile_detail_block" style={{ background: 'transparent', padding: 0, boxShadow: 'none' }}>
                                {/* ===== "What's missing" checklist ===== */}
                                {missingItems.length > 0 && (
                                    <motion.div
                                        style={{ ...sectionCardStyle, marginBottom: '24px' }}
                                        initial={{ opacity: 0, y: 18 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ duration: 0.5, delay: 0.15, ease: 'easeOut' }}
                                    >
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                                            <span style={sectionHeadIconStyle}><FiCheckCircle /></span>
                                            <div>
                                                <h3 style={{ ...sectionTitleStyle, fontSize: '20px' }}>Finish your profile</h3>
                                                <p style={{ ...sectionSubtitleStyle }}>
                                                    {completedCount} of {completionItems.length} done · {missingItems.length} item{missingItems.length > 1 ? 's' : ''} left
                                                </p>
                                            </div>
                                        </div>
                                        <div className="candidate-checklist">
                                            {missingItems.map((item) => (
                                                <button
                                                    type="button"
                                                    key={item.key}
                                                    className="candidate-checklist-item"
                                                    onClick={() => scrollToSection(item.section)}
                                                >
                                                    <FiArrowRight style={{ color: THEME.green, flexShrink: 0 }} />
                                                    <span>{item.label}</span>
                                                </button>
                                            ))}
                                        </div>
                                    </motion.div>
                                )}

                                <form onSubmit={handleUpdate} noValidate>
                                    <RevealCard id="section-personal" className="candidate-profile-section" style={sectionCardStyle}>
                                        <div className="candidate-profile-topbar" style={{ display: 'flex', justifyContent: 'space-between', gap: '16px', alignItems: 'flex-start', flexWrap: 'wrap', marginBottom: '24px' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                                <span style={sectionHeadIconStyle}><FiUser /></span>
                                                <div>
                                                    <h2 className="candidate-profile-section-title" style={sectionTitleStyle}>Personal Information</h2>
                                                    <p className="candidate-profile-section-subtitle" style={sectionSubtitleStyle}>These details power your public profile and application cards.</p>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="candidate-profile-avatar-wrap" style={{
                                            display: 'flex',
                                            flexDirection: 'column',
                                            alignItems: 'center',
                                            marginBottom: '30px'
                                        }}>
                                            <div
                                                style={{
                                                    position: 'relative',
                                                    display: 'inline-block',
                                                    cursor: 'pointer'
                                                }}
                                                onClick={() => profilePictureInputRef.current?.click()}
                                            >
                                                <ProfileAvatarRing
                                                    value={completionPercent}
                                                    imageSrc={resolvedProfileImage}
                                                    size={120}
                                                    stroke={3}
                                                />
                                                <div style={{
                                                    position: 'absolute',
                                                    top: '88px',
                                                    right: '2px',
                                                    width: '36px',
                                                    height: '36px',
                                                    borderRadius: '50%',
                                                    background: THEME.gradient,
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    boxShadow: '0 2px 8px rgba(22, 163, 74, 0.35)',
                                                    border: '3px solid #fff',
                                                    zIndex: 4
                                                }}>
                                                    <i className="ti-pencil" style={{
                                                        color: '#fff',
                                                        fontSize: '16px'
                                                    }}></i>
                                                </div>
                                            </div>
                                            <input
                                                ref={profilePictureInputRef}
                                                type="file"
                                                accept="image/*"
                                                style={{ display: 'none' }}
                                                onChange={handleFileUpload}
                                            />
                                        </div>

                                        <div className="row">
                                            <div className="col-md-4 col-sm-6 col-xs-12">
                                                <div className="form-group" style={{ marginBottom: '20px' }}>
                                                    <label style={labelStyle}>Full name *</label>
                                                    <input type="text" name="name" className="form-control" placeholder="Enter your full name" value={profileData.name} onChange={handleInputChange} required style={inputStyle} onFocus={inputFocus} onBlur={inputBlur} />
                                                </div>
                                            </div>
                                            <div className="col-md-4 col-sm-6 col-xs-12">
                                                <div className="form-group" style={{ marginBottom: '20px' }}>
                                                    <label style={labelStyle}>Email address *</label>
                                                    <input type="email" name="email" className="form-control" placeholder="mail@example.com" value={profileData.email} onChange={handleInputChange} required style={inputStyle} onFocus={inputFocus} onBlur={inputBlur} />
                                                </div>
                                            </div>
                                            <div className="col-md-4 col-sm-6 col-xs-12">
                                                <div className="form-group" style={{ marginBottom: '20px' }}>
                                                    <label style={labelStyle}>Phone *</label>
                                                    <input type="tel" name="phone" className="form-control" placeholder="+123 456 7890" value={profileData.phone} onChange={handleInputChange} required style={inputStyle} onFocus={inputFocus} onBlur={inputBlur} />
                                                </div>
                                            </div>
                                            <div className="col-md-4 col-sm-6 col-xs-12">
                                                <div className="form-group" style={{ marginBottom: '20px' }}>
                                                    <label style={labelStyle}>Primary location</label>
                                                    <input type="text" name="address" className="form-control" placeholder="Enter your address" value={profileData.address} onChange={handleInputChange} style={inputStyle} onFocus={inputFocus} onBlur={inputBlur} />
                                                </div>
                                            </div>
                                            <div className="col-md-4 col-sm-6 col-xs-12">
                                                <div className="form-group" style={{ marginBottom: '20px' }}>
                                                    <label style={labelStyle}>Gender *</label>
                                                    <select name="gender" className="wide form-control" value={profileData.gender} onChange={handleInputChange} required style={{ ...inputStyle, backgroundColor: '#fff' }} onFocus={inputFocus} onBlur={inputBlur}>
                                                        <option value="">Select Gender</option>
                                                        <option value="male">Male</option>
                                                        <option value="female">Female</option>
                                                        <option value="other">Other</option>
                                                    </select>
                                                </div>
                                            </div>
                                            <div className="col-md-4 col-sm-6 col-xs-12">
                                                <div className="form-group" style={{ marginBottom: '20px' }}>
                                                    <label style={labelStyle}>Date of birth *</label>
                                                    <input type="date" name="dateOfBirth" className="form-control" value={profileData.dateOfBirth} onChange={handleInputChange} required max={maxDateOfBirth} style={inputStyle} onFocus={inputFocus} onBlur={inputBlur} />
                                                </div>
                                            </div>
                                        </div>
                                    </RevealCard>

                                    <RevealCard id="section-resume" delay={0.05} className="candidate-profile-section" style={sectionCardStyle}>
                                        <div style={{ marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px', flexWrap: 'wrap' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                                <span style={sectionHeadIconStyle}><FiFileText /></span>
                                                <h3 className="candidate-profile-section-title" style={{ ...sectionTitleStyle, fontSize: '26px' }}>Resume & CV</h3>
                                            </div>
                                            <button
                                                type="button"
                                                className="candidate-profile-cv-button"
                                                onClick={() => {
                                                    if (resolvedResumeUrl) {
                                                        window.open(resolvedResumeUrl, '_blank', 'noopener,noreferrer');
                                                    }
                                                }}
                                                disabled={!resolvedResumeUrl}
                                                style={{
                                                    display: 'inline-flex',
                                                    alignItems: 'center',
                                                    gap: '8px',
                                                    padding: '10px 16px',
                                                    borderRadius: '10px',
                                                    border: '1px solid #16a34a',
                                                    color: resolvedResumeUrl ? '#16a34a' : '#94a3b8',
                                                    background: '#fff',
                                                    fontWeight: '600',
                                                    cursor: resolvedResumeUrl ? 'pointer' : 'not-allowed',
                                                    opacity: resolvedResumeUrl ? 1 : 0.7,
                                                    justifyContent: 'center'
                                                }}
                                            >
                                                <i className="ti-files" />
                                                View CV
                                            </button>
                                        </div>
                                        <p className="candidate-profile-section-subtitle" style={{ ...sectionSubtitleStyle, marginBottom: '16px' }}>Upload your latest resume and keep it ready for applications.</p>
                                        <input
                                            ref={resumeInputRef}
                                            type="file"
                                            accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                                            style={{ display: 'none' }}
                                            onChange={handleResumeUpload}
                                        />
                                        <div
                                            onClick={() => resumeInputRef.current?.click()}
                                            onDragOver={(e) => {
                                                e.preventDefault();
                                                e.stopPropagation();
                                                setIsResumeDragOver(true);
                                            }}
                                            onDragEnter={(e) => {
                                                e.preventDefault();
                                                e.stopPropagation();
                                                setIsResumeDragOver(true);
                                            }}
                                            onDragLeave={(e) => {
                                                e.preventDefault();
                                                e.stopPropagation();
                                                setIsResumeDragOver(false);
                                            }}
                                            onDrop={handleResumeDrop}
                                            style={{
                                                border: isResumeDragOver ? '2px dashed #16a34a' : '2px dashed #86efac',
                                                borderRadius: '16px',
                                                background: isResumeDragOver ? 'linear-gradient(135deg, #dcfce7 0%, #f0fdf4 100%)' : 'linear-gradient(135deg, #f0fdf4 0%, #f7fbf8 100%)',
                                                padding: '28px 18px',
                                                textAlign: 'center',
                                                cursor: 'pointer',
                                                transition: 'all 0.2s ease'
                                            }}
                                        >
                                            <div
                                                style={{
                                                    width: '62px',
                                                    height: '62px',
                                                    margin: '0 auto 12px',
                                                    borderRadius: '999px',
                                                    background: '#dcfce7',
                                                    color: '#16a34a',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    fontSize: '28px'
                                                }}
                                            >
                                                <i className="ti-cloud-up" />
                                            </div>
                                            <h4 style={{ margin: '0 0 8px', fontSize: '18px', fontWeight: 700, color: '#15803d' }}>Drag & drop your resume here</h4>
                                            <p style={{ margin: 0, fontSize: '13px', color: '#475569' }}>or click to browse PDF, DOC, DOCX files</p>
                                            {profileData.resume instanceof File && (
                                                <div style={{ marginTop: '14px' }}>
                                                    <div
                                                        style={{
                                                            border: '1px solid #bbf7d0',
                                                            borderRadius: '10px',
                                                            background: '#f0fdf4',
                                                            padding: '8px 10px',
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            justifyContent: 'space-between',
                                                            gap: '10px'
                                                        }}
                                                    >
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0 }}>
                                                            <i className="ti-file" style={{ color: '#16a34a', fontSize: '14px', flexShrink: 0 }} />
                                                            <span style={{ fontSize: '13px', color: '#1e293b', fontWeight: 600, wordBreak: 'break-word' }}>
                                                                {profileData.resume.name}
                                                            </span>
                                                        </div>
                                                        <button
                                                            type="button"
                                                            onClick={clearSelectedResume}
                                                            style={{
                                                                border: '1px solid #fecaca',
                                                                background: '#fff1f2',
                                                                color: '#dc2626',
                                                                fontSize: '11px',
                                                                padding: '3px 7px',
                                                                borderRadius: '999px',
                                                                lineHeight: 1.2,
                                                                cursor: 'pointer',
                                                                flexShrink: 0
                                                            }}
                                                        >
                                                            Unselect
                                                        </button>
                                                    </div>
                                                    <div style={{ marginTop: '8px', background: '#dcfce7', borderRadius: '999px', height: '8px', overflow: 'hidden' }}>
                                                        <div
                                                            style={{
                                                                height: '100%',
                                                                width: `${resumeUploadProgress}%`,
                                                                background: 'linear-gradient(90deg, #16a34a 0%, #0f766e 100%)',
                                                                transition: 'width 0.2s ease'
                                                            }}
                                                        />
                                                    </div>
                                                    <div style={{ marginTop: '6px', fontSize: '12px', color: '#334155' }}>
                                                        {isResumeUploading ? `Uploading... ${resumeUploadProgress}%` : 'Upload complete'}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </RevealCard>

                                    <RevealCard id="section-professional" delay={0.05} className="candidate-profile-section" style={sectionCardStyle}>
                                        <div style={{ marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                                            <span style={sectionHeadIconStyle}><FiBriefcase /></span>
                                            <div>
                                                <h3 className="candidate-profile-section-title" style={{ ...sectionTitleStyle, fontSize: '26px' }}>Professional Information</h3>
                                                <p className="candidate-profile-section-subtitle" style={sectionSubtitleStyle}>Add your headline, summary, resume and professional highlights.</p>
                                            </div>
                                        </div>
                                        <div className="row">
                                            <div className="col-md-6 col-sm-6 col-xs-12">
                                                <div className="form-group" style={{ marginBottom: '20px' }}>
                                                    <label style={labelStyle}>Job Category</label>
                                                    <select name="jobCategory" className="wide form-control" value={profileData.jobCategory} onChange={handleInputChange} disabled={jobCategoriesLoading} style={{ ...inputStyle, backgroundColor: '#fff' }} onFocus={inputFocus} onBlur={inputBlur}>
                                                        <option value="">{jobCategoriesLoading ? 'Loading categories...' : 'Select Category'}</option>
                                                        {jobCategories.map((cat) => (
                                                            <option key={cat.id} value={cat.name}>{cat.name}</option>
                                                        ))}
                                                    </select>
                                                </div>
                                            </div>
                                            <div className="col-md-6 col-sm-6 col-xs-12">
                                                <div className="form-group" style={{ marginBottom: '20px' }}>
                                                    <label style={labelStyle}>Sub Category</label>
                                                    <select name="jobSubCategory" className="wide form-control" value={profileData.jobSubCategory} onChange={handleInputChange} disabled={!profileData.jobCategory || jobSubcategoriesLoading} style={{ ...inputStyle, backgroundColor: '#fff' }} onFocus={inputFocus} onBlur={inputBlur}>
                                                        <option value="">
                                                            {!profileData.jobCategory
                                                                ? 'Select Category First'
                                                                : jobSubcategoriesLoading
                                                                ? 'Loading subcategories...'
                                                                : 'Select Sub Category'}
                                                        </option>
                                                        {jobSubcategories.map((sub) => (
                                                            <option key={sub.id} value={sub.name}>{sub.name}</option>
                                                        ))}
                                                    </select>
                                                </div>
                                            </div>
                                            <div className="col-md-6 col-sm-6 col-xs-12">
                                                <div className="form-group" style={{ marginBottom: '20px' }}>
                                                    <label style={labelStyle}>Preferred Job Role *</label>
                                                    <input type="text" name="preferredJobRole" className="form-control" placeholder="Product Designer, Frontend Developer..." value={profileData.preferredJobRole} onChange={handleInputChange} required style={inputStyle} onFocus={inputFocus} onBlur={inputBlur} />
                                                </div>
                                            </div>
                                            <div className="col-md-6 col-sm-6 col-xs-12">
                                                <div className="form-group" style={{ marginBottom: '20px' }}>
                                                    <label style={labelStyle}>Languages</label>
                                                    <input type="text" name="languages" className="form-control" placeholder="English,Hindi, Odia " value={profileData.languages} onChange={handleInputChange} style={inputStyle} onFocus={inputFocus} onBlur={inputBlur} />
                                                </div>
                                            </div>
                                            <div className="col-md-12 col-sm-12 col-xs-12">
                                                <div className="form-group" style={{ marginBottom: '0' }}>
                                                    <label style={labelStyle}>About you</label>
                                                    <textarea name="bio" className="form-control" placeholder="Summarize your strengths, achievements, and what you are looking for next." value={profileData.bio} onChange={handleInputChange} rows={5} style={{ ...inputStyle, padding: '14px 15px', resize: 'vertical' }} onFocus={inputFocus} onBlur={inputBlur} />
                                                </div>
                                            </div>
                                        </div>
                                    </RevealCard>

                                    <RevealCard id="section-skills" delay={0.05} className="candidate-profile-section" style={sectionCardStyle}>
                                        <div style={{ marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                                            <span style={sectionHeadIconStyle}><FiZap /></span>
                                            <div>
                                                <h3 className="candidate-profile-section-title" style={{ ...sectionTitleStyle, fontSize: '26px' }}>Skills & Tools</h3>
                                                <p className="candidate-profile-section-subtitle" style={sectionSubtitleStyle}>Enter skills separated by commas. They will appear as chips.</p>
                                            </div>
                                        </div>
                                        <div className="form-group" style={{ marginBottom: '16px' }}>
                                            <label style={labelStyle}>Skills</label>
                                            <input type="text" name="skills" className="form-control" placeholder="React, Node.js, Figma, UX Research" value={profileData.skills} onChange={handleInputChange} style={inputStyle} onFocus={inputFocus} onBlur={inputBlur} />
                                        </div>
                                        {skillChips.length > 0 ? (
                                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
                                                {skillChips.map((skill) => (
                                                    <motion.span
                                                        key={skill}
                                                        initial={{ opacity: 0, scale: 0.85 }}
                                                        animate={{ opacity: 1, scale: 1 }}
                                                        transition={{ duration: 0.25 }}
                                                        style={{
                                                            display: 'inline-flex',
                                                            alignItems: 'center',
                                                            padding: '7px 12px',
                                                            borderRadius: '999px',
                                                            background: THEME.greenSoft,
                                                            color: THEME.greenDark,
                                                            fontSize: '13px',
                                                            fontWeight: '600',
                                                            border: '1px solid rgba(22,163,74,0.2)'
                                                        }}
                                                    >
                                                        {skill}
                                                    </motion.span>
                                                ))}
                                            </div>
                                        ) : null}
                                    </RevealCard>

                                    <RevealCard id="section-experience" delay={0.05} className="candidate-profile-section" style={sectionCardStyle}>
                                        <div style={{ marginBottom: '20px', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                                <span style={sectionHeadIconStyle}><FiBriefcase /></span>
                                                <div>
                                                    <h3 className="candidate-profile-section-title" style={{ ...sectionTitleStyle, fontSize: '26px' }}>Experience</h3>
                                                    <p className="candidate-profile-section-subtitle" style={sectionSubtitleStyle}>Add your work history with company, role, and duration.</p>
                                                </div>
                                            </div>
                                            <button
                                                type="button"
                                                onClick={openAddExperienceModal}
                                                style={{
                                                    display: 'inline-flex',
                                                    alignItems: 'center',
                                                    gap: '6px',
                                                    padding: '10px 16px',
                                                    borderRadius: '10px',
                                                    border: 'none',
                                                    background: THEME.gradient,
                                                    color: '#fff',
                                                    fontWeight: 700,
                                                    fontSize: '14px',
                                                    cursor: 'pointer',
                                                    boxShadow: '0 4px 14px rgba(22,163,74,0.22)',
                                                }}
                                            >
                                                <FiPlus size={16} /> Add
                                            </button>
                                        </div>

                                        {experienceEntries.length === 0 ? (
                                            <div style={{
                                                padding: '28px 20px',
                                                borderRadius: '12px',
                                                border: '1px dashed rgba(148,163,184,0.45)',
                                                background: '#f8fafc',
                                                textAlign: 'center',
                                                color: '#64748b',
                                                fontSize: '14px',
                                            }}>
                                                No experience added yet. Click <strong>Add</strong> to create your first entry.
                                            </div>
                                        ) : (
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                                                {experienceEntries.map((entry) => (
                                                    <div
                                                        key={entry.id}
                                                        style={{
                                                            border: '1px solid rgba(148,163,184,0.22)',
                                                            borderRadius: '14px',
                                                            padding: '18px',
                                                            background: '#fff',
                                                            boxShadow: '0 4px 14px rgba(15,23,42,0.04)',
                                                        }}
                                                    >
                                                        <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', alignItems: 'flex-start' }}>
                                                            <div style={{ flex: 1, minWidth: 0 }}>
                                                                <h4 style={{ margin: '0 0 6px', fontSize: '18px', fontWeight: 800, color: '#0f172a' }}>
                                                                    {entry.jobTitle || 'Untitled role'}
                                                                </h4>
                                                                <p style={{ margin: '0 0 6px', fontSize: '14px', color: '#334155', fontWeight: 600 }}>
                                                                    {entry.company || 'Company not specified'}
                                                                    {entry.employmentType ? (
                                                                        <span style={{ color: '#94a3b8', fontWeight: 500 }}>
                                                                            {' '}· {labelForOption(EMPLOYMENT_TYPE_OPTIONS, entry.employmentType)}
                                                                        </span>
                                                                    ) : null}
                                                                </p>
                                                                <p style={experienceMetaStyle}>
                                                                    {formatExperienceDateRange(entry)}
                                                                </p>
                                                                {(entry.location || entry.locationType) ? (
                                                                    <p style={{ ...experienceMetaStyle, marginBottom: entry.description ? '0' : '0' }}>
                                                                        {[entry.location, entry.locationType ? labelForOption(LOCATION_TYPE_OPTIONS, entry.locationType) : '']
                                                                            .filter(Boolean)
                                                                            .join(' · ')}
                                                                    </p>
                                                                ) : null}
                                                                <ExperienceDescriptionText
                                                                    text={entry.description}
                                                                    entryId={entry.id}
                                                                    expandedIds={expandedExperienceIds}
                                                                    onToggle={toggleExperienceDescription}
                                                                />
                                                            </div>
                                                            <button
                                                                type="button"
                                                                onClick={() => openEditExperienceModal(entry)}
                                                                style={{
                                                                    display: 'inline-flex',
                                                                    alignItems: 'center',
                                                                    gap: '6px',
                                                                    padding: '8px 12px',
                                                                    borderRadius: '8px',
                                                                    border: '1px solid rgba(22,163,74,0.25)',
                                                                    background: '#f0fdf4',
                                                                    color: '#15803d',
                                                                    fontWeight: 700,
                                                                    fontSize: '13px',
                                                                    cursor: 'pointer',
                                                                    flexShrink: 0,
                                                                }}
                                                            >
                                                                <FiEdit2 size={14} /> Edit
                                                            </button>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </RevealCard>

                                    <RevealCard id="section-career" delay={0.05} className="candidate-profile-section" style={sectionCardStyle}>
                                        <div style={{ marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                                            <span style={sectionHeadIconStyle}><FiAward /></span>
                                            <div>
                                                <h3 className="candidate-profile-section-title" style={{ ...sectionTitleStyle, fontSize: '26px' }}>Career Information</h3>
                                                <p className="candidate-profile-section-subtitle" style={sectionSubtitleStyle}>Showcase your current standing and ideal role.</p>
                                            </div>
                                        </div>
                                        <div className="row">
                                            <div className="col-md-6 col-sm-6 col-xs-12">
                                                <div className="form-group" style={{ marginBottom: '20px' }}>
                                                    <label style={labelStyle}>Employment type</label>
                                                    <select name="employmentType" className="wide form-control" value={profileData.employmentType} onChange={handleInputChange} style={{ ...inputStyle, backgroundColor: '#fff' }} onFocus={inputFocus} onBlur={inputBlur}>
                                                        <option value="">Select Employment Type</option>
                                                        <option value="full-time">Full Time</option>
                                                        <option value="part-time">Part Time</option>
                                                        <option value="contract">Contract</option>
                                                        <option value="freelance">Freelance</option>
                                                    </select>
                                                </div>
                                            </div>
                                            <div className="col-md-4 col-sm-6 col-xs-12">
                                                <div className="form-group" style={{ marginBottom: '20px' }}>
                                                    <label style={labelStyle}>Current salary</label>
                                                    <input type="text" name="currentSalary" className="form-control" placeholder="Current salary" value={profileData.currentSalary} onChange={handleInputChange} style={inputStyle} onFocus={inputFocus} onBlur={inputBlur} />
                                                </div>
                                            </div>
                                            <div className="col-md-4 col-sm-6 col-xs-12">
                                                <div className="form-group" style={{ marginBottom: '20px' }}>
                                                    <label style={labelStyle}>Expected salary</label>
                                                    <input type="text" name="expectedSalary" className="form-control" placeholder="Expected salary" value={profileData.expectedSalary} onChange={handleInputChange} style={inputStyle} onFocus={inputFocus} onBlur={inputBlur} />
                                                </div>
                                            </div>
                                            <div className="col-md-4 col-sm-6 col-xs-12">
                                                <div className="form-group" style={{ marginBottom: '20px' }}>
                                                    <label style={labelStyle}>Notice period</label>
                                                    <input type="text" name="noticePeriod" className="form-control" placeholder="2 weeks / 30 days" value={profileData.noticePeriod} onChange={handleInputChange} style={inputStyle} onFocus={inputFocus} onBlur={inputBlur} />
                                                </div>
                                            </div>
                                            <div className="col-md-12 col-sm-12 col-xs-12">
                                                <div className="form-group" style={{ marginBottom: '0' }}>
                                                    <label style={labelStyle}>Preferred location</label>
                                                    <input type="text" name="preferredLocation" className="form-control" placeholder="Remote, Bengaluru, New York..." value={profileData.preferredLocation} onChange={handleInputChange} style={inputStyle} onFocus={inputFocus} onBlur={inputBlur} />
                                                </div>
                                            </div>
                                        </div>
                                    </RevealCard>

                                    <RevealCard id="section-education" delay={0.05} className="candidate-profile-section" style={sectionCardStyle}>
                                        <div style={{ marginBottom: '20px', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                                <span style={sectionHeadIconStyle}><FiBookOpen /></span>
                                                <div>
                                                    <h3 className="candidate-profile-section-title" style={{ ...sectionTitleStyle, fontSize: '26px' }}>Education</h3>
                                                    <p className="candidate-profile-section-subtitle" style={sectionSubtitleStyle}>Add your academic background with institute, degree, and duration.</p>
                                                </div>
                                            </div>
                                            <button
                                                type="button"
                                                onClick={toggleEducationAddForm}
                                                style={{
                                                    display: 'inline-flex',
                                                    alignItems: 'center',
                                                    gap: '6px',
                                                    padding: '10px 16px',
                                                    borderRadius: '10px',
                                                    border: 'none',
                                                    background: educationAddFormOpen ? '#e2e8f0' : THEME.gradient,
                                                    color: educationAddFormOpen ? '#334155' : '#fff',
                                                    fontWeight: 700,
                                                    fontSize: '14px',
                                                    cursor: 'pointer',
                                                    boxShadow: educationAddFormOpen ? 'none' : '0 4px 14px rgba(22,163,74,0.22)',
                                                }}
                                            >
                                                {educationAddFormOpen ? <><FiX size={16} /> Cancel</> : <><FiPlus size={16} /> Add</>}
                                            </button>
                                        </div>

                                        <ProfileSlideDownPanel open={educationAddFormOpen}>
                                            <div style={{
                                                padding: '20px',
                                                borderRadius: '12px',
                                                border: '1px solid rgba(148,163,184,0.28)',
                                                background: '#f8fafc',
                                            }}>
                                                <h4 style={{ margin: '0 0 6px', fontSize: '17px', fontWeight: 800, color: '#0f172a' }}>Add Education</h4>
                                                <p style={{ margin: '0 0 16px', fontSize: '13px', color: '#64748b' }}>Fields marked with * are required.</p>
                                                {educationFormError ? (
                                                    <div style={{ marginBottom: '14px', padding: '10px 12px', borderRadius: '8px', background: '#fee2e2', color: '#dc2626', fontSize: '13px', fontWeight: 600 }}>
                                                        {educationFormError}
                                                    </div>
                                                ) : null}
                                                <div className="row">
                                                    <div className="col-md-12 col-sm-12 col-xs-12">
                                                        <div className="form-group" style={{ marginBottom: '16px' }}>
                                                            <label style={labelStyle}>Institute name *</label>
                                                            <input type="text" className="form-control" value={educationForm.instituteName} onChange={(e) => updateEducationFormField('instituteName', e.target.value)} placeholder="e.g. Delhi University" style={inputStyle} onFocus={inputFocus} onBlur={inputBlur} />
                                                        </div>
                                                    </div>
                                                    <div className="col-md-12 col-sm-12 col-xs-12">
                                                        <div className="form-group" style={{ marginBottom: '16px' }}>
                                                            <label style={labelStyle}>Degree *</label>
                                                            <input type="text" className="form-control" value={educationForm.degree} onChange={(e) => updateEducationFormField('degree', e.target.value)} placeholder="e.g. B.Tech in Computer Science" style={inputStyle} onFocus={inputFocus} onBlur={inputBlur} />
                                                        </div>
                                                    </div>
                                                    <div className="col-md-12 col-sm-12 col-xs-12">
                                                        <div className="form-group" style={{ marginBottom: '16px' }}>
                                                            <label style={labelStyle}>Marks</label>
                                                            <input type="text" className="form-control" value={educationForm.marks} onChange={(e) => updateEducationFormField('marks', e.target.value)} placeholder="e.g. 85% or 8.5 CGPA" style={inputStyle} onFocus={inputFocus} onBlur={inputBlur} />
                                                        </div>
                                                    </div>
                                                    <div className="col-md-12 col-sm-12 col-xs-12">
                                                        <div className="form-group" style={{ marginBottom: '16px' }}>
                                                            <label style={labelStyle}>Course type *</label>
                                                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', marginTop: '8px' }}>
                                                                {COURSE_TYPE_OPTIONS.map((option) => (
                                                                    <label key={`edu-inline-course-${option.value}`} style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '14px', color: '#334155', fontWeight: 500 }}>
                                                                        <input
                                                                            type="radio"
                                                                            name="edu-course-type-add"
                                                                            value={option.value}
                                                                            checked={educationForm.courseType === option.value}
                                                                            onChange={() => updateEducationFormField('courseType', option.value)}
                                                                        />
                                                                        {option.label}
                                                                    </label>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div className="col-md-12 col-sm-12 col-xs-12" style={{ marginTop: '4px', marginBottom: '8px' }}>
                                                        <label style={labelStyle}>Duration *</label>
                                                    </div>
                                                    <div className="col-md-6 col-sm-6 col-xs-12">
                                                        <div className="form-group" style={{ marginBottom: '16px' }}>
                                                            <label style={{ ...labelStyle, fontSize: '12px', fontWeight: 600, color: '#64748b' }}>Start year *</label>
                                                            <select className="wide form-control" value={educationForm.startYear} onChange={(e) => updateEducationFormField('startYear', e.target.value)} style={{ ...inputStyle, backgroundColor: '#fff' }} onFocus={inputFocus} onBlur={inputBlur}>
                                                                {YEAR_OPTIONS.map((option) => (
                                                                    <option key={`edu-inline-start-year-${option.value || 'empty'}`} value={option.value}>{option.label}</option>
                                                                ))}
                                                            </select>
                                                        </div>
                                                    </div>
                                                    <div className="col-md-6 col-sm-6 col-xs-12">
                                                        <div className="form-group" style={{ marginBottom: '16px' }}>
                                                            <label style={{ ...labelStyle, fontSize: '12px', fontWeight: 600, color: '#64748b' }}>End year *</label>
                                                            <select className="wide form-control" value={educationForm.endYear} onChange={(e) => updateEducationFormField('endYear', e.target.value)} style={{ ...inputStyle, backgroundColor: '#fff' }} onFocus={inputFocus} onBlur={inputBlur}>
                                                                {YEAR_OPTIONS.map((option) => (
                                                                    <option key={`edu-inline-end-year-${option.value || 'empty'}`} value={option.value}>{option.label}</option>
                                                                ))}
                                                            </select>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '8px' }}>
                                                    <button type="button" onClick={closeEducationAddForm} style={{ padding: '10px 18px', borderRadius: '10px', border: '1px solid #dbe5f1', background: '#fff', color: '#475569', fontWeight: 700, cursor: 'pointer' }}>
                                                        Cancel
                                                    </button>
                                                    <button type="button" onClick={saveEducationFromAddForm} style={{ padding: '10px 18px', borderRadius: '10px', border: 'none', background: THEME.gradient, color: '#fff', fontWeight: 700, cursor: 'pointer' }}>
                                                        Add Education
                                                    </button>
                                                </div>
                                            </div>
                                        </ProfileSlideDownPanel>

                                        {educationEntries.length === 0 ? (
                                            <div style={{
                                                padding: '28px 20px',
                                                borderRadius: '12px',
                                                border: '1px dashed rgba(148,163,184,0.45)',
                                                background: '#f8fafc',
                                                textAlign: 'center',
                                                color: '#64748b',
                                                fontSize: '14px',
                                            }}>
                                                No education added yet. Click <strong>Add</strong> to create your first entry.
                                            </div>
                                        ) : (
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                                                {educationEntries.map((entry) => (
                                                    <div
                                                        key={entry.id}
                                                        style={{
                                                            border: '1px solid rgba(148,163,184,0.22)',
                                                            borderRadius: '14px',
                                                            padding: '18px',
                                                            background: '#fff',
                                                            boxShadow: '0 4px 14px rgba(15,23,42,0.04)',
                                                        }}
                                                    >
                                                        <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', alignItems: 'flex-start' }}>
                                                            <div style={{ flex: 1, minWidth: 0 }}>
                                                                <h4 style={{ margin: '0 0 6px', fontSize: '18px', fontWeight: 800, color: '#0f172a' }}>
                                                                    {entry.degree || 'Degree not specified'}
                                                                </h4>
                                                                <p style={{ margin: '0 0 6px', fontSize: '14px', color: '#334155', fontWeight: 600 }}>
                                                                    {entry.instituteName || 'Institute not specified'}
                                                                </p>
                                                                <p style={experienceMetaStyle}>
                                                                    {formatEducationDateRange(entry)}
                                                                    {entry.courseType ? (
                                                                        <span style={{ color: '#94a3b8', fontWeight: 500 }}>
                                                                            {' '}· {labelForOption(COURSE_TYPE_OPTIONS, entry.courseType)}
                                                                        </span>
                                                                    ) : null}
                                                                    {entry.marks ? (
                                                                        <span style={{ color: '#94a3b8', fontWeight: 500 }}>
                                                                            {' '}· Marks: {entry.marks}
                                                                        </span>
                                                                    ) : null}
                                                                </p>
                                                            </div>
                                                            <button
                                                                type="button"
                                                                onClick={() => openEditEducationModal(entry)}
                                                                style={{
                                                                    display: 'inline-flex',
                                                                    alignItems: 'center',
                                                                    gap: '6px',
                                                                    padding: '8px 12px',
                                                                    borderRadius: '8px',
                                                                    border: '1px solid rgba(22,163,74,0.25)',
                                                                    background: '#f0fdf4',
                                                                    color: '#15803d',
                                                                    fontWeight: 700,
                                                                    fontSize: '13px',
                                                                    cursor: 'pointer',
                                                                    flexShrink: 0,
                                                                }}
                                                            >
                                                                <FiEdit2 size={14} /> Edit
                                                            </button>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </RevealCard>

                                    <RevealCard id="section-certifications" delay={0.05} className="candidate-profile-section" style={sectionCardStyle}>
                                        <div style={{ marginBottom: '20px', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                                <span style={sectionHeadIconStyle}><FiAward /></span>
                                                <div>
                                                    <h3 className="candidate-profile-section-title" style={{ ...sectionTitleStyle, fontSize: '26px' }}>Certifications</h3>
                                                    <p className="candidate-profile-section-subtitle" style={sectionSubtitleStyle}>Add professional certifications, credentials, and license details.</p>
                                                </div>
                                            </div>
                                            <button
                                                type="button"
                                                onClick={toggleCertificationAddForm}
                                                style={{
                                                    display: 'inline-flex',
                                                    alignItems: 'center',
                                                    gap: '6px',
                                                    padding: '10px 16px',
                                                    borderRadius: '10px',
                                                    border: 'none',
                                                    background: certificationAddFormOpen ? '#e2e8f0' : THEME.gradient,
                                                    color: certificationAddFormOpen ? '#334155' : '#fff',
                                                    fontWeight: 700,
                                                    fontSize: '14px',
                                                    cursor: 'pointer',
                                                    boxShadow: certificationAddFormOpen ? 'none' : '0 4px 14px rgba(22,163,74,0.22)',
                                                }}
                                            >
                                                {certificationAddFormOpen ? <><FiX size={16} /> Cancel</> : <><FiPlus size={16} /> Add</>}
                                            </button>
                                        </div>

                                        <ProfileSlideDownPanel open={certificationAddFormOpen}>
                                            <div style={{
                                                padding: '20px',
                                                borderRadius: '12px',
                                                border: '1px solid rgba(148,163,184,0.28)',
                                                background: '#f8fafc',
                                            }}>
                                                <h4 style={{ margin: '0 0 6px', fontSize: '17px', fontWeight: 800, color: '#0f172a' }}>Add Certification</h4>
                                                <p style={{ margin: '0 0 16px', fontSize: '13px', color: '#64748b' }}>Fields marked with * are required.</p>
                                                {certificationFormError ? (
                                                    <div style={{ marginBottom: '14px', padding: '10px 12px', borderRadius: '8px', background: '#fee2e2', color: '#dc2626', fontSize: '13px', fontWeight: 600 }}>{certificationFormError}</div>
                                                ) : null}
                                                <div className="row">
                                                    <div className="col-md-12 col-sm-12 col-xs-12">
                                                        <div className="form-group" style={{ marginBottom: '16px' }}>
                                                            <label style={labelStyle}>Name *</label>
                                                            <input type="text" className="form-control" value={certificationForm.name} onChange={(e) => updateCertificationFormField('name', e.target.value)} placeholder="e.g. AWS Certified Solutions Architect" style={inputStyle} onFocus={inputFocus} onBlur={inputBlur} />
                                                        </div>
                                                    </div>
                                                    <div className="col-md-12 col-sm-12 col-xs-12">
                                                        <div className="form-group" style={{ marginBottom: '16px' }}>
                                                            <label style={labelStyle}>Issuing organization *</label>
                                                            <input type="text" className="form-control" value={certificationForm.issuingOrganization} onChange={(e) => updateCertificationFormField('issuingOrganization', e.target.value)} placeholder="e.g. Amazon Web Services" style={inputStyle} onFocus={inputFocus} onBlur={inputBlur} />
                                                        </div>
                                                    </div>
                                                    <div className="col-md-12 col-sm-12 col-xs-12" style={{ marginBottom: '8px' }}>
                                                        <label style={labelStyle}>Issue date</label>
                                                    </div>
                                                    <div className="col-md-6 col-sm-6 col-xs-12">
                                                        <div className="form-group" style={{ marginBottom: '16px' }}>
                                                            <select className="wide form-control" value={certificationForm.issueMonth} onChange={(e) => updateCertificationFormField('issueMonth', e.target.value)} style={{ ...inputStyle, backgroundColor: '#fff' }} onFocus={inputFocus} onBlur={inputBlur}>
                                                                {MONTH_OPTIONS.map((option) => (
                                                                    <option key={`cert-inline-issue-month-${option.value || 'empty'}`} value={option.value}>{option.label}</option>
                                                                ))}
                                                            </select>
                                                        </div>
                                                    </div>
                                                    <div className="col-md-6 col-sm-6 col-xs-12">
                                                        <div className="form-group" style={{ marginBottom: '16px' }}>
                                                            <select className="wide form-control" value={certificationForm.issueYear} onChange={(e) => updateCertificationFormField('issueYear', e.target.value)} style={{ ...inputStyle, backgroundColor: '#fff' }} onFocus={inputFocus} onBlur={inputBlur}>
                                                                {YEAR_OPTIONS.map((option) => (
                                                                    <option key={`cert-inline-issue-year-${option.value || 'empty'}`} value={option.value}>{option.label}</option>
                                                                ))}
                                                            </select>
                                                        </div>
                                                    </div>
                                                    <div className="col-md-12 col-sm-12 col-xs-12">
                                                        <label style={{ ...labelStyle, display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                                                            <input type="checkbox" checked={certificationForm.noExpiration} onChange={(e) => updateCertificationFormField('noExpiration', e.target.checked)} />
                                                            This credential does not expire
                                                        </label>
                                                    </div>
                                                    {!certificationForm.noExpiration && (
                                                        <>
                                                            <div className="col-md-12 col-sm-12 col-xs-12" style={{ marginTop: '12px', marginBottom: '8px' }}>
                                                                <label style={labelStyle}>Expiration date</label>
                                                            </div>
                                                            <div className="col-md-6 col-sm-6 col-xs-12">
                                                                <div className="form-group" style={{ marginBottom: '16px' }}>
                                                                    <select className="wide form-control" value={certificationForm.expirationMonth} onChange={(e) => updateCertificationFormField('expirationMonth', e.target.value)} style={{ ...inputStyle, backgroundColor: '#fff' }} onFocus={inputFocus} onBlur={inputBlur}>
                                                                        {MONTH_OPTIONS.map((option) => (
                                                                            <option key={`cert-inline-exp-month-${option.value || 'empty'}`} value={option.value}>{option.label}</option>
                                                                        ))}
                                                                    </select>
                                                                </div>
                                                            </div>
                                                            <div className="col-md-6 col-sm-6 col-xs-12">
                                                                <div className="form-group" style={{ marginBottom: '16px' }}>
                                                                    <select className="wide form-control" value={certificationForm.expirationYear} onChange={(e) => updateCertificationFormField('expirationYear', e.target.value)} style={{ ...inputStyle, backgroundColor: '#fff' }} onFocus={inputFocus} onBlur={inputBlur}>
                                                                        {YEAR_OPTIONS.map((option) => (
                                                                            <option key={`cert-inline-exp-year-${option.value || 'empty'}`} value={option.value}>{option.label}</option>
                                                                        ))}
                                                                    </select>
                                                                </div>
                                                            </div>
                                                        </>
                                                    )}
                                                    <div className="col-md-12 col-sm-12 col-xs-12">
                                                        <div className="form-group" style={{ marginBottom: '0' }}>
                                                            <label style={labelStyle}>Credential URL</label>
                                                            <input type="url" className="form-control" value={certificationForm.credentialUrl} onChange={(e) => updateCertificationFormField('credentialUrl', e.target.value)} placeholder="https://..." style={inputStyle} onFocus={inputFocus} onBlur={inputBlur} />
                                                        </div>
                                                    </div>
                                                </div>
                                                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px' }}>
                                                    <button type="button" onClick={closeCertificationAddForm} style={{ padding: '10px 18px', borderRadius: '10px', border: '1px solid #dbe5f1', background: '#fff', color: '#475569', fontWeight: 700, cursor: 'pointer' }}>Cancel</button>
                                                    <button type="button" onClick={saveCertificationFromAddForm} style={{ padding: '10px 18px', borderRadius: '10px', border: 'none', background: THEME.gradient, color: '#fff', fontWeight: 700, cursor: 'pointer' }}>Add Certification</button>
                                                </div>
                                            </div>
                                        </ProfileSlideDownPanel>

                                        {certificationEntries.length === 0 ? (
                                            <div style={{
                                                padding: '28px 20px',
                                                borderRadius: '12px',
                                                border: '1px dashed rgba(148,163,184,0.45)',
                                                background: '#f8fafc',
                                                textAlign: 'center',
                                                color: '#64748b',
                                                fontSize: '14px',
                                            }}>
                                                No certifications added yet. Click <strong>Add</strong> to create your first entry.
                                            </div>
                                        ) : (
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                                                {certificationEntries.map((entry) => (
                                                    <div
                                                        key={entry.id}
                                                        style={{
                                                            border: '1px solid rgba(148,163,184,0.22)',
                                                            borderRadius: '14px',
                                                            padding: '18px',
                                                            background: '#fff',
                                                            boxShadow: '0 4px 14px rgba(15,23,42,0.04)',
                                                        }}
                                                    >
                                                        <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', alignItems: 'flex-start' }}>
                                                            <div style={{ flex: 1, minWidth: 0 }}>
                                                                <h4 style={{ margin: '0 0 6px', fontSize: '18px', fontWeight: 800, color: '#0f172a' }}>
                                                                    {entry.name || 'Certification not specified'}
                                                                </h4>
                                                                <p style={{ margin: '0 0 6px', fontSize: '14px', color: '#334155', fontWeight: 600 }}>
                                                                    {entry.issuingOrganization || 'Organization not specified'}
                                                                </p>
                                                                <p style={experienceMetaStyle}>
                                                                    {formatCertificationDateRange(entry)}
                                                                </p>
                                                                {entry.credentialUrl ? (
                                                                    <a
                                                                        href={entry.credentialUrl}
                                                                        target="_blank"
                                                                        rel="noopener noreferrer"
                                                                        style={{ fontSize: '13px', color: '#16a34a', fontWeight: 600, wordBreak: 'break-all' }}
                                                                    >
                                                                        View credential
                                                                    </a>
                                                                ) : null}
                                                            </div>
                                                            <button
                                                                type="button"
                                                                onClick={() => openEditCertificationModal(entry)}
                                                                style={{
                                                                    display: 'inline-flex',
                                                                    alignItems: 'center',
                                                                    gap: '6px',
                                                                    padding: '8px 12px',
                                                                    borderRadius: '8px',
                                                                    border: '1px solid rgba(22,163,74,0.25)',
                                                                    background: '#f0fdf4',
                                                                    color: '#15803d',
                                                                    fontWeight: 700,
                                                                    fontSize: '13px',
                                                                    cursor: 'pointer',
                                                                    flexShrink: 0,
                                                                }}
                                                            >
                                                                <FiEdit2 size={14} /> Edit
                                                            </button>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </RevealCard>

                                    <RevealCard id="section-social" delay={0.05} className="candidate-profile-section" style={sectionCardStyle}>
                                        <div style={{ marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                                            <span style={sectionHeadIconStyle}><FiLink /></span>
                                            <div>
                                                <h3 className="candidate-profile-section-title" style={{ ...sectionTitleStyle, fontSize: '26px' }}>Social Links</h3>
                                                <p className="candidate-profile-section-subtitle" style={sectionSubtitleStyle}>Add your professional and social profiles.</p>
                                            </div>
                                        </div>
                                        <div className="row">
                                            {/* <div className="col-md-6 col-sm-6 col-xs-12">
                                                <div className="form-group" style={{ marginBottom: '20px' }}>
                                                    <label style={labelStyle}>Facebook</label>
                                                    <input type="url" name="facebook" className="form-control" placeholder="https://facebook.com/" value={profileData.facebook} onChange={handleInputChange} style={inputStyle} onFocus={inputFocus} onBlur={inputBlur} />
                                                </div>
                                            </div> */}
                                            {/* <div className="col-md-6 col-sm-6 col-xs-12">
                                                <div className="form-group" style={{ marginBottom: '20px' }}>
                                                    <label style={labelStyle}>Twitter</label>
                                                    <input type="url" name="twitter" className="form-control" placeholder="https://twitter.com/" value={profileData.twitter} onChange={handleInputChange} style={inputStyle} onFocus={inputFocus} onBlur={inputBlur} />
                                                </div>
                                            </div> */}
                                            <div className="col-md-6 col-sm-6 col-xs-12">
                                                <div className="form-group" style={{ marginBottom: '20px' }}>
                                                    <label style={labelStyle}>LinkedIn</label>
                                                    <input type="url" name="linkedin" className="form-control" placeholder="https://linkedin.com/" value={profileData.linkedin} onChange={handleInputChange} style={inputStyle} onFocus={inputFocus} onBlur={inputBlur} />
                                                </div>
                                            </div>
                                            <div className="col-md-6 col-sm-6 col-xs-12">
                                                <div className="form-group" style={{ marginBottom: '0' }}>
                                                    <label style={labelStyle}>Portfolio</label>
                                                    <input type="url" name="google" className="form-control" placeholder="https://google.com/" value={profileData.google} onChange={handleInputChange} style={inputStyle} onFocus={inputFocus} onBlur={inputBlur} />
                                                </div>
                                            </div>
                                        </div>
                                    </RevealCard>

                                    {/* ── Accessibility card ────────────────────────────────────────── */}
                                    <RevealCard id="section-accessibility" delay={0.05} className="candidate-profile-section" style={sectionCardStyle}>
                                        <div style={{ marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                                            <span style={sectionHeadIconStyle}>
                                                {/* wheelchair/accessibility icon via themify */}
                                                <i className="ti-wheelchair" style={{ fontSize: '20px' }} />
                                            </span>
                                            <div>
                                                <h3 className="candidate-profile-section-title" style={{ ...sectionTitleStyle, fontSize: '26px' }}>Accessibility</h3>
                                                <p className="candidate-profile-section-subtitle" style={sectionSubtitleStyle}>Let us know if you need any accommodations — completely optional.</p>
                                            </div>
                                            {/* Toggle switch */}
                                            <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '10px' }}>
                                                <span style={{ fontSize: '13px', color: '#64748b', fontWeight: 600 }}>
                                                    {profileData.hasDisability ? 'On' : 'Off'}
                                                </span>
                                                <button
                                                    type="button"
                                                    role="switch"
                                                    aria-checked={profileData.hasDisability}
                                                    aria-label="Toggle accessibility information"
                                                    onClick={() => setProfileData((prev) => ({
                                                        ...prev,
                                                        hasDisability: !prev.hasDisability,
                                                        disabilityDetails: !prev.hasDisability ? prev.disabilityDetails : '',
                                                        accommodationNeeds: !prev.hasDisability ? prev.accommodationNeeds : '',
                                                    }))}
                                                    style={{
                                                        position: 'relative',
                                                        display: 'inline-flex',
                                                        alignItems: 'center',
                                                        width: '48px',
                                                        height: '26px',
                                                        borderRadius: '13px',
                                                        border: 'none',
                                                        cursor: 'pointer',
                                                        background: profileData.hasDisability ? THEME.green : '#cbd5e1',
                                                        transition: 'background 0.25s',
                                                        padding: 0,
                                                        flexShrink: 0,
                                                    }}
                                                >
                                                    <span style={{
                                                        position: 'absolute',
                                                        top: '3px',
                                                        left: profileData.hasDisability ? '25px' : '3px',
                                                        width: '20px',
                                                        height: '20px',
                                                        borderRadius: '50%',
                                                        background: '#fff',
                                                        boxShadow: '0 1px 4px rgba(0,0,0,0.18)',
                                                        transition: 'left 0.25s',
                                                    }} />
                                                </button>
                                            </div>
                                        </div>

                                        {profileData.hasDisability && (
                                            <div className="row">
                                                <div className="col-md-6 col-sm-12 col-xs-12">
                                                    <div className="form-group" style={{ marginBottom: '20px' }}>
                                                        <label htmlFor="disabilityDetails" style={labelStyle}>Disability / condition</label>
                                                        <textarea
                                                            id="disabilityDetails"
                                                            name="disabilityDetails"
                                                            className="form-control"
                                                            rows={3}
                                                            placeholder="e.g. locomotor disability, hearing impaired, visually impaired"
                                                            value={profileData.disabilityDetails}
                                                            onChange={handleInputChange}
                                                            style={{ ...inputStyle, resize: 'vertical' }}
                                                            onFocus={inputFocus}
                                                            onBlur={inputBlur}
                                                        />
                                                    </div>
                                                </div>
                                                <div className="col-md-6 col-sm-12 col-xs-12">
                                                    <div className="form-group" style={{ marginBottom: '20px' }}>
                                                        <label htmlFor="accommodationNeeds" style={labelStyle}>Accommodation needs</label>
                                                        <textarea
                                                            id="accommodationNeeds"
                                                            name="accommodationNeeds"
                                                            className="form-control"
                                                            rows={3}
                                                            placeholder="e.g. needs a sign language interpreter, wheelchair accessible interview location"
                                                            value={profileData.accommodationNeeds}
                                                            onChange={handleInputChange}
                                                            style={{ ...inputStyle, resize: 'vertical' }}
                                                            onFocus={inputFocus}
                                                            onBlur={inputBlur}
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </RevealCard>
                                    {/* ── End Accessibility card ─────────────────────────────────── */}

                                    <div style={{ marginTop: '10px', textAlign: 'center' }}>
                                            <button
                                                type="submit"
                                                className="btn btn-m theme-btn"
                                                disabled={loading}
                                                style={{
                                                    padding: '13px 46px',
                                                    fontSize: '16px',
                                                    fontWeight: '700',
                                                    borderRadius: '12px',
                                                    background: THEME.gradient,
                                                    border: 'none',
                                                    color: '#fff',
                                                    transition: 'all 0.3s',
                                                    cursor: loading ? 'not-allowed' : 'pointer',
                                                    opacity: loading ? 0.7 : 1,
                                                    boxShadow: '0 10px 24px rgba(22,163,74,0.30)'
                                                }}
                                                onMouseEnter={(e) => {
                                                    if (!loading) {
                                                        e.currentTarget.style.transform = 'translateY(-2px)';
                                                        e.currentTarget.style.boxShadow = '0 14px 30px rgba(22,163,74,0.40)';
                                                    }
                                                }}
                                                onMouseLeave={(e) => {
                                                    if (!loading) {
                                                        e.currentTarget.style.transform = 'translateY(0)';
                                                        e.currentTarget.style.boxShadow = '0 10px 24px rgba(22,163,74,0.30)';
                                                    }
                                                }}
                                            >
                                                {loading ? 'Updating...' : 'Update Profile'}
                                            </button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    </div>
                </div>
            </section>
            {/* ================ End Profile Settings ======================= */}

            {experienceModalOpen && (
                <div
                    style={{
                        position: 'fixed',
                        inset: 0,
                        background: 'rgba(15,23,42,0.55)',
                        zIndex: 10000,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        padding: '20px',
                    }}
                    onClick={(e) => {
                        if (e.target === e.currentTarget) closeExperienceModal();
                    }}
                >
                    <div
                        style={{
                            width: '100%',
                            maxWidth: '640px',
                            maxHeight: '92vh',
                            overflowY: 'auto',
                            background: '#fff',
                            borderRadius: '16px',
                            padding: '24px',
                            boxShadow: '0 20px 60px rgba(0,0,0,0.25)',
                            position: 'relative',
                        }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <button
                            type="button"
                            onClick={closeExperienceModal}
                            aria-label="Close"
                            style={{
                                position: 'absolute',
                                top: '14px',
                                right: '14px',
                                border: 'none',
                                background: 'none',
                                color: '#94a3b8',
                                cursor: 'pointer',
                                fontSize: '22px',
                                lineHeight: 1,
                            }}
                        >
                            <FiX />
                        </button>

                        <h3 style={{ margin: '0 0 6px', fontSize: '22px', fontWeight: 800, color: '#0f172a' }}>
                            {experienceEditId ? 'Edit Experience' : 'Add Experience'}
                        </h3>
                        <p style={{ margin: '0 0 18px', fontSize: '14px', color: '#64748b' }}>
                            Fields marked with * are required.
                        </p>

                        {experienceFormError ? (
                            <div style={{
                                marginBottom: '14px',
                                padding: '10px 12px',
                                borderRadius: '8px',
                                background: '#fee2e2',
                                color: '#dc2626',
                                fontSize: '13px',
                                fontWeight: 600,
                            }}>
                                {experienceFormError}
                            </div>
                        ) : null}

                        <div className="row">
                            <div className="col-md-12 col-sm-12 col-xs-12">
                                <div className="form-group" style={{ marginBottom: '16px' }}>
                                    <label style={labelStyle}>Job title *</label>
                                    <input
                                        type="text"
                                        className="form-control"
                                        value={experienceForm.jobTitle}
                                        onChange={(e) => updateExperienceFormField('jobTitle', e.target.value)}
                                        placeholder="e.g. Software Engineer"
                                        style={inputStyle}
                                        onFocus={inputFocus}
                                        onBlur={inputBlur}
                                    />
                                </div>
                            </div>

                            <div className="col-md-6 col-sm-6 col-xs-12">
                                <div className="form-group" style={{ marginBottom: '16px' }}>
                                    <label style={labelStyle}>Employment type</label>
                                    <select
                                        className="wide form-control"
                                        value={experienceForm.employmentType}
                                        onChange={(e) => updateExperienceFormField('employmentType', e.target.value)}
                                        style={{ ...inputStyle, backgroundColor: '#fff' }}
                                        onFocus={inputFocus}
                                        onBlur={inputBlur}
                                    >
                                        {EMPLOYMENT_TYPE_OPTIONS.map((option) => (
                                            <option key={option.value || 'empty'} value={option.value}>{option.label}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div className="col-md-6 col-sm-6 col-xs-12">
                                <div className="form-group" style={{ marginBottom: '16px' }}>
                                    <label style={labelStyle}>Company / organization *</label>
                                    <input
                                        type="text"
                                        className="form-control"
                                        value={experienceForm.company}
                                        onChange={(e) => updateExperienceFormField('company', e.target.value)}
                                        placeholder="e.g. Infosys"
                                        style={inputStyle}
                                        onFocus={inputFocus}
                                        onBlur={inputBlur}
                                    />
                                </div>
                            </div>

                            <div className="col-md-12 col-sm-12 col-xs-12">
                                <label style={{ ...labelStyle, display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                                    <input
                                        type="checkbox"
                                        checked={experienceForm.currentlyWorking}
                                        onChange={(e) => updateExperienceFormField('currentlyWorking', e.target.checked)}
                                    />
                                    I am currently working in this role
                                </label>
                            </div>

                            <div className="col-md-12 col-sm-12 col-xs-12" style={{ marginTop: '12px', marginBottom: '8px' }}>
                                <label style={labelStyle}>Start date *</label>
                            </div>
                            <div className="col-md-6 col-sm-6 col-xs-12">
                                <div className="form-group" style={{ marginBottom: '16px' }}>
                                    <select
                                        className="wide form-control"
                                        value={experienceForm.startMonth}
                                        onChange={(e) => updateExperienceFormField('startMonth', e.target.value)}
                                        style={{ ...inputStyle, backgroundColor: '#fff' }}
                                        onFocus={inputFocus}
                                        onBlur={inputBlur}
                                    >
                                        {MONTH_OPTIONS.map((option) => (
                                            <option key={`start-month-${option.value || 'empty'}`} value={option.value}>{option.label}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                            <div className="col-md-6 col-sm-6 col-xs-12">
                                <div className="form-group" style={{ marginBottom: '16px' }}>
                                    <select
                                        className="wide form-control"
                                        value={experienceForm.startYear}
                                        onChange={(e) => updateExperienceFormField('startYear', e.target.value)}
                                        style={{ ...inputStyle, backgroundColor: '#fff' }}
                                        onFocus={inputFocus}
                                        onBlur={inputBlur}
                                    >
                                        {YEAR_OPTIONS.map((option) => (
                                            <option key={`start-year-${option.value || 'empty'}`} value={option.value}>{option.label}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            {!experienceForm.currentlyWorking && (
                                <>
                                    <div className="col-md-12 col-sm-12 col-xs-12" style={{ marginBottom: '8px' }}>
                                        <label style={labelStyle}>End date *</label>
                                    </div>
                                    <div className="col-md-6 col-sm-6 col-xs-12">
                                        <div className="form-group" style={{ marginBottom: '16px' }}>
                                            <select
                                                className="wide form-control"
                                                value={experienceForm.endMonth}
                                                onChange={(e) => updateExperienceFormField('endMonth', e.target.value)}
                                                style={{ ...inputStyle, backgroundColor: '#fff' }}
                                                onFocus={inputFocus}
                                                onBlur={inputBlur}
                                            >
                                                {MONTH_OPTIONS.map((option) => (
                                                    <option key={`end-month-${option.value || 'empty'}`} value={option.value}>{option.label}</option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>
                                    <div className="col-md-6 col-sm-6 col-xs-12">
                                        <div className="form-group" style={{ marginBottom: '16px' }}>
                                            <select
                                                className="wide form-control"
                                                value={experienceForm.endYear}
                                                onChange={(e) => updateExperienceFormField('endYear', e.target.value)}
                                                style={{ ...inputStyle, backgroundColor: '#fff' }}
                                                onFocus={inputFocus}
                                                onBlur={inputBlur}
                                            >
                                                {YEAR_OPTIONS.map((option) => (
                                                    <option key={`end-year-${option.value || 'empty'}`} value={option.value}>{option.label}</option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>
                                </>
                            )}

                            <div className="col-md-6 col-sm-6 col-xs-12">
                                <div className="form-group" style={{ marginBottom: '16px' }}>
                                    <label style={labelStyle}>Location</label>
                                    <input
                                        type="text"
                                        className="form-control"
                                        value={experienceForm.location}
                                        onChange={(e) => updateExperienceFormField('location', e.target.value)}
                                        placeholder="e.g. Bengaluru, India"
                                        style={inputStyle}
                                        onFocus={inputFocus}
                                        onBlur={inputBlur}
                                    />
                                </div>
                            </div>

                            <div className="col-md-6 col-sm-6 col-xs-12">
                                <div className="form-group" style={{ marginBottom: '16px' }}>
                                    <label style={labelStyle}>Location type</label>
                                    <select
                                        className="wide form-control"
                                        value={experienceForm.locationType}
                                        onChange={(e) => updateExperienceFormField('locationType', e.target.value)}
                                        style={{ ...inputStyle, backgroundColor: '#fff' }}
                                        onFocus={inputFocus}
                                        onBlur={inputBlur}
                                    >
                                        {LOCATION_TYPE_OPTIONS.map((option) => (
                                            <option key={option.value || 'empty'} value={option.value}>{option.label}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div className="col-md-12 col-sm-12 col-xs-12">
                                <div className="form-group" style={{ marginBottom: '0' }}>
                                    <label style={labelStyle}>Description</label>
                                    <textarea
                                        className="form-control"
                                        rows={4}
                                        value={experienceForm.description}
                                        onChange={(e) => updateExperienceFormField('description', e.target.value)}
                                        placeholder="Describe your responsibilities and achievements..."
                                        style={{ ...inputStyle, padding: '14px 15px', resize: 'vertical' }}
                                        onFocus={inputFocus}
                                        onBlur={inputBlur}
                                    />
                                </div>
                            </div>
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px' }}>
                            <button
                                type="button"
                                onClick={closeExperienceModal}
                                style={{
                                    padding: '10px 18px',
                                    borderRadius: '10px',
                                    border: '1px solid #dbe5f1',
                                    background: '#fff',
                                    color: '#475569',
                                    fontWeight: 700,
                                    cursor: 'pointer',
                                }}
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                onClick={saveExperienceEntry}
                                disabled={loading}
                                style={{
                                    padding: '10px 18px',
                                    borderRadius: '10px',
                                    border: 'none',
                                    background: THEME.gradient,
                                    color: '#fff',
                                    fontWeight: 700,
                                    cursor: loading ? 'not-allowed' : 'pointer',
                                    opacity: loading ? 0.7 : 1,
                                }}
                            >
                                {loading && experienceEditId
                                    ? 'Saving...'
                                    : experienceEditId
                                    ? 'Save Changes'
                                    : 'Add Experience'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {educationModalOpen && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.55)', zIndex: 10000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }} onClick={(e) => { if (e.target === e.currentTarget) closeEducationModal(); }}>
                    <div style={{ width: '100%', maxWidth: '640px', maxHeight: '92vh', overflowY: 'auto', background: '#fff', borderRadius: '16px', padding: '24px', boxShadow: '0 20px 60px rgba(0,0,0,0.25)', position: 'relative' }} onClick={(e) => e.stopPropagation()}>
                        <button type="button" onClick={closeEducationModal} aria-label="Close" style={{ position: 'absolute', top: '14px', right: '14px', border: 'none', background: 'none', color: '#94a3b8', cursor: 'pointer', fontSize: '22px' }}>
                            <FiX />
                        </button>
                        <h3 style={{ margin: '0 0 6px', fontSize: '22px', fontWeight: 800, color: '#0f172a' }}>Edit Education</h3>
                        <p style={{ margin: '0 0 18px', fontSize: '14px', color: '#64748b' }}>Fields marked with * are required.</p>
                        {educationFormError ? (
                            <div style={{ marginBottom: '14px', padding: '10px 12px', borderRadius: '8px', background: '#fee2e2', color: '#dc2626', fontSize: '13px', fontWeight: 600 }}>{educationFormError}</div>
                        ) : null}
                        <div className="row">
                            <div className="col-md-12 col-sm-12 col-xs-12">
                                <div className="form-group" style={{ marginBottom: '16px' }}>
                                    <label style={labelStyle}>Institute name *</label>
                                    <input type="text" className="form-control" value={educationForm.instituteName} onChange={(e) => updateEducationFormField('instituteName', e.target.value)} style={inputStyle} onFocus={inputFocus} onBlur={inputBlur} />
                                </div>
                            </div>
                            <div className="col-md-12 col-sm-12 col-xs-12">
                                <div className="form-group" style={{ marginBottom: '16px' }}>
                                    <label style={labelStyle}>Degree *</label>
                                    <input type="text" className="form-control" value={educationForm.degree} onChange={(e) => updateEducationFormField('degree', e.target.value)} style={inputStyle} onFocus={inputFocus} onBlur={inputBlur} />
                                </div>
                            </div>
                            <div className="col-md-12 col-sm-12 col-xs-12">
                                <div className="form-group" style={{ marginBottom: '16px' }}>
                                    <label style={labelStyle}>Marks</label>
                                    <input type="text" className="form-control" value={educationForm.marks} onChange={(e) => updateEducationFormField('marks', e.target.value)} placeholder="e.g. 85% or 8.5 CGPA" style={inputStyle} onFocus={inputFocus} onBlur={inputBlur} />
                                </div>
                            </div>
                            <div className="col-md-12 col-sm-12 col-xs-12">
                                <div className="form-group" style={{ marginBottom: '16px' }}>
                                    <label style={labelStyle}>Course type *</label>
                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', marginTop: '8px' }}>
                                        {COURSE_TYPE_OPTIONS.map((option) => (
                                            <label key={`edu-modal-course-${option.value}`} style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '14px', color: '#334155', fontWeight: 500 }}>
                                                <input
                                                    type="radio"
                                                    name="edu-course-type-modal"
                                                    value={option.value}
                                                    checked={educationForm.courseType === option.value}
                                                    onChange={() => updateEducationFormField('courseType', option.value)}
                                                />
                                                {option.label}
                                            </label>
                                        ))}
                                    </div>
                                </div>
                            </div>
                            <div className="col-md-12 col-sm-12 col-xs-12" style={{ marginTop: '4px', marginBottom: '8px' }}>
                                <label style={labelStyle}>Duration *</label>
                            </div>
                            <div className="col-md-6 col-sm-6 col-xs-12">
                                <div className="form-group" style={{ marginBottom: '16px' }}>
                                    <label style={{ ...labelStyle, fontSize: '12px', fontWeight: 600, color: '#64748b' }}>Start year *</label>
                                    <select className="wide form-control" value={educationForm.startYear} onChange={(e) => updateEducationFormField('startYear', e.target.value)} style={{ ...inputStyle, backgroundColor: '#fff' }} onFocus={inputFocus} onBlur={inputBlur}>
                                        {YEAR_OPTIONS.map((option) => (
                                            <option key={`edu-modal-start-year-${option.value || 'empty'}`} value={option.value}>{option.label}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                            <div className="col-md-6 col-sm-6 col-xs-12">
                                <div className="form-group" style={{ marginBottom: '16px' }}>
                                    <label style={{ ...labelStyle, fontSize: '12px', fontWeight: 600, color: '#64748b' }}>End year *</label>
                                    <select className="wide form-control" value={educationForm.endYear} onChange={(e) => updateEducationFormField('endYear', e.target.value)} style={{ ...inputStyle, backgroundColor: '#fff' }} onFocus={inputFocus} onBlur={inputBlur}>
                                        {YEAR_OPTIONS.map((option) => (
                                            <option key={`edu-modal-end-year-${option.value || 'empty'}`} value={option.value}>{option.label}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px' }}>
                            <button type="button" onClick={closeEducationModal} style={{ padding: '10px 18px', borderRadius: '10px', border: '1px solid #dbe5f1', background: '#fff', color: '#475569', fontWeight: 700, cursor: 'pointer' }}>Cancel</button>
                            <button type="button" onClick={saveEducationFromModal} disabled={loading} style={{ padding: '10px 18px', borderRadius: '10px', border: 'none', background: THEME.gradient, color: '#fff', fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1 }}>
                                {loading ? 'Saving...' : 'Save Changes'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {certificationModalOpen && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.55)', zIndex: 10000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }} onClick={(e) => { if (e.target === e.currentTarget) closeCertificationModal(); }}>
                    <div style={{ width: '100%', maxWidth: '640px', maxHeight: '92vh', overflowY: 'auto', background: '#fff', borderRadius: '16px', padding: '24px', boxShadow: '0 20px 60px rgba(0,0,0,0.25)', position: 'relative' }} onClick={(e) => e.stopPropagation()}>
                        <button type="button" onClick={closeCertificationModal} aria-label="Close" style={{ position: 'absolute', top: '14px', right: '14px', border: 'none', background: 'none', color: '#94a3b8', cursor: 'pointer', fontSize: '22px' }}>
                            <FiX />
                        </button>
                        <h3 style={{ margin: '0 0 6px', fontSize: '22px', fontWeight: 800, color: '#0f172a' }}>Edit Certification</h3>
                        <p style={{ margin: '0 0 18px', fontSize: '14px', color: '#64748b' }}>Fields marked with * are required.</p>
                        {certificationFormError ? (
                            <div style={{ marginBottom: '14px', padding: '10px 12px', borderRadius: '8px', background: '#fee2e2', color: '#dc2626', fontSize: '13px', fontWeight: 600 }}>{certificationFormError}</div>
                        ) : null}
                        <div className="row">
                            <div className="col-md-12 col-sm-12 col-xs-12">
                                <div className="form-group" style={{ marginBottom: '16px' }}>
                                    <label style={labelStyle}>Name *</label>
                                    <input type="text" className="form-control" value={certificationForm.name} onChange={(e) => updateCertificationFormField('name', e.target.value)} style={inputStyle} onFocus={inputFocus} onBlur={inputBlur} />
                                </div>
                            </div>
                            <div className="col-md-12 col-sm-12 col-xs-12">
                                <div className="form-group" style={{ marginBottom: '16px' }}>
                                    <label style={labelStyle}>Issuing organization *</label>
                                    <input type="text" className="form-control" value={certificationForm.issuingOrganization} onChange={(e) => updateCertificationFormField('issuingOrganization', e.target.value)} style={inputStyle} onFocus={inputFocus} onBlur={inputBlur} />
                                </div>
                            </div>
                            <div className="col-md-12 col-sm-12 col-xs-12" style={{ marginBottom: '8px' }}>
                                <label style={labelStyle}>Issue date</label>
                            </div>
                            <div className="col-md-6 col-sm-6 col-xs-12">
                                <div className="form-group" style={{ marginBottom: '16px' }}>
                                    <select className="wide form-control" value={certificationForm.issueMonth} onChange={(e) => updateCertificationFormField('issueMonth', e.target.value)} style={{ ...inputStyle, backgroundColor: '#fff' }} onFocus={inputFocus} onBlur={inputBlur}>
                                        {MONTH_OPTIONS.map((option) => (
                                            <option key={`cert-modal-issue-month-${option.value || 'empty'}`} value={option.value}>{option.label}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                            <div className="col-md-6 col-sm-6 col-xs-12">
                                <div className="form-group" style={{ marginBottom: '16px' }}>
                                    <select className="wide form-control" value={certificationForm.issueYear} onChange={(e) => updateCertificationFormField('issueYear', e.target.value)} style={{ ...inputStyle, backgroundColor: '#fff' }} onFocus={inputFocus} onBlur={inputBlur}>
                                        {YEAR_OPTIONS.map((option) => (
                                            <option key={`cert-modal-issue-year-${option.value || 'empty'}`} value={option.value}>{option.label}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                            <div className="col-md-12 col-sm-12 col-xs-12">
                                <label style={{ ...labelStyle, display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                                    <input type="checkbox" checked={certificationForm.noExpiration} onChange={(e) => updateCertificationFormField('noExpiration', e.target.checked)} />
                                    This credential does not expire
                                </label>
                            </div>
                            {!certificationForm.noExpiration && (
                                <>
                                    <div className="col-md-12 col-sm-12 col-xs-12" style={{ marginTop: '12px', marginBottom: '8px' }}>
                                        <label style={labelStyle}>Expiration date</label>
                                    </div>
                                    <div className="col-md-6 col-sm-6 col-xs-12">
                                        <div className="form-group" style={{ marginBottom: '16px' }}>
                                            <select className="wide form-control" value={certificationForm.expirationMonth} onChange={(e) => updateCertificationFormField('expirationMonth', e.target.value)} style={{ ...inputStyle, backgroundColor: '#fff' }} onFocus={inputFocus} onBlur={inputBlur}>
                                                {MONTH_OPTIONS.map((option) => (
                                                    <option key={`cert-modal-exp-month-${option.value || 'empty'}`} value={option.value}>{option.label}</option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>
                                    <div className="col-md-6 col-sm-6 col-xs-12">
                                        <div className="form-group" style={{ marginBottom: '16px' }}>
                                            <select className="wide form-control" value={certificationForm.expirationYear} onChange={(e) => updateCertificationFormField('expirationYear', e.target.value)} style={{ ...inputStyle, backgroundColor: '#fff' }} onFocus={inputFocus} onBlur={inputBlur}>
                                                {YEAR_OPTIONS.map((option) => (
                                                    <option key={`cert-modal-exp-year-${option.value || 'empty'}`} value={option.value}>{option.label}</option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>
                                </>
                            )}
                            <div className="col-md-12 col-sm-12 col-xs-12">
                                <div className="form-group" style={{ marginBottom: '0' }}>
                                    <label style={labelStyle}>Credential URL</label>
                                    <input type="url" className="form-control" value={certificationForm.credentialUrl} onChange={(e) => updateCertificationFormField('credentialUrl', e.target.value)} style={inputStyle} onFocus={inputFocus} onBlur={inputBlur} />
                                </div>
                            </div>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px' }}>
                            <button type="button" onClick={closeCertificationModal} style={{ padding: '10px 18px', borderRadius: '10px', border: '1px solid #dbe5f1', background: '#fff', color: '#475569', fontWeight: 700, cursor: 'pointer' }}>Cancel</button>
                            <button type="button" onClick={saveCertificationFromModal} disabled={loading} style={{ padding: '10px 18px', borderRadius: '10px', border: 'none', background: THEME.gradient, color: '#fff', fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1 }}>
                                {loading ? 'Saving...' : 'Save Changes'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <Footer />
        </>



    );
}

export default Profile;