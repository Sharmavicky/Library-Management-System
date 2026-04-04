const express = require("express");
const router = express.Router();
const { registerUser, loginUser, logoutUser, refreshAccessToken } = require("../../controllers/auth-controller");
const { verifyToken } = require("../middleware/authMiddleWare");
const validate = require("../middleware/validate");
const { registerSchema, loginSchema, refreshTokenSchema } = require("../validators/authValidator");

// Register new user
router.post("/register", validate(registerSchema), registerUser);   // POST /api/auth/register

// login new user
router.post("/login", validate(loginSchema), loginUser);   // POST /api/auth/login

// logout user
router.post("/logout", verifyToken, logoutUser);    // POST /api/auth/logout (protected route, user must be authenticated to logout)

// whenever user refresh or login after logout
router.post("/refresh", verifyToken(refreshTokenSchema), refreshAccessToken);

module.exports = router;