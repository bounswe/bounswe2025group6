// src/pages/recipes/UploadRecipePage.jsx

import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { addRecipe } from '../../services/recipeService';
import IngredientList from '../../components/recipe/IngredientList';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import { useToast } from '../../components/ui/Toast';
import '../../styles/RecipePages.css';
import '../../styles/UploadRecipePage.scss';

const UploadRecipePage = () => {
  const navigate = useNavigate();
  const toast = useToast();
  const [recipeData, setRecipeData] = useState({
    title: '',
    description: '',
    imageUrl: '',
    ingredients: [{ name: '', quantity: '' }],
    instructions: '',
    badges: [],
    costPerServing: '',
    preparationTime: '',
    nutrition: { calories: '', protein: '', carbs: '', fat: '' }
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const badgeOptions = ['High Protein', 'Low Carbohydrate', 'Vegetarian', 'Vegan', 'Gluten-Free', 'Quick', 'Budget-Friendly'];
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredIngredients, setFilteredIngredients] = useState([]);
  const [allIngredients, setAllIngredients] = useState([]);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const fetchAllIngredients = async () => {
      try {
        let allData = [];
        let nextUrl = 'http://localhost:8000/ingredients/';

        while (nextUrl) {
          const res = await fetch(nextUrl);
          if (!res.ok) {
            throw new Error(`API Error: ${res.status} ${res.statusText}`);
          }
          const data = await res.json();
          allData = [...allData, ...data.results];
          nextUrl = data.next;
        }
        setAllIngredients(allData);
      } catch (error) {
        console.error('Error fetching all ingredients:', error);
      }
    };

    fetchAllIngredients();
  }, []);

  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredIngredients([]); // Arama kutusu boşsa hiçbir şey gösterme
    } else {
      const filtered = allIngredients.filter((ingredient) =>
        ingredient.name?.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredIngredients(filtered);
    }
  }, [searchQuery, allIngredients]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setFilteredIngredients([]);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);


  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name.startsWith('nutrition.')) {
      const nutritionField = name.split('.')[1];
      setRecipeData(prev => ({
        ...prev,
        nutrition: { ...prev.nutrition, [nutritionField]: value }
      }));
    } else {
      setRecipeData(prev => ({ ...prev, [name]: value }));
    }
  };

  const toggleBadge = (badge) => {
    setRecipeData(prev => {
      const badges = prev.badges.includes(badge)
        ? prev.badges.filter(b => b !== badge)
        : [...prev.badges, badge];
      return { ...prev, badges };
    });
  };

  const handleAddIngredient = (ingredient) => {
    setRecipeData((prev) => ({
      ...prev,
      ingredients: [...prev.ingredients, { name: ingredient.name, quantity: '' }]

    }));
  };

  const handleUpdateIngredient = (index, data) => {
    setRecipeData(prev => {
      const updatedIngredients = [...prev.ingredients];
      updatedIngredients[index] = { ...updatedIngredients[index], ...data };
      return { ...prev, ingredients: updatedIngredients };
    });
  };

  const handleDeleteIngredient = (index) => {
    setRecipeData(prev => {
      const updatedIngredients = prev.ingredients.filter((_, i) => i !== index);
      return { ...prev, ingredients: updatedIngredients };
    });
  };

  const validateForm = () => {
    if (!recipeData.title.trim()) return toast.error('Please provide a recipe title'), false;
    if (!recipeData.description.trim()) return toast.error('Please provide a recipe description'), false;
    if (!recipeData.instructions.trim()) return toast.error('Please provide recipe instructions'), false;
    if (!recipeData.costPerServing) return toast.error('Please provide cost per serving'), false;
    if (!recipeData.preparationTime) return toast.error('Please provide preparation time'), false;
    if (recipeData.ingredients.some(ing => !ing.name.trim() || !ing.quantity.trim())) {
      toast.error('Please complete all ingredient fields');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;
    setIsSubmitting(true);
    try {
      const recipeToSubmit = {
        ...recipeData,
        costPerServing: parseFloat(recipeData.costPerServing),
        preparationTime: parseInt(recipeData.preparationTime, 10),
        nutrition: {
          calories: parseInt(recipeData.nutrition.calories, 10) || 0,
          protein: parseInt(recipeData.nutrition.protein, 10) || 0,
          carbs: parseInt(recipeData.nutrition.carbs, 10) || 0,
          fat: parseInt(recipeData.nutrition.fat, 10) || 0
        },
        createdBy: 'CurrentUser'
      };
      const newRecipe = await addRecipe(recipeToSubmit);
      toast.success('Recipe uploaded successfully!');
      navigate(`/recipes/${newRecipe.id}`);
    } catch (error) {

      toast.error('Failed to upload recipe');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="upload-page-container">
      <Card>
        <Card.Header>
          <h1 className="upload-title">Upload a New Recipe</h1>
        </Card.Header>
        <Card.Body>
          <form onSubmit={handleSubmit} className="upload-form">
            <div className="upload-section">
              <label htmlFor="title">Recipe Title *</label>
              <input id="title" name="title" value={recipeData.title} onChange={handleChange} />
              <label htmlFor="description">Description *</label>
              <textarea id="description" name="description" value={recipeData.description} onChange={handleChange} />
              <label htmlFor="imageUrl">Image URL</label>
              <input id="imageUrl" name="imageUrl" value={recipeData.imageUrl} onChange={handleChange} />
              {recipeData.imageUrl && <img src={recipeData.imageUrl} alt="Preview" className="upload-image-preview" onError={(e) => { e.target.src = 'https://via.placeholder.com/400x300?text=Invalid+Image+URL'; }} />}
            </div>
            <div className="upload-section grid-2">
              <div>
                <label htmlFor="costPerServing">Cost per Serving (₺) *</label>
                <input id="costPerServing" name="costPerServing" type="number" value={recipeData.costPerServing} onChange={handleChange} />
              </div>
              <div>
                <label htmlFor="preparationTime">Preparation Time (minutes) *</label>
                <input id="preparationTime" name="preparationTime" type="number" value={recipeData.preparationTime} onChange={handleChange} />
              </div>
            </div>
            <div className="upload-section">
              <label>Dietary Information & Tags</label>
              <div className="upload-tags">
                {badgeOptions.map(badge => (
                  <button type="button" key={badge} onClick={() => toggleBadge(badge)} className={`tag-button ${recipeData.badges.includes(badge) ? 'selected' : ''}`}>{badge}</button>
                ))}
              </div>
            </div>
            <div className="upload-section">
              <label>Ingredients *</label>
              <input
                type="text"
                placeholder="Add ingredients..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="searchboxUpload"
              />
              {filteredIngredients.length > 0 && (
                <ul className="dropdown" ref={dropdownRef}>
                  {filteredIngredients.map((ingredient) => (
                    <li
                      key={ingredient.id}
                      onClick={() => {
                        handleAddIngredient(ingredient);
                        setSearchQuery('');
                        setFilteredIngredients([]);
                      }}
                    >
                      {ingredient.name}
                    </li>
                  ))}
                </ul>
              )}
            </div>
            <div className="upload-section">

              <IngredientList ingredients={recipeData.ingredients} editable onAdd={handleAddIngredient} onUpdate={handleUpdateIngredient} onDelete={handleDeleteIngredient} />
            </div>
            <div className="upload-section">
              <label htmlFor="instructions">Instructions *</label>
              <textarea id="instructions" name="instructions" value={recipeData.instructions} onChange={handleChange} />
              <p className="tip">Tip: Number your steps for clarity (e.g., "1. Preheat oven...")</p>
            </div>
            <div className="upload-section">
              <h3>Nutrition Information (per serving)</h3>
              <div className="nutrition-grid">
                {['calories', 'protein', 'carbs', 'fat'].map(nutrient => (
                  <div key={nutrient}>
                    <label htmlFor={nutrient}>{nutrient.charAt(0).toUpperCase() + nutrient.slice(1)}</label>
                    <input type="number" id={nutrient} name={`nutrition.${nutrient}`} value={recipeData.nutrition[nutrient]} onChange={handleChange} />
                  </div>
                ))}
              </div>
            </div>
            <div className="upload-buttons">
              <Button type="button" variant="secondary" onClick={() => navigate('/recipes')}>Cancel</Button>
              <Button type="submit" disabled={isSubmitting}>{isSubmitting ? 'Uploading...' : 'Upload Recipe'}</Button>
            </div>
          </form>
        </Card.Body>
      </Card>
    </div>
  );
};

export default UploadRecipePage;