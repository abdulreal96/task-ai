import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
import { Platform } from 'react-native';

/**
 * API URL Configuration
 * - Development mode (Metro): Uses your PC's local IP address
 * - Production builds: Uses production server from app.json extra.apiUrl
 */
const getApiUrl = () => {
  // Check if running in development mode with Metro
  const isDevelopment = __DEV__;
  
  if (isDevelopment) {
    // Development mode - use your PC's local IP
    // This works for both Android emulator and physical devices on same network
    return 'http://10.222.100.104:3000';
  }
  
  // Production build - use configured API URL
  return Constants.expoConfig?.extra?.apiUrl || 'https://task-ai.ilimtutor.com';
};

const API_URL = getApiUrl();

console.log('[API Config] Environment:', __DEV__ ? 'Development' : 'Production');
console.log('[API Config] Using API URL:', API_URL);

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  async (config) => {
    const token = await AsyncStorage.getItem('accessToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle token refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = await AsyncStorage.getItem('refreshToken');
        if (refreshToken) {
          const response = await axios.post(`${API_URL}/auth/refresh`, {
            refreshToken,
          });

          const { accessToken, refreshToken: newRefreshToken } = response.data;
          await AsyncStorage.setItem('accessToken', accessToken);
          await AsyncStorage.setItem('refreshToken', newRefreshToken);

          originalRequest.headers.Authorization = `Bearer ${accessToken}`;
          return api(originalRequest);
        }
      } catch (refreshError) {
        // Refresh failed, logout user
        await AsyncStorage.multiRemove(['accessToken', 'refreshToken', 'user']);
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export default api;
