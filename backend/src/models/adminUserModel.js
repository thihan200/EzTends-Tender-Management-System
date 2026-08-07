const db = require('../config/db');

// Get all users with profile details
const getAllUsers = async () => {
    const [rows] = await db.query(
        `SELECT
            u.user_id,
            u.name,
            u.email,
            u.type,
            u.account_status,
            u.created_at,
            s.company_name,
            s.business_reg_no,
            s.tax_id,
            ta.organization_name,
            ta.registration_no,
            ta.address,
            a.admin_level
        FROM users u
        LEFT JOIN suppliers s ON u.user_id = s.supplier_id
        LEFT JOIN tendering_authorities ta ON u.user_id = ta.authority_id
        LEFT JOIN admins a ON u.user_id = a.admin_id
        ORDER BY u.user_id DESC`
    );

    return rows;
};

// Get one user by id
const getUserById = async (userId) => {
    const [rows] = await db.query(
        `SELECT
            u.user_id,
            u.name,
            u.email,
            u.type,
            u.account_status,
            u.created_at,
            s.company_name,
            s.business_reg_no,
            s.tax_id,
            ta.organization_name,
            ta.registration_no,
            ta.address,
            a.admin_level
        FROM users u
        LEFT JOIN suppliers s ON u.user_id = s.supplier_id
        LEFT JOIN tendering_authorities ta ON u.user_id = ta.authority_id
        LEFT JOIN admins a ON u.user_id = a.admin_id
        WHERE u.user_id = ?`,
        [userId]
    );

    return rows[0];
};

// Get user password for verification
const getUserPasswordById = async (userId) => {
    const [rows] = await db.query(
        `SELECT
            user_id,
            password,
            type
        FROM users
        WHERE user_id = ?
        LIMIT 1`,
        [userId]
    );

    return rows[0];
};

// Find user by email
const findUserByEmail = async (email) => {
    const [rows] = await db.query(
        'SELECT * FROM users WHERE email = ?',
        [email]
    );

    return rows[0];
};

// Check email belongs to another user
const findEmailForOtherUser = async (email, userId) => {
    const [rows] = await db.query(
        'SELECT * FROM users WHERE email = ? AND user_id != ?',
        [email, userId]
    );

    return rows[0];
};

// Create user by admin
const createUserByAdmin = async (userData) => {
    const connection = await db.getConnection();

    try {
        await connection.beginTransaction();

        const {
            name,
            email,
            hashedPassword,
            type,
            company_name,
            business_reg_no,
            tax_id,
            organization_name,
            registration_no,
            address,
            admin_level
        } = userData;

        // Insert main user
        const [userResult] = await connection.query(
            'INSERT INTO users (name, email, password, type) VALUES (?, ?, ?, ?)',
            [name, email, hashedPassword, type]
        );

        const userId = userResult.insertId;

        // Insert supplier profile
        if (type === 'SUPPLIER') {
            await connection.query(
                `INSERT INTO suppliers
                (supplier_id, company_name, business_reg_no, tax_id)
                VALUES (?, ?, ?, ?)`,
                [
                    userId,
                    company_name || name,
                    business_reg_no || null,
                    tax_id || null
                ]
            );
        }

        // Insert tendering authority profile
        if (type === 'TENDERING_AUTHORITY') {
            await connection.query(
                `INSERT INTO tendering_authorities
                (authority_id, organization_name, registration_no, address)
                VALUES (?, ?, ?, ?)`,
                [
                    userId,
                    organization_name || name,
                    registration_no || null,
                    address || null
                ]
            );
        }

        // Insert admin profile
        if (type === 'ADMIN') {
            await connection.query(
                'INSERT INTO admins (admin_id, admin_level) VALUES (?, ?)',
                [userId, admin_level || 'ADMIN']
            );
        }

        await connection.commit();
        return userId;

    } catch (error) {
        await connection.rollback();
        throw error;

    } finally {
        connection.release();
    }
};

// Update main user
const updateUser = async (userId, name, email, hashedPassword) => {
    if (hashedPassword) {
        const [result] = await db.query(
            'UPDATE users SET name = ?, email = ?, password = ? WHERE user_id = ?',
            [name, email, hashedPassword, userId]
        );

        return result.affectedRows;
    }

    const [result] = await db.query(
        'UPDATE users SET name = ?, email = ? WHERE user_id = ?',
        [name, email, userId]
    );

    return result.affectedRows;
};

// Update supplier profile
const updateSupplierProfile = async (userId, companyName, businessRegNo, taxId) => {
    await db.query(
        `UPDATE suppliers
        SET company_name = ?, business_reg_no = ?, tax_id = ?
        WHERE supplier_id = ?`,
        [companyName, businessRegNo, taxId, userId]
    );
};

// Update tendering authority profile
const updateAuthorityProfile = async (userId, organizationName, registrationNo, address) => {
    await db.query(
        `UPDATE tendering_authorities
        SET organization_name = ?, registration_no = ?, address = ?
        WHERE authority_id = ?`,
        [organizationName, registrationNo, address, userId]
    );
};

// Update admin profile
const updateAdminProfile = async (userId, adminLevel) => {
    await db.query(
        'UPDATE admins SET admin_level = ? WHERE admin_id = ?',
        [adminLevel, userId]
    );
};

// // Delete user
// const deleteUser = async (userId) => {
//     const [result] = await db.query(
//         'DELETE FROM users WHERE user_id = ?',
//         [userId]
//     );

//     return result.affectedRows;
// };

// Deactivate user account
const deactivateUser = async (userId) => {
    const [result] = await db.query(
        `UPDATE users
         SET account_status = 'INACTIVE'
         WHERE user_id = ?
         AND account_status = 'ACTIVE'`,
        [userId]
    );

    return result.affectedRows;
};

// Activate user account
const activateUser = async (userId) => {
    const [result] = await db.query(
        `UPDATE users
         SET account_status = 'ACTIVE'
         WHERE user_id = ?
         AND account_status = 'INACTIVE'`,
        [userId]
    );

    return result.affectedRows;
};

module.exports = {
    getAllUsers,
    getUserById,
    getUserPasswordById,
    findUserByEmail,
    findEmailForOtherUser,
    createUserByAdmin,
    updateUser,
    updateSupplierProfile,
    updateAuthorityProfile,
    updateAdminProfile,
    deactivateUser,
    activateUser
};