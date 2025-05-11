import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { getRecipeById } from '../../services/recipeService';
import { getUserProfile } from '../../services/profileService'; // userService yerine profileService kullanıldı
import RatingStars from '../../components/recipe/RatingStars';
import '../../styles/RecipeDetailPage.css';

const RecipeDetailPage = () => {
  const { id } = useParams();
  const [recipe, setRecipe] = useState(null);
  const [creatorName, setCreatorName] = useState(''); // Kullanıcı adı için state
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadRecipe = async () => {
      try {
        setLoading(true);
        const recipeData = await getRecipeById(Number(id));
        if (recipeData) {
          setRecipe(recipeData);

          // Kullanıcı adını almak için API çağrısı
          //const userData = await getUserProfile(); // getUserById yerine getUserProfile kullanıldı
          //setCreatorName(userData.username); // Kullanıcı adını state'e kaydet
        } else {
          setError('Recipe not found');
        }

      } catch (err) {
        setError('Failed to load recipe');
      } finally {
        setLoading(false);
      }
    };

    loadRecipe();
  }, [id]);

  

  if (loading) return <div>Loading recipe...</div>;
  if (error) return <div className="text-red-500">{error}</div>;
  if (!recipe) return <div>No recipe data available</div>;

  return (
    <div className="recipe-detail-page">
      <h1><strong>Recipe: </strong> {recipe.name}</h1>
      <div>
        <strong>Steps:</strong>
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
      <div>
      <strong>Ingredients:</strong>
      {recipe.ingredients && recipe.ingredients.length > 0 ? (
        <ul>
          {recipe.ingredients.map((item, index) => (
            <li key={index}>
              {item.ingredient.name} - {item.quantity} {item.unit} ({item.ingredient.category})
              <br />
              <strong>Allergens:</strong> {item.ingredient.allergens.length > 0 ? item.ingredient.allergens.join(', ') : 'None'}
              <br />
              <strong>Dietary Info:</strong> {item.ingredient.dietary_info.length > 0 ? item.ingredient.dietary_info.join(', ') : 'None'}
            </li>
          ))}
        </ul>
      ) : (
        <p>No ingredients provided</p>
      )}
      </div>
      <div><strong>Prep Time:</strong> {recipe.prep_time} mins</div>
      <div><strong>Cook Time:</strong> {recipe.cook_time} mins</div>
      <div>
        <strong>Meal Type: </strong> 
        {recipe.meal_type
          ? recipe.meal_type.charAt(0).toUpperCase() + recipe.meal_type.slice(1)
          : 'N/A'}
      </div>
      
      <div><strong>Cost per Serving:</strong> {recipe.cost_per_serving || 'Not calculated'} $</div>
      <div><strong>Difficulty Rating:</strong>
        <RatingStars rating={recipe.difficulty_rating || 0} maxRating={5} />
      </div>
      <div>
        <strong>Taste Rating:</strong>
        <RatingStars rating={recipe.taste_rating || 0} maxRating={5} />
      </div>
      <div>
        <strong>Health Rating:</strong>
        <RatingStars rating={recipe.health_rating || 0} maxRating={5} />
      </div>
      <div><strong>Like:</strong> {recipe.like_count}</div>
      <div><strong>Comments:</strong> {recipe.comment_count}</div>
      <div>
      <strong>Allergens:</strong> {recipe.alergens && recipe.alergens.length > 0 ? recipe.alergens.join(', ') : 'None'}
      </div>
      <div>
        <strong>Dietary Info:</strong> {recipe.dietary_info && recipe.dietary_info.length > 0 ? recipe.dietary_info.join(', ') : 'None'}
      </div>
    </div>
  );
};

export default RecipeDetailPage;