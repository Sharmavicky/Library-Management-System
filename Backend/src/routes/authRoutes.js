const express = require("express");
const router  = express.Router();
const { registerUser, loginUser, logoutUser, refreshAccessToken } = require("../../controllers/auth-controller");
const { verifyToken } = require("../middleware/authMiddleWare");
const validate = require("../middleware/validate");
const { registerSchema, loginSchema, refreshTokenSchema } = require("../validators/authValidator");
const { authLimiter, refreshTokenLimiter } = require("../middleware/rateLimiter");

router.post("/register", authLimiter, validate(registerSchema),      registerUser);
router.post("/login",    authLimiter, validate(loginSchema),         loginUser);
router.post("/logout",   verifyToken,                                logoutUser);

// verifyToken — access token is expired at this point, the refresh token in req.body is the only credential needed
router.post("/refresh",  refreshTokenLimiter, validate(refreshTokenSchema),  refreshAccessToken);

module.exports = router;