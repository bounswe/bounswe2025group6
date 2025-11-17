// src/services/mealPlanService.js

import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL;

// Local storage key for saved meal plans
const STORAGE_KEY = 'mealPlanner_savedMealPlans';

/**
 * Fetch recipes from backend meal planner endpoint with filters
 * @param {Object} filters - Filter parameters
 * @returns {Promise<Object>} Paginated recipe list
 */
export const fetchMealPlanRecipes = async (filters = {}) => {
  try {
    const token = localStorage.getItem('fithub_access_token');
    if (!token) {
      throw new Error('Authentication token not found');
    }

    // Build query parameters
    const params = {};
    
    // Recipe name search
    if (filters.name) params.name = filters.name;
    
    // Meal type (breakfast, lunch, dinner)
    if (filters.meal_type) params.meal_type = filters.meal_type;
    
    // Cost per serving filters
    if (filters.min_cost_per_serving) params.min_cost_per_serving = filters.min_cost_per_serving;
    if (filters.max_cost_per_serving) params.max_cost_per_serving = filters.max_cost_per_serving;
    
    // Rating filters
    if (filters.min_difficulty_rating) params.min_difficulty_rating = filters.min_difficulty_rating;
    if (filters.max_difficulty_rating) params.max_difficulty_rating = filters.max_difficulty_rating;
    if (filters.min_taste_rating) params.min_taste_rating = filters.min_taste_rating;
    if (filters.max_taste_rating) params.max_taste_rating = filters.max_taste_rating;
    if (filters.min_health_rating) params.min_health_rating = filters.min_health_rating;
    if (filters.max_health_rating) params.max_health_rating = filters.max_health_rating;
    if (filters.min_like_count) params.min_like_count = filters.min_like_count;
    if (filters.max_like_count) params.max_like_count = filters.max_like_count;
    
    // Nutrition filters
    if (filters.min_calories) params.min_calories = filters.min_calories;
    if (filters.max_calories) params.max_calories = filters.max_calories;
    if (filters.min_carbs) params.min_carbs = filters.min_carbs;
    if (filters.max_carbs) params.max_carbs = filters.max_carbs;
    if (filters.min_fat) params.min_fat = filters.min_fat;
    if (filters.max_fat) params.max_fat = filters.max_fat;
    if (filters.min_protein) params.min_protein = filters.min_protein;
    if (filters.max_protein) params.max_protein = filters.max_protein;
    
    // Time filters
    if (filters.min_prep_time) params.min_prep_time = filters.min_prep_time;
    if (filters.max_prep_time) params.max_prep_time = filters.max_prep_time;
    if (filters.min_cook_time) params.min_cook_time = filters.min_cook_time;
    if (filters.max_cook_time) params.max_cook_time = filters.max_cook_time;
    if (filters.min_total_time) params.min_total_time = filters.min_total_time;
    if (filters.max_total_time) params.max_total_time = filters.max_total_time;
    
    // Boolean filters
    if (filters.has_image !== undefined) params.has_image = filters.has_image;
    if (filters.is_approved !== undefined) params.is_approved = filters.is_approved;
    if (filters.is_featured !== undefined) params.is_featured = filters.is_featured;
    
    // Pagination
    if (filters.page) params.page = filters.page;
    if (filters.page_size) params.page_size = filters.page_size;

    const response = await axios.get(`${API_BASE_URL}/recipes/meal_planner/`, {
      params,
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    return response.data;
  } catch (error) {
    console.error('Error fetching meal plan recipes:', error);
    throw error;
  }
};

/**
 * Fetch recipes for a specific meal type with filters
 * @param {string} mealType - 'breakfast', 'lunch', or 'dinner'
 * @param {Object} additionalFilters - Additional filters
 * @returns {Promise<Array>} Array of recipes
 */
export const fetchRecipesByMealType = async (mealType, additionalFilters = {}) => {
  try {
    const filters = {
      meal_type: mealType,
      page_size: 50, // Get more results for variety
      ...additionalFilters,
    };
    
    const response = await fetchMealPlanRecipes(filters);
    return response.results || [];
  } catch (error) {
    console.error(`Error fetching ${mealType} recipes:`, error);
    return [];
  }
};

/**
 * Get random recipe from filtered results
 * @param {string} mealType - 'breakfast', 'lunch', or 'dinner'
 * @param {Object} filters - Filter parameters
 * @returns {Promise<Object|null>} Random recipe or null
 */
export const getRandomRecipe = async (mealType, filters = {}) => {
  try {
    const recipes = await fetchRecipesByMealType(mealType, filters);
    if (recipes.length === 0) return null;
    
    const randomIndex = Math.floor(Math.random() * recipes.length);
    return recipes[randomIndex];
  } catch (error) {
    console.error('Error getting random recipe:', error);
    return null;
  }
};

/**
 * Generate a random meal plan based on filters
 * @param {Object} filters - Filter parameters
 * @returns {Promise<Object>} Meal plan with breakfast, lunch, dinner
 */
export const generateRandomMealPlan = async (filters = {}) => {
  try {
    const [breakfast, lunch, dinner] = await Promise.all([
      getRandomRecipe('breakfast', filters),
      getRandomRecipe('lunch', filters),
      getRandomRecipe('dinner', filters),
    ]);

    return {
      breakfast,
      lunch,
      dinner,
    };
  } catch (error) {
    console.error('Error generating random meal plan:', error);
    throw error;
  }
};

/**
 * Calculate total cost of meal plan
 * @param {Object} mealPlan - Meal plan object with breakfast, lunch, dinner
 * @returns {number} Total cost
 */
export const calculateMealPlanCost = (mealPlan) => {
  let total = 0;
  if (mealPlan.breakfast?.cost_per_serving) {
    total += parseFloat(mealPlan.breakfast.cost_per_serving);
  }
  if (mealPlan.lunch?.cost_per_serving) {
    total += parseFloat(mealPlan.lunch.cost_per_serving);
  }
  if (mealPlan.dinner?.cost_per_serving) {
    total += parseFloat(mealPlan.dinner.cost_per_serving);
  }
  return parseFloat(total.toFixed(2));
};

/**
 * Calculate total nutrition of meal plan
 * @param {Object} mealPlan - Meal plan object with breakfast, lunch, dinner
 * @returns {Object} Total nutrition values
 */
export const calculateMealPlanNutrition = (mealPlan) => {
  const nutrition = {
    calories: 0,
    protein: 0,
    carbs: 0,
    fat: 0,
  };

  ['breakfast', 'lunch', 'dinner'].forEach((mealType) => {
    const meal = mealPlan[mealType];
    if (meal) {
      // Get nutrition from recipe_nutritions if available, otherwise try direct properties
      const nutritionData = meal.recipe_nutritions || meal;
      nutrition.calories += parseFloat(nutritionData.calories || 0);
      nutrition.protein += parseFloat(nutritionData.protein || 0);
      nutrition.carbs += parseFloat(nutritionData.carbs || 0);
      nutrition.fat += parseFloat(nutritionData.fat || 0);
    }
  });

  return {
    calories: parseFloat(nutrition.calories.toFixed(2)),
    protein: parseFloat(nutrition.protein.toFixed(2)),
    carbs: parseFloat(nutrition.carbs.toFixed(2)),
    fat: parseFloat(nutrition.fat.toFixed(2)),
  };
};

/**
 * Get all allergens from meal plan
 * @param {Object} mealPlan - Meal plan object
 * @returns {Array} Array of unique allergens
 */
export const getMealPlanAllergens = (mealPlan) => {
  const allergens = new Set();
  
  ['breakfast', 'lunch', 'dinner'].forEach((mealType) => {
    const meal = mealPlan[mealType];
    if (meal?.allergens && Array.isArray(meal.allergens)) {
      meal.allergens.forEach((allergen) => allergens.add(allergen));
    }
  });
  
  return Array.from(allergens);
};

/**
 * Get cheapest market for meal plan
 * @param {Object} mealPlan - Meal plan object
 * @returns {Object} Market costs comparison
 */
export const getMealPlanMarketCosts = (mealPlan) => {
  const markets = ['A101', 'SOK', 'BIM', 'MIGROS'];
  const marketTotals = {};
  
  markets.forEach((market) => {
    let total = 0;
    ['breakfast', 'lunch', 'dinner'].forEach((mealType) => {
      const meal = mealPlan[mealType];
      if (meal?.recipe_costs?.[market]) {
        total += parseFloat(meal.recipe_costs[market]);
      }
    });
    marketTotals[market] = parseFloat(total.toFixed(2));
  });
  
  return marketTotals;
};

/**
 * Get cheapest market name
 * @param {Object} marketCosts - Market costs object
 * @returns {string} Cheapest market name
 */
export const getCheapestMarket = (marketCosts) => {
  let cheapest = null;
  let minCost = Infinity;
  
  Object.entries(marketCosts).forEach(([market, cost]) => {
    if (cost > 0 && cost < minCost) {
      minCost = cost;
      cheapest = market;
    }
  });
  
  return cheapest;
};

// ==================== LOCAL STORAGE FUNCTIONS ====================

/**
 * Get all saved meal plans from localStorage
 * @returns {Array} Array of saved meal plans
 */
export const getSavedMealPlans = () => {
  try {
    const plans = localStorage.getItem(STORAGE_KEY);
    return plans ? JSON.parse(plans) : [];
  } catch (error) {
    console.error('Error fetching meal plans:', error);
    return [];
  }
};

/**
 * Save a meal plan to localStorage
 * @param {Object} plan - The meal plan to save
 * @returns {Object} The saved meal plan
 */
export const saveMealPlan = (plan) => {
  try {
    const plans = getSavedMealPlans();
    
    const newPlan = {
      ...plan,
      id: Date.now(),
      date: new Date().toISOString(),
      totalCost: calculateMealPlanCost(plan),
      totalNutrition: calculateMealPlanNutrition(plan),
      allergens: getMealPlanAllergens(plan),
    };
    
    const updatedPlans = [...plans, newPlan];
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedPlans));
    
    return newPlan;
  } catch (error) {
    console.error('Error saving meal plan:', error);
    throw new Error('Failed to save meal plan');
  }
};

