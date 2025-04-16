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
} from '@mui/icons-material';
import EmojiPicker from 'emoji-picker-react';
import { GiphyFetch } from '@giphy/js-fetch-api';
import connectToSignalR from '../../../utils/signalR/signalR';
import { apiFetch } from '../../../api/instagram/chat/api';
import { cookies } from '../../../utils/cookie';

// Initialize Giphy with API key
const giphy = new GiphyFetch(process.env.REACT_APP_GIPHY_API_KEY || 'oB1EVOJbfDDYYo40epom83LAzoC3jALn');

// Fallbacks
const EmojiPickerFallback = () => (
  <Box sx={{ p: 2, bgcolor: '#fff', borderRadius: '10px' }}>
    <Typography color="error">Emoji picker failed to load</Typography>
  </Box>
);

const GifPickerFallback = () => (
  <Box sx={{ p: 2, bgcolor: '#fff', borderRadius: '10px' }}>
    <Typography color="error">GIF picker failed to load</Typography>
  </Box>
);

const InstagramMessengerPage = () => {
  // State
  const [conversations, setConversations] = useState([]);
  const [selectedConversationId, setSelectedConversationId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [conversationSearchQuery, setConversationSearchQuery] = useState('');
  const [files, setFiles] = useState([]);
  const [filePreviews, setFilePreviews] = useState([]);
  const [audioBlob, setAudioBlob] = useState(null);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0); // New state for recording duration
  const [error, setError] = useState('');
  const [errorModalOpen, setErrorModalOpen] = useState(false);
  const [otnModalOpen, setOtnModalOpen] = useState(false);
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

  const messagesEndRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const blobCache = useRef({});
  const timerRef = useRef(null); // Ref to store the timer interval

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Format recording duration as MM:SS
  const formatDuration = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Fetch GIFs
  const loadGifs = async (offset = 0, append = false) => {
    try {
      setIsLoadingMoreGifs(true);
      const limit = 30;
      const result = await giphy.trending({ limit, offset });
      if (!result.data || !Array.isArray(result.data)) {
        throw new Error('Invalid Giphy API response');
      }
      const newGifs = result.data;
      setGifs((prev) => (append ? [...prev, ...newGifs] : newGifs));
      setHasMoreGifs(newGifs.length === limit);
      setGifOffset(offset + limit);
    } catch (err) {
      console.error('Failed to load GIFs:', err);
      setError('Failed to load GIFs: ' + err.message);
      setErrorModalOpen(true);
      setGifs(append ? gifs : []);
    } finally {
      setIsLoadingMoreGifs(false);
    }
  };

  // Fetch GIFs when modal opens
  useEffect(() => {
    if (gifAnchorEl) {
      setGifOffset(0);
      setHasMoreGifs(true);
      loadGifs(0, false);
    } else {
      setGifs([]);
    }
  }, [gifAnchorEl]);

  // Load more GIFs
  const loadMoreGifs = () => {
    if (hasMoreGifs && !isLoadingMoreGifs) {
      loadGifs(gifOffset, true);
    }
  };

  // Memoized blob fetcher
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
          console.log(`URL not accessible: ${url}`);
          blobCache.current[url] = null;
        }
        throw new Error(`Failed to fetch: ${response.status}`);
      }
      const blob = await response.blob();
      const blobUrl = URL.createObjectURL(blob);
      blobCache.current[url] = blobUrl;
      console.log(`Fetched blob for ${url}: ${blobUrl}`);
      return blobUrl;
    } catch (error) {
      console.error(`Error fetching ${url}:`, error);
      blobCache.current[url] = null;
      return null;
    }
  }, []);

  // Fetch blobs only for outbound media
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
      console.log('Updated imageBlobs:', newBlobs);
    };
    fetchImageBlobs();
  }, [messages, fetchBlob]);

  // SignalR
  useEffect(() => {
    const handleMessageReceived = (message) => {
      console.log('Received message signalR:', message);
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
                name: url.split('/').pop() || 'media',
              }))
            : null,
          audioUrl: messageType === 'audio' ? urls[0] : null,
          timestamp: message.timestamp,
          direction: message.direction.toLowerCase(),
          type: messageType,
          reactions: message.reactions || [],
          status: message.status.toLowerCase(),
          repliedMessage: message.repliedMessage || null,
        };
        setMessages((prev) => [...prev, newMessage]);
        scrollToBottom();
        if (message.direction.toLowerCase() === 'inbound' && playNotificationSound) {
          const audio = new Audio('/audio/messenger-short-ringtone.mp3');
          audio.play().catch((err) => console.error('Error playing notification sound:', err));
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
        } catch (err) {
          setError('Failed to fetch conversations: ' + err.message);
          setErrorModalOpen(true);
        } finally {
          setIsLoading(false);
        }
      };
      fetchConversations();
    };

    const handleReactionReceived = (data) => {
      console.log('Received reaction signalR:', data);
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
      console.log('Received unreaction signalR:', data);
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

  // Fetch conversations
  useEffect(() => {
    const fetchConversations = async () => {
      setIsLoading(true);
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
      } catch (err) {
        setError('Failed to fetch conversations: ' + err.message);
        setErrorModalOpen(true);
      } finally {
        setIsLoading(false);
      }
    };
    fetchConversations();
  }, [conversationSearchQuery]);

  // Fetch messages
  useEffect(() => {
    if (selectedConversationId) {
      const fetchMessages = async () => {
        setIsLoading(true);
        try {
          const response = await apiFetch(
            `/api/InstagramMessenger/conversation-messages/${selectedConversationId}?page=1&pageSize=20`,
            { method: 'GET' }
          );
          setMessages(
            response.messages.map((msg) => ({
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
                    name: url.split('/').pop() || 'media',
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
            }))
          );
          scrollToBottom();
        } catch (err) {
          setError('Failed to fetch messages: ' + err.message);
          setErrorModalOpen(true);
        } finally {
          setIsLoading(false);
        }
      };
      fetchMessages();
    }
  }, [selectedConversationId]);

  // Search messages
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
                  name: msg.url.split('/').pop() || 'media',
                },
              ]
            : null,
          audioUrl: msg.messageType.toLowerCase() === 'audio' ? msg.url : null,
          timestamp: msg.timestamp,
          direction: msg.direction.toLowerCase(),
          type: msg.messageType.toLowerCase(),
          reactions: msg.reactions || [],
          status: msg.status.toLowerCase(),
        }))
      );
    } catch (err) {
      setError('Failed to search messages: ' + err.message);
      setErrorModalOpen(true);
    }
  };

  // Filter media, files, and links
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
        name: msg.audioUrl.split('/').pop() || 'audio',
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

  // Handlers
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
          ? 'Only images and videos up to 20MB are supported.'
          : 'Some files were rejected. Only images and videos up to 20MB are supported.'
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
      setRecordingDuration(0); // Reset duration
      // Start timer
      timerRef.current = setInterval(() => {
        setRecordingDuration((prev) => prev + 1);
      }, 1000);
    } catch (err) {
      setError('Failed to start recording: ' + err.message);
      setErrorModalOpen(true);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      // Clear timer
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() && files.length === 0 && !audioBlob) return;
    if (!selectedConversation) return;

    let tempMessageId = Date.now().toString();
    let messageType;
    if (audioBlob) {
      messageType = 'Audio';
    } else if (files.length > 0) {
      const hasVideo = files.some((file) => file.type.startsWith('video/'));
      messageType = hasVideo ? 'Video' : 'Image';
    } else {
      messageType = 'Text';
    }

    let urls = [];

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
        setError('Failed to upload files: ' + err.message);
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
        setError('Failed to upload audio: ' + err.message);
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
              name: url.split('/').pop() || 'media',
            }))
          : null,
        audioUrl: messageType === 'Audio' ? urls[0] : null,
        timestamp: new Date().toISOString(),
        status: 'sending',
        type: messageType.toLowerCase(),
        direction: 'outbound',
        reactions: [],
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
        }),
      });
      setMessages((prev) =>
        prev.map((msg) =>
          msg.tempId === tempMessageId ? { ...msg, status: 'sent', id: response.messageId } : msg
        )
      );
      setNewMessage('');
      setFiles([]);
      setFilePreviews([]);
      setAudioBlob(null);
    } catch (err) {
      setMessages((prev) =>
        prev.map((msg) =>
          msg.tempId === tempMessageId ? { ...msg, status: 'failed' } : msg
        )
      );
      setError('Failed to send message: ' + err.message);
      setErrorModalOpen(true);
    }
  };

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
      setError(`Failed to update reaction: ${err.message || 'Unknown error'}`);
      setErrorModalOpen(true);
    }
  };

  const handleMessageMenuOpen = (event, messageId) => {
    setMenuAnchorEl(event.currentTarget);
    setSelectedMessageId(messageId);
  };

  const handleMessageMenuClose = () => {
    setMenuAnchorEl(null);
    setSelectedMessageId(null);
  };

  const handleOtnRequest = async () => {
    try {
      await apiFetch('/api/InstagramMessenger/request-otn', {
        method: 'POST',
        body: JSON.stringify({
          recipientId: selectedConversation?.senderId,
        }),
      });
      setOtnModalOpen(false);
    } catch (err) {
      setError('Failed to request OTN: ' + err.message);
      setErrorModalOpen(true);
    }
  };

  const handleSearch = (query) => {
    setConversationSearchQuery(query);
  };

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
      console.error('Invalid GIF object:', gif);
      setError('Failed to select GIF: Invalid data');
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
          status: 'sending',
          type: 'image',
          direction: 'outbound',
          reactions: [],
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
        }),
      });

      setMessages((prev) =>
        prev.map((msg) =>
          msg.tempId === tempMessageId ? { ...msg, status: 'sent' } : msg
        )
      );
      setGifAnchorEl(null);
    } catch (err) {
      setError('Failed to send GIF: ' + err.message);
      setErrorModalOpen(true);
      setMessages((prev) =>
        prev.map((msg) =>
          msg.tempId === tempMessageId ? { ...msg, status: 'failed' } : msg
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
            {conversations.map((conv) => (
              <Box
                key={conv.id}
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
            ))}
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

        <Box sx={{ flexGrow: 1, overflowY: 'auto', p: 3, bgcolor: '#fff' }}>
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
                      color:
                        msg.direction === 'outbound' ? '#fff' : '#262626',
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
                                  console.error(
                                    'Failed to load image:',
                                    media.url
                                  );
                                  e.target.style.display = 'none';
                                  e.target.nextSibling.style.display = 'block';
                                }}
                              />
                              <Typography
                                sx={{ display: 'none', color: 'red', mt: 1 }}
                              >
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
                                  console.error(
                                    'Failed to load video:',
                                    media.url
                                  );
                                  e.target.style.display = 'none';
                                  e.target.nextSibling.style.display = 'block';
                                }}
                              />
                              <Typography
                                sx={{ display: 'none', color: 'red', mt: 1 }}
                              >
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
                                  console.error(
                                    'Failed to load audio:',
                                    media.url
                                  );
                                  e.target.style.display = 'none';
                                  e.target.nextSibling.style.display = 'block';
                                }}
                              />
                              <Typography
                                sx={{ display: 'none', color: 'red', mt: 1 }}
                              >
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
                            console.error(
                              'Failed to load audio:',
                              msg.audioUrl
                            );
                            e.target.style.display = 'none';
                            e.target.nextSibling.style.display = 'block';
                          }}
                        />
                        <Typography
                          sx={{ display: 'none', color: 'red', mt: 1 }}
                        >
                          Medya yüklenemedi
                        </Typography>
                      </>
                    )}
                    {msg.type === 'text' && msg.text && (
                      <Typography>{msg.text}</Typography>
                    )}
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
                  <Typography
                    sx={{
                      fontSize: '12px',
                      color: '#8e8e8e',
                      mt: 0.5,
                      textAlign:
                        msg.direction === 'outbound' ? 'right' : 'left',
                    }}
                  >
                    {new Date(msg.timestamp).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                    {msg.status === 'sending' && ' • Sending...'}
                    {msg.status === 'failed' && ' • Failed'}
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
                        setFilePreviews((prev) =>
                          prev.filter((_, i) => i !== index)
                        );
                      }}
                    >
                      <svg
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="currentColor"
                      >
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
            <Modal
              open={Boolean(emojiAnchorEl)}
              onClose={handleEmojiClose}
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Box sx={{ outline: 'none' }}>
                {EmojiPicker ? (
                  <EmojiPicker onEmojiClick={handleEmojiClick} emojiStyle="apple" />
                ) : (
                  <EmojiPickerFallback />
                )}
              </Box>
            </Modal>
            <Modal
              open={Boolean(gifAnchorEl)}
              onClose={handleGifClose}
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Box
                sx={{
                  outline: 'none',
                  bgcolor: '#fff',
                  borderRadius: '10px',
                  p: 2,
                  maxHeight: '80vh',
                  overflowY: 'auto',
                  maxWidth: '90%',
                  width: '360px',
                }}
              >
                {gifs.length > 0 ? (
                  <>
                    <Box
                      sx={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(3, 1fr)',
                        gap: 1,
                      }}
                    >
                      {gifs.map((gif) => (
                        <img
                          key={gif.id}
                          src={gif.images.fixed_height.url}
                          alt={gif.title || 'GIF'}
                          style={{
                            width: '100px',
                            height: '100px',
                            borderRadius: '8px',
                            cursor: 'pointer',
                            objectFit: 'cover',
                          }}
                          onClick={(e) => handleGifClick(gif, e)}
                        />
                      ))}
                    </Box>
                    {hasMoreGifs && (
                      <Box sx={{ textAlign: 'center', mt: 2 }}>
                        <IconButton
                          onClick={loadMoreGifs}
                          disabled={isLoadingMoreGifs}
                          sx={{
                            bgcolor: '#0095f6',
                            color: '#fff',
                            '&:hover': { bgcolor: '#007bb5' },
                          }}
                        >
                          {isLoadingMoreGifs ? (
                            <CircularProgress size={24} sx={{ color: '#fff' }} />
                          ) : (
                            <Typography sx={{ fontSize: '14px' }}>
                              Load More
                            </Typography>
                          )}
                        </IconButton>
                      </Box>
                    )}
                  </>
                ) : (
                  <Box sx={{ p: 2, textAlign: 'center' }}>
                    <CircularProgress size={24} sx={{ color: '#0095f6' }} />
                  </Box>
                )}
              </Box>
            </Modal>
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
          },
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <IconButton onClick={handleSidebarClose} sx={{ mr: 1 }}>
            <ArrowBack />
          </IconButton>
          <Typography variant="h6" sx={{ fontWeight: 700, color: '#262626' }}>
            Details
          </Typography>
        </Box>
        <Tabs
          value={tabValue}
          onChange={handleTabChange}
          sx={{ mb: 2 }}
          variant="fullWidth"
        >
          <Tab label="Search" />
          <Tab label="Media & Files" />
          <Tab label="Notifications" />
          <Tab label="OTN" />
        </Tabs>
        <Box sx={{ mt: 2 }}>
          {tabValue === 0 && (
            <Box>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <InputBase
                  placeholder="Search in conversation..."
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
            </Box>
          )}
          {tabValue === 1 && (
            <Box>
              <Tabs
                value={subTabValue}
                onChange={handleSubTabChange}
                sx={{ mb: 2 }}
              >
                <Tab label="Media" />
                <Tab label="Files" />
                <Tab label="Links" />
              </Tabs>
              {subTabValue === 0 && (
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                  {getMediaFiles().length === 0 ? (
                    <Typography sx={{ color: '#8e8e8e' }}>
                      No media found.
                    </Typography>
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
                                console.error(
                                  'Failed to load sidebar image:',
                                  media.url
                                );
                                e.target.style.display = 'none';
                                e.target.nextSibling.style.display = 'block';
                              }}
                            />
                            <Typography
                              sx={{ display: 'none', color: 'red', mt: 1 }}
                            >
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
                                console.error(
                                  'Failed to load sidebar video:',
                                  media.url
                                );
                                e.target.style.display = 'none';
                                e.target.nextSibling.style.display = 'block';
                              }}
                            />
                            <Typography
                              sx={{ display: 'none', color: 'red', mt: 1 }}
                            >
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
                    <Typography sx={{ color: 'red' }}>
                      No files found.
                    </Typography>
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
                            console.error(
                              'Failed to load sidebar audio:',
                              file.url
                            );
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
                    <Typography sx={{ color: '#8e8e8e' }}>
                      No links found.
                    </Typography>
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
            </Box>
          )}
          {tabValue === 2 && (
            <Box sx={{ p: 2 }}>
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
            </Box>
          )}
          {tabValue === 3 && (
            <Box sx={{ p: 2 }}>
              <ListItem
                button
                onClick={() => setOtnModalOpen(true)}
                sx={{
                  bgcolor: '#efefef',
                  borderRadius: '10px',
                  justifyContent: 'center',
                }}
              >
                <ListItemText primary="Request OTN" />
              </ListItem>
            </Box>
          )}
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
          {messages.find((msg) => msg.id === selectedMessageId)?.reactions?.includes('❤️')
            ? 'Unreact'
            : 'React'}
        </MenuItem>
        <MenuItem onClick={() => setOtnModalOpen(true)}>
          Request OTN
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
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="currentColor"
              >
                <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
              </svg>
            </IconButton>
          </Box>
        </Box>
      </Modal>

      <Modal open={otnModalOpen} onClose={() => setOtnModalOpen(false)}>
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
            sx={{ fontWeight: 600, color: '#0095f6', mb: 2 }}
          >
            Request Notification Permission
          </Typography>
          <Typography variant="body2" sx={{ mb: 3, color: '#444' }}>
            Instagram requires your permission to send a one-time notification.
          </Typography>
          <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2 }}>
            <IconButton
              onClick={() => setOtnModalOpen(false)}
              sx={{
                bgcolor: '#efefef',
                color: '#262626',
              }}
            >
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="currentColor"
              >
                <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
              </svg>
            </IconButton>
            <IconButton
              onClick={handleOtnRequest}
              sx={{
                bgcolor: '#0095f6',
                color: '#fff',
              }}
            >
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="currentColor"
              >
                <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
              </svg>
            </IconButton>
          </Box>
        </Box>
      </Modal>
    </Box>
  );
};

export default InstagramMessengerPage;