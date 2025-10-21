import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getIngredientById } from '../../services/ingredientService';
import '../../styles/IngredientDetailPage.css';
import { useTranslation } from "react-i18next";

const IngredientDetailPage = () => {
  const { t } = useTranslation();
  const { id } = useParams();
  const navigate = useNavigate();
  const [ing, setIng] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    getIngredientById(id)
      .then(data => setIng(data))
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    if (ing) {
      document.title = `Ingredient | ${ing.name}`;
    }
  }, [ing]);

  if (loading) return <div>{t("loading")}...</div>;
  if (error) return <div className="text-red-500">{t("Error")}: {error}</div>;
  if (!ing) return <div>{t("NotFound")}</div>;

  return (
    <div className="ingredient-detail-page">
      <h1>{ing.name}</h1>
      <p><strong>{t("Category")}:</strong> {ing.category}</p>
      <p><strong>{t("Allergens")}:</strong> {ing.allergens.join(', ') || 'None'}</p>
      <p><strong>{t("DietaryInfo")}:</strong> {ing.dietary_info.join(', ')}</p>
      <p><small>{t("Created")}: {new Date(ing.created_at).toLocaleString()}</small></p>
      <button
        className="ingredient-back-btn"
        onClick={() => navigate('/ingredients')}
        style={{
          marginTop: '1.5rem',
          padding: '0.5rem 1.25rem',
          borderRadius: '0.5rem',
          border: 'none',
          background: '#ffffff',
          color: '#256029',
          fontWeight: 600,
          cursor: 'pointer'
        }}
      >
        ← {t("Back")}
      </button>
    </div>
  );
};

export default IngredientDetailPage;