// import React, { useState } from "react";
// import { useNavigate, Link } from "react-router-dom";
// import { useAuth } from "../context/AuthContext";
// import { API_BASE_URL } from "../config/api";
// import RegistrationCategoryFields from "./RegistrationCategoryFields";
// import { GoogleAuthProvider, signInWithPopup } from "firebase/auth";
// import { auth as firebaseAuth, missingKeys as firebaseMissingKeys } from "../config/firebaseClient";

// function RegisterPage() {
//   const [registerType, setRegisterType] = useState("seeker");
//   const navigate = useNavigate();
//   const { login } = useAuth();

//   const [seekerForm, setSeekerForm] = useState({
//     fullName: "",
//     email: "",
//     phone: "",
//     password: "",
//     confirmPassword: "",
//     categoryId: "",
//     subcategoryId: "",
//   });

//   const [providerForm, setProviderForm] = useState({
//     fullName: "",
//     email: "",
//     phone: "",
//     password: "",
//     confirmPassword: "",
//     categoryId: "",
//     subcategoryId: "",
//   });

//   const [isOtpStep, setIsOtpStep] = useState(false);
//   const [otp, setOtp] = useState(["", "", "", "", "", ""]);
//   const [otpTimer, setOtpTimer] = useState(60);
//   const [resendCount, setResendCount] = useState(0);
//   const [currentEmail, setCurrentEmail] = useState("");
//   const [currentRole, setCurrentRole] = useState("");
//   const [loading, setLoading] = useState(false);
//   const [message, setMessage] = useState("");
//   const messageTimerRef = React.useRef(null);

//   React.useEffect(() => {
//     let interval;
//     if (isOtpStep && otpTimer > 0) {
//       interval = setInterval(() => setOtpTimer((prev) => prev - 1), 1000);
//     }
//     return () => clearInterval(interval);
//   }, [isOtpStep, otpTimer]);

//   const isSuccessMessage = (text) => {
//     const t = String(text || "").toLowerCase();
//     if (!t) return false;
//     if (
//       t.includes("not found") ||
//       t.includes("incorrect") ||
//       t.includes("failed") ||
//       t.includes("error") ||
//       t.includes("do not match") ||
//       t.includes("at least") ||
//       t.includes("maximum resend") ||
//       t.includes("missing:")
//     ) return false;
//     return t.includes("success") || t.includes("otp sent") || t.includes("otp resent");
//   };

//   React.useEffect(() => {
//     if (!message) return;
//     if (messageTimerRef.current) clearTimeout(messageTimerRef.current);
//     const hideMs = isSuccessMessage(message) ? 3000 : 4000;
//     messageTimerRef.current = setTimeout(() => {
//       setMessage("");
//       messageTimerRef.current = null;
//     }, hideMs);
//     return () => {
//       if (messageTimerRef.current) {
//         clearTimeout(messageTimerRef.current);
//         messageTimerRef.current = null;
//       }
//     };
//   }, [message]);

//   const handleGoogleAuth = async (role) => {
//     setLoading(true);
//     setMessage("");
//     try {
//       if (!firebaseAuth) {
//         const missing =
//           Array.isArray(firebaseMissingKeys) && firebaseMissingKeys.length
//             ? firebaseMissingKeys.join(", ")
//             : "Firebase config";
//         setMessage(`Google login is not configured. Missing: ${missing}.`);
//         return;
//       }
//       const provider = new GoogleAuthProvider();
//       const result = await signInWithPopup(firebaseAuth, provider);
//       const idToken = await result.user.getIdToken();
//       const response = await fetch(`${API_BASE_URL}/api/auth/firebase`, {
//         method: "POST",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify({ token: idToken, role }),
//       });
//       const data = await response.json();
//       if (response.ok) {
//         login(data.user, data.token);
//         if (role === "provider") navigate("/employer/profile");
//         else navigate("/profile");
//         setMessage("Login successful!");
//       } else {
//         setMessage(data?.message || "Google sign-in failed");
//       }
//     } catch (err) {
//       console.error("Google auth error:", err);
//       setMessage("Google sign-in failed. Please try again.");
//     } finally {
//       setLoading(false);
//     }
//   };

//   const handleSeekerRegister = async (e) => {
//     e.preventDefault();
//     setLoading(true);
//     setMessage("");

//     if (seekerForm.password !== seekerForm.confirmPassword) {
//       setMessage("Passwords do not match");
//       setLoading(false);
//       return;
//     }
//     if (seekerForm.password.length < 6) {
//       setMessage("Password must be at least 6 characters");
//       setLoading(false);
//       return;
//     }
//     if (!seekerForm.categoryId || !seekerForm.subcategoryId) {
//       setMessage("Please select a category and subcategory");
//       setLoading(false);
//       return;
//     }

//     try {
//       const payload = {
//         role: "seeker",
//         fullName: seekerForm.fullName,
//         email: seekerForm.email,
//         phone: seekerForm.phone,
//         password: seekerForm.password,
//         categoryId: Number(seekerForm.categoryId),
//         subcategoryId: Number(seekerForm.subcategoryId),
//       };
//       const storedReferralCode = localStorage.getItem("referralCode");
//       if (storedReferralCode) payload.referralCode = storedReferralCode;

//       const response = await fetch(`${API_BASE_URL}/api/auth/register`, {
//         method: "POST",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify(payload),
//       });
//       const data = await response.json();
//       if (response.ok) {
//         setCurrentEmail(seekerForm.email);
//         setCurrentRole("seeker");
//         setIsOtpStep(true);
//         setOtpTimer(60);
//         setResendCount(0);
//         setMessage("OTP sent to your email");
//       } else {
//         setMessage(data?.message || "Registration failed");
//       }
//     } catch {
//       setMessage("Network error. Please try again.");
//     }
//     setLoading(false);
//   };

//   const handleProviderRegister = async (e) => {
//     e.preventDefault();
//     setLoading(true);
//     setMessage("");

//     if (providerForm.password !== providerForm.confirmPassword) {
//       setMessage("Passwords do not match");
//       setLoading(false);
//       return;
//     }
//     if (providerForm.password.length < 6) {
//       setMessage("Password must be at least 6 characters");
//       setLoading(false);
//       return;
//     }
//     if (!providerForm.categoryId || !providerForm.subcategoryId) {
//       setMessage("Please select a category and subcategory");
//       setLoading(false);
//       return;
//     }

//     try {
//       const payload = {
//         role: "provider",
//         fullName: providerForm.fullName,
//         email: providerForm.email,
//         phone: providerForm.phone,
//         password: providerForm.password,
//         categoryId: Number(providerForm.categoryId),
//         subcategoryId: Number(providerForm.subcategoryId),
//       };
//       const storedReferralCode = localStorage.getItem("referralCode");
//       if (storedReferralCode) payload.referralCode = storedReferralCode;

//       const response = await fetch(`${API_BASE_URL}/api/auth/register`, {
//         method: "POST",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify(payload),
//       });
//       const data = await response.json();
//       if (response.ok) {
//         setCurrentEmail(providerForm.email);
//         setCurrentRole("provider");
//         setIsOtpStep(true);
//         setOtpTimer(60);
//         setResendCount(0);
//         setMessage("OTP sent to your email");
//       } else {
//         setMessage(data?.message || "Registration failed");
//       }
//     } catch {
//       setMessage("Network error. Please try again.");
//     }
//     setLoading(false);
//   };

//   // OTP handlers
//   const handleOtpChange = (index, value) => {
//     if (value.length > 1) return;
//     const newOtp = [...otp];
//     newOtp[index] = value;
//     setOtp(newOtp);
//     if (value && index < 5) {
//       const nextInput = document.getElementById(`otp-${index + 1}`);
//       if (nextInput) nextInput.focus();
//     }
//   };

//   const handleOtpKeyDown = (index, e) => {
//     if (e.key === "Backspace" && !otp[index] && index > 0) {
//       const prevInput = document.getElementById(`otp-${index - 1}`);
//       if (prevInput) prevInput.focus();
//     }
//   };

//   const handleOtpPaste = (e) => {
//     e.preventDefault();
//     const paste = e.clipboardData.getData("text");
//     const pasteArray = paste.split("").slice(0, 6);
//     const newOtp = [...otp];
//     pasteArray.forEach((char, index) => {
//       if (index < 6 && /^\d$/.test(char)) newOtp[index] = char;
//     });
//     setOtp(newOtp);
//   };

//   const handleVerifyOtp = async () => {
//     const otpString = otp.join("");
//     if (otpString.length !== 6) {
//       setMessage("Please enter complete OTP");
//       return;
//     }
//     setLoading(true);
//     setMessage("");
//     try {
//       const response = await fetch(`${API_BASE_URL}/api/auth/verify-register-otp`, {
//         method: "POST",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify({ email: currentEmail, otp: otpString }),
//       });
//       const data = await response.json();
//       if (response.ok) {
//         const loginResponse = await fetch(`${API_BASE_URL}/api/auth/login`, {
//           method: "POST",
//           headers: { "Content-Type": "application/json" },
//           body: JSON.stringify({
//             email: currentEmail,
//             password: currentRole === "seeker" ? seekerForm.password : providerForm.password,
//           }),
//         });
//         const loginData = await loginResponse.json();
//         if (loginResponse.ok) {
//           login(loginData.user, loginData.token);
//           localStorage.removeItem("referralCode");
//           setSeekerForm({ fullName: "", email: "", phone: "", password: "", confirmPassword: "", categoryId: "", subcategoryId: "" });
//           setProviderForm({ fullName: "", email: "", phone: "", password: "", confirmPassword: "", categoryId: "", subcategoryId: "" });
//           setIsOtpStep(false);
//           setOtp(["", "", "", "", "", ""]);
//           if (currentRole === "provider") navigate("/employer/profile");
//           else navigate("/profile");
//           setMessage("Registration successful!");
//         } else {
//           setMessage("Registration completed but login failed. Please login manually.");
//         }
//       } else {
//         setMessage(data?.message || "OTP verification failed");
//       }
//     } catch {
//       setMessage("Network error. Please try again.");
//     }
//     setLoading(false);
//   };

