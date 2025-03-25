import React, { useState } from 'react';
import {
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Typography,
  Divider,
  Avatar,
} from '@mui/material';
import {
  YouTube,
  Home as HomeIcon,
  VideoLibrary as ShortsIcon,
  Subscriptions as SubscriptionsIcon,
  History as HistoryIcon,
  PlaylistPlay as PlaylistIcon,
  VideoLibrary as YourVideosIcon,
  WatchLater as WatchLaterIcon,
  ThumbUp as LikedVideosIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

// Sample subscriptions data (replace with real data if available)
const subscriptions = [
  { name: 'Coskun Aral Anlatıyor', avatar: 'https://via.placeholder.com/24' },
  { name: 'Medyascope TV', avatar: 'https://via.placeholder.com/24' },
  { name: 'Fosig ERLIK', avatar: 'https://via.placeholder.com/24' },
  { name: 'Justin Stolpe', avatar: 'https://via.placeholder.com/24' },
];

const sidebarItems = [
  { text: 'Home', icon: <HomeIcon />, path: '/homepage' },
  { text: 'Shorts', icon: <ShortsIcon />, path: '/shorts' },
  { text: 'Subscriptions', icon: <SubscriptionsIcon />, path: '/subscriptions' },
  { text: 'You', header: true },
  { text: 'History', icon: <HistoryIcon />, path: '/history' },
  { text: 'Playlists', icon: <PlaylistIcon />, path: '/playlists' },
  { text: 'Your videos', icon: <YourVideosIcon />, path: '/your-videos' },
  { text: 'Watch later', icon: <WatchLaterIcon />, path: '/watch-later' },
  { text: 'Liked videos', icon: <LikedVideosIcon />, path: '/liked-videos' },
];

const ProfileSidebar = () => {
  const navigate = useNavigate();
  const [isHovered, setIsHovered] = useState(false); // State to track hover

  const handleSidebarItemClick = (path) => {
    navigate(path);
  };

  // Determine the width based on isHovered
  const sidebarWidth = isHovered ? '240px' : '56px';

  return (
    <div
      style={{
        width: sidebarWidth,
        backgroundColor: '#fff',
        borderRight: '1px solid #e0e0e0',
        padding: isHovered ? '16px 0' : '16px 0',
        transition: 'width 0.3s ease', // Smooth transition for width
        overflow: 'hidden', // Hide content that overflows when collapsed
        position: 'relative', // For positioning hover effects
      }}
      onMouseEnter={() => setIsHovered(true)} // Expand on hover
      onMouseLeave={() => setIsHovered(false)} // Collapse when hover ends
    >
      {/* YouTube Header */}
      <div
        style={{
          padding: '16px',
          display: 'flex',
          alignItems: 'center',
          visibility: isHovered ? 'visible' : 'hidden', // Hide when collapsed
        }}
      >
        <YouTube style={{ color: '#FF0000', marginRight: '8px' }} />
        <Typography variant="h6" style={{ fontWeight: 'bold' }}>
          YouTube
        </Typography>
      </div>
      <Divider />

      {/* Sidebar Items */}
      <List>
        {sidebarItems.map((item, index) => {
          if (item.header) {
            return (
              <Typography
                key={index}
                variant="overline"
                style={{
                  paddingLeft: '16px',
                  paddingTop: '16px',
                  paddingBottom: '8px',
                  display: 'block',
                  color: '#606060',
                  fontWeight: 'bold',
                  visibility: isHovered ? 'visible' : 'hidden', // Hide when collapsed
                }}
              >
                {item.text}
              </Typography>
            );
          }
          return (
            <ListItem
              button
              key={item.text}
              onClick={() => handleSidebarItemClick(item.path)}
              style={{
                padding: isHovered ? '4px 16px' : '4px 8px', // Adjust padding when collapsed
              }}
              sx={{
                '&:hover': { backgroundColor: '#f2f2f2' },
              }}
            >
              <ListItemIcon
                style={{
                  minWidth: isHovered ? '40px' : '48px', // Center icon when collapsed
                  color: '#000',
                }}
              >
                {item.icon}
              </ListItemIcon>
              <ListItemText
                primary={item.text}
                primaryTypographyProps={{ fontSize: '14px', fontWeight: 'medium' }}
                style={{
                  display: isHovered ? 'block' : 'none', // Hide text when collapsed
                }}
              />
            </ListItem>
          );
        })}
      </List>
      <Divider />

      {/* Subscriptions Section */}
      <Typography
        variant="overline"
        style={{
          paddingLeft: '16px',
          paddingTop: '16px',
          paddingBottom: '8px',
          display: 'block',
          color: '#606060',
          fontWeight: 'bold',
          visibility: isHovered ? 'visible' : 'hidden', // Hide when collapsed
        }}
      >
        Subscriptions
      </Typography>
      <List>
        {subscriptions.map((sub, index) => (
          <ListItem
            button
            key={index}
            style={{
              padding: isHovered ? '4px 16px' : '4px 8px', // Adjust padding when collapsed
            }}
            sx={{
              '&:hover': { backgroundColor: '#f2f2f2' },
            }}
          >
            <ListItemIcon
              style={{
                minWidth: isHovered ? '40px' : '48px', // Center avatar when collapsed
              }}
            >
              <Avatar src={sub.avatar} style={{ width: '24px', height: '24px' }} />
            </ListItemIcon>
            <ListItemText
              primary={sub.name}
              primaryTypographyProps={{ fontSize: '14px', fontWeight: 'medium' }}
              style={{
                display: isHovered ? 'block' : 'none', // Hide text when collapsed
              }}
            />
          </ListItem>
        ))}
      </List>
    </div>
  );
};

export default ProfileSidebar;