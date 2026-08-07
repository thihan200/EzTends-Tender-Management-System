const db = require('../config/db');

// Save report generation record
const saveReportRecord = async (type, generatedBy) => {
    const [result] = await db.query(
        'INSERT INTO reports (type, generated_by) VALUES (?, ?)',
        [type, generatedBy]
    );

    return result.insertId;
};

// Admin dashboard summary
const getAdminSummary = async () => {
    const [[userCounts]] = await db.query(
        `SELECT
            COUNT(*) AS total_users,
            IFNULL(SUM(type = 'ADMIN'), 0) AS total_admins,
            IFNULL(SUM(type = 'SUPPLIER'), 0) AS total_suppliers,
            IFNULL(SUM(type = 'TENDERING_AUTHORITY'), 0) AS total_authorities
        FROM users`
    );

    const [[tenderCounts]] = await db.query(
        `SELECT
            COUNT(*) AS total_tenders,
            IFNULL(SUM(status = 'OPEN'), 0) AS open_tenders,
            IFNULL(SUM(status = 'CLOSED'), 0) AS closed_tenders,
            IFNULL(SUM(status = 'AWARDED'), 0) AS awarded_tenders,
            IFNULL(SUM(status = 'CANCELLED'), 0) AS cancelled_tenders
        FROM tenders`
    );

    const [[bidCounts]] = await db.query(
        `SELECT
            COUNT(*) AS total_bids,
            IFNULL(SUM(status = 'SUBMITTED'), 0) AS submitted_bids,
            IFNULL(SUM(status = 'UPDATED'), 0) AS updated_bids,
            IFNULL(SUM(status = 'CANCELLED'), 0) AS cancelled_bids,
            IFNULL(SUM(status = 'APPROVED'), 0) AS approved_bids,
            IFNULL(SUM(status = 'REJECTED'), 0) AS rejected_bids
        FROM bids`
    );

    const [[documentCounts]] = await db.query(
        `SELECT
            COUNT(*) AS total_documents,
            IFNULL(SUM(status = 'PENDING'), 0) AS pending_documents,
            IFNULL(SUM(status = 'APPROVED'), 0) AS approved_documents,
            IFNULL(SUM(status = 'REJECTED'), 0) AS rejected_documents
        FROM documents`
    );

    return {
        users: userCounts,
        tenders: tenderCounts,
        bids: bidCounts,
        documents: documentCounts
    };
};

// Tendering Authority dashboard summary
const getAuthoritySummary = async (authorityId) => {
    const [[tenderCounts]] = await db.query(
        `SELECT
            COUNT(*) AS total_tenders,
            IFNULL(SUM(status = 'OPEN'), 0) AS open_tenders,
            IFNULL(SUM(status = 'CLOSED'), 0) AS closed_tenders,
            IFNULL(SUM(status = 'AWARDED'), 0) AS awarded_tenders,
            IFNULL(SUM(status = 'CANCELLED'), 0) AS cancelled_tenders
        FROM tenders
        WHERE created_by = ?`,
        [authorityId]
    );

    const [[bidCounts]] = await db.query(
        `SELECT
            COUNT(b.bid_id) AS total_bids,
            IFNULL(SUM(b.status = 'SUBMITTED'), 0) AS submitted_bids,
            IFNULL(SUM(b.status = 'UPDATED'), 0) AS updated_bids,
            IFNULL(SUM(b.status = 'CANCELLED'), 0) AS cancelled_bids,
            IFNULL(SUM(b.status = 'APPROVED'), 0) AS approved_bids,
            IFNULL(SUM(b.status = 'REJECTED'), 0) AS rejected_bids
        FROM bids b
        JOIN tenders t ON b.tender_id = t.tender_id
        WHERE t.created_by = ?`,
        [authorityId]
    );

    const [[documentCounts]] = await db.query(
        `SELECT
            COUNT(d.document_id) AS total_documents,
            IFNULL(SUM(d.status = 'PENDING'), 0) AS pending_documents,
            IFNULL(SUM(d.status = 'APPROVED'), 0) AS approved_documents,
            IFNULL(SUM(d.status = 'REJECTED'), 0) AS rejected_documents
        FROM documents d
        JOIN tenders t ON d.tender_id = t.tender_id
        WHERE t.created_by = ?`,
        [authorityId]
    );

    return {
        tenders: tenderCounts,
        bids: bidCounts,
        documents: documentCounts
    };
};

