const Product = require("../models/productModel");

// GET all products
exports.getProducts = async (req, res) => {
  try {
    const products = await Product.find();
    res.json(products);
  } catch (err) {
    console.error("Error getting products:", err);
    res.status(500).json({ error: "Server error" });
  }
};

// GET one product by ID
exports.getProductById = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product)
      return res.status(404).json({ error: "Product not found" });
    res.json(product);
  } catch (err) {
    console.error("Error getting product by ID:", err);
    res.status(500).json({ error: "Server error" });
  }
};

// POST add review to product
exports.addReview = async (req, res) => {
  try {
    const { id } = req.params;
    const { userName, rating, text } = req.body;

    const product = await Product.findById(id);
    if (!product)
      return res.status(404).json({ error: "Product not found" });

    const review = {
      userName,
      rating,
      text,
      date: new Date().toLocaleDateString(),
    };

    product.reviews.push(review);
    await product.save();

    res.status(201).json(review);
  } catch (err) {
    console.error("Error adding review:", err);
    res.status(400).json({ error: "Could not add review" });
  }
};

// CREATE a new product (admin only)
exports.createProduct = async (req, res) => {
  try {
    const {
      name,
      price,
      description,
      longDescription,
      category,        // category from frontend
      images,
      inventory,
      materialCost,
      featured,
      bestseller,
      newArrival,
    } = req.body;

    // Price validation
    if (price < materialCost) {
      return res.status(400).json({
        error: "Price cannot be less than material cost",
      });
    }

    const profitPerUnit = price - materialCost;

    const product = new Product({
      name,
      price,
      description,
      longDescription,
      category,             // save category
      images,
      inventory,
      materialCost,
      profitPerUnit,
      featured: featured ?? false,
      bestseller: bestseller ?? false,
      newArrival: newArrival ?? false,
      reviews: [],
    });

    const savedProduct = await product.save();
    res.status(201).json(savedProduct);
  } catch (err) {
    console.error("Error creating product:", err);
    res.status(500).json({ error: "Server error" });
  }
};

// UPDATE a product by ID (admin only)
exports.updateProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product)
      return res.status(404).json({ error: "Product not found" });

    const {
      name,
      price,
      description,
      longDescription,
      category,        // category to update
      images,
      inventory,
      materialCost,
      featured,
      bestseller,
      newArrival,
    } = req.body;

    // Price validation (if provided)
    if (
      price !== undefined &&
      materialCost !== undefined &&
      price < materialCost
    ) {
      return res.status(400).json({
        error: "Price cannot be less than material cost",
      });
    }

    product.name = name ?? product.name;
    product.price = price ?? product.price;
    product.description = description ?? product.description;
    product.longDescription =
      longDescription ?? product.longDescription;

    // Update category if provided
    if (category !== undefined) {
      product.category = category;
    }

    // Accept updated images if provided
    product.images = images ?? product.images;

    product.inventory = inventory ?? product.inventory;
    product.materialCost = materialCost ?? product.materialCost;
    product.profitPerUnit =
      (product.price ?? 0) - (product.materialCost ?? 0);

    // Update flags
    if (featured !== undefined) {
      product.featured = featured;
    }
    if (bestseller !== undefined) {
      product.bestseller = bestseller;
    }
    if (newArrival !== undefined) {
      product.newArrival = newArrival;
    }

    const updatedProduct = await product.save();
    res.json(updatedProduct);
  } catch (err) {
    console.error("Error updating product:", err);
    res.status(500).json({ error: "Server error" });
  }
};

// DELETE a product by ID (admin only)
exports.deleteProduct = async (req, res) => {
  try {
    const product = await Product.findByIdAndDelete(req.params.id);
    if (!product)
      return res.status(404).json({ error: "Product not found" });

    res.json({ message: "Product deleted successfully", product });
  } catch (err) {
    console.error("Error deleting product:", err);
    res.status(500).json({ error: "Server error" });
  }
};
