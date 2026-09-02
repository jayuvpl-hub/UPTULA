import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { API_BASE_URL } from '../config/api';

const AdminContext = createContext();

// Admin reducer for state management
const adminReducer = (state, action) => {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, loading: action.payload };
    case 'SET_ERROR':
      return { ...state, error: action.payload, loading: false };
    case 'SET_ADMIN':
      return { ...state, admin: action.payload, isAuthenticated: true, loading: false };
    case 'LOGOUT':
      return { ...state, admin: null, isAuthenticated: false, loading: false };
    case 'SET_CANDIDATES':
      return { ...state, candidates: action.payload };
    case 'SET_EMPLOYERS':
      return { ...state, employers: action.payload };
    case 'SET_JOBS':
      return { ...state, jobs: action.payload };
    case 'SET_PREMIUM_MEMBERS':
      return { ...state, premiumMembers: action.payload };
    case 'SET_STATS':
      return { ...state, stats: action.payload };
    default:
      return state;
  }
};

// Initial state
const initialState = {
  admin: null,
  isAuthenticated: false,
  loading: false,
  error: null,
  candidates: [],
  employers: [],
  jobs: [],
  premiumMembers: [],
  stats: {
    totalCandidates: 0,
    totalEmployers: 0,
    totalJobs: 0,
    totalApplications: 0,
    premiumMembers: 0,
    monthlyEarnings: 0,
    annualEarnings: 0
  }
};

