import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Grid, Button, Checkbox, Typography, InputAdornment, IconButton, TextField } from "@mui/material";
import { Visibility, VisibilityOff } from "@mui/icons-material";
import Swal from "sweetalert2";
import { apiFetch } from "../../api/auth/login/login"; // Adjust path as needed
import { cookies } from "../../utils/cookie"; // Import cookies utility
import { jwtDecode } from "jwt-decode"; // Import jwt-decode

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const navigate = useNavigate();

  const handleClickShowPassword = () => setShowPassword(!showPassword);
  const handleMouseDownPassword = (event) => event.preventDefault();

  const handleLogin = async (event) => {
    event.preventDefault();

    try {
      console.log("Sending login request...");
      const response = await apiFetch("/api/account/login", {
        method: "POST",
        body: JSON.stringify({ email, password }),
      });

      console.log("Response received:", response);

      // Extract token
      const { token } = response;
      if (!token || typeof token !== "string") {
        throw new Error("Geçersiz token alındı.");
      }

      // Decode token to get companyId
      const decodedToken = jwtDecode(token);
      const companyId = decodedToken.companyId;
      if (!companyId) {
        throw new Error("Token'da şirket ID'si bulunamadı.");
      }

      // Save token to cookies
      cookies.set("jwt-access", token, {
        secure: true,
        sameSite: "strict",
        expires: new Date(Date.now() + 24 * 60 * 60 * 1000), // 1 day expiry
      });
      console.log("Token saved to cookies");

      // Save companyId to cookies if rememberMe is checked
      if (rememberMe) {
        cookies.set("companyId", companyId, {
          secure: true,
          sameSite: "strict",
          expires: new Date(Date.now() + 24 * 60 * 60 * 1000), // 1 day expiry
        });
        console.log("companyId saved to cookies");
      }

      // Navigate to homepage
      console.log("Attempting to navigate to /homepage");
      navigate("/homepage", { replace: true });
    } catch (err) {
      console.error("Giriş hatası:", err);
      // Map errors to Turkish
      let errorMessage = "Giriş başarısız.";
      if (err.message.includes("Invalid token")) {
        errorMessage = "Geçersiz token alındı.";
      } else if (err.message.includes("E-posta adresi yanlış")) {
        errorMessage = "E-posta adresi yanlış.";
      } else if (err.message.includes("E-posta veya şifre yanlış")) {
        errorMessage = "E-posta veya şifre yanlış.";
      } else if (err.message.includes("şirket ID'si bulunamadı")) {
        errorMessage = "Token'da şirket ID'si bulunamadı.";
      }

      // Show error in modal
      Swal.fire({
        title: errorMessage,
        icon: "error",
        confirmButtonText: "Tamam",
      });
    }
  };

  return (
    <Grid
      container
      sx={{
        height: "100vh",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "5vh",
      }}
      md={12}
      spacing={2}
    >
      <Grid
        item
        md={8.5}
        sm={8.5}
        sx={{ display: "flex", justifyContent: "center" }}
      >
        <Grid
          component="img"
          sx={{
            width: "100vh",
            height: "60vh",
          }}
          alt="My Image"
          src={`/images/s.webp`}
        />
      </Grid>

      <Grid
        item
        md={3.5}
        sm={3.5}
        sx={{
          display: "flex",
          flexDirection: "column",
          gap: 3,
          alignItems: "center",
          justifyContent: "center",
          marginTop: "20vh",
          marginBottom: "20vh",
          backgroundColor: "#ffffff",
          padding: "2vh",
        }}
      >
        <Grid item md={12} sx={{ width: "100vh" }}>
          <TextField
            className="input-field"
            fullWidth
            label="Email"
            InputLabelProps={{ shrink: true }}
            variant="outlined"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </Grid>
        <Grid item md={12} sx={{ width: "100vh" }}>
          <TextField
            fullWidth
            className="input-field"
            label="Şifre"
            InputLabelProps={{ shrink: true }}
            variant="outlined"
            type={showPassword ? "text" : "password"}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton
                    onClick={handleClickShowPassword}
                    onMouseDown={handleMouseDownPassword}
                    edge="end"
                    size="small"
                  >
                    {showPassword ? (
                      <Visibility fontSize="inherit" style={{ fontSize: "1rem" }} />
                    ) : (
                      <VisibilityOff fontSize="inherit" style={{ fontSize: "1rem" }} />
                    )}
                  </IconButton>
                </InputAdornment>
              ),
            }}
          />
        </Grid>
        <Grid
          item
          md={12}
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            width: "100%",
          }}
        >
          <Grid
            item
            md={6}
            sx={{
              display: "flex",
              alignItems: "center",
              width: "100%",
              justifyContent: "flex-start",
            }}
          >
            <Checkbox
              checked={rememberMe}
              className="default-checked"
              onChange={(e) => setRememberMe(e.target.checked)}
            />
            <Typography variant="body2">Beni Hatırla</Typography>
          </Grid>
          <Grid
            item
            md={6}
            sx={{
              display: "flex",
              width: "100%",
              justifyContent: "flex-end",
            }}
          >
            <Button
              onClick={() => navigate("/forgot-password")}
              className="unframed-button"
              sx={{ color: "#786af2", textDecoration: "none" }}
            >
              Şifreni mi unuttun?
            </Button>
          </Grid>
        </Grid>
        <Grid item md={12} sx={{ width: "100%" }}>
          <Button
            fullWidth
            variant="contained"
            color="secondary"
            type="submit"
            onClick={handleLogin}
            className="custom-button"
          >
            Giriş
          </Button>
        </Grid>
        <Grid
          item
          md={12}
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: "100%",
          }}
        >
          <Typography variant="body2">Henüz kaydınız yok mu? </Typography>
          <Button
            variant="body2"
            onClick={() => navigate("/register")}
            className="unframed-button"
            sx={{ color: "#786af2", textDecoration: "none" }}
          >
            Kayıt ol
          </Button>
        </Grid>
      </Grid>
    </Grid>
  );
};

export default Login;