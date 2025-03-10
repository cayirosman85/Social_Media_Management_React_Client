import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

const LoginPage = () => {
  const [loginUrl, setLoginUrl] = useState("");
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetch("http://localhost:8000/api/login/url")
      .then((response) => response.json())
      .then((data) => {
        if (data.login_url) {
          setLoginUrl(data.login_url);
        } else {
          setError("Failed to get login URL");
        }
      })
      .catch((err) => setError("Error fetching login URL: " + err.message));
  }, []);

  const handleLogin = () => {
    if (loginUrl) {
      window.location.href = loginUrl; // Redirect to Facebook Login
    }
  };

  return (
    <div style={{ textAlign: "center", padding: "50px" }}>
      <h1>Instagram Login</h1>
      {error && <p style={{ color: "red" }}>{error}</p>}
      <button
        onClick={handleLogin}
        disabled={!loginUrl}
        style={{
          padding: "10px 20px",
          fontSize: "16px",
          backgroundColor: "#1877f2",
          color: "white",
          border: "none",
          borderRadius: "5px",
          cursor: "pointer",
        }}
      >
        Login with Facebook
      </button>
    </div>
  );
};

export default LoginPage;