import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { dashboardPathForRole, loginPathForRole } from './authUtils';

function RequireAuth({ role, children }) {
  const { user } = useAuth();
  const location = useLocation();
  const expected = role === 'provider' || role === 'employer' ? 'provider' : 'seeker';
  const uiRole = expected === 'provider' ? 'employer' : 'jobseeker';

  if (!user) {
    const redirect = `${location.pathname}${location.search}`;
    return (
      <Navigate
        to={`${loginPathForRole(uiRole)}?redirect=${encodeURIComponent(redirect)}`}
        replace
      />
    );
  }

  if (user.role !== expected) {
    return <Navigate to={dashboardPathForRole(user.role)} replace />;
  }

  return children;
}

export default RequireAuth;
