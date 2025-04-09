import React, { useEffect, useState, useRef } from 'react';
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
  const [playNotificationSound, setPlayNotificationSound] = useState(() => {
    const saved = localStorage.get('playNotificationSound');
    return saved !== null ? JSON.parse(saved) : true;
  });
  const [otnTokens, setOtnTokens] = useState({});
  const [openOtnModal, setOpenOtnModal] = useState(false);
  const [otnTitle, setOtnTitle] = useState('Can we contact you later with an update?');
  const [errorModalOpen, setErrorModalOpen] = useState(false);

  const typingTimeoutRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const timerRef = useRef(null);
  const messagesEndRef = useRef(null);
  const messagesContainerRef = useRef(null);
  const messageRefs = useRef({});
  const navigate = useNavigate();
  const ffmpegRef = useRef(new FFmpeg({ log: true }));
  const [ffmpegLoaded, setFfmpegLoaded] = useState(false);
  const [sessionExpiredModalOpen, setSessionExpiredModalOpen] = useState(false);
  const [useOtnForMessage, setUseOtnForMessage] = useState(false);
  const [otnConfirmationModalOpen, setOtnConfirmationModalOpen] = useState(false);
  const [userId, setUserId] = useState(localStorage.get('messengerUserId') || null);
  const [humanAgentModalOpen, setHumanAgentModalOpen] = useState(false);
  const [humanAgentMessage, setHumanAgentMessage] = useState('');
  const [confirmModalOpen, setConfirmModalOpen] = useState(false); 
  const [confirmAction, setConfirmAction] = useState(null); 
  const [confirmMessage, setConfirmMessage] = useState(''); 
  const [infoMessage, setInfoMessage] = useState(null);
const [infoModalOpen, setInfoModalOpen] = useState(false);
const [conversationSearchQuery, setConversationSearchQuery] = useState('');

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
        setError('Failed to initialize audio processing. Please try again later.');
        setErrorModalOpen(true);
      }
    };
    loadFFmpeg();
  }, [ffmpegLoaded]);

  useEffect(() => {
    const userId = localStorage.get('messengerUserId');
    const accessToken = localStorage.get('messengerAccessToken');
    if (!userId || !accessToken) {
      setError('Please log in to access the Messenger chat.');
      setErrorModalOpen(true);
      navigate('/MessengerLogin');
    }
  }, [navigate]);

  useEffect(() => {
    const newConnection = new signalR.HubConnectionBuilder()
      .withUrl('https://localhost:7099/messengerHub', { withCredentials: true })
      .withAutomaticReconnect()
      .configureLogging(signalR.LogLevel.Information)
      .build();

    setConnection(newConnection);

    newConnection
      .start()
      .then(() => console.log('SignalR Connected'))
      .catch((err) => {
        console.error('SignalR Connection Error:', err);
        setError('Failed to connect to real-time updates: ' + err.message);
        setErrorModalOpen(true);
      });

    newConnection.on('ReceiveMessage', (message) => {
      if (message.conversationId === selectedConversationId) {
        fetchMessages(1);
        if (message.direction === 'Inbound' && playNotificationSound) {
          const audio = new Audio('/audio/messenger-short-ringtone.mp3');
          audio.play().catch((err) => console.error('Error playing notification sound:', err));
        }
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
    const fetchConversations = async () => {
      try {
        const response = await fetch('https://localhost:7099/api/messenger/conversations', {
          credentials: 'include',
        });
        if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
        const data = await response.json();
        setConversations(data.map((conv) => ({ ...conv, unviewedCount: conv.unviewedCount || 0 })));
        if (data.length > 0 && !selectedConversationId) setSelectedConversationId(data[0].id);
      } catch (error) {
        console.error('Error fetching conversations:', error);
        setError('Failed to load conversations: ' + error.message);
        setErrorModalOpen(true);
      }
    };
    fetchConversations();
  }, []);

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


// Add this new function to send a message as a human agent
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
      senderId: userId,
      conversationId: selectedConversationId,
      text: humanAgentMessage,
      urls: null,
      timestamp: new Date().toISOString(),
      status: 'Sending',
      type: messageType,
      replyToId: replyingTo?.id || null,
      isHumanAgent: true, // Flag to indicate this is a human agent message
    },
  ]);

  scrollToBottom();

  const timeoutId = setTimeout(() => {
    setMessages((prev) =>
      prev.map((msg) => (msg.tempId === tempId ? { ...msg, status: 'failed' } : msg))
    );
    setError('Sending human agent message timed out');
    setErrorModalOpen(true);
  }, 10000);

  try {
    const response = await fetch('https://localhost:7099/api/messenger/send-human-agent-message', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        conversationId: selectedConversationId,
        text: humanAgentMessage,
        recipientId: selectedConversation.senderId,
      }),
      credentials: 'include',
    });

    clearTimeout(timeoutId);
    const data = await response.json();

    if (response.ok) {
      setMessages((prev) =>
        prev.map((msg) =>
          msg.tempId === tempId
            ? { ...msg, status: 'Sent', id: data.MessageId, mid: data.FacebookMessageId }
            : msg
        )
      );
      setHumanAgentMessage('');
      setHumanAgentModalOpen(false);
    } else {
      throw new Error(data.error || 'Unknown error');
    }
  } catch (error) {
    clearTimeout(timeoutId);
    setMessages((prev) =>
      prev.map((msg) => (msg.tempId === tempId ? { ...msg, status: 'failed' } : msg))
    );
    setError(`Failed to send human agent message: ${error.message}`);
    setErrorModalOpen(true);
  }
};


  const checkSessionStatus = async () => {
    if (!selectedConversationId || !connection) return { isExpired: false };
    const selectedConversation = conversations.find((c) => c.id === selectedConversationId);
    if (!selectedConversation || selectedConversation.blocked) return { isExpired: false };

    try {
      const response = await fetch(
        `https://localhost:7099/api/messenger/check-session/${selectedConversationId}`,
        { credentials: 'include' }
      );
      if (!response.ok) throw new Error('Failed to check session status');
      const data = await response.json();
      const lastInboundTimestamp = data.lastInboundTimestamp;
      if (!lastInboundTimestamp) return { isExpired: true }; // No inbound messages yet

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
      setError('Failed to check session status: ' + error.message);
      setErrorModalOpen(true);
      return { isExpired: false };
    }
  };
  const handleUseOtnToken = async () => {
    try {
      const response = await fetch(`https://localhost:7099/api/messenger/check-otn-token/${selectedConversationId}`, {
        method: 'GET',
        credentials: 'include',
      });
  
      if (!response.ok) {
        throw new Error('Failed to check OTN token status');
      }
  
      const data = await response.json();
  
      if (data.hasValidToken) {
        // Token exists and is valid, proceed to confirmation modal
        setOtnTokens((prev) => ({ ...prev, [selectedConversationId]: data.token }));
        setSessionExpiredModalOpen(false);
        setOtnConfirmationModalOpen(true);
      } else {
        // No valid token found
        setSessionExpiredModalOpen(false);
        setError("We are sorry, you don't have a valid token to use.");
        setErrorModalOpen(true);
      }
    } catch (error) {
      console.error('Error checking OTN token:', error);
      setSessionExpiredModalOpen(false);
      setError('Failed to verify OTN token: ' + error.message);
      setErrorModalOpen(true);
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
      const response = await fetch('https://localhost:7099/api/messenger/sender-action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          conversationId: selectedConversationId,
          recipientId: selectedConversation.senderId,
          senderAction: action,
        }),
        credentials: 'include',
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Failed to send sender action: ${errorData.Error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error sending sender action:', error);
      setError(`Failed to send ${action}: ${error.message}`);
      setErrorModalOpen(true);
    }
  };

  const filteredConversations = conversations.filter((conv) =>
    conv.name.toLowerCase().includes(conversationSearchQuery.toLowerCase())
  );

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
      let url = `https://localhost:7099/api/messenger/conversation-messages/${selectedConversationId}?page=${pageToFetch}&pageSize=5`;
      if (targetMessageId) url += `&targetMessageId=${targetMessageId}`;
      const response = await fetch(url, { credentials: 'include' });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`HTTP error! Status: ${response.status}, Message: ${errorData.Error || 'Unknown error'}`);
      }
      const data = await response.json();

      const fetchedMessages = (data.messages || []).map((msg) => {
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
        return { ...msg, urls, viewed: msg.viewed };
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
      setError('Failed to load messages: ' + error.message);
      setErrorModalOpen(true);
    }
  };

  const markMessagesViewed = async (messageIds) => {
    try {
      const response = await fetch(
        `https://localhost:7099/api/messenger/mark-messages-viewed/${selectedConversationId}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(messageIds),
          credentials: 'include',
        }
      );
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Failed to mark messages as viewed: ${errorData.Error || 'Unknown error'}`);
      }
      setMessages((prev) =>
        prev.map((msg) => (messageIds.includes(msg.id) ? { ...msg, viewed: true } : msg))
      );
    } catch (error) {
      console.error('Error marking messages as viewed:', error);
      setError('Failed to mark messages as viewed: ' + error.message);
      setErrorModalOpen(true);
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
            setError('File exceeds 25 MB limit. Please use a smaller file or upload it to Google Drive/Dropbox and share the link.');
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
          setError('One or more images exceed 25 MB. Please use smaller images.');
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

  const sendMessage = async () => {
    if ((!newMessage.trim() && files.length === 0 && !audioBlob) || !connection || !selectedConversationId) return;
    const selectedConversation = conversations.find((c) => c.id === selectedConversationId);
    if (!selectedConversation || selectedConversation.blocked) return;
  
    const sessionStatus = await checkSessionStatus();
    console.log("sessionStatus:", sessionStatus);
    if (sessionStatus.isExpired && !useOtnForMessage) {
      setSessionExpiredModalOpen(true);
      return;
    }
  
    const tempId = Date.now().toString();
  
    // Temporary messageType for UI
    const uiMessageType = audioBlob ? 'Audio' : files.length > 0 ? 'File' : 'Text';
  
    setMessages((prev) => [
      ...prev,
      {
        id: null,
        tempId,
        senderId: "576837692181131",
        conversationId: selectedConversationId,
        text: newMessage,
        urls: files.length > 0 ? filePreviews : null,
        audioUrl: audioBlob ? URL.createObjectURL(audioBlob) : null,
        timestamp: new Date().toISOString(),
        status: 'Sending',
        type: uiMessageType,
        replyToId: replyingTo?.id || null,
        isHumanAgent: false,
      },
    ]);
    scrollToBottom();
  
    const timeoutId = setTimeout(() => {
      setMessages((prev) => prev.map((msg) => (msg.tempId === tempId ? { ...msg, status: 'failed' } : msg)));
      setError(`Sending timed out`);
      setErrorModalOpen(true);
    }, 10000);
  
    let messageType = 'Text'; 
  
    try {
      let request;
  
      if (files.length > 0) {
        request = { conversationId: selectedConversationId, text: newMessage, urls: [] };
        for (const file of files) {
          const formData = new FormData();
          formData.append('files', file);
          const uploadResponse = await fetch('https://localhost:7099/api/messenger/upload-file', {
            method: 'POST',
            body: formData,
            credentials: 'include',
          });
          if (!uploadResponse.ok) throw new Error('File upload failed');
          const uploadData = await uploadResponse.json();
          request.urls.push(uploadData.urls[0]); 
        }
        const fileType = files[0].type;
        messageType = fileType.startsWith('image/') ? 'Image' :
                      fileType.startsWith('video/') ? 'Video' :
                      fileType.includes('audio') ? 'Audio' :
                      'Document';
        request.senderId = userId;
        request.recipientId = selectedConversation.senderId;
        request.messageType = messageType;
        request.tempId = tempId;
        request.repliedId = replyingTo?.id || null;
      } else if (audioBlob) {
        const formData = new FormData();
        formData.append('files', audioBlob, 'audio-message.wav');
        const uploadResponse = await fetch('https://localhost:7099/api/messenger/upload-file', {
          method: 'POST',
          body: formData,
          credentials: 'include',
        });
        if (!uploadResponse.ok) throw new Error('Audio upload failed');
        const uploadData = await uploadResponse.json();
        messageType = 'Audio';
        request = {
          conversationId: selectedConversationId,
          senderId: userId,
          recipientId: selectedConversation.senderId,
          text: newMessage,
          urls: uploadData.urls,
          messageType: messageType,
          tempId: tempId,
          repliedId: replyingTo?.id || null,
        };
      } else {
        messageType = 'Text';
        request = {
          conversationId: selectedConversationId,
          senderId: userId,
          recipientId: selectedConversation.senderId,
          text: newMessage,
          urls: null,
          messageType: messageType,
          tempId: tempId,
          repliedId: replyingTo?.id || null,
        };
      }
  
      const endpoint = useOtnForMessage
        ? 'https://localhost:7099/api/messenger/send-otn-message'
        : 'https://localhost:7099/api/messenger/send-message';
      const body = useOtnForMessage
        ? JSON.stringify({ conversationId: selectedConversationId, token: otnTokens[selectedConversationId], text: newMessage })
        : JSON.stringify(request);
  
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body,
        credentials: 'include',
      });
  
      clearTimeout(timeoutId);
      const data = await response.json();
  
      if (response.ok) {
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
      } else {
        throw new Error(data.error || 'Unknown error');
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

  const tempId = Date.now().toString() + Math.random().toString(36).substr(2, 9);
  const okayStickerPath = '/images/thumbup.png';

  const tempMessage = {
    tempId,
    conversationId: selectedConversationId,
    senderId: '576837692181131',
    recipientId: selectedConversation.senderId,
    text: null,
    urls: [okayStickerPath],
    messageType: 'Sticker',
    timestamp: new Date().toISOString(),
    direction: 'Outbound',
    status: 'sending',
    repliedId: replyingTo?.mid ? replyingTo.mid : null,
    viewed: true,
  };

  setMessages((prev) => [...prev, tempMessage]);
  setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);

  const timeoutId = setTimeout(() => {
    setMessages((prev) =>
      prev.map((msg) => (msg.tempId === tempId ? { ...msg, status: 'failed' } : msg))
    );
    setError('Sticker send timed out.');
    setErrorModalOpen(true);
  }, 10000);

  try {
    const response = await fetch(okayStickerPath);
    if (!response.ok) throw new Error('Failed to fetch thumbup.png');
    const blob = await response.blob();
    const file = new File([blob], 'thumbup.png', { type: 'image/png' });

    const formData = new FormData();
    formData.append('files', file);
    const uploadResponse = await fetch('https://localhost:7099/api/messenger/upload-file', {
      method: 'POST',
      body: formData,
      credentials: 'include',
    });

    if (!uploadResponse.ok) throw new Error('File upload failed');
    const uploadData = await uploadResponse.json();
    const fileUrls = uploadData.urls;

    const request = {
      conversationId: selectedConversationId,
      senderId: '576837692181131',
      recipientId: selectedConversation.senderId,
      text: null,
      urls: fileUrls,
      messageType: 'Sticker',
      tempId,
      repliedId: replyingTo?.mid ? replyingTo.mid : null,
    };

    const sendResponse = await fetch('https://localhost:7099/api/messenger/send-message', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(request),
      credentials: 'include',
    });

    clearTimeout(timeoutId);
    const data = await sendResponse.json();

    if (sendResponse.ok) {
      setMessages((prev) =>
        prev.map((msg) =>
          msg.tempId === tempId
            ? { ...msg, status: 'Sent', id: data.MessageId, mid: data.FacebookMessageId, urls: request.urls }
            : msg
        )
      );
      setReplyingTo(null);
    } else {
      setMessages((prev) =>
        prev.map((msg) => (msg.tempId === tempId ? { ...msg, status: 'failed' } : msg))
      );
      setError(`Failed to send sticker: ${data.error || 'Unknown error'}`);
      setErrorModalOpen(true);
    }
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
  console.log(selectedConversationIdForMenu, connection);
  if (!selectedConversationIdForMenu || !connection) return;
  const selectedConversation = conversations.find((c) => c.id === selectedConversationIdForMenu);
  if (!selectedConversation || selectedConversation.blocked) return;

  try {
    const response = await fetch('https://localhost:7099/api/messenger/request-otn', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        conversationId: selectedConversationIdForMenu,
        recipientId: selectedConversation.senderId,
        title: otnTitle,
      }),
      credentials: 'include',
    });

    if (!response.ok) {
      const errorData = await response.json();
      if (errorData.code === 10 && errorData.error_subcode === 2018310) {
        setError(
          'One-Time Notification permission is required. Please go to your Page Settings > Advanced Messaging to request this permission.'
        );
      } else {
        throw new Error(`Failed to request OTN: ${errorData.error || errorData.message || 'Unknown error'}`);
      }
      setErrorModalOpen(true);
      return;
    }

