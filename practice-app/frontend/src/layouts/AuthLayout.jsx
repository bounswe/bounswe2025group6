// src/layouts/AuthLayout.jsx

import React from 'react';
import { Link, Outlet } from 'react-router-dom';

/**
 * AuthLayout component for authentication pages
 * Provides consistent layout for login, register, forgot password, etc.
 */
const AuthLayout = () => {
  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-r from-green-300 to-blue-400">
      
        <header className="py-6 px-4">
          <div className="max-w-7xl mx-auto flex justify-between items-center">
            <Link to="/dashboard" className="layout-logo">
          <img
            src={'../assets/fithub_small.png'}
            alt="Logo"
            className="layout-logo-img"
            style={{ width: 32, height: 32, marginRight: 8, marginLeft:16, borderRadius: '50%' }}
          />
          FitHub
            </Link>
          </div>
        </header>
        
        {/* Main content - renders child routes */}
      <main className="flex-grow flex items-center justify-center p-4">
        <Outlet />
      </main>
      
      {/* Footer */}
      <footer className="py-4 text-center text-white text-sm">
        <p>© {new Date().getFullYear()} Meal Planner App. All rights reserved.</p>
      </footer>
    </div>
  );
};

export default AuthLayout;