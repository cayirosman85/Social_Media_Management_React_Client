export const publishPost = async (postData) => {
    const response = await fetch("http://localhost:8000/api/publish-post", {
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
    const response = await fetch("http://localhost:8000/api/comment-visibility", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ user_id: userId, comment_id: commentId, access_token: accessToken, hide }),
    });
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to toggle comment visibility: ${errorText}`);
    }
    return response.json();
  };
  
  export const deleteComment = async (userId, commentId, accessToken) => {
    const response = await fetch("http://localhost:8000/api/delete-comment", {
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
    const response = await fetch("http://localhost:8000/api/create-comment", {
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
    const response = await fetch("http://localhost:8000/api/create-reply", {
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

  export const getUserPosts = async (userId, username, accessToken, limit = 5, after = null) => {
    const response = await fetch("http://localhost:8000/api/get-user-posts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ user_id: userId, username, access_token: accessToken, limit, after }),
    });
  
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to fetch user posts: ${errorText}`);
    }
  
    return response.json();
  };

  // Fetch Instagram user data
export const fetchInstagramData = async (userId, username, accessToken) => {
  const response = await fetch(
    `http://localhost:8000/api/get-profile?user_id=${encodeURIComponent(userId)}&username=${encodeURIComponent(username)}&access_token=${encodeURIComponent(accessToken)}&fields=media{media_type,media_url,children{media_type,media_url},media_product_type,like_count,comments_count},stories,tags`
  );
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`HTTP error! Status: ${response.status}, Response: ${errorText}`);
  }
  return response.json();
};

export const getMediaInsights = async (userId, mediaId, accessToken, mediaType) => {
  const response = await fetch("http://localhost:8000/api/get-media-insights", {
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
