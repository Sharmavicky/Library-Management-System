const express = require("express");
const router = express.Router();
const {
    requestBook,
    getAllRequests,
    approveRequest,
    rejectRequest,
} = require("../../controllers/bookRequest-controller.js");
const { verifyToken, isAdmin }  = require("../middleware/authMiddleware.js");

// Member routes
router.post("/:bookId",          verifyToken,          requestBook);      // POST /api/requests/:bookId

// Admin routes
router.get("/",                  verifyToken, isAdmin, getAllRequests);   // GET  /api/requests
router.patch("/:id/approve",      verifyToken, isAdmin, approveRequest);   // PATCH /api/requests/:id/approve
router.patch("/:id/reject",       verifyToken, isAdmin, rejectRequest);   // PATCH /api/requests/:id/reject

module.exports = router;