import React from "react";
import "./HashtagRecentSearches.css";

const RecentSearchesSection = ({ recentSearches, onSearchClick, isLoading }) => {
  if (isLoading) {
    return (
      <div className="recent-searches">
        <div className="loader-container">
          <div className="loader">
            <div className="spinner"></div>
            <span>Loading...</span>
          </div>
        </div>
      </div>
    );
  }

  if (!recentSearches.length) return null;

  return (
    <div className="recent-searches">
      <h3 className="recent-searches-title">Recent Searches</h3>
      <div className="recent-searches-list">
        {recentSearches.map((search, index) => (
          <button
            key={index}
            className="recent-search-item"
            onClick={() => onSearchClick(search)}
          >
            #{search.name}
          </button>
        ))}
      </div>
    </div>
  );
};

export default RecentSearchesSection;