import React, { useState } from 'react';

const SettingsPage = ({ user, updateUser }) => {
  const [onlineStatus, setOnlineStatus] = useState(user.onlineStatus);
  const [profileImage, setProfileImage] = useState(user.profileImage);
  const [username, setUsername] = useState(user.username);

  const handleProfileImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfileImage(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveChanges = () => {
    updateUser({
      username,
      onlineStatus,
      profileImage
    });
  };

  return (
    <div className="max-w-md mx-auto p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-4">Settings</h2>
      
      {/* Profile Picture */}
      <div className="mb-4">
        <label htmlFor="profile-image" className="block mb-2">Profile Picture</label>
        <input
          type="file"
          id="profile-image"
          accept="image/*"
          onChange={handleProfileImageChange}
          className="block w-full p-2 border border-gray-300 rounded-md"
        />
        {profileImage && (
          <div className="mt-2">
            <img src={profileImage} alt="Profile Preview" className="w-20 h-20 object-cover rounded-full" />
          </div>
        )}
      </div>

      {/* Username */}
      <div className="mb-4">
        <label htmlFor="username" className="block mb-2">Username</label>
        <input
          type="text"
          id="username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          className="w-full p-2 border border-gray-300 rounded-md"
        />
      </div>

      {/* Online Status */}
      <div className="mb-4 flex items-center">
        <input
          type="checkbox"
          id="online-status"
          checked={onlineStatus}
          onChange={() => setOnlineStatus(!onlineStatus)}
          className="mr-2"
        />
        <label htmlFor="online-status" className="text-lg">{onlineStatus ? 'Online' : 'Offline'}</label>
      </div>

      {/* Save Button */}
      <button
        onClick={handleSaveChanges}
        className="w-full bg-blue-500 text-white p-3 rounded-md hover:bg-blue-600"
      >
        Save Changes
      </button>
    </div>
  );
};

export default SettingsPage;
