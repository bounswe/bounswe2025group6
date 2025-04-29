// src/pages/HomePage.jsx
import React from 'react';
import { Link } from 'react-router-dom';
import '../styles/HomePage.css';

const HomePage = () => {
  return (
    <div className="homepage-wrapper">
      <div className="homepage-container">
        <h1 className="homepage-title">🍽️ FitHub</h1>
        <p className="homepage-subtitle">
          Plan your meals, discover healthy recipes, and manage your diet & budget smarter.
        </p>
        <div className="homepage-buttons">
          <Link to="/login">
            <button className="homepage-btn-outline">Login</button>
          </Link>
          <Link to="/register">
            <button className="homepage-btn-filled">Register</button>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default HomePage;
/*
import { Link } from 'react-router-dom';

const HomePage = () => {
  return (
    <div className="min-h-screen flex flex-col justify-center items-center">
      <h1 className="text-4xl font-bold mb-4">🍽️ Meal Planner App</h1>
      <p className="mb-6">Plan your meals, discover healthy recipes, manage your diet and budget smarter.</p>
      <div className="flex gap-4">
        <Link to="/login">
          <button className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">Login</button>
        </Link>
        <Link to="/register">
          <button className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700">Register</button>
        </Link>
      </div>
    </div>
  );
};

export default HomePage;

*/