const express = require("express");
const Review = require("../models/Review");
const router = express.Router();

// POST /api/reviews — add a new review
router.post("/", async (req, res) => {
  console.log("POST /api/reviews body:", req.body);

  try {
    // Basic validation
    const { productId, userName, rating, text } = req.body;
    if (!productId || !userName || rating == null || text == null) {
      return res
        .status(400)
        .json({ error: "Missing required fields", body: req.body });
    }

    const review = new Review(req.body);
    const savedReview = await review.save();

    console.log("Saved review:", savedReview);
    res.status(201).json(savedReview);
  } catch (err) {
    console.error("Error in POST /api/reviews:", err);
    res.status(500).json({ error: "Error saving review", details: err.message });
  }
});

// GET /api/reviews/:productId — get reviews for a product
router.get("/:productId", async (req, res) => {
  try {
    const reviews = await Review.find({ productId: req.params.productId });
    res.json(reviews);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error fetching reviews" });
  }
});

// PATCH /api/reviews/:reviewId — update a review
router.patch("/:reviewId", async (req, res) => {
  try {
    const { reviewId } = req.params;
    const updateFields = req.body;

    const updatedReview = await Review.findByIdAndUpdate(
      reviewId,
      updateFields,
      { new: true } // return the updated document
    );

    if (!updatedReview) {
      return res.status(404).json({ error: "Review not found" });
    }

    res.json(updatedReview);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error updating review" });
  }
});

// DELETE /api/reviews/:reviewId — delete a review
router.delete("/:reviewId", async (req, res) => {
  try {
    const { reviewId } = req.params;

    const deletedReview = await Review.findByIdAndDelete(reviewId);

    if (!deletedReview) {
      return res.status(404).json({ error: "Review not found" });
    }

    res.json({ 
      message: "Review deleted successfully", 
      deletedReview 
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error deleting review" });
  }
});


module.exports = router;
