import api from "./axios.config";

async function tryRequest(requests, fallbackMessage) {
  let lastError = null;

  for (const request of requests) {
    try {
      return await request();
    } catch (error) {
      const status = error.response?.status;

      if (status === 404 || status === 405) {
        lastError = error;
        continue;
      }

      throw error;
    }
  }

  const error = new Error(fallbackMessage);
  error.cause = lastError;
  throw error;
}

export async function updateCurrentUserProfile(profileData) {
  const response = await tryRequest(
    [
      () => api.patch("/api/auth/update-profile", profileData),
      () => api.patch("/api/auth/me", profileData),
    ],
    "Profile update endpoint is not available yet.",
  );

  return response.data;
}

export async function fetchCurrentUser() {
  const response = await api.get("/api/auth/me");
  return response.data;
}

export async function fetchUserAddresses() {
  const response = await api.get("/api/user/addresses");
  return response.data?.addresses || [];
}

export async function savePrimaryAddress(addressData) {
  const existingAddresses = await fetchUserAddresses();
  const defaultAddress =
    existingAddresses.find((address) => address.isDefault) ||
    existingAddresses[0];

  const payload = {
    label: "Shipping",
    line1: addressData.line1,
    line2: addressData.line2 || "",
    city: addressData.city,
    state: addressData.state,
    postalCode: addressData.postalCode,
    country: addressData.country || "US",
    isDefault: true,
  };

  if (defaultAddress?._id) {
    const response = await api.put(
      `/api/user/addresses/${defaultAddress._id}`,
      payload,
    );
    return response.data;
  }

  const response = await api.post("/api/user/addresses", payload);
  return response.data;
}

export async function updateCurrentUserPassword(passwordData) {
  const response = await tryRequest(
    [
      () => api.patch("/api/auth/change-password", passwordData),
      () => api.post("/api/auth/change-password", passwordData),
      () => api.patch("/api/auth/update-password", passwordData),
      () => api.post("/api/auth/update-password", passwordData),
    ],
    "Password update endpoint is not available yet.",
  );

  return response.data;
}

export async function deleteCurrentUserAccount() {
  const response = await tryRequest(
    [
      () => api.delete("/api/auth/delete-account"),
      () => api.delete("/api/auth/me"),
      () => api.delete("/api/users/me"),
    ],
    "Account deletion endpoint is not available yet.",
  );

  return response.data;
}
