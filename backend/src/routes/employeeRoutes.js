
const express = require("express");
const router = express.Router();

const {
    getEmployees,
    createEmployee,
    updateEmployee,
    deactivateEmployee,
    reactivateEmployee
} = require("../controllers/employeeController");

const {
    requireAuth,
    requireRole
} = require("../middleware/authMiddleware");

// All employee management routes require login.
router.use(requireAuth);

// Only HR_ADMIN can access employee management.
router.use(requireRole("HR_ADMIN"));

// GET - Retrieve all employees
router.get("/", getEmployees);

// POST - Register a new employee
router.post("/", createEmployee);

// PUT - Update an existing employee
router.put("/:id", updateEmployee);

// PATCH - Deactivate an employee
router.patch("/:id/deactivate", deactivateEmployee);

// PATCH - Reactivate an employee
router.patch("/:id/reactivate", reactivateEmployee);

module.exports = router;
