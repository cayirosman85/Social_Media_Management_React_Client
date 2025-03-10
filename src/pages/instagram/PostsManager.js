import React, { useState, useEffect, useRef } from "react";
import NewPostModal from "../../components/instagram/NewPostModal";
import CarouselSlider from "../../components/instagram/CarouselSlider";
import InsightsModal from "../../components/instagram/InsightsModal";
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

  // Add a ref to track the posts container
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
      5, // Limit
      cursor
    );
    console.log("Raw response from getUserPosts:", data);

    // Extract media items from the correct path
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

    // Update paging info from the response
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
    if (paging.after) {
      fetchPosts(paging.after, "after", true);
    }
  };

  const handlePrevPage = () => {
    if (paging.before) {
      fetchPosts(paging.before, "before", false);
    }
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
      setInsightsData((prev) => ({ ...prev, [postId]: data.insights || [] }));
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
    const mediaUrls = formData
      .get("mediaUrls")
      ?.split(",")
      .map((url) => url.trim()) || [];

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

          if (!isImage && !isVideo) {
            throw new Error(
              "Unsupported URL media type. Use JPG/JPEG for images or MP4/MOV for videos."
            );
          }

          if (isImage) postData.image_url = url;
          else if (isVideo) postData.video_url = url;
        } else {
          postData.children = mediaUrls.map((url) => {
            const urlExtension = url.split(".").pop().toLowerCase();
            if (!["jpg", "jpeg", "mp4", "mov"].includes(urlExtension)) {
              throw new Error(
                `Unsupported URL media type in carousel: ${url}. Use JPG/JPEG or MP4/MOV.`
              );
            }
            return url;
          });
        }
      } else if (mediaFiles.length > 0) {
        const uploadedUrls = [];
        for (const mediaFile of mediaFiles) {
          if (!mediaFile.name) continue;

          const fileExtension = mediaFile.name.split(".").pop().toLowerCase();
          const isImageUpload = ["jpg", "jpeg"].includes(fileExtension);
          const isVideoUpload = ["mp4", "mov"].includes(fileExtension);

          if (!isImageUpload && !isVideoUpload) {
            throw new Error(
              "Unsupported file type. Use JPG/JPEG for images or MP4/MOV for videos."
            );
          }

          const fileSizeMB = mediaFile.size / (1024 * 1024);
          if (isImageUpload && fileSizeMB > 8) {
            throw new Error(
              `Image file size exceeds 8 MB limit: ${fileSizeMB.toFixed(2)} MB`
            );
          }
          if (isVideoUpload && fileSizeMB > 4 * 1024) {
            throw new Error(
              `Video file size exceeds 4 GB limit: ${(fileSizeMB / 1024).toFixed(2)} GB`
            );
          }

          const validateMediaDimensions = (file) => {
            return new Promise((resolve, reject) => {
              if (isImageUpload) {
                const img = new Image();
                img.onload = () => {
                  const width = img.width;
                  const height = img.height;
                  const aspectRatio = width / height;

                  if (width < 320 || width > 1440) {
                    reject(
                      new Error(
                        `Image width must be between 320px and 1440px, got: ${width}px`
                      )
                    );
                  }
                  if (aspectRatio < 0.8 || aspectRatio > 1.91) {
                    reject(
                      new Error(
                        `Image aspect ratio must be between 0.8 (4:5) and 1.91 (1.91:1), got: ${aspectRatio.toFixed(2)}`
                      )
                    );
                  }
                  resolve();
                };
                img.onerror = () =>
                  reject(new Error("Failed to load image for validation"));
                img.src = URL.createObjectURL(file);
              } else if (isVideoUpload) {
                const video = document.createElement("video");
                video.onloadedmetadata = () => {
                  const width = video.videoWidth;
                  const height = video.videoHeight;
                  const aspectRatio = width / height;

                  if (width < 320 || width > 1440) {
                    reject(
                      new Error(
                        `Video width must be between 320px and 1440px, got: ${width}px`
                      )
                    );
                  }
                  if (aspectRatio < 0.8 || aspectRatio > 1.91) {
                    reject(
                      new Error(
                        `Video aspect ratio must be between 0.8 (4:5) and 1.91 (1.91:1), got: ${aspectRatio.toFixed(2)}`
                      )
                    );
                  }
                  resolve();
                };
                video.onerror = () =>
                  reject(new Error("Failed to load video for validation"));
                video.src = URL.createObjectURL(file);
              }
            });
          };

          await validateMediaDimensions(mediaFile);

          const uploadFormData = new FormData();
          uploadFormData.append("mediaFile", mediaFile);
          const uploadResponse = await fetch("http://localhost:8000/api/upload", {
            method: "POST",
            body: uploadFormData,
          });

          if (!uploadResponse.ok) {
            const errorText = await uploadResponse.text();
            throw new Error(`Failed to upload media: ${errorText}`);
          }
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
      } else {
        throw new Error(result.error || "Unknown error");
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
    <div
      className="media-feed"
      style={{
        width: "80%",
        margin: "0 auto",
        padding: "20px",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <div
        className="posts-header"
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "30px",
        }}
      >
        <h2 style={{ margin: 0, fontSize: "28px", color: "#262626" }}>Posts</h2>
        <button
          onClick={() => setShowNewPostModal(true)}
          style={{
            padding: "10px 20px",
            backgroundColor: "#0095f6",
            color: "white",
            border: "none",
            borderRadius: "4px",
            cursor: "pointer",
            fontWeight: "bold",
            fontSize: "16px",
            transition: "background-color 0.2s",
            display: "flex",
            alignItems: "center",
            gap: "5px",
          }}
          onMouseOver={(e) => (e.target.style.backgroundColor = "#007bbf")}
          onMouseOut={(e) => (e.target.style.backgroundColor = "#0095f6")}
        >
          <FaPlus /> Post
        </button>
      </div>

      {/* Attach ref to the posts-content container and make it scrollable */}
      <div
        ref={postsContainerRef}
        className="posts-content"
        style={{
          minHeight: "200px",
          maxHeight: "80vh", // Limit height to enable scrolling
          overflowY: "auto", // Enable vertical scrolling
        }}
      >
        {isLoading ? (
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
              Loading posts...
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
        ) : posts.length === 0 ? (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              minHeight: "200px",
              textAlign: "center",
              color: "#8e8e8e",
            }}
          >
            <svg
              width="48"
              height="48"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#8e8e8e"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              style={{ marginBottom: "15px" }}
            >
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
              <circle cx="8.5" cy="8.5" r="1.5" />
              <polyline points="21 15 16 10 5 21" />
            </svg>
            <p style={{ fontSize: "18px", marginBottom: "15px" }}>No posts yet!</p>
            <button
              onClick={() => setShowNewPostModal(true)}
              style={{
                padding: "8px 16px",
                backgroundColor: "#0095f6",
                color: "white",
                border: "none",
                borderRadius: "4px",
                cursor: "pointer",
                fontSize: "14px",
              }}
            >
              Create Your First Post
            </button>
          </div>
        ) : (
          <>
            <div className="posts-list">
              {posts.map((post) => (
                <div
                  key={post.id}
                  className="post-item"
                  style={{
                    display: "flex",
                    border: "1px solid #dbdbdb",
                    marginBottom: "20px",
                    padding: "20px",
                    borderRadius: "4px",
                    backgroundColor: "#fff",
                  }}
                >
                  <div
                    className="post-media"
                    style={{ flex: "1", maxWidth: "400px", marginRight: "20px" }}
                  >
                    {post.media_type === "IMAGE" ? (
                      <img
                        src={post.media_url}
                        alt="Post"
                        style={{ width: "100%", borderRadius: "4px", objectFit: "cover" }}
                      />
                    ) : post.media_type === "VIDEO" ? (
                      <video
                        src={post.media_url}
                        controls
                        style={{ width: "100%", borderRadius: "4px" }}
                      />
                    ) : post.media_type === "CAROUSEL_ALBUM" ? (
                      <CarouselSlider media={post} />
                    ) : null}
                    {post.media_type === "CAROUSEL_ALBUM" && (
                      <p
                        style={{
                          textAlign: "center",
                          color: "#8e8e8e",
                          fontSize: "12px",
                          marginTop: "5px",
                        }}
                      >
                        Carousel ({post.children?.data?.length || "multiple"} items)
                      </p>
                    )}
                  </div>

                  <div className="post-details-section" style={{ flex: "1", minWidth: "0" }}>
                    <p style={{ margin: "10px 0", wordBreak: "break-word" }}>
                      {post.caption || "No caption available"}
                    </p>
                    <p style={{ color: "#8e8e8e", fontSize: "14px" }}>
                      <strong>{post.like_count || 0} likes</strong>
                      <br />
                      <span>{new Date(post.timestamp).toLocaleString()}</span>
                    </p>

                    <div
                      className="comments-section"
                      style={{ marginTop: "20px", maxHeight: "300px", overflowY: "auto" }}
                    >
                      {post?.comments?.data && post.comments.data.length > 0 ? (
                        post.comments.data
                          .filter((comment) => comment && comment.id)
                          .map((comment) => (
                            <div
                              key={comment.id}
                              className="comment-container"
                              style={{ marginBottom: "15px" }}
                            >
                              <div className="comment" style={{ display: "flex" }}>
                                <img
                                  src={`https://picsum.photos/seed/${comment?.username || "default"}/32/32`}
                                  alt={`${comment?.username || "User"}'s avatar`}
                                  style={{
                                    width: "32px",
                                    height: "32px",
                                    borderRadius: "50%",
                                    marginRight: "10px",
                                  }}
                                />
                                <div className="comment-content" style={{ flex: 1 }}>
                                  <span style={{ fontWeight: "bold" }}>
                                    {comment?.username || "Anonymous"}
                                  </span>
                                  <span style={{ marginLeft: "5px" }}>
                                    {comment?.text || "No text"}
                                  </span>
                                  <div
                                    style={{
                                      marginTop: "5px",
                                      color: "#8e8e8e",
                                      fontSize: "12px",
                                    }}
                                  >
                                    <span>
                                      {comment?.timestamp
                                        ? new Date(comment.timestamp).toLocaleString()
                                        : "Unknown time"}
                                    </span>
                                    <button
                                      onClick={() =>
                                        handleToggleCommentVisibility(
                                          post.id,
                                          comment.id,
                                          comment?.hidden || false
                                        )
                                      }
                                      style={{
                                        marginLeft: "10px",
                                        color: "#0095f6",
                                        background: "none",
                                        border: "none",
                                        cursor: "pointer",
                                      }}
                                    >
                                      {comment?.hidden ? "Show" : "Hide"}
                                    </button>
                                    <button
                                      onClick={() => handleDeleteComment(post.id, comment.id)}
                                      style={{
                                        marginLeft: "10px",
                                        color: "#ed4956",
                                        background: "none",
                                        border: "none",
                                        cursor: "pointer",
                                      }}
                                    >
                                      Delete
                                    </button>
                                    <button
                                      onClick={() =>
                                        setReplyingTo(`${post.id}-${comment.id}`)
                                      }
                                      style={{
                                        marginLeft: "10px",
                                        color: "#0095f6",
                                        background: "none",
                                        border: "none",
                                        cursor: "pointer",
                                      }}
                                    >
                                      Reply
                                    </button>
                                  </div>
                                  {replyingTo === `${post.id}-${comment.id}` && (
                                    <div style={{ marginTop: "10px" }}>
                                      <form
                                        onSubmit={(e) =>
                                          handleCreateReply(e, post.id, comment.id)
                                        }
                                        style={{ display: "flex", width: "100%" }}
                                      >
                                        <input
                                          type="text"
                                          placeholder={`Reply to ${comment?.username || "User"}...`}
                                          value={
                                            newReplies[`${post.id}-${comment.id}`] || ""
                                          }
                                          onChange={(e) =>
                                            setNewReplies((prev) => ({
                                              ...prev,
                                              [`${post.id}-${comment.id}`]: e.target.value,
                                            }))
                                          }
                                          disabled={isLoading}
                                          style={{
                                            flex: 1,
                                            padding: "8px",
                                            borderRadius: "4px",
                                            border: "1px solid #dbdbdb",
                                          }}
                                        />
                                        <button
                                          type="submit"
                                          disabled={
                                            isLoading ||
                                            !newReplies[`${post.id}-${comment.id}`]?.trim()
                                          }
                                          style={{
                                            marginLeft: "10px",
                                            padding: "8px 16px",
                                            backgroundColor: "#0095f6",
                                            color: "white",
                                            border: "none",
                                            borderRadius: "4px",
                                            cursor: "pointer",
                                          }}
                                        >
                                          {isLoading ? "Posting..." : "Post"}
                                        </button>
                                      </form>
                                    </div>
                                  )}
                                </div>
                              </div>
                              {comment?.replies?.data && comment.replies.data.length > 0 && (
                                <div style={{ marginLeft: "42px", marginTop: "10px" }}>
                                  {comment.replies.data.map((reply) => (
                                    <div
                                      key={reply.id}
                                      style={{ display: "flex", marginBottom: "10px" }}
                                    >
                                      <img
                                        src={`https://picsum.photos/seed/${reply?.username || "default"}/24/24`}
                                        alt={`${reply?.username || "User"}'s avatar`}
                                        style={{
                                          width: "24px",
                                          height: "24px",
                                          borderRadius: "50%",
                                          marginRight: "10px",
                                        }}
                                      />
                                      <div style={{ flex: 1 }}>
                                        <span style={{ fontWeight: "bold" }}>
                                          {reply?.username || "Anonymous"}
                                        </span>
                                        <span style={{ marginLeft: "5px" }}>
                                          {reply?.text || "No text"}
                                        </span>
                                        <div
                                          style={{
                                            marginTop: "5px",
                                            color: "#8e8e8e",
                                            fontSize: "12px",
                                          }}
                                        >
                                          <span>
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
                        <p style={{ color: "#8e8e8e" }}>
                          No comments yet. Start the conversation.
                        </p>
                      )}
                      <div style={{ marginTop: "20px" }}>
                        <span style={{ marginRight: "10px" }}>😊</span>
                        <form
                          onSubmit={(e) => handleCreateComment(e, post.id)}
                          style={{ display: "flex", width: "100%" }}
                        >
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
                            style={{
                              flex: 1,
                              padding: "8px",
                              borderRadius: "4px",
                              border: "1px solid #dbdbdb",
                            }}
                          />
                          <button
                            type="submit"
                            disabled={isLoading || !newComments[post.id]?.trim()}
                            style={{
                              marginLeft: "10px",
                              padding: "8px 16px",
                              backgroundColor: "#0095f6",
                              color: "white",
                              border: "none",
                              borderRadius: "4px",
                              cursor: "pointer",
                            }}
                          >
                            {isLoading ? "Posting..." : "Post"}
                          </button>
                        </form>
                      </div>
                    </div>

                    <div style={{ marginTop: "20px" }}>
                      <a
                        href="#"
                        onClick={(e) => {
                          e.preventDefault();
                          toggleInsights(post.id, post.media_type);
                        }}
                        style={{
                          color: "#0095f6",
                          textDecoration: "none",
                          marginRight: "20px",
                        }}
                      >
                        View insights
                      </a>
                      <button
                        style={{
                          padding: "8px 16px",
                          backgroundColor: "#0095f6",
                          color: "white",
                          border: "none",
                          borderRadius: "4px",
                          cursor: "pointer",
                        }}
                      >
                        Boost post
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                marginTop: "20px",
              }}
            >
              <button
                onClick={handlePrevPage}
                disabled={!paging.before || isLoading}
                style={{
                  padding: "10px 20px",
                  backgroundColor: paging.before ? "#0095f6" : "#cccccc",
                  color: "white",
                  border: "none",
                  borderRadius: "4px",
                  cursor: paging.before && !isLoading ? "pointer" : "not-allowed",
                }}
              >
                Previous
              </button>
              <button
                onClick={handleNextPage}
                disabled={!paging.after || isLoading}
                style={{
                  padding: "10px 20px",
                  backgroundColor: paging.after ? "#0095f6" : "#cccccc",
                  color: "white",
                  border: "none",
                  borderRadius: "4px",
                  cursor: paging.after && !isLoading ? "pointer" : "not-allowed",
                }}
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