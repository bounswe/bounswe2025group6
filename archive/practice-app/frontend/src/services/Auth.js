// src/utils/Auth.js
import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000'

const AUTH_TOKEN_KEY = 'fithub_access_token';
const REFRESH_TOKEN_KEY = 'fithub_refresh_token';

export const getAuthToken = () => {
  return localStorage.getItem(AUTH_TOKEN_KEY);
};

export const setAuthToken = (token) => {
  localStorage.setItem(AUTH_TOKEN_KEY, token);
};

export const removeAuthToken = () => {
  localStorage.removeItem(AUTH_TOKEN_KEY);
};

export const getRefreshToken = () => {
  return localStorage.getItem(REFRESH_TOKEN_KEY);
};

export const setRefreshToken = (token) => {
  localStorage.setItem(REFRESH_TOKEN_KEY, token);
};

export const removeRefreshToken = () => {
  localStorage.removeItem(REFRESH_TOKEN_KEY);
};

export const refreshAuthToken = async () => {
  const refreshToken = getRefreshToken();
  
  if (!refreshToken) {
    throw new Error('No refresh token available');
  }
  
  try {
    const response = await axios.post(`${API_BASE}/api/token/refresh/`, {
      refresh: refreshToken
    });
    
    const { access } = response.data;
    setAuthToken(access);
    
    return access;
  } catch (error) {
    removeAuthToken();
    removeRefreshToken();
    throw error;
  }
};

export const clearAuthTokens = () => {
  removeAuthToken();
  removeRefreshToken();
};

export const isAuthenticated = () => {
  return !!getAuthToken();
};

export default {
  getAuthToken,
  setAuthToken,
  removeAuthToken,
  getRefreshToken,
  setRefreshToken,
  removeRefreshToken,
  refreshAuthToken,
  clearAuthTokens,
  isAuthenticated
};
