import React, { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import RegisterForm from '../../Components/auth/RegisterForm';
import AuthPageLayout from './AuthPageLayout';

function RegisterPage() {
  const location = useLocation();

  useEffect(() => {
    const code = new URLSearchParams(location.search).get('ref');
    if (code && code.trim()) {
      localStorage.setItem('referralCode', code.trim());
    }
  }, [location.search]);

  return (
    <AuthPageLayout title="Job Seeker Register | Uptula">
      <RegisterForm role="jobseeker" />
    </AuthPageLayout>
  );
}

export default RegisterPage;
