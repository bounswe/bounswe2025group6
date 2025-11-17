// MealPlannerPage.jsx - Comprehensive meal planner with enhanced recipe cards
import React, { useState, useEffect, useCallback, Suspense } from 'react';
import { useNavigate } from 'react-router-dom';
import { getRecipesByMealPlanner, calculateTotalNutrition, calculateTotalCost, generateShoppingList, saveMealPlan } from '../../services/mealPlanService';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import Modal from '../../components/ui/Modal';
import { useToast } from '../../components/ui/Toast';
import '../../styles/MealPlannerPage.css';

// Enhanced recipe card component
const MealPlanRecipeCard = ({ recipe, isSelected, onSelect, onViewDetails }) => {
  const [recipeImage, setRecipeImage] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [creatorName, setCreatorName] = useState('');
  const cardRef = React.useRef(null);

  // Lazy loading with IntersectionObserver
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.1 }
    );

    if (cardRef.current) {
      observer.observe(cardRef.current);
    }

    return () => {
      if (cardRef.current) {
        observer.disconnect();
      }
    };
  }, []);

  // Load image when card becomes visible
  useEffect(() => {
    const loadImage = async () => {
      if (!isVisible || isLoading || recipeImage) return;
      
      try {
        setIsLoading(true);
        
        // First check if recipe has an uploaded image
        if (recipe.image_full_url) {
          setRecipeImage(recipe.image_full_url);
          return;
        }
        
        // If no uploaded image, use a default food image
        setRecipeImage("https://images.unsplash.com/photo-1484723091739-30a097e8f929?q=80&w=1547&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D");
      } catch (error) {
        console.error('Error loading recipe image:', error);
        setRecipeImage("https://images.unsplash.com/photo-1484723091739-30a097e8f929?q=80&w=1547&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D");
      } finally {
        setIsLoading(false);
      }
    };

    loadImage();
  }, [recipe.name, recipe.image_full_url, isVisible, isLoading, recipeImage]);

  // Get market logo for cheapest market
  const getMarketLogo = (marketName) => {
    switch(marketName) {
      case 'A101': return '/src/assets/market_logos/a101.png';
      case 'SOK': return '/src/assets/market_logos/sok.png';
      case 'BIM': return '/src/assets/market_logos/bim.png';
      case 'MIGROS': return '/src/assets/market_logos/migros.png';
      default: return null;
    }
  };

  // Get cheapest market info
  const getCheapestMarketInfo = () => {
    if (recipe.recipe_costs && Object.keys(recipe.recipe_costs).length > 0) {
      const minCost = Math.min(...Object.values(recipe.recipe_costs));
      const cheapestMarket = Object.entries(recipe.recipe_costs).find(([_, cost]) => cost === minCost)?.[0];
      return { market: cheapestMarket, cost: minCost };
    }
    return null;
  };

  const cheapestMarketInfo = getCheapestMarketInfo();

  return (
    <div 
      className={`meal-plan-recipe-card ${isSelected ? 'selected' : ''}`}
      ref={cardRef}
      onClick={(e) => e.preventDefault()} // Prevent any default click behavior
    >
      {/* Recipe Image */}
      <div 
        className="meal-plan-recipe-card-image" 
        style={{
          backgroundImage: recipeImage ? `url("${recipeImage}")` : 'none',
          backgroundColor: recipeImage ? 'transparent' : '#f7fafc'
        }}
      >
        {isLoading && (
          <div className="meal-plan-image-loader">
            <div className="meal-plan-loader-spinner"></div>
          </div>
        )}
        
        {/* Selection Indicator */}
        {isSelected && (
          <div className="selection-indicator">
            <div className="selection-checkmark">✓</div>
          </div>
        )}

        {/* Meal Type Badge */}
        <div className="meal-type-badge">
          {recipe.meal_type || 'No type'}
        </div>
      </div>

      {/* Recipe Content */}
      <div className="meal-plan-recipe-card-content">
        <h3 className="meal-plan-recipe-title">{recipe.name}</h3>
        
        {/* Recipe Info */}
        <div className="meal-plan-recipe-info">
          <div className="meal-plan-recipe-top-row">
            <div className="cost-info">
              <span className="cost-amount">
                ${parseFloat(recipe.cost_per_serving || 0).toFixed(2)}
              </span>
              {cheapestMarketInfo && (
                <img 
                  src={getMarketLogo(cheapestMarketInfo.market)} 
                  alt={cheapestMarketInfo.market} 
                  className="market-logo" 
                />
              )}
            </div>
          </div>

          <div className="meal-plan-recipe-meta">
            <span className="time-info">
              ⏱ {recipe.total_time || (recipe.prep_time + recipe.cook_time) || 0}min
            </span>
            <span className="prep-cook-info">
              {recipe.prep_time || 0}m prep • {recipe.cook_time || 0}m cook
            </span>
          </div>

          {recipe.recipe_nutritions && (
            <div className="meal-plan-nutrition-info">
              <span className="nutrition-item">
                🔥 {recipe.recipe_nutritions.calories || 0}cal
              </span>
              <span className="nutrition-item">
                🥩 {recipe.recipe_nutritions.protein || 0}g protein
              </span>
            </div>
          )}

          <div className="creator-info">
            <span>by {creatorName || recipe.creator_name || 'Chef'}</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="meal-plan-recipe-actions">
          <Button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onSelect(recipe, e);
            }}
            variant={isSelected ? "secondary" : "primary"}
            size="small"
            className="select-recipe-btn"
          >
            {isSelected ? '✓ Selected' : 'Select for Plan'}
          </Button>
          
          <Button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onViewDetails(recipe);
            }}
            variant="outline"
            size="small"
            className="view-recipe-btn"
          >
            View Details
          </Button>
        </div>
      </div>
    </div>
  );
};

