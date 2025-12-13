// src/services/activityStreamService.js

import axios from "axios";

// Create an axios instance
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
});

// Add auth token to all requests
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("fithub_access_token");
    if (token) {
      config.headers["Authorization"] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

const activityStreamService = {
  /**
   * Fetches activities from the activity stream
   * @param {Object} params - Query parameters
   * @param {number} params.page - Page number (default: 1)
   * @param {number} params.page_size - Items per page (default: 20, max: 100)
   * @param {string} params.activity_type - Filter by type: recipe, post, comment, question, answer
   * @returns {Promise<Object>} Paginated response with activities
   */
  getActivities: async ({
    page = 1,
    page_size = 20,
    activity_type = null,
  } = {}) => {
    try {
      const params = { page, page_size };
      if (activity_type) {
        params.activity_type = activity_type;
      }

      const response = await api.get("/api/activity-stream/", { params });
      return response.data;
    } catch (error) {
      console.error("Error fetching activity stream:", error);
      throw error;
    }
  },
};

export default activityStreamService;
