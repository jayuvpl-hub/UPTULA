import { useState, useRef } from "react";
import Header from "../Components/Header";
import Footer from "../Components/Footer";

const CATEGORIES = [
  "Job Application Issue",
  "Login / Account Problem",
  "Incorrect Information",
  "Technical Error",
  "Payment Issue",
  "Employer / Recruiter Concern",
  "Other",
];

const ISSUE_TYPES = [
  { tag: "Apply", desc: "Job application not submitting or status stuck" },
  { tag: "Login", desc: "Can't sign in, account locked or reset issues" },
  { tag: "Info", desc: "Wrong job details, salary or company information" },
  { tag: "Tech", desc: "Page errors, broken UI, or slow loading" },
  { tag: "Pay", desc: "Payment failed or billing concern" },
  { tag: "Other", desc: "Any other concern not listed above" },
];

const PRIORITIES = ["Low", "Medium", "High"];

const styles = `
  @import url('https://fonts.googleapis.com/css2?family=Nunito:wght@400;600;700;800;900&family=Mulish:wght@400;500;600&display=swap');

  * { box-sizing: border-box; margin: 0; padding: 0; }

  .uptula-root {
    font-family: 'Mulish', sans-serif;
    background: #f5f7fa;
    min-height: 100vh;
    color: #1a2b4a;
  }

  /* ── HERO ── */
  .hero {
    background: linear-gradient(135deg, #0f1f3d 0%, #1a3560 55%, #1e4d6b 100%);
    padding: 52px 40px 60px;
    text-align: center; position: relative; overflow: hidden;
  }
  .hero::before {
    content: '';
    position: absolute; inset: 0;
    background: radial-gradient(ellipse at 65% 50%, rgba(46,191,110,.18) 0%, transparent 65%);
    pointer-events: none;
  }
  .hero-breadcrumb {
    font-size: 13px; color: rgba(255,255,255,.5);
    margin-bottom: 14px; letter-spacing: .4px;
  }
  .hero-breadcrumb b { color: rgba(255,255,255,.85); font-weight: 600; }
  .hero h1 {
    font-family: 'Nunito', sans-serif;
    font-size: 38px; font-weight: 900; color: #fff;
    margin-bottom: 14px; letter-spacing: -.3px;
  }
  .hero p {
    max-width: 580px; margin: 0 auto;
    color: rgba(255,255,255,.62); font-size: 15px; line-height: 1.75;
  }

  /* ── LAYOUT ── */
  .page-body { max-width: 1060px; margin: 0 auto; padding: 44px 24px 80px; }
  .grid { display: grid; grid-template-columns: 1fr 320px; gap: 28px; }

  /* ── CARD ── */
  .card {
    background: #fff;
    border-radius: 14px;
    border: 1px solid #e4eaf4;
    box-shadow: 0 2px 20px rgba(26,43,74,.06);
    padding: 36px 32px;
    animation: fadeUp .5s ease both;
  }
  @keyframes fadeUp { from { opacity:0; transform:translateY(16px); } to { opacity:1; transform:translateY(0); } }

  .section-tag {
    display: flex; align-items: center; gap: 8px;
    margin-bottom: 4px;
  }
  .diamond { color: #2ebf6e; font-size: 13px; }
  .section-tag h2 {
    font-family: 'Nunito', sans-serif;
    font-size: 19px; font-weight: 800; color: #1a3a6b;
  }
  .card-sub { font-size: 13.5px; color: #637080; margin-bottom: 28px; line-height: 1.6; }

  /* ── FORM ── */
  .form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
  .field { margin-bottom: 18px; }
  .field label {
    display: block; font-size: 13px; font-weight: 700;
    color: #2d3748; margin-bottom: 6px; letter-spacing: .15px;
  }
  .req { color: #2ebf6e; margin-left: 2px; }
  .field input, .field select, .field textarea {
    width: 100%;
    font-family: 'Mulish', sans-serif;
    font-size: 14px; color: #1a2b4a;
    background: #f9fbfe;
    border: 1.5px solid #dde5f0;
    border-radius: 9px; padding: 11px 14px;
    outline: none; transition: border-color .2s, box-shadow .2s, background .2s;
    resize: vertical;
  }
  .field input:focus, .field select:focus, .field textarea:focus {
    border-color: #2ebf6e;
    box-shadow: 0 0 0 3px rgba(46,191,110,.13);
    background: #fff;
  }
  .field input.err, .field select.err, .field textarea.err {
    border-color: #e53e3e;
    box-shadow: 0 0 0 3px rgba(229,62,62,.10);
  }
  .err-msg { font-size: 12px; color: #e53e3e; margin-top: 5px; min-height: 16px; }
  .field select {
    appearance: none;
    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='8' viewBox='0 0 12 8'%3E%3Cpath d='M1 1l5 5 5-5' stroke='%238a9ab5' stroke-width='1.8' fill='none' stroke-linecap='round'/%3E%3C/svg%3E");
    background-repeat: no-repeat; background-position: right 14px center;
    padding-right: 36px; cursor: pointer;
  }
  .field textarea { min-height: 115px; }
  .char-count { font-size: 11.5px; color: #a0aec0; text-align: right; margin-top: 4px; }

  /* Priority */
  .priority-row { display: flex; gap: 10px; flex-wrap: wrap; }
  .pri-btn {
    padding: 8px 18px; border-radius: 22px;
    border: 1.5px solid #dde5f0;
    background: #f9fbfe; font-family: 'Mulish', sans-serif;
    font-size: 13px; font-weight: 600; color: #637080;
    cursor: pointer; transition: all .18s;
  }
  .pri-btn:hover { border-color: #2ebf6e; color: #2ebf6e; background: #edfaf4; }
  .pri-btn.active { border-color: #2ebf6e; background: #edfaf4; color: #1a9e58; }

  /* File zone */
  .file-zone {
    border: 2px dashed #dde5f0; border-radius: 10px;
    padding: 20px; text-align: center; cursor: pointer;
    transition: border-color .2s, background .2s; background: #f9fbfe;
  }
  .file-zone:hover { border-color: #2ebf6e; background: #edfaf4; }
  .file-zone .fi-icon { font-size: 26px; margin-bottom: 7px; }
  .file-zone p { font-size: 13px; color: #637080; }
  .file-zone p .link { color: #2ebf6e; font-weight: 700; cursor: pointer; }
  .file-name { font-size: 12.5px; color: #2ebf6e; margin-top: 8px; font-weight: 600; }

  /* Submit button */
  .btn-submit {
    width: 100%; padding: 14px;
    background: #2ebf6e; color: #fff;
    font-family: 'Nunito', sans-serif;
    font-size: 15px; font-weight: 800;
    border: none; border-radius: 10px; cursor: pointer;
    transition: background .2s, transform .12s, box-shadow .2s;
    margin-top: 10px; letter-spacing: .2px;
    display: flex; align-items: center; justify-content: center; gap: 10px;
  }
  .btn-submit:hover { background: #23a05c; box-shadow: 0 6px 20px rgba(46,191,110,.28); }
  .btn-submit:active { transform: scale(.985); }
  .btn-submit:disabled { background: #a8d5bc; cursor: not-allowed; box-shadow: none; }
  .spinner {
    width: 18px; height: 18px;
    border: 2.5px solid rgba(255,255,255,.35);
    border-top-color: #fff; border-radius: 50%;
    animation: spin .7s linear infinite;
  }
  @keyframes spin { to { transform: rotate(360deg); } }

  /* Success */
  .success-wrap { text-align: center; padding: 28px 12px; animation: fadeUp .4s ease both; }
  .success-icon-wrap {
    width: 72px; height: 72px; border-radius: 50%;
    background: #edfaf4; border: 3px solid #2ebf6e;
    display: flex; align-items: center; justify-content: center;
    margin: 0 auto 20px; font-size: 30px;
  }
  .success-wrap h3 {
    font-family: 'Nunito', sans-serif;
    font-size: 24px; font-weight: 900; color: #1a2b4a; margin-bottom: 10px;
  }
  .success-wrap p { font-size: 14px; color: #637080; line-height: 1.7; max-width: 360px; margin: 0 auto 28px; }
  .ticket-id {
    display: inline-block; background: #edfaf4;
    border: 1.5px solid #2ebf6e; border-radius: 8px;
    padding: 8px 20px; font-size: 13px; font-weight: 700;
    color: #1a9e58; margin-bottom: 24px; letter-spacing: .4px;
  }
  .btn-again {
    padding: 12px 32px; background: #2ebf6e; color: #fff;
    font-family: 'Nunito', sans-serif; font-weight: 800; font-size: 14px;
    border: none; border-radius: 10px; cursor: pointer;
    transition: background .2s;
  }
  .btn-again:hover { background: #23a05c; }

  /* ── SIDEBAR ── */
  .sidebar { display: flex; flex-direction: column; gap: 20px; }

  .s-card {
    background: #fff; border-radius: 14px;
    border: 1px solid #e4eaf4;
    box-shadow: 0 2px 16px rgba(26,43,74,.05);
    padding: 22px 22px 18px;
    animation: fadeUp .5s ease both;
  }
  .s-card-title {
    font-family: 'Nunito', sans-serif;
    font-size: 14px; font-weight: 800; color: #1a3a6b;
    margin-bottom: 16px;
    display: flex; align-items: center; gap: 8px;
    padding-bottom: 12px; border-bottom: 1.5px solid #edf2f8;
  }
  .s-card-title .ic { font-size: 16px; }

  /* On this page nav */
  .page-nav a {
    display: block; font-size: 13px; color: #3b7dd8;
    text-decoration: none; padding: 6px 0;
    border-bottom: 1px solid #f0f4fb;
    transition: color .2s, padding-left .2s;
  }
  .page-nav a:last-child { border-bottom: none; }
  .page-nav a:hover { color: #2ebf6e; padding-left: 4px; }
  .page-nav a.active { background: #f0f8f4; border-radius: 6px; padding: 6px 10px; color: #1a9e58; font-weight: 700; }

  /* Issue types */
  .issue-list { list-style: none; }
  .issue-list li {
    display: flex; align-items: flex-start; gap: 10px;
    padding: 9px 0; border-bottom: 1px solid #f0f4fb;
    font-size: 13px; color: #637080; line-height: 1.5;
  }
  .issue-list li:last-child { border-bottom: none; }
  .tag {
    flex-shrink: 0; padding: 2px 8px;
    background: #edfaf4; color: #1a9e58;
    border-radius: 20px; font-size: 11px; font-weight: 700;
    margin-top: 1px; border: 1px solid #c6eed8;
  }

  /* Tips */
  .tip-list { list-style: none; }
  .tip-list li {
    display: flex; align-items: flex-start; gap: 8px;
    font-size: 13px; color: #637080; padding: 5px 0; line-height: 1.55;
  }
  .tip-check { color: #2ebf6e; font-weight: 800; flex-shrink: 0; margin-top: 1px; }

  /* Contact rows */
  .c-row {
    display: flex; align-items: center; gap: 12px;
    padding: 10px 0; border-bottom: 1px solid #f0f4fb;
  }
  .c-row:last-child { border-bottom: none; padding-bottom: 0; }
  .c-icon {
    width: 38px; height: 38px; border-radius: 10px;
    background: #edfaf4; border: 1px solid #c6eed8;
    display: flex; align-items: center; justify-content: center;
    font-size: 16px; flex-shrink: 0;
  }
  .c-label { font-size: 11.5px; color: #a0aec0; margin-bottom: 1px; }
  .c-val { font-size: 13.5px; color: #1a2b4a; font-weight: 700; }

  @media(max-width:900px) {
    .grid { grid-template-columns: 1fr; }
  }
  @media(max-width:560px) {
    .hero { padding: 36px 20px 44px; }
    .hero h1 { font-size: 28px; }
    .page-body { padding: 28px 16px 60px; }
    .card { padding: 24px 18px; }
    .form-row { grid-template-columns: 1fr; }
  }
`;

