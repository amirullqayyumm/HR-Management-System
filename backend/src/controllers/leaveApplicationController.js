
const prisma = require("../prisma");

const isPositiveId = (value) =>
  value !== null && value !== undefined && value !== "" &&
  Number.isInteger(Number(value)) && Number(value) > 0;

const parseDate = (value) => {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const date = new Date(`${value}T00:00:00.000Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value
    ? date : null;
};

const fail = (code) => { throw new Error(code); };


const getLeaveApplications = async (req, res) => {
    try {
      const { employeeId, role } = req.authUser;
  
      let where = {};
  
      if (role === "EMPLOYEE") {
        // Employees can view only their own leave applications
        where = {
          employeeId: employeeId
        };
  
      } else if (role === "MANAGER") {
        // Managers can view their own and direct reports' applications
        where = {
          OR: [
            { employeeId: employeeId },
            {
              employee: {
                managerId: employeeId
              }
            }
          ]
        };
  
      } else if (role === "HR_ADMIN") {
        // HR administrators can view all leave applications
        where = {};
  
      } else {
        return res.status(403).json({
          message: "You do not have permission to view leave applications."
        });
      }
  
      const applications = await prisma.leaveApplication.findMany({
        where,
        include: {
          employee: {
            select: {
              id: true,
              employeeNo: true,
              name: true,
              managerId: true
            }
          },
          leaveType: true,
          approver: {
            select: {
              id: true,
              name: true
            }
          }
        },
        orderBy: {
          appliedAt: "desc"
        }
      });
  
      return res.json(applications);
  
    } catch (error) {
      console.error("Get leave applications error:", error);
  
      return res.status(500).json({
        message: "Failed to retrieve leave applications"
      });
    }
  };
  


  const createLeaveApplication = async (req, res) => {
    try {
      const {
        employeeId,
        leaveTypeId,
        startDate,
        endDate,
        reason
      } = req.body;
  
      // SECURITY: Use the logged-in employee's identity.
      const loggedInEmployeeId = req.authUser.employeeId;
  
      // Prevent employees from submitting leave for someone else.
      if (
        employeeId !== undefined &&
        Number(employeeId) !== loggedInEmployeeId
      ) {
        return res.status(403).json({
          message: "You can only submit leave applications for yourself"
        });
      }
  
      if (!isPositiveId(leaveTypeId)) {
        return res.status(400).json({
          message: "Valid leave type is required"
        });
      }
  
      const start = parseDate(startDate);
      const end = parseDate(endDate);
  
      if (!start || !end) {
        return res.status(400).json({
          message: "Dates must be valid YYYY-MM-DD dates"
        });
      }
  
      if (end < start) {
        return res.status(400).json({
          message: "End date cannot be earlier than start date"
        });
      }
  
      if (start.getUTCFullYear() !== end.getUTCFullYear()) {
        return res.status(400).json({
          message: "Cross-year leave is not supported yet"
        });
      }
  
      if (reason != null && typeof reason !== "string") {
        return res.status(400).json({
          message: "Reason must be text"
        });
      }
  
      const employee = await prisma.employee.findUnique({
        where: {
          id: loggedInEmployeeId
        }
      });
  
      if (!employee) {
        return res.status(404).json({
          message: "Employee not found"
        });
      }
  
      if (employee.status !== "ACTIVE") {
        return res.status(400).json({
          message: "Inactive employees cannot apply for leave"
        });
      }
  
      const leaveType = await prisma.leaveType.findUnique({
        where: {
          id: Number(leaveTypeId)
        }
      });
  
      if (!leaveType) {
        return res.status(404).json({
          message: "Leave type not found"
        });
      }
  
      const overlapping = await prisma.leaveApplication.findFirst({
        where: {
          employeeId: loggedInEmployeeId,
          status: {
            in: ["PENDING", "APPROVED"]
          },
          startDate: {
            lte: end
          },
          endDate: {
            gte: start
          }
        },
        select: {
          id: true,
          status: true
        }
      });
  
      if (overlapping) {
        return res.status(409).json({
          message: `Leave application overlaps with existing ${overlapping.status.toLowerCase()} leave (Application #${overlapping.id}).`
        });
      }
  
      const totalDays =
        Math.round(
          (end.getTime() - start.getTime()) / 86400000
        ) + 1;
  
      const application = await prisma.leaveApplication.create({
        data: {
          employeeId: loggedInEmployeeId,
          leaveTypeId: Number(leaveTypeId),
          startDate: start,
          endDate: end,
          totalDays,
          reason: reason?.trim() || null,
          status: "PENDING",
          balanceDeducted: false
        },
        include: {
          employee: true,
          leaveType: true
        }
      });
  
      return res.status(201).json(application);
  
    } catch (error) {
      console.error("Create leave application error:", error);
  
      return res.status(500).json({
        message: "Failed to submit leave application"
      });
    }
  };
  


  const reviewLeaveApplication = async (req, res) => {
    try {
      const id = Number(req.params.id);
      const { approverId, status, remarks } = req.body;
  
      // SECURITY: Identify the approver from the login session.
      const loggedInEmployeeId = req.authUser.employeeId;

      
      // SECURITY: Restrict leave approval to authorized roles.
      if (!["MANAGER", "HR_ADMIN"].includes(req.authUser.role)) {
        return res.status(403).json({
          message: "Only managers or HR administrators can review leave"
        });
      }

  
      // Do not trust an approver ID supplied by the browser.
      if (
        approverId !== undefined &&
        Number(approverId) !== loggedInEmployeeId
      ) {
        return res.status(403).json({
          message: "You cannot review leave as another employee"
        });
      }
  
      if (!isPositiveId(id)) {
        return res.status(400).json({
          message: "Valid application ID is required"
        });
      }
  
      if (!["APPROVED", "REJECTED"].includes(status)) {
        return res.status(400).json({
          message: "Status must be APPROVED or REJECTED"
        });
      }
  
      if (remarks != null && typeof remarks !== "string") {
        return res.status(400).json({
          message: "Remarks must be text"
        });
      }
  
      const application = await prisma.leaveApplication.findUnique({
        where: { id },
        include: { employee: true }
      });
  
      if (!application) {
        return res.status(404).json({
          message: "Leave application not found"
        });
      }
  
      // SECURITY: Only the actual reporting manager can review.
      if (application.employee.managerId !== loggedInEmployeeId) {
        return res.status(403).json({
          message: "Only the reporting manager can review this leave"
        });
      }
  
      // Prevent employees from approving their own leave.
      if (application.employeeId === loggedInEmployeeId) {
        return res.status(403).json({
          message: "You cannot approve your own leave application"
        });
      }
  
      const manager = await prisma.employee.findUnique({
        where: { id: loggedInEmployeeId }
      });
  
      if (!manager || manager.status !== "ACTIVE") {
        return res.status(400).json({
          message: "Approver must be an active employee"
        });
      }
  
      const result = await prisma.$transaction(async (tx) => {
        const current = await tx.leaveApplication.findUnique({
          where: { id }
        });
  
        if (!current || current.status !== "PENDING") {
          fail("ALREADY_REVIEWED");
        }
  
        if (status === "APPROVED") {
          const year = current.startDate.getUTCFullYear();
  
          if (year !== current.endDate.getUTCFullYear()) {
            fail("CROSS_YEAR");
          }
  
          const balance = await tx.leaveBalance.findUnique({
            where: {
              employeeId_leaveTypeId_year: {
                employeeId: current.employeeId,
                leaveTypeId: current.leaveTypeId,
                year
              }
            }
          });
  
          if (!balance) {
            fail("BALANCE_NOT_FOUND");
          }
  
          const deduction = await tx.leaveBalance.updateMany({
            where: {
              id: balance.id,
              usedDays: {
                lte: balance.entitledDays - current.totalDays
              }
            },
            data: {
              usedDays: {
                increment: current.totalDays
              }
            }
          });
  
          if (deduction.count !== 1) {
            fail("INSUFFICIENT_BALANCE");
          }
        }
  
        const updated = await tx.leaveApplication.updateMany({
          where: {
            id,
            status: "PENDING",
            employee: {
              managerId: loggedInEmployeeId
            }
          },
          data: {
            status,
            approverId: loggedInEmployeeId,
            remarks: remarks?.trim() || null,
            reviewedAt: new Date(),
            balanceDeducted: status === "APPROVED"
          }
        });
  
        if (updated.count !== 1) {
          fail("ALREADY_REVIEWED");
        }
  
        return tx.leaveApplication.findUnique({
          where: { id },
          include: {
            employee: true,
            leaveType: true,
            approver: true
          }
        });
  
      }, {
        isolationLevel: "Serializable"
      });
  
      return res.json({
        message: `Leave application ${status.toLowerCase()} successfully`,
        application: result
      });
  
    } catch (error) {
      console.error("Review leave application error:", error);
  
      const known = {
        ALREADY_REVIEWED: [
          409,
          "This leave application has already been reviewed"
        ],
        CROSS_YEAR: [
          400,
          "Cross-year leave approval is not supported yet"
        ],
        BALANCE_NOT_FOUND: [
          400,
          "No leave entitlement found for this employee, leave type and year"
        ],
        INSUFFICIENT_BALANCE: [
          400,
          "Insufficient leave balance to approve this application"
        ],
        P2034: [
          409,
          "Another update occurred. Please refresh and retry"
        ]
      }[error.code || error.message];
  
      if (known) {
        return res.status(known[0]).json({
          message: known[1]
        });
      }
  
      return res.status(500).json({
        message: "Failed to review leave application"
      });
    }
  };
  


  const requestLeaveCancellation = async (req, res) => {
    try {
      const id = Number(req.params.id);
      const { employeeId, reason } = req.body;
  
      // SECURITY: Identify the employee from the login session.
      const loggedInEmployeeId = req.authUser.employeeId;
  
      // Prevent an employee from using someone else's ID.
      if (
        employeeId !== undefined &&
        Number(employeeId) !== loggedInEmployeeId
      ) {
        return res.status(403).json({
          message: "You cannot cancel leave on behalf of another employee"
        });
      }
  
      if (!isPositiveId(id)) {
        return res.status(400).json({
          message: "Valid application ID is required"
        });
      }
  
      if (typeof reason !== "string" || !reason.trim()) {
        return res.status(400).json({
          message: "Cancellation reason is required"
        });
      }
  
      const application = await prisma.leaveApplication.findUnique({
        where: { id }
      });
  
      if (!application) {
        return res.status(404).json({
          message: "Leave application not found"
        });
      }
  
      // SECURITY: Confirm the application belongs to the logged-in employee.
      if (application.employeeId !== loggedInEmployeeId) {
        return res.status(403).json({
          message: "This leave application belongs to another employee"
        });
      }
  
      if (application.cancellationStatus === "PENDING") {
        return res.status(409).json({
          message: "Cancellation is already awaiting manager review"
        });
      }
  
      // Pending leave can be withdrawn immediately.
      if (application.status === "PENDING") {
        const updated = await prisma.leaveApplication.updateMany({
          where: {
            id,
            employeeId: loggedInEmployeeId,
            status: "PENDING"
          },
          data: {
            status: "CANCELLED",
            cancellationStatus: "APPROVED",
            cancellationReason: reason.trim(),
            cancellationRequestedAt: new Date(),
            cancellationReviewedAt: new Date(),
            balanceDeducted: false
          }
        });
  
        if (updated.count !== 1) {
          return res.status(409).json({
            message: "Application changed. Please refresh"
          });
        }
  
        return res.json({
          message: "Pending leave withdrawn successfully"
        });
      }
  
      if (application.status !== "APPROVED") {
        return res.status(409).json({
          message: "Only pending or approved leave can be cancelled"
        });
      }
  
      // Preserve the historical leave balance safeguard.
      // Do not automatically reconcile old leave records.
      if (!application.balanceDeducted) {
        return res.status(409).json({
          message: "This historical approval has no verified deduction. Ask HR to reconcile it before cancellation"
        });
      }
  
      // Approved leave requires manager cancellation approval.
      const updated = await prisma.leaveApplication.updateMany({
        where: {
          id,
          employeeId: loggedInEmployeeId,
          status: "APPROVED",
          cancellationStatus: {
            in: ["NONE", "REJECTED"]
          },
          balanceDeducted: true
        },
        data: {
          cancellationStatus: "PENDING",
          cancellationReason: reason.trim(),
          cancellationRequestedAt: new Date(),
          cancellationReviewedAt: null,
          cancellationRemarks: null
        }
      });
  
      if (updated.count !== 1) {
        return res.status(409).json({
          message: "Application changed. Please refresh"
        });
      }
  
      return res.json({
        message: "Cancellation request submitted for manager approval"
      });
  
    } catch (error) {
      console.error("Request leave cancellation error:", error);
  
      return res.status(500).json({
        message: "Failed to request leave cancellation"
      });
    }
  };
  


  const reviewLeaveCancellation = async (req, res) => {
    try {
      const id = Number(req.params.id);
      const { approverId, status, remarks } = req.body;
  
      // SECURITY: Identify the reviewer from the login session.
      const loggedInEmployeeId = req.authUser.employeeId;
  
      // Never trust a different approver ID sent by the browser.
      if (
        approverId !== undefined &&
        Number(approverId) !== loggedInEmployeeId
      ) {
        return res.status(403).json({
          message: "You cannot review cancellation as another employee"
        });
      }
  
      if (!isPositiveId(id)) {
        return res.status(400).json({
          message: "Valid application ID is required"
        });
      }
  
      if (!["APPROVED", "REJECTED"].includes(status)) {
        return res.status(400).json({
          message: "Cancellation decision must be APPROVED or REJECTED"
        });
      }
  
      if (remarks != null && typeof remarks !== "string") {
        return res.status(400).json({
          message: "Remarks must be text"
        });
      }
  
      const application = await prisma.leaveApplication.findUnique({
        where: { id },
        include: { employee: true }
      });
  
      if (!application) {
        return res.status(404).json({
          message: "Leave application not found"
        });
      }
  
      // SECURITY: Only the actual reporting manager can review.
      if (application.employee.managerId !== loggedInEmployeeId) {
        return res.status(403).json({
          message: "Only the reporting manager can review cancellation"
        });
      }
  
      // Prevent employees from reviewing their own cancellations.
      if (application.employeeId === loggedInEmployeeId) {
        return res.status(403).json({
          message: "You cannot review your own leave cancellation"
        });
      }
  
      const manager = await prisma.employee.findUnique({
        where: { id: loggedInEmployeeId }
      });
  
      if (!manager || manager.status !== "ACTIVE") {
        return res.status(400).json({
          message: "Manager must be an active employee"
        });
      }
  
      const result = await prisma.$transaction(async (tx) => {
        const current = await tx.leaveApplication.findUnique({
          where: { id },
          include: {
            employee: {
              select: {
                managerId: true
              }
            }
          }
        });
  
        // Recheck the reporting relationship inside the transaction.
        if (
          !current ||
          current.employee.managerId !== loggedInEmployeeId ||
          current.employeeId === loggedInEmployeeId
        ) {
          fail("NOT_AUTHORIZED");
        }
  
        if (
          current.status !== "APPROVED" ||
          current.cancellationStatus !== "PENDING"
        ) {
          fail("INVALID_CANCELLATION");
        }
  
        if (status === "APPROVED") {
          // Preserve historical balance protection.
          if (!current.balanceDeducted) {
            fail("BALANCE_NOT_DEDUCTED");
          }
  
          const year = current.startDate.getUTCFullYear();
  
          if (year !== current.endDate.getUTCFullYear()) {
            fail("CROSS_YEAR");
          }
  
          const balance = await tx.leaveBalance.findUnique({
            where: {
              employeeId_leaveTypeId_year: {
                employeeId: current.employeeId,
                leaveTypeId: current.leaveTypeId,
                year
              }
            }
          });
  
          if (!balance) {
            fail("BALANCE_NOT_FOUND");
          }
  
          const restoration = await tx.leaveBalance.updateMany({
            where: {
              id: balance.id,
              usedDays: {
                gte: current.totalDays
              }
            },
            data: {
              usedDays: {
                decrement: current.totalDays
              }
            }
          });
  
          if (restoration.count !== 1) {
            fail("INSUFFICIENT_USED_DAYS");
          }
        }
  
        const updated = await tx.leaveApplication.updateMany({
          where: {
            id,
            status: "APPROVED",
            cancellationStatus: "PENDING",
            employee: {
              managerId: loggedInEmployeeId
            },
            ...(status === "APPROVED"
              ? { balanceDeducted: true }
              : {})
          },
          data: {
            status: status === "APPROVED"
              ? "CANCELLED"
              : "APPROVED",
            cancellationStatus: status,
            cancellationReviewedAt: new Date(),
            cancellationRemarks: remarks?.trim() || null,
            balanceDeducted: status === "APPROVED"
              ? false
              : current.balanceDeducted
          }
        });
  
        if (updated.count !== 1) {
          fail("INVALID_CANCELLATION");
        }
  
        return tx.leaveApplication.findUnique({
          where: { id },
          include: {
            employee: true,
            leaveType: true
          }
        });
  
      }, {
        isolationLevel: "Serializable"
      });
  
      return res.json({
        message: `Cancellation ${status.toLowerCase()} successfully`,
        application: result
      });
  
    } catch (error) {
      console.error("Review cancellation error:", error);
  
      const known = {
        NOT_AUTHORIZED: [
          403,
          "Only the reporting manager can review cancellation"
        ],
        INVALID_CANCELLATION: [
          409,
          "Cancellation request already reviewed or changed"
        ],
        BALANCE_NOT_DEDUCTED: [
          409,
          "Cannot restore leave: no recorded deduction for this application"
        ],
        CROSS_YEAR: [
          400,
          "Cross-year cancellation is not supported yet"
        ],
        BALANCE_NOT_FOUND: [
          400,
          "Leave balance record not found"
        ],
        INSUFFICIENT_USED_DAYS: [
          409,
          "Cannot restore leave: insufficient recorded used days"
        ],
        P2034: [
          409,
          "Another update occurred. Please refresh and retry"
        ]
      }[error.code || error.message];
  
      if (known) {
        return res.status(known[0]).json({
          message: known[1]
        });
      }
  
      return res.status(500).json({
        message: "Failed to review cancellation"
      });
    }
  };
  

module.exports = {
  getLeaveApplications,
  createLeaveApplication,
  reviewLeaveApplication,
  requestLeaveCancellation,
  reviewLeaveCancellation
};
