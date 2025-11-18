// src/services/bookmarkService.js
import axios from 'axios';

// Create an axios instance with auth
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
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

/**
 * Bookmark a recipe
 * @param {number} recipeId - ID of the recipe to bookmark
 * @returns {Promise} Response with bookmark status
 */
export const bookmarkRecipe = async (recipeId) => {
  try {
    const response = await api.post('/api/users/bookmark_recipe/', {
      recipe_id: recipeId
    });
    return response.data;
  } catch (error) {
    console.error('Error bookmarking recipe:', error);
    throw error;
  }
};

/**
 * Unbookmark a recipe
 * @param {number} recipeId - ID of the recipe to unbookmark
 * @returns {Promise} Response with unbookmark status
 */
export const unbookmarkRecipe = async (recipeId) => {
  try {
    const response = await api.post('/api/users/unbookmark_recipe/', {
      recipe_id: recipeId
    });
    return response.data;
  } catch (error) {
    console.error('Error unbookmarking recipe:', error);
    throw error;
  }
};

/**
 * Toggle bookmark status for a recipe
 * @param {number} recipeId - ID of the recipe to bookmark/unbookmark
 * @param {boolean} isCurrentlyBookmarked - Current bookmark status
 * @returns {Promise} Response with bookmark status
 */
export const toggleBookmark = async (recipeId, isCurrentlyBookmarked) => {
  try {
    if (isCurrentlyBookmarked) {
      return await unbookmarkRecipe(recipeId);
    } else {
      return await bookmarkRecipe(recipeId);
    }
  } catch (error) {
    console.error('Error toggling bookmark:', error);
    throw error;
  }
};

/**
 * Get user's bookmarked recipes
 * @param {number} userId - User ID (required)
 * @returns {Promise} Array of bookmarked recipes
 */
export const getBookmarkedRecipes = async (userId) => {
  try {
    if (!userId) {
      throw new Error("User ID is required");
    }
    const response = await api.get(`/api/users/${userId}/`);
    return response.data.bookmarkRecipes || [];
  } catch (error) {
    console.error('Error fetching bookmarked recipes:', error);
    throw error;
  }
};

/**
 * Check if a recipe is bookmarked
 * @param {number} recipeId - Recipe ID to check
 * @param {Array} bookmarkedRecipes - Array of bookmarked recipe IDs
 * @returns {boolean} True if recipe is bookmarked
 */
export const isRecipeBookmarked = (recipeId, bookmarkedRecipes) => {
  if (!bookmarkedRecipes || !Array.isArray(bookmarkedRecipes)) return false;
  return bookmarkedRecipes.some(recipe => recipe.id === recipeId || recipe === recipeId);
};

