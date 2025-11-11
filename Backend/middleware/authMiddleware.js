// middleware/authMiddleware.js
const jwt = require('jsonwebtoken'); // 👈 Right here


/**
 * Middleware to authenticate a user via JWT.
 * It verifies the token from the Authorization header.
 */
const authMiddleware = (req, res, next) => {
    // Get token from the header
    const authHeader = req.header('Authorization');

    // Check if there's a header
    if (!authHeader) {
        return res.status(401).json({ message: 'No token, authorization denied.' });
    }

    // Check if the header is in the 'Bearer <token>' format
    const token = authHeader.split(' ')[1];
    if (!token) {
        return res.status(401).json({ message: 'Token is malformed, authorization denied.' });
    }

    try {
        // Verify the token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // Add the user payload from the token to the request object
        req.user = decoded.user;
        next(); // Move to the next piece of middleware or the route handler
    } catch (err) {
        res.status(401).json({ message: 'Token is not valid.' });
    }
};

/**
 * Middleware to authorize a user based on the 'farmer' role.
 * This MUST be used AFTER authMiddleware.
 */
const isFarmer = (req, res, next) => {
    // authMiddleware should have already attached the user object
    if (req.user && req.user.role === 'farmer') {
        next(); // User is a farmer, proceed
    } else {
        // If user is not a farmer or user object is missing
        res.status(403).json({ message: 'Access denied. Farmer role required.' });
    }
};

module.exports = { authMiddleware, isFarmer };