// src/components/recipe/InteractiveRatingStars.jsx

import React, { useState, useEffect } from 'react';
import { submitRecipeRating, getUserRating } from '../../services/ratingService';
import { getCurrentUser } from '../../services/authService';
import { useToast } from '../ui/Toast';
import '../../styles/InteractiveRatingStars.css';

const InteractiveRatingStars = ({ 
  recipeId, 
  ratingType, 
  currentRating = 0, 
  onRatingChange 
}) => {
  const [rating, setRating] = useState(currentRating);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [userRating, setUserRating] = useState(null);
  const [user, setUser] = useState(null);
  const toast = useToast();

  useEffect(() => {
    const fetchUserAndRating = async () => {
      try {
        const currentUser = await getCurrentUser();
        setUser(currentUser);
        
        if (currentUser) {
          const userRatingData = await getUserRating(recipeId);
          setUserRating(userRatingData);
          
          if (userRatingData) {
            setRating(userRatingData[ratingType] || 0);
          }
        }
      } catch (error) {
        console.error('Error fetching user rating:', error);
        
        // If it's a token error, just clear user state
        if (error.message.includes('expired') || error.message.includes('Invalid token') || error.message.includes('Authentication')) {
          setUser(null);
          setUserRating(null);
          setRating(0);
          // Don't clear localStorage, let the user manually log out
          toast.error('Your session has expired. Please log in again.');
        }
        // For other errors, just log them and continue
      }
    };

    fetchUserAndRating();
  }, [recipeId, ratingType]);

  const handleStarClick = async (newRating) => {
    if (!user) {
      toast.error('Please log in to rate recipes');
      return;
    }

    setIsSubmitting(true);
    
    try {
      const ratingData = {
        [ratingType]: newRating
      };

      // Always use submitRecipeRating which handles create/update/delete logic internally
      const result = await submitRecipeRating(recipeId, ratingData);
      
      // Handle the response appropriately
      if (result.deleted) {
        setRating(0);
        setUserRating(null);
        toast.success('Rating removed');
      } else {
        setRating(newRating);
        // Update userRating state with the returned data
        setUserRating(result);
        toast.success('Rating submitted successfully');
      }
      
      onRatingChange?.(newRating);
    } catch (error) {
      console.error('Error submitting rating:', error);
      
      // Handle specific error cases
      if (error.message.includes('expired') || error.message.includes('Invalid token') || error.message.includes('Authentication')) {
        toast.error('Your session has expired. Please log in again.');
        // Clear user state to force re-login
        setUser(null);
        setUserRating(null);
        setRating(0);
        // Don't clear localStorage, let the user manually log out
      } else {
        toast.error(error.message || 'Failed to submit rating. Please try again.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleStarHover = (hoveredRating) => {
    setHoveredRating(hoveredRating);
  };

  const handleMouseLeave = () => {
    setHoveredRating(0);
  };

  const canRate = () => {
    if (!user) return false;
    // Only taste_rating and difficulty_rating are supported
    return ratingType === 'taste_rating' || ratingType === 'difficulty_rating';
  };

  const displayRating = hoveredRating || rating;

  return (
    <div className="interactive-rating-stars">
      <div 
        className={`stars-container ${!canRate() ? 'disabled' : ''}`}
        onMouseLeave={handleMouseLeave}
      >
        {[1, 2, 3, 4, 5].map((star) => (
          <span
            key={star}
            className={`star ${star <= displayRating ? 'filled' : ''} ${isSubmitting ? 'submitting' : ''}`}
            onClick={() => canRate() && handleStarClick(star)}
            onMouseEnter={() => canRate() && handleStarHover(star)}
            style={{ cursor: canRate() && !isSubmitting ? 'pointer' : 'default' }}
          >
            ★
          </span>
        ))}
      </div>

      {!user && (
        <div className="rating-restriction">
          Please log in to rate
        </div>
      )}
    </div>
  );
};

export default InteractiveRatingStars;
