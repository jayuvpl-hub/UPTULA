// import React, { useCallback, useEffect, useMemo, useState } from "react";
// import { useNavigate } from "react-router-dom";
// import {
//   ResponsiveContainer,
//   PieChart,
//   Pie,
//   Cell,
//   BarChart,
//   Bar,
//   CartesianGrid,
//   XAxis,
//   YAxis,
//   Tooltip,
//   Legend,
// } from "recharts";
// import Header from "../Components/Header";
// import Footer from "../Components/Footer";
// import EmployerSidebar from "./Sidebar";
// import { useAuth } from "../context/AuthContext";
// import { API_BASE_URL } from "../config/api";

// const PIE_COLORS = ["#6366f1", "#f97316"];
// const BAR_COLORS = {
//   Fresher: "#a78bfa",
//   Experienced: "#34d399",
// };

// const LoadingView = () => (
//   <div
//     style={{
//       display: "flex",
//       justifyContent: "center",
//       alignItems: "center",
//       minHeight: "50vh",
//     }}
//   >
//     <div className="text-center">
//       <div className="lds-ring">
//         <div />
//         <div />
//         <div />
//         <div />
//       </div>
//       <p style={{ marginTop: "12px", color: "#4b5563" }}>Crunching numbers...</p>
//     </div>
//     <style>
//       {`
//         .lds-ring {
//           display: inline-block;
//           position: relative;
//           width: 64px;
//           height: 64px;
//         }
//         .lds-ring div {
//           box-sizing: border-box;
//           display: block;
//           position: absolute;
//           width: 51px;
//           height: 51px;
//           margin: 6px;
//           border: 6px solid #6366f1;
//           border-radius: 50%;
//           animation: lds-ring 1.2s cubic-bezier(0.5, 0, 0.5, 1) infinite;
//           border-color: #6366f1 transparent transparent transparent;
//         }
//         .lds-ring div:nth-child(1) { animation-delay: -0.45s; }
//         .lds-ring div:nth-child(2) { animation-delay: -0.3s; }
//         .lds-ring div:nth-child(3) { animation-delay: -0.15s; }
//         @keyframes lds-ring {
//           0% { transform: rotate(0deg); }
//           100% { transform: rotate(360deg); }
//         }
//       `}
//     </style>
//   </div>
// );

// function Analytics() {
  
//   const navigate = useNavigate();
//   const { user, loading: authLoading } = useAuth();

//   const [loading, setLoading] = useState(true);
//   const [jobs, setJobs] = useState([]);
//   const [summary, setSummary] = useState(null);
//   const [access, setAccess] = useState(null);
//   const [selectedJobId, setSelectedJobId] = useState(null);
//   const [error, setError] = useState("");
//   const [showUpgradeInfo, setShowUpgradeInfo] = useState(false);
//   const [isPro, setIsPro] = useState(false);

//   const fetchAnalytics = useCallback(async () => {
//     const token = localStorage.getItem("token");
//     if (!token) {
//       setError("Please login to view analytics.");
//       setLoading(false);
//       return;
//     }

//     setLoading(true);
//     setError("");

//     try {
//       const response = await fetch(
//         `${API_BASE_URL}/api/employer/analytics/summary`,
//         {
//           headers: {
//             Authorization: `Bearer ${token}`,
//           },
//         }
//       );

//       if (response.status === 402) {
//         const paywallData = await response.json();
//         setAccess(paywallData.access || null);
//         setJobs([]);
//         setSummary(null);
//         setSelectedJobId(null);
//         setError(
//           paywallData.message ||
//             "Analytics temporarily unavailable. Please try again shortly."
//         );
//       } else if (response.ok) {
//         const data = await response.json();
//         setJobs(data.jobs || []);
//         setSummary(data.summary || null);
//         setAccess(data.access || null);
//         setSelectedJobId((prev) => {
//           if (prev && data.jobs?.some((job) => job.jobId === prev)) {
//             return prev;
//           }
//           return data.jobs?.[0]?.jobId || null;
//         });
//       } else {
//         const text = await response.text();
//         throw new Error(text || "Unable to load analytics.");
//       }
//     } catch (err) {
//       setError(err.message || "Unable to load analytics.");
//     } finally {
//       setLoading(false);
//     }
//   }, [API_BASE_URL]);

//   useEffect(() => {
//     if (authLoading) return;
//     if (!user) {
//       navigate("/");
//       return;
//     }
//     if (user.role !== "provider") {
//       navigate("/");
//       return;
//     }
//     fetchAnalytics();
//   }, [authLoading, user, navigate, fetchAnalytics]);

//   const selectedJob = useMemo(
//     () => jobs.find((job) => job.jobId === selectedJobId) || null,
//     [jobs, selectedJobId]
//   );

//   const compositionSource = selectedJob || summary;
//   const pieData = useMemo(() => {
//     if (!compositionSource) return [];
//     return [
//       { name: "Experienced", value: compositionSource.experiencedCount || 0 },
//       { name: "Fresher", value: compositionSource.fresherCount || 0 },
//     ];
//   }, [compositionSource]);

