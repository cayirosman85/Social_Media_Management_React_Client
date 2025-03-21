import React from "react";
import {
  Drawer,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Collapse,
  Typography,
  Grid,
  Checkbox,
  IconButton,
} from "@mui/material";
import { logout } from "../../api/auth/logout";
import localStorage from "local-storage";
import {
  ExpandLess,
  ExpandMore,
  Instagram,
  Person,
  Tv,
  InsertChart,
  PhotoCamera,
  CalendarToday,
  Visibility,
  Terrain,
} from "@mui/icons-material";
import { useNavigate, useLocation, Link } from "react-router-dom";
import largeLogo from "../../assets/images/linkedin-banner.jpg";
import smallLogo from "../../assets/images/small-linkedin-logo.jpg";
import LogoutOutlinedIcon from "@mui/icons-material/LogoutOutlined";
import { Home, Files, Login } from "tabler-icons-react";
import { useSidebar } from "../../context/SidebarContext";
import FacebookLogin from "react-facebook-login";

const menuItems = [
  { text: "Profile", icon: <Home size={22} />, path: "/homepage" },
  { text: "Clients", icon: <Files size={22} />, path: "/user/gridPage" },
  { text: "Social Medias", header: true },
  {
    text: "Instagram",
    icon: <Instagram size={22} />,
    subItems: [
      { text: "Profile", icon: <Person size={22} />, path: "/Profile" },
      { text: "Posts", icon: <InsertChart size={22} />, path: "/posts" },
      { text: "Hashtags", icon: <Terrain size={22} />, path: "/hashtags" },
      { text: "Stories", icon: <PhotoCamera size={22} />, path: "/stories" },
      { text: "Ads", icon: <Tv size={22} />, path: "/ads" },
      { text: "Insights", icon: <Visibility size={22} />, path: "/insights" },
      { text: "Schedule", icon: <CalendarToday size={22} />, path: "/schedule" },
      { text: "Login", icon: <Login size={22} />, path: "/FacebookLogin" },
    ],
  },
  { text: "Logout", icon: <LogoutOutlinedIcon size={22} />, action: logout, path: "/login" },
];

