// Checks user role or type
const roleMiddleware = (...allowedTypes) => {
    return (req, res, next) => {
        // Check user data exists
        if (!req.user) {
            return res.status(401).json({
                message: 'User not authenticated.'
            });
        }

        // Check user type is allowed
        if (!allowedTypes.includes(req.user.type)) {
            return res.status(403).json({
                message: 'Access denied. You do not have permission.'
            });
        }

        // Continue if role is correct
        next();
    };
};

module.exports = roleMiddleware;