// routes/stripe.js
const express = require("express");
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
const { verifyToken } = require("../middleware/auth");
const Cart = require("../models/cartModel");
const Product = require("../models/productModel");

const router = express.Router();

// POST /api/stripe/create-payment-intent
router.post("/create-payment-intent", verifyToken, async (req, res) => {
  try {
    // Get user's cart
    const cart = await Cart.findOne({ userId: req.user._id });
    if (!cart || cart.items.length === 0) {
      return res.status(400).json({ error: "Cart is empty" });
    }

    // Calculate amount on the server
    let totalAmount = 0;
    for (const item of cart.items) {
      const product = await Product.findById(item.productId);
      if (!product) continue;
      totalAmount += product.price * item.quantity;
    }

    // Create Stripe PaymentIntent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(totalAmount * 100), // in cents
      currency: "usd",                         // adjust if needed
      automatic_payment_methods: { enabled: true },
    });

    // Send back client secret
    res.json({ clientSecret: paymentIntent.client_secret });
  } catch (err) {
    console.error("Stripe create payment intent error:", err);
    res.status(500).json({ error: "Failed to create payment intent" });
  }
});

module.exports = router;
