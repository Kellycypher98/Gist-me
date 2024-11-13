import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { io } from 'socket.io-client';
import RoomManager from '../components/RoomManager';
import LogoutBtn from '../components/LogoutBtn';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';
import TypingIndicator from '../components/TypingIndicator';
import UserSettings from '../components/UserSettings';


const ChatDashboard = () => {
  const [rooms, setRooms] = useState([]);
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [messages, setMessages] = useState([]);
  const [messageInput, setMessageInput] = useState('');
  const [showRoomManager, setShowRoomManager] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteLink, setInviteLink] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const { token, user } = useAuth();
  const socketRef = useRef();
  const messagesEndRef = useRef(null);
  const typingTimeout = useRef(null);


  // Initialize socket connection
  useEffect(() => {
    if (!token || !user) return;

    socketRef.current = io('http://localhost:5000', {
      auth: { token },
      transports: ['websocket'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000
    });

    socketRef.current.on('connect', () => {
      console.log('Socket connected');
      setIsConnected(true);
    });

    socketRef.current.on('disconnect', () => {
      console.log('Socket disconnected');
      setIsConnected(false);
    });

    socketRef.current.on('connect_error', (error) => {
      console.error('Socket connection error:', error);
      setIsConnected(false);
    });

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, [token, user]);

  // Handle real-time events
  useEffect(() => {
    if (!socketRef.current) return;

    socketRef.current.on('newMessage', (message) => {
      setMessages(prev => [...prev, message]);
      scrollToBottom();
    });

    socketRef.current.on('messageUpdate', ({ messageId, updatedMessage }) => {
      setMessages(prev =>
        prev.map(msg => msg._id === messageId ? { ...msg, ...updatedMessage } : msg)
      );
    });

    socketRef.current.on('messageDelete', (messageId) => {
      setMessages(prev => prev.filter(msg => msg._id !== messageId));
    });

    socketRef.current.on('roomUpdate', (updatedRoom) => {
      setRooms(prev =>
        prev.map(room => room._id === updatedRoom._id ? updatedRoom : room)
      );
    });

    return () => {
      socketRef.current.off('newMessage');
      socketRef.current.off('messageUpdate');
      socketRef.current.off('messageDelete');
      socketRef.current.off('roomUpdate');
    };
  }, []);

  // Fetch initial rooms
  useEffect(() => {
    if (!user || !token) {
      console.log('No user or token available');
      return;
    }
    fetchRooms();
  }, [token, user]);

  const fetchRooms = async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/rooms', {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.data) {
        setRooms(response.data);
      }
    } catch (error) {
      console.error('Error fetching rooms:', error);
      setRooms([]);
    }
  };

  // Handle room selection and message fetching
  useEffect(() => {
    if (!selectedRoom || !token) return;

    const fetchMessages = async () => {
      try {
        const response = await axios.get(
          `http://localhost:5000/api/rooms/${selectedRoom._id}/messages`,
          { headers: { Authorization: `Bearer ${token}` } }
        );

        const senderIds = new Set(
          response.data.map(message => 
            typeof message.sender === 'string' ? message.sender : message.sender._id
          )
        );

        const userResponses = await Promise.all(
          Array.from(senderIds).map(senderId =>
            axios.get(`http://localhost:5000/api/users/${senderId}`, {
              headers: { Authorization: `Bearer ${token}` }
            })
            .then(response => ({
              success: true,
              userId: senderId,
              userData: response.data
            }))
            .catch(() => ({
              success: false,
              userId: senderId,
              userData: { _id: senderId, username: 'Unknown User' }
            }))
          )
        );

        const userDataMap = {};
        userResponses.forEach(response => {
          userDataMap[response.userId] = response.userData;
        });

        const processedMessages = response.data.map(message => {
          const senderId = typeof message.sender === 'string' ? message.sender : message.sender._id;
          return {
            ...message,
            sender: userDataMap[senderId] || { _id: senderId, username: 'Unknown User' }
          };
        });

        setMessages(processedMessages);
        scrollToBottom();
      } catch (error) {
        console.error('Error in message fetching process:', error);
        setMessages([]);
      }
    };

    fetchMessages();

    // Join the room in Socket.IO
    if (socketRef.current) {
      if (socketRef.current.previousRoom) {
        socketRef.current.emit('leaveRoom', socketRef.current.previousRoom);
      }
      socketRef.current.emit('joinRoom', selectedRoom._id);
      socketRef.current.previousRoom = selectedRoom._id;
    }

    return () => {
      if (socketRef.current && socketRef.current.previousRoom) {
        socketRef.current.emit('leaveRoom', socketRef.current.previousRoom);
      }
    };
  }, [selectedRoom, token]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!messageInput.trim() || !selectedRoom || !token || !user || !isConnected) return;

    try {
      socketRef.current.emit('sendMessage', {
        roomId: selectedRoom._id,
        text: messageInput,
        sender: {
          _id: user._id,
          username: user.username
        }
      });

      setMessageInput('');
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  const handleGenerateInvite = async () => {
    if (!selectedRoom || !token || !inviteEmail) return;

    try {
      const response = await axios.post(
        `http://localhost:5000/api/rooms/${selectedRoom._id}/invite`,
        { emails: [inviteEmail] },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.data?.invitationLinks?.[0]) {
        setInviteLink(response.data.invitationLinks[0].inviteLink);
      }
      setInviteEmail('');
    } catch (error) {
      console.error('Error generating invite:', error);
    }
  };

  const handleRoomCreated = async (newRoom) => {
    await fetchRooms();
    setShowRoomManager(false);
  };

  const isCurrentUserMessage = (message) => {
    if (!user || !message?.sender) return false;
    return message.sender._id === user._id;
  };

const handleMessageInputChange = (e) => {
    setMessageInput(e.target.value);
    
    if (!selectedRoom) return;

    // Emit typing event
    if (!typingTimeout.current) {
      socketRef.current?.emit('typing', { roomId: selectedRoom._id });
    }
    
    // Clear existing timeout
    clearTimeout(typingTimeout.current);
    
    // Set new timeout
    typingTimeout.current = setTimeout(() => {
      socketRef.current?.emit('stopTyping', { roomId: selectedRoom._id });
      typingTimeout.current = null;
    }, 1000);
  };

  return (
    <div className="flex h-screen">
      {/* Sidebar */}
      <div className="w-1/4 bg-gray-800 text-white p-4">
        <h2 className="text-xl font-bold mb-4">Rooms</h2>
        
        <button
          onClick={() => setShowRoomManager(!showRoomManager)}
          className="bg-blue-500 text-white p-2 rounded-md mb-4 w-full hover:bg-blue-600"
        >
          {showRoomManager ? 'Back to Chat' : 'Create Room'}
        </button>

        <button
          onClick={() => setShowSettings(!showSettings)}
          className="text-gray-700 hover:text-blue-500 mb-4"
        >
          {showSettings ? 'Back to Dashboard' : 'Settings'}
        </button>

        <ul>
          {rooms.map((room) => (
            <li
              key={room._id}
              className={`cursor-pointer p-2 mb-2 rounded-md ${
                selectedRoom?._id === room._id ? 'bg-blue-600' : 'bg-gray-700'
              }`}
              onClick={() => {
                setSelectedRoom(room);
                setShowRoomManager(false);
              }}
            >
              <span className="font-bold">{room.name}</span>
              <p className="text-sm text-gray-400">
                Created by: {room.createdBy?.username || 'Unknown'}
              </p>
            </li>
          ))}
        </ul>
      
        <LogoutBtn />
      </div>

      {/* Main chat area */}
      <div className="flex-1 bg-white p-6">
        {showSettings ? (<UserSettings />) : (
        
       
        showRoomManager ? (
          <RoomManager onRoomCreated={handleRoomCreated} token={token} />
        ) : selectedRoom ? (
          <div className="flex flex-col h-full">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-semibold">{selectedRoom.name}</h2>
              <div className="flex items-center gap-2">
                <span className={`h-3 w-3 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}></span>
                <button
                  onClick={() => setShowInviteModal(true)}
                  className="bg-green-500 text-white px-4 py-2 rounded-md hover:bg-green-600"
                >
                  Invite User
                </button>
              </div>
            </div>

            {/* Messages Area */}
            <div className="flex-1 bg-gray-100 p-4 rounded-md overflow-y-auto">
              {messages.map((message, index) => (
                <div 
                  key={message._id || index} 
                  className={`mb-4 p-2 rounded-lg ${
                    isCurrentUserMessage(message) ? 'bg-blue-100 ml-auto' : 'bg-white'
                  }`}
                  style={{ maxWidth: '80%' }}
                >
                  <div className="flex items-start gap-2">
                    <div className="flex-1">
                      <p className="font-semibold text-sm text-gray-600">
                        {message.sender?.username || 'Unknown User'}
                      </p>
                      <p className="mt-1">{message.text}</p>
                      {message.createdAt && (
                        <p className="text-xs text-gray-500 mt-1">
                          {new Date(message.createdAt).toLocaleTimeString()}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
                <div ref={messagesEndRef} />
               
              </div>
              

   
            {/* Message Input Form */}
            <form onSubmit={handleSendMessage} className="mt-4 flex">
              <input
                type="text"
                value={messageInput}
                onChange={(e) => setMessageInput(e.target.value)}
                className="flex-1 p-2 border border-gray-300 rounded-md"
                placeholder="Type a message..."
                disabled={!isConnected}
              />
              <button
                type="submit"
                className="ml-2 bg-blue-500 text-white p-2 rounded-md hover:bg-blue-600 disabled:bg-gray-400"
                disabled={!messageInput.trim() || !isConnected}
              >
                Send
              </button>
            </form>
          </div>
        ) : (
          <p className="text-center text-gray-500">Select a room to start chatting</p>
        ))}
      </div>

      {/* Invite Modal */}
      {showInviteModal && selectedRoom && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white p-6 rounded-lg w-96">
            <h3 className="text-xl font-semibold mb-4">Invite to {selectedRoom.name}</h3>
            <input
              type="email"
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
              placeholder="Enter email"
              className="w-full p-2 border border-gray-300 rounded-md mb-4"
            />
            <button
              onClick={handleGenerateInvite}
              className="bg-blue-500 text-white p-2 rounded-md w-full mb-4"
              disabled={!inviteEmail}
            >
              Generate Invite Link
            </button>
            
            {inviteLink && (
              <div className="mb-4">
                <p className="font-semibold mb-2">Invitation Link:</p>
                <div className="bg-gray-100 p-2 rounded-md break-all">
                  {inviteLink}
                </div>
              </div>
            )}
            
            <button
              onClick={() => {
                setShowInviteModal(false);
                setInviteLink('');
                setInviteEmail('');
              }}
              className="bg-gray-500 text-white p-2 rounded-md w-full"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChatDashboard;