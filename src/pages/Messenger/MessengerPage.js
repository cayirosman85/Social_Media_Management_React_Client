import React, { useEffect, useState, useRef } from 'react';
import { Typography, TextField, Button, Box, List, ListItem, ListItemText, IconButton, Menu, MenuItem, Modal, Avatar, CircularProgress, Tabs, Tab, InputBase, Switch, FormControlLabel } from '@mui/material';
import { Check, DoneAll, AttachFile, SentimentSatisfiedAlt, ArrowDropDown, Close, Mic, Image, InsertDriveFile, Link, Search, Notifications, ThumbUp } from '@mui/icons-material';
import * as signalR from '@microsoft/signalr';
import { useNavigate } from 'react-router-dom';
import localStorage from 'local-storage';
import Picker from 'emoji-picker-react';

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
  const [playNotificationSound, setPlayNotificationSound] = useState(() => {
    const saved = localStorage.get('playNotificationSound');
    return saved !== null ? JSON.parse(saved) : true; // Default to true
  });
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const timerRef = useRef(null);
  const messagesEndRef = useRef(null);
  const messagesContainerRef = useRef(null);
  const messageRefs = useRef({});
  const navigate = useNavigate();

  useEffect(() => {
    const userId = localStorage.get('messengerUserId');
    const accessToken = localStorage.get('messengerAccessToken');
    if (!userId || !accessToken) {
      setError('Please log in to access the Messenger chat.');
      navigate('/MessengerLogin');
    }
  }, [navigate]);

  const fetchMessages = async (pageToFetch = 1, append = false, targetMessageId = null) => {
    if (!selectedConversationId) return;
    try {
      let url = `https://localhost:7099/api/messenger/conversation-messages/${selectedConversationId}?page=${pageToFetch}&pageSize=5`;
      if (targetMessageId) {
        url += `&targetMessageId=${targetMessageId}`;
      }
      const response = await fetch(url, { credentials: 'include' });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`HTTP error! Status: ${response.status}, Message: ${errorData.Error || 'Unknown error'}`);
      }
      const data = await response.json();
  
      const fetchedMessages = (data.messages || []).map(msg => {
        let urls = null;
        if (msg.url) {
          if (msg.messageType === 'Image' || msg.messageType === 'Sticker') { // Add Sticker here
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
  
      setTotalMessages(data.totalMessages || 0);
  
      if (append) {
        setMessages((prev) => [...fetchedMessages, ...prev]);
      } else {
        setMessages(fetchedMessages);
        setTimeout(() => {
          if (targetMessageId) {
            const targetMessageRef = messageRefs.current[targetMessageId];
            if (targetMessageRef) {
              targetMessageRef.scrollIntoView({ behavior: 'smooth', block: 'center' });
            } else {
              messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
            }
          } else {
            messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
          }
        }, 100);
      }
  
      setShowLoadMore(pageToFetch * 5 < data.totalMessages);
    } catch (error) {
      console.error('Error fetching messages:', error);
      setError('Failed to load messages: ' + error.message);
    }
  };

  useEffect(() => {
    const newConnection = new signalR.HubConnectionBuilder()
      .withUrl('https://localhost:7099/messengerHub', { withCredentials: true })
      .withAutomaticReconnect()
      .configureLogging(signalR.LogLevel.Information)
      .build();

    setConnection(newConnection);

    newConnection.start()
      .then(() => console.log('SignalR Connected'))
      .catch((err) => console.error('SignalR Connection Error:', err));

    newConnection.on('ReceiveMessage', (message) => {
      if (message.conversationId === selectedConversationId) {
        fetchMessages(1);
      }
      if (playNotificationSound) {
        const audio = new Audio('/audio/messenger-short-ringtone.mp3');
        audio.play().catch((err) => console.error('Error playing notification sound:', err));
      }
    });

    newConnection.on('MessageStatusUpdated', (data) => {
      if (data.conversationId === selectedConversationId) {
        fetchMessages(1);
      }
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
        prev.map((conv) =>
          conv.id === data.conversationId ? { ...conv, blocked: true } : conv
        )
      );
    });

    newConnection.on('UserUnblocked', (data) => {
      setConversations((prev) =>
        prev.map((conv) =>
          conv.id === data.conversationId ? { ...conv, blocked: false } : conv
        )
      );
    });

    return () => newConnection.stop();
  }, [selectedConversationId, playNotificationSound]);

  useEffect(() => {
    const fetchConversations = async () => {
      try {
        const response = await fetch('https://localhost:7099/api/messenger/conversations', { credentials: 'include' });
        if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
        const data = await response.json();
        setConversations(data);
        if (data.length > 0 && !selectedConversationId) setSelectedConversationId(data[0].id);
      } catch (error) {
        console.error('Error fetching conversations:', error);
        setError('Failed to load conversations: ' + error.message);
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
      }
    };

    fetchSidebarData();
  }, [selectedConversationId, showSidebar, activeTab]);

  const handleScroll = () => {
    if (messagesContainerRef.current) {
      const { scrollTop } = messagesContainerRef.current;
      if (scrollTop === 0 && page * 5 < totalMessages) {
        setShowLoadMore(true);
      } else {
        setShowLoadMore(false);
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
      const hasNonImages = selectedFiles.some(file => !file.type.startsWith('image/'));
      if (hasNonImages) {
        const nonImageFile = selectedFiles.find(file => !file.type.startsWith('image/'));
        if (nonImageFile) {
          if (nonImageFile.size > 25 * 1024 * 1024) {
            setError('File exceeds 25 MB limit. Please use a smaller file or upload it to Google Drive/Dropbox and share the link.');
            setFiles([]);
            setFilePreviews([]);
          } else {
            setFiles([nonImageFile]);
            setFilePreviews([{
              type: nonImageFile.type.startsWith('video/') ? 'Video' : 'Document',
              url: URL.createObjectURL(nonImageFile),
              name: nonImageFile.name,
            }]);
            setError(selectedFiles.length > 1 ? 'Only one non-image file can be sent at a time.' : null);
          }
        }
      } else {
        const oversizedImages = selectedFiles.filter(file => file.size > 25 * 1024 * 1024);
        if (oversizedImages.length > 0) {
          setError('One or more images exceed 25 MB. Please use smaller images.');
          setFiles([]);
          setFilePreviews([]);
        } else {
          setFiles(selectedFiles);
          setFilePreviews(selectedFiles.map(file => ({
            type: 'Image',
            url: URL.createObjectURL(file),
            name: file.name,
          })));
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
      const supportedMimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus') ? 'audio/webm;codecs=opus' : 'audio/webm';
      console.log(`Using MIME type for recording: ${supportedMimeType}`);

      const mediaRecorder = new MediaRecorder(stream, { mimeType: supportedMimeType });
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        audioChunksRef.current.push(event.data);
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: supportedMimeType });
        if (audioBlob.size > 25 * 1024 * 1024) {
          setError('Audio exceeds 25 MB limit.');
          setAudioBlob(null);
          setFiles([]);
          setFilePreviews([]);
        } else {
          setAudioBlob(audioBlob);
          const fileName = supportedMimeType.includes('webm') ? 'recording.webm' : 'recording.mp3';
          setFiles([new File([audioBlob], fileName, { type: supportedMimeType })]);
          setFilePreviews([{ type: 'Audio', url: URL.createObjectURL(audioBlob), name: fileName }]);
        }
        stream.getTracks().forEach(track => track.stop());
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
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const sendMessage = async () => {
    if ((!newMessage.trim() && files.length === 0 && !audioBlob) || !connection || !selectedConversationId) return;
    const selectedConversation = conversations.find((c) => c.id === selectedConversationId);
    if (!selectedConversation) return;

    if (selectedConversation.blocked) {
      setError('Cannot send message: User is blocked');
      return;
    }

    const tempId = Date.now().toString() + Math.random().toString(36).substr(2, 9);
    const isImage = files.length > 0 && files.every(file => file.type.startsWith('image/'));
    const isAudio = files.length > 0 && files[0].type.includes('audio');
    const messageType = files.length > 0 
      ? (isImage ? 'Image' : isAudio ? 'Audio' : files[0].type.startsWith('video/') ? 'Video' : 'Document') 
      : 'Text';

    const tempMessage = {
      tempId,
      conversationId: selectedConversationId,
      senderId: "576837692181131",
      recipientId: selectedConversation.senderId,
      text: files.length > 0 ? null : newMessage,
      urls: files.length > 0 ? files.map(file => URL.createObjectURL(file)) : null,
      messageType,
      timestamp: new Date().toISOString(),
      direction: 'Outbound',
      status: 'sending',
      repliedId: replyingTo?.mid ? replyingTo.mid : null,
    };

    setMessages((prev) => [...prev, tempMessage]);
    setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);

    const timeoutId = setTimeout(() => {
      setMessages((prev) =>
        prev.map((msg) => (msg.tempId === tempId ? { ...msg, status: 'failed' } : msg))
      );
      setError('Message send timed out.');
    }, 10000);

    try {
      let request;
      if (files.length > 0) {
        const formData = new FormData();
        files.forEach(file => formData.append('files', file));
        const uploadResponse = await fetch('https://localhost:7099/api/messenger/upload-file', {
          method: 'POST',
          body: formData,
          credentials: 'include',
        });
        if (!uploadResponse.ok) throw new Error('File upload failed');
        const uploadData = await uploadResponse.json();
        const fileUrls = uploadData.urls;
        request = {
          conversationId: selectedConversationId,
          senderId: "576837692181131",
          recipientId: selectedConversation.senderId,
          text: null,
          urls: fileUrls,
          messageType,
          tempId,
          repliedId: replyingTo?.mid ? replyingTo.mid : null,
        };
      } else {
        request = {
          conversationId: selectedConversationId,
          senderId: "576837692181131",
          recipientId: selectedConversation.senderId,
          text: newMessage,
          urls: null,
          messageType: "Text",
          tempId,
          repliedId: replyingTo?.mid ? replyingTo.mid : null,
        };
      }

      const response = await fetch('https://localhost:7099/api/messenger/send-message', {
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
            msg.tempId === tempId ? { ...msg, status: 'Sent', id: data.MessageId, mid: data.FacebookMessageId, urls: request.urls } : msg
          )
        );
        setNewMessage('');
        setFiles([]);
        setFilePreviews([]);
        setAudioBlob(null);
        setReplyingTo(null);
      } else {
        setMessages((prev) =>
          prev.map((msg) => (msg.tempId === tempId ? { ...msg, status: 'failed' } : msg))
        );
        setError(`Failed to send ${messageType.toLowerCase()}: ${data.error || 'Unknown error'}`);
      }
    } catch (error) {
      clearTimeout(timeoutId);
      setMessages((prev) =>
        prev.map((msg) => (msg.tempId === tempId ? { ...msg, status: 'failed' } : msg))
      );
      setError(`Failed to send ${messageType.toLowerCase()}: ${error.message}`);
    }
  };

  const sendOkaySticker = async () => {
    if (!connection || !selectedConversationId) return;
    const selectedConversation = conversations.find((c) => c.id === selectedConversationId);
    if (!selectedConversation) return;
  
    if (selectedConversation.blocked) {
      setError('Cannot send message: User is blocked');
      return;
    }
  
    const tempId = Date.now().toString() + Math.random().toString(36).substr(2, 9);
    const okayStickerPath = '/images/thumbup.png'; // Path to the image in the public folder
  
    const tempMessage = {
      tempId,
      conversationId: selectedConversationId,
      senderId: "576837692181131",
      recipientId: selectedConversation.senderId,
      text: null,
      urls: [okayStickerPath], // Temporary URL for display in the UI
      messageType: 'Sticker', // Use 'Sticker' instead of 'Image'
      timestamp: new Date().toISOString(),
      direction: 'Outbound',
      status: 'sending',
      repliedId: replyingTo?.mid ? replyingTo.mid : null,
    };
  
    setMessages((prev) => [...prev, tempMessage]);
    setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
  
    const timeoutId = setTimeout(() => {
      setMessages((prev) =>
        prev.map((msg) => (msg.tempId === tempId ? { ...msg, status: 'failed' } : msg))
      );
      setError('Message send timed out.');
    }, 10000);
  
    try {
      // Step 1: Fetch the thumbup.png image as a blob from the public folder
      const response = await fetch(okayStickerPath);
      if (!response.ok) throw new Error('Failed to fetch thumbup.png from public folder');
      const blob = await response.blob();
      const file = new File([blob], 'thumbup.png', { type: 'image/png' });
  
      // Step 2: Upload the image to your backend server
      const formData = new FormData();
      formData.append('files', file);
      const uploadResponse = await fetch('https://localhost:7099/api/messenger/upload-file', {
        method: 'POST',
        body: formData,
        credentials: 'include',
      });
  
      if (!uploadResponse.ok) {
        const errorData = await uploadResponse.json();
        throw new Error(`File upload failed: ${errorData.error || 'Unknown error'}`);
      }
  
      const uploadData = await uploadResponse.json();
      const fileUrls = uploadData.urls; // This should be a publicly accessible URL
  
      // Step 3: Send the message with the uploaded URL
      const request = {
        conversationId: selectedConversationId,
        senderId: "576837692181131",
        recipientId: selectedConversation.senderId,
        text: null,
        urls: fileUrls, // Use the URL returned by the backend
        messageType: 'Sticker', // Use 'Sticker' instead of 'Image'
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
            msg.tempId === tempId ? { ...msg, status: 'Sent', id: data.MessageId, mid: data.FacebookMessageId, urls: request.urls } : msg
          )
        );
        setReplyingTo(null);
      } else {
        setMessages((prev) =>
          prev.map((msg) => (msg.tempId === tempId ? { ...msg, status: 'failed' } : msg))
        );
        setError(`Failed to send sticker: ${data.error || 'Unknown error'}`);
      }
    } catch (error) {
      clearTimeout(timeoutId);
      setMessages((prev) =>
        prev.map((msg) => (msg.tempId === tempId ? { ...msg, status: 'failed' } : msg))
      );
      setError(`Failed to send sticker: ${error.message}`);
    }
  };
  const deleteMessage = async (messageId) => {
    if (!window.confirm("Warning: This message will be deleted from this project only, not from the real Messenger. Are you sure?")) {
      handleCloseMessageMenu();
      return;
    }
    const response = await fetch(`https://localhost:7099/api/messenger/delete-message/${messageId}`, {
      method: 'DELETE',
      credentials: 'include',
    });
    if (!response.ok) {
      const data = await response.json();
      setError('Failed to delete message: ' + (data.error || 'Unknown error'));
    }
    handleCloseMessageMenu();
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
    navigator.clipboard.writeText(text)
      .then(() => handleCloseMessageMenu())
      .catch((err) => {
        setError('Failed to copy text');
        handleCloseMessageMenu();
      });
  };

  const deleteConversation = async (conversationId) => {
    if (!window.confirm("Warning: This conversation will be deleted from this project only, not from the real Messenger. Are you sure?")) {
      handleCloseConversationMenu();
      return;
    }
    const response = await fetch(`https://localhost:7099/api/messenger/delete-conversation/${conversationId}`, {
      method: 'DELETE',
      credentials: 'include',
    });
    if (!response.ok) {
      const data = await response.json();
      setError('Failed to delete conversation: ' + (data.error || 'Unknown error'));
    }
    handleCloseConversationMenu();
  };

  const blockUser = async (conversationId) => {
    if (!window.confirm("Are you sure you want to block this user? They will no longer be able to message this Page.")) {
      handleCloseConversationMenu();
      return;
    }
    try {
      const response = await fetch(`https://localhost:7099/api/messenger/block-user/${conversationId}`, {
        method: 'POST',
        credentials: 'include',
      });
      if (!response.ok) {
        const data = await response.json();
        setError('Failed to block user: ' + (data.error || 'Unknown error'));
      }
    } catch (error) {
      setError('Failed to block user: ' + error.message);
    }
    handleCloseConversationMenu();
  };

  const unblockUser = async (conversationId) => {
    if (!window.confirm("Are you sure you want to unblock this user? They will be able to message this Page again.")) {
      handleCloseConversationMenu();
      return;
    }
    try {
      const response = await fetch(`https://localhost:7099/api/messenger/unblock-user/${conversationId}`, {
        method: 'POST',
        credentials: 'include',
      });
      if (!response.ok) {
        const data = await response.json();
        setError('Failed to unblock user: ' + (data.error || 'Unknown error'));
      }
    } catch (error) {
      setError('Failed to unblock user: ' + error.message);
    }
    handleCloseConversationMenu();
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
    setAnchorElConversation(event.currentTarget);
    setSelectedConversationIdForMenu(conversationId);
  };

  const handleCloseConversationMenu = () => {
    setAnchorElConversation(null);
    setSelectedConversationIdForMenu(null);
  };

  const handleOpenModal = (type, url) => {
    setModalMedia({ type, url });
    setOpenModal(true);
  };

  const handleCloseModal = () => {
    setOpenModal(false);
    setModalMedia({ type: '', url: '' });
  };

  const handleKeyDown = (event) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      sendMessage();
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
    if (option === 'viewMedia') {
      setActiveTab('media');
    } else if (option === 'search') {
      setActiveTab('search');
    } else if (option === 'notifications') {
      setActiveTab('notifications');
    }
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
      const results = data.messages.map(msg => {
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
      return data.messages.filter(msg => {
        if (type === 'media') return ['Image', 'Video', 'Audio', 'Sticker'].includes(msg.messageType); // Add Sticker here
        if (type === 'files') return msg.messageType === 'Document';
        if (type === 'links') return msg.messageType === 'Text' && msg.text.includes('http');
        return false;
      }).map(msg => {
        let urls = null;
        if (msg.url) {
          if (msg.messageType === 'Image' || msg.messageType === 'Sticker') { // Add Sticker here
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

  const selectedConversation = conversations.find((c) => c.id === selectedConversationId);
  const userName = selectedConversation?.name || '?';
  const showSendIcon = newMessage.trim() || files.length > 0 || audioBlob;

  return (
    <Box sx={{ display: 'flex', height: '100vh', bgcolor: '#f0f2f5', fontFamily: '"Segoe UI", Roboto, sans-serif' }}>
      <Box sx={{ width: '360px', bgcolor: '#fff', borderRight: '1px solid #e5e5e5', overflowY: 'auto', p: 2 }}>
        <Typography variant="h5" sx={{ fontWeight: 600, color: '#050505', mb: 2, pl: 1 }}>
          Chats
        </Typography>
        <List>
          {conversations.map((conv) => (
            <Box key={conv.id} sx={{ display: 'flex', alignItems: 'center', position: 'relative' }}>
              <ListItem
                button
                onClick={() => setSelectedConversationId(conv.id)}
                sx={{
                  borderRadius: '10px',
                  mb: 0.5,
                  bgcolor: selectedConversationId === conv.id ? '#e5efff' : 'transparent',
                  '&:hover': { bgcolor: '#f5f5f5' },
                  py: 1,
                }}
              >
                <Avatar sx={{ mr: 2, bgcolor: conv.blocked ? '#ff4444' : '#ddd' }}>{conv.name[0]}</Avatar>
                <ListItemText
                  primary={conv.name}
                  primaryTypographyProps={{ fontSize: '16px', fontWeight: 500, color: conv.blocked ? '#ff4444' : '#050505' }}
                />
              </ListItem>
              <IconButton
                onClick={(e) => handleOpenConversationMenu(e, conv.id)}
                sx={{ color: '#65676b', '&:hover': { color: '#1877f2' } }}
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
              </Menu>
            </Box>
          ))}
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
          <Typography variant="h6" sx={{ fontWeight: 600, color: selectedConversation?.blocked ? '#ff4444' : '#050505' }}>
            {selectedConversation?.name || 'Select a chat'}
            {selectedConversation?.blocked && ' (Blocked)'}
          </Typography>
        </Box>

        <Box
          ref={messagesContainerRef}
          onScroll={handleScroll}
          sx={{ flexGrow: 1, overflowY: 'auto', p: 3, bgcolor: '#f0f2f5' }}
        >
          {error && (
            <Typography sx={{ color: '#d93025', textAlign: 'center', p: 1, bgcolor: '#fce8e6', borderRadius: '8px', mb: 2 }}>
              {error}
            </Typography>
          )}
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
    }}
  >
    <Box sx={{ maxWidth: '60%', display: 'flex', alignItems: 'flex-start' }}>
      {msg.direction === 'Inbound' && (
        <Avatar sx={{ mr: 1, bgcolor: '#ddd', width: 32, height: 32 }}>{userName[0]}</Avatar>
      )}
      <Box sx={{ position: 'relative' }}>
        {msg.repliedId && (
          <Box sx={{ bgcolor: '#e9ecef', p: 1, borderRadius: '8px', mb: 1, fontSize: '13px', color: '#65676b' }}>
            {messages.find((m) => m.mid === msg.repliedId)?.text || 'Original message not found'}
          </Box>
        )}
        {msg.status === 'sending' ? (
          <Box sx={{ bgcolor: '#0084ff', color: '#fff', p: 1.5, borderRadius: '10px', display: 'flex', alignItems: 'center' }}>
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
              <Typography sx={{ bgcolor: msg.direction === 'Outbound' ? '#0084ff' : '#e9ecef', color: msg.direction === 'Outbound' ? '#fff' : '#050505', p: 1.5, borderRadius: '10px', fontSize: '15px', minWidth: 100 }}>
                {msg.text}
              </Typography>
            ) : msg.messageType === 'Sticker' && msg.urls ? (
              <Box sx={{ p: 0.5, bgcolor: 'transparent', display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                {msg.urls.map((url, index) => (
                  <Box
                    key={index}
                    sx={{
                      cursor: 'default',
                      display: 'inline-flex',
                      alignItems: 'center',
                    }}
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
              <Box sx={{ p: 0.5, bgcolor: msg.direction === 'Outbound' ? '#0084ff' : '#e9ecef', borderRadius: '10px', display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                {msg.urls.map((url, index) => (
                  <Box key={index} sx={{ cursor: 'pointer' }} onClick={() => handleOpenModal('Image', url)}>
                    <img src={url} alt={`Sent image ${index}`} style={{ maxWidth: '100px', borderRadius: '8px' }} />
                  </Box>
                ))}
              </Box>
            ) : msg.messageType === 'Video' && msg.urls ? (
              <Box sx={{ p: 0.5, bgcolor: msg.direction === 'Outbound' ? '#0084ff' : '#e9ecef', borderRadius: '10px' }} onClick={() => handleOpenModal('Video', msg.urls[0])}>
                <video src={msg.urls[0]} style={{ maxWidth: '200px', borderRadius: '8px' }} controls />
              </Box>
            ) : msg.messageType === 'Document' && msg.urls ? (
              <Typography sx={{ bgcolor: msg.direction === 'Outbound' ? '#0084ff' : '#e9ecef', color: msg.direction === 'Outbound' ? '#fff' : '#050505', p: 1.5, borderRadius: '10px', fontSize: '15px' }}>
                <a href={msg.urls[0]} target="_blank" rel="noopener noreferrer" style={{ color: 'inherit' }}>Document</a>
              </Typography>
            ) : msg.messageType === 'Audio' && msg.urls ? (
              <Box sx={{ bgcolor: msg.direction === 'Outbound' ? '#0084ff' : '#e9ecef', p: 1.5, borderRadius: '10px' }}>
                <audio src={msg.urls[0]} controls style={{ maxWidth: '200px' }} />
              </Box>
            ) : null}
          </>
        )}
        <Typography
          sx={{
            position: 'absolute',
            bottom: '-16px',
            right: msg.direction === 'Outbound' && msg.status !== 'sending' && msg.status !== 'failed' ? '40px' : '0',
            fontSize: '12px',
            color: '#65676b',
          }}
        >
          {msg.timestamp ? new Date(msg.timestamp).toLocaleTimeString('en-US', { hour: 'numeric', minute: 'numeric', hour12: true }) : 'Time unavailable'}
        </Typography>
        {msg.direction === 'Outbound' && msg.status !== 'sending' && msg.status !== 'failed' && (
          <Typography sx={{ position: 'absolute', bottom: '-16px', right: '0', fontSize: '12px', color: '#65676b' }}>
            {msg.status === 'Read' ? <DoneAll sx={{ fontSize: '16px', color: '#0084ff' }} /> : msg.status === 'Delivered' ? <DoneAll sx={{ fontSize: '16px', color: '#65676b' }} /> : <Check sx={{ fontSize: '16px', color: '#65676b' }} />}
          </Typography>
        )}
        {(msg.status === 'Sent' || msg.status === 'Delivered' || msg.status === 'Read' || !msg.status) && (
          <IconButton onClick={(e) => handleOpenMessageMenu(e, msg.id || msg.tempId)} sx={{ position: 'absolute', top: '-18px', right: '-18px', color: '#65676b', '&:hover': { color: '#1877f2' } }}>
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
      {msg.direction === 'Outbound' && <MenuItem onClick={() => deleteMessage(msg.id)}>Delete</MenuItem>}
      {msg.direction === 'Inbound' && <MenuItem onClick={() => handleReply(msg)}>Reply</MenuItem>}
      {(msg.messageType === 'Document' || msg.messageType === 'Video' || msg.messageType === 'Audio') && msg.urls && (
        <MenuItem onClick={() => handleDownload(msg.urls[0])}>Download</MenuItem>
      )}
      {msg.messageType === 'Text' && msg.text && <MenuItem onClick={() => handleCopy(msg.text)}>Copy</MenuItem>}
    </Menu>
  </Box>
))}
          <div ref={messagesEndRef} />
        </Box>

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
              <Typography variant="h6" sx={{ fontWeight: 600 }}>
                {userName}
              </Typography>
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
                  style={{ width: '100%', height: '80px', objectFit: 'cover', borderRadius: '6px' }}
                  onClick={() => handleOpenModal('Image', url)}
                />
              ))
            ) : item.messageType === 'Sticker' && item.urls ? (
              item.urls.map((url, i) => (
                <img
                  key={i}
                  src={url}
                  alt={`Sticker ${i}`}
                  style={{ width: '100%', height: '80px', objectFit: 'contain', borderRadius: '6px' }}
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
              {new Date(item.timestamp).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: 'numeric', hour12: true })}
            </Typography>
          </Box>
        ))}
      </Box>
    ) : (
      <Typography sx={{ color: '#65676b', textAlign: 'center', py: 2 }}>No media found.</Typography>
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
                              sx={{ fontSize: '14px', color: '#1877f2', textDecoration: 'none', '&:hover': { textDecoration: 'underline' } }}
                            >
                              {item.urls[0].split('/').pop() || 'Unnamed File'}
                            </Typography>
                            <Typography sx={{ fontSize: '12px', color: '#65676b' }}>
                              {new Date(item.timestamp).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: 'numeric', hour12: true })}
                            </Typography>
                          </Box>
                        </Box>
                      ))
                    ) : (
                      <Typography sx={{ color: '#65676b', textAlign: 'center', py: 2 }}>No files found.</Typography>
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
                              sx={{ fontSize: '14px', color: '#1877f2', textDecoration: 'none', '&:hover': { textDecoration: 'underline' }, wordBreak: 'break-all' }}
                            >
                              {item.text.length > 30 ? `${item.text.substring(0, 27)}...` : item.text}
                            </Typography>
                            <Typography sx={{ fontSize: '12px', color: '#65676b' }}>
                              {new Date(item.timestamp).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: 'numeric', hour12: true })}
                            </Typography>
                          </Box>
                        </Box>
                      ))
                    ) : (
                      <Typography sx={{ color: '#65676b', textAlign: 'center', py: 2 }}>No links found.</Typography>
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
                        <Typography sx={{ fontSize: '15px', color: '#65676b' }}>Unsupported message type</Typography>
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
              <video src={modalMedia.url} controls style={{ maxWidth: '100%', borderRadius: '8px' }} autoPlay />
            ) : null}
          </Box>
        </Modal>

        {filePreviews.length > 0 && (
          <Box sx={{ p: 2, bgcolor: '#fff', borderTop: '1px solid #e5e5e5', display: 'flex', flexWrap: 'wrap', gap: 1 }}>
            {filePreviews.map((preview, index) => (
              <Box key={index} sx={{ display: 'flex', alignItems: 'center' }}>
                {preview.type === 'Image' ? (
                  <img src={preview.url} alt="Preview" style={{ maxWidth: '80px', borderRadius: '8px', mr: 1 }} />
                ) : preview.type === 'Video' ? (
                  <video src={preview.url} style={{ maxWidth: '80px', borderRadius: '8px', mr: 1 }} controls />
                ) : preview.type === 'Audio' ? (
                  <audio src={preview.url} controls style={{ maxWidth: '200px', mr: 1 }} />
                ) : (
                  <Typography sx={{ mr: 1, color: '#050505' }}>{preview.name}</Typography>
                )}
                <IconButton onClick={() => removeFile(index)} sx={{ color: '#d93025' }}>
                  <Close />
                </IconButton>
              </Box>
            ))}
          </Box>
        )}

        {replyingTo && (
          <Box sx={{ p: 1, bgcolor: '#f0f2f5', borderTop: '1px solid #e5e5e5', display: 'flex', alignItems: 'center' }}>
            <Typography sx={{ flexGrow: 1, color: '#65676b', fontSize: '14px' }}>
              Replying to: {replyingTo.text || replyingTo.messageType}
            </Typography>
            <IconButton onClick={() => setReplyingTo(null)} sx={{ color: '#d93025' }}>
              <Close />
            </IconButton>
          </Box>
        )}

        {isRecording && (
          <Box sx={{ p: 1, bgcolor: '#fff', borderTop: '1px solid #e5e5e5', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Typography sx={{ color: '#d93025', fontSize: '14px', fontWeight: 500 }}>
              Recording: {formatRecordingTime(recordingTime)}
            </Typography>
          </Box>
        )}

        <Box sx={{ p: 2, bgcolor: '#fff', borderTop: '1px solid #e5e5e5', display: 'flex', alignItems: 'center' }}>
          <IconButton component="label" sx={{ color: '#65676b', '&:hover': { color: '#1877f2' } }}>
            <AttachFile />
            <input type="file" hidden multiple accept="image/*,video/*,application/pdf" onChange={handleFileChange} />
          </IconButton>
          <IconButton
            onClick={isRecording ? stopRecording : startRecording}
            disabled={!selectedConversationId || selectedConversation?.blocked}
            sx={{ color: isRecording ? '#d93025' : '#65676b', '&:hover': { color: isRecording ? '#ff4444' : '#1877f2' } }}
          >
            <Mic />
          </IconButton>
          <TextField
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Aa"
            fullWidth
            variant="outlined"
            disabled={!selectedConversationId || files.length > 0 || selectedConversation?.blocked || isRecording}
            sx={{
              mr: 1,
              '& .MuiOutlinedInput-root': {
                borderRadius: '20px',
                bgcolor: '#f0f2f5',
                '& fieldset': { border: 'none' },
                '&:hover fieldset': { border: 'none' },
                '&.Mui-focused fieldset': { border: 'none' },
              },
              '& .MuiInputBase-input': { py: 1.2, color: '#050505', fontSize: '15px' },
            }}
          />
          <IconButton
            onClick={() => setShowEmojiPicker((prev) => !prev)}
            disabled={!selectedConversationId || files.length > 0 || selectedConversation?.blocked || isRecording}
            sx={{ color: '#65676b', '&:hover': { color: '#1877f2' } }}
          >
            <SentimentSatisfiedAlt />
          </IconButton>
          {showSendIcon ? (
            <Button
              onClick={sendMessage}
              disabled={!selectedConversationId || (!newMessage.trim() && files.length === 0 && !audioBlob) || selectedConversation?.blocked}
              sx={{ minWidth: 0, p: 1, color: '#0084ff', '&:hover': { bgcolor: 'transparent', color: '#1877f2' }, '&:disabled': { color: '#b0b3b8' } }}
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
              </svg>
            </Button>
          ) : (
            <IconButton
              onClick={sendOkaySticker}
              disabled={!selectedConversationId || selectedConversation?.blocked || isRecording}
              sx={{ color: '#0084ff', '&:hover': { color: '#1877f2' }, '&:disabled': { color: '#b0b3b8' } }}
            >
              <ThumbUp />
            </IconButton>
          )}
          {showEmojiPicker && (
            <Box sx={{ position: 'absolute', bottom: '60px', right: '20px', zIndex: 1000 }}>
              <Picker onEmojiClick={onEmojiClick} />
            </Box>
          )}
        </Box>
      </Box>
    </Box>
  );
};

export default MessengerPage;