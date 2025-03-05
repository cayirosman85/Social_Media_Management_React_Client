import React, { useState, useEffect } from "react";
import ProfileHeader from "../../components/instagram/ProfileHeader.js";
import TabNavigation from "../../components/instagram/TabNavigation.js";
import InstagramPost from "../../components/instagram/InstagramPost.js";
import NewPostModal from "../../components/instagram/NewPostModal.js";
import InstagramStory from "../../components/instagram/InstagramStory.js";
import CarouselSlider from "../../components/instagram/CarouselSlider.js";
import NewStoryModal from "../../components/instagram/NewStoryModal.js";
import { 
  fetchInstagramData, 
  toggleCommentVisibility, 
  deleteComment, 
  createComment, 
  createReply 
} from "../../services/instagram/instagramService";
import "./Dashboard.css";

const Dashboard = () => {
  const [activeTab, setActiveTab] = useState("POSTS");
  const [selectedPost, setSelectedPost] = useState(null);
  const [selectedStoryIndex, setSelectedStoryIndex] = useState(null);
  const [showNewPostModal, setShowNewPostModal] = useState(false);
  const [showNewStoryModal, setShowNewStoryModal] = useState(false); // Add state for story modal
  const [isLoading, setIsLoading] = useState(true);
  const [instagramData, setInstagramData] = useState(null);
  const [error, setError] = useState(null);
  const [newComment, setNewComment] = useState("");
  const [newReply, setNewReply] = useState("");
  const [replyingTo, setReplyingTo] = useState(null);
  const [showInsights, setShowInsights] = useState(false);

  useEffect(() => {
    loadInstagramData();
  }, []);

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

  const handlePostSuccess = (updatedData) => {
    setInstagramData(updatedData);
    setShowNewPostModal(false);
  };

  const handleStorySuccess = (updatedData) => {
    setInstagramData(updatedData);
    setShowNewStoryModal(false);
  };

  const handleTabClick = (tab) => {
    setActiveTab(tab);
  };


  const handleToggleCommentVisibility = async (commentId, hide) => {
    setIsLoading(true);
    try {
      const response = await toggleCommentVisibility(
        "17841473036355290",
        commentId,
        "EAAZAde8LZA8zIBO4O8QsOQmyMMMShi79cCZBMRJZCjbSbXG7Y3ZAQ4OGvJN1vi8LYLeNx6K9pbxpFuU2saC3lWWt43za1ggpCu9YONtmCuwucaWVgtYYqRcG2oMtuHPhxq6x4n3ImiE3TzXf4IzMHxMtuDbwNfT52ZA6yjkwWabhrLZCrb7zqWzdkjZBApQJmNntUgZDZD",
        !hide
      );
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
      const response = await deleteComment(
        "17841473036355290",
        commentId,
        "EAAZAde8LZA8zIBO4O8QsOQmyMMMShi79cCZBMRJZCjbSbXG7Y3ZAQ4OGvJN1vi8LYLeNx6K9pbxpFuU2saC3lWWt43za1ggpCu9YONtmCuwucaWVgtYYqRcG2oMtuHPhxq6x4n3ImiE3TzXf4IzMHxMtuDbwNfT52ZA6yjkwWabhrLZCrb7zqWzdkjZBApQJmNntUgZDZD"
      );
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
      const response = await createComment(
        "17841473036355290",
        selectedPost.id,
        "EAAZAde8LZA8zIBO4O8QsOQmyMMMShi79cCZBMRJZCjbSbXG7Y3ZAQ4OGvJN1vi8LYLeNx6K9pbxpFuU2saC3lWWt43za1ggpCu9YONtmCuwucaWVgtYYqRcG2oMtuHPhxq6x4n3ImiE3TzXf4IzMHxMtuDbwNfT52ZA6yjkwWabhrLZCrb7zqWzdkjZBApQJmNntUgZDZD",
        newComment
      );
      if (response.success) {
        const newCommentObj = {
          id: response.commentId || `temp-${Date.now()}`, // Use API-provided ID or temporary ID
          text: newComment,
          username: "osmancayir73", // Adjust based on your app logic
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
      const response = await createReply(
        "17841473036355290",
        commentId,
        "EAAZAde8LZA8zIBO4O8QsOQmyMMMShi79cCZBMRJZCjbSbXG7Y3ZAQ4OGvJN1vi8LYLeNx6K9pbxpFuU2saC3lWWt43za1ggpCu9YONtmCuwucaWVgtYYqRcG2oMtuHPhxq6x4n3ImiE3TzXf4IzMHxMtuDbwNfT52ZA6yjkwWabhrLZCrb7zqWzdkjZBApQJmNntUgZDZD",
        newReply
      );
      if (response.success) {
        const newReplyObj = {
          id: response.replyId || `temp-reply-${Date.now()}`, // Use API-provided ID or temporary ID
          text: newReply,
          username: "osmancayir73", // Adjust based on your app logic
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

  const toggleInsights = () => {
    setShowInsights((prev) => !prev);
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
                    <div className="post-header">
                      <img
                        src={instagramData.business_discovery.profile_picture_url}
                        alt="Profile"
                        className="post-profile-img"
                      />
                      <span className="post-username">@{instagramData.business_discovery.username}</span>
                    </div>
                    <p className="post-caption">{selectedPost.caption || "No caption available"}</p>
                    <p className="likes-time">
                      <strong>{selectedPost.like_count || 0} likes</strong>
                      <br />
                      <span>{new Date(selectedPost.timestamp).toLocaleString()}</span>
                    </p>
                    <div className="comments-section">
                      {selectedPost?.comments?.data && selectedPost.comments.data.length > 0 ? (
                        selectedPost.comments.data
                          .filter((comment) => comment && comment.id)
                          .map((comment) => (
                            <div key={comment.id} className="comment-container">
                              <div className="comment">
                                <img
                                  src={`https://picsum.photos/seed/${comment?.username || 'default'}/32/32`}
                                  alt={`${comment?.username || 'User'}'s avatar`}
                                  className="comment-avatar"
                                />
                                <div className="comment-content">
                                  <span className="comment-username">{comment?.username || 'Anonymous'}</span>
                                  <span className="comment-text">{comment?.text || 'No text'}</span>
                                  <div className="comment-meta">
                                    <span className="comment-timestamp">
                                      {comment?.timestamp
                                        ? new Date(comment.timestamp).toLocaleString()
                                        : 'Unknown time'}
                                    </span>
                                    <button
                                      onClick={() => handleToggleCommentVisibility(comment.id, comment?.hidden || false)}
                                      className="comment-action-btn"
                                    >
                                      {comment?.hidden ? "Show" : "Hide"}
                                    </button>
                                    <button
                                      onClick={() => handleDeleteComment(comment.id)}
                                      className="comment-action-btn delete"
                                    >
                                      Delete
                                    </button>
                                    <button
                                      onClick={() => setReplyingTo(comment.id)}
                                      className="comment-reply-btn"
                                    >
                                      Reply
                                    </button>
                                  </div>
                                  {replyingTo === comment.id && (
                                    <div className="reply-input-container">
                                      <form
                                        onSubmit={(e) => handleCreateReply(e, comment.id)}
                                        style={{ display: "flex", width: "100%", marginTop: "8px" }}
                                      >
                                        <input
                                          type="text"
                                          placeholder={`Reply to ${comment?.username || 'User'}...`}
                                          className="comment-input"
                                          value={newReply}
                                          onChange={(e) => setNewReply(e.target.value)}
                                          disabled={isLoading}
                                        />
                                        <button
                                          type="submit"
                                          className="comment-btn"
                                          disabled={isLoading || !newReply.trim()}
                                        >
                                          {isLoading ? "Posting..." : "Post"}
                                        </button>
                                      </form>
                                    </div>
                                  )}
                                </div>
                              </div>
                              {comment?.replies?.data && comment.replies.data.length > 0 && (
                                <div className="replies-container">
                                  {comment.replies.data.map((reply) => (
                                    <div key={reply.id} className="reply">
                                      <img
                                        src={`https://picsum.photos/seed/${reply?.username || 'default'}/24/24`}
                                        alt={`${reply?.username || 'User'}'s avatar`}
                                        className="reply-avatar"
                                      />
                                      <div className="reply-content">
                                        <span className="comment-username">{reply?.username || 'Anonymous'}</span>
                                        <span className="comment-text">{reply?.text || 'No text'}</span>
                                        <div className="reply-meta">
                                          <span className="comment-timestamp">
                                            {reply?.timestamp
                                              ? new Date(reply.timestamp).toLocaleString()
                                              : 'Unknown time'}
                                          </span>
                                        </div>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          ))
                      ) : (
                        <p className="no-comments">No comments yet. Start the conversation.</p>
                      )}
                      <div className="comment-input-container">
                        <span className="emoji-icon">😊</span>
                        <form onSubmit={handleCreateComment} style={{ display: "flex", width: "100%" }}>
                          <input
                            type="text"
                            placeholder="Add a comment..."
                            className="comment-input"
                            value={newComment}
                            onChange={(e) => setNewComment(e.target.value)}
                            disabled={isLoading}
                          />
                          <button
                            type="submit"
                            className="comment-btn"
                            disabled={isLoading || !newComment.trim()}
                          >
                            {isLoading ? "Posting..." : "Post"}
                          </button>
                        </form>
                      </div>
                    </div>
                    <div className="post-additional-actions">
                      <a
                        href="#"
                        className="view-insights"
                        onClick={(e) => {
                          e.preventDefault();
                          toggleInsights();
                        }}
                      >
                        {showInsights ? "Hide insights" : "View insights"}
                      </a>
                      <button className="boost-btn">Boost post</button>
                    </div>
                    {showInsights && selectedPost?.insights && (
                      <div className="insights-section">
                        <h3>Insights</h3>
                        <ul>
                          {selectedPost.insights.map((insight, index) => (
                            <li key={index} className="insight-item">
                              <strong>{insight.title || 'Unknown'}:</strong> {insight.values[0]?.value || 0}
                              <br />
                              <small>{insight.description || 'No description'}</small>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
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