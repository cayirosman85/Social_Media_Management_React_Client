import React, { useState, useEffect } from "react";
import {
  searchHashtag,
  getRecentMedia,
  getTopMedia,
} from "../../services/instagram/instagramService";
import "./HashtagManager.css";

// Separate component for carousel media items
const CarouselMediaItem = ({ media }) => {
  const [carouselIndex, setCarouselIndex] = useState(0);

  const handlePrev = () => {
    setCarouselIndex((prev) =>
      prev > 0 ? prev - 1 : media.children.data.length - 1
    );
  };

  const handleNext = () => {
    setCarouselIndex((prev) =>
      prev < media.children.data.length - 1 ? prev + 1 : 0
    );
  };

  return (
    <div className="media-card">
      {media.media_type === "IMAGE" ? (
        <img src={media.media_url} alt="Media" className="media-content" />
      ) : media.media_type === "VIDEO" ? (
        <video src={media.media_url} controls className="media-content" />
      ) : media.media_type === "CAROUSEL_ALBUM" && media.children ? (
        <div className="carousel">
          <button className="carousel-arrow carousel-prev" onClick={handlePrev}>
            ❮
          </button>
          <div className="carousel-content">
            {media.children.data.length > 0 && (
              <div className="carousel-item">
                {media.children.data[carouselIndex].media_type === "IMAGE" ? (
                  <img
                    src={media.children.data[carouselIndex].media_url}
                    alt="Carousel Item"
                    className="media-content"
                  />
                ) : (
                  <video
                    src={media.children.data[carouselIndex].media_url}
                    controls
                    className="media-content"
                  />
                )}
                <p>Child ID: {media.children.data[carouselIndex].id}</p>
                <p>
                  Child Media Type:{" "}
                  {media.children.data[carouselIndex].media_type}
                </p>
              </div>
            )}
          </div>
          <button className="carousel-arrow carousel-next" onClick={handleNext}>
            ❯
          </button>
        </div>
      ) : (
        <p>Unsupported media type: {media.media_type}</p>
      )}
      <div className="media-info">
        <p>
          <strong>ID:</strong> {media.id}
        </p>
        <div className="caption-container">
          <strong>Caption:</strong>{" "}
          <span>{media.caption || "No caption"}</span>
        </div>
        <p>
          <strong>Media Type:</strong> {media.media_type}
        </p>
        <p>
          <strong>Likes:</strong> {media.like_count || 0}
        </p>
        <p>
          <strong>Comments:</strong> {media.comments_count || 0}
        </p>
        <p>
          <strong>Timestamp:</strong>{" "}
          {new Date(media.timestamp).toLocaleString()}
        </p>
        <p>
          <strong>Permalink:</strong>{" "}
          <a href={media.permalink} target="_blank" rel="noopener noreferrer">
            View on Instagram
          </a>
        </p>
        <p>
          <strong>Media URL:</strong>{" "}
          <a href={media.media_url} target="_blank" rel="noopener noreferrer">
            Direct Link
          </a>
        </p>
      </div>
    </div>
  );
};

