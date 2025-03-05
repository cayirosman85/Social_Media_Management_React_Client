import React from "react";

const NewPostModal = ({ onSubmit, isLoading, onClose }) => {
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
          <h2 style={{ fontSize: "16px", fontWeight: "600", color: "#262626" }}>Create New Post</h2>
          <span
            style={{ fontSize: "24px", color: "#262626", cursor: "pointer" }}
            onClick={onClose}
          >
            ×
          </span>
        </div>
        <form style={{ padding: "20px" }} onSubmit={onSubmit}>
          <div style={{ marginBottom: "15px" }}>
            <label style={{ display: "block", marginBottom: "5px", fontSize: "14px", color: "#262626" }}>
              Media Files (Images or Videos)
            </label>
            <input
              type="file"
              name="mediaFiles"
              accept="image/jpeg,video/mp4,video/quicktime"
              multiple
              style={{ width: "100%", padding: "8px", border: "1px solid #dbdbdb", borderRadius: "4px", fontSize: "14px" }}
            />
            <small style={{ color: "#666", fontSize: "12px" }}>
              Select multiple files for a carousel (JPG/JPEG or MP4/MOV).
            </small>
          </div>
          <div style={{ marginBottom: "15px" }}>
            <label style={{ display: "block", marginBottom: "5px", fontSize: "14px", color: "#262626" }}>
              Or Enter Media URLs (comma-separated)
            </label>
            <input
              type="text"
              name="mediaUrls"
              placeholder="https://example.com/media1.jpg, https://example.com/media2.mp4"
              style={{ width: "100%", padding: "8px", border: "1px solid #dbdbdb", borderRadius: "4px", fontSize: "14px" }}
            />
            <small style={{ color: "#666", fontSize: "12px" }}>
              Enter multiple URLs separated by commas for a carousel (JPG/JPEG or MP4/MOV).
            </small>
          </div>
          <div style={{ marginBottom: "15px" }}>
            <label style={{ display: "block", marginBottom: "5px", fontSize: "14px", color: "#262626" }}>
              Caption
            </label>
            <textarea
              name="caption"
              placeholder="Write a caption..."
              style={{ width: "100%", padding: "8px", border: "1px solid #dbdbdb", borderRadius: "4px", fontSize: "14px", minHeight: "100px", resize: "vertical" }}
              required
            />
          </div>
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