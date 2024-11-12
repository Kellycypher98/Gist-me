import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';

const TypingIndicator = ({ roomId, socket }) => {
  const [typingUsers, setTypingUsers] = useState(new Map()); // Using Map instead of Set to store both ID and username
  const { user } = useAuth();

  useEffect(() => {
    if (!socket || !roomId) return;

    const handleUserTyping = ({ userId, username, roomId: typingRoomId }) => {
      if (typingRoomId !== roomId) return;
      
      setTypingUsers(prev => {
        const newMap = new Map(prev);
        newMap.set(userId, username);
        return newMap;
      });
    };

    const handleUserStoppedTyping = ({ userId, roomId: typingRoomId }) => {
      if (typingRoomId !== roomId) return;
      
      setTypingUsers(prev => {
        const newMap = new Map(prev);
        newMap.delete(userId);
        return newMap;
      });
    };

    socket.on('userTyping', handleUserTyping);
    socket.on('userStoppedTyping', handleUserStoppedTyping);

    // Clear typing indicators when component unmounts or room changes
    return () => {
      socket.off('userTyping', handleUserTyping);
      socket.off('userStoppedTyping', handleUserStoppedTyping);
      setTypingUsers(new Map());
    };
  }, [socket, roomId]);

  // Filter out current user and get usernames
  const typingUsernames = Array.from(typingUsers.entries())
    .filter(([userId]) => userId !== user?._id)
    .map(([_, username]) => username);

  if (typingUsernames.length === 0) return null;

  return (
    <div className="text-sm text-blue-200 italic px-4 py-2">
      <span className="inline-flex items-center">
        {typingUsernames.join(', ')}
        {' '}
        {typingUsernames.length === 1 ? 'is' : 'are'} 
        {' typing '}
        <span className="inline-flex ml-1">
          <span className="animate-bounce mx-0.5">.</span>
          <span className="animate-bounce mx-0.5 delay-100">.</span>
          <span className="animate-bounce mx-0.5 delay-200">.</span>
        </span>
      </span>
    </div>
  );
};

export default TypingIndicator;