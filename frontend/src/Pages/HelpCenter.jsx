import { useState, useEffect, useRef } from "react";
import Header from "../Components/Header";
import Footer from "../Components/Footer";
/* ─── brand tokens (exact from UptulaPaivacyPolicy.jsx) ─── */
const G = {
  primary: "#1a8a4a",
  dark: "#0d5c30",
  light: "#e8f5ee",
  lighter: "#f4fbf7",
  border: "#c8e8d4",
  text: "#1a2e22",
  muted: "#4a6e5a",
  white: "#ffffff",
};

/* ─── icons ─── */
const Icon = ({ name, size = 20, color = G.primary }) => {
  const icons = {
    person: <><circle cx="10" cy="6" r="3.5"/><path d="M2 19c0-4.4 3.6-8 8-8s8 3.6 8 8" strokeLinecap="round"/></>,
    search: <><circle cx="9" cy="9" r="6"/><line x1="14" y1="14" x2="19" y2="19"/></>,
    bell: <><path d="M10 2a6 6 0 0 1 6 6v3l2 3H2l2-3V8a6 6 0 0 1 6-6z"/><path d="M8 18a2 2 0 0 0 4 0"/></>,
    building: <><rect x="2" y="3" width="16" height="15" rx="1"/><path d="M6 7h2M6 11h2M12 7h2M12 11h2M8 18v-4h4v4"/></>,
    shield: <><path d="M10 2L3 5v5c0 4.4 3 8.5 7 10 4-1.5 7-5.6 7-10V5l-7-3z"/></>,
    check: <><polyline points="20 6 9 17 4 12"/></>,
    mail: <><rect x="2" y="4" width="16" height="12" rx="2"/><polyline points="2 4 10 13 18 4"/></>,
    globe: <><circle cx="10" cy="10" r="8"/><path d="M2 10h16M10 2a14 14 0 0 1 0 16M10 2a14 14 0 0 0 0 16"/></>,
    location: <><path d="M10 2a6 6 0 0 0-6 6c0 5 6 12 6 12s6-7 6-12a6 6 0 0 0-6-6z"/><circle cx="10" cy="8" r="2"/></>,
    chevronRight: <><polyline points="9 18 15 12 9 6"/></>,
    chevronDown: <><polyline points="4 9 10 15 16 9"/></>,
    chevronUp: <><polyline points="16 13 10 7 4 13"/></>,
    star: <><polygon points="10 2 12.4 7.5 18.5 8 14 12.5 15.4 18.5 10 15.3 4.6 18.5 6 12.5 1.5 8 7.6 7.5"/></>,
    zap: <><polygon points="13 2 3 14 11 14 9 22 19 10 11 10"/></>,
    users: <><path d="M14 11c2.2 0 4 1.8 4 4v1H2v-1c0-2.2 1.8-4 4-4"/><circle cx="8" cy="7" r="3"/><path d="M16 7c1.1 0 2 .9 2 2s-.9 2-2 2"/></>,
    briefcase: <><rect x="2" y="7" width="16" height="11" rx="2"/><path d="M6 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></>,
    lock: <><rect x="4" y="9" width="12" height="9" rx="2"/><path d="M7 9V6a3 3 0 0 1 6 0v3"/><circle cx="10" cy="13.5" r="1"/></>,
    warning: <><path d="M10 2L1 18h18L10 2z"/><line x1="10" y1="10" x2="10" y2="13"/><circle cx="10" cy="16" r=".5" fill={color}/></>,
    clock: <><circle cx="10" cy="10" r="8"/><polyline points="10 5 10 10 13 13"/></>,
    phone: <><path d="M4 2h4l2 4.5-2 2a11 11 0 0 0 3.5 3.5l2-2L18 12v4a2 2 0 0 1-2 2A16 16 0 0 1 2 4a2 2 0 0 1 2-2z"/></>,
    refresh: <><polyline points="1 4 1 10 7 10"/><path d="M3.51 15A9 9 0 1 0 4.5 4.5L1 10"/></>,
    eye: <><path d="M1 10s3-6 9-6 9 6 9 6-3 6-9 6-9-6-9-6z"/><circle cx="10" cy="10" r="2.5"/></>,
    resume: <><rect x="3" y="2" width="14" height="17" rx="2"/><line x1="7" y1="7" x2="13" y2="7"/><line x1="7" y1="11" x2="13" y2="11"/><line x1="7" y1="15" x2="10" y2="15"/></>,
    flag: <><path d="M4 2v18M4 4h11l-3 4 3 4H4"/></>,
    key: <><circle cx="7" cy="11" r="4"/><path d="M14 7l5 5M19 7l-5 5"/></>,
    diamond: <><path d="M10 2L18 10L10 18L2 10Z"/></>,
  };
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" fill="none"
      stroke={color} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      {icons[name]}
    </svg>
  );
};

