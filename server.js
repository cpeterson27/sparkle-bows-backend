const express = require("express");
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
const Product = require("../models/productModel");
const { optionalAuth } = require("../middleware/auth");
const { calculateShipping } = require("../utils/shippingCalculator");

const router = express.Router();

// ------------------------
// CREATE PAYMENT INTENT
// ------------------------
router.post("/create-payment-intent", optionalAuth, async (req, res) => {
  try {
    const userId = req.user?._id?.toString() || null;
    let guestId = req.cookies?.guestId || null;

    // Generate guestId if neither logged-in nor cookie exists
    if (!userId && !guestId) {
      const newGuestId = Math.random().toString(36).substring(2, 15);
      res.cookie("guestId", newGuestId, { httpOnly: true, sameSite: "lax" });
      guestId = newGuestId;
    }

    const { items: frontendItems, customerName, customerEmail, shippingInfo } = req.body;

    if (!frontendItems || frontendItems.length === 0)
      return res.status(400).json({ error: "No items to purchase" });

    // ------------------------
    // Validate items & calculate subtotal
    // ------------------------
    const validatedItems = [];
    let subtotal = 0;

    for (const item of frontendItems) {
      const product = await Product.findById(item.productId);
      if (!product) return res.status(400).json({ error: `Product not found: ${item.name}` });
      if (item.quantity > product.inventory)
        return res.status(400).json({ error: `Not enough stock for: ${product.name}` });

      validatedItems.push({
        productId: product._id.toString(),
        name: product.name,
        quantity: item.quantity,
        price: product.price,
      });

      subtotal += product.price * item.quantity;
    }

    // ------------------------
    // Calculate shipping server-side
    // ------------------------
    const totalItems = validatedItems.reduce((sum, i) => sum + i.quantity, 0);
    const shippingCost = calculateShipping(subtotal, totalItems);
    const totalAmount = subtotal + shippingCost;

    // ------------------------
    // Determine final shipping address
    // ------------------------
    let finalShipping;
    if (shippingInfo) {
      finalShipping = {
        name: shippingInfo.name,
        address: {
          line1: shippingInfo.line1,
          line2: shippingInfo.line2 || "",
          city: shippingInfo.city,
          state: shippingInfo.state,
          postal_code: shippingInfo.postalCode,
          country: shippingInfo.country || "US",
        },
      };
    } else if (req.user?.address) {
      finalShipping = {
        name: req.user.name,
        address: {
          line1: req.user.address.line1 || "",
          line2: req.user.address.line2 || "",
          city: req.user.address.city || "",
          state: req.user.address.state || "",
          postal_code: req.user.address.postalCode || "",
          country: req.user.address.country || "US",
        },
      };
    }

    // ------------------------
    // Create Stripe PaymentIntent
    // ------------------------
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(totalAmount * 100), // cents
      currency: "usd",
      automatic_payment_methods: { enabled: true },
      receipt_email: customerEmail || undefined,
      metadata: {
        userId: userId || null,
        guestId: userId ? null : guestId,
        customerEmail: customerEmail || "",
        customerName: customerName || "",
        items: JSON.stringify(validatedItems),
        subtotal: subtotal.toFixed(2),
        shippingCost: shippingCost.toFixed(2),
        tax: (0).toFixed(2),
        total: totalAmount.toFixed(2),
      },
      shipping: finalShipping,
    });

    return res.json({ clientSecret: paymentIntent.client_secret });
  } catch (err) {
    console.error("Stripe PaymentIntent error:", err);
    return res.status(500).json({ error: "Failed to create payment intent" });
  }
});

module.exports = router;
