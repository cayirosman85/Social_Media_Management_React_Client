import React from 'react';
import {
  Drawer,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Collapse,
  Typography,
  Grid,
  Checkbox,
  IconButton,
} from '@mui/material';
import { logout } from '../../api/auth/logout';
import localStorage from 'local-storage';
import {
  ExpandLess,
  ExpandMore,
  Instagram,
  Person,
  Tv,
  InsertChart,
  PhotoCamera,
  CalendarToday,
  Visibility,
  Terrain,
  YouTube,
} from '@mui/icons-material';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import largeLogo from '../../assets/images/linkedin-banner.jpg';
import smallLogo from '../../assets/images/small-linkedin-logo.jpg';
import LogoutOutlinedIcon from '@mui/icons-material/LogoutOutlined';
import { Home, Files, Login, BrandYoutube } from 'tabler-icons-react';
import { useSidebar } from '../../context/SidebarContext';
import FacebookLogin from 'react-facebook-login';

const menuItems = [
  { text: 'Profile', icon: <Home size={22} />, path: '/homepage' },
  { text: 'Clients', icon: <Files size={22} />, path: '/user/gridPage' },
  { text: 'Social Medias', header: true },
  {
    text: 'Instagram',
    icon: <Instagram size={22} />,
    subItems: [
      { text: 'Profile', icon: <Person size={22} />, path: '/Profile' },
      { text: 'Posts', icon: <InsertChart size={22} />, path: '/posts' },
      { text: 'Hashtags', icon: <Terrain size={22} />, path: '/hashtags' },
      { text: 'Stories', icon: <PhotoCamera size={22} />, path: '/stories' },
      { text: 'Ads', icon: <Tv size={22} />, path: '/ads' },
      { text: 'Insights', icon: <Visibility size={22} />, path: '/insights' },
      { text: 'Schedule', icon: <CalendarToday size={22} />, path: '/schedule' },
      { text: 'Login', icon: <Login size={22} />, path: '/FacebookLogin' },
    ],
  },
  {
    text: 'Youtube',
    icon: <YouTube size={22} />,
    subItems: [
      { text: 'Profile', icon: <Person size={22} />, path: '/Profile' },
      { text: 'Posts', icon: <InsertChart size={22} />, path: '/posts' },
      { text: 'Shorts', icon: <BrandYoutube size={22} />, path: '/shorts' },
      { text: 'Ads', icon: <Tv size={22} />, path: '/ads' },
      { text: 'Insights', icon: <Visibility size={22} />, path: '/insights' },
      { text: 'Schedule', icon: <CalendarToday size={22} />, path: '/schedule' },
      { text: 'Login', icon: <Login size={22} />, path: '/YoutubeLogin' },
    ],
  },
  { text: 'Logout', icon: <LogoutOutlinedIcon size={22} />, action: logout, path: '/login' },
];

