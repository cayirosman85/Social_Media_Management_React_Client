import React, { useState, useEffect, useRef } from "react";

const InstagramStory = ({ stories, initialIndex, onClose, instagramData }) => {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [showOptions, setShowOptions] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const STORY_DURATION = 5000; // 5 seconds
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
    // Assuming isLoading is managed in a parent or context
    try {
      const response = await fetch("http://localhost:8000/api/story-insights", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: instagramData.business_discovery.id,
          media_id: stories[currentIndex].id,
          access_token: instagramData.accessToken,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to fetch insights: ${errorText}`);
      }

      const data = await response.json();
      if (data.success) {
        console.log("Story insights from server:", data.insights);
        // Handle insights display (e.g., set state in parent or use context)
      } else {
        throw new Error(data.error || "Failed to retrieve insights");
      }

      setShowOptions(false);
      setIsPaused(false);
    } catch (error) {
      console.error("Error fetching insights:", error);
      // Handle error (e.g., setErrorModalMessage in parent)
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
      </div>
    </div>
  );
};

export default InstagramStory;