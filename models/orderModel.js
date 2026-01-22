const mongoose = require("mongoose");

const orderItemSchema = new mongoose.Schema({
  productId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "Product",
    required: true 
  },
  quantity: { 
    type: Number, 
    required: true, 
    min: 1 
  },
  price: { 
    type: Number, 
    required: true, 
    min: 0 
  },
  // Cost of product for profit calculations (COGS)
  cost: {
    type: Number,
    default: 0,
  },
});

const orderSchema = new mongoose.Schema(
  {
    userId: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: "User",
      default: null
    },
    customerName: { type: String, required: true },
    customerEmail: { type: String, required: true },
    items: [orderItemSchema],

    subtotal: { type: Number, required: true, min: 0 },
    shippingCost: { type: Number, default: 0, min: 0 },
    tax: { type: Number, default: 0, min: 0 },
    stripeFee: { type: Number, default: 0, min: 0 },
    total: { type: Number, required: true, min: 0 },

    totalCost: { type: Number, default: 0 },   // COGS
    totalProfit: { type: Number, default: 0 },

    status: { 
      type: String, 
      enum: ["pending", "processing", "shipped", "delivered", "cancelled"],
      default: "processing" 
    },

    shippingAddress: {
      street: { type: String, default: "" },
      city: { type: String, default: "" },
      state: { type: String, default: "" },
      zipCode: { type: String, default: "" },
      country: { type: String, default: "USA" },
    },

    trackingNumber: { type: String, default: "" },
    carrier: { type: String, default: "" },

    stripePaymentIntentId: { type: String },
    stripeChargeId: { type: String },

    customerNotified: { type: Boolean, default: false },
    ownerNotified: { type: Boolean, default: false },
  },
  { timestamps: true }
);

// -------------------------
// Pre-save hook for financials
// -------------------------
orderSchema.pre("save", function (next) {
  if (
    this.isModified("items") || 
    this.isModified("subtotal") || 
    this.isModified("shippingCost") || 
    this.isModified("tax") || 
    this.isModified("total")
  ) {
    // 1️⃣ Total cost of items (COGS)
    this.totalCost = parseFloat(
      this.items.reduce((sum, item) => sum + item.cost * item.quantity, 0).toFixed(2)
    );

    // 2️⃣ Total: subtotal + shipping + tax (ensure consistent with metadata from checkout)
    this.total = parseFloat((this.subtotal + this.shippingCost + this.tax).toFixed(2));

    // 3️⃣ Stripe fee (2.9% + $0.30)
    this.stripeFee = parseFloat((this.total * 0.029 + 0.3).toFixed(2));

    // 4️⃣ Profit = Revenue - (COGS + Stripe Fee + Shipping)
    this.totalProfit = parseFloat((this.total - (this.totalCost + this.stripeFee + this.shippingCost)).toFixed(2));
  }

  next();
});

module.exports = mongoose.model("Order", orderSchema);
