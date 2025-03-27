const Product = require('../models/Product');

// Get all products
exports.getAllProducts = async (req, res) => {
  try {
    const products = await Product.find().sort({ created_at: -1 });
    res.status(200).send(products);
  } catch (error) {
    console.error("Database error:", error);
    res.status(500).send({ message: error.message });
  }
};

// Get product by ID
exports.getProductById = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    
    if (!product) {
      return res.status(404).send({ message: "Product not found" });
    }
    
    res.status(200).send(product);
  } catch (error) {
    res.status(500).send({ message: error.message });
  }
};

// Create product
exports.createProduct = async (req, res) => {
  try {
    const { name, price, category, description, stockQuantity } = req.body;
    
    // Get the image path if an image was uploaded
    const image = req.file ? `/uploads/${req.file.filename}` : '';

    const product = new Product({
      name,
      price,
      category,
      description,
      image,
      stockQuantity: stockQuantity || 0
    });

    const savedProduct = await product.save();
    res.status(201).json(savedProduct);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Update product
exports.updateProduct = async (req, res) => {
  try {
    const { name, price, category, description, stockQuantity } = req.body;
    const updateData = {
      name,
      price,
      category,
      description,
      stockQuantity
    };

    // Only update the image if a new one was uploaded
    if (req.file) {
      updateData.image = `/uploads/${req.file.filename}`;
    }

    const product = await Product.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true }
    );

    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    res.status(200).json(product);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Delete product
exports.deleteProduct = async (req, res) => {
  try {
    const product = await Product.findByIdAndDelete(req.params.id);
    
    if (!product) {
      return res.status(404).send({ message: "Product not found" });
    }
    
    res.status(200).send({ message: "Product deleted" });
  } catch (error) {
    res.status(500).send({ message: error.message });
  }
};