// import React, { useState } from "react";
// import Header from "../Components/Header";
// import Footer from "../Components/Footer";

// const servicesRow1 = [
//   {
//     id: "resume-display",
//     title: "Resume Display",
//     highlight: "Increase your profile visibility to recruiters up to 3 times.",
//     description:
//       "Get a featured profile and make sure your resume reaches more recruiters.",
//     price: "₹ 1099 for 3 Months",
//     badge: "Most Popular",
//     image: "/assets/img/resume display.jpg",
//   },
//   {
//     id: "priority-applicant",
//     title: "Priority Applicant",
//     highlight: "Be a priority applicant & increase your chance of getting a call.",
//     description:
//       "Get your application highlighted and be among the first to be noticed.",
//     price: "₹ 1799 for 3 Months",
//     badge: "Recommended",
//     image: "/assets/img/priority applicants.jpg",
//   },
//   {
//     id: "ai-mock-interview",
//     title: "AI Mock Interview",
//     highlight: "AI powered mock interviews tailored to your profile.",
//     description:
//       "Practice with AI driven questions and get instant, detailed feedback.",
//     price: "₹ 2499 for 3 Months",
//     badge: "Free Trial",
//     image: "/assets/img/ai resume maker.jpg",
//   },
//   {
//     id: "resume-writing",
//     title: "Resume Writing",
//     highlight: "Stand out from the crowd with our professionally written resume.",
//     description:
//       "Show your strengths and achievements with a resume written by experts.",
//     price: "₹ 1653 Only",
//     image: "/assets/img/resume writing.jpg",
//   },
// ];

// const servicesRow2 = [
//   {
//     id: "online-resume-maker",
//     title: "Online Resume Maker",
//     highlight: "Create a job‑winning resume with our simple resume maker.",
//     description: "Pick a template, add your details and download instantly.",
//     price: "Start Free",
//     image: "/assets/img/ai resume maker.jpg",
//   },
//   {
//     id: "jobs-for-you",
//     title: "Jobs For You",
//     highlight: "Stand out as an early applicant with instant access to jobs.",
//     description:
//       "Get relevant job alerts, instant SMS / email notifications and apply in one tap.",
//     price: "₹ 1566 for 3 Months",
//     image: "/assets/img/jobs for you.jpg",
//   },
//   {
//     id: "recruiter-connection",
//     title: "Recruiter Connection",
//     highlight: "Reach out directly to recruiters.",
//     description:
//       "Search from a database of recruiters and share your Naukri profile instantly.",
//     price: "₹ 2879 for 5 Contacts",
//     image: "/assets/img/recruiter connection.jpg",
//   },
//   {
//     id: "resume-critique",
//     title: "Resume Critique",
//     highlight: "Get your resume reviewed and improved by experts.",
//     description:
//       "Know what works and what doesn't with a detailed review of your resume.",
//     price: "₹ 1017 Only",
//     image: "/assets/img/resume critique.jpg",
//   },
// ];

// function ServiceCard({ service }) {
//   return (
//     <div className="col-md-3 col-sm-6 col-xs-12">
//       <div className="contact-service-card">
//         {service.badge && (
//           <div className="contact-service-badge">{service.badge}</div>
//         )}
//         <div className="contact-service-image">
//           <img src={service.image} alt={service.title} />
//         </div>
//         <div className="contact-service-content">
//           <div className="contact-service-title">
//             <h4>{service.title}</h4>
//           </div>
//           <h5 className="contact-service-heading">{service.highlight}</h5>
//           <p>{service.description}</p>
//           <div className="contact-service-footer">
//             <span className="contact-service-price">{service.price}</span>
//             <button type="button" className="btn btn-default btn-sm">
//               Know More
//             </button>
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// }

// function ContactUs() {
//   const [formData, setFormData] = useState({ name: "", email: "", query: "" });

//   const handleChange = (e) => {
//     setFormData((prev) => ({ ...prev, [e.target.id]: e.target.value }));
//   };

