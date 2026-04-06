const express = require("express");
const Cart = require("../models/cartModel");
const { optionalAuth } = require("../middleware/auth");
const { calculateShipping } = require("../utils/shippingCalculator");
const Product = require("../models/productModel");

const router = express.Router();

// ------------------------
// Generate a new signed guest ID
// ------------------------
const generateGuestId = () =>
  Math.random().toString(36).substring(2, 15) +
  Math.random().toString(36).substring(2, 15);

// ------------------------
// Cookie options for guest cart
// ------------------------
const guestCookieOptions = {
  signed: true,
  httpOnly: true,
  sameSite: "lax",
  secure: process.env.NODE_ENV === "production",
  maxAge: 1000 * 60 * 60 * 24 * 30, // 30 days
};

function normalizeIncomingItems(items) {
  if (!Array.isArray(items)) return [];

  return items.filter(
    (item) =>
      item &&
      item.productId &&
      typeof item.quantity === "number" &&
      item.quantity > 0,
  );
}

async function sanitizeCartDocument(cart) {
  if (!cart) return cart;

  const validItems = cart.items.filter((item) => item?.productId?._id || item?.productId);
  if (validItems.length !== cart.items.length) {
    cart.items = validItems;
    await cart.save();
    await cart.populate("items.productId");
  }

  return cart;
}

// ------------------------
// GET current cart (guest or logged in) + totals
// This route intentionally supports both authenticated and guest sessions.
// ------------------------
router.get("/", optionalAuth, async (req, res) => {
  try {
    const signedGuestId = req.signedCookies?.guestId;
    let cart;

    if (req.user) {
      // Merge guest cart into user cart if exists
      if (signedGuestId) {
        const guestCart = await Cart.findOne({ guestId: signedGuestId });
        if (guestCart) {
          const userCart = await Cart.findOne({ userId: req.user.userId }); // ← fixed
          if (userCart) {
            userCart.items.push(...guestCart.items);
            await userCart.save();
            await Cart.deleteOne({ guestId: signedGuestId });
            res.clearCookie("guestId");
          } else {
            guestCart.userId = req.user.userId; // ← fixed
            guestCart.guestId = undefined;
            await guestCart.save();
          }
        }
      }

      cart = await Cart.findOne({ userId: req.user.userId }).populate("items.productId"); // ← fixed
    } else {
      // Guest cart
      cart = await Cart.findOne({ guestId: signedGuestId });
      if (!cart) {
        const newGuestId = generateGuestId();
        cart = await Cart.create({ guestId: newGuestId, items: [] });
        res.cookie("guestId", newGuestId, guestCookieOptions);
      }
      cart = await cart.populate("items.productId");
    }

    cart = await sanitizeCartDocument(cart);

    // ------------------------
    // Calculate totals
    // ------------------------
    const itemsWithData = cart.items.map((item) => ({
      ...item.toObject(),
      price: item.productId?.price || 0,
      inventory: item.productId?.inventory || 0,
    }));

    const subtotal = itemsWithData.reduce(
      (sum, item) => sum + (item.price || 0) * item.quantity,
      0
    );
    const totalItems = itemsWithData.reduce((sum, item) => sum + item.quantity, 0);
    const shippingCost = calculateShipping(subtotal, totalItems);
    const grandTotal = subtotal + shippingCost;

    return res.json({
      items: itemsWithData,
      subtotal: subtotal.toFixed(2),
      shippingCost: shippingCost.toFixed(2),
      grandTotal: grandTotal.toFixed(2),
    });
  } catch (err) {
    console.error("Error loading cart:", err);
    return res.status(500).json({ error: "Could not load cart" });
  }
});

// ------------------------
// PUT update cart (guest or logged in)
// ------------------------
router.put("/", optionalAuth, async (req, res) => {
  try {
    const items = normalizeIncomingItems(req.body.items);
    let updatedCart;

    if (req.user) {
      updatedCart = await Cart.findOneAndUpdate(
        { userId: req.user.userId }, // ← fixed
        { items },
        { new: true, upsert: true }
      ).populate("items.productId");
    } else {
      let signedGuestId = req.signedCookies?.guestId;
      if (!signedGuestId) {
        signedGuestId = generateGuestId();
        res.cookie("guestId", signedGuestId, guestCookieOptions);
      }

      updatedCart = await Cart.findOneAndUpdate(
        { guestId: signedGuestId },
        { items },
        { new: true, upsert: true }
      ).populate("items.productId");
    }

    updatedCart = await sanitizeCartDocument(updatedCart);

    // ------------------------
    // Calculate totals
    // ------------------------
    const itemsWithData = updatedCart.items.map((item) => ({
      ...item.toObject(),
      price: item.productId?.price || 0,
      inventory: item.productId?.inventory || 0,
    }));

    const subtotal = itemsWithData.reduce(
      (sum, item) => sum + (item.price || 0) * item.quantity,
      0
    );
    const totalItems = itemsWithData.reduce((sum, item) => sum + item.quantity, 0);
    const shippingCost = calculateShipping(subtotal, totalItems);
    const grandTotal = subtotal + shippingCost;

    return res.json({
      items: itemsWithData,
      subtotal: subtotal.toFixed(2),
      shippingCost: shippingCost.toFixed(2),
      grandTotal: grandTotal.toFixed(2),
    });
  } catch (err) {
    console.error("Error updating cart:", err);
    return res.status(500).json({ error: "Could not update cart" });
  }
});

module.exports = router;
