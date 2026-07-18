// backend/routes/stripeWebhook.js - PRODUCTION VERSION
const express = require("express");
const router = express.Router();
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
const logger = require("../logger");
const Order = require("../models/orderModel");
const Cart = require("../models/cartModel");
const Product = require("../models/productModel");
const { sendOrderConfirmationEmail, sendOwnerNotification } = require("../services/emailService");

// Wave recording is handled by Zapier (Stripe → Wave Record Sale)
// waveService disabled to prevent duplicate entries

router.post("/", express.raw({ type: "application/json" }), async (req, res) => {
  const sig = req.headers["stripe-signature"];
  const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

  let event;

  // -------------------------
  // 1. VERIFY WEBHOOK SIGNATURE
  // -------------------------
  try {
    event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
  } catch (err) {
    logger.error("⚠️ Webhook signature verification failed", { error: err.message });
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // -------------------------
  // 2. HANDLE EVENT TYPES
  // -------------------------
  switch (event.type) {
    case "payment_intent.succeeded": {
      const paymentIntent = event.data.object;
      const metadata = paymentIntent.metadata || {};

      logger.info("✅ PaymentIntent succeeded", {
        paymentIntentId: paymentIntent.id,
        amount: paymentIntent.amount / 100,
      });

      try {
        // -------------------------
        // 3. FIND THE ORDER
        // -------------------------
        const order = await Order.findOne({
          stripePaymentIntentId: paymentIntent.id,
        }).populate("items.productId");

        if (!order) {
          logger.error("Order not found for PaymentIntent", {
            paymentIntentId: paymentIntent.id,
          });
          return res.status(404).json({ error: "Order not found" });
        }

        // Prevent duplicate processing
        if (order.status !== "pending") {
          logger.warn("Webhook already processed (order not pending)", {
            orderId: order._id,
            status: order.status,
          });
          return res.json({ received: true, message: "Already processed" });
        }

        // -------------------------
        // 4. GET TAX AND FINAL TOTAL FROM STRIPE
        // -------------------------
        const charge = paymentIntent.charges?.data[0];

        if (!charge) {
          logger.error("No charge found in payment intent", {
            paymentIntentId: paymentIntent.id,
          });
          return res.status(400).json({ error: "No charge found" });
        }

        const total = charge.amount_captured / 100;

        let stripeFee = 0;
        if (charge.balance_transaction) {
          try {
            const balanceTransaction = await stripe.balanceTransactions.retrieve(
              charge.balance_transaction
            );
            stripeFee = balanceTransaction.fee / 100;
          } catch (err) {
            logger.error("Failed to retrieve balance transaction", {
              error: err.message,
              chargeId: charge.id,
            });
            stripeFee = parseFloat((total * 0.029 + 0.3).toFixed(2));
          }
        } else {
          stripeFee = parseFloat((total * 0.029 + 0.3).toFixed(2));
        }

        // -------------------------
        // 5. UPDATE ORDER
        // -------------------------
        order.stripeFee = parseFloat(stripeFee.toFixed(2));
        order.status = "processing";
        order.stripeChargeId = charge.id;

        if (Math.abs(total - order.total) > 0.01) {
          logger.warn("Captured total differed from stored order total", {
            orderId: order._id,
            paymentIntentId: paymentIntent.id,
            orderTotal: order.total,
            capturedTotal: parseFloat(total.toFixed(2)),
          });
        }

        await order.save();

        logger.info("✅ Order updated with Stripe totals", {
          orderId: order._id,
          tax: order.tax,
          total: order.total,
          stripeFee: order.stripeFee,
        });

        // -------------------------
        // 6. UPDATE PRODUCT INVENTORY
        // -------------------------
        for (const item of order.items) {
          if (!item.productId) {
            logger.warn("Item missing productId", { orderId: order._id, item });
            continue;
          }

          await Product.findByIdAndUpdate(item.productId._id, {
            $inc: {
              inventory: -item.quantity,
              sales: item.quantity,
            },
          });

          logger.info("Inventory updated", {
            productId: item.productId._id,
            productName: item.name,
            quantitySold: item.quantity,
          });
        }

        // -------------------------
        // 7. CLEAR CART
        // -------------------------
        if (metadata.userId && metadata.userId !== "guest") {
          await Cart.findOneAndUpdate({ userId: metadata.userId }, { items: [] });
          logger.info("Cart cleared for user", { userId: metadata.userId });
        } else if (metadata.guestId) {
          await Cart.findOneAndUpdate({ guestId: metadata.guestId }, { items: [] });
          logger.info("Cart cleared for guest", { guestId: metadata.guestId });
        }

        // -------------------------
        // 8. SEND CONFIRMATION EMAILS
        // -------------------------
        try {
          await sendOrderConfirmationEmail(order);
          order.customerNotified = true;
          logger.info("✅ Customer confirmation email sent", {
            orderId: order._id,
            email: order.customerEmail,
          });
        } catch (emailErr) {
          logger.error("Failed to send customer email", {
            orderId: order._id,
            error: emailErr.message,
          });
        }

        try {
          await sendOwnerNotification(order);
          order.ownerNotified = true;
          logger.info("✅ Owner notification email sent", { orderId: order._id });
        } catch (emailErr) {
          logger.error("Failed to send owner email", {
            orderId: order._id,
            error: emailErr.message,
          });
        }

        await order.save();

        // -------------------------
        // Wave recording handled by Zapier — no backend call needed
        // -------------------------

        logger.info("🎉 Order processed successfully", {
          orderId: order._id,
          total: order.total,
          tax: order.tax,
          customerNotified: order.customerNotified,
          ownerNotified: order.ownerNotified,
        });
      } catch (err) {
        logger.error("Failed to process payment success", {
          error: err.message,
          stack: err.stack,
          paymentIntentId: paymentIntent.id,
        });
      }
      break;
    }

    case "payment_intent.payment_failed": {
      const paymentIntent = event.data.object;

      logger.error("❌ PaymentIntent failed", {
        paymentIntentId: paymentIntent.id,
        error: paymentIntent.last_payment_error?.message,
      });

      try {
        await Order.findOneAndUpdate(
          { stripePaymentIntentId: paymentIntent.id },
          { status: "cancelled" }
        );
        logger.info("Order marked as cancelled", {
          paymentIntentId: paymentIntent.id,
        });
      } catch (err) {
        logger.error("Failed to update failed order", { error: err.message });
      }
      break;
    }

    default:
      logger.info(`Unhandled webhook event type: ${event.type}`);
  }

  res.json({ received: true });
});

module.exports = router;
