// import React from "react";
// import { useNavigate } from "react-router-dom";
// import { useAuth } from "../context/AuthContext";

// const getCompletionColor = (percent) => {
//     if (percent >= 80) return "#28a745";
//     if (percent >= 50) return "#f59e0b";
//     return "#e05c3a";
// };

// function polarToCartesian(cx, cy, r, angleDeg) {
//     const angleRad = ((angleDeg - 90) * Math.PI) / 180;
//     return {
//         x: cx + r * Math.cos(angleRad),
//         y: cy + r * Math.sin(angleRad),
//     };
// }

// function describeArc(cx, cy, r, startAngle, endAngle, clockwise = true) {
//     const start = polarToCartesian(cx, cy, r, startAngle);
//     const end = polarToCartesian(cx, cy, r, endAngle);
//     const sweep = clockwise ? 1 : 0;
//     const diff = clockwise
//         ? (endAngle - startAngle + 360) % 360
//         : (startAngle - endAngle + 360) % 360;
//     const largeArc = diff > 180 ? 1 : 0;
//     return `M ${start.x} ${start.y} A ${r} ${r} 0 ${largeArc} ${sweep} ${end.x} ${end.y}`;
// }

// function ProfileAvatarRing({ value = 0, imageSrc, size = 95, stroke = 3 }) {
//     const clamped = Math.min(100, Math.max(0, value));
//     const ringColor = getCompletionColor(clamped);
//     const cx = size / 2;
//     const cy = size / 2;
//     const radius = (size - stroke) / 2;
//     const avatarSize = 76;
//     const gapDeg = 28;
//     const gapHalf = gapDeg / 2;
//     const progressDeg = (clamped / 100) * (360 - gapDeg);
//     const progressStart = 180 - gapHalf - progressDeg;
//     const progressEnd = 180 - gapHalf;
//     const greyStart = 180 + gapHalf;
//     const greyEnd = progressStart;
//     const avatarSrc = imageSrc || "/assets/img/user-profile.png";

//     return (
//         <div
//             style={{
//                 position: "relative",
//                 width: size,
//                 height: size,
//                 flexShrink: 0,
//             }}
//         >
//             <img
//                 src={avatarSrc}
//                 alt="Profile"
//                 style={{
//                     position: "absolute",
//                     top: "47%",
//                     left: "50%",
//                     transform: "translate(-50%, -50%)",
//                     width: avatarSize,
//                     height: avatarSize,
//                     borderRadius: "50%",
//                     objectFit: "cover",
//                     background: "#e8e8e8",
//                     zIndex: 1,
//                 }}
//                 onError={(e) => { e.target.src = "/assets/img/user-profile.png"; }}
//             />
//             <svg
//                 width={size}
//                 height={size}
//                 style={{
//                     position: "absolute",
//                     top: 0,
//                     left: 0,
//                     zIndex: 2,
//                     pointerEvents: "none",
//                 }}
//             >
//                 <path
//                     d={describeArc(cx, cy, radius, greyStart, greyEnd, true)}
//                     fill="none"
//                     stroke="#e0e0e0"
//                     strokeWidth={stroke}
//                     strokeLinecap="round"
//                 />
//                 {progressDeg > 0 && (
//                     <path
//                         d={describeArc(cx, cy, radius, progressStart, progressEnd, true)}
//                         fill="none"
//                         stroke={ringColor}
//                         strokeWidth={stroke}
//                         strokeLinecap="round"
//                     />
//                 )}
//             </svg>
//             <span
//                 style={{
//                     position: "absolute",
//                     bottom: 4,
//                     left: "50%",
//                     transform: "translateX(-50%)",
//                     fontSize: "13px",
//                     fontWeight: "700",
//                     color: ringColor,
//                     lineHeight: 1,
//                     zIndex: 3,
//                 }}
//             >
//                 {clamped}%
//             </span>
//         </div>
//     );
// }

// function CandidateSidebar({ activePage = "change-password" }) {
//     const { user, profileData, logout } = useAuth();
//     const navigate = useNavigate();

