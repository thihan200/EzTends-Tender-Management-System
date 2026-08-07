const db = require('../config/db');

// Find user by email
const findUserByEmail = async (email) => {
    const [rows] = await db.query(
        `SELECT
            user_id, name, email, password, type, account_status
         FROM users
         WHERE email = ?`,
        [email]
    );

    return rows[0];
};

// Find user by ID
const findUserById = async (userId) => {
    const [rows] = await db.query(
        `SELECT *
         FROM users
         WHERE user_id = ?`,
        [userId]
    );

    return rows[0];
};

// Create user and role profile
const createUser = async (userData) => {
    const connection = await db.getConnection();

    try {
        // Start transaction
        await connection.beginTransaction();

        // Create main user account
        const [userResult] = await connection.query(
            `INSERT INTO users
            (name, email, password, type)
            VALUES (?, ?, ?, ?)`,
            [
                userData.name,
                userData.email,
                userData.hashedPassword,
                userData.type
            ]
        );

        const userId = userResult.insertId;

        // Create Supplier profile
        if (userData.type === 'SUPPLIER') {
            await connection.query(
                `INSERT INTO suppliers
                (supplier_id, company_name, business_reg_no, tax_id)
                VALUES (?, ?, ?, ?)`,
                [
                    userId,
                    userData.company_name,
                    userData.business_reg_no,
                    userData.tax_id
                ]
            );
        }

        // Create Tendering Authority profile
        if (userData.type === 'TENDERING_AUTHORITY') {
            await connection.query(
                `INSERT INTO tendering_authorities
                (authority_id, organization_name, registration_no, address)
                VALUES (?, ?, ?, ?)`,
                [
                    userId,
                    userData.organization_name,
                    userData.registration_no,
                    userData.address
                ]
            );
        }

        // Save all changes
        await connection.commit();

        return userId;

    } catch (error) {
        // Undo all changes when an error happens
        await connection.rollback();
        throw error;

    } finally {
        connection.release();
    }
};

// Get Supplier profile
const getSupplierProfile = async (userId) => {
    const [rows] = await db.query(
        `SELECT
            u.user_id,
            u.name,
            u.email,
            u.type,
            s.company_name,
            s.business_reg_no,
            s.tax_id
        FROM users u
        LEFT JOIN suppliers s
            ON u.user_id = s.supplier_id
        WHERE u.user_id = ?`,
        [userId]
    );

    return rows[0];
};

// Update Supplier profile
const updateSupplierProfile = async (userId, profileData) => {
    const connection = await db.getConnection();

    try {
        await connection.beginTransaction();

        // Update common user details
        await connection.query(
            `UPDATE users
             SET name = ?, email = ?
             WHERE user_id = ?`,
            [
                profileData.name,
                profileData.email,
                userId
            ]
        );

        // Update Supplier details
        await connection.query(
            `UPDATE suppliers
             SET company_name = ?,
                 business_reg_no = ?,
                 tax_id = ?
             WHERE supplier_id = ?`,
            [
                profileData.company_name,
                profileData.business_reg_no,
                profileData.tax_id,
                userId
            ]
        );

        await connection.commit();

    } catch (error) {
        await connection.rollback();
        throw error;

    } finally {
        connection.release();
    }
};

// Get Tendering Authority profile
const getAuthorityProfile = async (userId) => {
    const [rows] = await db.query(
        `SELECT
            u.user_id,
            u.name,
            u.email,
            u.type,
            ta.organization_name,
            ta.registration_no,
            ta.address
        FROM users u
        LEFT JOIN tendering_authorities ta
            ON u.user_id = ta.authority_id
        WHERE u.user_id = ?
        LIMIT 1`,
        [userId]
    );

    return rows[0];
};

// Update Tendering Authority profile
const updateAuthorityProfile = async (
    userId,
    profileData
) => {
    const connection = await db.getConnection();

    try {
        await connection.beginTransaction();

        // Update user details
        await connection.query(
            `UPDATE users
             SET name = ?, email = ?
             WHERE user_id = ?`,
            [
                profileData.name,
                profileData.email,
                userId
            ]
        );

        // Update Authority details
        await connection.query(
            `UPDATE tendering_authorities
             SET organization_name = ?,
                 registration_no = ?,
                 address = ?
             WHERE authority_id = ?`,
            [
                profileData.organization_name,
                profileData.registration_no,
                profileData.address,
                userId
            ]
        );

        await connection.commit();

    } catch (error) {
        await connection.rollback();
        throw error;

    } finally {
        connection.release();
    }
};

// Update password
const updateUserPassword = async (userId, hashedPassword) => {
    await db.query(
        `UPDATE users
         SET password = ?
         WHERE user_id = ?`,
        [hashedPassword, userId]
    );
};

// Get Admin profile
const getAdminProfile = async (userId) => {
    const [rows] = await db.query(
        `SELECT
            u.user_id,
            u.name,
            u.email,
            u.type,
            u.created_at,
            a.admin_level
        FROM users u
        LEFT JOIN admins a
            ON u.user_id = a.admin_id
        WHERE u.user_id = ?
        LIMIT 1`,
        [userId]
    );

    return rows[0];
};

// Update Admin profile
const updateAdminProfile = async (
    userId,
    profileData
) => {
    const [result] = await db.query(
        `UPDATE users
         SET name = ?, email = ?
         WHERE user_id = ?`,
        [
            profileData.name,
            profileData.email,
            userId
        ]
    );

    return result.affectedRows;
};

module.exports = {
    findUserByEmail,
    findUserById,
    createUser,
    getAdminProfile,
    updateAdminProfile,
    getSupplierProfile,
    updateSupplierProfile,
    getAuthorityProfile,
    updateAuthorityProfile,
    updateUserPassword
};