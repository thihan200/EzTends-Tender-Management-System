const {
    createTender,
    getAllTenders,
    getMyTenders,
    getTenderById,
    updateTender,
    updateTenderStatus,
    cancelTender,
    searchTenders,
    reopenTender,
    closeExpiredTenders
} = require('../models/tenderModel');

// Create tender
const addTender = async (req, res) => {
    try {
        const {
            title,
            description,
            budget,
            open_date,
            close_date,
            status,
            category_id
        } = req.body;

        // Check required fields
        if (!title || !description || !budget || !open_date || !close_date || !category_id) {
            return res.status(400).json({
                message: 'Required fields are missing'
            });
        }

        // Validate budget
        if (Number(budget) <= 0) {
            return res.status(400).json({
                message: 'Budget must be greater than zero'
            });
        }

        // Validate dates
        if (new Date(close_date) <= new Date(open_date)) {
            return res.status(400).json({
                message: 'Closing date must be after the open date'
            });
        }

        // Validate status
        const allowedStatuses = [
            'DRAFT',
            'OPEN'
        ];

        const tenderStatus = allowedStatuses.includes(status) ? status : 'DRAFT';

        // Validate budget
        if (Number(budget) <= 0) {
            return res.status(400).json({
                message: 'Budget must be greater than zero'
            });
        }

        // Validate dates
        if (new Date(close_date) <= new Date(open_date)) {
            return res.status(400).json({
                message: 'Closing date must be after the open date'
            });
        }

        const tenderData = {
            title,
            description,
            budget,
            open_date,
            close_date,
            status: tenderStatus,
            created_by: req.user.user_id,
            category_id
        };

        const tenderId = await createTender(
            tenderData
        );

        return res.status(201).json({
            message: 'Tender created successfully',
            tender_id: tenderId
        });

    } catch (error) {
        console.log(error);

        return res.status(500).json({
            message: 'Server error while creating tender'
        });
    }
};

// View all tenders
const viewAllTenders = async (req, res) => {
    try {
        await closeExpiredTenders();

        const tenders = await getAllTenders();

        return res.json({
            message: 'Tenders loaded successfully',
            tenders: tenders
        });

    } catch (error) {
        console.log(error);

        return res.status(500).json({
            message: 'Server error while loading tenders'
        });
    }
};

// View logged Authority tenders
const viewMyTenders = async (req, res) => {
    try {
        await closeExpiredTenders();

        const tenders = await getMyTenders(
            req.user.user_id
        );

        return res.json({
            message: 'My tenders loaded successfully',
            tenders: tenders
        });

    } catch (error) {
        console.log(error);

        return res.status(500).json({
            message: 'Server error while loading my tenders'
        });
    }
};

// View one tender
const viewTenderById = async (req, res) => {
    try {
        await closeExpiredTenders();

        const tenderId = req.params.id;

        const tender = await getTenderById(tenderId);

        if (!tender) {
            return res.status(404).json({
                message: 'Tender not found'
            });
        }

        return res.json({
            message: 'Tender loaded successfully',
            tender: tender
        });

    } catch (error) {
        console.log(error);

        return res.status(500).json({
            message: 'Server error while loading tender'
        });
    }
};

// Update tender
const editTender = async (req, res) => {
    try {
        const tenderId = req.params.id;

        const {
            title,
            description,
            budget,
            open_date,
            close_date,
            status,
            category_id
        } = req.body;

        // Validation for required fields
        if (!title || !description || !open_date || !close_date || !status || !category_id) {
            return res.status(400).json({
                message: 'Required fields are missing'
            });
        }

        const tenderData = {
            title,
            description,
            budget,
            open_date,
            close_date,
            status,
            category_id
        };

        const affectedRows = await updateTender(tenderId, req.user.user_id, tenderData);

        if (affectedRows === 0) {
            return res.status(404).json({
                message: 'Tender not found or you do not have permission'
            });
        }

        return res.json({
            message: 'Tender updated successfully'
        });

    } catch (error) {
        console.log(error);

        return res.status(500).json({
            message: 'Server error while updating tender'
        });
    }
};

// Change tender status
const changeTenderStatus = async (req, res) => {
    try {
        const tenderId = req.params.id;
        const { status } = req.body;

        // My Tenders currently uses this to close tenders
        if (status !== 'CLOSED') {
            return res.status(400).json({
                message: 'Only CLOSED status is allowed'
            });
        }

        const affectedRows = await updateTenderStatus(
            tenderId,
            req.user.user_id,
            status
        );

        if (affectedRows === 0) {
            return res.status(404).json({
                message:
                    'Open tender not found or you do not have permission'
            });
        }

        return res.json({
            message: 'Tender closed successfully'
        });

    } catch (error) {
        console.log(error);

        return res.status(500).json({
            message: 'Server error while closing tender'
        });
    }
};

// Cancel tender
const removeTender = async (req, res) => {
    try {
        const tenderId = req.params.id;

        const affectedRows = await cancelTender(
            tenderId,
            req.user.user_id
        );

        if (affectedRows === 0) {
            return res.status(404).json({
                message:
                    'Tender not found, already cancelled, awarded, or you do not have permission'
            });
        }

        return res.json({
            message: 'Tender cancelled successfully'
        });

    } catch (error) {
        console.log(error);

        return res.status(500).json({
            message: 'Server error while cancelling tender'
        });
    }
};

// Search and filter tenders
const searchTenderList = async (req, res) => {
    try {
        await closeExpiredTenders();
        
        const { keyword, category_id, status } = req.query;

        const tenders = await searchTenders(keyword, category_id, status);

        return res.json({
            message: 'Tender search completed successfully',
            tenders: tenders
        });

    } catch (error) {
        console.log(error);

        return res.status(500).json({
            message: 'Server error while searching tenders'
        });
    }
};

// Reopen a closed tender
const reopenClosedTender = async (req, res) => {
    try {
        const tenderId = req.params.id;
        const { close_date } = req.body;

        if (!close_date) {
            return res.status(400).json({
                message: 'New closing date is required'
            });
        }

        const newCloseDate = new Date(close_date);
        const today = new Date();

        if (newCloseDate <= today) {
            return res.status(400).json({
                message: 'Closing date must be in the future'
            });
        }

        const affectedRows = await reopenTender(
            tenderId,
            req.user.user_id,
            close_date
        );

        if (affectedRows === 0) {
            return res.status(404).json({
                message:
                    'Closed tender not found or you do not have permission'
            });
        }

        return res.json({
            message: 'Tender reopened successfully'
        });

    } catch (error) {
        console.log(error);

        return res.status(500).json({
            message: 'Server error while reopening tender'
        });
    }
};

module.exports = {
    addTender,
    viewAllTenders,
    viewMyTenders,
    viewTenderById,
    editTender,
    changeTenderStatus,
    removeTender,
    searchTenderList,
    reopenClosedTender
};