import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import "./Footer.css";
import { API_BASE_URL } from "../config/api";
import RegistrationCategoryFields from "./RegistrationCategoryFields";
import { GoogleAuthProvider, signInWithPopup } from "firebase/auth";
import { auth as firebaseAuth, missingKeys as firebaseMissingKeys } from "../config/firebaseClient";

// Send the address exactly as typed (only surrounding spaces removed) so it is
// stored unmodified; the backend normalizes it internally for OTP lookups.
function registrationEmailInput(email) {
  return String(email || '').trim();
}

// Backend returns either { message } or express-validator's { errors: [{ msg }] }.
function apiErrorMessage(data, fallback) {
  return (
    data?.message ||
    (Array.isArray(data?.errors) && data.errors[0]?.msg) ||
    fallback
  );
}

function otpDeliveryTarget(sentVia) {
  let via = sentVia;
  if (Array.isArray(sentVia)) {
    const hasEmail = sentVia.includes('email');
    const hasSms = sentVia.includes('sms');
    via = hasEmail && hasSms ? 'both' : hasSms ? 'sms' : 'email';
  }
  if (via === 'sms') return 'your phone';
  if (via === 'both') return 'your email and phone';
  return 'your email';
}

function Footer() {
  // Track which registration type to show: 'seeker' or 'provider'
  const [registerType, setRegisterType] = useState('seeker');
  const navigate = useNavigate();
  const { login } = useAuth();


  // Registration states
  const [seekerForm, setSeekerForm] = useState({
    fullName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    categoryId: '',
    subcategoryId: ''
  });

  const [providerForm, setProviderForm] = useState({
    fullName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    categoryId: '',
    subcategoryId: ''
  });

  // OTP states
  const [isOtpStep, setIsOtpStep] = useState(false);
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [otpTimer, setOtpTimer] = useState(60);
  const [otpExpired, setOtpExpired] = useState(false);
  const [otpSentVia, setOtpSentVia] = useState('email');
  const [resendCount, setResendCount] = useState(0);
  const [currentEmail, setCurrentEmail] = useState('');
  const [currentRole, setCurrentRole] = useState('');

  // OTP timer effect
  React.useEffect(() => {
    let interval;
    if (isOtpStep && otpTimer > 0) {
      interval = setInterval(() => {
        setOtpTimer(prev => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isOtpStep, otpTimer]);

  // Login states
  const [signinPanel, setSigninPanel] = useState('seeker');
  const [seekerLogin, setSeekerLogin] = useState({
    email: '',
    password: ''
  });

  const [providerLogin, setProviderLogin] = useState({
    email: '',
    password: ''
  });

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const messageTimerRef = React.useRef(null);

  const isFooterSuccessMessage = (text) => {
    const t = String(text || '').toLowerCase();
    if (!t) return false;
    if (
      t.includes('not found') ||
      t.includes('incorrect') ||
      t.includes('failed') ||
      t.includes('error') ||
      t.includes('do not match') ||
      t.includes('at least') ||
      t.includes('maximum resend') ||
      t.includes('missing:')
    ) {
      return false;
    }
    return (
      t.includes('success') ||
      t.includes('otp sent') ||
      t.includes('otp resent') ||
      t.includes('verified') ||
      (t.includes('otp') && t.includes('sent'))
    );
  };

  React.useEffect(() => {
    if (!message) return undefined;
    if (messageTimerRef.current) {
      clearTimeout(messageTimerRef.current);
    }
    const hideMs = isFooterSuccessMessage(message) ? 3000 : 4000;
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

  // Forgot password states
  const [forgotModalOpen, setForgotModalOpen] = useState(false);
  const [forgotStep, setForgotStep] = useState(1);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotOtp, setForgotOtp] = useState(['', '', '', '', '', '']);
  const [forgotOtpTimer, setForgotOtpTimer] = useState(60);
  const [forgotOtpExpired, setForgotOtpExpired] = useState(false);
  const [forgotOtpSentVia, setForgotOtpSentVia] = useState('email');
  const [forgotResendCount, setForgotResendCount] = useState(0);
  const [forgotNewPassword, setForgotNewPassword] = useState('');
  const [forgotConfirmPassword, setForgotConfirmPassword] = useState('');
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotMessage, setForgotMessage] = useState('');

  // Forgot password timer effect
  React.useEffect(() => {
    let interval;
    if (forgotModalOpen && forgotStep === 2 && forgotOtpTimer > 0) {
      interval = setInterval(() => {
        setForgotOtpTimer(prev => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [forgotModalOpen, forgotStep, forgotOtpTimer]);

  // Forgot password modal effect (we render our own overlay)
  React.useEffect(() => {
    if (forgotModalOpen) {
      document.body.classList.add('modal-open');
    } else {
      document.body.classList.remove('modal-open');
    }
  }, [forgotModalOpen]);

  const skipNextSigninResetRef = React.useRef(false);
  const skipNextRegisterResetRef = React.useRef(false);

  const resetSigninModalView = React.useCallback(() => {
    setSigninPanel('seeker');
    setForgotModalOpen(false);
    setForgotStep(1);
    setForgotEmail('');
    setForgotOtp(['', '', '', '', '', '']);
    setForgotOtpTimer(60);
    setForgotOtpExpired(false);
    setForgotResendCount(0);
    setForgotNewPassword('');
    setForgotConfirmPassword('');
    setForgotLoading(false);
    setForgotMessage('');
  }, []);

  const resetRegisterModalView = React.useCallback(() => {
    setRegisterType('seeker');
    setIsOtpStep(false);
    setOtp(['', '', '', '', '', '']);
    setOtpTimer(60);
    setOtpExpired(false);
    setResendCount(0);
    setMessage('');
  }, []);

  const openEmployerSigninView = React.useCallback(() => {
    skipNextSigninResetRef.current = true;
    setSigninPanel('provider');
    setForgotModalOpen(false);
    setForgotStep(1);
    setForgotEmail('');
    setForgotOtp(['', '', '', '', '', '']);
    setForgotOtpTimer(60);
    setForgotOtpExpired(false);
    setForgotResendCount(0);
    setForgotNewPassword('');
    setForgotConfirmPassword('');
    setForgotLoading(false);
    setForgotMessage('');
  }, []);

  const openEmployerRegisterView = React.useCallback(() => {
    skipNextRegisterResetRef.current = true;
    setRegisterType('provider');
    setIsOtpStep(false);
    setOtp(['', '', '', '', '', '']);
    setOtpTimer(60);
    setResendCount(0);
    setMessage('');
  }, []);

  React.useEffect(() => {
    const signinEl = document.getElementById('signin');
    const registerEl = document.getElementById('register');

    const handleSigninShown = () => {
      if (skipNextSigninResetRef.current) {
        skipNextSigninResetRef.current = false;
        setSigninPanel('provider');
        setForgotModalOpen(false);
        return;
      }
      resetSigninModalView();
    };
    const handleDefaultSigninOpen = () => resetSigninModalView();

    const handleRegisterShown = () => {
      if (skipNextRegisterResetRef.current) {
        skipNextRegisterResetRef.current = false;
        setRegisterType('provider');
        return;
      }
      resetRegisterModalView();
    };
    const handleDefaultRegisterOpen = () => resetRegisterModalView();

    if (signinEl) {
      signinEl.addEventListener('show.bs.modal', handleSigninShown);
    }
    if (registerEl) {
      registerEl.addEventListener('show.bs.modal', handleRegisterShown);
    }
    window.addEventListener('uptula:open-default-signin', handleDefaultSigninOpen);
    window.addEventListener('uptula:open-employer-signin', openEmployerSigninView);
    window.addEventListener('uptula:open-default-register', handleDefaultRegisterOpen);
    window.addEventListener('uptula:open-employer-register', openEmployerRegisterView);

    return () => {
      if (signinEl) {
        signinEl.removeEventListener('show.bs.modal', handleSigninShown);
      }
      if (registerEl) {
        registerEl.removeEventListener('show.bs.modal', handleRegisterShown);
      }
      window.removeEventListener('uptula:open-default-signin', handleDefaultSigninOpen);
      window.removeEventListener('uptula:open-employer-signin', openEmployerSigninView);
      window.removeEventListener('uptula:open-default-register', handleDefaultRegisterOpen);
      window.removeEventListener('uptula:open-employer-register', openEmployerRegisterView);
    };
  }, [resetSigninModalView, resetRegisterModalView, openEmployerSigninView, openEmployerRegisterView]);

  const closeModalById = (modalId) => {
    const el = document.getElementById(modalId);
    if (el) {
      el.classList.remove('in');
      el.style.display = 'none';
    }
    document.body.classList.remove('modal-open');
    const backdrops = document.querySelectorAll('.modal-backdrop');
    backdrops.forEach((b) => b.parentNode && b.parentNode.removeChild(b));
  };

  const handleScrollToTop = (e) => {
    if (e) e.preventDefault();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // `mode` tells the backend whether an account may be created: the Register
  // modals pass 'register', the Sign in modals pass 'login' and get an error
  // when the Google email has no account yet.
  const handleGoogleAuth = async (role, modalId, mode) => {
    setLoading(true);
    setMessage('');

    try {
      if (!firebaseAuth) {
        const missing = Array.isArray(firebaseMissingKeys) && firebaseMissingKeys.length ? firebaseMissingKeys.join(', ') : 'Firebase config';
        setMessage(`Google login is not configured. Missing: ${missing}.`);
        return;
      }

      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(firebaseAuth, provider);
      const idToken = await result.user.getIdToken();
      // console.log("🔥 FIREBASE TOKEN:", idToken);
      const response = await fetch(`${API_BASE_URL}/api/auth/firebase`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: idToken, role, mode })
      });

      const data = await response.json();

      if (response.ok) {
        login(data.user, data.token);
        closeModalById(modalId);

        if (data.user?.role === 'provider') navigate('/employer/profile');
        else navigate('/profile');

        setMessage('Login successful!');
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

  // Registration handlers
  const handleSeekerRegister = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    if (seekerForm.password !== seekerForm.confirmPassword) {
      setMessage('Passwords do not match');
      setLoading(false);
      return;
    }

    if (seekerForm.password.length < 6) {
      setMessage('Password must be at least 6 characters');
      setLoading(false);
      return;
    }

    if (!seekerForm.categoryId || !seekerForm.subcategoryId) {
      setMessage('Please select a category and subcategory');
      setLoading(false);
      return;
    }

    try {
      const registrationEmail = registrationEmailInput(seekerForm.email);
      const payload = {
        role: 'seeker',
        fullName: seekerForm.fullName,
        email: registrationEmail,
        phone: seekerForm.phone,
        password: seekerForm.password,
        categoryId: Number(seekerForm.categoryId),
        subcategoryId: Number(seekerForm.subcategoryId)
      };
      const storedReferralCode = localStorage.getItem('referralCode');
      if (storedReferralCode) {
        payload.referralCode = storedReferralCode;
      }

      const response = await fetch(`${API_BASE_URL}/api/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload)
      });

      const data = await response.json();

      if (response.ok) {
        setCurrentEmail(registrationEmail);
        setCurrentRole('seeker');
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

  const handleProviderRegister = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    if (providerForm.password !== providerForm.confirmPassword) {
      setMessage('Passwords do not match');
      setLoading(false);
      return;
    }

    if (providerForm.password.length < 6) {
      setMessage('Password must be at least 6 characters');
      setLoading(false);
      return;
    }

    try {
      const registrationEmail = registrationEmailInput(providerForm.email);
      const payload = {
        role: 'provider',
        fullName: providerForm.fullName,
        email: registrationEmail,
        phone: providerForm.phone,
        password: providerForm.password,
      };
      const storedReferralCode = localStorage.getItem('referralCode');
      if (storedReferralCode) {
        payload.referralCode = storedReferralCode;
      }

      const response = await fetch(`${API_BASE_URL}/api/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload)
      });

      const data = await response.json();

      if (response.ok) {
        setCurrentEmail(registrationEmail);
        setCurrentRole('provider');
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

  // OTP handlers
  const handleOtpChange = (index, value) => {
    if (value.length > 1) return; // Only allow single digit
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
      const response = await fetch(`${API_BASE_URL}/api/auth/verify-register-otp`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: currentEmail,
          otp: otpString
        })
      });

      const data = await response.json();

      if (response.ok) {
        let sessionUser = data.user;
        let sessionToken = data.token;

        if (!sessionUser || !sessionToken) {
          const loginRole = currentRole === 'provider' || registerType === 'provider' ? 'provider' : 'seeker';
          const loginResponse = await postAuthLogin(
            currentEmail,
            loginRole === 'provider' ? providerForm.password : seekerForm.password,
            loginRole
          );
          const loginData = await loginResponse.json();
          if (loginResponse.ok) {
            sessionUser = loginData.user;
            sessionToken = loginData.token;
          }
        }

        localStorage.removeItem('referralCode');

        const registerModal = document.getElementById('register');
        if (registerModal) {
          registerModal.classList.remove('in');
          registerModal.style.display = 'none';
        }
        document.body.classList.remove('modal-open');
        const backdrops = document.querySelectorAll('.modal-backdrop');
        backdrops.forEach((el) => el.parentNode && el.parentNode.removeChild(el));

        setSeekerForm({
          fullName: '',
          email: '',
          phone: '',
          password: '',
          confirmPassword: '',
          categoryId: '',
          subcategoryId: ''
        });
        setProviderForm({
          fullName: '',
          email: '',
          phone: '',
          password: '',
          confirmPassword: '',
          categoryId: '',
          subcategoryId: ''
        });
        setIsOtpStep(false);
        setOtp(['', '', '', '', '', '']);
        setOtpExpired(false);
        setCurrentEmail('');
        setCurrentRole('');

        if (sessionUser && sessionToken) {
          try {
            await login(sessionUser, sessionToken);
          } catch (sessionErr) {
            console.error(sessionErr);
          }
        }

        setMessage('Registration successful!');
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
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: currentEmail
        })
      });

      const data = await response.json();

      if (response.ok) {
        setResendCount(prev => prev + 1);
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

  const handleBackToRegister = () => {
    setIsOtpStep(false);
    setOtp(['', '', '', '', '', '']);
    setOtpTimer(60);
    setOtpExpired(false);
    setResendCount(0);
    setMessage('');
  };

  // Login handlers
  const postAuthLogin = (loginEmail, loginPassword, loginRole) => {
    const role = loginRole === 'provider' ? 'provider' : 'seeker';
    return fetch(`${API_BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: String(loginEmail || '').trim(),
        password: String(loginPassword || ''),
        role,
      }),
    });
  };

  const handleSeekerLogin = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    const form = e.currentTarget;
    const formData = form && form.elements ? new FormData(form) : null;
    const email = String(formData?.get('loginId') || seekerLogin.email || '').trim();
    const password = String(formData?.get('loginPassword') || seekerLogin.password || '');
    setLoading(true);
    setMessage('');

    try {
      const response = await postAuthLogin(email, password, 'seeker');

      const data = await response.json();

      if (response.ok) {
        login(data.user, data.token);
        setMessage('Login successful!');
        // Close modal & remove backdrop
        const signinEl = document.getElementById('signin');
        if (signinEl) {
          signinEl.classList.remove('in');
          signinEl.style.display = 'none';
        }
        document.body.classList.remove('modal-open');
        const backdrops = document.querySelectorAll('.modal-backdrop');
        backdrops.forEach((el) => el.parentNode && el.parentNode.removeChild(el));
        // Navigate to candidate profile
        navigate('/profile');
      } else {
        setMessage(apiErrorMessage(data, 'Login failed'));
      }
    } catch (error) {
      setMessage('Network error. Please try again.');
    }
    setLoading(false);
  };

  const handleProviderLogin = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    const form = e.currentTarget;
    const formData = form && form.elements ? new FormData(form) : null;
    const email = String(formData?.get('loginId') || providerLogin.email || '').trim();
    const password = String(formData?.get('loginPassword') || providerLogin.password || '');
    setLoading(true);
    setMessage('');

    try {
      const response = await postAuthLogin(email, password, 'provider');

      const data = await response.json();

      if (response.ok) {
        login(data.user, data.token);
        setMessage('Login successful!');
        // Close modal & remove backdrop
        const signinEl2 = document.getElementById('signin');
        if (signinEl2) {
          signinEl2.classList.remove('in');
          signinEl2.style.display = 'none';
        }
        document.body.classList.remove('modal-open');
        const backdrops2 = document.querySelectorAll('.modal-backdrop');
        backdrops2.forEach((el) => el.parentNode && el.parentNode.removeChild(el));
        // Navigate to employer profile
        navigate('/employer/profile');
      } else {
        setMessage(apiErrorMessage(data, 'Login failed'));
      }
    } catch (error) {
      setMessage('Network error. Please try again.');
    }
    setLoading(false);
  };

  // Forgot password handlers
  const handleForgotSendOTP = async () => {
    if (!forgotEmail) {
      setForgotMessage('Please enter your email');
      return;
    }

    setForgotLoading(true);
    setForgotMessage('');

    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: forgotEmail })
      });

      const data = await response.json();

      if (response.ok) {
        setForgotStep(2);
        setForgotOtpTimer(60);
        setForgotOtpExpired(false);
        setForgotOtpSentVia(data.sentVia || 'email');
        setForgotResendCount(0);
        setForgotMessage(data.message || `OTP sent to ${otpDeliveryTarget(data.sentVia)}`);
      } else {
        setForgotMessage(data?.message || 'Failed to send OTP');
      }
    } catch (error) {
      setForgotMessage('Network error. Please try again.');
    }
    setForgotLoading(false);
  };

  const handleForgotOtpChange = (index, value) => {
    if (value.length > 1) return;
    const newOtp = [...forgotOtp];
    newOtp[index] = value;
    setForgotOtp(newOtp);

    // Auto focus next input
    if (value && index < 5) {
      const nextInput = document.getElementById(`forgot-otp-${index + 1}`);
      if (nextInput) nextInput.focus();
    }
  };

  const handleForgotOtpKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !forgotOtp[index] && index > 0) {
      const prevInput = document.getElementById(`forgot-otp-${index - 1}`);
      if (prevInput) prevInput.focus();
    }
  };

  const handleForgotOtpPaste = (e) => {
    e.preventDefault();
    const paste = e.clipboardData.getData('text');
    const pasteArray = paste.split('').slice(0, 6);
    const newOtp = [...forgotOtp];
    pasteArray.forEach((char, index) => {
      if (index < 6 && /^\d$/.test(char)) {
        newOtp[index] = char;
      }
    });
    setForgotOtp(newOtp);
  };

  const handleForgotVerifyOtp = async () => {
    const otpString = forgotOtp.join('');
    if (otpString.length !== 6) {
      setForgotMessage('Please enter complete OTP');
      return;
    }

    setForgotLoading(true);
    setForgotMessage('');

    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/verify-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: forgotEmail, otp: otpString })
      });

      const data = await response.json();

      if (response.ok) {
        setForgotStep(3);
        setForgotMessage('OTP verified successfully');
      } else {
        const errorMessage = data?.message || 'OTP verification failed';
        setForgotOtpExpired(String(errorMessage).toLowerCase().includes('expired'));
        setForgotMessage(errorMessage);
      }
    } catch (error) {
      setForgotMessage('Network error. Please try again.');
    }
    setForgotLoading(false);
  };

  const handleForgotResendOtp = async () => {
    if (forgotResendCount >= 5) {
      setForgotMessage('Maximum resend attempts reached');
      return;
    }

    setForgotLoading(true);
    setForgotMessage('');

    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/resend-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: forgotEmail })
      });

      const data = await response.json();

      if (response.ok) {
        setForgotResendCount(prev => prev + 1);
        setForgotOtpTimer(60);
        setForgotOtpExpired(false);
        setForgotOtpSentVia(data.sentVia || forgotOtpSentVia);
        setForgotMessage(`OTP resent to ${otpDeliveryTarget(data.sentVia || forgotOtpSentVia)}`);
      } else {
        setForgotMessage(data?.message || 'Failed to resend OTP');
      }
    } catch (error) {
      setForgotMessage('Network error. Please try again.');
    }
    setForgotLoading(false);
  };

  const handleForgotResetPassword = async () => {
    if (!forgotNewPassword || !forgotConfirmPassword) {
      setForgotMessage('Please fill all fields');
      return;
    }

    if (forgotNewPassword !== forgotConfirmPassword) {
      setForgotMessage('Passwords do not match');
      return;
    }

    if (forgotNewPassword.length < 6) {
      setForgotMessage('Password must be at least 6 characters');
      return;
    }

    setForgotLoading(true);
    setForgotMessage('');

    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: forgotEmail, newPassword: forgotNewPassword, confirmPassword: forgotConfirmPassword })
      });

      const data = await response.json();

      if (response.ok) {
        setForgotMessage('Password reset successfully');
        setTimeout(() => {
          handleForgotClose();
        }, 2000);
      } else {
        setForgotMessage(data?.message || 'Failed to reset password');
      }
    } catch (error) {
      setForgotMessage('Network error. Please try again.');
    }
    setForgotLoading(false);
  };

  const handleForgotClose = () => {
    resetSigninModalView();
  };

  return (
    <>
      {/* Message Display */}
      {message && (
        <div
          className={`footer-toast ${isFooterSuccessMessage(message) ? 'footer-toast--success' : 'footer-toast--error'}`}
          role="alert"
        >
          {message}
        </div>
      )}

      <footer
        className="nk-footer"
        style={{
          backgroundImage: `url('/assets/img/city_bg.png')`,
          backgroundPosition: 'bottom center',
          backgroundRepeat: 'no-repeat',
          backgroundSize: 'cover',
          backgroundAttachment: 'scroll',
          marginTop: 0
        }}
      >
        <div className="nk-container">
          <div className="nk-row">
            {/* Left: Logo + Social */}
            <div className="nk-col-left">
              <Link to="/" className="nk-logo-link">
                <img src="/assets/img/Uptula.png" alt="Uptula Logo" className="nk-logo" />
              </Link>
              <h4>Connect with us</h4>
              <div className="nk-social">
                <a href="https://www.facebook.com/profile.php?id=61586820991880" target="_blank" rel="noopener noreferrer" aria-label="facebook">
                  <i className="fa fa-facebook" />
                </a>
                <a href="https://www.instagram.com/uptulajobportal" target="_blank" rel="noopener noreferrer" aria-label="instagram">
                  <i className="fa fa-instagram" />
                </a>
                <a href="https://www.linkedin.com/company/uptula-job-portal" target="_blank" rel="noopener noreferrer" aria-label="linkedin">
                  <i className="fa fa-linkedin" />
                </a>
              </div>
            </div>

            {/* Middle: Link columns */}
            <div className="nk-col-links">
              <div className="nk-link-block">
                <h5>Company</h5>
                <ul>
                  <li>
                    <Link to="/about-us">About us</Link>
                  </li>
                  <li>
                    <Link to="/careers">Careers</Link>
                  </li>
                  <li>
                    <Link to="/contact-us">Contact us</Link>
                  </li>
                  <li>
                    <Link to="/services">Services</Link>
                  </li>
                </ul>
              </div>
              <div className="nk-link-block">
                <h5>Job Seekers</h5>
                <ul>
                  <li>
                    <Link to="/jobs">Browse Jobs</Link>
                  </li>
                  <li>
                    <Link to="/Companies">Browse Companies</Link>
                  </li>
                  <li>
                    <Link to="/faq">FAQ</Link>
                  </li>
                </ul>
              </div>
              <div className="nk-link-block">
                <h5>Support</h5>
                <ul>
                  <li>
                    <Link to="/help-center">Help center</Link>
                  </li>
                  <li>
                    <Link to="/report-issue">Report issue</Link>
                  </li>
                  <li>
                    <Link to="/grievances">Grievances</Link>
                  </li>
                </ul>
              </div>
              <div className="nk-link-block">
                <h5>Legal &amp; Trust</h5>
                <ul>
                  <li>
                    <Link to="/privacy-policy">Privacy Policy</Link>
                  </li>
                  <li>
                    <Link to="/terms-conditions">Terms &amp; Conditions</Link>
                  </li>
                  <li>
                    <Link to="/fraud-alert">Fraud Alert</Link>
                  </li>
                  <li>
                    <Link to="/sitemap">Sitemap</Link>
                  </li>
                </ul>
              </div>
            </div>

            {/* Right: App badges */}
            <div className="nk-col-app">
              <div className="nk-app-box">
                <h4>Apply on the go</h4>
                <p className="nk-small">Get real-time job updates on our App</p>
                <div className="nk-app-buttons">
                  <a
                    href="https://play.google.com/store/apps/details?id=com.uptula"
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="google-play"
                  >
                    <img src="https://play.google.com/intl/en_us/badges/images/generic/en_badge_web_generic.png" alt="Get it on Google Play" className="nk-store-img" />
                  </a>
                  <a href="#" onClick={(e) => e.preventDefault()} aria-label="app-store">
                    <img src="https://developer.apple.com/assets/elements/badges/download-on-the-app-store.svg" alt="Download on the App Store" className="nk-store-img" />
                  </a>
                </div>
              </div>
            </div>
          </div>

          <div className="nk-row nk-footer-bottom">
            <div className="nk-col-full">
              <div className="nk-copyright text-center">
                <p>Copyright © 2026 All Rights Reserved.</p>
              </div>
            </div>
          </div>
        </div>
      </footer>

      {/* Signin Modal */}
      <div
        className="modal fade"
        id="signin"
        tabIndex={-1}
        role="dialog"
        aria-labelledby="signinModalLabel"
        aria-hidden="true"
      >
        <div className="modal-dialog">
          <div className="modal-content" id="signinModalLabel">
            <div className="modal-body">
              <div className="footer-modal-minimalist">
                <div className="footer-modal-forms">
                  {forgotModalOpen && (
                    <div id="forgot-inline-panel" style={{ display: 'block' }}>
                      <h2 className="footer-modal-heading" style={{ textAlign: 'center' }}>Forgot Password</h2>
                      {forgotMessage && (
                        <div className={`alert ${isFooterSuccessMessage(forgotMessage) ? 'alert-success' : 'alert-danger'}`} style={{ marginBottom: '15px' }}>
                          {forgotMessage}
                        </div>
                      )}
                      {forgotStep === 1 && (
                        <div className="footer-modal-form">
                          <p style={{ marginBottom: '20px', textAlign: 'center' }}>Enter your email address to reset your password</p>
                          <input type="email" placeholder="Email Address" value={forgotEmail} onChange={e => setForgotEmail(e.target.value)} required />
                          <button type="button" className="footer-modal-submit" onClick={handleForgotSendOTP} disabled={forgotLoading}>
                            {forgotLoading ? 'Sending...' : 'Send OTP'}
                          </button>
                        </div>
                      )}
                      {forgotStep === 2 && (
                        <div className="footer-modal-form">
                          <p style={{ marginBottom: '20px', textAlign: 'center' }}>Enter the 6-digit OTP sent to {otpDeliveryTarget(forgotOtpSentVia)}</p>
                          <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', marginBottom: '20px' }}>
                            {forgotOtp.map((digit, index) => (
                              <input key={index} id={`forgot-otp-${index}`} type="text" value={digit}
                                onChange={e => handleForgotOtpChange(index, e.target.value.replace(/\D/g, ''))}
                                onKeyDown={e => handleForgotOtpKeyDown(index, e)} onPaste={handleForgotOtpPaste} maxLength="1" autoFocus={index === 0}
                                style={{ width: '40px', height: '40px', textAlign: 'center', border: '1.5px solid #e5e7eb', borderRadius: '7px', fontSize: '18px', background: '#f8fafc' }} />
                            ))}
                          </div>
                          <div style={{ textAlign: 'center', marginBottom: '15px' }}>
                            {forgotOtpTimer > 0 ? <span>Resend OTP in {forgotOtpTimer}s</span> : forgotOtpExpired ? <span style={{ color: 'red' }}>OTP expired</span> : <span>Resend OTP available</span>}
                          </div>
                          <button type="button" className="footer-modal-submit" onClick={handleForgotVerifyOtp} disabled={forgotLoading || forgotOtp.some(d => !d)}>
                            {forgotLoading ? 'Verifying...' : 'Verify OTP'}
                          </button>
                          <button type="button" className="footer-modal-link" onClick={handleForgotResendOtp} disabled={forgotLoading || forgotResendCount >= 5 || forgotOtpTimer > 0}>
                            {forgotResendCount >= 5 ? 'Resend limit reached' : `Resend OTP${forgotResendCount > 0 ? ` (${5 - forgotResendCount} left)` : ''}`}
                          </button>
                        </div>
                      )}
                      {forgotStep === 3 && (
                        <div className="footer-modal-form">
                          <p style={{ marginBottom: '20px', textAlign: 'center' }}>Enter your new password</p>
                          <input type="password" placeholder="New Password" value={forgotNewPassword} onChange={e => setForgotNewPassword(e.target.value)} required />
                          <input type="password" placeholder="Confirm New Password" value={forgotConfirmPassword} onChange={e => setForgotConfirmPassword(e.target.value)} required />
                          <button type="button" className="footer-modal-submit" onClick={handleForgotResetPassword} disabled={forgotLoading}>
                            {forgotLoading ? 'Updating...' : 'Update Password'}
                          </button>
                        </div>
                      )}
                      <div style={{ textAlign: 'center', marginTop: '14px' }}>
                        <button type="button" className="footer-modal-link" onClick={handleForgotClose}>Back to Login</button>
                      </div>
                    </div>
                  )}
                  <div id="seeker-signin-panel" style={{ display: !forgotModalOpen && signinPanel === 'seeker' ? 'block' : 'none' }}>
                    <h2 className="footer-modal-heading" style={{ textAlign: 'center' }}>User Login</h2>
                    <form className="footer-modal-form" onSubmit={handleSeekerLogin} autoComplete="off" noValidate>
                      <input type="text" name="loginId" autoComplete="username" placeholder="Enter your email or phone number" value={seekerLogin.email} onChange={e => setSeekerLogin({ ...seekerLogin, email: e.target.value })} required />
                      <input type="password" name="loginPassword" autoComplete="current-password" placeholder="Password" value={seekerLogin.password} onChange={e => setSeekerLogin({ ...seekerLogin, password: e.target.value })} required />
                      <div className="footer-modal-row">
                        <a href="#" className="footer-modal-link" onClick={e => {
                          e.preventDefault();
                          setForgotStep(1);
                          setForgotEmail(seekerLogin.email || '');
                          setForgotOtp(['', '', '', '', '', '']);
                          setForgotOtpTimer(60);
                          setForgotOtpExpired(false);
                          setForgotResendCount(0);
                          setForgotNewPassword('');
                          setForgotConfirmPassword('');
                          setForgotLoading(false);
                          setForgotMessage('');
                          setSigninPanel('seeker');
                          setForgotModalOpen(true);
                        }}>Forgot Password?</a>
                      </div>
                      <button type="submit" className="footer-modal-submit" disabled={loading}>{loading ? 'Logging in...' : 'LogIn'}</button>
                    </form>
                    <div className="footer-modal-create-account" style={{ marginTop: '12px', textAlign: 'center' }}>
                      <span>If you don't have an account? </span>
                      <a href="#" style={{ color: '#2563eb', textDecoration: 'underline' }} onClick={e => {
                        e.preventDefault();
                        setRegisterType('seeker');
                        setIsOtpStep(false);
                        setOtp(['', '', '', '', '', '']);
                        setOtpTimer(60);
                        setOtpExpired(false);
                        setResendCount(0);
                        const signinModal = document.getElementById('signin');
                        const registerModal = document.getElementById('register');
                        if (signinModal) {
                          signinModal.classList.remove('in');
                          signinModal.style.display = 'none';
                        }
                        if (registerModal) {
                          registerModal.classList.add('in');
                          registerModal.style.display = 'block';
                          registerModal.style.opacity = '1';
                        }
                        document.body.classList.add('modal-open');
                      }}>Create here</a>
                    </div>
                    <div className="footer-modal-or">OR</div>
                    <div className="footer-modal-social-row">
                      <a href="#" className="gplus-log-btn log-btn" style={{ width: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center' }} onClick={e => { e.preventDefault(); handleGoogleAuth('seeker', 'signin', 'login'); }}>
                        <img src="/assets/img/google.png" alt="Google" style={{ width: '20px', height: '20px', marginRight: '8px', display: 'block', flexShrink: 0, verticalAlign: 'unset', marginBottom: '0px' }} /> Continue with Google
                      </a>
                    </div>
                    <div className="footer-modal-switch-provider">
                      <span>If you are employer then to login </span>
                      <a href="#" style={{ color: '#2563eb', textDecoration: 'underline' }} onClick={e => { e.preventDefault(); setSigninPanel('provider'); }}>click here</a>
                    </div>
                  </div>
                  {/* Job Provider Login */}
                  <div id="provider-signin-panel" style={{ display: !forgotModalOpen && signinPanel === 'provider' ? 'block' : 'none' }}>
                    <h2 className="footer-modal-heading" style={{ textAlign: 'center' }}>Employer Login</h2>
                    <form className="footer-modal-form" onSubmit={handleProviderLogin} autoComplete="off" noValidate>
                      <input type="text" name="loginId" autoComplete="username" placeholder="Enter your email or phone number" value={providerLogin.email} onChange={e => setProviderLogin({ ...providerLogin, email: e.target.value })} required />
                      <input type="password" name="loginPassword" autoComplete="current-password" placeholder="Password" value={providerLogin.password} onChange={e => setProviderLogin({ ...providerLogin, password: e.target.value })} required />
                      <div className="footer-modal-row">
                        <a href="#" className="footer-modal-link" onClick={e => {
                          e.preventDefault();
                          // Reset forgot state on open (UI only; existing logic unchanged)
                          setForgotStep(1);
                          setForgotEmail(providerLogin.email || '');
                          setForgotOtp(['', '', '', '', '', '']);
                          setForgotOtpTimer(60);
                          setForgotOtpExpired(false);
                          setForgotResendCount(0);
                          setForgotNewPassword('');
                          setForgotConfirmPassword('');
                          setForgotLoading(false);
                          setForgotMessage('');
                          setSigninPanel('provider');
                          setForgotModalOpen(true);
                        }}>Forgot Password?</a>
                      </div>
                      <button type="submit" className="footer-modal-submit" disabled={loading}>{loading ? 'Logging in...' : 'LogIn'}</button>
                    </form>
                    <div className="footer-modal-create-account" style={{ marginTop: '12px', textAlign: 'center' }}>
                      <span>If you don't have an account? </span>
                      <a href="#" style={{ color: '#2563eb', textDecoration: 'underline' }} onClick={e => {
                        e.preventDefault();
                        setRegisterType('provider');
                        setIsOtpStep(false);
                        setOtp(['', '', '', '', '', '']);
                        setOtpTimer(60);
                        setOtpExpired(false);
                        setResendCount(0);
                        const signinModal = document.getElementById('signin');
                        const registerModal = document.getElementById('register');
                        if (signinModal) {
                          signinModal.classList.remove('in');
                          signinModal.style.display = 'none';
                        }
                        if (registerModal) {
                          registerModal.classList.add('in');
                          registerModal.style.display = 'block';
                          registerModal.style.opacity = '1';
                        }
                        document.body.classList.add('modal-open');
                      }}>Create here</a>
                    </div>
                    <div className="footer-modal-or">OR</div>
                    <div className="footer-modal-social-row">
                      <a href="#" className="gplus-log-btn log-btn" style={{ width: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center' }} onClick={e => { e.preventDefault(); handleGoogleAuth('provider', 'signin', 'login'); }}>
                        <img src="/assets/img/google.png" alt="Google" style={{ width: '20px', height: '20px', marginRight: '8px', display: 'block', flexShrink: 0, verticalAlign: 'unset', marginBottom: '0px' }} /> Continue with Google
                      </a>
                    </div>
                    <div className="footer-modal-switch-provider">
                      <span>To login as job seeker </span>
                      <a href="#" style={{ color: '#2563eb', textDecoration: 'underline' }} onClick={e => { e.preventDefault(); setSigninPanel('seeker'); }}>click here</a>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Register Modal with click-outside-to-close and individual forms */}
      <div className="modal fade" id="register" tabIndex={-1} role="dialog" aria-labelledby="registerModalLabel" aria-hidden="true" onClick={e => {
        if (e.target.id === 'register') {
          document.getElementById('register').classList.remove('in');
          document.getElementById('register').style.display = 'none';
          document.body.classList.remove('modal-open');
          // Remove modal-backdrop if present
          const backdrops = document.querySelectorAll('.modal-backdrop');
          backdrops.forEach((el) => el.parentNode && el.parentNode.removeChild(el));
        }
      }}>
        <div className="modal-dialog">
          <div className="modal-content" id="registerModalLabel" onClick={e => e.stopPropagation()}>
            <div className="modal-body">
              <div className="footer-modal-minimalist">
                <div className="footer-modal-forms">
                  {!isOtpStep ? (
                    <>
                      {registerType === 'seeker' && (
                        <>
                          <h2 className="footer-modal-heading" style={{ textAlign: 'center', marginTop: '0', paddingTop: '0', marginBottom: '18px' }}>User Registration</h2>
                          <form className="footer-modal-form" onSubmit={handleSeekerRegister} autoComplete="off">
                            <input type="text" placeholder="Full Name" value={seekerForm.fullName} onChange={e => setSeekerForm({ ...seekerForm, fullName: e.target.value })} required />
                            <input type="email" placeholder="Email Address" value={seekerForm.email} onChange={e => setSeekerForm({ ...seekerForm, email: e.target.value })} required />
                            <input type="tel" placeholder="Phone Number" value={seekerForm.phone} onChange={e => setSeekerForm({ ...seekerForm, phone: e.target.value })} />
                            <input type="password" placeholder="Password" value={seekerForm.password} onChange={e => setSeekerForm({ ...seekerForm, password: e.target.value })} required />
                            <input type="password" placeholder="Confirm Password" value={seekerForm.confirmPassword} onChange={e => setSeekerForm({ ...seekerForm, confirmPassword: e.target.value })} required />
                            <RegistrationCategoryFields
                              required
                              className="footer-modal-form"
                              value={{
                                categoryId: seekerForm.categoryId,
                                subcategoryId: seekerForm.subcategoryId
                              }}
                              onChange={({ categoryId, subcategoryId }) =>
                                setSeekerForm({ ...seekerForm, categoryId, subcategoryId })
                              }
                            />
                            <button type="submit" className="footer-modal-submit" disabled={loading}>{loading ? 'Sending OTP...' : 'Register'}</button>
                          </form>
                          <div className="footer-modal-or">OR</div>
                          <div className="footer-modal-social-row">
                            <a
                              href="#"
                              className="gplus-log-btn log-btn"
                              style={{ width: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center' }}
                              onClick={e => { e.preventDefault(); handleGoogleAuth('seeker', 'register', 'register'); }}
                            >
                              <img src="/assets/img/google.png" alt="Google" style={{ width: '20px', height: '20px', marginRight: '8px', display: 'block', flexShrink: 0, verticalAlign: 'unset', marginBottom: '0px' }} /> Continue with Google
                            </a>
                          </div>
                          <div style={{ marginTop: '14px', textAlign: 'center' }}>
                            <span>Want to register as an employer? </span>
                            <a href="#" style={{ color: '#2563eb', textDecoration: 'underline' }} onClick={e => {
                              e.preventDefault();
                              setRegisterType('provider');
                              setIsOtpStep(false);
                              setOtp(['', '', '', '', '', '']);
                              setOtpTimer(60);
                              setResendCount(0);
                            }}>Click Here</a>
                          </div>
                        </>
                      )}
                      {registerType === 'provider' && (
                        <>
                          <h2 className="footer-modal-heading" style={{ textAlign: 'center', marginTop: '0', paddingTop: '0', marginBottom: '18px' }}>Employer Registration</h2>
                          <form className="footer-modal-form" onSubmit={handleProviderRegister} autoComplete="off">
                            <input type="text" placeholder="Full Name" value={providerForm.fullName} onChange={e => setProviderForm({ ...providerForm, fullName: e.target.value })} required />
                            <input type="email" placeholder="Email Address" value={providerForm.email} onChange={e => setProviderForm({ ...providerForm, email: e.target.value })} required />
                            <input type="tel" placeholder="Phone Number" value={providerForm.phone} onChange={e => setProviderForm({ ...providerForm, phone: e.target.value })} />
                            <input type="password" placeholder="Password" value={providerForm.password} onChange={e => setProviderForm({ ...providerForm, password: e.target.value })} required />
                            <input type="password" placeholder="Confirm Password" value={providerForm.confirmPassword} onChange={e => setProviderForm({ ...providerForm, confirmPassword: e.target.value })} required />
                            <button type="submit" className="footer-modal-submit" disabled={loading}>{loading ? 'Sending OTP...' : 'Register'}</button>
                          </form>
                          <div className="footer-modal-or">OR</div>
                          <div className="footer-modal-social-row">
                            <a
                              href="#"
                              className="gplus-log-btn log-btn"
                              style={{ width: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center' }}
                              onClick={e => { e.preventDefault(); handleGoogleAuth('provider', 'register', 'register'); }}
                            >
                              <img src="/assets/img/google.png" alt="Google" style={{ width: '20px', height: '20px', marginRight: '8px', display: 'block', flexShrink: 0, verticalAlign: 'unset', marginBottom: '0px' }} /> Continue with Google
                            </a>
                          </div>
                          <div style={{ marginTop: '14px', textAlign: 'center' }}>
                            <span>Want to register as a user? </span>
                            <a href="#" style={{ color: '#2563eb', textDecoration: 'underline' }} onClick={e => {
                              e.preventDefault();
                              setRegisterType('seeker');
                              setIsOtpStep(false);
                              setOtp(['', '', '', '', '', '']);
                              setOtpTimer(60);
                              setResendCount(0);
                            }}>Click Here</a>
                          </div>
                        </>
                      )}
                    </>
                  ) : (
                    // OTP Verification Modal
                    <>
                      <h2 className="footer-modal-heading" style={{ textAlign: 'center', marginTop: '0', paddingTop: '0', marginBottom: '18px' }}>Verify Your Email</h2>
                      <p style={{ textAlign: 'center', marginBottom: '20px', color: '#64748b' }}>OTP sent to {otpDeliveryTarget(otpSentVia)}</p>

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
                            style={{
                              width: '40px',
                              height: '40px',
                              textAlign: 'center',
                              border: '1.5px solid #e5e7eb',
                              borderRadius: '7px',
                              fontSize: '18px',
                              background: '#f8fafc'
                            }}
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
                        disabled={loading || otp.some(d => !d)}
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
                          style={{
                            background: 'none',
                            border: 'none',
                            color: resendCount >= 5 ? '#dc2626' : '#2563eb',
                            textDecoration: 'underline',
                            cursor: resendCount >= 5 || otpTimer > 0 ? 'not-allowed' : 'pointer'
                          }}
                        >
                          {resendCount >= 5 ? 'Resend OTP (limit reached)' : `Resend OTP${resendCount > 0 ? ` (${5 - resendCount} attempts left)` : ''}`}
                        </button>
                      </div>

                      <div style={{ textAlign: 'center' }}>
                        <button
                          type="button"
                          onClick={handleBackToRegister}
                          style={{
                            background: 'none',
                            border: 'none',
                            color: '#64748b',
                            textDecoration: 'underline',
                            cursor: 'pointer'
                          }}
                        >
                          Back to Registration
                        </button>
                      </div>
                    </>
                  )}
                </div>
              </div>
              <style>{`
                .footer-modal-minimalist {
                  padding: 0 0 12px 0;
                  background: #fff;
                  border-radius: 16px;
                  box-shadow: 0 4px 32px rgba(16,185,129,0.10);
                  display: flex;
                  flex-direction: column;
                  gap: 0;
                  font-size: 1.05rem;
                }
                /* Heading size left as-is per request */
                .footer-modal-forms {
                  width: 100%;
                  padding: 24px 24px 0 24px;
                }
                .footer-modal-form {
                  display: flex;
                  flex-direction: column;
                  gap: 14px;
                }
                .footer-modal-form input,
                .footer-modal-form select {
                  padding: 12px 13px;
                  border-radius: 7px;
                  border: 1.5px solid #e5e7eb;
                  font-size: 1.52rem;
                  background: #f8fafc;
                  color: #222;
                  transition: border 0.18s, box-shadow 0.18s;
                }
                .footer-modal-form input:focus,
                .footer-modal-form select:focus {
                  border: 1.5px solid #16a34a;
                  box-shadow: 0 0 0 2px #bbf7d0;
                  outline: none;
                }
                .footer-modal-submit {
                  background: #16a34a;
                  color: #fff;
                  border: none;
                  border-radius: 7px;
                  padding: 13px 0;
                  font-size: 1.26rem;
                  font-weight: 700;
                  margin-top: 8px;
                  cursor: pointer;
                  box-shadow: 0 2px 8px rgba(16,185,129,0.08);
                  transition: background 0.18s, box-shadow 0.18s;
                }
                .footer-modal-submit:hover, .footer-modal-submit:focus {
                  background: #15803d;
                  box-shadow: 0 4px 16px rgba(16,185,129,0.13);
                }
                .footer-modal-row {
                  display: flex;
                  justify-content: space-between;
                  align-items: center;
                  font-size: 1.04rem;
                  color: #64748b;
                }
                .footer-modal-link {
                  color: #16a34a;
                  text-decoration: none;
                  font-size: 1.34rem;
                  transition: color 0.18s;
                }
                .footer-modal-link:hover {
                  color: #15803d;
                }
                .footer-modal-or {
                  text-align: center;
                  color: #64748b;
                  margin: 18px 0 8px 0;
                  font-size: 1.04rem;
                  font-weight: 500;
                }
                .footer-modal-social-row {
                  display: flex;
                  justify-content: center;
                  gap: 12px;
                  margin-bottom: 8px;
                }
                .gplus-log-btn.log-btn {
                  background: #fff;
                  color: #ea4335;
                  border: 1.5px solid #ea4335;
                  border-radius: 7px;
                  padding: 10px 18px;
                  font-size: 1.50rem;
                  font-weight: 600;
                  display: flex;
                  align-items: center;
                  gap: 8px;
                  transition: background 0.18s, color 0.18s;
                }
                .gplus-log-btn.log-btn:hover, .gplus-log-btn.log-btn:focus {
                  background: #ea4335;
                  color: #fff;
                }
              `}</style>
            </div>
          </div>
        </div>
      </div>

      <div>
        <Link to="#" className="scrollup" onClick={handleScrollToTop}>
          Scroll
        </Link>
      </div>

    </>
  );
}

export default Footer;