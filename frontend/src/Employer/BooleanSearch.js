// import React, { useState, useEffect, useCallback, useRef } from "react";
// import { useNavigate } from "react-router-dom";
// import { useAuth } from "../context/AuthContext";
// import Header from "../Components/Header";
// import Footer from "../Components/Footer";
// import EmployerSidebar from "./Sidebar";
// import { API_BASE_URL } from "../config/api";
// import useJobCategories from "../hooks/useJobCategories";

// // ─── small helper ──────────────────────────────────────────────────────────────
// const authHeaders = (token) => ({
//   Authorization: `Bearer ${token}`,
//   "Content-Type": "application/json",
//   Accept: "application/json",
// });

// /** Tag field for skills / locations / mustHave / mustNotHave — defined outside so focus is kept. */
// function TagInput({ label, color, value, onChange, onAdd, items, onRemove, placeholder }) {
//   return (
//     <div className="bs-tag-field form-group">
//       <label className="bs-tag-label" style={{ color }}>{label}</label>
//       <div className="bs-tag-row">
//         <input
//           type="text"
//           className="form-control bs-tag-input"
//           placeholder={placeholder}
//           value={value}
//           onChange={(e) => onChange(e.target.value)}
//           onKeyDown={(e) => {
//             if (e.key === "Enter") {
//               e.preventDefault();
//               onAdd();
//             }
//           }}
//         />
//         <button type="button" className="bs-tag-add" onClick={onAdd}>
//           Add
//         </button>
//       </div>
//       {items.length > 0 && (
//         <div className="bs-tag-chips">
//           {items.map((term, i) => (
//             <span
//               key={`${String(term)}-${i}`}
//               className="bs-tag-chip"
//               style={{ backgroundColor: color }}
//             >
//               {term}
//               <button type="button" onClick={() => onRemove(i)} aria-label={`Remove ${term}`}>
//                 ×
//               </button>
//             </span>
//           ))}
//         </div>
//       )}
//     </div>
//   );
// }

// /** Mobile-safe select: menu stays within the field width (native <select> cannot). */
// function BsSelect({ value, onChange, options, placeholder, disabled = false }) {
//   const [open, setOpen] = useState(false);
//   const ref = useRef(null);

//   useEffect(() => {
//     const close = (e) => {
//       if (ref.current && !ref.current.contains(e.target)) setOpen(false);
//     };
//     document.addEventListener("mousedown", close);
//     document.addEventListener("touchstart", close);
//     return () => {
//       document.removeEventListener("mousedown", close);
//       document.removeEventListener("touchstart", close);
//     };
//   }, []);

//   useEffect(() => {
//     if (disabled) setOpen(false);
//   }, [disabled]);

//   const selected = options.find((o) => String(o.value) === String(value));

//   return (
//     <div className={`bs-select${disabled ? " is-disabled" : ""}`} ref={ref}>
//       <button
//         type="button"
//         className="bs-select-trigger form-control"
//         disabled={disabled}
//         aria-haspopup="listbox"
//         aria-expanded={open}
//         onClick={() => !disabled && setOpen((o) => !o)}
//       >
//         <span className={selected ? "bs-select-label" : "bs-select-placeholder"}>
//           {selected ? selected.label : placeholder}
//         </span>
//         <span className="bs-select-caret" aria-hidden="true">{open ? "▴" : "▾"}</span>
//       </button>
//       {open && !disabled && (
//         <ul className="bs-select-menu" role="listbox">
//           {options.map((o) => {
//             const active = String(o.value) === String(value);
//             return (
//               <li
//                 key={o.value === "" ? "__empty" : String(o.value)}
//                 role="option"
//                 aria-selected={active}
//                 className={active ? "is-active" : ""}
//                 onClick={() => {
//                   onChange(o.value);
//                   setOpen(false);
//                 }}
//               >
//                 {o.label}
//               </li>
//             );
//           })}
//         </ul>
//       )}
//     </div>
//   );
// }

// function BooleanSearch() {
//   const { user, loading: authLoading } = useAuth();
//   const navigate = useNavigate();

//   const [loading, setLoading] = useState(false);
//   const [message, setMessage] = useState({ text: "", type: "" });
//   const [searchStatus, setSearchStatus] = useState(null);
//   const [candidates, setCandidates] = useState([]);
//   const [savedSearches, setSavedSearches] = useState([]);

//   // Server-side pagination
//   const [page, setPage] = useState(1);
//   const [pageSize, setPageSize] = useState(100);
//   const [totalMatching, setTotalMatching] = useState(0);
//   const [totalPages, setTotalPages] = useState(0);
//   const [hasNext, setHasNext] = useState(false);
//   const [hasPrev, setHasPrev] = useState(false);
//   const [hasSearched, setHasSearched] = useState(false);

//   // Search form state
//   const [searchQuery, setSearchQuery]   = useState("");
//   const [useProFeatures, setUseProFeatures] = useState(false);
//   const [filters, setFilters] = useState({
//     designation: "",
//     skills: [],
//     categoryId: "",
//     subcategoryId: "",
//     locations: [],
//     gender: "",
//     mustHave: [],
//     mustNotHave: [],
//   });

//   // Same category/subcategory loader used on Candidate Profile
//   const {
//     categories,
//     subcategories,
//     loading: categoriesLoading,
//     subcategoriesLoading,
//   } = useJobCategories(filters.categoryId || null);

//   // tag-style inputs
//   const [skillInput, setSkillInput] = useState("");
//   const [locationInput, setLocationInput] = useState("");
//   const [mustHaveInput, setMustHaveInput] = useState("");
//   const [mustNotHaveInput, setMustNotHaveInput] = useState("");

//   // ── flash message helper ────────────────────────────────────────────────────
//   const flash = useCallback((text, type = "danger", ms = 5000) => {
//     setMessage({ text, type });
//     setTimeout(() => setMessage({ text: "", type: "" }), ms);
//   }, []);

//   // ── data loaders ───────────────────────────────────────────────────────────
//   const loadSearchStatus = useCallback(async () => {
//     const token = localStorage.getItem("token");
//     if (!token) return;
//     try {
//       const res = await fetch(
//         `${API_BASE_URL}/api/search/boolean-search/status`,
//         { headers: authHeaders(token), credentials: "include" }
//       );
//       if (res.ok) setSearchStatus(await res.json());
//     } catch (err) {
//       console.error("Error loading search status:", err);
//     }
//   }, []);

//   const loadSavedSearches = useCallback(async () => {
//     const token = localStorage.getItem("token");
//     if (!token) return;
//     try {
//       const res = await fetch(
//         `${API_BASE_URL}/api/search/boolean-search/saved`,
//         { headers: authHeaders(token), credentials: "include" }
//       );
//       if (res.ok) {
//         const data = await res.json();
//         setSavedSearches(data.savedSearches || []);
//       }
//     } catch (_) {
//       // non-premium users will get 403 — ignore silently
//     }
//   }, []);

//   useEffect(() => {
//     if (!user) { navigate("/"); return; }
//     if (user.role !== "provider") { navigate("/"); return; }
//     loadSearchStatus();
//     loadSavedSearches();
//   }, [user, navigate, loadSearchStatus, loadSavedSearches]);

//   // ── search ─────────────────────────────────────────────────────────────────
//   const runSearch = async (pageToLoad = 1, limitOverride = null) => {
//     const limit = limitOverride != null ? limitOverride : pageSize;
//     const hasAnyCriteria =
//       searchQuery.trim() ||
//       filters.designation.trim() ||
//       filters.skills.length > 0 ||
//       filters.categoryId ||
//       filters.subcategoryId ||
//       filters.locations.length > 0 ||
//       (useProFeatures && (filters.mustHave.length > 0 || filters.mustNotHave.length > 0 || filters.gender));

//     if (!hasAnyCriteria) {
//       flash("Please enter at least one keyword or filter.");
//       return;
//     }

//     setLoading(true);
//     setMessage({ text: "", type: "" });
//     if (pageToLoad === 1) setCandidates([]);

//     const token = localStorage.getItem("token");
//     if (!token) { flash("Please login again."); setLoading(false); return; }

//     try {
//       const res = await fetch(`${API_BASE_URL}/api/search/boolean-search`, {
//         method: "POST",
//         headers: authHeaders(token),
//         body: JSON.stringify({
//           searchQuery,
//           filters,
//           useProFeatures,
//           page: pageToLoad,
//           limit,
//         }),
//         credentials: "include",
//       });

//       const data = await res.json();

//       if (res.ok) {
//         const results = data.candidates || [];
//         setCandidates(results);
//         setPage(data.page || pageToLoad);
//         setPageSize(data.limit || limit);
//         setTotalMatching(data.totalMatching ?? results.length);
//         setTotalPages(data.totalPages ?? 0);
//         setHasNext(!!data.hasNext);
//         setHasPrev(!!data.hasPrev);
//         setHasSearched(true);
//         if (data.usedProTrial && !data.isPremium && pageToLoad === 1) {
//           flash(
//             "You have used your free pro feature trial. Upgrade to premium for unlimited access.",
//             "warning",
//             6000
//           );
//         }
//         if (pageToLoad === 1) await loadSearchStatus();
//       } else {
//         if (data.upgradeRequired) {
//           flash(data.message || "Please upgrade to premium to use this feature.", "warning");
//           setTimeout(() => navigate("/employer/premium"), 2500);
//         } else {
//           flash(data.message || "Search failed. Please try again.");
//         }
//       }
//     } catch (err) {
//       console.error("Search error:", err);
//       flash("Search failed. Please check your connection and try again.");
//     } finally {
//       setLoading(false);
//     }
//   };

//   const handleSearch = async (e) => {
//     e.preventDefault();
//     setPage(1);
//     await runSearch(1);
//   };

//   const goToPage = async (nextPage) => {
//     if (loading) return;
//     if (nextPage < 1 || (totalPages > 0 && nextPage > totalPages)) return;
//     await runSearch(nextPage);
//   };

//   const handlePageSizeChange = async (e) => {
//     const nextSize = Number(e.target.value) || 100;
//     setPageSize(nextSize);
//     setPage(1);
//     if (hasSearched) await runSearch(1, nextSize);
//   };

//   // ── save search ────────────────────────────────────────────────────────────
//   const handleSaveSearch = async () => {
//     if (!searchQuery.trim() && filters.skills.length === 0 && !filters.designation.trim()) {
//       flash("Please enter a search query or filter first.", "warning");
//       return;
//     }
//     const searchName = prompt("Enter a name for this search:");
//     if (!searchName || !searchName.trim()) return;

//     const token = localStorage.getItem("token");
//     if (!token) return;

//     try {
//       const res = await fetch(`${API_BASE_URL}/api/search/boolean-search/save`, {
//         method: "POST",
//         headers: authHeaders(token),
//         body: JSON.stringify({ searchName: searchName.trim(), searchQuery, searchFilters: filters }),
//         credentials: "include",
//       });
//       const data = await res.json();
//       if (res.ok) {
//         flash("Search saved successfully!", "success", 3000);
//         await loadSavedSearches();
//       } else {
//         if (data.upgradeRequired) {
//           flash("This feature requires premium membership.", "warning");
//           setTimeout(() => navigate("/employer/premium"), 2000);
//         } else {
//           flash(data.message || "Failed to save search.");
//         }
//       }
//     } catch (err) {
//       console.error("Save search error:", err);
//       flash("Failed to save search.");
//     }
//   };

