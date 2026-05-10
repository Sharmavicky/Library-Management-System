const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const User = require("../Models/user-model");
const {
    saveRefreshToken,
    deleteRefreshToken,
    blacklistToken,
    getRefreshToken
} = require("../utils/tokenCache");

// Register new user
exports.registerUser = async (req, res, next) => {
    try {
        const { username, email, password } = req.body;

        // validate date
        if (!username || !email || !password) {
            return res.status(400).json({
                success: false,
                message: "Invalid details!!"
            })
        }

        // validate if user already exist
        const existingUser = await User.findOne({ email });

        if (existingUser) {
            return res.status(409).json({
                success: false,
                message: "User already exists!!"
            })
        }

        // hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // create new user
        const newUser = await User.create({ username, email, password: hashedPassword });

        // sign a token
        const accessToken = jwt.sign(
            { id: newUser._id },
            process.env.JWT_SECRET,
            { expiresIn: "1d"}
        );

        // sign in refreshToken
        const refreshToken = jwt.sign(
            { id: newUser._id},
            process.env.JWT_REFRESH_SECRET,
            { expiresIn: "7d" }
        )

        // save refresh token in redis with userId as key
        await saveRefreshToken(newUser._id.toString(), refreshToken);

        return res.status(201).json({
            success: true,
            message: "Account created successfully!!",
            accessToken,
            refreshToken,
            user: {
                _id: newUser._id,
                email: newUser.email,
                username: newUser.username
            }
        })
    } catch(err) {
        next(err);
    }
}

// Login existing user
exports.loginUser = async (req, res, next) => {
    try {
        const { email, password } = req.body;

        // validate data
        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: "Invalid email or password!!"
            })
        }

        // check password length
        if (password.length < 6 ) {
            return res.status(400).json({
                success: false,
                message: "Password must be at least 6 characters!!"
            })
        }

        // validate if user exists
        const user = await User.findOne({ email });

        if (!user) {
            return res.status(409).json({
                success: false,
                message: "User not found!!"
            })
        }

        // validate password
        const isMatch = await bcrypt.compare(password, user.password);

        if (!isMatch) {
            return res.status(401).json({
                success: false,
                message: "Invalid password!!"
            })
        }

        const accessToken = jwt.sign(
            { id: user._id },
            process.env.JWT_SECRET,
            { expiresIn: "1d" }
        )

        const refreshToken = jwt.sign(
            { id: user._id },
            process.env.JWT_REFRESH_SECRET,
            { expiresIn: "7d" }
        )

        // save token to redis
        await saveRefreshToken(user._id.toString(), refreshToken);

        return res.status(200).json({
            success: true,
            message: "LoggedIn Successfully!!",
            accessToken,
            refreshToken,
            user: {
                _id: user._id,
                email: user.email,
                username: user.username
            }
        })
    } catch (err) {
        next(err);
    }
}

// Logout user
exports.logoutUser = async (req, res) => {
    try {
        const userId      = req.user._id;
        const accessToken = req.headers.authorization?.split(" ")[1];

        // decode to get remaining TTL for blacklisting
        const decoded  = jwt.decode(accessToken);
        const ttl      = decoded.exp - Math.floor(Date.now() / 1000); // seconds left

        await Promise.all([
            deleteRefreshToken(userId),         // remove refresh token
            blacklistToken(accessToken, ttl),   // blacklist access token
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
exports.refreshAccessToken = async (req, res) => {
    try {
        const { refreshToken } = req.body;

        // check if refresh token is provided
        if (!refreshToken) {
            return res.status(400).json({
                success: false,
                message: "Refresh Token is Required!!"
            })
        }

        // verify refreshToken signature
        let decoded;
        try {
            decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
        } catch (err) {
            if (err.name === "TokenExpiredError") {
                return res.status(401).json({
                    success: false,
                    message: "Refresh token Expired!! Please login again."
                })
            }

            return res.status(401).json({
                success: false,
                message: "Invalid Token!!"
            })
        }

        // check if refreshToken is stored in Redis
        const storedToken = await getRefreshToken(decoded.id);
        if (!storedToken) {
            return res.status(400).json({
                success: false,
                message: "Refresh Token not found!! Please login again"
            })
        }

        // check if stored token matches with sent one
        if (storedToken !== refreshToken) {
            return res.status(401).json({
                success: false,
                message: "Refresh Token mismatch!! Please login again"
            })
        }

        // check if user exits and still active
        const user = await User.findById(decoded.id);
        if (!user) {
            return res.status(400).json({
                success: false,
                message: "User no longer exists"
            })
        }

        if (!user.isActive) {
            return res.status(400).json({
                success: false,
                message: "Your account has been blocked. Please contact admin!!"
            })
        }

        // generate new access token
        const newAccessToken = jwt.sign(
            { id: user._id },
            process.env.JWT_SECRET,
            { expiresIn: "1d" }
        );

        // generate new refreshToken
        const newRefreshToken = jwt.sign(
            { id: user._id },
            process.env.JWT_REFRESH_SECRET,
            { expiresIn: "7d" }
        );

        // save new refreshToken in Redis
        await saveRefreshToken(user._id.toString(), newRefreshToken);

        return res.status(200).json({
            success: true,
            message: "Token refreshed successfully!!",
            accessToken: newAccessToken,
            refreshToken: newRefreshToken
        })
    } catch (err) {
        next(err);
    }
}