/**
 * Delete a meal plan by index
 * @param {number} index - The index of the plan to delete
 * @returns {boolean} Success status
 */
export const deleteMealPlanById = (index) => {
  try {
    const plans = getSavedMealPlans();
    
    if (index < 0 || index >= plans.length) {
      throw new Error('Invalid meal plan index');
    }
    
    const updatedPlans = plans.filter((_, i) => i !== index);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedPlans));
    
    return true;
  } catch (error) {
    console.error('Error deleting meal plan:', error);
    throw new Error('Failed to delete meal plan');
  }
};

/**
 * Update a meal plan by index
 * @param {number} index - The index of the plan to update
 * @param {Object} updatedPlan - The updated plan data
 * @returns {Object} The updated plan
 */
export const updateMealPlan = (index, updatedPlan) => {
  try {
    const plans = getSavedMealPlans();
    
    if (index < 0 || index >= plans.length) {
      throw new Error('Invalid meal plan index');
    }
    
    const updatedPlans = plans.map((plan, i) =>
      i === index ? { ...plan, ...updatedPlan } : plan
    );
    
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedPlans));
    
    return updatedPlan;
  } catch (error) {
    console.error('Error updating meal plan:', error);
    throw new Error('Failed to update meal plan');
  }
};

/**
 * Get a meal plan by index
 * @param {number} index - The index of the plan to retrieve
 * @returns {Object} The meal plan
 */
