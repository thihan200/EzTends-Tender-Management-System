const express = require('express');
const router = express.Router();

const bidController = require('../controllers/bidController');
const authMiddleware = require('../middleware/authMiddleware');
const roleMiddleware = require('../middleware/roleMiddleware');
const bidUpload = require('../middleware/bidUploadMiddleware');

// Submit bid - only Supplier
router.post(
    '/',
    authMiddleware,
    roleMiddleware('SUPPLIER'),
    bidUpload.single('proposal_file'),
    bidController.submitBid
);

// View own bids - only Supplier
router.get(
    '/my-bids',
    authMiddleware,
    roleMiddleware('SUPPLIER'),
    bidController.viewMyBids
);

// Tendering Authority can view bids for own tender
router.get(
    '/tender/:tenderId',
    authMiddleware,
    roleMiddleware('TENDERING_AUTHORITY'),
    bidController.viewTenderBids
);

// Select supplier / Award tender - only Tendering Authority
router.put(
    '/:bidId/select',
    authMiddleware,
    roleMiddleware('TENDERING_AUTHORITY'),
    bidController.selectSupplier
);

// Update own bid - only Supplier
router.put(
    '/:id',
    authMiddleware,
    roleMiddleware('SUPPLIER'),
    bidUpload.single('proposal_file'),
    bidController.editBid
);

// Cancel own bid - only Supplier
router.delete(
    '/:id',
    authMiddleware,
    roleMiddleware('SUPPLIER'),
    bidController.removeBid
);

module.exports = router;