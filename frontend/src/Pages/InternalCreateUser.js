// import React, { useState } from "react";
// import Header from "../Components/Header";
// import Footer from "../Components/Footer";
// import { API_BASE_URL } from "../config/api";

// const initialForm = {
//   fullName: "",
//   email: "",
//   phone: "",
//   password: "",
//   role: "seeker",
// };

// export default function InternalCreateUser() {
//   const [form, setForm] = useState(initialForm);
//   const [submitting, setSubmitting] = useState(false);
//   const [message, setMessage] = useState("");
//   const [messageType, setMessageType] = useState("info");

//   const updateField = (field, value) => {
//     setForm((prev) => ({
//       ...prev,
//       [field]: value,
//     }));
//   };

//   const handleSubmit = async (event) => {
//     event.preventDefault();
//     if (submitting) return;

//     setSubmitting(true);
//     setMessage("");

//     try {
//       const response = await fetch(`${API_BASE_URL}/api/auth/internal/create-user`, {
//         method: "POST",
//         headers: {
//           "Content-Type": "application/json",
//         },
//         body: JSON.stringify(form),
//       });

//       const data = await response.json().catch(() => ({}));

//       if (!response.ok) {
//         setMessage(data?.message || "Failed to create user.");
//         setMessageType("danger");
//         return;
//       }

//       setMessage(data?.message || "User created successfully.");
//       setMessageType("success");
//       setForm(initialForm);
//     } catch (error) {
//       setMessage("Network error. Please try again.");
//       setMessageType("danger");
//     } finally {
//       setSubmitting(false);
//     }
//   };

//   return (
//     <>
//       <Header />
//       <section className="internal-create-user-section" style={{ background: "#f8fafc", minHeight: "100vh", padding: "60px 0 40px" }}>
//         <div className="container internal-create-user-container">
//           <div
//             className="internal-create-user-card"
//             style={{
//               width: "100%",
//               maxWidth: 560,
//               margin: "0 auto",
//               background: "#fff",
//               borderRadius: 18,
//               border: "1px solid rgba(148,163,184,0.18)",
//               boxShadow: "0 12px 30px rgba(15,23,42,0.08)",
//               padding: 28,
//               boxSizing: "border-box",
//             }}
//           >
//             <h2 className="internal-create-user-title" style={{ margin: 0, fontSize: 28, fontWeight: 800, color: "#0f172a" }}>
//               Internal Create User
//             </h2>
//             <p className="internal-create-user-subtitle" style={{ margin: "10px 0 0", color: "#64748b", fontSize: 14 }}>
//               Create internal user accounts directly without OTP verification.
//             </p>

//             {message ? (
//               <div
//                 className="internal-create-user-alert"
//                 style={{
//                   marginTop: 18,
//                   borderRadius: 10,
//                   padding: "12px 14px",
//                   fontSize: 14,
//                   fontWeight: 600,
//                   background: messageType === "success" ? "rgba(22,163,74,0.10)" : "rgba(239,68,68,0.10)",
//                   color: messageType === "success" ? "#15803d" : "#b91c1c",
//                 }}
//               >
//                 {message}
//               </div>
//             ) : null}

//             <form className="internal-create-user-form" onSubmit={handleSubmit} style={{ marginTop: 22, display: "flex", flexDirection: "column", gap: 16 }}>
//               <div className="internal-create-user-field">
//                 <label style={{ display: "block", marginBottom: 6, fontSize: 14, fontWeight: 700, color: "#334155" }}>Full Name</label>
//                 <input
//                   className="internal-create-user-input"
//                   type="text"
//                   value={form.fullName}
//                   onChange={(e) => updateField("fullName", e.target.value)}
//                   placeholder="Enter full name"
//                   style={{ width: "100%", height: 46, borderRadius: 10, border: "1px solid #dbe3ea", padding: "0 14px", boxSizing: "border-box" }}
//                 />
//               </div>

