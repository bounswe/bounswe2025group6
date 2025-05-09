import axios from 'axios';

const apiHost = import.meta.env.VITE_API_HOST; // Make sure VITE_API_HOST is set in your .env file (e.g., VITE_API_HOST=localhost)
const API_URL = `http://${apiHost}:8000/api`;   // This assumes your API endpoints are prefixed with /api/
const ACCESS_TOKEN_KEY = 'fithub_access_token'; // Ensure this matches the key used in authService.js for storing the token

const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem(ACCESS_TOKEN_KEY);
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default apiClient;