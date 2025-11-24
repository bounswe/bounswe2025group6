import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import ResetPasswordPage from '../pages/auth/ResetPasswordPage';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../components/ui/Toast';
import { useParams, useNavigate } from 'react-router-dom';

// Mock authService
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
  useParams: jest.fn(),
  useNavigate: jest.fn(),
}));

// Mock i18n
jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key) => {
      const translations = {
        'resetPassword.newPasswordRequired': 'New password is required',
        'resetPassword.passwordMinLength': 'Password must be at least 8 characters',
        'resetPassword.passwordsDoNotMatch': 'Passwords do not match',
        'resetPassword.successMessage': 'Password reset successful',
        'resetPassword.failedToast': 'Failed to reset password',
        'resetPassword.pageTitle': 'Reset Password',
        'resetPassword.invalidLink.title': 'Invalid Reset Link',
        'resetPassword.invalidLink.subtitle': 'The reset link is invalid or has expired',
        'resetPassword.invalidLink.message': 'The password reset link is invalid or has expired. Please request a new one.',
        'resetPassword.requestNewLink': 'Request a new reset link',
        'resetPassword.title': 'Reset Your Password',
        'resetPassword.subtitle': 'Enter your new password below',
        'resetPassword.newPasswordLabel': 'New Password',
        'resetPassword.placeholderPassword': 'Enter your new password',
        'resetPassword.passwordHelp': 'Password must be at least 8 characters',
        'resetPassword.confirmPasswordLabel': 'Confirm Password',
        'resetPassword.resetting': 'Resetting password...',
        'resetPassword.resetButton': 'Reset Password',
      };
      return translations[key] || key;
    },
  }),
}));

