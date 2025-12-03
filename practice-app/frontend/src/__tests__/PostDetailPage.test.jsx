import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import PostDetailPage from '../pages/community/PostDetailPage';
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
    t: (key) => {
      const translations = {
        editPostPageisLoading: 'Loading',
        postDetailPagePostNotFound: 'Post not found',
        postDetailPageBackToForum: 'Back to Forum',
        postDetailPagePostedBy: 'Posted by',
        Edit: 'Edit',
        Delete: 'Delete',
        Views: 'views',
        Comments: 'Comments',
        commentFormPlaceholder: 'Write your comment...',
        commentFormPosting: 'Posting...',
        commentFormPostButton: 'Post Comment',
        Please: 'Please',
        homePageLogin: 'log in',
        postDetailPageToComment: 'to comment',
        loading: 'Loading',
        postDetailPageCommentBy: 'Comment by',
        postDetailPageNoComments: 'No comments yet. Be the first to comment!',
        postDetailPageDisabledComments: 'Comments are disabled for this post.',
        previous: 'Previous',
        next: 'Next',
        sharePost: 'Share Post',
        createPostPageTags: 'Tags',
        'createPost.tags.budget': 'Budget',
        'createPost.tags.tips': 'Tips',
        shareLink: 'View at',
        shareCopied: 'Link copied to clipboard!',
        shareError: 'Failed to share. Please try again.',
      };
      return translations[key] || key;
    },
  }),
}));

// Mock react-router-dom with useParams
const mockNavigate = jest.fn();
const mockParams = { id: '1' };
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
  useParams: () => mockParams,
  Link: ({ children, to }) => <a href={to}>{children}</a>,
}));