//   const handleResendOtp = async () => {
//     if (resendCount >= 5) {
//       setMessage("Maximum resend attempts reached");
//       return;
//     }
//     setLoading(true);
//     setMessage("");
//     try {
//       const response = await fetch(`${API_BASE_URL}/api/auth/resend-register-otp`, {
//         method: "POST",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify({ email: currentEmail }),
//       });
//       const data = await response.json();
//       if (response.ok) {
//         setResendCount((prev) => prev + 1);
//         setOtpTimer(60);
//         setMessage("OTP resent to your email");
//       } else {
//         setMessage(data?.message || "Failed to resend OTP");
//       }
//     } catch {
//       setMessage("Network error. Please try again.");
//     }
//     setLoading(false);
//   };

//   const handleBackToRegister = () => {
//     setIsOtpStep(false);
//     setOtp(["", "", "", "", "", ""]);
//     setOtpTimer(60);
//     setResendCount(0);
//     setMessage("");
//   };

//   // ─── Inline style objects ──────────────────────────────────────────────────

//   const styles = {
//     page: {
//       minHeight: "100vh",
//       background: "#F8F7F4",
//       display: "flex",
//       alignItems: "center",
//       justifyContent: "center",
//       padding: "40px 16px",
//       fontFamily: "'Segoe UI', system-ui, -apple-system, sans-serif",
//     },
//     card: {
//       background: "#fff",
//       borderRadius: "16px",
//       boxShadow: "none",
//       width: "100%",
//       maxWidth: "480px",
//       padding: "36px 32px 28px",
//     },
//     toast: (success) => ({
//       position: "fixed",
//       top: "20px",
//       right: "20px",
//       zIndex: 9999,
//       maxWidth: "min(360px, calc(100vw - 32px))",
//       padding: "12px 16px",
//       borderRadius: "10px",
//       fontSize: "14px",
//       fontWeight: 600,
//       lineHeight: 1.4,
//       boxShadow: "0 8px 24px rgba(15,23,42,0.14)",
//       background: success ? "#ecfdf5" : "#ffe5e5",
//       color: success ? "#047857" : "#ff0000",
//       border: `1px solid ${success ? "#a7f3d0" : "#ffb3b3"}`,
//     }),
//     heading: {
//       textAlign: "center",
//       fontSize: "22px",
//       fontWeight: 700,
//       color: "#0f172a",
//       margin: "0 0 20px",
//     },
//     tabRow: {
//       display: "flex",
//       borderRadius: "8px",
//       overflow: "hidden",
//       border: "1.5px solid #e5e7eb",
//       marginBottom: "24px",
//     },
//     tab: (active) => ({
//       flex: 1,
//       padding: "10px 0",
//       textAlign: "center",
//       fontSize: "14px",
//       fontWeight: 600,
//       cursor: "pointer",
//       border: "none",
//       outline: "none",
//       transition: "background 0.18s, color 0.18s",
//       background: active ? "#16a34a" : "#f8fafc",
//       color: active ? "#fff" : "#64748b",
//     }),
//     form: {
//       display: "flex",
//       flexDirection: "column",
//       gap: "14px",
//     },
//     input: {
//       padding: "12px 13px",
//       borderRadius: "7px",
//       border: "1.5px solid #e5e7eb",
//       fontSize: "15px",
//       background: "#f8fafc",
//       color: "#222",
//       outline: "none",
//       transition: "border 0.18s, box-shadow 0.18s",
//       width: "100%",
//       boxSizing: "border-box",
//     },
//     submitBtn: (disabled) => ({
//       background: disabled ? "#a3a3a3" : "#16a34a",
//       color: "#fff",
//       border: "none",
//       borderRadius: "7px",
//       padding: "13px 0",
//       fontSize: "15px",
//       fontWeight: 700,
//       marginTop: "4px",
//       cursor: disabled ? "not-allowed" : "pointer",
//       boxShadow: "0 2px 8px rgba(16,185,129,0.08)",
//       transition: "background 0.18s",
//       width: "100%",
//     }),
//     orDivider: {
//       textAlign: "center",
//       color: "#94a3b8",
//       margin: "16px 0 8px",
//       fontSize: "13px",
//       fontWeight: 500,
//       position: "relative",
//     },
//     googleBtn: {
//       width: "100%",
//       display: "flex",
//       justifyContent: "center",
//       alignItems: "center",
//       gap: "8px",
//       padding: "10px 18px",
//       background: "#fff",
//       color: "#ea4335",
//       border: "1.5px solid #ea4335",
//       borderRadius: "7px",
//       fontSize: "14px",
//       fontWeight: 600,
//       cursor: "pointer",
//       textDecoration: "none",
//       transition: "background 0.18s, color 0.18s",
//       boxSizing: "border-box",
//     },
//     switchText: {
//       textAlign: "center",
//       marginTop: "16px",
//       fontSize: "13.5px",
//       color: "#64748b",
//     },
//     switchLink: {
//       color: "#2563eb",
//       textDecoration: "underline",
//       cursor: "pointer",
//       background: "none",
//       border: "none",
//       padding: 0,
//       fontSize: "13.5px",
//     },
//     otpContainer: {
//       display: "flex",
//       justifyContent: "center",
//       gap: "8px",
//       marginBottom: "20px",
//     },
//     otpInput: {
//       width: "44px",
//       height: "44px",
//       textAlign: "center",
//       border: "1.5px solid #e5e7eb",
//       borderRadius: "7px",
//       fontSize: "20px",
//       background: "#f8fafc",
//       outline: "none",
//       transition: "border-color 0.2s",
//     },
//     timerText: (expired) => ({
//       textAlign: "center",
//       marginBottom: "16px",
//       fontSize: "13.5px",
//       color: expired ? "#dc2626" : "#64748b",
//     }),
//     resendBtn: (disabled) => ({
//       background: "none",
//       border: "none",
//       color: disabled ? "#dc2626" : "#2563eb",
//       textDecoration: "underline",
//       cursor: disabled ? "not-allowed" : "pointer",
//       fontSize: "13.5px",
//       padding: 0,
//     }),
//     backBtn: {
//       background: "none",
//       border: "none",
//       color: "#64748b",
//       textDecoration: "underline",
//       cursor: "pointer",
//       fontSize: "13.5px",
//       padding: 0,
//     },
//   };

//   const [googleHover, setGoogleHover] = useState(false);

//   return (
//     <div style={styles.page}>
//       {/* Toast */}
//       {message && (
//         <div style={styles.toast(isSuccessMessage(message))} role="alert">
//           {message}
//         </div>
//       )}

//       <div style={styles.card}>
//         {!isOtpStep ? (
//           <>
//             {/* Tab switcher */}
//             <div style={styles.tabRow}>
//               <button
//                 type="button"
//                 style={styles.tab(registerType === "seeker")}
//                 onClick={() => {
//                   setRegisterType("seeker");
//                   setMessage("");
//                 }}
//               >
//                 Job Seeker
//               </button>
//               <button
//                 type="button"
//                 style={styles.tab(registerType === "provider")}
//                 onClick={() => {
//                   setRegisterType("provider");
//                   setMessage("");
//                 }}
//               >
//                 Employer
//               </button>
//             </div>

//             {/* Seeker form */}
//             {registerType === "seeker" && (
//               <>
//                 <h1 style={styles.heading}>Create Your Account</h1>
//                 <form style={styles.form} onSubmit={handleSeekerRegister} autoComplete="off">
//                   <input
//                     style={styles.input}
//                     type="text"
//                     placeholder="Full Name"
//                     value={seekerForm.fullName}
//                     onChange={(e) => setSeekerForm({ ...seekerForm, fullName: e.target.value })}
//                     required
//                   />
//                   <input
//                     style={styles.input}
//                     type="email"
//                     placeholder="Email Address"
//                     value={seekerForm.email}
//                     onChange={(e) => setSeekerForm({ ...seekerForm, email: e.target.value })}
//                     required
//                   />
//                   <input
//                     style={styles.input}
//                     type="tel"
//                     placeholder="Phone Number"
//                     value={seekerForm.phone}
//                     onChange={(e) => setSeekerForm({ ...seekerForm, phone: e.target.value })}
//                   />
//                   <input
//                     style={styles.input}
//                     type="password"
//                     placeholder="Password"
//                     value={seekerForm.password}
//                     onChange={(e) => setSeekerForm({ ...seekerForm, password: e.target.value })}
//                     required
//                   />
//                   <input
//                     style={styles.input}
//                     type="password"
//                     placeholder="Confirm Password"
//                     value={seekerForm.confirmPassword}
//                     onChange={(e) => setSeekerForm({ ...seekerForm, confirmPassword: e.target.value })}
//                     required
//                   />
//                   <RegistrationCategoryFields
//                     required
//                     value={{ categoryId: seekerForm.categoryId, subcategoryId: seekerForm.subcategoryId }}
//                     onChange={({ categoryId, subcategoryId }) =>
//                       setSeekerForm({ ...seekerForm, categoryId, subcategoryId })
//                     }
//                   />
//                   <button type="submit" style={styles.submitBtn(loading)} disabled={loading}>
//                     {loading ? "Sending OTP..." : "Create Account"}
//                   </button>
//                 </form>

