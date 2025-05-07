// src/services/authService.js

import axios from 'axios';

// API base URL
const API_URL = 'http://localhost:8000/api';

// Token storage keys
const ACCESS_TOKEN_KEY = 'fithub_access_token';
const REFRESH_TOKEN_KEY = 'fithub_refresh_token';
const USER_KEY = 'fithub_user';

// Create axios instance with base URL
const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests if available
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem(ACCESS_TOKEN_KEY);
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

/**
 * Register a new user
 * @param {Object} userData - User registration data
 * @returns {Promise<Object>} Registered user
 */
export const registerUser = async (userData) => {
  try {
    // Transform data to match API expectations
    const apiData = {
      username: userData.username,
      email: userData.email,
      password: userData.password,
      usertype: userData.userType === 'dietitian' ? 'dietitian' : 'user'
    };

    // Add dietitian data if applicable
    if (userData.userType === 'dietitian' && userData.certificationUrl) {
      apiData.dietitian = {
        certification_url: userData.certificationUrl
      };
    }

    const response = await apiClient.post('/register/', apiData);
    
    // The API doesn't return the user immediately since email verification is required
    // We'll just return the submitted data minus the password
    const { password, ...registeredUser } = userData;
    
    return {
      ...registeredUser,
      message: response.data?.detail || 'Registration successful! Please check your email to verify your account.'
    };
  } catch (error) {
    console.error('Registration error:', error.response?.data || error.message);
    throw new Error(
      error.response?.data?.detail || 
      Object.values(error.response?.data || {})[0]?.[0] || 
      'Registration failed. Please try again.'
    );
  }
};

/**
 * Login a user
 * @param {Object} credentials - Login credentials
 * @returns {Promise<Object>} Logged in user
 */
export const loginUser = async (credentials) => {
  try {
    // For JWT, we need to send email as username
    const loginData = {
      username: credentials.email, // API expects username but wants email
      password: credentials.password
    };

    const response = await apiClient.post('/token/', loginData);
    const { access, refresh } = response.data;
    
    // Store tokens in localStorage
    localStorage.setItem(ACCESS_TOKEN_KEY, access);
    localStorage.setItem(REFRESH_TOKEN_KEY, refresh);
    
    // Get user details from token
    const user = parseJwt(access);
    
    // Create user object
    const userData = {
      id: user.user_id,
      email: credentials.email,
      userType: user.usertype || 'user'
    };
    
    // Store user in localStorage
    localStorage.setItem(USER_KEY, JSON.stringify(userData));
    
    return userData;
  } catch (error) {
    console.error('Login error:', error.response?.data || error.message);
    throw new Error(
      error.response?.data?.detail || 
      'Invalid credentials. Please try again.'
    );
  }
};

/**
 * Logout the current user
 * @returns {Promise<void>}
 */
export const logoutUser = async () => {
  try {
    // Call logout API
    await apiClient.post('/logout/');
  } catch (error) {
    console.error('Logout error:', error.response?.data || error.message);
  } finally {
    // Clear local storage regardless of API response
    localStorage.removeItem(ACCESS_TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  }
};

/**
 * Refresh the access token using the refresh token
 * @returns {Promise<string>} New access token
 */
export const refreshToken = async () => {
  try {
    const refresh = localStorage.getItem(REFRESH_TOKEN_KEY);
    if (!refresh) {
      throw new Error('No refresh token available');
    }
    
    const response = await apiClient.post('/token/refresh/', { refresh });
    const { access } = response.data;
    
    // Store new access token
    localStorage.setItem(ACCESS_TOKEN_KEY, access);
    
    return access;
  } catch (error) {
    console.error('Token refresh error:', error.response?.data || error.message);
    // If refresh token is invalid, log out the user
    logoutUser();
    throw error;
  }
};

/**
 * Parse JWT token to get user information
 * @param {string} token - JWT token
 * @returns {Object} Decoded token payload
 */
const parseJwt = (token) => {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(atob(base64).split('').map((c) => {
      return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
    }).join(''));
    
    return JSON.parse(jsonPayload);
  } catch (error) {
    console.error('Error parsing JWT:', error);
    return {};
  }
};

