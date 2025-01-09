import React, { useState } from 'react';
import { RiChatNewLine, RiMenu2Fill } from "react-icons/ri";
import LogoutBtn from './LogoutBtn';
import { IoArrowBack } from "react-icons/io5";
import { IoMdSettings } from "react-icons/io";
import { FaRegTrashAlt } from "react-icons/fa";
import { IoClose } from "react-icons/io5";

const Sidebar = ({ 
  rooms, 
  selectedRoom, 
  setSelectedRoom, 
  showRoomManager, 
  setShowRoomManager,
  showSettings,
  setShowSettings,
  canDeleteRoom,
  handleDeleteClick,
  showDeleteDialog,
  setShowDeleteDialog,
  setRoomToDelete,
  confirmDelete,
  roomToDelete
}) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const handleRoomClick = (room) => {
    setSelectedRoom(room);
    setShowRoomManager(false);
    setIsSidebarOpen(false);
  };

  return (
    <>
      {/* Mobile Navigation Bar */}
      <div className="fixed top-0 left-0 right-0 z-50 md:hidden">
        <div className="bg-gray-800 text-white h-16 px-4 flex items-center justify-between shadow-lg">
          <button 
            onClick={toggleSidebar}
            className="p-2 hover:bg-gray-700 rounded-md"
          >
            {isSidebarOpen ? <IoClose size={24} /> : <RiMenu2Fill size={24} />}
          </button>
          
          <h1 className="text-xl font-bold">Gist.me</h1>
          
          <button
            onClick={() => setShowSettings(!showSettings)}
            className="p-2 hover:bg-gray-700 rounded-md"
          >
            <IoMdSettings size={24} />
          </button>
        </div>
      </div>
      
      {/* Sidebar - Full screen on mobile, regular sidebar on desktop */}
      <div
        className={`fixed md:relative w-full md:w-1/4 bg-gray-800 text-white h-screen overflow-y-auto transition-all duration-300 ease-in-out ${
          isSidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        } z-40 ${isSidebarOpen ? 'pt-16' : 'md:pt-4'}`}
      >
        <div className="p-4">
          {/* Hide title on mobile since it's in the navbar */}
          <h1 className="text-xl font-bold mb-4 hidden md:block">Gist.me</h1>

          <ul className="mb-4">
            <h2 className="text-lg font-bold mb-4">ChatRooms</h2>
            {rooms.map((room) => (
              <li
                key={room._id}
                className={`cursor-pointer p-2 mb-2 rounded-md ${
                  selectedRoom?._id === room._id ? 'bg-blue-600' : 'bg-gray-700'
                } hover:bg-blue-500 transition-colors duration-200`}
                onClick={() => handleRoomClick(room)}
              >
                <div className="flex justify-between items-center">
                  <div className="flex-1">
                    <span className="font-bold block">{room.name}</span>
                    <p className="text-sm text-gray-400">
                      Created by: {room.createdBy?.username || 'Unknown'}
                    </p>
                  </div>
                  {canDeleteRoom(room) && (
                    <button
                      onClick={(e) => handleDeleteClick(room, e)}
                      className="p-1 hover:bg-red-500 rounded-full transition-colors duration-200"
                      title="Delete room"
                    >
                      <FaRegTrashAlt />
                    </button>
                  )}
                </div>
              </li>
            ))}
          </ul>

          <div className="flex flex-col gap-2">
            <button
              onClick={() => {
                setShowRoomManager(!showRoomManager);
                setIsSidebarOpen(false);
              }}
              className="text-white p-2 w-full rounded-md hover:bg-blue-600 flex items-center gap-3 transition-colors duration-200"
            >
              {showRoomManager ? (
                <>
                  <IoArrowBack /> Back to Chat
                </>
              ) : (
                <>
                  <RiChatNewLine /> Create new chat
                </>
              )}
            </button>

            <button
              onClick={() => {
                setShowSettings(!showSettings);
                setIsSidebarOpen(false);
              }}
              className="text-white p-2 w-full rounded-md hover:bg-blue-600 flex items-center gap-3 transition-colors duration-200 md:flex"
            >
              {showSettings ? (
                <>
                  <IoArrowBack /> Back to Dashboard
                </>
              ) : (
                <>
                  <IoMdSettings /> Settings
                </>
              )}
            </button>

            <LogoutBtn className="w-full" />
          </div>
        </div>
      </div>

      {/* Delete Dialog */}
      {showDeleteDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg w-96 max-w-[90%] mx-4">
            <h3 className="text-xl text-black font-semibold mb-4">Delete Room</h3>
            <p className="mb-4 text-black">
              Are you sure you want to delete "{roomToDelete?.name}"? This action cannot be undone.
            </p>
            <div className="flex justify-end gap-4">
              <button
                onClick={() => {
                  setShowDeleteDialog(false);
                  setRoomToDelete(null);
                }}
                className="px-4 py-2 bg-gray-300 rounded-md hover:bg-gray-400"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                className="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Overlay for mobile - closes sidebar when clicking outside */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-30 md:hidden"
          onClick={toggleSidebar}
        />
      )}
    </>
  );
};

export default Sidebar;