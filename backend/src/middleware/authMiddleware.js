const jwt = require('jsonwebtoken');

// Checks user login token
const authMiddleware = (req, res, next) => {
    try {
        // Get token from request header
        const authHeader = req.headers.authorization;

        // Check token exists
        if (!authHeader) {
            return res.status(401).json({
                message: 'Access denied. No token provided.'
            });
        }

        // Seperate the token from the "Bearer" prefix
        const token = authHeader.split(' ')[1];

        if (!token) {
            return res.status(401).json({
                message: 'Access denied. Invalid token format.'
            });
        }

        // Verify token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // Save user details to request
        req.user = decoded;

        // Continue to next function
        next();

    } catch (error) {
        return res.status(401).json({
            message: 'Invalid or expired token.'
        });
    }
};

module.exports = authMiddleware;