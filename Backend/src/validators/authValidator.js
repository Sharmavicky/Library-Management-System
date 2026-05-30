const { z }  = require("zod");

const registerSchema = z.object({
    username: z.string()
        .min(3, "Username must be atleast 3 characters")
        .max(30, "Username must be atmost 30 characters")
        .trim(),
    email: z.string()
        .email("Please enter a valid email")
        .trim(),
    password: z.string()
        .min(6, "Password must be atleast 6 characters"),
});

const loginSchema = z.object({
    email: z.string()
        .email("Please enter a valid email")
        .trim(),
    password: z.string()
        .min(6, "Password must be atleast 6 characters"),
});

const refreshTokenSchema = z.object({
    refreshToken: z.string()
        .min(1, "Refresh Token needed!!")
});

const verifyOTPSchema = z.object({
    email: z.string().email("Please enter a valid email").trim(),
    otp:   z.string().length(6, "OTP must be 6 digits").regex(/^\d+$/, "OTP must be numeric"),
});

module.exports = { registerSchema, loginSchema, refreshTokenSchema, verifyOTPSchema }