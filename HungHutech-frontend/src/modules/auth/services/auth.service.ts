/**
 * Hung Hutech - Hệ thống Quản lý Nhân sự
 * Copyright (C) 2024 Hung Hutech
 */

import axios from 'axios';

// Base API URL
const API_BASE_URL = 'http://localhost:5000/api';

// Create axios instance
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests if available
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  },
);

// Response interceptor for handling 401 errors
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid - clear storage and redirect to login
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/auth/login';
    }
    return Promise.reject(error);
  },
);

// Auth API interfaces
export interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  user: {
    id: string;
    username: string;
    email: string;
    firstName: string;
    lastName: string;
    role: string;
  };
}

export interface ForgotPasswordRequest {
  email: string;
}

export interface ResetPasswordRequest {
  token: string;
  password: string;
}

// Auth Service
export const login = async (
  username: string,
  password: string,
): Promise<LoginResponse> => {
  const response = await apiClient.post<LoginResponse>('/auth/login', {
    username,
    password,
  });
  return response.data;
};

export const logout = async (): Promise<void> => {
  try {
    await apiClient.post('/auth/logout');
  } finally {
    // Clear local storage regardless of API response
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  }
};

export const forgotPassword = async (
  email: string,
): Promise<{message: string}> => {
  const response = await apiClient.post<{message: string}>(
    '/auth/forgot-password',
    {
      email,
    },
  );
  return response.data;
};

export const resetPassword = async (
  token: string,
  password: string,
): Promise<{message: string}> => {
  const response = await apiClient.post<{message: string}>(
    '/auth/reset-password',
    {
      token,
      password,
    },
  );
  return response.data;
};

export const validateToken = async (): Promise<boolean> => {
  try {
    await apiClient.get('/auth/validate');
    return true;
  } catch {
    return false;
  }
};

export const getCurrentUser = (): any => {
  const userStr = localStorage.getItem('user');
  return userStr ? JSON.parse(userStr) : null;
};

export const isAuthenticated = (): boolean => {
  return !!localStorage.getItem('token');
};

export default apiClient;
