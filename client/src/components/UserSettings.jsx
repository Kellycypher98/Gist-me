import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';

const UserSettings = ({ userId }) => {
  const { user, token } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [username, setUsername] = useState(user.username);
  const [email, setEmail] = useState(user.email);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [profilePic, setProfilePic] = useState(null);
  const [preview, setPreview] = useState(user.profilePicture || '');

  // Add this console.log to debug
  console.log('Current userId:', userId);
  console.log('User from context:', user);

  // Add this check
  if (!userId && user?._id) {
    userId = user._id; // Use the id from the auth context if prop is not provided
  }

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file size (5MB limit)
      if (file.size > 5 * 1024 * 1024) {
        setError('File size must be less than 5MB');
        return;
      }
      
      // Validate file type
      if (!file.type.startsWith('image/')) {
        setError('File must be an image');
        return;
      }
      
      setProfilePic(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  // Handler for updating profile information
  const handleProfileUpdate = async () => {
    try {
      setIsLoading(true);
      setError('');

      // Ensure we have a valid userId
      if (!userId) {
        throw new Error('User ID is not available');
      }

      // Handle profile picture upload if there's a new file
      if (profilePic) {
        const formData = new FormData();
        formData.append('profilePic', profilePic);
        
        const picResponse = await fetch(
          `http://localhost:5000/api/users/${userId}/profile-pic`,
          {
            method: 'PUT',
            headers: {
              'Authorization': `Bearer ${token}`
            },
            body: formData
          }
        );
        
        if (!picResponse.ok) {
          const errorData = await picResponse.json();
          throw new Error(errorData.message || 'Failed to update profile picture');
        }
      }

      // Update username and email
      const response = await fetch(
        `http://localhost:5000/api/users/${userId}/profile`,
        {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            username,
            email
          })
        }
      );

      if (!response.ok) {
        throw new Error('Failed to update profile');
      }

      setSuccess('Profile updated successfully');
      // Reset the file input after successful upload
      setProfilePic(null);
    } catch (err) {
      console.error('Profile update error:', err);
      setError(err.message || 'An error occurred during profile update');
    } finally {
      setIsLoading(false);
    }
  };

  // Handler for changing password
  const handleChangePassword = async () => {
    try {
      setIsLoading(true);
      setError('');
      
      if (!currentPassword || !newPassword) {
        throw new Error('Please fill in all password fields');
      }
      
      const response = await fetch(
        `http://localhost:5000/api/users/${userId}/password`,
        {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            currentPassword,
            newPassword
          })
        }
      );
      
      if (!response.ok) {
        throw new Error('Failed to change password');
      }
      
      setSuccess('Password changed successfully');
      setCurrentPassword('');
      setNewPassword('');
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-semibold mb-4">User Settings</h2>
      
      {error && (
        <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
          {error}
        </div>
      )}
      
      {success && (
        <div className="mb-4 p-3 bg-green-100 border border-green-400 text-green-700 rounded">
          {success}
        </div>
      )}
      
      <div className="mb-6">
        <label className="block mb-2">Profile Picture:</label>
        <input 
          type="file" 
          accept="image/*" 
          onChange={handleFileChange}
          className="mb-2" 
        />
        {preview && (
          <img 
            src={preview} 
            alt="Profile Preview" 
            className="h-20 w-20 rounded-full object-cover" 
          />
        )}
      </div>
  
      <div className="mb-6">
        <h3 className="text-xl font-semibold mb-2">Profile Information</h3>
        <div className="mb-4">
          <label className="block text-gray-700">Username</label>
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="w-full p-2 border border-gray-300 rounded-md"
          />
        </div>
        <div className="mb-4">
          <label className="block text-gray-700">Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full p-2 border border-gray-300 rounded-md"
          />
        </div>
        <button
          onClick={handleProfileUpdate}
          disabled={isLoading}
          className={`bg-blue-500 text-white px-4 py-2 rounded-md ${
            isLoading ? 'opacity-50 cursor-not-allowed' : ''
          }`}
        >
          {isLoading ? 'Updating...' : 'Update Profile'}
        </button>
      </div>

      <div className="mb-6">
        <h3 className="text-xl font-semibold mb-2">Change Password</h3>
        <div className="mb-4">
          <label className="block text-gray-700">Current Password</label>
          <input
            type="password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            className="w-full p-2 border border-gray-300 rounded-md"
          />
        </div>
        <div className="mb-4">
          <label className="block text-gray-700">New Password</label>
          <input
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            className="w-full p-2 border border-gray-300 rounded-md"
          />
        </div>
        <button
          onClick={handleChangePassword}
          disabled={isLoading}
          className={`bg-green-500 text-white px-4 py-2 rounded-md ${
            isLoading ? 'opacity-50 cursor-not-allowed' : ''
          }`}
        >
          {isLoading ? 'Changing...' : 'Change Password'}
        </button>
      </div>
    </div>
  );
};

export default UserSettings;