//     const getProfileCompletion = () => {
//         const data = profileData || {};
//         const skillChips = String(data.skills || "")
//             .split(",")
//             .map((item) => item.trim())
//             .filter(Boolean);
//         const hasResume = !!data.resume;
//         const hasProfilePicture = !!(
//             data.profilePicture ||
//             data.profilePictureUrl ||
//             user?.profilePictureUrl
//         );
//         const hasSocial = !!(
//             String(data.linkedin || "").trim() ||
//             String(data.google || "").trim() ||
//             String(data.facebook || "").trim() ||
//             String(data.twitter || "").trim()
//         );
//         const isFilled = (v) => String(v ?? "").trim() !== "";

//         const completionItems = [
//             hasProfilePicture,
//             isFilled(data.name || user?.fullName),
//             isFilled(data.email || user?.email),
//             isFilled(data.phone || user?.phone),
//             isFilled(data.address),
//             isFilled(data.gender),
//             isFilled(data.dateOfBirth),
//             hasResume,
//             isFilled(data.preferredJobRole),
//             isFilled(data.bio),
//             skillChips.length > 0,
//             isFilled(data.experience),
//             isFilled(data.education),
//             hasSocial,
//         ];

//         const completedCount = completionItems.filter(Boolean).length;
//         return Math.round((completedCount / completionItems.length) * 100);
//     };

//     const completion = getProfileCompletion();
//     const profileImageSrc =
//         profileData?.profilePictureUrl ||
//         user?.profilePictureUrl ||
//         localStorage.getItem("userProfilePicture") ||
//         "/assets/img/user-profile.png";
//     const navItems = [
//         { key: "home",           path: "/",                              icon: "ti-home", label: "My Home" },
//         { key: "profile",        path: "/profile",                       icon: "ti-user", label: "Edit Profile" },
//         { key: "applied-jobs",   path: "/candidate/applied-jobs",        icon: "ti-clipboard", label: "Applied Jobs" },
//         { key: "create-resume",  path: "/candidate/create-resume",       icon: "ti-file", label: "Create Resume" },
//         { key: "change-password",path: "/candidate/change-password",     icon: "ti-key", label: "Change Password" },
//         { key: "wishlist",       path: "/candidate/wishlist",            icon: "ti-heart", label: "My Wishlist" },
//         { key: "chat",           path: "/candidate/chat",                icon: "ti-comments", label: "Chat Inbox" },
//     ];

//     const missingItems = [
//         "Daily job recommendations",
//         "Job application updates",
//         "Direct jobs from recruiters",
//     ];

//     const styles = {
//         sidebar: {
//             width: "260px",
//             fontFamily: "'Segoe UI', sans-serif",
//             display: "flex",
//             flexDirection: "column",
//             gap: "12px",
//         },
//         profileCard: {
//             background: "#fff",
//             borderRadius: "14px",
//             boxShadow: "0 2px 12px rgba(0,0,0,0.08)",
//             padding: "20px 16px 16px",
//             display: "flex",
//             flexDirection: "column",
//             alignItems: "center",
//             gap: "10px",
//         },
//         profileHeader: {
//             display: "flex",
//             flexDirection: "column",
//             alignItems: "center",
//             width: "100%",
//         },
//         userName: {
//             fontSize: "16px",
//             fontWeight: "700",
//             color: "#1a1a2e",
//             marginTop: "4px",
//             textAlign: "center",
//         },        missingCard: {
//             background: "#fff8f6",
//             border: "1px solid #fde8e2",
//             borderRadius: "12px",
//             padding: "14px",
//             width: "100%",
//             boxSizing: "border-box",
//         },
//         missingTitle: {
//             fontSize: "13px",
//             fontWeight: "700",
//             color: "#1a1a2e",
//             marginBottom: "10px",
//         },
//         missingItem: {
//             display: "flex",
//             alignItems: "center",
//             gap: "8px",
//             fontSize: "12px",
//             color: "#555",
//             marginBottom: "6px",
//         },
//         checkIcon: {
//             width: "16px",
//             height: "16px",
//             borderRadius: "50%",
//             background: "#e05c3a",
//             display: "flex",
//             alignItems: "center",
//             justifyContent: "center",
//             flexShrink: 0,
//             color: "#fff",
//             fontSize: "9px",
//         },
//         completeBtn: {
//             display: "block",
//             width: "100%",
//             marginTop: "12px",
//             padding: "10px 0",
//             background: "#e05c3a",
//             color: "#fff",
//             border: "none",
//             borderRadius: "25px",
//             fontSize: "13px",
//             fontWeight: "700",
//             cursor: "pointer",
//             textAlign: "center",
//             transition: "background 0.2s",
//         },
//         navCard: {
//             background: "#fff",
//             borderRadius: "14px",
//             boxShadow: "0 2px 12px rgba(0,0,0,0.07)",
//             overflow: "hidden",
//         },
//         navItem: (isActive) => ({
//             display: "flex",
//             alignItems: "center",
//             gap: "12px",
//             padding: "13px 18px",
//             cursor: "pointer",
//             background: isActive ? "#f0f9f2" : "transparent",
//             borderLeft: isActive ? "3px solid #28a745" : "3px solid transparent",
//             transition: "background 0.15s",
//             textDecoration: "none",
//             color: isActive ? "#28a745" : "#444",
//         }),
//         navIcon: {
//             fontSize: "16px",
//             width: "22px",
//             textAlign: "center",
//             flexShrink: 0,
//         },
//         navLabel: (isActive) => ({
//             fontSize: "13.5px",
//             fontWeight: isActive ? "700" : "500",
//             color: isActive ? "#28a745" : "#333",
//             transition: "font-size 0.15s ease, font-weight 0.15s ease",
//         }),
//         divider: {
//             height: "1px",
//             background: "#ccc",
//             margin: "0",
//         },
//         logoutItem: {
//             display: "flex",
//             alignItems: "center",
//             gap: "12px",
//             padding: "13px 18px",
//             cursor: "pointer",
//             color: "#e05c3a",
//             borderLeft: "3px solid transparent",
//             transition: "background 0.15s",
//         },
//     };

