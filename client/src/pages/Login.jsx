import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';

const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { login, token } = useAuth();

  useEffect(() => {
    console.log('Current token:', token);
    if (token) {
      console.log('Token exists, attempting to navigate to dashboard');
      navigate('/dashboard');
    }
  }, [token, navigate]);

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      console.log('Attempting login...');
      const response = await axios.post('http://localhost:5000/api/auth/login', {
        username,
        password
      });

      console.log('Login response:', response.data);
      
      // Fix: Access the token and user data correctly from the response structure
      const { token: newToken, user } = response.data.data;
      
      // Make sure we're passing the actual token
      console.log('Token being passed to login:', newToken);
      
      await login(newToken, user);
      console.log('Login successful, token set');
    } catch (err) {
      console.error('Login error:', err);
      setError(err.response?.data?.message || 'Login failed');
    }
  };

  return (
    <div className="max-w-sm mx-auto p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-4">Login</h2>
      {error && <p className="text-red-500 mb-4">{error}</p>}
      <form onSubmit={handleLogin}>
        <input
          type="text"
          placeholder="Username"
          className="w-full p-3 mb-4 border border-gray-300 rounded-md"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
        />
        <input
          type="password"
          placeholder="Password"
          className="w-full p-3 mb-4 border border-gray-300 rounded-md"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <button 
          type="submit" 
          className="w-full bg-blue-500 text-white p-3 rounded-md hover:bg-blue-600"
        >
          Log In
        </button>
      </form>
      <p className="mt-4">
        Don't have an account? <Link to="/signup" className="text-blue-500">Sign up</Link>
      </p>
    </div>
  );
};

export default Login;