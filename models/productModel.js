const mongoose = require('mongoose');
const { Schema } = mongoose;

const reviewSchema = new Schema({
  userName: { type: String, required: true },
  rating:   { type: Number, required: true, min: 1, max: 5 },
  text:     { type: String, required: true },
  date:     { type: String, required: true }        // you used toLocaleDateString() on frontend
});

const productSchema = new Schema({
  name:            { type: String, required: true },
  images:          { type: [String], required: true },
  price:           { type: Number, required: true },
  longDescription: { type: String },
  inventory:       { type: Number, default: 0 },
  featured:        { type: Boolean, default: false },
  reviews:         { type: [reviewSchema], default: [] },
  createdAt:       { type: Date, default: Date.now }
});

const Product = mongoose.model('Product', productSchema);
module.exports = Product;
