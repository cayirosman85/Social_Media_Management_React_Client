import React, { useEffect, useState, useRef } from 'react';
import { Typography, TextField, Button, Box, List, ListItem, ListItemText, IconButton, Menu, MenuItem, Modal, Avatar, CircularProgress } from '@mui/material';
import * as signalR from '@microsoft/signalr';
import { useNavigate } from 'react-router-dom';
import localStorage from 'local-storage';
import { AttachFile, SentimentSatisfiedAlt, ArrowDropDown, Close } from '@mui/icons-material';
import Picker from 'emoji-picker-react';

const MessengerPage = () => {
  const [conversations, setConversations] = useState([]);
  const [selectedConversationId, setSelectedConversationId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [file, setFile] = useState(null);
  const [filePreview, setFilePreview] = useState(null);
  const [connection, setConnection] = useState(null);
  const [error, setError] = useState(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [anchorElMessage, setAnchorElMessage] = useState(null);
  const [anchorElConversation, setAnchorElConversation] = useState(null);
  const [selectedMessageId, setSelectedMessageId] = useState(null);
  const [selectedConversationIdForMenu, setSelectedConversationIdForMenu] = useState(null);
  const [openModal, setOpenModal] = useState(false);
  const [modalMedia, setModalMedia] = useState({ type: '', url: '' });
  const [hoveredMessageId, setHoveredMessageId] = useState(null);
  const [page, setPage] = useState(1);
  const [totalMessages, setTotalMessages] = useState(0);
  const [showLoadMore, setShowLoadMore] = useState(false);
  const messagesEndRef = useRef(null);
  const messagesContainerRef = useRef(null);
  const navigate = useNavigate();

  // Check if logged in
  useEffect(() => {
    const userId = localStorage.get('messengerUserId');
    const accessToken = localStorage.get('messengerAccessToken');
    if (!userId || !accessToken) {
      setError('Please log in to access the Messenger chat.');
      navigate('/MessengerLogin');
    }
  }, [navigate]);

  // Setup SignalR Connection
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
        setMessages((prev) => {
          // Replace the temporary "sending" message with the actual message
          const updatedMessages = prev.map((msg) =>
            msg.tempId === message.tempId ? { ...message, status: 'sent' } : msg
          );
          // If the message wasn't in the list (e.g., sent from another client), add it
          if (!updatedMessages.some((msg) => msg.tempId === message.tempId)) {
            updatedMessages.push({ ...message, status: 'sent' });
          }
          return updatedMessages;
        });
        setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
      }
    });

    newConnection.on('MessageDeleted', (data) => {
      if (data.conversationId === selectedConversationId) {
        setMessages((prev) => prev.filter((msg) => msg.id !== data.messageId));
      }
    });

    newConnection.on('Conversation className="ConversationDeleted', (data) => {
      setConversations((prev) => prev.filter((conv) => conv.id !== data.conversationId));
      if (selectedConversationId === data.conversationId) {
        setSelectedConversationId(null);
        setMessages([]);
      }
    });

    return () => newConnection.stop();
  }, [selectedConversationId]);

  // Fetch Conversations
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

  // Fetch Messages for Selected Conversation with Pagination
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
      const fetchedMessages = data.messages || [];
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

  // Fetch messages when a conversation is selected
  useEffect(() => {
    setPage(1);
    setMessages([]);
    fetchMessages(1);
  }, [selectedConversationId]);

  // Handle scroll to show "Load More" button
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

  // Load more messages when the "Load More" button is clicked
  const loadMoreMessages = () => {
    const nextPage = page + 1;
    setPage(nextPage);
    fetchMessages(nextPage, true);
  };

  // Handle file upload and preview
  const handleFileChange = (event) => {
    const selectedFile = event.target.files[0];
    if (selectedFile) {
      setFile(selectedFile);
      setNewMessage('');
      const previewUrl = URL.createObjectURL(selectedFile);
      setFilePreview({
        type: selectedFile.type.startsWith('image/') ? 'Image' : selectedFile.type.startsWith('video/') ? 'Video' : 'Document',
        url: previewUrl,
        name: selectedFile.name,
      });
    }
  };

  const removeFile = () => {
    if (filePreview?.url) URL.revokeObjectURL(filePreview.url);
    setFile(null);
    setFilePreview(null);
  };

  // Handle emoji selection
  const onEmojiClick = (emojiObject) => {
    setNewMessage((prev) => prev + emojiObject.emoji);
    setShowEmojiPicker(false);
  };

  // Send Message
  const sendMessage = async () => {
    if ((!newMessage.trim() && !file) || !connection || !selectedConversationId) return;
    const selectedConversation = conversations.find((c) => c.id === selectedConversationId);
    if (!selectedConversation) return;

    // Generate a temporary ID for the message
    const tempId = Date.now().toString() + Math.random().toString(36).substr(2, 9);

    // Add a temporary "sending" message to the chat
    const tempMessage = {
      tempId,
      conversationId: selectedConversationId,
      senderId: "576837692181131",
      recipientId: selectedConversation.senderId,
      text: file ? null : newMessage,
      url: file ? URL.createObjectURL(file) : null,
      messageType: file
        ? file.type.startsWith('image/')
          ? 'Image'
          : file.type.startsWith('video/')
          ? 'Video'
          : 'Document'
        : 'Text',
      timestamp: new Date().toISOString(),
      direction: 'Outbound',
      status: 'sending', // Add status to indicate the message is being sent
    };

    setMessages((prev) => [...prev, tempMessage]);
    setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);

    try {
      let request;
      if (file) {
        const formData = new FormData();
        formData.append('file', file);
        const uploadResponse = await fetch('https://localhost:7099/api/messenger/upload-file', {
          method: 'POST',
          body: formData,
          credentials: 'include',
        });
        const uploadData = await uploadResponse.json();
        const fileUrl = uploadData.url;
        request = {
          conversationId: selectedConversationId,
          senderId: "576837692181131",
          recipientId: selectedConversation.senderId,
          text: null,
          url: fileUrl,
          messageType: file.type.startsWith('image/') ? 'Image' : file.type.startsWith('video/') ? 'Video' : 'Document',
          tempId, // Include tempId to match with the temporary message
        };
      } else {
        request = {
          conversationId: selectedConversationId,
          senderId: "576837692181131",
          recipientId: selectedConversation.senderId,
          text: newMessage,
          url: null,
          messageType: "Text",
          tempId, // Include tempId to match with the temporary message
        };
      }

      const response = await fetch('https://localhost:7099/api/messenger/send-message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(request),
        credentials: 'include',
      });

      const data = await response.json();
      if (response.ok) {
        // Update the temporary message to "sent" status (SignalR will handle the actual message update)
        setMessages((prev) =>
          prev.map((msg) =>
            msg.tempId === tempId ? { ...msg, status: 'sent' } : msg
          )
        );
        setNewMessage('');
        setFile(null);
        setFilePreview(null);
      } else {
        // Update the temporary message to "failed" status
        setMessages((prev) =>
          prev.map((msg) =>
            msg.tempId === tempId ? { ...msg, status: 'failed' } : msg
          )
        );
        setError('Failed to send message: ' + (data.error || 'Unknown error'));
      }
    } catch (error) {
      // Update the temporary message to "failed" status
      setMessages((prev) =>
        prev.map((msg) =>
          msg.tempId === tempId ? { ...msg, status: 'failed' } : msg
        )
      );
      setError('Failed to send message: ' + error.message);
    }
  };

  // Delete Message
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

  // Delete Conversation
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

  // Dropdown Menu Handlers
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

  // Modal Handlers
  const handleOpenModal = (type, url) => {
    setModalMedia({ type, url });
    setOpenModal(true);
  };
  const handleCloseModal = () => {
    setOpenModal(false);
    setModalMedia({ type: '', url: '' });
  };

  // Get the selected conversation's name for use in the message list
  const selectedConversation = conversations.find((c) => c.id === selectedConversationId);
  const userName = selectedConversation?.name || '?';

  return (
    <Box sx={{ display: 'flex', height: '100vh', bgcolor: '#f0f2f5', fontFamily: '"Segoe UI", Roboto, sans-serif' }}>
      {/* Conversation List */}
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
                <Avatar sx={{ mr: 2, bgcolor: '#ddd' }}>{conv.name[0]}</Avatar>
                <ListItemText
                  primary={conv.name}
                  primaryTypographyProps={{ fontSize: '16px', fontWeight: 500, color: '#050505' }}
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
              </Menu>
            </Box>
          ))}
        </List>
      </Box>

      {/* Chatbox */}
      <Box sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', bgcolor: '#fff' }}>
        {/* Header */}
        <Box sx={{ p: 2, borderBottom: '1px solid #e5e5e5', display: 'flex', alignItems: 'center' }}>
          <Avatar sx={{ mr: 2, bgcolor: '#ddd' }}>{userName[0]}</Avatar>
          <Typography variant="h6" sx={{ fontWeight: 600, color: '#050505' }}>
            {selectedConversation?.name || 'Select a chat'}
          </Typography>
        </Box>

        {/* Messages */}
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
          {/* Load More Button */}
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
              onMouseEnter={() => setHoveredMessageId(msg.id || msg.tempId)}
              onMouseLeave={() => setHoveredMessageId(null)}
            >
              <Box sx={{ maxWidth: '60%', display: 'flex', alignItems: 'flex-start' }}>
                {msg.direction === 'Inbound' && (
                  <Avatar sx={{ mr: 1, bgcolor: '#ddd', width: 32, height: 32 }}>{userName[0]}</Avatar>
                )}
                <Box sx={{ position: 'relative' }}>
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
                      ) : msg.messageType === 'Image' ? (
                        <Box
                          sx={{
                            p: 0.5,
                            bgcolor: msg.direction === 'Outbound' ? '#0084ff' : '#e9ecef',
                            borderRadius: '10px',
                            cursor: 'pointer',
                          }}
                          onClick={() => handleOpenModal('Image', msg.url)}
                        >
                          <img src={msg.url} alt="Sent image" style={{ maxWidth: '200px', borderRadius: '8px' }} />
                        </Box>
                      ) : msg.messageType === 'Video' ? (
                        <Box
                          sx={{
                            p: 0.5,
                            bgcolor: msg.direction === 'Outbound' ? '#0084ff' : '#e9ecef',
                            borderRadius: '10px',
                            cursor: 'pointer',
                          }}
                          onClick={() => handleOpenModal('Video', msg.url)}
                        >
                          <video src={msg.url} style={{ maxWidth: '200px', borderRadius: '8px' }} controls />
                        </Box>
                      ) : msg.messageType === 'Document' ? (
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
                          <a href={msg.url} target="_blank" rel="noopener noreferrer" style={{ color: 'inherit' }}>
                            Document
                          </a>
                        </Typography>
                      ) : null}
                    </>
                  )}
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
                    {new Date(msg.timestamp).toLocaleTimeString('en-US', { hour: 'numeric', minute: 'numeric', hour12: true })}
                  </Typography>
                  {msg.direction === 'Outbound' && (msg.status === 'sent' || !msg.status) && hoveredMessageId === (msg.id || msg.tempId) && (
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
              </Menu>
            </Box>
          ))}
          <div ref={messagesEndRef} />
        </Box>

        {/* Media Modal */}
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

        {/* File Preview */}
        {filePreview && (
          <Box sx={{ p: 2, bgcolor: '#fff', borderTop: '1px solid #e5e5e5', display: 'flex', alignItems: 'center' }}>
            {filePreview.type === 'Image' ? (
              <img src={filePreview.url} alt="Preview" style={{ maxWidth: '80px', borderRadius: '8px', mr: 2 }} />
            ) : filePreview.type === 'Video' ? (
              <video src={filePreview.url} style={{ maxWidth: '80px', borderRadius: '8px', mr: 2 }} controls />
            ) : (
              <Typography sx={{ mr: 2, color: '#050505' }}>{filePreview.name}</Typography>
            )}
            <IconButton onClick={removeFile} sx={{ color: '#d93025' }}>
              <Close />
            </IconButton>
          </Box>
        )}

        {/* Input */}
        <Box sx={{ p: 2, bgcolor: '#fff', borderTop: '1px solid #e5e5e5', display: 'flex', alignItems: 'center' }}>
          <IconButton component="label" sx={{ color: '#65676b', '&:hover': { color: '#1877f2' } }}>
            <AttachFile />
            <input type="file" hidden accept="image/*,video/*,application/pdf" onChange={handleFileChange} />
          </IconButton>
          <TextField
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Aa"
            fullWidth
            variant="outlined"
            disabled={!selectedConversationId || file}
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
            disabled={!selectedConversationId || file}
            sx={{ color: '#65676b', '&:hover': { color: '#1877f2' } }}
          >
            <SentimentSatisfiedAlt />
          </IconButton>
          <Button
            onClick={sendMessage}
            disabled={!selectedConversationId || (!newMessage.trim() && !file)}
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