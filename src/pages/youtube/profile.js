import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import localStorage from 'local-storage';
import {
  Container,
  Typography,
  Avatar,
  Grid,
  TextField,
  Button,
  Card,
  CardContent,
  IconButton,
  Box,
  Tabs,
  Tab,
} from '@mui/material';
import { MoreVert, ThumbUp, Comment } from '@mui/icons-material';
import ProfileSidebar from '../../components/youtube/ProfileSidebar';

const YoutubeProfile = () => {
  const [profile, setProfile] = useState(null);
  const [videos, setVideos] = useState([]);
  const [playlists, setPlaylists] = useState([]);
  const [likedVideos, setLikedVideos] = useState([]);
  const [subscriptions, setSubscriptions] = useState([]);
  const [history, setHistory] = useState([]);
  const [watchLater, setWatchLater] = useState([]);
  const [shorts, setShorts] = useState([]);
  const [trendingVideos, setTrendingVideos] = useState([]);
  const [subscriptionVideos, setSubscriptionVideos] = useState({});
  const [subscriptionFeed, setSubscriptionFeed] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [tabValue, setTabValue] = useState(0);
  const [comments, setComments] = useState({});
  const [newComment, setNewComment] = useState('');
  const navigate = useNavigate();

  const itemsPerPage = 10;
  const [pageTokens, setPageTokens] = useState({
    videos: null,
    playlists: null,
    likedVideos: null,
    subscriptions: null,
    watchLater: null,
    shorts: null,
    trendingVideos: null,
    subscriptionFeed: null,
    searchResults: null,
  });

  // Load YouTube iframe API and ensure it's ready
  useEffect(() => {
    if (!window.YT) {
      const tag = document.createElement('script');
      tag.src = 'https://www.youtube.com/iframe_api';
      const firstScriptTag = document.getElementsByTagName('script')[0];
      firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);

      window.onYouTubeIframeAPIReady = () => {
        console.log('YouTube Iframe API is ready');
      };
    } else {
      console.log('YouTube Iframe API already loaded');
    }
  }, []);

  // Refresh access token
  const refreshAccessToken = async (refreshToken) => {
    try {
      const response = await fetch('https://localhost:7099/api/GoogleAuth/refresh-token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken }),
      });
      const data = await response.json();
      if (response.ok) {
        localStorage.set('youtubeAccessToken', data.accessToken);
        return data.accessToken;
      }
      throw new Error(`Token refresh failed: ${data.error || 'Unknown error'}`);
    } catch (err) {
      setError('Authentication failed. Please log in again.');
      return null;
    }
  };

  // Fetch video details
  const fetchVideoDetails = async (videoIds) => {
    let accessToken = localStorage.get('youtubeAccessToken');
    const refreshToken = localStorage.get('youtubeRefreshToken');
    try {
      const response = await fetch(
        `https://www.googleapis.com/youtube/v3/videos?part=snippet&id=${videoIds.join(',')}`,
        { headers: { Authorization: `Bearer ${accessToken}` } }
      );
      if (!response.ok) {
        if (response.status === 401) {
          accessToken = await refreshAccessToken(refreshToken);
          if (!accessToken) throw new Error('Token refresh failed');
          return fetchVideoDetails(videoIds);
        }
        const data = await response.json();
        throw new Error(data.error?.message || 'Failed to fetch video details');
      }
      const data = await response.json();
      return data.items || [];
    } catch (err) {
      if (err.message.includes('quota')) setError('YouTube API quota exceeded. History may be incomplete.');
      else setError(`Failed to fetch video details: ${err.message}`);
      return [];
    }
  };

  // Initialize history from localStorage
  useEffect(() => {
    const storedHistory = JSON.parse(localStorage.get('watchedVideos') || '[]');
    if (storedHistory.length > 0) {
      fetchVideoDetails(storedHistory).then((videoDetails) => {
        setHistory(videoDetails.filter((v) => v));
        console.log('Loaded history from localStorage:', videoDetails);
      });
    }
    setLoading(false);
  }, []);

  // Fetch profile and other data
  useEffect(() => {
    const fetchProfile = async () => {
      let accessToken = localStorage.get('youtubeAccessToken');
      const refreshToken = localStorage.get('youtubeRefreshToken');
    
      if (!accessToken || !refreshToken) {
        setError('No authentication tokens found. Please log in again.');
        navigate('/YoutubeLogin');
        return;
      }
    
      const fetchWithAuth = async (url, options = {}, pageTokenKey) => {
        const pageToken = pageTokens[pageTokenKey] || '';
        const fullUrl = `${url}&maxResults=${itemsPerPage}${pageToken ? `&pageToken=${pageToken}` : ''}`;
        try {
          const response = await fetch(fullUrl, {
            ...options,
            headers: { Authorization: `Bearer ${accessToken}`, ...(options.headers || {}) },
          });
          if (!response.ok) {
            if (response.status === 401) {
              accessToken = await refreshAccessToken(refreshToken);
              if (!accessToken) throw new Error('Token refresh failed');
              return fetchWithAuth(url, options, pageTokenKey);
            }
            const data = await response.json();
            throw new Error(data.error?.message || `Failed to fetch from ${url} (Status: ${response.status})`);
          }
          return response.json();
        } catch (err) {
          console.error(`Error fetching ${pageTokenKey}:`, err.message);
          throw err;
        }
      };
    
      try {
        const cachedProfileRaw = localStorage.get('youtubeProfile');
        const cachedVideos = localStorage.get('youtubeVideos');
        let cachedProfile = cachedProfileRaw ? JSON.parse(cachedProfileRaw) : null;
        if (cachedProfile && cachedProfile.snippet) setProfile(cachedProfile);
        if (cachedVideos) setVideos(JSON.parse(cachedVideos));
    
        if (!cachedProfile || !cachedProfile.snippet) {
          console.log('Fetching profile from backend with token:', accessToken); // Debug log
          const profileResponse = await fetch('https://localhost:7099/api/GoogleAuth/youtube/profile', {
            headers: {
              'X-Access-Token': accessToken,
              'X-Refresh-Token': refreshToken,
            },
          });
    
          if (!profileResponse.ok) {
            const errorText = await profileResponse.text(); // Get raw response for more detail
            console.error('Profile fetch response:', profileResponse.status, errorText); // Debug log
            throw new Error(
              `Failed to fetch YouTube profile: ${profileResponse.status} - ${errorText || 'Unknown error'}`
            );
          }
    
          const profileData = await profileResponse.json();
          console.log('Profile data received:', profileData); // Debug log
          setProfile(profileData.channel);
          setVideos(profileData.videos || []);
          localStorage.set('youtubeProfile', JSON.stringify(profileData.channel));
          localStorage.set('youtubeVideos', JSON.stringify(profileData.videos || []));
          cachedProfile = profileData.channel;
        }
    
        const fetchPaginatedData = async (url, setter, cacheKey, pageTokenKey) => {
          try {
            const data = await fetchWithAuth(url, {}, pageTokenKey);
            if (pageTokenKey === 'subscriptions') {
              const uniqueItems = Array.from(
                new Map(data.items.map((item) => [item.snippet.resourceId.channelId, item])).values()
              );
              setter(uniqueItems);
              localStorage.set(cacheKey, JSON.stringify(uniqueItems));
            } else {
              setter(data.items || []);
              localStorage.set(cacheKey, JSON.stringify(data.items || []));
            }
            setPageTokens((prev) => ({ ...prev, [pageTokenKey]: data.nextPageToken || null }));
          } catch (err) {
            if (err.message.includes('quota')) {
              setError('YouTube API quota exceeded. Some data may be unavailable.');
              setter([]);
            } else {
              console.error(`Failed to fetch ${pageTokenKey}:`, err.message);
              setter([]);
            }
          }
        };
    
        await Promise.all([
          fetchPaginatedData(
            'https://www.googleapis.com/youtube/v3/playlists?part=snippet,contentDetails&mine=true',
            setPlaylists,
            'youtubePlaylists',
            'playlists'
          ),
          fetchPaginatedData(
            'https://www.googleapis.com/youtube/v3/videos?part=snippet,contentDetails,statistics&myRating=like',
            setLikedVideos,
            'youtubeLikedVideos',
            'likedVideos'
          ),
          fetchPaginatedData(
            'https://www.googleapis.com/youtube/v3/subscriptions?part=snippet&mine=true',
            setSubscriptions,
            'youtubeSubscriptions',
            'subscriptions'
          ),
          fetchPaginatedData(
            'https://www.googleapis.com/youtube/v3/playlistItems?part=snippet&playlistId=WL',
            setWatchLater,
            'youtubeWatchLater',
            'watchLater'
          ),
          fetchPaginatedData(
            'https://www.googleapis.com/youtube/v3/search?part=snippet&type=video&videoDuration=short&q=shorts',
            setShorts,
            'youtubeShorts',
            'shorts'
          ),
          fetchPaginatedData(
            'https://www.googleapis.com/youtube/v3/videos?part=snippet,contentDetails,statistics&chart=mostPopular&RegionCode=TR',
            setTrendingVideos,
            'youtubeTrending',
            'trendingVideos'
          ),
        ]);
    
        localStorage.set('youtubeChannelId', cachedProfile?.id || '');
        localStorage.set('youtubeUsername', cachedProfile?.snippet?.title || '');
      } catch (err) {
        console.error('Fetch profile error:', err.message);
        if (err.message.includes('quota')) {
          setError('YouTube API quota exceeded. Showing cached or empty data.');
        } else if (err.message.includes('Token refresh failed') || err.message.includes('Authentication')) {
          setError(`Authentication error: ${err.message}. Redirecting to login.`);
          localStorage.remove('youtubeAccessToken');
          localStorage.remove('youtubeRefreshToken');
          localStorage.remove('youtubeChannelId');
          localStorage.remove('youtubeUsername');
          navigate('/YoutubeLogin');
        } else {
          setError(`Failed to fetch YouTube data: ${err.message}. Showing cached or empty data.`);
        }
      } finally {
        setLoading(false); // Ensure loading state is cleared even on error
      }
    };
    fetchProfile();
  }, [navigate]);

  // Fetch subscription feed
  useEffect(() => {
    const fetchSubscriptionFeed = async () => {
      const accessToken = localStorage.get('youtubeAccessToken');
      if (!subscriptions.length) {
        setSubscriptionFeed([]);
        return;
      }

      const uniqueChannelIds = Array.from(
        new Set(subscriptions.map((sub) => sub.snippet.resourceId.channelId))
      );

      try {
        const videoPromises = uniqueChannelIds.map(async (channelId) => {
          const url = `https://www.googleapis.com/youtube/v3/search?part=snippet&channelId=${channelId}&type=video&order=date&maxResults=${itemsPerPage}`;
          const response = await fetch(url, { headers: { Authorization: `Bearer ${accessToken}` } });
          if (!response.ok) throw new Error(`Failed to fetch videos for channel ${channelId}`);
          const data = await response.json();
          return data.items || [];
        });

        const allVideos = (await Promise.all(videoPromises)).flat();
        allVideos.sort((a, b) => new Date(b.snippet.publishedAt) - new Date(a.snippet.publishedAt));
        setSubscriptionFeed(allVideos.slice(0, itemsPerPage));
        setPageTokens((prev) => ({
          ...prev,
          subscriptionFeed: allVideos.length > itemsPerPage ? 'next' : null,
        }));
      } catch (err) {
        if (err.message.includes('quota')) {
          setError('YouTube API quota exceeded. Subscription feed unavailable.');
          setSubscriptionFeed([]);
        } else {
          setError(`Failed to fetch subscription feed: ${err.message}`);
          setSubscriptionFeed([]);
        }
      }
    };

    fetchSubscriptionFeed();
  }, [subscriptions]);

  // Load more data
  const loadMore = async (url, setter, pageTokenKey) => {
    let accessToken = localStorage.get('youtubeAccessToken');
    try {
      if (pageTokenKey === 'subscriptionFeed') {
        const uniqueChannelIds = Array.from(
          new Set(subscriptions.map((sub) => sub.snippet.resourceId.channelId))
        );
        const videoPromises = uniqueChannelIds.map(async (channelId) => {
          const response = await fetch(
            `https://www.googleapis.com/youtube/v3/search?part=snippet&channelId=${channelId}&type=video&order=date&maxResults=${itemsPerPage}`,
            { headers: { Authorization: `Bearer ${accessToken}` } }
          );
          if (!response.ok) throw new Error('Failed to fetch more subscription videos');
          const data = await response.json();
          return data.items || [];
        });
        const allVideos = (await Promise.all(videoPromises)).flat();
        allVideos.sort((a, b) => new Date(b.snippet.publishedAt) - new Date(a.snippet.publishedAt));
        setter((prev) => [...prev, ...allVideos.slice(prev.length, prev.length + itemsPerPage)]);
        setPageTokens((prev) => ({
          ...prev,
          subscriptionFeed: allVideos.length > prev.length + itemsPerPage ? 'next' : null,
        }));
      } else {
        const response = await fetch(`${url}&maxResults=${itemsPerPage}&pageToken=${pageTokens[pageTokenKey]}`, {
          headers: { Authorization: `Bearer ${accessToken}` },
        });
        if (!response.ok) {
          if (response.status === 401) {
            accessToken = await refreshAccessToken(localStorage.get('youtubeRefreshToken'));
            if (!accessToken) return;
            return loadMore(url, setter, pageTokenKey);
          }
          throw new Error('Failed to fetch more data');
        }
        const data = await response.json();
        if (pageTokenKey === 'subscriptions') {
          const uniqueItems = Array.from(
            new Map(data.items.map((item) => [item.snippet.resourceId.channelId, item])).values()
          );
          setter((prev) => [...prev, ...uniqueItems]);
        } else {
          setter((prev) => [...prev, ...(data.items || [])]);
        }
        setPageTokens((prev) => ({ ...prev, [pageTokenKey]: data.nextPageToken || null }));
      }
    } catch (err) {
      console.error('Error loading more data:', err);
      if (err.message.includes('quota')) {
        setError('YouTube API quota exceeded. Cannot load more data.');
      } else {
        setError(`Failed to load more data: ${err.message}`);
      }
    }
  };

  const handleSidebarItemClick = (index) => {
    setTabValue(index);
    setSearchResults([]);
  };

  const handleSubscriptionClick = async (channelId) => {
    let accessToken = localStorage.get('youtubeAccessToken');
    try {
      const response = await fetch(
        `https://www.googleapis.com/youtube/v3/search?part=snippet&channelId=${channelId}&maxResults=${itemsPerPage}&type=video&order=date`,
        { headers: { Authorization: `Bearer ${accessToken}` } }
      );
      if (!response.ok) {
        if (response.status === 401) {
          accessToken = await refreshAccessToken(localStorage.get('youtubeRefreshToken'));
          if (!accessToken) {
            setError('Authentication failed. Please log in again.');
            return;
          }
          return handleSubscriptionClick(channelId);
        }
        const errorData = await response.json();
        throw new Error(errorData.error?.message || 'Failed to fetch channel videos');
      }
      const data = await response.json();
      setSubscriptionVideos((prev) => ({
        ...prev,
        [channelId]: data.items || [],
      }));
      setPageTokens((prev) => ({ ...prev, [channelId]: data.nextPageToken || null }));
      setTabValue(9);
      setSearchResults([]);
    } catch (err) {
      if (err.message.includes('quota')) {
        setError('YouTube API quota exceeded. Channel videos unavailable.');
      } else {
        setError(`Failed to fetch videos for channel ${channelId}: ${err.message}`);
      }
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    let accessToken = localStorage.get('youtubeAccessToken');
    try {
      const response = await fetch(
        `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${encodeURIComponent(searchQuery)}&maxResults=${itemsPerPage}&type=video&order=relevance`,
        { headers: { Authorization: `Bearer ${accessToken}` } }
      );
      if (!response.ok) {
        if (response.status === 401) {
          accessToken = await refreshAccessToken(localStorage.get('youtubeRefreshToken'));
          if (!accessToken) {
            setError('Authentication failed. Please log in again.');
            return;
          }
          return handleSearch();
        }
        const errorData = await response.json();
        throw new Error(errorData.error?.message || 'Failed to fetch search results');
      }
      const data = await response.json();
      setSearchResults(data.items || []);
      setPageTokens((prev) => ({ ...prev, searchResults: data.nextPageToken || null }));
      setTabValue(-1);
    } catch (err) {
      if (err.message.includes('quota')) {
        setError('YouTube API quota exceeded. Search results unavailable.');
        setSearchResults([]);
      } else {
        setError(`Failed to fetch search results: ${err.message}`);
        setSearchResults([]);
      }
    }
  };

  const handleCustomizeChannel = () => {
    window.open('https://www.youtube.com/customize_channel', '_blank');
  };

  const handleManageVideos = () => {
    window.open('https://studio.youtube.com', '_blank');
  };

  const handleLikeVideo = async (videoId) => {
    let accessToken = localStorage.get('youtubeAccessToken');
    try {
      const response = await fetch(
        `https://www.googleapis.com/youtube/v3/videos/rate?id=${videoId}&rating=like`,
        { method: 'POST', headers: { Authorization: `Bearer ${accessToken}` } }
      );
      if (!response.ok) {
        if (response.status === 401) {
          accessToken = await refreshAccessToken(localStorage.get('youtubeRefreshToken'));
          if (!accessToken) return;
          return handleLikeVideo(videoId);
        }
        throw new Error('Failed to like video');
      }
      alert('Video liked!');
    } catch (err) {
      if (err.message.includes('quota')) {
        setError('YouTube API quota exceeded. Cannot like video.');
      } else {
        alert('Failed to like video.');
      }
    }
  };

  const fetchComments = async (videoId) => {
    let accessToken = localStorage.get('youtubeAccessToken');
    try {
      const response = await fetch(
        `https://www.googleapis.com/youtube/v3/commentThreads?part=snippet&videoId=${videoId}&maxResults=${itemsPerPage}`,
        { headers: { Authorization: `Bearer ${accessToken}` } }
      );
      if (!response.ok) {
        if (response.status === 401) {
          accessToken = await refreshAccessToken(localStorage.get('youtubeRefreshToken'));
          if (!accessToken) return;
          return fetchComments(videoId);
        }
        const data = await response.json();
        throw new Error(data.error?.message || 'Failed to fetch comments');
      }
      const data = await response.json();
      setComments((prev) => ({ ...prev, [videoId]: data.items || [] }));
    } catch (err) {
      if (err.message.includes('quota')) {
        setError('YouTube API quota exceeded. Comments unavailable.');
      } else {
        console.error('Error fetching comments:', err);
      }
    }
  };

  const handlePostComment = async (videoId) => {
    let accessToken = localStorage.get('youtubeAccessToken');
    try {
      const response = await fetch('https://www.googleapis.com/youtube/v3/commentThreads?part=snippet', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          snippet: { videoId, topLevelComment: { snippet: { textOriginal: newComment } } },
        }),
      });
      if (!response.ok) {
        if (response.status === 401) {
          accessToken = await refreshAccessToken(localStorage.get('youtubeRefreshToken'));
          if (!accessToken) return;
          return handlePostComment(videoId);
        }
        const data = await response.json();
        throw new Error(data.error?.message || 'Failed to post comment');
      }
      setNewComment('');
      fetchComments(videoId);
    } catch (err) {
      if (err.message.includes('quota')) {
        setError('YouTube API quota exceeded. Cannot post comment.');
      } else {
        alert('Failed to post comment.');
      }
    }
  };

  // Handle video play to update history
  const handleVideoPlay = (videoId) => {
    console.log('Video played:', videoId);
    const storedHistory = JSON.parse(localStorage.get('watchedVideos') || '[]');
    if (!storedHistory.includes(videoId)) {
      storedHistory.unshift(videoId);
      const limitedHistory = storedHistory.slice(0, 50);
      localStorage.set('watchedVideos', JSON.stringify(limitedHistory));
      console.log('Updated localStorage:', limitedHistory);
      fetchVideoDetails([videoId]).then((videoDetails) => {
        if (videoDetails.length > 0) {
          setHistory((prev) => {
            const updatedHistory = [videoDetails[0], ...prev.filter((v) => v.id !== videoId)];
            console.log('Updated history state:', updatedHistory);
            return updatedHistory.slice(0, 50);
          });
        }
      });
    }
  };

  if (loading) {
    return (
      <Container>
        <Typography variant="h6">Loading YouTube profile...</Typography>
      </Container>
    );
  }

  const snippet = profile?.snippet || { title: 'Your Channel', thumbnails: { high: { url: '' } } };
  const statistics = profile?.statistics || { subscriberCount: '0', videoCount: '0' };

  return (
    <div style={{ flexGrow: 1, padding: '24px' }}>
      <Container style={{ marginTop: '32px', marginBottom: '32px' }}>
        {error && (
          <Typography variant="body1" color="error" style={{ marginBottom: '16px' }}>
            {error}
          </Typography>
        )}
        <div style={{ display: 'flex', gap: '24px' }}>
          <div style={{ flexShrink: 0 }}>
            <ProfileSidebar
              subscriptions={subscriptions}
              onItemClick={handleSidebarItemClick}
              onSubscriptionClick={handleSubscriptionClick}
            />
          </div>

          <div style={{ flexGrow: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '24px' }}>
              <Avatar
                src={snippet.thumbnails.high.url}
                alt={snippet.title}
                style={{ width: '80px', height: '80px', marginRight: '16px', backgroundColor: '#ccc' }}
              />
              <div style={{ flexGrow: 1 }}>
                <Typography variant="h5" style={{ fontWeight: 'bold' }}>
                  {snippet.title}
                </Typography>
                <Typography variant="body2" style={{ color: 'rgba(0, 0, 0, 0.6)' }}>
                  {snippet.customUrl || `@${snippet.title.replace(/\s+/g, '').toLowerCase()}`} •{' '}
                  {statistics.subscriberCount} subscribers • {statistics.videoCount}{' '}
                  {statistics.videoCount === '1' ? 'video' : 'videos'}
                </Typography>
                <Typography
                  variant="body2"
                  style={{ color: 'rgba(0, 0, 0, 0.6)', marginTop: '4px', cursor: 'pointer' }}
                  onClick={() => alert('More about this channel...')}
                >
                  More about this channel... <span style={{ color: '#606060' }}>more</span>
                </Typography>
              </div>
              <div>
                <Button
                  variant="outlined"
                  style={{
                    marginRight: '8px',
                    borderRadius: '20px',
                    textTransform: 'none',
                    color: '#000',
                    borderColor: '#ccc',
                  }}
                  onClick={handleCustomizeChannel}
                >
                  Customize channel
                </Button>
                <Button
                  variant="outlined"
                  style={{ borderRadius: '20px', textTransform: 'none', color: '#000', borderColor: '#ccc' }}
                  onClick={handleManageVideos}
                >
                  Manage videos
                </Button>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '16px' }}>
              <TextField
                variant="outlined"
                placeholder="Search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                fullWidth
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: '20px 0 0 20px', height: '40px' } }}
              />
              <Button
                variant="contained"
                onClick={handleSearch}
                sx={{
                  borderRadius: '0 20px 20px 0',
                  height: '40px',
                  backgroundColor: '#f8f8f8',
                  color: '#000',
                  '&:hover': { backgroundColor: '#e0e0e0' },
                  textTransform: 'none',
                }}
              >
                Search
              </Button>
            </div>

            <Tabs value={tabValue} onChange={(e, newValue) => setTabValue(newValue)} sx={{ marginBottom: '16px' }}>
              <Tab label="Home" />
              <Tab label="Shorts" />
              <Tab label="Subscriptions" />
              <Tab label="History" />
              <Tab label="Playlists" />
              <Tab label="Your Videos" />
              <Tab label="Watch Later" />
              <Tab label="Liked Videos" />
              <Tab label="Posts" />
              <Tab label="Channel Videos" />
            </Tabs>

            {tabValue === -1 && searchResults.length > 0 ? (
              <div>
                <Typography variant="h6" style={{ marginBottom: '16px' }}>
                  Search Results for "{searchQuery}"
                </Typography>
                <Grid container spacing={2}>
                  {searchResults.map((video) => (
                    <Grid item xs={12} sm={6} md={4} key={video.id.videoId}>
                      <Card style={{ maxWidth: '345px' }}>
                        <div>
                          <iframe
                            width="100%"
                            height="140"
                            src={`https://www.youtube.com/embed/${video.id.videoId}`}
                            title={video.snippet.title}
                            frameBorder="0"
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                            allowFullScreen
                            onLoad={() => {
                              if (window.YT && window.YT.Player) {
                                new window.YT.Player(`player-${video.id.videoId}`, {
                                  events: {
                                    onStateChange: (event) => {
                                      if (event.data === window.YT.PlayerState.PLAYING) {
                                        handleVideoPlay(video.id.videoId);
                                      }
                                    },
                                    onError: (event) => {
                                      console.error('YouTube Player Error:', event.data);
                                    },
                                  },
                                });
                              } else {
                                console.warn('YouTube API not loaded yet for video:', video.id.videoId);
                              }
                            }}
                            id={`player-${video.id.videoId}`}
                          />
                        </div>
                        <CardContent>
                          <Typography variant="body2" style={{ fontWeight: 'medium' }}>
                            {video.snippet.title}
                          </Typography>
                          <Typography variant="caption" style={{ color: 'rgba(0, 0, 0, 0.6)' }}>
                            {video.snippet.channelTitle} • {new Date(video.snippet.publishedAt).toLocaleDateString()}
                          </Typography>
                        </CardContent>
                      </Card>
                    </Grid>
                  ))}
                </Grid>
                {pageTokens.searchResults && (
                  <Button
                    onClick={() =>
                      loadMore(
                        `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${encodeURIComponent(searchQuery)}&type=video&order=relevance`,
                        setSearchResults,
                        'searchResults'
                      )
                    }
                  >
                    Load More
                  </Button>
                )}
              </div>
            ) : tabValue === -1 && searchResults.length === 0 ? (
              <Typography variant="body1" style={{ color: 'rgba(0, 0, 0, 0.6)' }}>
                No search results found for "{searchQuery}".
              </Typography>
            ) : tabValue === 0 ? (
              <div>
                <Typography variant="h6" style={{ marginBottom: '16px' }}>
                  Your Videos
                </Typography>
                {videos.length > 0 ? (
                  <Grid container spacing={2}>
                    {videos.map((video) => (
                      <Grid item xs={12} sm={6} md={4} key={video.id.id}>
                        <Card style={{ maxWidth: '345px' }}>
                          <div>
                            <iframe
                              width="100%"
                              height="140"
                              src={`https://www.youtube.com/embed/${video.id.id}`}
                              title={video.snippet.title}
                              frameBorder="0"
                              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                              allowFullScreen
                              onLoad={() => {
                                if (window.YT && window.YT.Player) {
                                  new window.YT.Player(`player-${video.id.id}`, {
                                    events: {
                                      onStateChange: (event) => {
                                        if (event.data === window.YT.PlayerState.PLAYING) {
                                          handleVideoPlay(video.id.id);
                                        }
                                      },
                                      onError: (event) => {
                                        console.error('YouTube Player Error:', event.data);
                                      },
                                    },
                                  });
                                } else {
                                  console.warn('YouTube API not loaded yet for video:', video.id.id);
                                }
                              }}
                              id={`player-${video.id.id}`}
                            />
                          </div>
                          <CardContent style={{ display: 'flex', alignItems: 'flex-start', padding: '8px' }}>
                            <div style={{ flexGrow: 1 }}>
                              <Typography variant="body2" style={{ fontWeight: 'medium' }}>
                                {video.snippet.title}
                              </Typography>
                              <Typography variant="caption" style={{ color: 'rgba(0, 0, 0, 0.6)' }}>
                                {video.statistics?.viewCount || '0'} views •{' '}
                                {new Date(video.snippet.publishedAt).toLocaleDateString()}
                              </Typography>
                            </div>
                            <IconButton size="small">
                              <MoreVert />
                            </IconButton>
                          </CardContent>
                          <Box sx={{ padding: '8px', display: 'flex', gap: '8px' }}>
                            <Button startIcon={<ThumbUp />} onClick={() => handleLikeVideo(video.id.id)}>
                              Like
                            </Button>
                            <Button startIcon={<Comment />} onClick={() => fetchComments(video.id.id)}>
                              Comments
                            </Button>
                          </Box>
                          {comments[video.id.id] && (
                            <Box sx={{ padding: '8px' }}>
                              {comments[video.id.id].map((comment) => (
                                <Typography key={comment.id} variant="body2" sx={{ marginBottom: '8px' }}>
                                  {comment.snippet.topLevelComment.snippet.textDisplay}
                                </Typography>
                              ))}
                              <TextField
                                label="Add a comment"
                                value={newComment}
                                onChange={(e) => setNewComment(e.target.value)}
                                fullWidth
                                margin="normal"
                              />
                              <Button
                                variant="contained"
                                onClick={() => handlePostComment(video.id.id)}
                                disabled={!newComment}
                              >
                                Post
                              </Button>
                            </Box>
                          )}
                        </Card>
                      </Grid>
                    ))}
                  </Grid>
                ) : (
                  <Typography variant="body1" style={{ color: 'rgba(0, 0, 0, 0.6)', marginBottom: '24px' }}>
                    No videos uploaded yet.
                  </Typography>
                )}
                {pageTokens.videos && (
                  <Button
                    onClick={() =>
                      loadMore(
                        'https://www.googleapis.com/youtube/v3/videos?part=snippet,contentDetails,statistics&mine=true',
                        setVideos,
                        'videos'
                      )
                    }
                  >
                    Load More
                  </Button>
                )}

                <Typography variant="h6" style={{ marginTop: '24px', marginBottom: '16px' }}>
                  Trending
                </Typography>
                {trendingVideos.length > 0 ? (
                  <Grid container spacing={2}>
                    {trendingVideos.map((video) => (
                      <Grid item xs={12} sm={6} md={4} key={video.id}>
                        <Card style={{ maxWidth: '345px' }}>
                          <div>
                            <iframe
                              width="100%"
                              height="140"
                              src={`https://www.youtube.com/embed/${video.id}`}
                              title={video.snippet.title}
                              frameBorder="0"
                              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                              allowFullScreen
                              onLoad={() => {
                                if (window.YT && window.YT.Player) {
                                  new window.YT.Player(`player-${video.id}`, {
                                    events: {
                                      onStateChange: (event) => {
                                        if (event.data === window.YT.PlayerState.PLAYING) {
                                          handleVideoPlay(video.id);
                                        }
                                      },
                                      onError: (event) => {
                                        console.error('YouTube Player Error:', event.data);
                                      },
                                    },
                                  });
                                } else {
                                  console.warn('YouTube API not loaded yet for video:', video.id);
                                }
                              }}
                              id={`player-${video.id}`}
                            />
                          </div>
                          <CardContent>
                            <Typography variant="body2" style={{ fontWeight: 'medium' }}>
                              {video.snippet.title}
                            </Typography>
                            <Typography variant="caption" style={{ color: 'rgba(0, 0, 0, 0.6)' }}>
                              {video.snippet.channelTitle} • {video.statistics.viewCount || '0'} views •{' '}
                              {new Date(video.snippet.publishedAt).toLocaleDateString()}
                            </Typography>
                          </CardContent>
                        </Card>
                      </Grid>
                    ))}
                  </Grid>
                ) : (
                  <Typography variant="body1" style={{ color: 'rgba(0, 0, 0, 0.6)', marginBottom: '24px' }}>
                    No trending videos available.
                  </Typography>
                )}
                {pageTokens.trendingVideos && (
                  <Button
                    onClick={() =>
                      loadMore(
                        'https://www.googleapis.com/youtube/v3/videos?part=snippet,contentDetails,statistics&chart=mostPopular&RegionCode=TR',
                        setTrendingVideos,
                        'trendingVideos'
                      )
                    }
                  >
                    Load More
                  </Button>
                )}

                <Typography variant="h6" style={{ marginTop: '24px', marginBottom: '16px' }}>
                  Shorts
                </Typography>
                {shorts.length > 0 ? (
                  <Grid container spacing={2}>
                    {shorts.map((video) => (
                      <Grid item xs={12} sm={6} md={4} key={video.id.videoId}>
                        <Card style={{ maxWidth: '345px' }}>
                          <div>
                            <iframe
                              width="100%"
                              height="140"
                              src={`https://www.youtube.com/embed/${video.id.videoId}`}
                              title={video.snippet.title}
                              frameBorder="0"
                              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                              allowFullScreen
                              onLoad={() => {
                                if (window.YT && window.YT.Player) {
                                  new window.YT.Player(`player-${video.id.videoId}`, {
                                    events: {
                                      onStateChange: (event) => {
                                        if (event.data === window.YT.PlayerState.PLAYING) {
                                          handleVideoPlay(video.id.videoId);
                                        }
                                      },
                                      onError: (event) => {
                                        console.error('YouTube Player Error:', event.data);
                                      },
                                    },
                                  });
                                } else {
                                  console.warn('YouTube API not loaded yet for video:', video.id.videoId);
                                }
                              }}
                              id={`player-${video.id.videoId}`}
                            />
                          </div>
                          <CardContent>
                            <Typography variant="body2" style={{ fontWeight: 'medium' }}>
                              {video.snippet.title}
                            </Typography>
                            <Typography variant="caption" style={{ color: 'rgba(0, 0, 0, 0.6)' }}>
                              {video.snippet.channelTitle} • {new Date(video.snippet.publishedAt).toLocaleDateString()}
                            </Typography>
                          </CardContent>
                        </Card>
                      </Grid>
                    ))}
                  </Grid>
                ) : (
                  <Typography variant="body1" style={{ color: 'rgba(0, 0, 0, 0.6)' }}>
                    No shorts available.
                  </Typography>
                )}
                {pageTokens.shorts && (
                  <Button
                    onClick={() =>
                      loadMore(
                        'https://www.googleapis.com/youtube/v3/search?part=snippet&type=video&videoDuration=short&q=shorts',
                        setShorts,
                        'shorts'
                      )
                    }
                  >
                    Load More
                  </Button>
                )}
              </div>
            ) : tabValue === 1 ? (
              <div>
                {shorts.length > 0 ? (
                  <Grid container spacing={2}>
                    {shorts.map((video) => (
                      <Grid item xs={12} sm={6} md={4} key={video.id.videoId}>
                        <Card style={{ maxWidth: '345px' }}>
                          <div>
                            <iframe
                              width="100%"
                              height="140"
                              src={`https://www.youtube.com/embed/${video.id.videoId}`}
                              title={video.snippet.title}
                              frameBorder="0"
                              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                              allowFullScreen
                              onLoad={() => {
                                if (window.YT && window.YT.Player) {
                                  new window.YT.Player(`player-${video.id.videoId}`, {
                                    events: {
                                      onStateChange: (event) => {
                                        if (event.data === window.YT.PlayerState.PLAYING) {
                                          handleVideoPlay(video.id.videoId);
                                        }
                                      },
                                      onError: (event) => {
                                        console.error('YouTube Player Error:', event.data);
                                      },
                                    },
                                  });
                                } else {
                                  console.warn('YouTube API not loaded yet for video:', video.id.videoId);
                                }
                              }}
                              id={`player-${video.id.videoId}`}
                            />
                          </div>
                          <CardContent>
                            <Typography variant="body2" style={{ fontWeight: 'medium' }}>
                              {video.snippet.title}
                            </Typography>
                            <Typography variant="caption" style={{ color: 'rgba(0, 0, 0, 0.6)' }}>
                              {video.snippet.channelTitle} • {new Date(video.snippet.publishedAt).toLocaleDateString()}
                            </Typography>
                          </CardContent>
                        </Card>
                      </Grid>
                    ))}
                  </Grid>
                ) : (
                  <Typography variant="body1" style={{ color: 'rgba(0, 0, 0, 0.6)' }}>
                    No shorts available.
                  </Typography>
                )}
                {pageTokens.shorts && (
                  <Button
                    onClick={() =>
                      loadMore(
                        'https://www.googleapis.com/youtube/v3/search?part=snippet&type=video&videoDuration=short&q=shorts',
                        setShorts,
                        'shorts'
                      )
                    }
                  >
                    Load More
                  </Button>
                )}
              </div>
            ) : tabValue === 2 ? (
              <div>
                {subscriptionFeed.length > 0 ? (
                  <Grid container spacing={2}>
                    {subscriptionFeed.map((video) => (
                      <Grid item xs={12} sm={6} md={4} key={video.id.videoId}>
                        <Card style={{ maxWidth: '345px' }}>
                          <div>
                            <iframe
                              width="100%"
                              height="140"
                              src={`https://www.youtube.com/embed/${video.id.videoId}`}
                              title={video.snippet.title}
                              frameBorder="0"
                              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                              allowFullScreen
                              onLoad={() => {
                                if (window.YT && window.YT.Player) {
                                  new window.YT.Player(`player-${video.id.videoId}`, {
                                    events: {
                                      onStateChange: (event) => {
                                        if (event.data === window.YT.PlayerState.PLAYING) {
                                          handleVideoPlay(video.id.videoId);
                                        }
                                      },
                                      onError: (event) => {
                                        console.error('YouTube Player Error:', event.data);
                                      },
                                    },
                                  });
                                } else {
                                  console.warn('YouTube API not loaded yet for video:', video.id.videoId);
                                }
                              }}
                              id={`player-${video.id.videoId}`}
                            />
                          </div>
                          <CardContent>
                            <Typography variant="body2" style={{ fontWeight: 'medium' }}>
                              {video.snippet.title}
                            </Typography>
                            <Typography variant="caption" style={{ color: 'rgba(0, 0, 0, 0.6)' }}>
                              {video.snippet.channelTitle} • {new Date(video.snippet.publishedAt).toLocaleDateString()}
                            </Typography>
                          </CardContent>
                        </Card>
                      </Grid>
                    ))}
                  </Grid>
                ) : (
                  <Typography variant="body1" style={{ color: 'rgba(0, 0, 0, 0.6)' }}>
                    No recent videos from your subscriptions.
                  </Typography>
                )}
                {pageTokens.subscriptionFeed && (
                  <Button onClick={() => loadMore(null, setSubscriptionFeed, 'subscriptionFeed')}>
                    Load More
                  </Button>
                )}
              </div>
            ) : tabValue === 3 ? (
              <div>
                {history.length > 0 ? (
                  <Grid container spacing={2}>
                    {history.map((video) => (
                      <Grid item xs={12} sm={6} md={4} key={video.id}>
                        <Card style={{ maxWidth: '345px' }}>
                          <div>
                            <iframe
                              width="100%"
                              height="140"
                              src={`https://www.youtube.com/embed/${video.id}`}
                              title={video.snippet.title}
                              frameBorder="0"
                              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                              allowFullScreen
                              onLoad={() => {
                                if (window.YT && window.YT.Player) {
                                  new window.YT.Player(`player-${video.id}`, {
                                    events: {
                                      onStateChange: (event) => {
                                        if (event.data === window.YT.PlayerState.PLAYING) {
                                          handleVideoPlay(video.id);
                                        }
                                      },
                                      onError: (event) => {
                                        console.error('YouTube Player Error:', event.data);
                                      },
                                    },
                                  });
                                } else {
                                  console.warn('YouTube API not loaded yet for video:', video.id);
                                }
                              }}
                              id={`player-${video.id}`}
                            />
                          </div>
                          <CardContent>
                            <Typography variant="body2" style={{ fontWeight: 'medium' }}>
                              {video.snippet.title}
                            </Typography>
                            <Typography variant="caption" style={{ color: 'rgba(0, 0, 0, 0.6)' }}>
                              {video.snippet.channelTitle} • {new Date(video.snippet.publishedAt).toLocaleDateString()}
                            </Typography>
                          </CardContent>
                        </Card>
                      </Grid>
                    ))}
                  </Grid>
                ) : (
                  <Typography variant="body1" style={{ color: 'rgba(0, 0, 0, 0.6)' }}>
                    No watch history available yet. Start watching videos to build your history!
                  </Typography>
                )}
              </div>
            ) : tabValue === 4 ? (
              <div>
                {playlists.length > 0 ? (
                  <Grid container spacing={2}>
                    {playlists.map((playlist) => (
                      <Grid item xs={12} sm={6} md={4} key={playlist.id}>
                        <Card style={{ maxWidth: '345px' }}>
                          <div>
                            <iframe
                              width="100%"
                              height="140"
                              src={`https://www.youtube.com/embed/videoseries?list=${playlist.id}`}
                              title={playlist.snippet.title}
                              frameBorder="0"
                              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                              allowFullScreen
                            />
                          </div>
                          <CardContent>
                            <Typography variant="body2" style={{ fontWeight: 'medium' }}>
                              {playlist.snippet.title}
                            </Typography>
                            <Typography variant="caption" style={{ color: 'rgba(0, 0, 0, 0.6)' }}>
                              {playlist.contentDetails.itemCount} videos
                            </Typography>
                          </CardContent>
                        </Card>
                      </Grid>
                    ))}
                  </Grid>
                ) : (
                  <Typography variant="body1" style={{ color: 'rgba(0, 0, 0, 0.6)' }}>
                    No playlists available.
                  </Typography>
                )}
                {pageTokens.playlists && (
                  <Button
                    onClick={() =>
                      loadMore(
                        'https://www.googleapis.com/youtube/v3/playlists?part=snippet,contentDetails&mine=true',
                        setPlaylists,
                        'playlists'
                      )
                    }
                  >
                    Load More
                  </Button>
                )}
              </div>
            ) : tabValue === 5 ? (
              <div>
                <Typography variant="h6" style={{ marginBottom: '16px' }}>
                  Your Videos
                </Typography>
                {videos.length > 0 ? (
                  <Grid container spacing={2}>
                    {videos.map((video) => (
                      <Grid item xs={12} sm={6} md={4} key={video.id.id}>
                        <Card style={{ maxWidth: '345px' }}>
                          <div>
                            <iframe
                              width="100%"
                              height="140"
                              src={`https://www.youtube.com/embed/${video.id.id}`}
                              title={video.snippet.title}
                              frameBorder="0"
                              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                              allowFullScreen
                              onLoad={() => {
                                if (window.YT && window.YT.Player) {
                                  new window.YT.Player(`player-${video.id.id}`, {
                                    events: {
                                      onStateChange: (event) => {
                                        if (event.data === window.YT.PlayerState.PLAYING) {
                                          handleVideoPlay(video.id.id);
                                        }
                                      },
                                      onError: (event) => {
                                        console.error('YouTube Player Error:', event.data);
                                      },
                                    },
                                  });
                                } else {
                                  console.warn('YouTube API not loaded yet for video:', video.id.id);
                                }
                              }}
                              id={`player-${video.id.id}`}
                            />
                          </div>
                          <CardContent>
                            <Typography variant="body2" style={{ fontWeight: 'medium' }}>
                              {video.snippet.title}
                            </Typography>
                            <Typography variant="caption" style={{ color: 'rgba(0, 0, 0, 0.6)' }}>
                              {video.statistics?.viewCount || '0'} views •{' '}
                              {new Date(video.snippet.publishedAt).toLocaleDateString()}
                            </Typography>
                          </CardContent>
                        </Card>
                      </Grid>
                    ))}
                  </Grid>
                ) : (
                  <Typography variant="body1" style={{ color: 'rgba(0, 0, 0, 0.6)' }}>
                    No videos uploaded yet.
                  </Typography>
                )}
                {pageTokens.videos && (
                  <Button
                    onClick={() =>
                      loadMore(
                        'https://www.googleapis.com/youtube/v3/videos?part=snippet,contentDetails,statistics&mine=true',
                        setVideos,
                        'videos'
                      )
                    }
                  >
                    Load More
                  </Button>
                )}
              </div>
            ) : tabValue === 6 ? (
              <div>
                {watchLater.length > 0 ? (
                  <Grid container spacing={2}>
                    {watchLater.map((item) => (
                      <Grid item xs={12} sm={6} md={4} key={item.id}>
                        <Card style={{ maxWidth: '345px' }}>
                          <div>
                            <iframe
                              width="100%"
                              height="140"
                              src={`https://www.youtube.com/embed/${item.snippet.resourceId.videoId}`}
                              title={item.snippet.title}
                              frameBorder="0"
                              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                              allowFullScreen
                              onLoad={() => {
                                if (window.YT && window.YT.Player) {
                                  new window.YT.Player(`player-${item.snippet.resourceId.videoId}`, {
                                    events: {
                                      onStateChange: (event) => {
                                        if (event.data === window.YT.PlayerState.PLAYING) {
                                          handleVideoPlay(item.snippet.resourceId.videoId);
                                        }
                                      },
                                      onError: (event) => {
                                        console.error('YouTube Player Error:', event.data);
                                      },
                                    },
                                  });
                                } else {
                                  console.warn('YouTube API not loaded yet for video:', item.snippet.resourceId.videoId);
                                }
                              }}
                              id={`player-${item.snippet.resourceId.videoId}`}
                            />
                          </div>
                          <CardContent>
                            <Typography variant="body2" style={{ fontWeight: 'medium' }}>
                              {item.snippet.title}
                            </Typography>
                            <Typography variant="caption" style={{ color: 'rgba(0, 0, 0, 0.6)' }}>
                              {item.snippet.channelTitle} • {new Date(item.snippet.publishedAt).toLocaleDateString()}
                            </Typography>
                          </CardContent>
                        </Card>
                      </Grid>
                    ))}
                  </Grid>
                ) : (
                  <Typography variant="body1" style={{ color: 'rgba(0, 0, 0, 0.6)' }}>
                    No watch later videos available.
                  </Typography>
                )}
                {pageTokens.watchLater && (
                  <Button
                    onClick={() =>
                      loadMore(
                        'https://www.googleapis.com/youtube/v3/playlistItems?part=snippet&playlistId=WL',
                        setWatchLater,
                        'watchLater'
                      )
                    }
                  >
                    Load More
                  </Button>
                )}
              </div>
            ) : tabValue === 7 ? (
              <div>
                {likedVideos.length > 0 ? (
                  <Grid container spacing={2}>
                    {likedVideos.map((video) => (
                      <Grid item xs={12} sm={6} md={4} key={video.id}>
                        <Card style={{ maxWidth: '345px' }}>
                          <div>
                            <iframe
                              width="100%"
                              height="140"
                              src={`https://www.youtube.com/embed/${video.id}`}
                              title={video.snippet.title}
                              frameBorder="0"
                              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                              allowFullScreen
                              onLoad={() => {
                                if (window.YT && window.YT.Player) {
                                  new window.YT.Player(`player-${video.id}`, {
                                    events: {
                                      onStateChange: (event) => {
                                        if (event.data === window.YT.PlayerState.PLAYING) {
                                          handleVideoPlay(video.id);
                                        }
                                      },
                                      onError: (event) => {
                                        console.error('YouTube Player Error:', event.data);
                                      },
                                    },
                                  });
                                } else {
                                  console.warn('YouTube API not loaded yet for video:', video.id);
                                }
                              }}
                              id={`player-${video.id}`}
                            />
                          </div>
                          <CardContent>
                            <Typography variant="body2" style={{ fontWeight: 'medium' }}>
                              {video.snippet.title}
                            </Typography>
                            <Typography variant="caption" style={{ color: 'rgba(0, 0, 0, 0.6)' }}>
                              {video.statistics.viewCount || '0'} views •{' '}
                              {new Date(video.snippet.publishedAt).toLocaleDateString()}
                            </Typography>
                          </CardContent>
                        </Card>
                      </Grid>
                    ))}
                  </Grid>
                ) : (
                  <Typography variant="body1" style={{ color: 'rgba(0, 0, 0, 0.6)' }}>
                    No liked videos available.
                  </Typography>
                )}
                {pageTokens.likedVideos && (
                  <Button
                    onClick={() =>
                      loadMore(
                        'https://www.googleapis.com/youtube/v3/videos?part=snippet,contentDetails,statistics&myRating=like',
                        setLikedVideos,
                        'likedVideos'
                      )
                    }
                  >
                    Load More
                  </Button>
                )}
              </div>
            ) : tabValue === 8 ? (
              <div>
                <Typography variant="body1" style={{ color: 'rgba(0, 0, 0, 0.6)' }}>
                  Posts section coming soon...
                </Typography>
              </div>
            ) : tabValue === 9 ? (
              <div>
                {Object.keys(subscriptionVideos).length > 0 ? (
                  Object.entries(subscriptionVideos).map(([channelId, videos]) => (
                    <div key={channelId}>
                      <Typography variant="h6" style={{ marginBottom: '16px' }}>
                        Videos from{' '}
                        {subscriptions.find((sub) => sub.snippet.resourceId.channelId === channelId)?.snippet.title ||
                          'Unknown Channel'}
                      </Typography>
                      {videos.length > 0 ? (
                        <Grid container spacing={2}>
                          {videos.map((video) => (
                            <Grid item xs={12} sm={6} md={4} key={video.id.videoId}>
                              <Card style={{ maxWidth: '345px' }}>
                                <div>
                                  <iframe
                                    width="100%"
                                    height="140"
                                    src={`https://www.youtube.com/embed/${video.id.videoId}`}
                                    title={video.snippet.title}
                                    frameBorder="0"
                                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                    allowFullScreen
                                    onLoad={() => {
                                      if (window.YT && window.YT.Player) {
                                        new window.YT.Player(`player-${video.id.videoId}`, {
                                          events: {
                                            onStateChange: (event) => {
                                              if (event.data === window.YT.PlayerState.PLAYING) {
                                                handleVideoPlay(video.id.videoId);
                                              }
                                            },
                                            onError: (event) => {
                                              console.error('YouTube Player Error:', event.data);
                                            },
                                          },
                                        });
                                      } else {
                                        console.warn('YouTube API not loaded yet for video:', video.id.videoId);
                                      }
                                    }}
                                    id={`player-${video.id.videoId}`}
                                  />
                                </div>
                                <CardContent>
                                  <Typography variant="body2" style={{ fontWeight: 'medium' }}>
                                    {video.snippet.title}
                                  </Typography>
                                  <Typography variant="caption" style={{ color: 'rgba(0, 0, 0, 0.6)' }}>
                                    {video.snippet.channelTitle} •{' '}
                                    {new Date(video.snippet.publishedAt).toLocaleDateString()}
                                  </Typography>
                                </CardContent>
                              </Card>
                            </Grid>
                          ))}
                        </Grid>
                      ) : (
                        <Typography variant="body1" style={{ color: 'rgba(0, 0, 0, 0.6)' }}>
                          No videos available for this channel.
                        </Typography>
                      )}
                      {pageTokens[channelId] && (
                        <Button
                          onClick={() =>
                            loadMore(
                              `https://www.googleapis.com/youtube/v3/search?part=snippet&channelId=${channelId}&type=video&order=date`,
                              (prev) =>
                                setSubscriptionVideos((state) => ({
                                  ...state,
                                  [channelId]: [...state[channelId], ...(prev.items || [])],
                                })),
                              channelId
                            )
                          }
                        >
                          Load More
                        </Button>
                      )}
                    </div>
                  ))
                ) : (
                  <Typography variant="body1" style={{ color: 'rgba(0, 0, 0, 0.6)' }}>
                    Select a subscription from the sidebar to view videos.
                  </Typography>
                )}
              </div>
            ) : null}
          </div>
        </div>
      </Container>
    </div>
  );
};

export default YoutubeProfile;