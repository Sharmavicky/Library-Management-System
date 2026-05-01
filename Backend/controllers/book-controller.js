const mongoose = require("mongoose");
const Book = require("../Models/modelExporter").Book;
const Issue = require("../Models/modelExporter").Issue;

// Get all books
exports.getAllBooks = async (req, res) => {
    try {
        const books = await Book.find();
        return res.status(200).json({
            success: true,
            message: "Books retrieved successfully!!",
            count: books.length,
            books
        })
    } catch (err) {
        return res.status(500).json({
            success: false,
            message: "Something went wrong!!",
            error: err.message
        })
    }
}

// Get book by ID (Protected route, accessible by both members and admins)
exports.getBookById = async (req, res) => {
    try {
        const { bookId } = req.params;

        // check if bookId is valid
        if (!mongoose.Types.ObjectId.isValid(bookId)) {
            return res.status(400).json({
                success: false,
                message: "Invalid book ID!!"
            })
        }

        const book = await Book.findById(bookId);

        // check if book exists
        if (!book) {
            return res.status(404).json({
                success: false,
                message: "Book not found!!"
            })
        }

        return res.status(200).json({
            success: true,
            message: "Book retrieved successfully!!",
            book
        })
    } catch (err) {
        return res.status(500).json({
            success: false,
            message: "Something went wrong!!",
            error: err.message
        })
    }
}

// Search books by title or author (Protected route, accessible by both members and admins)
exports.searchBooks = async (req, res) => {
    try {
        const { query } = req.query;

        // validate query
        if (!query) {
            return res.status(400).json({
                success: false,
                message: "Search query is required!!"
            })
        }

        const books = await Book.find({
            $or: [
                { title: { $regex: query, $options: "i" } },
                { author: { $regex: query, $options: "i" } }
            ]
        });

        return res.status(200).json({
            success: true,
            message: "Books searched successfully!!",
            books
        });
    } catch (err) {
        return res.status(500).json({
            success: false,
            message: "Something went wrong!!",
            error: err.message
        });
    }
}

// Update book (Admin only)
exports.updateBook = async (req, res) => {
    try {
        const { bookId } = req.params;
        const  data  = req.body;

        // check if bookId is valid
        if (!mongoose.Types.ObjectId.isValid(bookId)) {
            return res.status(400).json({
                success: false,
                message: "Invalid book ID!!"
            })
        }

        // validate data
        if (!data) {
            return res.status(400).json({
                success: false,
                message: "No data provided for update!!"
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

        // update book fields
        const updatedBook = await Book.findByIdAndUpdate(
            bookId,
            { $set: data },
            { returnDocument: "after", runValidators: true }
        );

        return res.status(200).json({
            success: true,
            message: "Book updated successfully!!",
            book: updatedBook
        })
    } catch (err) {
        return res.status(500).json({
            success: false,
            message: "Something went wrong!!",
            error: err.message
        })
    }
}

// Delete book (Admin only)
exports.deleteBook = async (req, res) => {
    try {
        const { bookId } = req.params;

        // check if bookId is valid
        if (!mongoose.Types.ObjectId.isValid(bookId)) {
            return res.status(400).json({
                success: false,
                message: "Invalid book ID!!"
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

        // check if book is currently borrowed by any member if than the  book cannot be deleted
        const activeIssue = await Issue.findOne({ book: bookId, returned: { $exists: false } });

        if (activeIssue) {
            return res.status(400).json({
                success: false,
                message: `Cannot delete. ${book.availableCopies < book.totalCopies
                    ? book.totalCopies - book.availableCopies
                    : 0} copy/copies of this book are currently issued to members!!`
            })
        }
        
        // delete book
        await Book.findByIdAndDelete(bookId);

        return res.status(200).json({
            success: true,
            message: "Book deleted successfully!!"
        })
    } catch (err) {
        return res.status(500).json({
            success: false,
            message: "Something went wrong!!",
            error: err.message
        })
    }
}