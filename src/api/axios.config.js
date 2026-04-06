import axios from "axios";
import API_URL from "../config/api";

// Injected by AuthProvider so interceptors can always read the latest token
let getAccessToken = null;
let setAccessToken = null;

export function injectAccessTokenGetter(fn) {
  getAccessToken = fn;
}

export function injectAccessTokenSetter(fn) {
  setAccessToken = fn;
}

const api = axios.create({
  baseURL: API_URL,
  withCredentials: true,
});

// ─── Request interceptor ───────────────────────────────────────────────────
// Attach the current access token to every outgoing request.
api.interceptors.request.use(
  (config) => {
    const token = getAccessToken?.();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error),
);

// ─── Response interceptor ──────────────────────────────────────────────────
// When a request fails with 401 (token expired), silently refresh the token
// and retry the original request — exactly like Shopify, Amazon, etc.
let isRefreshing = false;
let refreshQueue = [];

function processQueue(error, token = null) {
  refreshQueue.forEach((p) => {
    if (error) {
      p.reject(error);
    } else {
      p.resolve(token);
    }
  });
  refreshQueue = [];
}

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Only handle 401s that haven't already been retried
    if (
      error.response?.status !== 401 ||
      originalRequest._retry ||
      originalRequest.url?.includes("/api/auth/refresh-token") ||
      originalRequest.url?.includes("/api/auth/login")
    ) {
      return Promise.reject(error);
    }

    // If a refresh is already in progress, queue this request
    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        refreshQueue.push({ resolve, reject });
      })
        .then((token) => {
          originalRequest.headers.Authorization = `Bearer ${token}`;
          return api(originalRequest);
        })
        .catch((err) => Promise.reject(err));
    }

    // Mark as retried so we don't loop
    originalRequest._retry = true;
    isRefreshing = true;

    try {
      // Try to get a fresh access token using the refresh token cookie
      const { data } = await axios.post(
        `${API_URL}/api/auth/refresh-token`,
        {},
        { withCredentials: true },
      );

      const newToken = data.accessToken;

      // Update the token in memory via AuthProvider
      if (setAccessToken && newToken) {
        setAccessToken(newToken);
      }

      // Retry all queued requests with the new token
      processQueue(null, newToken);

      // Retry the original request
      originalRequest.headers.Authorization = `Bearer ${newToken}`;
      return api(originalRequest);
    } catch (refreshError) {
      // Refresh failed — clear the queue and let the error propagate
      processQueue(refreshError, null);
      return Promise.reject(refreshError);
    } finally {
      isRefreshing = false;
    }
  },
);

export default api;
