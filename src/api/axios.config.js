import axios from "axios";

// This function will be set later by AuthProvider
let getAccessToken = null;

// Expose a way to set it
export function injectAccessTokenGetter(fn) {
  getAccessToken = fn;
}

const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || "http://localhost:3001",
  withCredentials: true, // cookie (refresh token) goes automatically
});

// Request interceptor attaches token if present
api.interceptors.request.use(
  (config) => {
    if (getAccessToken) {
      const token = getAccessToken();
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

export default api;
