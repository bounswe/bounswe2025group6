// recipeService.js - Enhanced recipe service aligned with Django backend
import axios from 'axios';
import { recipeCache } from '../utils/cache';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

// Create axios instance for request deduplication
const api = axios.create({
  baseURL: API_BASE_URL,
});

// Request deduplication
const pendingRequests = new Map();

function generateRequestKey(config) {
  const { method, url, params, data } = config;
  const paramsStr = params ? JSON.stringify(params) : '';
  const dataStr = data ? JSON.stringify(data) : '';
  return `${method}:${url}:${paramsStr}:${dataStr}`;
}

// Add request deduplication interceptor
api.interceptors.request.use(
  (config) => {
    const requestKey = generateRequestKey(config);
    
    // Check if there's already a pending request with the same key
    if (pendingRequests.has(requestKey)) {
      // Cancel this request
      config.cancelToken = new axios.CancelToken(cancel => {
        cancel('Duplicate request cancelled');
      });
      return config;
    }
    
    // Add auth token
    const token = localStorage.getItem('fithub_access_token');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    
    // Store request key
    config._requestKey = requestKey;
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add response interceptor to clean up pending requests
api.interceptors.response.use(
  (response) => {
    if (response.config._requestKey) {
      pendingRequests.delete(response.config._requestKey);
    }
    return response;
  },
  (error) => {
    if (error.config && error.config._requestKey && !axios.isCancel(error)) {
      pendingRequests.delete(error.config._requestKey);
    }
    return Promise.reject(error);
  }
);

// Cache for storing image URLs to prevent duplicate API calls
const imageCache = new Map();

/**
 * Get authentication headers
 * @returns {Object} - Auth headers object
 */
const getAuthHeaders = () => {
  const token = localStorage.getItem('fithub_access_token');
  return token ? { 'Authorization': `Bearer ${token}` } : {};
};

/**
 * Handle API responses and errors
 * @param {Object} response - Axios response object
 * @returns {Object} - Response data
 */
const handleApiResponse = (response) => {
  if (response.status >= 200 && response.status < 300) {
    return response.data;
  }
  throw new Error(`API request failed with status ${response.status}: ${response.statusText}`);
};

/**
 * Fetch recipe image from Wikidata API
 * @param {string} name Recipe name
 * @returns {Promise<string|null>} Image URL or null if not found
 */
export const getWikidataImage = async (name) => {
  // Return from cache if available
  if (imageCache.has(name)) {
    return imageCache.get(name);
  }
  
  try {
    const token = localStorage.getItem('fithub_access_token');
    const response = await api.get(`/ingredients/wikidata/image/`, {
      params: { name },
    });

    const imageUrl = response.data.image_url;
    
    // Store in cache
    if (imageUrl) {
      imageCache.set(name, imageUrl);
    } else {
      imageCache.set(name, null);
    }
    
    return imageUrl;
  } catch (error) {
    console.error('Error fetching Wikidata image:', error);
    // Cache the failure too to avoid repeated failed requests
    imageCache.set(name, null);
    return null;
  }
};

/**
 * Get recipe by ID with full details including ingredients
 * @param {number} id Recipe ID
 * @returns {Promise<Object>} Recipe details
 */
export const getRecipeById = async (id) => {
  try {
    if (!id) {
      throw new Error('Recipe ID is required');
    }

    // Check cache first
    if (recipeCache.has('recipe', id)) {
      return recipeCache.get('recipe', id);
    }

    const response = await api.get(`/recipes/${id}/`);

    const recipe = handleApiResponse(response);
    
    // Enhance recipe with additional computed fields if needed
    if (recipe.ingredients) {
      recipe.ingredientCount = recipe.ingredients.length;
      recipe.totalIngredientCost = recipe.ingredients.reduce((total, ing) => {
        const minCost = Math.min(...Object.values(ing.costs_for_recipe || {}));
        return total + (isFinite(minCost) ? minCost : 0);
      }, 0);
    }

    // Cache the result
    recipeCache.set('recipe', recipe, 10 * 60 * 1000, id); // Cache for 10 minutes
    return recipe;
  } catch (error) {
    console.error('Error fetching recipe:', error);
    throw new Error(`Failed to fetch recipe: ${error.response?.data?.detail || error.message}`);
  }
};

/**
 * Fetch paginated recipes with optional filters
 * @param {number} page Page number (default: 1)
 * @param {number} pageSize Number of items per page (default: 10)
 * @param {Object} filters Additional filter parameters
 * @returns {Promise<Object>} Paginated recipe results
 */
export const fetchRecipes = async (page = 1, pageSize = 10, filters = {}) => {
  try {
    const params = {
      page,
      page_size: pageSize,
      ...filters
    };

    const response = await api.get(`/recipes/`, {
      params,
    });

    return handleApiResponse(response);
  } catch (error) {
    console.error('Error fetching recipes:', error);
    throw new Error(`Failed to fetch recipes: ${error.response?.data?.detail || error.message}`);
  }
};

/**
 * Get recipes from the meal planner endpoint with comprehensive filtering
 * @param {Object} filters Filter parameters for recipe search
 * @returns {Promise<Object>} Paginated recipe results
 */
export const getRecipesByMealPlanner = async (filters = {}) => {
  try {
    // Build params object, transforming excludeAllergens array to exclude_allergens string
    const params = { ...filters };
    
    // Backend expects exclude_allergens as comma-separated string (e.g., 'nuts,gluten')
    if (params.excludeAllergens && Array.isArray(params.excludeAllergens) && params.excludeAllergens.length > 0) {
      params.exclude_allergens = params.excludeAllergens.join(',');
      delete params.excludeAllergens; // Remove camelCase version
    }
    
    const response = await api.get(`/recipes/meal_planner/`, {
      params,
    });

    const result = handleApiResponse(response);
    
    // Enhance recipes with computed fields for UI
    if (result.results) {
      result.results = result.results.map(recipe => ({
        ...recipe,
        // Ensure total_time is calculated if not provided
        total_time: recipe.total_time || (recipe.prep_time + recipe.cook_time),
        // Calculate minimum cost across markets
        min_cost: recipe.recipe_costs ? Math.min(...Object.values(recipe.recipe_costs)) : parseFloat(recipe.cost_per_serving),
        // Extract primary dietary tags for display
        primaryDietaryTags: recipe.dietary_info?.slice(0, 3) || [],
        // Create display-friendly allergen warning
        allergenWarning: recipe.allergens?.length > 0 ? `Contains: ${recipe.allergens.join(', ')}` : null
      }));
    }

    return result;
  } catch (error) {
    console.error('Error fetching meal planner recipes:', error);
    throw new Error(`Failed to fetch meal planner recipes: ${error.response?.data?.detail || error.message}`);
  }
};

/**
 * Create a new recipe with ingredients and image upload
 * @param {Object} recipeData Recipe data including ingredients
 * @returns {Promise<Object>} Created recipe
 */
export const addRecipe = async (recipeData) => {
  try {
    const token = localStorage.getItem('fithub_access_token');
    if (!token) {
      throw new Error('Authentication token not found');
    }

    // Validate required fields
    if (!recipeData.name?.trim()) {
      throw new Error('Recipe name is required');
    }
    if (!recipeData.steps || recipeData.steps.length === 0) {
      throw new Error('At least one cooking step is required');
    }
    if (!recipeData.ingredients || recipeData.ingredients.length === 0) {
      throw new Error('At least one ingredient is required');
    }

    // Create FormData for multipart/form-data request
    const formData = new FormData();
    
    // Add basic recipe data
    formData.append('name', recipeData.name.trim());
    
    // Add steps as individual form fields for Django ListField
    recipeData.steps.forEach((step) => {
      if (step.trim()) {
        formData.append('steps', step.trim());
      }
    });
    
    formData.append('prep_time', recipeData.prep_time || recipeData.prepTime || 0);
    formData.append('cook_time', recipeData.cook_time || recipeData.cookTime || recipeData.cooking_time || 0);
    formData.append('meal_type', recipeData.meal_type || recipeData.mealType || 'lunch');
    
    // Add ingredients as JSON string (matching backend expectation)
    const ingredientsData = recipeData.ingredients.map(ing => ({
      ingredient_name: ing.ingredient_name || ing.name,
      quantity: parseFloat(ing.quantity) || 1,
      unit: ing.unit || 'pcs'
    }));
    formData.append('ingredients', JSON.stringify(ingredientsData));
    
    // Add image if provided
    if (recipeData.image && recipeData.image instanceof File) {
      formData.append('image', recipeData.image);
    }

    console.log('Creating recipe with FormData:', {
      name: recipeData.name,
      hasImage: !!recipeData.image,
      ingredientsCount: ingredientsData.length,
      stepsCount: recipeData.steps.length
    });

    const response = await fetch(`${API_BASE_URL}/recipes/`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`
        // Don't set Content-Type, let browser set it for FormData
      },
      body: formData
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('Server error response:', errorData);
      throw new Error(errorData.detail || errorData.error || 'Failed to create recipe');
    }

    const result = await response.json();
    console.log('Recipe created successfully:', result);
    return result;
  } catch (error) {
    console.error('Recipe creation error:', error);
    throw new Error(`Failed to create recipe: ${error.message}`);
  }
};

/**
 * Update an existing recipe
 * @param {number} id Recipe ID
 * @param {Object} updatedRecipe Updated recipe data
 * @returns {Promise<Object>} Updated recipe
 */
export const updateRecipe = async (id, updatedRecipe) => {
  try {
    const token = localStorage.getItem('fithub_access_token');
    if (!token) {
      throw new Error('Authentication token not found');
    }

    // Create FormData for multipart/form-data request
    const formData = new FormData();
    
    // Add basic recipe data (only if provided)
    if (updatedRecipe.name) {
      formData.append('name', updatedRecipe.name.trim());
    }
    
    if (updatedRecipe.steps && updatedRecipe.steps.length > 0) {
      updatedRecipe.steps.forEach((step) => {
        if (step.trim()) {
          formData.append('steps', step.trim());
        }
      });
    }
    
    if (updatedRecipe.prep_time !== undefined) {
      formData.append('prep_time', updatedRecipe.prep_time);
    }
    if (updatedRecipe.cook_time !== undefined || updatedRecipe.cooking_time !== undefined) {
      formData.append('cook_time', updatedRecipe.cook_time || updatedRecipe.cooking_time);
    }
    if (updatedRecipe.meal_type) {
      formData.append('meal_type', updatedRecipe.meal_type);
    }
    
    // Add ingredients as JSON string if provided
    if (updatedRecipe.ingredients) {
      const ingredientsData = updatedRecipe.ingredients.map(ing => ({
        ingredient_name: ing.ingredient_name || ing.name,
        quantity: parseFloat(ing.quantity) || 1,
        unit: ing.unit || 'pcs'
      }));
      formData.append('ingredients', JSON.stringify(ingredientsData));
    }
    
    // Add image if provided
    if (updatedRecipe.image && updatedRecipe.image instanceof File) {
      formData.append('image', updatedRecipe.image);
    }

    console.log('Updating recipe with FormData:', {
      id,
      hasImage: !!updatedRecipe.image,
      ingredientsCount: updatedRecipe.ingredients?.length || 0
    });

    const response = await fetch(`${API_BASE_URL}/recipes/${id}/`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`
        // Don't set Content-Type, let browser set it for FormData
      },
      body: formData
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('Server error response:', errorData);
      throw new Error(errorData.detail || errorData.error || 'Failed to update recipe');
    }

    const result = await response.json();
    console.log('Recipe updated successfully:', result);
    return result;
  } catch (error) {
    console.error('Error updating recipe:', error);
    throw new Error(`Failed to update recipe: ${error.message}`);
  }
};

/**
 * Delete a recipe by ID (soft delete)
 * @param {number} id Recipe ID
 * @returns {boolean} Success status
 */
export const deleteRecipe = async (id) => {
  try {
    const token = localStorage.getItem('fithub_access_token');
    if (!token) {
      throw new Error('Authentication token not found');
    }

    const response = await fetch(`${API_BASE_URL}/recipes/${id}/`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      if (response.status === 404) {
        throw new Error('Recipe not found or already deleted');
      }
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.detail || errorData.error || 'Failed to delete recipe');
    }

    console.log(`Recipe with ID ${id} deleted successfully.`);
    return true;
  } catch (error) {
    console.error('Error deleting recipe:', error.message || error);
    throw new Error(`Failed to delete recipe: ${error.message}`);
  }
};

