import React, { useState } from 'react';
import './AdminStyles.css';
import { API_BASE_URL } from '../config/api';

const SimpleAdminLogin = () => {
  const [email, setEmail] = useState('admin@uptula.com');
  const [password, setPassword] = useState('admin@uptula78945');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      console.log('Attempting login...');
      
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
        
        // Store token
        localStorage.setItem('adminToken', data.token);
        
        // Redirect to dashboard
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
    <div className="admin-login">
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

                      <form onSubmit={handleLogin}>
                        <div className="form-group">
                          <input
                            type="email"
                            className="form-control form-control-user"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="Enter Email Address..."
                            required
                          />
                        </div>
                        <div className="form-group">
                          <input
                            type="password"
                            className="form-control form-control-user"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="Password"
                            required
                          />
                        </div>
                        <button
                          type="submit"
                          className="btn btn-primary btn-user btn-block"
                          disabled={loading}
                        >
                          {loading ? 'Logging in...' : 'Login'}
                        </button>
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

export default SimpleAdminLogin;
