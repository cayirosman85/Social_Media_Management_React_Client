import React from "react";

const AdManager = () => {
  return (
    <div className="ad-manager">
      <h2>Manage Ads</h2>
      <p>Boost posts or create ad campaigns for Instagram and Twitter here.</p>
      <button onClick={() => alert("Ad creation functionality to be implemented")}>Create Ad</button>
    </div>
  );
};

export default AdManager;