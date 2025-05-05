// src/services/mealPlanService.js

// Local storage key for saved meal plans
const STORAGE_KEY = 'mealPlanner_savedMealPlans';

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
 * @param {Object} plan The meal plan to save
 * @returns {Object} The saved meal plan
 */
export const saveMealPlan = (plan) => {
  try {
    // Get existing plans
    const plans = getSavedMealPlans();
    
    // Add new plan
    const updatedPlans = [...plans, { 
      ...plan, 
      id: Date.now(), // Add a unique ID
      date: new Date().toISOString() // Ensure there's a date
    }];
    
    // Save to localStorage
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedPlans));
    
    return plan;
  } catch (error) {
    console.error('Error saving meal plan:', error);
    throw new Error('Failed to save meal plan');
  }
};

/**
 * Delete a meal plan by index
 * @param {number} index The index of the plan to delete
 * @returns {boolean} Success status
 */
export const deleteMealPlanById = (index) => {
  try {
    // Get existing plans
    const plans = getSavedMealPlans();
    
    // Check if index is valid
    if (index < 0 || index >= plans.length) {
      throw new Error('Invalid meal plan index');
    }
    
    // Remove the plan at the specified index
    const updatedPlans = plans.filter((_, i) => i !== index);
    
    // Save to localStorage
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedPlans));
    
    return true;
  } catch (error) {
    console.error('Error deleting meal plan:', error);
    throw new Error('Failed to delete meal plan');
  }
};

/**
 * Update a meal plan by index
 * @param {number} index The index of the plan to update
 * @param {Object} updatedPlan The updated plan data
 * @returns {Object} The updated plan
 */
export const updateMealPlan = (index, updatedPlan) => {
  try {
    // Get existing plans
    const plans = getSavedMealPlans();
    
    // Check if index is valid
    if (index < 0 || index >= plans.length) {
      throw new Error('Invalid meal plan index');
    }
    
    // Update the plan
    const updatedPlans = plans.map((plan, i) => 
      i === index ? { ...plan, ...updatedPlan } : plan
    );
    
    // Save to localStorage
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedPlans));
    
    return updatedPlan;
  } catch (error) {
    console.error('Error updating meal plan:', error);
    throw new Error('Failed to update meal plan');
  }
};

/**
 * Get a meal plan by index
 * @param {number} index The index of the plan to retrieve
 * @returns {Object} The meal plan
 */
