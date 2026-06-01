const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const User = require("../Models/user-model");
const {
    saveRefreshToken,
    deleteRefreshToken,
    blacklistToken,
    getRefreshToken,
} = require("../utils/tokenCache");

// Register new user
exports.registerUser = async (req, res, next) => {
    try {
        const { username, email, password } = req.body;

        // validate data
        if (!username || !email || !password) {
            return res.status(400).json({
                success: false,
                message: "Invalid details!!"
            });
        }

        // validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({
                success: false,
                message: "Invalid email format!!"
            });
        }

        // validate if user already exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(409).json({
                success: false,
                message: "User already exists!!"
            });
        }

        // hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // create new user — mark as verified immediately (no OTP)
        const newUser = await User.create({
            username,
            email,
            password: hashedPassword,
            isVerified: true
        });

        // issue tokens immediately after registration
        const accessToken = jwt.sign(
            { id: newUser._id },
            process.env.JWT_SECRET,
            { expiresIn: "1d" }
        );

        const refreshToken = jwt.sign(
            { id: newUser._id },
            process.env.JWT_REFRESH_SECRET,
            { expiresIn: "7d" }
        );

        await saveRefreshToken(newUser._id.toString(), refreshToken);

        return res.status(201).json({
            success: true,
            message: "Account created successfully!!",
            accessToken,
            refreshToken,
            user: {
                _id: newUser._id,
                email: newUser.email,
                username: newUser.username,
                role: newUser.role
            }
        });
    } catch (err) {
        next(err);
    }
};

// Login existing user
exports.loginUser = async (req, res, next) => {
    try {
        const { email, password } = req.body;

        // validate data
        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: "Invalid email or password!!"
            });
        }

        // check password length
        if (password.length < 6) {
            return res.status(400).json({
                success: false,
                message: "Password must be at least 6 characters!!"
            });
        }

        // validate if user exists
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(409).json({
                success: false,
                message: "User not found!!"
            });
        }

        // validate password
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({
                success: false,
                message: "Invalid password!!"
            });
        }

        const accessToken = jwt.sign(
            { id: user._id },
            process.env.JWT_SECRET,
            { expiresIn: "1d" }
        );

        const refreshToken = jwt.sign(
            { id: user._id },
            process.env.JWT_REFRESH_SECRET,
            { expiresIn: "7d" }
        );

        await saveRefreshToken(user._id.toString(), refreshToken);

        return res.status(200).json({
            success: true,
            message: "LoggedIn Successfully!!",
            accessToken,
            refreshToken,
            user: {
                _id: user._id,
                email: user.email,
                username: user.username,
                role: user.role
            }
        });
    } catch (err) {
        next(err);
    }
};

// Logout user
exports.logoutUser = async (req, res, next) => {
    try {
        const userId      = req.user._id;
        const accessToken = req.headers.authorization?.split(" ")[1];

        const decoded = jwt.decode(accessToken);
        const ttl     = decoded.exp - Math.floor(Date.now() / 1000);

        await Promise.all([
            deleteRefreshToken(userId),
            blacklistToken(accessToken, ttl),
        ]);

        req.session.destroy();

        return res.status(200).json({
            success: true,
            message: "Logged out successfully!!"
        });
    } catch (err) {
        next(err);
    }
};

// Refresh Access Token
exports.refreshAccessToken = async (req, res, next) => {
    try {
        const { refreshToken } = req.body;

        if (!refreshToken) {
            return res.status(400).json({
                success: false,
                message: "Refresh Token is Required!!"
            });
        }

        let decoded;
        try {
            decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
        } catch (err) {
            if (err.name === "TokenExpiredError") {
                return res.status(401).json({
                    success: false,
                    message: "Refresh token Expired!! Please login again."
                });
            }
            return res.status(401).json({
                success: false,
                message: "Invalid Token!!"
            });
        }

        const storedToken = await getRefreshToken(decoded.id);
        if (!storedToken) {
            return res.status(400).json({
                success: false,
                message: "Refresh Token not found!! Please login again"
            });
        }

        if (storedToken !== refreshToken) {
            return res.status(401).json({
                success: false,
                message: "Refresh Token mismatch!! Please login again"
            });
        }

        const user = await User.findById(decoded.id);
        if (!user) {
            return res.status(400).json({
                success: false,
                message: "User no longer exists"
            });
        }

        if (!user.isActive) {
            return res.status(400).json({
                success: false,
                message: "Your account has been blocked. Please contact admin!!"
            });
        }

        const newAccessToken = jwt.sign(
            { id: user._id },
            process.env.JWT_SECRET,
            { expiresIn: "1d" }
        );

        const newRefreshToken = jwt.sign(
            { id: user._id },
            process.env.JWT_REFRESH_SECRET,
            { expiresIn: "7d" }
        );

        await saveRefreshToken(user._id.toString(), newRefreshToken);

        return res.status(200).json({
            success: true,
            message: "Token refreshed successfully!!",
            accessToken: newAccessToken,
            refreshToken: newRefreshToken
        });
    } catch (err) {
        next(err);
    }
};