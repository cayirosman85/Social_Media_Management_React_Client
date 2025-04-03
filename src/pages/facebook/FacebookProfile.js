import React, { useState, useEffect } from "react";
import localStorage from "local-storage";
import { LoadScript, GoogleMap, Marker, Autocomplete } from "@react-google-maps/api";
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
  const [showInsightsModal, setShowInsightsModal] = useState(false);
  const [selectedPostInsights, setSelectedPostInsights] = useState(null);
  const [isLoadingInsights, setIsLoadingInsights] = useState(false);
  const [pageInsights, setPageInsights] = useState(null);
  const [isLoadingPageInsights, setIsLoadingPageInsights] = useState(false);
  const [activeAccordion, setActiveAccordion] = useState(null);
  const [editedPageData, setEditedPageData] = useState({
    about: "",
    description: "",
    phone: "",
    website: "",
    address: "",
    addressLat: null,
    addressLng: null,
    addressCity: "",
    addressState: "",
    addressCountry: "",
    addressZip: "",
    email: "",
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

  useEffect(() => {
    if (activeTab === "Page Insights" && !pageInsights && !isLoadingPageInsights) {
      fetchPageInsights();
    }
  }, [activeTab, pageInsights, isLoadingPageInsights]);

  const fetchPageData = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(
        `https://graph.facebook.com/v18.0/${pageId}?fields=name,about,description,fan_count,followers_count,picture,cover,category,phone,website,location,hours,founded,mission,products,verification_status,rating_count,link,username,is_published,engagement,emails&access_token=${accessToken}`
      );
      const data = await response.json();
      if (!response.ok) throw new Error(data.error?.message || "Failed to fetch page data");

      setPageData(data);
      setEditedPageData({
        about: data.about || "",
        description: data.description || "",
        phone: data.phone || "",
        website: data.website || "",
        address: data.location?.street || "",
        email: data.emails?.[0] || "",
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
        ...(editedPageData.address && editedPageData.addressCity && editedPageData.addressCountry && {
          location: {
            street: editedPageData.address || "",
            city: editedPageData.addressCity || "",
            state: editedPageData.addressState || "",
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
      console.log("fetchPagePosts " + pageId, data);
      if (!response.ok) throw new Error(data.error || "Failed to fetch posts");
      setPosts(data.data || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchPostInsights = async (postId) => {
    setIsLoadingInsights(true);
    try {
      if (postId.split("_")[0] !== pageId) {
        throw new Error("Post does not belong to this Page.");
      }

      const coreMetrics = [
        { name: "post_impressions", title: "Lifetime Post Total Impressions", description: "The total number of times the post was seen, including multiple views by the same user." },
        { name: "post_impressions_unique", title: "Lifetime Post Total Reach", description: "The number of unique users who saw the post." },
        { name: "post_impressions_paid", title: "Lifetime Post Paid Impressions", description: "The number of times the post was seen through paid promotions." },
        { name: "post_impressions_paid_unique", title: "Lifetime Post Paid Reach", description: "The number of unique users who saw the post through paid promotions." },
        { name: "post_impressions_organic", title: "Lifetime Post Organic Impressions", description: "The number of times the post was seen organically (not through paid promotions)." },
        { name: "post_impressions_organic_unique", title: "Lifetime Post Organic Reach", description: "The number of unique users who saw the post organically." },
      ];

      const videoMetrics = [
        { name: "post_video_views", title: "Total Video Views", description: "The total number of times the video was viewed for at least 3 seconds." },
        { name: "post_video_views_unique", title: "Unique Video Views", description: "The number of unique users who viewed the video for at least 3 seconds." },
        { name: "post_video_views_paid", title: "Paid Video Views", description: "The number of times the video was viewed through paid promotions." },
        { name: "post_video_views_organic", title: "Organic Video Views", description: "The number of times the video was viewed organically." },
        { name: "post_video_complete_views_organic", title: "Organic Complete Views", description: "The number of times the video was watched to completion organically." },
        { name: "post_video_complete_views_paid", title: "Paid Complete Views", description: "The number of times the video was watched to completion through paid promotions." },
      ];

      const post = posts.find((p) => p.id === postId);
      const isVideoPost = post?.attachments?.data?.[0]?.type?.includes("video");
      const metricsList = isVideoPost ? [...coreMetrics, ...videoMetrics] : coreMetrics;
      const metricNames = metricsList.map((m) => m.name);

      const response = await fetch(
        `https://graph.facebook.com/v22.0/${postId}/insights?metric=${metricNames.join(",")}&access_token=${accessToken}`
      );
      const data = await response.json();

      if (!response.ok) {
        console.error("API Error Response:", data);
        throw new Error(data.error?.message || "Failed to fetch insights");
      }

      const enrichedInsights = data.data.map((insight) => {
        const metric = metricsList.find((m) => m.name === insight.name);
        return {
          ...insight,
          title: metric?.title || insight.name,
          description: metric?.description || "No description available.",
        };
      });

      console.log("Enriched Insights Data:", enrichedInsights);
      setSelectedPostInsights(enrichedInsights);
      setShowInsightsModal(true);
    } catch (err) {
      setError(err.message);
      console.error("Error fetching insights:", err);
    } finally {
      setIsLoadingInsights(false);
    }
  };

  const fetchPageInsights = async () => {
    setIsLoadingPageInsights(true);
    try {
      // All valid metrics combined into a single array
      const metrics = [
        { name: "page_total_actions", title: "Total Actions", description: "The number of clicks on your Page's contact info and call-to-action button." },
        { name: "page_post_engagements", title: "Post Engagements", description: "The number of times people have engaged with your posts through reactions, comments, shares, and more." },
        { name: "page_video_view_time", title: "Video View Time", description: "The total time, in milliseconds, people viewed your Page's videos." },
        { name: "page_views_total", title: "Total Page Views", description: "The number of times your Page's profile has been viewed by logged-in and logged-out users." },
        { name: "page_fan_adds_by_paid_non_paid_unique", title: "New Likes (Paid vs Organic)", description: "The number of new likes, broken down by paid vs. organic content." },
        { name: "page_daily_follows", title: "Daily Follows", description: "The number of times your Page was followed in the selected time period." },
        { name: "page_daily_follows_unique", title: "Unique Daily Follows", description: "The number of unique accounts that followed your Page in the selected time period." },
        { name: "page_daily_unfollows_unique", title: "Unique Daily Unfollows", description: "The number of unique accounts that unfollowed your Page in the selected time period." },
        { name: "page_follows", title: "Total Follows", description: "The number of followers of your Page (cumulative)." },
        { name: "page_impressions", title: "Total Impressions", description: "The number of times any content from your Page entered a person's screen." },
        { name: "page_impressions_unique", title: "Total Reach", description: "The number of unique users who saw any content from your Page." },
        { name: "page_impressions_paid", title: "Paid Impressions", description: "The number of times your Page's content was seen through paid promotions." },
        { name: "page_impressions_paid_unique", title: "Paid Reach", description: "The number of unique accounts that saw your ads at least once." },
        { name: "page_impressions_viral", title: "Viral Impressions", description: "The number of times your Page's content was seen with social information attached." },
        { name: "page_video_views_click_to_play", title: "Click-to-Play Video Views", description: "The number of times your Page's videos played for at least 3 seconds after people clicked play." },
        { name: "page_video_views_unique", title: "Unique Video Views", description: "The number of unique users who viewed your Page's videos for at least 3 seconds." },
        { name: "page_video_repeat_views", title: "Repeat Video Views", description: "The number of times your Page's videos were replayed for at least 3 seconds." },
        { name: "page_video_complete_views_30s", title: "30s Video Views", description: "The number of times your Page's videos played for at least 30 seconds." },
        { name: "page_video_complete_views_30s_paid", title: "Paid 30s Video Views", description: "The number of times your Page's promoted videos played for at least 30 seconds." },
        { name: "page_video_complete_views_30s_organic", title: "Organic 30s Video Views", description: "The number of times your Page's videos played for at least 30 seconds by organic reach." },
        { name: "page_video_complete_views_30s_autoplayed", title: "Autoplayed 30s Video Views", description: "The number of times your Page's automatically played videos played for at least 30 seconds." },
        { name: "page_video_complete_views_30s_click_to_play", title: "Click-to-Play 30s Video Views", description: "The number of times your Page's videos played for at least 30 seconds after people clicked play." },
        { name: "page_video_complete_views_30s_unique", title: "Unique 30s Video Views", description: "The number of unique users who viewed your Page's videos for at least 30 seconds." },
        { name: "page_video_complete_views_30s_repeat_views", title: "Repeat 30s Video Views", description: "The number of times your Page's videos replayed for at least 30 seconds." },
        { name: "page_impressions_viral_unique", title: "Viral Reach", description: "The number of unique users who saw your Page's content with social information attached." },
        { name: "page_impressions_nonviral", title: "Non-Viral Impressions", description: "The number of times your Page's content was seen without social information attached." },
        { name: "page_impressions_nonviral_unique", title: "Non-Viral Reach", description: "The number of unique users who saw your Page's content without social information attached." },
        { name: "page_posts_impressions", title: "Post Impressions", description: "The number of times your Page's posts entered a person's screen." },
        { name: "page_posts_impressions_unique", title: "Post Reach", description: "The number of unique users who saw your Page's posts." },
        { name: "page_posts_impressions_paid", title: "Paid Post Impressions", description: "The number of times your Page's posts were seen through paid distribution." },
        { name: "page_posts_impressions_paid_unique", title: "Paid Post Reach", description: "The number of unique accounts that saw your Page's posts through paid distribution." },
        { name: "page_posts_impressions_organic_unique", title: "Organic Post Reach", description: "The number of unique users who saw your Page's posts through unpaid distribution." },
        { name: "page_posts_served_impressions_organic_unique", title: "Served Organic Post Reach", description: "The number of unique users served your Page's posts in their Feed." },
        { name: "page_posts_impressions_viral", title: "Viral Post Impressions", description: "The number of times your Page's posts were seen with social information attached." },
        { name: "page_posts_impressions_viral_unique", title: "Viral Post Reach", description: "The number of unique users who saw your Page's posts with social information attached." },
        { name: "page_posts_impressions_nonviral", title: "Non-Viral Post Impressions", description: "The number of times your Page's posts were seen without social information attached." },
        { name: "page_posts_impressions_nonviral_unique", title: "Non-Viral Post Reach", description: "The number of unique users who saw your Page's posts without social information attached." },
        { name: "page_actions_post_reactions_like_total", title: "Like Reactions", description: "Total 'like' reactions on your posts." },
        { name: "page_actions_post_reactions_love_total", title: "Love Reactions", description: "Total 'love' reactions on your posts." },
        { name: "page_actions_post_reactions_wow_total", title: "Wow Reactions", description: "Total 'wow' reactions on your posts." },
        { name: "page_actions_post_reactions_haha_total", title: "Haha Reactions", description: "Total 'haha' reactions on your posts." },
        { name: "page_actions_post_reactions_sorry_total", title: "Sorry Reactions", description: "Total 'sorry' reactions on your posts." },
        { name: "page_actions_post_reactions_anger_total", title: "Anger Reactions", description: "Total 'anger' reactions on your posts." },
        { name: "page_actions_post_reactions_total", title: "Total Reactions", description: "Total reactions on your posts by type." },
        { name: "page_fan_adds", title: "New Likes", description: "The number of new people who have liked your Page." },
        { name: "page_fan_adds_unique", title: "Unique New Likes", description: "The number of unique accounts that liked your Page for the first time." },
        { name: "page_fan_removes", title: "Unlikes", description: "The number of unlikes of your Page." },
        { name: "page_fan_removes_unique", title: "Unique Unlikes", description: "The number of unique accounts that unliked your Page." },
        { name: "page_video_views", title: "Video Views", description: "The number of times your Page's videos played for at least 3 seconds." },
        { name: "page_video_views_by_uploaded_hosted", title: "Video Views (Uploaded/Hosted)", description: "Video views broken down by uploaded and hosted variants." },
        { name: "page_video_views_paid", title: "Paid Video Views", description: "The number of times your Page's promoted videos played for at least 3 seconds." },
        { name: "page_video_views_organic", title: "Organic Video Views", description: "The number of times your Page's videos played for at least 3 seconds by organic reach." },
        { name: "page_video_views_by_paid_non_paid", title: "Video Views (Paid vs Non-Paid)", description: "Video views broken down by paid vs. non-paid." },
        { name: "page_video_views_autoplayed", title: "Autoplayed.Video Views", description: "The number of times your Page's videos automatically played for at least 3 seconds." },
        { name: "page_daily_video_ad_break_ad_impressions_by_crosspost_status", title: "Ad Break Impressions (Crossposted)", description: "The total number of ad impressions in ad breaks for crossposted videos." },
        { name: "page_daily_video_ad_break_cpm_by_crosspost_status", title: "Ad Break CPM (Crossposted)", description: "The average CPM for ad breaks in crossposted videos." },
        { name: "page_daily_video_ad_break_earnings_by_crosspost_status", title: "Ad Break Earnings (Crossposted)", description: "The estimated earnings from ad breaks in crossposted videos." },
        { name: "content_monetization_earnings", title: "Content Monetization Earnings", description: "The amount of money you may have earned from content monetization." },
        { name: "monetization_approximate_earnings", title: "Approximate Monetization Earnings", description: "Your approximate earnings from monetization, excluding bonuses." },
      ];

      // Join all metric names for a single request
      const metricNames = metrics.map((m) => m.name).join(",");
      console.log(`Fetching page insights with metrics: ${metricNames}`);

      // Single API request
      const response = await fetch(
        `https://graph.facebook.com/v22.0/${pageId}/insights?metric=${metricNames}&period=day&date_preset=last_28d&access_token=${accessToken}`
      );
      const data = await response.json();

      if (!response.ok) {
        console.error("API Error Response:", data);
        throw new Error(data.error?.message || "Failed to fetch page insights");
      }

      // Map API response to enriched insights
      const allInsights = data.data.map((insight) => {
        const metric = metrics.find((m) => m.name === insight.name);
        return {
          ...insight,
          title: metric?.title || insight.name,
          description: metric?.description || "No description available.",
        };
      });

      // Flatten nested objects in the insights data
      const flattenedInsights = allInsights.map((insight) => {
        const flattened = { ...insight };

        if (insight.values && insight.values.length > 0) {
          const value = insight.values[0].value;

          if (typeof value === "object" && value !== null) {
            // Handle specific nested object cases
            if (insight.name === "page_fan_adds_by_paid_non_paid_unique") {
              flattened.valueDisplay = `Paid: ${value.paid || 0}, Organic: ${value.organic || 0}`;
            } else if (insight.name === "page_video_views_by_uploaded_hosted") {
              flattened.valueDisplay = `Uploaded: ${value.page_uploaded || 0}, Crossposts: ${value.page_uploaded_from_crossposts || 0}, Shares: ${value.page_uploaded_from_shares || 0}, Hosted: ${value.page_hosted_crosspost || 0}`;
            } else if (insight.name === "page_video_views_by_paid_non_paid") {
              flattened.valueDisplay = `Total: ${value.total || 0}, Paid: ${value.paid || 0}, Unpaid: ${value.unpaid || 0}`;
            } else if (insight.name === "content_monetization_earnings" || insight.name === "monetization_approximate_earnings") {
              flattened.valueDisplay = `${value.currency || "Unknown"} ${(value.microAmount / 1000000).toFixed(2)}`;
            } else if (insight.name.includes("page_actions_post_reactions")) {
              flattened.valueDisplay = JSON.stringify(value); // For reaction types
            } else {
              flattened.valueDisplay = JSON.stringify(value); // Fallback for other objects
            }
          } else {
            flattened.valueDisplay = value || 0; // Scalar value
          }
        } else {
          flattened.valueDisplay = "N/A"; // No values available
        }

        return flattened;
      });

      // Add page likes (fan_count) manually
      if (pageData?.fan_count) {
        flattenedInsights.push({
          name: "page_fans",
          title: "Page Likes",
          description: "The total number of users who like your Page.",
          valueDisplay: pageData.fan_count,
        });
      }

      console.log("Flattened Page Insights Data:", flattenedInsights);
      setPageInsights(flattenedInsights);
    } catch (err) {
      setError(err.message);
      console.error("Error fetching page insights:", err);
    } finally {
      setIsLoadingPageInsights(false);
    }
  };

  const closeInsightsModal = () => {
    setShowInsightsModal(false);
    setSelectedPostInsights(null);
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
    setIsLoadingReels(true);
    try {
      const response = await fetch(
        `https://graph.facebook.com/v18.0/${pageId}/video_reels?fields=id,source,thumbnail,created_time,title,description&access_token=${accessToken}&limit=10`
      );
      const data = await response.json();
      console.log("Reels data:", data);
      if (!response.ok) throw new Error(data.error?.message || "Failed to fetch reels");
      setReels(data.data || []);
    } catch (err) {
      setError(err.message);
      console.error("Error fetching reels:", err);
    } finally {
      setIsLoadingReels(false);
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
              <p>{pageData.fan_count.toLocaleString()} likes • {pageData.followers_count?.toLocaleString() || "1"} followers</p>
            </div>
          </div>
          <div className="profile-tabs">
            {["Posts", "About", "Mentions", "Reviews", "Photos", "Page Insights"].map((tab) => (
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
              <div className="sidebar-section intro-section">
                <h3>Intro</h3>
                <div className="intro-details">
                  {pageData.about && (
                    <p className="intro-text intro-about">{pageData.about}</p>
                  )}
                  <p className="intro-text">{pageData.category || "Home Businesses"}</p>
                  {pageData.location && (pageData.location.city || pageData.location.country) && (
                    <p className="intro-text">
                      {[
                        pageData.location.city,
                        pageData.location.country,
                      ]
                        .filter(Boolean)
                        .join(", ")}
                    </p>
                  )}
                  {pageData.phone && (
                    <p className="intro-text">
                      <a href={`tel:${pageData.phone}`} className="intro-link">
                        {pageData.phone}
                      </a>
                    </p>
                  )}
                  {pageData.emails?.[0] && (
                    <p className="intro-text">
                      <a href={`mailto:${pageData.emails[0]}`} className="intro-link">
                        {pageData.emails[0]}
                      </a>
                    </p>
                  )}
                  {pageData.website && (
                    <p className="intro-text">
                      <a href={pageData.website} target="_blank" rel="noopener noreferrer" className="intro-link">
                        Visit Website
                      </a>
                    </p>
                  )}
                </div>
                <button className="promote-button">Promote Page</button>
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
                          Upload photos/videos
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
                            <button
                              className="action-button insights-action"
                              onClick={() => fetchPostInsights(post.id)}
                              disabled={isLoadingInsights}
                            >
                              {isLoadingInsights ? "Loading..." : "Insights"}
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
                    <div className="about-header">
                      <h2></h2>
                      {!isEditingAbout && (
                        <button className="edit-about-btn" onClick={() => setIsEditingAbout(true)}>
                          Edit
                        </button>
                      )}
                    </div>

                    {isEditingAbout ? (
                      <div className="edit-about-container">
                        <h3>Edit About Information</h3>
                        <div className="edit-form-section">
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

                        <div className="edit-form-section">
                          <h4>Contact Information</h4>
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
                            Email:
                            <input
                              type="email"
                              value={editedPageData.email}
                              onChange={(e) => setEditedPageData((prev) => ({ ...prev, email: e.target.value }))}
                              className="edit-input"
                            />
                          </label>
                          <label>
                            Address:
                            <Autocomplete
                              onLoad={(autocomplete) => setAddressAutocomplete(autocomplete)}
                              onPlaceChanged={() => {
                                if (addressAutocomplete) {
                                  const place = addressAutocomplete.getPlace();
                                  if (place.formatted_address && place.geometry) {
                                    const addressComponents = place.address_components || [];
                                    let street = "", city = "", state = "", country = "", zip = "";
                                    addressComponents.forEach((component) => {
                                      const types = component.types;
                                      if (types.includes("street_number") || types.includes("route")) {
                                        street += (street ? " " : "") + component.long_name;
                                      } else if (types.includes("locality")) {
                                        city = component.long_name;
                                      } else if (types.includes("administrative_area_level_1")) {
                                        state = component.long_name;
                                      } else if (types.includes("country")) {
                                        country = component.long_name;
                                      } else if (types.includes("postal_code")) {
                                        zip = component.long_name;
                                      }
                                    });
                                    setEditedPageData((prev) => ({
                                      ...prev,
                                      address: street,
                                      addressLat: place.geometry.location.lat(),
                                      addressLng: place.geometry.location.lng(),
                                      addressCity: city,
                                      addressState: state,
                                      addressCountry: country,
                                      addressZip: zip,
                                    }));
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
                            {editedPageData.addressLat && editedPageData.addressLng && (
                              <GoogleMap
                                mapContainerStyle={{ height: "200px", width: "100%", marginTop: "10px" }}
                                center={{ lat: editedPageData.addressLat, lng: editedPageData.addressLng }}
                                zoom={15}
                              >
                                <Marker position={{ lat: editedPageData.addressLat, lng: editedPageData.addressLng }} />
                              </GoogleMap>
                            )}
                          </label>
                        </div>

                        <div className="edit-actions">
                          <button className="save-btn" onClick={updatePageData}>
                            Save Changes
                          </button>
                          <button className="cancel-btn" onClick={() => setIsEditingAbout(false)}>
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="about-content">
                        <div className="info-card">
                          <h3>Overview</h3>
                          <p>{pageData.about || "No about information provided."}</p>
                          <p>{pageData.description || "No description available."}</p>
                        </div>

                        <div className="info-card">
                          <h3>Contact Information</h3>
                          {pageData.phone && (
                            <div className="info-row">
                              <span className="info-label">Phone:</span>
                              <span>{pageData.phone}</span>
                            </div>
                          )}
                          {pageData.website && (
                            <div className="info-row">
                              <span className="info-label">Website:</span>
                              <a href={pageData.website} target="_blank" rel="noopener noreferrer">
                                {pageData.website}
                              </a>
                            </div>
                          )}
                          {editedPageData.email && (
                            <div className="info-row">
                              <span className="info-label">Email:</span>
                              <span>{editedPageData.email}</span>
                            </div>
                          )}
                          {editedPageData.address && (
                            <div className="info-row">
                              <span className="info-label">Address:</span>
                              <div>
                                <span>{`${editedPageData.address}, ${editedPageData.addressCity}, ${editedPageData.addressCountry}`}</span>
                                {editedPageData.addressLat && editedPageData.addressLng && (
                                  <GoogleMap
                                    mapContainerStyle={{ height: "200px", width: "100%", marginTop: "10px" }}
                                    center={{ lat: editedPageData.addressLat, lng: editedPageData.addressLng }}
                                    zoom={15}
                                  >
                                    <Marker position={{ lat: editedPageData.addressLat, lng: editedPageData.addressLng }} />
                                  </GoogleMap>
                                )}
                              </div>
                            </div>
                          )}
                        </div>

                        <div className="info-card">
                          <h3>Reels</h3>
                          {isLoadingReels ? (
                            <p>Loading reels...</p>
                          ) : reels.length > 0 ? (
                            <div className="media-grid">
                              {reels.slice(0, 3).map((reel) => (
                                <div key={reel.id} className="media-item">
                                  <video
                                    src={reel.source}
                                    poster={reel.thumbnail}
                                    controls
                                    className="media-video"
                                  />
                                  <p>{reel.description || "Untitled Reel"}</p>
                                </div>
                              ))}
                              {reels.length > 3 && (
                                <button className="see-more-btn" onClick={() => setActiveTab("Reels")}>
                                  See All Reels
                                </button>
                              )}
                            </div>
                          ) : (
                            <p>No reels available.</p>
                          )}
                        </div>

                        <div className="info-card">
                          <h3>Videos</h3>
                          {isLoadingVideos ? (
                            <p>Loading videos...</p>
                          ) : videos.length > 0 ? (
                            <div className="media-grid">
                              {videos.slice(0, 3).map((video) => (
                                <div key={video.id} className="media-item">
                                  <video
                                    src={video.source}
                                    poster={video.thumbnail_url}
                                    controls
                                    className="media-video"
                                  />
                                  <p>{video.description || "Untitled Video"}</p>
                                </div>
                              ))}
                              {videos.length > 3 && (
                                <button className="see-more-btn" onClick={() => setActiveTab("Videos")}>
                                  See All Videos
                                </button>
                              )}
                            </div>
                          ) : (
                            <p>No videos available.</p>
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
{activeTab === "Page Insights" && (
                <div className="page-insights-section">
                  <h2>Page Insights</h2>
                  {isLoadingPageInsights ? (
                    <p>Loading page insights...</p>
                  ) : pageInsights && pageInsights.length > 0 ? (
                    <div className="page-insights-content">
                      {[
                        {
                          category: "Engagement",
                          filter: (insight) =>
                            insight.name.includes("engagements") ||
                            insight.name.includes("actions") ||
                            insight.name.includes("reactions"),
                        },
                        {
                          category: "Reach & Impressions",
                          filter: (insight) =>
                            insight.name.includes("impressions") || insight.name.includes("reach"),
                        },
                        {
                          category: "Likes & Follows",
                          filter: (insight) =>
                            insight.name.includes("fan") ||
                            insight.name.includes("follows") ||
                            insight.name === "page_fans",
                        },
                        {
                          category: "Video Metrics",
                          filter: (insight) =>
                            insight.name.includes("video") && !insight.name.includes("ad_break"),
                        },
                        {
                          category: "Monetization",
                          filter: (insight) =>
                            insight.name.includes("earnings") || insight.name.includes("ad_break"),
                        },
                        {
                          category: "Page Views",
                          filter: (insight) => insight.name.includes("views_total"),
                        },
                      ].map((cat) => {
                        const categoryInsights = pageInsights.filter(cat.filter);
                        return categoryInsights.length > 0 ? (
                          <div key={cat.category} className="accordion-item">
                            <button
                              className={`accordion-header ${
                                activeAccordion === cat.category ? "active" : ""
                              }`}
                              onClick={() =>
                                setActiveAccordion((prev) =>
                                  prev === cat.category ? null : cat.category
                                )
                              }
                            >
                              <span>{cat.category}</span>
                              <span className="accordion-icon">
                                {activeAccordion === cat.category ? "−" : "+"}
                              </span>
                            </button>
                            {activeAccordion === cat.category && (
                              <div className="accordion-content">
                                <ul className="insights-list">
                                  {categoryInsights.map((insight) => (
                                    <li key={insight.name} className="insight-item">
                                      <div className="insight-header">
                                        <strong className="insight-title">{insight.title}</strong>
                                        <span className="insight-value">{insight.valueDisplay}</span>
                                      </div>
                                      <p className="insight-description">{insight.description}</p>
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            )}
                          </div>
                        ) : null;
                      })}
                    </div>
                  ) : (
                    <p>No page insights available.</p>
                  )}
                </div>
              )}
              {showInsightsModal && (
                <div className="insights-modal-overlay" onClick={closeInsightsModal}>
                  <div className="insights-modal" onClick={(e) => e.stopPropagation()}>
                    <div className="insights-modal-header">
                      <h3>Post Insights</h3>
                      <button className="close-modal-btn" onClick={closeInsightsModal}>
                        ×
                      </button>
                    </div>
                    <div className="insights-modal-content">
                      {selectedPostInsights && selectedPostInsights.length > 0 ? (
                        <ul>
                          {selectedPostInsights.map((insight) => (
                            <li key={insight.name} className="insight-item">
                              <div className="insight-header">
                                <strong>{insight.title}</strong>
                                <span className="insight-value">
                                  {insight.name === "post_reactions_by_type_total"
                                    ? JSON.stringify(insight.values[0].value)
                                    : insight.values[0].value}
                                </span>
                              </div>
                              <p className="insight-description">{insight.description}</p>
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p>No insights available for this post.</p>
                      )}
                    </div>
                  </div>
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