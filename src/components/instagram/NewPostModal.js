import React, { useState } from "react";
import { publishPost } from "../../services/instagram/instagramService"; // Adjust the path as needed
import "./NewPostModal.css";

const NewPostModal = ({ onClose, onPostSuccess, fetchInstagramData }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [mediaPreviews, setMediaPreviews] = useState([]); // Store media previews

  // Handle file input changes and generate previews
  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    const previews = files.map((file) => ({
      url: URL.createObjectURL(file),
      type: file.type.startsWith("image/") ? "IMAGE" : "VIDEO",
    }));
    setMediaPreviews(previews);
  };

  // Handle form submission
  const handleNewPostSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const formData = new FormData(e.target);
      const mediaFiles = formData.getAll("mediaFiles"); // Get all selected files
      const mediaUrls = formData.get("mediaUrls")?.trim();
      const caption = formData.get("caption")?.trim();

      // Check if both mediaFiles and mediaUrls are provided
      const hasFiles = mediaFiles && mediaFiles.length > 0 && mediaFiles[0].size > 0;
      const hasUrls = mediaUrls && mediaUrls.length > 0;

      if (hasFiles && hasUrls) {
        throw new Error("Please provide either media files or URLs, not both.");
      }

      if (!hasFiles && !hasUrls) {
        throw new Error("Please provide either media files or URLs.");
      }

      let postData = {
        user_id: "17841473036355290",
        access_token:
          "EAAZAde8LZA8zIBO4O8QsOQmyMMMShi79cCZBMRJZCjbSbXG7Y3ZAQ4OGvJN1vi8LYLeNx6K9pbxpFuU2saC3lWWt43za1ggpCu9YONtmCuwucaWVgtYYqRcG2oMtuHPhxq6x4n3ImiE3TzXf4IzMHxMtuDbwNfT52ZA6yjkwWabhrLZCrb7zqWzdkjZBApQJmNntUgZDZD",
        caption,
      };

      if (hasFiles) {
        const formDataUpload = new FormData();
        mediaFiles.forEach((file) => formDataUpload.append("mediaFiles", file));

        const uploadResponse = await fetch("http://localhost:8000/api/upload", {
          method: "POST",
          body: formDataUpload,
        });

        if (!uploadResponse.ok) throw new Error("Failed to upload media");
        const uploadData = await uploadResponse.json();
        postData.image_url = uploadData.url; // For simplicity, using the first URL
      } else if (hasUrls) {
        postData.image_url = mediaUrls.split(",")[0].trim(); // Taking the first URL
      }

      const result = await publishPost(postData);

      if (!result.success) {
        throw new Error(result.error || "Failed to publish post");
      }

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
    <div className="new-post-modal" onClick={onClose}>
      <div className="new-post-modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="new-post-modal-header">
          <h2 className="new-post-modal-title">Create New Post</h2>
          <span className="new-post-modal-close" onClick={onClose}>
            ×
          </span>
        </div>
        <form className="new-post-modal-form" onSubmit={handleNewPostSubmit}>
          <div className="new-post-modal-field">
            <label className="new-post-modal-label">
              Media Files (Images or Videos)
            </label>
            <input
              type="file"
              name="mediaFiles"
              accept="image/jpeg,video/mp4,video/quicktime"
              multiple
              className="new-post-modal-file"
              onChange={handleFileChange}
            />
            <small className="new-post-modal-note">
              Select multiple files for a carousel (JPG/JPEG or MP4/MOV).
            </small>
          </div>

          {/* Media Preview Section */}
          {mediaPreviews.length > 0 && (
            <div className="new-post-modal-preview">
              {mediaPreviews.map((preview, index) => (
                <div key={index} className="new-post-modal-preview-item">
                  {preview.type === "IMAGE" ? (
                    <img
                      src={preview.url}
                      alt={`Preview ${index + 1}`}
                      className="new-post-modal-preview-media"
                    />
                  ) : (
                    <video
                      src={preview.url}
                      className="new-post-modal-preview-media"
                      muted
                      controls
                    />
                  )}
                </div>
              ))}
            </div>
          )}

          <div className="new-post-modal-field">
            <label className="new-post-modal-label">
              Or Enter Media URLs (comma-separated)
            </label>
            <input
              type="text"
              name="mediaUrls"
              placeholder="https://example.com/media1.jpg, https://example.com/media2.mp4"
              className="new-post-modal-input"
            />
            <small className="new-post-modal-note">
              Enter multiple URLs separated by commas for a carousel (JPG/JPEG or MP4/MOV).
            </small>
          </div>
          <div className="new-post-modal-field">
            <label className="new-post-modal-label">Caption</label>
            <textarea
              name="caption"
              placeholder="Write a caption..."
              className="new-post-modal-input"
              required
            />
          </div>
          {error && <div className="new-post-modal-error">{error}</div>}
          <button
            type="submit"
            disabled={isLoading}
            className="new-post-modal-submit"
          >
            {isLoading ? "Publishing..." : "Post"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default NewPostModal;