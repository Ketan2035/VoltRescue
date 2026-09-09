import axios from 'axios';
import storage from './storage';

// Production Render Backend URL
export const SERVER_HOST = 'https://voltrescue-6mzf.onrender.com';

export const BASE_URL = `${SERVER_HOST}/api/v1`;

console.log('⚡ VoltRescue Live Backend URL:', BASE_URL);

const api = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 15000,
});

api.interceptors.request.use(async (config) => {
  // First check for a Guest Session ID
  const guestId = await storage.getItem('guestSessionId');
  if (guestId) {
    config.headers['x-guest-session-id'] = guestId;
  }

  // Check for JWT token (operator or customer)
  const operatorToken = await storage.getItem('operatorToken');
  const customerToken = await storage.getItem('customerToken');
  const token = operatorToken || customerToken;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('🚨 [API Request Error]:', {
      url: error?.config?.url,
      baseURL: error?.config?.baseURL,
      method: error?.config?.method,
      status: error?.response?.status,
      data: error?.response?.data,
      message: error?.message,
    });
    return Promise.reject(error);
  }
);

export default api;
