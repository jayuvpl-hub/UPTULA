import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import CSRLogin from './CSRLogin';
import CSRDashboard from './CSRDashboard';

const CSRoutes = () => {
  return (
    <Routes>
      <Route path="/login" element={<CSRLogin />} />
      <Route path="/dashboard" element={<CSRDashboard />} />
      <Route path="/" element={<Navigate to="/cs/login" replace />} />
      <Route path="*" element={<Navigate to="/cs/login" replace />} />
    </Routes>
  );
};

export default CSRoutes;


