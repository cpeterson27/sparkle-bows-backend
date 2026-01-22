// models/expenseModel.js - NEW FILE
const mongoose = require("mongoose");

const expenseSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: ["shipping", "stripe_fee", "domain", "hosting", "marketing", "supplies", "other"],
      required: true,
    },
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    description: {
      type: String,
      required: true,
    },
    date: {
      type: Date,
      default: Date.now,
    },
    orderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Order",
      required: false, // Only for shipping/stripe fees
    },
    receiptUrl: String, // Optional: link to receipt/invoice
    vendor: String, // Who you paid (USPS, Stripe, GoDaddy, etc)
  },
  { timestamps: true }
);

module.exports = mongoose.model("Expense", expenseSchema);