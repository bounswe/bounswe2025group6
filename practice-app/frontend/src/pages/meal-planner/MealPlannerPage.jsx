// src/pages/meal-planner/MealPlannerPage.jsx

import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
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
  dietInfo: [...MEAL_PLANNER_DEFAULT_FILTERS.dietInfo],
});

const MealPlannerPage = () => {
  const toast = useToast();
  const { currency } = useCurrency();
  const { t } = useTranslation();

  const [breakfastRecipes, setBreakfastRecipes] = useState([]);
  const [lunchRecipes, setLunchRecipes] = useState([]);
  const [dinnerRecipes, setDinnerRecipes] = useState([]);

  const [mealPlan, setMealPlan] = useState({
    breakfast: null,
    lunch: null,
    dinner: null,
  });
  const [collapsedMeals, setCollapsedMeals] = useState({
    breakfast: false,
    lunch: false,
    dinner: false,
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
    document.title = t('mealPlannerTitle');

    let savedState = null;
    try {
      savedState = localStorage.getItem('mealPlannerState');
    } catch (error) {
      console.error('Error reading from localStorage:', error);
      // Continue without saved state
    }

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
    dietInfo: payload?.dietInfo ? [...payload.dietInfo] : [],
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
      toast.success(t('mealPlannerRandomSuccess'));
      
      // Scroll to bottom to show meal plan summary
      setTimeout(() => {
        window.scrollTo({
          top: document.documentElement.scrollHeight,
          behavior: 'smooth'
        });
      }, 500);
    } catch (error) {
      console.error('Error generating random meal plan:', error);
      toast.error(t('mealPlannerRandomError'));
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
    toast.info(t('mealPlannerCleared'));
    // Scroll to top of page
    setTimeout(() => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }, 100);
  };

  const handleGenerateShopping = () => {
    // Just keep it for backward compatibility
  };

  const toggleMealSection = (mealType) => {
    setCollapsedMeals((prev) => ({
      ...prev,
      [mealType]: !prev[mealType],
    }));
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
    const isCollapsed = collapsedMeals[mealType];

    return (
      <section className="meal-section" key={mealType}>
        <button
          type="button"
          className={`meal-section-header ${isCollapsed ? 'collapsed' : 'expanded'}`}
          onClick={() => toggleMealSection(mealType)}
        >
          <span className="meal-section-arrow">{'>'}</span>
          <div className="meal-section-title">
            <span className="meal-icon">{icon}</span>
            {title}
          </div>
        </button>
        <div
          className={`meal-section-content ${isCollapsed ? 'collapsed' : 'expanded'}`}
          aria-hidden={isCollapsed}
        >
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
                      {selectedRecipe?.id === recipe.id ? t('mealPlannerSelected') : `${t('mealPlannerSelectFor')} ${title.split(' ')[0]}`}
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
                    {t('mealPlannerPrevButton')}
                  </button>
                  <span className="pagination-info">
                    {currentPage}/{totalPages}
                  </span>
                  <button
                    className="pagination-button"
                    onClick={() => handlePageChange(mealType, 1)}
                    disabled={currentPage === totalPages}
                  >
                    {t('mealPlannerNextButton')}
                  </button>
                </div>
              )}
            </>
          ) : (
            <p className="no-recipes">{t('mealPlannerNoRecipes')}</p>
          )}
        </div>
      </section>
    );
  };

  return (
    <div className="meal-planner-page">
      <div className="meal-planner-header">
        <h1 className="meal-planner-title">{t('mealPlannerTitle')}</h1>
        <div className="header-actions">
          <button 
            onClick={handleGenerateRandom} 
            disabled={isLoading}
            className="modern-green-button"
          >
            {t('mealPlannerGenerateButton')}
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
          {renderMealSection('breakfast', '🍳', t('mealPlannerBreakfastRecipes'), breakfastRecipes, mealPlan.breakfast)}
          {renderMealSection('lunch', '🥗', t('mealPlannerLunchRecipes'), lunchRecipes, mealPlan.lunch)}
          {renderMealSection('dinner', '🍽️', t('mealPlannerDinnerRecipes'), dinnerRecipes, mealPlan.dinner)}
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
