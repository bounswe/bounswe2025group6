// src/services/userService.js
import axios from 'axios';

// Create an axios instance
const api = axios.create({
  baseURL: 'http://127.0.0.1:8000',
});

// Add auth token to all requests
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('fithub_access_token');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
      console.log("Adding auth token to request:", config.url);
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

const userService = {
  // Get user profile by ID
  getUserById: async (userId) => {
    try {
      console.log(`Fetching user with ID: ${userId}`);
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
      console.log('Fetching current user profile');
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
      console.log('Updating user profile with data:', userData);
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
      console.log('Fetching user settings');
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
      console.log('Updating user settings with data:', settingsData);
      const response = await api.patch('/api/users/settings/', settingsData);
      return response.data;
    } catch (error) {
      console.error('Error updating user settings:', error);
      throw error;
    }
  }
};

export default userService;