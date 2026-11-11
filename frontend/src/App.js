import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import ScrollToTop from "./Components/ScrollToTop";
import { AuthProvider, useAuth } from "./context/AuthContext";
import Home from "./Pages/Home";
import Companies from "./Pages/Companies";
import Services from "./Pages/Services";
import TermsConditions from "./Pages/TermsConditions";
import PrivacyPolicy from "./Pages/PrivacyPolicy";
import Profile from "./Candidate/Profile";
import EmployerProfile from "./Employer/Profile";
import AddJobs from "./Employer/AddJobs";
import ManageJobs from "./Employer/ManageJobs";
import JobDetail from "./Pages/JobDetail";
import AppliedJobs from "./Candidate/AppliedJobs";
import CreateResume from "./Candidate/CreateResume";
import ProfileTools from "./Candidate/ProfileTools";
import ChangePassword from "./Candidate/ChangePassword";
import EmployerChangePassword from "./Employer/ChangePassword";
import ViewCandidates from "./Employer/ViewCandidates";
import EmployerPremiumManager from "./Employer/PremiumManager";
import BooleanSearch from "./Employer/BooleanSearch";
import ResumeScoring from "./Employer/ResumeScoring";
import Referral from "./Employer/Referral";
import CandidateChat from "./Candidate/Chat";
import EmployerChat from "./Employer/Chat";
import Wishlist from "./Candidate/Wishlist";
import RequireAuth from "./Components/auth/RequireAuth";
import WFH from "./Inner Pages/WFH";
import Internship from "./Inner Pages/Internship";
import Freelancing from "./Inner Pages/Freelancing";
import PartTime from "./Inner Pages/PartTime";
import FullTime from "./Inner Pages/FullTime";
import Admin from "./Admin";
import CustomerService from "./CustomerService";
import EmployerSupport from "./Employer/Support";
import EmployerAnalytics from "./Employer/Analytics";
import CompanyDetails from "./Pages/CompanyDetails";
import InternalCreateUser from "./Pages/InternalCreateUser";
import AllJobs from "./Pages/AllJobs";
import AboutUs from "./Pages/AboutUs";
import HelpCenter from "./Pages/HelpCenter";
import ReportIssue from "./Pages/ReportIssue";
import ContactUs from "./Pages/ContactUs";
import Careers from "./Pages/Careers";
import Faq from "./Pages/Faq";
import Grievances from "./Pages/Grievances";
import FraudAlert from "./Pages/FraudAlert";
import Sitemap from "./Pages/Sitemap";
import RegisterPage from "./Pages/auth/RegisterPage";
import LoginPage from "./Pages/auth/LoginPage";
import EmployerLoginPage from "./Pages/auth/EmployerLoginPage";
import EmployerRegisterPage from "./Pages/auth/EmployerRegisterPage";
import ForgotPasswordPage from "./Pages/auth/ForgotPasswordPage";
import RedirectPage from "./Pages/RedirectPage";
function AppContent() {
  const { loading } = useAuth();

  if (loading) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        backgroundColor: '#f8f9fa'
      }}>
        <div style={{
          textAlign: 'center',
          padding: '40px',
          backgroundColor: 'white',
          borderRadius: '10px',
          boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
        }}>
          <div style={{
            width: '40px',
            height: '40px',
            border: '4px solid #f3f3f3',
            borderTop: '4px solid #007bff',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            margin: '0 auto 20px'
          }}></div>
          <h3>Loading...</h3>
          <p>Please wait while we verify your session</p>
        </div>
        <style>
          {`
            @keyframes spin {
              0% { transform: rotate(0deg); }
              100% { transform: rotate(360deg); }
            }
          `}
        </style>
      </div>
    );
  }

  return (
    <Router>
      <ScrollToTop />
      <Routes>
        {/* Admin Routes */}
        <Route path="/admin/*" element={<Admin />} />
        {/* Customer Service Routes */}
        <Route path="/cs/*" element={<CustomerService />} />
        <Route path="/redirect" element={<RedirectPage />} />
        <Route path="/about-us" element={<AboutUs />} />  
        {/* Main App Routes */}
        <Route path="/" element={<Home />} />
        <Route path="/Companies" element={<Companies />} />
        <Route path="/jobs" element={<AllJobs />} />
        <Route path="/jobs/:slug" element={<JobDetail />} />
        <Route path="/company/:id" element={<CompanyDetails />} />
        <Route path="/internal/create-user" element={<InternalCreateUser />} />
        <Route path="/candidate/applied-jobs" element={<RequireAuth role="seeker"><AppliedJobs /></RequireAuth>} />
        <Route path="/candidate/create-resume" element={<RequireAuth role="seeker"><CreateResume /></RequireAuth>} />
        <Route path="/candidate/profile-tools" element={<RequireAuth role="seeker"><ProfileTools /></RequireAuth>} />
        <Route path="/candidate/change-password" element={<RequireAuth role="seeker"><ChangePassword /></RequireAuth>} />
        <Route path="/candidate/chat" element={<RequireAuth role="seeker"><CandidateChat /></RequireAuth>} />
        <Route path="/candidate/wishlist" element={<RequireAuth role="seeker"><Wishlist /></RequireAuth>} />
        <Route path="/employer/view-candidates" element={<RequireAuth role="provider"><ViewCandidates /></RequireAuth>} />
        <Route path="/employer/boolean-search" element={<RequireAuth role="provider"><BooleanSearch /></RequireAuth>} />
        <Route path="/employer/resume-scoring" element={<RequireAuth role="provider"><ResumeScoring /></RequireAuth>} />
        <Route path="/employer/referral" element={<RequireAuth role="provider"><Referral /></RequireAuth>} />
        <Route path="/employer/support" element={<RequireAuth role="provider"><EmployerSupport /></RequireAuth>} />
        <Route path="/Services" element={<Services />} />
        <Route path="/services" element={<Services />} />
        <Route path="/terms-conditions" element={<TermsConditions />} />
        <Route path="/report-issue" element={<ReportIssue />} />
        <Route path="/privacy-policy" element={<PrivacyPolicy />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/employer/login" element={<EmployerLoginPage />} />
        <Route path="/employer/register" element={<EmployerRegisterPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/profile" element={<RequireAuth role="seeker"><Profile /></RequireAuth>} />
        <Route path="/employer/profile" element={<RequireAuth role="provider"><EmployerProfile /></RequireAuth>} />
        <Route path="/employer/add-jobs" element={<RequireAuth role="provider"><AddJobs /></RequireAuth>} />
        <Route path="/employer/manage-jobs" element={<RequireAuth role="provider"><ManageJobs /></RequireAuth>} />
        <Route path="/employer/premium" element={<RequireAuth role="provider"><EmployerPremiumManager /></RequireAuth>} />
        <Route path="/employer/chat" element={<RequireAuth role="provider"><EmployerChat /></RequireAuth>} />
        <Route path="/employer/analytics" element={<RequireAuth role="provider"><EmployerAnalytics /></RequireAuth>} />
        <Route path="/employer/change-password" element={<RequireAuth role="provider"><EmployerChangePassword /></RequireAuth>} />
        <Route path="/help-center" element={<HelpCenter />} />
        <Route path="/Work-From-Home-job" element={<WFH />} />
        <Route path="/Internship" element={<Internship />} />
        <Route path="/Freelancing-job" element={<Freelancing />} />
        <Route path="/Part-Time-job" element={<PartTime />} />
        <Route path="/Full-Time-job" element={<FullTime />} />
        <Route path="/contact-us" element={<ContactUs />} />
        <Route path="/careers" element={<Careers />} />
        <Route path="/faq" element={<Faq />} />
        <Route path="/grievances" element={<Grievances />} />
        <Route path="/fraud-alert" element={<FraudAlert />} />
        <Route path="/sitemap" element={<Sitemap />} />
        </Routes>
      </Router>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;
