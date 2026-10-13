
const express = require("express");
const router = express.Router();

// ============================================
// EXISTING POSITION CONTROLLER
// ============================================

const {
    getPositions,
    createPosition,
    updatePosition,
    deletePosition
} = require("../controllers/positionController");

// ============================================
// AUTHENTICATION AND ROLE-BASED SECURITY
// ============================================

const {
    requireAuth,
    requireRole
} = require("../middleware/authMiddleware");

// All Position routes require login
router.use(requireAuth);

// ============================================
// VIEW POSITIONS
// All authenticated users
// ============================================

router.get("/", getPositions);

// ============================================
// CREATE POSITION
// HR_ADMIN only
// ============================================

router.post(
    "/",
    requireRole("HR_ADMIN"),
    createPosition
);

// ============================================
// UPDATE POSITION
// HR_ADMIN only
// ============================================

router.put(
    "/:id",
    requireRole("HR_ADMIN"),
    updatePosition
);

// ============================================
// DELETE POSITION
// HR_ADMIN only
// ============================================

router.delete(
    "/:id",
    requireRole("HR_ADMIN"),
    deletePosition
);

module.exports = router;
