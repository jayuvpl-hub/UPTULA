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

/* ─── nav sections for sidebar ─── */
const NAV = [
  { id: "introduction",   label: "Introduction" },
  { id: "about",          label: "About Uptula" },
  { id: "collect",        label: "Information We Collect" },
  { id: "usage",          label: "How We Use Your Information" },
  { id: "visibility",     label: "Profile Visibility" },
  { id: "cookies",        label: "Cookies & Tracking" },
  { id: "sharing",        label: "Sharing of Information" },
  { id: "security",       label: "Data Security" },
  { id: "rights",         label: "User Rights & Choices" },
  { id: "retention",      label: "Data Retention" },
  { id: "thirdparty",     label: "Third-Party Links" },
  { id: "children",       label: "Children's Privacy" },
  { id: "international",  label: "International Data Transfers" },
  { id: "changes",        label: "Changes to This Policy" },
  { id: "refund",         label: "Refund Policy" },
  { id: "contact",        label: "Contact Us" },
];

/* ─── summary overview cards (top 3-col grid) ─── */
const OVERVIEW = [
  {
    icon: "person",
    title: "Introduction",
    body: "We value your privacy and are committed to safeguarding your personal information. This policy outlines how we collect, use, and protect your data.",
    type: "text",
  },
  {
    icon: "database",
    title: "Information We Collect",
    type: "bullets",
    items: [
      "Personal details such as name, email, phone number, and resume.",
      "Employment preferences and job applications.",
      "Usage data such as login history and browsing activity.",
    ],
  },
  {
    icon: "briefcase",
    title: "How We Use Your Information",
    type: "bullets",
    items: [
      "Match you with relevant job opportunities.",
      "Send updates, notifications, and career-related offers.",
      "Improve our services and user experience.",
    ],
  },
  {
    icon: "shield",
    title: "Data Protection",
    type: "text",
    body: "We implement strict security measures, including encryption and secure servers, to protect your data from unauthorized access.",
  },
  {
    icon: "share",
    title: "Sharing of Information",
    type: "text",
    body: "Your information is shared only with employers and recruiters for job-related purposes. We never sell your personal data to third parties.",
  },
  {
    icon: "refresh",
    title: "Changes to This Policy",
    type: "text",
    body: "We may update this Privacy Policy periodically. Any changes will be posted here with the updated date.",
  },
];

/* ─── icons as inline SVG ─── */
const Icon = ({ name, size = 20, color = G.primary }) => {
  const icons = {
    person: <><circle cx="10" cy="6" r="3.5"/><path d="M2 19c0-4.4 3.6-8 8-8s8 3.6 8 8" strokeLinecap="round"/></>,
    database: <><ellipse cx="10" cy="5" rx="7" ry="2.5"/><path d="M3 5v4c0 1.4 3.1 2.5 7 2.5s7-1.1 7-2.5V5"/><path d="M3 9v4c0 1.4 3.1 2.5 7 2.5s7-1.1 7-2.5V9"/><path d="M3 13v4c0 1.4 3.1 2.5 7 2.5s7-1.1 7-2.5v-4"/></>,
    briefcase: <><rect x="2" y="7" width="16" height="11" rx="2"/><path d="M6 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><line x1="10" y1="12" x2="10" y2="12.01"/></>,
    shield: <><path d="M10 2L3 5v5c0 4.4 3 8.5 7 10 4-1.5 7-5.6 7-10V5l-7-3z"/></>,
    share: <><circle cx="14" cy="4" r="2"/><circle cx="4" cy="10" r="2"/><circle cx="14" cy="16" r="2"/><line x1="12.1" y1="4.9" x2="5.9" y2="9.1"/><line x1="5.9" y1="10.9" x2="12.1" y2="15.1"/></>,
    refresh: <><polyline points="1 4 1 10 7 10"/><path d="M3.51 15A9 9 0 1 0 4.5 4.5L1 10"/></>,
    check: <><polyline points="20 6 9 17 4 12"/></>,
    diamond: <><path d="M10 2L18 10L10 18L2 10Z"/></>,
    mail: <><rect x="2" y="4" width="16" height="12" rx="2"/><polyline points="2 4 10 13 18 4"/></>,
    globe: <><circle cx="10" cy="10" r="8"/><path d="M2 10h16M10 2a14 14 0 0 1 0 16M10 2a14 14 0 0 0 0 16"/></>,
    location: <><path d="M10 2a6 6 0 0 0-6 6c0 5 6 12 6 12s6-7 6-12a6 6 0 0 0-6-6z"/><circle cx="10" cy="8" r="2"/></>,
  };
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" fill="none"
      stroke={color} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      {icons[name]}
    </svg>
  );
};

