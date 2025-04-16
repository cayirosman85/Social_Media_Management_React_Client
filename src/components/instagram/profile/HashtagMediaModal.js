import React, { useState, useEffect } from "react";
import "./HashtagMediaModal.css";

const HashtagMediaModal = ({ media, onClose }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setIsLoading(true);
    setCurrentIndex(0); // Reset index when media changes
  }, [media]);

  if (!media) return null;

  const isCarousel = media.media_type === "CAROUSEL_ALBUM" && media.children?.data;
  const carouselItems = media.children?.data || [];
  const currentItem = isCarousel ? carouselItems[currentIndex] : media;

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev > 0 ? prev - 1 : carouselItems.length - 1));
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev < carouselItems.length - 1 ? prev + 1 : 0));
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <button className="modal-close" onClick={onClose} aria-label="Close modal">
          <span>×</span>
        </button>

        {/* Media Section (Left Side) */}
        <div className="modal-media-section">
          {isLoading && <div className="modal-loader">Loading...</div>}
          {media.media_type === "IMAGE" || !isCarousel ? (
            <img
              src={currentItem.media_url}
              alt={currentItem.media_type === "IMAGE" ? "Media" : "Video Thumbnail"}
              className="modal-media"
              onLoad={() => setIsLoading(false)}
              onError={(e) => {
                e.target.src = "https://via.placeholder.com/500x600?text=Image+Not+Available";
                setIsLoading(false);
                console.error(`Failed to load ${currentItem.media_type}: ${currentItem.media_url}`);
              }}
            />
          ) : media.media_type === "VIDEO" ? (
            <video
              src={currentItem.media_url}
              controls
              className="modal-media"
              onLoad={() => setIsLoading(false)}
              onError={(e) => {
                console.error(`Failed to load video: ${currentItem.media_url}`);
                setIsLoading(false);
              }}
            />
          ) : isCarousel && carouselItems.length > 0 ? (
            <>
              <img
                src={currentItem.media_url}
                alt={`Carousel Item ${currentIndex}`}
                className="modal-media"
                onLoad={() => setIsLoading(false)}
                onError={(e) => {
                  e.target.src = "https://via.placeholder.com/500x600?text=Image+Not+Available";
                  setIsLoading(false);
                  console.error(`Failed to load image: ${currentItem.media_url}`);
                }}
              />
              <div className="carousel-controls">
                <button className="carousel-control prev" onClick={handlePrev} aria-label="Previous">
                  <span>❮</span>
                </button>
                <button className="carousel-control next" onClick={handleNext} aria-label="Next">
                  <span>❯</span>
                </button>
              </div>
              <div className="carousel-dots">
                {carouselItems.map((_, index) => (
                  <span
                    key={index}
                    className={`dot ${index === currentIndex ? "active" : ""}`}
                    onClick={() => setCurrentIndex(index)}
                    aria-label={`Go to item ${index + 1}`}
                  ></span>
                ))}
              </div>
            </>
          ) : (
            <div className="no-media">No media available</div>
          )}
        </div>

        {/* Info Section (Right Side) */}
        <div className="modal-info-section">
          <div className="info-card">
            <div className="info-item">
              <span className="label">Caption:</span>
              <span className="value caption">{media.caption || "No caption"}</span>
            </div>
            <div className="info-item">
              <span className="label">Likes:</span>
              <span className="value">{media.like_count || 0}</span>
            </div>
            <div className="info-item">
              <span className="label">Comments:</span>
              <span className="value">{media.comments_count || 0}</span>
            </div>
            <div className="info-item">
              <span className="label">Date:</span>
              <span className="value">{new Date(media.timestamp).toLocaleDateString()}</span>
            </div>
            <div className="info-item">
              <span className="label">Permalink:</span>
              <a
                href={media.permalink}
                target="_blank"
                rel="noopener noreferrer"
                className="link"
              >
                View on Instagram
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HashtagMediaModal;