import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getRecipeById } from '../../services/recipeService';
import { getCurrentUser } from '../../services/authService';
import '../../styles/UploadRecipePage.scss';
import { useToast } from '../../components/ui/Toast';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000'

const RecipeEditPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [recipeData, setRecipeData] = useState({
    name: '',
    image_url: '',
    cooking_time: '',
    prep_time: '',
    meal_type: '',
    ingredients: [],
    stepsText: '',
  });

  useEffect(() => {
    const loadRecipe = async () => {
      try {
        setLoading(true);
        const recipe = await getRecipeById(Number(id));
        
        // Check if the user is authorized to edit
        const currentUser = await getCurrentUser();
        if (!currentUser || currentUser.id !== recipe.creator_id) {
          toast.error('You can only edit recipes that you created');
          navigate(`/recipes/${id}`);
          return;
        }

        // Transform steps array to text
        const stepsText = recipe.steps.join('\n');

        setRecipeData({
          name: recipe.name,
          image_url: recipe.image_url || '',
          cooking_time: recipe.cook_time,
          prep_time: recipe.prep_time,
          meal_type: recipe.meal_type,
          ingredients: recipe.ingredients.map(ing => ({
            id: ing.ingredient.id,
            ingredient_name: ing.ingredient.name,
            quantity: ing.quantity,
            unit: ing.unit
          })),
          stepsText
        });
      } catch (err) {
        setError(err.message);
        toast.error('Failed to load recipe');
      } finally {
        setLoading(false);
      }
    };

    loadRecipe();
  }, [id, navigate]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    if ((name === 'cooking_time' || name === 'prep_time') && !/^\d*\.?\d*$/.test(value)) {
      return;
    }
    
    setRecipeData(prev => ({ ...prev, [name]: value }));
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

      const updateData = {
        ...recipeData,
        steps: processedSteps,
        cook_time: parseInt(recipeData.cooking_time),
      };

      const response = await fetch(`${API_BASE}/recipes/${id}/`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('fithub_access_token')}`
        },
        body: JSON.stringify(updateData)
      });

      if (!response.ok) {
        throw new Error('Failed to update recipe');
      }

      toast.success('Recipe updated successfully!');
      navigate(`/recipes/${id}`);
    } catch (error) {
      toast.error(error.message || 'Failed to update recipe');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) return <div>Loading recipe...</div>;
  if (error) return <div className="text-red-500">Error: {error}</div>;

  return (
    <div className="upload-page-container">
      <h1>Edit Recipe</h1>
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

        <div className="form-group">
          <label htmlFor="steps">Recipe Steps *</label>
          <textarea
            id="steps"
            name="stepsText"
            value={recipeData.stepsText}
            onChange={handleChange}
            placeholder="Enter each step on a new line"
            required
            rows={5}
            className="steps-input"
          />
        </div>

        <div className="form-actions">
          <button type="button" onClick={() => navigate(`/recipes/${id}`)}>Cancel</button>
          <button type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default RecipeEditPage;
