import React, { useState } from 'react';
import { API_BASE_URL } from '../config/api';
import { FaEnvelope, FaLock, FaHeadset, FaSpinner } from 'react-icons/fa';

const CSRLogin = ({ redirectTo = '/cs/dashboard' }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const response = await fetch(`${API_BASE_URL}/api/customer/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      const data = await response.json();
      if (!response.ok) {
        setError(data.message || 'Login failed');
        return;
      }
      localStorage.setItem('csToken', data.token);
      window.location.href = redirectTo;
    } catch (err) {
      setError('Network error: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ 
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      height: '100vh',
      background: 'linear-gradient(to right, #1abc9c 0%, #4ecdc4 25%, #a8e6cf 50%, #DADADA 75%, #DADADA 100%)',
      position: 'relative',
      overflow: 'hidden',
      padding: '20px',
      boxSizing: 'border-box'
    }}>
      {/* Container for both boxes - centered */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 0,
        maxWidth: '1200px',
        width: '100%'
      }}>
        {/* Left Panel - Image */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative',
          zIndex: 1,
          height: '600px'
        }}>
          <img 
            src="/assets/img/CS-LoginPic.jpg" 
            alt="Customer Service" 
            style={{
              width: '500px',
              height: '600px',
              objectFit: 'cover',
              borderRadius: '20px 0 0 20px',
              boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
              margin: 0,
              display: 'block'
            }}
          />
          <div style={{
            position: 'absolute',
            bottom: '15px',
            left: '40px',
            right: '40px',
            textAlign: 'left',
            zIndex: 2
          }}>
            <h1 style={{
              margin: 0,
              fontSize: '1.8rem',
              fontWeight: '800',
              marginBottom: '12px',
              textShadow: '0 2px 10px rgba(0,0,0,0.3)',
              color: '#1abc9c',
              lineHeight: '1.2'
            }}>
              Customer Service Portal
            </h1>
            <p style={{
              margin: 0,
              fontSize: '0.95rem',
              opacity: 1,
              lineHeight: '1.5',
              color: '#3498db',
              textShadow: '0 2px 8px rgba(0,0,0,0.3)',
              fontWeight: '600'
            }}>
              Access to the most powerful tool in customer support and service management
            </p>
          </div>
        </div>

        {/* Right Panel - Login Form */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative',
          zIndex: 1,
          height: '600px'
        }}>
        <form 
          onSubmit={handleLogin} 
          style={{ 
            width: '500px',
            height: '600px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            background: 'rgba(255, 255, 255, 0.95)',
            backdropFilter: 'blur(10px)',
            padding: '48px',
            borderRadius: '0 20px 20px 0',
            boxShadow: '0 20px 60px rgba(0,0,0,0.15)',
            border: '1px solid rgba(255, 255, 255, 0.3)',
            margin: 0,
            boxSizing: 'border-box'
          }}
        >
          {/* Header */}
          <div style={{ marginBottom: '32px', textAlign: 'center' }}>
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '80px',
              height: '80px',
              background: 'linear-gradient(135deg, #1abc9c 0%, #16a085 100%)',
              borderRadius: '20px',
              marginBottom: '20px',
              boxShadow: '0 10px 30px rgba(26, 188, 156, 0.3)'
            }}>
              <FaHeadset style={{ fontSize: '36px', color: '#fff' }} />
            </div>
            <h2 style={{ 
              margin: 0, 
              marginBottom: '8px',
              fontSize: '2rem',
              fontWeight: '800',
              color: '#2d3748',
              letterSpacing: '-0.02em'
            }}>
              Welcome Back
            </h2>
            <p style={{ 
              margin: 0, 
              color: '#718096',
              fontSize: '1rem'
            }}>
              Sign in to continue to your dashboard
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <div style={{ 
              background: 'linear-gradient(135deg, #fee2e2 0%, #fecaca 100%)',
              color: '#991b1b',
              padding: '14px 18px',
              borderRadius: '12px',
              marginBottom: '24px',
              border: '1px solid #fca5a5',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              fontSize: '14px',
              fontWeight: '600'
            }}>
              <span style={{ fontSize: '16px' }}>⚠️</span>
              {error}
            </div>
          )}

          {/* Email Input */}
          <div style={{ marginBottom: '20px' }}>
            <label style={{ 
              display: 'block', 
              marginBottom: '10px',
              fontSize: '14px',
              fontWeight: '700',
              color: '#2d3748'
            }}>
              Email Address
            </label>
            <div style={{ position: 'relative' }}>
              <FaEnvelope style={{
                position: 'absolute',
                left: '16px',
                top: '50%',
                transform: 'translateY(-50%)',
                color: '#1abc9c',
                fontSize: '18px',
                zIndex: 2,
                pointerEvents: 'none'
              }} />
              <input 
                value={email} 
                onChange={(e) => setEmail(e.target.value)} 
                type="email" 
                required 
                placeholder="Enter your email"
                style={{ 
                  width: '100%',
                  padding: '14px 14px 14px 48px',
                  borderRadius: '12px',
                  border: '2px solid #e2e8f0',
                  fontSize: '15px',
                  outline: 'none',
                  transition: 'all 0.3s ease',
                  background: 'linear-gradient(135deg, #ffffff 0%, #f8f9fc 100%)',
                  boxSizing: 'border-box'
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = '#1abc9c';
                  e.target.style.boxShadow = '0 0 0 3px rgba(26, 188, 156, 0.1)';
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = '#e2e8f0';
                  e.target.style.boxShadow = 'none';
                }}
              />
            </div>
          </div>

          {/* Password Input */}
          <div style={{ marginBottom: '28px' }}>
            <label style={{ 
              display: 'block', 
              marginBottom: '10px',
              fontSize: '14px',
              fontWeight: '700',
              color: '#2d3748'
            }}>
              Password
            </label>
            <div style={{ position: 'relative' }}>
              <FaLock style={{
                position: 'absolute',
                left: '16px',
                top: '50%',
                transform: 'translateY(-50%)',
                color: '#1abc9c',
                fontSize: '18px',
                zIndex: 2,
                pointerEvents: 'none'
              }} />
              <input 
                value={password} 
                onChange={(e) => setPassword(e.target.value)} 
                type="password" 
                required 
                placeholder="Enter your password"
                style={{ 
                  width: '100%',
                  padding: '14px 14px 14px 48px',
                  borderRadius: '12px',
                  border: '2px solid #e2e8f0',
                  fontSize: '15px',
                  outline: 'none',
                  transition: 'all 0.3s ease',
                  background: 'linear-gradient(135deg, #ffffff 0%, #f8f9fc 100%)',
                  boxSizing: 'border-box'
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = '#1abc9c';
                  e.target.style.boxShadow = '0 0 0 3px rgba(26, 188, 156, 0.1)';
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = '#e2e8f0';
                  e.target.style.boxShadow = 'none';
                }}
              />
            </div>
          </div>

          {/* Submit Button */}
          <button 
            type="submit" 
            disabled={loading}
            style={{ 
              width: '100%',
              padding: '16px',
              border: 0,
              borderRadius: '12px',
              background: loading 
                ? '#94a3b8' 
                : 'linear-gradient(135deg, #1abc9c 0%, #16a085 100%)',
              color: '#fff',
              cursor: loading ? 'not-allowed' : 'pointer',
              fontSize: '16px',
              fontWeight: '700',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '10px',
              boxShadow: loading 
                ? 'none' 
                : '0 10px 30px rgba(26, 188, 156, 0.3)',
              transition: 'all 0.3s ease',
              letterSpacing: '0.5px'
            }}
            onMouseEnter={(e) => {
              if (!loading) {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 15px 40px rgba(26, 188, 156, 0.4)';
              }
            }}
            onMouseLeave={(e) => {
              if (!loading) {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 10px 30px rgba(26, 188, 156, 0.3)';
              }
            }}
          >
            {loading ? (
              <>
                <FaSpinner style={{ animation: 'spin 1s linear infinite' }} />
                Signing in...
              </>
            ) : (
              'Sign In'
            )}
          </button>

          {/* Back to Site Link */}
          <div style={{
            marginTop: '24px',
            textAlign: 'center'
          }}>
            <a 
              href="/" 
              style={{
                color: '#718096',
                fontSize: '14px',
                textDecoration: 'none',
                transition: 'color 0.3s ease'
              }}
              onMouseEnter={(e) => e.currentTarget.style.color = '#1abc9c'}
              onMouseLeave={(e) => e.currentTarget.style.color = '#718096'}
            >
              ← Back to site
            </a>
          </div>
        </form>
        </div>
      </div>

      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default CSRLogin;


