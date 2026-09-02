import React, { useState, useEffect } from 'react';
import { API_BASE_URL } from '../config/api';
import { useAdmin } from './AdminContext';
import AdminDebug from './AdminDebug';
import './AdminStyles.css';

const AdminLogin = () => {
  const { login, loading, error, isAuthenticated } = useAdmin();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    rememberMe: false
  });
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      // Use replace to prevent back button issues
      window.location.replace('/admin/dashboard');
    }
  }, [isAuthenticated]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  // Direct login function that bypasses context
  const directLogin = async (email, password) => {
    try {
      setIsLoggingIn(true);
      console.log('Direct login attempt:', { email, password });
      
      const response = await fetch(`${API_BASE_URL}/api/admin/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email, password })
      });
      
      console.log('Direct login response status:', response.status);
      
      if (response.ok) {
        const data = await response.json();
        console.log('Direct login success:', data);
        
        // Store token and redirect
        localStorage.setItem('adminToken', data.token);
        window.location.replace('/admin/dashboard');
      } else {
        const errorData = await response.json();
        console.error('Direct login failed:', errorData);
        alert('Login failed: ' + (errorData.message || 'Unknown error'));
      }
    } catch (error) {
      console.error('Direct login error:', error);
      alert('Login error: ' + error.message);
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log('Form submitted with:', formData);
    
    try {
      const result = await login(formData.email, formData.password);
      console.log('Login result:', result);
      
      if (result.success) {
        console.log('Login successful, redirecting...');
        // Redirect will happen via useEffect
      } else {
        console.error('Login failed:', result.error);
        // Try direct login as fallback
        console.log('Trying direct login as fallback...');
        await directLogin(formData.email, formData.password);
      }
    } catch (error) {
      console.error('Login error:', error);
      // Try direct login as fallback
      console.log('Trying direct login as fallback...');
      await directLogin(formData.email, formData.password);
    }
  };

  if (loading || isLoggingIn) {
    return (
      <div className="admin-login">
        <div className="container">
          <div className="row justify-content-center">
            <div className="col-xl-10 col-lg-12 col-md-9">
              <div className="card o-hidden border-0 shadow-lg my-5">
                <div className="card-body p-0">
                  <div className="row">
                    <div className="col-lg-6 d-none d-lg-block bg-login-image"></div>
                    <div className="col-lg-6">
                      <div className="p-5 text-center">
                        <div className="spinner-border text-primary" role="status">
                          <span className="sr-only">Loading...</span>
                        </div>
                        <p className="mt-3">Verifying authentication...</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (isAuthenticated) {
    return null; // Will redirect via useEffect
  }

  return (
    <div className="admin-login">
      <AdminDebug />
      <div className="container">
        <div className="row justify-content-center">
          <div className="col-xl-10 col-lg-12 col-md-9">
            <div className="card o-hidden border-0 shadow-lg my-5">
              <div className="card-body p-0">
                <div className="row">
                  <div className="col-lg-6 d-none d-lg-block bg-login-image"></div>
                  <div className="col-lg-6">
                    <div className="p-5">
                      <div className="text-center">
                        <h1 className="h4 text-gray-900 mb-4">Admin Login</h1>
                        <p className="text-gray-600 mb-4">Welcome to Uptula Admin Dashboard</p>
                      </div>
                      
                      {error && (
                        <div className="alert alert-danger" role="alert">
                          {error}
                        </div>
                      )}

                      <form className="user" onSubmit={handleSubmit}>
                        <div className="form-group">
                          <input
                            type="email"
                            className="form-control form-control-user"
                            name="email"
                            value={formData.email}
                            onChange={handleChange}
                            placeholder="Enter your email address"
                            required
                          />
                        </div>
                        <div className="form-group">
                          <input
                            type="password"
                            className="form-control form-control-user"
                            name="password"
                            value={formData.password}
                            onChange={handleChange}
                            placeholder="Enter your password"
                            required
                          />
                        </div>
                        <div className="form-group">
                          <div className="custom-control custom-checkbox small">
                            <input
                              type="checkbox"
                              className="custom-control-input"
                              id="customCheck"
                              name="rememberMe"
                              checked={formData.rememberMe}
                              onChange={handleChange}
                            />
                            <label className="custom-control-label" htmlFor="customCheck">
                              Remember Me
                            </label>
                          </div>
                        </div>
                        <button
                          type="submit"
                          className="btn btn-primary btn-user btn-block"
                          disabled={loading}
                        >
                          {loading ? 'Logging in...' : 'Login'}
                        </button>
                        
                        <div className="mt-3">
                          <button
                            type="button"
                            className="btn btn-success btn-user btn-block"
                            onClick={() => {
                              console.log('Testing direct login...');
                              directLogin('admin@uptula.com', 'admin@uptula78945');
                            }}
                            disabled={isLoggingIn}
                          >
                            {isLoggingIn ? 'Logging in...' : 'Test Login (Direct)'}
                          </button>
                        </div>
                      </form>
                      
                      <div className="text-center mt-4">
                        <small className="text-gray-600">
                          Default Admin Credentials:<br />
                          Email: admin@uptula.com<br />
                          Password: admin@uptula78945
                        </small>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminLogin;
