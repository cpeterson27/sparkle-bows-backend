// models/cartModel.js
const mongoose = require("mongoose");

// -------------------------
// Cart Item Schema
// -------------------------
const cartItemSchema = new mongoose.Schema({
  productId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "Product", 
    required: true 
  },
  quantity: { 
    type: Number, 
    default: 1, 
    min: 1 
  },
});

// -------------------------
// Cart Schema
// -------------------------
const cartSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: false },
    guestId: { type: String, required: false }, // for guest users
    items: [cartItemSchema],
  },
  { timestamps: true } // createdAt, updatedAt
);

module.exports = mongoose.model("Cart", cartSchema);
