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