import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import RecipeDetailPage from '../pages/recipes/RecipeDetailPage';
import * as recipeService from '../services/recipeService';
import * as authService from '../services/authService';

// Mock services
jest.mock('../services/recipeService');
jest.mock('../services/authService');
jest.mock('../services/authService', () => ({
  getCurrentUser: jest.fn(() => Promise.resolve({ id: 1, name: 'Test User' })),
}));

const mockRecipe = {
  id: 1,
  name: 'Pasta',
  meal_type: 'dinner',
  prep_time: 10,
  cook_time: 20,
  cost_per_serving: 5,
  dietary_info: ['Vegetarian'],
  alergens: ['gluten'],
  difficulty_rating: 3,
  taste_rating: 4,
  health_rating: 2,
  steps: ['Boil water', 'Add pasta'],
  ingredients: [
    {
      quantity: 200,
      unit: 'g',
      ingredient: { name: 'Spaghetti' },
    },
  ],
  creator_id: 42,
};

const renderWithRouter = (ui) => {
  return render(<BrowserRouter>{ui}</BrowserRouter>);
};

describe('RecipeDetailPage', () => {
  beforeEach(() => {
    recipeService.getRecipeById.mockResolvedValue(mockRecipe);
    recipeService.getWikidataImage.mockResolvedValue(null); // skip image
    authService.getCurrentUser.mockResolvedValue({ id: 42 }); // same as creator
  });

  test('renders recipe details after loading', async () => {
    renderWithRouter(<RecipeDetailPage />);

    // render Pasta correctly
    await waitFor(() => {
      const pastaElements = screen.getAllByText(/Pasta/i);
      expect(pastaElements.length).toBeGreaterThan(0);
    });

    expect(screen.getByText(/PREP TIME/i)).toBeInTheDocument();
    expect(screen.getByText(/10 mins/i)).toBeInTheDocument();
    expect(screen.getByText(/Boil water/i)).toBeInTheDocument();
    expect(screen.getByText(/Spaghetti/i)).toBeInTheDocument();
  });

  test('shows error message on failed fetch', async () => {
    recipeService.getRecipeById.mockRejectedValueOnce(new Error('Fetch failed'));
    renderWithRouter(<RecipeDetailPage />);

    await waitFor(() => {
      expect(screen.getByText(/Failed to load recipe/i)).toBeInTheDocument();
    });
  });

  test('shows edit and delete buttons if user is creator', async () => {
    renderWithRouter(<RecipeDetailPage />);

    await waitFor(() => {
      expect(screen.getByText(/Delete Recipe/i)).toBeInTheDocument();
      expect(screen.getByText(/Edit Recipe/i)).toBeInTheDocument();
    });
  });

  test('hides edit and delete buttons if user is not creator', async () => {
    authService.getCurrentUser.mockResolvedValueOnce({ id: 99 }); // different user
    renderWithRouter(<RecipeDetailPage />);

    await waitFor(() => {
      expect(screen.queryByText(/Delete Recipe/i)).not.toBeInTheDocument();
      expect(screen.queryByText(/Edit Recipe/i)).not.toBeInTheDocument();
    });
  });

    //// filepath: practice-app/frontend/src/__tests__/RecipeDetailPage.test.jsx
    test('shows loading indicator while fetching', async () => {
        recipeService.getRecipeById.mockImplementation(() => new Promise(() => {})); // never resolves
        renderWithRouter(<RecipeDetailPage />);
        expect(screen.getByText(/Loading recipe/i)).toBeInTheDocument();
    });

    //// filepath: practice-app/frontend/src/__tests__/RecipeDetailPage.test.jsx
    test('shows not found message if recipe is null', async () => {
        recipeService.getRecipeById.mockResolvedValueOnce(null);
        renderWithRouter(<RecipeDetailPage />);
        await waitFor(() => {
            expect(screen.getByText(/Recipe not found/i)).toBeInTheDocument();
        });
    });

    //// filepath: practice-app/frontend/src/__tests__/RecipeDetailPage.test.jsx
    test('shows "No steps provided" and "No ingredients provided" if empty', async () => {
        recipeService.getRecipeById.mockResolvedValueOnce({
            ...mockRecipe,
            steps: [],
            ingredients: [],
        });
        renderWithRouter(<RecipeDetailPage />);
        await waitFor(() => {
            expect(screen.getByText(/No steps provided/i)).toBeInTheDocument();
            expect(screen.getByText(/No ingredients provided/i)).toBeInTheDocument();
        });
    });

    //// filepath: practice-app/frontend/src/__tests__/RecipeDetailPage.test.jsx
    test('renders recipe image if available', async () => {
        recipeService.getWikidataImage.mockResolvedValueOnce('https://test.com/image.jpg');
        renderWithRouter(<RecipeDetailPage />);
        await waitFor(() => {
            const header = document.querySelector('.recipe-detail-page-header');
            expect(header.style.backgroundImage).toContain('https://test.com/image.jpg');
        });
    });

    //// filepath: practice-app/frontend/src/__tests__/RecipeDetailPage.test.jsx
    test('shows "None" if no allergens or dietary info', async () => {
        recipeService.getRecipeById.mockResolvedValueOnce({
            ...mockRecipe,
            dietary_info: [],
            alergens: [],
        });
        renderWithRouter(<RecipeDetailPage />);
        await waitFor(() => {
            const noneElements = screen.getAllByText(/None/i);
        expect(noneElements.length).toBe(2);
        });
    });

    
});