const MealPlannerPage = () => {
  const navigate = useNavigate();
  const { showToast } = useToast();
  
  // State Management
  const [selectedMeals, setSelectedMeals] = useState({
    breakfast: null,
    lunch: null,
    dinner: null
  });
  
  const [availableRecipes, setAvailableRecipes] = useState({
    breakfast: [],
    lunch: [],
    dinner: []
  });
  
  const [currentMealType, setCurrentMealType] = useState('breakfast');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [planName, setPlanName] = useState('');
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  
  // Filter State - simplified to match what actually works
  const [filters, setFilters] = useState({
    maxCostPerServing: '',
    maxTotalTime: '',
    minCalories: '',
    maxCalories: '',
    minProtein: '',
    maxProtein: '',
    hasImage: false
  });
  
  const [selectedDietaryPrefs, setSelectedDietaryPrefs] = useState([]);
  const [excludedAllergens, setExcludedAllergens] = useState([]);

  // Meal type configurations
  const mealTypes = {
    breakfast: { 
      icon: '🌅', 
      label: 'Breakfast',
      color: '#f59e0b' 
    },
    lunch: { 
      icon: '☀️', 
      label: 'Lunch',
      color: '#10b981' 
    },
    dinner: { 
      icon: '🌙', 
      label: 'Dinner',
      color: '#3b82f6' 
    }
  };

  // Load user profile on mount
  useEffect(() => {
    const loadUserProfile = async () => {
      try {
        const profile = {
          allergens: JSON.parse(localStorage.getItem('userAllergens') || '[]'),
          monthlyBudget: parseFloat(localStorage.getItem('userBudget') || '0'),
          dietaryPreferences: JSON.parse(localStorage.getItem('userDietaryPrefs') || '[]')
        };
        
        setExcludedAllergens(profile.allergens);
        setSelectedDietaryPrefs(profile.dietaryPreferences);
        
        if (profile.monthlyBudget > 0) {
          setFilters(prev => ({
            ...prev,
            maxCostPerServing: (profile.monthlyBudget / 90).toFixed(2)
          }));
        }
      } catch (error) {
        console.error('Failed to load user profile:', error);
      }
    };

    const checkForLoadedMealPlan = () => {
      try {
        const loadedPlan = localStorage.getItem('loadedMealPlan');
        if (loadedPlan) {
          const plan = JSON.parse(loadedPlan);
          setSelectedMeals(plan.meals || {});
          setPlanName(plan.name + ' (Copy)');
          localStorage.removeItem('loadedMealPlan');
          
          if (showToast) {
            showToast(`Loaded meal plan: ${plan.name}`, 'success');
          }
        }
      } catch (error) {
        console.error('Error loading meal plan:', error);
      }
    };

    loadUserProfile();
    checkForLoadedMealPlan();
    loadRecipesForMealType('breakfast');
  }, [showToast]);

  // Load recipes for specific meal type
  const loadRecipesForMealType = useCallback(async (mealType) => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Build clean filters object - only send values that exist
      const searchFilters = {
        meal_type: mealType,
        page_size: 50
      };

      // Add filters only if they have values
      if (filters.maxCostPerServing && parseFloat(filters.maxCostPerServing) > 0) {
        searchFilters.max_cost_per_serving = parseFloat(filters.maxCostPerServing);
      }
      
      if (filters.maxTotalTime && parseInt(filters.maxTotalTime) > 0) {
        searchFilters.max_total_time = parseInt(filters.maxTotalTime);
      }
      
      if (filters.minCalories && parseFloat(filters.minCalories) > 0) {
        searchFilters.min_calories = parseFloat(filters.minCalories);
      }
      
      if (filters.maxCalories && parseFloat(filters.maxCalories) > 0) {
        searchFilters.max_calories = parseFloat(filters.maxCalories);
      }
      
      if (filters.minProtein && parseFloat(filters.minProtein) > 0) {
        searchFilters.min_protein = parseFloat(filters.minProtein);
      }
      
      if (filters.maxProtein && parseFloat(filters.maxProtein) > 0) {
        searchFilters.max_protein = parseFloat(filters.maxProtein);
      }
      
      // Only add has_image if it's true
      if (filters.hasImage) {
        searchFilters.has_image = true;
      }

      console.log('Loading recipes for:', mealType, 'with filters:', searchFilters);

      const response = await getRecipesByMealPlanner(searchFilters);
      
      let filteredRecipes = response.results || [];
      
      console.log(`Received ${filteredRecipes.length} ${mealType} recipes from API`);

      // Apply client-side dietary and allergen filters if needed
      if (selectedDietaryPrefs.length > 0) {
        filteredRecipes = filteredRecipes.filter(recipe =>
          selectedDietaryPrefs.some(pref =>
            recipe.dietary_info?.includes(pref)
          )
        );
      }
      
      if (excludedAllergens.length > 0) {
        filteredRecipes = filteredRecipes.filter(recipe =>
          !excludedAllergens.some(allergen =>
            recipe.allergens?.includes(allergen)
          )
        );
      }

      console.log(`After client filtering: ${filteredRecipes.length} ${mealType} recipes`);

      setAvailableRecipes(prev => ({
        ...prev,
        [mealType]: filteredRecipes
      }));

    } catch (err) {
      console.error('Failed to load recipes:', err);
      setError(`Failed to load ${mealType} recipes. ${err.message || 'Please try again.'}`);
      if (showToast) {
        showToast(`Failed to load ${mealType} recipes`, 'error');
      }
    } finally {
      setIsLoading(false);
    }
  }, [filters, selectedDietaryPrefs, excludedAllergens, showToast]);

  // Handle meal type change
  const handleMealTypeChange = (mealType) => {
    setCurrentMealType(mealType);
    loadRecipesForMealType(mealType);
  };

  // Handle recipe selection for meal planning
  const handleRecipeSelect = (recipe, event) => {
    // Stop event propagation to prevent navigation
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }

    console.log('Selecting recipe for meal planning:', recipe.name);

    setSelectedMeals(prev => ({
      ...prev,
      [currentMealType]: recipe
    }));

    if (showToast) {
      showToast(`${recipe.name} added to ${mealTypes[currentMealType].label}`, 'success');
    }
  };

  // Handle viewing recipe details (separate from selection)
  const handleViewRecipe = (recipe) => {
    navigate(`/recipes/${recipe.id}`);
  };

  // Remove selected meal
  const handleRemoveMeal = (mealType) => {
    setSelectedMeals(prev => ({
      ...prev,
      [mealType]: null
    }));
    if (showToast) {
      showToast(`${mealTypes[mealType].label} removed from plan`, 'success');
    }
  };

  // Generate random meal plan
  const handleRandomGenerate = async () => {
    setIsLoading(true);
    try {
      const randomMeals = {};
      
      for (const mealType of Object.keys(mealTypes)) {
        await loadRecipesForMealType(mealType);
        const mealRecipes = availableRecipes[mealType];
        if (mealRecipes.length > 0) {
          const randomIndex = Math.floor(Math.random() * mealRecipes.length);
          randomMeals[mealType] = mealRecipes[randomIndex];
        }
      }
      
      setSelectedMeals(randomMeals);
      
      if (showToast) {
        showToast('Random meal plan generated!', 'success');
      }
    } catch (error) {
      console.error('Failed to generate random meal plan:', error);
      if (showToast) {
        showToast('Failed to generate random meal plan', 'error');
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Clear all selections
  const handleClearPlan = () => {
    setSelectedMeals({
      breakfast: null,
      lunch: null,
      dinner: null
    });
    if (showToast) {
      showToast('Meal plan cleared', 'success');
    }
  };

  // Save meal plan
  const handleSavePlan = () => {
    if (!planName.trim()) {
      if (showToast) {
        showToast('Please enter a plan name', 'error');
      }
      return;
    }

    const mealPlan = {
      name: planName.trim(),
      meals: selectedMeals,
      date: new Date().toISOString().split('T')[0],
      totalNutrition: calculateTotalNutrition(selectedMeals),
      totalCost: calculateTotalCost(selectedMeals),
      createdAt: new Date().toISOString()
    };

    try {
      const success = saveMealPlan(mealPlan);
      if (success) {
        if (showToast) {
          showToast('Meal plan saved successfully!', 'success');
        }
        setShowSaveModal(false);
        setPlanName('');
        
        setTimeout(() => {
          navigate('/saved-meal-plans');
        }, 1500);
      } else {
        if (showToast) {
          showToast('Failed to save meal plan', 'error');
        }
      }
    } catch (error) {
      console.error('Error saving meal plan:', error);
      if (showToast) {
        showToast('Error saving meal plan', 'error');
      }
    }
  };

  // Generate shopping list
  const handleGenerateShoppingList = () => {
    try {
      const shoppingList = generateShoppingList(selectedMeals);
      
      const savedLists = JSON.parse(localStorage.getItem('savedShoppingLists') || '[]');
      const newList = {
        ...shoppingList,
        id: Date.now().toString(),
        mealPlanReference: {
          meals: Object.entries(selectedMeals)
            .filter(([_, meal]) => meal !== null)
            .map(([mealType, meal]) => ({ mealType, mealName: meal.name }))
        }
      };
      
      savedLists.push(newList);
      localStorage.setItem('savedShoppingLists', JSON.stringify(savedLists));
      
      if (showToast) {
        showToast('Shopping list generated!', 'success');
      }
      
      navigate('/shopping-list');
    } catch (error) {
      console.error('Failed to generate shopping list:', error);
      if (showToast) {
        showToast('Failed to generate shopping list', 'error');
      }
    }
  };

  // Apply filters
  const handleApplyFilters = () => {
    setShowFilters(false);
    loadRecipesForMealType(currentMealType);
    if (showToast) {
      showToast('Filters applied', 'success');
    }
  };

  // Reset filters
  const handleResetFilters = () => {
    setFilters({
      maxCostPerServing: '',
      maxTotalTime: '',
      minCalories: '',
      maxCalories: '',
      minProtein: '',
      maxProtein: '',
      hasImage: false
    });
    setSelectedDietaryPrefs([]);
    setExcludedAllergens([]);
  };

  // Calculate totals
  const totalNutrition = calculateTotalNutrition(selectedMeals);
  const totalCost = calculateTotalCost(selectedMeals);

  return (
    <div className="meal-planner-container">
      {/* Add the enhanced recipe card styles */}
      <style jsx>{`
        .meal-plan-recipe-card {
          background: linear-gradient(135deg, #ffffff, #f8f9fa);
          border-radius: 16px;
          box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
          overflow: hidden;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          position: relative;
          cursor: pointer;
          border: 2px solid transparent;
          height: 100%;
          display: flex;
          flex-direction: column;
        }

        .meal-plan-recipe-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 12px 35px rgba(0, 0, 0, 0.15);
          border-color: rgba(56, 161, 105, 0.3);
        }

        .meal-plan-recipe-card.selected {
          border-color: #38a169;
          box-shadow: 0 8px 30px rgba(56, 161, 105, 0.25);
          background: linear-gradient(135deg, #f0fff4, #e6fffa);
        }

        .meal-plan-recipe-card-image {
          height: 200px;
          background-size: cover;
          background-position: center;
          background-repeat: no-repeat;
          position: relative;
          display: flex;
          align-items: center;
          justify-content: center;
          background-color: #f7fafc;
        }

        .meal-plan-image-loader {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          display: flex;
          align-items: center;
          justify-content: center;
          background: rgba(255, 255, 255, 0.9);
          border-radius: 8px;
          padding: 12px;
        }

        .meal-plan-loader-spinner {
          width: 24px;
          height: 24px;
          border: 3px solid rgba(56, 161, 105, 0.3);
          border-top-color: #38a169;
          border-radius: 50%;
          animation: meal-plan-spin 1s linear infinite;
        }

        @keyframes meal-plan-spin {
          to { transform: rotate(360deg); }
        }

        .selection-indicator {
          position: absolute;
          top: 12px;
          right: 12px;
          background: #38a169;
          border-radius: 50%;
          width: 32px;
          height: 32px;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 2px 8px rgba(56, 161, 105, 0.3);
          animation: meal-plan-pop 0.3s ease-out;
        }

        @keyframes meal-plan-pop {
          0% { transform: scale(0); opacity: 0; }
          50% { transform: scale(1.2); }
          100% { transform: scale(1); opacity: 1; }
        }

        .selection-checkmark {
          color: white;
          font-size: 16px;
          font-weight: bold;
        }

        .meal-type-badge {
          position: absolute;
          top: 12px;
          left: 12px;
          background: linear-gradient(135deg, rgba(44, 62, 80, 0.9), rgba(52, 73, 94, 0.9));
          color: white;
          padding: 6px 12px;
          border-radius: 20px;
          font-size: 0.8rem;
          font-weight: 600;
          text-transform: capitalize;
          backdrop-filter: blur(10px);
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
          border: 1px solid rgba(255, 255, 255, 0.2);
        }

        .meal-plan-recipe-card-content {
          padding: 20px;
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .meal-plan-recipe-title {
          font-size: 1.2rem;
          font-weight: 600;
          color: #2d3748;
          margin: 0;
          line-height: 1.4;
        }

        .meal-plan-recipe-info {
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        .cost-info {
          display: flex;
          align-items: center;
          gap: 8px;
          background: linear-gradient(135deg, #f0fff4, #e6fffa);
          padding: 8px 12px;
          border-radius: 8px;
          border: 1px solid #c6f6d5;
        }

        .cost-amount {
          font-weight: 700;
          font-size: 1.1rem;
          color: #38a169;
        }

        .market-logo {
          width: 24px;
          height: 24px;
          object-fit: contain;
          border-radius: 4px;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
        }

        .meal-plan-recipe-meta {
          display: flex;
          flex-direction: column;
          gap: 4px;
          font-size: 0.85rem;
          color: #4a5568;
        }

        .time-info {
          font-weight: 600;
          color: #2d3748;
        }

        .prep-cook-info {
          color: #68d391;
          font-size: 0.8rem;
        }

        .meal-plan-nutrition-info {
          display: flex;
          flex-wrap: wrap;
          gap: 12px;
          margin: 8px 0;
        }

        .nutrition-item {
          font-size: 0.85rem;
          color: #2d3748;
          background: #f7fafc;
          padding: 4px 8px;
          border-radius: 6px;
          border: 1px solid #e2e8f0;
        }

        .creator-info {
          font-size: 0.8rem;
          color: #68d391;
          font-style: italic;
          margin-top: auto;
        }

        .meal-plan-recipe-actions {
          display: flex;
          gap: 8px;
          margin-top: auto;
          padding-top: 12px;
        }

        .meal-plan-recipe-actions button {
          flex: 1;
          font-size: 0.85rem;
          padding: 8px 12px;
          border-radius: 8px;
          font-weight: 600;
        }

        @media (max-width: 768px) {
          .meal-plan-recipe-actions {
            flex-direction: column;
          }
        }
      `}</style>

      {/* Header */}
      <div className="meal-planner-header">
        <div>
          <h1 className="meal-planner-title">🍽️ Meal Planner</h1>
          <p className="meal-planner-subtitle">Plan your daily meals and optimize your nutrition</p>
        </div>

        <div className="meal-planner-actions">
          <Button onClick={() => setShowFilters(true)} variant="outline">
            🔍 Filters
          </Button>
          <Button onClick={handleRandomGenerate} variant="outline" disabled={isLoading}>
            🎲 Random Plan
          </Button>
          <Button onClick={handleClearPlan} variant="outline">
            🗑️ Clear
          </Button>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="error-banner">
          <p>⚠️ {error}</p>
          <Button onClick={() => setError(null)} size="small">
            Dismiss
          </Button>
        </div>
      )}

      {/* Meal Type Tabs */}
      <div className="meal-tabs">
        {Object.entries(mealTypes).map(([type, config]) => (
          <button
            key={type}
            className={`meal-tab ${currentMealType === type ? 'active' : ''}`}
            onClick={() => handleMealTypeChange(type)}
          >
            <div className="meal-icon">{config.icon}</div>
            <div className="meal-label">{config.label}</div>
            {selectedMeals[type] && <div className="meal-selected">✓</div>}
          </button>
        ))}
      </div>

      {/* Available Recipes */}
      <div className="available-recipes-section">
        <h3>Available {mealTypes[currentMealType].label} Recipes</h3>
        
        {isLoading ? (
          <div className="loading-container">
            <div className="loading-spinner"></div>
            <p>Loading {currentMealType} recipes...</p>
          </div>
        ) : availableRecipes[currentMealType].length > 0 ? (
          <div className="recipe-grid">
            {availableRecipes[currentMealType].map(recipe => (
              <MealPlanRecipeCard
                key={recipe.id}
                recipe={recipe}
                isSelected={selectedMeals[currentMealType]?.id === recipe.id}
                onSelect={handleRecipeSelect}
                onViewDetails={handleViewRecipe}
              />
            ))}
          </div>
        ) : (
          <div className="no-recipes">
            <p>No {currentMealType} recipes found with current filters.</p>
            <Button onClick={() => loadRecipesForMealType(currentMealType)}>
              Retry
            </Button>
          </div>
        )}
      </div>

      {/* Meal Plan Summary */}
      {Object.values(selectedMeals).some(meal => meal !== null) && (
        <Card className="summary-card">
          <Card.Body>
            <h3>📋 Current Meal Plan</h3>

            {/* Selected Meals */}
            <div className="selected-meals">
              {Object.entries(selectedMeals).map(([mealType, meal]) => (
                <div key={mealType} className="summary-meal">
                  <span className="meal-type">
                    {mealTypes[mealType].icon} {mealTypes[mealType].label}
                  </span>
                  {meal ? (
                    <>
                      <span className="meal-name">{meal.name}</span>
                      <span className="meal-cost">${parseFloat(meal.cost_per_serving || 0).toFixed(2)}</span>
                      <Button
                        size="xs"
                        variant="ghost"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRemoveMeal(mealType);
                        }}
                      >
                        ✕
                      </Button>
                    </>
                  ) : (
                    <span className="meal-name-empty">No meal selected</span>
                  )}
                </div>
              ))}
            </div>

            {/* Totals */}
            <div className="summary-totals">
              <div className="total-cost">
                <strong>Total Daily Cost: ${totalCost.toFixed(2)}</strong>
              </div>

              <div className="nutrition-totals">
                <div className="nutrition-item">
                  <div>🔥 Calories</div>
                  <span>{Math.round(totalNutrition.calories)}</span>
                </div>
                <div className="nutrition-item">
                  <div>🥩 Protein</div>
                  <span>{Math.round(totalNutrition.protein)}g</span>
                </div>
                <div className="nutrition-item">
                  <div>🍞 Carbs</div>
                  <span>{Math.round(totalNutrition.carbs)}g</span>
                </div>
                <div className="nutrition-item">
                  <div>🥑 Fat</div>
                  <span>{Math.round(totalNutrition.fat)}g</span>
                </div>
              </div>
            </div>

            {/* Plan Actions */}
            <div className="plan-actions">
              <Button onClick={() => setShowSaveModal(true)} variant="secondary">
                💾 Save Plan
              </Button>
              <Button onClick={handleGenerateShoppingList} variant="success">
                🛒 Generate Shopping List
              </Button>
            </div>
          </Card.Body>
        </Card>
      )}

      {/* Filter Modal */}
      <Modal 
        isOpen={showFilters} 
        onClose={() => setShowFilters(false)}
        title="🔍 Filters & Preferences"
      >
        <div className="filter-modal-content">
          {/* Basic Filters */}
          <div className="filter-section">
            <h3>Basic Filters</h3>
            <div className="filter-grid">
              <div className="filter-group">
                <label>Max Cost per Serving ($)</label>
                <input
                  type="number"
                  value={filters.maxCostPerServing}
                  onChange={(e) => setFilters(prev => ({ ...prev, maxCostPerServing: e.target.value }))}
                  placeholder="e.g. 15.00"
                  step="0.50"
                  min="0"
                />
              </div>
              <div className="filter-group">
                <label>Max Total Time (minutes)</label>
                <input
                  type="number"
                  value={filters.maxTotalTime}
                  onChange={(e) => setFilters(prev => ({ ...prev, maxTotalTime: e.target.value }))}
                  placeholder="e.g. 60"
                  step="5"
                  min="0"
                />
              </div>
            </div>
          </div>

          {/* Nutrition Filters */}
          <div className="filter-section">
            <h3>🥗 Nutrition</h3>
            <div className="filter-grid">
              <div className="filter-group">
                <label>Min Calories</label>
                <input
                  type="number"
                  value={filters.minCalories}
                  onChange={(e) => setFilters(prev => ({ ...prev, minCalories: e.target.value }))}
                  placeholder="e.g. 300"
                />
              </div>
              <div className="filter-group">
                <label>Max Calories</label>
                <input
                  type="number"
                  value={filters.maxCalories}
                  onChange={(e) => setFilters(prev => ({ ...prev, maxCalories: e.target.value }))}
                  placeholder="e.g. 800"
                />
              </div>
              <div className="filter-group">
                <label>Min Protein (g)</label>
                <input
                  type="number"
                  value={filters.minProtein}
                  onChange={(e) => setFilters(prev => ({ ...prev, minProtein: e.target.value }))}
                  placeholder="e.g. 15"
                />
              </div>
              <div className="filter-group">
                <label>Max Protein (g)</label>
                <input
                  type="number"
                  value={filters.maxProtein}
                  onChange={(e) => setFilters(prev => ({ ...prev, maxProtein: e.target.value }))}
                  placeholder="e.g. 50"
                />
              </div>
            </div>
          </div>

          {/* Additional Filters */}
          <div className="filter-section">
            <h3>Other Filters</h3>
            <div className="filter-checkbox">
              <label>
                <input
                  type="checkbox"
                  checked={filters.hasImage}
                  onChange={(e) => setFilters(prev => ({ ...prev, hasImage: e.target.checked }))}
                />
                Only show recipes with images
              </label>
            </div>
          </div>

          <div className="filter-actions">
            <Button onClick={handleResetFilters} variant="ghost">
              Reset All
            </Button>
            <Button onClick={handleApplyFilters} variant="success">
              Apply Filters
            </Button>
          </div>
        </div>
      </Modal>

      {/* Save Plan Modal */}
      <Modal 
        isOpen={showSaveModal} 
        onClose={() => setShowSaveModal(false)}
        title="💾 Save Meal Plan"
      >
        <div className="save-modal-content">
          <div className="form-group">
            <label htmlFor="planName">Plan Name</label>
            <input
              id="planName"
              type="text"
              placeholder="Enter plan name (e.g., 'Monday Meals')"
              value={planName}
              onChange={(e) => setPlanName(e.target.value)}
              className="plan-name-input"
            />
          </div>
          <div className="modal-actions">
            <Button onClick={() => setShowSaveModal(false)} variant="ghost">
              Cancel
            </Button>
            <Button onClick={handleSavePlan} variant="success">
              Save Plan
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default MealPlannerPage;