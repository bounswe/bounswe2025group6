import apiClient from './apiClient'; // Import the refactored apiClient

const STORAGE_KEY_BOOKMARKS = 'mealPlanner_bookmarkedRecipes';

/**
 * Get all recipes from the API
 * @returns {Promise<Array>} Array of recipes
 */
export const getAllRecipes = async () => {
  try {
    const response = await apiClient.get('/recipes/');
    return response.data.results || response.data;
  } catch (error) {
    console.error('Error fetching recipes from API:', error.response?.data || error.message);
    throw new Error(
      error.response?.data?.detail || 'Failed to fetch recipes.'
    );
  }
};

/**
 * Get a recipe by ID from the API
 * @param {number} id Recipe ID
 * @returns {Promise<Object|null>} Recipe object or null if not found
 */
export const getRecipeById = async (id) => {
  try {
    const response = await apiClient.get(`/recipes/${id}/`);
    return response.data;
  } catch (error) {
    console.error(`Error fetching recipe ${id} from API:`, error.response?.data || error.message);
    if (error.response?.status === 404) {
      return null;
    }
    throw new Error(
      error.response?.data?.detail || `Failed to fetch recipe ${id}.`
    );
  }
};

/**
 * Add a new recipe via API
 * @param {Object} recipeData Recipe data matching API spec
 * @returns {Promise<Object>} Created recipe object from API
 */
export const addRecipe = async (recipeData) => {
  try {
    const response = await apiClient.post('/recipes/', recipeData);
    return response.data;
  } catch (error) {
    console.error('Error adding recipe via API:', error.response?.data || error.message);
    let errorMessage = 'Failed to add recipe. Please try again.';
    if (error.response?.data) {
      const errors = error.response.data;
      if (errors.detail) {
        errorMessage = errors.detail;
      } else if (typeof errors === 'object') {
        const messages = Object.entries(errors).map(([key, value]) => {
          if (Array.isArray(value)) return `${key}: ${value.join(', ')}`;
          return `${key}: ${value}`;
        });
        if (messages.length > 0) errorMessage = messages.join('; ');
      }
    }
    throw new Error(errorMessage);
  }
};

/**
 * Update an existing recipe via API
 * @param {number} id Recipe ID
 * @param {Object} updatedRecipe Updated recipe data matching API spec for PUT
 * @returns {Promise<Object>} Updated recipe object from API
 */
export const updateRecipe = async (id, updatedRecipe) => {
  try {
    const response = await apiClient.put(`/recipes/${id}/`, updatedRecipe);
    return response.data;
  } catch (error) {
    console.error(`Error updating recipe ${id} via API:`, error.response?.data || error.message);
    let errorMessage = 'Failed to update recipe. Please try again.';
    if (error.response?.data) {
      const errors = error.response.data;
      if (errors.detail) {
        errorMessage = errors.detail;
      } else if (typeof errors === 'object') {
        const messages = Object.entries(errors).map(([key, value]) => {
          if (Array.isArray(value)) return `${key}: ${value.join(', ')}`;
          return `${key}: ${value}`;
        });
        if (messages.length > 0) errorMessage = messages.join('; ');
      }
    }
    throw new Error(errorMessage);
  }
};

/**
 * Delete a recipe by ID via API
 * @param {number} id Recipe ID
 * @returns {Promise<boolean>} Success status
 */
export const deleteRecipe = async (id) => {
  try {
    await apiClient.delete(`/recipes/${id}/`);
    return true;
  } catch (error) {
    console.error(`Error deleting recipe ${id} via API:`, error.response?.data || error.message);
    throw new Error(
      error.response?.data?.detail || `Failed to delete recipe ${id}.`
    );
  }
};

/**
 * Get all bookmarked recipes
 * @returns {Array} Array of bookmarked recipe IDs
 */
export const getBookmarkedRecipes = () => {
  try {
    const bookmarks = localStorage.getItem(STORAGE_KEY_BOOKMARKS);
    return bookmarks ? JSON.parse(bookmarks) : [];
  } catch (error) {
    console.error('Error fetching bookmarks:', error);
    return [];
  }
};

/**
 * Add a recipe to bookmarks
 * @param {number} recipeId Recipe ID
 * @returns {Promise<boolean>} Success status
 */
