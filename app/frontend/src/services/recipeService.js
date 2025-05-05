// src/services/recipeService.js

// Local storage key for saved recipes
const STORAGE_KEY_RECIPES = 'mealPlanner_recipes';
const STORAGE_KEY_BOOKMARKS = 'mealPlanner_bookmarkedRecipes';

// Mock data for recipes
const mockRecipes = [
  {
    id: 1,
    title: 'Chicken & Rice Bowl',
    description: 'High-protein simple meal.',
    ingredients: [
      { name: "Chicken Breast", quantity: "150g" },
      { name: "Brown Rice", quantity: "100g" },
      { name: "Broccoli", quantity: "100g" },
      { name: "Olive Oil", quantity: "1 tbsp" },
      { name: "Soy Sauce", quantity: "1 tbsp" }
    ],
    instructions: "1. Cook rice according to package instructions.\n2. Season chicken with salt and pepper.\n3. Cook chicken in a pan with olive oil.\n4. Steam broccoli until tender.\n5. Combine all ingredients in a bowl and drizzle with soy sauce.",
    costPerServing: 20,
    preparationTime: 25,
    badges: ['High Protein', 'Gluten-Free'],
    createdBy: 'Hilal',
    imageUrl: 'https://via.placeholder.com/600x400',
    nutrition: {
      calories: 420,
      protein: 35,
      carbs: 40,
      fat: 12
    }
  },
  {
    id: 2,
    title: 'Vegan Buddha Bowl',
    description: 'Colorful vegan meal.',
    ingredients: [
      { name: "Quinoa", quantity: "100g" },
      { name: "Chickpeas", quantity: "100g" },
      { name: "Avocado", quantity: "1/2" },
      { name: "Cherry Tomatoes", quantity: "100g" },
      { name: "Spinach", quantity: "50g" },
      { name: "Tahini", quantity: "2 tbsp" },
      { name: "Lemon Juice", quantity: "1 tbsp" }
    ],
    instructions: "1. Cook quinoa according to package instructions.\n2. Rinse and drain chickpeas.\n3. Slice avocado and halve cherry tomatoes.\n4. Arrange all vegetables on top of quinoa.\n5. Mix tahini with lemon juice and drizzle over the bowl.",
    costPerServing: 18,
    preparationTime: 20,
    badges: ['Vegan', 'Low Carbohydrate'],
    createdBy: 'Furkan',
    imageUrl: 'https://via.placeholder.com/600x400',
    nutrition: {
      calories: 380,
      protein: 15,
      carbs: 45,
      fat: 16
    }
  },
  {
    id: 3,
    title: 'Stuffed Eggplant',
    description: 'Classic Turkish recipe.',
    ingredients: [
      { name: "Eggplants", quantity: "2 medium" },
      { name: "Ground Beef", quantity: "150g" },
      { name: "Onion", quantity: "1 medium" },
      { name: "Rice", quantity: "1/2 cup" },
      { name: "Tomato Paste", quantity: "2 tbsp" },
      { name: "Parsley", quantity: "1/4 cup" },
      { name: "Olive Oil", quantity: "2 tbsp" }
    ],
    instructions: "1. Cut eggplants in half and scoop out flesh, leaving a shell.\n2. Chop eggplant flesh and onions, and sauté with olive oil.\n3. Add ground beef and cook until browned.\n4. Add rice, tomato paste, and seasonings. Cook for a few minutes.\n5. Fill eggplant shells with the mixture.\n6. Bake at 180°C for 30 minutes.",
    costPerServing: 15,
    preparationTime: 45,
    badges: ['Gluten-Free'],
    createdBy: 'Canan',
    imageUrl: 'https://via.placeholder.com/600x400',
    nutrition: {
      calories: 320,
      protein: 18,
      carbs: 30,
      fat: 15
    }
  },
  {
    id: 4,
    title: 'Mediterranean Salad',
    description: 'Fresh and healthy Mediterranean salad.',
    ingredients: [
      { name: "Cucumber", quantity: "1 medium" },
      { name: "Tomatoes", quantity: "2 medium" },
      { name: "Red Onion", quantity: "1/2 small" },
      { name: "Feta Cheese", quantity: "100g" },
      { name: "Kalamata Olives", quantity: "50g" },
      { name: "Olive Oil", quantity: "2 tbsp" },
      { name: "Lemon Juice", quantity: "1 tbsp" },
      { name: "Oregano", quantity: "1 tsp" }
    ],
    instructions: "1. Dice cucumber, tomatoes, and red onion.\n2. Crumble feta cheese.\n3. Combine all ingredients in a bowl.\n4. Mix olive oil, lemon juice, and oregano for dressing.\n5. Pour dressing over salad and toss gently.",
    costPerServing: 12,
    preparationTime: 15,
    badges: ['Vegetarian', 'Quick'],
    createdBy: 'Mehmet',
    imageUrl: 'https://via.placeholder.com/600x400',
    nutrition: {
      calories: 250,
      protein: 8,
      carbs: 12,
      fat: 18
    }
  },
  {
    id: 5,
    title: 'Lentil Soup',
    description: 'Hearty and nutritious Turkish lentil soup.',
    ingredients: [
      { name: "Red Lentils", quantity: "1 cup" },
      { name: "Onion", quantity: "1 medium" },
      { name: "Carrot", quantity: "1 medium" },
      { name: "Potato", quantity: "1 small" },
      { name: "Tomato Paste", quantity: "1 tbsp" },
      { name: "Cumin", quantity: "1 tsp" },
      { name: "Paprika", quantity: "1 tsp" },
      { name: "Olive Oil", quantity: "2 tbsp" },
      { name: "Lemon Wedges", quantity: "for serving" }
    ],
    instructions: "1. Chop onion, carrot, and potato.\n2. Sauté vegetables in olive oil until softened.\n3. Add lentils, tomato paste, spices, and 6 cups of water.\n4. Bring to a boil, then simmer for 30 minutes.\n5. Blend until smooth.\n6. Serve with lemon wedges.",
    costPerServing: 8,
    preparationTime: 40,
    badges: ['Vegan', 'Budget-Friendly'],
    createdBy: 'Ayşe',
    imageUrl: 'https://via.placeholder.com/600x400',
    nutrition: {
      calories: 220,
      protein: 12,
      carbs: 35,
      fat: 5
    }
  }
];

