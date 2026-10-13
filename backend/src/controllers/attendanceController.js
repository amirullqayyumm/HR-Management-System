
const prisma = require("../prisma");

// Return today's date in Malaysia (YYYY-MM-DD)
function getMalaysiaDate() {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kuala_Lumpur",
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  }).format(new Date());
}

// Convert a Malaysia calendar date to a UTC date-only value
function toDateOnly(dateString) {
  return new Date(`${dateString}T00:00:00.000Z`);
}

// CLOCK IN
const clockIn = async (req, res) => {
  try {
    const employeeId = req.authUser.employeeId;
    const now = new Date();
    const date = toDateOnly(getMalaysiaDate());

    const existing = await prisma.attendance.findUnique({
      where: {
        employeeId_date: {
          employeeId,
          date
        }
      }
    });

    if (existing) {
      return res.status(409).json({
        message: "You have already clocked in today."
      });
    }

    const attendance = await prisma.attendance.create({
      data: {
        employeeId,
        date,
        clockIn: now,
        status: "PRESENT"
      }
    });

    return res.status(201).json({
      message: "Clock-in successful!",
      attendance
    });
  } catch (error) {
    // Handles simultaneous clock-in attempts
    if (error.code === "P2002") {
      return res.status(409).json({
        message: "You have already clocked in today."
      });
    }

    console.error("Clock-in error:", error);

    return res.status(500).json({
      message: "Failed to clock in."
    });
  }
};

// CLOCK OUT
const clockOut = async (req, res) => {
  try {
    const employeeId = req.authUser.employeeId;
    const date = toDateOnly(getMalaysiaDate());

    const attendance = await prisma.attendance.findUnique({
      where: {
        employeeId_date: {
          employeeId,
          date
        }
      }
    });

    if (!attendance) {
      return res.status(404).json({
        message: "You must clock in before clocking out."
      });
    }

    if (attendance.clockOut) {
      return res.status(409).json({
        message: "You have already clocked out today."
      });
    }

    const result = await prisma.attendance.updateMany({
      where: {
        id: attendance.id,
        clockOut: null
      },
      data: {
        clockOut: new Date()
      }
    });

    if (result.count === 0) {
      return res.status(409).json({
        message: "You have already clocked out today."
      });
    }

    const updated = await prisma.attendance.findUnique({
      where: { id: attendance.id }
    });

    return res.json({
      message: "Clock-out successful!",
      attendance: updated
    });
  } catch (error) {
    console.error("Clock-out error:", error);

    return res.status(500).json({
      message: "Failed to clock out."
    });
  }
};

// MY ATTENDANCE
const getMyAttendance = async (req, res) => {
  try {
    const employeeId = req.authUser.employeeId;

    const records = await prisma.attendance.findMany({
      where: { employeeId },
      orderBy: [
        { date: "desc" },
        { clockIn: "desc" }
      ]
    });

    return res.json(records);
  } catch (error) {
    console.error("My attendance error:", error);

    return res.status(500).json({
      message: "Failed to retrieve attendance."
    });
  }
};

// ALL ATTENDANCE - HR ADMIN ONLY
const getAllAttendance = async (req, res) => {
  try {
    if (req.authUser.role !== "HR_ADMIN") {
      return res.status(403).json({
        message: "Access denied."
      });
    }

    const records = await prisma.attendance.findMany({
      include: {
        employee: {
          select: {
            id: true,
            employeeNo: true,
            name: true,
            department: {
              select: {
                name: true
              }
            }
          }
        }
      },
      orderBy: [
        { date: "desc" },
        { clockIn: "desc" }
      ]
    });

    return res.json(records);
  } catch (error) {
    console.error("All attendance error:", error);

    return res.status(500).json({
      message: "Failed to retrieve attendance records."
    });
  }
};

module.exports = {
  clockIn,
  clockOut,
  getMyAttendance,
  getAllAttendance
};
