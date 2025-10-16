// src/App.jsx

import React from "react";
import { BrowserRouter } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import { MealPlanProvider } from "./contexts/MealPlanContext";
import { ToastProvider } from "./components/ui/Toast";
import AppRoutes from "./routes";
import "./styles/index.css";
import "i18n";

/**
 * Main App component that sets up providers and routing
 */
const App = () => {
  return (
    <BrowserRouter>
      <ToastProvider>
        <AuthProvider>
          <MealPlanProvider>
            <AppRoutes />
          </MealPlanProvider>
        </AuthProvider>
      </ToastProvider>
    </BrowserRouter>
  );
};

export default App;
