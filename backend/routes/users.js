const express = require('express');
const router = express.Router();
const User = require('../models/User');
const auth = require('../middleware/auth.middleware'); // Fix the import path

// ...existing routes

// Update user's push token
router.post('/push-token', auth, async (req, res) => {
  try {
    const { token } = req.body;
    
    if (!token) {
      return res.status(400).json({ message: 'Token is required' });
    }
    
    const user = await User.findById(req.userId);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    user.pushToken = token;
    await user.save();
    
    res.status(200).json({ message: 'Push token updated successfully' });
  } catch (error) {
    console.error('Error updating push token:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Clear user's push token
router.post('/clear-push-token', auth, async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Clear the push token
    user.pushToken = null;
    await user.save();
    
    res.status(200).json({ message: 'Push token cleared successfully' });
  } catch (error) {
    console.error('Error clearing push token:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;