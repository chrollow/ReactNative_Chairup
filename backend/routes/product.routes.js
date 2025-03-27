const express = require('express');
const router = express.Router();
const productController = require('../controllers/product.controller');
const upload = require('../middleware/upload.middleware');
const authMiddleware = require('../middleware/auth.middleware');
const adminMiddleware = require('../middleware/admin.middleware');

// Public routes
router.get('/', productController.getAllProducts);
router.get('/:id', productController.getProductById);

// Admin only routes - require authentication and admin privileges
router.post('/', [authMiddleware, adminMiddleware, upload.single('image')], productController.createProduct);
router.put('/:id', [authMiddleware, adminMiddleware, upload.single('image')], productController.updateProduct);
router.delete('/:id', [authMiddleware, adminMiddleware], productController.deleteProduct);

module.exports = router;