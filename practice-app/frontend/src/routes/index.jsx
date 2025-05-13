// src/routes/index.jsx

import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import AuthLayout from '../layouts/AuthLayout';
import MainLayout from '../layouts/MainLayout';
import ProtectedRoute from '../components/auth/ProtectedRoute';

// Auth pages
import LoginPage from '../pages/auth/LoginPage';
import RegisterPage from '../pages/auth/RegisterPage';
import ForgotPasswordPage from '../pages/auth/ForgotPasswordPage';
import ResetPasswordPage from '../pages/auth/ResetPasswordPage';
import EmailVerificationPage from '../pages/auth/EmailVerificationPage';

// Public pages
import HomePage from '../pages/HomePage';

// Protected pages
import DashboardPage from '../pages/DashboardPage';

import MealPlannerPage from '../pages/meal-planner/MealPlannerPage';
import SavedMealPlansPage from '../pages/meal-planner/SavedMealPlansPage';
import ShoppingListPage from '../pages/shopping/ShoppingListPage';
import RecipeDiscoveryPage from '../pages/recipes/RecipeDiscoveryPage';
import RecipeDetailPage from '../pages/recipes/RecipeDetailPage';
import UploadRecipePage from '../pages/recipes/UploadRecipePage';
import ProfilePage from '../pages/meal-planner/ProfilePage';

import CommunityPage from '../pages/community/CommunityPage';
import PostDetailPage from '../pages/community/PostDetailPage';
import CreatePostPage from '../pages/community/CreatePostPage';
import UserProfilePage from '../pages/community/UserProfilePage';
import EditPostPage from '../pages/community/EditPostPage';

import IngredientsPage from '../pages/ingredients/IngredientsPage'
import IngredientDetailPage from '../pages/ingredients/IngredientDetailPage';
import RecipeEditPage from '../pages/recipes/RecipeEditPage';
import '../styles/index.css';

const AppRoutes = () => {
  return (
    <Routes>
      {/* Public home page */}
      <Route path="/" element={<HomePage />} />
      
      {/* Auth routes with AuthLayout */}
      <Route element={<AuthLayout />}>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        {/* New auth routes */}
        <Route path="/reset-password/:token" element={<ResetPasswordPage />} />
        <Route path="/verify-email/:token" element={<EmailVerificationPage />} />
      </Route>
      
      {/* Protected routes with MainLayout */}
      <Route element={<MainLayout />}>
        {/* Dashboard */}
        <Route 
          path="/dashboard" 
          element={
            <ProtectedRoute>
              <DashboardPage />
            </ProtectedRoute>
          } 
        />
        
        {/* Meal Planner */}
        <Route 
          path="/meal-planner" 
          element={
            <ProtectedRoute>
              <MealPlannerPage />
            </ProtectedRoute>
          } 
        />
        
        <Route 
          path="/saved-meal-plans" 
          element={
            <ProtectedRoute>
              <SavedMealPlansPage />
            </ProtectedRoute>
          } 
        />
        
        {/* Shopping List */}
        <Route 
          path="/shopping-list" 
          element={
            <ProtectedRoute>
              <ShoppingListPage />
            </ProtectedRoute>
          } 
        />
        
        {/* Recipes */}
        <Route 
          path="/recipes" 
          element={
              <RecipeDiscoveryPage />
          } 
        />
        
        <Route 
          path="/recipes/:id" 
          element={
              <RecipeDetailPage />
          } 
        />
        
        <Route 
          path="/recipes/:id/edit" 
          element={
              <RecipeEditPage />
          } 
        />
        
        <Route 
          path="/uploadRecipe" 
          element={
            <ProtectedRoute>
              <UploadRecipePage />
            </ProtectedRoute>
          } 
        />
        
        {/* Profile */}
        <Route 
          path="/profile" 
          element={
            <ProtectedRoute>
              <ProfilePage />
            </ProtectedRoute>
          } 
        />

        <Route 
          path="/community" 
          element={
            <ProtectedRoute>
              <CommunityPage />
            </ProtectedRoute>
          } 
        />

        <Route 
          path="/community/post/:id" 
          element={
            <ProtectedRoute>
              <PostDetailPage />
            </ProtectedRoute>
          } 
        />

        <Route 
          path="/community/create" 
          element={
            <ProtectedRoute>
              <CreatePostPage />
            </ProtectedRoute>
          } 
        />

        <Route 
          path="/community/edit/:id" 
          element={
            <ProtectedRoute>
              <EditPostPage />
            </ProtectedRoute>
          } 
        />

        <Route 
          path="/community/profile/:id" 
          element={
            <ProtectedRoute>
              <UserProfilePage />
            </ProtectedRoute>
          } 
        />
        <Route path="/ingredients" element={<IngredientsPage />} />
        <Route path="/ingredients/:id" element={<IngredientDetailPage />} />
      </Route>
      
      {/* Catch all route - redirect to home */}
      <Route path="*" element={<Navigate to="/" replace />} />

    </Routes>
  );
};

export default AppRoutes;