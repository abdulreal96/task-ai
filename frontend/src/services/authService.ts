import api from './api';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface RegisterData {
  fullName: string;
  email: string;
  password: string;
  colorScheme?: string;
  darkMode?: boolean;
}

export interface LoginData {
  email: string;
  password: string;
}

export interface AuthResponse {
  message: string;
  accessToken: string;
  refreshToken: string;
}

export interface User {
  _id: string;
  fullName: string;
  email: string;
  colorScheme: string;
  darkMode: boolean;
  isEmailVerified: boolean;
  preferences: any;
  createdAt: string;
  updatedAt: string;
}

export const authService = {
  async register(data: RegisterData): Promise<{ message: string }> {
    const response = await api.post('/auth/register', data);
    return response.data;
  },

  async verifyOTP(email: string, otp: string): Promise<AuthResponse> {
    const response = await api.post('/auth/verify-otp', { email, otp });
    const { accessToken, refreshToken } = response.data;
    
    await AsyncStorage.setItem('accessToken', accessToken);
    await AsyncStorage.setItem('refreshToken', refreshToken);
    
    return response.data;
  },

  async resendOTP(email: string): Promise<{ message: string }> {
    const response = await api.post('/auth/resend-otp', { email });
    return response.data;
  },

  async login(data: LoginData): Promise<AuthResponse> {
    const response = await api.post('/auth/login', data);
    const { accessToken, refreshToken } = response.data;
    
    await AsyncStorage.setItem('accessToken', accessToken);
    await AsyncStorage.setItem('refreshToken', refreshToken);
    
    return response.data;
  },

  async logout(): Promise<void> {
    try {
      await api.post('/auth/logout');
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      await AsyncStorage.multiRemove(['accessToken', 'refreshToken', 'user']);
    }
  },

  async getMe(): Promise<User> {
    const response = await api.post('/auth/me');
    const user = response.data;
    await AsyncStorage.setItem('user', JSON.stringify(user));
    return user;
  },

  async isAuthenticated(): Promise<boolean> {
    const token = await AsyncStorage.getItem('accessToken');
    return !!token;
  },
};
