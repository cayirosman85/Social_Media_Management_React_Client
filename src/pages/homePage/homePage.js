import { useState, useEffect } from "react";
import Sidebar from "../../components/sidebars/clientSideBar";
import Navbar from "../../components/navbar/navbar";
import localStorage from "local-storage";
import {
  Grid,
  Button,
  Alert,
  Card,
  CardMedia,
  Typography,
  CardContent,
  Divider,
  TextField,
  MenuItem,
  Box,
  Tabs,
  Tab,
} from "@mui/material";
import images1 from "../../assets/images/images1.jpg";
import images2 from "../../assets/images/images2.jpg";
import images3 from "../../assets/images/images3.png";

function HomePage() {
  const [isOpen, setIsOpen] = useState(false);
  const [tabValue, setTabValue] = useState(0);
  const [postContent, setPostContent] = useState("");
  const [selectedPlatform, setSelectedPlatform] = useState("");
  const [posts, setPosts] = useState([]);

  useEffect(() => {
    const sideBarOpen = localStorage.get("sidebar");
    if (sideBarOpen === "false") {
      setIsOpen(false);
    } else {
      setIsOpen(true);
    }

    const cleanupLocalStorage = () => {
      localStorage.clear();
    };
    window.addEventListener("beforeunload", cleanupLocalStorage);
    return () => {
      window.removeEventListener("beforeunload", cleanupLocalStorage);
    };
  }, []);

  const toggleSidebar = () => {
    setIsOpen(!isOpen);
  };

  const platforms = [
    { name: "Instagram", id: "insta", image: images1 },
    { name: "Twitter (X)", id: "twitter", image: images2 },
    { name: "Facebook", id: "fb", image: images3 },
    { name: "Google Business", id: "gbusiness", image: images1 },
  ];

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  const handlePostSubmit = () => {
    if (postContent && selectedPlatform) {
      const newPost = {
        id: Date.now(),
        content: postContent,
        platform: selectedPlatform,
        status: "Queued",
        queuedAt: new Date().toLocaleString(),
      };
      setPosts([...posts, newPost]);
      setPostContent("");
      setSelectedPlatform("");
    }
  };

  return (
    <Grid container>
      <Grid item md={isOpen ? 2.3 : 0.7}>
        <Sidebar
          status={isOpen}
          toggleSidebar={toggleSidebar}
          location={"homePage"}
        />
      </Grid>
      <Grid
        item
        md={isOpen ? 9.7 : 11.3}
        sx={{
          display: "flex",
          flexDirection: "column",
          pr: "4vh",
          gap: 2,
          p: 2,
        }}
      >
        <Typography variant="h4" gutterBottom>
          Grow Your Audience with Ease
        </Typography>
        <Typography variant="subtitle1" color="text.secondary">
          Plan, publish, and analyze your social media content across Instagram,
          Twitter, Facebook, and Google Business—all in one intuitive Profile.
        </Typography>

        <Tabs value={tabValue} onChange={handleTabChange} centered>
          <Tab label="Connected Channels" />
          <Tab label="Publishing Tools" />
          <Tab label="Content Queue" />
        </Tabs>

        {/* Connected Channels Tab */}
        {tabValue === 0 && (
          <Box>
            <Typography variant="h5" gutterBottom>
              Your Connected Channels
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Manage all your social accounts in one place. Connect up to 3
              channels for free and upgrade for more.
            </Typography>
            <Grid container spacing={2}>
              {platforms.map((platform, index) => (
                <Grid
                  item
                  xs={12}
                  sm={6}
                  md={3}
                  key={index}
                  sx={{ boxShadow: "rgba(0, 0, 0, 0.24) 0px 3px 8px" }}
                >
                  <Card>
                    <CardMedia
                      component="img"
                      height="140"
                      image={platform.image}
                      alt={platform.name}
                    />
                    <CardContent>
                      <Typography gutterBottom variant="h6" component="div">
                        {platform.name}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        ID: {platform.id}
                      </Typography>
                    </CardContent>
                    <Grid container sx={{ p: 2 }}>
                      <Grid item xs={12}>
                        <Button variant="contained" fullWidth color="success">
                          Manage
                        </Button>
                      </Grid>
                    </Grid>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </Box>
        )}

        {/* Publishing Tools Tab */}
        {tabValue === 1 && (
          <Box sx={{ mt: 2 }}>
            <Typography variant="h5" gutterBottom>
              Plan and Publish Thumb-Stopping Content
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Craft posts, queue them up, and let Buffer handle the rest. Add
              hashtags, tweak for each platform, and watch your reach grow.
            </Typography>
            <TextField
              select
              label="Choose a Channel"
              value={selectedPlatform}
              onChange={(e) => setSelectedPlatform(e.target.value)}
              fullWidth
              sx={{ mb: 2 }}
            >
              {platforms.map((platform) => (
                <MenuItem key={platform.id} value={platform.name}>
                  {platform.name}
                </MenuItem>
              ))}
            </TextField>
            <TextField
              label="Share Your Next Big Idea"
              multiline
              rows={4}
              value={postContent}
              onChange={(e) => setPostContent(e.target.value)}
              fullWidth
              sx={{ mb: 2 }}
              placeholder="Write your post or ad here..."
            />
            <Button
              variant="contained"
              color="primary"
              onClick={handlePostSubmit}
              disabled={!postContent || !selectedPlatform}
            >
              Add to Queue
            </Button>
          </Box>
        )}

        {/* Content Queue Tab */}
        {tabValue === 2 && (
          <Box sx={{ mt: 2 }}>
            <Typography variant="h5" gutterBottom>
              Your Content Queue
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              See what’s lined up and ready to go. Edit or remove posts to keep
              your strategy on track.
            </Typography>
            {posts.length === 0 ? (
              <Alert severity="info">
                Your queue is empty. Add some content to get started!
              </Alert>
            ) : (
              <Grid container spacing={2}>
                {posts.map((post) => (
                  <Grid item xs={12} sm={6} md={4} key={post.id}>
                    <Card>
                      <CardContent>
                        <Typography variant="h6">{post.platform}</Typography>
                        <Typography variant="body2" color="text.secondary">
                          {post.content}
                        </Typography>
                        <Divider sx={{ my: 1 }} />
                        <Typography variant="caption">
                          Queued: {post.queuedAt}
                        </Typography>
                        <Typography variant="caption" display="block">
                          Status: {post.status}
                        </Typography>
                      </CardContent>
                      <Grid container sx={{ p: 2, gap: 1 }}>
                        <Grid item xs={5.5}>
                          <Button variant="outlined" color="primary" fullWidth>
                            Edit
                          </Button>
                        </Grid>
                        <Grid item xs={5.5}>
                          <Button variant="outlined" color="error" fullWidth>
                            Remove
                          </Button>
                        </Grid>
                      </Grid>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            )}
          </Box>
        )}
      </Grid>
    </Grid>
  );
}

export default HomePage;