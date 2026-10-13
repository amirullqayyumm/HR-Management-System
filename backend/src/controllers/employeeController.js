
const prisma = require("../prisma");

const { hashPassword } = require("../utils/password");


// Helper: Validate a positive integer ID
const isValidId = (id) => {
  return Number.isInteger(Number(id)) && Number(id) > 0 &&
    id !== null && id !== "";
};

// Helper: Validate department and position
const validateDepartmentPosition = async (departmentId, positionId) => {
  if (!isValidId(departmentId) || !isValidId(positionId)) {
    return "Invalid department or position ID";
  }

  const department = await prisma.department.findUnique({
    where: { id: Number(departmentId) }
  });

  if (!department) {
    return "Department does not exist";
  }

  const position = await prisma.position.findUnique({
    where: { id: Number(positionId) }
  });

  if (!position) {
    return "Position does not exist";
  }

  if (position.departmentId !== Number(departmentId)) {
    return "Position does not belong to the selected department";
  }

  return null;
};

// Helper: Validate reporting manager
const validateManager = async (managerId, employeeId = null) => {
  // No manager selected is allowed
  if (managerId === null || managerId === undefined || managerId === "") {
    return null;
  }

  if (!isValidId(managerId)) {
    return "Invalid reporting manager ID";
  }

  // Employee cannot report to themselves
  if (employeeId !== null && Number(managerId) === employeeId) {
    return "An employee cannot be their own reporting manager";
  }

  const manager = await prisma.employee.findUnique({
    where: { id: Number(managerId) }
  });

  if (!manager) {
    return "Selected reporting manager does not exist";
  }

  if (manager.status !== "ACTIVE") {
    return "Reporting manager must be an active employee";
  }

  return null;
};

// GET - Retrieve all employees with reporting managers
const getEmployees = async (req, res) => {
  try {
    const employees = await prisma.employee.findMany({
      include: {
        department: true,
        position: true,
        manager: {
          select: {
            id: true,
            employeeNo: true,
            name: true,
            email: true
          }
        }
      },
      orderBy: {
        id: "asc"
      }
    });

    res.json(employees);

  } catch (error) {
    console.error("Get employees error:", error);

    res.status(500).json({
      message: "Failed to retrieve employees"
    });
  }
};

// POST - Create a new employee
const createEmployee = async (req, res) => {
  try {
    
const {
    employeeNo,
    name,
    email,
    joinDate,
    departmentId,
    positionId,
    managerId,
    role,
    password
  } = req.body;
  
    // Required fields
    if (
      !employeeNo ||
      !name ||
      !email ||
      !joinDate ||
      !departmentId ||
      !positionId
    ) {
      return res.status(400).json({
        message: "All required employee fields must be completed"
      });
    }


    
    // Validate system role
    if (!["MANAGER", "EMPLOYEE"].includes(role)) {
        return res.status(400).json({
          message: "Please select MANAGER or EMPLOYEE as the system role"
        });
      }
  
      // Validate initial login password
      if (
        typeof password !== "string" ||
        password.length < 12 ||
        Buffer.byteLength(password, "utf8") > 72
      ) {
        return res.status(400).json({
          message: "Password must be at least 12 characters and no more than 72 bytes"
        });
      }

      
    // Validate email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailRegex.test(email)) {
      return res.status(400).json({
        message: "Invalid email format"
      });
    }

    // Validate joining date
    const parsedJoinDate = new Date(joinDate);

    if (Number.isNaN(parsedJoinDate.getTime())) {
      return res.status(400).json({
        message: "Invalid joining date"
      });
    }

    // Validate department and position
    const departmentPositionError =
      await validateDepartmentPosition(departmentId, positionId);

    if (departmentPositionError) {
      return res.status(400).json({
        message: departmentPositionError
      });
    }

    // Validate reporting manager
    const managerError = await validateManager(managerId);

    if (managerError) {
      return res.status(400).json({
        message: managerError
      });
    }

    
    // Hash the new staff member's login password
    const passwordHash = await hashPassword(password);

    // Create employee and login account together
    const employee = await prisma.$transaction(async (tx) => {
      const newEmployee = await tx.employee.create({
        data: {
          employeeNo,
          name,
          email: email.trim().toLowerCase(),
          joinDate: parsedJoinDate,
          departmentId: Number(departmentId),
          positionId: Number(positionId),
          managerId:
            managerId === null ||
            managerId === undefined ||
            managerId === ""
              ? null
              : Number(managerId)
        },
        include: {
          department: true,
          position: true,
          manager: true
        }
      });

      // Create the linked HRMS login account
      await tx.user.create({
        data: {
          email: email.trim().toLowerCase(),
          passwordHash,
          role,
          employeeId: newEmployee.id,
          isActive: true
        }
      });

      return newEmployee;
    });

    return res.status(201).json(employee);


  } catch (error) {
    console.error("Create employee error:", error);

    if (error.code === "P2002") {
      return res.status(409).json({
        message: "Employee number or email already exists"
      });
    }

    if (error.code === "P2003") {
      return res.status(400).json({
        message: "Invalid department, position, or reporting manager"
      });
    }

    res.status(500).json({
      message: "Failed to create employee"
    });
  }
};