const Diamond = () => (
  <svg width="10" height="10" viewBox="0 0 10 10" fill={G.primary} style={{ flexShrink: 0, marginTop: 1 }}>
    <path d="M5 0L10 5L5 10L0 5Z"/>
  </svg>
);

const Check = () => (
  <svg width="14" height="14" viewBox="0 0 16 16" fill="none"
    stroke={G.primary} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
    style={{ flexShrink: 0, marginTop: 2 }}>
    <polyline points="14 4 6 12 2 8"/>
  </svg>
);

/* ─── help topics data ─── */
const HELP_TOPICS = [
  {
    id: "account",
    icon: "person",
    emoji: "👤",
    title: "Account & Profile",
    color: "#e6f2ff",
    borderColor: "#b3d4f5",
    iconColor: "#1a6aaa",
    items: [
      "How do I create an Uptula account?",
      "How can I update my profile?",
      "How do I change my password?",
      "How can I upload or update my resume?",
      "How do I deactivate my account?",
    ],
  },
  {
    id: "jobsearch",
    icon: "search",
    emoji: "🔍",
    title: "Job Search & Applications",
    color: G.light,
    borderColor: G.border,
    iconColor: G.primary,
    items: [
      "How do I search for jobs?",
      "How can I apply for a job?",
      "How do I track my job applications?",
      "Why am I not receiving interview calls?",
      "How can I improve my profile visibility?",
    ],
  },
  {
    id: "notifications",
    icon: "bell",
    emoji: "📩",
    title: "Notifications & Alerts",
    color: "#fff8e6",
    borderColor: "#f5dfa0",
    iconColor: "#a07800",
    items: [
      "How do I receive job alerts?",
      "Why am I not getting email notifications?",
      "How do I manage notification settings?",
      "Can I receive alerts based on skills or location?",
    ],
  },
  {
    id: "employer",
    icon: "building",
    emoji: "🏢",
    title: "Employer & Recruiter Support",
    color: "#f0eaff",
    borderColor: "#c8b0f5",
    iconColor: "#6a30c8",
    items: [
      "How do employers post jobs?",
      "How can recruiters contact candidates?",
      "How do I manage job postings?",
      "How can employers shortlist applicants?",
    ],
  },
  {
    id: "safety",
    icon: "shield",
    emoji: "🔒",
    title: "Safety & Security",
    color: "#ffeaea",
    borderColor: "#f5b3b3",
    iconColor: "#c82828",
    items: [
      "How can I identify fake job offers?",
      "Does Uptula charge candidates for jobs?",
      "How do I report suspicious activity?",
      "How do I protect my account?",
    ],
  },
];

