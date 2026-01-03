const Product = require('../models/productModel');

// GET all products
exports.getProducts = async (req, res) => {
  try {
    const products = await Product.find();
    res.json(products);
  } catch (err) {
    console.error('Error getting products', err);
    res.status(500).json({ error: 'Server error' });
  }
};

// GET one product by ID
exports.getProductById = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }
    res.json(product);
  } catch (err) {
    console.error('Error getting product by ID', err);
    res.status(500).json({ error: 'Server error' });
  }
};

// POST add review to product
exports.addReview = async (req, res) => {
  try {
    const { id } = req.params;           // product id
    const { userName, rating, text, date } = req.body;

    const product = await Product.findById(id);
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    product.reviews.push({ userName, rating, text, date });
    await product.save();

    res.status(201).json(product);
  } catch (err) {
    console.error('Error adding review', err);
    res.status(400).json({ error: 'Could not add review', details: err });
  }
};