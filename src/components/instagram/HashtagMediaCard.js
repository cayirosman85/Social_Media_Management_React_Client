import React, { useState } from "react";
import "./HashtagMediaCard.css";

const HashtagMediaCard = ({ media, onClick }) => {
  const [carouselIndex, setCarouselIndex] = useState(0);

  const handlePrev = (e) => {
    e.stopPropagation();
    setCarouselIndex((prev) =>
      prev > 0 ? prev - 1 : media.children?.data.length - 1
    );
  };

  const handleNext = (e) => {
    e.stopPropagation();
    setCarouselIndex((prev) =>
      prev < media.children?.data.length - 1 ? prev + 1 : 0
    );
  };

  return (
    <div className="media-card" onClick={() => onClick({ media, childrenMedia: media.children })}>
      {/* Media Section */}
      <div className="media-section">
        {media.media_type === "IMAGE" ? (
          <img src={media.media_url} alt="Media" className="media-content" />
        ) : media.media_type === "VIDEO" ? (
          <video
            src={media.media_url}
            controls
            className="media-content"
            muted
          />
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
                      muted
                    />
                  )}
                </div>
              )}
            </div>
            <button className="carousel-arrow carousel-next" onClick={handleNext}>
              ❯
            </button>
          </div>
        ) : (
          <p className="unsupported-text">Unsupported media type: {media.media_type}</p>
        )}
      </div>

      {/* Info Section */}
      <div className="media-info">
        {/* Caption Section */}
        <div className="caption-section">
          <strong>Caption:</strong>{" "}
          <span>{media.caption || "No caption"}</span>
        </div>

        {/* Details Section */}
        <div className="details-section">
          <div className="stats-container">
            <div className="stat-item">
              <strong>Likes</strong>
              <span>{media.like_count || 0}</span>
            </div>
            <div className="stat-item">
              <strong>Comments</strong>
              <span>{media.comments_count || 0}</span>
            </div>
          </div>
          <div className="date-container">
            <strong>Date:</strong>{" "}
            <span>
              {media.timestamp
                ? new Date(media.timestamp).toLocaleDateString()
                : "No date available"}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HashtagMediaCard;