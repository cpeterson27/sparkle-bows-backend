const express = require("express");
const Cart = require("../models/cartModel");
const { optionalAuth } = require("../middleware/auth");
const { calculateShipping } = require("../utils/shippingCalculator");
const Product = require("../models/productModel");

const router = express.Router();

// generate a new signed guest ID
const generateGuestId = () =>
  Math.random().toString(36).substring(2, 15) +
  Math.random().toString(36).substring(2, 15);

// ------------------------
// GET current cart (guest or logged in) + totals
// ------------------------
router.get("/", optionalAuth, async (req, res) => {
  try {
    const signedGuestId = req.signedCookies?.guestId;
    let cart;

    if (req.user) {
      // merge guest cart into user cart if exists
      if (signedGuestId) {
        const guestCart = await Cart.findOne({ guestId: signedGuestId });
        if (guestCart) {
          const userCart = await Cart.findOne({ userId: req.user._id });
          if (userCart) {
            userCart.items.push(...guestCart.items);
            await userCart.save();
            await Cart.deleteOne({ guestId: signedGuestId });
            res.clearCookie("guestId");
          } else {
            guestCart.userId = req.user._id;
            guestCart.guestId = undefined;
            await guestCart.save();
          }
        }
      }

      cart = await Cart.findOne({ userId: req.user._id }).populate("items.productId");
    } else {
      // guest not logged in
      cart = await Cart.findOne({ guestId: signedGuestId });
      if (!cart) {
        const newGuestId = generateGuestId();
        cart = await Cart.create({ guestId: newGuestId, items: [] });
        res.cookie("guestId", newGuestId, {
          signed: true,
          httpOnly: true,
          sameSite: "lax",
          secure: process.env.NODE_ENV === "production",
          maxAge: 1000 * 60 * 60 * 24 * 30,
        });
      }
      cart = await cart.populate("items.productId");
    }

    // ------------------------
    // Calculate subtotal, shipping, grand total
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
    const items = req.body.items;

    let updatedCart;
    if (req.user) {
      updatedCart = await Cart.findOneAndUpdate(
        { userId: req.user._id },
        { items },
        { new: true, upsert: true }
      ).populate("items.productId");
    } else {
      let signedGuestId = req.signedCookies?.guestId;
      if (!signedGuestId) {
        signedGuestId = generateGuestId();
        res.cookie("guestId", signedGuestId, {
          signed: true,
          httpOnly: true,
          sameSite: "lax",
          secure: process.env.NODE_ENV === "production",
          maxAge: 1000 * 60 * 60 * 24 * 30,
        });
      }
      updatedCart = await Cart.findOneAndUpdate(
        { guestId: signedGuestId },
        { items },
        { new: true, upsert: true }
      ).populate("items.productId");
    }

    // Calculate totals
    const itemsWithData = updatedCart.items.map((item) => ({
      ...item.toObject(),
      price: item.productId?.price || 0,
      inventory: item.productId?.inventory || 0,
    }));
    const subtotal = itemsWithData.reduce((sum, item) => sum + (item.price || 0) * item.quantity, 0);
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