const Sidebar = () => {
  const { sidebarOpen, toggleSidebar } = useSidebar();
  const [isHovered, setIsHovered] = React.useState(true);
  const [openSubMenu, setOpenSubMenu] = React.useState({});
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState(null);
  const navigate = useNavigate();
  const location = useLocation();

  const facebookAppId = '1936737430086867';
  const facebookAppSecret = 'd3d576725b8470849808a68eca9c9b75'; // WARNING: Move to server-side in production!

  // Handle Google Login by redirecting to the server-side endpoint
  const handleGoogleLogin = () => {
    console.log('Google Login button clicked');
    // Redirect to the .NET server's login endpoint
    window.location.href = 'https://localhost:7099/api/GoogleAuth/login';
  };

  // Handle the callback from the server (after token exchange)
  React.useEffect(() => {
    const query = new URLSearchParams(location.search);
    const accessToken = query.get('access_token');
    const refreshToken = query.get('refresh_token');
    const expiresIn = query.get('expires_in');

    if (accessToken) {
      console.log('Access token received:', accessToken);
      localStorage.set('youtubeAccessToken', accessToken);
      if (refreshToken) localStorage.set('youtubeRefreshToken', refreshToken);
      if (expiresIn) localStorage.set('youtubeTokenExpiresIn', expiresIn);
      fetchYoutubeData(accessToken);
    }
  }, [location]);

  // Fetch YouTube Data
  const fetchYoutubeData = async (accessToken) => {
    setLoading(true);
    setError(null);
    try {
      console.log('Fetching YouTube data with token:', accessToken);
      const response = await fetch(
        'https://www.googleapis.com/youtube/v3/channels?part=snippet,statistics&mine=true',
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );
      const data = await response.json();
      if (data.error) {
        throw new Error(data.error.message);
      }
      if (data.items && data.items.length > 0) {
        const channel = data.items[0];
        localStorage.set('youtubeChannelId', channel.id);
        localStorage.set('youtubeUsername', channel.snippet.title);
        navigate('/Profile');
      } else {
        throw new Error('No YouTube channels found.');
      }
    } catch (error) {
      console.error('Error fetching YouTube data:', error);
      setError('Failed to connect to YouTube. Please log in again.');
      localStorage.remove('youtubeAccessToken');
      localStorage.remove('youtubeChannelId');
      localStorage.remove('youtubeUsername');
      navigate('/YoutubeLogin');
    } finally {
      setLoading(false);
    }
  };

  // Facebook Token Validation
  const validateFacebookToken = async (accessToken) => {
    try {
      console.log('Validating Facebook access token:', accessToken);
      const response = await fetch(
        `https://graph.facebook.com/debug_token?input_token=${accessToken}&access_token=${facebookAppId}|${facebookAppSecret}`
      );
      const data = await response.json();
      if (data.data && data.data.is_valid) {
        const grantedScopes = data.data.scopes || [];
        const requiredScopes = [
          'public_profile',
          'email',
          'pages_show_list',
          'instagram_basic',
          'instagram_manage_comments',
          'instagram_content_publish',
          'instagram_manage_insights',
          'pages_manage_metadata',
          'pages_read_engagement',
          'pages_read_user_content',
        ];
        const missingScopes = requiredScopes.filter((scope) => !grantedScopes.includes(scope));
        if (missingScopes.length > 0) {
          throw new Error(`Missing permissions: ${missingScopes.join(', ')}. Please reauthorize the app.`);
        }
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error validating Facebook token:', error);
      setError(error.message || 'Error validating token. Please try again.');
      return false;
    }
  };

  // Facebook Long-Lived Token Exchange
  const exchangeForLongLivedFacebookToken = async (shortLivedToken) => {
    try {
      console.log('Exchanging Facebook short-lived token:', shortLivedToken);
      const response = await fetch(
        `https://graph.facebook.com/v18.0/oauth/access_token?grant_type=fb_exchange_token&client_id=${facebookAppId}&client_secret=${facebookAppSecret}&fb_exchange_token=${shortLivedToken}`
      );
      const data = await response.json();
      if (data.access_token) {
        return data.access_token;
      }
      throw new Error('Failed to exchange token');
    } catch (error) {
      console.error('Error exchanging Facebook token:', error);
      return null;
    }
  };

  // Facebook Login Response Handler
  const responseFacebook = async (response) => {
    console.log('Facebook Response from Sidebar:', response);
    if (response.accessToken) {
      setLoading(true);
      setError(null);
      const longLivedToken = await exchangeForLongLivedFacebookToken(response.accessToken);
      if (longLivedToken) {
        localStorage.set('facebookAccessToken', longLivedToken);
        const isValid = await validateFacebookToken(longLivedToken);
        if (isValid) {
          fetchInstagramData(longLivedToken);
        } else {
          setError('Token validation failed. Please check permissions and try again.');
          setLoading(false);
        }
      } else {
        setError('Failed to obtain a valid session. Please try again.');
        setLoading(false);
      }
    } else {
      setError('No access token received from Facebook login.');
    }
  };

  // Fetch Instagram Data
  const fetchInstagramData = async (accessToken) => {
    setLoading(true);
    setError(null);
    try {
      const isValid = await validateFacebookToken(accessToken);
      if (!isValid) throw new Error('Invalid or expired token');

      const pagesResponse = await fetch(
        `https://graph.facebook.com/v18.0/me/accounts?access_token=${accessToken}&app_id=${facebookAppId}`
      );
      const pagesData = await pagesResponse.json();
      if (pagesData.data && pagesData.data.length > 0) {
        const pageId = pagesData.data[0].id;
        const igResponse = await fetch(
          `https://graph.facebook.com/v18.0/${pageId}?fields=instagram_business_account&access_token=${accessToken}&app_id=${facebookAppId}`
        );
        const igData = await igResponse.json();
        if (igData.instagram_business_account) {
          const instagramBusinessId = igData.instagram_business_account.id;
          localStorage.set('userId', instagramBusinessId);
          fetchInstagramUser(instagramBusinessId, accessToken);
        } else {
          throw new Error('No Instagram Business Account linked to this page.');
        }
      } else {
        throw new Error('No Facebook pages found for this user.');
      }
    } catch (error) {
      console.error('Error fetching Instagram data:', error);
      setError('Failed to connect to Instagram. Please log in again.');
      localStorage.remove('facebookAccessToken');
      localStorage.remove('userId');
      localStorage.remove('username');
      navigate('/FacebookLogin');
    } finally {
      setLoading(false);
    }
  };

  // Fetch Instagram User Data
  const fetchInstagramUser = async (instagramBusinessId, accessToken) => {
    try {
      const response = await fetch(
        `https://graph.facebook.com/v18.0/${instagramBusinessId}?fields=username,followers_count,media_count,follows_count,name,biography&access_token=${accessToken}&app_id=${facebookAppId}`
      );
      const data = await response.json();
      if (data.error && data.error.code === 190) {
        setError('Your session has expired. Please log in again.');
        localStorage.remove('facebookAccessToken');
        localStorage.remove('userId');
        localStorage.remove('username');
        navigate('/FacebookLogin');
        return;
      }
      localStorage.set('username', data.username);
      navigate('/Profile');
    } catch (error) {
      console.error('Error fetching Instagram user data:', error);
      setError('Failed to fetch Instagram user data. Please try again.');
    }
  };

  const handleMouseEnter = () => {
    if (!sidebarOpen) setIsHovered(true);
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
  };

  const handleSubMenuToggle = (text) => {
    setOpenSubMenu((prevState) => ({
      ...prevState,
      [text]: !prevState[text],
    }));
  };

  const drawerWidth = sidebarOpen ? 240 : 60;
  const effectiveWidth = sidebarOpen || isHovered ? 240 : 60;

  const handleItemClick = (item) => {
    if (item.action) {
      item.action();
      localStorage.clear();
    }
    if (item.path) navigate(item.path);
  };

  const renderMenuItem = (item, index) => {
    const isActive = location.pathname === item.path;
    const itemClass = isActive ? 'selected-menu-item' : 'unselected-menu-item';

    if (item.header) {
      return (
        (sidebarOpen || isHovered) && (
          <Typography key={index} variant="overline" sx={{ pl: 2, pt: 2, pb: 1, m: 3 }}>
            {item.text}
          </Typography>
        )
      );
    }

    if (item.subItems) {
      const subItemActive = item.subItems.some((subItem) => location.pathname === subItem.path);
      const subItemClass = subItemActive ? 'selected-menu-item' : 'unselected-menu-item';

      return (
        <React.Fragment key={item.text}>
          <ListItem
            button
            onClick={() => handleSubMenuToggle(item.text)}
            className={subItemClass}
            sx={{ mt: 0.3, mb: 0.3 }}
          >
            <ListItemIcon>{item.icon}</ListItemIcon>
            {(sidebarOpen || isHovered) && (
              <>
                <ListItemText primary={item.text} />
                {openSubMenu[item.text] ? <ExpandLess /> : <ExpandMore />}
              </>
            )}
          </ListItem>
          <Collapse in={openSubMenu[item.text]} timeout="auto" unmountOnExit>
            <List component="div" disablePadding>
              {item.subItems.map((subItem, subIndex) => {
                if (subItem.text === 'Login' && item.text === 'Instagram') {
                  return (
                    <ListItem key={subItem.text} sx={{ pl: 4, m: 1, width: '95%' }}>
                      <ListItemIcon>{subItem.icon}</ListItemIcon>
                      {(sidebarOpen || isHovered) && (
                        <FacebookLogin
                          appId={facebookAppId}
                          autoLoad={false}
                          fields="name,email,picture"
                          scope="public_profile,email,pages_show_list,instagram_basic,instagram_manage_comments,instagram_content_publish,instagram_manage_insights,pages_manage_metadata,pages_read_engagement,pages_read_user_content"
                          callback={responseFacebook}
                          cssClass="facebook-login-btn"
                          textButton="Login with Facebook"
                          disabled={loading}
                        />
                      )}
                    </ListItem>
                  );
                }
                if (subItem.text === 'Login' && item.text === 'Youtube') {
                  return (
                    <ListItem
                      button
                      key={subItem.text}
                      sx={{ pl: 4, m: 1, width: '95%' }}
                      onClick={handleGoogleLogin}
                    >
                      <ListItemIcon>{subItem.icon}</ListItemIcon>
                      {(sidebarOpen || isHovered) && <ListItemText primary="Login with Google" />}
                    </ListItem>
                  );
                }
                return (
                  <ListItem
                    button
                    key={subItem.text}
                    component={Link}
                    to={subItem.path}
                    className={location.pathname === subItem.path ? 'selected-menu-item' : 'unselected-menu-item'}
                    sx={{ pl: 4, m: 1, width: '95%' }}
                  >
                    <ListItemIcon>{subItem.icon}</ListItemIcon>
                    <ListItemText primary={subItem.text} />
                  </ListItem>
                );
              })}
            </List>
          </Collapse>
        </React.Fragment>
      );
    }

    return (
      <ListItem
        button
        key={item.text}
        onClick={item.action ? () => handleItemClick(item) : undefined}
        component={item.action ? undefined : Link}
        to={item.action ? undefined : item.path}
        className={itemClass}
        sx={{ mt: 0.3, mb: 0.3 }}
      >
        <ListItemIcon>{item.icon}</ListItemIcon>
        {(sidebarOpen || isHovered) && <ListItemText primary={item.text} />}
      </ListItem>
    );
  };

  return (
    <Drawer
      variant="permanent"
      sx={{
        width: drawerWidth,
        flexShrink: 0,
        '& .MuiDrawer-paper': {
          width: effectiveWidth,
          boxSizing: 'border-box',
          backgroundColor: '#ffffff',
          transition: 'width 0.2s',
          overflowX: 'hidden',
          overflowY: sidebarOpen || isHovered ? '' : 'hidden',
        },
        '& .MuiDrawer-paper::-webkit-scrollbar': {
          width: '0.7vh',
        },
        '& .MuiDrawer-paper::-webkit-scrollbar-thumb': {
          backgroundColor: '#888',
          borderRadius: 10,
        },
      }}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <Grid sx={{ p: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <img
          src={sidebarOpen || isHovered ? largeLogo : smallLogo}
          alt="Logo"
          style={{ height: sidebarOpen ? '40px' : '40px', transition: 'height 0.2s' }}
        />
        <Checkbox
          icon={<IconButton size="small" color="#786af2"><span style={{ fontSize: '1.5rem' }}>◯</span></IconButton>}
          checkedIcon={<IconButton size="small"><span style={{ fontSize: '1.5rem' }}>◉</span></IconButton>}
          checked={sidebarOpen}
          onChange={toggleSidebar}
          onClick={() => localStorage.set('sidebar', `${!sidebarOpen}`)}
          sx={{ '&.Mui-checked': { color: '#7367f0' } }}
        />
      </Grid>
      {loading && <Typography sx={{ p: 2 }}>Loading...</Typography>}
      {error && (
        <Typography color="error" sx={{ p: 2 }}>
          {error}
        </Typography>
      )}
      <List sx={{ m: '2%' }}>{menuItems.map(renderMenuItem)}</List>
    </Drawer>
  );
};

export default Sidebar;