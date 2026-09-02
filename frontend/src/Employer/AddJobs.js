import React, { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import Header from "../Components/Header";
import Footer from "../Components/Footer";
import EmployerSidebar from "./Sidebar";
import { API_BASE_URL } from "../config/api";

function AddJobs() {
        // --- PinCode Location Autofill Logic ---
        const getLocationFromPinCode = async (pin) => {
            try {
                const apiUrl = `https://api.postalpincode.in/pincode/${pin}`;
                const response = await fetch(apiUrl, {
                    method: 'GET',
                    headers: { 'Accept': 'application/json' },
                });
                if (!response.ok) {
                    throw new Error(`API request failed with status ${response.status}`);
                }
                const data = await response.json();
                if (data && Array.isArray(data) && data.length > 0) {
                    const postOffice = data[0];
                    if (postOffice.Status === "Success" && postOffice.PostOffice && postOffice.PostOffice.length > 0) {
                        const firstPostOffice = postOffice.PostOffice[0];
                        return {
                            city: firstPostOffice.District || firstPostOffice.Name || "",
                            state: firstPostOffice.State || "",
                            country: "India",
                        };
                    } else {
                        return { city: "", state: "", country: "India" };
                    }
                } else {
                    return { city: "", state: "", country: "India" };
                }
            } catch (error) {
                return getLocationFromPinCodeFallback(pin);
            }
        };

        const getLocationFromPinCodeFallback = (pin) => {
            const firstTwo = pin.substring(0, 2);
            const firstThree = pin.substring(0, 3);
            if (firstTwo === "40" || firstTwo === "41") {
                return { city: "Mumbai", state: "Maharashtra", country: "India" };
            } else if (firstTwo === "11") {
                return { city: "Delhi", state: "Delhi", country: "India" };
            } else if (firstTwo === "56") {
                return { city: "Bangalore", state: "Karnataka", country: "India" };
            } else if (firstTwo === "50") {
                return { city: "Hyderabad", state: "Telangana", country: "India" };
            } else if (firstTwo === "60") {
                return { city: "Chennai", state: "Tamil Nadu", country: "India" };
            } else if (firstTwo === "70") {
                return { city: "Kolkata", state: "West Bengal", country: "India" };
            } else if (firstThree === "411") {
                return { city: "Pune", state: "Maharashtra", country: "India" };
            } else if (firstThree === "380") {
                return { city: "Ahmedabad", state: "Gujarat", country: "India" };
            } else if (firstThree === "302") {
                return { city: "Jaipur", state: "Rajasthan", country: "India" };
            } else if (firstThree === "395") {
                return { city: "Surat", state: "Gujarat", country: "India" };
            } else if (firstTwo === "75") {
                return { city: "Bhubaneswar", state: "Odisha", country: "India" };
            }
            return { city: "", state: "", country: "India" };
        };

        const handlePinCodeChange = async (e) => {
            const pin = e.target.value.replace(/[^0-9]/g, '').slice(0, 6);
            setJobData(prev => ({ ...prev, zipCode: pin }));
            if (pin.length === 6) {
                const locationData = await getLocationFromPinCode(pin);
                setJobData(prev => ({
                    ...prev,
                    city: locationData.city,
                    state: locationData.state,
                    country: locationData.country,
                }));
            } else {
                setJobData(prev => ({ ...prev, city: '', state: '', country: '' }));
            }
        };
    
    const { user, profileData, loading: authLoading } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');
    const [jobData, setJobData] = useState({
        jobTitle: '',
        companyName: '',
        category: '',
        description: '',
        salaryMin: '',
        salaryMax: '',
        salaryNegotiable: false,
        noOfVacancy: '',
        experience: '',
        jobType: '',
        qualification: '',
        skills: '',
        email: '',
        phone: '',
        website: '',
        address: '',
        city: '',
        state: '',
        country: '',
        zipCode: '',
        facebook: '',
        google: '',
        twitter: '',
        linkedin: '',
        instagram: ''
    });
    const [postedJob, setPostedJob] = useState(null);
    const [aiJDEnabled, setAiJDEnabled] = useState(false);
    const [aiJDBusy, setAiJDBusy] = useState(false);
    const messageTimeoutRef = useRef(null);

    useEffect(() => {
        fetch(`${API_BASE_URL}/api/ai/status`)
            .then((r) => r.json())
            .then((d) => setAiJDEnabled(!!d.configured))
            .catch(() => setAiJDEnabled(false));
    }, []);

    const generateJobDescription = async () => {
        if (!jobData.jobTitle || !jobData.jobTitle.trim()) {
            setMessage('Enter a job title first to generate a description.');
            return;
        }
        setAiJDBusy(true);
        try {
            const res = await fetch(`${API_BASE_URL}/api/ai/job-description`, {
                method: 'POST',
                headers: { Authorization: `Bearer ${localStorage.getItem('token')}`, 'Content-Type': 'application/json' },
                body: JSON.stringify({ title: jobData.jobTitle, skills: jobData.skills, companyName: jobData.companyName }),
            });
            const data = await res.json();
            if (res.ok && data.description) {
                setJobData((prev) => ({ ...prev, description: data.description }));
            } else {
                setMessage(data.message || 'Could not generate description.');
            }
        } catch (e) {
            setMessage('Network error generating description.');
        }
        setAiJDBusy(false);
    };
    
    useEffect(() => {
        if (!user) {
            navigate('/');
            return;
        }
        
        // Check if user is an employer (support multiple labels)
        const isEmployer = user.role === 'provider' || user.role === 'employer' || user.role === 'admin';
        if (!isEmployer) {
            navigate('/');
            return;
        }
    }, [user, navigate]);

    // FIX 6 (Company Profile Gate): block job posting until the employer has
    // created a company profile. Wait for profileData to load before deciding,
    // and exempt admins.
    useEffect(() => {
        if (authLoading || !user) return;
        if (user.role === 'admin') return;
        const isEmployer = user.role === 'provider' || user.role === 'employer';
        if (!isEmployer) return;
        if (!profileData || profileData.type !== 'employer') return; // not loaded yet
        if (profileData.companyProfileComplete === false) {
            navigate('/employer/profile?completeProfile=1', { replace: true });
        }
    }, [authLoading, user, profileData, navigate]);
     // Fix: Remove any lingering modal overlays/backdrops on mount (white screen bug)
        useEffect(() => {
            // Hide any open modals
            const modals = document.querySelectorAll('.modal.show');
            modals.forEach(modal => {
                modal.classList.remove('show');
                modal.style.display = 'none';
                modal.setAttribute('aria-hidden', 'true');
            });
            // Remove modal backdrops
            const backdrops = document.querySelectorAll('.modal-backdrop');
            backdrops.forEach(bd => bd.parentNode && bd.parentNode.removeChild(bd));
        }, []);

    // Auto-dismiss toast messages
    useEffect(() => {
        if (message) {
            // Clear any existing timeout
            if (messageTimeoutRef.current) {
                clearTimeout(messageTimeoutRef.current);
            }
            // Set new timeout to clear message after 4 seconds
            messageTimeoutRef.current = setTimeout(() => {
                setMessage('');
            }, 4000);
        }
        // Cleanup timeout on unmount
        return () => {
            if (messageTimeoutRef.current) {
                clearTimeout(messageTimeoutRef.current);
            }
        };
    }, [message]);

    // If editing, fetch job and prefill
    useEffect(() => {
        const params = new URLSearchParams(location.search);
        const editId = params.get('edit');
        if (!editId) return;
        (async () => {
            try {
                const token = localStorage.getItem('token');
                if (!token) return;
                const resp = await fetch(`${API_BASE_URL}/api/employer/jobs/${editId}`, {
                    method: 'GET',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                });
                if (resp.ok) {
                    const data = await resp.json();
                    const job = data.job || data;
                    setJobData(prev => ({
                        ...prev,
                        jobTitle: job.jobTitle || job.title || job.job_title || '',
                        companyName: job.companyName || job.company_name || '',
                        category: job.category || '',
                        description: job.description || '',
                        ...(() => {
                            const salaryType = String(job.salaryType || job.salary_type || '').toLowerCase();
                            const legacyRange = job.salaryRange || job.salary_range || '';
                            if (salaryType === 'negotiable' || String(legacyRange).toLowerCase() === 'negotiable') {
                                return { salaryMin: '', salaryMax: '', salaryNegotiable: true };
                            }
                            const minVal = job.salaryMin ?? job.salary_min;
                            const maxVal = job.salaryMax ?? job.salary_max;
                            if (minVal != null && maxVal != null) {
                                return {
                                    salaryMin: String(minVal),
                                    salaryMax: String(maxVal),
                                    salaryNegotiable: false,
                                };
                            }
                            if (/^\d+-\d+$/.test(String(legacyRange).trim())) {
                                const [minPart, maxPart] = legacyRange.split('-');
                                return {
                                    salaryMin: minPart,
                                    salaryMax: maxPart,
                                    salaryNegotiable: false,
                                };
                            }
                            return { salaryMin: '', salaryMax: '', salaryNegotiable: false };
                        })(),
                        noOfVacancy: job.noOfVacancy || job.no_of_vacancy || '',
                        experience: job.experience || '',
                        jobType: job.jobType || job.job_type || '',
                        qualification: job.qualification || '',
                        skills: job.skills || '',
                        email: job.email || '',
                        phone: job.phone || '',
                        website: job.website || '',
                        address: job.address || '',
                        city: job.city || '',
                        state: job.state || '',
                        country: job.country || '',
                        zipCode: job.zipCode || job.zip_code || '',
                        facebook: job.facebook || '',
                        google: job.google || '',
                        twitter: job.twitter || '',
                        linkedin: job.linkedin || '',
                        pinterest: job.pinterest || '',
                        instagram: job.instagram || ''
                    }));
                }
            } catch (e) {
                // ignore
            }
        })();
    }, [location.search]);

    useEffect(() => {
        const params = new URLSearchParams(location.search);
        const isEditMode = params.has('edit');
        if (!isEditMode && profileData && profileData.companyName && !jobData.companyName) {
            setJobData(prev => ({
                ...prev,
                companyName: profileData.companyName
            }));
        }
    }, [profileData, location.search, jobData.companyName]);

    const handleInputChange = (e) => {
        const { name, value, type, files } = e.target;
        if (name === 'zipCode') {
            handlePinCodeChange(e);
            return;
        }
        if (type !== 'file') {
            if (name === 'website') {
                try {
                    const v = (value || '').trim();
                    const lower = v.toLowerCase();
                    if (lower.includes('/admin/dashboard')) {
                        setJobData(prev => ({ ...prev, [name]: '' }));
                        return;
                    }
                    const forbidden = ['localhost', '127.0.0.1'];
                    try {
                        const apiHost = new URL(API_BASE_URL).hostname;
                        forbidden.push(apiHost);
                    } catch (e) {}
                    let host = '';
                    try {
                        const parsed = new URL(v.startsWith('http') ? v : `https://${v}`);
                        host = parsed.hostname.toLowerCase();
                    } catch (_) { host = ''; }
                    if (host) {
                        if (forbidden.some(f => host.includes(f))) {
                            setJobData(prev => ({ ...prev, [name]: '' }));
                            return;
                        }
                    } else {
                        if (lower.includes('localhost') || lower.includes('127.0.0.1')) {
                            setJobData(prev => ({ ...prev, [name]: '' }));
                            return;
                        }
                    }
                } catch (e) {}
            }
            setJobData(prev => ({
                ...prev,
                [name]: value
            }));
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        // Clear any existing timeout
        if (messageTimeoutRef.current) {
            clearTimeout(messageTimeoutRef.current);
            messageTimeoutRef.current = null;
        }
        
        setLoading(true);
        
        try {
            // Field-specific validation
            if (!jobData.jobTitle || !jobData.jobTitle.trim()) {
                setLoading(false);
                setMessage('Please enter Job Title');
                // Scroll to top to show toast
                setTimeout(() => window.scrollTo({ top: 0, behavior: 'smooth' }), 50);
                return;
            }
            if (!jobData.companyName || !jobData.companyName.trim()) {
                setLoading(false);
                setMessage('Please enter Company Name');
                setTimeout(() => window.scrollTo({ top: 0, behavior: 'smooth' }), 50);
                return;
            }
            if (!jobData.category || !jobData.category.trim()) {
                setLoading(false);
                setMessage('Please select Category');
                setTimeout(() => window.scrollTo({ top: 0, behavior: 'smooth' }), 50);
                return;
            }
            if (!jobData.salaryNegotiable) {
                const minSalary = parseInt(jobData.salaryMin, 10);
                const maxSalary = parseInt(jobData.salaryMax, 10);
                if (!Number.isInteger(minSalary) || minSalary <= 0 || !Number.isInteger(maxSalary) || maxSalary <= 0) {
                    setLoading(false);
                    setMessage('Please enter valid min and max salary');
                    setTimeout(() => window.scrollTo({ top: 0, behavior: 'smooth' }), 50);
                    return;
                }
                if (minSalary > maxSalary) {
                    setLoading(false);
                    setMessage('Min salary must not exceed max salary');
                    setTimeout(() => window.scrollTo({ top: 0, behavior: 'smooth' }), 50);
                    return;
                }
            }
            if (!jobData.noOfVacancy || !jobData.noOfVacancy.toString().trim()) {
                setLoading(false);
                setMessage('Please enter No. Of Vacancy');
                setTimeout(() => window.scrollTo({ top: 0, behavior: 'smooth' }), 50);
                return;
            }
            if (!jobData.experience || !jobData.experience.trim()) {
                setLoading(false);
                setMessage('Please select Experience');
                setTimeout(() => window.scrollTo({ top: 0, behavior: 'smooth' }), 50);
                return;
            }
            if (!jobData.jobType || !jobData.jobType.trim()) {
                setLoading(false);
                setMessage('Please select Job Type');
                setTimeout(() => window.scrollTo({ top: 0, behavior: 'smooth' }), 50);
                return;
            }
            if (!jobData.qualification || !jobData.qualification.trim()) {
                setLoading(false);
                setMessage('Please enter Qualification Required');
                setTimeout(() => window.scrollTo({ top: 0, behavior: 'smooth' }), 50);
                return;
            }
            if (!jobData.skills || !jobData.skills.trim()) {
                setLoading(false);
                setMessage('Please enter Skills');
                setTimeout(() => window.scrollTo({ top: 0, behavior: 'smooth' }), 50);
                return;
            }
            if (!jobData.city || !jobData.city.trim()) {
                setLoading(false);
                setMessage('Please select City');
                setTimeout(() => window.scrollTo({ top: 0, behavior: 'smooth' }), 50);
                return;
            }
            // Description validation
            if (!jobData.description || !jobData.description.trim() || jobData.description.trim().length < 10) {
                setLoading(false);
                setMessage('Please enter Description (at least 10 characters)');
                setTimeout(() => window.scrollTo({ top: 0, behavior: 'smooth' }), 50);
                return;
            }
            
            const token = localStorage.getItem('token');
            if (!token) {
                setMessage('Please login again');
                setLoading(false);
                return;
            }

            const salaryPayload = jobData.salaryNegotiable
                ? { salary_type: 'negotiable', salaryRange: 'negotiable' }
                : {
                    salary_type: 'fixed',
                    salary_min: String(parseInt(jobData.salaryMin, 10)),
                    salary_max: String(parseInt(jobData.salaryMax, 10)),
                    salaryRange: `${parseInt(jobData.salaryMin, 10)}-${parseInt(jobData.salaryMax, 10)}`,
                };

            const { salaryMin, salaryMax, salaryNegotiable, ...jobFields } = jobData;

            // Build clean JSON body, trim strings and drop empty values.
            const rawBody = {
                    ...jobFields,
                    ...salaryPayload,
                    noOfVacancy: jobFields.noOfVacancy ? Number(jobFields.noOfVacancy) : undefined,
                };
                const jsonBody = Object.entries(rawBody).reduce((acc, [k, v]) => {
                    if (v === undefined || v === null) return acc;
                    if (typeof v === 'string') {
                        const t = v.trim();
                        if (t !== '') acc[k] = t;
                    } else {
                        acc[k] = v;
                    }
                    return acc;
                }, {});
            const payload = JSON.stringify(jsonBody);
            const headers = { 'Authorization': `Bearer ${token}`, 'Accept': 'application/json', 'Content-Type': 'application/json' };

            const params = new URLSearchParams(location.search);
            const editId = params.get('edit');

            const requestUrl = editId ? `${API_BASE_URL}/api/employer/jobs/${editId}` : `${API_BASE_URL}/api/employer/jobs`;
            const useMethod = editId ? 'PUT' : 'POST';
            try {
                if (process.env.NODE_ENV !== 'production') {
                    console.debug('Submitting job to:', requestUrl, 'method:', useMethod);
                    console.debug('Job data website field:', jobData.website);
                    console.debug('Full job data:', jobData);
                }
            } catch (_) {}

            const response = await fetch(requestUrl, {
                method: useMethod,
                headers,
                body: payload,
                credentials: 'include'
            });

            if (response.ok) {
                let created = {};
                try { created = await response.json(); } catch (_) {}
                setMessage('Job posted successfully!');
                setPostedJob(created.job || created);
                // Reset form
                setJobData({
                    jobTitle: '',
                    companyName: '',
                    category: '',
                    description: '',
                    salaryMin: '',
                    salaryMax: '',
                    salaryNegotiable: false,
                    noOfVacancy: '',
                    experience: '',
                    jobType: '',
                    qualification: '',
                    skills: '',
                    email: '',
                    phone: '',
                    website: '',
                    address: '',
                    city: '',
                    state: '',
                    country: '',
                    zipCode: '',
                    facebook: '',
                    google: '',
                    twitter: '',
                    linkedin: '',
                    pinterest: '',
                    instagram: ''
                });
                // Redirect to manage jobs
                navigate('/employer/manage-jobs');
            } else {
                let errorText = `Data not inserted. (${response.status})`;
                try {
                    const contentType = response.headers.get('content-type') || '';
                    if (contentType.includes('application/json')) {
                    const errorData = await response.json();
                        errorText = errorData.message || errorData.error || JSON.stringify(errorData) || errorText;
                    } else {
                        const text = await response.text();
                        if (text) {
                            if (response.status === 403 && /LiteSpeed|Forbidden/i.test(text)) {
                                errorText = 'Server blocked the request (403). Ask your host to allow PUT/DELETE on /api/employer/jobs.';
                            } else {
                                errorText = `${errorText} - ${text.slice(0, 200)}`;
                            }
                        }
                    }
                } catch (_) {
                    // keep default
                }
                console.error('Job post failed:', errorText);
                setMessage(errorText);
            }
        } catch (error) {
            console.error('Error posting job:', error);
            setMessage('Data not inserted. Please try again.');
        } finally {
            setLoading(false);
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

    {
        const isEmployer = user && (user.role === 'provider' || user.role === 'employer' || user.role === 'admin');
        if (!isEmployer) {
        return (
            <div className="container" style={{padding: '50px', textAlign: 'center'}}>
                <h2>Access Denied</h2>
                <p>Only employers can access this page.</p>
                <button onClick={() => navigate('/')} className="btn btn-primary">Go to Home</button>
            </div>
        );
        }
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
                    .custom-file-upload {
                        position: relative;
                        display: inline-block;
                        cursor: pointer;
                        width: 100%;
                    }
                    .custom-file-upload input[type=file] {
                        position: absolute;
                        left: -9999px;
                    }
                    .custom-file-upload::before {
                        content: 'Choose Company Logo';
                        display: inline-block;
                        padding: 12px 16px;
                        background: #007bff;
                        color: white;
                        border: 1px solid #007bff;
                        border-radius: 4px;
                        cursor: pointer;
                        width: 100%;
                        text-align: center;
                        font-weight: 500;
                        transition: background-color 0.3s ease;
                    }
                    .custom-file-upload:hover::before {
                        background: #0056b3;
                        border-color: #0056b3;
                    }
                `}
            </style>
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
            {/* Message Display - Fixed position at top right */}
            {message && (
                <div 
                    id="toast-message"
                    className={`alert ${message.includes('successfully') ? 'alert-success' : 'alert-danger'}`} 
                    style={{
                        position: 'fixed', 
                        top: '20px', 
                        right: '20px', 
                        zIndex: 999999, 
                        minWidth: '300px',
                        maxWidth: '400px',
                        padding: '15px 20px',
                        borderRadius: '8px',
                        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.25)',
                        backgroundColor: message.includes('successfully') ? '#d4edda' : '#f8d7da',
                        color: message.includes('successfully') ? '#155724' : '#721c24',
                        border: `2px solid ${message.includes('successfully') ? '#c3e6cb' : '#f5c6cb'}`,
                        animation: 'slideIn 0.3s ease-out',
                        fontSize: '14px',
                        fontWeight: '500',
                        wordWrap: 'break-word',
                        display: 'block',
                        pointerEvents: 'auto',
                        margin: 0,
                        visibility: 'visible',
                        opacity: 1
                    }}
                >
                    {message}
                </div>
            )}
            <style>{`
                .addjobs-modern-card {
                    background: linear-gradient(180deg, #ffffff 0%, #f8fbff 100%);
                    border-radius: 16px;
                    padding: 30px;
                    border: 1px solid #e8eef7;
                    box-shadow: 0 10px 30px rgba(15, 23, 42, 0.08);
                }
                .addjobs-form .box-header {
                    background: linear-gradient(90deg, #f0fdf4 0%, #ecfeff 100%) !important;
                    border: 1px solid #d9f2df;
                }
                .addjobs-form .form-group > label {
                    font-weight: 600 !important;
                    color: #1f3b5b !important;
                    display: inline-flex !important;
                    align-items: center;
                    gap: 7px;
                    letter-spacing: 0.2px;
                }
                .addjobs-form .form-group > label::before {
                    content: "✦";
                    color: #16a34a;
                    font-size: 12px;
                    line-height: 1;
                }
                .addjobs-form .form-control,
                .addjobs-form .wide.form-control {
                    border-radius: 10px !important;
                    border-color: #dbe5f1 !important;
                    background: #fff !important;
                    box-shadow: 0 1px 2px rgba(15, 23, 42, 0.03);
                }
                .addjobs-form .form-control:focus,
                .addjobs-form .wide.form-control:focus {
                    border-color: #22c55e !important;
                    box-shadow: 0 0 0 3px rgba(34, 197, 94, 0.12) !important;
                }
                .addjobs-form .btn.btn-m.btn-success {
                    border-radius: 10px;
                    box-shadow: 0 8px 18px rgba(34, 197, 94, 0.28);
                }
                .addjobs-form .btn.btn-m.btn-danger {
                    border-radius: 10px;
                }
            `}</style>
            {/* ======================= Create Job ===================== */}
            <section className="create-job padd-top-80 padd-bot-80" style={{ background: '#f8f9fc' }}>
                <div className="container" data-aos="fade-up">
                    <div className="row">
                        <div className="col-md-3 employer-dashboard-sidebar">
                            <EmployerSidebar active="add-jobs" />
                        </div>
                        <div className="col-md-9 employer-dashboard-main">
                            <div className="addjobs-modern-card" style={{
                                background: '#ffffff',
                                borderRadius: '12px',
                                padding: '30px',
                                boxShadow: '0 2px 10px rgba(0, 0, 0, 0.05)'
                            }}>
                                {postedJob && (
                                    <div className="alert alert-success" style={{
                                        marginBottom: '20px',
                                        padding: '15px',
                                        borderRadius: '8px',
                                        backgroundColor: '#d4edda',
                                        border: '1px solid #c3e6cb',
                                        color: '#155724'
                                    }}>
                                        <strong>Posted Job:</strong>
                                        <div><strong>Title:</strong> {postedJob.jobTitle || postedJob.title}</div>
                                        <div><strong>Company:</strong> {postedJob.companyName}</div>
                                        <div><strong>Description:</strong> {postedJob.description}</div>
                                        {(postedJob.salaryRange || postedJob.salary_type === 'negotiable' || postedJob.salary_min) && (
                                            <div>
                                                <strong>Salary:</strong>{' '}
                                                {postedJob.salary_type === 'negotiable' || postedJob.salaryRange === 'negotiable'
                                                    ? 'Negotiable'
                                                    : (postedJob.salaryRange || `${postedJob.salary_min}-${postedJob.salary_max}`)}
                                            </div>
                                        )}
                                    </div>
                                )}
                                {/* Disable native HTML5 validation so our custom toast-based
                                    validation and scrolling logic always runs */}
                                <form className="c-form addjobs-form" onSubmit={handleSubmit} noValidate>
                                    {/* General Information */}
                                    <div className="box" style={{
                                        marginBottom: '30px',
                                        border: 'none',
                                        borderRadius: '8px',
                                        boxShadow: 'none',
                                        background: 'transparent'
                                    }}>
                                        <div className="box-header" style={{
                                            marginBottom: '25px',
                                            padding: '12px 15px',
                                            backgroundColor: '#f5f5f5',
                                            borderRadius: '6px'
                                        }}>
                                            <h4 style={{
                                                margin: 0,
                                                fontSize: '18px',
                                                fontWeight: '600',
                                                color: '#000000'
                                            }}><i className="ti-briefcase" style={{ marginRight: '8px', color: '#16a34a' }}></i>General Information</h4>
                                        </div>
                                        <div className="box-body">
                                            <div className="row">
                                                {/* Per-job logo upload removed; logos are managed in the employer profile.
                                                                        or <span style={{ color: '#28a745', fontWeight: '600' }}>browse</span> — PNG, JPG, GIF. Recommended square image, max ~2MB.
                                                                    </p>
                                                                    <span style={{ fontSize: '12px', color: '#64748b', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                                                                        <i className="ti-info-alt" style={{ color: '#28a745' }} />
                                                                        {logoFileName || (logoPreview ? 'Using current logo — drop a new file to replace' : 'No file selected yet')}
                                                                    </span>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                                */}
                                                <div className="col-md-4 col-sm-6 col-xs-12">
                                                    <div className="form-group" style={{ marginBottom: '20px' }}>
                                                        <label style={{
                                                            display: 'block',
                                                            marginBottom: '8px',
                                                            fontSize: '14px',
                                                            fontWeight: '500',
                                                            color: '#334e6f'
                                                        }}>Job Title *</label>
                                                        <input
                                                            type="text"
                                                            name="jobTitle"
                                                            className="form-control"
                                                            placeholder="Enter job title"
                                                            value={jobData.jobTitle}
                                                            onChange={handleInputChange}
                                                            required
                                                            style={{
                                                                borderRadius: '8px',
                                                                border: '1px solid #e0e0e0',
                                                                padding: '12px 15px',
                                                                fontSize: '14px',
                                                                transition: 'all 0.3s'
                                                            }}
                                                            onFocus={(e) => e.target.style.borderColor = '#28a745'}
                                                            onBlur={(e) => e.target.style.borderColor = '#e0e0e0'}
                                                        />
                                                    </div>
                                                </div>
                                                <div className="col-md-4 col-sm-6 col-xs-12">
                                                    <div className="form-group" style={{ marginBottom: '20px' }}>
                                                        <label style={{
                                                            display: 'block',
                                                            marginBottom: '8px',
                                                            fontSize: '14px',
                                                            fontWeight: '500',
                                                            color: '#334e6f'
                                                        }}>Company Name *</label>
                                                        <input
                                                            type="text"
                                                            name="companyName"
                                                            className="form-control"
                                                            placeholder="Enter company name"
                                                            value={jobData.companyName}
                                                            onChange={handleInputChange}
                                                            required
                                                            style={{
                                                                borderRadius: '8px',
                                                                border: '1px solid #e0e0e0',
                                                                padding: '12px 15px',
                                                                fontSize: '14px',
                                                                transition: 'all 0.3s',
                                                                textTransform: 'capitalize'
                                                            }}
                                                            onFocus={(e) => e.target.style.borderColor = '#28a745'}
                                                            onBlur={(e) => e.target.style.borderColor = '#e0e0e0'}
                                                        />
                                                    </div>
                                                </div>
                                                <div className="col-md-4 col-sm-6 col-xs-12">
                                                    <div className="form-group" style={{ marginBottom: '20px' }}>
                                                        <label style={{
                                                            display: 'block',
                                                            marginBottom: '8px',
                                                            fontSize: '14px',
                                                            fontWeight: '500',
                                                            color: '#334e6f'
                                                        }}>Category</label>
                                                        <select 
                                                            name="category"
                                                            className="wide form-control"
                                                            value={jobData.category}
                                                            onChange={handleInputChange}
                                                            style={{
                                                                borderRadius: '8px',
                                                                border: '1px solid #e0e0e0',
                                                                padding: '12px 15px',
                                                                fontSize: '14px',
                                                                transition: 'all 0.3s',
                                                                backgroundColor: '#fff'
                                                            }}
                                                            onFocus={(e) => e.target.style.borderColor = '#28a745'}
                                                            onBlur={(e) => e.target.style.borderColor = '#e0e0e0'}
                                                        >
                                                            <option value="">Select Category</option>
                                                            <option value="information_technology">Information Technology</option>
                                                            <option value="hardware">Hardware</option>
                                                            <option value="mechanical">Mechanical</option>
                                                            <option value="healthcare">Healthcare</option>
                                                            <option value="finance">Finance</option>
                                                            <option value="education">Education</option>
                                                            <option value="marketing">Marketing</option>
                                                            <option value="other">Other</option>
                                                        </select>
                                                    </div>
                                                </div>
                                                <div className="col-md-12 col-sm-12 col-xs-12">
                                                    <div className="form-group" style={{ marginBottom: '20px' }}>
                                                        <label style={{
                                                            display: 'block',
                                                            marginBottom: '8px',
                                                            fontSize: '14px',
                                                            fontWeight: '500',
                                                            color: '#334e6f'
                                                        }}>Description *
                                                            {aiJDEnabled && (
                                                                <button
                                                                    type="button"
                                                                    onClick={generateJobDescription}
                                                                    disabled={aiJDBusy}
                                                                    style={{ marginLeft: 12, padding: '4px 10px', fontSize: 12, background: '#6f42c1', color: '#fff', border: 0, borderRadius: 6, cursor: 'pointer' }}
                                                                >
                                                                    {aiJDBusy ? 'Generating…' : '✨ Generate with AI'}
                                                                </button>
                                                            )}
                                                        </label>
                                                        <textarea
                                                            name="description"
                                                            className="form-control"
                                                            placeholder="Enter job description"
                                                            rows="4"
                                                            value={jobData.description}
                                                            onChange={handleInputChange}
                                                            required
                                                            style={{
                                                                borderRadius: '8px',
                                                                border: '1px solid #e0e0e0',
                                                                padding: '12px 15px',
                                                                fontSize: '14px',
                                                                transition: 'all 0.3s',
                                                                resize: 'vertical'
                                                            }}
                                                            onFocus={(e) => e.target.style.borderColor = '#28a745'}
                                                            onBlur={(e) => e.target.style.borderColor = '#e0e0e0'}
                                                        />
                                                    </div>
                                                </div>
                                                <div className="col-md-12 col-sm-12 col-xs-12">
                                                    <div className="form-group" style={{ marginBottom: '20px' }}>
                                                        <label style={{
                                                            display: 'block',
                                                            marginBottom: '8px',
                                                            fontSize: '14px',
                                                            fontWeight: '500',
                                                            color: '#334e6f'
                                                        }}>Salary Range</label>
                                                        <div
                                                            style={{
                                                                padding: '16px',
                                                                borderRadius: '8px',
                                                                border: '1px solid #e0e0e0',
                                                                backgroundColor: '#fff',
                                                            }}
                                                        >
                                                            <div className="row">
                                                                <div className="col-md-6 col-sm-6 col-xs-12" style={{ marginBottom: '10px' }}>
                                                                    <input
                                                                        type="number"
                                                                        name="salaryMin"
                                                                        className="form-control"
                                                                        placeholder="Lowest Offered package (e.g. 25000)"
                                                                        min="1"
                                                                        value={jobData.salaryMin}
                                                                        onChange={handleInputChange}
                                                                        disabled={jobData.salaryNegotiable}
                                                                        style={{
                                                                            borderRadius: '8px',
                                                                            border: '1px solid #e0e0e0',
                                                                            padding: '12px 15px',
                                                                            fontSize: '14px',
                                                                            transition: 'all 0.3s',
                                                                            backgroundColor: jobData.salaryNegotiable ? '#f5f5f5' : '#fff',
                                                                        }}
                                                                        onFocus={(e) => { if (!jobData.salaryNegotiable) e.target.style.borderColor = '#28a745'; }}
                                                                        onBlur={(e) => e.target.style.borderColor = '#e0e0e0'}
                                                                    />
                                                                </div>
                                                                <div className="col-md-6 col-sm-6 col-xs-12" style={{ marginBottom: '10px' }}>
                                                                    <input
                                                                        type="number"
                                                                        name="salaryMax"
                                                                        className="form-control"
                                                                        placeholder="Highest Offered package (e.g. 50000)"
                                                                        min="1"
                                                                        value={jobData.salaryMax}
                                                                        onChange={handleInputChange}
                                                                        disabled={jobData.salaryNegotiable}
                                                                        style={{
                                                                            borderRadius: '8px',
                                                                            border: '1px solid #e0e0e0',
                                                                            padding: '12px 15px',
                                                                            fontSize: '14px',
                                                                            transition: 'all 0.3s',
                                                                            backgroundColor: jobData.salaryNegotiable ? '#f5f5f5' : '#fff',
                                                                        }}
                                                                        onFocus={(e) => { if (!jobData.salaryNegotiable) e.target.style.borderColor = '#28a745'; }}
                                                                        onBlur={(e) => e.target.style.borderColor = '#e0e0e0'}
                                                                    />
                                                                </div>
                                                            </div>
                                                            <label
                                                                style={{
                                                                    display: 'flex',
                                                                    alignItems: 'flex-start',
                                                                    gap: '8px',
                                                                    marginTop: '8px',
                                                                    marginBottom: '4px',
                                                                    fontSize: '14px',
                                                                    fontWeight: '500',
                                                                    color: '#334e6f',
                                                                    cursor: 'pointer',
                                                                }}
                                                            >
                                                                <input
                                                                    type="checkbox"
                                                                    name="salaryNegotiable"
                                                                    checked={jobData.salaryNegotiable}
                                                                    onChange={(e) => {
                                                                        const checked = e.target.checked;
                                                                        setJobData((prev) => ({
                                                                            ...prev,
                                                                            salaryNegotiable: checked,
                                                                            ...(checked ? { salaryMin: '', salaryMax: '' } : {}),
                                                                        }));
                                                                    }}
                                                                    style={{ width: '16px', height: '16px', marginTop: '2px', cursor: 'pointer', flexShrink: 0 }}
                                                                />
                                                                <span>Negotiable</span>
                                                            </label>
                                                            <p style={{
                                                                margin: '0 0 0 24px',
                                                                fontSize: '13px',
                                                                lineHeight: '1.45',
                                                                color: '#6b7280',
                                                            }}>
                                                                Prefer not to list exact figures? Select Negotiable .
                                                            </p>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="col-md-4 col-sm-6 col-xs-12">
                                                    <div className="form-group" style={{ marginBottom: '20px' }}>
                                                        <label style={{
                                                            display: 'block',
                                                            marginBottom: '8px',
                                                            fontSize: '14px',
                                                            fontWeight: '500',
                                                            color: '#334e6f'
                                                        }}>No. Of Vacancy</label>
                                                        <input
                                                            type="number"
                                                            name="noOfVacancy"
                                                            className="form-control"
                                                            placeholder="Enter number of vacancies"
                                                            min="1"
                                                            value={jobData.noOfVacancy}
                                                            onChange={handleInputChange}
                                                            style={{
                                                                borderRadius: '8px',
                                                                border: '1px solid #e0e0e0',
                                                                padding: '12px 15px',
                                                                fontSize: '14px',
                                                                transition: 'all 0.3s'
                                                            }}
                                                            onFocus={(e) => e.target.style.borderColor = '#28a745'}
                                                            onBlur={(e) => e.target.style.borderColor = '#e0e0e0'}
                                                        />
                                                    </div>
                                                </div>
                                                <div className="col-md-4 col-sm-6 col-xs-12">
                                                    <div className="form-group" style={{ marginBottom: '20px' }}>
                                                        <label style={{
                                                            display: 'block',
                                                            marginBottom: '8px',
                                                            fontSize: '14px',
                                                            fontWeight: '500',
                                                            color: '#334e6f'
                                                        }}>Experience</label>
                                                        <select 
                                                            name="experience"
                                                            className="wide form-control"
                                                            value={jobData.experience}
                                                            onChange={handleInputChange}
                                                            style={{
                                                                borderRadius: '8px',
                                                                border: '1px solid #e0e0e0',
                                                                padding: '12px 15px',
                                                                fontSize: '14px',
                                                                transition: 'all 0.3s',
                                                                backgroundColor: '#fff'
                                                            }}
                                                            onFocus={(e) => e.target.style.borderColor = '#28a745'}
                                                            onBlur={(e) => e.target.style.borderColor = '#e0e0e0'}
                                                        >
                                                            <option value="">Select Experience</option>
                                                            <option value="fresher">Fresher</option>
                                                            <option value="1-2 years">1-2 Years</option>
                                                            <option value="2-5 years">2-5 Years</option>
                                                            <option value="5-10 years">5-10 Years</option>
                                                            <option value="10+ years">10+ Years</option>
                                                        </select>
                                                    </div>
                                                </div>
                                                <div className="col-md-4 col-sm-6 col-xs-12">
                                                    <div className="form-group" style={{ marginBottom: '20px' }}>
                                                        <label style={{
                                                            display: 'block',
                                                            marginBottom: '8px',
                                                            fontSize: '14px',
                                                            fontWeight: '500',
                                                            color: '#334e6f'
                                                        }}>Job Type</label>
                                                        <select 
                                                            name="jobType"
                                                            className="wide form-control"
                                                            value={jobData.jobType}
                                                            onChange={handleInputChange}
                                                            style={{
                                                                borderRadius: '8px',
                                                                border: '1px solid #e0e0e0',
                                                                padding: '12px 15px',
                                                                fontSize: '14px',
                                                                transition: 'all 0.3s',
                                                                backgroundColor: '#fff'
                                                            }}
                                                            onFocus={(e) => e.target.style.borderColor = '#28a745'}
                                                            onBlur={(e) => e.target.style.borderColor = '#e0e0e0'}
                                                        >
                                                            <option value="">Select Job Type</option>
                                                            <option value="full_time">Full Time</option>
                                                            <option value="part_time">Part Time</option>
                                                            <option value="freelance">Freelance</option>
                                                            <option value="contract">Contract</option>
                                                            <option value="internship">Internship</option>
                                                            <option value="remote">Remote</option>
                                                        </select>
                                                    </div>
                                                </div>
                                                <div className="col-md-6 col-sm-6 col-xs-12">
                                                    <div className="form-group" style={{ marginBottom: '20px' }}>
                                                        <label style={{
                                                            display: 'block',
                                                            marginBottom: '8px',
                                                            fontSize: '14px',
                                                            fontWeight: '500',
                                                            color: '#334e6f'
                                                        }}>Qualification Required</label>
                                                        <input
                                                            type="text"
                                                            name="qualification"
                                                            className="form-control"
                                                            placeholder="Enter qualification"
                                                            value={jobData.qualification}
                                                            onChange={handleInputChange}
                                                            style={{
                                                                borderRadius: '8px',
                                                                border: '1px solid #e0e0e0',
                                                                padding: '12px 15px',
                                                                fontSize: '14px',
                                                                transition: 'all 0.3s'
                                                            }}
                                                            onFocus={(e) => e.target.style.borderColor = '#28a745'}
                                                            onBlur={(e) => e.target.style.borderColor = '#e0e0e0'}
                                                        />
                                                    </div>
                                                </div>
                                                <div className="col-md-6 col-sm-6 col-xs-12">
                                                    <div className="form-group" style={{ marginBottom: '20px' }}>
                                                        <label style={{
                                                            display: 'block',
                                                            marginBottom: '8px',
                                                            fontSize: '14px',
                                                            fontWeight: '500',
                                                            color: '#334e6f'
                                                        }}>Skills (Separate with Comma)</label>
                                                        <input
                                                            type="text"
                                                            name="skills"
                                                            className="form-control"
                                                            placeholder="Enter skills separated by comma"
                                                            value={jobData.skills}
                                                            onChange={handleInputChange}
                                                            style={{
                                                                borderRadius: '8px',
                                                                border: '1px solid #e0e0e0',
                                                                padding: '12px 15px',
                                                                fontSize: '14px',
                                                                transition: 'all 0.3s'
                                                            }}
                                                            onFocus={(e) => e.target.style.borderColor = '#28a745'}
                                                            onBlur={(e) => e.target.style.borderColor = '#e0e0e0'}
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    {/* Company Address */}
                                    <div className="box" style={{
                                        marginBottom: '30px',
                                        border: 'none',
                                        borderRadius: '8px',
                                        boxShadow: 'none',
                                        background: 'transparent'
                                    }}>
                                        <div className="box-header" style={{
                                            marginBottom: '25px',
                                            padding: '12px 15px',
                                            backgroundColor: '#f5f5f5',
                                            borderRadius: '6px'
                                        }}>
                                            <h4 style={{
                                                margin: 0,
                                                fontSize: '18px',
                                                fontWeight: '600',
                                                color: '#000000'
                                            }}><i className="ti-map-alt" style={{ marginRight: '8px', color: '#16a34a' }}></i>Company Address</h4>
                                        </div>
                                        <div className="box-body">
                                            <div className="row">
                                                <div className="col-md-4 col-sm-6 col-xs-12">
                                                    <div className="form-group" style={{ marginBottom: '20px' }}>
                                                        <label style={{
                                                            display: 'block',
                                                            marginBottom: '8px',
                                                            fontSize: '14px',
                                                            fontWeight: '500',
                                                            color: '#334e6f'
                                                        }}>Email</label>
                                                        <input
                                                            type="email"
                                                            name="email"
                                                            className="form-control"
                                                            placeholder="Enter email address"
                                                            value={jobData.email}
                                                            onChange={handleInputChange}
                                                            style={{
                                                                borderRadius: '8px',
                                                                border: '1px solid #e0e0e0',
                                                                padding: '12px 15px',
                                                                fontSize: '14px',
                                                                transition: 'all 0.3s'
                                                            }}
                                                            onFocus={(e) => e.target.style.borderColor = '#28a745'}
                                                            onBlur={(e) => e.target.style.borderColor = '#e0e0e0'}
                                                        />
                                                    </div>
                                                </div>
                                                <div className="col-md-4 col-sm-6 col-xs-12">
                                                    <div className="form-group" style={{ marginBottom: '20px' }}>
                                                        <label style={{
                                                            display: 'block',
                                                            marginBottom: '8px',
                                                            fontSize: '14px',
                                                            fontWeight: '500',
                                                            color: '#334e6f'
                                                        }}>Phone Number</label>
                                                        <input
                                                            type="text"
                                                            name="phone"
                                                            className="form-control"
                                                            placeholder="Enter phone number"
                                                            value={jobData.phone}
                                                            onChange={handleInputChange}
                                                            style={{
                                                                borderRadius: '8px',
                                                                border: '1px solid #e0e0e0',
                                                                padding: '12px 15px',
                                                                fontSize: '14px',
                                                                transition: 'all 0.3s'
                                                            }}
                                                            onFocus={(e) => e.target.style.borderColor = '#28a745'}
                                                            onBlur={(e) => e.target.style.borderColor = '#e0e0e0'}
                                                        />
                                                    </div>
                                                </div>
                                                <div className="col-md-4 col-sm-6 col-xs-12">
                                                    <div className="form-group" style={{ marginBottom: '20px' }}>
                                                        <label style={{
                                                            display: 'block',
                                                            marginBottom: '8px',
                                                            fontSize: '14px',
                                                            fontWeight: '500',
                                                            color: '#334e6f'
                                                        }}>Website Link</label>
                                                        <input
                                                            type="url"
                                                            name="website"
                                                            className="form-control"
                                                            placeholder="https://www.company.com"
                                                            value={jobData.website}
                                                            onChange={handleInputChange}
                                                            autoComplete="off"
                                                            data-form-type="other"
                                                            style={{
                                                                borderRadius: '8px',
                                                                border: '1px solid #e0e0e0',
                                                                padding: '12px 15px',
                                                                fontSize: '14px',
                                                                transition: 'all 0.3s'
                                                            }}
                                                            onFocus={(e) => e.target.style.borderColor = '#28a745'}
                                                            onBlur={(e) => e.target.style.borderColor = '#e0e0e0'}
                                                        />
                                                    </div>
                                                </div>
                                                {/* PinCode first, then Address, then City/State/Country (auto-filled) */}
                                                <div className="col-md-4 col-sm-6 col-xs-12">
                                                    <div className="form-group" style={{ marginBottom: '20px' }}>
                                                        <label style={{
                                                            display: 'block',
                                                            marginBottom: '8px',
                                                            fontSize: '14px',
                                                            fontWeight: '500',
                                                            color: '#334e6f'
                                                        }}>Pin Code</label>
                                                        <input
                                                            type="text"
                                                            name="zipCode"
                                                            className="form-control"
                                                            placeholder="Enter pin code"
                                                            value={jobData.zipCode}
                                                            onChange={handleInputChange}
                                                            maxLength={6}
                                                            style={{
                                                                borderRadius: '8px',
                                                                border: '1px solid #e0e0e0',
                                                                padding: '12px 15px',
                                                                fontSize: '14px',
                                                                transition: 'all 0.3s'
                                                            }}
                                                            onFocus={(e) => e.target.style.borderColor = '#28a745'}
                                                            onBlur={(e) => e.target.style.borderColor = '#e0e0e0'}
                                                        />
                                                    </div>
                                                </div>
                                                <div className="col-md-4 col-sm-6 col-xs-12">
                                                    <div className="form-group" style={{ marginBottom: '20px' }}>
                                                        <label style={{
                                                            display: 'block',
                                                            marginBottom: '8px',
                                                            fontSize: '14px',
                                                            fontWeight: '500',
                                                            color: '#334e6f'
                                                        }}>Address</label>
                                                        <input
                                                            type="text"
                                                            name="address"
                                                            className="form-control"
                                                            placeholder="Enter address"
                                                            value={jobData.address}
                                                            onChange={handleInputChange}
                                                            style={{
                                                                borderRadius: '8px',
                                                                border: '1px solid #e0e0e0',
                                                                padding: '12px 15px',
                                                                fontSize: '14px',
                                                                transition: 'all 0.3s'
                                                            }}
                                                            onFocus={(e) => e.target.style.borderColor = '#28a745'}
                                                            onBlur={(e) => e.target.style.borderColor = '#e0e0e0'}
                                                        />
                                                    </div>
                                                </div>
                                                <div className="col-md-4 col-sm-6 col-xs-12">
                                                    <div className="form-group" style={{ marginBottom: '20px' }}>
                                                        <label style={{
                                                            display: 'block',
                                                            marginBottom: '8px',
                                                            fontSize: '14px',
                                                            fontWeight: '500',
                                                            color: '#334e6f'
                                                        }}>City</label>
                                                        <input
                                                            type="text"
                                                            name="city"
                                                            className="form-control"
                                                            placeholder="City"
                                                            value={jobData.city}
                                                            onChange={handleInputChange}
                                                            readOnly
                                                            style={{
                                                                borderRadius: '8px',
                                                                border: '1px solid #e0e0e0',
                                                                padding: '12px 15px',
                                                                fontSize: '14px',
                                                                transition: 'all 0.3s',
                                                                backgroundColor: '#f5f5f5'
                                                            }}
                                                            onFocus={(e) => e.target.style.borderColor = '#28a745'}
                                                            onBlur={(e) => e.target.style.borderColor = '#e0e0e0'}
                                                        />
                                                    </div>
                                                </div>
                                                <div className="col-md-4 col-sm-6 col-xs-12">
                                                    <div className="form-group" style={{ marginBottom: '20px' }}>
                                                        <label style={{
                                                            display: 'block',
                                                            marginBottom: '8px',
                                                            fontSize: '14px',
                                                            fontWeight: '500',
                                                            color: '#334e6f'
                                                        }}>State</label>
                                                        <input
                                                            type="text"
                                                            name="state"
                                                            className="form-control"
                                                            placeholder="State"
                                                            value={jobData.state}
                                                            onChange={handleInputChange}
                                                            readOnly
                                                            style={{
                                                                borderRadius: '8px',
                                                                border: '1px solid #e0e0e0',
                                                                padding: '12px 15px',
                                                                fontSize: '14px',
                                                                transition: 'all 0.3s',
                                                                backgroundColor: '#f5f5f5'
                                                            }}
                                                            onFocus={(e) => e.target.style.borderColor = '#28a745'}
                                                            onBlur={(e) => e.target.style.borderColor = '#e0e0e0'}
                                                        />
                                                    </div>
                                                </div>
                                                <div className="col-md-4 col-sm-6 col-xs-12">
                                                    <div className="form-group" style={{ marginBottom: '20px' }}>
                                                        <label style={{
                                                            display: 'block',
                                                            marginBottom: '8px',
                                                            fontSize: '14px',
                                                            fontWeight: '500',
                                                            color: '#334e6f'
                                                        }}>Country</label>
                                                        <input
                                                            type="text"
                                                            name="country"
                                                            className="form-control"
                                                            placeholder="Country"
                                                            value={jobData.country}
                                                            onChange={handleInputChange}
                                                            readOnly
                                                            style={{
                                                                borderRadius: '8px',
                                                                border: '1px solid #e0e0e0',
                                                                padding: '12px 15px',
                                                                fontSize: '14px',
                                                                transition: 'all 0.3s',
                                                                backgroundColor: '#f5f5f5'
                                                            }}
                                                            onFocus={(e) => e.target.style.borderColor = '#28a745'}
                                                            onBlur={(e) => e.target.style.borderColor = '#e0e0e0'}
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    {/* Social Accounts */}
                                    <div className="box" style={{
                                        marginBottom: '30px',
                                        border: 'none',
                                        borderRadius: '8px',
                                        boxShadow: 'none',
                                        background: 'transparent'
                                    }}>
                                        <div className="box-header" style={{
                                            marginBottom: '25px',
                                            padding: '12px 15px',
                                            backgroundColor: '#f5f5f5',
                                            borderRadius: '6px'
                                        }}>
                                            <h4 style={{
                                                margin: 0,
                                                fontSize: '18px',
                                                fontWeight: '600',
                                                color: '#000000'
                                            }}><i className="ti-world" style={{ marginRight: '8px', color: '#16a34a' }}></i>Social Accounts</h4>
                                        </div>
                                        <div className="box-body">
                                            <div className="row">
                                                {/* First Row: Facebook and Google+ */}
                                                <div className="col-md-6 col-sm-6 col-xs-12">
                                                    <div className="form-group" style={{ marginBottom: '20px' }}>
                                                        <label style={{
                                                            display: 'block',
                                                            marginBottom: '8px',
                                                            fontSize: '14px',
                                                            fontWeight: '500',
                                                            color: '#334e6f',
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            gap: '6px'
                                                        }}>
                                                            <i className="ti-facebook" style={{ color: '#1877F2', fontSize: '16px' }}></i>
                                                            <span>Facebook</span>
                                                        </label>
                                                        <input
                                                            type="url"
                                                            name="facebook"
                                                            className="form-control"
                                                            placeholder="https://www.facebook.com/"
                                                            value={jobData.facebook}
                                                            onChange={handleInputChange}
                                                            style={{
                                                                borderRadius: '8px',
                                                                border: '1px solid #e0e0e0',
                                                                padding: '12px 15px',
                                                                fontSize: '14px',
                                                                transition: 'all 0.3s'
                                                            }}
                                                            onFocus={(e) => e.target.style.borderColor = '#28a745'}
                                                            onBlur={(e) => e.target.style.borderColor = '#e0e0e0'}
                                                        />
                                                    </div>
                                                </div>
                                                <div className="col-md-6 col-sm-6 col-xs-12">
                                                    <div className="form-group" style={{ marginBottom: '20px' }}>
                                                        <label style={{
                                                            display: 'block',
                                                            marginBottom: '8px',
                                                            fontSize: '14px',
                                                            fontWeight: '500',
                                                            color: '#334e6f',
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            gap: '6px'
                                                        }}>
                                                            <i className="ti-google" style={{ color: '#DB4437', fontSize: '16px' }}></i>
                                                            <span>Google +</span>
                                                        </label>
                                                        <input
                                                            type="url"
                                                            name="google"
                                                            className="form-control"
                                                            placeholder="https://www.gmail.com/"
                                                            value={jobData.google}
                                                            onChange={handleInputChange}
                                                            style={{
                                                                borderRadius: '8px',
                                                                border: '1px solid #e0e0e0',
                                                                padding: '12px 15px',
                                                                fontSize: '14px',
                                                                transition: 'all 0.3s'
                                                            }}
                                                            onFocus={(e) => e.target.style.borderColor = '#28a745'}
                                                            onBlur={(e) => e.target.style.borderColor = '#e0e0e0'}
                                                        />
                                                    </div>
                                                </div>
                                                {/* Second Row: Twitter and Instagram */}
                                                <div className="col-md-6 col-sm-6 col-xs-12">
                                                    <div className="form-group" style={{ marginBottom: '20px' }}>
                                                        <label style={{
                                                            display: 'block',
                                                            marginBottom: '8px',
                                                            fontSize: '14px',
                                                            fontWeight: '500',
                                                            color: '#334e6f',
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            gap: '6px'
                                                        }}>
                                                            <i className="ti-twitter" style={{ color: '#1DA1F2', fontSize: '16px' }}></i>
                                                            <span>Twitter</span>
                                                        </label>
                                                        <input
                                                            type="url"
                                                            name="twitter"
                                                            className="form-control"
                                                            placeholder="https://twitter.com/"
                                                            value={jobData.twitter}
                                                            onChange={handleInputChange}
                                                            style={{
                                                                borderRadius: '8px',
                                                                border: '1px solid #e0e0e0',
                                                                padding: '12px 15px',
                                                                fontSize: '14px',
                                                                transition: 'all 0.3s'
                                                            }}
                                                            onFocus={(e) => e.target.style.borderColor = '#28a745'}
                                                            onBlur={(e) => e.target.style.borderColor = '#e0e0e0'}
                                                        />
                                                    </div>
                                                </div>
                                                <div className="col-md-6 col-sm-6 col-xs-12">
                                                    <div className="form-group" style={{ marginBottom: '20px' }}>
                                                        <label style={{
                                                            display: 'block',
                                                            marginBottom: '8px',
                                                            fontSize: '14px',
                                                            fontWeight: '500',
                                                            color: '#334e6f',
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            gap: '6px'
                                                        }}>
                                                            <i className="ti-instagram" style={{ color: '#C13584', fontSize: '16px' }}></i>
                                                            <span>Instagram</span>
                                                        </label>
                                                        <input
                                                            type="url"
                                                            className="form-control"
                                                            name="instagram"
                                                            placeholder="http://instagram.com/"
                                                            value={jobData.instagram}
                                                            onChange={handleInputChange}
                                                            style={{
                                                                borderRadius: '8px',
                                                                border: '1px solid #e0e0e0',
                                                                padding: '12px 15px',
                                                                fontSize: '14px',
                                                                transition: 'all 0.3s'
                                                            }}
                                                            onFocus={(e) => e.target.style.borderColor = '#28a745'}
                                                            onBlur={(e) => e.target.style.borderColor = '#e0e0e0'}
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="text-center" style={{ marginTop: '30px' }}>
                                        <button 
                                            type="submit" 
                                            className="btn btn-m theme-btn"
                                            disabled={loading}
                                            style={{
                                                padding: '12px 40px',
                                                fontSize: '16px',
                                                fontWeight: '600',
                                                borderRadius: '8px',
                                                backgroundColor: '#28a745',
                                                border: 'none',
                                                color: '#fff',
                                                transition: 'all 0.3s',
                                                cursor: loading ? 'not-allowed' : 'pointer',
                                                opacity: loading ? 0.7 : 1
                                            }}
                                            onMouseEnter={(e) => {
                                                if (!loading) {
                                                    e.target.style.backgroundColor = '#218838';
                                                    e.target.style.transform = 'translateY(-2px)';
                                                    e.target.style.boxShadow = '0 4px 12px rgba(40, 167, 69, 0.3)';
                                                }
                                            }}
                                            onMouseLeave={(e) => {
                                                if (!loading) {
                                                    e.target.style.backgroundColor = '#28a745';
                                                    e.target.style.transform = 'translateY(0)';
                                                    e.target.style.boxShadow = 'none';
                                                }
                                            }}
                                        >
                                            {loading ? 'Posting Job...' : 'Submit'}
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    </div>
                </div>
            </section>
            {/* ====================== End Create Job ================ */}
            <Footer />
        </>
    );
}

export default AddJobs;
