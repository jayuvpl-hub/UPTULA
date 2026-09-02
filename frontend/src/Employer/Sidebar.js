import React from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { API_BASE_URL } from "../config/api";
import { ProfileAvatarRing } from "../Candidate/Sidebar";

function EmployerSidebar({ active = "profile" }) {
  const navigate = useNavigate();
  const { user, logout, profileData } = useAuth();

  const storedEmployerLogo =
    typeof window !== "undefined" ? localStorage.getItem("employerLogoUrl") : null;

  const resolveAssetUrl = (value) => {
    if (!value) return "";
    if (value.startsWith("http") || value.startsWith("data:")) return value;
    return `${API_BASE_URL}${value.startsWith("/") ? value : `/${value}`}`;
  };

  const getAvatarSrc = () => {
    if (profileData?.profilePictureUrl) return resolveAssetUrl(profileData.profilePictureUrl);
    if (profileData?.logoUrl) return resolveAssetUrl(profileData.logoUrl);
    if (storedEmployerLogo) return resolveAssetUrl(storedEmployerLogo);
    return "/assets/img/user-profile.png";
  };

  const avatarSrc = getAvatarSrc();
  const displayName = user?.fullName || profileData?.companyName || "Employer";

  // Same 13-section completion logic as Employer/Profile.js (ring UI only).
  const getCompanyCompletion = () => {
    const d = profileData || {};
    const isFilled = (v) => String(v ?? "").trim() !== "";
    const hasLogo = !!(d.profilePictureUrl || d.logoUrl || storedEmployerLogo);
    const hasSocial = !!(d.linkedin || d.twitter || d.facebook || d.google);
    const checks = [
      hasLogo,
      isFilled(d.companyName),
      isFilled(d.contactPerson),
      isFilled(d.email),
      isFilled(d.phone),
      isFilled(d.address),
      isFilled(d.website),
      isFilled(d.industry),
      isFilled(d.companySize),
      isFilled(d.companyType),
      isFilled(d.foundedYear),
      isFilled(d.description),
      hasSocial,
    ];
    const done = checks.filter(Boolean).length;
    return Math.round((done / checks.length) * 100);
  };

  const completion = getCompanyCompletion();

  const missingItems = [
    "Company logo & branding",
    "Company details & contact",
    "About company description",
  ];

  const navItems = [
    { key: "home", label: "Home", icon: "ti-home", path: "/" },
    { key: "profile", label: "Add Company Details", icon: "ti-user", path: "/employer/profile" },
    { key: "add-jobs", label: "Add Jobs", icon: "ti-briefcase", path: "/employer/add-jobs" },
    { key: "manage-jobs", label: "Manage Jobs", icon: "ti-clipboard", path: "/employer/manage-jobs" },
    { key: "analytics", label: "Analytics Reports", icon: "ti-pie-chart", path: "/employer/analytics" },
    { key: "view-candidates", label: "View Candidates", icon: "ti-user", path: "/employer/view-candidates" },
    { key: "boolean-search", label: "Boolean Search", icon: "ti-search", path: "/employer/boolean-search" },
    { key: "resume-scoring", label: "Resume Scoring", icon: "ti-bar-chart", path: "/employer/resume-scoring" },
    { key: "referral", label: "Referral", icon: "ti-gift", path: "/employer/referral" },
    { key: "premium", label: "Premium Manager", icon: "ti-star", path: "/employer/premium" },
    { key: "support", label: "Support & Tickets", icon: "ti-help-alt", path: "/employer/support" },
    { key: "change-password", label: "Change Password", icon: "ti-key", path: "/employer/change-password" },
    { key: "chat", label: "Chat Center", icon: "ti-comments", path: "/employer/chat" },
  ];

  const styles = {
    sidebar: {
      width: "100%",
      fontFamily: "'Segoe UI', sans-serif",
      display: "flex",
      flexDirection: "column",
      gap: "12px",
    },
    profileCard: {
      background: "#fff",
      borderRadius: "14px",
      boxShadow: "0 2px 12px rgba(0,0,0,0.08)",
      padding: "20px 16px 16px",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      gap: "10px",
    },
    profileHeader: {
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      width: "100%",
    },
    userName: {
      fontSize: "16px",
      fontWeight: "700",
      color: "#1a1a2e",
      marginTop: "4px",
      textAlign: "center",
      width: "100%",
      overflow: "hidden",
      textOverflow: "ellipsis",
      whiteSpace: "nowrap",
    },
    missingCard: {
      background: "#fff8f6",
      border: "1px solid #fde8e2",
      borderRadius: "12px",
      padding: "14px",
      width: "100%",
      boxSizing: "border-box",
    },
    missingTitle: {
      fontSize: "13px",
      fontWeight: "700",
      color: "#1a1a2e",
      marginBottom: "10px",
    },
    missingItem: {
      display: "flex",
      alignItems: "center",
      gap: "8px",
      fontSize: "12px",
      color: "#555",
      marginBottom: "6px",
    },
    checkIcon: {
      width: "16px",
      height: "16px",
      borderRadius: "50%",
      background: "#e05c3a",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      flexShrink: 0,
      color: "#fff",
      fontSize: "9px",
    },
    completeBtn: {
      display: "block",
      width: "100%",
      marginTop: "12px",
      padding: "10px 0",
      background: "#e05c3a",
      color: "#fff",
      border: "none",
      borderRadius: "25px",
      fontSize: "13px",
      fontWeight: "700",
      cursor: "pointer",
      textAlign: "center",
      transition: "background 0.2s",
    },
    navCard: {
      background: "#fff",
      borderRadius: "14px",
      boxShadow: "0 2px 12px rgba(0,0,0,0.07)",
      overflow: "hidden",
    },
    navItem: (isActive) => ({
      display: "flex",
      alignItems: "center",
      gap: "12px",
      padding: "13px 18px",
      cursor: "pointer",
      background: isActive ? "#f0f9f2" : "transparent",
      borderLeft: isActive ? "3px solid #28a745" : "3px solid transparent",
      transition: "background 0.15s",
      textDecoration: "none",
      color: isActive ? "#28a745" : "#444",
    }),
    navIcon: {
      fontSize: "16px",
      width: "22px",
      textAlign: "center",
      flexShrink: 0,
    },
    navLabel: (isActive) => ({
      fontSize: "13.5px",
      fontWeight: isActive ? "700" : "500",
      color: isActive ? "#28a745" : "#333",
      transition: "font-size 0.15s ease, font-weight 0.15s ease",
    }),
    divider: {
      height: "1px",
      background: "#ccc",
      margin: "0",
    },
    logoutItem: {
      display: "flex",
      alignItems: "center",
      gap: "12px",
      padding: "13px 18px",
      cursor: "pointer",
      color: "#e05c3a",
      borderLeft: "3px solid transparent",
      transition: "background 0.15s",
    },
  };

  return (
    <div style={styles.sidebar}>
      {/* Profile Card */}
      <div style={styles.profileCard}>
        <div style={styles.profileHeader}>
          <ProfileAvatarRing value={completion} imageSrc={avatarSrc} />
        </div>
        <div style={styles.userName}>{displayName}</div>

        {/* <div style={styles.missingCard}>
          <div style={styles.missingTitle}>What are you missing?</div>
          {missingItems.map((item, i) => (
            <div key={i} style={styles.missingItem}>
              <span style={styles.checkIcon}>✓</span>
              {item}
            </div>
          ))}
          <button
            type="button"
            style={styles.completeBtn}
            onClick={() => navigate("/employer/profile")}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "#c94e2f";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "#e05c3a";
            }}
          >
            Complete profile
          </button>
        </div> */}
      </div>

      {/* Navigation Card */}
      <div style={styles.navCard}>
        {navItems.map((item) => {
          const isActive = active === item.key;
          return (
            <div
              key={item.key}
              style={styles.navItem(isActive)}
              onClick={() => navigate(item.path)}
              onMouseEnter={(e) => {
                const label = e.currentTarget.querySelector("span");
                if (label) {
                  label.style.fontSize = "14.5px";
                  label.style.fontWeight = isActive ? "800" : "600";
                }
              }}
              onMouseLeave={(e) => {
                const label = e.currentTarget.querySelector("span");
                if (label) {
                  label.style.fontSize = "13.5px";
                  label.style.fontWeight = isActive ? "700" : "500";
                }
              }}
            >
              <i className={`login-icon ${item.icon}`} style={styles.navIcon} />
              <span style={styles.navLabel(isActive)}>{item.label}</span>
            </div>
          );
        })}
        <div style={styles.divider} />
        <div
          style={styles.logoutItem}
          onClick={() => {
            logout();
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = "#fff5f3";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = "transparent";
          }}
        >
          <i className="login-icon ti-power-off" style={styles.navIcon} />
          <span style={{ fontSize: "13.5px", fontWeight: "600", color: "#e05c3a" }}>Logout</span>
        </div>
      </div>
    </div>
  );
}

export default EmployerSidebar;
