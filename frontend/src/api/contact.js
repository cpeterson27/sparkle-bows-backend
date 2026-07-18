import api from "./axios.config";

export async function sendContactMessage(payload) {
  const { data } = await api.post("/api/contact", payload);
  return data;
}
