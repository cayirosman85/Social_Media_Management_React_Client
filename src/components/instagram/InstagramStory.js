import React, { useState, useEffect, useRef } from "react";
import { fetchStoryInsights } from "../../services/instagram/instagramService";
import InsightsModal from "../../components/instagram/InsightsModal";
import { FaChartBar, FaPlay, FaPause } from "react-icons/fa"; // Existing icons

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
          <div className="story-right-controls" style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <span
              className="story-icon-wrapper"
              onClick={handleViewInsights}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                width: "30px",
                height: "30px",
                backgroundColor: "rgba(0, 0, 0, 0.6)",
                borderRadius: "50%",
                cursor: "pointer",
              }}
              title="View Insights"
            >
              <FaChartBar style={{ fontSize: "16px", color: "#fff" }} />
            </span>
            <button
              className="story-play-pause-btn"
              onClick={togglePlayPause}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                width: "30px",
                height: "30px",
                backgroundColor: "rgba(0, 0, 0, 0.6)",
                borderRadius: "50%",
                border: "none",
                padding: 0,
                cursor: "pointer",
              }}
            >
              {isPaused ? (
                <FaPlay style={{ fontSize: "16px", color: "#fff" }} title="Play" />
              ) : (
                <FaPause style={{ fontSize: "16px", color: "#fff" }} title="Pause" />
              )}
            </button>
            <span
              className="story-close"
              onClick={onClose}
              style={{ fontSize: "24px", cursor: "pointer", color: "#fff" }}
            >
              ×
            </span>
          </div>
        </div>

        {/* Previous Button */}
        <button
          className="story-btn prev"
          onClick={prevStory}
          style={{
            position: "absolute",
            left: "10px",
            top: "50%",
            transform: "translateY(-50%)",
            width: "40px",
            height: "40px",
            backgroundColor: "rgba(0, 0, 0, 0.6)",
            borderRadius: "50%",
            border: "none",
            color: "#fff",
            fontSize: "20px",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
          disabled={currentIndex === 0} // Disable if at the first story
        >
          ❮
        </button>

        {/* Story Content */}
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

        {/* Next Button */}
        <button
          className="story-btn next"
          onClick={nextStory}
          style={{
            position: "absolute",
            right: "10px",
            top: "50%",
            transform: "translateY(-50%)",
            width: "40px",
            height: "40px",
            backgroundColor: "rgba(0, 0, 0, 0.6)",
            borderRadius: "50%",
            border: "none",
            color: "#fff",
            fontSize: "20px",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
          disabled={currentIndex === stories.length - 1} // Disable if at the last story
        >
          ❯
        </button>

        <div className="story-progress">
          {stories.map((_, index) => (
            <div
              key={index}
              className={`story-progress-bar ${index === currentIndex ? "active" : ""} ${
                index < currentIndex ? "viewed" : ""
              }`}
              style={{ animationPlayState: isPaused ? "paused" : "running" }}
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