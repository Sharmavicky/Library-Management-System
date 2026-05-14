const mongoose = require("mongoose");
const Book = require("../Models/modelExporter").Book;
const Issue = require("../Models/modelExporter").Issue;
const paginate = require("../utils/paginate");

/*
    Add a new book (Admin only)
    POST /api/books
*/
exports.addBooks = async (req, res, next) => {
    try {
        const { title, author, isbn, summary, coverImage, bookshelves, totalCopies } = req.body;

        // check if book with same ISBN already exists
        if (isbn) {
            const existing = await Book.findOne({ isbn });
            if (existing) {
                return res.status(409).json({
                    success: false,
                    message: "A Book with same ISBN already exists!!"
                })
            }
        }

        const newBook = await Book.create({
            title,
            author,
            isbn,
            summary: summary || null,
            coverImage: coverImage || null,
            bookshelves: bookshelves || [],
            totalCopies: totalCopies || 1,
            availableCopies: totalCopies || 1
        });

        return res.status(200).json({
            success: true,
            message: "Book added successfully!!",
            book: newBook
        })
    } catch (err) {
        next(err);
    }
}

/*
    Get all books (Protected route, accessible by both members and admins)
    GET /api/books?page=1&limit=10
*/
exports.getAllBooks = async (req, res, next) => {
    try {
        const { data: books, pagination } = await paginate(Book, {}, req.query);

        return res.status(200).json({
            success: true,
            message: "Books retrieved successfully!!",
            count: books.length,
            pagination,
            books
        })
    } catch (err) {
        next(err);
    }
}

/*
    Get book by ID (Protected route, accessible by both members and admins)
    GET /api/books/:bookId
*/
exports.getBookById = async (req, res, next) => {
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
        next(err);
    }
}

/* 
    Search books by title or author (Protected route, accessible by both members and admins)
    GET /api/books/search?query=habits&page=1&limit=10
*/
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

        const filter = ({
            $or: [
                { title: { $regex: query, $options: "i" } },
                { author: { $regex: query, $options: "i" } }
            ]
        });

        const { data: books, pagination } = await paginate(Book, filter, req.query);

        return res.status(200).json({
            success: true,
            message: "Books searched successfully!!",
            pagination,
            books
        });
    } catch (err) {
        next(err);
    }
}

// Update book (Admin only)
exports.updateBook = async (req, res, next) => {
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

        // strip out fields that should not be updated
        delete data.availableCopies; // availableCopies should not be updated directly
        delete data._id; // _id should not be updated

        // check if book exists
        const book = await Book.findById(bookId);

        if (!book) {
            return res.status(404).json({
                success: false,
                message: "Book not found!!"
            })
        }

        // if totalCopies is being updated by admin, adjust availableCopies accordingly
        if (data.totalCopies && data.totalCopies !== book.totalCopies) {
            const diff = data.totalCopies - book.totalCopies;
            data.availableCopies = book.availableCopies + diff;
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
        next(err);
    }
}

// Delete book (Admin only)
exports.deleteBook = async (req, res, next) => {
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
        const activeIssue = await Issue.findOne({ book: bookId, returned: false });

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
        next(err);
    }
}