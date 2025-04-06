import React, { useEffect, useState } from 'react';
import { Typography, TextField, Button, Box, List, ListItem, ListItemText } from '@mui/material';
import * as signalR from '@microsoft/signalr';
import { useNavigate } from 'react-router-dom';
import localStorage from 'local-storage';

const MessengerPage = () => {
  const [conversations, setConversations] = useState([]);
  const [selectedConversationId, setSelectedConversationId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [connection, setConnection] = useState(null);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  // Check if logged in
  useEffect(() => {
    const userId = localStorage.get('messengerUserId');
    const accessToken = localStorage.get('messengerAccessToken');
    console.log('Checking login - UserId:', userId, 'AccessToken:', accessToken);
    if (!userId || !accessToken) {
      setError('Please log in to access the Messenger chat.');
      navigate('/MessengerLogin');
    }
  }, [navigate]);

  // Setup SignalR Connection
  useEffect(() => {
    const newConnection = new signalR.HubConnectionBuilder()
      .withUrl('https://localhost:7099/messengerHub', {
        withCredentials: true,
        skipNegotiation: false,
      })
      .withAutomaticReconnect()
      .configureLogging(signalR.LogLevel.Information)
      .build();

    setConnection(newConnection);

    newConnection
      .start()
      .then(() => console.log('SignalR Connected'))
      .catch((err) => console.error('SignalR Connection Error:', err));

    newConnection.on('ReceiveMessage', (message) => {
      console.log('New Message Received:', message);
      if (message.conversationId === selectedConversationId) {
        setMessages((prevMessages) => [...prevMessages, message]);
      }
    });

    return () => {
      newConnection.stop();
    };
  }, [selectedConversationId]);

  // Fetch Conversations
  useEffect(() => {
    const fetchConversations = async () => {
      try {
        const response = await fetch('https://localhost:7099/api/messenger/conversations', {
          credentials: 'include',
        });
        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`);
        }
        const data = await response.json();
        console.log('Fetched Conversations:', data);
        setConversations(data);
        if (data.length > 0) {
          console.log('Setting initial conversationId:', data[0].id);
          setSelectedConversationId(data[0].id);
        }
      } catch (error) {
        console.error('Error fetching conversations:', error);
        setError('Failed to load conversations.');
      }
    };
    fetchConversations();
  }, []);

  // Fetch Messages for Selected Conversation
  useEffect(() => {
    const fetchMessages = async () => {
      if (!selectedConversationId) {
        console.log('No conversation selected yet');
        return;
      }

      try {
        console.log(`Fetching messages for conversationId: ${selectedConversationId}`);
        const response = await fetch(`https://localhost:7099/api/messenger/conversation-messages/${selectedConversationId}`, {
          credentials: 'include',
        });
        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`);
        }
        const data = await response.json();
        console.log('Fetched Messages:', data);
        setMessages(data.messages || []);
      } catch (error) {
        console.error('Error fetching messages:', error);
        setError('Failed to load messages: ' + error.message);
      }
    };
    fetchMessages();
  }, [selectedConversationId]);

  // Send Message via Backend
  const sendMessage = async () => {
    if (!newMessage.trim() || !connection || !selectedConversationId) return;

    const userId = localStorage.get('messengerUserId');
    const selectedConversation = conversations.find(c => c.id === selectedConversationId);

    if (!selectedConversation) {
      console.error('Selected conversation not found for id:', selectedConversationId);
      setError('Selected conversation not found.');
      return;
    }

    console.log('Sending message - UserId:', userId, 'RecipientId:', selectedConversation.senderId, 'Message:', newMessage);

    const request = {
      conversationId: selectedConversationId,
      senderId: "576837692181131", // Page ID as the sender
      recipientId: selectedConversation.senderId,
      text: newMessage,
    };

    try {
      const response = await fetch('https://localhost:7099/api/messenger/send-message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(request),
        credentials: 'include',
      });

      const data = await response.json();
      console.log('Message Sent Response:', data);

      if (!response.ok) {
        throw new Error(data.error || 'Failed to send message');
      }

      setNewMessage(''); // Clear input only on success (message is added via SignalR)
    } catch (error) {
      console.error('Error sending message:', error);
      setError('Failed to send message: ' + error.message);
    }
  };

  return (
    <Box sx={{ 
      display: 'flex', 
      height: '100vh', 
      bgcolor: '#f5f6fa', 
      overflow: 'hidden' 
    }}>
      {/* Conversation List */}
      <Box sx={{ 
        width: '30%', 
        bgcolor: '#ffffff', 
        boxShadow: '0 4px 12px rgba(0,0,0,0.1)', 
        borderRadius: '12px 0 0 12px', 
        overflowY: 'auto', 
        p: 2,
        transition: 'all 0.3s ease' 
      }}>
        <Typography 
          variant="h6" 
          sx={{ 
            fontWeight: 600, 
            color: '#2c3e50', 
            mb: 2, 
            borderBottom: '2px solid #3498db', 
            pb: 1 
          }}
        >
          Conversations
        </Typography>
        <List>
          {conversations.map((conv) => (
            <ListItem
              button
              key={conv.id}
              selected={selectedConversationId === conv.id}
              onClick={() => {
                console.log('Clicked conversation with id:', conv.id);
                setSelectedConversationId(conv.id);
              }}
              sx={{ 
                borderRadius: '8px', 
                mb: 1, 
                bgcolor: selectedConversationId === conv.id ? '#3498db' : 'transparent', 
                color: selectedConversationId === conv.id ? '#ffffff' : '#34495e', 
                '&:hover': { 
                  bgcolor: selectedConversationId === conv.id ? '#2980b9' : '#ecf0f1', 
                  transition: 'background-color 0.2s ease' 
                },
                py: 1.5 
              }}
            >
              <ListItemText 
                primary={conv.name} 
                primaryTypographyProps={{ 
                  fontWeight: selectedConversationId === conv.id ? 600 : 400, 
                  fontSize: '1rem' 
                }} 
              />
            </ListItem>
          ))}
        </List>
      </Box>

      {/* Chatbox */}
      <Box sx={{ 
        width: '70%', 
        p: 3, 
        display: 'flex', 
        flexDirection: 'column', 
        bgcolor: '#ffffff', 
        boxShadow: '0 4px 12px rgba(0,0,0,0.1)', 
        borderRadius: '0 12px 12px 0' 
      }}>
        <Typography 
          variant="h4" 
          sx={{ 
            fontWeight: 700, 
            color: '#2c3e50', 
            mb: 2, 
            letterSpacing: '-0.5px' 
          }}
        >
          {selectedConversationId ? `Chat with ${conversations.find(c => c.id === selectedConversationId)?.name || 'User'}` : 'Select a Conversation'}
        </Typography>
        {error && (
          <Typography 
            sx={{ 
              color: '#e74c3c', 
              mb: 2, 
              fontSize: '0.9rem', 
              bgcolor: '#ffebee', 
              p: 1, 
              borderRadius: '4px' 
            }}
          >
            {error}
          </Typography>
        )}
        <Box sx={{ 
          flexGrow: 1, 
          maxHeight: '70vh', 
          overflowY: 'auto', 
          mb: 2, 
          bgcolor: '#f9f9f9', 
          borderRadius: '8px', 
          p: 2, 
          boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.05)' 
        }}>
          {messages.map((msg, idx) => (
            <Box
              key={idx}
              sx={{
                display: 'flex',
                justifyContent: msg.direction === 'Outbound' ? 'flex-end' : 'flex-start',
                mb: 1.5
              }}
            >
              <Typography 
                sx={{ 
                  display: 'inline-block', 
                  bgcolor: msg.direction === 'Outbound' ? '#3498db' : '#ecf0f1', 
                  color: msg.direction === 'Outbound' ? '#ffffff' : '#2c3e50', 
                  p: 1.5, 
                  borderRadius: '12px', 
                  maxWidth: '70%', 
                  wordBreak: 'break-word', 
                  boxShadow: '0 2px 4px rgba(0,0,0,0.1)', 
                  transition: 'all 0.2s ease' 
                }}
              >
                <strong>{msg.direction === 'Outbound' ? 'You' : 'Them'}: </strong>
                {msg.text}
              </Typography>
            </Box>
          ))}
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <TextField
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type a message"
            fullWidth
            variant="outlined"
            disabled={!selectedConversationId}
            sx={{ 
              '& .MuiOutlinedInput-root': { 
                borderRadius: '20px', 
                bgcolor: '#ffffff', 
                boxShadow: '0 2px 4px rgba(0,0,0,0.05)', 
                '&:hover fieldset': { borderColor: '#3498db' }, 
                '&.Mui-focused fieldset': { borderColor: '#2980b9' } 
              },
              '& .MuiInputBase-input': { 
                py: 1.5, 
                color: '#2c3e50' 
              }
            }}
          />
          <Button
            onClick={sendMessage}
            variant="contained"
            color="primary"
            disabled={!selectedConversationId || !newMessage.trim()}
            sx={{ 
              borderRadius: '20px', 
              px: 4, 
              py: 1.5, 
              bgcolor: '#3498db', 
              '&:hover': { bgcolor: '#2980b9' }, 
              '&:disabled': { bgcolor: '#bdc3c7', cursor: 'not-allowed' }, 
              textTransform: 'none', 
              fontWeight: 600, 
              boxShadow: '0 4px 8px rgba(0,0,0,0.1)' 
            }}
          >
            Send
          </Button>
        </Box>
      </Box>
    </Box>
  );
};

export default MessengerPage;