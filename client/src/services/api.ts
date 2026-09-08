import axios from 'axios';
import storage from './storage';

import { Platform } from 'react-native';

// Current machine IP for physical devices: 10.165.231.106
// For Web browser: localhost
const DEV_MACHINE_IP = '10.165.231.106';

export const SERVER_HOST = Platform.OS === 'web' 
  ? 'http://localhost:5000' 
  : `http://${DEV_MACHINE_IP}:5000`;

export const BASE_URL = `${SERVER_HOST}/api/v1`;

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

  // Then check for an Operator JWT
  const token = await storage.getItem('operatorToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

export default api;
