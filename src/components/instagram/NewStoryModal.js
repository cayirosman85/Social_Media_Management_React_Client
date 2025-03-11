import React, { useState, useEffect } from "react";
import "./NewStoryModal.css"; // We'll align this with NewPostModal.css

const NewStoryModal = ({ onClose, onStorySuccess, fetchInstagramData }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [mediaPreviews, setMediaPreviews] = useState([]); // Store media previews
  const [mediaUrl, setMediaUrl] = useState(""); // Single media URL for stories

  // Handle file input changes and generate previews
  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    if (files.length > 1) {
      setError("Stories support only one media file.");
      setMediaPreviews([]);
      return;
    }
    const file = files[0];
    const previews = file
      ? [{
          url: URL.createObjectURL(file),
          type: file.type.startsWith("image/") ? "IMAGE" : "VIDEO",
        }]
      : [];
    setMediaPreviews(previews);
    setMediaUrl(""); // Clear media URL if file is selected
  };

  // Handle media URL input change
  const handleMediaUrlChange = (e) => {
    const url = e.target.value.trim();
    setMediaUrl(url);
    setMediaPreviews(url ? [{ url, type: url.match(/\.(jpg|jpeg)$/i) ? "IMAGE" : "VIDEO" }] : []);
  };

  // Handle form submission
  const handleNewStorySubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const formData = new FormData(e.target);
      const mediaFiles = formData.getAll("mediaFiles");
      const mediaUrlInput = formData.get("mediaUrl")?.trim();

      const hasFiles = mediaFiles && mediaFiles.length > 0 && mediaFiles[0].size > 0;
      const hasUrl = mediaUrlInput && mediaUrlInput.length > 0;

      if (hasFiles && hasUrl) {
        throw new Error("Please provide either a media file or a URL, not both.");
      }

      if (!hasFiles && !hasUrl) {
        throw new Error("Please provide either a media file or a URL.");
      }

      let storyData = {
        user_id: "17841473036355290",
        access_token:
          "EAAZAde8LZA8zIBO6PGvN672KLJ8x0dBFwrlXnicLFSwhMXSBVepQZBMlVJlAcM1Ul8mfcDqBx0QggGCE1LruXvApOiyNidYdC0hlLsuoz8m33FD3PDkDFqyzfSEVCO55gL3ZB3lQe1Q9AKq1omGkZCvES7Q9j5qv0g4tAem52QzFr0fBwMr4mjUUWB0y1GHjjpwZDZD",
      };

      if (hasFiles) {
        const file = mediaFiles[0];
        const fileExtension = file.name.split(".").pop().toLowerCase();
        const isImage = ["jpg", "jpeg"].includes(fileExtension);
        const isVideo = ["mp4", "mov"].includes(fileExtension);

        if (!isImage && !isVideo) {
          throw new Error("Unsupported file type. Use JPG/JPEG for images or MP4/MOV for videos.");
        }

        const fileSizeMB = file.size / (1024 * 1024);
        if (isImage && fileSizeMB > 8) {
          throw new Error(`Image file size exceeds 8 MB limit: ${fileSizeMB.toFixed(2)} MB`);
        }
        if (isVideo && fileSizeMB > 4 * 1024) {
          throw new Error(`Video file size exceeds 4 GB limit: ${(fileSizeMB / 1024).toFixed(2)} GB`);
        }

        const validateMediaDimensions = (file) => {
          return new Promise((resolve, reject) => {
            if (isImage) {
              const img = new Image();
              img.onload = () => {
                const width = img.width;
                const height = img.height;
                const aspectRatio = width / height;

                if (width < 320 || width > 1080) {
                  reject(new Error(`Story image width must be between 320px and 1080px, got: ${width}px`));
                }
                if (aspectRatio < 0.5625 || aspectRatio > 1.91) {
                  reject(new Error(`Story image aspect ratio must be between 0.5625 (9:16) and 1.91 (1.91:1), got: ${aspectRatio.toFixed(2)}`));
                }
                resolve();
              };
              img.onerror = () => reject(new Error("Failed to load image for validation"));
              img.src = URL.createObjectURL(file);
            } else if (isVideo) {
              const video = document.createElement("video");
              video.onloadedmetadata = () => {
                const width = video.videoWidth;
                const height = video.videoHeight;
                const aspectRatio = width / height;

                if (width < 320 || width > 1080) {
                  reject(new Error(`Story video width must be between 320px and 1080px, got: ${width}px`));
                }
                if (aspectRatio < 0.5625 || aspectRatio > 1.91) {
                  reject(new Error(`Story video aspect ratio must be between 0.5625 (9:16) and 1.91 (1.91:1), got: ${aspectRatio.toFixed(2)}`));
                }
                resolve();
              };
              video.onerror = () => reject(new Error("Failed to load video for validation"));
              video.src = URL.createObjectURL(file);
            }
          });
        };

        await validateMediaDimensions(file);

        const uploadFormData = new FormData();
        uploadFormData.append("mediaFile", file);
        const uploadResponse = await fetch("http://localhost:8000/api/upload", {
          method: "POST",
          body: uploadFormData,
        });

        if (!uploadResponse.ok) throw new Error("Failed to upload media");
        const uploadData = await uploadResponse.json();
        if (!uploadData.success) throw new Error(uploadData.error);

        const url = uploadData.url;
        if (isImage) storyData.image_url = url;
        else if (isVideo) storyData.video_url = url;
      } else if (hasUrl) {
        const urlExtension = mediaUrlInput.split(".").pop().toLowerCase();
        const isImage = ["jpg", "jpeg"].includes(urlExtension);
        const isVideo = ["mp4", "mov"].includes(urlExtension);

        if (!isImage && !isVideo) {
          throw new Error("Unsupported URL media type. Use JPG/JPEG for images or MP4/MOV for videos.");
        }

        if (isImage) storyData.image_url = mediaUrlInput;
        else if (isVideo) storyData.video_url = mediaUrlInput;
      }

      const publishResponse = await fetch("http://localhost:8000/api/publish-story", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(storyData),
      });

      if (!publishResponse.ok) {
        const errorText = await publishResponse.text();
        throw new Error(errorText);
      }

      const publishData = await publishResponse.json();
      if (publishData.success) {
        if (fetchInstagramData) {
          const updatedData = await fetchInstagramData(
            "17841473036355290",
            "osmancayir73",
            "EAAZAde8LZA8zIBO4O8QsOQmyMMMShi79cCZBMRJZCjbSbXG7Y3ZAQ4OGvJN1vi8LYLeNx6K9pbxpFuU2saC3lWWt43za1ggpCu9YONtmCuwucaWVgtYYqRcG2oMtuHPhxq6x4n3ImiE3TzXf4IzMHxMtuDbwNfT52ZA6yjkwWabhrLZCrb7zqWzdkjZBApQJmNntUgZDZD"
          );
          onStorySuccess(updatedData);
        }
        alert("Story published successfully!");
        onClose();
      } else {
        throw new Error(publishData.error || "Unknown error");
      }
    } catch (error) {
      console.error("Error publishing story:", error);
      setError(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="new-story-modal" onClick={onClose}>
      <div className="new-story-modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="new-story-modal-header">
          <h2 className="new-story-modal-title">Create New Story</h2>
          <span className="new-story-modal-close" onClick={onClose}>
            ×
          </span>
        </div>
        <form className="new-story-modal-form" onSubmit={handleNewStorySubmit}>
          <div className="new-story-modal-field">
            <label className="new-story-modal-label">Media File (Image or Video)</label>
            <input
              type="file"
              name="mediaFiles"
              accept="image/jpeg,video/mp4,video/quicktime"
              className="new-story-modal-file"
              onChange={handleFileChange}
            />
            <small className="new-story-modal-note">
              Upload a single JPG/JPEG image or MP4/MOV video (recommended 9:16 aspect ratio).
            </small>
          </div>

          {/* Media Preview Section */}
          {mediaPreviews.length > 0 && (
            <div className="new-story-modal-preview">
              {mediaPreviews.map((preview, index) => (
                <div key={index} className="new-story-modal-preview-item">
                  {preview.type === "IMAGE" ? (
                    <img
                      src={preview.url}
                      alt={`Preview ${index + 1}`}
                      className="new-story-modal-preview-media"
                    />
                  ) : (
                    <video
                      src={preview.url}
                      className="new-story-modal-preview-media"
                      muted
                      controls
                    />
                  )}
                </div>
              ))}
            </div>
          )}

          <div className="new-story-modal-field">
            <label className="new-story-modal-label">Or Enter Media URL</label>
            <input
              type="text"
              name="mediaUrl"
              placeholder="https://example.com/story.jpg"
              className="new-story-modal-input"
              value={mediaUrl}
              onChange={handleMediaUrlChange}
            />
            <small className="new-story-modal-note">
              Enter a single URL for an image (JPG/JPEG) or video (MP4/MOV).
            </small>
          </div>

          {error && <div className="new-story-modal-error">{error}</div>}
          <button
            type="submit"
            disabled={isLoading}
            className="new-story-modal-submit"
          >
            {isLoading ? "Publishing..." : "Post"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default NewStoryModal;