export const addToBookmarks = async (recipeId) => {
  try {
    await apiClient.post('/users/bookmark_recipe/', { recipe_id: recipeId });
    return true;
  } catch (error) {
    console.error('Error adding bookmark via API:', error.response?.data || error.message);
    throw new Error('Failed to add bookmark');
  }
};

/**
 * Remove a recipe from bookmarks
 * @param {number} recipeId Recipe ID
 * @returns {Promise<boolean>} Success status
 */
export const removeFromBookmarks = async (recipeId) => {
  try {
    await apiClient.post('/users/unbookmark_recipe/', { recipe_id: recipeId });
    return true;
  } catch (error) {
    console.error('Error removing bookmark via API:', error.response?.data || error.message);
    throw new Error('Failed to remove bookmark');
  }
};

/**
 * Check if a recipe is bookmarked
 * @param {number} recipeId Recipe ID
 * @returns {Promise<boolean>} True if bookmarked
 */
export const isBookmarked = async (recipeId) => {
  try {
    const bookmarks = getBookmarkedRecipes();
    return bookmarks.includes(parseInt(recipeId));
  } catch (error) {
    console.error('Error checking bookmark status:', error);
    return false;
  }
};

/**
 * Filter recipes by various criteria
 * @param {Array} recipesToFilter Array of recipes
 * @param {Object} filters Object containing filter criteria
 * @returns {Array} Filtered recipes
 */
export const filterRecipes = (recipesToFilter, filters) => {
  try {
    return recipesToFilter.filter(recipe => {
      if (filters.searchTerm && 
          !recipe.name.toLowerCase().includes(filters.searchTerm.toLowerCase()) && 
          !(recipe.description && recipe.description.toLowerCase().includes(filters.searchTerm.toLowerCase()))) {
        return false;
      }
      
      if (filters.maxCost && recipe.cost_per_serving > filters.maxCost) {
        return false;
      }
      
      if (filters.maxPrepTime && recipe.prep_time > filters.maxPrepTime) {
        return false;
      }
      
      if (filters.dietary && filters.dietary.length > 0) {
        const recipeDietaryInfo = recipe.dietary_info || recipe.badges || [];
        const hasAllBadges = filters.dietary.every(diet => 
          recipeDietaryInfo.some(badge => 
            badge.toLowerCase().includes(diet.toLowerCase())
          )
        );
        if (!hasAllBadges) return false;
      }
      
      return true;
    });
  } catch (error) {
    console.error('Error filtering recipes:', error);
    return [];
  }
};

/**
 * Sort recipes by specified criteria
 * @param {Array} recipesToSort Array of recipes
 * @param {string} sortBy Sort criteria (cost, time, etc.)
 * @param {string} sortOrder Sort order (asc or desc)
 * @returns {Array} Sorted recipes
 */
export const sortRecipes = (recipesToSort, sortBy, sortOrder = 'asc') => {
  try {
    const sortedRecipes = [...recipesToSort];
    
    switch (sortBy) {
      case 'cost':
        sortedRecipes.sort((a, b) => sortOrder === 'asc' 
          ? (a.cost_per_serving || 0) - (b.cost_per_serving || 0) 
          : (b.cost_per_serving || 0) - (a.cost_per_serving || 0));
        break;
      case 'time':
        sortedRecipes.sort((a, b) => sortOrder === 'asc' 
          ? (a.prep_time || a.total_time || 0) - (b.prep_time || b.total_time || 0) 
          : (b.prep_time || b.total_time || 0) - (a.prep_time || a.total_time || 0));
        break;
      case 'title':
        sortedRecipes.sort((a, b) => {
          const comparison = (a.name || '').localeCompare(b.name || '');
          return sortOrder === 'asc' ? comparison : -comparison;
        });
        break;
      default:
        break;
    }
    
    return sortedRecipes;
  } catch (error) {
    console.error('Error sorting recipes:', error);
    return recipesToSort;
  }
};

/**
 * Get all bookmarked recipes data
 * @returns {Promise<Array>} Array of bookmarked recipe objects
 */
export const getBookmarkedRecipesData = async () => {
  try {
    const bookmarkIds = getBookmarkedRecipes();
    const recipes = await getAllRecipes();
    return recipes.filter(recipe => bookmarkIds.includes(recipe.id));
  } catch (error) {
    console.error('Error fetching bookmarked recipe data:', error);
    return [];
  }
};