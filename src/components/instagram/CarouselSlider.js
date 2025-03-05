import React, { useState } from "react";
import "./CarouselSlider.css";

const CarouselSlider = ({ media }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const children = media.children?.data || [];

  const nextSlide = () => {
    setCurrentIndex((prev) => (prev + 1) % (children.length || 1));
  };

  const prevSlide = () => {
    setCurrentIndex((prev) => (prev - 1 + (children.length || 1)) % (children.length || 1));
  };

  if (!children.length) {
    return (
      <div className="carousel-slider">
        <img src={media.media_url} alt="Carousel Fallback" className="media-img" />
      </div>
    );
  }

  const currentChild = children[currentIndex];

  return (
    <div className="carousel-slider">
      <button className="carousel-btn prev" onClick={prevSlide}>❮</button>
      {currentChild.media_type === "IMAGE" ? (
        <img src={currentChild.media_url} alt="Carousel Item" className="media-img" />
      ) : currentChild.media_type === "VIDEO" ? (
        <video src={currentChild.media_url} className="media-img" controls muted />
      ) : null}
      <button className="carousel-btn next" onClick={nextSlide}>❯</button>
      <div className="carousel-dots">
        {children.map((_, index) => (
          <span
            key={index}
            className={`dot ${index === currentIndex ? "active" : ""}`}
            onClick={() => setCurrentIndex(index)}
          />
        ))}
      </div>
    </div>
  );
};

export default CarouselSlider;