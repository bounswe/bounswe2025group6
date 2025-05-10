// src/components/recipe/IngredientList.jsx

import React from 'react';
import '../../styles/IngredientList.css';

const IngredientList = ({ 
  ingredients, 
  editable = false,
  onAdd,
  onUpdate,
  onDelete
}) => {
  const handleNameChange = (index, value) => {
    if (onUpdate) onUpdate(index, { name: value });
  };

  const handleQuantityChange = (index, value) => {
    if (onUpdate) onUpdate(index, { quantity: value });
  };

  const handleDelete = (index) => {
    if (onDelete) onDelete(index);
  };

  const handleAddIngredient = () => {
    if (onAdd) onAdd({ name: '', quantity: '' });
  };

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

  return (
    <div className="ingredient-editable">
      {ingredients.map((ingredient, index) => (
        <div key={index} className="ingredient-row">
          <input
            type="text"
            value={ingredient.name}
            onChange={(e) => handleNameChange(index, e.target.value)}
            placeholder="Name"
            className="ingredient-input"
          />
          <input
            type="text"
            value={ingredient.quantity}
            onChange={(e) => handleQuantityChange(index, e.target.value)}
            placeholder="Qty"
            className="ingredient-input"
          />
          <button
            type="button"
            onClick={() => handleDelete(index)}
            className="ingredient-delete"
          >
            ✕
          </button>
        </div>
      ))}

      <button
        type="button"
        onClick={handleAddIngredient}
        className="ingredient-add"
      >
        + Add Ingredient
      </button>
    </div>
  );
};


export default IngredientList;

