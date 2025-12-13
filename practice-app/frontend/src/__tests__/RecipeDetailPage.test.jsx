import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import RecipeDetailPage from '../pages/recipes/RecipeDetailPage';
import { useAuth } from '../contexts/AuthContext';
import { useCurrency } from '../contexts/CurrencyContext';
import { getRecipeById, getWikidataImage, deleteRecipe } from '../services/recipeService';
import userService from '../services/userService';
import { toggleBookmark, getBookmarkedRecipes } from '../services/bookmarkService';
import { getCurrentUser } from '../services/authService';
import { ToastProvider } from '../components/ui/Toast';

// Mock dependencies
jest.mock('../contexts/AuthContext');
jest.mock('../contexts/CurrencyContext');
jest.mock('../services/recipeService');
jest.mock('../services/userService');
jest.mock('../services/bookmarkService');
jest.mock('../services/authService');

// Mock i18n
jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key) => {
      const translations = {
        Back: 'Back',
        recipeDetailPageCreatedBy: 'Created By',
        recipeDetailPageMealType: 'MEAL TYPE',
        recipeDetailPagePrepTime: 'PREP TIME',
        recipeDetailPageCookTime: 'COOK TIME',
        recipeDetailPageAllergens: 'Allergens',
        recipeDetailPageIngredients: 'INGREDIENTS',
        recipeDetailPageNoIngredients: 'No ingredients provided',
        recipeDetailPageDeleteRecipe: 'Delete Recipe',
        recipeDetailPageDifficultyRating: 'DIFFICULTY RATING',
        recipeDetailPageEditRecipe: 'Edit Recipe',
        recipeDetailPageDietaryInfo: 'Dietary Info',
        recipeDetailPageLoading: 'Loading...',
        recipeDetailPageTasteRating: 'TASTE RATING',
        recipeDetailPageInstructions: 'INSTRUCTIONS',
        recipeDetailPageHealthRating: 'HEALTH RATING',
        recipeDetailPageHealthRatingDietitian: 'Dietitian',
        recipeDetailPageNone: 'None',
        recipeDetailPageNoSteps: 'No steps provided',
        recipeDetailPageCost: 'COST',
        recipeDetailTime: 'mins',
        recipeDetailPageShareRecipe: 'Share Recipe',
        recipeDetailPageShareLink: 'View recipe at',
        recipeDetailPageShareCopied: 'Recipe link copied to clipboard!',
        recipeDetailPageShareError: 'Failed to share recipe. Please try again.',
        shareLink: 'View at',
        shareCopied: 'Link copied to clipboard!',
        shareError: 'Failed to share. Please try again.',
      };
      return translations[key] || key;
    },
    i18n: { language: 'en' },
  }),
}));

// Mock react-router-dom
const mockNavigate = jest.fn();
const mockParams = { id: '1' };
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
  useParams: () => mockParams,
  Link: ({ children, to }) => <a href={to}>{children}</a>,
}));

describe('RecipeDetailPage', () => {
  const mockCurrentUser = {
    id: 1,
    username: 'testuser',
  };

  const mockRecipe = {
    id: 1,
    name: 'Test Recipe',
    content: 'Test recipe description',
    creator_id: 1,
    meal_type: 'breakfast',
    prep_time: 15,
    cook_time: 30,
    cost_per_serving: 5.50,
    dietary_info: ['vegetarian'],
    allergens: ['eggs'],
    ingredients: [
      {
        ingredient: { id: 1, name: 'Eggs', base_unit: 'pieces' },
        quantity: 2,
        unit: 'pieces',
      },
    ],
    steps: ['Step 1', 'Step 2'],
    difficulty_rating: 3.5,
    taste_rating: 4.0,
    health_rating: 4.5,
    recipe_nutritions: {
      calories: 250,
      protein: 15,
      fat: 10,
      carbohydrates: 20,
    },
    created_at: '2024-01-01T10:00:00Z',
  };

  beforeEach(() => {
    jest.clearAllMocks();
    useAuth.mockReturnValue({ currentUser: mockCurrentUser });
    useCurrency.mockReturnValue({ currency: 'USD' });
    getRecipeById.mockResolvedValue(mockRecipe);
    getWikidataImage.mockResolvedValue(null);
    userService.getUserById.mockResolvedValue({ 
      preferredDateFormat: 'DD/MM/YYYY',
      username: 'Test User',
      profilePhoto: null
    });
    userService.getUsername.mockResolvedValue('Test User');
    getBookmarkedRecipes.mockResolvedValue([]);
    getCurrentUser.mockResolvedValue(mockCurrentUser);
  });

  const renderRecipeDetailPage = () => {
    return render(
      <BrowserRouter>
        <ToastProvider>
          <RecipeDetailPage />
        </ToastProvider>
      </BrowserRouter>
    );
  };

  describe('Share Functionality', () => {
    beforeEach(() => {
      // Mock Web Share API
      global.navigator.share = jest.fn();
      global.navigator.canShare = jest.fn(() => true);
    });

    test('renders share button on recipe detail page', async () => {
      renderRecipeDetailPage();

      await waitFor(() => {
        expect(screen.getByTitle('Share Recipe')).toBeInTheDocument();
      });
    });

    test('shares recipe using Web Share API when available', async () => {
      global.navigator.share.mockResolvedValue();

      renderRecipeDetailPage();

      await waitFor(() => {
        expect(screen.getByTitle('Share Recipe')).toBeInTheDocument();
      });

      const shareButton = screen.getByTitle('Share Recipe');
      fireEvent.click(shareButton);

      await waitFor(() => {
        expect(global.navigator.share).toHaveBeenCalledWith(
          expect.objectContaining({
            title: 'Test Recipe',
            text: expect.stringContaining('Test Recipe'),
            url: expect.stringContaining('/recipes/1')
          })
        );
      });
    });

    test('includes recipe ingredients in share text', async () => {
      global.navigator.share.mockResolvedValue();

      renderRecipeDetailPage();

      await waitFor(() => {
        expect(screen.getByTitle('Share Recipe')).toBeInTheDocument();
      });

      const shareButton = screen.getByTitle('Share Recipe');
      fireEvent.click(shareButton);

      await waitFor(() => {
        const shareCall = global.navigator.share.mock.calls[0][0];
        expect(shareCall.text).toContain('INGREDIENTS');
        expect(shareCall.text).toContain('Eggs');
      });
    });

    test('includes recipe steps in share text', async () => {
      global.navigator.share.mockResolvedValue();

      renderRecipeDetailPage();

      await waitFor(() => {
        expect(screen.getByTitle('Share Recipe')).toBeInTheDocument();
      });

      const shareButton = screen.getByTitle('Share Recipe');
      fireEvent.click(shareButton);

      await waitFor(() => {
        const shareCall = global.navigator.share.mock.calls[0][0];
        expect(shareCall.text).toContain('INSTRUCTIONS');
        expect(shareCall.text).toContain('Step 1');
        expect(shareCall.text).toContain('Step 2');
      });
    });

    test('falls back to clipboard when Web Share API is not available', async () => {
      delete global.navigator.share;
      const mockClipboard = {
        writeText: jest.fn(() => Promise.resolve()),
      };
      // Use Object.defineProperty with configurable: true to allow redefinition
      if (navigator.clipboard) {
        Object.defineProperty(navigator, 'clipboard', { 
          value: mockClipboard,
          writable: true,
          configurable: true
        });
      } else {
        Object.defineProperty(navigator, 'clipboard', { 
          value: mockClipboard,
          writable: true,
          configurable: true
        });
      }

      renderRecipeDetailPage();

      await waitFor(() => {
        expect(screen.getByTitle('Share Recipe')).toBeInTheDocument();
      });

      const shareButton = screen.getByTitle('Share Recipe');
      fireEvent.click(shareButton);

      await waitFor(() => {
        expect(mockClipboard.writeText).toHaveBeenCalled();
      });
    });

    test('handles share cancellation gracefully', async () => {
      const abortError = new Error('User cancelled');
      abortError.name = 'AbortError';
      global.navigator.share.mockRejectedValue(abortError);

      renderRecipeDetailPage();

      await waitFor(() => {
        expect(screen.getByTitle('Share Recipe')).toBeInTheDocument();
      });

      const shareButton = screen.getByTitle('Share Recipe');
      fireEvent.click(shareButton);

      await waitFor(() => {
        expect(global.navigator.share).toHaveBeenCalled();
      });

      // Should not show error for user cancellation
      expect(screen.queryByText('Failed to share recipe')).not.toBeInTheDocument();
    });

    test('handles share errors gracefully', async () => {
      const shareError = new Error('Share failed');
      global.navigator.share.mockRejectedValue(shareError);
      const mockClipboard = {
        writeText: jest.fn(() => Promise.resolve()),
      };
      // Use Object.defineProperty with configurable: true to allow redefinition
      if (navigator.clipboard) {
        Object.defineProperty(navigator, 'clipboard', { 
          value: mockClipboard,
          writable: true,
          configurable: true
        });
      } else {
        Object.defineProperty(navigator, 'clipboard', { 
          value: mockClipboard,
          writable: true,
          configurable: true
        });
      }

      renderRecipeDetailPage();

      await waitFor(() => {
        expect(screen.getByTitle('Share Recipe')).toBeInTheDocument();
      });

      const shareButton = screen.getByTitle('Share Recipe');
      fireEvent.click(shareButton);

      await waitFor(() => {
        // Should fallback to clipboard
        expect(mockClipboard.writeText).toHaveBeenCalled();
      });
    });
  });

  describe('Creator Profile Photo', () => {
    test('displays creator profile photo when available', async () => {
      const creatorWithPhoto = {
        id: 1,
        username: 'Test Creator',
        profilePhoto: 'data:image/png;base64,test123'
      };
      userService.getUserById.mockResolvedValue(creatorWithPhoto);

      renderRecipeDetailPage();

      await waitFor(() => {
        expect(screen.getByText('Test Recipe')).toBeInTheDocument();
      });

      await waitFor(() => {
        const creatorAvatar = document.querySelector('.creator-avatar');
        expect(creatorAvatar).toBeInTheDocument();
        expect(creatorAvatar).toHaveAttribute('src', 'data:image/png;base64,test123');
      });
    });

    test('displays placeholder when creator has no profile photo', async () => {
      const creatorWithoutPhoto = {
        id: 1,
        username: 'Test Creator',
        profilePhoto: null
      };
      userService.getUserById.mockResolvedValue(creatorWithoutPhoto);

      renderRecipeDetailPage();

      await waitFor(() => {
        expect(screen.getByText('Test Recipe')).toBeInTheDocument();
      });

      await waitFor(() => {
        const placeholder = document.querySelector('.creator-avatar-placeholder');
        expect(placeholder).toBeInTheDocument();
        expect(placeholder).toHaveTextContent('T'); // First letter of username
      });
    });

    test('navigates to creator profile when avatar is clicked', async () => {
      const creatorWithPhoto = {
        id: 1,
        username: 'Test Creator',
        profilePhoto: 'data:image/png;base64,test123'
      };
      userService.getUserById.mockResolvedValue(creatorWithPhoto);

      renderRecipeDetailPage();

      await waitFor(() => {
        expect(screen.getByText('Test Recipe')).toBeInTheDocument();
      });

      await waitFor(() => {
        const creatorAvatar = document.querySelector('.creator-avatar');
        if (creatorAvatar) {
          fireEvent.click(creatorAvatar);
          expect(mockNavigate).toHaveBeenCalledWith('/profile/1');
        }
      });
    });
  });
});

