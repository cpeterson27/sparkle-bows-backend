const express = require("express");
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
const Product = require("../models/productModel");
const Order = require("../models/orderModel");
const Cart = require("../models/cartModel");
const { optionalAuth } = require("../middleware/auth");
const { calculateShipping } = require("../utils/shippingCalculator");
const logger = require("../logger");

const router = express.Router();

router.post("/create-payment-intent", optionalAuth, async (req, res) => {
  try {
    const { customerName, customerEmail, shippingInfo, isGift, giftMessage } = req.body;

    /* ------------------ VALIDATION ------------------ */
    if (!customerName || !customerEmail) {
      return res.status(400).json({ error: "Name and email are required" });
    }

    if (!shippingInfo?.line1 || !shippingInfo?.city || !shippingInfo?.state || !shippingInfo?.postalCode) {
      return res.status(400).json({ error: "Complete shipping address required" });
    }

    /* ------------------ LOAD CART ------------------
     * 1. By userId if logged in
     * 2. By signed guestId cookie
     * 3. By unsigned guestId cookie (cross-domain cookie fallback)
     * 4. By refreshToken cookie userId (last resort)
     */
    const userId = req.user?.userId;
    const guestId = req.signedCookies?.guestId || req.cookies?.guestId;

    let cart;

    if (userId) {
      cart = await Cart.findOne({ userId }).populate("items.productId");
    }

    if (!cart && guestId) {
      cart = await Cart.findOne({ guestId }).populate("items.productId");
    }

    if (!cart && req.cookies?.refreshToken) {
      try {
        const jwt = require("jsonwebtoken");
        const decoded = jwt.verify(req.cookies.refreshToken, process.env.JWT_REFRESH_SECRET);
        if (decoded?.userId) {
          cart = await Cart.findOne({ userId: decoded.userId }).populate("items.productId");
        }
      } catch (_) {}
    }

    if (!cart || cart.items.length === 0) {
      return res.status(400).json({ error: "Cart is empty" });
    }

    /* ------------------ VALIDATE INVENTORY ------------------ */
    let subtotal = 0;
    const orderItems = [];

    for (const item of cart.items) {
      const product = await Product.findById(item.productId?._id);
      if (!product) {
        return res.status(400).json({ error: "Product no longer exists" });
      }
      if (product.inventory < item.quantity) {
        return res.status(400).json({ error: `Not enough stock for ${product.name}` });
      }

      subtotal += product.price * item.quantity;
      orderItems.push({
        productId: product._id,
        name: product.name,
        quantity: item.quantity,
        price: product.price,
      });
    }

    /* ------------------ SHIPPING ------------------ */
    const totalQty = orderItems.reduce((sum, i) => sum + i.quantity, 0);
    const shippingCost = calculateShipping(subtotal, totalQty);

    /* ------------------ STRIPE PAYMENT INTENT ------------------ */
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round((subtotal + shippingCost) * 100),
      currency: "usd",
      automatic_payment_methods: { enabled: true },
      automatic_tax: { enabled: true },
      shipping: {
        name: customerName,
        address: {
          line1: shippingInfo.line1,
          line2: shippingInfo.line2 || undefined,
          city: shippingInfo.city,
          state: shippingInfo.state,
          postal_code: shippingInfo.postalCode,
          country: shippingInfo.country || "US",
        },
      },
      receipt_email: customerEmail,
      metadata: {
        orderType: "checkout",
        isGift: isGift ? "true" : "false",
        giftMessage: giftMessage || "",
      },
    });

    /* ------------------ CREATE ORDER ------------------ */
    const order = await Order.create({
      userId: userId || null,
      customerName,
      customerEmail,
      items: orderItems,
      subtotal,
      shippingCost,
      tax: 0, // final tax set by webhook after Stripe calculates it
      total: subtotal + shippingCost,
      status: "pending",
      shippingAddress: shippingInfo,
      stripePaymentIntentId: paymentIntent.id,
      isGift: !!isGift,
      giftMessage: giftMessage || "",
    });

    logger.info("Stripe PI created", {
      paymentIntentId: paymentIntent.id,
      orderId: order._id,
    });

    res.json({
      clientSecret: paymentIntent.client_secret,
      orderId: order._id,
    });
  } catch (err) {
    logger.error("Stripe create-payment-intent failed", {
      message: err.message,
      stack: err.stack,
    });
    res.status(500).json({ error: "Could not create payment intent" });
  }
});

module.exports = router;