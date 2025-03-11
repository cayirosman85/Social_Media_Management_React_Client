import React from "react";
import "./HashtagInfo.css";
const HashtagInfo = ({ hashtagName, hashtagId }) => {
  return (
    <div className="hashtag-info">
      <p>Hashtag: #{hashtagName}</p>
      <p>ID: {hashtagId}</p>
    </div>
  );
};

export default HashtagInfo;