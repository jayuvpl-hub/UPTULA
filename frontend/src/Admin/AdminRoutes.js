import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import EnhancedAdminLogin from './EnhancedAdminLogin';
import EnhancedAdminDashboard from './EnhancedAdminDashboard';

const AdminRoutes = () => {
  return (
    <Routes>
      <Route path="/login" element={<EnhancedAdminLogin />} />
      <Route path="/dashboard" element={<EnhancedAdminDashboard />} />
      <Route path="/" element={<Navigate to="/admin/login" replace />} />
      <Route path="*" element={<Navigate to="/admin/login" replace />} />
    </Routes>
  );
};

export default AdminRoutes;