/**
 * Filter recipes by various criteria (client-side filtering)
 * @param {Array} recipes Array of recipes to filter
 * @param {Object} filters Object containing filter criteria
 * @returns {Array} Filtered recipes
 */
export const filterRecipes = (recipes, filters) => {
  try {
    if (!Array.isArray(recipes)) {
      return [];
    }

    return recipes.filter(recipe => {
      // Filter by search term (name or ingredients)
      if (filters.searchTerm) {
        const searchTerm = filters.searchTerm.toLowerCase();
        const nameMatch = recipe.name?.toLowerCase().includes(searchTerm);
        const ingredientMatch = recipe.ingredients?.some(ing => 
          ing.ingredient?.name?.toLowerCase().includes(searchTerm)
        );
        if (!nameMatch && !ingredientMatch) {
          return false;
        }
      }
      
      // Filter by maximum cost
      if (filters.maxCost && parseFloat(recipe.cost_per_serving) > filters.maxCost) {
        return false;
      }
      
      // Filter by preparation time
      if (filters.maxPrepTime && recipe.total_time > filters.maxPrepTime) {
        return false;
      }

      // Filter by meal type
      if (filters.mealType && recipe.meal_type !== filters.mealType) {
        return false;
      }
      
      // Filter by dietary preferences
      if (filters.dietary && filters.dietary.length > 0) {
        const hasAllDiets = filters.dietary.every(diet => 
          recipe.dietary_info?.some(recipeDiet => 
            recipeDict.toLowerCase().includes(diet.toLowerCase())
          )
        );
        if (!hasAllDiets) return false;
      }

      // Filter by allergen exclusions
      if (filters.excludeAllergens && filters.excludeAllergens.length > 0) {
        const hasAllergens = filters.excludeAllergens.some(allergen =>
          recipe.allergens?.includes(allergen)
        );
        if (hasAllergens) return false;
      }
      
      return true;
    });
  } catch (error) {
    console.error('Error filtering recipes:', error);
    return recipes || [];
  }
};

