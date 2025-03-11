export const publishStory = async (storyData) => {
    const response = await fetch("http://localhost:8000/api/publish-story", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(storyData),
    });
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(errorText);
    }
    return response.json();
  };

  // Fetch story insights
export const fetchStoryInsights = async (userId, mediaId, accessToken) => {
  const response = await fetch("https://localhost:7099/api/Post/get-media-insights", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
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
  const response = await fetch("https://localhost:7099/api/User/stories", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
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

