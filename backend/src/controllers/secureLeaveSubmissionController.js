
const prisma = require("../prisma");
const calculateWorkingDays = require("../utils/calculateWorkingDays");

const createError = (status, message) => {
  const error = new Error(message);
  error.status = status;
  return error;
};

const parseDate = (value) => {
  if (
    typeof value !== "string" ||
    !/^\d{4}-\d{2}-\d{2}$/.test(value)
  ) {
    return null;
  }

  const date = new Date(`${value}T00:00:00.000Z`);

  if (
    Number.isNaN(date.getTime()) ||
    date.toISOString().slice(0, 10) !== value
  ) {
    return null;
  }

  return date;
};

// Securely submit leave for the logged-in employee.
const submitLeaveApplication = async (req, res) => {
  try {
    const loggedInEmployeeId = req.authUser.employeeId;

    const {
      employeeId,
      leaveTypeId,
      startDate,
      endDate,
      reason,
    } = req.body;

    // Employees can only submit leave for themselves.
    if (
      employeeId !== undefined &&
      Number(employeeId) !== loggedInEmployeeId
    ) {
      return res.status(403).json({
        message:
          "You can only submit leave applications for yourself.",
      });
    }

    const leaveTypeIdNumber = Number(leaveTypeId);

    if (
      leaveTypeId === null ||
      leaveTypeId === undefined ||
      leaveTypeId === "" ||
      !Number.isInteger(leaveTypeIdNumber) ||
      leaveTypeIdNumber <= 0
    ) {
      return res.status(400).json({
        message: "Please select a valid leave type.",
      });
    }

    const start = parseDate(startDate);
    const end = parseDate(endDate);

    if (!start || !end) {
      return res.status(400).json({
        message: "Please provide valid leave dates.",
      });
    }

    if (end < start) {
      return res.status(400).json({
        message:
          "End date cannot be earlier than start date.",
      });
    }

    const year = start.getUTCFullYear();

    if (year !== end.getUTCFullYear()) {
      return res.status(400).json({
        message:
          "Leave applications across two calendar years are not supported yet.",
      });
    }

    if (reason != null && typeof reason !== "string") {
      return res.status(400).json({
        message: "Reason must be text.",
      });
    }

    // NEW: Count Monday-Friday only.
    // Saturday and Sunday are excluded.
    const totalDays = calculateWorkingDays(start, end);

    if (totalDays <= 0) {
      return res.status(400).json({
        message:
          "Please select dates containing at least one working day (Monday to Friday).",
      });
    }

    const application = await prisma.$transaction(
      async (tx) => {
        const employee = await tx.employee.findUnique({
          where: { id: loggedInEmployeeId },
        });

        if (!employee || employee.status !== "ACTIVE") {
          throw createError(
            403,
            "Only active employees can apply for leave."
          );
        }

        const leaveType = await tx.leaveType.findUnique({
          where: { id: leaveTypeIdNumber },
        });

        if (!leaveType) {
          throw createError(
            404,
            "The selected leave type does not exist."
          );
        }

        // Verify HR assigned this leave entitlement.
        const balance = await tx.leaveBalance.findUnique({
          where: {
            employeeId_leaveTypeId_year: {
              employeeId: loggedInEmployeeId,
              leaveTypeId: leaveTypeIdNumber,
              year,
            },
          },
        });

        if (!balance) {
          throw createError(
            400,
            "HR has not assigned this leave type to you for the selected year."
          );
        }

        // Approved leave is already included in usedDays.
        const remainingDays =
          balance.entitledDays - balance.usedDays;

        // Reserve days requested in pending applications.
        const pendingApplications =
          await tx.leaveApplication.aggregate({
            where: {
              employeeId: loggedInEmployeeId,
              leaveTypeId: leaveTypeIdNumber,
              status: "PENDING",
              startDate: {
                gte: new Date(
                  `${year}-01-01T00:00:00.000Z`
                ),
                lt: new Date(
                  `${year + 1}-01-01T00:00:00.000Z`
                ),
              },
            },
            _sum: {
              totalDays: true,
            },
          });

        const pendingDays =
          pendingApplications._sum.totalDays || 0;

        const availableDays = Math.max(
          0,
          remainingDays - pendingDays
        );

        if (totalDays > availableDays) {
          throw createError(
            400,
            `Insufficient leave balance. You have ${availableDays} working days available after existing pending applications.`
          );
        }

        // Prevent overlapping leave applications.
        const overlapping =
          await tx.leaveApplication.findFirst({
            where: {
              employeeId: loggedInEmployeeId,
              status: {
                in: ["PENDING", "APPROVED"],
              },
              startDate: {
                lte: end,
              },
              endDate: {
                gte: start,
              },
            },
            select: {
              id: true,
            },
          });

        if (overlapping) {
          throw createError(
            409,
            `These dates overlap with existing leave application #${overlapping.id}.`
          );
        }

        // Save leave using working days.
        return tx.leaveApplication.create({
          data: {
            employeeId: loggedInEmployeeId,
            leaveTypeId: leaveTypeIdNumber,
            startDate: start,
            endDate: end,
            totalDays,
            reason: reason?.trim() || null,
            status: "PENDING",
            balanceDeducted: false,
          },
          include: {
            employee: true,
            leaveType: true,
          },
        });
      },
      {
        isolationLevel: "Serializable",
      }
    );

    return res.status(201).json(application);
  } catch (error) {
    console.error("Secure leave submission error:", error);

    if (error.status) {
      return res.status(error.status).json({
        message: error.message,
      });
    }

    if (error.code === "P2034") {
      return res.status(409).json({
        message:
          "Another leave application was submitted at the same time. Please retry.",
      });
    }

    return res.status(500).json({
      message: "Failed to submit leave application.",
    });
  }
};

module.exports = {
  submitLeaveApplication,
};
