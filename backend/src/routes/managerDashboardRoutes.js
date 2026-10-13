
const express = require("express");
const router = express.Router();

const {
  getManagerDashboard,
} = require("../controllers/managerDashboardController");

const {
  requireAuth,
  requireRole,
} = require("../middleware/authMiddleware");

// User must be logged in.
router.use(requireAuth);

// Only Managers can access this dashboard.
router.use(requireRole("MANAGER"));

// GET - Manager Dashboard statistics
router.get("/", getManagerDashboard);

module.exports = router;
