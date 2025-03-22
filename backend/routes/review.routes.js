const express = require('express');
const router = express.Router();
const reviewController = require('../controllers/review.controller');
const authMiddleware = require('../middleware/auth.middleware');

// Get product reviews (public)
router.get('/products/:id/reviews', reviewController.getProductReviews);

// Create and update reviews (authenticated)
router.post('/products/:id/reviews', authMiddleware, reviewController.createReview);
router.put('/products/:id/reviews/:reviewId', authMiddleware, reviewController.updateReview);

// Get user's reviews
router.get('/user', authMiddleware, reviewController.getUserReviews);

module.exports = router;