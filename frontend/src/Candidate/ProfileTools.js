import React, { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import Header from "../Components/Header";
import Footer from "../Components/Footer";
import RegistrationCategoryFields from "../Components/RegistrationCategoryFields";
import { API_BASE_URL } from "../config/api";

const card = { background: "#fff", borderRadius: 12, padding: 24, marginBottom: 24, boxShadow: "0 2px 10px rgba(0,0,0,0.06)" };
const btn = (bg) => ({ padding: "10px 18px", background: bg, color: "#fff", border: 0, borderRadius: 8, cursor: "pointer", fontWeight: 600, marginRight: 10 });

function CompletionMeter({ value }) {
  const pct = Math.max(0, Math.min(100, Number(value) || 0));
  const color = pct >= 80 ? "#1cc88a" : pct >= 50 ? "#f6c23e" : "#e74a3b";
  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
        <strong>Profile Completion</strong>
        <span>{pct}%</span>
      </div>
      <div style={{ background: "#eee", borderRadius: 20, height: 12, overflow: "hidden" }}>
        <div style={{ width: `${pct}%`, height: "100%", background: color, transition: "width .4s" }} />
      </div>
    </div>
  );
}

function ProfileTools() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const token = () => localStorage.getItem("token");

  const [profile, setProfile] = useState(null);
  const [message, setMessage] = useState("");

  // Resume parsing state
  const [file, setFile] = useState(null);
  const [parsing, setParsing] = useState(false);
  const [parsed, setParsed] = useState(null);
  const [editing, setEditing] = useState(false);

  // Category state (single-select, matches RegistrationCategoryFields)
  const [catValue, setCatValue] = useState({ categoryId: "", subcategoryId: "" });
  const [savingCats, setSavingCats] = useState(false);

  // AI state
  const [aiEnabled, setAiEnabled] = useState(false);
  const [aiBusy, setAiBusy] = useState("");
  const [aiResult, setAiResult] = useState(null);

  const loadProfile = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/profile`, { headers: { Authorization: `Bearer ${token()}` } });
      if (res.ok) {
        const data = await res.json();
        setProfile(data.profile);
        setCatValue({
          categoryId: (data.profile.categoryIds && data.profile.categoryIds[0]) ? String(data.profile.categoryIds[0]) : "",
          subcategoryId: (data.profile.subcategoryIds && data.profile.subcategoryIds[0]) ? String(data.profile.subcategoryIds[0]) : "",
        });
      }
    } catch (e) { /* ignore */ }
  }, []);

  useEffect(() => { if (!authLoading && !user) navigate("/"); }, [authLoading, user, navigate]);
  useEffect(() => { loadProfile(); }, [loadProfile]);
  useEffect(() => {
    fetch(`${API_BASE_URL}/api/ai/status`).then((r) => r.json()).then((d) => setAiEnabled(!!d.configured)).catch(() => setAiEnabled(false));
  }, []);

  const toObjArr = (arr) => (Array.isArray(arr) ? arr.map((line) => (typeof line === "string" ? { text: line } : line)) : []);

  const handleParse = async () => {
    if (!file) { setMessage("Please choose a resume file (PDF/DOC/DOCX)."); return; }
    setParsing(true); setMessage("");
    try {
      const fd = new FormData();
      fd.append("resume", file);
      fd.append("enhance", "true");
      const res = await fetch(`${API_BASE_URL}/api/resume/parse`, {
        method: "POST", headers: { Authorization: `Bearer ${token()}` }, body: fd,
      });
      const data = await res.json();
      if (res.ok) {
        setParsed({
          name: data.parsed.name || "",
          phone: data.parsed.phone || "",
          linkedin: data.parsed.linkedin || "",
          github: data.parsed.github || "",
          skills: data.parsed.skills || [],
          experience: toObjArr(data.parsed.experience),
          education: toObjArr(data.parsed.education),
          certifications: toObjArr(data.parsed.certifications),
          aiUsed: data.aiUsed,
        });
        setEditing(false);
      } else { setMessage(data.message || "Could not parse resume."); }
    } catch (e) { setMessage("Network error while parsing resume."); }
    setParsing(false);
  };

  const applyParsed = async () => {
    try {
      const payload = {
        name: parsed.name, phone: parsed.phone, linkedin: parsed.linkedin,
        skills: parsed.skills, experience: parsed.experience, education: parsed.education, certifications: parsed.certifications,
      };
      const res = await fetch(`${API_BASE_URL}/api/resume/apply-parsed`, {
        method: "POST", headers: { Authorization: `Bearer ${token()}`, "Content-Type": "application/json" }, body: JSON.stringify(payload),
      });
      const data = await res.json();
      setMessage(res.ok ? "Profile updated from your resume!" : data.message || "Failed to save.");
      if (res.ok) { setParsed(null); loadProfile(); }
    } catch (e) { setMessage("Network error while saving."); }
  };

  const saveCategories = async () => {
    if (!catValue.categoryId) { setMessage("Select a category."); return; }
    setSavingCats(true); setMessage("");
    try {
      const res = await fetch(`${API_BASE_URL}/api/profile/categories`, {
        method: "PUT", headers: { Authorization: `Bearer ${token()}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          categoryIds: [Number(catValue.categoryId)],
          subcategoryIds: catValue.subcategoryId ? [Number(catValue.subcategoryId)] : [],
        }),
      });
      const data = await res.json();
      setMessage(res.ok ? "Category saved!" : data.message || "Failed to save category.");
      if (res.ok) loadProfile();
    } catch (e) { setMessage("Network error while saving category."); }
    setSavingCats(false);
  };

  const runAi = async (kind) => {
    setAiBusy(kind); setAiResult(null); setMessage("");
    try {
      const endpoint = { enhance: "enhance-profile", headline: "headline", career: "career-advice" }[kind];
      const res = await fetch(`${API_BASE_URL}/api/ai/${endpoint}`, {
        method: "POST", headers: { Authorization: `Bearer ${token()}`, "Content-Type": "application/json" }, body: JSON.stringify({}),
      });
      const data = await res.json();
      if (res.ok) setAiResult({ kind, data }); else setMessage(data.message || "AI request failed.");
    } catch (e) { setMessage("Network error during AI request."); }
    setAiBusy("");
  };

  return (
    <>
      <Header />
      <div className="page-title"><div className="container"><div className="page-caption">
        <h2>Profile Tools</h2>
        <p>Resume parsing, category & profile strength</p>
      </div></div></div>

      <section className="padd-top-80 padd-bot-80">
        <div className="container" style={{ maxWidth: 860 }}>
          {message && <div className="alert alert-info" role="alert">{message}</div>}

          {profile && (
            <div style={card}>
              <CompletionMeter value={profile.profileCompletion} />
              <p style={{ marginTop: 12, color: "#666", fontSize: 13 }}>
                Resume status: <strong>{profile.resumeStatus || "none"}</strong>
                {profile.resumeName ? ` · ${profile.resumeName}` : ""}
              </p>
            </div>
          )}

          {/* Resume parsing */}
          <div style={card}>
            <h3 style={{ marginTop: 0 }}>Resume Parsing</h3>
            <p style={{ color: "#666" }}>Upload your resume and we'll extract your details automatically.</p>
            <input type="file" accept=".pdf,.doc,.docx" onChange={(e) => setFile(e.target.files?.[0] || null)} style={{ marginBottom: 12, display: "block" }} />
            <button type="button" style={btn("#4e73df")} onClick={handleParse} disabled={parsing}>
              {parsing ? "Parsing..." : "Parse Resume"}
            </button>

            {parsed && (
              <div style={{ marginTop: 20, borderTop: "1px solid #eee", paddingTop: 16 }}>
                <h4>We found the following information from your resume{parsed.aiUsed ? " (AI-assisted)" : ""}.</h4>
                <ReviewField label="Name" value={parsed.name} editing={editing} onChange={(v) => setParsed({ ...parsed, name: v })} />
                <ReviewField label="Phone" value={parsed.phone} editing={editing} onChange={(v) => setParsed({ ...parsed, phone: v })} />
                <ReviewField label="LinkedIn" value={parsed.linkedin} editing={editing} onChange={(v) => setParsed({ ...parsed, linkedin: v })} />
                <ReviewField label="GitHub" value={parsed.github} editing={editing} onChange={(v) => setParsed({ ...parsed, github: v })} />
                <ReviewChips label="Skills" items={parsed.skills} editing={editing} onChange={(items) => setParsed({ ...parsed, skills: items })} />
                <ReviewLines label="Experience" items={parsed.experience} editing={editing} onChange={(items) => setParsed({ ...parsed, experience: items })} />
                <ReviewLines label="Education" items={parsed.education} editing={editing} onChange={(items) => setParsed({ ...parsed, education: items })} />
                <ReviewLines label="Certifications" items={parsed.certifications} editing={editing} onChange={(items) => setParsed({ ...parsed, certifications: items })} />
                <div style={{ marginTop: 16 }}>
                  <button type="button" style={btn("#1cc88a")} onClick={applyParsed}>Accept All</button>
                  <button type="button" style={btn("#f6c23e")} onClick={() => setEditing((e) => !e)}>{editing ? "Done Editing" : "Edit Before Saving"}</button>
                  <button type="button" style={btn("#e74a3b")} onClick={() => setParsed(null)}>Reject</button>
                </div>
              </div>
            )}
          </div>

          {/* Category */}
          <div style={card}>
            <h3 style={{ marginTop: 0 }}>My Category</h3>
            <RegistrationCategoryFields
              value={catValue}
              onChange={({ categoryId, subcategoryId }) => setCatValue({ categoryId, subcategoryId })}
            />
            <button type="button" style={btn("#4e73df")} onClick={saveCategories} disabled={savingCats}>
              {savingCats ? "Saving..." : "Save Category"}
            </button>
          </div>

          {/* AI Assistant */}
          {aiEnabled && (
            <div style={card}>
              <h3 style={{ marginTop: 0 }}>AI Assistant</h3>
              <p style={{ color: "#666" }}>Get AI-powered suggestions based on your profile.</p>
              <button type="button" style={btn("#6f42c1")} onClick={() => runAi("enhance")} disabled={!!aiBusy}>{aiBusy === "enhance" ? "Analyzing..." : "Profile Strength & Skills"}</button>
              <button type="button" style={btn("#6f42c1")} onClick={() => runAi("headline")} disabled={!!aiBusy}>{aiBusy === "headline" ? "Generating..." : "Headline Ideas"}</button>
              <button type="button" style={btn("#6f42c1")} onClick={() => runAi("career")} disabled={!!aiBusy}>{aiBusy === "career" ? "Thinking..." : "Career Advice"}</button>
              {aiResult && (
                <div style={{ marginTop: 16, background: "#faf9ff", border: "1px solid #e7e0ff", borderRadius: 8, padding: 14 }}>
                  {aiResult.kind === "enhance" && aiResult.data.result && (
                    <div>
                      <p><strong>Profile strength:</strong> {aiResult.data.result.profileStrengthScore}/100 · <strong>Resume score:</strong> {aiResult.data.result.resumeScore}/100</p>
                      <p><strong>Missing skills:</strong> {(aiResult.data.result.missingSkills || []).join(", ") || "—"}</p>
                      <p><strong>Recommended skills:</strong> {(aiResult.data.result.recommendedSkills || []).join(", ") || "—"}</p>
                      <p><strong>Suggestions:</strong></p>
                      <ul>{(aiResult.data.result.careerSuggestions || []).map((s, i) => <li key={i}>{s}</li>)}</ul>
                    </div>
                  )}
                  {aiResult.kind === "headline" && <ul>{(aiResult.data.headlines || []).map((h, i) => <li key={i}>{h}</li>)}</ul>}
                  {aiResult.kind === "career" && <div style={{ whiteSpace: "pre-wrap" }}>{aiResult.data.advice}</div>}
                </div>
              )}
            </div>
          )}
        </div>
      </section>
      <Footer />
    </>
  );
}