//   // ── load saved search ──────────────────────────────────────────────────────
//   const loadSavedSearch = (savedSearch) => {
//     setSearchQuery(savedSearch.search_query || "");
//     if (savedSearch.search_filters && typeof savedSearch.search_filters === "object") {
//       const f = savedSearch.search_filters;
//       setFilters({
//         designation: f.designation || "",
//         skills: f.skills || [],
//         categoryId: f.categoryId || "",
//         subcategoryId: f.subcategoryId || "",
//         locations: f.locations || [],
//         gender: f.gender || "",
//         mustHave: f.mustHave || [],
//         mustNotHave: f.mustNotHave || [],
//       });
//     }
//     setUseProFeatures(true);
//   };

//   // ── generic tag-list helpers (skills / locations / mustHave / mustNotHave) ──
//   const addTag = (field, value, setInput) => {
//     const val = value.trim();
//     if (!val) return;
//     setFilters((p) => ({ ...p, [field]: [...p[field], val] }));
//     setInput("");
//   };
//   const removeTag = (field, index) =>
//     setFilters((p) => ({ ...p, [field]: p[field].filter((_, i) => i !== index) }));

//   // ── derived flags ──────────────────────────────────────────────────────────
//   const canUsePro = searchStatus?.canUseProFeatures ?? false;
//   const isPremium = searchStatus?.isPremium ?? false;

//   // ── guards ─────────────────────────────────────────────────────────────────
//   if (authLoading) {
//     return (
//       <div style={{ display:"flex", justifyContent:"center", alignItems:"center", height:"100vh", backgroundColor:"#f8f9fa" }}>
//         <div style={{ textAlign:"center", padding:"40px", backgroundColor:"white", borderRadius:"10px", boxShadow:"0 4px 6px rgba(0,0,0,.1)" }}>
//           <div style={{ width:40, height:40, border:"4px solid #f3f3f3", borderTop:"4px solid #007bff", borderRadius:"50%", animation:"spin 1s linear infinite", margin:"0 auto 20px" }} />
//           <h3>Loading…</h3>
//         </div>
//       </div>
//     );
//   }

//   if (!user || user.role !== "provider") {
//     return (
//       <div className="container" style={{ padding:"50px", textAlign:"center" }}>
//         <h2>Please login as an employer to access this feature</h2>
//         <button onClick={() => navigate("/")} className="btn btn-primary">Go to Home</button>
//       </div>
//     );
//   }

//   const alertClass = { success:"alert-success", warning:"alert-warning", danger:"alert-danger" }[message.type] || "alert-danger";

//   return (
//     <>
//       <Header />

//       <style>{`
//         @keyframes spin { to { transform: rotate(360deg); } }

//         @media (max-width: 991px) {
//           .employer-dashboard-sidebar { display: none !important; }
//           .employer-dashboard-main { width:100%!important; max-width:100%!important; float:none!important; }
//         }

//         .bs-futuristic-card {
//           border: 1px solid #e2e8f0;
//           border-radius: 12px;
//           overflow: hidden;
//           box-shadow: 0 8px 24px rgba(15,23,42,.08);
//         }
//         .bs-search-card {
//           border: none !important;
//           border-radius: 12px;
//           overflow: visible;
//           box-shadow: none;
//         }
//         .bs-search-card .card-body {
//           overflow-x: hidden;
//           max-width: 100%;
//         }
//         .bs-futuristic-card .card-header {
//           background: linear-gradient(90deg,#f8fafc 0%,#eef6ff 100%);
//           border-bottom: 1px solid #e2e8f0;
//           padding: 14px 18px;
//         }
//         .bs-search-card .card-header {
//           background: linear-gradient(90deg,#f8fafc 0%,#eef6ff 100%);
//           border-bottom: none;
//           padding: 14px 18px;
//         }
//         .bs-futuristic-card .card-header h4,
//         .bs-search-card .card-header h4 {
//           margin: 0; font-size:18px; font-weight:700; color:#0f172a; letter-spacing:.2px;
//         }

//         .bs-saved-row {
//           margin-bottom: 10px; padding: 12px 14px;
//           border: 1px solid #e2e8f0; border-radius: 10px;
//           display: flex; align-items: center; justify-content: space-between; gap: 10px;
//           background: #fff; transition: transform .15s ease, box-shadow .15s ease;
//         }
//         .bs-saved-row:hover { transform: translateY(-1px); box-shadow: 0 6px 14px rgba(15,23,42,.08); }

//         .bs-results-table thead th {
//           font-weight:700; font-size:13px; text-transform:uppercase;
//           letter-spacing:.4px; color:#334155; background:#f8fafc;
//           border-bottom:1px solid #dbe5f1; vertical-align:middle;
//         }
//         .bs-results-table tbody td { vertical-align:middle; color:#0f172a; border-top:1px solid #eef2f7; }
//         .bs-results-table tbody tr:hover { background:#f8fbff; }
//         .bs-results-table td.bs-name-cell {
//           max-width: 160px;
//           width: 160px;
//         }
//         .bs-results-table .bs-name-text {
//           display: block;
//           max-width: 100%;
//         }
//         /* Spaced names: wrap onto the next line inside the cell */
//         .bs-results-table .bs-name-text.is-wrap {
//           white-space: normal;
//           overflow-wrap: break-word;
//           word-break: normal;
//         }
//         /* Single unbroken token: keep one line and truncate with … */
//         .bs-results-table .bs-name-text.is-ellipsis {
//           overflow: hidden;
//           text-overflow: ellipsis;
//           white-space: nowrap;
//         }

//         .bs-search-card .form-group > label {
//           font-weight:600; color:#1f3b5b; display:inline-flex; align-items:center; gap:6px;
//         }
//         .bs-search-card .form-control {
//           border:1px solid #dbe5f1; border-radius:10px; box-shadow:0 1px 2px rgba(15,23,42,.03);
//         }
//         .bs-search-card .form-control:focus {
//           border-color:#22c55e; box-shadow:0 0 0 3px rgba(34,197,94,.12);
//         }

//         .bs-section {
//           padding: 16px; background: #f8fafc;
//           border: 1px solid #e2e8f0; border-radius: 10px; margin-bottom: 16px;
//         }
//         .bs-section h5 { color:#1f3b5b; font-weight:700; margin-bottom:12px; font-size: 15px; }

//         .bs-pro-section {
//           padding: 16px; background: #f0fdf4;
//           border: 1px solid #bbf7d0; border-radius: 10px; margin-bottom: 16px;
//         }
//         .bs-pro-section h5 { color:#15803d; font-weight:700; margin-bottom:12px; }

//         .bs-tag-field { margin-bottom: 14px; }
//         .bs-tag-label {
//           font-weight: 600;
//           font-size: 13px;
//           display: block;
//           margin-bottom: 8px;
//         }
//         .bs-tag-row {
//           display: flex;
//           align-items: stretch;
//           gap: 8px;
//           width: 100%;
//         }
//         .bs-tag-input {
//           flex: 1 1 auto;
//           min-width: 0;
//           height: 44px !important;
//           min-height: 44px !important;
//           padding: 10px 14px !important;
//           line-height: 1.4 !important;
//           font-size: 14px !important;
//           border-radius: 10px !important;
//           box-sizing: border-box;
//         }
//         .bs-tag-add {
//           flex: 0 0 auto;
//           height: 44px;
//           min-height: 44px;
//           padding: 0 18px;
//           border: none;
//           border-radius: 10px;
//           background: #16a34a;
//           color: #fff;
//           font-weight: 600;
//           font-size: 13px;
//           line-height: 1;
//           cursor: pointer;
//           white-space: nowrap;
//           transition: background .15s ease;
//         }
//         .bs-tag-add:hover { background: #15803d; }
//         .bs-tag-chips {
//           margin-top: 8px;
//           display: flex;
//           flex-wrap: wrap;
//           gap: 6px;
//         }
//         .bs-tag-chip {
//           display: inline-flex;
//           align-items: center;
//           gap: 6px;
//           padding: 6px 10px;
//           border-radius: 999px;
//           font-size: 12px;
//           font-weight: 600;
//           color: #fff;
//           line-height: 1.2;
//         }
//         .bs-tag-chip button {
//           margin: 0;
//           padding: 0;
//           border: none;
//           background: none;
//           color: #fff;
//           cursor: pointer;
//           font-size: 14px;
//           line-height: 1;
//           opacity: 0.9;
//         }
//         .bs-tag-chip button:hover { opacity: 1; }

//         .bs-btn {
//           display:inline-flex; align-items:center; gap:7px;
//           border:1.5px solid #16a34a; border-radius:9px;
//           background:transparent; color:#16a34a;
//           padding:8px 16px; font-size:13px; font-weight:600;
//           line-height:1; white-space:nowrap; cursor:pointer;
//           transition:all .2s ease;
//         }
//         .bs-btn:hover:not(:disabled) { background:#16a34a; color:#fff; }
//         .bs-btn:disabled { opacity:.6; cursor:not-allowed; }
//         .bs-btn-sm { padding:5px 11px; font-size:12px; }

//         .bs-no-results { text-align:center; padding:40px 20px; color:#64748b; }

//         .bs-pager {
//           display: flex;
//           flex-wrap: wrap;
//           align-items: center;
//           justify-content: space-between;
//           gap: 12px;
//           padding: 14px 16px;
//           border-top: 1px solid #e2e8f0;
//           background: #f8fafc;
//         }
//         .bs-pager-meta {
//           font-size: 13px;
//           color: #475569;
//         }
//         .bs-pager-actions {
//           display: flex;
//           align-items: center;
//           gap: 8px;
//           flex-wrap: wrap;
//         }
//         .bs-pager-size {
//           display: inline-flex;
//           align-items: center;
//           gap: 6px;
//           font-size: 13px;
//           color: #475569;
//         }
//         .bs-pager-size select {
//           height: 34px;
//           border: 1px solid #dbe5f1;
//           border-radius: 8px;
//           padding: 0 8px;
//           background: #fff;
//           color: #0f172a;
//         }
//         .bs-pager-btn {
//           display: inline-flex;
//           align-items: center;
//           gap: 6px;
//           height: 34px;
//           padding: 0 14px;
//           border: 1.5px solid #16a34a;
//           border-radius: 8px;
//           background: #fff;
//           color: #16a34a;
//           font-size: 13px;
//           font-weight: 600;
//           cursor: pointer;
//         }
//         .bs-pager-btn:hover:not(:disabled) {
//           background: #16a34a;
//           color: #fff;
//         }
//         .bs-pager-btn:disabled {
//           opacity: 0.45;
//           cursor: not-allowed;
//         }
//         .bs-pager-page {
//           font-size: 13px;
//           font-weight: 600;
//           color: #1f3b5b;
//           min-width: 90px;
//           text-align: center;
//         }

//         .bs-row-2col {
//           display: grid;
//           grid-template-columns: 1fr 1fr;
//           gap: 16px;
//           width: 100%;
//           max-width: 100%;
//         }
//         .bs-row-2col > .form-group {
//           min-width: 0;
//           width: 100%;
//           max-width: 100%;
//           margin-bottom: 0;
//         }