//               <div className="internal-create-user-field">
//                 <label style={{ display: "block", marginBottom: 6, fontSize: 14, fontWeight: 700, color: "#334155" }}>Email</label>
//                 <input
//                   className="internal-create-user-input"
//                   type="email"
//                   value={form.email}
//                   onChange={(e) => updateField("email", e.target.value)}
//                   placeholder="Enter email"
//                   style={{ width: "100%", height: 46, borderRadius: 10, border: "1px solid #dbe3ea", padding: "0 14px", boxSizing: "border-box" }}
//                 />
//               </div>

//               <div className="internal-create-user-field">
//                 <label style={{ display: "block", marginBottom: 6, fontSize: 14, fontWeight: 700, color: "#334155" }}>Phone</label>
//                 <input
//                   className="internal-create-user-input"
//                   type="text"
//                   value={form.phone}
//                   onChange={(e) => updateField("phone", e.target.value)}
//                   placeholder="Enter phone number"
//                   style={{ width: "100%", height: 46, borderRadius: 10, border: "1px solid #dbe3ea", padding: "0 14px", boxSizing: "border-box" }}
//                 />
//               </div>

//               <div className="internal-create-user-field">
//                 <label style={{ display: "block", marginBottom: 6, fontSize: 14, fontWeight: 700, color: "#334155" }}>Password</label>
//                 <input
//                   className="internal-create-user-input"
//                   type="password"
//                   value={form.password}
//                   onChange={(e) => updateField("password", e.target.value)}
//                   placeholder="Enter password"
//                   style={{ width: "100%", height: 46, borderRadius: 10, border: "1px solid #dbe3ea", padding: "0 14px", boxSizing: "border-box" }}
//                 />
//               </div>

//               <div className="internal-create-user-field">
//                 <label style={{ display: "block", marginBottom: 6, fontSize: 14, fontWeight: 700, color: "#334155" }}>Role</label>
//                 <select
//                   className="internal-create-user-input"
//                   value={form.role}
//                   onChange={(e) => updateField("role", e.target.value)}
//                   style={{ width: "100%", height: 46, borderRadius: 10, border: "1px solid #dbe3ea", padding: "0 14px", background: "#fff", boxSizing: "border-box" }}
//                 >
//                   <option value="seeker">seeker</option>
//                   <option value="provider">provider</option>
//                 </select>
//               </div>

//               <button
//                 className="internal-create-user-submit"
//                 type="submit"
//                 disabled={submitting}
//                 style={{
//                   marginTop: 4,
//                   height: 48,
//                   border: "none",
//                   borderRadius: 10,
//                   background: submitting ? "#94a3b8" : "#16a34a",
//                   color: "#fff",
//                   fontSize: 15,
//                   fontWeight: 800,
//                   cursor: submitting ? "not-allowed" : "pointer",
//                 }}
//               >
//                 {submitting ? "Creating..." : "Create User"}
//               </button>
//             </form>
//           </div>
//         </div>
//         <style>{`
//           .internal-create-user-container {
//             width: 100%;
//           }

//           @media (max-width: 767px) {
//             .internal-create-user-section {
//               padding: 32px 0 24px !important;
//             }

//             .internal-create-user-container {
//               padding-left: 12px !important;
//               padding-right: 12px !important;
//             }

//             .internal-create-user-card {
//               padding: 20px !important;
//               border-radius: 14px !important;
//               max-width: 100% !important;
//             }

//             .internal-create-user-title {
//               font-size: 24px !important;
//               line-height: 1.2;
//             }

//             .internal-create-user-subtitle {
//               font-size: 13px !important;
//             }

//             .internal-create-user-alert {
//               font-size: 13px !important;
//               padding: 11px 12px !important;
//             }

//             .internal-create-user-form {
//               gap: 14px !important;
//             }

//             .internal-create-user-field label {
//               font-size: 13px !important;
//             }

//             .internal-create-user-input {
//               height: 44px !important;
//               font-size: 14px !important;
//             }