const FAQS = [
  {
    q: "Is registration on Uptula free?",
    a: "Yes! Creating an account and applying for jobs on Uptula is completely free for job seekers.",
  },
  {
    q: "How do I apply for jobs?",
    a: 'Simply create your profile, upload your resume, and click the "Apply Now" button on any job listing that matches your skills.',
  },
  {
    q: "Can I upload my existing resume?",
    a: "Absolutely. You can upload your resume in PDF or DOC format and update it anytime.",
  },
  {
    q: "How can I improve my chances of getting shortlisted?",
    a: "Complete your profile with updated skills, a professional resume, relevant experience, correct job title, and updated contact details. Profiles with complete information are more likely to attract recruiters.",
  },
  {
    q: "Why am I not getting interview calls?",
    a: "This may happen if your profile is incomplete, resume keywords do not match job roles, experience details are missing, or your profile is outdated. We recommend updating your profile regularly and using role-specific skills.",
  },
  {
    q: "How do I reset my password?",
    a: 'Click on "Forgot Password" on the login page and follow the instructions sent to your registered email address.',
  },
  {
    q: "Can I hide my profile from recruiters?",
    a: "Yes. You can manage your profile visibility anytime from your account settings.",
  },
  {
    q: "How do I report fake recruiters or scam jobs?",
    a: "If you notice suspicious activity: report the job immediately, avoid making payments, and contact our support team. Your safety is our priority.",
  },
];

const TIPS = [
  { icon: "resume",   title: "Keep Your Resume Updated",       body: "Recruiters prefer recently updated profiles." },
  { icon: "zap",      title: "Add Relevant Skills",             body: "Use keywords related to your industry and job role." },
  { icon: "refresh",  title: "Apply Regularly",                 body: "Applying consistently increases visibility." },
  { icon: "bell",     title: "Enable Job Alerts",               body: "Get notified instantly about new opportunities." },
];

const OVERVIEW_CARDS = [
  { icon: "users",      title: "Job Seekers",  body: "Free registration, profile creation, resume upload, and direct applications to thousands of listed jobs." },
  { icon: "briefcase",  title: "Employers",    body: "Post jobs, manage listings, contact candidates, and shortlist the best talent for your organization." },
  { icon: "shield",     title: "Safe & Secure",body: "Uptula never charges job seekers. We verify recruiters and protect your data at every step." },
];

