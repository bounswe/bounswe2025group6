// src/components/admin/AdminLogin.jsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '../../components/ui/Toast';
import { useAuth } from '../../contexts/AuthContext';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import reportService from '../../services/reportService';
import '../../styles/AdminLogin.css';

const AdminLogin = ({ onLoginSuccess }) => {
  const [credentials, setCredentials] = useState({
    username: '',
    password: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const toast = useToast();
  const navigate = useNavigate();
  const { setCurrentUser } = useAuth();

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setCredentials(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!credentials.username.trim()) {
      newErrors.username = 'Username is required';
    }
    
    if (!credentials.password.trim()) {
      newErrors.password = 'Password is required';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsLoading(true);
    try {
      const response = await reportService.adminLogin(
        credentials.username.trim(),
        credentials.password
      );

      // Store the admin tokens
      if (response.tokens) {
        localStorage.setItem('fithub_access_token', response.tokens.access);
        localStorage.setItem('fithub_refresh_token', response.tokens.refresh);
      }

      // Update the auth context so ProtectedRoute recognizes the user as logged in
      if (response.user && setCurrentUser) {
        setCurrentUser(response.user);
      }

      toast.success(`Welcome, ${response.user.username}!`);
      
      if (onLoginSuccess) {
        onLoginSuccess(response.user);
      } else {
        navigate('/admin-reports');
      }
    } catch (error) {
      console.error('Admin login error:', error);
      
      if (error.response?.status === 401) {
        toast.error('Invalid admin credentials');
        setErrors({
          username: 'Invalid credentials',
          password: 'Invalid credentials'
        });
      } else if (error.response?.status === 403) {
        toast.error('Access denied. Admin privileges required.');
      } else {
        toast.error('Login failed. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="admin-login-container">
      <Card className="admin-login-card">
        <Card.Body>
          <div className="admin-login-header">
            <h2>Admin Login</h2>
            <p>Enter your admin credentials to access the management panel</p>
          </div>
          
          <div className="admin-security-notice">
            This is a secure admin area. Only authorized personnel should access this page.
          </div>
          
          <form 
            onSubmit={handleSubmit} 
            className={`admin-login-form ${isLoading ? 'loading' : ''}`}
          >
            <div className="form-group">
              <label htmlFor="username">Admin Username</label>
              <input
                type="text"
                id="username"
                name="username"
                value={credentials.username}
                onChange={handleInputChange}
                placeholder="Enter admin username"
                disabled={isLoading}
                required
                autoComplete="username"
                className={errors.username ? 'error' : ''}
              />
              {errors.username && (
                <div className="admin-error-message">{errors.username}</div>
              )}
            </div>
            
            <div className="form-group">
              <label htmlFor="password">Admin Password</label>
              <input
                type="password"
                id="password"
                name="password"
                value={credentials.password}
                onChange={handleInputChange}
                placeholder="Enter admin password"
                disabled={isLoading}
                required
                autoComplete="current-password"
                className={errors.password ? 'error' : ''}
              />
              {errors.password && (
                <div className="admin-error-message">{errors.password}</div>
              )}
            </div>
            
            <Button 
              type="submit" 
              className="admin-login-button"
              disabled={isLoading}
            >
              {isLoading ? 'Authenticating...' : 'Login as Admin'}
            </Button>
          </form>
          
          <div className="admin-login-footer">
            <p>Need to create an admin account? Use Django's createsuperuser command.</p>
            <p>
              <a href="/login">Back to regular login</a>
            </p>
          </div>
        </Card.Body>
      </Card>
    </div>
  );
};

export default AdminLogin;