//             .internal-create-user-submit {
//               width: 100% !important;
//               height: 46px !important;
//               font-size: 14px !important;
//             }
//           }

//           @media (max-width: 480px) {
//             .internal-create-user-section {
//               padding: 20px 0 16px !important;
//             }

//             .internal-create-user-container {
//               padding-left: 8px !important;
//               padding-right: 8px !important;
//             }

//             .internal-create-user-card {
//               padding: 16px !important;
//               border-radius: 12px !important;
//             }

//             .internal-create-user-title {
//               font-size: 21px !important;
//             }

//             .internal-create-user-subtitle {
//               font-size: 12px !important;
//               line-height: 1.6 !important;
//             }

//             .internal-create-user-alert {
//               margin-top: 14px !important;
//               font-size: 12px !important;
//             }

//             .internal-create-user-form {
//               margin-top: 18px !important;
//               gap: 12px !important;
//             }

//             .internal-create-user-field label {
//               margin-bottom: 5px !important;
//               font-size: 12px !important;
//             }

//             .internal-create-user-input {
//               height: 42px !important;
//               padding: 0 12px !important;
//               border-radius: 8px !important;
//               font-size: 13px !important;
//             }

//             .internal-create-user-submit {
//               margin-top: 2px !important;
//               height: 44px !important;
//               border-radius: 8px !important;
//               font-size: 13px !important;
//             }
//           }

//           @media (max-width: 360px) {
//             .internal-create-user-card {
//               padding: 14px !important;
//             }

//             .internal-create-user-title {
//               font-size: 19px !important;
//             }

//             .internal-create-user-input {
//               font-size: 12px !important;
//             }
//           }
//         `}</style>
//       </section>
//       <Footer />
//     </>
//   );
// }

// // import React, { useState } from "react";
// // import Header from "../Components/Header";
// // import Footer from "../Components/Footer";
// // import { API_BASE_URL } from "../config/api";
 
// // // ── CRM sync config ──────────────────────────────────────────────────────────
// // // Add this to your .env file:  VITE_CRM_API_SECRET=UPTULA_CRM_SECRET_KEY_2024
// // const CRM_ENDPOINT = "https://uptulasoft.com/CRM/api/external-registrations/create";
// // const CRM_SECRET   = import.meta.env.VITE_CRM_API_SECRET || "";
 
// // const initialForm = {
// //   fullName: "",
// //   email: "",
// //   phone: "",
// //   password: "",
// //   role: "seeker",
// // };
 
// // export default function InternalCreateUser() {
// //   const [form, setForm]             = useState(initialForm);
// //   const [submitting, setSubmitting] = useState(false);
// //   const [message, setMessage]       = useState("");
// //   const [messageType, setMessageType] = useState("info");
 
// //   const updateField = (field, value) => {
// //     setForm((prev) => ({ ...prev, [field]: value }));
// //   };
 
// //   // ── Sync to CRM (fire-and-forget, non-blocking) ───────────────────────────
// //   const syncToCRM = async (formData) => {
// //     try {
// //       await fetch(CRM_ENDPOINT, {
// //         method: "POST",
// //         headers: {
// //           "Content-Type": "application/json",
// //           "X-Api-Secret": CRM_SECRET,
// //         },
// //         body: JSON.stringify(formData),
// //       });
// //       // We don't block or fail the main flow if CRM sync fails
// //     } catch (_) {
// //       // Silent fail — CRM sync failure should not affect the user experience
// //       console.warn("CRM sync failed silently.");
// //     }
// //   };
 
// //   const handleSubmit = async (event) => {
// //     event.preventDefault();
// //     if (submitting) return;
 
// //     setSubmitting(true);
// //     setMessage("");
 
// //     try {
// //       // ── Step 1: Save to Uptula DB ──────────────────────────────────────────
// //       const response = await fetch(`${API_BASE_URL}/api/auth/internal/create-user`, {
// //         method: "POST",
// //         headers: { "Content-Type": "application/json" },
// //         body: JSON.stringify(form),
// //       });
 
