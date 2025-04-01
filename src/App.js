import React, { useEffect, useState } from "react";
import {
  BrowserRouter as Router,
  Route,
  Routes,
  Navigate,
  Outlet,
  useNavigate,
  useLocation,
  useOutletContext,
} from "react-router-dom";
import Navbar from "./components/navbar/navbar.js";
import Profile from "./pages/instagram/ProfileManager.js";
import PostsManager from "./pages/instagram/PostsManager.js";
import InsightManager from "./pages/instagram/InsightManager.js";

import StoriesManager from "./pages/instagram/StoriesManager.js";
import HashtagManager from "./pages/instagram/HashtagManager.js";
import FacebookLogin from "./pages/instagram/FacebookLogin.js";
import AdsManager from "./pages/instagram/AdsManager.js";
import ErrorModal from "./components/instagram/ErrorModal";
import Login from "./pages/loginPage/loginPage.js";
import ForgotPassword from "./pages/forgotPassword/forgotPassword.js";
import Register from "./pages/registerPage/register.js";
import HomePage from "./pages/homePage/homePage.js";
import GridPage from "./pages/gridPage/gridPage.js";
import ProfilePage from "./pages/profilePage/userProfile.js";
import AdminPage from "./pages/adminPage/adminPage.js";
import AdminUsers from "./pages/adminPage/adminUsers.js";
import AdminSettings from "./pages/adminPage/adminProfilePage.js";
import FacebookProfile from './pages/facebook/FacebookProfile.js';

import AuthCallback from './pages/youtube/authCallback.js'; // Import the new callback page
import YoutubeProfile from './pages/youtube/profile.js'; // We'll create this next

import "./App.css";
import { jwtDecode } from "jwt-decode";
import { cookies } from "./utils/cookie";
import Sidebar from "./components/sidebars/clientSideBar.js";
import AdminSidebar from "./components/sidebars/adminSideBar.js";
import { SidebarProvider } from "./context/SidebarContext";
import { useSidebar } from "./context/SidebarContext";

const NotFound = () => {
  return (
    <div
      style={{
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
        textAlign: "center",
        display: "flex",
        mt: "10%",
        gap: 10,
      }}
    >
      <h1 style={{ gap: 1, display: "flex" }}>
        Aradığınız sayfa bulunamadı veya bu sayfayı görmeye yetkiniz yok.{"\t"}
      </h1>
    </div>
  );
};

const Layout = ({ errorModalMessage, setErrorModalMessage }) => {
  const { sidebarOpen, toggleSidebar } = useSidebar();
  const jwtToken = cookies.get("jwt-access");
  const isAdmin = jwtToken ? jwtDecode(jwtToken).role === "admin" : false;

  return (
    <div style={{ display: "flex" }}>
      {isAdmin ? (
        <AdminSidebar status={sidebarOpen} toggleSidebar={toggleSidebar} />
      ) : (
        <Sidebar status={sidebarOpen} toggleSidebar={toggleSidebar} />
      )}
      <div style={{ flexGrow: 1, display: "flex", flexDirection: "column" }}>
        <Outlet context={{ errorModalMessage, setErrorModalMessage }} /> {/* Pass state via context */}
      </div>
    </div>
  );
};

function ProtectedRoute({ children }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { errorModalMessage, setErrorModalMessage } = useOutletContext(); // Access from Outlet context

  useEffect(() => {
    const checkAuth = async () => {
      const jwtToken = cookies.get("jwt-access");

      try {
        if (jwtToken) {
          const decodedToken = jwtDecode(jwtToken);
          const userRole = decodedToken.role;

          // Role-based routing
          if (userRole === "admin" && !location.pathname.startsWith("/admin")) {
            navigate("/admin");
          } else if (
            userRole === "user" &&
            location.pathname.startsWith("/admin")
          ) {
            navigate("/NotFound");
          }
        } else if (!['/register', '/forgot-password', '/login'].includes(location.pathname)) {
          navigate("/login");
        }
      } catch (error) {
        console.error("Error during auth check:", error);
        setErrorModalMessage("An error occurred during authentication.");
        navigate("/login");
      }
    };

    checkAuth();
  }, [navigate, location.pathname, setErrorModalMessage]);

  return children; // Render the child routes if authenticated
}

function AppRoutes() {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setIsLoading(false); // No auth check here; handled by ProtectedRoute
  }, []);



  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/login" element={<Login />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/register" element={<Register />} />
      <Route path="/auth-callback" element={<AuthCallback />} /> 
     
      {/* Protected Routes with Layout (Global Sidebar) */}
      <Route
        path="/"
        element={
          <Layout />
        }
      >
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <Navigate to="/homepage" replace />
            </ProtectedRoute>
          }
        />
        <Route
          path="/homepage"
          element={
            <ProtectedRoute>
              <HomePage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/user/gridPage"
          element={
            <ProtectedRoute>
              <GridPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/user/profile"
          element={
            <ProtectedRoute>
              <ProfilePage />
            </ProtectedRoute>
          }
        />
    <Route
          path="/insights"
          element={
            <ProtectedRoute>
              <InsightManager />
            </ProtectedRoute>
          }
        />


    <Route
          path="/youtube-profile"
          element={
            <ProtectedRoute>
              <YoutubeProfile />
            </ProtectedRoute>
          }
        />
        {/* Instagram Management Routes */}
        <Route
          path="/Profile"
          element={
            <ProtectedRoute>
              <Profile />
            </ProtectedRoute>
          }
        />

<Route
          path="/FacebookProfile"
          element={
            <ProtectedRoute>
              <FacebookProfile />
            </ProtectedRoute>
          }
        />


        <Route
          path="/posts"
          element={
            <ProtectedRoute>
              <PostsManager />
            </ProtectedRoute>
          }
        />
         <Route
          path="/hashtags"
          element={
            <ProtectedRoute>
              <HashtagManager />
            </ProtectedRoute>
          }
        />
          <Route
          path="/ads"
          element={
            <ProtectedRoute>
              <AdsManager />
            </ProtectedRoute>
          }
        />
      <Route
          path="/FacebookLogin"
          element={
            <ProtectedRoute>
              <FacebookLogin />
            </ProtectedRoute>
          }
        />


        <Route
          path="/stories"
          element={
            <ProtectedRoute>
              <StoriesManager />
            </ProtectedRoute>
          }
        />
        <Route
          path="/ads"
          element={
            <ProtectedRoute>
              <AdsManager />
            </ProtectedRoute>
          }
        />

        {/* Admin Routes */}
        <Route
          path="/admin"
          element={
            <ProtectedRoute>
              <AdminPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/users"
          element={
            <ProtectedRoute>
              <AdminUsers />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/settings"
          element={
            <ProtectedRoute>
              <AdminSettings />
            </ProtectedRoute>
          }
        />
      </Route>

      {/* Fallback Route */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

function App() {
  const [errorModalMessage, setErrorModalMessage] = useState(null);

  return (
    <SidebarProvider>
      <Router>
        <div className="App">
          <AppRoutes />
          {errorModalMessage && (
            <ErrorModal
              message={errorModalMessage}
              onClose={() => setErrorModalMessage(null)}
            />
          )}
        </div>
      </Router>
    </SidebarProvider>
  );
}

export default App;