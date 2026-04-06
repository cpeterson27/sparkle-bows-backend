// backend/routes/orders.js - PRODUCTION VERSION
const express = require("express");
const router = express.Router();
const Order = require("../models/orderModel");
const { verifyToken, verifyAdmin } = require("../middleware/auth");
const { sendTrackingEmail } = require("../services/emailService");
const logger = require("../logger");

// -------------------------
// PUBLIC: Fetch Order by ID (No Auth Required)
// -------------------------
router.get("/public/:idOrPi", async (req, res) => {
  const { idOrPi } = req.params;
  try {
    let order = null;

    // Try finding by MongoDB ID
    const isObjectId = /^[0-9a-fA-F]{24}$/.test(idOrPi);
    if (isObjectId) {
      order = await Order.findById(idOrPi).populate("items.productId");
    }

    // Fallback: search by Stripe PaymentIntent ID
    if (!order) {
      order = await Order.findOne({ stripePaymentIntentId: idOrPi }).populate(
        "items.productId"
      );
    }

    if (!order) {
      return res.status(404).json({ error: "Order not found" });
    }

    res.json(order);
  } catch (err) {
    logger.error("Public order fetch failed", { error: err.message });
    res.status(500).json({ error: "Could not fetch order" });
  }
});

// -------------------------
// USER: Get My Orders
// -------------------------
router.get("/my", verifyToken, async (req, res) => {
  try {
    const orders = await Order.find({
      userId: req.user.userId,
      status: { $ne: "pending" },
    })
      .populate("items.productId")
      .sort({ createdAt: -1 });
    res.json(orders);
  } catch (err) {
    logger.error("Fetch user orders failed", { error: err.message });
    res.status(500).json({ error: "Could not get orders" });
  }
});

// -------------------------
// USER/ADMIN: Get Single Order
// -------------------------
router.get("/:orderId", verifyToken, async (req, res) => {
  try {
    const { orderId } = req.params;
    const isObjectId = /^[0-9a-fA-F]{24}$/.test(orderId);

    const order = isObjectId
      ? await Order.findById(orderId).populate("items.productId")
      : await Order.findOne({ stripePaymentIntentId: orderId }).populate(
          "items.productId"
        );

    if (!order) return res.status(404).json({ error: "Order not found" });

    // Check authorization
    const isOwner = order.userId?.toString() === req.user.userId;
    const isAdmin = req.user.role === "admin";
    if (!isOwner && !isAdmin) {
      return res.status(403).json({ error: "Access denied" });
    }

    res.json(order);
  } catch (err) {
    logger.error("Fetch order failed", { error: err.message });
    res.status(500).json({ error: "Could not get order" });
  }
});

// -------------------------
// ADMIN: Get All Orders
// -------------------------
router.get("/", verifyToken, verifyAdmin, async (req, res) => {
  try {
    const orders = await Order.find()
      .populate("items.productId")
      .populate("userId", "name email")
      .sort({ createdAt: -1 });
    res.json(orders);
  } catch (err) {
    logger.error("Fetch all orders failed", { error: err.message });
    res.status(500).json({ error: "Could not get orders" });
  }
});

// -------------------------
// ADMIN: Update Order Status
// -------------------------
router.patch("/:orderId/status", verifyToken, verifyAdmin, async (req, res) => {
  try {
    const { status } = req.body;
    const validStatuses = ["pending", "processing", "shipped", "delivered", "cancelled"];
    
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: "Invalid status" });
    }

    const order = await Order.findByIdAndUpdate(
      req.params.orderId,
      { status },
      { new: true }
    ).populate("items.productId");

    if (!order) {
      return res.status(404).json({ error: "Order not found" });
    }

    logger.info("Order status updated", {
      orderId: order._id,
      newStatus: status,
    });

    res.json(order);
  } catch (err) {
    logger.error("Update order status failed", { error: err.message });
    res.status(500).json({ error: "Could not update order" });
  }
});

// -------------------------
// ADMIN: Add Tracking Number
// -------------------------
router.patch("/:orderId/tracking", verifyToken, verifyAdmin, async (req, res) => {
  try {
    const { trackingNumber, carrier } = req.body;

    if (!trackingNumber) {
      return res.status(400).json({ error: "Tracking number is required" });
    }

    const order = await Order.findById(req.params.orderId).populate("items.productId");

    if (!order) {
      return res.status(404).json({ error: "Order not found" });
    }

    // Update order
    order.trackingNumber = trackingNumber;
    order.carrier = carrier || "USPS";
    order.status = "shipped";
    await order.save();

    // Send tracking email to customer
    try {
      await sendTrackingEmail(order);
      logger.info("✅ Tracking email sent", {
        orderId: order._id,
        trackingNumber,
        email: order.customerEmail,
      });
    } catch (emailErr) {
      logger.error("Failed to send tracking email", {
        orderId: order._id,
        error: emailErr.message,
      });
      // Don't fail the request if email fails
    }

    logger.info("Tracking number added to order", {
      orderId: order._id,
      trackingNumber,
      carrier: order.carrier,
    });

    res.json(order);
  } catch (err) {
    logger.error("Add tracking number failed", { error: err.message });
    res.status(500).json({ error: "Could not add tracking number" });
  }
});

// -------------------------
// ADMIN: Delete Order (for testing only)
// -------------------------
router.delete("/:orderId", verifyToken, verifyAdmin, async (req, res) => {
  try {
    const order = await Order.findByIdAndDelete(req.params.orderId);

    if (!order) {
      return res.status(404).json({ error: "Order not found" });
    }

    logger.info("Order deleted", { orderId: req.params.orderId });
    res.json({ message: "Order deleted successfully" });
  } catch (err) {
    logger.error("Delete order failed", { error: err.message });
    res.status(500).json({ error: "Could not delete order" });
  }
});

module.exports = router;
