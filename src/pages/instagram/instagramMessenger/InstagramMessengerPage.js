import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Box,
  Typography,
  TextField,
  IconButton,
  List,
  ListItem,
  Avatar,
  InputBase,
  Modal,
  Menu,
  MenuItem,
  CircularProgress,
  Drawer,
  ListItemText,
  Tabs,
  Tab,
  Switch,
  Divider,
  Popper,
  Button,
} from '@mui/material';
import {
  Search,
  Send,
  ArrowBack,
  PhotoCamera,
  Mic,
  Stop,
  MoreVert,
  Mood,
  Gif,
  LocationOn,
} from '@mui/icons-material';
import EmojiPicker from 'emoji-picker-react';
import { GiphyFetch } from '@giphy/js-fetch-api';
import connectToSignalR from '../../../utils/signalR/signalR';
import { apiFetch } from '../../../api/instagram/chat/api';
import { cookies } from '../../../utils/cookie';

// Giphy API ile başlatma
const giphy = new GiphyFetch(process.env.REACT_APP_GIPHY_API_KEY || 'oB1EVOJbfDDYYo40epom83LAzoC3jALn');

// Yedek bileşenler
const EmojiPickerFallback = () => (
  <Box sx={{ p: 2, bgcolor: '#fff', borderRadius: '10px' }}>
    <Typography color="error">Emoji seçici yüklenemedi</Typography>
  </Box>
);

const GifPickerFallback = () => (
  <Box sx={{ p: 2, bgcolor: '#fff', borderRadius: '10px' }}>
    <Typography color="error">GIF seçici yüklenemedi</Typography>
  </Box>
);

