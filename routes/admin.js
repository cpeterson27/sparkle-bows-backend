// routes/admin.js
const express = require("express");
const Order = require("../models/orderModel");
const Product = require("../models/productModel");
const User = require("../models/User"); 
const { verifyToken, verifyAdmin } = require("../middleware/auth");

const router = express.Router();

// Protect all admin routes
router.use(verifyToken, verifyAdmin);

// GET /api/admin/stats — High level site stats
router.get("/stats", async (req, res) => {
  try {
    const userCount = await User.countDocuments();
    const productCount = await Product.countDocuments();
    const orderCount = await Order.countDocuments();
    const salesTotal = await Order.aggregate([
      { $unwind: "$items" },
      { $group: { _id: null, total: { $sum: "$items.quantity" } } },
    ]);

    res.json({
      userCount,
      productCount,
      orderCount,
      salesTotal: salesTotal[0]?.total || 0,
    });
  } catch (err) {
    console.error("Error getting admin stats:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// GET /api/admin/orders - list all orders
router.get("/orders", async (req, res) => {
  try {
    const orders = await Order.find().populate("items.productId");
    res.json(orders);
  } catch (err) {
    console.error("Error fetching orders:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// DELETE /api/admin/product/:id — delete a product
router.delete("/product/:id", async (req, res) => {
  try {
    await Product.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (err) {
    console.error("Error deleting product:", err);
    res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;
