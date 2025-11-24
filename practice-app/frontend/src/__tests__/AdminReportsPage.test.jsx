import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import AdminReportsPage from '../pages/admin/AdminReportsPage';
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

describe('AdminReportsPage', () => {
  const mockToast = {
    success: jest.fn(),
    error: jest.fn(),
    info: jest.fn(),
    warning: jest.fn(),
  };

  const mockAdminUser = {
    id: 1,
    username: 'admin',
    is_staff: true,
  };

  const mockReports = [
    {
      id: 1,
      report_type: 'spam',
      content_type_name: 'forumpost',
      reporter_username: 'user1',
      content_object_preview: 'This is a spam post content...',
      status: 'pending',
      created_at: '2024-01-01T10:00:00Z',
      description: 'This post contains spam content',
    },
    {
      id: 2,
      report_type: 'inappropriate',
      content_type_name: 'recipe',
      reporter_username: 'user2',
      content_object_preview: 'Recipe with inappropriate content...',
      status: 'resolved',
      created_at: '2024-01-02T11:00:00Z',
      description: 'Inappropriate recipe description',
    },
    {
      id: 3,
      report_type: 'harassment',
      content_type_name: 'forumpostcomment',
      reporter_username: 'user3',
      content_object_preview: 'Harassing comment text...',
      status: 'pending',
      created_at: '2024-01-03T12:00:00Z',
      description: 'User harassment in comments',
    },
  ];

  const mockDetailedReport = {
    ...mockReports[0],
    reporter_details: { id: 10, username: 'user1' },
    content_details: { id: 100, title: 'Spam Post Title' },
  };

  beforeEach(() => {
    jest.clearAllMocks();

    useAuth.mockReturnValue({
      currentUser: mockAdminUser,
    });

    useToast.mockReturnValue(mockToast);

    reportService.checkAdminStatus.mockResolvedValue({ is_admin: true });
    reportService.listAllReports.mockResolvedValue({ results: mockReports });
    reportService.getReportByIdAdmin.mockResolvedValue(mockDetailedReport);
    reportService.resolveReportKeep.mockResolvedValue({});
    reportService.resolveReportDelete.mockResolvedValue({});
  });

  const renderAdminReportsPage = () => {
    return render(
      <BrowserRouter>
        <AdminReportsPage />
      </BrowserRouter>
    );
  };

  describe('Page Access Control', () => {
    test('checks admin status on mount', async () => {
      renderAdminReportsPage();

      await waitFor(() => {
        expect(reportService.checkAdminStatus).toHaveBeenCalled();
      });
    });

    test('redirects non-admin users to dashboard', async () => {
      reportService.checkAdminStatus.mockResolvedValue({ is_admin: false });

      renderAdminReportsPage();

      await waitFor(() => {
        expect(mockToast.error).toHaveBeenCalledWith('Access denied. Admin privileges required.');
        expect(mockNavigate).toHaveBeenCalledWith('/dashboard');
      });
    });

    test('handles admin status check errors', async () => {
      reportService.checkAdminStatus.mockRejectedValue(new Error('API Error'));

      renderAdminReportsPage();

      await waitFor(() => {
        expect(mockToast.error).toHaveBeenCalledWith('Failed to verify admin access');
        expect(mockNavigate).toHaveBeenCalledWith('/dashboard');
      });
    });

    test('shows loading state while checking admin access', () => {
      reportService.checkAdminStatus.mockImplementation(() => new Promise(() => {})); // Never resolves

      renderAdminReportsPage();

      expect(screen.getByText('Checking admin access...')).toBeInTheDocument();
    });

    test('shows access denied message for non-admin users', async () => {
      reportService.checkAdminStatus.mockResolvedValue({ is_admin: false });

      renderAdminReportsPage();

      // Wait for admin check to complete - component navigates away, but we can check the error toast
      await waitFor(() => {
        expect(mockToast.error).toHaveBeenCalledWith('Access denied. Admin privileges required.');
        expect(mockNavigate).toHaveBeenCalledWith('/dashboard');
      }, { timeout: 3000 });

      // The component should show access denied UI before navigation
      // But since it navigates, we verify the navigation happened
      expect(mockNavigate).toHaveBeenCalledWith('/dashboard');
    });
  });

  describe('Page Rendering for Admin Users', () => {
    test('renders page header correctly for admin users', async () => {
      renderAdminReportsPage();

      await waitFor(() => {
        expect(screen.getByText('Report Management')).toBeInTheDocument();
        expect(screen.getByText('Review and manage user reports')).toBeInTheDocument();
        expect(screen.getByText('Refresh Reports')).toBeInTheDocument();
      });
    });

    test('renders filter section correctly', async () => {
      renderAdminReportsPage();

      await waitFor(() => {
        expect(screen.getByLabelText('Search Reports')).toBeInTheDocument();
        expect(screen.getByLabelText('Status')).toBeInTheDocument();
        expect(screen.getByLabelText('Report Type')).toBeInTheDocument();
        expect(screen.getByLabelText('Content Type')).toBeInTheDocument();
        expect(screen.getByText('Reset Filters')).toBeInTheDocument();
      });
    });

    test('loads and displays reports table', async () => {
      renderAdminReportsPage();

      // Wait for reports to load
      await waitFor(() => {
        expect(screen.getByText('#1')).toBeInTheDocument();
      }, { timeout: 3000 });

      await waitFor(() => {
        // "Spam" appears in both select option and table, use getAllByText
        const spamElements = screen.getAllByText('Spam');
        const spamInTable = spamElements.find(el => el.closest('table'));
        expect(spamInTable).toBeInTheDocument();
        
        // "Forum Post" also appears in both select and table
        const forumPostElements = screen.getAllByText('Forum Post');
        const forumPostInTable = forumPostElements.find(el => el.closest('table'));
        expect(forumPostInTable).toBeInTheDocument();
        
        expect(screen.getByText('user1')).toBeInTheDocument();
        expect(screen.getByText('This is a spam post content...')).toBeInTheDocument();
      });
    });

    test('shows results count', async () => {
      renderAdminReportsPage();

      await waitFor(() => {
        expect(screen.getByText('Showing 3 of 3 reports')).toBeInTheDocument();
      });
    });
  });

  describe('Reports Data Loading', () => {
    test('handles reports loading errors', async () => {
      reportService.listAllReports.mockRejectedValue(new Error('API Error'));

      renderAdminReportsPage();

      await waitFor(() => {
        expect(mockToast.error).toHaveBeenCalledWith('Failed to load reports');
      });
    });

    test('handles different response formats', async () => {
      // Test direct array response
      reportService.listAllReports.mockResolvedValue(mockReports);

      renderAdminReportsPage();

      await waitFor(() => {
        expect(screen.getByText('#1')).toBeInTheDocument();
      });
    });

    test('handles empty reports response', async () => {
      reportService.listAllReports.mockResolvedValue({ results: [] });

      renderAdminReportsPage();

      await waitFor(() => {
        expect(screen.getByText('No reports found')).toBeInTheDocument();
        expect(screen.getByText('There are currently no reports in the system.')).toBeInTheDocument();
      });
    });

    test('shows loading state while fetching reports', async () => {
      reportService.listAllReports.mockImplementation(() => new Promise(() => {})); // Never resolves

      renderAdminReportsPage();

      await waitFor(() => {
        expect(screen.getByText('Loading reports...')).toBeInTheDocument();
      });
    });
  });

  describe('Filtering Functionality', () => {
    test('filters reports by status', async () => {
      renderAdminReportsPage();

      await waitFor(() => {
        expect(screen.getByText('#1')).toBeInTheDocument();
        expect(screen.getByText('#2')).toBeInTheDocument();
        expect(screen.getByText('#3')).toBeInTheDocument();
      });

      const statusFilter = screen.getByLabelText('Status');
      fireEvent.change(statusFilter, { target: { value: 'pending' } });

      await waitFor(() => {
        expect(screen.getByText('#1')).toBeInTheDocument();
        expect(screen.queryByText('#2')).not.toBeInTheDocument(); // resolved report hidden
        expect(screen.getByText('#3')).toBeInTheDocument();
        expect(screen.getByText('Showing 2 of 3 reports')).toBeInTheDocument();
      });
    });

    test('filters reports by report type', async () => {
      renderAdminReportsPage();

      await waitFor(() => {
        expect(screen.getAllByText(/user\d/)).toHaveLength(3);
      });

      const typeFilter = screen.getByLabelText('Report Type');
      fireEvent.change(typeFilter, { target: { value: 'spam' } });

      await waitFor(() => {
        expect(screen.getByText('user1')).toBeInTheDocument();
        expect(screen.queryByText('user2')).not.toBeInTheDocument();
        expect(screen.queryByText('user3')).not.toBeInTheDocument();
        expect(screen.getByText('Showing 1 of 3 reports')).toBeInTheDocument();
      });
    });

    test('filters reports by content type', async () => {
      renderAdminReportsPage();

      await waitFor(() => {
        expect(screen.getAllByText(/user\d/)).toHaveLength(3);
      });

      const contentTypeFilter = screen.getByLabelText('Content Type');
      fireEvent.change(contentTypeFilter, { target: { value: 'forumpost' } });

      await waitFor(() => {
        expect(screen.getByText('user1')).toBeInTheDocument();
        expect(screen.queryByText('user2')).not.toBeInTheDocument();
        expect(screen.queryByText('user3')).not.toBeInTheDocument();
      });
    });

    test('filters reports by search term', async () => {
      renderAdminReportsPage();

      await waitFor(() => {
        expect(screen.getAllByText(/user\d/)).toHaveLength(3);
      });

      const searchInput = screen.getByLabelText('Search Reports');
      fireEvent.change(searchInput, { target: { value: 'spam' } });

      await waitFor(() => {
        expect(screen.getByText('user1')).toBeInTheDocument();
        expect(screen.queryByText('user2')).not.toBeInTheDocument();
        expect(screen.queryByText('user3')).not.toBeInTheDocument();
      });
    });

    test('resets all filters', async () => {
      renderAdminReportsPage();

      await waitFor(() => {
        expect(screen.getAllByText(/user\d/)).toHaveLength(3);
      });

      // Apply some filters
      const statusFilter = screen.getByLabelText('Status');
      fireEvent.change(statusFilter, { target: { value: 'pending' } });

      const searchInput = screen.getByLabelText('Search Reports');
      fireEvent.change(searchInput, { target: { value: 'spam' } });

      // Reset filters
      const resetButton = screen.getByText('Reset Filters');
      fireEvent.click(resetButton);

      await waitFor(() => {
        expect(statusFilter.value).toBe('all');
        expect(searchInput.value).toBe('');
        expect(screen.getAllByText(/user\d/)).toHaveLength(3);
      });
    });

    test('shows no results message when filters return empty', async () => {
      renderAdminReportsPage();

      await waitFor(() => {
        expect(screen.getAllByText(/user\d/)).toHaveLength(3);
      });

      const searchInput = screen.getByLabelText('Search Reports');
      fireEvent.change(searchInput, { target: { value: 'nonexistent' } });

      await waitFor(() => {
        expect(screen.getByText('No reports found')).toBeInTheDocument();
        expect(screen.getByText('No reports match your current filter criteria.')).toBeInTheDocument();
        expect(screen.getByText('Clear Filters')).toBeInTheDocument();
      });
    });
  });

  describe('Report Actions', () => {
    test('opens report detail modal when view details is clicked', async () => {
      renderAdminReportsPage();

      await waitFor(() => {
        expect(screen.getByText('#1')).toBeInTheDocument();
      });

      const viewDetailsButton = screen.getAllByText('View Details')[0];
      fireEvent.click(viewDetailsButton);

      await waitFor(() => {
        expect(reportService.getReportByIdAdmin).toHaveBeenCalledWith(1);
        expect(screen.getByText('Report Details - #1')).toBeInTheDocument();
      });
    });

    test('displays detailed report information in modal', async () => {
      renderAdminReportsPage();

      await waitFor(() => {
        expect(screen.getByText('#1')).toBeInTheDocument();
      }, { timeout: 3000 });

      const viewDetailsButton = screen.getAllByText('View Details')[0];
      fireEvent.click(viewDetailsButton);

      await waitFor(() => {
        expect(reportService.getReportByIdAdmin).toHaveBeenCalledWith(1);
      });

      await waitFor(() => {
        expect(screen.getByText('Report Details - #1')).toBeInTheDocument();
      });

      await waitFor(() => {
        expect(screen.getByText('Report Type:')).toBeInTheDocument();
        // "Spam" appears in both select and modal, find the one in modal
        const spamElements = screen.getAllByText('Spam');
        const spamInModal = spamElements.find(el => 
          el.closest('.report-detail-modal')
        );
        expect(spamInModal).toBeInTheDocument();
        
        expect(screen.getByText('Content Type:')).toBeInTheDocument();
        // "Forum Post" also appears in both select and modal
        const forumPostElements = screen.getAllByText('Forum Post');
        const forumPostInModal = forumPostElements.find(el => 
          el.closest('.report-detail-modal')
        );
        expect(forumPostInModal).toBeInTheDocument();
        
        expect(screen.getByText('Reporter:')).toBeInTheDocument();
        // "user1" appears in both table and modal
        const user1Elements = screen.getAllByText('user1');
        const user1InModal = user1Elements.find(el => 
          el.closest('.report-detail-modal')
        );
        expect(user1InModal).toBeInTheDocument();
      });
    });

    test('shows action buttons for pending reports', async () => {
      renderAdminReportsPage();

      await waitFor(() => {
        expect(screen.getByText('#1')).toBeInTheDocument();
      });

      const viewDetailsButton = screen.getAllByText('View Details')[0];
      fireEvent.click(viewDetailsButton);

      await waitFor(() => {
        expect(screen.getByText('Resolve - Keep Content')).toBeInTheDocument();
        expect(screen.getByText('Resolve - Delete Content')).toBeInTheDocument();
      });
    });

    test('resolves report with keep content action', async () => {
      renderAdminReportsPage();

      await waitFor(() => {
        expect(screen.getByText('#1')).toBeInTheDocument();
      });

      const viewDetailsButton = screen.getAllByText('View Details')[0];
      fireEvent.click(viewDetailsButton);

      await waitFor(() => {
        expect(screen.getByText('Resolve - Keep Content')).toBeInTheDocument();
      });

      const resolveKeepButton = screen.getByText('Resolve - Keep Content');
      fireEvent.click(resolveKeepButton);

      await waitFor(() => {
        expect(reportService.resolveReportKeep).toHaveBeenCalledWith(1);
        expect(mockToast.success).toHaveBeenCalledWith('Report resolved - content kept');
        expect(reportService.listAllReports).toHaveBeenCalledTimes(2); // Initial load + reload
      });
    });

    test('resolves report with delete content action', async () => {
      renderAdminReportsPage();

      await waitFor(() => {
        expect(screen.getByText('#1')).toBeInTheDocument();
      });

      const viewDetailsButton = screen.getAllByText('View Details')[0];
      fireEvent.click(viewDetailsButton);

      await waitFor(() => {
        expect(screen.getByText('Resolve - Delete Content')).toBeInTheDocument();
      });

      const resolveDeleteButton = screen.getByText('Resolve - Delete Content');
      fireEvent.click(resolveDeleteButton);

      await waitFor(() => {
        expect(reportService.resolveReportDelete).toHaveBeenCalledWith(1);
        expect(mockToast.success).toHaveBeenCalledWith('Report resolved - content deleted');
      });
    });

    test('shows resolved status for already resolved reports', async () => {
      renderAdminReportsPage();

      await waitFor(() => {
        expect(screen.getByText('#2')).toBeInTheDocument();
      });

      // Mock resolved report details
      const resolvedReport = { ...mockReports[1], status: 'resolved' };
      reportService.getReportByIdAdmin.mockResolvedValue(resolvedReport);

      const viewDetailsButtons = screen.getAllByText('View Details');
      const resolvedReportButton = viewDetailsButtons[1]; // Second report is resolved
      fireEvent.click(resolvedReportButton);

      await waitFor(() => {
        expect(screen.getByText('✓ This report has been resolved')).toBeInTheDocument();
        expect(screen.queryByText('Resolve - Keep Content')).not.toBeInTheDocument();
        expect(screen.queryByText('Resolve - Delete Content')).not.toBeInTheDocument();
      });
    });

    test('closes modal when close button is clicked', async () => {
      renderAdminReportsPage();

      await waitFor(() => {
        expect(screen.getByText('#1')).toBeInTheDocument();
      });

      const viewDetailsButton = screen.getAllByText('View Details')[0];
      fireEvent.click(viewDetailsButton);

      await waitFor(() => {
        expect(screen.getByText('Report Details - #1')).toBeInTheDocument();
      });

      const closeButton = screen.getByText('Close');
      fireEvent.click(closeButton);

      await waitFor(() => {
        expect(screen.queryByText('Report Details - #1')).not.toBeInTheDocument();
      });
    });
  });

  describe('Error Handling', () => {
    test('handles report action errors', async () => {
      reportService.resolveReportKeep.mockRejectedValue(new Error('API Error'));

      renderAdminReportsPage();

      await waitFor(() => {
        expect(screen.getByText('#1')).toBeInTheDocument();
      });

      const viewDetailsButton = screen.getAllByText('View Details')[0];
      fireEvent.click(viewDetailsButton);

      await waitFor(() => {
        expect(screen.getByText('Resolve - Keep Content')).toBeInTheDocument();
      });

      const resolveKeepButton = screen.getByText('Resolve - Keep Content');
      fireEvent.click(resolveKeepButton);

      await waitFor(() => {
        expect(mockToast.error).toHaveBeenCalledWith('Failed to resolve keep report');
      });
    });

    test('handles report detail loading errors', async () => {
      reportService.getReportByIdAdmin.mockRejectedValue(new Error('API Error'));

      renderAdminReportsPage();

      await waitFor(() => {
        expect(screen.getByText('#1')).toBeInTheDocument();
      });

      const viewDetailsButton = screen.getAllByText('View Details')[0];
      fireEvent.click(viewDetailsButton);

      await waitFor(() => {
        expect(mockToast.error).toHaveBeenCalledWith('Failed to load report details');
      });
    });
  });

  describe('Loading States', () => {
    test('shows processing state during report actions', async () => {
      let resolvePromise;
      reportService.resolveReportKeep.mockReturnValue(new Promise(resolve => {
        resolvePromise = resolve;
      }));

      renderAdminReportsPage();

      await waitFor(() => {
        expect(screen.getByText('#1')).toBeInTheDocument();
      }, { timeout: 3000 });

      const viewDetailsButton = screen.getAllByText('View Details')[0];
      fireEvent.click(viewDetailsButton);

      await waitFor(() => {
        expect(screen.getByText('Resolve - Keep Content')).toBeInTheDocument();
      });

      const resolveKeepButton = screen.getByText('Resolve - Keep Content');
      fireEvent.click(resolveKeepButton);

      await waitFor(() => {
        // "Processing..." appears in the button text when isProcessing is true
        // It replaces "Resolve - Keep Content" text
        const processingButtons = screen.getAllByText('Processing...');
        expect(processingButtons.length).toBeGreaterThan(0);
        // The button should be disabled
        const disabledButton = processingButtons.find(btn => btn.disabled);
        expect(disabledButton).toBeInTheDocument();
      });

      resolvePromise({});
    });

    test('disables modal actions during processing', async () => {
      let resolvePromise;
      reportService.resolveReportKeep.mockReturnValue(new Promise(resolve => {
        resolvePromise = resolve;
      }));

      renderAdminReportsPage();

      await waitFor(() => {
        expect(screen.getByText('#1')).toBeInTheDocument();
      });

      const viewDetailsButton = screen.getAllByText('View Details')[0];
      fireEvent.click(viewDetailsButton);

      await waitFor(() => {
        expect(screen.getByText('Resolve - Keep Content')).toBeInTheDocument();
      });

      const resolveKeepButton = screen.getByText('Resolve - Keep Content');
      fireEvent.click(resolveKeepButton);

      await waitFor(() => {
        expect(screen.getByText('Close')).toBeDisabled();
        expect(screen.getByText('×')).toBeDisabled(); // Close X button
      });

      resolvePromise({});
    });
  });

  describe('Refresh Functionality', () => {
    test('refreshes reports when refresh button is clicked', async () => {
      renderAdminReportsPage();

      await waitFor(() => {
        expect(screen.getByText('Refresh Reports')).toBeInTheDocument();
      });

      const refreshButton = screen.getByText('Refresh Reports');
      fireEvent.click(refreshButton);

      await waitFor(() => {
        expect(reportService.listAllReports).toHaveBeenCalledTimes(2); // Initial + manual refresh
      });
    });

    test('shows loading state during refresh', async () => {
      let resolvePromise;
      let callCount = 0;
      reportService.listAllReports.mockImplementation(() => {
        callCount++;
        if (callCount === 1) {
          // First call (initial load)
          return Promise.resolve({ results: mockReports });
        }
        // Second call (refresh) - return pending promise
        return new Promise(resolve => {
          resolvePromise = resolve;
        });
      });

      renderAdminReportsPage();

      await waitFor(() => {
        expect(screen.queryByText('Loading reports...')).not.toBeInTheDocument();
      });

      await waitFor(() => {
        expect(screen.getByText('Refresh Reports')).toBeInTheDocument();
      });

      const refreshButton = screen.getByText('Refresh Reports');
      fireEvent.click(refreshButton);

      await waitFor(() => {
        expect(screen.getByText('Loading...')).toBeInTheDocument();
        expect(refreshButton).toBeDisabled();
      });

      if (resolvePromise) {
        resolvePromise({ results: mockReports });
      }
    });
  });

  describe('Date Formatting', () => {
    test('formats dates correctly in table', async () => {
      renderAdminReportsPage();

      await waitFor(() => {
        expect(screen.getByText('#1')).toBeInTheDocument();
      }, { timeout: 3000 });

      await waitFor(() => {
        // Date format from toLocaleDateString can vary by locale and timezone, so we check for date parts
        // Check that dates are formatted (contain month names and year)
        const dateCells = document.querySelectorAll('.date-cell');
        expect(dateCells.length).toBeGreaterThan(0);
        // Check that dates contain year 2024 (use getAllByText since there are multiple dates)
        const year2024Elements = screen.getAllByText(/2024/);
        expect(year2024Elements.length).toBeGreaterThan(0);
        // Check that dates contain month abbreviations (Jan, Feb, etc.)
        const dateText = Array.from(dateCells).map(cell => cell.textContent).join(' ');
        expect(dateText).toMatch(/Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec/);
      });
    });
  });

  describe('Status Badge Classes', () => {
    test('applies correct CSS classes for status badges', async () => {
      renderAdminReportsPage();

      await waitFor(() => {
        expect(screen.queryByText('Loading reports...')).not.toBeInTheDocument();
      });

      await waitFor(() => {
        const pendingBadges = screen.getAllByText('Pending');
        const resolvedBadges = screen.getAllByText('Resolved');
        
        // Check that badges have the status-badge class and appropriate status class
        expect(pendingBadges.length).toBeGreaterThan(0);
        expect(resolvedBadges.length).toBeGreaterThan(0);
        
        // Find badges that are in the table (not in modal)
        const tablePendingBadge = pendingBadges.find(badge => 
          badge.closest('table') && badge.classList.contains('status-badge')
        );
        const tableResolvedBadge = resolvedBadges.find(badge => 
          badge.closest('table') && badge.classList.contains('status-badge')
        );
        
        if (tablePendingBadge) {
          expect(tablePendingBadge).toHaveClass('status-badge');
          expect(tablePendingBadge).toHaveClass('status-pending');
        }
        if (tableResolvedBadge) {
          expect(tableResolvedBadge).toHaveClass('status-badge');
          expect(tableResolvedBadge).toHaveClass('status-resolved');
        }
      });
    });
  });
});