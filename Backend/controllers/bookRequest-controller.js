const BookRequest = require("../Models/modelExporter.js").BookRequest;
const Book = require("../Models/modelExporter.js").Book;
const User = require("../Models/modelExporter.js").User;
const Issue = require("../Models/modelExporter.js").Issue;
const Fine = require("../Models/modelExporter.js").Fine;

const ISSUE_DAYS = 14; // number of days for which book is issued

// ── MEMBER: Request a book ────────────────────────────────────────────────────
exports.requestBook = async (req, res, next) => {
    try {
        const memberId = req.user._id;
        const { bookId } = req.params;

        // Check book exists
        const book = await Book.findById(bookId);
        if (!book) {
            return res.status(404).json({
                success: false,
                message: "Book not found"
            });
        }

        // Check for an existing pending request for the same book
        const existing = await BookRequest.findOne({
            member: memberId,
            book:   bookId,
            status: "pending",
        });
        if (existing) {
            return res.status(400).json({
                success: false,
                message: "You already have a pending request for this book"
            });
        }

        const request = await BookRequest.create({ member: memberId, book: bookId });

        res.status(201).json({
            success: true,
            message: "Book requested successfully",
            request
        });
    } catch (err) {
        next(err);
    }
};

// ── ADMIN: Get all requests ───────────────────────────────────────────────────
exports.getAllRequests = async (req, res, next) => {
    try {
        const { status } = req.query; // optional ?status=pending filter

        const filter = status ? { status } : {};

        const requests = await BookRequest.find(filter)
            .populate("member", "name email")
            .populate("book",   "title author isbn")
            .sort({ createdAt: -1 }); // newest first

        res.status(200).json({
            success: true,
            message: "Book requests retrieved successfully",
            requests
        });
    } catch (err) {
        next(err);
    }
};

// ── ADMIN: Approve a request ──────────────────────────────────────────────────
exports.approveRequest = async (req, res, next) => {
    try {
        const { id } = req.params;
        const request = await BookRequest.findById(id).populate("book");

        // validate request exists and is pending
        if (!request) return res.status(404).json({
            success: false,
            message: "Request not found"
        });

        if (request.status !== "pending") {
            return res.status(400).json({
                success: false,
                message: `Request is already ${request.status}`
            });
        }

        const memberId = request.member;
        const bookId = request.book._id;

        // check if user is active
        const user = await User.findById(memberId);
        if (!user || !user.isActive) {
            return res.status(400).json({
                success: false,
                message: "Member account is not active"
            })
        }

        // check if member as unpaid/partial fines
        const hasPendingFines = await Fine.exists({
            member: memberId,
            status: { $in: ["pending", "partial"] }
        });
        if (hasPendingFines) {
            return res.status(400).json({
                success: false,
                message: "Member has pending fines. Please clear them before requesting books."
            })
        }

        // check if book is already issued
        const alreadyIssued = await Issue.exists({
            book: bookId,
            member: memberId,
            returned: false
        });
        if (alreadyIssued) {
            return res.status(400).json({
                success: false,
                message: "This book is already issued to the member and not yet returned."
            })
        }

        // atomic operation to create issue record and decrement available copies of book by 1
        const book = await Book.findByIdAndUpdate(
            { _id: bookId, availableCopies: { $gt: 0 } }, // check if book has available copies before updating
            { $inc: { availableCopies: -1 } }, // decrement available copies by 1
            { new: true } // return the updated book document
        )

        // if book is null after update, it means there were no available copies
        if (!book) {
            return res.status(400).json({
                success: false,
                message: "No available copies to issue!!"
            })
        }

        // calculate due date by adding ISSUE_DAYS to current date
        const dueDate = new Date();
        dueDate.setDate(dueDate.getDate() + ISSUE_DAYS);

        // create issue record with bookSnapShot to preserve book details at the time of issue
        const issueRecord = await Issue.create({
            book: bookId,
            member: memberId,
            dueDate,
            bookSnapShot: {
                title: book.title,
                author: book.author
            }
        })

        // update the status to approve and also issue the same book to member
        request.status = "approved";
        request.issue = issueRecord._id; // link the created issue record to the book request
        await request.save();

        res.status(200).json({
            success: true,
            message: "Request approved and book issued successfully",
            issue: issueRecord,
            request
        });
    } catch (err) {
        next(err);
    }
};

// ── ADMIN: Reject a request ───────────────────────────────────────────────────
exports.rejectRequest = async (req, res, next) => {
    try {
        const { id } = req.params;
        const request = await BookRequest.findById(id);

        // validate request exists and is pending
        if (!request) {
            return res.status(404).json({
                success: false,
                message: "Request not found"
            });
        }

        if (request.status !== "pending")
            return res.status(400).json({
                success: false,
                message: `Request is already ${request.status}`
            });

        request.status = "rejected";
        request.note   = req.body.note || "";   // optional rejection reason
        await request.save();

        res.status(200).json({
            success: true,
            message: "Request rejected",
            request
        });
    } catch (err) {
        next(err);
    }
};