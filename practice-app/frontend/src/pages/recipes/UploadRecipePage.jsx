// src/pages/recipes/UploadRecipePage.jsx

import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { addRecipe } from '../../services/recipeService';
import IngredientList from '../../components/recipe/IngredientList';
import { useToast } from '../../components/ui/Toast';
import '../../styles/UploadRecipePage.scss';

const UploadRecipePage = () => {
  const navigate = useNavigate();
  const toast = useToast();
  const [ingredients, setIngredients] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [selectedColumn, setSelectedColumn] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [recipeData, setRecipeData] = useState({
    name: '',
    image_url: '',
    cooking_time: '',
    prep_time: '',
    meal_type: '',
    ingredients: [],
    steps: [], // This will hold the final array
    stepsText: '' // This will hold the raw textarea input
  });

  const [searchQuery, setSearchQuery] = useState('');
  const [filteredIngredients, setFilteredIngredients] = useState([]);
  const [allIngredients, setAllIngredients] = useState([]);
  const dropdownRef = useRef(null);

  // Fetch ingredients
  useEffect(() => {
    const fetchAllIngredients = async () => {
      try {
        setLoading(true);
        
        const res = await fetch('http://localhost:8000/ingredients/?page=1&page_size=100');
        if (!res.ok) throw new Error(`API Error: ${res.status} ${res.statusText}`);
        
        const data = await res.json();
        setAllIngredients(data.results);
        setIngredients(data.results);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching ingredients:', err);
        setLoading(false);
      }
    };

    fetchAllIngredients();
  }, []);

  // Filter ingredients based on search
  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredIngredients([]);
    } else {
      const filtered = allIngredients.filter((ingredient) =>
        ingredient.name?.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredIngredients(filtered);
    }
  }, [searchQuery, allIngredients]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    // Validate time inputs (cooking_time and prep_time)
    if (name === 'cooking_time' || name === 'prep_time') {
      // Only allow numbers and decimal points
      if (!/^\d*\.?\d*$/.test(value)) {
        return; // Don't update if input contains non-numeric characters
      }
      
      // Prevent negative values
      if (parseFloat(value) < 0) {
        return;
      }
    }
    
    setRecipeData(prev => ({ ...prev, [name]: value }));
  };

  const handleAddIngredient = (ingredient) => {
    if (!ingredient || !ingredient.id) return;
    
    if (recipeData.ingredients.some(ing => ing.id === ingredient.id)) {
      toast.error('This ingredient is already added');
      return;
    }

    setRecipeData(prev => ({
      ...prev,
      ingredients: [...prev.ingredients, { 
        ingredient_name: ingredient.name,
        id: ingredient.id,
        quantity: '1',
        unit: 'pcs'
      }]
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Process steps text into array
      const processedSteps = recipeData.stepsText
        .split('\n')
        .map(step => step.trim())
        .filter(step => step.length > 0);

      // Create submission data with processed steps
      const submissionData = {
        ...recipeData,
        steps: processedSteps
      };

      const newRecipe = await addRecipe(submissionData);
      toast.success('Recipe uploaded successfully!');
      navigate(`/recipes/${newRecipe.id}`);
    } catch (error) {
      toast.error(error.message || 'Failed to upload recipe');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="upload-page-container">
      <h1>Upload a New Recipe</h1>
      <form onSubmit={handleSubmit} className="upload-form">
        <div className="form-group">
          <label htmlFor="name">Recipe Name *</label>
          <input 
            id="name" 
            name="name" 
            value={recipeData.name} 
            onChange={handleChange} 
            required 
          />
        </div>

        <div className="form-group">
          <label htmlFor="image_url">Image URL</label>
          <input 
            id="image_url" 
            name="image_url" 
            value={recipeData.image_url} 
            onChange={handleChange} 
          />
        </div>

        <div className="form-group">
          <label htmlFor="cooking_time">Cooking Time (minutes) *</label>
          <input 
            id="cooking_time" 
            name="cooking_time" 
            type="number" 
            value={recipeData.cooking_time} 
            onChange={handleChange} 
            required 
            min="0"
            step="0.1"
            pattern="[0-9]*\.?[0-9]*"
            onKeyPress={(e) => {
              if (!/[\d.]/.test(e.key)) {
                e.preventDefault();
              }
            }}
          />
        </div>

        <div className="form-group">
          <label htmlFor="prep_time">Prep Time (minutes) *</label>
          <input 
            id="prep_time" 
            name="prep_time" 
            type="number" 
            value={recipeData.prep_time} 
            onChange={handleChange} 
            required 
            min="0"
            step="0.1"
            pattern="[0-9]*\.?[0-9]*"
            onKeyPress={(e) => {
              if (!/[\d.]/.test(e.key)) {
                e.preventDefault();
              }
            }}
          />
        </div>

        <div className="form-group">
          <label htmlFor="meal_type">Meal Type *</label>
          <select 
            id="meal_type" 
            name="meal_type" 
            value={recipeData.meal_type} 
            onChange={handleChange} 
            required
          >
            <option value="">Select meal type</option>
            <option value="breakfast">Breakfast</option>
            <option value="lunch">Lunch</option>
            <option value="dinner">Dinner</option>
          </select>
        </div>

        <div className="form-group ingredients-section">
          <label>Ingredients *</label>
          <div className="ingredient-search">
            <input
              type="text"
              placeholder="Search ingredients..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="search-input"
            />
            {filteredIngredients.length > 0 && (
              <ul className="ingredients-dropdown" ref={dropdownRef}>
                {filteredIngredients.map((ingredient) => (
                  <li
                    key={ingredient.id}
                    onClick={() => {
                      handleAddIngredient(ingredient);
                      setSearchQuery('');
                      setFilteredIngredients([]);
                    }}
                    className="ingredient-option"
                  >
                    {ingredient.name}
                  </li>
                ))}
              </ul>
            )}
          </div>
          
          {recipeData.ingredients.length > 0 && (
            <div className="selected-ingredients">
              {recipeData.ingredients.map((ing, index) => (
                <div key={ing.id} className="ingredient-item">
                  <span className="ingredient-name">{ing.ingredient_name}</span>
                  <input
                    type="number"
                    value={ing.quantity}
                    onChange={(e) => {
                      // Only allow numbers and decimal points
                      if (!/^\d*\.?\d*$/.test(e.target.value)) {
                        return;
                      }
                      
                      // Prevent negative values
                      if (parseFloat(e.target.value) < 0) {
                        return;
                      }

                      const newIngredients = [...recipeData.ingredients];
                      newIngredients[index] = {
                        ...ing,
                        quantity: e.target.value
                      };
                      setRecipeData(prev => ({
                        ...prev,
                        ingredients: newIngredients
                      }));
                    }}
                    onKeyPress={(e) => {
                      if (!/[\d.]/.test(e.key)) {
                        e.preventDefault();
                      }
                    }}
                    className="quantity-input"
                    min="0"
                    step="0.1"
                    pattern="[0-9]*\.?[0-9]*"
                  />
                  <select
                    value={ing.unit}
                    onChange={(e) => {
                      const newIngredients = [...recipeData.ingredients];
                      newIngredients[index] = {
                        ...ing,
                        unit: e.target.value
                      };
                      setRecipeData(prev => ({
                        ...prev,
                        ingredients: newIngredients
                      }));
                    }}
                    className="unit-select"
                  >
                    <option value="pcs">pcs</option>
                    <option value="g">g</option>
                    <option value="kg">kg</option>
                    <option value="ml">ml</option>
                    <option value="l">l</option>
                    <option value="cup">cup</option>
                    <option value="tbsp">tbsp</option>
                    <option value="tsp">tsp</option>
                  </select>
                  <button
                    type="button"
                    onClick={() => {
                      setRecipeData(prev => ({
                        ...prev,
                        ingredients: prev.ingredients.filter(i => i.id !== ing.id)
                      }));
                    }}
                    className="remove-ingredient"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="form-group">
          <label htmlFor="steps">Recipe Steps *</label>
          <textarea
            id="steps"
            name="stepsText" // Changed from steps to stepsText
            value={recipeData.stepsText}
            onChange={(e) => {
              setRecipeData(prev => ({
                ...prev,
                stepsText: e.target.value
              }));
            }}
            placeholder="Enter each step on a new line"
            required
            rows={5}
            className="steps-input"
          />
        </div>

        <div className="form-actions">
          <button type="button" onClick={() => navigate('/recipes')}>Cancel</button>
          <button type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Uploading...' : 'Upload Recipe'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default UploadRecipePage;
