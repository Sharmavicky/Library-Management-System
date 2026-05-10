const mongoose = require("mongoose");
const Fine = require("../Models/modelExporter").Fine;
const User = require("../Models/modelExporter").User;
const Issue = require("../Models/modelExporter").Issue;
const runOverDueJob = require("../src/jobs/OverDueJob").runOverDueJob
const paginate = require("../utils/paginate");

/*
    Get all fines (Admin only)
    GET /api/fines?page=1&limit=10&status=pending&userId=123&bookId=456
*/
exports.getAllFines = async (req, res, next) => {
    try {
        const { status, userId, bookId } = req.query;   // optional query param to filter by status
        const query = {}; // if status is provided, filter by it, otherwise get all fines

        if (status) {
            const validStatus = ["pending", "paid", "waived", "partial"];
            if (!validStatus.includes(status)) {
                return res.status(400).json({
                    success: false,
                    message: `Invalid status filter!! Valid values are ${validStatus.join(", ")}`
                })
            }

            query.status = status; // add status filter to query
        }

        // check both user and book IDs are valid
        if (userId && !mongoose.Types.ObjectId.isValid(userId)) {
            return res.status(400).json({
                success: false,
                message: "Invalid User ID filter!!"
            })

            query.member = userId; // add member filter to query
        }

        if (bookId && !mongoose.Types.ObjectId.isValid(bookId)) {
            return res.status(400).json({
                success: false,
                message: "Invalid Book ID filter!!"
            })

            const issues = await Issue.find({ book: bookId }).select("_id");
            query.issue = { $in: issues.map(issue => issue._id) }; // add issue filter to query to get fines related to the book
        }

        const { data: fines, pagination } = await paginate(
            Fine,
            query,
            req.query,
            [
                { path: "member", select: "username email" }, // populate member details
                { path: "issue", populate: { path: "book", select: "title author" } } // populate book details through issue
            ]
        )

        // calculate total pending balance for the filtered fines
        const totalOutstanding = fines
                    .filter(fine => ["pending", "partial"].includes(fine.status)) // only consider pending and partial fines for total pending calculation
                    .reduce((sum, fine) => sum + fine.amount, 0); // sum up the amounts of pending and partial fines
        
        return res.status(200).json({
            success: true,
            message: "Fines retrieved successfully!!",
            pagination,
            totalOutstanding,
            fines
        })
    } catch (err) {
        next(err);
    }
}

/*
    Get fines for a specific member (Admin only)
    GET /api/fines/member/:memberId
*/
exports.getFinesByMember = async (req, res, next) => {
    try {
        const { memberId } = req.params;

        // validate if memberId is a valid ObjectId
        if (!mongoose.Types.ObjectId.isValid(memberId)) {{
            return res.status(400).json({
                success: false,
                message: "Invalid Member ID!!"
            })
        }}

        // check if member exists and is active
        const member = await User.findById(memberId).select("username email isActive");
        if (!member) {
            return res.status(400).json({
                success: false,
                message: "Member not found!!"
            })
        }

        if (!member.isActive) {
            return res.status(404).json({
                success: false,
                message: "Member account is deactivated!! No fines available for deactivated members."
            })
        }

        const { data: fines, pagination } = await paginate(
            Fine,
            { member: memberId },
            req.query,
            [{
                path: "issue",
                populate: {
                    path: "book",
                    select: "title author coverImage"
                }
            }]
        )

        // calculate total outStanding balance for the member
        const totalPending = fines
                    .filter(fine => ["pending", "partial"].includes(fine.status)) // only consider pending and partial fines for total pending calculation
                    .reduce((sum, fine) => sum + fine.amount, 0); // sum up the amounts of pending and partial fines

        return res.status(200).json({
            success: true,
            message: "Fines retrieved successfully!!",
            pagination,
            member,
            totalPending,
            fines
        })

    } catch (err) {
        next(err);
    }
}

