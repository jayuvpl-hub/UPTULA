import React from "react";
import { motion } from "framer-motion";
import Header from "../Components/Header";
import Footer from "../Components/Footer";
import PageSEO from "../Components/PageSEO";

function Services() {
  // Service card content based on the reference design
  const servicesRow1 = [
    {
      id: "resume-display",
      title: "Resume Display",
      highlight: "Increase your profile visibility to recruiters up to 3 times.",
      description:
        "Get a featured profile and make sure your resume reaches more recruiters.",
      price: "₹ 1099 for 3 Months",
      badge: "Most Popular",
      image: "/assets/img/resume display.jpg",
    },
    {
      id: "priority-applicant",
      title: "Priority Applicant",
      highlight: "Be a priority applicant & increase your chance of getting a call.",
      description:
        "Get your application highlighted and be among the first to be noticed.",
      price: "₹ 1799 for 3 Months",
      badge: "Recommended",
      image: "/assets/img/priority applicants.jpg",
    },
    {
      id: "ai-mock-interview",
      title: "AI Mock Interview",
      highlight: "AI powered mock interviews tailored to your profile.",
      description:
        "Practice with AI driven questions and get instant, detailed feedback.",
      price: "₹ 2499 for 3 Months",
      badge: "Free Trial",
      image: "/assets/img/ai resume maker.jpg",
    },
    {
      id: "resume-writing",
      title: "Resume Writing",
      highlight: "Stand out from the crowd with our professionally written resume.",
      description:
        "Show your strengths and achievements with a resume written by experts.",
      price: "₹ 1653 Only",
      image: "/assets/img/resume writing.jpg",
    },
  ];

  const servicesRow2 = [
    {
      id: "online-resume-maker",
      title: "Online Resume Maker",
      highlight: "Create a job‑winning resume with our simple resume maker.",
      description: "Pick a template, add your details and download instantly.",
      price: "Start Free",
      image: "/assets/img/ai resume maker.jpg",
    },
    {
      id: "jobs-for-you",
      title: "Jobs For You",
      highlight: "Stand out as an early applicant with instant access to jobs.",
      description:
        "Get relevant job alerts, instant SMS / email notifications and apply in one tap.",
      price: "₹ 1566 for 3 Months",
      image: "/assets/img/jobs for you.jpg",
    },
    {
      id: "recruiter-connection",
      title: "Recruiter Connection",
      highlight: "Reach out directly to recruiters.",
      description:
        "Search from a database of recruiters and share your Naukri profile instantly.",
      price: "₹ 2879 for 5 Contacts",
      image: "/assets/img/recruiter connection.jpg",
    },
    {
      id: "resume-critique",
      title: "Resume Critique",
      highlight: "Get your resume reviewed and improved by experts.",
      description:
        "Know what works and what doesn’t with a detailed review of your resume.",
      price: "₹ 1017 Only",
      image: "/assets/img/resume critique.jpg",
    },
  ];

  // "What we offer" highlights — for both job seekers and employers
  const offerings = [
    {
      id: "seeker-tools",
      icon: "🚀",
      title: "Boost Your Job Search",
      text: "Featured profiles, priority applications and smart job alerts to help you get noticed faster.",
    },
    {
      id: "career-experts",
      icon: "✍️",
      title: "Expert Career Support",
      text: "Professionally written resumes, detailed critiques and AI mock interviews to sharpen your edge.",
    },
    {
      id: "employer-reach",
      icon: "🤝",
      title: "Connect with Talent",
      text: "Employers reach qualified candidates and seekers connect directly with the right recruiters.",
    },
  ];

  return (
    <>
      <PageSEO
        title="Best Job Portal in Odisha for Job Seekers | Service"
        description="Uptula is the best job portal in Odisha for job seekers. Browse hundreds of job vacancies, apply easily, and get hired faster. Start your job search in Odisha today."
      />
      <Header />
      <>
        {/* ======================= Hero / Intro Band ===================== */}
        <section className="services-hero">
          <div className="container">
            <motion.div
              className="services-hero-inner"
              initial={{ opacity: 0, y: 28 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: "easeOut" }}
            >
              <motion.span
                className="services-hero-eyebrow"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.1, ease: "easeOut" }}
              >
                Our Services &amp; Plans
              </motion.span>
              <motion.h1
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.55, delay: 0.18, ease: "easeOut" }}
              >
                Tools and plans built to move your career forward
              </motion.h1>
              <motion.p
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.55, delay: 0.26, ease: "easeOut" }}
              >
                Whether you are a job seeker looking for your next role or an
                employer searching for great talent, our services help you stand
                out, connect faster and hire smarter.
              </motion.p>
            </motion.div>
          </div>
        </section>
        {/* ======================= End Hero / Intro Band ===================== */}

        {/* ======================= What We Offer ===================== */}
        <section className="services-offer-section">
          <div className="container">
            <motion.div
              className="services-section-head"
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.5, ease: "easeOut" }}
            >
              <h2>What We Offer</h2>
              <p>Everything you need to grow — for seekers and employers alike.</p>
            </motion.div>

            <div className="services-offer-grid">
              {offerings.map((item, i) => (
                <motion.div
                  key={item.id}
                  className="services-offer-card"
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-60px" }}
                  transition={{ duration: 0.5, delay: i * 0.08, ease: "easeOut" }}
                  whileHover={{ y: -6 }}
                >
                  <span className="services-offer-icon" aria-hidden="true">
                    {item.icon}
                  </span>
                  <h3>{item.title}</h3>
                  <p>{item.text}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>
        {/* ======================= End What We Offer ===================== */}

        {/* ======================= Services & Plans Section ===================== */}
        <section className="services-plans-section">
          <div className="container">
            <motion.div
              className="services-section-head"
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.5, ease: "easeOut" }}
            >
              <h2>Services &amp; Plans</h2>
              <p>Pick the plan that fits where you are in your journey.</p>
            </motion.div>

            {/* First row - 4 cards */}
            <div className="services-cards-grid">
              {servicesRow1.map((service, i) => (
                <motion.div
                  key={service.id}
                  className="contact-service-card"
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-60px" }}
                  transition={{ duration: 0.5, delay: i * 0.08, ease: "easeOut" }}
                  whileHover={{ y: -6 }}
                >
                  {service.badge && (
                    <div className="contact-service-badge">{service.badge}</div>
                  )}
                  <div className="contact-service-image">
                    <img src={service.image} alt={service.title} />
                  </div>
                  <div className="contact-service-content">
                    <div className="contact-service-title">
                      <h4>{service.title}</h4>
                    </div>
                    <h5 className="contact-service-heading">{service.highlight}</h5>
                    <p>{service.description}</p>
                    <div className="contact-service-footer">
                      <span className="contact-service-price">{service.price}</span>
                      <button type="button" className="btn btn-default btn-sm">
                        Know More
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Monthly Plan banner */}
            <motion.div
              className="contact-subscription-card"
              initial={{ opacity: 0, y: 28 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.55, ease: "easeOut" }}
            >
              <div className="row">
                <div className="col-md-6 col-sm-6 col-xs-12">
                  <h3>Subscribe to our Monthly Job Search Plan</h3>
                  <p className="contact-subtitle">Key Benefits</p>
                  <ul className="contact-benefits-list">
                    <li>Rank higher in recruiter searches</li>
                    <li>Priority access to jobs</li>
                    <li>Send message to recruiter anytime</li>
                  </ul>
                  <button type="button" className="btn theme-btn">
                    Send Message to Recruiter
                  </button>
                  <p className="contact-subscription-note">
                    Subscription starts from <strong>₹ 899 per month</strong>
                  </p>
                </div>
                <div className="col-md-6 col-sm-6 hidden-xs">
                  <div className="contact-subscription-illustration">
                    <img
                      src="/assets/img/website_image.png"
                      alt="Monthly Job Search Plan"
                    />
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Second row - 4 cards */}
            <div className="services-cards-grid services-cards-grid-spaced">
              {servicesRow2.map((service, i) => (
                <motion.div
                  key={service.id}
                  className="contact-service-card"
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-60px" }}
                  transition={{ duration: 0.5, delay: i * 0.08, ease: "easeOut" }}
                  whileHover={{ y: -6 }}
                >
                  <div className="contact-service-image">
                    <img src={service.image} alt={service.title} />
                  </div>
                  <div className="contact-service-content">
                    <div className="contact-service-title">
                      <h4>{service.title}</h4>
                    </div>
                    <h5 className="contact-service-heading">{service.highlight}</h5>
                    <p>{service.description}</p>
                    <div className="contact-service-footer">
                      <span className="contact-service-price">{service.price}</span>
                      <button type="button" className="btn btn-default btn-sm">
                        Know More
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>
        {/* ======================= End Services & Plans Section ===================== */}

        {/* ======================= Talk To Us & Contact Form ===================== */}
        <section className="services-contact-section">
          <div className="container">
            <div className="row contact-bottom-row">
              {/* Left - Talk To Us */}
              <div className="col-md-6 col-sm-12">
                <motion.div
                  className="contact-talk-card"
                  initial={{ opacity: 0, x: -28 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true, margin: "-60px" }}
                  transition={{ duration: 0.55, ease: "easeOut" }}
                >
                  <h3>Talk To Us</h3>
                  <p>We would be delighted to assist you with your job search.</p>
                  <div className="contact-talk-info">
                    <p>
                      <strong>Call Toll Free:</strong> 1800‑102‑5557
                    </p>
                    <p>(9:00 AM to 9:00 PM IST)</p>
                    <p>
                      <strong>International Number:</strong> +91‑120‑4021100
                    </p>
                    <p>
                      For bulk queries call: <strong>1800‑104‑4477</strong>
                    </p>
                  </div>
                </motion.div>
              </div>

              {/* Right - Contact Form */}
              <div className="col-md-6 col-sm-12">
                <motion.div
                  className="contact-form-card"
                  initial={{ opacity: 0, x: 28 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true, margin: "-60px" }}
                  transition={{ duration: 0.55, delay: 0.08, ease: "easeOut" }}
                >
                  <h3>Contact Us</h3>
                  <p className="contact-form-subtitle">
                    Share your details and we will reach out to you shortly.
                  </p>
                  <form>
                    <div className="form-group">
                      <label htmlFor="contact-name">Name</label>
                      <input
                        id="contact-name"
                        type="text"
                        className="form-control"
                        placeholder="Your Name"
                      />
                    </div>
                    <div className="form-group">
                      <label htmlFor="contact-email">Email ID</label>
                      <input
                        id="contact-email"
                        type="email"
                        className="form-control"
                        placeholder="you@example.com"
                      />
                    </div>
                    <div className="form-group">
                      <label htmlFor="contact-query">Write your query here</label>
                      <textarea
                        id="contact-query"
                        className="form-control"
                        rows={4}
                        placeholder="e.g. I am interested"
                      />
                    </div>
                    <button type="submit" className="btn theme-btn btn-block">
                      CALL ME BACK
                    </button>
                  </form>
                </motion.div>
              </div>
            </div>
          </div>
        </section>
        {/* ======================= End Talk To Us & Contact Form ===================== */}

        {/* ======================= Closing Call To Action ===================== */}
        <section className="services-cta-section">
          <div className="container">
            <motion.div
              className="services-cta-band"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.55, ease: "easeOut" }}
            >
              <div className="services-cta-text">
                <h2>Ready to take the next step?</h2>
                <p>
                  Job seekers get discovered faster and employers find the right
                  talent — all in one place.
                </p>
              </div>
              <div className="services-cta-actions">
                <button type="button" className="btn theme-btn">
                  Get Started
                </button>
                <button type="button" className="btn btn-default services-cta-ghost">
                  Talk to Sales
                </button>
              </div>
            </motion.div>
          </div>
        </section>
        {/* ======================= End Closing Call To Action ===================== */}

        {/* Page‑specific styles for this layout */}
        <style>{`
          /* ===== Hero / Intro band ===== */
          .services-hero {
            background: linear-gradient(135deg, #16a34a 0%, #15803d 55%, #0f766e 100%);
            color: #ffffff;
            padding: 120px 0 64px;
          }
          .services-hero-inner {
            max-width: 760px;
          }
          .services-hero-eyebrow {
            display: inline-block;
            background: rgba(255,255,255,0.18);
            color: #ffffff;
            font-size: 12px;
            font-weight: 700;
            letter-spacing: 0.06em;
            text-transform: uppercase;
            padding: 6px 14px;
            border-radius: 999px;
            margin-bottom: 18px;
          }
          .services-hero h1 {
            margin: 0 0 14px;
            font-size: 38px;
            line-height: 1.18;
            font-weight: 800;
            color: #ffffff;
          }
          .services-hero p {
            margin: 0;
            font-size: 16px;
            line-height: 1.65;
            color: rgba(255,255,255,0.92);
            max-width: 640px;
          }

          /* ===== Section headings ===== */
          .services-section-head {
            text-align: center;
            max-width: 640px;
            margin: 0 auto 36px;
          }
          .services-section-head h2 {
            margin: 0 0 10px;
            font-size: 28px;
            font-weight: 800;
            color: #0f172a;
          }
          .services-section-head p {
            margin: 0;
            font-size: 15px;
            color: #475569;
            line-height: 1.6;
          }

          /* ===== What we offer ===== */
          .services-offer-section {
            background: #f8fafc;
            padding: 64px 0;
          }
          .services-offer-grid {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 24px;
          }
          .services-offer-card {
            background: #ffffff;
            border: 1px solid rgba(148,163,184,0.18);
            border-radius: 16px;
            box-shadow: 0 6px 20px rgba(15,23,42,0.06);
            padding: 28px 26px;
            text-align: center;
            transition: box-shadow 0.25s ease, border-color 0.25s ease;
          }
          .services-offer-card:hover {
            box-shadow: 0 14px 30px rgba(15,23,42,0.10);
            border-color: rgba(22,163,74,0.35);
          }
          .services-offer-icon {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            width: 58px;
            height: 58px;
            border-radius: 14px;
            background: rgba(22,163,74,0.10);
            font-size: 26px;
            margin-bottom: 16px;
          }
          .services-offer-card h3 {
            margin: 0 0 10px;
            font-size: 18px;
            font-weight: 700;
            color: #0f172a;
          }
          .services-offer-card p {
            margin: 0;
            font-size: 14px;
            line-height: 1.6;
            color: #64748b;
          }

          /* ===== Services & plans ===== */
          .services-plans-section {
            background: #f7fbf8;
            padding: 64px 0 56px;
          }
          .services-cards-grid {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 24px;
          }
          .services-cards-grid-spaced {
            margin-top: 40px;
          }

          /* ===== Service card (themed green) ===== */
          .contact-service-card {
            background: #ffffff;
            border: 1px solid rgba(148,163,184,0.18);
            border-radius: 16px;
            overflow: hidden;
            box-shadow: 0 6px 20px rgba(15,23,42,0.06);
            position: relative;
            height: 100%;
            display: flex;
            flex-direction: column;
            transition: box-shadow 0.25s ease, border-color 0.25s ease;
          }
          .contact-service-card:hover {
            box-shadow: 0 16px 34px rgba(15,23,42,0.12);
            border-color: rgba(22,163,74,0.35);
          }
          .contact-service-badge {
            position: absolute;
            top: 12px;
            right: 12px;
            z-index: 2;
            background: linear-gradient(135deg, #16a34a, #15803d);
            color: #fff;
            font-size: 11px;
            font-weight: 700;
            letter-spacing: 0.03em;
            padding: 5px 12px;
            text-transform: uppercase;
            border-radius: 999px;
            box-shadow: 0 4px 12px rgba(22,163,74,0.3);
          }
          .contact-service-image {
            overflow: hidden;
          }
          .contact-service-image img {
            width: 100%;
            height: 170px;
            object-fit: cover;
            display: block;
            transition: transform 0.4s ease;
          }
          .contact-service-card:hover .contact-service-image img {
            transform: scale(1.05);
          }
          .contact-service-content {
            padding: 18px 20px 20px;
            display: flex;
            flex-direction: column;
            flex: 1;
          }
          .contact-service-title h4 {
            margin: 0 0 4px;
            font-size: 15px;
            font-weight: 800;
            text-transform: uppercase;
            color: #0f172a;
            letter-spacing: 0.02em;
          }
          .contact-service-heading {
            font-size: 14px;
            font-weight: 700;
            color: #16a34a;
            margin: 6px 0 10px;
            line-height: 1.45;
          }
          .contact-service-content p {
            font-size: 13px;
            color: #64748b;
            margin-bottom: 14px;
            line-height: 1.55;
          }
          .contact-service-footer {
            display: flex;
            align-items: center;
            justify-content: space-between;
            margin-top: auto;
            padding-top: 6px;
            border-top: 1px solid rgba(148,163,184,0.16);
          }
          .contact-service-price {
            font-weight: 800;
            color: #0f172a;
            font-size: 14px;
          }
          .contact-service-footer .btn-default {
            border: 1px solid #16a34a;
            color: #16a34a;
            background: #ffffff;
            border-radius: 8px;
            font-weight: 600;
            transition: background 0.2s ease, color 0.2s ease;
          }
          .contact-service-footer .btn-default:hover,
          .contact-service-footer .btn-default:focus {
            background: #16a34a;
            color: #ffffff;
          }

          /* ===== Subscription banner ===== */
          .contact-subscription-card {
            background: #ffffff;
            border: 1px solid rgba(148,163,184,0.18);
            border-radius: 16px;
            box-shadow: 0 6px 20px rgba(15,23,42,0.06);
            padding: 32px 34px;
            margin-top: 40px;
          }
          .contact-subscription-card h3 {
            margin-top: 0;
            font-weight: 800;
            color: #0f172a;
          }
          .contact-subtitle {
            margin-top: 10px;
            margin-bottom: 8px;
            font-weight: 700;
            color: #16a34a;
          }
          .contact-benefits-list {
            padding-left: 18px;
            margin-bottom: 18px;
          }
          .contact-benefits-list li {
            font-size: 14px;
            margin-bottom: 6px;
            color: #475569;
          }
          .contact-subscription-note {
            margin-top: 12px;
            font-size: 13px;
            color: #64748b;
          }
          .contact-subscription-illustration img {
            max-width: 100%;
            height: auto;
          }

          /* ===== Theme button ===== */
          .theme-btn {
            background: #16a34a;
            border: 1px solid #16a34a;
            color: #ffffff;
            border-radius: 8px;
            font-weight: 700;
            transition: background 0.2s ease, border-color 0.2s ease;
          }
          .theme-btn:hover,
          .theme-btn:focus {
            background: #15803d;
            border-color: #15803d;
            color: #ffffff;
          }

          /* ===== Contact section ===== */
          .services-contact-section {
            background: #f8fafc;
            padding: 64px 0;
          }
          .contact-talk-card {
            background: linear-gradient(135deg, #16a34a, #15803d 60%, #0f766e);
            color: #ffffff;
            padding: 32px 28px;
            border-radius: 16px;
            min-height: 100%;
            box-shadow: 0 10px 26px rgba(22,163,74,0.22);
          }
          .contact-talk-card h3 {
            margin-top: 0;
            margin-bottom: 10px;
            font-weight: 800;
          }
          .contact-talk-info p {
            margin-bottom: 6px;
          }
          .contact-form-card {
            background: #ffffff;
            border: 1px solid rgba(148,163,184,0.18);
            border-radius: 16px;
            box-shadow: 0 6px 20px rgba(15,23,42,0.06);
            padding: 28px 28px 32px;
          }
          .contact-form-card h3 {
            margin-top: 0;
            font-weight: 800;
            color: #0f172a;
          }
          .contact-form-subtitle {
            font-size: 14px;
            color: #64748b;
            margin-bottom: 18px;
          }
          .contact-form-card .form-group {
            margin-bottom: 16px;
          }
          .contact-form-card label {
            font-weight: 600;
            color: #475569;
            font-size: 13px;
          }
          .contact-form-card .form-control {
            border-radius: 8px;
            border: 1px solid rgba(148,163,184,0.4);
          }
          .contact-form-card .form-control:focus {
            border-color: #16a34a;
            box-shadow: 0 0 0 3px rgba(22,163,74,0.12);
          }
          .contact-form-card .btn-block {
            width: 100%;
            margin-top: 5px;
          }
          .contact-bottom-row {
            display: flex;
            flex-wrap: wrap;
          }
          .contact-bottom-row > div {
            display: flex;
          }
          .contact-talk-card,
          .contact-form-card {
            width: 100%;
          }

          /* ===== Closing CTA band ===== */
          .services-cta-section {
            background: #f7fbf8;
            padding: 0 0 72px;
          }
          .services-cta-band {
            background: linear-gradient(135deg, #16a34a 0%, #15803d 55%, #0f766e 100%);
            border-radius: 20px;
            padding: 40px 44px;
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 24px;
            color: #ffffff;
            box-shadow: 0 16px 40px rgba(22,163,74,0.25);
          }
          .services-cta-text h2 {
            margin: 0 0 8px;
            font-size: 26px;
            font-weight: 800;
            color: #ffffff;
          }
          .services-cta-text p {
            margin: 0;
            font-size: 15px;
            color: rgba(255,255,255,0.92);
            line-height: 1.55;
          }
          .services-cta-actions {
            display: flex;
            gap: 12px;
            flex-shrink: 0;
          }
          .services-cta-actions .theme-btn {
            background: #ffffff;
            color: #15803d;
            border-color: #ffffff;
          }
          .services-cta-actions .theme-btn:hover,
          .services-cta-actions .theme-btn:focus {
            background: #f1f5f9;
            color: #15803d;
            border-color: #f1f5f9;
          }
          .services-cta-ghost {
            background: transparent;
            border: 1px solid rgba(255,255,255,0.7);
            color: #ffffff;
            border-radius: 8px;
            font-weight: 700;
          }
          .services-cta-ghost:hover,
          .services-cta-ghost:focus {
            background: rgba(255,255,255,0.14);
            color: #ffffff;
            border-color: #ffffff;
          }

          /* ===== Tablet ===== */
          @media (max-width: 991px) {
            .services-hero {
              padding: 104px 0 48px;
            }
            .services-hero h1 {
              font-size: 30px;
            }
            .services-offer-grid {
              grid-template-columns: repeat(2, 1fr);
            }
            .services-cards-grid {
              grid-template-columns: repeat(2, 1fr);
            }
            .services-cta-band {
              flex-direction: column;
              align-items: flex-start;
              text-align: left;
            }
          }

          /* ===== Mobile ===== */
          @media (max-width: 767px) {
            .contact-bottom-row {
              display: block;
            }
            .contact-bottom-row > div {
              display: block;
              margin-bottom: 20px;
            }
            .contact-bottom-row > div:last-child {
              margin-bottom: 0;
            }
          }

          @media (max-width: 575px) {
            .services-hero {
              padding: 96px 0 40px;
            }
            .services-hero h1 {
              font-size: 25px;
            }
            .services-hero p {
              font-size: 15px;
            }
            .services-section-head h2 {
              font-size: 23px;
            }
            .services-offer-grid {
              grid-template-columns: 1fr;
            }
            .services-cards-grid {
              grid-template-columns: 1fr;
            }
            .contact-subscription-card,
            .contact-talk-card,
            .contact-form-card {
              padding: 24px 20px;
            }
            .services-cta-band {
              padding: 30px 24px;
            }
            .services-cta-actions {
              flex-direction: column;
              width: 100%;
            }
            .services-cta-actions .btn {
              width: 100%;
            }
          }
        `}</style>
      </>
      <Footer />
    </>
  );
}

export default Services;
