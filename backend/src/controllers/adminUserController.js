const bcrypt = require('bcrypt');

const {
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
} = require('../models/adminUserModel');

// Admin view all users
const viewAllUsers = async (req, res) => {
    try {
        const users = await getAllUsers();

        return res.json({
            message: 'Users loaded successfully',
            users: users
        });

    } catch (error) {
        console.log(error);

        return res.status(500).json({
            message: 'Server error while loading users'
        });
    }
};

// Admin view one user
const viewUserById = async (req, res) => {
    try {
        const userId = req.params.id;

        const user = await getUserById(userId);

        if (!user) {
            return res.status(404).json({
                message: 'User not found'
            });
        }

        return res.json({
            message: 'User loaded successfully',
            user: user
        });

    } catch (error) {
        console.log(error);

        return res.status(500).json({
            message: 'Server error while loading user'
        });
    }
};

// Admin add new user
const addUser = async (req, res) => {
    try {
        const {
            name,
            email,
            password,
            type,
            company_name,
            business_reg_no,
            tax_id,
            organization_name,
            registration_no,
            address,
            admin_level
        } = req.body;

        // Basic validation
        if (!name || !email || !password || !type) {
            return res.status(400).json({
                message: 'Name, email, password and type are required'
            });
        }

        // Admin can create all user types
        const allowedTypes = ['SUPPLIER', 'TENDERING_AUTHORITY'];

        if (!allowedTypes.includes(type)) {
            return res.status(400).json({
                message: 'Invalid user type'
            });
        }

        // Check email already exists
        const existingUser = await findUserByEmail(email);

        if (existingUser) {
            return res.status(400).json({
                message: 'Email already registered'
            });
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        const userData = {
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
        };

        const userId = await createUserByAdmin(userData);

        return res.status(201).json({
            message: 'User created successfully',
            user_id: userId
        });

    } catch (error) {
        console.log(error);

        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(409).json({
                message:
                    'Email or registration information already exists'
            });
        }

        return res.status(500).json({
            message: 'Server error while creating user'
        });
    }
};

// Admin update user
const editUser = async (req, res) => {
    try {
        const userId = req.params.id;

        const {
            name,
            email,
            password,
            company_name,
            business_reg_no,
            tax_id,
            organization_name,
            registration_no,
            address,
            admin_level
        } = req.body;

        // Check user exists
        const user = await getUserById(userId);

        if (!user) {
            return res.status(404).json({
                message: 'User not found'
            });
        }

        // Get logged Administrator details
        const loggedAdmin = await getUserById(
            req.user.user_id
        );

        // Normal ADMIN cannot edit SUPER_ADMIN
        if (
            loggedAdmin.admin_level === 'ADMIN' &&
            user.type === 'ADMIN' &&
            user.admin_level === 'SUPER_ADMIN'
        ) {
            return res.status(403).json({
                message:
                    'You do not have permission to edit a Super Administrator'
            });
        }

        // Basic validation
        if (!name || !email) {
            return res.status(400).json({
                message: 'Name and email are required'
            });
        }

        // Check email already used by another user
        const emailUsed = await findEmailForOtherUser(email, userId);

        if (emailUsed) {
            return res.status(400).json({
                message: 'Email already used by another user'
            });
        }

        let hashedPassword = null;

        // Update password only if admin entered new password
        if (password) {
            hashedPassword = await bcrypt.hash(password, 10);
        }

        // Update main user table
        await updateUser(
            userId,
            name,
            email,
            hashedPassword
        );


        // Update profile according to user type
        if (user.type === 'SUPPLIER') {
            await updateSupplierProfile(
                userId,
                company_name || user.company_name,
                business_reg_no || user.business_reg_no,
                tax_id || user.tax_id
            );
        }

        if (user.type === 'TENDERING_AUTHORITY') {
            await updateAuthorityProfile(
                userId,
                organization_name || user.organization_name,
                registration_no || user.registration_no,
                address || user.address
            );
        }

        if (user.type === 'ADMIN') {
            await updateAdminProfile(
                userId,
                admin_level || user.admin_level || 'ADMIN'
            );
        }

        return res.json({
            message: 'User updated successfully'
        });

    } catch (error) {
        console.log(error);

        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(409).json({
                message:
                    'Email or registration information already exists'
            });
        }

        return res.status(500).json({
            message: 'Server error while updating user'
        });
    }
};

// Activate or deactivate user account
const changeUserStatus = async (req, res) => {
    try {
        const userId = Number(req.params.id);
        const adminId = Number(req.user.user_id);

        const { account_status, admin_password } = req.body;

        // Admin password required
        if (!admin_password) {
            return res.status(400).json({
                message:
                    'Admin password is required'
            });
        }

        // Prevent Admin deactivating own account
        if (userId === adminId) {
            return res.status(400).json({
                message:
                    'You cannot deactivate your own Administrator account'
            });
        }

        // Check status
        if (
            account_status !== 'ACTIVE' &&
            account_status !== 'INACTIVE'
        ) {
            return res.status(400).json({
                message: 'Invalid account status'
            });
        }

        // Get logged Admin
        const admin =
            await getUserPasswordById(
                adminId
            );

        if (!admin || admin.type !== 'ADMIN') {
            return res.status(403).json({
                message:
                    'Administrator account not found'
            });
        }

        // Check Admin password
        const passwordCorrect =
            await bcrypt.compare(
                admin_password,
                admin.password
            );

        if (!passwordCorrect) {
            return res.status(401).json({
                message:
                    'Admin password is incorrect'
            });
        }

        // Check user exists
        const user = await getUserById(userId);

        if (!user) {
            return res.status(404).json({
                message: 'User not found'
            });
        }

        // Do not allow Admin accounts to be activated or deactivated
        if (user.type === 'ADMIN') {
            return res.status(403).json({
                message:
                    'Administrator accounts cannot be activated or deactivated'
            });
        }

        let affectedRows;

        if (account_status === 'INACTIVE') {
            affectedRows = await deactivateUser(
                userId
            );
        } else {
            affectedRows = await activateUser(
                userId
            );
        }

        if (affectedRows === 0) {
            return res.status(400).json({
                message:
                    'Account status is already updated'
            });
        }

        return res.json({
            message:
                account_status === 'INACTIVE'
                    ? 'User account deactivated successfully'
                    : 'User account activated successfully'
        });

    } catch (error) {
        console.log(error);

        return res.status(500).json({
            message:
                'Server error while changing account status'
        });
    }
};


module.exports = {
    viewAllUsers,
    viewUserById,
    addUser,
    editUser,
    changeUserStatus
};