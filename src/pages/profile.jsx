import React from 'react';
import '../css/profile.css';
import { auth } from '../js/firebase';
import { signOut } from 'firebase/auth';

function Profile({ userData }) {
  
  const totalLikes = userData?.totalLikes || 0;

  const handleLogout = async () => {
    try {
      await signOut(auth);
      // The onAuthStateChanged listener in Home will handle redirection
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  return (
    <div className="profile-container">
      <div className="profile-header">
        <img 
          src={userData?.profileImage || "https://www.gravatar.com/avatar/00000000000000000000000000000000?d=mp&f=y"} 
          alt="Profile" 
          className="profile-image"
          style={{ width: '150px', height: '150px', borderRadius: '50%', objectFit: 'cover' }}
        />
        <h2>{userData?.username || 'Guest User'}</h2>
        <p className="profile-email">{userData?.email || 'No email available'}</p>
      </div>
      <div className="profile-stats">
        <div className="stat">
          <span className="stat-value">{totalLikes}</span>
          <span className="stat-label">Likes on Posts</span>
        </div>
        <div className="stat">
          <span className="stat-value">0</span>
          <span className="stat-label">Followers</span>
        </div>
        <div className="stat">
          <span className="stat-value">0</span>
          <span className="stat-label">Following</span>
        </div>
      </div>
      <div className="profile-bio">
        <p>{userData?.bio || 'No bio available'}</p>
      </div>
      <button onClick={handleLogout} className="logout-button">Logout</button>
    </div>
  );
}

export default Profile;

