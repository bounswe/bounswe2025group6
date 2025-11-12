import React from 'react';
import { render } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from '../../contexts/AuthContext';
import { ToastProvider } from '../../components/ui/Toast';

/**
 * Mock implementation of useAuth hook
 */
export const createMockAuth = (overrides = {}) => ({
  currentUser: null,
  userType: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,
  login: jest.fn(),
  register: jest.fn(),
  logout: jest.fn(),
  verifyEmail: jest.fn(),
  requestPasswordReset: jest.fn(),
  resetPassword: jest.fn(),
  requestResetCode: jest.fn(),
  verifyResetCode: jest.fn(),
  ...overrides,
});

/**
 * Mock implementation of useToast hook
 */
export const createMockToast = () => ({
  success: jest.fn(),
  error: jest.fn(),
  warning: jest.fn(),
  info: jest.fn(),
});

/**
 * Mock implementation of useNavigate hook
 */
export const createMockNavigate = () => jest.fn();

/**
 * Mock implementation of useLocation hook
 */
export const createMockLocation = (overrides = {}) => ({
  pathname: '/',
  search: '',
  hash: '',
  state: null,
  ...overrides,
});

/**
 * Render component with Router wrapper
 */
export const renderWithRouter = (ui, { route = '/' } = {}) => {
  window.history.pushState({}, 'Test page', route);
  return render(<BrowserRouter>{ui}</BrowserRouter>);
};

/**
 * Render component with AuthProvider wrapper
 */
export const renderWithAuth = (ui, { authValue = null } = {}) => {
  const mockAuth = authValue || createMockAuth();
  
  // Mock the AuthContext
  jest.mock('../../contexts/AuthContext', () => ({
    ...jest.requireActual('../../contexts/AuthContext'),
    useAuth: () => mockAuth,
  }));

  return render(<AuthProvider>{ui}</AuthProvider>);
};

/**
 * Render component with Router and AuthProvider
 */
export const renderWithRouterAndAuth = (
  ui,
  { route = '/', authValue = null } = {}
) => {
  window.history.pushState({}, 'Test page', route);
  const mockAuth = authValue || createMockAuth();
  
  // Mock the AuthContext
  jest.mock('../../contexts/AuthContext', () => ({
    ...jest.requireActual('../../contexts/AuthContext'),
    useAuth: () => mockAuth,
  }));

  return render(
    <BrowserRouter>
      <AuthProvider>{ui}</AuthProvider>
    </BrowserRouter>
  );
};

/**
 * Render component with all providers (Router, Auth, Toast)
 */
export const renderWithAllProviders = (
  ui,
  { route = '/', authValue = null } = {}
) => {
  window.history.pushState({}, 'Test page', route);
  const mockAuth = authValue || createMockAuth();
  
  // Mock the AuthContext
  jest.mock('../../contexts/AuthContext', () => ({
    ...jest.requireActual('../../contexts/AuthContext'),
    useAuth: () => mockAuth,
  }));

  return render(
    <BrowserRouter>
      <ToastProvider>
        <AuthProvider>{ui}</AuthProvider>
      </ToastProvider>
    </BrowserRouter>
  );
};

/**
 * Wait for async operations to complete
 */
export const waitForAsync = () => new Promise(resolve => setTimeout(resolve, 0));

/**
 * Create a mock user object
 */
export const createMockUser = (overrides = {}) => ({
  id: 1,
  username: 'testuser',
  email: 'test@example.com',
  userType: 'user',
  ...overrides,
});

