import React, { useState, useEffect } from "react";
import localStorage from "local-storage";
import {
  getAdAccounts,
  createCampaign,
  createAdSet,
  createAdWithExistingPost,
  createAdWithNewCreative,
  getAdInsights,
  getCampaigns,
  getAdSets,
  getAds,
  deleteCampaign,
  deleteAdSet,
  deleteAd,
  getInstagramPosts,
  getInstagramAccountFromPage, // New import
} from "../../../api/instagram/profile/ads";

const AdsPage = () => {
  const [adAccounts, setAdAccounts] = useState([]);
  const [selectedAdAccount, setSelectedAdAccount] = useState("");
  const [campaigns, setCampaigns] = useState([]);
  const [adSets, setAdSets] = useState([]);
  const [ads, setAds] = useState([]);
  const [instagramPosts, setInstagramPosts] = useState([]);
  const [selectedPostId, setSelectedPostId] = useState("");
  const [instagramAccountId, setInstagramAccountId] = useState(""); // New state for Instagram account ID
  const [campaignName, setCampaignName] = useState("Test Campaign");
  const [campaignObjective, setCampaignObjective] = useState("OUTCOME_AWARENESS");
  const [adSetName, setAdSetName] = useState("Test Ad Set");
  const [adName, setAdName] = useState("Test Ad");
  const [newAdLink, setNewAdLink] = useState("https://myvoipcrm.com/uploads/gorev-takibi-b5f89bb1.jpg");
  const [newAdMessage, setNewAdMessage] = useState("Check this out!");
  const [insights, setInsights] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [adType, setAdType] = useState("existing"); // Set to "existing" for testing

  const userId = localStorage.get("userId");
  const SANDBOX_TOKEN = "EAAbhc9KLJNMBO8wew0Uavw8x2XQMjfqM2VXCoQWgtj5BlDa68uJwUh8z1aVh5fj8YYRFZCUNV62Xb8iZCIUOZAOb6ZCsH3gw8FNAuxBhwFOFoHlbS7o64Oq3pheLtpZA8ctS0Wa3ardyWn741yAA4GZCd92GFZC61OyUImZBNvrHehe6ii7Q2cb8qeCj5UZCdvWiNyZAsyYTLt";
  const accessToken = SANDBOX_TOKEN; //|| localStorage.get("facebookAccessToken");
  const pageId = "576837692181131"; // Page ID defined here, not hardcoded in backend

  console.log("Component initialized", { userId, accessToken });

  useEffect(() => {
    const fetchInitialData = async () => {
      if (!userId || !accessToken) {
        setError("User ID or Access Token missing. Please log in or provide a sandbox token.");
        console.log("Missing credentials", { userId, accessToken });
        return;
      }
      setLoading(true);
      console.log("Fetching initial data with token:", accessToken);
      try {
        const [adAccountsData, postsData, instagramAccountData] = await Promise.all([
          getAdAccounts(userId, accessToken),
          getInstagramPosts(userId, "EAAbhc9KLJNMBO91ml8b7w2bUrUgs1t9C5VS4MJixoXVJoZCVkOioZAvdqDfjMoPzwnJhToqfH8fOGzYvzsAZCSSv11g0TTEV0J17ZAZBX2WsmB3NSWb4vieeNGmeZBPavUvvLVogUteD4AeqAOEZADUbpOlS8ZBpyo6L5OyTyAjZBRcIlO0cCZBJhcawZDZD"), // Use same token for consistency
          getInstagramAccountFromPage(pageId, "EAAbhc9KLJNMBO91ml8b7w2bUrUgs1t9C5VS4MJixoXVJoZCVkOioZAvdqDfjMoPzwnJhToqfH8fOGzYvzsAZCSSv11g0TTEV0J17ZAZBX2WsmB3NSWb4vieeNGmeZBPavUvvLVogUteD4AeqAOEZADUbpOlS8ZBpyo6L5OyTyAjZBRcIlO0cCZBJhcawZDZD"), // Fetch Instagram account ID
        ]);

        console.log("Ad accounts fetched:", adAccountsData);
        console.log("Instagram posts fetched:", postsData);
        console.log("Instagram account fetched:", instagramAccountData);

        setAdAccounts(adAccountsData.data || []);
        setInstagramPosts(postsData.data || []);
        setInstagramAccountId(instagramAccountData.instagram_business_account?.id || "");
        
        if (adAccountsData.data && adAccountsData.data.length > 0) {
          setSelectedAdAccount(adAccountsData.data[0].id);
          console.log("Selected first ad account:", adAccountsData.data[0].id);
        }
        if (postsData.data && postsData.data.length > 0) {
          setSelectedPostId(postsData.data[0].id);
          console.log("Selected first post:", postsData.data[0].id);
        }
        if (!instagramAccountData.instagram_business_account?.id) {
          setError("No Instagram Business account linked to the Page.");
          console.log("No Instagram account linked to Page:", pageId);
        }
      } catch (err) {
        setError(`Error fetching initial data: ${err.message}`);
        console.error("Error fetching initial data:", err);
      } finally {
        setLoading(false);
        console.log("Initial data fetch complete", { loading: false });
      }
    };
    fetchInitialData();
  }, [userId, accessToken]);

  useEffect(() => {
    const fetchAdData = async () => {
      if (!selectedAdAccount) {
        console.log("No ad account selected, skipping ad data fetch");
        return;
      }
      setLoading(true);
      console.log("Fetching ad data for account:", selectedAdAccount);
      try {
        const [campaignsData, adSetsData, adsData] = await Promise.all([
          getCampaigns(selectedAdAccount, accessToken),
          getAdSets(selectedAdAccount, accessToken),
          getAds(selectedAdAccount, accessToken),
        ]);
        console.log("Campaigns fetched:", campaignsData);
        console.log("Ad sets fetched:", adSetsData);
        console.log("Ads fetched:", adsData);

        setCampaigns(campaignsData.data || []);
        setAdSets(adSetsData.data || []);
        setAds(adsData.data || []);
      } catch (err) {
        setError(`Error fetching ad data: ${err.message}`);
        console.error("Error fetching ad data:", err);
      } finally {
        setLoading(false);
        console.log("Ad data fetch complete", { loading: false });
      }
    };
    fetchAdData();
  }, [selectedAdAccount, accessToken]);

  const handleCreateAdFlow = async () => {
    if (!selectedAdAccount) {
      setError("Please select an ad account.");
      console.log("Ad creation failed: No ad account selected");
      return;
    }
    if (adType === "existing" && !selectedPostId) {
      setError("Please select an Instagram post.");
      console.log("Ad creation failed: No post selected for existing ad type");
      return;
    }
    if (adType === "new" && (!newAdLink || !newAdMessage)) {
      setError("Please provide a link and message for the new ad.");
      console.log("Ad creation failed: Missing link or message for new ad type");
      return;
    }
    if (!instagramAccountId) {
      setError("Instagram account ID is missing. Ensure the Page is linked to an Instagram Business account.");
      console.log("Ad creation failed: Missing Instagram account ID");
      return;
    }

    setLoading(true);
    setError(null);
    setInsights(null);
    console.log("Starting ad creation flow", { adType, selectedAdAccount, campaignName, adSetName, adName });

    try {
      const objectiveMap = {
        "OUTCOME_AWARENESS": "OUTCOME_AWARENESS",
        "OUTCOME_TRAFFIC": "OUTCOME_TRAFFIC",
        "OUTCOME_ENGAGEMENT": "OUTCOME_ENGAGEMENT",
        "OUTCOME_LEADS": "OUTCOME_LEADS",
        "OUTCOME_SALES": "OUTCOME_SALES",
        "OUTCOME_APP_PROMOTION": "OUTCOME_APP_PROMOTION"
      };
      console.log("Step 1: Creating campaign...");
      const campaign = await createCampaign(selectedAdAccount, accessToken, campaignName, objectiveMap[campaignObjective]);
      console.log("Campaign created:", campaign);

      console.log("Step 2: Creating ad set with campaign_id:", campaign.campaign_id);
      const adSet = await createAdSet(selectedAdAccount, accessToken, campaign.campaign_id, adSetName);
      console.log("Ad set created:", adSet);

      let ad;
      if (adType === "existing") {
        console.log("Step 3a: Creating ad with existing post, ad_set_id:", adSet.ad_set_id, "post_id:", selectedPostId, "instagram_account_id:", instagramAccountId);
        ad = await createAdWithExistingPost(selectedAdAccount, accessToken, adSet.ad_set_id, adName, selectedPostId, instagramAccountId);
        console.log("Ad created with existing post:", ad);
      } else {
        console.log("Step 3b: Creating ad with new creative, ad_set_id:", adSet.ad_set_id, "link:", newAdLink, "message:", newAdMessage, "page_id:", pageId, "instagram_account_id:", instagramAccountId);
        ad = await createAdWithNewCreative(selectedAdAccount, accessToken, adSet.ad_set_id, adName, newAdLink, newAdMessage, pageId, instagramAccountId);
        console.log("Ad created with new creative:", ad);
      }

      console.log("Step 4: Fetching ad insights for ad_id:", ad.ad_id);
      const adInsights = await getAdInsights(selectedAdAccount, accessToken, ad.ad_id);
      console.log("Ad insights fetched:", adInsights);
      setInsights(adInsights);

      console.log("Step 5: Refreshing campaigns, ad sets, and ads...");
      const [campaignsData, adSetsData, adsData] = await Promise.all([
        getCampaigns(selectedAdAccount, accessToken),
        getAdSets(selectedAdAccount, accessToken),
        getAds(selectedAdAccount, accessToken),
      ]);
      console.log("Updated campaigns:", campaignsData);
      console.log("Updated ad sets:", adSetsData);
      console.log("Updated ads:", adsData);

      setCampaigns(campaignsData.data || []);
      setAdSets(adSetsData.data || []);
      setAds(adsData.data || []);
    } catch (err) {
      setError(`Error in ad creation flow: ${err.message}`);
      console.error("Error in ad creation flow:", err.response ? err.response.data : err);
    } finally {
      setLoading(false);
      console.log("Ad creation flow complete", { loading: false });
    }
  };

  const handleDeleteCampaign = async (campaignId) => {
    console.log("Deleting campaign:", campaignId);
    try {
      await deleteCampaign(selectedAdAccount, accessToken, campaignId);
      setCampaigns(campaigns.filter((c) => c.id !== campaignId));
      console.log("Campaign deleted successfully:", campaignId);
    } catch (err) {
      setError(`Error deleting campaign: ${err.message}`);
      console.error("Error deleting campaign:", err);
    }
  };

  const handleDeleteAdSet = async (adSetId) => {
    console.log("Deleting ad set:", adSetId);
    try {
      await deleteAdSet(selectedAdAccount, accessToken, adSetId);
      setAdSets(adSets.filter((a) => a.id !== adSetId));
      console.log("Ad set deleted successfully:", adSetId);
    } catch (err) {
      setError(`Error deleting ad set: ${err.message}`);
      console.error("Error deleting ad set:", err);
    }
  };

  const handleDeleteAd = async (adId) => {
    console.log("Deleting ad:", adId);
    try {
      await deleteAd(selectedAdAccount, accessToken, adId);
      setAds(ads.filter((a) => a.id !== adId));
      console.log("Ad deleted successfully:", adId);
    } catch (err) {
      setError(`Error deleting ad: ${err.message}`);
      console.error("Error deleting ad:", err);
    }
  };

  return (
    <div style={{
      maxWidth: "1200px",
      margin: "0 auto",
      padding: "20px",
      fontFamily: "Arial, sans-serif",
      backgroundColor: "#f5f5f5",
      borderRadius: "10px",
      boxShadow: "0 4px 8px rgba(0, 0, 0, 0.1)",
    }}>
      <h1 style={{ color: "#333", textAlign: "center", marginBottom: "20px" }}>Ads Manager</h1>
      {loading && <p style={{ textAlign: "center", color: "#666" }}>Loading...</p>}
      {error && <p style={{ textAlign: "center", color: "#d32f2f", backgroundColor: "#ffebee", padding: "10px", borderRadius: "5px" }}>{error}</p>}

      {/* Ad Accounts */}
      <section style={{ marginBottom: "30px" }}>
        <h2 style={{ color: "#1976d2", marginBottom: "15px" }}>Ad Accounts</h2>
        <select
          value={selectedAdAccount}
          onChange={(e) => setSelectedAdAccount(e.target.value)}
          disabled={loading || adAccounts.length === 0}
          style={{
            width: "100%",
            padding: "10px",
            borderRadius: "5px",
            border: "1px solid #ccc",
            fontSize: "16px",
            backgroundColor: "#fff",
            cursor: loading ? "not-allowed" : "pointer",
          }}
        >
          <option value="">Select an Ad Account</option>
          {adAccounts.map((account) => (
            <option key={account.id} value={account.id}>
              {account.name} (ID: {account.id})
            </option>
          ))}
        </select>
      </section>

      {/* Create Ad Flow */}
      <section style={{ marginBottom: "30px", backgroundColor: "#fff", padding: "20px", borderRadius: "10px", boxShadow: "0 2px 4px rgba(0, 0, 0, 0.1)" }}>
        <h2 style={{ color: "#1976d2", marginBottom: "15px" }}>Create New Ad Flow</h2>
        <div style={{ display: "flex", flexDirection: "column", gap: "15px" }}>
          <label style={{ display: "flex", flexDirection: "column", gap: "5px" }}>
            <span style={{ color: "#555" }}>Campaign Name:</span>
            <input
              type="text"
              value={campaignName}
              onChange={(e) => setCampaignName(e.target.value)}
              disabled={loading}
              style={{
                padding: "10px",
                borderRadius: "5px",
                border: "1px solid #ccc",
                fontSize: "16px",
                backgroundColor: loading ? "#f0f0f0" : "#fff",
              }}
            />
          </label>
          <label style={{ display: "flex", flexDirection: "column", gap: "5px" }}>
            <span style={{ color: "#555" }}>Objective:</span>
            <select
              value={campaignObjective}
              onChange={(e) => setCampaignObjective(e.target.value)}
              disabled={loading}
              style={{
                padding: "10px",
                borderRadius: "5px",
                border: "1px solid #ccc",
                fontSize: "16px",
                backgroundColor: loading ? "#f0f0f0" : "#fff",
              }}
            >
              <option value="OUTCOME_AWARENESS">Awareness</option>
              <option value="OUTCOME_TRAFFIC">Traffic</option>
              <option value="OUTCOME_ENGAGEMENT">Engagement</option>
              <option value="OUTCOME_LEADS">Leads</option>
              <option value="OUTCOME_SALES">Sales</option>
              <option value="OUTCOME_APP_PROMOTION">App Promotion</option>
            </select>
          </label>
          <label style={{ display: "flex", flexDirection: "column", gap: "5px" }}>
            <span style={{ color: "#555" }}>Ad Set Name:</span>
            <input
              type="text"
              value={adSetName}
              onChange={(e) => setAdSetName(e.target.value)}
              disabled={loading}
              style={{
                padding: "10px",
                borderRadius: "5px",
                border: "1px solid #ccc",
                fontSize: "16px",
                backgroundColor: loading ? "#f0f0f0" : "#fff",
              }}
            />
          </label>
          <label style={{ display: "flex", flexDirection: "column", gap: "5px" }}>
            <span style={{ color: "#555" }}>Ad Name:</span>
            <input
              type="text"
              value={adName}
              onChange={(e) => setAdName(e.target.value)}
              disabled={loading}
              style={{
                padding: "10px",
                borderRadius: "5px",
                border: "1px solid #ccc",
                fontSize: "16px",
                backgroundColor: loading ? "#f0f0f0" : "#fff",
              }}
            />
          </label>

          {/* Ad Type Toggle */}
          <label style={{ display: "flex", flexDirection: "column", gap: "5px" }}>
            <span style={{ color: "#555" }}>Ad Type:</span>
            <select
              value={adType}
              onChange={(e) => setAdType(e.target.value)}
              disabled={loading}
              style={{
                padding: "10px",
                borderRadius: "5px",
                border: "1px solid #ccc",
                fontSize: "16px",
                backgroundColor: loading ? "#f0f0f0" : "#fff",
              }}
            >
              <option value="existing">Promote Existing Post</option>
              <option value="new">Create New Ad</option>
            </select>
          </label>

          {/* Existing Post Form */}
          {adType === "existing" && (
            <label style={{ display: "flex", flexDirection: "column", gap: "5px" }}>
              <span style={{ color: "#555" }}>Instagram Post:</span>
              <select
                value={selectedPostId}
                onChange={(e) => setSelectedPostId(e.target.value)}
                disabled={loading || instagramPosts.length === 0}
                style={{
                  padding: "10px",
                  borderRadius: "5px",
                  border: "1px solid #ccc",
                  fontSize: "16px",
                  backgroundColor: loading ? "#f0f0f0" : "#fff",
                }}
              >
                <option value="">Select a Post</option>
                {instagramPosts.map((post) => (
                  <option key={post.id} value={post.id}>
                    {post.caption ? post.caption.substring(0, 30) : "No Caption"} (ID: {post.id})
                  </option>
                ))}
              </select>
            </label>
          )}

          {/* New Ad Creative Form */}
          {adType === "new" && (
            <div style={{ display: "flex", flexDirection: "column", gap: "15px" }}>
              <label style={{ display: "flex", flexDirection: "column", gap: "5px" }}>
                <span style={{ color: "#555" }}>Link:</span>
                <input
                  type="text"
                  value={newAdLink}
                  onChange={(e) => setNewAdLink(e.target.value)}
                  disabled={loading}
                  style={{
                    padding: "10px",
                    borderRadius: "5px",
                    border: "1px solid #ccc",
                    fontSize: "16px",
                    backgroundColor: loading ? "#f0f0f0" : "#fff",
                  }}
                />
              </label>
              <label style={{ display: "flex", flexDirection: "column", gap: "5px" }}>
                <span style={{ color: "#555" }}>Message:</span>
                <textarea
                  value={newAdMessage}
                  onChange={(e) => setNewAdMessage(e.target.value)}
                  disabled={loading}
                  style={{
                    padding: "10px",
                    borderRadius: "5px",
                    border: "1px solid #ccc",
                    fontSize: "16px",
                    minHeight: "100px",
                    backgroundColor: loading ? "#f0f0f0" : "#fff",
                  }}
                />
              </label>
            </div>
          )}

          <button
            onClick={handleCreateAdFlow}
            disabled={loading || !selectedAdAccount || (adType === "existing" && !selectedPostId)}
            style={{
              padding: "12px 20px",
              borderRadius: "5px",
              border: "none",
              backgroundColor: loading || !selectedAdAccount || (adType === "existing" && !selectedPostId) ? "#ccc" : "#1976d2",
              color: "#fff",
              fontSize: "16px",
              cursor: loading || !selectedAdAccount || (adType === "existing" && !selectedPostId) ? "not-allowed" : "pointer",
              transition: "background-color 0.3s",
            }}
            onMouseOver={(e) => e.target.style.backgroundColor = loading || !selectedAdAccount || (adType === "existing" && !selectedPostId) ? "#ccc" : "#1565c0"}
            onMouseOut={(e) => e.target.style.backgroundColor = loading || !selectedAdAccount || (adType === "existing" && !selectedPostId) ? "#ccc" : "#1976d2"}
          >
            {loading ? "Processing..." : "Create Ad Flow"}
          </button>
        </div>
      </section>

      {/* Campaigns List */}
      <section style={{ marginBottom: "30px" }}>
        <h2 style={{ color: "#1976d2", marginBottom: "15px" }}>Campaigns</h2>
        <ul style={{ listStyle: "none", padding: 0 }}>
          {campaigns.map((campaign) => (
            <li key={campaign.id} style={{ display: "flex", justifyContent: "space-between", padding: "10px", backgroundColor: "#fff", marginBottom: "10px", borderRadius: "5px", boxShadow: "0 2px 4px rgba(0, 0, 0, 0.1)" }}>
              <span>{campaign.name} (ID: {campaign.id})</span>
              <button
                onClick={() => handleDeleteCampaign(campaign.id)}
                style={{
                  padding: "5px 10px",
                  borderRadius: "5px",
                  border: "none",
                  backgroundColor: "#d32f2f",
                  color: "#fff",
                  cursor: "pointer",
                  transition: "background-color 0.3s",
                }}
                onMouseOver={(e) => e.target.style.backgroundColor = "#c62828"}
                onMouseOut={(e) => e.target.style.backgroundColor = "#d32f2f"}
              >
                Delete
              </button>
            </li>
          ))}
        </ul>
      </section>

      {/* Ad Sets List */}
      <section style={{ marginBottom: "30px" }}>
        <h2 style={{ color: "#1976d2", marginBottom: "15px" }}>Ad Sets</h2>
        <ul style={{ listStyle: "none", padding: 0 }}>
          {adSets.map((adSet) => (
            <li key={adSet.id} style={{ display: "flex", justifyContent: "space-between", padding: "10px", backgroundColor: "#fff", marginBottom: "10px", borderRadius: "5px", boxShadow: "0 2px 4px rgba(0, 0, 0, 0.1)" }}>
              <span>{adSet.name} (ID: {adSet.id})</span>
              <button
                onClick={() => handleDeleteAdSet(adSet.id)}
                style={{
                  padding: "5px 10px",
                  borderRadius: "5px",
                  border: "none",
                  backgroundColor: "#d32f2f",
                  color: "#fff",
                  cursor: "pointer",
                  transition: "background-color 0.3s",
                }}
                onMouseOver={(e) => e.target.style.backgroundColor = "#c62828"}
                onMouseOut={(e) => e.target.style.backgroundColor = "#d32f2f"}
              >
                Delete
              </button>
            </li>
          ))}
        </ul>
      </section>

      {/* Ads List */}
      <section style={{ marginBottom: "30px" }}>
        <h2 style={{ color: "#1976d2", marginBottom: "15px" }}>Ads</h2>
        <ul style={{ listStyle: "none", padding: 0 }}>
          {ads.map((ad) => (
            <li key={ad.id} style={{ display: "flex", justifyContent: "space-between", padding: "10px", backgroundColor: "#fff", marginBottom: "10px", borderRadius: "5px", boxShadow: "0 2px 4px rgba(0, 0, 0, 0.1)" }}>
              <span>{ad.name} (ID: {ad.id})</span>
              <button
                onClick={() => handleDeleteAd(ad.id)}
                style={{
                  padding: "5px 10px",
                  borderRadius: "5px",
                  border: "none",
                  backgroundColor: "#d32f2f",
                  color: "#fff",
                  cursor: "pointer",
                  transition: "background-color 0.3s",
                }}
                onMouseOver={(e) => e.target.style.backgroundColor = "#c62828"}
                onMouseOut={(e) => e.target.style.backgroundColor = "#d32f2f"}
              >
                Delete
              </button>
            </li>
          ))}
        </ul>
      </section>

      {/* Insights */}
      {insights && (
        <section style={{ backgroundColor: "#fff", padding: "20px", borderRadius: "10px", boxShadow: "0 2px 4px rgba(0, 0, 0, 0.1)" }}>
          <h2 style={{ color: "#1976d2", marginBottom: "15px" }}>Latest Ad Insights</h2>
          <pre style={{ backgroundColor: "#f5f5f5", padding: "10px", borderRadius: "5px", overflowX: "auto" }}>
            {JSON.stringify(insights, null, 2)}
          </pre>
        </section>
      )}
    </div>
  );
};

export default AdsPage;