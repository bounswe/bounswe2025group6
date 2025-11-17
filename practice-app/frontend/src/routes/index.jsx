// src/routes/index.jsx

import React, { useState, useEffect } from 'react';
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
import reportService from "../services/reportService";

// Protected pages
import DashboardPage from '../pages/DashboardPage';

import MealPlannerPage from '../pages/meal-planner/MealPlannerPage';
import ShoppingListPage from '../pages/shopping/ShoppingListPage';
import RecipeDiscoveryPage from '../pages/recipes/RecipeDiscoveryPage';
import RecipeDetailPage from '../pages/recipes/RecipeDetailPage';
import UploadRecipePage from '../pages/recipes/UploadRecipePage';
import ProfilePage from '../pages/profile/ProfilePage';

import CommunityPage from '../pages/community/CommunityPage';
import PostDetailPage from '../pages/community/PostDetailPage';
import CreatePostPage from '../pages/community/CreatePostPage';
import UserProfilePage from '../pages/community/UserProfilePage';
import EditPostPage from '../pages/community/EditPostPage';

import IngredientsPage from '../pages/ingredients/IngredientsPage'
import IngredientDetailPage from '../pages/ingredients/IngredientDetailPage';
import RecipeEditPage from '../pages/recipes/RecipeEditPage';

// Admin pages
import AdminReportsPage from '../pages/admin/AdminReportsPage';
import AdminLogin from '../pages/admin/AdminLogin'; // Fixed import path

import '../styles/index.css';

const AdminRoute = ({ children }) => {
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const checkAdminAccess = async () => {
      try {
        const token = localStorage.getItem('fithub_access_token');
        if (!token) {
          setIsAdmin(false);
          setError('Please log in first');
          setIsLoading(false);
          return;
        }

        const adminStatus = await reportService.checkAdminStatus();
        setIsAdmin(adminStatus.is_admin);
      } catch (error) {
        setIsAdmin(false);
        
        if (error.response?.status === 401) {
          setError('Authentication required. Please log in.');
        } else {
          setError('Access denied. Admin privileges required.');
        }
      } finally {
        setIsLoading(false);
      }
    };

    checkAdminAccess();
  }, []);

  if (isLoading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        minHeight: '50vh',
        fontSize: '1.1rem'
      }}>
        Checking admin access...
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div style={{ 
        display: 'flex', 
        flexDirection: 'column',
        justifyContent: 'center', 
        alignItems: 'center', 
        minHeight: '50vh',
        textAlign: 'center',
        padding: '2rem'
      }}>
        <h2 style={{ color: '#dc2626', marginBottom: '1rem' }}>Access Denied</h2>
        <p style={{ color: '#6b7280', marginBottom: '2rem' }}>
          {error || 'You need admin privileges to access this page.'}
        </p>
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', justifyContent: 'center' }}>
          <a 
            href="/admin/login" 
            style={{ 
              color: '#dc2626', 
              textDecoration: 'underline',
              fontSize: '1rem',
              fontWeight: 'bold'
            }}
          >
            Admin Login
          </a>
          <a 
            href="/dashboard" 
            style={{ 
              color: '#3b82f6', 
              textDecoration: 'underline',
              fontSize: '1rem'
            }}
          >
            Return to Dashboard
          </a>
        </div>
      </div>
    );
  }

  return children;
};

// Custom Protected Route for Admin that checks for authentication differently
const AdminProtectedRoute = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkAuth = () => {
      const token = localStorage.getItem('fithub_access_token');
      setIsAuthenticated(!!token);
      setIsLoading(false);
    };

    checkAuth();
  }, []);

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (!isAuthenticated) {
    return <Navigate to="/admin/login" replace />;
  }

  return children;
};

const AppRoutes = () => {
  return (
    <Routes>
      {/* Public home page */}
      <Route path="/" element={<HomePage />} />
      
      {/* Admin Login Route - Standalone, no layout */}
      <Route path="/admin/login" element={<AdminLogin />} />

      {/* Auth routes with AuthLayout */}
      <Route element={<AuthLayout />}>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
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
        
        {/* Admin Reports - Special handling for admin authentication */}
        <Route 
          path="/admin-reports" 
          element={
            <AdminProtectedRoute>
              <AdminRoute>
                <AdminReportsPage />
              </AdminRoute>
            </AdminProtectedRoute>
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
        <Route path="/recipes" element={<RecipeDiscoveryPage />} />
        <Route path="/recipes/:id" element={<RecipeDetailPage />} />
        <Route path="/recipes/:id/edit" element={<RecipeEditPage />} />
        
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