// src/pages/auth/RegisterPage.jsx

import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../components/ui/Toast';
import Button from '../../components/ui/Button';
import Modal from '../../components/ui/Modal';
import TermsContent from '../../components/info/TermsContent';
import '../../styles/AuthPages.css';

const RegisterPage = () => {
  const { register, isLoading } = useAuth();
  const toast = useToast();
  const [showTermsModal, setShowTermsModal] = useState(false);

  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    userType: 'user',
    certificationUrl: '',
    acceptTerms: false
  });

  const [errors, setErrors] = useState({});
  const [isSuccess, setIsSuccess] = useState(false);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleUserTypeSelect = (type) => {
    setFormData(prev => ({ ...prev, userType: type }));
  };

  const validatePassword = (password) => {
    const minLength = 8;
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumber = /\d/.test(password);

    const requirements = [];
    if (password.length < minLength) requirements.push('at least 8 characters');
    if (!hasUpperCase) requirements.push('one uppercase letter');
    if (!hasLowerCase) requirements.push('one lowercase letter');
    if (!hasNumber) requirements.push('one number');

    return {
      isValid: password.length >= minLength && hasUpperCase && hasLowerCase && hasNumber,
      requirements
    };
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.username.trim()) newErrors.username = t("registerPageWarningOne");
    else if (formData.username.length < 3) newErrors.username = t("registerPageWarningTwo");
    
    if (!formData.email.trim()) newErrors.email = t("registerPageWarningThree");
    else if (!/\S+@\S+\.\S+/.test(formData.email)) newErrors.email = t("registerPageWarningFour");
    
    if (!formData.password) {
      newErrors.password = t("registerPageWarningFive");
    } else {
      const passwordValidation = validatePassword(formData.password);
      if (!passwordValidation.isValid) {
        newErrors.password = `Password must contain at least ${passwordValidation.requirements.join(', ')}`;
      }
    }
    
    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = t("registerPageWarningSix");
    }
    
    if (formData.userType === 'dietitian' && !formData.certificationUrl) {
      newErrors.certificationUrl = t("registerPageWarningSeven");
    }
    
    if (!formData.acceptTerms) {
      newErrors.acceptTerms = t("registerPageWarningEight");
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;
    try {
      await register(formData);
      setIsSuccess(true);
      toast.success('Registration successful! Please check your email to verify your account.');
    } catch (error) {
      console.error('Registration error:', error);
      toast.error(error.message || 'Failed to register');
      if (error.message.toLowerCase().includes('email')) {
        setErrors(prev => ({ ...prev, email: error.message }));
      } else if (error.message.toLowerCase().includes('username')) {
        setErrors(prev => ({ ...prev, username: error.message }));
      }
    }
  };
  useEffect(() => {
      document.title = "Register - FitHub";
    }, []);
  if (isSuccess) {
    return (
      <div className="auth-container">
        <div className="auth-card">
          <div className="success-container">
            <div className="success-icon">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 19v-8.93a2 2 0 01.89-1.664l7-4.666a2 2 0 012.22 0l7 4.666A2 2 0 0121 10.07V19M3 19a2 2 0 002 2h14a2 2 0 002-2M3 19l6.75-4.5M21 19l-6.75-4.5M3 10l6.75 4.5M21 10l-6.75 4.5m0 0l-1.14.76a2 2 0 01-2.22 0l-1.14-.76" />
              </svg>
            </div>
            <h2 className="success-title">{t("registerPageSuccessTitle")}</h2>
            <p className="success-message">
               {t("registerPageSuccessEmailOne")} <span className="success-email">{formData.email}</span>.
              {t("registerPageSuccessEmailTwo")}
            </p>
            <Link to="/login">
              <Button variant="primary">{t("registerPageLogin")}</Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-header">
          <h1 className="auth-title">{t("registerPageAuthHeader")}</h1>
          <p className="auth-subtitle">{t("registerPageAuthSubtitle")}</p>
        </div>
        <form onSubmit={handleSubmit} className="auth-form">
          <div>
            <label className="block text-sm font-medium mb-2">{t("registerPageAccountType")}</label>
            <div className="account-type-buttons">
              <button
                type="button"
                onClick={() => handleUserTypeSelect('user')}
                className={`account-type-button ${formData.userType === 'user' ? 'active' : ''}`}
              >
                {t("registerPageAccountTypeUser")}
              </button>
              <button
                type="button"
                onClick={() => handleUserTypeSelect('dietitian')}
                className={`account-type-button ${formData.userType === 'dietitian' ? 'active' : ''}`}
              >
                {t("registerPageAccountTypeDietitian")}
              </button>
            </div>
            <p className="account-type-info">
              {formData.userType === 'dietitian'
                ? 'As a dietitian, you can create meal plans, analyze recipes, and provide nutritional advice.'
                : 'Personal accounts let you create meal plans, save recipes, and manage your diet.'}
            </p>
          </div>

          <div>
            <label htmlFor="username">{t("registerPageUsername")}</label>
            <input
              type="text"
              id="username"
              name="username"
              value={formData.username}
              onChange={handleChange}
              className={errors.username ? 'input-error' : ''}
              placeholder="johndoe"
            />
            {errors.username && <p className="text-error">{errors.username}</p>}
          </div>

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
            <label htmlFor="password">{t("registerPagePassword")}</label>
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
            <p className="password-info">
              {t("registerPagePasswordMessage")}
            </p>
          </div>

          <div>
            <label htmlFor="confirmPassword">{t("registerPagePasswordConfirm")}</label>
            <input
              type="password"
              id="confirmPassword"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              className={errors.confirmPassword ? 'input-error' : ''}
              placeholder="••••••••"
            />
            {errors.confirmPassword && <p className="text-error">{errors.confirmPassword}</p>}
          </div>

          {formData.userType === 'dietitian' && (
            <div>
              <label htmlFor="certificationUrl">{t("registerPageCertificationUrl")}</label>
              <input
                type="text"
                id="certificationUrl"
                name="certificationUrl"
                value={formData.certificationUrl}
                onChange={handleChange}
                className={errors.certificationUrl ? 'input-error' : ''}
                placeholder="https://example.com/certifications/your-certification"
              />
              {errors.certificationUrl && <p className="text-error">{errors.certificationUrl}</p>}
              <p className="text-xs text-gray-500">{t("registerPageCertificationUrlMessage")}</p>
            </div>
          )}          <div className="checkbox-container">
            <input
              type="checkbox"
              id="acceptTerms"
              name="acceptTerms"
              checked={formData.acceptTerms}
              onChange={handleChange}
            />
            <label htmlFor="acceptTerms">
              I accept the{' '}
              <button 
                type="button" 
                className="terms-link" 
                onClick={(e) => {
                  e.preventDefault();
                  setShowTermsModal(true);
                }}
              >
                Fithub Terms and Conditions
              </button>
            </label>
          </div>
          {errors.acceptTerms && <p className="text-error">{errors.acceptTerms}</p>}
          
          <Modal 
            isOpen={showTermsModal} 
            onClose={() => setShowTermsModal(false)}
            title="Fithub Terms & Conditions"
          >
            <TermsContent />
            <div className="text-center mt-6">
              <Button 
                onClick={() => {
                  setShowTermsModal(false);
                  setFormData(prev => ({ ...prev, acceptTerms: true }));
                }}
              >
                Accept Terms
              </Button>
              <Button 
                className="ml-4" 
                variant="secondary" 
                onClick={() => setShowTermsModal(false)}
              >
                Close
              </Button>
            </div>
          </Modal>

          <Button type="submit" className="auth-submit" disabled={isLoading}>
            {isLoading ? 'Registering...' : 'Create Account'}
          </Button>
        </form>

        <div className="auth-link">
          <p>
            {t("registerPageAlreadyAccount")}?{' '}
            <Link to="/login">{t("homePageLogin")}</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;