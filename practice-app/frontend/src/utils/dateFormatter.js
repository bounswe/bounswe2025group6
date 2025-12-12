/**
 * Utility functions for formatting dates according to user preferences
 */

/**
 * Format a date string with user's preferred format
 * If the date is within the last 24 hours, shows relative time (e.g., "12h ago")
 * Otherwise, shows the date in the user's preferred format
 * 
 * @param {string|Date} dateString - The date to format (ISO string or Date object)
 * @param {string} preferredFormat - User's preferred date format ('DD/MM/YYYY' or 'MM/DD/YYYY')
 * @param {function} t - Translation function (optional, for i18n support)
 * @returns {string} Formatted date string
 */
export const formatDate = (dateString, preferredFormat = 'DD/MM/YYYY', t = null) => {
  if (!dateString) return '';
  
  const now = new Date();
  const date = new Date(dateString);
  
  // Check if date is valid
  if (isNaN(date.getTime())) return 'Invalid date';
  
  // Calculate difference in milliseconds
  const diffMs = now - date;
  const diffSeconds = Math.floor(diffMs / 1000);
  const diffMinutes = Math.floor(diffSeconds / 60);
  const diffHours = Math.floor(diffMinutes / 60);
  const diffDays = Math.floor(diffHours / 24);
  
  // If within last 24 hours, show relative time
  if (diffHours < 24 && diffDays === 0) {
    if (diffSeconds < 60) {
      return t ? t('timeJustNow') : 'just now';
    }
    if (diffMinutes < 60) {
      if (t) {
        // Use pluralization with i18next
        const key = diffMinutes === 1 ? 'timeMinutesAgo_one' : 'timeMinutesAgo_other';
        return t(key, { count: diffMinutes, defaultValue: `${diffMinutes} ${diffMinutes === 1 ? 'minute' : 'minutes'} ago` });
      }
      return `${diffMinutes}${diffMinutes === 1 ? ' minute' : ' minutes'} ago`;
    }
    if (t) {
      // Use pluralization with i18next
      const key = diffHours === 1 ? 'timeHoursAgo_one' : 'timeHoursAgo_other';
      return t(key, { count: diffHours, defaultValue: `${diffHours} ${diffHours === 1 ? 'hour' : 'hours'} ago` });
    }
    return `${diffHours}${diffHours === 1 ? ' hour' : ' hours'} ago`;
  }
  
  // Otherwise, format according to user preference
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  
  switch (preferredFormat) {
    case 'MM/DD/YYYY':
      return `${month}/${day}/${year}`;
    case 'DD/MM/YYYY':
      return `${day}/${month}/${year}`;
    case 'YYYY-MM-DD':
      return `${year}-${month}-${day}`;
    default:
      return `${day}/${month}/${year}`; // Default to DD/MM/YYYY
  }
};

/**
 * Format a date string with time included
 * 
 * @param {string|Date} dateString - The date to format
 * @param {string} preferredFormat - User's preferred date format
 * @param {function} t - Translation function (optional, for i18n support)
 * @returns {string} Formatted date string with time
 */
export const formatDateTime = (dateString, preferredFormat = 'DD/MM/YYYY', t = null) => {
  if (!dateString) return '';
  
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return 'Invalid date';
  
  const dateStr = formatDate(dateString, preferredFormat, t);
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  
  return `${dateStr} ${hours}:${minutes}`;
};

