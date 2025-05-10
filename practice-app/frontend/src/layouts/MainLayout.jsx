// src/layouts/MainLayout.jsx

import React, { useState } from 'react';
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../components/ui/Toast';
import '../styles/Layout.css';

const MainLayout = () => {
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const toast = useToast();

  const handleLogout = async () => {
    try {
      await logout();
      toast.success('Logged out successfully');
      navigate('/login');
    } catch (error) {
      toast.error('Failed to log out');
    }
  };

  const navItems = [
    { path: '/dashboard', label: 'Dashboard', icon: '🏠' },
    { path: '/meal-planner', label: 'Meal Planner', icon: '🍽️' },
    { path: '/recipes', label: 'Recipes', icon: '📖' },
    { path: '/shopping-list', label: 'Shopping List', icon: '🛒' },
    { path: '/ingredients', label: 'Ingredients', icon: '🥕' },
    { path: '/community', label: 'Community', icon: '💬' },
    { path: '/profile', label: 'Profile', icon: '👤' },

  ];

  const isActive = (path) => {
    return location.pathname === path || location.pathname.startsWith(`${path}/`);
  };

  return (
    <div className="layout-container" style={{ padding: '16px' }}>
      <header className="layout-header">
        <div className="layout-header-row margin-top-6">
          <div className="layout-header-left">
            <Link to="/dashboard" className="layout-logo">
              <img
                src={'../assets/fithub_small.png'}
                alt="Logo"
                className="layout-logo-img"
                style={{ width: 32, height: 32, marginRight: 8, borderRadius: '50%' }}
              />
              FitHub
            </Link>
          </div>
          <div className="layout-header-right">
            <button className="layout-logout" onClick={handleLogout}>
              Logout <span role="img" aria-label="logout">🚪</span>
            </button>
          </div>
        </div>
        <nav className="layout-nav">
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`layout-nav-link ${isActive(item.path) ? 'active' : ''}`}
            >
              <span className="layout-nav-icon">{item.icon}</span>
              {item.label}
            </Link>
          ))}
        </nav>

      </header>

      <main className="layout-main">
        <div className="layout-main-inner">
          <Outlet />
        </div>
      </main>

      <footer className="layout-footer">
        <div className="layout-footer-inner">
          <p>© {new Date().getFullYear()} FitHub </p>

          <div className="layout-footer-links">
            <a href="#">About</a>
            <a href="#">Terms</a>
            <a href="#">Privacy</a>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default MainLayout;
