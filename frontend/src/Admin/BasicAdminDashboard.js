import React, { useState, useEffect } from 'react';
import { API_BASE_URL } from '../config/api';

const BasicAdminDashboard = () => {
  const [stats, setStats] = useState({
    candidates: 0,
    employers: 0,
    jobs: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if user is logged in
    const token = localStorage.getItem('adminToken');
    if (!token) {
      alert('Not logged in. Redirecting to login...');
      window.location.href = '/admin/login';
      return;
    }

    // Load data
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      
      // Load candidates
      const candidatesResponse = await fetch(`${API_BASE_URL}/api/admin/candidates`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (candidatesResponse.ok) {
        const data = await candidatesResponse.json();
        setStats(prev => ({ ...prev, candidates: data.candidates.length }));
      }

      // Load employers
      const employersResponse = await fetch(`${API_BASE_URL}/api/admin/employers`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (employersResponse.ok) {
        const data = await employersResponse.json();
        setStats(prev => ({ ...prev, employers: data.employers.length }));
      }

      // Load jobs
      const jobsResponse = await fetch(`${API_BASE_URL}/api/admin/jobs`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (jobsResponse.ok) {
        const data = await jobsResponse.json();
        setStats(prev => ({ ...prev, jobs: data.jobs.length }));
      }

    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('adminToken');
    window.location.href = '/admin/login';
  };

  if (loading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh',
        backgroundColor: '#f8f9fc'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{
            width: '40px',
            height: '40px',
            border: '4px solid #f3f3f3',
            borderTop: '4px solid #4e73df',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            margin: '0 auto 20px'
          }}></div>
          <p>Loading dashboard...</p>
        </div>
        <style>
          {`
            @keyframes spin {
              0% { transform: rotate(0deg); }
              100% { transform: rotate(360deg); }
            }
          `}
        </style>
      </div>
    );
  }

  return (
    <div style={{ 
      backgroundColor: '#f8f9fc',
      minHeight: '100vh',
      fontFamily: 'Arial, sans-serif'
    }}>
      {/* Header */}
      <div style={{
        backgroundColor: 'white',
        padding: '20px',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
        marginBottom: '30px'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h1 style={{ color: '#4e73df', margin: 0 }}>Uptula Admin Dashboard</h1>
          <button
            onClick={handleLogout}
            style={{
              backgroundColor: '#e74a3b',
              color: 'white',
              border: 'none',
              padding: '8px 16px',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            Logout
          </button>
        </div>
      </div>

      {/* Content */}
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 20px' }}>
        {/* Stats Cards */}
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', 
          gap: '20px',
          marginBottom: '30px'
        }}>
          <div style={{
            backgroundColor: 'white',
            padding: '20px',
            borderRadius: '8px',
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
            borderLeft: '4px solid #4e73df'
          }}>
            <h3 style={{ color: '#4e73df', margin: '0 0 10px 0' }}>Total Candidates</h3>
            <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#333' }}>
              {stats.candidates}
            </div>
          </div>

          <div style={{
            backgroundColor: 'white',
            padding: '20px',
            borderRadius: '8px',
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
            borderLeft: '4px solid #1cc88a'
          }}>
            <h3 style={{ color: '#1cc88a', margin: '0 0 10px 0' }}>Total Employers</h3>
            <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#333' }}>
              {stats.employers}
            </div>
          </div>

          <div style={{
            backgroundColor: 'white',
            padding: '20px',
            borderRadius: '8px',
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
            borderLeft: '4px solid #36b9cc'
          }}>
            <h3 style={{ color: '#36b9cc', margin: '0 0 10px 0' }}>Total Jobs</h3>
            <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#333' }}>
              {stats.jobs}
            </div>
          </div>
        </div>

        {/* Welcome Message */}
        <div style={{
          backgroundColor: 'white',
          padding: '30px',
          borderRadius: '8px',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
        }}>
          <h2 style={{ color: '#333', marginBottom: '20px' }}>Welcome to Admin Dashboard</h2>
          <p style={{ color: '#666', marginBottom: '20px' }}>
            You have successfully logged into the Uptula admin dashboard. This is a simplified version that works without complex dependencies.
          </p>
          <button
            onClick={loadData}
            style={{
              backgroundColor: '#4e73df',
              color: 'white',
              border: 'none',
              padding: '10px 20px',
              borderRadius: '4px',
              cursor: 'pointer',
              marginRight: '10px'
            }}
          >
            Refresh Data
          </button>
          <button
            onClick={handleLogout}
            style={{
              backgroundColor: '#e74a3b',
              color: 'white',
              border: 'none',
              padding: '10px 20px',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            Logout
          </button>
        </div>
      </div>
    </div>
  );
};

export default BasicAdminDashboard;
