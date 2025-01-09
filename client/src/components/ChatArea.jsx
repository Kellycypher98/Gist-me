import React from 'react';
import { IoSend } from 'react-icons/io5';
import { IoPersonAddSharp } from "react-icons/io5";

const ChatArea = ({
  showSettings,
  showRoomManager,
  selectedRoom,
  isConnected,
  messages,
  messageInput,
  setMessageInput,
  handleSendMessage,
  setShowInviteModal,
  isCurrentUserMessage,
  messagesEndRef,
  UserSettings,
  RoomManager,
  handleRoomCreated,
  token
}) => {
  return (
    <div className="flex-1 bg-white md:p-6 p-2 h-screen">
      {showSettings ? (
        <UserSettings />
      ) : showRoomManager ? (
        <RoomManager onRoomCreated={handleRoomCreated} token={token} />
      ) : selectedRoom ? (
        <div className="flex flex-col h-full">
          {/* Chat Header - Responsive */}
          <div className="flex flex-row justify-between md:items-center mb-4 gap-2 pt-16 md:pt-0">
             <h2 className="text-xl md:text-2xl font-semibold">{selectedRoom.name}</h2>
            <div className="flex items-center gap-2">
            <span className={`h-3 w-3 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}></span>
           
              <button
                onClick={() => setShowInviteModal(true)}
                className="bg-green-500 text-white px-3 py-1.5 md:px-4 md:py-2 text-sm md:text-base rounded-md hover:bg-green-600 w-fit md:w-auto"
              >
               <IoPersonAddSharp />
              </button>
            </div>
          </div>

          {/* Messages Area - Responsive */}
          <div className="flex-1 bg-gray-100 p-2 md:p-4 rounded-md overflow-y-auto">
            {messages.map((message, index) => (
              <div
                key={message._id || index}
                className={`mb-3 p-2 rounded-lg ${
                  isCurrentUserMessage(message) 
                    ? 'bg-blue-100 ml-auto' 
                    : 'bg-white'
                }`}
                style={{ maxWidth: '90%' }}
              >
                <div className="flex items-start gap-2">
                  <div className="flex-1">
                    <p className="font-semibold text-xs md:text-sm text-gray-600">
                      {message.sender?.username || 'Unknown User'}
                    </p>
                    <p className="mt-1 text-sm md:text-base break-words">
                      {message.text}
                    </p>
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

          {/* Message Input Form - Responsive */}
          <form onSubmit={handleSendMessage} className="mt-2 md:mt-4 flex gap-2 p-2 md:p-0">
            <input
              type="text"
              value={messageInput}
              onChange={(e) => setMessageInput(e.target.value)}
              className="flex-1 p-2 border border-gray-300 rounded-md text-sm md:text-base"
              placeholder="Type a message..."
              disabled={!isConnected}
            />
            <button
              type="submit"
              className="bg-blue-500 text-white p-2 rounded-md hover:bg-blue-600 disabled:bg-gray-400 disabled:cursor-not-allowed"
              disabled={!messageInput.trim() || !isConnected}
            >
              <IoSend className="w-5 h-5" />
            </button>
          </form>
        </div>
      ) : (
        <div className="flex items-center justify-center h-full">
          <p className="text-center text-gray-500 text-xl md:text-3xl px-4">
            Welcome Back! Click on the menu icon to select a ChatRoom to start chatting
          </p>
        </div>
      )}
    </div>
  );
};

export default ChatArea;