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

const VALUES = [
  {
    emoji: "🚀",
    title: "Build with impact",
    body: "Ship products used by thousands of job seekers and recruiters across the country every single day.",
  },
  {
    emoji: "🌱",
    title: "Grow your career",
    body: "Mentorship, ownership and room to learn. We invest in people who want to do the best work of their lives.",
  },
  {
    emoji: "🤝",
    title: "People first",
    body: "Flexible work, supportive teammates and a culture where your voice genuinely matters.",
  },
  {
    emoji: "⚖️",
    title: "Honesty & trust",
    body: "We do right by our users. Transparency and fairness sit at the centre of everything we build.",
  },
];

const PERKS = [
  "Competitive salary & equity",
  "Flexible / hybrid work",
  "Health insurance for you & family",
  "Learning & development budget",
  "Generous paid time off",
  "Modern tools & hardware",
];

export default function Careers() {
  return (
    <>
      <Header />
      <div style={{ background: G.pageBg, minHeight: "100vh", fontFamily: FONT }}>
        {/* HEADER BAND */}
        <header
          style={{
            background: `linear-gradient(135deg, #0a4a26 0%, ${G.dark} 45%, ${G.primary} 100%)`,
            padding: "64px 0 56px",
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
            <h1
              style={{
                color: "#fff",
                fontSize: 44,
                fontWeight: 800,
                letterSpacing: -1.2,
                margin: "0 0 14px",
              }}
            >
              Work at Uptula
            </h1>
            <p
              style={{
                color: "rgba(255,255,255,0.78)",
                fontSize: 17,
                maxWidth: 640,
                margin: "0 auto",
                lineHeight: 1.7,
              }}
            >
              We're building the most trusted way to find a job and hire great
              people. Come help us get there.
            </p>
          </div>
        </header>

        {/* CONTENT */}
        <main style={{ maxWidth: 1080, margin: "0 auto", padding: "52px 24px 64px" }}>
          {/* Intro */}
          <section
            style={{
              background: G.card,
              border: `1px solid ${G.border}`,
              borderRadius: 16,
              boxShadow: G.shadow,
              padding: "32px 34px",
              marginBottom: 36,
            }}
          >
            <h2 style={{ color: G.heading, fontSize: 24, fontWeight: 800, margin: "0 0 14px" }}>
              Why Uptula?
            </h2>
            <p style={{ color: G.text, fontSize: 16, lineHeight: 1.8, margin: 0 }}>
              At Uptula we connect talented people with meaningful work. Our team is
              small, ambitious and genuinely cares about the candidates and employers
              we serve. If you enjoy solving real problems, moving fast and owning what
              you build, you'll feel right at home here.
            </p>
          </section>

          {/* Value props */}
          <h2
            style={{
              color: G.heading,
              fontSize: 22,
              fontWeight: 800,
              margin: "0 0 22px",
              textAlign: "center",
            }}
          >
            What we value
          </h2>
          <div
            className="careers-grid"
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(2, 1fr)",
              gap: 20,
              marginBottom: 44,
            }}
          >
            {VALUES.map((v) => (
              <div
                key={v.title}
                style={{
                  background: G.card,
                  border: `1px solid ${G.border}`,
                  borderRadius: 16,
                  boxShadow: G.shadow,
                  padding: "26px 26px",
                }}
              >
                <div style={{ fontSize: 30, marginBottom: 12 }}>{v.emoji}</div>
                <h3 style={{ color: G.heading, fontSize: 18, fontWeight: 700, margin: "0 0 8px" }}>
                  {v.title}
                </h3>
                <p style={{ color: G.text, fontSize: 15, lineHeight: 1.7, margin: 0 }}>{v.body}</p>
              </div>
            ))}
          </div>

          {/* Perks */}
          <section
            style={{
              background: G.card,
              border: `1px solid ${G.border}`,
              borderRadius: 16,
              boxShadow: G.shadow,
              padding: "30px 34px",
              marginBottom: 40,
            }}
          >
            <h2 style={{ color: G.heading, fontSize: 22, fontWeight: 800, margin: "0 0 18px" }}>
              Perks & benefits
            </h2>
            <div
              className="careers-perks"
              style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "12px 24px" }}
            >
              {PERKS.map((p) => (
                <div key={p} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <span
                    style={{
                      minWidth: 22,
                      height: 22,
                      borderRadius: "50%",
                      background: "#dcfce7",
                      color: G.primary,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: 13,
                      fontWeight: 800,
                    }}
                  >
                    ✓
                  </span>
                  <span style={{ color: G.text, fontSize: 15 }}>{p}</span>
                </div>
              ))}
            </div>
          </section>

          {/* CTA */}
          <div
            style={{
              background: `linear-gradient(135deg, ${G.dark}, ${G.primary})`,
              borderRadius: 18,
              padding: "36px 34px",
              textAlign: "center",
              boxShadow: "0 8px 28px rgba(22,163,74,0.22)",
            }}
          >
            <h3 style={{ color: "#fff", fontSize: 22, fontWeight: 800, margin: "0 0 10px" }}>
              Open roles
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
              All of our current openings are listed alongside thousands of other
              opportunities on our jobs page. Find your next role and apply in minutes.
            </p>
            <Link
              to="/jobs"
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
              Browse Jobs
            </Link>
          </div>
        </main>
      </div>

      <style>{`
        @media (max-width: 720px) {
          .careers-grid { grid-template-columns: 1fr !important; }
          .careers-perks { grid-template-columns: 1fr !important; }
        }
      `}</style>
      <Footer />
    </>
  );
}