//     return (
//         <div style={styles.sidebar}>
//             {/* Profile Card */}
//             <div style={styles.profileCard}>
//                 <div style={styles.profileHeader}>
//                     <ProfileAvatarRing value={completion} imageSrc={profileImageSrc} />
//                 </div>
//                 <div style={styles.userName}>{user?.fullName || profileData?.name || "User"}</div>
//                 {/* What are you missing */}
//                 <div style={styles.missingCard}>
//                     <div style={styles.missingTitle}>What are you missing?</div>
//                     {missingItems.map((item, i) => (
//                         <div key={i} style={styles.missingItem}>
//                             <span style={styles.checkIcon}>✓</span>
//                             {item}
//                         </div>
//                     ))}
//                     <button
//                         style={styles.completeBtn}
//                         onClick={() => navigate("/profile")}
//                         onMouseEnter={(e) => e.currentTarget.style.background = "#c94e2f"}
//                         onMouseLeave={(e) => e.currentTarget.style.background = "#e05c3a"}
//                     >
//                         Complete profile
//                     </button>
//                 </div>
//             </div>

//             {/* Navigation Card */}
//             <div style={styles.navCard}>
//                 {navItems.map((item) => {
//                     const isActive = activePage === item.key;
//                     return (
//                     <div
//                         key={item.key}
//                         style={styles.navItem(isActive)}
//                         onClick={() => navigate(item.path)}
//                         onMouseEnter={(e) => {
//                             const label = e.currentTarget.querySelector("span");
//                             if (label) {
//                                 label.style.fontSize = "14.5px";
//                                 label.style.fontWeight = isActive ? "800" : "600";
//                             }
//                         }}
//                         onMouseLeave={(e) => {
//                             const label = e.currentTarget.querySelector("span");
//                             if (label) {
//                                 label.style.fontSize = "13.5px";
//                                 label.style.fontWeight = isActive ? "700" : "500";
//                             }
//                         }}
//                     >
//                         <i className={`login-icon ${item.icon}`} style={styles.navIcon} />
//                         <span style={styles.navLabel(isActive)}>{item.label}</span>
//                     </div>
//                     );
//                 })}
//                 <div style={styles.divider} />
//                 <div
//                     style={styles.logoutItem}
//                     onClick={() => { logout(); navigate("/"); }}
//                     onMouseEnter={(e) => e.currentTarget.style.background = "#fff5f3"}
//                     onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}
//                 >
//                     <i className="login-icon ti-power-off" style={styles.navIcon} />
//                     <span style={{ fontSize: "13.5px", fontWeight: "600", color: "#e05c3a" }}>Logout</span>
//                 </div>
//             </div>
//         </div>
//     );
// }

