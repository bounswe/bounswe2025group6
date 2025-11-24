import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import AdminLogin from '../pages/admin/AdminLogin';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../components/ui/Toast';
import reportService from '../services/reportService';

// Mock dependencies
jest.mock('../contexts/AuthContext');
jest.mock('../components/ui/Toast');
jest.mock('../services/reportService');

// Mock react-router-dom
const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}));

// Mock localStorage
const mockLocalStorage = (() => {
  let store = {};
  return {
    getItem: jest.fn((key) => store[key] || null),
    setItem: jest.fn((key, value) => { store[key] = value; }),
    removeItem: jest.fn((key) => { delete store[key]; }),
    clear: jest.fn(() => { store = {}; }),
  };
})();
Object.defineProperty(window, 'localStorage', { value: mockLocalStorage });

describe('AdminLogin', () => {
  const mockToast = {
    success: jest.fn(),
    error: jest.fn(),
    info: jest.fn(),
    warning: jest.fn(),
  };

  const mockSetCurrentUser = jest.fn();
  const mockOnLoginSuccess = jest.fn();

  const mockAdminUser = {
    id: 1,
    username: 'admin',
    is_staff: true,
  };

  const mockLoginResponse = {
    user: mockAdminUser,
    tokens: {
      access: 'access-token-123',
      refresh: 'refresh-token-123',
    },
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockLocalStorage.clear();

    useAuth.mockReturnValue({
      setCurrentUser: mockSetCurrentUser,
    });

    useToast.mockReturnValue(mockToast);

    reportService.adminLogin.mockResolvedValue(mockLoginResponse);
  });

  const renderAdminLogin = (props = {}) => {
    return render(
      <BrowserRouter>
        <AdminLogin onLoginSuccess={mockOnLoginSuccess} {...props} />
      </BrowserRouter>
    );
  };

  describe('Component Rendering', () => {
    test('renders admin login form correctly', () => {
      renderAdminLogin();

      expect(screen.getByText('Admin Login')).toBeInTheDocument();
      expect(screen.getByText('Enter your admin credentials to access the management panel')).toBeInTheDocument();
      expect(screen.getByLabelText('Admin Username')).toBeInTheDocument();
      expect(screen.getByLabelText('Admin Password')).toBeInTheDocument();
      expect(screen.getByText('Login as Admin')).toBeInTheDocument();
    });

    test('renders security notice', () => {
      renderAdminLogin();

      expect(screen.getByText('This is a secure admin area. Only authorized personnel should access this page.')).toBeInTheDocument();
    });

    test('renders footer with links and instructions', () => {
      renderAdminLogin();

      expect(screen.getByText('Need to create an admin account? Use Django\'s createsuperuser command.')).toBeInTheDocument();
      expect(screen.getByText('Back to regular login')).toBeInTheDocument();
      
      const backLink = screen.getByRole('link', { name: 'Back to regular login' });
      expect(backLink).toHaveAttribute('href', '/login');
    });

    test('renders form inputs with proper attributes', () => {
      renderAdminLogin();

      const usernameInput = screen.getByLabelText('Admin Username');
      expect(usernameInput).toHaveAttribute('type', 'text');
      expect(usernameInput).toHaveAttribute('name', 'username');
      expect(usernameInput).toHaveAttribute('autoComplete', 'username');
      expect(usernameInput).toHaveAttribute('placeholder', 'Enter admin username');

      const passwordInput = screen.getByLabelText('Admin Password');
      expect(passwordInput).toHaveAttribute('type', 'password');
      expect(passwordInput).toHaveAttribute('name', 'password');
      expect(passwordInput).toHaveAttribute('autoComplete', 'current-password');
      expect(passwordInput).toHaveAttribute('placeholder', 'Enter admin password');
    });
  });

  describe('Form Input Handling', () => {
    test('updates username field correctly', () => {
      renderAdminLogin();

      const usernameInput = screen.getByLabelText('Admin Username');
      fireEvent.change(usernameInput, { target: { value: 'admin' } });

      expect(usernameInput.value).toBe('admin');
    });

    test('updates password field correctly', () => {
      renderAdminLogin();

      const passwordInput = screen.getByLabelText('Admin Password');
      fireEvent.change(passwordInput, { target: { value: 'password123' } });

      expect(passwordInput.value).toBe('password123');
    });

    test('clears errors when user starts typing', async () => {
      renderAdminLogin();

      const submitButton = screen.getByText('Login as Admin');
      const usernameInput = screen.getByLabelText('Admin Username');

      // Submit empty form - HTML5 validation prevents submit, so we need to bypass it
      // by directly calling the form's onSubmit handler
      const form = document.querySelector('.admin-login-form');
      const submitEvent = new Event('submit', { bubbles: true, cancelable: true });
      form.dispatchEvent(submitEvent);

      await waitFor(() => {
        expect(screen.getByText('Username is required')).toBeInTheDocument();
      });

      // Start typing to clear error
      fireEvent.change(usernameInput, { target: { value: 'a' } });

      await waitFor(() => {
        expect(screen.queryByText('Username is required')).not.toBeInTheDocument();
      });
    });
  });

  describe('Form Validation', () => {
    test('validates required username field', async () => {
      renderAdminLogin();

      // HTML5 validation prevents form submit, so we need to bypass it
      const form = document.querySelector('.admin-login-form');
      const submitEvent = new Event('submit', { bubbles: true, cancelable: true });
      form.dispatchEvent(submitEvent);

      await waitFor(() => {
        expect(screen.getByText('Username is required')).toBeInTheDocument();
      });
      expect(reportService.adminLogin).not.toHaveBeenCalled();
    });

    test('validates required password field', async () => {
      renderAdminLogin();

      const usernameInput = screen.getByLabelText('Admin Username');
      fireEvent.change(usernameInput, { target: { value: 'admin' } });

      // HTML5 validation prevents form submit, so we need to bypass it
      const form = document.querySelector('.admin-login-form');
      const submitEvent = new Event('submit', { bubbles: true, cancelable: true });
      form.dispatchEvent(submitEvent);

      await waitFor(() => {
        expect(screen.getByText('Password is required')).toBeInTheDocument();
      });
      expect(reportService.adminLogin).not.toHaveBeenCalled();
    });

    test('validates whitespace-only inputs', () => {
      renderAdminLogin();

      const usernameInput = screen.getByLabelText('Admin Username');
      const passwordInput = screen.getByLabelText('Admin Password');

      fireEvent.change(usernameInput, { target: { value: '   ' } });
      fireEvent.change(passwordInput, { target: { value: 'password' } });

      const submitButton = screen.getByText('Login as Admin');
      fireEvent.click(submitButton);

      expect(screen.getByText('Username is required')).toBeInTheDocument();
    });

    test('adds error styling to invalid fields', async () => {
      renderAdminLogin();

      // HTML5 validation prevents form submit, so we need to bypass it
      const form = document.querySelector('.admin-login-form');
      const submitEvent = new Event('submit', { bubbles: true, cancelable: true });
      form.dispatchEvent(submitEvent);

      await waitFor(() => {
        const usernameInput = screen.getByLabelText('Admin Username');
        const passwordInput = screen.getByLabelText('Admin Password');

        expect(usernameInput).toHaveClass('error');
        expect(passwordInput).toHaveClass('error');
      });
    });
  });

  describe('Form Submission', () => {
    test('submits form with valid credentials', async () => {
      renderAdminLogin();

      const usernameInput = screen.getByLabelText('Admin Username');
      const passwordInput = screen.getByLabelText('Admin Password');

      fireEvent.change(usernameInput, { target: { value: 'admin' } });
      fireEvent.change(passwordInput, { target: { value: 'password123' } });

      const submitButton = screen.getByText('Login as Admin');
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(reportService.adminLogin).toHaveBeenCalledWith('admin', 'password123');
      });
    });

    test('trims whitespace from username', async () => {
      renderAdminLogin();

      const usernameInput = screen.getByLabelText('Admin Username');
      const passwordInput = screen.getByLabelText('Admin Password');

      fireEvent.change(usernameInput, { target: { value: '  admin  ' } });
      fireEvent.change(passwordInput, { target: { value: 'password123' } });

      const submitButton = screen.getByText('Login as Admin');
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(reportService.adminLogin).toHaveBeenCalledWith('admin', 'password123');
      });
    });

    test('stores tokens in localStorage on successful login', async () => {
      renderAdminLogin();

      const usernameInput = screen.getByLabelText('Admin Username');
      const passwordInput = screen.getByLabelText('Admin Password');

      fireEvent.change(usernameInput, { target: { value: 'admin' } });
      fireEvent.change(passwordInput, { target: { value: 'password123' } });

      const submitButton = screen.getByText('Login as Admin');
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(mockLocalStorage.setItem).toHaveBeenCalledWith('fithub_access_token', 'access-token-123');
        expect(mockLocalStorage.setItem).toHaveBeenCalledWith('fithub_refresh_token', 'refresh-token-123');
      });
    });

    test('updates auth context on successful login', async () => {
      renderAdminLogin();

      const usernameInput = screen.getByLabelText('Admin Username');
      const passwordInput = screen.getByLabelText('Admin Password');

      fireEvent.change(usernameInput, { target: { value: 'admin' } });
      fireEvent.change(passwordInput, { target: { value: 'password123' } });

      const submitButton = screen.getByText('Login as Admin');
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(mockSetCurrentUser).toHaveBeenCalledWith(mockAdminUser);
      });
    });

    test('shows success toast on successful login', async () => {
      renderAdminLogin();

      const usernameInput = screen.getByLabelText('Admin Username');
      const passwordInput = screen.getByLabelText('Admin Password');

      fireEvent.change(usernameInput, { target: { value: 'admin' } });
      fireEvent.change(passwordInput, { target: { value: 'password123' } });

      const submitButton = screen.getByText('Login as Admin');
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(mockToast.success).toHaveBeenCalledWith('Welcome, admin!');
      });
    });

    test('calls onLoginSuccess callback if provided', async () => {
      renderAdminLogin();

      const usernameInput = screen.getByLabelText('Admin Username');
      const passwordInput = screen.getByLabelText('Admin Password');

      fireEvent.change(usernameInput, { target: { value: 'admin' } });
      fireEvent.change(passwordInput, { target: { value: 'password123' } });

      const submitButton = screen.getByText('Login as Admin');
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(mockOnLoginSuccess).toHaveBeenCalledWith(mockAdminUser);
      });
    });

    test('navigates to admin reports when no callback provided', async () => {
      renderAdminLogin({ onLoginSuccess: undefined });

      const usernameInput = screen.getByLabelText('Admin Username');
      const passwordInput = screen.getByLabelText('Admin Password');

      fireEvent.change(usernameInput, { target: { value: 'admin' } });
      fireEvent.change(passwordInput, { target: { value: 'password123' } });

      const submitButton = screen.getByText('Login as Admin');
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith('/admin-reports');
      });
    });
  });

  describe('Loading States', () => {
    test('shows loading state during submission', async () => {
      let resolvePromise;
      reportService.adminLogin.mockReturnValue(new Promise(resolve => {
        resolvePromise = resolve;
      }));

      renderAdminLogin();

      const usernameInput = screen.getByLabelText('Admin Username');
      const passwordInput = screen.getByLabelText('Admin Password');

      fireEvent.change(usernameInput, { target: { value: 'admin' } });
      fireEvent.change(passwordInput, { target: { value: 'password123' } });

      const submitButton = screen.getByText('Login as Admin');
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('Authenticating...')).toBeInTheDocument();
        expect(submitButton).toBeDisabled();
      });

      resolvePromise(mockLoginResponse);
    });

    test('disables form inputs during submission', async () => {
      let resolvePromise;
      reportService.adminLogin.mockReturnValue(new Promise(resolve => {
        resolvePromise = resolve;
      }));

      renderAdminLogin();

      const usernameInput = screen.getByLabelText('Admin Username');
      const passwordInput = screen.getByLabelText('Admin Password');

      fireEvent.change(usernameInput, { target: { value: 'admin' } });
      fireEvent.change(passwordInput, { target: { value: 'password123' } });

      const submitButton = screen.getByText('Login as Admin');
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(usernameInput).toBeDisabled();
        expect(passwordInput).toBeDisabled();
      });

      resolvePromise(mockLoginResponse);
    });

    test('adds loading class to form during submission', async () => {
      let resolvePromise;
      reportService.adminLogin.mockReturnValue(new Promise(resolve => {
        resolvePromise = resolve;
      }));

      renderAdminLogin();

      const usernameInput = screen.getByLabelText('Admin Username');
      const passwordInput = screen.getByLabelText('Admin Password');

      fireEvent.change(usernameInput, { target: { value: 'admin' } });
      fireEvent.change(passwordInput, { target: { value: 'password123' } });

      const submitButton = screen.getByText('Login as Admin');
      fireEvent.click(submitButton);

      await waitFor(() => {
        // Form doesn't have role="form", so we find it by className
        const form = document.querySelector('.admin-login-form');
        expect(form).toHaveClass('loading');
      });

      resolvePromise(mockLoginResponse);
    });
  });

  describe('Error Handling', () => {
    test('handles 401 unauthorized error', async () => {
      const error = {
        response: { status: 401 }
      };
      reportService.adminLogin.mockRejectedValue(error);

      renderAdminLogin();

      const usernameInput = screen.getByLabelText('Admin Username');
      const passwordInput = screen.getByLabelText('Admin Password');

      fireEvent.change(usernameInput, { target: { value: 'admin' } });
      fireEvent.change(passwordInput, { target: { value: 'wrongpassword' } });

      const submitButton = screen.getByText('Login as Admin');
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(mockToast.error).toHaveBeenCalledWith('Invalid admin credentials');
      });

      await waitFor(() => {
        // Error message appears in both username and password fields
        const errorMessages = screen.getAllByText('Invalid credentials');
        expect(errorMessages.length).toBeGreaterThan(0);
      });
    });

    test('handles 403 access denied error', async () => {
      const error = {
        response: { status: 403 }
      };
      reportService.adminLogin.mockRejectedValue(error);

      renderAdminLogin();

      const usernameInput = screen.getByLabelText('Admin Username');
      const passwordInput = screen.getByLabelText('Admin Password');

      fireEvent.change(usernameInput, { target: { value: 'regularuser' } });
      fireEvent.change(passwordInput, { target: { value: 'password123' } });

      const submitButton = screen.getByText('Login as Admin');
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(mockToast.error).toHaveBeenCalledWith('Access denied. Admin privileges required.');
      });
    });

    test('handles generic network errors', async () => {
      const error = new Error('Network error');
      reportService.adminLogin.mockRejectedValue(error);

      renderAdminLogin();

      const usernameInput = screen.getByLabelText('Admin Username');
      const passwordInput = screen.getByLabelText('Admin Password');

      fireEvent.change(usernameInput, { target: { value: 'admin' } });
      fireEvent.change(passwordInput, { target: { value: 'password123' } });

      const submitButton = screen.getByText('Login as Admin');
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(mockToast.error).toHaveBeenCalledWith('Login failed. Please try again.');
      });
    });

    test('shows field errors for invalid credentials', async () => {
      const error = {
        response: { status: 401 }
      };
      reportService.adminLogin.mockRejectedValue(error);

      renderAdminLogin();

      const usernameInput = screen.getByLabelText('Admin Username');
      const passwordInput = screen.getByLabelText('Admin Password');

      fireEvent.change(usernameInput, { target: { value: 'admin' } });
      fireEvent.change(passwordInput, { target: { value: 'wrongpassword' } });

      const submitButton = screen.getByText('Login as Admin');
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(usernameInput).toHaveClass('error');
        expect(passwordInput).toHaveClass('error');
      });
    });

    test('restores form state after error', async () => {
      const error = new Error('Network error');
      reportService.adminLogin.mockRejectedValue(error);

      renderAdminLogin();

      const usernameInput = screen.getByLabelText('Admin Username');
      const passwordInput = screen.getByLabelText('Admin Password');

      fireEvent.change(usernameInput, { target: { value: 'admin' } });
      fireEvent.change(passwordInput, { target: { value: 'password123' } });

      const submitButton = screen.getByText('Login as Admin');
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(mockToast.error).toHaveBeenCalled();
      });

      // Form should be enabled again
      expect(submitButton).not.toBeDisabled();
      expect(usernameInput).not.toBeDisabled();
      expect(passwordInput).not.toBeDisabled();
      expect(screen.getByText('Login as Admin')).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    test('handles missing tokens in response', async () => {
      const responseWithoutTokens = {
        user: mockAdminUser,
        // tokens field missing
      };
      reportService.adminLogin.mockResolvedValue(responseWithoutTokens);

      renderAdminLogin();

      const usernameInput = screen.getByLabelText('Admin Username');
      const passwordInput = screen.getByLabelText('Admin Password');

      fireEvent.change(usernameInput, { target: { value: 'admin' } });
      fireEvent.change(passwordInput, { target: { value: 'password123' } });

      const submitButton = screen.getByText('Login as Admin');
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(mockSetCurrentUser).toHaveBeenCalledWith(mockAdminUser);
        // Should not try to store tokens
        expect(mockLocalStorage.setItem).not.toHaveBeenCalled();
      });
    });

    test('handles missing setCurrentUser function', async () => {
      useAuth.mockReturnValue({
        setCurrentUser: null,
      });

      renderAdminLogin();

      const usernameInput = screen.getByLabelText('Admin Username');
      const passwordInput = screen.getByLabelText('Admin Password');

      fireEvent.change(usernameInput, { target: { value: 'admin' } });
      fireEvent.change(passwordInput, { target: { value: 'password123' } });

      const submitButton = screen.getByText('Login as Admin');
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(mockToast.success).toHaveBeenCalledWith('Welcome, admin!');
        // Should not crash when setCurrentUser is null
      });
    });

    test('handles keyboard submission', async () => {
      renderAdminLogin();

      const usernameInput = screen.getByLabelText('Admin Username');
      const passwordInput = screen.getByLabelText('Admin Password');

      fireEvent.change(usernameInput, { target: { value: 'admin' } });
      fireEvent.change(passwordInput, { target: { value: 'password123' } });

      // Submit via form submit event - form doesn't have role, so find by className
      const form = document.querySelector('.admin-login-form');
      fireEvent.submit(form);

      await waitFor(() => {
        expect(reportService.adminLogin).toHaveBeenCalledWith('admin', 'password123');
      });
    });
  });
});