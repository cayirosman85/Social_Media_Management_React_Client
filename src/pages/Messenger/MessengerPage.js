import React, { useEffect, useState, useRef,useCallback  } from 'react';
import {
  Typography,
  TextField,
  Button,
  Box,
  List,
  ListItem,
  ListItemText,
  IconButton,
  Menu,
  MenuItem,
  Modal,
  Avatar,
  CircularProgress,
  Tabs,
  Tab,
  InputBase,
  Switch,
  FormControlLabel,
  Accordion, AccordionSummary, AccordionDetails
} from '@mui/material';

import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import {
  Check,
  DoneAll,
  AttachFile,
  SentimentSatisfiedAlt,
  ArrowDropDown,
  Close,
  Mic,
  Image,
  InsertDriveFile,
  Link,
  Search,
  Notifications,
  ThumbUp,
} from '@mui/icons-material';
import * as signalR from '@microsoft/signalr';
import { useNavigate } from 'react-router-dom';
import localStorage from 'local-storage';
import Picker from 'emoji-picker-react';
import { FFmpeg } from '@ffmpeg/ffmpeg';
import { useLocation } from 'react-router-dom';
import { apiFetch } from '../../api/messenger/api';
import debounce from 'lodash/debounce';
const MessengerPage = () => {
  const [conversations, setConversations] = useState([]);
  const [selectedConversationId, setSelectedConversationId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [files, setFiles] = useState([]);
  const [filePreviews, setFilePreviews] = useState([]);
  const [connection, setConnection] = useState(null);
  const [error, setError] = useState(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [anchorElMessage, setAnchorElMessage] = useState(null);
  const [anchorElConversation, setAnchorElConversation] = useState(null);
  const [selectedMessageId, setSelectedMessageId] = useState(null);
  const [selectedConversationIdForMenu, setSelectedConversationIdForMenu] = useState(null);
  const [openModal, setOpenModal] = useState(false);
  const [modalMedia, setModalMedia] = useState({ type: '', url: '' });
  const [page, setPage] = useState(1);
  const [totalMessages, setTotalMessages] = useState(0);
  const [showLoadMore, setShowLoadMore] = useState(false);
  const [replyingTo, setReplyingTo] = useState(null);
  const [isRecording, setIsRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState(null);
  const [recordingTime, setRecordingTime] = useState(0);
  const [showSidebar, setShowSidebar] = useState(false);
  const [activeTab, setActiveTab] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [mediaItems, setMediaItems] = useState([]);
  const [fileItems, setFileItems] = useState([]);
  const [linkItems, setLinkItems] = useState([]);
  const [isRecipientTyping, setIsRecipientTyping] = useState(false);
  const [isMediaLoading, setIsMediaLoading] = useState(true);
  const [playNotificationSound, setPlayNotificationSound] = useState(() => {
    const saved = localStorage.get('playNotificationSound');
    return saved !== null ? JSON.parse(saved) : true;
  });
  const [otnTokens, setOtnTokens] = useState({});
  const [openOtnModal, setOpenOtnModal] = useState(false);
  const [otnTitle, setOtnTitle] = useState('Güncelleme için tekrar bilgilendirebilir miyiz?');
  const [errorModalOpen, setErrorModalOpen] = useState(false);

  const typingTimeoutRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const timerRef = useRef(null);
  const messagesEndRef = useRef(null);
  const messagesContainerRef = useRef(null);
  const conversationsEndRef = useRef(null);
  const messageRefs = useRef({});
  const navigate = useNavigate();
  const ffmpegRef = useRef(new FFmpeg({ log: true }));
  const [ffmpegLoaded, setFfmpegLoaded] = useState(false);
  
  const [useOtnForMessage, setUseOtnForMessage] = useState(false);
  const [otnConfirmationModalOpen, setOtnConfirmationModalOpen] = useState(false);
  const [userId, setUserId] = useState(null);
  const [humanAgentModalOpen, setHumanAgentModalOpen] = useState(false);
  const [humanAgentMessage, setHumanAgentMessage] = useState('');
  const [confirmModalOpen, setConfirmModalOpen] = useState(false); 
  const [confirmAction, setConfirmAction] = useState(null); 
  const [confirmMessage, setConfirmMessage] = useState(''); 
  const [infoMessage, setInfoMessage] = useState(null);
const [infoModalOpen, setInfoModalOpen] = useState(false);
const [conversationSearchQuery, setConversationSearchQuery] = useState('');
const [imageBlobs, setImageBlobs] = useState({});
const newBlobs = { ...imageBlobs };
const [loading, setLoading] = useState(true);
  const [totalConversations, setTotalConversations] = useState(0);
  const [pageSize] = useState(20); // Match backend default
  const [isLoadingConversations, setIsLoadingConversations] = useState(false);
  const [hasMoreConversations, setHasMoreConversations] = useState(true);
  const [messageTagModalOpen, setMessageTagModalOpen] = useState(false);
  const [selectedMessageTag, setSelectedMessageTag] = useState(null);
  const [tagMessage, setTagMessage] = useState('');
  const [customerFeedbackTitle, setCustomerFeedbackTitle] = useState('Geri Bildiriminizi Alabilir Miyiz?');
  const [customerFeedbackPayload, setCustomerFeedbackPayload] = useState('');
  const [messageTagModalReason, setMessageTagModalReason] = useState(null);
const location = useLocation();

// const BASE_URL = 'https://appmyvoipcrm.softether.net';
// const BASE_URL = 'https://c91e-176-41-29-228.ngrok-free.app';

const BASE_URL = 'https://localhost:7099';

const debouncedSearch = useCallback(
  debounce((query) => {
    setConversationSearchQuery(query);
    setPage(1);
    fetchConversations(1, false, query);
  }, 300),
  [] 
);


useEffect(() => {
  const initializeMessenger = async () => {
    const params = new URLSearchParams(location.search);
    const token = params.get('token') || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJuYW1laWQiOiIzMmVkZGEyNC03YWYwLTRiNzktYTVhOC1lNTA1MDYyNDQ3ZDQiLCJ1bmlxdWVfbmFtZSI6IjkwODUwNTMyNTk4NiIsImVtYWlsIjoiaGFzYW5jb3NrdW5hcnNsYW5AZ21haWwuY29tIiwibmJmIjoxNzQ0NDYwMzgyLCJleHAiOjE3NDQ1NDY3ODIsImlhdCI6MTc0NDQ2MDM4MiwiaXNzIjoiTWVzc2VuZ2VyIiwiYXVkIjoiTWVzc2VuZ2VyIn0.fmQAuUdlnO6UlzPmxb7I2WtA-QhKEaBYwPZNJDous9M";
    console.log('Token from URL:', token);
    window.localStorage.setItem('jwtToken', token.trim()); // Use native localStorage
    console.log('Stored token in localStorage:', window.localStorage.getItem('jwtToken'));
    localStorage.set('jwtToken', token);
    if (!token) {
      setError('No authentication token provided');
      setLoading(false);
      setErrorModalOpen(true);
      return;
    }
  };

  initializeMessenger(); 
}, []); 



useEffect(() => {
  fetchConversations(1, false, conversationSearchQuery);
}, []);

  useEffect(() => {
    const loadFFmpeg = async () => {
      const ffmpeg = ffmpegRef.current;
      try {
        if (!ffmpegLoaded) {
          await ffmpeg.load();
          setFfmpegLoaded(true);
        }
      } catch (err) {
        console.error('Failed to load FFmpeg:', err);
        setError('Ses kaydının işlenmesinde bir hata oluştu.');
        setErrorModalOpen(true);
      }
    };
    loadFFmpeg();
  }, [ffmpegLoaded]);


  useEffect(() => {
    const fetchImageBlobs = async () => {
      const newBlobs = { ...imageBlobs };
      for (const msg of messages) {
        // Fetch blobs for main message URLs
        if (
        
          msg.urls &&
          (msg.messageType === 'Image' || msg.messageType === 'Sticker' || msg.messageType === 'Audio' || msg.messageType === 'Video')
        ) {
          for (const url of msg.urls) {
            if (!(url in newBlobs)) { // Check if URL is already processed (success or failure)
              try {
                console.log(`Fetching main message URL: ${url}`);
                const response = await fetch(url, {
                  headers: { 'ngrok-skip-browser-warning': 'true' },
                  mode: 'cors',
                });
                if (!response.ok) {
                  if (response.status === 404) {
                    newBlobs[url] = null; // Mark as failed
                    console.log(`URL not found: ${url}, marked as failed`);
                  }
                  throw new Error(`Failed to fetch: ${response.status}`);
                }
                const blob = await response.blob();
                newBlobs[url] = URL.createObjectURL(blob);
                console.log(`Successfully fetched blob for ${url}: ${newBlobs[url]}`);
              } catch (error) {
                console.error(`Error fetching main message URL ${url}:`, error);
                if (!newBlobs[url]) newBlobs[url] = null; // Ensure failed URLs are marked
              }
            }
          }
        }
  
        if (
          msg.repliedMessage &&
          msg.repliedMessage.direction === 'Outbound' &&
          msg.repliedMessage.url &&
          (msg.repliedMessage.messageType === 'Image' || msg.repliedMessage.messageType === 'Sticker' || msg.repliedMessage.messageType === 'Audio' || msg.repliedMessage.messageType === 'Video')
        ) {
          let repliedUrls = [];
          try {
            repliedUrls = JSON.parse(msg.repliedMessage.url);
            if (!Array.isArray(repliedUrls)) repliedUrls = [repliedUrls];
          } catch (e) {
            console.error(`Error parsing repliedMessage.url: ${msg.repliedMessage.url}`, e);
            repliedUrls = [msg.repliedMessage.url];
          }
  
          for (const url of repliedUrls) {
            if (!(url in newBlobs)) { // Check if URL is already processed
              try {
                console.log(`Fetching replied message URL: ${url}`);
                const response = await fetch(url, {
                  headers: { 'ngrok-skip-browser-warning': 'true' },
                  mode: 'cors',
                });
                if (!response.ok) {
                  if (response.status === 404) {
                    newBlobs[url] = null; // Mark as failed
                    console.log(`URL not found: ${url}, marked as failed`);
                  }
                  throw new Error(`Failed to fetch: ${response.status}`);
                }
                const blob = await response.blob();
                newBlobs[url] = URL.createObjectURL(blob);
                console.log(`Successfully fetched blob for ${url}: ${newBlobs[url]}`);
              } catch (error) {
                console.error(`Error fetching replied message URL ${url}:`, error);
                if (!newBlobs[url]) newBlobs[url] = null; // Ensure failed URLs are marked
              }
            }
          }
        }
      }
      setImageBlobs(newBlobs);
      console.log('Updated imageBlobs:', newBlobs);
    };
  
    fetchImageBlobs();
  
    return () => {
      Object.entries(newBlobs).forEach(([url, blobUrl]) => {
        if (blobUrl && blobUrl !== null) URL.revokeObjectURL(blobUrl); // Only revoke valid blob URLs
      });
    };
  }, [messages]);
  
  useEffect(() => {
    const newConnection = new signalR.HubConnectionBuilder()
      .withUrl( `${BASE_URL}/messengerHub`, { withCredentials: true })
      .withAutomaticReconnect()
      .configureLogging(signalR.LogLevel.Information)
      .build();

    setConnection(newConnection);

    newConnection.start()
      .then(() => console.log('SignalR Connected'))
      .catch((err) => {
        console.error('SignalR Connection Error:', err);
      
      });

    newConnection.on('ReceiveMessage', (message) => {
      if (message.conversationId === selectedConversationId) {
        fetchMessages(1);
        if (message.direction === 'Inbound' && playNotificationSound) {
          const audio = new Audio('/audio/messenger-short-ringtone.mp3');
          audio.play().catch((err) => console.error('Error playing notification sound:', err));
        }
      }
      else  {

   // Refresh conversations to update unviewed counts
   fetchConversations(page, false,conversationSearchQuery);
      }
    });

    newConnection.on('MessageStatusUpdated', (data) => {
      if (data.conversationId === selectedConversationId) {
        fetchMessages(1);
      }
    });

    newConnection.on('MessagesViewed', (data) => {
      if (data.conversationId === selectedConversationId) {
        setMessages((prev) =>
          prev.map((msg) => (data.messageIds.includes(msg.id) ? { ...msg, viewed: true } : msg))
        );
      }
      setConversations((prev) =>
        prev.map((conv) =>
          conv.id === data.conversationId
            ? { ...conv, unviewedCount: Math.max(0, conv.unviewedCount - data.messageIds.length) }
            : conv
        )
      );
    });

    newConnection.on('MessageDeleted', (data) => {
      if (data.conversationId === selectedConversationId) {
        setMessages((prev) => prev.filter((msg) => msg.id !== data.messageId));
      }
    });

    newConnection.on('ConversationDeleted', (data) => {
      setConversations((prev) => prev.filter((conv) => conv.id !== data.conversationId));
      if (selectedConversationId === data.conversationId) {
        setSelectedConversationId(null);
        setMessages([]);
      }
    });

    newConnection.on('UserBlocked', (data) => {
      setConversations((prev) =>
        prev.map((conv) => (conv.id === data.conversationId ? { ...conv, blocked: true } : conv))
      );
    });

    newConnection.on('UserUnblocked', (data) => {
      setConversations((prev) =>
        prev.map((conv) => (conv.id === data.conversationId ? { ...conv, blocked: false } : conv))
      );
    });

    newConnection.on('SenderActionSent', (data) => {
      if (data.conversationId === selectedConversationId && data.senderAction === 'typing_on') {
        setIsRecipientTyping(true);
        setTimeout(() => setIsRecipientTyping(false), 3000);
      }
    });

    return () => newConnection.stop();
  }, [selectedConversationId, playNotificationSound]);


  useEffect(() => {
    setPage(1);
    setMessages([]);
    fetchMessages(1);
  }, [selectedConversationId]);

  useEffect(() => {
    if (!selectedConversationId || !showSidebar || !activeTab) return;

    const fetchSidebarData = async () => {
      try {
        const media = await fetchMediaFilesLinks('media');
        const files = await fetchMediaFilesLinks('files');
        const links = await fetchMediaFilesLinks('links');
        setMediaItems(media);
        setFileItems(files);
        setLinkItems(links);
      } catch (error) {
        setError('Failed to load sidebar data: ' + error.message);
        setErrorModalOpen(true);
      }
    };
    fetchSidebarData();
  }, [selectedConversationId, showSidebar, activeTab]);

  const sendHumanAgentMessage = async () => {
    if (!humanAgentMessage.trim() || !selectedConversationId || !connection) return;
  
    const selectedConversation = conversations.find((c) => c.id === selectedConversationId);
    if (!selectedConversation || selectedConversation.blocked) return;
  
    const tempId = Date.now().toString();
    const messageType = 'Text';
  
    setMessages((prev) => [
      ...prev,
      {
        id: null,
        tempId,
        senderId:  String(userId),
        conversationId: selectedConversationId,
        text: humanAgentMessage,
        urls: null,
        timestamp: new Date().toISOString(),
        status: 'Sending',
        type: messageType,
        replyToId: replyingTo?.id || null,
        isHumanAgent: true,
        direction: 'Outbound',
      },
    ]);
  
    scrollToBottom();
  
    const timeoutId = setTimeout(() => {
      setMessages((prev) =>
        prev.map((msg) => (msg.tempId === tempId ? { ...msg, status: 'failed' } : msg))
      );
      setError('Zaman aşımına uğradı.');
      setErrorModalOpen(true);
    }, 30000);
  
    try {
      const data = await apiFetch('/api/messenger/send-human-agent-message', {
        method: 'POST',
        body: JSON.stringify({
          conversationId: selectedConversationId,
          text: humanAgentMessage,
          recipientId: selectedConversation.senderId,
        }),
      });
  
      clearTimeout(timeoutId);
  
      setMessages((prev) =>
        prev.map((msg) =>
          msg.tempId === tempId
            ? { ...msg, status: 'Sent', id: data.MessageId, mid: data.FacebookMessageId }
            : msg
        )
      );
      setHumanAgentMessage('');
      setHumanAgentModalOpen(false);
    } catch (error) {
      clearTimeout(timeoutId);
      setMessages((prev) =>
        prev.map((msg) => (msg.tempId === tempId ? { ...msg, status: 'failed' } : msg))
      );
      setError(`Hata: ${error.message}`);
      setErrorModalOpen(true);
    }
  };

  const fetchConversations = useCallback(
    async (pageToFetch = 1, append = false, search = '') => {
      setIsLoadingConversations(true);
      try {
        const endpoint = `/api/messenger/conversations?page=${pageToFetch}&pageSize=${pageSize}${
          search ? `&search=${encodeURIComponent(search)}` : ''
        }`;
        const data = await apiFetch(endpoint);
  
        const fetchedConversations = data.data.map((conv) => ({
          ...conv,
          unviewedCount: conv.unviewedCount || 0,
        }));
  
        setTotalConversations(data.totalCount);
        setHasMoreConversations(pageToFetch * pageSize < data.totalCount);
  
        if (append) {
          setConversations((prev) => [...prev, ...fetchedConversations]);
        } else {
          setConversations(fetchedConversations);
          if (fetchedConversations.length > 0 && !selectedConversationId) {
            setSelectedConversationId(fetchedConversations[0].id);
          }
        }
  
        setPage(pageToFetch);
      } catch (error) {
        console.error('Error fetching conversations:', error);
        setError('Sohbetler alınamadı: ' + error.message);
        setErrorModalOpen(true);
        throw error; 
      } finally {
        setIsLoadingConversations(false);
      }
    },
    [pageSize, selectedConversationId]
  );

    const loadMoreConversations = () => {
      if (!isLoadingConversations && hasMoreConversations) {
        fetchConversations(page + 1, true, conversationSearchQuery);
      }
    };
  

  const checkSessionStatus = async () => {
    if (!selectedConversationId || !connection) return { isExpired: false };
    const selectedConversation = conversations.find((c) => c.id === selectedConversationId);
    if (!selectedConversation || selectedConversation.blocked) return { isExpired: false };
  
    try {
      const data = await apiFetch(`/api/messenger/check-session/${selectedConversationId}`);
      const lastInboundTimestamp = data.lastInboundTimestamp;
      if (!lastInboundTimestamp) return { isExpired: true };
  
      const lastMessageDate = new Date(lastInboundTimestamp);
      const now = new Date();
      const hoursDiff = (now - lastMessageDate) / (1000 * 60 * 60);
      const isExpired = hoursDiff > 24;
  
      return {
        isExpired,
        hasOtnToken: !!otnTokens[selectedConversationId],
      };
    } catch (error) {
      console.error('Error checking session status:', error);
      return { isExpired: false };
    }
  };
  const handleUseOtnToken = async () => {
    try {
      const data = await apiFetch(`/api/messenger/check-otn-token/${selectedConversationId}`);
      console.log(data);
      if (data.hasValidToken) {
        setOtnTokens((prev) => ({ ...prev, [selectedConversationId]: data.token }));
        setUseOtnForMessage(true);
        return true;
      } else {
        setError("Geçerli OTN token bulunamadı.");
        setErrorModalOpen(true);
        return false;
      }
    } catch (error) {
      console.error('Error checking OTN token:', error);
      setError('OTN token doğrulanamadı: ' + error.message);
      setErrorModalOpen(true);
      return false;
    }
  };
  const scrollToBottom = () => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const sendSenderAction = async (action) => {
    if (!selectedConversationId || !connection) return;
    const selectedConversation = conversations.find((c) => c.id === selectedConversationId);
    if (!selectedConversation || selectedConversation.blocked) return;
    try {
      await apiFetch('/api/messenger/sender-action', {
        method: 'POST',
        body: JSON.stringify({
          conversationId: selectedConversationId,
          recipientId: selectedConversation.senderId,
          senderAction: action,
        }),
      });
    } catch (error) {
      console.error('Error sending sender action:', error);
     
    }
  };

  const handleTypingStart = () => {
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    sendSenderAction('typing_on');
  };

  const handleTypingStop = () => {
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      sendSenderAction('typing_off');
    }, 1000);
  };

  const fetchMessages = async (pageToFetch = 1, append = false, targetMessageId = null) => {
    if (!selectedConversationId) return;
    try {
      let endpoint = `/api/messenger/conversation-messages/${selectedConversationId}?page=${pageToFetch}&pageSize=5`;
      if (targetMessageId) endpoint += `&targetMessageId=${targetMessageId}`;
      const data = await apiFetch(endpoint);
  
      const fetchedMessages = (data.messages || []).map((msg) => {
        setUserId(msg.recipientId);
        let urls = null;
        if (msg.url) {
          if (msg.messageType === 'Image' || msg.messageType === 'Sticker') {
            try {
              urls = JSON.parse(msg.url);
              if (!Array.isArray(urls)) urls = [urls];
            } catch (e) {
              urls = [msg.url];
            }
          } else {
            urls = [msg.url];
          }
        }
  
        // Normalize repliedMessage
        const repliedMessage = msg.repliedMessage
          ? {
              ...msg.repliedMessage,
              direction: msg.repliedMessage.direction || msg.direction,
              urls: msg.repliedMessage.url
                ? (msg.repliedMessage.messageType === 'Image' || msg.repliedMessage.messageType === 'Sticker')
                  ? (() => {
                      try {
                        const parsed = JSON.parse(msg.repliedMessage.url);
                        return Array.isArray(parsed) ? parsed : [parsed];
                      } catch (e) {
                        return [msg.repliedMessage.url];
                      }
                    })()
                  : [msg.repliedMessage.url]
                : null,
            }
          : null;
  
        return { ...msg, urls, viewed: msg.viewed, repliedMessage };
      });
  
      setTotalMessages(data.totalMessages || 0);
      if (append) {
        setMessages((prev) => [...fetchedMessages, ...prev]);
      } else {
        setMessages(fetchedMessages);
        setTimeout(() => {
          if (targetMessageId) {
            const targetMessageRef = messageRefs.current[targetMessageId];
            if (targetMessageRef) targetMessageRef.scrollIntoView({ behavior: 'smooth', block: 'center' });
            else messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
          } else {
            messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
          }
          const unviewedInboundMessages = fetchedMessages.filter(
            (msg) => msg.direction === 'Inbound' && !msg.viewed
          );
          if (unviewedInboundMessages.length > 0) {
            const messageIds = unviewedInboundMessages.map((msg) => msg.id);
            markMessagesViewed(messageIds);
            sendSenderAction('mark_seen');
          }
        }, 100);
      }
      setShowLoadMore(pageToFetch * 5 < data.totalMessages);
    } catch (error) {
      console.error('Error fetching messages:', error);
      setError('Mesajlar alınamadı: ' + error.message);
      setErrorModalOpen(true);
    }
  };
  const markMessagesViewed = async (messageIds) => {
    try {
      await apiFetch(`/api/messenger/mark-messages-viewed/${selectedConversationId}`, {
        method: 'POST',
        body: JSON.stringify(messageIds),
      });
      setMessages((prev) =>
        prev.map((msg) => (messageIds.includes(msg.id) ? { ...msg, viewed: true } : msg))
      );
    } catch (error) {
      console.error('Error marking messages as viewed:', error);
    }
  };
  const handleScroll = () => {
    if (messagesContainerRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = messagesContainerRef.current;
      if (scrollTop === 0 && page * 5 < totalMessages) {
        setShowLoadMore(true);
      } else {
        setShowLoadMore(false);
      }

      const visibleMessages = messages.filter((msg) => {
        const messageEl = messageRefs.current[msg.id];
        if (messageEl && !msg.viewed && msg.direction === 'Inbound') {
          const rect = messageEl.getBoundingClientRect();
          return rect.top >= 0 && rect.bottom <= window.innerHeight;
        }
        return false;
      });

      if (visibleMessages.length > 0) {
        const messageIds = visibleMessages.map((msg) => msg.id);
        markMessagesViewed(messageIds);
        sendSenderAction('mark_seen');
      }
    }
  };

  const loadMoreMessages = () => {
    const nextPage = page + 1;
    setPage(nextPage);
    fetchMessages(nextPage, true);
  };

  const handleFileChange = (event) => {
    const selectedFiles = Array.from(event.target.files);
    if (selectedFiles.length > 0) {
      const hasNonImages = selectedFiles.some((file) => !file.type.startsWith('image/'));
      if (hasNonImages) {
        const nonImageFile = selectedFiles.find((file) => !file.type.startsWith('image/'));
        if (nonImageFile) {
          if (nonImageFile.size > 25 * 1024 * 1024) {
            setError('Dosya boyutu 25 MB’dan büyük. Daha küçük bir dosya seçin.');
            setErrorModalOpen(true);
            setFiles([]);
            setFilePreviews([]);
          } else {
            setFiles([nonImageFile]);
            setFilePreviews([
              {
                type: nonImageFile.type.startsWith('video/') ? 'Video' : 'Document',
                url: URL.createObjectURL(nonImageFile),
                name: nonImageFile.name,
              },
            ]);
            setError(selectedFiles.length > 1 ? 'Only one non-image file can be sent at a time.' : null);
            setErrorModalOpen(true);
          }
        }
      } else {
        const oversizedImages = selectedFiles.filter((file) => file.size > 25 * 1024 * 1024);
        if (oversizedImages.length > 0) {
          setError('Dosya boyutu 25 MB’dan büyük. Daha küçük bir dosya seçin.');
          setErrorModalOpen(true);
          setFiles([]);
          setFilePreviews([]);
        } else {
          setFiles(selectedFiles);
          setFilePreviews(
            selectedFiles.map((file) => ({
              type: 'Image',
              url: URL.createObjectURL(file),
              name: file.name,
            }))
          );
        }
      }
      setNewMessage('');
    }
  };

  const removeFile = (index) => {
    const updatedFiles = files.filter((_, i) => i !== index);
    const updatedPreviews = filePreviews.filter((_, i) => i !== index);
    updatedPreviews.forEach((preview, i) => {
      if (i === index) URL.revokeObjectURL(preview.url);
    });
    setFiles(updatedFiles);
    setFilePreviews(updatedPreviews);
    setAudioBlob(null);
  };
  const sendMessageTag = async () => {
    if (!selectedConversationId || !connection || !selectedMessageTag) return;
  
    const selectedConversation = conversations.find((c) => c.id === selectedConversationId);
    if (!selectedConversation || selectedConversation.blocked) {
      setError('Bu kullanıcı engellenmiş, mesaj gönderilemez.');
      setErrorModalOpen(true);
      return;
    }
  
    const tempId = Date.now().toString();
    let endpoint = '';
    let requestBody = {};
  
    // Prepare payload based on tag
    switch (selectedMessageTag) {
      case 'ACCOUNT_UPDATE':
        endpoint = '/api/messenger/send-account-update-message';
        requestBody = {
          conversationId: selectedConversationId,
          recipientId: selectedConversation.senderId,
          text: tagMessage,
        };
        break;
      case 'CONFIRMED_EVENT_UPDATE':
        endpoint = '/api/messenger/send-confirmed-event-update-message';
        requestBody = {
          conversationId: selectedConversationId,
          recipientId: selectedConversation.senderId,
          text: tagMessage,
        };
        break;
      case 'CUSTOMER_FEEDBACK':
        endpoint = '/api/messenger/send-customer-feedback-message';
        requestBody = {
          conversationId: selectedConversationId,
          recipientId: selectedConversation.senderId,
          title: customerFeedbackTitle,
          payload: customerFeedbackPayload || `FEEDBACK_${selectedConversationId}`,
        };
        break;
      case 'POST_PURCHASE_UPDATE':
        endpoint = '/api/messenger/send-post-purchase-update-message';
        requestBody = {
          conversationId: selectedConversationId,
          recipientId: selectedConversation.senderId,
          text: tagMessage,
        };
        break;
      case 'HUMAN_AGENT':
        endpoint = '/api/messenger/send-human-agent-message';
        requestBody = {
          conversationId: selectedConversationId,
          recipientId: selectedConversation.senderId,
          text: tagMessage,
        };
        break;
      case 'OTN_TOKEN':
        endpoint = '/api/messenger/send-otn-message';
        const token = otnTokens[selectedConversationId];

   let  tokenResponse =    await handleUseOtnToken();
        if (!tokenResponse) {
          return;
        }
        requestBody = {
          conversationId: selectedConversationId,
          token: token,
          text: tagMessage,
        };
        break;
      default:
        return;
    }
  
    // Add temporary message to UI
    setMessages((prev) => [
      ...prev,
      {
        id: null,
        tempId,
        senderId: String(userId),
        conversationId: selectedConversationId,
        text: selectedMessageTag === 'CUSTOMER_FEEDBACK' ? `Geri bildirim: ${customerFeedbackTitle}` : tagMessage,
        urls: null,
        timestamp: new Date().toISOString(),
        status: 'Sending',
        type: selectedMessageTag === 'CUSTOMER_FEEDBACK' ? 'Template' : 'Text',
        isMessageTag: true,
        direction: 'Outbound',
      },
    ]);
    scrollToBottom();
  
    const timeoutId = setTimeout(() => {
      setMessages((prev) =>
        prev.map((msg) => (msg.tempId === tempId ? { ...msg, status: 'failed' } : msg))
      );
      setError('Zaman aşımına uğradı.');
      setErrorModalOpen(true);
    }, 30000);
  
    try {
      const data = await apiFetch(endpoint, {
        method: 'POST',
        body: JSON.stringify(requestBody),
      });
  
      clearTimeout(timeoutId);
  
      setMessages((prev) =>
        prev.map((msg) =>
          msg.tempId === tempId
            ? { ...msg, status: 'Sent', id: data.MessageId, mid: data.FacebookMessageId }
            : msg
        )
      );
  
      // For OTN_TOKEN, clear the token after use
      if (selectedMessageTag === 'OTN_TOKEN') {
        setOtnTokens((prev) => ({ ...prev, [selectedConversationId]: null }));
      }
  
      // Reset modal state
      setMessageTagModalOpen(false);
      setSelectedMessageTag(null);
      setTagMessage('');
      setCustomerFeedbackTitle('Geri Bildiriminizi Alabilir Miyiz?');
      setCustomerFeedbackPayload('');
  
      setInfoMessage(`${selectedMessageTag} tag ileListening for messages from parent...
   mesaj başarıyla gönderildi.`);
      setInfoModalOpen(true);
    } catch (error) {
      clearTimeout(timeoutId);
      setMessages((prev) =>
        prev.map((msg) => (msg.tempId === tempId ? { ...msg, status: 'failed' } : msg))
      );
      setError(`Mesaj gönderilemedi: ${error.message}`);
      setErrorModalOpen(true);
    }
  };
  const sendMessage = async () => {
    if ((!newMessage.trim() && files.length === 0 && !audioBlob) || !connection || !selectedConversationId) return;
    const selectedConversation = conversations.find((c) => c.id === selectedConversationId);
    if (!selectedConversation || selectedConversation.blocked) return;
  
    const sessionStatus = await checkSessionStatus();
    if (sessionStatus.isExpired && !useOtnForMessage) {
      setMessageTagModalOpen(true);
      setMessageTagModalReason('sessionExpired');
      return;
    }
  
    const tempId = Date.now().toString();
    const uiMessageType = audioBlob ? 'Audio' : files.length > 0 ? 'File' : 'Text';
  
    setMessages((prev) => [
      ...prev,
      {
        id: null,
        tempId,
        senderId: String(userId),
        conversationId: selectedConversationId,
        text: newMessage,
        urls: files.length > 0 ? filePreviews : null,
        audioUrl: audioBlob ? URL.createObjectURL(audioBlob) : null,
        timestamp: new Date().toISOString(),
        status: 'Sending',
        type: uiMessageType,
        replyToId:replyingTo?.id ? String(replyingTo.id) : null,
        isHumanAgent: false,
        direction: 'Outbound',
      },
    ]);
    scrollToBottom();
  
    const timeoutId = setTimeout(() => {
      setMessages((prev) => prev.map((msg) => (msg.tempId === tempId ? { ...msg, status: 'failed' } : msg)));
      setError(`Zaman aşımına uğradı.`);
      setErrorModalOpen(true);
    }, 30000);
  
    let messageType = 'Text';
  
    try {
      let request;
  
      if (files.length > 0) {
        request = { conversationId: selectedConversationId, text: newMessage, urls: [] };
        for (const file of files) {
          const formData = new FormData();
          formData.append('files', file);
          const uploadData = await apiFetch('/api/messenger/upload-file', {
            method: 'POST',
            body: formData,
            headers: {}, 
          });
          request.urls.push(uploadData.urls[0]);
        }
        const fileType = files[0].type;
        messageType = fileType.startsWith('image/') ? 'Image' :
                      fileType.startsWith('video/') ? 'Video' :
                      fileType.includes('audio') ? 'Audio' :
                      'Document';
        request.senderId = String(userId);
        request.recipientId = selectedConversation.senderId;
        request.messageType = messageType;
        request.tempId = tempId;
        request.repliedId =replyingTo?.id ? String(replyingTo.id) : null;
      } else if (audioBlob) {
        const formData = new FormData();
        formData.append('files', audioBlob, 'audio-message.wav');
        const uploadData = await apiFetch('/api/messenger/upload-file', {
          method: 'POST',
          body: formData,
          headers: {},
        });
        messageType = 'Audio';
        request = {
          conversationId: selectedConversationId,
          senderId: String(userId),
          recipientId: selectedConversation.senderId,
          text: newMessage,
          urls: uploadData.urls,
          messageType: messageType,
          tempId: tempId,
          repliedId:replyingTo?.id ? String(replyingTo.id) : null,
        };
      } else {
        messageType = 'Text';
        request = {
          conversationId: selectedConversationId,
          senderId: String(userId),
          recipientId: selectedConversation.senderId,
          text: newMessage,
          urls: null,
          messageType: messageType,
          tempId: tempId,
          repliedId:replyingTo?.id ? String(replyingTo.id) : null,
        };
      }
  
      const endpoint = useOtnForMessage
        ? '/api/messenger/send-otn-message'
        : '/api/messenger/send-message';
      const body = useOtnForMessage
        ? JSON.stringify({ conversationId: selectedConversationId, token: otnTokens[selectedConversationId], text: newMessage })
        : JSON.stringify(request);
  
      const data = await apiFetch(endpoint, {
        method: 'POST',
        body,
      });
  
      clearTimeout(timeoutId);
  
      setMessages((prev) =>
        prev.map((msg) =>
          msg.tempId === tempId ? { ...msg, status: 'Sent', id: data.MessageId, mid: data.FacebookMessageId, urls: request?.urls } : msg
        )
      );
      setNewMessage('');
      setFiles([]);
      setFilePreviews([]);
      setAudioBlob(null);
      setReplyingTo(null);
      if (useOtnForMessage) {
        setOtnTokens((prev) => ({ ...prev, [selectedConversationId]: null }));
        setUseOtnForMessage(false);
      }
    } catch (error) {
      clearTimeout(timeoutId);
      setMessages((prev) => prev.map((msg) => (msg.tempId === tempId ? { ...msg, status: 'failed' } : msg)));
      setError(`Failed to send ${messageType.toLowerCase()}: ${error.message}`);
      setErrorModalOpen(true);
    }
  };
  const confirmOtnUsage = () => {
    setUseOtnForMessage(true);
    setOtnConfirmationModalOpen(false);
    sendMessage();
  };

  const sendOkaySticker = async () => {
    if (!connection || !selectedConversationId) return;
    const selectedConversation = conversations.find((c) => c.id === selectedConversationId);
    if (!selectedConversation || selectedConversation.blocked) return;
  
    const sessionStatus = await checkSessionStatus();
    if (sessionStatus.isExpired && !useOtnForMessage) {
      setMessageTagModalOpen(true);
      setMessageTagModalReason('sessionExpired');
      return;
    }

    const tempId = Date.now().toString() + Math.random().toString(36).substr(2, 9);
    const okayStickerPath = '/images/thumbup.png';
  
    const tempMessage = {
      tempId,
      conversationId: selectedConversationId,
      senderId: null,
      recipientId: selectedConversation.senderId,
      text: null,
      urls: [okayStickerPath],
      messageType: 'Sticker',
      timestamp: new Date().toISOString(),
      direction: 'Outbound',
      status: 'sending',
      repliedId: replyingTo?.mid ? replyingTo.mid : null,
      viewed: true,
      direction: 'Outbound',
    };
  
    setMessages((prev) => [...prev, tempMessage]);
    setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
  
    const timeoutId = setTimeout(() => {
      setMessages((prev) =>
        prev.map((msg) => (msg.tempId === tempId ? { ...msg, status: 'failed' } : msg))
      );
      setError('Zaman aşımı.');
      setErrorModalOpen(true);
    }, 30000);
  
    try {
      const response = await fetch(okayStickerPath); // Local file fetch
      if (!response.ok) throw new Error('Failed to fetch thumbup.png');
      const blob = await response.blob();
      const file = new File([blob], 'thumbup.png', { type: 'image/png' });
  
      const formData = new FormData();
      formData.append('files', file);
      const uploadData = await apiFetch('/api/messenger/upload-file', {
        method: 'POST',
        body: formData,
        headers: {},
      });
  
      const fileUrls = uploadData.urls;
  
      const request = {
        conversationId: selectedConversationId,
        senderId:  String(userId),
        recipientId: selectedConversation.senderId,
        text: null,
        urls: fileUrls,
        messageType: 'Sticker',
        tempId,
        repliedId: replyingTo?.mid ? replyingTo.mid : null,
      };
  
      const data = await apiFetch('/api/messenger/send-message', {
        method: 'POST',
        body: JSON.stringify(request),
      });
  
      clearTimeout(timeoutId);
  
      setMessages((prev) =>
        prev.map((msg) =>
          msg.tempId === tempId
            ? { ...msg, status: 'Sent', id: data.MessageId, mid: data.FacebookMessageId, urls: request.urls }
            : msg
        )
      );
      setReplyingTo(null);
    } catch (error) {
      clearTimeout(timeoutId);
      setMessages((prev) =>
        prev.map((msg) => (msg.tempId === tempId ? { ...msg, status: 'failed' } : msg))
      );
      setError(`Failed to send sticker: ${error.message}`);
      setErrorModalOpen(true);
    }
  };

  const requestOTN = async () => {
    if (!selectedConversationIdForMenu || !connection) return;
    const selectedConversation = conversations.find((c) => c.id === selectedConversationIdForMenu);
    if (!selectedConversation || selectedConversation.blocked) return;
  
    try {
      await apiFetch('/api/messenger/request-otn', {
        method: 'POST',
        body: JSON.stringify({
          conversationId: selectedConversationIdForMenu,
          recipientId: selectedConversation.senderId,
          title: otnTitle,
        }),
      });
  
      setInfoMessage('OTN isteği gönderildi. Kullanıcı onayı bekleniyor...');

      setInfoModalOpen(true);
      setOpenOtnModal(false);
    } catch (error) {
      console.error('Error requesting OTN:', error);
      setError('Failed to request OTN: ' + error.message);
      setErrorModalOpen(true);
    }
  };

  const sendOTNMessage = async () => {
    if (!newMessage.trim() || !selectedConversationId || !connection) return;
    const selectedConversation = conversations.find((c) => c.id === selectedConversationId);
    if (!selectedConversation || selectedConversation.blocked) return;
    const token = otnTokens[selectedConversationId];
    if (!token) {
      setError('Bu konuşma için OTN token bulunmamaktadır.');
      setErrorModalOpen(true);
      return;
    }
  
    const tempId = Date.now().toString() + Math.random().toString(36).substr(2, 9);
    const tempMessage = {
      tempId,
      conversationId: selectedConversationId,
      senderId: null,
      recipientId: selectedConversation.senderId,
      text: newMessage,
      urls: null,
      messageType: 'Text',
      timestamp: new Date().toISOString(),
      direction: 'Outbound',
      status: 'sending',
      viewed: true,
   
    };
  
    setMessages((prev) => [...prev, tempMessage]);
    setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
  
    const timeoutId = setTimeout(() => {
      setMessages((prev) =>
        prev.map((msg) => (msg.tempId === tempId ? { ...msg, status: 'failed' } : msg))
      );
      setError('Zaman aşımı.');
      setErrorModalOpen(true);
    }, 30000);
  
    try {
      const request = {
        conversationId: selectedConversationId,
        token: token,
        text: newMessage,
      };
  
      const data = await apiFetch('/api/messenger/send-otn-message', {
        method: 'POST',
        body: JSON.stringify(request),
      });
  
      clearTimeout(timeoutId);
  
      setMessages((prev) =>
        prev.map((msg) =>
          msg.tempId === tempId
            ? { ...msg, status: 'Sent', id: data.MessageId, mid: data.FacebookMessageId }
            : msg
        )
      );
      setNewMessage('');
      setOtnTokens((prev) => ({ ...prev, [selectedConversationId]: null }));
    } catch (error) {
      clearTimeout(timeoutId);
      setMessages((prev) =>
        prev.map((msg) => (msg.tempId === tempId ? { ...msg, status: 'failed' } : msg))
      );
      setError(`OTN mesajı gönderilemedi: ${error.message}`);
      setErrorModalOpen(true);
    }
  };

const onEmojiClick = (emojiObject) => {
  setNewMessage((prev) => prev + emojiObject.emoji);
  setShowEmojiPicker(false);
};

const handleReply = (message) => {
  setReplyingTo(message);
  handleCloseMessageMenu();
};

const startRecording = async () => {
  try {

    const sessionStatus = await checkSessionStatus();
    if (sessionStatus.isExpired && !useOtnForMessage) {
      setMessageTagModalOpen(true);
      setMessageTagModalReason('sessionExpired');
      return;
    }

    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const supportedMimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
      ? 'audio/webm;codecs=opus'
      : 'audio/webm';
    const mediaRecorder = new MediaRecorder(stream, { mimeType: supportedMimeType });
    mediaRecorderRef.current = mediaRecorder;
    audioChunksRef.current = [];

    mediaRecorder.ondataavailable = (event) => {
      audioChunksRef.current.push(event.data);
    };

    mediaRecorder.onstop = async () => {
      const webmBlob = new Blob(audioChunksRef.current, { type: supportedMimeType });
      if (webmBlob.size > 25 * 1024 * 1024) {
        setError('Audio exceeds 25 MB limit.');
        setErrorModalOpen(true);
        setAudioBlob(null);
        setFiles([]);
        setFilePreviews([]);
      } else if (ffmpegLoaded) {
        try {
          const mp3Blob = await convertWebMToMP3(webmBlob);
          setAudioBlob(mp3Blob);
          const fileName = 'recording.mp3';
          setFiles([new File([mp3Blob], fileName, { type: 'audio/mp3' })]);
          setFilePreviews([{ type: 'Audio', url: URL.createObjectURL(mp3Blob), name: fileName }]);
        } catch (err) {
          setError('Failed to convert audio to MP3: ' + err.message);
          setErrorModalOpen(true);
        }
      } else {
        setError('Ses işleme henüz tamamlanmadı. Lütfen tekrar deneyin.');
        setErrorModalOpen(true);
      }
      stream.getTracks().forEach((track) => track.stop());
      clearInterval(timerRef.current);
      setRecordingTime(0);
    };

    mediaRecorder.start();
    setIsRecording(true);

    setRecordingTime(0);
    timerRef.current = setInterval(() => {
      setRecordingTime((prev) => prev + 1);
    }, 1000);
  } catch (err) {
    setError('Mikrofon erişimi başarısız oldu: ' + err.message);

    setErrorModalOpen(true);
  }
};

const convertWebMToMP3 = async (webmBlob) => {
  const ffmpeg = ffmpegRef.current;
  await ffmpeg.writeFile('input.webm', new Uint8Array(await webmBlob.arrayBuffer()));
  await ffmpeg.exec(['-i', 'input.webm', '-vn', '-ar', '44100', '-ac', '2', '-b:a', '192k', 'output.mp3']);
  const mp3Data = await ffmpeg.readFile('output.mp3');
  const mp3Blob = new Blob([mp3Data.buffer], { type: 'audio/mp3' });
  await ffmpeg.deleteFile('input.webm');
  await ffmpeg.deleteFile('output.mp3');
  return mp3Blob;
};

const stopRecording = () => {
  if (mediaRecorderRef.current && isRecording) {
    mediaRecorderRef.current.stop();
    setIsRecording(false);
  }
};

const deleteMessage = async (messageId) => {
  setConfirmMessage(
    'Dikkat: Bu mesaj yalnızca bu projeden silinecek, gerçek Messenger’dan silinmeyecek. Emin misiniz?'
  );
  
  setConfirmAction(() => async () => {
    try {
      await apiFetch(`/api/messenger/delete-message/${messageId}`, {
        method: 'DELETE',
      });
      setMessages((prev) => prev.filter((msg) => msg.id !== messageId));
    } catch (error) {
      setError('Failed to delete message: ' + error.message);
      setErrorModalOpen(true);
    }
    handleCloseMessageMenu();
  });
  setConfirmModalOpen(true);
};

const handleDownload = (url) => {
  const link = document.createElement('a');
  link.href = url;
  link.download = url.split('/').pop() || 'downloaded_file';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  handleCloseMessageMenu();
};

const handleCopy = (text) => {
  navigator.clipboard
    .writeText(text)
    .then(() => handleCloseMessageMenu())
    .catch((err) => {
      setError('Failed to copy text');
      setErrorModalOpen(true);
      handleCloseMessageMenu();
    });
};

const deleteConversation = async (conversationId) => {
  setConfirmMessage(
    ' Bu sohbet yalnızca bu projeden silinecek, gerçek Messenger dan silinmeyecek. Emin misiniz?'
  );
  setConfirmAction(() => async () => {
    try {
      await apiFetch(`/api/messenger/delete-conversation/${conversationId}`, {
        method: 'DELETE',
      });
      setConversations((prev) => prev.filter((conv) => conv.id !== conversationId));
      if (selectedConversationId === conversationId) {
        setSelectedConversationId(null);
        setMessages([]);
      }
    } catch (error) {
      setError('Failed to delete conversation: ' + error.message);
      setErrorModalOpen(true);
    }
    handleCloseConversationMenu();
  });
  setConfirmModalOpen(true);
};

const handleConfirm = async () => {
  if (confirmAction) {
    await confirmAction();
  }
  setConfirmModalOpen(false);
  setConfirmAction(null);
  setConfirmMessage('');
};

const handleCancelConfirm = () => {
  setConfirmModalOpen(false);
  setConfirmAction(null);
  setConfirmMessage('');
  handleCloseMessageMenu();
  handleCloseConversationMenu(); 
  
};

const blockUser = async (conversationId) => {
  setConfirmMessage(
"Bu kullanıcıyı engellemek istediğinizden emin misiniz? Bu kullanıcı artık bu Sayfaya mesaj gönderemeyecek."  );
  setConfirmAction(() => async () => {
    try {
      await apiFetch(`/api/messenger/block-user/${conversationId}`, {
        method: 'POST',
      });
      setConversations((prev) =>
        prev.map((conv) => (conv.id === conversationId ? { ...conv, blocked: true } : conv))
      );
    } catch (error) {
      setError('Kullanıcıyı engelleme başarısız oldu: ' + error.message);
      setErrorModalOpen(true);
    }
    handleCloseConversationMenu();
  });
  setConfirmModalOpen(true);
};

const unblockUser = async (conversationId) => {
  setConfirmMessage(
   "Bu kullanıcının engelini kaldırmak istediğinizden emin misiniz? Bu kullanıcı tekrar bu Sayfaya mesaj gönderebilecek." );
  setConfirmAction(() => async () => {
    try {
      await apiFetch(`/api/messenger/unblock-user/${conversationId}`, {
        method: 'POST',
      });
      setConversations((prev) =>
        prev.map((conv) => (conv.id === conversationId ? { ...conv, blocked: false } : conv))
      );
    } catch (error) {
      setError('Kullanıcıyı engelleme kaldırma işlemi başarısız oldu: ' + error.message);

      setErrorModalOpen(true);
    }
    handleCloseConversationMenu();
  });
  setConfirmModalOpen(true);
};
const handleOpenMessageMenu = (event, messageId) => {
  setAnchorElMessage(event.currentTarget);
  setSelectedMessageId(messageId);
};

const handleCloseMessageMenu = () => {
  setAnchorElMessage(null);
  setSelectedMessageId(null);
};

const handleOpenConversationMenu = (event, conversationId) => {
  console.log(conversationId);
  setAnchorElConversation(event.currentTarget);
  setSelectedConversationIdForMenu(conversationId);
};

const handleCloseConversationMenu = () => {
  setAnchorElConversation(null);
 
};

const handleOpenOtnModal = () => {
  setOpenOtnModal(true);
  handleCloseConversationMenu();
};

const handleCloseOtnModal = () => {
  setOpenOtnModal(false);
  setOtnTitle('Güncelleme için daha sonra sizinle iletişime geçebilir miyiz?');

};

const handleKeyDown = async (event) => {
  if (event.key === 'Enter' && !event.shiftKey) {
    event.preventDefault();
    const sessionStatus = await checkSessionStatus();
    if (sessionStatus.isExpired && !useOtnForMessage) {
    
      setMessageTagModalOpen(true);
      
    } else {
      if (otnTokens[selectedConversationId] && useOtnForMessage) sendOTNMessage();
      else sendMessage();
    }
  }
};

const formatRecordingTime = (seconds) => {
  const minutes = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
};

const handleOpenSidebar = () => {
  setShowSidebar(true);
};

const handleCloseSidebar = () => {
  setShowSidebar(false);
  setActiveTab(null);
  setSearchQuery('');
  setSearchResults([]);
};

const handleSidebarOption = (option) => {
  if (option === 'viewMedia') setActiveTab('media');
  else if (option === 'search') setActiveTab('search');
  else if (option === 'notifications') setActiveTab('notifications');
};

const handleTabChange = (event, newValue) => {
  setActiveTab(newValue);
};

const handleSearch = async () => {
  if (!searchQuery.trim() || !selectedConversationId) return;
  try {
    const data = await apiFetch(
      `/api/messenger/search-messages/${selectedConversationId}?query=${encodeURIComponent(searchQuery)}`
    );
    const results = data.messages.map((msg) => {
      let urls = null;
      if (msg.url) {
        if (msg.messageType === 'Image') {
          try {
            urls = JSON.parse(msg.url);
            if (!Array.isArray(urls)) urls = [urls];
          } catch (e) {
            urls = [msg.url];
          }
        } else {
          urls = [msg.url];
        }
      }
      return { ...msg, urls };
    });
    setSearchResults(results);
  } catch (error) {
    setError('Mesaj arama işlemi başarısız oldu: ' + error.message);

    setErrorModalOpen(true);
  }
};

const fetchMediaFilesLinks = async (type) => {
  if (!selectedConversationId) return [];
  try {
    const data = await apiFetch(
      `/api/messenger/conversation-messages/${selectedConversationId}?page=1&pageSize=1000`
    );
    return data.messages
      .filter((msg) => {
        if (type === 'media') return ['Image', 'Video', 'Audio', 'Sticker'].includes(msg.messageType);
        if (type === 'files') return msg.messageType === 'Document';
        if (type === 'links') return msg.messageType === 'Text' && msg.text.includes('http');
        return false;
      })
      .map((msg) => {
        let urls = null;
        if (msg.url) {
          if (msg.messageType === 'Image' || msg.messageType === 'Sticker') {
            try {
              urls = JSON.parse(msg.url);
              if (!Array.isArray(urls)) urls = [urls];
            } catch (e) {
              urls = [msg.url];
            }
          } else {
            urls = [msg.url];
          }
        }
        return { ...msg, urls };
      });
  } catch (error) {
    setError('Medya/dosya/linkler yüklenemedi: ' + error.message);

    setErrorModalOpen(true);
    return [];
  }
};

const handleSearchResultClick = (messageId) => {
  setPage(1);
  fetchMessages(1, false, messageId);
  setShowSidebar(false);
  setActiveTab(null);
  setSearchQuery('');
  setSearchResults([]);
};

const handleNotificationSoundChange = (event) => {
  const newValue = event.target.checked;
  setPlayNotificationSound(newValue);
  localStorage.set('playNotificationSound', JSON.stringify(newValue));
};

const handleCloseErrorModal = () => {
  setErrorModalOpen(false);
  setError(null);
};

const handleOpenModal = (type, url) => {
  console.log(type, url);
  setModalMedia({ type, url });
  setOpenModal(true);
};

const handleCloseModal = () => {
  setOpenModal(false);
  setModalMedia({ type: '', url: '' });
};

const sendMessageToParent = (type, data) => {
  console.log('Sending message to parent:', { type, data });
  window.parent.postMessage({ type, data }, '*');
};
const handleConversationClick = (conversationId, conversationName) => {
  setSelectedConversationId(conversationId);
  sendMessageToParent('conversationSelected', { id: conversationId, name: conversationName });
};

const handleOpenCustomerDetails = (conversationId, conversationName) => {
  sendMessageToParent('openCustomerDetails', { id: conversationId, name: conversationName });
  handleCloseConversationMenu();
};

const handleConversationScroll = () => {
  if (conversationsEndRef.current && !isLoadingConversations && hasMoreConversations) {
    const { scrollTop, scrollHeight, clientHeight } = conversationsEndRef.current.parentElement;
    if (scrollTop + clientHeight >= scrollHeight - 50) {
      loadMoreConversations();
    }
  }
};

const selectedConversation = conversations.find((c) => c.id === selectedConversationId);
const userName = selectedConversation?.name || '?';
const showSendIcon = newMessage.trim() || files.length > 0 || audioBlob;

return (
  <Box sx={{ display: 'flex', height: '100vh', bgcolor: '#f0f2f5', fontFamily: '"Segoe UI", Roboto, sans-serif' }}>
<Box sx={{ width: '360px', bgcolor: '#fff', borderRight: '1px solid #e5e5e5', overflowY: 'auto', p: 2 }}>
        <Typography variant="h5" sx={{ fontWeight: 600, color: '#050505', mb: 2, pl: 1 }}>
          Sohbet
        </Typography>
        {/* Search Input */}
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <InputBase
            placeholder="Sohbetlerde ara..."
            value={conversationSearchQuery}
            onChange={(e) => {
              setConversationSearchQuery(e.target.value);
              debouncedSearch(e.target.value);
            }}
            sx={{
              flexGrow: 1,
              bgcolor: '#f0f2f5',
              p: 1,
              borderRadius: '20px',
              fontSize: '15px',
            }}
          />
          <IconButton sx={{ ml: 1, color: '#65676b', '&:hover': { color: '#1877f2' } }}>
            <Search />
          </IconButton>
        </Box>
        <List onScroll={handleConversationScroll}>
          {conversations.length > 0 ? (
            conversations.map((conv) => (
              <Box
                key={conv.id}
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  position: 'relative',
                  borderRadius: '10px',
                  mb: 0.5,
                  bgcolor: selectedConversationId === conv.id ? '#e5efff' : 'transparent',
                  '&:hover': { bgcolor: '#f5f5f5' },
                }}
              >
                <ListItem
                  button
                  onClick={() => handleConversationClick(conv.id, conv.name)}
                  sx={{
                    py: 1,
                    flex: 1,
                    bgcolor: 'transparent',
                    '&:hover': { bgcolor: 'transparent' },
                  }}
                >
                  <Avatar sx={{ mr: 2, bgcolor: conv.blocked ? '#ff4444' : '#ddd' }}>
                    {conv.name[0]}
                  </Avatar>
                  <ListItemText
                    primary={
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <Typography
                          sx={{
                            fontSize: '16px',
                            fontWeight: conv.unviewedCount > 0 ? 600 : 500,
                            color: conv.blocked ? '#ff4444' : '#050505',
                          }}
                        >
                          {conv.name}
                        </Typography>
                        {conv.unviewedCount > 0 && (
                          <Box
                            sx={{
                              ml: 1,
                              bgcolor: '#1877f2',
                              color: '#fff',
                              borderRadius: '50%',
                              width: '20px',
                              height: '20px',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontSize: '12px',
                              fontWeight: 600,
                            }}
                          >
                            {conv.unviewedCount}
                          </Box>
                        )}
                      </Box>
                    }
                  />
                </ListItem>
                <IconButton
                  onClick={(e) => handleOpenConversationMenu(e, conv.id)}
                  sx={{
                    color: '#65676b',
                    '&:hover': { color: '#1877f2', bgcolor: 'transparent' },
                  }}
                >
                  <ArrowDropDown />
                </IconButton>
                <Menu
                  anchorEl={anchorElConversation}
                  open={Boolean(anchorElConversation) && selectedConversationIdForMenu === conv.id}
                  onClose={handleCloseConversationMenu}
                >
                  <MenuItem onClick={() => deleteConversation(conv.id)}>Sil</MenuItem>
                  {conv.blocked ? (
                    <MenuItem onClick={() => unblockUser(conv.id)}>Engeli Kaldır</MenuItem>
                  ) : (
                    <MenuItem onClick={() => blockUser(conv.id)}>Engelle</MenuItem>
                  )}
                  <MenuItem onClick={handleOpenOtnModal} disabled={otnTokens[conv.id]}>
                    Takip İzni Talep Et
                  </MenuItem>
                  <MenuItem onClick={() => handleOpenCustomerDetails(conv.id, conv.name)}>
                    Kişi
                  </MenuItem>
                  <MenuItem
                    onClick={() => {
                      setMessageTagModalOpen(true);
                      handleCloseConversationMenu();
                    }}
                  >
                    Etiketle Mesaj Gönder
                  </MenuItem>
                </Menu>
              </Box>
            ))
          ) : (
            <Typography sx={{ color: '#65676b', textAlign: 'center', py: 2 }}>
              Sohbet bulunamadı.
            </Typography>
          )}
          {isLoadingConversations && (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 2 }}>
              <CircularProgress size={24} />
            </Box>
          )}
          <div ref={conversationsEndRef} />
        </List>
       
      </Box>

    <Box sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', bgcolor: '#fff', position: 'relative' }}>
      <Box
        sx={{
          p: 2,
          borderBottom: '1px solid #e5e5e5',
          display: 'flex',
          alignItems: 'center',
          cursor: 'pointer',
        }}
        onClick={handleOpenSidebar}
      >
        <Avatar sx={{ mr: 2, bgcolor: selectedConversation?.blocked ? '#ff4444' : '#ddd' }}>
          {userName[0]}
        </Avatar>
        <Typography
          variant="h6"
          sx={{ fontWeight: 600, color: selectedConversation?.blocked ? '#ff4444' : '#050505' }}
        >
          {selectedConversation?.name || ''}{selectedConversation?.blocked && ' (Blocked)'}
        </Typography>
      </Box>

      <Box
  ref={messagesContainerRef}
  onScroll={handleScroll}
  sx={{ flexGrow: 1, overflowY: 'auto', p: 3, bgcolor: '#f0f2f5' }}
