import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import EditPostPage from '../pages/community/EditPostPage';
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
        editPostPageTitle: 'Edit Post',
        editPostPageSubtitle: 'Update your post content',
        Title: 'Title',
        Content: 'Content',
        createPostPoageAllowComments: 'Allow comments on this post',
        createPostPageTags: 'Tags (select up to 5)',
        Cancel: 'Cancel',
        editPostPageUpdate: 'Update',
        editPostPageUpdating: 'Updating...',
        editPostPageTitlePlaceholder: 'Enter your post title...',
        editPostPageContentPlaceholder: 'Share your thoughts, tips, or questions...',
        createPostPageCharacterCount: `${options?.count || 0}/100 characters`,
        createPostPageTagsCount: `${options?.count || 0}/5 tags selected`,
        editPostPageMaxTags: 'You can select a maximum of 5 tags',
        editPostPagePleaseLogIn: 'Please log in to edit posts',
        createPostPageEnterTitle: 'Please enter a title',
        createPostPageEnterContent: 'Please enter content',
        createPostPageSelectTag: 'Please select at least one tag',
        editPostPageSuccess: 'Post updated successfully!',
        editPostPageFailedWithError: `Failed to update post: ${options?.error || 'Unknown error'}`,
        editPostPageFailedGeneric: 'Failed to update post. Please try again.',
        editPostPageOnlyAuthor: 'You can only edit your own posts',
        editPostPageFailedLoad: 'Failed to load post',
        editPostPageisLoading: 'Loading',
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
}));

