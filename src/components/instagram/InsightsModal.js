import React from "react";
import "./InsightsModal.css";

const InsightsModal = ({ isOpen, onClose, insights, postId, mediaType, errorMessage, isLoading }) => {
  if (!isOpen) return null;

  // Extract the data array from the insights object
  const insightData = insights?.data || [];

  return (
    <div className="insights-modal" onClick={onClose}>
      <div className="insights-modal-content" onClick={(e) => e.stopPropagation()}>
        <button className="insights-modal-close" onClick={onClose}>
          ×
        </button>
        <div className="insights-modal-header">
          <h3 className="insights-modal-title">Insights</h3>
        </div>
        {isLoading ? (
          <div className="insights-modal-loading">Loading...</div>
        ) : errorMessage ? (
          <p className="insights-modal-error">{errorMessage}</p>
        ) : insightData.length > 0 ? (
          <ul className="insights-modal-list">
            {insightData.map((insight, index) => (
              <li key={index} className="insights-modal-item">
                <strong>{insight.title || insight.name || "Unknown"}:</strong>{" "}
                <span className="insights-modal-value">
                  {insight.values[0]?.value || 0} (Latest: {insight.values[1]?.value || 0})
                </span>
                <small className="insights-modal-description">
                  {insight.description || "No description available"}
                </small>
              </li>
            ))}
          </ul>
        ) : (
          <p className="insights-modal-empty">No insights available for this post.</p>
        )}
      </div>
    </div>
  );
};

export default InsightsModal;