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

const STEPS = [
  {
    title: "Raise your complaint",
    body: "Email our Grievance Officer with a clear description of the issue, including any relevant screenshots, job IDs or communication.",
  },
  {
    title: "Acknowledgement",
    body: "You will receive an acknowledgement of your complaint within 48 hours along with a unique reference number.",
  },
  {
    title: "Investigation",
    body: "Our team reviews the matter, contacts the relevant parties where needed and works towards a fair resolution.",
  },
  {
    title: "Resolution",
    body: "We aim to resolve every grievance within 15 business days and will keep you updated throughout the process.",
  },
];

export default function Grievances() {
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
              Grievance Redressal
            </h1>
            <p style={{ color: "rgba(255,255,255,0.78)", fontSize: 16.5, margin: 0, maxWidth: 620, marginInline: "auto", lineHeight: 1.7 }}>
              We take every concern seriously. Here's how to raise a grievance and
              what you can expect from us.
            </p>
          </div>
        </header>

        {/* CONTENT */}
        <main style={{ maxWidth: 980, margin: "0 auto", padding: "50px 24px 64px" }}>
          {/* Officer card */}
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
            <h2 style={{ color: G.heading, fontSize: 22, fontWeight: 800, margin: "0 0 16px" }}>
              Grievance Officer
            </h2>
            <p style={{ color: G.text, fontSize: 15.5, lineHeight: 1.8, margin: "0 0 20px" }}>
              In accordance with applicable regulations, the contact details of our
              Grievance Officer are published below. You may reach out for any
              complaint regarding content, conduct or services on Uptula.
            </p>
            <div
              className="griev-contact"
              style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16 }}
            >
              {[
                { label: "Officer", value: "Mr. A. Sharma" },
                { label: "Email", value: "grievance@uptula.com", href: "mailto:grievance@uptula.com" },
                { label: "Response hours", value: "Mon–Sat, 9 AM – 6 PM" },
              ].map((c) => (
                <div
                  key={c.label}
                  style={{
                    background: G.pageBg,
                    border: `1px solid ${G.border}`,
                    borderRadius: 12,
                    padding: "16px 18px",
                    textAlign: "center",
                  }}
                >
                  <p
                    style={{
                      fontSize: 12,
                      color: G.text,
                      textTransform: "uppercase",
                      letterSpacing: 0.8,
                      fontWeight: 700,
                      margin: "0 0 8px",
                    }}
                  >
                    {c.label}
                  </p>
                  {c.href ? (
                    <a href={c.href} style={{ fontSize: 15, color: G.primary, fontWeight: 700, textDecoration: "none" }}>
                      {c.value}
                    </a>
                  ) : (
                    <p style={{ fontSize: 15, color: G.heading, fontWeight: 700, margin: 0 }}>{c.value}</p>
                  )}
                </div>
              ))}
            </div>
          </section>

          {/* How to raise */}
          <h2 style={{ color: G.heading, fontSize: 22, fontWeight: 800, margin: "0 0 22px", textAlign: "center" }}>
            How to raise a complaint
          </h2>
          <div style={{ display: "flex", flexDirection: "column", gap: 16, marginBottom: 40 }}>
            {STEPS.map((s, i) => (
              <div
                key={s.title}
                style={{
                  background: G.card,
                  border: `1px solid ${G.border}`,
                  borderRadius: 16,
                  boxShadow: G.shadow,
                  padding: "22px 26px",
                  display: "flex",
                  gap: 18,
                  alignItems: "flex-start",
                }}
              >
                <span
                  style={{
                    minWidth: 40,
                    height: 40,
                    borderRadius: 12,
                    background: "#e8f5ee",
                    color: G.primary,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 17,
                    fontWeight: 800,
                    flexShrink: 0,
                  }}
                >
                  {i + 1}
                </span>
                <div>
                  <h3 style={{ color: G.heading, fontSize: 17, fontWeight: 700, margin: "0 0 6px" }}>
                    {s.title}
                  </h3>
                  <p style={{ color: G.text, fontSize: 15, lineHeight: 1.7, margin: 0 }}>{s.body}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Timeline note */}
          <div
            style={{
              background: "#e8f5ee",
              border: `1px solid #b7e4c7`,
              borderLeft: `4px solid ${G.primary}`,
              borderRadius: "0 12px 12px 0",
              padding: "18px 22px",
              color: G.dark,
              fontSize: 15,
              lineHeight: 1.7,
            }}
          >
            <strong>Response timeline:</strong> Acknowledgement within 48 hours and
            full resolution targeted within 15 business days. Complex cases may take
            longer, in which case we will keep you informed at every stage.
          </div>
        </main>
      </div>

      <style>{`
        @media (max-width: 720px) {
          .griev-contact { grid-template-columns: 1fr !important; }
        }
      `}</style>
      <Footer />
    </>
  );
}
