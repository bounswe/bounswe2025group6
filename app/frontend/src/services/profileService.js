import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:5000/api",
  withCredentials: true,
});

// Get current user's profile
export const getProfile = async () => {
  const response = await api.get("/profile/me");
  return response.data;
};

// Update current user's profile
export const updateProfile = async (profileData) => {
  const response = await api.put("/profile/me", profileData);
  return response.data;
};

// Delete current user's account
export const deleteAccount = async (password) => {
  const response = await api.delete("/profile/me", { data: { password } });
  return response.data;
};
