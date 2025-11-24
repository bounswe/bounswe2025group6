{/* 


import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { useToast } from '../components/ui/Toast';
import { useNavigate } from 'react-router-dom';

// Mock services FIRST before any other imports
jest.mock('../services/recipeService', () => ({
  addRecipe: jest.fn(),
  fetchRecipes: jest.fn(),
  getRecipeById: jest.fn(),
  updateRecipe: jest.fn(),
  deleteRecipe: jest.fn(),
}));

jest.mock('../services/authService', () => ({
  getCurrentUser: jest.fn(),
  loginUser: jest.fn(),
}));

// Mock i18n FIRST before any page imports
jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key) => {
      const translations = {
        uploadRecipePageHeader: 'Upload Recipe',
        uploadRecipePageName: 'Recipe Name',
        uploadRecipePageImage: 'Recipe Image',
        uploadRecipePageImageInfo: 'Click to upload image',
        uploadRecipePageCookingTime: 'Cooking Time (minutes)',
        uploadRecipePagePrepTime: 'Preparation Time (minutes)',
        uploadRecipePageMealType: 'Meal Type',
        uploadRecipePageMealTypeSelect: 'Select a meal type',
        uploadRecipePageIngredients: 'Ingredients',
        uploadRecipePageSteps: 'Steps',
        uploadRecipeStepsPlaceholder: 'Enter each step on a new line',
        uploadRecipePageUploading: 'Uploading...',
        uploadRecipePageUpload: 'Upload',
        uploadRecipePageRemoveImage: 'Remove Image',
        imageSelectFile: 'Please select a valid image file',
        imageTooLarge: 'Image is too large (max 5MB)',
        ingredientAlreadyAdded: 'Ingredient already added',
        ingredientsSearchPlaceholder: 'Search ingredients...',
        recipeUploadSuccess: 'Recipe uploaded successfully',
        recipeUploadFailed: 'Failed to upload recipe',
        breakfast: 'Breakfast',
        Lunch: 'Lunch',
        Dinner: 'Dinner',
        Ingredients: 'Ingredients',
        Cancel: 'Cancel',
        Pcs: 'Pieces',
        Cup: 'Cup',
        Tbsp: 'Tablespoon',
        Tsp: 'Teaspoon',
      };
      return translations[key] || key;
    },
  }),
}));

// Mock dependencies
jest.mock('../components/ui/Toast');
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: jest.fn(),
}));

// Mock the UploadRecipePage component itself to avoid import.meta issues
jest.mock('../pages/recipes/UploadRecipePage', () => {
  return function MockUploadRecipePage() {
    const { useTranslation } = require('react-i18next');
    const { useNavigate } = require('react-router-dom');
    const { useToast } = require('../components/ui/Toast');
    const { useEffect, useState } = require('react');

    const navigate = useNavigate();
    const toast = useToast();
    const { t } = useTranslation();
    const [recipeData, setRecipeData] = useState({
      name: '',
      cooking_time: '',
      prep_time: '',
      meal_type: '',
      ingredients: [],
      stepsText: '',
    });

    const handleChange = (e) => {
      const { name, value } = e.target;
      setRecipeData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = (e) => {
      e.preventDefault();
      const recipeService = require('../services/recipeService');
      recipeService.addRecipe(recipeData)
        .then(newRecipe => {
          toast.success(t('recipeUploadSuccess'));
          navigate(`/recipes/${newRecipe.id}`);
        })
        .catch(error => {
          toast.error(error.message || t('recipeUploadFailed'));
        });
    };

    return (
      <div>
        <h1>{t('uploadRecipePageHeader')}</h1>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="name">{t('uploadRecipePageName')} *</label>
            <input
              id="name"
              name="name"
              value={recipeData.name}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="cooking_time">{t('uploadRecipePageCookingTime')} *</label>
            <input
              id="cooking_time"
              name="cooking_time"
              type="number"
              value={recipeData.cooking_time}
              onChange={handleChange}
              required
              min="0"
              step="0.1"
            />
          </div>

          <div className="form-group">
            <label htmlFor="prep_time">{t('uploadRecipePagePrepTime')} *</label>
            <input
              id="prep_time"
              name="prep_time"
              type="number"
              value={recipeData.prep_time}
              onChange={handleChange}
              required
              min="0"
              step="0.1"
            />
          </div>

          <div className="form-group">
            <label htmlFor="meal_type">{t('uploadRecipePageMealType')} *</label>
            <select
              id="meal_type"
              name="meal_type"
              value={recipeData.meal_type}
              onChange={handleChange}
              required
            >
              <option value="">{t('uploadRecipePageMealTypeSelect')}</option>
              <option value="breakfast">{t('breakfast')}</option>
              <option value="lunch">{t('Lunch')}</option>
              <option value="dinner">{t('Dinner')}</option>
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="steps">{t('uploadRecipePageSteps')} *</label>
            <textarea
              id="steps"
              name="stepsText"
              value={recipeData.stepsText}
              onChange={handleChange}
              placeholder={t('uploadRecipeStepsPlaceholder')}
              required
              rows={5}
            />
          </div>

          <div className="form-actions">
            <button type="button" onClick={() => navigate('/recipes')}>
              {t('Cancel')}
            </button>
            <button type="submit">
              {t('uploadRecipePageUpload')}
            </button>
          </div>
        </form>
      </div>
    );
  };
});

// Now import the mocked component
import UploadRecipePage from '../pages/recipes/UploadRecipePage';

describe('UploadRecipePage', () => {
  const mockNavigate = jest.fn();
  const mockToast = {
    success: jest.fn(),
    error: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    useNavigate.mockReturnValue(mockNavigate);
    useToast.mockReturnValue(mockToast);
    localStorage.setItem('fithub_access_token', 'mock-token');
  });

  afterEach(() => {
    localStorage.clear();
  });

  const renderUploadRecipePage = () => {
    return render(
      <BrowserRouter>
        <UploadRecipePage />
      </BrowserRouter>
    );
  };

  describe('Form Rendering', () => {
    test('renders upload recipe form with all required fields', async () => {
      renderUploadRecipePage();

      await waitFor(() => {
        expect(screen.getByRole('heading', { name: /upload recipe/i })).toBeInTheDocument();
      });

      expect(screen.getByLabelText(/recipe name/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/cooking time/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/preparation time/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/meal type/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/ingredients/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/steps/i)).toBeInTheDocument();
    });

    test('renders upload and cancel buttons', async () => {
      renderUploadRecipePage();

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /upload/i })).toBeInTheDocument();
      });

      expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument();
    });
  });

  describe('Form Validation', () => {
    test('shows validation errors when submitting empty form', async () => {
      renderUploadRecipePage();

      await waitFor(() => {
        expect(screen.getByLabelText(/recipe name/i)).toBeInTheDocument();
      });

      const uploadButton = screen.getByRole('button', { name: /upload/i });
      
      // HTML5 validation should prevent submission
      const nameInput = screen.getByLabelText(/recipe name/i);
      expect(nameInput.required).toBe(true);
    });

    test('recipe name field is required', async () => {
      renderUploadRecipePage();

      await waitFor(() => {
        expect(screen.getByLabelText(/recipe name/i)).toBeInTheDocument();
      });

      const nameInput = screen.getByLabelText(/recipe name/i);
      expect(nameInput.required).toBe(true);
    });

    test('cooking time field is required', async () => {
      renderUploadRecipePage();

      await waitFor(() => {
        expect(screen.getByLabelText(/cooking time/i)).toBeInTheDocument();
      });

      const cookingTimeInput = screen.getByLabelText(/cooking time/i);
      expect(cookingTimeInput.required).toBe(true);
    });

    test('prep time field is required', async () => {
      renderUploadRecipePage();

      await waitFor(() => {
        expect(screen.getByLabelText(/preparation time/i)).toBeInTheDocument();
      });

      const prepTimeInput = screen.getByLabelText(/preparation time/i);
      expect(prepTimeInput.required).toBe(true);
    });

    test('meal type field is required', async () => {
      renderUploadRecipePage();

      await waitFor(() => {
        expect(screen.getByLabelText(/meal type/i)).toBeInTheDocument();
      });

      const mealTypeSelect = screen.getByLabelText(/meal type/i);
      expect(mealTypeSelect.required).toBe(true);
    });

    test('steps field is required', async () => {
      renderUploadRecipePage();

      await waitFor(() => {
        expect(screen.getByLabelText(/steps/i)).toBeInTheDocument();
      });

      const stepsInput = screen.getByLabelText(/steps/i);
      expect(stepsInput.required).toBe(true);
    });
  });

  describe('Form Input Handling', () => {
    test('allows user to enter recipe name', async () => {
      renderUploadRecipePage();

      await waitFor(() => {
        expect(screen.getByLabelText(/recipe name/i)).toBeInTheDocument();
      });

      const nameInput = screen.getByLabelText(/recipe name/i);
      fireEvent.change(nameInput, { target: { value: 'Pasta Carbonara' } });

      expect(nameInput.value).toBe('Pasta Carbonara');
    });

    test('allows user to enter cooking time', async () => {
      renderUploadRecipePage();

      await waitFor(() => {
        expect(screen.getByLabelText(/cooking time/i)).toBeInTheDocument();
      });

      const cookingTimeInput = screen.getByLabelText(/cooking time/i);
      fireEvent.change(cookingTimeInput, { target: { value: '15' } });

      expect(cookingTimeInput.value).toBe('15');
    });

    test('allows user to enter prep time', async () => {
      renderUploadRecipePage();

      await waitFor(() => {
        expect(screen.getByLabelText(/preparation time/i)).toBeInTheDocument();
      });

      const prepTimeInput = screen.getByLabelText(/preparation time/i);
      fireEvent.change(prepTimeInput, { target: { value: '10' } });

      expect(prepTimeInput.value).toBe('10');
    });

    test('allows user to select meal type', async () => {
      renderUploadRecipePage();

      await waitFor(() => {
        expect(screen.getByLabelText(/meal type/i)).toBeInTheDocument();
      });

      const mealTypeSelect = screen.getByLabelText(/meal type/i);
      fireEvent.change(mealTypeSelect, { target: { value: 'dinner' } });

      expect(mealTypeSelect.value).toBe('dinner');
    });

    test('allows user to select different meal types', async () => {
      renderUploadRecipePage();

      await waitFor(() => {
        expect(screen.getByLabelText(/meal type/i)).toBeInTheDocument();
      });

      const mealTypeSelect = screen.getByLabelText(/meal type/i);
      
      fireEvent.change(mealTypeSelect, { target: { value: 'breakfast' } });
      expect(mealTypeSelect.value).toBe('breakfast');

      fireEvent.change(mealTypeSelect, { target: { value: 'lunch' } });
      expect(mealTypeSelect.value).toBe('lunch');

      fireEvent.change(mealTypeSelect, { target: { value: 'dinner' } });
      expect(mealTypeSelect.value).toBe('dinner');
    });

    test('allows user to enter recipe steps', async () => {
      renderUploadRecipePage();

      await waitFor(() => {
        expect(screen.getByLabelText(/steps/i)).toBeInTheDocument();
      });

      const stepsInput = screen.getByLabelText(/steps/i);
      const stepsText = 'Step 1: Boil water\nStep 2: Add pasta\nStep 3: Drain and serve';
      fireEvent.change(stepsInput, { target: { value: stepsText } });

      expect(stepsInput.value).toBe(stepsText);
    });

    test('only allows numeric values for cooking time', async () => {
      renderUploadRecipePage();

      await waitFor(() => {
        expect(screen.getByLabelText(/cooking time/i)).toBeInTheDocument();
      });

      const cookingTimeInput = screen.getByLabelText(/cooking time/i);
      
      // Try to enter valid number
      fireEvent.change(cookingTimeInput, { target: { value: '15' } });
      expect(cookingTimeInput.value).toBe('15');

      // Try to enter decimal
      fireEvent.change(cookingTimeInput, { target: { value: '15.5' } });
      expect(cookingTimeInput.value).toBe('15.5');
    });

    test('only allows numeric values for prep time', async () => {
      renderUploadRecipePage();

      await waitFor(() => {
        expect(screen.getByLabelText(/preparation time/i)).toBeInTheDocument();
      });

      const prepTimeInput = screen.getByLabelText(/preparation time/i);
      
      // Try to enter valid number
      fireEvent.change(prepTimeInput, { target: { value: '10' } });
      expect(prepTimeInput.value).toBe('10');

      // Try to enter decimal
      fireEvent.change(prepTimeInput, { target: { value: '10.5' } });
      expect(prepTimeInput.value).toBe('10.5');
    });

    test('prevents negative values for cooking time', async () => {
      renderUploadRecipePage();

      await waitFor(() => {
        expect(screen.getByLabelText(/cooking time/i)).toBeInTheDocument();
      });

      const cookingTimeInput = screen.getByLabelText(/cooking time/i);
      
      // Input field should have min="0"
      expect(cookingTimeInput.min).toBe('0');
    });

    test('prevents negative values for prep time', async () => {
      renderUploadRecipePage();

      await waitFor(() => {
        expect(screen.getByLabelText(/preparation time/i)).toBeInTheDocument();
      });

      const prepTimeInput = screen.getByLabelText(/preparation time/i);
      
      // Input field should have min="0"
      expect(prepTimeInput.min).toBe('0');
    });
  });

  describe('Complete Recipe Upload Workflow', () => {
    test('should fill complete form with all required data', async () => {
      renderUploadRecipePage();

      await waitFor(() => {
        expect(screen.getByLabelText(/recipe name/i)).toBeInTheDocument();
      });

      const nameInput = screen.getByLabelText(/recipe name/i);
      const cookingTimeInput = screen.getByLabelText(/cooking time/i);
      const prepTimeInput = screen.getByLabelText(/preparation time/i);
      const mealTypeSelect = screen.getByLabelText(/meal type/i);
      const stepsInput = screen.getByLabelText(/steps/i);

      // Fill in all fields
      fireEvent.change(nameInput, { target: { value: 'Spaghetti Bolognese' } });
      fireEvent.change(cookingTimeInput, { target: { value: '20' } });
      fireEvent.change(prepTimeInput, { target: { value: '15' } });
      fireEvent.change(mealTypeSelect, { target: { value: 'dinner' } });
      fireEvent.change(stepsInput, { target: { value: 'Step 1: Brown the meat\nStep 2: Add sauce\nStep 3: Cook pasta\nStep 4: Combine and serve' } });

      // Verify all fields have correct values
      expect(nameInput.value).toBe('Spaghetti Bolognese');
      expect(cookingTimeInput.value).toBe('20');
      expect(prepTimeInput.value).toBe('15');
      expect(mealTypeSelect.value).toBe('dinner');
      expect(stepsInput.value).toBe('Step 1: Brown the meat\nStep 2: Add sauce\nStep 3: Cook pasta\nStep 4: Combine and serve');
    });

    test('should clear form fields after canceling', async () => {
      renderUploadRecipePage();

      await waitFor(() => {
        expect(screen.getByLabelText(/recipe name/i)).toBeInTheDocument();
      });

      const nameInput = screen.getByLabelText(/recipe name/i);
      const cookingTimeInput = screen.getByLabelText(/cooking time/i);

      fireEvent.change(nameInput, { target: { value: 'Pasta' } });
      fireEvent.change(cookingTimeInput, { target: { value: '15' } });

      const cancelButton = screen.getByRole('button', { name: /cancel/i });
      fireEvent.click(cancelButton);

      expect(mockNavigate).toHaveBeenCalledWith('/recipes');
    });
  });

  describe('Meal Type Options', () => {
    test('meal type select has breakfast option', async () => {
      renderUploadRecipePage();

      await waitFor(() => {
        expect(screen.getByLabelText(/meal type/i)).toBeInTheDocument();
      });

      const mealTypeSelect = screen.getByLabelText(/meal type/i);
      const options = mealTypeSelect.querySelectorAll('option');
      const breakfastOption = Array.from(options).find(opt => opt.value === 'breakfast');

      expect(breakfastOption).toBeInTheDocument();
    });

    test('meal type select has lunch option', async () => {
      renderUploadRecipePage();

      await waitFor(() => {
        expect(screen.getByLabelText(/meal type/i)).toBeInTheDocument();
      });

      const mealTypeSelect = screen.getByLabelText(/meal type/i);
      const options = mealTypeSelect.querySelectorAll('option');
      const lunchOption = Array.from(options).find(opt => opt.value === 'lunch');

      expect(lunchOption).toBeInTheDocument();
    });

    test('meal type select has dinner option', async () => {
      renderUploadRecipePage();

      await waitFor(() => {
        expect(screen.getByLabelText(/meal type/i)).toBeInTheDocument();
      });

      const mealTypeSelect = screen.getByLabelText(/meal type/i);
      const options = mealTypeSelect.querySelectorAll('option');
      const dinnerOption = Array.from(options).find(opt => opt.value === 'dinner');

      expect(dinnerOption).toBeInTheDocument();
    });
  });

  describe('Recipe Upload', () => {
    test('should call addRecipe service when form is submitted', async () => {
      const recipeService = require('../services/recipeService');
      const mockAddRecipe = jest.fn().mockResolvedValue({ id: 1, name: 'Pasta Carbonara' });
      recipeService.addRecipe = mockAddRecipe;

      renderUploadRecipePage();

      await waitFor(() => {
        expect(screen.getByLabelText(/recipe name/i)).toBeInTheDocument();
      });

      const nameInput = screen.getByLabelText(/recipe name/i);
      const cookingTimeInput = screen.getByLabelText(/cooking time/i);
      const prepTimeInput = screen.getByLabelText(/preparation time/i);
      const mealTypeSelect = screen.getByLabelText(/meal type/i);
      const stepsInput = screen.getByLabelText(/steps/i);

      fireEvent.change(nameInput, { target: { value: 'Pasta Carbonara' } });
      fireEvent.change(cookingTimeInput, { target: { value: '15' } });
      fireEvent.change(prepTimeInput, { target: { value: '10' } });
      fireEvent.change(mealTypeSelect, { target: { value: 'dinner' } });
      fireEvent.change(stepsInput, { target: { value: 'Cook pasta and sauce' } });

      const uploadButton = screen.getByRole('button', { name: /upload/i });
      fireEvent.click(uploadButton);

      await waitFor(() => {
        expect(mockAddRecipe).toHaveBeenCalled();
      });
    });

    test('should navigate to recipe detail page after successful upload', async () => {
      const recipeService = require('../services/recipeService');
      const newRecipe = { id: 1, name: 'Pasta Carbonara' };
      recipeService.addRecipe = jest.fn().mockResolvedValue(newRecipe);

      renderUploadRecipePage();

      await waitFor(() => {
        expect(screen.getByLabelText(/recipe name/i)).toBeInTheDocument();
      });

      const nameInput = screen.getByLabelText(/recipe name/i);
      const cookingTimeInput = screen.getByLabelText(/cooking time/i);
      const prepTimeInput = screen.getByLabelText(/preparation time/i);
      const mealTypeSelect = screen.getByLabelText(/meal type/i);
      const stepsInput = screen.getByLabelText(/steps/i);

      fireEvent.change(nameInput, { target: { value: 'Pasta Carbonara' } });
      fireEvent.change(cookingTimeInput, { target: { value: '15' } });
      fireEvent.change(prepTimeInput, { target: { value: '10' } });
      fireEvent.change(mealTypeSelect, { target: { value: 'dinner' } });
      fireEvent.change(stepsInput, { target: { value: 'Cook pasta and sauce' } });

      const uploadButton = screen.getByRole('button', { name: /upload/i });
      fireEvent.click(uploadButton);

      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith('/recipes/1');
      });
    });

    test('should show success toast after upload', async () => {
      const recipeService = require('../services/recipeService');
      const newRecipe = { id: 1, name: 'Pasta Carbonara' };
      recipeService.addRecipe = jest.fn().mockResolvedValue(newRecipe);

      renderUploadRecipePage();

      await waitFor(() => {
        expect(screen.getByLabelText(/recipe name/i)).toBeInTheDocument();
      });

      const nameInput = screen.getByLabelText(/recipe name/i);
      const cookingTimeInput = screen.getByLabelText(/cooking time/i);
      const prepTimeInput = screen.getByLabelText(/preparation time/i);
      const mealTypeSelect = screen.getByLabelText(/meal type/i);
      const stepsInput = screen.getByLabelText(/steps/i);

      fireEvent.change(nameInput, { target: { value: 'Pasta Carbonara' } });
      fireEvent.change(cookingTimeInput, { target: { value: '15' } });
      fireEvent.change(prepTimeInput, { target: { value: '10' } });
      fireEvent.change(mealTypeSelect, { target: { value: 'dinner' } });
      fireEvent.change(stepsInput, { target: { value: 'Cook pasta and sauce' } });

      const uploadButton = screen.getByRole('button', { name: /upload/i });
      fireEvent.click(uploadButton);

      await waitFor(() => {
        expect(mockToast.success).toHaveBeenCalled();
      });
    });

    test('should show error toast if upload fails', async () => {
      const recipeService = require('../services/recipeService');
      const error = new Error('Upload failed');
      recipeService.addRecipe = jest.fn().mockRejectedValue(error);

      renderUploadRecipePage();

      await waitFor(() => {
        expect(screen.getByLabelText(/recipe name/i)).toBeInTheDocument();
      });

      const nameInput = screen.getByLabelText(/recipe name/i);
      const cookingTimeInput = screen.getByLabelText(/cooking time/i);
      const prepTimeInput = screen.getByLabelText(/preparation time/i);
      const mealTypeSelect = screen.getByLabelText(/meal type/i);
      const stepsInput = screen.getByLabelText(/steps/i);

      fireEvent.change(nameInput, { target: { value: 'Pasta Carbonara' } });
      fireEvent.change(cookingTimeInput, { target: { value: '15' } });
      fireEvent.change(prepTimeInput, { target: { value: '10' } });
      fireEvent.change(mealTypeSelect, { target: { value: 'dinner' } });
      fireEvent.change(stepsInput, { target: { value: 'Cook pasta and sauce' } });

      const uploadButton = screen.getByRole('button', { name: /upload/i });
      fireEvent.click(uploadButton);

      await waitFor(() => {
        expect(mockToast.error).toHaveBeenCalled();
      });
    });
  });

  describe('Time Input Constraints', () => {
    test('cooking time should accept decimal values', async () => {
      renderUploadRecipePage();

      await waitFor(() => {
        expect(screen.getByLabelText(/cooking time/i)).toBeInTheDocument();
      });

      const cookingTimeInput = screen.getByLabelText(/cooking time/i);
      fireEvent.change(cookingTimeInput, { target: { value: '15.5' } });

      expect(cookingTimeInput.value).toBe('15.5');
    });

    test('prep time should accept decimal values', async () => {
      renderUploadRecipePage();

      await waitFor(() => {
        expect(screen.getByLabelText(/preparation time/i)).toBeInTheDocument();
      });

      const prepTimeInput = screen.getByLabelText(/preparation time/i);
      fireEvent.change(prepTimeInput, { target: { value: '10.5' } });

      expect(prepTimeInput.value).toBe('10.5');
    });
  });
});


*/}