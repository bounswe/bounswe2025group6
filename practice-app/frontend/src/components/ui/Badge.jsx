// src/components/ui/Badge.jsx
import React from 'react';
import '../../styles/Badge.css';

/**
 * Badge component to display user's cook type/role
 * @param {string} role - User's cook type (beginner, intermediate, expert, professional)
 * @param {string} size - Size of badge (small, medium, large)
 */
const Badge = ({ role, size = 'small' }) => {
  // Normalize role: trim whitespace and convert to lowercase
  const normalizedRole = role ? role.toString().trim().toLowerCase() : '';
  
  if (!normalizedRole) return null;

  const badgeConfig = {
    beginner: {
      icon: '★',
      color: '#48bb78', // Yeşil yıldız
      label: 'Beginner'
    },
    intermediate: {
      icon: '★',
      color: '#4299e1', // Mavi yıldız (Home Cook)
      label: 'Home Cook'
    },
    expert: {
      icon: '★',
      color: '#9f7aea', // Mor yıldız (Experienced Cook)
      label: 'Experienced Cook'
    },
    professional: {
      icon: '★',
      color: '#000000', // Siyah yıldız (Dietitian)
      label: 'Dietitian'
    }
  };

  const config = badgeConfig[normalizedRole] || badgeConfig.beginner;

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
 * Get badge label for a given role
 * @param {string} role - User's cook type
 * @returns {string} Badge label
 */
export const getBadgeLabel = (role) => {
  if (!role) return '';
  
  const normalizedRole = role.toString().trim().toLowerCase();
  
  const badgeConfig = {
    beginner: 'Beginner',
    intermediate: 'Home Cook',
    expert: 'Experienced Cook',
    professional: 'Professional'
  };
  
  return badgeConfig[normalizedRole] || '';
};

/**
 * Get badge color for a given role
 * @param {string} role - User's cook type
 * @returns {string} Badge color hex code
 */
export const getBadgeColor = (role) => {
  if (!role) return '#48bb78';
  
  const normalizedRole = role.toString().trim().toLowerCase();
  
  const badgeConfig = {
    beginner: {
      color: '#48bb78', // Yeşil
      label: 'Beginner'
    },
    intermediate: {
      color: '#4299e1', // Mavi (Home Cook)
      label: 'Home Cook'
    },
    expert: {
      color: '#9f7aea', // Mor (Experienced Cook)
      label: 'Experienced Cook'
    },
    professional: {
      color: '#000000', // Siyah (Professional)
      label: 'Professional'
    }
  };
  
  return badgeConfig[normalizedRole]?.color || '#4299e1';
};

export default Badge;

