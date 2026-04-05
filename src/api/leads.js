import api from "./axios.config";

/**
 * Create a new lead and subscribe to VIP list
 * @param {Object} payload - { firstName, email, source }
 */
export async function createLead(payload) {
  const { data } = await api.post("/api/leads", payload);
  return data;
}

/**
 * Check if the user is already VIP subscribed
 * @param {string} email
 * @returns {Promise<{ vipSubscribed: boolean }>}
 */
export async function getKlaviyoVipStatus(email) {
  if (!email) return { vipSubscribed: false };
  const { data } = await api.get(
    `/api/leads/klaviyo-status?email=${encodeURIComponent(email)}`,
  );
  return data;
}