// //       const data = await response.json().catch(() => ({}));
 
// //       if (!response.ok) {
// //         setMessage(data?.message || "Failed to create user.");
// //         setMessageType("danger");
// //         return;
// //       }
 
// //       // ── Step 2: Sync to CRM DB (non-blocking) ────────────────────────────
// //       syncToCRM(form);
 
// //       setMessage(data?.message || "User created successfully.");
// //       setMessageType("success");
// //       setForm(initialForm);
 
// //     } catch (error) {
// //       setMessage("Network error. Please try again.");
// //       setMessageType("danger");
// //     } finally {
// //       setSubmitting(false);
// //     }
// //   };
 
// //   return (
// // <>
// // <Header />
// // <section className="internal-create-user-section" style={{ background: "#f8fafc", minHeight: "100vh", padding: "60px 0 40px" }}>
// // <div className="container internal-create-user-container">
// // <div
// //             className="internal-create-user-card"
// //             style={{
// //               width: "100%",
// //               maxWidth: 560,
// //               margin: "0 auto",
// //               background: "#fff",
// //               borderRadius: 18,
// //               border: "1px solid rgba(148,163,184,0.18)",
// //               boxShadow: "0 12px 30px rgba(15,23,42,0.08)",
// //               padding: 28,
// //               boxSizing: "border-box",
// //             }}
// // >
// // <h2 className="internal-create-user-title" style={{ margin: 0, fontSize: 28, fontWeight: 800, color: "#0f172a" }}>
// //               Internal Create User
// // </h2>
// // <p className="internal-create-user-subtitle" style={{ margin: "10px 0 0", color: "#64748b", fontSize: 14 }}>
// //               Create internal user accounts directly without OTP verification.
// // </p>
 
// //             {message ? (
// // <div
// //                 className="internal-create-user-alert"
// //                 style={{
// //                   marginTop: 18,
// //                   borderRadius: 10,
// //                   padding: "12px 14px",
// //                   fontSize: 14,
// //                   fontWeight: 600,
// //                   background: messageType === "success" ? "rgba(22,163,74,0.10)" : "rgba(239,68,68,0.10)",
// //                   color: messageType === "success" ? "#15803d" : "#b91c1c",
// //                 }}
// // >
// //                 {message}
// // </div>
// //             ) : null}
 
// //             <form className="internal-create-user-form" onSubmit={handleSubmit} style={{ marginTop: 22, display: "flex", flexDirection: "column", gap: 16 }}>
// // <div className="internal-create-user-field">
// // <label style={{ display: "block", marginBottom: 6, fontSize: 14, fontWeight: 700, color: "#334155" }}>Full Name</label>
// // <input
// //                   className="internal-create-user-input"
// //                   type="text"
// //                   value={form.fullName}
// //                   onChange={(e) => updateField("fullName", e.target.value)}
// //                   placeholder="Enter full name"
// //                   required
// //                   style={{ width: "100%", height: 46, borderRadius: 10, border: "1px solid #dbe3ea", padding: "0 14px", boxSizing: "border-box" }}
// //                 />
// // </div>
 
// //               <div className="internal-create-user-field">
// // <label style={{ display: "block", marginBottom: 6, fontSize: 14, fontWeight: 700, color: "#334155" }}>Email</label>
// // <input
// //                   className="internal-create-user-input"
// //                   type="email"
// //                   value={form.email}
// //                   onChange={(e) => updateField("email", e.target.value)}
// //                   placeholder="Enter email"
// //                   required
// //                   style={{ width: "100%", height: 46, borderRadius: 10, border: "1px solid #dbe3ea", padding: "0 14px", boxSizing: "border-box" }}
// //                 />
// // </div>
 
