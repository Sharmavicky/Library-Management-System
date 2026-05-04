const express           = require("express");
const router            = express.Router();
const { verifyToken, isAdmin } = require("../middleware/authMiddleWare");
const { getSummary }    = require("../../controllers/report-controller");

// GET /api/reports/summary
router.get("/summary", verifyToken, isAdmin, getSummary);

module.exports = router;