/*
    Pay fine supports both full and partial payment (Admin only)
    POST /api/fines/:fineId/pay
*/
exports.payFine = async (req, res, next) => {
    try {
        const { fineId } = req.params;
        const { amount } = req.body;

        // validate if fineId is a valid ObjectId
        if (!mongoose.Types.ObjectId.isValid(fineId)) {
            return res.status(400).json({
                success: false,
                message: "Invalid Fine ID!!"
            })
        }

        // validate if amount is a positive number
        if (!amount || typeof amount !== "number" || amount <= 0) {
            return res.status(400).json({
                success: false,
                message: "Invalid amount!! Please provide a valid amount to pay."
            })
        }

        // find the fine by ID
        const fine = await Fine.findById(fineId);

        // check if fine exists
        if (!fine) {
            return res.status(404).json({
                success: false,
                message: "Fine not found!!"
            })
        }

        // check if fine is already paid
        if (fine.status === "paid") {
            return res.status(400).json({
                success: false,
                message: "Fine is already paid!! No further payment is required."
            })
        }

        // check if fine is waived off already
        if (fine.status === "waived") {
            return res.status(400).json({
                success: false,
                message: "Fine is waived off!! No payment is required."
            })
        }

        // check amount to be paid
        const balanceAmount = fine.totalAmount - fine.paidAmount;

        if (amount > balanceAmount) {
            return res.status(400).json({
                success: false,
                message: `Overpayment detected!! The maximum amount you can pay is ₹${balanceAmount}. Please enter a valid amount.`
            })
        }

        const newPaidAmount = fine.paidAmount + amount;
        const isFullyPaid = newPaidAmount >= fine.totalAmount;

        // update fine payment details
        const updateFine = await Fine.findByIdAndUpdate(fineId, {
            paidAmount: newPaidAmount,
            status: isFullyPaid ? "paid" : "partial",
            paidAt: isFullyPaid ? new Date() : null
        }, { new: true });

        return res.status(200).json({
            success: true,
            message: isFullyPaid
                    ? `Fine fully paid!! ₹${amount} received. Balance: ₹0`
                    : `Partial payment of ₹${amount} recorded. Balance remaining: ₹${fine.totalAmount - newPaidAmount}`,
            fine: updateFine
        })
    } catch (err) {
        next(err);
    }
}

// Waive off fine (Admin only)
exports.waiveFine = async (req, res, next) => {
    try {
        const { fineId } = req.params;
        const { reason } = req.body;

        // check if fineId is valid        
        if (!mongoose.Types.ObjectId.isValid(fineId)) {
            return res.status(400).json({
                success: false,
                message: "Invalid Fine ID!!"
            })
        }

        // check if reason is provided
        if (!reason || reason.trim() === "") {
            return res.status(400).json({
                success: false,
                message: "Waive reason is required!! Please provide a reason for waiving off the fine."
            })
        }

        // find the fine by ID
        const fine = await Fine.findById(fineId);

        if (!fine) {
            return res.status(404).json({
                success: false,
                message: "Fine not found!!"
            })
        }

        // check if fine is already paid
        if (fine.status === "paid") {
            return res.status(400).json({
                success: false,
                message: "Fine is already paid!! Cannot waive off a paid fine."
            })
        }

        // check if fine is waived off already
        if (fine.status === "waived") {
            return res.status(400).json({
                success: false,
                message: "Fine is already waived off!!"
            })
        }

        // update fine status to waived
        const updateFine = await Fine.findByIdAndUpdate(fineId, {
            status: "waived",
            waivedReason: reason.trim()
        }, { new: true});

        return res.status(200).json({
            success: true,
            message: "Fine waived off successfully!!",
            fine: updateFine
        })
    } catch (err) {
        next(err);
    }
}

// Cron job to calculate fines for overdue issues, just for testing purpose, in production this should run as a scheduled job at regular intervals (e.g. daily)
exports.runFineCronJob = async (req, res, next) => {
    try {
        await runOverDueJob();

        return res.status(200).json({
            success: true,
            message: "Fine cron job executed successfully!! Check server logs for details."
        })
    } catch (err) {
        next(err);
    }
}