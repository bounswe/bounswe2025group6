// src/components/meal-planner/MealPlanSummary.jsx

import React from 'react';
import { Link } from 'react-router-dom';
import Button from '../ui/Button';
import '../../styles/MealPlanSummary.css';
import { useCurrency } from '../../contexts/CurrencyContext';
import { useTranslation } from 'react-i18next';

const MealPlanSummary = ({ 
  mealPlan, 
  totalCost, 
  totalNutrition, 
  allergens,
  onClear,
  onGenerateShopping 
}) => {
  const { currency } = useCurrency();
  const { t } = useTranslation();
  const hasSelectedMeals = Object.values(mealPlan).some(meal => meal !== null);

  if (!hasSelectedMeals) {
    return (
      <div className="meal-plan-summary empty">
        <div className="empty-state">
          <p className="empty-message">
            {t('mealPlanSummary.emptyMessage')}
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
        <h2>{t('mealPlanSummary.headerTitle')}</h2>
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
                  <span className="meal-type-name capitalize">{t(`mealPlanSummary.mealType.${mealType}`)}</span>
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
                        <span className="meal-time">{meal.prep_time + meal.cook_time} {t('mealPlanSummary.minuteUnit')}</span>
                        <span className="meal-calories">
                          {meal.recipe_nutritions?.calories 
                            ? parseFloat(meal.recipe_nutritions.calories).toFixed(0) 
                            : (meal.calories ? parseFloat(meal.calories).toFixed(0) : '0')} {t('mealPlanSummary.calorieUnit')}
                        </span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <p className="no-meal-text">{t('mealPlanSummary.noRecipeSelected')}</p>
                )}
              </div>
            );
          })}
        </div>

        {/* Totals */}
        <div className="summary-totals">
          <div className="totals-section">
            <h3>{t('mealPlanSummary.costSummary')}</h3>
            <div className="totals-grid">
              <div className="total-item">
                <span className="total-label">{t('mealPlanSummary.totalCost')}</span>
                <span className="total-value total-cost">{totalCost.toFixed(2)} {currency}</span>
              </div>
            </div>
          </div>

          <div className="totals-section">
            <h3>{t('mealPlanSummary.nutritionSummary')}</h3>
            <div className="totals-grid">
              <div className="total-item">
                <span className="total-label">{t('mealPlanSummary.calories')}</span>
                <span className="total-value">{totalNutrition.calories.toFixed(0)}</span>
              </div>
              <div className="total-item">
                <span className="total-label">{t('mealPlanSummary.protein')}</span>
                <span className="total-value">{totalNutrition.protein.toFixed(1)}g</span>
              </div>
              <div className="total-item">
                <span className="total-label">{t('mealPlanSummary.carbs')}</span>
                <span className="total-value">{totalNutrition.carbs.toFixed(1)}g</span>
              </div>
              <div className="total-item">
                <span className="total-label">{t('mealPlanSummary.fat')}</span>
                <span className="total-value">{totalNutrition.fat.toFixed(1)}g</span>
              </div>
            </div>
          </div>

          <div className="totals-section">
            <h3>{t('mealPlanSummary.timeSummary')}</h3>
            <div className="totals-grid">
              <div className="total-item">
                <span className="total-label">{t('mealPlanSummary.totalPrep')}</span>
                <span className="total-value">{totalPrepTime} {t('mealPlanSummary.minuteUnit')}</span>
              </div>
              <div className="total-item">
                <span className="total-label">{t('mealPlanSummary.totalCook')}</span>
                <span className="total-value">{totalCookTime} {t('mealPlanSummary.minuteUnit')}</span>
              </div>
              <div className="total-item">
                <span className="total-label">{t('mealPlanSummary.totalTime')}</span>
                <span className="total-value">{totalPrepTime + totalCookTime} {t('mealPlanSummary.minuteUnit')}</span>
              </div>
            </div>
          </div>

          {/* Allergen Warning */}
          {allergens && allergens.length > 0 && (
            <div className="allergen-warning">
              <h4>{t('mealPlanSummary.allergenWarningTitle')}</h4>
              <p>{t('mealPlanSummary.allergenWarningBody')}</p>
              <div className="allergen-tags">
                {allergens.map((allergen, index) => {
                  // map common allergen names to translation keys
                  const key = (allergen || '').toString().toLowerCase();
                  let translationKey = null;
                  if (key.includes('gluten')) translationKey = 'allergenGluten';
                  else if (key.includes('milk')) translationKey = 'allergenMilk';
                  else if (key.includes('egg')) translationKey = 'allergenEgg';
                  else if (key.includes('peanut')) translationKey = 'allergenPeanut';
                  else if (key.includes('tree') || key.includes('treenut') || key.includes('tree nut') || key.includes('nut')) translationKey = 'allergenTreeNut';
                  else if (key.includes('soy')) translationKey = 'allergenSoy';
                  else if (key.includes('fish')) translationKey = 'allergenFish';
                  else if (key.includes('shellfish')) translationKey = 'allergenShellfish';
                  else if (key.includes('sesame')) translationKey = 'allergenSesame';
                  else if (key.includes('mustard')) translationKey = 'allergenMustard';
                  else if (key.includes('dairy')) translationKey = 'allergenDairy';
                  else if (key.includes('nuts')) translationKey = 'allergenNuts';
                  else if (key.includes('probiotic')) translationKey = 'allergenProbiotic';

                  const label = translationKey ? t(translationKey, { defaultValue: allergen }) : allergen;

                  return (
                    <span key={index} className="allergen-tag">
                      {label}
                    </span>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="summary-actions">
          <button onClick={onClear} className="modern-action-button danger">
            {t('mealPlanSummary.removeAll')}
          </button>
          <Link to="/shopping-list" className="link-button">
            <button onClick={onGenerateShopping} className="modern-action-button primary">
              {t('mealPlanSummary.generateShopping')}
            </button>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default MealPlanSummary;

