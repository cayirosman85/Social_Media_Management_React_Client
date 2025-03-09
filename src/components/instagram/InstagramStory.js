import React, { useState, useEffect, useRef } from "react";
import { fetchStoryInsights } from "../../services/instagram/instagramService";
import InsightsModal from "../../components/instagram/InsightsModal";
import { FaChartBar } from "react-icons/fa";
import "./InstagramStory.css"; // Import the CSS file

const InstagramStory = ({ stories, initialIndex, onClose, instagramData }) => {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [insights, setInsights] = useState(null);
  const [isPaused, setIsPaused] = useState(false);
  const [isInsightsModalOpen, setIsInsightsModalOpen] = useState(false);
  const STORY_DURATION = 5000;
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

    if (!isPaused) {
      timerRef.current = setTimeout(nextStory, STORY_DURATION);
    }

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, [currentIndex, isPaused]);

  useEffect(() => {
    if (currentStory.media_type === "VIDEO" && videoRef.current) {
      if (isPaused) {
        videoRef.current.pause();
      } else {
        videoRef.current.play().catch((error) => console.error("Error resuming video:", error));
      }
    }
  }, [isPaused, currentIndex]);

  const togglePlayPause = () => {
    setIsPaused((prev) => !prev);
  };

  const handleViewInsights = async (e) => {
    e.stopPropagation();
    try {
      const response = await fetchStoryInsights(
        "17841473036355290",
        stories[currentIndex].id,
        "EAAZAde8LZA8zIBO4O8QsOQmyMMMShi79cCZBMRJZCjbSbXG7Y3ZAQ4OGvJN1vi8LYLeNx6K9pbxpFuU2saC3lWWt43za1ggpCu9YONtmCuwucaWVgtYYqRcG2oMtuHPhxq6x4n3ImiE3TzXf4IzMHxMtuDbwNfT52ZA6yjkwWabhrLZCrb7zqWzdkjZBApQJmNntUgZDZD"
      );

      if (response.success) {
        console.log("Story insights from server:", response.insights);
        setInsights(response.insights);
        setIsInsightsModalOpen(true);
        setIsPaused(true);
      } else {
        throw new Error(response.error || "Failed to retrieve insights");
      }
    } catch (error) {
      console.error("Error fetching insights:", error.message);
    }
  };

  const closeInsightsModal = () => {
    setIsInsightsModalOpen(false);
    setInsights(null);
    setIsPaused(false);
  };

  const currentStory = stories[currentIndex];

  return (
    <div className="story-modal" onClick={onClose}>
      <div className="story-modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="story-controls">
          <div className="story-right-controls">
            <FaChartBar
              className="story-insights-icon"
              onClick={handleViewInsights}
              title="View Insights"
            />
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
            />
          ))}
        </div>
        <InsightsModal
          isOpen={isInsightsModalOpen}
          onClose={closeInsightsModal}
          insights={insights}
          postId={stories[currentIndex]?.id}
          mediaType={currentStory.media_type}
        />
      </div>
    </div>
  );
};

export default InstagramStory;