//         .bs-select {
//           position: relative;
//           width: 100%;
//           max-width: 100%;
//           min-width: 0;
//         }
//         .bs-select-trigger {
//           display: flex !important;
//           align-items: center;
//           justify-content: space-between;
//           gap: 8px;
//           width: 100%;
//           max-width: 100%;
//           min-width: 0;
//           box-sizing: border-box;
//           text-align: left;
//           cursor: pointer;
//           background: #fff;
//           min-height: 38px;
//           padding: 8px 12px;
//           line-height: 1.3;
//         }
//         .bs-select-label,
//         .bs-select-placeholder {
//           flex: 1;
//           min-width: 0;
//           overflow: hidden;
//           text-overflow: ellipsis;
//           white-space: nowrap;
//         }
//         .bs-select-placeholder { color: #94a3b8; }
//         .bs-select-caret {
//           flex-shrink: 0;
//           font-size: 11px;
//           color: #64748b;
//           line-height: 1;
//         }
//         .bs-select.is-disabled .bs-select-trigger {
//           opacity: 0.65;
//           cursor: not-allowed;
//           background: #f1f5f9;
//         }
//         .bs-select-menu {
//           position: absolute;
//           top: calc(100% + 4px);
//           left: 0;
//           right: 0;
//           width: 100%;
//           max-width: 100%;
//           max-height: min(240px, 45vh);
//           overflow-x: hidden;
//           overflow-y: auto;
//           margin: 0;
//           padding: 4px 0;
//           list-style: none;
//           background: #fff;
//           border: 1px solid #dbe5f1;
//           border-radius: 10px;
//           box-shadow: 0 10px 28px rgba(15, 23, 42, 0.14);
//           z-index: 40;
//           box-sizing: border-box;
//           -webkit-overflow-scrolling: touch;
//         }
//         .bs-select-menu li {
//           padding: 10px 12px;
//           font-size: 13px;
//           color: #0f172a;
//           cursor: pointer;
//           white-space: normal;
//           overflow-wrap: anywhere;
//           word-break: break-word;
//           line-height: 1.35;
//         }
//         .bs-select-menu li:hover { background: #f1f5f9; }
//         .bs-select-menu li.is-active {
//           background: #16a34a;
//           color: #fff;
//         }

//         @media (max-width: 991px) {
//           .bs-row-2col {
//             grid-template-columns: 1fr;
//             gap: 12px;
//           }
//         }
//         @media (max-width: 576px) {
//           .bs-section {
//             padding: 12px;
//           }
//           .bs-row-2col {
//             grid-template-columns: 1fr;
//             gap: 10px;
//           }
//           .bs-select-menu {
//             max-height: min(200px, 40vh);
//           }
//         }
//       `}</style>

//       <section className="padd-top-80 padd-bot-80">
//         <div className="container">

//           {message.text && (
//             <div className={`alert ${alertClass}`} style={{ marginBottom:20 }}>
//               {message.text}
//             </div>
//           )}

//           <div className="row">
//             <div className="col-md-3 employer-dashboard-sidebar">
//               <EmployerSidebar active="boolean-search" />
//             </div>

//             <div className="col-md-9 employer-dashboard-main">

//               {isPremium && savedSearches.length > 0 && (
//                 <div className="row" style={{ marginBottom: 20 }}>
//                   <div className="col-md-6">
//                     <div className="card bs-futuristic-card">
//                       <div className="card-header"><h4>Saved Searches</h4></div>
//                       <div className="card-body">
//                         {savedSearches.map(s => (
//                           <div key={s.id} className="bs-saved-row">
//                             <strong style={{ fontSize:14 }}>{s.search_name}</strong>
//                             <button className="bs-btn bs-btn-sm" onClick={() => loadSavedSearch(s)}>
//                               Load
//                             </button>
//                           </div>
//                         ))}
//                       </div>
//                     </div>
//                   </div>
//                 </div>
//               )}

//               <div className="card bs-search-card" style={{ marginBottom: 24 }}>
//                 <div className="card-header">
//                   <h4><i className="ti-search" style={{ marginRight:8, color:"#16a34a" }} />Search Candidates</h4>
//                 </div>
//                 <div className="card-body">
//                   <form onSubmit={handleSearch}>

//                     {/* generic keyword box */}
//                     <div className="form-group">
//                       <label><i className="ti-key" style={{ color:"#16a34a" }} />Search Keywords</label>
//                       <input
//                         type="text"
//                         className="form-control"
//                         placeholder="e.g. developer python (matches name, resume text, email)"
//                         value={searchQuery}
//                         onChange={e => setSearchQuery(e.target.value)}
//                       />
//                       <small className="form-text text-muted">
//                         Free-text search across name, resume, and email. Unlimited for all users.
//                         Supports operators — e.g. <code>react AND node NOT php</code>.
//                       </small>
//                     </div>

//                     {/* designation + category/subcategory */}
//                     <div className="bs-section">
//                       <h5>Role &amp; Category</h5>
//                       <div className="form-group">
//                         <label><i className="ti-id-badge" style={{ color:"#16a34a" }} />Designation / Job Role</label>
//                         <input
//                           type="text"
//                           className="form-control"
//                           placeholder="e.g. Java Developer, HR Manager"
//                           value={filters.designation}
//                           onChange={e => setFilters(p => ({ ...p, designation: e.target.value }))}
//                         />
//                         <small className="form-text text-muted">
//                           Matches the candidate's preferred job role specifically — more precise than the keyword box above.
//                         </small>
//                       </div>

//                       <div className="bs-row-2col">
//                         <div className="form-group">
//                           <label><i className="ti-layout-grid2" style={{ color:"#16a34a" }} />Category</label>
//                           <BsSelect
//                             value={filters.categoryId}
//                             disabled={categoriesLoading}
//                             placeholder={categoriesLoading ? "Loading categories..." : "All Categories"}
//                             options={[
//                               { value: "", label: categoriesLoading ? "Loading categories..." : "All Categories" },
//                               ...categories.map((c) => ({ value: String(c.id), label: c.name })),
//                             ]}
//                             onChange={(val) => setFilters((p) => ({
//                               ...p,
//                               categoryId: val,
//                               subcategoryId: "",
//                             }))}
//                           />
//                         </div>
//                         <div className="form-group">
//                           <label><i className="ti-layout-list-thumb" style={{ color:"#16a34a" }} />Subcategory</label>
//                           <BsSelect
//                             value={filters.subcategoryId}
//                             disabled={!filters.categoryId || subcategoriesLoading}
//                             placeholder={
//                               !filters.categoryId
//                                 ? "Select a category first"
//                                 : subcategoriesLoading
//                                   ? "Loading subcategories..."
//                                   : "All Subcategories"
//                             }
//                             options={[
//                               {
//                                 value: "",
//                                 label: !filters.categoryId
//                                   ? "Select a category first"
//                                   : subcategoriesLoading
//                                     ? "Loading subcategories..."
//                                     : "All Subcategories",
//                               },
//                               ...subcategories.map((sc) => ({ value: String(sc.id), label: sc.name })),
//                             ]}
//                             onChange={(val) => setFilters((p) => ({ ...p, subcategoryId: val }))}
//                           />
//                         </div>
//                       </div>
//                     </div>

//                     {/* skills */}
//                     <div className="bs-section">
//                       <h5>Skills</h5>
//                       <TagInput
//                         label="Required Skills"
//                         color="#0ea5e9"
//                         value={skillInput}
//                         onChange={setSkillInput}
//                         onAdd={() => addTag("skills", skillInput, setSkillInput)}
//                         items={filters.skills}
//                         onRemove={(i) => removeTag("skills", i)}
//                         placeholder="e.g. React, Node.js — press Enter to add"
//                       />
//                       <small className="form-text text-muted">
//                         Candidate must have every listed skill (matched against their skills list).
//                       </small>
//                     </div>

//                     {/* pro toggle */}
//                     <div className="form-group">
//                       <label style={{ cursor: canUsePro ? "pointer" : "not-allowed" }}>
//                         <input
//                           type="checkbox"
//                           checked={useProFeatures}
//                           onChange={e => setUseProFeatures(e.target.checked)}
//                           disabled={!canUsePro}
//                           style={{ marginRight: 6 }}
//                         />
//                         Use Pro Features&nbsp;
//                         <span style={{ fontSize:12, color:"#64748b", fontWeight:400 }}>
//                           (Boolean AND/NOT operators, gender filter)
//                         </span>
//                       </label>
//                       {!canUsePro && (
//                         <small className="form-text text-danger" style={{ display:"block", marginTop:4 }}>
//                           {isPremium
//                             ? "Pro feature available with your premium plan."
//                             : "You have used your free trial. Upgrade to premium for unlimited access."}
//                         </small>
//                       )}
//                       {!isPremium && canUsePro && !searchStatus?.hasUsedProTrial && (
//                         <small className="form-text text-success" style={{ display:"block", marginTop:4 }}>
//                           ✓ You have 1 free pro trial available.
//                         </small>
//                       )}
//                     </div>

//                     {/* pro section */}
//                     {useProFeatures && canUsePro && (
//                       <div className="bs-pro-section">
//                         <h5>Boolean Operators</h5>

//                         <TagInput
//                           label="Must Have (AND)"
//                           color="#16a34a"
//                           value={mustHaveInput}
//                           onChange={setMustHaveInput}
//                           onAdd={() => addTag("mustHave", mustHaveInput, setMustHaveInput)}
//                           items={filters.mustHave}
//                           onRemove={(i) => removeTag("mustHave", i)}
//                           placeholder="Enter term and press Add"
//                         />

//                         <TagInput
//                           label="Must Not Have (NOT)"
//                           color="#dc2626"
//                           value={mustNotHaveInput}
//                           onChange={setMustNotHaveInput}
//                           onAdd={() => addTag("mustNotHave", mustNotHaveInput, setMustNotHaveInput)}
//                           items={filters.mustNotHave}
//                           onRemove={(i) => removeTag("mustNotHave", i)}
//                           placeholder="Enter term and press Add"
//                         />

//                         <div className="form-group" style={{ marginTop:12 }}>
//                           <label><i className="ti-user" style={{ color:"#16a34a" }} />Gender</label>
//                           <select
//                             className="form-control"
//                             value={filters.gender}
//                             onChange={e => setFilters(p => ({ ...p, gender: e.target.value }))}
//                           >
//                             <option value="">All</option>
//                             <option value="male">Male</option>
//                             <option value="female">Female</option>
//                           </select>
//                           <small className="form-text text-muted">
//                             Use only where gender is a genuine, documented requirement for the role — check applicable equal-opportunity employment rules before relying on this filter.
//                           </small>
//                         </div>
//                       </div>
//                     )}

//                     {/* location */}
//                     <div className="bs-section">
//                       <h5>Location</h5>
//                       <TagInput
//                         label="Cities"
//                         color="#8b5cf6"
//                         value={locationInput}
//                         onChange={setLocationInput}
//                         onAdd={() => addTag("locations", locationInput, setLocationInput)}
//                         items={filters.locations}
//                         onRemove={(i) => removeTag("locations", i)}
//                         placeholder="e.g. Bangalore — press Enter to add another city"
//                       />
//                       <small className="form-text text-muted">
//                         Add multiple cities to match candidates in any of them.
//                       </small>
//                     </div>

//                     {/* action row */}
//                     <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", flexWrap:"wrap", gap:10, marginTop:20 }}>
//                       <div>
//                         {isPremium && (
//                           <button type="button" className="bs-btn" onClick={handleSaveSearch}>
//                             <i className="ti-save" />Save Search
//                           </button>
//                         )}
//                       </div>
//                       <button type="submit" className="bs-btn" disabled={loading}>
//                         <i className="ti-search" />
//                         {loading ? "Searching…" : "Search Candidates"}
//                       </button>
//                     </div>
//                   </form>
//                 </div>
//               </div>

