import React from "react";
import CarouselSlider from "./CarouselSlider.js";
import "./InstagramPostDetails.css";

const InstagramPostDetails = ({
  post,
  instagramData,
  onClose,
  onToggleCommentVisibility,
  onDeleteComment,
  onCreateComment,
  onCreateReply,
  onToggleInsights,
  isLoading,
  newComment,
  setNewComment,
  newReply,
  setNewReply,
  replyingTo,
  setReplyingTo,
}) => {
  const handleCreateComment = (e) => {
    e.preventDefault();
    onCreateComment(e);
  };

  const handleCreateReply = (e, commentId) => {
    e.preventDefault();
    onCreateReply(e, commentId);
  };

  return (
    <div className="modal" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <span className="close" onClick={onClose}>×</span>
        <div className="modal-body">
          <div className="modal-image">
            {post.media_type === "IMAGE" ? (
              <img src={post.media_url} alt="Post" className="modal-img" loading="lazy" />
            ) : post.media_type === "VIDEO" ? (
              <video
                src={post.media_url}
                className="modal-img"
                controls
                autoPlay
                muted
              />
            ) : post.media_type === "CAROUSEL_ALBUM" ? (
              <CarouselSlider media={post} />
            ) : (
              <div className="media-placeholder">No media available</div>
            )}
          </div>
          <div className="post-details-section">
            <div className="post-header">
              <img
                src={instagramData.business_discovery.profile_picture_url}
                alt={`${instagramData.business_discovery.username}'s profile`}
                className="post-profile-img"
                loading="lazy"
              />
              <span className="post-username">
                @{instagramData.business_discovery.username}
              </span>
            </div>
            <p className="post-caption">{post.caption || "No caption available"}</p>
            <p className="likes-time">
              <strong>{post.like_count || 0} likes</strong>
              <br />
              <span>{new Date(post.timestamp).toLocaleString()}</span>
            </p>
            <div className="comments-section">
              {post?.comments?.data && post.comments.data.length > 0 ? (
                post.comments.data
                  .filter((comment) => comment && comment.id)
                  .map((comment) => (
                    <div key={comment.id} className="comment-container">
                      <div className="comment">
                        <img
                          src={`https://picsum.photos/seed/${comment?.username || "default"}/32/32`}
                          alt={`${comment?.username || "User"}'s avatar`}
                          className="comment-avatar"
                          loading="lazy"
                        />
                        <div className="comment-content">
                          <div className="comment-header">
                            <span className="comment-username">
                              {comment?.username || "Anonymous"}
                            </span>
                            <span className="comment-timestamp">
                              {comment?.timestamp
                                ? new Date(comment.timestamp).toLocaleString()
                                : "Unknown time"}
                            </span>
                          </div>
                          <p className="comment-text">{comment?.text || "No text"}</p>
                          <div className="comment-actions">
                            <button
                              onClick={() =>
                                onToggleCommentVisibility(
                                  comment.id,
                                  comment?.hidden || false
                                )
                              }
                              className="comment-action-btn"
                            >
                              {comment?.hidden ? "Show" : "Hide"}
                            </button>
                            <button
                              onClick={() => onDeleteComment(comment.id)}
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
                                className="reply-form"
                              >
                                <input
                                  type="text"
                                  placeholder={`Reply to ${comment?.username || "User"}...`}
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
                                src={`https://picsum.photos/seed/${reply?.username || "default"}/24/24`}
                                alt={`${reply?.username || "User"}'s avatar`}
                                className="reply-avatar"
                                loading="lazy"
                              />
                              <div className="reply-content">
                                <div className="reply-header">
                                  <span className="comment-username">
                                    {reply?.username || "Anonymous"}
                                  </span>
                                  <span className="comment-timestamp">
                                    {reply?.timestamp
                                      ? new Date(reply.timestamp).toLocaleString()
                                      : "Unknown time"}
                                  </span>
                                </div>
                                <p className="comment-text">{reply?.text || "No text"}</p>
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
            </div>
            <div className="comment-input-container">
              <form onSubmit={handleCreateComment} className="comment-form">
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
            <div className="post-additional-actions">
              <a
                href="#"
                className="view-insights"
                onClick={(e) => {
                  e.preventDefault();
                  onToggleInsights(post.id, post.media_type);
                }}
              >
                View Insights
              </a>
              <button className="boost-btn">Boost Post</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InstagramPostDetails;