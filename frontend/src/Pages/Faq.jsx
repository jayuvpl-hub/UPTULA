import { useState } from "react";
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

const FAQS = [
  {
    q: "Is it free to create an account on Uptula?",
    a: "Yes. Registration, building your profile, uploading a resume and applying to jobs are completely free for job seekers.",
  },
  {
    q: "How do I apply for a job?",
    a: 'Create your profile, upload your resume, open any job listing that matches your skills and click the "Apply Now" button. You can track all your applications from your dashboard.',
  },
  {
    q: "How can I improve my chances of getting shortlisted?",
    a: "Keep your profile complete and up to date, add role-specific skills, use a clear professional resume and apply to relevant openings regularly. Recruiters favour active, complete profiles.",
  },
  {
    q: "I forgot my password. What should I do?",
    a: 'Click "Forgot Password" on the login screen and follow the instructions sent to your registered email or phone to reset it securely.',
  },
  {
    q: "How do employers post a job?",
    a: "Employers can register an employer account, go to the employer dashboard and use Add Jobs to create a listing. You can then manage applicants and shortlist candidates from one place.",
  },
  {
    q: "Can I hide my profile from certain recruiters?",
    a: "Yes. You control your profile visibility at any time from your account settings, so only the recruiters you want can find you.",
  },
  {
    q: "Does Uptula ever charge money for a job offer?",
    a: "Never. Uptula does not charge candidates for interviews or job offers. If anyone asks you for payment in our name, treat it as fraud and report it immediately.",
  },
  {
    q: "How do I report a fake recruiter or suspicious job?",
    a: "Use the Report Issue page or our Fraud Alert page to flag the listing. Avoid sharing financial details or making any payment, and our team will investigate promptly.",
  },
];

function FaqItem({ item, index, open, onToggle }) {
  return (
    <div
      style={{
        background: G.card,
        border: `1px solid ${open ? G.primary : G.border}`,
        borderRadius: 14,
        overflow: "hidden",
        marginBottom: 14,
        boxShadow: open ? "0 6px 20px rgba(22,163,74,0.10)" : G.shadow,
        transition: "border-color 0.2s, box-shadow 0.2s",
      }}
    >
      <button
        onClick={onToggle}
        aria-expanded={open}
        style={{
          width: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 14,
          padding: "20px 24px",
          background: "transparent",
          border: "none",
          cursor: "pointer",
          textAlign: "left",
          fontFamily: FONT,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <span
            style={{
              minWidth: 28,
              height: 28,
              borderRadius: "50%",
              background: open ? G.primary : "#e8f5ee",
              color: open ? "#fff" : G.primary,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 13,
              fontWeight: 800,
              flexShrink: 0,
            }}
          >
            {index + 1}
          </span>
          <span style={{ fontSize: 16, fontWeight: 700, color: open ? G.primary : G.heading }}>
            {item.q}
          </span>
        </div>
        <span
          style={{
            color: G.primary,
            fontSize: 20,
            fontWeight: 700,
            flexShrink: 0,
            transform: open ? "rotate(45deg)" : "none",
            transition: "transform 0.2s",
          }}
        >
          +
        </span>
      </button>
      <div
        style={{
          maxHeight: open ? 320 : 0,
          overflow: "hidden",
          transition: "max-height 0.3s ease",
        }}
      >
        <p style={{ padding: "0 24px 22px 66px", fontSize: 15, color: G.text, lineHeight: 1.8, margin: 0 }}>
          {item.a}
        </p>
      </div>
    </div>
  );
}

export default function Faq() {
  const [openIndex, setOpenIndex] = useState(0);

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
              Frequently Asked Questions
            </h1>
            <p style={{ color: "rgba(255,255,255,0.78)", fontSize: 16.5, margin: 0 }}>
              Answers to the most common questions from job seekers and employers.
            </p>
          </div>
        </header>

        {/* CONTENT */}
        <main style={{ maxWidth: 860, margin: "0 auto", padding: "48px 24px 64px" }}>
          {FAQS.map((item, i) => (
            <FaqItem
              key={i}
              item={item}
              index={i}
              open={openIndex === i}
              onToggle={() => setOpenIndex(openIndex === i ? -1 : i)}
            />
          ))}
        </main>
      </div>
      <Footer />
    </>
  );
}
