
import React, { useEffect, useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Container,
  TextField,
  Button,
  Typography,
  Box,
  CircularProgress,
  Paper
} from '@mui/material';
import Swal from 'sweetalert2';
import { upsertMessengerAccount, getMessengerAccount } from '../../../api/messenger/api.js';

const MessengerAccount = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { control, handleSubmit, reset, formState: { errors } } = useForm({
    defaultValues: {
      Id: 0,
      pageName: '',
      facebookPageId: '',
      messengerAccessToken: '',
      messengerAppId: '',
      facebookAppSecret: '',
      graphApiVersion: ''
    }
  });
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);

  // Fetch account on load
  useEffect(() => {
    const fetchAccount = async () => {
      setFetching(true);
      try {
        const account = await getMessengerAccount();
        reset({
          Id: account.Id || 0,
          pageName: account.pageName || '',
          facebookPageId: account.facebookPageId || '',
          messengerAccessToken: account.messengerAccessToken || '',
          messengerAppId: account.messengerAppId || '',
          facebookAppSecret: account.facebookAppSecret || '',
          graphApiVersion: account.graphApiVersion || ''
        });
        console.log('Fetched account:', account);
      } catch (error) {
        if (error.message.includes('Messenger hesabı bulunamadı')) {
          console.log('No existing account, starting with empty form');
          reset({
            Id: 0,
            pageName: '',
            facebookPageId: '',
            messengerAccessToken: '',
            messengerAppId: '',
            facebookAppSecret: '',
            graphApiVersion: ''
          });
        } else {
          console.error('Fetch error:', error);
          Swal.fire({
            title: 'Hata',
            text: error.message === 'Yetkiniz yok' ? 'Yetkiniz yok' : `Hata: ${error.message}`,
            icon: 'error',
            confirmButtonText: 'Tamam'
          });
          if (error.message === 'Yetkiniz yok') {
            navigate('/login');
          }
        }
      } finally {
        setFetching(false);
      }
    };

    // Prioritize location.state if provided
    if (location.state?.account) {
      reset(location.state.account);
      setFetching(false);
    } else {
      fetchAccount();
    }
  }, [ reset, navigate]);

  const onSubmit = async (data) => {
    setLoading(true);
    try {
      const response = await upsertMessengerAccount(data);
      Swal.fire({
        title: 'Başarılı',
        text: data.Id === 0 ? 'Messenger hesabı eklendi!' : 'Messenger hesabı güncellendi!',
        icon: 'success',
        confirmButtonText: 'Tamam'
      }).then(() => {
        navigate('/homepage');
      });
      console.log('Upsert response:', response);
    } catch (error) {
      console.error('Upsert error:', error);
      Swal.fire({
        title: 'Hata',
        text: error.message === 'Yetkiniz yok' ? 'Yetkiniz yok' : `Hata: ${error.message}`,
        icon: 'error',
        confirmButtonText: 'Tamam'
      });
      if (error.message === 'Yetkiniz yok') {
        navigate('/login');
      }
    } finally {
      setLoading(false);
    }
  };

  if (fetching) {
    return (
      <Container maxWidth="sm" sx={{ mt: 4, textAlign: 'center' }}>
        <CircularProgress />
        <Typography variant="h6" sx={{ mt: 2 }}>
          Hesap bilgileri yükleniyor...
        </Typography>
      </Container>
    );
  }

  return (
    <Container sx={{ mt: 4, display: 'flex', justifyContent: 'flex-start' }}>
      <Paper elevation={3} sx={{ p: 4 }}>
        <Typography variant="h4" gutterBottom align="center">
          Messenger Hesabı 
        </Typography>
        <Box component="form" onSubmit={handleSubmit(onSubmit)} noValidate>
          <Controller
            name="pageName"
            control={control}
            rules={{ required: 'Sayfa adı zorunludur' }}
            render={({ field }) => (
              <TextField
                {...field}
                label="Facebook Sayfa Adı"
                fullWidth
                margin="normal"
                error={!!errors.PageName}
                helperText={errors.PageName?.message}
              />
            )}
          />
          <Controller
            name="facebookPageId"
            control={control}
            rules={{ required: 'Facebook Sayfa ID zorunludur' }}
            render={({ field }) => (
              <TextField
                {...field}
                label="Facebook Sayfa ID"
                fullWidth
                margin="normal"
                error={!!errors.facebookPageId}
                helperText={errors.facebookPageId?.message}
              />
            )}
          />
          <Controller
            name="messengerAccessToken"
            control={control}
            rules={{ required: 'Messenger Token zorunludur' }}
            render={({ field }) => (
              <TextField
                {...field}
                label="Messenger Token"
                fullWidth
                margin="normal"
                error={!!errors.MessengerAccessToken}
                helperText={errors.MessengerAccessToken?.message}
              />
            )}
          />
          <Controller
            name="messengerAppId"
            control={control}
            render={({ field }) => (
              <TextField
                {...field}
                label="Facebook Uygulama ID"
                fullWidth
                margin="normal"
                error={!!errors.messengerAppId}
                helperText={errors.messengerAppId?.message}
              />
            )}
          />
          <Controller
            name="facebookAppSecret"
            control={control}
            render={({ field }) => (
              <TextField
                {...field}
                label="Facebook Uygulama Gizli ID"
                fullWidth
                margin="normal"
                error={!!errors.facebookAppSecret}
                helperText={errors.facebookAppSecret?.message}
              />
            )}
          />
          <Controller
            name="graphApiVersion"
            control={control}
            render={({ field }) => (
              <TextField
                {...field}
                label="Facebook Graph Versiyonu"
                fullWidth
                margin="normal"
                error={!!errors.graphApiVersion}
                helperText={errors.graphApiVersion?.message}
              />
            )}
          />
          <Box sx={{ mt: 2, display: 'flex', justifyContent: 'center' }}>
            <Button
              type="submit"
              variant="contained"
              color="primary"
              disabled={loading}
              startIcon={loading ? <CircularProgress size={20} /> : null}
            >
              {loading ? 'Kaydediliyor...' : 'Kaydet'}
            </Button>
          </Box>
        </Box>
      </Paper>
    </Container>
  );
};

export default MessengerAccount;