// src/pages/HomePage.jsx

import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import '../styles/HomePage.css';

const HomePage = () => {
  const { currentUser } = useAuth();

  const features = [
    { icon: '🍽️', title: 'Smart Meal Planning', desc: 'Create balanced meal plans tailored to your preferences and budget.' },
    { icon: '📊', title: 'Nutritional Analysis', desc: 'Access nutrition info for all your meals and recipes.' },
    { icon: '🛒', title: 'Shopping Lists', desc: 'Auto-generate shopping lists from your weekly plans.' },
    { icon: '💰', title: 'Budget-Friendly', desc: 'Optimize your grocery spending with cost-effective meals.' },
    { icon: '👨‍👩‍👧‍👦', title: 'Family Friendly', desc: 'Easily scale meals for different household sizes.' },
    { icon: '🥦', title: 'Dietary Preferences', desc: 'Filter meals by vegetarian, vegan, keto and more.' },
  ];
  useEffect(() => {
    document.title = "Home - FitHub";
  }, []);
  return (
    <div className="homepage">
      {/* Hero */}
      <section className="hero">
        <div className="hero-content">
          <h1 className="hero-title">Plan Your Meals with Ease</h1>
          <p className="hero-subtitle">Simplify meal planning, discover healthy recipes, and save money on groceries.</p>
          <div className="hero-buttons">
            {currentUser ? (
              <Link to="/dashboard" className="btn btn-primary">Go to Dashboard</Link>
            ) : (
              <>
                <Link to="/login" className="btn btn-secondary">Login</Link>
                <Link to="/register" className="btn btn-primary">Sign Up Free</Link>
              </>
            )}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="features">
        <h2 className="section-title">Everything You Need for Meal Planning</h2>
        <p className="section-subtitle">Our tools help you plan, shop, and cook better every day.</p>
        <div className="feature-grid">
          {features.map((f, i) => (
            <div key={i} className="feature-card">
              <div className="feature-icon">{f.icon}</div>
              <h3>{f.title}</h3>
              <p>{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* How It Works */}
      <section className="how-it-works">
        <h2 className="section-title">How It Works</h2>
        <div className="steps">
          <div className="step">
            <span className="step-number">1</span>
            <h4>Create Your Profile</h4>
            <p>Set your dietary goals, budget and preferences.</p>
          </div>
          <div className="step">
            <span className="step-number">2</span>
            <h4>Build a Meal Plan</h4>
            <p>Select from thousands of nutritious recipes.</p>
          </div>
          <div className="step">
            <span className="step-number">3</span>
            <h4>Shop & Cook</h4>
            <p>Follow your personalized shopping list.</p>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="cta">
        <h2>Ready to Simplify Your Meal Planning?</h2>
        <p>Join thousands of users saving time and money every day.</p>
        <Link to={currentUser ? '/dashboard' : '/register'} className="btn btn-primary">
          {currentUser ? 'Go to Dashboard' : 'Sign Up Free'}
        </Link>
      </section>
    </div>
  );
};

export default HomePage;