//                 <div style={styles.orDivider}>OR</div>

//                 <button
//                   type="button"
//                   style={{
//                     ...styles.googleBtn,
//                     ...(googleHover ? { background: "#ea4335", color: "#fff" } : {}),
//                   }}
//                   onMouseEnter={() => setGoogleHover(true)}
//                   onMouseLeave={() => setGoogleHover(false)}
//                   onClick={() => handleGoogleAuth("seeker")}
//                 >
//                   <img
//                     src="/assets/img/google.png"
//                     alt="Google"
//                     style={{ width: "20px", height: "20px", display: "block", flexShrink: 0 }}
//                   />
//                   Continue with Google
//                 </button>

//                 <p style={styles.switchText}>
//                   Already have an account?{" "}
//                   <Link to="/login" style={{ color: "#2563eb" }}>
//                     Sign in
//                   </Link>
//                 </p>
//               </>
//             )}

//             {/* Provider form */}
//             {registerType === "provider" && (
//               <>
//                 <h1 style={styles.heading}>Employer Registration</h1>
//                 <form style={styles.form} onSubmit={handleProviderRegister} autoComplete="off">
//                   <input
//                     style={styles.input}
//                     type="text"
//                     placeholder="Full Name"
//                     value={providerForm.fullName}
//                     onChange={(e) => setProviderForm({ ...providerForm, fullName: e.target.value })}
//                     required
//                   />
//                   <input
//                     style={styles.input}
//                     type="email"
//                     placeholder="Email Address"
//                     value={providerForm.email}
//                     onChange={(e) => setProviderForm({ ...providerForm, email: e.target.value })}
//                     required
//                   />
//                   <input
//                     style={styles.input}
//                     type="tel"
//                     placeholder="Phone Number"
//                     value={providerForm.phone}
//                     onChange={(e) => setProviderForm({ ...providerForm, phone: e.target.value })}
//                   />
//                   <input
//                     style={styles.input}
//                     type="password"
//                     placeholder="Password"
//                     value={providerForm.password}
//                     onChange={(e) => setProviderForm({ ...providerForm, password: e.target.value })}
//                     required
//                   />
//                   <input
//                     style={styles.input}
//                     type="password"
//                     placeholder="Confirm Password"
//                     value={providerForm.confirmPassword}
//                     onChange={(e) => setProviderForm({ ...providerForm, confirmPassword: e.target.value })}
//                     required
//                   />
//                   <RegistrationCategoryFields
//                     required
//                     value={{ categoryId: providerForm.categoryId, subcategoryId: providerForm.subcategoryId }}
//                     onChange={({ categoryId, subcategoryId }) =>
//                       setProviderForm({ ...providerForm, categoryId, subcategoryId })
//                     }
//                   />
//                   <button type="submit" style={styles.submitBtn(loading)} disabled={loading}>
//                     {loading ? "Sending OTP..." : "Create Account"}
//                   </button>
//                 </form>

//                 <div style={styles.orDivider}>OR</div>

//                 <button
//                   type="button"
//                   style={{
//                     ...styles.googleBtn,
//                     ...(googleHover ? { background: "#ea4335", color: "#fff" } : {}),
//                   }}
//                   onMouseEnter={() => setGoogleHover(true)}
//                   onMouseLeave={() => setGoogleHover(false)}
//                   onClick={() => handleGoogleAuth("provider")}
//                 >
//                   <img
//                     src="/assets/img/google.png"
//                     alt="Google"
//                     style={{ width: "20px", height: "20px", display: "block", flexShrink: 0 }}
//                   />
//                   Continue with Google
//                 </button>

//                 <p style={styles.switchText}>
//                   Already have an account?{" "}
//                   <Link to="/login" style={{ color: "#2563eb" }}>
//                     Sign in
//                   </Link>
//                 </p>
//               </>
//             )}
//           </>
//         ) : (
//           // OTP verification step
//           <>
//             <h1 style={styles.heading}>Verify Your Email</h1>
//             <p
//               style={{
//                 textAlign: "center",
//                 marginBottom: "24px",
//                 color: "#64748b",
//                 fontSize: "14px",
//               }}
//             >
//               We sent a 6-digit OTP to <strong>{currentEmail}</strong>
//             </p>

//             <div style={styles.otpContainer}>
//               {otp.map((digit, index) => (
//                 <input
//                   key={index}
//                   id={`otp-${index}`}
//                   type="text"
//                   inputMode="numeric"
//                   value={digit}
//                   onChange={(e) => handleOtpChange(index, e.target.value.replace(/\D/g, ""))}
//                   onKeyDown={(e) => handleOtpKeyDown(index, e)}
//                   onPaste={handleOtpPaste}
//                   maxLength="1"
//                   style={styles.otpInput}
//                   autoFocus={index === 0}
//                 />
//               ))}
//             </div>

//             <p style={styles.timerText(otpTimer === 0)}>
//               {otpTimer > 0 ? `Resend OTP in ${otpTimer}s` : "OTP expired"}
//             </p>

//             <button
//               type="button"
//               style={styles.submitBtn(loading || otp.some((d) => !d))}
//               disabled={loading || otp.some((d) => !d)}
//               onClick={handleVerifyOtp}
//             >
//               {loading ? "Verifying..." : "Verify & Complete Registration"}
//             </button>

//             <div style={{ textAlign: "center", marginTop: "14px" }}>
//               <button
//                 type="button"
//                 onClick={handleResendOtp}
//                 disabled={loading || resendCount >= 5 || otpTimer > 0}
//                 style={styles.resendBtn(resendCount >= 5 || otpTimer > 0)}
//               >
//                 {resendCount >= 5
//                   ? "Resend limit reached"
//                   : `Resend OTP${resendCount > 0 ? ` (${5 - resendCount} attempts left)` : ""}`}
//               </button>
//             </div>

//             <div style={{ textAlign: "center", marginTop: "10px" }}>
//               <button type="button" onClick={handleBackToRegister} style={styles.backBtn}>
//                 ← Back to Registration
//               </button>
//             </div>
//           </>
//         )}
//       </div>
//     </div>
//   );
// }

// export default RegisterPage;
import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { API_BASE_URL } from "../config/api";
import { GoogleAuthProvider, signInWithPopup } from "firebase/auth";
import { auth as firebaseAuth, missingKeys as firebaseMissingKeys } from "../config/firebaseClient";

// Match express-validator normalizeEmail() so verify/resend use the same key stored on register.
function normalizeRegistrationEmail(email) {
  const trimmed = String(email || "").trim();
  if (!trimmed) return "";
  const parts = trimmed.toLowerCase().split("@");
  if (parts.length !== 2) return trimmed.toLowerCase();
  let [local, domain] = parts;
  if (domain === "googlemail.com") domain = "gmail.com";
  if (domain === "gmail.com") {
    local = local.split("+")[0].replace(/\./g, "");
  }
  return `${local}@${domain}`;
}