/**
 * Get the current user
 * @returns {Promise<Object>} Current user
 */
export const getCurrentUser = async () => {
  try {
    // Get user from localStorage
    const userJson = localStorage.getItem(USER_KEY);
    if (!userJson) {
      throw new Error('User not found');
    }
    
    return JSON.parse(userJson);
  } catch (error) {
    console.error('Get current user error:', error);
    throw error;
  }
};

/**
 * Check if the user is authenticated
 * @returns {boolean} Authentication status
 */
export const isAuthenticated = () => {
  return localStorage.getItem(ACCESS_TOKEN_KEY) !== null;
};

/**
 * Request password reset
 * @param {string} email - User email
 * @returns {Promise<Object>} Response data
 */
export const requestPasswordReset = async (email) => {
  try {
    const response = await apiClient.post(
            '/request-password-reset-code/',     // ← exact path in urls.py
            { email }
          );
    return response.data;
  } catch (error) {
    console.error('Password reset request error:', error.response?.data || error.message);
    throw new Error(
      error.response?.data?.detail || 
      error.response?.data?.email?.[0] || 
      'Failed to request password reset. Please try again.'
    );
  }
};

/**
 * Reset password with token
 * @param {string} token - Reset token
 * @param {string} newPassword - New password
 * @returns {Promise<Object>} Response data
 */
export const resetPassword = async (token, newPassword) => {
  try {
    const response = await apiClient.post('/reset-password/', {
      token,
      new_password: newPassword
    });
    return response.data;
  } catch (error) {
    console.error('Password reset error:', error.response?.data || error.message);
    throw new Error(
      error.response?.data?.detail || 
      error.response?.data?.token?.[0] || 
      error.response?.data?.new_password?.[0] || 
      'Failed to reset password. Please try again.'
    );
  }
};

/**
 * Request password reset code (6-digit)
 * @param {string} email - User email
 * @returns {Promise<Object>} Response data
 */
export const requestPasswordResetCode = async (email) => {
  try {
    const response = await apiClient.post('/request-reset-code/', { email });
    return response.data;
  } catch (error) {
    console.error('Password reset code request error:', error.response?.data || error.message);
    throw new Error(
      error.response?.data?.detail || 
      error.response?.data?.email?.[0] || 
      'Failed to request reset code. Please try again.'
    );
  }
};

/**
 * Verify reset code and optionally reset password
 * @param {string} email - User email
 * @param {string} resetCode - 6-digit reset code
 * @param {string} newPassword - New password (optional)
 * @returns {Promise<Object>} Response data
 */
export const verifyResetCode = async (email, resetCode, newPassword = null) => {
  try {
    // Create the request data object
    const requestData = {
      email,
      code: resetCode
    };
    
    // Add new password if provided
    if (newPassword) {
      requestData.new_password = newPassword;
    }
    const response = await apiClient.post(
            '/verify-reset-code/',               // already correct
            requestData
          );
    return response.data;
  } catch (error) {
    console.error('Reset code verification error:', error.response?.data || error.message);
    throw new Error(
      error.response?.data?.detail || 
      error.response?.data?.code?.[0] || 
      'Invalid reset code. Please try again.'
    );
  }
};

/**
 * Verify email
 * @param {string} token - Verification token
 * @returns {Promise<Object>} Response data
 */
export const verifyEmail = async (token) => {
  try {
    const response = await apiClient.get(`/verify-email/${token}/`);
    return response.data;
  } catch (error) {
    console.error('Email verification error:', error.response?.data || error.message);
    throw new Error(
      error.response?.data?.detail || 
      'Failed to verify email. The link may be expired or invalid.'
    );
  }
};

export default {
  registerUser,
  loginUser,
  logoutUser,
  getCurrentUser,
  isAuthenticated,
  refreshToken,
  requestPasswordReset,
  resetPassword,
  requestPasswordResetCode,
  verifyResetCode,
  verifyEmail
};