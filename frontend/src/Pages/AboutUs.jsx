import { useState, useEffect, useRef } from "react";
import Header from "../Components/Header";
import Footer from "../Components/Footer";

/* ─── brand tokens (identical to PrivacyPolicy.jsx) ─── */
const G = {
  primary: "#1a8a4a",
  dark:    "#0d5c30",
  light:   "#e8f5ee",
  lighter: "#f4fbf7",
  border:  "#c8e8d4",
  text:    "#1a2e22",
  muted:   "#4a6e5a",
  white:   "#ffffff",
};

/* ─── sidebar nav sections ─── */
const NAV = [
  { id: "about",        label: "About Uptula" },
  { id: "mission",      label: "Our Mission" },
  { id: "vision",       label: "Our Vision" },
  { id: "whatweoffer",  label: "What We Offer" },
  { id: "whychoose",    label: "Why Choose Uptula" },
  { id: "stats",        label: "Our Impact" },
  { id: "team",         label: "Our Values" },
  { id: "report",       label: "Report an Issue" },
  { id: "contact",      label: "Contact Us" },
];

/* ─── overview cards (top 3-col grid) ─── */
const OVERVIEW = [
  {
    icon: "briefcase",
    title: "About Uptula",
    type: "text",
    body: "At Uptula, we believe finding the right job should be simple, fast, and accessible for everyone. We are a smart job portal connecting talented job seekers with trusted employers.",
  },
  {
    icon: "target",
    title: "Our Mission",
    type: "bullets",
    items: [
      "Simplify hiring for employers across industries.",
      "Help candidates discover better career opportunities faster.",
      "Bridge the gap between talent and opportunity.",
    ],
  },
  {
    icon: "users",
    title: "What We Offer",
    type: "bullets",
    items: [
      "Smart job matching powered by intelligent search.",
      "Thousands of verified employers across industries.",
      "Easy application process and resume tools.",
    ],
  },
  {
    icon: "shield",
    title: "Our Values",
    type: "text",
    body: "We focus on creating a user-friendly, reliable, and efficient hiring experience built on trust, transparency, and accessibility for every job seeker and employer.",
  },
  {
    icon: "star",
    title: "Why Choose Uptula",
    type: "text",
    body: "Trusted by thousands of job seekers and employers. Dedicated support, data privacy, and real-time job alerts — available on web and mobile.",
  },
  {
    icon: "rocket",
    title: "Your Career Starts Here",
    type: "text",
    body: "Whether you are a fresher starting your journey or an experienced professional looking for growth, Uptula is here to support every step of your career path.",
  },
];

/* ─── inline SVG icon set ─── */
const Icon = ({ name, size = 20, color = G.primary }) => {
  const icons = {
    briefcase: <><rect x="2" y="7" width="16" height="11" rx="2"/><path d="M6 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></>,
    target:    <><circle cx="10" cy="10" r="8"/><circle cx="10" cy="10" r="4"/><circle cx="10" cy="10" r="1" fill={color}/></>,
    users:     <><path d="M13 15c0-2.2-1.8-4-4-4S5 12.8 5 15"/><circle cx="9" cy="8" r="3"/><path d="M17 15c0-1.5-.8-2.8-2-3.5"/><circle cx="15" cy="8" r="2.5"/></>,
    shield:    <><path d="M10 2L3 5v5c0 4.4 3 8.5 7 10 4-1.5 7-5.6 7-10V5l-7-3z"/></>,
    star:      <><polygon points="10 2 12.4 7.5 18 8.2 14 12.1 15.1 18 10 15.3 4.9 18 6 12.1 2 8.2 7.6 7.5 10 2"/></>,
    rocket:    <><path d="M10 2s4 2 4 8c0 3-1.5 5.5-4 7-2.5-1.5-4-4-4-7 0-6 4-8 4-8z"/><path d="M6.5 14.5L3 18M13.5 14.5L17 18"/><circle cx="10" cy="10" r="1.5" fill={color}/></>,
    mail:      <><rect x="2" y="4" width="16" height="12" rx="2"/><polyline points="2 4 10 13 18 4"/></>,
    globe:     <><circle cx="10" cy="10" r="8"/><path d="M2 10h16M10 2a14 14 0 0 1 0 16M10 2a14 14 0 0 0 0 16"/></>,
    location:  <><path d="M10 2a6 6 0 0 0-6 6c0 5 6 12 6 12s6-7 6-12a6 6 0 0 0-6-6z"/><circle cx="10" cy="8" r="2"/></>,
    check2:    <><polyline points="20 6 9 17 4 12"/></>,
    heart:     <><path d="M10 17s-7-4.35-7-9a5 5 0 0 1 9.54-2.1A5 5 0 0 1 17 8c0 4.65-7 9-7 9z"/></>,
    lightbulb: <><path d="M9 18h2M10 2a6 6 0 0 1 5 9.33V14H5v-2.67A6 6 0 0 1 10 2z"/></>,
    award:     <><circle cx="10" cy="8" r="6"/><path d="M7.22 13.7L6 18l4-2.5L14 18l-1.22-4.3"/></>,
    phone:     <><path d="M15.05 5A5 5 0 0 1 19 8.95M15.05 1A9 9 0 0 1 23 8.94m-1 7.98v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 3.09 9.17 19.79 19.79 0 0 1 0 .5 2 2 0 0 1 1.98-1.5h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L6.91 6.91"/></>,
    alert:     <><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="10" y1="9" x2="10" y2="13"/><line x1="10" y1="17" x2="10.01" y2="17"/></>,
  };
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" fill="none"
      stroke={color} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      {icons[name]}
    </svg>
  );
};