// Initialize local storage with mock data if empty
const initRecipes = () => {
  const recipes = localStorage.getItem(STORAGE_KEY_RECIPES);
  if (!recipes) {
    localStorage.setItem(STORAGE_KEY_RECIPES, JSON.stringify(mockRecipes));
  }
};

/**
 * Get all recipes from localStorage
 * @returns {Array} Array of recipes
 */
export const getAllRecipes = () => {
  try {
    initRecipes(); // Initialize if needed
    const recipes = localStorage.getItem(STORAGE_KEY_RECIPES);
    return recipes ? JSON.parse(recipes) : [];
  } catch (error) {
    console.error('Error fetching recipes:', error);
    return [];
  }
};

/**
 * Get a recipe by ID
 * @param {number} id Recipe ID
 * @returns {Object|null} Recipe object or null if not found
 */
export const getRecipeById = (id) => {
  try {
    const recipes = getAllRecipes();
    const recipe = recipes.find(recipe => recipe.id === parseInt(id));
    return recipe || null;
  } catch (error) {
    console.error('Error fetching recipe:', error);
    return null;
  }
};

/**
 * Add a new recipe
 * @param {Object} recipe Recipe object without ID
 * @returns {Object} Recipe object with ID
 */
export const addRecipe = (recipe) => {
  try {
    const recipes = getAllRecipes();
    const newId = recipes.length > 0 ? Math.max(...recipes.map(r => r.id)) + 1 : 1;
    
    const newRecipe = {
      ...recipe,
      id: newId,
      createdAt: new Date().toISOString()
    };
    
    const updatedRecipes = [...recipes, newRecipe];
    localStorage.setItem(STORAGE_KEY_RECIPES, JSON.stringify(updatedRecipes));
    
    return newRecipe;
  } catch (error) {
    console.error('Error adding recipe:', error);
    throw new Error('Failed to add recipe');
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
export const deleteRecipe = (id) => {
  try {
    const recipes = getAllRecipes();
    const updatedRecipes = recipes.filter(recipe => recipe.id !== parseInt(id));
    
    if (updatedRecipes.length === recipes.length) {
      throw new Error('Recipe not found');
    }
    
    localStorage.setItem(STORAGE_KEY_RECIPES, JSON.stringify(updatedRecipes));
    
    // Also remove from bookmarks if present
    removeFromBookmarks(id);
    
    return true;
  } catch (error) {
    console.error('Error deleting recipe:', error);
    throw new Error('Failed to delete recipe');
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