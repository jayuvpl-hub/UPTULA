import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../../Components/Header';
import Footer from '../../Components/Footer';
import PageSEO from '../../Components/PageSEO';
import { useAuth } from '../../context/AuthContext';
import { dashboardPathForRole } from '../../Components/auth/authUtils';
import '../../Components/Footer.css';

function AuthPageLayout({ title, children, allowAuthed = false }) {
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!allowAuthed && user) {
      navigate(dashboardPathForRole(user.role), { replace: true });
    }
  }, [allowAuthed, user, navigate]);

  return (
    <>
      <PageSEO title={title} description="" robots="noindex, nofollow" />
      <Header />
      <main className="auth-page">
        <div className="auth-page-card">{children}</div>
      </main>
      <Footer />
    </>
  );
}

export default AuthPageLayout;
