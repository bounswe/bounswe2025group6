import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getIngredientById } from '../../services/ingredientService';
import { useCurrency } from '../../contexts/CurrencyContext';
import '../../styles/IngredientDetailPage.css';
import { useTranslation } from "react-i18next";

const IngredientDetailPage = () => {
  const { t } = useTranslation();
  const { id } = useParams();
  const navigate = useNavigate();
  const { currency } = useCurrency();
  const [ing, setIng] = useState(null);
  const [error, setError] = useState(null);
  const [isPageReady, setIsPageReady] = useState(false);
  
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
      document.title = `Ingredient | ${ing.name}`;
    }
  }, [ing]);

  // Show loading only if we're actually loading and don't have data
  if (!isPageReady && !ing) return null;
  
  if (error) return <div className="text-red-500">{t("Error")}: {error}</div>;
  if (!ing) return <div>{t("NotFound")}</div>;

  return (
    <div className="ingredient-detail-page">
      <h1>{ing.name}</h1>
      
      <div className="ingredient-detail-content">
        {/* Left Column - Basic Information */}
        <div className="ingredient-basic-info">
          <h2>Basic Information</h2>
          <p><strong>{t("Category")}:</strong> {ing.category}</p>
          <p><strong>{t("Allergens")}:</strong> {ing.allergens.join(', ') || 'None'}</p>
          <p><strong>{t("DietaryInfo")}:</strong> {ing.dietary_info.join(', ')}</p>
          <p><strong>Base Unit:</strong> {ing.base_unit}</p>
          <p><strong>Allowed Units:</strong> {ing.allowed_units.join(', ')}</p>
          <p><small>{t("Created")}: {new Date(ing.created_at).toLocaleString()}</small></p>
        </div>

        {/* Right Column - Prices and Nutrition */}
        <div className="ingredient-details-info">
          {/* Market Prices Section */}
          {ing.prices && (
            <div className="market-prices-section">
              <h3>Market Prices ({currency})</h3>
              <div className="market-prices-grid">
                {(() => {
                  // Find the cheapest market
                  const prices = ing.prices;
                  const validPrices = Object.entries(prices).filter(([_, price]) => price !== null && price !== undefined);
                  const cheapestPrice = Math.min(...validPrices.map(([_, price]) => price));
                  const cheapestMarket = validPrices.find(([_, price]) => price === cheapestPrice)?.[0];
                  
                  return (
                    <>
                      <div className={`market-price-item ${cheapestMarket === 'A101' ? 'cheapest' : ''}`}>
                        <img src="/src/assets/market_logos/a101.png" alt="A101" className="market-logo" />
                        <span className="market-name">A101</span>
                        <span className="market-price">{ing.prices.A101 ? `${ing.prices.A101} ${currency}` : 'N/A'}</span>
                      </div>
                      <div className={`market-price-item ${cheapestMarket === 'SOK' ? 'cheapest' : ''}`}>
                        <img src="/src/assets/market_logos/sok.png" alt="ŞOK" className="market-logo" />
                        <span className="market-name">ŞOK</span>
                        <span className="market-price">{ing.prices.SOK ? `${ing.prices.SOK} ${currency}` : 'N/A'}</span>
                      </div>
                      <div className={`market-price-item ${cheapestMarket === 'BIM' ? 'cheapest' : ''}`}>
                        <img src="/src/assets/market_logos/bim.png" alt="BIM" className="market-logo" />
                        <span className="market-name">BIM</span>
                        <span className="market-price">{ing.prices.BIM ? `${ing.prices.BIM} ${currency}` : 'N/A'}</span>
                      </div>
                      <div className={`market-price-item ${cheapestMarket === 'MIGROS' ? 'cheapest' : ''}`}>
                        <img src="/src/assets/market_logos/migros.png" alt="MIGROS" className="market-logo" />
                        <span className="market-name">MIGROS</span>
                        <span className="market-price">{ing.prices.MIGROS ? `${ing.prices.MIGROS} ${currency}` : 'N/A'}</span>
                      </div>
                    </>
                  );
                })()}
              </div>
            </div>
          )}

          {/* Nutritional Information Section */}
          {ing.wikidata_info && ing.wikidata_info.nutrition && (
            <div className="nutrition-section">
              <h3>Nutritional Information (per 100g)</h3>
              <div className="nutrition-grid">
                {Object.entries(ing.wikidata_info.nutrition).map(([key, value]) => (
                  <div key={key} className="nutrition-item">
                    <span className="nutrition-label">{key.charAt(0).toUpperCase() + key.slice(1)}</span>
                    <span className="nutrition-value">{value}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Additional Wikidata Information */}
          {ing.wikidata_info && (
            <div className="wikidata-section">
              <h3>Additional Information</h3>
              {ing.wikidata_info.wikidata_description && (
                <p><strong>Description:</strong> {ing.wikidata_info.wikidata_description}</p>
              )}
              {ing.wikidata_info.origin && (
                <p><strong>Origin:</strong> {ing.wikidata_info.origin}</p>
              )}
              {ing.wikidata_info.is_vegan !== null && (
                <p><strong>Vegan:</strong> {ing.wikidata_info.is_vegan ? 'Yes' : 'No'}</p>
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
            if (recipeId) {
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