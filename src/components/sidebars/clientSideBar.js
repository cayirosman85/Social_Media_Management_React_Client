import React, { useState, useEffect } from 'react';
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
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Button,
  CircularProgress,
  Box,
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
  Facebook as FacebookIcon,
} from '@mui/icons-material';
import { useNavigate, useLocation, Link, useOutletContext } from 'react-router-dom';
import largeLogo from '../../assets/images/linkedin-banner.jpg';
import smallLogo from '../../assets/images/small-linkedin-logo.jpg';
import LogoutOutlinedIcon from '@mui/icons-material/LogoutOutlined';
import { Home, Files, Login, BrandYoutube, Message, Settings } from 'tabler-icons-react';
import { useSidebar } from '../../context/SidebarContext';
import FacebookLogin from 'react-facebook-login';
import { apiFetch } from '../../api/facebook/api';
import { format, differenceInDays } from 'date-fns';

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
      { text: 'Hesap', icon: <Settings size={22} />, path: '/instagram-accounts' },
      { text: 'Login', icon: <Login size={22} />, action: 'facebookLoginInstagram' },
    ],
  },
  {
    text: 'Facebook',
    icon: <FacebookIcon size={22} />,
    subItems: [
      { text: 'Profile', icon: <Person size={22} />, path: '/FacebookProfile' },
      { text: 'Hesap', icon: <Settings size={22} />, path: '/facebook-accounts' },
      { text: 'Login', icon: <Login size={22} />, action: 'facebookLoginPage' },
    ],
  },
  {
    text: 'Youtube',
    icon: <YouTube size={22} />,
    subItems: [
      { text: 'Profile', icon: <Person size={22} />, path: '/youtube-profile' },
      { text: 'Posts', icon: <InsertChart size={22} />, path: '/posts' },
      { text: 'Shorts', icon: <BrandYoutube size={22} />, path: '/shorts' },
      { text: 'Ads', icon: <Tv size={22} />, path: '/ads' },
      { text: 'Insights', icon: <Visibility size={22} />, path: '/insights' },
      { text: 'Schedule', icon: <CalendarToday size={22} />, path: '/schedule' },
      { text: 'Login', icon: <Login size={22} />, action: 'googleLogin' },
    ],
  },
  {
    text: 'Messenger',
    icon: <Message size={22} />,
    subItems: [
      { text: 'Sohbet', icon: <Message size={22} />, path: '/messenger' },
      { text: 'Hesap', icon: <Settings size={22} />, path: '/MessengerAccount' },
    ],
  },
  { text: 'Çıkış Yap', icon: <LogoutOutlinedIcon size={22} />, action: logout, path: '/login' },
];

