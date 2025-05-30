// src/pages/auth/ForgotPasswordPage.jsx

import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../components/ui/Toast';
import Button from '../../components/ui/Button';
import '../../styles/AuthPages.css';

const ForgotPasswordPage = () => {

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
      setError('Email is required');
      return false;
    }
    if (!/\S+@\S+\.\S+/.test(email)) {
      setError('Please enter a valid email address');
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
      toast.success('Verification code has been sent to your email');
    } catch (error) {
      console.error('Password reset request error:', error);
      setError(error.message || 'Failed to send reset instructions');
      toast.error(error.message || 'Failed to send reset instructions');
    }
  };

  // Validate code
  const validateCode = () => {
    if (!resetCode.trim()) {
      setError('Verification code is required');
      return false;
    }
    if (resetCode.length !== 6 || !/^\d+$/.test(resetCode)) {
      setError('Verification code must be 6 digits');
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
      toast.success('Code verified successfully');
    } catch (error) {
      console.error('Code verification error:', error);
      setError(error.message || 'Invalid verification code');
      toast.error(error.message || 'Invalid verification code');
    }
  };

  // Validate new password
  const validateNewPassword = () => {
    if (!newPassword) {
      setError('New password is required');
      return false;
    }
    if (newPassword.length < 8) {
      setError('Password must be at least 8 characters');
      return false;
    }
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
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

      toast.success('Password has been reset successfully');
      setCurrentStep(4);
    } catch (error) {
      console.error('Password reset error:', error);
      setError(error.message || 'Failed to reset password');
      toast.error(error.message || 'Failed to reset password');
    }
  };

  // Render the appropriate step based on the current state
  const renderContent = () => {
    switch (currentStep) {
      case 1: // Email input
        return (
          <form onSubmit={handleEmailSubmit} className="auth-form">
            <div>
              <label htmlFor="email">Email Address</label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setError('');
                }}
                className={error ? 'input-error' : ''}
                placeholder="you@example.com"
              />
              {error && <p className="text-error">{error}</p>}
            </div>
            
            <Button
              type="submit"
              className="auth-submit"
              disabled={isLoading}
            >
              {isLoading ? 'Sending...' : 'Send Verification Code'}
            </Button>
          </form>
        );
        
      case 2: // Code verification
        return (
          <form onSubmit={handleCodeVerify} className="auth-form">
            <div>
              <label htmlFor="resetCode">6-Digit Verification Code</label>
              <input
                type="text"
                id="resetCode"
                value={resetCode}
                onChange={(e) => {
                  setResetCode(e.target.value);
                  setError('');
                }}
                className={error ? 'input-error' : ''}
                placeholder="123456"
                maxLength={6}
              />
              {error && <p className="text-error">{error}</p>}
              <p className="text-xs text-gray-500 mt-1">
                Enter the 6-digit code sent to {email}
              </p>
            </div>
            
            <Button
              type="submit"
              className="auth-submit"
              disabled={isLoading}
            >
              {isLoading ? 'Verifying...' : 'Verify Code'}
            </Button>
            
            <div className="text-center mt-4">
              <button
                type="button"
                onClick={() => setCurrentStep(1)}
                className="text-blue-600 text-sm hover:underline"
              >
                Back to Email
              </button>
            </div>
          </form>
        );
        
      case 3: // New password
        return (
          <form onSubmit={handleResetWithCode} className="auth-form">
            <div>
              <label htmlFor="newPassword">New Password</label>
              <input
                type="password"
                id="newPassword"
                value={newPassword}
                onChange={(e) => {
                  setNewPassword(e.target.value);
                  setError('');
                }}
                className={error ? 'input-error' : ''}
                placeholder="••••••••"
              />
              <p className="text-xs text-gray-500 mt-1">
                Password must be at least 8 characters
              </p>
            </div>
            
            <div>
              <label htmlFor="confirmPassword">Confirm Password</label>
              <input
                type="password"
                id="confirmPassword"
                value={confirmPassword}
                onChange={(e) => {
                  setConfirmPassword(e.target.value);
                  setError('');
                }}
                className={error ? 'input-error' : ''}
                placeholder="••••••••"
              />
              {error && <p className="text-error">{error}</p>}
            </div>
            
            <Button
              type="submit"
              className="auth-submit"
              disabled={isLoading}
            >
              {isLoading ? 'Resetting...' : 'Reset Password'}
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
            <h2 className="success-title">Password Reset Successful</h2>
            <p className="success-message">
              Your password has been reset successfully. You can now log in with your new password.
            </p>
            <div className="mt-6">
              <Link to="/login">
                <Button>Go to Login</Button>
              </Link>
            </div>
          </div>
        );
        
      default:
        return null;
    }
  };

  useEffect(() => {
    document.title = "Forgot Password - FitHub";
  }, []);

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-header">
          <h1 className="auth-title">Reset Your Password</h1>
          <p className="auth-subtitle">We will send you a 6-digit code to verify your identity.</p>
        </div>
        
        {/* Progress steps for code verification method */}
        <div className="px-6 pt-2 pb-4">
          <div className="steps-progress">
            <div className={`step ${currentStep >= 1 ? 'active' : ''} ${currentStep > 1 ? 'completed' : ''}`}>
              <div className="step-circle">1</div>
              <div className="step-label">Email</div>
            </div>
            <div className={`step ${currentStep >= 2 ? 'active' : ''} ${currentStep > 2 ? 'completed' : ''}`}>
              <div className="step-circle">2</div>
              <div className="step-label">Verify</div>
            </div>
            <div className={`step ${currentStep >= 3 ? 'active' : ''} ${currentStep > 3 ? 'completed' : ''}`}>
              <div className="step-circle">3</div>
              <div className="step-label">Reset</div>
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
            Remember your password?{' '}
            <Link to="/login">Back to login</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default ForgotPasswordPage;
