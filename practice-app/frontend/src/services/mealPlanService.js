// mealPlanService.js - Enhanced service for meal planning functionality
const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000';

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
 * @param {Response} response - Fetch response object
 * @returns {Object} - Parsed JSON response
 */
const handleApiResponse = async (response) => {
  if (!response.ok) {
    const errorData = await response.text();
    throw new Error(`API request failed: ${response.status} ${errorData}`);
  }
  
  const contentType = response.headers.get('content-type');
  if (contentType && contentType.includes('application/json')) {
    return await response.json();
  }
  
  return await response.text();
};

/**
 * Get recipes from the meal planner endpoint with filtering
 * @param {Object} filters - Filter parameters for recipe search
 * @returns {Promise<Object>} - Paginated recipe results
 */
export const getRecipesByMealPlanner = async (filters = {}) => {
  try {
    const queryParams = new URLSearchParams();
    
    // Add filter parameters to query string with proper formatting
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== null && value !== undefined && value !== '') {
        // Convert boolean values properly
        if (typeof value === 'boolean') {
          queryParams.append(key, value.toString());
        } else {
          queryParams.append(key, value.toString());
        }
      }
    });

    const url = `${API_BASE}/recipes/meal_planner/?${queryParams.toString()}`;
    console.log('🔗 Fetching recipes from:', url);
    console.log('📋 Filters being sent:', filters);
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        ...getAuthHeaders(),
        'Content-Type': 'application/json',
      },
    });

    const result = await handleApiResponse(response);
    console.log('✅ API response received:', {
      page: result.page,
      page_size: result.page_size,
      total: result.total,
      results_count: result.results?.length || 0
    });
    
    return result;
  } catch (error) {
    console.error('❌ Error fetching meal planner recipes:', error);
    throw new Error(`Failed to fetch recipes: ${error.message}`);
  }
};

/**
 * Get a specific recipe by ID with full details
 * @param {number} recipeId - Recipe ID
 * @returns {Promise<Object>} - Recipe details
 */
export const getRecipeById = async (recipeId) => {
  try {
    const response = await fetch(`${API_BASE}/recipes/${recipeId}/`, {
      method: 'GET',
      headers: {
        ...getAuthHeaders(),
        'Content-Type': 'application/json',
      },
    });

    return await handleApiResponse(response);
  } catch (error) {
    console.error('Error fetching recipe details:', error);
    throw new Error(`Failed to fetch recipe details: ${error.message}`);
  }
};

/**
 * Generate a random meal plan within budget constraints
 * @param {Object} params - Budget and dietary constraints
 * @returns {Promise<Object>} - Generated meal plan
 */
export const generateRandomMealPlan = async (params = {}) => {
  try {
    const { budget, dietaryRestrictions = [], allergenExclusions = [], maxPrepTime } = params;
    
    const mealPlan = {
      breakfast: null,
      lunch: null,
      dinner: null
    };
    
    let remainingBudget = parseFloat(budget) || 0;
    
    // For each meal type, get recipes and select randomly within budget
    for (const mealType of ['breakfast', 'lunch', 'dinner']) {
      const maxCostPerServing = remainingBudget / (3 - Object.keys(mealPlan).filter(key => mealPlan[key]).length);
      
      const filters = {
        meal_type: mealType,
        page_size: 50, // Get more options for better randomization
        ...(maxCostPerServing > 0 && { max_cost_per_serving: maxCostPerServing }),
        ...(maxPrepTime && { max_total_time: maxPrepTime })
      };

      const response = await getRecipesByMealPlanner(filters);
      
      // Filter by dietary restrictions and allergens
      let availableRecipes = response.results || [];
      
      if (dietaryRestrictions.length > 0) {
        availableRecipes = availableRecipes.filter(recipe =>
          dietaryRestrictions.some(diet =>
            recipe.dietary_info?.includes(diet)
          )
        );
      }
      
      if (allergenExclusions.length > 0) {
        availableRecipes = availableRecipes.filter(recipe =>
          !allergenExclusions.some(allergen =>
            recipe.allergens?.includes(allergen)
          )
        );
      }
      
      // Select random recipe within budget
      const budgetFriendlyRecipes = availableRecipes.filter(recipe => {
        const cost = parseFloat(recipe.cost_per_serving);
        return cost && cost <= remainingBudget;
      });
      
      if (budgetFriendlyRecipes.length > 0) {
        const randomIndex = Math.floor(Math.random() * budgetFriendlyRecipes.length);
        const selectedRecipe = budgetFriendlyRecipes[randomIndex];
        mealPlan[mealType] = selectedRecipe;
        remainingBudget -= parseFloat(selectedRecipe.cost_per_serving);
      }
    }
    
    return {
      meals: mealPlan,
      totalCost: (parseFloat(budget) - remainingBudget).toFixed(2),
      remainingBudget: remainingBudget.toFixed(2)
    };
  } catch (error) {
    console.error('Error generating random meal plan:', error);
    throw new Error(`Failed to generate meal plan: ${error.message}`);
  }
};

