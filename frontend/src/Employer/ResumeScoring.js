import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import Header from "../Components/Header";
import Footer from "../Components/Footer";
import EmployerSidebar from "./Sidebar";
import { API_BASE_URL } from "../config/api";

function ResumeScoring() {
    
    const { user, loading: authLoading } = useAuth();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');
    const [scoringStatus, setScoringStatus] = useState(null);
    const [jobs, setJobs] = useState([]);
    const [selectedJobId, setSelectedJobId] = useState('');
    const [scoringResults, setScoringResults] = useState([]);
    const [selectedApplications, setSelectedApplications] = useState([]);

    useEffect(() => {
        if (!user) {
            navigate('/');
            return;
        }
        if (user.role !== 'provider') {
            navigate('/');
            return;
        }
        loadScoringStatus();
        loadJobs();
    }, [user, navigate]);

    const loadScoringStatus = async () => {
        try {
            const token = localStorage.getItem('token');
            if (!token) return;
            const response = await fetch(`${API_BASE_URL}/api/search/resume-scoring/status`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Accept': 'application/json'
                },
                credentials: 'include'
            });
            if (response.ok) {
                const data = await response.json();
                setScoringStatus(data);
            }
        } catch (error) {
            console.error('Error loading scoring status:', error);
        }
    };

    const loadJobs = async () => {
        try {
            const token = localStorage.getItem('token');
            if (!token) return;
            const response = await fetch(`${API_BASE_URL}/api/employer/jobs?status=active&limit=100`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Accept': 'application/json'
                },
                credentials: 'include'
            });
            if (response.ok) {
                const data = await response.json();
                setJobs(data.jobs || []);
            }
        } catch (error) {
            console.error('Error loading jobs:', error);
        }
    };

    const loadApplicationsForJob = async (jobId) => {
        try {
            const token = localStorage.getItem('token');
            if (!token) return;
            const response = await fetch(`${API_BASE_URL}/api/employer/applications`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Accept': 'application/json'
                },
                credentials: 'include'
            });
            if (response.ok) {
                const data = await response.json();
                const jobApplications = (data.applications || []).filter(app => app.job_id === parseInt(jobId));
                setSelectedApplications(jobApplications);
            }
        } catch (error) {
            console.error('Error loading applications:', error);
        }
    };

    useEffect(() => {
        if (selectedJobId) {
            loadApplicationsForJob(selectedJobId);
        } else {
            setSelectedApplications([]);
        }
    }, [selectedJobId]);

    const handleScoreResumes = async (e) => {
        e.preventDefault();
        setLoading(true);
        setMessage('');
        setScoringResults([]);

        if (!selectedJobId) {
            setMessage('Please select a job first.');
            setLoading(false);
            return;
        }

        try {
            const token = localStorage.getItem('token');
            if (!token) {
                setMessage('Please login again');
                setLoading(false);
                return;
            }

            const applicationIds = selectedApplications.map(app => app.id);

            const response = await fetch(`${API_BASE_URL}/api/search/resume-scoring`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                body: JSON.stringify({
                    jobId: selectedJobId,
                    applicationIds: applicationIds.length > 0 ? applicationIds : undefined
                }),
                credentials: 'include'
            });

            const data = await response.json();

            if (response.ok) {
                setScoringResults(data.results || []);
                loadScoringStatus(); // Reload status after scoring
                setMessage(`Successfully scored ${data.results.length} resumes!`);
                setTimeout(() => setMessage(''), 3000);
            } else {
                if (data.upgradeRequired) {
                    setMessage(data.message || 'Daily limit reached. Upgrade to premium for unlimited usage.');
                    setTimeout(() => {
                        navigate('/employer/premium');
                    }, 2000);
                } else {
                    setMessage(data.message || 'Scoring failed. Please try again.');
                }
                setTimeout(() => setMessage(''), 5000);
            }
        } catch (error) {
            console.error('Error scoring resumes:', error);
            setMessage('Scoring failed. Please try again.');
            setTimeout(() => setMessage(''), 5000);
        } finally {
            setLoading(false);
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
                </div>
            </div>
        );
    }

    if (!user || user.role !== 'provider') {
        return (
            <div className="container" style={{padding: '50px', textAlign: 'center'}}>
                <h2>Please login as an employer to access this feature</h2>
                <button onClick={() => navigate('/')} className="btn btn-primary">Go to Home</button>
            </div>
        );
    }

    const isPremium = scoringStatus?.isPremium ?? true;
    const dailyLimit = scoringStatus?.dailyLimit ?? 999;
    const dailyUsage = scoringStatus?.dailyUsage ?? 0;
    const remaining = scoringStatus?.remaining ?? 999;
    const canUse = scoringStatus?.canUse ?? true;

    return (
        <>
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
                .rs-futuristic-card {
                    border: 1px solid #e2e8f0;
                    border-radius: 12px;
                    overflow: hidden;
                    box-shadow: 0 8px 24px rgba(15, 23, 42, 0.08);
                }
                .rs-futuristic-card .card-header {
                    background: linear-gradient(90deg, #f8fafc 0%, #eef6ff 100%);
                    border-bottom: 1px solid #e2e8f0;
                    padding: 14px 18px;
                }
                .rs-futuristic-card .card-header h4 {
                    margin: 0;
                    font-size: 18px;
                    font-weight: 700;
                    color: #0f172a;
                    letter-spacing: 0.2px;
                }
                .rs-form label {
                    font-weight: 600;
                    color: #1f3b5b;
                    display: inline-flex;
                    align-items: center;
                    gap: 6px;
                }
                .rs-form .form-control {
                    border: 1px solid #dbe5f1;
                    border-radius: 10px;
                    box-shadow: 0 1px 2px rgba(15, 23, 42, 0.03);
                }
                .rs-form .form-control:focus {
                    border-color: #22c55e;
                    box-shadow: 0 0 0 3px rgba(34, 197, 94, 0.12);
                }
                .rs-table thead th {
                    font-weight: 700;
                    font-size: 12px;
                    text-transform: uppercase;
                    letter-spacing: 0.45px;
                    color: #334155;
                    background: #f8fafc;
                    border-bottom: 1px solid #dbe5f1;
                }
                .rs-table tbody td { vertical-align: middle; }
                .rs-table tbody tr:hover { background: #f8fbff; }
            `}</style>
            <section className="padd-top-80 padd-bot-80">
                <div className="container">
                    {message && (
                        <div className={`alert ${message.includes('Successfully') ? 'alert-success' : 'alert-danger'}`} 
                            style={{marginBottom: '20px'}}>
                            {message}
                        </div>
                    )}

                    <div className="row">
                        <div className="col-md-3 employer-dashboard-sidebar">
                            <EmployerSidebar active="resume-scoring" />
                        </div>

                        <div className="col-md-9 employer-dashboard-main">
                            <div className="row">
                                <div className="col-md-6">
                                    <div className="card rs-futuristic-card" style={{marginBottom: '20px'}}>
                                        <div className="card-header">
                                            <h4><i className="ti-bar-chart" style={{ marginRight: 8, color: '#16a34a' }} />Usage Status</h4>
                                        </div>
                                        <div className="card-body">
                                            <p><strong>Plan:</strong> {isPremium ? 'Enterprise Access' : 'Full Access'}</p>
                                            <p className="text-success">✓ Unlimited Resume Scoring (billing paused)</p>
                                            <p><strong>Used Today:</strong> {dailyUsage}</p>
                                            <p><strong>Remaining:</strong> {remaining}</p>
                                        </div>
                                    </div>
                                </div>
                                <div className="col-md-6">
                                    <div className="card rs-futuristic-card" style={{marginBottom: '20px'}}>
                                        <div className="card-header">
                                            <h4><i className="ti-light-bulb" style={{ marginRight: 8, color: '#16a34a' }} />How It Works</h4>
                                        </div>
                                        <div className="card-body">
                                            <p>Resume scoring automatically evaluates candidates based on:</p>
                                            <ul>
                                                <li>Skills match (40 points)</li>
                                                <li>Experience (20 points)</li>
                                                <li>Education (20 points)</li>
                                                <li>Profile completeness (20 points)</li>
                                            </ul>
                                            <p><small>Candidates are ranked by their total score (0-100).</small></p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className="card rs-futuristic-card">
                                <div className="card-header">
                                    <h4><i className="ti-medall" style={{ marginRight: 8, color: '#16a34a' }} />Score Resumes</h4>
                                </div>
                                <div className="card-body">
                                    <form onSubmit={handleScoreResumes} className="rs-form">
                                        <div className="form-group">
                                            <label><i className="ti-briefcase" style={{ color: '#16a34a' }} />Select Job *</label>
                                            <select 
                                                className="form-control"
                                                value={selectedJobId}
                                                onChange={(e) => setSelectedJobId(e.target.value)}
                                                required
                                            >
                                                <option value="">-- Select a Job --</option>
                                                {jobs.map(job => (
                                                    <option key={job.id} value={job.id}>
                                                        {job.job_title} - {job.company_name}
                                                    </option>
                                                ))}
                                            </select>
                                            <small className="form-text text-muted">
                                                Select a job to score all applications for that position
                                            </small>
                                        </div>

                                        {selectedJobId && selectedApplications.length > 0 && (
                                            <div className="form-group">
                                                <label><i className="ti-clipboard" style={{ color: '#16a34a' }} />Applications Found: {selectedApplications.length}</label>
                                                <div style={{maxHeight: '200px', overflowY: 'auto', border: '1px solid #ddd', padding: '10px', borderRadius: '5px'}}>
                                                    {selectedApplications.map(app => (
                                                        <div key={app.id} style={{padding: '5px'}}>
                                                            <strong>{app.name || app.email}</strong> - {app.job_title}
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        {selectedJobId && selectedApplications.length === 0 && (
                                            <div className="alert alert-info">
                                                No applications found for this job.
                                            </div>
                                        )}

                                        <button 
                                            type="submit" 
                                            className="btn btn-primary" 
                                            disabled={loading || !canUse || !selectedJobId || selectedApplications.length === 0}
                                        >
                                            {loading ? 'Scoring...' : 'Score Resumes'}
                                        </button>
                                    </form>
                                </div>
                            </div>

                            {scoringResults.length > 0 && (
                                <div className="card rs-futuristic-card" style={{marginTop: '20px'}}>
                                    <div className="card-header">
                                        <h4><i className="ti-crown" style={{ marginRight: 8, color: '#16a34a' }} />Scoring Results (Ranked by Score)</h4>
                                    </div>
                                    <div className="card-body">
                                        <div className="table-responsive">
                                            <table className="table table-striped rs-table">
                                                <thead>
                                                    <tr>
                                                        <th>Rank</th>
                                                        <th>Candidate</th>
                                                        <th>Email</th>
                                                        <th>Score</th>
                                                        <th>Details</th>
                                                        <th>Actions</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {scoringResults.map((result, index) => (
                                                        <tr key={result.applicationId}>
                                                            <td>
                                                                <strong>#{index + 1}</strong>
                                                            </td>
                                                            <td>{result.candidateName}</td>
                                                            <td>{result.candidateEmail}</td>
                                                            <td>
                                                                <div className="progress" style={{width: '100px', height: '20px'}}>
                                                                    <div 
                                                                        className={`progress-bar ${result.score >= 70 ? 'bg-success' : result.score >= 50 ? 'bg-warning' : 'bg-danger'}`}
                                                                        role="progressbar"
                                                                        style={{width: `${result.score}%`}}
                                                                    >
                                                                        {result.score}/{result.maxScore}
                                                                    </div>
                                                                </div>
                                                            </td>
                                                            <td>
                                                                <button 
                                                                    className="btn btn-sm btn-info"
                                                                    onClick={() => {
                                                                        const details = result.reasons.join('\n');
                                                                        alert(`Scoring Details:\n\n${details}`);
                                                                    }}
                                                                >
                                                                    View Details
                                                                </button>
                                                            </td>
                                                            <td>
                                                                {result.resumeUrl && (
                                                                    <a 
                                                                        href={`${API_BASE_URL}${result.resumeUrl}`} 
                                                                        target="_blank" 
                                                                        rel="noopener noreferrer" 
                                                                        className="btn btn-sm btn-primary"
                                                                    >
                                                                        View Resume
                                                                    </a>
                                                                )}
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </section>

            <Footer />
        </>
    );
}

export default ResumeScoring;

