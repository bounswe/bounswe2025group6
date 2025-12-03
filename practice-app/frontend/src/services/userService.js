// src/services/userService.js
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
    } else {
      console.warn("No auth token found for request:", config.url);
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export const getUsername = async (userId) => {
  if (!userId || userId === 0) return "Unknown";

  try {
    const response = await api.get(`/api/users/${userId}/`);
    console.log("Fetched user:", response.data);
    return response.data.username || "Unknown";
  } catch (error) {
    console.error("Error fetching username:", error);
    return "Unknown";
  }
};

const userService = {
  // Get user profile by ID
  getUserById: async (userId) => {
    try {
      const response = await api.get(`/api/users/${userId}/`);
      return response.data;
    } catch (error) {
      console.error("Error fetching user details:", error);
      throw error;
    }
  },

  // Update user profile
  updateUserById: async (userId, userData) => {
    try {
      const response = await api.patch(`/api/users/${userId}/`, userData);
      return response.data;
    } catch (error) {
      console.error("Error updating user details:", error);
      throw error;
    }
  },

  // Get current user profile
  getCurrentUser: async (userId) => {
    try {
      if (!userId) {
        throw new Error("User ID is required");
      }
      const response = await api.get(`/api/users/${userId}/`);
      return response.data;
    } catch (error) {
      console.error("Error fetching current user profile:", error);
      throw error;
    }
  },

  // Update user profile
  updateProfile: async (userId, userData) => {
    try {
      if (!userId) {
        throw new Error("User ID is required");
      }
      const response = await api.patch(`/api/users/${userId}/`, userData);
      return response.data;
    } catch (error) {
      console.error("Error updating user profile:", error);
      throw error;
    }
  },

  // Get user's settings
  getUserSettings: async () => {
    try {
      const response = await api.get("/api/users/settings/");
      return response.data;
    } catch (error) {
      console.error("Error fetching user settings:", error);
      throw error;
    }
  },

  // Update user's settings
  updateUserSettings: async (settingsData) => {
    try {
      const response = await api.patch("/api/users/settings/", settingsData);
      return response.data;
    } catch (error) {
      console.error("Error updating user settings:", error);
      throw error;
    }
  },

  getUsername,

  // Get user recipe count and badge
  getUserRecipeCount: async (userId) => {
    try {
      const response = await api.get(`/recipes/user/${userId}/recipe-count/`);
      return response.data;
    } catch (error) {
      console.error("Error fetching user recipe count:", error);
      // Return default values if error
      return { user_id: userId, recipe_count: 0, badge: null };
    }
  },

  // Upload profile photo (convert to base64 data URL and update)
  // Note: Backend expects URLField, but we send data URL which may not be accepted
  // If backend rejects it, we need a proper image upload endpoint
  uploadProfilePhoto: async (userId, imageFile) => {
    try {
      // Convert file to base64 data URL
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = async () => {
          try {
            // reader.result is in data URL format (data:image/jpeg;base64,...)
            const dataUrl = reader.result;
            // Try to update user profile with data URL
            // Backend URLField may not accept data URLs, but we try anyway
            const response = await api.patch(`/api/users/${userId}/`, {
              profilePhoto: dataUrl
            });
            resolve(response.data);
          } catch (error) {
            console.error("Error in uploadProfilePhoto:", error);
            // Provide better error message
            if (error.response?.status === 400) {
              const errorMsg = error.response?.data?.profilePhoto?.[0] || 
                              error.response?.data?.error ||
                              'Backend does not accept this image format. Please contact support.';
              error.message = errorMsg;
            }
            reject(error);
          }
        };
        reader.onerror = reject;
        reader.readAsDataURL(imageFile);
      });
    } catch (error) {
      console.error("Error uploading profile photo:", error);
      throw error;
    }
  },

  // Delete profile photo (set to null)
  deleteProfilePhoto: async (userId) => {
    try {
      const response = await api.patch(`/api/users/${userId}/`, {
        profilePhoto: null
      });
      return response.data;
    } catch (error) {
      console.error("Error deleting profile photo:", error);
      throw error;
    }
  },

  // Update username
  updateUsername: async (userId, newUsername) => {
    try {
      const response = await api.patch(`/api/users/${userId}/`, {
        username: newUsername
      });
      return response.data;
    } catch (error) {
      console.error("Error updating username:", error);
      throw error;
    }
  },

  // Check if username is available
  checkUsernameAvailability: async (username) => {
    try {
      // Get all users and check if username exists
      const response = await api.get(`/api/users/`);
      const users = response.data.results || [];
      const usernameExists = users.some(user => user.username.toLowerCase() === username.toLowerCase());
      return !usernameExists;
    } catch (error) {
      console.error("Error checking username availability:", error);
      throw error;
    }
  },
};

export default userService;
