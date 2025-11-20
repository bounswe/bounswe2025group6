// src/components/meal-planner/MealPlanFilters.jsx

import React, { useState, useEffect } from 'react';
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
};

const cloneFilterPayload = (payload = MEAL_PLANNER_DEFAULT_FILTERS) => ({
  ...MEAL_PLANNER_DEFAULT_FILTERS,
  ...payload,
  mealTypes: payload?.mealTypes ? [...payload.mealTypes] : [...MEAL_PLANNER_DEFAULT_FILTERS.mealTypes],
  excludeAllergens: payload?.excludeAllergens ? [...payload.excludeAllergens] : [],
});

const MealPlanFilters = ({ onFilterChange, onApplyFilters, onClearFilters, initialFilters }) => {
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
    'Dairy', 'Egg', 'Nuts', 'Peanuts',
    'Shellfish', 'Fish', 'Wheat', 'Soy', 'Gluten'
  ];

  return (
    <div className="meal-plan-filters-sidebar">
      <div className="filters-header">
        <h2>Filters</h2>
      </div>

      <div className="filters-content">
        {/* Recipe Search */}
        <div className="filter-section">
          <label className="filter-label">Recipe Name</label>
          <input
            type="text"
            name="name"
            value={filters.name}
            onChange={handleInputChange}
            placeholder="Search..."
            className="filter-input"
          />
        </div>

        {/* Meal Types */}
        <div className="filter-section">
          <label className="filter-label">Meal Types</label>
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
                <span className="capitalize">{type}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Budget */}
        <div className="filter-section">
          <label className="filter-label">Budget (Cost/Serving)</label>
          <div className="range-inputs">
            <input
              type="number"
              name="min_cost_per_serving"
              value={filters.min_cost_per_serving}
              onChange={handleInputChange}
              placeholder="Min"
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
              placeholder="Max"
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
            <span className="filter-label">Ratings</span>
            <span className="toggle-icon">{expandedSections.ratings ? '▼' : '▶'}</span>
          </button>
          
          {expandedSections.ratings && (
            <div className="collapsible-content">
              <div className="filter-subsection">
                <label className="filter-sublabel">Difficulty (1-5)</label>
                <div className="range-inputs">
                  <input
                    type="number"
                    name="min_difficulty_rating"
                    value={filters.min_difficulty_rating}
                    onChange={handleInputChange}
                    placeholder="Min"
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
                    placeholder="Max"
                    min="0"
                    max="5"
                    step="0.1"
                    className="filter-input filter-input-small"
                  />
                </div>
              </div>

              <div className="filter-subsection">
                <label className="filter-sublabel">Taste (1-5)</label>
                <div className="range-inputs">
                  <input
                    type="number"
                    name="min_taste_rating"
                    value={filters.min_taste_rating}
                    onChange={handleInputChange}
                    placeholder="Min"
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
                    placeholder="Max"
                    min="0"
                    max="5"
                    step="0.1"
                    className="filter-input filter-input-small"
                  />
                </div>
              </div>

              <div className="filter-subsection">
                <label className="filter-sublabel">Health (1-5)</label>
                <div className="range-inputs">
                  <input
                    type="number"
                    name="min_health_rating"
                    value={filters.min_health_rating}
                    onChange={handleInputChange}
                    placeholder="Min"
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
                    placeholder="Max"
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
            <span className="filter-label">Nutrition</span>
            <span className="toggle-icon">{expandedSections.nutrition ? '▼' : '▶'}</span>
          </button>
          
          {expandedSections.nutrition && (
            <div className="collapsible-content">
              <div className="filter-subsection">
                <label className="filter-sublabel">Calories</label>
                <div className="range-inputs">
                  <input
                    type="number"
                    name="min_calories"
                    value={filters.min_calories}
                    onChange={handleInputChange}
                    placeholder="Min"
                    min="0"
                    className="filter-input filter-input-small"
                  />
                  <span className="range-separator">-</span>
                  <input
                    type="number"
                    name="max_calories"
                    value={filters.max_calories}
                    onChange={handleInputChange}
                    placeholder="Max"
                    min="0"
                    className="filter-input filter-input-small"
                  />
                </div>
              </div>

              <div className="filter-subsection">
                <label className="filter-sublabel">Protein (g)</label>
                <div className="range-inputs">
                  <input
                    type="number"
                    name="min_protein"
                    value={filters.min_protein}
                    onChange={handleInputChange}
                    placeholder="Min"
                    min="0"
                    className="filter-input filter-input-small"
                  />
                  <span className="range-separator">-</span>
                  <input
                    type="number"
                    name="max_protein"
                    value={filters.max_protein}
                    onChange={handleInputChange}
                    placeholder="Max"
                    min="0"
                    className="filter-input filter-input-small"
                  />
                </div>
              </div>

              <div className="filter-subsection">
                <label className="filter-sublabel">Carbs (g)</label>
                <div className="range-inputs">
                  <input
                    type="number"
                    name="min_carbs"
                    value={filters.min_carbs}
                    onChange={handleInputChange}
                    placeholder="Min"
                    min="0"
                    className="filter-input filter-input-small"
                  />
                  <span className="range-separator">-</span>
                  <input
                    type="number"
                    name="max_carbs"
                    value={filters.max_carbs}
                    onChange={handleInputChange}
                    placeholder="Max"
                    min="0"
                    className="filter-input filter-input-small"
                  />
                </div>
              </div>

              <div className="filter-subsection">
                <label className="filter-sublabel">Fat (g)</label>
                <div className="range-inputs">
                  <input
                    type="number"
                    name="min_fat"
                    value={filters.min_fat}
                    onChange={handleInputChange}
                    placeholder="Min"
                    min="0"
                    className="filter-input filter-input-small"
                  />
                  <span className="range-separator">-</span>
                  <input
                    type="number"
                    name="max_fat"
                    value={filters.max_fat}
                    onChange={handleInputChange}
                    placeholder="Max"
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
            <span className="filter-label">Time (minutes)</span>
            <span className="toggle-icon">{expandedSections.time ? '▼' : '▶'}</span>
          </button>
          
          {expandedSections.time && (
            <div className="collapsible-content">
              <div className="filter-subsection">
                <label className="filter-sublabel">Prep Time</label>
                <div className="range-inputs">
                  <input
                    type="number"
                    name="min_prep_time"
                    value={filters.min_prep_time}
                    onChange={handleInputChange}
                    placeholder="Min"
                    min="0"
                    className="filter-input filter-input-small"
                  />
                  <span className="range-separator">-</span>
                  <input
                    type="number"
                    name="max_prep_time"
                    value={filters.max_prep_time}
                    onChange={handleInputChange}
                    placeholder="Max"
                    min="0"
                    className="filter-input filter-input-small"
                  />
                </div>
              </div>

              <div className="filter-subsection">
                <label className="filter-sublabel">Cook Time</label>
                <div className="range-inputs">
                  <input
                    type="number"
                    name="min_cook_time"
                    value={filters.min_cook_time}
                    onChange={handleInputChange}
                    placeholder="Min"
                    min="0"
                    className="filter-input filter-input-small"
                  />
                  <span className="range-separator">-</span>
                  <input
                    type="number"
                    name="max_cook_time"
                    value={filters.max_cook_time}
                    onChange={handleInputChange}
                    placeholder="Max"
                    min="0"
                    className="filter-input filter-input-small"
                  />
                </div>
              </div>

              <div className="filter-subsection">
                <label className="filter-sublabel">Total Time</label>
                <div className="range-inputs">
                  <input
                    type="number"
                    name="min_total_time"
                    value={filters.min_total_time}
                    onChange={handleInputChange}
                    placeholder="Min"
                    min="0"
                    className="filter-input filter-input-small"
                  />
                  <span className="range-separator">-</span>
                  <input
                    type="number"
                    name="max_total_time"
                    value={filters.max_total_time}
                    onChange={handleInputChange}
                    placeholder="Max"
                    min="0"
                    className="filter-input filter-input-small"
                  />
                </div>
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
            <span className="filter-label">⚠️ Exclude Allergens</span>
            <span className="toggle-icon">{expandedSections.allergens ? '▼' : '▶'}</span>
          </button>
          
          {expandedSections.allergens && (
            <div className="collapsible-content">
              <div className="checkbox-group">
                {commonAllergens.map((allergen) => (
                  <label key={allergen} className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={(filters.excludeAllergens || []).includes(allergen)}
                      onChange={() => handleAllergenToggle(allergen)}
                    />
                    <span>{allergen}</span>
                  </label>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Boolean Options */}
        <div className="filter-section">
          <label className="filter-label">Options</label>
          <div className="checkbox-group">
            <label className="checkbox-label">
              <input
                type="checkbox"
                name="has_image"
                checked={filters.has_image}
                onChange={handleInputChange}
              />
              <span>Has Image</span>
            </label>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="filter-actions">
          <button onClick={handleApply} className="apply-filters-btn">
            Apply Filters
          </button>
          <button onClick={handleClear} className="clear-filters-btn">
            Clear All
          </button>
        </div>
      </div>
    </div>
  );
};

export default MealPlanFilters;
