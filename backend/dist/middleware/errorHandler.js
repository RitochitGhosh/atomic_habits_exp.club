"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.errorHandler = void 0;
const errorHandler = (err, req, res, next) => {
    console.error('Error:', err);
    if (err.name === 'PrismaClientKnownRequestError') {
        return res.status(400).json({
            error: 'Database error',
            message: 'An error occurred while processing your request'
        });
    }
    if (err.name === 'ValidationError') {
        return res.status(400).json({
            error: 'Validation error',
            message: err.message
        });
    }
    if (err.name === 'JsonWebTokenError') {
        return res.status(401).json({
            error: 'Invalid token',
            message: 'Authentication failed'
        });
    }
    if (err.name === 'TokenExpiredError') {
        return res.status(401).json({
            error: 'Token expired',
            message: 'Please log in again'
        });
    }
    res.status(500).json({
        error: 'Internal server error',
        message: process.env.NODE_ENV === 'production'
            ? 'Something went wrong'
            : err.message
    });
};
exports.errorHandler = errorHandler;
//# sourceMappingURL=errorHandler.js.map