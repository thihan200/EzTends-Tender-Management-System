const {
    getTenderById,
    createDocument,
    getAllDocuments,
    getPendingDocuments,
    getDocumentById,
    validateDocument,
    getApprovedDocumentsForTender
} = require('../models/documentModel');

// Upload document
const uploadDocument = async (req, res) => {
    try {
        const { tender_id } = req.body;

        // Check tender id
        if (!tender_id) {
            return res.status(400).json({
                message: 'Tender ID is required'
            });
        }

        // Check file uploaded
        if (!req.file) {
            return res.status(400).json({
                message: 'Document file is required'
            });
        }

        // Check tender exists
        const tender = await getTenderById(tender_id);

        if (!tender) {
            return res.status(404).json({
                message: 'Tender not found'
            });
        }

        // Save file path
        const filePath = req.file.path.replace(/\\/g, '/');

        const documentData = {
            tender_id,
            uploaded_by: req.user.user_id,
            file_path: filePath
        };

        const documentId = await createDocument(documentData);

        return res.status(201).json({
            message: 'Document uploaded successfully',
            document_id: documentId,
            file_path: filePath
        });

    } catch (error) {
        console.log(error);

        return res.status(500).json({
            message: 'Server error while uploading document'
        });
    }
};

// Admin can view all documents
const viewAllDocuments = async (req, res) => {
    try {
        const documents = await getAllDocuments();

        return res.json({
            message: 'Documents loaded successfully',
            documents: documents
        });

    } catch (error) {
        console.log(error);

        return res.status(500).json({
            message: 'Server error while loading documents'
        });
    }
};

// Admin can view pending documents
const viewPendingDocuments = async (req, res) => {
    try {
        const documents = await getPendingDocuments();

        return res.json({
            message: 'Pending documents loaded successfully',
            documents: documents
        });

    } catch (error) {
        console.log(error);

        return res.status(500).json({
            message: 'Server error while loading pending documents'
        });
    }
};

// Admin validates document
const validateUploadedDocument = async (req, res) => {
    try {
        const documentId = req.params.id;
        const { status } = req.body;

        // Only allow approve or reject
        const allowedStatus = ['APPROVED', 'REJECTED'];

        if (!allowedStatus.includes(status)) {
            return res.status(400).json({
                message: 'Status must be APPROVED or REJECTED'
            });
        }

        // Check document exists
        const document = await getDocumentById(documentId);

        if (!document) {
            return res.status(404).json({
                message: 'Document not found'
            });
        }

        const affectedRows = await validateDocument(documentId, status);

        if (affectedRows === 0) {
            return res.status(400).json({
                message: 'Document validation failed'
            });
        }

        return res.json({
            message: 'Document validated successfully',
            status: status
        });

    } catch (error) {
        console.log(error);

        return res.status(500).json({
            message: 'Server error while validating document'
        });
    }
};

// Authority views approved documents for own tender
const viewApprovedTenderDocuments = async (req, res
) => {
    try {
        const tenderId =
            Number(req.params.tenderId);

        const authorityId =
            Number(req.user.user_id);

        if (!tenderId) {
            return res.status(400).json({
                message: 'Invalid tender ID'
            });
        }

        const documents =
            await getApprovedDocumentsForTender(
                tenderId,
                authorityId
            );

        return res.json({
            message:
                'Approved documents loaded successfully',

            documents: documents
        });

    } catch (error) {
        console.log(error);

        return res.status(500).json({
            message:
                'Server error while loading documents'
        });
    }
};

module.exports = {
    uploadDocument,
    viewAllDocuments,
    viewPendingDocuments,
    validateUploadedDocument,
    viewApprovedTenderDocuments
};