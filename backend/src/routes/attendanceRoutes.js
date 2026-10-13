
const express = require("express");
const router = express.Router();

const {
  clockIn,
  clockOut,
  getMyAttendance,
  getAllAttendance
} = require("../controllers/attendanceController");

const {
  requireAuth,
  requireRole
} = require("../middleware/authMiddleware");

// All attendance routes require login
router.use(requireAuth);

// Employee, Manager and HR Admin:
// Clock in using their own logged-in employee ID
router.post("/clock-in", clockIn);

// Clock out using their own logged-in employee ID
router.post("/clock-out", clockOut);

// View own attendance history
router.get("/my", getMyAttendance);

// HR Admin only: View all employee attendance records
router.get(
  "/all",
  requireRole("HR_ADMIN"),
  getAllAttendance
);

module.exports = router;
