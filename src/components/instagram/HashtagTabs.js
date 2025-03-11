import React from "react";
import "./HashtagTabs.css";

const HashtagTabs = ({ activeTab, setActiveTab }) => {
  return (
    <div className="tabs-container">
      <button
        className={`tab-button ${activeTab === "recent" ? "active" : ""}`}
        onClick={() => setActiveTab("recent")}
      >
        Recent Media
      </button>
      <button
        className={`tab-button ${activeTab === "top" ? "active" : ""}`}
        onClick={() => setActiveTab("top")}
      >
        Top Media
      </button>
    </div>
  );
};

export default HashtagTabs;