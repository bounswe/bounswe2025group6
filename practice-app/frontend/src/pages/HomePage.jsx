// src/pages/HomePage.jsx

import React, { useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import "../styles/HomePage.css";
import i18next from "i18next";
import { useTranslation } from "react-i18next";

const HomePage = () => {
  const { currentUser } = useAuth();

  const { t } = useTranslation();

  const features = [
    {
      icon: "🍽️",
      title: t("homePageIconOne"),
      desc: t("homePageIconOneDetail"),
    },
    {
      icon: "📊",
      title: t("homePageIconTwo"),
      desc: t("homePageIconTwoDetail"),
    },
    {
      icon: "🛒",
      title: t("homePageIconThree"),
      desc: t("homePageIconThreeDetail"),
    },
    {
      icon: "💰",
      title: t("homePageIconFour"),
      desc: t("homePageIconFourDetail"),
    },
    {
      icon: "👨‍👩‍👧‍👦",
      title: t("homePageIconFive"),
      desc: t("homePageIconFiveDetail"),
    },
    {
      icon: "🥦",
      title: t("homePageIconSix"),
      desc: t("homePageIconSixDetail"),
    },
  ];
  useEffect(() => {
    document.title = "Home - FitHub";
  }, []);

  const langChangeHandler = (e) => {
    const lang = e.target.value;
    i18next.changeLanguage(lang);
  };

  return (
    <div className="homepage">
      {/* Hero */}
      <section className="hero">
        <div className="hero-content">
          <select
            className="lang-dropdown"
            onChange={langChangeHandler}
            defaultValue={i18next.language}
          >
            <option value="en">English</option>
            <option value="tr">Türkçe</option>
          </select>
          <h1 className="hero-title">{t("homePageTitle")}</h1>
          <p className="hero-subtitle">{t("homePageSubtitle")}</p>
          <div className="hero-buttons">
            {currentUser ? (
              <Link to="/dashboard" className="btn btn-primary">{t("homePageGotoDashboard")}</Link>
            ) : (
              <>
                <Link to="/login" className="btn btn-secondary">
                  {t("homePageLogin")}
                </Link>
                <Link to="/register" className="btn btn-primary">
                  {t("homePageSignUp")}
                </Link>
              </>
            )}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="features">
        <h2 className="section-title">{t("homePageSecondTitle")}</h2>
        <p className="section-subtitle">
          {t("homePageSecondSubtitle")}
        </p>
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
        <h2 className="section-title">{t("homePageThirdTitle")}</h2>
        <div className="steps">
          <div className="step">
            <span className="step-number">1</span>
            <h4>{t("homePageStepOne")}</h4>
            <p>{t("homePageStepOneDetail")}</p>
          </div>
          <div className="step">
            <span className="step-number">2</span>
            <h4>{t("homePageStepTwo")}</h4>
            <p>{t("homePageStepTwoDetail")}</p>
          </div>
          <div className="step">
            <span className="step-number">3</span>
            <h4>{t("homePageStepThree")}</h4>
            <p>{t("homePageStepThreeDetail")}</p>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="cta">
        <h2>{t("homePageCtaHeader")}</h2>
        <p>{t("homePageCtaDetail")}</p>
        <Link
          to={currentUser ? "/dashboard" : "/register"}
          className="btn btn-primary"
        >
          {currentUser ? t("homePageGotoDashboard") : t("homePageSignUp")}
        </Link>
      </section>
    </div>
  );
};

export default HomePage;
