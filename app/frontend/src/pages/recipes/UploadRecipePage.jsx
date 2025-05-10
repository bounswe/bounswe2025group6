import React, { useState } from 'react';
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
    name: '',
    steps: '',
    prep_time: '',
    cook_time: '',
    meal_type: '',
    ingredients: [{ ingredient_name: '', quantity: '', unit: '' }]
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setRecipeData((prev) => ({ ...prev, [name]: value }));
  };

  const handleAddIngredient = () => {
    setRecipeData((prev) => ({
      ...prev,
      ingredients: [...prev.ingredients, { ingredient_name: '', quantity: '', unit: '' }]
    }));
  };

  const handleUpdateIngredient = (index, data) => {
    setRecipeData((prev) => {
      const updatedIngredients = [...prev.ingredients];
      updatedIngredients[index] = { ...updatedIngredients[index], ...data };
      return { ...prev, ingredients: updatedIngredients };
    });
  };

  const handleDeleteIngredient = (index) => {
    setRecipeData((prev) => {
      const updatedIngredients = prev.ingredients.filter((_, i) => i !== index);
      return { ...prev, ingredients: updatedIngredients };
    });
  };

  const validateForm = () => {
    if (!recipeData.name.trim()) return toast.error('Please provide a recipe name'), false;
    if (!recipeData.steps.trim()) return toast.error('Please provide recipe steps'), false;
    if (!recipeData.prep_time) return toast.error('Please provide preparation time'), false;
    if (!recipeData.cook_time) return toast.error('Please provide cooking time'), false;
    if (!recipeData.meal_type.trim()) return toast.error('Please provide a meal type'), false;
    if (recipeData.ingredients.some((ing) => !ing.ingredient_name.trim() || !ing.quantity || !ing.unit.trim())) {
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
        prep_time: parseInt(recipeData.prep_time, 10),
        cook_time: parseInt(recipeData.cook_time, 10),
        steps: recipeData.steps.split('\n') // Çok satırlı adımları diziye dönüştür
      };
      console.log('Submitting recipe:', recipeToSubmit); 
      const newRecipe = await addRecipe(recipeToSubmit);
      toast.success('Recipe uploaded successfully!');
      navigate(`/recipes/${newRecipe.id}`);
    } catch (error) {
      console.error('Error uploading recipe:', error);
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
              <label htmlFor="name">Recipe Name *</label>
              <input id="name" name="name" value={recipeData.name} onChange={handleChange} />
              <label htmlFor="steps">Steps *</label>
              <textarea id="steps" name="steps" value={recipeData.steps} onChange={handleChange} placeholder="Enter steps, one per line" />
              <label htmlFor="meal_type">Meal Type *</label>
              <input id="meal_type" name="meal_type" value={recipeData.meal_type} onChange={handleChange} />
            </div>
            <div className="upload-section grid-2">
              <div>
                <label htmlFor="prep_time">Preparation Time (minutes) *</label>
                <input id="prep_time" name="prep_time" type="number" value={recipeData.prep_time} onChange={handleChange} />
              </div>
              <div>
                <label htmlFor="cook_time">Cooking Time (minutes) *</label>
                <input id="cook_time" name="cook_time" type="number" value={recipeData.cook_time} onChange={handleChange} />
              </div>
            </div>
            <div className="upload-section">
              <label>Ingredients *</label>
              <IngredientList
                ingredients={recipeData.ingredients}
                editable
                onAdd={handleAddIngredient}
                onUpdate={handleUpdateIngredient}
                onDelete={handleDeleteIngredient}
              />
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