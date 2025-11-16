// src/services/analyticsService.js

import axios from 'axios';

// Create an axios instance aligned with other services
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
});

// Attach auth token if available (analytics endpoint may be public, but keeping for consistency)
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('fithub_access_token');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

const analyticsService = {
  /**
   * Fetches anonymized system-level analytics
   * Returns counts of users, recipes, ingredients, forum posts, and comments
   * @returns {Promise<Object>} Analytics data with users_count, recipes_count, ingredients_count, posts_count, comments_count
   */
  getAnalytics: async () => {
    try {
      const response = await api.get('/analytics/analytics/');
      return response.data;
    } catch (error) {
      console.error('Error fetching analytics:', error);
      throw error;
    }
  }
};

export default analyticsService;
