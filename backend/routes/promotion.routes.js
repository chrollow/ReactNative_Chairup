const express = require('express');
const router = express.Router();
const promotionController = require('../controllers/promotion.controller');
const authMiddleware = require('../middleware/auth.middleware');
const adminMiddleware = require('../middleware/admin.middleware');

// Public routes
router.get('/', promotionController.getAllPromotions);
router.get('/validate/:code', promotionController.validatePromoCode);

// Admin only routes
router.post('/', [authMiddleware, adminMiddleware], promotionController.createPromotion);
router.put('/:id', [authMiddleware, adminMiddleware], promotionController.updatePromotion);
router.delete('/:id', [authMiddleware, adminMiddleware], promotionController.deletePromotion);
router.get('/:id', promotionController.getPromotionById);

module.exports = router;