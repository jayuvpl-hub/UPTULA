import React, { useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { useAuth } from '../../context/AuthContext';
import { API_BASE_URL } from '../../config/api';
import { auth as firebaseAuth, missingKeys as firebaseMissingKeys } from '../../config/firebaseClient';
import {
  apiErrorMessage,
  closeBootstrapModal,
  isAuthSuccessMessage,
  registerPathForRole,
  resolvePostLoginPath,
  roleMismatchMessage,
  toApiRole,
} from './authUtils';
import './authForms.css';

function LoginForm({ role = 'jobseeker', variant = 'page', onSuccess, onSwitchRole }) {
  const apiRole = toApiRole(role);
  const isEmployer = role === 'employer';
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { login } = useAuth();

  const [form, setForm] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const messageTimerRef = useRef(null);

  useEffect(() => {
    if (!message) return undefined;
    if (messageTimerRef.current) clearTimeout(messageTimerRef.current);
    const hideMs = isAuthSuccessMessage(message) ? 3000 : 4000;
    messageTimerRef.current = setTimeout(() => {
      setMessage('');
      messageTimerRef.current = null;
    }, hideMs);
    return () => {
      if (messageTimerRef.current) {
        clearTimeout(messageTimerRef.current);
        messageTimerRef.current = null;
      }
    };
  }, [message]);

  const finishLogin = async (user, token) => {
    if (!user || !token) return;
    if (user.role !== apiRole) {
      setMessage(roleMismatchMessage(apiRole));
      return;
    }
    await login(user, token);
    if (variant === 'modal') closeBootstrapModal('signin');
    if (onSuccess) {
      onSuccess(user);
      return;
    }
    const redirect = searchParams.get('redirect');
    navigate(resolvePostLoginPath(user.role, redirect));
  };

  const postAuthLogin = (loginEmail, loginPassword) =>
    fetch(`${API_BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: String(loginEmail || '').trim(),
        password: String(loginPassword || ''),
        role: apiRole,
      }),
    });

  const handleSubmit = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    const formEl = e.currentTarget;
    const formData = formEl && formEl.elements ? new FormData(formEl) : null;
    const email = String(formData?.get('loginId') || form.email || '').trim();
    const password = String(formData?.get('loginPassword') || form.password || '');
    setLoading(true);
    setMessage('');
    try {
      const response = await postAuthLogin(email, password);
      const data = await response.json();
      if (response.ok) {
        setMessage('Login successful!');
        await finishLogin(data.user, data.token);
      } else {
        setMessage(apiErrorMessage(data, 'Login failed'));
      }
    } catch (error) {
      setMessage('Network error. Please try again.');
    }
    setLoading(false);
  };

  const handleGoogleAuth = async () => {
    setLoading(true);
    setMessage('');
    try {
      if (!firebaseAuth) {
        const missing =
          Array.isArray(firebaseMissingKeys) && firebaseMissingKeys.length
            ? firebaseMissingKeys.join(', ')
            : 'Firebase config';
        setMessage(`Google login is not configured. Missing: ${missing}.`);
        return;
      }
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(firebaseAuth, provider);
      const idToken = await result.user.getIdToken();
      const response = await fetch(`${API_BASE_URL}/api/auth/firebase`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: idToken, role: apiRole, mode: 'login' }),
      });
      const data = await response.json();
      if (response.ok) {
        setMessage('Login successful!');
        await finishLogin(data.user, data.token);
      } else {
        setMessage(data?.message || 'Google sign-in failed');
      }
    } catch (err) {
      console.error('Google auth error:', err);
      setMessage('Google sign-in failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const goForgotPassword = (e) => {
    e.preventDefault();
    if (variant === 'modal') closeBootstrapModal('signin');
    navigate(`/forgot-password?role=${role}`);
  };

  const goRegister = (e) => {
    e.preventDefault();
    if (variant === 'modal') closeBootstrapModal('signin');
    navigate(registerPathForRole(role));
  };

  const switchRoleHref = isEmployer ? '/login' : '/employer/login';
  const switchRoleLabel = isEmployer
    ? 'To login as job seeker '
    : 'If you are employer then to login ';

  return (
    <div className="footer-modal-minimalist">
      {message && (
        <div
          className={`footer-toast ${isAuthSuccessMessage(message) ? 'footer-toast--success' : 'footer-toast--error'}`}
          role="alert"
        >
          {message}
        </div>
      )}
      <div className="footer-modal-forms">
        <h2 className="footer-modal-heading" style={{ textAlign: 'center' }}>
          {isEmployer ? 'Employer Login' : 'User Login'}
        </h2>
        <form className="footer-modal-form" onSubmit={handleSubmit} autoComplete="off" noValidate>
          <input
            type="text"
            name="loginId"
            autoComplete="username"
            placeholder="Enter your email or phone number"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            required
          />
          <input
            type="password"
            name="loginPassword"
            autoComplete="current-password"
            placeholder="Password"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            required
          />
          <div className="footer-modal-row">
            <a href="/forgot-password" className="footer-modal-link" onClick={goForgotPassword}>
              Forgot Password?
            </a>
          </div>
          <button type="submit" className="footer-modal-submit" disabled={loading}>
            {loading ? 'Logging in...' : 'LogIn'}
          </button>
        </form>
        <div className="footer-modal-create-account" style={{ marginTop: '12px', textAlign: 'center' }}>
          <span>If you don&apos;t have an account? </span>
          <a href={registerPathForRole(role)} style={{ color: '#2563eb', textDecoration: 'underline' }} onClick={goRegister}>
            Create here
          </a>
        </div>
        <div className="footer-modal-or">OR</div>
        <div className="footer-modal-social-row">
          <a
            href="#"
            className="gplus-log-btn log-btn"
            style={{ width: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center' }}
            onClick={(e) => {
              e.preventDefault();
              handleGoogleAuth();
            }}
          >
            <img
              src="/assets/img/google.png"
              alt="Google"
              style={{
                width: '20px',
                height: '20px',
                marginRight: '8px',
                display: 'block',
                flexShrink: 0,
                verticalAlign: 'unset',
                marginBottom: '0px',
              }}
            />{' '}
            Continue with Google
          </a>
        </div>
        <div className="footer-modal-switch-provider">
          <span>{switchRoleLabel}</span>
          {variant === 'modal' && onSwitchRole ? (
            <a
              href="#"
              style={{ color: '#2563eb', textDecoration: 'underline' }}
              onClick={(e) => {
                e.preventDefault();
                onSwitchRole(isEmployer ? 'jobseeker' : 'employer');
              }}
            >
              click here
            </a>
          ) : (
            <Link to={switchRoleHref} style={{ color: '#2563eb', textDecoration: 'underline' }}>
              click here
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}

export default LoginForm;
