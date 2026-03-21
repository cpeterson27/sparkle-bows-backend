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

  const applyAuthPayload = useCallback(
    (payload) => {
      const nextUser =
        payload?.user ?? (payload?.id || payload?.email ? payload : null);
      const nextToken =
        payload?.accessToken ?? payload?.token ?? accessToken ?? null;
      setAuth(nextUser, nextToken);
      return nextUser;
    },
    [accessToken],
  );

  const clearAuth = () => {
    setUser(null);
    setAccessToken(null);
  };

  const tryRefresh = useCallback(async () => {
    try {
      setLoading(true);
      const { data } = await api.post(
        "/api/auth/refresh-token",
        {},
        { withCredentials: true },
      );
      applyAuthPayload(data);
    } catch (error) {
      // 401 is expected when no session exists — not an error worth logging
      if (error.response?.status && error.response.status !== 401) {
        console.error("Session refresh failed:", error);
      }
      clearAuth();
    } finally {
      setLoading(false);
    }
  }, [applyAuthPayload]);

  // On mount: always try refresh — the cookie is now set cleanly by the
  // backend before redirecting, so it will be present for OAuth logins too.
  // No more hash/URL token parsing needed.
  useEffect(() => {
    tryRefresh();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const loginUser = async ({ email, password }) => {
    const { data } = await api.post(
      "/api/auth/login",
      { email, password },
      { withCredentials: true },
    );
    if (data?.requiresTwoFactor) return data;
    return applyAuthPayload(data);
  };

  const verifyTwoFactorLogin = async (payload) => {
    const data = await verifyTwoFactorLoginRequest(payload);
    return applyAuthPayload(data);
  };

  // Called by App.jsx after OAuth redirect lands on /?oauth=success
  // The refreshToken cookie is already set — just call tryRefresh.
  const completeOAuthLogin = useCallback(async () => {
    await tryRefresh();
  }, [tryRefresh]);

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