import React, { useState, useEffect } from 'react';
import OTPInput from './OTPInput';
import { API_BASE_URL } from '../config/api';

const ForgotPasswordModal = ({ isOpen, onClose, role }) => {
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [otpTimer, setOtpTimer] = useState(60);
  const [resendCount, setResendCount] = useState(0);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  // Reset modal when opened/closed
  useEffect(() => {
    if (isOpen) {
      setStep(1);
      setEmail('');
      setOtp(['', '', '', '', '', '']);
      setOtpTimer(60);
      setResendCount(0);
      setNewPassword('');
      setConfirmPassword('');
      setLoading(false);
      setMessage('');
    }
  }, [isOpen]);

  // OTP timer effect
  useEffect(() => {
    let interval;
    if (step === 2 && otpTimer > 0) {
      interval = setInterval(() => {
        setOtpTimer(prev => prev - 1);
      }, 1000);
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
        body: JSON.stringify({ email })
      });

      const data = await response.json();

      if (response.ok) {
        setStep(2);
        setOtpTimer(60);
        setResendCount(0);
        setMessage('OTP sent to your email');
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
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    // Auto focus next input
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
    const newOtp = [...otp];
    pasteArray.forEach((char, index) => {
      if (index < 6 && /^\d$/.test(char)) {
        newOtp[index] = char;
      }
    });
    setOtp(newOtp);
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
        body: JSON.stringify({ email, otp: otpString })
      });

      const data = await response.json();

      if (response.ok) {
        setStep(3);
        setMessage('OTP verified successfully');
      } else {
        setMessage(data?.message || 'OTP verification failed');
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
        body: JSON.stringify({ email })
      });

      const data = await response.json();

      if (response.ok) {
        setResendCount(prev => prev + 1);
        setOtpTimer(60);
        setMessage('OTP resent to your email');
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
        body: JSON.stringify({ email, newPassword, confirmPassword })
      });

      const data = await response.json();

      if (response.ok) {
        setMessage('Password reset successfully');
        setTimeout(() => {
          onClose();
        }, 2000);
      } else {
        setMessage(data?.message || 'Failed to reset password');
      }
    } catch (error) {
      setMessage('Network error. Please try again.');
    }
    setLoading(false);
  };

  if (!isOpen) return null;

  return (
    <div
      className="modal fade show"
      style={{ display: 'block', backgroundColor: 'rgba(0,0,0,0.5)' }}
      onClick={onClose}
    >
      <div className="modal-dialog modal-dialog-centered" style={{ maxWidth: '400px' }} onClick={e => e.stopPropagation()}>
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title">Forgot Password</h5>
            <button type="button" className="close" onClick={onClose}>
              <span>&times;</span>
            </button>
          </div>
          <div className="modal-body">
            {message && (
              <div className={`alert ${message.includes('success') ? 'alert-success' : 'alert-danger'}`} style={{ marginBottom: '15px' }}>
                {message}
              </div>
            )}

            {step === 1 && (
              <div>
                <p style={{ marginBottom: '20px', textAlign: 'center' }}>Enter your email address to reset your password</p>
                <input
                  type="email"
                  placeholder="Email Address"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: '1px solid #ddd',
                    borderRadius: '5px',
                    marginBottom: '15px',
                    fontSize: '16px'
                  }}
                  required
                />
                <button
                  type="button"
                  onClick={handleSendOTP}
                  disabled={loading}
                  style={{
                    width: '100%',
                    padding: '12px',
                    backgroundColor: '#007bff',
                    color: 'white',
                    border: 'none',
                    borderRadius: '5px',
                    fontSize: '16px',
                    cursor: loading ? 'not-allowed' : 'pointer'
                  }}
                >
                  {loading ? 'Sending...' : 'Send OTP'}
                </button>
              </div>
            )}

            {step === 2 && (
              <div>
                <p style={{ marginBottom: '20px', textAlign: 'center' }}>Enter the 6-digit OTP sent to your email</p>
                <OTPInput
                  otp={otp}
                  onChange={handleOtpChange}
                  onKeyDown={handleOtpKeyDown}
                  onPaste={handleOtpPaste}
                />
                <div style={{ textAlign: 'center', marginBottom: '15px' }}>
                  {otpTimer > 0 ? (
                    <span>Resend OTP in {otpTimer}s</span>
                  ) : (
                    <span style={{ color: 'red' }}>OTP expired</span>
                  )}
                </div>
                <button
                  type="button"
                  onClick={handleVerifyOtp}
                  disabled={loading || otp.some(d => !d)}
                  style={{
                    width: '100%',
                    padding: '12px',
                    backgroundColor: '#28a745',
                    color: 'white',
                    border: 'none',
                    borderRadius: '5px',
                    fontSize: '16px',
                    marginBottom: '10px',
                    cursor: loading || otp.some(d => !d) ? 'not-allowed' : 'pointer'
                  }}
                >
                  {loading ? 'Verifying...' : 'Verify OTP'}
                </button>
                <div style={{ textAlign: 'center' }}>
                  <button
                    type="button"
                    onClick={handleResendOtp}
                    disabled={loading || resendCount >= 5 || otpTimer > 0}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: resendCount >= 5 ? '#dc3545' : '#007bff',
                      textDecoration: 'underline',
                      cursor: resendCount >= 5 || otpTimer > 0 ? 'not-allowed' : 'pointer'
                    }}
                  >
                    {resendCount >= 5 ? 'Resend limit reached' : `Resend OTP${resendCount > 0 ? ` (${5 - resendCount} left)` : ''}`}
                  </button>
                </div>
              </div>
            )}

            {step === 3 && (
              <div>
                <p style={{ marginBottom: '20px', textAlign: 'center' }}>Enter your new password</p>
                <input
                  type="password"
                  placeholder="New Password"
                  value={newPassword}
                  onChange={e => setNewPassword(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: '1px solid #ddd',
                    borderRadius: '5px',
                    marginBottom: '15px',
                    fontSize: '16px'
                  }}
                  required
                />
                <input
                  type="password"
                  placeholder="Confirm Password"
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: '1px solid #ddd',
                    borderRadius: '5px',
                    marginBottom: '15px',
                    fontSize: '16px'
                  }}
                  required
                />
                <button
                  type="button"
                  onClick={handleResetPassword}
                  disabled={loading}
                  style={{
                    width: '100%',
                    padding: '12px',
                    backgroundColor: '#28a745',
                    color: 'white',
                    border: 'none',
                    borderRadius: '5px',
                    fontSize: '16px',
                    cursor: loading ? 'not-allowed' : 'pointer'
                  }}
                >
                  {loading ? 'Updating...' : 'Update Password'}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ForgotPasswordModal;