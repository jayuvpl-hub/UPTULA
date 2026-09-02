// import React, { useState, useEffect } from "react";
// import { Link, useNavigate } from "react-router-dom";
// import { useAuth } from "../context/AuthContext";
// import LanguageSelector from "./LanguageSelector";

// function Header() {
//     const { user, profileData, logout, loading } = useAuth();
//     const navigate = useNavigate();
//     const [menuOpen, setMenuOpen] = useState(false);
//     const [mobileNavOpen, setMobileNavOpen] = useState(false);
//     const [employerMenuOpen, setEmployerMenuOpen] = useState(false);
//     const [imageError, setImageError] = useState(false);
    
//     const storedEmployerLogo = localStorage.getItem('employerLogoUrl');
//     const storedCandidatePhoto = localStorage.getItem('userProfilePicture');
    
//     // Determine avatar source with proper priority
//     const getAvatarSrc = () => {
//         if (imageError) {
//             return "/assets/img/user-profile.png";
//         }
        
//         // Priority 1: profileData profilePictureUrl
//         if (profileData?.profilePictureUrl) {
//             return profileData.profilePictureUrl;
//         }
        
//         // Priority 2: Based on profile type
//         if (profileData?.type === 'employer' && storedEmployerLogo) {
//             return storedEmployerLogo;
//         }
//         if (profileData?.type === 'candidate' && storedCandidatePhoto) {
//             return storedCandidatePhoto;
//         }
        
//         // Priority 3: Fallback to stored values
//         if (storedEmployerLogo) {
//             return storedEmployerLogo;
//         }
//         if (storedCandidatePhoto) {
//             return storedCandidatePhoto;
//         }
        
//         // Priority 4: User profilePictureUrl
//         if (user?.profilePictureUrl) {
//             return user.profilePictureUrl;
//         }
        
//         // Priority 5: Default image
//         return "/assets/img/user-profile.png";
//     };
    
//     const avatarSrc = getAvatarSrc();

//     // Reset image error when user or profileData changes
//     useEffect(() => {
//         setImageError(false);
//     }, [user, profileData]);

//     // Clean up leftover body styles/classes after bootstrap modal closes
//     useEffect(() => {
//         const cleanupModalStyles = () => {
//             const anyModalOpen = !!document.querySelector('.modal.show');
//             if (!anyModalOpen) {
//                 document.body.classList.remove('modal-open');
//                 document.body.style.paddingRight = '';
//                 document.documentElement.style.paddingRight = '';
//                 const fixedEls = document.querySelectorAll('.fixed-top, .fixed-bottom, .navbar-fixed, .home-sidebar');
//                 fixedEls.forEach((el) => {
//                     el.style.paddingRight = '';
//                     el.style.marginRight = '';
//                 });
//             }
//         };

//         const clickHandler = () => setTimeout(cleanupModalStyles, 50);

//         document.addEventListener('hidden.bs.modal', cleanupModalStyles);
//         document.addEventListener('click', clickHandler);

//         return () => {
//             document.removeEventListener('hidden.bs.modal', cleanupModalStyles);
//             document.removeEventListener('click', clickHandler);
//         };
//     }, []);

//     useEffect(() => {
//         if (mobileNavOpen) {
//             document.body.style.overflow = 'hidden';
//         } else {
//             document.body.style.overflow = '';
//         }
//         return () => {
//             document.body.style.overflow = '';
//         };
//     }, [mobileNavOpen]);

//     useEffect(() => {
//         if (!employerMenuOpen) return undefined;
//         const handleClickOutside = (e) => {
//             if (!e.target.closest('.header-employer-dropdown')) {
//                 setEmployerMenuOpen(false);
//             }
//         };
//         document.addEventListener('click', handleClickOutside);
//         return () => document.removeEventListener('click', handleClickOutside);
//     }, [employerMenuOpen]);

//     const openEmployerSigninModal = (e) => {
//         e.preventDefault();
//         e.stopPropagation();
//         setEmployerMenuOpen(false);
//         setMobileNavOpen(false);
//         window.dispatchEvent(new Event('uptula:open-employer-signin'));
//         if (typeof window !== 'undefined' && window.jQuery) {
//             window.jQuery('#signin').modal('show');
//         }
//     };

//     const openEmployerRegisterModal = (e) => {
//         e.preventDefault();
//         e.stopPropagation();
//         setEmployerMenuOpen(false);
//         setMobileNavOpen(false);
//         window.dispatchEvent(new Event('uptula:open-employer-register'));
//         if (typeof window !== 'undefined' && window.jQuery) {
//             window.jQuery('#register').modal('show');
//         }
//     };

//     const handleLogout = (e) => {
//         e?.preventDefault();
//         logout();
//         // Use setTimeout to ensure logout state update completes before navigation
//         setTimeout(() => {
//             navigate('/');
//         }, 0);
//     };

//     return (
//         <>
//             <style>{`
//                 /* Sidebar Styles - Inline CSS */
//                 .home-sidebar {
//                     width: 250px;
//                     min-height: calc(100vh - 80px);
//                     background: #ffffff;
//                     border-right: 1px solid #e8e8e8;
//                     padding: 20px 0;
//                     position: fixed;
//                     left: 0;
//                     top: 80px;
//                     overflow-y: auto;
//                     z-index: 100;
//                 }
//                 .home-sidebar .sidebar-logo {
//                     padding: 0 20px 20px;
//                     margin-bottom: 20px;
//                     border-bottom: 1px solid #e8e8e8;
//                 }
//                 .home-sidebar .sidebar-logo h2 {
//                     margin: 0;
//                     font-size: 20px;
//                     font-weight: 600;
//                     color: #334e6f;
//                 }
//                 .home-sidebar .sidebar-menu {
//                     list-style: none;
//                     padding: 0;
//                     margin: 0;
//                 }
//                 .home-sidebar .sidebar-menu li {
//                     padding: 12px 20px;
//                     cursor: pointer;
//                     transition: all 0.3s ease;
//                     display: flex;
//                     align-items: center;
//                     gap: 12px;
//                     color: #707f8c;
//                     font-size: 14px;
//                 }
//                 .home-sidebar .sidebar-menu li:hover {
//                     background: #f5f7f8;
//                     color: #26AE61;
//                 }
//                 .home-sidebar .sidebar-menu li svg {
//                     font-size: 16px;
//                 }
//                 .home-sidebar .sidebar-logout {
//                     position: absolute;
//                     bottom: 20px;
//                     left: 0;
//                     right: 0;
//                     padding: 12px 20px;
//                     cursor: pointer;
//                     display: flex;
//                     align-items: center;
//                     gap: 12px;
//                     color: #707f8c;
//                     font-size: 14px;
//                     border-top: 1px solid #e8e8e8;
//                     transition: all 0.3s ease;
//                 }
//                 .home-sidebar .sidebar-logout:hover {
//                     background: #f5f7f8;
//                     color: #26AE61;
//                 }
//                 .home-sidebar .sidebar-logout svg {
//                     font-size: 16px;
//                 }
//                 @media (max-width: 768px) {
//                     .home-sidebar {
//                         display: none;
//                     }
//                 }

//                 .navbar-close-btn {
//                     display: none !important;
//                 }

//                 .mobile-candidate-only {
//                     display: none !important;
//                 }
//                 .mobile-employer-only {
//                     display: none !important;
//                 }

//                 .header-employer-dropdown {
//                     position: relative;
//                     list-style: none;
//                     display: flex;
//                     align-items: center;
//                 }
//                 .header-employer-trigger {
//                     display: inline-flex;
//                     align-items: center;
//                     justify-content: center;
//                     gap: 6px;
//                     padding: 24px 15px;
//                     margin: 0;
//                     border: none;
//                     background: transparent !important;
//                     font-size: 14px;
//                     font-weight: 500;
//                     line-height: 1.2;
//                     cursor: pointer;
//                     white-space: nowrap;
//                     box-shadow: none !important;
//                 }
//                 .header-employer-trigger:hover,
//                 .header-employer-trigger:focus {
//                     outline: none;
//                     opacity: 0.92;
//                 }
//                 .header-employer-label,
//                 .header-employer-chevron {
//                     color: #ffffff;
//                     -webkit-text-fill-color: #ffffff;
//                 }
//                 .header-employer-chevron {
//                     font-size: 11px;
//                     transition: transform 180ms ease;
//                 }
//                 .header-employer-dropdown.is-open .header-employer-chevron {
//                     transform: rotate(180deg);
//                 }
//                 .header-employer-menu {
//                     position: absolute;
//                     top: calc(100% + 6px);
//                     left: 50%;
//                     right: auto;
//                     transform: translateX(-50%);
//                     min-width: 168px;
//                     margin: 0;
//                     padding: 6px;
//                     list-style: none;
//                     background: #ffffff;
//                     border: 1px solid #e2e8f0;
//                     border-radius: 12px;
//                     box-shadow: 0 12px 28px rgba(15, 23, 42, 0.14);
//                     z-index: 1200;
//                 }
//                 .header-employer-menu li {
//                     margin: 0;
//                     padding: 0;
//                 }
//                 .header-employer-menu button {
//                     width: 100%;
//                     display: block;
//                     padding: 10px 14px;
//                     border: none;
//                     border-radius: 8px;
//                     background: transparent;
//                     color: #334155;
//                     font-size: 14px;
//                     font-weight: 500;
//                     text-align: left;
//                     cursor: pointer;
//                     transition: background 150ms ease, color 150ms ease;
//                 }
//                 .header-employer-menu button:hover,
//                 .header-employer-menu button:focus {
//                     background: #f0fdf4;
//                     color: #15803d;
//                     outline: none;
//                 }

//                 @media (min-width: 992px) {
//                     nav.navbar.bootsnav #navbar-menu.navbar-collapse {
//                         display: flex !important;
//                         align-items: center;
//                         justify-content: flex-end;
//                     }
//                     nav.navbar.bootsnav #navbar-menu .navbar-left,
//                     nav.navbar.bootsnav #navbar-menu .navbar-right {
//                         float: none !important;
//                     }
//                     nav.navbar.bootsnav #navbar-menu .navbar-left {
//                         margin: 0 14px 0 0 !important;
//                     }
//                     nav.navbar.bootsnav #navbar-menu .navbar-right {
//                         margin: 0 !important;
//                     }
//                     nav.navbar.bootsnav #navbar-menu .header-employer-dropdown {
//                         display: flex;
//                         align-items: center;
//                     }
//                     nav.navbar.bootsnav #navbar-menu .header-employer-trigger {
//                         padding: 24px 15px;
//                         height: auto;
//                     }
//                 }

