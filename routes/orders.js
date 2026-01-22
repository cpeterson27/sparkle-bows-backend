// routes/orders.js - COMPLETE WITH NOTIFICATIONS
const express = require("express");
const router = express.Router();
const Order = require("../models/orderModel");
const Cart = require("../models/cartModel");
const Product = require("../models/productModel");
const { verifyToken, verifyAdmin } = require("../middleware/auth");
const logger = require("../logger");

// Email configuration (using free service)
const nodemailer = require("nodemailer");

// Create email transporter
const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 587,
  secure: false,
  auth: {
    user: process.env.EMAIL_USER, // Your Gmail
    pass: process.env.EMAIL_APP_PASSWORD, // Gmail App Password
  },
});

// Helper function to send emails
async function sendOrderEmails(order, user) {
  try {
    const orderItems = order.items
      .map(item => `${item.productId?.name || 'Product'} x${item.quantity} - $${(item.price * item.quantity).toFixed(2)}`)
      .join('\n');

    // Email to customer
    const customerEmail = {
      from: '"Sparkle & Twirl Bows" <' + process.env.EMAIL_USER + '>',
      to: user.email,
      subject: `Order Confirmation #${order._id.toString().slice(-8)}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #ec4899;">Thank You for Your Order! 🎀</h1>
          <p>Hi ${user.name},</p>
          <p>We've received your order and we're so excited to make your sparkly bows!</p>
          
          <div style="background: #fdf2f8; padding: 20px; border-radius: 10px; margin: 20px 0;">
            <h2 style="color: #ec4899;">Order #${order._id.toString().slice(-8)}</h2>
            <p style="white-space: pre-line;">${orderItems}</p>
            <hr>
            <p style="font-size: 18px;"><strong>Total: $${order.total.toFixed(2)}</strong></p>
          </div>
          
          <p>You can track your order at: <a href="${process.env.FRONTEND_URL}/orders/${order._id}">View Order Status</a></p>
          
          <p>Thank you for supporting my small business!</p>
          <p style="color: #ec4899;">✨ Made with love by a 7-year-old ballerina ✨</p>
        </div>
      `,
    };

    // Email to YOU (shop owner)
    const ownerEmail = {
      from: '"Bow Shop Notification" <' + process.env.EMAIL_USER + '>',
      to: process.env.OWNER_EMAIL || process.env.EMAIL_USER,
      subject: `🎉 NEW ORDER #${order._id.toString().slice(-8)}!`,
      html: `
        <div style="font-family: Arial, sans-serif;">
          <h1 style="color: #22c55e;">🎉 You Got a New Order!</h1>
          
          <div style="background: #f0fdf4; padding: 20px; border-radius: 10px; margin: 20px 0;">
            <h2>Order #${order._id.toString().slice(-8)}</h2>
            <p><strong>Customer:</strong> ${user.name}</p>
            <p><strong>Email:</strong> ${user.email}</p>
            <p><strong>Items:</strong></p>
            <p style="white-space: pre-line;">${orderItems}</p>
            <hr>
            <p style="font-size: 20px;"><strong>Total: $${order.total.toFixed(2)}</strong></p>
            <p style="font-size: 14px; color: #666;">
              Stripe Fee: ~$${(order.total * 0.029 + 0.30).toFixed(2)}<br>
              Your Profit: ~$${(order.total - (order.total * 0.029 + 0.30)).toFixed(2)}
            </p>
          </div>
          
          <p><a href="${process.env.FRONTEND_URL}/admin" style="background: #ec4899; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">View in Admin Dashboard</a></p>
        </div>
      `,
    };

    // Send both emails
    await Promise.all([
      transporter.sendMail(customerEmail),
      transporter.sendMail(ownerEmail),
    ]);

    logger.info("Order emails sent successfully", { orderId: order._id });
  } catch (err) {
    logger.error("Failed to send order emails", { error: err.message });
    // Don't fail the order if email fails
  }
}

// Create order from cart
router.post("/", verifyToken, async (req, res) => {
  try {
    const cart = await Cart.findOne({ userId: req.user.userId }).populate('items.productId');

    if (!cart || cart.items.length === 0) {
      return res.status(400).json({ error: "Cart is empty" });
    }

    const items = [];
    let subtotal = 0;

    // Process each cart item
    for (const item of cart.items) {
      const product = await Product.findById(item.productId._id);
      if (!product) continue;

      // Check inventory
      if (product.inventory < item.quantity) {
        return res.status(400).json({ 
          error: `Not enough inventory for ${product.name}. Only ${product.inventory} available.` 
        });
      }

      items.push({
        productId: product._id,
        quantity: item.quantity,
        price: product.price,
      });

      subtotal += product.price * item.quantity;
    }

    // Calculate fees
    const stripeFee = subtotal * 0.029 + 0.30;
    const total = subtotal;

    // Create the order
    const order = await Order.create({
      userId: req.user.userId,
      items,
      subtotal,
      stripeFee,
      total,
      status: "processing",
    });

    // Update inventory and sales
    for (const item of items) {
      const product = await Product.findById(item.productId);
      if (product) {
        product.inventory = Math.max(0, product.inventory - item.quantity);
        product.sales = (product.sales || 0) + item.quantity;
        await product.save();
      }
    }

    // Clear the cart
    await Cart.findOneAndUpdate({ userId: req.user.userId }, { items: [] });

    // Populate product details for email
    const populatedOrder = await Order.findById(order._id).populate('items.productId');

    // Send emails
    await sendOrderEmails(populatedOrder, {
      name: req.user.name,
      email: req.user.email,
    });

    logger.info("Order created successfully", {
      orderId: order._id,
      userId: req.user.userId,
      total: order.total,
    });

    res.status(201).json(order);
  } catch (err) {
    console.error("Order creation failed:", err);
    logger.error("Order creation failed", { error: err.message });
    res.status(500).json({ error: "Could not create order" });
  }
});

// Get current user's orders
router.get("/my", verifyToken, async (req, res) => {
  try {
    const orders = await Order.find({ userId: req.user.userId })
      .populate("items.productId")
      .sort({ createdAt: -1 });
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

    // Make sure user owns this order (or is admin)
    if (order.userId.toString() !== req.user.userId && req.user.role !== 'admin') {
      return res.status(403).json({ error: "Access denied" });
    }

    res.json(order);
  } catch (err) {
    res.status(500).json({ error: "Could not get order" });
  }
});

// Admin: Update order status
router.patch("/:orderId/status", verifyToken, verifyAdmin, async (req, res) => {
  try {
    const { status } = req.body;
    
    if (!["processing", "shipped", "delivered", "cancelled"].includes(status)) {
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
      admin: req.user.email,
    });

    res.json(order);
  } catch (err) {
    res.status(500).json({ error: "Could not update order" });
  }
});

// Admin: list all orders
router.get("/", verifyToken, verifyAdmin, async (req, res) => {
  try {
    const orders = await Order.find()
      .populate("items.productId")
      .populate("userId", "name email")
      .sort({ createdAt: -1 });
    res.json(orders);
  } catch (err) {
    res.status(500).json({ error: "Could not get orders" });
  }
});

module.exports = router;