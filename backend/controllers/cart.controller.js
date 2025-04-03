const Product = require('../models/Product');
const CartItem = require('../models/SqliteCart');

// Get user's cart
exports.getUserCart = async (req, res) => {
  try {
    // Find all cart items for this user
    const cartItems = await CartItem.findAll({
      where: { userId: req.userId }
    });
    
    // Get product details for each cart item
    const productIds = cartItems.map(item => item.productId);
    const products = await Product.find({ _id: { $in: productIds } });
    
    // Map products to cart items
    const items = cartItems.map(item => {
      const product = products.find(p => p._id.toString() === item.productId);
      return {
        product: {
          _id: product._id,
          name: product.name,
          price: product.price,
          image: product.image,
          stockQuantity: product.stockQuantity,
          category: product.category
        },
        quantity: item.quantity
      };
    });
    
    res.status(200).send({ items });
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
    
    // Check if item already exists in cart
    let cartItem = await CartItem.findOne({
      where: { 
        userId: req.userId,
        productId: productId
      }
    });
    
    if (cartItem) {
      // Update quantity
      cartItem.quantity = quantity;
      await cartItem.save();
    } else {
      // Create new cart item
      cartItem = await CartItem.create({
        userId: req.userId,
        productId: productId,
        quantity: quantity
      });
    }
    
    // Get updated cart
    const cartItems = await CartItem.findAll({
      where: { userId: req.userId }
    });
    
    // Get product details for each cart item
    const productIds = cartItems.map(item => item.productId);
    const products = await Product.find({ _id: { $in: productIds } });
    
    // Map products to cart items
    const items = cartItems.map(item => {
      const product = products.find(p => p._id.toString() === item.productId);
      return {
        product: {
          _id: product._id,
          name: product.name,
          price: product.price,
          image: product.image,
          stockQuantity: product.stockQuantity,
          category: product.category
        },
        quantity: item.quantity
      };
    });
    
    res.status(200).send({ items });
  } catch (error) {
    res.status(500).send({ message: error.message });
  }
};

// Remove item from cart
exports.removeCartItem = async (req, res) => {
  try {
    const { productId } = req.params;
    
    // Delete the cart item
    await CartItem.destroy({
      where: {
        userId: req.userId,
        productId: productId
      }
    });
    
    // Get updated cart
    const cartItems = await CartItem.findAll({
      where: { userId: req.userId }
    });
    
    // Get product details for each cart item
    const productIds = cartItems.map(item => item.productId);
    const products = await Product.find({ _id: { $in: productIds } });
    
    // Map products to cart items
    const items = cartItems.map(item => {
      const product = products.find(p => p._id.toString() === item.productId);
      return {
        product: {
          _id: product._id,
          name: product.name,
          price: product.price,
          image: product.image,
          stockQuantity: product.stockQuantity,
          category: product.category
        },
        quantity: item.quantity
      };
    });
    
    res.status(200).send({ items });
  } catch (error) {
    res.status(500).send({ message: error.message });
  }
};

// Clear cart
exports.clearCart = async (req, res) => {
  try {
    // Delete all cart items for this user
    await CartItem.destroy({
      where: { userId: req.userId }
    });
    
    res.status(200).send({ message: "Cart cleared successfully" });
  } catch (error) {
    res.status(500).send({ message: error.message });
  }
};