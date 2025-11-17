// src/pages/meal-planner/MealPlannerPage.jsx

import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import RecipeCard from '../../components/recipe/RecipeCard';
import Button from '../../components/ui/Button';
import { useToast } from '../../components/ui/Toast';
import { useCurrency } from '../../contexts/CurrencyContext';
import MealPlanFilters from '../../components/meal-planner/MealPlanFilters';
import MealPlanSummary from '../../components/meal-planner/MealPlanSummary';
import {
  fetchRecipesByMealType,
  generateRandomMealPlan,
  calculateMealPlanCost,
  calculateMealPlanNutrition,
  getMealPlanAllergens,
} from '../../services/mealPlanService';
import '../../styles/MealPlannerPage.css';
import { useTranslation } from 'react-i18next';

const MealPlannerPage = () => {
  const { t } = useTranslation();
  const toast = useToast();
  const navigate = useNavigate();
  const { currency } = useCurrency();

  const [breakfastRecipes, setBreakfastRecipes] = useState([]);
  const [lunchRecipes, setLunchRecipes] = useState([]);
  const [dinnerRecipes, setDinnerRecipes] = useState([]);

  const [mealPlan, setMealPlan] = useState({
    breakfast: null,
    lunch: null,
    dinner: null,
  });

  const [filters, setFilters] = useState({
    mealTypes: ['breakfast', 'lunch', 'dinner'],
  });
  const [isLoading, setIsLoading] = useState(false);

  // Initial load - always restore state if exists
  useEffect(() => {
    document.title = 'Meal Planner';
    
    // Check if we came from recipe detail (for scroll restoration)
    const cameFromRecipeDetail = localStorage.getItem('returnToMealPlanner');
    
    // Ensure page starts at top by default (unless coming from recipe detail)
    if (!cameFromRecipeDetail) {
      window.scrollTo(0, 0);
    }
    
    // Always try to restore state from localStorage
    const savedState = localStorage.getItem('mealPlannerState');
    
    if (savedState) {
      try {
        const { filters: savedFilters, mealPlan: savedMealPlan, scrollPosition, breakfastRecipes: savedBreakfast, lunchRecipes: savedLunch, dinnerRecipes: savedDinner } = JSON.parse(savedState);
        
        // Check if we have valid saved data
        const hasValidRecipes = (savedBreakfast && savedBreakfast.length > 0) || 
                                (savedLunch && savedLunch.length > 0) || 
                                (savedDinner && savedDinner.length > 0);
        
        if (hasValidRecipes) {
          // Restore everything
          if (savedFilters) {
            setFilters(savedFilters);
          }
          if (savedMealPlan) {
            setMealPlan(savedMealPlan);
          }
          if (savedBreakfast && savedBreakfast.length > 0) {
            setBreakfastRecipes(savedBreakfast);
          }
          if (savedLunch && savedLunch.length > 0) {
            setLunchRecipes(savedLunch);
          }
          if (savedDinner && savedDinner.length > 0) {
            setDinnerRecipes(savedDinner);
          }
          
          // Restore scroll position ONLY if coming from recipe detail
          if (cameFromRecipeDetail) {
            setTimeout(() => {
              window.scrollTo(0, scrollPosition || 0);
            }, 100);
          }
          
          return; // Don't load recipes again if we restored valid state
        }
      } catch (error) {
        console.error('Error restoring meal planner state:', error);
        // If restore fails, continue to load recipes normally
      }
    }

    // Load recipes on first mount (or if restore failed)
    const baseFilters = { ...filters };
    delete baseFilters.mealTypes;

    if (filters.mealTypes.includes('breakfast')) {
      loadBreakfastRecipes(baseFilters);
    }
    if (filters.mealTypes.includes('lunch')) {
      loadLunchRecipes(baseFilters);
    }
    if (filters.mealTypes.includes('dinner')) {
      loadDinnerRecipes(baseFilters);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Reload recipes when currency changes
  useEffect(() => {
    // Skip initial mount (already loaded in first useEffect)
    // Only reload when currency changes
    const baseFilters = { ...filters };
    delete baseFilters.mealTypes;

    if (filters.mealTypes.includes('breakfast')) {
      loadBreakfastRecipes(baseFilters);
    }
    if (filters.mealTypes.includes('lunch')) {
      loadLunchRecipes(baseFilters);
    }
    if (filters.mealTypes.includes('dinner')) {
      loadDinnerRecipes(baseFilters);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currency]);

  // Save state whenever filters or mealPlan changes
  useEffect(() => {
    const state = {
      filters,
      mealPlan,
      breakfastRecipes,
      lunchRecipes,
      dinnerRecipes,
      scrollPosition: window.scrollY
    };
    localStorage.setItem('mealPlannerState', JSON.stringify(state));
  }, [filters, mealPlan, breakfastRecipes, lunchRecipes, dinnerRecipes]);

  const loadAllRecipes = async () => {
    const baseFilters = { ...filters };
    delete baseFilters.mealTypes;

    if (filters.mealTypes.includes('breakfast')) {
      loadBreakfastRecipes(baseFilters);
    }
    if (filters.mealTypes.includes('lunch')) {
      loadLunchRecipes(baseFilters);
    }
    if (filters.mealTypes.includes('dinner')) {
      loadDinnerRecipes(baseFilters);
    }
  };

  const loadBreakfastRecipes = async (additionalFilters = {}) => {
    try {
      const recipes = await fetchRecipesByMealType('breakfast', additionalFilters);
      setBreakfastRecipes(recipes);
    } catch (error) {
      console.error('Error loading breakfast recipes:', error);
      toast.error('Failed to load breakfast recipes');
    }
  };

  const loadLunchRecipes = async (additionalFilters = {}) => {
    try {
      const recipes = await fetchRecipesByMealType('lunch', additionalFilters);
      setLunchRecipes(recipes);
    } catch (error) {
      console.error('Error loading lunch recipes:', error);
      toast.error('Failed to load lunch recipes');
    }
  };

  const loadDinnerRecipes = async (additionalFilters = {}) => {
    try {
      const recipes = await fetchRecipesByMealType('dinner', additionalFilters);
      setDinnerRecipes(recipes);
    } catch (error) {
      console.error('Error loading dinner recipes:', error);
      toast.error('Failed to load dinner recipes');
    }
  };

  const handleFilterChange = (newFilters) => {
    setFilters(newFilters);
    
    const baseFilters = { ...newFilters };
    delete baseFilters.mealTypes;

    if (newFilters.mealTypes.includes('breakfast')) {
      loadBreakfastRecipes(baseFilters);
    } else {
      setBreakfastRecipes([]);
    }

    if (newFilters.mealTypes.includes('lunch')) {
      loadLunchRecipes(baseFilters);
    } else {
      setLunchRecipes([]);
    }

    if (newFilters.mealTypes.includes('dinner')) {
      loadDinnerRecipes(baseFilters);
    } else {
      setDinnerRecipes([]);
    }
  };

  const handleClearFilters = () => {
    setFilters({ mealTypes: ['breakfast', 'lunch', 'dinner'] });
    loadAllRecipes();
  };

  const handleSelectRecipe = (mealType, recipe) => {
    setMealPlan((prev) => ({
      ...prev,
      [mealType]: prev[mealType]?.id === recipe.id ? null : recipe,
    }));
  };

  const handleGenerateRandom = async () => {
    setIsLoading(true);
    try {
      const baseFilters = { ...filters };
      delete baseFilters.mealTypes;

      const randomPlan = await generateRandomMealPlan(baseFilters);
      setMealPlan(randomPlan);
      toast.success('Random meal plan generated!');
      
      // Scroll to bottom to show meal plan summary
      setTimeout(() => {
        window.scrollTo({
          top: document.documentElement.scrollHeight,
          behavior: 'smooth'
        });
      }, 500);
    } catch (error) {
      console.error('Error generating random meal plan:', error);
      toast.error('Failed to generate random meal plan');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearMealPlan = () => {
    setMealPlan({
      breakfast: null,
      lunch: null,
      dinner: null,
    });
    toast.info('Meal plan cleared');
    // Scroll to top of page
    setTimeout(() => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }, 100);
  };

  const handleGenerateShopping = () => {
    localStorage.setItem('currentMealPlan', JSON.stringify({ activePlan: mealPlan }));
  };

  const totalCost = calculateMealPlanCost(mealPlan);
  const totalNutrition = calculateMealPlanNutrition(mealPlan);
  const allergens = getMealPlanAllergens(mealPlan);

  return (
    <div className="meal-planner-page">
      <div className="meal-planner-header">
        <h1 className="meal-planner-title">Meal Planner</h1>
        <div className="header-actions">
          <button 
            onClick={handleGenerateRandom} 
            disabled={isLoading}
            className="modern-green-button"
          >
            🎲 Generate Random Plan
          </button>
        </div>
      </div>

      {/* Main Layout: Sidebar + Content */}
      <div className="meal-planner-layout">
        {/* Left Sidebar - Filters (1/4) */}
        <aside className="meal-planner-sidebar">
          <MealPlanFilters 
            onFilterChange={handleFilterChange} 
            onClearFilters={handleClearFilters}
            initialFilters={filters}
          />
        </aside>

        {/* Right Content - Recipes (3/4) */}
        <main className="meal-planner-content">
          {/* Breakfast Section */}
          {filters.mealTypes.includes('breakfast') && (
            <section className="meal-section">
              <h2 className="meal-section-title">
                <span className="meal-icon">🍳</span>
                Breakfast Recipes
              </h2>
              {breakfastRecipes.length > 0 ? (
                <div className="recipe-grid">
                  {breakfastRecipes.map((recipe) => (
                    <div
                      key={recipe.id}
                      className={`recipe-card-wrapper ${
                        mealPlan.breakfast?.id === recipe.id ? 'selected' : ''
                      }`}
                    >
                      <RecipeCard recipe={recipe} />
                      <button
                        className={`select-recipe-btn ${
                          mealPlan.breakfast?.id === recipe.id ? 'selected' : ''
                        }`}
                        onClick={() => handleSelectRecipe('breakfast', recipe)}
                      >
                        {mealPlan.breakfast?.id === recipe.id ? '✓ Selected' : 'Select for Breakfast'}
                      </button>
                        </div>
                  ))}
                </div>
              ) : (
                <p className="no-recipes">No breakfast recipes found. Try adjusting your filters.</p>
              )}
            </section>
          )}

          {/* Lunch Section */}
          {filters.mealTypes.includes('lunch') && (
            <section className="meal-section">
              <h2 className="meal-section-title">
                <span className="meal-icon">🥗</span>
                Lunch Recipes
              </h2>
              {lunchRecipes.length > 0 ? (
                <div className="recipe-grid">
                  {lunchRecipes.map((recipe) => (
                    <div
                      key={recipe.id}
                      className={`recipe-card-wrapper ${
                        mealPlan.lunch?.id === recipe.id ? 'selected' : ''
                      }`}
                    >
                      <RecipeCard recipe={recipe} />
                      <button
                        className={`select-recipe-btn ${
                          mealPlan.lunch?.id === recipe.id ? 'selected' : ''
                        }`}
                        onClick={() => handleSelectRecipe('lunch', recipe)}
                      >
                        {mealPlan.lunch?.id === recipe.id ? '✓ Selected' : 'Select for Lunch'}
                      </button>
                      </div>
                  ))}
                </div>
              ) : (
                <p className="no-recipes">No lunch recipes found. Try adjusting your filters.</p>
              )}
            </section>
          )}

          {/* Dinner Section */}
          {filters.mealTypes.includes('dinner') && (
            <section className="meal-section">
              <h2 className="meal-section-title">
                <span className="meal-icon">🍽️</span>
                Dinner Recipes
              </h2>
              {dinnerRecipes.length > 0 ? (
                <div className="recipe-grid">
                  {dinnerRecipes.map((recipe) => (
                    <div
                      key={recipe.id}
                      className={`recipe-card-wrapper ${
                        mealPlan.dinner?.id === recipe.id ? 'selected' : ''
                      }`}
                    >
                      <RecipeCard recipe={recipe} />
                      <button
                        className={`select-recipe-btn ${
                          mealPlan.dinner?.id === recipe.id ? 'selected' : ''
                        }`}
                        onClick={() => handleSelectRecipe('dinner', recipe)}
                      >
                        {mealPlan.dinner?.id === recipe.id ? '✓ Selected' : 'Select for Dinner'}
                      </button>
              </div>
                  ))}
            </div>
          ) : (
                <p className="no-recipes">No dinner recipes found. Try adjusting your filters.</p>
              )}
            </section>
          )}
        </main>
      </div>

      {/* Meal Plan Summary */}
      <MealPlanSummary
        mealPlan={mealPlan}
        totalCost={totalCost}
        totalNutrition={totalNutrition}
        allergens={allergens}
        onClear={handleClearMealPlan}
        onGenerateShopping={handleGenerateShopping}
      />
    </div>
  );
};

export default MealPlannerPage;
