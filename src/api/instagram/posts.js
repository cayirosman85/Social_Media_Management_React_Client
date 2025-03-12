export const publishPost = async (postData) => {
    const response = await fetch("https://localhost:7099/api/Post/publish-post", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(postData),
    });
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(errorText);
    }
    return response.json();
  };
  
  export const toggleCommentVisibility = async (userId, commentId, accessToken, hide) => {
    const response = await fetch("https://localhost:7099/api/Post/comment-visibility", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
            user_id: userId, 
            comment_id: commentId, 
            access_token: accessToken, 
            hide: hide
        }),
    });
    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to toggle comment visibility: ${errorText}`);
    }
    return response.json();
};
  export const deleteComment = async (userId, commentId, accessToken) => {
    const response = await fetch("https://localhost:7099/api/Post/delete-comment", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ user_id: userId, comment_id: commentId, access_token: accessToken }),
    });
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to delete comment: ${errorText}`);
    }
    return response.json();
  };
  
  export const createComment = async (userId, mediaId, accessToken, comment) => {
    const response = await fetch("https://localhost:7099/api/Post/create-comment", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ user_id: userId, media_id: mediaId, access_token: accessToken, comment }),
    });
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to create comment: ${errorText}`);
    }
    return response.json();
  };
  
  export const createReply = async (userId, commentId, accessToken, reply) => {
    const response = await fetch("https://localhost:7099/api/Post/create-reply", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ user_id: userId, comment_id: commentId, access_token: accessToken, reply }),
    });
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to create reply: ${errorText}`);
    }
    return response.json();
  };

  export const getUserPosts = async (userId, username, accessToken, limit = 5, cursor = null, direction = "after") => {
    const payload = {
      UserId: userId, // Match server-side PascalCase
      Username: username,
      AccessToken: accessToken,
      Limit: limit,
      After: direction === "after" ? cursor : null, // Only send After for "after" direction
      Before: direction === "before" ? cursor : null, // Only send Before for "before" direction
    };
  
    console.log("Sending payload to server:", payload); // Debug log
  
    const response = await fetch("https://localhost:7099/api/User/user-posts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
  
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to fetch user posts: ${errorText}`);
    }
  
    const data = await response.json();
    console.log("Server response:", data); // Debug log
    return data;
  };
  // Fetch Instagram user data
export const fetchInstagramData = async (userId, username, accessToken) => {
  

  const response = await fetch("https://localhost:7099/api/User/get-profile", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ user_id: userId, username, access_token: accessToken}),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`HTTP error! Status: ${response.status}, Response: ${errorText}`);
  }
  return response.json();
};


export const getMediaInsights = async (userId, mediaId, accessToken, mediaType) => {
  const response = await fetch("https://localhost:7099/api/Post/get-media-insights", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ user_id: userId, media_id: mediaId, access_token: accessToken, media_type: mediaType }),
  });

  if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to fetch media insights: ${errorText}`);
  }
  return response.json();
};
export const getProfileInsights = async (userId, accessToken, mediaType) => {
  const response = await fetch("https://localhost:7099/api/User/insights", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ user_id: userId, access_token: accessToken }),
  });

  if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to fetch media insights: ${errorText}`);
  }

  return response.json();
};