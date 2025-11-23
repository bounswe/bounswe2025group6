// src/components/recipe/InteractiveHealthRating.jsx

import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { getHealthRating, submitHealthRating } from '../../services/ratingService';
import { getCurrentUser } from '../../services/authService';
import { useToast } from '../ui/Toast';
import '../../styles/InteractiveHealthRating.css';

const InteractiveHealthRating = ({ 
  recipeId,
  averageHealthRating = 0, // Recipe'nin genel health rating ortalaması
  onRatingChange
}) => {
  const { t } = useTranslation();
  const [userRating, setUserRating] = useState(0); // Kullanıcının verdiği rating
  const [hoveredRating, setHoveredRating] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [user, setUser] = useState(null);
  const [healthRating, setHealthRating] = useState(null);
  const [isDietitian, setIsDietitian] = useState(false);
  const toast = useToast();

  useEffect(() => {
    const fetchUserAndRating = async () => {
      try {
        const currentUser = await getCurrentUser();
        console.log('InteractiveHealthRating - currentUser:', currentUser);
        setUser(currentUser);
        
        // Check if user is a dietitian
        const userIsDietitian = currentUser?.userType === 'dietitian';
        console.log('InteractiveHealthRating - userIsDietitian:', userIsDietitian, 'userType:', currentUser?.userType);
        setIsDietitian(userIsDietitian);
        
        if (currentUser && userIsDietitian) {
          const healthRatingData = await getHealthRating(recipeId);
          setHealthRating(healthRatingData);
          
          if (healthRatingData) {
            setUserRating(healthRatingData.health_score || 0);
          }
        } else {
          // If not dietitian, just fetch to show public rating
          const healthRatingData = await getHealthRating(recipeId);
          setHealthRating(healthRatingData);
          
          if (healthRatingData) {
            setUserRating(healthRatingData.health_score || 0);
          }
        }
      } catch (error) {
        console.error('Error fetching user and health rating:', error);
        
        if (error.message.includes('expired') || error.message.includes('Invalid token') || error.message.includes('Authentication')) {
          setUser(null);
          setHealthRating(null);
          setUserRating(0);
        }
      }
    };

    fetchUserAndRating();
  }, [recipeId]);

  const handleStarClick = async (newRating) => {
    if (!user) {
      toast.error('Please log in to rate recipes');
      return;
    }

    if (!isDietitian) {
      toast.error('Only dietitians can rate the health score');
      return;
    }

    setIsSubmitting(true);
    
    try {
      const result = await submitHealthRating(recipeId, newRating);
      
        if (result.deleted) {
        setUserRating(0);
        setHealthRating(null);
        toast.success('Health rating removed');
      } else {
        setUserRating(newRating);
        setHealthRating(result);
        toast.success('Health rating submitted successfully');
      }
      
      // Callback to refresh recipe data
      onRatingChange?.();
    } catch (error) {
      console.error('Error submitting health rating:', error);
      
      if (error.message.includes('expired') || error.message.includes('Invalid token') || error.message.includes('Authentication')) {
        toast.error('Your session has expired. Please log in again.');
        setUser(null);
        setHealthRating(null);
        setUserRating(0);
      } else {
        toast.error(error.message || 'Failed to submit health rating. Please try again.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleStarHover = (hoveredRating) => {
    if (isDietitian) {
      setHoveredRating(hoveredRating);
    }
  };

  const handleMouseLeave = () => {
    setHoveredRating(0);
  };

  const canRate = () => {
    return isDietitian && user;
  };

  const displayUserRating = hoveredRating || userRating;

  return (
    <div className="interactive-health-rating">
      {/* Average Health Rating Display (Big Stars) */}
      <div className="average-rating-display">
        <div className="average-stars-container">
          {[1, 2, 3, 4, 5].map((star) => (
            <span
              key={star}
              className={`star big-star ${star <= averageHealthRating ? 'filled' : ''}`}
            >
              ★
            </span>
          ))}
        </div>
        <div className="average-rating-text">
           {averageHealthRating.toFixed(1)}/5
        </div>
      </div>

      {/* User Rating Section (Small Stars) */}
      {user && isDietitian && (
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
            {t("ratingYourRating")} {userRating || 'None'}
          </div>
        </div>
      )}

      {/* Restriction Messages */}
      {!user && (
        <div className="rating-restriction">
          Please log in to view health rating
        </div>
      )}

      {user && !isDietitian && (
        <div className="rating-restriction">
          {t("ratingHealthByDietitansOnly")}
        </div>
      )}
    </div>
  );
};

export default InteractiveHealthRating;

