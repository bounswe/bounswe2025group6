import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useNavigate } from 'react-router-dom';
import { getRecipeById, getWikidataImage, deleteRecipe } from '../../services/recipeService';
import userService from '../../services/userService';
import RatingStars from '../../components/recipe/RatingStars';
import '../../styles/RecipeDetailPage.css';
import '../../styles/style.css';
import { getCurrentUser } from '../../services/authService';

const RecipeDetailPage = () => {
  const { id } = useParams();
  const [recipe, setRecipe] = useState(null);
  const [creatorName, setCreatorName] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [recipeId, setRecipeId] = useState('');
  const [currentUser, setCurrentUser] = useState(null);
  const [recipeImage, setRecipeImage] = useState(null);
  const navigate = useNavigate();

  const handleDelete = async () => {
    try {
      if (!id) {
        alert('Invalid recipe ID.');
        return;
      }

      // Check if current user is the creator
      const currentUser = await getCurrentUser(); // Add await here
      if (!currentUser || currentUser.id !== recipe.creator_id) {
        alert('You can only delete recipes that you created.');
        return;
      }
      
      const success = await deleteRecipe(id);
      if (success) {
        alert(`Recipe ${recipe.name} deleted successfully.`);
        navigate(`/recipes/`);
      }
    } catch (error) {
      console.error('Error deleting recipe:', error);
      alert('Failed to delete the recipe. Please try again.');
    }
  };
  useEffect(() => {
    const loadRecipeAndImage = async () => {
      try {
        setLoading(true);
        const recipeData = await getRecipeById(Number(id));
        if (recipeData) {
          setRecipe(recipeData);
          
          // Fetch image from Wikidata API
          try {
            const imageUrl = await getWikidataImage(recipeData.name);
            if (imageUrl) {
              setRecipeImage(imageUrl);
            }
          } catch (imageError) {
            console.error('Failed to load recipe image:', imageError);
            // Don't set error state, just continue without image
          }
        } else {
          setError('Recipe not found');
        }
      } catch (err) {
        setError('Failed to load recipe');
      } finally {
        setLoading(false);
      }
    };

    loadRecipeAndImage();
  }, [id]);

  useEffect(() => {
    const fetchCurrentUser = async () => {
      const user = await getCurrentUser();
      setCurrentUser(user);
    };
    fetchCurrentUser();
  }, []);

  if (loading) return <div>Loading recipe...</div>;
  if (error) return <div className="text-red-500">{error}</div>;
  if (!recipe) return <div>No recipe data available</div>;

  return (
    <div id="recipe-detail-page" className="container">      <div className="recipe-detail-page-header" style={{
				backgroundImage: recipeImage
          ? `url("${recipeImage}")`
          : 'url("https://plus.unsplash.com/premium_photo-1673108852141-e8c3c22a4a22?q=80&w=2070&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D")'
			}}>
        <h1>{recipe.name}</h1>
        <div className='recipe-detail-page-header-boxes'>
          <div className='recipe-detail-page-header-box'>
            <span className='recipe-detail-page-header-box-info'>Dietary Info: </span>
            {recipe.dietary_info && recipe.dietary_info.length > 0 ? (
              recipe.dietary_info.map((info, index) => (
                <span className='recipe-detail-page-header-box-dietary' key={index} >{info}</span>
              ))
            ) : (
              <span className='recipe-detail-page-header-box-dietary'>None</span>
            )}
          </div>
          <div className='recipe-detail-page-header-box'>
            <span className='recipe-detail-page-header-box-info'>Allergens: </span>
            {recipe.alergens && recipe.alergens.length > 0 ? (
            recipe.alergens.map((allergen, index) => (
              <span className='recipe-detail-page-header-box-allergen' key={index}>
                {allergen.charAt(0).toUpperCase() + allergen.slice(1)}
                {index < recipe.alergens.length - 1 ? '' : ''}
              </span>
            ))
          ) : (
            <span className='recipe-detail-page-header-box-allergen'>None</span>
          )}
          </div>
        </div>

        {/*DELETE BUTTON EDIT BUTTON*/}
        {currentUser && currentUser.id === recipe.creator_id && (
          <div className='recipe-detail-page-header-buttons'>
            <button className="delete-recipe-button" onClick={handleDelete}>Delete Recipe</button>
            <button 
              className="edit-recipe-button" 
              onClick={() => navigate(`/recipes/${id}/edit`)}
            >
              Edit Recipe
            </button>
          </div>
        )}
        
      </div>

      <div className='recipe-detail-page-boxes'>
        <div className="recipe-detail-page-box">
          <span className='recipe-detail-page-box-header'>MEAL TYPE</span>
          <span className='recipe-detail-page-box-title'>
            {recipe.meal_type
            ? recipe.meal_type.charAt(0).toUpperCase() + recipe.meal_type.slice(1)
            : 'N/A'}
          </span>
        </div>

        <div className="recipe-detail-page-box">
          <span className='recipe-detail-page-box-header'>PREP TIME</span>
          <span className='recipe-detail-page-box-title'>{recipe.prep_time} mins</span>
        </div>

        <div className="recipe-detail-page-box">
          <span className='recipe-detail-page-box-header'>COOK TIME</span>
          <span className='recipe-detail-page-box-title'>{recipe.cook_time} mins</span>
        </div>

        <div className="recipe-detail-page-box">
          <span className='recipe-detail-page-box-header'>COST</span>
          <span className='recipe-detail-page-box-title'>{recipe.cost_per_serving || 'None'} $</span>
        </div>  
      </div>

      <div className='recipe-detail-page-stars'>
          <div className='recipe-detail-page-star'>
              <span className='recipe-detail-page-star-header'>DIFFICULTY RATING</span>
              <div className='recipe-detail-page-star-title'>
                <RatingStars rating={recipe.difficulty_rating || 0} maxRating={5} />
              </div>
          </div>
          <div className='recipe-detail-page-star'>
              <span className='recipe-detail-page-star-header'>TASTE RATING</span>
              <div className='recipe-detail-page-star-title'>
                <RatingStars rating={recipe.taste_rating || 0} maxRating={5} />
              </div>
          </div>
          <div className='recipe-detail-page-star'>
              <span className='recipe-detail-page-star-header'>HEALTH RATING</span>
              <div className='recipe-detail-page-star-title'>
                <RatingStars rating={recipe.health_rating || 0} maxRating={5} />
              </div>
          </div>
      </div>

      <div className='recipe-detail-page-content'>
        <div className='recipe-detail-page-content-steps'>
          <h2>INSTRUCTIONS</h2>
          {recipe.steps && recipe.steps.length > 0 ? (
            <ol>
              {recipe.steps.map((step, index) => (
                <li key={index}>{step}</li>
              ))}
            </ol>
          ) : (
            <p>No steps provided</p>
          )}
        </div>
        <div className='recipe-detail-page-ingredients'>
          <h2>INGREDIENTS</h2>
          {recipe.ingredients && recipe.ingredients.length > 0 ? (
          <ul>
            {recipe.ingredients.map((item, index) => (
              <li key={index}>
                <span>{item.quantity} {item.unit} </span>- {item.ingredient.name}
              </li>
            ))}
          </ul>
          ) : (
            <p>No ingredients provided</p>
          )}
        </div>
        
      </div>
      

      


      {/*
      
      <div><strong>Like:</strong> {recipe.like_count}</div>
        <div><strong>Comments:</strong> {recipe.comment_count}</div>
      
      */}

        


    </div>
  );
};

export default RecipeDetailPage;