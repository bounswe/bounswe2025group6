// src/layouts/MainLayout.jsx
import { Outlet, Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { useToast } from "../components/ui/Toast";
import "../styles/Layout.css";
import { useTranslation } from "react-i18next";

const MainLayout = () => {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const toast = useToast();
  const { t } = useTranslation();

  const handleLogout = async () => {
    try {
      await logout();
      toast.success(t("loggedOutSuccessfully"));
      navigate("/login");
    } catch (error) {
      toast.error(t("failedToLogOut"));
    }
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
            Logout
          </button>
        </div>
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
            <p>Cmpe352 Group 6</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default MainLayout;