//   const handleSubmit = (e) => {
//     e.preventDefault();
//     // TODO: wire up your submit logic here
//     alert("Your message has been sent! We'll call you back shortly.");
//     setFormData({ name: "", email: "", query: "" });
//   };

//   return (
//     <>
//       {/* ======================= Services & Plans Section ===================== */}
//       <Header />
      
//       {/* ======================= End Services & Plans Section ===================== */}

//       {/* ======================= Talk To Us & Contact Form ===================== */}
//       <section className="padd-top-60 padd-bot-60">
//         <div className="container">
//           <div className="row contact-bottom-row">
//             {/* Left - Talk To Us */}
//             <div className="col-md-6 col-sm-12">
//               <div className="contact-talk-card">
//                 <h3>Talk To Us</h3>
//                 <p>We would be delighted to assist you with your job search.</p>
//                 <div className="contact-talk-info">
//                   <p>
//                     <strong>Call Toll Free:</strong> 1800‑102‑5557
//                   </p>
//                   <p>(9:00 AM to 9:00 PM IST)</p>
//                   <p>
//                     <strong>International Number:</strong> +91‑120‑4021100
//                   </p>
//                   <p>
//                     For bulk queries call: <strong>1800‑104‑4477</strong>
//                   </p>
//                 </div>
//               </div>
//             </div>

//             {/* Right - Contact Form */}
//             <div className="col-md-6 col-sm-12">
//               <div className="contact-form-card">
//                 <h3>Contact Us</h3>
//                 <p className="contact-form-subtitle">
//                   Share your details and we will reach out to you shortly.
//                 </p>
//                 <form onSubmit={handleSubmit}>
//                   <div className="form-group">
//                     <label htmlFor="name">Name</label>
//                     <input
//                       id="name"
//                       type="text"
//                       className="form-control"
//                       placeholder="Your Name"
//                       value={formData.name}
//                       onChange={handleChange}
//                       required
//                     />
//                   </div>
//                   <div className="form-group">
//                     <label htmlFor="email">Email ID</label>
//                     <input
//                       id="email"
//                       type="email"
//                       className="form-control"
//                       placeholder="you@example.com"
//                       value={formData.email}
//                       onChange={handleChange}
//                       required
//                     />
//                   </div>
//                   <div className="form-group">
//                     <label htmlFor="query">Write your query here</label>
//                     <textarea
//                       id="query"
//                       className="form-control"
//                       rows={4}
//                       placeholder="e.g. I am interested"
//                       value={formData.query}
//                       onChange={handleChange}
//                     />
//                   </div>
//                   <button type="submit" className="btn theme-btn btn-block">
//                     CALL ME BACK
//                   </button>
//                 </form>
//               </div>
//             </div>
//           </div>
//         </div>
//       </section>
//       <Footer />
//       {/* ======================= End Talk To Us & Contact Form ===================== */}

//       {/* Page‑specific styles */}
//       <style>{`
//         .contact-service-card {
//           background: #ffffff;
//           border: 1px solid #e1e1e1;
//           border-radius: 4px;
//           overflow: hidden;
//           margin-bottom: 20px;
//           box-shadow: 0 1px 3px rgba(0,0,0,0.06);
//           position: relative;
//           height: 100%;
//           display: flex;
//           flex-direction: column;
//         }

//         .contact-service-badge {
//           position: absolute;
//           top: 0;
//           right: 0;
//           background: #ff5722;
//           color: #fff;
//           font-size: 11px;
//           font-weight: 600;
//           padding: 4px 10px;
//           text-transform: uppercase;
//           border-radius: 0 4px 0 4px;
//         }

//         .contact-service-image img {
//           width: 100%;
//           height: auto;
//           display: block;
//         }

//         .contact-service-content {
//           padding: 16px 18px 18px;
//           display: flex;
//           flex-direction: column;
//           flex: 1;
//         }

//         .contact-service-title h4 {
//           margin: 0 0 4px;
//           font-size: 15px;
//           font-weight: 700;
//           text-transform: uppercase;
//         }

