const mongoose = require("mongoose");

// userschema definition
const userSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true,
        trim: true
    },
    email: {
        type: String,
        required: true,
        unique: true,
        match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, "Please enter a valid email address"],
        trim: true
    },
    password: {
        type: String,
        required: true,
        minLength: 6,
        trim: true
    },
    role: {
        type: String,
        enum: ["member", "admin"],
        default: "member",
        required: true
    },
    isActive: {
        type: Boolean,
        default: true,
        required: true
    }
}, { timestamps: true });

// create user model and export it.
module.exports =  mongoose.model("User", userSchema);