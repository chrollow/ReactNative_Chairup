const express = require('express');
const router = express.Router();
const orderController = require('../controllers/order.controller');
const authMiddleware = require('../middleware/auth.middleware');
const adminMiddleware = require('../middleware/admin.middleware');

// User routes
router.post('/', authMiddleware, orderController.createOrder);
router.get('/user', authMiddleware, orderController.getUserOrders);
router.get('/:id', authMiddleware, orderController.getOrderById);
router.get('/verify-purchase/:productId', authMiddleware, orderController.verifyProductPurchase);

// Admin routes
router.get('/', [authMiddleware, adminMiddleware], orderController.getAllOrders);
router.put('/:id/status', [authMiddleware, adminMiddleware], orderController.updateOrderStatus);

module.exports = router;