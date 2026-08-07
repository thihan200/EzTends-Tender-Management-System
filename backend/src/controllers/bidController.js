const fs = require('fs');
const path = require('path');

const {
    getTenderForBid,
    createBid,
    getMyBids,
    getBidByIdAndSupplier,
    updateBid: updateBidModel,
    cancelBid: cancelBidModel,
    getBidsByTender,
    getBidForSelection,
    selectWinningBid
} = require('../models/bidModel');

// Check tender deadline
const isTenderClosed = (closeDate) => {
    const deadline = new Date(closeDate);

    // Set the time to end of day
    deadline.setHours(23, 59, 59, 999);

    return new Date() > deadline;
};

// Get physical file location
const getProposalFullPath = (filePath) => {
    if (!filePath) {
        return null;
    }

    // Use absolute path directly
    if (path.isAbsolute(filePath)) {
        return filePath;
    }

    // Convert Windows slashes
    const cleanPath = String(filePath)
        .replaceAll('\\', '/')
        .replace(/^\/+/, '');

    // controllers -> src -> backend
    return path.join(
        __dirname,
        '../../',
        cleanPath
    );
};

// Delete proposal file
const deleteProposalFile = (filePath) => {
    try {
        const fullPath = getProposalFullPath(filePath);

        if (fullPath && fs.existsSync(fullPath)) {
            fs.unlinkSync(fullPath);
        }

    } catch (error) {
        console.log(
            'Could not delete proposal file:',
            error.message
        );
    }
};

// Submit new bid
const submitBid = async (req, res) => {
    const proposalFile = req.file ? req.file.path : null;

    try {
        const {
            tender_id,
            amount
        } = req.body;

        // Validate fields
        if (!tender_id || !amount) {
            deleteProposalFile(proposalFile);

            return res.status(400).json({
                message: 'Tender ID and amount are required'
            });
        }

        // Validate amount
        if (Number(amount) <= 0) {
            deleteProposalFile(proposalFile);

            return res.status(400).json({
                message: 'Enter a valid bid amount'
            });
        }

        // Check proposal file
        if (!proposalFile) {
            return res.status(400).json({
                message: 'Proposal document is required'
            });
        }

        // Check tender exists
        const tender = await getTenderForBid(tender_id);

        if (!tender) {
            deleteProposalFile(proposalFile);

            return res.status(404).json({
                message: 'Tender not found'
            });
        }

        // Check tender status
        if (tender.status !== 'OPEN') {
            deleteProposalFile(proposalFile);

            return res.status(400).json({
                message: 'This tender is not open for bidding'
            });
        }

        // Check deadline
        if (isTenderClosed(tender.close_date)) {
            deleteProposalFile(proposalFile);

            return res.status(400).json({
                message: 'Tender deadline has passed'
            });
        }

        const bidData = {
            supplier_id: req.user.user_id,
            tender_id: tender_id,
            amount: amount,
            proposal_file: proposalFile
        };

        // Save bid
        const bidId = await createBid(bidData);

        return res.status(201).json({
            message: 'Bid submitted successfully',
            bid_id: bidId
        });

    } catch (error) {
        console.log(error);

        // Delete uploaded file when bid saving fails
        deleteProposalFile(proposalFile);

        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(400).json({
                message:
                    'You have already submitted a bid for this tender'
            });
        }

        return res.status(500).json({
            message: 'Server error while submitting bid'
        });
    }
};

// View logged Supplier bids
const viewMyBids = async (req, res) => {
    try {
        const bids = await getMyBids(
            req.user.user_id
        );

        return res.json({
            message: 'My bids loaded successfully',
            bids: bids
        });

    } catch (error) {
        console.log(error);

        return res.status(500).json({
            message: 'Server error while loading my bids'
        });
    }
};

