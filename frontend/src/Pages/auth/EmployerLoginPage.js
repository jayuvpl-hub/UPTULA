import React from 'react';
import LoginForm from '../../Components/auth/LoginForm';
import AuthPageLayout from './AuthPageLayout';

function EmployerLoginPage() {
  return (
    <AuthPageLayout title="Employer Login | Uptula">
      <LoginForm role="employer" variant="page" />
    </AuthPageLayout>
  );
}

export default EmployerLoginPage;
