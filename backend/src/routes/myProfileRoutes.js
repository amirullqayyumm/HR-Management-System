
const express = require("express");
const router = express.Router();

const {
  getMyProfile,
} = require("../controllers/myProfileController");

const {
  requireAuth,
} = require("../middleware/authMiddleware");

// Only logged-in users can access their own profile.
router.use(requireAuth);

// GET - Logged-in employee's profile
router.get("/", getMyProfile);

module.exports = router;
