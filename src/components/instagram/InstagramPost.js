import React from "react";
import CarouselSlider from "./CarouselSlider";
import "./InstagramPost.css";

const InstagramPost = ({ post, onClick }) => {
  return (
    <div
      className="media-item"
      onClick={onClick}
      role="button"
      tabIndex={0}
      aria-label={`View post with ${post.like_count} likes and ${post.comments_count} comments`}
    >
      <div className="media-content">
        {post.media_type === "IMAGE" ? (
          <img
            src={post.media_url}
            alt={`Post image`}
            className="media-img"
            loading="lazy"
          />
        ) : post.media_type === "VIDEO" ? (
          <video
            src={post.media_url}
            className="media-img"
            muted
            loading="lazy"
            controls
          />
        ) : post.media_type === "CAROUSEL_ALBUM" ? (
          <CarouselSlider media={post} />
        ) : null}
        <div className="media-type-icon">
          {post.media_type === "IMAGE" && (
            <svg
              aria-label="Image"
              className="media-icon"
              fill="currentColor"
              height="14"
              role="img"
              viewBox="0 0 24 24"
              width="14"
            >
              <title>Image</title>
              <rect
                fill="none"
                height="18"
                stroke="currentColor"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                width="18"
                x="3"
                y="3"
              />
              <circle cx="5.5" cy="5.5" r="1" fill="currentColor" />
              <path
                d="M3 16l5-5 5 5 5-5 3 3"
                fill="none"
                stroke="currentColor"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
              />
            </svg>
          )}
          {post.media_type === "VIDEO" && (
            <svg
              aria-label="Reel"
              className="media-icon"
              fill="currentColor"
              height="14"
              role="img"
              viewBox="0 0 24 24"
              width="14"
            >
              <title>Reel</title>
              <line
                fill="none"
                stroke="currentColor"
                strokeLinejoin="round"
                strokeWidth="2"
                x1="2.049"
                x2="21.95"
                y1="7.002"
                y2="7.002"
              />
              <line
                fill="none"
                stroke="currentColor"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                x1="13.504"
                x2="16.362"
                y1="2.001"
                y2="7.002"
              />
              <line
                fill="none"
                stroke="currentColor"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                x1="7.207"
                x2="10.002"
                y1="2.11"
                y2="7.002"
              />
              <path
                d="M2 12.001v3.449c0 2.849.698 4.006 1.606 4.945.94.908 2.098 1.607 4.946 1.607h6.896c2.848 0 4.006-.699 4.946-1.607.908-.939 1.606-2.096 1.606-4.945V8.552c0-2.848-.698-4.006-1.606-4.945C19.454 2.699 18.296 2 15.448 2H8.552c-2.848 0-4.006.699-4.946 1.607C2.698 4.546 2 5.704 2 8.552Z"
                fill="none"
                stroke="currentColor"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
              />
              <path
                d="M9.763 17.664a.908.908 0 0 1-.454-.787V11.63a.909.909 0 0 1 1.364-.788l4.545 2.624a.909.909 0 0 1 0 1.575l-4.545 2.624a.91.91 0 0 1-.91 0Z"
                fillRule="evenodd"
              />
            </svg>
          )}
          {post.media_type === "CAROUSEL_ALBUM" && (
            <svg
              aria-label="Carousel"
              className="media-icon"
              fill="currentColor"
              height="14"
              role="img"
              viewBox="0 0 24 24"
              width="14"
            >
              <title>Carousel</title>
              <rect
                fill="none"
                height="18"
                stroke="currentColor"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                width="18"
                x="3"
                y="3"
              />
              <path
                d="M18 3v18l3-3V6z"
                fill="none"
                stroke="currentColor"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
              />
            </svg>
          )}
        </div>
        <div className="media-overlay">
          <span className="overlay-icon">
            <svg
              aria-label="Like"
              className="overlay-icon-svg"
              fill="currentColor"
              height="14"
              role="img"
              viewBox="0 0 24 24"
              width="14"
            >
              <title>Like</title>
              <path d="M16.792 3.904A4.989 4.989 0 0 1 21.5 9.122c0 3.072-2.652 4.959-5.197 7.222-2.512 2.243-3.865 3.469-4.303 3.752-.477-.309-2.143-1.823-4.303-3.752C5.141 14.072 2.5 12.167 2.5 9.122a4.989 4.989 0 0 1 4.708-5.218 4.21 4.21 0 0 1 3.675 1.941c.84 1.175.98 1.763 1.12 1.763s.278-.588 1.11-1.766a4.17 4.17 0 0 1 3.679-1.938m0-2a6.04 6.04 0 0 0-4.797 2.127 6.052 6.052 0 0 0-4.787-2.127A6.985 6.985 0 0 0 .5 9.122c0 3.61 2.55 5.827 5.015 7.97.283.246.569.494.853.747l1.027.918a44.998 44.998 0 0 0 3.518 3.018 2 2 0 0 0 2.174 0 45.263 45.263 0 0 0 3.626-3.115l.922-.824c.293-.26.59-.519.885-.774 2.334-2.025 4.98-4.32 4.98-7.94a6.985 6.985 0 0 0-6.708-7.218Z" />
            </svg>
            {post.like_count || 0}
          </span>
          <span className="overlay-icon">
            <svg
              aria-label="Comment"
              className="overlay-icon-svg"
              fill="currentColor"
              height="14"
              role="img"
              viewBox="0 0 24 24"
              width="14"
            >
              <title>Comment</title>
              <path
                d="M20.656 17.008a9.993 9.993 0 1 0-3.59 3.615L22 22Z"
                fill="none"
                stroke="currentColor"
                strokeLinejoin="round"
                strokeWidth="2"
              />
            </svg>
            {post.comments_count || 0}
          </span>
        </div>
      </div>
    </div>
  );
};

export default InstagramPost;