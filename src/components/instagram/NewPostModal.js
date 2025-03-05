import React, { useState } from "react";
import { publishPost } from "../../services/instagram/instagramService"; // Adjust the path as needed

const NewPostModal = ({ onClose, onPostSuccess, fetchInstagramData }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleNewPostSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const formData = new FormData(e.target);
      const mediaFiles = formData.getAll("mediaFiles"); // Get all selected files
      const mediaUrls = formData.get("mediaUrls")?.trim();
      const caption = formData.get("caption")?.trim();

      let postData = {
        user_id: "17841473036355290",
        access_token: "EAAZAde8LZA8zIBO4O8QsOQmyMMMShi79cCZBMRJZCjbSbXG7Y3ZAQ4OGvJN1vi8LYLeNx6K9pbxpFuU2saC3lWWt43za1ggpCu9YONtmCuwucaWVgtYYqRcG2oMtuHPhxq6x4n3ImiE3TzXf4IzMHxMtuDbwNfT52ZA6yjkwWabhrLZCrb7zqWzdkjZBApQJmNntUgZDZD",
        caption,
      };

      if (mediaFiles && mediaFiles.length > 0 && mediaFiles[0].size > 0) {
        const formDataUpload = new FormData();
        mediaFiles.forEach((file) => formDataUpload.append("mediaFiles", file));

        const uploadResponse = await fetch("http://localhost:8000/api/upload", {
          method: "POST",
          body: formDataUpload,
        });

        if (!uploadResponse.ok) throw new Error("Failed to upload media");
        const uploadData = await uploadResponse.json();
        postData.image_url = uploadData.url; // For simplicity, using the first URL; adjust for multiple files if needed
      } else if (mediaUrls) {
        postData.image_url = mediaUrls.split(",")[0].trim(); // Taking the first URL for simplicity
      }

      // Use the publishPost service
      const result = await publishPost(postData);

      if (!result.success) {
        throw new Error(result.error || "Failed to publish post");
      }

      // Update Instagram data after successful post
      if (fetchInstagramData) {
        const updatedData = await fetchInstagramData(
          "17841473036355290",
          "osmancayir73",
          "EAAZAde8LZA8zIBO4O8QsOQmyMMMShi79cCZBMRJZCjbSbXG7Y3ZAQ4OGvJN1vi8LYLeNx6K9pbxpFuU2saC3lWWt43za1ggpCu9YONtmCuwucaWVgtYYqRcG2oMtuHPhxq6x4n3ImiE3TzXf4IzMHxMtuDbwNfT52ZA6yjkwWabhrLZCrb7zqWzdkjZBApQJmNntUgZDZD"
        );
        onPostSuccess(updatedData);
      }

      alert("Post published successfully!");
      onClose();
    } catch (error) {
      setError(error.message);
      console.error("Error publishing post:", error);
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
            Create New Post
          </h2>
          <span
            style={{ fontSize: "24px", color: "#262626", cursor: "pointer" }}
            onClick={onClose}
          >
            ×
          </span>
        </div>
        <form style={{ padding: "20px" }} onSubmit={handleNewPostSubmit}>
          <div style={{ marginBottom: "15px" }}>
            <label
              style={{
                display: "block",
                marginBottom: "5px",
                fontSize: "14px",
                color: "#262626",
              }}
            >
              Media Files (Images or Videos)
            </label>
            <input
              type="file"
              name="mediaFiles"
              accept="image/jpeg,video/mp4,video/quicktime"
              multiple
              style={{
                width: "100%",
                padding: "8px",
                border: "1px solid #dbdbdb",
                borderRadius: "4px",
                fontSize: "14px",
              }}
            />
            <small style={{ color: "#666", fontSize: "12px" }}>
              Select multiple files for a carousel (JPG/JPEG or MP4/MOV).
            </small>
          </div>
          <div style={{ marginBottom: "15px" }}>
            <label
              style={{
                display: "block",
                marginBottom: "5px",
                fontSize: "14px",
                color: "#262626",
              }}
            >
              Or Enter Media URLs (comma-separated)
            </label>
            <input
              type="text"
              name="mediaUrls"
              placeholder="https://example.com/media1.jpg, https://example.com/media2.mp4"
              style={{
                width: "100%",
                padding: "8px",
                border: "1px solid #dbdbdb",
                borderRadius: "4px",
                fontSize: "14px",
              }}
            />
            <small style={{ color: "#666", fontSize: "12px" }}>
              Enter multiple URLs separated by commas for a carousel
              (JPG/JPEG or MP4/MOV).
            </small>
          </div>
          <div style={{ marginBottom: "15px" }}>
            <label
              style={{
                display: "block",
                marginBottom: "5px",
                fontSize: "14px",
                color: "#262626",
              }}
            >
              Caption
            </label>
            <textarea
              name="caption"
              placeholder="Write a caption..."
              style={{
                width: "100%",
                padding: "8px",
                border: "1px solid #dbdbdb",
                borderRadius: "4px",
                fontSize: "14px",
                minHeight: "100px",
                resize: "vertical",
              }}
              required
            />
          </div>
          {error && (
            <div style={{ color: "red", marginBottom: "15px" }}>{error}</div>
          )}
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
            {isLoading ? "Publishing..." : "Post"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default NewPostModal;