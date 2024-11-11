import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';

const Signup = ({ setToken }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSignup = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post('http://localhost:5000/api/auth/signup', { username, password, email });
      setToken(response.data.token);
      navigate('/'); // Redirect to chat page
    } catch (err) {
      setError('Signup failed');
    }
  };

  return (
    <div className="max-w-sm mx-auto p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-4">Signup</h2>
      {error && <p className="text-red-500 mb-4">{error}</p>}
      <form onSubmit={handleSignup}>
        <input
          type="email"
          placeholder="Email"
          className="w-full p-3 mb-4 border border-gray-300 rounded-md"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
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
        <button type="submit" className="w-full bg-blue-500 text-white p-3 rounded-md hover:bg-blue-600">
          Sign Up
        </button>
      </form>
      <p className="mt-4">
        Already have an account? <Link to="/login" className="text-blue-500">Log in</Link>
      </p>
    </div>
  );
};

export default Signup;
