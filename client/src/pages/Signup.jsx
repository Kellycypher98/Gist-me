import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { TailSpin } from 'react-loader-spinner';
import toast, { Toaster } from 'react-hot-toast';
import axios from 'axios';
import { VITE_PUBLIC_API_URL } from '../config';

const Signup = ({ setToken }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSignup = async (e) => {
    e.preventDefault();

    // Check for empty fields
    if (!username || !password || !email) {
      toast.error('Please fill in all fields.');
      return;
    }

    setLoading(true);
    try {
      const response = await axios.post(`${process.env.VITE_PUBLIC_API_URL}/api/auth/signup`, { username, password, email });
      setToken(response.data.token);
      toast.success('Signup Successful!');
      navigate('/'); 
    } catch (err) {
      if (err.response?.data?.message === 'User already exists') {
        toast.error('User already exists. Please log in.');
      } else {
        toast.error('Signup failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className='h-screen  content-center font-GeistMono'>
         <div className="text-center">
          <h2 className="text-3xl font-bold mb-4">Join Chat.me Today</h2>
          <p className="text-xl font-semibold mb-4">Create an account to start meaningful conversations. It’s free, fast, and fun!</p>
        </div>
    <div className="max-w-sm mx-auto p-6 bg-white rounded-lg shadow-md">
        <Toaster position="top-center" reverseOrder={false} />
     
      <h2 className="text-2xl font-bold mb-4">Signup</h2>
      <form onSubmit={handleSignup}>
        <input
          type="email"
          placeholder="Email"
          className="w-full p-3 mb-4 border border-gray-300 rounded-md"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          disabled={loading}
        />
        <input
          type="text"
          placeholder="Username"
          className="w-full p-3 mb-4 border border-gray-300 rounded-md"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          disabled={loading}
        />
        <input
          type="password"
          placeholder="Password"
          className="w-full p-3 mb-4 border border-gray-300 rounded-md"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          disabled={loading}
        />
        <button 
          type="submit" 
          className="w-full bg-blue-500 text-white p-3 rounded-md hover:bg-blue-600"
          disabled={loading}
        >
          {loading ? (
            <div className="flex justify-center items-center">
              <TailSpin height="20" width="20" color="#ffffff" ariaLabel="loading" visible={true} />
            </div>
          ) : (
            'Sign Up'
          )}
        </button>
      </form>
      <p className="mt-4 text-center">
        Already have an account? <Link to="/login" className="text-blue-500">Log in</Link>
      </p>
      </div>
      </div>
  );
};

export default Signup;