/* ─── FAQ Accordion ─── */
const FAQItem = ({ item, index }) => {
  const [open, setOpen] = useState(false);
  return (
    <div style={{
      background: G.white,
      border: `1px solid ${open ? G.primary : G.border}`,
      borderRadius: 12,
      overflow: "hidden",
      marginBottom: 12,
      boxShadow: open ? `0 4px 16px rgba(26,138,74,0.10)` : "0 1px 4px rgba(26,138,74,0.04)",
      transition: "box-shadow 0.2s, border-color 0.2s",
    }}>
      <button onClick={() => setOpen(!open)} style={{
        width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "18px 22px", background: "transparent", border: "none", cursor: "pointer",
        textAlign: "left", gap: 12,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <span style={{
            minWidth: 28, height: 28, borderRadius: "50%",
            background: open ? G.primary : G.light,
            color: open ? G.white : G.primary,
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 12, fontWeight: 700, flexShrink: 0,
            transition: "background 0.2s, color 0.2s",
            fontFamily: "Helvetica Neue, Helvetica, Arial, sans-serif",
          }}>{index + 1}</span>
          <span style={{
            fontSize: 15, fontWeight: 600, color: open ? G.primary : G.text,
            fontFamily: "Helvetica Neue, Helvetica, Arial, sans-serif",
            transition: "color 0.2s",
          }}>{item.q}</span>
        </div>
        <span style={{ flexShrink: 0, color: G.primary }}>
          <Icon name={open ? "chevronUp" : "chevronDown"} size={18} color={G.primary}/>
        </span>
      </button>
      <div style={{
        maxHeight: open ? 200 : 0,
        overflow: "hidden",
        transition: "max-height 0.3s ease",
      }}>
        <div style={{
          padding: "0 22px 18px 62px",
          fontSize: 14.5, color: G.muted, lineHeight: 1.75,
          fontFamily: "Helvetica Neue, Helvetica, Arial, sans-serif",
        }}>{item.a}</div>
      </div>
    </div>
  );
};

/* ─── section card wrapper identical to Privacy Policy ─── */
const SectionCard = ({ id, title, children, icon }) => (
  <div id={id} style={{
    background: G.white,
    border: `1px solid ${G.border}`,
    borderRadius: 14,
    overflow: "hidden",
    marginBottom: 20,
    boxShadow: "0 2px 12px rgba(26,138,74,0.06)",
  }}>
    <div style={{
      display: "flex", alignItems: "center", gap: 12,
      padding: "18px 28px",
      borderBottom: `1px solid ${G.light}`,
      background: G.lighter,
    }}>
      <Diamond />
      {icon && (
        <span style={{
          width: 38, height: 38, borderRadius: 9,
          background: G.light,
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          <Icon name={icon} size={18} color={G.primary}/>
        </span>
      )}
      <h2 style={{ fontSize: 18, fontWeight: 700, color: "#1a5c34",
        fontFamily: "Helvetica Neue, Helvetica, Arial, sans-serif", margin: 0 }}>
        {title}
      </h2>
    </div>
    <div style={{ padding: "22px 28px" }}>{children}</div>
  </div>
);

const NAV_SECTIONS = [
  { id: "topics",        label: "Help Topics" },
  { id: "faqs",          label: "FAQs" },
  { id: "tips",          label: "Tips for Job Seekers" },
  { id: "contact",       label: "Contact Support" },
];

export default function HelpCenter() {
  const [active, setActive] = useState("topics");
  const [searchVal, setSearchVal] = useState("");
  const obs = useRef(null);

  useEffect(() => {
    obs.current = new IntersectionObserver(
      (entries) => entries.forEach(e => e.isIntersecting && setActive(e.target.id)),
      { rootMargin: "-15% 0px -75% 0px" }
    );
    NAV_SECTIONS.forEach(({ id }) => {
      const el = document.getElementById(id);
      if (el) obs.current.observe(el);
    });
    return () => obs.current?.disconnect();
  }, []);

  const goto = (id) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <>
      <Header />
      <div style={{ background: G.lighter, minHeight: "100vh",
        fontFamily: "Helvetica Neue, Helvetica, Arial, sans-serif" }}>

      {/* ── HERO ── */}
      <header style={{
        background: `linear-gradient(135deg, #0a4a26 0%, ${G.dark} 40%, ${G.primary} 100%)`,
        padding: "60px 0 54px",
        position: "relative", overflow: "hidden",
        textAlign: "center",
      }}>
        <div style={{
          position: "absolute", inset: 0,
          backgroundImage: "radial-gradient(circle, rgba(255,255,255,0.06) 1px, transparent 1px)",
          backgroundSize: "32px 32px",
        }}/>
        <div style={{ position: "relative", zIndex: 1, padding: "0 28px" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center",
            gap: 8, marginBottom: 16 }}>
            <span style={{ color: "rgba(255,255,255,0.65)", fontSize: 14 }}>Home</span>
            <Icon name="chevronRight" size={14} color="rgba(255,255,255,0.65)"/>
            <span style={{ color: "#fff", fontSize: 14, fontWeight: 600 }}>Help Center</span>
          </div>
          <h1 style={{ color: "#fff", fontSize: 46, fontWeight: 800,
            letterSpacing: -1.5, margin: "0 0 12px",
            fontFamily: "Helvetica Neue, Helvetica, Arial, sans-serif" }}>
            Help Center
          </h1>
          <p style={{ color: "rgba(255,255,255,0.72)", fontSize: 16, margin: "0 0 32px" }}>
            How can we help you today?
          </p>
          {/* Search bar */}
          <div style={{ maxWidth: 560, margin: "0 auto", position: "relative" }}>
            <div style={{
              position: "absolute", left: 18, top: "50%", transform: "translateY(-50%)",
              pointerEvents: "none",
            }}>
              <Icon name="search" size={18} color="#aaa"/>
            </div>
            <input
              type="text"
              placeholder="Search for help topics, FAQs…"
              value={searchVal}
              onChange={e => setSearchVal(e.target.value)}
              style={{
                width: "100%", padding: "16px 18px 16px 48px",
                borderRadius: 40, border: "none", outline: "none",
                fontSize: 15, color: G.text,
                background: "rgba(255,255,255,0.97)",
                boxSizing: "border-box",
                boxShadow: "0 4px 24px rgba(0,0,0,0.18)",
                fontFamily: "Helvetica Neue, Helvetica, Arial, sans-serif",
              }}
            />
            <button style={{
              position: "absolute", right: 6, top: "50%", transform: "translateY(-50%)",
              background: G.primary, color: "#fff", border: "none",
              borderRadius: 32, padding: "10px 22px",
              fontSize: 14, fontWeight: 700, cursor: "pointer",
              fontFamily: "Helvetica Neue, Helvetica, Arial, sans-serif",
            }}>Search</button>
          </div>
        </div>
      </header>

      {/* ── OVERVIEW CARD GRID ── */}
      <section style={{ background: G.white, borderBottom: `1px solid ${G.border}`,
        padding: "44px 0 40px" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto", padding: "0 28px" }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 20 }}>
            {OVERVIEW_CARDS.map((card, i) => (
              <div key={i} style={{
                background: G.white, border: `1px solid ${G.border}`,
                borderRadius: 12, padding: "24px 22px",
                boxShadow: "0 2px 10px rgba(26,138,74,0.07)",
                display: "flex", flexDirection: "column", gap: 0,
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
                  <Diamond/>
                  <span style={{ fontSize: 15.5, fontWeight: 700, color: G.primary,
                    fontFamily: "Helvetica Neue, Helvetica, Arial, sans-serif" }}>{card.title}</span>
                </div>
                <p style={{ fontSize: 13.5, color: G.muted, lineHeight: 1.75,
                  fontFamily: "Helvetica Neue, Helvetica, Arial, sans-serif", margin: 0 }}>
                  {card.body}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── MAIN BODY: sidebar + content ── */}
      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "40px 28px",
        display: "flex", gap: 32, alignItems: "flex-start" }}>

        {/* ── SIDEBAR ── */}
        <aside style={{ width: 218, flexShrink: 0 }}>
          <div style={{ position: "sticky", top: 80 }}>
            <div style={{ background: G.white, border: `1px solid ${G.border}`,
              borderRadius: 14, overflow: "hidden",
              boxShadow: "0 2px 12px rgba(26,138,74,0.07)" }}>
              <div style={{ padding: "14px 18px",
                borderBottom: `1px solid ${G.light}`,
                background: G.lighter }}>
                <p style={{ fontSize: 12, fontWeight: 700, color: G.primary,
                  textTransform: "uppercase", letterSpacing: 1.1, margin: 0 }}>
                  On this page
                </p>
              </div>
              <div style={{ padding: "8px 0" }}>
                {NAV_SECTIONS.map(({ id, label }) => {
                  const isActive = active === id;
                  return (
                    <button key={id} onClick={() => goto(id)} style={{
                      display: "flex", alignItems: "center", gap: 8,
                      width: "100%", textAlign: "left",
                      background: isActive ? G.light : "transparent",
                      border: "none",
                      borderLeft: isActive ? `3px solid ${G.primary}` : "3px solid transparent",
                      padding: "8px 16px",
                      fontSize: 13, color: isActive ? G.primary : G.muted,
                      fontWeight: isActive ? 700 : 400,
                      cursor: "pointer", transition: "all 0.15s",
                      fontFamily: "Helvetica Neue, Helvetica, Arial, sans-serif",
                    }}>
                      {label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* quick contact card */}
            <div style={{
              marginTop: 16,
              background: `linear-gradient(135deg, ${G.dark}, ${G.primary})`,
              borderRadius: 14, padding: "20px 18px",
              boxShadow: "0 4px 16px rgba(26,138,74,0.18)",
            }}>
              <p style={{ color: "#fff", fontWeight: 700, fontSize: 14, margin: "0 0 6px" }}>
                Need more help?
              </p>
              <p style={{ color: "rgba(255,255,255,0.75)", fontSize: 12.5, lineHeight: 1.55, margin: "0 0 14px" }}>
                Our support team is here for you.
              </p>
              <a href="mailto:support@uptula.com" style={{
                display: "block", background: "rgba(255,255,255,0.15)",
                color: "#fff", textDecoration: "none",
                padding: "9px 0", borderRadius: 8, textAlign: "center",
                fontSize: 13, fontWeight: 700, border: "1px solid rgba(255,255,255,0.25)",
              }}>Contact Support</a>
            </div>
          </div>
        </aside>

        {/* ── MAIN CONTENT ── */}
        <main style={{ flex: 1, minWidth: 0 }}>

          {/* POPULAR HELP TOPICS */}
          <SectionCard id="topics" title="Popular Help Topics" icon="search">
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
              {HELP_TOPICS.map((topic) => (
                <div key={topic.id} style={{
                  background: topic.color,
                  border: `1px solid ${topic.borderColor}`,
                  borderRadius: 12, padding: "20px 18px",
                }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
                    <span style={{ fontSize: 20 }}>{topic.emoji}</span>
                    <span style={{ fontSize: 15, fontWeight: 700, color: topic.iconColor,
                      fontFamily: "Helvetica Neue, Helvetica, Arial, sans-serif" }}>
                      {topic.title}
                    </span>
                  </div>
                  <ul style={{ listStyle: "none", margin: 0, padding: 0,
                    display: "flex", flexDirection: "column", gap: 8 }}>
                    {topic.items.map((item, i) => (
                      <li key={i} style={{ display: "flex", alignItems: "flex-start", gap: 8 }}>
                        <svg width="14" height="14" viewBox="0 0 16 16" fill="none"
                          stroke={topic.iconColor} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                          style={{ flexShrink: 0, marginTop: 3 }}>
                          <polyline points="14 4 6 12 2 8"/>
                        </svg>
                        <a href="#" style={{ fontSize: 13.5, color: G.muted,
                          textDecoration: "none", lineHeight: 1.5,
                          fontFamily: "Helvetica Neue, Helvetica, Arial, sans-serif" }}
                          onMouseEnter={e => e.target.style.color = topic.iconColor}
                          onMouseLeave={e => e.target.style.color = G.muted}
                        >{item}</a>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </SectionCard>

          {/* SECURITY NOTICE */}
          <div style={{
            background: "#fff8e6",
            border: `1.5px solid #f5dfa0`,
            borderLeft: `4px solid #d4a000`,
            borderRadius: "0 10px 10px 0",
            padding: "13px 18px",
            fontSize: 14, color: "#6b4a00", lineHeight: 1.65,
            fontFamily: "Helvetica Neue, Helvetica, Arial, sans-serif",
            marginBottom: 20,
          }}>
            <strong>⚠️ Important:</strong> Uptula never asks job seekers for payment in exchange for interviews or job offers.
            Please avoid sharing bank details, OTPs, or personal financial information with unknown recruiters.
          </div>

          {/* FAQs */}
          <SectionCard id="faqs" title="Frequently Asked Questions" icon="search">
            <div>
              {FAQS.map((item, i) => (
                <FAQItem key={i} item={item} index={i}/>
              ))}
            </div>
          </SectionCard>

          {/* TIPS */}
          <SectionCard id="tips" title="Tips for Job Seekers" icon="star">
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
              {TIPS.map((tip, i) => (
                <div key={i} style={{
                  background: G.lighter, border: `1px solid ${G.border}`,
                  borderRadius: 12, padding: "20px 18px",
                  display: "flex", gap: 14, alignItems: "flex-start",
                }}>
                  <div style={{
                    width: 42, height: 42, borderRadius: 10, background: G.light,
                    display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                  }}>
                    <Icon name={tip.icon} size={18} color={G.primary}/>
                  </div>
                  <div>
                    <p style={{ fontSize: 14.5, fontWeight: 700, color: G.primary,
                      margin: "0 0 5px", fontFamily: "Helvetica Neue, Helvetica, Arial, sans-serif" }}>
                      ✔ {tip.title}
                    </p>
                    <p style={{ fontSize: 13.5, color: G.muted, margin: 0, lineHeight: 1.6,
                      fontFamily: "Helvetica Neue, Helvetica, Arial, sans-serif" }}>
                      {tip.body}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </SectionCard>

          {/* CONTACT SUPPORT */}
          <SectionCard id="contact" title="Contact Support" icon="mail">
            <p style={{ fontSize: 15, color: G.muted, lineHeight: 1.8, margin: "0 0 20px",
              fontFamily: "Helvetica Neue, Helvetica, Arial, sans-serif" }}>
              If you can't find the answer you're looking for, our support team is ready to assist you.
            </p>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16, marginBottom: 20 }}>
              {[
                { icon: "mail",  label: "Email",    value: "support@uptula.com", href: "mailto:support@uptula.com" },
                { icon: "clock", label: "Hours",    value: "Mon–Sat, 9AM–6PM" },
                { icon: "globe", label: "Website",  value: "www.uptula.com", href: "https://www.uptula.com" },
              ].map(({ icon, label, value, href }) => (
                <div key={label} style={{
                  background: G.lighter, border: `1px solid ${G.border}`,
                  borderRadius: 12, padding: "18px 16px",
                  display: "flex", flexDirection: "column", gap: 10, alignItems: "center",
                  textAlign: "center",
                }}>
                  <div style={{ width: 44, height: 44, borderRadius: "50%",
                    background: G.light, display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <Icon name={icon} size={20} color={G.primary}/>
                  </div>
                  <p style={{ fontSize: 12, color: G.muted, textTransform: "uppercase",
                    letterSpacing: 0.8, margin: 0, fontWeight: 600,
                    fontFamily: "Helvetica Neue, Helvetica, Arial, sans-serif" }}>{label}</p>
                  {href
                    ? <a href={href} style={{ fontSize: 14, color: G.primary, fontWeight: 700, textDecoration: "none",
                        fontFamily: "Helvetica Neue, Helvetica, Arial, sans-serif" }}>{value}</a>
                    : <p style={{ fontSize: 14, color: G.text, fontWeight: 600, margin: 0,
                        fontFamily: "Helvetica Neue, Helvetica, Arial, sans-serif" }}>{value}</p>
                  }
                </div>
              ))}
            </div>
          </SectionCard>

          {/* CTA BANNER */}
          <div style={{
            background: `linear-gradient(135deg, ${G.dark}, ${G.primary})`,
            borderRadius: 16, padding: "30px 34px",
            display: "flex", alignItems: "center",
            justifyContent: "space-between", gap: 24,
            boxShadow: "0 6px 24px rgba(26,138,74,0.22)",
            marginTop: 8,
          }}>
            <div>
              <h3 style={{ color: "#fff", fontSize: 20, fontWeight: 700, margin: "0 0 6px",
                fontFamily: "Helvetica Neue, Helvetica, Arial, sans-serif" }}>
                Still have questions?
              </h3>
              <p style={{ color: "rgba(255,255,255,0.78)", fontSize: 14, margin: 0,
                fontFamily: "Helvetica Neue, Helvetica, Arial, sans-serif" }}>
                Contact our support team and we'll help you right away.
              </p>
            </div>
            <a href="mailto:support@uptula.com" style={{
              background: "#fff", color: G.primary, textDecoration: "none",
              padding: "12px 28px", borderRadius: 30,
              fontWeight: 800, fontSize: 14, whiteSpace: "nowrap", flexShrink: 0,
              letterSpacing: 0.2, fontFamily: "Helvetica Neue, Helvetica, Arial, sans-serif",
            }}>CONTACT SUPPORT</a>
          </div>
        </main>
      </div>

      <style>{`
        * { box-sizing: border-box; }
        a:hover { opacity: 0.85; }
        button:hover { background: ${G.light} !important; }
        @media (max-width: 900px) {
          aside { display: none !important; }
        }
        @media (max-width: 720px) {
          .ov-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
      <Footer />
    </>
  );
}
