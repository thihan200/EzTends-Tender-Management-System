const express = require('express');
const router = express.Router();

const adminUserController = require('../controllers/adminUserController');
const authMiddleware = require('../middleware/authMiddleware');
const roleMiddleware = require('../middleware/roleMiddleware');

// Admin only routes

// View all users
router.get(
    '/users',
    authMiddleware,
    roleMiddleware('ADMIN'),
    adminUserController.viewAllUsers
);

// View one user
router.get(
    '/users/:id',
    authMiddleware,
    roleMiddleware('ADMIN'),
    adminUserController.viewUserById
);

// Add new user
router.post(
    '/users',
    authMiddleware,
    roleMiddleware('ADMIN'),
    adminUserController.addUser
);

// Update user
router.put(
    '/users/:id',
    authMiddleware,
    roleMiddleware('ADMIN'),
    adminUserController.editUser
);

// Update user status (activate/deactivate)
router.put(
    '/users/:id/status',
    authMiddleware,
    roleMiddleware('ADMIN'),
    adminUserController.changeUserStatus
);

module.exports = router;