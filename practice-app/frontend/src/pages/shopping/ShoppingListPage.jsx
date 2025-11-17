// src/pages/shopping/ShoppingListPage.jsx

import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getRecipeById } from '../../services/recipeService';
import { useCurrency } from '../../contexts/CurrencyContext';
import Button from '../../components/ui/Button';
import '../../styles/ShoppingListPage.css';
import '../../styles/style.css';
import { useTranslation } from "react-i18next";

const ShoppingListPage = () => {
  const { t } = useTranslation();
  const { currency } = useCurrency();
  const navigate = useNavigate();
  
  const [recipes, setRecipes] = useState([]);
  const [consolidatedIngredients, setConsolidatedIngredients] = useState([]);
  const [marketCosts, setMarketCosts] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    document.title = "Shopping List";
    
    // Check if we're returning from ingredient detail
    const savedState = localStorage.getItem('shoppingListState');
    if (savedState) {
      try {
        const { recipes: savedRecipes, consolidatedIngredients: savedIngredients, marketCosts: savedMarketCosts } = JSON.parse(savedState);
        setRecipes(savedRecipes);
        setConsolidatedIngredients(savedIngredients);
        setMarketCosts(savedMarketCosts);
        setIsLoading(false);
        
        // Clear the saved state
        localStorage.removeItem('shoppingListState');
        return;
      } catch (error) {
        console.error('Error restoring shopping list state:', error);
      }
    }
    
    loadMealPlanAndRecipes();
  }, []);

  const loadMealPlanAndRecipes = async () => {
    setIsLoading(true);
    try {
      // Get meal plan from localStorage
      const storedPlan = localStorage.getItem('currentMealPlan');
      if (!storedPlan) {
        setIsLoading(false);
        return;
      }

      const { activePlan } = JSON.parse(storedPlan);
      const recipeIds = [];
      
      if (activePlan.breakfast) recipeIds.push(activePlan.breakfast.id);
      if (activePlan.lunch) recipeIds.push(activePlan.lunch.id);
      if (activePlan.dinner) recipeIds.push(activePlan.dinner.id);

      // Fetch full recipe details with ingredients
      const recipeDetails = await Promise.all(
        recipeIds.map(id => getRecipeById(id))
      );

      setRecipes(recipeDetails);
      
      // Consolidate ingredients
      const ingredientsMap = new Map();
      
      recipeDetails.forEach(recipe => {
        if (recipe.ingredients) {
          recipe.ingredients.forEach(recipeIngredient => {
            const ingredientId = recipeIngredient.ingredient.id;
            const ingredientName = recipeIngredient.ingredient_name || recipeIngredient.ingredient.name;
            const quantity = parseFloat(recipeIngredient.quantity) || 0;
            const unit = recipeIngredient.unit;

            // Create unique key for same ingredient and unit
            const key = `${ingredientId}-${unit}`;
            
            if (ingredientsMap.has(key)) {
              const existing = ingredientsMap.get(key);
              existing.quantity += quantity;
              
              // Add costs for each market
              if (recipeIngredient.costs_for_recipe) {
                Object.keys(recipeIngredient.costs_for_recipe).forEach(market => {
                  if (existing.costs_for_recipe[market] !== undefined && recipeIngredient.costs_for_recipe[market] !== undefined) {
                    existing.costs_for_recipe[market] += parseFloat(recipeIngredient.costs_for_recipe[market] || 0);
                  }
                });
              }
            } else {
              ingredientsMap.set(key, {
                ingredientId,
                name: ingredientName,
                quantity,
                unit,
                costs_for_recipe: recipeIngredient.costs_for_recipe ? 
                  Object.fromEntries(
                    Object.entries(recipeIngredient.costs_for_recipe).map(([k, v]) => [k, parseFloat(v || 0)])
                  ) : {},
              });
            }
          });
        }
      });

      const consolidated = Array.from(ingredientsMap.values());
      setConsolidatedIngredients(consolidated);

      // Calculate total costs per market
      const totals = { A101: 0, SOK: 0, BIM: 0, MIGROS: 0 };
      consolidated.forEach(ingredient => {
        Object.keys(totals).forEach(market => {
          if (ingredient.costs_for_recipe[market] !== undefined) {
            totals[market] += ingredient.costs_for_recipe[market];
          }
        });
      });

      setMarketCosts(totals);

    } catch (error) {
      console.error('Error loading shopping list:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getCheapestMarket = () => {
    const markets = Object.entries(marketCosts).filter(([_, cost]) => cost > 0);
    if (markets.length === 0) return null;
    
    return markets.reduce((min, [market, cost]) => 
      cost < min[1] ? [market, cost] : min
    , markets[0]);
  };

  const handleIngredientClick = (ingredientId) => {
    // Save current shopping list state
    localStorage.setItem('shoppingListState', JSON.stringify({
      recipes,
      consolidatedIngredients,
      marketCosts
    }));
    navigate(`/ingredients/${ingredientId}`);
  };

  const copyToClipboard = () => {
    let text = '🛒 Shopping List\n\n';
    
    // Add recipes
    text += '📋 Recipes:\n';
    recipes.forEach((recipe, index) => {
      const nutrition = recipe.recipe_nutritions || {};
      text += `${index + 1}. ${recipe.name}\n`;
      text += `   Calories: ${nutrition.calories || 0} cal | `;
      text += `Protein: ${nutrition.protein || 0}g | `;
      text += `Carbs: ${nutrition.carbs || 0}g | `;
      text += `Fat: ${nutrition.fat || 0}g\n\n`;
    });

    // Add ingredients
    text += '\n📦 Ingredients:\n';
    consolidatedIngredients.forEach((ingredient, index) => {
      text += `${index + 1}. ${ingredient.quantity.toFixed(2)} ${ingredient.unit} ${ingredient.name}\n`;
    });

    // Add market costs
    text += '\n💰 Total Costs:\n';
    const cheapest = getCheapestMarket();
    Object.entries(marketCosts).forEach(([market, cost]) => {
      const marker = cheapest && market === cheapest[0] ? '✓ ' : '  ';
      text += `${marker}${market}: ${cost.toFixed(2)} ${currency}\n`;
    });

    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (isLoading) {
    return (
      <div className="shopping-list-container">
        <div className="loading-state">Loading shopping list...</div>
      </div>
    );
  }

  if (recipes.length === 0) {
    return (
      <div className="shopping-list-container">
        <div className="empty-state">
          <p>No meal plan found. Please create a meal plan first.</p>
          <Link to="/meal-planner">
            <Button>Go to Meal Planner</Button>
          </Link>
        </div>
      </div>
    );
  }

  const cheapestMarket = getCheapestMarket();

  return (
    <div className="shopping-list-container">
      {/* Header */}
      <div className="shopping-list-header">
        <h1 className="shopping-list-title">🛒 Shopping List</h1>
        <button 
          onClick={copyToClipboard}
          className="copy-button"
          title="Copy to clipboard"
        >
          {copied ? '✓ Copied!' : '📋 Copy'}
        </button>
      </div>

      {/* Main Content - 2 Columns */}
      <div className="shopping-list-content">
        {/* Left Column - Recipes + Markets */}
        <div className="left-column">
          {/* Recipes Summary */}
          <div className="recipes-summary-section">
            <h2 className="section-title">📋 Recipes</h2>
            <div className="recipes-summary-grid">
              {recipes.map((recipe, index) => {
                const nutrition = recipe.recipe_nutritions || {};
                return (
                  <div key={recipe.id} className="recipe-summary-card">
                    <h3 className="recipe-summary-name">{recipe.name}</h3>
                    <div className="recipe-summary-nutrition">
                      <div className="nutrition-item">
                        <span className="nutrition-label">Calories:</span>
                        <span className="nutrition-value">{parseFloat(nutrition.calories || 0).toFixed(0)} cal</span>
                      </div>
                      <div className="nutrition-item">
                        <span className="nutrition-label">Protein:</span>
                        <span className="nutrition-value">{parseFloat(nutrition.protein || 0).toFixed(1)}g</span>
                      </div>
                      <div className="nutrition-item">
                        <span className="nutrition-label">Carbs:</span>
                        <span className="nutrition-value">{parseFloat(nutrition.carbs || 0).toFixed(1)}g</span>
                      </div>
                      <div className="nutrition-item">
                        <span className="nutrition-label">Fat:</span>
                        <span className="nutrition-value">{parseFloat(nutrition.fat || 0).toFixed(1)}g</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Market Costs Summary */}
          <div className="market-costs-section">
        <h2 className="section-title">💰 Market Comparison</h2>
        <div className="market-costs-grid">
          {Object.entries(marketCosts).map(([market, cost]) => {
            const isCheapest = cheapestMarket && market === cheapestMarket[0];
            const getMarketLogo = (marketName) => {
              switch(marketName) {
                case 'A101': return '/src/assets/market_logos/a101.png';
                case 'SOK': return '/src/assets/market_logos/sok.png';
                case 'BIM': return '/src/assets/market_logos/bim.png';
                case 'MIGROS': return '/src/assets/market_logos/migros.png';
                default: return null;
              }
            };
            
            return (
              <div 
                key={market} 
                className={`market-cost-card ${isCheapest ? 'cheapest' : ''}`}
              >
                {isCheapest && <div className="cheapest-badge">✓ Best Deal</div>}
                {getMarketLogo(market) && (
                  <img 
                    src={getMarketLogo(market)} 
                    alt={market} 
                    className="market-logo-img" 
                  />
                )}
                <div className="market-name">{market}</div>
                <div className="market-cost">
                  {cost.toFixed(2)} {currency}
                </div>
              </div>
            );
          })}
        </div>
      </div>

        </div>

        {/* Right Column - Ingredients List */}
        <div className="ingredients-section">
          <h2 className="section-title">📦 Ingredients</h2>
          <div className="ingredients-list">
            {consolidatedIngredients.map((ingredient, index) => (
              <div 
                key={`${ingredient.ingredientId}-${ingredient.unit}`}
                className="ingredient-item"
                onClick={() => handleIngredientClick(ingredient.ingredientId)}
              >
                <span className="ingredient-index">{index + 1}.</span>
                <span className="ingredient-details">
                  <span className="ingredient-quantity">
                    {ingredient.quantity.toFixed(2)} {ingredient.unit}
                  </span>
                  <span className="ingredient-name">{ingredient.name}</span>
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="shopping-list-actions">
        <Link to="/meal-planner">
          <button className="back-to-planner-button">← Back to Meal Planner</button>
        </Link>
      </div>
    </div>
  );
};

export default ShoppingListPage;
