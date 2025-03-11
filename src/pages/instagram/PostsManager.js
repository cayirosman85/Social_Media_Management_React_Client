// PostsManager.js
import React, { useState, useEffect, useRef } from "react";
import NewPostModal from "../../components/instagram/NewPostModal";
import InsightsModal from "../../components/instagram/InsightsModal";
import PostItem from "../../components/instagram/PostItem"; // New component
import {
  publishPost,
  toggleCommentVisibility,
  deleteComment,
  createComment,
  createReply,
  getUserPosts,
  getMediaInsights,
} from "../../services/instagram/instagramService";
import { FaPlus } from "react-icons/fa";
import "./PostsManager.css";

const PostsManager = () => {
  const [posts, setPosts] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showNewPostModal, setShowNewPostModal] = useState(false);
  const [newComments, setNewComments] = useState({});
  const [newReplies, setNewReplies] = useState({});
  const [replyingTo, setReplyingTo] = useState(null);
  const [insightsData, setInsightsData] = useState({});
  const [paging, setPaging] = useState({ after: null, before: null });
  const [selectedPostId, setSelectedPostId] = useState(null);

  const postsContainerRef = useRef(null);

  const instagramData = {
    business_discovery: {
      id: "17841473036355290",
      username: "osmancayir73",
    },
    accessToken: "EAAZAde8LZA8zIBO4O8QsOQmyMMMShi79cCZBMRJZCjbSbXG7Y3ZAQ4OGvJN1vi8LYLeNx6K9pbxpFuU2saC3lWWt43za1ggpCu9YONtmCuwucaWVgtYYqRcG2oMtuHPhxq6x4n3ImiE3TzXf4IzMHxMtuDbwNfT52ZA6yjkwWabhrLZCrb7zqWzdkjZBApQJmNntUgZDZD",
  };

  const fetchPosts = async (cursor = null, direction = "after", append = false) => {
    setIsLoading(true);
    let scrollPosition = 0;

    if (append && postsContainerRef.current) {
      scrollPosition = postsContainerRef.current.scrollTop;
    }

    try {
      const data = await getUserPosts(
        instagramData.business_discovery.id,
        instagramData.business_discovery.username,
        instagramData.accessToken,
        5,
        cursor
      );
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
        after: data?.paging?.cursors?.after || null,
        before: data?.paging?.cursors?.before || null,
      });

      if (append && postsContainerRef.current) {
        requestAnimationFrame(() => {
          postsContainerRef.current.scrollTop = scrollPosition;
        });
      }
    } catch (error) {
      console.error("Error fetching posts:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPosts(null, "after", false);
  }, []);

  const handleNextPage = () => {
    if (paging.after) fetchPosts(paging.after, "after", true);
  };

  const handlePrevPage = () => {
    if (paging.before) fetchPosts(paging.before, "before", false);
  };

  const fetchInsights = async (postId, mediaType) => {
    setIsLoading(true);
    try {
      const data = await getMediaInsights(
        instagramData.business_discovery.id,
        postId,
        instagramData.accessToken,
        mediaType
      );
  
      console.log("Fetched data:", data); // Log the full response
      const insights = data?.insights?.insights || { data: [] }; // Ensure fallback if insights are missing
      console.log("Extracted insights:", insights);
  
      setInsightsData((prev) => ({ ...prev, [postId]: insights }));
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

  const handleNewPostSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    const formData = new FormData(e.target);
    const caption = formData.get("caption");
    const mediaFiles = formData.getAll("mediaFiles");
    const mediaUrls = formData.get("mediaUrls")?.split(",").map((url) => url.trim()) || [];

    try {
      let postData = {
        user_id: instagramData.business_discovery.id,
        access_token: instagramData.accessToken,
        caption,
      };

      if (mediaFiles.length === 0 && mediaUrls.length === 0) {
        throw new Error("Please provide either media files or media URLs.");
      }

      if (mediaUrls.length > 0) {
        if (mediaUrls.length === 1) {
          const url = mediaUrls[0];
          const urlExtension = url.split(".").pop().toLowerCase();
          const isImage = ["jpg", "jpeg"].includes(urlExtension);
          const isVideo = ["mp4", "mov"].includes(urlExtension);

          if (!isImage && !isVideo) throw new Error("Unsupported URL media type.");
          if (isImage) postData.image_url = url;
          else if (isVideo) postData.video_url = url;
        } else {
          postData.children = mediaUrls;
        }
      } else if (mediaFiles.length > 0) {
        const uploadedUrls = [];
        for (const mediaFile of mediaFiles) {
          if (!mediaFile.name) continue;

          const uploadFormData = new FormData();
          uploadFormData.append("mediaFile", mediaFile);
          const uploadResponse = await fetch("http://localhost:8000/api/upload", {
            method: "POST",
            body: uploadFormData,
          });
          const uploadData = await uploadResponse.json();
          if (!uploadData.success) throw new Error(uploadData.error);
          uploadedUrls.push(uploadData.url);
        }

        if (uploadedUrls.length === 1) {
          const url = uploadedUrls[0];
          const finalExtension = url.split(".").pop().toLowerCase();
          const isFinalImage = ["jpg", "jpeg"].includes(finalExtension);
          const isFinalVideo = ["mp4", "mov"].includes(finalExtension);

          if (isFinalImage) postData.image_url = url;
          else if (isFinalVideo) postData.video_url = url;
        } else {
          postData.children = uploadedUrls;
        }
      }

      const result = await publishPost(postData);
      if (result.success) {
        fetchPosts(null, "after", false);
        setShowNewPostModal(false);
        alert("Post published successfully!");
      }
    } catch (error) {
      console.error("Error publishing post:", error);
      alert(`Error publishing post: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleCommentVisibility = async (postId, commentId, isHidden) => {
    setIsLoading(true);
    try {
      await toggleCommentVisibility(
        instagramData.business_discovery.id,
        commentId,
        instagramData.accessToken,
        !isHidden
      );
      setPosts((prevPosts) =>
        prevPosts.map((post) =>
          post.id === postId
            ? {
                ...post,
                comments: {
                  ...post.comments,
                  data: post.comments.data.map((comment) =>
                    comment.id === commentId
                      ? { ...comment, hidden: !isHidden }
                      : comment
                  ),
                },
              }
            : post
        )
      );
      alert(`Comment ${!isHidden ? "hidden" : "shown"} successfully!`);
    } catch (error) {
      console.error("Error toggling comment visibility:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteComment = async (postId, commentId) => {
    if (!window.confirm("Are you sure you want to delete this comment?")) return;

    setIsLoading(true);
    try {
      await deleteComment(
        instagramData.business_discovery.id,
        commentId,
        instagramData.accessToken
      );
      setPosts((prevPosts) =>
        prevPosts.map((post) =>
          post.id === postId
            ? {
                ...post,
                comments: {
                  ...post.comments,
                  data: post.comments.data.filter(
                    (comment) => comment.id !== commentId
                  ),
                },
                comments_count: post.comments_count - 1,
              }
            : post
        )
      );
      alert("Comment deleted successfully!");
    } catch (error) {
      console.error("Error deleting comment:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateComment = async (e, postId) => {
    e.preventDefault();
    const commentText = newComments[postId]?.trim();
    if (!commentText) return;

    setIsLoading(true);
    try {
      const result = await createComment(
        instagramData.business_discovery.id,
        postId,
        instagramData.accessToken,
        commentText
      );
      const newCommentObj = {
        id: result.comment_id,
        username: instagramData.business_discovery.username,
        text: commentText,
        timestamp: new Date().toISOString(),
        hidden: false,
      };
      setPosts((prevPosts) =>
        prevPosts.map((post) =>
          post.id === postId
            ? {
                ...post,
                comments: {
                  ...post.comments,
                  data: [...(post.comments?.data || []), newCommentObj],
                },
                comments_count: (post.comments_count || 0) + 1,
              }
            : post
        )
      );
      setNewComments((prev) => ({ ...prev, [postId]: "" }));
      alert("Comment posted successfully!");
    } catch (error) {
      console.error("Error creating comment:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateReply = async (e, postId, commentId) => {
    e.preventDefault();
    const replyText = newReplies[`${postId}-${commentId}`]?.trim();
    if (!replyText) return;

    setIsLoading(true);
    try {
      const result = await createReply(
        instagramData.business_discovery.id,
        commentId,
        instagramData.accessToken,
        replyText
      );
      const newReplyObj = {
        id: result.reply_id,
        username: instagramData.business_discovery.username,
        text: replyText,
        timestamp: new Date().toISOString(),
      };
      setPosts((prevPosts) =>
        prevPosts.map((post) =>
          post.id === postId
            ? {
                ...post,
                comments: {
                  ...post.comments,
                  data: post.comments.data.map((comment) =>
                    comment.id === commentId
                      ? {
                          ...comment,
                          replies: {
                            ...comment.replies,
                            data: [...(comment.replies?.data || []), newReplyObj],
                          },
                        }
                      : comment
                  ),
                },
              }
            : post
        )
      );
      setNewReplies((prev) => ({ ...prev, [`${postId}-${commentId}`]: "" }));
      setReplyingTo(null);
      alert("Reply posted successfully!");
    } catch (error) {
      console.error("Error creating reply:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="posts-manager">
      <div className="posts-header">
        <h2 className="posts-title">Posts</h2>
        <button
          onClick={() => setShowNewPostModal(true)}
          className="new-post-btn"
        >
          <FaPlus /> New Post
        </button>
      </div>

      <div ref={postsContainerRef} className="posts-content">
        {isLoading && (
          <div className="loading-overlay">
            <div className="spinner"></div>
            <p>Loading posts...</p>
          </div>
        )}
        {!isLoading && posts.length === 0 ? (
          <div className="no-posts">
            <svg
              width="48"
              height="48"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#8e8e8e"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
              <circle cx="8.5" cy="8.5" r="1.5" />
              <polyline points="21 15 16 10 5 21" />
            </svg>
            <p>No posts yet!</p>
            <button
              onClick={() => setShowNewPostModal(true)}
              className="create-first-post-btn"
            >
              Create Your First Post
            </button>
          </div>
        ) : (
          <>
            <div className="posts-list">
              {posts.map((post) => (
                <PostItem
                  key={post.id}
                  post={{ ...post, username: instagramData.business_discovery.username }}
                  isLoading={isLoading}
                  newComments={newComments}
                  setNewComments={setNewComments}
                  newReplies={newReplies}
                  setNewReplies={setNewReplies}
                  replyingTo={replyingTo}
                  setReplyingTo={setReplyingTo}
                  onToggleCommentVisibility={handleToggleCommentVisibility}
                  onDeleteComment={handleDeleteComment}
                  onCreateComment={handleCreateComment}
                  onCreateReply={handleCreateReply}
                  onToggleInsights={toggleInsights}
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
          </>
        )}
      </div>

      {showNewPostModal && (
        <NewPostModal
          onSubmit={handleNewPostSubmit}
          isLoading={isLoading}
          onClose={() => setShowNewPostModal(false)}
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
    </div>
  );
};

export default PostsManager;