const mongoose = require("mongoose");

const issueSchema = new mongoose.Schema({
    book: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Book",
        required: true
    },
    member: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    issueDate: {
        type:    Date,
        default: Date.now
    },
    dueDate: {
        type:     Date,         // issueDate + 14 days — never changes after issue
        required: true
    },
    returnedAt: {
        type:    Date,          // set when member actually returns — null until then
        default: null
    },
    returned: {
        type:    Boolean,       // true if book is returned, false if still issued
        default: false
    },
    bookSnapShot: {
        title: {
            type: String,
            required: true
        },
        author: {
            type: String,
            required: true
        }
    },
    status: {
        type: String,
        enum: ["issued", "returned", "overdue"],
        default: "issued",
        required: true,
        index: true       // faster search by status
    }
}, { timestamps: true });

// index to quickly find overdue issues for cron job
issueSchema.index({ dueDate: 1, status: 1 });

module.exports = mongoose.model("Issue", issueSchema);