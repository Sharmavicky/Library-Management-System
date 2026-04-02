const mongoose = require("mongoose");
const Issue = require("../Models/modelExporter").Issue;
const Book = require("../Models/modelExporter").Book;
const User = require("../Models/modelExporter").User;

const FINE_PER_DAY = 5; // fine amount per day for late returns
const ISSUE_DAYS = 14; // number of days a book can be issued before it's considered late

// Get all issued books (Protected route, accessible admins)
exports.getAllIssuedBooks = async (req, res) => {
    try {
        const issuedBooks = await Issue.find()
            .populate("book", "title author coverImage availableCopies") // populatebook deails only tile, author, coverImage and copies
            .populate("member", "username email fine"); // populate member details only username, email and fine

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

        // check if book exists
        const book = await Book.findById(bookId);
        if (!book) {
            return res.status(404).json({
                success: false,
                message: "Book not found!!"
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

        // check if the book has available copies
        if (book.availableCopies < 1) {
            return res.status(400).json({
                success: false,
                message: "Book is currently unavailable!!"
            })
        }

        // check if user already has an active issue for the same book
        const alreadyIssue = await Issue.findOne({
            book: bookId,
            member: userId,
            returned: false // active issue has no returnDate
        })

        if (alreadyIssue) {
            return res.status(400).json({
                success: false,
                message: "Book already issued to this user!!"
            })
        }

        // create a new issue record
        const returnDate = new Date();
        returnDate.setDate(returnDate.getDate() + ISSUE_DAYS); // set return date to ISSUE_DAYS from now

        const [newIssue] = await Promise.all([
            // create issue record
            Issue.create({
                book: bookId,
                member: userId,
                dueDate: returnDate
            }),

            // decrement available copies of the book by 1
            Book.findByIdAndUpdate(bookId, { $inc: { availableCopies: -1} })
        ])

        return res.status(201).json({
            success: true,
            message: `Book issued successfully. Due date by ${returnDate.toDateString()}!!`,
            availableCopies: book.availableCopies - 1,
            issue: newIssue
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

        // update issue record to mark as returned and set find and increment copies of the book
        await Promise.all([
            Issue.findByIdAndUpdate(issueId, { // update issue record
                returned: true,
                returnedAt: now,
                fine: fine
            }),
            Book.findByIdAndUpdate(issueRecord.book, { $inc: { availableCopies: 1 } }), // increment copies of book by 1
            fine > 0 ? User.findByIdAndUpdate(issueRecord.member, { $inc: { fine } }) : null // update fine if there is any
        ]);

        return res.status(201).json({
            success: true,
            message: `Book returned successfully!!${isLate
                ? ` Late by ${daysOverdue} days. Fine: ${fine}`
                : "Book returned on time. No fine."}`,
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
            .populate("book", "title author coverImage avaiableCopies") // populate book details only title, author, coverImage and copies

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
        const daysLeft = Math.ceil((issue.dueDate - now) / 1000 * 60 * 60 * 24);
        res.status(200).json({
            success: true,
            message: "Read Access Granted!!",
            title: issue.book.title,
            plainTextUrl: issue.book.plainTextUrl,
            dueDate: issue.dueDate,
            daysLeft
        });
    } catch (err) {
        res.status(500).json({
            success: false,
            message: "Something went wrong!!",
            error: err.message
        });
    }
};