//                 /* Mobile nav: make collapse work without bootstrap JS */
//                 @media (max-width: 991px) {
//                     nav.navbar.bootsnav{
//                         background:#fff !important;
//                         box-shadow: 0 2px 10px rgba(15,23,42,0.06) !important;
//                     }
//                     .navbar .navbar-header{
//                         display: grid !important;
//                         grid-template-columns: 1fr auto 1fr;
//                         align-items: center;
//                         width: 100%;
//                         min-height: 70px;
//                         position: relative;
//                         padding: 0 12px !important;
//                         box-sizing: border-box;
//                         text-align: initial;
//                     }
//                     /* true viewport center: menu left, logo middle, equal spacer right */
//                     nav.navbar.bootsnav .navbar-brand{
//                         grid-column: 2;
//                         grid-row: 1;
//                         justify-self: center;
//                         align-self: center;
//                         height: auto !important;
//                         min-height: 0 !important;
//                         padding: 0 8px !important;
//                         margin: 0 !important;
//                         display: flex !important;
//                         align-items: center;
//                         justify-content: center;
//                         max-width: min(220px, 72vw);
//                         line-height: 0 !important;
//                         font-size: 0 !important;
//                         position: static !important;
//                         left: auto !important;
//                         top: auto !important;
//                         transform: translate(14px, 7px) !important;
//                         float: none !important;
//                     }
//                     .navbar .navbar-brand img{
//                         max-height: 36px;
//                         width: auto;
//                         display: block;
//                         object-fit: contain;
//                         margin: 0 !important;
//                     }
//                     /* prevent both logos showing/overlapping on mobile */
//                     .navbar-brand .logo-scrolled{ display:none !important; }
//                     .navbar-brand .logo-display{ display:block !important; }
//                     .navbar-toggle{
//                         grid-column: 1;
//                         grid-row: 1;
//                         justify-self: start;
//                         align-self: center;
//                         border: 1px solid rgba(15,23,42,0.18);
//                         border-radius: 10px;
//                         padding: 8px 10px;
//                         background: #fff;
//                         margin: 0 !important;
//                         float: none !important;
//                     }
//                     .navbar-toggle i{
//                         font-size: 18px;
//                         color:#0f172a;
//                     }

//                     .navbar-close-btn {
//                         display: block !important;
//                     }

//                     #navbar-menu.collapse{
//                         position: fixed;
//                         inset: 0 auto auto 0;
//                         top: 0;
//                         left: 0;
//                         height: 100vh;
//                         width: 280px;
//                         max-width: 85%;
//                         transform: translateX(-100%);
//                         transition: transform 240ms ease, opacity 240ms ease;
//                         opacity: 0;
//                         display: flex !important;
//                         flex-direction: column;
//                         background:#ffffff;
//                         border-right: 1px solid rgba(148,163,184,0.18);
//                         box-shadow: 0 18px 44px rgba(15,23,42,0.18);
//                         padding: 12px 12px 18px;
//                         z-index: 110;
//                         box-sizing: border-box !important;
//                         overflow-x: hidden !important;
//                         min-width: 0 !important;
//                     }
//                     /* bootsnav sets ul.nav to 293px — wider than the 280px drawer */
//                     nav.navbar.bootsnav.navbar-mobile #navbar-menu ul.nav,
//                     nav.navbar.bootsnav.navbar-mobile #navbar-menu .navbar-nav {
//                         width: 100% !important;
//                         max-width: 100% !important;
//                         padding-left: 0 !important;
//                         padding-right: 0 !important;
//                         margin-left: 0 !important;
//                         margin-right: 0 !important;
//                         box-sizing: border-box !important;
//                     }
//                     #navbar-menu.collapse.is-open{
//                         transform: translateX(0);
//                         opacity: 1;
//                     }
//                     .mobile-nav-backdrop {
//                         position: fixed;
//                         inset: 0;
//                         background: rgba(15, 23, 42, 0.36);
//                         opacity: 0;
//                         visibility: hidden;
//                         transition: opacity 240ms ease, visibility 240ms ease;
//                         z-index: 100;
//                     }
//                     .mobile-nav-backdrop.visible {
//                         opacity: 1;
//                         visibility: visible;
//                     }
//                     .navbar-close-btn {
//                         display: flex;
//                         align-items: center;
//                         justify-content: center;
//                         width: 30px;
//                         height: 30px;
//                         border: none;
//                         background: #e5e7eb;
//                         border-radius: 50%;
//                         color: #4b5563;
//                         font-size: 14px;
//                         line-height: 1;
//                         padding: 0;
//                         margin: 0;
//                         position: absolute;
//                         top: 6px;
//                         right: 8px;
//                         cursor: pointer;
//                         transition: background 150ms ease, color 150ms ease, transform 150ms ease;
//                         z-index: 12;
//                     }
//                     .navbar-close-btn i {
//                         font-size: 12px;
//                         line-height: 1;
//                     }
//                     .navbar-close-btn:hover {
//                         background: #d1d5db;
//                         color: #111827;
//                         transform: scale(1.03);
//                     }
//                     #navbar-menu .navbar-left,
//                     #navbar-menu .navbar-right{
//                         float:none !important;
//                         display:flex;
//                         flex-direction:column;
//                         gap: 6px;
//                         margin: 0 !important;
//                         padding: 0 !important;
//                         width: 100% !important;
//                         max-width: 100% !important;
//                         min-width: 0 !important;
//                         box-sizing: border-box !important;
//                     }
//                     #navbar-menu .navbar-right{
//                         order: -1;
//                         margin-top: 48px !important;
//                         padding-top: 0 !important;
//                         border-top: none;
//                         margin-bottom: 10px !important;
//                         padding-bottom: 10px !important;
//                         padding-right: 0 !important;
//                         padding-left: 0 !important;
//                         border-bottom: 1px solid rgba(148,163,184,0.18);
//                     }
//                     #navbar-menu .nav > li{
//                         width: 100% !important;
//                         max-width: 100% !important;
//                         box-sizing: border-box !important;
//                         min-width: 0 !important;
//                     }
//                     #navbar-menu .nav > li > a{
//                         display:flex;
//                         align-items:center;
//                         justify-content:flex-start;
//                         width: 100% !important;
//                         max-width: 100% !important;
//                         box-sizing: border-box !important;
//                         min-width: 0 !important;
//                         padding: 10px 10px;
//                         border-radius: 10px;
//                         color: #16a34a !important;
//                     }
//                     nav.navbar.bootsnav #navbar-menu ul.nav > li > a.btn-signup.red-btn {
//                         width: 100% !important;
//                         max-width: 100% !important;
//                         margin-left: 0 !important;
//                         margin-right: 0 !important;
//                     }
//                     #navbar-menu .nav > li > a:hover,
//                     #navbar-menu .nav > li > a:focus{
//                         background: #f0fdf4 !important;
//                         color: #15803d !important;
//                     }
//                     #navbar-menu .btn-signup {
//                         display: inline-flex !important;
//                         width: 100% !important;
//                         max-width: 100% !important;
//                         align-items: center !important;
//                         justify-content: center !important;
//                         gap: 10px !important;
//                         padding: 12px 18px !important;
//                         box-sizing: border-box !important;
//                         white-space: nowrap !important;
//                         text-align: center !important;
//                         border-radius: 14px !important;
//                         font-weight: 600 !important;
//                         margin: 0 !important;
//                         background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%) !important;
//                         color: #fff !important;
//                         border: none !important;
//                     }
//                     #navbar-menu .navbar-right .br-right,
//                     #navbar-menu .navbar-right .sign-up {
//                         width: 100% !important;
//                         padding: 0 !important;
//                         margin: 0 !important;
//                     }
//                     #navbar-menu .navbar-right .btn-signup .img-responsive,
//                     #navbar-menu .navbar-right .btn-signup img {
//                         width: 22px !important;
//                         height: 22px !important;
//                         object-fit: cover !important;
//                     }
//                     #navbar-menu .navbar-right .btn-signup span {
//                         flex: 1 1 auto !important;
//                         min-width: 0 !important;
//                         text-align: center !important;
//                         display: inline-block !important;
//                         overflow: hidden !important;
//                         text-overflow: ellipsis !important;
//                         white-space: nowrap !important;
//                     }
//                     #navbar-menu .navbar-right .btn-signup {
//                         display: inline-flex !important;
//                         width: 100% !important;
//                         min-height: 44px !important;
//                     }
//                     #navbar-menu .navbar-right .btn-signup i,
//                     #navbar-menu .navbar-right .btn-signup span {
//                         display: inline-flex !important;
//                         align-items: center !important;
//                     }
//                     #navbar-menu .navbar-right .sign-up > a.btn-signup,
//                     #navbar-menu .navbar-right .sign-up > a.btn-signup span,
//                     #navbar-menu .navbar-right .sign-up > a.btn-signup i {
//                         color: #fff !important;
//                     }
//                     /* Keep login/register icon-text close on mobile */
//                     #navbar-menu .navbar-right .br-right .btn-signup,
//                     #navbar-menu .navbar-right > .sign-up:not(.dropdown) .btn-signup {
//                         gap: 6px !important;
//                         justify-content: center !important;
//                     }
//                     #navbar-menu .navbar-right .br-right > a.btn-signup,
//                     #navbar-menu .navbar-right > .sign-up:not(.dropdown) > a.btn-signup,
//                     #navbar-menu .navbar-right .br-right > a.btn-signup:hover,
//                     #navbar-menu .navbar-right > .sign-up:not(.dropdown) > a.btn-signup:hover,
//                     #navbar-menu .navbar-right .br-right > a.btn-signup:focus,
//                     #navbar-menu .navbar-right > .sign-up:not(.dropdown) > a.btn-signup:focus {
//                         color: #fff !important;
//                     }
//                     #navbar-menu .navbar-right .br-right .btn-signup span,
//                     #navbar-menu .navbar-right > .sign-up:not(.dropdown) .btn-signup span {
//                         flex: 0 0 auto !important;
//                         text-align: left !important;
//                     }
//                     #navbar-menu .navbar-right .br-right .btn-signup i,
//                     #navbar-menu .navbar-right > .sign-up:not(.dropdown) .btn-signup i,
//                     #navbar-menu .navbar-right > .sign-up:not(.dropdown) .btn-signup span {
//                         color: #fff !important;
//                     }
//                     .mobile-candidate-only {
//                         display: block !important;
//                     }
//                     .mobile-employer-only {
//                         display: block !important;
//                     }
//                     #navbar-menu .header-employer-dropdown {
//                         width: 100% !important;
//                         max-width: 100% !important;
//                         margin-top: 0 !important;
//                     }
//                     #navbar-menu .header-employer-trigger {
//                         width: 100% !important;
//                         max-width: 100% !important;
//                         justify-content: center !important;
//                         padding: 10px 10px !important;
//                         border-radius: 10px !important;
//                     }
//                     #navbar-menu .header-employer-menu {
//                         position: static !important;
//                         left: auto !important;
//                         transform: none !important;
//                         width: 100% !important;
//                         max-width: 100% !important;
//                         margin-top: 4px !important;
//                         box-shadow: none !important;
//                         border: 1px solid rgba(148, 163, 184, 0.2) !important;
//                         background: #f8fafc !important;
//                     }
//                     #navbar-menu .header-employer-trigger:hover,
//                     #navbar-menu .header-employer-trigger:focus {
//                         background: #f0fdf4 !important;
//                     }
//                     #navbar-menu .header-employer-label,
//                     #navbar-menu .header-employer-chevron {
//                         color: #16a34a !important;
//                         -webkit-text-fill-color: #16a34a !important;
//                     }
//                     #navbar-menu .header-employer-menu button {
//                         color: #16a34a !important;
//                     }
//                 }
//             `}</style>
//             {/* ======================= Start Navigation ===================== */}
//             <nav className="navbar navbar-default navbar-mobile navbar-fixed white no-background bootsnav">
//                 <div className="container">
//                     <div className="navbar-header">
//                         <button
//                             type="button"
//                             className="navbar-toggle"
//                             aria-controls="navbar-menu"
//                             aria-expanded={mobileNavOpen ? "true" : "false"}
//                             onClick={() => setMobileNavOpen((v) => !v)}
//                         >
//                             {" "}
//                             <i className="fa fa-bars" />{" "}
//                         </button>
//                         <Link className="navbar-brand" to="/">
//                             {" "}
//                             <img
//                                 src="/assets/img/Uptula.png"
//                                 className="logo logo-display"
//                                 alt="Uptula Logo"
//                             />{" "}
//                             <img
//                                 src="/assets/img/Uptula.png"
//                                 className="logo logo-scrolled"
//                                 alt="Uptula Logo"
//                             />{" "}
//                         </Link>
//                     </div>
//                     <div className={`mobile-nav-backdrop ${mobileNavOpen ? 'visible' : ''}`} onClick={() => setMobileNavOpen(false)} />
//                     <div className={`collapse navbar-collapse ${mobileNavOpen ? "is-open" : ""}`} id="navbar-menu">
//                         <button type="button" className="navbar-close-btn" onClick={() => setMobileNavOpen(false)} aria-label="Close menu">
//                             <i className="ti-close" />
//                         </button>
//                         <ul
//                             className="nav navbar-nav navbar-left"
//                             data-in="fadeInDown"
//                             data-out="fadeOutUp"
//                         >
//                             <li className="dropdown active">
//                                 {" "}
//                                 <Link to="/" onClick={() => setMobileNavOpen(false)}>Home</Link>{" "}
//                             </li>

