// src/pages/DashboardPage.jsx

import React, { useState, useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import Button from "../components/ui/Button";
import "../styles/DashboardPage.css";
import { getCurrentUser } from "../services/authService";
import userService from "../services/userService";
import reportService from "../services/reportService"; // Add this import
import analyticsService from "../services/analyticsService";
import { useTranslation } from "react-i18next";
import ActivityStreamWidget from "../components/activity-stream/ActivityStreamWidget";

const ANALYTICS_PULSE = [
  {
    key: "users_count",
    labelKey: "analytics_users_label",
    sublabelKey: "analytics_users_sublabel",
    icon: "👥",
    accent: "community",
  },
  {
    key: "recipes_count",
    labelKey: "analytics_recipes_label",
    sublabelKey: "analytics_recipes_sublabel",
    icon: "🍲",
    accent: "recipes",
  },
  {
    key: "ingredients_count",
    labelKey: "analytics_ingredients_label",
    sublabelKey: "analytics_ingredients_sublabel",
    icon: "🥬",
    accent: "ingredients",
  },
  {
    key: "posts_count",
    labelKey: "analytics_posts_label",
    sublabelKey: "analytics_posts_sublabel",
    icon: "📣",
    accent: "community",
  },
  {
    key: "comments_count",
    labelKey: "analytics_comments_label",
    sublabelKey: "analytics_comments_sublabel",
    icon: "💬",
    accent: "comments",
  },
];

const DASHBOARD_ACTIONS = [
  {
    key: "plan",
    titleKey: "dashboardCardOneTitle",
    contentKey: "dashboardCardOneContent",
    buttonKey: "dashboardCardOneButton",
    icon: "🍽️",
    to: "/meal-planner",
    accent: "plan",
  },
  {
    key: "discover",
    titleKey: "dashboardCardTwoTitle",
    contentKey: "dashboardCardTwoContent",
    buttonKey: "dashboardCardTwoButton",
    icon: "📖",
    to: "/recipes",
    accent: "recipes",
  },
  {
    key: "shopping",
    titleKey: "dashboardCardThreeTitle",
    contentKey: "dashboardCardThreeContent",
    icon: "🛒",
    to: "/shopping-list",
    accent: "shopping",
  },
  {
    key: "community",
    titleKey: "dashboardCardFourTitle",
    contentKey: "dashboardCardFourContent",
    icon: "💬",
    to: "/community",
    accent: "community",
  },
];

const DashboardPage = () => {
  const [currentUser, setCurrentUser] = useState(null);
  const [username, setUsername] = useState("User");
  const [isAdmin, setIsAdmin] = useState(false);
  const [isCheckingAdmin, setIsCheckingAdmin] = useState(true);
  const [analytics, setAnalytics] = useState(null);
  const [analyticsError, setAnalyticsError] = useState(null);
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
      console.error("Error checking admin status:", error);
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

        // Fetch analytics data
        try {
          const analyticsData = await analyticsService.getAnalytics();
          console.log("Analytics data received:", analyticsData);
          setAnalytics(analyticsData);
          setAnalyticsError(null);
        } catch (analyticsError) {
          console.error(
            "Error fetching analytics - Full error:",
            analyticsError
          );
          console.error("Error message:", analyticsError.message);
          console.error("Error response:", analyticsError.response);
          console.error("Error config:", analyticsError.config);
          setAnalytics(null);
          setAnalyticsError(
            analyticsError.response?.data?.detail || analyticsError.message
          );
        }
      } catch (error) {
        console.error("Error fetching user data:", error);
      } finally {
        setIsCheckingAdmin(false);
      }
    };

    fetchUserData();
    document.title = "Dashboard";
  }, []);

  // Match activity widget height to analytics section
  useEffect(() => {
    const matchHeights = () => {
      const analyticsSection = document.querySelector(".dashboard-analytics");
      const activityWidget = document.querySelector(
        ".dashboard-activity-widget"
      );

      if (analyticsSection && activityWidget) {
        const analyticsHeight = analyticsSection.offsetHeight;
        activityWidget.style.maxHeight = `${analyticsHeight}px`;
      }
    };

    // Match heights after analytics load
    if (analytics || analyticsError) {
      // Small delay to ensure DOM is updated
      setTimeout(matchHeights, 100);
    }

    // Also match on window resize
    window.addEventListener("resize", matchHeights);

    return () => {
      window.removeEventListener("resize", matchHeights);
    };
  }, [analytics, analyticsError]);

  const highlightCards = useMemo(() => {
    return ANALYTICS_PULSE.map((metric) => {
      const value = analytics?.[metric.key];
      return {
        ...metric,
        label: t(metric.labelKey),
        sublabel: t(metric.sublabelKey),
        value,
      };
    });
  }, [analytics, t]);

  if (!currentUser || isCheckingAdmin) {
    return <div>{t("loading")}</div>;
  }

  return (
    <div className="dashboard-container">
      {/* Greetings Section */}
      <div className="dashboard-greetings">
        <h1 className="greetings-title">
          {getWelcomeMessage()}, {username}!
        </h1>
        <p className="greetings-subtitle">{t("dashbboardSubtitle")}</p>
      </div>

      {/* Analytics and Activity Stream Side by Side */}
      <div className="dashboard-main-content">
        <section className="dashboard-analytics">
          {analyticsError ? (
            <div className="analytics-error">
              Error loading analytics: {analyticsError}
            </div>
          ) : (
            <div className="analytics-card-grid">
              {highlightCards.map((card) => (
                <article
                  key={card.key}
                  className={`analytics-tile accent-${card.accent}`}
                >
                  <div className="analytics-tile-header">
                    <span className="analytics-icon">{card.icon}</span>
                    <span className="analytics-chip">{card.label}</span>
                  </div>
                  <div className="analytics-tile-body">
                    <div className="analytics-metric">
                      {card.value !== undefined && card.value !== null
                        ? card.value
                        : "—"}
                    </div>
                    <p className="analytics-sublabel">{card.sublabel}</p>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>

        {/* Activity Stream Widget */}
        <div className="dashboard-activity-widget">
          <ActivityStreamWidget />
        </div>
      </div>

      {/* Quick Paths Section */}
      <section className="dashboard-actions">
        <div className="actions-grid">
          {DASHBOARD_ACTIONS.map((action) => (
            <article
              key={action.key}
              className={`action-card accent-${action.accent}`}
            >
              <div className="action-card-top">
                <span className="action-icon">{action.icon}</span>
                <span className="action-chip">{t(action.titleKey)}</span>
              </div>
              <p className="action-desc">{t(action.contentKey)}</p>
              <Link to={action.to} className="action-link">
                <Button className="action-button">
                  {action.buttonKey ? t(action.buttonKey) : t(action.titleKey)}
                </Button>
              </Link>
            </article>
          ))}

          {isAdmin && (
            <article className="action-card accent-admin">
              <div className="action-card-top">
                <span className="action-icon">⚙️</span>
                <span className="action-chip">Admin</span>
              </div>
              <p className="action-desc">
                Manage user reports and moderate content.
              </p>
              <Link to="/admin-reports" className="action-link">
                <Button className="action-button danger">Manage Reports</Button>
              </Link>
            </article>
          )}
        </div>
      </section>
    </div>
  );
};

export default DashboardPage;
