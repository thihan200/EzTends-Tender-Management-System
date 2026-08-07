const express = require('express');
const router = express.Router();

const reportController = require('../controllers/reportController');
const authMiddleware = require('../middleware/authMiddleware');
const roleMiddleware = require('../middleware/roleMiddleware');

// Summary report - Admin and Tendering Authority
router.get(
    '/summary',
    authMiddleware,
    roleMiddleware('ADMIN', 'TENDERING_AUTHORITY'),
    reportController.summaryReport
);

// Tender report - Admin and Tendering Authority
router.get(
    '/tenders',
    authMiddleware,
    roleMiddleware('ADMIN', 'TENDERING_AUTHORITY'),
    reportController.tenderReport
);

// Bid report - Admin and Tendering Authority
router.get(
    '/bids',
    authMiddleware,
    roleMiddleware('ADMIN', 'TENDERING_AUTHORITY'),
    reportController.bidReport
);

// User activity report - Admin only
router.get(
    '/users',
    authMiddleware,
    roleMiddleware('ADMIN'),
    reportController.userActivityReport
);

// Report history - Admin only
router.get(
    '/history',
    authMiddleware,
    roleMiddleware('ADMIN'),
    reportController.reportHistory
);

module.exports = router;