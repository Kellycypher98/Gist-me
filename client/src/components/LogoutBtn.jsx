import React from 'react';
import { useAuth } from '../context/AuthContext';

export default function() {
  const { logout } = useAuth();

  return (
   
  
      <button onClick={logout} className="logout-button">
        Logout
      </button>

  )
};


