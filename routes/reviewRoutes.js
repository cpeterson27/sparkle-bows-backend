const express = require("express");
const Review = require("../models/Review");
const router = express.Router();

// ------------------------
// GET /api/reviews/featured — Get top reviews for homepage
// Returns up to 6 reviews with rating >= 4, sorted by most recent
// Must be defined BEFORE /:productId to avoid route conflict
// ------------------------
router.get("/featured", async (req, res) => {
  try {
    const reviews = await Review.find({ rating: { $gte: 4 } })
      .sort({ date: -1 })
      .limit(6);
    return res.json(reviews);
  } catch (err) {
    console.error("Error fetching featured reviews:", err);
    return res.status(500).json({ error: "Error fetching featured reviews" });
  }
});

// ------------------------
// POST /api/reviews — Add a new review
// ------------------------
router.post("/", async (req, res) => {
  try {
    const { productId, userName, rating, text } = req.body;

    if (!productId || !userName || rating == null || text == null) {
      return res.status(400).json({
        error: "Missing required fields",
        required: ["productId", "userName", "rating", "text"],
      });
    }

    const review = new Review({ productId, userName, rating, text });
    const savedReview = await review.save();

    return res.status(201).json(savedReview);
  } catch (err) {
    console.error("Error saving review:", err);
    return res.status(500).json({ error: "Error saving review", details: err.message });
  }
});

// ------------------------
// GET /api/reviews/:productId — Get all reviews for a product
// ------------------------
router.get("/:productId", async (req, res) => {
  try {
    const reviews = await Review.find({ productId: req.params.productId });
    return res.json(reviews);
  } catch (err) {
    console.error("Error fetching reviews:", err);
    return res.status(500).json({ error: "Error fetching reviews" });
  }
});

// ------------------------
// PATCH /api/reviews/:reviewId — Update a review
// ------------------------
router.patch("/:reviewId", async (req, res) => {
  try {
    const { reviewId } = req.params;
    const updatedReview = await Review.findByIdAndUpdate(
      reviewId,
      req.body,
      { new: true }
    );
    if (!updatedReview) {
      return res.status(404).json({ error: "Review not found" });
    }
    return res.json(updatedReview);
  } catch (err) {
    console.error("Error updating review:", err);
    return res.status(500).json({ error: "Error updating review" });
  }
});

// ------------------------
// DELETE /api/reviews/:reviewId — Delete a review
// ------------------------
router.delete("/:reviewId", async (req, res) => {
  try {
    const { reviewId } = req.params;
    const deletedReview = await Review.findByIdAndDelete(reviewId);
    if (!deletedReview) {
      return res.status(404).json({ error: "Review not found" });
    }
    return res.json({ message: "Review deleted successfully", deletedReview });
  } catch (err) {
    console.error("Error deleting review:", err);
    return res.status(500).json({ error: "Error deleting review" });
  }
});

module.exports = router;