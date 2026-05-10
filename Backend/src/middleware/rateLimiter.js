const rateLimit = require("express-rate-limit");

// helper function to build a rate limiter with response shape
const createLimiter = (windowMinutes, max, message) => {
    return rateLimit({
        windowMs: windowMinutes * 60 * 1000, // convert minutes to milliseconds
        max,
        standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
        legacyHeaders: false, // Disable the `X-RateLimit-*` headers
        handler: (req, res) => {
            return res.status(429).json({
                success: false,
                message: "Too many requests!! Please try again after some time.",
            })
        }
    })
}

// Auth limiter - max 10 requests per 15 minutes
const authLimiter = createLimiter(
    15, // window in minutes
    10, // max requests
    "Too many authentication attempts!! Please try again after 15 minutes."
);

// Refresh token limiter - max 30 requests per 15 minutes
const refreshTokenLimiter = createLimiter(
    15, // window in minutes
    30, // max requests
    "Too many requests to refresh token!! Please try again after 15 minutes."
);

// API limiter - max 100 requests per 10 minutes
const apiLimiter = createLimiter(
    10, // window in minutes
    100, // max requests
    "Too many requests!! Please try again after 15 minutes."
);

module.exports = {
    authLimiter,
    refreshTokenLimiter,
    apiLimiter
}