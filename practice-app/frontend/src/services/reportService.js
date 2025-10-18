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
};

export default reportService;


