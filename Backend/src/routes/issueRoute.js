const express = require("express");
const router  = express.Router();
const { verifyToken, isAdmin, isMember } = require("../middleware/authMiddleWare");
const validate = require("../middleware/validate");
const { issueBookSchema } = require("../validators/issueValidator");

const { getAllIssuedBooks, issueBook, returnBook, getMyIssuedBooks, getReadAccess } = require("../../controllers/issue-controller");

// static routes before param routes
router.get("/",              verifyToken, isAdmin, getAllIssuedBooks);
router.post("/",             verifyToken, isAdmin, validate(issueBookSchema), issueBook);
router.get("/my",            verifyToken, isMember, getMyIssuedBooks);  //moved above param routes
router.get("/read/:issueId", verifyToken, isMember, getReadAccess);

// :issuedId → :issueId to match req.params.issueId in the controller
router.patch("/:issueId/return", verifyToken, isAdmin, returnBook);

module.exports = router;