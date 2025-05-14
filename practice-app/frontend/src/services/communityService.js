// src/services/communityService.js

import axios from 'axios';


const API_URL = import.meta.env.VITE_API_URL;

// Helper function to handle API errors
const handleError = (error) => {
  console.error('Community service error:', error);
  throw error;
};

// Main service object with methods for all community-related API calls
const communityService = {
  // Posts
  getAllPosts: async (filters = {}) => {
    try {
      const response = await axios.get(`${API_URL}/posts`, { params: filters });
      return response.data;
    } catch (error) {
      return handleError(error);
    }
  },

  getPostById: async (postId) => {
    try {
      const response = await axios.get(`${API_URL}/posts/${postId}`);
      return response.data;
    } catch (error) {
      return handleError(error);
    }
  },

  createPost: async (postData) => {
    try {
      const response = await axios.post(`${API_URL}/posts`, postData);
      return response.data;
    } catch (error) {
      return handleError(error);
    }
  },

  updatePost: async (postId, postData) => {
    try {
      const response = await axios.put(`${API_URL}/posts/${postId}`, postData);
      return response.data;
    } catch (error) {
      return handleError(error);
    }
  },

  deletePost: async (postId) => {
    try {
      const response = await axios.delete(`${API_URL}/posts/${postId}`);
      return response.data;
    } catch (error) {
      return handleError(error);
    }
  },

  likePost: async (postId) => {
    try {
      const response = await axios.post(`${API_URL}/posts/${postId}/like`);
      return response.data;
    } catch (error) {
      return handleError(error);
    }
  },

  unlikePost: async (postId) => {
    try {
      const response = await axios.delete(`${API_URL}/posts/${postId}/like`);
      return response.data;
    } catch (error) {
      return handleError(error);
    }
  },

  // Comments
  getCommentsByPostId: async (postId) => {
    try {
      const response = await axios.get(`${API_URL}/posts/${postId}/comments`);
      return response.data;
    } catch (error) {
      return handleError(error);
    }
  },

  createComment: async (postId, commentData) => {
    try {
      const response = await axios.post(`${API_URL}/posts/${postId}/comments`, commentData);
      return response.data;
    } catch (error) {
      return handleError(error);
    }
  },

  deleteComment: async (commentId) => {
    try {
      const response = await axios.delete(`${API_URL}/comments/${commentId}`);
      return response.data;
    } catch (error) {
      return handleError(error);
    }
  },

  likeComment: async (commentId) => {
    try {
      const response = await axios.post(`${API_URL}/comments/${commentId}/like`);
      return response.data;
    } catch (error) {
      return handleError(error);
    }
  },

  unlikeComment: async (commentId) => {
    try {
      const response = await axios.delete(`${API_URL}/comments/${commentId}/like`);
      return response.data;
    } catch (error) {
      return handleError(error);
    }
  },

  // User Profiles
  getUserProfile: async (userId) => {
    try {
      const response = await axios.get(`${API_URL}/users/${userId}/profile`);
      return response.data;
    } catch (error) {
      return handleError(error);
    }
  },

  getUserPosts: async (userId) => {
    try {
      const response = await axios.get(`${API_URL}/users/${userId}/posts`);
      return response.data;
    } catch (error) {
      return handleError(error);
    }
  },

  getUserComments: async (userId) => {
    try {
      const response = await axios.get(`${API_URL}/users/${userId}/comments`);
      return response.data;
    } catch (error) {
      return handleError(error);
    }
  },

  // Tags
  getAllTags: async () => {
    try {
      const response = await axios.get(`${API_URL}/tags`);
      return response.data;
    } catch (error) {
      return handleError(error);
    }
  },

  getPostsByTag: async (tagName) => {
    try {
      const response = await axios.get(`${API_URL}/tags/${tagName}/posts`);
      return response.data;
    } catch (error) {
      return handleError(error);
    }
  }
};

export default communityService;
