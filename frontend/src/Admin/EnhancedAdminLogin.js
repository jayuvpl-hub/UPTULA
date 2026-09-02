import React, { useState } from 'react';
import { API_BASE_URL } from '../config/api';
import { FaEnvelope, FaLock, FaUserShield, FaSpinner } from 'react-icons/fa';

const EnhancedAdminLogin = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      console.log('Starting login...');
      
      const response = await fetch(`${API_BASE_URL}/api/admin/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email, password })
      });

      console.log('Response status:', response.status);

      if (response.ok) {
        const data = await response.json();
        console.log('Login successful:', data);
        
        localStorage.setItem('adminToken', data.token);
        window.location.href = '/admin/dashboard';
      } else {
        const errorData = await response.json();
        console.error('Login failed:', errorData);
        setError(errorData.message || 'Login failed');
      }
    } catch (error) {
      console.error('Login error:', error);
      setError('Network error: ' + error.message);
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
      background: 'linear-gradient(to right, #3498db 0%, #5dade2 25%, #aed6f1 50%, #DADADA 75%, #DADADA 100%)',
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
          height: '500px',
          background: '#FFFFFF',
          borderRadius: '20px 0 0 20px',
          overflow: 'hidden',
          border: 'none',
          outline: 'none'
        }}>
          <img 
            src="/assets/img/adminLoginPic.jpg" 
            alt="Admin Portal" 
            style={{
              width: '500px',
              height: '500px',
              objectFit: 'contain',
              objectPosition: 'center',
              borderRadius: '20px 0 0 20px',
              boxShadow: 'none',
              margin: 0,
              padding: 0,
              display: 'block',
              transform: 'scale(0.92)',
              backgroundColor: '#FFFFFF',
              border: 'none',
              outline: 'none'
            }}
          />
          <div style={{
            position: 'absolute',
            bottom: '20px',
            left: '35px',
            right: '35px',
            textAlign: 'left',
            zIndex: 2
          }}>
            <h1 style={{
              margin: 0,
              fontSize: '1.7rem',
              fontWeight: '800',
              marginBottom: '10px',
              textShadow: '0 2px 10px rgba(0,0,0,0.3)',
              color: '#3498db',
              lineHeight: '1.2'
            }}>
              Admin Portal
            </h1>
            <p style={{
              margin: 0,
              fontSize: '0.9rem',
              opacity: 1,
              lineHeight: '1.4',
              color: '#8b7355',
              textShadow: '0 2px 8px rgba(0,0,0,0.3)',
              fontWeight: '600'
            }}>
              Manage your job platform efficiently with powerful administrative tools
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
          height: '500px'
        }}>
        <form 
          onSubmit={handleLogin} 
          style={{ 
            width: '500px',
            height: '500px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            background: 'rgba(255, 255, 255, 0.95)',
            backdropFilter: 'blur(10px)',
            padding: '40px',
            borderRadius: '0 20px 20px 0',
            boxShadow: '0 20px 60px rgba(0,0,0,0.15)',
            border: '1px solid rgba(255, 255, 255, 0.3)',
            margin: 0,
            boxSizing: 'border-box'
          }}
        >
          {/* Header */}
          <div style={{ marginBottom: '24px', textAlign: 'center' }}>
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '70px',
              height: '70px',
              background: 'linear-gradient(135deg, #3498db 0%, #2980b9 100%)',
              borderRadius: '18px',
              marginBottom: '16px',
              boxShadow: '0 10px 30px rgba(52, 152, 219, 0.3)'
            }}>
              <FaUserShield style={{ fontSize: '32px', color: '#fff' }} />
            </div>
            <h2 style={{ 
              margin: 0, 
              marginBottom: '6px',
              fontSize: '1.75rem',
              fontWeight: '800',
              color: '#2d3748',
              letterSpacing: '-0.02em'
            }}>
              Welcome Back
            </h2>
            <p style={{ 
              margin: 0, 
              color: '#718096',
              fontSize: '0.9rem'
            }}>
              Sign in to continue to your admin dashboard
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
          <div style={{ marginBottom: '16px' }}>
            <label style={{ 
              display: 'block', 
              marginBottom: '8px',
              fontSize: '13px',
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
                color: '#3498db',
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
                  e.target.style.borderColor = '#3498db';
                  e.target.style.boxShadow = '0 0 0 3px rgba(52, 152, 219, 0.1)';
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = '#e2e8f0';
                  e.target.style.boxShadow = 'none';
                }}
              />
            </div>
          </div>

          {/* Password Input */}
          <div style={{ marginBottom: '20px' }}>
            <label style={{ 
              display: 'block', 
              marginBottom: '8px',
              fontSize: '13px',
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
                color: '#3498db',
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
                  e.target.style.borderColor = '#3498db';
                  e.target.style.boxShadow = '0 0 0 3px rgba(52, 152, 219, 0.1)';
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
                : 'linear-gradient(135deg, #3498db 0%, #2980b9 100%)',
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
                : '0 10px 30px rgba(52, 152, 219, 0.3)',
              transition: 'all 0.3s ease',
              letterSpacing: '0.5px'
            }}
            onMouseEnter={(e) => {
              if (!loading) {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 15px 40px rgba(52, 152, 219, 0.4)';
              }
            }}
            onMouseLeave={(e) => {
              if (!loading) {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 10px 30px rgba(52, 152, 219, 0.3)';
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
            marginTop: '16px',
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
              onMouseEnter={(e) => e.currentTarget.style.color = '#3498db'}
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

export default EnhancedAdminLogin;