import React, { useState, useEffect } from "react";
import ProfileHeader from "../../components/instagram/ProfileHeader.js";
import TabNavigation from "../../components/instagram/TabNavigation.js";
import InstagramPost from "../../components/instagram/InstagramPost.js";
import NewPostModal from "../../components/instagram/NewPostModal.js";
import InstagramStory from "../../components/instagram/InstagramStory.js";
import CarouselSlider from "../../components/instagram/CarouselSlider.js";
import { fetchInstagramData } from "../../services/instagram/instagramService"; // Import the service
import "./Dashboard.css";

const Dashboard = () => {
  const [activeTab, setActiveTab] = useState("POSTS");
  const [selectedPost, setSelectedPost] = useState(null);
  const [selectedStoryIndex, setSelectedStoryIndex] = useState(null);
  const [showNewPostModal, setShowNewPostModal] = useState(false);
  const [isLoading, setIsLoading] = useState(true); // Start as true since we'll fetch on mount
  const [instagramData, setInstagramData] = useState(null); // Local state for Instagram data
  const [error, setError] = useState(null); // To handle fetch errors

  // Fetch Instagram data when Dashboard mounts
  useEffect(() => {
    const loadInstagramData = async () => {
      setIsLoading(true);
      try {
        const data = await fetchInstagramData(
          "17841473036355290",
          "osmancayir73",
          "EAAZAde8LZA8zIBO4O8QsOQmyMMMShi79cCZBMRJZCjbSbXG7Y3ZAQ4OGvJN1vi8LYLeNx6K9pbxpFuU2saC3lWWt43za1ggpCu9YONtmCuwucaWVgtYYqRcG2oMtuHPhxq6x4n3ImiE3TzXf4IzMHxMtuDbwNfT52ZA6yjkwWabhrLZCrb7zqWzdkjZBApQJmNntUgZDZD"
        );
        setInstagramData(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };

    loadInstagramData();
  }, []); // Empty dependency array means it runs once on mount

  const handleTabClick = (tab) => {
    setActiveTab(tab);
  };

  const handleNewPostSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    // Implement actual post publishing logic here using instagramService.js
    setIsLoading(false);
    setShowNewPostModal(false);
    alert("Post published successfully!");
  };

  if (isLoading) {
    return (
      <div className="loader-overlay">
        <div className="loader"></div>
      </div>
    );
  }

  if (error) {
    return <div className="error">Error: {error}</div>;
  }

  return (
    <div className="profile-container">
      {instagramData && (
        <>
          <ProfileHeader
            instagramData={instagramData}
            onStoryClick={() => setSelectedStoryIndex(0)}
          />
          <div
            style={{
              display: "flex",
              justifyContent: "start",
              alignItems: "center",
              padding: "16px 0",
              gap: "20px",
            }}
          >
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: "8px",
              }}
            >
              <button
                style={{
                  backgroundColor: "#e9e9e9",
                  border: "none",
                  borderRadius: "50%",
                  width: "56px",
                  height: "56px",
                  cursor: "pointer",
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "center",
                  boxShadow: "0 2px 4px rgba(0, 0, 0, 0.1)",
                  transition: "background-color 0.2s",
                }}
                onMouseOver={(e) => (e.currentTarget.style.backgroundColor = "#d9d9d9")}
                onMouseOut={(e) => (e.currentTarget.style.backgroundColor = "#e9e9e9")}
                onClick={() => setShowNewPostModal(true)}
                aria-label="Add new post"
              >
                <svg
                  style={{ color: "#000", fontSize: "24px" }}
                  fill="currentColor"
                  height="24"
                  width="24"
                  viewBox="0 0 24 24"
                >
                  <title>Plus icon</title>
                  <path d="M21 11.3h-8.2V3c0-.4-.3-.8-.8-.8s-.8.4-.8.8v8.2H3c-.4 0-.8.3-.8.8s.3.8.8.8h8.2V21c0 .4.3.8.8.8s.8-.3.8-.8v-8.2H21c.4 0 .8-.3.8-.8s-.4-.7-.8-.7z" />
                </svg>
              </button>
              <span
                style={{
                  fontSize: "14px",
                  color: "#000",
                  fontWeight: "500",
                  textAlign: "center",
                }}
              >
                New Post
              </span>
            </div>
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: "8px",
              }}
            >
              <button
                style={{
                  backgroundColor: "#e9e9e9",
                  border: "none",
                  borderRadius: "50%",
                  width: "56px",
                  height: "56px",
                  cursor: "pointer",
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "center",
                  boxShadow: "0 2px 4px rgba(0, 0, 0, 0.1)",
                  transition: "background-color 0.2s",
                }}
                onMouseOver={(e) => (e.currentTarget.style.backgroundColor = "#d9d9d9")}
                onMouseOut={(e) => (e.currentTarget.style.backgroundColor = "#e9e9e9")}
                onClick={() => setSelectedStoryIndex(0)}
                aria-label="Add new story"
              >
                <svg
                  style={{ color: "#000", fontSize: "24px" }}
                  fill="currentColor"
                  height="24"
                  width="24"
                  viewBox="0 0 24 24"
                >
                  <title>Story icon</title>
                  <path d="M12 2c5.514 0 10 4.486 10 10s-4.486 10-10 10S2 17.514 2 12 6.486 2 12 2m0-2C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm0 4c-4.418 0-8 3.582-8 8s3.582 8 8 8 8-3.582 8-8-3.582-8-8-8zm0 2c3.309 0 6 2.691 6 6s-2.691 6-6 6-6-2.691-6-6 2.691-6 6-6z" />
                </svg>
              </button>
              <span
                style={{
                  fontSize: "14px",
                  color: "#000",
                  fontWeight: "500",
                  textAlign: "center",
                }}
              >
                New Story
              </span>
            </div>
          </div>
          <TabNavigation activeTab={activeTab} onTabClick={handleTabClick} />
          <div className="content">
            {activeTab === "POSTS" && (
              <div className="media-feed">
                <div className="media-grid">
                  {instagramData.business_discovery.media.data.map((media) => (
                    <InstagramPost
                      key={media.id}
                      post={media}
                      onClick={() => setSelectedPost(media)}
                    />
                  ))}
                </div>
              </div>
            )}
            {activeTab === "REELS" && (
              <div className="media-feed">
                <div className="media-grid">
                  {instagramData.business_discovery.media.data
                    .filter(
                      (media) =>
                        media.media_type === "VIDEO" &&
                        media.media_product_type === "REELS"
                    )
                    .map((media) => (
                      <InstagramPost
                        key={media.id}
                        post={media}
                        onClick={() => setSelectedPost(media)}
                      />
                    ))}
                </div>
              </div>
            )}
            {activeTab === "TAGGED" && (
              <div className="media-feed">
                <div className="media-grid">
                  {instagramData.business_discovery.tags.data.map((tag, index) => (
                    <InstagramPost
                      key={tag.id || index}
                      post={tag}
                      onClick={() => setSelectedPost(tag)}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
          {showNewPostModal && (
            <NewPostModal
              onSubmit={handleNewPostSubmit}
              isLoading={isLoading}
              onClose={() => setShowNewPostModal(false)}
            />
          )}
          {selectedPost && (
            <div className="modal" onClick={() => setSelectedPost(null)}>
              <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                <span className="close" onClick={() => setSelectedPost(null)}>
                  ×
                </span>
                <div className="modal-body">
                  <div className="modal-image">
                    {selectedPost.media_type === "IMAGE" ? (
                      <img
                        src={selectedPost.media_url}
                        alt="Post"
                        className="modal-img"
                      />
                    ) : selectedPost.media_type === "VIDEO" ? (
                      <video
                        src={selectedPost.media_url}
                        className="modal-img"
                        controls
                        autoPlay
                        muted
                      />
                    ) : selectedPost.media_type === "CAROUSEL_ALBUM" ? (
                      <CarouselSlider media={selectedPost} />
                    ) : null}
                  </div>
                  <div className="post-details-section">
                    {/* Add more details if needed */}
                  </div>
                </div>
              </div>
            </div>
          )}
          {selectedStoryIndex !== null && (
            <InstagramStory
              stories={instagramData.business_discovery.stories.data}
              initialIndex={selectedStoryIndex}
              onClose={() => setSelectedStoryIndex(null)}
              instagramData={instagramData}
            />
          )}
        </>
      )}
    </div>
  );
};

export default Dashboard;