// export default CandidateSidebar;
import React from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const getCompletionColor = (percent) => {
    if (percent >= 80) return "#28a745";
    if (percent >= 50) return "#f59e0b";
    return "#e05c3a";
};

function polarToCartesian(cx, cy, r, angleDeg) {
    const angleRad = ((angleDeg - 90) * Math.PI) / 180;
    return {
        x: cx + r * Math.cos(angleRad),
        y: cy + r * Math.sin(angleRad),
    };
}

function describeArc(cx, cy, r, startAngle, endAngle, clockwise = true) {
    const start = polarToCartesian(cx, cy, r, startAngle);
    const end = polarToCartesian(cx, cy, r, endAngle);
    const sweep = clockwise ? 1 : 0;
    const diff = clockwise
        ? (endAngle - startAngle + 360) % 360
        : (startAngle - endAngle + 360) % 360;
    const largeArc = diff > 180 ? 1 : 0;
    return `M ${start.x} ${start.y} A ${r} ${r} 0 ${largeArc} ${sweep} ${end.x} ${end.y}`;
}

function ProfileAvatarRing({ value = 0, imageSrc, size = 95, stroke = 2.5 }) {
    const clamped = Math.min(100, Math.max(0, value));
    const ringColor = getCompletionColor(clamped);
    const cx = size / 2;
    const cy = size / 2;
    const radius = (size - stroke) / 2;
    const avatarSize = size - stroke * 2 - 4;
    const gapDeg = 26;
    const gapHalf = gapDeg / 2;

    // 180deg = straight down (bottom), using the -90 offset convention in
    // polarToCartesian (0deg = top, clockwise as angle increases).
    // The gap sits centered at the bottom of the ring.
    // Progress must START at the gap's fixed edge and SWEEP CLOCKWISE
    // (left-to-right around the top) as the value grows, then the grey
    // track fills the rest of the way back around to the other gap edge.
    const progressDeg = (clamped / 100) * (360 - gapDeg);
    const progressStart = 180 + gapHalf;             // fixed point, right edge of bottom gap
    const progressEnd = progressStart + progressDeg; // advances clockwise as % grows
    const greyStart = progressEnd;                   // grey picks up where progress ends
    const greyEnd = 180 - gapHalf;                    // and runs to the left edge of the gap

    const avatarSrc = imageSrc || "/assets/img/user-profile.png";

    return (
        <div
            style={{
                position: "relative",
                width: size,
                height: size + 22,
                flexShrink: 0,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
            }}
        >
            <div
                style={{
                    position: "relative",
                    width: size,
                    height: size,
                }}
            >
                <img
                    src={avatarSrc}
                    alt="Profile"
                    style={{
                        position: "absolute",
                        top: "50%",
                        left: "50%",
                        transform: "translate(-50%, -50%)",
                        width: avatarSize,
                        height: avatarSize,
                        borderRadius: "50%",
                        objectFit: "cover",
                        background: "#e8e8e8",
                        zIndex: 1,
                    }}
                    onError={(e) => { e.target.src = "/assets/img/user-profile.png"; }}
                />
                <svg
                    width={size}
                    height={size}
                    style={{
                        position: "absolute",
                        top: 0,
                        left: 0,
                        zIndex: 2,
                        pointerEvents: "none",
                    }}
                >
                    <path
                        d={describeArc(cx, cy, radius, greyStart, greyEnd, true)}
                        fill="none"
                        stroke="#e6e6e6"
                        strokeWidth={stroke}
                        strokeLinecap="round"
                    />
                    {progressDeg > 0 && (
                        <path
                            d={describeArc(cx, cy, radius, progressStart, progressEnd, true)}
                            fill="none"
                            stroke={ringColor}
                            strokeWidth={stroke}
                            strokeLinecap="round"
                        />
                    )}
                </svg>
            </div>
            <span
                style={{
                    marginTop: "2px",
                    fontSize: "13px",
                    fontWeight: "700",
                    color: ringColor,
                    lineHeight: 1,
                }}
            >
                {clamped}%
            </span>
        </div>
    );
}

