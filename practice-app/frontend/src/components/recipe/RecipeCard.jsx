// src/components/recipe/RecipeCard.jsx

import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import Button from '../ui/Button';
import { getRecipeById, getWikidataImage } from '../../services/recipeService';
import { getUsername } from '../../services/userService';
import '../../styles/RecipeCard.css';

const RecipeCard = ({ recipe }) => {
  const navigate = useNavigate();
  const [recipeImage, setRecipeImage] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [creatorName, setCreatorName] = useState('');
  const cardRef = useRef(null);

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
  // Only load image when card becomes visible
  useEffect(() => {
    const loadImage = async () => {
      if (!isVisible || isLoading || recipeImage) return;
      
      try {
        setIsLoading(true);
        if (recipe.name) {
          const imageUrl = await getWikidataImage(recipe.name);
          if (imageUrl) {
            setRecipeImage(imageUrl);
          }
        }
      } catch (error) {
        console.error('Error fetching recipe image:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadImage();
  }, [recipe.name, isVisible, isLoading, recipeImage]);
  
  // Fetch creator's username
  useEffect(() => {
    const fetchCreatorName = async () => {
      if (recipe.creator_id) {
        const name = await getUsername(recipe.creator_id);
        setCreatorName(name);
      }
    };
    
    fetchCreatorName();
  }, [recipe.creator_id]);

  const handleClick = () => {
    navigate(`/recipes/${recipe.id}`);
  };
  return (
    <div className="recipe-card" onClick={handleClick} ref={cardRef}>
      <div className='recipe-card-image' style={{
				backgroundImage: recipeImage 
          ? `url("${recipeImage}")` 
          : 'url("https://images.unsplash.com/photo-1484723091739-30a097e8f929?q=80&w=1547&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D")'
			}}>
        {isLoading && (
          <div className="image-loader">
            <div className="loader-spinner"></div>
          </div>
        )}
      </div>        <div className='recipe-card-content'>
          <h2>{recipe.name}</h2>          <div className='recipe-card-content-info'>
            <span><strong>Meal Type:</strong> {recipe.meal_type || 'No type provided.'}</span>
            <span><strong>Cost:</strong> {recipe.cost_per_serving}$</span>
            <span><strong>Prep Time:</strong> {recipe.prep_time}mins</span>
            <span><strong>Cook Time:</strong> {recipe.cook_time}mins</span>
            <span><strong>Created by:</strong> {creatorName || 'Loading...'}</span>
          </div>
          <div className='recipe-card-content-dietary'>

          </div>
          
        </div>
    
    </div>

  );
};

export default RecipeCard;