//         .contact-service-heading {
//           font-size: 14px;
//           font-weight: 600;
//           color: #333;
//           margin: 6px 0 10px;
//         }

//         .contact-service-content p {
//           font-size: 12px;
//           color: #777;
//           margin-bottom: 10px;
//         }

//         .contact-service-footer {
//           display: flex;
//           align-items: center;
//           justify-content: space-between;
//           margin-top: auto;
//         }

//         .contact-service-price {
//           font-weight: 600;
//           color: #333;
//           font-size: 13px;
//         }

//         .contact-services-row {
//           display: flex;
//           flex-wrap: wrap;
//         }

//         .contact-services-row > [class*='col-'] {
//           display: flex;
//         }

//         .contact-subscription-card {
//           background: #ffffff;
//           border-radius: 4px;
//           box-shadow: 0 1px 4px rgba(0,0,0,0.08);
//           padding: 25px 30px;
//         }

//         .contact-subscription-card h3 {
//           margin-top: 0;
//           font-weight: 700;
//         }

//         .contact-subtitle {
//           margin-top: 10px;
//           margin-bottom: 8px;
//           font-weight: 600;
//         }

//         .contact-benefits-list {
//           padding-left: 18px;
//           margin-bottom: 18px;
//         }

//         .contact-benefits-list li {
//           font-size: 13px;
//           margin-bottom: 4px;
//         }

//         .contact-subscription-note {
//           margin-top: 10px;
//           font-size: 12px;
//           color: #666;
//         }

//         .contact-subscription-illustration img {
//           max-width: 100%;
//           height: auto;
//         }

//         .contact-talk-card {
//           background: linear-gradient(135deg, #0084ff, #0052cc);
//           color: #ffffff;
//           padding: 30px 25px;
//           border-radius: 4px;
//           min-height: 100%;
//         }

//         .contact-talk-card h3 {
//           margin-top: 0;
//           margin-bottom: 10px;
//         }

//         .contact-talk-info p {
//           margin-bottom: 6px;
//         }

//         .contact-form-card {
//           background: #ffffff;
//           border-radius: 4px;
//           box-shadow: 0 1px 4px rgba(0,0,0,0.08);
//           padding: 25px 25px 30px;
//         }

//         .contact-form-card h3 {
//           margin-top: 0;
//         }

//         .contact-form-subtitle {
//           font-size: 13px;
//           color: #777;
//           margin-bottom: 16px;
//         }

//         .contact-form-card .form-group {
//           margin-bottom: 15px;
//         }

//         .contact-form-card .btn-block {
//           width: 100%;
//           margin-top: 5px;
//         }

//         .contact-bottom-row {
//           display: flex;
//           flex-wrap: wrap;
//         }

//         .contact-bottom-row > div {
//           display: flex;
//         }

//         .contact-talk-card,
//         .contact-form-card {
//           height: 100%;
//         }

//         @media (max-width: 767px) {
//           .contact-bottom-row {
//             display: block;
//           }

//           .contact-bottom-row > div {
//             display: block;
//           }

//           .contact-service-card {
//             margin-bottom: 16px;
//           }

//           .contact-talk-card {
//             margin-bottom: 20px;
//           }
//         }
//       `}</style>
//     </>
//   );
// }

// export default ContactUs;
import React, { useState } from "react";
import Header from "../Components/Header";
import Footer from "../Components/Footer";

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
      "Know what works and what doesn't with a detailed review of your resume.",
    price: "₹ 1017 Only",
    image: "/assets/img/resume critique.jpg",
  },
];

