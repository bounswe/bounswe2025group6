import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { getRecipeById } from '../../services/recipeService';
import { getUserProfile } from '../../services/profileService'; // userService yerine profileService kullanıldı
import RatingStars from '../../components/recipe/RatingStars';
import '../../styles/RecipeDetailPage.css';
import '../../styles/style.css';

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
    <div id="recipe-detail-page" className="container">
      <div className="recipe-detail-page-header" style={{
				backgroundImage:
					'url("https://plus.unsplash.com/premium_photo-1673108852141-e8c3c22a4a22?q=80&w=2070&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D")'
			}}>
        <h1>{recipe.name} Recipe</h1>
        <div className='recipe-detail-page-header-boxes'>
          <div className='recipe-detail-page-header-box'>
            {recipe.dietary_info && recipe.dietary_info.length > 0 ? (
              recipe.dietary_info.map((info, index) => (
                <span key={index} >{info}</span>
              ))
            ) : (
              <span>None</span>
            )}
          </div>
          <div className='recipe-detail-page-header-box recipe-detail-page-header-box-allergens'>
            {recipe.alergens && recipe.alergens.length > 0 ? (
            recipe.alergens.map((allergen, index) => (
              <span key={index}>
                {allergen.charAt(0).toUpperCase() + allergen.slice(1)}
                {index < recipe.alergens.length - 1 ? '' : ''}
              </span>
            ))
          ) : (
            'None'
          )}
          </div>
        </div>
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
          <span className='recipe-detail-page-box-title'>{recipe.cost_per_serving || 'Not calculated'} $</span>
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
      <div className='recipe-detail-page-allergen'>
          <strong>Allergens: </strong> 
          {recipe.alergens && recipe.alergens.length > 0 ? (
            recipe.alergens.map((allergen, index) => (
              <span key={index}>
                {allergen.charAt(0).toUpperCase() + allergen.slice(1)}
                {index < recipe.alergens.length - 1 ? ', ' : ''}
              </span>
            ))
          ) : (
            'None'
          )}
      </div>
      */}



      {/*
      
      <div><strong>Like:</strong> {recipe.like_count}</div>
        <div><strong>Comments:</strong> {recipe.comment_count}</div>
      
      */}

        


    </div>
  );
};

export default RecipeDetailPage;