//   const barData = useMemo(
//     () =>
//       jobs.map((job) => ({
//         name: job.jobTitle,
//         Fresher: job.fresherCount,
//         Experienced: job.experiencedCount,
//         Chance: job.chanceScore,
//       })),
//     [jobs]
//   );

//   if (authLoading || loading) {
//     return (
//       <>
//         <Header />
//         <section className="padd-top-80 padd-bot-80">
//           <div className="container">
//             <LoadingView />
//           </div>
//         </section>
//         <Footer />
//       </>
//     );
//   }

//   if (!user) {
//     return (
//       <div className="container" style={{ padding: "60px", textAlign: "center" }}>
//         <h2>Please login to access analytics</h2>
//         <button onClick={() => navigate("/")} className="btn btn-primary">
//           Go to Home
//         </button>
//       </div>
//     );
//   }

//   return (
//     <>
//       <Header />
//       <style>{`
//         @media (max-width: 991px) {
//           .employer-dashboard-sidebar { display: none !important; }
//           .employer-dashboard-main {
//             width: 100% !important;
//             max-width: 100% !important;
//             float: none !important;
//           }
//         }
//       `}</style>
//       <section className="padd-top-80 padd-bot-80" style={{ background: "#f7f8fb" }}>
//         <div className="container">
//           <div className="row">
//             <div className="col-md-3 employer-dashboard-sidebar">
//               <EmployerSidebar active="analytics" />
//             </div>
//             <div className="col-md-9 employer-dashboard-main">
//               <div className="analytics-panel">
//                 <div className="analytics-panel__head">
//                   <div>
//                     <p className="analytics-panel__eyebrow">Premium Feature</p>
//                     <h2>Job Analytics & Candidate Pulse</h2>
//                     <p className="analytics-panel__subtext">
//                       Track total applicants, fresher vs experienced distribution, and the
//                       percentage chance of fills for each job.
//                     </p>
//                   </div>
//                   <button
//                     className="analytics-panel__badge"
//                     onClick={() => {
//                       setIsPro((prev) => !prev);
//                       setShowUpgradeInfo(true);
//                     }}
//                     title="You have 10 premium accesses remaining"
//                     aria-label={isPro ? "Pro plan" : "Upgrade to premium"}
//                   >
//                     {isPro ? "Pro Plan" : "Upgrade"}
//                   </button>
//                 </div>

//                 {showUpgradeInfo && (
//                   <div className="analytics-upgrade-info" role="status">
//                     <div>
//                       <strong>You have 10 premium accesses remaining</strong>
//                       <p style={{ margin: 0, color: "#475569" }}>
//                         Your current page and analytics logic remain unchanged.
//                       </p>
//                     </div>
//                     <div>
//                       <button
//                         className="btn btn-sm"
//                         onClick={() => setShowUpgradeInfo(false)}
//                         style={{ marginLeft: 12 }}
//                       >
//                         Close
//                       </button>
//                     </div>
//                   </div>
//                 )}

//                 {error && (
//                   <div className="alert alert-danger" style={{ marginBottom: 20 }}>
//                     {error}
//                   </div>
//                 )}

//                 {access && (
//                   <div className="analytics-access">
//                     <div>
//                       <p className="analytics-access__title">
//                         Premium analytics unlocked for all employers
//                       </p>
//                       <p className="analytics-access__meta">
//                         Billing is paused, so your account enjoys unlimited analytics
//                         access by default.
//                       </p>
//                     </div>
//                   </div>
//                 )}

//                 {jobs.length === 0 && (
//                   <div className="analytics-empty">
//                     <h4>No applicant data yet</h4>
//                     <p>
//                       Post a job or wait for candidates to apply to start seeing analytics.
//                     </p>
//                     <button
//                       className="btn btn-m theme-btn"
//                       onClick={() => navigate("/employer/add-jobs")}
//                     >
//                       Post a job
//                     </button>
//                   </div>
//                 )}

//                 {jobs.length > 0 && (
//                   <>
//                     <div className="analytics-summary-cards">
//                       <div className="analytics-card">
//                         <p>Total applicants</p>
//                         <h3>{summary?.totalApplications || 0}</h3>
//                         <small>Across {summary?.totalJobs || 0} active jobs</small>
//                       </div>
//                       <div className="analytics-card">
//                         <p>Fresher vs Experienced</p>
//                         <h3>
//                           {summary?.fresherPercentage || 0}% /{" "}
//                           {summary?.experiencedPercentage || 0}%
//                         </h3>
//                         <small>Fresher / Experienced mix</small>
//                       </div>
//                       <div className="analytics-card">
//                         <p>Average fill chance</p>
//                         <h3>{summary?.averageChance || 0}%</h3>
//                         <small>Applications per vacancy</small>
//                       </div>
//                     </div>