/**
 * Sort recipes by specified criteria
 * @param {Array} recipes Array of recipes
 * @param {string} sortBy Sort criteria (cost, time, name, rating)
 * @param {string} sortOrder Sort order (asc or desc)
 * @returns {Array} Sorted recipes
 */
export const sortRecipes = (recipes, sortBy, sortOrder = 'asc') => {
  try {
    if (!Array.isArray(recipes)) {
      return [];
    }

    const sortedRecipes = [...recipes];
    
    sortedRecipes.sort((a, b) => {
      let aValue, bValue;
      
      switch (sortBy) {
        case 'cost':
          aValue = parseFloat(a.cost_per_serving) || 0;
          bValue = parseFloat(b.cost_per_serving) || 0;
          break;
        case 'time':
          aValue = a.total_time || (a.prep_time + a.cook_time) || 0;
          bValue = b.total_time || (b.prep_time + b.cook_time) || 0;
          break;
        case 'name':
          aValue = a.name?.toLowerCase() || '';
          bValue = b.name?.toLowerCase() || '';
          break;
        case 'rating':
          aValue = a.taste_rating || 0;
          bValue = b.taste_rating || 0;
          break;
        case 'calories':
          aValue = a.recipe_nutritions?.calories || 0;
          bValue = b.recipe_nutritions?.calories || 0;
          break;
        default:
          // Default to creation date if available
          aValue = new Date(a.created_at || 0).getTime();
          bValue = new Date(b.created_at || 0).getTime();
          break;
      }

      if (sortOrder === 'asc') {
        return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
      } else {
        return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
      }
    });
    
    return sortedRecipes;
  } catch (error) {
    console.error('Error sorting recipes:', error);
    return recipes || [];
  }
};