// PUT - Update an existing employee
const updateEmployee = async (req, res) => {
  try {
    const id = Number(req.params.id);

    if (!isValidId(req.params.id)) {
      return res.status(400).json({
        message: "Invalid employee ID"
      });
    }

    

    const {
        employeeNo,
        name,
        email,
        joinDate,
        departmentId,
        positionId,
        managerId
      } = req.body;
      
  

    // Check employee exists
    const existingEmployee = await prisma.employee.findUnique({
      where: { id }
    });

    if (!existingEmployee) {
      return res.status(404).json({
        message: "Employee not found"
      });
    }

    // Keep current department/position if not provided
    const finalDepartmentId =
      departmentId !== undefined
        ? Number(departmentId)
        : existingEmployee.departmentId;

    const finalPositionId =
      positionId !== undefined
        ? Number(positionId)
        : existingEmployee.positionId;

    // Validate department and position
    const departmentPositionError =
      await validateDepartmentPosition(
        finalDepartmentId,
        finalPositionId
      );

    if (departmentPositionError) {
      return res.status(400).json({
        message: departmentPositionError
      });
    }

    // Keep current manager if not provided
    const finalManagerId =
      managerId === undefined
        ? existingEmployee.managerId
        : managerId === null || managerId === ""
          ? null
          : managerId;

    // Validate reporting manager
    const managerError = await validateManager(finalManagerId, id);

    if (managerError) {
      return res.status(400).json({
        message: managerError
      });
    }

    // Prevent circular reporting relationships
    if (finalManagerId !== null) {
      const visited = new Set([id]);
      let currentManagerId = Number(finalManagerId);

      while (currentManagerId !== null) {
        if (visited.has(currentManagerId)) {
          return res.status(400).json({
            message: "Circular reporting relationships are not allowed"
          });
        }

        visited.add(currentManagerId);

        const currentManager = await prisma.employee.findUnique({
          where: { id: currentManagerId },
          select: { managerId: true }
        });

        currentManagerId = currentManager?.managerId ?? null;
      }
    }

    // Validate optional joining date
    let parsedJoinDate;

    if (joinDate !== undefined) {
      parsedJoinDate = new Date(joinDate);

      if (Number.isNaN(parsedJoinDate.getTime())) {
        return res.status(400).json({
          message: "Invalid joining date"
        });
      }
    }

    // Validate optional email
    if (email !== undefined) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

      if (!emailRegex.test(email)) {
        return res.status(400).json({
          message: "Invalid email format"
        });
      }
    }

    // Update employee
    const employee = await prisma.employee.update({
      where: { id },
      data: {
        employeeNo,
        name,
        email,
        joinDate: parsedJoinDate,
        departmentId: finalDepartmentId,
        positionId: finalPositionId,
        managerId:
          finalManagerId === null
            ? null
            : Number(finalManagerId)
      },
      include: {
        department: true,
        position: true,
        manager: true
      }
    });

    res.json(employee);

  } catch (error) {
    console.error("Update employee error:", error);

    if (error.code === "P2002") {
      return res.status(409).json({
        message: "Employee number or email already exists"
      });
    }

    if (error.code === "P2003") {
      return res.status(400).json({
        message: "Invalid department, position, or reporting manager"
      });
    }

    if (error.code === "P2025") {
      return res.status(404).json({
        message: "Employee not found"
      });
    }

    res.status(500).json({
      message: "Failed to update employee"
    });
  }
};

// PATCH - Deactivate an employee
const deactivateEmployee = async (req, res) => {
  try {
    const id = Number(req.params.id);

    
    // Prevent the logged-in HR administrator
    // from deactivating their own employee record.
    if (id === req.authUser.employeeId) {
        return res.status(403).json({
            message: "You cannot deactivate your own employee account."
        });
    }


    if (!isValidId(req.params.id)) {
      return res.status(400).json({
        message: "Invalid employee ID"
      });
    }

    const employee = await prisma.employee.update({
      where: { id },
      data: {
        status: "INACTIVE"
      }
    });

    res.json({
      message: "Employee deactivated successfully",
      employee
    });

  } catch (error) {
    console.error("Deactivate employee error:", error);

    if (error.code === "P2025") {
      return res.status(404).json({
        message: "Employee not found"
      });
    }

    res.status(500).json({
      message: "Failed to deactivate employee"
    });
  }
};

// PATCH - Reactivate an employee
const reactivateEmployee = async (req, res) => {
  try {
    const id = Number(req.params.id);

    if (!isValidId(req.params.id)) {
      return res.status(400).json({
        message: "Invalid employee ID"
      });
    }

    const employee = await prisma.employee.update({
      where: { id },
      data: {
        status: "ACTIVE"
      }
    });

    res.json({
      message: "Employee reactivated successfully",
      employee
    });

  } catch (error) {
    console.error("Reactivate employee error:", error);

    if (error.code === "P2025") {
      return res.status(404).json({
        message: "Employee not found"
      });
    }

    res.status(500).json({
      message: "Failed to reactivate employee"
    });
  }
};

module.exports = {
  getEmployees,
  createEmployee,
  updateEmployee,
  deactivateEmployee,
  reactivateEmployee
};