// Sekme paneli bileşeni
function TabPanel(props) {
  const { children, value, index, ...other } = props;
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`sidebar-tabpanel-${index}`}
      aria-labelledby={`sidebar-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 2 }}>{children}</Box>}
    </div>
  );
}

const InstagramMessengerPage = () => {
  // Durumlar
  const [conversations, setConversations] = useState([]);
  const [selectedConversationId, setSelectedConversationId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [conversationSearchQuery, setConversationSearchQuery] = useState('');
  const [files, setFiles] = useState([]);
  const [filePreviews, setFilePreviews] = useState([]);
  const [audioBlob, setAudioBlob] = useState(null);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [error, setError] = useState('');
  const [errorModalOpen, setErrorModalOpen] = useState(false);
  const [menuAnchorEl, setMenuAnchorEl] = useState(null);
  const [selectedMessageId, setSelectedMessageId] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [messageSearchQuery, setMessageSearchQuery] = useState('');
  const [searchedMessages, setSearchedMessages] = useState([]);
  const [tabValue, setTabValue] = useState(0);
  const [subTabValue, setSubTabValue] = useState(0);
  const [playNotificationSound, setPlayNotificationSound] = useState(true);
  const [emojiAnchorEl, setEmojiAnchorEl] = useState(null);
  const [gifAnchorEl, setGifAnchorEl] = useState(null);
  const [imageBlobs, setImageBlobs] = useState({});
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [gifs, setGifs] = useState([]);
  const [gifOffset, setGifOffset] = useState(0);
  const [hasMoreGifs, setHasMoreGifs] = useState(true);
  const [isLoadingMoreGifs, setIsLoadingMoreGifs] = useState(false);
  const [page, setPage] = useState(1);
  const [totalMessages, setTotalMessages] = useState(0);
  const [isLoadingMoreMessages, setIsLoadingMoreMessages] = useState(false);
  const [conversationPage, setConversationPage] = useState(1);
  const [totalConversations, setTotalConversations] = useState(0);
  const [hasMoreConversations, setHasMoreConversations] = useState(true);
  const [isLoadingMoreConversations, setIsLoadingMoreConversations] = useState(false);

  // Referanslar
  const emojiPickerRef = useRef(null);
  const gifPickerRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const messagesEndRef = useRef(null);
  const messagesContainerRef = useRef(null);
  const conversationListRef = useRef(null);
  const observerRef = useRef(null);
  const blobCache = useRef({});
  const timerRef = useRef(null);

  // Yardımcı Fonksiyonlar
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const formatDuration = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Sonsuz kaydırma için IntersectionObserver
  const lastConversationElementRef = useCallback(
    (node) => {
      if (isLoading || isLoadingMoreConversations) return;
      if (observerRef.current) observerRef.current.disconnect();
      observerRef.current = new IntersectionObserver((entries) => {
        if (entries[0].isIntersecting && hasMoreConversations) {
          loadMoreConversations();
        }
      });
      if (node) observerRef.current.observe(node);
    },
    [isLoading, isLoadingMoreConversations, hasMoreConversations]
  );

  // Emoji ve GIF seçiciler için dışarıya tıklama işlemi
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        emojiAnchorEl &&
        emojiPickerRef.current &&
        !emojiPickerRef.current.contains(event.target) &&
        !emojiAnchorEl.contains(event.target)
      ) {
        setEmojiAnchorEl(null);
      }
      if (
        gifAnchorEl &&
        gifPickerRef.current &&
        !gifPickerRef.current.contains(event.target) &&
        !gifAnchorEl.contains(event.target)
      ) {
        setGifAnchorEl(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [emojiAnchorEl, gifAnchorEl]);



  // Konum Paylaşımı
  const shareLocation = () => {
    if (!navigator.geolocation) {
      setError('Tarayıcınız konum servisini desteklemiyor');
      setErrorModalOpen(true);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        const mapUrl = `https://www.google.com/maps?q=${latitude},${longitude}`;
        setNewMessage(mapUrl);
        sendMessage();
      },
      (err) => {
        setError(`Konum alınamadı: ${err.message}`);
        setErrorModalOpen(true);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  // GIF Yükleme
  const loadGifs = async (offset = 0, append = false) => {
    try {
      setIsLoadingMoreGifs(true);
      const limit = 40;
      const result = await giphy.trending({ limit, offset });
      if (!result.data || !Array.isArray(result.data)) {
        throw new Error('Geçersiz Giphy API yanıtı');
      }
      const newGifs = result.data;
      setGifs((prev) => (append ? [...prev, ...newGifs] : newGifs));
      setHasMoreGifs(newGifs.length === limit);
      setGifOffset(offset + limit);
    } catch (err) {
      console.error('GIF yükleme başarısız:', err);
      setError('GIF yüklenemedi: ' + err.message);
      setErrorModalOpen(true);
      setGifs(append ? gifs : []);
    } finally {
      setIsLoadingMoreGifs(false);
    }
  };

  useEffect(() => {
    if (gifAnchorEl) {
      setGifOffset(0);
      setHasMoreGifs(true);
      loadGifs(0, false);
    } else {
      setGifs([]);
    }
  }, [gifAnchorEl]);

  const loadMoreGifs = () => {
    if (hasMoreGifs && !isLoadingMoreGifs) {
      loadGifs(gifOffset, true);
    }
  };

  // Medya için Blob Alma
  const fetchBlob = useCallback(async (url) => {
    if (blobCache.current[url] || blobCache.current[url] === null) {
      return blobCache.current[url];
    }
    try {
      const response = await fetch(url, {
        headers: {
          'ngrok-skip-browser-warning': 'true',
        },
        mode: 'cors',
      });
      if (!response.ok) {
        if (response.status === 403 || response.status === 404) {
          console.log(`Erişilemeyen URL: ${url}`);
          blobCache.current[url] = null;
        }
        throw new Error(`Alma başarısız: ${response.status}`);
      }
      const blob = await response.blob();
      const blobUrl = URL.createObjectURL(blob);
      blobCache.current[url] = blobUrl;
      console.log(`${url} için blob alındı: ${blobUrl}`);
      return blobUrl;
    } catch (error) {
      console.error(`${url} alınırken hata:`, error);
      blobCache.current[url] = null;
      return null;
    }
  }, []);

  // Resim Blob'larını Alma
  useEffect(() => {
    const fetchImageBlobs = async () => {
      const newBlobs = { ...blobCache.current };
      for (const msg of messages) {
        if (
          msg.direction === 'outbound' &&
          msg.urls &&
          ['Image', 'Sticker', 'Audio', 'Video'].includes(msg.messageType)
        ) {
          const urls = Array.isArray(msg.urls) ? msg.urls : [msg.urls];
          for (const url of urls) {
            if (!(url in newBlobs) && url) {
              newBlobs[url] = await fetchBlob(url);
            }
          }
        }
        if (
          msg.direction === 'outbound' &&
          msg.repliedMessage &&
          msg.repliedMessage.url &&
          ['Image', 'Sticker', 'Audio', 'Video'].includes(
            msg.repliedMessage.messageType
          )
        ) {
          let repliedUrls = [];
          try {
            repliedUrls = JSON.parse(msg.repliedMessage.url);
            if (!Array.isArray(repliedUrls)) repliedUrls = [repliedUrls];
          } catch {
            repliedUrls = [msg.repliedMessage.url];
          }
          for (const url of repliedUrls) {
            if (!(url in newBlobs) && url) {
              newBlobs[url] = await fetchBlob(url);
            }
          }
        }
      }
      blobCache.current = newBlobs;
      setImageBlobs(newBlobs);
      console.log('Güncellenen imageBlobs:', newBlobs);
    };
    fetchImageBlobs();
  }, [messages, fetchBlob]);

  // SignalR Bağlantısı
  useEffect(() => {
    const handleMessageReceived = (message) => {
      console.log('SignalR mesaj alındı:', message);
      if (message.conversationId === selectedConversationId) {
        const urls = message.urls && Array.isArray(message.urls)
          ? message.urls
          : message.url
          ? [message.url]
          : [];
        const messageType = message.messageType?.toLowerCase() || 'text';
        const newMessage = {
          id: message.mid,
          conversationId: message.conversationId,
          senderId: message.senderId,
          text: message.text,
          media: urls.length > 0
            ? urls.map((url) => ({
                type: messageType,
                url,
                name: url.split('/').pop() || 'medya',
              }))
            : null,
          audioUrl: messageType === 'audio' ? urls[0] : null,
          timestamp: message.timestamp,
          direction: message.direction.toLowerCase(),
          type: messageType,
          reactions: message.reactions || [],
          status: message.status.toLowerCase(),
          repliedMessage: message.repliedMessage || null,
          agentName: message.agentName,
        };
        setMessages((prev) => [...prev, newMessage]);
        scrollToBottom();
        if (message.direction.toLowerCase() === 'inbound' && playNotificationSound) {
          const audio = new Audio('/audio/messenger-short-ringtone.mp3');
          audio.play().catch((err) => console.error('Bildirim sesi çalma hatası:', err));
        }
      }
      const fetchConversations = async () => {
        try {
          const response = await apiFetch(
            `/api/InstagramMessenger/conversations?page=1&pageSize=20&search=${encodeURIComponent(
              conversationSearchQuery
            )}`,
            { method: 'GET' }
          );
          setConversations(
            response.data.map((conv) => ({
              id: conv.id,
              name: conv.name,
              profilePicture: conv.profilePicture || 'https://via.placeholder.com/40',
              lastMessage: {
                text: conv.lastMessage?.text || '',
                timestamp: conv.lastMessage?.timestamp || new Date().toISOString(),
              },
              unviewedCount: conv.unviewedCount,
              senderId: conv.senderId,
            }))
          );
          setTotalConversations(response.totalCount);
          setHasMoreConversations(response.data.length < response.totalCount);
        } catch (err) {
          setError('Sohbetler alınamadı: ' + err.message);
          setErrorModalOpen(true);
        }
      };
      fetchConversations();
    };

    const handleReactionReceived = (data) => {
      console.log('SignalR tepki alındı:', data);
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === data.messageId
            ? {
                ...msg,
                reactions: [...(msg.reactions || []), data.reaction],
              }
            : msg
        )
      );
    };

    const handleUnreactionReceived = (data) => {
      console.log('SignalR tepki kaldırma alındı:', data);
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === data.messageId
            ? {
                ...msg,
                reactions: msg.reactions.filter((r) => r !== data.reaction),
              }
            : msg
        )
      );
    };

    const connection = connectToSignalR((message) => {
      handleMessageReceived(message);
      connection.on('ReceiveReaction', handleReactionReceived);
      connection.on('ReceiveUnreaction', handleUnreactionReceived);
    });

    return () => {
      connection.stop();
    };
  }, [selectedConversationId, playNotificationSound, conversationSearchQuery]);

  // Sohbetleri Alma
  const fetchConversations = async (pageNum, append = false) => {
    setIsLoading(append ? false : true);
    setIsLoadingMoreConversations(append);
    try {
      const response = await apiFetch(
        `/api/InstagramMessenger/conversations?page=${pageNum}&pageSize=20&search=${encodeURIComponent(
          conversationSearchQuery
        )}`,
        { method: 'GET' }
      );
      const newConversations = response.data.map((conv) => ({
        id: conv.id,
        name: conv.name,
        profilePicture: conv.profilePicture || 'https://via.placeholder.com/40',
        lastMessage: {
          text: conv.lastMessage?.text || '',
          timestamp: conv.lastMessage?.timestamp || new Date().toISOString(),
        },
        unviewedCount: conv.unviewedCount,
        senderId: conv.senderId,
      }));
      setTotalConversations(response.totalCount);
      setConversations((prev) =>
        append ? [...prev, ...newConversations] : newConversations
      );
      setHasMoreConversations(
        (append ? conversations.length + newConversations.length : newConversations.length) <
          response.totalCount
      );
      setConversationPage(pageNum);
    } catch (err) {
      setError('Sohbetler alınamadı: ' + err.message);
      setErrorModalOpen(true);
    } finally {
      setIsLoading(false);
      setIsLoadingMoreConversations(false);
    }
  };

  const loadMoreConversations = () => {
    if (hasMoreConversations && !isLoadingMoreConversations) {
      const nextPage = conversationPage + 1;
      fetchConversations(nextPage, true);
    }
  };

  useEffect(() => {
    setConversationPage(1);
    fetchConversations(1, false);
  }, [conversationSearchQuery]);

  // Mesajları Alma
  useEffect(() => {
    if (selectedConversationId) {
      setPage(1);
      setMessages([]);
      fetchMessages(1, false);
    }
  }, [selectedConversationId]);

  const fetchMessages = async (pageNumber, append = false) => {
    setIsLoading(append ? false : true);
    setIsLoadingMoreMessages(append);
    try {
      const response = await apiFetch(
        `/api/InstagramMessenger/conversation-messages/${selectedConversationId}?page=${pageNumber}&pageSize=10`,
        { method: 'GET' }
      );
      const newMessages = response.messages.map((msg) => ({
        id: msg.id,
        conversationId: selectedConversationId,
        senderId: msg.senderId,
        text: msg.text,
        urls: msg.urls || (msg.url ? [msg.url] : []),
        messageType: msg.messageType,
        media: msg.urls
          ? msg.urls.map((url) => ({
              type: msg.messageType.toLowerCase(),
              url,
              name: url.split('/').pop() || 'medya',
            }))
          : null,
        audioUrl:
          msg.messageType.toLowerCase() === 'audio'
            ? msg.url || (msg.urls && msg.urls[0])
            : null,
        timestamp: msg.timestamp,
        direction: msg.direction.toLowerCase(),
        type: msg.messageType.toLowerCase(),
        reactions: msg.reactions || [],
        status: msg.status.toLowerCase(),
        repliedMessage: msg.repliedMessage || null,
        agentName: msg.agentName,
      }));
      setTotalMessages(response.totalMessages);
      if (append) {
        setMessages((prev) => [...newMessages, ...prev]);
      } else {
        setMessages(newMessages);
        scrollToBottom();
      }
      setPage(pageNumber);
    } catch (err) {
      setError('Mesajlar alınamadı: ' + err.message);
      setErrorModalOpen(true);
    } finally {
      setIsLoading(false);
      setIsLoadingMoreMessages(false);
    }
  };

  const loadMoreMessages = () => {
    if (messages.length < totalMessages && !isLoadingMoreMessages) {
      const nextPage = page + 1;
      fetchMessages(nextPage, true);
    }
  };

  // Mesaj Arama
  const handleMessageSearch = async () => {
    if (!messageSearchQuery.trim()) {
      setSearchedMessages([]);
      return;
    }
    try {
      const response = await apiFetch(
        `/api/InstagramMessenger/search-messages/${selectedConversationId}?query=${encodeURIComponent(
          messageSearchQuery
        )}`,
        { method: 'GET' }
      );
      setSearchedMessages(
        response.messages.map((msg) => ({
          id: msg.id,
          conversationId: selectedConversationId,
          senderId: msg.senderId,
          text: msg.text,
          media: msg.url
            ? [
                {
                  type: msg.messageType.toLowerCase(),
                  url: msg.url,
                  name: msg.url.split('/').pop() || 'medya',
                },
              ]
            : null,
          audioUrl: msg.messageType.toLowerCase() === 'audio' ? msg.url : null,
          timestamp: msg.timestamp,
          direction: msg.direction.toLowerCase(),
          type: msg.messageType.toLowerCase(),
          reactions: msg.reactions || [],
          status: msg.status.toLowerCase(),
          agentName: msg.agentName,
        }))
      );
    } catch (err) {
      setError('Mesajlar aranamadı: ' + err.message);
      setErrorModalOpen(true);
    }
  };

  // Medya, Ses ve Bağlantıları Alma
  const getMediaFiles = () =>
    messages
      .filter((msg) => msg.media && ['image', 'video', 'sticker'].includes(msg.type))
      .flatMap((msg) => msg.media.map((media) => ({ ...media, direction: msg.direction })));

  const getAudioFiles = () =>
    messages
      .filter((msg) => msg.type === 'audio')
      .map((msg) => ({
        type: 'audio',
        url: msg.audioUrl,
        name: msg.audioUrl.split('/').pop() || 'ses',
        direction: msg.direction,
      }));

  const getLinks = () =>
    messages
      .filter((msg) => msg.text && msg.text.includes('http'))
      .map((msg) => ({
        type: 'link',
        url: msg.text.match(/(https?:\/\/[^\s]+)/g)?.[0] || '',
        name: msg.text,
      }));

  // Sohbet Tıklama İşlemi
  const handleConversationClick = (id) => {
    setSelectedConversationId(id);
    setNewMessage('');
    setFiles([]);
    setFilePreviews([]);
    setAudioBlob(null);
    setSearchedMessages([]);
    setMessageSearchQuery('');
    setTabValue(0);
    setSubTabValue(0);
    setEmojiAnchorEl(null);
    setGifAnchorEl(null);
    setMenuAnchorEl(null);
  };

  // Dosya Değişim İşlemi
  const handleFileChange = (event) => {
    const selectedFiles = Array.from(event.target.files);
    const maxSizeMB = 20;
    const validFiles = selectedFiles.filter((file) => {
      const isValidType = file.type.startsWith('image/') || file.type.startsWith('video/');
      const isValidSize = file.size / 1024 / 1024 <= maxSizeMB;
      return isValidType && isValidSize;
    });
    if (validFiles.length !== selectedFiles.length) {
      setError(
        validFiles.length === 0
          ? 'Yalnızca 20MB’a kadar olan resimler ve videolar desteklenir.'
          : 'Bazı dosyalar reddedildi. Yalnızca 20MB’a kadar olan resimler ve videolar desteklenir.'
      );
      setErrorModalOpen(true);
      return;
    }
    if (validFiles.length > 0) {
      setFiles(validFiles);
      setFilePreviews(
        validFiles.map((file) => ({
          type: file.type.startsWith('image/') ? 'image' : 'video',
          url: URL.createObjectURL(file),
          name: file.name,
        }))
      );
    }
  };

  // Kayıt Başlat/Durdur
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorderRef.current = new MediaRecorder(stream);
      const chunks = [];
      mediaRecorderRef.current.ondataavailable = (e) => chunks.push(e.data);
      mediaRecorderRef.current.onstop = () => {
        const blob = new Blob(chunks, { type: 'audio/mp3' });
        setAudioBlob(blob);
        stream.getTracks().forEach((track) => track.stop());
      };
      mediaRecorderRef.current.start();
      setIsRecording(true);
      setRecordingDuration(0);
      timerRef.current = setInterval(() => {
        setRecordingDuration((prev) => prev + 1);
      }, 1000);
    } catch (err) {
      setError('Kayıt başlatılamadı: ' + err.message);
      setErrorModalOpen(true);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }
  };

  // Mesaj Gönderme
  const sendMessage = async () => {
    if (!newMessage.trim() && files.length === 0 && !audioBlob) return;
    if (!selectedConversation) return;

    let tempMessageId = Date.now().toString();
    let messageType;
    let urls = [];

    if (audioBlob) {
      messageType = 'Audio';
    } else if (files.length > 0) {
      const hasVideo = files.some((file) => file.type.startsWith('video/'));
      messageType = hasVideo ? 'Video' : 'Image';
    } else {
      messageType = 'Text';
    }

    if (files.length > 0) {
      try {
        const formData = new FormData();
        files.forEach((file) => formData.append('files', file));
        const uploadResponse = await apiFetch('/api/InstagramMessenger/upload-file', {
          method: 'POST',
          body: formData,
        });
        urls = uploadResponse.urls;
      } catch (err) {
        setError('Dosyalar yüklenemedi: ' + err.message);
        setErrorModalOpen(true);
        return;
      }
    }

    if (audioBlob) {
      try {
        const formData = new FormData();
        formData.append('files', audioBlob, 'audio.mp3');
        const uploadResponse = await apiFetch('/api/InstagramMessenger/upload-file', {
          method: 'POST',
          body: formData,
        });
        urls = uploadResponse.urls;
      } catch (err) {
        setError('Ses yüklenemedi: ' + err.message);
        setErrorModalOpen(true);
        return;
      }
    }

    setMessages((prev) => [
      ...prev,
      {
        id: null,
        tempId: tempMessageId,
        conversationId: selectedConversationId,
        senderId: cookies.get('userId') || 'user1',
        text: newMessage,
        media: urls.length > 0
          ? urls.map((url) => ({
              type: messageType.toLowerCase(),
              url,
              name: url.split('/').pop() || 'medya',
            }))
          : null,
        audioUrl: messageType === 'Audio' ? urls[0] : null,
        timestamp: new Date().toISOString(),
        status: 'gönderiliyor',
        type: messageType.toLowerCase(),
        direction: 'outbound',
        reactions: [],
        agentName: cookies.get('agentName') || null,
      },
    ]);
    scrollToBottom();

    try {
      const response = await apiFetch('/api/InstagramMessenger/send-message', {
        method: 'POST',
        body: JSON.stringify({
          conversationId: selectedConversationId,
          senderId: cookies.get('userId') || 'user1',
          recipientId: selectedConversation.senderId,
          text: newMessage,
          urls: urls,
          messageType: messageType,
          tempId: tempMessageId,
          agentName: cookies.get('agentName') || 'Bilinmeyen Temsilci',
        }),
      });
      setMessages((prev) =>
        prev.map((msg) =>
          msg.tempId === tempMessageId ? { ...msg, status: 'gönderildi', id: response.messageId } : msg
        )
      );
      setNewMessage('');
      setFiles([]);
      setFilePreviews([]);
      setAudioBlob(null);
    } catch (err) {
      setMessages((prev) =>
        prev.map((msg) =>
          msg.tempId === tempMessageId ? { ...msg, status: 'başarısız' } : msg
        )
      );
      setError('Mesaj gönderilemedi: ' + err.message);
      setErrorModalOpen(true);
    }
  };

  // Tepki İşlemi
  const handleReact = async (messageId) => {
    try {
      const message = messages.find((msg) => msg.id === messageId);
      if (!message) return;

      const hasReaction = message.reactions?.includes('❤️');
      const endpoint = hasReaction ? 'unreact' : 'react';
      const payload = {
        messageId,
        visual: '❤️',
        text: 'love',
      };

      await apiFetch(`/api/InstagramMessenger/${endpoint}`, {
        method: 'POST',
        body: JSON.stringify(payload),
      });

      if (hasReaction) {
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === messageId
              ? {
                  ...msg,
                  reactions: msg.reactions.filter((r) => r !== '❤️'),
                }
              : msg
          )
        );
      } else {
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === messageId
              ? {
                  ...msg,
                  reactions: [...(msg.reactions || []), '❤️'],
                }
              : msg
          )
        );
      }
      setMenuAnchorEl(null);
    } catch (err) {
      setError(`Tepki güncellenemedi: ${err.message || 'Bilinmeyen hata'}`);
      setErrorModalOpen(true);
    }
  };

  // Mesaj Menüsü
  const handleMessageMenuOpen = (event, messageId) => {
    setMenuAnchorEl(event.currentTarget);
    setSelectedMessageId(messageId);
  };

  const handleMessageMenuClose = () => {
    setMenuAnchorEl(null);
    setSelectedMessageId(null);
  };


  // Sohbet Arama
  const handleSearch = (query) => {
    setConversationSearchQuery(query);
  };

  // Kenar Çubuğu Kontrolleri
  const handleSidebarOpen = () => {
    setIsSidebarOpen(true);
  };

  const handleSidebarClose = () => {
    setIsSidebarOpen(false);
    setMessageSearchQuery('');
    setSearchedMessages([]);
    setTabValue(0);
    setSubTabValue(0);
  };

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
    if (newValue !== 1) setSubTabValue(0);
  };

  const handleSubTabChange = (event, newValue) => {
    setSubTabValue(newValue);
  };

  const handleNotificationSoundToggle = () => {
    setPlayNotificationSound((prev) => !prev);
  };

  // Emoji ve GIF İşleyicileri
  const handleEmojiClick = (event) => {
    setNewMessage((prev) => prev + event.emoji);
    setEmojiAnchorEl(null);
  };

  const handleEmojiOpen = (event) => {
    setEmojiAnchorEl(event.currentTarget);
  };

  const handleEmojiClose = () => {
    setEmojiAnchorEl(null);
  };

  const handleGifOpen = (event) => {
    setGifAnchorEl(event.currentTarget);
  };

  const handleGifClose = () => {
    setGifAnchorEl(null);
  };

  const handleGifClick = async (gif, e) => {
    e.preventDefault();
    if (!gif || !gif.images || !gif.images.fixed_height) {
      console.error('Geçersiz GIF nesnesi:', gif);
      setError('GIF seçilemedi: Geçersiz veri');
      setErrorModalOpen(true);
      return;
    }
    let tempMessageId = Date.now().toString();
    try {
      const gifUrl = gif.images.fixed_height.url;

      setMessages((prev) => [
        ...prev,
        {
          id: null,
          tempId: tempMessageId,
          conversationId: selectedConversationId,
          senderId: cookies.get('userId') || 'user1',
          text: '',
          media: [{ type: 'image', url: gifUrl, name: 'gif' }],
          timestamp: new Date().toISOString(),
          status: 'gönderiliyor',
          type: 'image',
          direction: 'outbound',
          reactions: [],
          agentName: cookies.get('agentName') || 'Bilinmeyen Temsilci',
        },
      ]);
      scrollToBottom();

      await apiFetch('/api/InstagramMessenger/send-message', {
        method: 'POST',
        body: JSON.stringify({
          conversationId: selectedConversationId,
          senderId: cookies.get('userId') || 'user1',
          recipientId: selectedConversation?.senderId,
          text: '',
          urls: [gifUrl],
          messageType: 'Image',
          tempId: tempMessageId,
          agentName: cookies.get('agentName') || 'Bilinmeyen Temsilci',
        }),
      });

      setMessages((prev) =>
        prev.map((msg) =>
          msg.tempId === tempMessageId ? { ...msg, status: 'gönderildi' } : msg
        )
      );
      setGifAnchorEl(null);
    } catch (err) {
      setError('GIF gönderilemedi: ' + err.message);
      setErrorModalOpen(true);
      setMessages((prev) =>
        prev.map((msg) =>
          msg.tempId === tempMessageId ? { ...msg, status: 'başarısız' } : msg
        )
      );
    }
  };

  const selectedConversation = conversations.find(
    (c) => c.id === selectedConversationId
  );

  return (
    <Box sx={{ display: 'flex', height: '100vh', bgcolor: '#fafafa' }}>
      <Box
        ref={conversationListRef}
        sx={{
          width: { xs: '100%', sm: '360px' },
          display: { xs: selectedConversationId ? 'none' : 'block', sm: 'block' },
          bgcolor: '#fff',
          borderRight: { sm: '1px solid #dbdbdb' },
          overflowY: 'auto',
          p: 2,
        }}
      >
        <Typography
          variant="h5"
          sx={{ fontWeight: 700, color: '#262626', mb: 2, pl: 1, textAlign: 'left' }}
        >
          Sohbet
        </Typography>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <InputBase
            placeholder="Sohbet ara..."
            value={conversationSearchQuery}
            onChange={(e) => handleSearch(e.target.value)}
            sx={{
              flexGrow: 1,
              bgcolor: '#efefef',
              p: 1,
              borderRadius: '10px',
              fontSize: '15px',
            }}
          />
          <IconButton sx={{ ml: 1, color: '#8e8e8e' }}>
            <Search />
          </IconButton>
        </Box>
        {isLoading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
            <CircularProgress size={24} sx={{ color: '#0095f6' }} />
          </Box>
        ) : (
          <List>
            {conversations.map((conv, index) => {
              const isLastElement = conversations.length === index + 1;
              return (
                <Box
                  key={conv.id}
                  ref={isLastElement ? lastConversationElementRef : null}
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    borderRadius: '15px',
                    mb: 0.5,
                    bgcolor: selectedConversationId === conv.id ? '#efefef' : 'transparent',
                  }}
                >
                  <ListItem
                    button
                    onClick={() => handleConversationClick(conv.id)}
                    sx={{ py: 1.5, flex: 1 }}
                  >
                    <Avatar
                      sx={{
                        mr: 2,
                        bgcolor: '#ddd',
                        border: '1px solid #fff',
                        boxShadow: '0 0 0 1px #dbdbdb',
                      }}
                      src={conv.profilePicture}
                    >
                      {conv.name[0]}
                    </Avatar>
                    <Box sx={{ flex: 1, overflow: 'hidden' }}>
                      <Typography
                        sx={{
                          fontSize: '16px',
                          fontWeight: conv.unviewedCount > 0 ? 700 : 500,
                          color: '#262626',
                        }}
                      >
                        {conv.name}
                      </Typography>
                      <Typography
                        sx={{
                          fontSize: '14px',
                          color: '#8e8e8e',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                        }}
                      >
                        {conv.lastMessage?.text || ''}
                      </Typography>
                    </Box>
                    {conv.unviewedCount > 0 && (
                      <Box
                        sx={{
                          bgcolor: '#0095f6',
                          color: '#fff',
                          borderRadius: '50%',
                          width: '20px',
                          height: '20px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '12px',
                          fontWeight: 600,
                          ml: 'auto',
                        }}
                      >
                        {conv.unviewedCount}
                      </Box>
                    )}
                  </ListItem>
                </Box>
              );
            })}
            {isLoadingMoreConversations && (
              <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
                <CircularProgress size={20} sx={{ color: '#0095f6' }} />
              </Box>
            )}
          </List>
        )}
      </Box>

      <Box
        sx={{
          flexGrow: 1,
          display: { xs: selectedConversationId ? 'flex' : 'none', sm: 'flex' },
          flexDirection: 'column',
          bgcolor: '#fff',
        }}
      >
        <Box
          sx={{
            p: 2,
            borderBottom: '1px solid #dbdbdb',
            display: 'flex',
            alignItems: 'center',
            bgcolor: '#fff',
          }}
        >
          {selectedConversationId && (
            <IconButton
              onClick={() => setSelectedConversationId(null)}
              sx={{ display: { sm: 'none' }, mr: 1 }}
            >
              <ArrowBack sx={{ color: '#262626' }} />
            </IconButton>
          )}
          <Avatar
            sx={{
              mr: 2,
              bgcolor: '#ddd',
              border: '1px solid #fff',
              boxShadow: '0 0 0 1px #dbdbdb',
            }}
            src={selectedConversation?.profilePicture}
          >
            {selectedConversation?.name[0]}
          </Avatar>
          <Typography
            variant="h6"
            sx={{
              fontWeight: 700,
              color: '#262626',
              flexGrow: 1,
              cursor: 'pointer',
              textAlign: 'left',
            }}
            onClick={handleSidebarOpen}
          >
            {selectedConversation?.name || ''}
          </Typography>
        </Box>

        <Box
          ref={messagesContainerRef}
          sx={{ flexGrow: 1, overflowY: 'auto', p: 3, bgcolor: '#fff' }}
        >
          {messages.length < totalMessages && (
            <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2 }}>
              <Button
                onClick={loadMoreMessages}
                disabled={isLoadingMoreMessages}
                sx={{
                  bgcolor: '#0095f6',
                  color: '#fff',
                  textTransform: 'none',
                  borderRadius: '10px',
                  padding: '8px 16px',
                  '&:hover': { bgcolor: '#007bb5' },
                }}
              >
                {isLoadingMoreMessages ? (
                  <CircularProgress size={20} sx={{ color: '#fff' }} />
                ) : (
                  'Daha Fazla Yükle'
                )}
              </Button>
            </Box>
          )}
          {isLoading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
              <CircularProgress size={24} sx={{ color: '#0095f6' }} />
            </Box>
          ) : messages.length === 0 ? (
            <Typography sx={{ textAlign: 'center', color: '#8e8e8e', mt: 4 }}>
              Mesaj bulunmamaktadır.
            </Typography>
          ) : (
            messages.map((msg) => (
              <Box
                key={msg.id || msg.tempId}
                sx={{
                  display: 'flex',
                  justifyContent:
                    msg.direction === 'outbound' ? 'flex-end' : 'flex-start',
                  mb: 2,
                  alignItems: 'flex-end',
                }}
              >
                {msg.direction === 'inbound' && (
                  <Avatar
                    sx={{ width: 24, height: 24, mr: 1 }}
                    src={selectedConversation?.profilePicture}
                  />
                )}
                <Box sx={{ maxWidth: '60%' }}>
                  <Box
                    sx={{
                      bgcolor:
                        msg.direction === 'outbound' ? '#0095f6' : '#efefef',
                      color: msg.direction === 'outbound' ? '#fff' : '#262626',
                      p: 1.5,
                      borderRadius: '20px',
                      fontSize: '15px',
                      wordBreak: 'break-word',
                    }}
                  >
                    {msg.media &&
                      msg.media.map((media, index) => (
                        <Box key={index} sx={{ mt: 1 }}>
                          {['image', 'sticker'].includes(media.type) ? (
                            <>
                              <img
                                src={
                                  msg.direction === 'outbound'
                                    ? imageBlobs[media.url] || media.url
                                    : media.url
                                }
                                alt={media.name}
                                style={{
                                  width: '100px',
                                  height: '100px',
                                  borderRadius: '12px',
                                  objectFit: 'cover',
                                  boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                                  border: '1px solid #dbdbdb',
                                }}
                                onError={(e) => {
                                  console.error('Resim yüklenemedi:', media.url);
                                  e.target.style.display = 'none';
                                  e.target.nextSibling.style.display = 'block';
                                }}
                              />
                              <Typography sx={{ display: 'none', color: 'red', mt: 1 }}>
                                Medya yüklenemedi
                              </Typography>
                            </>
                          ) : media.type === 'video' ? (
                            <>
                              <video
                                src={
                                  msg.direction === 'outbound'
                                    ? imageBlobs[media.url] || media.url
                                    : media.url
                                }
                                controls
                                style={{
                                  width: '100px',
                                  height: '100px',
                                  borderRadius: '12px',
                                  objectFit: 'cover',
                                  boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                                  border: '1px solid #dbdbdb',
                                }}
                                onError={(e) => {
                                  console.error('Video yüklenemedi:', media.url);
                                  e.target.style.display = 'none';
                                  e.target.nextSibling.style.display = 'block';
                                }}
                              />
                              <Typography sx={{ display: 'none', color: 'red', mt: 1 }}>
                                Medya yüklenemedi
                              </Typography>
                            </>
                          ) : media.type === 'audio' ? (
                            <>
                              <audio
                                src={
                                  msg.direction === 'outbound'
                                    ? imageBlobs[media.url] || media.url
                                    : media.url
                                }
                                controls
                                style={{ maxWidth: '100%' }}
                                onError={(e) => {
                                  console.error('Ses yüklenemedi:', media.url);
                                  e.target.style.display = 'none';
                                  e.target.nextSibling.style.display = 'block';
                                }}
                              />
                              <Typography sx={{ display: 'none', color: 'red', mt: 1 }}>
                                Medya yüklenemedi
                              </Typography>
                            </>
                          ) : (
                            <Typography sx={{ color: 'red' }}>
                              Desteklenmeyen medya tipi
                            </Typography>
                          )}
                        </Box>
                      ))}
                    {msg.type === 'audio' && msg.audioUrl && (
                      <>
                        <audio
                          src={
                            msg.direction === 'outbound'
                              ? imageBlobs[msg.audioUrl] || msg.audioUrl
                              : msg.audioUrl
                          }
                          controls
                          style={{ maxWidth: '100%' }}
                          onError={(e) => {
                            console.error('Ses yüklenemedi:', msg.audioUrl);
                            e.target.style.display = 'none';
                            e.target.nextSibling.style.display = 'block';
                          }}
                        />
                        <Typography sx={{ display: 'none', color: 'red', mt: 1 }}>
                          Medya yüklenemedi
                        </Typography>
                      </>
                    )}
                    {msg.type === 'text' && msg.text && <Typography>{msg.text}</Typography>}
                  </Box>
                  {msg.reactions?.length > 0 && (
                    <Box sx={{ mt: 0.5, display: 'flex', gap: 0.5 }}>
                      {msg.reactions.map((reaction, index) => (
                        <Typography key={index} sx={{ fontSize: '18px' }}>
                          {reaction}
                        </Typography>
                      ))}
                    </Box>
                  )}
                  {msg.direction === 'outbound' && msg.agentName && (
                    <Typography
                      sx={{
                        fontSize: '12px',
                        color: '#8e8e8e',
                        mt: 0.5,
                        textAlign: 'right',
                      }}
                    >
                      {msg.agentName}
                    </Typography>
                  )}
                  <Typography
                    sx={{
                      fontSize: '12px',
                      color: '#8e8e8e',
                      mt: 0.5,
                      textAlign: msg.direction === 'outbound' ? 'right' : 'left',
                    }}
                  >
                    {new Date(msg.timestamp).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                    {msg.status === 'gönderiliyor' && ' • Gönderiliyor...'}
                    {msg.status === 'başarısız' && ' • Başarısız'}
                  </Typography>
                </Box>
                <IconButton
                  onClick={(e) => handleMessageMenuOpen(e, msg.id)}
                  sx={{ ml: 1 }}
                >
                  <MoreVert sx={{ fontSize: '16px', color: '#8e8e8e' }} />
                </IconButton>
              </Box>
            ))
          )}
          <div ref={messagesEndRef} />
        </Box>

        {selectedConversationId && (
          <Box sx={{ p: 2, borderTop: '1px solid #dbdbdb' }}>
            {filePreviews.length > 0 && (
              <Box sx={{ display: 'flex', gap: 1, mb: 1, overflowX: 'auto' }}>
                {filePreviews.map((preview, index) => (
                  <Box key={index} sx={{ position: 'relative' }}>
                    {preview.type === 'image' ? (
                      <img
                        src={preview.url}
                        alt={preview.name}
                        style={{
                          width: '80px',
                          height: '80px',
                          objectFit: 'cover',
                          borderRadius: '10px',
                        }}
                      />
                    ) : (
                      <video
                        src={preview.url}
                        style={{
                          width: '80px',
                          height: '80px',
                          objectFit: 'cover',
                          borderRadius: '10px',
                        }}
                      />
                    )}
                    <IconButton
                      size="small"
                      sx={{
                        position: 'absolute',
                        top: 0,
                        right: '0px',
                        bgcolor: '#fff',
                      }}
                      onClick={() => {
                        setFiles((prev) => prev.filter((_, i) => i !== index));
                        setFilePreviews((prev) => prev.filter((_, i) => i !== index));
                      }}
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
                      </svg>
                    </IconButton>
                  </Box>
                ))}
              </Box>
            )}
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                bgcolor: '#efefef',
                borderRadius: '20px',
                p: 1,
              }}
            >
              <IconButton component="label" sx={{ color: '#0095f6', mr: 1 }}>
                <PhotoCamera />
                <input
                  type="file"
                  hidden
                  multiple
                  accept="image/*,video/*"
                  onChange={handleFileChange}
                />
              </IconButton>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <IconButton
                  onClick={isRecording ? stopRecording : startRecording}
                  sx={{ color: '#0095f6', mr: 1 }}
                >
                  {isRecording ? <Stop /> : <Mic />}
                </IconButton>
                {isRecording && (
                  <Typography sx={{ color: '#0095f6', fontSize: '14px', mr: 1 }}>
                    {formatDuration(recordingDuration)}
                  </Typography>
                )}
              </Box>
              <IconButton
                onClick={shareLocation}
                sx={{ color: '#0095f6', mr: 1 }}
                aria-label="Konum paylaş"
              >
                <LocationOn />
              </IconButton>
              <TextField
                placeholder="Mesaj..."
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                variant="standard"
                fullWidth
                InputProps={{ disableUnderline: true }}
                sx={{ mx: 1, fontSize: '15px' }}
                onKeyPress={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    sendMessage();
                  }
                }}
              />
              <IconButton
                onClick={handleEmojiOpen}
                sx={{ color: '#0095f6', mr: 1 }}
              >
                <Mood />
              </IconButton>
              <IconButton
                onClick={handleGifOpen}
                sx={{ color: '#0095f6', mr: 1 }}
              >
                <Gif />
              </IconButton>
              <IconButton
                onClick={sendMessage}
                sx={{ color: '#0095f6' }}
                disabled={!newMessage.trim() && files.length === 0 && !audioBlob}
              >
                <Send />
              </IconButton>
            </Box>
            <Popper
              open={Boolean(emojiAnchorEl)}
              anchorEl={emojiAnchorEl}
              placement="top-end"
              modifiers={[
                {
                  name: 'flip',
                  enabled: true,
                  options: {
                    fallbackPlacements: ['bottom-end'],
                  },
                },
                {
                  name: 'preventOverflow',
                  enabled: true,
                  options: {
                    boundariesElement: 'viewport',
                  },
                },
              ]}
              sx={{
                zIndex: 1300,
                transition: 'opacity 0.2s ease-in-out',
                opacity: Boolean(emojiAnchorEl) ? 1 : 0,
              }}
            >
              <Box
                ref={emojiPickerRef}
                sx={{
                  bgcolor: '#fff',
                  borderRadius: '12px',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                  p: 1.5,
                  width: { xs: 280, sm: 320 },
                  maxHeight: 400,
                  overflowY: 'auto',
                  outline: 'none',
                }}
              >
                {EmojiPicker ? (
                  <EmojiPicker
                    onEmojiClick={handleEmojiClick}
                    emojiStyle="apple"
                    width="100%"
                  />
                ) : (
                  <EmojiPickerFallback />
                )}
              </Box>
            </Popper>
            <Popper
              open={Boolean(gifAnchorEl)}
              anchorEl={gifAnchorEl}
              placement="top-end"
              modifiers={[
                {
                  name: 'flip',
                  enabled: true,
                  options: {
                    fallbackPlacements: ['bottom-end'],
                  },
                },
                {
                  name: 'preventOverflow',
                  enabled: true,
                  options: {
                    boundariesElement: 'viewport',
                  },
                },
              ]}
              sx={{
                zIndex: 1300,
                transition: 'opacity 0.2s ease-in-out',
                opacity: Boolean(gifAnchorEl) ? 1 : 0,
              }}
            >
              <Box
                ref={gifPickerRef}
                sx={{
                  bgcolor: '#fff',
                  borderRadius: '12px',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                  p: 1.5,
                  width: { xs: 280, sm: 320 },
                  maxHeight: 400,
                  overflowY: 'auto',
                  outline: 'none',
                }}
              >
                {gifs.length > 0 ? (
                  <>
                    <Box
                      sx={{
                        display: 'grid',
                        gridTemplateColumns: {
                          xs: 'repeat(3, 1fr)',
                          sm: 'repeat(4, 1fr)',
                        },
                        gap: 0.5,
                      }}
                    >
                      {gifs.map((gif) => (
                        <img
                          key={gif.id}
                          src={gif.images.fixed_height.url}
                          alt={gif.title || 'GIF'}
                          style={{
                            width: '80px',
                            height: '80px',
                            borderRadius: '8px',
                            cursor: 'pointer',
                            objectFit: 'cover',
                          }}
                          onClick={(e) => handleGifClick(gif, e)}
                        />
                      ))}
                    </Box>
                    {hasMoreGifs && (
                      <Box sx={{ textAlign: 'center', mt: 1 }}>
                        <IconButton
                          onClick={loadMoreGifs}
                          disabled={isLoadingMoreGifs}
                          sx={{
                            bgcolor: '#0095f6',
                            color: '#fff',
                            '&:hover': { bgcolor: '#007bb5' },
                            padding: '6px',
                            fontSize: '12px',
                          }}
                        >
                          {isLoadingMoreGifs ? (
                            <CircularProgress size={20} sx={{ color: '#fff' }} />
                          ) : (
                            <Typography sx={{ fontSize: '12px' }}>Daha Fazla</Typography>
                          )}
                        </IconButton>
                      </Box>
                    )}
                  </>
                ) : (
                  <Box sx={{ p: 2, textAlign: 'center' }}>
                    <CircularProgress size={20} sx={{ color: '#0095f6' }} />
                  </Box>
                )}
              </Box>
            </Popper>
          </Box>
        )}
      </Box>

      <Drawer
  anchor="right"
  open={isSidebarOpen}
  onClose={handleSidebarClose}
  sx={{
    '& .MuiDrawer-paper': {
      width: { xs: '100%', sm: '400px' },
      bgcolor: '#fff',
      p: 2,
      boxSizing: 'border-box',
    },
  }}
