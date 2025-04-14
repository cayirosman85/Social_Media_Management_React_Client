import React, { useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { apiFetch } from '../../../api/facebook/api';
import FacebookAccountForm from '../../../components/Facebook/FacebookAccountForm';

const FacebookAccountCreateForInstagram = () => {
  const [loading, setLoading] = useState(false);
  const context = useOutletContext();
  const setErrorModalMessage = context?.setErrorModalMessage;

  const handleSubmit = async (formData) => {
    setLoading(true);
    try {
      await apiFetch('/api/FacebookAccount', {
        method: 'POST',
        body: JSON.stringify(formData),
      });
      if (setErrorModalMessage) {
        setErrorModalMessage('Hesap başarıyla oluşturuldu');
      }
      return true;
    } catch (error) {
      const errorMessage = error.message || 'Hesap oluşturulamadı';
      if (setErrorModalMessage) {
        setErrorModalMessage(errorMessage);
      }
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const initialData = {};

  return <FacebookAccountForm onSubmit={handleSubmit} loading={loading} initialData={initialData} />;
};

export default FacebookAccountCreateForInstagram;