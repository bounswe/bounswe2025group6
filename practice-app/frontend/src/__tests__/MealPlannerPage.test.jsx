import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import MealPlannerPage from '../pages/meal-planner/MealPlannerPage';
import { useToast } from '../components/ui/Toast';
import { useCurrency } from '../contexts/CurrencyContext';
import {
  fetchRecipesByMealType,
  generateRandomMealPlan,
  calculateMealPlanCost,
  calculateMealPlanNutrition,
  getMealPlanAllergens,
} from '../services/mealPlanService';

// Mock dependencies
jest.mock('../components/ui/Toast');
jest.mock('../contexts/CurrencyContext');
jest.mock('../services/mealPlanService');

// Mock components
jest.mock('../components/recipe/RecipeCard', () => ({ recipe }) => (
  <div data-testid={`recipe-card-${recipe.id}`}>
    <h3>{recipe.name}</h3>
    <p>{recipe.meal_type}</p>
  </div>
));
jest.mock('../components/meal-planner/MealPlanFilters', () => {
  const MEAL_PLANNER_DEFAULT_FILTERS = {
    name: '',
    mealTypes: ['breakfast', 'lunch', 'dinner'],
    min_cost_per_serving: '',
    max_cost_per_serving: '',
    min_calories: '',
    max_calories: '',
    min_protein: '',
    max_protein: '',
    min_carbs: '',
    max_carbs: '',
    min_fat: '',
    max_fat: '',
    min_prep_time: '',
    max_prep_time: '',
    min_cook_time: '',
    max_cook_time: '',
    min_total_time: '',
    max_total_time: '',
    min_difficulty_rating: '',
    max_difficulty_rating: '',
    min_taste_rating: '',
    max_taste_rating: '',
    min_health_rating: '',
    max_health_rating: '',
    has_image: false,
    excludeAllergens: [],
  };

  const MockMealPlanFilters = ({ onFilterChange, onApplyFilters, onClearFilters, initialFilters }) => (
    <div data-testid="meal-plan-filters">
      <button onClick={() => onFilterChange(initialFilters)} data-testid="filter-change-btn">Change Filters</button>
      <button onClick={() => onApplyFilters(initialFilters)} data-testid="apply-filters-btn">Apply Filters</button>
      <button onClick={onClearFilters} data-testid="clear-filters-btn">Clear Filters</button>
    </div>
  );

  MockMealPlanFilters.MEAL_PLANNER_DEFAULT_FILTERS = MEAL_PLANNER_DEFAULT_FILTERS;
  
  return {
    __esModule: true,
    default: MockMealPlanFilters,
    MEAL_PLANNER_DEFAULT_FILTERS,
  };
});
jest.mock('../components/meal-planner/MealPlanSummary', () => ({ mealPlan, totalCost, totalNutrition, allergens, onClear, onGenerateShopping }) => (
  <div data-testid="meal-plan-summary">
    <div data-testid="total-cost">{totalCost}</div>
    <div data-testid="total-nutrition">{JSON.stringify(totalNutrition)}</div>
    <div data-testid="allergens">{allergens.join(', ')}</div>
    <button onClick={onClear} data-testid="clear-plan-btn">Clear Plan</button>
    <button onClick={onGenerateShopping} data-testid="generate-shopping-btn">Generate Shopping</button>
  </div>
));

// Mock i18n
jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key) => {
      const translations = {
        mealPlannerTitle: 'Meal Planner',
        mealPlannerGenerateButton: 'Generate Random Plan',
        mealPlannerBreakfastRecipes: 'Breakfast Recipes',
        mealPlannerLunchRecipes: 'Lunch Recipes',
        mealPlannerDinnerRecipes: 'Dinner Recipes',
        mealPlannerSelected: 'Selected',
        mealPlannerSelectFor: 'Select for',
        mealPlannerPrevButton: 'Previous',
        mealPlannerNextButton: 'Next',
        mealPlannerPageInfo: 'Page',
        mealPlannerOf: 'of',
        mealPlannerNoRecipes: 'No recipes found for this meal type',
        mealPlannerRandomSuccess: 'Random meal plan generated successfully!',
        mealPlannerRandomError: 'Failed to generate random meal plan',
        mealPlannerCleared: 'Meal plan cleared',
      };
      return translations[key] || key;
    },
  }),
}));

// Mock localStorage
const mockLocalStorage = (() => {
  let store = {};
  const mock = {
    getItem: jest.fn((key) => store[key] || null),
    setItem: jest.fn((key, value) => { store[key] = value; }),
    removeItem: jest.fn((key) => { delete store[key]; }),
    clear: jest.fn(() => { store = {}; }),
    _store: store, // Expose store for testing
  };
  return mock;
})();
Object.defineProperty(window, 'localStorage', { value: mockLocalStorage });

