const db = require('../config/db');

// Get tender details for bid submission
const getTenderForBid = async (tenderId) => {
    const [rows] = await db.query(
        'SELECT * FROM tenders WHERE tender_id = ?',
        [tenderId]
    );

    return rows[0];
};

// Create new bid
const createBid = async (bidData) => {
    const {
        supplier_id,
        tender_id,
        amount,
        proposal_file
    } = bidData;

    const [result] = await db.query(
        `INSERT INTO bids
        (supplier_id, tender_id, amount, proposal_file, status)
        VALUES (?, ?, ?, ?, ?)`,
        [supplier_id, tender_id, amount, proposal_file, 'SUBMITTED']
    );

    return result.insertId;
};

// Get all bids submitted by logged supplier
const getMyBids = async (supplierId) => {
    const [rows] = await db.query(
        `SELECT
            b.bid_id,
            b.tender_id,
            b.amount,
            b.proposal_file,
            b.submitted_at,
            b.status,
            t.title AS tender_title,
            t.close_date,
            t.status AS tender_status
        FROM bids b
        JOIN tenders t ON b.tender_id = t.tender_id
        WHERE b.supplier_id = ?
        ORDER BY b.submitted_at DESC`,
        [supplierId]
    );

    return rows;
};

// Get one bid by id and supplier
const getBidByIdAndSupplier = async (bidId, supplierId) => {
    const [rows] = await db.query(
        `SELECT
            b.*,
            t.close_date,
            t.status AS tender_status
        FROM bids b
        JOIN tenders t ON b.tender_id = t.tender_id
        WHERE b.bid_id = ? AND b.supplier_id = ?`,
        [bidId, supplierId]
    );

    return rows[0];
};

// Update supplier bid
const updateBid = async (bidId, supplierId, amount, proposalFile) => {
    let query;
    let values;

    // Replace proposal file
    if (proposalFile) {
        query = `
            UPDATE bids
            SET amount = ?,
                proposal_file = ?,
                status = ?
            WHERE bid_id = ?
            AND supplier_id = ?
        `;

        values = [
            amount,
            proposalFile,
            'UPDATED',
            bidId,
            supplierId
        ];
    } else {
        // Keep existing proposal file
        query = `
            UPDATE bids
            SET amount = ?,
                status = ?
            WHERE bid_id = ?
            AND supplier_id = ?
        `;

        values = [
            amount,
            'UPDATED',
            bidId,
            supplierId
        ];
    }

    const [result] = await db.query(
        query,
        values
    );


    return result.affectedRows;
};

// Cancel supplier bid
const cancelBid = async (bidId, supplierId) => {
    const [result] = await db.query(
        `UPDATE bids
        SET status = ?, proposal_file = NULL
        WHERE bid_id = ? AND supplier_id = ?`,
        ['CANCELLED', bidId, supplierId]
    );

    return result.affectedRows;
};

// Tendering Authority can view bids for their own tender
const getBidsByTender = async (tenderId, authorityId) => {
    const [rows] = await db.query(
        `SELECT
            b.bid_id,
            b.amount,
            b.proposal_file,
            b.submitted_at,
            b.status AS bid_status,
            s.company_name,
            u.name AS supplier_name,
            u.email AS supplier_email,
            t.title AS tender_title
        FROM bids b
        JOIN suppliers s ON b.supplier_id = s.supplier_id
        JOIN users u ON s.supplier_id = u.user_id
        JOIN tenders t ON b.tender_id = t.tender_id
        WHERE b.tender_id = ? AND t.created_by = ?
        ORDER BY b.bid_id DESC`,
        [tenderId, authorityId]
    );

    return rows;
};

// Get bid details for supplier selection
const getBidForSelection = async (bidId) => {
    const [rows] = await db.query(
        `SELECT
            b.bid_id,
            b.supplier_id,
            b.tender_id,
            b.amount,
            b.status AS bid_status,
            t.title AS tender_title,
            t.status AS tender_status,
            t.created_by
        FROM bids b
        JOIN tenders t ON b.tender_id = t.tender_id
        WHERE b.bid_id = ?`,
        [bidId]
    );

    return rows[0];
};

// Select supplier and award tender
const selectWinningBid = async (bidId, tenderId) => {
    const connection = await db.getConnection();

    try {
        // Start transaction because multiple tables are updated
        await connection.beginTransaction();

        // Approve selected bid
        await connection.query(
            `UPDATE bids
            SET status = ?
            WHERE bid_id = ?`,
            ['APPROVED', bidId]
        );

        // Reject other active bids for same tender
        await connection.query(
            `UPDATE bids
            SET status = ?
            WHERE tender_id = ?
            AND bid_id != ?
            AND status != ?`,
            ['REJECTED', tenderId, bidId, 'CANCELLED']
        );

        // Update tender status as awarded
        await connection.query(
            `UPDATE tenders
            SET status = ?
            WHERE tender_id = ?`,
            ['AWARDED', tenderId]
        );

        // Save all changes
        await connection.commit();

        return true;

    } catch (error) {
        // Cancel changes if error happens
        await connection.rollback();
        throw error;

    } finally {
        connection.release();
    }
};

module.exports = {
    getTenderForBid,
    createBid,
    getMyBids,
    getBidByIdAndSupplier,
    updateBid,
    cancelBid,
    getBidsByTender,
    getBidForSelection,
    selectWinningBid
};