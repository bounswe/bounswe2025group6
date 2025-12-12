import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useNavigate } from 'react-router-dom';
import { getRecipeById, getWikidataImage, deleteRecipe } from '../../services/recipeService';
import userService, { getUsername } from '../../services/userService';
import { toggleBookmark, getBookmarkedRecipes } from '../../services/bookmarkService';
import { translateIngredient } from '../../utils/ingredientTranslations';
// Removed wikidata import as it's not needed
import { useCurrency } from '../../contexts/CurrencyContext';
import { getNutritionIcon } from '../../utils/nutritionIcons';
import { useAuth } from '../../contexts/AuthContext';
import RatingStars from '../../components/recipe/RatingStars';
import { formatDate } from '../../utils/dateFormatter';
import '../../styles/RecipeDetailPage.css';
import '../../styles/style.css';
import { getCurrentUser } from '../../services/authService';
import ReportButton from '../../components/report/ReportButton';
import InteractiveRatingStars from '../../components/recipe/InteractiveRatingStars';
import InteractiveHealthRating from '../../components/recipe/InteractiveHealthRating';
import { useTranslation } from "react-i18next";
import { createLoginUrl } from "../../utils/authUtils";

const RecipeDetailPage = () => {
  const { id } = useParams();
  const [recipe, setRecipe] = useState(null);
  const [creatorName, setCreatorName] = useState('');
  const [creatorId, setCreatorId] = useState(null);
  const [creatorPhoto, setCreatorPhoto] = useState(null);
  const [error, setError] = useState(null);
  const [isPageReady, setIsPageReady] = useState(false);
  const [recipeId, setRecipeId] = useState('');
  const [currentUser, setCurrentUser] = useState(null);
  const [recipeImage, setRecipeImage] = useState(null);
  const [totalNutrition, setTotalNutrition] = useState(null);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [isBookmarking, setIsBookmarking] = useState(false);
  const [userDateFormat, setUserDateFormat] = useState('DD/MM/YYYY');
  const navigate = useNavigate();
  const { currency } = useCurrency();
  const { currentUser: authUser } = useAuth();
  const { t, i18n } = useTranslation();
  
  // Get current language for ingredient translation
  const currentLanguage = i18n.language.startsWith('tr') ? 'tr' : 'en';

  // Calculate total nutrition for the recipe
  const calculateTotalNutrition = (recipeData) => {
    if (!recipeData || !recipeData.ingredients) return null;

    let totalNutrition = {};
    
    recipeData.ingredients.forEach(recipeIngredient => {
      // Check if ingredient has wikidata info
      if (recipeIngredient.ingredient.wikidata_info && recipeIngredient.ingredient.wikidata_info.nutrition) {
        const wikidataInfo = recipeIngredient.ingredient.wikidata_info;
        
        // Calculate nutrition based on quantity and unit
        const quantity = parseFloat(recipeIngredient.quantity) || 0;
        const unit = recipeIngredient.unit;
        
        // Simple conversion factors (this is a basic implementation)
        let conversionFactor = 1;
        if (unit === 'kg' && recipeIngredient.ingredient.base_unit === 'g') {
          conversionFactor = 1000;
        } else if (unit === 'g' && recipeIngredient.ingredient.base_unit === 'kg') {
          conversionFactor = 0.001;
        } else if (unit === 'l' && recipeIngredient.ingredient.base_unit === 'ml') {
          conversionFactor = 1000;
        } else if (unit === 'ml' && recipeIngredient.ingredient.base_unit === 'l') {
          conversionFactor = 0.001;
        }
        // Add more conversions as needed
        
        Object.entries(wikidataInfo.nutrition).forEach(([key, value]) => {
          const nutritionValue = (parseFloat(value) || 0) * quantity * conversionFactor;
          totalNutrition[key] = (totalNutrition[key] || 0) + nutritionValue;
        });
      }
    });
    
    return totalNutrition;
  };

  // Format quantity to hide .00 decimals
  const formatQuantity = (quantity) => {
    const num = parseFloat(quantity);
    if (isNaN(num)) return quantity;
    
    // If the number is a whole number, return it without decimals
    if (num % 1 === 0) {
      return num.toString();
    }
    
    // Otherwise, return the original number as string
    return quantity;
  };

  // Normalize dietary info strings to translation key suffixes
  const sanitizeDietaryKey = (info) => {
    if (!info || typeof info !== 'string') return '';
    // Split on any non-alphanumeric character and remove empty parts
    const parts = info.split(/[^a-zA-Z0-9]+/).filter(Boolean);
    // Capitalize each part and join, e.g. 'gluten-free' -> 'GlutenFree'
    return parts.map(p => p.charAt(0).toUpperCase() + p.slice(1)).join('');
  };

  const handleDelete = async () => {
    try {
      if (!id) {
        alert('Invalid recipe ID.');
        return;
      }

      // Check if current user is the creator
      const currentUser = await getCurrentUser(); // Add await here
      if (!currentUser || currentUser.id !== recipe.creator_id) {
        alert('You can only delete recipes that you created.');
        return;
      }
      
      const success = await deleteRecipe(id);
      if (success) {
        alert(`Recipe ${recipe.name} deleted successfully.`);
        navigate(`/recipes/`);
      }
    } catch (error) {
      console.error('Error deleting recipe:', error);
      alert('Failed to delete the recipe. Please try again.');
    }
  };

  const handleRatingChange = async (ratingType) => {
    try {
      // Rating değişikliği sonrası recipe'yi yeniden yükle
      const updatedRecipe = await getRecipeById(Number(id));
      if (updatedRecipe) {
        setRecipe(updatedRecipe);
        console.log(`${ratingType} updated, new recipe data:`, updatedRecipe);
      }
    } catch (error) {
      console.error('Error refreshing recipe after rating change:', error);
    }
  };

  // Handle bookmark toggle
  const handleBookmarkToggle = async () => {
    if (!authUser || !authUser.id) {
      // Redirect to login with current recipe page as next parameter
      const currentPath = `/recipes/${id}`;
      navigate(createLoginUrl(currentPath));
      return;
    }

    try {
      setIsBookmarking(true);
      await toggleBookmark(Number(id), isBookmarked);
      
      // Refresh bookmark status from backend
      const bookmarkIds = await getBookmarkedRecipes(authUser.id);
      if (!bookmarkIds || bookmarkIds.length === 0) {
        setIsBookmarked(false);
      } else {
        const recipeId = Number(id);
        const bookmarked = bookmarkIds.some(
          bookmarkId => {
            const id = typeof bookmarkId === 'object' ? bookmarkId.id || bookmarkId : bookmarkId;
            return Number(id) === recipeId;
          }
        );
        setIsBookmarked(bookmarked);
      }
    } catch (error) {
      console.error('Error toggling bookmark:', error);
      alert('Failed to bookmark recipe. Please try again.');
    } finally {
      setIsBookmarking(false);
    }
  };

  // Handle share recipe
  const handleShare = async () => {
    if (!recipe) return;

    const recipeUrl = `${window.location.origin}/recipes/${id}`;
    
    // Format recipe details for sharing
    let shareText = `${recipe.name}\n\n`;
    
    if (recipe.ingredients && recipe.ingredients.length > 0) {
      shareText += `${t("recipeDetailPageIngredients")}:\n`;
      recipe.ingredients.forEach((item, index) => {
        const ingredientName = translateIngredient(item.ingredient.name, currentLanguage);
        shareText += `- ${formatQuantity(item.quantity)} ${item.unit} ${ingredientName}\n`;
      });
      shareText += '\n';
    }
    
    if (recipe.steps && recipe.steps.length > 0) {
      shareText += `${t("recipeDetailPageInstructions")}:\n`;
      recipe.steps.forEach((step, index) => {
        shareText += `${index + 1}. ${step}\n`;
      });
      shareText += '\n';
    }
    
    shareText += `${t("recipeDetailPageShareLink")}: ${recipeUrl}`;

    const shareData = {
      title: recipe.name,
      text: shareText,
      url: recipeUrl,
    };

    try {
      // Check if Web Share API is supported
      if (navigator.share) {
        // Check if canShare is available and use it, otherwise try to share directly
        if (navigator.canShare) {
          if (navigator.canShare(shareData)) {
            await navigator.share(shareData);
            return;
          }
        } else {
          // canShare not available, try to share directly
          try {
            await navigator.share(shareData);
            return;
          } catch (shareError) {
            // If share fails, fall through to clipboard
            if (shareError.name === 'AbortError') {
              // User cancelled, don't show error
              return;
            }
          }
        }
      }
      
      // Fallback: Copy to clipboard
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(shareText);
        alert(t("recipeDetailPageShareCopied"));
      } else {
        // Last resort: Show text in alert for user to copy manually
        alert(`${t("recipeDetailPageShareLink")}:\n${recipeUrl}`);
      }
    } catch (error) {
      // User cancelled or error occurred
      if (error.name === 'AbortError') {
        // User cancelled sharing, do nothing
        return;
      }
      
      // Try clipboard as fallback
      try {
        if (navigator.clipboard && navigator.clipboard.writeText) {
          await navigator.clipboard.writeText(shareText);
          alert(t("recipeDetailPageShareCopied"));
        } else {
          alert(`${t("recipeDetailPageShareLink")}:\n${recipeUrl}`);
        }
      } catch (clipboardError) {
        console.error('Error sharing recipe:', error);
        alert(t("recipeDetailPageShareError"));
      }
    }
  };

  // Check if recipe is bookmarked
  useEffect(() => {
    const checkBookmarkStatus = async () => {
      if (!authUser || !authUser.id || !id) return;
      
      try {
        const bookmarkIds = await getBookmarkedRecipes(authUser.id);
        if (!bookmarkIds || bookmarkIds.length === 0) {
          setIsBookmarked(false);
          return;
        }
        
        // Check if current recipe ID is in the bookmarked IDs
        const recipeId = Number(id);
        const bookmarked = bookmarkIds.some(
          bookmarkId => {
            const id = typeof bookmarkId === 'object' ? bookmarkId.id || bookmarkId : bookmarkId;
            return Number(id) === recipeId;
          }
        );
        setIsBookmarked(bookmarked);
      } catch (error) {
        console.error('Error checking bookmark status:', error);
        setIsBookmarked(false);
      }
    };

    checkBookmarkStatus();
  }, [authUser, id]);

  useEffect(() => {
    const loadRecipeAndImage = async () => {
      try {
        const recipeData = await getRecipeById(Number(id));
        if (recipeData) {
          setRecipe(recipeData);
          
          // Calculate total nutrition
          const nutrition = calculateTotalNutrition(recipeData);
          setTotalNutrition(nutrition);
          
          // Fetch creator name, ID, and photo
          if (recipeData.creator_id) {
            setCreatorId(recipeData.creator_id);
            const name = await getUsername(recipeData.creator_id);
            setCreatorName(name);
            // Fetch creator profile for photo
            try {
              const creatorProfile = await userService.getUserById(recipeData.creator_id);
              if (creatorProfile && creatorProfile.profilePhoto) {
                setCreatorPhoto(creatorProfile.profilePhoto);
              }
            } catch (error) {
              console.error('Error fetching creator profile:', error);
            }
          }
          
          // First check if recipe has an uploaded image
          if (recipeData.image_full_url) {
            setRecipeImage(recipeData.image_full_url);
          } else {
            // If no uploaded image, try to get from Wikidata API
            try {
              const imageUrl = await getWikidataImage(recipeData.name);
              if (imageUrl) {
                setRecipeImage(imageUrl);
              }
            } catch (imageError) {
              console.error('Failed to load recipe image:', imageError);
              // Don't set error state, just continue without image
            }
          }
        } else {
          setError('Recipe not found');
        }
      } catch (err) {
        console.error('Error loading recipe:', err);
        if (err.message && err.message.includes('Authentication required')) {
          // Redirect to login with current recipe page as next parameter
          const currentPath = `/recipes/${id}`;
          navigate(createLoginUrl(currentPath));
          return;
        } else if (err.response && err.response.status === 401) {
          // Redirect to login with current recipe page as next parameter
          const currentPath = `/recipes/${id}`;
          navigate(createLoginUrl(currentPath));
          return;
        } else if (err.response && err.response.status === 404) {
          setError('Recipe not found');
        } else {
          setError('Failed to load recipe. Please try again.');
        }
      } finally {
        setIsPageReady(true);
      }
    };

    // Only load if we don't have recipe data or if the ID changed
    if (!recipe || recipe.id !== Number(id)) {
      loadRecipeAndImage();
    } else {
      // If we already have the data, mark as ready immediately
      setIsPageReady(true);
    }
  }, [id]);

  useEffect(() => {
    const fetchCurrentUser = async () => {
      try {
        const user = await getCurrentUser();
        setCurrentUser(user);
        
        // Load user's preferred date format
        if (user && user.id) {
          try {
            const userData = await userService.getUserById(user.id);
            setUserDateFormat(userData.preferredDateFormat || 'DD/MM/YYYY');
          } catch (error) {
            console.error('Error loading user date format:', error);
          }
        }
      } catch (error) {
        console.error('Error fetching current user:', error);
        setCurrentUser(null);
      }
    };
    fetchCurrentUser();
  }, []);

  // Show loading only if we're actually loading and don't have data
  if (!isPageReady && !recipe) return null;
  
  if (error) return <div className="text-red-500">{error}</div>;
  if (!recipe) return <div>No recipe data available</div>;

  return (
    <div id="recipe-detail-page" className="container">
      {/* Back Button */}
      <div className="recipe-back-button-container">
        <button 
          className="recipe-back-button" 
          onClick={() => {
            // Check if we came from meal planner first
            const returnToMealPlanner = localStorage.getItem('returnToMealPlanner');
            if (returnToMealPlanner) {
              localStorage.removeItem('returnToMealPlanner');
              navigate(returnToMealPlanner);
              return;
            }
            
            // Otherwise check recipe search filters
            const searchFilters = localStorage.getItem('recipeSearchFilters') || sessionStorage.getItem('recipeSearchFilters');
            if (searchFilters) {
              navigate(`/recipes?${searchFilters}`);
            } else {
              navigate('/recipes');
            }
          }}
        >
          ← {t("Back")}
        </button>
      </div>
      
      <div className="recipe-detail-page-header" style={{
				backgroundImage: recipeImage
          ? `url("${recipeImage}")`
          : 'url("https://plus.unsplash.com/premium_photo-1673108852141-e8c3c22a4a22?q=80&w=2070&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D")'
			}}>        <h1>{recipe.name}</h1>
        <div className='recipe-detail-page-header-boxes'>
          <div className='recipe-detail-page-header-box'>
            <span className='recipe-detail-page-header-box-info'>{t("recipeDetailPageDietaryInfo")}: </span>
            {recipe.dietary_info && recipe.dietary_info.length > 0 ? (
              recipe.dietary_info.map((info, index) => (
                <span className='recipe-detail-page-header-box-dietary' key={index} >{t(`dietaryInfo${sanitizeDietaryKey(info)}`, { defaultValue: info })}</span>
              ))
            ) : (
              <span className='recipe-detail-page-header-box-dietary'>{t("recipeDetailPageNone")}</span>
            )}
          </div>
          <div className='recipe-detail-page-header-box'>
            <span className='recipe-detail-page-header-box-info'>{t("recipeDetailPageAllergens")}: </span>
            {(recipe.allergens || recipe.alergens) && (recipe.allergens || recipe.alergens).length > 0 ? (
            (recipe.allergens || recipe.alergens).map((allergen, index) => (
              <span className='recipe-detail-page-header-box-allergen' key={index}>
                {t(`allergen${sanitizeDietaryKey(allergen)}`, { defaultValue: allergen })}
              </span>
            ))
          ) : (
            <span className='recipe-detail-page-header-box-allergen'>{t("recipeDetailPageNone")}</span>
          )}
          </div>
        </div>

        {/*DELETE BUTTON EDIT BUTTON*/}
        {currentUser && currentUser.id === recipe.creator_id && (
          <div className='recipe-detail-page-header-buttons'>
            <button className="delete-recipe-button" onClick={handleDelete}>{t("recipeDetailPageDeleteRecipe")}</button>
            <button 
              className="edit-recipe-button" 
              onClick={() => navigate(`/recipes/${id}/edit`)}
            >
              {t("recipeDetailPageEditRecipe")}
            </button>
          </div>
        )}

        {/* Creator information positioned at top right */}
        <div className="creator-info-top-right">
          <div className="creator-info-content">
            <div className="creator-avatar-name">
              {creatorPhoto ? (
                <img 
                  src={creatorPhoto} 
                  alt={creatorName} 
                  className="creator-avatar"
                  onClick={() => creatorId && navigate(`/profile/${creatorId}`)}
                />
              ) : (
                <div 
                  className="creator-avatar-placeholder"
                  onClick={() => creatorId && navigate(`/profile/${creatorId}`)}
                >
                  {creatorName?.[0]?.toUpperCase() || 'U'}
                </div>
              )}
              <div className="creator-text-info">
                <p className="creator-name">
                  {t("recipeDetailPageCreatedBy")}:{' '}
                  {creatorId ? (
                    <span
                      className="creator-link"
                      onClick={() => navigate(`/profile/${creatorId}`)}
                    >
                      {creatorName || t("recipeDetailPageLoading")}
                    </span>
                  ) : (
                    <span>{creatorName || t("recipeDetailPageLoading")}</span>
                  )}
                </p>
                {recipe.created_at && (
                  <p className="creator-date">
                    {formatDate(recipe.created_at, userDateFormat)}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Bookmark, Share and Report buttons positioned at bottom */}
        <div className="recipe-actions-bottom">
          {/* Share button - always visible */}
          <button
            className="recipe-share-button"
            onClick={handleShare}
            title={t("recipeDetailPageShareRecipe")}
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#48bb78"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="18" cy="5" r="3"></circle>
              <circle cx="6" cy="12" r="3"></circle>
              <circle cx="18" cy="19" r="3"></circle>
              <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"></line>
              <line x1="15.41" y1="6.51" x2="8.59" y2="10.49"></line>
            </svg>
          </button>

          {/* Bookmark button - only show if user is logged in */}
          {authUser && (
            <button
              className={`recipe-bookmark-button ${isBookmarked ? 'bookmarked' : ''}`}
              onClick={handleBookmarkToggle}
              disabled={isBookmarking}
              title={isBookmarked ? 'Remove bookmark' : 'Bookmark recipe'}
            >
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill={isBookmarked ? 'white' : 'none'}
                stroke={isBookmarked ? 'white' : '#48bb78'}
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M6 2v20l6-4 6 4V2H6z" />
              </svg>
            </button>
          )}

          {/* Report button - right side, only show if user is logged in and not owner */}
          {authUser && currentUser && currentUser.id !== recipe.creator_id && (
            <div className="recipe-report-button-wrapper">
              <ReportButton targetType="recipe" targetId={id} />
            </div>
          )}
        </div>
        
      </div>
      
      {/* Combined Section: Meal Details (Left) + Ratings (Right) */}
      <div className='recipe-detail-page-info-ratings-container'>
        {/* Left Side: Meal Details + Market Costs */}
        <div className='recipe-detail-page-left-section'>
          <div className='recipe-detail-page-boxes'>
            <div className="recipe-detail-page-box">
              <span className='recipe-detail-page-box-header'>{t("recipeDetailPageMealType")}</span>
              <span className='recipe-detail-page-box-title'>
                {recipe.meal_type
                ? t(`mealType${recipe.meal_type.charAt(0).toUpperCase() + recipe.meal_type.slice(1)}`)
                : 'N/A'}
              </span>
            </div>

            <div className="recipe-detail-page-box">
              <span className='recipe-detail-page-box-header'>{t("recipeDetailPagePrepTime")}</span>
              <span className='recipe-detail-page-box-title'>{recipe.prep_time} {t("recipeDetailTime")}</span>
            </div>

            <div className="recipe-detail-page-box">
              <span className='recipe-detail-page-box-header'>{t("recipeDetailPageCookTime")}</span>
              <span className='recipe-detail-page-box-title'>{recipe.cook_time} {t("recipeDetailTime")}</span>
            </div>

            <div className="recipe-detail-page-box">
              <span className='recipe-detail-page-box-header'>{t("recipeDetailPageCost")}</span>
              <div className='recipe-detail-page-box-title-container'>
                <span className='recipe-detail-page-box-title'>{recipe.cost_per_serving || 'None'} {currency}</span>
                {(() => {
                  // Find the cheapest market
                  if (recipe.recipe_costs && Object.keys(recipe.recipe_costs).length > 0) {
                    const costs = Object.entries(recipe.recipe_costs)
                      .filter(([_, cost]) => cost !== null && cost !== undefined)
                      .map(([market, cost]) => ({ market, cost: parseFloat(cost) || 0 }));
                    
                    if (costs.length > 0) {
                      const cheapest = costs.reduce((min, current) => 
                        current.cost < min.cost ? current : min
                      );
                      
                      const getMarketLogo = (marketName) => {
                        switch(marketName) {
                          case 'A101': return '/src/assets/market_logos/a101.png';
                          case 'SOK': return '/src/assets/market_logos/sok.png';
                          case 'BIM': return '/src/assets/market_logos/bim.png';
                          case 'MIGROS': return '/src/assets/market_logos/migros.png';
                          default: return null;
                        }
                      };
                      
                      const logo = getMarketLogo(cheapest.market);
                      if (logo) {
                        return (
                          <img 
                            src={logo} 
                            alt={cheapest.market} 
                            className="recipe-cost-market-logo" 
                            title={`Lowest price at ${cheapest.market}`}
                          />
                        );
                      }
                    }
                  }
                  return null;
                })()}
              </div>
            </div>  
          </div>

          {/* Market Costs Comparison */}
          {recipe.recipe_costs && Object.keys(recipe.recipe_costs).length > 0 && (
            <div className='recipe-detail-page-market-costs'>
              <h3>{t("marketPriceComparison")} ({currency})</h3>
              <div className="market-costs-grid">
                {Object.entries(recipe.recipe_costs).map(([market, cost]) => {
                  const getMarketLogo = (marketName) => {
                    switch(marketName) {
                      case 'A101': return '/src/assets/market_logos/a101.png';
                      case 'SOK': return '/src/assets/market_logos/sok.png';
                      case 'BIM': return '/src/assets/market_logos/bim.png';
                      case 'MIGROS': return '/src/assets/market_logos/migros.png';
                      default: return null;
                    }
                  };
                  
                  return (
                    <div key={market} className="market-cost-item">
                      <img src={getMarketLogo(market)} alt={market} className="market-logo" />
                      <span className="market-cost">{cost} {currency}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Right Side: Ratings (Vertical) */}
        <div className='recipe-detail-page-stars-vertical'>
          <div className='recipe-detail-page-star'>
            <span className='recipe-detail-page-star-header'>{t("recipeDetailPageDifficultyRating")}</span>
            <div className='recipe-detail-page-star-title'>
              <InteractiveRatingStars 
                recipeId={recipe.id}
                ratingType="difficulty_rating"
                averageRating={recipe.difficulty_rating || 0}
                onRatingChange={() => handleRatingChange('difficulty_rating')}
              />
            </div>
          </div>
          <div className='recipe-detail-page-star'>
            <span className='recipe-detail-page-star-header'>{t("recipeDetailPageTasteRating")}</span>
            <div className='recipe-detail-page-star-title'>
              <InteractiveRatingStars 
                recipeId={recipe.id}
                ratingType="taste_rating"
                averageRating={recipe.taste_rating || 0}
                onRatingChange={() => handleRatingChange('taste_rating')}
              />
            </div>
          </div>
          <div className='recipe-detail-page-star'>
            <span className='recipe-detail-page-star-header'>{t("recipeDetailPageHealthRating")} ({t("recipeDetailPageHealthRatingDietitian")})</span>
            <div className='recipe-detail-page-star-title'>
              <InteractiveHealthRating 
                recipeId={recipe.id} 
                averageHealthRating={recipe.health_rating || 0}
                onRatingChange={() => handleRatingChange('health_rating')}
              />
            </div>
          </div>
        </div>
      </div>



      <div className='recipe-detail-page-content'>
        <div className='recipe-detail-page-content-steps'>
          <h2>{t("recipeDetailPageInstructions")}</h2>
          {(() => {
            let steps = recipe.steps;
            
            // Steps should already be an array from backend
            if (!Array.isArray(steps)) {
              steps = [];
            }
            
            return steps && steps.length > 0 ? (
              <ol>
                {steps.map((step, index) => (
                  <li key={index}>{step}</li>
                ))}
              </ol>
            ) : (
              <p>{t("recipeDetailPageNoSteps")}</p>
            );
          })()}
        </div>
        <div className='recipe-detail-page-ingredients'>
          <h2>{t("recipeDetailPageIngredients")}</h2>
          {recipe.ingredients && recipe.ingredients.length > 0 ? (
          <ul>
            {recipe.ingredients.map((item, index) => (
              <li 
                key={index} 
                className="ingredient-item"
                onClick={() => navigate(`/ingredients/${item.ingredient.id}?recipeId=${id}`)}
                title={`View details for ${translateIngredient(item.ingredient.name, currentLanguage)}`}
              >
                <span className="ingredient-full-text">
                  <span className="ingredient-quantity">{formatQuantity(item.quantity)} {item.unit}</span>
                  <span className="ingredient-separator"> - </span>
                  <span className="ingredient-name">
                    {translateIngredient(item.ingredient.name, currentLanguage)}
                  </span>
                </span>
              </li>
            ))}
          </ul>
          ) : (
            <p>{t("recipeDetailPageNoIngredients")}</p>
          )}
        </div>

        {/* Total Nutritional Information */}
        {((recipe.recipe_nutritions && Object.keys(recipe.recipe_nutritions).length > 0) || 
          (totalNutrition && Object.keys(totalNutrition).length > 0)) && (
        <div className='recipe-detail-page-nutrition'>
          <h2>{t("nutritionTotalNutritionalInformation")}</h2>
          
          {/* Use recipe_nutritions from API if available, otherwise use calculated totalNutrition */}
          {(() => {
              const nutritionData = recipe.recipe_nutritions || totalNutrition;
              const hasMainNutrients = nutritionData.calories || nutritionData.protein || 
                                     nutritionData.fat || nutritionData.carbohydrates || nutritionData.carbs;
              
              return (
                <>
                  {hasMainNutrients && (
                  <div className="nutrition-cards">
                      {/* Calories */}
                      {nutritionData.calories && (() => {
                        const caloriesValue = typeof nutritionData.calories === 'number' 
                          ? nutritionData.calories 
                          : parseFloat(nutritionData.calories) || 0;
                        const { icon, sizeClass } = getNutritionIcon('calories', caloriesValue);
                        return (
                          <div className="nutrition-card calories">
                            <div className={`nutrition-icon ${sizeClass}`}>{icon}</div>
                            <div className="nutrition-info">
                              <span className="nutrition-value">
                                {caloriesValue.toFixed(0)}
                              </span>
                              <span className="nutrition-label">{t("nutritionCalories")}</span>
                              <span className="nutrition-unit">kcal</span>
                            </div>
                          </div>
                        );
                      })()}
                      
                      {/* Protein */}
                      {nutritionData.protein && (() => {
                        const proteinValue = typeof nutritionData.protein === 'number' 
                          ? nutritionData.protein 
                          : parseFloat(nutritionData.protein) || 0;
                        const { icon, sizeClass } = getNutritionIcon('protein', proteinValue);
                        return (
                          <div className="nutrition-card protein">
                            <div className={`nutrition-icon ${sizeClass}`}>{icon}</div>
                            <div className="nutrition-info">
                              <span className="nutrition-value">
                                {proteinValue.toFixed(1)}
                              </span>
                              <span className="nutrition-label">{t("nutritionProtein")}</span>
                              <span className="nutrition-unit">g</span>
                            </div>
                          </div>
                        );
                      })()}
                      
                      {/* Fat */}
                      {nutritionData.fat && (() => {
                        const fatValue = typeof nutritionData.fat === 'number' 
                          ? nutritionData.fat 
                          : parseFloat(nutritionData.fat) || 0;
                        const { icon, sizeClass } = getNutritionIcon('fat', fatValue);
                        return (
                          <div className="nutrition-card fat">
                            <div className={`nutrition-icon ${sizeClass}`}>{icon}</div>
                            <div className="nutrition-info">
                              <span className="nutrition-value">
                                {fatValue.toFixed(1)}
                              </span>
                              <span className="nutrition-label">{t("nutritionFat")}</span>
                              <span className="nutrition-unit">g</span>
                            </div>
                          </div>
                        );
                      })()}
                      
                      {/* Carbohydrates - check both 'carbs' and 'carbohydrates' */}
                      {(nutritionData.carbohydrates || nutritionData.carbs) && (() => {
                        const carbValue = typeof (nutritionData.carbohydrates || nutritionData.carbs) === 'number' 
                          ? (nutritionData.carbohydrates || nutritionData.carbs)
                          : parseFloat(nutritionData.carbohydrates || nutritionData.carbs) || 0;
                        const { icon, sizeClass } = getNutritionIcon('carbs', carbValue);
                        return (
                          <div className="nutrition-card carbs">
                            <div className={`nutrition-icon ${sizeClass}`}>{icon}</div>
                            <div className="nutrition-info">
                              <span className="nutrition-value">
                                {carbValue.toFixed(1)}
                              </span>
                              <span className="nutrition-label">{t("nutritionCarbs")}</span>
                              <span className="nutrition-unit">g</span>
                            </div>
                          </div>
                        );
                      })()}
                  </div>
                  )}
                </>
              );
            })()}
        </div>
        )}
        
      </div>
      

      


      {/*
      
      <div><strong>Like:</strong> {recipe.like_count}</div>
        <div><strong>Comments:</strong> {recipe.comment_count}</div>
      
      */}

        


    </div>
  );
};

export default RecipeDetailPage;
