// src/contexts/AuthContext.jsx

import React, { createContext, useContext, useState, useEffect } from "react";
import {
  registerUser,
  loginUser,
  logoutUser,
  getCurrentUser,
  isAuthenticated,
  verifyEmail,
  requestPasswordReset,
  resetPassword,
  requestPasswordResetCode,
  verifyResetCode,
} from "../services/authService";

// Create the context
const AuthContext = createContext(null);

/**
 * AuthProvider component to wrap the app and provide authentication state
 */
export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [userType, setUserType] = useState(null);

  // Load user on mount
  useEffect(() => {
    const loadUser = async () => {
      setIsLoading(true);
      try {
        // Check if user is authenticated
        if (isAuthenticated()) {
          const user = await getCurrentUser();
          setCurrentUser(user);
          console.log("User loaded:", user);
          setUserType(user.userType);
        }
      } catch (err) {
        console.error("Error loading user:", err);
        setError("Failed to load user data");
      } finally {
        setIsLoading(false);
      }
    };

    loadUser();
  }, []);

  /**
   * Register a new user
   * @param {Object} userData - User registration data
   */
  const register = async (userData) => {
    setIsLoading(true);
    setError(null);
    try {
      const user = await registerUser(userData);
      // Don't set current user since email verification is required
      return user;
    } catch (err) {
      setError(err.message || "Registration failed");
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Login a user
   * @param {Object} credentials - Login credentials
   */
  const login = async (credentials) => {
    setIsLoading(true);
    setError(null);
    try {
      const user = await loginUser(credentials);
      setCurrentUser(user);
      setUserType(user.userType);
      return user;
    } catch (err) {
      setError(err.message || "Login failed");
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Logout the current user
   */
  const logout = async () => {
    setIsLoading(true);
    setError(null);
    try {
      await logoutUser();
      setCurrentUser(null);
      setUserType(null);
    } catch (err) {
      setError(err.message || "Logout failed");
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Verify user email
   * @param {string} token - Email verification token
   */
  const handleVerifyEmail = async (token) => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await verifyEmail(token);
      return result;
    } catch (err) {
      setError(err.message || "Email verification failed");
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Request password reset (email link method)
   * @param {string} email - User email
   */
  const handlePasswordReset = async (email) => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await requestPasswordReset(email);
      return result;
    } catch (err) {
      setError(err.message || "Password reset request failed");
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Reset password with token
   * @param {string} token - Reset token
   * @param {string} newPassword - New password
   */
  const handleResetPassword = async (token, newPassword) => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await resetPassword(token, newPassword);
      return result;
    } catch (err) {
      setError(err.message || "Password reset failed");
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Request password reset code (6-digit method)
   * @param {string} email - User email
   */
  const handleRequestResetCode = async (email) => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await requestPasswordResetCode(email);
      return result;
    } catch (err) {
      setError(err.message || "Reset code request failed");
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Verify password reset code
   * @param {string} email - User email
   * @param {string} resetCode - 6-digit reset code
   */
  const handleVerifyResetCode = async (email, resetCode) => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await verifyResetCode(email, resetCode);
      return result;
    } catch (err) {
      setError(err.message || "Code verification failed");
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  // Context value
  const value = {
    currentUser,
    userType,
    isAuthenticated: !!currentUser,
    isLoading,
    error,
    register,
    login,
    logout,
    verifyEmail: handleVerifyEmail,
    requestPasswordReset: handlePasswordReset,
    resetPassword: handleResetPassword,
    requestResetCode: handleRequestResetCode,
    verifyResetCode: handleVerifyResetCode,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

/**
 * Custom hook to use authentication context
 */
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
