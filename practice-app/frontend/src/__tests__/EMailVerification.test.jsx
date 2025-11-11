import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import EmailVerificationPage from '../pages/auth/EmailVerificationPage';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../components/ui/Toast';
import { useParams } from 'react-router-dom';

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
}));

describe('EmailVerificationPage', () => {
  const mockVerifyEmail = jest.fn();
  const mockToast = {
    success: jest.fn(),
    error: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    
    useAuth.mockReturnValue({
      verifyEmail: mockVerifyEmail,
      isLoading: false,
    });

    useToast.mockReturnValue(mockToast);
  });

  const renderEmailVerificationPage = () => {
    return render(
      <BrowserRouter>
        <EmailVerificationPage />
      </BrowserRouter>
    );
  };

  describe('Page Rendering', () => {
    test('renders verification page with loading state initially', () => {
      useParams.mockReturnValue({ token: 'valid-token-123' });
      mockVerifyEmail.mockImplementation(() => new Promise(() => {})); // Never resolves

      renderEmailVerificationPage();

      expect(screen.getByRole('heading', { name: /email verification/i })).toBeInTheDocument();
      expect(screen.getByText('Verifying Your Email')).toBeInTheDocument();
    });

    test('shows error when token is missing', async () => {
      useParams.mockReturnValue({ token: null });

      renderEmailVerificationPage();

      await waitFor(() => {
        expect(screen.getByText('Verification Failed')).toBeInTheDocument();
        expect(screen.getByText(/Invalid verification link/i)).toBeInTheDocument();
      });
    });
  });

  describe('Email Verification Process', () => {
    test('calls verifyEmail with token on mount', async () => {
      useParams.mockReturnValue({ token: 'valid-token-123' });
      mockVerifyEmail.mockResolvedValueOnce({});

      renderEmailVerificationPage();

      await waitFor(() => {
        expect(mockVerifyEmail).toHaveBeenCalledWith('valid-token-123');
      });
    });

    test('shows success screen after successful verification', async () => {
      useParams.mockReturnValue({ token: 'valid-token-123' });
      mockVerifyEmail.mockResolvedValueOnce({});

      renderEmailVerificationPage();

      await waitFor(() => {
        expect(screen.getByText('Email Verified Successfully!')).toBeInTheDocument();
        expect(screen.getByText(/Your email has been verified successfully/i)).toBeInTheDocument();
        expect(screen.getByRole('link', { name: /go to login/i })).toBeInTheDocument();
      });
      expect(mockToast.success).toHaveBeenCalledWith('Email verified successfully');
    });

    test('shows error screen when verification fails', async () => {
      useParams.mockReturnValue({ token: 'invalid-token-123' });
      const error = new Error('Invalid or expired token');
      mockVerifyEmail.mockRejectedValueOnce(error);

      renderEmailVerificationPage();

      await waitFor(() => {
        expect(screen.getByText('Verification Failed')).toBeInTheDocument();
        expect(screen.getByText('Invalid or expired token')).toBeInTheDocument();
        expect(screen.getByRole('link', { name: /go to login/i })).toBeInTheDocument();
        expect(screen.getByRole('link', { name: /register again/i })).toBeInTheDocument();
      });
      expect(mockToast.error).toHaveBeenCalledWith('Invalid or expired token');
    });

    test('shows default error message when error has no message', async () => {
      useParams.mockReturnValue({ token: 'invalid-token-123' });
      mockVerifyEmail.mockRejectedValueOnce({});

      renderEmailVerificationPage();

      await waitFor(() => {
        expect(screen.getByText(/Failed to verify email/i)).toBeInTheDocument();
      });
    });
  });
});