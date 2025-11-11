import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import RegisterPage from '../pages/auth/RegisterPage';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../components/ui/Toast';

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
jest.mock('../components/ui/Modal', () => {
  return function MockModal({ isOpen, onClose, title, children }) {
    if (!isOpen) return null;
    return (
      <div data-testid="modal">
        <div data-testid="modal-title">{title}</div>
        <button onClick={onClose}>Close Modal</button>
        {children}
      </div>
    );
  };
});
jest.mock('../components/info/TermsContent', () => {
  return function MockTermsContent() {
    return <div data-testid="terms-content">Terms Content</div>;
  };
});

// Mock i18n
jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key) => {
      const translations = {
        registerPageAuthHeader: 'Create Account',
        registerPageAuthSubtitle: 'Join FitHub today',
        registerPageAccountType: 'Account Type',
        registerPageAccountTypeUser: 'User',
        registerPageAccountTypeDietitian: 'Dietitian',
        registerPageUsername: 'Username',
        registerPageEmail: 'Email',
        registerPagePassword: 'Password',
        registerPagePasswordConfirm: 'Confirm Password',
        registerPagePasswordMessage: 'Password must be at least 8 characters',
        registerPageCertificationUrl: 'Certification URL',
        registerPageCertificationUrlMessage: 'Please provide a valid certification URL',
        registerPageWarningOne: 'Username is required',
        registerPageWarningTwo: 'Username must be at least 3 characters',
        registerPageWarningThree: 'Email is required',
        registerPageWarningFour: 'Please enter a valid email address',
        registerPageWarningFive: 'Password is required',
        registerPageWarningSix: 'Passwords do not match',
        registerPageWarningSeven: 'Certification URL is required for dietitians',
        registerPageWarningEight: 'You must accept the terms and conditions',
        registerPageSuccessTitle: 'Registration Successful',
        registerPageSuccessEmailOne: 'We sent a verification email to',
        registerPageSuccessEmailTwo: 'Please check your email to verify your account.',
        registerPageLogin: 'Go to Login',
        registerPageAlreadyAccount: 'Already have an account',
        homePageLogin: 'Login',
      };
      return translations[key] || key;
    },
  }),
}));