setInfoMessage('OTN request sent. Waiting for user approval...');
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
    setError('No OTN token available for this conversation.');
    setErrorModalOpen(true);
    return;
  }

  const tempId = Date.now().toString() + Math.random().toString(36).substr(2, 9);
  const tempMessage = {
    tempId,
    conversationId: selectedConversationId,
    senderId: '576837692181131',
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
    setError('OTN message send timed out.');
    setErrorModalOpen(true);
  }, 10000);

  try {
    const request = {
      conversationId: selectedConversationId,
      token: token,
      text: newMessage,
    };

    const response = await fetch('https://localhost:7099/api/messenger/send-otn-message', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(request),
      credentials: 'include',
    });

    clearTimeout(timeoutId);
    const data = await response.json();

    if (response.ok) {
      setMessages((prev) =>
        prev.map((msg) =>
          msg.tempId === tempId
            ? { ...msg, status: 'Sent', id: data.MessageId, mid: data.FacebookMessageId }
            : msg
        )
      );
      setNewMessage('');
      setOtnTokens((prev) => ({ ...prev, [selectedConversationId]: null }));
    } else {
      setMessages((prev) =>
        prev.map((msg) => (msg.tempId === tempId ? { ...msg, status: 'failed' } : msg))
      );
      setError(`Failed to send OTN message: ${data.error || 'Unknown error'}`);
      setErrorModalOpen(true);
    }
  } catch (error) {
    clearTimeout(timeoutId);
    setMessages((prev) =>
      prev.map((msg) => (msg.tempId === tempId ? { ...msg, status: 'failed' } : msg))
    );
    setError('Failed to send OTN message: ' + error.message);
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
        setError('Audio processing not ready. Please try again.');
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
    setError('Failed to access microphone: ' + err.message);
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
    'Warning: This message will be deleted from this project only, not from the real Messenger. Are you sure?'
  );
  setConfirmAction(() => async () => {
    try {
      const response = await fetch(`https://localhost:7099/api/messenger/delete-message/${messageId}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      if (!response.ok) throw new Error('Failed to delete message');
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
    'Warning: This conversation will be deleted from this project only, not from the real Messenger. Are you sure?'
  );
  setConfirmAction(() => async () => {
    try {
      const response = await fetch(`https://localhost:7099/api/messenger/delete-conversation/${conversationId}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      if (!response.ok) throw new Error('Failed to delete conversation');
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
    'Are you sure you want to block this user? They will no longer be able to message this Page.'
  );
  setConfirmAction(() => async () => {
    try {
      const response = await fetch(`https://localhost:7099/api/messenger/block-user/${conversationId}`, {
        method: 'POST',
        credentials: 'include',
      });
      if (!response.ok) throw new Error('Failed to block user');
      setConversations((prev) =>
        prev.map((conv) => (conv.id === conversationId ? { ...conv, blocked: true } : conv))
      );
    } catch (error) {
      setError('Failed to block user: ' + error.message);
      setErrorModalOpen(true);
    }
    handleCloseConversationMenu();
  });
  setConfirmModalOpen(true);
};

const unblockUser = async (conversationId) => {
  setConfirmMessage(
    'Are you sure you want to unblock this user? They will be able to message this Page again.'
  );
  setConfirmAction(() => async () => {
    try {
      const response = await fetch(`https://localhost:7099/api/messenger/unblock-user/${conversationId}`, {
        method: 'POST',
        credentials: 'include',
      });
      if (!response.ok) throw new Error('Failed to unblock user');
      setConversations((prev) =>
        prev.map((conv) => (conv.id === conversationId ? { ...conv, blocked: false } : conv))
      );
    } catch (error) {
      setError('Failed to unblock user: ' + error.message);
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
  setOtnTitle('Can we contact you later with an update?');
};

const handleKeyDown = async (event) => {
  if (event.key === 'Enter' && !event.shiftKey) {
    event.preventDefault();
    const sessionStatus = await checkSessionStatus();
    if (sessionStatus.isExpired && !useOtnForMessage) {
      setSessionExpiredModalOpen(true);
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
    const response = await fetch(
      `https://localhost:7099/api/messenger/search-messages/${selectedConversationId}?query=${encodeURIComponent(searchQuery)}`,
      { credentials: 'include' }
    );
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`HTTP error! Status: ${response.status}, Message: ${errorData.Error || 'Unknown error'}`);
    }
    const data = await response.json();
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
    setError('Failed to search messages: ' + error.message);
    setErrorModalOpen(true);
  }
};

const fetchMediaFilesLinks = async (type) => {
  if (!selectedConversationId) return [];
  try {
    const response = await fetch(
      `https://localhost:7099/api/messenger/conversation-messages/${selectedConversationId}?page=1&pageSize=1000`,
      { credentials: 'include' }
    );
    if (!response.ok) throw new Error('Failed to fetch messages');
    const data = await response.json();
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
    setError('Failed to load media/files/links: ' + error.message);
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
  setModalMedia({ type, url });
  setOpenModal(true);
};

const handleCloseModal = () => {
  setOpenModal(false);
  setModalMedia({ type: '', url: '' });
};

const selectedConversation = conversations.find((c) => c.id === selectedConversationId);
const userName = selectedConversation?.name || '?';
const showSendIcon = newMessage.trim() || files.length > 0 || audioBlob;

return (
  <Box sx={{ display: 'flex', height: '100vh', bgcolor: '#f0f2f5', fontFamily: '"Segoe UI", Roboto, sans-serif' }}>
<Box sx={{ width: '360px', bgcolor: '#fff', borderRight: '1px solid #e5e5e5', overflowY: 'auto', p: 2 }}>
  <Typography variant="h5" sx={{ fontWeight: 600, color: '#050505', mb: 2, pl: 1 }}>
    Chats
  </Typography>
  {/* Search Input */}
  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
    <InputBase
      placeholder="Search conversations..."
      value={conversationSearchQuery}
      onChange={(e) => setConversationSearchQuery(e.target.value)}
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
  <List>
    {filteredConversations.length > 0 ? (
      filteredConversations.map((conv) => (
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
            onClick={() => setSelectedConversationId(conv.id)}
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
              '&:hover': {
                color: '#1877f2',
                bgcolor: 'transparent',
              },
            }}
          >
            <ArrowDropDown />
          </IconButton>
          <Menu
            anchorEl={anchorElConversation}
            open={Boolean(anchorElConversation) && selectedConversationIdForMenu === conv.id}
            onClose={handleCloseConversationMenu}
          >
            <MenuItem onClick={() => deleteConversation(conv.id)}>Delete</MenuItem>
            {conv.blocked ? (
              <MenuItem onClick={() => unblockUser(conv.id)}>Unblock User</MenuItem>
            ) : (
              <MenuItem onClick={() => blockUser(conv.id)}>Block User</MenuItem>
            )}
            <MenuItem onClick={handleOpenOtnModal} disabled={otnTokens[conv.id]}>
              Request Follow-Up
            </MenuItem>
          </Menu>
        </Box>
      ))
    ) : (
      <Typography sx={{ color: '#65676b', textAlign: 'center', py: 2 }}>
        No conversations found.
      </Typography>
    )}
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
              Load More
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
                {msg.repliedId && (
                  <Box
                    sx={{ bgcolor: '#e9ecef', p: 1, borderRadius: '1px', mb: 1, fontSize: '13px', color: '#65676b', minWidth: '300px' }}
                  >
                    {messages.find((m) => m.mid === msg.repliedId)?.text || 'Original message not found'}
                  </Box>
                )}
                {msg.status === 'sending' ? (
                  <Box
                    sx={{
                      bgcolor: '#7e96ab  ',
                      color: '#fff',
                      p: 1.5,
                      borderRadius: '10px',
                      display: 'flex',
                      alignItems: 'center',
                    }}
                  >
                    <CircularProgress size={16} sx={{ color: '#fff', mr: 1 }} />
                    <Typography sx={{ fontSize: '15px' }}>Sending...</Typography>
                  </Box>
                ) : msg.status === 'failed' ? (
                  <Box sx={{ bgcolor: '#d93025', color: '#fff', p: 1.5, borderRadius: '10px' }}>
                    <Typography sx={{ fontSize: '15px' }}>Failed to send</Typography>
                  </Box>
                ) : (
                  <>
                    {msg.messageType === 'Text' ? (
                      <Typography
                        sx={{
                          bgcolor: msg.direction === 'Outbound' ? '#7e96ab  ' : '#e9ecef',
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
                              src={url}
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
                              src={url}
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
                          src={msg.urls[0]}
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
                        <audio src={msg.urls[0]} controls style={{ maxWidth: '200px' }} />
                      </Box>
                    ) : null}
                  </>
                )}
                <Typography
                  sx={{
                    position: 'absolute',
                    bottom: '-16px',
                    right:
                      msg.direction === 'Outbound' && msg.status !== 'sending' && msg.status !== 'failed'
                        ? '40px'
                        : '0',
                    fontSize: '12px',
                    color: '#65676b',
                    marginTop:30,
                  }}
                >
                  {msg.timestamp
                    ? new Date(msg.timestamp).toLocaleTimeString('en-US', {
                        hour: 'numeric',
                        minute: 'numeric',
                        hour12: true,
                      })
                    : 'Time unavailable'}
                </Typography>
                {msg.direction === 'Outbound' && msg.status !== 'sending' && msg.status !== 'failed' && (
                  <Typography
                    sx={{ position: 'absolute', bottom: '-16px', right: '0', fontSize: '12px', color: '#65676b' }}
                  >
                    {msg.status === 'Read' ? (
                      <DoneAll sx={{ fontSize: '16px', color: '#0084ff' }} />
                    ) : msg.status === 'Delivered' ? (
                      <DoneAll sx={{ fontSize: '16px', color: '#0084ff' }} />
                    ) : (
                      <Check sx={{ fontSize: '16px', color: '#65676b' }} />
                    )}
                  </Typography>
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
              {msg.direction === 'Outbound' && (
                <MenuItem onClick={() => deleteMessage(msg.id)}>Delete</MenuItem>
              )}
              {msg.direction === 'Inbound' && <MenuItem onClick={() => handleReply(msg)}>Reply</MenuItem>}
              {(msg.messageType === 'Document' || msg.messageType === 'Video' || msg.messageType === 'Audio') &&
                msg.urls && (
                  <MenuItem onClick={() => handleDownload(msg.urls[0])}>Download</MenuItem>
                )}
              {msg.messageType === 'Text' && msg.text && (
                <MenuItem onClick={() => handleCopy(msg.text)}>Copy</MenuItem>
              )}
            </Menu>
          </Box>
        ))}
        {/* {isRecipientTyping && (
          <Box sx={{ display: 'flex', alignItems: 'center', p: 2 }}>
            <Avatar sx={{ mr: 1, bgcolor: '#ddd', width: 32, height: 32 }}>{userName[0]}</Avatar>
            <Typography sx={{ color: '#65676b' }}>Typing...</Typography>
          </Box>
        )} */}
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
                    <img src={preview.url} alt={preview.name} style={{ maxWidth: '100px', borderRadius: '8px' }} />
                  ) : preview.type === 'Video' ? (
                    <video src={preview.url} style={{ maxWidth: '100px', borderRadius: '8px' }} controls />
                  ) : preview.type === 'Audio' ? (
                    <audio src={preview.url} controls style={{ maxWidth: '200px' }} />
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
              placeholder={otnTokens[selectedConversationId] ? 'Type your follow-up message...' : 'Aa'}
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
                <ListItemText primary="View media, files and links" />
              </ListItem>
              <ListItem button onClick={() => handleSidebarOption('search')}>
                <Search sx={{ mr: 2, color: '#65676b' }} />
                <ListItemText primary="Search in conversation" />
              </ListItem>
              <ListItem button onClick={() => handleSidebarOption('notifications')}>
                <Notifications sx={{ mr: 2, color: '#65676b' }} />
                <ListItemText primary="Notifications & sounds" />
              </ListItem>
            </List>
          ) : activeTab === 'media' || activeTab === 'files' || activeTab === 'links' ? (
              <>
                <Tabs value={activeTab} onChange={handleTabChange} sx={{ mb: 2, borderBottom: '1px solid #e5e5e5' }}>
                  <Tab label="Media" value="media" sx={{ textTransform: 'none', fontWeight: 500 }} />
                  <Tab label="Files" value="files" sx={{ textTransform: 'none', fontWeight: 500 }} />
                  <Tab label="Links" value="links" sx={{ textTransform: 'none', fontWeight: 500 }} />
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
                                  src={url}
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
                                  src={url}
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
                                src={item.urls[0]}
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
                        No files found.
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
                        No links found.
                      </Typography>
                    )}
                  </Box>
                )}
              </>
            ) : activeTab === 'search' ? (
              <Box>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <InputBase
                    placeholder="Search in conversation..."
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
                              src={url}
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
                          src={msg.urls[0]}
                          controls
                          style={{ maxWidth: '120px', borderRadius: '8px' }}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOpenModal('Video', msg.urls[0]);
                          }}
                        />
                      ) : msg.messageType === 'Audio' && msg.urls ? (
                        <audio src={msg.urls[0]} controls style={{ maxWidth: '200px' }} />
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
                          Unsupported message type
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
                  <Typography>No results found.</Typography>
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

        <Modal open={openModal} onClose={handleCloseModal}>
          <Box
            sx={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              bgcolor: '#fff',
              borderRadius: '12px',
              p: 2,
              maxWidth: '80%',
              maxHeight: '80vh',
              overflow: 'auto',
            }}
          >
            <IconButton onClick={handleCloseModal} sx={{ position: 'absolute', top: 8, right: 8, color: '#65676b' }}>
              <Close />
            </IconButton>
            {modalMedia.type === 'Image' ? (
              <img src={modalMedia.url} alt="Full size" style={{ maxWidth: '100%', borderRadius: '8px' }} />
            ) : modalMedia.type === 'Video' ? (
              <video src={modalMedia.url} controls style={{ maxWidth: '100%', borderRadius: '8px' }} />
            ) : null}
          </Box>
        </Modal>
        <Modal open={errorModalOpen} onClose={handleCloseErrorModal}>
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
    <Typography variant="h6" sx={{ fontWeight: 600, color: '#d93025', mb: 2 }}>
      Error
    </Typography>
    <Typography sx={{ fontSize: '15px', color: '#050505', mb: 3 }}>
      {error || 'An unexpected error occurred. Please try again.'}
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
      Close
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
          }}
        >
          <Typography variant="h6" sx={{ fontWeight: 600, color: '#050505', mb: 2 }}>
            Request Follow-Up Permission
          </Typography>

          {/* Explanation */}
          <Typography variant="body2" sx={{ mb: 2, color: '#444' }}>
            To comply with Facebook Messenger rules, we need your permission to send you a one-time follow-up message.
            After clicking “Send Request,” you’ll receive a “Notify Me” message in Messenger. If you click “Notify Me,” we’ll be allowed to send you one more update related to this request.
          </Typography>

          {/* Rules Accordion */}
          <Accordion sx={{ mb: 3 }}>
            <AccordionSummary expandIcon={<ExpandMoreIcon />} sx={{ bgcolor: '#f1f1f1' }}>
              <Typography variant="body2" fontWeight={600}>What are the rules?</Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Typography variant="body2" sx={{ color: '#333' }}>
                • You must click "Notify Me" in Messenger to grant permission.<br />
                • We can only send you <strong>one follow-up message</strong> using this permission.<br />
                • The follow-up message must be sent <strong>within 1 year</strong> of your approval.<br />
                • We can’t use this for promotions or unrelated messages.<br />
                • You can revoke this permission anytime from Messenger.<br />
                <strong>• OTN must be requested during an active 24-hour messaging window.</strong>
              </Typography>
            </AccordionDetails>
          </Accordion>

          {/* Input Field */}
          <TextField
            label="Notification Title"
            value={otnTitle}
            onChange={(e) => setOtnTitle(e.target.value)}
            fullWidth
            variant="outlined"
            sx={{ mb: 3 }}
            helperText="Enter a brief title for the follow-up request (max 65 characters)."
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
              Cancel
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
              Send Request
            </Button>
          </Box>
        </Box>
      </Modal>

      <Modal open={sessionExpiredModalOpen} onClose={() => setSessionExpiredModalOpen(false)}>
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
          <Typography variant="h6" sx={{ fontWeight: 600, color: '#d93025', mb: 2 }}>
            24-Hour Session Expired
          </Typography>
          <Typography sx={{ fontSize: '15px', color: '#050505', mb: 3 }}>
            The 24-hour messaging window has expired. To contact the customer, choose an option below:
          </Typography>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Button
              onClick={handleUseOtnToken}
              variant="outlined"
              sx={{
                borderColor: '#1877f2',
                color: '#1877f2',
                borderRadius: '8px',
                textTransform: 'none',
                '&:hover': { bgcolor: '#e5efff', borderColor: '#1877f2' },
              }}
            >
              Use OTN Token
            </Button>
            <Button
              onClick={() => {
                setSessionExpiredModalOpen(false);
                setError('Please contact a human agent to proceed.');
                setErrorModalOpen(true);
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
              Use Human Agent
            </Button>
          </Box>
        </Box>
      </Modal>
      <Modal open={sessionExpiredModalOpen} onClose={() => setSessionExpiredModalOpen(false)}>
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
    <Typography variant="h6" sx={{ fontWeight: 600, color: '#d93025', mb: 2 }}>
      24-Hour Session Expired
    </Typography>
    <Typography sx={{ fontSize: '15px', color: '#050505', mb: 3 }}>
      The 24-hour messaging window has expired. To contact the customer, choose an option below:
    </Typography>
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      <Button
        onClick={handleUseOtnToken}
        variant="outlined"
        sx={{
          borderColor: '#1877f2',
          color: '#1877f2',
          borderRadius: '8px',
          textTransform: 'none',
          '&:hover': { bgcolor: '#e5efff', borderColor: '#1877f2' },
        }}
      >
        Use OTN Token
      </Button>
      <Button
        onClick={() => {
          setSessionExpiredModalOpen(false);
          setHumanAgentModalOpen(true); // Open human agent modal instead of showing error
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
        Use Human Agent
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
    }}
  >
    <Typography variant="h6" sx={{ fontWeight: 600, color: '#1877f2', mb: 2 }}>
      Send Message as Human Agent
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
        Cancel
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
        Send
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
            Use One-Time Notification
          </Typography>
          <Typography sx={{ fontSize: '15px', color: '#050505', mb: 3 }}>
            Using current OTN token to send this message. Would you like to request another OTN for later?
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
              Okay (Send Now)
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
              Request More OTN
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
          }}
        >
          <Typography variant="h6" sx={{ fontWeight: 600, color: '#d93025', mb: 2 }}>
            Confirm Action
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
              Cancel
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
              Confirm
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
    }}
  >
    <Typography variant="h6" sx={{ fontWeight: 600, color: '#1877f2', mb: 2 }}>
      Information
    </Typography>
    <Typography sx={{ fontSize: '15px', color: '#050505', mb: 3 }}>
      {infoMessage || 'Processing your request...'}
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
      Okay
    </Button>
  </Box>
</Modal>
      </Box>
    </Box>
  );
};

export default MessengerPage;