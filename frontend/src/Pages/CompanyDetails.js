import React, { useEffect, useMemo, useRef, useState } from "react";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
import { motion, useInView } from "framer-motion";
import {
  FaBriefcase,
  FaBuilding,
  FaCalendarAlt,
  FaCheck,
  FaCheckCircle,
  FaFacebookF,
  FaGlobe,
  FaGoogle,
  FaIndustry,
  FaLinkedinIn,
  FaMapMarkerAlt,
  FaMoneyBillWave,
  FaPlus,
  FaRegStar,
  FaTwitter,
  FaUsers,
} from "react-icons/fa";
import { API_BASE_URL } from "../config/api";
import { formatJobSalary } from "../utils/jobSalary";
import Header from "../Components/Header";
import Footer from "../Components/Footer";

function normalizeCompanyName(raw) {
  if (!raw) return "";
  const decoded = (() => {
    try {
      return decodeURIComponent(raw);
    } catch {
      return raw;
    }
  })();
  return decoded.replace(/_/g, " ").replace(/\s+/g, " ").trim();
}

function safeUrl(url) {
  if (!url) return "";
  const v = String(url).trim();
  if (!v) return "";
  if (v.startsWith("http://") || v.startsWith("https://")) return v;
  return `https://${v}`;
}

const FOLLOWED_KEY = "followedCompanies";

function readFollowed() {
  try {
    const raw = window.localStorage.getItem(FOLLOWED_KEY);
    const arr = raw ? JSON.parse(raw) : [];
    return Array.isArray(arr) ? arr.map((x) => String(x)) : [];
  } catch {
    return [];
  }
}

function writeFollowed(arr) {
  try {
    window.localStorage.setItem(FOLLOWED_KEY, JSON.stringify(arr));
  } catch {
    /* ignore storage errors */
  }
}

