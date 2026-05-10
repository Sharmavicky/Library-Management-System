const express = require("express");
const router  = express.Router();
const { verifyToken, isAdmin } = require("../middleware/authMiddleWare");
const { getFinesByMember } = require("../../controllers/fine-controller");
const {
    getMyProfile,
    getAllMembers,
    getMemberById,
    blockMemberById,
    clearFine,
    deleteMember
} = require("../../controllers/user-controller");

// ── Static routes first
router.get("/profile", verifyToken,          getMyProfile);
router.get("/",        verifyToken, isAdmin, getAllMembers);

// ── Param routes last 
router.get("/:userId",             verifyToken, isAdmin, getMemberById);
router.get("/:userId/fines",       verifyToken, isAdmin, getFinesByMember);
router.patch("/:userId/block",     verifyToken, isAdmin, blockMemberById);
router.patch("/:userId/fine",      verifyToken, isAdmin, clearFine);
router.delete("/:userId",          verifyToken, isAdmin, deleteMember);

module.exports = router;