/**
 * Get user's recipe creation count and badge
 * @param {number} userId User ID
 * @returns {Promise<Object>} Recipe count and badge info
 */
export const getUserRecipeCount = async (userId) => {
  try {
    const response = await api.get(`/recipes/user/${userId}/recipe-count/`);
    return handleApiResponse(response);
  } catch (error) {
    console.error('Error fetching user recipe count:', error);
    return { user_id: userId, recipe_count: 0, badge: null };
  }
};

// Bookmark Management (localStorage-based)
const STORAGE_KEY_BOOKMARKS = 'mealPlanner_bookmarkedRecipes';

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
 * @param {number} id Recipe ID
 * @returns {boolean} Success status
 */
export const addToBookmarks = (id) => {
  try {
    const bookmarks = getBookmarkedRecipes();
    if (!bookmarks.includes(parseInt(id))) {
      bookmarks.push(parseInt(id));
      localStorage.setItem(STORAGE_KEY_BOOKMARKS, JSON.stringify(bookmarks));
    }
    return true;
  } catch (error) {
    console.error('Error adding bookmark:', error);
    throw new Error('Failed to add bookmark');
  }
};

/**
 * Remove a recipe from bookmarks
 * @param {number} id Recipe ID
 * @returns {boolean} Success status
 */
