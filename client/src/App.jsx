import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Signup from './pages/Signup';
import Login from './pages/Login';
import { useAuth } from './context/AuthContext';
import ChatDashboard from './pages/ChatDashboard';
import UserSettings from './components/UserSettings';

export default function App() {
  const { token } = useAuth();

  const ProtectedRoute = ({ children }) => {
    if (!token) {
      console.log('No token, redirecting to login');
      return <Navigate to="/login" />;
    }
    return children;
  };

  const PublicRoute = ({ children }) => {
    if (token) {
      console.log('Token exists, redirecting to dashboard');
      return <Navigate to="/dashboard" />;
    }
    return children;
  };

  return (
    <Router>
      <Routes>
        <Route 
          path="/" 
          element={token ? <Navigate to="/dashboard" /> : <Navigate to="/login" />} 
        />

        <Route 
          path="/login" 
          element={
            <PublicRoute>
              <Login />
            </PublicRoute>
          } 
        />

        <Route 
          path="/signup" 
          element={
            <PublicRoute>
              <Signup />
            </PublicRoute>
          } 
        />

        <Route 
          path="/dashboard" 
          element={
            <ProtectedRoute>
              <ChatDashboard />
            </ProtectedRoute>
          } 
        />

        <Route 
          path="/settings" 
          element={
            <ProtectedRoute>
              <UserSettings />
            </ProtectedRoute>
          } 
        />
      </Routes>
    </Router>
  );
}
