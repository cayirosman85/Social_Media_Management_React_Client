import { cookies } from "../../../utils/cookie";

const BASE_URL = "https://localhost:7099";

const getToken = () => {
  let token = cookies.get("jwt-access");
  console.log("Token from cookies:", token);
  if (token) {
    token = token.replace(/"/g, "");
    return token;
  }
  throw new Error("Kimlik doğrulama jetonu eksik");
};

export const publishPost = async (postData) => {
  console.log("Publishing post with data:", postData);
  const token = getToken();

  try {
    const response = await fetch(`${BASE_URL}/api/Post/publish-post`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(postData),
    });

    console.log("Response status:", response.status);
    console.log("Response headers:", response.headers.get("Content-Type"));

    const text = await response.text();
    console.log("Raw response:", text);

    let data;
    try {
      data = JSON.parse(text);
    } catch (parseError) {
      throw new Error(`Failed to parse response as JSON: ${text}`);
    }

    if (!response.ok) {
      throw new Error(data.error || `HTTP error! Status: ${response.status}`);
    }

    return data;
  } catch (error) {
    console.error("publishPost error:", error);
    throw error;
  }
};

export const toggleCommentVisibility = async (userId, commentId, accessToken, hide) => {
  const token = getToken();
  const response = await fetch(`${BASE_URL}/api/Post/comment-visibility`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      user_id: userId,
      comment_id: commentId,
      access_token: accessToken,
      hide,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to toggle comment visibility: ${errorText}`);
  }
  return response.json();
};

export const deleteComment = async (userId, commentId, accessToken) => {
  const token = getToken();
  const response = await fetch(`${BASE_URL}/api/Post/delete-comment`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ user_id: userId, comment_id: commentId, access_token: accessToken }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to delete comment: ${errorText}`);
  }
  return response.json();
};

export const createComment = async (userId, mediaId, accessToken, comment) => {
  const token = getToken();
  const response = await fetch(`${BASE_URL}/api/Post/create-comment`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ user_id: userId, media_id: mediaId, access_token: accessToken, comment }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to create comment: ${errorText}`);
  }
  return response.json();
};

export const createReply = async (userId, commentId, accessToken, reply) => {
  const token = getToken();
  const response = await fetch(`${BASE_URL}/api/Post/create-reply`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ user_id: userId, comment_id: commentId, access_token: accessToken, reply }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to create reply: ${errorText}`);
  }
  return response.json();
};

export const getUserPosts = async (userId, username, accessToken, limit = 5, cursor = null, direction = "after") => {
  const token = getToken();
  const payload = {
    UserId: userId,
    Username: username,
    AccessToken: accessToken,
    Limit: limit,
    After: direction === "after" ? cursor : null,
    Before: direction === "before" ? cursor : null,
  };

  console.log("Sending payload to server:", payload);

  const response = await fetch(`${BASE_URL}/api/User/user-posts`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to fetch user posts: ${errorText}`);
  }

  const data = await response.json();
  console.log("Server response:", data);
  return data;
};

export const fetchInstagramData = async (userId, username, accessToken) => {
  const token = getToken();
  const payload = {
    UserId: userId,
    Username: username,
    AccessToken: accessToken,
    ExcludeMedia: true,
  };

  console.log("Sending payload to get-profile:", payload);

  const response = await fetch(`${BASE_URL}/api/User/get-profile`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`HTTP error! Status: ${response.status}, Response: ${errorText}`);
  }

  const data = await response.json();
  console.log("Get-profile response:", data);
  return data;
};

export const getMediaInsights = async (userId, mediaId, accessToken, mediaType) => {
  const token = getToken();
  const response = await fetch(`${BASE_URL}/api/Post/get-media-insights`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ user_id: userId, media_id: mediaId, access_token: accessToken, media_type: mediaType }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to fetch media insights: ${errorText}`);
  }
  return response.json();
};

export const getProfileInsights = async (userId, accessToken, mediaType) => {
  const token = getToken();
  const response = await fetch(`${BASE_URL}/api/User/insights`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ user_id: userId, access_token: accessToken }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to fetch media insights: ${errorText}`);
  }

  return response.json();
};