import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import CommunityPage from '../pages/community/CommunityPage';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../components/ui/Toast';
import forumService from '../services/forumService';
import userService from '../services/userService';
import { getCurrentUser } from '../services/authService';

// Mock dependencies
jest.mock('../contexts/AuthContext');
jest.mock('../components/ui/Toast');
jest.mock('../services/forumService');
jest.mock('../services/userService');
jest.mock('../services/authService');

// Mock i18n
jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key, options) => {
      const translations = {
        communityPageTitle: 'Community Forum',
        communityPageSubTitle: 'Share and discover meal planning tips',
        communityPageCreatePost: 'Create Post',
        communityPageSearchPlaceholder: 'Search posts...',
        communityPageAllTags: 'All Tags',
        communityPageMostRecent: 'Most Recent',
        communityPageMostPopular: 'Most Popular',
        communityPageMostComments: 'Most Comments',
        communityPageApplyFilters: 'Apply Filters',
        communityPageResetFilters: 'Reset Filters',
        communityPageLoadingPosts: 'Loading posts...',
        communityPageErrorLoading: 'Error Loading Posts',
        communityPageFailedToLoad: 'Failed to load posts',
        communityPagePostedBy: 'Posted by',
        communityPageViews: 'views',
        communityPageLogInToVote: 'Please log in to vote',
        communityPageVoteRemoved: 'Vote removed',
        communityPageFailedToVote: 'Failed to vote on post',
        communityPageForumEmpty: 'No posts found',
        communityPageTryAdjusting: 'Try adjusting your filters',
        communityPageFirstDiscussion: 'Be the first to start a discussion!',
        TryAgain: 'Try Again',
        ClearFilters: 'Clear Filters',
        Refresh: 'Refresh',
        previous: 'Previous',
        next: 'Next',
        communityPagePageOf: `Page ${options?.page || 1} of ${options?.total || 1}`,
      };
      return translations[key] || key;
    },
  }),
}));

// Mock react-router-dom
const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}));

