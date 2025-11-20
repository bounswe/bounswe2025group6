// src/components/meal-planner/MealPlanSummary.jsx

import React from 'react';
import { Link } from 'react-router-dom';
import Button from '../ui/Button';
import '../../styles/MealPlanSummary.css';
import { useCurrency } from '../../contexts/CurrencyContext';

const MealPlanSummary = ({ 
  mealPlan, 
  totalCost, 
  totalNutrition, 
  allergens,
  onClear,
  onGenerateShopping 
}) => {
  const { currency } = useCurrency();
  const hasSelectedMeals = Object.values(mealPlan).some(meal => meal !== null);

  if (!hasSelectedMeals) {
    return (
      <div className="meal-plan-summary empty">
        <div className="empty-state">
          <p className="empty-message">
            Select recipes for breakfast, lunch, or dinner to create your meal plan
          </p>
        </div>
      </div>
    );
  }

  const totalPrepTime = Object.values(mealPlan).reduce((total, meal) => {
    return total + (meal ? parseInt(meal.prep_time || 0) : 0);
  }, 0);

  const totalCookTime = Object.values(mealPlan).reduce((total, meal) => {
    return total + (meal ? parseInt(meal.cook_time || 0) : 0);
  }, 0);

  return (
    <div className="meal-plan-summary">
      <div className="summary-header">
        <h2>Your Meal Plan</h2>
      </div>

      <div className="summary-content">
        {/* Selected Meals */}
        <div className="selected-meals">
          {['breakfast', 'lunch', 'dinner'].map((mealType) => {
            const meal = mealPlan[mealType];
            return (
              <div key={mealType} className={`meal-summary-item ${meal ? 'has-meal' : 'no-meal'}`}>
                <div className="meal-type-header">
                  <span className="meal-type-icon">
                    {mealType === 'breakfast' && '🍳'}
                    {mealType === 'lunch' && '🥗'}
                    {mealType === 'dinner' && '🍽️'}
                  </span>
                  <span className="meal-type-name capitalize">{mealType}</span>
                </div>
                {meal ? (
                  <div className="meal-details">
                    <div className="meal-image-container">
                      {meal.image_full_url && (
                        <img src={meal.image_full_url} alt={meal.name} className="meal-thumbnail" />
                      )}
                    </div>
                    <div className="meal-info">
                      <h4 className="meal-name">{meal.name}</h4>
                      <div className="meal-stats">
                        <span className="meal-cost">{meal.cost_per_serving ? parseFloat(meal.cost_per_serving).toFixed(2) : '0.00'} {currency}</span>
                        <span className="meal-time">{meal.prep_time + meal.cook_time}m</span>
                        <span className="meal-calories">
                          {meal.recipe_nutritions?.calories 
                            ? parseFloat(meal.recipe_nutritions.calories).toFixed(0) 
                            : (meal.calories ? parseFloat(meal.calories).toFixed(0) : '0')} cal
                        </span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <p className="no-meal-text">No recipe selected</p>
                )}
              </div>
            );
          })}
        </div>

        {/* Totals */}
        <div className="summary-totals">
          <div className="totals-section">
            <h3>Cost Summary</h3>
            <div className="totals-grid">
              <div className="total-item">
                <span className="total-label">Total Cost:</span>
                <span className="total-value total-cost">{totalCost.toFixed(2)} {currency}</span>
              </div>
            </div>
          </div>

          <div className="totals-section">
            <h3>Nutrition Summary</h3>
            <div className="totals-grid">
              <div className="total-item">
                <span className="total-label">Calories:</span>
                <span className="total-value">{totalNutrition.calories.toFixed(0)}</span>
              </div>
              <div className="total-item">
                <span className="total-label">Protein:</span>
                <span className="total-value">{totalNutrition.protein.toFixed(1)}g</span>
              </div>
              <div className="total-item">
                <span className="total-label">Carbs:</span>
                <span className="total-value">{totalNutrition.carbs.toFixed(1)}g</span>
              </div>
              <div className="total-item">
                <span className="total-label">Fat:</span>
                <span className="total-value">{totalNutrition.fat.toFixed(1)}g</span>
              </div>
            </div>
          </div>

          <div className="totals-section">
            <h3>Time Summary</h3>
            <div className="totals-grid">
              <div className="total-item">
                <span className="total-label">Total Prep:</span>
                <span className="total-value">{totalPrepTime}m</span>
              </div>
              <div className="total-item">
                <span className="total-label">Total Cook:</span>
                <span className="total-value">{totalCookTime}m</span>
              </div>
              <div className="total-item">
                <span className="total-label">Total Time:</span>
                <span className="total-value">{totalPrepTime + totalCookTime}m</span>
              </div>
            </div>
          </div>

          {/* Allergen Warning */}
          {allergens && allergens.length > 0 && (
            <div className="allergen-warning">
              <h4>⚠️ Allergen Warning</h4>
              <p>This meal plan contains:</p>
              <div className="allergen-tags">
                {allergens.map((allergen, index) => (
                  <span key={index} className="allergen-tag">
                    {allergen}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="summary-actions">
          <button onClick={onClear} className="modern-action-button danger">
            🗑️ Remove All Recipes
          </button>
          <Link to="/shopping-list" className="link-button">
            <button onClick={onGenerateShopping} className="modern-action-button primary">
              🛒 Generate Shopping List
            </button>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default MealPlanSummary;

