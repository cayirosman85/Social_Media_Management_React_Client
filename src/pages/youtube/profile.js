import React, { useEffect, useState, useRef } from 'react';
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
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Checkbox,
  FormControlLabel,
  Paper,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import { MoreVert, ThumbUp, Comment } from '@mui/icons-material';
import ProfileSidebar from '../../components/youtube/ProfileSidebar';
import { Line } from 'react-chartjs-2';
import { Chart as ChartJS, LineElement, PointElement, LinearScale, TimeScale, Title, Tooltip, Legend } from 'chart.js';

// Register Chart.js components
ChartJS.register(LineElement, PointElement, LinearScale, TimeScale, Title, Tooltip, Legend);

// VideoCard component
const VideoCard = ({
  video,
  videoIdKey = 'id',
  onPlay,
  showActions = false,
  fetchComments,
  handleLikeVideo,
  comments = {},
  newComment,
  setNewComment,
  handlePostComment,
}) => {
  const videoId = video[videoIdKey] || video.id.videoId || video.id.id || video.id;
  const playerRef = useRef(null);

  useEffect(() => {
    console.log('Rendering VideoCard for ID:', videoId);
    if (window.YT && window.YT.Player && !playerRef.current) {
      console.log('Initializing YT.Player for', videoId);
      playerRef.current = new window.YT.Player(`player-${videoId}`, {
        events: {
          onReady: () => console.log('Player ready for', videoId),
          onStateChange: (event) => {
            console.log('Player state changed for', videoId, ':', event.data);
            if (event.data === window.YT.PlayerState.PLAYING) {
              onPlay(videoId);
            }
          },
          onError: (event) => console.error('Player error for', videoId, ':', event.data),
        },
      });
    }
  }, [videoId, onPlay]);

  return (
    <Card style={{ maxWidth: '345px' }}>
      <div>
        <iframe
          id={`player-${videoId}`}
          width="100%"
          height="140"
          src={`https://www.youtube.com/embed/${videoId}?enablejsapi=1`}
          title={video.snippet.title}
          frameBorder="0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
      </div>
      <CardContent style={{ display: 'flex', alignItems: 'flex-start', padding: '8px' }}>
        <div style={{ flexGrow: 1 }}>
          <Typography variant="body2" style={{ fontWeight: 'medium' }}>
            {video.snippet.title}
          </Typography>
          <Typography variant="caption" style={{ color: 'rgba(0, 0, 0, 0.6)' }}>
            {video.snippet.channelTitle || 'Your Channel'} •{' '}
            {new Date(video.snippet.publishedAt).toLocaleDateString()}
            {video.statistics?.viewCount && ` • ${video.statistics.viewCount} views`}
          </Typography>
        </div>
        {showActions && (
          <IconButton size="small">
            <MoreVert />
          </IconButton>
        )}
      </CardContent>
      {showActions && (
        <Box sx={{ padding: '8px', display: 'flex', gap: '8px' }}>
          <Button startIcon={<ThumbUp />} onClick={() => handleLikeVideo(videoId)}>
            Like
          </Button>
          <Button startIcon={<Comment />} onClick={() => fetchComments(videoId)}>
            Comments
          </Button>
        </Box>
      )}
      {showActions && comments[videoId] && (
        <Box sx={{ padding: '8px' }}>
          {comments[videoId].map((comment) => (
            <Typography key={comment.id} variant="body2" sx={{ marginBottom: '8px' }}>
              {comment.snippet.topLevelComment.snippet.textDisplay}
            </Typography>
          ))}
          <TextField
            label="Add a comment"
            value={newComment || ''}
            onChange={(e) => setNewComment(e.target.value)}
            fullWidth
            margin="normal"
          />
          <Button
            variant="contained"
            onClick={() => handlePostComment(videoId)}
            disabled={!newComment}
          >
            Post
          </Button>
        </Box>
      )}
    </Card>
  );
};