// Admin provider component
export const AdminProvider = ({ children }) => {
  const [state, dispatch] = useReducer(adminReducer, initialState);

  // Check for existing admin session on mount
  useEffect(() => {
    console.log('AdminContext: Checking for existing session...');
    const adminToken = localStorage.getItem('adminToken');
    console.log('AdminContext: Token found:', !!adminToken);
    if (adminToken) {
      // Verify token with backend
      console.log('AdminContext: Verifying token...');
      verifyAdminToken(adminToken);
    } else {
      // No token, ensure we're not authenticated
      console.log('AdminContext: No token, logging out');
      dispatch({ type: 'LOGOUT' });
    }
  }, []);

  // Verify admin token
  const verifyAdminToken = async (token) => {
    try {
      console.log('AdminContext: Starting token verification...');
      dispatch({ type: 'SET_LOADING', payload: true });
      const response = await fetch(`${API_BASE_URL}/api/admin/verify`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      console.log('AdminContext: Token verification response status:', response.status);
      if (response.ok) {
        const data = await response.json();
        console.log('AdminContext: Token verification successful:', data);
        dispatch({ type: 'SET_ADMIN', payload: data.admin });
      } else {
        console.log('AdminContext: Token verification failed, logging out');
        localStorage.removeItem('adminToken');
        dispatch({ type: 'LOGOUT' });
      }
    } catch (error) {
      console.error('AdminContext: Token verification error:', error);
      localStorage.removeItem('adminToken');
      dispatch({ type: 'LOGOUT' });
    }
  };

  // Admin login
  const login = async (email, password) => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      dispatch({ type: 'SET_ERROR', payload: null });

      console.log('Attempting admin login with:', { email, password });
      console.log('API URL:', `${API_BASE_URL}/api/admin/login`);

      const response = await fetch(`${API_BASE_URL}/api/admin/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email, password })
      });

      console.log('Response status:', response.status);
      console.log('Response headers:', response.headers);

      const data = await response.json();
      console.log('Response data:', data);

      if (response.ok) {
        localStorage.setItem('adminToken', data.token);
        dispatch({ type: 'SET_ADMIN', payload: data.admin });
        return { success: true };
      } else {
        dispatch({ type: 'SET_ERROR', payload: data.message || 'Login failed' });
        return { success: false, error: data.message || 'Login failed' };
      }
    } catch (error) {
      console.error('Login error:', error);
      const errorMessage = `Network error: ${error.message}. Please check if the backend server is running.`;
      dispatch({ type: 'SET_ERROR', payload: errorMessage });
      return { success: false, error: errorMessage };
    }
  };

  // Admin logout
  const logout = () => {
    localStorage.removeItem('adminToken');
    dispatch({ type: 'LOGOUT' });
    // Force redirect to login
    window.location.replace('/admin/login');
  };

  // Fetch candidates
  const fetchCandidates = async () => {
    try {
      const adminToken = localStorage.getItem('adminToken');
      const response = await fetch(`${API_BASE_URL}/api/admin/candidates`, {
        headers: {
          'Authorization': `Bearer ${adminToken}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        dispatch({ type: 'SET_CANDIDATES', payload: data.candidates });
        return data.candidates;
      } else {
        throw new Error('Failed to fetch candidates');
      }
    } catch (error) {
      console.error('Error fetching candidates:', error);
      dispatch({ type: 'SET_ERROR', payload: 'Failed to fetch candidates' });
      return [];
    }
  };

  // Fetch employers
  const fetchEmployers = async () => {
    try {
      const adminToken = localStorage.getItem('adminToken');
      const response = await fetch(`${API_BASE_URL}/api/admin/employers`, {
        headers: {
          'Authorization': `Bearer ${adminToken}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        dispatch({ type: 'SET_EMPLOYERS', payload: data.employers });
        return data.employers;
      } else {
        throw new Error('Failed to fetch employers');
      }
    } catch (error) {
      console.error('Error fetching employers:', error);
      dispatch({ type: 'SET_ERROR', payload: 'Failed to fetch employers' });
      return [];
    }
  };

  // Fetch jobs
  const fetchJobs = async () => {
    try {
      const adminToken = localStorage.getItem('adminToken');
      const response = await fetch(`${API_BASE_URL}/api/admin/jobs`, {
        headers: {
          'Authorization': `Bearer ${adminToken}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        dispatch({ type: 'SET_JOBS', payload: data.jobs });
        return data.jobs;
      } else {
        throw new Error('Failed to fetch jobs');
      }
    } catch (error) {
      console.error('Error fetching jobs:', error);
      dispatch({ type: 'SET_ERROR', payload: 'Failed to fetch jobs' });
      return [];
    }
  };

  // Fetch premium members
  const fetchPremiumMembers = async () => {
    try {
      const adminToken = localStorage.getItem('adminToken');
      const response = await fetch(`${API_BASE_URL}/api/admin/premium-members`, {
        headers: {
          'Authorization': `Bearer ${adminToken}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        console.log('Premium members data received:', data);
        const members = data.premiumMembers || data.members || [];
        dispatch({ type: 'SET_PREMIUM_MEMBERS', payload: members });
        return members;
      } else {
        const errorData = await response.json().catch(() => ({}));
        console.error('Failed to fetch premium members:', response.status, errorData);
        throw new Error(errorData.message || 'Failed to fetch premium members');
      }
    } catch (error) {
      console.error('Error fetching premium members:', error);
      dispatch({ type: 'SET_ERROR', payload: 'Failed to fetch premium members' });
      // Return empty array instead of throwing to prevent UI breakage
      dispatch({ type: 'SET_PREMIUM_MEMBERS', payload: [] });
      return [];
    }
  };

  // Fetch dashboard stats
  const fetchStats = async () => {
    try {
      const adminToken = localStorage.getItem('adminToken');
      const response = await fetch(`${API_BASE_URL}/api/admin/stats`, {
        headers: {
          'Authorization': `Bearer ${adminToken}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        dispatch({ type: 'SET_STATS', payload: data.stats });
        return data.stats;
      } else {
        throw new Error('Failed to fetch stats');
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
      dispatch({ type: 'SET_ERROR', payload: 'Failed to fetch stats' });
      return state.stats;
    }
  };

  // Fetch all data for dashboard
  const fetchDashboardData = async () => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      await Promise.all([
        fetchCandidates(),
        fetchEmployers(),
        fetchJobs(),
        fetchPremiumMembers(),
        fetchStats()
      ]);
      dispatch({ type: 'SET_LOADING', payload: false });
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      dispatch({ type: 'SET_ERROR', payload: 'Failed to load dashboard data' });
    }
  };

  const value = {
    ...state,
    token: typeof window !== 'undefined' ? localStorage.getItem('adminToken') : null,
    login,
    logout,
    fetchCandidates,
    fetchEmployers,
    fetchJobs,
    fetchPremiumMembers,
    fetchStats,
    fetchDashboardData
  };

  return (
    <AdminContext.Provider value={value}>
      {children}
    </AdminContext.Provider>
  );
};

// Custom hook to use admin context
export const useAdmin = () => {
  const context = useContext(AdminContext);
  if (!context) {
    throw new Error('useAdmin must be used within an AdminProvider');
  }
  return context;
};

export default AdminContext;
