
const express = require("express");

const router = express.Router();

const {
  getLeaveApplications,
  reviewLeaveApplication,
  requestLeaveCancellation,
  reviewLeaveCancellation,
} = require("../controllers/leaveApplicationController");

const {
  submitLeaveApplication,
} = require("../controllers/secureLeaveSubmissionController");

const {
  requireAuth,
} = require("../middleware/authMiddleware");

// All Leave Application routes require login
router.use(requireAuth);

// Get leave applications
router.get("/", getLeaveApplications);

// Submit leave using secure working-day calculation
router.post("/", submitLeaveApplication);

// Review leave application
router.patch("/:id/review", reviewLeaveApplication);

// Request leave cancellation
router.post("/:id/cancellation", requestLeaveCancellation);

// Review leave cancellation
router.patch(
  "/:id/cancellation/review",
  reviewLeaveCancellation
);

module.exports = router;
