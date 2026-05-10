const { ZodError } = require("zod");

const errorHandler = (err, req, res, next) => {
    console.error(`[ERROR] ${err.name}: ${err.message}`);

    // ── Zod validation error 
    if (err instanceof ZodError) {
        return res.status(400).json({
            success: false,
            message: "Validation failed!!",
            errors:  err.errors.map(e => ({
                field:   e.path.join("."),
                message: e.message
            }))
        });
    }

    // ── Mongoose validation error 
    if (err.name === "ValidationError") {
        return res.status(400).json({
            success: false,
            message: "Validation failed!!",
            errors:  Object.values(err.errors).map(e => ({
                field:   e.path,
                message: e.message
            }))
        });
    }

    // ── Mongoose duplicate key (unique field already exists) 
    if (err.code === 11000) {
        const field = Object.keys(err.keyValue)[0];
        return res.status(409).json({
            success: false,
            message: `${field} already exists!!`
        });
    }

    // ── Mongoose bad ObjectId 
    if (err.name === "CastError") {
        return res.status(400).json({
            success: false,
            message: `Invalid ${err.path}: ${err.value}`
        });
    }

    // ── JWT errors 
    if (err.name === "TokenExpiredError") {
        return res.status(401).json({
            success: false,
            message: "Token has expired!! Please login again"
        });
    }

    if (err.name === "JsonWebTokenError") {
        return res.status(401).json({
            success: false,
            message: "Invalid token!!"
        });
    }

    // ── Default 500 
    return res.status(err.status || 500).json({
        success: false,
        message: err.message || "Something went wrong!!"
    });
};

module.exports = errorHandler;