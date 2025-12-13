/**
 * Utility functions for authentication and redirect handling
 */

/**
 * Validates and sanitizes the 'next' redirect parameter to prevent open redirects
 * Only allows internal app URLs (relative paths starting with /)
 * 
 * @param {string} nextPath - The redirect path from query parameter
 * @returns {string|null} - Validated path or null if invalid
 */
export const validateNextPath = (nextPath) => {
  if (!nextPath || typeof nextPath !== 'string') {
    return null;
  }

  // Remove any leading/trailing whitespace
  const trimmed = nextPath.trim();

  // Only allow relative paths starting with /
  // Reject absolute URLs (http://, https://, //, etc.)
  if (!trimmed.startsWith('/')) {
    return null;
  }

  // Reject paths that contain protocol schemes (security: prevent open redirects)
  if (trimmed.includes('://') || trimmed.includes('//')) {
    return null;
  }

  // Reject paths that try to navigate outside the app
  if (trimmed.startsWith('../') || trimmed.includes('../')) {
    return null;
  }

  // Allow valid internal paths
  return trimmed;
};

/**
 * Gets the redirect path from URL query parameter or location state
 * Falls back to default path if neither is available
 * 
 * @param {Object} location - React Router location object
 * @param {string} defaultPath - Default path to redirect to (default: '/dashboard')
 * @returns {string} - Valid redirect path
 */
export const getRedirectPath = (location, defaultPath = '/dashboard') => {
  // First, try to get from query parameter (for shared links)
  const searchParams = new URLSearchParams(location.search);
  const nextParam = searchParams.get('next');
  
  if (nextParam) {
    const validated = validateNextPath(nextParam);
    if (validated) {
      return validated;
    }
  }

  // Fallback to location state (for internal navigation)
  if (location.state?.from?.pathname) {
    const validated = validateNextPath(location.state.from.pathname);
    if (validated) {
      return validated;
    }
  }

  // Default fallback
  return defaultPath;
};

/**
 * Creates a login URL with the next parameter
 * 
 * @param {string} redirectPath - The path to redirect to after login
 * @returns {string} - Login URL with next parameter
 */
export const createLoginUrl = (redirectPath) => {
  const validated = validateNextPath(redirectPath);
  if (!validated) {
    return '/login';
  }
  return `/login?next=${encodeURIComponent(validated)}`;
};

