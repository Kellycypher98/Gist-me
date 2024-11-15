import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { TailSpin } from 'react-loader-spinner';
import { useAuth } from '../context/AuthContext';
import toast, { Toaster } from 'react-hot-toast';
import axios from 'axios';


const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { login, token } = useAuth();

  useEffect(() => {
    if (token) {
      navigate('/dashboard');
    }
  }, [token, navigate]);

  const handleLogin = async (e) => {
    e.preventDefault();

    // Check for empty fields
    if (!username || !password) {
      toast.error('Please fill in all fields.');
      return;
    }

    setLoading(true);
    try {
      const response = await axios.post(`${process.env.VITE_PUBLIC_API_URL}/api/auth/login`, {
        username,
        password,
      });
      
      const { token: newToken, user } = response.data.data;
      
      await login(newToken, user);
      toast.success('Login Successful!');
      navigate('/dashboard');
    } catch (err) {
      if (err.response?.data?.message === 'Invalid credentials') {
        toast.error('Incorrect username or password.');
      } else {
        toast.error('Login failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className='h-screen content-center font-GeistMono bg-cover bg-center' style={{ backgroundImage: `url(/assets/background.jpg)` }}>
       <div className="text-center font-GeistMono">
          <h2 className="text-3xl font-bold mb-4">Welcome Back to Gist.me</h2>
          <h3 className="text-xl font-semibold mb-4">Where real connections begin. Log in to pick up right where you left off</h3>
        </div>
     <div className="max-w-sm mx-auto p-6 bg-white bg-opacity-50 rounded-lg shadow-md font-GeistMono">
      <Toaster position="top-center" reverseOrder={false} />
        <h2 className="text-2xl font-bold mb-4 text-center">Login</h2>
       
      <form onSubmit={handleLogin}>
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
            'Log In'
          )}
        </button>
      </form>
      <p className="mt-4 text-center">
        Don't have an account? <Link to="/signup" className="text-blue-500">Sign up</Link>
      </p>
      </div>
     </div>
  );
};

export default Login;
