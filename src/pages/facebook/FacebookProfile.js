import React, { useState, useEffect } from "react";
import localStorage from "local-storage";
import "./FacebookProfile.css";

const FacebookProfile = () => {
  const [pageData, setPageData] = useState(null);
  const [posts, setPosts] = useState([]);
  const [photos, setPhotos] = useState([]);
  const [videos, setVideos] = useState([]);
  const [reels, setReels] = useState([]);
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
  const [editPostText, setEditPostText] = useState({});
  const [editPostMediaFiles, setEditPostMediaFiles] = useState({});
  const [editPostMediaUrl, setEditPostMediaUrl] = useState({});
  const [likedPosts, setLikedPosts] = useState({});
  const [likedComments, setLikedComments] = useState({});
  const [feelingActivity, setFeelingActivity] = useState("");
  const [taggedPeople, setTaggedPeople] = useState([]);
  const [isLoadingReels, setIsLoadingReels] = useState(true);
  const [isLoadingVideos, setIsLoadingVideos] = useState(true);
  const [showMenu, setShowMenu] = useState({}); // New state for menu visibility
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
    fetchAllMedia();
    fetchReels();
    fetchVideos();
  }, [pageId, accessToken]);

  const fetchPageData = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(
        `https://graph.facebook.com/v18.0/${pageId}?fields=name,about,description,fan_count,followers_count,picture,cover,category,phone,website,location,hours,founded,mission,products,verification_status,rating_count,link,username,is_published,engagement&access_token=${accessToken}`
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

  const fetchAllMedia = async () => {
    setIsLoading(true);
    try {
      const [photosResponse, postsResponse] = await Promise.all([
        fetch("https://localhost:7099/api/Facebook/facebook-page-photos", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ page_id: pageId, access_token: accessToken, limit: "10" }),
        }),
        fetch("https://localhost:7099/api/Facebook/facebook-page-posts", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ page_id: pageId, access_token: accessToken, limit: "10" }),
        }),
      ]);

      const photosData = await photosResponse.json();
      if (!photosResponse.ok) throw new Error(photosData.error || "Failed to fetch uploaded photos");

      const postsData = await postsResponse.json();
      if (!postsResponse.ok) throw new Error(postsData.error || "Failed to fetch posts");

      const uploadedPhotos = (photosData.data || []).map(photo => ({
        id: photo.id,
        images: photo.images || [],
        name: photo.name || "Uploaded Photo",
        created_time: photo.created_time,
      }));

      const mediaFromPosts = (postsData.data || [])
        .filter(post => post.attachments?.data?.length > 0)
        .map(post => ({
          id: post.id,
          images: post.attachments.data.map(attachment => ({
            source: attachment.media?.image?.src,
          })),
          name: post.message || "Post Media",
          created_time: post.created_time,
        }));

      const allMedia = [...uploadedPhotos, ...mediaFromPosts]
        .filter(photo => photo.images?.length > 0)
        .filter((photo, index, self) => index === self.findIndex(p => p.id === photo.id));

      setPhotos(allMedia);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchReels = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(
        `https://graph.facebook.com/v18.0/${pageId}/video_reels?fields=id,source,thumbnail,created_time,title,description&access_token=${accessToken}&limit=10`
      );
      const data = await response.json();
      if (!response.ok) throw new Error(data.error?.message || "Failed to fetch reels");
      setReels(data.data || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchVideos = async () => {
    setIsLoadingVideos(true);
    try {
      const response = await fetch(
        `https://graph.facebook.com/v18.0/${pageId}/videos?fields=id,source,thumbnail_url,created_time,title,description&access_token=${accessToken}&limit=10`
      );
      const data = await response.json();
      if (!response.ok) throw new Error(data.error?.message || "Failed to fetch videos");
      setVideos(data.data || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoadingVideos(false);
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
          message: newPostMessage + (feelingActivity ? ` is ${feelingActivity}` : ""),
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
        setFeelingActivity("");
        setTaggedPeople([]);
        fetchPagePosts();
        fetchAllMedia();
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

  const handleEditPost = async (postId, e) => {
    e.preventDefault();
    if (!editPostText[postId]?.trim()) return;

    const isMediaUpdated = editPostMediaFiles[postId]?.length > 0 || editPostMediaUrl[postId]?.trim();
    if (isMediaUpdated) {
      const confirmMessage = "Warning: Editing the media of a post is restricted by Facebook. The existing post will be deleted, and a new post will be created with the updated content. This will result in the loss of all likes, comments, and other engagement on the original post. Do you want to proceed?";
      if (!window.confirm(confirmMessage)) return;
    }

    setIsLoading(true);
    try {
      let uploadedMediaUrls = [];
      if (editPostMediaFiles[postId]?.length > 0) {
        uploadedMediaUrls = await handleMediaUpload(editPostMediaFiles[postId]);
      }

      const photoUrl = editPostMediaUrl[postId]?.trim() || uploadedMediaUrls[0] || null;

      const response = await fetch("https://localhost:7099/api/Facebook/edit-post", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          post_id: postId,
          page_id: pageId,
          access_token: accessToken,
          message: editPostText[postId],
          photo_url: photoUrl,
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Failed to edit post");
      if (data.success) {
        setEditPostText(prev => ({ ...prev, [postId]: "" }));
        setEditPostMediaFiles(prev => ({ ...prev, [postId]: [] }));
        setEditPostMediaUrl(prev => ({ ...prev, [postId]: "" }));
        fetchPagePosts();
        fetchAllMedia();
      }
    } catch (error) {
      setError(error.message);
    } finally {
      setIsLoading(false);
    }
  };

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
        fetchAllMedia();
      }
    } catch (error) {
      setError(error.message);
    }
  };

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
            {["Posts", "About", "Mentions", "Reviews", "Photos"].map((tab) => (
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
                <p>Page • {pageData.category || "Home Businesses"}</p>
                <button className="promote-button">Promote Page</button>
                <p>Not yet rated (0 Reviews)</p>
              </div>
              <div className="sidebar-section">
                <h3>Photos</h3>
                {photos.length > 0 ? (
                  <div className="photo-gallery">
                    {photos.slice(0, 2).map((photo) => (
                      <img
                        key={photo.id}
                        src={photo.images[0]?.source}
                        alt={photo.name || "Page Photo"}
                        className="sidebar-photo"
                        onError={(e) => (e.target.src = "https://via.placeholder.com/100")}
                      />
                    ))}
                  </div>
                ) : (
                  <p>No photos available.</p>
                )}
                <a href="#" className="see-all-photos" onClick={() => setActiveTab("Photos")}>
                  See all photos
                </a>
              </div>
            </div>
            <div className="main-content">
              {activeTab === "Posts" && (
                <div className="posts-section">
                  <div className="posts-header">
                    <h2>Posts</h2>
                   
                  </div>
                  {posts.length > 0 ? (
                    <ul>
                      {posts.map((post) => (
                        <li key={post.id} className="post-item">
                          <div className="post-header">
                        
                            <div className="post-header-left">
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
                            <div className="post-menu">
                              <button
                                className="menu-button"
                                onClick={() =>
                                  setShowMenu(prev => ({
                                    ...prev,
                                    [post.id]: !prev[post.id],
                                  }))
                                }
                              >
                                ⋮
                              </button>
                              {showMenu[post.id] && (
                                <div className="menu-dropdown">
                                  <button
                                    className="menu-item"
                                    onClick={() => {
                                      setEditPostText(prev => ({
                                        ...prev,
                                        [post.id]: post.message,
                                      }));
                                      setShowMenu(prev => ({
                                        ...prev,
                                        [post.id]: false,
                                      }));
                                    }}
                                  >
                                    Edit
                                  </button>
                                  <button
                                    className="menu-item"
                                    onClick={() => {
                                      handleDeletePost(post.id);
                                      setShowMenu(prev => ({
                                        ...prev,
                                        [post.id]: false,
                                      }));
                                    }}
                                  >
                                    Delete
                                  </button>
                                </div>
                              )}
                            </div>
                          </div>
                          {editPostText[post.id] ? (
                            <form onSubmit={(e) => handleEditPost(post.id, e)}>
                              <textarea
                                value={editPostText[post.id]}
                                onChange={(e) =>
                                  setEditPostText(prev => ({
                                    ...prev,
                                    [post.id]: e.target.value,
                                  }))
                                }
                                rows="3"
                                className="edit-post-textarea"
                              />
                              <input
                                type="file"
                                accept="image/*,video/*"
                                multiple
                                onChange={(e) =>
                                  setEditPostMediaFiles(prev => ({
                                    ...prev,
                                    [post.id]: Array.from(e.target.files),
                                  }))
                                }
                              />
                              {editPostMediaFiles[post.id]?.length > 0 && (
                                <div className="image-preview">
                                  {editPostMediaFiles[post.id].map((file, index) => (
                                    <div key={index} className="media-preview-item">
                                      {file.type.startsWith("image/") ? (
                                        <img
                                          src={URL.createObjectURL(file)}
                                          alt="Preview"
                                          className="preview-image"
                                        />
                                      ) : (
                                        <video
                                          src={URL.createObjectURL(file)}
                                          className="preview-video"
                                          controls
                                        >
                                          Your browser does not support the video tag.
                                        </video>
                                      )}
                                    </div>
                                  ))}
                                </div>
                              )}
                              <input
                                type="text"
                                value={editPostMediaUrl[post.id] || ""}
                                onChange={(e) =>
                                  setEditPostMediaUrl(prev => ({
                                    ...prev,
                                    [post.id]: e.target.value,
                                  }))
                                }
                                placeholder="Or enter a new media URL"
                                className="manual-url-input"
                              />
                              <button type="submit" className="edit-post-submit-button">
                                Save
                              </button>
                            </form>
                          ) : (
                            <>
                              {post.message && <p>{post.message}</p>}
                              {post.attachments?.data?.[0] && (
                                <>
                                  {post.attachments.data[0].type === "video_inline" ||
                                  post.attachments.data[0].type === "video" ? (
                                    <video
                                      className="post-video"
                                      poster={
                                        post.attachments.data[0].media?.image?.src ||
                                        "https://via.placeholder.com/300"
                                      }
                                      controls
                                    >
                                      <source
                                        src={post.attachments.data[0].media?.source}
                                        type="video/mp4"
                                      />
                                      Your browser does not support the video tag.
                                    </video>
                                  ) : post.attachments.data[0].media?.image ? (
                                    <img
                                      src={post.attachments.data[0].media.image.src}
                                      alt="Post media"
                                      className="post-image"
                                      onError={(e) =>
                                        (e.target.src = "https://via.placeholder.com/300")
                                      }
                                    />
                                  ) : null}
                                </>
                              )}
                            </>
                          )}
                          <div className="post-actions">
                            <button
                              className={`action-button ${likedPosts[post.id] ? "liked" : ""}`}
                              onClick={() => handleLikePost(post.id)}
                            >
                              {likedPosts[post.id] ? "Unlike" : "Like"} (
                              {post.likes?.summary?.total_count || 0})
                            </button>
                            <button
                              className="action-button"
                              onClick={() => fetchPostComments(post.id)}
                            >
                              Comment ({post.comments?.summary?.total_count || 0})
                            </button>
                            <button className="action-button boost-action">Boost</button>
                          </div>
                          <div className="comment-section">
                            {comments[post.id] && (
                              <div className="comments-list">
                                {comments[post.id].map((comment) => (
                                  <CommentItem
                                    key={comment.id}
                                    comment={comment}
                                    postId={post.id}
                                  />
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
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p>No posts available.</p>
                  )}
                </div>
              )}
              {activeTab === "About" && (
                <div className="about-section">
                  <div className="about-section-header">
                    <h2>About</h2>
                  </div>
                  <div className="about-section-content">
                    <h3>Contact Information</h3>
                    {pageData.phone && (
                      <div className="info-item">
                        <span className="info-icon">📞</span>
                        <p>Phone: {pageData.phone}</p>
                      </div>
                    )}
                    {pageData.email && (
                      <div className="info-item">
                        <span className="info-icon">📧</span>
                        <p>
                          Email: <a href={`mailto:${pageData.email}`}>{pageData.email}</a>
                        </p>
                      </div>
                    )}
                    {pageData.website && (
                      <div className="info-item">
                        <span className="info-icon">🌐</span>
                        <p>
                          Website:{" "}
                          <a href={pageData.website} target="_blank" rel="noopener noreferrer">
                            {pageData.website}
                          </a>
                        </p>
                      </div>
                    )}
                    {pageData.link && (
                      <div className="info-item">
                        <span className="info-icon">🔗</span>
                        <p>
                          Facebook:{" "}
                          <a href={pageData.link} target="_blank" rel="noopener noreferrer">
                            {pageData.username || pageData.link}
                          </a>
                        </p>
                      </div>
                    )}
                    {!pageData.phone && !pageData.email && !pageData.website && !pageData.link && (
                      <p>No contact information available.</p>
                    )}
                  </div>
                  {pageData.location && (
                    <div className="about-section-content">
                      <h3>Location</h3>
                      <div className="info-item">
                        <span className="info-icon">📍</span>
                        <p>
                          {pageData.location.street ? `${pageData.location.street}, ` : ""}
                          {pageData.location.city ? `${pageData.location.city}, ` : ""}
                          {pageData.location.state ? `${pageData.location.state}, ` : ""}
                          {pageData.location.country ? `${pageData.location.country}` : ""}
                          {pageData.location.zip ? ` ${pageData.location.zip}` : ""}
                        </p>
                      </div>
                    </div>
                  )}
                  <div className="about-section-content">
                    <h3>Business Details</h3>
                    <div className="info-item">
                      <span className="info-icon">🏷️</span>
                      <p>Category: {pageData.category || "Home Businesses"}</p>
                    </div>
                    {pageData.description && (
                      <div className="info-item">
                        <span className="info-icon">📝</span>
                        <p>Description: {pageData.description}</p>
                      </div>
                    )}
                    {pageData.about && (
                      <div className="info-item">
                        <span className="info-icon">ℹ️</span>
                        <p>About: {pageData.about}</p>
                      </div>
                    )}
                    {pageData.founded && (
                      <div className="info-item">
                        <span className="info-icon">📅</span>
                        <p>Founded: {pageData.founded}</p>
                      </div>
                    )}
                    {pageData.mission && (
                      <div className="info-item">
                        <span className="info-icon">🎯</span>
                        <p>Mission: {pageData.mission}</p>
                      </div>
                    )}
                    {pageData.products && (
                      <div className="info-item">
                        <span className="info-icon">🛍️</span>
                        <p>Products: {pageData.products}</p>
                      </div>
                    )}
                  </div>
                  {pageData.hours && (
                    <div className="about-section-content">
                      <h3>Operating Hours</h3>
                      {Object.entries(pageData.hours).map(([day, hours]) => (
                        <div key={day} className="info-item">
                          <span className="info-icon">⏰</span>
                          <p>{day.charAt(0).toUpperCase() + day.slice(1)}: {hours}</p>
                        </div>
                      ))}
                    </div>
                  )}
                  <div className="about-section-content">
                    <h3>Engagement</h3>
                    <div className="info-item">
                      <span className="info-icon">👍</span>
                      <p>Likes: {pageData.fan_count.toLocaleString()}</p>
                    </div>
                    {pageData.followers_count && (
                      <div className="info-item">
                        <span className="info-icon">👥</span>
                        <p>Followers: {pageData.followers_count.toLocaleString()}</p>
                      </div>
                    )}
                    {pageData.engagement && pageData.engagement.count && (
                      <div className="info-item">
                        <span className="info-icon">💬</span>
                        <p>
                          Engagement: {pageData.engagement.count.toLocaleString()} interactions
                        </p>
                      </div>
                    )}
                  </div>
                  <div className="about-section-content">
                    <h3>Page Status</h3>
                    {pageData.verification_status && (
                      <div className="info-item">
                        <span className="info-icon">✅</span>
                        <p>
                          Verification:{" "}
                          {pageData.verification_status === "verified" ? "Verified" : "Not Verified"}
                        </p>
                      </div>
                    )}
                    <div className="info-item">
                      <span className="info-icon">⭐</span>
                      <p>
                        Rating:{" "}
                        {pageData.rating_count
                          ? `${pageData.rating_count} reviews`
                          : "Not yet rated (0 Reviews)"}
                      </p>
                    </div>
                    <div className="info-item">
                      <span className="info-icon">📢</span>
                      <p>Status: {pageData.is_published ? "Published" : "Unpublished"}</p>
                    </div>
                  </div>
                  <div className="about-section-content">
                    <h3>Reels</h3>
                    <p>{pageData.name}'s Reels</p>
                    {isLoading ? (
                      <p>Loading reels...</p>
                    ) : reels.length > 0 ? (
                      <div className="reels-gallery">
                        {reels.slice(0, 3).map((reel) => (
                          <div key={reel.id} className="reel-item">
                            <div className="reel-wrapper">
                              <video
                                className="reel-video"
                                poster={reel.thumbnail || "https://via.placeholder.com/150"}
                                controls
                              >
                                <source src={reel.source} type="video/mp4" />
                                Your browser does not support the video tag.
                              </video>
                            </div>
                            <div className="reel-info">
                              <p>{reel.description || reel.title || "Untitled Reel"}</p>
                              <small>{new Date(reel.created_time).toLocaleString()}</small>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p>No reels available.</p>
                    )}
                  </div>
                  <div className="about-section-content">
                    <h3>Videos</h3>
                    <p>{pageData.name}'s Videos</p>
                    {isLoading ? (
                      <p>Loading videos...</p>
                    ) : videos.length > 0 ? (
                      <div className="videos-gallery">
                        {videos.slice(0, 3).map((video) => (
                          <div key={video.id} className="video-item">
                            <div className="video-wrapper">
                              <video
                                className="video-player"
                                poster={video.thumbnail_url || "https://via.placeholder.com/150"}
                                controls
                              >
                                <source src={video.source} type="video/mp4" />
                                Your browser does not support the video tag.
                              </video>
                            </div>
                            <div className="video-info">
                              <p>{video.description || video.title || "Untitled Video"}</p>
                              <small>{new Date(video.created_time).toLocaleString()}</small>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p>No videos available.</p>
                    )}
                  </div>
                  <div className="about-section-content">
                    <h3>Followers</h3>
                    {pageData.followers_count ? (
                      <div className="info-item">
                        <span className="info-icon">👥</span>
                        <p>
                          {pageData.name} has {pageData.followers_count.toLocaleString()} followers.
                        </p>
                      </div>
                    ) : (
                      <p>{pageData.name}'s follower count is unavailable.</p>
                    )}
                    <p>
                      Note: The list of individual followers is not accessible due to privacy
                      restrictions.
                    </p>
                  </div>
                </div>
              )}
              {activeTab === "Photos" && (
                <div className="photos-section">
                  <h2>Photos</h2>
                  {photos.length > 0 ? (
                    <div className="photo-gallery">
                      {photos.map((photo) => (
                        <div key={photo.id} className="photo-item">
                          <div className="photo-wrapper">
                            <img
                              src={photo.images[0]?.source}
                              alt={photo.name || "Page Photo"}
                              className="photo-image"
                              onError={(e) => (e.target.src = "https://via.placeholder.com/200")}
                            />
                          </div>
                          <div className="photo-info">
                            <p>{photo.name || "Untitled"}</p>
                            <small>{new Date(photo.created_time).toLocaleString()}</small>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p>No photos available.</p>
                  )}
                </div>
              )}
              {activeTab !== "Posts" && activeTab !== "Photos" && activeTab !== "About" && (
                <p>Content for {activeTab} tab coming soon...</p>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default FacebookProfile;