/**
 * Calculate total nutrition for selected meals
 * @param {Object} selectedMeals - Object containing selected meals by type
 * @returns {Object} - Total nutrition information
 */
export const calculateTotalNutrition = (selectedMeals) => {
  const totals = {
    calories: 0,
    protein: 0,
    fat: 0,
    carbs: 0,
    fiber: 0,
    sugar: 0
  };
  
  Object.values(selectedMeals).forEach(meal => {
    if (meal && meal.recipe_nutritions) {
      const nutrition = meal.recipe_nutritions;
      totals.calories += parseFloat(nutrition.calories) || 0;
      totals.protein += parseFloat(nutrition.protein) || 0;
      totals.fat += parseFloat(nutrition.fat) || 0;
      totals.carbs += parseFloat(nutrition.carbs) || 0;
      totals.fiber += parseFloat(nutrition.fiber) || 0;
      totals.sugar += parseFloat(nutrition.sugar) || 0;
    }
  });
  
  // Round to reasonable precision
  Object.keys(totals).forEach(key => {
    totals[key] = Math.round(totals[key] * 10) / 10;
  });
  
  return totals;
};

/**
 * Calculate total cost for selected meals
 * @param {Object} selectedMeals - Object containing selected meals by type
 * @returns {number} - Total cost
 */
export const calculateTotalCost = (selectedMeals) => {
  let totalCost = 0;
  
  Object.values(selectedMeals).forEach(meal => {
    if (meal && meal.cost_per_serving) {
      totalCost += parseFloat(meal.cost_per_serving) || 0;
    }
  });
  
  return Math.round(totalCost * 100) / 100; // Round to 2 decimal places
};

/**
 * Get all allergens from selected meals
 * @param {Object} selectedMeals - Object containing selected meals by type
 * @returns {Array} - Array of unique allergens
 */
export const getAllergens = (selectedMeals) => {
  const allergens = new Set();
  
  Object.values(selectedMeals).forEach(meal => {
    if (meal && meal.allergens) {
      meal.allergens.forEach(allergen => allergens.add(allergen));
    }
  });
  
  return Array.from(allergens);
};

/**
 * Generate shopping list from selected meals
 * @param {Object} selectedMeals - Object containing selected meals by type
 * @returns {Object} - Shopping list with ingredients grouped by category
 */
export const generateShoppingList = (selectedMeals) => {
  const shoppingList = {
    id: Date.now().toString(),
    createdAt: new Date().toISOString(),
    items: [],
    totalCost: 0,
    costByMarket: {
      A101: 0,
      SOK: 0,
      BIM: 0,
      MIGROS: 0
    },
    cheapestMarket: 'BIM',
    mealReferences: []
  };

  // Process each meal in the meal plan
  Object.entries(selectedMeals).forEach(([mealType, meal]) => {
    if (meal) {
      // Add meal reference
      shoppingList.mealReferences.push({
        mealType,
        mealName: meal.name,
        recipeId: meal.id
      });

      // Create shopping list item for this meal
      const item = {
        id: `${meal.id}-item`,
        name: `Ingredients for ${meal.name}`,
        category: mealType,
        quantity: 1,
        unit: 'recipe',
        estimatedCosts: meal.recipe_costs || {
          A101: parseFloat(meal.cost_per_serving || 0),
          SOK: parseFloat(meal.cost_per_serving || 0),
          BIM: parseFloat(meal.cost_per_serving || 0),
          MIGROS: parseFloat(meal.cost_per_serving || 0)
        },
        mealInfo: {
          mealType,
          recipeName: meal.name,
          recipeId: meal.id
        }
      };

      shoppingList.items.push(item);

      // Add to market costs
      Object.entries(item.estimatedCosts).forEach(([market, cost]) => {
        shoppingList.costByMarket[market] += cost || 0;
      });
    }
  });

  // Find cheapest market
  const cheapestMarket = Object.entries(shoppingList.costByMarket)
    .reduce((min, [market, cost]) => 
      cost < min.cost ? { market, cost } : min, 
      { market: 'BIM', cost: Infinity }
    ).market;

  shoppingList.cheapestMarket = cheapestMarket;
  shoppingList.totalCost = shoppingList.costByMarket[cheapestMarket];

  // Round costs to 2 decimal places
  Object.keys(shoppingList.costByMarket).forEach(market => {
    shoppingList.costByMarket[market] = Math.round(shoppingList.costByMarket[market] * 100) / 100;
  });
  shoppingList.totalCost = Math.round(shoppingList.totalCost * 100) / 100;

  return shoppingList;
};

