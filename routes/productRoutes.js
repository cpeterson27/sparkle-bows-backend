// routes/productRoutes.js
const express = require("express");
const router = express.Router();
const productController = require("../controllers/productController");
const { verifyToken, verifyAdmin } = require("../middleware/auth");

// PUBLIC ROUTES (no auth required)

// GET all products
router.get("/", productController.getProducts);

// GET one product by ID
router.get("/:id", productController.getProductById);

// POST a review (public for now)
router.post("/:id/reviews", productController.addReview);

// ADMIN-ONLY ROUTES

// CREATE a product (admin only)
router.post(
  "/",
  verifyToken,
  verifyAdmin,
  productController.createProduct
);

// UPDATE a product by ID (admin only)
router.put(
  "/:id",
  verifyToken,
  verifyAdmin,
  productController.updateProduct
);

// DELETE a product by ID (admin only)
router.delete(
  "/:id",
  verifyToken,
  verifyAdmin,
  productController.deleteProduct
);

module.exports = router;