//                             <li className="active">
//                                 {" "}
//                                 <Link to="/jobs" onClick={() => setMobileNavOpen(false)}>Jobs</Link>{" "}
//                             </li>

//                             <li className="dropdown">
//                                 {" "}
//                                 <Link to="/Services" onClick={() => setMobileNavOpen(false)}>Services</Link>{" "}
//                             </li>
//                             {!loading && !user && (
//                                 <li className={`header-employer-dropdown dropdown${employerMenuOpen ? ' is-open' : ''}`}>
//                                     <button
//                                         type="button"
//                                         className="header-employer-trigger"
//                                         aria-expanded={employerMenuOpen}
//                                         aria-haspopup="true"
//                                         onClick={(e) => {
//                                             e.preventDefault();
//                                             e.stopPropagation();
//                                             setEmployerMenuOpen((v) => !v);
//                                         }}
//                                     >
//                                         <span className="header-employer-label">For employer</span>
//                                         <i className="ti-angle-down header-employer-chevron" aria-hidden="true" />
//                                     </button>
//                                     {employerMenuOpen && (
//                                         <ul className="header-employer-menu" role="menu">
//                                             <li role="none">
//                                                 <button type="button" role="menuitem" onClick={openEmployerSigninModal}>
//                                                     Login
//                                                 </button>
//                                             </li>
//                                             <li role="none">
//                                                 <button type="button" role="menuitem" onClick={openEmployerRegisterModal}>
//                                                     Register
//                                                 </button>
//                                             </li>
//                                         </ul>
//                                     )}
//                                 </li>
//                             )}
//                             {user && user.role !== 'provider' && user.role !== 'employer' && user.role !== 'admin' && (
//                                 <>
//                                     <li className="mobile-candidate-only">
//                                         <Link to="/profile" onClick={() => setMobileNavOpen(false)}>Edit Profile</Link>
//                                     </li>
//                                     <li className="mobile-candidate-only">
//                                         <Link to="/candidate/applied-jobs" onClick={() => setMobileNavOpen(false)}>Applied Jobs</Link>
//                                     </li>
//                                     <li className="mobile-candidate-only">
//                                         <Link to="/candidate/create-resume" onClick={() => setMobileNavOpen(false)}>Create Resume</Link>
//                                     </li>
//                                     <li className="mobile-candidate-only">
//                                         <Link to="/candidate/change-password" onClick={() => setMobileNavOpen(false)}>Change Password</Link>
//                                     </li>
//                                     <li className="mobile-candidate-only">
//                                         <Link to="/candidate/chat" onClick={() => setMobileNavOpen(false)}>Chat Inbox</Link>
//                                     </li>
//                                     <li className="mobile-candidate-only">
//                                         <Link to="/candidate/wishlist" onClick={() => setMobileNavOpen(false)}>My Wishlist</Link>
//                                     </li>
//                                     <li className="mobile-candidate-only">
//                                         <a
//                                             href="#"
//                                             onClick={(e) => {
//                                                 e.preventDefault();
//                                                 setMobileNavOpen(false);
//                                                 handleLogout(e);
//                                             }}
//                                         >
//                                             Logout
//                                         </a>
//                                     </li>
//                                 </>
//                             )}
//                             {user && (user.role === 'provider' || user.role === 'employer' || user.role === 'admin') && (
//                                 <>
//                                     <li className="mobile-employer-only">
//                                         <Link to="/employer/profile" onClick={() => setMobileNavOpen(false)}>Add Company Details</Link>
//                                     </li>
//                                     <li className="mobile-employer-only">
//                                         <Link to="/employer/add-jobs" onClick={() => setMobileNavOpen(false)}>Add Jobs</Link>
//                                     </li>
//                                     <li className="mobile-employer-only">
//                                         <Link to="/employer/manage-jobs" onClick={() => setMobileNavOpen(false)}>Manage Jobs</Link>
//                                     </li>
//                                     <li className="mobile-employer-only">
//                                         <Link to="/employer/analytics" onClick={() => setMobileNavOpen(false)}>Analytics Reports</Link>
//                                     </li>
//                                     <li className="mobile-employer-only">
//                                         <Link to="/employer/view-candidates" onClick={() => setMobileNavOpen(false)}>View Candidates</Link>
//                                     </li>
//                                     <li className="mobile-employer-only">
//                                         <Link to="/employer/chat" onClick={() => setMobileNavOpen(false)}>Chat Center</Link>
//                                     </li>
//                                     <li className="mobile-employer-only">
//                                         <Link to="/employer/boolean-search" onClick={() => setMobileNavOpen(false)}>Boolean Search</Link>
//                                     </li>
//                                     <li className="mobile-employer-only">
//                                         <Link to="/employer/resume-scoring" onClick={() => setMobileNavOpen(false)}>Resume Scoring</Link>
//                                     </li>
//                                     <li className="mobile-employer-only">
//                                         <Link to="/employer/referral" onClick={() => setMobileNavOpen(false)}>Referral</Link>
//                                     </li>
//                                     <li className="mobile-employer-only">
//                                         <Link to="/employer/premium" onClick={() => setMobileNavOpen(false)}>Premium Manager</Link>
//                                     </li>
//                                     <li className="mobile-employer-only">
//                                         <Link to="/employer/support" onClick={() => setMobileNavOpen(false)}>Support & Tickets</Link>
//                                     </li>
//                                     <li className="mobile-employer-only">
//                                         <Link to="/employer/change-password" onClick={() => setMobileNavOpen(false)}>Change Password</Link>
//                                     </li>
//                                     <li className="mobile-employer-only">
//                                         <a
//                                             href="#"
//                                             onClick={(e) => {
//                                                 e.preventDefault();
//                                                 setMobileNavOpen(false);
//                                                 handleLogout(e);
//                                             }}
//                                         >
//                                             Logout
//                                         </a>
//                                     </li>
//                                 </>
//                             )}
//                         </ul>
//                             <ul className="nav navbar-nav navbar-right">
//                                 {loading ? (
//                                     <li className="br-right">
//                                         <span className="btn-signup red-btn" style={{opacity: 0.7}}>
//                                             <i className="login-icon ti-user" />
//                                             Loading...
//                                         </span>
//                                     </li>
//                                 ) : user ? (
//                                     <li className="dropdown sign-up" 
//                                         onMouseEnter={() => setMenuOpen(true)}
//                                         onMouseLeave={() => setMenuOpen(false)}
//                                     >
//                                         <Link
//                                             to={(user.role === 'provider' || user.role === 'employer' || user.role === 'admin') ? "/employer/profile" : "/profile"}
//                                             className="btn-signup red-btn"
//                                             onClick={() => setMobileNavOpen(false)}
//                                             style={{
//                                                 display: 'flex',
//                                                 alignItems: 'center',
//                                                 gap: '8px',
//                                                 textDecoration: 'none'
//                                             }}
//                                         >
//                                             <img
//                                                 src={avatarSrc}
//                                                 className="img-responsive img-circle"
//                                                 alt={user.fullName || 'User'}
//                                                 style={{
//                                                     width: '30px',
//                                                     height: '30px',
//                                                     objectFit: 'cover',
//                                                     borderRadius: '50%',
//                                                     backgroundColor: '#ffffff',
//                                                     border: '2px solid rgba(255,255,255,0.3)',
//                                                     display: 'block',
//                                                     flexShrink: 0
//                                                 }}
//                                                 onError={(e) => {
//                                                     if (e.target.src !== "/assets/img/user-profile.png") {
//                                                         setImageError(true);
//                                                         e.target.src = "/assets/img/user-profile.png";
//                                                     }
//                                                 }}
//                                                 onLoad={() => {
//                                                     setImageError(false);
//                                                 }}
//                                             />
//                                             <span style={{ whiteSpace: 'nowrap' }}>{user.fullName}</span>
//                                         </Link>
//                                         {menuOpen && (
//                                             <ul className="dropdown-menu" style={{display: 'block'}}>
//                                                 {(user.role === 'provider' || user.role === 'employer' || user.role === 'admin') ? (
//                                                     <>
//                                                         <li>
//                                                             <Link to="/employer/profile" onClick={() => { setMenuOpen(false); setMobileNavOpen(false); }}>Dashboard</Link>
//                                                         </li>
//                                                     </>
//                                                 ) : (
//                                                     <>
//                                                         <li>
//                                                             <Link to="/Companies" onClick={() => { setMenuOpen(false); setMobileNavOpen(false); }}>Browse Jobs</Link>
//                                                         </li>
//                                                         <li>
//                                                             <Link to="/profile" onClick={() => { setMenuOpen(false); setMobileNavOpen(false); }}>My Profile</Link>
//                                                         </li>
//                                                         <li>
//                                                             <Link to="/candidate/create-resume" onClick={() => { setMenuOpen(false); setMobileNavOpen(false); }}>Create Resume</Link>
//                                                         </li>
//                                                         <li>
//                                                             <Link to="/candidate/wishlist" onClick={() => { setMenuOpen(false); setMobileNavOpen(false); }}>My Wishlist</Link>
//                                                         </li>
//                                                         <li>
//                                                             <Link to="/candidate/applied-jobs" onClick={() => { setMenuOpen(false); setMobileNavOpen(false); }}>Applied Jobs</Link>
//                                                         </li>
//                                                     </>
//                                                 )}
//                                                 <li>
//                                                     <a href="#" onClick={(e) => { e.preventDefault(); setMenuOpen(false); handleLogout(e); }}>Sign Out</a>
//                                                 </li>
//                                             </ul>
//                                         )}
//                                     </li>
//                                 ) : (
//                                     <>
//                                         <li className="br-right">
//                                             <a href="#"
//                                                 className="btn-signup red-btn"
//                                                 data-toggle="modal"
//                                                 data-target="#signin"
//                                                 onClick={(e) => {
//                                                     e.preventDefault();
//                                                     setMobileNavOpen(false);
//                                                     window.dispatchEvent(new Event('uptula:open-default-signin'));
//                                                 }}
//                                             >
//                                                 <i className="login-icon ti-user" />
//                                                 Login
//                                             </a>
//                                         </li>
//                                         <li className="sign-up">
//                                             <a href="#" className="btn-signup red-btn" data-toggle="modal" data-target="#register" onClick={(e) => { e.preventDefault(); setMobileNavOpen(false); }}>
//                                                 <span className="ti-briefcase" />
//                                                 Register
//                                             </a>
//                                         </li>
//                                     </>
//                                 )}
//                                 <li className="uptula-lang-li" style={{ display: 'flex', alignItems: 'center', marginLeft: '14px', marginRight: '-6px' }}>
//                                     <LanguageSelector />
//                                 </li>
//                             </ul>
//                         </div>
//                     </div>
//                 </nav>
//                 {/* ======================= End Navigation ===================== */}
//             </>

