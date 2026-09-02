import React from 'react';
import { useAdmin } from './AdminContext';

const AdminDebug = () => {
  const { isAuthenticated, loading, error, admin } = useAdmin();

  return (
    <div style={{ 
      position: 'fixed', 
      top: '10px', 
      right: '10px', 
      background: 'rgba(0,0,0,0.8)', 
      color: 'white', 
      padding: '10px', 
      borderRadius: '5px',
      fontSize: '12px',
      zIndex: 9999
    }}>
      <h4>Admin Debug Info</h4>
      <p><strong>Loading:</strong> {loading ? 'Yes' : 'No'}</p>
      <p><strong>Authenticated:</strong> {isAuthenticated ? 'Yes' : 'No'}</p>
      <p><strong>Error:</strong> {error || 'None'}</p>
      <p><strong>Admin:</strong> {admin ? JSON.stringify(admin) : 'None'}</p>
      <p><strong>Token:</strong> {localStorage.getItem('adminToken') ? 'Present' : 'Missing'}</p>
      <p><strong>Current URL:</strong> {window.location.href}</p>
    </div>
  );
};

export default AdminDebug;
