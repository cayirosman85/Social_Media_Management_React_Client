import React, { useState, useEffect } from "react";
import localStorage from "local-storage";
import "./profile.css";

const profile = () => {
  const [pageData, setPageData] = useState(null);
  const [posts, setPosts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [newPostMessage, setNewPostMessage] = useState("");

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
        `https://graph.facebook.com/v18.0/${pageId}?fields=name,about,fan_count,picture&access_token=${accessToken}`
      );
      const data = await response.json();
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
      const response = await fetch("https://localhost:7099/api/Profile/facebook-page-posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ page_id: pageId, access_token: accessToken, limit: 5 }),
      });
      const data = await response.json();
      setPosts(data.data || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreatePost = async (e) => {
    e.preventDefault();
    if (!newPostMessage.trim()) return;

    setIsLoading(true);
    try {
      const response = await fetch("https://localhost:7099/api/Profile/publish-facebook-post", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          page_id: pageId,
          access_token: accessToken,
          message: newPostMessage,
        }),
      });
      const data = await response.json();
      if (data.success) {
        setNewPostMessage("");
        fetchPagePosts();
        alert("Post created successfully!");
      } else {
        throw new Error(data.error || "Failed to create post");
      }
    } catch (error) {
      setError(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div className="error">Error: {error}</div>;

  return (
    <div className="facebook-profile-container">
      {pageData && (
        <>
          <div className="profile-header">
            <img src={pageData.picture.data.url} alt="Page Profile" className="profile-picture" />
            <div>
              <h1>{pageData.name}</h1>
              <p>Fans: {pageData.fan_count}</p>
              <p>{pageData.about}</p>
            </div>
          </div>
          <div className="new-post-section">
            <form onSubmit={handleCreatePost}>
              <textarea
                value={newPostMessage}
                onChange={(e) => setNewPostMessage(e.target.value)}
                placeholder="What's on your mind?"
                rows="3"
              />
              <button type="submit" disabled={isLoading}>
                Post
              </button>
            </form>
          </div>
          <div className="posts-section">
            <h2>Posts</h2>
            {posts.length > 0 ? (
              <ul>
                {posts.map((post) => (
                  <li key={post.id} className="post-item">
                    <p>{post.message}</p>
                    <small>{new Date(post.created_time).toLocaleString()}</small>
                    <p>Likes: {post.likes?.summary.total_count || 0}</p>
                    <p>Comments: {post.comments?.summary.total_count || 0}</p>
                  </li>
                ))}
              </ul>
            ) : (
              <p>No posts available.</p>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default profile;