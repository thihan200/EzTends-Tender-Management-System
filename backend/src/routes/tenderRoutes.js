const express = require('express');
const router = express.Router();

const tenderController = require('../controllers/tenderController');
const authMiddleware = require('../middleware/authMiddleware');
const roleMiddleware = require('../middleware/roleMiddleware');

// Public users can view all tenders
router.get(
    '/',
    tenderController.viewAllTenders
);

// Public users can search tenders
router.get(
    '/search',
    tenderController.searchTenderList
);

// Get logged Authority tenders
router.get(
    '/my-tenders',
    authMiddleware,
    roleMiddleware('TENDERING_AUTHORITY'),
    tenderController.viewMyTenders
);


// Public users can view tender details
router.get(
    '/:id',
    tenderController.viewTenderById
);

// Create tender - only Tendering Authority
router.post(
    '/',
    authMiddleware,
    roleMiddleware('TENDERING_AUTHORITY'),
    tenderController.addTender
);

// Close tender
router.put(
    '/:id/status',
    authMiddleware,
    roleMiddleware('TENDERING_AUTHORITY'),
    tenderController.changeTenderStatus
);

// Reopen closed tender
router.put(
    '/:id/reopen',
    authMiddleware,
    roleMiddleware('TENDERING_AUTHORITY'),
    tenderController.reopenClosedTender
);

// Update tender - only Tendering Authority
router.put(
    '/:id',
    authMiddleware,
    roleMiddleware('TENDERING_AUTHORITY'),
    tenderController.editTender
);

// Cancel tender - only Tendering Authority
router.delete(
    '/:id',
    authMiddleware,
    roleMiddleware('TENDERING_AUTHORITY'),
    tenderController.removeTender
);

module.exports = router;