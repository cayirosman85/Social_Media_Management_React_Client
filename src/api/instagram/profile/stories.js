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

export const publishStory = async (storyData) => {
  const token = getToken();
  const response = await fetch(`${BASE_URL}/api/Post/publish-story`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(storyData),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText);
  }

  return response.json();
};

export const fetchStoryInsights = async (userId, mediaId, accessToken) => {
  const token = getToken();
  const response = await fetch(`${BASE_URL}/api/Post/get-media-insights`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      user_id: userId,
      media_id: mediaId,
      media_type: "STORY",
      access_token: accessToken,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`HTTP error! Status: ${response.status}, Response: ${errorText}`);
  }

  return response.json(); // Expecting { success: true, insights: [...] }
};

export const fetchStories = async (userId, accessToken) => {
  const token = getToken();
  const response = await fetch(`${BASE_URL}/api/User/stories`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      user_id: userId,
      access_token: accessToken,
    }),
  });

  console.log("Raw response:", response);

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`HTTP error! Status: ${response.status}, Response: ${errorText}`);
  }

  const data = await response.json();
  console.log("Parsed stories data:", data);
  return data;
};