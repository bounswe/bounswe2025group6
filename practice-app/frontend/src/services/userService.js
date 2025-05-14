// src/services/userService.js
import axios from 'axios';

// Create an axios instance
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
});

// Add auth token to all requests
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('fithub_access_token');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    else {
      console.warn("No auth token found for request:", config.url);
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

const getUsername = async (userId) => {
  if (!userId || userId === 0) return 'Unknown';
  
  try {
    const response = await api.get(`/api/users/${userId}/`);
    return response.data.username || 'Unknown';
  } catch (error) {
    console.error('Error fetching username:', error);
    return 'Unknown';
  }
};

const userService = {
  // Get user profile by ID
  getUserById: async (userId) => {
    try {
      const response = await api.get(`/api/users/${userId}/`);
      return response.data;
    } catch (error) {
      console.error('Error fetching user details:', error);
      throw error;
    }
  },

  // Get current user profile
  getCurrentUser: async () => {
    try {
      const response = await api.get('/api/users/me/');
      return response.data;
    } catch (error) {
      console.error('Error fetching current user profile:', error);
      throw error;
    }
  },

  // Update user profile
  updateProfile: async (userData) => {
    try {
      const response = await api.patch('/api/users/me/', userData);
      return response.data;
    } catch (error) {
      console.error('Error updating user profile:', error);
      throw error;
    }
  },

  // Get user's settings
  getUserSettings: async () => {
    try {
      const response = await api.get('/api/users/settings/');
      return response.data;
    } catch (error) {
      console.error('Error fetching user settings:', error);
      throw error;
    }
  },

  // Update user's settings
  updateUserSettings: async (settingsData) => {
    try {
      const response = await api.patch('/api/users/settings/', settingsData);
      return response.data;
    } catch (error) {
      console.error('Error updating user settings:', error);
      throw error;
    }
  },

  getUsername,
};

export default userService;
