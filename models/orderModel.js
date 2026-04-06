const mongoose = require("mongoose");

const orderItemSchema = new mongoose.Schema({
  productId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "Product",
    required: true 
  },
  name: { 
    type: String, 
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
  cost: { 
    type: Number, 
    default: 0, 
    min: 0 
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

    totalCost: { type: Number, default: 0 },
    totalProfit: { type: Number, default: 0 },

    status: { 
      type: String, 
      enum: ["pending", "processing", "shipped", "delivered", "cancelled"], 
      default: "processing" 
    },

    // ✅ UPDATED SHIPPING ADDRESS - Matches Frontend
    shippingAddress: {
      name: { type: String, default: "" },
      line1: { type: String, default: "" },
      line2: { type: String, default: "" },
      city: { type: String, default: "" },
      state: { type: String, default: "" },
      postalCode: { type: String, default: "" },
      country: { type: String, default: "US" },
    },

    // ✅ NEW FIELDS - Gift Options
    isGift: { type: Boolean, default: false },
    giftMessage: { type: String, default: "" },

    trackingNumber: { type: String, default: "" },
    carrier: { type: String, default: "" },

    stripePaymentIntentId: { type: String },
    stripeChargeId: { type: String },
    stripeTaxCalculationId: { type: String, default: "" },
    stripeTaxBreakdown: { type: [mongoose.Schema.Types.Mixed], default: [] },

    waveInvoiceId: { type: String, default: null },
    waveInvoiceNumber: { type: String, default: null },
    waveInvoicePdfUrl: { type: String, default: null },

    customerNotified: { type: Boolean, default: false },
    ownerNotified: { type: Boolean, default: false },
  },
  { timestamps: true }
);

orderSchema.pre("save", function (next) {
  if (
    this.isModified("items") ||
    this.isModified("subtotal") ||
    this.isModified("shippingCost") ||
    this.isModified("tax") ||
    this.isModified("total")
  ) {
    this.totalCost = parseFloat(
      this.items.reduce((sum, item) => sum + (item.cost || 0) * item.quantity, 0).toFixed(2)
    );

    this.total = parseFloat((this.subtotal + this.shippingCost + this.tax).toFixed(2));

    this.stripeFee = parseFloat((this.total * 0.029 + 0.3).toFixed(2));

    this.totalProfit = parseFloat(
      (this.total - (this.totalCost + this.stripeFee + this.shippingCost)).toFixed(2)
    );
  }

  next();
});

module.exports = mongoose.model("Order", orderSchema);
