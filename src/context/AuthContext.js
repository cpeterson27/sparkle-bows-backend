import React, { createContext, useState, useEffect, useCallback } from "react";
import api, { injectAccessTokenGetter } from "../api/axios.config";

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [accessToken, setAccessToken] = useState(null);
  const [loading, setLoading] = useState(true);

  // Let axios use the current token automatically
  injectAccessTokenGetter(() => accessToken);

  const setAuth = (userData, token) => {
    setUser(userData);
    setAccessToken(token);
  };

  const clearAuth = () => {
    setUser(null);
    setAccessToken(null);
  };

  const tryRefresh = useCallback(async () => {
    try {
      setLoading(true);
      const { data } = await api.post("/api/auth/refresh-token", {}, { withCredentials: true });
      setAuth(data.user, data.accessToken);
    } catch {
      clearAuth();
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    tryRefresh();
  }, [tryRefresh]);

  const loginUser = async ({ email, password }) => {
    const { data } = await api.post(
      "/api/auth/login",
      { email, password },
      { withCredentials: true }
    );
    setAuth(data.user, data.token);
    return data.user;
  };

  const logoutUser = async () => {
    try {
      await api.post("/api/auth/logout", {}, { withCredentials: true });
    } catch {}
    clearAuth();
  };

  const updateUserProfile = async (profileData) => {
    const { data } = await api.patch(
      "/api/auth/update-profile",
      profileData
    );
    setAuth(data.user, data.token);
    return data.user;
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        accessToken,
        loginUser,
        logoutUser,
        updateUserProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
