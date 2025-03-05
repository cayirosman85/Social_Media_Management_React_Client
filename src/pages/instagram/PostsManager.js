import React, { useState, useEffect } from "react";
import NewPostModal from "../../components/instagram/NewPostModal";
import CarouselSlider from "../../components/instagram/CarouselSlider";
import { fetchInstagramData, publishPost, toggleCommentVisibility, deleteComment, createComment, createReply, getUserPosts } from "../../services/instagram/instagramService";

const PostsManager = ({ instagramData }) => {
  const [posts, setPosts] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showNewPostModal, setShowNewPostModal] = useState(false);
  const [newComments, setNewComments] = useState({});
  const [newReplies, setNewReplies] = useState({});
  const [replyingTo, setReplyingTo] = useState(null);
  const [showInsights, setShowInsights] = useState({});

  useEffect(() => {
    const fetchPosts = async () => {
      setIsLoading(true);
      try {
        const data = await getUserPosts(
          "17841473036355290",
          "osmancayir73",
          "EAAZAde8LZA8zIBO4O8QsOQmyMMMShi79cCZBMRJZCjbSbXG7Y3ZAQ4OGvJN1vi8LYLeNx6K9pbxpFuU2saC3lWWt43za1ggpCu9YONtmCuwucaWVgtYYqRcG2oMtuHPhxq6x4n3ImiE3TzXf4IzMHxMtuDbwNfT52ZA6yjkwWabhrLZCrb7zqWzdkjZBApQJmNntUgZDZD"
        );
        setPosts(data.posts || []);
      } catch (error) {
        console.error("Error fetching posts:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchPosts();
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
        const data = await getUserPosts(
          "17841473036355290",
          "osmancayir73",
          "EAAZAde8LZA8zIBO4O8QsOQmyMMMShi79cCZBMRJZCjbSbXG7Y3ZAQ4OGvJN1vi8LYLeNx6K9pbxpFuU2saC3lWWt43za1ggpCu9YONtmCuwucaWVgtYYqRcG2oMtuHPhxq6x4n3ImiE3TzXf4IzMHxMtuDbwNfT52ZA6yjkwWabhrLZCrb7zqWzdkjZBApQJmNntUgZDZD"
        );
        setPosts(data.posts || []);
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
                    comment.id === commentId ? { ...comment, hidden: !isHidden } : comment
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
      await deleteComment(instagramData.business_discovery.id, commentId, instagramData.accessToken);
      setPosts((prevPosts) =>
        prevPosts.map((post) =>
          post.id === postId
            ? {
                ...post,
                comments: {
                  ...post.comments,
                  data: post.comments.data.filter((comment) => comment.id !== commentId),
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
      const result = await createReply(instagramData.business_discovery.id, commentId, instagramData.accessToken, replyText);
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

  const toggleInsights = (postId) => {
    setShowInsights((prev) => ({ ...prev, [postId]: !prev[postId] }));
  };

  return (
    <div className="media-feed" style={{ maxWidth: '900px', margin: '0 auto', padding: '20px' }}>
      <div className="posts-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h2 style={{ margin: 0 }}>Your Posts</h2>
        <button 
          onClick={() => setShowNewPostModal(true)}
          style={{ 
            padding: '10px 20px', 
            backgroundColor: '#0095f6', 
            color: 'white', 
            border: 'none', 
            borderRadius: '4px', 
            cursor: 'pointer',
            fontWeight: 'bold'
          }}
        >
          Create Post
        </button>
      </div>

      {isLoading ? (
        <p style={{ textAlign: 'center' }}>Loading posts...</p>
      ) : posts.length === 0 ? (
        <p style={{ textAlign: 'center' }}>No posts available.</p>
      ) : (
        <div className="posts-list">
          {posts.map((post) => (
            <div 
              key={post.id} 
              className="post-item" 
              style={{ 
                display: 'flex', 
                border: '1px solid #dbdbdb', 
                marginBottom: '20px', 
                padding: '20px', 
                borderRadius: '4px', 
                backgroundColor: '#fff' 
              }}
            >
              {/* Left: Media */}
              <div className="post-media" style={{ flex: '1', maxWidth: '400px', marginRight: '20px' }}>
                {post.media_type === "IMAGE" ? (
                  <img 
                    src={post.media_url} 
                    alt="Post" 
                    style={{ width: '100%', borderRadius: '4px', objectFit: 'cover' }} 
                  />
                ) : post.media_type === "VIDEO" ? (
                  <video 
                    src={post.media_url} 
                    controls 
                    style={{ width: '100%', borderRadius: '4px' }} 
                  />
                ) : post.media_type === "CAROUSEL_ALBUM" ? (
                  <CarouselSlider media={post} /> // Assuming CarouselSlider can handle single media_url
                ) : null}
                {post.media_type === "CAROUSEL_ALBUM" && (
                  <p style={{ textAlign: 'center', color: '#8e8e8e', fontSize: '12px', marginTop: '5px' }}>
                    Carousel ({post.children?.data?.length || 'multiple'} items)
                  </p>
                )}
              </div>

              {/* Right: Details */}
              <div className="post-details-section" style={{ flex: '1', minWidth: '0' }}>
       
                <p style={{ margin: '10px 0', wordBreak: 'break-word' }}>
                  {post.caption || "No caption available"}
                </p>
                <p style={{ color: '#8e8e8e', fontSize: '14px' }}>
                  <strong>{post.like_count || 0} likes</strong>
                  <br />
                  <span>{new Date(post.timestamp).toLocaleString()}</span>
                </p>

                {/* Comments Section */}
                <div className="comments-section" style={{ marginTop: '20px', maxHeight: '300px', overflowY: 'auto' }}>
                  {post?.comments?.data && post.comments.data.length > 0 ? (
                    post.comments.data
                      .filter((comment) => comment && comment.id)
                      .map((comment) => (
                        <div key={comment.id} className="comment-container" style={{ marginBottom: '15px' }}>
                          <div className="comment" style={{ display: 'flex' }}>
                            <img
                              src={`https://picsum.photos/seed/${comment?.username || 'default'}/32/32`}
                              alt={`${comment?.username || 'User'}'s avatar`}
                              style={{ width: '32px', height: '32px', borderRadius: '50%', marginRight: '10px' }}
                            />
                            <div className="comment-content" style={{ flex: 1 }}>
                              <span style={{ fontWeight: 'bold' }}>{comment?.username || 'Anonymous'}</span>
                              <span style={{ marginLeft: '5px' }}>{comment?.text || 'No text'}</span>
                              <div style={{ marginTop: '5px', color: '#8e8e8e', fontSize: '12px' }}>
                                <span>
                                  {comment?.timestamp
                                    ? new Date(comment.timestamp).toLocaleString()
                                    : 'Unknown time'}
                                </span>
                                <button
                                  onClick={() => handleToggleCommentVisibility(post.id, comment.id, comment?.hidden || false)}
                                  style={{ marginLeft: '10px', color: '#0095f6', background: 'none', border: 'none', cursor: 'pointer' }}
                                >
                                  {comment?.hidden ? "Show" : "Hide"}
                                </button>
                                <button
                                  onClick={() => handleDeleteComment(post.id, comment.id)}
                                  style={{ marginLeft: '10px', color: '#ed4956', background: 'none', border: 'none', cursor: 'pointer' }}
                                >
                                  Delete
                                </button>
                                <button
                                  onClick={() => setReplyingTo(`${post.id}-${comment.id}`)}
                                  style={{ marginLeft: '10px', color: '#0095f6', background: 'none', border: 'none', cursor: 'pointer' }}
                                >
                                  Reply
                                </button>
                              </div>
                              {replyingTo === `${post.id}-${comment.id}` && (
                                <div style={{ marginTop: '10px' }}>
                                  <form
                                    onSubmit={(e) => handleCreateReply(e, post.id, comment.id)}
                                    style={{ display: "flex", width: "100%" }}
                                  >
                                    <input
                                      type="text"
                                      placeholder={`Reply to ${comment?.username || 'User'}...`}
                                      value={newReplies[`${post.id}-${comment.id}`] || ""}
                                      onChange={(e) =>
                                        setNewReplies((prev) => ({
                                          ...prev,
                                          [`${post.id}-${comment.id}`]: e.target.value,
                                        }))
                                      }
                                      disabled={isLoading}
                                      style={{ flex: 1, padding: '8px', borderRadius: '4px', border: '1px solid #dbdbdb' }}
                                    />
                                    <button
                                      type="submit"
                                      disabled={isLoading || !newReplies[`${post.id}-${comment.id}`]?.trim()}
                                      style={{
                                        marginLeft: '10px',
                                        padding: '8px 16px',
                                        backgroundColor: '#0095f6',
                                        color: 'white',
                                        border: 'none',
                                        borderRadius: '4px',
                                        cursor: 'pointer',
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
                            <div style={{ marginLeft: '42px', marginTop: '10px' }}>
                              {comment.replies.data.map((reply) => (
                                <div key={reply.id} style={{ display: 'flex', marginBottom: '10px' }}>
                                  <img
                                    src={`https://picsum.photos/seed/${reply?.username || 'default'}/24/24`}
                                    alt={`${reply?.username || 'User'}'s avatar`}
                                    style={{ width: '24px', height: '24px', borderRadius: '50%', marginRight: '10px' }}
                                  />
                                  <div style={{ flex: 1 }}>
                                    <span style={{ fontWeight: 'bold' }}>{reply?.username || 'Anonymous'}</span>
                                    <span style={{ marginLeft: '5px' }}>{reply?.text || 'No text'}</span>
                                    <div style={{ marginTop: '5px', color: '#8e8e8e', fontSize: '12px' }}>
                                      <span>
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
                    <p style={{ color: '#8e8e8e' }}>No comments yet. Start the conversation.</p>
                  )}
                  <div style={{ marginTop: '20px' }}>
                    <span style={{ marginRight: '10px' }}>😊</span>
                    <form onSubmit={(e) => handleCreateComment(e, post.id)} style={{ display: "flex", width: "100%" }}>
                      <input
                        type="text"
                        placeholder="Add a comment..."
                        value={newComments[post.id] || ""}
                        onChange={(e) =>
                          setNewComments((prev) => ({ ...prev, [post.id]: e.target.value }))
                        }
                        disabled={isLoading}
                        style={{ flex: 1, padding: '8px', borderRadius: '4px', border: '1px solid #dbdbdb' }}
                      />
                      <button
                        type="submit"
                        disabled={isLoading || !newComments[post.id]?.trim()}
                        style={{
                          marginLeft: '10px',
                          padding: '8px 16px',
                          backgroundColor: '#0095f6',
                          color: 'white',
                          border: 'none',
                          borderRadius: '4px',
                          cursor: 'pointer',
                        }}
                      >
                        {isLoading ? "Posting..." : "Post"}
                      </button>
                    </form>
                  </div>
                </div>

                {/* Additional Actions */}
                <div style={{ marginTop: '20px' }}>
                  <a
                    href="#"
                    onClick={(e) => {
                      e.preventDefault();
                      toggleInsights(post.id);
                    }}
                    style={{ color: '#0095f6', textDecoration: 'none', marginRight: '20px' }}
                  >
                    {showInsights[post.id] ? "Hide insights" : "View insights"}
                  </a>
                  <button
                    style={{
                      padding: '8px 16px',
                      backgroundColor: '#0095f6',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer',
                    }}
                  >
                    Boost post
                  </button>
                </div>

                {/* Insights */}
                {showInsights[post.id] && post?.insights && (
                  <div style={{ marginTop: '20px' }}>
                    <h3>Insights</h3>
                    <ul style={{ listStyle: 'none', padding: 0 }}>
                      {post.insights.map((insight, index) => (
                        <li key={index} style={{ marginBottom: '10px' }}>
                          <strong>{insight.title || 'Unknown'}:</strong> {insight.values[0]?.value || 0}
                          <br />
                          <small style={{ color: '#8e8e8e' }}>{insight.description || 'No description'}</small>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {showNewPostModal && (
        <NewPostModal onSubmit={handleNewPostSubmit} isLoading={isLoading} onClose={() => setShowNewPostModal(false)} />
      )}
    </div>
  );
};

export default PostsManager;