>
  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
    <IconButton onClick={handleSidebarClose} sx={{ mr: 1 }}>
      <ArrowBack />
    </IconButton>
    <Typography variant="h6" sx={{ fontWeight: 700, color: '#262626' }}>
      Detaylar
    </Typography>
  </Box>
  <Tabs
    value={tabValue}
    onChange={handleTabChange}
    variant="scrollable"
    scrollButtons="auto"
    sx={{
      mb: 1,
      bgcolor: '#fafafa',
      borderRadius: '10px',
      '.MuiTabs-indicator': {
        backgroundColor: '#0095f6',
        height: 3,
      },
    }}
    aria-label="Kenar çubuğu navigasyon sekmeleri"
  >
    <Tab
      label="Ara"
      sx={{
        textTransform: 'none',
        fontSize: '14px',
        fontWeight: 500,
        color: '#262626',
        '&.Mui-selected': {
          color: '#0095f6',
          fontWeight: 700,
        },
        '&:hover': {
          bgcolor: '#f0f0f0',
          borderRadius: '10px',
        },
        minHeight: '40px',
        px: 2,
      }}
    />
    <Tab
      label="Medya ve Dosyalar"
      sx={{
        textTransform: 'none',
        fontSize: '14px',
        fontWeight: 500,
        color: '#262626',
        '&.Mui-selected': {
          color: '#0095f6',
          fontWeight: 700,
        },
        '&:hover': {
          bgcolor: '#f0f0f0',
          borderRadius: '10px',
        },
        minHeight: '40px',
        px: 2,
      }}
    />
    <Tab
      label="Bildirimler"
      sx={{
        textTransform: 'none',
        fontSize: '14px',
        fontWeight: 500,
        color: '#262626',
        '&.Mui-selected': {
          color: '#0095f6',
          fontWeight: 700,
        },
        '&:hover': {
          bgcolor: '#f0f0f0',
          borderRadius: '10px',
        },
        minHeight: '40px',
        px: 2,
      }}
    />
  </Tabs>
  <Divider sx={{ mb: 2, bgcolor: '#dbdbdb' }} />
  <Box>
    <TabPanel value={tabValue} index={0}>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
        <InputBase
          placeholder="Sohbette ara..."
          value={messageSearchQuery}
          onChange={(e) => setMessageSearchQuery(e.target.value)}
          onKeyPress={(e) => {
            if (e.key === 'Enter') {
              handleMessageSearch();
            }
          }}
          sx={{
            flexGrow: 1,
            bgcolor: '#efefef',
            p: 1,
            borderRadius: '10px',
            fontSize: '15px',
          }}
        />
        <IconButton
          onClick={handleMessageSearch}
          sx={{ ml: 1, color: '#0095f6' }}
        >
          <Search />
        </IconButton>
      </Box>
      <List>
        {searchedMessages.length === 0 ? (
          <Typography sx={{ color: '#8e8e8e', textAlign: 'center' }}>
            Sonuç bulunamadı.
          </Typography>
        ) : (
          searchedMessages.map((msg) => (
            <ListItem
              key={msg.id}
              sx={{
                bgcolor: '#f5f5f5',
                borderRadius: '10px',
                mb: 1,
                p: 2,
              }}
            >
              <Box>
                <Typography sx={{ fontSize: '14px', color: '#262626' }}>
                  {msg.text}
                </Typography>
                <Typography sx={{ fontSize: '12px', color: '#8e8e8e' }}>
                  {new Date(msg.timestamp).toLocaleString()}
                </Typography>
              </Box>
            </ListItem>
          ))
        )}
      </List>
    </TabPanel>
    <TabPanel value={tabValue} index={1}>
      <Tabs
        value={subTabValue}
        onChange={handleSubTabChange}
        variant="scrollable"
        scrollButtons="auto"
        sx={{
          mb: 2,
          '.MuiTabs-indicator': {
            backgroundColor: '#0095f6',
            height: 2,
          },
        }}
        aria-label="Medya ve dosyalar alt sekmeleri"
      >
        <Tab
          label="Medya"
          sx={{
            textTransform: 'none',
            fontSize: '13px',
            fontWeight: 500,
            color: '#262626',
            '&.Mui-selected': {
              color: '#0095f6',
            },
            '&:hover': {
              bgcolor: '#f0f0f0',
              borderRadius: '8px',
            },
            minHeight: '36px',
            px: 1.5,
          }}
        />
        <Tab
          label="Dosyalar"
          sx={{
            textTransform: 'none',
            fontSize: '13px',
            fontWeight: 500,
            color: '#262626',
            '&.Mui-selected': {
              color: '#0095f6',
            },
            '&:hover': {
              bgcolor: '#f0f0f0',
              borderRadius: '8px',
            },
            minHeight: '36px',
            px: 1.5,
          }}
        />
        <Tab
          label="Bağlantılar"
          sx={{
            textTransform: 'none',
            fontSize: '13px',
            fontWeight: 500,
            color: '#262626',
            '&.Mui-selected': {
              color: '#0095f6',
            },
            '&:hover': {
              bgcolor: '#f0f0f0',
              borderRadius: '8px',
            },
            minHeight: '36px',
            px: 1.5,
          }}
        />
      </Tabs>
      {subTabValue === 0 && (
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
          {getMediaFiles().length === 0 ? (
            <Typography sx={{ color: '#8e8e8e' }}>Medya bulunamadı.</Typography>
          ) : (
            getMediaFiles().map((media, index) => (
              <Box key={index} sx={{ width: '100px' }}>
                {['image', 'sticker'].includes(media.type) ? (
                  <>
                    <img
                      src={
                        media.direction === 'outbound'
                          ? imageBlobs[media.url] || media.url
                          : media.url
                      }
                      alt={media.name}
                      style={{
                        width: '100px',
                        height: '100px',
                        borderRadius: '12px',
                        objectFit: 'cover',
                        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                        border: '1px solid #dbdbdb',
                      }}
                      onError={(e) => {
                        console.error('Kenar çubuğu resmi yüklenemedi:', media.url);
                        e.target.style.display = 'none';
                        e.target.nextSibling.style.display = 'block';
                      }}
                    />
                    <Typography sx={{ display: 'none', color: 'red', mt: 1 }}>
                      Medya yüklenemedi
                    </Typography>
                  </>
                ) : media.type === 'video' ? (
                  <>
                    <video
                      src={
                        media.direction === 'outbound'
                          ? imageBlobs[media.url] || media.url
                          : media.url
                      }
                      controls
                      style={{
                        width: '100px',
                        height: '100px',
                        borderRadius: '12px',
                        objectFit: 'cover',
                        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                        border: '1px solid #dbdbdb',
                      }}
                      onError={(e) => {
                        console.error('Kenar çubuğu videosu yüklenemedi:', media.url);
                        e.target.style.display = 'none';
                        e.target.nextSibling.style.display = 'block';
                      }}
                    />
                    <Typography sx={{ display: 'none', color: 'red', mt: 1 }}>
                      Medya yüklenemedi
                    </Typography>
                  </>
                ) : null}
              </Box>
            ))
          )}
        </Box>
      )}
      {subTabValue === 1 && (
        <Box>
          {getAudioFiles().length === 0 ? (
            <Typography sx={{ color: 'red' }}>Dosya bulunamadı.</Typography>
          ) : (
            getAudioFiles().map((file, index) => (
              <Box
                key={index}
                sx={{
                  bgcolor: '#f5f5f5',
                  borderRadius: '10px',
                  p: 2,
                  mb: 1,
                }}
              >
                <audio
                  src={
                    file.direction === 'outbound'
                      ? imageBlobs[file.url] || file.url
                      : file.url
                  }
                  controls
                  style={{ width: '100%' }}
                  onError={(e) => {
                    console.error('Kenar çubuğu sesi yüklenemedi:', file.url);
                  }}
                />
              </Box>
            ))
          )}
        </Box>
      )}
      {subTabValue === 2 && (
        <Box>
          {getLinks().length === 0 ? (
            <Typography sx={{ color: '#8e8e8e' }}>Bağlantı bulunamadı.</Typography>
          ) : (
            getLinks().map((link, index) => (
              <Box
                key={index}
                sx={{
                  bgcolor: '#f5f5f5',
                  borderRadius: '10px',
                  p: 2,
                  mb: 1,
                }}
              >
                <Typography
                  sx={{ color: '#0095f6', cursor: 'pointer' }}
                  onClick={() => window.open(link.url, '_blank')}
                >
                  {link.name}
                </Typography>
              </Box>
            ))
          )}
        </Box>
      )}
    </TabPanel>
    <TabPanel value={tabValue} index={2}>
      <Box sx={{ display: 'flex', alignItems: 'center' }}>
        <Typography sx={{ flexGrow: 1, color: '#262626' }}>
          Bildirim ve Ses
        </Typography>
        <Switch
          checked={playNotificationSound}
          onChange={handleNotificationSoundToggle}
          color="primary"
        />
      </Box>
    </TabPanel>
  </Box>
