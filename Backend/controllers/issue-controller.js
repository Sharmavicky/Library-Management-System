const mongoose = require("mongoose");
const Issue = require("../Models/modelExporter").Issue;
const Book = require("../Models/modelExporter").Book;
const User = require("../Models/modelExporter").User;
const Fine = require("../Models/modelExporter").Fine;

const FINE_PER_DAY = 5; // fine amount per day for late returns
const ISSUE_DAYS = 14; // number of days a book can be issued before it's considered late

// Get all issued books (Protected route, accessible admins)
exports.getAllIssuedBooks = async (req, res) => {
    try {
        const issuedBooks = await Issue.find()
            .populate("book", "title author coverImage availableCopies") // populatebook deails only tile, author, coverImage and copies
            .populate("member", "username email"); // populate member details only username, email

        return res.status(200).json({
            success: true,
            message: "Issued books retrieved successfully!!",
            count: issuedBooks.length,
            issuedBooks
        })
    } catch (err) {
        return res.status(500).json({
            success: false,
            message: "Something went wrong!!",
            error: err.message
        })
    }
}

// Issue a book to a member (Protected route, accessible by admin only)
exports.issueBook = async (req, res) => {
    try {
        const { bookId, userId } = req.body;

        // check if both bookId and userId are valid
        if (!mongoose.Types.ObjectId.isValid(bookId) || !mongoose.Types.ObjectId.isValid(userId)) {
            return res.status(400).json({
                success: false,
                message: "Invalid book ID or user ID!!"
            })
        }

        // check if user exists
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found!!"
            })
        }

        // check if user is active member
        if (!user.isActive) {
            return res.status(400).json({
                success: false,
                message: "Cannot issue book. User account is blocked!!"
            })
        }

        // check if user has unpaid/partial fines
        const hasPendingFines = await Fine.exists({
            member: userId,
            status: { $in: ["pending", "partial"] }
        });
        if (hasPendingFines) {
            return res.status(403).json({
                success: false,
                message: "Cannot issue book. User has unpaid fines!! Please clear fines to issue new books."
            })
        }

        // check if book already issued to user
        const alreadyIssued = await Issue.findOne({ book: bookId, member: userId, returned: false });
        if (alreadyIssued) {
            return res.status(400).json({
                success: false,
                message: "Book is already issued to this user!!"
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
            const exists = await Book.exists({ _id: bookId });
            if (!exists) {
                return res.status(404).json({
                    success: false,
                    message: "Book not found!!"
                })
            }

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
            member: userId,
            dueDate,
            bookSnapShot: {
                title: book.title,
                author: book.author
            }
        })

        return res.status(200).json({
            success: true,
            message: "Book issued successfully!!",
            issueRecord
        })
        
    } catch (err) {
        return res.status(500).json({
            success: false,
            message: "Something went wrong!!",
            error: err.message
        })
    }
}

