// src/pages/RegisterPage.jsx

import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import '../styles/AuthPages.css';

const RegisterPage = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    userType: 'personal',
    acceptTerms: false,
  });

  const [errors, setErrors] = useState({});

  const handleChange = (e) => {
    const { name, type, value, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const validate = () => {
    const newErrors = {};
    if (!formData.username.trim()) newErrors.username = 'Username is required.';
    if (!formData.email.includes('@')) newErrors.email = 'Invalid email.';
    if (formData.password.length < 6) newErrors.password = 'Password must be at least 6 characters.';
    if (!formData.acceptTerms) newErrors.acceptTerms = 'You must accept the terms.';
    return newErrors;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const validationErrors = validate();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
    } else {
      setErrors({});
      console.log('Register Success (Mock)', formData);
      navigate('/dashboard');
    }
  };

  return (
    <div className="auth-page">
      <form onSubmit={handleSubmit} className="auth-card">
        <h2 className="auth-title">Create Account</h2>

        {/* User Type Toggle */}
        <div className="user-type-toggle">
          <button
            type="button"
            className={formData.userType === 'personal' ? 'active' : ''}
            onClick={() => setFormData({ ...formData, userType: 'personal' })}
          >
            Personal
          </button>
          <button
            type="button"
            className={formData.userType === 'dietitian' ? 'active' : ''}
            onClick={() => setFormData({ ...formData, userType: 'dietitian' })}
          >
            Dietitian
          </button>
        </div>

        <input
          type="text"
          name="username"
          placeholder="Username"
          value={formData.username}
          onChange={handleChange}
          className="auth-input"
        />
        {errors.username && <p className="auth-error">{errors.username}</p>}

        <input
          type="email"
          name="email"
          placeholder="Email Address"
          value={formData.email}
          onChange={handleChange}
          className="auth-input"
        />
        {errors.email && <p className="auth-error">{errors.email}</p>}

        <input
          type="password"
          name="password"
          placeholder="Password"
          value={formData.password}
          onChange={handleChange}
          className="auth-input"
        />
        {errors.password && <p className="auth-error">{errors.password}</p>}

        <div className="flex items-center gap-2 my-2">
          <input
            type="checkbox"
            name="acceptTerms"
            checked={formData.acceptTerms}
            onChange={handleChange}
          />
          <label className="text-sm">I accept the Terms and Conditions</label>
        </div>
        {errors.acceptTerms && <p className="auth-error">{errors.acceptTerms}</p>}

        <button type="submit" className="auth-button green">
          Register
        </button>

        <p className="auth-footer">
          Already have an account?{' '}
          <Link to="/login" className="auth-link">
            Login
          </Link>
        </p>
      </form>
    </div>
  );
};

export default RegisterPage;