function ReviewField({ label, value, editing, onChange }) {
  return (
    <div style={{ marginBottom: 10 }}>
      <label style={{ fontWeight: 600, fontSize: 13, display: "block" }}>{label}</label>
      {editing
        ? <input value={value || ""} onChange={(e) => onChange(e.target.value)} style={{ width: "100%", padding: 8, border: "1px solid #ddd", borderRadius: 6 }} />
        : <div style={{ color: value ? "#333" : "#aaa" }}>{value || "—"}</div>}
    </div>
  );
}

function ReviewChips({ label, items, editing, onChange }) {
  const [input, setInput] = useState("");
  return (
    <div style={{ marginBottom: 10 }}>
      <label style={{ fontWeight: 600, fontSize: 13, display: "block" }}>{label}</label>
      <div>
        {(items || []).map((s, i) => (
          <span key={i} style={{ display: "inline-block", background: "#eef2ff", color: "#3730a3", padding: "4px 10px", borderRadius: 16, margin: "3px 6px 3px 0", fontSize: 13 }}>
            {s}{editing && <span style={{ cursor: "pointer", marginLeft: 6 }} onClick={() => onChange(items.filter((_, idx) => idx !== i))}>×</span>}
          </span>
        ))}
        {(!items || items.length === 0) && <span style={{ color: "#aaa" }}>—</span>}
      </div>
      {editing && (
        <div style={{ marginTop: 6 }}>
          <input value={input} onChange={(e) => setInput(e.target.value)} placeholder="Add skill" style={{ padding: 6, border: "1px solid #ddd", borderRadius: 6 }} />
          <button type="button" style={{ marginLeft: 6 }} onClick={() => { if (input.trim()) { onChange([...(items || []), input.trim()]); setInput(""); } }}>Add</button>
        </div>
      )}
    </div>
  );
}

function ReviewLines({ label, items, editing, onChange }) {
  return (
    <div style={{ marginBottom: 10 }}>
      <label style={{ fontWeight: 600, fontSize: 13, display: "block" }}>{label}</label>
      {(items || []).length === 0 && <div style={{ color: "#aaa" }}>—</div>}
      {(items || []).map((it, i) => {
        const text = it.text != null ? it.text : (it.description || JSON.stringify(it));
        return (
          <div key={i} style={{ marginBottom: 4 }}>
            {editing ? (
              <div style={{ display: "flex", gap: 6 }}>
                <input value={text} onChange={(e) => { const copy = [...items]; copy[i] = { text: e.target.value }; onChange(copy); }} style={{ flex: 1, padding: 6, border: "1px solid #ddd", borderRadius: 6 }} />
                <button type="button" onClick={() => onChange(items.filter((_, idx) => idx !== i))}>×</button>
              </div>
            ) : <div style={{ fontSize: 14 }}>• {text}</div>}
          </div>
        );
      })}
    </div>
  );
}

export default ProfileTools;
