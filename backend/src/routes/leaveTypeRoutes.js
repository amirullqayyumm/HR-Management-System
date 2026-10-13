
const express = require("express");

const router = express.Router();

const {
  getLeaveTypes,
  createLeaveType
} = require("../controllers/leaveTypeController");

const {
  requireAuth,
  requireRole
} = require("../middleware/authMiddleware");

// All Leave Type routes require login
router.use(requireAuth);

// Any logged-in user can view leave types
router.get("/", getLeaveTypes);

// Only HR_ADMIN can create leave types
router.post("/", requireRole("HR_ADMIN"), createLeaveType);

module.exports = router;