function CountUp({ to = 0, duration = 1100 }) {
  const target = Number.isFinite(Number(to)) ? Number(to) : 0;
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-40px" });
  const [value, setValue] = useState(0);

  useEffect(() => {
    if (!inView) return undefined;
    if (target <= 0) {
      setValue(0);
      return undefined;
    }
    let raf;
    const start = performance.now();
    const tick = (now) => {
      const progress = Math.min((now - start) / duration, 1);
      // easeOutCubic for a snappy finish
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue(Math.round(eased * target));
      if (progress < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [inView, target, duration]);

  return <span ref={ref}>{value}</span>;
}

export default function CompanyDetails() {
  const { id: idParam } = useParams();
  const location = useLocation();
  const navigate = useNavigate();

  const companyName = useMemo(() => {
    const fromState = location.state?.company?.name;
    return normalizeCompanyName(fromState || idParam);
  }, [idParam, location.state]);

  const companyIdFromParam = useMemo(() => {
    const raw = String(idParam || "").trim();
    if (!raw) return null;
    // allow direct access like /company/3
    if (/^\d+$/.test(raw)) return Number(raw);
    return null;
  }, [idParam]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [profile, setProfile] = useState(null);
  const [companyJobs, setCompanyJobs] = useState([]);
  const [activeTab, setActiveTab] = useState("overview");
  const [resolvedId, setResolvedId] = useState(companyIdFromParam);
  const [isFollowing, setIsFollowing] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function run() {
      if (!companyName && !companyIdFromParam) return;
      setLoading(true);
      setError("");
      setProfile(null);

      try {
        let companyId = companyIdFromParam;

        if (!companyId) {
          // 1) Resolve id from name via /api/companies
          const listRes = await fetch(`${API_BASE_URL}/api/companies`);
          const listData = await listRes.json().catch(() => ({}));
          if (cancelled) return;

          if (!listRes.ok) {
            setError(listData?.message || "Failed to load companies list");
            return;
          }

          const companies = Array.isArray(listData?.companies) ? listData.companies : [];
          const normalizedTarget = normalizeCompanyName(companyName).toLowerCase();
          const match = companies.find((c) => normalizeCompanyName(c?.companyName).toLowerCase() === normalizedTarget);

          if (!match?.id) {
            setError("Company not found");
            return;
          }

          companyId = Number(match.id);
        }

        if (!cancelled) setResolvedId(companyId);

        // 2) Fetch profile by id via /api/company/:id
        const res = await fetch(`${API_BASE_URL}/api/company/${companyId}`);
        const data = await res.json().catch(() => ({}));
        if (cancelled) return;

        if (!res.ok) {
          setError(data?.message || "Failed to load company details");
          return;
        }

        setProfile(data?.profile || null);
      } catch (e) {
        if (!cancelled) setError("Network error. Please try again.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    run();
    return () => {
      cancelled = true;
    };
  }, [companyName, companyIdFromParam]);

  useEffect(() => {
    let cancelled = false;

    async function loadCompanyJobs() {
      if (!companyName) return;

      try {
        const res = await fetch(`${API_BASE_URL}/api/jobs?limit=1000&page=1`);
        const data = await res.json().catch(() => ({}));
        if (cancelled || !res.ok) return;

        const jobs = Array.isArray(data?.jobs) ? data.jobs : [];
        const normalizedTarget = normalizeCompanyName(profile?.companyName || companyName).toLowerCase();
        const matchedJobs = jobs.filter(
          (job) => normalizeCompanyName(job?.companyName || job?.company || "").toLowerCase() === normalizedTarget
        );

        setCompanyJobs(matchedJobs);
      } catch {
        if (!cancelled) setCompanyJobs([]);
      }
    }

    loadCompanyJobs();
    return () => {
      cancelled = true;
    };
  }, [companyName, profile?.companyName]);

  // Sync follow state once we know which id represents this company.
  useEffect(() => {
    const key = resolvedId != null ? String(resolvedId) : "";
    if (!key) {
      setIsFollowing(false);
      return;
    }
    setIsFollowing(readFollowed().includes(key));
  }, [resolvedId]);

  function toggleFollow() {
    const key = resolvedId != null ? String(resolvedId) : "";
    if (!key) return;
    const current = readFollowed();
    let next;
    if (current.includes(key)) {
      next = current.filter((x) => x !== key);
      setIsFollowing(false);
    } else {
      next = [...current, key];
      setIsFollowing(true);
    }
    writeFollowed(next);
  }

  const displayName = profile?.companyName || companyName || "Company Details";
  const logoUrl = profile?.logoUrl ? String(profile.logoUrl).trim() : "";
  const companyLocation = profile?.address ? String(profile.address).trim() : "";
  const companySize = profile?.companySize ? String(profile.companySize).trim() : "";
  const foundedYear = profile?.foundedYear ? String(profile.foundedYear).trim() : "";
  const industry = profile?.industry ? String(profile.industry).trim() : "";
  const websiteUrl = profile?.website ? safeUrl(profile.website) : "";
  const isVerified = Boolean(profile?.isVerified);

  const snapshot = useMemo(() => {
    const rows = [
      { label: "Website", value: profile?.website ? safeUrl(profile.website) : "", isLink: true, icon: FaGlobe },
      { label: "Industry", value: profile?.industry || "", icon: FaIndustry },
      { label: "Company size", value: profile?.companySize || "", icon: FaUsers },
      { label: "Founded", value: profile?.foundedYear || "", icon: FaCalendarAlt },
      { label: "Type", value: profile?.companyType || "", icon: FaBuilding },
      { label: "Address", value: profile?.address || "", icon: FaMapMarkerAlt },
    ];
    return rows.filter((r) => r.value);
  }, [profile]);

  const socials = useMemo(() => {
    const rows = [
      { label: "LinkedIn", value: profile?.linkedin ? safeUrl(profile.linkedin) : "", icon: FaLinkedinIn },
      { label: "Twitter", value: profile?.twitter ? safeUrl(profile.twitter) : "", icon: FaTwitter },
      { label: "Facebook", value: profile?.facebook ? safeUrl(profile.facebook) : "", icon: FaFacebookF },
      { label: "Google", value: profile?.google ? safeUrl(profile.google) : "", icon: FaGoogle },
    ];
    return rows.filter((r) => r.value);
  }, [profile]);

  const companyQueryUrl = `/jobs?q=${encodeURIComponent(displayName)}`;

  function getTimeAgo(dateString) {
    if (!dateString) return "Recently";
    const now = new Date();
    const posted = new Date(dateString);
    const diffMs = now - posted;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);
    const diffWeeks = Math.floor(diffDays / 7);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins} min${diffMins > 1 ? "s" : ""} ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? "s" : ""} ago`;
    if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? "s" : ""} ago`;
    return `${diffWeeks} week${diffWeeks > 1 ? "s" : ""} ago`;
  }

  const headerChip = {
    display: "inline-flex",
    alignItems: "center",
    gap: 7,
    borderRadius: 8,
    background: "#f1f5f9",
    border: "1px solid rgba(148,163,184,0.22)",
    color: "#334155",
    fontSize: 13,
    fontWeight: 700,
    padding: "7px 10px",
  };

  const cardBase = {
    background: "#fff",
    borderRadius: 16,
    border: "1px solid rgba(148,163,184,0.18)",
    boxShadow: "0 6px 20px rgba(15,23,42,0.06)",
  };

  const infographicStats = [
    { label: "Open Roles", value: companyJobs.length, icon: FaBriefcase, countUp: true },
    { label: "Founded", value: foundedYear || "—", icon: FaCalendarAlt },
    { label: "Company Size", value: companySize || "—", icon: FaUsers },
    { label: "Industry", value: industry || "—", icon: FaIndustry },
  ];

  const tabs = [
    { key: "overview", label: "Overview" },
    { key: "jobs", label: `Jobs${companyJobs.length ? ` (${companyJobs.length})` : ""}` },
    { key: "reviews", label: "Reviews" },
  ];

  function renderJobCard(job) {
    const id = job?._id || job?.id;
    const title = job?.jobTitle || job?.title || "Open Position";
    const jobType = job?.jobType || job?.job_type || "Full Time";
    const salary = formatJobSalary(job) || "Salary not disclosed";
    const jobLocation = job?.city || job?.state || job?.country || job?.address || companyLocation || "Location not specified";
    const timePosted = getTimeAgo(job?.createdAt || job?.created_at || job?.postedDate);
    const logoPath = job?.companyLogoUrl || job?.logoUrl || job?.company_logo || logoUrl;
    const cardLogo =
      logoPath && (String(logoPath).startsWith("http") || String(logoPath).startsWith("data:"))
        ? logoPath
        : logoPath
        ? `${API_BASE_URL}${String(logoPath).startsWith("/") ? logoPath : `/${logoPath}`}`
        : "/assets/img/company_logo_1.png";

    return (
      <div
        key={id || title}
        onClick={() => id && navigate(`/jobs/${id}`)}
        style={{
          cursor: id ? "pointer" : "default",
          background: "#fff",
          borderRadius: 16,
          border: "1px solid rgba(148,163,184,0.18)",
          boxShadow: "0 6px 20px rgba(15,23,42,0.06)",
          padding: "16px 16px 14px",
          minHeight: 200,
          display: "flex",
          flexDirection: "column",
          transition: "transform 0.2s ease, box-shadow 0.2s ease",
        }}
        onMouseEnter={(e) => {
          if (!id) return;
          e.currentTarget.style.transform = "translateY(-3px)";
          e.currentTarget.style.boxShadow = "0 12px 24px rgba(15,23,42,0.10)";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = "translateY(0)";
          e.currentTarget.style.boxShadow = "0 6px 20px rgba(15,23,42,0.06)";
        }}
      >
        <div
          style={{
            alignSelf: "flex-start",
            padding: "4px 10px",
            borderRadius: 999,
            background: "rgba(22,163,74,0.10)",
            color: "#16a34a",
            fontSize: 11,
            fontWeight: 800,
            marginBottom: 12,
          }}
        >
          {String(jobType).replace(/_/g, " ")}
        </div>

        <h3 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: "#0f172a", lineHeight: 1.35 }}>{title}</h3>

        <div style={{ marginTop: 14, display: "flex", flexDirection: "column", gap: 8, color: "#475569", fontSize: 13 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
            <FaMoneyBillWave size={13} style={{ color: "#16a34a", flexShrink: 0 }} />
            <span>{salary}</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
            <FaMapMarkerAlt size={13} style={{ color: "#16a34a", flexShrink: 0 }} />
            <span>{jobLocation}</span>
          </div>
        </div>

        <div style={{ marginTop: "auto", paddingTop: 14, borderTop: "1px solid rgba(148,163,184,0.18)", display: "flex", alignItems: "center", gap: 10 }}>
          <div
            style={{
              width: 34,
              height: 34,
              borderRadius: 10,
              overflow: "hidden",
              background: "#fff",
              border: "1px solid rgba(148,163,184,0.18)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <img
              src={cardLogo}
              alt={displayName}
              style={{ width: "100%", height: "100%", objectFit: "contain", padding: 4 }}
              onError={(e) => {
                e.currentTarget.src = "/assets/img/company_logo_1.png";
              }}
            />
          </div>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: 11, color: "#94a3b8", fontWeight: 700 }}>Posted</div>
            <div style={{ fontSize: 13, color: "#0f172a", fontWeight: 700 }}>{timePosted}</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <Header />
      <div style={{ background: "#f2f4f8", minHeight: "100vh", color: "#0f172a" }}>
        {/* Gradient banner */}
        <div style={{ position: "relative", height: 210, overflow: "hidden" }}>
          <div
            style={{
              position: "absolute",
              inset: 0,
              background: "linear-gradient(135deg, rgba(22,163,74,0.22), rgba(34,197,94,0.14))",
            }}
          />
        </div>

        {/* Company header card */}
        <div className="container" style={{ margin: "-62px auto 0", position: "relative", zIndex: 10 }}>
          <div
            className="company-header-card"
            style={{
              background: "#fff",
              borderRadius: 20,
              boxShadow: "0 14px 34px rgba(15, 23, 42, 0.10)",
              border: "1px solid rgba(148,163,184,0.18)",
              padding: "24px",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 18,
              flexWrap: "wrap",
            }}
          >
            <div className="company-header-info" style={{ display: "flex", alignItems: "center", gap: 16, flex: 1, minWidth: 250 }}>
              <div
                style={{
                  width: 84,
                  height: 84,
                  borderRadius: 18,
                  background: "#f8fafc",
                  border: "1px solid rgba(148,163,184,0.22)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                  overflow: "hidden",
                }}
              >
                <img
                  src={logoUrl || "/assets/img/company_logo_1.png"}
                  alt={displayName}
                  style={{ width: "100%", height: "100%", objectFit: "contain", padding: 8, background: "#fff" }}
                  onError={(e) => {
                    e.currentTarget.src = "/assets/img/company_logo_1.png";
                  }}
                />
              </div>

              <div style={{ flex: 1, minWidth: 220 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                  <h1 className="company-header-title" style={{ margin: 0, fontSize: 40, fontWeight: 900, letterSpacing: "-0.8px", lineHeight: 1.05 }}>
                    {displayName}
                  </h1>
                  {isVerified ? (
                    <span
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 6,
                        borderRadius: 999,
                        background: "rgba(22,163,74,0.10)",
                        color: "#16a34a",
                        border: "1px solid rgba(22,163,74,0.30)",
                        fontSize: 12,
                        fontWeight: 800,
                        padding: "5px 10px",
                      }}
                      title="Verified company"
                    >
                      <FaCheckCircle size={13} />
                      Verified
                    </span>
                  ) : null}
                </div>

                {industry ? (
                  <div style={{ marginTop: 8, color: "#475569", fontSize: 14, fontWeight: 700 }}>{industry}</div>
                ) : null}

                <div style={{ marginTop: 12, display: "flex", gap: 10, flexWrap: "wrap" }}>
                  <span style={headerChip}>
                    <FaUsers size={13} style={{ color: "#475569" }} />
                    {companySize ? `${companySize} team members` : "N/A team members"}
                  </span>
                  <span style={headerChip}>
                    <FaCalendarAlt size={13} style={{ color: "#475569" }} />
                    {foundedYear ? `Since ${foundedYear}` : "Founded year N/A"}
                  </span>
                  {websiteUrl ? (
                    <a
                      href={websiteUrl}
                      target="_blank"
                      rel="noreferrer"
                      style={{ ...headerChip, color: "#0d6efd", textDecoration: "none" }}
                    >
                      <FaGlobe size={13} style={{ color: "#0d6efd" }} />
                      Website
                    </a>
                  ) : null}
                </div>
              </div>
            </div>

            <div className="company-header-actions" style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
              <button
                type="button"
                onClick={toggleFollow}
                disabled={resolvedId == null}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 8,
                  justifyContent: "center",
                  borderRadius: 10,
                  background: isFollowing ? "rgba(22,163,74,0.10)" : "#fff",
                  color: "#16a34a",
                  border: "1px solid #16a34a",
                  cursor: resolvedId == null ? "not-allowed" : "pointer",
                  fontWeight: 800,
                  fontSize: 14,
                  padding: "10px 18px",
                  minHeight: 42,
                  opacity: resolvedId == null ? 0.6 : 1,
                }}
              >
                {isFollowing ? <FaCheck size={13} /> : <FaPlus size={13} />}
                {isFollowing ? "Following" : "Follow Company"}
              </button>

              <Link
                to={companyQueryUrl}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 8,
                  justifyContent: "center",
                  borderRadius: 10,
                  background: "#16a34a",
                  color: "#fff",
                  textDecoration: "none",
                  fontWeight: 800,
                  fontSize: 14,
                  padding: "10px 18px",
                  minHeight: 42,
                }}
              >
                <FaBriefcase size={14} />
                View Open Roles
              </Link>
            </div>
          </div>

          {/* Animated infographic band */}
          <div
            className="company-infographic"
            style={{
              marginTop: 18,
              display: "grid",
              gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
              gap: 14,
            }}
          >
            {infographicStats.map((stat, i) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, scale: 0.92, y: 14 }}
                whileInView={{ opacity: 1, scale: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.45, delay: i * 0.1, ease: "easeOut" }}
                whileHover={{ y: -5 }}
                style={{
                  background: "linear-gradient(135deg, #ffffff 0%, rgba(22,163,74,0.06) 100%)",
                  borderRadius: 16,
                  border: "1px solid rgba(148,163,184,0.18)",
                  boxShadow: "0 6px 20px rgba(15,23,42,0.06)",
                  padding: "18px 18px 16px",
                  display: "flex",
                  alignItems: "center",
                  gap: 14,
                  minWidth: 0,
                }}
              >
                <div
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    width: 46,
                    height: 46,
                    borderRadius: 12,
                    background: "rgba(22,163,74,0.10)",
                    color: "#16a34a",
                    flexShrink: 0,
                  }}
                >
                  <stat.icon size={20} />
                </div>
                <div style={{ minWidth: 0 }}>
                  <div
                    style={{
                      fontSize: 24,
                      fontWeight: 900,
                      color: "#0f172a",
                      lineHeight: 1.1,
                      letterSpacing: "-0.5px",
                      wordBreak: "break-word",
                    }}
                  >
                    {stat.countUp ? <CountUp to={stat.value} /> : stat.value}
                  </div>
                  <div style={{ marginTop: 4, fontSize: 12.5, fontWeight: 800, color: "#64748b" }}>{stat.label}</div>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Tabs */}
          <div
            className="company-tabs"
            style={{
              marginTop: 18,
              display: "flex",
              gap: 6,
              background: "#fff",
              borderRadius: 14,
              border: "1px solid rgba(148,163,184,0.18)",
              boxShadow: "0 6px 20px rgba(15,23,42,0.06)",
              padding: 6,
              overflowX: "auto",
            }}
          >
            {tabs.map((tab) => {
              const active = activeTab === tab.key;
              return (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => setActiveTab(tab.key)}
                  style={{
                    flex: "0 0 auto",
                    border: "none",
                    cursor: "pointer",
                    borderRadius: 10,
                    padding: "10px 18px",
                    fontSize: 14,
                    fontWeight: 800,
                    whiteSpace: "nowrap",
                    background: active ? "#16a34a" : "transparent",
                    color: active ? "#fff" : "#475569",
                    transition: "background 0.15s ease, color 0.15s ease",
                  }}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Tab content */}
        <div className="container" style={{ margin: "22px auto 40px" }}>
          {activeTab === "overview" && (
            <div
              className="company-details-grid"
              style={{
                display: "grid",
                gridTemplateColumns: "minmax(0, 1.32fr) 320px",
                gridTemplateAreas: '"about snapshot"',
                gap: 20,
                alignItems: "start",
                direction: "ltr",
              }}
            >
              <div style={{ display: "flex", flexDirection: "column", gap: 16, gridArea: "about", minWidth: 0 }}>
                <div style={{ ...cardBase, padding: "22px" }}>
                  <h2 style={{ margin: "0 0 12px", fontSize: 20, fontWeight: 900, color: "#0f172a" }}>About</h2>
                  {loading ? (
                    <div style={{ color: "#64748b", fontSize: 14 }}>Loading company details…</div>
                  ) : error ? (
                    <div style={{ color: "#b91c1c", fontSize: 14 }}>{error}</div>
                  ) : (
                    <div style={{ color: "#475569", fontSize: 15, lineHeight: 1.8 }}>
                      {profile?.description ? profile.description : "No description added yet."}
                    </div>
                  )}
                </div>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 16, gridArea: "snapshot", minWidth: 0 }}>
                <div style={{ ...cardBase, padding: "18px" }}>
                  <h3 style={{ margin: "0 0 14px", fontSize: 18, fontWeight: 900, color: "#0f172a" }}>Company Snapshot</h3>

                  {loading ? (
                    <div style={{ color: "#64748b", fontSize: 13 }}>Loading…</div>
                  ) : profile ? (
                    <>
                      {snapshot.length ? (
                        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                          {snapshot.map((row) => (
                            <div
                              key={row.label}
                              style={{
                                display: "flex",
                                justifyContent: "space-between",
                                gap: 10,
                                paddingBottom: 9,
                                borderBottom: "1px dashed rgba(148,163,184,0.25)",
                              }}
                            >
                              <div style={{ display: "flex", alignItems: "center", gap: 9, fontSize: 13, fontWeight: 800, color: "#64748b" }}>
                                <row.icon size={14} style={{ color: "#0f172a", flexShrink: 0 }} />
                                <span>{row.label}</span>
                              </div>
                              <div style={{ fontSize: 13, color: "#0f172a", textAlign: "right", wordBreak: "break-word" }}>
                                {row.isLink ? (
                                  <a href={row.value} target="_blank" rel="noreferrer" style={{ color: "#0d6efd", textDecoration: "none", fontWeight: 800 }}>
                                    {row.value}
                                  </a>
                                ) : (
                                  row.value
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div style={{ color: "#64748b", fontSize: 13 }}>No snapshot info yet.</div>
                      )}

                      {socials.length ? (
                        <div style={{ marginTop: 14 }}>
                          <div style={{ fontSize: 13, fontWeight: 900, color: "#64748b", marginBottom: 8 }}>Social</div>
                          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                            {socials.map((s) => (
                              <a
                                key={s.label}
                                href={s.value}
                                target="_blank"
                                rel="noreferrer"
                                style={{
                                  display: "inline-flex",
                                  alignItems: "center",
                                  justifyContent: "center",
                                  width: 38,
                                  height: 38,
                                  borderRadius: 999,
                                  border: "1px solid rgba(148,163,184,0.18)",
                                  background: "#f8fafc",
                                  color: "#16a34a",
                                  textDecoration: "none",
                                  fontSize: 15,
                                }}
                                title={s.label}
                                aria-label={s.label}
                              >
                                <s.icon />
                              </a>
                            ))}
                          </div>
                        </div>
                      ) : null}
                    </>
                  ) : (
                    <div style={{ color: "#64748b", fontSize: 13 }}>No data.</div>
                  )}
                </div>
              </div>
            </div>
          )}

          {activeTab === "jobs" && (
            <div style={{ ...cardBase, padding: "22px" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap", marginBottom: 18 }}>
                <h2 style={{ margin: 0, fontSize: 22, fontWeight: 900, color: "#0f172a" }}>
                  Jobs at {displayName}
                </h2>
                <Link
                  to={companyQueryUrl}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 8,
                    borderRadius: 999,
                    border: "1px solid #16a34a",
                    background: "#fff",
                    color: "#16a34a",
                    fontSize: 13,
                    fontWeight: 800,
                    padding: "9px 14px",
                    textDecoration: "none",
                  }}
                >
                  <FaBriefcase size={12} />
                  View in Jobs Search
                </Link>
              </div>

              <div className="company-jobs-grid" style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: 18 }}>
                {companyJobs.length === 0 ? (
                  <div
                    style={{
                      gridColumn: "1 / -1",
                      background: "#f8fafc",
                      borderRadius: 14,
                      border: "1px dashed rgba(148,163,184,0.40)",
                      padding: "28px",
                      textAlign: "center",
                      color: "#64748b",
                      fontSize: 14,
                      fontWeight: 700,
                    }}
                  >
                    {loading ? "Loading open roles…" : `${displayName} does not have openings currently.`}
                  </div>
                ) : (
                  companyJobs.map((job) => renderJobCard(job))
                )}
              </div>
            </div>
          )}

          {activeTab === "reviews" && (
            <div style={{ ...cardBase, padding: "22px" }}>
              <h2 style={{ margin: "0 0 16px", fontSize: 22, fontWeight: 900, color: "#0f172a" }}>Reviews</h2>
              <div
                style={{
                  background: "#f8fafc",
                  borderRadius: 14,
                  border: "1px dashed rgba(148,163,184,0.40)",
                  padding: "40px 24px",
                  textAlign: "center",
                }}
              >
                <div
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    width: 56,
                    height: 56,
                    borderRadius: 999,
                    background: "rgba(22,163,74,0.10)",
                    color: "#16a34a",
                    marginBottom: 14,
                  }}
                >
                  <FaRegStar size={24} />
                </div>
                <h3 style={{ margin: "0 0 8px", fontSize: 18, fontWeight: 900, color: "#0f172a" }}>No reviews yet</h3>
                <p style={{ margin: 0, color: "#64748b", fontSize: 14, maxWidth: 420, marginLeft: "auto", marginRight: "auto" }}>
                  Reviews for {displayName} are coming soon. Be the first to share your experience once reviews go live.
                </p>
              </div>
            </div>
          )}
        </div>

        <style>{`
          @media (max-width: 991px){
            .company-details-grid{
              grid-template-columns: 1fr !important;
              grid-template-areas:
                "about"
                "snapshot" !important;
            }
            .company-jobs-grid{
              grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
            }
            .company-infographic{
              grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
            }
            .company-header-card{
              flex-direction: column;
              align-items: stretch !important;
            }
            .company-header-actions{
              width: 100%;
            }
            .company-header-actions > a,
            .company-header-actions > button{
              flex: 1 1 auto;
            }
            .company-header-title{
              font-size: 32px !important;
            }
          }
          @media (max-width: 600px){
            .company-jobs-grid{
              grid-template-columns: 1fr !important;
            }
            .company-infographic{
              grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
              gap: 10px !important;
            }
            .company-header-info{
              flex-direction: column;
              align-items: flex-start !important;
              text-align: left;
            }
            .company-header-title{
              font-size: 26px !important;
            }
            .company-tabs{
              flex-wrap: nowrap;
            }
          }
        `}</style>
      </div>
      <Footer />
    </>
  );
}
