// routes/cart.js
const express = require("express");
const Cart = require("../models/cartModel");
const { optionalAuth } = require("../middleware/auth");

const router = express.Router();

// generate a new signed guest ID
const generateGuestId = () =>
  Math.random().toString(36).substring(2, 15) +
  Math.random().toString(36).substring(2, 15);

// GET current cart (guest or logged in)
router.get("/", optionalAuth, async (req, res) => {
  try {
    const signedGuestId = req.signedCookies?.guestId;

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

      const cart = await Cart.findOne({ userId: req.user._id }).populate(
        "items.productId"
      );
      return res.json(cart?.items || []);
    }

    // guest not logged in
    let cart = await Cart.findOne({ guestId: signedGuestId });

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

    const pop = await cart.populate("items.productId");
    return res.json(pop.items);
  } catch (err) {
    console.error("Error loading cart:", err);
    return res.status(500).json({ error: "Could not load cart" });
  }
});

// PUT update cart (guest or logged in)
router.put("/", optionalAuth, async (req, res) => {
  try {
    const items = req.body.items;

    // if user is logged in
    if (req.user) {
      const updatedCart = await Cart.findOneAndUpdate(
        { userId: req.user._id },
        { items },
        { new: true, upsert: true }
      ).populate("items.productId");

      return res.json(updatedCart?.items || []);
    }

    // for guests: ensure guest has cart
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

    const updatedGuestCart = await Cart.findOneAndUpdate(
      { guestId: signedGuestId },
      { items },
      { new: true, upsert: true }
    ).populate("items.productId");

    return res.json(updatedGuestCart?.items || []);
  } catch (err) {
    console.error("Error updating cart:", err);
    return res.status(500).json({ error: "Could not update cart" });
  }
});

module.exports = router;
