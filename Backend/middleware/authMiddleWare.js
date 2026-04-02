const jwt = require("jsonwebtoken");
const { isTokenBlacklisted } = require("../utils/tokenCache");
const User = require("../Models/modelExporter").User;

// Authentication middleware to verify JWT token
const verifyToken = async (req, res, next) => {
    try {
        // check if authorization header is present
        const authHeader = req.headers.authorization;
        console.log("=== AUTH DEBUG ===");
        // console.log("All headers:", req.headers);
        console.log("Auth header:", req.headers.authorization);

        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            console.log("Failed auth header check");
            return res.status(401).json({
                success: false,
                message: "Access Denied !! No token provided"
            })
        }
        console.log("passed auth header check");

        // extract token from header
        const token = authHeader.split(" ")[1];
        console.log("✅ Token extracted:", token.substring(0, 20) + "...");

        // check if token is blacklisted
        const isBlacklisted = await isTokenBlacklisted(token);
         console.log("✅ Blacklist check result:", isBlacklisted);

        if (isBlacklisted) {
            console.log("❌ Failed at: blacklist check");
            return res.status(401).json({
                success: false,
                message: "Token is no longer valid!! Please login again"
            })
        }

        // verify token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        console.log("✅ Token decoded:", decoded);

        // fetch user from db (catches cases where user might have been deleted or deactivated)
        const user = await User.findById(decoded.id);
        console.log("✅ User found:", user ? user.email : "NULL");

        // check if user exists
        if (!user) {
            console.log("❌ Failed at: user not found");
            return res.status(401).json({
                success: false,
                message: "User not found !!"
            })
        }

        // check if user is active
        if (!user.isActive) {
            console.log("❌ Failed at: user not active");
            return res.status(403).json({
                success: false,
                message: "Your account has been deactivated!! Please contact admin"
            })
        }

        // attach user to request object
        console.log("✅ All checks passed — calling next()");
        req.user = user;
        next();
    } catch (err) {
        console.log("❌ Caught error:", err.name, err.message);
        // handle token verification errors
        if (err.name === "TokenExpiredError") {
            return res.status(401).json({
                success: false,
                message: "Token has expired!! Please login again"
            })
        }

        if (err.name === "JsonWebTokenError") {
            return res.status(401).json({
                success: false,
                message: "Invalid Token!!"
            })
        }

        return res.status(500).json({
            success: false,
            message: "Something Went Wrong!!",
            error: err.message
        })
    }
}

// Admin authorization middleware
const isAdmin = (req, res, next) => {
    if (req.user.role !== "admin") {
        return res.status(403).json({
            success: false,
            message: "Access Denied!! Admins only"
        })
    }
    next();
}

// Member authorization middleware
const isMember = (req, res, next) => {
    if (req.user.role !== "member") {
        return res.status(403).json({
            success: false,
            message: "Access Denied!! Members only"
        })
    }
    next();
}

// export middlewares
module.exports = { verifyToken, isAdmin, isMember };