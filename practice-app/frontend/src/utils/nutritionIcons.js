/**
 * Utility functions for dynamic nutrition icons based on values
 * Returns icon and size class based on nutrition value
 * Medium and high values have animated pulse effect
 */

// Thresholds for nutrition values (can be adjusted)
const NUTRITION_THRESHOLDS = {
  calories: {
    low: 400,    // < 400 kcal = low (small, no animation)
    medium: 800, // 400-800 kcal = medium (animated), > 800 kcal = high (animated)
  },
  protein: {
    low: 10,     // < 10g = low (small, no animation)
    medium: 25,  // 10-25g = medium (animated), > 25g = high (animated)
  },
  fat: {
    low: 10,     // < 10g = low (small, no animation)
    medium: 25,  // 10-25g = medium (animated), > 25g = high (animated)
  },
  carbs: {
    low: 20,     // < 20g = low (small, no animation)
    medium: 50,  // 20-50g = medium (animated), > 50g = high (animated)
  },
};

/**
 * Get nutrition icon and size class based on value
 * @param {string} type - 'calories', 'protein', 'fat', 'carbs'
 * @param {number} value - The nutrition value
 * @returns {Object} - { icon: string, sizeClass: string }
 */
export const getNutritionIcon = (type, value) => {
  if (!value || typeof value !== 'number') {
    // Default icon if value is invalid
    return getDefaultIcon(type);
  }

  const thresholds = NUTRITION_THRESHOLDS[type];
  if (!thresholds) {
    return getDefaultIcon(type);
  }

  let sizeClass;
  if (value < thresholds.low) {
    sizeClass = 'nutrition-icon-small'; // Small, no animation
  } else if (value < thresholds.medium) {
    sizeClass = 'nutrition-icon-medium'; // Medium, animated
  } else {
    sizeClass = 'nutrition-icon-high'; // High, animated
  }

  return {
    icon: getIconForType(type),
    sizeClass,
  };
};

/**
 * Get default icon for nutrition type
 */
const getIconForType = (type) => {
  const icons = {
    calories: '🔥',
    protein: '💪',
    fat: '🧈',
    carbs: '🌾',
  };
  return icons[type] || '📊';
};

/**
 * Get default icon (fallback)
 */
const getDefaultIcon = (type) => {
  return {
    icon: getIconForType(type),
    sizeClass: 'nutrition-icon-medium', // Default to medium (animated)
  };
};

