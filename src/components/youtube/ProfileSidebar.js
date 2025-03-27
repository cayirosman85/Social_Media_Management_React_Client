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
const sidebarItems = [
  { text: 'Home', icon: <HomeIcon />, index: 0 },
  { text: 'Shorts', icon: <ShortsIcon />, index: 1 },
  { text: 'Subscriptions', icon: <SubscriptionsIcon />, index: 2 },
  { text: 'You', header: true },
  { text: 'History', icon: <HistoryIcon />, index: 3 },
  { text: 'Playlists', icon: <PlaylistIcon />, index: 4 },
  { text: 'Your videos', icon: <YourVideosIcon />, index: 5 },
  { text: 'Watch later', icon: <WatchLaterIcon />, index: 6 },
  { text: 'Liked videos', icon: <LikedVideosIcon />, index: 7 },
];
const ProfileSidebar = ({ subscriptions = [], onItemClick, onSubscriptionClick }) => {
  const [isHovered, setIsHovered] = useState(false);
  const sidebarWidth = isHovered ? '240px' : '56px';
  // Deduplicate subscriptions based on channelId
  const uniqueSubscriptions = Array.from(
    new Map(
      subscriptions.map((sub) => [sub.snippet.resourceId.channelId, sub])
    ).values()
  );
  return (
    <div
      style={{
        width: sidebarWidth,
        backgroundColor: '#fff',
        borderRight: '1px solid #e0e0e0',
        padding: '16px 0',
        transition: 'width 0.3s ease',
        overflow: 'hidden',
        position: 'relative',
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* YouTube Header */}
      <div
        style={{
          padding: '16px',
          display: 'flex',
          alignItems: 'center',
          visibility: isHovered ? 'visible' : 'hidden',
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
              visibility: isHovered ? 'visible' : 'hidden',
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
          onClick={() => {
            console.log(`Sidebar item clicked: ${item.text}, index: ${item.index}`);
            onItemClick(item.index);
          }}
          style={{
            padding: isHovered ? '4px 16px' : '4px 8px',
          }}
          sx={{ '&:hover': { backgroundColor: '#f2f2f2' } }}
        >
          <ListItemIcon
            style={{
              minWidth: isHovered ? '40px' : '48px',
              color: '#000',
            }}
          >
            {item.icon}
          </ListItemIcon>
          <ListItemText
            primary={item.text}
            primaryTypographyProps={{ fontSize: '14px', fontWeight: 'medium' }}
            style={{ display: isHovered ? 'block' : 'none' }}
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
      visibility: isHovered ? 'visible' : 'hidden',
    }}
  >
    Subscriptions
  </Typography>
  <List>
    {uniqueSubscriptions.map((sub, index) => (
      <ListItem
        button
        key={`${sub.snippet.resourceId.channelId}-${index}`}
        onClick={() => {
          console.log(`Subscription clicked: ${sub.snippet.title}, channelId: ${sub.snippet.resourceId.channelId}`);
          onSubscriptionClick(sub.snippet.resourceId.channelId);
        }}
        style={{
          padding: isHovered ? '4px 16px' : '4px 8px',
        }}
        sx={{ '&:hover': { backgroundColor: '#f2f2f2' } }}
      >
        <ListItemIcon style={{ minWidth: isHovered ? '40px' : '48px' }}>
          <Avatar
            src={sub.snippet.thumbnails?.default?.url || 'https://via.placeholder.com/24'}
            style={{ width: '24px', height: '24px' }}
          />
        </ListItemIcon>
        <ListItemText
          primary={sub.snippet.title}
          primaryTypographyProps={{ fontSize: '14px', fontWeight: 'medium' }}
          style={{ display: isHovered ? 'block' : 'none' }}
        />
      </ListItem>
    ))}
  </List>
</div>

  );
};
export default ProfileSidebar;

