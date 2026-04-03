const express = require("express");
const router = express.Router();
const { verifyToken, isAdmin } = require("../middleware/authMiddleWare");
const validate = require("../middleware/validate")
const { updateBookSchema } = require("../validators/issueValidator");
const {
    getAllBooks,
    getBookById,
    searchBooks,
    updateBook,
    deleteBook
} = require("../../controllers/book-controller");

// Get book by ID (Protected route, accessible by both members and admins)
router.get("/:bookId", verifyToken, getBookById); // GET /api/books/:bookId

// Update book details (Protected route, accessible by admins only)
router.put("/:bookId", verifyToken, isAdmin, validate(updateBookSchema), updateBook); // PUT /api/books/:bookId

// Delete a book (Protected route, accessible by admins only)
router.delete("/:bookId", verifyToken, isAdmin, deleteBook); // DELETE /api/books/:bookId

// Get all books (Protected route, accessible by both members and admins)
router.get("/", verifyToken, getAllBooks); // GET /api/books

// Search books by title or author (Protected route, accessible by both members and admins)
router.get("/search", verifyToken, searchBooks); // GET /api/books/search?query=searchTerm

module.exports = router;