import api from "./axios.config";

export async function setupTwoFactor() {
  const { data } = await api.post("/api/auth/2fa/setup");
  return data;
}

export async function enableTwoFactor(code) {
  const { data } = await api.post("/api/auth/2fa/enable", { code });
  return data;
}

export async function disableTwoFactor(payload) {
  const { data } = await api.post("/api/auth/2fa/disable", payload);
  return data;
}

export async function regenerateRecoveryCodes(payload) {
  const { data } = await api.post("/api/auth/2fa/recovery-codes/regenerate", payload);
  return data;
}

export async function verifyTwoFactorLogin(payload) {
  const { data } = await api.post("/api/auth/2fa/verify", payload, {
    withCredentials: true,
  });
  return data;
}
