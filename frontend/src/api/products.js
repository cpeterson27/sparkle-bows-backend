import api from "./axios.config";

// Fetch all products
export const fetchProducts = () => {
  return api.get("/api/products");
};

// Fetch one product by ID
export const fetchProductById = (id) => {
  return api.get(`/api/products/${id}`);
};

// Add more product APIs later if needed (create/update/delete)

