import React, { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import "./Footer.css";
import LoginForm from "./auth/LoginForm";
import "./auth/authForms.css";

function Footer() {
  const [signinPanel, setSigninPanel] = useState("jobseeker");
  const skipNextSigninResetRef = React.useRef(false);

  const resetSigninModalView = useCallback(() => {
    setSigninPanel("jobseeker");
  }, []);

  const openEmployerSigninView = useCallback(() => {
    skipNextSigninResetRef.current = true;
    setSigninPanel("employer");
  }, []);

  useEffect(() => {
    const signinEl = document.getElementById("signin");
    const handleSigninShown = () => {
      if (skipNextSigninResetRef.current) {
        skipNextSigninResetRef.current = false;
        return;
      }
      resetSigninModalView();
    };
    const handleDefaultSigninOpen = () => {
      skipNextSigninResetRef.current = false;
      resetSigninModalView();
    };

    if (signinEl) {
      signinEl.addEventListener("show.bs.modal", handleSigninShown);
    }
    window.addEventListener("uptula:open-default-signin", handleDefaultSigninOpen);
    window.addEventListener("uptula:open-employer-signin", openEmployerSigninView);

    return () => {
      if (signinEl) {
        signinEl.removeEventListener("show.bs.modal", handleSigninShown);
      }
      window.removeEventListener("uptula:open-default-signin", handleDefaultSigninOpen);
      window.removeEventListener("uptula:open-employer-signin", openEmployerSigninView);
    };
  }, [resetSigninModalView, openEmployerSigninView]);

  const handleScrollToTop = (e) => {
    if (e) e.preventDefault();
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <>
      <footer
        className="nk-footer"
        style={{
          backgroundImage: `url('/assets/img/city_bg.png')`,
          backgroundPosition: "bottom center",
          backgroundRepeat: "no-repeat",
          backgroundSize: "cover",
          backgroundAttachment: "scroll",
          marginTop: 0,
        }}
      >
        <div className="nk-container">
          <div className="nk-row">
            <div className="nk-col-left">
              <Link to="/" className="nk-logo-link">
                <img src="/assets/img/Uptula.png" alt="Uptula Logo" className="nk-logo" />
              </Link>
              <h4>Connect with us</h4>
              <div className="nk-social">
                <a href="https://www.facebook.com/profile.php?id=61586820991880" target="_blank" rel="noopener noreferrer" aria-label="facebook">
                  <i className="fa fa-facebook" />
                </a>
                <a href="https://www.instagram.com/uptulajobportal" target="_blank" rel="noopener noreferrer" aria-label="instagram">
                  <i className="fa fa-instagram" />
                </a>
                <a href="https://www.linkedin.com/company/uptula-job-portal" target="_blank" rel="noopener noreferrer" aria-label="linkedin">
                  <i className="fa fa-linkedin" />
                </a>
              </div>
            </div>

            <div className="nk-col-links">
              <div className="nk-link-block">
                <h5>Company</h5>
                <ul>
                  <li>
                    <Link to="/about-us">About us</Link>
                  </li>
                  <li>
                    <Link to="/careers">Careers</Link>
                  </li>
                  <li>
                    <Link to="/contact-us">Contact us</Link>
                  </li>
                  <li>
                    <Link to="/services">Services</Link>
                  </li>
                </ul>
              </div>
              <div className="nk-link-block">
                <h5>Job Seekers</h5>
                <ul>
                  <li>
                    <Link to="/jobs">Browse Jobs</Link>
                  </li>
                  <li>
                    <Link to="/Companies">Browse Companies</Link>
                  </li>
                  <li>
                    <Link to="/faq">FAQ</Link>
                  </li>
                </ul>
              </div>
              <div className="nk-link-block">
                <h5>Support</h5>
                <ul>
                  <li>
                    <Link to="/help-center">Help center</Link>
                  </li>
                  <li>
                    <Link to="/report-issue">Report issue</Link>
                  </li>
                  <li>
                    <Link to="/grievances">Grievances</Link>
                  </li>
                </ul>
              </div>
              <div className="nk-link-block">
                <h5>Legal &amp; Trust</h5>
                <ul>
                  <li>
                    <Link to="/privacy-policy">Privacy Policy</Link>
                  </li>
                  <li>
                    <Link to="/terms-conditions">Terms &amp; Conditions</Link>
                  </li>
                  <li>
                    <Link to="/fraud-alert">Fraud Alert</Link>
                  </li>
                  <li>
                    <Link to="/sitemap">Sitemap</Link>
                  </li>
                </ul>
              </div>
            </div>

            <div className="nk-col-app">
              <div className="nk-app-box">
                <h4>Apply on the go</h4>
                <p className="nk-small">Get real-time job updates on our App</p>
                <div className="nk-app-buttons">
                  <a
                    href="https://play.google.com/store/apps/details?id=com.uptula"
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="google-play"
                  >
                    <img src="https://play.google.com/intl/en_us/badges/images/generic/en_badge_web_generic.png" alt="Get it on Google Play" className="nk-store-img" />
                  </a>
                  <a href="#" onClick={(e) => e.preventDefault()} aria-label="app-store">
                    <img src="https://developer.apple.com/assets/elements/badges/download-on-the-app-store.svg" alt="Download on the App Store" className="nk-store-img" />
                  </a>
                </div>
              </div>
            </div>
          </div>

          <div className="nk-row nk-footer-bottom">
            <div className="nk-col-full">
              <div className="nk-copyright text-center">
                <p>Copyright © 2026 All Rights Reserved.</p>
              </div>
            </div>
          </div>
        </div>
      </footer>

      <div
        className="modal fade"
        id="signin"
        tabIndex={-1}
        role="dialog"
        aria-labelledby="signinModalLabel"
        aria-hidden="true"
      >
        <div className="modal-dialog">
          <div className="modal-content" id="signinModalLabel">
            <div className="modal-body">
              <LoginForm
                role={signinPanel}
                variant="modal"
                onSwitchRole={(nextRole) => setSigninPanel(nextRole)}
              />
            </div>
          </div>
        </div>
      </div>

      <div>
        <Link to="#" className="scrollup" onClick={handleScrollToTop}>
          Scroll
        </Link>
      </div>
    </>
  );
}

export default Footer;
