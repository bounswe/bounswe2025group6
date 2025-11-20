// src/components/ui/Badge.jsx
import React from 'react';
import '../../styles/Badge.css';

/**
 * Badge component to display user's experience badge
 * @param {string} badge - User's badge (null, "Home Cook", "Experienced Home Cook")
 * @param {string} size - Size of badge (small, medium, large)
 * @param {string} usertype - User's type (e.g., 'dietitian')
 */
const Badge = ({ badge, size = 'small', usertype }) => {
  // If user is a dietitian, show black star
  if (usertype === 'dietitian') {
    const fontSizeMap = {
      small: '1.2rem',
      medium: '1.5rem',
      large: '2rem'
    };
    return (
      <span 
        className={`user-badge user-badge-${size}`}
        style={{ 
          color: '#000000',
          fontSize: fontSizeMap[size] || fontSizeMap.small
        }}
        title="Dietitian"
      >
        ★
      </span>
    );
  }
  // If badge is null or empty, show green star (default) or black if dietitian
  if (!badge) {
    const fontSizeMap = {
      small: '1.2rem',
      medium: '1.5rem',
      large: '2rem'
    };
    const badgeColor = usertype === 'dietitian' ? '#000000' : '#48bb78';
    const badgeTitle = usertype === 'dietitian' ? 'Dietitian' : '';
    return (
      <span 
        className={`user-badge user-badge-${size}`}
        style={{ 
          color: badgeColor,
          fontSize: fontSizeMap[size] || fontSizeMap.small
        }}
        title={badgeTitle}
      >
        ★
      </span>
    );
  }

  // Normalize badge: trim whitespace
  const normalizedBadge = badge.toString().trim();

  const badgeConfig = {
    'Home Cook': {
      icon: '★',
      color: '#4299e1', // Mavi yıldız
      label: 'Home Cook'
    },
    'Experienced Home Cook': {
      icon: '★',
      color: '#9f7aea', // Mor yıldız
      label: 'Experienced Home Cook'
    }
  };

  const config = badgeConfig[normalizedBadge];
  
  // If badge doesn't match known values, return null
  if (!config) return null;

  // Font size based on badge size
  const fontSizeMap = {
    small: '1.2rem',
    medium: '1.5rem',
    large: '2rem'
  };

  return (
    <span 
      className={`user-badge user-badge-${size}`}
      style={{ 
        color: config.color,
        fontSize: fontSizeMap[size] || fontSizeMap.small
      }}
      title={config.label}
    >
      {config.icon}
    </span>
  );
};

/**
 * Get badge label for a given badge
 * @param {string} badge - User's badge (null, "Home Cook", "Experienced Home Cook")
 * @param {string} usertype - User's type (e.g., 'dietitian')
 * @returns {string} Badge label
 */
export const getBadgeLabel = (badge, usertype) => {
  if (usertype === 'dietitian') return 'Dietitian';
  if (!badge) return 'Beginner';
  return badge.toString().trim();
};

/**
 * Get badge color for a given badge
 * @param {string} badge - User's badge (null, "Home Cook", "Experienced Home Cook")
 * @param {string} usertype - User's type (e.g., 'dietitian')
 * @returns {string} Badge color hex code
 */
export const getBadgeColor = (badge, usertype) => {
  if (usertype === 'dietitian') return '#000000'; // Black for dietitian
  if (!badge) return '#48bb78'; // Green for null badge
  
  const normalizedBadge = badge.toString().trim();
  
  const badgeConfig = {
    'Home Cook': '#4299e1',
    'Experienced Home Cook': '#9f7aea'
  };
  
  return badgeConfig[normalizedBadge] || '#48bb78'; // Default to green
};

export default Badge;

