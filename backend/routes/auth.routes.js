const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth.controller');
const authMiddleware = require('../middleware/auth.middleware');
const upload = require('../middleware/upload.middleware');

router.post('/register', upload.single('profileImage'), authController.register);
router.post('/login', authController.login);
router.post('/google', authController.googleAuth);
router.post('/facebook', authController.facebookAuth);
router.put('/profile', [authMiddleware, upload.single('profileImage')], authController.updateProfile);

module.exports = router;