// New: contact channel data for the left card
const contactChannels = [
  {
    id: "email",
    label: "Email",
    value: "support@uptula.com",
    href: "mailto:support@uptula.com",
    icon: (
      <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2">
        <rect x="3" y="5" width="18" height="14" rx="2" />
        <path d="M3 7l9 6 9-6" />
      </svg>
    ),
  },
  {
    id: "phone",
    label: "Phone",
    value: "+91-7655070393",
    href: "tel:+91-7655070393",
    icon: (
      <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z" />
      </svg>
    ),
  },
  {
    id: "location",
    label: "Location",
    value: (
      <>
        <span style={{ display: "block" }}>
          Current office: 196/2282, Khandagiri Vihar, Bhubaneswar, Odisha 751030, India
        </span>
        <span style={{ display: "block", marginTop: 6 }}>
          Old office: D-2/7, Rasulgarh Industrial Estate, Industrial Area Estate, Rasulgarh, Bhubaneswar, Odisha 751010
        </span>
      </>
    ),
    href: null,
    icon: (
      <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
        <circle cx="12" cy="10" r="3" />
      </svg>
    ),
  },
  {
    id: "support",
    label: "Support",
    value: "24/7 · Response within 1 business day",
    href: null,
    icon: (
      <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="12" cy="12" r="10" />
        <path d="M12 6v6l4 2" />
      </svg>
    ),
  },
];

function ServiceCard({ service }) {
  return (
    <div className="col-md-3 col-sm-6 col-xs-12">
      <div className="contact-service-card">
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
      </div>
    </div>
  );
}

