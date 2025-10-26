// src/contexts/CurrencyContext.jsx

import React, { createContext, useContext, useState, useEffect } from "react";
import { getCurrentUser } from "../services/authService";
import userService from "../services/userService";

// Create the context
const CurrencyContext = createContext(null);

/**
 * CurrencyProvider component to wrap the app and provide currency state
 */
export const CurrencyProvider = ({ children }) => {
  const [currency, setCurrency] = useState("USD");

  // Load currency from user profile on mount
  useEffect(() => {
    const loadUserCurrency = async () => {
      try {
        // First check localStorage
        const savedCurrency = localStorage.getItem("currency");
        
        // Then try to get user's profile preference
        const user = await getCurrentUser();
        if (user && user.id) {
          const userData = await userService.getUserById(user.id);
          const userCurrency = userData?.preferredCurrency;
          
          if (userCurrency && userCurrency !== savedCurrency) {
            // User profile has different currency, use that
            setCurrency(userCurrency);
            localStorage.setItem("currency", userCurrency);
          } else if (savedCurrency) {
            // Use localStorage currency
            setCurrency(savedCurrency);
          } else if (userCurrency) {
            // Use user profile currency
            setCurrency(userCurrency);
            localStorage.setItem("currency", userCurrency);
          } else {
            // Default to USD
            setCurrency("USD");
            localStorage.setItem("currency", "USD");
          }
        } else if (savedCurrency) {
          // No user logged in, use localStorage
          setCurrency(savedCurrency);
        } else {
          // No user, no localStorage, default to USD
          setCurrency("USD");
          localStorage.setItem("currency", "USD");
        }
      } catch (error) {
        console.error('Error loading user currency:', error);
        // Fallback to localStorage or default
        const savedCurrency = localStorage.getItem("currency");
        setCurrency(savedCurrency || "USD");
        if (!savedCurrency) {
          localStorage.setItem("currency", "USD");
        }
      }
    };

    loadUserCurrency();
  }, []);

  /**
   * Change currency preference
   * @param {string} newCurrency - Currency code (USD, TRY, etc.)
   */
  const changeCurrency = (newCurrency) => {
    setCurrency(newCurrency);
    localStorage.setItem("currency", newCurrency);
  };

  // Get currency symbol
  const getCurrencySymbol = () => {
    switch (currency) {
      case "USD":
        return "$";
      case "TRY":
        return "₺";
      case "EUR":
        return "€";
      default:
        return "$";
    }
  };

  // Context value
  const value = {
    currency,
    setCurrency: changeCurrency,
    currencySymbol: getCurrencySymbol(),
  };

  return (
    <CurrencyContext.Provider value={value}>{children}</CurrencyContext.Provider>
  );
};

/**
 * Custom hook to use currency context
 */
export const useCurrency = () => {
  const context = useContext(CurrencyContext);
  if (!context) {
    throw new Error("useCurrency must be used within a CurrencyProvider");
  }
  return context;
};