//     );
// }

// export default Header;



import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import LanguageSelector from "./LanguageSelector";
import useJobCategories from "../hooks/useJobCategories";
import { fetchSubcategoriesByCategoryId } from "../utils/jobCategoriesApi";
import { getCategoryIcon } from "../utils/categoryIcons";

function Header() {
    const { user, profileData, logout, loading } = useAuth();
    const navigate = useNavigate();
    const [menuOpen, setMenuOpen] = useState(false);
    const [mobileNavOpen, setMobileNavOpen] = useState(false);
    const [employerMenuOpen, setEmployerMenuOpen] = useState(false);
    const [imageError, setImageError] = useState(false);

    // ── Jobs mega-menu (categories + subcategories) ──────────────────────────
    const { categories: jobCategories, loading: jobCategoriesLoading } = useJobCategories();
    const [jobsMenuOpen, setJobsMenuOpen] = useState(false);
    const [activeCatId, setActiveCatId] = useState(null);   // desktop right-pane
    const [mobileCatId, setMobileCatId] = useState(null);   // mobile accordion
    const [subsCache, setSubsCache] = useState({});         // { [catId]: subcategory[] | null(loading) }
    const [isDesktopNav, setIsDesktopNav] = useState(
        typeof window !== 'undefined' ? window.matchMedia('(min-width: 992px)').matches : true
    );

    useEffect(() => {
        if (typeof window === 'undefined') return undefined;
        const mq = window.matchMedia('(min-width: 992px)');
        const onChange = (e) => setIsDesktopNav(e.matches);
        if (mq.addEventListener) mq.addEventListener('change', onChange);
        else mq.addListener(onChange);
        return () => {
            if (mq.removeEventListener) mq.removeEventListener('change', onChange);
            else mq.removeListener(onChange);
        };
    }, []);

    const loadSubcategories = (catId) => {
        if (!catId || catId in subsCache) return;
        setSubsCache((prev) => ({ ...prev, [catId]: null })); // mark loading
        fetchSubcategoriesByCategoryId(catId)
            .then((list) => setSubsCache((prev) => ({ ...prev, [catId]: Array.isArray(list) ? list : [] })))
            .catch(() => setSubsCache((prev) => ({ ...prev, [catId]: [] })));
    };

    const goToJobsCategory = (cat, sub) => {
        const params = new URLSearchParams();
        if (cat?.name) params.set('category', cat.name);
        if (sub?.name) params.set('subcategory', sub.name);
        setJobsMenuOpen(false);
        setMobileNavOpen(false);
        setMobileCatId(null);
        navigate(`/jobs${params.toString() ? `?${params.toString()}` : ''}`);
    };

    const openJobsMenuDesktop = () => {
        if (!isDesktopNav) return;
        setJobsMenuOpen(true);
        if (jobCategories.length) {
            const first = activeCatId || jobCategories[0].id;
            setActiveCatId(first);
            loadSubcategories(first);
        }
    };

    const toggleMobileCat = (catId) => {
        setMobileCatId((prev) => {
            const next = prev === catId ? null : catId;
            if (next) loadSubcategories(catId);
            return next;
        });
    };
    
    const storedEmployerLogo = localStorage.getItem('employerLogoUrl');
    const storedCandidatePhoto = localStorage.getItem('userProfilePicture');
    
    // Determine avatar source with proper priority
    const getAvatarSrc = () => {
        if (imageError) {
            return "/assets/img/user-profile.png";
        }
        
        // Priority 1: profileData profilePictureUrl
        if (profileData?.profilePictureUrl) {
            return profileData.profilePictureUrl;
        }
        
        // Priority 2: Based on profile type
        if (profileData?.type === 'employer' && storedEmployerLogo) {
            return storedEmployerLogo;
        }
        if (profileData?.type === 'candidate' && storedCandidatePhoto) {
            return storedCandidatePhoto;
        }
        
        // Priority 3: Fallback to stored values
        if (storedEmployerLogo) {
            return storedEmployerLogo;
        }
        if (storedCandidatePhoto) {
            return storedCandidatePhoto;
        }
        
        // Priority 4: User profilePictureUrl
        if (user?.profilePictureUrl) {
            return user.profilePictureUrl;
        }
        
        // Priority 5: Default image
        return "/assets/img/user-profile.png";
    };
    
    const avatarSrc = getAvatarSrc();

    // Reset image error when user or profileData changes
    useEffect(() => {
        setImageError(false);
    }, [user, profileData]);

    // Clean up leftover body styles/classes after bootstrap modal closes
    useEffect(() => {
        const cleanupModalStyles = () => {
            const anyModalOpen = !!document.querySelector('.modal.show');
            if (!anyModalOpen) {
                document.body.classList.remove('modal-open');
                document.body.style.paddingRight = '';
                document.documentElement.style.paddingRight = '';
                const fixedEls = document.querySelectorAll('.fixed-top, .fixed-bottom, .navbar-fixed, .home-sidebar');
                fixedEls.forEach((el) => {
                    el.style.paddingRight = '';
                    el.style.marginRight = '';
                });
            }
        };

        const clickHandler = () => setTimeout(cleanupModalStyles, 50);

        document.addEventListener('hidden.bs.modal', cleanupModalStyles);
        document.addEventListener('click', clickHandler);

        return () => {
            document.removeEventListener('hidden.bs.modal', cleanupModalStyles);
            document.removeEventListener('click', clickHandler);
        };
    }, []);

    useEffect(() => {
        if (mobileNavOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }
        return () => {
            document.body.style.overflow = '';
        };
    }, [mobileNavOpen]);

    useEffect(() => {
        if (!employerMenuOpen) return undefined;
        const handleClickOutside = (e) => {
            if (!e.target.closest('.header-employer-dropdown')) {
                setEmployerMenuOpen(false);
            }
        };
        document.addEventListener('click', handleClickOutside);
        return () => document.removeEventListener('click', handleClickOutside);
    }, [employerMenuOpen]);

    const openEmployerSigninModal = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setEmployerMenuOpen(false);
        setMobileNavOpen(false);
        window.dispatchEvent(new Event('uptula:open-employer-signin'));
        if (typeof window !== 'undefined' && window.jQuery) {
            window.jQuery('#signin').modal('show');
        }
    };

    const openEmployerRegisterModal = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setEmployerMenuOpen(false);
        setMobileNavOpen(false);
        window.dispatchEvent(new Event('uptula:open-employer-register'));
        if (typeof window !== 'undefined' && window.jQuery) {
            window.jQuery('#register').modal('show');
        }
    };

    const handleLogout = (e) => {
        e?.preventDefault();
        logout();
        // Use setTimeout to ensure logout state update completes before navigation
        setTimeout(() => {
            navigate('/');
        }, 0);
    };

    return (
        <>
            <style>{`
                /* Sidebar Styles - Inline CSS */
                .home-sidebar {
                    width: 250px;
                    min-height: calc(100vh - 80px);
                    background: #ffffff;
                    border-right: 1px solid #e8e8e8;
                    padding: 20px 0;
                    position: fixed;
                    left: 0;
                    top: 80px;
                    overflow-y: auto;
                    z-index: 100;
                }
                .home-sidebar .sidebar-logo {
                    padding: 0 20px 20px;
                    margin-bottom: 20px;
                    border-bottom: 1px solid #e8e8e8;
                }
                .home-sidebar .sidebar-logo h2 {
                    margin: 0;
                    font-size: 20px;
                    font-weight: 600;
                    color: #334e6f;
                }
                .home-sidebar .sidebar-menu {
                    list-style: none;
                    padding: 0;
                    margin: 0;
                }
                .home-sidebar .sidebar-menu li {
                    padding: 12px 20px;
                    cursor: pointer;
                    transition: all 0.3s ease;
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    color: #707f8c;
                    font-size: 14px;
                }
                .home-sidebar .sidebar-menu li:hover {
                    background: #f5f7f8;
                    color: #26AE61;
                }
                .home-sidebar .sidebar-menu li svg {
                    font-size: 16px;
                }
                .home-sidebar .sidebar-logout {
                    position: absolute;
                    bottom: 20px;
                    left: 0;
                    right: 0;
                    padding: 12px 20px;
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    color: #707f8c;
                    font-size: 14px;
                    border-top: 1px solid #e8e8e8;
                    transition: all 0.3s ease;
                }
                .home-sidebar .sidebar-logout:hover {
                    background: #f5f7f8;
                    color: #26AE61;
                }
                .home-sidebar .sidebar-logout svg {
                    font-size: 16px;
                }
                @media (max-width: 768px) {
                    .home-sidebar {
                        display: none;
                    }
                }

                .navbar-close-btn {
                    display: none !important;
                }

                .mobile-candidate-only {
                    display: none !important;
                }
                .mobile-employer-only {
                    display: none !important;
                }

                .header-employer-dropdown {
                    position: relative;
                    list-style: none;
                    display: flex;
                    align-items: center;
                }
                .header-employer-trigger {
                    display: inline-flex;
                    align-items: center;
                    justify-content: center;
                    gap: 6px;
                    padding: 24px 15px;
                    margin: 0;
                    border: none;
                    background: transparent !important;
                    font-size: 14px;
                    font-weight: 500;
                    line-height: 1.2;
                    cursor: pointer;
                    white-space: nowrap;
                    box-shadow: none !important;
                }
                .header-employer-trigger:hover,
                .header-employer-trigger:focus {
                    outline: none;
                    opacity: 0.92;
                }
                .header-employer-label,
                .header-employer-chevron {
                    color: #ffffff;
                    -webkit-text-fill-color: #ffffff;
                }
                .header-employer-chevron {
                    font-size: 11px;
                    transition: transform 180ms ease;
                }
                .header-employer-dropdown.is-open .header-employer-chevron {
                    transform: rotate(180deg);
                }
                .header-employer-menu {
                    position: absolute;
                    top: calc(100% + 6px);
                    left: 50%;
                    right: auto;
                    transform: translateX(-50%);
                    min-width: 168px;
                    margin: 0;
                    padding: 6px;
                    list-style: none;
                    background: #ffffff;
                    border: 1px solid #e2e8f0;
                    border-radius: 12px;
                    box-shadow: 0 12px 28px rgba(15, 23, 42, 0.14);
                    z-index: 1200;
                }
                .header-employer-menu li {
                    margin: 0;
                    padding: 0;
                }
                .header-employer-menu button {
                    width: 100%;
                    display: block;
                    padding: 10px 14px;
                    border: none;
                    border-radius: 8px;
                    background: transparent;
                    color: #334155;
                    font-size: 14px;
                    font-weight: 500;
                    text-align: left;
                    cursor: pointer;
                    transition: background 150ms ease, color 150ms ease;
                }
                .header-employer-menu button:hover,
                .header-employer-menu button:focus {
                    background: #f0fdf4;
                    color: #15803d;
                    outline: none;
                }

                /* ── Language selector alignment fix ── */
                nav.navbar.bootsnav ul.navbar-right {
                    display: flex !important;
                    align-items: center !important;
                    flex-wrap: nowrap !important;
                }
                nav.navbar.bootsnav ul.navbar-right > li {
                    display: flex !important;
                    align-items: center !important;
                    float: none !important;
                }
                .uptula-lang-li {
                    padding: 0 !important;
                    margin: 0 0 0 10px !important;
                    height: auto !important;
                    line-height: 1 !important;
                    position: relative !important;
                    top: 3px !important;
                }
                .uptula-lang-li > * {
                    display: flex !important;
                    align-items: center !important;
                    vertical-align: middle !important;
                    position: relative !important;
                    top: 0 !important;
                }

                @media (min-width: 992px) {
                    nav.navbar.bootsnav #navbar-menu.navbar-collapse {
                        display: flex !important;
                        align-items: center;
                        justify-content: flex-end;
                        min-width: 0;
                    }
                    nav.navbar.bootsnav #navbar-menu .navbar-left,
                    nav.navbar.bootsnav #navbar-menu .navbar-right {
                        float: none !important;
                        flex-wrap: nowrap !important;
                        align-items: center !important;
                    }
                    nav.navbar.bootsnav #navbar-menu .navbar-left {
                        display: flex !important;
                        margin: 0 14px 0 0 !important;
                        flex: 0 1 auto;
                        min-width: 0;
                        max-width: min(52vw, 520px);
                        overflow: visible;
                    }
                    nav.navbar.bootsnav #navbar-menu .navbar-left > li {
                        flex: 0 1 auto;
                        min-width: 0;
                        max-width: 9.5em;
                    }
                    nav.navbar.bootsnav #navbar-menu .navbar-left > li.header-employer-dropdown {
                        max-width: none;
                        overflow: visible;
                        position: relative;
                    }
                    nav.navbar.bootsnav #navbar-menu .navbar-left > li > a,
                    nav.navbar.bootsnav #navbar-menu .navbar-left .header-employer-trigger,
                    nav.navbar.bootsnav #navbar-menu .navbar-left .header-employer-label {
                        display: block;
                        max-width: 100%;
                        overflow: hidden;
                        text-overflow: ellipsis;
                        white-space: nowrap;
                        box-sizing: border-box;
                    }
                    nav.navbar.bootsnav #navbar-menu .header-employer-menu {
                        overflow: visible;
                        z-index: 1300;
                    }
                    nav.navbar.bootsnav #navbar-menu .navbar-left .header-employer-trigger {
                        display: inline-flex;
                        align-items: center;
                        max-width: 100%;
                    }
                    nav.navbar.bootsnav #navbar-menu .navbar-left .header-employer-label {
                        min-width: 0;
                    }
                    nav.navbar.bootsnav #navbar-menu .navbar-right {
                        margin: 0 !important;
                        display: flex !important;
                        align-items: center !important;
                        flex: 0 0 auto;
                    }
                    nav.navbar.bootsnav #navbar-menu .navbar-right > li {
                        flex: 0 1 auto;
                        min-width: 0;
                    }
                    nav.navbar.bootsnav #navbar-menu .navbar-right .btn-signup {
                        display: inline-flex !important;
                        align-items: center !important;
                        height: 42px !important;
                        max-height: 42px !important;
                        max-width: 11.5em;
                        padding: 0 16px !important;
                        overflow: hidden;
                        white-space: nowrap !important;
                        box-sizing: border-box !important;
                    }
                    nav.navbar.bootsnav #navbar-menu .navbar-right .btn-signup .header-btn-label {
                        display: block;
                        min-width: 0;
                        overflow: hidden;
                        text-overflow: ellipsis;
                        white-space: nowrap;
                    }
                    nav.navbar.bootsnav #navbar-menu .header-employer-dropdown {
                        display: flex;
                        align-items: center;
                        min-width: 0;
                    }
                    nav.navbar.bootsnav #navbar-menu .header-employer-trigger {
                        padding: 24px 15px;
                        height: auto;
                    }
                    /* Google Translate wraps labels in <font>; keep them on one line */
                    nav.navbar.bootsnav #navbar-menu font {
                        white-space: nowrap !important;
                    }
                }

                /* Mobile nav: make collapse work without bootstrap JS */
                @media (max-width: 991px) {
                    nav.navbar.bootsnav{
                        background:#fff !important;
                        box-shadow: 0 2px 10px rgba(15,23,42,0.06) !important;
                    }
                    .navbar .navbar-header{
                        display: grid !important;
                        grid-template-columns: 1fr auto 1fr;
                        align-items: center;
                        width: 100%;
                        min-height: 70px;
                        position: relative;
                        padding: 0 12px !important;
                        box-sizing: border-box;
                        text-align: initial;
                    }
                    /* true viewport center: menu left, logo middle, equal spacer right */
                    nav.navbar.bootsnav .navbar-brand{
                        grid-column: 2;
                        grid-row: 1;
                        justify-self: center;
                        align-self: center;
                        height: auto !important;
                        min-height: 0 !important;
                        padding: 0 8px !important;
                        margin: 0 !important;
                        display: flex !important;
                        align-items: center;
                        justify-content: center;
                        max-width: min(220px, 72vw);
                        line-height: 0 !important;
                        font-size: 0 !important;
                        position: static !important;
                        left: auto !important;
                        top: auto !important;
                        transform: translate(14px, 7px) !important;
                        float: none !important;
                    }
                    .navbar .navbar-brand img{
                        max-height: 36px;
                        width: auto;
                        display: block;
                        object-fit: contain;
                        margin: 0 !important;
                    }
                    /* prevent both logos showing/overlapping on mobile */
                    .navbar-brand .logo-scrolled{ display:none !important; }
                    .navbar-brand .logo-display{ display:block !important; }
                    .navbar-toggle{
                        grid-column: 1;
                        grid-row: 1;
                        justify-self: start;
                        align-self: center;
                        border: 1px solid rgba(15,23,42,0.18);
                        border-radius: 10px;
                        padding: 8px 10px;
                        background: #fff;
                        margin: 0 !important;
                        float: none !important;
                    }
                    .navbar-toggle i{
                        font-size: 18px;
                        color:#0f172a;
                    }

                    .navbar-close-btn {
                        display: block !important;
                    }

                    #navbar-menu.collapse{
                        position: fixed;
                        inset: 0 auto auto 0;
                        top: 0;
                        left: 0;
                        height: 100vh;
                        width: 280px;
                        max-width: 85%;
                        transform: translateX(-100%);
                        transition: transform 240ms ease, opacity 240ms ease;
                        opacity: 0;
                        display: flex !important;
                        flex-direction: column;
                        background:#ffffff;
                        border-right: 1px solid rgba(148,163,184,0.18);
                        box-shadow: 0 18px 44px rgba(15,23,42,0.18);
                        padding: 12px 12px 18px;
                        z-index: 110;
                        box-sizing: border-box !important;
                        overflow-x: hidden !important;
                        min-width: 0 !important;
                    }
                    /* bootsnav sets ul.nav to 293px — wider than the 280px drawer */
                    nav.navbar.bootsnav.navbar-mobile #navbar-menu ul.nav,
                    nav.navbar.bootsnav.navbar-mobile #navbar-menu .navbar-nav {
                        width: 100% !important;
                        max-width: 100% !important;
                        padding-left: 0 !important;
                        padding-right: 0 !important;
                        margin-left: 0 !important;
                        margin-right: 0 !important;
                        box-sizing: border-box !important;
                    }
                    #navbar-menu.collapse.is-open{
                        transform: translateX(0);
                        opacity: 1;
                    }
                    .mobile-nav-backdrop {
                        position: fixed;
                        inset: 0;
                        background: rgba(15, 23, 42, 0.36);
                        opacity: 0;
                        visibility: hidden;
                        transition: opacity 240ms ease, visibility 240ms ease;
                        z-index: 100;
                    }
                    .mobile-nav-backdrop.visible {
                        opacity: 1;
                        visibility: visible;
                    }
                    .navbar-close-btn {
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        width: 30px;
                        height: 30px;
                        border: none;
                        background: #e5e7eb;
                        border-radius: 50%;
                        color: #4b5563;
                        font-size: 14px;
                        line-height: 1;
                        padding: 0;
                        margin: 0;
                        position: absolute;
                        top: 6px;
                        right: 8px;
                        cursor: pointer;
                        transition: background 150ms ease, color 150ms ease, transform 150ms ease;
                        z-index: 12;
                    }
                    .navbar-close-btn i {
                        font-size: 12px;
                        line-height: 1;
                    }
                    .navbar-close-btn:hover {
                        background: #d1d5db;
                        color: #111827;
                        transform: scale(1.03);
                    }
                    #navbar-menu .navbar-left,
                    #navbar-menu .navbar-right{
                        float:none !important;
                        display:flex;
                        flex-direction:column;
                        gap: 6px;
                        margin: 0 !important;
                        padding: 0 !important;
                        width: 100% !important;
                        max-width: 100% !important;
                        min-width: 0 !important;
                        box-sizing: border-box !important;
                    }
                    #navbar-menu .navbar-right{
                        order: -1;
                        margin-top: 48px !important;
                        padding-top: 0 !important;
                        border-top: none;
                        margin-bottom: 10px !important;
                        padding-bottom: 10px !important;
                        padding-right: 0 !important;
                        padding-left: 0 !important;
                        border-bottom: 1px solid rgba(148,163,184,0.18);
                    }
                    #navbar-menu .nav > li{
                        width: 100% !important;
                        max-width: 100% !important;
                        box-sizing: border-box !important;
                        min-width: 0 !important;
                    }
                    #navbar-menu .nav > li > a{
                        display:flex;
                        align-items:center;
                        justify-content:flex-start;
                        width: 100% !important;
                        max-width: 100% !important;
                        box-sizing: border-box !important;
                        min-width: 0 !important;
                        padding: 10px 10px;
                        border-radius: 10px;
                        color: #16a34a !important;
                    }
                    nav.navbar.bootsnav #navbar-menu ul.nav > li > a.btn-signup.red-btn {
                        width: 100% !important;
                        max-width: 100% !important;
                        margin-left: 0 !important;
                        margin-right: 0 !important;
                    }
                    #navbar-menu .nav > li > a:hover,
                    #navbar-menu .nav > li > a:focus{
                        background: #f0fdf4 !important;
                        color: #15803d !important;
                    }
                    #navbar-menu .btn-signup {
                        display: inline-flex !important;
                        width: 100% !important;
                        max-width: 100% !important;
                        align-items: center !important;
                        justify-content: center !important;
                        gap: 10px !important;
                        padding: 12px 18px !important;
                        box-sizing: border-box !important;
                        white-space: nowrap !important;
                        text-align: center !important;
                        border-radius: 14px !important;
                        font-weight: 600 !important;
                        margin: 0 !important;
                        background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%) !important;
                        color: #fff !important;
                        border: none !important;
                    }
                    #navbar-menu .navbar-right .br-right,
                    #navbar-menu .navbar-right .sign-up {
                        width: 100% !important;
                        padding: 0 !important;
                        margin: 0 !important;
                    }
                    #navbar-menu .navbar-right .btn-signup .img-responsive,
                    #navbar-menu .navbar-right .btn-signup img {
                        width: 22px !important;
                        height: 22px !important;
                        object-fit: cover !important;
                    }
                    #navbar-menu .navbar-right .btn-signup span {
                        flex: 1 1 auto !important;
                        min-width: 0 !important;
                        text-align: center !important;
                        display: inline-block !important;
                        overflow: hidden !important;
                        text-overflow: ellipsis !important;
                        white-space: nowrap !important;
                    }
                    #navbar-menu .navbar-right .btn-signup {
                        display: inline-flex !important;
                        width: 100% !important;
                        min-height: 44px !important;
                    }
                    #navbar-menu .navbar-right .btn-signup i,
                    #navbar-menu .navbar-right .btn-signup span {
                        display: inline-flex !important;
                        align-items: center !important;
                    }
                    #navbar-menu .navbar-right .sign-up > a.btn-signup,
                    #navbar-menu .navbar-right .sign-up > a.btn-signup span,
                    #navbar-menu .navbar-right .sign-up > a.btn-signup i {
                        color: #fff !important;
                    }
                    /* Keep login/register icon-text close on mobile */
                    #navbar-menu .navbar-right .br-right .btn-signup,
                    #navbar-menu .navbar-right > .sign-up:not(.dropdown) .btn-signup {
                        gap: 6px !important;
                        justify-content: center !important;
                    }
                    #navbar-menu .navbar-right .br-right > a.btn-signup,
                    #navbar-menu .navbar-right > .sign-up:not(.dropdown) > a.btn-signup,
                    #navbar-menu .navbar-right .br-right > a.btn-signup:hover,
                    #navbar-menu .navbar-right > .sign-up:not(.dropdown) > a.btn-signup:hover,
                    #navbar-menu .navbar-right .br-right > a.btn-signup:focus,
                    #navbar-menu .navbar-right > .sign-up:not(.dropdown) > a.btn-signup:focus {
                        color: #fff !important;
                    }
                    #navbar-menu .navbar-right .br-right .btn-signup span,
                    #navbar-menu .navbar-right > .sign-up:not(.dropdown) .btn-signup span {
                        flex: 0 0 auto !important;
                        text-align: left !important;
                    }
                    #navbar-menu .navbar-right .br-right .btn-signup i,
                    #navbar-menu .navbar-right > .sign-up:not(.dropdown) .btn-signup i,
                    #navbar-menu .navbar-right > .sign-up:not(.dropdown) .btn-signup span {
                        color: #fff !important;
                    }
                    .mobile-candidate-only {
                        display: block !important;
                    }
                    .mobile-employer-only {
                        display: block !important;
                    }
                    #navbar-menu .header-employer-dropdown {
                        width: 100% !important;
                        max-width: 100% !important;
                        margin-top: 0 !important;
                    }
                    #navbar-menu .header-employer-trigger {
                        width: 100% !important;
                        max-width: 100% !important;
                        justify-content: center !important;
                        padding: 10px 10px !important;
                        border-radius: 10px !important;
                    }
                    #navbar-menu .header-employer-menu {
                        position: static !important;
                        left: auto !important;
                        transform: none !important;
                        width: 100% !important;
                        max-width: 100% !important;
                        margin-top: 4px !important;
                        box-shadow: none !important;
                        border: 1px solid rgba(148, 163, 184, 0.2) !important;
                        background: #f8fafc !important;
                    }
                    #navbar-menu .header-employer-trigger:hover,
                    #navbar-menu .header-employer-trigger:focus {
                        background: #f0fdf4 !important;
                    }
                    #navbar-menu .header-employer-label,
                    #navbar-menu .header-employer-chevron {
                        color: #16a34a !important;
                        -webkit-text-fill-color: #16a34a !important;
                    }
                    #navbar-menu .header-employer-menu button {
                        color: #16a34a !important;
                    }
                    /* Mobile: language selector stacks as full-width row */
                    .uptula-lang-li {
                        width: 100% !important;
                        margin: 0 !important;
                        justify-content: center !important;
                    }
                }

                /* ===================== Navbar background (#0b4621) ===================== */
                nav.navbar.bootsnav,
                nav.navbar.bootsnav.no-background,
                nav.navbar.bootsnav.no-background.white,
                nav.navbar.bootsnav.navbar-fixed {
                    background-color: #0b4621 !important;
                }
                /* desktop nav links readable on the dark-green bar */
                nav.navbar.bootsnav ul.nav > li > a {
                    color: #ffffff !important;
                }
                nav.navbar.bootsnav ul.nav > li > a:hover,
                nav.navbar.bootsnav ul.nav > li.active > a {
                    color: #86efac !important;
                }
                nav.navbar.bootsnav .navbar-toggle i,
                nav.navbar.bootsnav .navbar-toggle .fa {
                    color: #ffffff !important;
                }

                /* ===================== Jobs mega-menu ===================== */
                /* The Jobs link is a normal nav link (.jobs-mega-link is a
                   .dropdown-toggle), so it inherits the theme's nav-link color,
                   weight and hover/scrolled states exactly like Home/Services.
                   The theme also renders the down-caret via its dropdown-toggle:after. */
                .jobs-mega-caret-mobile {
                    background: none;
                    border: none;
                    cursor: pointer;
                    color: inherit;
                    display: none;
                    align-items: center;
                    font-size: 12px;
                    transition: transform 0.2s ease;
                }
                .jobs-mega-msg { padding: 14px 16px; color: #64748b; font-size: 13px; }
                /* category/subcategory icons */
                .jmega-cat-label { display: inline-flex; align-items: center; gap: 9px; min-width: 0; }
                .jmega-ico { color: #16a34a; font-size: 14px; width: 16px; text-align: center; flex-shrink: 0; }
                .jmega-sub-ico { color: #94a3b8; font-size: 13px; width: 15px; text-align: center; flex-shrink: 0; }
                .jobs-mega-sub { display: flex !important; align-items: center; gap: 8px; }
                .jobs-mega-sub:hover .jmega-sub-ico { color: #16a34a; }
                .jobs-acc-sub { display: flex !important; align-items: center; gap: 8px; }

                /* Desktop two-pane panel */
                @media (min-width: 992px) {
                    .jobs-mega-dropdown { position: relative; }
                    .jobs-mega-panel {
                        display: none;
                        position: absolute;
                        top: 100%;
                        left: 0;
                        z-index: 1200;
                        width: 620px;
                        max-width: 80vw;
                        background: #fff;
                        border: 1px solid rgba(148, 163, 184, 0.2);
                        border-radius: 14px;
                        box-shadow: 0 18px 44px rgba(15, 23, 42, 0.16);
                        overflow: hidden;
                        grid-template-columns: 240px 1fr;
                    }
                    .jobs-mega-dropdown:hover .jobs-mega-panel,
                    .jobs-mega-dropdown.is-open .jobs-mega-panel { display: grid; }
                    .jobs-mega-cats {
                        background: #f8fafc;
                        border-right: 1px solid rgba(148, 163, 184, 0.18);
                        padding: 8px;
                        max-height: 360px;
                        overflow-y: auto;
                    }
                    .jobs-mega-cat {
                        width: 100%;
                        display: flex;
                        align-items: center;
                        justify-content: space-between;
                        gap: 8px;
                        background: none;
                        border: none;
                        text-align: left;
                        padding: 10px 12px;
                        border-radius: 9px;
                        font-size: 13.5px;
                        font-weight: 600;
                        color: #334155;
                        cursor: pointer;
                        transition: background 0.15s ease, color 0.15s ease;
                    }
                    .jobs-mega-cat i { font-size: 11px; color: #94a3b8; }
                    .jobs-mega-cat:hover,
                    .jobs-mega-cat.active { background: rgba(22, 163, 74, 0.1); color: #16a34a; }
                    .jobs-mega-cat.active i { color: #16a34a; }
                    .jobs-mega-subs-pane { padding: 16px 18px; max-height: 360px; overflow-y: auto; }
                    .jobs-mega-subs-head {
                        display: flex;
                        align-items: center;
                        justify-content: space-between;
                        gap: 10px;
                        margin-bottom: 12px;
                        padding-bottom: 10px;
                        border-bottom: 1px solid rgba(148, 163, 184, 0.18);
                        font-size: 15px;
                        font-weight: 800;
                        color: #0f172a;
                    }
                    .jobs-mega-viewall {
                        background: none;
                        border: none;
                        color: #16a34a;
                        font-size: 12.5px;
                        font-weight: 700;
                        cursor: pointer;
                        white-space: nowrap;
                    }
                    .jobs-mega-subs-grid {
                        display: grid;
                        grid-template-columns: 1fr 1fr;
                        gap: 4px 14px;
                    }
                    .jobs-mega-sub {
                        background: none;
                        border: none;
                        text-align: left;
                        padding: 8px 8px;
                        border-radius: 8px;
                        font-size: 13px;
                        color: #475569;
                        cursor: pointer;
                        transition: background 0.15s ease, color 0.15s ease;
                    }
                    .jobs-mega-sub:hover { background: #f1f5f9; color: #16a34a; }
                }

                /* Mobile accordion */
                @media (max-width: 991px) {
                    .jobs-mega-dropdown { position: relative; }
                    /* hide the theme's desktop caret on mobile; use our own toggle button */
                    .jobs-mega-dropdown > a.dropdown-toggle:after { display: none !important; }
                    .jobs-mega-caret-mobile {
                        display: inline-flex;
                        position: absolute;
                        top: 4px;
                        right: 6px;
                        z-index: 2;
                        color: #16a34a;
                        padding: 10px 12px;
                    }
                    .jobs-mega-dropdown.is-open .jobs-mega-caret-mobile i { transform: rotate(180deg); }
                    .jobs-mega-accordion {
                        width: 100%;
                        background: #f8fafc;
                        border-radius: 10px;
                        border: 1px solid rgba(148, 163, 184, 0.2);
                        margin: 6px 0 4px;
                        overflow: hidden;
                    }
                    .jobs-acc-item { border-bottom: 1px solid rgba(148, 163, 184, 0.16); }
                    .jobs-acc-item:last-child { border-bottom: none; }
                    .jobs-acc-cat {
                        width: 100%;
                        display: flex;
                        align-items: center;
                        justify-content: space-between;
                        gap: 8px;
                        background: none;
                        border: none;
                        text-align: left;
                        padding: 12px 14px;
                        font-size: 14px;
                        font-weight: 700;
                        color: #16a34a;
                        cursor: pointer;
                    }
                    .jobs-acc-cat i { font-size: 12px; transition: transform 0.2s ease; }
                    .jobs-acc-cat.open i { transform: rotate(180deg); }
                    .jobs-acc-subs { display: flex; flex-direction: column; padding: 0 8px 10px; }
                    .jobs-acc-sub {
                        background: none;
                        border: none;
                        text-align: left;
                        padding: 9px 16px;
                        font-size: 13px;
                        color: #475569;
                        cursor: pointer;
                        border-radius: 8px;
                    }
                    .jobs-acc-sub:hover, .jobs-acc-sub:active { background: #eef2f7; }
                    .jobs-acc-sub.all { color: #16a34a; font-weight: 700; }
                }
            `}</style>
            {/* ======================= Start Navigation ===================== */}
            <nav className="navbar navbar-default navbar-mobile navbar-fixed white no-background bootsnav">
                <div className="container">
                    <div className="navbar-header">
                        <button
                            type="button"
                            className="navbar-toggle"
                            aria-controls="navbar-menu"
                            aria-expanded={mobileNavOpen ? "true" : "false"}
                            onClick={() => setMobileNavOpen((v) => !v)}
                        >
                            {" "}
                            <i className="fa fa-bars" />{" "}
                        </button>
                        <Link className="navbar-brand" to="/">
                            {" "}
                            <img
                                src="/assets/img/Uptula.png"
                                className="logo logo-display"
                                alt="Uptula Logo"
                            />{" "}
                            <img
                                src="/assets/img/Uptula.png"
                                className="logo logo-scrolled"
                                alt="Uptula Logo"
                            />{" "}
                        </Link>
                    </div>
                    <div className={`mobile-nav-backdrop ${mobileNavOpen ? 'visible' : ''}`} onClick={() => setMobileNavOpen(false)} />
                    <div className={`collapse navbar-collapse ${mobileNavOpen ? "is-open" : ""}`} id="navbar-menu">
                        <button type="button" className="navbar-close-btn" onClick={() => setMobileNavOpen(false)} aria-label="Close menu">
                            <i className="ti-close" />
                        </button>
                        <ul
                            className="nav navbar-nav navbar-left"
                            data-in="fadeInDown"
                            data-out="fadeOutUp"
                        >
                            <li className="dropdown active">
                                {" "}
                                <Link to="/" onClick={() => setMobileNavOpen(false)}>Home</Link>{" "}
                            </li>

                            <li
                                className={`dropdown jobs-mega-dropdown${jobsMenuOpen ? " is-open" : ""}`}
                                onMouseEnter={openJobsMenuDesktop}
                                onMouseLeave={() => { if (isDesktopNav) setJobsMenuOpen(false); }}
                            >
                                <Link
                                    to="/jobs"
                                    className="dropdown-toggle jobs-mega-link"
                                    onClick={() => { setJobsMenuOpen(false); setMobileNavOpen(false); }}
                                >
                                    Jobs
                                </Link>
                                <button
                                    type="button"
                                    className="jobs-mega-caret-mobile"
                                    aria-label="Toggle job categories"
                                    aria-expanded={jobsMenuOpen}
                                    onClick={(e) => {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        const next = !jobsMenuOpen;
                                        setJobsMenuOpen(next);
                                        if (next && jobCategories.length && !activeCatId) {
                                            setActiveCatId(jobCategories[0].id);
                                            loadSubcategories(jobCategories[0].id);
                                        }
                                    }}
                                >
                                    <i className="ti-angle-down" aria-hidden="true" />
                                </button>

                                {isDesktopNav ? (
                                    <div className="jobs-mega-panel" role="menu">
                                        <div className="jobs-mega-cats">
                                            {jobCategoriesLoading ? (
                                                <div className="jobs-mega-msg">Loading categories…</div>
                                            ) : jobCategories.length === 0 ? (
                                                <div className="jobs-mega-msg">No categories available.</div>
                                            ) : (
                                                jobCategories.map((cat) => (
                                                    <button
                                                        key={cat.id}
                                                        type="button"
                                                        className={`jobs-mega-cat${activeCatId === cat.id ? " active" : ""}`}
                                                        onMouseEnter={() => { setActiveCatId(cat.id); loadSubcategories(cat.id); }}
                                                        onClick={() => goToJobsCategory(cat)}
                                                    >
                                                        <span className="jmega-cat-label">
                                                            <i className={`${getCategoryIcon(cat.name)} jmega-ico`} aria-hidden="true" />
                                                            {cat.name}
                                                        </span>
                                                        <i className="ti-angle-right" aria-hidden="true" />
                                                    </button>
                                                ))
                                            )}
                                        </div>
                                        <div className="jobs-mega-subs-pane">
                                            {(() => {
                                                const cat =
                                                    jobCategories.find((c) => c.id === activeCatId) || jobCategories[0];
                                                if (!cat) return null;
                                                const subs = subsCache[cat.id];
                                                return (
                                                    <>
                                                        <div className="jobs-mega-subs-head">
                                                            <span>{cat.name}</span>
                                                            <button
                                                                type="button"
                                                                className="jobs-mega-viewall"
                                                                onClick={() => goToJobsCategory(cat)}
                                                            >
                                                                View all jobs
                                                            </button>
                                                        </div>
                                                        {subs === null || subs === undefined ? (
                                                            <div className="jobs-mega-msg">Loading…</div>
                                                        ) : subs.length === 0 ? (
                                                            <button
                                                                type="button"
                                                                className="jobs-mega-sub"
                                                                onClick={() => goToJobsCategory(cat)}
                                                            >
                                                                View all {cat.name} jobs
                                                            </button>
                                                        ) : (
                                                            <div className="jobs-mega-subs-grid">
                                                                {subs.map((sub) => (
                                                                    <button
                                                                        key={sub.id}
                                                                        type="button"
                                                                        className="jobs-mega-sub"
                                                                        onClick={() => goToJobsCategory(cat, sub)}
                                                                    >
                                                                        <i className={`${getCategoryIcon(sub.name || cat.name)} jmega-sub-ico`} aria-hidden="true" />
                                                                        {sub.name}
                                                                    </button>
                                                                ))}
                                                            </div>
                                                        )}
                                                    </>
                                                );
                                            })()}
                                        </div>
                                    </div>
                                ) : (
                                    jobsMenuOpen && (
                                        <div className="jobs-mega-accordion">
                                            {jobCategoriesLoading ? (
                                                <div className="jobs-mega-msg">Loading categories…</div>
                                            ) : jobCategories.length === 0 ? (
                                                <div className="jobs-mega-msg">No categories available.</div>
                                            ) : (
                                                jobCategories.map((cat) => (
                                                    <div className="jobs-acc-item" key={cat.id}>
                                                        <button
                                                            type="button"
                                                            className={`jobs-acc-cat${mobileCatId === cat.id ? " open" : ""}`}
                                                            onClick={() => toggleMobileCat(cat.id)}
                                                        >
                                                            <span className="jmega-cat-label">
                                                                <i className={`${getCategoryIcon(cat.name)} jmega-ico`} aria-hidden="true" />
                                                                {cat.name}
                                                            </span>
                                                            <i className="ti-angle-down" aria-hidden="true" />
                                                        </button>
                                                        {mobileCatId === cat.id && (
                                                            <div className="jobs-acc-subs">
                                                                <button
                                                                    type="button"
                                                                    className="jobs-acc-sub all"
                                                                    onClick={() => goToJobsCategory(cat)}
                                                                >
                                                                    All {cat.name} jobs
                                                                </button>
                                                                {(subsCache[cat.id] || []).map((sub) => (
                                                                    <button
                                                                        key={sub.id}
                                                                        type="button"
                                                                        className="jobs-acc-sub"
                                                                        onClick={() => goToJobsCategory(cat, sub)}
                                                                    >
                                                                        <i className={`${getCategoryIcon(sub.name || cat.name)} jmega-sub-ico`} aria-hidden="true" />
                                                                        {sub.name}
                                                                    </button>
                                                                ))}
                                                            </div>
                                                        )}
                                                    </div>
                                                ))
                                            )}
                                        </div>
                                    )
                                )}
                            </li>

                            <li className="active">
                                {" "}
                                <Link to="/Companies" onClick={() => setMobileNavOpen(false)}>Companies</Link>{" "}
                            </li>

                            <li className="dropdown">
                                {" "}
                                <Link to="/Services" onClick={() => setMobileNavOpen(false)}>Services</Link>{" "}
                            </li>
                            {!loading && !user && (
                                <li className={`header-employer-dropdown dropdown${employerMenuOpen ? ' is-open' : ''}`}>
                                    <button
                                        type="button"
                                        className="header-employer-trigger"
                                        aria-expanded={employerMenuOpen}
                                        aria-haspopup="true"
                                        onClick={(e) => {
                                            e.preventDefault();
                                            e.stopPropagation();
                                            setEmployerMenuOpen((v) => !v);
                                        }}
                                    >
                                        <span className="header-employer-label" title="For employer">For employer</span>
                                        <i className="ti-angle-down header-employer-chevron" aria-hidden="true" />
                                    </button>
                                    {employerMenuOpen && (
                                        <ul className="header-employer-menu" role="menu">
                                            <li role="none">
                                                <button type="button" role="menuitem" onClick={openEmployerSigninModal}>
                                                    Login
                                                </button>
                                            </li>
                                            <li role="none">
                                                <button type="button" role="menuitem" onClick={openEmployerRegisterModal}>
                                                    Register
                                                </button>
                                            </li>
                                        </ul>
                                    )}
                                </li>
                            )}
                            {user && user.role !== 'provider' && user.role !== 'employer' && user.role !== 'admin' && (
                                <>
                                    <li className="mobile-candidate-only">
                                        <Link to="/profile" onClick={() => setMobileNavOpen(false)}>Edit Profile</Link>
                                    </li>
                                    <li className="mobile-candidate-only">
                                        <Link to="/candidate/applied-jobs" onClick={() => setMobileNavOpen(false)}>Applied Jobs</Link>
                                    </li>
                                    <li className="mobile-candidate-only">
                                        <Link to="/candidate/create-resume" onClick={() => setMobileNavOpen(false)}>Create Resume</Link>
                                    </li>
                                    <li className="mobile-candidate-only">
                                        <Link to="/candidate/change-password" onClick={() => setMobileNavOpen(false)}>Change Password</Link>
                                    </li>
                                    <li className="mobile-candidate-only">
                                        <Link to="/candidate/chat" onClick={() => setMobileNavOpen(false)}>Chat Inbox</Link>
                                    </li>
                                    <li className="mobile-candidate-only">
                                        <Link to="/candidate/wishlist" onClick={() => setMobileNavOpen(false)}>My Wishlist</Link>
                                    </li>
                                    <li className="mobile-candidate-only">
                                        <a
                                            href="#"
                                            onClick={(e) => {
                                                e.preventDefault();
                                                setMobileNavOpen(false);
                                                handleLogout(e);
                                            }}
                                        >
                                            Logout
                                        </a>
                                    </li>
                                </>
                            )}
                            {user && (user.role === 'provider' || user.role === 'employer' || user.role === 'admin') && (
                                <>
                                    <li className="mobile-employer-only">
                                        <Link to="/employer/profile" onClick={() => setMobileNavOpen(false)}>Add Company Details</Link>
                                    </li>
                                    <li className="mobile-employer-only">
                                        <Link to="/employer/add-jobs" onClick={() => setMobileNavOpen(false)}>Add Jobs</Link>
                                    </li>
                                    <li className="mobile-employer-only">
                                        <Link to="/employer/manage-jobs" onClick={() => setMobileNavOpen(false)}>Manage Jobs</Link>
                                    </li>
                                    <li className="mobile-employer-only">
                                        <Link to="/employer/analytics" onClick={() => setMobileNavOpen(false)}>Analytics Reports</Link>
                                    </li>
                                    <li className="mobile-employer-only">
                                        <Link to="/employer/view-candidates" onClick={() => setMobileNavOpen(false)}>View Candidates</Link>
                                    </li>
                                    <li className="mobile-employer-only">
                                        <Link to="/employer/chat" onClick={() => setMobileNavOpen(false)}>Chat Center</Link>
                                    </li>
                                    <li className="mobile-employer-only">
                                        <Link to="/employer/boolean-search" onClick={() => setMobileNavOpen(false)}>Boolean Search</Link>
                                    </li>
                                    <li className="mobile-employer-only">
                                        <Link to="/employer/resume-scoring" onClick={() => setMobileNavOpen(false)}>Resume Scoring</Link>
                                    </li>
                                    <li className="mobile-employer-only">
                                        <Link to="/employer/referral" onClick={() => setMobileNavOpen(false)}>Referral</Link>
                                    </li>
                                    <li className="mobile-employer-only">
                                        <Link to="/employer/premium" onClick={() => setMobileNavOpen(false)}>Premium Manager</Link>
                                    </li>
                                    <li className="mobile-employer-only">
                                        <Link to="/employer/support" onClick={() => setMobileNavOpen(false)}>Support & Tickets</Link>
                                    </li>
                                    <li className="mobile-employer-only">
                                        <Link to="/employer/change-password" onClick={() => setMobileNavOpen(false)}>Change Password</Link>
                                    </li>
                                    <li className="mobile-employer-only">
                                        <a
                                            href="#"
                                            onClick={(e) => {
                                                e.preventDefault();
                                                setMobileNavOpen(false);
                                                handleLogout(e);
                                            }}
                                        >
                                            Logout
                                        </a>
                                    </li>
                                </>
                            )}
                        </ul>
                            <ul
                                className="nav navbar-nav navbar-right"
                                style={{ display: 'flex', alignItems: 'center' }}
                            >
                                {loading ? (
                                    <li className="br-right" style={{ display: 'flex', alignItems: 'center' }}>
                                        <span className="btn-signup red-btn" style={{opacity: 0.7}}>
                                            <i className="login-icon ti-user" />
                                            <span className="header-btn-label">Loading...</span>
                                        </span>
                                    </li>
                                ) : user ? (
                                    <li
                                        className="dropdown sign-up"
                                        style={{ display: 'flex', alignItems: 'center' }}
                                        onMouseEnter={() => setMenuOpen(true)}
                                        onMouseLeave={() => setMenuOpen(false)}
                                    >
                                        <Link
                                            to={(user.role === 'provider' || user.role === 'employer' || user.role === 'admin') ? "/employer/profile" : "/profile"}
                                            className="btn-signup red-btn"
                                            onClick={() => setMobileNavOpen(false)}
                                            style={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '8px',
                                                textDecoration: 'none'
                                            }}
                                        >
                                            <img
                                                src={avatarSrc}
                                                className="img-responsive img-circle"
                                                alt={user.fullName || 'User'}
                                                style={{
                                                    width: '30px',
                                                    height: '30px',
                                                    objectFit: 'cover',
                                                    borderRadius: '50%',
                                                    backgroundColor: '#ffffff',
                                                    border: '2px solid rgba(255,255,255,0.3)',
                                                    display: 'block',
                                                    flexShrink: 0
                                                }}
                                                onError={(e) => {
                                                    if (e.target.src !== "/assets/img/user-profile.png") {
                                                        setImageError(true);
                                                        e.target.src = "/assets/img/user-profile.png";
                                                    }
                                                }}
                                                onLoad={() => {
                                                    setImageError(false);
                                                }}
                                            />
                                            <span className="header-btn-label" title={user.fullName}>{user.fullName}</span>
                                        </Link>
                                        {menuOpen && (
                                            <ul className="dropdown-menu" style={{display: 'block'}}>
                                                {(user.role === 'provider' || user.role === 'employer' || user.role === 'admin') ? (
                                                    <>
                                                        <li>
                                                            <Link to="/employer/profile" onClick={() => { setMenuOpen(false); setMobileNavOpen(false); }}>Dashboard</Link>
                                                        </li>
                                                    </>
                                                ) : (
                                                    <>
                                                        <li>
                                                            <Link to="/Companies" onClick={() => { setMenuOpen(false); setMobileNavOpen(false); }}>Browse Jobs</Link>
                                                        </li>
                                                        <li>
                                                            <Link to="/profile" onClick={() => { setMenuOpen(false); setMobileNavOpen(false); }}>My Profile</Link>
                                                        </li>
                                                        <li>
                                                            <Link to="/candidate/create-resume" onClick={() => { setMenuOpen(false); setMobileNavOpen(false); }}>Create Resume</Link>
                                                        </li>
                                                        <li>
                                                            <Link to="/candidate/wishlist" onClick={() => { setMenuOpen(false); setMobileNavOpen(false); }}>My Wishlist</Link>
                                                        </li>
                                                        <li>
                                                            <Link to="/candidate/applied-jobs" onClick={() => { setMenuOpen(false); setMobileNavOpen(false); }}>Applied Jobs</Link>
                                                        </li>
                                                    </>
                                                )}
                                                <li>
                                                    <a href="#" onClick={(e) => { e.preventDefault(); setMenuOpen(false); handleLogout(e); }}>Sign Out</a>
                                                </li>
                                            </ul>
                                        )}
                                    </li>
                                ) : (
                                    <>
                                        <li className="br-right" style={{ display: 'flex', alignItems: 'center' }}>
                                            <a href="#"
                                                className="btn-signup red-btn"
                                                data-toggle="modal"
                                                data-target="#signin"
                                                onClick={(e) => {
                                                    e.preventDefault();
                                                    setMobileNavOpen(false);
                                                    window.dispatchEvent(new Event('uptula:open-default-signin'));
                                                }}
                                            >
                                                <i className="login-icon ti-user" />
                                                <span className="header-btn-label">Login</span>
                                            </a>
                                        </li>
                                        <li className="sign-up" style={{ display: 'flex', alignItems: 'center' }}>
                                            <a
                                                href="#"
                                                className="btn-signup red-btn"
                                                data-toggle="modal"
                                                data-target="#register"
                                                onClick={(e) => {
                                                    e.preventDefault();
                                                    setMobileNavOpen(false);
                                                    window.dispatchEvent(new Event('uptula:open-default-register'));
                                                }}
                                            >
                                                <span className="ti-briefcase" />
                                                <span className="header-btn-label">Register</span>
                                            </a>
                                        </li>
                                    </>
                                )}
                                {/* Language selector — vertically centred with the profile/login buttons */}
                                <li
                                    className="uptula-lang-li"
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        padding: '0',
                                        margin: '0 0 0 10px',
                                        lineHeight: '1',
                                        height: 'auto',
                                        position: 'relative',
                                        top: '3px',
                                    }}
                                >
                                    <LanguageSelector />
                                </li>
                            </ul>
                        </div>
                    </div>
                </nav>
                {/* ======================= End Navigation ===================== */}
            </>

    );
}

export default Header;