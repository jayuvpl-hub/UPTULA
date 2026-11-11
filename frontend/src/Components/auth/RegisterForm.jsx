import React, { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { useAuth } from '../../context/AuthContext';
import { API_BASE_URL } from '../../config/api';
import { auth as firebaseAuth, missingKeys as firebaseMissingKeys } from '../../config/firebaseClient';
import RegistrationCategoryFields from '../RegistrationCategoryFields';
import {
  apiErrorMessage,
  dashboardPathForRole,
  isAuthSuccessMessage,
  loginPathForRole,
  otpDeliveryTarget,
  registerPathForRole,
  registrationEmailInput,
  roleMismatchMessage,
  toApiRole,
} from './authUtils';
import './authForms.css';

const emptyForm = {
  fullName: '',
  email: '',
  phone: '',
  password: '',
  confirmPassword: '',
  categoryId: '',
  subcategoryId: '',
};

function RegisterForm({ role = 'jobseeker' }) {
  const apiRole = toApiRole(role);
  const isEmployer = role === 'employer';
  const navigate = useNavigate();
  const { login } = useAuth();

  const [form, setForm] = useState(emptyForm);
  const [isOtpStep, setIsOtpStep] = useState(false);
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [otpTimer, setOtpTimer] = useState(60);
  const [otpExpired, setOtpExpired] = useState(false);
  const [otpSentVia, setOtpSentVia] = useState('email');
  const [resendCount, setResendCount] = useState(0);
  const [currentEmail, setCurrentEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const messageTimerRef = useRef(null);

  useEffect(() => {
    let interval;
    if (isOtpStep && otpTimer > 0) {
      interval = setInterval(() => setOtpTimer((prev) => prev - 1), 1000);
    }
    return () => clearInterval(interval);
  }, [isOtpStep, otpTimer]);

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

  const handleRegister = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    if (form.password !== form.confirmPassword) {
      setMessage('Passwords do not match');
      setLoading(false);
      return;
    }
    if (form.password.length < 6) {
      setMessage('Password must be at least 6 characters');
      setLoading(false);
      return;
    }
    if (!isEmployer && (!form.categoryId || !form.subcategoryId)) {
      setMessage('Please select a category and subcategory');
      setLoading(false);
      return;
    }

    try {
      const registrationEmail = registrationEmailInput(form.email);
      const payload = {
        role: apiRole,
        fullName: form.fullName,
        email: registrationEmail,
        phone: form.phone,
        password: form.password,
      };
      if (!isEmployer) {
        payload.categoryId = Number(form.categoryId);
        payload.subcategoryId = Number(form.subcategoryId);
      }
      const storedReferralCode = localStorage.getItem('referralCode');
      if (storedReferralCode) payload.referralCode = storedReferralCode;

      const response = await fetch(`${API_BASE_URL}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await response.json();
      if (response.ok) {
        setCurrentEmail(registrationEmail);
        setIsOtpStep(true);
        setOtpTimer(60);
        setOtpExpired(false);
        setOtpSentVia(data.sentVia || 'email');
        setResendCount(0);
        setMessage(`OTP sent to ${otpDeliveryTarget(data.sentVia)}`);
      } else {
        setMessage(data?.message || 'Registration failed');
      }
    } catch (error) {
      setMessage('Network error. Please try again.');
    }
    setLoading(false);
  };

  const handleOtpChange = (index, value) => {
    if (value.length > 1) return;
    const next = [...otp];
    next[index] = value;
    setOtp(next);
    if (value && index < 5) {
      const nextInput = document.getElementById(`otp-${index + 1}`);
      if (nextInput) nextInput.focus();
    }
  };

  const handleOtpKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      const prevInput = document.getElementById(`otp-${index - 1}`);
      if (prevInput) prevInput.focus();
    }
  };

  const handleOtpPaste = (e) => {
    e.preventDefault();
    const paste = e.clipboardData.getData('text');
    const pasteArray = paste.split('').slice(0, 6);
    const next = [...otp];
    pasteArray.forEach((char, index) => {
      if (index < 6 && /^\d$/.test(char)) next[index] = char;
    });
    setOtp(next);
  };

  const handleVerifyOtp = async () => {
    const otpString = otp.join('');
    if (otpString.length !== 6) {
      setMessage('Please enter complete OTP');
      return;
    }
    setLoading(true);
    setMessage('');
    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/verify-register-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: currentEmail, otp: otpString }),
      });
      const data = await response.json();
      if (response.ok) {
        let sessionUser = data.user;
        let sessionToken = data.token;
        if (!sessionUser || !sessionToken) {
          const loginResponse = await postAuthLogin(currentEmail, form.password);
          const loginData = await loginResponse.json();
          if (loginResponse.ok) {
            sessionUser = loginData.user;
            sessionToken = loginData.token;
          }
        }
        localStorage.removeItem('referralCode');
        setForm({ ...emptyForm });
        setIsOtpStep(false);
        setOtp(['', '', '', '', '', '']);
        setOtpExpired(false);
        setCurrentEmail('');
        if (sessionUser && sessionToken) {
          if (sessionUser.role !== apiRole) {
            setMessage(roleMismatchMessage(apiRole));
          } else {
            try {
              await login(sessionUser, sessionToken);
            } catch (sessionErr) {
              console.error(sessionErr);
            }
            setMessage('Registration successful!');
            navigate(dashboardPathForRole(sessionUser.role));
          }
        } else {
          setMessage('Registration successful!');
          navigate(loginPathForRole(role));
        }
      } else {
        const errorMessage = apiErrorMessage(data, 'OTP verification failed');
        setOtpExpired(String(errorMessage).toLowerCase().includes('expired'));
        setMessage(errorMessage);
      }
    } catch (error) {
      setMessage('Network error. Please try again.');
    }
    setLoading(false);
  };

  const handleResendOtp = async () => {
    if (resendCount >= 5) {
      setMessage('Maximum resend attempts reached');
      return;
    }
    setLoading(true);
    setMessage('');
    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/resend-register-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: currentEmail }),
      });
      const data = await response.json();
      if (response.ok) {
        setResendCount((prev) => prev + 1);
        setOtpTimer(60);
        setOtpExpired(false);
        setOtpSentVia(data.sentVia || otpSentVia);
        setMessage(`OTP resent to ${otpDeliveryTarget(data.sentVia || otpSentVia)}`);
      } else {
        setMessage(apiErrorMessage(data, 'Failed to resend OTP'));
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
        body: JSON.stringify({ token: idToken, role: apiRole, mode: 'register' }),
      });
      const data = await response.json();
      if (response.ok) {
        if (data.user?.role && data.user.role !== apiRole) {
          setMessage(roleMismatchMessage(apiRole));
          return;
        }
        await login(data.user, data.token);
        setMessage('Login successful!');
        navigate(dashboardPathForRole(data.user?.role || apiRole));
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
        {!isOtpStep ? (
          <>
            <h2
              className="footer-modal-heading"
              style={{ textAlign: 'center', marginTop: '0', paddingTop: '0', marginBottom: '18px' }}
            >
              {isEmployer ? 'Employer Registration' : 'User Registration'}
            </h2>
            <form className="footer-modal-form" onSubmit={handleRegister} autoComplete="off">
              <input
                type="text"
                placeholder="Full Name"
                value={form.fullName}
                onChange={(e) => setForm({ ...form, fullName: e.target.value })}
                required
              />
              <input
                type="email"
                placeholder="Email Address"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                required
              />
              <input
                type="tel"
                placeholder="Phone Number"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
              />
              <input
                type="password"
                placeholder="Password"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                required
              />
              <input
                type="password"
                placeholder="Confirm Password"
                value={form.confirmPassword}
                onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
                required
              />
              {!isEmployer && (
                <RegistrationCategoryFields
                  required
                  className="footer-modal-form"
                  value={{ categoryId: form.categoryId, subcategoryId: form.subcategoryId }}
                  onChange={({ categoryId, subcategoryId }) =>
                    setForm({ ...form, categoryId, subcategoryId })
                  }
                />
              )}
              <button type="submit" className="footer-modal-submit" disabled={loading}>
                {loading ? 'Sending OTP...' : 'Register'}
              </button>
            </form>
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
            <div className="auth-switch-line">
              <span>Already have an account? </span>
              <Link to={loginPathForRole(role)}>Login</Link>
            </div>
            <div className="auth-switch-line">
              {isEmployer ? (
                <>
                  <span>Want to register as a user? </span>
                  <Link to={registerPathForRole('jobseeker')}>Click Here</Link>
                </>
              ) : (
                <>
                  <span>Want to register as an employer? </span>
                  <Link to={registerPathForRole('employer')}>Click Here</Link>
                </>
              )}
            </div>
          </>
        ) : (
          <>
            <h2
              className="footer-modal-heading"
              style={{ textAlign: 'center', marginTop: '0', paddingTop: '0', marginBottom: '18px' }}
            >
              Verify Your Email
            </h2>
            <p style={{ textAlign: 'center', marginBottom: '20px', color: '#64748b' }}>
              OTP sent to {otpDeliveryTarget(otpSentVia)}
            </p>
            <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', marginBottom: '20px' }}>
              {otp.map((digit, index) => (
                <input
                  key={index}
                  id={`otp-${index}`}
                  type="text"
                  value={digit}
                  onChange={(e) => handleOtpChange(index, e.target.value.replace(/\D/g, ''))}
                  onKeyDown={(e) => handleOtpKeyDown(index, e)}
                  onPaste={handleOtpPaste}
                  maxLength="1"
                  className="auth-otp-input"
                  autoFocus={index === 0}
                />
              ))}
            </div>
            <div style={{ textAlign: 'center', marginBottom: '15px' }}>
              {otpTimer > 0 ? (
                <span style={{ color: '#64748b' }}>Resend OTP in {otpTimer}s</span>
              ) : otpExpired ? (
                <span style={{ color: '#dc2626' }}>OTP expired</span>
              ) : (
                <span style={{ color: '#64748b' }}>Resend OTP available</span>
              )}
            </div>
            <button
              type="button"
              className="footer-modal-submit"
              disabled={loading || otp.some((d) => !d)}
              onClick={handleVerifyOtp}
              style={{ marginBottom: '10px' }}
            >
              {loading ? 'Verifying...' : 'Verify & Register'}
            </button>
            <div style={{ textAlign: 'center', marginBottom: '10px' }}>
              <button
                type="button"
                onClick={handleResendOtp}
                disabled={loading || resendCount >= 5 || otpTimer > 0}
                className="footer-modal-link"
                style={{
                  color: resendCount >= 5 ? '#dc2626' : '#2563eb',
                  cursor: resendCount >= 5 || otpTimer > 0 ? 'not-allowed' : 'pointer',
                }}
              >
                {resendCount >= 5
                  ? 'Resend OTP (limit reached)'
                  : `Resend OTP${resendCount > 0 ? ` (${5 - resendCount} attempts left)` : ''}`}
              </button>
            </div>
            <div style={{ textAlign: 'center' }}>
              <button
                type="button"
                onClick={() => {
                  setIsOtpStep(false);
                  setOtp(['', '', '', '', '', '']);
                  setOtpTimer(60);
                  setOtpExpired(false);
                  setResendCount(0);
                  setMessage('');
                }}
                className="footer-modal-link"
                style={{ color: '#64748b' }}
              >
                Back to Registration
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default RegisterForm;
