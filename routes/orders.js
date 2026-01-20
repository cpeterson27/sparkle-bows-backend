const express = require("express");
const router = express.Router();
const Order = require("../models/orderModel");
const Cart = require("../models/cartModel");
const Product = require("../models/productModel");
const { verifyToken, verifyAdmin } = require("../middleware/auth");

// Create order from current user cart
router.post("/", verifyToken, async (req, res) => {
  try {
    const cart = await Cart.findOne({ userId: req.user._id });

    if (!cart || cart.items.length === 0) {
      return res.status(400).json({ error: "Cart is empty" });
    }

    const items = [];
    let total = 0;

    // Process each cart item
    for (const item of cart.items) {
      const product = await Product.findById(item.productId);
      if (!product) continue;

      items.push({
        productId: product._id,
        quantity: item.quantity,
        price: product.price,
      });

      total += product.price * item.quantity;

      // adjust inventory and product sales tracking
      if (product.inventory !== undefined) {
        product.inventory = Math.max(0, product.inventory - item.quantity);
      }
      product.sales = (product.sales || 0) + item.quantity;
      await product.save();
    }

    // Create the order
    const order = await Order.create({
      userId: req.user._id,
      items,
      total,
    });

    // Clear the cart
    await Cart.findOneAndUpdate({ userId: req.user._id }, { items: [] });

    res.status(201).json(order);
  } catch (err) {
    console.error("Order creation failed:", err);
    res.status(500).json({ error: "Could not create order" });
  }
});

// Current user’s orders
router.get("/my", verifyToken, async (req, res) => {
  try {
    const orders = await Order.find({ userId: req.user._id })
      .populate("items.productId");
    res.json(orders);
  } catch (err) {
    res.status(500).json({ error: "Could not get orders" });
  }
});

// Get one order details
router.get("/:orderId", verifyToken, async (req, res) => {
  try {
    const order = await Order.findById(req.params.orderId)
      .populate("items.productId");
    if (!order) {
      return res.status(404).json({ error: "Order not found" });
    }
    res.json(order);
  } catch (err) {
    res.status(500).json({ error: "Could not get order" });
  }
});

// Admin: list all orders
router.get("/", verifyAdmin, async (req, res) => {
  try {
    const orders = await Order.find().populate("items.productId");
    res.json(orders);
  } catch (err) {
    res.status(500).json({ error: "Could not get orders" });
  }
});

module.exports = router;
