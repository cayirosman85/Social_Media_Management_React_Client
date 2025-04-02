import React, { useState, useEffect } from "react";
import localStorage from "local-storage";
import { LoadScript, GoogleMap, Marker, Autocomplete } from "@react-google-maps/api"; // Add this import
import "./FacebookProfile.css";
const FacebookProfile = () => {
  const [pageData, setPageData] = useState(null);
  const [posts, setPosts] = useState([]);
  const [photos, setPhotos] = useState([]);
  const [videos, setVideos] = useState([]);
  const [reels, setReels] = useState([]);
  const [mentions, setMentions] = useState([]);
  const [reviews, setReviews] = useState([]);
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
  const [isLoadingReels, setIsLoadingReels] = useState(true);
  const [isLoadingVideos, setIsLoadingVideos] = useState(true);
  const [isLoadingMentions, setIsLoadingMentions] = useState(true);
  const [isLoadingReviews, setIsLoadingReviews] = useState(true);
  const [showMenu, setShowMenu] = useState({});
  const [addressAutocomplete, setAddressAutocomplete] = useState(null);

  const [isEditingAbout, setIsEditingAbout] = useState(false);
  const [editedPageData, setEditedPageData] = useState({
    about: "",
    description: "",
    phone: "",
    website: "",
    address: "",
    addressLat: null,
    addressLng: null,
    addressCity: "", // New field for city
    addressState: "", // New field for state
    addressCountry: "", // New field for country
    addressZip: "", // New field for zip code
    email: "",
    social_links: [],
    hours: {},
    price_range: "",
    services: [],
    languages: [],
    founded: "",
    privacy_policy: "",
    impressum: "",
    work: [],
    education: [],
    places_lived: [],
    relationship_status: "",
    family_members: [],
    name_pronunciation: "",
    other_names: [],
    favorite_quotes: "",
  });
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
    fetchMentions();
    fetchReviews();
  }, [pageId, accessToken]);

  const fetchPageData = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(
        `https://graph.facebook.com/v18.0/${pageId}?fields=name,about,description,fan_count,followers_count,picture,cover,category,phone,website,location,hours,founded,mission,products,verification_status,rating_count,link,username,is_published,engagement,emails&access_token=${accessToken}`
      );
      const data = await response.json();
      if (!response.ok) throw new Error(data.error?.message || "Failed to fetch page data");
  
      const customData = localStorage.get("customPageData") || {};
  
      setPageData(data);
      setEditedPageData({
        about: data.about || "",
        description: data.description || "",
        phone: data.phone || "",
        website: data.website || "",
        address: data.location?.street || "",
        addressLat: customData.addressLat || null,
        addressLng: customData.addressLng || null,
        addressCity: customData.addressCity || "", // Load city
        addressState: customData.addressState || "", // Load state
        addressCountry: customData.addressCountry || "", // Load country
        addressZip: customData.addressZip || "", // Load zip code
        email: data.emails?.[0] || "",
        social_links: customData.social_links || [],
        hours: data.hours || {},
        price_range: customData.price_range || "",
        services: data.services || [],
        languages: data.languages || [],
        founded: data.founded || "",
        privacy_policy: customData.privacy_policy || "",
        impressum: customData.impressum || "",
        work: customData.work || [],
        education: customData.education || [],
        places_lived: customData.places_lived || [],
        relationship_status: customData.relationship_status || "",
        family_members: customData.family_members || [],
        name_pronunciation: customData.name_pronunciation || "",
        other_names: customData.other_names || [],
        favorite_quotes: customData.favorite_quotes || "",
      });
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };


  const updatePageData = async () => {
    setIsLoading(true);
    try {
      console.log("Current editedPageData:", editedPageData);
  
      const editableFields = {
        about: editedPageData.about || "",
        description: editedPageData.description || "",
        phone: editedPageData.phone || "",
        website: editedPageData.website || "",
        emails: editedPageData.email ? [editedPageData.email] : [],
        services: editedPageData.services || [],
        languages: editedPageData.languages || [],
        founded: editedPageData.founded || "",
        ...(editedPageData.address && {
          location: {
            street: editedPageData.address || "",
            city: editedPageData.addressCity || "",
            state: editedPageData.addressState || "", // Explicitly include state, even if empty
            country: editedPageData.addressCountry || "",
            zip: editedPageData.addressZip || "",
            latitude: editedPageData.addressLat || null,
            longitude: editedPageData.addressLng || null,
          },
        }),
      };
  
      console.log("Payload being sent to Facebook Graph API:", editableFields);
  
      const response = await fetch(
        `https://graph.facebook.com/v20.0/${pageId}?access_token=${accessToken}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(editableFields),
        }
      );
  
      const data = await response.json();
  
      if (!response.ok) {
        console.error("Error in Facebook Graph API response:", data.error);
        throw new Error(data.error?.message || "Failed to update page data");
      }
  
      console.log("Page data updated successfully:", data);
  
      // Store service_area and other custom fields locally
      const customData = {
        addressLat: editedPageData.addressLat,
        addressLng: editedPageData.addressLng,
        addressCity: editedPageData.addressCity,
        addressState: editedPageData.addressState,
        addressCountry: editedPageData.addressCountry,
        addressZip: editedPageData.addressZip,
        social_links: editedPageData.social_links,
        price_range: editedPageData.price_range,
        privacy_policy: editedPageData.privacy_policy,
        impressum: editedPageData.impressum,
        work: editedPageData.work,
        education: editedPageData.education,
        places_lived: editedPageData.places_lived,
        relationship_status: editedPageData.relationship_status,
        family_members: editedPageData.family_members,
        name_pronunciation: editedPageData.name_pronunciation,
        other_names: editedPageData.other_names,
        favorite_quotes: editedPageData.favorite_quotes,
      };
  
      localStorage.set("customPageData", customData);
  
      setPageData((prev) => ({ ...prev, ...editableFields }));
      setIsEditingAbout(false);
      alert("Page info updated successfully!");
    } catch (err) {
      console.error("Detailed error in updatePageData:", err);
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

      const uploadedPhotos = (photosData.data || []).map((photo) => ({
        id: photo.id,
        images: photo.images || [],
        name: photo.name || "Uploaded Photo",
        created_time: photo.created_time,
      }));

      const mediaFromPosts = (postsData.data || [])
        .filter((post) => post.attachments?.data?.length > 0)
        .map((post) => ({
          id: post.id,
          images: post.attachments.data.map((attachment) => ({
            source: attachment.media?.image?.src,
          })),
          name: post.message || "Post Media",
          created_time: post.created_time,
        }));

      const allMedia = [...uploadedPhotos, ...mediaFromPosts]
        .filter((photo) => photo.images?.length > 0)
        .filter((photo, index, self) => index === self.findIndex((p) => p.id === photo.id));

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

  const fetchMentions = async () => {
    setIsLoadingMentions(true);
    try {
      const response = await fetch(
        `https://graph.facebook.com/v18.0/${pageId}/tagged?fields=id,message,created_time,from,permalink_url,full_picture,attachments,type,status_type&access_token=${accessToken}&limit=10`
      );
      const data = await response.json();
      console.log("Mentions data:", data);
      if (!response.ok) throw new Error(data.error?.message || "Failed to fetch mentions");
      setMentions(data.data || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoadingMentions(false);
    }
  };

  const fetchReviews = async () => {
    setIsLoadingReviews(true);
    try {
      const response = await fetch(
        `https://graph.facebook.com/v18.0/${pageId}/ratings?fields=created_time,reviewer,rating,review_text,has_rating,has_review&access_token=${accessToken}&limit=10`
      );
      const data = await response.json();
      console.log("Reviews data:", data);
      if (!response.ok) throw new Error(data.error?.message || "Failed to fetch reviews");
      setReviews(data.data || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoadingReviews(false);
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
      setComments((prev) => ({ ...prev, [postId]: data.data || [] }));
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

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    setMediaFiles(files);
  };

  const handleCreatePost = async (e) => {
    e.preventDefault();
    if (!newPostMessage.trim() && mediaFiles.length === 0) {
      alert("Please add a message or media to post.");
      return;
    }
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
          photo_url: uploadedMediaUrls[0] || manualMediaUrl.trim() || null,
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
        setCommentText((prev) => ({ ...prev, [postId]: "" }));
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
        setReplyText((prev) => ({ ...prev, [commentId]: "" }));
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
        setLikedPosts((prev) => ({ ...prev, [postId]: !isLiked }));
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
        setLikedComments((prev) => ({ ...prev, [commentId]: !isLiked }));
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
        setEditText((prev) => ({ ...prev, [commentId]: "" }));
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
      const confirmMessage =
        "Warning: Editing the media of a post is restricted by Facebook. The existing post will be deleted, and a new post will be created with the updated content. This will result in the loss of all likes, comments, and other engagement on the original post. Do you want to proceed?";
      if (!window.confirm(confirmMessage)) return;
    }
    setIsLoading(true);
    try {
      let uploadedMediaUrls = [];
      if (editPostMediaFiles[postId]?.length > 0) {
        uploadedMediaUrls = await handleMediaUpload(editPostMediaFiles[postId]);
      }
      const photoUrl = uploadedMediaUrls[0] || editPostMediaUrl[postId]?.trim() || null;
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
        setEditPostText((prev) => ({ ...prev, [postId]: "" }));
        setEditPostMediaFiles((prev) => ({ ...prev, [postId]: [] }));
        setEditPostMediaUrl((prev) => ({ ...prev, [postId]: "" }));
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
                    setEditText((prev) => ({ ...prev, [comment.id]: e.target.value }))
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
                  setReplyText((prev) => ({
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
                  setEditText((prev) => ({
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
                      setReplyText((prev) => ({
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
            {comment.comments.data.map((reply) => (
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
                  <div className="new-post-section">
                    <form onSubmit={handleCreatePost}>
                      <div className="post-header">
                        <img
                          src={pageData.picture.data.url}
                          alt="Page Profile"
                          className="post-profile-picture"
                        />
                        <div className="post-header-info">
                          <div className="post-author-wrapper">
                            <p className="post-author">{pageData.name}</p>
                          </div>
                        </div>
                      </div>
                      <textarea
                        value={newPostMessage}
                        onChange={(e) => setNewPostMessage(e.target.value)}
                        placeholder={`What's on your mind, ${pageData.name}?`}
                        className="post-textarea"
                        rows="3"
                      />
                      {mediaFiles.length > 0 && (
                        <div className="image-preview">
                          {mediaFiles.map((file, index) => (
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
                              <button
                                type="button"
                                onClick={() =>
                                  setMediaFiles((prev) => prev.filter((_, i) => i !== index))
                                }
                                className="remove-media-button"
                              >
                                Remove
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                      <div className="media-upload-section">
                        <label htmlFor="media-upload" className="media-upload-label">
                          Add photos/videos
                          <input
                            id="media-upload"
                            type="file"
                            accept="image/*,video/*"
                            multiple
                            onChange={handleFileChange}
                            style={{ display: "none" }}
                          />
                        </label>
                        <input
                          type="text"
                          value={manualMediaUrl}
                          onChange={(e) => setManualMediaUrl(e.target.value)}
                          placeholder="Or enter a media URL (optional)"
                          className="manual-url-input"
                        />
                      </div>
                      <button
                        type="submit"
                        className="post-button"
                        disabled={isLoading || (!newPostMessage.trim() && mediaFiles.length === 0 && !manualMediaUrl.trim())}
                      >
                        {isLoading ? "Posting..." : "Post"}
                      </button>
                    </form>
                  </div>
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
                                  setShowMenu((prev) => ({
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
                                      setEditPostText((prev) => ({
                                        ...prev,
                                        [post.id]: post.message,
                                      }));
                                      setShowMenu((prev) => ({
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
                                      setShowMenu((prev) => ({
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
                                  setEditPostText((prev) => ({
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
                                  setEditPostMediaFiles((prev) => ({
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
                                  setEditPostMediaUrl((prev) => ({
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
                                    setCommentText((prev) => ({
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
  <LoadScript googleMapsApiKey="AIzaSyCAzRS_i_8GcmiGF5jhb9UuXdS1nn6kskA" libraries={["places"]}>
    <div className="about-section">
      <div className="about-section-header">
        <h2>About {pageData.name}</h2>
        {!isEditingAbout && (
          <button className="edit-about-button" onClick={() => setIsEditingAbout(true)}>
            Edit About
          </button>
        )}
      </div>

      {isEditingAbout ? (
        <div className="edit-about-form">
          <h3>Edit About Section</h3>
          <div className="edit-section">
            <h4>Overview</h4>
            <label>
              About:
              <textarea
                value={editedPageData.about}
                onChange={(e) => setEditedPageData((prev) => ({ ...prev, about: e.target.value }))}
                className="edit-textarea"
              />
            </label>
            <label>
              Description:
              <textarea
                value={editedPageData.description}
                onChange={(e) =>
                  setEditedPageData((prev) => ({ ...prev, description: e.target.value }))
                }
                className="edit-textarea"
              />
            </label>
          </div>

          <div className="edit-section">
            <h4>Contact and Basic Info</h4>
            <label>
              Phone:
              <input
                type="text"
                value={editedPageData.phone}
                onChange={(e) => setEditedPageData((prev) => ({ ...prev, phone: e.target.value }))}
                className="edit-input"
              />
            </label>
            <label>
              Website:
              <input
                type="text"
                value={editedPageData.website}
                onChange={(e) => setEditedPageData((prev) => ({ ...prev, website: e.target.value }))}
                className="edit-input"
              />
            </label>
            <label>
              Address:
              <div className="map-container">
                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <Autocomplete
  onLoad={(autocomplete) => {
    setAddressAutocomplete(autocomplete);
  }}
  onPlaceChanged={() => {
    if (addressAutocomplete) {
      const place = addressAutocomplete.getPlace();
      if (place.formatted_address && place.geometry) {
        // Extract address components
        const addressComponents = place.address_components || [];
        let street = "";
        let city = "";
        let state = "";
        let country = "";
        let zip = "";

        addressComponents.forEach((component) => {
          const types = component.types;
          // Street-level components
          if (types.includes("street_number") || types.includes("route")) {
            street += (street ? " " : "") + component.long_name;
          } else if (types.includes("neighborhood") || types.includes("sublocality")) {
            street += (street ? ", " : "") + component.long_name;
          }
          // City: For Turkey, use administrative_area_level_1 (province) as the city
          else if (types.includes("administrative_area_level_1")) {
            city = component.long_name; // e.g., "Kahramanmaraş"
          }
          // Country
          else if (types.includes("country")) {
            country = component.long_name;
          }
          // Postal code
          else if (types.includes("postal_code")) {
            zip = component.long_name;
          }
        });

        // If street is empty, fall back to the first part of the formatted address
        if (!street) {
          const addressParts = place.formatted_address.split(",");
          street = addressParts[0].trim(); // Take the first part as the street (e.g., "Ekmekçi")
        }

        // For Turkish addresses, ensure the province is treated as the city and state is empty
        if (country === "Türkiye") {
          state = ""; // No state for Turkey
          if (!city) {
            // Fallback: Extract the province from the formatted address
            const addressParts = place.formatted_address.split(",");
            const provincePart = addressParts.find((part) =>
              part.includes("/")
            );
            if (provincePart) {
              const provinceMatch = provincePart.match(/\/\s*(\S+)/);
              if (provinceMatch) {
                city = provinceMatch[1].trim(); // e.g., "Kahramanmaraş"
              }
            }
          }
        }

        // Log the extracted components for debugging
        console.log("Extracted address components:", {
          street,
          city,
          state,
          country,
          zip,
          lat: place.geometry.location.lat(),
          lng: place.geometry.location.lng(),
        });

        setEditedPageData((prev) => ({
          ...prev,
          address: street, // Store the street portion (e.g., "Ekmekçi")
          addressLat: place.geometry.location.lat(),
          addressLng: place.geometry.location.lng(),
          addressCity: city, // Store city (Kahramanmaraş)
          addressState: state, // Store state (empty for Turkey)
          addressCountry: country, // Store country
          addressZip: zip, // Store zip code
        }));
      } else {
        alert("Please select a valid location from the suggestions.");
      }
    }
  }}
>
  <input
    type="text"
    value={editedPageData.address}
    onChange={(e) =>
      setEditedPageData((prev) => ({ ...prev, address: e.target.value }))
    }
    placeholder="Search for an address"
    className="edit-input"
  />
</Autocomplete>
                  {editedPageData.address && (
         <button
         type="button"
         onClick={() =>
           setEditedPageData((prev) => ({
             ...prev,
             address: "",
             addressLat: null,
             addressLng: null,
             addressCity: "", // Reset city
             addressState: "", // Reset state
             addressCountry: "", // Reset country
             addressZip: "", // Reset zip code
           }))
         }
         style={{ padding: "8px", background: "#f0f2f5", border: "none", borderRadius: "4px" }}
       >
         Clear
       </button>
                  )}
                </div>
                {editedPageData.addressLat && editedPageData.addressLng && (
                  <GoogleMap
                    mapContainerStyle={{ height: "200px", width: "100%" }}
                    center={{
                      lat: editedPageData.addressLat,
                      lng: editedPageData.addressLng,
                    }}
                    zoom={15}
                  >
                    <Marker
                      position={{
                        lat: editedPageData.addressLat,
                        lng: editedPageData.addressLng,
                      }}
                    />
                  </GoogleMap>
                )}
              </div>
            </label>
        
            <label>
              Email:
              <input
                type="email"
                value={editedPageData.email}
                onChange={(e) => setEditedPageData((prev) => ({ ...prev, email: e.target.value }))}
                className="edit-input"
              />
            </label>
          
            <label>
              Social Links (comma-separated):
              <input
                type="text"
                value={editedPageData.social_links.join(", ")}
                onChange={(e) =>
                  setEditedPageData((prev) => ({
                    ...prev,
                    social_links: e.target.value.split(",").map((link) => link.trim()),
                  }))
                }
                className="edit-input"
              />
            </label>
          </div>

          <div className="edit-section">
            <h4>Business Details</h4>
            <label>
              Price Range:
              <input
                type="text"
                value={editedPageData.price_range}
                onChange={(e) =>
                  setEditedPageData((prev) => ({ ...prev, price_range: e.target.value }))
                }
                className="edit-input"
              />
            </label>
            <label>
              Services (comma-separated):
              <input
                type="text"
                value={editedPageData.services.join(", ")}
                onChange={(e) =>
                  setEditedPageData((prev) => ({
                    ...prev,
                    services: e.target.value.split(",").map((service) => service.trim()),
                  }))
                }
                className="edit-input"
              />
            </label>
            <label>
              Languages (comma-separated):
              <input
                type="text"
                value={editedPageData.languages.join(", ")}
                onChange={(e) =>
                  setEditedPageData((prev) => ({
                    ...prev,
                    languages: e.target.value.split(",").map((lang) => lang.trim()),
                  }))
                }
                className="edit-input"
              />
            </label>
            <label>
              Founded:
              <input
                type="text"
                value={editedPageData.founded}
                onChange={(e) => setEditedPageData((prev) => ({ ...prev, founded: e.target.value }))}
                className="edit-input"
              />
            </label>
          </div>

          <div className="edit-section">
            <h4>Privacy and Legal Info</h4>
            <label>
              Privacy Policy:
              <textarea
                value={editedPageData.privacy_policy}
                onChange={(e) =>
                  setEditedPageData((prev) => ({ ...prev, privacy_policy: e.target.value }))
                }
                className="edit-textarea"
              />
            </label>
            <label>
              Impressum:
              <textarea
                value={editedPageData.impressum}
                onChange={(e) =>
                  setEditedPageData((prev) => ({ ...prev, impressum: e.target.value }))
                }
                className="edit-textarea"
              />
            </label>
          </div>

          <div className="edit-section">
            <h4>Work and Education</h4>
            <label>
              Work (comma-separated):
              <input
                type="text"
                value={editedPageData.work.join(", ")}
                onChange={(e) =>
                  setEditedPageData((prev) => ({
                    ...prev,
                    work: e.target.value.split(",").map((item) => item.trim()),
                  }))
                }
                className="edit-input"
              />
            </label>
            <label>
              Education (comma-separated):
              <input
                type="text"
                value={editedPageData.education.join(", ")}
                onChange={(e) =>
                  setEditedPageData((prev) => ({
                    ...prev,
                    education: e.target.value.split(",").map((item) => item.trim()),
                  }))
                }
                className="edit-input"
              />
            </label>
          </div>

          <div className="edit-section">
            <h4>Places Lived</h4>
            <label>
              Places Lived (comma-separated):
              <input
                type="text"
                value={editedPageData.places_lived.join(", ")}
                onChange={(e) =>
                  setEditedPageData((prev) => ({
                    ...prev,
                    places_lived: e.target.value.split(",").map((place) => place.trim()),
                  }))
                }
                className="edit-input"
              />
            </label>
          </div>

          <div className="edit-section">
            <h4>Family and Relationships</h4>
            <label>
              Relationship Status:
              <input
                type="text"
                value={editedPageData.relationship_status}
                onChange={(e) =>
                  setEditedPageData((prev) => ({ ...prev, relationship_status: e.target.value }))
                }
                className="edit-input"
              />
            </label>
            <label>
              Family Members (comma-separated):
              <input
                type="text"
                value={editedPageData.family_members.join(", ")}
                onChange={(e) =>
                  setEditedPageData((prev) => ({
                    ...prev,
                    family_members: e.target.value.split(",").map((member) => member.trim()),
                  }))
                }
                className="edit-input"
              />
            </label>
          </div>

          <div className="edit-section">
            <h4>Details About You</h4>
            <label>
              Name Pronunciation:
              <input
                type="text"
                value={editedPageData.name_pronunciation}
                onChange={(e) =>
                  setEditedPageData((prev) => ({ ...prev, name_pronunciation: e.target.value }))
                }
                className="edit-input"
              />
            </label>
            <label>
              Other Names (comma-separated):
              <input
                type="text"
                value={editedPageData.other_names.join(", ")}
                onChange={(e) =>
                  setEditedPageData((prev) => ({
                    ...prev,
                    other_names: e.target.value.split(",").map((name) => name.trim()),
                  }))
                }
                className="edit-input"
              />
            </label>
            <label>
              Favorite Quotes:
              <textarea
                value={editedPageData.favorite_quotes}
                onChange={(e) =>
                  setEditedPageData((prev) => ({ ...prev, favorite_quotes: e.target.value }))
                }
                className="edit-textarea"
              />
            </label>
          </div>

          <div className="edit-actions">
            <button className="save-about-button" onClick={updatePageData}>
              Save
            </button>
            <button className="cancel-about-button" onClick={() => setIsEditingAbout(false)}>
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <div className="about-section-content">
          <div className="info-section">
            <h3>Overview</h3>
            <p>{pageData.about || "No about info available."}</p>
            <p>{pageData.description || "No description available."}</p>
          </div>

          <div className="info-section">
            <h3>Followers</h3>
            <p>{pageData.followers_count?.toLocaleString() || "0"} followers</p>
          </div>

          <div className="info-section">
            <h3>Reels</h3>
            {isLoadingReels ? (
              <p>Loading reels...</p>
            ) : reels.length === 0 ? (
              <p>No reels available.</p>
            ) : (
              <div className="media-grid">
                {reels.slice(0, 3).map((reel) => (
                  <div key={reel.id} className="media-item">
                    <video src={reel.source} poster={reel.thumbnail} controls className="media-video" />
                    <p>{reel.title || "Untitled Reel"}</p>
                  </div>
                ))}
                <button onClick={() => setActiveTab("Reels")}>See all reels</button>
              </div>
            )}
          </div>

          <div className="info-section">
            <h3>Videos</h3>
            {isLoadingVideos ? (
              <p>Loading videos...</p>
            ) : videos.length === 0 ? (
              <p>No videos available.</p>
            ) : (
              <div className="media-grid">
                {videos.slice(0, 3).map((video) => (
                  <div key={video.id} className="media-item">
                    <video
                      src={video.source}
                      poster={video.thumbnail_url}
                      controls
                      className="media-video"
                    />
                    <p>{video.title || "Untitled Video"}</p>
                  </div>
                ))}
                <button onClick={() => setActiveTab("Videos")}>See all videos</button>
              </div>
            )}
          </div>

          <div className="info-section">
            <h3>Contact and Basic Info</h3>
            {pageData.phone && (
              <div className="info-item">
                <span className="info-icon">📞</span>
                <p>{pageData.phone}</p>
              </div>
            )}
            {pageData.website && (
              <div className="info-item">
                <span className="info-icon">🌐</span>
                <a href={pageData.website} target="_blank" rel="noopener noreferrer">
                  {pageData.website}
                </a>
              </div>
            )}
            {editedPageData.address && (
              <div className="info-item">
                <span className="info-icon">📍</span>
                <div>
                  <p>{editedPageData.address}</p>
                  {editedPageData.addressLat && editedPageData.addressLng && (
                    <GoogleMap
                      mapContainerStyle={{ height: "200px", width: "100%" }}
                      center={{
                        lat: editedPageData.addressLat,
                        lng: editedPageData.addressLng,
                      }}
                      zoom={15}
                    >
                      <Marker
                        position={{
                          lat: editedPageData.addressLat,
                          lng: editedPageData.addressLng,
                        }}
                      />
                    </GoogleMap>
                  )}
                </div>
              </div>
            )}
            {editedPageData.email && (
              <div className="info-item">
                <span className="info-icon">✉️</span>
                <p>{editedPageData.email}</p>
              </div>
            )}
        
            {editedPageData.social_links.length > 0 && (
              <div className="info-item">
                <span className="info-icon">🔗</span>
                <div>
                  <p>Social Links:</p>
                  <ul>
                    {editedPageData.social_links.map((link, index) => (
                      <li key={index}>
                        <a href={link} target="_blank" rel="noopener noreferrer">
                          {link}
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )}
          </div>

          <div className="info-section">
            <h3>Business Details</h3>
            {editedPageData.price_range && (
              <div className="info-item">
                <span className="info-icon">💰</span>
                <p>{editedPageData.price_range}</p>
              </div>
            )}
            {editedPageData.services.length > 0 && (
              <div className="info-item">
                <span className="info-icon">🛠️</span>
                <div>
                  <p>Services:</p>
                  <ul>
                    {editedPageData.services.map((service, index) => (
                      <li key={index}>{service}</li>
                    ))}
                  </ul>
                </div>
              </div>
            )}
            {editedPageData.languages.length > 0 && (
              <div className="info-item">
                <span className="info-icon">🌍</span>
                <div>
                  <p>Languages:</p>
                  <ul>
                    {editedPageData.languages.map((language, index) => (
                      <li key={index}>{language}</li>
                    ))}
                  </ul>
                </div>
              </div>
            )}
            {editedPageData.founded && (
              <div className="info-item">
                <span className="info-icon">📅</span>
                <p>Founded: {editedPageData.founded}</p>
              </div>
            )}
          </div>

          <div className="info-section">
            <h3>Privacy and Legal Info</h3>
            {editedPageData.privacy_policy && (
              <div className="info-item">
                <span className="info-icon">🔒</span>
                <p>{editedPageData.privacy_policy}</p>
              </div>
            )}
            {editedPageData.impressum && (
              <div className="info-item">
                <span className="info-icon">📜</span>
                <p>{editedPageData.impressum}</p>
              </div>
            )}
          </div>

          <div className="info-section">
            <h3>Work and Education</h3>
            {editedPageData.work.length > 0 && (
              <div className="info-item">
                <span className="info-icon">💼</span>
                <div>
                  <p>Work:</p>
                  <ul>
                    {editedPageData.work.map((job, index) => (
                      <li key={index}>{job}</li>
                    ))}
                  </ul>
                </div>
              </div>
            )}
            {editedPageData.education.length > 0 && (
              <div className="info-item">
                <span className="info-icon">🎓</span>
                <div>
                  <p>Education:</p>
                  <ul>
                    {editedPageData.education.map((edu, index) => (
                      <li key={index}>{edu}</li>
                    ))}
                  </ul>
                </div>
              </div>
            )}
          </div>

          <div className="info-section">
            <h3>Places Lived</h3>
            {editedPageData.places_lived.length > 0 && (
              <div className="info-item">
                <span className="info-icon">🏠</span>
                <div>
                  <ul>
                    {editedPageData.places_lived.map((place, index) => (
                      <li key={index}>{place}</li>
                    ))}
                  </ul>
                </div>
              </div>
            )}
          </div>

          <div className="info-section">
            <h3>Family and Relationships</h3>
            {editedPageData.relationship_status && (
              <div className="info-item">
                <span className="info-icon">❤️</span>
                <p>{editedPageData.relationship_status}</p>
              </div>
            )}
            {editedPageData.family_members.length > 0 && (
              <div className="info-item">
                <span className="info-icon">👨‍👩‍👧</span>
                <div>
                  <p>Family Members:</p>
                  <ul>
                    {editedPageData.family_members.map((member, index) => (
                      <li key={index}>{member}</li>
                    ))}
                  </ul>
                </div>
              </div>
            )}
          </div>

          <div className="info-section">
            <h3>Details About You</h3>
            {editedPageData.name_pronunciation && (
              <div className="info-item">
                <span className="info-icon">🗣️</span>
                <p>{editedPageData.name_pronunciation}</p>
              </div>
            )}
            {editedPageData.other_names.length > 0 && (
              <div className="info-item">
                <span className="info-icon">📛</span>
                <div>
                  <p>Other Names:</p>
                  <ul>
                    {editedPageData.other_names.map((name, index) => (
                      <li key={index}>{name}</li>
                    ))}
                  </ul>
                </div>
              </div>
            )}
            {editedPageData.favorite_quotes && (
              <div className="info-item">
                <span className="info-icon">💬</span>
                <p>{editedPageData.favorite_quotes}</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  </LoadScript>
)}

              {activeTab === "Mentions" && (
                <div className="mentions-section">
                  <h2>Mentions</h2>
                  {isLoadingMentions ? (
                    <p>Loading mentions...</p>
                  ) : mentions.length > 0 ? (
                    <ul>
                      {mentions.map((mention) => (
                        <li key={mention.id} className="mention-item">
                          <div className="post-header">
                            <div className="post-header-left">
                              <img
                                src={mention.from?.picture?.data?.url || pageData.picture.data.url}
                                alt="Mentioner Profile"
                                className="post-profile-picture"
                              />
                              <div>
                                <p className="post-author">{mention.from?.name || "Unknown"}</p>
                                <small>{new Date(mention.created_time).toLocaleString()}</small>
                              </div>
                            </div>
                          </div>
                          {mention.message && <p>{mention.message}</p>}
                          {mention.full_picture && (
                            <img
                              src={mention.full_picture}
                              alt="Mention media"
                              className="post-image"
                              onError={(e) => (e.target.src = "https://via.placeholder.com/300")}
                            />
                          )}
                          <div className="mention-actions">
                            <a
                              href={mention.permalink_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="action-button"
                            >
                              View on Facebook
                            </a>
                          </div>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p>No mentions available.</p>
                  )}
                </div>
              )}
              {activeTab === "Reviews" && (
                <div className="reviews-section">
                  <h2>Reviews</h2>
                  {isLoadingReviews ? (
                    <p>Loading reviews...</p>
                  ) : reviews.length > 0 ? (
                    <ul>
                      {reviews.map((review) => (
                        <li key={review.id} className="review-item">
                          <div className="post-header">
                            <div className="post-header-left">
                              <img
                                src={
                                  review.reviewer?.picture?.data?.url ||
                                  pageData.picture.data.url
                                }
                                alt="Reviewer Profile"
                                className="post-profile-picture"
                              />
                              <div>
                                <p className="post-author">
                                  {review.reviewer?.name || "Anonymous"}
                                </p>
                                <small>{new Date(review.created_time).toLocaleString()}</small>
                              </div>
                            </div>
                          </div>
                          {review.has_rating && (
                            <p>
                              Rating: {review.rating} / 5{" "}
                              <span role="img" aria-label="star">
                                ⭐
                              </span>
                            </p>
                          )}
                          {review.has_review && review.review_text && (
                            <p>{review.review_text}</p>
                          )}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p>No reviews available.</p>
                  )}
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
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default FacebookProfile;