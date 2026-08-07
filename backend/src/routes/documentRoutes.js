const express = require('express');
const router = express.Router();

const documentController = require('../controllers/documentController');
const authMiddleware = require('../middleware/authMiddleware');
const roleMiddleware = require('../middleware/roleMiddleware');
const upload = require('../middleware/uploadMiddleware');

// Upload document - Supplier
router.post(
    '/upload',
    authMiddleware,
    roleMiddleware('SUPPLIER'),
    upload.single('document'),
    documentController.uploadDocument
);

// View all documents - Admin only
router.get(
    '/',
    authMiddleware,
    roleMiddleware('ADMIN'),
    documentController.viewAllDocuments
);

// View pending documents - Admin only
router.get(
    '/pending',
    authMiddleware,
    roleMiddleware('ADMIN'),
    documentController.viewPendingDocuments
);

// Validate document - Admin only
router.put(
    '/:id/validate',
    authMiddleware,
    roleMiddleware('ADMIN'),
    documentController.validateUploadedDocument
);

// Authority views approved documents for own tender
router.get(
    '/tender/:tenderId/approved',
    authMiddleware,
    roleMiddleware('TENDERING_AUTHORITY'),
    documentController.viewApprovedTenderDocuments
);

module.exports = router;