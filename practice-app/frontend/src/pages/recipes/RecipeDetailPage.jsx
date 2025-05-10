import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  getRecipeById,
  deleteRecipe,
  isBookmarked,
  addToBookmarks,
  removeFromBookmarks,
} from '../../services/recipeService';
import IngredientList from '../../components/recipe/IngredientList';
import RatingStars from '../../components/recipe/RatingStars';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import { useToast } from '../../components/ui/Toast';
import '../../styles/RecipePages.css';
import '../../styles/RecipeDetailPage.css';

const RecipeDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();

  const [recipe, setRecipe] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [bookmarked, setBookmarked] = useState(false);
  const [tasteRating, setTasteRating] = useState(0);
  const [difficultyRating, setDifficultyRating] = useState(0);
  const [healthinessRating, setHealthinessRating] = useState(0);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');

  const currentUser = {
    id: 1,
    username: 'CurrentUser',
    isDietitian: true,
  };

  useEffect(() => {
    const loadRecipe = async () => {
      setLoading(true);
      try {
        const recipeData = await getRecipeById(Number(id));
        setRecipe(recipeData);
        setBookmarked(isBookmarked(recipeData.id));
        setComments([
          { id: 1, user: 'Hilal', text: 'Looks delicious!', date: new Date(Date.now() - 86400000).toISOString() },
          { id: 2, user: 'Furkan', text: 'I tried and loved it.', date: new Date(Date.now() - 3600000).toISOString() },
        ]);
      } catch (err) {
        console.error('Error loading recipe:', err);
        setError('Failed to load recipe');
        toast.error('Failed to load recipe');
      } finally {
        setLoading(false);
      }
    };
    
    loadRecipe();
  }, [id, toast]);

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const handleBookmarkToggle = async () => {
    try {
      if (bookmarked) {
        await removeFromBookmarks(recipe.id);
        toast.success('Removed from bookmarks');
      } else {
        await addToBookmarks(recipe.id);
        toast.success('Added to bookmarks');
      }
      setBookmarked(!bookmarked);
    } catch (err) {
      toast.error('Failed to update bookmarks');
    }
  };

  const handleDeleteRecipe = async () => {
    if (window.confirm('Are you sure you want to delete this recipe?')) {
      try {
        await deleteRecipe(recipe.id);
        toast.success('Recipe deleted');
        navigate('/recipes');
      } catch (err) {
        toast.error('Failed to delete recipe');
      }
    }
  };

  const handleCommentSubmit = (e) => {
    e.preventDefault();
    if (newComment.trim()) {
      setComments([...comments, {
        id: Date.now(),
        user: currentUser.username,
        text: newComment,
        date: new Date().toISOString(),
      }]);
      setNewComment('');
      toast.success('Comment added');
    }
  };

  const handleRatingSubmit = () => {
    if (tasteRating && difficultyRating) {
      toast.success('Ratings submitted');
    } else {
      toast.warning('Rate both taste and difficulty');
    }
  };

  if (loading) return <div className="text-center py-16 text-gray-500">Loading recipe...</div>;
  if (error || !recipe) return <div className="text-center py-16 text-red-500">{error || 'Recipe not found'}</div>;

  const isOwner = currentUser.username === recipe.createdBy;

  return (
    <div className="recipe-detail-container">
      <Button variant="ghost" onClick={() => navigate('/recipes')} className="back-button">← Back to Recipes</Button>

      <Card className="recipe-card">
        <img src={recipe.imageUrl || 'https://via.placeholder.com/800x400?text=No+Image'} alt={recipe.title} className="recipe-image" />
        <Card.Body>
          <div className="recipe-header">
            <h1 className="recipe-title">{recipe.title}</h1>
            <div className="recipe-actions">
              <Button variant={bookmarked ? 'warning' : 'secondary'} onClick={handleBookmarkToggle}>{bookmarked ? '★ Bookmarked' : '☆ Bookmark'}</Button>
              {isOwner && <Button variant="danger" onClick={handleDeleteRecipe}>🗑 Delete</Button>}
            </div>
          </div>
          <div className="recipe-meta">
            <span>₺{recipe.costPerServing} / serving</span>
            <span>{recipe.preparationTime} min</span>
            <span className="meta-user">👤 {recipe.createdBy}</span>
          </div>
          <p className="recipe-description">{recipe.description}</p>

          {recipe.badges?.length > 0 && (
            <div className="recipe-badges">
              {recipe.badges.map((badge, i) => <span key={i} className="badge">{badge}</span>)}
            </div>
          )}

          {recipe.nutrition && (
            <div className="recipe-nutrition">
              <div><strong>{recipe.nutrition.calories}</strong><span>Calories</span></div>
              <div><strong>{recipe.nutrition.protein}g</strong><span>Protein</span></div>
              <div><strong>{recipe.nutrition.carbs}g</strong><span>Carbs</span></div>
              <div><strong>{recipe.nutrition.fat}g</strong><span>Fat</span></div>
            </div>
          )}
        </Card.Body>
      </Card>

      <Card className="recipe-section">
        <Card.Header><h2>Ingredients</h2></Card.Header>
        <Card.Body><IngredientList ingredients={recipe.ingredients} /></Card.Body>
      </Card>

      <Card className="recipe-section">
        <Card.Header><h2>Instructions</h2></Card.Header>
        <Card.Body>
          {recipe.instructions ? (
            recipe.instructions.split('\n').map((line, i) => (
              <div key={i} className="instruction-step">
                <span className="step-number">{i + 1}</span>
                <p>{line}</p>
              </div>
            ))
          ) : (
            <p>No instructions available</p>
          )}
        </Card.Body>
      </Card>

      <Card className="recipe-section">
        <Card.Header><h2>Rate This Recipe</h2></Card.Header>
        <Card.Body>
          <div className="rating-group">
            <label>Taste</label>
            <RatingStars rating={tasteRating} interactive onChange={setTasteRating} size="sm" />
            <span>{tasteRating}/5</span>
          </div>
          <div className="rating-group">
            <label>Difficulty</label>
            <RatingStars rating={difficultyRating} interactive onChange={setDifficultyRating} size="sm" />
            <span>{difficultyRating}/5</span>
          </div>
          {currentUser.isDietitian && (
            <div className="rating-group">
              <label>Healthiness</label>
              <input type="range" min="0" max="10" value={healthinessRating} onChange={(e) => setHealthinessRating(+e.target.value)} />
              <div>{healthinessRating}/10</div>
            </div>
          )}
          <Button onClick={handleRatingSubmit}>Submit Ratings</Button>
        </Card.Body>
      </Card>

      <Card className="recipe-section">
        <Card.Header><h2>Comments</h2></Card.Header>
        <Card.Body>
          {comments.map(comment => (
            <div key={comment.id} className="comment">
              <div className="comment-header">
                <strong>{comment.user}</strong>
                <span>{formatDate(comment.date)}</span>
              </div>
              <p>{comment.text}</p>
            </div>
          ))}
          <form onSubmit={handleCommentSubmit} className="comment-form">
            <textarea
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Write your comment..."
              required
            ></textarea>
            <Button type="submit">Post Comment</Button>
          </form>
        </Card.Body>
      </Card>
    </div>
  );
};

export default RecipeDetailPage;