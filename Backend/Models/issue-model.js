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
        type:     Date,       // issueDate + 14 days — never changes after issue
        required: true
    },
    returnedAt: {
        type:    Date,        // set when member actually returns — null until then
        default: null
    },
    returned: {
        type:    Boolean, // true if book is returned, false if still issued
        default: false
    },
    fine: {
        type:    Number,      // calculated on late return (daysOverdue * 5)
        default: 0
    }
}, { timestamps: true });

module.exports = mongoose.model("Issue", issueSchema);