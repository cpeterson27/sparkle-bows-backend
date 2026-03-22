import React, { createContext, useState, useEffect, useCallback } from "react";
import api, { injectAccessTokenGetter, injectAccessTokenSetter } from "../api/axios.config";
import { fetchCurrentUser, updateCurrentUserProfile } from "../api/account";
import { verifyTwoFactorLogin as verifyTwoFactorLoginRequest } from "../api/security";

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [accessToken, setAccessToken] = useState(null);
  const [loading, setLoading] = useState(true);

  // Inject both getter and setter so the axios interceptor can
  // read and update the token automatically on 401s
  useEffect(() => {
    injectAccessTokenGetter(() => accessToken);
  }, [accessToken]);

  useEffect(() => {
    injectAccessTokenSetter((newToken) => {
      setAccessToken(newToken);
    });
  }, []);

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
      if (error.response?.status && error.response.status !== 401) {
        console.error("Session refresh failed:", error);
      }
      clearAuth();
    } finally {
      setLoading(false);
    }
  }, [applyAuthPayload]);

  // On mount: skip tryRefresh if this is an OAuth redirect
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const isOAuthRedirect = params.get("oauth") === "success";
    if (isOAuthRedirect) {
      setLoading(false);
    } else {
      tryRefresh();
    }
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

  const completeOAuthLogin = useCallback(async (oauthToken = "") => {
    if (oauthToken) {
      const { data } = await api.get("/api/auth/me", {
        headers: { Authorization: `Bearer ${oauthToken}` },
      });
      return applyAuthPayload({ ...data, accessToken: oauthToken });
    }
    await tryRefresh();
  }, [applyAuthPayload, tryRefresh]);

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