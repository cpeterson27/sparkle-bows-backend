const express = require("express");
const router = express.Router();
const productController = require("../controllers/productController");
const productModel = require("../models/productModel");

// GET all
router.get("/", productController.getProducts);

// GET one product
router.get("/:id", productController.getProductById);

// POST a review
router.post("/:id/reviews", productController.addReview);

module.exports = router;
