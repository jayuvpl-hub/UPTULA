import React from 'react';
import LoginForm from '../../Components/auth/LoginForm';
import AuthPageLayout from './AuthPageLayout';

function LoginPage() {
  return (
    <AuthPageLayout title="Job Seeker Login | Uptula">
      <LoginForm role="jobseeker" variant="page" />
    </AuthPageLayout>
  );
}

export default LoginPage;
