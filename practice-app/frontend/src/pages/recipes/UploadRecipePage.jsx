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
    description: '', // This field is not in the POST /recipes/ API
    imageUrl: '', // This field is not in the POST /recipes/ API
    ingredients: [{ name: '', quantity: '', unit: 'pcs' }],
    instructions: '',
    badges: [], // This field is not in the POST /recipes/ API
    costPerServing: '', // This field is not in the POST /recipes/ API
    preparationTime: '', // Will be prep_time
    cookTime: '', // New field for cook_time
    mealType: 'breakfast', // New field for meal_type, with default
    nutrition: { calories: '', protein: '', carbs: '', fat: '' } // This field is not in the POST /recipes/ API
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
      ingredients: [...prev.ingredients, { name: '', quantity: '', unit: 'pcs' }]
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
    // description is not sent to API
    if (!recipeData.instructions.trim()) return toast.error('Please provide recipe instructions'), false;
    // costPerServing is not sent to API
    if (!recipeData.preparationTime) return toast.error('Please provide preparation time'), false;
    if (!recipeData.cookTime) return toast.error('Please provide cooking time'), false;
    if (!recipeData.mealType) return toast.error('Please select a meal type'), false;
    if (recipeData.ingredients.some(ing => !ing.name.trim() || !ing.quantity.trim() || !ing.unit.trim())) {
      toast.error('Please complete all ingredient fields, including units');
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
        name: recipeData.title,
        steps: recipeData.instructions.split('\n').filter(step => step.trim() !== ''),
        prep_time: parseInt(recipeData.preparationTime, 10),
        cook_time: parseInt(recipeData.cookTime, 10),
        meal_type: recipeData.mealType,
        ingredients: recipeData.ingredients.map(ing => ({
          ingredient_name: ing.name,
          quantity: parseFloat(ing.quantity) || 0, // Ensure quantity is a number
          unit: ing.unit
        })),
        // Fields like description, imageUrl, badges, costPerServing, nutrition are not sent
        // as they are not in the POST /recipes/ API documentation.
        // The 'creator' field is handled by the backend.
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
              <input id="title" name="title" value={recipeData.title} onChange={handleChange} required />
              <label htmlFor="description">Description</label>
              <textarea id="description" name="description" value={recipeData.description} onChange={handleChange} />
              <label htmlFor="imageUrl">Image URL</label>
              <input id="imageUrl" name="imageUrl" value={recipeData.imageUrl} onChange={handleChange} />
              {recipeData.imageUrl && <img src={recipeData.imageUrl} alt="Preview" className="upload-image-preview" onError={(e) => { e.target.src = 'https://via.placeholder.com/400x300?text=Invalid+Image+URL'; }} />}
            </div>
            <div className="upload-section grid-2">
              <div>
                <label htmlFor="preparationTime">Preparation Time (minutes) *</label>
                <input id="preparationTime" name="preparationTime" type="number" value={recipeData.preparationTime} onChange={handleChange} required />
              </div>
              <div>
                <label htmlFor="cookTime">Cooking Time (minutes) *</label>
                <input id="cookTime" name="cookTime" type="number" value={recipeData.cookTime} onChange={handleChange} required />
              </div>
            </div>
            <div className="upload-section">
              <label htmlFor="mealType">Meal Type *</label>
              <select id="mealType" name="mealType" value={recipeData.mealType} onChange={handleChange} required>
                <option value="breakfast">Breakfast</option>
                <option value="lunch">Lunch</option>
                <option value="dinner">Dinner</option>
                <option value="snack">Snack</option> 
                {/* Add other meal types if supported by backend */}
              </select>
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
              <textarea id="instructions" name="instructions" value={recipeData.instructions} onChange={handleChange} required />
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