export const removeFromBookmarks = (id) => {
  try {
    const bookmarks = getBookmarkedRecipes();
    const updatedBookmarks = bookmarks.filter(bookmarkId => bookmarkId !== parseInt(id));
    localStorage.setItem(STORAGE_KEY_BOOKMARKS, JSON.stringify(updatedBookmarks));
    return true;
  } catch (error) {
    console.error('Error removing bookmark:', error);
    throw new Error('Failed to remove bookmark');
  }
};

/**
 * Check if a recipe is bookmarked
 * @param {number} id Recipe ID
 * @returns {boolean} True if bookmarked
 */
export const isBookmarked = (id) => {
  try {
    const bookmarks = getBookmarkedRecipes();
    return bookmarks.includes(parseInt(id));
  } catch (error) {
    console.error('Error checking bookmark status:', error);
    return false;
  }
};

/**
 * Get all bookmarked recipes data
 * @returns {Promise<Array>} Array of bookmarked recipe objects
 */
export const getBookmarkedRecipesData = async () => {
  try {
    const bookmarkIds = getBookmarkedRecipes();
    if (bookmarkIds.length === 0) {
      return [];
    }
    
    // Fetch details for each bookmarked recipe
    const recipePromises = bookmarkIds.map(id => getRecipeById(id));
    const recipes = await Promise.allSettled(recipePromises);
    
    return recipes
      .filter(result => result.status === 'fulfilled')
      .map(result => result.value);
  } catch (error) {
    console.error('Error fetching bookmarked recipe data:', error);
    return [];
  }
};

/**
 * Get recipes by creator/user ID
 * Fetches all recipes for a creator, handling pagination automatically
 * @param {number} creatorId - User ID
 * @returns {Promise<Array>} Array of all recipes for the creator
 */
export const getRecipesByCreator = async (creatorId) => {
  try {
    const allRecipes = [];
    let page = 1;
    let total = null;
    const pageSize = 100; // Fetch 100 per page to minimize requests
    
    while (true) {
    const response = await api.get(`/recipes/`, {
      params: {
          creator_id: creatorId,
          page: page,
          page_size: pageSize
      },
    });
      
      const data = response.data;
      const recipes = data.results || [];
      
      // If no recipes returned, break
      if (!recipes || recipes.length === 0) {
        break;
      }
      
      allRecipes.push(...recipes);
      
      // Get total from first response
      if (total === null) {
        total = data.total || 0;
      }
      
      // Check if there are more pages
      // If we got fewer recipes than pageSize, we're on the last page
      // Or if page * pageSize >= total, we've fetched all recipes
      const currentTotal = allRecipes.length;
      if (recipes.length < pageSize || (total > 0 && currentTotal >= total)) {
        break;
      }
      
      page++;
      
      // Safety limit to prevent infinite loops
      if (page > 100) {
        console.warn(`Reached safety limit while fetching recipes for creator ${creatorId}`);
        break;
      }
    }
    
    return allRecipes;
  } catch (error) {
    // If 404 error, it means no more pages (this is expected)
    if (error.response?.status === 404) {
      return allRecipes; // Return what we have so far
    }
    console.error(`Error fetching recipes for creator ${creatorId}:`, error);
    return [];
  }
};

export default {
  getWikidataImage,
  getRecipeById,
  fetchRecipes,
  getRecipesByMealPlanner,
  addRecipe,
  updateRecipe,
  deleteRecipe,
  filterRecipes,
  sortRecipes,
  getUserRecipeCount,
  getBookmarkedRecipes,
  addToBookmarks,
  removeFromBookmarks,
  isBookmarked,
  getBookmarkedRecipesData,
  getRecipesByCreator
};