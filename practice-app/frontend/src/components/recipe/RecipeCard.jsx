// src/components/recipe/RecipeCard.jsx

import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import Button from '../ui/Button';
import Badge from '../ui/Badge';
import { getRecipeById, getWikidataImage } from '../../services/recipeService';
import userService from '../../services/userService';
import { useCurrency } from '../../contexts/CurrencyContext';
import '../../styles/RecipeCard.css';

const RecipeCard = ({ recipe, creatorName: propCreatorName, creatorBadge: propCreatorBadge, creatorUsertype: propCreatorUsertype }) => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { currency } = useCurrency();
  const [recipeImage, setRecipeImage] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [creatorName, setCreatorName] = useState('');
  const [creatorBadge, setCreatorBadge] = useState(null);
  const [creatorUsertype, setCreatorUsertype] = useState(null);
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
        
        // First check if recipe has an uploaded image
        if (recipe.image_full_url) {
          setRecipeImage(recipe.image_full_url);
          return;
        }
        
        // If no uploaded image, try to get from Wikidata
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
  }, [recipe.name, recipe.image_full_url, isVisible, isLoading, recipeImage]);
  
  // Fetch creator's username and role (only if not provided as props)
  useEffect(() => {
    // If creator data is provided as props, use it and skip fetching
    if (propCreatorName !== undefined) {
      setCreatorName(propCreatorName || 'Unknown');
      setCreatorUsertype(propCreatorUsertype || null);
      setCreatorBadge(propCreatorBadge || null);
      return;
    }
    
    // Otherwise, fetch creator data
    let isMounted = true;
    
    const fetchCreatorData = async () => {
      if (recipe.creator_id) {
        try {
          const userData = await userService.getUserById(recipe.creator_id);
          if (isMounted) {
            setCreatorName(userData.username || 'Unknown');
            setCreatorUsertype(userData.usertype || null);
            // Set badge from typeOfCook
            setCreatorBadge(userData.typeOfCook || null);
          }
        } catch (error) {
          if (isMounted) {
            console.error('Error fetching creator data:', error);
            setCreatorName('Unknown');
          }
        }
      }
    };
    
    fetchCreatorData();
    
    return () => {
      isMounted = false;
    };
  }, [recipe.creator_id, propCreatorName, propCreatorBadge, propCreatorUsertype]);

  const handleClick = () => {
    // Save current location state before navigating
    const currentPath = window.location.pathname + window.location.search;
    localStorage.setItem('returnToMealPlanner', currentPath);
    navigate(`/recipes/${recipe.id}`);
  };

  // Calculate dynamic font size based on recipe name length
  const getFontSize = (name) => {
    const nameLength = name.length;
    if (nameLength > 40) {
      return '0.85rem';
    } else if (nameLength > 35) {
      return '0.9rem';
    } else if (nameLength > 30) {
      return '0.95rem';
    } else if (nameLength > 25) {
      return '1rem';
    } else if (nameLength > 20) {
      return '1.1rem';
    } else if (nameLength > 15) {
      return '1.2rem';
    } else {
      return '1.3rem';
    }
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
          <h2 style={{ fontSize: getFontSize(recipe.name || '') }}>{recipe.name}</h2>          <div className='recipe-card-content-info'>
            <div className="recipe-card-top-row">
              <span className="meal-type">
                {recipe.meal_type ? t(`mealType${recipe.meal_type.charAt(0).toUpperCase() + recipe.meal_type.slice(1)}`) : 'No type'}
              </span>
              <span className="cost-with-logo">
                {recipe.cost_per_serving ? parseFloat(recipe.cost_per_serving).toFixed(2) : '0.00'} {currency}
                {(() => {
                  if (recipe.recipe_costs && Object.keys(recipe.recipe_costs).length > 0) {
                    const minCost = Math.min(...Object.values(recipe.recipe_costs));
                    const cheapestMarket = Object.entries(recipe.recipe_costs).find(([_, cost]) => cost === minCost)?.[0];
                    
                    const getMarketLogo = (marketName) => {
                      switch(marketName) {
                        case 'A101': return '/src/assets/market_logos/a101.png';
                        case 'SOK': return '/src/assets/market_logos/sok.png';
                        case 'BIM': return '/src/assets/market_logos/bim.png';
                        case 'MIGROS': return '/src/assets/market_logos/migros.png';
                        default: return null;
                      }
                    };
                    
                    return cheapestMarket ? (
                      <img 
                        src={getMarketLogo(cheapestMarket)} 
                        alt={cheapestMarket} 
                        className="cheapest-market-logo" 
                      />
                    ) : null;
                  }
                  return null;
                })()}
              </span>
            </div>
            <div className="recipe-card-bottom-row">
              <span className="time-info">{recipe.prep_time}{t("minutes")} {t("recipeCardPrepTime")} • {recipe.cook_time}{t("minutes")} {t("recipeCardCookTime")}</span>
              <span className="creator-info">
                {t("recipeCardBy")} {creatorName || 'Loading...'}
                <Badge badge={creatorBadge} size="small" usertype={creatorUsertype} />
              </span>
            </div>
          </div>
          <div className='recipe-card-content-dietary'>

          </div>
          
        </div>
    
    </div>

  );
};

export default RecipeCard;