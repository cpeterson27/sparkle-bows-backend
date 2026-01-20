const mongoose = require("mongoose");
const { Schema } = mongoose;

const reviewSchema = new Schema({
  userName: { type: String, required: true },
  rating: { type: Number, required: true, min: 1, max: 5 },
  text: { type: String, required: true },
  date: { type: String, required: true },
});

const imageSchema = new Schema({
  url: { type: String, required: true },
  alt: { type: String, default: "" },
});

const productSchema = new Schema({
  name: { type: String, required: true, unique: true },
  images: { type: [imageSchema], default: [] },
  price: { type: Number, required: true, min: 0 },
  description: { type: String },
  longDescription: { type: String },
  category: { type: String, default: "sparkle" },
  inventory: { type: Number, default: 0, min: 0 },
  materialCost: { type: Number, default: 0, min: 0 },
  profitPerUnit: { type: Number, default: 0 },
  sales: { type: Number, default: 0, min: 0 },
  featured: { type: Boolean, default: false },
  bestseller: { type: Boolean, default: false },
  newArrival: { type: Boolean, default: true },
  reviews: { type: [reviewSchema], default: [] },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("Product", productSchema);
