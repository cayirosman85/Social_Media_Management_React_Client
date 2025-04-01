import React, { useState, useEffect } from "react";
import localStorage from "local-storage";
import "./FacebookProfile.css";

const FacebookProfile = () => {
  const [pageData, setPageData] = useState(null);
  const [posts, setPosts] = useState([]);
  const [comments, setComments] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [newPostMessage, setNewPostMessage] = useState("");
  const [mediaFiles, setMediaFiles] = useState([]);
  const [mediaUrls, setMediaUrls] = useState([]);
  const [manualMediaUrl, setManualMediaUrl] = useState("");
  const [activeTab, setActiveTab] = useState("Posts");
  const [commentText, setCommentText] = useState({});
  const [replyText, setReplyText] = useState({});
  const [editText, setEditText] = useState({});
  const [editPostText, setEditPostText] = useState({}); // New state for editing posts
  const [likedPosts, setLikedPosts] = useState({});
  const [likedComments, setLikedComments] = useState({});

  const pageId = localStorage.get("facebookPageId");
  const accessToken = localStorage.get("facebookPageAccessToken");

  useEffect(() => {
    if (!pageId || !accessToken) {
      setError("Please log in to Facebook first.");
      setIsLoading(false);
      return;
    }
    fetchPageData();
    fetchPagePosts();
  }, [pageId, accessToken]);

  const fetchPageData = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(
        `https://graph.facebook.com/v18.0/${pageId}?fields=name,about,fan_count,picture,cover&access_token=${accessToken}`
      );
      const data = await response.json();
      if (!response.ok) throw new Error(data.error?.message || "Failed to fetch page data");
      setPageData(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchPagePosts = async () => {
    setIsLoading(true);
    try {
      const response = await fetch("https://localhost:7099/api/Facebook/facebook-page-posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ page_id: pageId, access_token: accessToken, limit: "10" }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Failed to fetch posts");
      setPosts(data.data || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchPostComments = async (postId) => {
    try {
      const response = await fetch("https://localhost:7099/api/Facebook/facebook-post-comments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ post_id: postId, access_token: accessToken, limit: "10" }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Failed to fetch comments");
      setComments(prev => ({ ...prev, [postId]: data.data || [] }));
    } catch (err) {
      setError(err.message);
    }
  };

  const handleMediaUpload = async (files) => {
    const formData = new FormData();
    files.forEach((file) => formData.append("mediaFiles", file));
    try {
      const response = await fetch("https://localhost:7099/api/upload/upload", {
        method: "POST",
        body: formData,
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Failed to upload media");
      setMediaUrls(data.urls);
      return data.urls;
    } catch (error) {
      setError(error.message);
      return [];
    }
  };

  const handleCreatePost = async (e) => {
    e.preventDefault();
    if (!newPostMessage.trim() && mediaFiles.length === 0 && !manualMediaUrl.trim()) return;

    setIsLoading(true);
    try {
      let uploadedMediaUrls = [];
      if (mediaFiles.length > 0) {
        uploadedMediaUrls = await handleMediaUpload(mediaFiles);
      }

      const response = await fetch("https://localhost:7099/api/Facebook/publish-facebook-post", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          page_id: pageId,
          access_token: accessToken,
          message: newPostMessage,
          photo_url: manualMediaUrl.trim() || uploadedMediaUrls[0],
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Failed to create post");
      if (data.success) {
        setNewPostMessage("");
        setMediaFiles([]);
        setMediaUrls([]);
        setManualMediaUrl("");
        fetchPagePosts();
        alert("Post created successfully!");
      }
    } catch (error) {
      setError(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCommentSubmit = async (postId, e) => {
    e.preventDefault();
    if (!commentText[postId]?.trim()) return;

    try {
      const response = await fetch("https://localhost:7099/api/Facebook/publish-facebook-comment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          post_id: postId,
          access_token: accessToken,
          message: commentText[postId],
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Failed to post comment");
      if (data.success) {
        setCommentText(prev => ({ ...prev, [postId]: "" }));
        fetchPostComments(postId);
      }
    } catch (error) {
      setError(error.message);
    }
  };

  const handleReplySubmit = async (commentId, postId, e) => {
    e.preventDefault();
    if (!replyText[commentId]?.trim()) return;

    try {
      const response = await fetch("https://localhost:7099/api/Facebook/reply-to-comment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          comment_id: commentId,
          access_token: accessToken,
          message: replyText[commentId],
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Failed to reply to comment");
      if (data.success) {
        setReplyText(prev => ({ ...prev, [commentId]: "" }));
        fetchPostComments(postId);
      }
    } catch (error) {
      setError(error.message);
    }
  };

  const handleLikePost = async (postId) => {
    try {
      const isLiked = likedPosts[postId];
      const endpoint = isLiked ? "unlike-object" : "like-object";
      const response = await fetch(`https://localhost:7099/api/Facebook/${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          object_id: postId,
          access_token: accessToken,
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || `Failed to ${isLiked ? "unlike" : "like"} post`);
      if (data.success) {
        setLikedPosts(prev => ({ ...prev, [postId]: !isLiked }));
        fetchPagePosts();
      }
    } catch (error) {
      setError(error.message);
    }
  };

  const handleLikeComment = async (commentId, postId) => {
    try {
      const isLiked = likedComments[commentId];
      const endpoint = isLiked ? "unlike-object" : "like-object";
      const response = await fetch(`https://localhost:7099/api/Facebook/${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          object_id: commentId,
          access_token: accessToken,
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || `Failed to ${isLiked ? "unlike" : "like"} comment`);
      if (data.success) {
        setLikedComments(prev => ({ ...prev, [commentId]: !isLiked }));
        fetchPostComments(postId);
      }
    } catch (error) {
      setError(error.message);
    }
  };

  const handleDeleteComment = async (commentId, postId) => {
    if (!window.confirm("Are you sure you want to delete this comment?")) return;

    try {
      const response = await fetch("https://localhost:7099/api/Facebook/delete-comment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          comment_id: commentId,
          access_token: accessToken,
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Failed to delete comment");
      if (data.success) {
        fetchPostComments(postId);
      }
    } catch (error) {
      setError(error.message);
    }
  };

  const handleEditComment = async (commentId, postId, e) => {
    e.preventDefault();
    if (!editText[commentId]?.trim()) return;

    try {
      const response = await fetch("https://localhost:7099/api/Facebook/edit-comment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          comment_id: commentId,
          access_token: accessToken,
          message: editText[commentId],
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Failed to edit comment");
      if (data.success) {
        setEditText(prev => ({ ...prev, [commentId]: "" }));
        fetchPostComments(postId);
      }
    } catch (error) {
      setError(error.message);
    }
  };

  // New handler for editing posts
  const handleEditPost = async (postId, e) => {
    e.preventDefault();
    if (!editPostText[postId]?.trim()) return;

    try {
      const response = await fetch("https://localhost:7099/api/Facebook/edit-post", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          post_id: postId,
          access_token: accessToken,
          message: editPostText[postId],
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Failed to edit post");
      if (data.success) {
        setEditPostText(prev => ({ ...prev, [postId]: "" }));
        fetchPagePosts();
      }
    } catch (error) {
      setError(error.message);
    }
  };

  // New handler for deleting posts
  const handleDeletePost = async (postId) => {
    if (!window.confirm("Are you sure you want to delete this post?")) return;

    try {
      const response = await fetch("https://localhost:7099/api/Facebook/delete-post", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          post_id: postId,
          access_token: accessToken,
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Failed to delete post");
      if (data.success) {
        fetchPagePosts();
      }
    } catch (error) {
      setError(error.message);
    }
  };

  // Recursive component to render comments and their replies
  const CommentItem = ({ comment, postId, level = 0 }) => {
    return (
      <div className={`comment ${level > 0 ? "reply" : ""}`} style={{ marginLeft: level * 20 }}>
        <div className="comment-wrapper">
          <img
            src={comment.from?.picture?.data?.url || pageData.picture.data.url}
            alt="Commenter"
            className="comment-profile-picture"
          />
          <div className="comment-content">
            <p className="comment-author">{comment.from?.name || pageData.name}</p>
            {editText[comment.id] ? (
              <form onSubmit={(e) => handleEditComment(comment.id, postId, e)}>
                <input
                  type="text"
                  value={editText[comment.id]}
                  onChange={(e) =>
                    setEditText(prev => ({ ...prev, [comment.id]: e.target.value }))
                  }
                  className="comment-input"
                />
                <button type="submit" className="comment-submit-button">
                  Save
                </button>
              </form>
            ) : (
              <p>{comment.message}</p>
            )}
            <small>{new Date(comment.created_time).toLocaleString()}</small>
            <div className="comment-actions">
              <button
                className={`action-button ${likedComments[comment.id] ? "liked" : ""}`}
                onClick={() => handleLikeComment(comment.id, postId)}
              >
                {likedComments[comment.id] ? "Unlike" : "Like"}
              </button>
              <button
                className="action-button"
                onClick={() =>
                  setReplyText(prev => ({
                    ...prev,
                    [comment.id]: prev[comment.id] ? "" : " ",
                  }))
                }
              >
                Reply
              </button>
              <button
                className="action-button"
                onClick={() =>
                  setEditText(prev => ({
                    ...prev,
                    [comment.id]: comment.message,
                  }))
                }
              >
                Edit
              </button>
              <button
                className="action-button"
                onClick={() => handleDeleteComment(comment.id, postId)}
              >
                Delete
              </button>
            </div>
            {replyText[comment.id] && (
              <form onSubmit={(e) => handleReplySubmit(comment.id, postId, e)}>
                <div className="comment-input-wrapper">
                  <img
                    src={pageData.picture.data.url}
                    alt="User Profile"
                    className="comment-profile-picture"
                  />
                  <input
                    type="text"
                    value={replyText[comment.id] || ""}
                    onChange={(e) =>
                      setReplyText(prev => ({
                        ...prev,
                        [comment.id]: e.target.value,
                      }))
                    }
                    placeholder={`Reply to ${comment.from?.name || pageData.name}`}
                    className="comment-input"
                  />
                  <button type="submit" className="comment-submit-button">
                    ➤
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
        {comment.comments?.data?.length > 0 && (
          <div className="replies">
            {comment.comments.data.map(reply => (
              <CommentItem key={reply.id} comment={reply} postId={postId} level={level + 1} />
            ))}
          </div>
        )}
      </div>
    );
  };

  if (isLoading) return <div className="loading">Loading...</div>;
  if (error) return <div className="error">Error: {error}</div>;

  return (
    <div className="facebook-profile-container">
      {pageData && (
        <>
          <div className="profile-header">
            <img src={pageData.picture.data.url} alt="Page Profile" className="profile-picture" />
            <div className="profile-info">
              <h1>{pageData.name}</h1>
              <p>{pageData.fan_count.toLocaleString()} likes • 1 follower</p>
            </div>
          </div>
          <div className="profile-tabs">
            {["Posts", "About", "Mentions", "Reviews", "Followers", "Photos", "More"].map((tab) => (
              <button
                key={tab}
                className={`tab ${activeTab === tab ? "active" : ""}`}
                onClick={() => setActiveTab(tab)}
              >
                {tab}
              </button>
            ))}
          </div>
          <div className="content-container">
            <div className="sidebar">
              <div className="sidebar-section">
                <h3>Intro</h3>
                <p>Page • Home Businesses</p>
                <button className="promote-button">Promote Page</button>
                <p>Not yet rated (0 Reviews)</p>
              </div>
              <div className="sidebar-section">
                <h3>Photos</h3>
                <img src={pageData.picture.data.url} alt="Page Photo" className="sidebar-photo" />
                <a href="#" className="see-all-photos">
                  See all photos
                </a>
              </div>
            </div>
            <div className="main-content">
              {activeTab === "Posts" && (
                <>
                  <div className="new-post-section">
                    <form onSubmit={handleCreatePost}>
                      <textarea
                        value={newPostMessage}
                        onChange={(e) => setNewPostMessage(e.target.value)}
                        placeholder="What's on your mind?"
                        rows="3"
                      />
                      <input
                        type="file"
                        accept="image/*"
                        multiple
                        onChange={(e) => setMediaFiles(Array.from(e.target.files))}
                      />
                      {mediaFiles.length > 0 && (
                        <div className="image-preview">
                          {mediaFiles.map((file, index) => (
                            <div key={index} className="media-preview-item">
                              <img
                                src={URL.createObjectURL(file)}
                                alt="Preview"
                                className="preview-image"
                              />
                              {mediaUrls[index] && (
                                <a href={mediaUrls[index]} target="_blank" rel="noopener noreferrer">
                                  {mediaUrls[index]}
                                </a>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                      <input
                        type="text"
                        value={manualMediaUrl}
                        onChange={(e) => setManualMediaUrl(e.target.value)}
                        placeholder="Or enter a media URL (e.g., https://example.com/image.jpg)"
                        className="manual-url-input"
                      />
                      <button type="submit" disabled={isLoading}>
                        {isLoading ? "Posting..." : "Post"}
                      </button>
                    </form>
                  </div>
                  <div className="posts-section">
                    <div className="posts-header">
                      <h2>Posts</h2>
                      <button className="filter-button">Filters</button>
                    </div>
                    {posts.length > 0 ? (
                      <ul>
                        {posts.map((post) => (
                          <li key={post.id} className="post-item">
                            <div className="post-header">
                              <img
                                src={pageData.picture.data.url}
                                alt="Page Profile"
                                className="post-profile-picture"
                              />
                              <div>
                                <p className="post-author">{pageData.name}</p>
                                <small>{new Date(post.created_time).toLocaleString()}</small>
                              </div>
                            </div>
                            {editPostText[post.id] ? (
                              <form onSubmit={(e) => handleEditPost(post.id, e)}>
                                <textarea
                                  value={editPostText[post.id]}
                                  onChange={(e) =>
                                    setEditPostText(prev => ({ ...prev, [post.id]: e.target.value }))
                                  }
                                  rows="3"
                                  className="edit-post-textarea"
                                />
                                <button type="submit" className="edit-post-submit-button">
                                  Save
                                </button>
                              </form>
                            ) : (
                              <>
                                {post.message && <p>{post.message}</p>}
                                {post.attachments?.data?.[0]?.media?.image && (
                                  <img
                                    src={post.attachments.data[0].media.image.src}
                                    alt="Post media"
                                    className="post-image"
                                  />
                                )}
                              </>
                            )}
                            <div className="post-actions">
                              <button
                                className={`action-button ${likedPosts[post.id] ? "liked" : ""}`}
                                onClick={() => handleLikePost(post.id)}
                              >
                                {likedPosts[post.id] ? "Unlike" : "Like"} ({post.likes?.summary?.total_count || 0})
                              </button>
                              <button
                                className="action-button"
                                onClick={() => fetchPostComments(post.id)}
                              >
                                Comment ({post.comments?.summary?.total_count || 0})
                              </button>
                              <button className="action-button">Share</button>
                              <button
                                className="action-button"
                                onClick={() =>
                                  setEditPostText(prev => ({
                                    ...prev,
                                    [post.id]: post.message,
                                  }))
                                }
                              >
                                Edit
                              </button>
                              <button
                                className="action-button"
                                onClick={() => handleDeletePost(post.id)}
                              >
                                Delete
                              </button>
                            </div>
                            <div className="comment-section">
                              {comments[post.id] && (
                                <div className="comments-list">
                                  {comments[post.id].map((comment) => (
                                    <CommentItem key={comment.id} comment={comment} postId={post.id} />
                                  ))}
                                </div>
                              )}
                              <form onSubmit={(e) => handleCommentSubmit(post.id, e)}>
                                <div className="comment-input-wrapper">
                                  <img
                                    src={pageData.picture.data.url}
                                    alt="User Profile"
                                    className="comment-profile-picture"
                                  />
                                  <input
                                    type="text"
                                    value={commentText[post.id] || ""}
                                    onChange={(e) =>
                                      setCommentText(prev => ({
                                        ...prev,
                                        [post.id]: e.target.value,
                                      }))
                                    }
                                    placeholder="Write a comment..."
                                    className="comment-input"
                                  />
                                  <button type="submit" className="comment-submit-button">
                                    ➤
                                  </button>
                                </div>
                              </form>
                            </div>
                            <button className="boost-button">
                              Boost this post to get more reach for {pageData.name}
                            </button>
                            <button className="boost-now-button">Boost post</button>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p>No posts available.</p>
                    )}
                  </div>
                </>
              )}
              {activeTab !== "Posts" && <p>Content for {activeTab} tab coming soon...</p>}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default FacebookProfile;