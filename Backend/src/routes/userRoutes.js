const express = require("express");
const router = express.Router();
const {  verifyToken, isAdmin } = require("../middleware/authMiddleWare");
const {
    getMyProfile,
    getAllMembers,
    getMemberById,
    blockMemberById,
    clearFine,
    deleteMember
} = require("../../controllers/user-controller");

router.patch("/:userId/block", verifyToken, isAdmin, blockMemberById);
router.patch("/:userId/fine", verifyToken, isAdmin, clearFine);
router.get("/:userId", verifyToken, isAdmin, getMemberById);
router.delete("/:userId", verifyToken, isAdmin, deleteMember);
router.get("/profile", verifyToken, getMyProfile);
router.get("/", verifyToken, isAdmin, getAllMembers);

module.exports = router;