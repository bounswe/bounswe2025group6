// src/services/reportService.js
import axios from 'axios';

// Create an axios instance aligned with other services
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
});

// Attach auth token if available
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('fithub_access_token');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Reports API client
const reportService = {
  // ===== USER ENDPOINTS =====
  
  // Create a new report
  createReport: async ({ content_type, object_id, report_type, description }) => {
    const payload = { content_type, object_id, report_type };
    if (description && description.trim()) {
      payload.description = description.trim();
    }
    const response = await api.post('/reports/reports/', payload);
    return response.data;
  },
  
  // List current user's reports
  listMyReports: async () => {
    const response = await api.get('/reports/reports/');
    return response.data;
  },
  
  // Get a single report by id (must belong to current user)
  getReportById: async (reportId) => {
    const response = await api.get(`/reports/reports/${reportId}/`);
    return response.data;
  },
  
  // Update an existing report (own report)
  updateReport: async (reportId, { report_type, description }) => {
    const response = await api.put(`/reports/reports/${reportId}/`, {
      report_type,
      description,
    });
    return response.data;
  },
  
  // Delete an existing report (own report)
  deleteReport: async (reportId) => {
    const response = await api.delete(`/reports/reports/${reportId}/`);
    return response.data;
  },

  // ===== ADMIN ENDPOINTS =====
  
  // Admin login
  adminLogin: async (username, password) => {
    const response = await api.post('/reports/admin/auth/login/', {
      username,
      password,
    });
    return response.data;
  },

  // Check admin status - Since the endpoint doesn't exist, we'll implement a fallback
  checkAdminStatus: async () => {
    try {
      // Try to access an admin-only endpoint to check if user has admin privileges
      // Use the list all reports endpoint as a test
      const response = await api.get('/reports/admin/reports/');
      // If this succeeds, user is admin
      return {
        is_admin: true,
        user: null // We don't have user info from this endpoint
      };
    } catch (error) {
      if (error.response?.status === 403 || error.response?.status === 401) {
        // Access denied - user is not admin
        return {
          is_admin: false,
          user: null
        };
      }
      // Re-throw other errors
      throw error;
    }
  },

  // List all reports (admin only)
  listAllReports: async () => {
    const response = await api.get('/reports/admin/reports/');
    return response.data;
  },

  // Get single report as admin
  getReportByIdAdmin: async (reportId) => {
    const response = await api.get(`/reports/admin/reports/${reportId}/`);
    return response.data;
  },

  // Update report as admin
  updateReportAdmin: async (reportId, { report_type, description, status }) => {
    const payload = {};
    if (report_type !== undefined) payload.report_type = report_type;
    if (description !== undefined) payload.description = description;
    if (status !== undefined) payload.status = status;
    
    const response = await api.put(`/reports/admin/reports/${reportId}/`, payload);
    return response.data;
  },

  // Delete report as admin
  deleteReportAdmin: async (reportId) => {
    const response = await api.delete(`/reports/admin/reports/${reportId}/`);
    return response.data;
  },

  // Resolve report - keep content
  resolveReportKeep: async (reportId) => {
    const response = await api.post(`/reports/admin/reports/${reportId}/resolve_keep/`);
    return response.data;
  },

  // Resolve report - delete content
  resolveReportDelete: async (reportId) => {
    const response = await api.post(`/reports/admin/reports/${reportId}/resolve_delete/`);
    return response.data;
  },
};

export default reportService;