export default function ReportIssue() {
  const [form, setForm] = useState({
    fullName: "", email: "", phone: "", category: "",
    priority: "High", subject: "", description: "",
  });
  const [errors, setErrors] = useState({});
  const [fileName, setFileName] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [ticketId] = useState(() => "UPT-" + Math.floor(100000 + Math.random() * 900000));
  const fileRef = useRef();

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const validate = () => {
    const e = {};
    if (!form.fullName.trim()) e.fullName = "Full name is required.";
    if (!form.email.trim()) e.email = "Email is required.";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = "Enter a valid email address.";
    if (!form.category) e.category = "Please select a category.";
    if (!form.subject.trim()) e.subject = "Subject is required.";
    if (!form.description.trim()) e.description = "Please describe the issue.";
    else if (form.description.trim().length < 20) e.description = "Please provide at least 20 characters.";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = () => {
    if (!validate()) return;
    setLoading(true);
    setTimeout(() => { setLoading(false); setSubmitted(true); }, 1800);
  };

  const handleReset = () => {
    setSubmitted(false);
    setForm({ fullName:"", email:"", phone:"", category:"", priority:"High", subject:"", description:"" });
    setErrors({});
    setFileName("");
  };

  const handleFile = (e) => {
    const f = e.target.files[0];
    if (f) setFileName(f.name);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const f = e.dataTransfer.files[0];
    if (f) setFileName(f.name);
  };

  return (
    <>
      <style>{styles}</style>
      <Header />
      <div className="uptula-root">

        {/* HERO */}
        <div className="hero">
          <div className="hero-breadcrumb">Home &rsaquo; Support &rsaquo; <b>Report Issue</b></div>
          <h1>Report an Issue</h1>
          <p>
            Facing any problem while using Uptula? We're here to help you. Whether it's a job
            application issue, login problem, incorrect information, or technical error — simply
            report it. We'll review and resolve it as quickly as possible.
          </p>
        </div>

        {/* BODY */}
        <div className="page-body">
          <div className="grid">

            {/* FORM CARD */}
            <div className="card">
              {!submitted ? (
                <>
                  <div className="section-tag">
                    <span className="diamond">◆</span>
                    <h2>Submit Your Issue</h2>
                  </div>
                  <p className="card-sub">
                    Fill in the details below. Our team will review your request and get back to you within 24–48 hours.
                  </p>

                  {/* Row 1 */}
                  <div className="form-row">
                    <div className="field">
                      <label>Full Name <span className="req">*</span></label>
                      <input
                        type="text" placeholder="e.g. Priya Mohapatra"
                        value={form.fullName} className={errors.fullName ? "err" : ""}
                        onChange={e => set("fullName", e.target.value)}
                      />
                      <div className="err-msg">{errors.fullName}</div>
                    </div>
                    <div className="field">
                      <label>Email Address <span className="req">*</span></label>
                      <input
                        type="email" placeholder="you@example.com"
                        value={form.email} className={errors.email ? "err" : ""}
                        onChange={e => set("email", e.target.value)}
                      />
                      <div className="err-msg">{errors.email}</div>
                    </div>
                  </div>

                  {/* Row 2 */}
                  <div className="form-row">
                    <div className="field">
                      <label>Phone Number <span style={{color:"#a0aec0",fontWeight:400}}>(optional)</span></label>
                      <input
                        type="tel" placeholder="+91 98765 43210"
                        value={form.phone}
                        onChange={e => set("phone", e.target.value)}
                      />
                    </div>
                    <div className="field">
                      <label>Issue Category <span className="req">*</span></label>
                      <select
                        value={form.category} className={errors.category ? "err" : ""}
                        onChange={e => set("category", e.target.value)}
                      >
                        <option value="">Select a category</option>
                        {CATEGORIES.map(c => <option key={c}>{c}</option>)}
                      </select>
                      <div className="err-msg">{errors.category}</div>
                    </div>
                  </div>

                  {/* Priority */}
                  <div className="field">
                    <label>Priority Level <span className="req">*</span></label>
                    <div className="priority-row">
                      {PRIORITIES.map(p => (
                        <button
                          key={p}
                          className={`pri-btn${form.priority === p ? " active" : ""}`}
                          onClick={() => set("priority", p)}
                        >
                          {p === "Low" ? "🟢" : p === "Medium" ? "🟡" : "🔴"} {p}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Subject */}
                  <div className="field">
                    <label>Subject <span className="req">*</span></label>
                    <input
                      type="text" placeholder="Brief title of your issue" maxLength={100}
                      value={form.subject} className={errors.subject ? "err" : ""}
                      onChange={e => set("subject", e.target.value)}
                    />
                    <div className="err-msg">{errors.subject}</div>
                  </div>

                  {/* Description */}
                  <div className="field">
                    <label>Issue Description <span className="req">*</span></label>
                    <textarea
                      maxLength={1000}
                      placeholder="Describe the issue in detail — what happened, when it occurred, steps to reproduce, and any error messages you saw..."
                      value={form.description}
                      className={errors.description ? "err" : ""}
                      onChange={e => set("description", e.target.value)}
                    />
                    <div className="char-count">{form.description.length}/1000</div>
                    <div className="err-msg">{errors.description}</div>
                  </div>

                  {/* File upload */}
                  <div className="field">
                    <label>Attach Screenshot / File <span style={{color:"#a0aec0",fontWeight:400}}>(optional)</span></label>
                    <div
                      className="file-zone"
                      onDragOver={e => e.preventDefault()}
                      onDrop={handleDrop}
                      onClick={() => fileRef.current.click()}
                    >
                      <input type="file" ref={fileRef} style={{display:"none"}} accept="image/*,.pdf,.doc,.docx" onChange={handleFile} />
                      <div className="fi-icon">📎</div>
                      <p>Drag & drop or <span className="link">browse file</span></p>
                      <p style={{fontSize:"11.5px",color:"#a0aec0",marginTop:"4px"}}>PNG, JPG, PDF, DOC — Max 5 MB</p>
                      {fileName && <div className="file-name">📄 {fileName}</div>}
                    </div>
                  </div>

                  <button
                    className="btn-submit"
                    onClick={handleSubmit}
                    disabled={loading}
                  >
                    {loading ? (
                      <><div className="spinner" /> Submitting…</>
                    ) : (
                      <><span>📨</span> Submit Report</>
                    )}
                  </button>
                </>
              ) : (
                <div className="success-wrap">
                  <div className="success-icon-wrap">✅</div>
                  <h3>Issue Reported Successfully!</h3>
                  <div className="ticket-id">Ticket ID: {ticketId}</div>
                  <p>
                    Thank you for reaching out. Our support team has received your report
                    and will get back to you at <strong>{form.email}</strong> within 24–48 hours.
                  </p>
                  <button className="btn-again" onClick={handleReset}>Submit Another Issue</button>
                </div>
              )}
            </div>

            {/* SIDEBAR */}
            <div className="sidebar">

              {/* On this page */}
              <div className="s-card">
                <div className="s-card-title"><span className="ic">📌</span> On this page</div>
                <div className="page-nav">
                  <a href="#" className="active">Submit Your Issue</a>
                  <a href="#">Issue Types We Handle</a>
                  <a href="#">Tips for Faster Help</a>
                  <a href="#">Contact Support</a>
                  <a href="#">FAQs</a>
                </div>
              </div>

              {/* Issue types */}
              <div className="s-card">
                <div className="s-card-title"><span className="ic">📋</span> Issue Types We Handle</div>
                <ul className="issue-list">
                  {ISSUE_TYPES.map(t => (
                    <li key={t.tag}>
                      <span className="tag">{t.tag}</span>
                      {t.desc}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Tips */}
              <div className="s-card">
                <div className="s-card-title"><span className="ic">💡</span> Tips for Faster Resolution</div>
                <ul className="tip-list">
                  {[
                    "Include the exact error message if any",
                    "Mention your browser and device model",
                    "Attach a screenshot of the issue",
                    "Provide the job or employer name if relevant",
                    "Check your spam folder for our reply",
                  ].map(t => (
                    <li key={t}><span className="tip-check">✓</span>{t}</li>
                  ))}
                </ul>
              </div>

              {/* Contact */}
              <div className="s-card">
                <div className="s-card-title"><span className="ic">📞</span> Other Ways to Reach Us</div>
                {[
                  { icon:"📧", label:"Email Support", val:"support@uptula.com" },
                  { icon:"🕐", label:"Response Time", val:"24 – 48 hours" },
                  { icon:"📅", label:"Working Hours", val:"Mon–Sat, 9AM–6PM" },
                ].map(c => (
                  <div className="c-row" key={c.label}>
                    <div className="c-icon">{c.icon}</div>
                    <div>
                      <div className="c-label">{c.label}</div>
                      <div className="c-val">{c.val}</div>
                    </div>
                  </div>
                ))}
              </div>

            </div>
          </div>
        </div>

      </div>
      <Footer />
    </>
  );
}
