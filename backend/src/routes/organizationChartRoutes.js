
const express = require("express");
const router = express.Router();

const {
  getOrganizationChart,
} = require("../controllers/organizationChartController");

const {
  requireAuth,
} = require("../middleware/authMiddleware");

// All logged-in users can view the organization chart.
router.use(requireAuth);

// Read-only organization chart endpoint.
router.get("/", getOrganizationChart);

module.exports = router;
