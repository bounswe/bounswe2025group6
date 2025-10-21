// src/pages/auth/LoginPage.jsx

import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../components/ui/Toast';
import Button from '../../components/ui/Button';
import '../../styles/AuthPages.css';
import { useTranslation } from "react-i18next";

const LoginPage = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const { login, isLoading } = useAuth();
  const toast = useToast();
  const redirectPath = location.state?.from?.pathname || '/dashboard';

  const [formData, setFormData] = useState({
    email: '',
    password: '',
    rememberMe: false
  });

  const [errors, setErrors] = useState({});
 console.log("Deneme")
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }));
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.email.trim()) newErrors.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(formData.email)) newErrors.email = 'Please enter a valid email address';
    if (!formData.password) newErrors.password = 'Password is required';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;
    try {
      await login({ email: formData.email, password: formData.password });
      toast.success('Login successful!');
      navigate(redirectPath);
    } catch (error) {
      if (error.response && error.response.status === 429) {
        toast.error('Login failed 5 times. Please wait 5 minutes to try again.', {
          duration: 5000,
          style: {
            background: '#ff4b4b',
            color: '#fff',
            fontWeight: 'bold',
            padding: '16px',
            borderRadius: '8px',
          },
        });
      } else {
        toast.error(error.message || 'Failed to login');
        if (error.message.toLowerCase().includes('email')) setErrors(prev => ({ ...prev, email: error.message }));
        else if (error.message.toLowerCase().includes('password')) setErrors(prev => ({ ...prev, password: error.message }));
      }
    }
  };
  useEffect(() => {
    document.title = "Login - FitHub";
  }, []);
  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-header">
          <h1 className="auth-title">{t("loginPageHeaderTitle")}</h1>
          <p className="auth-subtitle">{t("loginPageHeaderSubTitle")}</p>
        </div>
        <form onSubmit={handleSubmit} className="auth-form">
          <div>
            <label htmlFor="email">{t("registerPageEmail")}</label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              className={errors.email ? 'input-error' : ''}
              placeholder="you@example.com"
            />
            {errors.email && <p className="text-error">{errors.email}</p>}
          </div>

          <div>
            <div className="flex-between">
              <label htmlFor="password">{t("registerPagePassword")}</label>
              <Link to="/forgot-password" className="form-link">{t("loginPageForgotPassword")}?</Link>
            </div>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              className={errors.password ? 'input-error' : ''}
              placeholder="••••••••"
            />
            {errors.password && <p className="text-error">{errors.password}</p>}
          </div>

          <div className="checkbox-container">
            <input
              type="checkbox"
              id="rememberMe"
              name="rememberMe"
              checked={formData.rememberMe}
              onChange={handleChange}
            />
            <label htmlFor="rememberMe">{t("loginPageRememberMe")}</label>
          </div>

          <Button type="submit" className="green-button" disabled={isLoading}>
            {isLoading ? 'Logging in...' : 'Log In'}
          </Button>
        </form>

        <div className="auth-link">
          <p>{t("loginPageDontHaveAccount")}? <Link to="/register">{t("homePageSignUp")}</Link></p>
        </div>


      </div>
    </div>
  );
};

export default LoginPage;