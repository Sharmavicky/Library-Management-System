const express = require("express");
const router  = express.Router();
const { verifyToken, isAdmin } = require("../middleware/authMiddleWare");
const validate = require("../middleware/validate");
const { payFineSchema, waiveFineSchema } = require("../validators/fineValidator");
const { getAllFines, getFinesByMember, payFine, waiveFine } = require("../../controllers/fine-controller");


router.get("/",                    verifyToken, isAdmin, getAllFines); // GET /api/fines
router.get("/:userId",             verifyToken, isAdmin, getFinesByMember); // GET /api/fines/:userId
router.patch("/:fineId/pay",       verifyToken, isAdmin, validate(payFineSchema),   payFine); // PATCH /api/fines/:fineId/pay
router.patch("/:fineId/waive",     verifyToken, isAdmin, validate(waiveFineSchema), waiveFine); // PATCH /api/fines/:fineId/waive

module.exports = router;