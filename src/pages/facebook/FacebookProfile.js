// FacebookProfile.jsx
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
          message: commentText[postId]
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
                            {post.message && <p>{post.message}</p>}
                            {post.attachments?.data?.[0]?.media?.image && (
                              <img
                                src={post.attachments.data[0].media.image.src}
                                alt="Post media"
                                className="post-image"
                              />
                            )}
                            <div className="post-actions">
                              <button className="action-button">Like</button>
                              <button
                                className="action-button"
                                onClick={() => fetchPostComments(post.id)}
                              >
                                Comment ({post.comments?.summary?.total_count || 0})
                              </button>
                              <button className="action-button">Share</button>
                            </div>
                            <div className="comment-section">
                              {comments[post.id] && (
                                <div className="comments-list">
                                  {comments[post.id].map((comment) => (
                                    <div key={comment.id} className="comment">
                                      <img
                                        src={comment.from?.picture?.data?.url || pageData.picture.data.url}
                                        alt="Commenter"
                                        className="comment-profile-picture"
                                      />
                                      <div className="comment-content">
                                        <p className="comment-author">{comment.from?.name || pageData.name}</p>
                                        <p>{comment.message}</p>
                                        <small>{new Date(comment.created_time).toLocaleString()}</small>
                                      </div>
                                    </div>
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
                                        [post.id]: e.target.value
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