export const getMealPlanByIndex = (index) => {
  try {
    const plans = getSavedMealPlans();
    
    if (index < 0 || index >= plans.length) {
      throw new Error('Invalid meal plan index');
    }
    
    return plans[index];
  } catch (error) {
    console.error('Error retrieving meal plan:', error);
    throw new Error('Failed to retrieve meal plan');
  }
};

/**
 * Generate shopping list from meal plan using actual recipe ingredients
 * @param {Object} mealPlan - The meal plan
 * @returns {Object} Shopping list with categories
 */
export const generateShoppingList = (mealPlan) => {
  const shoppingList = {
    categories: [],
  };

  // Process each meal type
  ['breakfast', 'lunch', 'dinner'].forEach((mealType) => {
    const meal = mealPlan.activePlan?.[mealType] || mealPlan[mealType];
    if (meal && meal.ingredients) {
      meal.ingredients.forEach((ingredient) => {
        addIngredientToShoppingList(shoppingList, ingredient);
      });
    }
  });

  // Calculate total cost
  shoppingList.totalCost = shoppingList.categories.reduce((total, category) => {
    return (
      total +
      category.items.reduce((categoryTotal, item) => {
        return categoryTotal + (item.price || 0);
      }, 0)
    );
  }, 0);

  return shoppingList;
};

/**
 * Helper function to add ingredient to shopping list
 * @param {Object} shoppingList - Shopping list object
 * @param {Object} ingredient - Ingredient object
 */
const addIngredientToShoppingList = (shoppingList, ingredient) => {
  const categoryName = ingredient.category || 'Other';
  
  let category = shoppingList.categories.find((cat) => cat.name === categoryName);
  
  if (!category) {
    category = { name: categoryName, items: [] };
    shoppingList.categories.push(category);
  }
  
  const existingItem = category.items.find((i) => i.name === ingredient.ingredient_name);
  
  if (existingItem) {
    existingItem.quantity += ingredient.quantity;
    existingItem.price += ingredient.price || 0;
  } else {
    category.items.push({
      name: ingredient.ingredient_name,
      quantity: ingredient.quantity,
      unit: ingredient.unit,
      price: ingredient.price || 0,
    });
  }
};

export default {
  fetchMealPlanRecipes,
  fetchRecipesByMealType,
  getRandomRecipe,
  generateRandomMealPlan,
  calculateMealPlanCost,
  calculateMealPlanNutrition,
  getMealPlanAllergens,
  getMealPlanMarketCosts,
  getCheapestMarket,
  getSavedMealPlans,
  saveMealPlan,
  deleteMealPlanById,
  updateMealPlan,
  getMealPlanByIndex,
  generateShoppingList,
};
