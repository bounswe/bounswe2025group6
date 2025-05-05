// src/pages/auth/RegisterPage.jsx

import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../components/ui/Toast';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import '../../styles/AuthPages.css';

const RegisterPage = () => {
  const navigate = useNavigate();
  const { register, isLoading } = useAuth();
  const toast = useToast();

  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    userType: 'personal',
    acceptTerms: false
  });

  const [errors, setErrors] = useState({});

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

  const validateForm = () => {
    const newErrors = {};
    if (!formData.username.trim()) newErrors.username = 'Username is required';
    else if (formData.username.length < 3) newErrors.username = 'Username must be at least 3 characters';
    if (!formData.email.trim()) newErrors.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(formData.email)) newErrors.email = 'Please enter a valid email address';
    if (!formData.password) newErrors.password = 'Password is required';
    else if (formData.password.length < 6) newErrors.password = 'Password must be at least 6 characters';
    if (formData.password !== formData.confirmPassword) newErrors.confirmPassword = 'Passwords do not match';
    if (!formData.acceptTerms) newErrors.acceptTerms = 'You must accept the terms and conditions';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;
    try {
      const { confirmPassword, ...dataToSubmit } = formData;
      await register(dataToSubmit);
      toast.success('Registration successful!');
      navigate('/dashboard');
    } catch (error) {
      console.error('Registration error:', error);
      toast.error(error.message || 'Failed to register');
      if (error.message.toLowerCase().includes('email')) {
        setErrors(prev => ({ ...prev, email: error.message }));
      }
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-header">
          <h1 className="auth-title">Create Your Account</h1>
          <p className="auth-subtitle">Join the Meal Planner community</p>
        </div>
        <form onSubmit={handleSubmit} className="auth-form">
          <div>
            <label className="block text-sm font-medium mb-2">Account Type</label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => handleUserTypeSelect('personal')}
                className={`py-2 text-center rounded-md ${
                  formData.userType === 'personal' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Personal
              </button>
              <button
                type="button"
                onClick={() => handleUserTypeSelect('dietitian')}
                className={`py-2 text-center rounded-md ${
                  formData.userType === 'dietitian' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Dietitian
              </button>
            </div>
            <p className="mt-1 text-xs text-gray-500">
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
              className={`w-full px-3 py-2 border rounded-md ${errors.username ? 'border-red-500' : 'border-gray-300'}`}
              placeholder="johndoe"
            />
            {errors.username && <p className="text-sm text-red-500">{errors.username}</p>}
          </div>

          <div>
            <label htmlFor="email">Email Address</label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              className={`w-full px-3 py-2 border rounded-md ${errors.email ? 'border-red-500' : 'border-gray-300'}`}
              placeholder="you@example.com"
            />
            {errors.email && <p className="text-sm text-red-500">{errors.email}</p>}
          </div>

          <div>
            <label htmlFor="password">Password</label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              className={`w-full px-3 py-2 border rounded-md ${errors.password ? 'border-red-500' : 'border-gray-300'}`}
              placeholder="••••••••"
            />
            {errors.password && <p className="text-sm text-red-500">{errors.password}</p>}
            <p className="text-xs text-gray-500">Must be at least 6 characters</p>
          </div>

          <div>
            <label htmlFor="confirmPassword">Confirm Password</label>
            <input
              type="password"
              id="confirmPassword"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              className={`w-full px-3 py-2 border rounded-md ${errors.confirmPassword ? 'border-red-500' : 'border-gray-300'}`}
              placeholder="••••••••"
            />
            {errors.confirmPassword && <p className="text-sm text-red-500">{errors.confirmPassword}</p>}
          </div>

          <div className="flex items-start">
            <input
              type="checkbox"
              id="acceptTerms"
              name="acceptTerms"
              checked={formData.acceptTerms}
              onChange={handleChange}
              className="h-4 w-4 text-blue-600 border-gray-300 rounded"
            />
            <label htmlFor="acceptTerms" className="ml-2 text-sm text-gray-700">
              I accept the{' '}
              <Link to="/terms" className="text-blue-600 hover:text-blue-800">Terms and Conditions</Link>
            </label>
          </div>
          {errors.acceptTerms && <p className="text-sm text-red-500">{errors.acceptTerms}</p>}

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
