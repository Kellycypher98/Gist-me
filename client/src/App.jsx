import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Signup from './pages/Signup';
import Login from './pages/Login';
import { useAuth } from './context/AuthContext';
import ChatDashboard from './pages/ChatDashboard';

export default function App() {
  const ProtectedRoute = ({ children }) => {
  const { token } = useAuth();
  console.log('ProtectedRoute - token:', token);
  if (!token) {
    console.log('No token, redirecting to login');
    return <Navigate to="/login" />;
  }
  return children;
};

const PublicRoute = ({ children }) => {
  const { token } = useAuth();
  console.log('PublicRoute - token:', token);
  if (token) {
    console.log('Token exists, redirecting to dashboard');
    return <Navigate to="/dashboard" />;
  }
  return children;
};
  
  return (
    <Router>
        <Routes>
          <Route path="/login" element={
            <PublicRoute>
              <Login />
            </PublicRoute>
          } />
          <Route path="/signup" element={
            <PublicRoute>
              <Signup />
            </PublicRoute>
          } />
          <Route path="/dashboard" element={
            <ProtectedRoute>
              <ChatDashboard />
            </ProtectedRoute>
          } />
          <Route path="/" element={<Navigate to="/dashboard" />} />
        </Routes>
      </Router>
  );
};