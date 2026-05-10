const mongoose = require("mongoose");

const fineSchema = new mongoose.Schema({
    issue: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Issue",
        required: true,
        index: true,       // faster search by issue
        unique: true       // one fine per issue
    },
    member: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
        index: true       // faster search by member
    },
    daysOverDue: {
        type: Number,
        required: true,
        default: 0
    },
    ratePerDay: {
        type: Number,
        required: true,
        default: 5
    },
    totalAmount: {
        type: Number,
        required: true,
        default: 0      // daysOverDue * ratePerDay -- recalculated by cron job every day at midnight
    },
    paidAmount: {
        type: Number,
        default: 0      // amount paid by member towards this fine
    },
    status: {
        type: String,
        enum: ["pending", "partial", "paid", "waived"],
        default: "pending",
        required: true,
        index: true       // faster search by status
    },
    waiveReason: {
        type: String,
        default: null
    },
    paidAt: {
        type: Date,
        default: null   // set when fine is fully paid
    },
    lastCalculatedAt: {
        type: Date,
        default: Date.now   // when totalAmount was last calculated
    }
}, { timestamps: true });

// how much member still owes for this fine
fineSchema.virtual("amountDue").get(function() {
    return this.totalAmount - this.paidAmount;
});

module.exports = mongoose.model("Fine", fineSchema);