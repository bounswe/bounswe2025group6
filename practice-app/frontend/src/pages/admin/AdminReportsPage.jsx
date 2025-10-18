// src/pages/admin/AdminReportsPage.jsx
import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../components/ui/Toast';
import { useNavigate } from 'react-router-dom';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import reportService from '../../services/reportService';
import '../../styles/AdminReportsPage.css';

const REPORT_TYPES = {
  'spam': 'Spam',
  'inappropriate': 'Inappropriate Content',
  'harassment': 'Harassment',
  'other': 'Other'
};

const REPORT_STATUSES = {
  'pending': 'Pending',
  'resolved': 'Resolved',
};

const CONTENT_TYPES = {
  'forumpost': 'Forum Post',
  'recipe': 'Recipe',
  'forumpostcomment': 'Comment'
};

const AdminReportsPage = () => {
  const { currentUser } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  
  // Initialize as empty arrays to prevent iteration errors
  const [reports, setReports] = useState([]);
  const [filteredReports, setFilteredReports] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [selectedReport, setSelectedReport] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [contentTypeFilter, setContentTypeFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    checkAdminAccess();
  }, []);

  useEffect(() => {
    if (isAdmin) {
      loadReports();
    }
  }, [isAdmin]);

  useEffect(() => {
    applyFilters();
  }, [reports, statusFilter, typeFilter, contentTypeFilter, searchTerm]);

  const checkAdminAccess = async () => {
    try {
      const adminStatus = await reportService.checkAdminStatus();
      
      if (adminStatus.is_admin) {
        setIsAdmin(true);
      } else {
        toast.error('Access denied. Admin privileges required.');
        navigate('/dashboard');
      }
    } catch (error) {
      toast.error('Failed to verify admin access');
      navigate('/dashboard');
    }
  };

  const loadReports = async () => {
    setIsLoading(true);
    try {
      const reportsData = await reportService.listAllReports();
      
      let reportsArray;
      if (reportsData && reportsData.results && Array.isArray(reportsData.results)) {
        // Paginated response with results array
        reportsArray = reportsData.results;
      } else if (Array.isArray(reportsData)) {
        // Direct array response
        reportsArray = reportsData;
      } else {
        // Fallback to empty array
        reportsArray = [];
      }
      
      setReports(reportsArray);
    } catch (error) {
      toast.error('Failed to load reports');
      setReports([]); // Set empty array on error
    } finally {
      setIsLoading(false);
    }
  };

  const applyFilters = () => {
    // Ensure reports is always an array before filtering
    if (!Array.isArray(reports)) {
      setFilteredReports([]);
      return;
    }

    let filtered = [...reports];

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(report => report.status === statusFilter);
    }

    // Report type filter
    if (typeFilter !== 'all') {
      filtered = filtered.filter(report => report.report_type === typeFilter);
    }

    // Content type filter
    if (contentTypeFilter !== 'all') {
      filtered = filtered.filter(report => report.content_type_name === contentTypeFilter);
    }

    // Search filter
    if (searchTerm.trim()) {
      const search = searchTerm.toLowerCase();
      filtered = filtered.filter(report => 
        report.content_object_preview?.toLowerCase().includes(search) ||
        report.reporter_username?.toLowerCase().includes(search) ||
        report.description?.toLowerCase().includes(search)
      );
    }

    setFilteredReports(filtered);
  };

  const resetFilters = () => {
    setStatusFilter('all');
    setTypeFilter('all');
    setContentTypeFilter('all');
    setSearchTerm('');
  };

  const handleReportAction = async (reportId, action) => {
    setIsProcessing(true);
    try {
      let response;
      switch (action) {
        case 'resolve_keep':
          response = await reportService.resolveReportKeep(reportId);
          toast.success('Report resolved - content kept');
          break;
        case 'resolve_delete':
          response = await reportService.resolveReportDelete(reportId);
          toast.success('Report resolved - content deleted');
          break;
        default:
          throw new Error('Unknown action');
      }
      
      // Reload reports to reflect changes
      await loadReports();
      setShowDetailModal(false);
    } catch (error) {
      toast.error(`Failed to ${action.replace('_', ' ')} report`);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleViewDetails = async (reportId) => {
    try {
      const reportDetail = await reportService.getReportByIdAdmin(reportId);
      setSelectedReport(reportDetail);
      setShowDetailModal(true);
    } catch (error) {
      toast.error('Failed to load report details');
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'pending': return 'status-pending';
      case 'resolved': return 'status-resolved';
      default: return 'status-pending';
    }
  };

  // Show loading state while checking admin access
  if (!isAdmin && isLoading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        minHeight: '50vh',
        fontSize: '1.1rem'
      }}>
        Checking admin access...
      </div>
    );
  }

  // If not admin, this component shouldn't render (handled by routing)
  if (!isAdmin) {
    return (
      <div style={{ 
        display: 'flex', 
        flexDirection: 'column',
        justifyContent: 'center', 
        alignItems: 'center', 
        minHeight: '50vh',
        textAlign: 'center',
        padding: '2rem'
      }}>
        <h2 style={{ color: '#dc2626', marginBottom: '1rem' }}>Access Denied</h2>
        <p style={{ color: '#6b7280', marginBottom: '2rem' }}>
          You need admin privileges to access this page.
        </p>
        <a 
          href="/dashboard" 
          style={{ 
            color: '#3b82f6', 
            textDecoration: 'underline',
            fontSize: '1rem'
          }}
        >
          Return to Dashboard
        </a>
      </div>
    );
  }

  return (
    <div className="admin-reports-container">
      <div className="admin-reports-header">
        <div>
          <h1 className="admin-reports-title">Report Management</h1>
          <p className="admin-reports-subtitle">Review and manage user reports</p>
        </div>
        <Button onClick={loadReports} disabled={isLoading}>
          {isLoading ? 'Loading...' : 'Refresh Reports'}
        </Button>
      </div>

      {/* Filters Section */}
      <Card className="admin-reports-filters">
        <Card.Body>
          <div className="filters-grid">
            <div className="filter-group">
              <label htmlFor="search">Search Reports</label>
              <input
                id="search"
                type="text"
                placeholder="Search by content, reporter, or description..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="filter-input"
              />
            </div>
            
            <div className="filter-group">
              <label htmlFor="status-filter">Status</label>
              <select
                id="status-filter"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="filter-select"
              >
                <option value="all">All Statuses</option>
                {Object.entries(REPORT_STATUSES).map(([key, label]) => (
                  <option key={key} value={key}>{label}</option>
                ))}
              </select>
            </div>
            
            <div className="filter-group">
              <label htmlFor="type-filter">Report Type</label>
              <select
                id="type-filter"
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="filter-select"
              >
                <option value="all">All Types</option>
                {Object.entries(REPORT_TYPES).map(([key, label]) => (
                  <option key={key} value={key}>{label}</option>
                ))}
              </select>
            </div>
            
            <div className="filter-group">
              <label htmlFor="content-type-filter">Content Type</label>
              <select
                id="content-type-filter"
                value={contentTypeFilter}
                onChange={(e) => setContentTypeFilter(e.target.value)}
                className="filter-select"
              >
                <option value="all">All Content</option>
                {Object.entries(CONTENT_TYPES).map(([key, label]) => (
                  <option key={key} value={key}>{label}</option>
                ))}
              </select>
            </div>
          </div>
          
          <div className="filters-actions">
            <Button onClick={resetFilters} variant="secondary">
              Reset Filters
            </Button>
            <span className="results-count">
              Showing {filteredReports.length} of {reports.length} reports
            </span>
          </div>
        </Card.Body>
      </Card>

      {/* Reports Table */}
      {isLoading ? (
        <div className="admin-reports-loading">Loading reports...</div>
      ) : filteredReports.length > 0 ? (
        <Card className="admin-reports-table-card">
          <Card.Body>
            <div className="admin-reports-table">
              <table>
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Type</th>
                    <th>Content Type</th>
                    <th>Reporter</th>
                    <th>Content Preview</th>
                    <th>Status</th>
                    <th>Date</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredReports.map(report => (
                    <tr key={report.id} data-status={report.status}>
                      <td>#{report.id}</td>
                      <td>
                        <span className="report-type-badge">
                          {REPORT_TYPES[report.report_type] || report.report_type}
                        </span>
                      </td>
                      <td>
                        <span className="content-type-badge">
                          {CONTENT_TYPES[report.content_type_name] || report.content_type_name}
                        </span>
                      </td>
                      <td className="reporter-cell">{report.reporter_username}</td>
                      <td className="content-preview">
                        {report.content_object_preview || 'No preview available'}
                      </td>
                      <td>
                        <span className={`status-badge ${getStatusBadgeClass(report.status)}`}>
                          {REPORT_STATUSES[report.status] || report.status}
                        </span>
                      </td>
                      <td className="date-cell">{formatDate(report.created_at)}</td>
                      <td className="actions-cell">
                        <Button 
                          size="sm" 
                          onClick={() => handleViewDetails(report.id)}
                          className="action-button"
                        >
                          View Details
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card.Body>
        </Card>
      ) : (
        <Card>
          <Card.Body className="no-reports">
            <h3>No reports found</h3>
            <p>No reports match your current filter criteria.</p>
            {reports.length === 0 ? (
              <p>There are currently no reports in the system.</p>
            ) : (
              <Button onClick={resetFilters}>Clear Filters</Button>
            )}
          </Card.Body>
        </Card>
      )}

      {/* Report Detail Modal - Simplified Actions */}
      {showDetailModal && selectedReport && (
        <div className="report-detail-modal-overlay">
          <div className="report-detail-modal">
            <div className="modal-header">
              <h3>Report Details - #{selectedReport.id}</h3>
              <button 
                className="modal-close"
                onClick={() => setShowDetailModal(false)}
                disabled={isProcessing}
              >
                ×
              </button>
            </div>
            
            <div className="modal-body">
              <div className="report-detail-grid">
                <div className="detail-item">
                  <label>Report Type:</label>
                  <span>{REPORT_TYPES[selectedReport.report_type] || selectedReport.report_type}</span>
                </div>
                
                <div className="detail-item">
                  <label>Content Type:</label>
                  <span>{CONTENT_TYPES[selectedReport.content_type_name] || selectedReport.content_type_name}</span>
                </div>
                
                <div className="detail-item">
                  <label>Reporter:</label>
                  <span>{selectedReport.reporter_username}</span>
                </div>
                
                <div className="detail-item">
                  <label>Status:</label>
                  <span className={`status-badge ${getStatusBadgeClass(selectedReport.status)}`}>
                    {REPORT_STATUSES[selectedReport.status] || selectedReport.status}
                  </span>
                </div>
                
                <div className="detail-item">
                  <label>Date Reported:</label>
                  <span>{formatDate(selectedReport.created_at)}</span>
                </div>
                
                <div className="detail-item full-width">
                  <label>Content Preview:</label>
                  <div className="content-preview-box">
                    {selectedReport.content_object_preview || 'No preview available'}
                  </div>
                </div>
                
                {selectedReport.description && (
                  <div className="detail-item full-width">
                    <label>Report Description:</label>
                    <div className="description-box">
                      {selectedReport.description}
                    </div>
                  </div>
                )}
              </div>
            </div>
            
            <div className="modal-actions">
              {/* Only show action buttons for pending reports */}
              {selectedReport.status === 'pending' && (
                <>
                  <Button 
                    onClick={() => handleReportAction(selectedReport.id, 'resolve_keep')}
                    disabled={isProcessing}
                    className="action-resolve-keep"
                  >
                    {isProcessing ? 'Processing...' : 'Resolve - Keep Content'}
                  </Button>
                  <Button 
                    onClick={() => handleReportAction(selectedReport.id, 'resolve_delete')}
                    disabled={isProcessing}
                    className="action-resolve-delete"
                  >
                    {isProcessing ? 'Processing...' : 'Resolve - Delete Content'}
                  </Button>
                </>
              )}
              
              {/* Show info for already resolved reports */}
              {selectedReport.status === 'resolved' && (
                <div className="resolved-info">
                  <p style={{ color: '#059669', fontWeight: 'bold' }}>
                    ✓ This report has been resolved
                  </p>
                </div>
              )}
              
              <Button 
                onClick={() => setShowDetailModal(false)}
                disabled={isProcessing}
                variant="secondary"
              >
                Close
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminReportsPage;