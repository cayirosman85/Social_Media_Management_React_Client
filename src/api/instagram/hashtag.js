export const searchHashtag = async (userId, hashtagName, accessToken) => {
    const payload = { 
      user_id: userId, 
      q: hashtagName, 
      access_token: accessToken 
    };
    console.log("Sending payload to /api/searchHashtag:", payload);
    const response = await fetch("http://localhost:8000/api/searchHashtag", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
  
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to search hashtag: ${errorText}`);
    }
  
    return response.json();
  };
  
  export const getRecentMedia = async (userId, hashtagId, accessToken) => {
    const payload = { 
      user_id: userId, 
      hashtag_id: hashtagId, 
      access_token: accessToken 
    };
    console.log("Sending payload to /api/getRecentMedia:", payload);
    const response = await fetch("http://localhost:8000/api/getRecentMedia", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
  
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to fetch recent media: ${errorText}`);
    }
  
    return response.json();
  };
  
  export const getTopMedia = async (userId, hashtagId, accessToken) => {
    const payload = { 
      user_id: userId, 
      hashtag_id: hashtagId, 
      access_token: accessToken 
    };
    console.log("Sending payload to /api/getTopMedia:", payload);
    const response = await fetch("http://localhost:8000/api/getTopMedia", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
  
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to fetch top media: ${errorText}`);
    }
  
    return response.json();
  };