>
  {showLoadMore && (
    <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2 }}>
      <Button
        onClick={loadMoreMessages}
        variant="outlined"
        sx={{
          borderRadius: '20px',
          textTransform: 'none',
          color: '#1877f2',
          borderColor: '#1877f2',
          '&:hover': { bgcolor: '#e5efff', borderColor: '#1877f2' },
        }}
      >
        Daha Fazla
      </Button>
    </Box>
  )}
  {messages.map((msg, idx) => (
    <Box
      key={msg.id || msg.tempId || idx}
      ref={(el) => (messageRefs.current[msg.id] = el)}
      sx={{
        display: 'flex',
        justifyContent: msg.direction === 'Outbound' ? 'flex-end' : 'flex-start',
        mb: 2,
        alignItems: 'flex-start',
        bgcolor: msg.direction === 'Inbound' && !msg.viewed ? '#e5efff' : 'transparent',
      }}
    >
      <Box sx={{ maxWidth: '60%', display: 'flex', alignItems: 'flex-start' }}>
        {msg.direction === 'Inbound' && (
          <Avatar sx={{ mr: 1, bgcolor: '#ddd', width: 32, height: 32 }}>{userName[0]}</Avatar>
        )}
        <Box sx={{ position: 'relative' }}>
        {msg.repliedMessage && (
  <Box
    sx={{
      bgcolor: '#e9ecef',
      p: 1,
      borderRadius: '8px',
      mb: 1,
      fontSize: '13px',
      color: '#65676b',
      minWidth: '300px',
      borderLeft: '3px solid #1877f2',
    }}
  >
    <Typography sx={{ fontWeight: 500, color: '#050505' }}>
      {msg.repliedMessage.agentName || userName} cevapladı:
    </Typography>
    {msg.repliedMessage.messageType === 'Text' ? (
      <Typography>{msg.repliedMessage.text}</Typography>
    ) : msg.repliedMessage.messageType === 'Image' && msg.repliedMessage.urls ? (
      msg.repliedMessage.urls.map((url, i) => (
        console.log(url),
        console.log(msg.repliedMessage),  
        <img
          key={i}
          src={
            imageBlobs[url]
          }
          alt="Replied image"
          style={{ maxWidth: '80px', borderRadius: '4px', marginTop: '4px' }}
          onClick={() => handleOpenModal('Image', url)}
          onError={(e) => {
            console.error(`Failed to load replied image: ${url}`);
            e.target.style.display = 'none'; // Hide broken image
            e.target.parentNode.appendChild(
              document.createTextNode('Failed to load image')
            );
          }}
        />
      ))
    ) : msg.repliedMessage.messageType === 'Sticker' && msg.repliedMessage.urls ? (
      console.log(msg.repliedMessage.urls ),
      msg.repliedMessage.urls.map((url, i) => (
      console.log(url),
        <img
          key={i}
          src={
            imageBlobs[url] || url
          }
          alt="Replied sticker"
          style={{ maxWidth: '80px', borderRadius: '4px', marginTop: '4px' }}
          onClick={() => handleOpenModal('Image', url)}
          onError={(e) => {
            console.error(`Failed to load replied sticker: ${url}`);
            e.target.style.display = 'none';
            e.target.parentNode.appendChild(
              document.createTextNode('Failed to load sticker')
            );
          }}
        />
      ))
    ) : msg.repliedMessage.messageType === 'Video' && msg.repliedMessage.urls ? (
      msg.repliedMessage.urls.map((url, i) => (
        <video
          key={i}
          src={
            msg.repliedMessage.direction === 'Outbound'
              ? imageBlobs[url] || url
              : url
          }
          controls
          style={{ maxWidth: '120px', borderRadius: '4px', marginTop: '4px' }}
          onClick={(e) => {
            e.preventDefault();
            handleOpenModal('Video', url);
          }}
          onError={(e) => {
            console.error(`Failed to load replied video: ${url}`);
            e.target.style.display = 'none';
            e.target.parentNode.appendChild(
              document.createTextNode('Failed to load video')
            );
          }}
        />
      ))
    ) : msg.repliedMessage.messageType === 'Audio' && msg.repliedMessage.urls ? (
      msg.repliedMessage.urls.map((url, i) => (
        <audio
          key={i}
          src={
            msg.repliedMessage.direction === 'Outbound'
              ? imageBlobs[url] || url
              : url
          }
          controls
          style={{ maxWidth: '200px', marginTop: '4px' }}
          onError={(e) => {
            console.error(`Failed to load replied audio: ${url}`);
            e.target.style.display = 'none';
            e.target.parentNode.appendChild(
              document.createTextNode('Failed to load audio')
            );
          }}
        />
      ))
    ) : msg.repliedMessage.messageType === 'Document' && msg.repliedMessage.urls ? (
      <Typography>
        <a
          href={msg.repliedMessage.urls[0]}
          target="_blank"
          rel="noopener noreferrer"
          style={{ color: '#1877f2' }}
        >
          {msg.repliedMessage.urls[0].split('/').pop() || 'Document'}
        </a>
      </Typography>
    ) : (
      <Typography sx={{ color: '#999' }}>
        {msg.repliedMessage.messageType} (Details not available)
      </Typography>
    )}
    <Typography sx={{ fontSize: '11px', color: '#999', mt: 0.5 }}>
      {new Date(msg.repliedMessage.timestamp).toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: 'numeric',
        hour12: true,
      })}
    </Typography>
  </Box>
)}
          {/* Current message content */}
          {msg.status === 'Sending' ? (
            <Box
              sx={{
                bgcolor: '#7e96ab',
                color: '#fff',
                p: 1.5,
                borderRadius: '10px',
                display: 'flex',
                alignItems: 'center',
                marginBottom: 50,
              }}
            >
              <CircularProgress size={16} sx={{ color: '#fff', mr: 1 }} />
              <Typography sx={{ fontSize: '15px' }}>Gönderiliyor...</Typography>
            </Box>
          ) : msg.status === 'failed' ? (
            <Box sx={{ bgcolor: '#d93025', color: '#fff', p: 1.5, borderRadius: '10px' }}>
              <Typography sx={{ fontSize: '15px' }}>Gönderilemedi</Typography>
            </Box>
          ) : (
            <>
              {msg.messageType === 'Text' ? (
                <Typography
                  sx={{
                    bgcolor: msg.direction === 'Outbound' ? '#7e96ab' : '#e9ecef',
                    color: msg.direction === 'Outbound' ? '#fff' : '#050505',
                    p: 1.5,
                    borderRadius: '10px',
                    fontSize: '15px',
                    minWidth: 100,
                    maxWidth: '300px',
                    wordBreak: 'break-word',
                    marginBottom: '4px',
                  }}
                >
                  {msg.text}
                </Typography>
              ) : msg.messageType === 'Sticker' && msg.urls ? (
                <Box sx={{ p: 0.5, bgcolor: 'transparent', display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                  {msg.urls.map((url, index) => (
                    <Box
                      key={index}
                      sx={{ cursor: 'default', display: 'inline-flex', alignItems: 'center' }}
                    >
                      <img
                        src={msg.direction === 'Outbound' ? imageBlobs[url] : url}
                        alt={`Sticker ${index}`}
                        style={{
                          maxWidth: '32px',
                          height: '32px',
                          borderRadius: '50%',
                          backgroundColor: '#fff',
                          padding: '4px',
                          boxShadow: '0 1px 2px rgba(0, 0, 0, 0.1)',
                        }}
                      />
                    </Box>
                  ))}
                </Box>
              ) : msg.messageType === 'Image' && msg.urls ? (
                <Box
                  sx={{
                    p: 0.5,
                    bgcolor: msg.direction === 'Outbound' ? '#7e96ab' : '#e9ecef',
                    borderRadius: '10px',
                    display: 'flex',
                    flexWrap: 'wrap',
                    gap: 1,
                  }}
                >
                  {msg.urls.map((url, index) => (
                    <Box
                      key={index}
                      sx={{ cursor: 'pointer' }}
                      onClick={() => handleOpenModal('Image', url)}
                    >
                      <img
                        src={msg.direction === 'Outbound' ? imageBlobs[url] : url}
                        alt={`Sent ${index}`}
                        style={{ maxWidth: '100px', borderRadius: '8px' }}
                      />
                    </Box>
                  ))}
                </Box>
              ) : msg.messageType === 'Video' && msg.urls ? (
                <Box
                  sx={{
                    p: 0.5,
                    bgcolor: msg.direction === 'Outbound' ? '#7e96ab' : '#e9ecef',
                    borderRadius: '10px',
                  }}
                  onClick={() => handleOpenModal('Video', msg.urls[0])}
                >
                  <video
                    src={msg.direction === 'Outbound' ? imageBlobs[msg.urls[0]] : msg.urls[0]}
                    style={{ maxWidth: '200px', borderRadius: '8px' }}
                    controls
                  />
                </Box>
              ) : msg.messageType === 'Document' && msg.urls ? (
                <Typography
                  sx={{
                    bgcolor: msg.direction === 'Outbound' ? '#7e96ab' : '#e9ecef',
                    color: msg.direction === 'Outbound' ? '#fff' : '#050505',
                    p: 1.5,
                    borderRadius: '10px',
                    fontSize: '15px',
                  }}
                >
                  <a
                    href={msg.urls[0]}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ color: 'inherit' }}
                  >
                    Document
                  </a>
                </Typography>
              ) : msg.messageType === 'Audio' && msg.urls ? (
                <Box
                  sx={{
                    bgcolor: msg.direction === 'Outbound' ? '#7e96ab' : '#e9ecef',
                    p: 1.5,
                    borderRadius: '10px',
                  }}
                >
                  <audio
                    src={msg.direction === 'Outbound' ? imageBlobs[msg.urls[0]] : msg.urls[0]}
                    controls
                    style={{ maxWidth: '200px' }}
                  />
                </Box>
              ) : null}
              {/* Timestamp and AgentName */}
              <Box
                sx={{
                  display: 'flex',
                  justifyContent: msg.direction === 'Outbound' ? 'flex-end' : 'flex-start',
                  alignItems: 'center',
                  mt: 0.5,
                }}
              >
                {msg.direction === 'Outbound' && msg.agentName && (
                  <Typography sx={{ fontSize: '12px', color: '#65676b', mr: 1 }}>{msg.agentName}</Typography>
                )}
                <Typography sx={{ fontSize: '12px', color: '#65676b' }}>
                  {msg.timestamp
                    ? new Date(msg.timestamp).toLocaleTimeString('en-US', {
                        hour: 'numeric',
                        minute: 'numeric',
                        hour12: true,
                      })
                    : 'Time unavailable'}
                </Typography>
                {msg.direction === 'Outbound' && msg.status !== 'sending' && msg.status !== 'failed' && (
                  <Typography sx={{ ml: 1, display: 'flex', alignItems: 'center' }}>
                    {msg.status === 'Read' ? (
                      <DoneAll sx={{ fontSize: '16px', color: '#0084ff' }} />
                    ) : msg.status === 'Delivered' ? (
                      <DoneAll sx={{ fontSize: '16px', color: '#0084ff' }} />
                    ) : (
                      <Check sx={{ fontSize: '16px', color: '#65676b' }} />
                    )}
                  </Typography>
                )}
              </Box>
            </>
          )}
          {(msg.status === 'Sent' || msg.status === 'Delivered' || msg.status === 'Read' || !msg.status) && (
            <IconButton
              onClick={(e) => handleOpenMessageMenu(e, msg.id || msg.tempId)}
              sx={{
                position: 'absolute',
                top: '-15px',
                right: '-12px',
                color: '#65676b',
                '&:hover': { color: '#1877f2' },
              }}
            >
              <ArrowDropDown />
            </IconButton>
          )}
        </Box>
      </Box>
      <Menu
        anchorEl={anchorElMessage}
        open={Boolean(anchorElMessage) && selectedMessageId === (msg.id || msg.tempId)}
        onClose={handleCloseMessageMenu}
      >
        {msg.direction === 'Outbound' && <MenuItem onClick={() => deleteMessage(msg.id)}>Sil</MenuItem>}
        {/* Uncomment and adjust if you want reply option for inbound messages */}
        { <MenuItem onClick={() => handleReply(msg)}>Cevapla</MenuItem>}
        {(msg.messageType === 'Document' || msg.messageType === 'Video' || msg.messageType === 'Audio') &&
          msg.urls && (
            <MenuItem onClick={() => handleDownload(msg.urls[0])}>İndir</MenuItem>
          )}
        {msg.messageType === 'Text' && msg.text && (
          <MenuItem onClick={() => handleCopy(msg.text)}>Kopyala</MenuItem>
        )}
      </Menu>
    </Box>
  ))}
  <div ref={messagesEndRef} />
