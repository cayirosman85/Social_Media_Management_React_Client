import React from "react";
import "./HashtagSearchForm.css";


const HashtagSearchForm = ({ hashtagName, setHashtagName, handleSearch, isLoading }) => {
  return (
    <div className="search-form">
      <input
        type="text"
        value={hashtagName}
        onChange={(e) => setHashtagName(e.target.value)}
        placeholder="Enter hashtag (e.g., nature)"
        className="search-input"
      />
      <button
        type="button"
        onClick={handleSearch}
        disabled={isLoading}
        className="search-button"
      >
        {isLoading ? "Searching..." : "Search"}
      </button>
    </div>
  );
};

export default HashtagSearchForm;