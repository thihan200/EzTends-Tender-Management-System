const db = require('../config/db');

// Check tender exists
const getTenderById = async (tenderId) => {
    const [rows] = await db.query(
        'SELECT * FROM tenders WHERE tender_id = ?',
        [tenderId]
    );

    return rows[0];
};

// Save uploaded document
const createDocument = async (documentData) => {
    const {
        tender_id,
        uploaded_by,
        file_path
    } = documentData;

    const [result] = await db.query(
        `INSERT INTO documents
        (tender_id, uploaded_by, file_path, status)
        VALUES (?, ?, ?, ?)`,
        [tender_id, uploaded_by, file_path, 'PENDING']
    );

    return result.insertId;
};

// Get all documents
const getAllDocuments = async () => {
    const [rows] = await db.query(
        `SELECT
            d.document_id,
            d.file_path,
            d.status,
            d.uploaded_at,
            t.tender_id,
            t.title AS tender_title,
            u.user_id,
            u.name AS uploaded_by_name,
            u.email AS uploaded_by_email,
            u.type AS uploaded_by_type
        FROM documents d
        JOIN tenders t ON d.tender_id = t.tender_id
        JOIN users u ON d.uploaded_by = u.user_id
        ORDER BY d.document_id DESC`
    );

    return rows;
};

// Get pending documents
const getPendingDocuments = async () => {
    const [rows] = await db.query(
        `SELECT
            d.document_id,
            d.file_path,
            d.status,
            d.uploaded_at,
            t.tender_id,
            t.title AS tender_title,
            u.name AS uploaded_by_name,
            u.email AS uploaded_by_email,
            u.type AS uploaded_by_type
        FROM documents d
        JOIN tenders t ON d.tender_id = t.tender_id
        JOIN users u ON d.uploaded_by = u.user_id
        WHERE d.status = ?
        ORDER BY d.document_id DESC`,
        ['PENDING']
    );

    return rows;
};

// Get document by id
const getDocumentById = async (documentId) => {
    const [rows] = await db.query(
        'SELECT * FROM documents WHERE document_id = ?',
        [documentId]
    );

    return rows[0];
};

// Validate document by admin
const validateDocument = async (documentId, status) => {
    const [result] = await db.query(
        'UPDATE documents SET status = ? WHERE document_id = ?',
        [status, documentId]
    );

    return result.affectedRows;
};

// Get approved documents for one Authority tender
const getApprovedDocumentsForTender = async (
    tenderId,
    authorityId
) => {
    const [rows] = await db.query(
        `SELECT
            d.document_id,
            d.tender_id,
            d.uploaded_by,
            d.file_path,
            d.status,
            d.uploaded_at,

            t.title AS tender_title,

            u.name AS uploaded_by_name,
            u.email AS uploaded_by_email,

            s.company_name

        FROM documents d

        INNER JOIN tenders t
            ON d.tender_id = t.tender_id

        INNER JOIN users u
            ON d.uploaded_by = u.user_id

        LEFT JOIN suppliers s
            ON u.user_id = s.supplier_id

        WHERE d.tender_id = ?
        AND t.created_by = ?
        AND d.status = 'APPROVED'

        ORDER BY d.uploaded_at DESC`,
        [tenderId, authorityId]
    );

    return rows;
};

module.exports = {
    getTenderById,
    createDocument,
    getAllDocuments,
    getPendingDocuments,
    getDocumentById,
    validateDocument,
    getApprovedDocumentsForTender
};