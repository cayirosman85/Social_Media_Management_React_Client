import React, { useState, useEffect } from "react";
import SearchForm from "../../../components/instagram/HashtagSearchForm";
import HashtagInfo from "../../../components/instagram/HashtagInfo";
import Tabs from "../../../components/instagram/HashtagTabs";
import MediaCard from "../../../components/instagram/HashtagMediaCard";
import MediaModal from "../../../components/instagram/HashtagMediaModal";
import RecentSearchesSection from "../../../components/instagram/HashtagRecentSearches";
import {
  searchHashtag,
  getRecentMedia,
  getTopMedia,
  getRecentSearchHashtags,
} from "../../../services/instagram/instagramService";
import "./HashtagManager.css";
import ls from "local-storage";

const HashtagManager = () => {
  const [hashtagName, setHashtagName] = useState("");
  const [hashtagId, setHashtagId] = useState(null);
  const [recentMedia, setRecentMedia] = useState([]);
  const [topMedia, setTopMedia] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState("recent");
  const [selectedMedia, setSelectedMedia] = useState(null);
  const [recentSearches, setRecentSearches] = useState([]);

    
                
  const instagramData = {
    business_discovery: {
      id:ls.get("userId"),
      username:ls.get("username"),
    },
    accessToken:
    ls.get("facebookAccessToken"),
  };

  const handleSearch = async () => {
    if (!hashtagName.trim()) {
      setError("Please enter a hashtag");
      return;
    }
    setIsLoading(true);
    setError(null);

    try {
      const response = await searchHashtag(
        instagramData.business_discovery.id,
        hashtagName,
        instagramData.accessToken
      );
      const data = response.data[0];
      if (!data || !data.id) {
        throw new Error("No hashtag ID found in response");
      }
      setHashtagId(data.id);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchRecentMedia = async () => {
    if (!hashtagId) return;
    setIsLoading(true);
    setError(null);
    try {
      const response = await getRecentMedia(
        instagramData.business_discovery.id,
        hashtagId,
        instagramData.accessToken
      );
      setRecentMedia(response.data || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchTopMedia = async () => {
    if (!hashtagId) return;
    setIsLoading(true);
    setError(null);
    try {
      const response = await getTopMedia(
        instagramData.business_discovery.id,
        hashtagId,
        instagramData.accessToken
      );
      setTopMedia(response.data || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchRecentSearches = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await getRecentSearchHashtags(
        instagramData.business_discovery.id,
        instagramData.accessToken
      );
      setRecentSearches(response || []);
      console.log("getting payload to /api/getRecentSearchHashtags:", response);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (hashtagId) {
      fetchRecentMedia();
      fetchTopMedia();
    }
  }, [hashtagId]);

  const openModal = (data) => {
    setSelectedMedia(data.media);
  };

  const closeModal = () => {
    setSelectedMedia(null);
  };

  const handleRecentSearchClick = (search) => {
    setHashtagName(search.name);
    setHashtagId(search.id);
  };

  return (
    <div className="hashtags-container">
      <h2 className="hashtags-title">Hashtags</h2>

      <SearchForm
        hashtagName={hashtagName}
        setHashtagName={setHashtagName}
        handleSearch={handleSearch}
        isLoading={isLoading}
      />

      <button className="fetch-recent-btn" onClick={fetchRecentSearches}>
        Show Recent Searches
      </button>

      <RecentSearchesSection
        recentSearches={recentSearches}
        onSearchClick={handleRecentSearchClick}
        isLoading={isLoading}
      />

      {error && <div className="error-message">{error}</div>}
      {hashtagId && (
        <HashtagInfo hashtagName={hashtagName} hashtagId={hashtagId} />
      )}

      {hashtagId && <Tabs activeTab={activeTab} setActiveTab={setActiveTab} />}

      <div className="tab-content">
        {isLoading ? (
       <div className="loader">
       <div className="spinner"></div>
       <span>Loading...</span>
     </div>
        ) : activeTab === "recent" ? (
          recentMedia.length > 0 ? (
            <div className="media-grid">
              {recentMedia.map((media) => (
                <MediaCard
                  key={media.id}
                  media={media}
                  onClick={openModal}
                />
              ))}
            </div>
          ) : (
            <p className="no-data">No recent media found.</p>
          )
        ) : topMedia.length > 0 ? (
          <div className="media-grid">
            {topMedia.map((media) => (
              <MediaCard
                key={media.id}
                media={media}
                onClick={openModal}
              />
            ))}
          </div>
        ) : (
          <p className="no-data">No top media found.</p>
        )}
      </div>

      <MediaModal media={selectedMedia} onClose={closeModal} />
    </div>
  );
};

export default HashtagManager;