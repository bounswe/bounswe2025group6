// src/layouts/AuthLayout.jsx

import React from 'react';
import { Link, Outlet } from 'react-router-dom';

/**
 * AuthLayout component for authentication pages
 * Provides consistent layout for login, register, forgot password, etc.
 */
const AuthLayout = () => {
  return (
    <div className="page-AuthLayout">
        <header>
            <Link to="/dashboard" className="layout-logo">
                          <img
                            src={'../assets/fithub_small.png'}
                            alt="Logo"
                            className="layout-logo-img"
                          />
                          <span className="logo-text">
                            <span className="fit">Fit</span>
                            <span className="hub">Hub</span>
                          </span>
                        </Link>
        </header>
        
        {/* Main content - renders child routes */}
      <main className="flex-grow flex items-center justify-center p-4">
        <Outlet />
      </main>
      
      {/* Footer */}
      <footer>
        <p>© {new Date().getFullYear()} FitHub</p>
      </footer>
    </div>
  );
};

export default AuthLayout;