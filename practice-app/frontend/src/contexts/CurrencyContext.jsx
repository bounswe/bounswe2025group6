// src/contexts/CurrencyContext.jsx

import React, { createContext, useContext, useState, useEffect } from "react";

// Create the context
const CurrencyContext = createContext(null);

/**
 * CurrencyProvider component to wrap the app and provide currency state
 */
export const CurrencyProvider = ({ children }) => {
  const [currency, setCurrency] = useState("USD");

  // Load currency from localStorage on mount
  useEffect(() => {
    const savedCurrency = localStorage.getItem("currency");
    if (savedCurrency) {
      setCurrency(savedCurrency);
    } else {
      // Default to TRY for Turkish locale
      const savedCurrency = "TRY";
      setCurrency(savedCurrency);
      localStorage.setItem("currency", savedCurrency);
    }
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

