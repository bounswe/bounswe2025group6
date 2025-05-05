// src/pages/auth/ForgotPasswordPage.jsx

import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { requestPasswordReset } from '../../services/authService';
import { useToast } from '../../components/ui/Toast';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import '../../styles/AuthPages.css';

const ForgotPasswordPage = () => {
  const toast = useToast();
  
  // Form state
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [error, setError] = useState('');
  
  // Handle input change
  const handleChange = (e) => {
    setEmail(e.target.value);
    setError('');
  };
  
  // Form validation
  const validateForm = () => {
    if (!email.trim()) {
      setError('Email is required');
      return false;
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      setError('Please enter a valid email address');
      return false;
    }
    return true;
  };
  
  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      await requestPasswordReset(email);
      setIsSubmitted(true);
      toast.success('Password reset instructions sent to your email');
    } catch (error) {
      console.error('Password reset request error:', error);
      setError(error.message || 'Failed to request password reset');
      toast.error(error.message || 'Failed to request password reset');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-r from-green-300 to-blue-400 px-4 py-12">
      <Card className="w-full max-w-md">
        <Card.Header className="text-center pb-6">
          <h1 className="text-2xl font-bold">Forgot Your Password?</h1>
          <p className="text-gray-600 mt-1">
            {!isSubmitted
              ? "Don't worry, we'll send you instructions to reset it"
              : "We've sent you an email with instructions"}
          </p>
        </Card.Header>
        
        <Card.Body>
          {!isSubmitted ? (
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Email Input */}
              <div>
                <label htmlFor="email" className="block text-sm font-medium mb-1">
                  Email Address
                </label>
                <input
                  type="email"
                  id="email"
                  value={email}
                  onChange={handleChange}
                  className={`w-full px-3 py-2 border rounded-md ${
                    error ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="you@example.com"
                />
                {error && (
                  <p className="mt-1 text-sm text-red-500">{error}</p>
                )}
              </div>
              
              {/* Submit Button */}
              <Button
                type="submit"
                className="w-full"
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Sending...' : 'Reset Password'}
              </Button>
            </form>
          ) : (
            <div className="text-center py-4">
              <div className="mb-4 text-green-600">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-16 w-16 mx-auto"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 19v-8.93a2 2 0 01.89-1.664l7-4.666a2 2 0 012.22 0l7 4.666A2 2 0 0121 10.07V19M3 19a2 2 0 002 2h14a2 2 0 002-2M3 19l6.75-4.5M21 19l-6.75-4.5M3 10l6.75 4.5M21 10l-6.75 4.5m0 0l-1.14.76a2 2 0 01-2.22 0l-1.14-.76"
                  />
                </svg>
              </div>
              <p className="mb-4">
                We've sent password reset instructions to <strong>{email}</strong>
              </p>
              <p className="text-sm text-gray-600">
                Please check your email and follow the instructions to reset your password.
                If you don't see the email, check your spam folder.
              </p>
              <div className="mt-6">
                <Button
                  onClick={() => {
                    setEmail('');
                    setIsSubmitted(false);
                  }}
                  variant="secondary"
                >
                  Try Again
                </Button>
              </div>
            </div>
          )}
          
          {/* Login Link */}
          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              Remember your password?{' '}
              <Link
                to="/login"
                className="text-blue-600 hover:text-blue-800 font-medium"
              >
                Back to login
              </Link>
            </p>
          </div>
        </Card.Body>
      </Card>
    </div>
  );
};

export default ForgotPasswordPage;