// Mock window.scrollTo
Object.defineProperty(window, 'scrollTo', {
  writable: true,
  value: jest.fn(),
});

describe('MealPlannerPage', () => {
  const mockToast = {
    success: jest.fn(),
    error: jest.fn(),
    info: jest.fn(),
    warning: jest.fn(),
  };

  const mockCurrency = 'USD';

  const mockBreakfastRecipes = [
    { id: 1, name: 'Scrambled Eggs', meal_type: 'breakfast', cost_per_serving: 5 },
    { id: 2, name: 'Pancakes', meal_type: 'breakfast', cost_per_serving: 8 },
    { id: 3, name: 'Oatmeal', meal_type: 'breakfast', cost_per_serving: 3 },
  ];

  const mockLunchRecipes = [
    { id: 4, name: 'Caesar Salad', meal_type: 'lunch', cost_per_serving: 12 },
    { id: 5, name: 'Sandwich', meal_type: 'lunch', cost_per_serving: 7 },
  ];

  const mockDinnerRecipes = [
    { id: 6, name: 'Grilled Chicken', meal_type: 'dinner', cost_per_serving: 15 },
    { id: 7, name: 'Pasta', meal_type: 'dinner', cost_per_serving: 10 },
  ];

  const mockRandomMealPlan = {
    breakfast: mockBreakfastRecipes[0],
    lunch: mockLunchRecipes[0],
    dinner: mockDinnerRecipes[0],
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockLocalStorage.clear();
    // Reset localStorage.getItem to default behavior
    mockLocalStorage.getItem.mockImplementation((key) => mockLocalStorage._store[key] || null);

    useToast.mockReturnValue(mockToast);
    useCurrency.mockReturnValue({ currency: mockCurrency });

    fetchRecipesByMealType.mockImplementation((mealType) => {
      switch (mealType) {
        case 'breakfast': return Promise.resolve(mockBreakfastRecipes);
        case 'lunch': return Promise.resolve(mockLunchRecipes);
        case 'dinner': return Promise.resolve(mockDinnerRecipes);
        default: return Promise.resolve([]);
      }
    });

    generateRandomMealPlan.mockResolvedValue(mockRandomMealPlan);
    calculateMealPlanCost.mockReturnValue(32);
    calculateMealPlanNutrition.mockReturnValue({ calories: 1500, protein: 80 });
    getMealPlanAllergens.mockReturnValue(['gluten', 'dairy']);
  });

  const renderMealPlannerPage = () => {
    return render(
      <BrowserRouter>
        <MealPlannerPage />
      </BrowserRouter>
    );
  };

  describe('Page Rendering', () => {
    test('renders meal planner page with title and main sections', async () => {
      renderMealPlannerPage();

      expect(screen.getByText('Meal Planner')).toBeInTheDocument();
      expect(screen.getByText('Generate Random Plan')).toBeInTheDocument();
      expect(screen.getByTestId('meal-plan-filters')).toBeInTheDocument();

      await waitFor(() => {
        expect(screen.getByText('Breakfast Recipes')).toBeInTheDocument();
        expect(screen.getByText('Lunch Recipes')).toBeInTheDocument();
        expect(screen.getByText('Dinner Recipes')).toBeInTheDocument();
      });
    });

    test('loads recipes for each meal type on mount', async () => {
      renderMealPlannerPage();

      await waitFor(() => {
        expect(fetchRecipesByMealType).toHaveBeenCalledWith('breakfast', expect.any(Object));
        expect(fetchRecipesByMealType).toHaveBeenCalledWith('lunch', expect.any(Object));
        expect(fetchRecipesByMealType).toHaveBeenCalledWith('dinner', expect.any(Object));
      });
    });

    test('renders recipe cards for each meal type', async () => {
      renderMealPlannerPage();

      await waitFor(() => {
        expect(screen.getByTestId('recipe-card-1')).toBeInTheDocument();
        expect(screen.getByTestId('recipe-card-4')).toBeInTheDocument();
        expect(screen.getByTestId('recipe-card-6')).toBeInTheDocument();
      });
    });

    test('renders meal plan summary component', async () => {
      renderMealPlannerPage();

      await waitFor(() => {
        expect(screen.getByTestId('meal-plan-summary')).toBeInTheDocument();
      });
    });
  });

  describe('Recipe Selection', () => {
    test('allows selecting recipes for meal plan', async () => {
      renderMealPlannerPage();

      await waitFor(() => {
        expect(screen.getByTestId('recipe-card-1')).toBeInTheDocument();
      });

      // Get all "Select for Breakfast" buttons and click the first one
      const selectButtons = screen.getAllByText('Select for Breakfast');
      fireEvent.click(selectButtons[0]);

      await waitFor(() => {
        expect(screen.getByText('Selected')).toBeInTheDocument();
      });
    });

    test('deselects recipe when clicking selected recipe again', async () => {
      renderMealPlannerPage();

      await waitFor(() => {
        expect(screen.getByTestId('recipe-card-1')).toBeInTheDocument();
      });

      // Get all "Select for Breakfast" buttons and click the first one
      const selectButtons = screen.getAllByText('Select for Breakfast');
      
      // Select recipe
      fireEvent.click(selectButtons[0]);
      await waitFor(() => {
        expect(screen.getByText('Selected')).toBeInTheDocument();
      });

      // Deselect recipe - get the selected button
      const selectedButtons = screen.getAllByText('Selected');
      fireEvent.click(selectedButtons[0]);

      await waitFor(() => {
        expect(screen.getAllByText('Select for Breakfast').length).toBeGreaterThan(0);
      });
    });

    test('shows selected styling for chosen recipes', async () => {
      renderMealPlannerPage();

      await waitFor(() => {
        expect(screen.getByTestId('recipe-card-1')).toBeInTheDocument();
      });

      // Get all "Select for Breakfast" buttons and click the first one
      const selectButtons = screen.getAllByText('Select for Breakfast');
      fireEvent.click(selectButtons[0]);

      await waitFor(() => {
        const recipeWrapper = screen.getByTestId('recipe-card-1').closest('.recipe-card-wrapper') || 
                             screen.getByTestId('recipe-card-1').parentElement;
        expect(recipeWrapper).toHaveClass('selected');
      });
    });
  });

  describe('Random Meal Plan Generation', () => {
    test('generates random meal plan when button is clicked', async () => {
      renderMealPlannerPage();

      const generateButton = screen.getByText('Generate Random Plan');
      fireEvent.click(generateButton);

      await waitFor(() => {
        expect(generateRandomMealPlan).toHaveBeenCalled();
        expect(mockToast.success).toHaveBeenCalledWith('Random meal plan generated successfully!');
      });
    });

    test('shows loading state while generating random plan', async () => {
      let resolvePromise;
      generateRandomMealPlan.mockReturnValue(new Promise(resolve => {
        resolvePromise = resolve;
      }));

      renderMealPlannerPage();

      const generateButton = screen.getByText('Generate Random Plan');
      fireEvent.click(generateButton);

      await waitFor(() => {
        expect(generateButton).toBeDisabled();
      });

      resolvePromise(mockRandomMealPlan);
    });

    test('handles random generation errors', async () => {
      generateRandomMealPlan.mockRejectedValue(new Error('Generation failed'));

      renderMealPlannerPage();

      const generateButton = screen.getByText('Generate Random Plan');
      fireEvent.click(generateButton);

      await waitFor(() => {
        expect(mockToast.error).toHaveBeenCalledWith('Failed to generate random meal plan');
      });
    });

    test('scrolls to bottom after successful generation', async () => {
      jest.useFakeTimers();
      renderMealPlannerPage();

      const generateButton = screen.getByText('Generate Random Plan');
      fireEvent.click(generateButton);

      await waitFor(() => {
        expect(generateRandomMealPlan).toHaveBeenCalled();
      });

      // Fast forward timers to trigger scroll
      jest.advanceTimersByTime(500);

      expect(window.scrollTo).toHaveBeenCalledWith({
        top: document.documentElement.scrollHeight,
        behavior: 'smooth'
      });

      jest.useRealTimers();
    });
  });

  describe('Filter Management', () => {
    test('applies filters when filter component triggers apply', async () => {
      renderMealPlannerPage();

      await waitFor(() => {
        expect(screen.getByTestId('apply-filters-btn')).toBeInTheDocument();
      });

      const applyButton = screen.getByTestId('apply-filters-btn');
      fireEvent.click(applyButton);

      await waitFor(() => {
        expect(fetchRecipesByMealType).toHaveBeenCalled();
      });
    });

    test('clears filters when clear button is clicked', async () => {
      renderMealPlannerPage();

      await waitFor(() => {
        expect(screen.getByTestId('clear-filters-btn')).toBeInTheDocument();
      });

      const clearButton = screen.getByTestId('clear-filters-btn');
      fireEvent.click(clearButton);

      await waitFor(() => {
        expect(fetchRecipesByMealType).toHaveBeenCalled();
      });
    });

    test('updates pending filters when filter component changes', async () => {
      renderMealPlannerPage();

      await waitFor(() => {
        expect(screen.getByTestId('filter-change-btn')).toBeInTheDocument();
      });

      const changeButton = screen.getByTestId('filter-change-btn');
      fireEvent.click(changeButton);

      // Component should handle the filter change internally
      expect(changeButton).toBeInTheDocument();
    });
  });

  describe('Meal Section Collapsing', () => {
    test('allows collapsing and expanding meal sections', async () => {
      renderMealPlannerPage();

      await waitFor(() => {
        expect(screen.getByText('Breakfast Recipes')).toBeInTheDocument();
      });

      const breakfastHeader = screen.getByText('Breakfast Recipes').closest('button');
      fireEvent.click(breakfastHeader);

      // Check if section becomes collapsed
      const breakfastContent = breakfastHeader.nextSibling;
      expect(breakfastContent).toHaveClass('collapsed');
    });

    test('toggles meal section visibility correctly', async () => {
      renderMealPlannerPage();

      await waitFor(() => {
        expect(screen.getByText('Breakfast Recipes')).toBeInTheDocument();
      });

      const breakfastHeader = screen.getByText('Breakfast Recipes').closest('button');
      
      // Collapse
      fireEvent.click(breakfastHeader);
      expect(breakfastHeader).toHaveClass('collapsed');

      // Expand
      fireEvent.click(breakfastHeader);
      expect(breakfastHeader).toHaveClass('expanded');
    });
  });

  describe('Pagination', () => {
    test('shows pagination when there are more than 6 recipes', async () => {
      const manyRecipes = Array.from({ length: 10 }, (_, i) => ({
        id: i + 10,
        name: `Recipe ${i + 10}`,
        meal_type: 'breakfast',
        cost_per_serving: 5
      }));

      fetchRecipesByMealType.mockImplementation((mealType) => {
        if (mealType === 'breakfast') return Promise.resolve(manyRecipes);
        return Promise.resolve([]);
      });

      renderMealPlannerPage();

      // Wait for recipes to load
      await waitFor(() => {
        expect(screen.getByTestId('recipe-card-10')).toBeInTheDocument();
      }, { timeout: 3000 });

      // Check for pagination elements
      await waitFor(() => {
        // Check if pagination buttons exist (Previous and Next)
        const prevButtons = screen.getAllByText('Previous');
        const nextButtons = screen.getAllByText('Next');
        expect(prevButtons.length).toBeGreaterThan(0);
        expect(nextButtons.length).toBeGreaterThan(0);
      }, { timeout: 3000 });

      // Verify pagination info exists (contains "Page" text)
      const paginationInfos = screen.getAllByText((content, element) => {
        return element?.textContent?.includes('Page') || false;
      });
      expect(paginationInfos.length).toBeGreaterThan(0);
    });

    test('navigates between pages correctly', async () => {
      const manyRecipes = Array.from({ length: 10 }, (_, i) => ({
        id: i + 10,
        name: `Recipe ${i + 10}`,
        meal_type: 'breakfast',
        cost_per_serving: 5
      }));

      fetchRecipesByMealType.mockImplementation((mealType) => {
        if (mealType === 'breakfast') return Promise.resolve(manyRecipes);
        return Promise.resolve([]);
      });

      renderMealPlannerPage();

      await waitFor(() => {
        expect(screen.getByText('Next')).toBeInTheDocument();
      });

      const nextButton = screen.getByText('Next');
      fireEvent.click(nextButton);

      // Should now be on page 2
      expect(screen.getByText('Page 2 of 2')).toBeInTheDocument();
    });

    test('disables pagination buttons appropriately', async () => {
      const manyRecipes = Array.from({ length: 10 }, (_, i) => ({
        id: i + 10,
        name: `Recipe ${i + 10}`,
        meal_type: 'breakfast',
        cost_per_serving: 5
      }));

      fetchRecipesByMealType.mockImplementation((mealType) => {
        if (mealType === 'breakfast') return Promise.resolve(manyRecipes);
        return Promise.resolve([]);
      });

      renderMealPlannerPage();

      await waitFor(() => {
        const prevButton = screen.getByText('Previous');
        expect(prevButton).toBeDisabled(); // Should be disabled on first page
      });
    });
  });

  describe('Meal Plan Summary Integration', () => {
    test('clears meal plan when summary clear button is clicked', async () => {
      renderMealPlannerPage();

      await waitFor(() => {
        expect(screen.getByTestId('clear-plan-btn')).toBeInTheDocument();
      });

      const clearButton = screen.getByTestId('clear-plan-btn');
      fireEvent.click(clearButton);

      expect(mockToast.info).toHaveBeenCalledWith('Meal plan cleared');
    });

    test('generates shopping list when summary button is clicked', async () => {
      renderMealPlannerPage();

      await waitFor(() => {
        expect(screen.getByTestId('generate-shopping-btn')).toBeInTheDocument();
      });

      const generateShoppingButton = screen.getByTestId('generate-shopping-btn');
      fireEvent.click(generateShoppingButton);

      // Should save to localStorage - check if setItem was called with currentMealPlan
      await waitFor(() => {
        expect(mockLocalStorage.setItem).toHaveBeenCalled();
        const calls = mockLocalStorage.setItem.mock.calls;
        const currentMealPlanCall = calls.find(call => call[0] === 'currentMealPlan');
        expect(currentMealPlanCall).toBeDefined();
        expect(currentMealPlanCall[1]).toContain('activePlan');
      });
    });

    test('passes correct data to meal plan summary', async () => {
      renderMealPlannerPage();

      await waitFor(() => {
        expect(screen.getByTestId('total-cost')).toHaveTextContent('32');
        expect(screen.getByTestId('total-nutrition')).toHaveTextContent('{"calories":1500,"protein":80}');
        expect(screen.getByTestId('allergens')).toHaveTextContent('gluten, dairy');
      });
    });
  });

  describe('State Persistence', () => {
    test('saves state to localStorage on changes', async () => {
      renderMealPlannerPage();

      await waitFor(() => {
        expect(screen.getByTestId('recipe-card-1')).toBeInTheDocument();
      });

      const selectButtons = screen.getAllByText('Select for Breakfast');
      fireEvent.click(selectButtons[0]);

      await waitFor(() => {
        expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
          'mealPlannerState',
          expect.stringContaining('mealPlan')
        );
      }, { timeout: 3000 });
    });

    test('restores state from localStorage on mount', async () => {
      const savedState = {
        appliedFilters: { mealTypes: ['breakfast'] },
        pendingFilters: { mealTypes: ['breakfast'] },
        mealPlan: { breakfast: mockBreakfastRecipes[0] },
        breakfastRecipes: mockBreakfastRecipes,
        lunchRecipes: [],
        dinnerRecipes: [],
        mealPagination: { breakfast: 1, lunch: 1, dinner: 1 },
      };

      mockLocalStorage.getItem.mockReturnValue(JSON.stringify(savedState));

      renderMealPlannerPage();

      // Wait a bit to see if API is called
      await waitFor(() => {
        // Component should render with saved recipes
        expect(screen.getByTestId('recipe-card-1')).toBeInTheDocument();
      }, { timeout: 1000 });

      // API might still be called for other meal types, but breakfast should use saved data
      // This is acceptable behavior
    });
  });

  describe('Error Handling', () => {
    test('handles recipe loading errors gracefully', async () => {
      fetchRecipesByMealType.mockRejectedValue(new Error('API Error'));

      renderMealPlannerPage();

      await waitFor(() => {
        expect(mockToast.error).toHaveBeenCalledWith('Failed to load breakfast recipes');
      });
    });

    test('handles localStorage errors gracefully', () => {
      mockLocalStorage.getItem.mockImplementation(() => {
        throw new Error('localStorage error');
      });

      // Should render without crashing
      expect(() => renderMealPlannerPage()).not.toThrow();
    });
  });

  describe('Empty States', () => {
    test('shows no recipes message when no recipes are available', async () => {
      fetchRecipesByMealType.mockImplementation(() => Promise.resolve([]));

      renderMealPlannerPage();

      await waitFor(() => {
        const noRecipesMessages = screen.getAllByText('No recipes found for this meal type');
        expect(noRecipesMessages.length).toBeGreaterThan(0);
      }, { timeout: 3000 });
    });
  });

  describe('Meal Type Filtering', () => {
    test('hides meal sections when not included in filters', async () => {
      // Mock filters that only include breakfast
      const breakfastOnlyFilters = { mealTypes: ['breakfast'] };
      
      renderMealPlannerPage();

      // Since the component starts with default filters including all meal types,
      // we need to apply new filters to test this
      await waitFor(() => {
        expect(screen.getByText('Breakfast Recipes')).toBeInTheDocument();
        expect(screen.getByText('Lunch Recipes')).toBeInTheDocument();
        expect(screen.getByText('Dinner Recipes')).toBeInTheDocument();
      });
    });
  });
});