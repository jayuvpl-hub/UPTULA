import React from "react";
import { Link } from "react-router-dom";
import Header from "../Components/Header";
import Footer from "../Components/Footer";
import "./TermsConditions.css";

function TermsConditions() {
  return (
    <>
      <Header />
      
      
      <div className="page-title">
        <div className="container">
          <div className="page-caption">
            <h2>Terms &amp; Conditions</h2>
            <p>
              <Link to="/" title="Home">
                Home
              </Link>{" "}
              <i className="ti-angle-double-right" /> Terms &amp; Conditions
            </p>
          </div>
        </div>
      </div>

      <div className="terms-container">
        <nav className="terms-sidebar">
          <h2>Terms &amp; Conditions</h2>
          <ul>
            <li>
              <a href="#welcome">1. Welcome &amp; Acceptance</a>
            </li>
            <li>
              <a href="#user-accounts">2. User Accounts &amp; Security</a>
            </li>
            <li>
              <a href="#job-listings">3. Job Listing Rules</a>
            </li>
            <li>
              <a href="#resume-data">4. Resume &amp; Data Usage</a>
            </li>
            <li>
              <a href="#termination">5. Suspension &amp; Termination</a>
            </li>
            <li>
              <a href="#governing-law">6. Governing Law</a>
            </li>
          </ul>
        </nav>
        <main className="terms-content">
          <header className="terms-header">
            <h1>Service Agreement | Terms &amp; Conditions</h1>
            <p className="updated-date">Last Updated: November 20, 2025</p>
          </header>
          <article id="welcome" className="terms-section module-focus">
            <div className="icon-header">
              <span className="icon">✨</span>
              <h2>1. Welcome &amp; Acceptance</h2>
            </div>
            <p>
              By accessing or using our job portal service ("Service"), you agree to
              be bound by these Terms and Conditions. This is a legally binding
              agreement.
            </p>
            <div className="note-box">
              <p>
                <strong>Key Takeaway:</strong> Using the site means you agree to these rules.
              </p>
            </div>
          </article>
          <article id="user-accounts" className="terms-section">
            <div className="icon-header">
              <span className="icon">👤</span>
              <h2>2. User Accounts &amp; Security</h2>
            </div>
            <p>
              Users must be at least 18 years old. You are responsible for
              maintaining the confidentiality of your password and account.
            </p>
            <ul>
              <li>
                <strong>Accuracy:</strong> All registration information must be truthful and
                accurate.
              </li>
              <li>
                <strong>Activity:</strong> You are fully responsible for all activities that
                occur under your account.
              </li>
            </ul>
          </article>
          <article id="job-listings" className="terms-section module-focus">
            <div className="icon-header">
              <span className="icon">💼</span>
              <h2>3. Job Listing Rules (For Employers)</h2>
            </div>
            <p>
              Job postings must comply with all local, state, and federal laws and
              must be for <strong>genuine, current vacancies</strong>. Discrimination is strictly
              prohibited.
            </p>
            <div className="note-box alert">
              <p>
                <strong>Crucial:</strong> Misleading or fraudulent job postings will result in
                immediate account termination.
              </p>
            </div>
          </article>
          <article id="resume-data" className="terms-section">
            <div className="icon-header">
              <span className="icon">🔒</span>
              <h2>4. Resume &amp; Data Usage</h2>
            </div>
            <p>
              Any information you submit (resumes, cover letters) is governed by our
              Privacy Policy. You grant us a non-exclusive license to use this data
              to provide the job matching service.
            </p>
          </article>
          <article id="termination" className="terms-section">
            <div className="icon-header">
              <span className="icon">🛑</span>
              <h2>5. Suspension &amp; Termination</h2>
            </div>
            <p>
              We reserve the right to suspend or terminate your account at our sole
              discretion if you breach these Terms, especially for abusive behavior
              or posting prohibited content.
            </p>
          </article>
          <article id="governing-law" className="terms-section">
            <div className="icon-header">
              <span className="icon">⚖️</span>
              <h2>6. Governing Law</h2>
            </div>
            <p>These Terms are governed by the laws of your jurisdiction.</p>
          </article>
          <footer className="terms-footer">
            <p>
              For any questions regarding these Terms, please contact us at
              support@jobportal.com.
            </p>
            <Link to="/" className="btn btn-primary">
              Back to Home
            </Link>
          </footer>
        </main>
      </div>
      <Footer />
    </>
  );
}

export default TermsConditions;
