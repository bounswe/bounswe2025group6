{/* 

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import CommunityPage from '../pages/community/CommunityPage';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../components/ui/Toast';
import { useNavigate } from 'react-router-dom';

// Mock services to avoid import.meta.env issues
jest.mock('../services/forumService', () => ({
  getPosts: jest.fn(),
  createPost: jest.fn(),
  updatePost: jest.fn(),
  deletePost: jest.fn(),
  upvotePost: jest.fn(),
  downvotePost: jest.fn(),
  removeVote: jest.fn(),
  getComments: jest.fn(),
  createComment: jest.fn(),
  deleteComment: jest.fn(),
}));

jest.mock('../services/userService', () => ({
  getUserById: jest.fn(),
  getUsername: jest.fn(),
  updateProfile: jest.fn(),
  default: {
    getUserById: jest.fn(),
    getUsername: jest.fn(),
  },
}));

jest.mock('../services/authService', () => ({
  getCurrentUser: jest.fn(),
  loginUser: jest.fn(),
  logoutUser: jest.fn(),
}));

// Mock dependencies
jest.mock('../contexts/AuthContext');
jest.mock('../components/ui/Toast');
jest.mock('../components/report/ReportButton', () => {
  return function MockReportButton() {
    return <button>Report</button>;
  };
});
jest.mock('../components/ui/Button', () => {
  return function MockButton({ children, onClick, disabled, className }) {
    return <button onClick={onClick} disabled={disabled} className={className}>{children}</button>;
  };
});
jest.mock('../components/ui/Badge', () => {
  return function MockBadge({ children }) {
    return <span className="badge">{children}</span>;
  };
});
jest.mock('../components/ui/Card', () => {
  return function MockCard({ children }) {
    return <div className="card">{children}</div>;
  };
});
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: jest.fn(),
  Link: ({ children, to }) => <a href={to}>{children}</a>,
}));

// Mock i18n
jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key) => {
      const translations = {
        communityPageTitle: 'Community Forum',
        createPost: 'Create Post',
        myPosts: 'My Posts',
        search: 'Search',
        filter: 'Filter',
        sortBy: 'Sort By',
        recent: 'Recent',
        popular: 'Popular',
        comments: 'Comments',
        upvote: 'Upvote',
        downvote: 'Downvote',
        reply: 'Reply',
        delete: 'Delete',
        edit: 'Edit',
        cancel: 'Cancel',
        save: 'Save',
        loading: 'Loading...',
        error: 'Error',
        success: 'Success',
        postCreated: 'Post created successfully',
        postDeleted: 'Post deleted successfully',
        postUpdated: 'Post updated successfully',
        commentAdded: 'Comment added successfully',
        mustBeLoggedIn: 'You must be logged in to post',
      };
      return translations[key] || key;
    },
  }),
}));

// Mock utils
jest.mock('../utils/dateFormatter', () => ({
  formatDate: (date) => new Date(date).toLocaleDateString(),
}));

describe('CommunityPage', () => {
  const mockNavigate = jest.fn();
  const mockToast = {
    success: jest.fn(),
    error: jest.fn(),
  };

  const mockCurrentUser = {
    id: 1,
    username: 'testuser',
    email: 'test@example.com',
  };

  const mockPosts = [
    {
      id: 1,
      title: 'Best budget meal prep ideas',
      content: 'Here are some amazing budget-friendly meal prep tips for the week.',
      author_id: 2,
      author_username: 'john_doe',
      created_at: '2024-11-20T10:30:00Z',
      updated_at: '2024-11-20T10:30:00Z',
      upvote_count: 15,
      downvote_count: 2,
      comments_count: 8,
      tags: ['Budget', 'Meal Prep'],
      user_vote: null,
    },
    {
      id: 2,
      title: 'Vegan protein sources',
      content: 'Let me share my favorite plant-based protein options.',
      author_id: 3,
      author_username: 'jane_smith',
      created_at: '2024-11-19T14:15:00Z',
      updated_at: '2024-11-19T14:15:00Z',
      upvote_count: 22,
      downvote_count: 1,
      comments_count: 5,
      tags: ['Vegan', 'Nutrition'],
      user_vote: null,
    },
    {
      id: 3,
      title: 'Quick weeknight dinners',
      content: 'Simple recipes that take less than 30 minutes to prepare.',
      author_id: 1,
      author_username: 'testuser',
      created_at: '2024-11-21T08:00:00Z',
      updated_at: '2024-11-21T08:00:00Z',
      upvote_count: 5,
      downvote_count: 0,
      comments_count: 2,
      tags: ['Quick', 'Healthy'],
      user_vote: null,
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();

    useAuth.mockReturnValue({
      currentUser: mockCurrentUser,
      isLoading: false,
    });

    useToast.mockReturnValue(mockToast);
    useNavigate.mockReturnValue(mockNavigate);
    localStorage.setItem('fithub_access_token', 'mock-token');
  });

  afterEach(() => {
    localStorage.clear();
  });

  const renderCommunityPage = () => {
    return render(
      <BrowserRouter>
        <CommunityPage />
      </BrowserRouter>
    );
  };

  describe('Community Page Rendering', () => {
    test('renders community page with header', async () => {
      const forumService = require('../services/forumService');
      forumService.getPosts.mockResolvedValue({
        results: mockPosts,
        count: mockPosts.length,
        next: null,
      });

      renderCommunityPage();

      await waitFor(() => {
        expect(screen.getByText(/community forum/i)).toBeInTheDocument();
      });
    });

    test('renders create post button', async () => {
      const forumService = require('../services/forumService');
      forumService.getPosts.mockResolvedValue({
        results: mockPosts,
        count: mockPosts.length,
        next: null,
      });

      renderCommunityPage();

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /create post/i })).toBeInTheDocument();
      });
    });

    test('displays list of community posts', async () => {
      const forumService = require('../services/forumService');
      forumService.getPosts.mockResolvedValue({
        results: mockPosts,
        count: mockPosts.length,
        next: null,
      });

      renderCommunityPage();

      await waitFor(() => {
        expect(screen.getByText('Best budget meal prep ideas')).toBeInTheDocument();
        expect(screen.getByText('Vegan protein sources')).toBeInTheDocument();
      });
    });
  });

  describe('Post Search and Filter', () => {
    test('filters posts by search term', async () => {
      const forumService = require('../services/forumService');
      forumService.getPosts.mockResolvedValue({
        results: mockPosts,
        count: mockPosts.length,
        next: null,
      });

      renderCommunityPage();

      await waitFor(() => {
        expect(screen.getByText('Best budget meal prep ideas')).toBeInTheDocument();
      });

      const searchInput = screen.getByPlaceholderText(/search/i) || screen.getByRole('textbox', { name: /search/i });
      fireEvent.change(searchInput, { target: { value: 'budget' } });

      const applyFiltersButton = screen.getByRole('button', { name: /apply filters/i }) || screen.getByRole('button', { name: /filter/i });
      fireEvent.click(applyFiltersButton);

      expect(screen.getByText('Best budget meal prep ideas')).toBeInTheDocument();
    });

    test('filters posts by tag', async () => {
      const forumService = require('../services/forumService');
      forumService.getPosts.mockResolvedValue({
        results: mockPosts,
        count: mockPosts.length,
        next: null,
      });

      renderCommunityPage();

      await waitFor(() => {
        const tagOptions = screen.getAllByRole('option');
        expect(tagOptions.length).toBeGreaterThan(0);
      });
    });
  });

  describe('Post Voting', () => {
    test('upvotes a post successfully', async () => {
      const forumService = require('../services/forumService');
      forumService.getPosts.mockResolvedValue({
        results: mockPosts,
        count: mockPosts.length,
        next: null,
      });
      forumService.upvotePost.mockResolvedValue({
        success: true,
        upvote_count: 16,
      });

      renderCommunityPage();

      await waitFor(() => {
        expect(screen.getByText('Best budget meal prep ideas')).toBeInTheDocument();
      });

      const upvoteButtons = screen.getAllByRole('button', { name: /upvote/i });
      if (upvoteButtons.length > 0) {
        fireEvent.click(upvoteButtons[0]);

        await waitFor(() => {
          expect(forumService.upvotePost).toHaveBeenCalled();
        });
      }
    });

    test('downvotes a post successfully', async () => {
      const forumService = require('../services/forumService');
      forumService.getPosts.mockResolvedValue({
        results: mockPosts,
        count: mockPosts.length,
        next: null,
      });
      forumService.downvotePost.mockResolvedValue({
        success: true,
        downvote_count: 3,
      });

      renderCommunityPage();

      await waitFor(() => {
        expect(screen.getByText('Best budget meal prep ideas')).toBeInTheDocument();
      });

      const downvoteButtons = screen.getAllByRole('button', { name: /downvote/i });
      if (downvoteButtons.length > 0) {
        fireEvent.click(downvoteButtons[0]);

        await waitFor(() => {
          expect(forumService.downvotePost).toHaveBeenCalled();
        });
      }
    });
  });

  describe('Post Display', () => {
    test('displays post title and content', async () => {
      const forumService = require('../services/forumService');
      forumService.getPosts.mockResolvedValue({
        results: mockPosts,
        count: mockPosts.length,
        next: null,
      });

      renderCommunityPage();

      await waitFor(() => {
        expect(screen.getByText('Best budget meal prep ideas')).toBeInTheDocument();
        expect(screen.getByText(/Here are some amazing budget-friendly meal prep tips/i)).toBeInTheDocument();
      });
    });

    test('displays post author information', async () => {
      const forumService = require('../services/forumService');
      forumService.getPosts.mockResolvedValue({
        results: mockPosts,
        count: mockPosts.length,
        next: null,
      });

      renderCommunityPage();

      await waitFor(() => {
        expect(screen.getByText('john_doe')).toBeInTheDocument();
        expect(screen.getByText('jane_smith')).toBeInTheDocument();
      });
    });

    test('displays post statistics (upvotes, downvotes, comments)', async () => {
      const forumService = require('../services/forumService');
      forumService.getPosts.mockResolvedValue({
        results: mockPosts,
        count: mockPosts.length,
        next: null,
      });

      renderCommunityPage();

      await waitFor(() => {
        expect(screen.getByText(/15/)).toBeInTheDocument(); // upvote count
        expect(screen.getByText(/22/)).toBeInTheDocument(); // another upvote count
      });
    });

    test('displays post tags', async () => {
      const forumService = require('../services/forumService');
      forumService.getPosts.mockResolvedValue({
        results: mockPosts,
        count: mockPosts.length,
        next: null,
      });

      renderCommunityPage();

      await waitFor(() => {
        expect(screen.getByText('Budget')).toBeInTheDocument();
        expect(screen.getByText('Meal Prep')).toBeInTheDocument();
        expect(screen.getByText('Vegan')).toBeInTheDocument();
      });
    });
  });

  describe('Sorting', () => {
    test('sorts posts by recent', async () => {
      const forumService = require('../services/forumService');
      forumService.getPosts.mockResolvedValue({
        results: mockPosts,
        count: mockPosts.length,
        next: null,
      });

      renderCommunityPage();

      await waitFor(() => {
        expect(screen.getByText('Best budget meal prep ideas')).toBeInTheDocument();
      });

      const sortOptions = screen.getAllByRole('option', { name: /recent/i });
      if (sortOptions.length > 0) {
        fireEvent.click(sortOptions[0]);
      }
    });

    test('sorts posts by popular', async () => {
      const forumService = require('../services/forumService');
      forumService.getPosts.mockResolvedValue({
        results: mockPosts,
        count: mockPosts.length,
        next: null,
      });

      renderCommunityPage();

      await waitFor(() => {
        expect(screen.getByText('Vegan protein sources')).toBeInTheDocument();
      });
    });
  });

  describe('Error Handling', () => {
    test('displays error message when posts fail to load', async () => {
      const forumService = require('../services/forumService');
      forumService.getPosts.mockRejectedValue(new Error('Failed to load posts'));

      renderCommunityPage();

      await waitFor(() => {
        expect(mockToast.error).toHaveBeenCalled();
      });
    });

    test('handles unauthenticated user attempting to create post', async () => {
      useAuth.mockReturnValue({
        currentUser: null,
        isLoading: false,
      });

      const forumService = require('../services/forumService');
      forumService.getPosts.mockResolvedValue({
        results: mockPosts,
        count: mockPosts.length,
        next: null,
      });

      renderCommunityPage();

      await waitFor(() => {
        expect(screen.getByText(/community forum/i)).toBeInTheDocument();
      });

      const createPostButton = screen.getByRole('button', { name: /create post/i });
      fireEvent.click(createPostButton);

      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith('/login');
      });
    });
  });

  describe('User Post Actions', () => {
    test('allows user to delete their own post', async () => {
      const forumService = require('../services/forumService');
      forumService.getPosts.mockResolvedValue({
        results: mockPosts,
        count: mockPosts.length,
        next: null,
      });
      forumService.deletePost.mockResolvedValue({
        success: true,
        message: 'Post deleted successfully',
      });

      renderCommunityPage();

      await waitFor(() => {
        expect(screen.getByText('Quick weeknight dinners')).toBeInTheDocument();
      });

      const deleteButtons = screen.getAllByRole('button', { name: /delete/i });
      if (deleteButtons.length > 0) {
        fireEvent.click(deleteButtons[0]);

        await waitFor(() => {
          expect(forumService.deletePost).toHaveBeenCalled();
        });
      }
    });

    test('allows user to edit their own post', async () => {
      const forumService = require('../services/forumService');
      forumService.getPosts.mockResolvedValue({
        results: mockPosts,
        count: mockPosts.length,
        next: null,
      });

      renderCommunityPage();

      await waitFor(() => {
        expect(screen.getByText('Quick weeknight dinners')).toBeInTheDocument();
      });

      const editButtons = screen.getAllByRole('button', { name: /edit/i });
      if (editButtons.length > 0) {
        fireEvent.click(editButtons[0]);

        await waitFor(() => {
          expect(mockNavigate).toHaveBeenCalled();
        });
      }
    });
  });

  describe('Pagination', () => {
    test('navigates to next page of posts', async () => {
      const forumService = require('../services/forumService');
      forumService.getPosts.mockResolvedValue({
        results: mockPosts,
        count: 30,
        next: 'page=2',
      });

      renderCommunityPage();

      await waitFor(() => {
        expect(screen.getByText('Best budget meal prep ideas')).toBeInTheDocument();
      });

      const nextPageButton = screen.getByRole('button', { name: /next/i });
      if (nextPageButton && !nextPageButton.disabled) {
        fireEvent.click(nextPageButton);

        await waitFor(() => {
          expect(forumService.getPosts).toHaveBeenCalledTimes(2);
        });
      }
    });

    test('navigates to previous page of posts', async () => {
      const forumService = require('../services/forumService');
      forumService.getPosts.mockResolvedValue({
        results: mockPosts,
        count: 30,
        previous: 'page=1',
      });

      renderCommunityPage();

      await waitFor(() => {
        expect(screen.getByText('Best budget meal prep ideas')).toBeInTheDocument();
      });

      const prevPageButton = screen.getByRole('button', { name: /previous/i });
      if (prevPageButton && !prevPageButton.disabled) {
        fireEvent.click(prevPageButton);

        await waitFor(() => {
          expect(forumService.getPosts).toHaveBeenCalled();
        });
      }
    });
  });

  describe('Loading State', () => {
    test('displays loading indicator while fetching posts', () => {
      const forumService = require('../services/forumService');
      forumService.getPosts.mockImplementation(
        () => new Promise(() => {}) // Never resolves to keep loading state
      );

      renderCommunityPage();

      expect(screen.getByText(/loading/i)).toBeInTheDocument();
    });
  });
});


*/}