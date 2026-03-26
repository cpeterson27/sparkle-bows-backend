// controllers/orderController.js
const Order = require("../models/orderModel");
const Cart = require("../models/cartModel");
const Product = require("../models/productModel");
const nodemailer = require("nodemailer");
const logger = require("../logger");

// -------------------------
// Email Transporter
// -------------------------
const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 465,       // SSL port
  secure: true,    // use SSL
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD,
  },
});

// -------------------------
// Send Order Emails with Shipping Address & Gift Message
// -------------------------
async function sendOrderEmails(order) {
  try {
    const itemsText = order.items
      .map(i => `${i.name} x${i.quantity} - $${(i.price * i.quantity).toFixed(2)}`)
      .join("\n");

    const shippingText = order.shippingAddress?.line1
      ? `
        <p><strong>Shipping Address:</strong><br/>
        ${order.shippingAddress.name || order.customerName}<br/>
        ${order.shippingAddress.line1}<br/>
        ${order.shippingAddress.line2 ? `${order.shippingAddress.line2}<br/>` : ""}
        ${order.shippingAddress.city}, ${order.shippingAddress.state} ${order.shippingAddress.postalCode}<br/>
        ${order.shippingAddress.country || "US"}
        </p>
      `
      : "";

    const giftSection = order.isGift
      ? `
        <div style="background: #fff0f5; border: 2px solid #ff69b4; border-radius: 8px; padding: 16px; margin: 16px 0;">
          <p style="margin: 0; color: #ff1493; font-weight: bold;">🎁 This is a Gift Order</p>
          ${order.giftMessage ? `<p style="margin: 8px 0 0 0; font-style: italic;">"${order.giftMessage}"</p>` : ""}
        </div>
      `
      : "";

    // Customer Email
    const customerEmail = {
      from: `"Sparkle & Twirl Bows" <${process.env.GMAIL_USER}>`,
      to: order.customerEmail,
      subject: `Order Confirmation #${order._id.toString().slice(-8)}`,
      html: `
        <h1>Thank you for your order! 🎀</h1>
        <p>Hi ${order.customerName},</p>
        <p>Your order has been received:</p>
        <pre>${itemsText}</pre>
        <p><strong>Total: $${order.total.toFixed(2)}</strong></p>
        ${giftSection}
        ${shippingText}
        <p>Track your order: <a href="${process.env.FRONTEND_URL}/thank-you/${order._id}">View Order</a></p>
      `,
    };

    // Owner/Admin Email
    const ownerEmail = {
      from: `"Bow Shop Notification" <${process.env.GMAIL_USER}>`,
      to: process.env.OWNER_EMAIL || process.env.GMAIL_USER,
      subject: `NEW ORDER #${order._id.toString().slice(-8)}`,
      html: `
        <h1>New Order Received 🎉</h1>
        <p>Customer: ${order.customerName} (${order.customerEmail})</p>
        <pre>${itemsText}</pre>
        <p><strong>Total: $${order.total.toFixed(2)}</strong></p>
        ${giftSection}
        ${shippingText}
      `,
    };

    await Promise.all([
      transporter.sendMail(customerEmail),
      transporter.sendMail(ownerEmail),
    ]);

    logger.info("Order emails sent", { orderId: order._id });
  } catch (err) {
    logger.error("Failed to send order emails", { error: err.message });
  }
}