export const getMealPlanByIndex = (index) => {
  try {
    // Get existing plans
    const plans = getSavedMealPlans();
    
    // Check if index is valid
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
 * Generate a shopping list from a meal plan
 * @param {Object} mealPlan The meal plan
 * @returns {Object} The shopping list categorized by food type
 */
export const generateShoppingList = (mealPlan) => {
  // This is a simplified implementation
  // In a real app, you would have a database of ingredients for each meal
  
  // Mock shopping list generation based on meal types
  const shoppingList = {
    categories: []
  };
  
  // Check for breakfast
  if (mealPlan.activePlan?.breakfast) {
    const breakfastItems = generateItemsForMeal(mealPlan.activePlan.breakfast);
    breakfastItems.forEach(item => addItemToShoppingList(shoppingList, item));
  }
  
  // Check for lunch
  if (mealPlan.activePlan?.lunch) {
    const lunchItems = generateItemsForMeal(mealPlan.activePlan.lunch);
    lunchItems.forEach(item => addItemToShoppingList(shoppingList, item));
  }
  
  // Check for dinner
  if (mealPlan.activePlan?.dinner) {
    const dinnerItems = generateItemsForMeal(mealPlan.activePlan.dinner);
    dinnerItems.forEach(item => addItemToShoppingList(shoppingList, item));
  }
  
  // Calculate total cost
  shoppingList.totalCost = shoppingList.categories.reduce((total, category) => {
    return total + category.items.reduce((categoryTotal, item) => {
      return categoryTotal + item.price;
    }, 0);
  }, 0);
  
  return shoppingList;
};

/**
 * Helper function to generate items for a meal
 * @param {Object} meal The meal object
 * @returns {Array} Array of ingredients/items
 */
const generateItemsForMeal = (meal) => {
  // In a real app, this would be fetched from a database
  // Here we're using a simplified mock implementation
  
  const mockIngredients = {
    // Breakfast meals
    1: [ // Oatmeal with Fruit
      { name: "Oats", quantity: "50g", price: 10, category: "Grains" },
      { name: "Banana", quantity: "1", price: 5, category: "Produce" },
      { name: "Blueberries", quantity: "50g", price: 15, category: "Produce" },
      { name: "Honey", quantity: "15ml", price: 8, category: "Sweeteners" },
    ],
    2: [ // Menemen
      { name: "Eggs", quantity: "2", price: 10, category: "Dairy" },
      { name: "Tomatoes", quantity: "2", price: 8, category: "Produce" },
      { name: "Bell Pepper", quantity: "1", price: 7, category: "Produce" },
      { name: "Onion", quantity: "1/2", price: 3, category: "Produce" },
    ],
    3: [ // Whole Grain Toast with Avocado
      { name: "Whole Grain Bread", quantity: "2 slices", price: 8, category: "Grains" },
      { name: "Avocado", quantity: "1/2", price: 15, category: "Produce" },
      { name: "Lemon Juice", quantity: "5ml", price: 3, category: "Condiments" },
      { name: "Salt", quantity: "pinch", price: 1, category: "Spices" },
    ],
    4: [ // Greek Yogurt with Honey
      { name: "Greek Yogurt", quantity: "200g", price: 15, category: "Dairy" },
      { name: "Honey", quantity: "15ml", price: 8, category: "Sweeteners" },
      { name: "Almonds", quantity: "15g", price: 12, category: "Nuts" },
    ],
    5: [ // Spinach and Feta Omelette
      { name: "Eggs", quantity: "3", price: 15, category: "Dairy" },
      { name: "Spinach", quantity: "50g", price: 8, category: "Produce" },
      { name: "Feta Cheese", quantity: "30g", price: 12, category: "Dairy" },
      { name: "Olive Oil", quantity: "5ml", price: 3, category: "Oils" },
    ],
    
    // Lunch meals
    6: [ // Grilled Chicken Salad
      { name: "Chicken Breast", quantity: "150g", price: 25, category: "Protein" },
      { name: "Mixed Greens", quantity: "100g", price: 15, category: "Produce" },
      { name: "Cherry Tomatoes", quantity: "8", price: 10, category: "Produce" },
      { name: "Cucumber", quantity: "1/2", price: 5, category: "Produce" },
      { name: "Olive Oil", quantity: "15ml", price: 8, category: "Oils" },
    ],
    7: [ // Vegetarian Quinoa Bowl
      { name: "Quinoa", quantity: "100g", price: 18, category: "Grains" },
      { name: "Bell Pepper", quantity: "1", price: 7, category: "Produce" },
      { name: "Chickpeas", quantity: "100g", price: 8, category: "Protein" },
      { name: "Feta Cheese", quantity: "30g", price: 12, category: "Dairy" },
      { name: "Lemon Juice", quantity: "10ml", price: 5, category: "Condiments" },
    ],
    8: [ // Lentil Soup
      { name: "Red Lentils", quantity: "100g", price: 12, category: "Legumes" },
      { name: "Onion", quantity: "1", price: 5, category: "Produce" },
      { name: "Carrots", quantity: "2", price: 6, category: "Produce" },
      { name: "Vegetable Broth", quantity: "500ml", price: 8, category: "Condiments" },
    ],
    9: [ // Mediterranean Wrap
      { name: "Whole Wheat Wrap", quantity: "1", price: 8, category: "Grains" },
      { name: "Hummus", quantity: "50g", price: 12, category: "Spreads" },
      { name: "Tomato", quantity: "1", price: 5, category: "Produce" },
      { name: "Cucumber", quantity: "1/2", price: 5, category: "Produce" },
      { name: "Feta Cheese", quantity: "30g", price: 12, category: "Dairy" },
    ],
    10: [ // Tuna Salad Sandwich
      { name: "Whole Grain Bread", quantity: "2 slices", price: 8, category: "Grains" },
      { name: "Tuna", quantity: "100g", price: 20, category: "Protein" },
      { name: "Mayonnaise", quantity: "15g", price: 5, category: "Condiments" },
      { name: "Celery", quantity: "1 stalk", price: 3, category: "Produce" },
      { name: "Lettuce", quantity: "20g", price: 4, category: "Produce" },
    ],
    
    // Dinner meals
    11: [ // Stuffed Peppers
      { name: "Bell Peppers", quantity: "2", price: 14, category: "Produce" },
      { name: "Ground Beef", quantity: "150g", price: 30, category: "Protein" },
      { name: "Rice", quantity: "100g", price: 8, category: "Grains" },
      { name: "Onion", quantity: "1", price: 5, category: "Produce" },
      { name: "Tomato Sauce", quantity: "100ml", price: 12, category: "Condiments" },
    ],
    12: [ // Baked Salmon & Veggies
      { name: "Salmon Fillet", quantity: "200g", price: 60, category: "Protein" },
      { name: "Broccoli", quantity: "150g", price: 12, category: "Produce" },
      { name: "Carrots", quantity: "2", price: 6, category: "Produce" },
      { name: "Olive Oil", quantity: "15ml", price: 8, category: "Oils" },
      { name: "Lemon", quantity: "1", price: 5, category: "Produce" },
    ],
    13: [ // Pasta Primavera
      { name: "Pasta", quantity: "100g", price: 10, category: "Grains" },
      { name: "Zucchini", quantity: "1", price: 8, category: "Produce" },
      { name: "Bell Pepper", quantity: "1", price: 7, category: "Produce" },
      { name: "Cherry Tomatoes", quantity: "10", price: 12, category: "Produce" },
      { name: "Parmesan Cheese", quantity: "20g", price: 10, category: "Dairy" },
    ],
    14: [ // Beef Stir Fry
      { name: "Beef Strips", quantity: "200g", price: 40, category: "Protein" },
      { name: "Broccoli", quantity: "150g", price: 12, category: "Produce" },
      { name: "Bell Pepper", quantity: "1", price: 7, category: "Produce" },
      { name: "Soy Sauce", quantity: "15ml", price: 6, category: "Condiments" },
      { name: "Rice", quantity: "100g", price: 8, category: "Grains" },
    ],
    15: [ // Vegetable Curry with Rice
      { name: "Rice", quantity: "100g", price: 8, category: "Grains" },
      { name: "Chickpeas", quantity: "100g", price: 8, category: "Protein" },
      { name: "Coconut Milk", quantity: "200ml", price: 15, category: "Dairy" },
      { name: "Curry Paste", quantity: "30g", price: 12, category: "Spices" },
      { name: "Mixed Vegetables", quantity: "200g", price: 20, category: "Produce" },
    ],
  };
  
  return mockIngredients[meal.id] || [];
};

/**
 * Helper function to add an item to the shopping list
 * @param {Object} shoppingList The shopping list object
 * @param {Object} item The item to add
 */
const addItemToShoppingList = (shoppingList, item) => {
  // Find the category
  let category = shoppingList.categories.find(cat => cat.name === item.category);
  
  // If category doesn't exist, create it
  if (!category) {
    category = { name: item.category, items: [] };
    shoppingList.categories.push(category);
  }
  
  // Check if the item already exists in the category
  const existingItem = category.items.find(i => i.name === item.name);
  
  if (existingItem) {
    // If item exists, we could update the quantity (simplified approach)
    existingItem.price += item.price;
  } else {
    // If item doesn't exist, add it
    category.items.push({ ...item });
  }
};