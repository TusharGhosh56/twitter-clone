import React from 'react';
import '../css/profile.css';
import defaultProfile from '/blankprof.png'
function Profile({ userData }) {
  return (
    <div className="profile-container">
      <div className="profile-header">
        <img 
          src={userData?.profileImage || defaultProfile} 
          alt="Profile" 
          className="profile-image"
          style={{ width: '150px', height: '150px', borderRadius: '50%', objectFit: 'cover' }}
        />
        <h2>{userData?.username || 'Guest User'}</h2>
        <p className="profile-email">{userData?.email || 'No email available'}</p>
      </div>
      <div className="profile-stats">
        <div className="stat">
          <span className="stat-value">0</span>
          <span className="stat-label">Posts</span>
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
    </div>
  );
}

export default Profile;

