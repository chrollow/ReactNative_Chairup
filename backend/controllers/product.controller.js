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
  const { name, price, category, description, image, stockQuantity } = req.body;
  
  if (!name || !price) {
    return res.status(400).send({ message: "Product name and price are required" });
  }
  
  try {
    const product = new Product({
      name,
      price: Number(price),
      category: category || 'Office', 
      description: description || '', 
      image: image || '', 
      stockQuantity: Number(stockQuantity) || 0
    });
    
    const savedProduct = await product.save();
    res.status(201).send(savedProduct);
  } catch (error) {
    res.status(500).send({ message: error.message });
  }
};

// Update product
exports.updateProduct = async (req, res) => {
  const { id } = req.params;
  const { name, price, category, description, image, stockQuantity } = req.body;
  
  try {
    const updatedProduct = await Product.findByIdAndUpdate(
      id, 
      {
        name,
        price: Number(price),
        category,
        description, 
        image,
        stockQuantity: Number(stockQuantity)
      }, 
      { new: true }
    );
    
    if (!updatedProduct) {
      return res.status(404).send({ message: "Product not found" });
    }
    
    res.status(200).send(updatedProduct);
  } catch (error) {
    res.status(500).send({ message: error.message });
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