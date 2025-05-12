// src/components/recipe/RecipeCard.jsx

import React from 'react';
import { useNavigate } from 'react-router-dom';
import Button from '../ui/Button';
import { getRecipeById } from '../../services/recipeService';
import '../../styles/RecipeCard.css';

const RecipeCard = ({ recipe }) => {
  const navigate = useNavigate();

  const handleClick = () => {
    navigate(`/recipes/${recipe.id}`);
  };


  return (
    <div className="recipe-card" onClick={handleClick}>
      <div className='recipe-card-image' style={{
				backgroundImage:
					'url("https://images.unsplash.com/photo-1484723091739-30a097e8f929?q=80&w=1547&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D")'
			}}></div>
      <div className='recipe-card-content'>
        <h2>{recipe.name}</h2>
        <div className='recipe-card-content-info'>
          <span><strong>Meal Type:</strong> {recipe.meal_type || 'No type provided.'}</span>
          <span><strong>Cost:</strong> {recipe.cost_per_serving}$</span>
          <span><strong>Prep Time:</strong> {recipe.prep_time}mins</span>
          <span><strong>Cook Time:</strong> {recipe.cook_time}mins</span>
        </div>
        <div className='recipe-card-content-dietary'>

        </div>
        
      </div>
    
    </div>

  );
};

export default RecipeCard;