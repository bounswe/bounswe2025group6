import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import LoginPage from '../pages/auth/LoginPage';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../components/ui/Toast';
import { useNavigate, useLocation } from 'react-router-dom';

// Mock authService to avoid import.meta.env issues
jest.mock('../services/authService', () => ({
  loginUser: jest.fn(),
  registerUser: jest.fn(),
  logoutUser: jest.fn(),
  getCurrentUser: jest.fn(),
  isAuthenticated: jest.fn(),
  verifyEmail: jest.fn(),
  requestPasswordReset: jest.fn(),
  resetPassword: jest.fn(),
  requestPasswordResetCode: jest.fn(),
  verifyResetCode: jest.fn(),
}));

// Mock dependencies
jest.mock('../contexts/AuthContext');
jest.mock('../components/ui/Toast');
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: jest.fn(),
  useLocation: jest.fn(),
}));

// Mock i18n
jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key) => {
      const translations = {
        loginPageHeaderTitle: 'Login',
        loginPageHeaderSubTitle: 'Welcome back',
        registerPageEmail: 'Email',
        registerPagePassword: 'Password',
        loginPageForgotPassword: 'Forgot Password',
        loginPageRememberMe: 'Remember me',
        loginPageDontHaveAccount: "Don't have an account",
        homePageSignUp: 'Sign Up',
      };
      return translations[key] || key;
    },
  }),
}));

describe('LoginPage', () => {
  const mockLogin = jest.fn();
  const mockNavigate = jest.fn();
  const mockToast = {
    success: jest.fn(),
    error: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    
    useAuth.mockReturnValue({
      login: mockLogin,
      isLoading: false,
    });

    useToast.mockReturnValue(mockToast);
    useNavigate.mockReturnValue(mockNavigate);
    useLocation.mockReturnValue({
      state: null,
    });
  });

  const renderLoginPage = () => {
    return render(
      <BrowserRouter>
        <LoginPage />
      </BrowserRouter>
    );
  };

  const fillLoginForm = (email = 'test@example.com', password = 'password123') => {
    const emailInput = screen.getByLabelText(/^email$/i);
    const passwordInput = screen.getByLabelText(/^password$/i);
    
    fireEvent.change(emailInput, { target: { value: email } });
    fireEvent.change(passwordInput, { target: { value: password } });
    
    return { emailInput, passwordInput };
  };

  describe('Form Rendering', () => {
    test('renders login form with all required elements', () => {
      renderLoginPage();

      expect(screen.getByRole('heading', { name: /login/i })).toBeInTheDocument();
      expect(screen.getByLabelText(/^email$/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/^password$/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/remember me/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /log in/i })).toBeInTheDocument();
      expect(screen.getByRole('link', { name: /forgot password/i })).toBeInTheDocument();
      expect(screen.getByRole('link', { name: /sign up/i })).toBeInTheDocument();
    });
  });

  describe('Form Validation', () => {
    test('validates required fields and shows errors', async () => {
      renderLoginPage();

      const submitButton = screen.getByRole('button', { name: /log in/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('Email is required')).toBeInTheDocument();
        expect(screen.getByText('Password is required')).toBeInTheDocument();
      });
      expect(mockLogin).not.toHaveBeenCalled();
    });

    test('validates email format', async () => {
      renderLoginPage();

      const emailInput = screen.getByLabelText(/^email$/i);
      fireEvent.change(emailInput, { target: { value: 'test@example' } });

      const submitButton = screen.getByRole('button', { name: /log in/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('Please enter a valid email address')).toBeInTheDocument();
      });
    });

    test('clears error when user starts typing', async () => {
      renderLoginPage();

      const emailInput = screen.getByLabelText(/^email$/i);
      const submitButton = screen.getByRole('button', { name: /log in/i });

      fireEvent.click(submitButton);
      await waitFor(() => {
        expect(screen.getByText('Email is required')).toBeInTheDocument();
      });

      fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
      await waitFor(() => {
        expect(screen.queryByText('Email is required')).not.toBeInTheDocument();
      });
    });
  });

  describe('Form Submission', () => {
    test('calls login with correct credentials and navigates on success', async () => {
      renderLoginPage();

      fillLoginForm();

      mockLogin.mockResolvedValueOnce({});

      const submitButton = screen.getByRole('button', { name: /log in/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(mockLogin).toHaveBeenCalledWith({
          email: 'test@example.com',
          password: 'password123',
        });
        expect(mockToast.success).toHaveBeenCalledWith('Login successful!');
        expect(mockNavigate).toHaveBeenCalledWith('/dashboard');
      });
    });

    test('navigates to redirectPath from location state if available', async () => {
      useLocation.mockReturnValue({
        state: { from: { pathname: '/recipes' } },
      });

      renderLoginPage();

      fillLoginForm();

      mockLogin.mockResolvedValueOnce({});

      const submitButton = screen.getByRole('button', { name: /log in/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith('/recipes');
      });
    });
  });

  describe('Error Handling', () => {
    test('handles 429 rate limit error with custom message', async () => {
      renderLoginPage();

      fillLoginForm();

      const rateLimitError = {
        response: { status: 429 },
        message: 'Too many requests',
      };
      mockLogin.mockRejectedValueOnce(rateLimitError);

      const submitButton = screen.getByRole('button', { name: /log in/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(mockToast.error).toHaveBeenCalledWith(
          'Login failed 5 times. Please wait 5 minutes to try again.',
          expect.objectContaining({
            duration: 5000,
            style: expect.objectContaining({
              background: '#ff4b4b',
            }),
          })
        );
      });
    });

    test('handles generic login errors', async () => {
      renderLoginPage();

      fillLoginForm();

      const loginError = new Error('Invalid credentials');
      mockLogin.mockRejectedValueOnce(loginError);

      const submitButton = screen.getByRole('button', { name: /log in/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(mockToast.error).toHaveBeenCalledWith('Invalid credentials');
      });
      expect(mockNavigate).not.toHaveBeenCalled();
    });

    test('sets field-specific errors based on error message', async () => {
      renderLoginPage();

      fillLoginForm();

      const emailError = new Error('Email not found');
      mockLogin.mockRejectedValueOnce(emailError);

      const submitButton = screen.getByRole('button', { name: /log in/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('Email not found')).toBeInTheDocument();
      });
    });
  });

  describe('Remember Me Functionality', () => {
    test('toggles remember me checkbox', () => {
      renderLoginPage();

      const rememberMeCheckbox = screen.getByLabelText(/remember me/i);
      expect(rememberMeCheckbox).not.toBeChecked();

      fireEvent.click(rememberMeCheckbox);
      expect(rememberMeCheckbox).toBeChecked();
    });
  });

  describe('Loading State', () => {
    test('disables submit button and shows loading text when isLoading is true', () => {
      useAuth.mockReturnValue({
        login: mockLogin,
        isLoading: true,
      });

      renderLoginPage();

      const submitButton = screen.getByRole('button', { name: /logging in.../i });
      expect(submitButton).toBeDisabled();
      expect(screen.getByText('Logging in...')).toBeInTheDocument();
    });
  });
});