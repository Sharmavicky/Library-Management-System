const express = require("express");
const router = express.Router();
const { registerUser, loginUser, logoutUser } = require("../../controllers/auth-controller");
const { verifyToken } = require("../../middleware/authMiddleWare");

// Register new user
router.post("/register", registerUser);   // POST /api/auth/register

// login new user
router.post("/login", loginUser);   // POST /api/auth/login

// logout user
router.post("/logout", verifyToken, logoutUser);    // POST /api/auth/logout (protected route, user must be authenticated to logout)

module.exports = router;