function CandidateSidebar({ activePage = "change-password" }) {
    const { user, profileData, logout } = useAuth();
    const navigate = useNavigate();

    const getProfileCompletion = () => {
        const data = profileData || {};
        const skillChips = String(data.skills || "")
            .split(",")
            .map((item) => item.trim())
            .filter(Boolean);
        const hasResume = !!data.resume;
        const hasProfilePicture = !!(
            data.profilePicture ||
            data.profilePictureUrl ||
            user?.profilePictureUrl
        );
        const hasSocial = !!(
            String(data.linkedin || "").trim() ||
            String(data.google || "").trim() ||
            String(data.facebook || "").trim() ||
            String(data.twitter || "").trim()
        );
        const isFilled = (v) => String(v ?? "").trim() !== "";

        const completionItems = [
            hasProfilePicture,
            isFilled(data.name || user?.fullName),
            isFilled(data.email || user?.email),
            isFilled(data.phone || user?.phone),
            isFilled(data.address),
            isFilled(data.gender),
            isFilled(data.dateOfBirth),
            hasResume,
            isFilled(data.preferredJobRole),
            isFilled(data.bio),
            skillChips.length > 0,
            isFilled(data.experience),
            isFilled(data.education),
            hasSocial,
        ];

        const completedCount = completionItems.filter(Boolean).length;
        return Math.round((completedCount / completionItems.length) * 100);
    };

    const completion = getProfileCompletion();
    const profileImageSrc =
        profileData?.profilePictureUrl ||
        user?.profilePictureUrl ||
        localStorage.getItem("userProfilePicture") ||
        "/assets/img/user-profile.png";
    const navItems = [
        { key: "home",           path: "/",                              icon: "ti-home", label: "My Home" },
        { key: "profile",        path: "/profile",                       icon: "ti-user", label: "Edit Profile" },
        { key: "applied-jobs",   path: "/candidate/applied-jobs",        icon: "ti-clipboard", label: "Applied Jobs" },
        { key: "create-resume",  path: "/candidate/create-resume",       icon: "ti-file", label: "Create Resume" },
        { key: "change-password",path: "/candidate/change-password",     icon: "ti-key", label: "Change Password" },
        { key: "wishlist",       path: "/candidate/wishlist",            icon: "ti-heart", label: "My Wishlist" },
        { key: "chat",           path: "/candidate/chat",                icon: "ti-comments", label: "Chat Inbox" },
    ];

    const missingItems = [
        "Daily job recommendations",
        "Job application updates",
        "Direct jobs from recruiters",
    ];

    const styles = {
        sidebar: {
            width: "260px",
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
        },        missingCard: {
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
                    <ProfileAvatarRing value={completion} imageSrc={profileImageSrc} />
                </div>
                <div style={styles.userName}>{user?.fullName || profileData?.name || "User"}</div>
                {/* What are you missing */}
                <div style={styles.missingCard}>
                    <div style={styles.missingTitle}>What are you missing?</div>
                    {missingItems.map((item, i) => (
                        <div key={i} style={styles.missingItem}>
                            <span style={styles.checkIcon}>✓</span>
                            {item}
                        </div>
                    ))}
                    <button
                        style={styles.completeBtn}
                        onClick={() => navigate("/profile")}
                        onMouseEnter={(e) => e.currentTarget.style.background = "#c94e2f"}
                        onMouseLeave={(e) => e.currentTarget.style.background = "#e05c3a"}
                    >
                        Complete profile
                    </button>
                </div>
            </div>

            {/* Navigation Card */}
            <div style={styles.navCard}>
                {navItems.map((item) => {
                    const isActive = activePage === item.key;
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
                    onClick={() => { logout(); navigate("/"); }}
                    onMouseEnter={(e) => e.currentTarget.style.background = "#fff5f3"}
                    onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}
                >
                    <i className="login-icon ti-power-off" style={styles.navIcon} />
                    <span style={{ fontSize: "13.5px", fontWeight: "600", color: "#e05c3a" }}>Logout</span>
                </div>
            </div>
        </div>
    );
}

export { ProfileAvatarRing };
export default CandidateSidebar;