/**
 * Get retailer information for shopping list
 * @returns {Object} - Retailer information with links and details
 */
export const getRetailerInfo = () => {
  return {
    A101: {
      name: 'A101',
      website: 'https://www.a101.com.tr',
      logo: '/market-logos/a101.png',
      description: 'Discount supermarket chain',
      onlineDelivery: true,
      color: '#e11d48'
    },
    SOK: {
      name: 'ŞOK',
      website: 'https://www.sokmarket.com.tr',
      logo: '/market-logos/sok.png',
      description: 'Neighborhood discount store',
      onlineDelivery: false,
      color: '#dc2626'
    },
    BIM: {
      name: 'BİM',
      website: 'https://www.bim.com.tr',
      logo: '/market-logos/bim.png',
      description: 'Hard discount supermarket',
      onlineDelivery: false,
      color: '#1e40af'
    },
    MIGROS: {
      name: 'Migros',
      website: 'https://www.migros.com.tr',
      logo: '/market-logos/migros.png',
      description: 'Full-service supermarket',
      onlineDelivery: true,
      color: '#ea580c'
    }
  };
};

/**
 * Save meal plan to localStorage
 * @param {Object} mealPlan - Meal plan to save
 * @returns {boolean} - Success status
 */
export const saveMealPlan = (mealPlan) => {
  try {
    const savedPlans = getSavedMealPlans();
    const newPlan = {
      ...mealPlan,
      id: Date.now().toString(),
      createdAt: new Date().toISOString()
    };
    
    savedPlans.push(newPlan);
    localStorage.setItem('savedMealPlans', JSON.stringify(savedPlans));
    console.log('Meal plan saved successfully:', newPlan);
    return true;
  } catch (error) {
    console.error('Error saving meal plan:', error);
    return false;
  }
};

/**
 * Get saved meal plans from localStorage
 * @returns {Array} - Array of saved meal plans
 */
export const getSavedMealPlans = () => {
  try {
    const saved = localStorage.getItem('savedMealPlans');
    return saved ? JSON.parse(saved) : [];
  } catch (error) {
    console.error('Error loading saved meal plans:', error);
    return [];
  }
};

/**
 * Delete meal plan by ID
 * @param {string} id - ID of meal plan to delete
 * @returns {boolean} - Success status
 */
export const deleteMealPlanById = (id) => {
  try {
    const savedPlans = getSavedMealPlans();
    const filteredPlans = savedPlans.filter(plan => plan.id !== id);
    localStorage.setItem('savedMealPlans', JSON.stringify(filteredPlans));
    return true;
  } catch (error) {
    console.error('Error deleting meal plan:', error);
    return false;
  }
};

/**
 * Load meal plan by ID
 * @param {string} id - ID of meal plan to load
 * @returns {Object|null} - Meal plan object or null if not found
 */
export const loadMealPlanById = (id) => {
  try {
    const savedPlans = getSavedMealPlans();
    return savedPlans.find(plan => plan.id === id) || null;
  } catch (error) {
    console.error('Error loading meal plan:', error);
    return null;
  }
};

/**
 * Get shopping list for a specific meal plan
 * @param {string} mealPlanId - ID of the meal plan
 * @returns {Object|null} - Shopping list object or null if not found
 */
