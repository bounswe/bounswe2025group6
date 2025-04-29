import axios from "axios";

// Axios instance for consistent API URL
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:5000/api", // Replace with your backend baseURL
  withCredentials: true, // Important if your backend uses cookies
});

// Store auth token in localStorage (optional if you use cookies instead)
const TOKEN_KEY = "authToken";

const saveToken = (token) => {
  localStorage.setItem(TOKEN_KEY, token);
};

const getToken = () => {
  return localStorage.getItem(TOKEN_KEY);
};

const removeToken = () => {
  localStorage.removeItem(TOKEN_KEY);
};

// Register
export const register = async (userData) => {
  const response = await api.post("/auth/register", userData);
  if (response.data.token) {
    saveToken(response.data.token);
  }
  return response.data;
};

// Login
export const login = async (userData) => {
  const response = await api.post("/auth/login", userData);
  if (response.data.token) {
    saveToken(response.data.token);
  }
  return response.data;
};

// Logout (optional, client-side)
export const logout = () => {
  removeToken();
};

export const authService = {
  register,
  login,
  logout,
  getToken,
};