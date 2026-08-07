const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const {
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
} = require('../models/userModel');

// Register new user
const register = async (req, res) => {
    try {
        // Check request body
        if (!req.body) {
            return res.status(400).json({
                message: 'Request body is missing'
            });
        }

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
            address
        } = req.body;

        // Check common fields
        if (!name || !email || !password || !type) {
            return res.status(400).json({
                message: 'Name, email, password and type are required'
            });
        }

        // Do not allow public Admin registration
        if (type === 'ADMIN') {
            return res.status(403).json({
                message: 'Admin registration is not allowed'
            });
        }

        // Check valid user type
        const allowedTypes = [
            'SUPPLIER',
            'TENDERING_AUTHORITY'
        ];

        if (!allowedTypes.includes(type)) {
            return res.status(400).json({
                message: 'Invalid user type'
            });
        }

        // Validate password
        const hasUppercase = /[A-Z]/.test(password);
        const hasNumber = /[0-9]/.test(password);
        const hasSymbol = /[^A-Za-z0-9]/.test(password);

        if (
            password.length < 8 ||
            !hasUppercase ||
            !hasNumber ||
            !hasSymbol
        ) {
            return res.status(400).json({
                message:
                    'Password must have at least 8 characters, one uppercase letter, one number and one symbol',
                field: 'password'
            });
        }

        // Validate Supplier fields
        if (type === 'SUPPLIER') {
            if (!company_name || !business_reg_no || !tax_id) {
                return res.status(400).json({
                    message:
                        'Company name, business registration number and Tax ID are required'
                });
            }
        }

        // Validate Tendering Authority fields
        if (type === 'TENDERING_AUTHORITY') {
            if (!organization_name || !registration_no || !address) {
                return res.status(400).json({
                    message:
                        'Organization name, registration number and address are required'
                });
            }
        }

        // Check email already exists
        const existingUser = await findUserByEmail(email);

        if (existingUser) {
            return res.status(409).json({
                message: 'Email address is already registered',
                field: 'email'
            });
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create user and role profile
        await createUser({
            name,
            email,
            hashedPassword,
            type,
            company_name,
            business_reg_no,
            tax_id,
            organization_name,
            registration_no,
            address
        });

        return res.status(201).json({
            message: 'User registered successfully'
        });

    } catch (error) {
        console.log(error);

        // Handle duplicate values
        if (error.code === 'ER_DUP_ENTRY') {
            const sqlMessage = error.sqlMessage || '';

            if (sqlMessage.includes('business_reg_no')) {
                return res.status(409).json({
                    message:
                        'Business registration number already exists',
                    field: 'business_reg_no'
                });
            }

            if (sqlMessage.includes('tax_id')) {
                return res.status(409).json({
                    message: 'Tax ID already exists',
                    field: 'tax_id'
                });
            }

            if (sqlMessage.includes('registration_no')) {
                return res.status(409).json({
                    message:
                        'Organization registration number already exists',
                    field: 'registration_no'
                });
            }

            if (sqlMessage.includes('email')) {
                return res.status(409).json({
                    message: 'Email address already exists',
                    field: 'email'
                });
            }

            return res.status(409).json({
                message: 'Registration information already exists'
            });
        }

        return res.status(500).json({
            message: 'Server error during registration'
        });
    }
};

// Login user
const login = async (req, res) => {
    try {
        const { email, password } = req.body;

        // Basic validation
        if (!email || !password) {
            return res.status(400).json({
                message: 'Email and password are required'
            });
        }

        // Find user
        const user = await findUserByEmail(email);

        if (!user) {
            return res.status(401).json({
                message: 'Invalid email or password'
            });
        }

        if (user.account_status === 'INACTIVE') {
        return res.status(403).json({
            message:
                'Your account has been deactivated. Please contact the Administrator.'
        });
}

        // Compare password
        const isPasswordCorrect = await bcrypt.compare(password, user.password);

        if (!isPasswordCorrect) {
            return res.status(401).json({
                message: 'Invalid email or password'
            });
        }

        // Create login token
        const token = jwt.sign(
            {
                user_id: user.user_id,
                type: user.type
            },
            process.env.JWT_SECRET,
            {
                expiresIn: '1d'
            }
        );

        return res.json({
            message: 'Login successful',
            token: token,
            user: {
                user_id: user.user_id,
                name: user.name,
                email: user.email,
                type: user.type
            }
        });

    } catch (error) {
        console.log(error);

        return res.status(500).json({
            message: 'Server error during login'
        });
    }
};

