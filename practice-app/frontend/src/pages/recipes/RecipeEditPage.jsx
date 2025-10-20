import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getRecipeById, updateRecipe } from '../../services/recipeService';
import { getCurrentUser } from '../../services/authService';
import '../../styles/UploadRecipePage.scss';
import { useToast } from '../../components/ui/Toast';
import { useTranslation } from "react-i18next";

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000'

const RecipeEditPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { t } = useTranslation();

  const [recipeData, setRecipeData] = useState({
    name: '',
    image: null, // File object for image upload
    imagePreview: null, // URL for image preview
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

        // Handle different formats of steps
        let steps = recipe.steps;
        
        if (typeof steps === 'string') {
          // If it's a string, try to parse it as JSON
          try {
            steps = JSON.parse(steps);
          } catch (e) {
            // If JSON parsing fails, split by comma and clean up
            steps = steps
              .replace(/[\[\]"]/g, '') // Remove brackets and quotes
              .split(',')
              .map(step => step.trim())
              .filter(step => step.length > 0);
          }
        }
        
        // Ensure it's an array
        if (!Array.isArray(steps)) {
          steps = [];
        }
        
        // Transform steps array to text
        const stepsText = steps.join('\n');

        setRecipeData({
          name: recipe.name,
          image: null, // No new file selected yet
          imagePreview: recipe.image_full_url || null, // Show existing image
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

  // Handle image file selection
  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate file type
    if (!file.type.match('image.*')) {
      toast.error('Please select an image file (PNG or JPG)');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image must be less than 5MB');
      return;
    }

    // Create preview URL
    const previewUrl = URL.createObjectURL(file);

    setRecipeData((prev) => ({
      ...prev,
      image: file,
      imagePreview: previewUrl,
      image_url: '' // Clear URL if file is selected
    }));
  };

  // Handle image removal
  const handleImageRemove = () => {
    if (recipeData.imagePreview && recipeData.image) {
      URL.revokeObjectURL(recipeData.imagePreview);
    }
    
    setRecipeData((prev) => ({
      ...prev,
      image: null,
      imagePreview: null // Clear preview
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

      const updateData = {
        name: recipeData.name,
        steps: processedSteps,
        prep_time: parseInt(recipeData.prep_time),
        cooking_time: parseInt(recipeData.cooking_time),
        meal_type: recipeData.meal_type,
        ingredients: recipeData.ingredients,
        image: recipeData.image // File object for image upload
      };

      const updatedRecipe = await updateRecipe(id, updateData);
      toast.success('Recipe updated successfully!');
      navigate(`/recipes/${updatedRecipe.id}`);
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
      <h1>{t("uploadRecipePageHeader")}</h1>
      <form onSubmit={handleSubmit} className="upload-form">
        <div className="form-group">
          <label htmlFor="name">{t("uploadRecipePageName")} *</label>
          <input 
            id="name" 
            name="name" 
            value={recipeData.name} 
            onChange={handleChange} 
            required 
          />
        </div>

        <div className="form-group">
          <label htmlFor="image">{t("uploadRecipePageImage")}</label>
          <div className="image-upload-container">
            {recipeData.imagePreview ? (
              <div className="image-preview">
                <img 
                  src={recipeData.imagePreview} 
                  alt="Recipe preview" 
                  className="preview-image"
                />
                <button 
                  type="button" 
                  onClick={handleImageRemove}
                  className="remove-image-btn"
                  title="Remove Image"
                >
                </button>
              </div>
            ) : (
              <div className="image-upload-area">
                <input
                  id="image"
                  name="image"
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="image-input"
                />
                <label htmlFor="image" className="image-upload-label">
                  <span>📷</span>
                  <span>{t("uploadRecipePageImageInfo")}</span>
                </label>
              </div>
            )}
          </div>
        </div>

        <div className="form-group">
          <label htmlFor="cooking_time">{t("uploadRecipePageCookingTime")} *</label>
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
          <label htmlFor="prep_time">{t("uploadRecipePagePrepTime")} (minutes) *</label>
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
          <label htmlFor="meal_type">{t("uploadRecipePageMealType")} *</label>
          <select 
            id="meal_type" 
            name="meal_type" 
            value={recipeData.meal_type} 
            onChange={handleChange} 
            required
          >
            <option value="">{t("uploadRecipePageMealTypeSelect")}</option>
            <option value="breakfast">{t("breakfast")}</option>
            <option value="lunch">{t("Lunch")}</option>
            <option value="dinner">{t("Dinner")}</option>
          </select>
        </div>

        <div className="form-group">
          <label htmlFor="steps">{t("uploadRecipePageSteps")} *</label>
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
          <button type="button" onClick={() => navigate(`/recipes/${id}`)}>{t("Cancel")}</button>
          <button type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default RecipeEditPage;
