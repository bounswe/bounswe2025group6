// src/components/recipe/IngredientList.jsx

import React, { useState } from 'react';
import '../../styles/IngredientList.css';

const IngredientList = ({ 
  ingredients = [], // Provide default empty array
  editable = false,
  onAdd,
  onUpdate,
  onDelete,
  selectedIngredients = [], // Provide default empty array
  onAddIngredient,
  onRemoveIngredient
}) => {
  const [searchQuery, setSearchQuery] = useState('');

  const unitOptions = ['pcs', 'cup', 'tbsp', 'tsp', 'g', 'kg', 'ml', 'l'];

  // Handle ingredient selection
  const handleIngredientSelect = (ingredient) => {
    if (!onAddIngredient) return;
    
    // Check if ingredient is already selected
    const isSelected = selectedIngredients.some(
      selected => selected.id === ingredient.id
    );
    
    if (!isSelected) {
      onAddIngredient(ingredient);
    }
  };

  // Render selected ingredients
  const renderSelectedIngredients = () => {
    if (!selectedIngredients?.length) return null;

    return (
      <div className="selected-ingredients">
        {selectedIngredients.map(ingredient => (
          <div key={ingredient.id} className="ingredient-item">
            {ingredient.name}
            <button 
              onClick={() => onRemoveIngredient?.(ingredient.id)}
              className="remove-btn"
            >
              Remove
            </button>
          </div>
        ))}
      </div>
    );
  };

  // Non-editable view
  if (!editable) {
    return (
      <ul className="ingredient-list">
        {ingredients.map((ingredient, index) => (
          <li key={index} className="ingredient-item">
            <span className="bullet">•</span>
            <span className="quantity">{ingredient.quantity}</span>
            <span className="separator">-</span>
            <span className="name">{ingredient.name}</span>
          </li>
        ))}
      </ul>
    );
  }

  // Editable view with controlled inputs
  return (
    <div className="ingredient-list">
      {renderSelectedIngredients()}
      {ingredients.map((ingredient, index) => (
        <div key={ingredient.id || index} className="ingredient-row">
          <span className="ingredient-name">{ingredient.name}</span>
          <input
            type="number"
            value={ingredient.quantity || ''} // Add default empty string
            onChange={(e) => onUpdate?.(index, { 
              ...ingredient,
              quantity: e.target.value 
            })}
            placeholder="Qty"
            className="ingredient-input quantity"
          />
          <select
            value={ingredient.unit || 'pcs'}
            onChange={(e) => onUpdate?.(index, { 
              ...ingredient,
              unit: e.target.value 
            })}
            className="ingredient-input unit"
          >
            {unitOptions.map(unit => (
              <option key={unit} value={unit}>{unit}</option>
            ))}
          </select>
          <button
            type="button"
            onClick={() => onDelete?.(index)}
            className="ingredient-delete"
          >
            ×
          </button>
        </div>
      ))}
    </div>
  );
};

export default IngredientList;

