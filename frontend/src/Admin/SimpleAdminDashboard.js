import React, { useState, useEffect } from 'react';
import './AdminStyles.css';
import { API_BASE_URL } from '../config/api';

const SimpleAdminDashboard = () => {
  const [admin, setAdmin] = useState(null);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalCandidates: 0,
    totalEmployers: 0,
    totalJobs: 0,
    premiumMembers: 0
  });

  useEffect(() => {
    // Check if user is logged in
    const token = localStorage.getItem('adminToken');
    if (!token) {
      window.location.href = '/admin/login';
      return;
    }

    // Set admin info (you can decode the token or make an API call)
    setAdmin({
      id: 'admin-1',
      fullName: 'Admin User',
      email: 'admin@uptula.com',
      role: 'admin'
    });

    // Load dashboard data
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
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
        const candidatesData = await candidatesResponse.json();
        setStats(prev => ({ ...prev, totalCandidates: candidatesData.candidates.length }));
      }

      // Load employers
      const employersResponse = await fetch(`${API_BASE_URL}/api/admin/employers`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (employersResponse.ok) {
        const employersData = await employersResponse.json();
        setStats(prev => ({ ...prev, totalEmployers: employersData.employers.length }));
      }

      // Load jobs
      const jobsResponse = await fetch(`${API_BASE_URL}/api/admin/jobs`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (jobsResponse.ok) {
        const jobsData = await jobsResponse.json();
        setStats(prev => ({ ...prev, totalJobs: jobsData.jobs.length }));
      }

    } catch (error) {
      console.error('Error loading dashboard data:', error);
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
      <div className="admin-dashboard">
        <div className="d-flex justify-content-center align-items-center" style={{ height: '100vh' }}>
          <div className="spinner-border text-primary" role="status">
            <span className="sr-only">Loading...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-dashboard">
      <div id="wrapper">
        {/* Sidebar */}
        <ul className="navbar-nav bg-gradient-primary sidebar sidebar-dark accordion">
          <a className="sidebar-brand d-flex align-items-center justify-content-center" href="#">
            <div className="sidebar-brand-icon rotate-n-15">
              <i className="fas fa-laugh-wink"></i>
            </div>
            <div className="sidebar-brand-text mx-3">Uptula Admin</div>
          </a>
          <hr className="sidebar-divider my-0" />
          <li className="nav-item active">
            <a className="nav-link" href="#">
              <i className="fas fa-fw fa-tachometer-alt"></i>
              <span>Dashboard</span>
            </a>
          </li>
        </ul>

        {/* Content Wrapper */}
        <div id="content-wrapper" className="d-flex flex-column">
          {/* Topbar */}
          <nav className="navbar navbar-expand navbar-light bg-white topbar mb-4 static-top shadow">
            <div className="navbar-nav ml-auto">
              <div className="nav-item dropdown no-arrow">
                <a className="nav-link dropdown-toggle" href="#" id="userDropdown" role="button">
                  <span className="mr-2 d-none d-lg-inline text-gray-600 small">
                    {admin ? admin.fullName : 'Admin User'}
                  </span>
                  <img className="img-profile rounded-circle" src="/img/undraw_profile.svg" alt="..." />
                </a>
                <div className="dropdown-menu dropdown-menu-right shadow">
                  <a className="dropdown-item" href="#" onClick={handleLogout}>
                    <i className="fas fa-sign-out-alt fa-sm fa-fw mr-2 text-gray-400"></i>
                    Logout
                  </a>
                </div>
              </div>
            </div>
          </nav>

          {/* Main Content */}
          <div id="content">
            <div className="container-fluid">
              {/* Page Heading */}
              <div className="d-sm-flex align-items-center justify-content-between mb-4">
                <h1 className="h3 mb-0 text-gray-800">Dashboard Overview</h1>
              </div>

              {/* Statistics Cards */}
              <div className="row">
                <div className="col-xl-3 col-md-6 mb-4">
                  <div className="card border-left-primary shadow h-100 py-2">
                    <div className="card-body">
                      <div className="row no-gutters align-items-center">
                        <div className="col mr-2">
                          <div className="text-xs font-weight-bold text-primary text-uppercase mb-1">
                            Total Candidates
                          </div>
                          <div className="h5 mb-0 font-weight-bold text-gray-800">
                            {stats.totalCandidates}
                          </div>
                        </div>
                        <div className="col-auto">
                          <i className="fas fa-users fa-2x text-gray-300"></i>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="col-xl-3 col-md-6 mb-4">
                  <div className="card border-left-success shadow h-100 py-2">
                    <div className="card-body">
                      <div className="row no-gutters align-items-center">
                        <div className="col mr-2">
                          <div className="text-xs font-weight-bold text-success text-uppercase mb-1">
                            Total Employers
                          </div>
                          <div className="h5 mb-0 font-weight-bold text-gray-800">
                            {stats.totalEmployers}
                          </div>
                        </div>
                        <div className="col-auto">
                          <i className="fas fa-building fa-2x text-gray-300"></i>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="col-xl-3 col-md-6 mb-4">
                  <div className="card border-left-info shadow h-100 py-2">
                    <div className="card-body">
                      <div className="row no-gutters align-items-center">
                        <div className="col mr-2">
                          <div className="text-xs font-weight-bold text-info text-uppercase mb-1">
                            Total Jobs
                          </div>
                          <div className="h5 mb-0 font-weight-bold text-gray-800">
                            {stats.totalJobs}
                          </div>
                        </div>
                        <div className="col-auto">
                          <i className="fas fa-briefcase fa-2x text-gray-300"></i>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="col-xl-3 col-md-6 mb-4">
                  <div className="card border-left-warning shadow h-100 py-2">
                    <div className="card-body">
                      <div className="row no-gutters align-items-center">
                        <div className="col mr-2">
                          <div className="text-xs font-weight-bold text-warning text-uppercase mb-1">
                            Premium Members
                          </div>
                          <div className="h5 mb-0 font-weight-bold text-gray-800">
                            {stats.premiumMembers}
                          </div>
                        </div>
                        <div className="col-auto">
                          <i className="fas fa-crown fa-2x text-gray-300"></i>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Welcome Message */}
              <div className="row">
                <div className="col-lg-12">
                  <div className="card shadow mb-4">
                    <div className="card-header py-3">
                      <h6 className="m-0 font-weight-bold text-primary">Welcome to Uptula Admin Dashboard</h6>
                    </div>
                    <div className="card-body">
                      <p>Welcome, {admin ? admin.fullName : 'Admin'}! You have successfully logged into the admin dashboard.</p>
                      <p>This is a simplified version that works without complex context management.</p>
                      <div className="mt-3">
                        <button className="btn btn-primary mr-2" onClick={loadDashboardData}>
                          Refresh Data
                        </button>
                        <button className="btn btn-danger" onClick={handleLogout}>
                          Logout
                        </button>
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

export default SimpleAdminDashboard;
