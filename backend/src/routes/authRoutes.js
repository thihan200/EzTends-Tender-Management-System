const express = require('express');
const router = express.Router();

const authController = require('../controllers/authController');
const authMiddleware = require('../middleware/authMiddleware');

// Register route
router.post('/register', authController.register);

// Login route
router.post('/login', authController.login);


// Get logged user profile
router.get(
    '/profile',
    authMiddleware,
    authController.getProfile
);

// Update logged user profile
router.put(
    '/profile',
    authMiddleware,
    authController.updateProfile
);

// Change password
router.put(
    '/change-password',
    authMiddleware,
    authController.changePassword
);

module.exports = router;