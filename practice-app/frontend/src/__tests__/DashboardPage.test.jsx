import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import DashboardPage from '../pages/DashboardPage';
import * as authService from '../services/authService';
import userService from '../services/userService';
import reportService from '../services/reportService';

// Mock authService
jest.mock('../services/authService', () => ({
  getCurrentUser: jest.fn(),
}));

jest.mock('../services/userService', () => ({
  getUsername: jest.fn(),
}));

jest.mock('../services/reportService', () => ({
  checkAdminStatus: jest.fn(),
}));

// Mock i18n
jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key) => {
      const translations = {
        loading: 'Loading...',
        goodMorning: 'Good Morning',
        goodAfternoon: 'Good Afternoon',
        goodEvening: 'Good Evening',
        dashbboardSubtitle: 'Welcome to your dashboard',
        dashboardCardOneTitle: 'Meal Planner',
        dashboardCardOneContent: 'Plan your meals',
        dashboardCardOneButton: 'Plan Meals',
        dashboardCardTwoTitle: 'Recipes',
        dashboardCardTwoContent: 'Browse recipes',
        dashboardCardTwoButton: 'Browse Recipes',
        dashboardCardThreeTitle: 'Shopping List',
        dashboardCardThreeContent: 'Manage shopping list',
        dashboardCardFourTitle: 'Community',
        dashboardCardFourContent: 'Join community',
      };
      return translations[key] || key;
    },
  }),
}));

describe('DashboardPage', () => {
  const mockUser = { id: 1, username: 'testuser', email: 'test@example.com' };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  const renderDashboardPage = () => {
    return render(
      <BrowserRouter>
        <DashboardPage />
      </BrowserRouter>
    );
  };

  describe('Page Rendering', () => {
    test('shows loading state initially', () => {
      authService.getCurrentUser.mockImplementation(() => new Promise(() => {})); // Never resolves

      renderDashboardPage();

      expect(screen.getByText('Loading...')).toBeInTheDocument();
    });

    test('renders dashboard with welcome message after loading', async () => {
      authService.getCurrentUser.mockResolvedValue(mockUser);
      userService.getUsername.mockResolvedValue('testuser');
      reportService.checkAdminStatus.mockResolvedValue({ is_admin: false });

      renderDashboardPage();

      await waitFor(() => {
        expect(screen.getByText(/good morning|good afternoon|good evening/i)).toBeInTheDocument();
        expect(screen.getByText('Welcome to your dashboard')).toBeInTheDocument();
      });
    });

    test('renders all dashboard cards', async () => {
      authService.getCurrentUser.mockResolvedValue(mockUser);
      userService.getUsername.mockResolvedValue('testuser');
      reportService.checkAdminStatus.mockResolvedValue({ is_admin: false });

      renderDashboardPage();

      await waitFor(() => {
        expect(screen.getByText('Meal Planner')).toBeInTheDocument();
        expect(screen.getByText('Recipes')).toBeInTheDocument();
        expect(screen.getAllByText('Shopping List').length).toBeGreaterThan(0);
        expect(screen.getAllByText('Community').length).toBeGreaterThan(0);
      });
    });

    test('renders navigation links for each card', async () => {
      authService.getCurrentUser.mockResolvedValue(mockUser);
      userService.getUsername.mockResolvedValue('testuser');
      reportService.checkAdminStatus.mockResolvedValue({ is_admin: false });

      renderDashboardPage();

      await waitFor(() => {
        expect(screen.getByRole('link', { name: /plan meals/i })).toHaveAttribute('href', '/meal-planner');
        expect(screen.getByRole('link', { name: /browse recipes/i })).toHaveAttribute('href', '/recipes');
        expect(screen.getByRole('link', { name: /shopping list/i })).toHaveAttribute('href', '/shopping-list');
        expect(screen.getByRole('link', { name: /community/i })).toHaveAttribute('href', '/community');
      });
    });
  });

  describe('Admin Features', () => {
    test('shows admin reports card when user is admin', async () => {
      authService.getCurrentUser.mockResolvedValue(mockUser);
      userService.getUsername.mockResolvedValue('testuser');
      reportService.checkAdminStatus.mockResolvedValue({ is_admin: true });

      renderDashboardPage();

      await waitFor(() => {
        expect(screen.getByText(/Manage user reports/i)).toBeInTheDocument();
        expect(screen.getByRole('link', { name: /manage reports/i })).toHaveAttribute('href', '/admin-reports');
      });
    });

    test('does not show admin reports card when user is not admin', async () => {
      authService.getCurrentUser.mockResolvedValue(mockUser);
      userService.getUsername.mockResolvedValue('testuser');
      reportService.checkAdminStatus.mockResolvedValue({ is_admin: false });

      renderDashboardPage();

      await waitFor(() => {
        expect(screen.queryByText('Admin Reports')).not.toBeInTheDocument();
      });
    });
  });

  describe('Welcome Message', () => {
    test('displays morning greeting in morning hours', async () => {
      jest.spyOn(Date.prototype, 'getHours').mockReturnValue(10);
      
      authService.getCurrentUser.mockResolvedValue(mockUser);
      userService.getUsername.mockResolvedValue('testuser');
      reportService.checkAdminStatus.mockResolvedValue({ is_admin: false });

      renderDashboardPage();

      await waitFor(() => {
        expect(screen.getByText(/good morning/i)).toBeInTheDocument();
      });
    });

    test('displays afternoon greeting in afternoon hours', async () => {
      jest.spyOn(Date.prototype, 'getHours').mockReturnValue(14);
      
      authService.getCurrentUser.mockResolvedValue(mockUser);
      userService.getUsername.mockResolvedValue('testuser');
      reportService.checkAdminStatus.mockResolvedValue({ is_admin: false });

      renderDashboardPage();

      await waitFor(() => {
        expect(screen.getByText(/good afternoon/i)).toBeInTheDocument();
      });
    });

    test('displays evening greeting in evening hours', async () => {
      jest.spyOn(Date.prototype, 'getHours').mockReturnValue(20);
      
      authService.getCurrentUser.mockResolvedValue(mockUser);
      userService.getUsername.mockResolvedValue('testuser');
      reportService.checkAdminStatus.mockResolvedValue({ is_admin: false });

      renderDashboardPage();

      await waitFor(() => {
        expect(screen.getByText(/good evening/i)).toBeInTheDocument();
      });
    });
  });

  describe('Error Handling', () => {
    test('handles error when fetching user data', async () => {
      const consoleError = jest.spyOn(console, 'error').mockImplementation(() => {});
      authService.getCurrentUser.mockRejectedValue(new Error('Failed to fetch user'));

      renderDashboardPage();

      await waitFor(() => {
        expect(consoleError).toHaveBeenCalled();
      });

      consoleError.mockRestore();
    });
  });
});

