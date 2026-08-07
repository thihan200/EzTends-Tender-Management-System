const db = require('../config/db');

// Create new tender
const createTender = async (tenderData) => {
    const {
        title,
        description,
        budget,
        open_date,
        close_date,
        status,
        created_by,
        category_id
    } = tenderData;

    const [result] = await db.query(
        `INSERT INTO tenders
        (title, description, budget, open_date, close_date, status, created_by, category_id)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [title, description, budget, open_date, close_date, status, created_by, category_id]
    );

    return result.insertId;
};

// Get all tenders
const getAllTenders = async () => {
    const [rows] = await db.query(
        `SELECT
            t.tender_id,
            t.title,
            t.description,
            t.budget,
            t.open_date,
            t.close_date,
            t.status,
            c.category_name,
            u.name AS created_by_name
        FROM tenders t
        JOIN categories c ON t.category_id = c.category_id
        JOIN users u ON t.created_by = u.user_id
        WHERE t.status != 'DRAFT'
        ORDER BY t.tender_id DESC`
    );

    return rows;
};

// Get tenders created by logged Authority
const getMyTenders = async (authorityId) => {
    const [rows] = await db.query(
        `SELECT
            t.tender_id,
            t.title,
            t.description,
            t.budget,
            t.open_date,
            t.close_date,
            t.status,
            t.created_by,
            t.category_id,
            t.created_at,
            c.category_name,
            (
                SELECT COUNT(*)
                FROM bids b
                WHERE b.tender_id = t.tender_id
            ) AS bid_count
        FROM tenders t
        LEFT JOIN categories c
            ON t.category_id = c.category_id
        WHERE t.created_by = ?
        ORDER BY t.created_at DESC`,
        [authorityId]
    );

    return rows;
};

// Get tender by id
const getTenderById = async (tenderId) => {
    const [rows] = await db.query(
        `SELECT
            t.tender_id,
            t.title,
            t.description,
            t.budget,
            t.open_date,
            t.close_date,
            t.status,
            t.created_by,
            t.category_id,
            t.created_at,
            c.category_name,
            u.name AS created_by_name
        FROM tenders t
        JOIN categories c
            ON t.category_id = c.category_id
        JOIN users u
            ON t.created_by = u.user_id
        WHERE t.tender_id = ?`,
        [tenderId]
    );

    return rows[0];
};

// Update tender
const updateTender = async (tenderId, authorityId, tenderData) => {
    const {
        title,
        description,
        budget,
        open_date,
        close_date,
        status,
        category_id
    } = tenderData;

    const [result] = await db.query(
        `UPDATE tenders
        SET title = ?, description = ?, budget = ?, open_date = ?, close_date = ?, status = ?, category_id = ?
        WHERE tender_id = ? AND created_by = ?`,
        [title, description, budget, open_date, close_date, status, category_id, tenderId, authorityId]
    );

    return result.affectedRows;
};

// Close an open tender
const updateTenderStatus = async (
    tenderId,
    authorityId,
    status
) => {
    const [result] = await db.query(
        `UPDATE tenders
         SET status = ?
         WHERE tender_id = ?
         AND created_by = ?
         AND status = 'OPEN'`,
        [
            status,
            tenderId,
            authorityId
        ]
    );

    return result.affectedRows;
};

// Cancel tender instead of deleting it
const cancelTender = async (
    tenderId,
    authorityId
) => {
    const [result] = await db.query(
        `UPDATE tenders
         SET status = 'CANCELLED'
         WHERE tender_id = ?
         AND created_by = ?
         AND status NOT IN ('AWARDED', 'CANCELLED')`,
        [
            tenderId,
            authorityId
        ]
    );

    return result.affectedRows;
};

// Search tenders by keyword, category or status
const searchTenders = async (keyword, category_id, status) => {
    let sql = `
        SELECT
            t.tender_id,
            t.title,
            t.description,
            t.budget,
            t.open_date,
            t.close_date,
            t.status,
            c.category_name,
            u.name AS created_by_name
        FROM tenders t
        JOIN categories c ON t.category_id = c.category_id
        JOIN users u ON t.created_by = u.user_id
        WHERE t.status != 'DRAFT'
    `;

    const values = [];

    // Search by title or description
    if (keyword) {
        sql += ` AND (t.title LIKE ? OR t.description LIKE ?)`;
        values.push(`%${keyword}%`, `%${keyword}%`);
    }

    // Filter by category
    if (category_id) {
        sql += ` AND t.category_id = ?`;
        values.push(category_id);
    }

    // Filter by status
    if (status) {
        sql += ` AND t.status = ?`;
        values.push(status);
    }

    sql += ` ORDER BY t.tender_id DESC`;

    const [rows] = await db.query(sql, values);
    return rows;
};

// Reopen a closed tender
const reopenTender = async (
    tenderId,
    authorityId,
    closeDate
) => {
    const [result] = await db.query(
        `UPDATE tenders
         SET status = 'OPEN',
             close_date = ?
         WHERE tender_id = ?
         AND created_by = ?
         AND status = 'CLOSED'`,
        [
            closeDate,
            tenderId,
            authorityId
        ]
    );

    return result.affectedRows;
};

// Automatically close expired open tenders
const closeExpiredTenders = async () => {
    const [result] = await db.query(
        `UPDATE tenders
         SET status = 'CLOSED'
         WHERE status = 'OPEN'
         AND close_date < CURDATE()`
    );

    return result.affectedRows;
};

module.exports = {
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
};