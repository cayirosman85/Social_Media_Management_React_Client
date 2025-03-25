import React, { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import localStorage from 'local-storage';

const authCallback = () => {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // Extract query parameters from the URL
    const query = new URLSearchParams(location.search);
    const accessToken = query.get('access_token');
    const refreshToken = query.get('refresh_token');
    const expiresIn = query.get('expires_in');

    if (accessToken) {
      console.log('Access token received:', accessToken);
      // Save tokens to localStorage
      localStorage.set('youtubeAccessToken', accessToken);
      if (refreshToken) localStorage.set('youtubeRefreshToken', refreshToken);
      if (expiresIn) {
        localStorage.set('youtubeTokenExpiresIn', expiresIn);
        // Store the issuance time (current timestamp in seconds)
        const issuedAt = Math.floor(Date.now() / 1000);
        localStorage.set('youtubeTokenIssuedAt', issuedAt);
      }
      // Redirect to the YouTube profile page
      navigate('/youtube-profile');
    } else {
      console.error('No access token received in callback');
      navigate('/YoutubeLogin'); // Redirect to login page if something goes wrong
    }
  }, [location, navigate]);

  return (
    <div>
      <h2>Processing authentication...</h2>
      <p>Please wait while we redirect you.</p>
    </div>
  );
};

export default authCallback;