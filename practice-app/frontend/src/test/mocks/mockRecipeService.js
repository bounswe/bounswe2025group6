// Mock for recipeService
export const getRecipeById = jest.fn().mockResolvedValue({
  id: 1,
  name: 'Mock Recipe',
  meal_type: 'Dinner',
  cost_per_serving: '9.99',
  prep_time: 15,
  cook_time: 30
});

export const getWikidataImage = jest.fn().mockResolvedValue('https://mock-image-url.com/recipe.jpg');