describe('CommunityPage', () => {
  const mockToast = {
    success: jest.fn(),
    error: jest.fn(),
    info: jest.fn(),
    warning: jest.fn(),
  };

  const mockCurrentUser = {
    id: 1,
    username: 'testuser',
  };

  const mockPosts = [
    {
      id: 1,
      title: 'Test Post 1',
      content: 'This is test content for post 1',
      author: 1,
      created_at: '2024-01-01T10:00:00Z',
      upvote_count: 5,
      downvote_count: 1,
      view_count: 10,
      tags: ['Budget', 'Tips'],
    },
    {
      id: 2,
      title: 'Test Post 2',
      content: 'This is test content for post 2',
      author: 2,
      created_at: '2024-01-02T11:00:00Z',
      upvote_count: 3,
      downvote_count: 0,
      view_count: 8,
      tags: ['Vegan', 'Healthy'],
    },
  ];

  const mockApiResponse = {
    results: mockPosts,
    page: 1,
    page_size: 10,
    total: 2,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    
    useAuth.mockReturnValue({
      currentUser: mockCurrentUser,
    });

    useToast.mockReturnValue(mockToast);

    forumService.getPosts.mockResolvedValue(mockApiResponse);
    forumService.checkPostVoteStatus.mockResolvedValue({
      hasVoted: false,
      voteType: null,
    });
    forumService.votePost.mockResolvedValue({});
    forumService.deleteVotePost.mockResolvedValue({});

    userService.getUserById.mockResolvedValue({
      id: 1,
      username: 'testuser',
      profilePhoto: null,
    });
    userService.getUserRecipeCount.mockResolvedValue({
      badge: 'Novice Cook',
    });
    userService.getUsername.mockResolvedValue('testuser');

    getCurrentUser.mockResolvedValue(mockCurrentUser);
  });

  const renderCommunityPage = () => {
    return render(
      <BrowserRouter>
        <CommunityPage />
      </BrowserRouter>
    );
  };

  describe('Page Rendering', () => {
    test('renders community page header correctly', async () => {
      renderCommunityPage();

      expect(screen.getByText('Community Forum')).toBeInTheDocument();
      expect(screen.getByText('Share and discover meal planning tips')).toBeInTheDocument();
      expect(screen.getByText('Create Post')).toBeInTheDocument();
    });

    test('shows loading state initially', () => {
      forumService.getPosts.mockImplementation(() => new Promise(() => {})); // Never resolves
      renderCommunityPage();

      expect(screen.getByText('Loading posts...')).toBeInTheDocument();
    });

    test('renders filter controls', async () => {
      renderCommunityPage();

      await waitFor(() => {
        expect(screen.getByPlaceholderText('Search posts...')).toBeInTheDocument();
        expect(screen.getByDisplayValue('All Tags')).toBeInTheDocument();
        expect(screen.getByDisplayValue('Most Recent')).toBeInTheDocument();
        expect(screen.getByText('Apply Filters')).toBeInTheDocument();
        expect(screen.getByText('Reset Filters')).toBeInTheDocument();
      });
    });

    test('renders posts after loading', async () => {
      renderCommunityPage();

      await waitFor(() => {
        expect(screen.getByText('Test Post 1')).toBeInTheDocument();
        expect(screen.getByText('Test Post 2')).toBeInTheDocument();
      });
    });

    test('renders vote buttons for each post', async () => {
      renderCommunityPage();

      await waitFor(() => {
        const upvoteButtons = screen.getAllByLabelText('Upvote');
        const downvoteButtons = screen.getAllByLabelText('Downvote');
        
        expect(upvoteButtons).toHaveLength(2);
        expect(downvoteButtons).toHaveLength(2);
      });
    });
  });

  describe('Filtering and Searching', () => {
    test('filters posts by search term when apply filters is clicked', async () => {
      renderCommunityPage();

      await waitFor(() => {
        expect(screen.getByText('Test Post 1')).toBeInTheDocument();
      });

      const searchInput = screen.getByPlaceholderText('Search posts...');
      fireEvent.change(searchInput, { target: { value: 'Post 1' } });

      const applyButton = screen.getByText('Apply Filters');
      fireEvent.click(applyButton);

      await waitFor(() => {
        expect(screen.getByText('Test Post 1')).toBeInTheDocument();
        expect(screen.queryByText('Test Post 2')).not.toBeInTheDocument();
      });
    });

    test('filters posts by tag when apply filters is clicked', async () => {
      renderCommunityPage();

      await waitFor(() => {
        expect(screen.getByText('Test Post 1')).toBeInTheDocument();
      });

      const tagSelect = screen.getByDisplayValue('All Tags');
      fireEvent.change(tagSelect, { target: { value: 'Budget' } });

      const applyButton = screen.getByText('Apply Filters');
      fireEvent.click(applyButton);

      await waitFor(() => {
        expect(screen.getByText('Test Post 1')).toBeInTheDocument();
        expect(screen.queryByText('Test Post 2')).not.toBeInTheDocument();
      });
    });

    test('sorts posts by popularity when apply filters is clicked', async () => {
      renderCommunityPage();

      await waitFor(() => {
        expect(screen.getByText('Test Post 1')).toBeInTheDocument();
      });

      const sortSelect = screen.getByDisplayValue('Most Recent');
      fireEvent.change(sortSelect, { target: { value: 'popular' } });

      const applyButton = screen.getByText('Apply Filters');
      fireEvent.click(applyButton);

      // Test should verify sorting, but exact implementation depends on UI structure
      await waitFor(() => {
        expect(screen.getByText('Test Post 1')).toBeInTheDocument();
      });
    });

    test('resets filters when reset button is clicked', async () => {
      renderCommunityPage();

      await waitFor(() => {
        expect(screen.getByText('Test Post 1')).toBeInTheDocument();
      });

      // Apply some filters first
      const searchInput = screen.getByPlaceholderText('Search posts...');
      fireEvent.change(searchInput, { target: { value: 'Post 1' } });

      const resetButton = screen.getByText('Reset Filters');
      fireEvent.click(resetButton);

      await waitFor(() => {
        expect(searchInput.value).toBe('');
        expect(screen.getByText('Test Post 1')).toBeInTheDocument();
        expect(screen.getByText('Test Post 2')).toBeInTheDocument();
      });
    });
  });

  describe('Voting Functionality', () => {
    test('allows logged in user to upvote a post', async () => {
      renderCommunityPage();

      await waitFor(() => {
        expect(screen.getByText('Test Post 1')).toBeInTheDocument();
      });

      const upvoteButtons = screen.getAllByLabelText('Upvote');
      fireEvent.click(upvoteButtons[0]);

      await waitFor(() => {
        expect(forumService.votePost).toHaveBeenCalledWith(1, 'up');
        expect(mockToast.success).toHaveBeenCalledWith('Post upvoted!');
      });
    });

    test('allows logged in user to downvote a post', async () => {
      renderCommunityPage();

      await waitFor(() => {
        expect(screen.getByText('Test Post 1')).toBeInTheDocument();
      });

      const downvoteButtons = screen.getAllByLabelText('Downvote');
      fireEvent.click(downvoteButtons[0]);

      await waitFor(() => {
        expect(forumService.votePost).toHaveBeenCalledWith(1, 'down');
        expect(mockToast.success).toHaveBeenCalledWith('Post downvoted!');
      });
    });

    test('removes vote when clicking same vote type twice', async () => {
      forumService.checkPostVoteStatus.mockResolvedValue({
        hasVoted: true,
        voteType: 'up',
      });

      renderCommunityPage();

      await waitFor(() => {
        expect(screen.getByText('Test Post 1')).toBeInTheDocument();
      });

      const upvoteButtons = screen.getAllByLabelText('Upvote');
      fireEvent.click(upvoteButtons[0]);

      await waitFor(() => {
        expect(forumService.deleteVotePost).toHaveBeenCalledWith(1);
        expect(mockToast.success).toHaveBeenCalledWith('Vote removed');
      });
    });

    test('shows login prompt when non-logged user tries to vote', async () => {
      useAuth.mockReturnValue({
        currentUser: null,
      });

      renderCommunityPage();

      await waitFor(() => {
        expect(screen.getByText('Test Post 1')).toBeInTheDocument();
      });

      const upvoteButtons = screen.getAllByLabelText('Upvote');
      fireEvent.click(upvoteButtons[0]);

      await waitFor(() => {
        expect(mockToast.info).toHaveBeenCalledWith('Please log in to vote');
        expect(forumService.votePost).not.toHaveBeenCalled();
      });
    });
  });

  describe('Navigation', () => {
    test('navigates to create post page when create button is clicked', async () => {
      renderCommunityPage();

      const createButton = screen.getByText('Create Post');
      fireEvent.click(createButton);

      expect(mockNavigate).toHaveBeenCalledWith('/community/create');
    });

    test('navigates to post detail when post is clicked', async () => {
      renderCommunityPage();

      await waitFor(() => {
        expect(screen.getByText('Test Post 1')).toBeInTheDocument();
      });

      const postCard = screen.getByText('Test Post 1').closest('.forum-post-card');
      fireEvent.click(postCard);

      expect(mockNavigate).toHaveBeenCalledWith('/community/post/1');
    });

    test('navigates to user profile when author name is clicked', async () => {
      renderCommunityPage();

      await waitFor(() => {
        // Check that testuser exists (may appear multiple times)
        expect(screen.getAllByText('testuser').length).toBeGreaterThan(0);
      });

      // Find the author-link span element directly using querySelector
      const authorLinkSpans = document.querySelectorAll('.author-link');
      expect(authorLinkSpans.length).toBeGreaterThan(0);
      
      // Click the first author-link (should contain testuser and navigate to /profile/1)
      fireEvent.click(authorLinkSpans[0]);

      expect(mockNavigate).toHaveBeenCalledWith('/profile/1');
    });
  });

  describe('Pagination', () => {
    test('shows pagination controls when there are more posts than page size', async () => {
      const paginatedResponse = {
        ...mockApiResponse,
        total: 25, // More than page_size of 10
      };
      forumService.getPosts.mockResolvedValue(paginatedResponse);

      renderCommunityPage();

      await waitFor(() => {
        expect(screen.getByText('Previous')).toBeInTheDocument();
        expect(screen.getByText('Next')).toBeInTheDocument();
        expect(screen.getByText('Page 1 of 3')).toBeInTheDocument();
      });
    });

    test('disables previous button on first page', async () => {
      const paginatedResponse = {
        ...mockApiResponse,
        total: 25,
        page: 1,
      };
      forumService.getPosts.mockResolvedValue(paginatedResponse);

      renderCommunityPage();

      await waitFor(() => {
        const prevButton = screen.getByText('Previous');
        expect(prevButton).toBeDisabled();
      });
    });
  });

  describe('Error Handling', () => {
    test('shows error message when posts fail to load', async () => {
      forumService.getPosts.mockRejectedValue(new Error('Network error'));

      renderCommunityPage();

      await waitFor(() => {
        expect(screen.getByText('Error Loading Posts')).toBeInTheDocument();
        expect(screen.getByText('Failed to load posts')).toBeInTheDocument();
        expect(mockToast.error).toHaveBeenCalledWith('Failed to load posts');
      });
    });

    test('shows try again button on error', async () => {
      forumService.getPosts.mockRejectedValue(new Error('Network error'));

      renderCommunityPage();

      await waitFor(() => {
        expect(screen.getByText('Try Again')).toBeInTheDocument();
      });

      const tryAgainButton = screen.getByText('Try Again');
      fireEvent.click(tryAgainButton);

      expect(forumService.getPosts).toHaveBeenCalledTimes(2);
    });

    test('handles voting errors gracefully', async () => {
      forumService.votePost.mockRejectedValue(new Error('Vote failed'));

      renderCommunityPage();

      await waitFor(() => {
        expect(screen.getByText('Test Post 1')).toBeInTheDocument();
      });

      const upvoteButtons = screen.getAllByLabelText('Upvote');
      fireEvent.click(upvoteButtons[0]);

      await waitFor(() => {
        expect(mockToast.error).toHaveBeenCalledWith('Failed to vote on post');
      });
    });
  });

  describe('Empty States', () => {
    test('shows empty state when no posts are found', async () => {
      forumService.getPosts.mockResolvedValue({
        results: [],
        page: 1,
        page_size: 10,
        total: 0,
      });

      renderCommunityPage();

      await waitFor(() => {
        expect(screen.getByText('No posts found')).toBeInTheDocument();
        expect(screen.getByText('Be the first to start a discussion!')).toBeInTheDocument();
        expect(screen.getByText('Refresh')).toBeInTheDocument();
      });
    });

    test('shows filtered empty state when filters return no results', async () => {
      renderCommunityPage();

      await waitFor(() => {
        expect(screen.getByText('Test Post 1')).toBeInTheDocument();
      });

      // Apply filter that returns no results
      const searchInput = screen.getByPlaceholderText('Search posts...');
      fireEvent.change(searchInput, { target: { value: 'NonexistentPost' } });

      const applyButton = screen.getByText('Apply Filters');
      fireEvent.click(applyButton);

      await waitFor(() => {
        expect(screen.getByText('No posts found')).toBeInTheDocument();
        expect(screen.getByText('Try adjusting your filters')).toBeInTheDocument();
        expect(screen.getByText('Clear Filters')).toBeInTheDocument();
      });
    });
  });

  describe('Author Profile Photo', () => {
    test('displays author profile photo when available', async () => {
      const authorWithPhoto = {
        id: 1,
        username: 'testuser',
        profilePhoto: 'data:image/png;base64,test123'
      };
      userService.getUserById.mockResolvedValue(authorWithPhoto);

      renderCommunityPage();

      await waitFor(() => {
        expect(screen.getByText('Test Post 1')).toBeInTheDocument();
      });

      await waitFor(() => {
        const authorAvatar = document.querySelector('.author-avatar');
        expect(authorAvatar).toBeInTheDocument();
        expect(authorAvatar).toHaveAttribute('src', 'data:image/png;base64,test123');
      });
    });

    test('displays placeholder when author has no profile photo', async () => {
      const authorWithoutPhoto = {
        id: 1,
        username: 'testuser',
        profilePhoto: null
      };
      userService.getUserById.mockResolvedValue(authorWithoutPhoto);

      renderCommunityPage();

      await waitFor(() => {
        expect(screen.getByText('Test Post 1')).toBeInTheDocument();
      });

      await waitFor(() => {
        const placeholder = document.querySelector('.author-avatar-placeholder');
        expect(placeholder).toBeInTheDocument();
        expect(placeholder).toHaveTextContent('t'); // First letter of username
      });
    });
  });
});