//                     <div className="analytics-jobs">
//                       <p>Select a job to deep dive</p>
//                       <div className="analytics-jobs__chips">
//                         {jobs.map((job) => (
//                           <button
//                             key={job.jobId}
//                             className={`analytics-chip ${
//                               selectedJobId === job.jobId ? "analytics-chip--active" : ""
//                             }`}
//                             onClick={() => setSelectedJobId(job.jobId)}
//                           >
//                             <span>{job.jobTitle}</span>
//                             <small>{job.totalApplications} applicants</small>
//                           </button>
//                         ))}
//                       </div>
//                     </div>

//                     {selectedJob && (
//                       <div className="analytics-detail-grid">
//                         <div className="analytics-visual">
//                           <h4>Experience distribution</h4>
//                           <ResponsiveContainer width="100%" height={260}>
//                             <PieChart>
//                               <Pie
//                                 data={pieData}
//                                 innerRadius={60}
//                                 outerRadius={100}
//                                 paddingAngle={3}
//                                 dataKey="value"
//                               >
//                                 {pieData.map((entry, index) => (
//                                   <Cell
//                                     key={`cell-${entry.name}`}
//                                     fill={PIE_COLORS[index % PIE_COLORS.length]}
//                                   />
//                                 ))}
//                               </Pie>
//                               <Tooltip formatter={(value) => `${value} applicants`} />
//                               <Legend />
//                             </PieChart>
//                           </ResponsiveContainer>
//                         </div>
//                         <div className="analytics-chance">
//                           <p>Fill chance</p>
//                           <h2>{selectedJob.chanceScore}%</h2>
//                           <p className="analytics-chance__meta">
//                             {selectedJob.totalApplications} applicants vs{" "}
//                             {selectedJob.noOfVacancy} vacancy slots
//                           </p>
//                           <div className="progress">
//                             <div
//                               className="progress-bar"
//                               role="progressbar"
//                               style={{ width: `${selectedJob.chanceScore}%` }}
//                               aria-valuenow={selectedJob.chanceScore}
//                               aria-valuemin="0"
//                               aria-valuemax="100"
//                             ></div>
//                           </div>
//                           <small>
//                             Higher chance means more applicants per opening (capped at 100%).
//                           </small>
//                         </div>
//                       </div>
//                     )}

//                     <div className="analytics-bar-chart">
//                       <h4>Applicants per job</h4>
//                       <ResponsiveContainer width="100%" height={320}>
//                         <BarChart data={barData} margin={{ top: 20, right: 20, left: 0, bottom: 5 }}>
//                           <CartesianGrid strokeDasharray="3 3" />
//                           <XAxis dataKey="name" tick={{ fontSize: 12 }} />
//                           <YAxis allowDecimals={false} />
//                           <Tooltip />
//                           <Legend />
//                           <Bar dataKey="Fresher" stackId="a" fill={BAR_COLORS.Fresher} />
//                           <Bar dataKey="Experienced" stackId="a" fill={BAR_COLORS.Experienced} />
//                         </BarChart>
//                       </ResponsiveContainer>
//                     </div>
//                   </>
//                 )}
//               </div>
//             </div>
//           </div>
//         </div>
//       </section>
//       <Footer />
//       <style>
//         {`
//           .analytics-panel {
//             background: #fff;
//             border-radius: 18px;
//             padding: 30px;
//             box-shadow: 0 25px 60px rgba(15, 23, 42, 0.08);
//           }
//           .analytics-panel__head {
//             display: flex;
//             justify-content: space-between;
//             gap: 20px;
//             flex-wrap: wrap;
//           }
//           .analytics-panel__eyebrow {
//             text-transform: uppercase;
//             letter-spacing: 0.2em;
//             color: #94a3b8;
//             font-weight: 600;
//           }
//           .analytics-panel__subtext {
//             color: #475569;
//             max-width: 540px;
//           }
//           .analytics-panel__badge {
//             background: linear-gradient(135deg, #6366f1, #f97316);
//             color: #fff;
//             padding: 10px 20px;
//             border-radius: 999px;
//             font-weight: 600;
//             align-self: flex-start;
//           }
//           .analytics-access {
//             margin: 24px 0;
//             padding: 18px 24px;
//             border-radius: 14px;
//             background: #eef2ff;
//             display: flex;
//             justify-content: space-between;
//             align-items: center;
//             gap: 16px;
//             flex-wrap: wrap;
//           }
//           .analytics-access__title {
//             margin: 0;
//             font-weight: 600;
//             color: #312e81;
//           }
//           .analytics-access__meta {
//             margin: 4px 0 0;
//             color: #4c1d95;
//           }
//           .analytics-paywall {
//             border: 1px dashed #f97316;
//             padding: 20px;
//             border-radius: 14px;
//             background: #fff7ed;
//             display: flex;
//             justify-content: space-between;
//             gap: 16px;
//             align-items: center;
//             flex-wrap: wrap;
//             margin-bottom: 24px;
//           }
//           .analytics-empty {
//             text-align: center;
//             padding: 40px;
//             border-radius: 16px;
//             background: #f8fafc;
//             border: 1px dashed #cbd5f5;
//           }
//           .analytics-summary-cards {
//             display: grid;
//             grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
//             gap: 16px;
//             margin-top: 20px;
//           }
//           .analytics-card {
//             background: #131736;
//             color: #fff;
//             padding: 20px;
//             border-radius: 16px;
//           }
//           .analytics-card p {
//             margin: 0;
//             text-transform: uppercase;
//             font-size: 0.75rem;
//             letter-spacing: 0.2em;
//             color: #c7d2fe;
//           }
//           .analytics-card h3 {
//             margin: 10px 0 4px;
//             font-size: 1.8rem;
//           }
//           .analytics-card small {
//             color: #94a3b8;
//           }
//           .analytics-jobs {
//             margin: 30px 0 10px;
//           }
//           .analytics-jobs__chips {
//             display: flex;
//             flex-wrap: wrap;
//             gap: 10px;
//             margin-top: 10px;
//           }
//           .analytics-chip {
//             border: 1px solid #e2e8f0;
//             border-radius: 999px;
//             padding: 10px 18px;
//             background: #fff;
//             display: flex;
//             flex-direction: column;
//             align-items: flex-start;
//             gap: 2px;
//           }
//           .analytics-chip small {
//             color: #94a3b8;
//             font-size: 0.75rem;
//           }
//           .analytics-chip--active {
//             border-color: #6366f1;
//             background: #eef2ff;
//           }
//           .analytics-detail-grid {
//             display: grid;
//             grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
//             gap: 20px;
//             align-items: stretch;
//             margin-top: 20px;
//           }
//           .analytics-visual,
//           .analytics-chance {
//             background: #fff;
//             border: 1px solid #e2e8f0;
//             border-radius: 16px;
//             padding: 20px;
//           }
//           .analytics-chance h2 {
//             font-size: 3rem;
//             margin: 4px 0;
//             color: #0f172a;
//           }
//           .analytics-chance__meta {
//             color: #475569;
//           }
//           .analytics-bar-chart {
//             margin-top: 30px;
//             background: #fff;
//             border-radius: 16px;
//             padding: 20px;
//             border: 1px solid #e2e8f0;
//           }
//           @media (max-width: 767px) {
//             .analytics-panel {
//               padding: 20px;
//             }
//             .analytics-summary-cards {
//               grid-template-columns: 1fr;
//             }
//           }
//         `}
//       </style>
//     </>
//   );
// }