</Drawer>
      <Menu
        anchorEl={menuAnchorEl}
        open={Boolean(menuAnchorEl)}
        onClose={handleMessageMenuClose}
        PaperProps={{
          sx: { borderRadius: '10px', boxShadow: '0 2px 8px rgba(0,0,0,0.15)' },
        }}
      >
        <MenuItem onClick={() => handleReact(selectedMessageId)}>
          {messages
            .find((msg) => msg.id === selectedMessageId)
            ?.reactions?.includes('❤️')
            ? 'Tepkiyi Kaldır'
            : 'Tepki Ver'}
        </MenuItem>
      </Menu>

      <Modal open={errorModalOpen} onClose={() => setErrorModalOpen(false)}>
        <Box
          sx={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            bgcolor: '#fff',
            borderRadius: '15px',
            p: 3,
            maxWidth: '90%',
            width: '400px',
            textAlign: 'center',
          }}
        >
          <Typography
            variant="h6"
            sx={{ fontWeight: 600, color: '#e0245e', mb: 2 }}
          >
            Hata
          </Typography>
          <Typography sx={{ mb: 3, color: '#444' }}>{error}</Typography>
          <Box sx={{ display: 'flex', justifyContent: 'center' }}>
            <IconButton
              onClick={() => setErrorModalOpen(false)}
              sx={{
                bgcolor: '#0095f6',
                color: '#fff',
              }}
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
              </svg>
            </IconButton>
          </Box>
        </Box>
      </Modal>


    </Box>
  );
};

export default InstagramMessengerPage;