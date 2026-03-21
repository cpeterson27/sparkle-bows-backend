// backend/routes/stripeWebhook.js - PRODUCTION VERSION
const express = require("express");
const router = express.Router();
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
const logger = require("../logger");
const Order = require("../models/orderModel");
const Cart = require("../models/cartModel");
const Product = require("../models/productModel");
const { sendOrderConfirmationEmail, sendOwnerNotification } = require("../services/emailService");
const waveService = require("../services/waveService");

// -------------------------
// STRIPE WEBHOOK ENDPOINT
// ✅ This handles payment success and updates tax/totals from Stripe
// -------------------------
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

        // ✅ PREVENT DUPLICATE PROCESSING (idempotency)
        if (order.status !== "pending") {
          logger.warn("Webhook already processed (order not pending)", {
            orderId: order._id,
            status: order.status,
          });
          return res.json({ received: true, message: "Already processed" });
        }

        // -------------------------
        // 4. GET TAX AND FINAL TOTAL FROM STRIPE (SOURCE OF TRUTH)
        // -------------------------
        const charge = paymentIntent.charges?.data[0];
        
        if (!charge) {
          logger.error("No charge found in payment intent", {
            paymentIntentId: paymentIntent.id,
          });
          return res.status(400).json({ error: "No charge found" });
        }

        // ✅ EXTRACT REAL TAX AMOUNT FROM STRIPE
        const taxAmount = charge.amount_captured - paymentIntent.amount;
        const tax = Math.max(0, taxAmount / 100); // Convert cents to dollars
        const total = charge.amount_captured / 100;

        // Calculate Stripe fee (will be in balance transaction)
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
            // Estimate fee if retrieval fails
            stripeFee = parseFloat((total * 0.029 + 0.3).toFixed(2));
          }
        } else {
          // Estimate fee
          stripeFee = parseFloat((total * 0.029 + 0.3).toFixed(2));
        }

        // -------------------------
        // 5. UPDATE ORDER WITH REAL VALUES FROM STRIPE
        // -------------------------
        order.tax = parseFloat(tax.toFixed(2));
        order.total = parseFloat(total.toFixed(2));
        order.stripeFee = parseFloat(stripeFee.toFixed(2));
        order.status = "processing";
        order.stripeChargeId = charge.id;

        await order.save();

        logger.info("✅ Order updated with Stripe tax and totals", {
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
        // 9. CREATE WAVE INVOICE (ACCOUNTING)
        // -------------------------
        try {
          const waveInvoice = await waveService.createInvoice({
            customerEmail: order.customerEmail,
            customerName: order.customerName,
            items: order.items,
            total: order.total,
          });

          if (waveInvoice && waveInvoice.id) {
            order.waveInvoiceId = waveInvoice.id;
            order.waveInvoiceNumber = waveInvoice.invoiceNumber;
            order.waveInvoicePdfUrl = waveInvoice.pdfUrl;
            await order.save();

            logger.info("✅ Wave invoice created", {
              orderId: order._id,
              waveInvoiceId: waveInvoice.id,
              waveInvoiceNumber: waveInvoice.invoiceNumber,
            });
          }
        } catch (waveErr) {
          logger.error("Failed to create Wave invoice", {
            orderId: order._id,
            error: waveErr.message,
          });
          // Don't fail order processing if Wave fails
        }

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
        // Still return 200 to Stripe so it doesn't retry
      }
      break;
    }

    case "payment_intent.payment_failed": {
      const paymentIntent = event.data.object;

      logger.error("❌ PaymentIntent failed", {
        paymentIntentId: paymentIntent.id,
        error: paymentIntent.last_payment_error?.message,
      });

      // Mark order as cancelled
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

  // -------------------------
  // 10. RESPOND TO STRIPE
  // -------------------------
  res.json({ received: true });
});

module.exports = router;