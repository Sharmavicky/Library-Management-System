const express = require("express");
const router = express.Router();
const { verifyToken, isAdmin } = require("../middleware/authMiddleWare");
const validate           = require("../middleware/validate");
const { issueBookSchema } = require("../validators/bookValidator");
const {
    getAllIssuedBooks,
    issueBook,
    returnBook,
    getMyIssuedBooks,
    getReadAccess
} = require("../../controllers/issue-controller");

router.patch("/:issuedId/return", verifyToken, isAdmin, returnBook);
router.get("/read/:issueId", verifyToken, getReadAccess);
router.get("/", verifyToken, isAdmin, getAllIssuedBooks);
router.post("/", verifyToken, isAdmin, validate(issueBookSchema), issueBook);
router.get("/my", verifyToken, getMyIssuedBooks);

module.exports = router;