import React from 'react';
import '../../styles/LoadingSpinner.css';

const LoadingSpinner = ({ 
  size = 'medium', 
  color = 'primary', 
  message = null,
  className = '',
  ...props 
}) => {
  const sizeClasses = {
    small: 'spinner-small',
    medium: 'spinner-medium', 
    large: 'spinner-large'
  };

  const colorClasses = {
    primary: 'spinner-primary',
    secondary: 'spinner-secondary',
    white: 'spinner-white'
  };

  return (
    <div 
      className={`loading-spinner-container ${className}`}
      role="status"
      aria-label={message || "Loading..."}
      {...props}
    >
      <div 
        className={`loading-spinner ${sizeClasses[size]} ${colorClasses[color]}`}
        aria-hidden="true"
      >
        <div className="spinner-inner"></div>
      </div>
      {message && (
        <p className="loading-message" aria-live="polite">
          {message}
        </p>
      )}
    </div>
  );
};

export default LoadingSpinner;