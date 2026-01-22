const express = require("express");
const bodyParser = require("body-parser");
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
const Product = require("../models/productModel");
const Order = require("../models/orderModel");
const { sendOrderEmails } = require("../controllers/emailController");
const { calculateShipping } = require("../utils/shippingCalculator");

const router = express.Router();

router.post(
  "/webhook",
  bodyParser.raw({ type: "application/json" }),
  async (req, res) => {
    const sig = req.headers["stripe-signature"];
    let event;

    try {
      event = stripe.webhooks.constructEvent(
        req.body,
        sig,
        process.env.STRIPE_WEBHOOK_SECRET
      );
    } catch (err) {
      console.error("Webhook signature verification failed:", err.message);
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    try {
      if (event.type === "payment_intent.succeeded") {
        const paymentIntent = event.data.object;
        const metadata = paymentIntent.metadata || {};
        const items = metadata.items ? JSON.parse(metadata.items) : [];

        // ------------------------
        // Recalculate subtotal & shipping server-side
        // ------------------------
        const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
        const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);
        const shippingCost = calculateShipping(subtotal, totalItems);
        const tax = parseFloat((metadata.tax || 0).toFixed(2));
        const total = subtotal + shippingCost + tax;
        const stripeFee = parseFloat((total * 0.029 + 0.3).toFixed(2));

        // ------------------------
        // Save order in DB
        // ------------------------
        const order = await Order.create({
          userId: metadata.userId || null,
          customerName: metadata.customerName || "Guest",
          customerEmail: metadata.customerEmail || null,
          items,
          subtotal,
          shippingCost,
          tax,
          total,
          stripeFee,
          stripePaymentIntentId: paymentIntent.id,
          shipping: paymentIntent.shipping || null,
          status: "processing",
        });

        // ------------------------
        // Update inventory
        // ------------------------
        for (const item of items) {
          if (!item.productId) continue;
          await Product.findByIdAndUpdate(item.productId, {
            $inc: { inventory: -item.quantity, sales: item.quantity },
          });
        }

        // ------------------------
        // Send confirmation emails
        // ------------------------
        await sendOrderEmails(order);
        console.log(`✅ Order ${order._id} saved, inventory updated, emails sent`);
      }

      res.json({ received: true });
    } catch (err) {
      console.error("Webhook processing error:", err);
      res.status(500).send("Webhook handler failed");
    }
  }
);

module.exports = router;