function ContactUs() {
  const [formData, setFormData] = useState({ name: "", email: "", query: "" });

  const handleChange = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.id]: e.target.value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // TODO: wire up your submit logic here
    alert("Your message has been sent! We'll call you back shortly.");
    setFormData({ name: "", email: "", query: "" });
  };

  return (
    <>
      {/* ======================= Services & Plans Section ===================== */}
      <Header />
      {/* ======================= End Services & Plans Section ===================== */}

      {/* ======================= Talk To Us & Contact Form ===================== */}
      <section className="padd-top-60 padd-bot-60 contact-section">
        <div className="container">
          <div className="contact-section-heading">
            <span className="contact-eyebrow">Get in touch</span>
            <h2>Reach us directly</h2>
            <p>
              Prefer email or phone? Use the details below — or send us a
              message and we'll take it from there.
            </p>
          </div>

          <div className="row contact-bottom-row">
            {/* Left - Talk To Us */}
            <div className="col-md-5 col-sm-12">
              <div className="contact-talk-card">
                <div className="contact-talk-glow" />
                <h3>Contact Channels</h3>
                <p className="contact-talk-subtitle">
                  Reach us anytime through the channels below.
                </p>

                <ul className="contact-channel-list">
                  {contactChannels.map((c) => (
                    <li key={c.id} className="contact-channel-item">
                      <span className="contact-channel-icon">{c.icon}</span>
                      <div className="contact-channel-text">
                        <span className="contact-channel-label">{c.label}</span>
                        {c.href ? (
                          <a href={c.href} className="contact-channel-value">
                            {c.value}
                          </a>
                        ) : (
                          <span className="contact-channel-value">{c.value}</span>
                        )}
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Right - Contact Form */}
            <div className="col-md-7 col-sm-12">
              <div className="contact-form-card">
                <h3>Send us a message</h3>
                <p className="contact-form-subtitle">
                  Share your details and we will reach out to you shortly.
                </p>
                <form onSubmit={handleSubmit}>
                  <div className="form-group">
                    <label htmlFor="name">Name</label>
                    <input
                      id="name"
                      type="text"
                      className="form-control"
                      placeholder="Your Name"
                      value={formData.name}
                      onChange={handleChange}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="email">Email ID</label>
                    <input
                      id="email"
                      type="email"
                      className="form-control"
                      placeholder="you@example.com"
                      value={formData.email}
                      onChange={handleChange}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="query">Write your query here</label>
                    <textarea
                      id="query"
                      className="form-control"
                      rows={4}
                      placeholder="e.g. I am interested"
                      value={formData.query}
                      onChange={handleChange}
                    />
                  </div>
                  <button type="submit" className="btn theme-btn btn-block">
                    Call Me Back
                  </button>
                </form>
              </div>
            </div>
          </div>
        </div>
      </section>
      <Footer />
      {/* ======================= End Talk To Us & Contact Form ===================== */}

      {/* Page‑specific styles */}
      <style>{`
        :root {
          --uptula-primary: #4f46e5;
          --uptula-primary-dark: #3730a3;
          --uptula-accent: #06b6d4;
          --uptula-ink: #111827;
          --uptula-muted: #6b7280;
          --uptula-border: #eef0f4;
        }

        .contact-section {
          background: #f7f8fb;
        }

        .contact-section-heading {
          text-align: center;
          max-width: 620px;
          margin: 0 auto 40px;
        }

        .contact-eyebrow {
          display: inline-block;
          font-size: 12px;
          font-weight: 700;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          color: var(--uptula-primary);
          background: rgba(79, 70, 229, 0.08);
          padding: 5px 14px;
          border-radius: 999px;
          margin-bottom: 14px;
        }

        .contact-section-heading h2 {
          font-size: 30px;
          font-weight: 800;
          color: var(--uptula-ink);
          margin: 0 0 10px;
        }

        .contact-section-heading p {
          color: var(--uptula-muted);
          font-size: 14px;
          margin: 0;
        }

        .contact-service-card {
          background: #ffffff;
          border: 1px solid var(--uptula-border);
          border-radius: 14px;
          overflow: hidden;
          margin-bottom: 20px;
          box-shadow: 0 2px 10px rgba(17, 24, 39, 0.04);
          position: relative;
          height: 100%;
          display: flex;
          flex-direction: column;
          transition: transform 0.25s ease, box-shadow 0.25s ease;
        }

        .contact-service-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 14px 28px rgba(17, 24, 39, 0.09);
        }

        .contact-service-badge {
          position: absolute;
          top: 0;
          right: 0;
          background: linear-gradient(135deg, var(--uptula-accent), var(--uptula-primary));
          color: #fff;
          font-size: 11px;
          font-weight: 600;
          padding: 4px 12px;
          text-transform: uppercase;
          border-radius: 0 14px 0 12px;
        }

        .contact-service-image img {
          width: 100%;
          height: auto;
          display: block;
        }

        .contact-service-content {
          padding: 16px 18px 18px;
          display: flex;
          flex-direction: column;
          flex: 1;
        }

        .contact-service-title h4 {
          margin: 0 0 4px;
          font-size: 15px;
          font-weight: 700;
          text-transform: uppercase;
          color: var(--uptula-ink);
        }

        .contact-service-heading {
          font-size: 14px;
          font-weight: 600;
          color: #333;
          margin: 6px 0 10px;
        }

        .contact-service-content p {
          font-size: 12px;
          color: #777;
          margin-bottom: 10px;
        }

        .contact-service-footer {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-top: auto;
        }

        .contact-service-price {
          font-weight: 600;
          color: var(--uptula-ink);
          font-size: 13px;
        }

        .contact-service-footer .btn {
          border-radius: 999px;
          border: 1px solid var(--uptula-primary);
          color: var(--uptula-primary);
          background: transparent;
          font-weight: 600;
          transition: all 0.2s ease;
        }

        .contact-service-footer .btn:hover {
          background: var(--uptula-primary);
          color: #fff;
        }

        .contact-services-row {
          display: flex;
          flex-wrap: wrap;
        }

        .contact-services-row > [class*='col-'] {
          display: flex;
        }

        .contact-bottom-row {
          display: flex;
          flex-wrap: wrap;
          align-items: stretch;
        }

        .contact-bottom-row > div {
          display: flex;
          margin-bottom: 24px;
        }

        /* Left contact card */
        .contact-talk-card {
          position: relative;
          overflow: hidden;
          background: linear-gradient(160deg, var(--uptula-primary), var(--uptula-primary-dark));
          color: #ffffff;
          padding: 34px 30px;
          border-radius: 18px;
          min-height: 100%;
          width: 100%;
          box-shadow: 0 18px 36px rgba(55, 48, 163, 0.28);
        }

        .contact-talk-glow {
          position: absolute;
          top: -60px;
          right: -60px;
          width: 200px;
          height: 200px;
          background: var(--uptula-accent);
          opacity: 0.25;
          border-radius: 50%;
          filter: blur(10px);
        }

        .contact-talk-card h3 {
          position: relative;
          margin: 0 0 6px;
          font-weight: 800;
          font-size: 20px;
        }

        .contact-talk-subtitle {
          position: relative;
          font-size: 13px;
          color: rgba(255, 255, 255, 0.8);
          margin-bottom: 26px;
        }

        .contact-channel-list {
          position: relative;
          list-style: none;
          margin: 0;
          padding: 0;
        }

        .contact-channel-item {
          display: flex;
          align-items: flex-start;
          gap: 14px;
          padding: 14px 0;
          border-bottom: 1px solid rgba(255, 255, 255, 0.14);
        }

        .contact-channel-item:last-child {
          border-bottom: none;
        }

        .contact-channel-icon {
          flex-shrink: 0;
          width: 40px;
          height: 40px;
          border-radius: 12px;
          background: rgba(255, 255, 255, 0.14);
          display: flex;
          align-items: center;
          justify-content: center;
          color: #fff;
        }

        .contact-channel-text {
          display: flex;
          flex-direction: column;
          gap: 2px;
        }

        .contact-channel-label {
          font-size: 11px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          color: rgba(255, 255, 255, 0.65);
        }

        .contact-channel-value {
          font-size: 14px;
          font-weight: 600;
          color: #fff;
          text-decoration: none;
          line-height: 1.4;
        }

        a.contact-channel-value:hover {
          text-decoration: underline;
        }

        /* Right form card */
        .contact-form-card {
          background: #ffffff;
          border-radius: 18px;
          box-shadow: 0 10px 30px rgba(17, 24, 39, 0.07);
          padding: 34px 32px 36px;
          width: 100%;
        }

        .contact-form-card h3 {
          margin-top: 0;
          font-weight: 800;
          color: var(--uptula-ink);
          font-size: 20px;
        }

        .contact-form-subtitle {
          font-size: 13px;
          color: var(--uptula-muted);
          margin-bottom: 22px;
        }

        .contact-form-card .form-group {
          margin-bottom: 18px;
        }

        .contact-form-card label {
          font-size: 12px;
          font-weight: 700;
          color: var(--uptula-ink);
          margin-bottom: 6px;
          display: inline-block;
        }

        .contact-form-card .form-control {
          border: 1px solid var(--uptula-border);
          border-radius: 10px;
          padding: 11px 14px;
          font-size: 14px;
          background: #fafbfc;
          transition: border-color 0.2s ease, box-shadow 0.2s ease;
        }

        .contact-form-card .form-control:focus {
          outline: none;
          border-color: var(--uptula-primary);
          box-shadow: 0 0 0 3px rgba(79, 70, 229, 0.12);
          background: #fff;
        }

        .contact-form-card .btn-block {
          width: 100%;
          margin-top: 6px;
        }

        .contact-form-card .theme-btn {
          background: linear-gradient(135deg, var(--uptula-primary), var(--uptula-accent));
          border: none;
          color: #fff;
          font-weight: 700;
          letter-spacing: 0.03em;
          padding: 13px 0;
          border-radius: 10px;
          text-transform: uppercase;
          font-size: 13px;
          transition: transform 0.2s ease, box-shadow 0.2s ease;
        }

        .contact-form-card .theme-btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 10px 20px rgba(79, 70, 229, 0.3);
        }

        @media (max-width: 767px) {
          .contact-bottom-row {
            display: block;
          }

          .contact-bottom-row > div {
            display: block;
          }

          .contact-service-card {
            margin-bottom: 16px;
          }

          .contact-talk-card {
            margin-bottom: 20px;
          }

          .contact-section-heading h2 {
            font-size: 24px;
          }
        }
      `}</style>
    </>
  );
}

export default ContactUs;