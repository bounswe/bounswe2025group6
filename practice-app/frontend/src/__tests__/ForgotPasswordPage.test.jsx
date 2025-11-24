import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import ForgotPasswordPage from '../pages/auth/ForgotPasswordPage';
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

// Mock i18n
jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key, options) => {
      const translations = {
        'forgotPassword.emailRequired': 'Email is required',
        'forgotPassword.emailInvalid': 'Please enter a valid email address',
        'forgotPassword.verificationSentToast': 'Verification code sent successfully',
        'forgotPassword.verificationSentFailed': 'Failed to send verification code',
        'forgotPassword.emailLabel': 'Email Address',
        'forgotPassword.emailPlaceholder': 'Enter your email address',
        'forgotPassword.sending': 'Sending...',
        'forgotPassword.sendVerification': 'Send Verification Code',
        'forgotPassword.codeRequired': 'Verification code is required',
        'forgotPassword.codeInvalid': 'Verification code must be 6 digits',
        'forgotPassword.codeVerifiedToast': 'Code verified successfully',
        'forgotPassword.codeVerifyFailed': 'Failed to verify code',
        'forgotPassword.codeLabel': '6-Digit Verification Code',
        'forgotPassword.codePlaceholder': 'Enter 6-digit code',
        'forgotPassword.codeHelper': `We sent a verification code to ${options?.email || 'your email'}`,
        'forgotPassword.verifying': 'Verifying...',
        'forgotPassword.verifyCode': 'Verify Code',
        'forgotPassword.backToEmail': 'Back to Email',
        'forgotPassword.newPasswordRequired': 'New password is required',
        'forgotPassword.passwordTooShort': 'Password must be at least 8 characters',
        'forgotPassword.passwordsDoNotMatch': 'Passwords do not match',
        'forgotPassword.newPasswordLabel': 'New Password',
        'forgotPassword.passwordPlaceholder': 'Enter your new password',
        'forgotPassword.passwordRequirement': 'Password must be at least 8 characters',
        'forgotPassword.confirmPasswordLabel': 'Confirm Password',
        'forgotPassword.resetting': 'Resetting...',
        'forgotPassword.resetButton': 'Reset Password',
        'forgotPassword.successTitle': 'Password Reset Successful',
        'forgotPassword.successBody': 'Your password has been reset successfully. You can now log in with your new password.',
        'forgotPassword.goToLogin': 'Go to Login',
        'forgotPassword.pageTitle': 'Forgot Password',
        'forgotPassword.headerTitle': 'Reset Your Password',
        'forgotPassword.headerSubtitle': 'Enter your email to receive a verification code',
        'forgotPassword.stepEmail': 'Email',
        'forgotPassword.stepVerify': 'Verify',
        'forgotPassword.stepReset': 'Reset',
        'forgotPassword.rememberPassword': 'Remember your password?',
        'forgotPassword.backToLoginLink': 'Back to login',
        'forgotPassword.successMessage': 'Password reset successful',
        'forgotPassword.resetFailed': 'Failed to reset password',
      };
      return translations[key] || key;
    },
  }),
}));

