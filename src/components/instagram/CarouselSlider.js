import React, { useState } from "react";
import "./CarouselSlider.css";

const CarouselSlider = ({ media }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const children = media?.children?.data || [];

  console.log("Media prop:", media);
  console.log("Children:", children);

  const nextSlide = () => {
    const safeLength = children.length || 1;
    setCurrentIndex((prev) => (prev + 1) % safeLength);
    console.log("Next slide, index:", (currentIndex + 1) % safeLength);
  };

  const prevSlide = () => {
    const safeLength = children.length || 1;
    setCurrentIndex((prev) => (prev - 1 + safeLength) % safeLength);
    console.log("Prev slide, index:", (currentIndex - 1 + safeLength) % safeLength);
  };

  if (!children.length) {
    console.warn("No children data, rendering fallback");
    return (
      <div className="carousel-slider">
        <img
          src={media?.media_url || "https://via.placeholder.com/400"}
          alt="Carousel Fallback"
          className="media-img"
        />
      </div>
    );
  }

  const currentChild = children[currentIndex];
  console.log("Current child:", currentChild);

  return (
    <div className="carousel-slider">
      <button className="carousel-btn prev" onClick={prevSlide}>
        ❮
      </button>
      {currentChild.media_type === "IMAGE" ? (
        <img
          src={currentChild.media_url}
          alt="Carousel Item"
          className="media-img"
        />
      ) : currentChild.media_type === "VIDEO" ? (
        <video
          src={currentChild.media_url}
          className="media-img"
          controls
          muted
        />
      ) : (
        <div className="media-img">
          Unsupported media type: {currentChild.media_type}
        </div>
      )}
      <button className="carousel-btn next" onClick={nextSlide}>
        ❯
      </button>
      <div className="carousel-dots">
        {children.map((_, index) => (
          <span
            key={index}
            className={`dot ${index === currentIndex ? "active" : ""}`}
            onClick={() => {
              console.log("Dot clicked, index:", index);
              setCurrentIndex(index);
            }}
          />
        ))}
      </div>
    </div>
  );
};

export default CarouselSlider;