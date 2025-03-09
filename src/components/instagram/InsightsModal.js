import React from "react";

const InsightsModal = ({ isOpen, onClose, insights, postId, mediaType }) => {
  if (!isOpen) return null;

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: "rgba(0, 0, 0, 0.5)",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        zIndex: 1000,
      }}
      onClick={onClose} // Close when clicking outside
    >
      <div
        style={{
          backgroundColor: "#fff",
          padding: "20px",
          borderRadius: "8px",
          width: "400px",
          maxHeight: "80vh",
          overflowY: "auto",
          position: "relative",
        }}
        onClick={(e) => e.stopPropagation()} // Prevent closing when clicking inside
      >
        <button
          onClick={onClose}
          style={{
            position: "absolute",
            top: "10px",
            right: "10px",
            background: "none",
            border: "none",
            fontSize: "20px",
            cursor: "pointer",
          }}
        >
          ×
        </button>
        <h3>Insights for Post {postId}</h3>
        {insights && insights.length > 0 ? (
          <ul style={{ listStyle: "none", padding: "0" }}>
            {insights.map((insight, index) => (
              <li key={index} style={{ marginBottom: "10px" }}>
                <strong>{insight.title || "Unknown"}:</strong>{" "}
                {insight.values[0]?.value || 0}
                <br />
                <small style={{ color: "#8e8e8e" }}>
                  {insight.description || "No description"}
                </small>
              </li>
            ))}
          </ul>
        ) : (
          <p>No insights available.</p>
        )}
      </div>
    </div>
  );
};

export default InsightsModal;