describe('ForgotPasswordPage', () => {
  const mockRequestResetCode = jest.fn();
  const mockVerifyResetCode = jest.fn();
  const mockResetPassword = jest.fn();
  const mockToast = {
    success: jest.fn(),
    error: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    
    useAuth.mockReturnValue({
      requestResetCode: mockRequestResetCode,
      verifyResetCode: mockVerifyResetCode,
      resetPassword: mockResetPassword,
      isLoading: false,
    });

    useToast.mockReturnValue(mockToast);
  });

  const renderForgotPasswordPage = () => {
    return render(
      <BrowserRouter>
        <ForgotPasswordPage />
      </BrowserRouter>
    );
  };

  describe('Step 1: Email Input', () => {
    test('renders email input form', async () => {
      renderForgotPasswordPage();

      await waitFor(() => {
        expect(screen.getByRole('heading', { name: /reset your password/i })).toBeInTheDocument();
      });
      expect(screen.getByLabelText(/email address/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /send verification code/i })).toBeInTheDocument();
    });

    test('validates email and shows error when empty', async () => {
      renderForgotPasswordPage();

      const submitButton = screen.getByRole('button', { name: /send verification code/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('Email is required')).toBeInTheDocument();
      });
      expect(mockRequestResetCode).not.toHaveBeenCalled();
    });

    test('validates email format', async () => {
      renderForgotPasswordPage();

      const emailInput = screen.getByLabelText(/email address/i);
      // Use email format that passes HTML5 but fails our regex
      fireEvent.change(emailInput, { target: { value: 'test@example' } });

      const submitButton = screen.getByRole('button', { name: /send verification code/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('Please enter a valid email address')).toBeInTheDocument();
      });
    });

    test('sends reset code and moves to step 2 on success', async () => {
      renderForgotPasswordPage();

      const emailInput = screen.getByLabelText(/email address/i);
      fireEvent.change(emailInput, { target: { value: 'test@example.com' } });

      mockRequestResetCode.mockResolvedValueOnce({});

      const submitButton = screen.getByRole('button', { name: /send verification code/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(mockRequestResetCode).toHaveBeenCalledWith('test@example.com');
        expect(mockToast.success).toHaveBeenCalled();
        expect(screen.getByLabelText(/6-digit verification code/i)).toBeInTheDocument();
      });
    });

    test('handles error when sending reset code fails', async () => {
      renderForgotPasswordPage();

      const emailInput = screen.getByLabelText(/email address/i);
      fireEvent.change(emailInput, { target: { value: 'test@example.com' } });

      const error = new Error('Email not found');
      mockRequestResetCode.mockRejectedValueOnce(error);

      const submitButton = screen.getByRole('button', { name: /send verification code/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(mockToast.error).toHaveBeenCalledWith('Email not found');
      });
    });
  });

  describe('Step 2: Code Verification', () => {
    const advanceToStep2 = async () => {
      const emailInput = screen.getByLabelText(/email address/i);
      fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
      mockRequestResetCode.mockResolvedValueOnce({});
      const submitButton = screen.getByRole('button', { name: /send verification code/i });
      fireEvent.click(submitButton);
      await waitFor(() => {
        expect(screen.getByLabelText(/6-digit verification code/i)).toBeInTheDocument();
      });
    };

    test('validates code and shows error when empty', async () => {
      renderForgotPasswordPage();
      await advanceToStep2();

      const verifyButton = screen.getByRole('button', { name: /verify code/i });
      fireEvent.click(verifyButton);

      await waitFor(() => {
        expect(screen.getByText('Verification code is required')).toBeInTheDocument();
      });
      expect(mockVerifyResetCode).not.toHaveBeenCalled();
    });

    test('validates code format (must be 6 digits)', async () => {
      renderForgotPasswordPage();
      await advanceToStep2();

      const codeInput = screen.getByLabelText(/6-digit verification code/i);
      fireEvent.change(codeInput, { target: { value: '12345' } });

      const verifyButton = screen.getByRole('button', { name: /verify code/i });
      fireEvent.click(verifyButton);

      await waitFor(() => {
        expect(screen.getByText('Verification code must be 6 digits')).toBeInTheDocument();
      });
    });

    test('verifies code and moves to step 3 on success', async () => {
      renderForgotPasswordPage();
      await advanceToStep2();

      const codeInput = screen.getByLabelText(/6-digit verification code/i);
      fireEvent.change(codeInput, { target: { value: '123456' } });

      mockVerifyResetCode.mockResolvedValueOnce({ token: 'reset-token-123' });

      const verifyButton = screen.getByRole('button', { name: /verify code/i });
      fireEvent.click(verifyButton);

      await waitFor(() => {
        expect(mockVerifyResetCode).toHaveBeenCalledWith('test@example.com', '123456');
        expect(mockToast.success).toHaveBeenCalled();
        expect(screen.getByLabelText(/new password/i)).toBeInTheDocument();
      });
    });

    test('allows going back to email step', async () => {
      renderForgotPasswordPage();
      await advanceToStep2();

      const backButton = screen.getByText('Back to Email');
      fireEvent.click(backButton);

      expect(screen.getByLabelText(/email address/i)).toBeInTheDocument();
      expect(screen.queryByLabelText(/6-digit verification code/i)).not.toBeInTheDocument();
    });
  });

  describe('Step 3: New Password', () => {
    const advanceToStep3 = async () => {
      // Step 1: Email
      const emailInput = screen.getByLabelText(/email address/i);
      fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
      mockRequestResetCode.mockResolvedValueOnce({});
      fireEvent.click(screen.getByRole('button', { name: /send verification code/i }));
      await waitFor(() => {
        expect(screen.getByLabelText(/6-digit verification code/i)).toBeInTheDocument();
      });

      // Step 2: Code
      const codeInput = screen.getByLabelText(/6-digit verification code/i);
      fireEvent.change(codeInput, { target: { value: '123456' } });
      mockVerifyResetCode.mockResolvedValueOnce({ token: 'reset-token-123' });
      fireEvent.click(screen.getByRole('button', { name: /verify code/i }));
      await waitFor(() => {
        expect(screen.getByLabelText(/new password/i)).toBeInTheDocument();
      });
    };

    test('validates password requirements', async () => {
      renderForgotPasswordPage();
      await advanceToStep3();

      const resetButton = screen.getByRole('button', { name: /reset password/i });
      fireEvent.click(resetButton);

      await waitFor(() => {
        expect(screen.getByText('New password is required')).toBeInTheDocument();
      });
    });

    test('validates password minimum length', async () => {
      renderForgotPasswordPage();
      await advanceToStep3();

      const newPasswordInput = screen.getByLabelText(/new password/i);
      fireEvent.change(newPasswordInput, { target: { value: 'short' } });

      const resetButton = screen.getByRole('button', { name: /reset password/i });
      fireEvent.click(resetButton);

      await waitFor(() => {
        const errorTexts = screen.getAllByText('Password must be at least 8 characters');
        const errorText = errorTexts.find(text => text.classList.contains('text-error'));
        expect(errorText).toBeInTheDocument();
      });
    });

    test('validates password confirmation match', async () => {
      renderForgotPasswordPage();
      await advanceToStep3();

      const newPasswordInput = screen.getByLabelText(/new password/i);
      const confirmPasswordInput = screen.getByLabelText(/confirm password/i);

      fireEvent.change(newPasswordInput, { target: { value: 'Password123' } });
      fireEvent.change(confirmPasswordInput, { target: { value: 'Different123' } });

      const resetButton = screen.getByRole('button', { name: /reset password/i });
      fireEvent.click(resetButton);

      await waitFor(() => {
        expect(screen.getByText('Passwords do not match')).toBeInTheDocument();
      });
    });

    test('resets password and shows success screen', async () => {
      renderForgotPasswordPage();
      await advanceToStep3();

      const newPasswordInput = screen.getByLabelText(/new password/i);
      const confirmPasswordInput = screen.getByLabelText(/confirm password/i);

      fireEvent.change(newPasswordInput, { target: { value: 'NewPassword123' } });
      fireEvent.change(confirmPasswordInput, { target: { value: 'NewPassword123' } });

      mockResetPassword.mockResolvedValueOnce({});

      const resetButton = screen.getByRole('button', { name: /reset password/i });
      fireEvent.click(resetButton);

      await waitFor(() => {
        expect(mockResetPassword).toHaveBeenCalledWith('reset-token-123', 'NewPassword123');
        expect(mockToast.success).toHaveBeenCalled();
        expect(screen.getByText('Password Reset Successful')).toBeInTheDocument();
        expect(screen.getByRole('link', { name: /go to login/i })).toBeInTheDocument();
      });
    });
  });

  describe('Loading State', () => {
    test('disables button and shows loading text when isLoading is true', async () => {
      useAuth.mockReturnValue({
        requestResetCode: mockRequestResetCode,
        verifyResetCode: mockVerifyResetCode,
        resetPassword: mockResetPassword,
        isLoading: true,
      });

      renderForgotPasswordPage();

      await waitFor(() => {
        const submitButton = screen.getByRole('button', { name: /sending.../i });
        expect(submitButton).toBeDisabled();
      });
    });
  });
});