// YoutubeProfile component
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
  const [apiReady, setApiReady] = useState(false);
  const [uploadTitle, setUploadTitle] = useState('');
  const [uploadDescription, setUploadDescription] = useState('');
  const [uploadFile, setUploadFile] = useState(null);
  const [uploadCategoryId, setUploadCategoryId] = useState('22');
  const [uploadPrivacyStatus, setUploadPrivacyStatus] = useState('private');
  const [isShort, setIsShort] = useState(false);
  const [openUploadDialog, setOpenUploadDialog] = useState(false);
  const [analyticsData, setAnalyticsData] = useState(null);

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

  const categories = [
    { id: '1', name: 'Film & Animation' },
    { id: '2', name: 'Autos & Vehicles' },
    { id: '10', name: 'Music' },
    { id: '15', name: 'Pets & Animals' },
    { id: '17', name: 'Sports' },
    { id: '19', name: 'Travel & Events' },
    { id: '20', name: 'Gaming' },
    { id: '22', name: 'People & Blogs' },
    { id: '23', name: 'Comedy' },
    { id: '24', name: 'Entertainment' },
    { id: '25', name: 'News & Politics' },
    { id: '26', name: 'Howto & Style' },
    { id: '27', name: 'Education' },
    { id: '28', name: 'Science & Technology' },
    { id: '29', name: 'Nonprofits & Activism' },
  ];

  // Load YouTube Iframe API
  useEffect(() => {
    console.log('Checking if YouTube Iframe API is already loaded...');
    if (!window.YT) {
      console.log('Loading YouTube Iframe API script...');
      const tag = document.createElement('script');
      tag.src = 'https://www.youtube.com/iframe_api';
      tag.onerror = () => console.error('Failed to load YouTube Iframe API script');
      const firstScriptTag = document.getElementsByTagName('script')[0];
      firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);

      window.onYouTubeIframeAPIReady = () => {
        console.log('YouTube Iframe API is ready');
        setApiReady(true);
      };
    } else {
      console.log('YouTube Iframe API already loaded');
      setApiReady(true);
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
      console.error('Token refresh error:', err);
      return null;
    }
  };

  // Fetch video details
  const fetchVideoDetails = async (videoIds) => {
    let accessToken = localStorage.get('youtubeAccessToken');
    const refreshToken = localStorage.get('youtubeRefreshToken');
    try {
      console.log('Fetching video details for IDs:', videoIds);
      const response = await fetch(
        `https://www.googleapis.com/youtube/v3/videos?part=snippet&id=${videoIds.join(',')}`,
        { headers: { Authorization: `Bearer ${accessToken}` } }
      );
      if (!response.ok) {
        if (response.status === 401) {
          console.log('Access token expired, refreshing...');
          accessToken = await refreshAccessToken(refreshToken);
          if (!accessToken) throw new Error('Token refresh failed');
          return fetchVideoDetails(videoIds);
        }
        const data = await response.json();
        throw new Error(data.error?.message || 'Failed to fetch video details');
      }
      const data = await response.json();
      console.log('Fetched video details:', data.items);
      return data.items || [];
    } catch (err) {
      console.error('Error fetching video details:', err.message);
      if (err.message.includes('quota')) setError('YouTube API quota exceeded. History may be incomplete.');
      else setError(`Failed to fetch video details: ${err.message}`);
      return [];
    }
  };

  // Initialize history from localStorage
  useEffect(() => {
    console.log('Initializing history from localStorage...');
    const storedHistory = JSON.parse(localStorage.get('watchedVideos') || '[]');
    console.log('Stored history IDs:', storedHistory);
    if (storedHistory.length > 0) {
      fetchVideoDetails(storedHistory).then((videoDetails) => {
        setHistory(videoDetails.filter((v) => v));
        console.log('Loaded history into state:', videoDetails);
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
          const profileResponse = await fetch('https://localhost:7099/api/GoogleAuth/youtube/profile', {
            headers: {
              'X-Access-Token': accessToken,
              'X-Refresh-Token': refreshToken,
            },
          });

          if (!profileResponse.ok) {
            const errorText = await profileResponse.text();
            throw new Error(`Failed to fetch YouTube profile: ${profileResponse.status} - ${errorText || 'Unknown error'}`);
          }

          const profileData = await profileResponse.json();
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
        setLoading(false);
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

  // Fetch analytics data
  useEffect(() => {
    const fetchAnalytics = async () => {
      let accessToken = localStorage.get('youtubeAccessToken');
      const refreshToken = localStorage.get('youtubeRefreshToken');
      if (!accessToken || !refreshToken || !profile?.id) return;

      try {
        const endDate = new Date().toISOString().split('T')[0]; // Today
        const startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]; // Last 30 days

        const response = await fetch(
          `https://youtubeanalytics.googleapis.com/v2/reports?ids=channel==${profile.id}&startDate=${startDate}&endDate=${endDate}&metrics=views,estimatedMinutesWatched,subscribersGained,subscribersLost,likes,dislikes,comments,shares&dimensions=day&sort=day`,
          {
            headers: { Authorization: `Bearer ${accessToken}` },
          }
        );

        if (!response.ok) {
          if (response.status === 401) {
            accessToken = await refreshAccessToken(refreshToken);
            if (!accessToken) throw new Error('Token refresh failed');
            return fetchAnalytics();
          }
          const data = await response.json();
          throw new Error(data.error?.message || 'Failed to fetch analytics');
        }

        const data = await response.json();
        console.log('Analytics data:', data);
        setAnalyticsData(data);
        console.log('Analytics data fetched:', data);
      } catch (err) {
        console.error('Error fetching analytics:', err.message);
        if (err.message.includes('quota')) {
          setError('YouTube Analytics API quota exceeded. Analytics unavailable.');
        } else {
          setError(`Failed to fetch analytics: ${err.message}`);
        }
      }
    };

    if (profile?.id) fetchAnalytics();
  }, [profile]);

  // Upload video or short
  const handleVideoUpload = async () => {
    if (!uploadTitle || !uploadFile) {
      setError('Title and video file are required.');
      return;
    }

    let accessToken = localStorage.get('youtubeAccessToken');
    const refreshToken = localStorage.get('youtubeRefreshToken');

    const validExtensions = ['.mp4', '.mov', '.avi', '.wmv', '.flv', '.3gp', '.webm', '.mpeg', '.mpg'];
    const ext = uploadFile.name.slice(uploadFile.name.lastIndexOf('.')).toLowerCase();
    if (!validExtensions.includes(ext)) {
      setError('Unsupported video format. Please use MP4, MOV, AVI, WMV, FLV, 3GP, WebM, or MPEG.');
      return;
    }

    const metadata = {
      title: uploadTitle,
      description: uploadDescription,
      tags: isShort ? ['shorts'] : [],
      categoryId: uploadCategoryId,
      privacyStatus: uploadPrivacyStatus,
    };

    const formData = new FormData();
    formData.append('metadata', JSON.stringify(metadata));
    formData.append('video', uploadFile);

    try {
      const response = await fetch('https://localhost:7099/api/Youtube/upload', {
        method: 'POST',
        headers: {
          'X-Access-Token': accessToken,
          'X-Refresh-Token': refreshToken,
        },
        body: formData,
      });

      if (!response.ok) {
        const data = await response.json();
        if (response.status === 401) {
          setError('Authentication failed. Please log in again.');
          navigate('/YoutubeLogin');
          return;
        }
        throw new Error(data.error?.message || 'Failed to upload video');
      }

      const data = await response.json();
      console.log('Video uploaded:', data);

      if (isShort) {
        setShorts((prev) => [data, ...prev]);
      } else {
        setVideos((prev) => [data, ...prev]);
      }

      setUploadTitle('');
      setUploadDescription('');
      setUploadFile(null);
      setUploadCategoryId('22');
      setUploadPrivacyStatus('private');
      setIsShort(false);
      setError(null);
      setOpenUploadDialog(false);
      alert('Video uploaded successfully!');
    } catch (err) {
      console.error('Error uploading video:', err.message);
      if (err.message.includes('quota')) {
        setError('YouTube API quota exceeded. Video upload failed.');
      } else {
        setError(`Failed to upload video: ${err.message}`);
      }
    }
  };

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

  const handleVideoPlay = (videoId) => {
    console.log('Video played:', videoId);
    const storedHistory = JSON.parse(localStorage.get('watchedVideos') || '[]');
    if (!storedHistory.includes(videoId)) {
      storedHistory.unshift(videoId);
      const limitedHistory = storedHistory.slice(0, 50);
      localStorage.set('watchedVideos', JSON.stringify(limitedHistory));
      console.log('Updated localStorage with watchedVideos:', limitedHistory);
      fetchVideoDetails([videoId]).then((videoDetails) => {
        if (videoDetails.length > 0) {
          setHistory((prev) => {
            const updatedHistory = [videoDetails[0], ...prev.filter((v) => v.id !== videoId)];
            console.log('Updated history state:', updatedHistory);
            return updatedHistory.slice(0, 50);
          });
        } else {
          console.log('No video details returned for', videoId);
        }
      });
    } else {
      console.log('Video', videoId, 'already in history, skipping...');
    }
  };

  if (loading || !apiReady) {
    return (
      <Container>
        <Typography variant="h6">Loading YouTube profile...</Typography>
      </Container>
    );
  }

  const snippet = profile?.snippet || { title: 'Your Channel', thumbnails: { high: { url: '' } } };
  const statistics = profile?.statistics || { subscriberCount: '0', videoCount: '0' };

  // Chart data for analytics
  const chartData = analyticsData && analyticsData.rows ? {
    labels: analyticsData.rows.map(row => row[0]), // Dates
    datasets: [
      {
        label: 'Views',
        data: analyticsData.rows.map(row => row[1]),
        borderColor: '#FF0000',
        fill: false,
      },
      {
        label: 'Watch Time (Minutes)',
        data: analyticsData.rows.map(row => row[2]),
        borderColor: '#00FF00',
        fill: false,
      },
    ],
  } : null;

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

            <Box sx={{ mb: 3 }}>
              <Button
                variant="contained"
                color="primary"
                onClick={() => setOpenUploadDialog(true)}
                sx={{ borderRadius: '20px', textTransform: 'none' }}
              >
                Create a Video or Short
              </Button>
            </Box>

            <Dialog open={openUploadDialog} onClose={() => setOpenUploadDialog(false)} maxWidth="sm" fullWidth>
              <DialogTitle>Create a Video or Short</DialogTitle>
              <DialogContent>
                <Grid container spacing={2}>
                  <Grid item xs={12}>
                    <TextField
                      label="Title"
                      value={uploadTitle}
                      onChange={(e) => setUploadTitle(e.target.value)}
                      fullWidth
                      variant="outlined"
                      required
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <TextField
                      label="Description"
                      value={uploadDescription}
                      onChange={(e) => setUploadDescription(e.target.value)}
                      fullWidth
                      variant="outlined"
                      multiline
                      rows={3}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <FormControl fullWidth variant="outlined">
                      <InputLabel>Category</InputLabel>
                      <Select
                        value={uploadCategoryId}
                        onChange={(e) => setUploadCategoryId(e.target.value)}
                        label="Category"
                      >
                        {categories.map((cat) => (
                          <MenuItem key={cat.id} value={cat.id}>
                            {cat.name}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <FormControl fullWidth variant="outlined">
                      <InputLabel>Privacy</InputLabel>
                      <Select
                        value={uploadPrivacyStatus}
                        onChange={(e) => setUploadPrivacyStatus(e.target.value)}
                        label="Privacy"
                      >
                        <MenuItem value="public">Public</MenuItem>
                        <MenuItem value="private">Private</MenuItem>
                        <MenuItem value="unlisted">Unlisted</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid item xs={12}>
                    <Button
                      variant="outlined"
                      component="label"
                      fullWidth
                      sx={{ py: 1.5, textTransform: 'none', borderStyle: 'dashed' }}
                    >
                      {uploadFile ? uploadFile.name : 'Select Video File'}
                      <input
                        type="file"
                        accept="video/mp4,video/quicktime,video/x-msvideo,video/x-ms-wmv,video/x-flv,video/3gpp,video/webm,video/mpeg"
                        hidden
                        onChange={(e) => setUploadFile(e.target.files[0])}
                      />
                    </Button>
                  </Grid>
                  <Grid item xs={12}>
                    <FormControlLabel
                      control={<Checkbox checked={isShort} onChange={(e) => setIsShort(e.target.checked)} />}
                      label="Upload as Short"
                    />
                  </Grid>
                </Grid>
              </DialogContent>
              <DialogActions>
                <Button onClick={() => setOpenUploadDialog(false)} color="secondary">
                  Cancel
                </Button>
                <Button
                  onClick={handleVideoUpload}
                  color="primary"
                  variant="contained"
                  disabled={!uploadTitle || !uploadFile}
                >
                  Upload Video
                </Button>
              </DialogActions>
            </Dialog>

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

            <Tabs value={tabValue}   variant="scrollable"
  scrollButtons="auto"
  onChange={(e, newValue) => setTabValue(newValue)} sx={{ marginBottom: '16px' }}>
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
              <Tab label="Analytics" />

            </Tabs>

            {tabValue === -1 && searchResults.length > 0 ? (
              <div>
                <Typography variant="h6" style={{ marginBottom: '16px' }}>
                  Search Results for "{searchQuery}"
                </Typography>
                <Grid container spacing={2}>
                  {searchResults.map((video) => (
                    <Grid item xs={12} sm={6} md={4} key={video.id.videoId}>
                      <VideoCard video={video} videoIdKey="id.videoId" onPlay={handleVideoPlay} />
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
                      <Grid item xs={12} sm={6} md={4} key={video.id}>
                        <VideoCard
                          video={video}
                          videoIdKey="id"
                          onPlay={handleVideoPlay}
                          showActions={true}
                          fetchComments={fetchComments}
                          handleLikeVideo={handleLikeVideo}
                          comments={comments}
                          newComment={newComment}
                          setNewComment={setNewComment}
                          handlePostComment={handlePostComment}
                        />
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
                        <VideoCard video={video} onPlay={handleVideoPlay} />
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
                      <Grid item xs={12} sm={6} md={4} key={video.id}>
                        <VideoCard video={video} videoIdKey="id" onPlay={handleVideoPlay} />
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
                      <Grid item xs={12} sm={6} md={4} key={video.id}>
                        <VideoCard video={video} videoIdKey="id" onPlay={handleVideoPlay} />
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
                        <VideoCard video={video} videoIdKey="id.videoId" onPlay={handleVideoPlay} />
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
                        <VideoCard video={video} onPlay={handleVideoPlay} />
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
                      <Grid item xs={12} sm={6} md={4} key={video.id}>
                        <VideoCard video={video} videoIdKey="id" onPlay={handleVideoPlay} />
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
                      <Grid item xs={12} sm={6} md={4} key={item.snippet.resourceId.videoId}>
                        <VideoCard video={item} videoIdKey="snippet.resourceId.videoId" onPlay={handleVideoPlay} />
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
                        <VideoCard video={video} onPlay={handleVideoPlay} />
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
                              <VideoCard video={video} videoIdKey="id.videoId" onPlay={handleVideoPlay} />
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
            ) : tabValue === 10 ? (
              <div>
                <Typography variant="h6" style={{ marginBottom: '16px' }}>
                  Channel Analytics (Last 30 Days)
                </Typography>
                {analyticsData && analyticsData.rows ? (
                  <Box>
                    <Grid container spacing={2}>
                      <Grid item xs={12} sm={6} md={3}>
                        <Card>
                          <CardContent>
                            <Typography variant="body2" color="textSecondary">
                              Total Views
                            </Typography>
                            <Typography variant="h5">
                              {analyticsData.rows.reduce((sum, row) => sum + row[1], 0)}
                            </Typography>
                          </CardContent>
                        </Card>
                      </Grid>
                      <Grid item xs={12} sm={6} md={3}>
                        <Card>
                          <CardContent>
                            <Typography variant="body2" color="textSecondary">
                              Watch Time (Minutes)
                            </Typography>
                            <Typography variant="h5">
                              {analyticsData.rows.reduce((sum, row) => sum + row[2], 0)}
                            </Typography>
                          </CardContent>
                        </Card>
                      </Grid>
                      <Grid item xs={12} sm={6} md={3}>
                        <Card>
                          <CardContent>
                            <Typography variant="body2" color="textSecondary">
                              Subscribers Gained
                            </Typography>
                            <Typography variant="h5">
                              {analyticsData.rows.reduce((sum, row) => sum + row[3], 0)}
                            </Typography>
                          </CardContent>
                        </Card>
                      </Grid>
                      <Grid item xs={12} sm={6} md={3}>
                        <Card>
                          <CardContent>
                            <Typography variant="body2" color="textSecondary">
                              Likes
                            </Typography>
                            <Typography variant="h5">
                              {analyticsData.rows.reduce((sum, row) => sum + row[5], 0)}
                            </Typography>
                          </CardContent>
                        </Card>
                      </Grid>
                    </Grid>
                    <Box sx={{ mt: 3 }}>
                      <Line
                        data={chartData}
                        options={{
                          responsive: true,
                          scales: { x: { type: 'time', time: { unit: 'day' } } },
                          plugins: { legend: { position: 'top' } },
                        }}
                      />
                    </Box>
                  </Box>
                ) : (
                  <Typography variant="body1" style={{ color: 'rgba(0, 0, 0, 0.6)' }}>
                    No analytics data available yet.
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