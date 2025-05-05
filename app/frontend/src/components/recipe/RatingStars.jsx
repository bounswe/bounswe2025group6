// src/components/recipe/RatingStars.jsx
import React, { useState } from 'react';
import '../../styles/RatingStars.css';

const RatingStars = ({
  rating = 0,
  interactive = false,
  onChange,
  maxRating = 5,
  className = '',
  size = 'sm'
}) => {
  const [hoverRating, setHoverRating] = useState(0);

  const handleClick = (index) => {
    if (interactive && onChange) {
      onChange(index + 1);
    }
  };

  const handleMouseEnter = (index) => {
    if (interactive) setHoverRating(index + 1);
  };

  const handleMouseLeave = () => {
    if (interactive) setHoverRating(0);
  };

  const displayRating = hoverRating || rating;
  const sizeClass = `star-${size}`;

  return (
    <div className={`rating-stars ${className}`}>
      {Array.from({ length: maxRating }).map((_, index) => {
        const isFilled = index < displayRating;
        return (
          <span
            key={index}
            onClick={() => handleClick(index)}
            onMouseEnter={() => handleMouseEnter(index)}
            onMouseLeave={handleMouseLeave}
            className={`star ${interactive ? 'interactive' : ''}`}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              className={`${sizeClass} ${isFilled ? 'star-filled' : 'star-empty'}`}
            >
              {isFilled ? (
                <path
                  fill="currentColor"
                  d="M10.788 3.21c.448-1.077 1.976-1.077 2.424 0l2.082 5.007 5.404.433c1.164.093 1.636 1.545.749 2.305l-4.117 3.527 1.257 5.273c.271 1.136-.964 2.033-1.96 1.425L12 18.354l-4.627 2.826c-.996.608-2.231-.29-1.96-1.425l1.257-5.273-4.117-3.527c-.887-.76-.415-2.212.749-2.305l5.404-.433 2.082-5.006z"
                />
              ) : (
                <path
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M11.48 3.5a.562.562 0 011.04 0l2.125 5.11a.563.563 0 00.475.345l5.518.442c.5.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61L12 18.75l-4.725 2.885a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557L3.334 10.385a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z"
                />
              )}
            </svg>
          </span>
        );
      })}
    </div>
  );
};

export default RatingStars;
