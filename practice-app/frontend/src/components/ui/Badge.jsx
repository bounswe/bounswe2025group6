// src/components/ui/Badge.jsx
import React from 'react';
import { useTranslation } from 'react-i18next';
import '../../styles/Badge.css';

/**
 * Badge component to display user's experience badge
 * @param {string} badge - User's badge/typeofcook (beginner, intermediate, expert, professional) or legacy (null, "Home Cook", "Experienced Home Cook")
 * @param {string} size - Size of badge (small, medium, large)
 * @param {string} usertype - User's type (e.g., 'dietitian')
 */
const Badge = ({ badge, size = 'small', usertype }) => {
  const { t } = useTranslation();
  
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
        title={t('badge.dietitian')}
      >
        ★
      </span>
    );
  }
  
  // If badge is null or empty, show green star (default)
  if (!badge) {
    const fontSizeMap = {
      small: '1.2rem',
      medium: '1.5rem',
      large: '2rem'
    };
    return (
      <span 
        className={`user-badge user-badge-${size}`}
        style={{ 
          color: '#48bb78',
          fontSize: fontSizeMap[size] || fontSizeMap.small
        }}
        title={t('badge.beginner') || 'Beginner'}
      >
        ★
      </span>
    );
  }

  // Normalize badge: trim whitespace and convert to lowercase
  const normalizedBadge = badge.toString().trim().toLowerCase();

  // Badge configuration for typeofcook values
  const badgeConfig = {
    'beginner': {
      icon: '★',
      color: '#48bb78', // Green
      label: t('badge.beginner') || 'Beginner'
    },
    'intermediate': {
      icon: '★',
      color: '#4299e1', // Blue
      label: t('badge.intermediate') || 'Intermediate'
    },
    'expert': {
      icon: '★',
      color: '#9f7aea', // Purple
      label: t('badge.expert') || 'Expert'
    },
    'professional': {
      icon: '★',
      color: '#f6ad55', // Orange
      label: t('badge.professional') || 'Professional'
    },
    // Legacy badge values (for backward compatibility)
    'home cook': {
      icon: '★',
      color: '#4299e1', // Blue
      label: t('badge.homeCook') || 'Home Cook'
    },
    'experienced home cook': {
      icon: '★',
      color: '#9f7aea', // Purple
      label: t('badge.experiencedCook') || 'Experienced Home Cook'
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
 * Get badge label for a given badge/typeofcook
 * @param {string} badge - User's badge/typeofcook (beginner, intermediate, expert, professional)
 * @param {string} usertype - User's type (e.g., 'dietitian')
 * @param {Function} t - Translation function from useTranslation
 * @returns {string} Badge label
 */
export const getBadgeLabel = (badge, usertype, t) => {
  if (!t) {
    // Fallback if translation function is not provided
    if (usertype === 'dietitian') return 'Dietitian';
    if (!badge) return 'Beginner';
    return badge.toString().trim();
  }
  
  if (usertype === 'dietitian') return t('badge.dietitian');
  if (!badge) return t('badge.beginner') || 'Beginner';
  
  const normalizedBadge = badge.toString().trim().toLowerCase();
  
  const badgeLabels = {
    'beginner': t('badge.beginner') || 'Beginner',
    'intermediate': t('badge.intermediate') || 'Intermediate',
    'expert': t('badge.expert') || 'Expert',
    'professional': t('badge.professional') || 'Professional',
    'home cook': t('badge.homeCook') || 'Home Cook',
    'experienced home cook': t('badge.experiencedCook') || 'Experienced Home Cook'
  };
  
  return badgeLabels[normalizedBadge] || normalizedBadge;
};

/**
 * Get badge color for a given badge/typeofcook
 * @param {string} badge - User's badge/typeofcook (beginner, intermediate, expert, professional)
 * @param {string} usertype - User's type (e.g., 'dietitian')
 * @returns {string} Badge color hex code
 */
export const getBadgeColor = (badge, usertype) => {
  if (usertype === 'dietitian') return '#000000'; // Black for dietitian
  if (!badge) return '#48bb78'; // Green for beginner
  
  const normalizedBadge = badge.toString().trim().toLowerCase();
  
  const badgeConfig = {
    'beginner': '#48bb78',      // Green
    'intermediate': '#4299e1',  // Blue
    'expert': '#9f7aea',        // Purple
    'professional': '#f6ad55',  // Orange
    'home cook': '#4299e1',     // Blue (legacy)
    'experienced home cook': '#9f7aea' // Purple (legacy)
  };
  
  return badgeConfig[normalizedBadge] || '#48bb78'; // Default to green
};

export default Badge;

