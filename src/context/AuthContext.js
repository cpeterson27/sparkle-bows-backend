import React, { createContext, useState, useEffect, useCallback } from "react";
import api, { injectAccessTokenGetter } from "../api/axios.config";
import { fetchCurrentUser, updateCurrentUserProfile } from "../api/account";
import { verifyTwoFactorLogin as verifyTwoFactorLoginRequest } from "../api/security";

export const AuthContext = createContext();

function decodeJwtPayload(token) {
  try {
    const payloadSegment = String(token || "").split(".")[1];
    if (!payloadSegment) return null;

    const normalized = payloadSegment.replace(/-/g, "+").replace(/_/g, "/");
    const padded = normalized.padEnd(
      normalized.length + ((4 - (normalized.length % 4)) % 4),
      "=",
    );
    const payloadJson = atob(padded);
    return JSON.parse(payloadJson);
  } catch {
    return null;
  }
}

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [accessToken, setAccessToken] = useState(null);
  const [loading, setLoading] = useState(true);
  const hasOAuthAccessTokenInUrl =
    typeof window !== "undefined" &&
    new URLSearchParams(window.location.search).has("accessToken");

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
    if (hasOAuthAccessTokenInUrl) {
      setLoading(false);
      return;
    }

    tryRefresh();
  }, [hasOAuthAccessTokenInUrl, tryRefresh]);

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

  const completeOAuthLogin = async (token) => {
    const decoded = decodeJwtPayload(token);
    const fallbackUser =
      decoded?.userId || decoded?.email
        ? {
            id: decoded.userId,
            email: decoded.email,
            name: decoded.name,
            role: decoded.role || "user",
          }
        : null;

    if (fallbackUser) {
      applyAuthPayload({
        accessToken: token,
        user: fallbackUser,
      });
    }

    try {
      const { data } = await api.get("/api/auth/me", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      return applyAuthPayload({
        accessToken: token,
        user: data?.user || data,
      });
    } catch (error) {
      if (fallbackUser) {
        return fallbackUser;
      }
      throw error;
    }
  };

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
