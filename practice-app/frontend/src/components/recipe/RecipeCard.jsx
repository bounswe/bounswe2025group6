// src/components/recipe/RecipeCard.jsx

import React from 'react';
import { useNavigate } from 'react-router-dom';
import Button from '../ui/Button';
import '../../styles/RecipeCard.css';

const RecipeCard = ({ recipe }) => {
  const navigate = useNavigate();

  const handleClick = () => {
    navigate(`/recipes/${recipe.id}`);
  };

  return (
    <div className="recipe-card" onClick={handleClick}>
      <img
        src={recipe.image || '/placeholder.jpg'}
        alt={recipe.title}
        className="recipe-card-image"
      />
      <div className="recipe-card-body">
        <h3 className="recipe-card-title">{recipe.title}</h3>
        <p className="recipe-card-description line-clamp-2">
          {recipe.description || 'No description provided.'}
        </p>

        <div className="recipe-card-meta">
          <span className="meta-item">₺{recipe.cost}</span>
          <span className="meta-separator">•</span>
          <span className="meta-item">{recipe.prepTime} min</span>
        </div>

        {recipe.tags && recipe.tags.length > 0 && (
          <div className="recipe-card-tags">
            {recipe.tags.slice(0, 3).map((tag, index) => (
              <span key={index} className="recipe-card-tag">
                {tag}
              </span>
            ))}
          </div>
        )}

        <div className="recipe-card-actions">
          <Button size="sm" variant="secondary" onClick={(e) => {
            e.stopPropagation();
            handleClick();
          }}>
            View Details
          </Button>
        </div>
      </div>
    </div>
  );
};

export default RecipeCard;