/* ─── diamond bullet (identical to PrivacyPolicy.jsx) ─── */
const Diamond = () => (
  <svg width="10" height="10" viewBox="0 0 10 10" fill={G.primary} style={{ flexShrink: 0, marginTop: 1 }}>
    <path d="M5 0L10 5L5 10L0 5Z"/>
  </svg>
);

/* ─── green checkmark for bullet lists ─── */
const Check = () => (
  <svg width="14" height="14" viewBox="0 0 16 16" fill="none"
    stroke={G.primary} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
    style={{ flexShrink: 0, marginTop: 2 }}>
    <polyline points="14 4 6 12 2 8"/>
  </svg>
);

/* ─── section card (identical structure to PrivacyPolicy.jsx) ─── */
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
          <Icon name={icon} size={18} color={G.primary} />
        </span>
      )}
      <h2 style={{
        fontSize: 18, fontWeight: 700, color: "#1a5c34",
        fontFamily: "Helvetica Neue, Helvetica, Arial, sans-serif", margin: 0,
      }}>
        {title}
      </h2>
    </div>
    <div style={{ padding: "22px 28px" }}>{children}</div>
  </div>
);

/* ─── paragraph ─── */
const Para = ({ children }) => (
  <p style={{
    fontSize: 15, color: G.muted, lineHeight: 1.8,
    fontFamily: "Helvetica Neue, Helvetica, Arial, sans-serif",
    margin: "0 0 12px",
  }}>{children}</p>
);

/* ─── sub-heading inside a card ─── */
const Sub = ({ children }) => (
  <h3 style={{
    fontSize: 15, fontWeight: 700, color: G.primary,
    fontFamily: "Helvetica Neue, Helvetica, Arial, sans-serif",
    margin: "18px 0 10px",
  }}>{children}</h3>
);

/* ─── bullet list with green checks ─── */
const BulletList = ({ items }) => (
  <ul style={{ listStyle: "none", display: "flex", flexDirection: "column", gap: 10, margin: "10px 0", padding: 0 }}>
    {items.map((item, i) => (
      <li key={i} style={{
        display: "flex", alignItems: "flex-start", gap: 10,
        fontSize: 15, color: G.muted, lineHeight: 1.6,
        fontFamily: "Helvetica Neue, Helvetica, Arial, sans-serif",
      }}>
        <Check /><span>{item}</span>
      </li>
    ))}
  </ul>
);

/* ─── info / success badge ─── */
const InfoBadge = ({ children, success }) => (
  <div style={{
    background: success ? "#e6f7ee" : G.lighter,
    border: `1.5px solid ${G.border}`,
    borderLeft: `4px solid ${G.primary}`,
    borderRadius: "0 10px 10px 0",
    padding: "13px 18px",
    fontSize: 14.5,
    color: "#155534",
    lineHeight: 1.65,
    fontFamily: "Helvetica Neue, Helvetica, Arial, sans-serif",
    margin: "14px 0",
  }}>
    {children}
  </div>
);

