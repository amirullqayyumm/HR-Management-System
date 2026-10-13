
const express = require("express");
const router = express.Router();

const {
  getLeaveBalances,
  saveLeaveBalance
} = require("../controllers/leaveBalanceController");

const {
  requireAuth,
  requireRole
} = require("../middleware/authMiddleware");

// All leave balance routes require login
router.use(requireAuth);

// Retrieve leave balances
// Role-based data filtering will be handled by the controller
router.get("/", getLeaveBalances);

// Only HR Admin can assign or update leave entitlements
router.post(
  "/",
  requireRole("HR_ADMIN"),
  saveLeaveBalance
);

module.exports = router;
