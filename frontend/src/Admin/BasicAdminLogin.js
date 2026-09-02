import React from 'react';
import { API_BASE_URL } from '../config/api';

const BasicAdminLogin = () => {
  const handleLogin = async () => {
    try {
      console.log('Starting login...');
      
      const response = await fetch(`${API_BASE_URL}/api/admin/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          email: 'admin@uptula.com',
          password: 'admin@uptula78945'
        })
      });

      console.log('Response status:', response.status);

      if (response.ok) {
        const data = await response.json();
        console.log('Login successful:', data);
        
        localStorage.setItem('adminToken', data.token);
        alert('Login successful! Redirecting to dashboard...');
        window.location.href = '/admin/dashboard';
      } else {
        const error = await response.text();
        console.error('Login failed:', error);
        alert('Login failed: ' + error);
      }
    } catch (error) {
      console.error('Login error:', error);
      alert('Error: ' + error.message);
    }
  };

  return (
    <div style={{ 
      display: 'flex', 
      justifyContent: 'center', 
      alignItems: 'center', 
      height: '100vh',
      backgroundColor: '#f8f9fc',
      fontFamily: 'Arial, sans-serif'
    }}>
      <div style={{
        backgroundColor: 'white',
        padding: '40px',
        borderRadius: '10px',
        boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
        textAlign: 'center',
        maxWidth: '400px',
        width: '100%'
      }}>
        <h1 style={{ color: '#4e73df', marginBottom: '20px' }}>Admin Login</h1>
        <p style={{ color: '#666', marginBottom: '30px' }}>
          Welcome to Uptula Admin Dashboard
        </p>
        
        <div style={{ marginBottom: '20px' }}>
          <p><strong>Email:</strong> admin@uptula.com</p>
          <p><strong>Password:</strong> admin@uptula78945</p>
        </div>
        
        <button
          onClick={handleLogin}
          style={{
            backgroundColor: '#4e73df',
            color: 'white',
            border: 'none',
            padding: '12px 30px',
            borderRadius: '5px',
            fontSize: '16px',
            cursor: 'pointer',
            width: '100%'
          }}
        >
          Login as Admin
        </button>
        
        <div style={{ marginTop: '20px', fontSize: '12px', color: '#999' }}>
          Check browser console for detailed logs
        </div>
      </div>
    </div>
  );
};

export default BasicAdminLogin;
