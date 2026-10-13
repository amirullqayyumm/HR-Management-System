
const express = require("express");
const router = express.Router();

// Existing Department Controller
const {
    getDepartments,
    createDepartment,
    updateDepartment,
    deleteDepartment
} = require("../controllers/departmentController");

// Authentication and Role-Based Security
const {
    requireAuth,
    requireRole
} = require("../middleware/authMiddleware");

// All Department routes require login
router.use(requireAuth);

// VIEW DEPARTMENTS
// HR_ADMIN, MANAGER and EMPLOYEE
router.get("/", getDepartments);

// CREATE DEPARTMENT
// HR_ADMIN only
router.post(
    "/",
    requireRole("HR_ADMIN"),
    createDepartment
);

// UPDATE DEPARTMENT
// HR_ADMIN only
router.put(
    "/:id",
    requireRole("HR_ADMIN"),
    updateDepartment
);

// DELETE DEPARTMENT
// HR_ADMIN only
router.delete(
    "/:id",
    requireRole("HR_ADMIN"),
    deleteDepartment
);

module.exports = router;
