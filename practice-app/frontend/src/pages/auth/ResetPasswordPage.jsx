// src/pages/auth/ResetPasswordPage.jsx

import React, { useEffect, useState } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../components/ui/Toast';
import Button from '../../components/ui/Button';
import '../../styles/AuthPages.css';

const ResetPasswordPage = () => {
  const { token } = useParams();
  const navigate = useNavigate();
  const { resetPassword, isLoading } = useAuth();
  const toast = useToast();
  
  const [formData, setFormData] = useState({
    newPassword: '',
    confirmPassword: ''
  });
  
  const [errors, setErrors] = useState({});
  const [isSuccess, setIsSuccess] = useState(false);
  
  // Handle input change
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };
  
  // Validate form
  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.newPassword) {
      newErrors.newPassword = 'New password is required';
    } else if (formData.newPassword.length < 8) {
      newErrors.newPassword = 'Password must be at least 8 characters';
    }
    
    if (formData.newPassword !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    try {
      await resetPassword(token, formData.newPassword);
      setIsSuccess(true);
      toast.success('Password has been reset successfully');
      
      // Redirect to login after a delay
      setTimeout(() => {
        navigate('/login');
      }, 3000);
    } catch (error) {
      console.error('Password reset error:', error);
      toast.error(error.message || 'Failed to reset password');
      
      // Check if token error
      if (error.message.toLowerCase().includes('token')) {
        setErrors(prev => ({
          ...prev,
          token: error.message
        }));
      } else {
        setErrors(prev => ({
          ...prev,
          newPassword: error.message
        }));
      }
    }
  };
  useEffect(() => {
      document.title = "Reset Password - FitHub";
    }, []);
  // Display error if no token
  if (!token) {
    return (
      <div className="auth-container">
        <div className="auth-card">
          <div className="auth-header">
            <h1 className="auth-title">Invalid Reset Link</h1>
            <p className="auth-subtitle">The password reset link is invalid or has expired</p>
          </div>
          <div className="px-6 py-6 text-center">
            <p className="mb-4">
              The password reset link you followed is missing a required token.
            </p>
            <Link to="/forgot-password">
              <Button>Request a new reset link</Button>
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
          <h1 className="auth-title">Reset Your Password</h1>
          <p className="auth-subtitle">Enter your new password below</p>
        </div>
        
        {isSuccess ? (
          <div className="success-container">
            <div className="success-icon">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="success-title">Password Reset Successful</h2>
            <p className="success-message">
              Your password has been reset successfully. You will be redirected to the login page in a few seconds.
            </p>
            <div className="mt-6">
              <Link to="/login">
                <Button>Go to Login</Button>
              </Link>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="auth-form">
            {errors.token && (
              <div className="p-3 bg-red-100 border border-red-300 rounded-md mb-4">
                <p className="text-sm text-red-700">{errors.token}</p>
                <p className="text-sm text-red-700 mt-2">
                  Please request a new password reset link.
                </p>
              </div>
            )}
            
            <div>
              <label htmlFor="newPassword">New Password</label>
              <input
                type="password"
                id="newPassword"
                name="newPassword"
                value={formData.newPassword}
                onChange={handleChange}
                className={errors.newPassword ? 'input-error' : ''}
                placeholder="••••••••"
              />
              {errors.newPassword && <p className="text-error">{errors.newPassword}</p>}
              <p className="text-xs text-gray-500 mt-1">
                Password must be at least 8 characters
              </p>
            </div>
            
            <div>
              <label htmlFor="confirmPassword">Confirm Password</label>
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
            
            <Button
              type="submit"
              className="auth-submit"
              disabled={isLoading}
            >
              {isLoading ? 'Resetting Password...' : 'Reset Password'}
            </Button>
          </form>
        )}
        
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

export default ResetPasswordPage;