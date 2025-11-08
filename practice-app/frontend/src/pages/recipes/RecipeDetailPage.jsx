import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useNavigate } from 'react-router-dom';
import { getRecipeById, getWikidataImage, deleteRecipe } from '../../services/recipeService';
import userService, { getUsername } from '../../services/userService';
// Removed wikidata import as it's not needed
import { useCurrency } from '../../contexts/CurrencyContext';
import RatingStars from '../../components/recipe/RatingStars';
import '../../styles/RecipeDetailPage.css';
import '../../styles/style.css';
import { getCurrentUser } from '../../services/authService';
import ReportButton from '../../components/report/ReportButton';
import InteractiveRatingStars from '../../components/recipe/InteractiveRatingStars';
import InteractiveHealthRating from '../../components/recipe/InteractiveHealthRating';
import { useTranslation } from 'react-i18next';

const RecipeDetailPage = () => {
  const { id } = useParams();
  const [recipe, setRecipe] = useState(null);
  const [creatorName, setCreatorName] = useState('');
  const [error, setError] = useState(null);
  const [isPageReady, setIsPageReady] = useState(false);
  const [recipeId, setRecipeId] = useState('');
  const [currentUser, setCurrentUser] = useState(null);
  const [recipeImage, setRecipeImage] = useState(null);
  const [totalNutrition, setTotalNutrition] = useState(null);
  const navigate = useNavigate();
  const { currency } = useCurrency();
  const { t } = useTranslation();

  // Calculate total nutrition for the recipe
  const calculateTotalNutrition = (recipeData) => {
    if (!recipeData || !recipeData.ingredients) return null;

    let totalNutrition = {};

    recipeData.ingredients.forEach((recipeIngredient) => {
      // Check if ingredient has wikidata info
      if (
        recipeIngredient.ingredient.wikidata_info &&
        recipeIngredient.ingredient.wikidata_info.nutrition
      ) {
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

  const handleBookmarkClick = () => {
    console.log('Bookmark clicked for recipe:', recipe.id);
  };

  useEffect(() => {
    const loadRecipeAndImage = async () => {
      try {
        const recipeData = await getRecipeById(Number(id));
        if (recipeData) {
          setRecipe(recipeData);

          // Calculate total nutrition
          const nutrition = calculateTotalNutrition(recipeData);
          setTotalNutrition(nutrition);

          // Fetch creator name
          if (recipeData.creator_id) {
            const name = await getUsername(recipeData.creator_id);
            setCreatorName(name);
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
          setError('Please log in to view recipes');
        } else if (err.response && err.response.status === 401) {
          setError('Your session has expired. Please log in again.');
        } else if (err.response && err.response.status === 404) {
          setError('Recipe not found');
        } else {
          setError('Failed to load recipe. Please try again.');
          w;
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
            // Check if there are search filters in sessionStorage or localStorage
            const searchFilters =
              localStorage.getItem('recipeSearchFilters') ||
              sessionStorage.getItem('recipeSearchFilters');
            if (searchFilters) {
              navigate(`/recipes?${searchFilters}`);
            } else {
              navigate('/recipes');
            }
          }}
        >
          ← {t('Back')}
        </button>
      </div>

      <div
        className="recipe-detail-page-header"
        style={{
          backgroundImage: recipeImage
            ? `url("${recipeImage}")`
            : 'url("https://plus.unsplash.com/premium_photo-1673108852141-e8c3c22a4a22?q=80&w=2070&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D")',
        }}
      >
        {' '}
        <h1>{recipe.name}</h1>
        <div className="recipe-detail-page-header-boxes">
          <div className="recipe-detail-page-header-box">
            <span className="recipe-detail-page-header-box-info">
              {t('recipeDetailPageDietaryInfo')}:{' '}
            </span>
            {recipe.dietary_info && recipe.dietary_info.length > 0 ? (
              recipe.dietary_info.map((info, index) => (
                <span className="recipe-detail-page-header-box-dietary" key={index}>
                  {info}
                </span>
              ))
            ) : (
              <span className="recipe-detail-page-header-box-dietary">
                {t('recipeDetailPageNone')}
              </span>
            )}
          </div>
          <div className="recipe-detail-page-header-box">
            <span className="recipe-detail-page-header-box-info">
              {t('recipeDetailPageAllergens')}:{' '}
            </span>
            {recipe.alergens && recipe.alergens.length > 0 ? (
              recipe.alergens.map((allergen, index) => (
                <span className="recipe-detail-page-header-box-allergen" key={index}>
                  {allergen.charAt(0).toUpperCase() + allergen.slice(1)}
                  {index < recipe.alergens.length - 1 ? '' : ''}
                </span>
              ))
            ) : (
              <span className="recipe-detail-page-header-box-allergen">
                {t('recipeDetailPageNone')}
              </span>
            )}
          </div>
        </div>
        {/*DELETE BUTTON EDIT BUTTON*/}
        {currentUser && currentUser.id === recipe.creator_id && (
          <div className="recipe-detail-page-header-buttons">
            <button className="delete-recipe-button" onClick={handleDelete}>
              {t('recipeDetailPageDeleteRecipe')}
            </button>
            <button className="edit-recipe-button" onClick={() => navigate(`/recipes/${id}/edit`)}>
              {t('recipeDetailPageEditRecipe')}
            </button>
          </div>
        )}
        {/* Report button positioned above creator info */}
        {currentUser && currentUser.id !== recipe.creator_id && (
          <div
            style={{
              position: 'absolute',
              bottom: '60px',
              right: '20px',
              zIndex: 10,
            }}
          >
            <ReportButton targetType="recipe" targetId={id} />
          </div>
        )}
        {/* Bookmark button and Creator information positioned at bottom right */}
        <button
          className="bookmark-button"
          onClick={handleBookmarkClick}
          title="Bookmark this recipe"
        >
          📌
        </button>
        {/* Creator information positioned at bottom right */}
        <div className="creator-info-bottom-right">
          <p className="creator-name">
            {t('recipeDetailPageCreatedBy')}: {creatorName || t('recipeDetailPageLoading')}
          </p>
        </div>
      </div>
      <div className="recipe-detail-page-stars">
        <div className="recipe-detail-page-star">
          <span className="recipe-detail-page-star-header">
            {t('recipeDetailPageDifficultyRating')}
          </span>
          <div className="recipe-detail-page-star-title">
            <InteractiveRatingStars
              recipeId={recipe.id}
              ratingType="difficulty_rating"
              averageRating={recipe.difficulty_rating || 0}
              onRatingChange={() => handleRatingChange('difficulty_rating')}
            />
          </div>
        </div>
        <div className="recipe-detail-page-star">
          <span className="recipe-detail-page-star-header">{t('recipeDetailPageTasteRating')}</span>
          <div className="recipe-detail-page-star-title">
            <InteractiveRatingStars
              recipeId={recipe.id}
              ratingType="taste_rating"
              averageRating={recipe.taste_rating || 0}
              onRatingChange={() => handleRatingChange('taste_rating')}
            />
          </div>
        </div>
        <div className="recipe-detail-page-star">
          <span className="recipe-detail-page-star-header">
            {t('recipeDetailPageHealthRating')} (Dietitian)
          </span>
          <div className="recipe-detail-page-star-title">
            <InteractiveHealthRating
              recipeId={recipe.id}
              averageHealthRating={recipe.health_rating || 0}
              onRatingChange={() => handleRatingChange('health_rating')}
            />
          </div>
        </div>
      </div>
      <div className="recipe-detail-page-boxes">
        <div className="recipe-detail-page-box">
          <span className="recipe-detail-page-box-header">{t('recipeDetailPageMealType')}</span>
          <span className="recipe-detail-page-box-title">
            {recipe.meal_type
              ? recipe.meal_type.charAt(0).toUpperCase() + recipe.meal_type.slice(1)
              : 'N/A'}
          </span>
        </div>

        <div className="recipe-detail-page-box">
          <span className="recipe-detail-page-box-header">{t('recipeDetailPagePrepTime')}</span>
          <span className="recipe-detail-page-box-title">
            {recipe.prep_time} {t('recipeDetailTime')}
          </span>
        </div>

        <div className="recipe-detail-page-box">
          <span className="recipe-detail-page-box-header">{t('recipeDetailPageCookTime')}</span>
          <span className="recipe-detail-page-box-title">
            {recipe.cook_time} {t('recipeDetailTime')}
          </span>
        </div>

        <div className="recipe-detail-page-box">
          <span className="recipe-detail-page-box-header">{t('recipeDetailPageCost')}</span>
          <span className="recipe-detail-page-box-title">
            {recipe.cost_per_serving || 'None'} {currency}
          </span>
        </div>
      </div>

      {/* Market Costs Comparison */}
      {recipe.recipe_costs && Object.keys(recipe.recipe_costs).length > 0 && (
        <div className="recipe-detail-page-market-costs">
          <h3>Market Price Comparison ({currency})</h3>
          <div className="market-costs-grid">
            {Object.entries(recipe.recipe_costs).map(([market, cost]) => {
              const getMarketLogo = (marketName) => {
                switch (marketName) {
                  case 'A101':
                    return '/src/assets/market_logos/a101.png';
                  case 'SOK':
                    return '/src/assets/market_logos/sok.png';
                  case 'BIM':
                    return '/src/assets/market_logos/bim.png';
                  case 'MIGROS':
                    return '/src/assets/market_logos/migros.png';
                  default:
                    return null;
                }
              };

              return (
                <div key={market} className="market-cost-item">
                  <img src={getMarketLogo(market)} alt={market} className="market-logo" />
                  <span className="market-cost">
                    {cost} {currency}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div className="recipe-detail-page-content">
        <div className="recipe-detail-page-content-steps">
          <h2>{t('recipeDetailPageInstructions')}</h2>
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
              <p>{t('recipeDetailPageNoSteps')}</p>
            );
          })()}
        </div>
        <div className="recipe-detail-page-ingredients">
          <h2>{t('recipeDetailPageIngredients')}</h2>
          {recipe.ingredients && recipe.ingredients.length > 0 ? (
            <ul>
              {recipe.ingredients.map((item, index) => (
                <li
                  key={index}
                  className="ingredient-item"
                  onClick={() => navigate(`/ingredients/${item.ingredient.id}?recipeId=${id}`)}
                  title={`View details for ${item.ingredient.name}`}
                >
                  <span className="ingredient-quantity">
                    {formatQuantity(item.quantity)} {item.unit}{' '}
                  </span>
                  <span className="ingredient-name">- {item.ingredient.name}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p>{t('recipeDetailPageNoIngredients')}</p>
          )}
        </div>

        {/* Total Nutritional Information */}
        {((recipe.recipe_nutritions && Object.keys(recipe.recipe_nutritions).length > 0) ||
          (totalNutrition && Object.keys(totalNutrition).length > 0)) && (
          <div className="recipe-detail-page-nutrition">
            <h2>Total Nutritional Information</h2>

            {/* Use recipe_nutritions from API if available, otherwise use calculated totalNutrition */}
            {(() => {
              const nutritionData = recipe.recipe_nutritions || totalNutrition;
              const hasMainNutrients =
                nutritionData.calories ||
                nutritionData.protein ||
                nutritionData.fat ||
                nutritionData.carbohydrates ||
                nutritionData.carbs;

              return (
                <>
                  {hasMainNutrients && (
                    <div className="nutrition-cards">
                      {/* Calories */}
                      {nutritionData.calories && (
                        <div className="nutrition-card calories">
                          <div className="nutrition-icon">🔥</div>
                          <div className="nutrition-info">
                            <span className="nutrition-value">
                              {typeof nutritionData.calories === 'number'
                                ? nutritionData.calories.toFixed(0)
                                : nutritionData.calories}
                            </span>
                            <span className="nutrition-label">Calories</span>
                            <span className="nutrition-unit">kcal</span>
                          </div>
                        </div>
                      )}

                      {/* Protein */}
                      {nutritionData.protein && (
                        <div className="nutrition-card protein">
                          <div className="nutrition-icon">💪</div>
                          <div className="nutrition-info">
                            <span className="nutrition-value">
                              {typeof nutritionData.protein === 'number'
                                ? nutritionData.protein.toFixed(1)
                                : nutritionData.protein}
                            </span>
                            <span className="nutrition-label">Protein</span>
                            <span className="nutrition-unit">g</span>
                          </div>
                        </div>
                      )}

                      {/* Fat */}
                      {nutritionData.fat && (
                        <div className="nutrition-card fat">
                          <div className="nutrition-icon">🧈</div>
                          <div className="nutrition-info">
                            <span className="nutrition-value">
                              {typeof nutritionData.fat === 'number'
                                ? nutritionData.fat.toFixed(1)
                                : nutritionData.fat}
                            </span>
                            <span className="nutrition-label">Fat</span>
                            <span className="nutrition-unit">g</span>
                          </div>
                        </div>
                      )}

                      {/* Carbohydrates - check both 'carbs' and 'carbohydrates' */}
                      {(nutritionData.carbohydrates || nutritionData.carbs) && (
                        <div className="nutrition-card carbs">
                          <div className="nutrition-icon">🌾</div>
                          <div className="nutrition-info">
                            <span className="nutrition-value">
                              {(() => {
                                const carbValue =
                                  nutritionData.carbohydrates || nutritionData.carbs;
                                return typeof carbValue === 'number'
                                  ? carbValue.toFixed(1)
                                  : carbValue;
                              })()}
                            </span>
                            <span className="nutrition-label">Carbs</span>
                            <span className="nutrition-unit">g</span>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Show other nutrition info if available */}
                  {Object.keys(nutritionData).filter(
                    (key) => !['calories', 'protein', 'fat', 'carbohydrates'].includes(key)
                  ).length > 0 && (
                    <div className="other-nutrition">
                      <h4>Other Nutritional Information</h4>
                      <div className="nutrition-grid">
                        {Object.entries(nutritionData)
                          .filter(
                            ([key]) =>
                              !['calories', 'protein', 'fat', 'carbohydrates'].includes(key)
                          )
                          .map(([key, value]) => (
                            <div key={key} className="nutrition-item">
                              <span className="nutrition-label">
                                {key.charAt(0).toUpperCase() + key.slice(1)}
                              </span>
                              <span className="nutrition-value">
                                {typeof value === 'number' ? value.toFixed(2) : value}
                              </span>
                            </div>
                          ))}
                      </div>
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
