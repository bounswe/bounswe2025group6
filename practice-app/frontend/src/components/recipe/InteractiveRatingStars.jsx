// src/components/recipe/InteractiveRatingStars.jsx

import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useLocation } from 'react-router-dom';
import { submitRecipeRating, getUserRating } from '../../services/ratingService';
import { getCurrentUser } from '../../services/authService';
import { useToast } from '../ui/Toast';
import { createLoginUrl } from '../../utils/authUtils';
import '../../styles/InteractiveRatingStars.css';

const InteractiveRatingStars = ({ 
  recipeId, 
  ratingType, 
  averageRating = 0, // Recipe'nin genel rating ortalaması
  onRatingChange 
}) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const [userRatingValue, setUserRatingValue] = useState(0); // Kullanıcının verdiği rating
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
            setUserRatingValue(userRatingData[ratingType] || 0);
          }
        }
      } catch (error) {
        console.error('Error fetching user rating:', error);
        
        // If it's a token error, just clear user state
        if (error.message.includes('expired') || error.message.includes('Invalid token') || error.message.includes('Authentication')) {
          setUser(null);
          setUserRating(null);
          setUserRatingValue(0);
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
      // Redirect to login with current recipe page as next parameter
      const currentPath = location.pathname;
      navigate(createLoginUrl(currentPath));
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
        setUserRatingValue(0);
        setUserRating(null);
        toast.success('All ratings removed');
        onRatingChange?.(0);
      } else {
        // Update user rating value based on the returned data
        const newUserRatingValue = result[ratingType] || 0;
        setUserRatingValue(newUserRatingValue);
        setUserRating(result);
        
        if (newUserRatingValue === 0) {
          toast.success(`${ratingType.replace('_', ' ')} rating removed`);
        } else {
          toast.success('Rating submitted successfully');
        }
        
        onRatingChange?.(newUserRatingValue);
      }
    } catch (error) {
      console.error('Error submitting rating:', error);
      
      // Handle specific error cases
      if (error.message.includes('expired') || error.message.includes('Invalid token') || error.message.includes('Authentication')) {
        toast.error('Your session has expired. Please log in again.');
        // Clear user state to force re-login
        setUser(null);
        setUserRating(null);
        setUserRatingValue(0);
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

  const displayUserRating = hoveredRating || userRatingValue;

  return (
    <div className="interactive-rating-stars">
      {/* Average Rating Display (Big Stars) */}
      <div className="average-rating-display">
        <div className="average-stars-container">
          {[1, 2, 3, 4, 5].map((star) => (
            <span
              key={star}
              className={`star big-star ${star <= averageRating ? 'filled' : ''}`}
            >
              ★
            </span>
          ))}
        </div>
        <div className="average-rating-text">
          {averageRating.toFixed(1)}/5
        </div>
      </div>

      {/* User Rating Section (Small Stars) */}
      {user && (
        <div className="user-rating-section">
          <div className="rate-it-label">{t("ratingRateIt")}</div>
          <div 
            className={`stars-container small-stars ${!canRate() ? 'disabled' : ''}`}
            onMouseLeave={handleMouseLeave}
          >
            {[1, 2, 3, 4, 5].map((star) => (
              <span
                key={star}
                className={`star small-star ${star <= displayUserRating ? 'filled' : ''} ${isSubmitting ? 'submitting' : ''}`}
                onClick={() => canRate() && handleStarClick(star)}
                onMouseEnter={() => canRate() && handleStarHover(star)}
                style={{ cursor: canRate() && !isSubmitting ? 'pointer' : 'default' }}
              >
                ★
              </span>
            ))}
          </div>
          <div className="user-rating-info">
            {t("ratingYourRating")} {userRatingValue || 'None'}
          </div>
        </div>
      )}

      {/* Restriction Messages */}
      {!user && (
        <div className="rating-restriction">
          Please log in to rate
        </div>
      )}
    </div>
  );
};

export default InteractiveRatingStars;
