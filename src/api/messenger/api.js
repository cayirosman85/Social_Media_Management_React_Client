import { cookies } from "../../utils/cookie"; // Adjust path as needed

const BASE_URL = 'https://localhost:7099';

// const BASE_URL = 'https://c91e-176-41-29-228.ngrok-free.app';
// const BASE_URL = 'https://appmyvoipcrm.softether.net';

export const apiFetch = async (endpoint, options = {}) => {
  let token = cookies.get("jwt-access");
  if (token) {
    token = token.replace(/"/g, ''); // Remove any quotes from token
  } else {
    token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJuYW1laWQiOiIzMmVkZGEyNC03YWYwLTRiNzktYTVhOC1lNTA1MDYyNDQ3ZDQiLCJ1bmlxdWVfbmFtZSI6IjkwODUwNTMyNTk4NiIsImVtYWlsIjoiaGFzYW5jb3NrdW5hcnNsYW5AZ21haWwuY29tIiwibmJmIjoxNzQ0NDYwMzgyLCJleHAiOjE3NDQ1NDY3ODIsImlhdCI6MTc0NDQ2MDM4MiwiaXNzIjoiTWVzc2VuZ2VyIiwiYXVkIjoiTWVzc2VuZ2VyIn0.fmQAuUdlnO6UlzPmxb7I2WtA-QhKEaBYwPZNJDous9M";
  }
  console.log('Token before request:', token);

  const defaultHeaders = {
    'ngrok-skip-browser-warning': 'true',
  };
  if (token) {
    defaultHeaders['Authorization'] = `Bearer ${token}`;
  } else {
    console.log('No token found in cookies');
  }

  // Only set Content-Type for non-FormData requests
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
    if (isFormData) {
      console.log('FormData contents:');
      for (let [key, value] of options.body.entries()) {
        console.log(`${key}: ${value instanceof File ? `${value.name} (${value.size} bytes)` : value}`);
      }
    } else if (options.body) {
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
      } else {
        errorData = { error: `HTTP error! Status: ${response.status}` };
      }
      if (response.status === 401) {
        console.log('Unauthorized - Clearing token and redirecting to login');
        cookies.remove('jwt-access');
        throw new Error(`Yetkiniz yok`);
      }
      throw new Error(errorData.error || `HTTP error! Status: ${response.status}`);
    }

    return text ? JSON.parse(text) : {};
  } catch (error) {
    console.error(`API request failed: ${endpoint}`, error);
    throw error;
  }
};