describe('ResetPasswordPage', () => {
  const mockResetPassword = jest.fn();
  const mockNavigate = jest.fn();
  const mockToast = {
    success: jest.fn(),
    error: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    
    useAuth.mockReturnValue({
      resetPassword: mockResetPassword,
      isLoading: false,
    });

    useToast.mockReturnValue(mockToast);
    useParams.mockReturnValue({ token: 'valid-token-123' });
    useNavigate.mockReturnValue(mockNavigate);
    
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  const renderResetPasswordPage = () => {
    return render(
      <BrowserRouter>
        <ResetPasswordPage />
      </BrowserRouter>
    );
  };

  describe('Page Rendering', () => {
    test('renders reset password form when token is provided', async () => {
      renderResetPasswordPage();

      await waitFor(() => {
        expect(screen.getByRole('heading', { name: /reset your password/i })).toBeInTheDocument();
      });
      expect(screen.getByLabelText(/new password/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/confirm password/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /reset password/i })).toBeInTheDocument();
    });

    test('shows error message when token is missing', async () => {
      useParams.mockReturnValue({ token: null });

      renderResetPasswordPage();

      await waitFor(() => {
        expect(screen.getByText('Invalid Reset Link')).toBeInTheDocument();
        expect(screen.getAllByText(/invalid or has expired/i).length).toBeGreaterThan(0);
        expect(screen.getByRole('link', { name: /request a new reset link/i })).toBeInTheDocument();
      });
    });
  });

  describe('Form Validation', () => {
    test('validates required fields and shows errors', async () => {
      renderResetPasswordPage();

      const submitButton = screen.getByRole('button', { name: /reset password/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('New password is required')).toBeInTheDocument();
      });
      expect(mockResetPassword).not.toHaveBeenCalled();
    });

    test('validates password minimum length', async () => {
      renderResetPasswordPage();

      const newPasswordInput = screen.getByLabelText(/new password/i);
      fireEvent.change(newPasswordInput, { target: { value: 'short' } });

      const submitButton = screen.getByRole('button', { name: /reset password/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        const errorTexts = screen.getAllByText('Password must be at least 8 characters');
        const errorText = errorTexts.find(text => text.classList.contains('text-error'));
        expect(errorText).toBeInTheDocument();
      });
    });

    test('validates password confirmation match', async () => {
      renderResetPasswordPage();

      const newPasswordInput = screen.getByLabelText(/new password/i);
      const confirmPasswordInput = screen.getByLabelText(/confirm password/i);

      fireEvent.change(newPasswordInput, { target: { value: 'Password123' } });
      fireEvent.change(confirmPasswordInput, { target: { value: 'Different123' } });

      const submitButton = screen.getByRole('button', { name: /reset password/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('Passwords do not match')).toBeInTheDocument();
      });
    });
  });

  describe('Form Submission', () => {
    test('calls resetPassword with token and new password on success', async () => {
      renderResetPasswordPage();

      const newPasswordInput = screen.getByLabelText(/new password/i);
      const confirmPasswordInput = screen.getByLabelText(/confirm password/i);

      fireEvent.change(newPasswordInput, { target: { value: 'NewPassword123' } });
      fireEvent.change(confirmPasswordInput, { target: { value: 'NewPassword123' } });

      mockResetPassword.mockResolvedValueOnce({});

      const submitButton = screen.getByRole('button', { name: /reset password/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(mockResetPassword).toHaveBeenCalledWith('valid-token-123', 'NewPassword123');
        expect(mockToast.success).toHaveBeenCalled();
      });
    });

    test('shows success screen after successful reset', async () => {
      renderResetPasswordPage();

      const newPasswordInput = screen.getByLabelText(/new password/i);
      const confirmPasswordInput = screen.getByLabelText(/confirm password/i);

      fireEvent.change(newPasswordInput, { target: { value: 'NewPassword123' } });
      fireEvent.change(confirmPasswordInput, { target: { value: 'NewPassword123' } });

      mockResetPassword.mockResolvedValueOnce({});

      const submitButton = screen.getByRole('button', { name: /reset password/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('Password Reset Successful')).toBeInTheDocument();
        expect(screen.getByRole('link', { name: /go to login/i })).toBeInTheDocument();
      });
    });

    test('redirects to login after 3 seconds on success', async () => {
      renderResetPasswordPage();

      const newPasswordInput = screen.getByLabelText(/new password/i);
      const confirmPasswordInput = screen.getByLabelText(/confirm password/i);

      fireEvent.change(newPasswordInput, { target: { value: 'NewPassword123' } });
      fireEvent.change(confirmPasswordInput, { target: { value: 'NewPassword123' } });

      mockResetPassword.mockResolvedValueOnce({});

      const submitButton = screen.getByRole('button', { name: /reset password/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('Password Reset Successful')).toBeInTheDocument();
      });

      jest.advanceTimersByTime(3000);

      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith('/login');
      });
    });
  });

  describe('Error Handling', () => {
    test('handles reset password errors', async () => {
      renderResetPasswordPage();

      const newPasswordInput = screen.getByLabelText(/new password/i);
      const confirmPasswordInput = screen.getByLabelText(/confirm password/i);

      fireEvent.change(newPasswordInput, { target: { value: 'NewPassword123' } });
      fireEvent.change(confirmPasswordInput, { target: { value: 'NewPassword123' } });

      const error = new Error('Invalid token');
      mockResetPassword.mockRejectedValueOnce(error);

      const submitButton = screen.getByRole('button', { name: /reset password/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(mockToast.error).toHaveBeenCalledWith('Invalid token');
        expect(screen.getByText('Invalid token')).toBeInTheDocument();
      });
    });

    test('shows token-specific error when error message contains "token"', async () => {
      renderResetPasswordPage();

      const newPasswordInput = screen.getByLabelText(/new password/i);
      const confirmPasswordInput = screen.getByLabelText(/confirm password/i);

      fireEvent.change(newPasswordInput, { target: { value: 'NewPassword123' } });
      fireEvent.change(confirmPasswordInput, { target: { value: 'NewPassword123' } });

      const error = new Error('Token expired');
      mockResetPassword.mockRejectedValueOnce(error);

      const submitButton = screen.getByRole('button', { name: /reset password/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('Token expired')).toBeInTheDocument();
        expect(screen.getByText(/request a new reset link/i) || screen.getByText(/requestNewLink/i)).toBeTruthy();
      });
    });
  });

  describe('Loading State', () => {
    test('disables submit button and shows loading text when isLoading is true', async () => {
      useAuth.mockReturnValue({
        resetPassword: mockResetPassword,
        isLoading: true,
      });

      renderResetPasswordPage();

      await waitFor(() => {
        const submitButton = screen.getByRole('button', { name: /resetting password.../i });
        expect(submitButton).toBeDisabled();
      });
    });
  });
});