const Hashtags = () => {
  const [hashtagName, setHashtagName] = useState("");
  const [hashtagId, setHashtagId] = useState(null);
  const [recentMedia, setRecentMedia] = useState([]);
  const [topMedia, setTopMedia] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState("recent");

  const instagramData = {
    business_discovery: {
      id: "17841473036355290",
      username: "osmancayir73",
    },
    accessToken:
      "EAAZAde8LZA8zIBO4O8QsOQmyMMMShi79cCZBMRJZCjbSbXG7Y3ZAQ4OGvJN1vi8LYLeNx6K9pbxpFuU2saC3lWWt43za1ggpCu9YONtmCuwucaWVgtYYqRcG2oMtuHPhxq6x4n3ImiE3TzXf4IzMHxMtuDbwNfT52ZA6yjkwWabhrLZCrb7zqWzdkjZBApQJmNntUgZDZD",
  };

  const handleSearch = async () => {
    if (!hashtagName.trim()) {
      setError("Please enter a hashtag");
      return;
    }
    console.log("handleSearch called with hashtagName:", hashtagName);
    setIsLoading(true);
    setError(null);

    try {
      const payload = {
        user_id: instagramData.business_discovery.id,
        q: hashtagName,
        access_token: instagramData.accessToken,
      };
      console.log("Calling searchHashtag with:", payload);
      const response = await searchHashtag(
        instagramData.business_discovery.id,
        hashtagName,
        instagramData.accessToken
      );
      console.log("searchHashtag response:", response);
      const data = response.data[0];
      if (!data || !data.id) {
        throw new Error("No hashtag ID found in response");
      }
      console.log("Extracted hashtag data:", data);
      setHashtagId(data.id);
      console.log("Set hashtagId to:", data.id);
    } catch (err) {
      console.error("Error in handleSearch:", err.message);
      setError(err.message);
    } finally {
      setIsLoading(false);
      console.log("handleSearch completed, isLoading set to false");
    }
  };

  const fetchRecentMedia = async () => {
    if (!hashtagId) return;
    console.log("fetchRecentMedia called with hashtagId:", hashtagId);
    setIsLoading(true);
    setError(null);
    try {
      const response = await getRecentMedia(
        instagramData.business_discovery.id,
        hashtagId,
        instagramData.accessToken
      );
      console.log("getRecentMedia response:", response);
      setRecentMedia(response.data || []);
    } catch (err) {
      console.error("Error in fetchRecentMedia:", err.message);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchTopMedia = async () => {
    if (!hashtagId) return;
    console.log("fetchTopMedia called with hashtagId:", hashtagId);
    setIsLoading(true);
    setError(null);
    try {
      const response = await getTopMedia(
        instagramData.business_discovery.id,
        hashtagId,
        instagramData.accessToken
      );
      console.log("getTopMedia response:", response);
      setTopMedia(response.data || []);
    } catch (err) {
      console.error("Error in fetchTopMedia:", err.message);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (hashtagId) {
      fetchRecentMedia();
      fetchTopMedia();
    }
  }, [hashtagId]);

  return (
    <div className="hashtags-container">
      <h2 className="hashtags-title">Hashtags</h2>

      <div className="search-form">
        <input
          type="text"
          value={hashtagName}
          onChange={(e) => setHashtagName(e.target.value)}
          placeholder="Enter hashtag (e.g., nature)"
          className="search-input"
        />
        <button
          type="button"
          onClick={handleSearch}
          disabled={isLoading}
          className="search-button"
        >
          {isLoading ? "Searching..." : "Search"}
        </button>
      </div>

      {error && <div className="error-message">{error}</div>}
      {hashtagId && (
        <div className="hashtag-info">
          <p>Hashtag: #{hashtagName}</p>
          <p>ID: {hashtagId}</p>
        </div>
      )}

      {hashtagId && (
        <div className="tabs-container">
          <button
            className={`tab-button ${activeTab === "recent" ? "active" : ""}`}
            onClick={() => setActiveTab("recent")}
          >
            Recent Media
          </button>
          <button
            className={`tab-button ${activeTab === "top" ? "active" : ""}`}
            onClick={() => setActiveTab("top")}
          >
            Top Media
          </button>
        </div>
      )}

      <div className="tab-content">
        {isLoading ? (
          <div className="loader">Loading...</div>
        ) : activeTab === "recent" ? (
          recentMedia.length > 0 ? (
            <div className="media-grid">
              {recentMedia.map((media) => (
                <CarouselMediaItem key={media.id} media={media} />
              ))}
            </div>
          ) : (
            <p className="no-data">No recent media found.</p>
          )
        ) : topMedia.length > 0 ? (
          <div className="media-grid">
            {topMedia.map((media) => (
              <CarouselMediaItem key={media.id} media={media} />
            ))}
          </div>
        ) : (
          <p className="no-data">No top media found.</p>
        )}
      </div>
    </div>
  );
};

export default Hashtags;