// Update own bid
const editBid = async (req, res) => {
    const newProposalFile = req.file
        ? req.file.path
        : null;

    try {
        const bidId = req.params.id;
        const supplierId = req.user.user_id;
        const { amount } = req.body;

        // Validate amount
        if (!amount || Number(amount) <= 0) {
            deleteProposalFile(newProposalFile);

            return res.status(400).json({
                message: 'Valid bid amount is required'
            });
        }

        // Check bid belongs to logged Supplier
        const bid = await getBidByIdAndSupplier(
            bidId,
            supplierId
        );

        if (!bid) {
            deleteProposalFile(newProposalFile);

            return res.status(404).json({
                message:
                    'Bid not found or you do not have permission'
            });
        }

        // Cannot update cancelled bid
        if (bid.status === 'CANCELLED') {
            deleteProposalFile(newProposalFile);

            return res.status(400).json({
                message: 'Cancelled bid cannot be updated'
            });
        }

        // Cannot update approved or rejected bid
        if (
            bid.status === 'APPROVED' ||
            bid.status === 'REJECTED'
        ) {
            deleteProposalFile(newProposalFile);

            return res.status(400).json({
                message:
                    'Approved or rejected bid cannot be updated'
            });
        }

        // Check tender is still open
        if (bid.tender_status !== 'OPEN') {
            deleteProposalFile(newProposalFile);

            return res.status(400).json({
                message:
                    'Tender is not open for bid updates'
            });
        }

        // Check deadline
        if (isTenderClosed(bid.close_date)) {
            deleteProposalFile(newProposalFile);

            return res.status(400).json({
                message: 'Tender deadline has passed'
            });
        }

        /*
         * Pass only the new file.
         * When it is null, the model keeps the old file.
         */
        const affectedRows = await updateBidModel(
            bidId,
            supplierId,
            amount,
            newProposalFile
        );

        if (affectedRows === 0) {
            deleteProposalFile(newProposalFile);

            return res.status(400).json({
                message: 'Bid update failed'
            });
        }

        // Delete old file after replacement succeeds
        if (
            newProposalFile &&
            bid.proposal_file
        ) {
            deleteProposalFile(
                bid.proposal_file
            );
        }

        return res.json({
            message: 'Bid updated successfully'
        });

    } catch (error) {
        console.log(error);

        // Remove new file when database update fails
        deleteProposalFile(newProposalFile);

        return res.status(500).json({
            message: 'Server error while updating bid'
        });
    }
};

// Cancel own bid
const removeBid = async (req, res) => {
    try {
        const bidId = req.params.id;
        const supplierId = req.user.user_id;

        // Check bid belongs to logged Supplier
        const bid = await getBidByIdAndSupplier(
            bidId,
            supplierId
        );

        if (!bid) {
            return res.status(404).json({
                message:
                    'Bid not found or you do not have permission'
            });
        }

        // Cannot cancel already cancelled bid
        if (bid.status === 'CANCELLED') {
            return res.status(400).json({
                message: 'Bid is already cancelled'
            });
        }

        // Cannot cancel selected bid
        if (bid.status === 'APPROVED') {
            return res.status(400).json({
                message: 'Approved bid cannot be cancelled'
            });
        }

        // Tender must still be open
        if (bid.tender_status !== 'OPEN') {
            return res.status(400).json({
                message:
                    'Tender is not open for bid cancellation'
            });
        }

        // Check deadline
        if (isTenderClosed(bid.close_date)) {
            return res.status(400).json({
                message:
                    'Tender deadline has passed. Bid cannot be cancelled'
            });
        }

        /*
         * Model changes status to CANCELLED
         * and sets proposal_file to NULL.
         */
        const affectedRows = await cancelBidModel(
            bidId,
            supplierId
        );

        if (affectedRows === 0) {
            return res.status(400).json({
                message: 'Bid cancellation failed'
            });
        }

        // Delete physical proposal file
        deleteProposalFile(
            bid.proposal_file
        );

        return res.json({
            message: 'Bid cancelled successfully'
        });

    } catch (error) {
        console.log(error);

        return res.status(500).json({
            message: 'Server error while cancelling bid'
        });
    }
};

// Tendering Authority views bids for own tender
const viewTenderBids = async (req, res) => {
    try {
        const tenderId = req.params.tenderId;

        const bids = await getBidsByTender(
            tenderId,
            req.user.user_id
        );

        return res.json({
            message: 'Tender bids loaded successfully',
            bids: bids
        });

    } catch (error) {
        console.log(error);

        return res.status(500).json({
            message:
                'Server error while loading tender bids'
        });
    }
};

// Tendering Authority selects Supplier
const selectSupplier = async (req, res) => {
    try {
        const bidId = req.params.bidId;

        // Check bid exists
        const bid = await getBidForSelection(
            bidId
        );

        if (!bid) {
            return res.status(404).json({
                message: 'Bid not found'
            });
        }

        // Check tender ownership
        if (bid.created_by !== req.user.user_id) {
            return res.status(403).json({
                message:
                    'You do not have permission to select this bid'
            });
        }

        // Check tender status
        if (bid.tender_status === 'AWARDED') {
            return res.status(400).json({
                message: 'This tender is already awarded'
            });
        }

        if (bid.tender_status === 'CANCELLED') {
            return res.status(400).json({
                message:
                    'Cancelled tender cannot be awarded'
            });
        }

        // Cancelled bid cannot be selected
        if (bid.bid_status === 'CANCELLED') {
            return res.status(400).json({
                message: 'Cancelled bid cannot be selected'
            });
        }

        // Select Supplier and award tender
        await selectWinningBid(
            bid.bid_id,
            bid.tender_id
        );

        return res.json({
            message:
                'Supplier selected and tender awarded successfully',
            tender_id: bid.tender_id,
            selected_bid_id: bid.bid_id,
            selected_supplier_id: bid.supplier_id
        });

    } catch (error) {
        console.log(error);

        return res.status(500).json({
            message:
                'Server error while selecting supplier'
        });
    }
};

module.exports = {
    submitBid,
    viewMyBids,
    editBid,
    removeBid,
    viewTenderBids,
    selectSupplier
};