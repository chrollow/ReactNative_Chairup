const Order = require('../models/Order');
const Product = require('../models/Product');
const User = require('../models/User');  // Add this import
const { notifyOrderStatusChange } = require('../services/notificationService'); // Add this import
const CartItem = require('../models/SqliteCart'); // Add this import

// Create a new order
exports.createOrder = async (req, res) => {
  try {
    const {
      orderItems,
      shippingAddress,
      phoneNumber,
      paymentMethod,
      itemsPrice,
      shippingPrice,
      totalPrice
    } = req.body;

    // Verify product availability & update stock
    for (const item of orderItems) {
      const product = await Product.findById(item.product);
      if (!product) {
        return res.status(404).send({ message: `Product not found: ${item.product}` });
      }
      
      if (product.stockQuantity < item.quantity) {
        return res.status(400).send({ 
          message: `Not enough stock for ${product.name}. Available: ${product.stockQuantity}`
        });
      }
      
      // Update stock quantity
      product.stockQuantity -= item.quantity;
      await product.save();
    }
    
    // Create the order
    const order = new Order({
      user: req.userId,
      orderItems,
      shippingAddress,
      phoneNumber,
      paymentMethod,
      itemsPrice,
      shippingPrice,
      totalPrice
    });
    
    const createdOrder = await order.save();
    
    // Clear the cart after checkout
    await exports.clearCartAfterCheckout(req.userId);
    
    // Return the created order with populated product details
    const populatedOrder = await Order.findById(createdOrder._id)
      .populate({
        path: 'orderItems.product',
        select: 'name image'
      });
      
    res.status(201).send(populatedOrder);
  } catch (error) {
    console.error('Order creation error:', error);
    res.status(500).send({ message: error.message });
  }
};

// Get current user's orders
exports.getUserOrders = async (req, res) => {
  try {
    const orders = await Order.find({ user: req.userId })
      .populate({
        path: 'orderItems.product',
        select: 'name image'
      })
      .sort({ created_at: -1 });
      
    res.status(200).send(orders);
  } catch (error) {
    res.status(500).send({ message: error.message });
  }
};

// Get order by ID
exports.getOrderById = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate({
        path: 'orderItems.product',
        select: 'name image price'
      })
      .populate({
        path: 'user',
        select: 'name email'
      });
      
    if (!order) {
      return res.status(404).send({ message: "Order not found" });
    }
    
    // First check if user is admin - need to get the user from database
    const user = await User.findById(req.userId);
    const isAdmin = user && user.is_admin;
    
    // Check if order belongs to current user or if user is admin
    if (order.user._id.toString() !== req.userId && !isAdmin) {
      return res.status(403).send({ message: "Not authorized to view this order" });
    }
    
    res.status(200).send(order);
  } catch (error) {
    res.status(500).send({ message: error.message });
  }
};

// Update order status (Admin only)
exports.updateOrderStatus = async (req, res) => {
  try {
    const { status } = req.body;
    
    if (!['pending', 'processing', 'shipped', 'delivered', 'cancelled'].includes(status)) {
      return res.status(400).send({ message: "Invalid status value" });
    }
    
    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).send({ message: "Order not found" });
    }
    
    // Update status
    order.status = status;
    
    // If delivered, set deliveredAt date
    if (status === 'delivered') {
      order.deliveredAt = Date.now();
    }
    
    const updatedOrder = await order.save();
    
    // Notify about the order status change
    await notifyOrderStatusChange(order._id, status);
    
    res.status(200).send(updatedOrder);
  } catch (error) {
    res.status(500).send({ message: error.message });
  }
};

// Get all orders (Admin only)
exports.getAllOrders = async (req, res) => {
  try {
    const orders = await Order.find({})
      .populate({
        path: 'user',
        select: 'name email'
      })
      .populate({
        path: 'orderItems.product',
        select: 'name'
      })
      .sort({ created_at: -1 });
      
    res.status(200).send(orders);
  } catch (error) {
    res.status(500).send({ message: error.message });
  }
};

// Verify if user has purchased a product
exports.verifyProductPurchase = async (req, res) => {
  try {
    const productId = req.params.productId;
    const userId = req.userId;

    // Check if there's a delivered order containing this product for this user
    const purchaseVerified = await Order.exists({
      user: userId,
      'orderItems.product': productId,
      status: { $in: ['delivered', 'shipped'] }
    });
    
    res.status(200).send({ verified: !!purchaseVerified });
  } catch (error) {
    console.error('Purchase verification error:', error);
    res.status(500).send({ message: error.message });
  }
};

// Clear the cart after checkout
exports.clearCartAfterCheckout = async (userId) => {
  try {
    await CartItem.destroy({
      where: { userId: userId }
    });
    return true;
  } catch (error) {
    console.error('Error clearing cart after checkout:', error);
    return false;
  }
};