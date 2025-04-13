import { cookies } from "../../utils/cookie";

// const BASE_URL = 'https://c91e-176-41-29-228.ngrok-free.app';
const BASE_URL = 'https://localhost:7099';
export const apiFetch = async (endpoint, options = {}) => {
  let token = cookies.get("jwt-access");
  if (token) {
    token = token.replace(/"/g, '');
  } else {
    console.log('No token found in cookies');
    throw new Error('Kimlik doğrulama jetonu eksik');
  }
  console.log('Token before request:', token);

  const defaultHeaders = {
    'ngrok-skip-browser-warning': 'true',
    'Authorization': `Bearer ${token}`
  };

  const isFormData = options.body instanceof FormData;
  if (!isFormData) {
    defaultHeaders['Content-Type'] = 'application/json';
  }

  const headers = { ...defaultHeaders, ...options.headers };
  console.log('Final request headers:', JSON.stringify(headers, null, 2));

  const config = {
    ...options,
    headers,
    credentials: 'include',
  };
  const url = `${BASE_URL}${endpoint}`;

  try {
    console.log(`Sending request to ${url} with method: ${options.method || 'GET'}`);
    if (options.body && !isFormData) {
      console.log('Request body:', options.body);
    }

    const response = await fetch(url, config);
    console.log(`Request to ${url} - Status: ${response.status}`);
    const text = await response.text();
    console.log(`Raw response: ${text}`);

    if (!response.ok) {
      let errorData = {};
      if (text) {
        try {
          errorData = JSON.parse(text);
        } catch (e) {
          throw new Error(`HTTP error! Status: ${response.status}, Body: ${text || 'No response body'}`);
        }
      }
      if (response.status === 401) {
        console.log('Unauthorized - Clearing token');
        cookies.remove('jwt-access');
        throw new Error('Yetkiniz yok');
      }
      throw new Error(errorData.Error || `HTTP error! Status: ${response.status}`);
    }

    return text ? JSON.parse(text) : {};
  } catch (error) {
    console.error(`API request failed: ${endpoint}`, error);
    throw error;
  }
};

// Upsert Messenger Account
export const upsertMessengerAccount = async (accountData) => {
  return await apiFetch('/api/MessengerAccount/upsert', {
    method: 'POST',
    body: JSON.stringify(accountData)
  });
};

// Get Messenger Account
export const getMessengerAccount = async () => {
  return await apiFetch('/api/MessengerAccount', {
    method: 'GET'
  });
};