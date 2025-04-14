import { cookies } from "../../../utils/cookie";

const BASE_URL = "https://localhost:7099";

const getToken = () => {
  let token = cookies.get("jwt-access");
  if (token) {
    token = token.replace(/"/g, "");
    return token;
  }
  throw new Error("Kimlik doğrulama jetonu eksik");
};

export const searchHashtag = async (userId, hashtagName, accessToken) => {
  const token = getToken();
  const payload = {
    user_id: userId,
    q: hashtagName,
    access_token: accessToken,
  };
  console.log("Sending payload to /api/Hashtag/searchHashtag:", payload);

  const response = await fetch(`${BASE_URL}/api/Hashtag/searchHashtag`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to search hashtag: ${errorText}`);
  }

  return response.json();
};

export const getRecentMedia = async (userId, hashtagId, accessToken) => {
  const token = getToken();
  const payload = {
    user_id: userId,
    hashtag_id: hashtagId,
    access_token: accessToken,
  };
  console.log("Sending payload to /api/Hashtag/getRecentMedia:", payload);

  const response = await fetch(`${BASE_URL}/api/Hashtag/getRecentMedia`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });

  console.log("Getting payload to /api/Hashtag/getRecentMedia:", response);

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to fetch recent media: ${errorText}`);
  }

  return response.json();
};

export const getTopMedia = async (userId, hashtagId, accessToken) => {
  const token = getToken();
  const payload = {
    user_id: userId,
    hashtag_id: hashtagId,
    access_token: accessToken,
  };
  console.log("Sending payload to /api/Hashtag/getTopMedia:", payload);

  const response = await fetch(`${BASE_URL}/api/Hashtag/getTopMedia`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });

  console.log("Getting payload to /api/Hashtag/getTopMedia:", response);

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to fetch top media: ${errorText}`);
  }

  return response.json();
};

export const getRecentSearchHashtags = async (userId, accessToken) => {
  const token = getToken();
  const payload = {
    user_id: userId,
    access_token: accessToken,
  };
  console.log("Sending payload to /api/Hashtag/recently-searched-hashtags:", payload);

  const response = await fetch(`${BASE_URL}/api/Hashtag/recently-searched-hashtags`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to fetch recent search hashtags: ${errorText}`);
  }

  return response.json();
};