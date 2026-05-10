const express = require("express");
const router  = express.Router();
const { verifyToken, isAdmin } = require("../middleware/authMiddleWare");
const validate = require("../middleware/validate");
const { updateBookSchema } = require("../validators/bookValidator");

const { getAllBooks, getBookById, searchBooks, updateBook, deleteBook } = require("../../controllers/book-controller");

//  static routes FIRST — /search must come before /:bookId otherwise Express swallows "search" as a bookId param
router.get("/",             verifyToken,          getAllBooks);   // GET /api/books
router.get("/search",       verifyToken,          searchBooks);  // GET /api/books/search?query=
router.get("/:bookId",      verifyToken,          getBookById);  // GET /api/books/:bookId
router.put("/:bookId",      verifyToken, isAdmin, validate(updateBookSchema), updateBook);
router.delete("/:bookId",   verifyToken, isAdmin, deleteBook);

module.exports = router;