const mongoose = require("mongoose");
const Fine = require("../Models/modelExporter").Fine;
const User = require("../Models/modelExporter").User;

// Get all fines (Admin only)
exports.getAllFines = async (req, res) => {
    try {
        const { status } = req.query;   // optional query param to filter by status
        const query = status ? { status } : {}; // if status is provided, filter by it, otherwise get all fines

        const fines = await Fine.find(query)
                    .populate("member", "username email")
                    .populate({                 // populate issue details and book snapshot
                        path: "issue",
                        populate: { path: "book", select: "title author" }
                    })
                    .sort({ createdAt: -1 }); // sort by most recent
        
        return res.status(200).json({
            success: true,
            message: "Fines retrieved successfully!!",
            count: fines.length,
            fines
        })
    } catch (err) {
        return res.status(500).json({
            success: false,
            message: "Something went wrong!!",
            error: err.message
        })
    }
}

// Get fines for a specific member (Admin only)
exports.getFinesByMember = async (req, res) => {
    try {
        const { memberId } = req.params;

        // validate if memberId is a valid ObjectId
        if (!mongoose.Types.ObjectId.isValid(memberId)) {{
            return res.status(400).json({
                success: false,
                message: "Invalid Member ID!!"
            })
        }}

        // find fines for the member, populate issue details, sort by most recent
        const fines = await Fine.find({ member: memberId })
                    .populate({
                        path: "issue",
                        populate: { path: "book", select: "title author" }
                    })
                    .sort({ createdAt: -1 });

        // calculate total outStanding balance for the member
        const totalPending = fines
                    .filter(fine => ["pending", "partial"].includes(fine.status)) // only consider pending and partial fines for total pending calculation
                    .reduce((sum, fine) => sum + fine.amount, 0); // sum up the amounts of pending and partial fines

        return res.status(200).json({
            success: true,
            message: "Fines retrieved successfully!!",
            count: fines.length,
            totalPending,
            fines
        })

    } catch (err) {
        return res.status(500).json({
            success: false,
            message: "Something went wrong!!",
            error: err.message
        })
    }
}

// Pay fine supports both full and partial payment (Admin only)
exports.payFine = async (req, res) => {
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
        return res.status(500).json({
            success: false,
            message: "Something went wrong!!",
            error: err.message
        })
    }
}

// Waive off fine (Admin only)
exports.waiveFine = async (req, res) => {
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
        return res.status(500).json({
            success: false,
            message: "Something went wrong!!",
            error: err.message
        })
    }
}