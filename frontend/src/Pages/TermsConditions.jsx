import { useState, useEffect, useRef } from "react";
import Header from "../Components/Header";
import Footer from "../Components/Footer";
/* ─── brand tokens ─── */
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

/* ─── sidebar nav ─── */
const NAV = [
  { id: "acceptance",     label: "Acceptance of Terms" },
  { id: "about",          label: "About Uptula" },
  { id: "eligibility",    label: "Eligibility" },
  { id: "accounts",       label: "User Accounts" },
  { id: "jobseeker",      label: "Job Seeker Terms" },
  { id: "employer",       label: "Employer & Recruiter Terms" },
  { id: "conduct",        label: "Prohibited Conduct" },
  { id: "content",        label: "User Content" },
  { id: "ip",             label: "Intellectual Property" },
  { id: "payments",       label: "Payments & Subscriptions" },
  { id: "privacy",        label: "Privacy & Data" },
  { id: "disclaimer",     label: "Disclaimers" },
  { id: "liability",      label: "Limitation of Liability" },
  { id: "indemnification",label: "Indemnification" },
  { id: "termination",    label: "Termination" },
  { id: "governing",      label: "Governing Law" },
  { id: "changes",        label: "Changes to Terms" },
  { id: "contact",        label: "Contact Us" },
];

/* ─── top overview cards ─── */
const OVERVIEW = [
  {
    title: "Platform Usage",
    type: "bullets",
    items: [
      "By using Uptula, you agree to these Terms & Conditions.",
      "You must be legally eligible to work or hire.",
      "Accounts must have accurate, up-to-date information.",
    ],
  },
  {
    title: "User Responsibilities",
    type: "bullets",
    items: [
      "Job seekers must submit genuine profiles and resumes.",
      "Employers must post accurate and lawful job listings.",
      "Prohibited conduct includes spam, fraud, and misuse.",
    ],
  },
  {
    title: "Your Rights & Limits",
    type: "bullets",
    items: [
      "Content you post remains your responsibility.",
      "Uptula's IP may not be copied or reproduced.",
      "We may suspend accounts for violations.",
    ],
  },
  {
    title: "Payments",
    type: "text",
    body: "Certain features require a paid subscription. All fees are non-refundable unless stated otherwise. We reserve the right to change pricing with notice.",
  },
  {
    title: "Disclaimers",
    type: "text",
    body: "Uptula does not guarantee job placements or hiring outcomes. The platform is provided 'as-is' and we are not liable for third-party content or actions.",
  },
  {
    title: "Changes to Terms",
    type: "text",
    body: "We may update these Terms periodically. Continued use of Uptula after changes constitutes your acceptance of the revised terms.",
  },
];