/* ─── 3-col overview card (top section) ─── */
const OverviewCard = ({ card }) => (
  <div style={{
    background: G.white,
    border: `1px solid ${G.border}`,
    borderRadius: 12,
    padding: "24px 22px",
    boxShadow: "0 2px 10px rgba(26,138,74,0.07)",
    display: "flex", flexDirection: "column", gap: 0,
  }}>
    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
      <Diamond />
      <span style={{
        fontSize: 15.5, fontWeight: 700, color: G.primary,
        fontFamily: "Helvetica Neue, Helvetica, Arial, sans-serif",
      }}>{card.title}</span>
    </div>
    {card.type === "text" ? (
      <p style={{
        fontSize: 13.5, color: G.muted, lineHeight: 1.75,
        fontFamily: "Helvetica Neue, Helvetica, Arial, sans-serif", margin: 0,
      }}>{card.body}</p>
    ) : (
      <ul style={{ listStyle: "none", display: "flex", flexDirection: "column", gap: 9, margin: 0, padding: 0 }}>
        {card.items.map((item, i) => (
          <li key={i} style={{
            display: "flex", alignItems: "flex-start", gap: 8,
            fontSize: 13.5, color: G.muted, lineHeight: 1.65,
            fontFamily: "Helvetica Neue, Helvetica, Arial, sans-serif",
          }}>
            <Check /><span>{item}</span>
          </li>
        ))}
      </ul>
    )}
  </div>
);

/* ─── report issue form ─── */
const ReportForm = () => {
  const [form, setForm] = useState({ name: "", email: "", category: "", message: "" });
  const [submitted, setSubmitted] = useState(false);

  const inp = {
    width: "100%", padding: "10px 14px", borderRadius: 8,
    border: `1.5px solid ${G.border}`, fontSize: 14,
    fontFamily: "Helvetica Neue, Helvetica, Arial, sans-serif",
    color: G.text, background: G.lighter, outline: "none",
    boxSizing: "border-box", transition: "border-color 0.2s",
  };

  if (submitted) return (
    <div style={{
      background: "#e6f7ee", border: `1.5px solid ${G.primary}`,
      borderRadius: 12, padding: "32px 24px", textAlign: "center",
    }}>
      <svg width="48" height="48" viewBox="0 0 48 48" fill="none" style={{ marginBottom: 12 }}>
        <circle cx="24" cy="24" r="24" fill={G.light}/>
        <polyline points="14 24 21 31 34 16" stroke={G.primary} strokeWidth="3"
          strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
      <h3 style={{ fontFamily: "Helvetica Neue, Helvetica, Arial, sans-serif",
        color: G.text, fontSize: 19, fontWeight: 700, margin: "0 0 8px" }}>
        Issue Reported Successfully!
      </h3>
      <p style={{ fontFamily: "Helvetica Neue, Helvetica, Arial, sans-serif",
        color: G.muted, fontSize: 14, margin: "0 0 18px" }}>
        Our team will review your request and respond within 24 hours.
      </p>
      <button onClick={() => { setSubmitted(false); setForm({ name:"", email:"", category:"", message:"" }); }}
        style={{
          background: G.primary, color: "#fff", border: "none", borderRadius: 24,
          padding: "9px 26px", fontFamily: "Helvetica Neue, Helvetica, Arial, sans-serif",
          fontWeight: 700, fontSize: 14, cursor: "pointer",
        }}>Report Another Issue</button>
    </div>
  );

  return (
    <form onSubmit={e => { e.preventDefault(); if (form.name && form.email && form.message) setSubmitted(true); }}
      style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
        <div>
          <label style={{ fontSize: 13, fontWeight: 600, color: G.muted, display: "block", marginBottom: 5,
            fontFamily: "Helvetica Neue, Helvetica, Arial, sans-serif" }}>
            Full Name <span style={{ color: "#c0392b" }}>*</span>
          </label>
          <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })}
            placeholder="Your name" style={inp} required />
        </div>
        <div>
          <label style={{ fontSize: 13, fontWeight: 600, color: G.muted, display: "block", marginBottom: 5,
            fontFamily: "Helvetica Neue, Helvetica, Arial, sans-serif" }}>
            Email Address <span style={{ color: "#c0392b" }}>*</span>
          </label>
          <input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })}
            placeholder="you@email.com" style={inp} required />
        </div>
      </div>
      <div>
        <label style={{ fontSize: 13, fontWeight: 600, color: G.muted, display: "block", marginBottom: 5,
          fontFamily: "Helvetica Neue, Helvetica, Arial, sans-serif" }}>Issue Category</label>
        <select value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}
          style={{ ...inp, cursor: "pointer" }}>
          <option value="">Select a category</option>
          <option>Job Application Issue</option>
          <option>Login / Account Problem</option>
          <option>Incorrect Information</option>
          <option>Technical Error</option>
          <option>Payment / Billing</option>
          <option>Other</option>
        </select>
      </div>
      <div>
        <label style={{ fontSize: 13, fontWeight: 600, color: G.muted, display: "block", marginBottom: 5,
          fontFamily: "Helvetica Neue, Helvetica, Arial, sans-serif" }}>
          Describe Your Issue <span style={{ color: "#c0392b" }}>*</span>
        </label>
        <textarea rows={5} value={form.message} onChange={e => setForm({ ...form, message: e.target.value })}
          placeholder="Please describe your issue in detail so our support team can help you better…"
          style={{ ...inp, resize: "vertical", lineHeight: 1.6 }} required />
      </div>
      <button type="submit" style={{
        background: G.primary, color: "#fff", border: "none",
        borderRadius: 28, padding: "12px 0",
        fontFamily: "Helvetica Neue, Helvetica, Arial, sans-serif",
        fontWeight: 800, fontSize: 14.5, cursor: "pointer", letterSpacing: 0.4,
        transition: "background 0.2s",
      }}
        onMouseOver={e => e.currentTarget.style.background = G.dark}
        onMouseOut={e => e.currentTarget.style.background = G.primary}>
        SUBMIT ISSUE REPORT
      </button>
    </form>
  );
};


