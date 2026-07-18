import api from "./axios.config";

// Get all reviews for a product
export const fetchReviews = (productId) => {
  return api.get(`/api/reviews/${productId}`);
};

// Add a new review
export const createReview = (review) => {
  return api.post("/api/reviews", review);
};

// Update an existing review
export const updateReview = (reviewId, updatedData) => {
  return api.patch(`/api/reviews/${reviewId}`, updatedData);
};


// Delete a review
export const deleteReview = (reviewId) => {
  return api.delete(`/api/reviews/${reviewId}`);
};
