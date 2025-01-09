import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { io } from 'socket.io-client';
import RoomManager from '../components/RoomManager';
import LogoutBtn from '../components/LogoutBtn';
import { useAuth } from '../context/AuthContext';
import UserSettings from '../components/UserSettings';
import { RiChatNewLine } from "react-icons/ri";
import { IoArrowBack } from "react-icons/io5";
import { IoMdSettings } from "react-icons/io";
import { IoSend } from "react-icons/io5";
import { FaRegTrashAlt } from "react-icons/fa";
import toast, { Toaster } from 'react-hot-toast';
import Sidebar from '../components/SideBar';
import ChatArea from '../components/ChatArea';


const API_URL = import.meta.env.VITE_PUBLIC_API_URL;

const ChatDashboard = () => {
  const [rooms, setRooms] = useState([]);
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [userName, setUsername] = useState('');
  const [messages, setMessages] = useState([]);
  const [messageInput, setMessageInput] = useState('');
  const [showRoomManager, setShowRoomManager] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteLink, setInviteLink] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [roomToDelete, setRoomToDelete] = useState(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const { token, user } = useAuth();
  const socketRef = useRef();
  const messagesEndRef = useRef(null);
  const typingTimeout = useRef(null);


  // Initialize socket connection
  useEffect(() => {
    if (!token || !user) return;

    socketRef.current = io(API_URL, {
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
      const response = await axios.get(`${API_URL}/api/rooms`, {
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
          `${API_URL}/api/rooms/${selectedRoom._id}/messages`,
          { headers: { Authorization: `Bearer ${token}` } }
        );

        const senderIds = new Set(
          response.data.map(message => 
            typeof message.sender === 'string' ? message.sender : message.sender._id
          )
        );

        const userResponses = await Promise.all(
          Array.from(senderIds).map(senderId =>
            axios.get(`${API_URL}/api/users/${senderId}`, {
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
        `${API_URL}/api/rooms/${selectedRoom._id}/invite`,
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

    const handleDeleteClick = (room, e) => {
    e.stopPropagation();
    setRoomToDelete(room);
    setShowDeleteDialog(true);
  };

  // Check if user can delete room
  const canDeleteRoom = (room) => {
    return room.createdBy?._id === user?._id;
  };

  // Handle room deletion
  const handleDeleteRoom = async (roomId) => {
    if (!token) return;
    

    try {
      await axios.delete(`${API_URL}/api/rooms/${roomId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setRooms(prevRooms => prevRooms.filter(room => room._id !== roomId));
      
      if (selectedRoom?._id === roomId) {
        setSelectedRoom(null);
        setMessages([]);
      }

      toast.success('Room deleted successfully');
    } catch (error) {
      console.error('Error deleting room:', error);
      toast.error(error.response?.data?.message || 'Failed to delete room');
    }
  };

  // Handle delete confirmation
  const confirmDelete = async () => {
    if (roomToDelete) {
      await handleDeleteRoom(roomToDelete._id);
    }
    setShowDeleteDialog(false);
    setRoomToDelete(null);
  };


  return (
    <div className="flex h-screen font-GeistMono flex md:flex-row flex-col">
      <Toaster/>
      {/* Sidebar */}
      <Sidebar 
        rooms={rooms}
        selectedRoom={selectedRoom}
        setSelectedRoom={setSelectedRoom}
        showRoomManager={showRoomManager}
        setShowRoomManager={setShowRoomManager}
        showSettings={showSettings}
        setShowSettings={setShowSettings}
        canDeleteRoom={canDeleteRoom}
        handleDeleteClick={handleDeleteClick}
        showDeleteDialog={showDeleteDialog}
        setShowDeleteDialog={setShowDeleteDialog}
        setRoomToDelete={setRoomToDelete}
        confirmDelete={confirmDelete}
        roomToDelete={roomToDelete}
      />

      {/* Main chat area */}
      <ChatArea
        showSettings={showSettings}
        showRoomManager={showRoomManager}
        selectedRoom={selectedRoom}
        isConnected={isConnected}
        messages={messages}
        messageInput={messageInput}
        setMessageInput={setMessageInput}
        handleSendMessage={handleSendMessage}
        setShowInviteModal={setShowInviteModal}
        isCurrentUserMessage={isCurrentUserMessage}
        messagesEndRef={messagesEndRef}
        UserSettings={UserSettings}
        RoomManager={RoomManager}
        handleRoomCreated={handleRoomCreated}
        token={token}
      
      />

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