describe('RegisterPage', () => {
  const mockRegister = jest.fn();
  const mockToast = {
    success: jest.fn(),
    error: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    
    useAuth.mockReturnValue({
      register: mockRegister,
      isLoading: false,
    });

    useToast.mockReturnValue(mockToast);
  });

  const renderRegisterPage = () => {
    return render(
      <BrowserRouter>
        <RegisterPage />
      </BrowserRouter>
    );
  };

  const fillValidForm = (userType = 'user') => {
    const usernameInput = screen.getByLabelText(/^username$/i);
    const emailInput = screen.getByLabelText(/^email$/i);
    const passwordInput = screen.getByLabelText(/^password$/i);
    const confirmPasswordInput = screen.getByLabelText(/confirm password/i);
    const termsCheckbox = screen.getByRole('checkbox');

    fireEvent.change(usernameInput, { target: { value: 'testuser' } });
    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    fireEvent.change(passwordInput, { target: { value: 'Password123' } });
    fireEvent.change(confirmPasswordInput, { target: { value: 'Password123' } });
    fireEvent.click(termsCheckbox);

    if (userType === 'dietitian') {
      const dietitianButton = screen.getByText('Dietitian').closest('button');
      fireEvent.click(dietitianButton);
      const certificationInput = screen.getByLabelText(/certification url/i);
      fireEvent.change(certificationInput, { target: { value: 'https://example.com/cert' } });
    }

    return { usernameInput, emailInput, passwordInput, confirmPasswordInput, termsCheckbox };
  };

  describe('Form Rendering', () => {
    test('renders registration form with all required elements', () => {
      renderRegisterPage();

      expect(screen.getByRole('heading', { name: /create account/i })).toBeInTheDocument();
      expect(screen.getByLabelText(/^username$/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/^email$/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/^password$/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/confirm password/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /create account/i })).toBeInTheDocument();
    });

    test('shows certification URL field when dietitian is selected', () => {
      renderRegisterPage();

      const dietitianButton = screen.getByText('Dietitian').closest('button');
      fireEvent.click(dietitianButton);

      expect(screen.getByLabelText(/certification url/i)).toBeInTheDocument();
    });
  });

  describe('Form Validation', () => {
    test('validates required fields and shows errors', async () => {
      renderRegisterPage();

      const submitButton = screen.getByRole('button', { name: /create account/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('Username is required')).toBeInTheDocument();
        expect(screen.getByText('Email is required')).toBeInTheDocument();
        expect(screen.getByText('Password is required')).toBeInTheDocument();
      });
      expect(mockRegister).not.toHaveBeenCalled();
    });

    test('validates username minimum length', async () => {
      renderRegisterPage();

      const usernameInput = screen.getByLabelText(/^username$/i);
      fireEvent.change(usernameInput, { target: { value: 'ab' } });

      const submitButton = screen.getByRole('button', { name: /create account/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('Username must be at least 3 characters')).toBeInTheDocument();
      });
    });

    test('validates email format', async () => {
      renderRegisterPage();

      const usernameInput = screen.getByLabelText(/^username$/i);
      const emailInput = screen.getByLabelText(/^email$/i);

      fireEvent.change(usernameInput, { target: { value: 'testuser' } });
      fireEvent.change(emailInput, { target: { value: 'test@example' } });

      const submitButton = screen.getByRole('button', { name: /create account/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('Please enter a valid email address')).toBeInTheDocument();
      });
    });

    test('validates password requirements (length, uppercase, lowercase, number)', async () => {
      renderRegisterPage();

      const usernameInput = screen.getByLabelText(/^username$/i);
      const emailInput = screen.getByLabelText(/^email$/i);
      const passwordInput = screen.getByLabelText(/^password$/i);

      fireEvent.change(usernameInput, { target: { value: 'testuser' } });
      fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
      fireEvent.change(passwordInput, { target: { value: 'short' } });

      const submitButton = screen.getByRole('button', { name: /create account/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        const errorText = screen.getByText(/Password must contain at least/i);
        expect(errorText).toBeInTheDocument();
        expect(errorText).toHaveClass('text-error');
      });
    });

    test('validates password confirmation match', async () => {
      renderRegisterPage();

      const usernameInput = screen.getByLabelText(/^username$/i);
      const emailInput = screen.getByLabelText(/^email$/i);
      const passwordInput = screen.getByLabelText(/^password$/i);
      const confirmPasswordInput = screen.getByLabelText(/confirm password/i);

      fireEvent.change(usernameInput, { target: { value: 'testuser' } });
      fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
      fireEvent.change(passwordInput, { target: { value: 'Password123' } });
      fireEvent.change(confirmPasswordInput, { target: { value: 'Different123' } });

      const submitButton = screen.getByRole('button', { name: /create account/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('Passwords do not match')).toBeInTheDocument();
      });
    });

    test('validates certification URL is required for dietitian', async () => {
      renderRegisterPage();

      const dietitianButton = screen.getByText('Dietitian').closest('button');
      fireEvent.click(dietitianButton);

      fillValidForm('dietitian');
      const certificationInput = screen.getByLabelText(/certification url/i);
      fireEvent.change(certificationInput, { target: { value: '' } });

      const submitButton = screen.getByRole('button', { name: /create account/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('Certification URL is required for dietitians')).toBeInTheDocument();
      });
    });

    test('validates terms acceptance', async () => {
      renderRegisterPage();

      fillValidForm();
      const termsCheckbox = screen.getByRole('checkbox');
      fireEvent.click(termsCheckbox); // Uncheck it

      const submitButton = screen.getByRole('button', { name: /create account/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('You must accept the terms and conditions')).toBeInTheDocument();
      });
    });
  });

  describe('Form Submission', () => {
    test('calls register with correct data on successful validation', async () => {
      renderRegisterPage();

      fillValidForm();

      mockRegister.mockResolvedValueOnce({});

      const submitButton = screen.getByRole('button', { name: /create account/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(mockRegister).toHaveBeenCalledWith({
          username: 'testuser',
          email: 'test@example.com',
          password: 'Password123',
          confirmPassword: 'Password123',
          userType: 'user',
          certificationUrl: '',
          acceptTerms: true,
        });
      });
    });

    test('includes certification URL when dietitian is selected', async () => {
      renderRegisterPage();

      fillValidForm('dietitian');

      mockRegister.mockResolvedValueOnce({});

      const submitButton = screen.getByRole('button', { name: /create account/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(mockRegister).toHaveBeenCalledWith(
          expect.objectContaining({
            userType: 'dietitian',
            certificationUrl: 'https://example.com/cert',
          })
        );
      });
    });

    test('shows success screen after successful registration', async () => {
      renderRegisterPage();

      fillValidForm();

      mockRegister.mockResolvedValueOnce({});

      const submitButton = screen.getByRole('button', { name: /create account/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('Registration Successful')).toBeInTheDocument();
        expect(screen.getByText('test@example.com')).toBeInTheDocument();
        expect(screen.getByRole('link', { name: /go to login/i })).toBeInTheDocument();
      });
      expect(mockToast.success).toHaveBeenCalled();
    });
  });

  describe('Error Handling', () => {
    test('handles registration errors and shows error message', async () => {
      renderRegisterPage();

      fillValidForm();

      const error = new Error('Registration failed');
      mockRegister.mockRejectedValueOnce(error);

      const submitButton = screen.getByRole('button', { name: /create account/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(mockToast.error).toHaveBeenCalledWith('Registration failed');
      });
    });

    test('sets field-specific errors based on error message', async () => {
      renderRegisterPage();

      fillValidForm();

      const emailError = new Error('Email already exists');
      mockRegister.mockRejectedValueOnce(emailError);

      const submitButton = screen.getByRole('button', { name: /create account/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('Email already exists')).toBeInTheDocument();
      });
    });
  });

  describe('Terms Modal', () => {
    test('opens and closes terms modal', () => {
      renderRegisterPage();

      const termsLink = screen.getByText('Fithub Terms and Conditions');
      fireEvent.click(termsLink);

      expect(screen.getByTestId('modal')).toBeInTheDocument();

      const closeButton = screen.getByText('Close Modal');
      fireEvent.click(closeButton);

      expect(screen.queryByTestId('modal')).not.toBeInTheDocument();
    });

    test('accepts terms from modal and auto-checks checkbox', () => {
      renderRegisterPage();

      const termsLink = screen.getByText('Fithub Terms and Conditions');
      fireEvent.click(termsLink);

      const acceptButton = screen.getByText('Accept Terms');
      fireEvent.click(acceptButton);

      expect(screen.queryByTestId('modal')).not.toBeInTheDocument();
      expect(screen.getByRole('checkbox')).toBeChecked();
    });
  });

  describe('Loading State', () => {
    test('disables submit button and shows loading text when isLoading is true', () => {
      useAuth.mockReturnValue({
        register: mockRegister,
        isLoading: true,
      });

      renderRegisterPage();

      const submitButton = screen.getByRole('button', { name: /registering.../i });
      expect(submitButton).toBeDisabled();
      expect(screen.getByText('Registering...')).toBeInTheDocument();
    });
  });
});