// -------------------------
// Create Order from Stripe Webhook
// -------------------------
exports.createOrderFromStripe = async (paymentIntent, metadata) => {
  try {
    const { userId, customerName, customerEmail, shippingAddress, isGift } = metadata;
    const shipping = shippingAddress ? JSON.parse(shippingAddress) : {};

    let cart;
    if (userId && userId !== "null") {
      cart = await Cart.findOne({ userId }).populate("items.productId");
    } else {
      logger.warn("Guest cart not fully implemented yet");
      return null;
    }

    if (!cart || !cart.items.length) {
      logger.error("Cart is empty", { userId });
      return null;
    }

    const items = [];
    let subtotal = 0;

    for (const item of cart.items) {
      const product = await Product.findById(item.productId._id);
      if (!product) continue;

      items.push({
        productId: product._id,
        name: product.name,
        quantity: item.quantity,
        price: product.price,
        cost: product.materialCost || 0,
      });

      subtotal += product.price * item.quantity;

      await Product.findByIdAndUpdate(product._id, {
        $inc: { inventory: -item.quantity, sales: item.quantity },
      });
    }

    const order = await Order.create({
      userId: userId && userId !== "null" ? userId : null,
      customerName,
      customerEmail,
      items,
      subtotal,
      shippingCost: 0,
      tax: 0,
      total: paymentIntent.amount / 100,
      status: "processing",
      shippingAddress: shipping,
      isGift: isGift === "true",
      giftMessage: metadata.giftMessage || "",
      stripePaymentIntentId: paymentIntent.id,
      stripeChargeId: paymentIntent.charges?.data[0]?.id,
    });

    if (userId && userId !== "null") {
      await Cart.findOneAndUpdate({ userId }, { items: [] });
    }

    const populatedOrder = await Order.findById(order._id).populate("items.productId");
    await sendOrderEmails(populatedOrder);

    logger.info("Order created from Stripe webhook", { orderId: order._id });
    return order;
  } catch (err) {
    logger.error("Failed to create order from Stripe", { error: err.message });
    throw err;
  }
};

// -------------------------
// Get Order (Public or Auth)
// -------------------------
exports.getOrder = async (req, res) => {
  try {
    const { orderId } = req.params;
    const isObjectId = /^[0-9a-fA-F]{24}$/.test(orderId);

    let order;
    if (isObjectId) {
      order = await Order.findById(orderId).populate("items.productId");
    } else {
      order = await Order.findOne({ stripePaymentIntentId: orderId }).populate("items.productId");
    }

    if (!order) return res.status(404).json({ error: "Order not found" });

    const isOwner = req.user?.userId && order.userId?.toString() === req.user.userId;
    const isAdmin = req.user?.role === "admin";
    const isPublicRoute = req.path.includes("/public/");

    if (!isPublicRoute && !isOwner && !isAdmin) {
      return res.status(403).json({ error: "Access denied" });
    }

    res.json(order);
  } catch (err) {
    logger.error("Fetch order failed", { error: err.message });
    res.status(500).json({ error: "Could not fetch order" });
  }
};

// -------------------------
// Get User Orders
// -------------------------
exports.getUserOrders = async (req, res) => {
  try {
    const orders = await Order.find({ userId: req.user.userId })
      .populate("items.productId")
      .sort({ createdAt: -1 });
    res.json(orders);
  } catch (err) {
    logger.error("Fetch user orders failed", { error: err.message });
    res.status(500).json({ error: "Could not get orders" });
  }
};

// -------------------------
// Update Order Status (Admin)
// -------------------------
exports.updateOrderStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const valid = ["processing", "shipped", "delivered", "cancelled"];
    if (!valid.includes(status)) return res.status(400).json({ error: "Invalid status" });

    const order = await Order.findByIdAndUpdate(
      req.params.orderId,
      { status },
      { new: true }
    ).populate("items.productId");

    if (!order) return res.status(404).json({ error: "Order not found" });

    res.json(order);
  } catch (err) {
    logger.error("Update order status failed", { error: err.message });
    res.status(500).json({ error: "Could not update order" });
  }
};

// -------------------------
// Get All Orders (Admin)
// -------------------------
exports.getAllOrders = async (req, res) => {
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
};

// -------------------------
// Export
// -------------------------
module.exports = {
  createOrderFromStripe: exports.createOrderFromStripe,
  getOrder: exports.getOrder,
  getUserOrders: exports.getUserOrders,
  updateOrderStatus: exports.updateOrderStatus,
  getAllOrders: exports.getAllOrders,
  sendOrderEmails,
};
