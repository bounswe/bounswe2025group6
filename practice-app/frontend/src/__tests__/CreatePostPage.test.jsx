import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import CreatePostPage from '../pages/community/CreatePostPage';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../components/ui/Toast';
import forumService from '../services/forumService';

// Mock dependencies
jest.mock('../contexts/AuthContext');
jest.mock('../components/ui/Toast');
jest.mock('../services/forumService');

// Mock i18n
jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key, options) => {
      const translations = {
        createPostPageCreatePostTitle: 'Create New Post',
        createPostPageTitle: 'Create New Post',
        createPostPageSubTitle: 'Share your thoughts with the community',
        Title: 'Title',
        Content: 'Content',
        createPostPoageAllowComments: 'Allow comments on this post',
        createPostPageTags: 'Tags (select up to 5)',
        createPostPageCancel: 'Cancel',
        createPostPagePost: 'Post',
        createPostPagePosting: 'Posting...',
        createPostPageTitlePlaceholder: 'Enter your post title...',
        createPostPageContentPlaceholder: 'Share your thoughts, tips, or questions...',
        createPostPageCharacterCount: `${options?.count || 0}/100 characters`,
        createPostPageTagsCount: `${options?.count || 0}/5 tags selected`,
        createPostPageMaxTags: 'You can select a maximum of 5 tags',
        createPostPagePleaseLogIn: 'Please log in to create a post',
        createPostPageEnterTitle: 'Please enter a title',
        createPostPageEnterContent: 'Please enter content',
        createPostPageSelectTag: 'Please select at least one tag',
        createPostPageSuccess: 'Post created successfully!',
        createPostPageFailedWithError: `Failed to create post: ${options?.error || 'Unknown error'}`,
        createPostPageFailedGeneric: 'Failed to create post. Please try again.',
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

describe('CreatePostPage', () => {
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

  beforeEach(() => {
    jest.clearAllMocks();
    
    useAuth.mockReturnValue({
      currentUser: mockCurrentUser,
    });

    useToast.mockReturnValue(mockToast);

    forumService.createPost.mockResolvedValue({
      id: 1,
      title: 'Test Post',
      content: 'Test content',
    });
  });

  const renderCreatePostPage = () => {
    return render(
      <BrowserRouter>
        <CreatePostPage />
      </BrowserRouter>
    );
  };

  describe('Page Rendering', () => {
    test('renders create post form correctly', () => {
      renderCreatePostPage();

      expect(screen.getByText('Create New Post')).toBeInTheDocument();
      expect(screen.getByText('Share your thoughts with the community')).toBeInTheDocument();
      expect(screen.getByLabelText(/title/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/content/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/allow comments/i)).toBeInTheDocument();
      expect(screen.getByText('Tags (select up to 5)')).toBeInTheDocument();
    });

    test('renders all available tags as buttons', () => {
      renderCreatePostPage();

      const expectedTags = [
        'Budget', 'Meal Prep', 'Family', 'No Waste', 'Sustainability', 
        'Tips', 'Gluten Free', 'Vegan', 'Vegetarian', 'Quick',
        'Healthy', 'Student', 'Nutrition', 'Healthy Eating', 'Snacks'
      ];

      expectedTags.forEach(tag => {
        expect(screen.getByText(tag)).toBeInTheDocument();
      });
    });

    test('renders form action buttons', () => {
      renderCreatePostPage();

      expect(screen.getByText('Cancel')).toBeInTheDocument();
      expect(screen.getByText('Post')).toBeInTheDocument();
    });

    test('shows character count for title', () => {
      renderCreatePostPage();

      expect(screen.getByText('0/100 characters')).toBeInTheDocument();
    });

    test('shows tag count', () => {
      renderCreatePostPage();

      expect(screen.getByText('0/5 tags selected')).toBeInTheDocument();
    });
  });

  describe('Form Input Handling', () => {
    test('updates title field correctly', () => {
      renderCreatePostPage();

      const titleInput = screen.getByLabelText(/title/i);
      fireEvent.change(titleInput, { target: { value: 'Test Title' } });

      expect(titleInput.value).toBe('Test Title');
    });

    test('updates content field correctly', () => {
      renderCreatePostPage();

      const contentInput = screen.getByLabelText(/content/i);
      fireEvent.change(contentInput, { target: { value: 'Test content' } });

      expect(contentInput.value).toBe('Test content');
    });

    test('toggles comments checkbox correctly', () => {
      renderCreatePostPage();

      const commentsCheckbox = screen.getByLabelText(/allow comments/i);
      expect(commentsCheckbox).toBeChecked(); // Should be checked by default

      fireEvent.click(commentsCheckbox);
      expect(commentsCheckbox).not.toBeChecked();

      fireEvent.click(commentsCheckbox);
      expect(commentsCheckbox).toBeChecked();
    });

    test('updates character count when typing title', () => {
      renderCreatePostPage();

      const titleInput = screen.getByLabelText(/title/i);
      fireEvent.change(titleInput, { target: { value: 'Hello' } });

      expect(screen.getByText('5/100 characters')).toBeInTheDocument();
    });
  });

  describe('Tag Selection', () => {
    test('allows selecting tags', () => {
      renderCreatePostPage();

      const budgetTag = screen.getByText('Budget');
      fireEvent.click(budgetTag);

      expect(budgetTag).toHaveClass('selected');
      expect(screen.getByText('1/5 tags selected')).toBeInTheDocument();
    });

    test('allows deselecting tags', () => {
      renderCreatePostPage();

      const budgetTag = screen.getByText('Budget');
      fireEvent.click(budgetTag); // Select
      fireEvent.click(budgetTag); // Deselect

      expect(budgetTag).not.toHaveClass('selected');
      expect(screen.getByText('0/5 tags selected')).toBeInTheDocument();
    });

    test('allows selecting multiple tags', () => {
      renderCreatePostPage();

      const budgetTag = screen.getByText('Budget');
      const tipsTag = screen.getByText('Tips');

      fireEvent.click(budgetTag);
      fireEvent.click(tipsTag);

      expect(budgetTag).toHaveClass('selected');
      expect(tipsTag).toHaveClass('selected');
      expect(screen.getByText('2/5 tags selected')).toBeInTheDocument();
    });

    test('prevents selecting more than 5 tags', () => {
      renderCreatePostPage();

      const tags = ['Budget', 'Tips', 'Vegan', 'Quick', 'Healthy', 'Student'];
      
      // Select 5 tags
      tags.slice(0, 5).forEach(tag => {
        fireEvent.click(screen.getByText(tag));
      });

      expect(screen.getByText('5/5 tags selected')).toBeInTheDocument();

      // Try to select 6th tag
      fireEvent.click(screen.getByText('Student'));

      expect(screen.getByText('Student')).not.toHaveClass('selected');
      expect(mockToast.info).toHaveBeenCalledWith('You can select a maximum of 5 tags');
    });
  });

  describe('Form Validation', () => {
    test('validates required title field', async () => {
      renderCreatePostPage();

      const titleInput = screen.getByLabelText(/title/i);
      // Trigger validation by blurring the field
      fireEvent.blur(titleInput);
      
      const submitButton = screen.getByText('Post');
      // Get the form element and submit it directly to bypass HTML5 validation
      const form = titleInput.closest('form');
      fireEvent.submit(form);

      await waitFor(() => {
        expect(mockToast.warning).toHaveBeenCalledWith('Please enter a title');
        expect(forumService.createPost).not.toHaveBeenCalled();
      });
    });

    test('validates required content field', async () => {
      renderCreatePostPage();

      const titleInput = screen.getByLabelText(/title/i);
      fireEvent.change(titleInput, { target: { value: 'Test Title' } });
      
      const contentInput = screen.getByLabelText(/content/i);
      fireEvent.blur(contentInput);

      const submitButton = screen.getByText('Post');
      const form = titleInput.closest('form');
      fireEvent.submit(form);

      await waitFor(() => {
        expect(mockToast.warning).toHaveBeenCalledWith('Please enter content');
        expect(forumService.createPost).not.toHaveBeenCalled();
      });
    });

    test('validates at least one tag is selected', async () => {
      renderCreatePostPage();

      const titleInput = screen.getByLabelText(/title/i);
      const contentInput = screen.getByLabelText(/content/i);

      fireEvent.change(titleInput, { target: { value: 'Test Title' } });
      fireEvent.change(contentInput, { target: { value: 'Test content' } });

      const submitButton = screen.getByText('Post');
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(mockToast.warning).toHaveBeenCalledWith('Please select at least one tag');
        expect(forumService.createPost).not.toHaveBeenCalled();
      });
    });

    test('validates whitespace-only title', async () => {
      renderCreatePostPage();

      const titleInput = screen.getByLabelText(/title/i);
      fireEvent.change(titleInput, { target: { value: '   ' } });
      fireEvent.blur(titleInput);

      const submitButton = screen.getByText('Post');
      const form = titleInput.closest('form');
      fireEvent.submit(form);

      await waitFor(() => {
        expect(mockToast.warning).toHaveBeenCalledWith('Please enter a title');
      });
    });

    test('validates whitespace-only content', async () => {
      renderCreatePostPage();

      const titleInput = screen.getByLabelText(/title/i);
      const contentInput = screen.getByLabelText(/content/i);

      fireEvent.change(titleInput, { target: { value: 'Test Title' } });
      fireEvent.change(contentInput, { target: { value: '   ' } });

      const submitButton = screen.getByText('Post');
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(mockToast.warning).toHaveBeenCalledWith('Please enter content');
      });
    });
  });

  describe('Form Submission', () => {
    test('submits form with valid data', async () => {
      renderCreatePostPage();

      const titleInput = screen.getByLabelText(/title/i);
      const contentInput = screen.getByLabelText(/content/i);

      fireEvent.change(titleInput, { target: { value: 'Test Title' } });
      fireEvent.change(contentInput, { target: { value: 'Test content' } });
      fireEvent.click(screen.getByText('Budget')); // Select a tag

      const submitButton = screen.getByText('Post');
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(forumService.createPost).toHaveBeenCalledWith({
          title: 'Test Title',
          content: 'Test content',
          is_commentable: true,
          tags: ['Budget'],
        });
      });
    });

    test('shows success message and navigates on successful submission', async () => {
      forumService.createPost.mockResolvedValue({ id: 123 });
      renderCreatePostPage();

      const titleInput = screen.getByLabelText(/title/i);
      const contentInput = screen.getByLabelText(/content/i);

      fireEvent.change(titleInput, { target: { value: 'Test Title' } });
      fireEvent.change(contentInput, { target: { value: 'Test content' } });
      fireEvent.click(screen.getByText('Budget'));

      const submitButton = screen.getByText('Post');
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(mockToast.success).toHaveBeenCalledWith('Post created successfully!');
        expect(mockNavigate).toHaveBeenCalledWith('/community/post/123');
      });
    });

    test('shows loading state while submitting', async () => {
      let resolvePromise;
      forumService.createPost.mockReturnValue(new Promise(resolve => {
        resolvePromise = resolve;
      }));

      renderCreatePostPage();

      const titleInput = screen.getByLabelText(/title/i);
      const contentInput = screen.getByLabelText(/content/i);

      fireEvent.change(titleInput, { target: { value: 'Test Title' } });
      fireEvent.change(contentInput, { target: { value: 'Test content' } });
      fireEvent.click(screen.getByText('Budget'));

      const submitButton = screen.getByText('Post');
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('Posting...')).toBeInTheDocument();
        expect(submitButton).toBeDisabled();
      });

      resolvePromise({ id: 123 });
    });

    test('includes is_commentable setting in submission', async () => {
      renderCreatePostPage();

      const titleInput = screen.getByLabelText(/title/i);
      const contentInput = screen.getByLabelText(/content/i);
      const commentsCheckbox = screen.getByLabelText(/allow comments/i);

      fireEvent.change(titleInput, { target: { value: 'Test Title' } });
      fireEvent.change(contentInput, { target: { value: 'Test content' } });
      fireEvent.click(commentsCheckbox); // Disable comments
      fireEvent.click(screen.getByText('Budget'));

      const submitButton = screen.getByText('Post');
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(forumService.createPost).toHaveBeenCalledWith({
          title: 'Test Title',
          content: 'Test content',
          is_commentable: false,
          tags: ['Budget'],
        });
      });
    });
  });

  describe('Error Handling', () => {
    test('handles submission errors with specific error message', async () => {
      const errorResponse = {
        response: {
          data: {
            title: ['Title is too short'],
            content: ['Content is required']
          }
        }
      };
      forumService.createPost.mockRejectedValue(errorResponse);

      renderCreatePostPage();

      const titleInput = screen.getByLabelText(/title/i);
      const contentInput = screen.getByLabelText(/content/i);

      fireEvent.change(titleInput, { target: { value: 'Test Title' } });
      fireEvent.change(contentInput, { target: { value: 'Test content' } });
      fireEvent.click(screen.getByText('Budget'));

      const submitButton = screen.getByText('Post');
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(mockToast.error).toHaveBeenCalledWith('Failed to create post: Title is too short Content is required');
      });
    });

    test('handles submission errors with generic error message', async () => {
      forumService.createPost.mockRejectedValue(new Error('Network error'));

      renderCreatePostPage();

      const titleInput = screen.getByLabelText(/title/i);
      const contentInput = screen.getByLabelText(/content/i);

      fireEvent.change(titleInput, { target: { value: 'Test Title' } });
      fireEvent.change(contentInput, { target: { value: 'Test content' } });
      fireEvent.click(screen.getByText('Budget'));

      const submitButton = screen.getByText('Post');
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(mockToast.error).toHaveBeenCalledWith('Failed to create post. Please try again.');
      });
    });
  });

  describe('Authentication Handling', () => {
    test('redirects to login when user is not authenticated', async () => {
      useAuth.mockReturnValue({
        currentUser: null,
      });

      renderCreatePostPage();

      const titleInput = screen.getByLabelText(/title/i);
      const contentInput = screen.getByLabelText(/content/i);

      fireEvent.change(titleInput, { target: { value: 'Test Title' } });
      fireEvent.change(contentInput, { target: { value: 'Test content' } });
      fireEvent.click(screen.getByText('Budget'));

      const submitButton = screen.getByText('Post');
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(mockToast.warning).toHaveBeenCalledWith('Please log in to create a post');
        expect(mockNavigate).toHaveBeenCalledWith('/login');
        expect(forumService.createPost).not.toHaveBeenCalled();
      });
    });
  });

  describe('Navigation', () => {
    test('navigates to community page when cancel button is clicked', () => {
      renderCreatePostPage();

      const cancelButton = screen.getByText('Cancel');
      fireEvent.click(cancelButton);

      expect(mockNavigate).toHaveBeenCalledWith('/community');
    });
  });

  describe('Character Limits', () => {
    test('enforces title character limit', () => {
      renderCreatePostPage();

      const titleInput = screen.getByLabelText(/title/i);
      const longTitle = 'a'.repeat(150); // Longer than 100 character limit

      // In test environment, maxLength doesn't prevent input, so we test the attribute exists
      expect(titleInput).toHaveAttribute('maxLength', '100');
      
      // Test that the input accepts the value (maxLength is enforced by browser, not in tests)
      fireEvent.change(titleInput, { target: { value: longTitle } });
      expect(titleInput.value).toBe(longTitle); // In tests, value can exceed maxLength
    });
  });
});