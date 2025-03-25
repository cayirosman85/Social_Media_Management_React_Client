export const getAdAccounts = async (userId, accessToken) => {
  const response = await fetch("https://localhost:7099/api/Ads/ad-accounts", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ user_id: userId, access_token: accessToken }),
  });
  if (!response.ok) throw new Error(await response.text());
  return response.json();
};

export const createCampaign = async (adAccountId, accessToken, name, objective) => {
  const response = await fetch("https://localhost:7099/api/Ads/create-campaign", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ad_account_id: adAccountId, access_token: accessToken, name, objective }),
  });
  if (!response.ok) throw new Error(await response.text());
  return response.json();
};

export const createAdSet = async (adAccountId, accessToken, campaignId, name,  objective) => {
  const response = await fetch("https://localhost:7099/api/Ads/create-ad-set", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ad_account_id: adAccountId, access_token: accessToken, campaign_id: campaignId, name,  objective }),
  });
  if (!response.ok) throw new Error(await response.text());
  return response.json();
};

export const createAdWithExistingPost = async (adAccountId, accessToken, adSetId, name, instagramPostId, instagramAccountId) => {
  const response = await fetch("https://localhost:7099/api/Ads/create-ad-existing", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ 
      ad_account_id: adAccountId, 
      access_token: accessToken, 
      ad_set_id: adSetId, 
      name, 
      instagram_post_id: instagramPostId,
      instagram_account_id: instagramAccountId
    }),
  });
  if (!response.ok) throw new Error(await response.text());
  return response.json();
};

export const createAdWithNewCreative = async (adAccountId, accessToken, adSetId, name, link, message, pageId, instagramAccountId) => {
  const response = await fetch("https://localhost:7099/api/Ads/create-ad-new", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ 
      ad_account_id: adAccountId, 
      access_token: accessToken, 
      ad_set_id: adSetId, 
      name, 
      link, 
      message, 
      page_id: pageId,
      instagram_account_id: instagramAccountId
    }),
  });
  if (!response.ok) throw new Error(await response.text());
  return response.json();
};

export const getAdInsights = async (adAccountId, accessToken, adId) => {
  const response = await fetch("https://localhost:7099/api/Ads/ad-insights", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ad_account_id: adAccountId, access_token: accessToken, ad_id: adId }),
  });
  if (!response.ok) throw new Error(await response.text());
  return response.json();
};

export const getCampaigns = async (adAccountId, accessToken) => {
  const response = await fetch("https://localhost:7099/api/Ads/campaigns", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ad_account_id: adAccountId, access_token: accessToken }),
  });
  if (!response.ok) throw new Error(await response.text());
  return response.json();
};

export const getAdSets = async (adAccountId, accessToken) => {
  const response = await fetch("https://localhost:7099/api/Ads/ad-sets", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ad_account_id: adAccountId, access_token: accessToken }),
  });
  if (!response.ok) throw new Error(await response.text());
  return response.json();
};

export const getAds = async (adAccountId, accessToken) => {
  const response = await fetch("https://localhost:7099/api/Ads/ads", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ad_account_id: adAccountId, access_token: accessToken }),
  });
  if (!response.ok) throw new Error(await response.text());
  return response.json();
};

export const deleteCampaign = async (adAccountId, accessToken, campaignId) => {
  const response = await fetch("https://localhost:7099/api/Ads/delete-campaign", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ad_account_id: adAccountId, access_token: accessToken, campaign_id: campaignId }),
  });
  if (!response.ok) throw new Error(await response.text());
  return response.json();
};

export const deleteAdSet = async (adAccountId, accessToken, adSetId) => {
  const response = await fetch("https://localhost:7099/api/Ads/delete-ad-set", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ad_account_id: adAccountId, access_token: accessToken, ad_set_id: adSetId }),
  });
  if (!response.ok) throw new Error(await response.text());
  return response.json();
};

export const deleteAd = async (adAccountId, accessToken, adId) => {
  const response = await fetch("https://localhost:7099/api/Ads/delete-ad", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ad_account_id: adAccountId, access_token: accessToken, ad_id: adId }),
  });
  if (!response.ok) throw new Error(await response.text());
  return response.json();
};

export const getInstagramPosts = async (userId, accessToken) => {
  const response = await fetch("https://localhost:7099/api/Ads/posts", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ user_id: userId, access_token: accessToken }),
  });
  if (!response.ok) throw new Error(await response.text());
  return response.json();
};

export const getInstagramAccountFromPage = async (pageId, accessToken) => {
  const response = await fetch("https://localhost:7099/api/Ads/instagram-account", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ page_id: pageId, access_token: accessToken }),
  });
  if (!response.ok) throw new Error(await response.text());
  return response.json();
};