// Get logged user profile
const getProfile = async (req, res) => {
    try {
        let profile;

        // Load Supplier profile
        if (req.user.type === 'SUPPLIER') {
            profile = await getSupplierProfile(
                req.user.user_id
            );
        }

        // Load Admin profile
        if (req.user.type === 'ADMIN') {
            profile = await getAdminProfile(
                req.user.user_id
            );
        }

        // Load Authority profile
        if (
            req.user.type ===
            'TENDERING_AUTHORITY'
        ) {
            profile = await getAuthorityProfile(
                req.user.user_id
            );
        }

        if (!profile) {
            return res.status(404).json({
                message: 'Profile not found'
            });
        }

        return res.json({
            user: profile
        });

    } catch (error) {
        console.log(error);

        return res.status(500).json({
            message:
                'Server error while loading profile'
        });
    }
};


// Update logged user profile
const updateProfile = async (req, res) => {
    try {
        const userId = req.user.user_id;

        // Update Admin
        if (req.user.type === 'ADMIN') {
            const { name, email } = req.body;

            if (!name || !email) {
                return res.status(400).json({
                    message: 'Name and email are required'
                });
            }

            await updateAdminProfile(
                userId,
                {
                    name,
                    email
                }
            );
        }

        // Update Supplier
        else if (req.user.type === 'SUPPLIER') {
            const {
                name,
                email,
                company_name,
                business_reg_no,
                tax_id
            } = req.body;

            if (
                !name ||
                !email ||
                !company_name ||
                !business_reg_no ||
                !tax_id
            ) {
                return res.status(400).json({
                    message:
                        'All Supplier profile fields are required'
                });
            }

            await updateSupplierProfile(
                userId,
                {
                    name,
                    email,
                    company_name,
                    business_reg_no,
                    tax_id
                }
            );
        }

        // Update Tendering Authority
        else if (
            req.user.type ===
            'TENDERING_AUTHORITY'
        ) {
            const {
                name,
                email,
                organization_name,
                registration_no,
                address
            } = req.body;

            if (
                !name ||
                !email ||
                !organization_name ||
                !registration_no ||
                !address
            ) {
                return res.status(400).json({
                    message:
                        'All Authority profile fields are required'
                });
            }

            await updateAuthorityProfile(
                userId,
                {
                    name,
                    email,
                    organization_name,
                    registration_no,
                    address
                }
            );
        }

        else {
            return res.status(403).json({
                message:
                    'This account cannot update this profile'
            });
        }

        return res.json({
            message:
                'Profile updated successfully'
        });

    } catch (error) {
        console.log(error);

        if (error.code === 'ER_DUP_ENTRY') {
            const sqlMessage =
                error.sqlMessage || '';

            if (sqlMessage.includes('email')) {
                return res.status(409).json({
                    message:
                        'Email address already exists'
                });
            }

            if (
                sqlMessage.includes(
                    'registration_no'
                )
            ) {
                return res.status(409).json({
                    message:
                        'Registration number already exists'
                });
            }

            if (
                sqlMessage.includes(
                    'business_reg_no'
                )
            ) {
                return res.status(409).json({
                    message:
                        'Business registration number already exists'
                });
            }

            if (sqlMessage.includes('tax_id')) {
                return res.status(409).json({
                    message:
                        'Tax ID already exists'
                });
            }
        }

        return res.status(500).json({
            message:
                'Server error while updating profile'
        });
    }
};

// Change logged user's password
const changePassword = async (req, res) => {
    try {
        const {
            current_password,
            new_password
        } = req.body;

        if (!current_password || !new_password) {
            return res.status(400).json({
                message: 'Current password and new password are required'
            });
        }

        // Check strong password
        const hasUppercase = /[A-Z]/.test(new_password);
        const hasNumber = /[0-9]/.test(new_password);
        const hasSymbol = /[^A-Za-z0-9]/.test(new_password);

        if (
            new_password.length < 8 ||
            !hasUppercase ||
            !hasNumber ||
            !hasSymbol
        ) {
            return res.status(400).json({
                message:
                    'New password must have at least 8 characters, one uppercase letter, one number and one symbol'
            });
        }

        // Find logged user
        const user = await findUserById(
            req.user.user_id
        );

        if (!user) {
            return res.status(404).json({
                message: 'User not found'
            });
        }

        // Check current password
        const passwordCorrect = await bcrypt.compare(
            current_password,
            user.password
        );

        if (!passwordCorrect) {
            return res.status(400).json({
                message: 'Current password is incorrect'
            });
        }

        // Prevent same password
        const samePassword = await bcrypt.compare(
            new_password,
            user.password
        );

        if (samePassword) {
            return res.status(400).json({
                message: 'New password must be different from current password'
            });
        }

        // Hash and save new password
        const hashedPassword = await bcrypt.hash(
            new_password,
            10
        );

        await updateUserPassword(
            req.user.user_id,
            hashedPassword
        );

        return res.json({
            message: 'Password changed successfully'
        });

    } catch (error) {
        console.log(error);

        return res.status(500).json({
            message: 'Server error while changing password'
        });
    }
};

module.exports = {
    register,
    login,
    getProfile,
    updateProfile,
    changePassword
};