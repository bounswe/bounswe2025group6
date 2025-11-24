// src/pages/auth/ForgotPasswordPage.jsx

import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../components/ui/Toast';
import Button from '../../components/ui/Button';
import '../../styles/AuthPages.css';
import { useTranslation } from "react-i18next";

const ForgotPasswordPage = () => {
  const { t } = useTranslation();

  const { requestResetCode, verifyResetCode, resetPassword, isLoading } = useAuth();
  const toast = useToast();
  
  // Common state
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  
  // State for code verification method
  const [currentStep, setCurrentStep] = useState(1); // 1: Email input, 2: Code verification, 3: New password, 4: Success
  const [resetCode, setResetCode] = useState('');
  const [isCodeVerified, setIsCodeVerified] = useState(false);

  const [verifiedResetToken, setVerifiedResetToken] = useState(''); 
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState(''); 

  // Validate email
  const validateEmail = () => {
    if (!email.trim()) {
      setError(t('forgotPassword.emailRequired'));
      return false;
    }
    if (!/\S+@\S+\.\S+/.test(email)) {
      setError(t('forgotPassword.emailInvalid'));
      return false;
    }
    return true;
  };

  // Handle email submission
  const handleEmailSubmit = async (e) => {
    e.preventDefault();
    if (!validateEmail()) return;
    
    try {
      // Always use requestResetCode
      await requestResetCode(email);
      setCurrentStep(2);
      toast.success(t('forgotPassword.verificationSentToast'));
    } catch (error) {
      console.error('Password reset request error:', error);
      setError(error.message || t('forgotPassword.verificationSentFailed'));
      toast.error(error.message || t('forgotPassword.verificationSentFailed'));
    }
  };

  // Validate code
  const validateCode = () => {
    if (!resetCode.trim()) {
      setError(t('forgotPassword.codeRequired'));
      return false;
    }
    if (resetCode.length !== 6 || !/^\d+$/.test(resetCode)) {
      setError(t('forgotPassword.codeInvalid'));
      return false;
    }
    return true;
  };

  // Handle code verification
  const handleCodeVerify = async (e) => {
    e.preventDefault();
    if (!validateCode()) return;
    
    try {
      const result = await verifyResetCode(email, resetCode);
      setVerifiedResetToken(result.token); // Store the token from the verification response

      setIsCodeVerified(true);
      setCurrentStep(3);
      toast.success(t('forgotPassword.codeVerifiedToast'));
    } catch (error) {
      console.error('Code verification error:', error);
      setError(error.message || t('forgotPassword.codeVerifyFailed'));
      toast.error(error.message || t('forgotPassword.codeVerifyFailed'));
    }
  };

  // Validate new password
  const validateNewPassword = () => {
    if (!newPassword) {
      setError(t('forgotPassword.newPasswordRequired'));
      return false;
    }
    if (newPassword.length < 8) {
      setError(t('forgotPassword.passwordTooShort'));
      return false;
    }
    if (newPassword !== confirmPassword) {
      setError(t('forgotPassword.passwordsDoNotMatch'));
      return false;
    }
    return true;
  };

  // Handle password reset with code
  const handleResetWithCode = async (e) => {
    e.preventDefault();
    if (!validateNewPassword()) return;
    
    try {
      await resetPassword(verifiedResetToken, newPassword); // Call the resetPassword service

      toast.success(t('forgotPassword.successMessage'));
      setCurrentStep(4);
    } catch (error) {
      console.error('Password reset error:', error);
      setError(error.message || t('forgotPassword.resetFailed'));
      toast.error(error.message || t('forgotPassword.resetFailed'));
    }
  };

  // Render the appropriate step based on the current state
  const renderContent = () => {
    switch (currentStep) {
      case 1: // Email input
        return (
          <form onSubmit={handleEmailSubmit} className="auth-form">
            <div>
              <label htmlFor="email">{t('forgotPassword.emailLabel')}</label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setError('');
                }}
                className={error ? 'input-error' : ''}
                placeholder={t('forgotPassword.emailPlaceholder')}
              />
              {error && <p className="text-error">{error}</p>}
            </div>
            
            <Button
              type="submit"
              className="auth-submit"
              disabled={isLoading}
            >
              {isLoading ? t('forgotPassword.sending') : t('forgotPassword.sendVerification')}
            </Button>
          </form>
        );
        
      case 2: // Code verification
        return (
          <form onSubmit={handleCodeVerify} className="auth-form">
            <div>
              <label htmlFor="resetCode">{t('forgotPassword.codeLabel')}</label>
              <input
                type="text"
                id="resetCode"
                value={resetCode}
                onChange={(e) => {
                  setResetCode(e.target.value);
                  setError('');
                }}
                className={error ? 'input-error' : ''}
                placeholder={t('forgotPassword.codePlaceholder')}
                maxLength={6}
              />
              {error && <p className="text-error">{error}</p>}
              <p className="text-xs text-gray-500 mt-1">
                {t('forgotPassword.codeHelper', { email })}
              </p>
            </div>
            
            <Button
              type="submit"
              className="auth-submit"
              disabled={isLoading}
            >
              {isLoading ? t('forgotPassword.verifying') : t('forgotPassword.verifyCode')}
            </Button>
            
            <div className="text-center mt-4">
              <button
                type="button"
                onClick={() => setCurrentStep(1)}
                className="text-blue-600 text-sm hover:underline"
              >
                {t('forgotPassword.backToEmail')}
              </button>
            </div>
          </form>
        );
        
      case 3: // New password
        return (
          <form onSubmit={handleResetWithCode} className="auth-form">
            <div>
              <label htmlFor="newPassword">{t('forgotPassword.newPasswordLabel')}</label>
              <input
                type="password"
                id="newPassword"
                value={newPassword}
                onChange={(e) => {
                  setNewPassword(e.target.value);
                  setError('');
                }}
                className={error ? 'input-error' : ''}
                placeholder={t('forgotPassword.passwordPlaceholder')}
              />
              <p className="text-xs text-gray-500 mt-1">
                {t('forgotPassword.passwordRequirement')}
              </p>
            </div>
            
            <div>
              <label htmlFor="confirmPassword">{t('forgotPassword.confirmPasswordLabel')}</label>
              <input
                type="password"
                id="confirmPassword"
                value={confirmPassword}
                onChange={(e) => {
                  setConfirmPassword(e.target.value);
                  setError('');
                }}
                className={error ? 'input-error' : ''}
                placeholder={t('forgotPassword.passwordPlaceholder')}
              />
              {error && <p className="text-error">{error}</p>}
            </div>
            
            <Button
              type="submit"
              className="auth-submit"
              disabled={isLoading}
            >
              {isLoading ? t('forgotPassword.resetting') : t('forgotPassword.resetButton')}
            </Button>
          </form>
        );
        
      case 4: // Success
        return (
          <div className="success-container">
            <div className="success-icon">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="success-title">{t('forgotPassword.successTitle')}</h2>
            <p className="success-message">
              {t('forgotPassword.successBody')}
            </p>
            <div className="mt-6">
              <Link to="/login">
                <Button>{t('forgotPassword.goToLogin')}</Button>
              </Link>
            </div>
          </div>
        );
        
      default:
        return null;
    }
  };

  useEffect(() => {
    document.title = t('forgotPassword.pageTitle');
  }, []);

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-header">
          <h1 className="auth-title">{t('forgotPassword.headerTitle')}</h1>
          <p className="auth-subtitle">{t('forgotPassword.headerSubtitle')}</p>
        </div>
        
        {/* Progress steps for code verification method */}
        <div className="px-6 pt-2 pb-4">
          <div className="steps-progress">
            <div className={`step ${currentStep >= 1 ? 'active' : ''} ${currentStep > 1 ? 'completed' : ''}`}>
              <div className="step-circle">1</div>
              <div className="step-label">{t('forgotPassword.stepEmail')}</div>
            </div>
            <div className={`step ${currentStep >= 2 ? 'active' : ''} ${currentStep > 2 ? 'completed' : ''}`}>
              <div className="step-circle">2</div>
              <div className="step-label">{t('forgotPassword.stepVerify')}</div>
            </div>
            <div className={`step ${currentStep >= 3 ? 'active' : ''} ${currentStep > 3 ? 'completed' : ''}`}>
              <div className="step-circle">3</div>
              <div className="step-label">{t('forgotPassword.stepReset')}</div>
            </div>
          </div>
        </div>
        
        {/* Content based on current state */}
        <div className="px-6 pb-6">
          {renderContent()}
        </div>
        
        {/* Login link */}
        <div className="auth-link">
          <p>
            {t('forgotPassword.rememberPassword')}{' '}
            <Link to="/login">{t('forgotPassword.backToLoginLink')}</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default ForgotPasswordPage;