</Box>
      {selectedConversation && !selectedConversation.blocked && (
        <Box sx={{ p: 2, bgcolor: '#fff', borderTop: '1px solid #e5e5e5' }}>
          {replyingTo && (
            <Box sx={{ display: 'flex', alignItems: 'center', bgcolor: '#f0f2f5', p: 1, borderRadius: '8px', mb: 1 }}>
              <Typography sx={{ flexGrow: 1, fontSize: '13px', color: '#65676b' }}>
                Replying to: {replyingTo.text || replyingTo.messageType}
              </Typography>
              <IconButton onClick={() => setReplyingTo(null)} sx={{ color: '#65676b' }}>
                <Close />
              </IconButton>
            </Box>
          )}
          {filePreviews.length > 0 && (
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 1 }}>
              {filePreviews.map((preview, index) => (
                <Box key={index} sx={{ position: 'relative', bgcolor: '#f0f2f5', p: 1, borderRadius: '8px' }}>
                  {preview.type === 'Image' ? (
                    <img src={  preview.direction === 'Outbound' ? imageBlobs[preview.url] :  preview.url} alt={preview.name} style={{ maxWidth: '100px', borderRadius: '8px' }} />
                  ) : preview.type === 'Video' ? (
                    <video src={preview.direction === 'Outbound' ? imageBlobs[preview.url] :  preview.url} style={{ maxWidth: '100px', borderRadius: '8px' }} controls />
                  ) : preview.type === 'Audio' ? (
                    <audio src={preview.direction === 'Outbound' ? imageBlobs[preview.url] :  preview.url} controls style={{ maxWidth: '200px' }} />
                  ) : (
                    <Typography sx={{ fontSize: '14px', color: '#050505' }}>{preview.name}</Typography>
                  )}
                  <IconButton
                    onClick={() => removeFile(index)}
                    sx={{
                      position: 'absolute',
                      top: '-10px',
                      right: '-10px',
                      bgcolor: '#fff',
                      boxShadow: 1,
                      '&:hover': { bgcolor: '#f5f5f5' },
                    }}
                  >
                    <Close sx={{ fontSize: '16px', color: '#65676b' }} />
                  </IconButton>
                </Box>
              ))}
            </Box>
          )}
          <Box sx={{ display: 'flex', alignItems: 'center', bgcolor: '#f0f2f5', borderRadius: '20px', p: 1 }}>
            <IconButton component="label" sx={{ color: '#65676b', '&:hover': { color: '#1877f2' } }}>
              <AttachFile />
              <input
                type="file"
                hidden
                multiple
                accept="image/*,video/*,audio/*,application/*"
                onChange={handleFileChange}
              />
            </IconButton>
            <TextField
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyDown={handleKeyDown}
              onFocus={handleTypingStart}
              onBlur={handleTypingStop}
              placeholder={otnTokens[selectedConversationId] ? 'Takip et mesajınızı yazınız...' : 'Aa'}
              variant="standard"
              fullWidth
              multiline
              maxRows={4}
              InputProps={{ disableUnderline: true }}
              sx={{ mx: 1, fontSize: '15px' }}
              disabled={files.length > 0}
            />
            {showEmojiPicker && (
              <Box sx={{ position: 'absolute', bottom: '60px', right: '20px' }}>
                <Picker onEmojiClick={onEmojiClick} />
              </Box>
            )}
            <IconButton
              onClick={() => setShowEmojiPicker(!showEmojiPicker)}
              sx={{ color: '#65676b', '&:hover': { color: '#1877f2' } }}
            >
              <SentimentSatisfiedAlt />
            </IconButton>
            {!isRecording ? (
              <IconButton onClick={startRecording} sx={{ color: '#65676b', '&:hover': { color: '#1877f2' } }}>
                <Mic />
              </IconButton>
            ) : (
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Typography sx={{ color: '#d93025', mr: 1 }}>{formatRecordingTime(recordingTime)}</Typography>
                <IconButton onClick={stopRecording} sx={{ color: '#d93025', '&:hover': { color: '#ff4444' } }}>
                  <Mic />
                </IconButton>
              </Box>
            )}
            {showSendIcon ? (
              <IconButton
                onClick={otnTokens[selectedConversationId] ? sendOTNMessage : sendMessage}
                sx={{ color: '#1877f2', '&:hover': { color: '#0056b3' } }}
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
                </svg>
              </IconButton>
            ) : (
              <IconButton onClick={sendOkaySticker} sx={{ color: '#65676b', '&:hover': { color: '#1877f2' } }}>
                <ThumbUp />
              </IconButton>
            )}
          </Box>
        </Box>
      )}

      {showSidebar && (
        <Box
          sx={{
            position: 'absolute',
            top: 0,
            right: 0,
            width: '300px',
            height: '100%',
            bgcolor: '#fff',
            borderLeft: '1px solid #e5e5e5',
            p: 2,
            overflowY: 'auto',
            zIndex: 1000,
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <IconButton onClick={handleCloseSidebar} sx={{ mr: 1 }}>
              <Close />
            </IconButton>
            <Typography variant="h6" sx={{ fontWeight: 600 }}>{userName}</Typography>
          </Box>
          {!activeTab ? (
            <List>
              <ListItem button onClick={() => handleSidebarOption('viewMedia')}>
                <Image sx={{ mr: 2, color: '#65676b' }} />
                <ListItemText primary="Medya, dosya ve linkleri görüntüle" />

              </ListItem>
              <ListItem button onClick={() => handleSidebarOption('search')}>
                <Search sx={{ mr: 2, color: '#65676b' }} />
                <ListItemText primary="Sohbet içinde ara" />
              </ListItem>
              <ListItem button onClick={() => handleSidebarOption('notifications')}>
                <Notifications sx={{ mr: 2, color: '#65676b' }} />
                <ListItemText primary="Bildirimler ve sesler" />

              </ListItem>
            </List>
          ) : activeTab === 'media' || activeTab === 'files' || activeTab === 'links' ? (
              <>
                <Tabs value={activeTab} onChange={handleTabChange} sx={{ mb: 2, borderBottom: '1px solid #e5e5e5' }}>
                <Tab label="Medya" value="media" sx={{ textTransform: 'none', fontWeight: 500 }} />
<Tab label="Dosya" value="files" sx={{ textTransform: 'none', fontWeight: 500 }} />
<Tab label="Link" value="links" sx={{ textTransform: 'none', fontWeight: 500 }} />

                </Tabs>
                {activeTab === 'media' && (
                  <Box sx={{ maxHeight: '70vh', overflowY: 'auto' }}>
                    {mediaItems.length > 0 ? (
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                        {mediaItems.map((item, idx) => (
                          <Box
                            key={idx}
                            sx={{
                              width: '120px',
                              bgcolor: '#f5f5f5',
                              borderRadius: '8px',
                              p: 1,
                              '&:hover': { bgcolor: '#e5efff', cursor: 'pointer' },
                            }}
                          >
                            {item.messageType === 'Image' && item.urls ? (
                              item.urls.map((url, i) => (
                                <img
                                  key={i}
                                  src={item.direction === 'Outbound' ? imageBlobs[url] : url}
                                  alt={`Media ${i}`}
                                  style={{
                                    width: '100%',
                                    height: '80px',
                                    objectFit: 'cover',
                                    borderRadius: '6px',
                                  }}
                                  onClick={() => handleOpenModal('Image', url)}
                                />
                              ))
                            ) : item.messageType === 'Sticker' && item.urls ? (
                              item.urls.map((url, i) => (
                                <img
                                  key={i}
                                  src={item.direction === 'Outbound' ? imageBlobs[url] : url}
                                  alt={`Sticker ${i}`}
                                  style={{
                                    width: '100%',
                                    height: '80px',
                                    objectFit: 'contain',
                                    borderRadius: '6px',
                                  }}
                                />
                              ))
                            ) : item.messageType === 'Video' && item.urls ? (
                              <video
                                src={ item.direction === 'Outbound' ? imageBlobs[item.url[0]] : item.urls[0]}
                                controls
                                style={{ width: '100%', height: '80px', borderRadius: '6px' }}
                                onClick={(e) => {
                                  e.preventDefault();
                                  handleOpenModal('Video', item.urls[0]);
                                }}
                              />
                            ) : item.messageType === 'Audio' && item.urls ? (
                              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <audio src={item.urls[0]} controls style={{ width: '100%' }} />
                              </Box>
                            ) : null}
                            <Typography sx={{ fontSize: '12px', color: '#65676b', mt: 0.5 }}>
                              {new Date(item.timestamp).toLocaleString('en-US', {
                                month: 'short',
                                day: 'numeric',
                                hour: 'numeric',
                                minute: 'numeric',
                                hour12: true,
                              })}
                            </Typography>
                          </Box>
                        ))}
                      </Box>
                    ) : (
                      <Typography sx={{ color: '#65676b', textAlign: 'center', py: 2 }}>
                        No media found.
                      </Typography>
                    )}
                  </Box>
                )}
                {activeTab === 'files' && (
                  <Box sx={{ maxHeight: '70vh', overflowY: 'auto' }}>
                    {fileItems.length > 0 ? (
                      fileItems.map((item, idx) => (
                        <Box
                          key={idx}
                          sx={{
                            display: 'flex',
                            alignItems: 'center',
                            p: 1,
                            borderBottom: '1px solid #e5e5e5',
                            '&:hover': { bgcolor: '#f5f5f5' },
                          }}
                        >
                          <InsertDriveFile sx={{ color: '#1877f2', mr: 1 }} />
                          <Box sx={{ flexGrow: 1 }}>
                            <Typography
                              component="a"
                              href={item.urls[0]}
                              target="_blank"
                              rel="noopener noreferrer"
                              sx={{
                                fontSize: '14px',
                                color: '#1877f2',
                                textDecoration: 'none',
                                '&:hover': { textDecoration: 'underline' },
                              }}
                            >
                              {item.urls[0].split('/').pop() || 'Unnamed File'}
                            </Typography>
                            <Typography sx={{ fontSize: '12px', color: '#65676b' }}>
                              {new Date(item.timestamp).toLocaleString('en-US', {
                                month: 'short',
                                day: 'numeric',
                                hour: 'numeric',
                                minute: 'numeric',
                                hour12: true,
                              })}
                            </Typography>
                          </Box>
                        </Box>
                      ))
                    ) : (
                      <Typography sx={{ color: '#65676b', textAlign: 'center', py: 2 }}>
                       Dosya bulunamadı.
                      </Typography>
                    )}
                  </Box>
                )}
                {activeTab === 'links' && (
                  <Box sx={{ maxHeight: '70vh', overflowY: 'auto' }}>
                    {linkItems.length > 0 ? (
                      linkItems.map((item, idx) => (
                        <Box
                          key={idx}
                          sx={{
                            display: 'flex',
                            alignItems: 'center',
                            p: 1,
                            borderBottom: '1px solid #e5e5e5',
                            '&:hover': { bgcolor: '#f5f5f5' },
                          }}
                        >
                          <Link sx={{ color: '#1877f2', mr: 1 }} />
                          <Box sx={{ flexGrow: 1 }}>
                            <Typography
                              component="a"
                              href={item.text}
                              target="_blank"
                              rel="noopener noreferrer"
                              sx={{
                                fontSize: '14px',
                                color: '#1877f2',
                                textDecoration: 'none',
                                '&:hover': { textDecoration: 'underline' },
                                wordBreak: 'break-all',
                              }}
                            >
                              {item.text.length > 30 ? `${item.text.substring(0, 27)}...` : item.text}
                            </Typography>
                            <Typography sx={{ fontSize: '12px', color: '#65676b' }}>
                              {new Date(item.timestamp).toLocaleString('en-US', {
                                month: 'short',
                                day: 'numeric',
                                hour: 'numeric',
                                minute: 'numeric',
                                hour12: true,
                              })}
                            </Typography>
                          </Box>
                        </Box>
                      ))
                    ) : (
                      <Typography sx={{ color: '#65676b', textAlign: 'center', py: 2 }}>
                       Link bulunamadı.
                      </Typography>
                    )}
                  </Box>
                )}
              </>
            ) : activeTab === 'search' ? (
              <Box>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <InputBase
                    placeholder="sohbet içinde ara..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                    sx={{ flexGrow: 1, bgcolor: '#f0f2f5', p: 1, borderRadius: '20px' }}
                  />
                  <IconButton onClick={handleSearch}>
                    <Search />
                  </IconButton>
                </Box>
                {searchResults.length > 0 ? (
                  searchResults.map((msg, idx) => (
                    <Box
                      key={idx}
                      onClick={() => handleSearchResultClick(msg.id)}
                      sx={{
                        mb: 2,
                        p: 1,
                        bgcolor: '#e9ecef',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        '&:hover': { bgcolor: '#d5d8dc' },
                      }}
                    >
                      {msg.messageType === 'Text' ? (
                        <Typography sx={{ fontSize: '15px', color: '#050505' }}>{msg.text}</Typography>
                      ) : msg.messageType === 'Image' && msg.urls ? (
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                          {msg.urls.map((url, i) => (
                            <img
                              key={i}
                              src={msg.direction === 'Outbound' ? imageBlobs[url] : url}
                              alt={`Search result image ${i}`}
                              style={{ maxWidth: '80px', borderRadius: '8px', cursor: 'pointer' }}
                              onClick={(e) => {
                                e.stopPropagation();
                                handleOpenModal('Image', url);
                              }}
                            />
                          ))}
                        </Box>
                      ) : msg.messageType === 'Video' && msg.urls ? (
                        <video
                        src={ imageBlobs[msg.urls[0]]}
                 
                          controls
                          style={{ maxWidth: '120px', borderRadius: '8px' }}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOpenModal('Video', msg.urls[0]);
                          }}
                        />
                      ) : msg.messageType === 'Audio' && msg.urls ? (
                        <audio src={ imageBlobs[msg.urls[0]]} controls style={{ maxWidth: '200px' }} />
                      ) : msg.messageType === 'Document' && msg.urls ? (
                        <Typography sx={{ fontSize: '15px', color: '#050505' }}>
                          <a
                            href={msg.urls[0]}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{ color: '#1877f2' }}
                            onClick={(e) => e.stopPropagation()}
                          >
                            {msg.urls[0].split('/').pop() || 'Document'}
                          </a>
                        </Typography>
                      ) : (
                        <Typography sx={{ fontSize: '15px', color: '#65676b' }}>
                         Desteklenmeyen mesaj tipi
                        </Typography>
                      )}
                      <Typography sx={{ fontSize: '12px', color: '#65676b', mt: 1 }}>
                        {new Date(msg.timestamp).toLocaleString('en-US', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                          hour: 'numeric',
                          minute: 'numeric',
                          hour12: true,
                        })}
                      </Typography>
                    </Box>
                  ))
                ) : (
                  <Typography>Sonuç bulunamadı.</Typography>
                )}
              </Box>
            ) : activeTab === 'notifications' ? (
              <Box>
                <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 500 }}>
                  Notifications & Sounds
                </Typography>
                <FormControlLabel
                  control={
                    <Switch
                      checked={playNotificationSound}
                      onChange={handleNotificationSoundChange}
                      color="primary"
                    />
                  }
                  label="Play notification sound"
                  sx={{ mb: 1 }}
                />
              </Box>
            ) : null}
          </Box>
        )}

      <Modal
      open={openModal}
      onClose={handleCloseModal}
      aria-labelledby="media-modal-title"
      aria-describedby="media-modal-description"
    >
      <Box
        sx={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          bgcolor: '#fff',
          borderRadius: '12px',
          p: 3,
          maxWidth: { xs: '95%', sm: '90%', md: '80%' },
          maxHeight: '90vh',
          minWidth: 300,
          display: 'flex',
          flexDirection: 'column',
          boxShadow: 24,
          overflow: 'hidden',
        }}
        role="dialog"
      >
        {/* Close Button */}
        <IconButton
          onClick={handleCloseModal}
          sx={{
            position: 'absolute',
            top: 8,
            right: 8,
            zIndex: 10,
            bgcolor: 'rgba(255, 255, 255, 0.9)',
            color: '#65676b',
            '&:hover': {
              bgcolor: 'rgba(200, 200, 200, 0.9)',
              color: '#1877f2',
            },
            boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
          }}
          aria-label="Modalı kapat"
        >
          <Close />
        </IconButton>

        {/* Hidden for screen readers */}
        <Typography id="media-modal-title" sx={{ display: 'none' }}>
          Medya Görüntüleyici
        </Typography>
        <Typography id="media-modal-description" sx={{ display: 'none' }}>
          Bir görüntü veya video görüntüleniyor.
        </Typography>

        {/* Media Content */}
        <Box
          sx={{
            flex: 1,
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            maxHeight: '80vh',
            overflow: 'auto',
          }}
        >
          {modalMedia.type === 'Image' ? (
            imageBlobs[modalMedia.url] || modalMedia.url ? (
              <>
                {isMediaLoading && (
                  <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
                    <CircularProgress />
                  </Box>
                )}
                <img
                  src={imageBlobs[modalMedia.url] || modalMedia.url}
                  alt="Full size"
                  style={{
                    maxWidth: '100%',
                    maxHeight: '80vh',
                    borderRadius: '8px',
                    objectFit: 'contain',
                    display: isMediaLoading ? 'none' : 'block',
                  }}
                  onLoad={() => setIsMediaLoading(false)}
                  onError={() => setIsMediaLoading(false)}
                />
              </>
            ) : (
              <Typography sx={{ color: '#d93025', textAlign: 'center' }}>
                Medya yüklenemedi.
              </Typography>
            )
          ) : modalMedia.type === 'Video' ? (
            imageBlobs[modalMedia.url] || modalMedia.url ? (
              <>
                {isMediaLoading && (
                  <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
                    <CircularProgress />
                  </Box>
                )}
                <video
                  src={imageBlobs[modalMedia.url] || modalMedia.url}
                  controls
                  style={{
                    maxWidth: '100%',
                    maxHeight: '80vh',
                    borderRadius: '8px',
                    objectFit: 'contain',
                    display: isMediaLoading ? 'none' : 'block',
                  }}
                  onLoadedData={() => setIsMediaLoading(false)}
                  onError={() => setIsMediaLoading(false)}
                />
              </>
            ) : (
              <Typography sx={{ color: '#d93025', textAlign: 'center' }}>
                Medya yüklenemedi.
              </Typography>
            )
          ) : (
            <Typography sx={{ color: '#d93025', textAlign: 'center' }}>
              Desteklenmeyen medya tipi.
            </Typography>
          )}
        </Box>
      </Box>
      </Modal>
      <Modal open={errorModalOpen} onClose={handleCloseErrorModal}>
  <Box
 sx={{
  position: 'absolute !important',
  top: '50% !important',
  left: '50% !important',
  transform: 'translate(-50%, -50%) !important',
  width: 400,
  bgcolor: '#fff',
  borderRadius: '12px',
  boxShadow: 24,
  p: 3,
  textAlign: 'center',
  wordBreak: 'break-word',
}}
  >
    <Typography variant="h6" sx={{ fontWeight: 600, color: '#d93025', mb: 2 }}>
      Hata
    </Typography>
    <Typography sx={{ fontSize: '15px', color: '#050505', mb: 3 }}>
      {error || 'Bilinmeyen bir hata oluştu.Lüten daha sonra tekrar deneyin.'}
    </Typography>
    <Button
      onClick={handleCloseErrorModal}
      variant="contained"
      sx={{
        bgcolor: '#1877f2',
        color: '#fff',
        borderRadius: '8px',
        textTransform: 'none',
        '&:hover': { bgcolor: '#0056b3' },
      }}
    >
      Kapat
    </Button>
  </Box>
      </Modal>
      <Modal open={openOtnModal} onClose={handleCloseOtnModal}>
      <Box
          sx={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: 400,
            bgcolor: '#fff',
            borderRadius: '12px',
            boxShadow: 24,
            p: 3,
            maxHeight: '90vh',
            overflowY: 'auto',
            wordBreak: 'break-word',
          }}
        >
          <Typography variant="h6" sx={{ fontWeight: 600, color: '#050505', mb: 2 }}>
          Takip İzni Talep Et
          </Typography>

          {/* Explanation */}
          <Typography variant="body2" sx={{ mb: 2, color: '#444' }}>
            Facebook Messenger kurallarına uymak için, size tek seferlik bir takip mesajı göndermek için izniniz gerekiyor.
            "Talep Gönder"e tıkladıktan sonra, Messenger'da bir "Beni Bildir" mesajı alacaksınız. Eğer "Beni Bildir"e tıklarsanız, bu taleple ilgili size bir ek güncelleme daha göndermemize izin verilmiş olacak.
          </Typography>

          {/* Rules Accordion */}
          <Accordion sx={{ mb: 3 }}>
            <AccordionSummary expandIcon={<ExpandMoreIcon />} sx={{ bgcolor: '#f1f1f1' }}>
              <Typography variant="body2" fontWeight={600}>Kurallar</Typography>
            </AccordionSummary>
            <AccordionDetails>
            <Typography variant="body2" sx={{ color: '#333' }}>
                • İzin vermek için Messenger'da "Beni Bildir"e tıklamalısınız.<br />
                • Bu izinle size yalnızca <strong>tek bir takip mesajı</strong> gönderebiliriz.<br />
                • Takip mesajı, onayınızdan itibaren <strong>1 yıl içinde</strong> gönderilmelidir.<br />
                • Bunu promosyonlar veya ilgili olmayan mesajlar için kullanamayız.<br />
                • Bu izni Messenger'dan istediğiniz zaman iptal edebilirsiniz.<br />
                <strong>• OTN, aktif bir 24 saatlik mesajlaşma penceresi sırasında talep edilmelidir.</strong>
              </Typography>
            </AccordionDetails>
          </Accordion>

          {/* Input Field */}
          <TextField
            label="Bildirelecek Başlık"
            value={otnTitle}
            onChange={(e) => setOtnTitle(e.target.value)}
            fullWidth
            variant="outlined"
            sx={{ mb: 3 }}
            helperText="Takip isteği için kısa bir başlık girin (maks. 65 karakter)."
            inputProps={{ maxLength: 65 }}
          />

          {/* Buttons */}
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
            <Button
              onClick={handleCloseOtnModal}
              variant="outlined"
              sx={{
                borderColor: '#65676b',
                color: '#65676b',
                borderRadius: '8px',
                textTransform: 'none',
                '&:hover': { borderColor: '#1877f2', color: '#1877f2' },
              }}
            >
              İptal
            </Button>
            <Button
              onClick={requestOTN}
              variant="contained"
              disabled={!otnTitle.trim()}
              sx={{
                bgcolor: '#1877f2',
                color: '#fff',
                borderRadius: '8px',
                textTransform: 'none',
                '&:hover': { bgcolor: '#0056b3' },
                '&:disabled': { bgcolor: '#b0b0b0' },
              }}
            >
             Talep Gönder


            </Button>
          </Box>
        </Box>
      </Modal>
      <Modal open={humanAgentModalOpen} onClose={() => setHumanAgentModalOpen(false)}>
        <Box
          sx={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: 400,
            bgcolor: '#fff',
            borderRadius: '12px',
            boxShadow: 24,
            p: 3,
            wordBreak: 'break-word',
          }}
        >
          <Typography variant="h6" sx={{ fontWeight: 600, color: '#1877f2', mb: 2 }}>
          Mesajı Müşteri Temsilcisi Olarak Gönde
          </Typography>
          <TextField
            value={humanAgentMessage}
            onChange={(e) => setHumanAgentMessage(e.target.value)}
            placeholder="Type your message..."
            variant="outlined"
            fullWidth
            multiline
            rows={4}
            sx={{ mb: 2 }}
          />
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
            <Button
              onClick={() => setHumanAgentModalOpen(false)}
              variant="outlined"
              sx={{
                borderColor: '#65676b',
                color: '#65676b',
                borderRadius: '8px',
                textTransform: 'none',
                '&:hover': { borderColor: '#1877f2', color: '#1877f2' },
              }}
            >
              İptal
            </Button>
            <Button
              onClick={sendHumanAgentMessage}
              variant="contained"
              disabled={!humanAgentMessage.trim()}
              sx={{
                bgcolor: '#1877f2',
                color: '#fff',
                borderRadius: '8px',
                textTransform: 'none',
                '&:hover': { bgcolor: '#0056b3' },
                '&:disabled': { bgcolor: '#b0b0b0' },
              }}
            >
              Gönder
            </Button>
          </Box>
        </Box>
      </Modal>
      <Modal open={otnConfirmationModalOpen} onClose={() => setOtnConfirmationModalOpen(false)}>
        <Box
          sx={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: 400,
            bgcolor: '#fff',
            borderRadius: '12px',
            boxShadow: 24,
            p: 3,
            textAlign: 'center',
          }}
        >
          <Typography variant="h6" sx={{ fontWeight: 600, color: '#1877f2', mb: 2 }}>
          Tek Seferlik Bildirimi Kullan
          </Typography>
          <Typography sx={{ fontSize: '15px', color: '#050505', mb: 3 }}>

            Bu mesajı göndermek için mevcut OTN token'ı kullanılıyor. Daha sonrası için başka bir OTN talep etmek ister misiniz?


          </Typography>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 2 }}>
            <Button
              onClick={() => {
                setOtnConfirmationModalOpen(false);
                confirmOtnUsage();
              }}
              variant="contained"
              sx={{
                bgcolor: '#1877f2',
                color: '#fff',
                borderRadius: '8px',
                textTransform: 'none',
                '&:hover': { bgcolor: '#0056b3' },
              }}
            >
             Tamam (Şimdi Gönder)
            </Button>
            <Button
              onClick={() => {
                setOtnConfirmationModalOpen(false);
                confirmOtnUsage();
                requestOTN();
              }}
              variant="outlined"
              sx={{
                borderColor: '#1877f2',
                color: '#1877f2',
                borderRadius: '8px',
                textTransform: 'none',
                '&:hover': { bgcolor: '#e5efff', borderColor: '#1877f2' },
              }}
            >
               OTN Talep Et
            </Button>
          </Box>
        </Box>
      </Modal>
      <Modal open={confirmModalOpen} onClose={handleCancelConfirm}>
        <Box
          sx={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform_second_message: 'translate(-50%, -50%)',
            width: 400,
            bgcolor: '#fff',
            borderRadius: '12px',
            boxShadow: 24,
            p: 3,
            textAlign: 'center',
            wordBreak: 'break-word',
          }}
        >
          <Typography variant="h6" sx={{ fontWeight: 600, color: '#d93025', mb: 2 }}>
            Doğrulama
          </Typography>
          <Typography sx={{ fontSize: '15px', color: '#050505', mb: 3 }}>{confirmMessage}</Typography>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 2 }}>
            <Button
              onClick={handleCancelConfirm}
              variant="outlined"
              sx={{
                borderColor: '#65676b',
                color: '#65676b',
                borderRadius: '8px',
                textTransform: 'none',
                '&:hover': { borderColor: '#1877f2', color: '#1877f2' },
              }}
            >
              İptal
            </Button>
            <Button
              onClick={handleConfirm}
              variant="contained"
              sx={{
                bgcolor: '#d93025',
                color: '#fff',
                borderRadius: '8px',
                textTransform: 'none',
                '&:hover': { bgcolor: '#b71c1c' },
              }}
            >
              Evet
            </Button>
          </Box>
        </Box>
      </Modal>
      <Modal open={infoModalOpen} onClose={() => setInfoModalOpen(false)}>
  <Box
    sx={{
      position: 'absolute',
      top: '50%',
      left: '50%',
      transform: 'translate(-50%, -50%)',
      width: 400,
      bgcolor: '#fff',
      borderRadius: '12px',
      boxShadow: 24,
      p: 3,
      textAlign: 'center',
      wordBreak: 'break-word',
    }}
  >
    <Typography variant="h6" sx={{ fontWeight: 600, color: '#1877f2', mb: 2 }}>
      Bilgilendirme
    </Typography>
    <Typography sx={{ fontSize: '15px', color: '#050505', mb: 3 }}>
      {infoMessage || 'İsteğiniz işleniyor.'}
    </Typography>
    <Button
      onClick={() => setInfoModalOpen(false)}
      variant="contained"
      sx={{
        bgcolor: '#1877f2',
        color: '#fff',
        borderRadius: '8px',
        textTransform: 'none',
        '&:hover': { bgcolor: '#0056b3' },
      }}
    >
      Tamam
    </Button>
  </Box>
      </Modal>
      <Modal open={messageTagModalOpen} onClose={() => {
        setMessageTagModalOpen(false);
        setSelectedMessageTag(null);
        setTagMessage('');
        setCustomerFeedbackTitle('Geri Bildiriminizi Alabilir Miyiz?');
        setCustomerFeedbackPayload('');
        setMessageTagModalReason(null);
      }}>
  <Box
    sx={{
      position: 'absolute',
      top: '50%',
      left: '50%',
      transform: 'translate(-50%, -50%)',
      width: 450,
      bgcolor: '#fff',
      borderRadius: '12px',
      boxShadow: 24,
      p: 3,
      wordBreak: 'break-word',
      maxHeight: '80vh',
      overflowY: 'auto',
    }}
  >
    <Typography variant="h6" sx={{ fontWeight: 600, color: '#1877f2', mb: 2 }}>
      Mesaj Etiketi ile Gönder
    </Typography>
    {/* Informative Message for Session Expiration */}
    {messageTagModalReason === 'sessionExpired' && (
            <Box sx={{ mb: 2, p: 2, bgcolor: '#fff3cd', borderRadius: '8px', border: '1px solid #ffeeba' }}>
              <Typography variant="body2" sx={{ color: '#856404', fontWeight: 500 }}>
                Dikkat: 24 saatlik mesajlaşma süresi dolmuştur. Mesaj göndermek için lütfen aşağıdaki etiket seçeneklerinden birini seçin.
              </Typography>
            </Box>
          )}
    <Typography variant="body2" sx={{ mb: 2, color: '#444' }}>
      24 saatlik pencere dışında mesaj göndermek için bir mesaj etiketi seçin. Her etiketin belirli kullanım kuralları vardır ve bu kurallara uymak zorunludur.
    </Typography>

    {/* Tag Selection Dropdown */}
    <TextField
      select
      label="Mesaj Etiketi Seçin"
      value={selectedMessageTag || ''}
      onChange={(e) => setSelectedMessageTag(e.target.value)}
      fullWidth
      variant="outlined"
      sx={{ mb: 2 }}
    >
      <MenuItem value="ACCOUNT_UPDATE">Hesap Güncellemesi</MenuItem>
      <MenuItem value="CONFIRMED_EVENT_UPDATE">Onaylanmış Etkinlik Güncellemesi</MenuItem>
      <MenuItem value="CUSTOMER_FEEDBACK">Müşteri Geri Bildirimi</MenuItem>
      <MenuItem value="POST_PURCHASE_UPDATE">Satın Alma Sonrası Güncelleme</MenuItem>
      <MenuItem value="HUMAN_AGENT">Müşteri Temsilcisi</MenuItem>
      <MenuItem value="OTN_TOKEN">Tek Seferlik Bildirim (OTN)</MenuItem>
    </TextField>

    {/* Tag-Specific Instructions */}
    {selectedMessageTag && (
      <Box sx={{ mb: 2, p: 2, bgcolor: '#f1f1f1', borderRadius: '8px' }}>
        {selectedMessageTag === 'ACCOUNT_UPDATE' && (
          <Typography variant="body2" sx={{ color: '#333' }}>
            <strong>Amaç:</strong> Kullanıcıların hesaplarıyla ilgili önemli güncellemeleri bildirmek.<br />
            <strong>Kurallar:</strong><br />
            • Hesap durumuyla ilgili olmalı (ör. başvuru durumu, parola sıfırlama, dolandırıcılık uyarısı).<br />
            • Promosyonel içerik veya reklam yasaktır.<br />
            • Kullanıcıya doğrudan bir işlem bildirmeli.<br />
            <strong>Örnekler:</strong><br />
            - "Hesabınızın şifresi sıfırlandı. Yeni şifrenizle giriş yapabilirsiniz."<br />
            - "Başvurunuz onaylandı, detaylar için hesabınıza göz atın."<br />
            - "Hesabınızda şüpheli bir işlem tespit ettik, lütfen kontrol edin."
          </Typography>
        )}
        {selectedMessageTag === 'CONFIRMED_EVENT_UPDATE' && (
          <Typography variant="body2" sx={{ color: '#333' }}>
            <strong>Amaç:</strong> Kullanıcıların onaylanmış etkinlikleri hakkında bilgi vermek.<br />
            <strong>Kurallar:</strong><br />
            • Kullanıcının onayladığı bir etkinlikle ilgili olmalı (ör. randevu, rezervasyon).<br />
            • Promosyonel içerik veya satış teklifleri yasaktır.<br />
            • Etkinlik zamanı veya durumuyla ilgili net bilgi vermeli.<br />
            <strong>Örnekler:</strong><br />
            - "Randevunuz 12 Nisan 2025, 14:00 olarak onaylandı. Lütfen zamanında gelin."<br />
            - "Etkinliğiniz yarın saat 10:00’da başlayacak, hazırlıklı olun."<br />
            - "Rezervasyonunuz iptal edildi, detaylar için bizimle iletişime geçin."
          </Typography>
        )}
        {selectedMessageTag === 'CUSTOMER_FEEDBACK' && (
          <Typography variant="body2" sx={{ color: '#333' }}>
            <strong>Amaç:</strong> Kullanıcılardan hizmet veya ürün hakkında geri bildirim toplamak.<br />
            <strong>Kurallar:</strong><br />
            • Son kullanıcı mesajından sonraki 7 gün içinde gönderilmelidir.<br />
            • Promosyonel içerik, kampanya veya satış önerisi yasaktır.<br />
            • Geri bildirim talebi açık ve spesifik olmalı.<br />
            • Başlık (title) zorunlu, payload isteğe bağlıdır (benzersiz bir kimlik için).<br />
            <strong>Örnekler:</strong><br />
            - Başlık: "Hizmetimiz Hakkında Ne Düşünüyorsunuz?"<br />
              Mesaj: "Son alışveriş deneyiminizi değerlendirir misiniz?"<br />
            - Başlık: "Geri Bildiriminiz Önemli!"<br />
              Mesaj: "Destek ekibimizden memnun kaldınız mı?"<br />
            - Başlık: "Bize Fikrinizi Söyleyin"<br />
              Mesaj: "Ürünümüzü nasıl buldunuz, önerileriniz var mı?"
          </Typography>
        )}
        {selectedMessageTag === 'POST_PURCHASE_UPDATE' && (
          <Typography variant="body2" sx={{ color: '#333' }}>
            <strong>Amaç:</strong> Satın alma sonrası kullanıcıyı bilgilendirmek.<br />
            <strong>Kurallar:</strong><br />
            • Satın alma ile ilgili güncellemeler içermeli (ör. kargo durumu, iade bilgisi).<br />
            • Promosyonel içerik veya ek ürün satışı yasaktır.<br />
            • Kullanıcıya net bir bilgi veya işlem durumu sunmalı.<br />
            <strong>Örnekler:</strong><br />
            - "Siparişiniz kargoya verildi, takip numarası: XYZ123."<br />
            - "İadeniz onaylandı, ödemeniz 3 iş günü içinde yapılacak."<br />
            - "Ürün teslimatınız yarın 09:00-12:00 arasında gerçekleşecek."
          </Typography>
        )}
        {selectedMessageTag === 'HUMAN_AGENT' && (
          <Typography variant="body2" sx={{ color: '#333' }}>
            <strong>Amaç:</strong> İnsan ajan tarafından birebir destek sağlamak.<br />
            <strong>Kurallar:</strong><br />
            • Son kullanıcı mesajından sonraki 7 gün içinde gönderilmelidir.<br />
            • Promosyonel içerik veya otomatik mesajlar yasaktır.<br />
            • Gerçek bir insan tarafından yazılmış olmalı ve destek amaçlı olmalı.<br />
            <strong>Örnekler:</strong><br />
            - "Merhaba, sorununuzu çözmek için buradayım. Detay verebilir misiniz?"<br />
            - "Siparişinizle ilgili sorunuzu gördüm, hemen yardımcı oluyorum."<br />
            - "Teknik ekibimiz sorunu inceledi, çözüm için önerilerimiz var."
          </Typography>
        )}
        {selectedMessageTag === 'OTN_TOKEN' && (
          <Typography variant="body2" sx={{ color: '#333' }}>
            <strong>Amaç:</strong> Kullanıcıdan alınmış tek seferlik bildirim izniyle mesaj göndermek.<br />
            <strong>Kurallar:</strong><br />
            • Geçerli bir OTN token gereklidir.<br />
            • Mesaj, kullanıcının onayladığı bildirimle ilgili olmalı.<br />
            • Promosyonel içerik veya reklam yasaktır.<br />
            • Token kullanıldıktan sonra geçersiz olur.<br />
            <strong>Örnekler:</strong><br />
            - "Siparişinizle ilgili güncelleme: Ürün yarın teslim edilecek."<br />
            - "Randevunuz onaylandı, detaylar için lütfen kontrol edin."<br />
            - "Başvurunuz tamamlandı, sonuçlar hesabınızda."
          </Typography>
        )}
      </Box>
    )}

    {/* Message Input */}
    {selectedMessageTag && selectedMessageTag !== 'CUSTOMER_FEEDBACK' && (
      <TextField
        value={tagMessage}
        onChange={(e) => setTagMessage(e.target.value)}
        placeholder="Mesajınızı buraya yazın..."
        variant="outlined"
        fullWidth
        multiline
        rows={4}
        sx={{ mb: 2 }}
      />
    )}

    {/* Customer Feedback Specific Fields */}
    {selectedMessageTag === 'CUSTOMER_FEEDBACK' && (
      <>
        <TextField
          label="Geri Bildirim Başlığı"
          value={customerFeedbackTitle}
          onChange={(e) => setCustomerFeedbackTitle(e.target.value)}
          fullWidth
          variant="outlined"
          sx={{ mb: 2 }}
          helperText="Kısa bir başlık girin (maks. 65 karakter)."
          inputProps={{ maxLength: 65 }}
        />
        <TextField
          label="Geri Bildirim Yükü (Payload)"
          value={customerFeedbackPayload}
          onChange={(e) => setCustomerFeedbackPayload(e.target.value)}
          fullWidth
          variant="outlined"
          sx={{ mb: 2 }}
          helperText="Geri bildirim için benzersiz bir kimlik (isteğe bağlı)."
        />
      </>
    )}

    {/* Buttons */}
    <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
      <Button
        onClick={() => {
          setMessageTagModalOpen(false);
          setSelectedMessageTag(null);
          setTagMessage('');
          setCustomerFeedbackTitle('Geri Bildiriminizi Alabilir Miyiz?');
          setCustomerFeedbackPayload('');
        }}
        variant="outlined"
        sx={{
          borderColor: '#65676b',
          color: '#65676b',
          borderRadius: '8px',
          textTransform: 'none',
          '&:hover': { borderColor: '#1877f2', color: '#1877f2' },
        }}
      >
        İptal
      </Button>
      <Button
        onClick={() => sendMessageTag()}
        variant="contained"
        disabled={
          !selectedMessageTag ||
          (selectedMessageTag !== 'CUSTOMER_FEEDBACK' && !tagMessage.trim()) ||
          (selectedMessageTag === 'CUSTOMER_FEEDBACK' && !customerFeedbackTitle.trim())
        }
        sx={{
          bgcolor: '#1877f2',
          color: '#fff',
          borderRadius: '8px',
          textTransform: 'none',
          '&:hover': { bgcolor: '#0056b3' },
          '&:disabled': { bgcolor: '#b0b0b0' },
        }}
      >
        Gönder
      </Button>
    </Box>
  </Box>
      </Modal>
      </Box>
    </Box>
  );
};

export default MessengerPage;