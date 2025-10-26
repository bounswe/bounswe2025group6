// src/services/ratingService.js

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000';
const ACCESS_TOKEN_KEY = "fithub_access_token";

/**
 * Get authentication headers
 */
function getAuthHeaders() {
  const token = localStorage.getItem(ACCESS_TOKEN_KEY);
  if (!token) {
    throw new Error('No authentication token found. Please log in again.');
  }
  
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`,
  };
}

/**
 * Check if token is expired
 */
function checkTokenExpiry() {
  const token = localStorage.getItem(ACCESS_TOKEN_KEY);
  if (!token) {
    return true;
  }
  
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    const currentTime = Math.floor(Date.now() / 1000);
    return payload.exp < currentTime;
  } catch (error) {
    return true; // Treat malformed token as expired
  }
}

/**
 * Refresh access token using refresh token
 */
async function refreshAccessToken() {
  const refreshToken = localStorage.getItem('fithub_refresh_token');
  if (!refreshToken) {
    throw new Error('No refresh token available');
  }

  try {
    const response = await fetch(`${API_BASE}/api/token/refresh/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ refresh: refreshToken }),
    });

    if (!response.ok) {
      throw new Error('Failed to refresh token');
    }

    const data = await response.json();
    localStorage.setItem(ACCESS_TOKEN_KEY, data.access);
    return data.access;
  } catch (error) {
    console.error('Error refreshing token:', error);
    throw error;
  }
}

/**
 * Handle API response errors
 */
async function handleApiError(response) {
  const errorText = await response.text();
  let errorMessage = `Server error: ${response.status}`;
  
  try {
    const errorData = JSON.parse(errorText);
    if (errorData.error) {
      errorMessage = errorData.error;
    } else if (errorData.detail) {
      errorMessage = errorData.detail;
    }
  } catch {
    // If response is not JSON, use the text as is
    if (errorText) {
      errorMessage = errorText;
    }
  }
  
  throw new Error(errorMessage);
}

/**
 * Get user's rating for a specific recipe
 * @param {number} recipeId - Recipe ID
 * @returns {Promise<Object|null>} User's rating data or null if not found
 */
export async function getUserRating(recipeId) {
  try {
    console.log('getUserRating - called with recipeId:', recipeId, 'type:', typeof recipeId);
    
    // Check if token is expired and refresh if needed
    if (checkTokenExpiry()) {
      try {
        await refreshAccessToken();
      } catch (refreshError) {
        throw new Error('Token has expired. Please log in again.');
      }
    }
    
    // Get all ratings and filter by recipe
    const response = await fetch(`${API_BASE}/api/recipe-ratings/`, {
      method: 'GET',
      headers: getAuthHeaders(),
    });

    if (!response.ok) {
      // If 401, try to refresh token once more
      if (response.status === 401) {
        try {
          await refreshAccessToken();
          // Retry the request with new token
          const retryResponse = await fetch(`${API_BASE}/api/recipe-ratings/`, {
            method: 'GET',
            headers: getAuthHeaders(),
          });

          if (!retryResponse.ok) {
            await handleApiError(retryResponse);
          }

          const retryData = await retryResponse.json();
          const retryRatings = retryData.results || retryData;

          if (!Array.isArray(retryRatings)) {
            return null;
          }

          // Find rating for this specific recipe
          const foundRating = retryRatings.find(rating => {
            console.log('getUserRating - checking retry rating:', rating, 'recipe_id:', rating.recipe_id);
            return rating.recipe_id === recipeId;
          }) || null;
          console.log('getUserRating - retry foundRating:', foundRating);
          return foundRating;
        } catch (retryError) {
          throw new Error('Token has expired. Please log in again.');
        }
      }

      await handleApiError(response);
    }

    const data = await response.json();
    const ratings = data.results || data;

    console.log('getUserRating - all ratings:', ratings);
    console.log('getUserRating - looking for recipeId:', recipeId, 'type:', typeof recipeId);

    if (!Array.isArray(ratings)) {
      console.log('getUserRating - ratings is not an array:', ratings);
      return null;
    }
    
    // Find rating for this specific recipe
    const foundRating = ratings.find(rating => {
      console.log('getUserRating - checking rating:', rating, 'recipe_id:', rating.recipe_id);
      return rating.recipe_id === recipeId;
    }) || null;
    console.log('getUserRating - foundRating:', foundRating, 'for recipeId:', recipeId);
    return foundRating;
  } catch (error) {
    console.error('Error getting user rating:', error);
    throw error;
  }
}

/**
 * Create a new recipe rating
 * @param {number} recipeId - Recipe ID
 * @param {Object} ratingData - Rating data {taste_rating, difficulty_rating}
 * @returns {Promise<Object>} Created rating data
 */
