import React from "react";
import CarouselSlider from "./CarouselSlider"; // Adjust path as needed
import { FaHeart, FaComment, FaShare, FaEye } from "react-icons/fa"; // For icons
import "./PostItem.css";

const PostItem = ({
  post,
  isLoading,
  newComments,
  setNewComments,
  newReplies,
  setNewReplies,
  replyingTo,
  setReplyingTo,
  onToggleCommentVisibility,
  onDeleteComment,
  onCreateComment,
  onCreateReply,
  onToggleInsights,
}) => {
  return (
    <div className="post-item">
      {/* Post Header */}
      <div className="post-header">
        <div className="post-user">
          <img
            src={`https://picsum.photos/seed/${post?.username || "default"}/40/40`}
            alt={`${post?.username || "User"}'s avatar`}
            className="post-avatar"
          />
          <span className="post-username">{post?.username || "Anonymous"}</span>
        </div>
        <span className="post-timestamp">
          {new Date(post.timestamp).toLocaleDateString()}
        </span>
      </div>

      {/* Post Media */}
      <div className="post-media">
        {post.media_type === "IMAGE" ? (
          <img src={post.media_url} alt="Post" />
        ) : post.media_type === "VIDEO" ? (
          <video src={post.media_url} controls />
        ) : post.media_type === "CAROUSEL_ALBUM" ? (
          <>
            <CarouselSlider media={post} />
            <p className="carousel-info">
              Carousel ({post.children?.data?.length || "multiple"} items)
            </p>
          </>
        ) : null}
      </div>

      {/* Post Actions (Likes, Comments, Share) */}
      <div className="post-actions-bar">
        <button className="action-btn">
          <FaHeart /> {post.like_count || 0}
        </button>
        <button className="action-btn">
          <FaComment /> {post.comments_count || 0}
        </button>
        <button className="action-btn">
          <FaShare />
        </button>
        <button className="action-btn insights-btn" onClick={() => onToggleInsights(post.id, post.media_type)}>
          <FaEye /> View Insights
        </button>
      </div>

      {/* Post Caption */}
      <div className="post-details-section">
        <p className="post-caption">{post.caption || "No caption available"}</p>

        {/* Comments Section */}
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
                    />
                    <div className="comment-content">
                      <span className="comment-username">
                        {comment?.username || "Anonymous"}
                      </span>
                      <span className="comment-text">{comment?.text || "No text"}</span>
                      <div className="comment-meta">
                        <span className="comment-timestamp">
                          {comment?.timestamp
                            ? new Date(comment.timestamp).toLocaleString()
                            : "Unknown time"}
                        </span>
                        <button
                          onClick={() =>
                            onToggleCommentVisibility(post.id, comment.id, comment?.hidden || false)
                          }
                          className="comment-action-btn"
                        >
                          {comment?.hidden ? "Show" : "Hide"}
                        </button>
                        <button
                          onClick={() => onDeleteComment(post.id, comment.id)}
                          className="comment-action-btn delete"
                        >
                          Delete
                        </button>
                        <button
                          onClick={() => setReplyingTo(`${post.id}-${comment.id}`)}
                          className="comment-reply-btn"
                        >
                          Reply
                        </button>
                      </div>
                      {replyingTo === `${post.id}-${comment.id}` && (
                        <form
                          onSubmit={(e) => onCreateReply(e, post.id, comment.id)}
                          className="reply-form"
                        >
                          <input
                            type="text"
                            placeholder={`Reply to ${comment?.username || "User"}...`}
                            value={newReplies[`${post.id}-${comment.id}`] || ""}
                            onChange={(e) =>
                              setNewReplies((prev) => ({
                                ...prev,
                                [`${post.id}-${comment.id}`]: e.target.value,
                              }))
                            }
                            disabled={isLoading}
                            className="reply-input"
                          />
                          <button
                            type="submit"
                            disabled={
                              isLoading || !newReplies[`${post.id}-${comment.id}`]?.trim()
                            }
                            className="reply-submit-btn"
                          >
                            {isLoading ? "Posting..." : "Post"}
                          </button>
                        </form>
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
                          />
                          <div className="reply-content">
                            <span className="reply-username">
                              {reply?.username || "Anonymous"}
                            </span>
                            <span className="reply-text">{reply?.text || "No text"}</span>
                            <div className="reply-meta">
                              <span className="reply-timestamp">
                                {reply?.timestamp
                                  ? new Date(reply.timestamp).toLocaleString()
                                  : "Unknown time"}
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
            <p className="no-comments">Be the first to comment!</p>
          )}
          <form
            onSubmit={(e) => onCreateComment(e, post.id)}
            className="comment-form"
          >
            <span className="emoji-icon">😊</span>
            <input
              type="text"
              placeholder="Add a comment..."
              value={newComments[post.id] || ""}
              onChange={(e) =>
                setNewComments((prev) => ({
                  ...prev,
                  [post.id]: e.target.value,
                }))
              }
              disabled={isLoading}
              className="comment-input"
            />
            <button
              type="submit"
              disabled={isLoading || !newComments[post.id]?.trim()}
              className="comment-submit-btn"
            >
              {isLoading ? "Posting..." : "Post"}
            </button>
          </form>
        </div>

        {/* Post Actions (Boost Post) */}
        <div className="post-actions">
          <button className="boost-btn">Boost Post</button>
        </div>
      </div>
    </div>
  );
};

export default PostItem;