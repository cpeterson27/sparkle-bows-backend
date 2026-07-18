import api from "./axios.config";

export const logoutUser = async () => {
  try {
    await api.post("/api/auth/logout", {}, { withCredentials: true });
  } catch (err) {
    console.error("Logout failed:", err);
  } finally {
    localStorage.removeItem("accessToken");
    window.location.href = "/";
  }
};

export const updateUserProfile = async (userData) => {
  try {
    const response = await api.patch("/api/auth/update-profile", userData);
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};