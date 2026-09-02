import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import Header from "../Components/Header";
import Footer from "../Components/Footer";
import { useAuth } from "../context/AuthContext";
import { API_BASE_URL } from "../config/api";
import RegistrationCategoryFields from "../Components/RegistrationCategoryFields";

const createEmptyForm = () => ({
  fullName: "",
  email: "",
  phone: "",
  password: "",
  confirmPassword: "",
  experience: "",
  categoryId: "",
  subcategoryId: ""
});

function RegisterPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  

  const [activeTab, setActiveTab] = useState("seeker");
  const [statusMessage, setStatusMessage] = useState("");
  const [statusVariant, setStatusVariant] = useState("info");
  const [seekerForm, setSeekerForm] = useState(createEmptyForm);
  const [providerForm, setProviderForm] = useState(createEmptyForm);
  const [seekerSubmitting, setSeekerSubmitting] = useState(false);
  const [providerSubmitting, setProviderSubmitting] = useState(false);
  const [referralBanner, setReferralBanner] = useState("");
  const [referralCode, setReferralCode] = useState("");
  const [employerName, setEmployerName] = useState("");

  useEffect(() => {
    if (user) {
      navigate("/");
    }
  }, [user, navigate]);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const code = params.get("ref");

    if (code) {
      const trimmedCode = code.trim();
      setReferralCode(trimmedCode);
      localStorage.setItem("referralCode", trimmedCode);
      trackReferral(trimmedCode);
    } else {
      setReferralCode("");
      setReferralBanner("");
      setEmployerName("");
      localStorage.removeItem("referralCode");
    }
  }, [location.search]);

  const trackReferral = async (code) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/employer/referral/track`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ referralCode: code })
      });

      if (response.ok) {
        const data = await response.json();
        const name = data?.employer?.name || "";
        setEmployerName(name);
        setReferralBanner(
          name
            ? `You are joining with ${name}'s referral link. Complete your registration to let them know you signed up!`
            : "Referral link applied successfully."
        );
      } else {
        const data = await response.json().catch(() => ({}));
        setReferralBanner(
          data?.message ||
            "We could not verify this referral link, but you can still continue with registration."
        );
      }
    } catch (err) {
      console.error("Error tracking referral:", err);
      setReferralBanner(
        "We could not verify the referral link right now. You can still continue with registration."
      );
    }
  };

  const updateSeekerField = (field, value) => {
    setSeekerForm((prev) => ({
      ...prev,
      [field]: value
    }));
  };

  const updateProviderField = (field, value) => {
    setProviderForm((prev) => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSeekerSubmit = async (event) => {
    event.preventDefault();
    setStatusMessage("");
    setStatusVariant("info");

    if (seekerSubmitting) return;

    if (seekerForm.password !== seekerForm.confirmPassword) {
      setStatusMessage("Passwords do not match.");
      setStatusVariant("danger");
      return;
    }

    if (!seekerForm.categoryId || !seekerForm.subcategoryId) {
      setStatusMessage("Please select a category and subcategory.");
      setStatusVariant("danger");
      return;
    }

    setSeekerSubmitting(true);
    try {
      const payload = {
        role: "seeker",
        fullName: seekerForm.fullName,
        email: seekerForm.email,
        phone: seekerForm.phone,
        password: seekerForm.password,
        experience: seekerForm.experience,
        categoryId: Number(seekerForm.categoryId),
        subcategoryId: Number(seekerForm.subcategoryId)
      };

      if (referralCode) {
        payload.referralCode = referralCode;
      }

      const response = await fetch(`${API_BASE_URL}/api/auth/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(payload)
      });

      const data = await response.json();

      if (response.ok) {
        setStatusMessage("Registration successful! You can now sign in.");
        setStatusVariant("success");
        setSeekerForm(createEmptyForm());
        localStorage.removeItem("referralCode");
        setReferralCode("");
      } else {
        setStatusMessage(data?.message || "Registration failed. Please try again.");
        setStatusVariant("danger");
      }
    } catch (err) {
      console.error("Error registering seeker:", err);
      setStatusMessage("Network error. Please try again.");
      setStatusVariant("danger");
    }
    setSeekerSubmitting(false);
  };

  const handleProviderSubmit = async (event) => {
    event.preventDefault();
    setStatusMessage("");
    setStatusVariant("info");

    if (providerSubmitting) return;

    if (providerForm.password !== providerForm.confirmPassword) {
      setStatusMessage("Passwords do not match.");
      setStatusVariant("danger");
      return;
    }

    setProviderSubmitting(true);
    try {
      const payload = {
        role: "provider",
        fullName: providerForm.fullName,
        email: providerForm.email,
        phone: providerForm.phone,
        password: providerForm.password,
        experience: providerForm.experience,
      };

      if (referralCode) {
        payload.referralCode = referralCode;
      }

      const response = await fetch(`${API_BASE_URL}/api/auth/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(payload)
      });

      const data = await response.json();

      if (response.ok) {
        setStatusMessage("Registration successful! You can now sign in.");
        setStatusVariant("success");
        setProviderForm(createEmptyForm());
        localStorage.removeItem("referralCode");
        setReferralCode("");
      } else {
        setStatusMessage(data?.message || "Registration failed. Please try again.");
        setStatusVariant("danger");
      }
    } catch (err) {
      console.error("Error registering provider:", err);
      setStatusMessage("Network error. Please try again.");
      setStatusVariant("danger");
    }
    setProviderSubmitting(false);
  };

  const renderStatusAlert = () => {
    if (!statusMessage) return null;
    const alertClass =
      statusVariant === "success"
        ? "alert-success"
        : statusVariant === "danger"
        ? "alert-danger"
        : "alert-info";

    return (
      <div className={`alert ${alertClass}`} role="alert">
        {statusMessage}
      </div>
    );
  };

  return (
    <>
      <Header />
      <div className="page-title">
        <div className="container">
          <div className="page-caption">
            <h2>Create Your Account</h2>
            <p>
              <a href="/" title="Home" onClick={(e) => { e.preventDefault(); navigate("/"); }}>
                Home
              </a>{" "}
              <i className="ti-angle-double-right" /> Register
            </p>
          </div>
        </div>
      </div>

      <section className="padd-top-80 padd-bot-80">
        <div className="container">
          {referralBanner && (
            <div className="alert alert-info" role="alert">
              {referralBanner}
              {employerName && (
                <span style={{ display: "block", marginTop: "8px", fontWeight: 600 }}>
                  Referred by: {employerName}
                </span>
              )}
              {referralCode && (
                <span
                  style={{
                    display: "inline-block",
                    marginTop: "10px",
                    padding: "4px 10px",
                    borderRadius: "20px",
                    background: "#fff",
                    border: "1px solid #ddd",
                    fontSize: "12px"
                  }}
                >
                  Referral Code: {referralCode}
                </span>
              )}
            </div>
          )}

          {renderStatusAlert()}

          <div className="row">
            <div className="col-md-8 col-md-offset-2">
              <div className="card" style={{ padding: "30px", borderRadius: "8px" }}>
                <ul className="nav nav-tabs nav-advance theme-bg" role="tablist">
                  <li className={`nav-item ${activeTab === "seeker" ? "active" : ""}`}>
                    <a
                      href="#register-seeker-page"
                      className="nav-link"
                      role="tab"
                      onClick={(e) => {
                        e.preventDefault();
                        setActiveTab("seeker");
                      }}
                    >
                      <i className="ti-user" /> Job Seeker
                    </a>
                  </li>
                  <li className={`nav-item ${activeTab === "provider" ? "active" : ""}`}>
                    <a
                      href="#register-provider-page"
                      className="nav-link"
                      role="tab"
                      onClick={(e) => {
                        e.preventDefault();
                        setActiveTab("provider");
                      }}
                    >
                      <i className="ti-briefcase" /> Job Provider
                    </a>
                  </li>
                </ul>

                <div className="tab-content" style={{ marginTop: "30px" }}>
                  <div
                    id="register-seeker-page"
                    className={`tab-pane fade ${activeTab === "seeker" ? "in active" : ""}`}
                    role="tabpanel"
                  >
                    <form onSubmit={handleSeekerSubmit}>
                      <div className="form-group">
                        <input
                          type="text"
                          className="form-control"
                          placeholder="Full Name"
                          value={seekerForm.fullName}
                          onChange={(e) => updateSeekerField("fullName", e.target.value)}
                          required
                        />
                      </div>
                      <div className="form-group">
                        <input
                          type="email"
                          className="form-control"
                          placeholder="Email Address"
                          value={seekerForm.email}
                          onChange={(e) => updateSeekerField("email", e.target.value)}
                          required
                        />
                      </div>
                      <div className="form-group">
                        <input
                          type="tel"
                          className="form-control"
                          placeholder="Phone Number"
                          value={seekerForm.phone}
                          onChange={(e) => updateSeekerField("phone", e.target.value)}
                        />
                      </div>
                      <div className="form-group">
                        <input
                          type="password"
                          className="form-control"
                          placeholder="Password"
                          value={seekerForm.password}
                          onChange={(e) => updateSeekerField("password", e.target.value)}
                          required
                        />
                      </div>
                      <div className="form-group">
                        <input
                          type="password"
                          className="form-control"
                          placeholder="Confirm Password"
                          value={seekerForm.confirmPassword}
                          onChange={(e) => updateSeekerField("confirmPassword", e.target.value)}
                          required
                        />
                      </div>
                      <div className="form-group">
                        <select
                          className="form-control"
                          value={seekerForm.experience}
                          onChange={(e) => updateSeekerField("experience", e.target.value)}
                          required
                        >
                          <option value="" disabled>
                            Select Experience
                          </option>
                          <option value="fresher">Fresher</option>
                          <option value="experience">Experience</option>
                        </select>
                      </div>
                      <RegistrationCategoryFields
                        required
                        value={{
                          categoryId: seekerForm.categoryId,
                          subcategoryId: seekerForm.subcategoryId
                        }}
                        onChange={({ categoryId, subcategoryId }) => {
                          setSeekerForm((prev) => ({
                            ...prev,
                            categoryId,
                            subcategoryId
                          }));
                        }}
                      />
                      <div className="form-group text-center">
                        <button
                          type="submit"
                          className="btn theme-btn full-width btn-m"
                          disabled={seekerSubmitting}
                        >
                          {seekerSubmitting ? "Registering..." : "Register"}
                        </button>
                      </div>
                    </form>
                  </div>

                  <div
                    id="register-provider-page"
                    className={`tab-pane fade ${activeTab === "provider" ? "in active" : ""}`}
                    role="tabpanel"
                  >
                    <form onSubmit={handleProviderSubmit}>
                      <div className="form-group">
                        <input
                          type="text"
                          className="form-control"
                          placeholder="Full Name"
                          value={providerForm.fullName}
                          onChange={(e) => updateProviderField("fullName", e.target.value)}
                          required
                        />
                      </div>
                      <div className="form-group">
                        <input
                          type="email"
                          className="form-control"
                          placeholder="Email Address"
                          value={providerForm.email}
                          onChange={(e) => updateProviderField("email", e.target.value)}
                          required
                        />
                      </div>
                      <div className="form-group">
                        <input
                          type="tel"
                          className="form-control"
                          placeholder="Phone Number"
                          value={providerForm.phone}
                          onChange={(e) => updateProviderField("phone", e.target.value)}
                        />
                      </div>
                      <div className="form-group">
                        <input
                          type="password"
                          className="form-control"
                          placeholder="Password"
                          value={providerForm.password}
                          onChange={(e) => updateProviderField("password", e.target.value)}
                          required
                        />
                      </div>
                      <div className="form-group">
                        <input
                          type="password"
                          className="form-control"
                          placeholder="Confirm Password"
                          value={providerForm.confirmPassword}
                          onChange={(e) => updateProviderField("confirmPassword", e.target.value)}
                          required
                        />
                      </div>
                      <div className="form-group">
                        <select
                          className="form-control"
                          value={providerForm.experience}
                          onChange={(e) => updateProviderField("experience", e.target.value)}
                          required
                        >
                          <option value="" disabled>
                            Select Experience
                          </option>
                          <option value="fresher">Fresher</option>
                          <option value="experience">Experience</option>
                        </select>
                      </div>
                      <div className="form-group text-center">
                        <button
                          type="submit"
                          className="btn theme-btn full-width btn-m"
                          disabled={providerSubmitting}
                        >
                          {providerSubmitting ? "Registering..." : "Register"}
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </>
  );
}

export default RegisterPage;


