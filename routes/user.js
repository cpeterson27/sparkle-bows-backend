const express = require("express");
const User = require("../models/User");
const { verifyToken } = require("../middleware/auth");
const logger = require("../logger");

const router = express.Router();

router.get("/addresses", verifyToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId);
    if (!user) return res.status(404).json({ error: "User not found" });

    res.json({ addresses: user.addresses || [] });
  } catch (err) {
    logger.error("Failed to fetch addresses", { error: err.message });
    res.status(500).json({ error: "Could not fetch addresses" });
  }
});

router.post("/addresses", verifyToken, async (req, res) => {
  try {
    const { label, line1, line2, city, state, postalCode, country, isDefault } = req.body;

    if (!line1 || !city || !state || !postalCode) {
      return res.status(400).json({ error: "Missing required address fields" });
    }

    const user = await User.findById(req.user.userId);
    if (!user) return res.status(404).json({ error: "User not found" });

    if (isDefault) {
      user.addresses.forEach(addr => addr.isDefault = false);
    }

    const makeDefault = user.addresses.length === 0 || isDefault;

    user.addresses.push({
      label: label || "Home",
      line1,
      line2: line2 || "",
      city,
      state,
      postalCode,
      country: country || "US",
      isDefault: makeDefault,
    });

    await user.save();

    logger.info("Address added", { userId: user._id });

    res.json({
      message: "Address added successfully",
      addresses: user.addresses,
    });
  } catch (err) {
    logger.error("Failed to add address", { error: err.message });
    res.status(500).json({ error: "Could not add address" });
  }
});

router.put("/addresses/:addressId", verifyToken, async (req, res) => {
  try {
    const { addressId } = req.params;
    const { label, line1, line2, city, state, postalCode, country, isDefault } = req.body;

    const user = await User.findById(req.user.userId);
    if (!user) return res.status(404).json({ error: "User not found" });

    const address = user.addresses.id(addressId);
    if (!address) return res.status(404).json({ error: "Address not found" });

    if (isDefault) {
      user.addresses.forEach(addr => addr.isDefault = false);
    }

    if (label) address.label = label;
    if (line1) address.line1 = line1;
    if (line2 !== undefined) address.line2 = line2;
    if (city) address.city = city;
    if (state) address.state = state;
    if (postalCode) address.postalCode = postalCode;
    if (country) address.country = country;
    if (isDefault !== undefined) address.isDefault = isDefault;

    await user.save();

    res.json({
      message: "Address updated successfully",
      addresses: user.addresses,
    });
  } catch (err) {
    logger.error("Failed to update address", { error: err.message });
    res.status(500).json({ error: "Could not update address" });
  }
});

router.delete("/addresses/:addressId", verifyToken, async (req, res) => {
  try {
    const { addressId } = req.params;

    const user = await User.findById(req.user.userId);
    if (!user) return res.status(404).json({ error: "User not found" });

    const address = user.addresses.id(addressId);
    if (!address) return res.status(404).json({ error: "Address not found" });

    const wasDefault = address.isDefault;
    address.remove();

    if (wasDefault && user.addresses.length > 0) {
      user.addresses[0].isDefault = true;
    }

    await user.save();

    res.json({
      message: "Address deleted successfully",
      addresses: user.addresses,
    });
  } catch (err) {
    logger.error("Failed to delete address", { error: err.message });
    res.status(500).json({ error: "Could not delete address" });
  }
});

router.patch("/addresses/:addressId/default", verifyToken, async (req, res) => {
  try {
    const { addressId } = req.params;

    const user = await User.findById(req.user.userId);
    if (!user) return res.status(404).json({ error: "User not found" });

    const address = user.addresses.id(addressId);
    if (!address) return res.status(404).json({ error: "Address not found" });

    user.addresses.forEach(addr => addr.isDefault = false);
    address.isDefault = true;

    await user.save();

    res.json({
      message: "Default address updated",
      addresses: user.addresses,
    });
  } catch (err) {
    logger.error("Failed to set default address", { error: err.message });
    res.status(500).json({ error: "Could not set default address" });
  }
});

module.exports = router;