//               {/* results */}
//               {candidates.length > 0 ? (
//                 <div className="card bs-futuristic-card">
//                   <div className="card-header" style={{ display:"flex", alignItems:"center", justifyContent:"space-between", gap:12, flexWrap:"wrap" }}>
//                     <h4 style={{ margin:0 }}>
//                       Search Results{" "}
//                       <span style={{ color:"#64748b", fontWeight:500, fontSize:14 }}>
//                         ({totalMatching} total)
//                       </span>
//                     </h4>
//                     <label className="bs-pager-size" style={{ margin:0 }}>
//                       Per page
//                       <select value={pageSize} onChange={handlePageSizeChange} disabled={loading}>
//                         <option value={25}>25</option>
//                         <option value={50}>50</option>
//                         <option value={100}>100</option>
//                         <option value={200}>200</option>
//                       </select>
//                     </label>
//                   </div>
//                   <div className="card-body" style={{ padding:0 }}>
//                     <div className="table-responsive">
//                       <table className="table table-striped bs-results-table" style={{ marginBottom:0 }}>
//                         <thead>
//                           <tr>
//                             <th>#</th>
//                             <th>Name</th>
//                             <th>Email</th>
//                             <th>Phone</th>
//                             <th>Skills</th>
//                             <th>Experience</th>
//                             <th>Job Applied</th>
//                             <th>Actions</th>
//                           </tr>
//                         </thead>
//                         <tbody>
//                           {candidates.map((c, idx) => {
//                             const name = c.full_name ||
//                               `${c.first_name || ""} ${c.last_name || ""}`.trim() ||
//                               "—";
//                             const skillsList = Array.isArray(c.skills)
//                               ? c.skills
//                               : typeof c.skills === "string" && c.skills.trim()
//                                 ? (() => {
//                                     try {
//                                       const parsed = JSON.parse(c.skills);
//                                       return Array.isArray(parsed) ? parsed : c.skills.split(",").map((s) => s.trim());
//                                     } catch {
//                                       return c.skills.split(",").map((s) => s.trim());
//                                     }
//                                   })()
//                                 : [];
//                             const experienceList = Array.isArray(c.experience) ? c.experience : [];
//                             const rowNum = (page - 1) * pageSize + idx + 1;
//                             const hasNameSpace = /\s/.test(name);
//                             return (
//                               <tr key={c.candidate_id || idx}>
//                                 <td style={{ color:"#94a3b8", fontSize:13 }}>{rowNum}</td>
//                                 <td className="bs-name-cell">
//                                   <strong
//                                     className={`bs-name-text ${hasNameSpace ? "is-wrap" : "is-ellipsis"}`}
//                                     title={hasNameSpace ? undefined : name}
//                                   >
//                                     {name}
//                                   </strong>
//                                 </td>
//                                 <td style={{ fontSize:13 }}>{c.email || "—"}</td>
//                                 <td style={{ fontSize:13 }}>{c.phone || "—"}</td>
//                                 <td style={{ fontSize:12, maxWidth: 180 }}>
//                                   {skillsList.length > 0
//                                     ? skillsList.slice(0, 4).join(", ") + (skillsList.length > 4 ? "…" : "")
//                                     : "—"}
//                                 </td>
//                                 <td style={{ fontSize:12, maxWidth: 160 }}>
//                                   {experienceList.length > 0 ? experienceList.join(", ") : "—"}
//                                 </td>
//                                 <td style={{ fontSize:13 }}>{c.job_title || "—"}</td>
//                                 <td>
//                                   {c.resume_url && (
//                                     <a
//                                       href={`${API_BASE_URL}${c.resume_url}`}
//                                       target="_blank"
//                                       rel="noopener noreferrer"
//                                       className="btn btn-sm btn-outline-primary"
//                                       style={{ fontSize:12, borderRadius:7 }}
//                                     >
//                                       View Resume
//                                     </a>
//                                   )}
//                                 </td>
//                               </tr>
//                             );
//                           })}
//                         </tbody>
//                       </table>
//                     </div>

//                     <div className="bs-pager">
//                       <div className="bs-pager-meta">
//                         Showing{" "}
//                         <strong>
//                           {totalMatching === 0 ? 0 : (page - 1) * pageSize + 1}
//                           –
//                           {(page - 1) * pageSize + candidates.length}
//                         </strong>{" "}
//                         of <strong>{totalMatching}</strong> candidates
//                       </div>
//                       <div className="bs-pager-actions">
//                         <button
//                           type="button"
//                           className="bs-pager-btn"
//                           disabled={loading || !hasPrev}
//                           onClick={() => goToPage(page - 1)}
//                         >
//                           ← Previous
//                         </button>
//                         <span className="bs-pager-page">
//                           Page {page} of {Math.max(totalPages, 1)}
//                         </span>
//                         <button
//                           type="button"
//                           className="bs-pager-btn"
//                           disabled={loading || !hasNext}
//                           onClick={() => goToPage(page + 1)}
//                         >
//                           Next →
//                         </button>
//                       </div>
//                     </div>
//                   </div>
//                 </div>
//               ) : (
//                 !loading && (
//                   <div className="bs-no-results">
//                     <i className="ti-search" style={{ fontSize:32, marginBottom:10, display:"block" }} />
//                     <p>
//                       {hasSearched
//                         ? "No candidates matched your search."
//                         : <>Enter keywords or filters above and click <strong>Search Candidates</strong> to get started.</>}
//                     </p>
//                   </div>
//                 )
//               )}

//             </div>{/* /main */}
//           </div>{/* /row */}
//         </div>{/* /container */}
//       </section>

//       <Footer />
//     </>
//   );
// }