export const getShoppingListByMealPlanId = (mealPlanId) => {
  try {
    const savedLists = JSON.parse(localStorage.getItem('savedShoppingLists') || '[]');
    return savedLists.find(list => 
      list.mealPlanReference && list.mealPlanReference.id === mealPlanId
    ) || null;
  } catch (error) {
    console.error('Error loading shopping list:', error);
    return null;
  }
};

/**
 * Export meal plan to various formats
 * @param {Object} mealPlan - Meal plan to export
 * @param {string} format - Export format ('json', 'csv', 'txt')
 * @returns {string} - Exported data as string
 */
export const exportMealPlan = (mealPlan, format = 'json') => {
  try {
    switch (format.toLowerCase()) {
      case 'json':
        return JSON.stringify(mealPlan, null, 2);
        
      case 'csv':
        let csv = 'Meal Type,Recipe Name,Cost,Calories,Protein,Fat,Carbs\n';
        Object.entries(mealPlan.meals || {}).forEach(([mealType, meal]) => {
          if (meal) {
            const nutrition = meal.recipe_nutritions || {};
            csv += `${mealType},${meal.name},${meal.cost_per_serving},${nutrition.calories || 0},${nutrition.protein || 0},${nutrition.fat || 0},${nutrition.carbs || 0}\n`;
          }
        });
        return csv;
        
      case 'txt':
        let txt = `🍽️ Meal Plan: ${mealPlan.name}\n`;
        txt += `📅 Date: ${new Date(mealPlan.date || mealPlan.createdAt).toLocaleDateString()}\n\n`;
        
        Object.entries(mealPlan.meals || {}).forEach(([mealType, meal]) => {
          if (meal) {
            txt += `${mealType.toUpperCase()}:\n`;
            txt += `  ${meal.name}\n`;
            txt += `  Cost: $${meal.cost_per_serving}\n`;
            if (meal.recipe_nutritions) {
              txt += `  Calories: ${meal.recipe_nutritions.calories || 0}\n`;
              txt += `  Protein: ${meal.recipe_nutritions.protein || 0}g\n\n`;
            }
          }
        });
        
        txt += `Total Cost: $${mealPlan.totalCost}\n`;
        txt += `Total Calories: ${mealPlan.totalNutrition.calories}\n`;
        return txt;
        
      default:
        return JSON.stringify(mealPlan, null, 2);
    }
  } catch (error) {
    console.error('Error exporting meal plan:', error);
    return '';
  }
};

/**
 * Get user preferences for filtering
 * @returns {Object} - User dietary preferences and allergens
 */
export const getUserPreferences = () => {
  try {
    return {
      allergens: JSON.parse(localStorage.getItem('userAllergens') || '[]'),
      dietaryPreferences: JSON.parse(localStorage.getItem('userDietaryPrefs') || '[]'),
      budget: parseFloat(localStorage.getItem('userBudget') || '0'),
      currency: localStorage.getItem('userCurrency') || 'USD'
    };
  } catch (error) {
    console.error('Error loading user preferences:', error);
    return {
      allergens: [],
      dietaryPreferences: [],
      budget: 0,
      currency: 'USD'
    };
  }
};

/**
 * Save user preferences
 * @param {Object} preferences - User preferences to save
 * @returns {boolean} - Success status
 */
export const saveUserPreferences = (preferences) => {
  try {
    if (preferences.allergens) {
      localStorage.setItem('userAllergens', JSON.stringify(preferences.allergens));
    }
    if (preferences.dietaryPreferences) {
      localStorage.setItem('userDietaryPrefs', JSON.stringify(preferences.dietaryPreferences));
    }
    if (preferences.budget !== undefined) {
      localStorage.setItem('userBudget', preferences.budget.toString());
    }
    if (preferences.currency) {
      localStorage.setItem('userCurrency', preferences.currency);
    }
    return true;
  } catch (error) {
    console.error('Error saving user preferences:', error);
    return false;
  }
};

export default {
  getRecipesByMealPlanner,
  getRecipeById,
  generateRandomMealPlan,
  calculateTotalNutrition,
  calculateTotalCost,
  getAllergens,
  generateShoppingList,
  getRetailerInfo,
  saveMealPlan,
  getSavedMealPlans,
  deleteMealPlanById,
  loadMealPlanById,
  getShoppingListByMealPlanId,
  exportMealPlan,
  getUserPreferences,
  saveUserPreferences
};