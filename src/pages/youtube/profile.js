import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import localStorage from 'local-storage';
import {
  Container,
  Typography,
  Avatar,
  Grid,
  Tabs,
  Tab,
  Button,
  Card,
  CardMedia,
  CardContent,
  IconButton,
} from '@mui/material';
import { MoreVert } from '@mui/icons-material'; // Removed MenuIcon
import ProfileSidebar from '../../components/youtube/ProfileSidebar';

const YoutubeProfile = () => {
  const [profile, setProfile] = useState(null);
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [tabValue, setTabValue] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchProfile = async () => {
      const accessToken = localStorage.get('youtubeAccessToken');
      const refreshToken = localStorage.get('youtubeRefreshToken');

      if (!accessToken || !refreshToken) {
        setError('No authentication tokens found. Please log in again.');
        navigate('/YoutubeLogin');
        return;
      }

      try {
        const response = await fetch('https://localhost:7099/api/GoogleAuth/youtube/profile', {
          headers: {
            'X-Access-Token': accessToken,
            'X-Refresh-Token': refreshToken,
          },
        });

        const data = await response.json();
        if (!response.ok) {
          throw new Error(data.error || 'Failed to fetch YouTube profile');
        }

        setProfile(data.channel);
        setVideos(data.videos || []);
        localStorage.set('youtubeChannelId', data.channel.id);
        localStorage.set('youtubeUsername', data.channel.snippet.title);
      } catch (err) {
        console.error('Error fetching YouTube profile:', err);
        setError('Failed to fetch YouTube profile. Please try again.');
        localStorage.remove('youtubeAccessToken');
        localStorage.remove('youtubeRefreshToken');
        localStorage.remove('youtubeChannelId');
        localStorage.remove('youtubeUsername');
        navigate('/YoutubeLogin');
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [navigate]);

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  const handleCustomizeChannel = () => {
    window.open('https://www.youtube.com/customize_channel', '_blank');
  };

  const handleManageVideos = () => {
    window.open('https://studio.youtube.com', '_blank');
  };

  if (loading) {
    return (
      <Container>
        <Typography variant="h6">Loading YouTube profile...</Typography>
      </Container>
    );
  }

  if (error) {
    return (
      <Container>
        <Typography variant="h6" color="error">
          {error}
        </Typography>
      </Container>
    );
  }

  if (!profile) {
    return (
      <Container>
        <Typography variant="h6">No profile data available.</Typography>
      </Container>
    );
  }

  const { snippet, statistics } = profile;

  return (
    <div style={{ flexGrow: 1, padding: '24px' }}>
      <Container style={{ marginTop: '32px', marginBottom: '32px' }}>
        <div style={{ display: 'flex', gap: '24px' }}>
          {/* Profile Sidebar (Left side within main content) */}
          <div style={{ flexShrink: 0 }}>
            <ProfileSidebar />
          </div>

          {/* Profile Content (Right side within main content) */}
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
                  {statistics.videoCount || '0'} {statistics.videoCount === '1' ? 'video' : 'videos'}
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
                  style={{
                    borderRadius: '20px',
                    textTransform: 'none',
                    color: '#000',
                    borderColor: '#ccc',
                  }}
                  onClick={handleManageVideos}
                >
                  Manage videos
                </Button>
              </div>
            </div>

            <div style={{ borderBottom: '1px solid #e0e0e0', marginBottom: '16px' }}>
              <Tabs value={tabValue} onChange={handleTabChange} aria-label="YouTube profile tabs">
                <Tab label="Videos" />
                <Tab label="Posts" />
              </Tabs>
            </div>

            {tabValue === 0 && (
              <div>
                {videos.length > 0 ? (
                  <Grid container spacing={2}>
                    {videos.map((video) => (
                      <Grid item xs={12} sm={6} md={4} key={video.id.id}>
                        <Card style={{ maxWidth: '345px' }}>
                          <CardMedia
                            component="img"
                            height="140"
                            image={video.snippet.thumbnails.medium.url}
                            alt={video.snippet.title}
                          />
                          <CardContent style={{ display: 'flex', alignItems: 'flex-start', padding: '8px' }}>
                            <div style={{ flexGrow: 1 }}>
                              <Typography variant="body2" style={{ fontWeight: 'medium' }}>
                                {video.snippet.title}
                              </Typography>
                              <Typography variant="caption" style={{ color: 'rgba(0, 0, 0, 0.6)' }}>
                                No views •{' '}
                                {new Date(video.snippet.publishedAt).toLocaleDateString()}
                              </Typography>
                            </div>
                            <IconButton size="small">
                              <MoreVert />
                            </IconButton>
                          </CardContent>
                        </Card>
                      </Grid>
                    ))}
                  </Grid>
                ) : (
                  <Typography variant="body1" style={{ color: 'rgba(0, 0, 0, 0.6)' }}>
                    No videos available.
                  </Typography>
                )}
              </div>
            )}

            {tabValue === 1 && (
              <div>
                <Typography variant="body1" style={{ color: 'rgba(0, 0, 0, 0.6)' }}>
                  Posts section coming soon...
                </Typography>
              </div>
            )}
          </div>
        </div>
      </Container>
    </div>
  );
};

export default YoutubeProfile;