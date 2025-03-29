const express = require('express');
const router = express.Router();
const Order = require('../models/Order');
const auth = require('../middleware/auth');
const { notifyOrderStatusChange } = require('../services/notificationService');

// ...existing routes

// Update order status
router.put('/:id/status', auth, async (req, res) => {
  try {
    const { status } = req.body;
    const { id } = req.params;
    
    if (!status) {
      return res.status(400).json({ message: 'Status is required' });
    }
    
    const validStatuses = ['pending', 'processing', 'shipped', 'delivered', 'cancelled'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }
    
    const order = await Order.findById(id);
    
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }
    
    // Update order status
    order.status = status;
    await order.save();
    
    // Send notification to user
    await notifyOrderStatusChange(id, status);
    
    res.status(200).json({ message: 'Order status updated', order });
  } catch (error) {
    console.error('Error updating order status:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;