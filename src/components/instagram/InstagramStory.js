import React, { useState, useEffect, useRef } from "react";
import { fetchStoryInsights } from "../../services/instagram/instagramService"; // Updated import

const InstagramStory = ({ stories, initialIndex, onClose, instagramData }) => {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [showOptions, setShowOptions] = useState(false);
  const [insights, setInsights] = useState(null);
  const [isPaused, setIsPaused] = useState(false);
  const STORY_DURATION = 5000;
  const moreOptionsRef = useRef(null);
  const timerRef = useRef(null);
  const videoRef = useRef(null);

  const nextStory = () => {
    if (currentIndex < stories.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      onClose();
    }
  };

  const prevStory = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  };

  useEffect(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }

    if (!isPaused && !showOptions) {
      timerRef.current = setTimeout(nextStory, STORY_DURATION);
    }

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, [currentIndex, isPaused, showOptions]);

  useEffect(() => {
    if (currentStory.media_type === "VIDEO" && videoRef.current) {
      if (isPaused || showOptions) {
        videoRef.current.pause();
      } else {
        videoRef.current.play().catch((error) => console.error("Error resuming video:", error));
      }
    }
  }, [isPaused, showOptions, currentIndex]);

  const toggleOptions = (e) => {
    e.stopPropagation();
    setShowOptions((prev) => {
      const newShowOptions = !prev;
      setIsPaused(newShowOptions);
      return newShowOptions;
    });
  };

  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (moreOptionsRef.current && !moreOptionsRef.current.contains(e.target)) {
        setShowOptions(false);
        setIsPaused(false);
      }
    };
    document.addEventListener("click", handleOutsideClick);
    return () => document.removeEventListener("click", handleOutsideClick);
  }, []);

  const togglePlayPause = () => {
    setIsPaused((prev) => !prev);
  };

  const handleViewInsights = async () => {
    try {

  
      const response = await fetchStoryInsights(
        "17841473036355290",
        stories[currentIndex].id,
        "EAAZAde8LZA8zIBO4O8QsOQmyMMMShi79cCZBMRJZCjbSbXG7Y3ZAQ4OGvJN1vi8LYLeNx6K9pbxpFuU2saC3lWWt43za1ggpCu9YONtmCuwucaWVgtYYqRcG2oMtuHPhxq6x4n3ImiE3TzXf4IzMHxMtuDbwNfT52ZA6yjkwWabhrLZCrb7zqWzdkjZBApQJmNntUgZDZD"
      );
  
      if (response.success) {
        console.log("Story insights from server:", response.insights);
        setInsights(response.insights);
      } else {
        throw new Error(response.error || "Failed to retrieve insights");
      }
  
      setShowOptions(false);
      setIsPaused(false);
    } catch (error) {
      console.error("Error fetching insights:", error.message);
    }
  };
  
  const handleCancel = () => {
    setShowOptions(false);
    setIsPaused(false);
  };

  const currentStory = stories[currentIndex];

  return (
    <div className="story-modal" onClick={onClose}>
      <div className="story-modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="story-controls">
          <div className="story-right-controls">
            <span ref={moreOptionsRef} className="story-more-options" onClick={toggleOptions}>
              ⋯
            </span>
            <button className="story-play-pause-btn" onClick={togglePlayPause}>
              {isPaused ? "▶️" : "⏸️"}
            </button>
            <span className="story-close" onClick={onClose}>
              ×
            </span>
          </div>
        </div>
        <button className="story-btn prev" onClick={prevStory}>
          ❮
        </button>
        {currentStory.media_type === "VIDEO" ? (
          <video
            ref={videoRef}
            src={currentStory.media_url}
            className="story-modal-img"
            autoPlay={!isPaused}
            muted
            playsInline
            onEnded={nextStory}
          />
        ) : (
          <img src={currentStory.media_url} alt="Story" className="story-modal-img" />
        )}
        <button className="story-btn next" onClick={nextStory}>
          ❯
        </button>
        <div className="story-progress">
          {stories.map((_, index) => (
            <div
              key={index}
              className={`story-progress-bar ${index === currentIndex ? "active" : ""} ${
                index < currentIndex ? "viewed" : ""
              }`}
              style={{ animationPlayState: isPaused || showOptions ? "paused" : "running" }}
            />
          ))}
        </div>
        {showOptions && (
          <div className="story-options-dropdown">
            <ul>
              <li onClick={handleViewInsights}>Insights</li>
              <li onClick={handleCancel}>Cancel</li>
            </ul>
          </div>
        )}
        {insights && (
          <div
            className="story-insights"
            style={{
              position: "absolute",
              bottom: "20px",
              left: "20px",
              right: "20px",
              background: "rgba(255, 255, 255, 0.9)",
              borderRadius: "8px",
              padding: "10px",
              color: "#262626",
              fontSize: "14px",
              zIndex: 1010,
            }}
          >
            <h3 style={{ fontSize: "16px", margin: "0 0 10px" }}>Story Insights</h3>
            <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
              {insights.map((insight) => (
                <li key={insight.name} style={{ marginBottom: "8px" }}>
                  <strong>{insight.title}:</strong> {insight.values[0]?.value || 0}
                  <br />
                  <small>{insight.description}</small>
                </li>
              ))}
            </ul>
            <button
              onClick={() => setInsights(null)}
              style={{
                marginTop: "10px",
                background: "#0095f6",
                color: "white",
                border: "none",
                padding: "5px 10px",
                borderRadius: "4px",
                cursor: "pointer",
              }}
            >
              Close Insights
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default InstagramStory;