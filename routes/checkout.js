const express = require("express");
const router = express.Router();
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
const { optionalAuth } = require("../middleware/auth"); // optional auth
const logger = require("../logger");

// POST /api/checkout - Create Stripe checkout session
router.post("/", optionalAuth, async (req, res) => {
  try {
    const {
      items,
      customerName: bodyName,
      customerEmail: bodyEmail,
      tax: taxFromClient = 0,
    } = req.body;

    if (!items || items.length === 0) {
      return res.status(400).json({ error: "Cart is empty" });
    }

    // -------------------------
    // Subtotal calculation
    // -------------------------
    const subtotal = parseFloat(
      items
        .reduce((sum, item) => sum + item.price * item.quantity, 0)
        .toFixed(2),
    );

    const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);

    // -------------------------
    // Shipping calculation
    // -------------------------
    let shippingCost = 0;
    if (subtotal < 50) {
      shippingCost = 5.99;
      if (itemCount > 3) shippingCost += (itemCount - 3) * 1.0;
    }
    shippingCost = parseFloat(shippingCost.toFixed(2));
    const tax = parseFloat(taxFromClient);

    // -------------------------
    // Build Stripe line items
    // -------------------------
    const lineItems = items.map((item) => ({
      price_data: {
        currency: "usd",
        product_data: {
          name: item.name,
          images: item.images?.[0]?.url ? [item.images[0].url] : [],
        },
        unit_amount: Math.round(item.price * 100), // cents
      },
      quantity: item.quantity,
    }));

    if (shippingCost > 0) {
      lineItems.push({
        price_data: {
          currency: "usd",
          product_data: { name: "Shipping" },
          unit_amount: Math.round(shippingCost * 100),
        },
        quantity: 1,
      });
    }

    // -------------------------
    // Customer info
    // -------------------------
    const userId = req.user?._id || null;
    const customerName = req.user?.name || bodyName || "Guest";
    const customerEmail = req.user?.email || bodyEmail || null;

    // -------------------------
    // Create Stripe Checkout Session
    // -------------------------
    const total = parseFloat((subtotal + shippingCost + tax).toFixed(2));
    const stripeFee = parseFloat((total * 0.029 + 0.3).toFixed(2));

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: lineItems,
      mode: "payment",
      success_url: `${process.env.FRONTEND_URL}/thank-you/{CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.FRONTEND_URL}/?canceled=true`,
      customer_email: customerEmail,
      metadata: {
        userId: userId?.toString() || null,
        customerName,
        customerEmail,
        items: JSON.stringify(
          items.map((i) => ({
            productId: i.productId || i._id,
            name: i.name,
            quantity: i.quantity,
            price: i.price,
          })),
        ),
        subtotal,
        shippingCost,
        tax,
        total,
        stripeFee,
      },
    });

    logger.info("Stripe checkout session created", {
      sessionId: session.id,
      userId,
      customerEmail,
    });

    res.json({ url: session.url });
  } catch (err) {
    console.error("Checkout error:", err);
    logger.error("Checkout failed", { error: err.message });
    res.status(500).json({ error: "Checkout failed", message: err.message });
  }
});

module.exports = router;
