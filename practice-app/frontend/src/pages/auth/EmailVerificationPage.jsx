// src/pages/auth/EmailVerificationPage.jsx

import React, { useState, useEffect } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../components/ui/Toast';
import Button from '../../components/ui/Button';
import '../../styles/AuthPages.css';
import { useTranslation } from "react-i18next";

const EmailVerificationPage = () => {
  const { t } = useTranslation();
  const { token } = useParams();
  const navigate = useNavigate();
  const { verifyEmail, isLoading } = useAuth();
  const toast = useToast();
  
  const [verificationStatus, setVerificationStatus] = useState('verifying'); // 'verifying', 'success', 'error'
  const [error, setError] = useState('');
  
  useEffect(() => {
    const verifyEmailToken = async () => {
      if (!token) {
        setVerificationStatus('error');
        setError('Invalid verification link. No token provided.');
        return;
      }
      
      try {
        await verifyEmail(token);
        setVerificationStatus('success');
        toast.success('Email verified successfully');
        // Automatically redirect to login page after 2 seconds
        setTimeout(() => {
          navigate('/login');
        }, 2000);
      } catch (error) {
        console.error('Email verification error:', error);
        setVerificationStatus('error');
        setError(error.message || 'Failed to verify email. The link may be expired or invalid.');
        toast.error(error.message || 'Failed to verify email');
      }
    };
    
    verifyEmailToken();
  }, [token, verifyEmail, toast, navigate]);
  useEffect(() => {
      document.title = "Email Verification - FitHub";
    }, []);
  // Render based on verification status
  const renderContent = () => {
    switch (verificationStatus) {
      case 'verifying':
        return (
          <div className="verification-status">
            <div className="verification-spinner">
              <svg className="animate-spin h-10 w-10 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            </div>
            <h2 className="verification-title">Verifying Your Email</h2>
            <p className="verification-message">
              Please wait while we verify your email address...
            </p>
          </div>
        );
        
      case 'success':
        return (
          <div className="success-container">
            <div className="success-icon">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="success-title">Email Verified Successfully!</h2>
            <p className="success-message">
              Your email has been verified successfully. You can now log in to your account.
            </p>
            <div className="mt-6">
              <Link to="/login">
                <Button>Go to Login</Button>
              </Link>
            </div>
          </div>
        );
        
      case 'error':
        return (
          <div className="verification-status">
            <div className="text-red-500 mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h2 className="verification-title">Verification Failed</h2>
            <p className="verification-message">
              {error}
            </p>
            <div className="mt-6">
              <Link to="/login">
                <Button variant="secondary" className="mr-2">Go to Login</Button>
              </Link>
              <Link to="/register">
                <Button>Register Again</Button>
              </Link>
            </div>
          </div>
        );
        
      default:
        return null;
    }
  };
  
  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-header">
          <h1 className="auth-title">Email Verification</h1>
          <p className="auth-subtitle">Verifying your email address</p>
        </div>
        
        <div className="px-6 pb-6">
          {renderContent()}
        </div>
      </div>
    </div>
  );
};

export default EmailVerificationPage;