// Tender report for Admin
const getAdminTenderReport = async () => {
    const [rows] = await db.query(
        `SELECT
            t.tender_id,
            t.title,
            t.budget,
            t.open_date,
            t.close_date,
            t.status,
            c.category_name,
            u.name AS authority_name,
            COUNT(b.bid_id) AS total_bids
        FROM tenders t
        JOIN categories c ON t.category_id = c.category_id
        JOIN users u ON t.created_by = u.user_id
        LEFT JOIN bids b ON t.tender_id = b.tender_id
        GROUP BY
            t.tender_id, t.title, t.budget, t.open_date, t.close_date,
            t.status, c.category_name, u.name
        ORDER BY t.tender_id DESC`
    );

    return rows;
};

// Tender report for Tendering Authority
const getAuthorityTenderReport = async (authorityId) => {
    const [rows] = await db.query(
        `SELECT
            t.tender_id,
            t.title,
            t.budget,
            t.open_date,
            t.close_date,
            t.status,
            c.category_name,
            COUNT(b.bid_id) AS total_bids
        FROM tenders t
        JOIN categories c ON t.category_id = c.category_id
        LEFT JOIN bids b ON t.tender_id = b.tender_id
        WHERE t.created_by = ?
        GROUP BY
            t.tender_id, t.title, t.budget, t.open_date, t.close_date,
            t.status, c.category_name
        ORDER BY t.tender_id DESC`,
        [authorityId]
    );

    return rows;
};

// Bid report for Admin
const getAdminBidReport = async () => {
    const [rows] = await db.query(
        `SELECT
            b.bid_id,
            b.amount,
            b.status AS bid_status,
            b.submitted_at,
            t.tender_id,
            t.title AS tender_title,
            u.name AS supplier_name,
            u.email AS supplier_email,
            s.company_name
        FROM bids b
        JOIN tenders t ON b.tender_id = t.tender_id
        JOIN users u ON b.supplier_id = u.user_id
        JOIN suppliers s ON b.supplier_id = s.supplier_id
        ORDER BY b.bid_id DESC`
    );

    return rows;
};

// Bid report for Tendering Authority
const getAuthorityBidReport = async (authorityId) => {
    const [rows] = await db.query(
        `SELECT
            b.bid_id,
            b.amount,
            b.status AS bid_status,
            b.submitted_at,
            t.tender_id,
            t.title AS tender_title,
            u.name AS supplier_name,
            u.email AS supplier_email,
            s.company_name
        FROM bids b
        JOIN tenders t ON b.tender_id = t.tender_id
        JOIN users u ON b.supplier_id = u.user_id
        JOIN suppliers s ON b.supplier_id = s.supplier_id
        WHERE t.created_by = ?
        ORDER BY b.bid_id DESC`,
        [authorityId]
    );

    return rows;
};

// User activity report - Admin only
const getUserActivityReport = async () => {
    const [rows] = await db.query(
        `SELECT
            u.user_id,
            u.name,
            u.email,
            u.type,
            u.created_at,
            COUNT(DISTINCT t.tender_id) AS tender_count,
            COUNT(DISTINCT b.bid_id) AS bid_count,
            COUNT(DISTINCT d.document_id) AS document_count
        FROM users u
        LEFT JOIN tenders t ON u.user_id = t.created_by
        LEFT JOIN bids b ON u.user_id = b.supplier_id
        LEFT JOIN documents d ON u.user_id = d.uploaded_by
        GROUP BY
            u.user_id, u.name, u.email, u.type, u.created_at
        ORDER BY u.user_id DESC`
    );

    return rows;
};

// Report generation history - Admin only
const getReportHistory = async () => {
    const [rows] = await db.query(
        `SELECT
            r.report_id,
            r.type,
            r.generated_date,
            u.name AS generated_by_name,
            u.email AS generated_by_email
        FROM reports r
        JOIN users u ON r.generated_by = u.user_id
        ORDER BY r.report_id DESC`
    );

    return rows;
};

module.exports = {
    saveReportRecord,
    getAdminSummary,
    getAuthoritySummary,
    getAdminTenderReport,
    getAuthorityTenderReport,
    getAdminBidReport,
    getAuthorityBidReport,
    getUserActivityReport,
    getReportHistory
};