export async function createRecipeRating(recipeId, ratingData) {
  if (checkTokenExpiry()) {
    throw new Error('Token has expired. Please log in again.');
  }

  const payload = {
    recipe_id: recipeId,
    ...ratingData
  };

  try {
    const response = await fetch(`${API_BASE}/api/recipe-ratings/`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      // Check if it's a 500 error (likely duplicate)
      if (response.status === 500) {
        const errorText = await response.text();
        if (errorText.includes('Duplicate entry') || errorText.includes('duplicate')) {
          throw new Error('Duplicate entry detected');
        }
      }
      await handleApiError(response);
    }

    return await response.json();
  } catch (error) {
    console.error('Error creating recipe rating:', error);
    throw error;
  }
}

/**
 * Update an existing recipe rating
 * @param {number} ratingId - Rating ID
 * @param {number} recipeId - Recipe ID (required for API)
 * @param {Object} ratingData - Updated rating data
 * @returns {Promise<Object>} Updated rating data
 */
export async function updateRecipeRating(ratingId, recipeId, ratingData) {
  if (checkTokenExpiry()) {
    throw new Error('Token has expired. Please log in again.');
  }
  
  try {
    // Include recipe_id in the payload as it's required by the API
    const payload = {
      recipe_id: recipeId,
      ...ratingData
    };
    
    const response = await fetch(`${API_BASE}/api/recipe-ratings/${ratingId}/`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      await handleApiError(response);
    }

    return await response.json();
  } catch (error) {
    console.error('Error updating recipe rating:', error);
    throw error;
  }
}

/**
 * Delete a recipe rating
 * @param {number} ratingId - Rating ID
 * @returns {Promise<void>}
 */
export async function deleteRecipeRating(ratingId) {
  if (checkTokenExpiry()) {
    throw new Error('Token has expired. Please log in again.');
  }
  
  try {
    const response = await fetch(`${API_BASE}/api/recipe-ratings/${ratingId}/`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });

    if (!response.ok) {
      await handleApiError(response);
    }
  } catch (error) {
    console.error('Error deleting recipe rating:', error);
    throw error;
  }
}

/**
 * Submit a recipe rating (handles create or update based on existing rating)
 * Uses only GET endpoint to check for existing ratings
 * @param {number} recipeId - Recipe ID
 * @param {Object} ratingData - Rating data {taste_rating, difficulty_rating}
 * @returns {Promise<Object>} Result data
 */
export async function submitRecipeRating(recipeId, ratingData) {
  try {
    console.log('submitRecipeRating - called with recipeId:', recipeId, 'ratingData:', ratingData);
    
    // Get all user ratings using GET endpoint
    const response = await fetch(`${API_BASE}/api/recipe-ratings/`, {
      method: 'GET',
      headers: getAuthHeaders(),
    });

    if (!response.ok) {
      await handleApiError(response);
    }

    const data = await response.json();
    const ratings = data.results || data;
    
    console.log('submitRecipeRating - all ratings:', ratings);
    
    if (!Array.isArray(ratings)) {
      console.log('submitRecipeRating - ratings is not an array, creating new rating');
      const newRating = await createRecipeRating(recipeId, ratingData);
      return newRating;
    }
    
    // Find existing rating for this recipe and user
    const existingRating = ratings.find(rating => {
      console.log('submitRecipeRating - checking rating:', rating, 'recipe_id:', rating.recipe_id, 'user:', rating.user);
      return rating.recipe_id === recipeId;
    });
    
    if (existingRating) {
      console.log('submitRecipeRating - found existing rating:', existingRating);
      
      // Check if user is trying to set the same rating (toggle off)
      // Check which fields changed
      const changedFields = Object.keys(ratingData);
      const allSame = changedFields.every(field => {
        return existingRating[field] === ratingData[field];
      });
      
      // If all ratings are the same, delete the rating (toggle off)
      if (allSame) {
        console.log('submitRecipeRating - same rating detected, deleting');
        await deleteRecipeRating(existingRating.id);
        return { deleted: true, message: 'Rating removed' };
      } else {
        // User wants to update the rating - merge with existing ratings
        console.log('submitRecipeRating - updating existing rating');
        const mergedRatingData = {
          taste_rating: existingRating.taste_rating,
          difficulty_rating: existingRating.difficulty_rating,
          health_rating: existingRating.health_rating,
          ...ratingData // Override with new values
        };
        const updatedRating = await updateRecipeRating(existingRating.id, recipeId, mergedRatingData);
        return updatedRating;
      }
    } else {
      // User doesn't have a rating, create new one
      console.log('submitRecipeRating - no existing rating found, creating new one');
      const newRating = await createRecipeRating(recipeId, ratingData);
      return newRating;
    }
  } catch (error) {
    console.error('Error submitting recipe rating:', error);
    throw error;
  }
}