describe('PostDetailPage', () => {
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

  const mockPost = {
    id: 1,
    title: 'Test Post Title',
    content: 'This is test post content',
    author: 1,
    created_at: '2024-01-01T10:00:00Z',
    upvote_count: 5,
    downvote_count: 1,
    view_count: 10,
    tags: ['Budget', 'Tips'],
    is_commentable: true,
  };

  const mockComments = [
    {
      id: 1,
      content: 'This is a test comment',
      author: 2,
      created_at: '2024-01-01T11:00:00Z',
      upvote_count: 2,
      downvote_count: 0,
      userVote: { hasVoted: false, voteType: null },
    },
    {
      id: 2,
      content: 'Another test comment',
      author: 1,
      created_at: '2024-01-01T12:00:00Z',
      upvote_count: 1,
      downvote_count: 0,
      userVote: { hasVoted: true, voteType: 'up' },
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    
    useAuth.mockReturnValue({
      currentUser: mockCurrentUser,
    });

    useToast.mockReturnValue(mockToast);

    forumService.getPostById.mockResolvedValue(mockPost);
    forumService.getCommentsByPostId.mockResolvedValue({
      results: mockComments,
      page: 1,
      page_size: 10,
      total: 2,
    });
    forumService.checkPostVoteStatus.mockResolvedValue({
      hasVoted: false,
      voteType: null,
    });
    forumService.checkCommentVoteStatus.mockResolvedValue({
      hasVoted: false,
      voteType: null,
    });
    forumService.votePost.mockResolvedValue({});
    forumService.voteComment.mockResolvedValue({});
    forumService.deleteVotePost.mockResolvedValue({});
    forumService.deleteVoteComment.mockResolvedValue({});
    forumService.createComment.mockResolvedValue({});
    forumService.deleteComment.mockResolvedValue({});
    forumService.deletePost.mockResolvedValue({});

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

  const renderPostDetailPage = () => {
    return render(
      <BrowserRouter>
        <PostDetailPage />
      </BrowserRouter>
    );
  };

  describe('Page Rendering', () => {
    test('renders post details correctly', async () => {
      renderPostDetailPage();

      await waitFor(() => {
        expect(screen.getByText('Test Post Title')).toBeInTheDocument();
        expect(screen.getByText('This is test post content')).toBeInTheDocument();
        expect(screen.getByText('Posted by')).toBeInTheDocument();
        expect(screen.getByText('testuser')).toBeInTheDocument();
      });
    });

    test('shows loading state initially', () => {
      forumService.getPostById.mockImplementation(() => new Promise(() => {})); // Never resolves
      renderPostDetailPage();

      expect(screen.getByText('Loading...')).toBeInTheDocument();
    });

    test('renders vote buttons for post', async () => {
      renderPostDetailPage();

      await waitFor(() => {
        expect(screen.getByLabelText('Upvote')).toBeInTheDocument();
        expect(screen.getByLabelText('Downvote')).toBeInTheDocument();
      });
    });

    test('renders post tags', async () => {
      renderPostDetailPage();

      await waitFor(() => {
        expect(screen.getByText('#Budget')).toBeInTheDocument();
        expect(screen.getByText('#Tips')).toBeInTheDocument();
      });
    });

    test('renders back to forum button', async () => {
      renderPostDetailPage();

      await waitFor(() => {
        expect(screen.getByText('Back to Forum')).toBeInTheDocument();
      });
    });

    test('shows edit and delete buttons for post owner', async () => {
      renderPostDetailPage();

      await waitFor(() => {
        expect(screen.getByText('Edit')).toBeInTheDocument();
        expect(screen.getByText('Delete')).toBeInTheDocument();
      });
    });

    test('hides edit and delete buttons for non-owner', async () => {
      useAuth.mockReturnValue({
        currentUser: { id: 2, username: 'otheruser' },
      });

      renderPostDetailPage();

      await waitFor(() => {
        expect(screen.getByText('Test Post Title')).toBeInTheDocument();
      });

      expect(screen.queryByText('Edit')).not.toBeInTheDocument();
      expect(screen.queryByText('Delete')).not.toBeInTheDocument();
    });
  });

  describe('Post Voting', () => {
    test('allows logged in user to upvote post', async () => {
      renderPostDetailPage();

      await waitFor(() => {
        expect(screen.getByText('Test Post Title')).toBeInTheDocument();
      });

      const upvoteButton = screen.getByLabelText('Upvote');
      fireEvent.click(upvoteButton);

      await waitFor(() => {
        expect(forumService.votePost).toHaveBeenCalledWith('1', 'up');
        expect(mockToast.success).toHaveBeenCalledWith('Post upvoted');
      });
    });

    test('allows logged in user to downvote post', async () => {
      renderPostDetailPage();

      await waitFor(() => {
        expect(screen.getByText('Test Post Title')).toBeInTheDocument();
      });

      const downvoteButton = screen.getByLabelText('Downvote');
      fireEvent.click(downvoteButton);

      await waitFor(() => {
        expect(forumService.votePost).toHaveBeenCalledWith('1', 'down');
        expect(mockToast.success).toHaveBeenCalledWith('Post downvoted');
      });
    });

    test('removes vote when clicking same vote type twice', async () => {
      forumService.checkPostVoteStatus.mockResolvedValue({
        hasVoted: true,
        voteType: 'up',
      });

      renderPostDetailPage();

      await waitFor(() => {
        expect(screen.getByText('Test Post Title')).toBeInTheDocument();
      });

      const upvoteButton = screen.getByLabelText('Upvote');
      fireEvent.click(upvoteButton);

      await waitFor(() => {
        expect(forumService.deleteVotePost).toHaveBeenCalledWith('1');
        expect(mockToast.success).toHaveBeenCalledWith('Vote removed');
      });
    });

    test('prompts login for non-authenticated users', async () => {
      useAuth.mockReturnValue({
        currentUser: null,
      });

      renderPostDetailPage();

      await waitFor(() => {
        expect(screen.getByText('Test Post Title')).toBeInTheDocument();
      });

      const upvoteButton = screen.getByLabelText('Upvote');
      fireEvent.click(upvoteButton);

      await waitFor(() => {
        expect(mockToast.info).toHaveBeenCalledWith('Please log in to vote');
        expect(forumService.votePost).not.toHaveBeenCalled();
      });
    });
  });

  describe('Comments Section', () => {
    test('renders comment form for logged in users', async () => {
      renderPostDetailPage();

      await waitFor(() => {
        expect(screen.getByPlaceholderText('Write your comment...')).toBeInTheDocument();
        expect(screen.getByText('Post Comment')).toBeInTheDocument();
      });
    });

    test('shows login prompt for comment form when not logged in', async () => {
      useAuth.mockReturnValue({
        currentUser: null,
      });

      renderPostDetailPage();

      await waitFor(() => {
        // The login prompt text is split across elements, check for the link and combined text
        expect(screen.getByText('log in')).toBeInTheDocument();
        // Check that the login prompt container exists
        const loginPrompt = screen.getByText('log in').closest('.login-to-comment');
        expect(loginPrompt).toBeInTheDocument();
      });
    });

    test('renders existing comments', async () => {
      renderPostDetailPage();

      await waitFor(() => {
        expect(screen.getByText('This is a test comment')).toBeInTheDocument();
        expect(screen.getByText('Another test comment')).toBeInTheDocument();
      });
    });

    test('allows submitting new comment', async () => {
      renderPostDetailPage();

      await waitFor(() => {
        expect(screen.getByPlaceholderText('Write your comment...')).toBeInTheDocument();
      });

      const commentTextarea = screen.getByPlaceholderText('Write your comment...');
      const submitButton = screen.getByText('Post Comment');

      fireEvent.change(commentTextarea, { target: { value: 'New comment' } });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(forumService.createComment).toHaveBeenCalledWith('1', 'New comment');
        expect(mockToast.success).toHaveBeenCalledWith('Comment added successfully');
      });
    });

    test('validates comment content before submission', async () => {
      renderPostDetailPage();

      await waitFor(() => {
        expect(screen.getByPlaceholderText('Write your comment...')).toBeInTheDocument();
      });

      const commentTextarea = screen.getByPlaceholderText('Write your comment...');
      const form = commentTextarea.closest('form');
      
      // Submit form with empty comment
      fireEvent.submit(form);

      await waitFor(() => {
        expect(mockToast.warning).toHaveBeenCalledWith('Comment cannot be empty');
        expect(forumService.createComment).not.toHaveBeenCalled();
      });
    });

    test('shows delete button for own comments', async () => {
      renderPostDetailPage();

      await waitFor(() => {
        // Should show delete button for comment authored by current user (id: 1)
        const deleteButtons = screen.getAllByText('Delete');
        expect(deleteButtons.length).toBeGreaterThan(1); // Post delete + comment delete
      });
    });
  });

  describe('Comment Voting', () => {
    test('allows voting on comments', async () => {
      renderPostDetailPage();

      await waitFor(() => {
        expect(screen.getByText('This is a test comment')).toBeInTheDocument();
      });

      // Get all upvote buttons (post + comments)
      const upvoteButtons = screen.getAllByLabelText('Upvote');
      const commentUpvoteButton = upvoteButtons[1]; // First is post, second is first comment

      fireEvent.click(commentUpvoteButton);

      await waitFor(() => {
        expect(forumService.voteComment).toHaveBeenCalledWith(1, 'up');
        expect(mockToast.success).toHaveBeenCalledWith('Comment upvoted');
      });
    });
  });

  describe('Post Actions', () => {
    test('allows editing own post', async () => {
      renderPostDetailPage();

      await waitFor(() => {
        expect(screen.getByText('Edit')).toBeInTheDocument();
      });

      const editButton = screen.getByText('Edit');
      fireEvent.click(editButton);

      expect(mockNavigate).toHaveBeenCalledWith('/community/edit/1');
    });

    test('allows deleting own post with confirmation', async () => {
      window.confirm = jest.fn(() => true);

      renderPostDetailPage();

      await waitFor(() => {
        expect(screen.getByText('Delete')).toBeInTheDocument();
      });

      const deleteButton = screen.getByText('Delete');
      fireEvent.click(deleteButton);

      await waitFor(() => {
        expect(window.confirm).toHaveBeenCalledWith('Are you sure you want to delete this post?');
        expect(forumService.deletePost).toHaveBeenCalledWith('1');
        expect(mockToast.success).toHaveBeenCalledWith('Post deleted');
        expect(mockNavigate).toHaveBeenCalledWith('/community');
      });
    });

    test('cancels deletion when not confirmed', async () => {
      window.confirm = jest.fn(() => false);

      renderPostDetailPage();

      await waitFor(() => {
        expect(screen.getByText('Delete')).toBeInTheDocument();
      });

      const deleteButton = screen.getByText('Delete');
      fireEvent.click(deleteButton);

      expect(window.confirm).toHaveBeenCalledWith('Are you sure you want to delete this post?');
      expect(forumService.deletePost).not.toHaveBeenCalled();
    });
  });

  describe('Share Functionality', () => {
    beforeEach(() => {
      // Mock Web Share API
      global.navigator.share = jest.fn();
      global.navigator.canShare = jest.fn(() => true);
    });

    test('renders share button for post', async () => {
      useAuth.mockReturnValue({ currentUser: mockCurrentUser });
      forumService.getPostById.mockResolvedValue(mockPost);
      forumService.checkPostVoteStatus.mockResolvedValue({ hasVoted: false, voteType: null });
      forumService.getCommentsByPostId.mockResolvedValue({ results: [], total: 0 });

      render(
        <BrowserRouter>
          <PostDetailPage />
        </BrowserRouter>
      );

      await waitFor(() => {
        expect(screen.getByTitle('Share Post')).toBeInTheDocument();
      });
    });

    test('shares post using Web Share API when available', async () => {
      global.navigator.share.mockResolvedValue();
      useAuth.mockReturnValue({ currentUser: mockCurrentUser });
      forumService.getPostById.mockResolvedValue(mockPost);
      forumService.checkPostVoteStatus.mockResolvedValue({ hasVoted: false, voteType: null });
      forumService.getCommentsByPostId.mockResolvedValue({ results: [], total: 0 });

      render(
        <BrowserRouter>
          <PostDetailPage />
        </BrowserRouter>
      );

      await waitFor(() => {
        expect(screen.getByTitle('Share Post')).toBeInTheDocument();
      });

      const shareButton = screen.getByTitle('Share Post');
      fireEvent.click(shareButton);

      await waitFor(() => {
        expect(global.navigator.share).toHaveBeenCalledWith(
          expect.objectContaining({
            title: 'Test Post Title',
            text: expect.stringContaining('This is test post content'),
            url: expect.stringContaining('/community/post/1')
          })
        );
      });
    });

    test('falls back to clipboard when Web Share API is not available', async () => {
      delete global.navigator.share;
      const mockClipboard = {
        writeText: jest.fn(() => Promise.resolve()),
      };
      Object.defineProperty(navigator, 'clipboard', { 
        value: mockClipboard,
        writable: true,
        configurable: true
      });

      useAuth.mockReturnValue({ currentUser: mockCurrentUser });
      forumService.getPostById.mockResolvedValue(mockPost);
      forumService.checkPostVoteStatus.mockResolvedValue({ hasVoted: false, voteType: null });
      forumService.getCommentsByPostId.mockResolvedValue({ results: [], total: 0 });

      render(
        <BrowserRouter>
          <PostDetailPage />
        </BrowserRouter>
      );

      await waitFor(() => {
        expect(screen.getByTitle('Share Post')).toBeInTheDocument();
      });

      const shareButton = screen.getByTitle('Share Post');
      fireEvent.click(shareButton);

      await waitFor(() => {
        expect(mockClipboard.writeText).toHaveBeenCalled();
      });
    });

    test('includes post tags in share text', async () => {
      global.navigator.share.mockResolvedValue();
      useAuth.mockReturnValue({ currentUser: mockCurrentUser });
      forumService.getPostById.mockResolvedValue(mockPost);
      forumService.checkPostVoteStatus.mockResolvedValue({ hasVoted: false, voteType: null });
      forumService.getCommentsByPostId.mockResolvedValue({ results: [], total: 0 });

      render(
        <BrowserRouter>
          <PostDetailPage />
        </BrowserRouter>
      );

      await waitFor(() => {
        expect(screen.getByTitle('Share Post')).toBeInTheDocument();
      });

      const shareButton = screen.getByTitle('Share Post');
      fireEvent.click(shareButton);

      await waitFor(() => {
        expect(global.navigator.share).toHaveBeenCalledWith(
          expect.objectContaining({
            text: expect.stringContaining('Tags: Budget, Tips')
          })
        );
      });
    });
  });

  describe('Navigation', () => {
    test('navigates back to community when back button is clicked', async () => {
      renderPostDetailPage();

      await waitFor(() => {
        expect(screen.getByText('Back to Forum')).toBeInTheDocument();
      });

      const backButton = screen.getByText('Back to Forum');
      fireEvent.click(backButton);

      expect(mockNavigate).toHaveBeenCalledWith('/community');
    });

    test('navigates to user profile when author name is clicked', async () => {
      renderPostDetailPage();

      await waitFor(() => {
        expect(screen.getByText('testuser')).toBeInTheDocument();
      });

      const authorLink = screen.getByText('testuser');
      fireEvent.click(authorLink);

      expect(mockNavigate).toHaveBeenCalledWith('/profile/1');
    });
  });

  describe('Error Handling', () => {
    test('shows not found message when post does not exist', async () => {
      forumService.getPostById.mockRejectedValue(new Error('Post not found'));

      renderPostDetailPage();

      await waitFor(() => {
        expect(screen.getByText('Post not found')).toBeInTheDocument();
      });
    });

    test('handles voting errors gracefully', async () => {
      forumService.votePost.mockRejectedValue(new Error('Vote failed'));

      renderPostDetailPage();

      await waitFor(() => {
        expect(screen.getByText('Test Post Title')).toBeInTheDocument();
      });

      const upvoteButton = screen.getByLabelText('Upvote');
      fireEvent.click(upvoteButton);

      await waitFor(() => {
        expect(mockToast.error).toHaveBeenCalledWith('Failed to vote on post');
      });
    });

    test('handles comment submission errors', async () => {
      forumService.createComment.mockRejectedValue(new Error('Comment failed'));

      renderPostDetailPage();

      await waitFor(() => {
        expect(screen.getByPlaceholderText('Write your comment...')).toBeInTheDocument();
      });

      const commentTextarea = screen.getByPlaceholderText('Write your comment...');
      const submitButton = screen.getByText('Post Comment');

      fireEvent.change(commentTextarea, { target: { value: 'New comment' } });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(mockToast.error).toHaveBeenCalledWith('Failed to add comment');
      });
    });

    test('handles disabled comments error', async () => {
      const error = { response: { status: 403 } };
      forumService.createComment.mockRejectedValue(error);

      renderPostDetailPage();

      await waitFor(() => {
        expect(screen.getByPlaceholderText('Write your comment...')).toBeInTheDocument();
      });

      const commentTextarea = screen.getByPlaceholderText('Write your comment...');
      const submitButton = screen.getByText('Post Comment');

      fireEvent.change(commentTextarea, { target: { value: 'New comment' } });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(mockToast.warning).toHaveBeenCalledWith('Comments are disabled for this post');
      });
    });
  });

  describe('Comments Disabled State', () => {
    test('shows comments disabled message when is_commentable is false', async () => {
      forumService.getPostById.mockResolvedValue({
        ...mockPost,
        is_commentable: false,
      });

      renderPostDetailPage();

      await waitFor(() => {
        expect(screen.getByText('Comments are disabled for this post.')).toBeInTheDocument();
      });

      expect(screen.queryByPlaceholderText('Write your comment...')).not.toBeInTheDocument();
    });
  });

  describe('No Comments State', () => {
    test('shows no comments message when there are no comments', async () => {
      forumService.getCommentsByPostId.mockResolvedValue({
        results: [],
        page: 1,
        page_size: 10,
        total: 0,
      });

      renderPostDetailPage();

      await waitFor(() => {
        expect(screen.getByText('No comments yet. Be the first to comment!')).toBeInTheDocument();
      });
    });
  });

  describe('Comment Pagination', () => {
    test('shows pagination when there are more comments than page size', async () => {
      forumService.getCommentsByPostId.mockResolvedValue({
        results: mockComments,
        page: 1,
        page_size: 10,
        total: 25, // More than page_size
      });

      renderPostDetailPage();

      await waitFor(() => {
        expect(screen.getByText('Previous')).toBeInTheDocument();
        expect(screen.getByText('Next')).toBeInTheDocument();
        expect(screen.getByText('Page 1 of 3')).toBeInTheDocument();
      });
    });
  });

  describe('Author Profile Photo', () => {
    test('displays author profile photo for post when available', async () => {
      const authorWithPhoto = {
        id: 1,
        username: 'testuser',
        profilePhoto: 'data:image/png;base64,test123'
      };
      userService.getUserById.mockResolvedValue(authorWithPhoto);

      renderPostDetailPage();

      await waitFor(() => {
        expect(screen.getByText('Test Post Title')).toBeInTheDocument();
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

      renderPostDetailPage();

      await waitFor(() => {
        expect(screen.getByText('Test Post Title')).toBeInTheDocument();
      });

      await waitFor(() => {
        const placeholder = document.querySelector('.author-avatar-placeholder');
        expect(placeholder).toBeInTheDocument();
        expect(placeholder).toHaveTextContent('t'); // First letter of username
      });
    });

    test('displays author profile photo for comments when available', async () => {
      const commentAuthorWithPhoto = {
        id: 2,
        username: 'commentauthor',
        profilePhoto: 'data:image/png;base64,commentphoto'
      };
      
      userService.getUserById.mockImplementation((id) => {
        if (id === 1) {
          return Promise.resolve({ id: 1, username: 'testuser', profilePhoto: null });
        }
        if (id === 2) {
          return Promise.resolve(commentAuthorWithPhoto);
        }
        return Promise.resolve({ id, username: 'user', profilePhoto: null });
      });

      renderPostDetailPage();

      await waitFor(() => {
        expect(screen.getByText('This is a test comment')).toBeInTheDocument();
      });

      await waitFor(() => {
        const commentAvatars = document.querySelectorAll('.author-avatar');
        const commentAvatar = Array.from(commentAvatars).find(avatar => 
          avatar.getAttribute('src') === 'data:image/png;base64,commentphoto'
        );
        expect(commentAvatar).toBeInTheDocument();
      });
    });
  });
});