/* ════════════════════════════════════════
   MAIN PAGE — mirrors PrivacyPolicy.jsx
═══════════════════════════════════════ */
export default function AboutUs() {
  const [active, setActive]   = useState("about");
  const obs = useRef(null);

  useEffect(() => {
    obs.current = new IntersectionObserver(
      (entries) => entries.forEach(e => e.isIntersecting && setActive(e.target.id)),
      { rootMargin: "-15% 0px -75% 0px" }
    );
    NAV.forEach(({ id }) => {
      const el = document.getElementById(id);
      if (el) obs.current.observe(el);
    });
    return () => obs.current?.disconnect();
  }, []);

  const goto = (id) =>
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });

  return (
    <>
      <Header />
      <div style={{ background: "#f4fbf7", minHeight: "100vh",
        fontFamily: "Helvetica Neue, Helvetica, Arial, sans-serif" }}>

      {/* ══ HERO (same gradient, dot pattern, breadcrumb) ══ */}
      <header style={{
        background: `linear-gradient(135deg, #0a4a26 0%, ${G.dark} 40%, ${G.primary} 100%)`,
        padding: "60px 0 50px",
        position: "relative", overflow: "hidden",
        textAlign: "center",
      }}>
        <div style={{
          position: "absolute", inset: 0,
          backgroundImage: "radial-gradient(circle, rgba(255,255,255,0.06) 1px, transparent 1px)",
          backgroundSize: "32px 32px",
        }}/>
        <div style={{ position: "relative", zIndex: 1 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center",
            gap: 8, marginBottom: 16 }}>
            <span style={{ color: "rgba(255,255,255,0.65)", fontSize: 14 }}>Home</span>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
              stroke="rgba(255,255,255,0.65)" strokeWidth="2.5">
              <polyline points="9 18 15 12 9 6"/>
            </svg>
            <span style={{ color: "#fff", fontSize: 14, fontWeight: 600 }}>About Us</span>
          </div>
          <h1 style={{
            color: "#fff", fontSize: 46, fontWeight: 800,
            letterSpacing: -1.5, margin: "0 0 12px",
            fontFamily: "Helvetica Neue, Helvetica, Arial, sans-serif",
          }}>
            About Us
          </h1>
          <p style={{ color: "rgba(255,255,255,0.72)", fontSize: 15, margin: 0 }}>
            Connecting Talent with Opportunity
          </p>
        </div>
      </header>

      {/* ══ OVERVIEW CARD GRID (3-col, same as PrivacyPolicy) ══ */}
      <section style={{ background: G.white, borderBottom: `1px solid ${G.border}`,
        padding: "44px 0 40px" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto", padding: "0 28px" }}>
          <div className="ov-grid" style={{
            display: "grid",
            gridTemplateColumns: "repeat(3, 1fr)",
            gap: 20,
          }}>
            {OVERVIEW.map((card, i) => <OverviewCard key={i} card={card} />)}
          </div>
        </div>
      </section>

      {/* ══ MAIN: sidebar + content ══ */}
      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "40px 28px",
        display: "flex", gap: 32, alignItems: "flex-start" }}>

        {/* ── SIDEBAR (identical structure to PrivacyPolicy) ── */}
        <aside style={{ width: 218, flexShrink: 0 }}>
          <div style={{ position: "sticky", top: 80 }}>
            {/* nav card */}
            <div style={{
              background: G.white, border: `1px solid ${G.border}`,
              borderRadius: 14, overflow: "hidden",
              boxShadow: "0 2px 12px rgba(26,138,74,0.07)",
            }}>
              <div style={{ padding: "14px 18px",
                borderBottom: `1px solid ${G.light}`, background: G.lighter }}>
                <p style={{ fontSize: 12, fontWeight: 700, color: G.primary,
                  textTransform: "uppercase", letterSpacing: 1.1, margin: 0 }}>
                  On this page
                </p>
              </div>
              <div style={{ padding: "8px 0" }}>
                {NAV.map(({ id, label }) => {
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

            {/* need help mini card (same as PrivacyPolicy sidebar) */}
            <div style={{
              marginTop: 16, background: G.primary,
              borderRadius: 14, padding: "20px 18px",
              boxShadow: "0 4px 14px rgba(26,138,74,0.25)",
            }}>
              <p style={{ color: "#fff", fontWeight: 700, fontSize: 15, margin: "0 0 6px" }}>
                Questions about Uptula?
              </p>
              <p style={{ color: "rgba(255,255,255,0.75)", fontSize: 13,
                lineHeight: 1.55, margin: "0 0 14px" }}>
                Contact our support team for any requests.
              </p>
              <a href="mailto:support@uptula.com" style={{
                display: "inline-block",
                background: "#fff", color: G.primary,
                textDecoration: "none", padding: "8px 18px",
                borderRadius: 24, fontSize: 13, fontWeight: 700,
              }}>Contact Support</a>
            </div>
          </div>
        </aside>

        {/* ══ SECTION CARDS ══ */}
        <main style={{ flex: 1, minWidth: 0 }}>

          {/* 1. About Uptula */}
          <SectionCard id="about" title="About Uptula" icon="briefcase">
            <Para>
              At <strong style={{ color: G.primary }}>Uptula</strong>, we believe finding the
              right job should be simple, fast, and accessible for everyone. We are a smart job
              portal connecting talented job seekers with trusted employers across multiple industries.
            </Para>
            <Para>
              Our platform is designed to help candidates discover better career opportunities while
              enabling companies to hire the right talent with ease.
            </Para>
            <InfoBadge success>
              <strong>Your Career Starts Here.</strong> Whether you are a fresher or an experienced
              professional, Uptula is built to support every stage of your journey.
            </InfoBadge>
          </SectionCard>

          {/* 2. Mission */}
          <SectionCard id="mission" title="Our Mission" icon="target">
            <Para>
              Our mission is to simplify the hiring process and help candidates discover better
              career opportunities faster. We focus on creating a user-friendly, reliable, and
              efficient hiring experience that bridges the gap between talent and opportunity.
            </Para>
            <Sub>What drives us every day</Sub>
            <BulletList items={[
              "Make job searching accessible to every individual, regardless of background.",
              "Simplify the recruitment workflow for employers of all sizes.",
              "Build a trusted ecosystem where candidates and companies thrive together.",
              "Continuously improve our platform based on real user feedback.",
            ]}/>
          </SectionCard>

          {/* 3. Vision */}
          <SectionCard id="vision" title="Our Vision" icon="star">
            <Para>
              We envision a world where every talented professional can find a role that matches
              their skills, ambitions, and values — without barriers or delays.
            </Para>
            <Para>
              Uptula is committed to becoming the most trusted job portal across South Asia and
              beyond, powered by technology and a deep understanding of the hiring landscape.
            </Para>
            <Sub>Looking ahead</Sub>
            <BulletList items={[
              "Expand into new industries and geographies.",
              "Introduce AI-powered career guidance and skill matching.",
              "Build tools that empower freshers to compete equally.",
              "Create a community of professionals supporting each other's growth.",
            ]}/>
          </SectionCard>

          {/* 4. What We Offer */}
          <SectionCard id="whatweoffer" title="What We Offer" icon="rocket">
            <Para>
              Uptula is packed with features designed to make your job search or hiring process
              smooth, fast, and effective.
            </Para>
            <Sub>For Job Seekers</Sub>
            <BulletList items={[
              "Smart job matching powered by intelligent search and filters.",
              "Real-time job alerts and push notifications.",
              "Easy one-click application process.",
              "Resume builder and profile management tools.",
              "Application status tracking in one dashboard.",
            ]}/>
            <Sub>For Employers & Recruiters</Sub>
            <BulletList items={[
              "Access to a large pool of verified candidate profiles.",
              "Advanced search filters to find the right talent quickly.",
              "Recruitment dashboard to manage job postings and applications.",
              "Shortlisting and communication tools built in.",
              "Analytics to measure your hiring performance.",
            ]}/>
          </SectionCard>

          {/* 5. Why Choose Uptula */}
          <SectionCard id="whychoose" title="Why Choose Uptula?" icon="shield">
            <InfoBadge success>
              <strong>Trusted by thousands of job seekers and employers across industries.</strong>
            </InfoBadge>
            <BulletList items={[
              "User-friendly interface suitable for all experience levels.",
              "Verified employers and legitimate job listings only.",
              "Data privacy and security as our top priority.",
              "Dedicated support team available to assist you at every step.",
              "Available on web and mobile — apply on the go.",
              "Completely free for job seekers to register and apply.",
            ]}/>
          </SectionCard>

          {/* 6. Stats / Impact */}
          <SectionCard id="stats" title="Our Impact" icon="award">
            <Para>
              Since our launch, Uptula has helped thousands of professionals find meaningful
              work and enabled hundreds of companies to build strong teams.
            </Para>
            <div style={{
              display: "grid", gridTemplateColumns: "repeat(4, 1fr)",
              gap: 16, marginTop: 20,
            }}>
              {[
                { num: "50K+",  label: "Job Seekers" },
                { num: "5K+",   label: "Employers" },
                { num: "200+",  label: "Industries" },
                { num: "98%",   label: "Satisfaction Rate" },
              ].map(({ num, label }) => (
                <div key={label} style={{
                  background: G.lighter, border: `1px solid ${G.border}`,
                  borderRadius: 12, padding: "20px 16px", textAlign: "center",
                }}>
                  <div style={{ fontSize: 30, fontWeight: 800, color: G.primary,
                    fontFamily: "Helvetica Neue, Helvetica, Arial, sans-serif" }}>{num}</div>
                  <div style={{ fontSize: 13, color: G.muted, marginTop: 4,
                    fontFamily: "Helvetica Neue, Helvetica, Arial, sans-serif" }}>{label}</div>
                </div>
              ))}
            </div>
          </SectionCard>

          {/* 7. Our Values */}
          <SectionCard id="team" title="Our Values" icon="heart">
            <Para>
              Everything we build at Uptula is grounded in a set of core values that guide our
              decisions, our product, and the way we treat every user on our platform.
            </Para>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginTop: 16 }}>
              {[
                { icon: "shield",    title: "Trust & Safety",   desc: "Verified listings and secure data handling." },
                { icon: "users",     title: "Inclusivity",      desc: "Equal access for every job seeker." },
                { icon: "lightbulb", title: "Innovation",       desc: "Constantly improving with technology." },
                { icon: "heart",     title: "User First",       desc: "Every decision starts with our users." },
              ].map(v => (
                <div key={v.title} style={{
                  background: G.lighter, border: `1px solid ${G.border}`,
                  borderRadius: 12, padding: "18px 16px",
                  display: "flex", gap: 14, alignItems: "flex-start",
                }}>
                  <span style={{ width: 38, height: 38, borderRadius: 9, background: G.light,
                    display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <Icon name={v.icon} size={18} color={G.primary}/>
                  </span>
                  <div>
                    <p style={{ fontSize: 14, fontWeight: 700, color: G.text, margin: "0 0 4px",
                      fontFamily: "Helvetica Neue, Helvetica, Arial, sans-serif" }}>{v.title}</p>
                    <p style={{ fontSize: 13, color: G.muted, margin: 0, lineHeight: 1.6,
                      fontFamily: "Helvetica Neue, Helvetica, Arial, sans-serif" }}>{v.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </SectionCard>

          {/* 8. Report an Issue */}
          <SectionCard id="report" title="Report an Issue" icon="alert">
            <Para>
              Facing any problem while using Uptula? We're here to help you. Whether it's a
              job application issue, login problem, incorrect information, technical error, or
              any other concern — simply report it to our support team.
            </Para>
            <Para>
              We'll review your request and work to resolve it as quickly as possible. Your
              feedback helps us improve the Uptula experience for every job seeker and employer.
            </Para>
            <InfoBadge>
              <strong>Average response time: under 24 hours.</strong> Our support team reviews
              every report and responds promptly.
            </InfoBadge>
            <div style={{ marginTop: 20 }}>
              <ReportForm />
            </div>
          </SectionCard>

          {/* 9. Contact Us */}
          <SectionCard id="contact" title="Contact Us" icon="mail">
            <Para>
              Have questions, feedback, or need assistance? Our team is always ready to help.
            </Para>
            <div style={{
              display: "grid", gridTemplateColumns: "1fr 1fr 1fr",
              gap: 16, marginTop: 16,
            }}>
              {[
                { icon: "location", label: "Company",  value: "Uptula Official Website" },
                { icon: "mail",     label: "Email",    value: "support@uptula.com",  href: "mailto:support@uptula.com" },
                { icon: "globe",    label: "Website",  value: "www.uptula.com",       href: "https://www.uptula.com" },
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
                    letterSpacing: 0.8, margin: 0, fontWeight: 600 }}>{label}</p>
                  {href
                    ? <a href={href} style={{ fontSize: 14, color: G.primary,
                        fontWeight: 700, textDecoration: "none" }}>{value}</a>
                    : <p style={{ fontSize: 14, color: G.text, fontWeight: 600, margin: 0 }}>{value}</p>
                  }
                </div>
              ))}
            </div>
          </SectionCard>

          {/* ── CTA BANNER (identical to PrivacyPolicy bottom CTA) ── */}
          <div style={{
            background: `linear-gradient(135deg, ${G.dark}, ${G.primary})`,
            borderRadius: 16, padding: "30px 34px",
            display: "flex", alignItems: "center",
            justifyContent: "space-between", gap: 24,
            boxShadow: "0 6px 24px rgba(26,138,74,0.22)",
            marginTop: 8,
          }}>
            <div>
              <h3 style={{ color: "#fff", fontSize: 20, fontWeight: 700, margin: "0 0 6px" }}>
                Questions about Uptula?
              </h3>
              <p style={{ color: "rgba(255,255,255,0.78)", fontSize: 14, margin: 0 }}>
                Contact our support team and we'll help you with any request.
              </p>
            </div>
            <a href="mailto:support@uptula.com" style={{
              background: "#fff", color: G.primary, textDecoration: "none",
              padding: "12px 28px", borderRadius: 30,
              fontWeight: 800, fontSize: 14, whiteSpace: "nowrap", flexShrink: 0,
              letterSpacing: 0.2,
            }}>CONTACT SUPPORT</a>
          </div>

        </main>
      </div>

      <style>{`
        * { box-sizing: border-box; }
        a:hover { opacity: 0.85; }
        button:hover { background: ${G.light} !important; }
        input:focus, select:focus, textarea:focus {
          border-color: ${G.primary} !important;
          outline: none;
        }
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
