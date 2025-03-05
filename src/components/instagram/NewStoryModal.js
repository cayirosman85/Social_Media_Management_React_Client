import React, { useState } from "react";

const NewStoryModal = ({ onClose, onStorySuccess, fetchInstagramData }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleNewStorySubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    const formData = new FormData(e.target);
    const mediaFile = formData.get("mediaFile");
    const mediaUrl = formData.get("mediaUrl")?.trim();

    try {
      let storyData = {
        user_id: "17841473036355290",
        access_token: "EAAZAde8LZA8zIBO6PGvN672KLJ8x0dBFwrlXnicLFSwhMXSBVepQZBMlVJlAcM1Ul8mfcDqBx0QggGCE1LruXvApOiyNidYdC0hlLsuoz8m33FD3PDkDFqyzfSEVCO55gL3ZB3lQe1Q9AKq1omGkZCvES7Q9j5qv0g4tAem52QzFr0fBwMr4mjUUWB0y1GHjjpwZDZD",
      };

      if (!mediaFile && !mediaUrl) {
        throw new Error("Please provide either a media file or a media URL.");
      }

      let finalIsImage, finalIsVideo;
      if (mediaUrl) {
        const urlExtension = mediaUrl.split(".").pop().toLowerCase();
        finalIsImage = ["jpg", "jpeg"].includes(urlExtension);
        finalIsVideo = ["mp4", "mov"].includes(urlExtension);

        if (!finalIsImage && !finalIsVideo) {
          throw new Error("Unsupported URL media type. Use JPG/JPEG for images or MP4/MOV for videos.");
        }

        if (finalIsImage) storyData.image_url = mediaUrl;
        else if (finalIsVideo) storyData.video_url = mediaUrl;
      } else if (mediaFile) {
        const fileExtension = mediaFile.name.split(".").pop().toLowerCase();
        const isImageUpload = ["jpg", "jpeg"].includes(fileExtension);
        const isVideoUpload = ["mp4", "mov"].includes(fileExtension);

        if (!isImageUpload && !isVideoUpload) {
          throw new Error("Unsupported file type. Use JPG/JPEG for images or MP4/MOV for videos.");
        }

        const fileSizeMB = mediaFile.size / (1024 * 1024);
        if (isImageUpload && fileSizeMB > 8) {
          throw new Error(`Image file size exceeds 8 MB limit: ${fileSizeMB.toFixed(2)} MB`);
        }
        if (isVideoUpload && fileSizeMB > 4 * 1024) {
          throw new Error(`Video file size exceeds 4 GB limit: ${(fileSizeMB / 1024).toFixed(2)} GB`);
        }

        const validateMediaDimensions = (file) => {
          return new Promise((resolve, reject) => {
            if (isImageUpload) {
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
            } else if (isVideoUpload) {
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

        await validateMediaDimensions(mediaFile);

        const uploadFormData = new FormData();
        uploadFormData.append("mediaFile", mediaFile);
        const uploadResponse = await fetch("http://localhost:8000/api/upload", {
          method: "POST",
          body: uploadFormData,
        });

        if (!uploadResponse.ok) {
          const errorText = await uploadResponse.text();
          throw new Error(`Failed to upload media: ${errorText}`);
        }
        const uploadData = await uploadResponse.json();
        if (!uploadData.success) throw new Error(uploadData.error);

        const url = uploadData.url;
        const finalExtension = url.split(".").pop().toLowerCase();
        finalIsImage = ["jpg", "jpeg"].includes(finalExtension);
        finalIsVideo = ["mp4", "mov"].includes(finalExtension);

        if (finalIsImage) storyData.image_url = url;
        else if (finalIsVideo) storyData.video_url = url;
      }

      console.log("Sending story data:", storyData);

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
      let errorMessage = "An error occurred while publishing your story.";
      try {
        const errorObj = JSON.parse(error.message);
        if (errorObj.error) {
          errorMessage = `${errorObj.error}${errorObj.error_user_msg ? ": " + errorObj.error_user_msg : ""}`;
        }
      } catch (parseError) {
        errorMessage = error.message || errorMessage;
      }
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100%",
        height: "100%",
        background: "rgba(0, 0, 0, 0.75)",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        zIndex: 1000,
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: "white",
          width: "90%",
          maxWidth: "500px",
          borderRadius: "12px",
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
          boxSizing: "border-box",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          style={{
            padding: "20px",
            borderBottom: "1px solid #dbdbdb",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <h2 style={{ fontSize: "16px", fontWeight: "600", color: "#262626" }}>
            Create New Story
          </h2>
          <span
            style={{
              fontSize: "24px",
              color: "#262626",
              cursor: "pointer",
            }}
            onClick={onClose}
          >
            ×
          </span>
        </div>
        <form style={{ padding: "20px" }} onSubmit={handleNewStorySubmit}>
          <div style={{ marginBottom: "15px" }}>
            <label style={{ display: "block", marginBottom: "5px", fontSize: "14px", color: "#262626" }}>
              Media File (Image or Video)
            </label>
            <input
              type="file"
              name="mediaFile"
              accept="image/jpeg,video/mp4,video/quicktime"
              style={{
                width: "100%",
                padding: "8px",
                border: "1px solid #dbdbdb",
                borderRadius: "4px",
                fontSize: "14px",
              }}
            />
            <small style={{ color: "#666", fontSize: "12px" }}>
              Upload a single JPG/JPEG image or MP4/MOV video (recommended 9:16 aspect ratio).
            </small>
          </div>
          <div style={{ marginBottom: "15px" }}>
            <label style={{ display: "block", marginBottom: "5px", fontSize: "14px", color: "#262626" }}>
              Or Enter Media URL
            </label>
            <input
              type="text"
              name="mediaUrl"
              placeholder="https://example.com/story.jpg"
              style={{
                width: "100%",
                padding: "8px",
                border: "1px solid #dbdbdb",
                borderRadius: "4px",
                fontSize: "14px",
              }}
            />
            <small style={{ color: "#666", fontSize: "12px" }}>
              Enter a single URL for an image (JPG/JPEG) or video (MP4/MOV).
            </small>
          </div>
          {error && <div style={{ color: "red", marginBottom: "15px" }}>{error}</div>}
          <button
            type="submit"
            disabled={isLoading}
            style={{
              background: "#0095f6",
              color: "white",
              padding: "8px 16px",
              border: "none",
              borderRadius: "4px",
              fontWeight: "600",
              fontSize: "14px",
              cursor: isLoading ? "not-allowed" : "pointer",
              width: "100%",
              opacity: isLoading ? 0.7 : 1,
            }}
          >
            {isLoading ? "Publishing..." : "Share Story"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default NewStoryModal;