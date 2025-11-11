import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import HomePage from '../pages/HomePage';
import { useAuth } from '../contexts/AuthContext';
import i18next from 'i18next';

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
jest.mock('i18next', () => ({
  changeLanguage: jest.fn(),
  language: 'en',
}));

// Mock i18n
jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key) => {
      const translations = {
        homePageTitle: 'Welcome to FitHub',
        homePageSubtitle: 'Your nutrition companion',
        homePageGotoDashboard: 'Go to Dashboard',
        homePageLogin: 'Login',
        homePageSignUp: 'Sign Up',
        homePageSecondTitle: 'Features',
        homePageSecondSubtitle: 'What we offer',
        homePageIconOne: 'Recipe Discovery',
        homePageIconOneDetail: 'Find recipes',
        homePageIconTwo: 'Nutrition Tracking',
        homePageIconTwoDetail: 'Track nutrition',
        homePageIconThree: 'Shopping Lists',
        homePageIconThreeDetail: 'Create shopping lists',
        homePageIconFour: 'Budget Management',
        homePageIconFourDetail: 'Manage budget',
        homePageIconFive: 'Community',
        homePageIconFiveDetail: 'Join community',
        homePageIconSix: 'Dietary Options',
        homePageIconSixDetail: 'Dietary preferences',
        homePageThirdTitle: 'How It Works',
        homePageStepOne: 'Sign Up',
        homePageStepOneDetail: 'Create account',
        homePageStepTwo: 'Explore',
        homePageStepTwoDetail: 'Explore recipes',
        homePageStepThree: 'Enjoy',
        homePageStepThreeDetail: 'Enjoy meals',
        homePageCtaHeader: 'Get Started',
        homePageCtaDetail: 'Join us today',
      };
      return translations[key] || key;
    },
  }),
}));

describe('HomePage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const renderHomePage = (authValue = { currentUser: null }) => {
    useAuth.mockReturnValue(authValue);
    return render(
      <BrowserRouter>
        <HomePage />
      </BrowserRouter>
    );
  };

  describe('Page Rendering', () => {
    test('renders homepage with hero section', () => {
      renderHomePage();

      expect(screen.getByRole('heading', { name: /welcome to fithub/i })).toBeInTheDocument();
      expect(screen.getByText(/your nutrition companion/i)).toBeInTheDocument();
    });

    test('renders features section', () => {
      renderHomePage();

      expect(screen.getByText('Features')).toBeInTheDocument();
      expect(screen.getByText('Recipe Discovery')).toBeInTheDocument();
      expect(screen.getByText('Nutrition Tracking')).toBeInTheDocument();
    });

    test('renders how it works section', () => {
      renderHomePage();

      expect(screen.getByText('How It Works')).toBeInTheDocument();
      expect(screen.getAllByText('Sign Up').length).toBeGreaterThan(0);
      expect(screen.getByText('Explore')).toBeInTheDocument();
    });

    test('renders CTA section', () => {
      renderHomePage();

      expect(screen.getByText('Get Started')).toBeInTheDocument();
      expect(screen.getByText('Join us today')).toBeInTheDocument();
    });
  });

  describe('Authentication States', () => {
    test('shows login and sign up buttons when user is not authenticated', () => {
      renderHomePage({ currentUser: null });

      expect(screen.getByRole('link', { name: /login/i })).toBeInTheDocument();
      expect(screen.getAllByRole('link', { name: /sign up/i }).length).toBeGreaterThan(0);
      expect(screen.queryByRole('link', { name: /go to dashboard/i })).not.toBeInTheDocument();
    });

    test('shows dashboard link when user is authenticated', () => {
      renderHomePage({ currentUser: { id: 1, username: 'testuser' } });

      expect(screen.getAllByRole('link', { name: /go to dashboard/i }).length).toBeGreaterThan(0);
      expect(screen.queryByRole('link', { name: /login/i })).not.toBeInTheDocument();
    });

    test('CTA button links to dashboard when authenticated', () => {
      renderHomePage({ currentUser: { id: 1, username: 'testuser' } });

      const ctaButtons = screen.getAllByRole('link', { name: /go to dashboard/i });
      expect(ctaButtons.length).toBeGreaterThan(0);
      expect(ctaButtons[ctaButtons.length - 1]).toHaveAttribute('href', '/dashboard');
    });

    test('CTA button links to register when not authenticated', () => {
      renderHomePage({ currentUser: null });

      const ctaButtons = screen.getAllByRole('link', { name: /sign up/i });
      expect(ctaButtons.length).toBeGreaterThan(0);
      expect(ctaButtons[ctaButtons.length - 1]).toHaveAttribute('href', '/register');
    });
  });

  describe('Language Selection', () => {
    test('renders language dropdown', () => {
      renderHomePage();

      const langDropdown = screen.getByRole('combobox');
      expect(langDropdown).toBeInTheDocument();
      expect(screen.getByRole('option', { name: 'English' })).toBeInTheDocument();
      expect(screen.getByRole('option', { name: 'Türkçe' })).toBeInTheDocument();
    });

    test('changes language when dropdown value changes', () => {
      renderHomePage();

      const langDropdown = screen.getByRole('combobox');
      fireEvent.change(langDropdown, { target: { value: 'tr' } });

      expect(i18next.changeLanguage).toHaveBeenCalledWith('tr');
    });
  });
});

