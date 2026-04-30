const mongoose = require("mongoose");

const bookSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
        trim: true,
    },
    author: {
        type: String,
        required: true,
        trim: true,
    },
    summary: {
        type: String,
        default: null,
    },
    coverImage: {
        type: String,       // formats["image/jpeg"] from Gutenberg
        default: null
    },
    bookshelves: {
        type: [String],     // e.g. ["Best Books Ever", "Horror"]
        default: [],
    },
    plainTextUrl: {
        type: String,       // formats["text/plain; charset=utf-8"] from Gutenberg
        default: null,
    },
    totalCopies: {
        type: Number,
        default: 5,
    },
    availableCopies: {
        type: Number,
        default: 5,
    },
}, { timestamps: true });

// index to quickly find books by title or author
bookSchema.index({ title: "text", author: "text" });

module.exports = mongoose.model("Book", bookSchema);