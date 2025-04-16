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
import Profile from "./pages/instagram/instagramProfile/ProfileManager.js";
import PostsManager from "./pages/instagram/instagramProfile/PostsManager.js";
import InsightManager from "./pages/instagram/instagramProfile/InsightManager.js";
import StoriesManager from "./pages/instagram/instagramProfile/StoriesManager.js";
import HashtagManager from "./pages/instagram/instagramProfile/HashtagManager.js";
import FacebookLogin from "./pages/instagram/instagramProfile/FacebookLogin.js";
import AdsManager from "./pages/instagram/instagramProfile/AdsManager.js";
import ErrorModal from "./components/instagram/profile/ErrorModal";
import Login from "./pages/loginPage/loginPage.js";
import ForgotPassword from "./pages/forgotPassword/forgotPassword.js";
import Register from "./pages/registerPage/register.js";
import HomePage from "./pages/homePage/homePage.js";
import GridPage from "./pages/gridPage/gridPage.js";
import ProfilePage from "./pages/profilePage/userProfile.js";
import AdminPage from "./pages/adminPage/adminPage.js";
import AdminUsers from "./pages/adminPage/adminUsers.js";
import AdminSettings from "./pages/adminPage/adminProfilePage.js";
import FacebookProfile from './pages/facebook/facebookProfile/FacebookProfile.js';
import AuthCallback from './pages/youtube/authCallback.js';
import YoutubeProfile from './pages/youtube/profile.js';
import "./App.css";
import { jwtDecode } from "jwt-decode";
import { cookies } from "./utils/cookie";
import Sidebar from "./components/sidebars/clientSideBar.js";
import AdminSidebar from "./components/sidebars/adminSideBar.js";
import { SidebarProvider } from "./context/SidebarContext";
import { useSidebar } from "./context/SidebarContext";
import MessengerPage from './pages/facebook/facebookMessenger/MessengerPage.js';
import MessengerAccount from './pages/facebook/facebookMessenger/MessengerAccount.js';
// New imports for Facebook Account pages
import FacebookAccountList from './pages/facebook/facebookAccount/FacebookAccountList.js';
import FacebookAccountCreate from './pages/facebook/facebookAccount/FacebookAccountCreate.js';
import FacebookAccountEdit from './pages/facebook/facebookAccount/FacebookAccountEdit.js';


// New imports for Facebook Account pages For instagram
import FacebookAccountListForInstagram from './pages/instagram/facebookProfileAccount/FacebookAccountList.js';
import FacebookAccountCreateForInstagram from './pages/instagram/facebookProfileAccount/FacebookAccountCreate.js'; 
import FacebookAccountEditForInstagram  from './pages/instagram/facebookProfileAccount/FacebookAccountEdit.js';


// New imports for Facebook Account pages For instagram
import InstagramMessengerAccountListForInstagram from './pages/instagram/instagramMessengerAccount/InstagramMessengerAccountList.js';
import InstagramMessengerAccountCreateForInstagram from './pages/instagram/instagramMessengerAccount/InstagramMessengerAccountCreate.js'; 
import InstagramMessengerAccountEditForInstagram  from './pages/instagram/instagramMessengerAccount/InstagramMessengerAccountEdit.js';
import InstagramChat  from './pages/instagram/instagramMessenger/InstagramMessengerPage.js';




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
  return (
    <div style={{ display: "flex" }}>
      <Sidebar status={sidebarOpen} toggleSidebar={toggleSidebar} />
      <div style={{ flexGrow: 1, display: "flex", flexDirection: "column" }}>
        <Outlet context={{ errorModalMessage, setErrorModalMessage }} />
      </div>
    </div>
  );
};

function ProtectedRoute({ children }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { errorModalMessage, setErrorModalMessage } = useOutletContext();

  useEffect(() => {
    const checkAuth = async () => {
      const jwtToken = cookies.get("jwt-access");

      try {
        if (jwtToken) {
          const decodedToken = jwtDecode(jwtToken);
          const currentTime = Math.floor(Date.now() / 1000);
          if (decodedToken.exp < currentTime) {
            throw new Error("Token expired");
          }
        } else if (!["/register", "/forgot-password", "/login"].includes(location.pathname)) {
          navigate("/login");
        }
      } catch (error) {
        console.error("Error during auth check:", error);
        setErrorModalMessage("Kimlik doğrulama sırasında bir hata oluştu.");
        navigate("/login");
      }
    };

    checkAuth();
  }, [navigate, location.pathname, setErrorModalMessage]);

  return children;
}

function AppRoutes() {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setIsLoading(false);
  }, []);

  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/login" element={<Login />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/register" element={<Register />} />
      {/* <Route path="/auth-callback" element={<AuthCallback />} /> */}
      <Route path="/auth/callback" element={<Sidebar />} />
      {/* Protected Routes with Layout */}
      <Route
        path="/"
        element={<Layout />}
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
          path="/messenger"
          element={
            <ProtectedRoute>
              <MessengerPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/MessengerAccount"
          element={
            <ProtectedRoute>
              <MessengerAccount />
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
        {/* New Facebook Account Routes */}
        <Route
          path="/facebook-accounts"
          element={
            <ProtectedRoute>
              <FacebookAccountList />
            </ProtectedRoute>
          }
        />
        <Route
          path="/facebook-accounts/create"
          element={
            <ProtectedRoute>
              <FacebookAccountCreate />
            </ProtectedRoute>
          }
        />
        <Route
          path="/facebook-accounts/edit/:companyId"
          element={
            <ProtectedRoute>
              <FacebookAccountEdit />
            </ProtectedRoute>
          }
        />
    {/* New Facebook Account Routes for instagram */}

 
    <Route
          path="/instagram-accounts"
          element={
            <ProtectedRoute>
              <FacebookAccountListForInstagram />
            </ProtectedRoute>
          }
        />
        <Route
          path="/instagram-accounts/create"
          element={
            <ProtectedRoute>
              <FacebookAccountCreateForInstagram />
            </ProtectedRoute>
          }
        />
        <Route
          path="/instagram-accounts/edit/:companyId"
          element={
            <ProtectedRoute>
              <FacebookAccountEditForInstagram />
            </ProtectedRoute>
          }
        />
   
   {/* New Instagram Chat Account Routes for instagram Chat*/}
   <Route
          path="/instagram-chat"
          element={
            <ProtectedRoute>
               <InstagramChat/>
            </ProtectedRoute>
          }
        />
   <Route
          path="/instagram-chat-accounts"
          element={
            <ProtectedRoute>
              <InstagramMessengerAccountListForInstagram />
            </ProtectedRoute>
          }
        />
        <Route
          path="/instagram-chat-accounts/create"
          element={
            <ProtectedRoute>
              <InstagramMessengerAccountCreateForInstagram />
            </ProtectedRoute>
          }
        />
        <Route
          path="/instagram-chat-accounts/edit/:companyId"
          element={
            <ProtectedRoute>
              <InstagramMessengerAccountEditForInstagram />
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