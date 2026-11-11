import React from 'react';
import { useSearchParams } from 'react-router-dom';
import ForgotPasswordForm from '../../Components/auth/ForgotPasswordForm';
import AuthPageLayout from './AuthPageLayout';

function parseRole(raw) {
  const value = String(raw || '').toLowerCase();
  if (value === 'employer' || value === 'provider') return 'employer';
  return 'jobseeker';
}

function ForgotPasswordPage() {
  const [params] = useSearchParams();
  const role = parseRole(params.get('role'));

  return (
    <AuthPageLayout title="Forgot Password | Uptula" allowAuthed>
      <ForgotPasswordForm role={role} />
    </AuthPageLayout>
  );
}

export default ForgotPasswordPage;
