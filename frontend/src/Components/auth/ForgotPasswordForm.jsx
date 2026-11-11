import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { API_BASE_URL } from '../../config/api';
import {
  isAuthSuccessMessage,
  loginPathForRole,
  otpDeliveryTarget,
} from './authUtils';
import './authForms.css';

function ForgotPasswordForm({ role = 'jobseeker' }) {
  const navigate = useNavigate();
  const loginPath = loginPathForRole(role);

  const [step, setStep] = useState(1);
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [otpTimer, setOtpTimer] = useState(60);
  const [otpExpired, setOtpExpired] = useState(false);
  const [otpSentVia, setOtpSentVia] = useState('email');
  const [resendCount, setResendCount] = useState(0);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    let interval;
    if (step === 2 && otpTimer > 0) {
      interval = setInterval(() => setOtpTimer((prev) => prev - 1), 1000);
    }
    return () => clearInterval(interval);
  }, [step, otpTimer]);

  const handleSendOTP = async () => {
    if (!email) {
      setMessage('Please enter your email');
      return;
    }
    setLoading(true);
    setMessage('');
    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await response.json();
      if (response.ok) {
        setStep(2);
        setOtpTimer(60);
        setOtpExpired(false);
        setOtpSentVia(data.sentVia || 'email');
        setResendCount(0);
        setMessage(data.message || `OTP sent to ${otpDeliveryTarget(data.sentVia)}`);
      } else {
        setMessage(data?.message || 'Failed to send OTP');
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
      const nextInput = document.getElementById(`forgot-otp-${index + 1}`);
      if (nextInput) nextInput.focus();
    }
  };

  const handleOtpKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      const prevInput = document.getElementById(`forgot-otp-${index - 1}`);
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
      const response = await fetch(`${API_BASE_URL}/api/auth/verify-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, otp: otpString }),
      });
      const data = await response.json();
      if (response.ok) {
        setStep(3);
        setMessage('OTP verified successfully');
      } else {
        const errorMessage = data?.message || 'OTP verification failed';
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
      const response = await fetch(`${API_BASE_URL}/api/auth/resend-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await response.json();
      if (response.ok) {
        setResendCount((prev) => prev + 1);
        setOtpTimer(60);
        setOtpExpired(false);
        setOtpSentVia(data.sentVia || otpSentVia);
        setMessage(`OTP resent to ${otpDeliveryTarget(data.sentVia || otpSentVia)}`);
      } else {
        setMessage(data?.message || 'Failed to resend OTP');
      }
    } catch (error) {
      setMessage('Network error. Please try again.');
    }
    setLoading(false);
  };

  const handleResetPassword = async () => {
    if (!newPassword || !confirmPassword) {
      setMessage('Please fill all fields');
      return;
    }
    if (newPassword !== confirmPassword) {
      setMessage('Passwords do not match');
      return;
    }
    if (newPassword.length < 6) {
      setMessage('Password must be at least 6 characters');
      return;
    }
    setLoading(true);
    setMessage('');
    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, newPassword, confirmPassword }),
      });
      const data = await response.json();
      if (response.ok) {
        setMessage('Password reset successfully');
        setTimeout(() => navigate(loginPath), 2000);
      } else {
        setMessage(data?.message || 'Failed to reset password');
      }
    } catch (error) {
      setMessage('Network error. Please try again.');
    }
    setLoading(false);
  };

  return (
    <div className="footer-modal-minimalist">
      {message && (
        <div
          className={`alert ${isAuthSuccessMessage(message) ? 'alert-success' : 'alert-danger'}`}
          style={{ margin: '16px 24px 0' }}
        >
          {message}
        </div>
      )}
      <div className="footer-modal-forms">
        <h2 className="footer-modal-heading" style={{ textAlign: 'center' }}>
          Forgot Password
        </h2>
        {step === 1 && (
          <div className="footer-modal-form">
            <p style={{ marginBottom: '20px', textAlign: 'center' }}>
              Enter your email address to reset your password
            </p>
            <input
              type="email"
              placeholder="Email Address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <button type="button" className="footer-modal-submit" onClick={handleSendOTP} disabled={loading}>
              {loading ? 'Sending...' : 'Send OTP'}
            </button>
          </div>
        )}
        {step === 2 && (
          <div className="footer-modal-form">
            <p style={{ marginBottom: '20px', textAlign: 'center' }}>
              Enter the 6-digit OTP sent to {otpDeliveryTarget(otpSentVia)}
            </p>
            <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', marginBottom: '20px' }}>
              {otp.map((digit, index) => (
                <input
                  key={index}
                  id={`forgot-otp-${index}`}
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
                <span>Resend OTP in {otpTimer}s</span>
              ) : otpExpired ? (
                <span style={{ color: 'red' }}>OTP expired</span>
              ) : (
                <span>Resend OTP available</span>
              )}
            </div>
            <button
              type="button"
              className="footer-modal-submit"
              onClick={handleVerifyOtp}
              disabled={loading || otp.some((d) => !d)}
            >
              {loading ? 'Verifying...' : 'Verify OTP'}
            </button>
            <button
              type="button"
              className="footer-modal-link"
              onClick={handleResendOtp}
              disabled={loading || resendCount >= 5 || otpTimer > 0}
            >
              {resendCount >= 5
                ? 'Resend limit reached'
                : `Resend OTP${resendCount > 0 ? ` (${5 - resendCount} left)` : ''}`}
            </button>
          </div>
        )}
        {step === 3 && (
          <div className="footer-modal-form">
            <p style={{ marginBottom: '20px', textAlign: 'center' }}>Enter your new password</p>
            <input
              type="password"
              placeholder="New Password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
            />
            <input
              type="password"
              placeholder="Confirm New Password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
            />
            <button type="button" className="footer-modal-submit" onClick={handleResetPassword} disabled={loading}>
              {loading ? 'Updating...' : 'Update Password'}
            </button>
          </div>
        )}
        <div style={{ textAlign: 'center', marginTop: '14px' }}>
          <Link to={loginPath} className="footer-modal-link">
            Back to Login
          </Link>
        </div>
      </div>
    </div>
  );
}

export default ForgotPasswordForm;