// export default Analytics;
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
} from "recharts";
import Header from "../Components/Header";
import Footer from "../Components/Footer";
import EmployerSidebar from "./Sidebar";
import { useAuth } from "../context/AuthContext";
import { API_BASE_URL } from "../config/api";

const PIE_COLORS = ["#6366f1", "#f97316"];
const BAR_COLORS = {
  Fresher: "#a78bfa",
  Experienced: "#34d399",
};

// ---- Dummy plan data (replace with real plans later) ----
const DUMMY_PLAN = {
  name: "Recruiter Pro",
  duration: "30 days",
  price: 499, // in INR
  gst: 90, // 18% dummy GST
  features: [
    "Unlimited analytics access",
    "Fresher vs Experienced breakdown",
    "Fill-chance score per job",
    "Priority job listing",
  ],
};

const LoadingView = () => (
  <div
    style={{
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      minHeight: "50vh",
    }}
  >
    <div className="text-center">
      <div className="lds-ring">
        <div />
        <div />
        <div />
        <div />
      </div>
      <p style={{ marginTop: "12px", color: "#4b5563" }}>Crunching numbers...</p>
    </div>
    <style>
      {`
        .lds-ring {
          display: inline-block;
          position: relative;
          width: 64px;
          height: 64px;
        }
        .lds-ring div {
          box-sizing: border-box;
          display: block;
          position: absolute;
          width: 51px;
          height: 51px;
          margin: 6px;
          border: 6px solid #6366f1;
          border-radius: 50%;
          animation: lds-ring 1.2s cubic-bezier(0.5, 0, 0.5, 1) infinite;
          border-color: #6366f1 transparent transparent transparent;
        }
        .lds-ring div:nth-child(1) { animation-delay: -0.45s; }
        .lds-ring div:nth-child(2) { animation-delay: -0.3s; }
        .lds-ring div:nth-child(3) { animation-delay: -0.15s; }
        @keyframes lds-ring {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}
    </style>
  </div>
);

// ---- Upgrade / Payment Modal (dummy Razorpay-style flow) ----
function UpgradeModal({ user, onClose, onSuccess }) {
  // step: "details" -> "processing" -> "success"
  const [step, setStep] = useState("details");
  const [form, setForm] = useState({
    name: user?.name || "",
    phone: user?.phone || "",
    email: user?.email || "",
  });

  const total = DUMMY_PLAN.price + DUMMY_PLAN.gst;

  const handleChange = (field) => (e) => {
    setForm((prev) => ({ ...prev, [field]: e.target.value }));
  };

  const handlePay = (e) => {
    e.preventDefault();
    if (!form.name || !form.phone) return;

    setStep("processing");

    // Simulate Razorpay checkout + server verification delay
    setTimeout(() => {
      setStep("success");
      // Simulate webhook/verify confirming the plan, then close
      setTimeout(() => {
        onSuccess();
      }, 1200);
    }, 1500);
  };

  return (
    <div className="upgrade-modal__overlay" onClick={step === "details" ? onClose : undefined}>
      <div className="upgrade-modal__box" onClick={(e) => e.stopPropagation()}>
        {step !== "processing" && (
          <button className="upgrade-modal__close" onClick={onClose} aria-label="Close">
            &times;
          </button>
        )}

        {step === "details" && (
          <>
            <p className="upgrade-modal__eyebrow">Upgrade Plan</p>
            <h3 className="upgrade-modal__title">{DUMMY_PLAN.name}</h3>
            <p className="upgrade-modal__sub">{DUMMY_PLAN.duration} validity</p>

            <ul className="upgrade-modal__features">
              {DUMMY_PLAN.features.map((f) => (
                <li key={f}>{f}</li>
              ))}
            </ul>

            <div className="upgrade-modal__priceRow">
              <span>Plan price</span>
              <span>₹{DUMMY_PLAN.price}</span>
            </div>
            <div className="upgrade-modal__priceRow">
              <span>GST (18%)</span>
              <span>₹{DUMMY_PLAN.gst}</span>
            </div>
            <div className="upgrade-modal__priceRow upgrade-modal__priceRow--total">
              <span>Total</span>
              <span>₹{total}</span>
            </div>

            <form onSubmit={handlePay} className="upgrade-modal__form">
              <label>
                Full name
                <input
                  type="text"
                  value={form.name}
                  onChange={handleChange("name")}
                  placeholder="Your name"
                  required
                />
              </label>
              <label>
                Phone number
                <input
                  type="tel"
                  value={form.phone}
                  onChange={handleChange("phone")}
                  placeholder="10-digit mobile number"
                  required
                />
              </label>
              <label>
                Email (optional)
                <input
                  type="email"
                  value={form.email}
                  onChange={handleChange("email")}
                  placeholder="you@example.com"
                />
              </label>

              <button type="submit" className="upgrade-modal__payBtn">
                Pay ₹{total}
              </button>
              <p className="upgrade-modal__note">
                Test mode — this simulates Razorpay checkout, no real payment is made.
              </p>
            </form>
          </>
        )}

        {step === "processing" && (
          <div className="upgrade-modal__processing">
            <div className="upgrade-modal__spinner" />
            <p>Processing your payment...</p>
            <small>Do not close this window</small>
          </div>
        )}

        {step === "success" && (
          <div className="upgrade-modal__success">
            <div className="upgrade-modal__checkmark">✓</div>
            <h3>Payment successful</h3>
            <p>
              {DUMMY_PLAN.name} activated for {DUMMY_PLAN.duration}.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

function Analytics() {
  
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();

  const [loading, setLoading] = useState(true);
  const [jobs, setJobs] = useState([]);
  const [summary, setSummary] = useState(null);
  const [access, setAccess] = useState(null);
  const [selectedJobId, setSelectedJobId] = useState(null);
  const [error, setError] = useState("");
  const [showUpgradeInfo, setShowUpgradeInfo] = useState(false);
  const [isPro, setIsPro] = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false); // NEW

  const fetchAnalytics = useCallback(async () => {
    const token = localStorage.getItem("token");
    if (!token) {
      setError("Please login to view analytics.");
      setLoading(false);
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response = await fetch(
        `${API_BASE_URL}/api/employer/analytics/summary`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.status === 402) {
        const paywallData = await response.json();
        setAccess(paywallData.access || null);
        setJobs([]);
        setSummary(null);
        setSelectedJobId(null);
        setError(
          paywallData.message ||
            "Analytics temporarily unavailable. Please try again shortly."
        );
      } else if (response.ok) {
        const data = await response.json();
        setJobs(data.jobs || []);
        setSummary(data.summary || null);
        setAccess(data.access || null);
        setSelectedJobId((prev) => {
          if (prev && data.jobs?.some((job) => job.jobId === prev)) {
            return prev;
          }
          return data.jobs?.[0]?.jobId || null;
        });
      } else {
        const text = await response.text();
        throw new Error(text || "Unable to load analytics.");
      }
    } catch (err) {
      setError(err.message || "Unable to load analytics.");
    } finally {
      setLoading(false);
    }
  }, [API_BASE_URL]);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      navigate("/");
      return;
    }
    if (user.role !== "provider") {
      navigate("/");
      return;
    }
    fetchAnalytics();
  }, [authLoading, user, navigate, fetchAnalytics]);

  const selectedJob = useMemo(
    () => jobs.find((job) => job.jobId === selectedJobId) || null,
    [jobs, selectedJobId]
  );

  const compositionSource = selectedJob || summary;
  const pieData = useMemo(() => {
    if (!compositionSource) return [];
    return [
      { name: "Experienced", value: compositionSource.experiencedCount || 0 },
      { name: "Fresher", value: compositionSource.fresherCount || 0 },
    ];
  }, [compositionSource]);

  const barData = useMemo(
    () =>
      jobs.map((job) => ({
        name: job.jobTitle,
        Fresher: job.fresherCount,
        Experienced: job.experiencedCount,
        Chance: job.chanceScore,
      })),
    [jobs]
  );

  if (authLoading || loading) {
    return (
      <>
        <Header />
        <section className="padd-top-80 padd-bot-80">
          <div className="container">
            <LoadingView />
          </div>
        </section>
        <Footer />
      </>
    );
  }

  if (!user) {
    return (
      <div className="container" style={{ padding: "60px", textAlign: "center" }}>
        <h2>Please login to access analytics</h2>
        <button onClick={() => navigate("/")} className="btn btn-primary">
          Go to Home
        </button>
      </div>
    );
  }

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
      `}</style>
      <section className="padd-top-80 padd-bot-80" style={{ background: "#f7f8fb" }}>
        <div className="container">
          <div className="row">
            <div className="col-md-3 employer-dashboard-sidebar">
              <EmployerSidebar active="analytics" />
            </div>
            <div className="col-md-9 employer-dashboard-main">
              <div className="analytics-panel">
                <div className="analytics-panel__head">
                  <div>
                    <p className="analytics-panel__eyebrow">Premium Feature</p>
                    <h2>Job Analytics & Candidate Pulse</h2>
                    <p className="analytics-panel__subtext">
                      Track total applicants, fresher vs experienced distribution, and the
                      percentage chance of fills for each job.
                    </p>
                  </div>
                  <button
                    className="analytics-panel__badge"
                    onClick={() => {
                      if (isPro) {
                        setShowUpgradeInfo((prev) => !prev);
                      } else {
                        setShowUpgradeModal(true); // NEW: open payment modal instead of instant toggle
                      }
                    }}
                    title={isPro ? "You are on the Pro plan" : "Upgrade to unlock analytics"}
                    aria-label={isPro ? "Pro plan" : "Upgrade to premium"}
                  >
                    {isPro ? "Pro Plan" : "Upgrade"}
                  </button>
                </div>

                {showUpgradeInfo && (
                  <div className="analytics-upgrade-info" role="status">
                    <div>
                      <strong>You're on the Pro plan</strong>
                      <p style={{ margin: 0, color: "#475569" }}>
                        Your current page and analytics logic remain unchanged.
                      </p>
                    </div>
                    <div>
                      <button
                        className="btn btn-sm"
                        onClick={() => setShowUpgradeInfo(false)}
                        style={{ marginLeft: 12 }}
                      >
                        Close
                      </button>
                    </div>
                  </div>
                )}

                {error && (
                  <div className="alert alert-danger" style={{ marginBottom: 20 }}>
                    {error}
                  </div>
                )}

                {access && (
                  <div className="analytics-access">
                    <div>
                      <p className="analytics-access__title">
                        Premium analytics unlocked for all employers
                      </p>
                      <p className="analytics-access__meta">
                        Billing is paused, so your account enjoys unlimited analytics
                        access by default.
                      </p>
                    </div>
                  </div>
                )}

                {jobs.length === 0 && (
                  <div className="analytics-empty">
                    <h4>No applicant data yet</h4>
                    <p>
                      Post a job or wait for candidates to apply to start seeing analytics.
                    </p>
                    <button
                      className="btn btn-m theme-btn"
                      onClick={() => navigate("/employer/add-jobs")}
                    >
                      Post a job
                    </button>
                  </div>
                )}

                {jobs.length > 0 && (
                  <>
                    <div className="analytics-summary-cards">
                      <div className="analytics-card">
                        <p>Total applicants</p>
                        <h3>{summary?.totalApplications || 0}</h3>
                        <small>Across {summary?.totalJobs || 0} active jobs</small>
                      </div>
                      <div className="analytics-card">
                        <p>Fresher vs Experienced</p>
                        <h3>
                          {summary?.fresherPercentage || 0}% /{" "}
                          {summary?.experiencedPercentage || 0}%
                        </h3>
                        <small>Fresher / Experienced mix</small>
                      </div>
                      <div className="analytics-card">
                        <p>Average fill chance</p>
                        <h3>{summary?.averageChance || 0}%</h3>
                        <small>Applications per vacancy</small>
                      </div>
                    </div>

                    <div className="analytics-jobs">
                      <p>Select a job to deep dive</p>
                      <div className="analytics-jobs__chips">
                        {jobs.map((job) => (
                          <button
                            key={job.jobId}
                            className={`analytics-chip ${
                              selectedJobId === job.jobId ? "analytics-chip--active" : ""
                            }`}
                            onClick={() => setSelectedJobId(job.jobId)}
                          >
                            <span>{job.jobTitle}</span>
                            <small>{job.totalApplications} applicants</small>
                          </button>
                        ))}
                      </div>
                    </div>

                    {selectedJob && (
                      <div className="analytics-detail-grid">
                        <div className="analytics-visual">
                          <h4>Experience distribution</h4>
                          <ResponsiveContainer width="100%" height={260}>
                            <PieChart>
                              <Pie
                                data={pieData}
                                innerRadius={60}
                                outerRadius={100}
                                paddingAngle={3}
                                dataKey="value"
                              >
                                {pieData.map((entry, index) => (
                                  <Cell
                                    key={`cell-${entry.name}`}
                                    fill={PIE_COLORS[index % PIE_COLORS.length]}
                                  />
                                ))}
                              </Pie>
                              <Tooltip formatter={(value) => `${value} applicants`} />
                              <Legend />
                            </PieChart>
                          </ResponsiveContainer>
                        </div>
                        <div className="analytics-chance">
                          <p>Fill chance</p>
                          <h2>{selectedJob.chanceScore}%</h2>
                          <p className="analytics-chance__meta">
                            {selectedJob.totalApplications} applicants vs{" "}
                            {selectedJob.noOfVacancy} vacancy slots
                          </p>
                          <div className="progress">
                            <div
                              className="progress-bar"
                              role="progressbar"
                              style={{ width: `${selectedJob.chanceScore}%` }}
                              aria-valuenow={selectedJob.chanceScore}
                              aria-valuemin="0"
                              aria-valuemax="100"
                            ></div>
                          </div>
                          <small>
                            Higher chance means more applicants per opening (capped at 100%).
                          </small>
                        </div>
                      </div>
                    )}

                    <div className="analytics-bar-chart">
                      <h4>Applicants per job</h4>
                      <ResponsiveContainer width="100%" height={320}>
                        <BarChart data={barData} margin={{ top: 20, right: 20, left: 0, bottom: 5 }}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                          <YAxis allowDecimals={false} />
                          <Tooltip />
                          <Legend />
                          <Bar dataKey="Fresher" stackId="a" fill={BAR_COLORS.Fresher} />
                          <Bar dataKey="Experienced" stackId="a" fill={BAR_COLORS.Experienced} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* NEW: Upgrade / dummy payment modal */}
      {showUpgradeModal && (
        <UpgradeModal
          user={user}
          onClose={() => setShowUpgradeModal(false)}
          onSuccess={() => {
            setIsPro(true);
            setShowUpgradeModal(false);
          }}
        />
      )}

      <Footer />
      <style>
        {`
          .analytics-panel {
            background: #fff;
            border-radius: 18px;
            padding: 30px;
            box-shadow: 0 25px 60px rgba(15, 23, 42, 0.08);
          }
          .analytics-panel__head {
            display: flex;
            justify-content: space-between;
            gap: 20px;
            flex-wrap: wrap;
          }
          .analytics-panel__eyebrow {
            text-transform: uppercase;
            letter-spacing: 0.2em;
            color: #94a3b8;
            font-weight: 600;
          }
          .analytics-panel__subtext {
            color: #475569;
            max-width: 540px;
          }
          .analytics-panel__badge {
            background: linear-gradient(135deg, #6366f1, #f97316);
            color: #fff;
            padding: 10px 20px;
            border-radius: 999px;
            font-weight: 600;
            align-self: flex-start;
            border: none;
            cursor: pointer;
          }
          .analytics-access {
            margin: 24px 0;
            padding: 18px 24px;
            border-radius: 14px;
            background: #eef2ff;
            display: flex;
            justify-content: space-between;
            align-items: center;
            gap: 16px;
            flex-wrap: wrap;
          }
          .analytics-access__title {
            margin: 0;
            font-weight: 600;
            color: #312e81;
          }
          .analytics-access__meta {
            margin: 4px 0 0;
            color: #4c1d95;
          }
          .analytics-paywall {
            border: 1px dashed #f97316;
            padding: 20px;
            border-radius: 14px;
            background: #fff7ed;
            display: flex;
            justify-content: space-between;
            gap: 16px;
            align-items: center;
            flex-wrap: wrap;
            margin-bottom: 24px;
          }
          .analytics-empty {
            text-align: center;
            padding: 40px;
            border-radius: 16px;
            background: #f8fafc;
            border: 1px dashed #cbd5f5;
          }
          .analytics-summary-cards {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 16px;
            margin-top: 20px;
          }
          .analytics-card {
            background: #131736;
            color: #fff;
            padding: 20px;
            border-radius: 16px;
          }
          .analytics-card p {
            margin: 0;
            text-transform: uppercase;
            font-size: 0.75rem;
            letter-spacing: 0.2em;
            color: #c7d2fe;
          }
          .analytics-card h3 {
            margin: 10px 0 4px;
            font-size: 1.8rem;
          }
          .analytics-card small {
            color: #94a3b8;
          }
          .analytics-jobs {
            margin: 30px 0 10px;
          }
          .analytics-jobs__chips {
            display: flex;
            flex-wrap: wrap;
            gap: 10px;
            margin-top: 10px;
          }
          .analytics-chip {
            border: 1px solid #e2e8f0;
            border-radius: 999px;
            padding: 10px 18px;
            background: #fff;
            display: flex;
            flex-direction: column;
            align-items: flex-start;
            gap: 2px;
          }
          .analytics-chip small {
            color: #94a3b8;
            font-size: 0.75rem;
          }
          .analytics-chip--active {
            border-color: #6366f1;
            background: #eef2ff;
          }
          .analytics-detail-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
            gap: 20px;
            align-items: stretch;
            margin-top: 20px;
          }
          .analytics-visual,
          .analytics-chance {
            background: #fff;
            border: 1px solid #e2e8f0;
            border-radius: 16px;
            padding: 20px;
          }
          .analytics-chance h2 {
            font-size: 3rem;
            margin: 4px 0;
            color: #0f172a;
          }
          .analytics-chance__meta {
            color: #475569;
          }
          .analytics-bar-chart {
            margin-top: 30px;
            background: #fff;
            border-radius: 16px;
            padding: 20px;
            border: 1px solid #e2e8f0;
          }
          @media (max-width: 767px) {
            .analytics-panel {
              padding: 20px;
            }
            .analytics-summary-cards {
              grid-template-columns: 1fr;
            }
          }

          /* ---- Upgrade modal styles (NEW) ---- */
          .upgrade-modal__overlay {
            position: fixed;
            inset: 0;
            background: rgba(15, 23, 42, 0.55);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 1000;
            padding: 16px;
          }
          .upgrade-modal__box {
            background: #fff;
            border-radius: 18px;
            width: 100%;
            max-width: 420px;
            padding: 28px;
            position: relative;
            box-shadow: 0 25px 60px rgba(15, 23, 42, 0.25);
          }
          .upgrade-modal__close {
            position: absolute;
            top: 14px;
            right: 16px;
            background: none;
            border: none;
            font-size: 22px;
            line-height: 1;
            cursor: pointer;
            color: #94a3b8;
          }
          .upgrade-modal__eyebrow {
            text-transform: uppercase;
            letter-spacing: 0.15em;
            font-size: 0.7rem;
            color: #94a3b8;
            font-weight: 600;
            margin: 0;
          }
          .upgrade-modal__title {
            margin: 4px 0 0;
            font-size: 1.4rem;
            color: #0f172a;
          }
          .upgrade-modal__sub {
            margin: 2px 0 16px;
            color: #64748b;
            font-size: 0.9rem;
          }
          .upgrade-modal__features {
            list-style: none;
            padding: 0;
            margin: 0 0 18px;
          }
          .upgrade-modal__features li {
            padding: 6px 0;
            color: #334155;
            font-size: 0.9rem;
          }
          .upgrade-modal__features li::before {
            content: "✓ ";
            color: #34d399;
            font-weight: 700;
          }
          .upgrade-modal__priceRow {
            display: flex;
            justify-content: space-between;
            font-size: 0.9rem;
            color: #475569;
            padding: 4px 0;
          }
          .upgrade-modal__priceRow--total {
            border-top: 1px solid #e2e8f0;
            margin-top: 6px;
            padding-top: 10px;
            font-weight: 700;
            color: #0f172a;
            font-size: 1rem;
          }
          .upgrade-modal__form {
            display: flex;
            flex-direction: column;
            gap: 12px;
            margin-top: 18px;
          }
          .upgrade-modal__form label {
            display: flex;
            flex-direction: column;
            font-size: 0.8rem;
            color: #475569;
            gap: 4px;
          }
          .upgrade-modal__form input {
            border: 1px solid #cbd5e1;
            border-radius: 10px;
            padding: 10px 12px;
            font-size: 0.95rem;
            outline: none;
          }
          .upgrade-modal__form input:focus {
            border-color: #6366f1;
          }
          .upgrade-modal__payBtn {
            margin-top: 6px;
            background: linear-gradient(135deg, #6366f1, #f97316);
            color: #fff;
            border: none;
            border-radius: 10px;
            padding: 12px;
            font-weight: 600;
            font-size: 1rem;
            cursor: pointer;
          }
          .upgrade-modal__note {
            text-align: center;
            font-size: 0.75rem;
            color: #94a3b8;
            margin: 0;
          }
          .upgrade-modal__processing,
          .upgrade-modal__success {
            display: flex;
            flex-direction: column;
            align-items: center;
            text-align: center;
            padding: 30px 10px;
            gap: 8px;
          }
          .upgrade-modal__spinner {
            width: 44px;
            height: 44px;
            border: 5px solid #e2e8f0;
            border-top-color: #6366f1;
            border-radius: 50%;
            animation: upgrade-spin 0.8s linear infinite;
            margin-bottom: 10px;
          }
          @keyframes upgrade-spin {
            to { transform: rotate(360deg); }
          }
          .upgrade-modal__checkmark {
            width: 56px;
            height: 56px;
            border-radius: 50%;
            background: #34d399;
            color: #fff;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 1.6rem;
            margin-bottom: 10px;
          }
        `}
      </style>
    </>
  );
}

export default Analytics;
