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

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

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
    { path: '/community', label: 'Community', icon: '💬' },
    { path: '/profile', label: 'Profile', icon: '👤' },

  ];

  const isActive = (path) => {
    return location.pathname === path || location.pathname.startsWith(`${path}/`);
  };

  return (
    <div className="layout-container">
      <header className="layout-header">
        <div className="layout-header-inner">
          <div className="layout-header-left">
            <Link to="/dashboard" className="layout-logo">
              <span className="layout-logo-icon">🍽️</span>
              Meal Planner
            </Link>
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
          </div>

          <div className="layout-header-right">
            <button onClick={handleLogout} className="layout-logout">
              Logout
            </button>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="layout-mobile-toggle md:hidden"
            >
              {mobileMenuOpen ? '✖' : '☰'}
            </button>
          </div>
        </div>

        {mobileMenuOpen && (
          <div className="layout-mobile-menu">
            {navItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={`layout-mobile-link ${isActive(item.path) ? 'active' : ''}`}
                onClick={() => setMobileMenuOpen(false)}
              >
                <span>{item.icon}</span> {item.label}
              </Link>
            ))}
            <button
              onClick={() => {
                handleLogout();
                setMobileMenuOpen(false);
              }}
              className="layout-mobile-link"
            >
              <span>🚪</span> Logout
            </button>
          </div>
        )}
      </header>

      <main className="layout-main">
        <div className="layout-main-inner">
          <Outlet />
        </div>
      </main>

      <footer className="layout-footer">
        <div className="layout-footer-inner">
          <p>© {new Date().getFullYear()} Meal Planner App</p>
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
