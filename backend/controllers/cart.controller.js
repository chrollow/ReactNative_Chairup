const Cart = require('../models/Cart');
const Product = require('../models/Product');

// Get user's cart
exports.getUserCart = async (req, res) => {
  try {
    let cart = await Cart.findOne({ user: req.userId })
      .populate({
        path: 'items.product',
        select: 'name price image stockQuantity category'
      });
    
    if (!cart) {
      // Create empty cart if none exists
      cart = new Cart({
        user: req.userId,
        items: []
      });
      await cart.save();
    }
    
    res.status(200).send(cart);
  } catch (error) {
    res.status(500).send({ message: error.message });
  }
};

// Update cart (add/update item)
exports.updateCart = async (req, res) => {
  try {
    const { productId, quantity } = req.body;
    
    // Validate product exists and has enough stock
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).send({ message: "Product not found" });
    }
    
    if (quantity > product.stockQuantity) {
      return res.status(400).send({ 
        message: `Insufficient stock. Only ${product.stockQuantity} available.` 
      });
    }
    
    // Find user's cart
    let cart = await Cart.findOne({ user: req.userId });
    
    if (!cart) {
      // Create new cart if none exists
      cart = new Cart({
        user: req.userId,
        items: [{ product: productId, quantity }]
      });
    } else {
      // Check if product already in cart
      const itemIndex = cart.items.findIndex(
        item => item.product.toString() === productId
      );
      
      if (itemIndex > -1) {
        // Update existing item
        cart.items[itemIndex].quantity = quantity;
      } else {
        // Add new item
        cart.items.push({ product: productId, quantity });
      }
    }
    
    await cart.save();
    
    // Return populated cart
    const populatedCart = await Cart.findById(cart._id)
      .populate({
        path: 'items.product',
        select: 'name price image stockQuantity category'
      });
    
    res.status(200).send(populatedCart);
  } catch (error) {
    res.status(500).send({ message: error.message });
  }
};

// Remove item from cart
exports.removeCartItem = async (req, res) => {
  try {
    const { productId } = req.params;
    
    // Find user's cart
    const cart = await Cart.findOne({ user: req.userId });
    
    if (!cart) {
      return res.status(404).send({ message: "Cart not found" });
    }
    
    // Remove item
    cart.items = cart.items.filter(
      item => item.product.toString() !== productId
    );
    
    await cart.save();
    
    // Return updated cart
    const populatedCart = await Cart.findById(cart._id)
      .populate({
        path: 'items.product',
        select: 'name price image stockQuantity category'
      });
    
    res.status(200).send(populatedCart);
  } catch (error) {
    res.status(500).send({ message: error.message });
  }
};

// Clear cart
exports.clearCart = async (req, res) => {
  try {
    const cart = await Cart.findOne({ user: req.userId });
    
    if (!cart) {
      return res.status(404).send({ message: "Cart not found" });
    }
    
    cart.items = [];
    await cart.save();
    
    res.status(200).send({ message: "Cart cleared successfully" });
  } catch (error) {
    res.status(500).send({ message: error.message });
  }
};