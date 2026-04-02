const express = require("express");
const router = express.Router();
const { verifyToken, isAdmin } = require("../../middleware/authMiddleWare");
const {
    getAllIssuedBooks,
    issueBook,
    returnBook,
    getMyIssuedBooks,
    getReadAccess
} = require("../../controllers/issue-controller");

router.get("/", verifyToken, isAdmin, getAllIssuedBooks);
router.post("/", verifyToken, isAdmin, issueBook);
router.patch("/:issuedId/return", verifyToken, isAdmin, returnBook);
router.get("/my", verifyToken, getMyIssuedBooks);
router.get("/read/:issueId", verifyToken, getReadAccess);

module.exports = router;