describe('EditPostPage', () => {
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
    title: 'Original Post Title',
    content: 'Original post content',
    author: 1,
    is_commentable: true,
    tags: ['Budget', 'Tips'],
  };

  beforeEach(() => {
    jest.clearAllMocks();
    
    useAuth.mockReturnValue({
      currentUser: mockCurrentUser,
    });

    useToast.mockReturnValue(mockToast);

    forumService.getPostById.mockResolvedValue(mockPost);
    forumService.updatePost.mockResolvedValue({});
  });

  const renderEditPostPage = () => {
    return render(
      <BrowserRouter>
        <EditPostPage />
      </BrowserRouter>
    );
  };

  describe('Page Loading', () => {
    test('shows loading state initially', () => {
      forumService.getPostById.mockImplementation(() => new Promise(() => {})); // Never resolves
      renderEditPostPage();

      expect(screen.getByText('Loading')).toBeInTheDocument();
    });

    test('loads and displays post data in form', async () => {
      renderEditPostPage();

      await waitFor(() => {
        expect(screen.getByDisplayValue('Original Post Title')).toBeInTheDocument();
        expect(screen.getByDisplayValue('Original post content')).toBeInTheDocument();
      });

      expect(screen.getByText('Budget')).toHaveClass('selected');
      expect(screen.getByText('Tips')).toHaveClass('selected');
    });

    test('loads comments checkbox state correctly', async () => {
      renderEditPostPage();

      await waitFor(() => {
        const checkbox = screen.getByLabelText(/allow comments/i);
        expect(checkbox).toBeChecked();
      });
    });

    test('redirects non-author users', async () => {
      const differentUserPost = { ...mockPost, author: 2 };
      forumService.getPostById.mockResolvedValue(differentUserPost);

      renderEditPostPage();

      await waitFor(() => {
        expect(mockToast.error).toHaveBeenCalledWith('You can only edit your own posts');
        expect(mockNavigate).toHaveBeenCalledWith('/community/post/1');
      });
    });
  });

  describe('Page Rendering', () => {
    test('renders edit post form correctly', async () => {
      renderEditPostPage();

      await waitFor(() => {
        expect(screen.getByText('Edit Post')).toBeInTheDocument();
        expect(screen.getByText('Update your post content')).toBeInTheDocument();
        expect(screen.getByLabelText(/title/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/content/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/allow comments/i)).toBeInTheDocument();
        expect(screen.getByText('Tags (select up to 5)')).toBeInTheDocument();
      });
    });

    test('renders all available tags as buttons', async () => {
      renderEditPostPage();

      const expectedTags = [
        'Budget', 'Meal Prep', 'Family', 'No Waste', 'Sustainability', 
        'Tips', 'Gluten Free', 'Vegan', 'Vegetarian', 'Quick',
        'Healthy', 'Student', 'Nutrition', 'Healthy Eating', 'Snacks'
      ];

      await waitFor(() => {
        expectedTags.forEach(tag => {
          expect(screen.getByText(tag)).toBeInTheDocument();
        });
      });
    });

    test('renders form action buttons', async () => {
      renderEditPostPage();

      await waitFor(() => {
        expect(screen.getByText('Cancel')).toBeInTheDocument();
        expect(screen.getByText('Update')).toBeInTheDocument();
      });
    });

    test('shows character count for loaded title', async () => {
      renderEditPostPage();

      await waitFor(() => {
        expect(screen.getByText('19/100 characters')).toBeInTheDocument(); // "Original Post Title".length = 19
      });
    });

    test('shows tag count for loaded tags', async () => {
      renderEditPostPage();

      await waitFor(() => {
        expect(screen.getByText('2/5 tags selected')).toBeInTheDocument();
      });
    });
  });

  describe('Form Input Handling', () => {
    test('updates title field correctly', async () => {
      renderEditPostPage();

      await waitFor(() => {
        expect(screen.getByDisplayValue('Original Post Title')).toBeInTheDocument();
      });

      const titleInput = screen.getByLabelText(/title/i);
      fireEvent.change(titleInput, { target: { value: 'Updated Title' } });

      expect(titleInput.value).toBe('Updated Title');
    });

    test('updates content field correctly', async () => {
      renderEditPostPage();

      await waitFor(() => {
        expect(screen.getByDisplayValue('Original post content')).toBeInTheDocument();
      });

      const contentInput = screen.getByLabelText(/content/i);
      fireEvent.change(contentInput, { target: { value: 'Updated content' } });

      expect(contentInput.value).toBe('Updated content');
    });

    test('toggles comments checkbox correctly', async () => {
      renderEditPostPage();

      await waitFor(() => {
        const commentsCheckbox = screen.getByLabelText(/allow comments/i);
        expect(commentsCheckbox).toBeChecked();
        
        fireEvent.click(commentsCheckbox);
        expect(commentsCheckbox).not.toBeChecked();
      });
    });

    test('updates character count when editing title', async () => {
      renderEditPostPage();

      await waitFor(() => {
        expect(screen.getByDisplayValue('Original Post Title')).toBeInTheDocument();
      });

      const titleInput = screen.getByLabelText(/title/i);
      fireEvent.change(titleInput, { target: { value: 'Hello' } });

      await waitFor(() => {
        expect(screen.getByText('5/100 characters')).toBeInTheDocument();
      });
    });
  });

  describe('Tag Management', () => {
    test('allows deselecting existing tags', async () => {
      renderEditPostPage();

      await waitFor(() => {
        expect(screen.getByText('Budget')).toHaveClass('selected');
      });

      const budgetTag = screen.getByText('Budget');
      fireEvent.click(budgetTag);

      expect(budgetTag).not.toHaveClass('selected');
      expect(screen.getByText('1/5 tags selected')).toBeInTheDocument();
    });

    test('allows adding new tags', async () => {
      renderEditPostPage();

      await waitFor(() => {
        expect(screen.getByText('Vegan')).not.toHaveClass('selected');
      });

      const veganTag = screen.getByText('Vegan');
      fireEvent.click(veganTag);

      expect(veganTag).toHaveClass('selected');
      expect(screen.getByText('3/5 tags selected')).toBeInTheDocument();
    });

    test('prevents selecting more than 5 tags', async () => {
      renderEditPostPage();

      await waitFor(() => {
        expect(screen.getByText('2/5 tags selected')).toBeInTheDocument();
      });

      // Add 3 more tags to reach limit
      const additionalTags = ['Vegan', 'Quick', 'Healthy'];
      additionalTags.forEach(tag => {
        fireEvent.click(screen.getByText(tag));
      });

      expect(screen.getByText('5/5 tags selected')).toBeInTheDocument();

      // Try to add 6th tag
      fireEvent.click(screen.getByText('Student'));

      expect(screen.getByText('Student')).not.toHaveClass('selected');
      expect(mockToast.info).toHaveBeenCalledWith('You can select a maximum of 5 tags');
    });
  });

  describe('Form Validation', () => {
    test('validates required title field', async () => {
      renderEditPostPage();

      await waitFor(() => {
        expect(screen.getByDisplayValue('Original Post Title')).toBeInTheDocument();
      });

      const titleInput = screen.getByLabelText(/title/i);
      fireEvent.change(titleInput, { target: { value: '' } });
      fireEvent.blur(titleInput);

      const submitButton = screen.getByText('Update');
      const form = titleInput.closest('form');
      fireEvent.submit(form);

      await waitFor(() => {
        expect(mockToast.warning).toHaveBeenCalledWith('Please enter a title');
        expect(forumService.updatePost).not.toHaveBeenCalled();
      });
    });

    test('validates required content field', async () => {
      renderEditPostPage();

      await waitFor(() => {
        expect(screen.getByDisplayValue('Original post content')).toBeInTheDocument();
      });

      const contentInput = screen.getByLabelText(/content/i);
      fireEvent.change(contentInput, { target: { value: '' } });
      fireEvent.blur(contentInput);

      const submitButton = screen.getByText('Update');
      const form = contentInput.closest('form');
      fireEvent.submit(form);

      await waitFor(() => {
        expect(mockToast.warning).toHaveBeenCalledWith('Please enter content');
        expect(forumService.updatePost).not.toHaveBeenCalled();
      });
    });

    test('validates at least one tag is selected', async () => {
      renderEditPostPage();

      await waitFor(() => {
        expect(screen.getByText('Budget')).toHaveClass('selected');
      });

      // Deselect all tags
      fireEvent.click(screen.getByText('Budget'));
      fireEvent.click(screen.getByText('Tips'));

      const submitButton = screen.getByText('Update');
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(mockToast.warning).toHaveBeenCalledWith('Please select at least one tag');
        expect(forumService.updatePost).not.toHaveBeenCalled();
      });
    });
  });

  describe('Form Submission', () => {
    test('submits form with updated data', async () => {
      renderEditPostPage();

      await waitFor(() => {
        expect(screen.getByDisplayValue('Original Post Title')).toBeInTheDocument();
      });

      const titleInput = screen.getByLabelText(/title/i);
      const contentInput = screen.getByLabelText(/content/i);

      fireEvent.change(titleInput, { target: { value: 'Updated Title' } });
      fireEvent.change(contentInput, { target: { value: 'Updated content' } });
      fireEvent.click(screen.getByText('Vegan')); // Add new tag

      const submitButton = screen.getByText('Update');
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(forumService.updatePost).toHaveBeenCalledWith('1', {
          title: 'Updated Title',
          content: 'Updated content',
          is_commentable: true,
          tags: ['Budget', 'Tips', 'Vegan'],
        });
      });
    });

    test('shows success message and navigates on successful submission', async () => {
      renderEditPostPage();

      await waitFor(() => {
        expect(screen.getByDisplayValue('Original Post Title')).toBeInTheDocument();
      });

      const submitButton = screen.getByText('Update');
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(mockToast.success).toHaveBeenCalledWith('Post updated successfully!');
        expect(mockNavigate).toHaveBeenCalledWith('/community/post/1');
      });
    });

    test('shows loading state while submitting', async () => {
      let resolvePromise;
      forumService.updatePost.mockReturnValue(new Promise(resolve => {
        resolvePromise = resolve;
      }));

      renderEditPostPage();

      await waitFor(() => {
        expect(screen.getByDisplayValue('Original Post Title')).toBeInTheDocument();
      });

      const submitButton = screen.getByText('Update');
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('Updating...')).toBeInTheDocument();
        expect(submitButton).toBeDisabled();
      });

      resolvePromise({});
    });

    test('includes updated is_commentable setting', async () => {
      renderEditPostPage();

      await waitFor(() => {
        expect(screen.getByLabelText(/allow comments/i)).toBeChecked();
      });

      const commentsCheckbox = screen.getByLabelText(/allow comments/i);
      fireEvent.click(commentsCheckbox); // Disable comments

      const submitButton = screen.getByText('Update');
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(forumService.updatePost).toHaveBeenCalledWith('1', {
          title: 'Original Post Title',
          content: 'Original post content',
          is_commentable: false,
          tags: ['Budget', 'Tips'],
        });
      });
    });
  });

  describe('Error Handling', () => {
    test('handles post loading errors', async () => {
      forumService.getPostById.mockRejectedValue(new Error('Post not found'));

      renderEditPostPage();

      await waitFor(() => {
        expect(mockToast.error).toHaveBeenCalledWith('Failed to load post');
        expect(mockNavigate).toHaveBeenCalledWith('/community');
      });
    });

    test('handles submission errors with specific error message', async () => {
      forumService.updatePost.mockRejectedValue({
        response: {
          data: {
            title: ['Title is too short'],
            content: ['Content is required']
          }
        }
      });

      renderEditPostPage();

      await waitFor(() => {
        expect(screen.getByDisplayValue('Original Post Title')).toBeInTheDocument();
      });

      const submitButton = screen.getByText('Update');
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(mockToast.error).toHaveBeenCalledWith('Failed to update post: Title is too short Content is required');
      });
    });

    test('handles submission errors with generic error message', async () => {
      forumService.updatePost.mockRejectedValue(new Error('Network error'));

      renderEditPostPage();

      await waitFor(() => {
        expect(screen.getByDisplayValue('Original Post Title')).toBeInTheDocument();
      });

      const submitButton = screen.getByText('Update');
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(mockToast.error).toHaveBeenCalledWith('Failed to update post. Please try again.');
      });
    });
  });

  describe('Authentication Handling', () => {
    test('redirects to login when user is not authenticated', async () => {
      useAuth.mockReturnValue({
        currentUser: null,
      });

      renderEditPostPage();

      await waitFor(() => {
        expect(screen.getByDisplayValue('Original Post Title')).toBeInTheDocument();
      });

      const submitButton = screen.getByText('Update');
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(mockToast.warning).toHaveBeenCalledWith('Please log in to edit posts');
        expect(mockNavigate).toHaveBeenCalledWith('/login');
        expect(forumService.updatePost).not.toHaveBeenCalled();
      });
    });
  });

  describe('Navigation', () => {
    test('navigates to post detail when cancel button is clicked', async () => {
      renderEditPostPage();

      await waitFor(() => {
        expect(screen.getByText('Cancel')).toBeInTheDocument();
      });

      const cancelButton = screen.getByText('Cancel');
      fireEvent.click(cancelButton);

      expect(mockNavigate).toHaveBeenCalledWith('/community/post/1');
    });
  });

  describe('Character Limits', () => {
    test('enforces title character limit', async () => {
      renderEditPostPage();

      await waitFor(() => {
        expect(screen.getByDisplayValue('Original Post Title')).toBeInTheDocument();
      });

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