// //               <div className="internal-create-user-field">
// // <label style={{ display: "block", marginBottom: 6, fontSize: 14, fontWeight: 700, color: "#334155" }}>Phone</label>
// // <input
// //                   className="internal-create-user-input"
// //                   type="text"
// //                   value={form.phone}
// //                   onChange={(e) => updateField("phone", e.target.value)}
// //                   placeholder="Enter phone number"
// //                   style={{ width: "100%", height: 46, borderRadius: 10, border: "1px solid #dbe3ea", padding: "0 14px", boxSizing: "border-box" }}
// //                 />
// // </div>
 
// //               <div className="internal-create-user-field">
// // <label style={{ display: "block", marginBottom: 6, fontSize: 14, fontWeight: 700, color: "#334155" }}>Password</label>
// // <input
// //                   className="internal-create-user-input"
// //                   type="password"
// //                   value={form.password}
// //                   onChange={(e) => updateField("password", e.target.value)}
// //                   placeholder="Enter password"
// //                   required
// //                   style={{ width: "100%", height: 46, borderRadius: 10, border: "1px solid #dbe3ea", padding: "0 14px", boxSizing: "border-box" }}
// //                 />
// // </div>
 
// //               <div className="internal-create-user-field">
// // <label style={{ display: "block", marginBottom: 6, fontSize: 14, fontWeight: 700, color: "#334155" }}>Role</label>
// // <select
// //                   className="internal-create-user-input"
// //                   value={form.role}
// //                   onChange={(e) => updateField("role", e.target.value)}
// //                   style={{ width: "100%", height: 46, borderRadius: 10, border: "1px solid #dbe3ea", padding: "0 14px", background: "#fff", boxSizing: "border-box" }}
// // >
// // <option value="seeker">seeker</option>
// // <option value="provider">provider</option>
// // </select>
// // </div>
 
// //               <button
// //                 className="internal-create-user-submit"
// //                 type="submit"
// //                 disabled={submitting}
// //                 style={{
// //                   marginTop: 4,
// //                   height: 48,
// //                   border: "none",
// //                   borderRadius: 10,
// //                   background: submitting ? "#94a3b8" : "#16a34a",
// //                   color: "#fff",
// //                   fontSize: 15,
// //                   fontWeight: 800,
// //                   cursor: submitting ? "not-allowed" : "pointer",
// //                 }}
// // >
// //                 {submitting ? "Creating..." : "Create User"}
// // </button>
// // </form>
// // </div>
// // </div>
// // <style>{`
// //           .internal-create-user-container { width: 100%; }
// //           @media (max-width: 767px) {
// //             .internal-create-user-section { padding: 32px 0 24px !important; }
// //             .internal-create-user-container { padding-left: 12px !important; padding-right: 12px !important; }
// //             .internal-create-user-card { padding: 20px !important; border-radius: 14px !important; max-width: 100% !important; }
// //             .internal-create-user-title { font-size: 24px !important; line-height: 1.2; }
// //             .internal-create-user-subtitle { font-size: 13px !important; }
// //             .internal-create-user-alert { font-size: 13px !important; padding: 11px 12px !important; }
// //             .internal-create-user-form { gap: 14px !important; }
// //             .internal-create-user-field label { font-size: 13px !important; }
// //             .internal-create-user-input { height: 44px !important; font-size: 14px !important; }
// //             .internal-create-user-submit { width: 100% !important; height: 46px !important; font-size: 14px !important; }
// //           }
// //           @media (max-width: 480px) {
// //             .internal-create-user-section { padding: 20px 0 16px !important; }
// //             .internal-create-user-container { padding-left: 8px !important; padding-right: 8px !important; }
// //             .internal-create-user-card { padding: 16px !important; border-radius: 12px !important; }
// //             .internal-create-user-title { font-size: 21px !important; }
// //             .internal-create-user-subtitle { font-size: 12px !important; line-height: 1.6 !important; }
// //             .internal-create-user-alert { margin-top: 14px !important; font-size: 12px !important; }
// //             .internal-create-user-form { margin-top: 18px !important; gap: 12px !important; }
// //             .internal-create-user-field label { margin-bottom: 5px !important; font-size: 12px !important; }
// //             .internal-create-user-input { height: 42px !important; padding: 0 12px !important; border-radius: 8px !important; font-size: 13px !important; }
// //             .internal-create-user-submit { margin-top: 2px !important; height: 44px !important; border-radius: 8px !important; font-size: 13px !important; }
// //           }
// //           @media (max-width: 360px) {
// //             .internal-create-user-card { padding: 14px !important; }
// //             .internal-create-user-title { font-size: 19px !important; }
// //             .internal-create-user-input { font-size: 12px !important; }
// //           }
// //         `}</style>
// // </section>
// // <Footer />
// // </>
// //   );
// // }
import React, { useState, useEffect } from "react";
import Header from "../Components/Header";
import Footer from "../Components/Footer";
import CSRLogin from "../CustomerService/CSRLogin";
import { API_BASE_URL } from "../config/api";
 
