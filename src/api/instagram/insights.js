export const fetchStoryInsights = async (userId, mediaId, accessToken) => {
    const response = await fetch("http://localhost:8000/api/story-insights", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ user_id: userId, media_id: mediaId, access_token: accessToken }),
    });
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to fetch insights: ${errorText}`);
    }
    return response.json();
  };