/* ─── diamond bullet exactly like reference ─── */
const Diamond = () => (
  <svg width="10" height="10" viewBox="0 0 10 10" fill={G.primary} style={{ flexShrink: 0, marginTop: 1 }}>
    <path d="M5 0L10 5L5 10L0 5Z"/>
  </svg>
);

/* ─── checkmark for bullet lists ─── */
const Check = () => (
  <svg width="14" height="14" viewBox="0 0 16 16" fill="none"
    stroke={G.primary} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
    style={{ flexShrink: 0, marginTop: 2 }}>
    <polyline points="14 4 6 12 2 8"/>
  </svg>
);

/* ─── section card wrapper (each policy section becomes a white card) ─── */
const SectionCard = ({ id, title, children, icon }) => (
  <div id={id} style={{
    background: G.white,
    border: `1px solid ${G.border}`,
    borderRadius: 14,
    overflow: "hidden",
    marginBottom: 20,
    boxShadow: "0 2px 12px rgba(26,138,74,0.06)",
  }}>
    {/* card header */}
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
    {/* card body */}
    <div style={{ padding: "22px 28px" }}>{children}</div>
  </div>
);

const Para = ({ children }) => (
  <p style={{
    fontSize: 15, color: G.muted, lineHeight: 1.8,
    fontFamily: "Helvetica Neue, Helvetica, Arial, sans-serif",
    marginBottom: 12, margin: "0 0 12px",
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
  <ul style={{ listStyle: "none", display: "flex", flexDirection: "column", gap: 10, margin: "10px 0" }}>
    {items.map((item, i) => (
      <li key={i} style={{ display: "flex", alignItems: "flex-start", gap: 10,
        fontSize: 15, color: G.muted, lineHeight: 1.6,
        fontFamily: "Helvetica Neue, Helvetica, Arial, sans-serif" }}>
        <Check /><span>{item}</span>
      </li>
    ))}
  </ul>
);

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

/* ─── 3-col overview card grid (top) ─── */
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
export default function PrivacyPolicy() {
  const [active, setActive] = useState("introduction");
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
        position: "relative", overflow: "hidden",
        textAlign: "center",
      }}>
        {/* subtle dots pattern */}
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
            <span style={{ color: "#fff", fontSize: 14, fontWeight: 600 }}>Privacy Policy</span>
          </div>
          <h1 style={{ color: "#fff", fontSize: 46, fontWeight: 800,
            letterSpacing: -1.5, margin: "0 0 12px",
            fontFamily: "Helvetica Neue, Helvetica, Arial, sans-serif" }}>
            Privacy Policy
          </h1>
          <p style={{ color: "rgba(255,255,255,0.72)", fontSize: 15, margin: 0 }}>
            Last Updated: May 2026
          </p>
        </div>
      </header>

      {/* ── OVERVIEW CARD GRID ── */}
      <section style={{ background: G.white, borderBottom: `1px solid ${G.border}`,
        padding: "44px 0 40px" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto", padding: "0 28px" }}>
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(3, 1fr)",
            gap: 20,
          }}>
            {OVERVIEW.map((card, i) => <OverviewCard key={i} card={card} />)}
          </div>
        </div>
      </section>

      {/* ── MAIN BODY: sidebar + sections ── */}
      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "40px 28px",
        display: "flex", gap: 32, alignItems: "flex-start" }}>

        {/* ── SIDEBAR ── */}
        <aside style={{ width: 218, flexShrink: 0 }}>
          <div style={{ position: "sticky", top: 80 }}>
            {/* sidebar card */}
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

            {/* need help mini card */}
            <div style={{ marginTop: 16, background: G.primary,
              borderRadius: 14, padding: "20px 18px",
              boxShadow: "0 4px 14px rgba(26,138,74,0.25)" }}>
              <p style={{ color: "#fff", fontWeight: 700, fontSize: 15, margin: "0 0 6px" }}>
                Questions about your privacy?
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

        {/* ── SECTION CARDS ── */}
        <main style={{ flex: 1, minWidth: 0 }}>

          <SectionCard id="introduction" title="Introduction" icon="person">
            <Para>
              Welcome to <strong style={{ color: G.primary }}>Uptula</strong>. At Uptula, we value
              your trust and are committed to protecting your personal information and privacy.
              This Privacy Policy explains how we collect, use, store, share, and protect your
              information when you use our website, mobile applications, and services related to
              job searching, recruitment, and hiring.
            </Para>
            <Para>By accessing or using our platform, you agree to the terms of this Privacy Policy.</Para>
          </SectionCard>

          <SectionCard id="about" title="About Uptula" icon="briefcase">
            <Para>
              Uptula is a job portal platform that connects job seekers with employers, recruiters,
              and companies. Our services include job listings, candidate profiles, recruitment tools,
              resume submissions, employer dashboards, communication services, and related career solutions.
            </Para>
          </SectionCard>

          <SectionCard id="collect" title="Information We Collect" icon="database">
            <Para>We collect information to provide better recruitment and hiring services for both job seekers and employers.</Para>
            <Sub>A. Information You Provide</Sub>
            <Para>When you register or use our platform, we may collect:</Para>
            <BulletList items={[
              "Full name","Email address","Mobile number",
              "Resume / CV details","Employment history","Educational qualifications",
              "Skills and certifications","Profile photograph","Location details",
              "Company information (for recruiters / employers)","Payment or billing details (if applicable)",
            ]}/>
            <Sub>B. Automatically Collected Information</Sub>
            <Para>When you access our platform, we may automatically collect:</Para>
            <BulletList items={[
              "IP address","Device information","Browser type","Operating system",
              "Login activity","Pages visited","Search history on the platform",
              "Cookies and tracking information",
            ]}/>
            <Sub>C. Information from Third Parties</Sub>
            <BulletList items={[
              "Recruitment partners","Social media integrations",
              "Background verification partners","Marketing and analytics tools",
            ]}/>
          </SectionCard>

          <SectionCard id="usage" title="How We Use Your Information" icon="briefcase">
            <Para>We use your information to:</Para>
            <BulletList items={[
              "Create and manage user accounts",
              "Help job seekers apply for jobs",
              "Help recruiters find suitable candidates",
              "Improve search and recommendation systems",
              "Send job alerts and notifications",
              "Communicate regarding applications and interviews",
              "Improve platform security and performance",
              "Prevent fraud, abuse, or unauthorized activity",
              "Provide customer support",
              "Conduct analytics and research",
              "Comply with legal obligations",
            ]}/>
          </SectionCard>

          <SectionCard id="visibility" title="Profile Visibility & Recruitment Access" icon="person">
            <Para>
              When job seekers create profiles on Uptula, certain profile information may become
              visible to registered employers and recruiters for recruitment purposes.
            </Para>
            <Para>
              Users may control profile visibility settings through their account dashboard wherever applicable.
            </Para>
            <InfoBadge success>
              <strong>Note:</strong> Applying for jobs may allow employers to access your submitted
              profile and resume information.
            </InfoBadge>
          </SectionCard>

          <SectionCard id="cookies" title="Cookies & Tracking Technologies" icon="globe">
            <Para>
              Uptula uses cookies and similar technologies to improve user experience, remember
              preferences, analyze traffic, and provide personalized recommendations.
            </Para>
            <Sub>Cookies help us:</Sub>
            <BulletList items={[
              "Keep users logged in",
              "Understand user behavior",
              "Improve website performance",
              "Deliver relevant content and notifications",
            ]}/>
            <Para>
              Users may disable cookies through browser settings; however, some features may not function properly.
            </Para>
          </SectionCard>

          <SectionCard id="sharing" title="Sharing of Information" icon="share">
            <InfoBadge success>
              <strong>We do not sell your personal information.</strong>
            </InfoBadge>
            <Para>We may share information with:</Para>
            <BulletList items={[
              "Employers and recruiters",
              "Service providers and technology partners",
              "Verification and compliance partners",
              "Legal authorities when required by law",
              "Business partners during mergers, acquisitions, or restructuring",
            ]}/>
            <Para>All third-party partners are expected to maintain appropriate confidentiality and security standards.</Para>
          </SectionCard>

          <SectionCard id="security" title="Data Security" icon="shield">
            <Para>
              We implement reasonable technical, administrative, and organizational measures
              to protect your information against:
            </Para>
            <BulletList items={[
              "Unauthorized access","Data misuse","Alteration","Loss or destruction",
            ]}/>
            <Para>
              While we strive to use commercially acceptable security measures, no online
              platform can guarantee complete security.
            </Para>
          </SectionCard>

          <SectionCard id="rights" title="User Rights & Choices" icon="person">
            <Para>Users may:</Para>
            <BulletList items={[
              "Access their profile information",
              "Update or correct information",
              "Delete their account",
              "Unsubscribe from marketing emails",
              "Manage notification preferences",
            ]}/>
            <Para>You may request account deletion or data-related assistance by contacting our support team.</Para>
          </SectionCard>

          <SectionCard id="retention" title="Data Retention" icon="database">
            <Para>We retain user information only for as long as necessary to:</Para>
            <BulletList items={[
              "Provide services","Maintain business records",
              "Comply with legal obligations","Resolve disputes","Enforce agreements",
            ]}/>
            <Para>Inactive accounts and outdated information may be deleted periodically.</Para>
          </SectionCard>

          <SectionCard id="thirdparty" title="Third-Party Links" icon="globe">
            <Para>
              Our platform may contain links to third-party websites or services. Uptula is not
              responsible for the privacy practices, policies, or content of external websites.
            </Para>
            <Para>Users are encouraged to review the privacy policies of third-party platforms separately.</Para>
          </SectionCard>

          <SectionCard id="children" title="Children's Privacy" icon="shield">
            <Para>
              Uptula services are intended only for individuals who are legally eligible to work
              or recruit. We do not knowingly collect personal information from children under
              the age permitted by applicable law.
            </Para>
          </SectionCard>

          <SectionCard id="international" title="International Data Transfers" icon="globe">
            <Para>
              Your information may be stored or processed on servers located outside your state
              or country depending on our service providers and infrastructure partners.
            </Para>
            <Para>By using our platform, you consent to such transfers where permitted by law.</Para>
          </SectionCard>

          <SectionCard id="changes" title="Changes to This Policy" icon="refresh">
            <Para>
              We may update this Privacy Policy from time to time to reflect changes in our
              services, technology, legal requirements, or business practices.
            </Para>
            <Para>Updated versions will be posted on this page with the revised effective date.</Para>
          </SectionCard>

          {/* ── REFUND POLICY ── */}
          <SectionCard id="refund" title="Refund Policy" icon="briefcase">
            <Para>
              At Uptula, we strive to provide value through our premium features for both employers and job
              seekers. This Refund Policy outlines the terms under which refunds may be requested, the
              eligibility window, and how cancellations are handled.
            </Para>

            <Sub>Premium Features Covered</Sub>
            <Para style={{ marginTop: 0 }}>
              Uptula offers premium subscription plans that unlock the following features:
            </Para>
            <BulletList items={[
              "Featured job listings (Employers)",
              "ATS (Applicant Tracking System) checker (Employers)",
              "Unlimited resume downloads (Employers)",
              "Advanced job posting (Employers)",
              "Priority support (Employers)",
              "Advanced analytics (Employers)",
              "Unlimited resume creation (Job Seekers)",
              "Access to featured jobs (Job Seekers)",
            ]} />

            <Sub>Free Trial / Credits</Sub>
            <Para>
              [Need this from you — do employers/job seekers get any free trial period or credits before being charged, or
              is it a straight paid subscription from day one? Let me know and I'll add this section.]
            </Para>

            <Sub>Refund Window</Sub>
            <Para>
              Refund requests are accepted only within 7 days of the purchase date, provided the premium
              features have not been used or activated. Once a subscription has been active for more than 7 days,
              or once premium features (such as job postings, resume downloads, or ATS checks) have been utilized,
              the purchase becomes non-refundable.
            </Para>

            <Sub>Non-Refundable Cases</Sub>
            <Para style={{ marginTop: 0 }}>
              Refunds will not be issued in the following situations:
            </Para>
            <BulletList items={[
              "The 7-day refund window has passed",
              "Premium features (featured job posts, resume downloads, ATS checks, analytics access) have already been used",
              "The subscription was purchased during a promotional or discounted offer (unless stated otherwise)",
              "Violation of Uptula's Terms & Conditions leading to account suspension",
            ]} />

            <Sub>Cancellation & Auto-Renewal</Sub>
            <Para>
              Premium subscriptions on Uptula are set to auto-renew at the end of each billing cycle unless cancelled
              beforehand. Users may cancel their subscription anytime from their account dashboard to stop future renewals.
              Cancelling a subscription:
            </Para>
            <BulletList items={[
              "Stops the next billing cycle",
              "Does not automatically qualify the user for a refund of the current billing period",
              "Allows continued access to premium features until the end of the current paid cycle",
            ]} />

            <Sub>Refund Process</Sub>
            <Para>
              Eligible refund requests will be processed within 5–7 business days to the original payment method used at the
              time of purchase. To request a refund, users must contact our support team with their order/transaction details
              within the eligible window.
            </Para>
          </SectionCard>

          <SectionCard id="contact" title="Contact Us" icon="mail">
            <Para>If you have questions, concerns, or requests related to this Privacy Policy:</Para>
            <div style={{
              display: "grid", gridTemplateColumns: "1fr 1fr 1fr",
              gap: 16, marginTop: 16,
            }}>
              {[
                { icon: "location", label: "Company", value: "Uptula Official Website" },
                { icon: "mail",    label: "Email",   value: "support@uptula.com", href: "mailto:support@uptula.com" },
                { icon: "globe",   label: "Website", value: "www.uptula.com", href: "https://www.uptula.com" },
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

          {/* ── CTA BANNER ── */}
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
                Questions about your privacy?
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
