// src/layouts/MainLayout.jsx
import { Outlet, Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { useToast } from "../components/ui/Toast";
import "../styles/Layout.css";
import { useTranslation } from "react-i18next";
import i18next from "i18next";
import { useEffect, useState } from "react";
import { getCurrentUser } from "../services/authService";
import userService from "../services/userService";

const MainLayout = () => {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const toast = useToast();
  const { t } = useTranslation();
  const [currentUser, setCurrentUser] = useState(null);
  // const

  const handleLogout = async () => {
    try {
      await logout();
      toast.success(t("loggedOutSuccessfully"));
      navigate("/login");
    } catch (e) {
      console.error("Logout failed:", e);
      toast.error(t("failedToLogOut"));
    }
  };

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const user = await getCurrentUser();

        if (user && user.id) {
          const fetchedUser = await userService.getUserById(user.id);
          setCurrentUser(fetchedUser);
        }
      } catch (error) {
        console.error("Error fetching user data:", error);
      }
    };

    fetchUserData();
  }, []);

  useEffect(() => {
    if (!currentUser || !currentUser.language) return;
    i18next.changeLanguage(currentUser.language);
  }, [currentUser]);

  const langChangeHandler = (e) => {
    const lang = e.target.value;
    const updatedUser = { ...currentUser, language: lang };
    setCurrentUser(updatedUser);
    userService
      .updateUserById(currentUser?.id, updatedUser)
      .then(() => {
        i18next.changeLanguage(lang);
      })
      .catch((error) => {
        console.error("Error updating language preference:", error);
        toast.error(t("failedToUpdateLanguagePreference"));
      });
  };
  const navItems = [
    { path: "/dashboard", label: t("dashboard") },
    { path: "/meal-planner", label: t("mealPlanner") },
    { path: "/recipes", label: t("recipes") },
    { path: "/shopping-list", label: t("shoppingList") },
    { path: "/ingredients", label: t("ingredients") },
    { path: "/community", label: t("community") },
    { path: "/profile", label: t("profile") },
  ];

  const isActive = (path) => {
    return (
      location.pathname === path || location.pathname.startsWith(`${path}/`)
    );
  };

  return (
    <div className="layout-container">
      <header className="layout-header">
        <div className="layout-header-left">
          <Link to="/dashboard" className="layout-logo">
            <img
              src={"../assets/fithub_small.png"}
              alt="Logo"
              className="layout-logo-img"
            />
            <span className="logo-text">
              <span className="fit">Fit</span>
              <span className="hub">Hub</span>
            </span>
          </Link>
        </div>
        <nav className="layout-nav">
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`layout-nav-link ${
                isActive(item.path) ? "active" : ""
              }`}
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="layout-header-right">
          <button className="layout-logout green-button" onClick={handleLogout}>
            {t("logout")}
          </button>
        </div>
        <select onChange={langChangeHandler} defaultValue={i18next.language}>
          <option value="en">English</option>
          <option value="tr">Türkçe</option>
        </select>
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
            <p>Cmpe451 Group 6</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default MainLayout;
