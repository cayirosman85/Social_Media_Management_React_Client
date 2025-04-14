import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, useNavigate, useOutletContext } from 'react-router-dom';
import { apiFetch } from '../../../api/facebook/api';
import FacebookAccountForm from '../../../components/Facebook/FacebookAccountForm';
import { Typography, Box, CircularProgress } from '@mui/material';

const InstagramMessengerAccountEdit = () => {
  const { companyId } = useParams();
  const navigate = useNavigate();
  const [account, setAccount] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [localError, setLocalError] = useState('');
  const context = useOutletContext();
  const setErrorModalMessage = context?.setErrorModalMessage;

  // Debug context and re-renders
  useEffect(() => {
    console.log('Edit Context:', context);
    if (!setErrorModalMessage) {
      console.warn('setErrorModalMessage is not available. Using local error state.');
    }
  }, [context, setErrorModalMessage]);

  // Fetch account data
  const fetchAccount = useCallback(async () => {
    setLoading(true);
    try {
      const data = await apiFetch(`/api/InstagramMessengerAccount/${companyId}`);
      console.log('Fetched Account:', data); // Debug fetched data
      setAccount(data);
      setLocalError('');
    } catch (err) {
      const errorMessage = err.message || 'Hesap alınamadı';
      setLocalError(errorMessage);
      if (setErrorModalMessage) {
        setErrorModalMessage(errorMessage);
      }
    } finally {
      setLoading(false);
    }
  }, [companyId, setErrorModalMessage]);

  // Load account on mount
  useEffect(() => {
    fetchAccount();
  }, [fetchAccount]);

  // Handle form submission
  const handleSubmit = async (formData) => {
    setSubmitLoading(true);
    try {
      await apiFetch(`/api/FacebookAccount/${companyId}`, {
        method: 'PUT',
        body: JSON.stringify({ ...formData, companyId: parseInt(companyId) }),
      });
      if (setErrorModalMessage) {
        setErrorModalMessage('Hesap başarıyla güncellendi');
      }
      return true;
    } catch (err) {
      const errorMessage = err.message || 'Hesap güncellenemedi';
      if (setErrorModalMessage) {
        setErrorModalMessage(errorMessage);
      }
      throw new Error(errorMessage);
    } finally {
      setSubmitLoading(false);
    }
  };

  // Memoize initialData to prevent reference changes
  const initialData = useMemo(() => account || {}, [account]);

  // Show loading spinner
  if (loading) {
    return (
      <Box sx={{ mt: 4, display: 'flex', justifyContent: 'center' }}>
        <CircularProgress />
      </Box>
    );
  }

  // Show error if no account
  if (localError && !account) {
    return (
      <Box sx={{ mt: 4, p: 3, maxWidth: '800px', margin: 'auto' }}>
        <Typography color="error" variant="h6" align="center">
          {localError}
        </Typography>
      </Box>
    );
  }

  return (
    <FacebookAccountForm
      initialData={initialData}
      onSubmit={handleSubmit}
      isEdit={true}
      loading={submitLoading}
    />
  );
};

export default InstagramMessengerAccountEdit;