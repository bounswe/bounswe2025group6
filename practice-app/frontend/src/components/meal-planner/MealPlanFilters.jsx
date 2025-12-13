// src/components/meal-planner/MealPlanFilters.jsx

import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import '../../styles/MealPlanFilters.css';

export const MEAL_PLANNER_DEFAULT_FILTERS = {
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
  dietInfo: [],
};

const cloneFilterPayload = (payload = MEAL_PLANNER_DEFAULT_FILTERS) => ({
  ...MEAL_PLANNER_DEFAULT_FILTERS,
  ...payload,
  mealTypes: payload?.mealTypes ? [...payload.mealTypes] : [...MEAL_PLANNER_DEFAULT_FILTERS.mealTypes],
  excludeAllergens: payload?.excludeAllergens ? [...payload.excludeAllergens] : [],
  dietInfo: payload?.dietInfo ? [...payload.dietInfo] : [],
});

const MealPlanFilters = ({ onFilterChange, onApplyFilters, onClearFilters, initialFilters }) => {
  const { t } = useTranslation();
  
  // Normalize allergen tokens to better match locale keys
  // SQL allergens: dairy, egg, fish, gluten, nuts, probiotic
  const normalizeAllergenToken = (allergen) => {
    if (!allergen || typeof allergen !== 'string') return allergen;
    const s = allergen.toLowerCase().trim();
    if (s === 'nuts' || s === 'nut') return 'Nuts';
    if (s === 'dairy' || s === 'milk') return 'Dairy';
    if (s === 'egg' || s === 'eggs') return 'Egg';
    if (s === 'fish') return 'Fish';
    if (s === 'gluten' || s === 'wheat') return 'Gluten';
    if (s === 'probiotic') return 'Probiotic';
    // keep common casing for others
    return allergen;
  };

  const sanitizeKey = (str) => {
    if (!str || typeof str !== 'string') return '';
    const parts = String(str).split(/[^a-zA-Z0-9]+/).filter(Boolean);
    return parts.map(p => p.charAt(0).toUpperCase() + p.slice(1)).join('');
  };
  const [filters, setFilters] = useState(() => cloneFilterPayload(initialFilters));
  const [isFirstMount, setIsFirstMount] = useState(true);

  // Parent'tan gelen initialFilters değiştiğinde local state'i güncelle
  // Ama sadece first mount'tan sonra (infinite loop'u önlemek için)
  useEffect(() => {
    if (isFirstMount) {
      setIsFirstMount(false);
      return;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isFirstMount]);

  // Sync with parent filters when they change externally (e.g., clear all)
  useEffect(() => {
    if (!isFirstMount && initialFilters) {
      const filtersString = JSON.stringify(filters);
      const initialFiltersString = JSON.stringify(initialFilters);
      if (filtersString !== initialFiltersString) {
        setFilters(cloneFilterPayload(initialFilters));
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialFilters, isFirstMount]);

  // Collapsible section states
  const [expandedSections, setExpandedSections] = useState({
    ratings: false,
    nutrition: false,
    time: false,
    allergens: false,
    dietary: false,
  });

  const toggleSection = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    const newFilters = {
      ...filters,
      [name]: type === 'checkbox' ? checked : value,
    };
    
    const payload = cloneFilterPayload(newFilters);
    setFilters(payload);
    onFilterChange(payload);
  };

  const handleMealTypeToggle = (mealType) => {
    const newMealTypes = filters.mealTypes.includes(mealType)
      ? filters.mealTypes.filter((t) => t !== mealType)
      : [...filters.mealTypes, mealType];
    
    const newFilters = {
      ...filters,
      mealTypes: newMealTypes,
    };
    
    const payload = cloneFilterPayload(newFilters);
    setFilters(payload);
    onFilterChange(payload);
  };

  const handleAllergenToggle = (allergen) => {
    const currentAllergens = filters.excludeAllergens || [];
    const newAllergens = currentAllergens.includes(allergen)
      ? currentAllergens.filter((a) => a !== allergen)
      : [...currentAllergens, allergen];
    
    const newFilters = {
      ...filters,
      excludeAllergens: newAllergens,
    };
    
    const payload = cloneFilterPayload(newFilters);
    setFilters(payload);
    onFilterChange(payload);
  };

  const handleDietInfoToggle = (dietInfo) => {
    const currentDietInfo = filters.dietInfo || [];
    const newDietInfo = currentDietInfo.includes(dietInfo)
      ? currentDietInfo.filter((d) => d !== dietInfo)
      : [...currentDietInfo, dietInfo];
    
    const newFilters = {
      ...filters,
      dietInfo: newDietInfo,
    };
    
    const payload = cloneFilterPayload(newFilters);
    setFilters(payload);
    onFilterChange(payload);
  };

  const handleApply = () => {
    onApplyFilters(cloneFilterPayload(filters));
  };

  const handleClear = () => {
    const clearedFilters = cloneFilterPayload(MEAL_PLANNER_DEFAULT_FILTERS);
    
    setFilters(clearedFilters);
    onFilterChange(clearedFilters);
    onClearFilters();
  };

  const commonAllergens = [
    'Dairy', 'Egg', 'Nuts', 'Fish', 'Gluten', 'Probiotic'
  ];

  const commonDietInfo = [
    'vegan', 'gluten-free', 'high-protein', 'low-carb', 
    'whole-grain', 'keto-friendly', 'healthy-fat', 'soy-based', 
    'lean-protein', 'omega-3', 'high-fiber', 'potassium-rich'
  ];

  return (
    <div className="meal-plan-filters-sidebar">
      <div className="filters-header">
        <h2>{t('filtersHeader')}</h2>
      </div>

      <div className="filters-content">
        {/* Recipe Search */}
        <div className="filter-section">
          <label className="filter-label">{t('filtersRecipeName')}</label>
          <input
            type="text"
            name="name"
            value={filters.name}
            onChange={handleInputChange}
            placeholder={t('filtersSearchPlaceholder')}
            className="filter-input"
          />
        </div>

        {/* Meal Types */}
        <div className="filter-section">
          <label className="filter-label">{t('filtersMealTypes')}</label>
          <div className="meal-type-buttons">
            {['breakfast', 'lunch', 'dinner'].map((type) => (
              <button
                key={type}
                type="button"
                className={`meal-type-button ${filters.mealTypes.includes(type) ? 'selected' : ''}`}
                onClick={() => handleMealTypeToggle(type)}
              >
                <span className="meal-type-icon">
                  {type === 'breakfast' && '🍳'}
                  {type === 'lunch' && '🥗'}
                  {type === 'dinner' && '🍽️'}
                </span>
                <span className="capitalize">{t(`mealType${type.charAt(0).toUpperCase() + type.slice(1)}`)}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Budget */}
        <div className="filter-section">
          <label className="filter-label">{t('filtersBudget')}</label>
          <div className="range-inputs">
            <input
              type="number"
              name="min_cost_per_serving"
              value={filters.min_cost_per_serving}
              onChange={handleInputChange}
              placeholder={t('filtersMin')}
              min="0"
              step="0.01"
              className="filter-input filter-input-small"
            />
            <span className="range-separator">-</span>
            <input
              type="number"
              name="max_cost_per_serving"
              value={filters.max_cost_per_serving}
              onChange={handleInputChange}
              placeholder={t('filtersMax')}
              min="0"
              step="0.01"
              className="filter-input filter-input-small"
            />
          </div>
        </div>

        {/* Ratings - Collapsible */}
        <div className="filter-section collapsible-section">
          <button 
            className="filter-section-toggle"
            onClick={() => toggleSection('ratings')}
          >
            <span className="filter-label">{t('filtersRatings')}</span>
            <span className="toggle-icon">{expandedSections.ratings ? '▼' : '▶'}</span>
          </button>
          
          {expandedSections.ratings && (
            <div className="collapsible-content">
              <div className="filter-subsection">
                <label className="filter-sublabel">{t('filtersDifficulty')}</label>
                <div className="range-inputs">
                  <input
                    type="number"
                    name="min_difficulty_rating"
                    value={filters.min_difficulty_rating}
                    onChange={handleInputChange}
                    placeholder={t('filtersMin')}
                    min="0"
                    max="5"
                    step="0.1"
                    className="filter-input filter-input-small"
                  />
                  <span className="range-separator">-</span>
                  <input
                    type="number"
                    name="max_difficulty_rating"
                    value={filters.max_difficulty_rating}
                    onChange={handleInputChange}
                    placeholder={t('filtersMax')}
                    min="0"
                    max="5"
                    step="0.1"
                    className="filter-input filter-input-small"
                  />
                </div>
              </div>

              <div className="filter-subsection">
                <label className="filter-sublabel">{t('filtersTaste')}</label>
                <div className="range-inputs">
                  <input
                    type="number"
                    name="min_taste_rating"
                    value={filters.min_taste_rating}
                    onChange={handleInputChange}
                    placeholder={t('filtersMin')}
                    min="0"
                    max="5"
                    step="0.1"
                    className="filter-input filter-input-small"
                  />
                  <span className="range-separator">-</span>
                  <input
                    type="number"
                    name="max_taste_rating"
                    value={filters.max_taste_rating}
                    onChange={handleInputChange}
                    placeholder={t('filtersMax')}
                    min="0"
                    max="5"
                    step="0.1"
                    className="filter-input filter-input-small"
                  />
                </div>
              </div>

              <div className="filter-subsection">
                <label className="filter-sublabel">{t('filtersHealth')}</label>
                <div className="range-inputs">
                  <input
                    type="number"
                    name="min_health_rating"
                    value={filters.min_health_rating}
                    onChange={handleInputChange}
                    placeholder={t('filtersMin')}
                    min="0"
                    max="5"
                    step="0.1"
                    className="filter-input filter-input-small"
                  />
                  <span className="range-separator">-</span>
                  <input
                    type="number"
                    name="max_health_rating"
                    value={filters.max_health_rating}
                    onChange={handleInputChange}
                    placeholder={t('filtersMax')}
                    min="0"
                    max="5"
                    step="0.1"
                    className="filter-input filter-input-small"
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Nutrition - Collapsible */}
        <div className="filter-section collapsible-section">
          <button 
            className="filter-section-toggle"
            onClick={() => toggleSection('nutrition')}
          >
            <span className="filter-label">{t('filtersNutrition')}</span>
            <span className="toggle-icon">{expandedSections.nutrition ? '▼' : '▶'}</span>
          </button>
          
          {expandedSections.nutrition && (
            <div className="collapsible-content">
              <div className="filter-subsection">
                <label className="filter-sublabel">{t('filtersCalories')}</label>
                <div className="range-inputs">
                  <input
                    type="number"
                    name="min_calories"
                    value={filters.min_calories}
                    onChange={handleInputChange}
                    placeholder={t('filtersMin')}
                    min="0"
                    className="filter-input filter-input-small"
                  />
                  <span className="range-separator">-</span>
                  <input
                    type="number"
                    name="max_calories"
                    value={filters.max_calories}
                    onChange={handleInputChange}
                    placeholder={t('filtersMax')}
                    min="0"
                    className="filter-input filter-input-small"
                  />
                </div>
              </div>

              <div className="filter-subsection">
                <label className="filter-sublabel">{t('filtersProtein')}</label>
                <div className="range-inputs">
                  <input
                    type="number"
                    name="min_protein"
                    value={filters.min_protein}
                    onChange={handleInputChange}
                    placeholder={t('filtersMin')}
                    min="0"
                    className="filter-input filter-input-small"
                  />
                  <span className="range-separator">-</span>
                  <input
                    type="number"
                    name="max_protein"
                    value={filters.max_protein}
                    onChange={handleInputChange}
                    placeholder={t('filtersMax')}
                    min="0"
                    className="filter-input filter-input-small"
                  />
                </div>
              </div>

              <div className="filter-subsection">
                <label className="filter-sublabel">{t('filtersCarbs')}</label>
                <div className="range-inputs">
                  <input
                    type="number"
                    name="min_carbs"
                    value={filters.min_carbs}
                    onChange={handleInputChange}
                    placeholder={t('filtersMin')}
                    min="0"
                    className="filter-input filter-input-small"
                  />
                  <span className="range-separator">-</span>
                  <input
                    type="number"
                    name="max_carbs"
                    value={filters.max_carbs}
                    onChange={handleInputChange}
                    placeholder={t('filtersMax')}
                    min="0"
                    className="filter-input filter-input-small"
                  />
                </div>
              </div>

              <div className="filter-subsection">
                <label className="filter-sublabel">{t('filtersFat')}</label>
                <div className="range-inputs">
                  <input
                    type="number"
                    name="min_fat"
                    value={filters.min_fat}
                    onChange={handleInputChange}
                    placeholder={t('filtersMin')}
                    min="0"
                    className="filter-input filter-input-small"
                  />
                  <span className="range-separator">-</span>
                  <input
                    type="number"
                    name="max_fat"
                    value={filters.max_fat}
                    onChange={handleInputChange}
                    placeholder={t('filtersMax')}
                    min="0"
                    className="filter-input filter-input-small"
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Time - Collapsible */}
        <div className="filter-section collapsible-section">
          <button 
            className="filter-section-toggle"
            onClick={() => toggleSection('time')}
          >
            <span className="filter-label">{t('filtersTime')}</span>
            <span className="toggle-icon">{expandedSections.time ? '▼' : '▶'}</span>
          </button>
          
          {expandedSections.time && (
            <div className="collapsible-content">
              <div className="filter-subsection">
                <label className="filter-sublabel">{t('filtersPrepTime')}</label>
                <div className="range-inputs">
                  <input
                    type="number"
                    name="min_prep_time"
                    value={filters.min_prep_time}
                    onChange={handleInputChange}
                    placeholder={t('filtersMin')}
                    min="0"
                    className="filter-input filter-input-small"
                  />
                  <span className="range-separator">-</span>
                  <input
                    type="number"
                    name="max_prep_time"
                    value={filters.max_prep_time}
                    onChange={handleInputChange}
                    placeholder={t('filtersMax')}
                    min="0"
                    className="filter-input filter-input-small"
                  />
                </div>
              </div>

              <div className="filter-subsection">
                <label className="filter-sublabel">{t('filtersCookTime')}</label>
                <div className="range-inputs">
                  <input
                    type="number"
                    name="min_cook_time"
                    value={filters.min_cook_time}
                    onChange={handleInputChange}
                    placeholder={t('filtersMin')}
                    min="0"
                    className="filter-input filter-input-small"
                  />
                  <span className="range-separator">-</span>
                  <input
                    type="number"
                    name="max_cook_time"
                    value={filters.max_cook_time}
                    onChange={handleInputChange}
                    placeholder={t('filtersMax')}
                    min="0"
                    className="filter-input filter-input-small"
                  />
                </div>
              </div>

              <div className="filter-subsection">
                <label className="filter-sublabel">{t('filtersTotalTime')}</label>
                <div className="range-inputs">
                  <input
                    type="number"
                    name="min_total_time"
                    value={filters.min_total_time}
                    onChange={handleInputChange}
                    placeholder={t('filtersMin')}
                    min="0"
                    className="filter-input filter-input-small"
                  />
                  <span className="range-separator">-</span>
                  <input
                    type="number"
                    name="max_total_time"
                    value={filters.max_total_time}
                    onChange={handleInputChange}
                    placeholder={t('filtersMax')}
                    min="0"
                    className="filter-input filter-input-small"
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Dietary Info - Collapsible */}
        <div className="filter-section collapsible-section dietary-section">
          <button 
            className="filter-section-toggle"
            onClick={() => toggleSection('dietary')}
          >
            <span className="filter-label">{t('filtersDietaryInfo')}</span>
            <span className="toggle-icon">{expandedSections.dietary ? '▼' : '▶'}</span>
          </button>
          
          {expandedSections.dietary && (
            <div className="collapsible-content">
              <div className="checkbox-group">
                {commonDietInfo.map((dietInfo) => {
                  const labelKey = `dietaryInfo${sanitizeKey(dietInfo)}`;
                  return (
                    <label key={dietInfo} className="checkbox-label">
                      <input
                        type="checkbox"
                        checked={(filters.dietInfo || []).includes(dietInfo)}
                        onChange={() => handleDietInfoToggle(dietInfo)}
                      />
                      <span>{t(labelKey, { defaultValue: dietInfo })}</span>
                    </label>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Allergens - Collapsible */}
        <div className="filter-section collapsible-section allergen-section">
          <button 
            className="filter-section-toggle"
            onClick={() => toggleSection('allergens')}
          >
            <span className="filter-label">{t('filtersExcludeAllergens')}</span>
            <span className="toggle-icon">{expandedSections.allergens ? '▼' : '▶'}</span>
          </button>
          
          {expandedSections.allergens && (
            <div className="collapsible-content">
              <div className="checkbox-group">
                {commonAllergens.map((allergen) => {
                  const normalized = normalizeAllergenToken(allergen);
                  const labelKey = `allergen${sanitizeKey(normalized)}`;
                  return (
                    <label key={allergen} className="checkbox-label">
                      <input
                        type="checkbox"
                        checked={(filters.excludeAllergens || []).includes(allergen)}
                        onChange={() => handleAllergenToggle(allergen)}
                      />
                      <span>{t(labelKey, { defaultValue: allergen })}</span>
                    </label>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Boolean Options */}
        <div className="filter-section">
          <label className="filter-label">{t('filtersOptions')}</label>
          <div className="checkbox-group">
            <label className="checkbox-label">
              <input
                type="checkbox"
                name="has_image"
                checked={filters.has_image}
                onChange={handleInputChange}
              />
              <span>{t('filtersHasImage')}</span>
            </label>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="filter-actions">
          <button onClick={handleApply} className="apply-filters-btn">
            {t('filtersApplyButton')}
          </button>
          <button onClick={handleClear} className="clear-filters-btn">
            {t('filtersClearButton')}
          </button>
        </div>
      </div>
    </div>
  );
};

export default MealPlanFilters;
