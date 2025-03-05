import React, { useState, useEffect } from "react";
import InstagramPost from "../../components/instagram/InstagramPost";
import NewPostModal from "../../components/instagram/NewPostModal";
import CarouselSlider from "../../components/instagram/CarouselSlider";
import { fetchInstagramData, publishPost, toggleCommentVisibility, deleteComment, createComment, createReply } from "../../services/instagram/instagramService";

const PostsManager = ({ instagramData }) => {
  const [posts, setPosts] = useState([]);
  const [selectedPost, setSelectedPost] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showNewPostModal, setShowNewPostModal] = useState(false);
  const [newComment, setNewComment] = useState("");
  const [replyingTo, setReplyingTo] = useState(null);
  const [newReply, setNewReply] = useState("");
  const [showInsights, setShowInsights] = useState(false);

  useEffect(() => {
    if (instagramData) {
      setIsLoading(true);
      fetchInstagramData(
        "17841473036355290",
        "osmancayir73",
        "EAAZAde8LZA8zIBO4O8QsOQmyMMMShi79cCZBMRJZCjbSbXG7Y3ZAQ4OGvJN1vi8LYLeNx6K9pbxpFuU2saC3lWWt43za1ggpCu9YONtmCuwucaWVgtYYqRcG2oMtuHPhxq6x4n3ImiE3TzXf4IzMHxMtuDbwNfT52ZA6yjkwWabhrLZCrb7zqWzdkjZBApQJmNntUgZDZD"
      )
        .then((data) => setPosts(data.business_discovery.media.data))
        .catch((error) => console.error("Error fetching posts:", error))
        .finally(() => setIsLoading(false));
    }
  }, [instagramData]);

  const handleNewPostSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    const formData = new FormData(e.target);
    const caption = formData.get("caption");
    const mediaFiles = formData.getAll("mediaFiles");
    const mediaUrls = formData.get("mediaUrls")
      ? formData.get("mediaUrls").split(",").map((url) => url.trim())
      : [];

    try {
      let postData = {
        user_id: "17841473036355290",
        access_token: "EAAZAde8LZA8zIBO4O8QsOQmyMMMShi79cCZBMRJZCjbSbXG7Y3ZAQ4OGvJN1vi8LYLeNx6K9pbxpFuU2saC3lWWt43za1ggpCu9YONtmCuwucaWVgtYYqRcG2oMtuHPhxq6x4n3ImiE3TzXf4IzMHxMtuDbwNfT52ZA6yjkwWabhrLZCrb7zqWzdkjZBApQJmNntUgZDZD",
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
            throw new Error("Unsupported URL media type. Use JPG/JPEG for images or MP4/MOV for videos.");
          }

          if (isImage) postData.image_url = url;
          else if (isVideo) postData.video_url = url;
        } else {
          postData.children = mediaUrls.map((url) => {
            const urlExtension = url.split(".").pop().toLowerCase();
            if (!["jpg", "jpeg", "mp4", "mov"].includes(urlExtension)) {
              throw new Error(`Unsupported URL media type in carousel: ${url}. Use JPG/JPEG or MP4/MOV.`);
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
            throw new Error("Unsupported file type. Use JPG/JPEG for images or MP4/MOV for videos.");
          }

          const fileSizeMB = mediaFile.size / (1024 * 1024);
          if (isImageUpload && fileSizeMB > 8) {
            throw new Error(`Image file size exceeds 8 MB limit: ${fileSizeMB.toFixed(2)} MB`);
          }
          if (isVideoUpload && fileSizeMB > 4 * 1024) {
            throw new Error(`Video file size exceeds 4 GB limit: ${(fileSizeMB / 1024).toFixed(2)} GB`);
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
                    reject(new Error(`Image width must be between 320px and 1440px, got: ${width}px`));
                  }
                  if (aspectRatio < 0.8 || aspectRatio > 1.91) {
                    reject(new Error(`Image aspect ratio must be between 0.8 (4:5) and 1.91 (1.91:1), got: ${aspectRatio.toFixed(2)}`));
                  }
                  resolve();
                };
                img.onerror = () => reject(new Error("Failed to load image for validation"));
                img.src = URL.createObjectURL(file);
              } else if (isVideoUpload) {
                const video = document.createElement("video");
                video.onloadedmetadata = () => {
                  const width = video.videoWidth;
                  const height = video.videoHeight;
                  const aspectRatio = width / height;

                  if (width < 320 || width > 1440) {
                    reject(new Error(`Video width must be between 320px and 1440px, got: ${width}px`));
                  }
                  if (aspectRatio < 0.8 || aspectRatio > 1.91) {
                    reject(new Error(`Video aspect ratio must be between 0.8 (4:5) and 1.91 (1.91:1), got: ${aspectRatio.toFixed(2)}`));
                  }
                  resolve();
                };
                video.onerror = () => reject(new Error("Failed to load video for validation"));
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
        fetchInstagramData(
          "17841473036355290",
          "osmancayir73",
          "EAAZAde8LZA8zIBO4O8QsOQmyMMMShi79cCZBMRJZCjbSbXG7Y3ZAQ4OGvJN1vi8LYLeNx6K9pbxpFuU2saC3lWWt43za1ggpCu9YONtmCuwucaWVgtYYqRcG2oMtuHPhxq6x4n3ImiE3TzXf4IzMHxMtuDbwNfT52ZA6yjkwWabhrLZCrb7zqWzdkjZBApQJmNntUgZDZD"
        ).then((data) => setPosts(data.business_discovery.media.data));
        setShowNewPostModal(false);
        alert("Post published successfully!");
      } else {
        throw new Error(result.error || "Unknown error");
      }
    } catch (error) {
      console.error("Error publishing post:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleCommentVisibility = async (commentId, isHidden) => {
    setIsLoading(true);
    try {
      const result = await toggleCommentVisibility(
        instagramData.business_discovery.id,
        commentId,
        instagramData.accessToken,
        !isHidden
      );
      const updatedComments = selectedPost.comments.data.map((comment) =>
        comment.id === commentId ? { ...comment, hidden: !isHidden } : comment
      );
      setSelectedPost({
        ...selectedPost,
        comments: { ...selectedPost.comments, data: updatedComments },
      });
      alert(`Comment ${!isHidden ? "hidden" : "shown"} successfully!`);
    } catch (error) {
      console.error("Error toggling comment visibility:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteComment = async (commentId) => {
    if (!window.confirm("Are you sure you want to delete this comment?")) return;

    setIsLoading(true);
    try {
      await deleteComment(instagramData.business_discovery.id, commentId, instagramData.accessToken);
      const updatedComments = selectedPost.comments.data.filter((comment) => comment.id !== commentId);
      setSelectedPost({
        ...selectedPost,
        comments: { ...selectedPost.comments, data: updatedComments },
      });
      alert("Comment deleted successfully!");
    } catch (error) {
      console.error("Error deleting comment:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateComment = async (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    setIsLoading(true);
    try {
      const result = await createComment(
        instagramData.business_discovery.id,
        selectedPost.id,
        instagramData.accessToken,
        newComment
      );
      const newCommentObj = {
        id: result.comment_id,
        username: instagramData.business_discovery.username,
        text: newComment,
        timestamp: new Date().toISOString(),
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
    } catch (error) {
      console.error("Error creating comment:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateReply = async (e, commentId) => {
    e.preventDefault();
    if (!newReply.trim()) return;

    setIsLoading(true);
    try {
      const result = await createReply(instagramData.business_discovery.id, commentId, instagramData.accessToken, newReply);
      const newReplyObj = {
        id: result.reply_id,
        username: instagramData.business_discovery.username,
        text: newReply,
        timestamp: new Date().toISOString(),
      };
      const updatedComments = selectedPost.comments.data.map((comment) => {
        if (comment.id === commentId) {
          return {
            ...comment,
            replies: {
              ...comment.replies,
              data: [...(comment.replies?.data || []), newReplyObj],
            },
          };
        }
        return comment;
      });
      setSelectedPost({
        ...selectedPost,
        comments: { ...selectedPost.comments, data: updatedComments },
      });
      setNewReply("");
      setReplyingTo(null);
      alert("Reply posted successfully!");
    } catch (error) {
      console.error("Error creating reply:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="media-feed">
      <button onClick={() => setShowNewPostModal(true)}>Create New Post</button>
      <div className="media-grid">
        {posts.map((post) => (
          <InstagramPost key={post.id} post={post} onClick={() => setSelectedPost(post)} />
        ))}
      </div>
      {showNewPostModal && (
        <NewPostModal onSubmit={handleNewPostSubmit} isLoading={isLoading} onClose={() => setShowNewPostModal(false)} />
      )}
      {selectedPost && (
        <div className="modal" onClick={() => setSelectedPost(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <span className="close" onClick={() => setSelectedPost(null)}>×</span>
            <div className="modal-body">
              <div className="modal-image">
                {selectedPost.media_type === "IMAGE" ? (
                  <img src={selectedPost.media_url} alt="Post" className="modal-img" />
                ) : selectedPost.media_type === "VIDEO" ? (
                  <video src={selectedPost.media_url} className="modal-img" controls autoPlay muted />
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
                  {selectedPost.comments && selectedPost.comments.data.length > 0 ? (
                    selectedPost.comments.data.map((comment) => (
                      <div key={comment.id} className="comment-container">
                        <div className="comment">
                          <img
                            src={`https://picsum.photos/seed/${comment.username}/32/32`}
                            alt={`${comment.username}'s avatar`}
                            className="comment-avatar"
                          />
                          <div className="comment-content">
                            <span className="comment-username">{comment.username}</span>
                            <span className="comment-text">{comment.text}</span>
                            <div className="comment-meta">
                              <span className="comment-timestamp">
                                {new Date(comment.timestamp).toLocaleString()}
                              </span>
                              <button
                                onClick={() => handleToggleCommentVisibility(comment.id, comment.hidden)}
                                className="comment-action-btn"
                              >
                                {comment.hidden ? "Show" : "Hide"}
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
                                    placeholder={`Reply to ${comment.username}...`}
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
                        {comment.replies && comment.replies.data.length > 0 && (
                          <div className="replies-container">
                            {comment.replies.data.map((reply) => (
                              <div key={reply.id} className="reply">
                                <img
                                  src={`https://picsum.photos/seed/${reply.username}/24/24`}
                                  alt={`${reply.username}'s avatar`}
                                  className="reply-avatar"
                                />
                                <div className="reply-content">
                                  <span className="comment-username">{reply.username}</span>
                                  <span className="comment-text">{reply.text}</span>
                                  <div className="reply-meta">
                                    <span className="comment-timestamp">
                                      {new Date(reply.timestamp).toLocaleString()}
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
                      setShowInsights(!showInsights);
                    }}
                  >
                    {showInsights ? "Hide insights" : "View insights"}
                  </a>
                  <button className="boost-btn">Boost post</button>
                </div>
                {showInsights && selectedPost.insights && (
                  <div className="insights-section">
                    <h3>Insights</h3>
                    <ul>
                      {selectedPost.insights.map((insight, index) => (
                        <li key={index} className="insight-item">
                          <strong>{insight.title}:</strong> {insight.values[0]?.value || 0}
                          <br />
                          <small>{insight.description}</small>
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
    </div>
  );
};

export default PostsManager;