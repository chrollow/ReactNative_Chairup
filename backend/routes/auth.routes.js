const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth.controller');
const authMiddleware = require('../middleware/auth.middleware');

router.post('/register', authController.register);
router.post('/login', authController.login);
router.post('/google', authController.googleAuth);
router.post('/facebook', authController.facebookAuth);
router.put('/profile', authMiddleware, authController.updateProfile);

module.exports = router;