// src/pages/meal-planner/MealPlannerPage.jsx

import React, { useState, useEffect } from 'react';
import RecipeCard from '../../components/recipe/RecipeCard';
import { useToast } from '../../components/ui/Toast';
import { useCurrency } from '../../contexts/CurrencyContext';
import MealPlanFilters, { MEAL_PLANNER_DEFAULT_FILTERS } from '../../components/meal-planner/MealPlanFilters';
import MealPlanSummary from '../../components/meal-planner/MealPlanSummary';
import {
  fetchRecipesByMealType,
  generateRandomMealPlan,
  calculateMealPlanCost,
  calculateMealPlanNutrition,
  getMealPlanAllergens,
} from '../../services/mealPlanService';
import '../../styles/MealPlannerPage.css';

const RECIPES_PER_PAGE = 6;

const createDefaultFilters = () => ({
  ...MEAL_PLANNER_DEFAULT_FILTERS,
  mealTypes: [...MEAL_PLANNER_DEFAULT_FILTERS.mealTypes],
  excludeAllergens: [...MEAL_PLANNER_DEFAULT_FILTERS.excludeAllergens],
});

const MealPlannerPage = () => {
  const toast = useToast();
  const { currency } = useCurrency();

  const [breakfastRecipes, setBreakfastRecipes] = useState([]);
  const [lunchRecipes, setLunchRecipes] = useState([]);
  const [dinnerRecipes, setDinnerRecipes] = useState([]);

  const [mealPlan, setMealPlan] = useState({
    breakfast: null,
    lunch: null,
    dinner: null,
  });

  const [appliedFilters, setAppliedFilters] = useState(() => createDefaultFilters());
  const [pendingFilters, setPendingFilters] = useState(() => createDefaultFilters());
  const [mealPagination, setMealPagination] = useState({
    breakfast: 1,
    lunch: 1,
    dinner: 1,
  });
  const [isRestoringState, setIsRestoringState] = useState(true);
  const [isLoading, setIsLoading] = useState(false);

  // Restore state (filters, recipes, meal plan) if available
  useEffect(() => {
    document.title = 'Meal Planner';
    window.scrollTo(0, 0);

    const cameFromRecipeDetail = localStorage.getItem('returnToMealPlanner');
    if (!cameFromRecipeDetail) {
      window.scrollTo(0, 0);
    }

    const savedState = localStorage.getItem('mealPlannerState');

    if (savedState) {
      try {
        const parsed = JSON.parse(savedState);
        const savedApplied = parsed.appliedFilters || parsed.filters;
        const savedPending = parsed.pendingFilters || savedApplied;
        const savedMealPlan = parsed.mealPlan;

        if (savedApplied) {
          setAppliedFilters(cloneFilters(savedApplied));
        }
        if (savedPending) {
          setPendingFilters(cloneFilters(savedPending));
        }
        if (savedMealPlan) {
          setMealPlan(savedMealPlan);
        }
        if (parsed.breakfastRecipes) {
          setBreakfastRecipes(parsed.breakfastRecipes);
        }
        if (parsed.lunchRecipes) {
          setLunchRecipes(parsed.lunchRecipes);
        }
        if (parsed.dinnerRecipes) {
          setDinnerRecipes(parsed.dinnerRecipes);
        }
        if (parsed.mealPagination) {
          setMealPagination({
            breakfast: parsed.mealPagination.breakfast || 1,
            lunch: parsed.mealPagination.lunch || 1,
            dinner: parsed.mealPagination.dinner || 1,
          });
        }

        if (cameFromRecipeDetail && parsed.scrollPosition) {
          setTimeout(() => {
            window.scrollTo(0, parsed.scrollPosition || 0);
          }, 100);
        }
      } catch (error) {
        console.error('Error restoring meal planner state:', error);
      }
    }

    setIsRestoringState(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Load recipes when applied filters or currency change
  useEffect(() => {
    if (isRestoringState) return;
    loadAllRecipes(appliedFilters);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [appliedFilters, currency, isRestoringState]);

  // Save state whenever filters or mealPlan changes
  useEffect(() => {
    const state = {
      appliedFilters,
      pendingFilters,
      mealPlan,
      breakfastRecipes,
      lunchRecipes,
      dinnerRecipes,
      mealPagination,
      scrollPosition: window.scrollY
    };
    localStorage.setItem('mealPlannerState', JSON.stringify(state));
  }, [
    appliedFilters,
    pendingFilters,
    mealPlan,
    breakfastRecipes,
    lunchRecipes,
    dinnerRecipes,
    mealPagination,
  ]);

  const cloneFilters = (payload = MEAL_PLANNER_DEFAULT_FILTERS) => ({
    ...createDefaultFilters(),
    ...payload,
    mealTypes: payload?.mealTypes ? [...payload.mealTypes] : [...MEAL_PLANNER_DEFAULT_FILTERS.mealTypes],
    excludeAllergens: payload?.excludeAllergens ? [...payload.excludeAllergens] : [],
  });

  const loadAllRecipes = async (filtersToUse = appliedFilters) => {
    const baseFilters = { ...filtersToUse };
    delete baseFilters.mealTypes;

    const requests = [];

    if (filtersToUse.mealTypes.includes('breakfast')) {
      requests.push(loadRecipesForMeal('breakfast', baseFilters));
    } else {
      setBreakfastRecipes([]);
      setMealPagination((prev) => ({ ...prev, breakfast: 1 }));
    }

    if (filtersToUse.mealTypes.includes('lunch')) {
      requests.push(loadRecipesForMeal('lunch', baseFilters));
    } else {
      setLunchRecipes([]);
      setMealPagination((prev) => ({ ...prev, lunch: 1 }));
    }

    if (filtersToUse.mealTypes.includes('dinner')) {
      requests.push(loadRecipesForMeal('dinner', baseFilters));
    } else {
      setDinnerRecipes([]);
      setMealPagination((prev) => ({ ...prev, dinner: 1 }));
    }

    await Promise.allSettled(requests);
  };

  const loadRecipesForMeal = async (mealType, additionalFilters = {}) => {
    try {
      const recipes = await fetchRecipesByMealType(mealType, additionalFilters);
      switch (mealType) {
        case 'breakfast':
          setBreakfastRecipes(recipes);
          break;
        case 'lunch':
          setLunchRecipes(recipes);
          break;
        case 'dinner':
          setDinnerRecipes(recipes);
          break;
        default:
          break;
      }
      setMealPagination((prev) => ({ ...prev, [mealType]: 1 }));
    } catch (error) {
      console.error(`Error loading ${mealType} recipes:`, error);
      toast.error(`Failed to load ${mealType} recipes`);
    }
  };

  const handlePendingFiltersChange = (newFilters) => {
    setPendingFilters(cloneFilters(newFilters));
  };

  const handleApplyFilters = (filtersToApply) => {
    const payload = cloneFilters(filtersToApply);
    setAppliedFilters(payload);
    setPendingFilters(payload);
    setMealPagination({
      breakfast: 1,
      lunch: 1,
      dinner: 1,
    });
  };

  const handleClearFilters = () => {
    const resetFilters = createDefaultFilters();
    setPendingFilters(resetFilters);
    setAppliedFilters(resetFilters);
    setMealPagination({
      breakfast: 1,
      lunch: 1,
      dinner: 1,
    });
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
      const baseFilters = { ...appliedFilters };
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

  const handlePageChange = (mealType, direction) => {
    setMealPagination((prev) => {
      const totalRecipes = {
        breakfast: breakfastRecipes.length,
        lunch: lunchRecipes.length,
        dinner: dinnerRecipes.length,
      }[mealType];
      const totalPages = Math.max(1, Math.ceil(totalRecipes / RECIPES_PER_PAGE));
      const nextPage = Math.min(
        totalPages,
        Math.max(1, (prev[mealType] || 1) + direction)
      );
      if (nextPage === prev[mealType]) return prev;
      return { ...prev, [mealType]: nextPage };
    });
  };

  const renderMealSection = (mealType, icon, title, recipes, selectedRecipe) => {
    if (!appliedFilters.mealTypes.includes(mealType)) {
      return null;
    }

    const totalPages = Math.max(1, Math.ceil(recipes.length / RECIPES_PER_PAGE));
    const currentPage = Math.min(mealPagination[mealType] || 1, totalPages);
    const startIndex = (currentPage - 1) * RECIPES_PER_PAGE;
    const paginatedRecipes = recipes.slice(startIndex, startIndex + RECIPES_PER_PAGE);

    return (
      <section className="meal-section" key={mealType}>
        <h2 className="meal-section-title">
          <span className="meal-icon">{icon}</span>
          {title}
        </h2>
        {recipes.length > 0 ? (
          <>
            <div className="recipe-grid">
              {paginatedRecipes.map((recipe) => (
                <div
                  key={recipe.id}
                  className={`recipe-card-wrapper ${
                    selectedRecipe?.id === recipe.id ? 'selected' : ''
                  }`}
                >
                  <RecipeCard recipe={recipe} />
                  <button
                    className={`select-recipe-btn ${
                      selectedRecipe?.id === recipe.id ? 'selected' : ''
                    }`}
                    onClick={() => handleSelectRecipe(mealType, recipe)}
                  >
                    {selectedRecipe?.id === recipe.id ? '✓ Selected' : `Select for ${title.split(' ')[0]}`}
                  </button>
                </div>
              ))}
            </div>
            {totalPages > 1 && (
              <div className="meal-pagination">
                <button
                  className="pagination-button"
                  onClick={() => handlePageChange(mealType, -1)}
                  disabled={currentPage === 1}
                >
                  ← Prev
                </button>
                <span className="pagination-info">
                  Page {currentPage} of {totalPages}
                </span>
                <button
                  className="pagination-button"
                  onClick={() => handlePageChange(mealType, 1)}
                  disabled={currentPage === totalPages}
                >
                  Next →
                </button>
              </div>
            )}
          </>
        ) : (
          <p className="no-recipes">No {mealType} recipes found. Try adjusting your filters.</p>
        )}
      </section>
    );
  };

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
            onFilterChange={handlePendingFiltersChange} 
            onApplyFilters={handleApplyFilters}
            onClearFilters={handleClearFilters}
            initialFilters={pendingFilters}
          />
        </aside>

        {/* Right Content - Recipes (3/4) */}
        <main className="meal-planner-content">
          {renderMealSection('breakfast', '🍳', 'Breakfast Recipes', breakfastRecipes, mealPlan.breakfast)}
          {renderMealSection('lunch', '🥗', 'Lunch Recipes', lunchRecipes, mealPlan.lunch)}
          {renderMealSection('dinner', '🍽️', 'Dinner Recipes', dinnerRecipes, mealPlan.dinner)}
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
