import { Link } from "react-router-dom";
import Header from "../Components/Header";
import Footer from "../Components/Footer";

/* ─── brand tokens ─── */
const G = {
  primary: "#16a34a",
  dark: "#0d5c30",
  heading: "#0f172a",
  text: "#475569",
  border: "rgba(148,163,184,0.18)",
  card: "#ffffff",
  pageBg: "#f7fbf8",
  shadow: "0 6px 20px rgba(15,23,42,0.06)",
};

const FONT = "Helvetica Neue, Helvetica, Arial, sans-serif";

const SECTIONS = [
  {
    title: "Explore",
    links: [
      { to: "/", label: "Home" },
      { to: "/jobs", label: "Browse Jobs" },
      { to: "/Companies", label: "Browse Companies" },
      { to: "/services", label: "Services" },
    ],
  },
  {
    title: "Job Categories",
    links: [
      { to: "/Work-From-Home-job", label: "Work From Home" },
      { to: "/Internship", label: "Internships" },
      { to: "/Freelancing-job", label: "Freelancing" },
      { to: "/Part-Time-job", label: "Part Time" },
      { to: "/Full-Time-job", label: "Full Time" },
    ],
  },
  {
    title: "Company",
    links: [
      { to: "/about-us", label: "About us" },
      { to: "/careers", label: "Careers" },
      { to: "/contact-us", label: "Contact us" },
    ],
  },
  {
    title: "Support",
    links: [
      { to: "/help-center", label: "Help center" },
      { to: "/faq", label: "FAQ" },
      { to: "/report-issue", label: "Report issue" },
      { to: "/grievances", label: "Grievances" },
    ],
  },
  {
    title: "Legal & Trust",
    links: [
      { to: "/privacy-policy", label: "Privacy Policy" },
      { to: "/terms-conditions", label: "Terms & Conditions" },
      { to: "/fraud-alert", label: "Fraud Alert" },
      { to: "/sitemap", label: "Sitemap" },
    ],
  },
  {
    title: "My Account",
    links: [
      { to: "/register", label: "Register" },
      { to: "/profile", label: "Candidate Profile" },
      { to: "/candidate/applied-jobs", label: "Applied Jobs" },
      { to: "/candidate/wishlist", label: "Wishlist" },
    ],
  },
];

export default function Sitemap() {
  return (
    <>
      <Header />
      <div style={{ background: G.pageBg, minHeight: "100vh", fontFamily: FONT }}>
        {/* HEADER BAND */}
        <header
          style={{
            background: `linear-gradient(135deg, #0a4a26 0%, ${G.dark} 45%, ${G.primary} 100%)`,
            padding: "62px 0 54px",
            textAlign: "center",
            position: "relative",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              position: "absolute",
              inset: 0,
              backgroundImage:
                "radial-gradient(circle, rgba(255,255,255,0.06) 1px, transparent 1px)",
              backgroundSize: "32px 32px",
            }}
          />
          <div style={{ position: "relative", zIndex: 1, padding: "0 24px" }}>
            <h1 style={{ color: "#fff", fontSize: 44, fontWeight: 800, letterSpacing: -1.2, margin: "0 0 12px" }}>
              Sitemap
            </h1>
            <p style={{ color: "rgba(255,255,255,0.78)", fontSize: 16.5, margin: 0 }}>
              A quick overview of everything you can find on Uptula.
            </p>
          </div>
        </header>

        {/* CONTENT */}
        <main style={{ maxWidth: 1080, margin: "0 auto", padding: "50px 24px 64px" }}>
          <div
            className="sitemap-grid"
            style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 22 }}
          >
            {SECTIONS.map((section) => (
              <section
                key={section.title}
                style={{
                  background: G.card,
                  border: `1px solid ${G.border}`,
                  borderRadius: 16,
                  boxShadow: G.shadow,
                  padding: "24px 26px",
                }}
              >
                <h2
                  style={{
                    color: G.heading,
                    fontSize: 17,
                    fontWeight: 800,
                    margin: "0 0 16px",
                    paddingBottom: 10,
                    borderBottom: `2px solid #e8f5ee`,
                  }}
                >
                  {section.title}
                </h2>
                <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "flex", flexDirection: "column", gap: 11 }}>
                  {section.links.map((l) => (
                    <li key={l.to + l.label}>
                      <Link
                        to={l.to}
                        style={{
                          color: G.text,
                          fontSize: 15,
                          textDecoration: "none",
                          display: "inline-flex",
                          alignItems: "center",
                          gap: 8,
                        }}
                        onMouseEnter={(e) => (e.currentTarget.style.color = G.primary)}
                        onMouseLeave={(e) => (e.currentTarget.style.color = G.text)}
                      >
                        <span style={{ color: G.primary, fontSize: 12 }}>›</span>
                        {l.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </section>
            ))}
          </div>
        </main>
      </div>

      <style>{`
        @media (max-width: 860px) {
          .sitemap-grid { grid-template-columns: repeat(2, 1fr) !important; }
        }
        @media (max-width: 560px) {
          .sitemap-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
      <Footer />
    </>
  );
}