// Return a book (Protected route, accessible by admin only)
exports.returnBook = async (req, res) => {
    try {
        const { issueId } = req.params;

        // check if issueId is valid
        if (!mongoose.Types.ObjectId.isValid(issueId)) {
            return res.status(400).json({
                success: false,
                message: "Invalid issue ID!!"
            })
        }

        // check if issue record exists
        const issueRecord = await Issue.findById(issueId);
        if (!issueRecord) {
            return res.status(404).json({
                success: false,
                message: "Issue record not found!!"
            })
        }

        // check if book is already returned
        if (issueRecord.returned) {
            return res.status(400).json({
                success: false,
                message: "Book is already returned!!"
            })
        }

        // calculate fine if overdue
        const now         = new Date();
        const isLate      = now > issueRecord.dueDate;
        const daysOverdue = isLate ? Math.ceil((now - issueRecord.dueDate) / (1000 * 60 * 60 * 24)) : 0;
        const fine        = daysOverdue * FINE_PER_DAY;

        // prepare updates - mark issue as returned and increment book's available copies by 1
        const update = [
            Issue.findByIdAndUpdate(issueId, {
                returned: true,
                returnedAt: now,
                status: "returned"   // update status to returned
            }),
            Book.findByIdAndUpdate(issueRecord.book, {
                $inc: { availableCopies: 1 } // increment available copies by 1
            })
        ]

        // create Fine record only if there is a fine to be paid
        if (isLate) {
            update.push(
                Fine.create({
                    issue: issueId,
                    member: issueRecord.member,
                    daysOverDue,
                    ratePerDay: FINE_PER_DAY,
                    totalAmount: fine,
                    paidAmount: 0,
                    status: "pending",
                    lastCalculatedAt: now
                })
            )
        }

        // execute all updates in parallel
        await Promise.all(update);

        return res.status(200).json({
            success: true,
            message: isLate
                    ? `Book returned successfully!! Late by ${daysOverdue} day(s). Fine raised: ₹${fineAmount}`
                    : "Book returned on time. No fine!!"
        })
    } catch (err) {
        return res.status(500).json({
            success: false,
            message: "Something went wrong!!",
            error: err.message
        })
    }
}

// Get all my issued books (Protected route, accessible by members only)
exports.getMyIssuedBooks = async (req, res) => {
    try {
        const myIssuedBooks = await Issue.find({ member: req.user._id })
            .populate("book", "title author coverImage availableCopies") // populate book details only title, author, coverImage and copies

        // attch live status of book (issue is active or returned) based on returnDate
        const now = new Date();
        const myIssuedBooksWithStatus = myIssuedBooks.map(issue => {
            const obj = issue.toObject();
            obj.status = issue.returned ? "Returned" : (now > issue.dueDate ? "Overdue" : "active");
            return obj;
        })

        return res.status(200).json({
            success: true,
            message: "Your issued books retrieved successfully!!",
            count: myIssuedBooksWithStatus.length,
            books: myIssuedBooksWithStatus
        })
    } catch (err) {
        return res.status(500).json({
            success: false,
            message: "Something went wrong!!",
            error: err.message
        })
    }
}

// Get Read Access (Protected route, accessible by member only)
exports.getReadAccess = async (req, res) => {
    try {
        const { issueId } = req.params;

        // check if issueId is valid
        if (!mongoose.Types.ObjectId.isValid(issueId)) {
            return res.status(400).json({
                success: false,
                message: "Invalid issue ID!!"
            })
        }

        // check if book is issued to user
        const issue = await Issue.findById(issueId).populate("book", "title plainTextUrl");
        if (!issue) {
            return res.status(404).json({
                success: false,
                message: "Issue record not found!!"
            })
        }

        // make sure this issue belongs to the requesting user
        if (issue.member.toString() !== req.user._id.toString()) {
            return res.status(403).json({
                success: false,
                message: "Unauthorized Access. This book is not issued to you!!"
            })
        }

        // check if book already returned by user
        if (issue.returned) {
            return res.status(403).json({
                success: false,
                message: "User already retuned book!!"
            })
        }

        // check overdue and block access for user to read book further
        const now = new Date();
        if (now > issue.dueDate) {
            const daysOverDue = Math.ceil((now - issue.dueDate) / (1000 * 60 * 60 * 24));
            return res.status(403).json({
                success: false,
                message: "Access expired!! Please return the book",
                daysOverDue,
                fine: daysOverDue * FINE_PER_DAY,
                dueDate: issue.dueDate
            })
        }

        // return read url
        const daysLeft = Math.ceil((issue.dueDate - now) / (1000 * 60 * 60 * 24));

        return res.status(200).json({
            success: true,
            message: "Read Access Granted!!",
            title: issue.book.title,
            plainTextUrl: issue.book.plainTextUrl,
            dueDate: issue.dueDate,
            daysLeft
        });
    } catch (err) {
        return res.status(500).json({
            success: false,
            message: "Something went wrong!!",
            error: err.message
        });
    }
};