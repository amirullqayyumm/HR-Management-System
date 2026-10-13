
const prisma = require("../prisma");

// ============================================
// VALIDATION HELPERS
// ============================================

const isValidText = (value) => {
  return typeof value === "string" && value.trim().length > 0;
};

const isValidId = (id) => {
  return Number.isSafeInteger(id) && id > 0;
};

// ============================================
// READ - Get all departments
// ============================================

const getDepartments = async (req, res) => {
  try {
    const departments = await prisma.department.findMany();

    return res.json(departments);
  } catch (error) {
    console.error("Get departments error:", error);

    return res.status(500).json({
      message: "Failed to get departments"
    });
  }
};

// ============================================
// CREATE - Create a new department
// ============================================

const createDepartment = async (req, res) => {
  try {
    const { code, name } = req.body || {};

    // Validate required fields before calling Prisma
    if (!isValidText(code) || !isValidText(name)) {
      return res.status(400).json({
        message: "Department code and name are required."
      });
    }

    const department = await prisma.department.create({
      data: {
        code: code.trim(),
        name: name.trim()
      }
    });

    return res.status(201).json(department);

  } catch (error) {
    console.error("Create department error:", error);

    // Duplicate department code or other unique field
    if (error.code === "P2002") {
      return res.status(409).json({
        message: "A department with this code or name already exists."
      });
    }

    return res.status(500).json({
      message: "Failed to create department"
    });
  }
};

// ============================================
// UPDATE - Update a department
// ============================================

const updateDepartment = async (req, res) => {
  try {
    const id = Number(req.params.id);
    const { code, name } = req.body || {};

    if (!isValidId(id)) {
      return res.status(400).json({
        message: "Invalid department ID"
      });
    }

    if (!isValidText(code) || !isValidText(name)) {
      return res.status(400).json({
        message: "Department code and name are required."
      });
    }

    const department = await prisma.department.update({
      where: {
        id: id
      },
      data: {
        code: code.trim(),
        name: name.trim()
      }
    });

    return res.json(department);

  } catch (error) {
    console.error("Update department error:", error);

    if (error.code === "P2025") {
      return res.status(404).json({
        message: "Department not found"
      });
    }

    if (error.code === "P2002") {
      return res.status(409).json({
        message: "A department with this code or name already exists."
      });
    }

    return res.status(500).json({
      message: "Failed to update department"
    });
  }
};

// ============================================
// DELETE - Safely delete a department
// ============================================

const deleteDepartment = async (req, res) => {
  try {
    const id = Number(req.params.id);

    // Step 1: Validate department ID
    if (!isValidId(id)) {
      return res.status(400).json({
        message: "Invalid department ID"
      });
    }

    // Step 2: Check whether department exists
    const department = await prisma.department.findUnique({
      where: { id }
    });

    if (!department) {
      return res.status(404).json({
        message: "Department not found"
      });
    }

    // Step 3: Count employees and positions
    const [employeeCount, positionCount] = await Promise.all([
      prisma.employee.count({
        where: { departmentId: id }
      }),
      prisma.position.count({
        where: { departmentId: id }
      })
    ]);

    // Step 4: Prevent deletion if related records exist
    if (employeeCount > 0 || positionCount > 0) {
      return res.status(409).json({
        message:
          `Cannot delete ${department.name}. ` +
          `This department has ${employeeCount} employee(s) ` +
          `and ${positionCount} position(s) assigned.`
      });
    }

    // Step 5: Delete department
    await prisma.department.delete({
      where: { id }
    });

    return res.json({
      message: "Department deleted successfully"
    });

  } catch (error) {
    console.error("Delete department error:", error);

    if (error.code === "P2003") {
      return res.status(409).json({
        message:
          "Cannot delete this department because related records exist."
      });
    }

    if (error.code === "P2025") {
      return res.status(404).json({
        message: "Department not found"
      });
    }

    return res.status(500).json({
      message: "Failed to delete department"
    });
  }
};

// ============================================
// EXPORT CONTROLLERS
// ============================================

module.exports = {
  getDepartments,
  createDepartment,
  updateDepartment,
  deleteDepartment
};
