// src/pages/DashboardPage.jsx

import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import '../styles/DashboardPage.css';

const DashboardPage = () => {
  const { currentUser } = useAuth();

  const getWelcomeMessage = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  return (
    <div className="dashboard-container dashboard-cards">
      <div className="dashboard-header center">
        <div>
          <h1 className="dashboard-title">
            {getWelcomeMessage()}, {currentUser?.username || 'User'}!
          </h1>
          <p className="dashboard-subtitle">
            Welcome to your meal planning dashboard. What would you like to do today?
          </p>
        </div>
      </div>

      <div className="dashboard-cards">
        <Card className="dashboard-card">
          <Card.Body className="dashboard-card-body">
            <div className="dashboard-card-icon">🍽️</div>
            <h2 className="dashboard-card-title">Plan Your Meals</h2>
            <p className="dashboard-card-content">
              Create personalized meal plans based on your preferences and dietary needs.
            </p>
            <Link to="/meal-planner" className="mt-auto">
              <Button className="w-full" variant="success">Plan Meals</Button>
            </Link>
          </Card.Body>
        </Card>

        <Card className="dashboard-card">
          <Card.Body className="dashboard-card-body">
            <div className="dashboard-card-icon">📖</div>
            <h2 className="dashboard-card-title">Discover Recipes</h2>
            <p className="dashboard-card-content">
              Browse our collection of recipes or search for something specific.
            </p>
            <Link to="/recipes" className="mt-auto">
              <Button className="w-full" variant="success">Find Recipes</Button>
            </Link>
          </Card.Body>
        </Card>

        <Card className="dashboard-card">
          <Card.Body className="dashboard-card-body">
            <div className="dashboard-card-icon">🛒</div>
            <h2 className="dashboard-card-title">Shopping List</h2>
            <p className="dashboard-card-content">
              View and manage your shopping list based on your meal plans.
            </p>
            <Link to="/shopping-list" className="mt-auto">
              <Button className="w-full" variant="success">Shopping List</Button>
            </Link>
          </Card.Body>
        </Card>

        <Card className="dashboard-card">
          <Card.Body className="dashboard-card-body">
            <div className="dashboard-card-icon">💬</div>
            <h2 className="dashboard-card-title">Community</h2>
            <p className="dashboard-card-content">
              Friendly and collaborative community.
            </p>
            <Link to="/community" className="mt-auto">
              <Button className="w-full" variant="success">Community</Button>
            </Link>
          </Card.Body>
        </Card>
      </div>

      <div className="dashboard-sections">
        <Card>
          <Card.Header className="dashboard-section-header">
            <h2 className="dashboard-section-title">Recent Activity</h2>
          </Card.Header>
          <Card.Body>
            <ul className="dashboard-activity-list">
              <li>
                <span className="activity-time">Today</span>
                <span className="activity-desc">Created a new meal plan</span>
              </li>
              <li>
                <span className="activity-time">Yesterday</span>
                <span className="activity-desc">Added 3 recipes to favorites</span>
              </li>
              <li>
                <span className="activity-time">3 days ago</span>
                <span className="activity-desc">Completed shopping list</span>
              </li>
            </ul>
          </Card.Body>
        </Card>
        <br/>

        <Card>
          <Card.Header className="flex justify-between items-center">
            <h2 className="dashboard-section-title">Saved Meal Plans</h2>
            <Link to="/saved-meal-plans" className="dashboard-view-link">View All</Link>
          </Card.Header>
          <Card.Body>
            <ul className="dashboard-plan-list">
              <li className="dashboard-plan-item">
                <h3 className="plan-title">Weekly Plan</h3>
                <p className="plan-meta">Created 2 days ago</p>
                <p className="plan-details">Breakfast, Lunch, and Dinner for 7 days</p>
              </li>
              <li className="dashboard-plan-item">
                <h3 className="plan-title">Low Carb Plan</h3>
                <p className="plan-meta">Created 1 week ago</p>
                <p className="plan-details">High protein meals with minimal carbs</p>
              </li>
            </ul>
          </Card.Body>
        </Card>
      </div>
    </div>
  );
};

export default DashboardPage;
