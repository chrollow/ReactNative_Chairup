const express = require('express');
const router = express.Router();
const cartController = require('../controllers/cart.controller');
const authMiddleware = require('../middleware/auth.middleware');

// All cart routes require authentication
router.use(authMiddleware);

// Get user's cart
router.get('/', cartController.getUserCart);

// Update cart (add/update item)
router.post('/items', cartController.updateCart);

// Remove item from cart
router.delete('/items/:productId', cartController.removeCartItem);

// Clear cart
router.delete('/', cartController.clearCart);

module.exports = router;