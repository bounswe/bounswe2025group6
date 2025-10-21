import React, { useState, useEffect, useRef } from 'react';
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

  // Ingredients state
  const [ingredients, setIngredients] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [filteredIngredients, setFilteredIngredients] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [hasNextPage, setHasNextPage] = useState(false);
  const [selectedColumn, setSelectedColumn] = useState(0);
  const dropdownRef = useRef(null);

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

  // Fetch ingredients
  useEffect(() => {
    const fetchIngredients = async () => {
      try {
        let allData = [];
        let nextUrl = import.meta.env.VITE_API_URL + "/ingredients/";

        while (nextUrl) {
          const res = await fetch(nextUrl);
          if (!res.ok)
            throw new Error("API Error: ${res.status} ${res.statusText}");
          const data = await res.json();
          allData = [...allData, ...data.results];
          nextUrl = data.next;
        }

        const startIndex = (page - 1) * pageSize;
        const endIndex = startIndex + pageSize;
        const paginatedData = allData.slice(startIndex, endIndex);
        setIngredients(paginatedData);
        setHasNextPage(allData.length > endIndex);
        setLoading(false);
      } catch (err) {
        setError(err.message);
        setLoading(false);
      }
    };

    if (ingredients.length === 0) {
      setLoading(true);
    }
    fetchIngredients();
  }, [pageSize, selectedColumn, page]);

  // Filter ingredients based on search
  useEffect(() => {
    if (searchQuery.trim() === "") {
      setFilteredIngredients(ingredients);
    } else {
      setFilteredIngredients(
        ingredients.filter((ingredient) =>
          ingredient.name?.toLowerCase().includes(searchQuery.toLowerCase())
        )
      );
    }
  }, [searchQuery, ingredients]);

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

        // Steps should already be an array from backend
        let steps = recipe.steps;
        
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

  const handleAddIngredient = (ingredient) => {
    if (!ingredient || !ingredient.id) return;

    if (recipeData.ingredients.some((ing) => ing.id === ingredient.id)) {
      toast.error("This ingredient is already added");
      return;
    }

    setRecipeData((prev) => ({
      ...prev,
      ingredients: [
        ...prev.ingredients,
        {
          ingredient_name: ingredient.name,
          id: ingredient.id,
          quantity: "1",
          unit: "pcs",
        },
      ],
    }));
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
      <h1>{t("editRecipePageHeader")}</h1>
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
          <label htmlFor="prep_time">{t("uploadRecipePagePrepTime")} *</label>
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

        <div className="form-group ingredients-section">
          <label>{t("uploadRecipePageIngredients")} *</label>
          <div className="ingredient-search">
            <input
              type="text"
              placeholder="Search ingredients..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => setShowDropdown(true)}
              className="search-input"
            />
            {showDropdown && filteredIngredients.length > 0 && (
              <ul className="ingredients-dropdown" ref={dropdownRef}>
                {filteredIngredients.map((ingredient) => (
                  <li
                    key={ingredient.id}
                    onClick={() => {
                      handleAddIngredient(ingredient);
                      setSearchQuery("");
                      setShowDropdown(false);
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
                        quantity: e.target.value,
                      };
                      setRecipeData((prev) => ({
                        ...prev,
                        ingredients: newIngredients,
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
                        unit: e.target.value,
                      };
                      setRecipeData((prev) => ({
                        ...prev,
                        ingredients: newIngredients,
                      }));
                    }}
                    className="unit-select"
                  >
                    <option value="pcs">{t("Pcs")}</option>
                    <option value="g">g</option>
                    <option value="kg">kg</option>
                    <option value="ml">ml</option>
                    <option value="l">l</option>
                    <option value="cup">{t("Cup")}</option>
                    <option value="tbsp">{t("Tbsp")}</option>
                    <option value="tsp">{t("Tsp")}</option>
                  </select>
                  <button
                    type="button"
                    onClick={() => {
                      setRecipeData((prev) => ({
                        ...prev,
                        ingredients: prev.ingredients.filter(
                          (i) => i.id !== ing.id
                        ),
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
