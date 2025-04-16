import React, { useState, useEffect, useRef } from "react";
import ProfileHeader from "../../../components/instagram/profile/ProfileHeader.js";
import TabNavigation from "../../../components/instagram/profile/TabNavigation.js";
import InstagramPost from "../../../components/instagram/profile/InstagramPost.js";
import NewPostModal from "../../../components/instagram/profile/NewPostModal.js";
import InstagramStory from "../../../components/instagram/profile/InstagramStory.js";
import NewStoryModal from "../../../components/instagram/profile/NewStoryModal.js";
import InsightsModal from "../../../components/instagram/profile/InsightsModal.js";
import InstagramPostDetails from "../../../components/instagram/profile/InstagramPostDetails.js";
import {
  fetchInstagramData,
  toggleCommentVisibility,
  deleteComment,
  createComment,
  createReply,
  getMediaInsights,
  getUserPosts, // Import the paginated posts service
} from "../../../services/instagram/instagramService.js";
import "./ProfileManager.css";
import localStorage from "local-storage";

const ProfileManager = () => {
  const [activeTab, setActiveTab] = useState("POSTS");
  const [selectedPost, setSelectedPost] = useState(null);
  const [selectedStoryIndex, setSelectedStoryIndex] = useState(null);
  const [showNewPostModal, setShowNewPostModal] = useState(false);
  const [showNewStoryModal, setShowNewStoryModal] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [instagramData, setInstagramData] = useState(null);
  const [posts, setPosts] = useState([]); // Separate state for posts
  const [paging, setPaging] = useState({ after: null, before: null }); // Pagination cursors
  const [error, setError] = useState(null);
  const [newComment, setNewComment] = useState("");
  const [newReply, setNewReply] = useState("");
  const [replyingTo, setReplyingTo] = useState(null);
  const [insightsData, setInsightsData] = useState({});
  const [selectedPostId, setSelectedPostId] = useState(null);

  const postsContainerRef = useRef(null);



  const userId = localStorage.get("userId");
  const username = localStorage.get("username");
  const accessToken = localStorage.get("facebookAccessToken");

  useEffect(() => {
    loadProfileData();
    fetchPosts(null, "after", false); // Initial posts load
  }, []);

  // Load profile data (excluding posts)
  const loadProfileData = async () => {
    setIsLoading(true);
    try {
      const data = await fetchInstagramData(userId, username, accessToken);
      setInstagramData(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch paginated posts
  const fetchPosts = async (cursor = null, direction = "after", append = false) => {
    setIsLoading(true);
    let scrollPosition = 0;
  
    if (append && postsContainerRef.current) {
      scrollPosition = postsContainerRef.current.scrollTop;
    }
  
    try {
      const data = await getUserPosts(userId, username, accessToken, 5, cursor, direction);
      const mediaItems = data?.business_discovery?.media?.data || [];
  
      if (append) {
        setPosts((prevPosts) => {
          const existingIds = new Set(prevPosts.map((post) => post.id));
          const filteredNewPosts = mediaItems.filter((post) => !existingIds.has(post.id));
          return [...prevPosts, ...filteredNewPosts];
        });
      } else {
        setPosts(mediaItems);
      }
  
      setPaging({
        after: data?.business_discovery?.media?.paging?.cursors?.after || null,
        before: data?.business_discovery?.media?.paging?.cursors?.before || null,
      });
  
      if (append && postsContainerRef.current) {
        requestAnimationFrame(() => {
          postsContainerRef.current.scrollTop = scrollPosition;
        });
      }
    } catch (error) {
      console.error("Error fetching posts:", error);
      setError(error.message);
    } finally {
      setIsLoading(false);
    }
  };
  const handleNextPage = () => {
    if (paging.after) fetchPosts(paging.after, "after", true);
  };

  const handlePrevPage = () => {
    if (paging.before) fetchPosts(paging.before, "before", false);
  };

  const handlePostSuccess = (updatedData) => {
    setInstagramData(updatedData);
    fetchPosts(null, "after", false); // Refresh posts after new post
    setShowNewPostModal(false);
  };

  const handleStorySuccess = (updatedData) => {
    setInstagramData(updatedData);
    setShowNewStoryModal(false);
  };

  const handleTabClick = (tab) => {
    setActiveTab(tab);
  };

  const fetchInsights = async (postId, mediaType) => {
    setIsLoading(true);
    try {
      const data = await getMediaInsights(userId, postId, accessToken, mediaType);
      setInsightsData((prev) => ({
        ...prev,
        [postId]: data?.insights?.insights || [],
      }));
      setSelectedPostId(postId);
    } catch (error) {
      console.error("Error fetching insights:", error);
      alert(`Error fetching insights: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleInsights = (postId, mediaType) => {
    if (insightsData[postId]) {
      setSelectedPostId(postId);
    } else {
      fetchInsights(postId, mediaType);
    }
  };

  const closeInsightsModal = () => {
    setSelectedPostId(null);
  };

  const handleToggleCommentVisibility = async (commentId, hide) => {
    setIsLoading(true);
    try {
      const response = await toggleCommentVisibility(userId, commentId, accessToken, !hide);
      if (response.success) {
        const updatedComments = selectedPost.comments.data.map((comment) =>
          comment.id === commentId ? { ...comment, hidden: !hide } : comment
        );
        setSelectedPost({
          ...selectedPost,
          comments: { ...selectedPost.comments, data: updatedComments },
        });
      } else {
        throw new Error(response.error || "Failed to toggle comment visibility");
      }
    } catch (error) {
      setError(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteComment = async (commentId) => {
    setIsLoading(true);
    try {
      const response = await deleteComment(userId, commentId, accessToken);
      if (response.success) {
        const updatedComments = selectedPost.comments.data.filter(
          (comment) => comment.id !== commentId
        );
        setSelectedPost({
          ...selectedPost,
          comments: { ...selectedPost.comments, data: updatedComments },
          comments_count: (selectedPost.comments_count || 0) - 1,
        });
      } else {
        throw new Error(response.error || "Failed to delete comment");
      }
    } catch (error) {
      setError(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateComment = async (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    setIsLoading(true);
    try {
      const response = await createComment(userId, selectedPost.id, accessToken, newComment);
      if (response.success) {
        const newCommentObj = {
          id: response.commentId || `temp-${Date.now()}`,
          text: newComment,
          username: "osmancayir73",
          timestamp: new Date().toISOString(),
          like_count: 0,
          hidden: false,
        };
        const updatedComments = [...(selectedPost.comments?.data || []), newCommentObj];
        setSelectedPost({
          ...selectedPost,
          comments: { ...selectedPost.comments, data: updatedComments },
          comments_count: (selectedPost.comments_count || 0) + 1,
        });
        setNewComment("");
        alert("Comment posted successfully!");
      } else {
        throw new Error(response.error || "Failed to create comment");
      }
    } catch (error) {
      setError(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateReply = async (e, commentId) => {
    e.preventDefault();
    if (!newReply.trim()) return;

    setIsLoading(true);
    try {
      const response = await createReply(userId, commentId, accessToken, newReply);
      if (response.success) {
        const newReplyObj = {
          id: response.replyId || `temp-reply-${Date.now()}`,
          text: newReply,
          username: "osmancayir73",
          timestamp: new Date().toISOString(),
        };
        const updatedComments = selectedPost.comments.data.map((comment) =>
          comment.id === commentId
            ? {
                ...comment,
                replies: {
                  ...comment.replies,
                  data: [...(comment.replies?.data || []), newReplyObj],
                },
              }
            : comment
        );
        setSelectedPost({
          ...selectedPost,
          comments: { ...selectedPost.comments, data: updatedComments },
        });
        setNewReply("");
        setReplyingTo(null);
        alert("Reply posted successfully!");
      } else {
        throw new Error(response.error || "Failed to create reply");
      }
    } catch (error) {
      setError(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          minHeight: "200px",
        }}
      >
        <div
          style={{
            width: "40px",
            height: "40px",
            border: "4px solid #f3f3f3",
            borderTop: "4px solid #0095f6",
            borderRadius: "50%",
            animation: "spin 1s linear infinite",
          }}
        />
        <p style={{ marginTop: "15px", color: "#8e8e8e", fontSize: "16px" }}>
          Loading Profile...
        </p>
        <style>
          {`
            @keyframes spin {
              0% { transform: rotate(0deg); }
              100% { transform: rotate(360deg); }
            }
          `}
        </style>
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
                onClick={() => setShowNewStoryModal(true)}
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
              <div className="media-feed" ref={postsContainerRef}>
                <div className="media-grid">
                  {posts.map((media) => (
                    <InstagramPost
                      key={media.id}
                      post={media}
                      onClick={() => {
                        console.log("Post clicked:", media);
                        setSelectedPost(media);
                      }}
                    />
                  ))}
                </div>
                <div className="pagination">
                  <button
                    onClick={handlePrevPage}
                    disabled={!paging.before || isLoading}
                    className="pagination-btn"
                  >
                    Previous
                  </button>
                  <button
                    onClick={handleNextPage}
                    disabled={!paging.after || isLoading}
                    className="pagination-btn"
                  >
                    Load More
                  </button>
                </div>
              </div>
            )}
            {activeTab === "REELS" && (
              <div className="media-feed">
                <div className="media-grid">
                  {posts
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
              onClose={() => setShowNewPostModal(false)}
              onPostSuccess={handlePostSuccess}
              fetchInstagramData={fetchInstagramData}
            />
          )}
          {showNewStoryModal && (
            <NewStoryModal
              onClose={() => setShowNewStoryModal(false)}
              onStorySuccess={handleStorySuccess}
              fetchInstagramData={fetchInstagramData}
            />
          )}
          {selectedPost && (
            <InstagramPostDetails
              post={selectedPost}
              instagramData={instagramData}
              onClose={() => setSelectedPost(null)}
              onToggleCommentVisibility={handleToggleCommentVisibility}
              onDeleteComment={handleDeleteComment}
              onCreateComment={handleCreateComment}
              onCreateReply={handleCreateReply}
              onToggleInsights={toggleInsights}
              isLoading={isLoading}
              newComment={newComment}
              setNewComment={setNewComment}
              newReply={newReply}
              setNewReply={setNewReply}
              replyingTo={replyingTo}
              setReplyingTo={setReplyingTo}
            />
          )}
          {selectedStoryIndex !== null && (
            <InstagramStory
              stories={instagramData.business_discovery.stories.data}
              initialIndex={selectedStoryIndex}
              onClose={() => setSelectedStoryIndex(null)}
              instagramData={instagramData}
            />
          )}
          {selectedPostId && (
            <InsightsModal
              isOpen={!!selectedPostId}
              onClose={closeInsightsModal}
              insights={insightsData[selectedPostId]}
              postId={selectedPostId}
              mediaType={posts.find((post) => post.id === selectedPostId)?.media_type}
            />
          )}
        </>
      )}
    </div>
  );
};

export default ProfileManager;