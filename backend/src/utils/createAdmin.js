const bcrypt = require('bcrypt');
const db = require('../config/db');

// Create or update default admin
const createAdmin = async () => {
    try {
        const name = 'System Admin';
        const email = 'admin@eztends.com';
        const password = 'admin123';
        const type = 'ADMIN';

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Check admin user already exists
        const [users] = await db.query(
            'SELECT * FROM users WHERE email = ?',
            [email]
        );

        // If admin exists, update password
        if (users.length > 0) {
            const adminId = users[0].user_id;

            await db.query(
                'UPDATE users SET password = ?, type = ? WHERE user_id = ?',
                [hashedPassword, type, adminId]
            );

            // Check admin table record exists
            const [admins] = await db.query(
                'SELECT * FROM admins WHERE admin_id = ?',
                [adminId]
            );

            // If admin table record missing, add it
            if (admins.length === 0) {
                await db.query(
                    'INSERT INTO admins (admin_id, admin_level) VALUES (?, ?)',
                    [adminId, 'SUPER_ADMIN']
                );
            }

            console.log('Existing admin password updated successfully');
            console.log('Email:', email);
            console.log('Password:', password);
            process.exit();
        }

        // If admin does not exist, create new admin
        const [userResult] = await db.query(
            'INSERT INTO users (name, email, password, type) VALUES (?, ?, ?, ?)',
            [name, email, hashedPassword, type]
        );

        const adminId = userResult.insertId;

        await db.query(
            'INSERT INTO admins (admin_id, admin_level) VALUES (?, ?)',
            [adminId, 'SUPER_ADMIN']
        );

        console.log('Admin created successfully');
        console.log('Email:', email);
        console.log('Password:', password);
        process.exit();

    } catch (error) {
        console.log(error);
        process.exit();
    }
};

createAdmin();