// ── CRM sync config ──────────────────────────────────────────────────────────
 
const CRM_ENDPOINT =
  "https://uptulasoft.com/CRM/api/external-registrations/create";
const CRM_SECRET = process.env.REACT_APP_CRM_API_SECRET || "";
 
const initialForm = {
  fullName: "",
  email: "",
  phone: "",
  password: "",
  role: "seeker",
};
 
export default function InternalCreateUser() {
  const [csAuthed, setCsAuthed] = useState(false);
  const [authChecked, setAuthChecked] = useState(false);
  const [form, setForm] = useState(initialForm);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("info");

  useEffect(() => {
    const token = localStorage.getItem("csToken");
    if (!token) {
      setCsAuthed(false);
      setAuthChecked(true);
      return;
    }
    fetch(`${API_BASE_URL}/api/customer/verify`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => {
        if (!res.ok) throw new Error("unauthorized");
        return res.json();
      })
      .then((data) => {
        if (data?.user?.role === "customer_service") {
          setCsAuthed(true);
        } else {
          localStorage.removeItem("csToken");
          setCsAuthed(false);
        }
      })
      .catch(() => {
        localStorage.removeItem("csToken");
        setCsAuthed(false);
      })
      .finally(() => setAuthChecked(true));
  }, []);
 
  const updateField = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };
 
  // ── Sync to CRM (fire-and-forget, non-blocking) ───────────────────────────
  const syncToCRM = async (formData) => {
    try {
      await fetch(CRM_ENDPOINT, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Api-Secret": CRM_SECRET,
        },
        body: JSON.stringify(formData),
      });
      // We don't block or fail the main flow if CRM sync fails
    } catch (_) {
      // Silent fail — CRM sync failure should not affect the user experience
      console.warn("CRM sync failed silently.");
    }
  };
 
  const handleSubmit = async (event) => {
    event.preventDefault();
    if (submitting) return;
 
    setSubmitting(true);
    setMessage("");
 
    try {
      // ── Step 1: Save to Uptula DB ──────────────────────────────────────────
      const response = await fetch(
        `${API_BASE_URL}/api/auth/internal/create-user`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(form),
        },
      );
 
      const data = await response.json().catch(() => ({}));
 
      if (!response.ok) {
        setMessage(data?.message || "Failed to create user.");
        setMessageType("danger");
        return;
      }
 
      // ── Step 2: Sync to CRM DB (non-blocking) ────────────────────────────
      syncToCRM(form);
 
      setMessage(data?.message || "User created successfully.");
      setMessageType("success");
      setForm(initialForm);
    } catch (error) {
      setMessage("Network error. Please try again.");
      setMessageType("danger");
    } finally {
      setSubmitting(false);
    }
  };
 
  if (!authChecked) {
    return null;
  }

  if (!csAuthed) {
    return <CSRLogin redirectTo="/internal/create-user" />;
  }

  return (
    <>
      <Header />
      <section
        className="internal-create-user-section"
        style={{
          background: "#f8fafc",
          minHeight: "100vh",
          padding: "60px 0 40px",
        }}
      >
        <div className="container internal-create-user-container">
          <div
            className="internal-create-user-card"
            style={{
              width: "100%",
              maxWidth: 560,
              margin: "0 auto",
              background: "#fff",
              borderRadius: 18,
              border: "1px solid rgba(148,163,184,0.18)",
              boxShadow: "0 12px 30px rgba(15,23,42,0.08)",
              padding: 28,
              boxSizing: "border-box",
            }}
          >
            <h2
              className="internal-create-user-title"
              style={{
                margin: 0,
                fontSize: 28,
                fontWeight: 800,
                color: "#0f172a",
              }}
            >
              Internal Create User
            </h2>
            <p
              className="internal-create-user-subtitle"
              style={{ margin: "10px 0 0", color: "#64748b", fontSize: 14 }}
            >
              Create internal user accounts directly without OTP verification.
            </p>
 
            {message ? (
              <div
                className="internal-create-user-alert"
                style={{
                  marginTop: 18,
                  borderRadius: 10,
                  padding: "12px 14px",
                  fontSize: 14,
                  fontWeight: 600,
                  background:
                    messageType === "success"
                      ? "rgba(22,163,74,0.10)"
                      : "rgba(239,68,68,0.10)",
                  color: messageType === "success" ? "#15803d" : "#b91c1c",
                }}
              >
                {message}
              </div>
            ) : null}
 
            <form
              className="internal-create-user-form"
              onSubmit={handleSubmit}
              style={{
                marginTop: 22,
                display: "flex",
                flexDirection: "column",
                gap: 16,
              }}
            >
              <div className="internal-create-user-field">
                <label
                  style={{
                    display: "block",
                    marginBottom: 6,
                    fontSize: 14,
                    fontWeight: 700,
                    color: "#334155",
                  }}
                >
                  Full Name
                </label>
                <input
                  className="internal-create-user-input"
                  type="text"
                  value={form.fullName}
                  onChange={(e) => updateField("fullName", e.target.value)}
                  placeholder="Enter full name"
                  required
                  style={{
                    width: "100%",
                    height: 46,
                    borderRadius: 10,
                    border: "1px solid #dbe3ea",
                    padding: "0 14px",
                    boxSizing: "border-box",
                  }}
                />
              </div>
 
              <div className="internal-create-user-field">
                <label
                  style={{
                    display: "block",
                    marginBottom: 6,
                    fontSize: 14,
                    fontWeight: 700,
                    color: "#334155",
                  }}
                >
                  Email
                </label>
                <input
                  className="internal-create-user-input"
                  type="email"
                  value={form.email}
                  onChange={(e) => updateField("email", e.target.value)}
                  placeholder="Enter email"
                  required
                  style={{
                    width: "100%",
                    height: 46,
                    borderRadius: 10,
                    border: "1px solid #dbe3ea",
                    padding: "0 14px",
                    boxSizing: "border-box",
                  }}
                />
              </div>
 
              <div className="internal-create-user-field">
                <label
                  style={{
                    display: "block",
                    marginBottom: 6,
                    fontSize: 14,
                    fontWeight: 700,
                    color: "#334155",
                  }}
                >
                  Phone
                </label>
                <input
                  className="internal-create-user-input"
                  type="text"
                  value={form.phone}
                  onChange={(e) => updateField("phone", e.target.value)}
                  placeholder="Enter phone number"
                  style={{
                    width: "100%",
                    height: 46,
                    borderRadius: 10,
                    border: "1px solid #dbe3ea",
                    padding: "0 14px",
                    boxSizing: "border-box",
                  }}
                />
              </div>
 
              <div className="internal-create-user-field">
                <label
                  style={{
                    display: "block",
                    marginBottom: 6,
                    fontSize: 14,
                    fontWeight: 700,
                    color: "#334155",
                  }}
                >
                  Password
                </label>
                <input
                  className="internal-create-user-input"
                  type="password"
                  value={form.password}
                  onChange={(e) => updateField("password", e.target.value)}
                  placeholder="Enter password"
                  required
                  style={{
                    width: "100%",
                    height: 46,
                    borderRadius: 10,
                    border: "1px solid #dbe3ea",
                    padding: "0 14px",
                    boxSizing: "border-box",
                  }}
                />
              </div>
 
              <div className="internal-create-user-field">
                <label
                  style={{
                    display: "block",
                    marginBottom: 6,
                    fontSize: 14,
                    fontWeight: 700,
                    color: "#334155",
                  }}
                >
                  Role
                </label>
                <select
                  className="internal-create-user-input"
                  value={form.role}
                  onChange={(e) => updateField("role", e.target.value)}
                  style={{
                    width: "100%",
                    height: 46,
                    borderRadius: 10,
                    border: "1px solid #dbe3ea",
                    padding: "0 14px",
                    background: "#fff",
                    boxSizing: "border-box",
                  }}
                >
                  <option value="seeker">seeker</option>
                  <option value="provider">provider</option>
                </select>
              </div>
 
              <button
                className="internal-create-user-submit"
                type="submit"
                disabled={submitting}
                style={{
                  marginTop: 4,
                  height: 48,
                  border: "none",
                  borderRadius: 10,
                  background: submitting ? "#94a3b8" : "#16a34a",
                  color: "#fff",
                  fontSize: 15,
                  fontWeight: 800,
                  cursor: submitting ? "not-allowed" : "pointer",
                }}
              >
                {submitting ? "Creating..." : "Create User"}
              </button>
            </form>
          </div>
        </div>
        <style>{`
          .internal-create-user-container { width: 100%; }
          @media (max-width: 767px) {
            .internal-create-user-section { padding: 32px 0 24px !important; }
            .internal-create-user-container { padding-left: 12px !important; padding-right: 12px !important; }
            .internal-create-user-card { padding: 20px !important; border-radius: 14px !important; max-width: 100% !important; }
            .internal-create-user-title { font-size: 24px !important; line-height: 1.2; }
            .internal-create-user-subtitle { font-size: 13px !important; }
            .internal-create-user-alert { font-size: 13px !important; padding: 11px 12px !important; }
            .internal-create-user-form { gap: 14px !important; }
            .internal-create-user-field label { font-size: 13px !important; }
            .internal-create-user-input { height: 44px !important; font-size: 14px !important; }
            .internal-create-user-submit { width: 100% !important; height: 46px !important; font-size: 14px !important; }
          }
          @media (max-width: 480px) {
            .internal-create-user-section { padding: 20px 0 16px !important; }
            .internal-create-user-container { padding-left: 8px !important; padding-right: 8px !important; }
            .internal-create-user-card { padding: 16px !important; border-radius: 12px !important; }
            .internal-create-user-title { font-size: 21px !important; }
            .internal-create-user-subtitle { font-size: 12px !important; line-height: 1.6 !important; }
            .internal-create-user-alert { margin-top: 14px !important; font-size: 12px !important; }
            .internal-create-user-form { margin-top: 18px !important; gap: 12px !important; }
            .internal-create-user-field label { margin-bottom: 5px !important; font-size: 12px !important; }
            .internal-create-user-input { height: 42px !important; padding: 0 12px !important; border-radius: 8px !important; font-size: 13px !important; }
            .internal-create-user-submit { margin-top: 2px !important; height: 44px !important; border-radius: 8px !important; font-size: 13px !important; }
          }
          @media (max-width: 360px) {
            .internal-create-user-card { padding: 14px !important; }
            .internal-create-user-title { font-size: 19px !important; }
            .internal-create-user-input { font-size: 12px !important; }
          }
        `}</style>
      </section>
      <Footer />
    </>
  );
}