const Sidebar = () => {
  const { sidebarOpen, toggleSidebar } = useSidebar();
  const [isHovered, setIsHovered] = useState(true);
  const [openSubMenu, setOpenSubMenu] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [accounts, setAccounts] = useState([]);
  const [selectedAccount, setSelectedAccount] = useState(null);
  const [modalLoading, setModalLoading] = useState(false);
  const [modalError, setModalError] = useState('');
  const [loginType, setLoginType] = useState(null); // 'instagram' or 'facebook'
  const [triggerLogin, setTriggerLogin] = useState(false); // Control login flow
  const [showTokenExpiredNotice, setShowTokenExpiredNotice] = useState(false); // Show expiry notice
  const navigate = useNavigate();
  const location = useLocation();
  const context = useOutletContext();
  const setErrorModalMessage = context?.setErrorModalMessage;

  // Debug context
  useEffect(() => {
    console.log('Sidebar Context:', context);
    if (!setErrorModalMessage) {
      console.warn('setErrorModalMessage is not available.');
    }
  }, [context, setErrorModalMessage]);

  // Fetch Facebook accounts for modal
  const fetchAccounts = async () => {
    setModalLoading(true);
    setModalError('');
    try {
      const data = await apiFetch('/api/FacebookAccount');
      console.log('Fetched Accounts:', data);
      setAccounts(data);
    } catch (err) {
      const errorMessage = err.message || 'Hesaplar alınamadı';
      setModalError(errorMessage);
      if (setErrorModalMessage) {
        setErrorModalMessage(errorMessage);
      }
    } finally {
      setModalLoading(false);
    }
  };

  // Open modal and fetch accounts
  const handleOpenModal = (type) => {
    setLoginType(type);
    setModalOpen(true);
    setSelectedAccount(null); // Clear previous selection
    fetchAccounts();
  };

  // Close modal
  const handleCloseModal = () => {
    setModalOpen(false);
    setSelectedAccount(null);
    setAccounts([]);
    setModalError('');
    setLoginType(null);
    setTriggerLogin(false);
    setShowTokenExpiredNotice(false);
  };

  // Select account
  const handleSelectAccount = (account) => {
    console.log('Selecting account:', account);
    setSelectedAccount(account);
    setModalError('');
    setShowTokenExpiredNotice(false);
  };

  const isTokenExpired = (createdAt) => {
    if (!createdAt) return true;
    const tokenDate = new Date(createdAt);
    const today = new Date();
    const daysDiff = differenceInDays(today, tokenDate);
    console.log('Token Age (days):', daysDiff);
    return daysDiff > 60;
  };

  // Update account with new token
  const updateAccountToken = async (companyId, longLivedToken) => {
    console.log('Updating account with:', { companyId, longLivedToken });
    try {
      const today = format(new Date(), 'yyyy-MM-dd');
      const response = await apiFetch(`/api/FacebookAccount/${selectedAccount.id}`, {
        method: 'PUT',
        body: JSON.stringify({
          id: selectedAccount.id,
          facebookLongLiveAccessToken: longLivedToken,
          longLiveAccessTokenCreatedAt: today,
          facebookAppName: selectedAccount.facebookAppName,
          facebookAppId: selectedAccount.facebookAppId,
          facebookAppSecret: selectedAccount.facebookAppSecret,
          graphApiVersion: selectedAccount.graphApiVersion,
          companyId: selectedAccount.companyId,
        }),
      });
      console.log('Account update response:', response);
      if (setErrorModalMessage) {
        setErrorModalMessage('Hesap tokenı başarıyla güncellendi');
      }
      return true;
    } catch (err) {
      const errorMessage = err.message || 'Hesap güncellenemedi';
      console.error('Error updating account:', err);
      setError(errorMessage);
      if (setErrorModalMessage) {
        setErrorModalMessage(errorMessage);
      }
      return false;
    }
  };

  // Handle Google Login
  const handleGoogleLogin = () => {
    console.log('Google Login button clicked');
    window.location.href = 'https://localhost:7099/api/GoogleAuth/login';
  };

  // Validate Facebook token
  const validateFacebookToken = async (accessToken) => {
    try {
      console.log('Validating Facebook access token');
      const response = await fetch(
        `https://graph.facebook.com/debug_token?input_token=${accessToken}&access_token=${selectedAccount.facebookAppId}|${selectedAccount.facebookAppSecret}`
      );
      const data = await response.json();
      console.log('Token validation response:', data);
      if (data.data && data.data.is_valid) {
        const grantedScopes = data.data.scopes || [];
        const requiredScopes = loginType === 'instagram'
          ? [
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
            ]
          : [
              'pages_show_list',
              'pages_manage_posts',
              'pages_read_user_content',
              'pages_manage_engagement',
              'pages_manage_metadata',
              'pages_read_engagement',
            ];
        const missingScopes = requiredScopes.filter((scope) => !grantedScopes.includes(scope));
        if (missingScopes.length > 0) {
          throw new Error(`Eksik izinler: ${missingScopes.join(', ')}. Lütfen tekrar yetkilendirin.`);
        }
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error validating Facebook token:', error);
      setError(error.message || 'Token doğrulama hatası. Lütfen tekrar deneyin.');
      return false;
    }
  };

  // Validate Facebook Page token
  const validateFacebookPageToken = async (accessToken) => {
    try {
      console.log('Validating Facebook Page access token');
      const response = await fetch(
        `https://graph.facebook.com/debug_token?input_token=${accessToken}&access_token=${selectedAccount.facebookAppId}|${selectedAccount.facebookAppSecret}`
      );
      const data = await response.json();
      console.log('Page token validation response:', data);
      if (data.data && data.data.is_valid) {
        const grantedScopes = data.data.scopes || [];
        const requiredScopes = [
          'pages_show_list',
          'pages_manage_posts',
          'pages_read_user_content',
          'pages_manage_engagement',
          'pages_manage_metadata',
          'pages_read_engagement',
        ];
        const missingScopes = requiredScopes.filter((scope) => !grantedScopes.includes(scope));
        if (missingScopes.length > 0) {
          throw new Error(`Eksik izinler: ${missingScopes.join(', ')}. Lütfen tekrar yetkilendirin.`);
        }
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error validating Facebook Page token:', error);
      setError(error.message || 'Token doğrulama hatası. Lütfen tekrar deneyin.');
      return false;
    }
  };

  // Exchange for long-lived token
  const exchangeForLongLivedFacebookToken = async (shortLivedToken) => {
    try {
      console.log('Exchanging Facebook short-lived token');
      const response = await fetch(
        `https://graph.facebook.com/v20.0/oauth/access_token?grant_type=fb_exchange_token&client_id=${selectedAccount.facebookAppId}&client_secret=${selectedAccount.facebookAppSecret}&fb_exchange_token=${shortLivedToken}`
      );
      const data = await response.json();
      console.log('Token exchange response:', data);
      if (data.access_token) {
        return data.access_token;
      }
      throw new Error('Token değişimi başarısız');
    } catch (error) {
      console.error('Error exchanging Facebook token:', error);
      setError(error.message || 'Token alınamadı');
      return null;
    }
  };

  // Handle Facebook login response
  const responseFacebook = async (response) => {
    console.log('Facebook Response:', response);
    if (!response.accessToken) {
      console.error('No access token received from Facebook');
      setError('Facebook girişinden erişim tokenı alınamadı.');
      setLoading(false);
      setTriggerLogin(false);
      setShowTokenExpiredNotice(false);
      return;
    }

    setLoading(true);
    setError(null);
    console.log('Processing Facebook login for:', loginType);

    try {
      console.log('Exchanging for long-lived token');
      const longLivedToken = await exchangeForLongLivedFacebookToken(response.accessToken);
      if (!longLivedToken) {
        console.error('Failed to obtain long-lived token');
        setError('Geçerli bir oturum alınamadı. Lütfen tekrar deneyin.');
        setLoading(false);
        setTriggerLogin(false);
        setShowTokenExpiredNotice(false);
        return;
      }

      console.log('Long-lived token obtained:', longLivedToken);
      localStorage.set(loginType === 'instagram' ? 'facebookAccessToken' : 'facebookPageAccessToken', longLivedToken);

      console.log('Validating token');
      const isValid = loginType === 'instagram'
        ? await validateFacebookToken(longLivedToken)
        : await validateFacebookPageToken(longLivedToken);

      if (!isValid) {
        console.error('Token validation failed');
        setError('Token doğrulama başarısız. Lütfen izinleri kontrol edin.');
        setLoading(false);
        setTriggerLogin(false);
        setShowTokenExpiredNotice(false);
        return;
      }

      console.log('Token is valid, updating account');
      const updateSuccess = await updateAccountToken(selectedAccount.companyId, longLivedToken);
      if (!updateSuccess) {
        console.error('Account update failed');
        setLoading(false);
        setTriggerLogin(false);
        setShowTokenExpiredNotice(false);
        return;
      }

      console.log('Fetching data for:', loginType);
      loginType === 'instagram'
        ? fetchInstagramData(longLivedToken)
        : fetchFacebookPageData(longLivedToken);

      console.log('Closing modal after successful login');
      handleCloseModal();
    } catch (error) {
      console.error('Error in responseFacebook:', error);
      setError('Giriş işlemi başarısız oldu. Lütfen tekrar deneyin.');
      setLoading(false);
    } finally {
      setTriggerLogin(false);
      setShowTokenExpiredNotice(false);
      setLoading(false);
    }
  };

  // Handle modal confirm
  const handleModalConfirm = async () => {
    if (!selectedAccount) {
      setModalError('Lütfen bir hesap seçin.');
      console.error('No account selected');
      return;
    }

    console.log('Confirming account:', selectedAccount);

    const token = selectedAccount.facebookLongLiveAccessToken;
    const tokenCreatedAt = selectedAccount.longLiveAccessTokenCreatedAt;

    if (!token || isTokenExpired(tokenCreatedAt)) {
      console.log('Token is expired or missing.');
      setShowTokenExpiredNotice(true);
      return;
    }

    setModalLoading(true);
    try {
      console.log('Validating token for selected account');
      const isValid = loginType === 'instagram'
        ? await validateFacebookToken(token)
        : await validateFacebookPageToken(token);

      if (!isValid) {
        console.log('Token is invalid.');
        setShowTokenExpiredNotice(true);
        return;
      }

      console.log('Token is valid. Using existing token.');
      localStorage.set(loginType === 'instagram' ? 'facebookAccessToken' : 'facebookPageAccessToken', token);
      loginType === 'instagram'
        ? fetchInstagramData(token)
        : fetchFacebookPageData(token);
      handleCloseModal();
    } catch (error) {
      console.error('Error validating token in handleModalConfirm:', error);
      setModalError('Token doğrulama hatası. Lütfen tekrar giriş yapın.');
    } finally {
      setModalLoading(false);
    }
  };

  // Fetch Instagram data
  const fetchInstagramData = async (accessToken) => {
    setLoading(true);
    setError(null);
    try {
      console.log('Fetching Instagram data with token');
      const isValid = await validateFacebookToken(accessToken);
      if (!isValid) {
        throw new Error('Geçersiz veya süresi dolmuş token');
      }

      const pagesResponse = await fetch(
        `https://graph.facebook.com/v20.0/me/accounts?access_token=${accessToken}&app_id=${selectedAccount.facebookAppId}`
      );
      const pagesData = await pagesResponse.json();
      console.log('Pages response:', pagesData);
      if (pagesData.data && pagesData.data.length > 0) {
        const pageId = pagesData.data[0].id;
        const igResponse = await fetch(
          `https://graph.facebook.com/v20.0/${pageId}?fields=instagram_business_account&access_token=${accessToken}&app_id=${selectedAccount.facebookAppId}`
        );
        const igData = await igResponse.json();
        console.log('Instagram business account response:', igData);
        if (igData.instagram_business_account) {
          const instagramBusinessId = igData.instagram_business_account.id;
          localStorage.set('userId', instagramBusinessId);
          fetchInstagramUser(instagramBusinessId, accessToken);
        } else {
          throw new Error('Bu sayfaya bağlı Instagram İşletme Hesabı bulunamadı.');
        }
      } else {
        throw new Error('Bu kullanıcı için Facebook sayfası bulunamadı.');
      }
    } catch (error) {
      console.error('Error fetching Instagram data:', error);
      setError('Instagram bağlantısı başarısız. Lütfen tekrar giriş yapın.');
      localStorage.remove('facebookAccessToken');
      localStorage.remove('userId');
      localStorage.remove('username');
      navigate('/FacebookLogin');
    } finally {
      setLoading(false);
    }
  };

  // Fetch Instagram user
  const fetchInstagramUser = async (instagramBusinessId, accessToken) => {
    try {
      console.log('Fetching Instagram user data for ID:', instagramBusinessId);
      const response = await fetch(
        `https://graph.facebook.com/v20.0/${instagramBusinessId}?fields=username,followers_count,media_count,follows_count,name,biography&access_token=${accessToken}&app_id=${selectedAccount.facebookAppId}`
      );
      const data = await response.json();
      console.log('Instagram user data response:', data);
      if (data.error && data.error.code === 190) {
        setError('Oturumunuzun süresi doldu. Lütfen tekrar giriş yapın.');
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
      setError('Instagram kullanıcı verileri alınamadı. Lütfen tekrar deneyin.');
    }
  };

  // Fetch Facebook Page data
  const fetchFacebookPageData = async (accessToken) => {
    setLoading(true);
    setError(null);
    try {
      console.log('Fetching Facebook page data with token');
      const isValid = await validateFacebookPageToken(accessToken);
      if (!isValid) {
        throw new Error('Geçersiz veya süresi dolmuş token');
      }

      const pagesResponse = await fetch(
        `https://graph.facebook.com/v20.0/me/accounts?access_token=${accessToken}&app_id=${selectedAccount.facebookAppId}`
      );
      const pagesData = await pagesResponse.json();
      console.log('Facebook pages response:', pagesData);
      if (pagesData.data && pagesData.data.length > 0) {
        const pageId = pagesData.data[0].id;
        const pageAccessToken = pagesData.data[0].access_token;
        localStorage.set('facebookPageId', pageId);
        localStorage.set('facebookPageAccessToken', pageAccessToken);
        const pageResponse = await fetch(
          `https://graph.facebook.com/v20.0/${pageId}?fields=name,about,fan_count,picture&access_token=${pageAccessToken}`
        );
        const pageData = await pageResponse.json();
        console.log('Facebook page data response:', pageData);
        localStorage.set('facebookPageName', pageData.name);
        navigate('/FacebookProfile');
      } else {
        throw new Error('Bu kullanıcı için Facebook sayfası bulunamadı.');
      }
    } catch (error) {
      console.error('Error fetching Facebook Page data:', error);
      setError('Facebook bağlantısı başarısız. Lütfen tekrar giriş yapın.');
      localStorage.remove('facebookPageAccessToken');
      localStorage.remove('facebookPageId');
      localStorage.remove('facebookPageName');
      navigate('/FacebookLoginPage');
    } finally {
      setLoading(false);
    }
  };

  const handleLoginButtonClick = () => {
    console.log('Initiating Facebook login for:', loginType);
    setTriggerLogin(true);
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
    if (item.action === 'facebookLoginInstagram') {
      handleOpenModal('instagram');
    } else if (item.action === 'facebookLoginPage') {
      handleOpenModal('facebook');
    } else if (item.action === 'googleLogin') {
      handleGoogleLogin();
    } else if (item.action) {
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
                if (subItem.text === 'Login') {
                  return (
                    <ListItem
                      button
                      key={subItem.text}
                      onClick={() => handleItemClick(subItem)}
                      sx={{ pl: 4, m: 1, width: '95%' }}
                    >
                      <ListItemIcon>{subItem.icon}</ListItemIcon>
                      {(sidebarOpen || isHovered) && (
                        <ListItemText primary={item.text === 'Youtube' ? 'Google ile Giriş' : 'Facebook ile Giriş'} />
                      )}
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
        onClick={() => handleItemClick(item)}
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
    <>
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
        {loading && <Typography sx={{ p: 2 }}>Yükleniyor...</Typography>}
        {error && (
          <Typography color="error" sx={{ p: 2 }}>
            {error}
          </Typography>
        )}
        <List sx={{ m: '2%' }}>{menuItems.map(renderMenuItem)}</List>
      </Drawer>

      {/* Account Selection Modal */}
      <Dialog
        open={modalOpen}
        onClose={handleCloseModal}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle sx={{ bgcolor: '#1976d2', color: 'white', fontWeight: 'bold' }}>
          Hesabı Seç
        </DialogTitle>
        <DialogContent>
          {modalLoading && (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
              <CircularProgress />
            </Box>
          )}
          {!modalLoading && accounts.length === 0 && !modalError && (
            <Typography sx={{ py: 4, textAlign: 'center' }}>
              Hiç hesap bulunamadı.
            </Typography>
          )}
          {!modalLoading && accounts.length > 0 && !showTokenExpiredNotice && !modalError && (
            <Table sx={{ mt: 2 }}>
              <TableHead>
                <TableRow>
                  <TableCell sx={{ fontWeight: 'bold' }}>Ad</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Id</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>İşlem</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {accounts.map((account) => (
                  <TableRow
                    key={account.id} // Use unique account.id
                    sx={{
                      bgcolor: selectedAccount?.id === account.id ? '#e3f2fd' : 'inherit',
                      '&:hover': { bgcolor: '#f5f5f5' },
                    }}
                  >
                    <TableCell>{account.facebookAppName}</TableCell>
                    <TableCell>{account.facebookAppId}</TableCell>
                    <TableCell>
                      <Button
                        variant={selectedAccount?.id === account.id ? 'contained' : 'outlined'}
                        color="primary"
                        onClick={() => handleSelectAccount(account)}
                      >
                        {selectedAccount?.id === account.id ? 'Seçildi' : 'Seç'}
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
          {modalError && (
            <Typography color="error" sx={{ mt: 2, textAlign: 'center' }}>
              {modalError}
            </Typography>
          )}
          {showTokenExpiredNotice && (
            <Box sx={{ mt: 2, textAlign: 'center' }}>
              <Typography color="error" sx={{ mb: 2 }}>
                Tokenınızın süresi doldu. Lütfen tekrar giriş yapın.
              </Typography>
              <Button
                variant="contained"
                color="primary"
                onClick={handleLoginButtonClick}
                disabled={loading}
              >
                Giriş Yap
              </Button>
            </Box>
          )}
          {/* Hidden FacebookLogin for Instagram */}
          {triggerLogin && loginType === 'instagram' && (
            <FacebookLogin
              appId={selectedAccount?.facebookAppId || '1936737430086867'}
              autoLoad={true}
              fields="name,email,picture"
              scope="public_profile,email,pages_show_list,instagram_basic,instagram_manage_comments,instagram_content_publish,instagram_manage_insights,pages_manage_metadata,pages_read_engagement,pages_read_user_content"
              callback={responseFacebook}
              cssClass="hidden"
              textButton=""
              disabled={loading}
            />
          )}
          {/* Hidden FacebookLogin for Facebook */}
          {triggerLogin && loginType === 'facebook' && (
            <FacebookLogin
              appId={selectedAccount?.facebookAppId}
              autoLoad={true}
              fields="name,email,picture"
              scope="pages_show_list,pages_manage_posts,pages_read_user_content,pages_manage_engagement,pages_manage_metadata,pages_read_engagement,read_insights,publish_video,pages_manage_posts"
              callback={responseFacebook}
              cssClass="hidden"
              textButton=""
              disabled={loading}
            />
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseModal} color="secondary">
            İptal
          </Button>
          {!showTokenExpiredNotice && (
            <Button
              onClick={handleModalConfirm}
              color="primary"
              variant="contained"
              disabled={!selectedAccount || modalLoading}
            >
              Onayla
            </Button>
          )}
        </DialogActions>
      </Dialog>
    </>
  );
};

export default Sidebar;