/* ─── inline SVG icons ─── */
const Icon = ({ name, size = 20, color = G.primary }) => {
  const icons = {
    check2:     <><polyline points="20 6 9 17 4 12"/></>,
    briefcase:  <><rect x="2" y="7" width="16" height="11" rx="2"/><path d="M6 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></>,
    person:     <><circle cx="10" cy="6" r="3.5"/><path d="M2 19c0-4.4 3.6-8 8-8s8 3.6 8 8" strokeLinecap="round"/></>,
    shield:     <><path d="M10 2L3 5v5c0 4.4 3 8.5 7 10 4-1.5 7-5.6 7-10V5l-7-3z"/></>,
    ban:        <><circle cx="10" cy="10" r="8"/><line x1="4" y1="4" x2="16" y2="16"/></>,
    file:       <><path d="M13 2H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7z"/><polyline points="13 2 13 7 18 7"/></>,
    lock:       <><rect x="3" y="10" width="14" height="10" rx="2"/><path d="M7 10V7a5 5 0 0 1 10 0v3"/></>,
    card:       <><rect x="1" y="4" width="18" height="13" rx="2"/><line x1="1" y1="9" x2="19" y2="9"/></>,
    database:   <><ellipse cx="10" cy="5" rx="7" ry="2.5"/><path d="M3 5v4c0 1.4 3.1 2.5 7 2.5s7-1.1 7-2.5V5"/><path d="M3 9v4c0 1.4 3.1 2.5 7 2.5s7-1.1 7-2.5V9"/><path d="M3 13v4c0 1.4 3.1 2.5 7 2.5s7-1.1 7-2.5v-4"/></>,
    alert:      <><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></>,
    slash:      <><circle cx="10" cy="10" r="8"/><line x1="4.93" y1="4.93" x2="15.07" y2="15.07"/></>,
    globe:      <><circle cx="10" cy="10" r="8"/><path d="M2 10h16M10 2a14 14 0 0 1 0 16M10 2a14 14 0 0 0 0 16"/></>,
    refresh:    <><polyline points="1 4 1 10 7 10"/><path d="M3.51 15A9 9 0 1 0 4.5 4.5L1 10"/></>,
    mail:       <><rect x="2" y="4" width="16" height="12" rx="2"/><polyline points="2 4 10 13 18 4"/></>,
    location:   <><path d="M10 2a6 6 0 0 0-6 6c0 5 6 12 6 12s6-7 6-12a6 6 0 0 0-6-6z"/><circle cx="10" cy="8" r="2"/></>,
    users:      <><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></>,
    scroll:     <><path d="M14 2H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h8"/><path d="M14 2v4h4"/><line x1="8" y1="13" x2="16" y2="13"/><line x1="8" y1="9" x2="16" y2="9"/><line x1="8" y1="17" x2="10" y2="17"/></>,
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

/* ─── reusable card shell ─── */
const SectionCard = ({ id, title, icon, children }) => (
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
      <h2 style={{ fontSize: 18, fontWeight: 700, color: "#1a5c34",
        fontFamily: "Helvetica Neue, Helvetica, Arial, sans-serif", margin: 0 }}>
        {title}
      </h2>
    </div>
    <div style={{ padding: "22px 28px" }}>{children}</div>
  </div>
);

const Para = ({ children }) => (
  <p style={{
    fontSize: 15, color: G.muted, lineHeight: 1.8,
    fontFamily: "Helvetica Neue, Helvetica, Arial, sans-serif",
    margin: "0 0 12px",
  }}>{children}</p>
);

const Sub = ({ children }) => (
  <h3 style={{
    fontSize: 15, fontWeight: 700, color: G.primary,
    fontFamily: "Helvetica Neue, Helvetica, Arial, sans-serif",
    margin: "18px 0 10px",
  }}>{children}</h3>
);

const BulletList = ({ items }) => (
  <ul style={{ listStyle: "none", display: "flex", flexDirection: "column", gap: 10, margin: "10px 0", padding: 0 }}>
    {items.map((item, i) => (
      <li key={i} style={{ display: "flex", alignItems: "flex-start", gap: 10,
        fontSize: 15, color: G.muted, lineHeight: 1.6,
        fontFamily: "Helvetica Neue, Helvetica, Arial, sans-serif" }}>
        <Check /><span>{item}</span>
      </li>
    ))}
  </ul>
);

const InfoBadge = ({ children, type = "info" }) => {
  const bg   = type === "warning" ? "#fffbea" : type === "danger" ? "#fff1f0" : "#e6f7ee";
  const left = type === "warning" ? "#e6a817" : type === "danger" ? "#e03c3c" : G.primary;
  const col  = type === "warning" ? "#7a5500" : type === "danger" ? "#7a1a1a" : "#155534";
  return (
    <div style={{
      background: bg, borderLeft: `4px solid ${left}`,
      borderRadius: "0 10px 10px 0",
      padding: "13px 18px", fontSize: 14.5, color: col,
      lineHeight: 1.65, margin: "14px 0",
      fontFamily: "Helvetica Neue, Helvetica, Arial, sans-serif",
    }}>
      {children}
    </div>
  );
};

const OverviewCard = ({ card }) => (
  <div style={{
    background: G.white, border: `1px solid ${G.border}`,
    borderRadius: 12, padding: "24px 22px",
    boxShadow: "0 2px 10px rgba(26,138,74,0.07)",
    display: "flex", flexDirection: "column",
  }}>
    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
      <Diamond />
      <span style={{ fontSize: 15.5, fontWeight: 700, color: G.primary,
        fontFamily: "Helvetica Neue, Helvetica, Arial, sans-serif" }}>{card.title}</span>
    </div>
    {card.type === "text" ? (
      <p style={{ fontSize: 13.5, color: G.muted, lineHeight: 1.75, margin: 0,
        fontFamily: "Helvetica Neue, Helvetica, Arial, sans-serif" }}>{card.body}</p>
    ) : (
      <ul style={{ listStyle: "none", display: "flex", flexDirection: "column", gap: 9, margin: 0, padding: 0 }}>
        {card.items.map((item, i) => (
          <li key={i} style={{ display: "flex", alignItems: "flex-start", gap: 8,
            fontSize: 13.5, color: G.muted, lineHeight: 1.65,
            fontFamily: "Helvetica Neue, Helvetica, Arial, sans-serif" }}>
            <Check /><span>{item}</span>
          </li>
        ))}
      </ul>
    )}
  </div>
);

/* ════════════════════════════════════════
   MAIN PAGE
═══════════════════════════════════════ */
export default function TermsConditions() {
  const [active, setActive] = useState("acceptance");
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

  const goto = (id) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <>
      <Header />
      <div style={{ background: "#f4fbf7", minHeight: "100vh",
        fontFamily: "Helvetica Neue, Helvetica, Arial, sans-serif" }}>

      {/* ── HERO ── */}
      <header style={{
        background: `linear-gradient(135deg, #0a4a26 0%, ${G.dark} 40%, ${G.primary} 100%)`,
        padding: "60px 0 50px",
        position: "relative", overflow: "hidden", textAlign: "center",
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
            <span style={{ color: "#fff", fontSize: 14, fontWeight: 600 }}>Terms &amp; Conditions</span>
          </div>
          <h1 style={{ color: "#fff", fontSize: 46, fontWeight: 800,
            letterSpacing: -1.5, margin: "0 0 12px" }}>
            Terms &amp; Conditions
          </h1>
          <p style={{ color: "rgba(255,255,255,0.72)", fontSize: 15, margin: 0 }}>
            Last Updated: May 2026 &nbsp;·&nbsp; Please read these terms carefully before using Uptula.
          </p>
        </div>
      </header>

      {/* ── OVERVIEW GRID ── */}
      <section style={{ background: G.white, borderBottom: `1px solid ${G.border}`,
        padding: "44px 0 40px" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto", padding: "0 28px" }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 20 }}>
            {OVERVIEW.map((card, i) => <OverviewCard key={i} card={card} />)}
          </div>
        </div>
      </section>

      {/* ── BODY ── */}
      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "40px 28px",
        display: "flex", gap: 32, alignItems: "flex-start" }}>

        {/* ── SIDEBAR ── */}
        <aside style={{ width: 218, flexShrink: 0 }}>
          <div style={{ position: "sticky", top: 80 }}>
            <div style={{ background: G.white, border: `1px solid ${G.border}`,
              borderRadius: 14, overflow: "hidden",
              boxShadow: "0 2px 12px rgba(26,138,74,0.07)" }}>
              <div style={{ padding: "14px 18px", borderBottom: `1px solid ${G.light}`,
                background: G.lighter }}>
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
                      display: "flex", alignItems: "center",
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

            {/* help card */}
            <div style={{ marginTop: 16, background: G.primary,
              borderRadius: 14, padding: "20px 18px",
              boxShadow: "0 4px 14px rgba(26,138,74,0.25)" }}>
              <p style={{ color: "#fff", fontWeight: 700, fontSize: 15, margin: "0 0 6px" }}>
                Have a question?
              </p>
              <p style={{ color: "rgba(255,255,255,0.75)", fontSize: 13,
                lineHeight: 1.55, margin: "0 0 14px" }}>
                Contact our support team for any clarification.
              </p>
              <a href="mailto:support@uptula.com" style={{
                display: "inline-block", background: "#fff", color: G.primary,
                textDecoration: "none", padding: "8px 18px",
                borderRadius: 24, fontSize: 13, fontWeight: 700,
              }}>Contact Support</a>
            </div>
          </div>
        </aside>

        {/* ── SECTION CARDS ── */}
        <main style={{ flex: 1, minWidth: 0 }}>

          {/* 1. Acceptance */}
          <SectionCard id="acceptance" title="Acceptance of Terms" icon="scroll">
            <Para>
              Welcome to <strong style={{ color: G.primary }}>Uptula</strong>. By accessing or using
              our website, mobile application, or any related services, you confirm that you have read,
              understood, and agree to be bound by these Terms &amp; Conditions and our Privacy Policy.
            </Para>
            <Para>
              If you do not agree with any part of these terms, you must not use our platform.
              Your continued use of Uptula constitutes acceptance of these terms and any future modifications.
            </Para>
            <InfoBadge type="info">
              <strong>Important:</strong> These Terms constitute a legally binding agreement between you
              and Uptula. Please read them carefully.
            </InfoBadge>
          </SectionCard>

          {/* 2. About */}
          <SectionCard id="about" title="About Uptula" icon="briefcase">
            <Para>
              Uptula is an online job portal platform that facilitates connections between job seekers,
              employers, and recruiters. Our services include:
            </Para>
            <BulletList items={[
              "Job listing creation and management for employers",
              "Job search, application, and profile management for candidates",
              "Recruitment tools, dashboards, and candidate matching",
              "Resume submission, employer communication, and interview scheduling",
              "Career resources, notifications, and job alerts",
            ]}/>
            <Para>
              Uptula acts as an intermediary platform and does not directly employ candidates or
              guarantee employment outcomes.
            </Para>
          </SectionCard>

          {/* 3. Eligibility */}
          <SectionCard id="eligibility" title="Eligibility" icon="person">
            <Para>To use Uptula's services, you must:</Para>
            <BulletList items={[
              "Be at least 18 years of age or the minimum legal working age in your jurisdiction",
              "Be legally eligible to work, hire, or recruit in your country or region",
              "Not be prohibited from using our services under applicable law",
              "Provide accurate, truthful, and complete registration information",
            ]}/>
            <InfoBadge type="warning">
              <strong>Note:</strong> Uptula reserves the right to verify eligibility and may suspend
              or terminate accounts that do not meet these requirements.
            </InfoBadge>
          </SectionCard>

          {/* 4. Accounts */}
          <SectionCard id="accounts" title="User Accounts" icon="lock">
            <Para>
              To access most features of Uptula, you must create an account. When registering, you agree to:
            </Para>
            <BulletList items={[
              "Provide accurate, complete, and current information",
              "Keep your login credentials confidential and secure",
              "Not share your account with any third party",
              "Notify us immediately of any unauthorized use of your account",
              "Be responsible for all activities conducted under your account",
            ]}/>
            <Sub>Account Types</Sub>
            <Para>Uptula offers two primary account types:</Para>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, margin: "12px 0" }}>
              {[
                { label: "Job Seeker", desc: "Create profiles, upload resumes, search and apply for jobs, set alerts." },
                { label: "Employer / Recruiter", desc: "Post jobs, search candidates, manage applications and hiring workflows." },
              ].map(({ label, desc }) => (
                <div key={label} style={{
                  background: G.lighter, border: `1px solid ${G.border}`,
                  borderRadius: 10, padding: "16px 18px",
                }}>
                  <p style={{ fontSize: 14, fontWeight: 700, color: G.primary, margin: "0 0 6px" }}>{label}</p>
                  <p style={{ fontSize: 13.5, color: G.muted, lineHeight: 1.6, margin: 0 }}>{desc}</p>
                </div>
              ))}
            </div>
          </SectionCard>

          {/* 5. Job Seeker */}
          <SectionCard id="jobseeker" title="Job Seeker Terms" icon="person">
            <Para>As a job seeker using Uptula, you agree to:</Para>
            <BulletList items={[
              "Submit only genuine, accurate, and truthful profile and resume information",
              "Not misrepresent your qualifications, experience, or skills",
              "Apply only for positions you are genuinely interested in",
              "Not use automated tools or bots to mass-apply for jobs",
              "Respond professionally to employer communications",
              "Not submit false or fabricated references or documents",
            ]}/>
            <InfoBadge type="info">
              Uptula does not guarantee job placement or interview opportunities. Results depend
              on employer decisions outside our control.
            </InfoBadge>
          </SectionCard>

          {/* 6. Employer */}
          <SectionCard id="employer" title="Employer & Recruiter Terms" icon="users">
            <Para>As an employer or recruiter using Uptula, you agree to:</Para>
            <BulletList items={[
              "Post only genuine, lawful, and accurate job listings",
              "Not post fraudulent, misleading, or illegal job offers",
              "Comply with all applicable employment laws and anti-discrimination regulations",
              "Use candidate data solely for legitimate recruitment purposes",
              "Not share candidate information with unauthorized third parties",
              "Promptly update or remove listings that are no longer available",
              "Not use the platform to collect data for purposes other than hiring",
            ]}/>
            <InfoBadge type="warning">
              <strong>Compliance:</strong> Employers must adhere to all equal opportunity employment
              laws. Discriminatory job postings are strictly prohibited and will be removed.
            </InfoBadge>
          </SectionCard>

          {/* 7. Prohibited Conduct */}
          <SectionCard id="conduct" title="Prohibited Conduct" icon="ban">
            <Para>
              The following activities are strictly prohibited on Uptula. Violations may result in
              immediate account suspension or termination:
            </Para>
            <Sub>Fraudulent or Harmful Activities</Sub>
            <BulletList items={[
              "Posting fake or misleading job listings or profiles",
              "Impersonating another person, company, or entity",
              "Engaging in phishing, scamming, or other fraudulent behavior",
              "Collecting user data without consent or for unauthorized purposes",
            ]}/>
            <Sub>Platform Misuse</Sub>
            <BulletList items={[
              "Using bots, scrapers, or automated tools to access platform data",
              "Sending unsolicited spam, bulk messages, or promotional content",
              "Attempting to hack, exploit, or compromise platform security",
              "Interfering with other users' access to the platform",
              "Bypassing or circumventing any platform restrictions or access controls",
            ]}/>
            <Sub>Content Violations</Sub>
            <BulletList items={[
              "Posting offensive, abusive, defamatory, or discriminatory content",
              "Sharing content that violates intellectual property rights",
              "Publishing private or confidential information of third parties",
            ]}/>
          </SectionCard>

          {/* 8. User Content */}
          <SectionCard id="content" title="User Content" icon="file">
            <Para>
              You retain ownership of content you submit to Uptula, including resumes, job listings,
              and profile information. However, by submitting content you grant Uptula a non-exclusive,
              worldwide, royalty-free license to use, display, and distribute your content as necessary
              to operate the platform.
            </Para>
            <Para>You are solely responsible for ensuring that your content:</Para>
            <BulletList items={[
              "Is accurate, truthful, and not misleading",
              "Does not infringe on any third-party intellectual property rights",
              "Does not contain malware, viruses, or harmful code",
              "Complies with all applicable laws and regulations",
              "Does not violate any person's privacy or confidentiality rights",
            ]}/>
            <Para>
              Uptula reserves the right to remove any content that violates these Terms or is deemed
              inappropriate at our sole discretion.
            </Para>
          </SectionCard>

          {/* 9. IP */}
          <SectionCard id="ip" title="Intellectual Property" icon="shield">
            <Para>
              All content, features, trademarks, logos, and technology on Uptula — including but not
              limited to the platform design, software, text, graphics, and data — are owned by or
              licensed to Uptula and are protected by applicable intellectual property laws.
            </Para>
            <Para>You may not:</Para>
            <BulletList items={[
              "Copy, reproduce, distribute, or republish any platform content without written permission",
              "Modify, create derivative works from, or reverse-engineer any part of the platform",
              "Use Uptula's trademarks, logos, or branding for commercial purposes",
              "Frame or mirror any part of the platform on another website",
            ]}/>
            <InfoBadge type="warning">
              Unauthorized use of Uptula's intellectual property may result in legal action.
            </InfoBadge>
          </SectionCard>

          {/* 10. Payments */}
          <SectionCard id="payments" title="Payments & Subscriptions" icon="card">
            <Para>
              Certain features and services on Uptula may require payment or a subscription plan.
              By purchasing a plan or service, you agree to the following:
            </Para>
            <BulletList items={[
              "All fees are displayed in the applicable currency and are inclusive of applicable taxes unless stated otherwise",
              "Subscription plans auto-renew unless cancelled before the renewal date",
              "Fees paid are non-refundable unless explicitly stated in our Refund Policy",
              "We reserve the right to modify pricing with reasonable advance notice",
              "Failure to pay may result in suspension or downgrade of your account",
            ]}/>
            <Sub>Free Features</Sub>
            <Para>
              Basic access to job search and profile creation is free. Premium features such as
              featured listings, advanced analytics, and priority support are available under
              paid plans.
            </Para>
          </SectionCard>

          {/* 11. Privacy */}
          <SectionCard id="privacy" title="Privacy & Data" icon="database">
            <Para>
              Your use of Uptula is also governed by our{" "}
              <a href="#" style={{ color: G.primary, fontWeight: 600, textDecoration: "none" }}>
                Privacy Policy
              </a>
              , which is incorporated into these Terms by reference. By using our platform, you
              consent to the collection, use, and sharing of your information as described in
              the Privacy Policy.
            </Para>
            <Para>
              You have the right to access, correct, and delete your personal data. Please contact
              our support team to exercise these rights.
            </Para>
          </SectionCard>

          {/* 12. Disclaimer */}
          <SectionCard id="disclaimer" title="Disclaimers" icon="alert">
            <InfoBadge type="warning">
              <strong>Platform provided "as-is":</strong> Uptula makes no warranties, express or
              implied, regarding the accuracy, reliability, or availability of the platform.
            </InfoBadge>
            <Para>Specifically, Uptula does not guarantee:</Para>
            <BulletList items={[
              "Uninterrupted, error-free, or secure access to the platform",
              "The accuracy or completeness of job listings or candidate profiles",
              "Employment outcomes, job placement, or hiring success",
              "The conduct, representations, or actions of employers or job seekers",
              "The safety or accuracy of third-party links or external content",
            ]}/>
          </SectionCard>

          {/* 13. Liability */}
          <SectionCard id="liability" title="Limitation of Liability" icon="slash">
            <Para>
              To the maximum extent permitted by applicable law, Uptula and its directors, employees,
              partners, and affiliates shall not be liable for:
            </Para>
            <BulletList items={[
              "Indirect, incidental, special, consequential, or punitive damages",
              "Loss of profits, data, business opportunities, or goodwill",
              "Damages resulting from unauthorized access to your account",
              "Actions or omissions of employers, recruiters, or third-party services",
              "Service interruptions, errors, or technical failures",
            ]}/>
            <Para>
              Our total liability to you for any claim arising from these Terms shall not exceed
              the amount you paid to Uptula in the three months preceding the claim.
            </Para>
          </SectionCard>

          {/* 14. Indemnification */}
          <SectionCard id="indemnification" title="Indemnification" icon="shield">
            <Para>
              You agree to indemnify, defend, and hold harmless Uptula, its officers, directors,
              employees, and agents from and against any claims, liabilities, damages, losses, and
              expenses — including reasonable legal fees — arising out of or related to:
            </Para>
            <BulletList items={[
              "Your use of or access to the platform",
              "Your violation of these Terms & Conditions",
              "Your violation of any applicable laws or third-party rights",
              "Content you submit, post, or transmit through the platform",
              "Any dispute between you and another user or employer",
            ]}/>
          </SectionCard>

          {/* 15. Termination */}
          <SectionCard id="termination" title="Termination" icon="ban">
            <Para>
              Uptula reserves the right to suspend or terminate your account and access to the
              platform at any time, without notice, for:
            </Para>
            <BulletList items={[
              "Violation of these Terms & Conditions",
              "Fraudulent, abusive, or illegal activity",
              "Extended inactivity of your account",
              "Requests by law enforcement or regulatory authorities",
              "Discontinuation of our services",
            ]}/>
            <Para>
              You may also delete your account at any time through your account settings or by
              contacting our support team. Upon termination, your right to use the platform
              ceases immediately.
            </Para>
            <InfoBadge type="info">
              Certain provisions of these Terms — including intellectual property, liability,
              indemnification, and governing law — survive termination of your account.
            </InfoBadge>
          </SectionCard>

          {/* 16. Governing Law */}
          <SectionCard id="governing" title="Governing Law" icon="globe">
            <Para>
              These Terms &amp; Conditions shall be governed by and construed in accordance with
              the laws of the jurisdiction in which Uptula is incorporated, without regard to
              conflict of law principles.
            </Para>
            <Para>
              Any disputes arising from these Terms shall be resolved through binding arbitration
              or in the courts of competent jurisdiction, as applicable. You agree to submit to
              the personal jurisdiction of such courts.
            </Para>
          </SectionCard>

          {/* 17. Changes */}
          <SectionCard id="changes" title="Changes to These Terms" icon="refresh">
            <Para>
              Uptula may update or revise these Terms &amp; Conditions at any time to reflect
              changes in our services, legal obligations, or business practices.
            </Para>
            <Para>
              When we make material changes, we will notify you by posting the updated terms on
              this page with a revised effective date. We may also notify you via email or
              in-platform notification for significant changes.
            </Para>
            <InfoBadge type="warning">
              Your continued use of Uptula after any changes constitutes your acceptance of the
              revised Terms. If you do not agree, you must stop using the platform.
            </InfoBadge>
          </SectionCard>

          {/* 18. Contact */}
          <SectionCard id="contact" title="Contact Us" icon="mail">
            <Para>
              If you have any questions, concerns, or requests regarding these Terms &amp; Conditions,
              please reach out to us:
            </Para>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16, marginTop: 16 }}>
              {[
                { icon: "location", label: "Company",  value: "Uptula Official Website" },
                { icon: "mail",     label: "Email",    value: "support@uptula.com", href: "mailto:support@uptula.com" },
                { icon: "globe",    label: "Website",  value: "www.uptula.com",    href: "https://www.uptula.com" },
              ].map(({ icon, label, value, href }) => (
                <div key={label} style={{
                  background: G.lighter, border: `1px solid ${G.border}`,
                  borderRadius: 12, padding: "18px 16px",
                  display: "flex", flexDirection: "column", gap: 10,
                  alignItems: "center", textAlign: "center",
                }}>
                  <div style={{ width: 44, height: 44, borderRadius: "50%",
                    background: G.light, display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <Icon name={icon} size={20} color={G.primary}/>
                  </div>
                  <p style={{ fontSize: 12, color: G.muted, textTransform: "uppercase",
                    letterSpacing: 0.8, margin: 0, fontWeight: 600 }}>{label}</p>
                  {href
                    ? <a href={href} style={{ fontSize: 14, color: G.primary, fontWeight: 700, textDecoration: "none" }}>{value}</a>
                    : <p style={{ fontSize: 14, color: G.text, fontWeight: 600, margin: 0 }}>{value}</p>}
                </div>
              ))}
            </div>
          </SectionCard>

          {/* CTA BANNER */}
          <div style={{
            background: `linear-gradient(135deg, ${G.dark}, ${G.primary})`,
            borderRadius: 16, padding: "30px 34px",
            display: "flex", alignItems: "center", justifyContent: "space-between",
            gap: 24, boxShadow: "0 6px 24px rgba(26,138,74,0.22)", marginTop: 8,
          }}>
            <div>
              <h3 style={{ color: "#fff", fontSize: 20, fontWeight: 700, margin: "0 0 6px" }}>
                Questions about these Terms?
              </h3>
              <p style={{ color: "rgba(255,255,255,0.78)", fontSize: 14, margin: 0 }}>
                Our support team is here to help you with any queries or clarifications.
              </p>
            </div>
            <a href="mailto:support@uptula.com" style={{
              background: "#fff", color: G.primary, textDecoration: "none",
              padding: "12px 28px", borderRadius: 30,
              fontWeight: 800, fontSize: 14, whiteSpace: "nowrap", flexShrink: 0,
            }}>CONTACT SUPPORT</a>
          </div>
        </main>
      </div>

      <style>{`
        * { box-sizing: border-box; }
        a:hover { opacity: 0.85; }
        button:hover { background: ${G.light} !important; }
        @media (max-width: 900px) { aside { display: none !important; } }
      `}</style>
    </div>
      <Footer />
    </>
  );
}
