const mongoose = require("mongoose");
const User = require("../Models/modelExporter").User;
const Book = require("../Models/modelExporter").Book;
const Issue = require("../Models/modelExporter").Issue;

const bookRequestSchema = new mongoose.Schema({
    issue: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Issue",
        default: null
    },
    member: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    book: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Book",
        required: true
    },
    status: {
        type: String,
        enum: ["pending", "approved", "rejected"],
        default: "pending"
    },
    note: {
        type: String,
        default: ""
    }
}, { timestamps: true });

// Prevent duplicate requests for the same book by the same member
bookRequestSchema.index({ member: 1, book: 1, status: 1 });

module.exports = mongoose.model("BookRequest", bookRequestSchema);