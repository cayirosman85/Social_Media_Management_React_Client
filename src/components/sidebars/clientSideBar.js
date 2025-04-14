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
      { text: 'Login', icon: <Login size={22} />, action: 'facebookLoginMessenger' },
    ],
  },
  {
    text: 'Instagram Chat',
    icon: <Instagram size={22} />,
    subItems: [
      { text: 'Sohbet', icon: <Message size={22} />, path: '/instagram-chat' },
      { text: 'Hesap', icon: <Settings size={22} />, path: '/instagram-chat-accounts' },
      { text: 'Login', icon: <Login size={22} />, action: 'facebookLoginInstagramChat' },
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
  const [loginType, setLoginType] = useState(null);
  const [triggerLogin, setTriggerLogin] = useState(false);
  const [showTokenExpiredNotice, setShowTokenExpiredNotice] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const context = useOutletContext();
  const setErrorModalMessage = context?.setErrorModalMessage;

  useEffect(() => {
    console.log('Sidebar Context:', context);
    if (!setErrorModalMessage) {
      console.warn('setErrorModalMessage is not available.');
    }
  }, [context, setErrorModalMessage]);

  const fetchAccounts = async (type) => {
    setModalLoading(true);
    setModalError('');
    try {
      const endpoint =
        type === 'messenger'
          ? '/api/MessengerAccount'
          : type === 'instagramChat'
          ? '/api/InstagramMessengerAccount'
          : '/api/FacebookAccount';
      console.log(`Fetching accounts from endpoint: ${endpoint} for loginType: ${type}`);
      const data = await apiFetch(endpoint);
      console.log('Fetched Accounts:', data);
      setAccounts(data);
    } catch (err) {
      const errorMessage = err.message || 'Hesaplar alınamadı';
      console.error('Error fetching accounts:', err);
      setModalError(errorMessage);
      if (setErrorModalMessage) {
        setErrorModalMessage(errorMessage);
      }
    } finally {
      setModalLoading(false);
    }
  };

  const handleOpenModal = (type) => {
    console.log(`Opening modal with loginType: ${type}`);
    setLoginType(type);
    setModalOpen(true);
    setSelectedAccount(null);
    fetchAccounts(type);
  };

  const handleCloseModal = () => {
    console.log('Closing modal');
    setModalOpen(false);
    setSelectedAccount(null);
    setAccounts([]);
    setModalError('');
    setLoginType(null);
    setTriggerLogin(false);
    setShowTokenExpiredNotice(false);
  };

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

  const updateAccountToken = async (companyId, longLivedToken, pageId) => {
    console.log('Updating account with:', { companyId, longLivedToken, pageId });
    try {
      const today = format(new Date(), 'yyyy-MM-dd');
      const endpoint =
        loginType === 'messenger'
          ? `/api/MessengerAccount/${selectedAccount.id}`
          : loginType === 'instagramChat'
          ? `/api/InstagramMessengerAccount/${selectedAccount.id}`
          : `/api/FacebookAccount/${selectedAccount.id}`;
      const body =
        loginType === 'messenger' || loginType === 'instagramChat'
          ? {
              id: selectedAccount.id,
              facebookPageId: pageId || selectedAccount.facebookPageId,
              facebookLongLiveAccessToken: longLivedToken,
              longLiveAccessTokenCreatedAt: today,
              facebookAppName: selectedAccount.facebookAppName,
              facebookAppId: selectedAccount.facebookAppId,
              facebookAppSecret: selectedAccount.facebookAppSecret,
              graphApiVersion: selectedAccount.graphApiVersion,
              companyId: selectedAccount.companyId,
            }
          : {
              id: selectedAccount.id,
              facebookPageId: pageId || selectedAccount.facebookPageId,
              facebookLongLiveAccessToken: longLivedToken,
              longLiveAccessTokenCreatedAt: today,
              facebookAppName: selectedAccount.facebookAppName,
              facebookAppId: selectedAccount.facebookAppId,
              facebookAppSecret: selectedAccount.facebookAppSecret,
              graphApiVersion: selectedAccount.graphApiVersion,
              companyId: selectedAccount.companyId,
            };
      const response = await apiFetch(endpoint, {
        method: 'PUT',
        body: JSON.stringify(body),
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

  const handleGoogleLogin = () => {
    console.log('Google Login button clicked');
    window.location.href = 'https://localhost:7099/api/GoogleAuth/login';
  };

  const validateFacebookToken = async (accessToken) => {
    try {
      console.log('Validating Facebook access token');
      const response = await fetch(
        `https://graph.facebook.com/debug_token?input_token=${accessToken}&access_token=${
          selectedAccount.facebookAppId || selectedAccount.appId
        }|${selectedAccount.facebookAppSecret || selectedAccount.appSecret}`
      );
      const data = await response.json();
      console.log('Token validation response:', data);
      if (data.data && data.data.is_valid) {
        const grantedScopes = data.data.scopes || [];
        const requiredScopes =
          loginType === 'instagram'
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
            : loginType === 'messenger'
            ? ['pages_show_list', 'pages_messaging', 'pages_manage_metadata', 'pages_read_engagement']
            : loginType === 'instagramChat'
            ? [
                'pages_show_list',
                'instagram_basic',
                'instagram_manage_messages',
                'pages_messaging',
                'pages_manage_metadata',
                'pages_read_engagement',
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

  const exchangeForLongLivedFacebookToken = async (shortLivedToken) => {
    try {
      console.log('Exchanging Facebook short-lived token');
      const response = await fetch(
        `https://graph.facebook.com/v20.0/oauth/access_token?grant_type=fb_exchange_token&client_id=${
          selectedAccount.facebookAppId || selectedAccount.appId
        }&client_secret=${
          selectedAccount.facebookAppSecret || selectedAccount.appSecret
        }&fb_exchange_token=${shortLivedToken}`
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
      // Exchange short-lived User Access Token for long-lived User Access Token
      const longLivedUserToken = await exchangeForLongLivedFacebookToken(response.accessToken);
      if (!longLivedUserToken) {
        console.error('Failed to obtain long-lived user token');
        setError('Geçerli bir oturum alınamadı. Lütfen tekrar deneyin.');
        setLoading(false);
        setTriggerLogin(false);
        setShowTokenExpiredNotice(false);
        return;
      }

      console.log('Long-lived user token obtained:', longLivedUserToken);

      let tokenToStore = longLivedUserToken;
      let pageId = null;

      // For Instagram Chat and Messenger, fetch Page Access Token
      if (loginType === 'instagramChat' || loginType === 'messenger') {
        const pagesResponse = await fetch(
          `https://graph.facebook.com/v20.0/me/accounts?access_token=${longLivedUserToken}&app_id=${
            selectedAccount.appId || selectedAccount.facebookAppId
          }`
        );
        const pagesData = await pagesResponse.json();
        console.log('Pages response:', pagesData);

        if (!pagesData.data || pagesData.data.length === 0) {
          throw new Error('Bu kullanıcı için Facebook sayfası bulunamadı.');
        }

        // Use the first page or match with selectedAccount.facebookPageId
        const page = pagesData.data.find((p) => p.id === selectedAccount.facebookPageId) || pagesData.data[0];
        tokenToStore = page.access_token; // Page Access Token
        pageId = page.id;

        console.log('Page Access Token obtained:', tokenToStore, 'Page ID:', pageId);
      }

      // Validate token
      const isValid = await validateFacebookToken(tokenToStore);
      if (!isValid) {
        console.error('Token validation failed');
        setError('Token doğrulama başarısız. Lütfen izinleri kontrol edin.');
        setLoading(false);
        setTriggerLogin(false);
        setShowTokenExpiredNotice(false);
        return;
      }

      // Store token in localStorage
      localStorage.set(
        loginType === 'instagram'
          ? 'facebookAccessToken'
          : loginType === 'messenger'
          ? 'messengerAccessToken'
          : loginType === 'instagramChat'
          ? 'instagramChatAccessToken'
          : 'facebookPageAccessToken',
        tokenToStore
      );

      // Update backend with Page Access Token
      const updateSuccess = await updateAccountToken(selectedAccount.companyId, tokenToStore, pageId);
      if (!updateSuccess) {
        console.error('Account update failed');
        setLoading(false);
        setTriggerLogin(false);
        setShowTokenExpiredNotice(false);
        return;
      }

      if (loginType === 'instagram') {
        fetchInstagramData(tokenToStore);
      } else if (loginType === 'facebook') {
        fetchFacebookPageData(tokenToStore);
      } else if (loginType === 'messenger') {
        fetchMessengerData(tokenToStore);
      } else if (loginType === 'instagramChat') {
        fetchInstagramChatData(tokenToStore);
      }

      handleCloseModal();
    } catch (error) {
      console.error('Error in responseFacebook:', error);
      setError(error.message || 'Giriş işlemi başarısız oldu. Lütfen tekrar deneyin.');
      setLoading(false);
    } finally {
      setTriggerLogin(false);
      setShowTokenExpiredNotice(false);
      setLoading(false);
    }
  };

  const handleModalConfirm = async () => {
    if (!selectedAccount) {
      setModalError('Lütfen bir hesap seçin.');
      console.error('No account selected');
      return;
    }

    console.log('Confirming account:', selectedAccount);

    const token =
      loginType === 'messenger' || loginType === 'instagramChat'
        ? selectedAccount.facebookLongLiveAccessToken
        : selectedAccount.facebookLongLiveAccessToken;
    const tokenCreatedAt = selectedAccount.longLiveAccessTokenCreatedAt;

    if (!token || isTokenExpired(tokenCreatedAt)) {
      console.log('Token is expired or missing.');
      setShowTokenExpiredNotice(true);
      return;
    }

    setModalLoading(true);
    try {
      const isValid = await validateFacebookToken(token);
      if (!isValid) {
        console.log('Token is invalid.');
        setShowTokenExpiredNotice(true);
        return;
      }

      localStorage.set(
        loginType === 'instagram'
          ? 'facebookAccessToken'
          : loginType === 'messenger'
          ? 'messengerAccessToken'
          : loginType === 'instagramChat'
          ? 'instagramChatAccessToken'
          : 'facebookPageAccessToken',
        token
      );
      if (loginType === 'instagram') {
        fetchInstagramData(token);
      } else if (loginType === 'facebook') {
        fetchFacebookPageData(token);
      } else if (loginType === 'messenger') {
        fetchMessengerData(token);
      } else if (loginType === 'instagramChat') {
        fetchInstagramChatData(token);
      }
      handleCloseModal();
    } catch (error) {
      console.error('Error validating token in handleModalConfirm:', error);
      setModalError('Token doğrulama hatası. Lütfen tekrar giriş yapın.');
    } finally {
      setModalLoading(false);
    }
  };

  const fetchInstagramChatData = async (accessToken) => {
    setLoading(true);
    setError(null);
    try {
      console.log('Fetching Instagram Chat data with token');
      const isValid = await validateFacebookToken(accessToken);
      if (!isValid) {
        throw new Error('Geçersiz veya süresi dolmuş token');
      }

      const pagesResponse = await fetch(
        `https://graph.facebook.com/v20.0/me/accounts?access_token=${accessToken}&app_id=${
          selectedAccount.appId || selectedAccount.facebookAppId
        }`
      );
      const pagesData = await pagesResponse.json();
      console.log('Pages response:', pagesData);
      if (pagesData.data && pagesData.data.length > 0) {
        const page = pagesData.data.find((p) => p.id === selectedAccount.facebookPageId) || pagesData.data[0];
        const pageId = page.id;
        const pageAccessToken = page.access_token;
        localStorage.set('instagramChatPageId', pageId);
        localStorage.set('instagramChatAccessToken', pageAccessToken);

        const igResponse = await fetch(
          `https://graph.facebook.com/v20.0/${pageId}?fields=instagram_business_account&access_token=${pageAccessToken}&app_id=${
            selectedAccount.appId || selectedAccount.facebookAppId
          }`
        );
        const igData = await igResponse.json();
        console.log('Instagram business account response:', igData);
        if (igData.instagram_business_account) {
          const instagramBusinessId = igData.instagram_business_account.id;
          localStorage.set('instagramBusinessId', instagramBusinessId);

          await apiFetch('/api/InstagramMessengerAccount', {
            method: 'POST',
            body: JSON.stringify({
              facebookPageId: pageId,
              facebookLongLiveAccessToken: pageAccessToken,
              facebookAppName: selectedAccount.facebookAppName,
              facebookAppId: selectedAccount.appId || selectedAccount.facebookAppId,
              facebookAppSecret: selectedAccount.appSecret || selectedAccount.facebookAppSecret,
              graphApiVersion: 'v20.0',
              companyId: selectedAccount.companyId,
              longLiveAccessTokenCreatedAt: format(new Date(), 'yyyy-MM-dd'),
            }),
          });
          navigate('/instagram-chat');
        } else {
          throw new Error('Bu sayfaya bağlı Instagram İşletme Hesabı bulunamadı.');
        }
      } else {
        throw new Error('Bu kullanıcı için Facebook sayfası bulunamadı.');
      }
    } catch (error) {
      console.error('Error fetching Instagram Chat data:', error);
      setError('Instagram Chat bağlantısı başarısız. Lütfen tekrar giriş yapın.');
      localStorage.remove('instagramChatAccessToken');
      localStorage.remove('instagramChatPageId');
      localStorage.remove('instagramBusinessId');
      navigate('/instagram-chat-accounts');
    } finally {
      setLoading(false);
    }
  };

  const fetchMessengerData = async (accessToken) => {
    setLoading(true);
    setError(null);
    try {
      console.log('Fetching Messenger data with token');
      const isValid = await validateFacebookToken(accessToken);
      if (!isValid) {
        throw new Error('Geçersiz veya süresi dolmuş token');
      }

      const pagesResponse = await fetch(
        `https://graph.facebook.com/v20.0/me/accounts?access_token=${accessToken}&app_id=${
          selectedAccount.appId || selectedAccount.facebookAppId
        }`
      );
      const pagesData = await pagesResponse.json();
      console.log('Pages response:', pagesData);
      if (pagesData.data && pagesData.data.length > 0) {
        const pageId = pagesData.data[0].id;
        const pageAccessToken = pagesData.data[0].access_token;
        localStorage.set('messengerPageId', pageId);
        localStorage.set('messengerAccessToken', pageAccessToken);

        await apiFetch('/api/MessengerAccount', {
          method: 'POST',
          body: JSON.stringify({
            facebookPageId: pageId,
            facebookLongLiveAccessToken: pageAccessToken,
            facebookAppName: selectedAccount.facebookAppName,
            facebookAppId: selectedAccount.appId || selectedAccount.facebookAppId,
            facebookAppSecret: selectedAccount.appSecret || selectedAccount.facebookAppSecret,
            graphApiVersion: 'v20.0',
            companyId: selectedAccount.companyId,
            longLiveAccessTokenCreatedAt: format(new Date(), 'yyyy-MM-dd'),
          }),
        });
        navigate('/messenger');
      } else {
        throw new Error('Bu kullanıcı için Facebook sayfası bulunamadı.');
      }
    } catch (error) {
      console.error('Error fetching Messenger data:', error);
      setError('Messenger bağlantısı başarısız. Lütfen tekrar giriş yapın.');
      localStorage.remove('messengerAccessToken');
      localStorage.remove('messengerPageId');
      navigate('/MessengerAccount');
    } finally {
      setLoading(false);
    }
  };

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

  const fetchFacebookPageData = async (accessToken) => {
    setLoading(true);
    setError(null);
    try {
      console.log('Fetching Facebook page data with token');
      const isValid = await validateFacebookToken(accessToken);
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
    console.log('Handling item click:', item);
    if (item.action === 'facebookLoginInstagram') {
      handleOpenModal('instagram');
    } else if (item.action === 'facebookLoginPage') {
      handleOpenModal('facebook');
    } else if (item.action === 'facebookLoginMessenger') {
      handleOpenModal('messenger');
    } else if (item.action === 'facebookLoginInstagramChat') {
      handleOpenModal('instagramChat');
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
                        <ListItemText
                          primary={
                            item.text === 'Youtube'
                              ? 'Google ile Giriş'
                              : item.text === 'Instagram Chat'
                              ? 'Giriş'
                              : item.text === 'Messenger'
                              ? 'Giriş'
                              : 'Giriş'
                          }
                        />
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
                  <TableCell sx={{ fontWeight: 'bold' }}>
                    {loginType === 'messenger' || loginType === 'instagramChat' ? 'Hesap ID' : 'Ad'}
                  </TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>App ID</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>İşlem</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {accounts.map((account) => (
                  <TableRow
                    key={account.id}
                    sx={{
                      bgcolor: selectedAccount?.id === account.id ? '#e3f2fd' : 'inherit',
                      '&:hover': { bgcolor: '#f5f5f5' },
                    }}
                  >
                    <TableCell>
                      {loginType === 'messenger' || loginType === 'instagramChat'
                        ? account.facebookAppName
                        : account.facebookAppName}
                    </TableCell>
                    <TableCell>
                      {loginType === 'messenger' || loginType === 'instagramChat'
                        ? account.facebookAppId
                        : account.facebookAppId}
                    </TableCell>
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
          {triggerLogin && loginType === 'messenger' && (
            <FacebookLogin
              appId={selectedAccount?.appId || selectedAccount?.facebookAppId}
              autoLoad={true}
              fields="name,email,picture"
              scope="pages_show_list,pages_messaging,pages_manage_metadata,pages_read_engagement"
              callback={responseFacebook}
              cssClass="hidden"
              textButton=""
              disabled={loading}
            />
          )}
          {triggerLogin && loginType === 'instagramChat' && (
            <FacebookLogin
              appId={selectedAccount?.appId || selectedAccount?.facebookAppId}
              autoLoad={true}
              fields="name,email,picture"
              scope="pages_show_list,instagram_basic,instagram_manage_messages,pages_messaging,pages_manage_metadata,pages_read_engagement"
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