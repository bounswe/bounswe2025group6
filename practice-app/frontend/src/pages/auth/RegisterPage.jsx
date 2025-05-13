// src/pages/auth/RegisterPage.jsx

import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../components/ui/Toast';
import Button from '../../components/ui/Button';
import '../../styles/AuthPages.css';

const RegisterPage = () => {
  const { register, isLoading } = useAuth();
  const toast = useToast();

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
    if (!formData.username.trim()) newErrors.username = 'Username is required';
    else if (formData.username.length < 3) newErrors.username = 'Username must be at least 3 characters';
    
    if (!formData.email.trim()) newErrors.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(formData.email)) newErrors.email = 'Please enter a valid email address';
    
    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else {
      const passwordValidation = validatePassword(formData.password);
      if (!passwordValidation.isValid) {
        newErrors.password = `Password must contain at least ${passwordValidation.requirements.join(', ')}`;
      }
    }
    
    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }
    
    if (formData.userType === 'dietitian' && !formData.certificationUrl) {
      newErrors.certificationUrl = 'Certification URL is required for dietitians';
    }
    
    if (!formData.acceptTerms) {
      newErrors.acceptTerms = 'You must accept the terms and conditions';
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
            <h2 className="success-title">Registration Successful!</h2>
            <p className="success-message">
              We've sent a verification email to <span className="success-email">{formData.email}</span>.
              Please check your email and click the verification link to activate your account.
            </p>
            <Link to="/login">
              <Button variant="primary">Go to Login</Button>
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
          <h1 className="auth-title">Create Your Account</h1>
          <p className="auth-subtitle">Join the FitHub community</p>
        </div>
        <form onSubmit={handleSubmit} className="auth-form">
          <div>
            <label className="block text-sm font-medium mb-2">Account Type</label>
            <div className="account-type-buttons">
              <button
                type="button"
                onClick={() => handleUserTypeSelect('user')}
                className={`account-type-button ${formData.userType === 'user' ? 'active' : ''}`}
              >
                Regular User
              </button>
              <button
                type="button"
                onClick={() => handleUserTypeSelect('dietitian')}
                className={`account-type-button ${formData.userType === 'dietitian' ? 'active' : ''}`}
              >
                Dietitian
              </button>
            </div>
            <p className="account-type-info">
              {formData.userType === 'dietitian'
                ? 'As a dietitian, you can create meal plans, analyze recipes, and provide nutritional advice.'
                : 'Personal accounts let you create meal plans, save recipes, and manage your diet.'}
            </p>
          </div>

          <div>
            <label htmlFor="username">Username</label>
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
            <label htmlFor="email">Email Address</label>
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
            <label htmlFor="password">Password</label>
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
              Password must contain at least 8 characters, including one uppercase letter, 
              one lowercase letter, and one number
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

          {formData.userType === 'dietitian' && (
            <div>
              <label htmlFor="certificationUrl">Certification URL</label>
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
              <p className="text-xs text-gray-500">URL to your professional certification document</p>
            </div>
          )}

          <div className="checkbox-container">
            <input
              type="checkbox"
              id="acceptTerms"
              name="acceptTerms"
              checked={formData.acceptTerms}
              onChange={handleChange}
            />
            <label htmlFor="acceptTerms">
              I accept the{' '}
              <Link to="/terms" className="text-blue-600 hover:text-blue-800">Terms and Conditions</Link>
            </label>
          </div>
          {errors.acceptTerms && <p className="text-error">{errors.acceptTerms}</p>}

          <Button type="submit" className="auth-submit" disabled={isLoading}>
            {isLoading ? 'Registering...' : 'Create Account'}
          </Button>
        </form>

        <div className="auth-link">
          <p>
            Already have an account?{' '}
            <Link to="/login">Log in</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;