
const prisma = require("../prisma");

// GET - Retrieve leave balances based on logged-in user
const getLeaveBalances = async (req, res) => {
  try {
    
        const role = req.authUser?.role;
        const employeeId = Number(req.authUser?.employeeId);


    if (!role) {
      return res.status(401).json({
        message: "Authentication required"
      });
    }

    let where = {};

    if (role === "HR_ADMIN") {
      // HR Admin can view all employee leave balances.
      where = {};
    } else if (role === "MANAGER" || role === "EMPLOYEE") {
      // Managers and Employees can view their own balances.
      if (!Number.isInteger(employeeId) || employeeId <= 0) {
        return res.status(403).json({
          message: "No valid employee profile linked to this account"
        });
      }

      where = { employeeId };
    } else {
      return res.status(403).json({
        message: "You do not have permission to view leave balances"
      });
    }

    const balances = await prisma.leaveBalance.findMany({
      where,
      include: {
        employee: {
          select: {
            id: true,
            employeeNo: true,
            name: true,
            status: true
          }
        },
        leaveType: {
          select: {
            id: true,
            code: true,
            name: true
          }
        }
      },
      orderBy: [
        { year: "desc" },
        { employeeId: "asc" },
        { leaveTypeId: "asc" }
      ]
    });

    const result = balances.map((balance) => ({
      ...balance,
      remainingDays:
        balance.entitledDays - balance.usedDays
    }));

    return res.json(result);

  } catch (error) {
    console.error("Get leave balances error:", error);

    return res.status(500).json({
      message: "Failed to retrieve leave balances"
    });
  }
};

// POST - Create or update an employee leave entitlement
// Access restricted to HR_ADMIN by leaveBalanceRoutes.js
const saveLeaveBalance = async (req, res) => {
  try {
    const {
      employeeId,
      leaveTypeId,
      year,
      entitledDays
    } = req.body;

    const employeeIdNumber = Number(employeeId);
    const leaveTypeIdNumber = Number(leaveTypeId);
    const yearNumber = Number(year);
    const entitlementNumber = Number(entitledDays);

    if (
      employeeId == null ||
      employeeId === "" ||
      leaveTypeId == null ||
      leaveTypeId === "" ||
      year == null ||
      year === "" ||
      entitledDays == null ||
      entitledDays === "" ||
      !Number.isInteger(employeeIdNumber) ||
      employeeIdNumber <= 0 ||
      !Number.isInteger(leaveTypeIdNumber) ||
      leaveTypeIdNumber <= 0 ||
      !Number.isInteger(yearNumber) ||
      yearNumber < 2000 ||
      yearNumber > 2100 ||
      !Number.isInteger(entitlementNumber) ||
      entitlementNumber < 0
    ) {
      return res.status(400).json({
        message:
          "Please provide valid employee, leave type, year and entitlement values"
      });
    }

    const employee = await prisma.employee.findUnique({
      where: { id: employeeIdNumber }
    });

    if (!employee) {
      return res.status(404).json({
        message: "Employee not found"
      });
    }

    const leaveType = await prisma.leaveType.findUnique({
      where: { id: leaveTypeIdNumber }
    });

    if (!leaveType) {
      return res.status(404).json({
        message: "Leave type not found"
      });
    }

    const existingBalance = await prisma.leaveBalance.findUnique({
      where: {
        employeeId_leaveTypeId_year: {
          employeeId: employeeIdNumber,
          leaveTypeId: leaveTypeIdNumber,
          year: yearNumber
        }
      }
    });

    if (
      existingBalance &&
      entitlementNumber < existingBalance.usedDays
    ) {
      return res.status(400).json({
        message:
          "Entitlement cannot be less than days already used"
      });
    }

    const balance = await prisma.leaveBalance.upsert({
      where: {
        employeeId_leaveTypeId_year: {
          employeeId: employeeIdNumber,
          leaveTypeId: leaveTypeIdNumber,
          year: yearNumber
        }
      },
      update: {
        entitledDays: entitlementNumber
      },
      create: {
        employeeId: employeeIdNumber,
        leaveTypeId: leaveTypeIdNumber,
        year: yearNumber,
        entitledDays: entitlementNumber,
        usedDays: 0
      },
      include: {
        employee: {
          select: {
            id: true,
            employeeNo: true,
            name: true
          }
        },
        leaveType: {
          select: {
            id: true,
            code: true,
            name: true
          }
        }
      }
    });

    return res.json({
      message: "Leave entitlement saved successfully",
      balance: {
        ...balance,
        remainingDays:
          balance.entitledDays - balance.usedDays
      }
    });

  } catch (error) {
    console.error("Save leave balance error:", error);

    return res.status(500).json({
      message: "Failed to save leave entitlement"
    });
  }
};

module.exports = {
  getLeaveBalances,
  saveLeaveBalance
};