// export default BooleanSearch;
import React, { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import Header from "../Components/Header";
import Footer from "../Components/Footer";
import EmployerSidebar from "./Sidebar";
import { API_BASE_URL } from "../config/api";
import useJobCategories from "../hooks/useJobCategories";

// ─── small helper ──────────────────────────────────────────────────────────────
const authHeaders = (token) => ({
  Authorization: `Bearer ${token}`,
  "Content-Type": "application/json",
  Accept: "application/json",
});

/** Tag field for skills / locations / mustHave / mustNotHave — defined outside so focus is kept. */
function TagInput({ label, color, value, onChange, onAdd, items, onRemove, placeholder }) {
  return (
    <div className="bs-tag-field form-group">
      <label className="bs-tag-label" style={{ color }}>{label}</label>
      <div className="bs-tag-row">
        <input
          type="text"
          className="form-control bs-tag-input"
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              onAdd();
            }
          }}
        />
        <button type="button" className="bs-tag-add" onClick={onAdd}>
          Add
        </button>
      </div>
      {items.length > 0 && (
        <div className="bs-tag-chips">
          {items.map((term, i) => (
            <span
              key={`${String(term)}-${i}`}
              className="bs-tag-chip"
              style={{ backgroundColor: color }}
            >
              {term}
              <button type="button" onClick={() => onRemove(i)} aria-label={`Remove ${term}`}>
                ×
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

const MONTH_SHORT = ["", "Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

const formatSkillItem = (item) => {
  if (item == null) return "";
  if (typeof item === "string") return item.trim();
  if (typeof item === "object") return String(item.title || item.name || item.value || item.skill || "").trim();
  return String(item).trim();
};

const parseSkillsList = (skills) => {
  if (Array.isArray(skills)) return skills.map(formatSkillItem).filter(Boolean);
  if (typeof skills === "string" && skills.trim()) {
    try {
      const parsed = JSON.parse(skills);
      if (Array.isArray(parsed)) return parsed.map(formatSkillItem).filter(Boolean);
    } catch { /* fall through */ }
    return skills.split(",").map((s) => s.trim()).filter(Boolean);
  }
  return [];
};

const parseExperienceList = (val) => {
  if (val == null || val === "") return [];
  let arr = val;
  if (typeof val === "string") {
    try {
      arr = JSON.parse(val);
    } catch {
      return val.split(",").map((s) => s.trim()).filter(Boolean).map((jobTitle, i) => ({
        id: `exp_str_${i}`,
        jobTitle,
        company: "",
        employmentType: "",
        currentlyWorking: false,
        startMonth: "",
        startYear: "",
        endMonth: "",
        endYear: "",
        location: "",
        locationType: "",
        description: "",
      }));
    }
  }
  if (!Array.isArray(arr)) return [];
  return arr
    .map((item, index) => {
      if (item && typeof item === "object") {
        return {
          id: item.id || `exp_${index}`,
          jobTitle: item.jobTitle || item.role || "",
          company: item.company || "",
          employmentType: item.employmentType || "",
          currentlyWorking: Boolean(item.currentlyWorking),
          startMonth: item.startMonth || "",
          startYear: String(item.startYear || ""),
          endMonth: item.endMonth || "",
          endYear: String(item.endYear || ""),
          location: item.location || "",
          locationType: item.locationType || "",
          description: item.description || item.responsibilities || "",
        };
      }
      if (typeof item === "string" && item.trim()) {
        return {
          id: `exp_legacy_${index}`,
          jobTitle: item.trim(),
          company: "",
          employmentType: "",
          currentlyWorking: false,
          startMonth: "",
          startYear: "",
          endMonth: "",
          endYear: "",
          location: "",
          locationType: "",
          description: "",
        };
      }
      return null;
    })
    .filter(Boolean);
};

const formatShortMonthYear = (month, year) => {
  const y = String(year || "").trim();
  if (!y) return "";
  const m = parseInt(month, 10);
  if (m >= 1 && m <= 12) return `${MONTH_SHORT[m]} ${y}`;
  return y;
};

const formatExpDuration = (entry) => {
  const startYear = parseInt(entry.startYear, 10);
  const startMonth = parseInt(entry.startMonth, 10) || 1;
  if (!startYear) return "";
  let endYear;
  let endMonth;
  if (entry.currentlyWorking) {
    const now = new Date();
    endYear = now.getFullYear();
    endMonth = now.getMonth() + 1;
  } else {
    endYear = parseInt(entry.endYear, 10);
    endMonth = parseInt(entry.endMonth, 10) || 12;
    if (!endYear) return "";
  }
  const totalMonths = Math.max(1, (endYear - startYear) * 12 + (endMonth - startMonth) + 1);
  if (totalMonths < 12) return `${totalMonths} mos`;
  const years = Math.floor(totalMonths / 12);
  const rem = totalMonths % 12;
  if (rem === 0) return years === 1 ? "1 yr" : `${years} yrs`;
  return `${years} yr${years > 1 ? "s" : ""} ${rem} mos`;
};

const formatExperienceDateRange = (entry) => {
  const start = formatShortMonthYear(entry.startMonth, entry.startYear);
  const end = entry.currentlyWorking
    ? "Present"
    : formatShortMonthYear(entry.endMonth, entry.endYear);
  if (!start && !end) return "";
  let text = start && end ? `${start} - ${end}` : (start || end);
  const duration = formatExpDuration(entry);
  if (duration) text += ` · ${duration}`;
  return text;
};

const getNameInitials = (name) => {
  const parts = String(name || "").trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
};

const humanizeEmploymentType = (val) => {
  const s = String(val || "").trim();
  if (!s) return "";
  return s.replace(/[-_]+/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
};

const getMatchTier = (score) => {
  if (score >= 40) return { label: "High match", color: "#147865", bg: "#E3F3EE" };
  if (score >= 15) return { label: "Medium match", color: "#A9720E", bg: "#FBEEDA" };
  if (score > 0) return { label: "Low match", color: "#B23A2E", bg: "#FCE9E7" };
  return { label: "No match", color: "#69727D", bg: "#EDEEE9" };
};

const collectSearchMatchTerms = (searchQuery, skillsFilter) => {
  const terms = new Set();
  if (Array.isArray(skillsFilter)) {
    skillsFilter.forEach((s) => {
      const t = String(s || "").trim().toLowerCase();
      if (t) terms.add(t);
    });
  }
  String(searchQuery || "")
    .trim()
    .replace(/,+/g, " ")
    .split(/\s+/)
    .forEach((tok) => {
      const upper = tok.toUpperCase();
      if (upper === "NOT" || upper === "AND" || upper === "OR" || upper === "-") return;
      const term = tok.replace(/^[-+]/, "").replace(/^["']|["']$/g, "").toLowerCase();
      if (term) terms.add(term);
    });
  return terms;
};

const isSkillMatched = (skill, matchTerms) => {
  const s = String(skill || "").toLowerCase();
  if (!s || !matchTerms || matchTerms.size === 0) return false;
  for (const term of matchTerms) {
    if (s.includes(term) || term.includes(s)) return true;
  }
  return false;
};

const pickPrimaryExperience = (list) => {
  if (!Array.isArray(list) || list.length === 0) return null;
  const sorted = [...list].sort((a, b) => {
    const ay = parseInt(a.startYear, 10) || 0;
    const by = parseInt(b.startYear, 10) || 0;
    if (by !== ay) return by - ay;
    return (parseInt(b.startMonth, 10) || 0) - (parseInt(a.startMonth, 10) || 0);
  });
  return sorted[0];
};



/** Mobile-safe select: menu stays within the field width (native <select> cannot). */
function BsSelect({ value, onChange, options, placeholder, disabled = false }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const close = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", close);
    document.addEventListener("touchstart", close);
    return () => {
      document.removeEventListener("mousedown", close);
      document.removeEventListener("touchstart", close);
    };
  }, []);

  useEffect(() => {
    if (disabled) setOpen(false);
  }, [disabled]);

  const selected = options.find((o) => String(o.value) === String(value));

  return (
    <div className={`bs-select${disabled ? " is-disabled" : ""}`} ref={ref}>
      <button
        type="button"
        className="bs-select-trigger form-control"
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => !disabled && setOpen((o) => !o)}
      >
        <span className={selected ? "bs-select-label" : "bs-select-placeholder"}>
          {selected ? selected.label : placeholder}
        </span>
        <span className="bs-select-caret" aria-hidden="true">{open ? "▴" : "▾"}</span>
      </button>
      {open && !disabled && (
        <ul className="bs-select-menu" role="listbox">
          {options.map((o) => {
            const active = String(o.value) === String(value);
            return (
              <li
                key={o.value === "" ? "__empty" : String(o.value)}
                role="option"
                aria-selected={active}
                className={active ? "is-active" : ""}
                onClick={() => {
                  onChange(o.value);
                  setOpen(false);
                }}
              >
                {o.label}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

function BooleanSearch() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ text: "", type: "" });
  const [searchStatus, setSearchStatus] = useState(null);
  const [candidates, setCandidates] = useState([]);
  const [savedSearches, setSavedSearches] = useState([]);

  // Server-side pagination
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [totalMatching, setTotalMatching] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [hasNext, setHasNext] = useState(false);
  const [hasPrev, setHasPrev] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  // Search form state
  const [searchQuery, setSearchQuery]   = useState("");
  const [useProFeatures] = useState(true); // always on — "pro" gate removed per UX change
  const [filters, setFilters] = useState({
    designation: "",
    skills: [],
    categoryId: "",
    subcategoryId: "",
    locations: [],
    gender: "",
    mustHave: [],
    mustNotHave: [],
  });

  // Advanced panel toggle
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [expandedExpKeys, setExpandedExpKeys] = useState({});

  // Same category/subcategory loader used on Candidate Profile
  const {
    categories,
    subcategories,
    loading: categoriesLoading,
    subcategoriesLoading,
  } = useJobCategories(filters.categoryId || null);

  // tag-style inputs
  const [skillInput, setSkillInput] = useState("");
  const [locationInput, setLocationInput] = useState("");
  const [mustNotHaveInput, setMustNotHaveInput] = useState("");

  // ── flash message helper ────────────────────────────────────────────────────
  const flash = useCallback((text, type = "danger", ms = 5000) => {
    setMessage({ text, type });
    setTimeout(() => setMessage({ text: "", type: "" }), ms);
  }, []);

  // ── data loaders ───────────────────────────────────────────────────────────
  const loadSearchStatus = useCallback(async () => {
    const token = localStorage.getItem("token");
    if (!token) return;
    try {
      const res = await fetch(
        `${API_BASE_URL}/api/search/boolean-search/status`,
        { headers: authHeaders(token), credentials: "include" }
      );
      if (res.ok) setSearchStatus(await res.json());
    } catch (err) {
      console.error("Error loading search status:", err);
    }
  }, []);

  const loadSavedSearches = useCallback(async () => {
    const token = localStorage.getItem("token");
    if (!token) return;
    try {
      const res = await fetch(
        `${API_BASE_URL}/api/search/boolean-search/saved`,
        { headers: authHeaders(token), credentials: "include" }
      );
      if (res.ok) {
        const data = await res.json();
        setSavedSearches(data.savedSearches || []);
      }
    } catch (_) {
      // non-premium users will get 403 — ignore silently
    }
  }, []);

  useEffect(() => {
    if (!user) { navigate("/"); return; }
    if (user.role !== "provider") { navigate("/"); return; }
    loadSearchStatus();
    loadSavedSearches();
  }, [user, navigate, loadSearchStatus, loadSavedSearches]);

  // ── search ─────────────────────────────────────────────────────────────────
  const runSearch = async (pageToLoad = 1, limitOverride = null) => {
    const limit = limitOverride != null ? limitOverride : pageSize;
    const hasAnyCriteria =
      searchQuery.trim() ||
      filters.designation.trim() ||
      filters.skills.length > 0 ||
      filters.categoryId ||
      filters.subcategoryId ||
      filters.locations.length > 0 ||
      filters.mustNotHave.length > 0 ||
      filters.gender;

    if (!hasAnyCriteria) {
      flash("Please enter at least one keyword or filter.");
      return;
    }

    setLoading(true);
    setMessage({ text: "", type: "" });
    if (pageToLoad === 1) setCandidates([]);

    const token = localStorage.getItem("token");
    if (!token) { flash("Please login again."); setLoading(false); return; }

    try {
      const res = await fetch(`${API_BASE_URL}/api/search/boolean-search`, {
        method: "POST",
        headers: authHeaders(token),
        body: JSON.stringify({
          searchQuery,
          filters,
          useProFeatures,
          page: pageToLoad,
          limit,
        }),
        credentials: "include",
      });

      const data = await res.json();

      if (res.ok) {
        const results = data.candidates || [];
        setCandidates(results);
        setPage(data.page || pageToLoad);
        setPageSize(data.limit || limit);
        setTotalMatching(data.totalMatching ?? results.length);
        setTotalPages(data.totalPages ?? 0);
        setHasNext(!!data.hasNext);
        setHasPrev(!!data.hasPrev);
        setHasSearched(true);
        if (data.usedProTrial && !data.isPremium && pageToLoad === 1) {
          flash(
            "You have used your free pro feature trial. Upgrade to premium for unlimited access.",
            "warning",
            6000
          );
        }
        if (pageToLoad === 1) await loadSearchStatus();
      } else {
        if (data.upgradeRequired) {
          flash(data.message || "Please upgrade to premium to use this feature.", "warning");
          setTimeout(() => navigate("/employer/premium"), 2500);
        } else {
          flash(data.message || "Search failed. Please try again.");
        }
      }
    } catch (err) {
      console.error("Search error:", err);
      flash("Search failed. Please check your connection and try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async (e) => {
    e.preventDefault();
    setPage(1);
    await runSearch(1);
  };

  const goToPage = async (nextPage) => {
    if (loading) return;
    if (nextPage < 1 || (totalPages > 0 && nextPage > totalPages)) return;
    await runSearch(nextPage);
  };

  const handlePageSizeChange = async (e) => {
    const nextSize = Number(e.target.value) || 20;
    setPageSize(nextSize);
    setPage(1);
    if (hasSearched) await runSearch(1, nextSize);
  };

  // ── save search ────────────────────────────────────────────────────────────
  const handleSaveSearch = async () => {
    if (!searchQuery.trim() && filters.skills.length === 0 && !filters.designation.trim()) {
      flash("Please enter a search query or filter first.", "warning");
      return;
    }
    const searchName = prompt("Enter a name for this search:");
    if (!searchName || !searchName.trim()) return;

    const token = localStorage.getItem("token");
    if (!token) return;

    try {
      const res = await fetch(`${API_BASE_URL}/api/search/boolean-search/save`, {
        method: "POST",
        headers: authHeaders(token),
        body: JSON.stringify({ searchName: searchName.trim(), searchQuery, searchFilters: filters }),
        credentials: "include",
      });
      const data = await res.json();
      if (res.ok) {
        flash("Search saved successfully!", "success", 3000);
        await loadSavedSearches();
      } else {
        if (data.upgradeRequired) {
          flash("This feature requires premium membership.", "warning");
          setTimeout(() => navigate("/employer/premium"), 2000);
        } else {
          flash(data.message || "Failed to save search.");
        }
      }
    } catch (err) {
      console.error("Save search error:", err);
      flash("Failed to save search.");
    }
  };

  // ── load saved search ──────────────────────────────────────────────────────
  const loadSavedSearch = (savedSearch) => {
    setSearchQuery(savedSearch.search_query || "");
    if (savedSearch.search_filters && typeof savedSearch.search_filters === "object") {
      const f = savedSearch.search_filters;
      setFilters({
        designation: f.designation || "",
        skills: f.skills || [],
        categoryId: f.categoryId || "",
        subcategoryId: f.subcategoryId || "",
        locations: f.locations || [],
        gender: f.gender || "",
        mustHave: f.mustHave || [],
        mustNotHave: f.mustNotHave || [],
      });
    }
    // useProFeatures is always true now (pro gate removed)
  };

  // ── generic tag-list helpers (skills / locations / mustHave / mustNotHave) ──
  const addTag = (field, value, setInput) => {
    const val = value.trim();
    if (!val) return;
    setFilters((p) => ({ ...p, [field]: [...p[field], val] }));
    setInput("");
  };
  const removeTag = (field, index) =>
    setFilters((p) => ({ ...p, [field]: p[field].filter((_, i) => i !== index) }));

  // ── derived flags ──────────────────────────────────────────────────────────
  const isPremium = searchStatus?.isPremium ?? false;

  // ── guards ─────────────────────────────────────────────────────────────────
  if (authLoading) {
    return (
      <div style={{ display:"flex", justifyContent:"center", alignItems:"center", height:"100vh", backgroundColor:"#f8f9fa" }}>
        <div style={{ textAlign:"center", padding:"40px", backgroundColor:"white", borderRadius:"10px", boxShadow:"0 4px 6px rgba(0,0,0,.1)" }}>
          <div style={{ width:40, height:40, border:"4px solid #f3f3f3", borderTop:"4px solid #007bff", borderRadius:"50%", animation:"spin 1s linear infinite", margin:"0 auto 20px" }} />
          <h3>Loading…</h3>
        </div>
      </div>
    );
  }

  if (!user || user.role !== "provider") {
    return (
      <div className="container" style={{ padding:"50px", textAlign:"center" }}>
        <h2>Please login as an employer to access this feature</h2>
        <button onClick={() => navigate("/")} className="btn btn-primary">Go to Home</button>
      </div>
    );
  }

  const alertClass = { success:"alert-success", warning:"alert-warning", danger:"alert-danger" }[message.type] || "alert-danger";

  return (
    <>
      <Header />

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }

        @media (max-width: 991px) {
          .employer-dashboard-sidebar { display: none !important; }
          .employer-dashboard-main { width:100%!important; max-width:100%!important; float:none!important; }
        }

        .bs-futuristic-card {
          border: 1px solid #e2e8f0;
          border-radius: 12px;
          overflow: hidden;
          box-shadow: 0 8px 24px rgba(15,23,42,.08);
        }
        .bs-search-card {
          border: none !important;
          border-radius: 12px;
          overflow: visible;
          box-shadow: none;
        }
        .bs-search-card .card-body {
          overflow-x: hidden;
          max-width: 100%;
          padding-top: 22px;
        }
        .bs-futuristic-card .card-header {
          background: linear-gradient(90deg,#f8fafc 0%,#eef6ff 100%);
          border-bottom: 1px solid #e2e8f0;
          padding: 14px 18px;
        }
        .bs-search-card .card-header {
          background: linear-gradient(90deg,#f8fafc 0%,#eef6ff 100%);
          border-bottom: none;
          padding: 14px 18px;
        }
        .bs-futuristic-card .card-header h4,
        .bs-search-card .card-header h4 {
          margin: 0; font-size:18px; font-weight:700; color:#0f172a; letter-spacing:.2px;
        }

        .bs-saved-row {
          margin-bottom: 10px; padding: 12px 14px;
          border: 1px solid #e2e8f0; border-radius: 10px;
          display: flex; align-items: center; justify-content: space-between; gap: 10px;
          background: #fff; transition: transform .15s ease, box-shadow .15s ease;
        }
        .bs-saved-row:hover { transform: translateY(-1px); box-shadow: 0 6px 14px rgba(15,23,42,.08); }

        .bs-results-table thead th {
          font-weight:700; font-size:13px; text-transform:uppercase;
          letter-spacing:.4px; color:#334155; background:#f8fafc;
          border-bottom:1px solid #dbe5f1; vertical-align:middle;
        }
        .bs-results-table tbody td { vertical-align:middle; color:#0f172a; border-top:1px solid #eef2f7; }
        .bs-results-table tbody tr:hover { background:#f8fbff; }
        .bs-results-table td.bs-name-cell {
          max-width: 160px;
          width: 160px;
        }
        .bs-results-table .bs-name-text {
          display: block;
          max-width: 100%;
        }
        /* Spaced names: wrap onto the next line inside the cell */
        .bs-results-table .bs-name-text.is-wrap {
          white-space: normal;
          overflow-wrap: break-word;
          word-break: normal;
        }
        /* Single unbroken token: keep one line and truncate with … */
        .bs-results-table .bs-name-text.is-ellipsis {
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        /* ── Candidate result cards (reference-inspired layout) ───────── */
        .bs-result-list {
          display: flex;
          flex-direction: column;
          gap: 12px;
          padding: 16px;
        }
        .bs-cand-card {
          background: #F3F4F0;
          border: 1px solid #E4E6E1;
          border-radius: 16px;
          padding: 16px 20px;
          display: flex;
          flex-direction: column;
          gap: 6px;
          width: 100%;
          box-sizing: border-box;
          color: #1C2530;
          position: relative;
          overflow: hidden;
        }
        .bs-cand-hover-bar {
          position: absolute;
          left: 50%;
          bottom: 14px;
          transform: translateX(-50%) translateY(18px);
          opacity: 0;
          pointer-events: none;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 4px;
          padding: 8px 18px;
          border-radius: 999px;
          border: none;
          background: linear-gradient(135deg, #00F5A0, #00D9F5, #7B61FF);
          box-shadow: 0 6px 18px rgba(0, 0, 0, 0.14);
          transition: transform .22s ease, opacity .22s ease;
          z-index: 5;
          white-space: nowrap;
        }
        .bs-cand-card:hover .bs-cand-hover-bar {
          transform: translateX(-50%) translateY(0);
          opacity: 1;
          pointer-events: auto;
        }
        .bs-cand-hover-btn {
          background: none;
          border: none;
          outline: none;
          box-shadow: none;
          color: #0f172a;
          font-size: 13px;
          font-weight: 700;
          cursor: pointer;
          padding: 2px 10px;
          line-height: 1.4;
          text-decoration: none;
        }
        .bs-cand-hover-btn:hover {
          color: #020617;
          text-decoration: underline;
          background: none;
          border: none;
        }
        .bs-cand-hover-btn:disabled,
        .bs-cand-hover-btn.is-disabled {
          opacity: 0.45;
          cursor: default;
          text-decoration: none;
          pointer-events: none;
        }
        .bs-cand-hover-sep {
          color: rgba(15, 23, 42, 0.55);
          font-size: 13px;
          font-weight: 500;
          user-select: none;
          padding: 0 2px;
        }
        .bs-cand-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 12px;
          flex-wrap: wrap;
        }
        .bs-cand-identity {
          display: flex;
          align-items: flex-start;
          gap: 10px;
          min-width: 0;
          flex: 1 1 220px;
        }
        .bs-cand-avatar {
          width: 44px;
          height: 44px;
          border-radius: 50%;
          flex: none;
          background: linear-gradient(135deg, #1C2530, #3C4A59);
          color: #fff;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 600;
          font-size: 14px;
          letter-spacing: 0.02em;
        }
        .bs-cand-name {
          margin: 0;
          font-weight: 600;
          font-size: 16px;
          line-height: 1.3;
          color: #1C2530;
          word-break: break-word;
        }
        .bs-cand-role {
          margin: 0;
          font-size: 12.5px;
          color: #69727D;
        }
        .bs-cand-contact {
          display: flex;
          flex-direction: column;
          gap: 2px;
          font-size: 12.5px;
          color: #69727D;
          text-align: left;
          margin-top: 4px;
        }
        .bs-cand-contact-row {
          display: flex;
          align-items: center;
          gap: 7px;
          justify-content: flex-start;
          word-break: break-all;
        }
        .bs-cand-contact-row svg {
          flex: none;
          opacity: 0.7;
        }
        .bs-cand-skills-line {
          font-size: 13px;
          color: #69727D;
          line-height: 1.6;
          word-break: break-word;
        }
        .bs-cand-skills-label {
          color: #1C2530;
          font-weight: 700;
          margin-right: 4px;
        }
        .bs-cand-skill-matched {
          background: #FCEEA6;
          color: #6B5300;
          font-weight: 500;
          padding: 1px 6px;
          border-radius: 5px;
        }
        .bs-cand-divider { display: none; }
        .bs-cand-bottom {
          display: flex;
          justify-content: flex-start;
          align-items: stretch;
          gap: 8px;
          flex-wrap: wrap;
        }
        .bs-exp-entry {
          flex: 1 1 100%;
          min-width: 0;
          background: transparent;
          border: none;
          border-radius: 0;
          padding: 0;
        }
        .bs-exp-title {
          margin: 0;
          font-weight: 600;
          font-size: 14px;
          color: #1C2530;
          line-height: 1.3;
        }
        .bs-exp-company {
          margin: 2px 0 0;
          font-size: 13px;
          font-weight: 500;
          color: #1C2530;
        }
        .bs-exp-company span {
          color: #69727D;
          font-weight: 400;
        }
        .bs-exp-meta {
          margin: 2px 0 0;
          font-size: 12px;
          color: #69727D;
          line-height: 1.4;
        }
        .bs-exp-desc {
          margin: 4px 0 0;
          font-size: 12.5px;
          color: #69727D;
          line-height: 1.5;
        }
        .bs-exp-read-more {
          color: #147865;
          font-weight: 600;
          font-size: 12.5px;
          background: none;
          border: none;
          padding: 0;
          margin-left: 4px;
          cursor: pointer;
          white-space: nowrap;
        }
        .bs-exp-read-more:hover { text-decoration: underline; }
        .bs-cand-action {
          display: flex;
          align-items: center;
          gap: 14px;
          flex: none;
          margin-left: auto;
        }
        .bs-cand-match {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 5px;
        }
        .bs-cand-ring {
          width: 46px;
          height: 46px;
          border-radius: 50%;
          flex: none;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .bs-cand-ring-inner {
          width: 35px;
          height: 35px;
          border-radius: 50%;
          background: #fff;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 600;
          font-size: 12px;
        }
        .bs-cand-tier {
          font-size: 10px;
          font-weight: 600;
          padding: 2px 8px;
          border-radius: 20px;
          white-space: nowrap;
        }
        .bs-cand-resume-btn {
          font-size: 12.5px;
          font-weight: 600;
          color: #1C2530;
          background: #fff;
          border: 1px solid #1C2530;
          border-radius: 20px;
          padding: 8px 16px;
          cursor: pointer;
          white-space: nowrap;
          text-decoration: none;
          display: inline-flex;
          align-items: center;
          line-height: 1;
        }
        .bs-cand-resume-btn:hover {
          background: #1C2530;
          color: #fff;
          text-decoration: none;
        }
        .bs-cand-resume-btn.is-disabled {
          opacity: 0.45;
          cursor: default;
          pointer-events: none;
        }

        @media (max-width: 600px) {
          .bs-result-list { padding: 12px; gap: 12px; }
          .bs-cand-card { padding: 16px; border-radius: 14px; }
          .bs-cand-header { flex-direction: row; align-items: flex-start; }
          .bs-cand-action { margin-left: auto; justify-content: flex-end; flex-wrap: wrap; }
          .bs-cand-bottom { flex-direction: column; align-items: stretch; }
        }

        .bs-search-card .form-group > label {
          font-weight:600; color:#1f3b5b; display:inline-flex; align-items:center; gap:6px;
        }
        .bs-search-card .form-control {
          border:1px solid #dbe5f1; border-radius:10px; box-shadow:0 1px 2px rgba(15,23,42,.03);
        }
        .bs-search-card .form-control:focus {
          border-color:#22c55e; box-shadow:0 0 0 3px rgba(34,197,94,.12);
        }

        .bs-section {
          padding: 16px; background: #f8fafc;
          border: 1px solid #e2e8f0; border-radius: 10px; margin-bottom: 16px;
        }
        .bs-section h5 { color:#1f3b5b; font-weight:700; margin-bottom:12px; font-size: 15px; }

        .bs-pro-section {
          padding: 16px; background: #f0fdf4;
          border: 1px solid #bbf7d0; border-radius: 10px; margin-bottom: 16px;
        }
        .bs-pro-section h5 { color:#15803d; font-weight:700; margin-bottom:12px; }

        .bs-tag-field { margin-bottom: 14px; }
        .bs-tag-label {
          font-weight: 600;
          font-size: 13px;
          display: block;
          margin-bottom: 8px;
        }
        .bs-tag-row {
          display: flex;
          align-items: stretch;
          gap: 8px;
          width: 100%;
        }
        .bs-tag-input {
          flex: 1 1 auto;
          min-width: 0;
          height: 44px !important;
          min-height: 44px !important;
          padding: 10px 14px !important;
          line-height: 1.4 !important;
          font-size: 14px !important;
          border-radius: 10px !important;
          box-sizing: border-box;
        }
        .bs-tag-add {
          flex: 0 0 auto;
          height: 44px;
          min-height: 44px;
          padding: 0 18px;
          border: none;
          border-radius: 10px;
          background: #16a34a;
          color: #fff;
          font-weight: 600;
          font-size: 13px;
          line-height: 1;
          cursor: pointer;
          white-space: nowrap;
          transition: background .15s ease;
        }
        .bs-tag-add:hover { background: #15803d; }
        .bs-tag-chips {
          margin-top: 8px;
          display: flex;
          flex-wrap: wrap;
          gap: 6px;
        }
        .bs-tag-chip {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 6px 10px;
          border-radius: 999px;
          font-size: 12px;
          font-weight: 600;
          color: #fff;
          line-height: 1.2;
        }
        .bs-tag-chip button {
          margin: 0;
          padding: 0;
          border: none;
          background: none;
          color: #fff;
          cursor: pointer;
          font-size: 14px;
          line-height: 1;
          opacity: 0.9;
        }
        .bs-tag-chip button:hover { opacity: 1; }

        .bs-btn {
          display:inline-flex; align-items:center; gap:7px;
          border:1.5px solid #16a34a; border-radius:9px;
          background:transparent; color:#16a34a;
          padding:8px 16px; font-size:13px; font-weight:600;
          line-height:1; white-space:nowrap; cursor:pointer;
          transition:all .2s ease;
        }
        .bs-btn:hover:not(:disabled) { background:#16a34a; color:#fff; }
        .bs-btn:disabled { opacity:.6; cursor:not-allowed; }
        .bs-btn-sm { padding:5px 11px; font-size:12px; }

        .bs-no-results { text-align:center; padding:40px 20px; color:#64748b; }

        /* top search bar */
        .bs-topbar {
          display: flex;
          gap: 10px;
          align-items: stretch;
          margin-bottom: 6px;
        }
        .bs-topbar-input {
          flex: 1 1 auto;
          height: 48px !important;
          min-height: 48px !important;
          font-size: 15px !important;
          border-radius: 10px !important;
          padding: 10px 16px !important;
          box-sizing: border-box;
        }
        .bs-topbar-btn {
          flex: 0 0 auto;
          height: 48px;
          padding: 0 22px;
          border: none;
          border-radius: 10px;
          background: linear-gradient(135deg, #16a34a 0%, #15803d 55%, #0f766e 100%);
          color: #fff;
          font-weight: 700;
          font-size: 16px;
          cursor: pointer;
          display: inline-flex;
          align-items: center;
          gap: 7px;
          white-space: nowrap;
          transition: filter .15s ease, opacity .15s ease;
        }
        .bs-topbar-btn:hover:not(:disabled) {
          filter: brightness(1.06);
          color: #fff;
        }
        .bs-topbar-btn:disabled { opacity: 0.6; cursor: not-allowed; }

        /* toolbar: Save Search left, Advanced toggle right */
        .bs-toolbar {
          display: flex;
          align-items: center;
          justify-content: space-between;
          flex-wrap: wrap;
          gap: 10px;
          margin-bottom: 14px;
        }
        .bs-toolbar-left,
        .bs-toolbar-right {
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .bs-toolbar-right {
          margin-left: auto;
        }

        /* advanced toggle button */
        .bs-adv-toggle {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          background: none;
          border: 1.5px solid #dbe5f1;
          border-radius: 8px;
          padding: 7px 14px;
          font-size: 13px;
          font-weight: 600;
          color: #1f3b5b;
          cursor: pointer;
          transition: border-color .15s, background .15s;
        }
        .bs-adv-toggle:hover { border-color: #16a34a; background: #f0fdf4; color: #16a34a; }
        .bs-adv-toggle i { margin-left: 2px; }

        /* advanced panel */
        .bs-adv-panel {
          padding: 16px;
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          border-radius: 10px;
          margin-bottom: 16px;
        }
        .bs-adv-actions {
          display: flex;
          justify-content: flex-end;
          margin-top: 8px;
        }
        .bs-adv-actions .bs-btn {
          border: none;
          background: linear-gradient(135deg, #16a34a 0%, #15803d 55%, #0f766e 100%);
          color: #fff;
          font-size: 15px;
          font-weight: 700;
          padding: 10px 18px;
        }
        .bs-adv-actions .bs-btn:hover:not(:disabled) {
          background: linear-gradient(135deg, #16a34a 0%, #15803d 55%, #0f766e 100%);
          filter: brightness(1.06);
          color: #fff;
        }

        .bs-pager {
          display: flex;
          flex-wrap: wrap;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          padding: 14px 16px;
          border-top: 1px solid #e2e8f0;
          background: #f8fafc;
        }
        .bs-pager-meta {
          font-size: 13px;
          color: #475569;
        }
        .bs-pager-actions {
          display: flex;
          align-items: center;
          gap: 8px;
          flex-wrap: wrap;
        }
        .bs-pager-size {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          font-size: 13px;
          color: #475569;
        }
        .bs-pager-size select {
          height: 34px;
          border: 1px solid #dbe5f1;
          border-radius: 8px;
          padding: 0 8px;
          background: #fff;
          color: #0f172a;
        }
        .bs-pager-btn {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          height: 34px;
          padding: 0 14px;
          border: 1.5px solid #16a34a;
          border-radius: 8px;
          background: #fff;
          color: #16a34a;
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
        }
        .bs-pager-btn:hover:not(:disabled) {
          background: #16a34a;
          color: #fff;
        }
        .bs-pager-btn:disabled {
          opacity: 0.45;
          cursor: not-allowed;
        }
        .bs-pager-page {
          font-size: 13px;
          font-weight: 600;
          color: #1f3b5b;
          min-width: 90px;
          text-align: center;
        }

        .bs-row-2col {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 16px;
          width: 100%;
          max-width: 100%;
        }
        .bs-row-2col > .form-group {
          min-width: 0;
          width: 100%;
          max-width: 100%;
          margin-bottom: 0;
        }

        .bs-select {
          position: relative;
          width: 100%;
          max-width: 100%;
          min-width: 0;
        }
        .bs-select-trigger {
          display: flex !important;
          align-items: center;
          justify-content: space-between;
          gap: 8px;
          width: 100%;
          max-width: 100%;
          min-width: 0;
          box-sizing: border-box;
          text-align: left;
          cursor: pointer;
          background: #fff;
          min-height: 38px;
          padding: 8px 12px;
          line-height: 1.3;
        }
        .bs-select-label,
        .bs-select-placeholder {
          flex: 1;
          min-width: 0;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        .bs-select-placeholder { color: #94a3b8; }
        .bs-select-caret {
          flex-shrink: 0;
          font-size: 11px;
          color: #64748b;
          line-height: 1;
        }
        .bs-select.is-disabled .bs-select-trigger {
          opacity: 0.65;
          cursor: not-allowed;
          background: #f1f5f9;
        }
        .bs-select-menu {
          position: absolute;
          top: calc(100% + 4px);
          left: 0;
          right: 0;
          width: 100%;
          max-width: 100%;
          max-height: min(240px, 45vh);
          overflow-x: hidden;
          overflow-y: auto;
          margin: 0;
          padding: 4px 0;
          list-style: none;
          background: #fff;
          border: 1px solid #dbe5f1;
          border-radius: 10px;
          box-shadow: 0 10px 28px rgba(15, 23, 42, 0.14);
          z-index: 40;
          box-sizing: border-box;
          -webkit-overflow-scrolling: touch;
        }
        .bs-select-menu li {
          padding: 10px 12px;
          font-size: 13px;
          color: #0f172a;
          cursor: pointer;
          white-space: normal;
          overflow-wrap: anywhere;
          word-break: break-word;
          line-height: 1.35;
        }
        .bs-select-menu li:hover { background: #f1f5f9; }
        .bs-select-menu li.is-active {
          background: #16a34a;
          color: #fff;
        }

        @media (max-width: 991px) {
          .bs-row-2col {
            grid-template-columns: 1fr;
            gap: 12px;
          }
        }
        @media (max-width: 576px) {
          .bs-section {
            padding: 12px;
          }
          .bs-row-2col {
            grid-template-columns: 1fr;
            gap: 10px;
          }
          .bs-select-menu {
            max-height: min(200px, 40vh);
          }
        }
      `}</style>

      <section className="padd-top-80 padd-bot-80">
        <div className="container">

          {message.text && (
            <div className={`alert ${alertClass}`} style={{ marginBottom:20 }}>
              {message.text}
            </div>
          )}

          <div className="row">
            <div className="col-md-3 employer-dashboard-sidebar">
              <EmployerSidebar active="boolean-search" />
            </div>

            <div className="col-md-9 employer-dashboard-main">

              {isPremium && savedSearches.length > 0 && (
                <div className="row" style={{ marginBottom: 20 }}>
                  <div className="col-md-6">
                    <div className="card bs-futuristic-card">
                      <div className="card-header"><h4>Saved Searches</h4></div>
                      <div className="card-body">
                        {savedSearches.map(s => (
                          <div key={s.id} className="bs-saved-row">
                            <strong style={{ fontSize:14 }}>{s.search_name}</strong>
                            <button className="bs-btn bs-btn-sm" onClick={() => loadSavedSearch(s)}>
                              Load
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <div className="card bs-search-card" style={{ marginBottom: 24 }}>
                <div className="card-header">
                  <h4><i className="ti-search" style={{ marginRight:8, color:"#16a34a" }} />Search Candidates</h4>
                </div>
                <div className="card-body">
                  <form onSubmit={handleSearch}>

                    {/* ── Top search bar (full access) ────────────────────── */}
                    <div className="bs-topbar">
                      <input
                        type="text"
                        className="form-control bs-topbar-input"
                        placeholder="Search by name, skill, designation, location, keyword… (comma-separated or space-separated)"
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                      />
                      <button type="submit" className="bs-topbar-btn" disabled={loading}>
                        <i className="ti-search" />
                        {loading ? "…" : "Search"}
                      </button>
                    </div>
                    <small className="form-text text-muted" style={{ marginBottom: 12, display: "block" }}>
                      Searches across name, skills, designation, location, email. Use commas or spaces to separate terms. Prefix a term with <code>NOT </code> to exclude it.
                    </small>

                    {/* ── Toolbar: Save Search left, Advanced toggle right ── */}
                    <div className="bs-toolbar">
                      <div className="bs-toolbar-left">
                        {isPremium && (
                          <button type="button" className="bs-btn" onClick={handleSaveSearch}>
                            Save Search<i className="ti-save" />
                          </button>
                        )}
                      </div>
                      <div className="bs-toolbar-right">
                        <button
                          type="button"
                          className="bs-adv-toggle"
                          onClick={() => setShowAdvanced(v => !v)}
                        >
                          {showAdvanced ? "Hide Advanced Filters" : "Show Advanced Filters"}
                          <i className={`ti-angle-${showAdvanced ? "up" : "down"}`} />
                        </button>
                      </div>
                    </div>

                    {/* ── Advanced panel ──────────────────────────────────── */}
                    {showAdvanced && (
                      <div className="bs-adv-panel">

                        {/* Designation */}
                        <div className="form-group">
                          <label><i className="ti-id-badge" style={{ color:"#16a34a" }} />Designation / Job Role</label>
                          <input
                            type="text"
                            className="form-control"
                            placeholder="e.g. Java Developer, HR Manager"
                            value={filters.designation}
                            onChange={e => setFilters(p => ({ ...p, designation: e.target.value }))}
                          />
                        </div>

                        {/* Category + Subcategory */}
                        <div className="bs-row-2col" style={{ marginBottom: 14 }}>
                          <div className="form-group">
                            <label><i className="ti-layout-grid2" style={{ color:"#16a34a" }} />Category</label>
                            <BsSelect
                              value={filters.categoryId}
                              disabled={categoriesLoading}
                              placeholder={categoriesLoading ? "Loading…" : "All Categories"}
                              options={[
                                { value: "", label: categoriesLoading ? "Loading…" : "All Categories" },
                                ...categories.map((c) => ({ value: String(c.id), label: c.name })),
                              ]}
                              onChange={(val) => setFilters((p) => ({ ...p, categoryId: val, subcategoryId: "" }))}
                            />
                          </div>
                          <div className="form-group">
                            <label><i className="ti-layout-list-thumb" style={{ color:"#16a34a" }} />Subcategory</label>
                            <BsSelect
                              value={filters.subcategoryId}
                              disabled={!filters.categoryId || subcategoriesLoading}
                              placeholder={!filters.categoryId ? "Select a category first" : subcategoriesLoading ? "Loading…" : "All Subcategories"}
                              options={[
                                { value: "", label: !filters.categoryId ? "Select a category first" : subcategoriesLoading ? "Loading…" : "All Subcategories" },
                                ...subcategories.map((sc) => ({ value: String(sc.id), label: sc.name })),
                              ]}
                              onChange={(val) => setFilters((p) => ({ ...p, subcategoryId: val }))}
                            />
                          </div>
                        </div>

                        {/* Skills */}
                        <TagInput
                          label="Required Skills"
                          color="#0ea5e9"
                          value={skillInput}
                          onChange={setSkillInput}
                          onAdd={() => addTag("skills", skillInput, setSkillInput)}
                          items={filters.skills}
                          onRemove={(i) => removeTag("skills", i)}
                          placeholder="e.g. React, Node.js — press Enter to add"
                        />

                        {/* Location */}
                        <TagInput
                          label="Cities"
                          color="#8b5cf6"
                          value={locationInput}
                          onChange={setLocationInput}
                          onAdd={() => addTag("locations", locationInput, setLocationInput)}
                          items={filters.locations}
                          onRemove={(i) => removeTag("locations", i)}
                          placeholder="e.g. Bangalore — press Enter to add"
                        />

                        {/* Must Not Have — always priority */}
                        <TagInput
                          label="Must NOT Have (excluded even if in top search)"
                          color="#dc2626"
                          value={mustNotHaveInput}
                          onChange={setMustNotHaveInput}
                          onAdd={() => addTag("mustNotHave", mustNotHaveInput, setMustNotHaveInput)}
                          items={filters.mustNotHave}
                          onRemove={(i) => removeTag("mustNotHave", i)}
                          placeholder="Term to exclude — press Enter to add"
                        />

                        {/* Gender */}
                        <div className="form-group">
                          <label><i className="ti-user" style={{ color:"#16a34a" }} />Gender</label>
                          <select
                            className="form-control"
                            value={filters.gender}
                            onChange={e => setFilters(p => ({ ...p, gender: e.target.value }))}
                          >
                            <option value="">All</option>
                            <option value="Male">Male</option>
                            <option value="Female">Female</option>
                            <option value="Other">Other</option>
                          </select>
                        </div>

                        {/* Search Candidates — bottom right of advanced panel */}
                        <div className="bs-adv-actions">
                          <button type="submit" className="bs-btn" disabled={loading}>
                            {loading ? "Searching…" : "Search Candidates"}
                            <i className="ti-search" />
                          </button>
                        </div>
                      </div>
                    )}
                  </form>
                </div>
              </div>

              {/* results */}
              {candidates.length > 0 ? (
                <div className="card bs-futuristic-card">
                  <div className="card-header" style={{ display:"flex", alignItems:"center", justifyContent:"space-between", gap:12, flexWrap:"wrap" }}>
                    <h4 style={{ margin:0 }}>
                      Search Results{" "}
                      <span style={{ color:"#64748b", fontWeight:500, fontSize:14 }}>
                        ({totalMatching} total)
                      </span>
                    </h4>
                    <label className="bs-pager-size" style={{ margin:0 }}>
                      Per page
                      <select value={pageSize} onChange={handlePageSizeChange} disabled={loading}>
                        <option value={25}>25</option>
                        <option value={50}>50</option>
                        <option value={100}>100</option>
                        <option value={200}>200</option>
                      </select>
                    </label>
                  </div>
                  <div className="card-body" style={{ padding:0 }}>
                    <div className="bs-result-list">
                      {(() => {
                        const matchTerms = collectSearchMatchTerms(searchQuery, filters.skills);
                        return candidates.map((c, idx) => {
                          const name = c.full_name ||
                            `${c.first_name || ""} ${c.last_name || ""}`.trim() ||
                            "—";
                          const skillsList = parseSkillsList(c.skills);
                          const experienceList = parseExperienceList(c.experience);
                          const primaryExp = pickPrimaryExperience(experienceList);
                          const score = Number(c.relevance_score) || 0;
                          const tier = getMatchTier(score);
                          const ringPct = Math.max(0, Math.min(100, score));
                          const expKey = `${c.candidate_id || idx}-exp`;
                          const expExpanded = !!expandedExpKeys[expKey];
                          const desc = primaryExp ? String(primaryExp.description || "").trim() : "";
                          const descLimit = 120;
                          const descNeedsMore = desc.length > descLimit;
                          const descShown = expExpanded || !descNeedsMore
                            ? desc
                            : `${desc.slice(0, descLimit).trimEnd()}…`;
                          const dateRange = primaryExp ? formatExperienceDateRange(primaryExp) : "";
                          const locLine = primaryExp
                            ? [primaryExp.location, humanizeEmploymentType(primaryExp.locationType) || primaryExp.locationType]
                                .filter(Boolean)
                                .join(" · ")
                            : "";
                          const empType = primaryExp ? humanizeEmploymentType(primaryExp.employmentType) : "";

                          return (
                            <article key={c.candidate_id || idx} className="bs-cand-card">
                              <div className="bs-cand-header">
                                <div className="bs-cand-identity">
                                  <div className="bs-cand-avatar" aria-hidden="true">
                                    {getNameInitials(name)}
                                  </div>
                                  <div>
                                    <h3 className="bs-cand-name">{name}</h3>
                                    <div className="bs-cand-contact">
                                      {c.email && (
                                        <div className="bs-cand-contact-row">
                                          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                                            <path d="M4 4h16v16H4z" />
                                            <path d="M22 6l-10 7L2 6" />
                                          </svg>
                                          {c.email}
                                        </div>
                                      )}
                                      {c.phone && (
                                        <div className="bs-cand-contact-row">
                                          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                                            <path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1 1 .4 2 .7 2.9a2 2 0 0 1-.5 2.1L8 10a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.5c.9.3 1.9.6 2.9.7a2 2 0 0 1 1.7 2z" />
                                          </svg>
                                          {c.phone}
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                </div>

                                <div className="bs-cand-action">
                                  <div className="bs-cand-match">
                                    <div
                                      className="bs-cand-ring"
                                      style={{
                                        background: `conic-gradient(${tier.color} ${ringPct}%, #EDEEE9 0)`,
                                      }}
                                    >
                                      <div
                                        className="bs-cand-ring-inner"
                                        style={{ color: tier.color }}
                                      >
                                        {score}
                                      </div>
                                    </div>
                                    <span
                                      className="bs-cand-tier"
                                      style={{ background: tier.bg, color: tier.color }}
                                    >
                                      {tier.label}
                                    </span>
                                  </div>
                                </div>
                              </div>

                              {c.job_title ? (
                                <p className="bs-cand-role">Applied — {c.job_title}</p>
                              ) : null}

                              <div className="bs-cand-skills-line">
                                <span className="bs-cand-skills-label">Skills:</span>{" "}
                                {skillsList.length > 0 ? (
                                  skillsList.slice(0, 10).map((sk, i) => (
                                    <span key={`${sk}-${i}`}>
                                      {i > 0 ? ", " : ""}
                                      {isSkillMatched(sk, matchTerms) ? (
                                        <span className="bs-cand-skill-matched">{sk}</span>
                                      ) : (
                                        sk
                                      )}
                                    </span>
                                  ))
                                ) : (
                                  <span>Not specified</span>
                                )}
                                {skillsList.length > 10 ? `, +${skillsList.length - 10}` : null}
                              </div>

                              <hr className="bs-cand-divider" />

                              {primaryExp ? (
                                <div className="bs-cand-bottom">
                                  <div className="bs-exp-entry">
                                    <div className="bs-exp-title">
                                      {primaryExp.jobTitle || "Untitled role"}
                                    </div>
                                    {(primaryExp.company || empType) && (
                                      <div className="bs-exp-company">
                                        {primaryExp.company || "Company not specified"}
                                        {empType ? <span> · {empType}</span> : null}
                                      </div>
                                    )}
                                    {dateRange && <div className="bs-exp-meta">{dateRange}</div>}
                                    {locLine && <div className="bs-exp-meta">{locLine}</div>}
                                    {desc && (
                                      <div className="bs-exp-desc">
                                        {descShown}
                                        {descNeedsMore && (
                                          <button
                                            type="button"
                                            className="bs-exp-read-more"
                                            onClick={() =>
                                              setExpandedExpKeys((prev) => ({
                                                ...prev,
                                                [expKey]: !prev[expKey],
                                              }))
                                            }
                                          >
                                            {expExpanded ? "Show less" : "Read more"}
                                          </button>
                                        )}
                                      </div>
                                    )}
                                  </div>
                                </div>
                              ) : null}

                              {/* Hover actions — bottom center */}
                              <div className="bs-cand-hover-bar">
                                {c.job_title && c.resume_url ? (
                                  <>
                                    <a
                                      href={`${API_BASE_URL}${c.resume_url}`}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="bs-cand-hover-btn"
                                    >
                                      View resume
                                    </a>
                                    <span className="bs-cand-hover-sep">||</span>
                                  </>
                                ) : null}
                                <button
                                  type="button"
                                  className="bs-cand-hover-btn"
                                  onClick={() => navigate("/employer/view-candidates")}
                                >
                                  View profile
                                </button>
                              </div>
                            </article>
                          );
                        });
                      })()}
                    </div>

                    <div className="bs-pager">
                      <div className="bs-pager-meta">
                        Showing{" "}
                        <strong>
                          {totalMatching === 0 ? 0 : (page - 1) * pageSize + 1}
                          –
                          {(page - 1) * pageSize + candidates.length}
                        </strong>{" "}
                        of <strong>{totalMatching}</strong> candidates
                      </div>
                      <div className="bs-pager-actions">
                        <button
                          type="button"
                          className="bs-pager-btn"
                          disabled={loading || !hasPrev}
                          onClick={() => goToPage(page - 1)}
                        >
                          ← Previous
                        </button>
                        <span className="bs-pager-page">
                          Page {page} of {Math.max(totalPages, 1)}
                        </span>
                        <button
                          type="button"
                          className="bs-pager-btn"
                          disabled={loading || !hasNext}
                          onClick={() => goToPage(page + 1)}
                        >
                          Next →
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                !loading && (
                  <div className="bs-no-results">
                    <i className="ti-search" style={{ fontSize:32, marginBottom:10, display:"block" }} />
                    <p>
                      {hasSearched
                        ? "No candidates matched your search."
                        : <>Enter keywords or filters above and click <strong>Search Candidates</strong> to get started.</>}
                    </p>
                  </div>
                )
              )}

            </div>{/* /main */}
          </div>{/* /row */}
        </div>{/* /container */}
      </section>

      <Footer />
    </>
  );
}

export default BooleanSearch;