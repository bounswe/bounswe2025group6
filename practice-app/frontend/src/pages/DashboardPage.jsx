// src/pages/DashboardPage.jsx

import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import Card from "../components/ui/Card";
import Button from "../components/ui/Button";
import "../styles/DashboardPage.css";
import { getCurrentUser } from "../services/authService";
import userService from "../services/userService";
import { useTranslation } from "react-i18next";

const DashboardPage = () => {
  const [currentUser, setCurrentUser] = useState(null);
  const [username, setUsername] = useState("User");
  const { t } = useTranslation();

  const getWelcomeMessage = () => {
    const hour = new Date().getHours();
    if (hour < 12) return t("goodMorning");
    if (hour < 18) return t("goodAfternoon");
    return t("goodEvening");
  };

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const user = await getCurrentUser();
        setCurrentUser(user);

        if (user && user.id) {
          const fetchedUsername = await userService.getUsername(user.id);
          setUsername(fetchedUsername);
        }
      } catch (error) {
        console.error("Error fetching user data:", error);
      }
    };

    fetchUserData();
    document.title = "Dashboard";
  }, []);

  if (!currentUser) {
    return <div>{t("loading")}</div>;
  }

  return (
    <div className="dashboard-container dashboard-cards">
      <div className="dashboard-header center">
        <div>
          <h1 className="dashboard-title">
            {getWelcomeMessage()}, {username}!
          </h1>
          <p className="dashboard-subtitle">
            Welcome to your meal planning dashboard. What would you like to do
            today?
          </p>
        </div>
      </div>

      <div className="dashboard-cards">
        <Card className="dashboard-card">
          <Card.Body className="dashboard-card-body">
            <div className="dashboard-card-icon">🍽️</div>
            <h2 className="dashboard-card-title">Plan Your Meals</h2>
            <p className="dashboard-card-content">
              Create personalized meal plans based on your preferences and
              dietary needs.
            </p>
            <Link to="/meal-planner" className="mt-auto">
              <Button className="green-button">Plan Meals</Button>
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
              <Button className="green-button">Find Recipes</Button>
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
              <Button className="green-button">Shopping List</Button>
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
              <Button className="green-button">Community</Button>
            </Link>
          </Card.Body>
        </Card>
      </div>
    </div>
  );
};

export default DashboardPage;
