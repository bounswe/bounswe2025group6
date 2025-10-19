// src/pages/DashboardPage.jsx

import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import Card from "../components/ui/Card";
import Button from "../components/ui/Button";
import "../styles/DashboardPage.css";
import { getCurrentUser } from "../services/authService";
import userService from "../services/userService";
import reportService from "../services/reportService"; // Add this import
import { useTranslation } from "react-i18next";

const DashboardPage = () => {
  const [currentUser, setCurrentUser] = useState(null);
  const [username, setUsername] = useState("User");
  const [isAdmin, setIsAdmin] = useState(false);
  const [isCheckingAdmin, setIsCheckingAdmin] = useState(true);
  const { t } = useTranslation();

  const getWelcomeMessage = () => {
    const hour = new Date().getHours();
    if (hour < 12) return t("goodMorning");
    if (hour < 18) return t("goodAfternoon");
    return t("goodEvening");
  };

  const checkAdminStatus = async () => {
    try {
      const adminCheck = await reportService.checkAdminStatus();
      return adminCheck.is_admin === true;
    } catch (error) {
      return false;
    }
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

        // Check admin status using the reports service
        const adminStatus = await checkAdminStatus();
        setIsAdmin(adminStatus);
      } catch (error) {
        console.error("Error fetching user data:", error);
      } finally {
        setIsCheckingAdmin(false);
      }
    };

    fetchUserData();
    document.title = "Dashboard";
  }, []);

  if (!currentUser || isCheckingAdmin) {
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
            {t("dashbboardSubtitle")}
          </p>
        </div>
      </div>

      <div className="dashboard-cards">
        <Card className="dashboard-card">
          <Card.Body className="dashboard-card-body">
            <div className="dashboard-card-icon">🍽️</div>
            <h2 className="dashboard-card-title">{t("dashboardCardOneTitle")}</h2>
            <p className="dashboard-card-content">
              {t("dashboardCardOneContent")}
            </p>
            <Link to="/meal-planner" className="mt-auto">
              <Button className="green-button">{t("dashboardCardOneButton")}</Button>
            </Link>
          </Card.Body>
        </Card>

        <Card className="dashboard-card">
          <Card.Body className="dashboard-card-body">
            <div className="dashboard-card-icon">📖</div>
            <h2 className="dashboard-card-title">{t("dashboardCardTwoTitle")}</h2>
            <p className="dashboard-card-content">
              {t("dashboardCardTwoContent")}
            </p>
            <Link to="/recipes" className="mt-auto">
              <Button className="green-button">{t("dashboardCardTwoButton")}</Button>
            </Link>
          </Card.Body>
        </Card>

        <Card className="dashboard-card">
          <Card.Body className="dashboard-card-body">
            <div className="dashboard-card-icon">🛒</div>
            <h2 className="dashboard-card-title">{t("dashboardCardThreeTitle")}</h2>
            <p className="dashboard-card-content">
              {t("dashboardCardThreeContent")}
            </p>
            <Link to="/shopping-list" className="mt-auto">
              <Button className="green-button">{t("dashboardCardThreeTitle")}</Button>
            </Link>
          </Card.Body>
        </Card>

        <Card className="dashboard-card">
          <Card.Body className="dashboard-card-body">
            <div className="dashboard-card-icon">💬</div>
            <h2 className="dashboard-card-title">{t("dashboardCardFourTitle")}</h2>
            <p className="dashboard-card-content">
              {t("dashboardCardFourContent")}
            </p>
            <Link to="/community" className="mt-auto">
              <Button className="green-button">{t("dashboardCardFourTitle")}</Button>
            </Link>
          </Card.Body>
        </Card>

        {/* Admin Reports Card - Only visible to admins */}
        {isAdmin && (
          <Card className="dashboard-card admin-card">
            <Card.Body className="dashboard-card-body">
              <div className="dashboard-card-icon">⚙️</div>
              <h2 className="dashboard-card-title">Admin Reports</h2>
              <p className="dashboard-card-content">
                Manage user reports and moderate content.
              </p>
              <Link to="/admin-reports" className="mt-auto">
                <Button className="admin-button">Manage Reports</Button>
              </Link>
            </Card.Body>
          </Card>
        )}
      </div>

      <style>{`
        .admin-card {
          border: 2px solid #dc2626 !important;
          background: linear-gradient(to bottom, #fef2f2, #fecaca) !important;
        }
        
        .admin-button {
          background-color: #dc2626 !important;
          color: white;
          border: none;
          padding: 0.5rem 1rem;
          border-radius: 0.25rem;
          transition: all 0.2s ease;
        }
        
        .admin-button:hover {
          background-color: #b91c1c !important;
          transform: translateY(-2px);
          box-shadow: 0 4px 6px rgba(220, 38, 38, 0.25);
        }
      `}</style>
    </div>
  );
};

export default DashboardPage;
