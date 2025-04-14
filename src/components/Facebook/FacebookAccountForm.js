import React, { useState, useEffect } from 'react';
import {
  TextField,
  Button,
  Grid,
  Typography,
  Box,
  CircularProgress,
  Paper,
} from '@mui/material';
import { Save, Cancel } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

const FacebookAccountForm = ({ initialData = {}, onSubmit, isEdit = false, loading = false }) => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    id: 0,
    facebookAppName: '',
    facebookAppId: '',
    facebookLongLiveAccessToken: '',
    longLiveAccessTokenCreatedAt: '',
    facebookAppSecret: '',
    graphApiVersion: '',
    companyId: '',
  });
  const [errors, setErrors] = useState({});
  const [isInitialized, setIsInitialized] = useState(false); // Track initialization

  // Initialize formData only once on mount or when initialData first loads
  useEffect(() => {
    if (!isInitialized && Object.keys(initialData).length > 0) {
      setFormData({
        id: initialData.id || 0,
        facebookAppName: initialData.facebookAppName || '',
        facebookAppId: initialData.facebookAppId || '',
        facebookLongLiveAccessToken: initialData.facebookLongLiveAccessToken || '',
        longLiveAccessTokenCreatedAt:
          initialData.longLiveAccessTokenCreatedAt?.split('T')[0] || '',
        facebookAppSecret: initialData.facebookAppSecret || '',
        graphApiVersion: initialData.graphApiVersion || '',
        companyId: initialData.companyId?.toString() || '',
      });
      setIsInitialized(true);
    }
  }, [initialData, isInitialized]);

  // Handle input changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: '' }));
  };

  // Validate form fields
  const validateForm = () => {
    const newErrors = {};
    if (!formData.facebookAppName) newErrors.facebookAppName = 'App Adı gerekli';
    if (!formData.facebookAppId) newErrors.facebookAppId = 'App ID gerekli';
    if (!formData.companyId) newErrors.companyId = 'Şirket ID gerekli';
    else if (isNaN(parseInt(formData.companyId))) newErrors.companyId = 'Geçerli bir Şirket ID girin';
    if (formData.longLiveAccessTokenCreatedAt && !isValidDate(formData.longLiveAccessTokenCreatedAt)) {
      newErrors.longLiveAccessTokenCreatedAt = 'Geçerli bir tarih girin';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Validate date format
  const isValidDate = (dateString) => {
    const date = new Date(dateString);
    return !isNaN(date.getTime());
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    try {
      const success = await onSubmit({
        ...formData,
        companyId: parseInt(formData.companyId),
        longLiveAccessTokenCreatedAt: formData.longLiveAccessTokenCreatedAt || null,
      });
      if (success) {
        navigate('/facebook-accounts');
      }
    } catch (error) {
      setErrors({ submit: error.message || 'Bir hata oluştu' });
    }
  };

  return (
    <Box sx={{ mt: 4, p: 3, maxWidth: '800px', margin: 'auto' }}>
      <Paper elevation={3} sx={{ p: 4, borderRadius: 2 }}>
        <Typography variant="h5" gutterBottom sx={{ fontWeight: 'bold', color: '#1976d2' }}>
          {isEdit ? 'Facebook Hesabını Düzenle' : 'Yeni Facebook Hesabı Oluştur'}
        </Typography>
        {errors.submit && (
          <Typography color="error" sx={{ mb: 2 }}>
            {errors.submit}
          </Typography>
        )}
        <Box component="form" onSubmit={handleSubmit} noValidate>
          <Grid container spacing={3}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Facebook App Adı"
                name="facebookAppName"
                value={formData.facebookAppName}
                onChange={handleChange}
                error={!!errors.facebookAppName}
                helperText={errors.facebookAppName}
                required
                variant="outlined"
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Facebook App ID"
                name="facebookAppId"
                value={formData.facebookAppId}
                onChange={handleChange}
                error={!!errors.facebookAppId}
                helperText={errors.facebookAppId}
                required
                variant="outlined"
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Uzun Ömürlü Erişim Jetonu"
                name="facebookLongLiveAccessToken"
                value={formData.facebookLongLiveAccessToken}
                onChange={handleChange}
                error={!!errors.facebookLongLiveAccessToken}
                helperText={errors.facebookLongLiveAccessToken}
                variant="outlined"
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Jeton Oluşturulma Tarihi"
                name="longLiveAccessTokenCreatedAt"
                type="date"
                value={formData.longLiveAccessTokenCreatedAt}
                onChange={handleChange}
                error={!!errors.longLiveAccessTokenCreatedAt}
                helperText={errors.longLiveAccessTokenCreatedAt}
                InputLabelProps={{ shrink: true }}
                variant="outlined"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Facebook App Secret"
                name="facebookAppSecret"
                value={formData.facebookAppSecret}
                onChange={handleChange}
                error={!!errors.facebookAppSecret}
                helperText={errors.facebookAppSecret}
                variant="outlined"
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Graph API Versiyonu"
                name="graphApiVersion"
                value={formData.graphApiVersion}
                onChange={handleChange}
                error={!!errors.graphApiVersion}
                helperText={errors.graphApiVersion}
                variant="outlined"
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Şirket ID"
                name="companyId"
                type="number"
                value={formData.companyId}
                onChange={handleChange}
                error={!!errors.companyId}
                helperText={errors.companyId}
                required
                variant="outlined"
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
          </Grid>
          <Box sx={{ mt: 4, display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
            <Button
              type="submit"
              variant="contained"
              color="primary"
              startIcon={<Save />}
              disabled={loading}
              sx={{ minWidth: 120 }}
            >
              {loading ? <CircularProgress size={24} /> : isEdit ? 'Güncelle' : 'Oluştur'}
            </Button>
            <Button
              variant="outlined"
              color="secondary"
              startIcon={<Cancel />}
              onClick={() => navigate('/facebook-accounts')}
              disabled={loading}
            >
              İptal
            </Button>
          </Box>
        </Box>
      </Paper>
    </Box>
  );
};

export default FacebookAccountForm;