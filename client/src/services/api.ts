import axios from 'axios';
import storage from './storage';

import { Platform } from 'react-native';

import Constants from 'expo-constants';

// Detect IP dynamically from Expo packager host or fallback to current local Wi-Fi IP
const getDevMachineIp = () => {
  const hostUri = Constants.expoConfig?.hostUri || (Constants as any).manifest?.debuggerHost || (Constants as any).manifest2?.extra?.expoGo?.debuggerHost;
  // If hostUri is an ngrok or Expo tunnel domain, it only tunnels Metro (port 8081), so fallback to local Wi-Fi IP for the backend API
  if (hostUri && !hostUri.includes('exp.direct') && !hostUri.includes('ngrok') && !hostUri.includes('expo.dev')) {
    const candidate = hostUri.split(':')[0];
    // Ensure candidate looks like an IP address
    if (/^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(candidate) && candidate !== '127.0.0.1') {
      return candidate;
    }
  }
  return '10.197.7.106';
};

const DEV_MACHINE_IP = getDevMachineIp();

export const SERVER_HOST = Platform.OS === 'web' 
  ? 'http://localhost:5000' 
  : `http://${DEV_MACHINE_IP}:5000`;

export const BASE_URL = `${SERVER_HOST}/api/v1`;

console.log('⚡ VoltRescue API Base URL:', BASE_URL);

const api = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
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
