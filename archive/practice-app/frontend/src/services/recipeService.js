// src/services/recipeService.js
import axios from 'axios';

// Local storage key for saved recipes
const STORAGE_KEY_RECIPES = 'mealPlanner_recipes';
const STORAGE_KEY_BOOKMARKS = 'mealPlanner_bookmarkedRecipes';
const API_BASE_URL = import.meta.env.VITE_API_URL; // Backend API'nin base URL'si

// Cache for storing image URLs to prevent duplicate API calls
const imageCache = new Map();

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
    const response = await axios.get(`${API_BASE_URL}/ingredients/wikidata/image/`, {
      params: { name },
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    const imageUrl = response.data.image_url;
    
    // Store in cache
    if (imageUrl) {
      imageCache.set(name, imageUrl);
    }
    
    return imageUrl;
  } catch (error) {
    console.error('Error fetching Wikidata image:', error);
    // Cache the failure too to avoid repeated failed requests
    imageCache.set(name, null);
    return null;
  }
};

export const getRecipeById = async (id) => {
  try {
    const token = localStorage.getItem('fithub_access_token'); // Take token

    const response = await axios.get(`${API_BASE_URL}/recipes/${id}/`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    return response.data;
  } catch (error) {
    console.error('Error fetching recipe:', error);
    throw error;
  }
};


export const fetchRecipes = async (page = 1, pageSize = 10) => {
  try {
    const token = localStorage.getItem('fithub_access_token'); // Token'ı localStorage'dan alın
    if (!token) {
      throw new Error('Authentication token not found');
    }

    const response = await axios.get(`${API_BASE_URL}/recipes/`, {
      params: { page, page_size: pageSize },
      headers: {
        Authorization: `Bearer ${token}`, // Token'ı Authorization başlığına ekle
      },
    });

    return response.data; // Backend'den dönen veriyi döndür
  } catch (error) {
    console.error('Error fetching recipes:', error);
    throw error;
  }
};


/**
 * Yeni bir tarif ekler
 * @param {Object} recipe Tarif verisi
 * @returns {Promise<Object>} Eklenen tarif
 */
export const addRecipe = async (recipeData) => {
  try {
    const token = localStorage.getItem('fithub_access_token');
    if (!token) {
      throw new Error('Authentication token not found');
    }

    // Format the recipe data to match backend expectations
    const formattedData = {
      name: recipeData.name.trim(),
      steps: recipeData.steps, // Steps are already an array of strings
      prep_time: parseInt(recipeData.prep_time),
      cook_time: parseInt(recipeData.cooking_time),
      meal_type: recipeData.meal_type,
      ingredients: recipeData.ingredients.map(ing => ({
        ingredient_name: ing.ingredient_name,
        quantity: parseFloat(ing.quantity) || 1,
        unit: ing.unit || 'pcs'
      }))
    };

    console.log('Sending formatted recipe data:', formattedData); // For debugging

    const response = await fetch(`${API_BASE_URL}/recipes/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(formattedData)
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Server error response:', errorData);
      throw new Error(errorData.detail || 'Failed to create recipe');
    }

    return await response.json();
  } catch (error) {
    console.error('Recipe creation error:', error);
    throw error;
  }
};

/**
 * Create a new recipe
 * @param {Object} recipeData Recipe data
 * @returns {Promise<Object>} Created recipe
 */
export const createRecipe = async (recipeData) => {
  try {
    const response = await fetch(`${API_BASE_URL}/recipes/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('fithub_access_token')}`,
      },
      body: JSON.stringify(recipeData)
    });

    if (!response.ok) {
      throw new Error('Failed to create recipe');
    }

    return await response.json();
  } catch (error) {
    console.error('Error creating recipe:', error);
    throw error;
  }
};

/**
 * Update an existing recipe
 * @param {number} id Recipe ID
 * @param {Object} updatedRecipe Updated recipe data
 * @returns {Object} Updated recipe
 */
export const updateRecipe = (id, updatedRecipe) => {
  try {
    const recipes = getAllRecipes();
    const index = recipes.findIndex(recipe => recipe.id === parseInt(id));
    
    if (index === -1) {
      throw new Error('Recipe not found');
    }
    
    const updated = {
      ...recipes[index],
      ...updatedRecipe,
      updatedAt: new Date().toISOString()
    };
    
    recipes[index] = updated;
    localStorage.setItem(STORAGE_KEY_RECIPES, JSON.stringify(recipes));
    
    return updated;
  } catch (error) {
    console.error('Error updating recipe:', error);
    throw new Error('Failed to update recipe');
  }
};

/**
 * Delete a recipe by ID
 * @param {number} id Recipe ID
 * @returns {boolean} Success status
 */
export const deleteRecipe = async (id) => {
  try {
    const token = localStorage.getItem('fithub_access_token'); // Token'ı al
    if (!token) {
      console.error('Authentication token not found');
      throw new Error('Authentication token not found');
    }

    const response = await fetch(`${API_BASE_URL}/recipes/${id}/`, {
  method: 'DELETE',
  headers: {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
  },
});

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Server error response:', errorData);
      throw new Error(errorData.detail || 'Failed to delete recipe');
    }

    console.log(`Recipe with ID ${id} deleted successfully.`);
    return true; // Başarılı durum
  } catch (error) {
    console.error('Error deleting recipe:', error.message || error);
    throw error; // Hatanın yukarıya iletilmesini sağla
  }
};

/**
 * Filter recipes by various criteria
 * @param {Object} filters Object containing filter criteria
 * @returns {Array} Filtered recipes
 */
export const filterRecipes = (filters) => {
  try {
    const recipes = getAllRecipes();
    
    return recipes.filter(recipe => {
      // Filter by search term (title or description)
      if (filters.searchTerm && !recipe.title.toLowerCase().includes(filters.searchTerm.toLowerCase()) && 
          !recipe.description.toLowerCase().includes(filters.searchTerm.toLowerCase())) {
        return false;
      }
      
      // Filter by maximum cost
      if (filters.maxCost && recipe.costPerServing > filters.maxCost) {
        return false;
      }
      
      // Filter by preparation time
      if (filters.maxPrepTime && recipe.preparationTime > filters.maxPrepTime) {
        return false;
      }
      
      // Filter by dietary preferences
      if (filters.dietary && filters.dietary.length > 0) {
        const hasAllBadges = filters.dietary.every(diet => 
          recipe.badges.some(badge => 
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
 * @param {Array} recipes Array of recipes
 * @param {string} sortBy Sort criteria (cost, time, etc.)
 * @param {string} sortOrder Sort order (asc or desc)
 * @returns {Array} Sorted recipes
 */
export const sortRecipes = (recipes, sortBy, sortOrder = 'asc') => {
  try {
    const sortedRecipes = [...recipes];
    
    switch (sortBy) {
      case 'cost':
        sortedRecipes.sort((a, b) => sortOrder === 'asc' 
          ? a.costPerServing - b.costPerServing 
          : b.costPerServing - a.costPerServing);
        break;
      case 'time':
        sortedRecipes.sort((a, b) => sortOrder === 'asc' 
          ? a.preparationTime - b.preparationTime 
          : b.preparationTime - a.preparationTime);
        break;
      case 'title':
        sortedRecipes.sort((a, b) => {
          const comparison = a.title.localeCompare(b.title);
          return sortOrder === 'asc' ? comparison : -comparison;
        });
        break;
      default:
        // Do nothing
        break;
    }
    
    return sortedRecipes;
  } catch (error) {
    console.error('Error sorting recipes:', error);
    return recipes;
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
 * @returns {Array} Array of bookmarked recipe objects
 */
export const getBookmarkedRecipesData = () => {
  try {
    const bookmarkIds = getBookmarkedRecipes();
    const recipes = getAllRecipes();
    return recipes.filter(recipe => bookmarkIds.includes(recipe.id));
  } catch (error) {
    console.error('Error fetching bookmarked recipe data:', error);
    return [];
  }
};
