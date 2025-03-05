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