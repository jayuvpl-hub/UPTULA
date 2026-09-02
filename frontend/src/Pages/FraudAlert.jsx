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

const SIGNS = [
  "You're asked to pay money for an interview, registration, training or a job offer.",
  "An offer arrives without any interview or proper screening.",
  "Communication comes only from a personal email or messaging app, not an official company address.",
  "You're pressured to act urgently or to share bank details, OTPs or passwords.",
  "The salary or perks sound far too good for the role or your experience.",
  "You're asked to deposit a cheque and forward part of the amount elsewhere.",
];

const DOS = [
  "Verify the company and recruiter through official channels.",
  "Keep all communication on the Uptula platform where possible.",
  "Report suspicious listings or messages to us immediately.",
];

const DONTS = [
  "Never pay money to get a job or an interview.",
  "Never share OTPs, passwords or full bank details.",
  "Don't act on urgent pressure to transfer funds.",
];

export default function FraudAlert() {
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
              Fraud Alert
            </h1>
            <p style={{ color: "rgba(255,255,255,0.78)", fontSize: 16.5, margin: 0, maxWidth: 640, marginInline: "auto", lineHeight: 1.7 }}>
              Stay safe in your job search. Learn how to spot fake offers and what to
              do if something feels wrong.
            </p>
          </div>
        </header>

        {/* CONTENT */}
        <main style={{ maxWidth: 980, margin: "0 auto", padding: "50px 24px 64px" }}>
          {/* Key warning */}
          <div
            style={{
              background: "#fef2f2",
              border: "1px solid #fecaca",
              borderLeft: "5px solid #dc2626",
              borderRadius: "0 14px 14px 0",
              padding: "22px 26px",
              marginBottom: 36,
            }}
          >
            <h2 style={{ color: "#b91c1c", fontSize: 20, fontWeight: 800, margin: "0 0 8px" }}>
              ⚠️ Uptula never asks for money
            </h2>
            <p style={{ color: "#7f1d1d", fontSize: 15.5, lineHeight: 1.8, margin: 0 }}>
              Uptula does not charge job seekers for registration, interviews, or job
              offers, and we never ask for your bank details, OTPs or passwords.
              Anyone demanding payment in our name is attempting fraud.
            </p>
          </div>

          {/* How to spot */}
          <section
            style={{
              background: G.card,
              border: `1px solid ${G.border}`,
              borderRadius: 16,
              boxShadow: G.shadow,
              padding: "30px 34px",
              marginBottom: 36,
            }}
          >
            <h2 style={{ color: G.heading, fontSize: 22, fontWeight: 800, margin: "0 0 18px" }}>
              How to spot a fake job offer
            </h2>
            <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "flex", flexDirection: "column", gap: 12 }}>
              {SIGNS.map((s) => (
                <li key={s} style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
                  <span style={{ color: "#dc2626", fontSize: 16, lineHeight: 1.6, flexShrink: 0 }}>✕</span>
                  <span style={{ color: G.text, fontSize: 15, lineHeight: 1.7 }}>{s}</span>
                </li>
              ))}
            </ul>
          </section>

          {/* Do / Don't */}
          <div
            className="fraud-grid"
            style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginBottom: 36 }}
          >
            <section
              style={{
                background: G.card,
                border: `1px solid ${G.border}`,
                borderRadius: 16,
                boxShadow: G.shadow,
                padding: "26px 28px",
              }}
            >
              <h3 style={{ color: G.primary, fontSize: 18, fontWeight: 800, margin: "0 0 16px" }}>Do</h3>
              <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "flex", flexDirection: "column", gap: 12 }}>
                {DOS.map((d) => (
                  <li key={d} style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                    <span style={{ color: G.primary, fontWeight: 800, flexShrink: 0 }}>✓</span>
                    <span style={{ color: G.text, fontSize: 14.5, lineHeight: 1.7 }}>{d}</span>
                  </li>
                ))}
              </ul>
            </section>
            <section
              style={{
                background: G.card,
                border: `1px solid ${G.border}`,
                borderRadius: 16,
                boxShadow: G.shadow,
                padding: "26px 28px",
              }}
            >
              <h3 style={{ color: "#dc2626", fontSize: 18, fontWeight: 800, margin: "0 0 16px" }}>Don't</h3>
              <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "flex", flexDirection: "column", gap: 12 }}>
                {DONTS.map((d) => (
                  <li key={d} style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                    <span style={{ color: "#dc2626", fontWeight: 800, flexShrink: 0 }}>✕</span>
                    <span style={{ color: G.text, fontSize: 14.5, lineHeight: 1.7 }}>{d}</span>
                  </li>
                ))}
              </ul>
            </section>
          </div>

          {/* Report CTA */}
          <div
            style={{
              background: `linear-gradient(135deg, ${G.dark}, ${G.primary})`,
              borderRadius: 18,
              padding: "34px 34px",
              textAlign: "center",
              boxShadow: "0 8px 28px rgba(22,163,74,0.22)",
            }}
          >
            <h3 style={{ color: "#fff", fontSize: 22, fontWeight: 800, margin: "0 0 10px" }}>
              Spotted something suspicious?
            </h3>
            <p
              style={{
                color: "rgba(255,255,255,0.82)",
                fontSize: 15.5,
                margin: "0 auto 22px",
                maxWidth: 560,
                lineHeight: 1.7,
              }}
            >
              Report fraudulent jobs or recruiters right away. You can also email us at{" "}
              <a href="mailto:report@uptula.com" style={{ color: "#fff", fontWeight: 700 }}>
                report@uptula.com
              </a>
              .
            </p>
            <Link
              to="/report-issue"
              style={{
                display: "inline-block",
                background: "#fff",
                color: G.primary,
                textDecoration: "none",
                padding: "13px 32px",
                borderRadius: 30,
                fontWeight: 800,
                fontSize: 15,
              }}
            >
              Report an Issue
            </Link>
          </div>
        </main>
      </div>

      <style>{`
        @media (max-width: 720px) {
          .fraud-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
      <Footer />
    </>
  );
}
