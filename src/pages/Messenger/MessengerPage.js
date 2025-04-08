import React, { useEffect, useState, useRef } from 'react';
import { Typography, TextField, Button, Box, List, ListItem, ListItemText, IconButton, Menu, MenuItem, Modal, Avatar, CircularProgress } from '@mui/material';
import { Check, DoneAll, AttachFile, SentimentSatisfiedAlt, ArrowDropDown, Close } from '@mui/icons-material';
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
  const messagesEndRef = useRef(null);
  const messagesContainerRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    const userId = localStorage.get('messengerUserId');
    const accessToken = localStorage.get('messengerAccessToken');
    if (!userId || !accessToken) {
      setError('Please log in to access the Messenger chat.');
      navigate('/MessengerLogin');
    }
  }, [navigate]);

  const fetchMessages = async (pageToFetch = 1, append = false) => {
    if (!selectedConversationId) return;
    try {
      const response = await fetch(
        `https://localhost:7099/api/messenger/conversation-messages/${selectedConversationId}?page=${pageToFetch}&pageSize=5`,
        { credentials: 'include' }
      );
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`HTTP error! Status: ${response.status}, Message: ${errorData.Error || 'Unknown error'}`);
      }
      const data = await response.json();
      console.log('Fetched messages:', data);

      const fetchedMessages = (data.messages || []).map(msg => {
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

      setTotalMessages(data.totalMessages || 0);

      if (append) {
        setMessages((prev) => [...fetchedMessages, ...prev]);
      } else {
        setMessages(fetchedMessages);
        setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
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
        console.log('Received message via SignalR:', message);
        fetchMessages(1);
      }
    });

    newConnection.on('MessageStatusUpdated', (data) => {
      if (data.conversationId === selectedConversationId) {
        console.log('Message status updated via SignalR:', data);
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
  }, [selectedConversationId]);

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
  };

  const onEmojiClick = (emojiObject) => {
    setNewMessage((prev) => prev + emojiObject.emoji);
    setShowEmojiPicker(false);
  };

  const handleReply = (message) => {
    console.log('Replying to message:', message);
    setReplyingTo(message);
    handleCloseMessageMenu();
  };

  const sendMessage = async () => {
    if ((!newMessage.trim() && files.length === 0) || !connection || !selectedConversationId) return;
    const selectedConversation = conversations.find((c) => c.id === selectedConversationId);
    if (!selectedConversation) return;

    if (selectedConversation.blocked) {
      setError('Cannot send message: User is blocked');
      return;
    }

    const tempId = Date.now().toString() + Math.random().toString(36).substr(2, 9);
    const isImage = files.length > 0 && files.every(file => file.type.startsWith('image/'));
    const messageType = files.length > 0 ? (isImage ? 'Image' : files[0].type.startsWith('video/') ? 'Video' : 'Document') : 'Text';

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

    console.log('Temporary message with repliedId:', tempMessage);

    setMessages((prev) => [...prev, tempMessage]);
    setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);

    const timeoutId = setTimeout(() => {
      setMessages((prev) =>
        prev.map((msg) =>
          msg.tempId === tempId ? { ...msg, status: 'failed' } : msg
        )
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

      console.log('Sending request to backend:', request);

      const response = await fetch('https://localhost:7099/api/messenger/send-message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(request),
        credentials: 'include',
      });

      clearTimeout(timeoutId);
      const data = await response.json();
      console.log('Backend response:', data);

      if (response.ok) {
        setMessages((prev) =>
          prev.map((msg) =>
            msg.tempId === tempId ? { ...msg, status: 'Sent', id: data.MessageId, mid: data.FacebookMessageId, urls: request.urls } : msg
          )
        );
        setNewMessage('');
        setFiles([]);
        setFilePreviews([]);
        setReplyingTo(null);
      } else {
        setMessages((prev) =>
          prev.map((msg) =>
            msg.tempId === tempId ? { ...msg, status: 'failed' } : msg
          )
        );
        setError(`Failed to send ${messageType.toLowerCase()}: ${data.error || 'Unknown error'}`);
      }
    } catch (error) {
      clearTimeout(timeoutId);
      console.error('Error sending message:', error);
      setMessages((prev) =>
        prev.map((msg) =>
          msg.tempId === tempId ? { ...msg, status: 'failed' } : msg
        )
      );
      setError(`Failed to send ${messageType.toLowerCase()}: ${error.message}. If it’s a video or file, ensure it’s under 25 MB or share a link instead.`);
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
      .then(() => {
        console.log('Text copied to clipboard:', text);
        handleCloseMessageMenu();
      })
      .catch((err) => {
        console.error('Failed to copy text:', err);
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

  const selectedConversation = conversations.find((c) => c.id === selectedConversationId);
  const userName = selectedConversation?.name || '?';

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
                  transition: 'background-color 0.2s ease',
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

      <Box sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', bgcolor: '#fff' }}>
        <Box sx={{ p: 2, borderBottom: '1px solid #e5e5e5', display: 'flex', alignItems: 'center' }}>
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
                    <Box
                      sx={{
                        bgcolor: '#e9ecef',
                        p: 1,
                        borderRadius: '8px',
                        mb: 1,
                        fontSize: '13px',
                        color: '#65676b',
                      }}
                    >
                      {messages.find((m) => m.mid === msg.repliedId)?.text || 'Original message not found'}
                    </Box>
                  )}
                  {msg.status === 'sending' ? (
                    <Box
                      sx={{
                        bgcolor: '#0084ff',
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
                    <Box
                      sx={{
                        bgcolor: '#d93025',
                        color: '#fff',
                        p: 1.5,
                        borderRadius: '10px',
                      }}
                    >
                      <Typography sx={{ fontSize: '15px' }}>Failed to send</Typography>
                    </Box>
                  ) : (
                    <>
                      {msg.messageType === 'Text' ? (
                        <Typography
                          sx={{
                            bgcolor: msg.direction === 'Outbound' ? '#0084ff' : '#e9ecef',
                            color: msg.direction === 'Outbound' ? '#fff' : '#050505',
                            p: 1.5,
                            borderRadius: '10px',
                            wordBreak: 'break-word',
                            fontSize: '15px',
                            position: 'relative',
                            zIndex: 1,
                          }}
                        >
                          {msg.text}
                        </Typography>
                      ) : msg.messageType === 'Image' && msg.urls ? (
                        <Box
                          sx={{
                            p: 0.5,
                            bgcolor: msg.direction === 'Outbound' ? '#0084ff' : '#e9ecef',
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
                              <img src={url} alt={`Sent image ${index}`} style={{ maxWidth: '100px', borderRadius: '8px' }} />
                            </Box>
                          ))}
                        </Box>
                      ) : msg.messageType === 'Video' && msg.urls ? (
                        <Box
                          sx={{
                            p: 0.5,
                            bgcolor: msg.direction === 'Outbound' ? '#0084ff' : '#e9ecef',
                            borderRadius: '10px',
                            cursor: 'pointer',
                          }}
                          onClick={() => handleOpenModal('Video', msg.urls[0])}
                        >
                          <video src={msg.urls[0]} style={{ maxWidth: '200px', borderRadius: '8px' }} controls />
                        </Box>
                      ) : msg.messageType === 'Document' && msg.urls ? (
                        <Typography
                          sx={{
                            bgcolor: msg.direction === 'Outbound' ? '#0084ff' : '#e9ecef',
                            color: msg.direction === 'Outbound' ? '#fff' : '#050505',
                            p: 1.5,
                            borderRadius: '10px',
                            fontSize: '15px',
                            position: 'relative',
                            zIndex: 1,
                          }}
                        >
                          <a href={msg.urls[0]} target="_blank" rel="noopener noreferrer" style={{ color: 'inherit' }}>
                            Document
                          </a>
                        </Typography>
                      ) : null}
                    </>
                  )}
                  {/* Always show timestamp */}
                  <Typography
                    sx={{
                      position: 'absolute',
                      bottom: '-16px',
                      right: msg.direction === 'Outbound' && msg.status !== 'sending' && msg.status !== 'failed' ? '40px' : '0',
                      fontSize: '12px',
                      color: '#65676b',
                      zIndex: 0,
                    }}
                  >
                    {msg.timestamp
                      ? new Date(msg.timestamp).toLocaleTimeString('en-US', { hour: 'numeric', minute: 'numeric', hour12: true })
                      : 'Time unavailable'}
                  </Typography>
                  {/* Status icons for outbound messages */}
                  {msg.direction === 'Outbound' && msg.status !== 'sending' && msg.status !== 'failed' && (
                    <Typography
                      sx={{
                        position: 'absolute',
                        bottom: '-16px',
                        right: '0',
                        fontSize: '12px',
                        color: '#65676b',
                        zIndex: 0,
                      }}
                    >
                      {msg.status === 'Read' ? (
                        <DoneAll sx={{ fontSize: '16px', color: '#0084ff' }} />
                      ) : msg.status === 'Delivered' ? (
                        <DoneAll sx={{ fontSize: '16px', color: '#65676b' }} />
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
                        top: '-18px',
                        right: '-18px',
                        color: '#65676b',
                        '&:hover': { color: '#1877f2' },
                        zIndex: 2,
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
                anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
                transformOrigin={{ vertical: 'top', horizontal: 'right' }}
              >
                {msg.direction === 'Outbound' && <MenuItem onClick={() => deleteMessage(msg.id)}>Delete</MenuItem>}
                {msg.direction === 'Inbound' && <MenuItem onClick={() => handleReply(msg)}>Reply</MenuItem>}
                {(msg.messageType === 'Document' || msg.messageType === 'Video') && msg.urls && (
                  <MenuItem onClick={() => handleDownload(msg.urls[0])}>Download</MenuItem>
                )}
                {msg.messageType === 'Text' && msg.text && (
                  <MenuItem onClick={() => handleCopy(msg.text)}>Copy</MenuItem>
                )}
              </Menu>
            </Box>
          ))}
          <div ref={messagesEndRef} />
        </Box>

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

        <Box sx={{ p: 2, bgcolor: '#fff', borderTop: '1px solid #e5e5e5', display: 'flex', alignItems: 'center' }}>
          <IconButton component="label" sx={{ color: '#65676b', '&:hover': { color: '#1877f2' } }}>
            <AttachFile />
            <input type="file" hidden multiple accept="image/*,video/*,application/pdf" onChange={handleFileChange} />
          </IconButton>
          <TextField
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Aa"
            fullWidth
            variant="outlined"
            disabled={!selectedConversationId || files.length > 0 || selectedConversation?.blocked}
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
            disabled={!selectedConversationId || files.length > 0 || selectedConversation?.blocked}
            sx={{ color: '#65676b', '&:hover': { color: '#1877f2' } }}
          >
            <SentimentSatisfiedAlt />
          </IconButton>
          <Button
            onClick={sendMessage}
            disabled={!selectedConversationId || (!newMessage.trim() && files.length === 0) || selectedConversation?.blocked}
            sx={{
              minWidth: 0,
              p: 1,
              color: '#0084ff',
              '&:hover': { bgcolor: 'transparent', color: '#1877f2' },
              '&:disabled': { color: '#b0b3b8' },
            }}
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
              <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
            </svg>
          </Button>
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