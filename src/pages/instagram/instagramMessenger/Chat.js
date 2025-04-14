import React, { useState, useEffect, useRef } from 'react';
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
} from '@mui/material';
import {
  Search,
  Send,
  ArrowBack,
  PhotoCamera,
  Mic,
  Stop,
  Favorite,
  MoreVert,
} from '@mui/icons-material';
import connectToSignalR from '../../../utils/signalR/signalR';
import { apiFetch } from '../../../api/instagram/chat/api'; // Adjusted path based on your snippet
import { cookies } from '../../../utils/cookie'; // Ensure this path is correct

const InstagramMessengerPage = () => {
  // State management
  const [conversations, setConversations] = useState([]);
  const [selectedConversationId, setSelectedConversationId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [conversationSearchQuery, setConversationSearchQuery] = useState('');
  const [files, setFiles] = useState([]);
  const [filePreviews, setFilePreviews] = useState([]);
  const [audioBlob, setAudioBlob] = useState(null);
  const [isRecording, setIsRecording] = useState(false);
  const [error, setError] = useState('');
  const [errorModalOpen, setErrorModalOpen] = useState(false);
  const [otnModalOpen, setOtnModalOpen] = useState(false);
  const [menuAnchorEl, setMenuAnchorEl] = useState(null);
  const [selectedMessageId, setSelectedMessageId] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);
  const mediaRecorderRef = useRef(null);

  // Selected conversation
  const selectedConversation = conversations.find(
    (c) => c.id === selectedConversationId
  );

  // Scroll to bottom of messages
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // SignalR setup
  useEffect(() => {
    const handleMessageReceived = (message) => {
      if (message.conversationId === selectedConversationId) {
        setMessages((prev) => [...prev, {
          id: message.mid,
          conversationId: message.conversationId,
          senderId: message.senderId,
          text: message.text,
          media: message.urls ? message.urls.map((url) => ({
            type: url.includes('video') ? 'video' : 'image',
            url,
            name: url.split('/').pop(),
          })) : null,
          audioUrl: message.messageType === 'Audio' ? message.urls?.[0] : null,
          timestamp: message.timestamp,
          direction: message.direction.toLowerCase(),
          type: message.messageType.toLowerCase(),
          reactions: [],
          status: message.status.toLowerCase(),
        }]);
        scrollToBottom();
      }
    };

    const connection = connectToSignalR(handleMessageReceived);

    return () => {
      connection.stop();
    };
  }, [selectedConversationId]);

  // Fetch conversations
  useEffect(() => {
    const fetchConversations = async () => {
      setIsLoading(true);
      try {
        const response = await apiFetch(
          `/api/InstagramMessenger/conversations?page=1&pageSize=20&search=${encodeURIComponent(conversationSearchQuery)}`,
          { method: 'GET' }
        );
        setConversations(response.data.map((conv) => ({
          id: conv.id,
          name: conv.name,
          profilePicture: conv.profilePicture || 'https://via.placeholder.com/40',
          lastMessage: { text: conv.lastMessage?.text || '', timestamp: conv.lastMessage?.timestamp || new Date().toISOString() },
          unviewedCount: conv.unviewedCount,
          senderId: conv.senderId, // Added for OTN and messaging
        })));
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
          setMessages(response.messages.map((msg) => ({
            id: msg.id,
            conversationId: selectedConversationId,
            senderId: msg.senderId,
            text: msg.text,
            media: msg.url ? [{
              type: msg.messageType.toLowerCase() === 'image' ? 'image' : 'video',
              url: msg.url,
              name: msg.url.split('/').pop(),
            }] : null,
            audioUrl: msg.messageType.toLowerCase() === 'audio' ? msg.url : null,
            timestamp: msg.timestamp,
            direction: msg.direction.toLowerCase(),
            type: msg.messageType.toLowerCase(),
            reactions: msg.reactions || [],
            status: msg.status.toLowerCase(),
          })));
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

  // Handle conversation click
  const handleConversationClick = (id) => {
    setSelectedConversationId(id);
    setNewMessage('');
    setFiles([]);
    setFilePreviews([]);
    setAudioBlob(null);
  };

  // Handle file upload
  const handleFileChange = (event) => {
    const selectedFiles = Array.from(event.target.files);
    const validFiles = selectedFiles.filter((file) =>
      file.type.startsWith('image/') || file.type.startsWith('video/')
    );
    if (validFiles.length > 0) {
      setFiles(validFiles);
      setFilePreviews(
        validFiles.map((file) => ({
          type: file.type.startsWith('image/') ? 'image' : 'video',
          url: URL.createObjectURL(file),
          name: file.name,
        }))
      );
    } else {
      setError('Only images and videos are supported.');
      setErrorModalOpen(true);
    }
  };

  // Handle voice recording
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
    } catch (err) {
      setError('Failed to start recording: ' + err.message);
      setErrorModalOpen(true);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  // Send message
  const sendMessage = async () => {
    if (!newMessage.trim() && files.length === 0 && !audioBlob) return;
    if (!selectedConversation) return;

    const tempId = Date.now().toString();
    const messageType = audioBlob ? 'Audio' : files.length > 0 ? 'Image' : 'Text';
    let urls = [];

    // Upload files if any
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

    // Upload audio if present
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

    // Optimistic UI update
    setMessages((prev) => [
      ...prev,
      {
        id: null,
        tempId,
        conversationId: selectedConversationId,
        senderId: cookies.get('userId') || 'user1', // Use userId from cookies or fallback
        text: newMessage,
        media: urls.length > 0 ? urls.map((url) => ({
          type: messageType.toLowerCase() === 'image' ? 'image' : 'video',
          url,
          name: url.split('/').pop(),
        })) : null,
        audioUrl: messageType === 'Audio' ? urls[0] : null,
        timestamp: new Date().toISOString(),
        status: 'sending',
        type: messageType.toLowerCase(),
        direction: 'outbound',
      },
    ]);
    scrollToBottom();

    try {
      const response = await apiFetch('/api/InstagramMessenger/send-message', {
        method: 'POST',
        body: JSON.stringify({
          conversationId: selectedConversationId,
          senderId: cookies.get('userId') || 'user1', // Use userId from cookies or fallback
          recipientId: selectedConversation.senderId,
          text: newMessage,
          urls: urls,
          messageType: messageType,
          tempId: tempId,
        }),
      });
      setMessages((prev) =>
        prev.map((msg) =>
          msg.tempId === tempId ? { ...msg, status: 'sent', id: response.messageId } : msg
        )
      );
      setNewMessage('');
      setFiles([]);
      setFilePreviews([]);
      setAudioBlob(null);
    } catch (err) {
      setMessages((prev) =>
        prev.map((msg) =>
          msg.tempId === tempId ? { ...msg, status: 'failed' } : msg
        )
      );
      setError('Failed to send message: ' + err.message);
      setErrorModalOpen(true);
    }
  };

  // Handle reaction
  const handleReact = async (messageId, reaction) => {
    try {
      await apiFetch('/api/InstagramMessenger/react', {
        method: 'POST',
        body: JSON.stringify({
          messageId,
          reaction,
        }),
      });
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === messageId
            ? { ...msg, reactions: [...(msg.reactions || []), reaction] }
            : msg
        )
      );
      setMenuAnchorEl(null);
    } catch (err) {
      setError('Failed to send reaction: ' + err.message);
      setErrorModalOpen(true);
    }
  };

  // Open message menu
  const handleMessageMenuOpen = (event, messageId) => {
    setMenuAnchorEl(event.currentTarget);
    setSelectedMessageId(messageId);
  };

  // Close message menu
  const handleMessageMenuClose = () => {
    setMenuAnchorEl(null);
    setSelectedMessageId(null);
  };

  // Handle OTN request
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

  // Search conversations
  const handleSearch = (query) => {
    setConversationSearchQuery(query);
  };

  return (
    <Box
      sx={{
        display: 'flex',
        height: '100vh',
        flexDirection: { xs: 'column', sm: 'row' },
        bgcolor: '#fafafa',
        fontFamily: '"Instagram Sans", -apple-system, BlinkMacSystemFont, sans-serif',
      }}
    >
      {/* Conversation List */}
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
          sx={{ fontWeight: 700, color: '#262626', mb: 2, pl: 1 }}
        >
          Messages
        </Typography>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <InputBase
            placeholder="Search messages..."
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
          <IconButton sx={{ ml: 1, color: '#8e8e8e', '&:hover': { color: '#0095f6' } }}>
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
                  '&:hover': { bgcolor: '#f5f5f5' },
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

      {/* Chat Area */}
      <Box
        sx={{
          flexGrow: 1,
          display: { xs: selectedConversationId ? 'flex' : 'none', sm: 'flex' },
          flexDirection: 'column',
          bgcolor: '#fff',
        }}
      >
        {/* Header */}
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
            sx={{ fontWeight: 700, color: '#262626', flexGrow: 1 }}
          >
            {selectedConversation?.name || 'Select a conversation'}
          </Typography>
        </Box>

        {/* Messages */}
        <Box sx={{ flexGrow: 1, overflowY: 'auto', p: 3, bgcolor: '#fff' }}>
          {isLoading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
              <CircularProgress size={24} sx={{ color: '#0095f6' }} />
            </Box>
          ) : messages.length === 0 ? (
            <Typography
              sx={{ textAlign: 'center', color: '#8e8e8e', mt: 4 }}
            >
              No messages yet.
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
                    {msg.type === 'text' && msg.text}
                    {msg.type === 'media' &&
                      msg.media?.map((media, index) => (
                        <Box key={index} sx={{ mt: 1 }}>
                          {media.type === 'image' ? (
                            <img
                              src={media.url}
                              alt={media.name}
                              style={{
                                maxWidth: '100%',
                                borderRadius: '10px',
                              }}
                            />
                          ) : (
                            <video
                              src={media.url}
                              controls
                              style={{
                                maxWidth: '100%',
                                borderRadius: '10px',
                              }}
                            />
                          )}
                        </Box>
                      ))}
                    {msg.type === 'audio' && (
                      <audio
                        src={msg.audioUrl}
                        controls
                        style={{ maxWidth: '100%' }}
                      />
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

        {/* Message Input */}
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
                        right: 0,
                        bgcolor: '#fff',
                        '&:hover': { bgcolor: '#ddd' },
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
              <IconButton
                component="label"
                sx={{ color: '#0095f6', mr: 1 }}
              >
                <PhotoCamera />
                <input
                  type="file"
                  hidden
                  multiple
                  accept="image/*,video/*"
                  onChange={handleFileChange}
                />
              </IconButton>
              <IconButton
                onClick={isRecording ? stopRecording : startRecording}
                sx={{ color: '#0095f6', mr: 1 }}
              >
                {isRecording ? <Stop /> : <Mic />}
              </IconButton>
              <TextField
                placeholder="Message..."
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
                onClick={sendMessage}
                sx={{ color: '#0095f6' }}
                disabled={!newMessage.trim() && files.length === 0 && !audioBlob}
              >
                <Send />
              </IconButton>
            </Box>
          </Box>
        )}
      </Box>

      {/* Message Menu */}
      <Menu
        anchorEl={menuAnchorEl}
        open={Boolean(menuAnchorEl)}
        onClose={handleMessageMenuClose}
        PaperProps={{
          sx: { borderRadius: '10px', boxShadow: '0 2px 8px rgba(0,0,0,0.15)' },
        }}
      >
        <MenuItem onClick={() => handleReact(selectedMessageId, '❤️')}>
          Heart
        </MenuItem>
        <MenuItem onClick={() => handleReact(selectedMessageId, '😂')}>
          Laugh
        </MenuItem>
        <MenuItem onClick={() => setOtnModalOpen(true)}>
          Request OTN
        </MenuItem>
      </Menu>

      {/* Error Modal */}
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
            Error
          </Typography>
          <Typography sx={{ mb: 3, color: '#444' }}>
            {error}
          </Typography>
          <Box sx={{ display: 'flex', justifyContent: 'center' }}>
            <IconButton
              onClick={() => setErrorModalOpen(false)}
              sx={{
                bgcolor: '#0095f6',
                color: '#fff',
                '&:hover': { bgcolor: '#007bb5' },
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

      {/* OTN Modal */}
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
                '&:hover': { bgcolor: '#dbdbdb' },
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
                '&:hover': { bgcolor: '#007bb5' },
              }}
            >
              <Favorite />
            </IconButton>
          </Box>
        </Box>
      </Modal>
    </Box>
  );
};

export default InstagramMessengerPage;