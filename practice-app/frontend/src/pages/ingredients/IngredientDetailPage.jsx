import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getIngredientById } from '../../services/ingredientService';
import { useCurrency } from '../../contexts/CurrencyContext';
import { translateIngredient } from '../../utils/ingredientTranslations';
import '../../styles/IngredientDetailPage.css';
import { useTranslation } from "react-i18next";
import { getNutritionIcon } from '../../utils/nutritionIcons';

const IngredientDetailPage = () => {
  const { t, i18n } = useTranslation();
  const { id } = useParams();
  const navigate = useNavigate();
  const { currency } = useCurrency();
  const [ing, setIng] = useState(null);
  const [error, setError] = useState(null);
  const [isPageReady, setIsPageReady] = useState(false);
  
  // Get current language for ingredient translation
  const [currentLanguage, setCurrentLanguage] = useState(i18n.language.startsWith('tr') ? 'tr' : 'en');
  
  // Update language when i18n language changes
  useEffect(() => {
    setCurrentLanguage(i18n.language.startsWith('tr') ? 'tr' : 'en');
  }, [i18n.language]);
  
  // Get recipe ID from URL search params for back navigation
  const urlParams = new URLSearchParams(window.location.search);
  const recipeId = urlParams.get('recipeId');

  useEffect(() => {
    const fetchIngredientData = async () => {
      try {
        const ingredientData = await getIngredientById(id);
        setIng(ingredientData);
      } catch (err) {
        setError(err.message);
      } finally {
        setIsPageReady(true);
      }
    };

    // Only load if we don't have ingredient data or if the ID changed
    if (!ing || ing.id !== Number(id)) {
      fetchIngredientData();
    } else {
      // If we already have the data, mark as ready immediately
      setIsPageReady(true);
    }
  }, [id]);

  useEffect(() => {
    if (ing) {
      const translatedName = translateIngredient(ing.name, currentLanguage);
      document.title = t('ingredientDetailTitle', { name: translatedName });
    }
  }, [ing, currentLanguage]);

  // Show loading only if we're actually loading and don't have data
  if (!isPageReady && !ing) return null;
  
  if (error) return <div className="text-red-500">{t("Error")}: {error}</div>;
  if (!ing) return <div>{t("NotFound")}</div>;

  const translatedIngredientName = translateIngredient(ing.name, currentLanguage);
  // Helper: format numeric quantities (drop unnecessary trailing zeros)
  const formatQuantity = (q) => {
    if (q === null || q === undefined || q === '') return '';
    const n = Number(q);
    if (Number.isNaN(n)) return String(q);
    return Number.isInteger(n) ? String(n) : String(n).replace(/(?:\.0+|(?<=\.\d)0+)$/, '');
  };

  // Normalize category tokens to translation key suffixes
  const sanitizeCategoryKey = (cat) => {
    if (!cat || typeof cat !== 'string') return '';
    // Accept tokens like 'herbs_and_spices', 'gluten-free', 'high_protein'
    const parts = cat.split(/[^a-zA-Z0-9]+/).filter(Boolean);
    return parts.map(p => p.charAt(0).toUpperCase() + p.slice(1)).join('');
  };

  const getCategoryLabel = (cat) => {
    if (!cat) return '';
    const key = `category${sanitizeCategoryKey(cat)}`;
    return t(key, { defaultValue: cat.replace(/[_-]+/g, ' ') });
  };

  // Map unit codes to translated, human-friendly labels where possible
  const mapUnitToLabel = (unit) => (
    unit === 'pcs' ? t('Pcs') :
    unit === 'cup' ? t('Cup') :
    unit === 'tbsp' ? t('Tbsp') :
    unit === 'tsp' ? t('Tsp') :
    unit
  );

  const capitalize = (s) => {
    if (!s || typeof s !== 'string') return s;
    return s.charAt(0).toUpperCase() + s.slice(1);
  };

  const displayBaseUnit = capitalize(mapUnitToLabel(ing.base_unit || 'g'));
  const displayBaseQuantity = formatQuantity(ing.base_quantity || 100);
  const baseQuantityLabel = `${displayBaseQuantity} ${displayBaseUnit}`;

  const displayAllowedUnits = (ing.allowed_units || []).map(u => capitalize(mapUnitToLabel(u))).join(', ');
  
  return (
    <div className="ingredient-detail-page">
      <h1>{translatedIngredientName}</h1>
      
      <div className="ingredient-detail-content">
        {/* Left Column - Basic Information and Market Prices */}
        <div className="ingredient-left-column">
          <div className="ingredient-basic-info">
            <h2>{t('ingredientDetailBasicInfo')}</h2>
            <p><strong>{t("Category")}:</strong> {getCategoryLabel(ing.category)}</p>
            <p><strong>{t("Allergens")}:</strong> {(ing.allergens && ing.allergens.length > 0) ? ing.allergens.map(a => t(`allergen${sanitizeCategoryKey(a)}`, { defaultValue: a })).join(', ') : t('recipeDetailPageNone')}</p>
            <p><strong>{t("DietaryInfo")}:</strong> {(ing.dietary_info && ing.dietary_info.length > 0) ? ing.dietary_info.map(d => t(`dietaryInfo${sanitizeCategoryKey(d)}`, { defaultValue: d })).join(', ') : t('recipeDetailPageNone')}</p>
            <p><strong>{t('ingredientDetailBaseUnit')}:</strong> {displayBaseUnit}</p>
            <p><strong>{t('ingredientDetailAllUnits')}:</strong> {displayAllowedUnits}</p>
          </div>

          {/* Market Prices Section */}
          {ing.prices && (
            <div className="market-prices-section">

              <div className="market-prices-grid">
                {(() => {
                  // Find the cheapest market (exclude 'currency' key)
                  const prices = ing.prices;
                  const validPrices = Object.entries(prices)
                    .filter(([key, price]) => key !== 'currency' && price !== null && price !== undefined);
                  const cheapestPrice = Math.min(...validPrices.map(([_, price]) => price));
                  const cheapestMarket = validPrices.find(([_, price]) => price === cheapestPrice)?.[0];
                  const priceCurrency = ing.prices.currency || currency;
                  
                  return (
                    <>
                      <div className={`market-price-item ${cheapestMarket === 'A101' ? 'cheapest' : ''}`}>
                        <img src="/src/assets/market_logos/a101.png" alt="A101" className="market-logo" />
                        <span className="market-name">A101</span>
                        <span className="market-price">{ing.prices.A101 ? `${ing.prices.A101} ${priceCurrency}` : t('ingredientDetailNA')}</span>
                      </div>
                      <div className={`market-price-item ${cheapestMarket === 'SOK' ? 'cheapest' : ''}`}>
                        <img src="/src/assets/market_logos/sok.png" alt="ŞOK" className="market-logo" />
                        <span className="market-name">ŞOK</span>
                        <span className="market-price">{ing.prices.SOK ? `${ing.prices.SOK} ${priceCurrency}` : t('ingredientDetailNA')}</span>
                      </div>
                      <div className={`market-price-item ${cheapestMarket === 'BIM' ? 'cheapest' : ''}`}>
                        <img src="/src/assets/market_logos/bim.png" alt="BIM" className="market-logo" />
                        <span className="market-name">BIM</span>
                        <span className="market-price">{ing.prices.BIM ? `${ing.prices.BIM} ${priceCurrency}` : t('ingredientDetailNA')}</span>
                      </div>
                      <div className={`market-price-item ${cheapestMarket === 'MIGROS' ? 'cheapest' : ''}`}>
                        <img src="/src/assets/market_logos/migros.png" alt="MIGROS" className="market-logo" />
                        <span className="market-name">MIGROS</span>
                        <span className="market-price">{ing.prices.MIGROS ? `${ing.prices.MIGROS} ${priceCurrency}` : t('ingredientDetailNA')}</span>
                      </div>
                    </>
                  );
                })()}
              </div>
              <p className="price-quantity-info">
                {t('ingredientDetailPerQuantity', { quantity: displayBaseQuantity, unit: displayBaseUnit })}
              </p>
            </div>
          )}
        </div>

        {/* Right Column - Nutritional Information */}
        <div className="ingredient-right-column">
          {/* Nutritional Information Section */}
          {(() => {
            // Get nutrition data from nutrition_info (primary) or wikidata_info.nutrition (fallback)
            const nutritionData = ing.nutrition_info || (ing.wikidata_info && ing.wikidata_info.nutrition);
            
            return nutritionData && (
              <div className="nutrition-section">
                <h3>{t('ingredientDetailNutritionalTitle', { base: baseQuantityLabel })}</h3>
                <div className="nutrition-cards">
                  <>
                    {/* Calories */}
                    {nutritionData.calories !== null && nutritionData.calories !== undefined && (() => {
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
                            <span className="nutrition-label">{t('nutritionCalories')}</span>
                            <span className="nutrition-unit">kcal</span>
                          </div>
                        </div>
                      );
                    })()}
                    
                    {/* Protein */}
                    {nutritionData.protein !== null && nutritionData.protein !== undefined && (() => {
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
                            <span className="nutrition-label">{t('nutritionProtein')}</span>
                            <span className="nutrition-unit">g</span>
                          </div>
                        </div>
                      );
                    })()}
                    
                    {/* Fat */}
                    {nutritionData.fat !== null && nutritionData.fat !== undefined && (() => {
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
                            <span className="nutrition-label">{t('nutritionFat')}</span>
                            <span className="nutrition-unit">g</span>
                          </div>
                        </div>
                      );
                    })()}
                    
                    {/* Carbohydrates - support both 'carbohydrates' and 'carbs' */}
                    {((nutritionData.carbohydrates !== null && nutritionData.carbohydrates !== undefined) || 
                     (nutritionData.carbs !== null && nutritionData.carbs !== undefined)) && (() => {
                      const carbsValueRaw = nutritionData.carbohydrates !== null && nutritionData.carbohydrates !== undefined 
                        ? nutritionData.carbohydrates 
                        : nutritionData.carbs;
                      const carbsValue = typeof carbsValueRaw === 'number' 
                        ? carbsValueRaw 
                        : parseFloat(carbsValueRaw) || 0;
                      const { icon, sizeClass } = getNutritionIcon('carbs', carbsValue);
                      return (
                        <div className="nutrition-card carbs">
                          <div className={`nutrition-icon ${sizeClass}`}>{icon}</div>
                          <div className="nutrition-info">
                            <span className="nutrition-value">
                              {carbsValue.toFixed(1)}
                            </span>
                            <span className="nutrition-label">{t('nutritionCarbs')}</span>
                            <span className="nutrition-unit">g</span>
                          </div>
                        </div>
                      );
                    })()}
                  </>
                </div>
                
                {/* Show other nutrition info if available */}
                {Object.keys(nutritionData).filter(key => 
                  !['calories', 'protein', 'fat', 'carbohydrates', 'carbs'].includes(key)
                ).length > 0 && (
                  <div className="other-nutrition">
                    <h4>{t('ingredientDetailOtherNutrition')}</h4>
                    <div className="nutrition-grid">
                      {Object.entries(nutritionData)
                        .filter(([key]) => !['calories', 'protein', 'fat', 'carbohydrates', 'carbs'].includes(key))
                        .map(([key, value]) => (
                          <div key={key} className="nutrition-item">
                            <span className="nutrition-label">{key.charAt(0).toUpperCase() + key.slice(1)}</span>
                            <span className="nutrition-value">{value}</span>
                          </div>
                        ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })()}

          {/* Additional Wikidata Information */}
          {ing.wikidata_info && (
            <div className="wikidata-section">
              <h3>{t('ingredientDetailAdditionalInfo')}</h3>
              {ing.wikidata_info.wikidata_description && (
                <p><strong>{t('ingredientDetailDescription')}:</strong> {ing.wikidata_info.wikidata_description}</p>
              )}
              {ing.wikidata_info.origin && (
                <p><strong>{t('ingredientDetailOrigin')}:</strong> {ing.wikidata_info.origin}</p>
              )}
              {ing.wikidata_info.is_vegan !== null && (
                <p><strong>{t('ingredientDetailVegan')}:</strong> {ing.wikidata_info.is_vegan ? t('ingredientDetailYes') : t('ingredientDetailNo')}</p>
              )}
            </div>
          )}
        </div>
      </div>
      
      {/* Back Button at bottom */}
      <div className="back-button-container">
        <button 
          className="back-button" 
          onClick={() => {
            // Check if we came from shopping list
            const fromShoppingList = localStorage.getItem('shoppingListState');
            if (fromShoppingList) {
              navigate('/shopping-list');
            } else if (recipeId) {
              navigate(`/recipes/${recipeId}`);
            } else {
              navigate(-1); // Go back to previous page if no recipe ID
            }
          }}
        >
          ← {t("Back")}
        </button>
      </div>
      
    </div>
  );
};

export default IngredientDetailPage;
