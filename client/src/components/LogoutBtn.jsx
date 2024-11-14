import React from 'react';
import { useAuth } from '../context/AuthContext';
import { MdOutlineLogout } from "react-icons/md";

export default function() {
  const { logout } = useAuth();

  return (
   
 
      <button onClick={logout} className="text-white p-2  mb-4 w-fit hover:bg-blue-600 flex items-center gap-3">
       <MdOutlineLogout /> Logout 
      </button>
  )
};


