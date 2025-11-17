import React, { useState, useEffect, useRef } from 'react';
import Button from '../../components/ui/Button';
import { getWikidataImage } from '../../services/recipeService';
import { getUsername } from '../../services/userService';
import { useCurrency } from '../../contexts/CurrencyContext';
import '../../styles/MealPlanRecipeCard.css';

const MealPlanRecipeCard = ({ recipe, isSelected, onSelect, onViewDetails }) => {
  const { currency } = useCurrency();
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

  // Load image when card becomes visible
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

  // Get market logo for cheapest market
  const getMarketLogo = (marketName) => {
    switch(marketName) {
      case 'A101': return '/src/assets/market_logos/a101.png';
      case 'SOK': return '/src/assets/market_logos/sok.png';
      case 'BIM': return '/src/assets/market_logos/bim.png';
      case 'MIGROS': return '/src/assets/market_logos/migros.png';
      default: return null;
    }
  };

  // Get cheapest market info
  const getCheapestMarketInfo = () => {
    if (recipe.recipe_costs && Object.keys(recipe.recipe_costs).length > 0) {
      const minCost = Math.min(...Object.values(recipe.recipe_costs));
      const cheapestMarket = Object.entries(recipe.recipe_costs).find(([_, cost]) => cost === minCost)?.[0];
      return { market: cheapestMarket, cost: minCost };
    }
    return null;
  };

  const cheapestMarketInfo = getCheapestMarketInfo();

  return (
    <div 
      className={`meal-plan-recipe-card ${isSelected ? 'selected' : ''}`}
      ref={cardRef}
      onClick={(e) => e.preventDefault()} // Prevent any default click behavior
    >
      {/* Recipe Image */}
      <div 
        className="meal-plan-recipe-card-image" 
        style={{
          backgroundImage: recipeImage 
            ? `url("${recipeImage}")` 
            : 'url("https://images.unsplash.com/photo-1484723091739-30a097e8f929?q=80&w=1547&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D")'
        }}
      >
        {isLoading && (
          <div className="meal-plan-image-loader">
            <div className="meal-plan-loader-spinner"></div>
          </div>
        )}
        
        {/* Selection Indicator */}
        {isSelected && (
          <div className="selection-indicator">
            <div className="selection-checkmark">✓</div>
          </div>
        )}

        {/* Meal Type Badge */}
        <div className="meal-type-badge">
          {recipe.meal_type || 'No type'}
        </div>
      </div>

      {/* Recipe Content */}
      <div className="meal-plan-recipe-card-content">
        <h3 className="meal-plan-recipe-title">{recipe.name}</h3>
        
        {/* Recipe Info */}
        <div className="meal-plan-recipe-info">
          <div className="meal-plan-recipe-top-row">
            <div className="cost-info">
              <span className="cost-amount">
                {recipe.cost_per_serving} {currency}
              </span>
              {cheapestMarketInfo && (
                <img 
                  src={getMarketLogo(cheapestMarketInfo.market)} 
                  alt={cheapestMarketInfo.market} 
                  className="market-logo" 
                />
              )}
            </div>
          </div>

          <div className="meal-plan-recipe-meta">
            <span className="time-info">
              ⏱ {recipe.total_time || (recipe.prep_time + recipe.cook_time) || 0}min
            </span>
            <span className="prep-cook-info">
              {recipe.prep_time}m prep • {recipe.cook_time}m cook
            </span>
          </div>

          {recipe.recipe_nutritions && (
            <div className="meal-plan-nutrition-info">
              <span className="nutrition-item">
                🔥 {recipe.recipe_nutritions.calories || 0}cal
              </span>
              <span className="nutrition-item">
                🥩 {recipe.recipe_nutritions.protein || 0}g protein
              </span>
            </div>
          )}

          <div className="creator-info">
            <span>by {creatorName || 'Loading...'}</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="meal-plan-recipe-actions">
          <Button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onSelect(recipe, e);
            }}
            variant={isSelected ? "secondary" : "primary"}
            size="small"
            className="select-recipe-btn"
          >
            {isSelected ? '✓ Selected' : 'Select for Plan'}
          </Button>
          
          <Button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onViewDetails(recipe);
            }}
            variant="outline"
            size="small"
            className="view-recipe-btn"
          >
            View Details
          </Button>
        </div>
      </div>
    </div>
  );
};

export default MealPlanRecipeCard;