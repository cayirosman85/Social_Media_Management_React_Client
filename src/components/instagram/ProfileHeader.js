import React from "react";

const ProfileHeader = ({ instagramData, onStoryClick }) => {
  return (
    <div className="profile-header">
      <div className="profile-img-container" onClick={onStoryClick}>
        <img
          src={instagramData.business_discovery.profile_picture_url}
          alt="Profile"
          className="profile-img"
        />
      </div>
      <div className="profile-info">
        <div className="username-actions">
          <span className="username">@{instagramData.business_discovery.username}</span>
        </div>
        <div className="stats">
          <span><strong>{instagramData.business_discovery.media_count}</strong> posts</span>
          <span><strong>{instagramData.business_discovery.followers_count}</strong> followers</span>
          <span><strong>{instagramData.business_discovery.follows_count}</strong> following</span>
        </div>
        <p className="name">{instagramData.business_discovery.name}</p>
        <p className="bio">{instagramData.business_discovery.biography}</p>
      </div>
    </div>
  );
};

export default ProfileHeader;