const Sidebar = () => {
  const { sidebarOpen, toggleSidebar } = useSidebar();
  const [isHovered, setIsHovered] = React.useState(true);
  const [openSubMenu, setOpenSubMenu] = React.useState({});
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState(null);
  const navigate = useNavigate();
  const location = useLocation();

  const appId = "1936737430086867";
  const appSecret = "d3d576725b8470849808a68eca9c9b75"; // WARNING: Keep this server-side in production!

  const validateToken = async (accessToken) => {
    try {
      console.log("Validating access token:", accessToken);
      const response = await fetch(
        `https://graph.facebook.com/debug_token?input_token=${accessToken}&access_token=${appId}|${appSecret}`
      );
      const data = await response.json();
      console.log("Token validation response:", data);

      if (data.data && data.data.is_valid) {
        console.log("Token is valid!");
        const grantedScopes = data.data.scopes || [];
        console.log("Granted scopes:", grantedScopes);

        const requiredScopes = [
          "public_profile",
          "email",
          "pages_show_list",
          "instagram_basic",
          "instagram_manage_comments",
          "instagram_content_publish",
          "instagram_manage_insights",
          "pages_manage_metadata",
          "pages_read_engagement",
          "pages_read_user_content",
        ];

        const missingScopes = requiredScopes.filter((scope) => !grantedScopes.includes(scope));
        if (missingScopes.length > 0) {
          console.error("Missing required permissions:", missingScopes);
          throw new Error(`Missing permissions: ${missingScopes.join(", ")}. Please reauthorize the app.`);
        }

        console.log("All required permissions granted!");
        return true;
      } else {
        console.error("Token is invalid or expired:", data);
        return false;
      }
    } catch (error) {
      console.error("Error validating token:", error);
      setError(error.message || "Error validating token. Please try again.");
      return false;
    }
  };

  const exchangeForLongLivedToken = async (shortLivedToken) => {
    try {
      console.log("Exchanging short-lived token:", shortLivedToken);
      const response = await fetch(
        `https://graph.facebook.com/v18.0/oauth/access_token?grant_type=fb_exchange_token&client_id=${appId}&client_secret=${appSecret}&fb_exchange_token=${shortLivedToken}`
      );
      const data = await response.json();
      console.log("Long-lived token exchange response:", data);
      if (data.access_token) {
        console.log("Successfully obtained long-lived token:", data.access_token);
        console.log("Token expires in (seconds):", data.expires_in || "Not provided (assumed 60 days)");
        return data.access_token;
      } else {
        console.error("No access_token in response:", data);
        throw new Error("Failed to exchange token");
      }
    } catch (error) {
      console.error("Error exchanging token:", error);
      return null;
    }
  };

  const responseFacebook = async (response) => {
    console.log("Facebook Response from Sidebar:", response);
    if (response.accessToken) {
      setLoading(true);
      setError(null);
      console.log("Starting long-lived token exchange process...");
      const longLivedToken = await exchangeForLongLivedToken(response.accessToken);
      if (longLivedToken) {
        console.log("Storing long-lived token in localStorage:", longLivedToken);
        localStorage.set("facebookAccessToken", longLivedToken);
        const isValid = await validateToken(longLivedToken);
        if (isValid) {
          fetchInstagramData(longLivedToken);
        } else {
          setError("Token validation failed. Please check permissions and try again.");
          setLoading(false);
        }
      } else {
        setError("Failed to obtain a valid session. Please try again.");
        setLoading(false);
      }
    } else {
      console.error("No access token received from Facebook login:", response);
      setError("No access token received from Facebook login.");
    }
  };

  const fetchInstagramData = async (accessToken) => {
    setLoading(true);
    setError(null);
    try {
      console.log("Fetching Instagram data with token:", accessToken);
      const isValid = await validateToken(accessToken);
      if (!isValid) {
        throw new Error("Invalid or expired token");
      }

      const pagesResponse = await fetch(
        `https://graph.facebook.com/v18.0/me/accounts?access_token=${accessToken}&app_id=${appId}`
      );
      const pagesData = await pagesResponse.json();
      console.log("Facebook Pages:", pagesData);

      if (pagesData.data && pagesData.data.length > 0) {
        const pageId = pagesData.data[0].id;
        console.log("Using page ID:", pageId);
        const igResponse = await fetch(
          `https://graph.facebook.com/v18.0/${pageId}?fields=instagram_business_account&access_token=${accessToken}&app_id=${appId}`
        );
        const igData = await igResponse.json();
        console.log("Instagram Business Account:", igData);

        if (igData.instagram_business_account) {
          const instagramBusinessId = igData.instagram_business_account.id;
          console.log("Instagram Business ID:", instagramBusinessId);
          localStorage.set("userId", instagramBusinessId);
          fetchInstagramUser(instagramBusinessId, accessToken);
        } else {
          throw new Error("No Instagram Business Account linked to this page.");
        }
      } else {
        throw new Error("No Facebook pages found for this user.");
      }
    } catch (error) {
      console.error("Error fetching Instagram data:", error);
      setError("Failed to connect to Instagram. Please log in again.");
      localStorage.remove("facebookAccessToken");
      localStorage.remove("userId");
      localStorage.remove("username");
      navigate("/FacebookLogin");
    } finally {
      setLoading(false);
    }
  };

  const fetchInstagramUser = async (instagramBusinessId, accessToken) => {
    try {
      console.log("Fetching Instagram user data for ID:", instagramBusinessId);
      const response = await fetch(
        `https://graph.facebook.com/v18.0/${instagramBusinessId}?fields=username,followers_count,media_count,follows_count,name,biography&access_token=${accessToken}&app_id=${appId}`
      );
      const data = await response.json();
      console.log("Instagram User Data Response:", data);

      if (data.error && data.error.code === 190) {
        console.error("Access token invalid (Code 190):", data.error);
        localStorage.remove("facebookAccessToken");
        localStorage.remove("userId");
        localStorage.remove("username");
        setError("Your session has expired. Please log in again.");
        navigate("/FacebookLogin");
        return;
      }

      console.log("Instagram User Data from Sidebar:", data);
      localStorage.set("username", data.username);
      navigate("/Profile");
    } catch (error) {
      console.error("Error fetching Instagram user data:", error);
      setError("Failed to fetch Instagram user data. Please try again.");
    }
  };

  const handleMouseEnter = () => {
    if (!sidebarOpen) setIsHovered(true);
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
  };

  const handleSubMenuToggle = (text) => {
    setOpenSubMenu((prevState) => ({
      ...prevState,
      [text]: !prevState[text],
    }));
  };

  const drawerWidth = sidebarOpen ? 240 : 60;
  const effectiveWidth = sidebarOpen || isHovered ? 240 : 60;

  const handleItemClick = (item) => {
    if (item.action) {
      console.log("Logging out and clearing token...");
      item.action();
      localStorage.remove("facebookAccessToken");
      localStorage.remove("userId");
      localStorage.remove("username");
    }
    if (item.path) {
      console.log("Navigating to:", item.path);
      navigate(item.path);
    }
  };

  const renderMenuItem = (item, index) => {
    const isActive = location.pathname === item.path;
    const itemClass = isActive ? "selected-menu-item" : "unselected-menu-item";

    if (item.header) {
      return (
        (sidebarOpen || isHovered) && (
          <Typography key={index} variant="overline" sx={{ pl: 2, pt: 2, pb: 1, m: 3 }}>
            {item.text}
          </Typography>
        )
      );
    }

    if (item.subItems) {
      const subItemActive = item.subItems.some((subItem) => location.pathname === subItem.path);
      const subItemClass = subItemActive ? "selected-menu-item" : "unselected-menu-item";

      return (
        <React.Fragment key={item.text}>
          <ListItem
            button
            onClick={() => handleSubMenuToggle(item.text)}
            className={subItemClass}
            sx={{ mt: 0.3, mb: 0.3 }}
          >
            <ListItemIcon>{item.icon}</ListItemIcon>
            {(sidebarOpen || isHovered) && (
              <>
                <ListItemText primary={item.text} />
                {openSubMenu[item.text] ? <ExpandLess /> : <ExpandMore />}
              </>
            )}
          </ListItem>
          <Collapse in={openSubMenu[item.text]} timeout="auto" unmountOnExit>
            <List component="div" disablePadding>
              {item.subItems.map((subItem, subIndex) => {
                if (subItem.text === "Login") {
                  return (
                    <ListItem key={subItem.text} sx={{ pl: 4, m: 1, width: "95%" }}>
                      <ListItemIcon>{subItem.icon}</ListItemIcon>
                      {(sidebarOpen || isHovered) && (
                        <FacebookLogin
                          appId={appId}
                          autoLoad={false}
                          fields="name,email,picture"
                     scope="public_profile,email,pages_show_list,instagram_basic,instagram_manage_comments,instagram_content_publish,instagram_manage_insights,pages_manage_metadata,pages_read_engagement,pages_read_user_content,manage_fundraisers,read_insights,publish_video,leads_retrieval,whatsapp_business_management,instagram_manage_messages,whatsapp_business_messaging,instagram_branded_content_brand,instagram_branded_content_creator,instagram_branded_content_ads_brand,instagram_manage_upcoming_events"
                          callback={responseFacebook}
                          cssClass="facebook-login-btn"
                          textButton="Login with Facebook"
                          disabled={loading}
                        />
                      )}
                    </ListItem>
                  );
                }
                return (
                  <ListItem
                    button
                    key={subItem.text}
                    component={Link}
                    to={subItem.path}
                    className={location.pathname === subItem.path ? "selected-menu-item" : "unselected-menu-item"}
                    sx={{ pl: 4, m: 1, width: "95%" }}
                  >
                    <ListItemIcon>{subItem.icon}</ListItemIcon>
                    <ListItemText primary={subItem.text} />
                  </ListItem>
                );
              })}
            </List>
          </Collapse>
        </React.Fragment>
      );
    }

    return (
      <ListItem
        button
        key={item.text}
        onClick={item.action ? () => handleItemClick(item) : undefined}
        component={item.action ? undefined : Link}
        to={item.action ? undefined : item.path}
        className={itemClass}
        sx={{ mt: 0.3, mb: 0.3 }}
      >
        <ListItemIcon>{item.icon}</ListItemIcon>
        {(sidebarOpen || isHovered) && <ListItemText primary={item.text} />}
      </ListItem>
    );
  };

  return (
    <Drawer
      variant="permanent"
      sx={{
        width: drawerWidth,
        flexShrink: 0,
        "& .MuiDrawer-paper": {
          width: effectiveWidth,
          boxSizing: "border-box",
          backgroundColor: "#ffffff",
          transition: "width 0.2s",
          overflowX: "hidden",
          overflowY: sidebarOpen || isHovered ? "" : "hidden",
        },
        "& .MuiDrawer-paper::-webkit-scrollbar": {
          width: "0.7vh",
        },
        "& .MuiDrawer-paper::-webkit-scrollbar-thumb": {
          backgroundColor: "#888",
          borderRadius: 10,
        },
      }}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <Grid sx={{ p: 2, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <img
          src={sidebarOpen || isHovered ? largeLogo : smallLogo}
          alt="Logo"
          style={{ height: sidebarOpen ? "40px" : "40px", transition: "height 0.2s" }}
        />
        <Checkbox
          icon={<IconButton size="small" color="#786af2"><span style={{ fontSize: "1.5rem" }}>◯</span></IconButton>}
          checkedIcon={<IconButton size="small"><span style={{ fontSize: "1.5rem" }}>◉</span></IconButton>}
          checked={sidebarOpen}
          onChange={toggleSidebar}
          onClick={() => localStorage.set("sidebar", `${!sidebarOpen}`)}
          sx={{ "&.Mui-checked": { color: "#7367f0" } }}
        />
      </Grid>
      {loading && <Typography sx={{ p: 2 }}>Loading...</Typography>}
      {error && (
        <Typography color="error" sx={{ p: 2 }}>
          {error}
        </Typography>
      )}
      <List sx={{ m: "2%" }}>{menuItems.map(renderMenuItem)}</List>
    </Drawer>
  );
};

export default Sidebar;