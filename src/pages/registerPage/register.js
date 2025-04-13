import React, { useState } from "react";
import {
  Grid,
  Button,
  Typography,
  Checkbox,
  TextField,
  InputAdornment,
  IconButton,
  Alert,
} from "@mui/material";
import { useNavigate } from "react-router-dom";
import { Visibility, VisibilityOff } from "@mui/icons-material";
import {apiFetch} from "../../api/auth/register/register"
const Register = () => {
  const [formData, setFormData] = useState({
    companyName: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [agree, setAgree] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleClickShowPassword = () => setShowPassword(!showPassword);
  const handleMouseDownPassword = (event) => event.preventDefault();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!agree) {
      setError("Gizlilik politikası ve şartları kabul etmelisiniz.");
      return;
    }

    try {
      const response = await apiFetch("/api/Account/register", {
        method: "POST",
        body: JSON.stringify(formData),
      });
      setSuccess(response.Message || "Kayıt başarılı!");
      setTimeout(() => navigate("/login"), 2000);
    } catch (err) {
      setError(err.message || "Kayıt başarısız. Lütfen tekrar deneyin.");
      console.error("Kayıt hatası:", err);
    }
  };

  return (
    <Grid
      container
      sx={{
        height: "100vh",
        alignItems: "center",
        justifyContent: "center",
        padding: { xs: 2, md: 5 },
      }}
      spacing={2}
    >
      <Grid
        item
        xs={12}
        md={6}
        sx={{ display: { xs: "none", md: "flex" }, justifyContent: "center" }}
      >
        <img
          src="/images/login-pages.png"
          alt="Kayıt Görseli"
          style={{ maxWidth: "100%", height: "auto" }}
        />
      </Grid>

      <Grid
        item
        xs={12}
        md={6}
        sx={{
          display: "flex",
          flexDirection: "column",
          gap: 3,
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#ffffff",
          padding: 4,
          borderRadius: 2,
          boxShadow: 3,
        }}
      >
        <Typography variant="h5">Kayıt Ol</Typography>
        <Typography variant="body2" color="textSecondary">
          Lütfen gerekli bilgileri eksiksiz doldurunuz.
        </Typography>

        {error && <Alert severity="error">{error}</Alert>}
        {success && <Alert severity="success">{success}</Alert>}

        <form onSubmit={handleSubmit} style={{ width: "100%" }}>
          <TextField
            fullWidth
            name="companyName"
            label="Şirket Adı"
            placeholder="Şirket adını giriniz"
            value={formData.companyName}
            onChange={handleChange}
            margin="normal"
            required
          />
          <TextField
            fullWidth
            name="email"
            label="E-posta"
            placeholder="E-posta adresinizi giriniz"
            type="email"
            value={formData.email}
            onChange={handleChange}
            margin="normal"
            required
          />
          <TextField
            fullWidth
            name="password"
            label="Şifre"
            placeholder="Şifrenizi giriniz"
            type={showPassword ? "text" : "password"}
            value={formData.password}
            onChange={handleChange}
            margin="normal"
            required
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton
                    onClick={handleClickShowPassword}
                    onMouseDown={handleMouseDownPassword}
                    edge="end"
                  >
                    {showPassword ? <Visibility /> : <VisibilityOff />}
                  </IconButton>
                </InputAdornment>
              ),
            }}
          />
          <TextField
            fullWidth
            name="confirmPassword"
            label="Şifreyi Onayla"
            placeholder="Şifrenizi tekrar giriniz"
            type={showPassword ? "text" : "password"}
            value={formData.confirmPassword}
            onChange={handleChange}
            margin="normal"
            required
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton
                    onClick={handleClickShowPassword}
                    onMouseDown={handleMouseDownPassword}
                    edge="end"
                  >
                    {showPassword ? <Visibility /> : <VisibilityOff />}
                  </IconButton>
                </InputAdornment>
              ),
            }}
          />
          <Grid container alignItems="center" sx={{ mt: 2 }}>
            <Checkbox
              checked={agree}
              onChange={(e) => setAgree(e.target.checked)}
            />
            <Typography variant="body2">
              <Button
                sx={{ color: "#786af2", textTransform: "none", p: 0 }}
                onClick={() => window.open("/gizlilik-politikasi", "_blank")}
              >
                Gizlilik Politikası ve Şartlar
              </Button>{" "}
              kabul ediyorum.
            </Typography>
          </Grid>
          <Button
            fullWidth
            variant="contained"
            color="primary"
            type="submit"
            sx={{ mt: 3 }}
          >
            Kayıt Ol
          </Button>
        </form>

        <Typography variant="body2" sx={{ mt: 2 }}>
          Zaten hesabınız var mı?{" "}
          <Button
            sx={{ color: "#786af2", textTransform: "none" }}
            onClick={() => navigate("/login")}
          >
            Giriş Yap
          </Button>
        </Typography>
      </Grid>
    </Grid>
  );
};

export default Register;