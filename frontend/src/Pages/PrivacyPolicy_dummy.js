import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Header from "../Components/Header";
import Footer from "../Components/Footer";
import Chatbot from "../Components/Chatbot";
import "./PrivacyPolicy.css";

function PrivacyPolicy() {
  useEffect(() => {
    document.title = "Privacy Policy - Job Portal";
  }, []);

  // Scroll-spy: highlight the TOC link for the section in view
  const [activeId, setActiveId] = useState(null);
  useEffect(() => {
    // observe any element with an id inside the main content so cards and sections
    // are all tracked by the scroll-spy (articles, sections, etc.)
    const headings = Array.from(document.querySelectorAll('main [id]'));
    if (!headings.length) return;
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveId(entry.target.id);
          }
        });
      },
      { root: null, rootMargin: '0px 0px -40% 0px', threshold: 0.1 }
    );
    headings.forEach((h) => observer.observe(h));
    return () => observer.disconnect();
  }, []);

  return (
    <>
      <Header />

      <div className="page-title">
        <div className="container">
          <div className="page-caption">
            <h2>Privacy Policy</h2>
            <p>
              <Link to="/" title="Home">
                Home
              </Link>{" "}
              <i className="ti-angle-double-right" /> Privacy Policy
            </p>
          </div>
        </div>
      </div>

      

      <div className="privacy-container container">
        <div className="privacy-grid">
          <main className="privacy-main">
              {/* Three-column intro/info/use summary cards */}
              <div className="policy-3up">
                <article className="policy-card" id="intro">
                  <div className="policy-card-head">
                    <span className="policy-icon">◆</span>
                    <h3>Introduction</h3>
                  </div>
                  <p>
                    We value your privacy and are committed to safeguarding your personal
                    information. This policy outlines how we collect, use, and protect your
                    data.
                  </p>
                </article>

                <article className="policy-card" id="info">
                  <div className="policy-card-head">
                    <span className="policy-icon">◆</span>
                    <h3>Information We Collect</h3>
                  </div>
                  <ul className="policy-list">
                    <li>Personal details such as name, email, phone number, and resume.</li>
                    <li>Employment preferences and job applications.</li>
                    <li>Usage data such as login history and browsing activity.</li>
                  </ul>
                </article>

                <article className="policy-card" id="use">
                  <div className="policy-card-head">
                    <span className="policy-icon">◆</span>
                    <h3>How We Use Your Information</h3>
                  </div>
                  <ul className="policy-list">
                    <li>Match you with relevant job opportunities.</li>
                    <li>Send updates, notifications, and career-related offers.</li>
                    <li>Improve our services and user experience.</li>
                  </ul>
                </article>
              </div>

            {/* Additional policy cards: Data Protection, Sharing, Rights, Changes */}
            <div className="policy-collection">
              <article className="policy-card" id="protection">
                <div className="policy-card-head">
                  <span className="policy-icon">◆</span>
                  <h3>Data Protection</h3>
                </div>
                <p>
                  We implement strict security measures, including encryption and secure
                  servers, to protect your data from unauthorized access.
                </p>
              </article>

              <article className="policy-card" id="sharing">
                <div className="policy-card-head">
                  <span className="policy-icon">◆</span>
                  <h3>Sharing of Information</h3>
                </div>
                <p>
                  Your information is shared only with employers and recruiters for
                  job-related purposes. We never sell your personal data to third parties.
                </p>
              </article>


              <article className="policy-card" id="changes">
                <div className="policy-card-head">
                  <span className="policy-icon">◆</span>
                  <h3>Changes to This Policy</h3>
                </div>
                <p>
                  We may update this Privacy Policy periodically. Any changes will be
                  posted here with the updated date.
                </p>
              </article>
            </div>

            <div className="privacy-cta">
              <h3>Questions about your privacy?</h3>
              <p>Contact our support team and we'll help you with any request.</p>
              <div style={{display:'flex', gap:12, alignItems:'center'}}>
                <button
                  className="btn theme-btn"
                  onClick={(e)=>{
                    e.preventDefault();
                    window.dispatchEvent(new Event('openChatbot'));
                  }}
                >
                  Contact Support
                </button>
              </div>
            </div>
          </main>

          <aside className="privacy-toc">
            <nav>
              <h4>On this page</h4>
              <ul>
                <li><a className={activeId==='intro' ? 'active' : ''} href="#intro">Introduction</a></li>
                <li><a className={activeId==='info' ? 'active' : ''} href="#info">Information We Collect</a></li>
                <li><a className={activeId==='use' ? 'active' : ''} href="#use">How We Use Your Information</a></li>
                <li><a className={activeId==='protection' ? 'active' : ''} href="#protection">Data Protection</a></li>
                <li><a className={activeId==='sharing' ? 'active' : ''} href="#sharing">Sharing of Information</a></li>
                <li><a className={activeId==='changes' ? 'active' : ''} href="#changes">Changes to This Policy</a></li>
              </ul>
            </nav>
          </aside>
        </div>

      </div>

      <Footer />
      {/* Mount chatbot locally so the privacy page can open it via the global event */}
      <Chatbot />
    </>
  );
}

export default PrivacyPolicy;
