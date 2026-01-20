import api from "./axios.config";

// Login user
export const loginUser = (credentials) => {
  return api.post("/api/auth/login", credentials);
};

// Register user
export const registerUser = (userData) => {
  return api.post("/api/auth/register", userData);
};

// Fetch current user profile
export const fetchUserProfile = () => {
  return api.get("/api/auth/me");
};

// Update current user profile
export const updateUserProfile = (updatedData) => {
  return api.patch("/api/auth/me", updatedData);
};

