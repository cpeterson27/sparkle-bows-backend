import api from "./axios.config";

export async function createLead(payload) {
  const { data } = await api.post("/api/leads", payload);
  return data;
}
