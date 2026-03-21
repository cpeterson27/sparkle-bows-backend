import React, { createContext, useState, useEffect, useCallback } from "react";
import api, { injectAccessTokenGetter } from "../api/axios.config";
import { fetchCurrentUser, updateCurrentUserProfile } from "../api/account";
import { verifyTwoFactorLogin as verifyTwoFactorLoginRequest } from "../api/security";

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [accessToken, setAccessToken] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    injectAccessTokenGetter(() => accessToken);
  }, [accessToken]);

  const setAuth = (userData, token) => {
    setUser(userData);
    setAccessToken(token);
  };

  const applyAuthPayload = useCallback((payload) => {
    const nextUser =
      payload?.user ??
      (payload?.id || payload?.email ? payload : null);
    const nextToken =
      payload?.accessToken ?? payload?.token ?? accessToken ?? null;
    setAuth(nextUser, nextToken);
    return nextUser;
  }, [accessToken]);

  const clearAuth = () => {
    setUser(null);
    setAccessToken(null);
  };

  const tryRefresh = useCallback(async () => {
    try {
      setLoading(true);
      const { data } = await api.post("/api/auth/refresh-token", {}, { withCredentials: true });
      applyAuthPayload(data);
    } catch {
      clearAuth();
    } finally {
      setLoading(false);
    }
  }, [applyAuthPayload]);

  useEffect(() => {
    tryRefresh();
  }, [tryRefresh]);

  const loginUser = async ({ email, password }) => {
    const { data } = await api.post(
      "/api/auth/login",
      { email, password },
      { withCredentials: true }
    );
    if (data?.requiresTwoFactor) {
      return data;
    }
    return applyAuthPayload(data);
  };

  const verifyTwoFactorLogin = async (payload) => {
    const data = await verifyTwoFactorLoginRequest(payload);
    return applyAuthPayload(data);
  };

  const completeOAuthLogin = async () => refreshCurrentUser();

  const logoutUser = async () => {
    try {
      await api.post("/api/auth/logout", {}, { withCredentials: true });
    } catch {}
    clearAuth();
  };

  const updateUserProfile = async (profileData) => {
    const data = await updateCurrentUserProfile(profileData);
    return applyAuthPayload(data);
  };

  const refreshCurrentUser = async () => {
    const data = await fetchCurrentUser();
    return applyAuthPayload(data);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        accessToken,
        loginUser,
        verifyTwoFactorLogin,
        completeOAuthLogin,
        logoutUser,
        updateUserProfile,
        refreshCurrentUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