function RegisterPage() {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [seekerForm, setSeekerForm] = useState({
    fullName: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
  });

  const [isOtpStep, setIsOtpStep] = useState(false);
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [otpTimer, setOtpTimer] = useState(60);
  const [resendCount, setResendCount] = useState(0);
  const [currentEmail, setCurrentEmail] = useState("");
  const [currentRole, setCurrentRole] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const messageTimerRef = React.useRef(null);

  // Password visibility toggles
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // ─── Login Modal States (logic ported from Footer.js) ──────────────────────
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [loginPanel, setLoginPanel] = useState("seeker"); // 'seeker' | 'provider'
  const [seekerLogin, setSeekerLogin] = useState({ email: "", password: "" });
  const [providerLogin, setProviderLogin] = useState({ email: "", password: "" });
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginMessage, setLoginMessage] = useState("");
  const loginMessageTimerRef = React.useRef(null);

  // Forgot password states
  const [forgotModalOpen, setForgotModalOpen] = useState(false);
  const [forgotStep, setForgotStep] = useState(1);
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotOtp, setForgotOtp] = useState(["", "", "", "", "", ""]);
  const [forgotOtpTimer, setForgotOtpTimer] = useState(60);
  const [forgotResendCount, setForgotResendCount] = useState(0);
  const [forgotNewPassword, setForgotNewPassword] = useState("");
  const [forgotConfirmPassword, setForgotConfirmPassword] = useState("");
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotMessage, setForgotMessage] = useState("");

  React.useEffect(() => {
    let interval;
    if (isOtpStep && otpTimer > 0) {
      interval = setInterval(() => setOtpTimer((prev) => prev - 1), 1000);
    }
    return () => clearInterval(interval);
  }, [isOtpStep, otpTimer]);

  // Forgot password timer effect
  React.useEffect(() => {
    let interval;
    if (showLoginModal && forgotModalOpen && forgotStep === 2 && forgotOtpTimer > 0) {
      interval = setInterval(() => {
        setForgotOtpTimer((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [showLoginModal, forgotModalOpen, forgotStep, forgotOtpTimer]);

  const isSuccessMessage = (text) => {
    const t = String(text || "").toLowerCase();
    if (!t) return false;
    if (
      t.includes("not found") ||
      t.includes("incorrect") ||
      t.includes("failed") ||
      t.includes("error") ||
      t.includes("do not match") ||
      t.includes("at least") ||
      t.includes("maximum resend") ||
      t.includes("missing:")
    ) return false;
    return t.includes("success") || t.includes("otp sent") || t.includes("otp resent");
  };

  React.useEffect(() => {
    if (!message) return;
    if (messageTimerRef.current) clearTimeout(messageTimerRef.current);
    const hideMs = isSuccessMessage(message) ? 3000 : 4000;
    messageTimerRef.current = setTimeout(() => {
      setMessage("");
      messageTimerRef.current = null;
    }, hideMs);
    return () => {
      if (messageTimerRef.current) {
        clearTimeout(messageTimerRef.current);
        messageTimerRef.current = null;
      }
    };
  }, [message]);

  // Login modal message auto-hide
  React.useEffect(() => {
    if (!loginMessage) return undefined;
    if (loginMessageTimerRef.current) {
      clearTimeout(loginMessageTimerRef.current);
    }
    const hideMs = isSuccessMessage(loginMessage) ? 3000 : 4000;
    loginMessageTimerRef.current = setTimeout(() => {
      setLoginMessage("");
      loginMessageTimerRef.current = null;
    }, hideMs);
    return () => {
      if (loginMessageTimerRef.current) {
        clearTimeout(loginMessageTimerRef.current);
        loginMessageTimerRef.current = null;
      }
    };
  }, [loginMessage]);

  const handleGoogleAuth = async (role) => {
    setLoading(true);
    setMessage("");
    try {
      if (!firebaseAuth) {
        const missing =
          Array.isArray(firebaseMissingKeys) && firebaseMissingKeys.length
            ? firebaseMissingKeys.join(", ")
            : "Firebase config";
        setMessage(`Google login is not configured. Missing: ${missing}.`);
        return;
      }
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(firebaseAuth, provider);
      const idToken = await result.user.getIdToken();
      const response = await fetch(`${API_BASE_URL}/api/auth/firebase`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: idToken, role }),
      });
      const data = await response.json();
      if (response.ok) {
        login(data.user, data.token);
        if (data.user?.role === "provider") navigate("/employer/profile");
        else navigate("/profile");
        setMessage("Login successful!");
      } else {
        setMessage(data?.message || "Google sign-in failed");
      }
    } catch (err) {
      console.error("Google auth error:", err);
      setMessage("Google sign-in failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // ─── Login modal: Google auth (mirrors Footer.js handleGoogleAuth) ──────────
  const handleLoginGoogleAuth = async (role) => {
    setLoginLoading(true);
    setLoginMessage("");
    try {
      if (!firebaseAuth) {
        const missing =
          Array.isArray(firebaseMissingKeys) && firebaseMissingKeys.length
            ? firebaseMissingKeys.join(", ")
            : "Firebase config";
        setLoginMessage(`Google login is not configured. Missing: ${missing}.`);
        return;
      }
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(firebaseAuth, provider);
      const idToken = await result.user.getIdToken();
      const response = await fetch(`${API_BASE_URL}/api/auth/firebase`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: idToken, role }),
      });
      const data = await response.json();
      if (response.ok) {
        login(data.user, data.token);
        setShowLoginModal(false);
        if (data.user?.role === "provider") navigate("/employer/profile");
        else navigate("/profile");
        setLoginMessage("Login successful!");
      } else {
        setLoginMessage(data?.message || "Google sign-in failed");
      }
    } catch (err) {
      console.error("Google auth error:", err);
      setLoginMessage("Google sign-in failed. Please try again.");
    } finally {
      setLoginLoading(false);
    }
  };

  const handleSeekerRegister = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    if (seekerForm.password !== seekerForm.confirmPassword) {
      setMessage("Passwords do not match");
      setLoading(false);
      return;
    }
    if (seekerForm.password.length < 6) {
      setMessage("Password must be at least 6 characters");
      setLoading(false);
      return;
    }
    try {
      const registrationEmail = normalizeRegistrationEmail(seekerForm.email);
      const payload = {
        role: "seeker",
        fullName: seekerForm.fullName,
        email: registrationEmail,
        password: seekerForm.password,
      };
      const trimmedPhone = String(seekerForm.phone || "").trim();
      if (trimmedPhone) payload.phone = trimmedPhone;
      const storedReferralCode = localStorage.getItem("referralCode");
      if (storedReferralCode) payload.referralCode = storedReferralCode;

      const response = await fetch(`${API_BASE_URL}/api/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await response.json();
      if (response.ok) {
        setCurrentEmail(registrationEmail);
        setCurrentRole("seeker");
        setIsOtpStep(true);
        setOtpTimer(60);
        setResendCount(0);
        setMessage("OTP sent to your email");
      } else {
        const errMsg = data?.message
          || (Array.isArray(data?.errors) && data.errors[0]?.msg)
          || "Registration failed";
        setMessage(errMsg);
      }
    } catch {
      setMessage("Network error. Please try again.");
    }
    setLoading(false);
  };

  // OTP handlers
  const handleOtpChange = (index, value) => {
    if (value.length > 1) return;
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);
    if (value && index < 5) {
      const nextInput = document.getElementById(`register-page-otp-${index + 1}`);
      if (nextInput) nextInput.focus();
    }
  };

  const handleOtpKeyDown = (index, e) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      const prevInput = document.getElementById(`register-page-otp-${index - 1}`);
      if (prevInput) prevInput.focus();
    }
  };

  const handleOtpPaste = (e) => {
    e.preventDefault();
    const paste = e.clipboardData.getData("text");
    const pasteArray = paste.split("").slice(0, 6);
    const newOtp = [...otp];
    pasteArray.forEach((char, index) => {
      if (index < 6 && /^\d$/.test(char)) newOtp[index] = char;
    });
    setOtp(newOtp);
  };

  const handleVerifyOtp = async () => {
    const otpString = otp.join("");
    if (otpString.length !== 6) {
      setMessage("Please enter complete OTP");
      return;
    }
    setLoading(true);
    setMessage("");

    const verifyEmail = normalizeRegistrationEmail(currentEmail || seekerForm.email);

    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/verify-register-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: verifyEmail,
          otp: otpString,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        const loginResponse = await fetch(`${API_BASE_URL}/api/auth/login`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: verifyEmail,
            password: seekerForm.password,
          }),
        });

        const loginData = await loginResponse.json();

        if (loginResponse.ok) {
          login(loginData.user, loginData.token);
          localStorage.removeItem("referralCode");
          setSeekerForm({
            fullName: "",
            email: "",
            phone: "",
            password: "",
            confirmPassword: "",
          });
          setIsOtpStep(false);
          setOtp(["", "", "", "", "", ""]);
          setCurrentEmail("");
          setCurrentRole("");
          navigate("/profile");
          setMessage("Registration successful!");
        } else {
          setMessage("Registration completed but login failed. Please login manually.");
        }
      } else {
        setMessage(data?.message || "OTP verification failed");
      }
    } catch {
      setMessage("Network error. Please try again.");
    }
    setLoading(false);
  };

  const handleResendOtp = async () => {
    if (resendCount >= 5) {
      setMessage("Maximum resend attempts reached");
      return;
    }
    setLoading(true);
    setMessage("");

    const resendEmail = normalizeRegistrationEmail(currentEmail || seekerForm.email);

    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/resend-register-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: resendEmail }),
      });
      const data = await response.json();
      if (response.ok) {
        setResendCount((prev) => prev + 1);
        setOtpTimer(60);
        setMessage("OTP resent to your email");
      } else {
        setMessage(data?.message || "Failed to resend OTP");
      }
    } catch {
      setMessage("Network error. Please try again.");
    }
    setLoading(false);
  };

  const handleBackToRegister = () => {
    setIsOtpStep(false);
    setOtp(["", "", "", "", "", ""]);
    setOtpTimer(60);
    setResendCount(0);
    setCurrentEmail("");
    setCurrentRole("");
    setMessage("");
  };

  // ─── Login Modal handlers (ported from Footer.js) ──────────────────────────

  const resetLoginModalView = () => {
    setLoginPanel("seeker");
    setForgotModalOpen(false);
    setForgotStep(1);
    setForgotEmail("");
    setForgotOtp(["", "", "", "", "", ""]);
    setForgotOtpTimer(60);
    setForgotResendCount(0);
    setForgotNewPassword("");
    setForgotConfirmPassword("");
    setForgotLoading(false);
    setForgotMessage("");
    setLoginMessage("");
    setSeekerLogin({ email: "", password: "" });
    setProviderLogin({ email: "", password: "" });
  };

  const openLoginModal = (panel = "seeker") => {
    resetLoginModalView();
    setLoginPanel(panel);
    setShowLoginModal(true);
  };

  const closeLoginModal = () => {
    setShowLoginModal(false);
    resetLoginModalView();
  };

  const handleSeekerLogin = async (e) => {
    e.preventDefault();
    setLoginLoading(true);
    setLoginMessage("");

    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: seekerLogin.email,
          password: seekerLogin.password,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        login(data.user, data.token);
        setLoginMessage("Login successful!");
        setShowLoginModal(false);
        navigate("/profile");
      } else {
        setLoginMessage(data.message || "Login failed");
      }
    } catch (error) {
      setLoginMessage("Network error. Please try again.");
    }
    setLoginLoading(false);
  };

  const handleProviderLogin = async (e) => {
    e.preventDefault();
    setLoginLoading(true);
    setLoginMessage("");

    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: providerLogin.email,
          password: providerLogin.password,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        login(data.user, data.token);
        setLoginMessage("Login successful!");
        setShowLoginModal(false);
        navigate("/employer/profile");
      } else {
        setLoginMessage(data.message || "Login failed");
      }
    } catch (error) {
      setLoginMessage("Network error. Please try again.");
    }
    setLoginLoading(false);
  };

  // Forgot password handlers
  const handleForgotSendOTP = async () => {
    if (!forgotEmail) {
      setForgotMessage("Please enter your email");
      return;
    }
    setForgotLoading(true);
    setForgotMessage("");
    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/forgot-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: forgotEmail }),
      });
      const data = await response.json();
      if (response.ok) {
        setForgotStep(2);
        setForgotOtpTimer(60);
        setForgotResendCount(0);
        setForgotMessage("OTP sent to your email");
      } else {
        setForgotMessage(data?.message || "Failed to send OTP");
      }
    } catch (error) {
      setForgotMessage("Network error. Please try again.");
    }
    setForgotLoading(false);
  };

  const handleForgotOtpChange = (index, value) => {
    if (value.length > 1) return;
    const newOtp = [...forgotOtp];
    newOtp[index] = value;
    setForgotOtp(newOtp);
    if (value && index < 5) {
      const nextInput = document.getElementById(`forgot-otp-${index + 1}`);
      if (nextInput) nextInput.focus();
    }
  };

  const handleForgotOtpKeyDown = (index, e) => {
    if (e.key === "Backspace" && !forgotOtp[index] && index > 0) {
      const prevInput = document.getElementById(`forgot-otp-${index - 1}`);
      if (prevInput) prevInput.focus();
    }
  };

  const handleForgotOtpPaste = (e) => {
    e.preventDefault();
    const paste = e.clipboardData.getData("text");
    const pasteArray = paste.split("").slice(0, 6);
    const newOtp = [...forgotOtp];
    pasteArray.forEach((char, index) => {
      if (index < 6 && /^\d$/.test(char)) {
        newOtp[index] = char;
      }
    });
    setForgotOtp(newOtp);
  };

  const handleForgotVerifyOtp = async () => {
    const otpString = forgotOtp.join("");
    if (otpString.length !== 6) {
      setForgotMessage("Please enter complete OTP");
      return;
    }
    setForgotLoading(true);
    setForgotMessage("");
    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/verify-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: forgotEmail, otp: otpString }),
      });
      const data = await response.json();
      if (response.ok) {
        setForgotStep(3);
        setForgotMessage("OTP verified successfully");
      } else {
        setForgotMessage(data?.message || "OTP verification failed");
      }
    } catch (error) {
      setForgotMessage("Network error. Please try again.");
    }
    setForgotLoading(false);
  };

  const handleForgotResendOtp = async () => {
    if (forgotResendCount >= 5) {
      setForgotMessage("Maximum resend attempts reached");
      return;
    }
    setForgotLoading(true);
    setForgotMessage("");
    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/resend-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: forgotEmail }),
      });
      const data = await response.json();
      if (response.ok) {
        setForgotResendCount((prev) => prev + 1);
        setForgotOtpTimer(60);
        setForgotMessage("OTP resent to your email");
      } else {
        setForgotMessage(data?.message || "Failed to resend OTP");
      }
    } catch (error) {
      setForgotMessage("Network error. Please try again.");
    }
    setForgotLoading(false);
  };

  const handleForgotResetPassword = async () => {
    if (!forgotNewPassword || !forgotConfirmPassword) {
      setForgotMessage("Please fill all fields");
      return;
    }
    if (forgotNewPassword !== forgotConfirmPassword) {
      setForgotMessage("Passwords do not match");
      return;
    }
    if (forgotNewPassword.length < 6) {
      setForgotMessage("Password must be at least 6 characters");
      return;
    }
    setForgotLoading(true);
    setForgotMessage("");
    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: forgotEmail,
          newPassword: forgotNewPassword,
          confirmPassword: forgotConfirmPassword,
        }),
      });
      const data = await response.json();
      if (response.ok) {
        setForgotMessage("Password reset successfully");
        setTimeout(() => {
          handleForgotClose();
        }, 2000);
      } else {
        setForgotMessage(data?.message || "Failed to reset password");
      }
    } catch (error) {
      setForgotMessage("Network error. Please try again.");
    }
    setForgotLoading(false);
  };

  const handleForgotClose = () => {
    setForgotModalOpen(false);
    setForgotStep(1);
    setForgotEmail("");
    setForgotOtp(["", "", "", "", "", ""]);
    setForgotOtpTimer(60);
    setForgotResendCount(0);
    setForgotNewPassword("");
    setForgotConfirmPassword("");
    setForgotLoading(false);
    setForgotMessage("");
  };

  // ─── Styles ──────────────────────────────────────────────────────────────

  const styles = {
    page: {
      minHeight: "100vh",
      height: "100vh",
      background: "#fff",
      display: "flex",
      flexDirection: "column",
      fontFamily: "'Segoe UI', system-ui, -apple-system, sans-serif",
      overflow: "hidden",
    },

    // Top bar (full width, in document flow)
    topBar: {
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      padding: "14px 40px",
      background: "#fff",
      flexShrink: 0,
      zIndex: 5,
      borderBottom: "1px solid #e5e7eb",
    },
    contentRow: {
      display: "flex",
      flex: 1,
      minHeight: 0,
      overflow: "hidden",
    },
    logoWrap: {
      display: "flex",
      alignItems: "center",
    },
    logoImg: {
      height: "36px",
      width: "auto",
      display: "block",
    },
    topRight: {
      fontSize: "14.5px",
      color: "#475569",
    },
    topLoginLink: {
      color: "#2563eb",
      textDecoration: "underline",
      fontWeight: 700,
      textDecoration: "none",
      marginLeft: "6px",
      cursor: "pointer",
      background: "none",
      border: "none",
      fontSize: "14.5px",
    },

    // Left panel
    leftPanel: {
      flex: "0 0 42%",
      maxWidth: "42%",
      height: "100%",
      background: "linear-gradient(180deg, #f0f7f1 0%, #e3f0e6 100%)",
      display: "flex",
      flexDirection: "column",
      justifyContent: "flex-start",
      padding: "24px 40px 20px",
      position: "relative",
      overflow: "hidden",
      flexShrink: 0,
    },
    leftHeading: {
      fontSize: "34px",
      fontWeight: 800,
      color: "#0f172a",
      lineHeight: 1.15,
      margin: 0,
    },
    leftHeadingAccent: {
      color: "#16a34a",
    },
    leftSub: {
      fontSize: "14px",
      color: "#64748b",
      marginTop: "10px",
      marginBottom: "18px",
      maxWidth: "380px",
      lineHeight: 1.5,
    },
    featureRow: {
      display: "flex",
      alignItems: "flex-start",
      gap: "12px",
      marginBottom: "12px",
    },
    featureIcon: {
      width: "36px",
      height: "36px",
      borderRadius: "50%",
      background: "#d6ecdc",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      flexShrink: 0,
    },
    featureTitle: {
      fontSize: "14px",
      fontWeight: 700,
      color: "#0f172a",
      margin: "0 0 2px",
    },
    featureDesc: {
      fontSize: "12.5px",
      color: "#64748b",
      margin: 0,
      lineHeight: 1.4,
      maxWidth: "300px",
    },
    heroImageWrap: {
      marginTop: "10px",
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      flex: 1,
      minHeight: 0,
    },
    heroImage: {
      width: "100%",
      maxWidth: "360px",
      maxHeight: "min(200px, 28vh)",
      height: "auto",
      display: "block",
      objectFit: "contain",
    },

    // Right panel
    rightPanel: {
      flex: 1,
      display: "flex",
      alignItems: "flex-start",
      justifyContent: "stretch",
      padding: "20px 28px",
      minHeight: 0,
      overflowY: "auto",
      overflowX: "hidden",
      background: "#fff",
    },
    card: {
      width: "100%",
      maxWidth: "none",
      background: "#fff",
      borderRadius: "12px",
      boxShadow: "0 4px 24px rgba(15, 23, 42, 0.08)",
      padding: "20px 24px",
      boxSizing: "border-box",
      overflow: "visible",
      position: "relative",
      zIndex: 2,
    },
    cardHeading: {
      fontSize: "22px",
      fontWeight: 800,
      color: "#0f172a",
      margin: "0 0 4px",
    },
    cardSub: {
      fontSize: "13.5px",
      color: "#64748b",
      margin: "0 0 14px",
    },

    toast: (success) => ({
      position: "fixed",
      top: "20px",
      right: "20px",
      zIndex: 9999,
      maxWidth: "min(360px, calc(100vw - 32px))",
      padding: "12px 16px",
      borderRadius: "10px",
      fontSize: "14px",
      fontWeight: 600,
      lineHeight: 1.4,
      boxShadow: "0 8px 24px rgba(15,23,42,0.14)",
      background: success ? "#ecfdf5" : "#ffe5e5",
      color: success ? "#047857" : "#ff0000",
      border: `1px solid ${success ? "#a7f3d0" : "#ffb3b3"}`,
    }),

    form: {
      display: "flex",
      flexDirection: "column",
      gap: "10px",
      overflow: "visible",
      position: "relative",
    },
    fieldGrid: {
      display: "grid",
      gridTemplateColumns: "1fr 1fr",
      gap: "10px",
    },
    field: {
      display: "flex",
      flexDirection: "column",
      gap: "4px",
    },
    label: {
      fontSize: "12.5px",
      fontWeight: 700,
      color: "#0f172a",
    },
    selectInput: {
      padding: "9px 12px",
      borderRadius: "8px",
      border: "1.5px solid #e5e7eb",
      fontSize: "13.5px",
      background: "#f8fafc",
      color: "#0f172a",
      outline: "none",
      width: "100%",
      boxSizing: "border-box",
      cursor: "pointer",
      position: "relative",
      zIndex: 30,
      WebkitAppearance: "menulist",
      MozAppearance: "menulist",
      appearance: "auto",
    },
    selectOption: {
      color: "#0f172a",
      background: "#ffffff",
    },
    inputWrap: {
      position: "relative",
      display: "flex",
      alignItems: "center",
    },
    inputIcon: {
      position: "absolute",
      left: "14px",
      color: "#94a3b8",
      display: "flex",
      alignItems: "center",
      pointerEvents: "none",
    },
    input: {
      padding: "9px 12px 9px 38px",
      borderRadius: "8px",
      border: "1.5px solid #e5e7eb",
      fontSize: "13.5px",
      background: "#f8fafc",
      color: "#0f172a",
      outline: "none",
      transition: "border 0.18s, box-shadow 0.18s",
      width: "100%",
      boxSizing: "border-box",
    },
    inputWithEye: {
      paddingRight: "42px",
    },
    eyeBtn: {
      position: "absolute",
      right: "12px",
      background: "none",
      border: "none",
      cursor: "pointer",
      color: "#94a3b8",
      display: "flex",
      alignItems: "center",
      padding: 0,
    },

    submitBtn: (disabled) => ({
      background: disabled ? "#a3d9b1" : "#16a34a",
      color: "#fff",
      border: "none",
      borderRadius: "8px",
      padding: "11px 0",
      fontSize: "14px",
      fontWeight: 700,
      marginTop: "0",
      cursor: disabled ? "not-allowed" : "pointer",
      boxShadow: "0 4px 12px rgba(22,163,74,0.18)",
      transition: "background 0.18s",
      width: "100%",
    }),

    orDivider: {
      display: "flex",
      alignItems: "center",
      gap: "10px",
      color: "#94a3b8",
      margin: "12px 0",
      fontSize: "12px",
      fontWeight: 600,
    },
    orLine: {
      flex: 1,
      height: "1px",
      background: "#e5e7eb",
    },

    socialRow: {
      display: "flex",
      gap: "12px",
    },
    socialBtn: {
      flex: 1,
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      gap: "8px",
      padding: "9px 0",
      background: "#fff",
      color: "#0f172a",
      border: "1.5px solid #e5e7eb",
      borderRadius: "8px",
      fontSize: "13.5px",
      fontWeight: 600,
      cursor: "pointer",
      textDecoration: "none",
      transition: "background 0.18s, border-color 0.18s",
      boxSizing: "border-box",
    },

    switchText: {
      textAlign: "center",
      marginTop: "10px",
      fontSize: "12.5px",
      color: "#64748b",
    },
    switchLink: {
      color: "#2563eb",
      textDecoration: "underline",
      cursor: "pointer",
      background: "none",
      border: "none",
      padding: 0,
      fontSize: "13.5px",
      fontWeight: 700,
    },

    secureFooter: {
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      gap: "6px",
      fontSize: "12px",
      color: "#16a34a",
      fontWeight: 600,
      marginTop: "10px",
    },

    otpContainer: {
      display: "flex",
      justifyContent: "center",
      gap: "10px",
      marginBottom: "22px",
    },
    otpInput: {
      width: "48px",
      height: "52px",
      textAlign: "center",
      border: "1.5px solid #e5e7eb",
      borderRadius: "8px",
      fontSize: "20px",
      fontWeight: 700,
      background: "#f8fafc",
      outline: "none",
      transition: "border-color 0.2s",
    },
    timerText: (expired) => ({
      textAlign: "center",
      marginBottom: "18px",
      fontSize: "13.5px",
      color: expired ? "#dc2626" : "#64748b",
    }),
    resendBtn: (disabled) => ({
      background: "none",
      border: "none",
      color: disabled ? "#dc2626" : "#16a34a",
      textDecoration: "underline",
      cursor: disabled ? "not-allowed" : "pointer",
      fontSize: "13.5px",
      fontWeight: 700,
      padding: 0,
    }),
    backBtn: {
      background: "none",
      border: "none",
      color: "#64748b",
      textDecoration: "underline",
      cursor: "pointer",
      fontSize: "13.5px",
      padding: 0,
    },

    // ── Login Modal Overlay ──────────────────────────────────────────────
    modalOverlay: {
      position: "fixed",
      inset: 0,
      background: "rgba(15,23,42,0.55)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      zIndex: 3000,
      padding: "20px",
    },
    modalBox: {
      background: "#fff",
      borderRadius: "16px",
      width: "100%",
      maxWidth: "440px",
      padding: "32px 28px 24px",
      position: "relative",
      maxHeight: "92vh",
      overflowY: "auto",
      boxShadow: "0 20px 60px rgba(0,0,0,0.25)",
    },
    modalClose: {
      position: "absolute",
      top: "16px",
      right: "16px",
      background: "none",
      border: "none",
      cursor: "pointer",
      color: "#94a3b8",
      fontSize: "22px",
      lineHeight: 1,
      padding: "4px",
    },
    modalHeading: {
      textAlign: "center",
      fontSize: "22px",
      fontWeight: 800,
      color: "#0f172a",
      margin: "0 0 22px",
    },
    alertBox: (success) => ({
      padding: "11px 14px",
      borderRadius: "8px",
      fontSize: "13.5px",
      fontWeight: 600,
      marginBottom: "16px",
      background: success ? "#ecfdf5" : "#fee2e2",
      color: success ? "#047857" : "#dc2626",
      border: `1px solid ${success ? "#a7f3d0" : "#fecaca"}`,
    }),
    modalRow: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      fontSize: "13px",
      color: "#64748b",
      marginTop: "-2px",
    },
    modalCheckbox: {
      display: "flex",
      alignItems: "center",
      gap: "6px",
    },
    modalLink: {
      color: "#16a34a",
      textDecoration: "none",
      fontWeight: 700,
      fontSize: "13px",
      background: "none",
      border: "none",
      cursor: "pointer",
      padding: 0,
    },
  };

  const [googleHover, setGoogleHover] = useState(false);
  const [loginGoogleHover, setLoginGoogleHover] = useState(false);

  const PersonIcon = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  );
  const MailIcon = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="4" width="20" height="16" rx="2" />
      <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
    </svg>
  );
  const PhoneIcon = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z" />
    </svg>
  );
  const LockIcon = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
  );
  const EyeIcon = ({ open }) =>
    open ? (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
        <circle cx="12" cy="12" r="3" />
      </svg>
    ) : (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M9.88 9.88a3 3 0 1 0 4.24 4.24" />
        <path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68" />
        <path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61" />
        <line x1="2" y1="2" x2="22" y2="22" />
      </svg>
    );
  const GoogleIcon = () => (
    <svg width="18" height="18" viewBox="0 0 48 48">
      <path fill="#FFC107" d="M43.611 20.083H42V20H24v8h11.303c-1.649 4.657-6.08 8-11.303 8-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 12.955 4 4 12.955 4 24s8.955 20 20 20 20-8.955 20-20c0-1.341-.138-2.65-.389-3.917z" />
      <path fill="#FF3D00" d="M6.306 14.691l6.571 4.819C14.655 15.108 18.961 12 24 12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 16.318 4 9.656 8.337 6.306 14.691z" />
      <path fill="#4CAF50" d="M24 44c5.166 0 9.86-1.977 13.409-5.192l-6.19-5.238C29.211 35.091 26.715 36 24 36c-5.202 0-9.619-3.317-11.283-7.946l-6.522 5.025C9.505 39.556 16.227 44 24 44z" />
      <path fill="#1976D2" d="M43.611 20.083H42V20H24v8h11.303a12.04 12.04 0 0 1-4.087 5.571l.003-.002 6.19 5.238C36.971 39.205 44 34 44 24c0-1.341-.138-2.65-.389-3.917z" />
    </svg>
  );
  const ShieldIcon = () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z" />
    </svg>
  );
  const BriefcaseFeatureIcon = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="7" width="20" height="14" rx="2" />
      <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
    </svg>
  );
  const ProfileFeatureIcon = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <path d="M14 2v6h6" />
      <path d="M12 18v-6" />
      <path d="M9 15h6" />
    </svg>
  );
  const GrowthFeatureIcon = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
      <polyline points="17 6 23 6 23 12" />
    </svg>
  );

  const currentSubmitDisabled = loading;

  return (
    <div style={styles.page} className="registerPage__page">
      <style>{`
        /* Mobile responsiveness (presentation only) */
        @media (max-width: 768px) {
          .registerPage__page {
            height: auto !important;
            min-height: 100vh !important;
            overflow: auto !important;
          }
          .registerPage__contentRow {
            flex-direction: column !important;
            overflow: visible !important;
          }
          .registerPage__leftPanel {
            display: none !important;
          }
          .registerPage__rightPanel {
            padding: 14px 14px !important;
          }
          .registerPage__card {
            padding: 16px 14px !important;
            overflow: visible !important;
          }
          .registerPage__topBar {
            padding: 12px 14px !important;
          }
          .registerPage__fieldGrid {
            grid-template-columns: 1fr !important;
          }
        }

        @media (max-width: 480px) {
          .registerPage__otpContainer {
            gap: 6px !important;
            margin-bottom: 18px !important;
          }
          .registerPage__otpInput {
            width: 42px !important;
            height: 46px !important;
            font-size: 18px !important;
          }
        }
      `}</style>
      {/* Toast */}
      {message && (
        <div style={styles.toast(isSuccessMessage(message))} role="alert">
          {message}
        </div>
      )}

      {/* Header */}
      <header style={styles.topBar} className="registerPage__topBar">
        <Link to="/" style={styles.logoWrap}>
          <img src="/assets/img/Uptula.png" alt="Uptula Logo" style={styles.logoImg} />
        </Link>
        <div style={styles.topRight}>
        Existing user?
          <button type="button" style={styles.topLoginLink} onClick={() => openLoginModal("seeker")}>
            Login
          </button>
        </div>
      </header>

      <div style={styles.contentRow} className="registerPage__contentRow">
      {/* Left panel */}
      <div style={styles.leftPanel} className="registerPage__leftPanel">
        <h1 style={styles.leftHeading}>
          Find the right job.
          <br />
          <span style={styles.leftHeadingAccent}>Build your future.</span>
        </h1>
        <p style={styles.leftSub}>
          Join thousands of job seekers discovering great opportunities every day.
        </p>

        <div style={styles.featureRow}>
          <div style={styles.featureIcon}>
            <BriefcaseFeatureIcon />
          </div>
          <div>
            <p style={styles.featureTitle}>Explore Jobs</p>
            <p style={styles.featureDesc}>Discover jobs that match your skills and interests.</p>
          </div>
        </div>

        <div style={styles.featureRow}>
          <div style={styles.featureIcon}>
            <ProfileFeatureIcon />
          </div>
          <div>
            <p style={styles.featureTitle}>Create Profile</p>
            <p style={styles.featureDesc}>Build your profile and let employers find you.</p>
          </div>
        </div>

        <div style={styles.featureRow}>
          <div style={styles.featureIcon}>
            <GrowthFeatureIcon />
          </div>
          <div>
            <p style={styles.featureTitle}>Grow Career</p>
            <p style={styles.featureDesc}>Apply, connect and grow your career with confidence.</p>
          </div>
        </div>

        <div style={styles.heroImageWrap}>
          <img
            src="/assets/img/mobile_hero.png"
            alt="Job seeker career opportunities"
            style={styles.heroImage}
          />
        </div>
      </div>

      {/* Right panel */}
      <div style={styles.rightPanel} className="registerPage__rightPanel">
        <div style={styles.card} className="registerPage__card">
          {!isOtpStep ? (
            <>
              <h1 style={styles.cardHeading}>Register your account</h1>
              <p style={styles.cardSub}>Register to start your job search journey</p>

              <form style={styles.form} onSubmit={handleSeekerRegister} autoComplete="off">
                  <div style={styles.fieldGrid} className="registerPage__fieldGrid">
                    <div style={styles.field}>
                      <label style={styles.label}>Full Name</label>
                      <div style={styles.inputWrap}>
                        <span style={styles.inputIcon}><PersonIcon /></span>
                        <input
                          style={styles.input}
                          type="text"
                          placeholder="Enter your full name"
                          value={seekerForm.fullName}
                          onChange={(e) => setSeekerForm({ ...seekerForm, fullName: e.target.value })}
                          required
                        />
                      </div>
                    </div>
                    <div style={styles.field}>
                      <label style={styles.label}>Email Address</label>
                      <div style={styles.inputWrap}>
                        <span style={styles.inputIcon}><MailIcon /></span>
                        <input
                          style={styles.input}
                          type="email"
                          placeholder="Enter your email"
                          value={seekerForm.email}
                          onChange={(e) => setSeekerForm({ ...seekerForm, email: e.target.value })}
                          required
                        />
                      </div>
                    </div>
                  </div>

                  <div style={styles.field}>
                    <label style={styles.label}>Mobile Number</label>
                    <div style={styles.inputWrap}>
                      <span style={styles.inputIcon}><PhoneIcon /></span>
                      <input
                        style={styles.input}
                        type="tel"
                        placeholder="Enter your mobile number"
                        value={seekerForm.phone}
                        onChange={(e) => setSeekerForm({ ...seekerForm, phone: e.target.value })}
                      />
                    </div>
                  </div>

                  <div style={styles.field}>
                    <label style={styles.label}>Password</label>
                    <div style={styles.inputWrap}>
                      <span style={styles.inputIcon}><LockIcon /></span>
                      <input
                        style={{ ...styles.input, ...styles.inputWithEye }}
                        type={showPassword ? "text" : "password"}
                        placeholder="Create a password"
                        value={seekerForm.password}
                        onChange={(e) => setSeekerForm({ ...seekerForm, password: e.target.value })}
                        required
                      />
                      <button type="button" style={styles.eyeBtn} onClick={() => setShowPassword((p) => !p)} tabIndex={-1}>
                        <EyeIcon open={showPassword} />
                      </button>
                    </div>
                  </div>

                  <div style={styles.field}>
                    <label style={styles.label}>Confirm Password</label>
                    <div style={styles.inputWrap}>
                      <span style={styles.inputIcon}><LockIcon /></span>
                      <input
                        style={{ ...styles.input, ...styles.inputWithEye }}
                        type={showConfirmPassword ? "text" : "password"}
                        placeholder="Confirm your password"
                        value={seekerForm.confirmPassword}
                        onChange={(e) => setSeekerForm({ ...seekerForm, confirmPassword: e.target.value })}
                        required
                      />
                      <button type="button" style={styles.eyeBtn} onClick={() => setShowConfirmPassword((p) => !p)} tabIndex={-1}>
                        <EyeIcon open={showConfirmPassword} />
                      </button>
                    </div>
                  </div>

                  <button type="submit" style={styles.submitBtn(currentSubmitDisabled)} disabled={currentSubmitDisabled}>
                    {loading ? "Sending OTP..." : "Register"}
                  </button>
              </form>

              <div style={styles.orDivider}>
                <span style={styles.orLine} />
                or register with
                <span style={styles.orLine} />
              </div>

              <div style={styles.socialRow}>
                <button
                  type="button"
                  style={{
                    ...styles.socialBtn,
                    ...(googleHover ? { background: "#f8fafc", borderColor: "#cbd5e1" } : {}),
                  }}
                  onMouseEnter={() => setGoogleHover(true)}
                  onMouseLeave={() => setGoogleHover(false)}
                  onClick={() => handleGoogleAuth("seeker")}
                >
                  <GoogleIcon /> Google
                </button>
              </div>

              <p style={styles.switchText}>
                Already have an account?{" "}
                <button type="button" style={styles.switchLink} onClick={() => openLoginModal("seeker")}>
                  Sign in
                </button>
              </p>

              <div style={styles.secureFooter}>
                <ShieldIcon /> Your information is secure and protected
              </div>
            </>
          ) : (
            // OTP verification step
            <>
              <h1 style={styles.cardHeading}>Verify Your Email</h1>
              <p style={styles.cardSub}>
                We sent a 6-digit OTP to <strong>{currentEmail}</strong>
              </p>

              <div style={styles.otpContainer} className="registerPage__otpContainer">
                {otp.map((digit, index) => (
                  <input
                    key={index}
                    id={`register-page-otp-${index}`}
                    type="text"
                    inputMode="numeric"
                    value={digit}
                    onChange={(e) => handleOtpChange(index, e.target.value.replace(/\D/g, ""))}
                    onKeyDown={(e) => handleOtpKeyDown(index, e)}
                    onPaste={handleOtpPaste}
                    maxLength="1"
                    style={styles.otpInput}
                    className="registerPage__otpInput"
                    autoFocus={index === 0}
                  />
                ))}
              </div>

              <p style={styles.timerText(otpTimer === 0)}>
                {otpTimer > 0 ? `Resend OTP in ${otpTimer}s` : "OTP expired"}
              </p>

              <button
                type="button"
                style={styles.submitBtn(loading || otp.some((d) => !d))}
                disabled={loading || otp.some((d) => !d)}
                onClick={handleVerifyOtp}
              >
                {loading ? "Verifying..." : "Verify & Complete Registration"}
              </button>

              <div style={{ textAlign: "center", marginTop: "16px" }}>
                <button
                  type="button"
                  onClick={handleResendOtp}
                  disabled={loading || resendCount >= 5 || otpTimer > 0}
                  style={styles.resendBtn(resendCount >= 5 || otpTimer > 0)}
                >
                  {resendCount >= 5
                    ? "Resend limit reached"
                    : `Resend OTP${resendCount > 0 ? ` (${5 - resendCount} attempts left)` : ""}`}
                </button>
              </div>

              <div style={{ textAlign: "center", marginTop: "10px" }}>
                <button type="button" onClick={handleBackToRegister} style={styles.backBtn}>
                  ← Back to Registration
                </button>
              </div>
            </>
          )}
        </div>
      </div>
      </div>

      {/* ─── Login Modal (logic ported from Footer.js) ──────────────────── */}
      {showLoginModal && (
        <div
          style={styles.modalOverlay}
          onClick={(e) => {
            if (e.target === e.currentTarget) closeLoginModal();
          }}
        >
          <div style={styles.modalBox}>
            <button type="button" style={styles.modalClose} onClick={closeLoginModal} aria-label="Close">
              &times;
            </button>

            {forgotModalOpen ? (
              <div>
                <h2 style={styles.modalHeading}>Forgot Password</h2>

                {forgotMessage && (
                  <div style={styles.alertBox(forgotMessage.toLowerCase().includes("success"))}>
                    {forgotMessage}
                  </div>
                )}

                {forgotStep === 1 && (
                  <div>
                    <p style={{ marginBottom: "20px", textAlign: "center", color: "#64748b", fontSize: "14px" }}>
                      Enter your email address to reset your password
                    </p>
                    <div style={styles.field}>
                      <div style={styles.inputWrap}>
                        <span style={styles.inputIcon}><MailIcon /></span>
                        <input
                          type="email"
                          placeholder="Email Address"
                          value={forgotEmail}
                          onChange={(e) => setForgotEmail(e.target.value)}
                          style={{ ...styles.input, marginBottom: "16px" }}
                          required
                        />
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={handleForgotSendOTP}
                      disabled={forgotLoading}
                      style={styles.submitBtn(forgotLoading)}
                    >
                      {forgotLoading ? "Sending..." : "Send OTP"}
                    </button>
                  </div>
                )}

                {forgotStep === 2 && (
                  <div>
                    <p style={{ marginBottom: "18px", textAlign: "center", color: "#64748b", fontSize: "14px" }}>
                      Enter the 6-digit OTP sent to your email
                    </p>
                    <div style={styles.otpContainer}>
                      {forgotOtp.map((digit, index) => (
                        <input
                          key={index}
                          id={`forgot-otp-${index}`}
                          type="text"
                          value={digit}
                          onChange={(e) => handleForgotOtpChange(index, e.target.value.replace(/\D/g, ""))}
                          onKeyDown={(e) => handleForgotOtpKeyDown(index, e)}
                          onPaste={handleForgotOtpPaste}
                          maxLength="1"
                          style={styles.otpInput}
                          autoFocus={index === 0}
                        />
                      ))}
                    </div>
                    <p style={styles.timerText(forgotOtpTimer === 0)}>
                      {forgotOtpTimer > 0 ? `Resend OTP in ${forgotOtpTimer}s` : "OTP expired"}
                    </p>
                    <button
                      type="button"
                      onClick={handleForgotVerifyOtp}
                      disabled={forgotLoading || forgotOtp.some((d) => !d)}
                      style={{ ...styles.submitBtn(forgotLoading || forgotOtp.some((d) => !d)), marginBottom: "12px" }}
                    >
                      {forgotLoading ? "Verifying..." : "Verify OTP"}
                    </button>
                    <div style={{ textAlign: "center" }}>
                      <button
                        type="button"
                        onClick={handleForgotResendOtp}
                        disabled={forgotLoading || forgotResendCount >= 5 || forgotOtpTimer > 0}
                        style={styles.resendBtn(forgotResendCount >= 5 || forgotOtpTimer > 0)}
                      >
                        {forgotResendCount >= 5
                          ? "Resend limit reached"
                          : `Resend OTP${forgotResendCount > 0 ? ` (${5 - forgotResendCount} left)` : ""}`}
                      </button>
                    </div>
                  </div>
                )}

                {forgotStep === 3 && (
                  <div>
                    <p style={{ marginBottom: "18px", textAlign: "center", color: "#64748b", fontSize: "14px" }}>
                      Enter your new password
                    </p>
                    <div style={styles.form}>
                      <div style={styles.inputWrap}>
                        <span style={styles.inputIcon}><LockIcon /></span>
                        <input
                          type="password"
                          placeholder="New Password"
                          value={forgotNewPassword}
                          onChange={(e) => setForgotNewPassword(e.target.value)}
                          style={styles.input}
                          required
                        />
                      </div>
                      <div style={styles.inputWrap}>
                        <span style={styles.inputIcon}><LockIcon /></span>
                        <input
                          type="password"
                          placeholder="Confirm New Password"
                          value={forgotConfirmPassword}
                          onChange={(e) => setForgotConfirmPassword(e.target.value)}
                          style={styles.input}
                          required
                        />
                      </div>
                      <button
                        type="button"
                        onClick={handleForgotResetPassword}
                        disabled={forgotLoading}
                        style={styles.submitBtn(forgotLoading)}
                      >
                        {forgotLoading ? "Updating..." : "Update Password"}
                      </button>
                    </div>
                  </div>
                )}

                <div style={{ textAlign: "center", marginTop: "16px" }}>
                  <button type="button" onClick={handleForgotClose} style={styles.switchLink}>
                    Back to Login
                  </button>
                </div>
              </div>
            ) : (
              <>
                {loginMessage && (
                  <div style={styles.alertBox(isSuccessMessage(loginMessage))}>
                    {loginMessage}
                  </div>
                )}

                {loginPanel === "seeker" ? (
                  <div>
                    <h2 style={styles.modalHeading}>User Login</h2>
                    <form style={styles.form} onSubmit={handleSeekerLogin} autoComplete="off">
                      <div style={styles.inputWrap}>
                        <span style={styles.inputIcon}><MailIcon /></span>
                        <input
                          type="email"
                          placeholder="Enter your email or phone number"
                          value={seekerLogin.email}
                          onChange={(e) => setSeekerLogin({ ...seekerLogin, email: e.target.value })}
                          style={styles.input}
                          required
                        />
                      </div>
                      <div style={styles.inputWrap}>
                        <span style={styles.inputIcon}><LockIcon /></span>
                        <input
                          type="password"
                          placeholder="Password"
                          value={seekerLogin.password}
                          onChange={(e) => setSeekerLogin({ ...seekerLogin, password: e.target.value })}
                          style={styles.input}
                          required
                        />
                      </div>
                      <div style={styles.modalRow}>
                        <label style={styles.modalCheckbox}>
                          <input type="checkbox" id="seeker-remember" /> Remember Me
                        </label>
                        <button
                          type="button"
                          style={styles.modalLink}
                          onClick={() => {
                            setForgotStep(1);
                            setForgotEmail(seekerLogin.email || "");
                            setForgotOtp(["", "", "", "", "", ""]);
                            setForgotOtpTimer(60);
                            setForgotResendCount(0);
                            setForgotNewPassword("");
                            setForgotConfirmPassword("");
                            setForgotLoading(false);
                            setForgotMessage("");
                            setForgotModalOpen(true);
                          }}
                        >
                          Forgot Password?
                        </button>
                      </div>
                      <button type="submit" style={styles.submitBtn(loginLoading)} disabled={loginLoading}>
                        {loginLoading ? "Logging in..." : "Login"}
                      </button>
                    </form>

                    <div style={styles.orDivider}>
                      <span style={styles.orLine} />
                      OR
                      <span style={styles.orLine} />
                    </div>

                    <div style={styles.socialRow}>
                      <button
                        type="button"
                        style={{
                          ...styles.socialBtn,
                          ...(loginGoogleHover ? { background: "#f8fafc", borderColor: "#cbd5e1" } : {}),
                        }}
                        onMouseEnter={() => setLoginGoogleHover(true)}
                        onMouseLeave={() => setLoginGoogleHover(false)}
                        onClick={() => handleLoginGoogleAuth("seeker")}
                      >
                        <GoogleIcon /> Continue with Google
                      </button>
                    </div>

                    <p style={styles.switchText}>
                      Don't have an account?{" "}
                      <button
                        type="button"
                        style={styles.switchLink}
                        onClick={() => {
                          closeLoginModal();
                          setIsOtpStep(false);
                          setOtp(["", "", "", "", "", ""]);
                          setOtpTimer(60);
                          setResendCount(0);
                        }}
                      >
                        Register here
                      </button>
                    </p>

                    <p style={styles.switchText}>
                      If you are an employer, login{" "}
                      <button type="button" style={styles.switchLink} onClick={() => setLoginPanel("provider")}>
                        here
                      </button>
                    </p>
                  </div>
                ) : (
                  <div>
                    <h2 style={styles.modalHeading}>Employer Login</h2>
                    <form style={styles.form} onSubmit={handleProviderLogin} autoComplete="off">
                      <div style={styles.inputWrap}>
                        <span style={styles.inputIcon}><MailIcon /></span>
                        <input
                          type="email"
                          placeholder="Enter your email or phone number"
                          value={providerLogin.email}
                          onChange={(e) => setProviderLogin({ ...providerLogin, email: e.target.value })}
                          style={styles.input}
                          required
                        />
                      </div>
                      <div style={styles.inputWrap}>
                        <span style={styles.inputIcon}><LockIcon /></span>
                        <input
                          type="password"
                          placeholder="Password"
                          value={providerLogin.password}
                          onChange={(e) => setProviderLogin({ ...providerLogin, password: e.target.value })}
                          style={styles.input}
                          required
                        />
                      </div>
                      <div style={styles.modalRow}>
                        <label style={styles.modalCheckbox}>
                          <input type="checkbox" id="provider-remember" /> Remember Me
                        </label>
                        <button
                          type="button"
                          style={styles.modalLink}
                          onClick={() => {
                            setForgotStep(1);
                            setForgotEmail(providerLogin.email || "");
                            setForgotOtp(["", "", "", "", "", ""]);
                            setForgotOtpTimer(60);
                            setForgotResendCount(0);
                            setForgotNewPassword("");
                            setForgotConfirmPassword("");
                            setForgotLoading(false);
                            setForgotMessage("");
                            setForgotModalOpen(true);
                          }}
                        >
                          Forgot Password?
                        </button>
                      </div>
                      <button type="submit" style={styles.submitBtn(loginLoading)} disabled={loginLoading}>
                        {loginLoading ? "Logging in..." : "Login"}
                      </button>
                    </form>

                    <div style={styles.orDivider}>
                      <span style={styles.orLine} />
                      OR
                      <span style={styles.orLine} />
                    </div>

                    <div style={styles.socialRow}>
                      <button
                        type="button"
                        style={{
                          ...styles.socialBtn,
                          ...(loginGoogleHover ? { background: "#f8fafc", borderColor: "#cbd5e1" } : {}),
                        }}
                        onMouseEnter={() => setLoginGoogleHover(true)}
                        onMouseLeave={() => setLoginGoogleHover(false)}
                        onClick={() => handleLoginGoogleAuth("provider")}
                      >
                        <GoogleIcon /> Continue with Google
                      </button>
                    </div>

                    <p style={styles.switchText}>
                      Don't have an account?{" "}
                      <button
                        type="button"
                        style={styles.switchLink}
                        onClick={() => {
                          closeLoginModal();
                          setIsOtpStep(false);
                          setOtp(["", "", "", "", "", ""]);
                          setOtpTimer(60);
                          setResendCount(0);
                        }}
                      >
                        Register here
                      </button>
                    </p>

                    <p style={styles.switchText}>
                      To login as job seeker{" "}
                      <button type="button" style={styles.switchLink} onClick={() => setLoginPanel("seeker")}>
                        click here
                      </button>
                    </p>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default RegisterPage;