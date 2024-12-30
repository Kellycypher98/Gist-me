import React, { useState } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

const RoomManager = ({ onRoomCreated }) => {
  const [roomName, setRoomName] = useState('');
  const [message, setMessage] = useState('');
  const { token } = useAuth();

  const handleCreateRoom = async (e) => {
    e.preventDefault();
    if (!roomName.trim()) return;

    try {
      const API_URL = process.env.VITE_PUBLIC_API_URL || '';
      const response = await axios.post(
        `${API_URL}/api/rooms`,
        { name: roomName },
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );
      
      if (response.data) {
        onRoomCreated(response.data);
        setMessage(`Room "${roomName}" created successfully!`);
        setRoomName('');
      }
    } catch (error) {
      console.error('Error creating room:', error);
      setMessage(error.response?.data?.message || 'Failed to create room.');
    }
  };

  return (
    <div className="bg-gray-100 p-4 rounded-md mb-6 font-GeistMono">
      <h2 className="text-xl font-semibold mb-4">Create New Room</h2>
      
      <form onSubmit={handleCreateRoom} className="mb-4">
        <input
          type="text"
          value={roomName}
          onChange={(e) => setRoomName(e.target.value)}
          placeholder="Room Name"
          className="w-full p-2 border border-gray-300 rounded-md mb-2"
        />
        <button
          type="submit"
          className="bg-blue-500 text-white p-2 rounded-md w-full hover:bg-blue-600"
        >
          Create Room
        </button>
      </form>

      {message && (
        <div className={`p-2 rounded-md ${
          message.includes('successfully') ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
        }`}>
          {message}
        </div>
      )}
    </div>
  );
};

export default RoomManager;